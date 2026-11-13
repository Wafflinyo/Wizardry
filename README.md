# Wizardry — Elemental Battle Prototype v0.18.0

## v0.18 — Poseidon-only continuity and opacity repair

- **The windup is visible again.** Instead of holding frame 4 throughout the cast, the game now plays three distinct right-handed windup poses (frames 4, 5 and 6). They are rebuilt once at startup from Poseidon's approved single-trident right-handed idle art: his upper body, right hand and the held trident lean progressively backward together while the ocean base stays anchored. The old erroneous double-trident windup frames are never rendered.
- **The trident doesn't jump between hands.** It stays in Poseidon's screen-right hand up to the launch timestamp; then his illustrated hand is empty and the independent projectile begins at the final right-hand grip around battle coordinate (568, 217), rather than appearing at (644, 211).
- **Opaque body/wave repair.** When the approved trace is cached, the game adds a continuous water-and-skin backing and scans the alpha channel to fill enclosed transparent holes and small open cracks in the body, beard, and ocean core. This runs once at startup, not every game frame; exterior background transparency is kept.
- **Timing unchanged:** Poseidon takes about **2.63 seconds** at displayed 1×; impact deals 1,200 Water damage, followed by roughly 0.61 seconds before unsummoning. No extra on-screen stage-by-stage narration.
- **Stone Golem is unchanged** in this release.

The runtime retains the approved traced vector look and Canvas 2D renderer. It does not depend on CSS character animation.

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
