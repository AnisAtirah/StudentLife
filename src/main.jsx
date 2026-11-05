import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./App.css";
import App from "./App.jsx";

// Firebase sign-in is authorized for "localhost" but not "127.0.0.1" (they count as
// different domains). The dev server prints 127.0.0.1 for Spotify's sake, so if the
// app is opened there, move to the same page on localhost. (Spotify's return page,
// public/spotify-callback.html, is a separate file and stays on 127.0.0.1.)
if (window.location.hostname === "127.0.0.1") {
  const url = new URL(window.location.href);
  url.hostname = "localhost";
  window.location.replace(url.href);
} else {
  createRoot(document.getElementById("root")).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
