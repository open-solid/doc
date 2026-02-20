import { useState, useEffect, useCallback, type ReactNode } from 'react';
import type { OpenApiSpec, Endpoint, HttpMethod } from '../openapi';
import { OpenApiContext } from '../hooks/useOpenApi';

const HTTP_METHODS: HttpMethod[] = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];

function parseSpec(spec: OpenApiSpec): Map<string, Endpoint[]> {
  const map = new Map<string, Endpoint[]>();

  for (const [path, pathItem] of Object.entries(spec.paths)) {
    for (const method of HTTP_METHODS) {
      const operation = pathItem[method];
      if (!operation) continue;

      const endpoint: Endpoint = {
        method,
        path,
        summary: operation.summary,
        description: operation.description,
        deprecated: operation.deprecated,
        parameters: operation.parameters ?? [],
        requestBody: operation.requestBody,
        responses: operation.responses ?? {},
        tags: operation.tags ?? [],
      };

      for (const tag of endpoint.tags) {
        const existing = map.get(tag) ?? [];
        existing.push(endpoint);
        map.set(tag, existing);
      }
    }
  }

  return map;
}

export function OpenApiProvider({ children }: { children: ReactNode }) {
  const [endpointsByModule, setEndpointsByModule] = useState<Map<string, Endpoint[]>>(new Map());
  const [spec, setSpec] = useState<OpenApiSpec | null>(null);
  const [loading, setLoading] = useState(true);

  const config = window.__ARCH_CONFIG__;

  const fetchSpec = useCallback(async () => {
    try {
      const res = await fetch(config.openapiJsonUrl);
      if (!res.ok) {
        // OpenAPI is optional — 404 is fine
        return;
      }
      const json: OpenApiSpec = await res.json();
      setSpec(json);
      setEndpointsByModule(parseSpec(json));
    } catch {
      // Silently ignore — OpenAPI is optional
    } finally {
      setLoading(false);
    }
  }, [config.openapiJsonUrl]);

  useEffect(() => {
    fetchSpec();
  }, [fetchSpec]);

  const refresh = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch(config.openapiJsonUpdateUrl, { method: 'POST' });
      const result = await res.json();
      if (result.success) {
        await fetchSpec();
        return true;
      }
    } catch {
      // Silently ignore — OpenAPI is optional
    }
    return false;
  }, [config.openapiJsonUpdateUrl, fetchSpec]);

  return (
    <OpenApiContext.Provider value={{ endpointsByModule, spec, loading, refresh }}>
      {children}
    </OpenApiContext.Provider>
  );
}
