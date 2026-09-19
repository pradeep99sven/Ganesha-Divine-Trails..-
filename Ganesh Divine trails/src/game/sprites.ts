import { blob, cap, grad, rgrad, rr, shadowEllipse } from "./core";

/* Every character is drawn with feet at (0,0), ~100 units tall, facing RIGHT. */

export type Pose = {
  phase?: number;
  moving?: boolean;
  air?: boolean;
  crouch?: boolean;
  alpha?: number;
};

export function place(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  facing: number,
  fn: () => void,
) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.imageSmoothingEnabled = true;
  ctx.translate(x, y);
  ctx.scale(scale * (facing < 0 ? -1 : 1), scale);
  fn();
  ctx.restore();
}

const OUT = "#4a2412";

function eye(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  look = 0.35,
  open = 1,
) {
  blob(ctx, x, y, r, r * open, 0, "#ffffff", OUT, 1.4);
  blob(ctx, x + r * look, y, r * 0.5, r * 0.55 * open, 0, "#20130c");
  blob(ctx, x + r * look + r * 0.16, y - r * 0.2, r * 0.18, r * 0.18, 0, "#ffffff");
}

/* ------------------------------------------------------------------ GANESHA */
export function drawGanesh(ctx: CanvasRenderingContext2D, p: Pose = {}) {
  const ph = p.phase ?? 0;
  const mv = p.moving ? 1 : 0;
  const bob = p.moving ? Math.sin(ph * 2) * 1.6 : Math.sin(ph * 0.9) * 0.8;
  const swing = Math.sin(ph) * 22 * mv;
  const crouch = p.crouch ? 10 : 0;
  ctx.globalAlpha = p.alpha ?? 1;

  shadowEllipse(ctx, 0, 1, 24, 6, 0.28);
  ctx.translate(0, crouch);

  const skin = grad(ctx, -20, -90, 24, -10, [
    [0, "#ffc9ba"],
    [0.55, "#f7a894"],
    [1, "#e08574"],
  ]);
  const dhoti = grad(ctx, -18, -40, 18, -8, [
    [0, "#ffe07a"],
    [0.5, "#ffc043"],
    [1, "#ef8f1c"],
  ]);
  const gold = grad(ctx, -10, -100, 10, -50, [
    [0, "#fff3ad"],
    [0.5, "#ffd24a"],
    [1, "#c98c19"],
  ]);

  /* back leg + arm */
  const l1 = -swing,
    l2 = swing;
  const legY = p.air ? -14 : -12;
  cap(ctx, -3, -22, -3 + l1 * 0.32, legY + (p.air ? 2 : 0), 11, "#eb9986", OUT);
  blob(ctx, -3 + l1 * 0.36, legY - 1, 7, 4.5, 0, "#e78f7c", OUT, 1.6);

  /* dhoti skirt */
  ctx.beginPath();
  ctx.moveTo(-17, -34);
  ctx.quadraticCurveTo(-21, -14, -15, -13);
  ctx.quadraticCurveTo(0, -9, 16, -13);
  ctx.quadraticCurveTo(22, -15, 18, -34);
  ctx.closePath();
  ctx.fillStyle = dhoti;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = OUT;
  ctx.stroke();

  /* front leg */
  cap(ctx, 4, -22, 4 + l2 * 0.32, legY + (p.air ? -3 : 0), 11.5, "#f6ab97", OUT);
  blob(ctx, 5 + l2 * 0.36, legY - 1, 7.5, 4.8, 0, "#f2a18c", OUT, 1.6);

  ctx.translate(0, bob);

  /* belly */
  blob(ctx, 0, -38, 22, 21, 0, skin, OUT, 2.4);
  blob(ctx, -7, -44, 9, 7, -0.4, "rgba(255,255,255,0.28)");
  /* navel */
  ctx.beginPath();
  ctx.ellipse(2, -32, 2.4, 3, 0, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(120,50,30,0.5)";
  ctx.lineWidth = 1.4;
  ctx.stroke();

  /* sash */
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, -38, 22, 21, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.beginPath();
  ctx.moveTo(-24, -48);
  ctx.lineTo(24, -28);
  ctx.lineTo(24, -20);
  ctx.lineTo(-24, -40);
  ctx.closePath();
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fill();
  ctx.restore();

  /* back arm */
  cap(ctx, -14, -50, -22 - l1 * 0.2, -36 + l1 * 0.18, 8.5, "#e89a87", OUT);
  blob(ctx, -23 - l1 * 0.22, -33 + l1 * 0.2, 5, 5, 0, "#e89a87", OUT, 1.6);

  /* head group */
  ctx.save();
  ctx.translate(0, -60 + Math.sin(ph * 2) * 0.6 * mv);

  /* far ear */
  ctx.save();
  ctx.rotate(Math.sin(ph * 2) * 0.05 * mv);
  blob(ctx, -21, -6, 15, 19, -0.25, "#e08f7c", OUT, 2.2);
  ctx.restore();

  /* skull */
  blob(ctx, 0, -10, 21.5, 20.5, 0, skin, OUT, 2.4);
  blob(ctx, -6, -18, 9, 6, -0.5, "rgba(255,255,255,0.3)");

  /* near ear */
  ctx.save();
  ctx.translate(20, -8);
  ctx.rotate(-Math.sin(ph * 2) * 0.09 * mv);
  blob(ctx, 4, 2, 16, 20, 0.22, grad(ctx, -8, -16, 14, 18, [
    [0, "#ffbfae"],
    [1, "#e2917e"],
  ]), OUT, 2.2);
  blob(ctx, 4, 3, 10, 13, 0.22, "rgba(190,90,75,0.35)");
  ctx.restore();

  /* trunk */
  ctx.beginPath();
  ctx.moveTo(-5, 2);
  ctx.quadraticCurveTo(10, 6, 12 + Math.sin(ph * 2) * 1.5 * mv, 18);
  ctx.quadraticCurveTo(13, 28, 4, 27);
  ctx.quadraticCurveTo(-1, 26, 0.5, 21);
  ctx.lineWidth = 11;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = OUT;
  ctx.lineWidth = 14;
  ctx.stroke();
  ctx.strokeStyle = "#f4a893";
  ctx.lineWidth = 11;
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 3.5;
  ctx.stroke();

  /* tusks */
  ctx.beginPath();
  ctx.moveTo(6, 6);
  ctx.quadraticCurveTo(15, 12, 16, 19);
  ctx.lineWidth = 5.6;
  ctx.strokeStyle = OUT;
  ctx.stroke();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#fffaf0";
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-7, 6);
  ctx.quadraticCurveTo(-13, 11, -13, 16);
  ctx.lineWidth = 4.6;
  ctx.strokeStyle = OUT;
  ctx.stroke();
  ctx.lineWidth = 3.2;
  ctx.strokeStyle = "#fffaf0";
  ctx.stroke();

  /* eyes + tilak */
  eye(ctx, -6.5, -9, 4.2, 0.4);
  eye(ctx, 8.5, -9, 4.2, 0.4);
  ctx.beginPath();
  ctx.moveTo(1, -20);
  ctx.lineTo(1, -27);
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#d8342a";
  ctx.stroke();
  blob(ctx, 1, -17, 2.6, 2.6, 0, "#d8342a");

  /* crown */
  ctx.beginPath();
  ctx.moveTo(-14, -26);
  ctx.lineTo(-10, -38);
  ctx.lineTo(-4, -30);
  ctx.lineTo(1, -44);
  ctx.lineTo(6, -30);
  ctx.lineTo(12, -38);
  ctx.lineTo(15, -26);
  ctx.closePath();
  ctx.fillStyle = gold;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#9a6a12";
  ctx.stroke();
  blob(ctx, 1, -29, 3, 3, 0, "#e94f4f", "#9a6a12", 1.2);
  blob(ctx, 1, -46, 2.6, 2.6, 0, "#fff0a8");

  ctx.restore();

  /* necklace */
  ctx.beginPath();
  ctx.arc(0, -52, 13, 0.25, Math.PI - 0.25);
  ctx.lineWidth = 3.6;
  ctx.strokeStyle = "#ffd24a";
  ctx.stroke();
  blob(ctx, 0, -39.5, 3.2, 3.2, 0, "#4ad0c0", "#9a6a12", 1);

  /* front arm (raised when moving) */
  const ax = 15,
    ay = -50;
  const hx = ax + 10 + l2 * 0.16,
    hy = ay + (p.moving ? -6 : 8) + l2 * 0.1;
  cap(ctx, ax, ay, hx, hy, 9, "#f7ad99", OUT);
  blob(ctx, hx + 1, hy + 2, 5.4, 5.4, 0, "#f7ad99", OUT, 1.6);
  cap(ctx, hx - 2, hy + 4, hx + 2, hy + 4, 2, "#ffd24a");
  ctx.globalAlpha = 1;
}

