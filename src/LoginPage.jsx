import { useState } from "react";
import { signInAnonymously, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "./firebase";
import PixelWindow from "./PixelWindow";
import "./Welcome.css";

const ERROR_MESSAGES = {
  "auth/operation-not-allowed":
    "This sign-in method is not turned on in Firebase yet.",
  "auth/unauthorized-domain":
    "This website's domain is not authorized in Firebase Auth settings.",
  "auth/popup-blocked": "Your browser blocked the sign-in popup. Allow popups and try again.",
  "auth/network-request-failed": "No internet connection. Try again.",
};

export default function LoginPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const run = async (signIn) => {
    setBusy(true);
    setError("");
    try {
      await signIn();
      // App.jsx notices the new user and moves on; nothing else to do here.
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user" && err.code !== "auth/cancelled-popup-request") {
        setError(ERROR_MESSAGES[err.code] || "Sign-in failed. Please try again.");
      }
      setBusy(false);
    }
  };

  return (
    <div className="welcome-screen">
      <h1 className="welcome-title">Hi ! Welcome to StudentLife,</h1>

      <PixelWindow>
        <div className="window-heading">Sign in to start!</div>
        <div className="window-text">Your tasks and courses are saved to your account.</div>

        {error && <div className="login-error">{error}</div>}

        <button
          className="pixel-btn"
          disabled={busy}
          onClick={() => run(() => signInWithPopup(auth, googleProvider))}
        >
          Sign in with Google
        </button>

        <button
          className="pixel-btn pixel-btn--light"
          disabled={busy}
          onClick={() => run(() => signInAnonymously(auth))}
        >
          Try as guest
        </button>

        <div className="login-note">Guests get sample data. It is deleted when you log out.</div>
      </PixelWindow>
    </div>
  );
}
