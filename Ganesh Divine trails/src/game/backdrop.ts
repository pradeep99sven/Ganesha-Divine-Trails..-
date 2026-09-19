import { BASE_H, BASE_W, blob, grad, rgrad } from "./core";
import { bush, tree } from "./sprites";

export const hash = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export type Theme = {
  sky: [number, string][];
  sun: { x: number; y: number; r: number; c1: string; c2: string };
  mountain: [string, string];
  hill: [string, string];
  grassTop: string;
  grassMid: string;
  dirt: [string, string];
  haze: string;
  fireflies?: boolean;
  river?: boolean;
};

export const DAY: Theme = {
  sky: [
    [0, "#2f6bd8"],
    [0.4, "#7fc4f5"],
    [0.75, "#d8f0ff"],
    [1, "#fdf3c8"],
  ],
  sun: { x: 0.78, y: 0.16, r: 70, c1: "#fffbe6", c2: "rgba(255,225,120,0)" },
  mountain: ["#7e93c9", "#4d5f95"],
  hill: ["#5fae54", "#2f7a3c"],
  grassTop: "#7fd45a",
  grassMid: "#3f9b34",
  dirt: ["#8b5e3c", "#4d2f1c"],
  haze: "rgba(200,230,255,0.35)",
};

export const DUSK: Theme = {
  sky: [
    [0, "#1b1140"],
    [0.35, "#4b2a63"],
    [0.65, "#a8486a"],
    [1, "#f2a45c"],
  ],
  sun: { x: 0.2, y: 0.28, r: 58, c1: "#ffd9a0", c2: "rgba(255,160,90,0)" },
  mountain: ["#5b4577", "#2e2246"],
  hill: ["#2f5a53", "#14312f"],
  grassTop: "#3f8f5e",
  grassMid: "#215c43",
  dirt: ["#4a3826", "#241a12"],
  haze: "rgba(255,170,120,0.18)",
  fireflies: true,
  river: true,
};

