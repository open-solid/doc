import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import type { DocsNavItem } from '../types';
import { DocsContext } from '../hooks/useDocs';

export function DocsProvider({ children }: { children: ReactNode }) {
  const [navigation, setNavigation] = useState<DocsNavItem[]>([]);
  const [loadingNav, setLoadingNav] = useState(true);
  const [content, setContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const contentCache = useRef(new Map<string, string>());

  const config = window.__ARCH_CONFIG__;

  useEffect(() => {
    fetch(config.docsNavigationUrl)
      .then(res => res.json())
      .then((data: { navigation: DocsNavItem[] }) => {
        setNavigation(data.navigation);
      })
      .catch(() => {
        setNavigation([]);
      })
      .finally(() => {
        setLoadingNav(false);
      });
  }, [config.docsNavigationUrl]);

  const contentUrl = config.docsNavigationUrl.replace('navigation.json', 'content');

  const fetchContent = useCallback(async (path: string) => {
    const cached = contentCache.current.get(path);
    if (cached !== undefined) {
      setContent(cached);
      return;
    }

    setLoadingContent(true);
    try {
      const res = await fetch(`${contentUrl}?path=${encodeURIComponent(path)}`);
      if (!res.ok) {
        setContent(null);
        return;
      }
      const text = await res.text();
      contentCache.current.set(path, text);
      setContent(text);
    } catch {
      setContent(null);
    } finally {
      setLoadingContent(false);
    }
  }, [contentUrl]);

  return (
    <DocsContext.Provider value={{ navigation, loadingNav, content, loadingContent, fetchContent }}>
      {children}
    </DocsContext.Provider>
  );
}
