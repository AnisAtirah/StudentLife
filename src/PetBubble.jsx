import { TALK_LABELS } from "./petTalk";

/* Speech bubble for the pet's motivation, fun facts and tips. Click for a new line. */
export default function PetBubble({ talk, className = "" }) {
  if (!talk?.line) return null;
  const { kind, text } = talk.line;
  return (
    <button
      type="button"
      className={`pet-bubble pet-bubble--${kind} ${className}`}
      onClick={talk.next}
      title="Click for another one"
      aria-live="polite"
    >
      {TALK_LABELS[kind] && <span className="pet-bubble__label">{TALK_LABELS[kind]}</span>}
      <span key={text} className="pet-bubble__text">{text}</span>
    </button>
  );
}
