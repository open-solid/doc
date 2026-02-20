import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import type { DocsNavItem } from '../types';
import { useArchData } from '../hooks/useArchData';
import { ModuleDocsContext } from '../hooks/useModuleDocs';

export function ModuleDocsProvider({ children }: { children: ReactNode }) {
  const { data } = useArchData();
  const [moduleDocsMap, setModuleDocsMap] = useState<Map<string, DocsNavItem[]>>(new Map());

  const config = window.__ARCH_CONFIG__;
  const moduleNavUrl = config.docsNavigationUrl.replace('navigation.json', 'navigation/module.json');

  useEffect(() => {
    if (!data) return;

    fetch(moduleNavUrl)
      .then(res => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((json: { navigation: DocsNavItem[] } | null) => {
        if (!json) {
          setModuleDocsMap(new Map());
          return;
        }

        const map = new Map<string, DocsNavItem[]>();
        for (const item of json.navigation) {
          map.set(item.title, item.items.length > 0 ? item.items : [item]);
        }
        setModuleDocsMap(map);
      })
      .catch(() => {
        setModuleDocsMap(new Map());
      });
  }, [data, moduleNavUrl]);

  const getModuleDocs = useCallback(
    (moduleName: string): DocsNavItem[] => moduleDocsMap.get(moduleName) ?? [],
    [moduleDocsMap],
  );

  const value = useMemo(() => ({ getModuleDocs }), [getModuleDocs]);

  return (
    <ModuleDocsContext.Provider value={value}>
      {children}
    </ModuleDocsContext.Provider>
  );
}
