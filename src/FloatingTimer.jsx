import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PetSprite } from "./Pet";
import { MODE_LABELS, formatClock } from "./usePomodoro";
import { SoundToggle } from "./sounds";
import SpotifyPlayer from "./SpotifyPlayer";
import { spotifyConfigured } from "./spotify";

const SCENES = { focus: "day", short: "sunset", long: "night" };
const POS_KEY = "studentlife.floatingTimer";

/*
 * Chrome/Edge 116+ can open an always-on-top window that floats over other apps,
 * but only from a real browser tab. Inside an embedded preview (e.g. VS Code's
 * built-in browser) the API exists yet refuses to open, so check for that too.
 */
const inIframe = () => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
};

export const canPopOut = () =>
  typeof window !== "undefined" && "documentPictureInPicture" in window && !inIframe();

/* Copies the app's styles into the pop-out window so it looks the same. */
function copyStyles(target) {
  [...document.styleSheets].forEach(sheet => {
    try {
      if (sheet.href) {
        const link = target.createElement("link");
        link.rel = "stylesheet";
        link.href = sheet.href;
        target.head.appendChild(link);
      } else {
        const style = target.createElement("style");
        style.textContent = [...sheet.cssRules].map(r => r.cssText).join("\n");
        target.head.appendChild(style);
      }
    } catch {
      // A stylesheet we can't read (cross-origin); skip it
    }
  });
}

/*
 * Opens / closes the pop-out window. Returns the window (or null) so the
 * caller can render into it with a portal.
 */
/* Why popping out isn't possible here, or "" if it is. */
export function popOutBlocker() {
  if (canPopOut()) return "";
  if (inIframe()) {
    return "This preview runs inside another app (like VS Code's built-in browser), so it can't float. Open http://localhost:5173 in Chrome or Edge instead.";
  }
  if (!window.isSecureContext) {
    return "Floating only works on https:// or http://localhost. Open the app at http://localhost:5173.";
  }
  return "Your browser can't float the timer over other apps. Use Chrome or Edge (version 116 or newer).";
}

export function usePopOut(onError) {
  const [pipWindow, setPipWindow] = useState(null);

  const open = useCallback(async () => {
    const blocker = popOutBlocker();
    if (blocker) { onError?.(blocker); return; }
    if (pipWindow) { pipWindow.focus(); return; }
    try {
      // Taller when the Spotify player is shown under the timer
      const pip = await window.documentPictureInPicture.requestWindow(
        spotifyConfigured ? { width: 300, height: 500 } : { width: 260, height: 330 }
      );
      copyStyles(pip.document);
      pip.document.title = "StudentLife Timer";
      pip.document.body.className = "pip-body";
      pip.addEventListener("pagehide", () => setPipWindow(null));
      setPipWindow(pip);
    } catch (err) {
      console.error("Could not open the floating window", err);
      onError?.(`Couldn't open the floating timer (${err.message}). Click the button directly, and allow pop-ups for localhost if your browser asks.`);
    }
  }, [pipWindow, onError]);

  const close = useCallback(() => pipWindow?.close(), [pipWindow]);

  // Close the pop-out if the app itself goes away (e.g. log out)
  useEffect(() => () => pipWindow?.close(), [pipWindow]);

  return { pipWindow, open, close };
}

function Controls({ timer }) {
  return (
    <div className="mini-timer__controls">
      {timer.running ? (
        <button className="mini-btn" onClick={timer.pause}>Pause</button>
      ) : (
        <button className="mini-btn mini-btn--go" onClick={timer.start}>
          {timer.progress > 0 ? "Resume" : "Start"}
        </button>
      )}
      <button className="mini-btn" onClick={timer.skip} title="Skip to the next session">Skip</button>
    </div>
  );
}

