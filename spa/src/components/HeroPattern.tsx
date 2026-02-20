export function HeroPattern() {
  return (
    <div className="absolute -inset-x-8 -top-8 -z-10 h-[28rem] pointer-events-none overflow-visible">
      <div
        className="absolute left-1/2 top-0 -translate-x-1/2
          h-[24rem] w-[60rem]
          bg-[radial-gradient(50%_100%_at_50%_0%,_rgba(99,102,241,0.25)_0%,_transparent_100%)]
          dark:bg-[radial-gradient(50%_100%_at_50%_0%,_rgba(99,102,241,0.3)_0%,_transparent_100%)]"
      />
    </div>
  );
}
