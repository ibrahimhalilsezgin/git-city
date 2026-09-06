'use client';

import { useState } from 'react';
import { Files, Code2, Layers, Eye, X, ChevronRight } from 'lucide-react';
import { BuildingLayout } from '@/lib/treemap';
import { TimelineFrame } from '@/lib/types';
import { getLanguageForFile } from '@/lib/languages';

interface StatsPanelProps {
  currentFrame: TimelineFrame;
  selectedBuilding: BuildingLayout | null;
  onCloseSelected: () => void;
  onSelectCameraPreset: (preset: 'iso' | 'top' | 'front') => void;
}

export default function StatsPanel({
  currentFrame,
  selectedBuilding,
  onCloseSelected,
  onSelectCameraPreset,
}: StatsPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Compute language distribution
  const langCount: Record<string, { count: number; lines: number; color: string }> = {};
  let totalLines = 0;

  for (const [, file] of currentFrame.files.entries()) {
    const lang = getLanguageForFile(file.path);
    totalLines += file.lines;
    if (!langCount[lang.name]) {
      langCount[lang.name] = { count: 0, lines: 0, color: lang.color };
    }
    langCount[lang.name].count++;
    langCount[lang.name].lines += file.lines;
  }

  const topLanguages = Object.entries(langCount)
    .sort((a, b) => b[1].lines - a[1].lines)
    .slice(0, 5);

  return (
    <div className="absolute top-20 right-4 z-40 flex flex-col gap-3 pointer-events-none max-w-xs w-full">
      {/* Selected Building Details Drawer/Card */}
      {selectedBuilding && (
        <div className="bg-slate-900/90 backdrop-blur-md border border-sky-500/40 rounded-2xl shadow-2xl p-4 pointer-events-auto flex flex-col gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                style={{ backgroundColor: selectedBuilding.color }}
              />
              <span className="font-semibold text-white text-xs truncate">
                {selectedBuilding.name}
              </span>
            </div>
            <button
              onClick={onCloseSelected}
              className="text-slate-400 hover:text-white p-0.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5 text-xs text-slate-300 font-mono">
            <div className="text-[11px] text-slate-400 break-all bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
              {selectedBuilding.path}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <span className="text-[10px] text-slate-400 block font-sans">Dil</span>
                <span className="font-medium text-white">{selectedBuilding.language}</span>
              </div>
              <div className="p-2 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <span className="text-[10px] text-slate-400 block font-sans">Satır (LOC)</span>
                <span className="font-medium text-white">{selectedBuilding.lines}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Stats Card */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl shadow-xl p-4 pointer-events-auto flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <Layers className="w-4 h-4 text-sky-400" />
            <span>Şehir İstatistikleri</span>
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-slate-400 hover:text-white text-xs p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <ChevronRight
              className={`w-3.5 h-3.5 transition-transform ${isCollapsed ? 'rotate-90' : '-rotate-90'}`}
            />
          </button>
        </div>

        {!isCollapsed && (
          <>
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <Files className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-400">Dosyalar</div>
                  <div className="font-bold text-white font-mono">{currentFrame.totalFiles}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <Code2 className="w-4 h-4 text-sky-400 shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-400">Satırlar</div>
                  <div className="font-bold text-white font-mono">{totalLines.toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Language Distribution Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span>Diller</span>
                <span>{topLanguages.length} Çeşit</span>
              </div>

              {/* Progress bar */}
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                {topLanguages.map(([name, data]) => {
                  const pct = totalLines > 0 ? (data.lines / totalLines) * 100 : 0;
                  return (
                    <div
                      key={name}
                      style={{ width: `${pct}%`, backgroundColor: data.color }}
                      title={`${name}: %${pct.toFixed(1)}`}
                      className="h-full transition-all"
                    />
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
                {topLanguages.map(([name, data]) => (
                  <div key={name} className="flex items-center gap-1 text-[10px] text-slate-300">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }} />
                    <span>{name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Camera Presets */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                Kamera:
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onSelectCameraPreset('iso')}
                  className="px-2 py-1 text-[10px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                >
                  İzo
                </button>
                <button
                  onClick={() => onSelectCameraPreset('top')}
                  className="px-2 py-1 text-[10px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                >
                  Kuşbakışı
                </button>
                <button
                  onClick={() => onSelectCameraPreset('front')}
                  className="px-2 py-1 text-[10px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                >
                  Ön
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
