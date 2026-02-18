import { createContext, useContext } from 'react';
import type { NavigationView } from '../types';

export interface NavigationContextValue {
  view: NavigationView;
  navigate: (view: NavigationView) => void;
  navigateFromString: (viewStr: string) => void;
}

export const NavigationContext = createContext<NavigationContextValue | null>(null);

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigation must be used within NavigationProvider');
  return ctx;
}
