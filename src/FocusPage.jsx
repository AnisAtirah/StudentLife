import { useState } from "react";
import Pet, { PET_TYPES, PetSprite } from "./Pet";
import PixelWindow from "./PixelWindow";
import SpotifyPlayer from "./SpotifyPlayer";
import { ProgressBadge } from "./Wardrobe";
import { MODE_LABELS, PRESETS, formatClock } from "./usePomodoro";
import { todayKey } from "./dateUtils";
import { SoundToggle, playSound, setSoundSettings, useSoundSettings } from "./sounds";

export const GOAL_COLORS = ["#fff3a0", "#ffc9de", "#c6e8ff", "#d4f5b5", "#ffd9a8"];
const TILTS = [-2, 1.5, -1, 2, -1.5, 1];

export default function FocusPage({ timer, profile, petState, onPet, onAdopt, goals, onAddGoal, onUpdateGoal, onDeleteGoal, onPopOut, popOutOpen, spotify, streak, onOpenWardrobe }) {
  const pet = profile.pet;
  const today = profile.focusToday?.date === todayKey() ? profile.focusToday.count : 0;

  return (
    <div className="focus-layout">
      <div className="focus-col">
        <PixelWindow title="Focus Timer" className="pixel-window--fill">
          <div className="mode-tabs" role="tablist">
            {Object.entries(MODE_LABELS).map(([id, label]) => (
              <button
                key={id}
                role="tab"
                aria-selected={timer.mode === id}
                className={`mode-tab ${timer.mode === id ? "mode-tab--active" : ""}`}
                onClick={() => timer.setMode(id)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className={`pet-stage pet-stage--${{ focus: "day", short: "sunset", long: "night" }[timer.mode]}`}>
            {pet ? (
              <>
                <button className="wardrobe-btn" onClick={onOpenWardrobe} title="Dress up your pet">👕 Wardrobe</button>
                <Pet type={pet.type} name={pet.name} state={petState} size={168} onPet={onPet} gear={profile.equipped} />
                <div className="pet-stage__name">
                  {pet.name} <span className="pet-love">❤ {profile.petLove || 0}</span>
                </div>
              </>
            ) : (
              <AdoptPet onAdopt={onAdopt} />
            )}
          </div>

          <ProgressBadge profile={profile} streak={streak} />

          <div className="timer-clock" aria-live="off">{formatClock(timer.left)}</div>
          <div className="pixel-bar timer-bar">
            <div className="pixel-bar__fill" style={{ width: `${Math.min(100, timer.progress * 100)}%` }} />
          </div>

          <div className="timer-controls">
            {timer.running ? (
              <button className="pixel-btn pixel-btn--light" onClick={timer.pause}>Pause</button>
            ) : (
              <button className="pixel-btn" onClick={timer.start}>
                {timer.progress > 0 ? "Resume" : "Start"}
              </button>
            )}
            <button className="pixel-btn pixel-btn--light" onClick={timer.reset}>Reset</button>
            <button className="pixel-btn pixel-btn--light" onClick={timer.skip}>Skip</button>
          </div>

          {onPopOut && (
            <button className="popout-btn" onClick={onPopOut}>
              ⧉ {popOutOpen ? "Timer is floating — show it" : "Pop out timer (floats over other apps)"}
            </button>
          )}

          <div className="timer-footer">
            <span className="cycle-dots" title="Focus sessions this round (long break after 4)">
              {[0, 1, 2, 3].map(i => (
                <span key={i} className={`cycle-dot ${i < timer.cycle % 4 || (timer.cycle > 0 && timer.cycle % 4 === 0 && timer.mode === "long") ? "cycle-dot--on" : ""}`} />
              ))}
            </span>
            <span>Today: <b>{today}</b> 🍅 · Total: <b>{profile.focusSessions || 0}</b></span>
            <SoundControls />
            <select
              className="form-select preset-select"
              value={timer.preset}
              onChange={e => timer.setPreset(e.target.value)}
              aria-label="Timer length"
            >
              {Object.entries(PRESETS).map(([id, p]) => <option key={id} value={id}>{p.label}</option>)}
            </select>
          </div>
        </PixelWindow>

        <SpotifyPlayer spotify={spotify} size="full" />
      </div>

      <GoalsBoard goals={goals} onAdd={onAddGoal} onUpdate={onUpdateGoal} onDelete={onDeleteGoal} />
    </div>
  );
}

/* Mute toggle + volume slider (settings shared with the floating timers). */
function SoundControls() {
  const { muted, volume } = useSoundSettings();
  return (
    <span className="sound-controls">
      <SoundToggle className="sound-btn" />
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={volume}
        disabled={muted}
        aria-label="Sound volume"
        onChange={e => setSoundSettings({ volume: Number(e.target.value) })}
        onPointerUp={() => playSound("click")}
      />
    </span>
  );
}

function AdoptPet({ onAdopt }) {
  const [type, setType] = useState("cat");
  const [name, setName] = useState("");

  return (
    <form
      className="adopt"
      onSubmit={e => {
        e.preventDefault();
        onAdopt({ type, name: name.trim() || PET_TYPES[type].label });
      }}
    >
      <div className="adopt__title">Adopt a study buddy!</div>
      <div className="adopt__options">
        {Object.entries(PET_TYPES).map(([id, p]) => (
          <button
            key={id}
            type="button"
            className={`character-card adopt__card ${type === id ? "active" : ""}`}
            onClick={() => setType(id)}
            aria-pressed={type === id}
            aria-label={p.label}
          >
            <PetSprite type={id} size={84} />
          </button>
        ))}
      </div>
      <div className="adopt__row">
        <input
          className="form-input"
          placeholder={`Name your ${PET_TYPES[type].label.toLowerCase()}`}
          maxLength={14}
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <button type="submit" className="submit-btn">Adopt</button>
      </div>
    </form>
  );
}

/* Sticky-note goals board. */
function GoalsBoard({ goals, onAdd, onUpdate, onDelete }) {
  const [text, setText] = useState("");
  const [color, setColor] = useState(GOAL_COLORS[0]);
  const [editing, setEditing] = useState(null);

  const add = e => {
    e.preventDefault();
    if (!text.trim()) return;
    onAdd({ text: text.trim(), color, done: false });
    setText("");
  };

  return (
    <div className="task-panel task-panel--padded goals-board">
      <div className="task-panel__title">📌 My Goals</div>
      <p className="page-hint">Stick your goals here so you see them every time you study.</p>

      <div className="sticky-grid">
        {goals.map((g, i) => (
          <div
            key={g.id}
            className={`sticky ${g.done ? "sticky--done" : ""}`}
            style={{ background: g.color, "--tilt": `${TILTS[i % TILTS.length]}deg` }}
          >
            <span className="sticky__pin" aria-hidden="true" />
            {editing === g.id ? (
              <textarea
                className="sticky__edit"
                defaultValue={g.text}
                maxLength={120}
                autoFocus
                onBlur={e => {
                  const v = e.target.value.trim();
                  if (v && v !== g.text) onUpdate(g.id, { text: v });
                  setEditing(null);
                }}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.target.blur(); }
                  if (e.key === "Escape") setEditing(null);
                }}
              />
            ) : (
              <button className="sticky__text" onClick={() => setEditing(g.id)} title="Click to edit">
                {g.text}
              </button>
            )}
            {g.done && <span className="sticky__stamp">DONE!</span>}
            <div className="sticky__actions">
              <button onClick={() => onUpdate(g.id, { done: !g.done })} title={g.done ? "Mark not done" : "Mark achieved"}>
                {g.done ? "↺" : "✓"}
              </button>
              <button
                onClick={() => { if (window.confirm("Remove this goal?")) onDelete(g.id); }}
                title="Remove goal"
              >
                ✕
              </button>
            </div>
          </div>
        ))}

        <form className="sticky sticky--new" style={{ background: color, "--tilt": "0deg" }} onSubmit={add}>
          <textarea
            className="sticky__edit"
            placeholder="Write a new goal... e.g. Get an A in WIA2001"
            maxLength={120}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) add(e); }}
          />
          <div className="sticky__new-row">
            <span className="color-dots">
              {GOAL_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`color-dot ${c === color ? "color-dot--active" : ""}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                  aria-label="Note color"
                />
              ))}
            </span>
            <button type="submit" className="submit-btn">Stick it</button>
          </div>
        </form>
      </div>
    </div>
  );
}
