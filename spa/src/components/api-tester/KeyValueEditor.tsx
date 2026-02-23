import type { KeyValuePair } from './useApiTester';

interface KeyValueEditorProps {
  pairs: KeyValuePair[];
  onChange: (pairs: KeyValuePair[]) => void;
  readOnlyKeys?: Set<string>;
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

export function KeyValueEditor({ pairs, onChange, readOnlyKeys }: KeyValueEditorProps) {
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
    <div className="border border-slate-200 dark:border-slate-700/50 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800/60 text-left">
            <th className="w-8 px-2 py-1.5"></th>
            <th className="px-2 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">Key</th>
            <th className="px-2 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">Value</th>
            <th className="w-8 px-2 py-1.5"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((pair) => {
            const isReadOnly = readOnlyKeys?.has(pair.key);
            return (
              <tr
                key={pair.id}
                className={`border-t border-slate-100 dark:border-slate-700/50 ${!pair.enabled ? 'opacity-40' : ''}`}
              >
                <td className="px-2 py-1">
                  <input
                    type="checkbox"
                    checked={pair.enabled}
                    onChange={e => update(pair.id, 'enabled', e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500"
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    type="text"
                    value={pair.key}
                    onChange={e => update(pair.id, 'key', e.target.value)}
                    readOnly={isReadOnly}
                    placeholder="key"
                    className={`w-full bg-transparent text-sm font-mono text-slate-700 dark:text-slate-300 placeholder:text-slate-300 dark:placeholder:text-slate-600 outline-none ${isReadOnly ? 'cursor-default text-slate-400 dark:text-slate-500' : ''}`}
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    type="text"
                    value={pair.value}
                    onChange={e => update(pair.id, 'value', e.target.value)}
                    placeholder="value"
                    className="w-full bg-transparent text-sm font-mono text-slate-700 dark:text-slate-300 placeholder:text-slate-300 dark:placeholder:text-slate-600 outline-none"
                  />
                </td>
                <td className="px-2 py-1">
                  {(pair.key || pair.value) && !isReadOnly && (
                    <button
                      type="button"
                      onClick={() => remove(pair.id)}
                      className="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
