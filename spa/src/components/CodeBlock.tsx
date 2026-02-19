import { useState, useCallback } from 'react';

interface Token {
  type: string;
  value: string;
}

function tokenizeJson(code: string): Token[] {
  const tokens: Token[] = [];
  const regex = /("(?:\\.|[^"\\])*")\s*:|("(?:\\.|[^"\\])*")|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|(\btrue\b|\bfalse\b)|(\bnull\b)|([{}[\],:])|(\s+)/g;
  let match: RegExpExecArray | null;
  let lastIndex = 0;

  while ((match = regex.exec(code)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', value: code.slice(lastIndex, match.index) });
    }

    if (match[1]) {
      tokens.push({ type: 'key', value: match[1] });
      tokens.push({ type: 'punctuation', value: ':' });
    } else if (match[2]) {
      tokens.push({ type: 'string', value: match[2] });
    } else if (match[3]) {
      tokens.push({ type: 'number', value: match[3] });
    } else if (match[4]) {
      tokens.push({ type: 'boolean', value: match[4] });
    } else if (match[5]) {
      tokens.push({ type: 'null', value: match[5] });
    } else if (match[6]) {
      tokens.push({ type: 'punctuation', value: match[6] });
    } else if (match[7]) {
      tokens.push({ type: 'text', value: match[7] });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < code.length) {
    tokens.push({ type: 'text', value: code.slice(lastIndex) });
  }

  return tokens;
}

function tokenizeBash(code: string): Token[] {
  const tokens: Token[] = [];
  const regex = /(\bcurl\b)|(--?\w[\w-]*)|(["'](?:\\.|[^"'\\])*["'])|(https?:\/\/[^\s"']+)|(\s+)|(\S+)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(code)) !== null) {
    if (match[1]) {
      tokens.push({ type: 'keyword', value: match[1] });
    } else if (match[2]) {
      tokens.push({ type: 'flag', value: match[2] });
    } else if (match[3]) {
      tokens.push({ type: 'string', value: match[3] });
    } else if (match[4]) {
      tokens.push({ type: 'url', value: match[4] });
    } else if (match[5]) {
      tokens.push({ type: 'text', value: match[5] });
    } else if (match[6]) {
      tokens.push({ type: 'text', value: match[6] });
    }
  }

  return tokens;
}

const TOKEN_COLORS: Record<string, string> = {
  key: 'text-purple-400',
  string: 'text-green-400',
  number: 'text-orange-400',
  boolean: 'text-orange-400',
  null: 'text-red-400',
  punctuation: 'text-slate-500',
  keyword: 'text-cyan-400',
  flag: 'text-yellow-400',
  url: 'text-blue-400',
  text: 'text-slate-300',
};

interface CodeBlockProps {
  code: string;
  language: 'json' | 'bash';
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  const tokens = language === 'json' ? tokenizeJson(code) : tokenizeBash(code);

  return (
    <div className="relative group rounded-lg bg-slate-900 dark:bg-slate-950">
      <button
        type="button"
        onClick={handleCopy}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 text-xs rounded bg-slate-700 hover:bg-slate-600 text-slate-300"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
      <pre className="p-4 overflow-x-auto text-sm leading-relaxed font-mono">
        <code>
          {tokens.map((token, i) => (
            <span key={i} className={TOKEN_COLORS[token.type] ?? 'text-slate-300'}>
              {token.value}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
