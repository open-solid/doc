import { useMemo, useRef, useCallback, useEffect } from 'react';
import type { MutableRefObject } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import type { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { keymap, EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { autocompletion } from '@codemirror/autocomplete';
import type { CompletionContext } from '@codemirror/autocomplete';
import { lintGutter } from '@codemirror/lint';
import { tags } from '@lezer/highlight';
import { useTheme } from '../../hooks/useTheme';
import type { SchemaObject, OpenApiSpec } from '../../openapi';
import { jsonSchemaComplete, jsonSchemaValueComplete } from '../../utils/jsonSchemaCompletion';
import { valueHelperTooltipExtension } from '../../utils/valueHelperTooltip';
import {
  jsonSchemaLintExtension,
  extractValidationResult,
  type ValidationResult,
} from '../../utils/jsonSchemaValidation';

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  schema?: SchemaObject | null;
  spec?: OpenApiSpec | null;
  onValidation?: (result: ValidationResult) => void;
  editorViewRef?: MutableRefObject<EditorView | null>;
}

const ctrlEnterPassthrough = keymap.of([
  {
    key: 'Mod-Enter',
    run: () => false,
  },
]);

const lightTheme = EditorView.theme({
  '&': {
    backgroundColor: 'rgb(248 250 252)',   // slate-50
    color: 'rgb(51 65 85)',                 // slate-700
  },
  '.cm-cursor': {
    borderLeftColor: 'rgb(99 102 241)',     // primary-500
  },
  '.cm-selectionBackground': {
    backgroundColor: 'rgb(199 210 254) !important', // primary-200
  },
  '.cm-activeLine': {
    backgroundColor: 'rgb(241 245 249)',    // slate-100
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'rgb(241 245 249)',    // slate-100
    color: 'rgb(100 116 139)',              // slate-500
  },
  '.cm-matchingBracket': {
    backgroundColor: 'rgb(199 210 254)',    // primary-200
    color: 'rgb(67 56 202)',                // primary-700
  },
  '.cm-gutters': {
    backgroundColor: 'rgb(248 250 252)',    // slate-50
    borderRight: '1px solid rgb(226 232 240)', // slate-200
    color: 'rgb(148 163 184)',              // slate-400
  },
  '.cm-tooltip-autocomplete': {
    backgroundColor: 'rgb(255 255 255)',
    border: '1px solid rgb(226 232 240)',
    borderRadius: '6px',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    fontSize: '11px',
  },
  '.cm-tooltip-autocomplete ul li': {
    padding: '2px 8px',
  },
  '.cm-tooltip-autocomplete ul li[aria-selected]': {
    backgroundColor: 'rgb(224 231 255)',    // primary-100
    color: 'rgb(67 56 202)',                // primary-700
  },
  '.cm-completionDetail': {
    color: 'rgb(148 163 184)',              // slate-400
    fontStyle: 'normal',
    marginLeft: '8px',
  },
  '.cm-completionInfo': {
    fontSize: '11px',
    padding: '4px 8px',
    backgroundColor: 'rgb(255 255 255)',
    border: '1px solid rgb(226 232 240)',
    borderRadius: '6px',
  },
  '.cm-value-helper': {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '3px 8px',
    backgroundColor: 'rgb(255 255 255)',
    border: '1px solid rgb(226 232 240)',
    borderRadius: '6px',
    boxShadow: '0 2px 4px -1px rgb(0 0 0 / 0.1)',
    fontSize: '11px',
  },
  '.cm-value-helper-label': {
    color: 'rgb(100 116 139)',
    fontWeight: '600',
    textTransform: 'uppercase',
    fontSize: '10px',
    letterSpacing: '0.05em',
  },
  '.cm-value-helper-btn': {
    padding: '1px 8px',
    border: '1px solid rgb(199 210 254)',
    borderRadius: '4px',
    backgroundColor: 'transparent',
    color: 'rgb(67 56 202)',
    fontSize: '11px',
    cursor: 'pointer',
    lineHeight: '1.4',
    '&:hover': {
      backgroundColor: 'rgb(238 242 255)',
    },
  },
  '.cm-value-helper-input': {
    padding: '1px 4px',
    border: '1px solid rgb(226 232 240)',
    borderRadius: '4px',
    backgroundColor: 'rgb(248 250 252)',
    color: 'rgb(51 65 85)',
    fontSize: '11px',
    lineHeight: '1.4',
  },
  // Lint styles
  '.cm-lintRange-error': {
    backgroundImage: 'none',
    textDecoration: 'wavy underline rgb(225 29 72 / 0.7)',  // rose-600
    textUnderlineOffset: '3px',
  },
  '.cm-lintRange-warning': {
    backgroundImage: 'none',
    textDecoration: 'wavy underline rgb(217 119 6 / 0.7)',  // amber-600
    textUnderlineOffset: '3px',
  },
  '.cm-tooltip-lint': {
    backgroundColor: 'rgb(255 255 255)',
    border: '1px solid rgb(226 232 240)',
    borderRadius: '6px',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    fontSize: '11px',
    padding: '4px 8px',
  },
  '.cm-lint-marker-error': {
    content: '"!"',
  },
  '.cm-lintPoint-error:after': {
    borderBottomColor: 'rgb(225 29 72)',   // rose-600
  },
  '.cm-lintPoint-warning:after': {
    borderBottomColor: 'rgb(217 119 6)',   // amber-600
  },
}, { dark: false });

const lightHighlight = HighlightStyle.define([
  { tag: tags.propertyName, color: 'rgb(67 56 202)' },    // primary-700
  { tag: tags.string, color: 'rgb(5 150 105)' },          // emerald-600
  { tag: tags.number, color: 'rgb(217 119 6)' },          // amber-600
  { tag: tags.bool, color: 'rgb(79 70 229)' },            // primary-600
  { tag: tags.null, color: 'rgb(148 163 184)' },          // slate-400
  { tag: tags.punctuation, color: 'rgb(100 116 139)' },   // slate-500
]);

const darkTheme = EditorView.theme({
  '&': {
    backgroundColor: 'rgb(15 23 42 / 0.6)',  // slate-900/60
    color: 'rgb(203 213 225)',                // slate-300
  },
  '.cm-cursor': {
    borderLeftColor: 'rgb(129 140 248)',      // primary-400
  },
  '.cm-selectionBackground': {
    backgroundColor: 'rgb(55 48 163 / 0.4) !important', // primary-800/40
  },
  '.cm-activeLine': {
    backgroundColor: 'rgb(30 41 59 / 0.6)',   // slate-800/60
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'rgb(30 41 59 / 0.6)',   // slate-800/60
    color: 'rgb(148 163 184)',                 // slate-400
  },
  '.cm-matchingBracket': {
    backgroundColor: 'rgb(55 48 163 / 0.4)', // primary-800/40
    color: 'rgb(165 180 252)',                // primary-300
  },
  '.cm-gutters': {
    backgroundColor: 'rgb(15 23 42 / 0.6)',   // slate-900/60
    borderRight: '1px solid rgb(51 65 85 / 0.5)', // slate-700/50
    color: 'rgb(71 85 105)',                   // slate-600
  },
  '.cm-tooltip-autocomplete': {
    backgroundColor: 'rgb(30 41 59)',          // slate-800
    border: '1px solid rgb(51 65 85)',         // slate-700
    borderRadius: '6px',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.3)',
    fontSize: '11px',
  },
  '.cm-tooltip-autocomplete ul li': {
    padding: '2px 8px',
  },
  '.cm-tooltip-autocomplete ul li[aria-selected]': {
    backgroundColor: 'rgb(55 48 163 / 0.4)',   // primary-800/40
    color: 'rgb(165 180 252)',                  // primary-300
  },
  '.cm-completionDetail': {
    color: 'rgb(100 116 139)',                 // slate-500
    fontStyle: 'normal',
    marginLeft: '8px',
  },
  '.cm-completionInfo': {
    fontSize: '11px',
    padding: '4px 8px',
    backgroundColor: 'rgb(30 41 59)',          // slate-800
    border: '1px solid rgb(51 65 85)',         // slate-700
    borderRadius: '6px',
  },
  '.cm-value-helper': {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '3px 8px',
    backgroundColor: 'rgb(30 41 59)',           // slate-800
    border: '1px solid rgb(51 65 85)',          // slate-700
    borderRadius: '6px',
    boxShadow: '0 2px 4px -1px rgb(0 0 0 / 0.3)',
    fontSize: '11px',
  },
  '.cm-value-helper-label': {
    color: 'rgb(100 116 139)',                  // slate-500
    fontWeight: '600',
    textTransform: 'uppercase',
    fontSize: '10px',
    letterSpacing: '0.05em',
  },
  '.cm-value-helper-btn': {
    padding: '1px 8px',
    border: '1px solid rgb(55 48 163)',         // primary-800
    borderRadius: '4px',
    backgroundColor: 'transparent',
    color: 'rgb(165 180 252)',                  // primary-300
    fontSize: '11px',
    cursor: 'pointer',
    lineHeight: '1.4',
    '&:hover': {
      backgroundColor: 'rgb(55 48 163 / 0.3)',
    },
  },
  '.cm-value-helper-input': {
    padding: '1px 4px',
    border: '1px solid rgb(51 65 85)',          // slate-700
    borderRadius: '4px',
    backgroundColor: 'rgb(15 23 42)',           // slate-900
    color: 'rgb(203 213 225)',                  // slate-300
    fontSize: '11px',
    lineHeight: '1.4',
    colorScheme: 'dark',
  },
  // Lint styles
  '.cm-lintRange-error': {
    backgroundImage: 'none',
    textDecoration: 'wavy underline rgb(251 113 133 / 0.7)',  // rose-400
    textUnderlineOffset: '3px',
  },
  '.cm-lintRange-warning': {
    backgroundImage: 'none',
    textDecoration: 'wavy underline rgb(251 191 36 / 0.7)',   // amber-400
    textUnderlineOffset: '3px',
  },
  '.cm-tooltip-lint': {
    backgroundColor: 'rgb(30 41 59)',           // slate-800
    border: '1px solid rgb(51 65 85)',          // slate-700
    borderRadius: '6px',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.3)',
    fontSize: '11px',
    padding: '4px 8px',
  },
  '.cm-lint-marker-error': {
    content: '"!"',
  },
  '.cm-lintPoint-error:after': {
    borderBottomColor: 'rgb(251 113 133)',      // rose-400
  },
  '.cm-lintPoint-warning:after': {
    borderBottomColor: 'rgb(251 191 36)',       // amber-400
  },
}, { dark: true });

