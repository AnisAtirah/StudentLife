import { useCallback, useEffect, useRef, useState } from "react";

/*
 * Spotify Web API with "Authorization Code + PKCE": a secure login that needs
 * no server or secret, only the app's Client ID. Playback controls need Premium.
 *
 * Setup: create an app at https://developer.spotify.com/dashboard, then put its
 * Client ID in .env.local as VITE_SPOTIFY_CLIENT_ID (and in Vercel's env vars).
 */

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const TOKEN_KEY = "studentlife.spotify";
const PKCE_KEY = "studentlife.spotify.pkce";
const API = "https://api.spotify.com/v1";
const SCOPES = [
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
  "playlist-read-private",
  "playlist-read-collaborative",
].join(" ");

export const spotifyConfigured = Boolean(CLIENT_ID);

/* Spotify doesn't accept "localhost" redirects, only the loopback IP. */
export function redirectUri() {
  const url = new URL("/spotify-callback.html", window.location.origin);
  if (url.hostname === "localhost") url.hostname = "127.0.0.1";
  return url.href;
}

function randomString(length) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, b => chars[b % chars.length]).join("");
}

async function pkceChallenge(verifier) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/* ── Tokens (kept in this browser only) ── */
function loadTokens() {
  try {
    return JSON.parse(localStorage.getItem(TOKEN_KEY));
  } catch {
    return null;
  }
}

function saveTokens(t) {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, JSON.stringify(t));
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

async function tokenRequest(body) {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: CLIENT_ID, ...body }),
  });
  if (!res.ok) throw new SpotifyError(401, "Spotify login expired. Please connect again.");
  const data = await res.json();
  const prev = loadTokens();
  const tokens = {
    access_token: data.access_token,
    refresh_token: data.refresh_token || prev?.refresh_token,
    expires_at: Date.now() + (data.expires_in - 60) * 1000,
  };
  saveTokens(tokens);
  return tokens;
}

async function accessToken() {
  const t = loadTokens();
  if (!t) return null;
  if (Date.now() < t.expires_at) return t.access_token;
  return (await tokenRequest({ grant_type: "refresh_token", refresh_token: t.refresh_token })).access_token;
}

/*
 * Opens Spotify's login in a popup (so the timer and floating window keep running),
 * then swaps the returned code for tokens. Must be called from a click.
 */
export function connectSpotify() {
  // Open the popup right away, before any await, or browsers block it
  const popup = window.open("about:blank", "spotify-login", "width=480,height=720");
  if (!popup) return Promise.reject(new SpotifyError(0, "Your browser blocked the Spotify popup. Allow popups and try again."));

  const verifier = randomString(64);
  const state = `${randomString(16)}|${window.location.origin}`;
  const redirect = redirectUri();
  const expectedOrigin = new URL(redirect).origin;
  // Kept so the fallback path (login result arriving via the app's URL) can finish too
  try {
    localStorage.setItem(PKCE_KEY, JSON.stringify({ state, verifier, redirect }));
  } catch {
    // ignore
  }

  return new Promise((resolve, reject) => {
    let done = false;
    const finish = (fn, value) => {
      if (done) return;
      done = true;
      window.removeEventListener("message", onMessage);
      clearInterval(closedCheck);
      fn(value);
    };

    const onMessage = async ev => {
      if (ev.origin !== expectedOrigin || ev.data?.type !== "spotify-auth" || ev.data.state !== state) return;
      clearInterval(closedCheck); // the popup closes itself now; that's not a cancel
      if (ev.data.error || !ev.data.code) {
        finish(reject, new SpotifyError(0, ev.data.error === "access_denied" ? "Spotify connection was cancelled." : "Spotify login failed."));
        return;
      }
      try {
        await tokenRequest({ grant_type: "authorization_code", code: ev.data.code, redirect_uri: redirect, code_verifier: verifier });
        finish(resolve);
      } catch (err) {
        finish(reject, err);
      }
    };
    window.addEventListener("message", onMessage);

    const closedCheck = setInterval(() => {
      if (popup.closed) setTimeout(() => finish(reject, new SpotifyError(0, "")), 500);
    }, 500);

    pkceChallenge(verifier).then(challenge => {
      popup.location.href = "https://accounts.spotify.com/authorize?" + new URLSearchParams({
        client_id: CLIENT_ID,
        response_type: "code",
        redirect_uri: redirect,
        scope: SCOPES,
        state,
        code_challenge_method: "S256",
        code_challenge: challenge,
      });
    });
  });
}

/*
 * Fallback: if the login result came back in this page's address
 * (?spotify_code=...), finish connecting and clean the address bar.
 * Returns true if connected, false if nothing to do, or throws.
 */
export async function finishRedirectLogin() {
  const params = new URLSearchParams(window.location.search);
  const state = params.get("spotify_state");
  if (!state) return false;

  const clean = new URL(window.location.href);
  ["spotify_code", "spotify_error", "spotify_state"].forEach(k => clean.searchParams.delete(k));
  window.history.replaceState(null, "", clean.pathname + clean.search + clean.hash);

  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(PKCE_KEY));
    localStorage.removeItem(PKCE_KEY);
  } catch {
    // ignore
  }
  if (!saved || saved.state !== state || !params.get("spotify_code")) {
    throw new SpotifyError(0, params.get("spotify_error") === "access_denied" ? "Spotify connection was cancelled." : "Spotify login failed. Please try again.");
  }
  await tokenRequest({
    grant_type: "authorization_code",
    code: params.get("spotify_code"),
    redirect_uri: saved.redirect,
    code_verifier: saved.verifier,
  });
  return true;
}

