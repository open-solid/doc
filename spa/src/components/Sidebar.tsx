import { useArchData } from '../hooks/useArchData';
import { useNavigation } from '../hooks/useNavigation';
import { SVG_PATHS } from '../constants';

export function Sidebar() {
  const { data } = useArchData();
  const { view, navigate } = useNavigation();

  const currentNav = view.type === 'overview'
    ? 'overview'
    : `module:${view.context}:${view.module}`;

  return (
    <aside className="fixed inset-y-0 left-0 z-10 w-72 border-r border-slate-200 dark:border-slate-800 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 overflow-y-auto">
      <div className="sticky top-0 z-10 bg-gradient-to-b from-white via-white to-white/95 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900/95 px-6 py-5 backdrop-blur-sm">
        <a
          href="#"
          className="flex items-center gap-3"
          onClick={e => { e.preventDefault(); navigate({ type: 'overview' }); }}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 shadow-lg shadow-primary-500/30">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="9" r="7" />
              <circle cx="15" cy="15" r="7" />
            </svg>
          </div>
          <div>
            <span className="text-lg font-semibold">{data?.meta.project ?? 'Loading...'}</span>
            <p className="text-xs text-slate-500 dark:text-slate-400">{data?.meta.company ?? 'Documentation'}</p>
          </div>
        </a>
      </div>
      <nav className="px-4 py-4">
        <div className="mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <a
            href="#"
            aria-current={currentNav === 'overview' ? 'page' : undefined}
            className="nav-link flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 rounded-lg border-transparent"
            onClick={e => { e.preventDefault(); navigate({ type: 'overview' }); }}
          >
            <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d={SVG_PATHS.home} />
            </svg>
            Overview
          </a>
        </div>
        {data?.contexts.map(ctx => (
          <div key={ctx.name} className="mb-4">
            <h3 className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {ctx.name}
            </h3>
            <ul className="space-y-1">
              {ctx.modules.map(mod => {
                const navKey = `module:${ctx.name}:${mod.name}`;
                return (
                  <li key={mod.name}>
                    <a
                      href="#"
                      aria-current={currentNav === navKey ? 'page' : undefined}
                      className="nav-link flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 rounded-lg border-transparent"
                      onClick={e => { e.preventDefault(); navigate({ type: 'module', context: ctx.name, module: mod.name }); }}
                    >
                      <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d={SVG_PATHS.module} />
                      </svg>
                      {mod.name}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
