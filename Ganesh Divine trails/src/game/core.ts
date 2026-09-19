import { useEffect, useRef } from "react";

export const BASE_W = 1280;
export const BASE_H = 720;

/* ---------------- math helpers ---------------- */
export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const rand = (a: number, b: number) => a + Math.random() * (b - a);
export const dist = (x1: number, y1: number, x2: number, y2: number) =>
  Math.hypot(x2 - x1, y2 - y1);
export const angDiff = (a: number, b: number) => {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
};
export const fmtTime = (s: number) => {
  s = Math.max(0, Math.ceil(s));
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${m}:${ss.toString().padStart(2, "0")}`;
};

/* ---------------- canvas helpers ---------------- */
export function rr(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rad = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

export function blob(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  rot: number,
  fill: string | CanvasGradient,
  outline?: string,
  lw = 2.2,
) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (outline) {
    ctx.lineWidth = lw;
    ctx.strokeStyle = outline;
    ctx.stroke();
  }
}

export function cap(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  w: number,
  fill: string,
  outline?: string,
) {
  ctx.lineCap = "round";
  if (outline) {
    ctx.beginPath();
    ctx.lineWidth = w + 3;
    ctx.strokeStyle = outline;
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.lineWidth = w;
  ctx.strokeStyle = fill;
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

export function grad(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  stops: [number, string][],
) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

export function rgrad(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r0: number,
  r1: number,
  stops: [number, string][],
) {
  const g = ctx.createRadialGradient(x, y, r0, x, y, r1);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

export function shadowEllipse(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  alpha = 0.3,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#0b1020";
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function text(
  ctx: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  size: number,
  color: string,
  align: CanvasTextAlign = "center",
  weight = "800",
  outline?: string,
) {
  ctx.font = `${weight} ${size}px ui-rounded, "Segoe UI", system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  if (outline) {
    ctx.lineWidth = Math.max(3, size * 0.18);
    ctx.lineJoin = "round";
    ctx.strokeStyle = outline;
    ctx.strokeText(s, x, y);
  }
  ctx.fillStyle = color;
  ctx.fillText(s, x, y);
}

/* ---------------- input ---------------- */
export type InputState = {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  action: boolean;
  sneak: boolean;
  actionPressed: boolean;
  upPressed: boolean;
};

export const input: InputState = {
  left: false,
  right: false,
  up: false,
  down: false,
  action: false,
  sneak: false,
  actionPressed: false,
  upPressed: false,
};

export function resetInput() {
  input.left = input.right = input.up = input.down = false;
  input.action = input.sneak = input.actionPressed = input.upPressed = false;
}

const map: Record<string, keyof InputState> = {
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
  ArrowUp: "up",
  KeyW: "up",
  Space: "up",
  ArrowDown: "down",
  KeyS: "down",
  KeyE: "action",
  Enter: "action",
  ShiftLeft: "sneak",
  ShiftRight: "sneak",
};

export function useKeyboard() {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = map[e.code];
      if (!k) return;
      e.preventDefault();
      if (!input[k]) {
        if (k === "action") input.actionPressed = true;
        if (k === "up") input.upPressed = true;
      }
      (input[k] as boolean) = true;
    };
    const up = (e: KeyboardEvent) => {
      const k = map[e.code];
      if (!k) return;
      e.preventDefault();
      (input[k] as boolean) = false;
    };
    const blur = () => resetInput();
    window.addEventListener("keydown", down, { passive: false });
    window.addEventListener("keyup", up, { passive: false });
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      resetInput();
    };
  }, []);
}

/* ---------------- animation loop ---------------- */
export function useRaf(cb: (dt: number, t: number) => void, running = true) {
  const ref = useRef(cb);
  ref.current = cb;
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = performance.now();
    let t = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.045, (now - last) / 1000);
      last = now;
      t += dt;
      ref.current(dt, t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running]);
}
