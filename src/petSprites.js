// Pixel-art study pets (cat, dog, turtle) with "working", "idle", "sleepy" and "break" (coffee) animations.
// Pure canvas drawing, no dependencies. Logical canvas is 28 x 28 pixels; scale it up with CSS.

import { MUG_COLORS, drawDeskItem, drawFace, drawHat } from "./petGear";

export const SPRITE_W = 28;
export const SPRITE_H = 28;

const OUTLINE = "#2b2340";

export const PETS = {
  cat: {
    label: "Cat",
    oy: 5,
    head: [0, 11],
    mouthY: 15,
    hatY: 8, // canvas row of the top of the head (between the ears)
    eyes: [8, 18, 12], // left eye x, right eye x, eye y

    pal: { o: OUTLINE, b: "#9db0d6", d: "#7086b8", w: "#f6f1ea", p: "#f5a9bc", n: "#e8798f" },
    skin: "b",
    paw: "b",
    grid: [
      "...o............o...",
      "..obo..........obo..",
      "..obpo........opbo..",
      ".obbboooooooooobbbo.",
      ".obbbbbbbddbbbbbbbo.",
      "obbbbbbbbddbbbbbbbbo",
      "obbdbbbbbbbbbbbbdbbo",
      "obbbEEbbbbbbbbEEbbbo",
      "obbbeebbbbbbbbeebbbo",
      "obbppbbbbnnbbbbppbbo",
      ".obbbbbbwwwwbbbbbbo.",
      "..oobbbbbbbbbbbboo..",
      "...obbbbwwwwbbbbo...",
      "..obbbbwwwwwwbbbbo..",
      "..obbbwwwwwwwwbbbo..",
      ".obbbbwwwwwwwwbbbbo.",
      ".obbbbwwwwwwwwbbbbo.",
      ".obbbbbwwwwwwbbbbbo.",
      ".oooooooooooooooooo.",
    ],
  },
  dog: {
    label: "Dog",
    oy: 5,
    head: [0, 10],
    mouthY: 14,
    hatY: 5,
    eyes: [10, 16, 10],
    pal: { o: OUTLINE, b: "#f3e3c3", d: "#9a6247", w: "#fffaf0", p: "#ef6f6c", n: "#3a2a3f", r: "#3fb8a5" },
    skin: "b",
    paw: "b",
    grid: [
      "....oooooooooooo....",
      "...obbbbbbbbbbbbo...",
      ".oddbbbbbbbbbbbbddo.",
      "odddbddbbbbbbbbbdddo",
      "odddbddbbbbbbbbbdddo",
      "odddbbEEbbbbEEbbdddo",
      "odddbbeebbbbeebbdddo",
      "odddbbwwwnnwwwbbdddo",
      ".oddbwwwwnnwwwwbddo.",
      "..ooobwwwppwwwbooo..",
      "....oobbbbbbbboo....",
      ".....orrrrrrrro.....",
      "....obbbwwwwbbbo....",
      "...obbbwwwwwwbbbo...",
      "...obbwwwwwwwwbbo...",
      "..obbbwwwwwwwwbbbo..",
      "..obbbwwwwwwwwbbbo..",
      "..obbbbwwwwwwbbbbo..",
      "..oooooooooooooooo..",
    ],
  },
  turtle: {
    label: "Turtle",
    oy: 6,
    head: [8, 13],
    mouthY: 17,
    hatY: 6, // hats sit on top of the shell
    eyes: [10, 16, 15],
    stretch: true, // keep the neck joined when the head droops
    pal: { o: OUTLINE, s: "#f0a95b", h: "#ffd38a", k: "#b8693c", g: "#93d6bd", p: "#f5a9bc", n: "#5f8f7e" },
    skin: "g",
    paw: "g",
    grid: [
      ".....oooooooooo.....",
      "...oosshhsshhssoo...",
      "..ossshhsssshhssso..",
      ".ohhsssshhhhsssshho.",
      ".ossshhsssssshhssso.",
      "ossshhssshhssshhssso",
      "okkkkkkkkkkkkkkkkkko",
      "oooooooggggggooooooo",
      ".....oggggggggo.....",
      "....ogEEggggEEgo....",
      "....ogeeggggeego....",
      "....opgggnngggpo....",
      ".....oggggggggo.....",
      "......oooooooo......",
    ],
  },
};

