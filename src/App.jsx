import { useEffect, useState } from "react";
import { deleteUser, onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import { deleteUserData, ensureProfile, saveProfile } from "./db";
import LoginPage from "./LoginPage";
import WelcomePage from "./WelcomePage";
import MainApp from "./MainApp";
import PixelWindow from "./PixelWindow";
import "./Welcome.css";

export default function App() {
  // status: "loading" | "signedOut" | "ready" | "error"
  const [session, setSession] = useState({ status: "loading", user: null, profile: null });

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setSession({ status: "signedOut", user: null, profile: null });
        return;
      }
      setSession({ status: "loading", user: null, profile: null });
      try {
        const profile = await ensureProfile(user);
        setSession({ status: "ready", user, profile });
      } catch (err) {
        console.error("Could not load profile", err);
        setSession({ status: "error", user, profile: null });
      }
    });
  }, []);

  const handleSelectCharacter = async (character, avatarAccessory = "none") => {
    const { user, profile } = session;
    await saveProfile(user.uid, { character, avatarAccessory });
    setSession({ status: "ready", user, profile: { ...profile, character, avatarAccessory } });
  };

  // Updates the screen right away, then saves to Firestore.
  const handleUpdateProfile = (changes) => {
    setSession(s => ({ ...s, profile: { ...s.profile, ...changes } }));
    return saveProfile(session.user.uid, changes);
  };

  const handleSignOut = async () => {
    const user = session.user;
    // A guest can never sign back into the same account, so clean up their
    // data and account instead of leaving them behind in Firebase.
    if (user?.isAnonymous) {
      const ok = window.confirm("You're signed in as a guest. Logging out deletes your data. Continue?");
      if (!ok) return;
      try {
        await deleteUserData(user.uid);
        await deleteUser(user); // also signs out
        return;
      } catch (err) {
        console.error("Guest cleanup failed", err);
      }
    }
    await signOut(auth);
  };

  if (session.status === "loading") {
    return (
      <div className="welcome-screen">
        <PixelWindow>
          <div className="window-heading">Loading...</div>
        </PixelWindow>
      </div>
    );
  }

  if (session.status === "signedOut") return <LoginPage />;

  if (session.status === "error") {
    return (
      <div className="welcome-screen">
        <PixelWindow>
          <div className="window-heading">Couldn't load your data</div>
          <div className="window-text">Check your connection and try again.</div>
          <button className="pixel-btn" onClick={() => window.location.reload()}>Retry</button>
          <button className="pixel-btn pixel-btn--light" onClick={() => signOut(auth)}>Log out</button>
        </PixelWindow>
      </div>
    );
  }

  if (!session.profile.character) {
    return <WelcomePage onStart={handleSelectCharacter} />;
  }

  return (
    <MainApp
      uid={session.user.uid}
      profile={session.profile}
      onSignOut={handleSignOut}
      onUpdateProfile={handleUpdateProfile}
    />
  );
}
