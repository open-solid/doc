import { useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { keymap, EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { useTheme } from '../../hooks/useTheme';

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
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
}, { dark: true });

const darkHighlight = HighlightStyle.define([
  { tag: tags.propertyName, color: 'rgb(165 180 252)' },  // primary-300
  { tag: tags.string, color: 'rgb(52 211 153)' },         // emerald-400
  { tag: tags.number, color: 'rgb(251 191 36)' },         // amber-400
  { tag: tags.bool, color: 'rgb(129 140 248)' },          // primary-400
  { tag: tags.null, color: 'rgb(100 116 139)' },          // slate-500
  { tag: tags.punctuation, color: 'rgb(148 163 184)' },   // slate-400
]);

export function JsonEditor({ value, onChange }: JsonEditorProps) {
  const { isDark } = useTheme();

  const extensions = useMemo(() => [
    json(),
    ctrlEnterPassthrough,
    isDark ? darkTheme : lightTheme,
    syntaxHighlighting(isDark ? darkHighlight : lightHighlight),
  ], [isDark]);

  return (
    <div className="h-full [&_.cm-editor]:!h-full [&_.cm-editor]:!outline-none [&_.cm-editor]:!text-xs [&_.cm-scroller]:!font-mono">
      <CodeMirror
        value={value || '{}'}
        onChange={onChange}
        extensions={extensions}
        theme="none"
        height="100%"
        basicSetup={{
          lineNumbers: false,
          foldGutter: false,
          highlightActiveLine: false,
        }}
      />
    </div>
  );
}
