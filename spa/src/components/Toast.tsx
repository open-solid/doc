import { useEffect, useState, useRef } from 'react';
import { useArchData } from '../hooks/useArchData';

export function Toast() {
  const { toastMessage, clearToast } = useArchData();
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState<{ text: string; success: boolean } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>({} as ReturnType<typeof setTimeout>);

  useEffect(() => {
    if (!toastMessage) return;

    setCurrent(toastMessage);
    // Small delay to allow DOM to update before animating in
    const showTimer = setTimeout(() => setVisible(true), 10);

    timerRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrent(null);
        clearToast();
      }, 300);
    }, 3000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(timerRef.current);
    };
  }, [toastMessage, clearToast]);

  if (!current) return null;

  return (
    <div
      className={`toast flex items-center gap-2 px-4 py-3 rounded-xl text-white font-medium shadow-xl ${
        current.success ? 'toast-success' : 'toast-error'
      } ${visible ? 'show' : ''}`}
    >
      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        {current.success ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        )}
      </svg>
      <span>{current.text}</span>
    </div>
  );
}
