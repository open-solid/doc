import { useState, useEffect, useCallback } from 'react';
import { SVG_PATHS } from '../constants';

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <button
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className={`fixed bottom-6 right-6 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-slate-200/80 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 backdrop-blur-sm transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d={SVG_PATHS.chevronUp} />
      </svg>
    </button>
  );
}