/* -------------------------------------------------------------- KARTHIKEYA */
export function drawKarthikeya(ctx: CanvasRenderingContext2D, p: Pose = {}) {
  const ph = p.phase ?? 0;
  const mv = p.moving ? 1 : 0;
  const swing = Math.sin(ph) * 30 * mv;
  const bob = Math.sin(ph * 2) * 2 * mv;
  ctx.globalAlpha = p.alpha ?? 1;
  shadowEllipse(ctx, 0, 1, 20, 5, 0.26);

  const skin = grad(ctx, -14, -90, 16, -20, [
    [0, "#f6cf9f"],
    [0.6, "#e5ab72"],
    [1, "#c98a52"],
  ]);
  const cloth = grad(ctx, -14, -46, 14, -14, [
    [0, "#59e7b0"],
    [0.6, "#1fae82"],
    [1, "#0d7d63"],
  ]);

  /* back leg */
  cap(ctx, -2, -36, -4 - swing * 0.5, -18, 8, "#cf9560", OUT);
  cap(ctx, -4 - swing * 0.5, -18, -6 - swing * 0.7, -1, 7.5, "#cf9560", OUT);
  blob(ctx, -7 - swing * 0.75, -2, 6, 3.4, 0, "#c98a52", OUT, 1.5);
  /* back arm */
  cap(ctx, -6, -62, -16 + swing * 0.5, -48, 7, "#cf9560", OUT);

  ctx.save();
  ctx.translate(0, bob);
  /* dhoti */
  ctx.beginPath();
  ctx.moveTo(-12, -46);
  ctx.quadraticCurveTo(-16, -30, -9, -29);
  ctx.quadraticCurveTo(0, -26, 12, -30);
  ctx.quadraticCurveTo(15, -32, 12, -46);
  ctx.closePath();
  ctx.fillStyle = cloth;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = OUT;
  ctx.stroke();
  /* torso */
  ctx.beginPath();
  ctx.moveTo(-11, -46);
  ctx.quadraticCurveTo(-14, -62, -8, -70);
  ctx.lineTo(9, -70);
  ctx.quadraticCurveTo(15, -61, 12, -46);
  ctx.closePath();
  ctx.fillStyle = skin;
  ctx.fill();
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = OUT;
  ctx.stroke();
  blob(ctx, -5, -60, 5, 7, -0.3, "rgba(255,255,255,0.22)");
  /* sacred thread */
  cap(ctx, -8, -68, 8, -48, 1.8, "#fffbe8");

  /* head */
  blob(ctx, 3, -80, 12, 13, 0, skin, OUT, 2.2);
  blob(ctx, -1, -86, 6, 4, -0.4, "rgba(255,255,255,0.28)");
  /* hair */
  ctx.beginPath();
  ctx.moveTo(-9, -84);
  ctx.quadraticCurveTo(-2, -98, 12, -90);
  ctx.quadraticCurveTo(16, -87, 14, -82);
  ctx.quadraticCurveTo(4, -90, -6, -78);
  ctx.closePath();
  ctx.fillStyle = "#2b1b18";
  ctx.fill();
  eye(ctx, 6, -81, 3, 0.45);
  eye(ctx, 13, -81, 2.4, 0.45);
  cap(ctx, 1, -74, 6, -74, 1.6, "#9c4a33");
  blob(ctx, 4, -88, 2, 2, 0, "#d8342a");
  /* peacock feather crown */
  ctx.save();
  ctx.translate(2, -92);
  ctx.rotate(-0.25 + Math.sin(ph) * 0.05);
  cap(ctx, 0, 0, 2, -18, 2.2, "#17805f");
  blob(ctx, 3, -20, 5, 7, 0.2, "#1e9e79", "#0d5c46", 1.2);
  blob(ctx, 3, -20, 3, 4.2, 0.2, "#2f6fd0");
  blob(ctx, 3, -20, 1.4, 2, 0.2, "#f7c948");
  ctx.restore();
  /* gold crown band */
  ctx.beginPath();
  ctx.moveTo(-8, -88);
  ctx.quadraticCurveTo(4, -95, 15, -86);
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#ffd24a";
  ctx.stroke();

  /* front arm + vel spear */
  const hx = 14 - swing * 0.35,
    hy = -56;
  cap(ctx, 8, -64, hx, hy, 7.5, "#eab27a", OUT);
  ctx.save();
  ctx.translate(hx, hy);
  ctx.rotate(-0.55 + Math.sin(ph * 2) * 0.04);
  cap(ctx, -24, 14, 26, -14, 3.4, "#8a5a2b", "#432a12");
  ctx.beginPath();
  ctx.moveTo(26, -14);
  ctx.lineTo(38, -26);
  ctx.lineTo(31, -12);
  ctx.closePath();
  ctx.fillStyle = "#ffe587";
  ctx.fill();
  ctx.strokeStyle = "#a97a17";
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.restore();
  ctx.restore();
  ctx.globalAlpha = 1;
}

