import { useState } from "react";
import PixelWindow from "./PixelWindow";
import AvatarPicker from "./AvatarPicker";
import "./Welcome.css";

export default function WelcomePage({ onStart }) {
  const [selected, setSelected] = useState("mei-uniform");
  const [accessory, setAccessory] = useState("none");
  const [saving, setSaving] = useState(false);

  const handleStart = async () => {
    setSaving(true);
    try {
      await onStart(selected, accessory); // e.g. "mei-uniform", "crown"
    } catch {
      setSaving(false);
    }
  };

  return (
    <div className="welcome-screen">
      <PixelWindow>
        <div className="window-heading">Choose your avatar!</div>
        <AvatarPicker
          value={selected}
          onChange={setSelected}
          accessory={accessory}
          onAccessoryChange={setAccessory}
        />
        <div className="window-text">You can change this later in Edit profile.</div>
        <button className="pixel-btn" disabled={saving} onClick={handleStart}>
          {saving ? "Saving..." : "Start"}
        </button>
      </PixelWindow>
    </div>
  );
}
