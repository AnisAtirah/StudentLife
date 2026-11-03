/*
 * Spotify mini player used on the Focus page, the floating mini timer and the
 * pop-out window. `spotify` comes from useSpotify() in MainApp, so every view
 * shows the same song and controls.
 *   size: "full" (Focus page) | "compact" (pop-out) | "mini" (floating timer)
 */
export default function SpotifyPlayer({ spotify, size = "full" }) {
  if (!spotify.configured) {
    return size === "full" ? (
      <div className="spotify spotify--setup">
        🎵 Spotify isn't set up yet. Add <code>VITE_SPOTIFY_CLIENT_ID</code> to <code>.env.local</code> (see the setup notes).
      </div>
    ) : null;
  }

  if (!spotify.connected) {
    if (size === "mini") return null;
    // The login popup must open from the main page, so point there from the pop-out
    if (size === "compact") {
      return <div className="spotify spotify--compact spotify__hint"><SpotifyIcon /> Connect Spotify on the Focus page</div>;
    }
    return (
      <div className={`spotify spotify--${size}`}>
        <button className="spotify-connect" onClick={spotify.connect}>
          <SpotifyIcon /> Connect Spotify
        </button>
        {spotify.error && <div className="spotify__error">{spotify.error}</div>}
      </div>
    );
  }

  const { player, playlists, busy } = spotify;
  const track = player?.track;

  return (
    <div className={`spotify spotify--${size}`}>
      <div className="spotify__now">
        {track?.art ? (
          <img className="spotify__art" src={track.art} alt="" />
        ) : (
          <span className="spotify__art spotify__art--empty"><SpotifyIcon /></span>
        )}
        <div className="spotify__meta">
          {track ? (
            <>
              <a className="spotify__title" href={track.url} target="_blank" rel="noreferrer" title={track.name}>
                {track.name}
              </a>
              <span className="spotify__artist" title={track.artists}>{track.artists}</span>
            </>
          ) : (
            <span className="spotify__artist">Nothing playing. Pick a playlist ▶</span>
          )}
        </div>
      </div>

      <div className="spotify__controls">
        <button onClick={spotify.previous} disabled={busy} aria-label="Previous song" title="Previous">⏮</button>
        <button
          className="spotify__play"
          onClick={spotify.togglePlay}
          disabled={busy}
          aria-label={player?.isPlaying ? "Pause music" : "Play music"}
          title={player?.isPlaying ? "Pause" : "Play"}
        >
          {player?.isPlaying ? "⏸" : "▶"}
        </button>
        <button onClick={spotify.next} disabled={busy} aria-label="Next song" title="Next">⏭</button>
      </div>

      {size !== "mini" && playlists.length > 0 && (
        <select
          className="form-select spotify__playlist"
          value={playlists.some(p => p.uri === player?.contextUri) ? player.contextUri : ""}
          onChange={e => e.target.value && spotify.playPlaylist(e.target.value)}
          aria-label="Choose a playlist"
        >
          <option value="">🎶 Choose a playlist…</option>
          {playlists.map(p => <option key={p.id} value={p.uri}>{p.name}</option>)}
        </select>
      )}

      {spotify.error && (
        <button className="spotify__error" onClick={spotify.clearError} title="Dismiss">{spotify.error}</button>
      )}

      {size === "full" && (
        <div className="spotify__footer">
          {player?.device && <span>Playing on {player.device}</span>}
          <button className="spotify__disconnect" onClick={spotify.disconnect}>Disconnect</button>
        </div>
      )}
    </div>
  );
}

function SpotifyIcon() {
  return (
    <svg className="spotify-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <circle cx="12" cy="12" r="12" fill="#1ed760" />
      <path d="M6.5 9.2c3.8-1.1 8.2-.7 11.2 1M7 12.4c3.1-.9 6.7-.5 9.2.9M7.6 15.4c2.5-.6 5.2-.3 7.2.8"
        stroke="#121212" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}
