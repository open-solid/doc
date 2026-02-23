import { useState, useRef, useEffect } from 'react';
import type { KeyValuePair, BodyFormat } from './useApiTester';
import { KeyValueEditor } from './KeyValueEditor';

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

const METHOD_SELECT_COLORS: Record<string, string> = {
  GET: 'text-emerald-600 dark:text-emerald-400',
  POST: 'text-primary-600 dark:text-primary-400',
  PUT: 'text-amber-600 dark:text-amber-400',
  PATCH: 'text-amber-600 dark:text-amber-400',
  DELETE: 'text-rose-600 dark:text-rose-400',
};

interface RequestBuilderProps {
  method: string;
  url: string;
  pathParams: KeyValuePair[];
  queryParams: KeyValuePair[];
  headers: KeyValuePair[];
  bodyFormat: BodyFormat;
  body: string;
  hasRequestBody: boolean;
  sending: boolean;
  onMethodChange: (method: string) => void;
  onUrlChange: (url: string) => void;
  onPathParamsChange: (params: KeyValuePair[]) => void;
  onQueryParamsChange: (params: KeyValuePair[]) => void;
  onHeadersChange: (headers: KeyValuePair[]) => void;
  onBodyFormatChange: (format: BodyFormat) => void;
  onBodyChange: (body: string) => void;
  onSend: () => void;
  urlInputRef: React.RefObject<HTMLInputElement | null>;
}

type Tab = 'body' | 'params' | 'headers';

export function RequestBuilder({
  method,
  url,
  pathParams,
  queryParams,
  headers,
  bodyFormat,
  body,
  hasRequestBody,
  sending,
  onMethodChange,
  onUrlChange,
  onPathParamsChange,
  onQueryParamsChange,
  onHeadersChange,
  onBodyFormatChange,
  onBodyChange,
  onSend,
  urlInputRef,
}: RequestBuilderProps) {
  const [activeTab, setActiveTab] = useState<Tab>(hasRequestBody ? 'body' : 'params');
  const selectRef = useRef<HTMLSelectElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);

  // Resize select to fit the selected method text
  useEffect(() => {
    if (measureRef.current && selectRef.current) {
      const style = getComputedStyle(selectRef.current);
      const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      selectRef.current.style.width = `${measureRef.current.offsetWidth + padding}px`;
    }
  }, [method]);

  const pathParamKeys = new Set(pathParams.map(p => p.key));

  const tabs: Tab[] = hasRequestBody ? ['body', 'params', 'headers'] : ['params', 'headers'];

  return (
    <div className="flex flex-col h-full">
      {/* Top bar: method + URL + send as single input */}
      <div className="p-3">
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus-within:border-primary-400 dark:focus-within:border-primary-500 transition-colors">
          <div className="shrink-0 relative flex items-center">
            <span ref={measureRef} className="absolute invisible whitespace-nowrap text-xs font-bold uppercase" aria-hidden="true">{method}</span>
            <select
              ref={selectRef}
              value={method}
              onChange={e => onMethodChange(e.target.value)}
              className={`appearance-none pl-2.5 pr-5 py-1.5 text-xs font-bold uppercase bg-transparent border-none outline-none cursor-pointer ${METHOD_SELECT_COLORS[method] ?? 'text-slate-600'}`}
            >
              {METHODS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <svg className="absolute right-1 w-3 h-3 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 shrink-0" />
          <input
            ref={urlInputRef}
            type="text"
            value={url}
            onChange={e => onUrlChange(e.target.value)}
            className="flex-1 px-3 py-1.5 text-xs font-mono bg-transparent border-none text-slate-700 dark:text-slate-300 outline-none"
          />
          <button
            type="button"
            onClick={onSend}
            disabled={sending}
            className="shrink-0 p-1.5 mr-1 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 disabled:opacity-50 transition-colors"
          >
            {sending ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="px-3 flex items-center gap-4">
        {tabs.map(tab => (
          <div key={tab} className="flex items-center gap-1.5">
            <button
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
            {/* Inline format selector next to Body tab */}
            {tab === 'body' && activeTab === 'body' && (
              <select
                value={bodyFormat}
                onChange={e => onBodyFormatChange(e.target.value as BodyFormat)}
                className="mb-[1px] ml-0.5 px-1 py-0.5 text-[11px] font-medium bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300 outline-none focus:border-primary-400 dark:focus:border-primary-500 transition-colors"
              >
                <option value="json">JSON</option>
                <option value="xml">XML</option>
              </select>
            )}
          </div>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {activeTab === 'body' && (
          <textarea
            value={body}
            onChange={e => onBodyChange(e.target.value)}
            rows={16}
            spellCheck={false}
            className="w-full h-full min-h-[200px] p-3 text-xs font-mono bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-lg text-slate-700 dark:text-slate-300 outline-none focus:border-primary-400 dark:focus:border-primary-500 resize-none transition-colors"
          />
        )}

        {activeTab === 'params' && (
          <>
            {pathParams.length > 0 && (
              <div>
                <h5 className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Path Parameters</h5>
                <KeyValueEditor pairs={pathParams} onChange={onPathParamsChange} readOnlyKeys={pathParamKeys} />
              </div>
            )}
            <div>
              <KeyValueEditor pairs={queryParams} onChange={onQueryParamsChange} />
            </div>
          </>
        )}

        {activeTab === 'headers' && (
          <div>
            <KeyValueEditor pairs={headers} onChange={onHeadersChange} />
          </div>
        )}
      </div>
    </div>
  );
}
