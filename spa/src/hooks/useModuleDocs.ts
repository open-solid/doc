import { createContext, useContext } from 'react';
import type { DocsNavItem } from '../types';

export interface ModuleDocsContextValue {
  getModuleDocs: (moduleName: string) => DocsNavItem[];
}

export const ModuleDocsContext = createContext<ModuleDocsContextValue | null>(null);

export function useModuleDocs() {
  const ctx = useContext(ModuleDocsContext);
  if (!ctx) throw new Error('useModuleDocs must be used within ModuleDocsProvider');
  return ctx;
}
