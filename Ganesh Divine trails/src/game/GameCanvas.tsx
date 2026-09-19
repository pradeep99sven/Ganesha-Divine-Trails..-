import { useEffect, useRef } from "react";
import { BASE_H, BASE_W, input, useKeyboard, useRaf } from "./core";

type Props = {
  frame: (ctx: CanvasRenderingContext2D, dt: number, t: number) => void;
  running?: boolean;
};

export default function GameCanvas({ frame, running = true }: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  useKeyboard();

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = BASE_W * dpr;
    c.height = BASE_H * dpr;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctxRef.current = ctx;
  }, []);

  useRaf((dt, t) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.save();
    frame(ctx, dt, t);
    ctx.restore();
  }, running);

  return (
    <canvas
      ref={ref}
      className="block h-full w-full rounded-xl object-contain"
      style={{ imageRendering: "auto", touchAction: "none" }}
    />
  );
}

/* ------------------------- on-screen controls (touch) ------------------------- */
function Btn({
  k,
  label,
  className = "",
}: {
  k: "left" | "right" | "up" | "down" | "action" | "sneak";
  label: string;
  className?: string;
}) {
  const set = (v: boolean) => {
    if (v && k === "action") input.actionPressed = true;
    if (v && k === "up") input.upPressed = true;
    (input[k] as boolean) = v;
  };
  return (
    <button
      onPointerDown={(e) => {
        e.preventDefault();
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        set(true);
      }}
      onPointerUp={(e) => {
        e.preventDefault();
        set(false);
      }}
      onPointerCancel={() => set(false)}
      onPointerLeave={() => set(false)}
      onContextMenu={(e) => e.preventDefault()}
      className={`select-none rounded-2xl border border-white/25 bg-white/10 text-sm font-black text-white/90 backdrop-blur-md active:scale-95 active:bg-white/30 ${className}`}
    >
      {label}
    </button>
  );
}

export function TouchControls({ action }: { action?: string }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between p-3 lg:hidden">
      <div className="pointer-events-auto flex gap-2">
        <Btn k="left" label="◀" className="h-14 w-14" />
        <Btn k="right" label="▶" className="h-14 w-14" />
      </div>
      <div className="pointer-events-auto flex items-end gap-2">
        <Btn k="down" label="▼" className="h-14 w-14" />
        <Btn k="up" label="▲" className="h-14 w-14" />
        {action ? <Btn k="action" label={action} className="h-14 w-16" /> : null}
      </div>
    </div>
  );
}
