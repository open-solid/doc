import { useState, useCallback } from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import { useTheme } from '../hooks/useTheme';

// Register PHP grammar — static imports run in order, and prism-setup
// must come first to expose Prism globally for the component files.
import './prism-setup';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-markup-templating';
import 'prismjs/components/prism-php';

interface CodeBlockProps {
  code: string;
  language: 'json' | 'bash' | 'php';
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const { isDark } = useTheme();

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  const theme = isDark ? themes.nightOwl : themes.github;

  return (
    <Highlight theme={theme} code={code} language={language}>
      {({ style, tokens, getLineProps, getTokenProps }) => (
        <div
          className="relative group rounded-lg bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50"
          style={{ ...style, background: undefined }}
        >
          <button
            type="button"
            onClick={handleCopy}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 text-xs rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <pre className="p-4 overflow-x-auto text-sm leading-relaxed font-mono">
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
