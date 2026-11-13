# Wizardry — Spellcasting Battle Prototype v0.10.0

**Play:** https://wafflinyo.github.io/Wizardry/

Wizardry is a mobile-friendly card spellcasting prototype with two selectable spells, an enemy Stone Sentinel (3,000 HP), and a single-screen battle UI.

## Playable spells

| Card | Element | Mana | Damage | Effect |
| --- | --- | ---: | ---: | --- |
| Poseidon's Wrath | Water | 8 | 1,200 | Summon Poseidon, launch his trident, then unsummon |
| Stone Golem | Earth | 6 | 900 | Rise, clasp rocky fists, lift overhead, slam, and send stone spikes toward the target |

Mana refills after each round. Both spells can be used in one duel.

## Stone Golem: actual image contour tracing (v0.10)

Previous versions substituted an original polygon rig for the approved twelve-frame illustration. This version does not.

The **actual twelve approved image cells** have been individually processed into contour paths, retaining their real silhouettes, fist/arm poses, rubble, and spike shapes. A shared source-derived 23-color palette preserves the sharp faceted rock appearance. These paths are included as **native vector data** in assets/stone-golem-true-trace-v1.js (roughly 262 KB of path data).

On load, the game constructs Path2D shapes and renders each source-traced frame to a high-resolution offscreen canvas **once**. During play, it draws just the selected cached frame, rather than repeatedly rebuilding geometry or enlarging a tiny 90-pixel bitmap. The Earth spell card uses the same traced third frame as inline SVG. The old approximate Golem rig and duplicate procedural spike system are no longer present.

### Frame order

0. Golem starts emerging from the ground.
1. Golem rises further.
2. Golem stands, hands approaching.
3. Hands clasp.
4. Joined hands rise near his face.
5. Hands lift overhead.
6. Charge pose overhead.
7. Fists smash into the ground.
8. First stone spikes emerge.
9. Spikes advance outward.
10. Larger spikes extend toward the enemy.
11. Golem returns underground.

At animation-clock time **3.67 seconds**, the Earth spell's advancing spike wave registers a 900 HP hit on the Sentinel; the target receives a small hit ring and damage label. It is not a second stone-spike overlay.

## Performance and mobile layout

The visible battle canvas remains a permanent 1000×560 backing buffer for its entire session; its dimensions are assigned once. The app height is captured once on startup to avoid Safari browser-bar viewport changes. High-refresh devices cap gameplay rendering to about 60 fps, while static scenery and the traced vector frames are cached.

## Source

- index.html — UI, card selection, script loading
- style.css — responsive layout, fixed viewport, interface styling
- game.js — battle/combat logic, Golem frame mapping, vector caching, Poseidon
- assets/stone-golem-true-trace-v1.js — real vector contour data for all twelve approved images

The 60 Hz and 120 Hz simulated Canvas tests verified all twelve actual traced frame selections, 269 traced color layers rendered and cached once, 900 Earth damage, 1,200 Water damage, and **exactly two backing-buffer assignments (width and height) to the visible battle canvas at startup**. The offscreen cache canvases have their own independent buffers. Physical iPhone visual performance still requires on-device testing.
