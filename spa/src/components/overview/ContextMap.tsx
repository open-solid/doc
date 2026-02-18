import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { Application, Graphics, Text } from 'pixi.js';
import { useArchData } from '../../hooks/useArchData';
import { useTheme } from '../../hooks/useTheme';
import { SVG_PATHS } from '../../constants';

interface ModuleNode {
  context: string;
  name: string;
  key: string;
}

interface Relationship {
  from: string;
  to: string;
  type: 'command' | 'query' | 'event';
  label: string;
  pairIndex?: number;
  pairTotal?: number;
}

export function ContextMap() {
  const { data } = useArchData();
  const { isDark } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<Application | null>(null);
  const contextOffsetsRef = useRef<Record<string, { x: number; y: number }>>({});
  const [hiddenContexts, setHiddenContexts] = useState<Set<string>>(new Set());
  const [hiddenModules, setHiddenModules] = useState<Set<string>>(new Set());
  const [filtersVisible, setFiltersVisible] = useState(false);

  // Build modules + relationships from data
  const { modules, relationships, contextGroups } = useMemo(() => {
    if (!data) return { modules: [], relationships: [], contextGroups: {} as Record<string, ModuleNode[]> };

    const mods: ModuleNode[] = [];
    const rels: Relationship[] = [];
    const modIndex: Record<string, number> = {};

    data.contexts.forEach(ctx => {
      ctx.modules.forEach(mod => {
        const key = `${ctx.name}/${mod.name}`;
        modIndex[key] = mods.length;
        mods.push({ context: ctx.name, name: mod.name, key });
      });
    });

    // External calls
    data.contexts.forEach(ctx => {
      ctx.modules.forEach(mod => {
        const sourceKey = `${ctx.name}/${mod.name}`;
        (mod.externalCalls ?? []).forEach(call => {
          const targetKey = `${call.targetContext}/${call.targetModule}`;
          if (modIndex[targetKey] !== undefined) {
            rels.push({
              from: sourceKey,
              to: targetKey,
              type: call.type === 'query' ? 'query' : 'command',
              label: call.type === 'query' ? 'Query Bus' : 'Command Bus',
            });
          }
        });
      });
    });

    // Event subscribers
    data.contexts.forEach(ctx => {
      ctx.modules.forEach(mod => {
        const subscriberKey = `${ctx.name}/${mod.name}`;
        (mod.eventSubscribers ?? []).forEach(sub => {
          for (const c of data.contexts) {
            for (const m of c.modules) {
              const emitterKey = `${c.name}/${m.name}`;
              if (emitterKey === subscriberKey) continue;
              const emitsEvent = (m.domainEvents ?? []).some(e => e.class === sub.eventClass);
              if (emitsEvent && !rels.some(r => r.from === emitterKey && r.to === subscriberKey && r.type === 'event')) {
                rels.push({ from: emitterKey, to: subscriberKey, type: 'event', label: 'Event' });
              }
            }
          }
        });
      });
    });

    const groups: Record<string, ModuleNode[]> = {};
    mods.forEach(m => {
      if (!groups[m.context]) groups[m.context] = [];
      groups[m.context]!.push(m);
    });

    return { modules: mods, relationships: rels, contextGroups: groups };
  }, [data]);

  const contextNames = useMemo(() => Object.keys(contextGroups), [contextGroups]);

  const renderGraph = useCallback(() => {
    const app = appRef.current;
    if (!app) return;

    app.stage.removeChildren();

    const circleRadius = 40;
    const padding = 80;
    const minWidth = 600;
    const minHeight = 400;

    // Filter visible
    const visibleModules = modules.filter(m => !hiddenContexts.has(m.context) && !hiddenModules.has(m.key));

    if (visibleModules.length === 0) {
      app.renderer.resize(400, 100);
      const emptyText = new Text('No modules visible. Use filters to show modules.', {
        fontFamily: 'DM Sans, sans-serif', fontSize: 14, fill: isDark ? 0x94a3b8 : 0x64748b,
      });
      emptyText.anchor.set(0.5);
      emptyText.x = 200;
      emptyText.y = 50;
      app.stage.addChild(emptyText);
      return;
    }

    const visibleRelationships = relationships.filter(rel =>
      !hiddenContexts.has(rel.from.split('/')[0]!) &&
      !hiddenContexts.has(rel.to.split('/')[0]!) &&
      !hiddenModules.has(rel.from) &&
      !hiddenModules.has(rel.to),
    );

    // Build visible context groups
    const visibleContextGroups: Record<string, ModuleNode[]> = {};
    visibleModules.forEach(m => {
      if (!visibleContextGroups[m.context]) visibleContextGroups[m.context] = [];
      visibleContextGroups[m.context]!.push(m);
    });
    const visCtxNames = Object.keys(visibleContextGroups);
    const contextCount = visCtxNames.length;

    const centerX = Math.max(minWidth, contextCount * 220) / 2;
    const centerY = Math.max(minHeight, contextCount * 180) / 2;
    const contextRadius = Math.min(centerX, centerY) - padding - circleRadius * 2;

    // Calculate positions
    const positions: Record<string, { x: number; y: number; context: string }> = {};
    visCtxNames.forEach((ctxName, ctxIdx) => {
      const offset = contextOffsetsRef.current[ctxName] ?? { x: 0, y: 0 };
      const ctxAngle = (ctxIdx / contextCount) * Math.PI * 2 - Math.PI / 2;
      const ctxCenterX = centerX + Math.cos(ctxAngle) * contextRadius + offset.x;
      const ctxCenterY = centerY + Math.sin(ctxAngle) * contextRadius + offset.y;

      const ctxModules = visibleContextGroups[ctxName]!;
      const moduleRadius = Math.min(80, 40 + ctxModules.length * 15);

      ctxModules.forEach((mod, modIdx) => {
        const modAngle = (modIdx / ctxModules.length) * Math.PI * 2 - Math.PI / 2;
        positions[mod.key] = {
          x: ctxCenterX + Math.cos(modAngle) * moduleRadius,
          y: ctxCenterY + Math.sin(modAngle) * moduleRadius,
          context: ctxName,
        };
      });
    });

    const width = Math.max(minWidth, centerX * 2 + padding);
    const height = Math.max(minHeight, centerY * 2 + padding);
    app.renderer.resize(width, height);

    const colors = {
      module: isDark ? 0x818cf8 : 0x4f46e5,
      moduleBg: isDark ? 0x312e81 : 0xe0e7ff,
      text: isDark ? 0xe2e8f0 : 0x334155,
      command: isDark ? 0x06b6d4 : 0x0891b2,
      query: isDark ? 0x8b5cf6 : 0x7c3aed,
      event: isDark ? 0xf59e0b : 0xd97706,
      contextBg: isDark ? 0x1e293b : 0xf1f5f9,
    };

    // Draw context backgrounds (draggable)
    visCtxNames.forEach(ctxName => {
      const ctxModules = visibleContextGroups[ctxName]!;
      if (ctxModules.length === 0) return;

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      ctxModules.forEach(m => {
        const pos = positions[m.key]!;
        minX = Math.min(minX, pos.x); minY = Math.min(minY, pos.y);
        maxX = Math.max(maxX, pos.x); maxY = Math.max(maxY, pos.y);
      });

      const boxPad = circleRadius + 30;
      const bg = new Graphics();
      bg.beginFill(colors.contextBg, 0.5);
      bg.lineStyle(2, isDark ? 0x475569 : 0x94a3b8);
      bg.drawRoundedRect(minX - boxPad, minY - boxPad, maxX - minX + boxPad * 2, maxY - minY + boxPad * 2, 12);
      bg.endFill();
      bg.eventMode = 'static';
      bg.cursor = 'grab';

      let dragging = false;
      let dragStart = { x: 0, y: 0 };
      bg.on('pointerdown', (e: { global: { x: number; y: number } }) => {
        dragging = true;
        bg.cursor = 'grabbing';
        dragStart = { x: e.global.x, y: e.global.y };
      });
      app.stage.eventMode = 'static';
      app.stage.on('pointermove', (e: { global: { x: number; y: number } }) => {
        if (!dragging) return;
        const dx = e.global.x - dragStart.x;
        const dy = e.global.y - dragStart.y;
        dragStart = { x: e.global.x, y: e.global.y };
        if (!contextOffsetsRef.current[ctxName]) contextOffsetsRef.current[ctxName] = { x: 0, y: 0 };
        contextOffsetsRef.current[ctxName]!.x += dx;
        contextOffsetsRef.current[ctxName]!.y += dy;
        renderGraph();
      });
      app.stage.on('pointerup', () => { dragging = false; bg.cursor = 'grab'; });
      app.stage.on('pointerupoutside', () => { dragging = false; bg.cursor = 'grab'; });
      app.stage.addChild(bg);

      const ctxLabel = new Text(ctxName, { fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: '600', fill: isDark ? 0x94a3b8 : 0x64748b });
      ctxLabel.x = minX - boxPad + 10;
      ctxLabel.y = minY - boxPad + 8;
      app.stage.addChild(ctxLabel);
    });

    // Group relationships by pair
    const pairCounts: Record<string, number> = {};
    const pairIndices: Record<string, number> = {};
    visibleRelationships.forEach(rel => { const k = [rel.from, rel.to].sort().join('|'); pairCounts[k] = (pairCounts[k] ?? 0) + 1; });
    visibleRelationships.forEach(rel => {
      const k = [rel.from, rel.to].sort().join('|');
      if (!pairIndices[k]) pairIndices[k] = 0;
      rel.pairIndex = pairIndices[k]!++;
      rel.pairTotal = pairCounts[k];
    });

    const animatedEventLines: Array<{
      graphics: Graphics;
      color: number;
      startX: number; startY: number; midX: number; midY: number; endX: number; endY: number;
    }> = [];

    // Draw relationships
    visibleRelationships.forEach(rel => {
      const fromPos = positions[rel.from];
      const toPos = positions[rel.to];
      if (!fromPos || !toPos) return;

      const color = rel.type === 'event' ? colors.event : (rel.type === 'query' ? colors.query : colors.command);
      const dx = toPos.x - fromPos.x;
      const dy = toPos.y - fromPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist === 0) return;
      const nx = dx / dist, ny = dy / dist;

      const sortedPair = [rel.from, rel.to].sort();
      const isReversed = sortedPair[0] !== rel.from;
      const px = isReversed ? ny : -ny;
      const py = isReversed ? -nx : nx;

      const curveOffset = (rel.pairTotal ?? 1) > 1 ? ((rel.pairIndex ?? 0) - ((rel.pairTotal ?? 1) - 1) / 2) * 70 : 15;
      const startX = fromPos.x + nx * circleRadius;
      const startY = fromPos.y + ny * circleRadius;
      const endX = toPos.x - nx * (circleRadius + 8);
      const endY = toPos.y - ny * (circleRadius + 8);
      const midX = (startX + endX) / 2 + px * curveOffset;
      const midY = (startY + endY) / 2 + py * curveOffset;

      const line = new Graphics();
      if (rel.type !== 'event') {
        line.lineStyle(2, color, 0.8);
        line.moveTo(startX, startY);
        line.quadraticCurveTo(midX, midY, endX, endY);
      } else {
        animatedEventLines.push({ graphics: line, color, startX, startY, midX, midY, endX, endY });
      }
      app.stage.addChild(line);

      // Arrow
      const t = 0.98;
      const tx = 2 * (1 - t) * (midX - startX) + 2 * t * (endX - midX);
      const ty = 2 * (1 - t) * (midY - startY) + 2 * t * (endY - midY);
      const tl = Math.sqrt(tx * tx + ty * ty);
      const anx = tx / tl, any = ty / tl;
      const arrow = new Graphics();
      arrow.beginFill(color, 0.8);
      arrow.moveTo(endX, endY);
      arrow.lineTo(endX - anx * 8 - any * 4, endY - any * 8 + anx * 4);
      arrow.lineTo(endX - anx * 8 + any * 4, endY - any * 8 - anx * 4);
      arrow.closePath(); arrow.endFill();
      app.stage.addChild(arrow);

      // Label
      const labelBg = new Graphics();
      const labelText = new Text(rel.label, { fontFamily: 'DM Sans, sans-serif', fontSize: 9, fontWeight: '500', fill: color });
      labelText.anchor.set(0.5); labelText.x = midX; labelText.y = midY;
      labelBg.beginFill(isDark ? 0x0f172a : 0xffffff, 0.9);
      labelBg.drawRoundedRect(midX - labelText.width / 2 - 4, midY - labelText.height / 2 - 2, labelText.width + 8, labelText.height + 4, 3);
      labelBg.endFill();
      app.stage.addChild(labelBg);
      app.stage.addChild(labelText);
    });

    // Animate event-driven lines
    if (animatedEventLines.length > 0) {
      let dashOffset = 0;
      const dashLength = 8;
      const gapLength = 6;
      const totalSegments = 60;

      const drawAnimatedDashes = () => {
        animatedEventLines.forEach(({ graphics, color: c, startX, startY, midX, midY, endX, endY }) => {
          graphics.clear();
          graphics.lineStyle(2, c, 0.8);

          const points: Array<{ x: number; y: number }> = [];
          for (let i = 0; i <= totalSegments; i++) {
            const t = i / totalSegments;
            points.push({
              x: (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * midX + t * t * endX,
              y: (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * midY + t * t * endY,
            });
          }

          const distances = [0];
          for (let i = 1; i < points.length; i++) {
            const ddx = points[i]!.x - points[i - 1]!.x;
            const ddy = points[i]!.y - points[i - 1]!.y;
            distances.push(distances[i - 1]! + Math.sqrt(ddx * ddx + ddy * ddy));
          }
          const totalLength = distances[distances.length - 1]!;
          const patternLength = dashLength + gapLength;

          let currentDist = -dashOffset;
          while (currentDist < totalLength) {
            const dashStart = Math.max(0, currentDist);
            const dashEnd = Math.min(totalLength, currentDist + dashLength);

            if (dashEnd > 0 && dashStart < totalLength) {
              let startIdx = 0, endIdx = 0;
              for (let i = 0; i < distances.length - 1; i++) {
                if (distances[i]! <= dashStart && distances[i + 1]! > dashStart) startIdx = i;
                if (distances[i]! <= dashEnd && distances[i + 1]! > dashEnd) endIdx = i;
              }
              if (dashEnd >= totalLength) endIdx = distances.length - 2;

              const startT = (dashStart - distances[startIdx]!) / (distances[startIdx + 1]! - distances[startIdx]! || 1);
              const sx = points[startIdx]!.x + startT * (points[startIdx + 1]!.x - points[startIdx]!.x);
              const sy = points[startIdx]!.y + startT * (points[startIdx + 1]!.y - points[startIdx]!.y);

              const endT = (dashEnd - distances[endIdx]!) / (distances[endIdx + 1]! - distances[endIdx]! || 1);
              const ex = points[endIdx]!.x + endT * (points[endIdx + 1]!.x - points[endIdx]!.x);
              const ey = points[endIdx]!.y + endT * (points[endIdx + 1]!.y - points[endIdx]!.y);

              graphics.moveTo(sx, sy);
              for (let i = startIdx + 1; i <= endIdx; i++) {
                graphics.lineTo(points[i]!.x, points[i]!.y);
              }
              graphics.lineTo(ex, ey);
            }
            currentDist += patternLength;
          }
        });
      };

      drawAnimatedDashes();
      const patternLength = dashLength + gapLength;
      app.ticker.add(() => {
        dashOffset = (dashOffset - 0.3 + patternLength) % patternLength;
        drawAnimatedDashes();
      });
    }

    // Draw modules
    visibleModules.forEach(mod => {
      const pos = positions[mod.key]!;
      const circle = new Graphics();
      circle.beginFill(colors.moduleBg, 0.8);
      circle.lineStyle(2, colors.module);
      circle.drawCircle(0, 0, circleRadius);
      circle.endFill();
      circle.x = pos.x; circle.y = pos.y;
      app.stage.addChild(circle);

      const abbr = new Text(mod.name.substring(0, 3).toUpperCase(), { fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 'bold', fill: colors.module });
      abbr.anchor.set(0.5); abbr.x = pos.x; abbr.y = pos.y - 4;
      app.stage.addChild(abbr);

      const nameText = new Text(mod.name, { fontFamily: 'DM Sans, sans-serif', fontSize: 10, fill: colors.text });
      nameText.anchor.set(0.5, 0); nameText.x = pos.x; nameText.y = pos.y + circleRadius + 4;
      app.stage.addChild(nameText);
    });
  }, [modules, relationships, isDark, hiddenContexts, hiddenModules]);

  // Create Pixi app
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const app = new Application({
      view: canvas,
      width: 600,
      height: 400,
      backgroundAlpha: 0,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });
    appRef.current = app;
    renderGraph();

    return () => {
      app.destroy(false);
      appRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-render when filters or theme change
  useEffect(() => {
    renderGraph();
  }, [renderGraph]);

  const toggleContext = useCallback((ctxName: string, checked: boolean) => {
    setHiddenContexts(prev => {
      const next = new Set(prev);
      if (checked) next.delete(ctxName); else next.add(ctxName);
      return next;
    });
  }, []);

  const toggleModule = useCallback((modKey: string, checked: boolean) => {
    setHiddenModules(prev => {
      const next = new Set(prev);
      if (checked) next.delete(modKey); else next.add(modKey);
      return next;
    });
  }, []);

  if (!data) return null;

  return (
    <section className="mt-14">
      <h2 className="text-xl font-bold mb-6">Context Map</h2>
      <div className="bg-white dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className="inline-block w-8 h-0.5 bg-cyan-500" />
              <span>Command Bus</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-8 h-0.5 bg-violet-500" />
              <span>Query Bus</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="inline-block w-8 h-0.5 bg-amber-500"
                style={{ background: 'repeating-linear-gradient(90deg, rgb(245 158 11) 0px, rgb(245 158 11) 6px, transparent 6px, transparent 12px)' }}
              />
              <span>Event-Driven</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d={SVG_PATHS.move} />
              </svg>
              <span>Drag contexts to reposition</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <button
              className="px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-200 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
              onClick={() => setFiltersVisible(v => !v)}
            >
              {filtersVisible ? 'Hide Filters' : 'Filters'}
            </button>
            {filtersVisible && (
              <div className="flex flex-wrap gap-3">
                {contextNames.map(ctxName => {
                  const ctxMods = contextGroups[ctxName]!;
                  const isCtxHidden = hiddenContexts.has(ctxName);
                  return (
                    <details key={ctxName} className="relative" open={!isCtxHidden}>
                      <summary className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={!isCtxHidden}
                          className="rounded border-slate-300 dark:border-slate-600 text-primary-500 focus:ring-primary-500"
                          onChange={e => toggleContext(ctxName, e.target.checked)}
                        />
                        <span className="font-medium text-slate-700 dark:text-slate-300">{ctxName}</span>
                        <svg className="h-4 w-4 text-slate-400 chevron transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d={SVG_PATHS.chevronRight} />
                        </svg>
                      </summary>
                      <div className="pl-6 mt-1 space-y-1">
                        {ctxMods.map(mod => (
                          <label key={mod.key} className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <input
                              type="checkbox"
                              checked={!hiddenModules.has(mod.key)}
                              className="rounded border-slate-300 dark:border-slate-600 text-primary-500 focus:ring-primary-500"
                              onChange={e => toggleModule(mod.key, e.target.checked)}
                            />
                            {mod.name}
                          </label>
                        ))}
                      </div>
                    </details>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-center overflow-auto">
          <canvas ref={canvasRef} />
        </div>
      </div>
    </section>
  );
}