/* -------------------------------------------------------------------- RISHI */
export function drawRishi(
  ctx: CanvasRenderingContext2D,
  p: Pose & { mug?: boolean } = {},
) {
  const ph = p.phase ?? 0;
  const mv = p.moving ? 1 : 0;
  const swing = Math.sin(ph) * 14 * mv;
  const bob = Math.sin(ph * 2) * 1.2 * mv;
  ctx.globalAlpha = p.alpha ?? 1;
  shadowEllipse(ctx, 0, 1, 22, 5.5, 0.26);

  const skin = "#f0c79c";
  const robe = grad(ctx, -20, -70, 20, -4, [
    [0, "#ff8a3d"],
    [0.45, "#f26522"],
    [1, "#c3400f"],
  ]);

  /* legs */
  cap(ctx, -3, -30, -4 - swing * 0.5, -2, 8, "#e0b184", OUT);
  blob(ctx, -6 - swing * 0.6, -2, 7, 3.4, 0, "#e0b184", OUT, 1.5);
  cap(ctx, 4, -30, 5 + swing * 0.5, -2, 8, skin, OUT);
  blob(ctx, 7 + swing * 0.6, -2, 7, 3.4, 0, skin, OUT, 1.5);

  ctx.save();
  ctx.translate(0, bob);
  /* robe */
  ctx.beginPath();
  ctx.moveTo(-13, -68);
  ctx.quadraticCurveTo(-20, -40, -17, -18);
  ctx.quadraticCurveTo(0, -12, 17, -18);
  ctx.quadraticCurveTo(20, -42, 13, -68);
  ctx.closePath();
  ctx.fillStyle = robe;
  ctx.fill();
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = "#8c2f08";
  ctx.stroke();
  /* fold lines */
  ctx.strokeStyle = "rgba(140,47,8,0.45)";
  ctx.lineWidth = 1.4;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 7, -62);
    ctx.quadraticCurveTo(i * 10, -40, i * 8, -20);
    ctx.stroke();
  }
  /* shoulder sash */
  ctx.beginPath();
  ctx.moveTo(-12, -70);
  ctx.quadraticCurveTo(6, -62, 14, -42);
  ctx.lineWidth = 9;
  ctx.strokeStyle = "#ff9a4d";
  ctx.lineCap = "round";
  ctx.stroke();

  /* arms */
  cap(ctx, -11, -66, -18 - swing * 0.2, -40, 6.5, "#e5b98d", OUT);
  cap(ctx, 12, -66, 19 + swing * 0.2, -40, 6.5, skin, OUT);
  blob(ctx, -19 - swing * 0.2, -37, 4.4, 4.4, 0, "#e5b98d", OUT, 1.4);
  blob(ctx, 20 + swing * 0.2, -37, 4.4, 4.4, 0, skin, OUT, 1.4);
  /* beads */
  for (const [bx, by] of [
    [-19, -33],
    [20, -33],
  ]) {
    ctx.beginPath();
    ctx.arc(bx, by, 5, 0, Math.PI * 2);
    ctx.setLineDash([2.2, 2.2]);
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = "#8b5a2b";
    ctx.stroke();
    ctx.setLineDash([]);
  }

  /* head */
  blob(ctx, 2, -80, 12.5, 13.5, 0, skin, OUT, 2.2);
  /* beard */
  ctx.beginPath();
  ctx.moveTo(-8, -80);
  ctx.quadraticCurveTo(-11, -58, 2, -52);
  ctx.quadraticCurveTo(14, -58, 12, -80);
  ctx.quadraticCurveTo(2, -72, -8, -80);
  ctx.closePath();
  ctx.fillStyle = grad(ctx, 0, -82, 0, -52, [
    [0, "#ffffff"],
    [1, "#d8d3c4"],
  ]);
  ctx.fill();
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = "#a9a293";
  ctx.stroke();
  /* eyes + brows */
  eye(ctx, -1, -84, 3, 0.4);
  eye(ctx, 8, -84, 3, 0.4);
  cap(ctx, -5, -89, 2, -90, 2.4, "#3b2a1c");
  cap(ctx, 5, -90, 12, -89, 2.4, "#3b2a1c");
  /* tilak */
  cap(ctx, 3.5, -94, 3.5, -87, 2, "#f7f2e6");
  /* hair + top knot */
  ctx.beginPath();
  ctx.moveTo(-11, -84);
  ctx.quadraticCurveTo(-8, -96, 3, -95);
  ctx.quadraticCurveTo(14, -95, 14, -84);
  ctx.quadraticCurveTo(4, -90, -11, -84);
  ctx.closePath();
  ctx.fillStyle = "#f2efe4";
  ctx.fill();
  blob(ctx, 2, -99, 8, 7, 0, "#f7f5ec", "#c9c3b2", 1.6);
  blob(ctx, 2, -103, 5, 4, 0, "#fffdf6", "#c9c3b2", 1.4);
  /* neck beads */
  ctx.beginPath();
  ctx.arc(2, -70, 9, 0.15, Math.PI - 0.15);
  ctx.setLineDash([2.5, 2.5]);
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#8b5a2b";
  ctx.stroke();
  ctx.setLineDash([]);

  /* kamandalu mug of Kaveri water */
  if (p.mug !== false) {
    ctx.save();
    ctx.translate(-22 - swing * 0.2, -30);
    drawMug(ctx, 1);
    ctx.restore();
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

export function drawMug(ctx: CanvasRenderingContext2D, s = 1, glow = 0) {
  ctx.save();
  ctx.scale(s, s);
  if (glow > 0) {
    ctx.fillStyle = rgrad(ctx, 0, 4, 2, 26, [
      [0, `rgba(120,230,255,${0.5 * glow})`],
      [1, "rgba(120,230,255,0)"],
    ]);
    ctx.beginPath();
    ctx.arc(0, 4, 26, 0, Math.PI * 2);
    ctx.fill();
  }
  /* handle */
  ctx.beginPath();
  ctx.arc(0, -3, 7, Math.PI, Math.PI * 2);
  ctx.lineWidth = 2.6;
  ctx.strokeStyle = "#8a6420";
  ctx.stroke();
  /* pot */
  ctx.beginPath();
  ctx.moveTo(-7, -1);
  ctx.quadraticCurveTo(-12, 8, -6, 12);
  ctx.quadraticCurveTo(0, 15, 6, 12);
  ctx.quadraticCurveTo(12, 8, 7, -1);
  ctx.closePath();
  ctx.fillStyle = grad(ctx, -8, -2, 8, 12, [
    [0, "#d9a85a"],
    [0.5, "#b3822f"],
    [1, "#7d5518"],
  ]);
  ctx.fill();
  ctx.lineWidth = 1.8;
  ctx.strokeStyle = "#5d3d0e";
  ctx.stroke();
  blob(ctx, -3, 5, 2.2, 4, -0.3, "rgba(255,255,255,0.35)");
  /* rim + water */
  blob(ctx, 0, -1.5, 7.4, 2.6, 0, "#c9973f", "#5d3d0e", 1.4);
  blob(ctx, 0, -2, 5.4, 1.7, 0, "#8fe6ff");
  ctx.restore();
}

/* -------------------------------------------------------------- SHIVA/PARVATI */
export function drawShiva(ctx: CanvasRenderingContext2D, p: Pose = {}) {
  const ph = p.phase ?? 0;
  const br = Math.sin(ph * 1.1) * 1.2;
  shadowEllipse(ctx, 0, 1, 24, 6, 0.24);
  const skin = grad(ctx, -16, -100, 18, -10, [
    [0, "#cfeaff"],
    [0.5, "#a9d4f2"],
    [1, "#7bb0d8"],
  ]);
  /* legs */
  cap(ctx, -6, -40, -8, -2, 10, "#a9d4f2", OUT);
  cap(ctx, 6, -40, 9, -2, 10, "#b6dcf7", OUT);
  blob(ctx, -9, -2, 7, 3.4, 0, "#a9d4f2", OUT, 1.5);
  blob(ctx, 10, -2, 7, 3.4, 0, "#b6dcf7", OUT, 1.5);
  /* tiger skin dhoti */
  ctx.beginPath();
  ctx.moveTo(-15, -50);
  ctx.quadraticCurveTo(-20, -30, -13, -27);
  ctx.quadraticCurveTo(0, -23, 14, -27);
  ctx.quadraticCurveTo(20, -30, 15, -50);
  ctx.closePath();
  ctx.fillStyle = grad(ctx, -14, -48, 14, -26, [
    [0, "#f3c064"],
    [1, "#d79327"],
  ]);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = OUT;
  ctx.stroke();
  ctx.strokeStyle = "#5b3a12";
  ctx.lineWidth = 2;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 6, -48);
    ctx.quadraticCurveTo(i * 6 + 2, -40, i * 6, -30);
    ctx.stroke();
  }
  /* torso */
  ctx.save();
  ctx.translate(0, br);
  ctx.beginPath();
  ctx.moveTo(-13, -50);
  ctx.quadraticCurveTo(-17, -68, -10, -78);
  ctx.lineTo(11, -78);
  ctx.quadraticCurveTo(18, -68, 14, -50);
  ctx.closePath();
  ctx.fillStyle = skin;
  ctx.fill();
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = OUT;
  ctx.stroke();
  /* ash stripes */
  ctx.strokeStyle = "rgba(255,255,255,0.75)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-9, -70 + i * 5);
    ctx.lineTo(10, -70 + i * 5);
    ctx.stroke();
  }
  /* snake */
  ctx.beginPath();
  ctx.moveTo(-12, -76);
  ctx.quadraticCurveTo(0, -66, 13, -76);
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#5fc97a";
  ctx.stroke();
  blob(ctx, 15, -78, 3.6, 2.6, -0.4, "#5fc97a", "#2f7a45", 1.2);
  /* arms */
  cap(ctx, -12, -74, -22, -50, 7.5, "#a9d4f2", OUT);
  cap(ctx, 12, -74, 22, -52, 7.5, "#b6dcf7", OUT);
  /* head */
  blob(ctx, 0, -88, 12.5, 13, 0, skin, OUT, 2.2);
  eye(ctx, -4.5, -90, 2.8, 0.2, 0.55);
  eye(ctx, 4.5, -90, 2.8, 0.2, 0.55);
  cap(ctx, 0, -97, 0, -93, 2.2, "#ffb347");
  cap(ctx, -5, -83, 5, -83, 1.6, "#7a4b30");
  /* jata hair + moon + ganga */
  ctx.beginPath();
  ctx.moveTo(-13, -92);
  ctx.quadraticCurveTo(-14, -112, 0, -114);
  ctx.quadraticCurveTo(15, -112, 13, -92);
  ctx.quadraticCurveTo(0, -100, -13, -92);
  ctx.closePath();
  ctx.fillStyle = "#3b2a1f";
  ctx.fill();
  blob(ctx, 0, -116, 8, 6, 0, "#3b2a1f");
  ctx.beginPath();
  ctx.arc(9, -116, 5, Math.PI * 0.35, Math.PI * 1.55);
  ctx.lineWidth = 2.6;
  ctx.strokeStyle = "#fff7cf";
  ctx.stroke();
  /* trishul */
  ctx.save();
  ctx.translate(24, -52);
  ctx.rotate(0.05);
  cap(ctx, 0, 52, 0, -46, 3.4, "#9aa7b5", "#4a5560");
  ctx.strokeStyle = "#d7e2ec";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-8, -40);
  ctx.lineTo(-8, -58);
  ctx.moveTo(8, -40);
  ctx.lineTo(8, -58);
  ctx.moveTo(0, -46);
  ctx.lineTo(0, -64);
  ctx.moveTo(-8, -40);
  ctx.quadraticCurveTo(0, -34, 8, -40);
  ctx.stroke();
  ctx.restore();
  ctx.restore();
}

