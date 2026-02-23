import { useState } from 'react';
import type { ResponseState } from './useApiTester';
import { CodeBlock } from '../CodeBlock';

function statusColor(status: number): string {
  if (status === 0) return 'text-rose-600 dark:text-rose-400';
  if (status < 300) return 'text-emerald-600 dark:text-emerald-400';
  if (status < 500) return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
}

function codeBlockLang(format: string): 'json' | 'xml' | 'bash' {
  if (format === 'json') return 'json';
  if (format === 'xml') return 'xml';
  return 'bash';
}

interface ResponseViewerProps {
  response: ResponseState | null;
  error: string | null;
  sending: boolean;
  formatSize: (bytes: number) => string;
}

type Tab = 'response' | 'request' | 'headers' | 'cookies';

export function ResponseViewer({ response, error, sending, formatSize }: ResponseViewerProps) {
  const [activeTab, setActiveTab] = useState<Tab>('response');

  if (sending) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="spinner mb-3" />
        <p className="text-sm text-slate-400 dark:text-slate-500">Sending request...</p>
      </div>
    );
  }

  if (!response && !error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <svg className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <p className="text-sm text-slate-400 dark:text-slate-500">Send a request to see the response</p>
        <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">Ctrl+Enter to send</p>
      </div>
    );
  }

  if (error && !response) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <svg className="w-10 h-10 text-rose-400 dark:text-rose-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        <p className="text-sm text-rose-600 dark:text-rose-400 font-medium mb-1">Request Failed</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{error}</p>
      </div>
    );
  }

  if (!response) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Status bar */}
      <div className="p-3 flex items-center gap-3">
        <span className={`text-sm font-mono font-semibold ${statusColor(response.status)}`}>
          {response.status} {response.statusText}
        </span>
        <span className="text-slate-300 dark:text-slate-600">&bull;</span>
        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{response.timeMs} ms</span>
        <span className="text-slate-300 dark:text-slate-600">&bull;</span>
        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{formatSize(response.sizeBytes)}</span>
        {error && (
          <span className="text-[11px] text-rose-500 dark:text-rose-400 truncate">{error}</span>
        )}
      </div>

      {/* Tab bar */}
      <div className="px-3 pb-3 flex gap-4">
        {(['response', 'request', 'headers', 'cookies'] as const).map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`text-xs font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-3 pt-0">
        {activeTab === 'response' && (
          response.body ? (
            <CodeBlock code={response.body} language={codeBlockLang(response.bodyFormat)} />
          ) : (
            <p className="text-sm italic text-slate-400 dark:text-slate-500">No response body</p>
          )
        )}

        {activeTab === 'request' && (
          <div className="space-y-3">
            <div>
              <h5 className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Method & URL</h5>
              <p className="text-xs font-mono text-slate-700 dark:text-slate-300 break-all">
                {response.requestSnapshot.method} {response.requestSnapshot.url}
              </p>
            </div>
            {response.requestSnapshot.headers.length > 0 && (
              <div>
                <h5 className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Headers</h5>
                <div className="space-y-0.5">
                  {response.requestSnapshot.headers.map(([k, v], i) => (
                    <div key={i} className="text-xs font-mono">
                      <span className="text-slate-500 dark:text-slate-400">{k}:</span>{' '}
                      <span className="text-slate-700 dark:text-slate-300">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {response.requestSnapshot.body && (
              <div>
                <CodeBlock code={response.requestSnapshot.body} language="json" />
              </div>
            )}
          </div>
        )}

        {activeTab === 'headers' && (
          response.headers.length > 0 ? (
            <div className="border border-slate-200 dark:border-slate-700/50 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60">
                    <th className="text-left px-3 py-1.5 text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase">Header</th>
                    <th className="text-left px-3 py-1.5 text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {response.headers.map(([k, v], i) => (
                    <tr key={i} className="border-t border-slate-100 dark:border-slate-700/50">
                      <td className="px-3 py-1.5 font-mono font-medium text-slate-700 dark:text-slate-300">{k}</td>
                      <td className="px-3 py-1.5 font-mono text-slate-500 dark:text-slate-400 break-all">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm italic text-slate-400 dark:text-slate-500">No response headers available</p>
          )
        )}

        {activeTab === 'cookies' && (
          response.cookies.length > 0 ? (
            <div className="space-y-2">
              {response.cookies.map((cookie, i) => (
                <div key={i} className="text-xs font-mono text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2 rounded break-all">
                  {cookie}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm italic text-slate-400 dark:text-slate-500 mb-1">No cookies</p>
              <p className="text-xs text-slate-300 dark:text-slate-600">
                Note: browsers restrict access to Set-Cookie headers due to CORS
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
