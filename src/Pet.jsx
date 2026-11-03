import { useEffect, useRef, useState } from "react";
import { PETS, SPRITE_H, SPRITE_W, drawFrame } from "./petSprites";
import { playSound } from "./sounds";

/* Pet types offered for adoption. Older saved pets (e.g. "bunny") fall back to the cat. */
export const PET_TYPES = Object.fromEntries(
  Object.entries(PETS).map(([id, p]) => [id, { label: p.label }])
);

// App states → sprite animation modes
const MODES = { work: "working", break: "break", sleep: "sleepy", idle: "idle", happy: "idle" };

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/* Animated canvas sprite: 28x28 logical pixels, scaled up crisply with CSS. */
export function PetSprite({ type = "cat", state = "idle", size = 96, animate = true, gear }) {
  const canvasRef = useRef(null);
  const key = PETS[type] ? type : "cat";
  const mode = MODES[state] || "idle";
  // Compare gear by value so re-renders (e.g. the timer ticking) don't restart the animation
  const gearKey = JSON.stringify(gear || {});

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const g = JSON.parse(gearKey);
    let frame = 0;
    drawFrame(ctx, key, mode, frame, g);
    if (!animate || prefersReducedMotion()) return;
    const id = setInterval(() => drawFrame(ctx, key, mode, ++frame, g), 250);
    return () => clearInterval(id);
  }, [key, mode, animate, gearKey]);

  return (
    <canvas
      ref={canvasRef}
      className={`pet-sprite pet-sprite--${state}`}
      width={SPRITE_W}
      height={SPRITE_H}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}

/* A pet you can click to pet: hops and shows floating hearts. */
export default function Pet({ type, name, state = "idle", size = 96, onPet, gear }) {
  const [hearts, setHearts] = useState([]);
  const [happy, setHappy] = useState(false);
  const happyTimer = useRef(null);

  useEffect(() => () => clearTimeout(happyTimer.current), []);

  const handlePet = () => {
    const id = Date.now() + Math.random();
    setHearts(h => [...h, { id, x: 25 + Math.random() * 50 }]);
    setTimeout(() => setHearts(h => h.filter(x => x.id !== id)), 1000);
    setHappy(true);
    clearTimeout(happyTimer.current);
    happyTimer.current = setTimeout(() => setHappy(false), 1100);
    playSound("pet");
    onPet?.();
  };

  return (
    <button
      type="button"
      className={`pet ${happy ? "pet--happy" : ""}`}
      onClick={handlePet}
      title={`Pet ${name || "your pet"}`}
      aria-label={`Pet ${name || "your pet"}`}
    >
      <PetSprite type={type} state={state} size={size} gear={gear} />
      {hearts.map(h => (
        <span key={h.id} className="pet__heart" style={{ left: `${h.x}%` }}>❤</span>
      ))}
    </button>
  );
}