export function drawParvati(ctx: CanvasRenderingContext2D, p: Pose = {}) {
  const ph = p.phase ?? 0;
  const mv = p.moving ? 1 : 0;
  const swing = Math.sin(ph) * 10 * mv;
  shadowEllipse(ctx, 0, 1, 22, 5.5, 0.24);
  const skin = grad(ctx, -14, -98, 16, -20, [
    [0, "#ffe1bd"],
    [0.6, "#f4c391"],
    [1, "#d69f68"],
  ]);
  const saree = grad(ctx, -20, -70, 20, -4, [
    [0, "#ff7a9c"],
    [0.45, "#e0295a"],
    [1, "#98123c"],
  ]);
  cap(ctx, -3, -30, -4 - swing * 0.4, -2, 7.5, "#eab98a", OUT);
  cap(ctx, 4, -30, 5 + swing * 0.4, -2, 7.5, "#f4c391", OUT);
  /* saree skirt */
  ctx.beginPath();
  ctx.moveTo(-13, -64);
  ctx.quadraticCurveTo(-21, -34, -17, -8);
  ctx.quadraticCurveTo(0, -3, 17, -8);
  ctx.quadraticCurveTo(21, -36, 13, -64);
  ctx.closePath();
  ctx.fillStyle = saree;
  ctx.fill();
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = "#7d0f31";
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-17, -9);
  ctx.quadraticCurveTo(0, -4, 17, -9);
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#ffd24a";
  ctx.stroke();
  /* torso */
  ctx.beginPath();
  ctx.moveTo(-11, -64);
  ctx.quadraticCurveTo(-13, -76, -8, -80);
  ctx.lineTo(9, -80);
  ctx.quadraticCurveTo(14, -74, 12, -64);
  ctx.closePath();
  ctx.fillStyle = "#c0175b";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#7d0f31";
  ctx.stroke();
  /* arms */
  cap(ctx, -10, -76, -19 - swing * 0.2, -52, 6, "#eab98a", OUT);
  cap(ctx, 11, -76, 20 + swing * 0.2, -52, 6, "#f4c391", OUT);
  /* head */
  blob(ctx, 1, -90, 11.5, 12.5, 0, skin, OUT, 2.2);
  /* hair */
  ctx.beginPath();
  ctx.moveTo(-11, -92);
  ctx.quadraticCurveTo(0, -106, 12, -92);
  ctx.quadraticCurveTo(14, -78, 10, -62);
  ctx.quadraticCurveTo(2, -74, -12, -70);
  ctx.closePath();
  ctx.fillStyle = "#231317";
  ctx.fill();
  eye(ctx, -3, -91, 2.9, 0.35);
  eye(ctx, 6, -91, 2.9, 0.35);
  cap(ctx, -2, -85, 4, -85, 1.6, "#b3405a");
  blob(ctx, 1.5, -98, 2.2, 2.2, 0, "#d8342a");
  /* crown */
  ctx.beginPath();
  ctx.moveTo(-9, -99);
  ctx.lineTo(-6, -108);
  ctx.lineTo(1, -101);
  ctx.lineTo(8, -110);
  ctx.lineTo(11, -99);
  ctx.closePath();
  ctx.fillStyle = grad(ctx, -8, -108, 10, -98, [
    [0, "#fff0a8"],
    [1, "#d1a02a"],
  ]);
  ctx.fill();
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = "#8a6a12";
  ctx.stroke();
  /* necklace */
  ctx.beginPath();
  ctx.arc(1, -78, 8, 0.2, Math.PI - 0.2);
  ctx.lineWidth = 2.6;
  ctx.strokeStyle = "#ffd24a";
  ctx.stroke();
}

