# Wizardry — Elemental Battle Prototype v0.15.0

**Play:** https://wafflinyo.github.io/Wizardry/

Mobile-friendly browser game with two elemental spell cards, a fixed-ratio Canvas 2D battlefield and the 3,000-HP Stone Sentinel.

## Two spell animations

| Spell | Cost | Damage | UI 1× duration |
| --- | ---: | ---: | ---: |
| Poseidon's Wrath (Water) | 8 mana | 1,200 | **2.98 seconds** |
| Stone Golem (Earth) | 6 mana | 900 | **3.16 seconds** |

Mana replenishes each prototype round. Both spells use synchronized frame-animation clocks; target damage occurs only at the registered hit time.

### Poseidon's Wrath — approved 12-frame illustrated trace

**v0.15 uses the approved image with the large white beard, angular gold crown, teal wave body and glowing trident.** Its twelve actual 4×3 sheet cells were retraced into **224×224 low-poly vector paths with an 18-color palette per frame**, not redrawn as the previous generic Canvas figure.

The original approved character sequence is preserved: summoning wave → rising Poseidon → fully summoned idle → aiming → windup → full trident throw → follow-through → post-hit idle → unsummoning back into the wave.

| Game-clock time | Poseidon action |
| --- | --- |
| 0.04–0.70 | Whirlpool forms and Poseidon rises |
| 0.70–1.19 | Fully summoned idle/aim |
| 1.19–2.14 | Winding up his trident |
| 2.14 | Trident leaves his hand and travels independently |
| **2.45** | Trident strikes the Sentinel; **1,200 HP damage** |
| 2.45–3.48 | Poseidon remains visible after impact (about **0.69 real seconds**) |
| 3.48–4.47 | He sinks into the collapsing wave |
| 4.47 | Water spell completes |

The exact 12-frame trace is in `assets/poseidon-approved-trace-v2.js`. Its compressed vector paths are decompressed once when the page starts, then cached at 480×480 Canvas pixels per frame; the original paths are available for direct rendering if caching fails. The card artwork uses the traced third frame as SVG.

### Stone Golem — same visual pipeline

The previously approved Golem still uses 12 traced low-poly frames, with interlocked fists, a raised overhead slam, and stone spikes traveling to the Sentinel. Its game-clock hit occurs at 3.67, and its full spell is approximately **0.18 seconds slower** than Poseidon at the displayed 1× rate.

The Golem compares cached high-resolution vector frames against direct Path2D drawing on startup and chooses the faster rendering mode.

## No on-screen frame narration

The battlefield shows the player and Sentinel's HP/mana, the round counter, the spell animation, and impact numbers. It **does not show a text explanation for each individual frame, attack phase or pose**. A visually hidden status mirror remains available to screen readers.

## Responsive game engine

- Canvas 2D handles **all artwork and combat HUD**, including spell effects, health, mana and victory display.
- CSS handles the outer spell cards, buttons and responsive page layout.
- The Canvas drawing buffer is fixed at **1000×560**; CSS maintains the **1000:560 arena ratio** in portrait and landscape.
- The app avoids repeated Canvas resize observers, and mobile rendering work is capped around 60fps.
- Background scenery is cached separately; neither character shares the old procedural Earth spikes.

## Files

- `index.html` — spell selection, outer controls and accessible status mirror.
- `style.css` — responsive spell cards and fixed-ratio battlefield layout.
- `game.js` — game timing, Canvas 2D battle, both spells, HUD and damage.
- `assets/stone-golem-true-trace-v1.js` — approved 12-frame Earth trace.
- `assets/poseidon-approved-trace-v2.js` — approved 12-frame higher-fidelity Water trace.

Simulated 60 Hz and 120 Hz checks passed for loading Poseidon's traced artwork, frame timing, both spells' impact damage, mana restoration and a single Canvas buffer initialization. Actual-device performance and visuals should still be checked in mobile Safari.
