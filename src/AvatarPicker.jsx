import Avatar from "./Avatar";
import { ACCESSORIES, OUTFITS, PEOPLE, avatarId, parseAvatar } from "./avatars";

/*
 * Female/Male tabs, then a character, an outfit and an accessory, with a big preview.
 * value / onChange use the full avatar id, e.g. "mei-uniform";
 * accessory / onAccessoryChange use an accessory id, e.g. "crown".
 */
export default function AvatarPicker({ value, onChange, accessory = "none", onAccessoryChange }) {
  const { person, outfit } = parseAvatar(value);
  const current = avatarId(person, outfit);
  const gender = PEOPLE.find(p => p.id === person).gender;
  const people = PEOPLE.filter(p => p.gender === gender);

  const pickGender = g => {
    if (g === gender) return;
    onChange(avatarId(PEOPLE.find(p => p.gender === g).id, outfit));
  };

  return (
    <div className="avatar-picker">
      <div className="avatar-picker__preview">
        <Avatar character={current} accessory={accessory} size={120} alt="Your avatar" />
      </div>

      <div className="avatar-picker__tabs" role="group" aria-label="Gender">
        {[["female", "Female"], ["male", "Male"]].map(([g, label]) => (
          <button
            key={g}
            type="button"
            className={`avatar-tab ${gender === g ? "active" : ""}`}
            onClick={() => pickGender(g)}
            aria-pressed={gender === g}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="avatar-picker__label">Character</div>
      <div className="avatar-picker__row">
        {people.map(p => (
          <button
            key={p.id}
            type="button"
            className={`avatar-chip ${person === p.id ? "active" : ""}`}
            onClick={() => onChange(avatarId(p.id, outfit))}
            aria-pressed={person === p.id}
          >
            <Avatar character={avatarId(p.id, outfit)} size={60} />
            <span>{p.name}</span>
          </button>
        ))}
      </div>

      <div className="avatar-picker__label">Outfit</div>
      <div className="avatar-picker__row">
        {OUTFITS.map(o => (
          <button
            key={o.id}
            type="button"
            className={`avatar-chip avatar-chip--small ${outfit === o.id ? "active" : ""}`}
            onClick={() => onChange(avatarId(person, o.id))}
            aria-pressed={outfit === o.id}
          >
            <Avatar character={avatarId(person, o.id)} size={44} />
            <span>{o.name}</span>
          </button>
        ))}
      </div>

      {onAccessoryChange && (
        <>
          <div className="avatar-picker__label">Accessory</div>
          <div className="avatar-picker__row">
            {ACCESSORIES.map(a => (
              <button
                key={a.id}
                type="button"
                className={`avatar-chip avatar-chip--small ${accessory === a.id ? "active" : ""}`}
                onClick={() => onAccessoryChange(a.id)}
                aria-pressed={accessory === a.id}
              >
                <Avatar character={current} accessory={a.id} size={44} />
                <span>{a.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
