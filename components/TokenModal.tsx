'use client';

import { useState, useEffect } from 'react';
import { KeyRound, X, Check, Trash2, ShieldAlert } from 'lucide-react';
import { getStoredToken, setStoredToken } from '@/lib/github';

interface TokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTokenChanged: () => void;
}

export default function TokenModal({ isOpen, onClose, onTokenChanged }: TokenModalProps) {
  const [token, setToken] = useState('');
  const [hasToken, setHasToken] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredToken();
      if (stored) {
        setToken(stored);
        setHasToken(true);
      } else {
        setToken('');
        setHasToken(false);
      }
      setSaved(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    setStoredToken(token);
    setSaved(true);
    setHasToken(Boolean(token.trim()));
    onTokenChanged();
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleClear = () => {
    setStoredToken('');
    setToken('');
    setHasToken(false);
    onTokenChanged();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-white font-semibold">
            <KeyRound className="w-5 h-5 text-sky-400" />
            <span>GitHub Personal Access Token</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-4 space-y-3 text-sm text-slate-300">
          <p>
            GitHub anonim istekleri saatte 60 çağrı ile sınırlandırır. Kendi kişisel token&#39;ınızı
            ekleyerek limiti saatte 5,000 isteğe çıkarabilir veya özel depolarınızı görselleştirebilirsiniz.
          </p>

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5 text-xs text-amber-200">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              Token yalnızca tarayıcınızın yerel hafızasında (localStorage) saklanır, hiçbir harici sunucuya iletilmez.
            </span>
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-medium text-slate-400">Personal Access Token (PAT):</label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono text-sm"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          {hasToken ? (
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 px-3 py-2 text-rose-400 hover:bg-rose-500/10 rounded-xl text-xs font-medium transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Token&#39;ı Kaldır</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white text-xs font-medium transition-colors"
            >
              Vazgeç
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold rounded-xl text-xs transition-colors shadow-lg shadow-sky-500/20"
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Kaydedildi</span>
                </>
              ) : (
                <span>Kaydet</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
