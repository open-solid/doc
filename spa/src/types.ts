export interface ArchData {
  contexts: Context[];
  meta: Meta;
}

export interface Meta {
  generatedAt: string;
  company: string;
  project: string;
}

export interface Context {
  name: string;
  modules: Module[];
}

export interface Module {
  name: string;
  description?: string;
  commands?: Command[];
  queries?: Query[];
  domainEvents?: DomainEvent[];
  eventSubscribers?: EventSubscriber[];
  externalCalls?: ExternalCall[];
}

export interface Parameter {
  name: string;
  type: string;
  class?: string;
  description?: string;
}

export interface OutputType {
  type: string;
  class?: string;
}

export interface Command {
  name: string;
  class: string;
  description?: string;
  input: Parameter[];
  output: OutputType;
}

export interface Query {
  name: string;
  class: string;
  description?: string;
  input: Parameter[];
  output: OutputType;
}

export interface DomainEvent {
  name: string;
  class: string;
  description?: string;
  properties: Parameter[];
}

export interface EventSubscriber {
  name: string;
  class: string;
  description?: string;
  event: string;
  eventClass: string;
}

export interface ExternalCall {
  type: 'command' | 'query';
  source: string;
  sourceClass: string;
  name: string;
  targetClass: string;
  targetContext: string;
  targetModule: string;
}

export interface DocsNavItem {
  title: string;
  path: string | null;
  anchor: string | null;
  items: DocsNavItem[];
}

export type NavigationView =
  | { type: 'overview' }
  | { type: 'module'; context: string; module: string; tab?: string }
  | { type: 'doc'; path: string; anchor?: string };

declare global {
  interface Window {
    __ARCH_CONFIG__: {
      archJsonUrl: string;
      archJsonUpdateUrl: string;
      openapiJsonUrl: string;
      openapiJsonUpdateUrl: string;
      docsNavigationUrl: string;
    };
  }
}
