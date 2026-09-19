import { useEffect, useRef } from "react";
import { rgrad, useRaf } from "../game/core";
import {
  drawGana,
  drawGanesh,
  drawKarthikeya,
  drawModak,
  drawMouse,
  drawParvati,
  drawRishi,
  drawShiva,
  place,
} from "../game/sprites";

export type Kind =
  | "ganesh"
  | "ganeshRun"
  | "karthikeya"
  | "rishi"
  | "gana0"
  | "gana1"
  | "parvati"
  | "shiva"
  | "modak"
  | "mouse";

export default function SpritePreview({
  kind,
  width = 170,
  height = 190,
  scale = 1.3,
  glow = "rgba(255,210,120,0.35)",
  className = "",
}: {
  kind: Kind;
  width?: number;
  height?: number;
  scale?: number;
  glow?: string;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = width * dpr;
    c.height = height * dpr;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctxRef.current = ctx;
  }, [width, height]);

  useRaf((_dt, t) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = true;
    const bx = width / 2;
    const by = height - 16;

    ctx.save();
    ctx.fillStyle = rgrad(ctx, bx, by - 28, 6, height * 0.48, [
      [0, glow],
      [0.5, "rgba(255,255,255,0.025)"],
      [1, "rgba(0,0,0,0)"],
    ]);
    ctx.beginPath();
    ctx.arc(bx, by - 28, height * 0.48, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(4,8,18,0.35)";
    ctx.beginPath();
    ctx.ellipse(bx, by - 2, width * 0.22, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const moving = kind === "ganeshRun" || kind === "karthikeya" || kind === "gana0" || kind === "gana1";
    const phase = moving ? t * 7 : t;
    place(ctx, bx, by, scale, 1, () => {
      switch (kind) {
        case "ganesh":
          drawGanesh(ctx, { phase, moving: false });
          break;
        case "ganeshRun":
          drawGanesh(ctx, { phase, moving: true });
          break;
        case "karthikeya":
          drawKarthikeya(ctx, { phase, moving: true });
          break;
        case "rishi":
          drawRishi(ctx, { phase: t * 2.2, moving: true });
          break;
        case "gana0":
          drawGana(ctx, 0, { phase, moving: true });
          break;
        case "gana1":
          drawGana(ctx, 1, { phase, moving: true });
          break;
        case "parvati":
          drawParvati(ctx, { phase: t * 2, moving: true });
          break;
        case "shiva":
          drawShiva(ctx, { phase: t });
          break;
        case "mouse":
          drawMouse(ctx, 1.4, t);
          break;
        case "modak":
          ctx.translate(0, -34);
          drawModak(ctx, 2.4, t);
          break;
      }
    });
  });

  return (
    <canvas
      ref={ref}
      style={{ width, height }}
      className={`block ${className}`}
      aria-hidden
    />
  );
}
