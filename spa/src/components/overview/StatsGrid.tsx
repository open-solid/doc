import { useMemo } from 'react';
import { useArchData } from '../../hooks/useArchData';
import { STAT_COLORS, COLOR_CLASSES, SECTION_CONFIG } from '../../constants';
import { SVG_PATHS } from '../../constants';

const STAT_ICONS: Record<string, string> = {
  Modules: SVG_PATHS.module,
  Endpoints: SVG_PATHS.endpoint,
  Commands: SECTION_CONFIG.find(s => s.key === 'commands')!.iconPath,
  Queries: SECTION_CONFIG.find(s => s.key === 'queries')!.iconPath,
  Events: SECTION_CONFIG.find(s => s.key === 'domainEvents')!.iconPath,
};

const BORDER_COLORS: Record<string, string> = {
  primary: 'border-t-primary-500',
  emerald: 'border-t-emerald-500',
  violet: 'border-t-violet-500',
  amber: 'border-t-amber-500',
  rose: 'border-t-rose-500',
  cyan: 'border-t-cyan-500',
  slate: 'border-t-slate-400',
};

export function StatsGrid() {
  const { data } = useArchData();

  const stats = useMemo(() => {
    if (!data) return [];
    const counts: Record<string, number> = { Modules: 0, Endpoints: 0, Commands: 0, Queries: 0, Events: 0 };
    data.contexts.forEach(ctx => ctx.modules.forEach(mod => {
      counts['Modules']++;
      counts['Commands'] += mod.commands?.length ?? 0;
      counts['Queries'] += mod.queries?.length ?? 0;
      counts['Events'] += mod.domainEvents?.length ?? 0;
    }));
    counts['Endpoints'] = counts['Commands'] + counts['Queries'];
    return Object.entries(counts).map(([label, value]) => ({ label, value, color: STAT_COLORS[label] ?? 'primary' as const }));
  }, [data]);

  return (
    <section className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-14 stagger-in">
      {stats.map(s => (
        <div
          key={s.label}
          className={`bg-slate-50 dark:bg-slate-800/60 rounded-xl p-5 border border-slate-200 dark:border-slate-700/60 border-t-[3px] ${BORDER_COLORS[s.color] ?? 'border-t-primary-500'}`}
        >
          <div className="flex items-center justify-between mb-3">
            <svg className={`h-5 w-5 ${COLOR_CLASSES[s.color]?.icon ?? ''} opacity-70`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d={STAT_ICONS[s.label] ?? SVG_PATHS.module} />
            </svg>
          </div>
          <div className={`text-3xl font-extrabold tracking-tight ${COLOR_CLASSES[s.color]?.statValue ?? ''}`}>{s.value}</div>
          <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</div>
        </div>
      ))}
    </section>
  );
}
