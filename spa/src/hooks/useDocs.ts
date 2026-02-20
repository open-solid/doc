import { createContext, useContext } from 'react';
import type { DocsNavItem } from '../types';

export interface DocsContextValue {
  navigation: DocsNavItem[];
  loadingNav: boolean;
  content: string | null;
  loadingContent: boolean;
  fetchContent: (path: string) => Promise<void>;
}

export const DocsContext = createContext<DocsContextValue | null>(null);

export function useDocs() {
  const ctx = useContext(DocsContext);
  if (!ctx) throw new Error('useDocs must be used within DocsProvider');
  return ctx;
}
