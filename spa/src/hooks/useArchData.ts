import { createContext, useContext } from 'react';
import type { ArchData } from '../types';

export interface ArchDataContextValue {
  data: ArchData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  toastMessage: { text: string; success: boolean } | null;
  clearToast: () => void;
  findEventLocation: (eventClass: string) => { context: string; module: string } | null;
  findCallDescription: (targetClass: string, callType: string) => string | null;
}

export const ArchDataContext = createContext<ArchDataContextValue | null>(null);

export function useArchData() {
  const ctx = useContext(ArchDataContext);
  if (!ctx) throw new Error('useArchData must be used within ArchDataProvider');
  return ctx;
}