function px(ctx, x, y, c) {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, 1, 1);
}

function rect(ctx, x, y, w, h, c) {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, w, h);
}

function drawRow(ctx, P, row, y, ox, closed) {
  for (let x = 0; x < row.length; x++) {
    const ch = row[x];
    if (ch === ".") continue;
    let c;
    if (ch === "E" || ch === "e") {
      if (closed) c = ch === "e" ? P.pal.o : P.pal[P.skin];
      else c = ch === "E" && row[x - 1] !== "E" ? "#ffffff" : P.pal.o;
    } else {
      c = P.pal[ch];
    }
    px(ctx, ox + x, y, c);
  }
}

function drawPaw(ctx, x, y, color) {
  rect(ctx, x, y - 1, 3, 1, OUTLINE); // rounded outline
  rect(ctx, x - 1, y, 1, 2, OUTLINE);
  rect(ctx, x + 3, y, 1, 2, OUTLINE);
  rect(ctx, x, y + 2, 3, 1, OUTLINE);
  rect(ctx, x, y, 3, 2, color);
  px(ctx, x + 1, y + 1, OUTLINE); // toe line
}

function drawMug(ctx, x, y, f, steam, color = "#f28b82") {
  rect(ctx, x, y, 4, 5, OUTLINE);
  rect(ctx, x + 1, y + 1, 2, 3, color);
  rect(ctx, x + 1, y + 1, 2, 1, "#6b4a3a");
  rect(ctx, x + 4, y + 1, 1, 3, OUTLINE);
  if (steam) {
    const s = f % 2;
    px(ctx, x + 1 + s, y - 2, "#c9c3d9");
    px(ctx, x + 2 - s, y - 3, "#c9c3d9");
  }
}

const Z = [
  [1, 1, 1, 1],
  [0, 0, 1, 0],
  [0, 1, 0, 0],
  [1, 1, 1, 1],
];

/**
 * Draw one frame.
 * @param ctx  2D context of a SPRITE_W x SPRITE_H canvas
 * @param key  'cat' | 'dog' | 'turtle'
 * @param mode 'working' | 'idle' | 'sleepy' | 'break'
 *             ('idle' = calm working pose: pencil still, no sparkle; added for StudentLife)
 * @param f    frame counter (integer, increases over time)
 * @param gear equipped wardrobe items { hat, face, desk, mug } (item ids), all optional
 */
