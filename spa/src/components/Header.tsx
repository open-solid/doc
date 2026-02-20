import { useState, useCallback } from 'react';
import { useArchData } from '../hooks/useArchData';
import { useTheme } from '../hooks/useTheme';
import { SVG_PATHS } from '../constants';

export function Header() {
  const { refresh } = useArchData();
  const { theme, setTheme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const themes: Array<{ key: 'light' | 'system' | 'dark'; title: string; icon: string }> = [
    { key: 'light', title: 'Light', icon: SVG_PATHS.sun },
    { key: 'system', title: 'System', icon: SVG_PATHS.monitor },
    { key: 'dark', title: 'Dark', icon: SVG_PATHS.moon },
  ];

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-lg">
      <div className="flex items-center justify-between px-8 py-3">
        <button
          type="button"
          className="flex items-center gap-2 w-100 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 hover:border-slate-300 dark:hover:border-slate-600 transition-colors cursor-pointer"
        >
          <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <span className="text-sm">Find something...</span>
          <kbd className="ml-auto text-xs" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>⌘K</kbd>
        </button>
        <div className="flex items-center gap-3 shrink-0">
          <button
            title="Refresh architecture data"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            disabled={refreshing}
            onClick={handleRefresh}
          >
            <svg className={`h-5 w-5 ${refreshing ? 'spin' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d={SVG_PATHS.refresh} />
            </svg>
          </button>
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            {themes.map(t => (
              <button
                key={t.key}
                data-theme={t.key}
                title={t.title}
                aria-pressed={theme === t.key}
                className="theme-btn p-2 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                onClick={() => setTheme(t.key)}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d={t.icon} />
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
