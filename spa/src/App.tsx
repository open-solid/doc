import { useState, useCallback } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { NavigationProvider } from './context/NavigationContext';
import { ArchDataProvider } from './context/ArchDataContext';
import { OpenApiProvider } from './context/OpenApiContext';
import { DocsProvider } from './context/DocsContext';
import { useNavigation } from './hooks/useNavigation';
import { useArchData } from './hooks/useArchData';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Toast } from './components/Toast';
import { Spinner } from './components/Spinner';
import { OverviewPage } from './components/overview/OverviewPage';
import { ModulePage } from './components/module/ModulePage';
import { DocsPage } from './components/docs/DocsPage';
import { SVG_PATHS } from './constants';

function EmptyState({ error }: { error: string }) {
  const { refresh } = useArchData();
  const [refreshing, setRefreshing] = useState(false);

  const handleGenerate = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
          <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d={SVG_PATHS.folder} />
          </svg>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">{error}</p>
        <button
          onClick={handleGenerate}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          <svg className={`h-4 w-4 ${refreshing ? 'spin' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d={SVG_PATHS.refresh} />
          </svg>
          {refreshing ? 'Generating...' : 'Generate Now'}
        </button>
      </div>
    </div>
  );
}

function MainContent() {
  const { view } = useNavigation();
  const { data, loading, error } = useArchData();

  if (view.type === 'doc') {
    return <DocsPage />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner />
      </div>
    );
  }

  if (error || !data) {
    return <EmptyState error={error ?? 'Failed to load architecture data.'} />;
  }

  if (view.type === 'module') {
    return <ModulePage contextName={view.context} moduleName={view.module} initialTab={view.tab} />;
  }

  return <OverviewPage />;
}

export function App() {
  return (
    <ThemeProvider>
      <ArchDataProvider>
        <DocsProvider>
          <OpenApiProvider>
            <NavigationProvider>
              <div className="flex min-h-screen">
                <Sidebar />
                <main className="flex-1 ml-72 bg-grid">
                  <Header />
                  <div className="max-w-7xl mx-auto px-8 py-8">
                    <MainContent />
                  </div>
                </main>
              </div>
              <Toast />
            </NavigationProvider>
          </OpenApiProvider>
        </DocsProvider>
      </ArchDataProvider>
    </ThemeProvider>
  );
}
