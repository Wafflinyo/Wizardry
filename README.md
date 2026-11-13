# Wizardry — Elemental Battle Prototype v0.17.0

## v0.17 animation continuity repairs

**Poseidon:** The old windup frame that still depicted the opposite-hand
trident is excluded from playback. His raised-trident pose keeps the weapon
in the same (right) hand until release, at which instant the illustrated pose
switches to an empty-hand follow-through and the projectile becomes the
**only** trident drawn. An opaque sea-and-torso backing is painted behind
the traced detail with `destination-over`, filling accidental transparent
body/wave gaps without covering the original character artwork. This underlay
is built once into cached traced frames and used by the vector fallback.

**Stone Golem:** The advancing spikes finish, then the original frame
transitions through two eased, overlapping recovery phases into the
hands-down pose (frame 1 of the approved animation). It pauses visibly
before the hands-down character sinks below the arena. No instantaneous
snap back to the original first pose.

Both spells retain their approximately 2.6–2.8-second normal casts,
with Stone Golem slightly slower than Poseidon. Damage remains 1,200 Water
and 900 Earth, respectively. Neither cast displays narration for individual
animation phases. The battle canvas backing buffer remains fixed.


Play: https://wafflinyo.github.io/Wizardry/

A mobile-friendly Canvas 2D spellcasting card-game prototype featuring Poseidon's Wrath (Water, 1,200 damage) and Stone Golem (Earth, 900 damage).

## v0.16 animation updates

Both summons run a little faster at displayed 1× speed:

| Spell | Previous duration | New duration | Impact behavior |
| --- | ---: | ---: | --- |
| Poseidon's Wrath | ~2.98 seconds | **~2.63 seconds** | A trident launches from the same screen-right throwing hand; 1,200 damage at target impact |
| Stone Golem | ~3.16 seconds | **~2.78 seconds** | Stone spike damage lands at the last traveling-spike impact, then the effect clears |

### Poseidon: right-handed trident and opaque artwork

The corrected traced frame asset is `assets/poseidon-approved-trace-v3.js`. The character remains a **Canvas Path2D low-poly trace**, cached at game startup for smooth display, with the alpha gaps repaired in the source art.

- The trident stays in Poseidon's **screen-right throwing hand** through summoning, aiming, and winding.
- The former windup poses that put the trident on the opposite side have been replaced with corrected right-handed tracings.
- The pre-release flying trident frame is held back until the actual launch timestamp.
- On release, the separate moving trident starts at the throwing wrist and rotates outward as it travels toward the Stone Sentinel.
- The character stays visible after the 1,200 damage lands for approximately **0.61 seconds** before sinking into the sea.

### Stone Golem: attack clears before idle and unsummoning

The Golem uses the original twelve approved low-poly source traces at `assets/stone-golem-true-trace-v1.js` rather than the old procedural polygon model.

1. Rise from the earth
2. Clasp both stone fists and lift them overhead
3. Slam the ground; the stone spikes travel to the Sentinel
4. Apply 900 damage on impact; let the spikes finish and disappear
5. Recover to the **full, hands-down standing idle pose** and remain idle for about **0.49 seconds**
6. Sink the idle character smoothly below the arena floor, then disappear

The original spike art plays only once. The hit indicator is separate from the spike artwork. Stone Golem is intentionally a little slower than Poseidon.

## Rendering and interface

Everything inside the battlefield uses **Canvas 2D**, including the character animations, spells, HP bars, mana, effects, and victory graphics. CSS controls the cards, buttons, and responsive outer layout; it does not animate the characters. Stage-by-stage narration is not shown over the battle (accessible status messages remain for screen readers).

The arena has a permanently sized **1000×560** canvas backing buffer and an aspect-locked responsive CSS wrapper. Static scenery is cached. Poseidon and Golem frames are cached from the vector traces, with direct Canvas vector fallback.

## Testing

Mock Canvas simulation tests at 60 Hz and 120 Hz passed for Earth and Water damage timing, Golem's spike → recovery → idle → sink frames, Poseidon's right-handed pre-release frame selection, complete casts, and follow-up rounds. Actual phone hardware still needs visual verification.
