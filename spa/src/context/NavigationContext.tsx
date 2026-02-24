import { useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import type { NavigationView } from '../types';
import { NavigationContext } from '../hooks/useNavigation';

function viewToHash(view: NavigationView): string {
  if (view.type === 'module') {
    let hash = `#/${encodeURIComponent(view.context)}/${encodeURIComponent(view.module)}`;
    if (view.tab) hash += `/${encodeURIComponent(view.tab)}`;
    return hash;
  }
  if (view.type === 'doc') {
    let hash = `#/doc/${encodeURIComponent(view.path)}`;
    if (view.anchor) hash += `/${encodeURIComponent(view.anchor)}`;
    return hash;
  }
  return '#/';
}

function hashToView(hash: string): NavigationView {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  const segments = raw.split('/').filter(Boolean);

  if (segments.length >= 2 && segments[0] === 'doc') {
    return {
      type: 'doc',
      path: decodeURIComponent(segments[1]!),
      anchor: segments[2] ? decodeURIComponent(segments[2]) : undefined,
    };
  }

  if (segments.length >= 2) {
    return {
      type: 'module',
      context: decodeURIComponent(segments[0]!),
      module: decodeURIComponent(segments[1]!),
      tab: segments[2] ? decodeURIComponent(segments[2]) : undefined,
    };
  }

  return { type: 'overview' };
}

function viewKey(v: NavigationView): string | null {
  if (v.type === 'module') return `module:${v.context}:${v.module}`;
  if (v.type === 'doc') return `doc:${v.path}:${v.anchor ?? ''}`;
  return null;
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<NavigationView>(() => hashToView(window.location.hash));
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
    history.pushState(null, '', viewToHash(v));
  }, [applyNavigation]);

  const navigateFromString = useCallback((viewStr: string) => {
    const parts = viewStr.split(':');
    let v: NavigationView;
    if (parts[0] === 'module' && parts[1] && parts[2]) {
      v = { type: 'module', context: parts[1], module: parts[2], tab: parts[3] };
    } else if (parts[0] === 'doc' && parts[1]) {
      v = { type: 'doc', path: parts[1], anchor: parts[2] || undefined };
    } else {
      v = { type: 'overview' };
    }
    applyNavigation(v);
    history.pushState(null, '', viewToHash(v));
  }, [applyNavigation]);

  useEffect(() => {
    const handlePopState = () => {
      applyNavigation(hashToView(window.location.hash));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [applyNavigation]);

  return (
    <NavigationContext.Provider value={{ view, navigate, navigateFromString }}>
      {children}
    </NavigationContext.Provider>
  );
}
