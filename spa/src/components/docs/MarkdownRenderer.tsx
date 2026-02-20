import { useState, useRef, useCallback } from 'react';
import Markdown from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose-doc max-w-4xl">
      <Markdown
        components={{
          h1: ({ children }) => (
            <h1 id={slugify(children)} className="text-3xl font-bold mt-0 mb-6 text-slate-900 dark:text-white">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 id={slugify(children)} className="text-2xl font-semibold mt-10 mb-4 text-slate-900 dark:text-white pb-2">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 id={slugify(children)} className="text-xl font-semibold mt-8 mb-3 text-slate-900 dark:text-white">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 id={slugify(children)} className="text-lg font-medium mt-6 mb-2 text-slate-900 dark:text-white">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="mb-4 text-slate-700 dark:text-slate-300 leading-relaxed">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="mb-4 ml-6 list-disc text-slate-700 dark:text-slate-300 space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 ml-6 list-decimal text-slate-700 dark:text-slate-300 space-y-1">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">{children}</li>
          ),
          a: ({ href, children }) => (
            <a href={href} className="text-primary-600 dark:text-primary-400 underline hover:text-primary-700 dark:hover:text-primary-300" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          code: ({ className, children }) => {
            const isBlock = className?.startsWith('language-');
            if (isBlock) {
              return (
                <code className="block bg-slate-100 dark:bg-slate-800 rounded-lg p-4 mb-4 text-sm font-mono overflow-x-auto text-slate-800 dark:text-slate-200 whitespace-pre">
                  {children}
                </code>
              );
            }
            return (
              <code className="bg-slate-100 dark:bg-slate-800 rounded px-1.5 py-0.5 text-sm font-mono text-slate-800 dark:text-slate-200">
                {children}
              </code>
            );
          },
          pre: DocPre,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary-300 dark:border-primary-600 pl-4 mb-4 text-slate-600 dark:text-slate-400 italic">
              {children}
            </blockquote>
          ),
          hr: () => (
            <hr className="my-8 border-slate-200 dark:border-slate-700" />
          ),
          table: ({ children }) => (
            <div className="mb-4 overflow-x-auto">
              <table className="min-w-full border border-slate-200 dark:border-slate-700 text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-slate-200 dark:border-slate-700 px-3 py-2 text-slate-700 dark:text-slate-300">
              {children}
            </td>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-slate-900 dark:text-white">{children}</strong>
          ),
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}

function DocPre({ children }: { children?: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);

  const handleCopy = useCallback(() => {
    const text = preRef.current?.textContent ?? '';
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  return (
    <div className="relative group mb-4">
      <button
        type="button"
        onClick={handleCopy}
        className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 text-xs rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
      <pre ref={preRef}>{children}</pre>
    </div>
  );
}

function slugify(children: React.ReactNode): string {
  const text = extractText(children);
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function extractText(node: React.ReactNode): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (node && typeof node === 'object' && 'props' in node) {
    return extractText((node as React.ReactElement<{ children?: React.ReactNode }>).props.children);
  }
  return '';
}
