import type { HistoryEntry } from './useApiTester';

const METHOD_BADGE_COLORS: Record<string, string> = {
  GET: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  POST: 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300',
  PUT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  PATCH: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  DELETE: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
};

function statusColor(status: number): string {
  if (status === 0) return 'text-rose-500';
  if (status < 300) return 'text-emerald-600 dark:text-emerald-400';
  if (status < 500) return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
}

interface RequestHistoryProps {
  history: HistoryEntry[];
  search: string;
  onSearchChange: (search: string) => void;
  onSelect: (id: string) => void;
  activeEntryId: string | null;
}

export function RequestHistory({ history, search, onSearchChange, onSelect, activeEntryId }: RequestHistoryProps) {
  const filtered = search
    ? history.filter(h => h.path.toLowerCase().includes(search.toLowerCase()) || h.method.toLowerCase().includes(search.toLowerCase()))
    : history;

  return (
    <div className="flex flex-col h-full">
      <div className="p-3">
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search history..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-primary-400 dark:focus:border-primary-500 transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <svg className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-slate-400 dark:text-slate-500">No requests yet</p>
          </div>
        ) : (
          <div className="py-1">
            {filtered.map(entry => (
              <button
                key={entry.id}
                type="button"
                onClick={() => onSelect(entry.id)}
                className={`w-full text-left px-3 py-2 flex items-center gap-2 transition-colors ${
                  entry.id === activeEntryId
                    ? 'bg-primary-50 dark:bg-primary-900/20 border-l-2 border-primary-500'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-l-2 border-transparent'
                }`}
              >
                <span className={`shrink-0 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${METHOD_BADGE_COLORS[entry.method] ?? 'bg-slate-100 text-slate-700'}`}>
                  {entry.method}
                </span>
                <span className="flex-1 text-xs font-mono text-slate-600 dark:text-slate-400 truncate">{entry.path}</span>
                {entry.response && (
                  <span className={`shrink-0 text-xs font-semibold ${statusColor(entry.response.status)}`}>
                    {entry.response.status || 'ERR'}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
