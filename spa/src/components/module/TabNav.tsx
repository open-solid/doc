import type { SectionConfig } from '../../constants';
import { COLOR_CLASSES, SVG_PATHS } from '../../constants';
import type { Module } from '../../types';

interface TabNavProps {
  sections: SectionConfig[];
  module: Module;
  activeKey: string;
  onTabChange: (key: string) => void;
  endpointsCount?: number;
}

export function TabNav({ sections, module, activeKey, onTabChange, endpointsCount }: TabNavProps) {
  return (
    <nav className="flex flex-wrap gap-1 p-1 bg-slate-100 dark:bg-slate-800/70 rounded-xl w-fit mb-8 border border-slate-200/50 dark:border-slate-700/30">
      {endpointsCount != null && endpointsCount > 0 && (
        <button
          type="button"
          className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-all ${
            activeKey === 'endpoints'
              ? 'bg-slate-50 dark:bg-slate-700 text-primary-700 dark:text-primary-300 shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-600/30'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/50'
          }`}
          onClick={() => onTabChange('endpoints')}
        >
          <svg className={`h-4 w-4 ${COLOR_CLASSES.primary.icon}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d={SVG_PATHS.endpoint} />
          </svg>
          Endpoints
          <span className="text-xs min-w-5 text-center px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 tabular-nums">
            {endpointsCount}
          </span>
        </button>
      )}
      {sections.map(s => {
        const count = (module[s.key] as unknown[] | undefined)?.length ?? 0;
        const isActive = s.key === activeKey;
        return (
          <button
            key={s.key}
            type="button"
            className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-all ${
              isActive
                ? 'bg-slate-50 dark:bg-slate-700 text-primary-700 dark:text-primary-300 shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-600/30'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/50'
            }`}
            onClick={() => onTabChange(s.key)}
          >
            <svg className={`h-4 w-4 ${COLOR_CLASSES[s.color].icon}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d={s.iconPath} />
            </svg>
            {s.title}
            <span className="text-xs min-w-5 text-center px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 tabular-nums">
              {count}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