/* --------------------------------------------------------------- GANA GUARD */
export function drawGana(
  ctx: CanvasRenderingContext2D,
  variant: number,
  p: Pose = {},
) {
  const ph = p.phase ?? 0;
  const mv = p.moving ? 1 : 0;
  const swing = Math.sin(ph) * 18 * mv;
  const bob = Math.sin(ph * 2) * 1.4 * mv;
  shadowEllipse(ctx, 0, 1, 22, 5.5, 0.28);
  const skins = ["#d9b9a6", "#c98c5a", "#8fbf6a"];
  const cloths = ["#3f8f5e", "#8e2f3a", "#4a6fb0"];
  const sk = skins[variant % 3];
  const cl = cloths[variant % 3];
  const body = grad(ctx, -18, -70, 18, -20, [
    [0, sk],
    [1, "rgba(0,0,0,0.25)"],
  ]);

  cap(ctx, -5, -34, -7 - swing * 0.5, -2, 9.5, sk, OUT);
  cap(ctx, 5, -34, 7 + swing * 0.5, -2, 9.5, sk, OUT);
  blob(ctx, -8 - swing * 0.6, -2, 7, 3.4, 0, sk, OUT, 1.5);
  blob(ctx, 8 + swing * 0.6, -2, 7, 3.4, 0, sk, OUT, 1.5);

  ctx.save();
  ctx.translate(0, bob);
  /* loincloth */
  rr(ctx, -14, -42, 28, 16, 5);
  ctx.fillStyle = cl;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = OUT;
  ctx.stroke();
  /* torso */
  ctx.beginPath();
  ctx.moveTo(-14, -40);
  ctx.quadraticCurveTo(-19, -60, -12, -70);
  ctx.lineTo(13, -70);
  ctx.quadraticCurveTo(20, -58, 15, -40);
  ctx.closePath();
  ctx.fillStyle = body;
  ctx.fill();
  ctx.lineWidth = 2.4;
  ctx.strokeStyle = OUT;
  ctx.stroke();
  /* belt */
  cap(ctx, -14, -44, 15, -44, 4, "#6b3a18");
  /* arms */
  cap(ctx, -13, -66, -22 - swing * 0.3, -46, 8, sk, OUT);
  cap(ctx, 14, -66, 23 + swing * 0.3, -46, 8, sk, OUT);

  /* head */
  if (variant % 3 === 0) {
    /* bull-faced gana */
    blob(ctx, 0, -80, 13, 12, 0, "#e7cbbb", OUT, 2.2);
    blob(ctx, 8, -74, 8, 6.5, 0.15, "#f0b9b0", OUT, 1.8);
    blob(ctx, 10, -75, 1.4, 2, 0, "#7b4a3c");
    blob(ctx, 6.5, -76, 1.4, 2, 0, "#7b4a3c");
    /* horns */
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * 10, -88);
      ctx.quadraticCurveTo(s * 20, -96, s * 15, -102);
      ctx.lineWidth = 5.5;
      ctx.strokeStyle = "#f5eddc";
      ctx.lineCap = "round";
      ctx.stroke();
    }
    eye(ctx, -2, -84, 3, 0.4);
    eye(ctx, 6, -84, 3, 0.4);
  } else if (variant % 3 === 1) {
    /* bald wrestler gana */
    blob(ctx, 1, -80, 12, 12.5, 0, sk, OUT, 2.2);
    eye(ctx, -2, -82, 3, 0.4);
    eye(ctx, 6, -82, 3, 0.4);
    cap(ctx, -4, -75, 7, -75, 3, "#3a2116");
    blob(ctx, 1, -92, 9, 4, 0, "rgba(255,255,255,0.18)");
  } else {
    /* imp gana */
    blob(ctx, 1, -80, 11, 11.5, 0, sk, OUT, 2.2);
    eye(ctx, -2, -82, 3.2, 0.4);
    eye(ctx, 7, -82, 3.2, 0.4);
    ctx.beginPath();
    ctx.arc(2, -74, 4, 0, Math.PI);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#3a2116";
    ctx.stroke();
    cap(ctx, 1, -91, 3, -100, 3, "#3a2116");
  }
  /* weapon */
  ctx.save();
  ctx.translate(23 + swing * 0.3, -46);
  ctx.rotate(-0.4);
  cap(ctx, 0, 6, 4, -30, 4, "#9a6a35", "#5b3a12");
  if (variant % 3 === 1) blob(ctx, 5, -34, 7, 8, 0, "#8a939c", "#4a5560", 1.8);
  else {
    ctx.beginPath();
    ctx.moveTo(4, -30);
    ctx.lineTo(10, -44);
    ctx.lineTo(0, -38);
    ctx.closePath();
    ctx.fillStyle = "#c9d3dc";
    ctx.fill();
    ctx.strokeStyle = "#5a646d";
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }
  ctx.restore();
  ctx.restore();
}

