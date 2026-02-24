import type { KeyValuePair } from './useApiTester';

interface KeyValueEditorProps {
  pairs: KeyValuePair[];
  onChange: (pairs: KeyValuePair[]) => void;
}

let nextPairId = 1000;
function pairId(): string {
  return `kv-${nextPairId++}`;
}

function ensureTrailingEmpty(pairs: KeyValuePair[]): KeyValuePair[] {
  const last = pairs[pairs.length - 1];
  if (!last || last.key || last.value) {
    return [...pairs, { id: pairId(), key: '', value: '', enabled: true }];
  }
  return pairs;
}

export function KeyValueEditor({ pairs, onChange }: KeyValueEditorProps) {
  const rows = ensureTrailingEmpty(pairs);

  function update(id: string, field: 'key' | 'value' | 'enabled', val: string | boolean) {
    const updated = rows.map(p =>
      p.id === id ? { ...p, [field]: val } : p,
    );
    onChange(ensureTrailingEmpty(updated).filter((p, i, arr) => {
      if (i === arr.length - 1) return true;
      return p.key || p.value;
    }));
  }

  function remove(id: string) {
    onChange(pairs.filter(p => p.id !== id));
  }

  return (
    <div className="space-y-2">
      {rows.map((pair, index) => {
        const isEmpty = !pair.key && !pair.value;
        const isLast = index === rows.length - 1 && isEmpty;

        return (
          <div
            key={pair.id}
            className={`flex items-center gap-2 ${!pair.enabled && !isLast ? 'opacity-40' : ''}`}
          >
            {/* Checkbox — hidden on the trailing empty row */}
            <div className="shrink-0 w-5 flex items-center justify-center">
              {!isLast && (
                <input
                  type="checkbox"
                  checked={pair.enabled}
                  onChange={e => update(pair.id, 'enabled', e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500 cursor-pointer"
                />
              )}
            </div>

            {/* Key input */}
            <input
              type="text"
              value={pair.key}
              onChange={e => update(pair.id, 'key', e.target.value)}
              placeholder={isLast ? 'param_name' : 'key'}
              className={`flex-1 min-w-0 px-3 py-2 text-sm font-mono rounded-md outline-none transition-colors ${
                isLast
                  ? 'border border-dashed border-slate-300 dark:border-slate-600 bg-transparent text-slate-400 dark:text-slate-500 placeholder:text-slate-300 dark:placeholder:text-slate-600'
                  : 'border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:border-primary-400 dark:focus:border-primary-500'
              }`}
            />

            {/* Value input */}
            <input
              type="text"
              value={pair.value}
              onChange={e => update(pair.id, 'value', e.target.value)}
              placeholder={isLast ? 'Value' : 'value'}
              className={`flex-1 min-w-0 px-3 py-2 text-sm font-mono rounded-md outline-none transition-colors ${
                isLast
                  ? 'border border-dashed border-slate-300 dark:border-slate-600 bg-transparent text-slate-400 dark:text-slate-500 placeholder:text-slate-300 dark:placeholder:text-slate-600'
                  : 'border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:border-primary-400 dark:focus:border-primary-500'
              }`}
            />

            {/* Delete / chevron */}
            <div className="shrink-0 w-5 flex items-center justify-center">
              {!isEmpty ? (
                <button
                  type="button"
                  onClick={() => remove(pair.id)}
                  className="text-slate-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