export class SpotifyError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/* Friendly messages for Spotify's error codes. */
function explain(status, reason) {
  if (status === 401) return "Spotify login expired. Please connect again.";
  if (status === 403) return "Spotify Premium is needed to control playback.";
  if (status === 404 || reason === "NO_ACTIVE_DEVICE") return "Open Spotify on your laptop or phone (play any song once), then try again.";
  if (status === 429) return "Spotify is busy. Try again in a moment.";
  return "Something went wrong talking to Spotify.";
}

async function api(path, { method = "GET", body } = {}) {
  const token = await accessToken();
  if (!token) throw new SpotifyError(401, explain(401));
  const res = await fetch(API + path, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204 || res.status === 202) return null;
  const text = await res.text();
  // Spotify sometimes answers with plain text instead of JSON, so don't assume JSON
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) {
    // Apps in Development mode only work for Spotify accounts added under "User Management"
    if (res.status === 403 && /not be registered/i.test(text)) {
      throw new SpotifyError(403, "This Spotify account isn't allowed to use the app yet. Add its email under User Management in the Spotify Developer Dashboard, then connect again.");
    }
    throw new SpotifyError(res.status, explain(res.status, data?.error?.reason));
  }
  return data;
}

/* Turns Spotify's player response into what the UI needs. */
function toPlayer(data) {
  if (!data || !data.item) return data ? { isPlaying: data.is_playing, track: null, device: data.device?.name } : null;
  const item = data.item;
  return {
    isPlaying: data.is_playing,
    device: data.device?.name,
    contextUri: data.context?.uri || null,
    track: {
      name: item.name,
      artists: (item.artists || item.show && [item.show] || []).map(a => a.name).join(", "),
      art: (item.album?.images || item.images || []).slice(-2)[0]?.url,
      url: item.external_urls?.spotify,
    },
  };
}

/*
 * Everything the Spotify player UI needs. Polls the current song every 5s
 * while connected and the page is visible.
 */
export function useSpotify() {
  const [connected, setConnected] = useState(() => Boolean(loadTokens()));
  const [player, setPlayer] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const refreshTimer = useRef(null);

  const handleError = useCallback(err => {
    if (err.status === 401) {
      saveTokens(null);
      setConnected(false);
    }
    setError(err.message || "");
  }, []);

  // Finish a login that came back through the page address (fallback path)
  useEffect(() => {
    if (!spotifyConfigured) return;
    finishRedirectLogin()
      .then(ok => { if (ok) setConnected(true); })
      .catch(err => setError(err.message || ""));

    // Another tab/window (e.g. the login popup) connected or disconnected Spotify
    const onStorage = e => {
      if (e.key === TOKEN_KEY) setConnected(Boolean(e.newValue));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const refresh = useCallback(async () => {
    if (!loadTokens()) return;
    try {
      setPlayer(toPlayer(await api("/me/player")));
    } catch (err) {
      handleError(err);
    }
  }, [handleError]);

  // Re-check shortly after a command, since Spotify takes a moment to update
  const refreshSoon = useCallback(() => {
    clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(refresh, 600);
  }, [refresh]);

  useEffect(() => {
    if (!connected) return;
    refresh();
    api("/me/playlists?limit=50")
      .then(d => setPlaylists((d?.items || []).filter(Boolean).map(p => ({ id: p.id, name: p.name, uri: p.uri }))))
      .catch(handleError);
    const id = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, 5000);
    return () => {
      clearInterval(id);
      clearTimeout(refreshTimer.current);
    };
  }, [connected, refresh, handleError]);

  /* Runs a playback command; if no device is active, wakes up the first available one. */
  const command = useCallback(async (path, method, body) => {
    setBusy(true);
    setError("");
    try {
      try {
        await api(path, { method, body });
      } catch (err) {
        if (err.status !== 404) throw err;
        const { devices = [] } = (await api("/me/player/devices")) || {};
        const device = devices.find(d => !d.is_restricted);
        if (!device) throw err;
        const sep = path.includes("?") ? "&" : "?";
        await api(`${path}${sep}device_id=${device.id}`, { method, body });
      }
      refreshSoon();
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  }, [handleError, refreshSoon]);

  return {
    configured: spotifyConfigured,
    connected,
    player,
    playlists,
    error,
    busy,
    clearError: () => setError(""),
    connect: async () => {
      setError("");
      try {
        await connectSpotify();
        setConnected(true);
      } catch (err) {
        setError(err.message || "");
      }
    },
    disconnect: () => {
      saveTokens(null);
      setConnected(false);
      setPlayer(null);
      setPlaylists([]);
    },
    togglePlay: () => command(player?.isPlaying ? "/me/player/pause" : "/me/player/play", "PUT"),
    next: () => command("/me/player/next", "POST"),
    previous: () => command("/me/player/previous", "POST"),
    playPlaylist: uri => command("/me/player/play", "PUT", { context_uri: uri }),
  };
}
