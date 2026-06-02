import { useState } from "react";
import WelcomePage from "./WelcomePage";
import MainApp from "./MainApp";

export default function App() {
  const [started, setStarted] = useState(false);

  const [character, setCharacter] = useState(() => {
    return localStorage.getItem("character") || null;
  });

  const handleSelectCharacter = (char) => {
    setCharacter(char);
    localStorage.setItem("character", char);
    setStarted(true);
  };

  return !started ? (
    <WelcomePage onStart={handleSelectCharacter} />
  ) : (
    <MainApp avatar={character} />
  );
}