/* What shows inside the pop-out window. */
export function PopOutTimer({ pipWindow, timer, pet, petState, character, spotify, gear }) {
  if (!pipWindow) return null;
  return createPortal(
    <div className={`pip-timer pet-stage--${SCENES[timer.mode]}`}>
      <SoundToggle className="pip-sound" />
      <div className="pip-timer__mode">{MODE_LABELS[timer.mode]}</div>
      <div className="pip-timer__pet">
        {pet ? (
          <PetSprite type={pet.type} state={petState} size={112} gear={gear} />
        ) : (
          <img src={`/image/${character || "girl"}.png`} alt="" width="96" />
        )}
      </div>
      <div className="pip-timer__clock">{formatClock(timer.left)}</div>
      <div className="pixel-bar">
        <div className="pixel-bar__fill" style={{ width: `${Math.min(100, timer.progress * 100)}%` }} />
      </div>
      <Controls timer={timer} />
      {spotify && <SpotifyPlayer spotify={spotify} size="compact" />}
    </div>,
    pipWindow.document.body
  );
}

function loadPos() {
  try {
    const p = JSON.parse(localStorage.getItem(POS_KEY));
    if (p && Number.isFinite(p.x) && Number.isFinite(p.y)) return p;
  } catch {
    // ignore
  }
  return null;
}

/* Small draggable timer that floats over the app on every page except Focus. */
export function FloatingTimer({ timer, pet, petState, character, onOpenFocus, onPopOut, hidden, spotify, gear }) {
  const boxRef = useRef(null);
  const drag = useRef(null);
  const [pos, setPos] = useState(loadPos);
  const [dismissed, setDismissed] = useState(false);

  // Bring it back whenever a new session starts
  useEffect(() => {
    if (timer.running) setDismissed(false);
  }, [timer.running, timer.mode]);

  // Keep it on screen when the window is resized
  useEffect(() => {
    const clamp = () => setPos(p => (p ? clampPos(p, boxRef.current) : p));
    window.addEventListener("resize", clamp);
    return () => window.removeEventListener("resize", clamp);
  }, []);

  const active = timer.running || timer.progress > 0;
  if (hidden || dismissed || !active) return null;

  const onPointerDown = e => {
    if (e.target.closest("button")) return;
    const rect = boxRef.current.getBoundingClientRect();
    drag.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = e => {
    if (!drag.current) return;
    setPos(clampPos({ x: e.clientX - drag.current.dx, y: e.clientY - drag.current.dy }, boxRef.current));
  };

  const onPointerUp = () => {
    if (!drag.current) return;
    drag.current = null;
    try {
      localStorage.setItem(POS_KEY, JSON.stringify(pos));
    } catch {
      // ignore
    }
  };

  const style = pos ? { left: pos.x, top: pos.y, right: "auto", bottom: "auto" } : undefined;

  return (
    <div className="mini-timer" ref={boxRef} style={style} role="region" aria-label="Pomodoro timer">
      <div
        className="mini-timer__bar"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        title="Drag to move"
      >
        <span className="mini-timer__mode">{MODE_LABELS[timer.mode]}</span>
        <span className="mini-timer__icons">
          <SoundToggle />
          {onPopOut && (
            <button onClick={onPopOut} title="Float over other apps" aria-label="Pop out timer">⧉</button>
          )}
          <button onClick={onOpenFocus} title="Open Focus page" aria-label="Open Focus page">⤢</button>
          <button onClick={() => setDismissed(true)} title="Hide until the next session" aria-label="Hide timer">✕</button>
        </span>
      </div>
      <div className={`mini-timer__body pet-stage--${SCENES[timer.mode]}`}>
        {pet ? (
          <PetSprite type={pet.type} state={petState} size={56} gear={gear} />
        ) : (
          <img src={`/image/${character || "girl"}.png`} alt="" width="48" className="mini-timer__char" />
        )}
        <div className="mini-timer__clock">{formatClock(timer.left)}</div>
      </div>
      <Controls timer={timer} />
      {spotify && <SpotifyPlayer spotify={spotify} size="mini" />}
    </div>
  );
}

function clampPos(p, el) {
  const w = el?.offsetWidth || 220;
  const h = el?.offsetHeight || 150;
  return {
    x: Math.min(Math.max(8, p.x), window.innerWidth - w - 8),
    y: Math.min(Math.max(8, p.y), window.innerHeight - h - 8),
  };
}
