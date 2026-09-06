'use client';

import { useState } from 'react';
import { Search, Building2, Key, Loader2, Sparkles, Star, GitFork } from 'lucide-react';
import { getStoredToken } from '@/lib/github';
import { RepoMetadata } from '@/lib/types';

interface HeaderBarProps {
  currentRepo: string;
  repoMetadata?: RepoMetadata | null;
  onSearch: (repoQuery: string) => void;
  isLoading: boolean;
  onOpenTokenModal: () => void;
}

export default function HeaderBar({
  currentRepo,
  repoMetadata,
  onSearch,
  isLoading,
  onOpenTokenModal,
}: HeaderBarProps) {
  const [query, setQuery] = useState(currentRepo);
  const hasToken = typeof window !== 'undefined' && Boolean(getStoredToken());

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    onSearch(query.trim());
  };

  const handleDemoClick = (repoSlug: string) => {
    setQuery(repoSlug);
    onSearch(repoSlug);
  };

  return (
    <header className="absolute top-4 left-4 right-4 z-40 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
      {/* Brand Logo & Title */}
      <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md border border-slate-800/80 px-4 py-2.5 rounded-2xl shadow-xl pointer-events-auto">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center text-slate-950 shadow-md shadow-sky-500/20">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-sm font-bold tracking-tight text-white">Git City</h1>
            <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20">
              3D Visualizer
            </span>
          </div>
          {repoMetadata ? (
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
              <span className="flex items-center gap-0.5 text-amber-400">
                <Star className="w-3 h-3 fill-current" />
                {repoMetadata.stars.toLocaleString()}
              </span>
              <span className="flex items-center gap-0.5 text-slate-400">
                <GitFork className="w-3 h-3" />
                {repoMetadata.forks.toLocaleString()}
              </span>
              <span className="text-slate-500">({repoMetadata.language})</span>
            </div>
          ) : (
            <p className="text-[11px] text-slate-400">Codebase &amp; Commit Timeline</p>
          )}
        </div>
      </div>

      {/* Repo Search & Quick Demo Chips */}
      <div className="flex items-center gap-2 pointer-events-auto">
        <form
          onSubmit={handleSubmit}
          className="flex items-center bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl shadow-xl p-1 focus-within:border-sky-500/80 transition-colors"
        >
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="owner/repo (örn: vercel/swr)"
              className="w-48 sm:w-64 bg-transparent pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 disabled:bg-slate-800 text-slate-950 disabled:text-slate-500 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Keşfet'}
          </button>
        </form>

        {/* Demo Fast Chips */}
        <div className="hidden md:flex items-center gap-1 bg-slate-900/80 backdrop-blur-md border border-slate-800/80 p-1 rounded-2xl shadow-xl">
          <span className="text-[11px] text-slate-500 px-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Demo:
          </span>
          <button
            onClick={() => handleDemoClick('vercel/swr')}
            className="px-2.5 py-1 text-[11px] font-mono text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            swr
          </button>
          <button
            onClick={() => handleDemoClick('expressjs/express')}
            className="px-2.5 py-1 text-[11px] font-mono text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            express
          </button>
        </div>

        {/* Token Modal Trigger */}
        <button
          onClick={onOpenTokenModal}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl border text-xs font-medium backdrop-blur-md shadow-xl transition-colors ${
            hasToken
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
              : 'bg-slate-900/80 border-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="GitHub Access Token Ayarla"
        >
          <Key className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{hasToken ? 'PAT Aktif' : 'Token'}</span>
        </button>
      </div>
    </header>
  );
}