/* ------------------------------------------------------------------ OBJECTS */
export function drawModak(ctx: CanvasRenderingContext2D, s = 1, t = 0) {
  ctx.save();
  ctx.scale(s, s);
  ctx.translate(0, Math.sin(t * 2) * 1.5);
  ctx.fillStyle = rgrad(ctx, 0, -6, 2, 22, [
    [0, "rgba(255,214,120,0.55)"],
    [1, "rgba(255,214,120,0)"],
  ]);
  ctx.beginPath();
  ctx.arc(0, -6, 22, 0, Math.PI * 2);
  ctx.fill();
  shadowEllipse(ctx, 0, 2, 9, 3, 0.25);
  ctx.beginPath();
  ctx.moveTo(-10, 1);
  ctx.quadraticCurveTo(-9, -12, 0, -20);
  ctx.quadraticCurveTo(9, -12, 10, 1);
  ctx.quadraticCurveTo(0, 5, -10, 1);
  ctx.closePath();
  ctx.fillStyle = grad(ctx, -8, -18, 8, 2, [
    [0, "#fff6dc"],
    [0.5, "#ffe6a8"],
    [1, "#e5b95c"],
  ]);
  ctx.fill();
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = "#b98a3c";
  ctx.stroke();
  ctx.strokeStyle = "rgba(185,138,60,0.8)";
  ctx.lineWidth = 1.2;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 3.6, 0.5);
    ctx.quadraticCurveTo(i * 2.2, -10, 0, -19);
    ctx.stroke();
  }
  blob(ctx, 0, -22, 2.4, 3.2, 0, "#ffd24a", "#b98a3c", 1);
  blob(ctx, -4, -10, 2.4, 3.4, -0.4, "rgba(255,255,255,0.7)");
  ctx.restore();
}

