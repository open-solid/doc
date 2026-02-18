import { useEffect, useRef } from 'react';
import { Application } from 'pixi.js';

interface UsePixiAppOptions {
  width: number;
  height: number;
}

export function usePixiApp(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  { width, height }: UsePixiAppOptions,
) {
  const appRef = useRef<Application | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const app = new Application({
      view: canvas,
      width,
      height,
      backgroundAlpha: 0,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    appRef.current = app;

    return () => {
      app.destroy(false);
      appRef.current = null;
    };
  }, [canvasRef, width, height]);

  return appRef;
}
