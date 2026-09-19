import { useRef, useState } from "react";
import GameCanvas, { TouchControls } from "./GameCanvas";
import { Briefing, GameFrame, ResultOverlay } from "../components/Overlays";
import {
  BASE_H,
  BASE_W,
  blob,
  clamp,
  fmtTime,
  grad,
  input,
  rgrad,
  rr,
  shadowEllipse,
  text,
} from "./core";
import { hash } from "./backdrop";
import { drawGana, drawGanesh, drawModak, drawParvati, place } from "./sprites";
import { initAudio, sfx } from "./sfx";

const W = 2400;
const H = 1600;
const DURATION = 300;
const NEED = 18;
const P_SPEED = 215;
const SPRINT = 320;
const START = { x: 160, y: H - 170 };

type Rect = { x: number; y: number; w: number; h: number };

const WALLS: Rect[] = [
  { x: 0, y: 0, w: W, h: 44 },
  { x: 0, y: H - 44, w: W, h: 44 },
  { x: 0, y: 0, w: 44, h: H },
  { x: W - 44, y: 0, w: 44, h: H },
  { x: 300, y: 250, w: 430, h: 40 },
  { x: 300, y: 250, w: 40, h: 300 },
  { x: 940, y: 170, w: 40, h: 430 },
  { x: 1240, y: 420, w: 520, h: 40 },
  { x: 1930, y: 210, w: 40, h: 440 },
  { x: 430, y: 820, w: 40, h: 470 },
  { x: 700, y: 1210, w: 560, h: 40 },
  { x: 1520, y: 790, w: 40, h: 420 },
  { x: 1630, y: 1230, w: 500, h: 40 },
  { x: 1040, y: 760, w: 320, h: 40 },
  { x: 660, y: 430, w: 40, h: 170 },
];

const BUSHES = [
  { x: 640, y: 660, r: 62 },
  { x: 1180, y: 300, r: 58 },
  { x: 1760, y: 700, r: 66 },
  { x: 880, y: 1050, r: 60 },
  { x: 2050, y: 1080, r: 62 },
  { x: 380, y: 1420, r: 58 },
  { x: 1400, y: 1420, r: 60 },
  { x: 2150, y: 380, r: 58 },
];

const inWall = (x: number, y: number, pad = 0) =>
  WALLS.some((w) => x > w.x - pad && x < w.x + w.w + pad && y > w.y - pad && y < w.y + w.h + pad);

function los(x1: number, y1: number, x2: number, y2: number) {
  for (let i = 1; i <= 14; i++) {
    const s = i / 15;
    if (inWall(x1 + (x2 - x1) * s, y1 + (y2 - y1) * s)) return false;
  }
  return true;
}

type Guard = {
  route: { x: number; y: number }[];
  i: number;
  x: number;
  y: number;
  ang: number;
  variant: number;
  phase: number;
  speed: number;
  range: number;
  fov: number;
  boss?: boolean;
  active: boolean;
  stuck: number;
};

function makeGuards(): Guard[] {
  const routes: { pts: [number, number][]; v: number }[] = [
    { pts: [[220, 200], [820, 180], [860, 620], [220, 640]], v: 0 },
    { pts: [[1320, 220], [2000, 260], [2050, 760], [1300, 700]], v: 1 },
    { pts: [[560, 900], [1180, 940], [1200, 1400], [560, 1430]], v: 2 },
    { pts: [[1650, 950], [2200, 980], [2180, 1460], [1640, 1420]], v: 0 },
    { pts: [[1000, 480], [1500, 560], [1480, 1120], [1000, 1060]], v: 1 },
  ];
  return routes.map((r, k) => ({
    route: r.pts.map(([x, y]) => ({ x, y })),
    i: 1,
    x: r.pts[0][0],
    y: r.pts[0][1],
    ang: 0,
    variant: r.v,
    phase: k,
    speed: 96 + k * 8,
    range: 270,
    fov: 0.58,
    active: true,
    stuck: 0,
  }));
}

