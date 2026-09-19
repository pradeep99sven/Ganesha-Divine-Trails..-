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
import { DAY, drawBackdrop, drawGround, drawScatter, hash } from "./backdrop";
import { initAudio, sfx } from "./sfx";
import {
  drawGanesh,
  drawKarthikeya,
  drawModak,
  drawMouse,
  drawParvati,
  drawShiva,
  place,
  stoneBlock,
} from "./sprites";

const GROUND = 566;
const LAP = 16000;
const LAPS = 3;
const TOTAL = LAP * LAPS;
const P_SPEED = 200;
const K_SPEED = 400;
const DURATION = 120;
const WALL_AT = 60;
const RX = 156;
const RY = 42;
const TAU = Math.PI * 2;

type Particle = { x: number; y: number; vx: number; vy: number; life: number };

function makeState() {
  const modaks: { x: number; y: number; taken: boolean }[] = [];
  for (let i = 1; i < 120; i++)
    modaks.push({
      x: 900 + i * 520 + hash(i) * 260,
      y: GROUND - (hash(i + 3) > 0.6 ? 150 : 46),
      taken: false,
    });
  return {
    time: DURATION,
    px: 160,
    py: GROUND,
    vy: 0,
    onGround: true,
    facing: 1,
    phase: 0,
    cam: 0,
    kx: 160,
    /* The shrine is hidden behind the start line and discovered by backtracking. */
    ringX: -720,
    ringLaps: 0,
    ringAccum: 0,
    inRing: false,
    theta: 0,
    walls: null as null | { a: number; b: number },
    wallsSpawned: false,
    modaks,
    got: 0,
    boost: 0,
    dust: [] as Particle[],
    msg: "",
    msgLife: 0,
    flash: 0,
    result: null as null | "win" | "lose",
  };
}
type S = ReturnType<typeof makeState>;

function say(s: S, m: string) {
  s.msg = m;
  s.msgLife = 3.2;
}

