import { useArchData } from '../../hooks/useArchData';
import { useNavigation } from '../../hooks/useNavigation';
import { SVG_PATHS } from '../../constants';

export function ContextCards() {
  const { data } = useArchData();
  const { navigate } = useNavigation();

  if (!data || data.contexts.length === 0) {
    return (
      <section>
        <h2 className="text-xl font-bold mb-6">Bounded Contexts</h2>
        <p className="text-slate-500 dark:text-slate-400">No bounded contexts found.</p>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-xl font-bold mb-6">Bounded Contexts</h2>
      <div className="grid md:grid-cols-2 gap-6 stagger-in">
        {data.contexts.map(ctx => (
          <article key={ctx.name} className="card bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 p-6">
            <header className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/40 dark:to-primary-800/20 text-primary-600 dark:text-primary-400 ring-1 ring-primary-200/50 dark:ring-primary-700/30">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d={SVG_PATHS.folder} />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold">{ctx.name}</h3>
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                {ctx.modules.length} module{ctx.modules.length !== 1 ? 's' : ''}
              </span>
            </header>
            <ul className="space-y-2">
              {ctx.modules.map(mod => (
                <li key={mod.name}>
                  <a
                    href="#"
                    className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    onClick={e => { e.preventDefault(); navigate({ type: 'module', context: ctx.name, module: mod.name }); }}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d={SVG_PATHS.chevronRight} />
                    </svg>
                    {mod.name}
                    <span className="ml-auto text-xs text-slate-400">
                      {(mod.commands?.length ?? 0) + (mod.queries?.length ?? 0)} ops
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