export function drawBackdrop(
  ctx: CanvasRenderingContext2D,
  cam: number,
  t: number,
  th: Theme,
  groundY: number,
) {
  /* sky */
  ctx.fillStyle = grad(ctx, 0, 0, 0, groundY + 40, th.sky);
  ctx.fillRect(0, 0, BASE_W, BASE_H);

  /* sun / glow */
  const sx = BASE_W * th.sun.x,
    sy = BASE_H * th.sun.y;
  ctx.fillStyle = rgrad(ctx, sx, sy, th.sun.r * 0.2, th.sun.r * 4.2, [
    [0, th.sun.c1],
    [0.18, th.sun.c1],
    [1, th.sun.c2],
  ]);
  ctx.beginPath();
  ctx.arc(sx, sy, th.sun.r * 4.2, 0, Math.PI * 2);
  ctx.fill();
  blob(ctx, sx, sy, th.sun.r, th.sun.r, 0, th.sun.c1);

  /* clouds */
  for (let i = 0; i < 9; i++) {
    const base = hash(i) * 3000;
    const x = ((base - cam * 0.06 + t * 5) % 1700) - 220;
    const y = 50 + hash(i + 40) * 210;
    const s = 0.6 + hash(i + 9) * 0.9;
    ctx.save();
    ctx.globalAlpha = 0.5 + hash(i + 3) * 0.35;
    ctx.translate(x, y);
    ctx.scale(s, s);
    for (const [cx, cy, r] of [
      [-40, 6, 26],
      [0, -6, 34],
      [38, 6, 24],
      [12, 10, 26],
    ])
      blob(ctx, cx, cy, r, r * 0.68, 0, "#ffffff");
    ctx.restore();
  }

  /* far mountains */
  const mg = grad(ctx, 0, groundY - 330, 0, groundY, [
    [0, th.mountain[0]],
    [1, th.mountain[1]],
  ]);
  ctx.fillStyle = mg;
  ctx.beginPath();
  ctx.moveTo(-100, groundY + 10);
  const off = (cam * 0.12) % 620;
  for (let i = -1; i < 4; i++) {
    const bx = i * 620 - off;
    ctx.lineTo(bx, groundY - 40);
    ctx.lineTo(bx + 150, groundY - 300 - hash(i + 5) * 60);
    ctx.lineTo(bx + 300, groundY - 60);
    ctx.lineTo(bx + 430, groundY - 240 - hash(i + 11) * 50);
    ctx.lineTo(bx + 600, groundY - 30);
  }
  ctx.lineTo(BASE_W + 200, groundY + 10);
  ctx.closePath();
  ctx.fill();
  /* snow caps */
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  for (let i = -1; i < 4; i++) {
    const bx = i * 620 - off;
    const peak = groundY - 300 - hash(i + 5) * 60;
    ctx.beginPath();
    ctx.moveTo(bx + 150, peak);
    ctx.lineTo(bx + 188, peak + 62);
    ctx.lineTo(bx + 160, peak + 50);
    ctx.lineTo(bx + 138, peak + 66);
    ctx.lineTo(bx + 112, peak + 62);
    ctx.closePath();
    ctx.fill();
  }

  /* river band */
  if (th.river) {
    const ry = groundY - 96;
    ctx.fillStyle = grad(ctx, 0, ry, 0, ry + 70, [
      [0, "rgba(120,200,235,0.85)"],
      [1, "rgba(30,90,140,0.9)"],
    ]);
    ctx.fillRect(0, ry, BASE_W, 76);
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = "#dff6ff";
    ctx.lineWidth = 2;
    for (let i = 0; i < 26; i++) {
      const y = ry + 8 + ((i * 13) % 62);
      const x = ((i * 137 - cam * 0.25 + t * 12) % (BASE_W + 120)) - 60;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 18, y - 4, x + 36, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  /* mid hills */
  ctx.fillStyle = grad(ctx, 0, groundY - 200, 0, groundY + 20, [
    [0, th.hill[0]],
    [1, th.hill[1]],
  ]);
  const off2 = (cam * 0.3) % 480;
  ctx.beginPath();
  ctx.moveTo(-100, groundY + 20);
  for (let i = -1; i < 5; i++) {
    const bx = i * 480 - off2;
    ctx.quadraticCurveTo(bx + 120, groundY - 130 - hash(i + 21) * 70, bx + 240, groundY - 20);
    ctx.quadraticCurveTo(bx + 360, groundY - 90, bx + 480, groundY - 10);
  }
  ctx.lineTo(BASE_W + 200, groundY + 20);
  ctx.closePath();
  ctx.fill();

  /* mid trees */
  for (let i = 0; i < 16; i++) {
    const wx = i * 340 + hash(i) * 200;
    const x = wx - cam * 0.55;
    const m = ((x % 5440) + 5440) % 5440;
    const sxp = m - 200;
    if (sxp > -160 && sxp < BASE_W + 160) {
      ctx.save();
      ctx.globalAlpha = 0.85;
      tree(ctx, sxp, groundY - 6, 0.75 + hash(i + 7) * 0.35, t);
      ctx.restore();
    }
  }

  /* atmospheric haze */
  ctx.fillStyle = grad(ctx, 0, groundY - 220, 0, groundY, [
    [0, "rgba(255,255,255,0)"],
    [1, th.haze],
  ]);
  ctx.fillRect(0, groundY - 220, BASE_W, 220);
}

export function drawGround(
  ctx: CanvasRenderingContext2D,
  cam: number,
  t: number,
  th: Theme,
  groundY: number,
) {
  /* dirt body */
  ctx.fillStyle = grad(ctx, 0, groundY, 0, BASE_H, [
    [0, th.dirt[0]],
    [1, th.dirt[1]],
  ]);
  ctx.fillRect(0, groundY, BASE_W, BASE_H - groundY);
  /* grass cap */
  ctx.fillStyle = grad(ctx, 0, groundY - 6, 0, groundY + 26, [
    [0, th.grassTop],
    [1, th.grassMid],
  ]);
  ctx.fillRect(0, groundY - 6, BASE_W, 28);
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.fillRect(0, groundY - 6, BASE_W, 3);

  /* pebbles & roots */
  const start = Math.floor(cam / 90) - 1;
  for (let i = start; i < start + 18; i++) {
    const x = i * 90 + hash(i) * 50 - cam;
    ctx.fillStyle = "rgba(0,0,0,0.16)";
    ctx.beginPath();
    ctx.arc(x, groundY + 46 + hash(i + 2) * 60, 5 + hash(i + 3) * 8, 0, Math.PI * 2);
    ctx.fill();
    /* grass tufts (swaying) */
    const sway = Math.sin(t * 1.6 + i) * 2.5;
    ctx.strokeStyle = th.grassTop;
    ctx.lineWidth = 2.4;
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      ctx.moveTo(x + k * 5, groundY - 5);
      ctx.quadraticCurveTo(
        x + k * 5 + 3 + sway * 0.5,
        groundY - 14,
        x + k * 5 + 7 + sway,
        groundY - 18,
      );
      ctx.stroke();
    }
  }
}

export function drawScatter(
  ctx: CanvasRenderingContext2D,
  cam: number,
  t: number,
  groundY: number,
  density = 520,
) {
  const start = Math.floor(cam / density) - 1;
  for (let i = start; i < start + 6; i++) {
    const h1 = hash(i * 3.3);
    const x = i * density + h1 * 300 - cam;
    if (h1 > 0.55) tree(ctx, x, groundY, 0.95 + hash(i) * 0.3, t);
    else bush(ctx, x, groundY, 0.85 + hash(i + 4) * 0.5);
  }
}

export function fireflies(ctx: CanvasRenderingContext2D, cam: number, t: number, groundY: number) {
  for (let i = 0; i < 26; i++) {
    const bx = hash(i) * 4000;
    const x = (((bx - cam * 0.8 + Math.sin(t * 0.6 + i) * 30) % 1500) + 1500) % 1500 - 110;
    const y = groundY - 40 - hash(i + 3) * 260 + Math.sin(t * 1.4 + i * 2) * 14;
    const a = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 3 + i));
    ctx.fillStyle = rgrad(ctx, x, y, 0, 14, [
      [0, `rgba(255,240,150,${a})`],
      [1, "rgba(255,240,150,0)"],
    ]);
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.fill();
  }
}
