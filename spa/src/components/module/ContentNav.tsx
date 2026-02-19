import { useState, useEffect } from 'react';

const METHOD_TEXT_COLORS: Record<string, string> = {
  get: 'text-emerald-600 dark:text-emerald-400',
  post: 'text-primary-600 dark:text-primary-400',
  put: 'text-amber-600 dark:text-amber-400',
  patch: 'text-amber-600 dark:text-amber-400',
  delete: 'text-rose-600 dark:text-rose-400',
};

export interface NavItem {
  id: string;
  label: string;
  method?: string;
}

interface ContentNavProps {
  items: NavItem[];
}

export function ContentNav({ items }: ContentNavProps) {
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px' },
    );

    items.forEach(item => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  function handleClick(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <nav className="hidden xl:block w-48 shrink-0 sticky top-24 self-start max-h-[calc(100vh-120px)] overflow-y-auto">
      <ul className="space-y-0.5">
        {items.map(item => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => handleClick(item.id)}
              className={`w-full text-left text-xs px-3 py-1.5 rounded-md truncate transition-colors cursor-pointer ${
                activeId === item.id
                  ? 'text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
              title={item.label}
            >
              {item.label}
              {item.method && (
                  <span className={`text-[10px] uppercase ml-1.5 ${METHOD_TEXT_COLORS[item.method] ?? 'text-slate-500'}`}>
                  {item.method}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
