import { useState, useCallback, type ReactNode } from 'react';
import type { NavigationView } from '../types';
import { NavigationContext } from '../hooks/useNavigation';

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<NavigationView>({ type: 'overview' });

  const navigate = useCallback((v: NavigationView) => {
    setView(v);
  }, []);

  const navigateFromString = useCallback((viewStr: string) => {
    const parts = viewStr.split(':');
    if (parts[0] === 'module' && parts[1] && parts[2]) {
      setView({ type: 'module', context: parts[1], module: parts[2], tab: parts[3] });
    } else {
      setView({ type: 'overview' });
    }
  }, []);

  return (
    <NavigationContext.Provider value={{ view, navigate, navigateFromString }}>
      {children}
    </NavigationContext.Provider>
  );
}
