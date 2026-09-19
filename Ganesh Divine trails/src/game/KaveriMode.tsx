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
  text,
} from "./core";
import { DUSK, drawBackdrop, drawGround, fireflies, hash } from "./backdrop";
import { bush, drawGanesh, drawMug, drawRishi, place, tree } from "./sprites";
import { initAudio, sfx } from "./sfx";

const GROUND = 574;
const DURATION = 120;
const START_X = 120;
const RISHI_START = 900;
const ASHRAM = 3720;
const P_SPEED = 172;
const SNEAK = 0.5;
const R_SPEED = 62;

type Spot = { x: number; kind: number };

function makeSpots(): Spot[] {
  const out: Spot[] = [];
  for (let i = 0; i < 26; i++) out.push({ x: 260 + i * 150 + hash(i) * 70, kind: hash(i + 9) > 0.55 ? 1 : 0 });
  return out;
}

function makeState() {
  return {
    time: DURATION,
    px: START_X,
    py: GROUND,
    vy: 0,
    onGround: true,
    facing: 1,
    phase: 0,
    cam: 0,
    hidden: false,
    noise: 0,
    rx: RISHI_START,
    rface: 1,
    rphase: 0,
    rstate: "walk" as "walk" | "alert" | "look" | "turn",
    rtimer: 5.5,
    suspicion: 0,
    lives: 3,
    caught: 0,
    freeze: 0,
    grabbed: false,
    spots: makeSpots(),
    msg: "Follow the sage. Stay out of sight.",
    msgLife: 3.5,
    shake: 0,
    result: null as null | "win" | "lose",
  };
}
type S = ReturnType<typeof makeState>;

const say = (s: S, m: string, life = 3) => {
  s.msg = m;
  s.msgLife = life;
};

