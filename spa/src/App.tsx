import { ThemeProvider } from './context/ThemeContext';
import { NavigationProvider } from './context/NavigationContext';
import { ArchDataProvider } from './context/ArchDataContext';
import { OpenApiProvider } from './context/OpenApiContext';
import { useNavigation } from './hooks/useNavigation';
import { useArchData } from './hooks/useArchData';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Toast } from './components/Toast';
import { Spinner } from './components/Spinner';
import { OverviewPage } from './components/overview/OverviewPage';
import { ModulePage } from './components/module/ModulePage';

function MainContent() {
  const { view } = useNavigation();
  const { data, loading, error } = useArchData();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner />
      </div>
    );
  }

  if (error || !data) {
    return (
      <p className="text-red-500">
        Failed to load architecture data. Make sure arch.json exists.
      </p>
    );
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
        <OpenApiProvider>
          <NavigationProvider>
            <div className="flex min-h-screen">
              <Sidebar />
              <main className="flex-1 ml-72 bg-grid">
                <Header />
                <div className="px-8 py-8">
                  <MainContent />
                </div>
              </main>
            </div>
            <Toast />
          </NavigationProvider>
        </OpenApiProvider>
      </ArchDataProvider>
    </ThemeProvider>
  );
}
