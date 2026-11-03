import "./Welcome.css";

/* Blue-framed pixel window with the green "StudentLife" title bar. */
export default function PixelWindow({ title = "StudentLife", className = "", children }) {
  return (
    <div className={`pixel-window ${className}`}>
      <div className="pixel-window__bar">
        <div className="pixel-dots" aria-hidden="true">
          <span className="pixel-dot" />
          <span className="pixel-dot" />
          <span className="pixel-dot" />
        </div>
        <div className="pixel-window__title">{title}</div>
      </div>
      <div className="pixel-window__body">{children}</div>
    </div>
  );
}
