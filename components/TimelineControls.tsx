'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, GitCommit, User, Calendar, Plus, RefreshCw, Minus } from 'lucide-react';
import { TimelineFrame } from '@/lib/types';

interface TimelineControlsProps {
  frames: TimelineFrame[];
  currentFrameIndex: number;
  onFrameChange: (index: number) => void;
}

export default function TimelineControls({
  frames,
  currentFrameIndex,
  onFrameChange,
}: TimelineControlsProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 1x
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);

  const totalFrames = frames.length;
  const currentFrame = frames[currentFrameIndex] || frames[0];

  const currentFrameIndexRef = useRef(currentFrameIndex);
  currentFrameIndexRef.current = currentFrameIndex;

  // Auto playback loop
  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.max(400, 1500 / playbackSpeed);
      playTimerRef.current = setInterval(() => {
        const next = currentFrameIndexRef.current + 1;
        if (next >= totalFrames) {
          setIsPlaying(false);
        } else {
          onFrameChange(next);
        }
      }, intervalMs);
    } else {
      if (playTimerRef.current) {
        clearInterval(playTimerRef.current);
      }
    }

    return () => {
      if (playTimerRef.current) {
        clearInterval(playTimerRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, totalFrames, onFrameChange]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        onFrameChange(Math.min(totalFrames - 1, currentFrameIndex + 1));
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        onFrameChange(Math.max(0, currentFrameIndex - 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentFrameIndex, totalFrames, onFrameChange]);

  if (!currentFrame) return null;

  const cycleSpeed = () => {
    const speeds = [0.5, 1, 2, 4];
    const nextIndex = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIndex]);
  };

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="absolute bottom-4 left-4 right-4 z-40 flex flex-col items-center pointer-events-none">
      <div className="w-full max-w-4xl bg-slate-900/90 backdrop-blur-md border border-slate-800/90 rounded-2xl shadow-2xl p-4 pointer-events-auto flex flex-col gap-3">
        {/* Top details: Active commit information */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {currentFrame.commit.author.avatarUrl ? (
              <img
                src={currentFrame.commit.author.avatarUrl}
                alt={currentFrame.commit.author.name}
                className="w-6 h-6 rounded-full border border-slate-700 shrink-0"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
            <span className="font-semibold text-white truncate max-w-[140px]">
              {currentFrame.commit.author.name}
            </span>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-sky-400 font-mono text-[11px] shrink-0">
              <GitCommit className="w-3 h-3" />
              <span>#{currentFrame.commit.shortSha}</span>
            </div>
            <span className="text-slate-300 truncate max-w-xs md:max-w-md font-medium" title={currentFrame.commit.message}>
              {currentFrame.commit.message}
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0 text-slate-400">
            {/* Diff badges */}
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <span className="flex items-center gap-0.5 text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                <Plus className="w-2.5 h-2.5" />
                {currentFrame.stats.added}
              </span>
              <span className="flex items-center gap-0.5 text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                <RefreshCw className="w-2.5 h-2.5" />
                {currentFrame.stats.modified}
              </span>
              <span className="flex items-center gap-0.5 text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                <Minus className="w-2.5 h-2.5" />
                {currentFrame.stats.deleted}
              </span>
            </div>

            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(currentFrame.commit.date)}</span>
            </div>
          </div>
        </div>

        {/* Timeline Slider and Play Controls */}
        <div className="flex items-center gap-4">
          {/* Controls button group */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onFrameChange(Math.max(0, currentFrameIndex - 1))}
              disabled={currentFrameIndex === 0}
              className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-xl transition-colors"
              title="Önceki Commit (Sol Ok)"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsPlaying((p) => !p)}
              className={`p-2.5 rounded-xl font-semibold transition-all shadow-md ${
                isPlaying
                  ? 'bg-amber-500 text-slate-950 shadow-amber-500/20'
                  : 'bg-sky-500 text-slate-950 hover:bg-sky-400 shadow-sky-500/20'
              }`}
              title={isPlaying ? 'Duraklat (Space)' : 'Oynat (Space)'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            </button>

            <button
              onClick={() => onFrameChange(Math.min(totalFrames - 1, currentFrameIndex + 1))}
              disabled={currentFrameIndex === totalFrames - 1}
              className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-xl transition-colors"
              title="Sonraki Commit (Sağ Ok)"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={cycleSpeed}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-mono font-medium transition-colors"
              title="Oynatma Hızı"
            >
              {playbackSpeed}x
            </button>
          </div>

          {/* Time Scrubber Slider */}
          <div className="flex-1 flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>İlk Commit</span>
              <span className="text-white font-medium">
                {currentFrameIndex + 1} / {totalFrames} Commit
              </span>
              <span>Güncel</span>
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(0, totalFrames - 1)}
              value={currentFrameIndex}
              onChange={(e) => {
                setIsPlaying(false);
                onFrameChange(Number(e.target.value));
              }}
              className="w-full accent-sky-500 h-2 bg-slate-800 rounded-lg cursor-pointer transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