function makeModaks() {
  const out: { x: number; y: number; taken: boolean }[] = [];
  let i = 0;
  while (out.length < 30 && i < 500) {
    const x = 120 + hash(i * 1.7) * (W - 240);
    const y = 120 + hash(i * 3.1 + 5) * (H - 240);
    i++;
    if (inWall(x, y, 46)) continue;
    if (Math.hypot(x - START.x, y - START.y) < 220) continue;
    out.push({ x, y, taken: false });
  }
  return out;
}

function makeState() {
  return {
    time: DURATION,
    px: START.x,
    py: START.y,
    vx: 0,
    vy: 0,
    facing: 1,
    phase: 0,
    moving: false,
    stamina: 1,
    hidden: false,
    cam: { x: 0, y: 0 },
    guards: makeGuards(),
    parvati: {
      route: [
        { x: 1200, y: 920 },
        { x: 780, y: 580 },
        { x: 1480, y: 330 },
        { x: 1860, y: 900 },
        { x: 1250, y: 1380 },
        { x: 620, y: 1040 },
      ],
      i: 1,
      x: 1200,
      y: 920,
      ang: 0,
      variant: 9,
      phase: 0,
      speed: 132,
      range: 340,
      fov: 0.72,
      boss: true,
      active: false,
      stuck: 0,
    } as Guard,
    modaks: makeModaks(),
    got: 0,
    alert: 0,
    seenBy: null as null | Guard,
    strikes: 0,
    invuln: 0,
    freeze: 0,
    msg: "Sneak past Parvati's ganas and eat 18 modaks!",
    msgLife: 4,
    shake: 0,
    pop: [] as { x: number; y: number; life: number; s: string }[],
    result: null as null | "win" | "lose",
  };
}
type S = ReturnType<typeof makeState>;

const say = (s: S, m: string, life = 3) => {
  s.msg = m;
  s.msgLife = life;
};

function moveGuard(g: Guard, dt: number) {
  const tgt = g.route[g.i];
  const dx = tgt.x - g.x,
    dy = tgt.y - g.y;
  const d = Math.hypot(dx, dy) || 1;
  if (d < 18) {
    g.i = (g.i + 1) % g.route.length;
    return;
  }
  const ux = dx / d,
    uy = dy / d;
  const step = g.speed * dt;
  const nx = g.x + ux * step,
    ny = g.y + uy * step;
  let moved = true;
  if (!inWall(nx, ny, 26)) {
    g.x = nx;
    g.y = ny;
  } else if (!inWall(nx, g.y, 26)) g.x = nx;
  else if (!inWall(g.x, ny, 26)) g.y = ny;
  else moved = false;
  if (!moved) {
    g.stuck += dt;
    if (g.stuck > 0.5) {
      g.i = (g.i + 1) % g.route.length;
      g.stuck = 0;
    }
  } else g.stuck = 0;
  const want = Math.atan2(dy, dx);
  let diff = want - g.ang;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  g.ang += diff * Math.min(1, dt * 4);
  g.phase += dt * 4.5;
}

function sees(g: Guard, px: number, py: number, hidden: boolean) {
  if (!g.active || hidden) return false;
  const d = Math.hypot(px - g.x, py - g.y);
  if (d > g.range) return false;
  const a = Math.atan2(py - g.y, px - g.x);
  let diff = a - g.ang;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > g.fov) return d < 90 && los(g.x, g.y, px, py);
  return los(g.x, g.y, px, py);
}

