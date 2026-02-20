import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import type { ArchData } from '../types';
import { ArchDataContext } from '../hooks/useArchData';

export function ArchDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ArchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; success: boolean } | null>(null);
  const dataRef = useRef<ArchData | null>(null);

  const config = window.__ARCH_CONFIG__;

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(config.archJsonUrl);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const message = body?.error ?? `Failed to load project data (${res.status}).`;
        setData(null);
        dataRef.current = null;
        setError(message);
        return;
      }
      const json: ArchData = await res.json();
      setData(json);
      dataRef.current = json;
      setError(null);
    } catch {
      setError('Failed to load project data.');
    } finally {
      setLoading(false);
    }
  }, [config.archJsonUrl]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(config.archJsonUpdateUrl, { method: 'POST' });
      const result = await res.json();
      if (result.success) {
        setToastMessage({ text: 'Project data updated successfully!', success: true });
        await fetchData();
      } else {
        setToastMessage({ text: 'Failed to update project data.', success: false });
      }
    } catch {
      setToastMessage({ text: 'Error updating project data.', success: false });
    }
  }, [config.archJsonUpdateUrl, fetchData]);

  const clearToast = useCallback(() => setToastMessage(null), []);

  const findEventLocation = useCallback((eventClass: string) => {
    const d = dataRef.current;
    if (!d) return null;
    for (const ctx of d.contexts) {
      for (const mod of ctx.modules) {
        if (mod.domainEvents?.some(e => e.class === eventClass)) {
          return { context: ctx.name, module: mod.name };
        }
      }
    }
    return null;
  }, []);

  const findCallDescription = useCallback((targetClass: string, callType: string) => {
    const d = dataRef.current;
    if (!d) return null;
    const key = callType === 'query' ? 'queries' : 'commands';
    for (const ctx of d.contexts) {
      for (const mod of ctx.modules) {
        const items = mod[key as 'queries' | 'commands'];
        const item = items?.find(c => c.class === targetClass);
        if (item?.description) return item.description;
      }
    }
    return null;
  }, []);

  return (
    <ArchDataContext.Provider value={{ data, loading, error, refresh, toastMessage, clearToast, findEventLocation, findCallDescription }}>
      {children}
    </ArchDataContext.Provider>
  );
}
