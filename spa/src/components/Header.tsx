import { useState, useCallback } from 'react';
import { useNavigation } from '../hooks/useNavigation';
import { useArchData } from '../hooks/useArchData';
import { useTheme } from '../hooks/useTheme';
import { SVG_PATHS } from '../constants';

export function Header() {
  const { view } = useNavigation();
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
    <header className="sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/85 backdrop-blur-lg">
      <div className="flex items-center justify-between px-8 py-4">
        <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
          {view.type === 'overview' ? (
            <span className="font-medium">Overview</span>
          ) : (
            <>
              <span className="text-slate-500">{view.context}</span>
              <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d={SVG_PATHS.chevronRight} />
              </svg>
              <span className="font-medium">{view.module}</span>
            </>
          )}
        </nav>
        <div className="flex items-center gap-3">
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
