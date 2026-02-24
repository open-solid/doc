import { useState, useRef, useEffect, useCallback } from 'react';
import type { NamedExample } from '../../utils/schema';

interface ExampleSelectorProps {
  examples: NamedExample[];
  selectedKey: string | null;
  onSelect: (example: NamedExample) => void;
}

export function ExampleSelector({ examples, selectedKey, onSelect }: ExampleSelectorProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false);
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [open, handleClickOutside, handleKeyDown]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer"
      >
        <span className="font-medium">Examples</span>
        <svg className={`w-2.5 h-2.5 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-10 bottom-full mb-1 right-0 min-w-48 max-h-48 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg">
          {examples.map(example => (
            <button
              key={example.key}
              type="button"
              onClick={() => { onSelect(example); setOpen(false); }}
              className={`w-full text-left px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors ${
                example.key === selectedKey ? 'bg-primary-50 dark:bg-primary-900/20' : ''
              }`}
            >
              <div className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300">{example.key}</div>
              {example.summary && (
                <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{example.summary}</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
