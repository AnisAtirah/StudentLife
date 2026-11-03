import { useEffect, useState } from "react";
import { PetSprite } from "./Pet";
import PixelWindow from "./PixelWindow";
import { ITEMS, SLOTS } from "./petGear";
import { levelInfo } from "./rewards";

/* Shop + closet: buy items with coins, then put them on your pet. */
export default function Wardrobe({ profile, onBuy, onEquip, onClose }) {
  const [slot, setSlot] = useState("hat");
  const { level } = levelInfo(profile.xp);
  const coins = profile.coins || 0;
  const owned = new Set(profile.owned || []);
  const equipped = profile.equipped || {};
  const pet = profile.pet || { type: "cat" };

  // Close on Escape
  useEffect(() => {
    const onKey = e => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-label="Wardrobe">
        <PixelWindow title="Wardrobe">
          <div className="wardrobe-head">
            <span className="wardrobe-pet">
              <PetSprite type={pet.type} state="idle" size={84} gear={equipped} />
            </span>
            <span className="wardrobe-wallet">
              <b>🪙 {coins}</b> coins · <b>Lv {level}</b>
            </span>
            <button className="modal-close" onClick={onClose} aria-label="Close wardrobe">✕</button>
          </div>

          <div className="mode-tabs wardrobe-tabs" role="tablist">
            {SLOTS.map(s => (
              <button
                key={s.id}
                role="tab"
                aria-selected={slot === s.id}
                className={`mode-tab ${slot === s.id ? "mode-tab--active" : ""}`}
                onClick={() => setSlot(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="item-grid">
            {ITEMS.filter(i => i.slot === slot).map(item => {
              const has = owned.has(item.id);
              const wearing = equipped[item.slot] === item.id;
              const locked = level < item.level;
              const tooPoor = coins < item.price;
              return (
                <div key={item.id} className={`item-card ${wearing ? "item-card--on" : ""} ${locked ? "item-card--locked" : ""}`}>
                  {/* Preview: your pet wearing this item */}
                  <PetSprite type={pet.type} state="idle" size={84} animate={false} gear={{ ...equipped, [item.slot]: item.id }} />
                  <div className="item-card__name">{item.name}</div>
                  {wearing ? (
                    <button className="mini-btn" onClick={() => onEquip(item.slot, null)}>Take off</button>
                  ) : has ? (
                    <button className="mini-btn mini-btn--go" onClick={() => onEquip(item.slot, item.id)}>Wear</button>
                  ) : locked ? (
                    <div className="item-card__lock">🔒 Level {item.level}</div>
                  ) : (
                    <button
                      className="mini-btn mini-btn--go"
                      disabled={tooPoor}
                      title={tooPoor ? `You need ${item.price - coins} more coins` : ""}
                      onClick={() => onBuy(item)}
                    >
                      Buy 🪙 {item.price}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <p className="wardrobe-tip">
            Earn coins: focus session +10 · task done +5 · goal achieved +15 · daily streak bonus
          </p>
        </PixelWindow>
      </div>
    </div>
  );
}

/* "LEVEL UP!" celebration with the pet and anything newly unlocked. */
export function LevelUpModal({ level, profile, onClose }) {
  const unlocked = ITEMS.filter(i => i.level === level);
  const pet = profile.pet;

  useEffect(() => {
    const onKey = e => (e.key === "Escape" || e.key === "Enter") && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal--small" role="dialog" aria-label="Level up">
        <PixelWindow title="Level up!">
          <div className="levelup">
            <div className="levelup__burst" aria-hidden="true">★ ★ ★</div>
            {pet && <PetSprite type={pet.type} state="idle" size={112} gear={profile.equipped} />}
            <div className="levelup__title">LEVEL {level}</div>
            <p className="window-text">
              {pet ? `${pet.name} is proud of you!` : "Great studying!"}
              {unlocked.length > 0 && <> New in the Wardrobe: <b>{unlocked.map(i => i.name).join(", ")}</b></>}
            </p>
            <button className="pixel-btn" onClick={onClose} autoFocus>Yay!</button>
          </div>
        </PixelWindow>
      </div>
    </div>
  );
}

/* Level, XP bar, coins and streak; used on the Focus page and the banner. */
export function ProgressBadge({ profile, streak, compact = false }) {
  const { level, into, needed, progress } = levelInfo(profile.xp);
  return (
    <div className={`progress-badge ${compact ? "progress-badge--compact" : ""}`}>
      <span className="progress-badge__lv">Lv {level}</span>
      {!compact && (
        <span className="progress-badge__xp" title={`${into} / ${needed} XP to level ${level + 1}`}>
          <span className="pixel-bar"><span className="pixel-bar__fill" style={{ width: `${progress * 100}%` }} /></span>
          <small>{into}/{needed} XP</small>
        </span>
      )}
      <span className="progress-badge__coins" title="Coins">🪙 {profile.coins || 0}</span>
      <span className={`progress-badge__streak ${streak ? "" : "progress-badge__streak--off"}`} title="Study streak (days in a row)">
        🔥 {streak}
      </span>
    </div>
  );
}
