import type { KeyValuePair } from './useApiTester';

interface PathParamEditorProps {
  pairs: KeyValuePair[];
  onChange: (pairs: KeyValuePair[]) => void;
}

export function PathParamEditor({ pairs, onChange }: PathParamEditorProps) {
  function update(id: string, value: string) {
    onChange(pairs.map(p => p.id === id ? { ...p, value } : p));
  }

  return (
    <div className="space-y-2">
      {pairs.map(pair => (
        <div key={pair.id} className="flex items-center gap-2">
          {/* Spacer to align with KeyValueEditor rows */}
          <div className="shrink-0 w-5" />

          {/* Key input — always read-only */}
          <input
            type="text"
            value={pair.key}
            readOnly
            tabIndex={-1}
            className="flex-1 min-w-0 px-3 py-2 text-sm font-mono rounded-md outline-none border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 cursor-default"
          />

          {/* Value input — editable */}
          <input
            type="text"
            value={pair.value}
            onChange={e => update(pair.id, e.target.value)}
            placeholder="Value"
            className="flex-1 min-w-0 px-3 py-2 text-sm font-mono rounded-md outline-none transition-colors border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:border-primary-400 dark:focus:border-primary-500"
          />

          {/* Spacer to align with KeyValueEditor delete column */}
          <div className="shrink-0 w-5" />
        </div>
      ))}
    </div>
  );
}
