import type { Command, Query, DomainEvent, EventSubscriber } from '../../types';
import type { ColorName } from '../../constants';
import { Badge } from '../Badge';
import { DataTable } from '../DataTable';
import { useArchData } from '../../hooks/useArchData';
import { useNavigation } from '../../hooks/useNavigation';
import { SVG_PATHS } from '../../constants';

type Item = Command | Query | DomainEvent | EventSubscriber;

interface ItemCardProps {
  item: Item;
  type: 'commands' | 'queries' | 'domainEvents' | 'eventSubscribers';
  color: ColorName;
}

const BADGES: Record<string, string> = {
  commands: 'command',
  queries: 'query',
  domainEvents: 'event',
  eventSubscribers: 'subscriber',
};

const ACCENT_COLORS: Record<string, string> = {
  emerald: 'rgb(16 185 129)',
  violet: 'rgb(139 92 246)',
  amber: 'rgb(245 158 11)',
  rose: 'rgb(244 63 94)',
  cyan: 'rgb(6 182 212)',
  primary: 'rgb(99 102 241)',
  slate: 'rgb(148 163 184)',
};

export function ItemCard({ item, type, color }: ItemCardProps) {
  const { findEventLocation } = useArchData();
  const { navigate } = useNavigation();
  const badge = BADGES[type] ?? type;

  const hasClass = 'class' in item && item.class;
  const input = 'input' in item ? item.input : undefined;
  const output = 'output' in item ? item.output : undefined;
  const properties = 'properties' in item ? item.properties : undefined;
  const eventName = 'event' in item ? item.event : undefined;
  const eventClass = 'eventClass' in item ? item.eventClass : undefined;
  const description = 'description' in item ? item.description : undefined;

  return (
    <article
      className="item-card rounded-lg p-5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50"
      style={{ '--card-accent': ACCENT_COLORS[color] ?? ACCENT_COLORS.primary } as React.CSSProperties}
    >
      <div className="flex items-center gap-2 mb-1">
        <h3
          className={`text-base font-semibold ${hasClass ? 'cursor-help border-b border-dashed border-slate-400 dark:border-slate-600' : ''}`}
          title={hasClass ? (item as { class: string }).class : undefined}
        >
          {item.name}
        </h3>
        <Badge label={badge} color={color} />
      </div>

      {description && (
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{description}</p>
      )}

      {input && input.length > 0 && <DataTable items={input} />}

      {output && output.type !== 'void' && (
        <div className="mt-4 text-sm">
          <span className="text-slate-500">Returns: </span>
          <span
            className={`font-medium text-slate-700 dark:text-slate-300 ${output.class ? 'cursor-help border-b border-dashed border-slate-400 dark:border-slate-600' : ''}`}
            title={output.class}
          >
            {output.type}
          </span>
        </div>
      )}

      {properties && properties.length > 0 && <DataTable items={properties} />}

      {eventName && eventClass && (() => {
        const loc = findEventLocation(eventClass);
        return (
          <div className="flex items-center gap-2 mt-4 text-sm">
            <span className="text-slate-500">Listens to:</span>
            <a
              href="#"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-medium hover:bg-amber-200 dark:hover:bg-amber-800/40 transition-colors"
              title={eventClass}
              onClick={e => {
                e.preventDefault();
                if (loc) navigate({ type: 'module', context: loc.context, module: loc.module, tab: 'domainEvents' });
              }}
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d={SVG_PATHS.bell} />
              </svg>
              {eventName}
            </a>
          </div>
        );
      })()}
    </article>
  );
}
