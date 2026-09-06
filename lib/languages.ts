export interface LanguageInfo {
  name: string;
  color: string;
  category: 'code' | 'markup' | 'data' | 'config' | 'style' | 'asset';
}

export const LANGUAGE_COLORS: Record<string, LanguageInfo> = {
  ts: { name: 'TypeScript', color: '#3b82f6', category: 'code' }, // blue
  tsx: { name: 'React TSX', color: '#0ea5e9', category: 'code' }, // sky
  js: { name: 'JavaScript', color: '#eab308', category: 'code' }, // yellow
  jsx: { name: 'React JSX', color: '#f59e0b', category: 'code' }, // amber
  py: { name: 'Python', color: '#10b981', category: 'code' }, // emerald
  go: { name: 'Go', color: '#06b6d4', category: 'code' }, // cyan
  rs: { name: 'Rust', color: '#f97316', category: 'code' }, // orange
  cpp: { name: 'C++', color: '#ec4899', category: 'code' }, // pink
  c: { name: 'C', color: '#8b5cf6', category: 'code' }, // violet
  cs: { name: 'C#', color: '#6366f1', category: 'code' }, // indigo
  java: { name: 'Java', color: '#d97706', category: 'code' }, // amber
  php: { name: 'PHP', color: '#a855f7', category: 'code' }, // purple
  rb: { name: 'Ruby', color: '#ef4444', category: 'code' }, // red
  swift: { name: 'Swift', color: '#f43f5e', category: 'code' }, // rose
  html: { name: 'HTML', color: '#ea580c', category: 'markup' }, // orange
  css: { name: 'CSS', color: '#0284c7', category: 'style' }, // sky
  scss: { name: 'SCSS', color: '#db2777', category: 'style' }, // pink
  json: { name: 'JSON', color: '#64748b', category: 'data' }, // slate
  yaml: { name: 'YAML', color: '#475569', category: 'config' }, // slate
  yml: { name: 'YAML', color: '#475569', category: 'config' }, // slate
  md: { name: 'Markdown', color: '#94a3b8', category: 'markup' }, // slate
  sql: { name: 'SQL', color: '#059669', category: 'data' }, // emerald
  sh: { name: 'Shell', color: '#4ade80', category: 'code' }, // green
  dockerfile: { name: 'Docker', color: '#38bdf8', category: 'config' },
};

export const DEFAULT_LANGUAGE: LanguageInfo = {
  name: 'Plain Text',
  color: '#cbd5e1',
  category: 'data',
};

export function getLanguageForFile(path: string): LanguageInfo {
  const parts = path.toLowerCase().split('/');
  const filename = parts[parts.length - 1];

  if (filename === 'dockerfile') return LANGUAGE_COLORS['dockerfile'];
  if (filename.startsWith('.env')) return LANGUAGE_COLORS['yaml'];

  const extParts = filename.split('.');
  if (extParts.length > 1) {
    const ext = extParts[extParts.length - 1];
    if (LANGUAGE_COLORS[ext]) {
      return LANGUAGE_COLORS[ext];
    }
  }

  return DEFAULT_LANGUAGE;
}
