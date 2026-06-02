import { useState } from "react";
import "./Welcome.css";

export default function WelcomePage({ onStart }) {
  const [selected, setSelected] = useState(null);

  const handleStart = () => {
    onStart(selected); // "boy" or "girl"
  };

  return (
    <div className="welcome-screen">

      <div className="welcome-bg-text">
        Hi! Welcome to StudentLife
      </div>

      <div className="character-box">

        <div className="box-subtitle">
          Choose your character!
        </div>

        <div className="character-row">

          <div
            className={`character-card ${selected === "girl" ? "active" : ""}`}
            onClick={() => setSelected("girl")}
          >
            <img src="/image/girl.png" alt="girl" />
          </div>

          <div
            className={`character-card ${selected === "boy" ? "active" : ""}`}
            onClick={() => setSelected("boy")}
          >
            <img src="/image/boy.png" alt="boy" />
          </div>

        </div>

        <button
          className="start-btn"
          disabled={!selected}
          onClick={handleStart}
        >
          Start
        </button>

      </div>
    </div>
  );
}