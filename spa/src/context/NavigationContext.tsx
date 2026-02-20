import { useState, useCallback, useRef, type ReactNode } from 'react';
import type { NavigationView } from '../types';
import { NavigationContext } from '../hooks/useNavigation';

function viewKey(v: NavigationView): string | null {
  if (v.type === 'module') return `module:${v.context}:${v.module}`;
  if (v.type === 'doc') return `doc:${v.path}:${v.anchor ?? ''}`;
  return null;
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<NavigationView>({ type: 'overview' });
  const viewRef = useRef<NavigationView>(view);
  const scrollPositions = useRef(new Map<string, number>());

  const applyNavigation = useCallback((next: NavigationView) => {
    const currentKey = viewKey(viewRef.current);
    if (currentKey) {
      scrollPositions.current.set(currentKey, window.scrollY);
    }

    viewRef.current = next;
    setView(next);

    const nextKey = viewKey(next);
    const saved = nextKey ? scrollPositions.current.get(nextKey) : undefined;
    requestAnimationFrame(() => {
      window.scrollTo({ top: saved ?? 0 });
    });
  }, []);

  const navigate = useCallback((v: NavigationView) => {
    applyNavigation(v);
  }, [applyNavigation]);

  const navigateFromString = useCallback((viewStr: string) => {
    const parts = viewStr.split(':');
    if (parts[0] === 'module' && parts[1] && parts[2]) {
      applyNavigation({ type: 'module', context: parts[1], module: parts[2], tab: parts[3] });
    } else if (parts[0] === 'doc' && parts[1]) {
      applyNavigation({ type: 'doc', path: parts[1], anchor: parts[2] || undefined });
    } else {
      applyNavigation({ type: 'overview' });
    }
  }, [applyNavigation]);

  return (
    <NavigationContext.Provider value={{ view, navigate, navigateFromString }}>
      {children}
    </NavigationContext.Provider>
  );
}
