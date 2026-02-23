import { useState, useCallback, useMemo } from 'react';
import type { Endpoint, OpenApiSpec } from '../../openapi';
import { generateExampleJson, resolveSchema } from '../../utils/schema';

export interface KeyValuePair {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export type BodyFormat = 'json' | 'xml';

export interface RequestState {
  method: string;
  url: string;
  pathParams: KeyValuePair[];
  queryParams: KeyValuePair[];
  headers: KeyValuePair[];
  bodyFormat: BodyFormat;
  body: string;
}

export interface ResponseState {
  status: number;
  statusText: string;
  timeMs: number;
  sizeBytes: number;
  headers: [string, string][];
  cookies: string[];
  body: string;
  bodyFormat: string;
  requestSnapshot: { method: string; url: string; headers: [string, string][]; body: string };
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  method: string;
  path: string;
  request: RequestState;
  response?: ResponseState;
  error?: string;
}

let nextId = 1;
function uid(): string {
  return String(nextId++);
}

function makePair(key: string, value: string, enabled = true): KeyValuePair {
  return { id: uid(), key, value, enabled };
}

function detectRequestContentType(endpoint: Endpoint): string | null {
  const content = endpoint.requestBody?.content;
  if (!content) return null;
  if (content['application/json']) return 'application/json';
  if (content['application/ld+json']) return 'application/ld+json';
  if (content['application/merge-patch+json']) return 'application/merge-patch+json';
  return null;
}

function detectResponseContentType(endpoint: Endpoint): string {
  // Look at the first 2xx response, then fall back to any response
  const codes = Object.keys(endpoint.responses);
  const successCode = codes.find(c => c.startsWith('2')) ?? codes[0];
  const response = successCode ? endpoint.responses[successCode] : undefined;
  const content = response?.content;
  if (content) {
    const mediaType = Object.keys(content)[0];
    if (mediaType) return mediaType;
  }
  return 'application/json';
}

function buildInitialRequest(endpoint: Endpoint, baseUrl: string, spec: OpenApiSpec): RequestState {
  const origin = baseUrl && baseUrl !== '/' ? baseUrl.replace(/\/$/, '') : window.location.origin;
  const url = `${origin}${endpoint.path}`;

  const pathParams: KeyValuePair[] = [];
  const queryParams: KeyValuePair[] = [];
  const headers: KeyValuePair[] = [];

  for (const param of endpoint.parameters) {
    if (param.in === 'path') {
      pathParams.push(makePair(param.name, '', true));
    } else if (param.in === 'query') {
      queryParams.push(makePair(param.name, '', !param.required ? false : true));
    } else if (param.in === 'header') {
      headers.push(makePair(param.name, '', true));
    }
  }

  const contentType = detectRequestContentType(endpoint);
  if (contentType) {
    headers.unshift(makePair('Content-Type', contentType, true));
  }
  headers.push(makePair('Accept', contentType ?? detectResponseContentType(endpoint), true));

  let body = '';
  const bodyContent = endpoint.requestBody?.content;
  const bodyEntry = bodyContent?.['application/json']
    ?? bodyContent?.['application/ld+json']
    ?? bodyContent?.['application/merge-patch+json'];
  if (bodyEntry?.schema) {
    const resolved = resolveSchema(bodyEntry.schema, spec);
    body = JSON.stringify(generateExampleJson(resolved, spec), null, 2);
  }

  return {
    method: endpoint.method.toUpperCase(),
    url,
    pathParams,
    queryParams,
    headers,
    bodyFormat: 'json',
    body,
  };
}

function buildFinalUrl(request: RequestState): string {
  let url = request.url;

  for (const p of request.pathParams) {
    if (p.enabled && p.value) {
      url = url.replace(`{${p.key}}`, encodeURIComponent(p.value));
    }
  }

  const queryParts = request.queryParams
    .filter(p => p.enabled && p.key)
    .map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`);

  if (queryParts.length > 0) {
    url += `?${queryParts.join('&')}`;
  }

  return url;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function detectBodyFormat(contentType: string): string {
  if (contentType.includes('json')) return 'json';
  if (contentType.includes('xml') || contentType.includes('html')) return 'xml';
  return 'text';
}

function prettyPrintBody(body: string, format: string): string {
  if (format === 'json') {
    try {
      return JSON.stringify(JSON.parse(body), null, 2);
    } catch {
      return body;
    }
  }
  return body;
}

export interface UseApiTesterReturn {
  request: RequestState;
  response: ResponseState | null;
  history: HistoryEntry[];
  historySearch: string;
  activeHistoryId: string | null;
  sending: boolean;
  error: string | null;
  setMethod: (method: string) => void;
  setUrl: (url: string) => void;
  setPathParams: (params: KeyValuePair[]) => void;
  setQueryParams: (params: KeyValuePair[]) => void;
  setHeaders: (headers: KeyValuePair[]) => void;
  setBodyFormat: (format: BodyFormat) => void;
  setBody: (body: string) => void;
  setHistorySearch: (search: string) => void;
  sendRequest: () => Promise<void>;
  selectHistoryEntry: (id: string) => void;
  formatSize: (bytes: number) => string;
}

export function useApiTester(endpoint: Endpoint, spec: OpenApiSpec): UseApiTesterReturn {
  const baseUrl = spec.servers?.[0]?.url ?? '';
  const initial = useMemo(() => buildInitialRequest(endpoint, baseUrl, spec), [endpoint, baseUrl, spec]);

  const [request, setRequest] = useState<RequestState>(initial);
  const [response, setResponse] = useState<ResponseState | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historySearch, setHistorySearch] = useState('');
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setMethod = useCallback((method: string) => {
    setRequest(prev => ({ ...prev, method }));
  }, []);

  const setUrl = useCallback((url: string) => {
    setRequest(prev => ({ ...prev, url }));
  }, []);

  const setPathParams = useCallback((pathParams: KeyValuePair[]) => {
    setRequest(prev => ({ ...prev, pathParams }));
  }, []);

  const setQueryParams = useCallback((queryParams: KeyValuePair[]) => {
    setRequest(prev => ({ ...prev, queryParams }));
  }, []);

  const setHeaders = useCallback((headers: KeyValuePair[]) => {
    setRequest(prev => ({ ...prev, headers }));
  }, []);

  const setBodyFormat = useCallback((bodyFormat: BodyFormat) => {
    setRequest(prev => ({ ...prev, bodyFormat }));
  }, []);

  const setBody = useCallback((body: string) => {
    setRequest(prev => ({ ...prev, body }));
  }, []);

  const sendRequest = useCallback(async () => {
    setSending(true);
    setError(null);

    const finalUrl = buildFinalUrl(request);
    const headerPairs: [string, string][] = request.headers
      .filter(h => h.enabled && h.key)
      .map(h => [h.key, h.value]);

    const fetchHeaders: Record<string, string> = {};
    for (const [k, v] of headerPairs) {
      fetchHeaders[k] = v;
    }

    const hasBody = request.body && !['GET', 'HEAD'].includes(request.method);

    const snapshot = {
      method: request.method,
      url: finalUrl,
      headers: headerPairs,
      body: hasBody ? request.body : '',
    };

    const start = performance.now();

    try {
      const res = await fetch(finalUrl, {
        method: request.method,
        headers: fetchHeaders,
        body: hasBody ? request.body : undefined,
      });
      const elapsed = Math.round(performance.now() - start);
      const bodyText = await res.text();
      const contentType = res.headers.get('content-type') ?? '';
      const bodyFmt = detectBodyFormat(contentType);

      const resHeaders: [string, string][] = [];
      res.headers.forEach((v, k) => resHeaders.push([k, v]));

      const cookies: string[] = [];
      const setCookie = res.headers.get('set-cookie');
      if (setCookie) cookies.push(setCookie);

      const responseState: ResponseState = {
        status: res.status,
        statusText: res.statusText,
        timeMs: elapsed,
        sizeBytes: new Blob([bodyText]).size,
        headers: resHeaders,
        cookies,
        body: prettyPrintBody(bodyText, bodyFmt),
        bodyFormat: bodyFmt,
        requestSnapshot: snapshot,
      };

      setResponse(responseState);

      const entry: HistoryEntry = {
        id: uid(),
        timestamp: Date.now(),
        method: request.method,
        path: endpoint.path,
        request: { ...request },
        response: responseState,
      };
      setHistory(prev => [entry, ...prev]);
      setActiveHistoryId(entry.id);
    } catch (err) {
      const elapsed = Math.round(performance.now() - start);
      const message = err instanceof TypeError
        ? 'Network error — this is likely a CORS issue. Try using the cURL command instead.'
        : `Request failed: ${err instanceof Error ? err.message : String(err)}`;

      setError(message);
      setResponse(null);

      const entry: HistoryEntry = {
        id: uid(),
        timestamp: Date.now(),
        method: request.method,
        path: endpoint.path,
        request: { ...request },
        error: message,
        response: {
          status: 0,
          statusText: 'Error',
          timeMs: elapsed,
          sizeBytes: 0,
          headers: [],
          cookies: [],
          body: '',
          bodyFormat: 'text',
          requestSnapshot: snapshot,
        },
      };
      setHistory(prev => [entry, ...prev]);
      setActiveHistoryId(entry.id);
    } finally {
      setSending(false);
    }
  }, [request, endpoint.path]);

  const selectHistoryEntry = useCallback((id: string) => {
    const entry = history.find(h => h.id === id);
    if (!entry) return;
    setActiveHistoryId(id);
    setRequest(entry.request);
    setResponse(entry.response ?? null);
    setError(entry.error ?? null);
  }, [history]);

  return {
    request,
    response,
    history,
    historySearch,
    activeHistoryId,
    sending,
    error,
    setMethod,
    setUrl,
    setPathParams,
    setQueryParams,
    setHeaders,
    setBodyFormat,
    setBody,
    setHistorySearch,
    sendRequest,
    selectHistoryEntry,
    formatSize,
  };
}
