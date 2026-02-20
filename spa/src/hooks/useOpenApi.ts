import { createContext, useContext } from 'react';
import type { Endpoint, OpenApiSpec } from '../openapi';

export interface OpenApiContextValue {
  endpointsByModule: Map<string, Endpoint[]>;
  spec: OpenApiSpec | null;
  loading: boolean;
  refresh: () => Promise<boolean>;
}

export const OpenApiContext = createContext<OpenApiContextValue | null>(null);

export function useOpenApi() {
  const ctx = useContext(OpenApiContext);
  if (!ctx) throw new Error('useOpenApi must be used within OpenApiProvider');
  return ctx;
}
