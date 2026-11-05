import { useEffect, useState } from "react";
import PixelWindow from "./PixelWindow";
import { PET_TYPES, PetSprite } from "./Pet";
import AvatarPicker from "./AvatarPicker";
import { avatarId, parseAvatar } from "./avatars";

/* Progress that belongs to the current pet and is wiped when switching buddy. */
export const PET_RESET = { xp: 0, coins: 0, owned: [], equipped: {}, petLove: 0 };

/*
 * Centered modal to edit the character (female/male), display name and pet.
 * Changing the pet type resets XP, coins and every Wardrobe purchase,
 * so it asks for confirmation first.
 */
export default function ProfileEditor({ profile, onSave, onClose }) {
  const pet = profile.pet;
  const [character, setCharacter] = useState(() => {
    const { person, outfit } = parseAvatar(profile.character);
    return avatarId(person, outfit);
  });
  const [accessory, setAccessory] = useState(profile.avatarAccessory || "none");
  const [name, setName] = useState(profile.displayName || "");
  const [petName, setPetName] = useState(pet?.name || "");
  const [petType, setPetType] = useState(pet?.type || "cat");
  const [confirming, setConfirming] = useState(false);

  const petChanged = !!pet && petType !== pet.type;

  useEffect(() => {
    const onKey = e => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const save = () => {
    const changes = {
      character,
      avatarAccessory: accessory,
      displayName: name.trim() || profile.displayName || "Student",
    };
    if (pet) {
      changes.pet = { type: petType, name: petName.trim() || PET_TYPES[petType].label };
      if (petChanged) Object.assign(changes, PET_RESET);
    }
    onSave(changes, petChanged);
  };

  const submit = e => {
    e.preventDefault();
    if (petChanged && !confirming) {
      setConfirming(true);
      return;
    }
    save();
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal--profile" role="dialog" aria-label="Edit profile">
        <PixelWindow title="Edit profile">
          {confirming ? (
            <div className="profile-confirm">
              <div className="profile-warning">
                ⚠️ Switching your buddy to a <b>{PET_TYPES[petType].label.toLowerCase()}</b> resets
                everything to zero: your <b>level/XP</b>, <b>coins</b> and <b>all Wardrobe items you bought</b>.
                This can't be undone.
              </div>
              <div className="profile-actions">
                <button type="button" className="pixel-btn pixel-btn--light" onClick={() => setConfirming(false)}>
                  Go back
                </button>
                <button type="button" className="pixel-btn pixel-btn--danger" onClick={save} autoFocus>
                  Reset & switch
                </button>
              </div>
            </div>
          ) : (
            <form className="profile-form" onSubmit={submit}>
              <div className="profile-label">Avatar</div>
              <AvatarPicker
                value={character}
                onChange={setCharacter}
                accessory={accessory}
                onAccessoryChange={setAccessory}
              />

              <label className="profile-label" htmlFor="profile-name">Your name</label>
              <input
                id="profile-name"
                className="form-input"
                maxLength={30}
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
              />

              {pet ? (
                <>
                  <label className="profile-label" htmlFor="profile-pet-name">Pet name</label>
                  <input
                    id="profile-pet-name"
                    className="form-input"
                    maxLength={14}
                    value={petName}
                    onChange={e => setPetName(e.target.value)}
                    placeholder={PET_TYPES[petType].label}
                  />

                  <div className="profile-label">Pet buddy</div>
                  <div className="profile-row">
                    {Object.entries(PET_TYPES).map(([id, p]) => (
                      <button
                        key={id}
                        type="button"
                        className={`character-card adopt__card ${petType === id ? "active" : ""}`}
                        onClick={() => setPetType(id)}
                        aria-pressed={petType === id}
                        aria-label={p.label}
                      >
                        <PetSprite type={id} size={72} />
                      </button>
                    ))}
                  </div>
                  {petChanged && (
                    <div className="profile-warning">
                      ⚠️ Changing your pet buddy resets your XP, coins and all bought items to zero.
                    </div>
                  )}
                </>
              ) : (
                <div className="window-text profile-hint">Adopt a study buddy on the Focus page to name it here.</div>
              )}

              <div className="profile-actions">
                <button type="button" className="pixel-btn pixel-btn--light" onClick={onClose}>Cancel</button>
                <button type="submit" className="pixel-btn">Save</button>
              </div>
            </form>
          )}
        </PixelWindow>
      </div>
    </div>
  );
}
