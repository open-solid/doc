import { useMemo, useRef, useCallback } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { keymap, EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { autocompletion } from '@codemirror/autocomplete';
import type { CompletionContext } from '@codemirror/autocomplete';
import { tags } from '@lezer/highlight';
import { useTheme } from '../../hooks/useTheme';
import type { SchemaObject, OpenApiSpec } from '../../openapi';
import { jsonSchemaComplete, jsonSchemaValueComplete } from '../../utils/jsonSchemaCompletion';
import { valueHelperTooltipExtension } from '../../utils/valueHelperTooltip';

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  schema?: SchemaObject | null;
  spec?: OpenApiSpec | null;
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
    backgroundColor: 'transparent',
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
    backgroundColor: 'transparent',
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
}, { dark: true });

const darkHighlight = HighlightStyle.define([
  { tag: tags.propertyName, color: 'rgb(165 180 252)' },  // primary-300
  { tag: tags.string, color: 'rgb(52 211 153)' },         // emerald-400
  { tag: tags.number, color: 'rgb(251 191 36)' },         // amber-400
  { tag: tags.bool, color: 'rgb(129 140 248)' },          // primary-400
  { tag: tags.null, color: 'rgb(100 116 139)' },          // slate-500
  { tag: tags.punctuation, color: 'rgb(148 163 184)' },   // slate-400
]);

export function JsonEditor({ value, onChange, schema, spec }: JsonEditorProps) {
  const { isDark } = useTheme();

  const schemaRef = useRef(schema);
  const specRef = useRef(spec);
  schemaRef.current = schema;
  specRef.current = spec;

  const completionSource = useCallback((ctx: CompletionContext) => {
    return jsonSchemaComplete(ctx, schemaRef.current, specRef.current)
        ?? jsonSchemaValueComplete(ctx, schemaRef.current, specRef.current);
  }, []);

  const tooltipExt = useMemo(
    () => valueHelperTooltipExtension(schemaRef, specRef),
    [],
  );

  const extensions = useMemo(() => [
    json(),
    ctrlEnterPassthrough,
    isDark ? darkTheme : lightTheme,
    syntaxHighlighting(isDark ? darkHighlight : lightHighlight),
    autocompletion({ override: [completionSource], activateOnTyping: true }),
    tooltipExt,
  ], [isDark, completionSource, tooltipExt]);

  return (
    <div className="h-full [&_.cm-editor]:!h-full [&_.cm-editor]:!outline-none [&_.cm-editor]:!text-xs [&_.cm-scroller]:!font-mono">
      <CodeMirror
        value={value}
        onChange={onChange}
        extensions={extensions}
        theme="none"
        height="100%"
        basicSetup={{
          lineNumbers: false,
          foldGutter: false,
          highlightActiveLine: false,
          completionKeymap: false,
          autocompletion: false,
        }}
      />
    </div>
  );
}
