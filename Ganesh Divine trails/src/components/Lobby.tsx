import { useMemo, useState } from "react";
import SpritePreview, { type Kind } from "./SpritePreview";

export type ModeId = "run" | "kaveri" | "modak";

const MODES: {
  id: ModeId;
  name: string;
  desc: string;
  color: string;
  glow: string;
  kind: Kind;
}[] = [
  {
    id: "run",
    name: "RUN",
    desc: "Your parents are your world. Get back to them.",
    color: "#ffd24a",
    glow: "rgba(255,210,74,0.45)",
    kind: "ganeshRun",
  },
  {
    id: "kaveri",
    name: "KAVERI",
    desc: "You are the reason for the formation of the river.",
    color: "#8fe6ff",
    glow: "rgba(143,230,255,0.4)",
    kind: "rishi",
  },
  {
    id: "modak",
    name: "MODAK",
    desc: "I am hungry.",
    color: "#ffb4dd",
    glow: "rgba(255,180,221,0.4)",
    kind: "modak",
  },
];

const CREW: { kind: Kind; name: string; tint: string }[] = [
  { kind: "ganesh", name: "Ganesha · YOU", tint: "#ffd24a" },
  { kind: "karthikeya", name: "Karthikeya", tint: "#7fd6ff" },
  { kind: "rishi", name: "Sage Agastya", tint: "#ff9a4d" },
  { kind: "gana0", name: "Gana Guard", tint: "#9dffd0" },
  { kind: "parvati", name: "Parvati Mata", tint: "#ffb4dd" },
  { kind: "shiva", name: "Lord Shiva", tint: "#b9c9ff" },
  { kind: "mouse", name: "Mushika", tint: "#cbd5e1" },
];

export default function Lobby({ onPlay }: { onPlay: (m: ModeId) => void }) {
  const [sel, setSel] = useState<ModeId>("run");

  const stars = useMemo(
    () =>
      Array.from({ length: 110 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: Math.random() * 2.6 + 0.8,
        delay: Math.random() * 3,
        dur: 2 + Math.random() * 3,
      })),
    [],
  );

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#05070f] text-white">
      {/* starfield */}
      <div className="pointer-events-none absolute inset-0">
        {stars.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white animate-twinkle"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.dur}s`,
            }}
          />
        ))}
      </div>
      {/* nebulae */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-fuchsia-600/20 blur-[120px]" />
      <div className="pointer-events-none absolute -right-32 top-24 h-[480px] w-[480px] rounded-full bg-amber-500/20 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[-180px] left-1/3 h-[560px] w-[560px] rounded-full bg-indigo-600/25 blur-[140px]" />
      {/* floating planet */}
      <div className="pointer-events-none absolute right-10 top-10 hidden h-40 w-40 animate-floaty rounded-full bg-gradient-to-br from-amber-300 via-orange-500 to-rose-700 opacity-70 shadow-[0_0_80px_20px_rgba(251,146,60,0.25)] md:block" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-8">
        {/* ---------- header ---------- */}
        <header className="text-center">
          <h1 className="shimmer-text mt-2 text-5xl font-black uppercase leading-none tracking-tight drop-shadow-[0_6px_0_rgba(0,0,0,0.5)] sm:text-7xl">
            Ganesha
          </h1>
        </header>

        {/* ---------- crew row ---------- */}
        <section className="mt-6 overflow-hidden rounded-3xl border-2 border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-3 backdrop-blur-xl">
          <div className="flex items-end justify-start gap-2 overflow-x-auto pb-1 sm:justify-center">
            {CREW.map((c) => (
              <div key={c.name} className="group flex shrink-0 flex-col items-center">
                <SpritePreview
                  kind={c.kind}
                  width={104}
                  height={128}
                  scale={0.95}
                  glow={`${c.tint}33`}
                  className="transition-transform duration-300 group-hover:-translate-y-1"
                />
              </div>
            ))}
          </div>
        </section>

        {/* ---------- mode cards ---------- */}
        <section className="mt-6 grid flex-1 grid-cols-1 gap-4 md:grid-cols-3">
          {MODES.map((m) => {
            const active = m.id === sel;
            return (
              <button
                key={m.id}
                onClick={() => setSel(m.id)}
                onDoubleClick={() => onPlay(m.id)}
                className={`group relative overflow-hidden rounded-3xl border-2 p-5 text-left transition-all duration-200 ${
                  active
                    ? "-translate-y-1 border-amber-300 bg-white/[0.09] shadow-[0_18px_40px_-12px_rgba(255,210,74,0.45)]"
                    : "border-white/10 bg-white/[0.04] hover:-translate-y-0.5 hover:border-white/25"
                }`}
              >
                <div
                  className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full blur-3xl transition-opacity"
                  style={{ background: m.glow, opacity: active ? 0.9 : 0.35 }}
                />
                <div className="relative text-center">
                  <div
                    className="text-4xl font-black uppercase tracking-[0.18em] text-white"
                    style={{ color: active ? m.color : undefined }}
                  >
                    {m.name}
                  </div>
                </div>

                <div className="relative mt-2 flex items-center justify-center">
                  <SpritePreview
                    kind={m.kind}
                    width={180}
                    height={180}
                    scale={m.kind === "modak" ? 1 : 1.3}
                    glow={m.glow}
                  />
                </div>

                <div className="relative mt-1 min-h-10 text-center text-sm font-semibold leading-snug text-slate-300">
                  {m.desc}
                </div>
              </button>
            );
          })}
        </section>

        {/* ---------- play bar ---------- */}
        <section className="mt-6">
          <button
            onClick={() => onPlay(sel)}
            className="animate-pulseGlow group relative flex w-full items-center justify-between gap-4 overflow-hidden rounded-3xl border-4 border-amber-200/70 bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 px-6 py-5 text-left shadow-[0_10px_0_#a16207,0_26px_50px_-14px_rgba(245,158,11,0.7)] transition-all active:translate-y-1.5 active:shadow-[0_3px_0_#a16207]"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_-40%,rgba(255,255,255,0.6),transparent_55%)]" />
            <div className="relative flex items-center gap-4">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-950/25 text-3xl">
                ▶
              </span>
              <div>
                <div className="text-3xl font-black uppercase leading-none tracking-[0.2em] text-amber-950 sm:text-4xl">
                  Play
                </div>
              </div>
            </div>
          </button>
          <div className="mt-3 text-center text-sm font-bold uppercase tracking-[0.2em] text-slate-300">
            Move: Arrow Keys / WASD&nbsp;&nbsp;&nbsp; Grab: E / Enter
          </div>
        </section>
      </div>
    </div>
  );
}