export default function RunMode({ onExit }: { onExit: () => void }) {
  const [phase, setPhase] = useState<"brief" | "play" | "over">("brief");
  const s = useRef<S>(makeState());
  const [, force] = useState(0);

  const start = () => {
    initAudio();
    s.current = makeState();
    setPhase("play");
  };

  /* ------------------------------------------------------------- update */
  const update = (g: S, dt: number) => {
    g.time -= dt;
    g.msgLife -= dt;
    g.flash = Math.max(0, g.flash - dt * 1.6);
    g.boost = Math.max(0, g.boost - dt);

    /* Karthikeya sprints the world circuit */
    g.kx += K_SPEED * (1 + Math.sin(g.time * 0.8) * 0.05) * dt;

    /* walls of illusion after 1 minute */
    const elapsed = DURATION - g.time;
    if (!g.wallsSpawned && elapsed >= WALL_AT) {
      g.wallsSpawned = true;
      const a = g.px - 560;
      const b = g.px + 760;
      g.walls = { a, b };
      say(g, "BLOCKED! The path ahead and behind is sealed!");
      g.flash = 1;
      sfx.thud();
    }

    if (g.inRing) {
      const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      const omega = 1.25;
      if (dir !== 0) {
        const d = -dir * omega * dt;
        g.theta += d;
        g.ringAccum += -d;
        g.phase += dt * 7;
        g.facing = -Math.sin(g.theta) * -dir > 0 ? 1 : -1;
      }
      const done = Math.floor(Math.max(0, g.ringAccum) / TAU);
      if (done > g.ringLaps) {
        g.ringLaps = done;
        g.flash = 0.8;
        sfx.chime();
        say(
          g,
          done >= LAPS
            ? "THREE PRADAKSHINAS COMPLETE!"
            : `PRADAKSHINA ${done} of ${LAPS}!  Keep circling!`,
        );
        for (let i = 0; i < 26; i++)
          g.dust.push({
            x: g.ringX + Math.cos(i) * 90,
            y: GROUND - 40 + Math.sin(i) * 30,
            vx: Math.cos(i) * 60,
            vy: -60 - Math.random() * 90,
            life: 1,
          });
      }
      if (g.ringLaps >= LAPS) {
        g.result = "win";
        return;
      }
      g.px = g.ringX + Math.cos(g.theta) * RX;
      g.py = GROUND;
      if (input.down) {
        g.inRing = false;
        input.down = false;
      }
    } else {
      const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      const spd = P_SPEED * (g.boost > 0 ? 1.5 : 1);
      if (dir !== 0) {
        g.px += dir * spd * dt;
        g.facing = dir;
        g.phase += dt * (spd / 26);
      } else g.phase += dt * 1.4;

      const nearRing = Math.abs(g.px - g.ringX) < RX + 40 && g.onGround;
      if (nearRing && input.upPressed) {
        input.upPressed = false;
        g.inRing = true;
        g.theta = g.px > g.ringX ? 0 : Math.PI;
        say(g, "Circle your parents — they are your whole world!");
      } else if (input.upPressed && g.onGround) {
        input.upPressed = false;
        g.vy = -640;
        g.onGround = false;
        sfx.jump();
      }

      g.vy += 1750 * dt;
      g.py += g.vy * dt;
      if (g.py >= GROUND) {
        g.py = GROUND;
        g.vy = 0;
        g.onGround = true;
      }
      if (g.walls) {
        g.px = clamp(g.px, g.walls.a + 66, g.walls.b - 66);
      }
      g.px = Math.max(-980, g.px);

      if (g.onGround && dir !== 0 && Math.random() < 0.4)
        g.dust.push({
          x: g.px,
          y: GROUND,
          vx: -dir * (30 + Math.random() * 60),
          vy: -Math.random() * 60,
          life: 0.5,
        });
    }

    /* modaks */
    for (const m of g.modaks) {
      if (m.taken) continue;
      if (Math.abs(m.x - g.px) < 36 && Math.abs(m.y - g.py) < 90) {
        m.taken = true;
        g.got++;
        g.boost = 3;
        sfx.pickup();
        for (let i = 0; i < 10; i++)
          g.dust.push({
            x: m.x,
            y: m.y,
            vx: (Math.random() - 0.5) * 160,
            vy: -Math.random() * 160,
            life: 0.7,
          });
      }
    }

    for (const p of g.dust) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 300 * dt;
      p.life -= dt;
    }
    g.dust = g.dust.filter((p) => p.life > 0).slice(-160);

    if (g.kx >= TOTAL) g.result = "lose";
    if (g.time <= 0) g.result = "lose";
  };

  /* ------------------------------------------------------------- render */
  const render = (ctx: CanvasRenderingContext2D, g: S, t: number) => {
    const target = g.px - 430;
    g.cam += (target - g.cam) * 0.1;
    const cam = g.cam;

    drawBackdrop(ctx, cam, t, DAY, GROUND);
    drawScatter(ctx, cam, t, GROUND, 620);
    drawGround(ctx, cam, t, DAY, GROUND);

    /* A quiet start line hides the parent shrine in the world behind it. */
    const startLine = 160 - cam;
    if (startLine > -20 && startLine < BASE_W + 20) {
      ctx.save();
      ctx.globalAlpha = 0.8;
      ctx.strokeStyle = "#f4c56b";
      ctx.lineWidth = 5;
      ctx.setLineDash([18, 12]);
      ctx.beginPath();
      ctx.moveTo(startLine, GROUND - 8);
      ctx.lineTo(startLine, GROUND + 32);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    /* distance banners */
    const first = Math.floor(cam / 1000);
    for (let i = first; i < first + 3; i++) {
      const x = i * 1000 - cam;
      if (i <= 0) continue;
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = "#6b4a2a";
      ctx.fillRect(x - 3, GROUND - 78, 6, 78);
      rr(ctx, x - 44, GROUND - 108, 88, 34, 7);
      ctx.fillStyle = "#c9863f";
      ctx.fill();
      ctx.strokeStyle = "#7a4c1c";
      ctx.lineWidth = 2;
      ctx.stroke();
      text(ctx, `${i}k`, x, GROUND - 91, 18, "#fff6dd");
      ctx.restore();
    }

    /* modaks */
    for (const m of g.modaks) {
      if (m.taken) continue;
      const sx = m.x - cam;
      if (sx < -60 || sx > BASE_W + 60) continue;
      ctx.save();
      ctx.translate(sx, m.y);
      drawModak(ctx, 1.15, t + m.x);
      ctx.restore();
    }

    /* ---- pradakshina shrine ---- */
    const rx = g.ringX - cam;
    if (rx > -420 && rx < BASE_W + 420) {
      const cy = GROUND - 6;
      /* halo */
      ctx.fillStyle = rgrad(ctx, rx, cy - 90, 20, 300, [
        [0, "rgba(255,226,150,0.45)"],
        [1, "rgba(255,226,150,0)"],
      ]);
      ctx.beginPath();
      ctx.arc(rx, cy - 90, 300, 0, TAU);
      ctx.fill();
      /* ring path */
      ctx.save();
      ctx.lineWidth = 16;
      ctx.strokeStyle = "rgba(255,214,110,0.30)";
      ctx.beginPath();
      ctx.ellipse(rx, cy, RX, RY, 0, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([26, 18]);
      ctx.lineDashOffset = -t * 40;
      ctx.lineWidth = 5;
      ctx.strokeStyle = "rgba(255,246,200,0.9)";
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      const behind = Math.sin(g.theta) < 0;
      const drawPlayerOnRing = () => {
        if (!g.inRing) return;
        const sx = rx + Math.cos(g.theta) * RX;
        const sy = cy + Math.sin(g.theta) * RY;
        const depth = (Math.sin(g.theta) + 1) / 2;
        place(ctx, sx, sy, 1.0 + depth * 0.22, g.facing, () =>
          drawGanesh(ctx, { phase: g.phase, moving: input.left || input.right }),
        );
      };
      if (behind) drawPlayerOnRing();

      /* lotus dais */
      ctx.save();
      shadowEllipse(ctx, rx, cy - 2, 96, 22, 0.25);
      blob(ctx, rx, cy - 10, 92, 26, 0, grad(ctx, rx - 90, cy - 30, rx + 90, cy + 8, [
        [0, "#ffd9e6"],
        [0.5, "#ff9ec2"],
        [1, "#d95b91"],
      ]), "#a63b6c", 2);
      for (let i = -4; i <= 4; i++)
        blob(ctx, rx + i * 20, cy - 16, 13, 9, i * 0.08, "rgba(255,255,255,0.35)");
      ctx.restore();

      place(ctx, rx - 52, cy - 22, 1.15, 1, () => drawShiva(ctx, { phase: t }));
      place(ctx, rx + 52, cy - 22, 1.1, -1, () => drawParvati(ctx, { phase: t }));

      if (!behind) drawPlayerOnRing();

      /* counter above shrine */
      for (let i = 0; i < LAPS; i++) {
        const bx = rx - 42 + i * 42;
        const by = cy - 220;
        blob(ctx, bx, by, 15, 15, 0, i < g.ringLaps ? "#ffd24a" : "rgba(255,255,255,0.18)",
          "#6b4a10", 2);
        if (i < g.ringLaps) text(ctx, "✓", bx, by + 1, 17, "#6b4a10");
      }
      text(ctx, `PRADAKSHINA ${g.ringLaps}/${LAPS}`, rx, cy - 250, 19, "#fff3c4", "center", "900", "#4a2a05");

    }

    /* walls of illusion */
    if (g.walls) {
      for (const wx of [g.walls.a, g.walls.b]) {
        const x = wx - cam;
        if (x < -160 || x > BASE_W + 160) continue;
        for (let i = 0; i < 5; i++) stoneBlock(ctx, x - 44, GROUND - 78 - i * 72, 88, 74, 1);
        ctx.save();
        ctx.globalAlpha = 0.35 + Math.sin(t * 4) * 0.12;
        ctx.fillStyle = grad(ctx, x - 40, 0, x + 40, 0, [
          [0, "rgba(140,90,255,0)"],
          [0.5, "rgba(170,120,255,0.8)"],
          [1, "rgba(140,90,255,0)"],
        ]);
        ctx.fillRect(x - 52, GROUND - 440, 104, 440);
        ctx.restore();
      }
    }

    /* Karthikeya (visible when he laps past you) */
    const rel = (((g.kx - g.px) % LAP) + LAP) % LAP;
    if (rel < 1000) {
      const sx = g.px + rel - cam;
      ctx.save();
      ctx.globalAlpha = 0.9;
      for (let i = 1; i < 5; i++) {
        ctx.globalAlpha = 0.16 / i;
        place(ctx, sx - i * 26, GROUND, 1.12, 1, () =>
          drawKarthikeya(ctx, { phase: t * 16 - i, moving: true }),
        );
      }
      ctx.restore();
      place(ctx, sx, GROUND, 1.12, 1, () => drawKarthikeya(ctx, { phase: t * 16, moving: true }));
      text(ctx, "KARTHIKEYA", sx, GROUND - 130, 16, "#ffe9a8", "center", "900", "#4a2a05");
    }

    /* mushika companion */
    if (!g.inRing) {
      const mx = g.px - 70 - cam + Math.sin(t * 2) * 10;
      ctx.save();
      ctx.translate(mx, GROUND);
      drawMouse(ctx, 0.75, t);
      ctx.restore();
    }

    /* player */
    if (!g.inRing) {
      const sx = g.px - cam;
      if (g.boost > 0) {
        ctx.save();
        for (let i = 1; i < 4; i++) {
          ctx.globalAlpha = 0.14 / i;
          place(ctx, sx - g.facing * i * 22, g.py, 1.18, g.facing, () =>
            drawGanesh(ctx, { phase: g.phase - i * 0.5, moving: true }),
          );
        }
        ctx.restore();
      }
      place(ctx, sx, g.py, 1.18, g.facing, () =>
        drawGanesh(ctx, {
          phase: g.phase,
          moving: (input.left || input.right) && g.onGround,
          air: !g.onGround,
        }),
      );
    }

    /* dust */
    for (const p of g.dust) {
      ctx.globalAlpha = clamp(p.life, 0, 1) * 0.7;
      blob(ctx, p.x - cam, p.y, 4 + (1 - p.life) * 5, 4, 0, "#fff3d0");
    }
    ctx.globalAlpha = 1;

    /* ------------------- HUD ------------------- */
    hud(ctx, g);

    if (g.flash > 0) {
      ctx.fillStyle = `rgba(255,245,210,${g.flash * 0.5})`;
      ctx.fillRect(0, 0, BASE_W, BASE_H);
    }

    /* vignette */
    ctx.fillStyle = rgrad(ctx, BASE_W / 2, BASE_H / 2, BASE_H * 0.5, BASE_H * 1.05, [
      [0, "rgba(0,0,0,0)"],
      [1, "rgba(0,0,0,0.45)"],
    ]);
    ctx.fillRect(0, 0, BASE_W, BASE_H);
  };

  const hud = (ctx: CanvasRenderingContext2D, g: S) => {
    /* timer */
    rr(ctx, BASE_W / 2 - 78, 14, 156, 52, 16);
    ctx.fillStyle = "rgba(10,14,30,0.7)";
    ctx.fill();
    ctx.strokeStyle = g.time < 20 ? "#ff6b6b" : "rgba(255,255,255,0.2)";
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, fmtTime(g.time), BASE_W / 2, 40, 30, g.time < 20 ? "#ff8d8d" : "#fff");

    /* race bar */
    const bw = 470,
      bx = BASE_W / 2 - bw / 2,
      by = 84;
    rr(ctx, bx - 10, by - 14, bw + 20, 46, 14);
    ctx.fillStyle = "rgba(10,14,30,0.6)";
    ctx.fill();
    rr(ctx, bx, by, bw, 12, 6);
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fill();
    for (let i = 1; i < LAPS; i++) {
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.fillRect(bx + (bw * i) / LAPS, by - 4, 2, 20);
    }
    const pp = clamp(g.px / TOTAL, 0, 1);
    const kp = clamp(g.kx / TOTAL, 0, 1);
    rr(ctx, bx, by, bw * pp, 12, 6);
    ctx.fillStyle = "#ffd24a";
    ctx.fill();
    /* markers */
    const marker = (p: number, color: string, label: string, up: boolean) => {
      const x = bx + bw * p;
      ctx.beginPath();
      ctx.arc(x, by + 6, 11, 0, TAU);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#0e1226";
      ctx.stroke();
      text(ctx, label, x, by + (up ? -14 : 26), 13, color, "center", "900", "#0e1226");
    };
    marker(kp, "#7fd6ff", "KARTHIKEYA", true);
    marker(pp, "#ffb4a2", "YOU", false);

    /* standings */
    const youFirst = g.px >= g.kx;
    rr(ctx, 18, 14, 250, 92, 16);
    ctx.fillStyle = "rgba(10,14,30,0.7)";
    ctx.fill();
    text(ctx, youFirst ? "1st  GANESHA" : "1st  KARTHIKEYA", 34, 38, 19,
      youFirst ? "#ffd24a" : "#7fd6ff", "left");
    text(ctx, youFirst ? "2nd  KARTHIKEYA" : "2nd  GANESHA (YOU)", 34, 64, 17,
      youFirst ? "#7fd6ff" : "#ffb4a2", "left");
    const gap = Math.abs(g.kx - g.px) / 100;
    text(ctx, `GAP ${gap.toFixed(0)}m  ·  SPEED 0.5×`, 34, 88, 14, "#9fb0d0", "left", "700");

    /* laps + modaks */
    rr(ctx, BASE_W - 258, 14, 240, 92, 16);
    ctx.fillStyle = "rgba(10,14,30,0.7)";
    ctx.fill();
    text(ctx, `LAP ${Math.min(LAPS, Math.floor(g.px / LAP) + 1)}/${LAPS}`, BASE_W - 238, 38, 19, "#fff", "left");
    text(ctx, `PRADAKSHINA ${g.ringLaps}/${LAPS}`, BASE_W - 238, 64, 17, "#ffd24a", "left");
    text(ctx, `MODAK ${g.got}`, BASE_W - 238, 88, 15, "#ffe9a8", "left", "700");

    if (g.boost > 0) {
      text(ctx, "MODAK BOOST!", BASE_W - 138, 126, 18, "#ffd24a", "center", "900", "#4a2a05");
    }
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
    <GameFrame onExit={onExit} label="RUN">
      <GameCanvas frame={frame} />
      {phase === "play" && <TouchControls />}
      {phase === "brief" && (
        <Briefing
          title="RUN"
          color="#ffd24a"
          onStart={start}
          onExit={onExit}
        />
      )}
      {phase === "over" && (
        <ResultOverlay
          won={g.result === "win"}
          title={g.result === "win" ? "Victory!" : "Defeat"}
          subtitle={
            g.result === "win"
              ? "Three pradakshinas of your parents — the whole universe circled. Karthikeya bows to you!"
              : "Karthikeya's peacock crossed the finish line. Remember: devotion beats speed."
          }
          stats={[
            ["Pradakshinas", `${g.ringLaps}/${LAPS}`],
            ["Distance", `${(g.px / 100).toFixed(0)}m`],
            ["Modaks", `${g.got}`],
            ["Time Left", fmtTime(Math.max(0, g.time))],
          ]}
          onRetry={start}
          onLobby={onExit}
        />
      )}
    </GameFrame>
  );
}
