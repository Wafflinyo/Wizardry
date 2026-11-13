# Wizardry — Spellcasting Battle Prototype v0.6.0

**Live game:** https://wafflinyo.github.io/Wizardry/

Playable, mobile-friendly fantasy spellcasting prototype featuring two selectable summoning spells, one 3,000-HP Stone Sentinel target, and a no-scroll mobile layout.

## Spells

| Card | School | Cost | Damage | Attack |
| --- | --- | ---: | ---: | --- |
| Poseidon's Wrath | Water | 8 mana | 1,200 | Poseidon rises within a wave and throws a trident |
| Stone Golem | Earth | 6 mana | 900 | Illustrated Stone Golem rises, clasps his hands, lifts overhead, slams the arena and sends traveling spikes into the Sentinel |

Mana replenishes between test rounds; damage is applied on projectile/impact frames, not when the Cast button is pressed. Mix spells in one duel or restart after victory.

## Illustrated Stone Golem animation — v0.6

**This is no longer the manually drawn polygon creature.** The actual game renders the 12 illustrated animation frames created for Stone Golem.

- **Asset:** `assets/stone-golem-groundslam.webp` (480 × 640, 3 columns × 4 rows, 160 × 160 per frame, approximately 65 KB).
- **Frames 0–3:** relaxed pose and clasping stone hands.
- **Frames 3–6:** raising the clasped hands high above the head.
- **Frames 6–8:** fast overhead-to-ground slam.
- **Frames 8–11:** spike wave emerging from the slam.
- **Return:** brief illustrated recovery, then the resting sprite sinks beneath the arena.

**Key spell times are in animation-clock seconds** (the default game clock advances at 1.5×):

| Clock | Action |
| --- | --- |
| 0.10–1.06 s | Stone Golem rises fully into view |
| 1.09–1.40 s | Hands clasp |
| 1.40–2.33 s | Fists lift overhead |
| 2.33–2.54 s | Dramatic cartoon-style hold |
| 2.54–2.92 s | Ground slam |
| 2.92–3.67 s | Eleven ground spikes advance across the arena |
| **3.67 s** | Final spike impacts the Sentinel: **−900 HP** |
| 4.02–4.27 s | Illustrated recovery |
| 4.27–5.09 s | Sprite sinks smoothly below the arena floor |
| 5.26 s | Cast completes and mana refills |

The illustrated asset is preloaded in the HTML. When the Earth card is chosen, the Cast button waits until the image has loaded. The Earth card preview uses the same illustration so it matches the in-game appearance. The traveling spikes and impact are Canvas effects timed independently of the character's sprite frames.

### Animation stability and performance

The scene and foreground are cached into separate off-screen canvases instead of rebuilding the scenery each frame. Phones use a reduced internal canvas pixel ratio and rendering is capped around 60 FPS on high-refresh displays. The Earth spell has no camera shake. The sprite atlas is small and avoids per-frame generation of dozens of character polygons.

Automated simulated playback at **60 and 120 Hz** confirmed that the full 12-frame sequence renders, the rising and sinking displacement is continuous, damage is delayed until the last traveling spike reaches the target, and both Earth/Water spells can be used in the same duel through victory and reset. These tests do not replace testing on a physical iPhone.

## Files

- `index.html`: game UI, two cards, sprite preload.
- `style.css`: responsive UI and illustrated Earth card preview.
- `game.js`: Canvas renderer, sprite timeline, projectile and damage logic.
- `assets/stone-golem-groundslam.webp`: illustrated animation sprite atlas.

This remains an experimental prototype, not a finished campaign or multiplayer game.
