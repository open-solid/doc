import { useState, useCallback, useMemo } from 'react';
import { Highlight, type PrismTheme } from 'prism-react-renderer';
import { useTheme } from '../hooks/useTheme';

// Register extra Prism grammars — static imports run in order, and
// prism-setup must come first to expose Prism globally for the components.
import './prism-setup';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-markup-templating';
import 'prismjs/components/prism-php';

const lightTheme: PrismTheme = {
  plain: { color: 'rgb(51 65 85)' },           // slate-700
  styles: [
    { types: ['property'], style: { color: 'rgb(67 56 202)' } },       // primary-700
    { types: ['string', 'attr-value'], style: { color: 'rgb(5 150 105)' } }, // emerald-600
    { types: ['number'], style: { color: 'rgb(217 119 6)' } },         // amber-600
    { types: ['boolean'], style: { color: 'rgb(79 70 229)' } },        // primary-600
    { types: ['null'], style: { color: 'rgb(148 163 184)' } },         // slate-400
    { types: ['punctuation', 'operator'], style: { color: 'rgb(100 116 139)' } }, // slate-500
    { types: ['keyword'], style: { color: 'rgb(79 70 229)' } },        // primary-600
    { types: ['function'], style: { color: 'rgb(67 56 202)' } },       // primary-700
    { types: ['comment'], style: { color: 'rgb(148 163 184)', fontStyle: 'italic' } }, // slate-400
    { types: ['tag', 'attr-name'], style: { color: 'rgb(67 56 202)' } }, // primary-700
    { types: ['parameter'], style: { color: 'rgb(217 119 6)', fontStyle: 'italic' } }, // amber-600
    { types: ['variable'], style: { color: 'rgb(5 150 105)' } },       // emerald-600
    { types: ['builtin', 'class-name'], style: { color: 'rgb(217 119 6)' } }, // amber-600
  ],
};

const darkTheme: PrismTheme = {
  plain: { color: 'rgb(203 213 225)' },          // slate-300
  styles: [
    { types: ['property'], style: { color: 'rgb(165 180 252)' } },     // primary-300
    { types: ['string', 'attr-value'], style: { color: 'rgb(52 211 153)' } }, // emerald-400
    { types: ['number'], style: { color: 'rgb(251 191 36)' } },        // amber-400
    { types: ['boolean'], style: { color: 'rgb(129 140 248)' } },      // primary-400
    { types: ['null'], style: { color: 'rgb(100 116 139)' } },         // slate-500
    { types: ['punctuation', 'operator'], style: { color: 'rgb(148 163 184)' } }, // slate-400
    { types: ['keyword'], style: { color: 'rgb(129 140 248)' } },      // primary-400
    { types: ['function'], style: { color: 'rgb(165 180 252)' } },     // primary-300
    { types: ['comment'], style: { color: 'rgb(100 116 139)', fontStyle: 'italic' } }, // slate-500
    { types: ['tag', 'attr-name'], style: { color: 'rgb(165 180 252)' } }, // primary-300
    { types: ['parameter'], style: { color: 'rgb(251 191 36)', fontStyle: 'italic' } }, // amber-400
    { types: ['variable'], style: { color: 'rgb(52 211 153)' } },      // emerald-400
    { types: ['builtin', 'class-name'], style: { color: 'rgb(251 191 36)' } }, // amber-400
  ],
};

interface CodeBlockProps {
  code: string;
  language: 'json' | 'bash' | 'php' | 'xml';
  bare?: boolean;
}

export function CodeBlock({ code, language, bare }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const { isDark } = useTheme();

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  const theme = useMemo(() => isDark ? darkTheme : lightTheme, [isDark]);

  return (
    <Highlight theme={theme} code={code} language={language}>
      {({ style, tokens, getLineProps, getTokenProps }) => (
        <div
          className={`relative group ${bare ? '' : 'rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50'}`}
          style={{ ...style, background: undefined }}
        >
          <button
            type="button"
            onClick={handleCopy}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 text-xs rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <pre className={`${bare ? 'p-0' : 'p-4'} overflow-x-auto text-xs leading-relaxed font-mono`}>
            <code>
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })}>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))}
            </code>
          </pre>
        </div>
      )}
    </Highlight>
  );
}
