import { useState, useCallback, useMemo, useEffect } from 'react';
import type { Endpoint, HttpMethod, OpenApiSpec } from '../../openapi';
import { generateExampleJson, resolveSchema, compilePathPatterns, matchUrlToPath, getRequestBodyExamples, getRequestBodySchema } from '../../utils/schema';
import type { NamedExample } from '../../utils/schema';
import type { SchemaObject } from '../../openapi';

const METHODS_WITH_BODY = new Set(['POST', 'PUT', 'PATCH']);

export interface KeyValuePair {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface RequestState {
  method: string;
  url: string;
  pathParams: KeyValuePair[];
  queryParams: KeyValuePair[];
  headers: KeyValuePair[];
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

function extractPlaceholders(url: string): string[] {
  const names: string[] = [];
  const pattern = /\{([^}]+)\}/g;
  let match;
  while ((match = pattern.exec(url)) !== null) {
    const name = match[1]!;
    if (!names.includes(name)) {
      names.push(name);
    }
  }
  return names;
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
  headers.push(makePair('Accept', detectResponseContentType(endpoint), true));

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

const STATUS_TEXTS: Record<number, string> = {
  200: 'OK', 201: 'Created', 202: 'Accepted', 204: 'No Content',
  301: 'Moved Permanently', 302: 'Found', 304: 'Not Modified',
  400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden',
  404: 'Not Found', 405: 'Method Not Allowed', 409: 'Conflict',
  415: 'Unsupported Media Type', 422: 'Unprocessable Entity', 429: 'Too Many Requests',
  500: 'Internal Server Error', 502: 'Bad Gateway', 503: 'Service Unavailable',
};

function resolveStatusText(status: number, statusText: string): string {
  return statusText || (STATUS_TEXTS[status] ?? '');
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
  setBody: (body: string) => void;
  setHistorySearch: (search: string) => void;
  sendRequest: () => Promise<void>;
  selectHistoryEntry: (id: string) => void;
  formatSize: (bytes: number) => string;
  examples: NamedExample[];
  selectedExampleKey: string | null;
  selectExample: (example: NamedExample) => void;
  bodySchema: SchemaObject | null;
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
  const compiledPatterns = useMemo(() => compilePathPatterns(Object.keys(spec.paths)), [spec]);

  const setMethod = useCallback((method: string) => {
    setRequest(prev => {
      const updated = { ...prev, method };

      // When switching to a body method, ensure Content-Type header is present
      if (METHODS_WITH_BODY.has(method)) {
        const hasContentType = prev.headers.some(h => h.key.toLowerCase() === 'content-type');
        if (!hasContentType) {
          // Look up the operation for the target method in the spec
          const matchedPath = matchUrlToPath(prev.url, baseUrl, compiledPatterns);
          const operation = matchedPath ? spec.paths[matchedPath]?.[method.toLowerCase() as HttpMethod] : null;
          const contentType = operation?.requestBody
            ? detectRequestContentType({ requestBody: operation.requestBody } as Endpoint)
            : null;
          updated.headers = [makePair('Content-Type', contentType ?? 'application/json', true), ...prev.headers];
        }
      }

      return updated;
    });
  }, [baseUrl, compiledPatterns, spec]);

  const setUrl = useCallback((url: string) => {
    setRequest(prev => {
      const newNames = extractPlaceholders(url);
      const existing = new Map(prev.pathParams.map(p => [p.key, p]));
      const pathParams = newNames.map(name =>
        existing.get(name) ?? makePair(name, '', true)
      );
      return { ...prev, url, pathParams };
    });
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
        statusText: resolveStatusText(res.status, res.statusText),
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

  // Examples support
  const [selectedExampleKey, setSelectedExampleKey] = useState<string | null>(null);

  const examples = useMemo(() => {
    const matchedPath = matchUrlToPath(request.url, baseUrl, compiledPatterns);
    if (!matchedPath) return [];
    return getRequestBodyExamples(spec, matchedPath, request.method);
  }, [request.url, request.method, baseUrl, compiledPatterns, spec]);

  const bodySchema = useMemo(() => {
    const matchedPath = matchUrlToPath(request.url, baseUrl, compiledPatterns);
    if (!matchedPath) return null;
    return getRequestBodySchema(spec, matchedPath, request.method);
  }, [request.url, request.method, baseUrl, compiledPatterns, spec]);

  // Clear selection when examples change and the selected key is no longer available
  useEffect(() => {
    if (selectedExampleKey && !examples.some(e => e.key === selectedExampleKey)) {
      setSelectedExampleKey(null);
    }
  }, [examples, selectedExampleKey]);

  const selectExample = useCallback((example: NamedExample) => {
    setSelectedExampleKey(example.key);
    setBody(example.value);
  }, [setBody]);

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
    setBody,
    setHistorySearch,
    sendRequest,
    selectHistoryEntry,
    formatSize,
    examples,
    selectedExampleKey,
    selectExample,
    bodySchema,
  };
}
