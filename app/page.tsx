'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import HeaderBar from '@/components/HeaderBar';
import TimelineControls from '@/components/TimelineControls';
import StatsPanel from '@/components/StatsPanel';
import TokenModal from '@/components/TokenModal';
import { fetchRepoCommits, fetchRepoMetadata } from '@/lib/github';
import { DEMO_REPOS } from '@/lib/mockData';
import { buildTimelineFrames } from '@/lib/timeline';
import { computeCityLayout, BuildingLayout } from '@/lib/treemap';
import { TimelineFrame, RepoMetadata } from '@/lib/types';
import { AlertCircle, Key, Sparkles, Loader2 } from 'lucide-react';

// Dynamic import for Three.js Canvas to prevent SSR issues
const CityCanvas = dynamic(() => import('@/components/CityCanvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-400 gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
      <span className="text-sm font-mono">3D Şehir İnşa Ediliyor...</span>
    </div>
  ),
});

export default function HomePage() {
  const [currentRepoSlug, setCurrentRepoSlug] = useState('vercel/swr');
  const [repoMetadata, setRepoMetadata] = useState<RepoMetadata | null>(
    DEMO_REPOS['vercel/swr'].metadata
  );
  const [frames, setFrames] = useState<TimelineFrame[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);

  const [selectedBuilding, setSelectedBuilding] = useState<BuildingLayout | null>(null);
  const [hoveredBuilding, setHoveredBuilding] = useState<BuildingLayout | null>(null);
  const [cameraPreset, setCameraPreset] = useState<'iso' | 'top' | 'front'>('iso');

  // Load repo commits & timeline
  const loadRepo = async (slug: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    setIsRateLimited(false);
    setSelectedBuilding(null);
    setHoveredBuilding(null);

    try {
      const [owner, repo] = slug.split('/');
      if (!owner || !repo) {
        throw new Error('Geçerli format: owner/repo (örn: vercel/swr)');
      }

      // Check demo first for instant response
      const lower = slug.toLowerCase();
      if (DEMO_REPOS[lower]) {
        const demo = DEMO_REPOS[lower];
        setRepoMetadata(demo.metadata);
        const builtFrames = buildTimelineFrames(demo.commits);
        setFrames(builtFrames);
        setCurrentFrameIndex(builtFrames.length - 1);
        setCurrentRepoSlug(slug);
        setIsLoading(false);
        return;
      }

      // Fetch from GitHub
      const meta = await fetchRepoMetadata(owner, repo);
      setRepoMetadata(meta);

      const commits = await fetchRepoCommits(owner, repo, 30);
      if (commits.length === 0) {
        throw new Error('Depoda hiç commit bulunamadı.');
      }

      const builtFrames = buildTimelineFrames(commits);
      setFrames(builtFrames);
      setCurrentFrameIndex(builtFrames.length - 1);
      setCurrentRepoSlug(slug);
    } catch (err: any) {
      if (err.message === 'RATE_LIMIT') {
        setIsRateLimited(true);
      } else {
        setErrorMessage(err.message || 'Repo yüklenirken beklenmedik bir hata oluştu.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadRepo(currentRepoSlug);
  }, []);

  // Compute 3D City Layout for the active frame
  const currentFrame = frames[currentFrameIndex];
  const cityLayout = useMemo(() => {
    if (!currentFrame) return { buildings: [], districts: [], totalFiles: 0, totalLines: 0 };
    const fileItems = Array.from(currentFrame.files.values()).map((f) => ({
      path: f.path,
      lines: f.lines,
      status: f.status,
    }));
    return computeCityLayout(fileItems, 65);
  }, [currentFrame]);

  return (
    <main className="w-screen h-screen relative bg-slate-950 overflow-hidden font-sans select-none">
      {/* 3D WebGL Canvas Layer */}
      <div className="w-full h-full absolute inset-0">
        <CityCanvas
          buildings={cityLayout.buildings}
          districts={cityLayout.districts}
          selectedBuilding={selectedBuilding}
          hoveredBuilding={hoveredBuilding}
          onSelectBuilding={setSelectedBuilding}
          onHoverBuilding={setHoveredBuilding}
          cameraPreset={cameraPreset}
        />
      </div>

      {/* Top Header Overlay */}
      <HeaderBar
        currentRepo={currentRepoSlug}
        repoMetadata={repoMetadata}
        onSearch={(query) => loadRepo(query)}
        isLoading={isLoading}
        onOpenTokenModal={() => setIsTokenModalOpen(true)}
      />

      {/* Floating Hover Badge on Top Center */}
      {hoveredBuilding && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 px-3.5 py-1.5 rounded-full shadow-xl flex items-center gap-2 text-xs">
            <div
              className="w-2.5 h-2.5 rounded-full shadow-sm"
              style={{ backgroundColor: hoveredBuilding.color }}
            />
            <span className="font-semibold text-white">{hoveredBuilding.name}</span>
            <span className="text-slate-400 font-mono text-[11px] border-l border-slate-700 pl-2">
              {hoveredBuilding.lines} LOC
            </span>
            <span className="text-sky-400 font-medium text-[11px]">
              {hoveredBuilding.language}
            </span>
          </div>
        </div>
      )}

      {/* Rate Limit / Error Modal Banner */}
      {isRateLimited && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl p-6 max-w-md w-full space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">GitHub API Limitine Ulaşıldı</h3>
              <p className="text-xs text-slate-300 mt-1.5">
                Anonim GitHub API limiti (60 istek/saat) doldu. Ücretsiz Personal Access Token
                girerek 5,000 istek/saat ile devam edebilir veya hazır demo verisini inceleyebilirsiniz.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
              <button
                onClick={() => {
                  setIsRateLimited(false);
                  loadRepo('vercel/swr');
                }}
                className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Demo (swr) Aç</span>
              </button>
              <button
                onClick={() => {
                  setIsRateLimited(false);
                  setIsTokenModalOpen(true);
                }}
                className="w-full sm:w-auto px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-sky-500/20"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Token Gir</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generic Error Notification */}
      {errorMessage && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-rose-950/90 border border-rose-500/40 text-rose-200 px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-2xl backdrop-blur-md">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="ml-2 underline text-white font-medium hover:text-rose-100"
          >
            Kapat
          </button>
        </div>
      )}

      {/* Right Stats Panel */}
      {currentFrame && (
        <StatsPanel
          currentFrame={currentFrame}
          selectedBuilding={selectedBuilding}
          onCloseSelected={() => setSelectedBuilding(null)}
          onSelectCameraPreset={setCameraPreset}
        />
      )}

      {/* Bottom Timeline Scrubber and Commit Player */}
      {frames.length > 0 && (
        <TimelineControls
          frames={frames}
          currentFrameIndex={currentFrameIndex}
          onFrameChange={setCurrentFrameIndex}
        />
      )}

      {/* PAT Token Settings Modal */}
      <TokenModal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
        onTokenChanged={() => {
          loadRepo(currentRepoSlug);
        }}
      />
    </main>
  );
}
