import { useEffect, useState, useCallback, type ReactNode } from 'react';
import { type Theme, ThemeContext } from '../hooks/useTheme';

function getIsDark(theme: Theme): boolean {
  if (theme === 'dark') return true;
  if (theme === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem('theme') as Theme) || 'system',
  );
  const [isDark, setIsDark] = useState(() => getIsDark(theme));

  const setTheme = useCallback((t: Theme) => {
    localStorage.setItem('theme', t);
    setThemeState(t);
  }, []);

  useEffect(() => {
    const dark = getIsDark(theme);
    setIsDark(dark);
    document.documentElement.classList.toggle('dark', dark);
  }, [theme]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (theme === 'system') {
        const dark = mq.matches;
        setIsDark(dark);
        document.documentElement.classList.toggle('dark', dark);
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, isDark, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
