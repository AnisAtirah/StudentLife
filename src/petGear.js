/*
 * Wardrobe items for the study pets, drawn as tiny pixel grids on the 28x28 sprite.
 * "." is transparent; other letters map to each item's palette.
 */

const O = "#2b2340"; // outline, same as the pets

export const SLOTS = [
  { id: "hat", label: "Hats" },
  { id: "face", label: "Face" },
  { id: "desk", label: "Desk" },
  { id: "mug", label: "Mug" },
];

/* price in coins, level needed to unlock */
export const ITEMS = [
  { id: "party", slot: "hat", name: "Party hat", price: 40, level: 1 },
  { id: "bow", slot: "hat", name: "Bow", price: 50, level: 1 },
  { id: "beanie", slot: "hat", name: "Beanie", price: 90, level: 3 },
  { id: "flower", slot: "hat", name: "Flower", price: 80, level: 4 },
  { id: "crown", slot: "hat", name: "Crown", price: 250, level: 8 },
  { id: "glasses", slot: "face", name: "Round glasses", price: 60, level: 2 },
  { id: "shades", slot: "face", name: "Sunglasses", price: 150, level: 5 },
  { id: "plant", slot: "desk", name: "Desk plant", price: 60, level: 2 },
  { id: "books", slot: "desk", name: "Book stack", price: 70, level: 3 },
  { id: "lamp", slot: "desk", name: "Desk lamp", price: 100, level: 4 },
  { id: "mugBlue", slot: "mug", name: "Blue mug", price: 30, level: 1 },
  { id: "mugGreen", slot: "mug", name: "Green mug", price: 30, level: 1 },
  { id: "mugGold", slot: "mug", name: "Gold mug", price: 150, level: 6 },
];

export const itemById = id => ITEMS.find(i => i.id === id);

export const MUG_COLORS = { mugBlue: "#8fc1ff", mugGreen: "#9be58a", mugGold: "#ffd166" };

const HATS = {
  party: {
    pal: { o: O, r: "#e5486b", w: "#fff3c4", y: "#ffd166" },
    grid: ["...y...", "..oro..", ".orwro.", ".owrwo.", "ooooooo"],
  },
  bow: {
    pal: { p: "#f7a1b5", k: "#e5486b" },
    grid: ["pp.pp", "ppkpp", "pp.pp"],
    dx: 5,
  },
  beanie: {
    pal: { o: O, b: "#5b8def", w: "#ffffff" },
    grid: ["....w....", "..obbbo..", ".obbbbbo.", "owwwwwwwo"],
  },
  flower: {
    pal: { w: "#ffffff", y: "#ffd166", o: O },
    grid: [".w.", "wyw", ".w."],
    dx: 6,
    dy: 1,
  },
  crown: {
    pal: { g: "#f2c230", r: "#e5486b", b: "#5b8def", o: O },
    grid: ["g..g..g", "gg.g.gg", "grgggbg", "ooooooo"],
  },
};

const DESK = {
  plant: {
    pal: { g: "#6cb944", o: O, t: "#c96f3b" },
    grid: ["..g..", ".ggg.", "g.g.g", ".ggg.", "..g..", "ooooo", "ottto", ".ttt.", ".ooo."],
  },
  books: {
    pal: { o: O, r: "#e5486b", b: "#5b8def", g: "#6cb944", w: "#fffdf7" },
    grid: ["oooooo", "orrrwo", "oooooo", "obbbbo", "oooooo", "owgggo", "oooooo"],
  },
  lamp: {
    pal: { o: O, y: "#ffd166", l: "#fff3c4" },
    grid: [".oooo.", "oyyyyo", "oooooo", ".l..l.", "...o..", "...o..", "...o..", "..ooo.", ".ooooo"],
  },
};

function drawGrid(ctx, item, left, top) {
  item.grid.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const c = item.pal[row[x]];
      if (!c) continue;
      ctx.fillStyle = c;
      ctx.fillRect(left + x, top + y, 1, 1);
    }
  });
}

/* Hat sits centred on the head; its bottom row overlaps the top of the head. */
export function drawHat(ctx, id, P, headShift) {
  const hat = HATS[id];
  if (!hat) return;
  const w = hat.grid[0].length;
  const left = 14 - Math.floor(w / 2) + (hat.dx || 0);
  const top = P.hatY - hat.grid.length + 1 + headShift + (hat.dy || 0);
  drawGrid(ctx, hat, left, top);
}

/* Glasses frame each 2x2 eye; sunglasses are filled in with a little shine. */
export function drawFace(ctx, id, P, eyeShift) {
  if (id !== "glasses" && id !== "shades") return;
  const [x1, x2, ey] = P.eyes;
  const y = ey + eyeShift;
  [x1, x2].forEach(x => {
    if (id === "shades") {
      ctx.fillStyle = "#1b1b2a";
      ctx.fillRect(x - 1, y - 1, 4, 4);
      ctx.fillStyle = "#8fd3ff";
      ctx.fillRect(x, y - 1 + 1, 1, 1);
    } else {
      ctx.fillStyle = O;
      ctx.fillRect(x - 1, y - 1, 4, 1);
      ctx.fillRect(x - 1, y + 2, 4, 1);
      ctx.fillRect(x - 1, y - 1, 1, 4);
      ctx.fillRect(x + 2, y - 1, 1, 4);
    }
  });
  // bridge between the lenses
  ctx.fillStyle = id === "shades" ? "#1b1b2a" : O;
  ctx.fillRect(x1 + 3, y, x2 - x1 - 4, 1);
}

/* Desk item stands on the left side of the desk (desk top is y = 25). */
export function drawDeskItem(ctx, id) {
  const item = DESK[id];
  if (!item) return;
  drawGrid(ctx, item, 1, 25 - item.grid.length);
}
