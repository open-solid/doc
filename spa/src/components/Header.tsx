import { useState, useCallback, useEffect } from 'react';
import { useArchData } from '../hooks/useArchData';
import { useNavigation } from '../hooks/useNavigation';
import { useOpenApi } from '../hooks/useOpenApi';
import { useTheme } from '../hooks/useTheme';
import { SVG_PATHS } from '../constants';

export function Header() {
  const { refresh } = useArchData();
  const { refresh: refreshOpenApi } = useOpenApi();
  const { view } = useNavigation();
  const { isDark, setTheme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refresh(), refreshOpenApi()]);
    } finally {
      setRefreshing(false);
    }
  }, [refresh, refreshOpenApi]);

  return (
    <header className={`sticky top-0 z-10 transition-all duration-200 ${view.type === 'overview' && !scrolled ? 'border-b border-transparent bg-transparent' : 'border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-lg'}`}>
      <div className="flex items-center justify-between px-8 py-2">
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
            title="Refresh project data"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            disabled={refreshing}
            onClick={handleRefresh}
          >
            <svg className={`h-5 w-5 ${refreshing ? 'spin' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d={SVG_PATHS.refresh} />
            </svg>
          </button>
          <button
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d={isDark ? SVG_PATHS.moon : SVG_PATHS.sun} />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
