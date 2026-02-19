import { useState, useMemo } from 'react';
import { useArchData } from '../../hooks/useArchData';
import { useOpenApi } from '../../hooks/useOpenApi';
import { SECTION_CONFIG } from '../../constants';
import { TabNav } from './TabNav';
import { ItemCard } from './ItemCard';
import { ExternalCallCard } from './ExternalCallCard';
import { SubscriberCard } from './SubscriberCard';
import { EndpointCard } from './EndpointCard';
import { ContentNav } from './ContentNav';
import type { NavItem } from './ContentNav';
import type { Command, Query, DomainEvent, EventSubscriber, ExternalCall } from '../../types';

const SECTION_ID_PREFIX: Record<string, string> = {
  commands: 'command',
  queries: 'query',
  domainEvents: 'event',
};

interface ModulePageProps {
  contextName: string;
  moduleName: string;
  initialTab?: string;
}

export function ModulePage({ contextName, moduleName, initialTab }: ModulePageProps) {
  const { data } = useArchData();
  const { endpointsByModule, spec } = useOpenApi();

  const mod = useMemo(() => {
    const ctx = data?.contexts.find(c => c.name === contextName);
    return ctx?.modules.find(m => m.name === moduleName) ?? null;
  }, [data, contextName, moduleName]);

  const moduleEndpoints = useMemo(
    () => endpointsByModule.get(moduleName) ?? [],
    [endpointsByModule, moduleName],
  );

  const availableSections = useMemo(
    () => SECTION_CONFIG.filter(s => {
      const items = mod?.[s.key];
      return items && items.length > 0;
    }),
    [mod],
  );

  const hasEndpoints = moduleEndpoints.length > 0;
  const hasSections = availableSections.length > 0 || hasEndpoints;

  function resolveTab(tab: string | undefined, endpoints: boolean): string {
    if (tab === 'endpoints' && endpoints) return 'endpoints';
    if (tab) {
      const found = availableSections.find(s => s.key === tab);
      if (found) return found.key;
    }
    if (endpoints) return 'endpoints';
    return availableSections[0]?.key ?? '';
  }

  const [activeTab, setActiveTab] = useState(() => resolveTab(initialTab, hasEndpoints));

  // Reset active tab when module, requested tab, or data availability changes
  const defaultTab = resolveTab(initialTab, hasEndpoints);
  const navKey = `${contextName}:${moduleName}:${initialTab ?? ''}:${defaultTab}`;
  const [prevNav, setPrevNav] = useState(navKey);
  if (navKey !== prevNav) {
    setPrevNav(navKey);
    setActiveTab(defaultTab);
  }

  const navItems = useMemo((): NavItem[] => {
    if (!mod) return [];

    if (activeTab === 'endpoints') {
      return moduleEndpoints.map((ep, idx) => ({
        id: `endpoint-${idx}`,
        label: ep.description ?? ep.path,
        method: ep.method,
      }));
    }

    const section = availableSections.find(s => s.key === activeTab);
    if (!section) return [];

    switch (section.key) {
      case 'commands':
        return (mod.commands ?? []).map((item: Command, idx: number) => ({
          id: `command-${idx}`,
          label: item.name,
        }));
      case 'queries':
        return (mod.queries ?? []).map((item: Query, idx: number) => ({
          id: `query-${idx}`,
          label: item.name,
        }));
      case 'domainEvents':
        return (mod.domainEvents ?? []).map((item: DomainEvent, idx: number) => ({
          id: `event-${idx}`,
          label: item.name,
        }));
      case 'eventSubscribers':
        return (mod.eventSubscribers ?? []).map((item: EventSubscriber, idx: number) => ({
          id: `subscriber-${idx}`,
          label: item.name,
        }));
      case 'externalCalls':
        return (mod.externalCalls ?? []).map((item: ExternalCall, idx: number) => ({
          id: `external-${idx}`,
          label: item.source,
        }));
    }
  }, [mod, activeTab, moduleEndpoints, availableSections]);

  if (!mod) return null;

  return (
    <div className="fade-in">
      <header className="mb-10 max-w-5xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-500 dark:text-primary-400 mb-2">{contextName}</p>
        <h1 className="text-3xl font-extrabold tracking-tight">{moduleName}</h1>
        {mod.description && (
          <p className="mt-3 text-slate-600 dark:text-slate-400 leading-relaxed">{mod.description}</p>
        )}
      </header>

      {!hasSections ? (
        <p className="text-slate-500">No elements in this module.</p>
      ) : (
        <>
          <TabNav
            sections={availableSections}
            module={mod}
            activeKey={activeTab}
            onTabChange={setActiveTab}
            endpointsCount={hasEndpoints ? moduleEndpoints.length : undefined}
          />

          <div className="flex gap-8">
            <div className="flex-1 min-w-0 max-w-5xl">
              {activeTab === 'endpoints' && spec && (
                <div className="grid grid-cols-1 gap-6 fade-in">
                  {moduleEndpoints.map((ep, idx) => (
                    <div key={`${ep.method}-${ep.path}-${idx}`} id={`endpoint-${idx}`} className="scroll-mt-24">
                      <EndpointCard endpoint={ep} spec={spec} />
                    </div>
                  ))}
                </div>
              )}

              {activeTab !== 'endpoints' && availableSections.filter(s => s.key === activeTab).map(section => (
                <div key={section.key} className="grid grid-cols-1 gap-6 fade-in">
                  {section.key === 'externalCalls' && mod.externalCalls?.map((item, idx) => (
                    <div key={idx} id={`external-${idx}`} className="scroll-mt-24">
                      <ExternalCallCard item={item} color={section.color} moduleName={moduleName} index={idx} />
                    </div>
                  ))}
                  {section.key === 'eventSubscribers' && mod.eventSubscribers?.map((item, idx) => (
                    <div key={idx} id={`subscriber-${idx}`} className="scroll-mt-24">
                      <SubscriberCard item={item} color={section.color} contextName={contextName} moduleName={moduleName} index={idx} />
                    </div>
                  ))}
                  {section.key !== 'externalCalls' && section.key !== 'eventSubscribers' && (
                    (mod[section.key] as unknown[])?.map((item, idx) => (
                      <div key={idx} id={`${SECTION_ID_PREFIX[section.key] ?? section.key}-${idx}`} className="scroll-mt-24">
                        <ItemCard item={item as never} type={section.key as 'commands' | 'queries' | 'domainEvents' | 'eventSubscribers'} color={section.color} />
                      </div>
                    ))
                  )}
                </div>
              ))}
            </div>

            <ContentNav items={navItems} />
          </div>
        </>
      )}
    </div>
  );
}
