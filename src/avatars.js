/*
 * Pixel-art student avatars in public/image/avatars/{person}-{outfit}.svg.
 * profile.character stores the full id, e.g. "mei-uniform".
 * Older profiles saved "girl" / "boy", which still show the original PNGs.
 */
export const PEOPLE = [
  { id: "mei", name: "Mei", gender: "female" },
  { id: "sofia", name: "Sofia", gender: "female" },
  { id: "aisyah", name: "Aisyah", gender: "female" },
  { id: "adam", name: "Adam", gender: "male" },
  { id: "kai", name: "Kai", gender: "male" },
  { id: "ravi", name: "Ravi", gender: "male" },
];

export const OUTFITS = [
  { id: "uniform", name: "Uniform" },
  { id: "casual", name: "Casual" },
  { id: "hoodie", name: "Hoodie" },
  { id: "labcoat", name: "Lab coat" },
  { id: "graduation", name: "Grad gown" },
];

const LEGACY = { girl: "/image/girl.png", boy: "/image/boy.png" };

export function avatarSrc(character) {
  if (!character) return LEGACY.girl;
  if (LEGACY[character]) return LEGACY[character];
  return `/image/avatars/${character}.svg`;
}

/* Splits "mei-uniform" into its parts; old "girl"/"boy" map to a close match. */
export function parseAvatar(character) {
  if (character === "boy") return { person: "adam", outfit: "uniform" };
  const [person, outfit] = (character || "").split("-");
  return {
    person: PEOPLE.some(p => p.id === person) ? person : "mei",
    outfit: OUTFITS.some(o => o.id === outfit) ? outfit : "uniform",
  };
}

export const avatarId = (person, outfit) => `${person}-${outfit}`;

/* Optional layer drawn on top of the avatar (profile.avatarAccessory). */
export const ACCESSORIES = [
  { id: "none", name: "None" },
  { id: "crown", name: "Crown" },
  { id: "gradcap", name: "Grad cap" },
  { id: "headphones", name: "Headphones" },
];

/* Accessories only line up with the new 32×32 avatars, not the old PNGs. */
export function accessorySrc(character, accessory) {
  if (!accessory || accessory === "none" || !ACCESSORIES.some(a => a.id === accessory)) return null;
  if (!character || LEGACY[character]) return null;
  return `/image/avatars/acc-${accessory}.svg`;
}