export default function KaveriMode({ onExit }: { onExit: () => void }) {
  const [phase, setPhase] = useState<"brief" | "play" | "over">("brief");
  const s = useRef<S>(makeState());
  const [, force] = useState(0);

  const start = () => {
    initAudio();
    s.current = makeState();
    setPhase("play");
  };

  const respawn = (g: S) => {
    g.px = START_X;
    g.py = GROUND;
    g.vy = 0;
    g.rx = RISHI_START;
    g.rface = 1;
    g.rstate = "walk";
    g.rtimer = 3.4;
    g.suspicion = 0;
    g.noise = 0;
    g.freeze = 1.1;
    g.shake = 1;
  };

  const mugX = (g: S) => g.rx + (g.rface > 0 ? -26 : 26);

  const update = (g: S, dt: number) => {
    g.time -= dt;
    g.msgLife -= dt;
    g.shake = Math.max(0, g.shake - dt * 2);
    if (g.time <= 0) {
      g.result = "lose";
      return;
    }
    if (g.freeze > 0) {
      g.freeze -= dt;
      return;
    }

    /* ---- player ---- */
    const sneaking = input.sneak || input.down;
    const overSpot = g.spots.find((sp) => Math.abs(sp.x - g.px) < 52);
    g.hidden = !!overSpot && input.down && g.onGround;

    const dir = g.hidden ? 0 : (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const spd = P_SPEED * (sneaking ? SNEAK : 1);
    if (dir !== 0) {
      g.px += dir * spd * dt;
      g.facing = dir;
      g.phase += dt * (spd / 24);
      g.noise = clamp(g.noise + (sneaking ? 0.1 : 0.85) * dt, 0, 1);
    } else {
      g.phase += dt * 1.2;
      g.noise = clamp(g.noise - 0.55 * dt, 0, 1);
    }
    if (input.upPressed && g.onGround && !g.hidden) {
      input.upPressed = false;
      g.vy = -600;
      g.onGround = false;
      g.noise = clamp(g.noise + 0.25, 0, 1);
    }
    g.vy += 1750 * dt;
    g.py += g.vy * dt;
    if (g.py >= GROUND) {
      g.py = GROUND;
      g.vy = 0;
      g.onGround = true;
    }
    g.px = clamp(g.px, 40, ASHRAM + 200);

    /* ---- rishi behaviour ---- */
    g.rtimer -= dt;
    const gap = g.rx - g.px;
    if (g.rstate === "walk") {
      g.rx += R_SPEED * dt;
      g.rphase += dt * 2.4;
      g.rface = 1;
      /* loud footsteps behind him make him suspicious sooner */
      if (gap > 0 && gap < 300 && g.noise > 0.55) g.rtimer -= dt * 2.2;
      if (g.rtimer <= 0) {
        g.rstate = "alert";
        g.rtimer = 0.85;
        sfx.alert();
        say(g, "The sage senses something…", 1.4);
      }
    } else if (g.rstate === "alert") {
      if (g.rtimer <= 0) {
        g.rstate = "look";
        g.rtimer = 1.5 + hash(Math.floor(g.time * 7)) * 1.6;
        g.rface = -1;
      }
    } else if (g.rstate === "look") {
      g.rphase += dt * 0.4;
      if (g.rtimer <= 0) {
        g.rstate = "walk";
        g.rface = 1;
        g.rtimer = 3.2 + hash(Math.floor(g.time * 11)) * 3.6;
      }
    }
    if (g.rx >= ASHRAM) {
      g.result = "lose";
      say(g, "The sage entered the ashram with the Kaveri.", 3);
      return;
    }

    /* ---- detection ---- */
    const looking = g.rstate === "look";
    const eyeX = g.rx - 6;
    const eyeY = GROUND - 92;
    const dx = g.px - eyeX;
    const dy = g.py - 40 - eyeY;
    const d = Math.hypot(dx, dy);
    const inFront = g.rface < 0 ? dx < 0 : dx > 0;
    /* he always sees whatever is in front of him; looking back has a longer reach */
    const range = looking ? 470 : 360;
    const seen = !g.hidden && inFront && d < range && Math.abs(dy) < 190;
    if (seen) {
      g.suspicion += dt * (d < 220 ? 2.1 : 1.15);
      if (g.suspicion >= 1) {
        g.lives--;
        g.caught++;
        sfx.caught();
        say(g, `CAUGHT! The sage spotted you.  Lives left: ${g.lives}`, 3);
        if (g.lives <= 0) {
          g.result = "lose";
          return;
        }
        respawn(g);
        return;
      }
    } else g.suspicion = Math.max(0, g.suspicion - dt * 0.9);

    /* ---- grab the mug ---- */
    const canGrab = Math.abs(mugX(g) - g.px) < 95 && !looking && g.onGround;
    if (canGrab && (input.actionPressed || input.action)) {
      input.actionPressed = false;
      g.grabbed = true;
      g.result = "win";
    }
  };

  const render = (ctx: CanvasRenderingContext2D, g: S, t: number) => {
    const target = clamp(g.px - 430, -60, ASHRAM);
    g.cam += (target - g.cam) * 0.1;
    const cam = g.cam + (g.shake > 0 ? Math.sin(t * 60) * 8 * g.shake : 0);

    drawBackdrop(ctx, cam, t, DUSK, GROUND);

    /* forest layer */
    const first = Math.floor(cam / 300) - 1;
    for (let i = first; i < first + 7; i++) {
      const x = i * 300 + hash(i) * 140 - cam;
      tree(ctx, x, GROUND + 4, 1.05 + hash(i + 2) * 0.4, t);
    }
    drawGround(ctx, cam, t, DUSK, GROUND);

    /* stone path */
    ctx.fillStyle = "rgba(60,55,70,0.55)";
    ctx.fillRect(0, GROUND + 14, BASE_W, 22);
    for (let i = first * 3; i < first * 3 + 40; i++) {
      const x = i * 62 - cam * 1;
      rr(ctx, x, GROUND + 16, 50, 16, 6);
      ctx.fillStyle = i % 2 ? "#6d6a76" : "#7b7784";
      ctx.fill();
    }

    /* ashram gate */
    const ax = ASHRAM - cam;
    if (ax < BASE_W + 300 && ax > -300) {
      ctx.save();
      ctx.fillStyle = rgrad(ctx, ax, GROUND - 120, 10, 220, [
        [0, "rgba(255,210,120,0.45)"],
        [1, "rgba(255,210,120,0)"],
      ]);
      ctx.beginPath();
      ctx.arc(ax, GROUND - 120, 220, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#6b4f3a";
      ctx.fillRect(ax - 90, GROUND - 210, 24, 210);
      ctx.fillRect(ax + 66, GROUND - 210, 24, 210);
      rr(ctx, ax - 108, GROUND - 246, 216, 42, 10);
      ctx.fillStyle = "#8a6444";
      ctx.fill();
      text(ctx, "ASHRAM", ax, GROUND - 225, 22, "#ffe6b8", "center", "900", "#3a2a18");
      ctx.restore();
    }

    /* hiding spots */
    for (const sp of g.spots) {
      const x = sp.x - cam;
      if (x < -90 || x > BASE_W + 90) continue;
      const near = Math.abs(sp.x - g.px) < 52;
      if (near) {
        ctx.fillStyle = rgrad(ctx, x, GROUND - 24, 4, 80, [
          [0, "rgba(120,255,190,0.35)"],
          [1, "rgba(120,255,190,0)"],
        ]);
        ctx.beginPath();
        ctx.arc(x, GROUND - 24, 80, 0, Math.PI * 2);
        ctx.fill();
      }
      if (sp.kind === 0) bush(ctx, x, GROUND + 2, 1.15);
      else {
        /* mossy rock */
        blob(ctx, x, GROUND - 16, 34, 28, 0, grad(ctx, x - 30, GROUND - 46, x + 30, GROUND, [
          [0, "#8b93a1"],
          [1, "#454d5c"],
        ]), "#2b3340", 2);
        blob(ctx, x - 8, GROUND - 32, 16, 8, -0.3, "rgba(120,200,120,0.55)");
      }
    }

    /* ---- rishi + vision cone ---- */
    const rsx = g.rx - cam;
    {
      const looking = g.rstate === "look";
      const eyeX = rsx - 6,
        eyeY = GROUND - 92;
      const dirv = g.rface;
      const range = looking ? 470 : 360;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const cg = ctx.createRadialGradient(eyeX, eyeY, 10, eyeX, eyeY, range);
      const hot = g.suspicion > 0.3;
      cg.addColorStop(
        0,
        hot ? "rgba(255,90,90,0.5)" : looking ? "rgba(255,240,170,0.38)" : "rgba(255,230,170,0.18)",
      );
      cg.addColorStop(1, "rgba(255,200,120,0)");
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.moveTo(eyeX, eyeY);
      const a0 = dirv > 0 ? -0.42 : Math.PI - 0.42;
      const a1 = dirv > 0 ? 0.42 : Math.PI + 0.42;
      ctx.arc(eyeX, eyeY, range, a0, a1);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    place(ctx, rsx, GROUND, 1.25, g.rface, () =>
      drawRishi(ctx, { phase: g.rphase, moving: g.rstate === "walk" }),
    );
    if (g.rstate === "alert")
      text(ctx, "!", rsx, GROUND - 190 + Math.sin(t * 20) * 3, 46, "#ff5a5a", "center", "900", "#2b0505");

    /* glowing mug marker */
    const mx = mugX(g) - cam;
    ctx.save();
    ctx.translate(mx, GROUND - 72);
    ctx.globalAlpha = 0.9;
    drawMug(ctx, 0.9, 0.7 + Math.sin(t * 3) * 0.3);
    ctx.restore();

    /* ---- player ---- */
    const psx = g.px - cam;
    ctx.save();
    if (g.hidden) ctx.globalAlpha = 0.45;
    place(ctx, psx, g.py, 1.12, g.facing, () =>
      drawGanesh(ctx, {
        phase: g.phase,
        moving: (input.left || input.right) && g.onGround && !g.hidden,
        air: !g.onGround,
        crouch: g.hidden,
      }),
    );
    ctx.restore();

    /* suspicion bubble */
    if (g.suspicion > 0.02) {
      const w = 64;
      rr(ctx, psx - w / 2, g.py - 205, w, 12, 6);
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fill();
      rr(ctx, psx - w / 2 + 2, g.py - 203, (w - 4) * clamp(g.suspicion, 0, 1), 8, 4);
      ctx.fillStyle = g.suspicion > 0.6 ? "#ff5a5a" : "#ffd24a";
      ctx.fill();
    }

    /* grab prompt */

    fireflies(ctx, cam, t, GROUND);

    /* night grade */
    ctx.fillStyle = "rgba(20,10,50,0.22)";
    ctx.fillRect(0, 0, BASE_W, BASE_H);

    hud(ctx, g);

    if (g.suspicion > 0.5 || g.freeze > 0) {
      ctx.fillStyle = `rgba(255,40,40,${(g.freeze > 0 ? 0.35 : g.suspicion * 0.25)})`;
      ctx.fillRect(0, 0, BASE_W, BASE_H);
    }
    ctx.fillStyle = rgrad(ctx, BASE_W / 2, BASE_H / 2, BASE_H * 0.42, BASE_H * 1.02, [
      [0, "rgba(0,0,0,0)"],
      [1, "rgba(0,0,0,0.6)"],
    ]);
    ctx.fillRect(0, 0, BASE_W, BASE_H);
  };

  const hud = (ctx: CanvasRenderingContext2D, g: S) => {
    rr(ctx, BASE_W / 2 - 78, 14, 156, 52, 16);
    ctx.fillStyle = "rgba(10,14,30,0.7)";
    ctx.fill();
    text(ctx, fmtTime(g.time), BASE_W / 2, 40, 30, g.time < 20 ? "#ff8d8d" : "#fff");

    /* lives */
    rr(ctx, 18, 14, 196, 62, 16);
    ctx.fillStyle = "rgba(10,14,30,0.7)";
    ctx.fill();
    text(ctx, "LIVES", 34, 32, 13, "#9fb0d0", "left", "800");
    for (let i = 0; i < 3; i++) {
      const x = 46 + i * 46;
      const on = i < g.lives;
      ctx.save();
      ctx.translate(x, 56);
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.bezierCurveTo(11, -2, 12, 6, 0, 10);
      ctx.bezierCurveTo(-12, 6, -11, -2, 0, -14);
      ctx.closePath();
      ctx.fillStyle = on ? "#7fd6ff" : "rgba(255,255,255,0.14)";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = on ? "#1c6e93" : "rgba(255,255,255,0.2)";
      ctx.stroke();
      ctx.restore();
    }

    /* stealth meters */
    rr(ctx, BASE_W - 286, 14, 268, 92, 16);
    ctx.fillStyle = "rgba(10,14,30,0.7)";
    ctx.fill();
    const bar = (y: number, v: number, label: string, c: string) => {
      text(ctx, label, BASE_W - 266, y, 13, "#9fb0d0", "left", "800");
      rr(ctx, BASE_W - 176, y - 8, 140, 16, 8);
      ctx.fillStyle = "rgba(255,255,255,0.14)";
      ctx.fill();
      rr(ctx, BASE_W - 174, y - 6, 136 * clamp(v, 0, 1), 12, 6);
      ctx.fillStyle = c;
      ctx.fill();
    };
    bar(38, g.suspicion, "ALERT", g.suspicion > 0.6 ? "#ff5a5a" : "#ffd24a");
    bar(66, g.noise, "NOISE", "#8fe6ff");
    const dm = Math.max(0, (mugX(g) - g.px) / 100);
    text(ctx, `KAVERI MUG  ${dm.toFixed(1)}m ahead`, BASE_W - 266, 92, 14, "#cfe3ff", "left", "700");

    /* distance bar to ashram */
    const bw = 380,
      bx = BASE_W / 2 - bw / 2;
    rr(ctx, bx, 80, bw, 10, 5);
    ctx.fillStyle = "rgba(255,255,255,0.16)";
    ctx.fill();
    const pp = clamp(g.px / ASHRAM, 0, 1),
      rp = clamp(g.rx / ASHRAM, 0, 1);
    ctx.beginPath();
    ctx.arc(bx + bw * rp, 85, 8, 0, Math.PI * 2);
    ctx.fillStyle = "#ff9a4d";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(bx + bw * pp, 85, 8, 0, Math.PI * 2);
    ctx.fillStyle = "#ffb4a2";
    ctx.fill();
    text(ctx, "YOU", bx + bw * pp, 104, 12, "#ffb4a2", "center", "800", "#0e1226");
    text(ctx, "SAGE", bx + bw * rp, 66, 12, "#ff9a4d", "center", "800", "#0e1226");
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
    <GameFrame onExit={onExit} label="KAVERI">
      <GameCanvas frame={frame} />
      {phase === "play" && <TouchControls action="GRAB" />}
      {phase === "brief" && (
        <Briefing
          title="KAVERI"
          color="#8fe6ff"
          onStart={start}
          onExit={onExit}
        />
      )}
      {phase === "over" && (
        <ResultOverlay
          won={g.result === "win"}
          title={g.result === "win" ? "Kaveri Claimed!" : "Mission Failed"}
          subtitle={
            g.result === "win"
              ? "You lifted the kamandalu unseen — the holy river is free to bless the land."
              : "The sage guarded his mug. Stay in the shadows and try again."
          }
          stats={[
            ["Lives Left", `${Math.max(0, g.lives)}`],
            ["Times Caught", `${g.caught}`],
            ["Time Left", fmtTime(Math.max(0, g.time))],
            ["Mug", g.grabbed ? "Secured" : "Lost"],
          ]}
          onRetry={start}
          onLobby={onExit}
        />
      )}
    </GameFrame>
  );
}
