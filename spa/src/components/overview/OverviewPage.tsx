import { useArchData } from '../../hooks/useArchData';
import { StatsGrid } from './StatsGrid';
import { ContextCards } from './ContextCards';
import { ContextMap } from './ContextMap';

export function OverviewPage() {
  const { data } = useArchData();
  if (!data) return null;

  return (
    <div className="fade-in">
      <header className="mb-14">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-500 dark:text-primary-400 mb-3">{data.meta.company}</p>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl bg-gradient-to-r from-slate-900 via-primary-700 to-primary-500 dark:from-white dark:via-primary-300 dark:to-primary-400 bg-clip-text text-transparent">{data.meta.project}</h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
          Interactive architecture reference for bounded contexts, modules, commands, queries, domain events, and their relationships.
        </p>
        <p className="mt-3 text-sm text-slate-400 dark:text-slate-500 font-mono">
          Generated {new Date(data.meta.generatedAt).toLocaleString()}
        </p>
      </header>
      <StatsGrid />
      <ContextCards />
      <ContextMap />
      <div className="h-12" />
    </div>
  );
}
