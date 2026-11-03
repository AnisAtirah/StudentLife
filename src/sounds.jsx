import { useSyncExternalStore } from "react";

/*
 * 8-bit sound effects made with the Web Audio API (no audio files needed).
 * Browsers only allow sound after the user clicks something, so call
 * unlockAudio() from a click before the first sound.
 */

const KEY = "studentlife.sound";
const DEFAULTS = { muted: false, volume: 0.6 };

let ctx = null;
let master = null;
let settings = loadSettings();
const listeners = new Set();

function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && typeof s.muted === "boolean" && Number.isFinite(s.volume)) return s;
  } catch {
    // storage blocked: use defaults
  }
  return DEFAULTS;
}

export function setSoundSettings(changes) {
  settings = { ...settings, ...changes };
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
  if (master) master.gain.value = settings.volume;
  listeners.forEach(l => l());
}

/* Shared sound settings that every timer view stays in sync with. */
export function useSoundSettings() {
  return useSyncExternalStore(
    cb => { listeners.add(cb); return () => listeners.delete(cb); },
    () => settings
  );
}

export function unlockAudio() {
  try {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = settings.volume;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
  } catch {
    ctx = null;
  }
}

/* One note: frequency (Hz), start offset and length (s), optional pitch slide. */
function tone(freq, at, dur, { type = "square", vol = 0.25, slideTo } = {}) {
  const t = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

const NOTE = { C5: 523, D5: 587, E5: 659, G5: 784, A5: 880, C6: 1047, E6: 1319, G6: 1568 };

const SOUNDS = {
  click: () => tone(880, 0, 0.05, { vol: 0.12 }),
  start: () => {
    tone(NOTE.C5, 0, 0.08, { vol: 0.15 });
    tone(NOTE.G5, 0.08, 0.12, { vol: 0.15 });
  },
  pause: () => {
    tone(NOTE.G5, 0, 0.08, { vol: 0.15 });
    tone(NOTE.C5, 0.08, 0.12, { vol: 0.15 });
  },
  skip: () => tone(NOTE.E5, 0, 0.12, { vol: 0.13, slideTo: NOTE.E6 }),
  // Victory jingle, played twice so it's noticeable
  focusDone: () => {
    [0, 1.1].forEach(o => {
      [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6].forEach((f, i) => tone(f, o + i * 0.1, 0.12));
      tone(NOTE.E6, o + 0.42, 0.18);
      tone(NOTE.G6, o + 0.62, 0.35, { vol: 0.22 });
    });
  },
  // Softer "time to get back" tune for the end of a break
  breakDone: () => {
    [0, 1.0].forEach(o => {
      [NOTE.G5, NOTE.E5, NOTE.C5].forEach((f, i) => tone(f, o + i * 0.16, 0.2, { type: "triangle", vol: 0.35 }));
      tone(NOTE.D5, o + 0.5, 0.3, { type: "triangle", vol: 0.35 });
    });
  },
  // Coin pickup: two quick high notes
  coin: () => {
    tone(988, 0, 0.07, { vol: 0.15 });
    tone(1319, 0.07, 0.16, { vol: 0.15 });
  },
  // Buying something
  buy: () => {
    [NOTE.E5, NOTE.G5, NOTE.E6].forEach((f, i) => tone(f, i * 0.07, 0.09, { vol: 0.15 }));
  },
  // Level up fanfare
  levelUp: () => {
    [NOTE.C5, NOTE.C5, NOTE.C5, NOTE.G5].forEach((f, i) => tone(f, i * 0.12, 0.1));
    tone(NOTE.E5, 0.5, 0.12);
    tone(NOTE.G5, 0.62, 0.12);
    tone(NOTE.C6, 0.74, 0.5, { vol: 0.22 });
    tone(NOTE.E6, 0.74, 0.5, { type: "triangle", vol: 0.2 });
  },
  // Cute "boop boop" for petting
  pet: () => {
    tone(600, 0, 0.1, { type: "sine", vol: 0.3, slideTo: 950 });
    tone(750, 0.12, 0.12, { type: "sine", vol: 0.3, slideTo: 1200 });
  },
};

export function playSound(name) {
  if (settings.muted || !SOUNDS[name]) return;
  unlockAudio();
  if (!ctx) return;
  try {
    SOUNDS[name]();
  } catch {
    // sound is a nice-to-have; never break the app over it
  }
}

/* 🔊 / 🔇 toggle used by every timer view. */
export function SoundToggle({ className = "" }) {
  const { muted } = useSoundSettings();
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        unlockAudio();
        setSoundSettings({ muted: !muted });
        if (muted) setTimeout(() => playSound("click"), 0);
      }}
      title={muted ? "Turn sound on" : "Mute sounds"}
      aria-label={muted ? "Turn sound on" : "Mute sounds"}
      aria-pressed={!muted}
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );
}