const darkHighlight = HighlightStyle.define([
  { tag: tags.propertyName, color: 'rgb(165 180 252)' },  // primary-300
  { tag: tags.string, color: 'rgb(52 211 153)' },         // emerald-400
  { tag: tags.number, color: 'rgb(251 191 36)' },         // amber-400
  { tag: tags.bool, color: 'rgb(129 140 248)' },          // primary-400
  { tag: tags.null, color: 'rgb(100 116 139)' },          // slate-500
  { tag: tags.punctuation, color: 'rgb(148 163 184)' },   // slate-400
]);

export function JsonEditor({ value, onChange, schema, spec, onValidation, editorViewRef }: JsonEditorProps) {
  const { isDark } = useTheme();

  const schemaRef = useRef(schema);
  const specRef = useRef(spec);
  schemaRef.current = schema;
  specRef.current = spec;

  const cmRef = useRef<ReactCodeMirrorRef>(null);
  const lastErrorCountRef = useRef(-1);

  // Capture EditorView into the external ref
  useEffect(() => {
    if (editorViewRef && cmRef.current?.view) {
      editorViewRef.current = cmRef.current.view;
    }
  });

  const completionSource = useCallback((ctx: CompletionContext) => {
    return jsonSchemaComplete(ctx, schemaRef.current, specRef.current)
        ?? jsonSchemaValueComplete(ctx, schemaRef.current, specRef.current);
  }, []);

  const tooltipExt = useMemo(
    () => valueHelperTooltipExtension(schemaRef, specRef),
    [],
  );

  const lintExt = useMemo(
    () => jsonSchemaLintExtension(schemaRef, specRef),
    [],
  );

  const gutterExt = useMemo(() => lintGutter(), []);

  const onValidationRef = useRef(onValidation);
  onValidationRef.current = onValidation;

  const updateListener = useMemo(
    () =>
      EditorView.updateListener.of((update) => {
        if (!onValidationRef.current) return;
        // Only recompute when the document or diagnostics change
        if (!update.docChanged && !update.transactions.some((t) => t.effects.length > 0)) return;

        const result = extractValidationResult(update.state);
        if (result.errorCount !== lastErrorCountRef.current) {
          lastErrorCountRef.current = result.errorCount;
          onValidationRef.current(result);
        }
      }),
    [],
  );

  const extensions = useMemo(() => [
    json(),
    ctrlEnterPassthrough,
    isDark ? darkTheme : lightTheme,
    syntaxHighlighting(isDark ? darkHighlight : lightHighlight),
    autocompletion({ override: [completionSource], activateOnTyping: true }),
    tooltipExt,
    lintExt,
    gutterExt,
    updateListener,
  ], [isDark, completionSource, tooltipExt, lintExt, gutterExt, updateListener]);

  return (
    <div className="h-full [&_.cm-editor]:!h-full [&_.cm-editor]:!outline-none [&_.cm-editor]:!text-xs [&_.cm-scroller]:!font-mono">
      <CodeMirror
        ref={cmRef}
        value={value}
        onChange={onChange}
        extensions={extensions}
        theme="none"
        height="100%"
        basicSetup={{
          lineNumbers: true,
          foldGutter: false,
          highlightActiveLine: true,
          completionKeymap: false,
          autocompletion: false,
        }}
      />
    </div>
  );
}
