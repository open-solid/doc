import { useState, useEffect, useRef, useCallback } from 'react';
import { useArchData } from '../hooks/useArchData';
import { useNavigation } from '../hooks/useNavigation';
import { useDocs } from '../hooks/useDocs';
import { SVG_PATHS } from '../constants';
import type { DocsNavItem, NavigationView } from '../types';

function isSelfOrChildActive(item: DocsNavItem, currentNav: string): boolean {
  const navKey = item.path !== null ? `doc:${item.path}:${item.anchor ?? ''}` : null;
  if (navKey !== null && currentNav === navKey) return true;
  return item.items.some(child => isSelfOrChildActive(child, currentNav));
}

function findActiveIndex(items: DocsNavItem[], currentNav: string): number | null {
  for (let i = 0; i < items.length; i++) {
    if (isSelfOrChildActive(items[i]!, currentNav)) return i;
  }
  return null;
}

function AnimatedCollapse({ expanded, children }: { expanded: boolean; children: React.ReactNode }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | 'auto'>(expanded ? 'auto' : 0);
  const isInitial = useRef(true);

  useEffect(() => {
    if (isInitial.current) {
      isInitial.current = false;
      return;
    }
    const el = contentRef.current;
    if (!el) return;

    if (expanded) {
      setHeight(el.scrollHeight);
      const onEnd = () => { setHeight('auto'); el.removeEventListener('transitionend', onEnd); };
      el.addEventListener('transitionend', onEnd);
    } else {
      setHeight(el.scrollHeight);
      requestAnimationFrame(() => { requestAnimationFrame(() => { setHeight(0); }); });
    }
  }, [expanded]);

  return (
    <div
      ref={contentRef}
      className="overflow-hidden transition-[height] duration-200 ease-in-out"
      style={{ height: height === 'auto' ? 'auto' : `${height}px` }}
    >
      {children}
    </div>
  );
}

function DocsNavTree({ items, depth, currentNav, navigate }: {
  items: DocsNavItem[];
  depth: number;
  currentNav: string;
  navigate: (view: NavigationView) => void;
}) {
  const isRoot = depth === 0;
  const [expandedIndex, setExpandedIndex] = useState<number | null>(() => findActiveIndex(items, currentNav));

  useEffect(() => {
    if (isRoot) return;
    const active = findActiveIndex(items, currentNav);
    if (active !== null) {
      setExpandedIndex(active);
    } else if (!currentNav.startsWith('doc:')) {
      setExpandedIndex(null);
    }
  }, [items, currentNav, isRoot]);

  const toggle = useCallback((index: number) => {
    setExpandedIndex(prev => prev === index ? null : index);
  }, []);

  return (
    <ul className={depth > 0 ? 'space-y-0.5' : 'space-y-1'}>
      {items.map((item, i) => {
        const hasChildren = item.items.length > 0;
        const hasPath = item.path !== null;
        const navKey = hasPath ? `doc:${item.path}:${item.anchor ?? ''}` : null;
        const isActive = navKey !== null && currentNav === navKey;
        const isExpanded = hasChildren && (isRoot || expandedIndex === i);
        const paddingClass = depth === 0 ? 'pl-3' : depth === 1 ? 'pl-7' : 'pl-11';

        if (!hasPath && !item.anchor) {
          return (
            <li key={`${item.title}-${i}`}>
              <h3 className={`${paddingClass} pr-3 mb-1 mt-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400`}>
                {item.title}
              </h3>
              {hasChildren && (
                isRoot ? (
                  <DocsNavTree items={item.items} depth={depth + 1} currentNav={currentNav} navigate={navigate} />
                ) : (
                  <AnimatedCollapse expanded={isExpanded}>
                    <DocsNavTree items={item.items} depth={depth + 1} currentNav={currentNav} navigate={navigate} />
                  </AnimatedCollapse>
                )
              )}
            </li>
          );
        }

        return (
          <li key={`${item.title}-${i}`}>
            <a
              href="#"
              aria-current={isActive ? 'page' : undefined}
              className={`nav-link flex items-center gap-2 ${paddingClass} pr-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 rounded-lg border-transparent`}
              onClick={e => {
                e.preventDefault();
                if (hasChildren && !isRoot) toggle(i);
                navigate({ type: 'doc', path: item.path!, anchor: item.anchor ?? undefined });
              }}
            >
              <span>{item.title}</span>
            </a>
            {hasChildren && (
              isRoot ? (
                <DocsNavTree items={item.items} depth={depth + 1} currentNav={currentNav} navigate={navigate} />
              ) : (
                <AnimatedCollapse expanded={isExpanded}>
                  <DocsNavTree items={item.items} depth={depth + 1} currentNav={currentNav} navigate={navigate} />
                </AnimatedCollapse>
              )
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function Sidebar() {
  const { data } = useArchData();
  const { view, navigate } = useNavigation();
  const { navigation: docsNav, loadingNav } = useDocs();

  const currentNav = view.type === 'overview'
    ? 'overview'
    : view.type === 'doc'
      ? `doc:${view.path}:${view.anchor ?? ''}`
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
        {!loadingNav && docsNav.length > 0 && (
          <div className="mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <DocsNavTree items={docsNav} depth={0} currentNav={currentNav} navigate={navigate} />
          </div>
        )}
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
