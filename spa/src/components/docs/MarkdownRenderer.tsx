import { useState, useCallback } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '../../hooks/useTheme';
import { MermaidDiagram } from './MermaidDiagram';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose-doc max-w-4xl">
      <Markdown
        remarkPlugins={[remarkGfm]}
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
          code: CodeBlock,
          pre: ({ children }) => <>{children}</>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary-300 dark:border-primary-600 pl-4 mb-4 text-slate-600 dark:text-slate-400 italic">
              {children}
            </blockquote>
          ),
          hr: () => (
            <hr className="my-8 border-slate-200 dark:border-slate-700" />
          ),
          table: ({ children }) => (
            <div className="mb-4 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="min-w-full text-sm border-collapse">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-2.5 text-left font-semibold text-slate-700 dark:text-slate-300 [&:not(:last-child)]:border-r">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-slate-200 dark:border-slate-700 px-4 py-2.5 text-slate-700 dark:text-slate-300 [&:not(:last-child)]:border-r last:[&:parent]:border-b-0">
              {children}
            </td>
          ),
          tr: ({ children }) => (
            <tr className="last:*:border-b-0 even:bg-slate-50 even:dark:bg-slate-800/50">
              {children}
            </tr>
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

function CodeBlock({ className, children }: { className?: string; children?: React.ReactNode }) {
  const { isDark } = useTheme();
  const [copied, setCopied] = useState(false);
  const match = className?.match(/language-(\w+)/);

  const handleCopy = useCallback((code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  if (!match) {
    return (
      <code className="bg-slate-100 dark:bg-slate-800 rounded px-1.5 py-0.5 text-sm font-mono text-slate-800 dark:text-slate-200">
        {children}
      </code>
    );
  }

  const code = String(children).replace(/\n$/, '');

  if (match[1] === 'mermaid') {
    return <MermaidDiagram code={code} />;
  }

  return (
    <div className="relative group mb-4">
      <button
        type="button"
        onClick={() => handleCopy(code)}
        className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 text-xs rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
      <SyntaxHighlighter
        style={isDark ? oneDark : oneLight}
        language={match[1]}
        customStyle={{
          margin: 0,
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          background: isDark ? 'rgb(30 41 59)' : 'rgb(241 245 249)',
        }}
        codeTagProps={{ style: { background: 'transparent' } }}
      >
        {code}
      </SyntaxHighlighter>
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
