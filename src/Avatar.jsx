import { accessorySrc, avatarSrc } from "./avatars";

/*
 * The user's avatar with its accessory layered on top.
 * Styles are inline so it also works inside the pop-out timer window.
 */
export default function Avatar({ character, accessory, size, className = "", alt = "" }) {
  const acc = accessorySrc(character, accessory);
  const img = { display: "block", width: "100%", imageRendering: "pixelated" };
  return (
    <span
      className={className}
      style={{ position: "relative", display: "inline-block", lineHeight: 0, ...(size ? { width: size } : {}) }}
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
    >
      <img src={avatarSrc(character)} alt="" style={img} />
      {acc && <img src={acc} alt="" style={{ ...img, position: "absolute", inset: 0 }} />}
    </span>
  );
}
