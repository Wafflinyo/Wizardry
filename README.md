# Wizardry — Elemental Battle Prototype v0.20.0

Play: https://wafflinyo.github.io/Wizardry/?v=0.20.0

## Poseidon: expanded from five poses to a 29-frame playback sequence

The same **five user-approved, chunky low-poly Poseidon illustrations** are preserved without redrawing. They remain the animation's principal source: Idle, Windup A, Windup B, Throw, and empty-handed Hold.

Version 0.20 adds actual new frames generated **once from those five illustrations when the page loads**, then cached as 360 × 330 Canvas images. The battlefield no longer tries to fake rising and sinking by repeatedly sliding the identical full-body sprite below its edge.

**Animation breakdown:**

| Frames | Animation | Details |
| --- | --- | --- |
| 0–5 | Rising through water | Six separate frames gradually reveal Poseidon above a fixed waterline |
| 6 | Original Idle | Approved full-body idle pose |
| 7–9 | Idle → Windup A | Three intermediate poses; only one right-hand trident is rendered |
| 10 | Original Windup A | Approved arm-drawback key |
| 11–13 | Windup A → Windup B | Three intermediate arm-lift/windup poses |
| 14 | Original Windup B | Approved overhead windup key |
| 15–16 | Release anticipation | Two short armed in-betweens, still holding only one trident |
| 17 | Original Throw | Approved empty-handed forward throw; the projectile is now separate |
| 18–20 | Throw → Hold | Three intermediate recovery poses |
| 21 | Original Hold | Approved empty-handed hold through the impact pause |
| 22–28 | Sink through water | Seven individual unsummon frames, ending with water only |

**11 additional action in-betweens** are produced using geometric landmark matching and a smooth shape warp of **one source illustration at a time**. No frame crossfades two complete poses, preventing translucent double arms or duplicate tridents. The generated frames share an identical image box and fixed baseline, so they do not resize the battle canvas. The rise/sink frames reuse the approved sprite and parts of its original faceted water artwork rather than introducing another art style.

At displayed 1× speed, Poseidon retains his ~2.63-second spell. His trident departs on the launch frame, reaches the Sentinel on impact, and deducts exactly **1,200 HP**. The existing post-hit pause remains. The character and trident only animate inside the fixed-ratio Canvas scene.

### Source files

- `assets/poseidon-approved-five-v19.js` — original five user-approved transparent key sprites, unchanged.
- `assets/poseidon-inbetweens-v20.js` — constructs the 29 cached playback frames from those sprites, using matched facial, arm, weapon and wave landmarks.
- `game.js` — selects the appropriate Poseidon frame for the common spell clock; handles projectile, damage and effects.
- `assets/stone-golem-true-trace-v1.js` — unchanged in this update.
- `index.html` — updated asset loading order and version identifiers.
- `style.css` — unchanged; phone layout, card controls and fixed aspect ratio.

The 29-frame builder ran successfully in a simulated Canvas environment. At 60 Hz and 120 Hz, combat tests verified progression through rising, both windups, release, hold and sinking; **1,200 Poseidon damage, 900 Stone Golem damage**, and an unchanged 1000 × 560 battle buffer. The new frame sequence was also reviewed in a contact sheet/animated preview. Physical iPhone smoothness has not been verified.
