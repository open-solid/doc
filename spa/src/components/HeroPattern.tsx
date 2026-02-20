export function HeroPattern() {
  return (
    <div className="absolute -inset-x-8 -top-25 -z-10 h-[28rem] pointer-events-none overflow-visible">
      <div
        className="absolute left-1/2 top-0 -translate-x-1/2
          h-[24rem] w-[60rem]
          bg-[radial-gradient(50%_100%_at_50%_0%,_rgba(99,102,241,0.25)_0%,_transparent_100%)]
          dark:bg-[radial-gradient(50%_100%_at_50%_0%,_rgba(99,102,241,0.3)_0%,_transparent_100%)]"
      />
      <svg
        className="absolute left-1/2 top-0 -translate-x-1/2 h-[28rem] w-[60rem]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="hero-cell-noise" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feTurbulence type="turbulence" baseFrequency="0.006" numOctaves="1" seed="42" result="noise" />
            <feComponentTransfer in="noise" result="stepped">
              <feFuncR type="discrete" tableValues="0.3 0.35 0.4 0.45 0.5 0.55" />
              <feFuncG type="discrete" tableValues="0.3 0.35 0.4 0.45 0.5 0.55" />
              <feFuncB type="discrete" tableValues="0.5 0.55 0.6 0.65 0.7 0.75" />
              <feFuncA type="linear" slope="0.2" intercept="0" />
            </feComponentTransfer>
          </filter>
          <pattern id="hero-grid" width="45" height="75" patternUnits="userSpaceOnUse" patternTransform="rotate(75)">
            <rect width="45" height="75" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
          <radialGradient id="hero-grid-fade" cx="50%" cy="0%" r="50%" fx="50%" fy="0%">
            <stop offset="0%" stopColor="white" stopOpacity="0.1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="hero-grid-mask">
            <rect width="100%" height="100%" fill="url(#hero-grid-fade)" />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          filter="url(#hero-cell-noise)"
          mask="url(#hero-grid-mask)"
        />
        <rect
          width="100%"
          height="100%"
          fill="url(#hero-grid)"
          mask="url(#hero-grid-mask)"
          className="text-indigo-300/10 dark:text-indigo-400/10"
        />
      </svg>
    </div>
  );
}