export function drawMouse(ctx: CanvasRenderingContext2D, s = 1, t = 0) {
  ctx.save();
  ctx.scale(s, s);
  shadowEllipse(ctx, 0, 1, 14, 3.5, 0.25);
  const g = grad(ctx, -12, -14, 12, 0, [
    [0, "#b9c2cc"],
    [1, "#7e8a97"],
  ]);
  ctx.beginPath();
  ctx.moveTo(-14, -1);
  ctx.quadraticCurveTo(-16, -12, -2, -13);
  ctx.quadraticCurveTo(12, -13, 14, -2);
  ctx.quadraticCurveTo(0, 2, -14, -1);
  ctx.closePath();
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = "#4e5a66";
  ctx.stroke();
  blob(ctx, 12, -10, 5.5, 5, 0, "#a9b3bd", "#4e5a66", 1.4);
  blob(ctx, 10, -15, 3.6, 3.6, 0, "#c9b6bd", "#4e5a66", 1.2);
  blob(ctx, 14.6, -11, 1.3, 1.3, 0, "#22181c");
  blob(ctx, 17, -8.6, 1.1, 1.1, 0, "#e8919b");
  ctx.beginPath();
  ctx.moveTo(-14, -3);
  ctx.quadraticCurveTo(-24, -6 + Math.sin(t * 6) * 3, -20, -12);
  ctx.lineWidth = 1.8;
  ctx.strokeStyle = "#e8919b";
  ctx.stroke();
  ctx.restore();
}

