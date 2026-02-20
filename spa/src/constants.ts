export type ColorName = 'primary' | 'emerald' | 'violet' | 'amber' | 'rose' | 'cyan' | 'slate';

export const COLOR_CLASSES: Record<ColorName, { badge: string; icon: string; statValue: string }> = {
  primary: {
    badge: 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300',
    icon: 'text-primary-600 dark:text-primary-400',
    statValue: 'text-primary-600 dark:text-primary-400',
  },
  emerald: {
    badge: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300',
    icon: 'text-emerald-600 dark:text-emerald-400',
    statValue: 'text-emerald-600 dark:text-emerald-400',
  },
  violet: {
    badge: 'bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300',
    icon: 'text-violet-600 dark:text-violet-400',
    statValue: 'text-violet-600 dark:text-violet-400',
  },
  amber: {
    badge: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
    icon: 'text-amber-600 dark:text-amber-400',
    statValue: 'text-amber-600 dark:text-amber-400',
  },
  rose: {
    badge: 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300',
    icon: 'text-rose-600 dark:text-rose-400',
    statValue: 'text-rose-600 dark:text-rose-400',
  },
  cyan: {
    badge: 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300',
    icon: 'text-cyan-600 dark:text-cyan-400',
    statValue: 'text-cyan-600 dark:text-cyan-400',
  },
  slate: {
    badge: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
    icon: 'text-slate-400',
    statValue: 'text-slate-600 dark:text-slate-400',
  },
};

export interface SectionConfig {
  key: 'commands' | 'queries' | 'domainEvents' | 'eventSubscribers' | 'externalCalls';
  title: string;
  color: ColorName;
  iconPath: string;
}

export const SECTION_CONFIG: SectionConfig[] = [
  {
    key: 'commands',
    title: 'Commands',
    color: 'emerald',
    iconPath: 'M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5',
  },
  {
    key: 'queries',
    title: 'Queries',
    color: 'violet',
    iconPath: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z',
  },
  {
    key: 'domainEvents',
    title: 'Domain Events',
    color: 'amber',
    iconPath: 'M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0',
  },
  {
    key: 'eventSubscribers',
    title: 'Subscribers',
    color: 'rose',
    iconPath: 'M9.348 14.651a3.75 3.75 0 010-5.303m5.304 0a3.75 3.75 0 010 5.303m-7.425 2.122a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546M5.106 18.894c-3.808-3.808-3.808-9.98 0-13.789m13.788 0c3.808 3.808 3.808 9.981 0 13.79M12 12h.008v.007H12V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z',
  },
  {
    key: 'externalCalls',
    title: 'External Calls',
    color: 'cyan',
    iconPath: 'M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25',
  },
];

export const STAT_COLORS: Record<string, ColorName> = {
  Modules: 'primary',
  Endpoints: 'cyan',
  Commands: 'emerald',
  Queries: 'violet',
  Events: 'amber',
};

export const SVG_PATHS = {
  home: 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25',
  module: 'M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9',
  chevronRight: 'M8.25 4.5l7.5 7.5-7.5 7.5',
  folder: 'M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z',
  refresh: 'M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99',
  sun: 'M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z',
  moon: 'M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z',
  bell: 'M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0',
  move: 'M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15',
  endpoint: 'M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A8.966 8.966 0 013 12c0-1.528.38-2.968 1.05-4.228',
  chevronUp: 'M4.5 15.75l7.5-7.5 7.5 7.5',
} as const;
