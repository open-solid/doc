import { useEffect, useRef, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Endpoint, OpenApiSpec } from '../../openapi';
import { useArchData } from '../../hooks/useArchData';
import { useApiTester } from './useApiTester';
import { RequestHistory } from './RequestHistory';
import { RequestBuilder } from './RequestBuilder';
import { ResponseViewer } from './ResponseViewer';

interface ApiTesterModalProps {
  endpoint: Endpoint;
  spec: OpenApiSpec;
  onClose: () => void;
}

interface ResizeHandleProps {
  onDrag: (deltaX: number) => void;
}

function ResizeHandle({ onDrag }: ResizeHandleProps) {
  const onDragRef = useRef(onDrag);
  onDragRef.current = onDrag;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    let lastX = e.clientX;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - lastX;
      lastX = moveEvent.clientX;
      onDragRef.current(dx);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  return (
    <div
      onMouseDown={handleMouseDown}
      className="shrink-0 w-[5px] h-full cursor-col-resize bg-transparent hover:bg-primary-300/40 dark:hover:bg-primary-500/20 active:bg-primary-400/50 dark:active:bg-primary-500/30 transition-colors relative"
    >
      <div className="absolute inset-y-0 -left-[2px] -right-[2px]" />
    </div>
  );
}

function ApiTesterModalContent({ endpoint, spec, onClose }: ApiTesterModalProps) {
  const { data } = useArchData();
  const tester = useApiTester(endpoint, spec);
  const urlInputRef = useRef<HTMLInputElement | null>(null);
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Panel widths as fractions of total container width
  const [panelWidths, setPanelWidths] = useState<[number, number, number]>([280, -1, -1]);
  const widthsRef = useRef(panelWidths);
  widthsRef.current = panelWidths;


  // Body scroll lock
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Focus URL input on open
  useEffect(() => {
    urlInputRef.current?.focus();
  }, []);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      tester.sendRequest();
    }
  }, [onClose, tester]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose();
  }, [onClose]);

  // Resolve current widths to pixel values
  const resolveWidths = useCallback((): [number, number, number] => {
    const container = containerRef.current;
    if (!container) return [280, 400, 400];
    const cur = widthsRef.current;
    const totalW = container.offsetWidth;
    const handleW = 10; // two 5px handles
    const historyW = cur[0];
    const flexW = totalW - historyW - handleW;
    const requestW = cur[1] === -1 ? flexW / 2 : cur[1];
    const responseW = cur[2] === -1 ? flexW / 2 : cur[2];
    return [historyW, requestW, responseW];
  }, []);

  // Resize handle 0: between history & request
  const handleResize0 = useCallback((dx: number) => {
    const [historyW, requestW, responseW] = resolveWidths();
    const newHistory = Math.max(180, Math.min(400, historyW + dx));
    const consumed = newHistory - historyW;
    const newRequest = Math.max(200, requestW - consumed);

    setPanelWidths([newHistory, newRequest, responseW]);
  }, [resolveWidths]);

  // Resize handle 1: between request & response
  const handleResize1 = useCallback((dx: number) => {
    const [historyW, requestW, responseW] = resolveWidths();
    const total = requestW + responseW;
    const newRequest = Math.max(200, Math.min(total - 200, requestW + dx));
    const newResponse = total - newRequest;

    setPanelWidths([historyW, newRequest, newResponse]);
  }, [resolveWidths]);

  // Compute styles
  const historyStyle = { width: panelWidths[0], flexShrink: 0 };
  const requestStyle = panelWidths[1] === -1 ? { flex: 1 } : { width: panelWidths[1], flexShrink: 0 };
  const responseStyle = panelWidths[2] === -1 ? { flex: 1 } : { width: panelWidths[2], flexShrink: 0 };

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm modal-backdrop-enter"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-[95vw] h-[90vh] max-w-[1600px] bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700/50 flex flex-col overflow-hidden modal-panel-enter">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-200">{data?.meta.project ?? 'API Tester'}</h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">{data?.meta.company ?? ''}</span>

            {/* History toggle for small screens */}
            <button
              type="button"
              onClick={() => setShowHistory(s => !s)}
              className="lg:hidden text-xs px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
            >
              History
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 hidden sm:block">Esc to close &middot; Ctrl+Enter to send</span>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 3-panel resizable layout */}
        <div ref={containerRef} className="flex-1 min-h-0 flex">
          {/* History panel */}
          <div
            style={historyStyle}
            className={`border-r border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 min-h-0 overflow-hidden ${
              showHistory ? 'block absolute inset-0 top-[53px] z-10 md:relative md:inset-auto md:z-auto' : 'hidden lg:block'
            }`}
          >
            <RequestHistory
              history={tester.history}
              search={tester.historySearch}
              onSearchChange={tester.setHistorySearch}
              onSelect={(id) => { tester.selectHistoryEntry(id); setShowHistory(false); }}
              activeEntryId={tester.activeHistoryId}
            />
          </div>

          {/* Resize handle: history | request */}
          <div className="hidden lg:flex h-full">
            <ResizeHandle onDrag={handleResize0} />
          </div>

          {/* Request builder */}
          <div style={requestStyle} className="min-h-0 min-w-0 overflow-hidden">
            <RequestBuilder
              method={tester.request.method}
              url={tester.request.url}
              pathParams={tester.request.pathParams}
              queryParams={tester.request.queryParams}
              headers={tester.request.headers}
              body={tester.request.body}
              sending={tester.sending}
              onMethodChange={tester.setMethod}
              onUrlChange={tester.setUrl}
              onPathParamsChange={tester.setPathParams}
              onQueryParamsChange={tester.setQueryParams}
              onHeadersChange={tester.setHeaders}
              onBodyChange={tester.setBody}
              onSend={tester.sendRequest}
              urlInputRef={urlInputRef}
              examples={tester.examples}
              selectedExampleKey={tester.selectedExampleKey}
              onExampleSelect={tester.selectExample}
            />
          </div>

          {/* Resize handle: request | response */}
          <ResizeHandle onDrag={handleResize1} />

          {/* Response viewer */}
          <div style={responseStyle} className="min-h-0 min-w-0 overflow-hidden p-3">
            <div className="h-full bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
              <ResponseViewer
                response={tester.response}
                error={tester.error}
                sending={tester.sending}
                formatSize={tester.formatSize}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ApiTesterModal(props: ApiTesterModalProps) {
  return createPortal(<ApiTesterModalContent {...props} />, document.body);
}