/* ------------------------------------------------------------------- BLOCKS */
export function grassBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  rr(ctx, x, y, w, h, 7);
  ctx.fillStyle = grad(ctx, x, y, x, y + h, [
    [0, "#8b5e3c"],
    [0.4, "#7a4f31"],
    [1, "#563522"],
  ]);
  ctx.fill();
  ctx.save();
  rr(ctx, x, y, w, h, 7);
  ctx.clip();
  ctx.fillStyle = grad(ctx, x, y, x, y + 20, [
    [0, "#7fd45a"],
    [0.6, "#4fae3c"],
    [1, "#2f7f2c"],
  ]);
  ctx.fillRect(x, y, w, 17);
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.fillRect(x, y, w, 3);
  ctx.fillStyle = "rgba(0,0,0,0.16)";
  for (let i = 0; i < w; i += 26) {
    ctx.beginPath();
    ctx.arc(x + i + 12, y + 30 + ((i * 7) % 18), 4 + ((i * 3) % 4), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  rr(ctx, x + 1, y + 1, w - 2, h - 2, 6);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(40,22,10,0.45)";
  ctx.stroke();
}

export function stoneBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  hue = 0,
) {
  rr(ctx, x, y, w, h, 8);
  ctx.fillStyle = grad(ctx, x, y, x, y + h, [
    [0, hue ? "#9fb4c9" : "#b7c2cc"],
    [0.5, hue ? "#6f8aa5" : "#8e9aa6"],
    [1, hue ? "#47607a" : "#5d6872"],
  ]);
  ctx.fill();
  ctx.save();
  rr(ctx, x, y, w, h, 8);
  ctx.clip();
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 4, y + 3);
  ctx.lineTo(x + w - 4, y + 3);
  ctx.stroke();
  ctx.strokeStyle = "rgba(20,30,40,0.35)";
  ctx.lineWidth = 2;
  for (let i = 1; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(x + (w * i) / 4, y + 6);
    ctx.lineTo(x + (w * i) / 4 + 6, y + h - 6);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(x + 6, y + h / 2);
  ctx.lineTo(x + w - 6, y + h / 2 - 4);
  ctx.stroke();
  ctx.restore();
  rr(ctx, x + 1, y + 1, w - 2, h - 2, 7);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(15,25,35,0.5)";
  ctx.stroke();
}

export function tree(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, t = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  cap(ctx, 0, 0, -2, -46, 13, "#7a5230", "#4a2f18");
  const sway = Math.sin(t * 0.8 + x * 0.01) * 2;
  for (const [cx, cy, r] of [
    [-20 + sway, -54, 24],
    [16 + sway, -58, 22],
    [-2 + sway, -74, 27],
  ]) {
    blob(ctx, cx, cy, r, r * 0.92, 0, grad(ctx, cx - r, cy - r, cx + r, cy + r, [
      [0, "#69c74a"],
      [0.6, "#3f9b34"],
      [1, "#246b25"],
    ]), "#1d5a20", 2);
  }
  blob(ctx, -12 + sway, -80, 12, 8, -0.4, "rgba(255,255,255,0.18)");
  ctx.restore();
}

export function bush(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  shadowEllipse(ctx, 0, 2, 30, 6, 0.22);
  for (const [cx, cy, r] of [
    [-16, -8, 15],
    [16, -8, 15],
    [0, -16, 19],
  ]) {
    blob(ctx, cx, cy, r, r * 0.86, 0, grad(ctx, cx, cy - r, cx, cy + r, [
      [0, "#5fbf46"],
      [1, "#21692a"],
    ]), "#1b5423", 2);
  }
  blob(ctx, -6, -22, 8, 5, -0.3, "rgba(255,255,255,0.2)");
  ctx.restore();
}
