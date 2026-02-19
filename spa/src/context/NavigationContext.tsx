import { useState, useCallback, useRef, type ReactNode } from 'react';
import type { NavigationView } from '../types';
import { NavigationContext } from '../hooks/useNavigation';

function moduleKey(v: NavigationView): string | null {
  return v.type === 'module' ? `${v.context}:${v.module}` : null;
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<NavigationView>({ type: 'overview' });
  const viewRef = useRef<NavigationView>(view);
  const scrollPositions = useRef(new Map<string, number>());

  const applyNavigation = useCallback((next: NavigationView) => {
    const currentKey = moduleKey(viewRef.current);
    if (currentKey) {
      scrollPositions.current.set(currentKey, window.scrollY);
    }

    viewRef.current = next;
    setView(next);

    const nextKey = moduleKey(next);
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
