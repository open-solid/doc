import { EditorView } from '@codemirror/view';
import type { ValidationResult } from '../../utils/jsonSchemaValidation';
import type { NamedExample } from '../../utils/schema';
import { ExampleSelector } from './ExampleSelector';

interface ValidationStatusBarProps {
  validation: ValidationResult | null;
  editorView: EditorView | null;
  examples: NamedExample[];
  selectedExampleKey: string | null;
  onExampleSelect: (example: NamedExample) => void;
}

export function ValidationStatusBar({ validation, editorView, examples, selectedExampleKey, onExampleSelect }: ValidationStatusBarProps) {
  const scrollToLine = (line: number) => {
    if (!editorView) return;

    const lineInfo = editorView.state.doc.line(Math.min(line, editorView.state.doc.lines));
    editorView.dispatch({
      selection: { anchor: lineInfo.from },
      effects: EditorView.scrollIntoView(lineInfo.from, { y: 'center' }),
    });
    editorView.focus();
  };

  const uniqueLines = validation ? [...new Set(validation.errors.map((e) => e.line))].slice(0, 5) : [];

  return (
    <div className="shrink-0 flex items-center justify-between px-2 py-1 text-[10px]">
      <div className="flex items-center gap-1.5">
        {validation && validation.valid && (
          <>
            <svg className="w-3 h-3 text-emerald-500 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Valid</span>
          </>
        )}
        {validation && !validation.valid && (
          <>
            <svg className="w-3 h-3 text-rose-500 dark:text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <span className="text-rose-600 dark:text-rose-400 font-medium">
              {validation.errorCount} error{validation.errorCount !== 1 ? 's' : ''}
            </span>
            {uniqueLines.length > 0 && (
              <div className="flex items-center gap-1 ml-1">
                {uniqueLines.map((line) => (
                  <button
                    key={line}
                    type="button"
                    onClick={() => scrollToLine(line)}
                    className="px-1 rounded text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Ln {line}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      {examples.length > 0 && (
        <ExampleSelector examples={examples} selectedKey={selectedExampleKey} onSelect={onExampleSelect} />
      )}
    </div>
  );
}
