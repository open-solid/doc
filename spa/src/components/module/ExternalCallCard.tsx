import { useRef, useEffect, useCallback } from 'react';
import type { ExternalCall } from '../../types';
import type { ColorName } from '../../constants';
import { useArchData } from '../../hooks/useArchData';
import { useNavigation } from '../../hooks/useNavigation';
import { useTheme } from '../../hooks/useTheme';
import { Badge } from '../Badge';

interface ExternalCallCardProps {
  item: ExternalCall;
  color: ColorName;
  moduleName: string;
  index: number;
}

function hexColor(hex: number): string {
  return '#' + hex.toString(16).padStart(6, '0');
}

function isInCircle(mx: number, my: number, cx: number, cy: number, r: number): boolean {
  return (mx - cx) ** 2 + (my - cy) ** 2 <= r ** 2;
}

export function ExternalCallCard({ item, color, moduleName, index }: ExternalCallCardProps) {
  const { findCallDescription } = useArchData();
  const { navigate } = useNavigation();
  const { isDark } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const description = findCallDescription(item.targetClass, item.type);
  const badgeColor: ColorName = item.type === 'command' ? 'emerald' : 'violet';
  const targetTab = item.type === 'query' ? 'queries' : 'commands';

  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  const handleCanvasClick = useCallback((e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const mx = (e.clientX - rect.left) * dpr;
    const my = (e.clientY - rect.top) * dpr;

    const width = canvas.width;
    const height = canvas.height;
    const circleRadius = 32 * dpr;
    const padding = 20 * dpr;
    const centerY = (height / 2) - 5 * dpr;
    const targetX = width - padding - circleRadius - 20 * dpr;

    if (isInCircle(mx, my, targetX, centerY, circleRadius)) {
      navigateRef.current({ type: 'module', context: item.targetContext, module: item.targetModule, tab: targetTab });
    }
  }, [item.targetContext, item.targetModule, targetTab]);

  const handleCanvasMove = useCallback((e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const mx = (e.clientX - rect.left) * dpr;
    const my = (e.clientY - rect.top) * dpr;

    const width = canvas.width;
    const height = canvas.height;
    const circleRadius = 32 * dpr;
    const padding = 20 * dpr;
    const centerY = (height / 2) - 5 * dpr;
    const targetX = width - padding - circleRadius - 20 * dpr;

    canvas.style.cursor = isInCircle(mx, my, targetX, centerY, circleRadius) ? 'pointer' : 'default';
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const cssWidth = Math.min(containerRef.current?.offsetWidth ?? 420, 420);
    const cssHeight = 120;
    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const circleColor = hexColor(isDark ? 0x818cf8 : 0x4f46e5);
    const circleFill = isDark ? 'rgba(129,140,248,0.15)' : 'rgba(79,70,229,0.15)';
    const arrowColor = hexColor(isDark ? 0xa5b4fc : 0x6366f1);
    const textColor = hexColor(isDark ? 0xe2e8f0 : 0x334155);
    const labelBg = hexColor(item.type === 'query' ? (isDark ? 0x4c1d95 : 0xede9fe) : (isDark ? 0x064e3b : 0xd1fae5));
    const labelTextColor = hexColor(item.type === 'query' ? (isDark ? 0xc4b5fd : 0x5b21b6) : (isDark ? 0x6ee7b7 : 0x047857));

    const circleRadius = 32 * dpr;
    const padding = 20 * dpr;
    const centerY = (height / 2) - 5 * dpr;
    const sourceX = padding + circleRadius + 20 * dpr;
    const targetX = width - padding - circleRadius - 20 * dpr;

    const arrowStartX = sourceX + circleRadius;
    const arrowEndX = targetX - circleRadius;
    const dashLength = 8 * dpr;
    const gapLength = 6 * dpr;
    const patternLength = dashLength + gapLength;
    let dashOffset = 0;
    let animId = 0;

    function drawCircle(cx: number, cy: number, r: number, fillStyle: string, strokeStyle: string) {
      ctx!.beginPath();
      ctx!.arc(cx, cy, r, 0, Math.PI * 2);
      ctx!.fillStyle = fillStyle;
      ctx!.fill();
      ctx!.strokeStyle = strokeStyle;
      ctx!.lineWidth = 2 * dpr;
      ctx!.stroke();
    }

    function drawCenteredText(text: string, x: number, y: number, font: string, fill: string) {
      ctx!.font = font;
      ctx!.fillStyle = fill;
      ctx!.textAlign = 'center';
      ctx!.textBaseline = 'middle';
      ctx!.fillText(text, x, y);
    }

    function draw() {
      ctx!.clearRect(0, 0, width, height);

      // Source circle
      drawCircle(sourceX, centerY, circleRadius, circleFill, circleColor);
      drawCenteredText(moduleName.substring(0, 3).toUpperCase(), sourceX, centerY, `bold ${14 * dpr}px "DM Sans", sans-serif`, circleColor);
      drawCenteredText(moduleName, sourceX, centerY + circleRadius + 10 * dpr, `${10 * dpr}px "DM Sans", sans-serif`, textColor);

      // Target circle
      drawCircle(targetX, centerY, circleRadius, circleFill, circleColor);
      drawCenteredText(item.targetModule.substring(0, 3).toUpperCase(), targetX, centerY, `bold ${14 * dpr}px "DM Sans", sans-serif`, circleColor);
      drawCenteredText(`${item.targetContext}/${item.targetModule}`, targetX, centerY + circleRadius + 10 * dpr, `${10 * dpr}px "DM Sans", sans-serif`, textColor);

      // Animated dashed line (left to right)
      ctx!.strokeStyle = arrowColor;
      ctx!.lineWidth = 2 * dpr;
      let x = arrowStartX - patternLength + dashOffset;
      while (x < arrowEndX - 10 * dpr) {
        const sX = Math.max(x, arrowStartX);
        const eX = Math.min(x + dashLength, arrowEndX - 10 * dpr);
        if (sX < eX) {
          ctx!.beginPath();
          ctx!.moveTo(sX, centerY);
          ctx!.lineTo(eX, centerY);
          ctx!.stroke();
        }
        x += patternLength;
      }

      // Arrow head pointing right
      ctx!.fillStyle = arrowColor;
      ctx!.beginPath();
      ctx!.moveTo(arrowEndX, centerY);
      ctx!.lineTo(arrowEndX - 10 * dpr, centerY - 6 * dpr);
      ctx!.lineTo(arrowEndX - 10 * dpr, centerY + 6 * dpr);
      ctx!.closePath();
      ctx!.fill();

      // Label background + text
      ctx!.font = `500 ${11 * dpr}px "DM Sans", sans-serif`;
      const labelCenterX = (arrowStartX + arrowEndX) / 2;
      const labelY = centerY - 20 * dpr;
      const metrics = ctx!.measureText(item.name);
      const labelPad = 8 * dpr;
      const labelW = metrics.width + labelPad * 2;
      const labelH = 11 * dpr + labelPad * 2;

      ctx!.fillStyle = labelBg;
      roundRect(ctx!, labelCenterX - labelW / 2, labelY - labelH / 2, labelW, labelH, 4 * dpr);

      ctx!.fillStyle = labelTextColor;
      ctx!.textAlign = 'center';
      ctx!.textBaseline = 'middle';
      ctx!.fillText(item.name, labelCenterX, labelY);
    }

    function animate() {
      dashOffset = (dashOffset + 0.3 * dpr) % patternLength;
      draw();
      animId = requestAnimationFrame(animate);
    }

    draw();
    animId = requestAnimationFrame(animate);

    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('mousemove', handleCanvasMove);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('click', handleCanvasClick);
      canvas.removeEventListener('mousemove', handleCanvasMove);
    };
  }, [isDark, item, moduleName, handleCanvasClick, handleCanvasMove]);

  return (
    <article className="item-card rounded-lg p-5 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50" style={{ '--card-accent': 'rgb(6 182 212)' } as React.CSSProperties}>
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <h3 className="text-base font-semibold cursor-help border-b border-dashed border-slate-400 dark:border-slate-600" title={item.sourceClass}>
          {item.source}
        </h3>
        <Badge label="calls" color={color} />
        <span className="text-base font-semibold cursor-help border-b border-dashed border-slate-400 dark:border-slate-600" title={item.targetClass}>
          {item.name}
        </span>
        <Badge label={item.type} color={badgeColor} />
      </div>
      {description && <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{description}</p>}
      <div ref={containerRef} className="flex justify-start">
        <canvas ref={canvasRef} key={`ext-call-${index}-${isDark}`} />
      </div>
    </article>
  );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}