export function drawFrame(ctx, key, mode, f, gear = {}) {
  const P = PETS[key] || PETS.cat;
  const mugColor = MUG_COLORS[gear.mug];
  const sleepy = mode === "sleepy";
  const idle = mode === "idle";
  ctx.clearRect(0, 0, SPRITE_W, SPRITE_H);
  ctx.globalAlpha = 1;

  // desk
  rect(ctx, 0, 25, SPRITE_W, 1, "#a9744f");
  rect(ctx, 0, 26, SPRITE_W, 2, "#c48b5c");

  // pet
  const g = P.grid;
  const ox = Math.floor((SPRITE_W - g[0].length) / 2);
  const [h0, h1] = P.head;
  const onBreak = mode === "break";
  const sipCycle = f % 8;
  const sipping = onBreak && (sipCycle === 4 || sipCycle === 5);
  const bob = sleepy ? Math.floor(f / 3) % 2 : 0;
  const closed = sleepy || sipping || f % 16 === 7;
  for (let y = 0; y < g.length; y++) {
    if (y >= h0 && y <= h1) continue;
    drawRow(ctx, P, g[y], P.oy + y, ox, closed);
  }
  if (bob && P.stretch) drawRow(ctx, P, g[h0], P.oy + h0, ox, closed);
  for (let y = h0; y <= h1; y++) drawRow(ctx, P, g[y], P.oy + y + bob, ox, closed);

  // wardrobe: hat moves with the head only if the head includes the top row (not the turtle's shell)
  if (gear.face) drawFace(ctx, gear.face, P, bob);
  if (gear.hat) drawHat(ctx, gear.hat, P, h0 === 0 ? bob : 0);

  // notebook (open while working/sleepy, closed on a break)
  rect(ctx, 8, 21, 12, 4, OUTLINE);
  if (onBreak) {
    rect(ctx, 9, 22, 10, 2, "#b8a9e8");
    rect(ctx, 9, 22, 1, 2, "#8f7fd0");
    rect(ctx, 11, 24, 6, 1, "#ffd166"); // pencil resting
    px(ctx, 17, 24, "#f5a9bc");
    px(ctx, 10, 24, OUTLINE);
  } else {
    rect(ctx, 9, 22, 4, 2, "#fffdf7");
    rect(ctx, 15, 22, 4, 2, "#fffdf7");
    rect(ctx, 13, 22, 2, 2, "#d9d2e6");
    const ink = [[9, 22], [10, 23], [11, 22], [12, 23], [15, 22], [16, 23], [17, 22], [18, 23]];
    const written = sleepy ? 5 : idle ? 3 : Math.min(f % 12, 8);
    for (let i = 0; i < written; i++) px(ctx, ink[i][0], ink[i][1], "#8f86a8");
  }

  const paw = P.pal[P.paw];
  drawPaw(ctx, 9, 20, paw);

  if (onBreak) {
    // mug held in paw, lifted to the mouth to sip
    const mx = sipping ? 14 : 17;
    const my = sipping ? P.mouthY - 1 : 16;
    drawMug(ctx, mx, my, f, false, mugColor);
    drawPaw(ctx, mx, my + 5, paw);
    if (sipCycle >= 6) {
      // little happy heart after a sip
      const hy = 4 - (sipCycle - 6);
      const H = "#f2728a";
      px(ctx, 2, hy, H); px(ctx, 4, hy, H);
      rect(ctx, 2, hy + 1, 3, 1, H);
      px(ctx, 3, hy + 2, H);
    }
  } else {
    // writing paw (+ pencil)
    const dx = sleepy || idle ? 0 : [0, 1, 2, 1][f % 4];
    drawPaw(ctx, 16 + dx, 20, paw);
    if (sleepy) {
      rect(ctx, 14, 24, 5, 1, "#ffd166"); // pencil dropped on the desk
      px(ctx, 19, 24, "#f5a9bc");
      px(ctx, 13, 24, OUTLINE);
    } else {
      px(ctx, 20 + dx, 17, "#f5a9bc");
      px(ctx, 19 + dx, 18, "#ffd166");
      px(ctx, 18 + dx, 19, "#ffd166");
    }
    drawMug(ctx, 22, 20, f, !sleepy, mugColor);
  }

  if (gear.desk) drawDeskItem(ctx, gear.desk);

  if (sleepy) {
    // floating Zzz
    for (let i = 0; i < 2; i++) {
      const p = ((f + i * 6) % 12) / 12;
      const zx = 19 + Math.round(p * 4);
      const zy = 10 - Math.round(p * 9);
      ctx.globalAlpha = 1 - p * 0.7;
      for (let yy = 0; yy < 4; yy++)
        for (let xx = 0; xx < 4; xx++) if (Z[yy][xx]) px(ctx, zx + xx, zy + yy, "#7b6fd6");
    }
    ctx.globalAlpha = 1;
  } else if (!onBreak && !idle && f % 8 < 2) {
    // little focus sparkle
    px(ctx, 3, 8, "#ffd166");
    px(ctx, 2, 9, "#ffd166");
    px(ctx, 3, 9, "#fff3c4");
    px(ctx, 4, 9, "#ffd166");
    px(ctx, 3, 10, "#ffd166");
  }
}