export default function ModakMode({ onExit }: { onExit: () => void }) {
  const [phase, setPhase] = useState<"brief" | "play" | "over">("brief");
  const s = useRef<S>(makeState());
  const [, force] = useState(0);

  const start = () => {
    initAudio();
    s.current = makeState();
    setPhase("play");
  };

  const update = (g: S, dt: number) => {
    g.time -= dt;
    g.msgLife -= dt;
    g.invuln = Math.max(0, g.invuln - dt);
    g.shake = Math.max(0, g.shake - dt * 2);
    if (g.time <= 0) {
      g.result = "lose";
      return;
    }
    if (g.freeze > 0) {
      g.freeze -= dt;
      return;
    }

    /* Parvati enters mid-game */
    if (!g.parvati.active && g.time <= DURATION - 70) {
      g.parvati.active = true;
      g.shake = 1;
      sfx.thud();
      say(g, "PARVATI MATA ENTERS THE COURTYARD!", 4);
    }

    /* --- player movement --- */
    let dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    let dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
    const len = Math.hypot(dx, dy);
    const sprinting = input.sneak && g.stamina > 0.02 && len > 0;
    const spd = sprinting ? SPRINT : P_SPEED;
    g.stamina = clamp(g.stamina + (sprinting ? -0.34 : 0.18) * dt, 0, 1);
    if (len > 0) {
      dx /= len;
      dy /= len;
      const nx = g.px + dx * spd * dt;
      const ny = g.py + dy * spd * dt;
      if (!inWall(nx, g.py, 20)) g.px = nx;
      if (!inWall(g.px, ny, 20)) g.py = ny;
      if (dx !== 0) g.facing = dx > 0 ? 1 : -1;
      g.phase += dt * (spd / 22);
      g.moving = true;
    } else {
      g.moving = false;
      g.phase += dt * 1.2;
    }
    g.px = clamp(g.px, 60, W - 60);
    g.py = clamp(g.py, 60, H - 60);
    g.hidden = !g.moving && BUSHES.some((b) => Math.hypot(b.x - g.px, b.y - g.py) < b.r);

    /* --- guards --- */
    const all = [...g.guards, g.parvati];
    for (const gd of all) if (gd.active) moveGuard(gd, dt);

    let spotted: Guard | null = null;
    for (const gd of all) if (sees(gd, g.px, g.py, g.hidden)) spotted = gd;
    g.seenBy = spotted;
    if (spotted && g.invuln <= 0) {
      g.alert = clamp(g.alert + dt * (spotted.boss ? 2.2 : 1.35), 0, 1);
      if (g.alert >= 1) {
        g.strikes++;
        g.alert = 0;
        sfx.caught();
        const lost = Math.min(g.got, 3);
        g.got -= lost;
        g.px = START.x;
        g.py = START.y;
        g.invuln = 2.6;
        g.freeze = 0.9;
        g.shake = 1;
        say(
          g,
          spotted.boss
            ? `Parvati Mata caught you! −${lost} modak · strike ${g.strikes}/3`
            : `A gana caught you! −${lost} modak · strike ${g.strikes}/3`,
          3,
        );
        if (g.strikes >= 3) g.result = "lose";
        return;
      }
    } else g.alert = clamp(g.alert - dt * 0.7, 0, 1);

    /* --- modaks --- */
    for (const m of g.modaks) {
      if (m.taken) continue;
      if (Math.hypot(m.x - g.px, m.y - g.py) < 42) {
        m.taken = true;
        g.got++;
        sfx.pickup();
        g.pop.push({ x: m.x, y: m.y, life: 1, s: "+1 MODAK" });
        if (g.got >= NEED) {
          g.result = "win";
          return;
        }
      }
    }
    const left = g.modaks.filter((m) => !m.taken).length;
    if (left < 8) {
      for (const m of g.modaks) {
        if (!m.taken) continue;
        if (Math.random() < 0.35 && Math.hypot(m.x - g.px, m.y - g.py) > 400) m.taken = false;
      }
    }
    for (const p of g.pop) p.life -= dt;
    g.pop = g.pop.filter((p) => p.life > 0);
  };

  const render = (ctx: CanvasRenderingContext2D, g: S, t: number) => {
    const tx = clamp(g.px - BASE_W / 2, 0, W - BASE_W);
    const ty = clamp(g.py - BASE_H / 2, 0, H - BASE_H);
    g.cam.x += (tx - g.cam.x) * 0.12;
    g.cam.y += (ty - g.cam.y) * 0.12;
    const cx = g.cam.x + (g.shake > 0 ? Math.sin(t * 50) * 9 * g.shake : 0);
    const cy = g.cam.y;

    /* ---- continuous courtyard floor ---- */
    ctx.fillStyle = grad(ctx, 0, 0, W, H, [
      [0, "#625574"],
      [0.45, "#473b5a"],
      [1, "#241d33"],
    ]);
    ctx.fillRect(0, 0, BASE_W, BASE_H);
    ctx.save();
    ctx.translate(-cx, -cy);
    /* Broad light pools and loose brush marks give the courtyard depth without a tile grid. */
    for (let i = 0; i < 11; i++) {
      const x = 100 + hash(i * 2.7) * (W - 200);
      const y = 100 + hash(i * 4.1 + 8) * (H - 200);
      ctx.fillStyle = rgrad(ctx, x, y, 8, 260, [
        [0, "rgba(255,220,180,0.14)"],
        [1, "rgba(255,220,180,0)"],
      ]);
      ctx.beginPath();
      ctx.arc(x, y, 260, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.lineCap = "round";
    for (let i = 0; i < 18; i++) {
      const y = 100 + hash(i + 51) * (H - 200);
      const x = hash(i + 71) * (W - 500);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + 130, y - 28, x + 260, y + 30, x + 410, y - 8);
      ctx.strokeStyle = "rgba(255,239,215,0.055)";
      ctx.lineWidth = 2 + hash(i + 91) * 3;
      ctx.stroke();
    }

    /* bushes */
    for (const b of BUSHES) {
      ctx.fillStyle = rgrad(ctx, b.x, b.y, b.r * 0.2, b.r, [
        [0, "rgba(60,140,80,0.95)"],
        [1, "rgba(25,70,45,0.85)"],
      ]);
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(20,50,30,0.8)";
      ctx.lineWidth = 3;
      ctx.stroke();
      for (let i = 0; i < 6; i++) {
        const a = i * 1.05 + b.x;
        blob(ctx, b.x + Math.cos(a) * b.r * 0.55, b.y + Math.sin(a) * b.r * 0.55, 18, 14, a,
          "rgba(90,180,105,0.55)");
      }
    }

    /* vision cones */
    const all = [...g.guards, g.parvati];
    for (const gd of all) {
      if (!gd.active) continue;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const cg = ctx.createRadialGradient(gd.x, gd.y, 12, gd.x, gd.y, gd.range);
      const hot = g.seenBy === gd;
      cg.addColorStop(0, hot ? "rgba(255,70,70,0.55)" : gd.boss ? "rgba(255,120,190,0.3)" : "rgba(255,225,150,0.26)");
      cg.addColorStop(1, "rgba(255,180,90,0)");
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.moveTo(gd.x, gd.y);
      ctx.arc(gd.x, gd.y, gd.range, gd.ang - gd.fov, gd.ang + gd.fov);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    /* walls */
    for (const w of WALLS) {
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(w.x + 8, w.y + 12, w.w, w.h);
      rr(ctx, w.x, w.y, w.w, w.h, 8);
      ctx.fillStyle = grad(ctx, w.x, w.y, w.x, w.y + w.h, [
        [0, "#b9a38a"],
        [0.45, "#8d7660"],
        [1, "#5d4a3a"],
      ]);
      ctx.fill();
      ctx.strokeStyle = "rgba(40,28,18,0.7)";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = "rgba(255,240,210,0.22)";
      ctx.fillRect(w.x + 5, w.y + 4, Math.max(0, w.w - 10), 5);
    }

    /* modaks on plates */
    for (const m of g.modaks) {
      if (m.taken) continue;
      ctx.save();
      ctx.translate(m.x, m.y + 8);
      blob(ctx, 0, 4, 20, 8, 0, "rgba(255,240,200,0.18)");
      drawModak(ctx, 1.25, t + m.x * 0.01);
      ctx.restore();
    }

    /* entities sorted by y */
    type Ent = { y: number; draw: () => void };
    const ents: Ent[] = [];
    for (const gd of all) {
      if (!gd.active) continue;
      const face = Math.cos(gd.ang) >= 0 ? 1 : -1;
      ents.push({
        y: gd.y,
        draw: () => {
          place(ctx, gd.x, gd.y + 18, gd.boss ? 1.35 : 1.15, face, () =>
            gd.boss
              ? drawParvati(ctx, { phase: gd.phase, moving: true })
              : drawGana(ctx, gd.variant, { phase: gd.phase, moving: true }),
          );
          if (g.seenBy === gd)
            text(ctx, "!", gd.x, gd.y - 150, 44, "#ff5a5a", "center", "900", "#2b0505");
        },
      });
    }
    ents.push({
      y: g.py,
      draw: () => {
        ctx.save();
        if (g.invuln > 0) ctx.globalAlpha = 0.45 + Math.sin(t * 22) * 0.3;
        if (g.hidden) ctx.globalAlpha = 0.5;
        shadowEllipse(ctx, g.px, g.py + 16, 26, 9, 0.35);
        place(ctx, g.px, g.py + 18, 1.2, g.facing, () =>
          drawGanesh(ctx, { phase: g.phase, moving: g.moving }),
        );
        ctx.restore();
      },
    });
    ents.sort((a, b) => a.y - b.y);
    for (const e of ents) e.draw();

    /* warm lamp pools */
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 10; i++) {
      const lx = 200 + hash(i) * (W - 400),
        ly = 200 + hash(i + 31) * (H - 400);
      const fl = 0.75 + Math.sin(t * 6 + i) * 0.1;
      ctx.fillStyle = rgrad(ctx, lx, ly, 6, 180, [
        [0, `rgba(255,190,110,${0.3 * fl})`],
        [1, "rgba(255,150,60,0)"],
      ]);
      ctx.beginPath();
      ctx.arc(lx, ly, 180, 0, Math.PI * 2);
      ctx.fill();
      blob(ctx, lx, ly, 10, 10, 0, "rgba(255,220,150,0.9)");
    }
    ctx.restore();
    ctx.restore();

    /* ---- night grade + vignette ---- */
    ctx.fillStyle = "rgba(25,10,45,0.25)";
    ctx.fillRect(0, 0, BASE_W, BASE_H);
    ctx.fillStyle = rgrad(ctx, BASE_W / 2, BASE_H / 2, BASE_H * 0.38, BASE_H * 1.0, [
      [0, "rgba(0,0,0,0)"],
      [1, "rgba(0,0,0,0.62)"],
    ]);
    ctx.fillRect(0, 0, BASE_W, BASE_H);

    hud(ctx, g, t);

    if (g.alert > 0.05) {
      ctx.fillStyle = `rgba(255,40,40,${g.alert * 0.22})`;
      ctx.fillRect(0, 0, BASE_W, BASE_H);
    }
  };

  const hud = (ctx: CanvasRenderingContext2D, g: S, t: number) => {
    /* timer */
    rr(ctx, BASE_W / 2 - 82, 14, 164, 52, 16);
    ctx.fillStyle = "rgba(10,14,30,0.72)";
    ctx.fill();
    text(ctx, fmtTime(g.time), BASE_W / 2, 40, 30, g.time < 30 ? "#ff8d8d" : "#fff");

    /* hunger bar */
    const bw = 460,
      bx = BASE_W / 2 - bw / 2,
      by = BASE_H - 74;
    rr(ctx, bx - 16, by - 20, bw + 32, 62, 18);
    ctx.fillStyle = "rgba(10,14,30,0.72)";
    ctx.fill();
    text(ctx, "HUNGER", bx - 2, by - 4, 13, "#9fb0d0", "left", "800");
    rr(ctx, bx, by + 6, bw, 24, 12);
    ctx.fillStyle = "rgba(255,255,255,0.14)";
    ctx.fill();
    const hp = clamp(g.got / NEED, 0, 1);
    rr(ctx, bx + 3, by + 9, (bw - 6) * hp, 18, 9);
    ctx.fillStyle = grad(ctx, bx, 0, bx + bw, 0, [
      [0, "#ffe9a8"],
      [0.6, "#ffc043"],
      [1, "#ff8a3d"],
    ]);
    ctx.fill();
    for (let i = 1; i < NEED; i++) {
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(bx + (bw * i) / NEED, by + 9, 1.5, 18);
    }
    text(ctx, `${g.got} / ${NEED} MODAK`, bx + bw / 2, by + 18, 17, "#3a2405", "center", "900");
    if (hp >= 1) text(ctx, "FULL!", bx + bw + 40, by + 18, 22, "#ffd24a", "center", "900");

    /* strikes */
    rr(ctx, 18, 14, 210, 88, 16);
    ctx.fillStyle = "rgba(10,14,30,0.72)";
    ctx.fill();
    text(ctx, "CAUGHT", 34, 32, 13, "#9fb0d0", "left", "800");
    for (let i = 0; i < 3; i++) {
      const x = 48 + i * 42;
      blob(ctx, x, 56, 14, 14, 0, i < g.strikes ? "#ff5a5a" : "rgba(255,255,255,0.14)",
        "rgba(255,255,255,0.25)", 2);
      if (i < g.strikes) text(ctx, "✕", x, 57, 16, "#3a0505");
    }
    text(ctx, "STAMINA", 34, 82, 12, "#9fb0d0", "left", "800");
    rr(ctx, 110, 74, 100, 12, 6);
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fill();
    rr(ctx, 112, 76, 96 * g.stamina, 8, 4);
    ctx.fillStyle = "#7fd6ff";
    ctx.fill();

    /* alert meter */
    if (g.alert > 0.02) {
      const aw = 220;
      rr(ctx, BASE_W / 2 - aw / 2, 78, aw, 16, 8);
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fill();
      rr(ctx, BASE_W / 2 - aw / 2 + 2, 80, (aw - 4) * g.alert, 12, 6);
      ctx.fillStyle = g.alert > 0.6 ? "#ff5a5a" : "#ffd24a";
      ctx.fill();
      text(ctx, "SPOTTED!", BASE_W / 2, 110, 18, "#ff8d8d", "center", "900", "#2b0505");
    }

    /* minimap */
    const mw = 230,
      mh = (mw * H) / W,
      mx = BASE_W - mw - 20,
      my = 16;
    rr(ctx, mx - 6, my - 6, mw + 12, mh + 12, 12);
    ctx.fillStyle = "rgba(10,14,30,0.78)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 2;
    ctx.stroke();
    const sx = mw / W,
      sy = mh / H;
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fillRect(mx, my, mw, mh);
    for (const w of WALLS) {
      ctx.fillStyle = "rgba(255,230,190,0.4)";
      ctx.fillRect(mx + w.x * sx, my + w.y * sy, Math.max(1.5, w.w * sx), Math.max(1.5, w.h * sy));
    }
    for (const m of g.modaks)
      if (!m.taken) {
        ctx.fillStyle = "#ffd24a";
        ctx.fillRect(mx + m.x * sx - 1.5, my + m.y * sy - 1.5, 3.5, 3.5);
      }
    for (const gd of [...g.guards, g.parvati]) {
      if (!gd.active) continue;
      ctx.beginPath();
      ctx.arc(mx + gd.x * sx, my + gd.y * sy, gd.boss ? 5 : 3.6, 0, Math.PI * 2);
      ctx.fillStyle = gd.boss ? "#ff7ac1" : "#ff5a5a";
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(mx + g.px * sx, my + g.py * sy, 4.5 + Math.sin(t * 6) * 0.8, 0, Math.PI * 2);
    ctx.fillStyle = "#7dfcc0";
    ctx.fill();
  };

  const frame = (ctx: CanvasRenderingContext2D, dt: number, t: number) => {
    const g = s.current;
    if (phase === "play" && !g.result) update(g, dt);
    render(ctx, g, t);
    if (g.result && phase === "play") {
      if (g.result === "win") sfx.win();
      else sfx.lose();
      setPhase("over");
      force((n) => n + 1);
    }
  };

  const g = s.current;
  return (
    <GameFrame onExit={onExit} label="MODAK">
      <GameCanvas frame={frame} />
      {phase === "play" && <TouchControls />}
      {phase === "brief" && (
        <Briefing
          title="MODAK"
          color="#ffb4dd"
          onStart={start}
          onExit={onExit}
        />
      )}
      {phase === "over" && (
        <ResultOverlay
          won={g.result === "win"}
          title={g.result === "win" ? "Belly Full!" : "Caught!"}
          subtitle={
            g.result === "win"
              ? "Eighteen modaks devoured — Ganesha pats his happy belly while the ganas look around confused."
              : g.strikes >= 3
                ? "Three catches and the ganas hauled you to Mata. Try a quieter route."
                : "Time's up and the belly is still rumbling."
          }
          stats={[
            ["Modaks", `${g.got}/${NEED}`],
            ["Caught", `${g.strikes}/3`],
            ["Time Left", fmtTime(Math.max(0, g.time))],
            ["Hunger", `${Math.round((g.got / NEED) * 100)}%`],
          ]}
          onRetry={start}
          onLobby={onExit}
        />
      )}
    </GameFrame>
  );
}
