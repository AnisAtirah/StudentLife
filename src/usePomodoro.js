import { useCallback, useEffect, useRef, useState } from "react";
import { playSound, unlockAudio } from "./sounds";

/* Minutes for each mode. */
export const PRESETS = {
  classic: { label: "25 / 5", focus: 25, short: 5, long: 15 },
  deep: { label: "50 / 10", focus: 50, short: 10, long: 20 },
};

export const MODE_LABELS = { focus: "Focus", short: "Short break", long: "Long break" };

const STORAGE_KEY = "studentlife.pomodoro";
const DEFAULT = { mode: "focus", running: false, endAt: null, remaining: null, preset: "classic", cycle: 0 };

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && PRESETS[saved.preset] && MODE_LABELS[saved.mode]) return { ...DEFAULT, ...saved };
  } catch {
    // storage blocked or corrupt: start fresh
  }
  return DEFAULT;
}

export function formatClock(ms) {
  const total = Math.ceil(ms / 1000);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/*
 * Pomodoro timer that keeps running while you switch pages (and across reloads),
 * because it stores the end time rather than counting down in memory.
 * onFinish(mode) is called once when a focus or break session completes.
 */
export function usePomodoro(onFinish) {
  const [s, setS] = useState(load);
  const [now, setNow] = useState(() => Date.now());
  const onFinishRef = useRef(onFinish);
  const finishedFor = useRef(null);
  onFinishRef.current = onFinish;

  const durationMs = PRESETS[s.preset][s.mode] * 60000;
  const left = s.running ? Math.max(0, s.endAt - now) : (s.remaining ?? durationMs);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch {
      // ignore: the timer still works for this visit
    }
  }, [s]);

  useEffect(() => {
    if (!s.running) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [s.running]);

  const advance = useCallback((completed) => {
    setS(prev => {
      const cycle = prev.mode === "focus" && completed ? prev.cycle + 1 : prev.cycle;
      const next = prev.mode !== "focus" ? "focus" : cycle > 0 && cycle % 4 === 0 ? "long" : "short";
      return { ...prev, mode: next, running: false, endAt: null, remaining: null, cycle };
    });
  }, []);

  // Session finished
  useEffect(() => {
    if (!s.running || now < s.endAt || finishedFor.current === s.endAt) return;
    finishedFor.current = s.endAt;
    playSound(s.mode === "focus" ? "focusDone" : "breakDone");
    onFinishRef.current?.(s.mode);
    advance(true);
  }, [now, s.running, s.endAt, s.mode, advance]);

  return {
    mode: s.mode,
    preset: s.preset,
    running: s.running,
    cycle: s.cycle,
    left,
    progress: 1 - left / durationMs,
    start: () => {
      unlockAudio(); // must happen during a click so the end-of-session alarm can play later
      playSound("start");
      const t = Date.now();
      setNow(t);
      setS(prev => ({ ...prev, running: true, endAt: t + left, remaining: null }));
    },
    pause: () => {
      playSound("pause");
      setS(prev => ({ ...prev, running: false, endAt: null, remaining: left }));
    },
    reset: () => {
      playSound("click");
      setS(prev => ({ ...prev, running: false, endAt: null, remaining: null }));
    },
    skip: () => {
      playSound("skip");
      advance(false);
    },
    setMode: mode => {
      playSound("click");
      setS(prev => ({ ...prev, mode, running: false, endAt: null, remaining: null }));
    },
    setPreset: preset => setS(prev => ({ ...prev, preset, running: false, endAt: null, remaining: null })),
  };
}
