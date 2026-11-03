import { useState } from "react";
import PixelWindow from "./PixelWindow";
import "./Welcome.css";

const CHARACTERS = [
  { id: "girl", src: "/image/girl.png" },
  { id: "boy", src: "/image/boy.png" },
];

export default function WelcomePage({ onStart }) {
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleStart = async () => {
    setSaving(true);
    try {
      await onStart(selected); // "boy" or "girl"
    } catch {
      setSaving(false);
    }
  };

  return (
    <div className="welcome-screen">
      <PixelWindow>
        <div className="window-heading">Choose your character!</div>

        <div className="character-row">
          {CHARACTERS.map(c => (
            <button
              key={c.id}
              type="button"
              className={`character-card ${selected === c.id ? "active" : ""}`}
              onClick={() => setSelected(c.id)}
              aria-pressed={selected === c.id}
              aria-label={c.id}
            >
              <img src={c.src} alt="" />
            </button>
          ))}
        </div>

        <button
          className="pixel-btn"
          disabled={!selected || saving}
          onClick={handleStart}
        >
          {saving ? "Saving..." : "Start"}
        </button>
      </PixelWindow>
    </div>
  );
}
