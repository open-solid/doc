import { useRef, useEffect, useCallback } from 'react';
import type { EventSubscriber } from '../../types';
import type { ColorName } from '../../constants';
import { useArchData } from '../../hooks/useArchData';
import { useNavigation } from '../../hooks/useNavigation';
import { useTheme } from '../../hooks/useTheme';
import { Badge } from '../Badge';

interface SubscriberCardProps {
  item: EventSubscriber;
  color: ColorName;
  contextName: string;
  moduleName: string;
  index: number;
}

function hexColor(hex: number): string {
  return '#' + hex.toString(16).padStart(6, '0');
}

function isInCircle(mx: number, my: number, cx: number, cy: number, r: number): boolean {
  return (mx - cx) ** 2 + (my - cy) ** 2 <= r ** 2;
}

export function SubscriberCard({ item, color, moduleName, index }: SubscriberCardProps) {
  const { findEventLocation } = useArchData();
  const { navigate } = useNavigation();
  const { isDark } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const eventLoc = findEventLocation(item.eventClass);

  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;
  const eventLocRef = useRef(eventLoc);
  eventLocRef.current = eventLoc;

  const handleCanvasClick = useCallback((e: MouseEvent) => {
    const canvas = canvasRef.current;
    const loc = eventLocRef.current;
    if (!canvas || !loc) return;

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
      navigateRef.current({ type: 'module', context: loc.context, module: loc.module, tab: 'domainEvents' });
    }
  }, []);

  const handleCanvasMove = useCallback((e: MouseEvent) => {
    const canvas = canvasRef.current;
    const loc = eventLocRef.current;
    if (!canvas || !loc) return;

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

    const circleColor = hexColor(isDark ? 0xf43f5e : 0xe11d48);
    const circleFill = isDark ? 'rgba(244,63,94,0.15)' : 'rgba(225,29,72,0.15)';
    const arrowColor = hexColor(isDark ? 0xfb7185 : 0xf43f5e);
    const textColor = hexColor(isDark ? 0xe2e8f0 : 0x334155);
    const labelBg = hexColor(isDark ? 0x4c1d95 : 0xfef3c7);
    const labelTextColor = hexColor(isDark ? 0xfbbf24 : 0xb45309);

    const circleRadius = 32 * dpr;
    const padding = 20 * dpr;
    const centerY = (height / 2) - 5 * dpr;
    const sourceX = padding + circleRadius + 20 * dpr;
    const targetX = width - padding - circleRadius - 20 * dpr;

    const arrowStartX = sourceX + circleRadius + 10 * dpr;
    const arrowEndX = targetX - circleRadius;
    const dashLength = 8 * dpr;
    const gapLength = 6 * dpr;
    const patternLength = dashLength + gapLength;
    let dashOffset = 0;
    let animId = 0;

    const targetAbbr = eventLoc ? eventLoc.module.substring(0, 3).toUpperCase() : '?';
    const targetLabel = eventLoc ? `${eventLoc.context}/${eventLoc.module}` : 'External';

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

      // Subscriber circle (left)
      drawCircle(sourceX, centerY, circleRadius, circleFill, circleColor);
      drawCenteredText(moduleName.substring(0, 3).toUpperCase(), sourceX, centerY, `bold ${14 * dpr}px "DM Sans", sans-serif`, circleColor);
      drawCenteredText(moduleName, sourceX, centerY + circleRadius + 10 * dpr, `${10 * dpr}px "DM Sans", sans-serif`, textColor);

      // Event source circle (right)
      drawCircle(targetX, centerY, circleRadius, circleFill, circleColor);
      drawCenteredText(targetAbbr, targetX, centerY, `bold ${14 * dpr}px "DM Sans", sans-serif`, circleColor);
      drawCenteredText(targetLabel, targetX, centerY + circleRadius + 10 * dpr, `${10 * dpr}px "DM Sans", sans-serif`, textColor);

      // Animated dashed line (right to left — incoming event)
      ctx!.strokeStyle = arrowColor;
      ctx!.lineWidth = 2 * dpr;
      let x = arrowStartX - patternLength + dashOffset;
      while (x < arrowEndX) {
        const sX = Math.max(x, arrowStartX);
        const eX = Math.min(x + dashLength, arrowEndX);
        if (sX < eX) {
          ctx!.beginPath();
          ctx!.moveTo(sX, centerY);
          ctx!.lineTo(eX, centerY);
          ctx!.stroke();
        }
        x += patternLength;
      }

      // Arrow head pointing LEFT
      const arrowHeadX = sourceX + circleRadius;
      ctx!.fillStyle = arrowColor;
      ctx!.beginPath();
      ctx!.moveTo(arrowHeadX, centerY);
      ctx!.lineTo(arrowHeadX + 10 * dpr, centerY - 6 * dpr);
      ctx!.lineTo(arrowHeadX + 10 * dpr, centerY + 6 * dpr);
      ctx!.closePath();
      ctx!.fill();

      // Label background + text
      ctx!.font = `500 ${11 * dpr}px "DM Sans", sans-serif`;
      const labelCenterX = (arrowStartX + arrowEndX) / 2;
      const labelY = centerY - 20 * dpr;
      const metrics = ctx!.measureText(item.event);
      const labelPad = 8 * dpr;
      const labelW = metrics.width + labelPad * 2;
      const labelH = 11 * dpr + labelPad * 2;

      ctx!.fillStyle = labelBg;
      roundRect(ctx!, labelCenterX - labelW / 2, labelY - labelH / 2, labelW, labelH, 4 * dpr);

      ctx!.fillStyle = labelTextColor;
      ctx!.textAlign = 'center';
      ctx!.textBaseline = 'middle';
      ctx!.fillText(item.event, labelCenterX, labelY);
    }

    function animate() {
      // Animate right to left (decreasing offset)
      dashOffset = (dashOffset - 0.3 * dpr + patternLength) % patternLength;
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
  }, [isDark, item, moduleName, eventLoc, handleCanvasClick, handleCanvasMove]);

  return (
    <article className="item-card rounded-lg p-5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50" style={{ '--card-accent': 'rgb(244 63 94)' } as React.CSSProperties}>
      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-base font-semibold cursor-help border-b border-dashed border-slate-400 dark:border-slate-600" title={item.class}>
          {item.name}
        </h3>
        <Badge label="subscriber" color={color} />
      </div>
      {item.description && <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{item.description}</p>}
      <div ref={containerRef} className="flex justify-start">
        <canvas ref={canvasRef} key={`subscriber-${index}-${isDark}`} />
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
