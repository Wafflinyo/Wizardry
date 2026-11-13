# Wizardry — Spellcasting Battle Prototype v0.8.0

**Live game:** https://wafflinyo.github.io/Wizardry/

A mobile-friendly fantasy-card battle prototype with two selectable summoning spells, a 3,000 HP Stone Sentinel, and a stable no-scroll mobile layout.

## Spell cards

| Spell | School | Mana | Damage | Attack |
| --- | --- | ---: | ---: | --- |
| Poseidon's Wrath | Water | 8 | 1,200 | Poseidon rises as part of an ocean swell, then throws his trident |
| Stone Golem | Earth | 6 | 900 | A chunky low-poly guardian rises, clasps its stone fists, slams down, and sends spikes toward the Sentinel |

Mana refills between test rounds, and both spells can be mixed in the same duel.

## Approved Stone Golem sprite — v0.8

**The exact user-approved, simplified low-poly design is implemented.**

- **Actual in-game asset:** `assets/stone-golem-geom-v08.avif` — 270×360, 3 columns × 4 rows, **12 90×90 transparent frames**, approximately 7.7 KB.
- **Source artwork:** user-approved 1086×1448 transparent 3×4 image; reduced and compressed for fast mobile playback.
- **Character appearance:** chunky geometric arms and shoulders, wedge-shaped rocky head, glowing green eyes and chest fault, back crystals, and angular spikes.
- **Card portrait:** uses this exact atlas in the Earth spell card, showing the hands-clasped frame.
- **Rendering:** game draws a single stationary sprite cell from the atlas with smooth frame transitions. The animation art itself contains rise, overhead motion, slam, integrated spike wave, and sink.
- **No duplicate spikes:** the older procedural polygon spike renderer and projectile have been removed; the only additional impact VFX is a small **target-only hit ring and −900 damage label**.

### Frame sequence and impact clock

The original artwork has these 12 ordered poses:

0–2. Burrowed → partially emerged → standing / clasping  
3–6. Raise joined hands → overhead hold  
7. Ground slam  
8–10. Ground spikes erupt and extend toward the target  
11. Return into the earth

The Earth spell timeline is measured in animation-clock seconds, with a normal speed multiplier of 1.5×:

| Clock | Action |
| --- | --- |
| 0.10–1.06s | Golem rises |
| 1.09–1.40s | Hands clasp |
| 1.40–2.33s | Joined hands rise overhead |
| 2.33–2.54s | Charge / hold |
| 2.54–2.92s | Heavy ground slam |
| 2.92–3.67s | Spike sequence plays |
| **3.67s** | Sentinel takes **900 Earth damage** |
| 4.02–4.27s | Recovery |
| 4.27–5.09s | Golem sinks / unsummons |
| 5.26s | Mana restored; round ends |

### Stability and performance

The background scenery is cached into offscreen canvas layers. Canvas pixel density is reduced on mobile, drawing is capped at approximately 60 frames per second, and the battle area uses **100svh** to avoid viewport-height jumps as browser UI appears or disappears. Canvas resize is blocked during active spell casting.

The new AVIF sprite atlas is lightweight; no bone rig or procedural creature geometry is recomputed during Earth spells. The Earth spell does not apply full-screen shake.

Simulated rendering and combat tests passed at 60 Hz and 120 Hz, verifying all 12 frames, HP changes on impact, mixed Earth/Water spells, reset, and **zero canvas size changes during casting**. Actual iPhone browser behavior should still be checked manually.

## Source files

- `index.html` — game UI, cards, preload and versioned assets
- `style.css` — responsive layout, Earth card portrait, battle-screen stabilization
- `game.js` — combat states, animation timeline, sprite-atlas playback, screen renderer
- `assets/stone-golem-geom-v08.avif` — approved low-poly Stone Golem animation sheet

This remains a prototype, not a full campaign or deck-building game.
