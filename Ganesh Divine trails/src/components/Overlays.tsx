import type { ReactNode } from "react";

export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border-2 border-white/15 bg-[#161a2c]/95 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.85),inset_0_2px_0_rgba(255,255,255,0.12)] backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}

export function ChunkyButton({
  children,
  onClick,
  color = "amber",
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  color?: "amber" | "green" | "slate" | "red";
  className?: string;
}) {
  const palette: Record<string, string> = {
    amber:
      "from-amber-300 to-amber-500 text-amber-950 shadow-[0_6px_0_#a16207,0_14px_24px_-6px_rgba(245,158,11,0.6)] active:shadow-[0_2px_0_#a16207]",
    green:
      "from-emerald-300 to-emerald-500 text-emerald-950 shadow-[0_6px_0_#047857,0_14px_24px_-6px_rgba(16,185,129,0.6)] active:shadow-[0_2px_0_#047857]",
    red: "from-rose-300 to-rose-500 text-rose-950 shadow-[0_6px_0_#9f1239,0_14px_24px_-6px_rgba(244,63,94,0.6)] active:shadow-[0_2px_0_#9f1239]",
    slate:
      "from-slate-200 to-slate-400 text-slate-900 shadow-[0_6px_0_#475569,0_14px_24px_-6px_rgba(100,116,139,0.5)] active:shadow-[0_2px_0_#475569]",
  };
  return (
    <button
      onClick={onClick}
      className={`bg-gradient-to-b ${palette[color]} translate-y-0 rounded-2xl px-6 py-3 text-lg font-black uppercase tracking-wider transition-all active:translate-y-1 ${className}`}
    >
      {children}
    </button>
  );
}

export function Briefing({
  title,
  color,
  onStart,
  onExit,
}: {
  title: string;
  color: string;
  onStart: () => void;
  onExit: () => void;
}) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#05070f]/80 p-4 backdrop-blur-sm">
      <Panel className="w-full max-w-lg p-8 text-center">
        <h2
          className="text-5xl font-black uppercase tracking-[0.18em] sm:text-6xl"
          style={{ color, textShadow: `0 0 30px ${color}` }}
        >
          {title}
        </h2>
        <div className="mt-8 flex items-center justify-between gap-3">
          <ChunkyButton color="slate" onClick={onExit} className="!px-4 !py-2 !text-sm">
            ← Lobby
          </ChunkyButton>
          <ChunkyButton color="green" onClick={onStart} className="flex-1 !text-xl">
            Start Mission
          </ChunkyButton>
        </div>
      </Panel>
    </div>
  );
}

export function ResultOverlay({
  won,
  title,
  subtitle,
  stats,
  onRetry,
  onLobby,
}: {
  won: boolean;
  title: string;
  subtitle: string;
  stats: [string, string][];
  onRetry: () => void;
  onLobby: () => void;
}) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#05070f]/85 p-4 backdrop-blur-md">
      <Panel className="w-full max-w-lg p-8 text-center">
        <div
          className={`text-4xl font-black uppercase tracking-widest sm:text-5xl ${
            won ? "text-amber-300" : "text-rose-400"
          }`}
          style={{ textShadow: won ? "0 0 26px rgba(251,191,36,0.55)" : "0 0 26px rgba(244,63,94,0.5)" }}
        >
          {title}
        </div>
        <p className="mt-3 text-slate-300">{subtitle}</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          {stats.map(([k, v]) => (
            <div key={k} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{k}</div>
              <div className="text-lg font-black text-white">{v}</div>
            </div>
          ))}
        </div>
        <div className="mt-7 flex justify-center gap-3">
          <ChunkyButton color="slate" onClick={onLobby}>
            Lobby
          </ChunkyButton>
          <ChunkyButton color="amber" onClick={onRetry}>
            Retry
          </ChunkyButton>
        </div>
      </Panel>
    </div>
  );
}

export function GameFrame({
  children,
  onExit,
  label,
}: {
  children: ReactNode;
  onExit: () => void;
  label: string;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#05070f] p-2 sm:p-4">
      <div className="relative aspect-[16/9] w-full max-w-[1280px] overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[0_0_80px_-20px_rgba(120,80,255,0.6)]">
        {children}
        <button
          onClick={onExit}
          className="absolute right-3 top-3 z-20 rounded-xl border border-white/20 bg-black/50 px-3 py-1.5 text-xs font-black uppercase tracking-widest text-white/80 backdrop-blur hover:bg-black/70"
        >
          ✕ Lobby
        </button>
      </div>
      <div className="mt-2 text-center text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
        {label}
      </div>
    </div>
  );
}
