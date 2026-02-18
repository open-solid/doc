import type { Parameter } from '../types';

interface DataTableProps {
  items: Parameter[];
}

export function DataTable({ items }: DataTableProps) {
  return (
    <div className="mt-4 rounded-lg border border-slate-100 dark:border-slate-700/50 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700/50">
            <th className="text-left py-2 px-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Name</th>
            <th className="text-left py-2 px-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Type</th>
            <th className="text-left py-2 px-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Description</th>
          </tr>
        </thead>
        <tbody>
          {items.map(p => (
            <tr key={p.name} className="border-b border-slate-100 dark:border-slate-800/50 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
              <td className="py-2 px-3 font-mono text-sm text-primary-600 dark:text-primary-400">{p.name}</td>
              <td
                className={`py-2 px-3 text-slate-600 dark:text-slate-400 ${p.class ? 'cursor-help' : ''}`}
                title={p.class}
              >
                {p.type}
              </td>
              <td className="py-2 px-3 text-slate-500 dark:text-slate-400 text-xs">{p.description ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
