# Wizardry — Elemental Battle Prototype v0.13.0

**Play the game:** https://wafflinyo.github.io/Wizardry/

Wizardry is a mobile-friendly spell-card battle prototype. Choose Poseidon's Wrath or Stone Golem and fight the 3,000-HP Stone Sentinel.

## Separation of rendering and interface

**Everything visible inside the battlefield is now drawn with HTML5 Canvas 2D:** the Wizard and Sentinel, Poseidon, the Stone Golem, spell effects and projectiles, **HP bars, mana crystals, round/stage labels, spell caption, status messages and victory graphic**.

HTML and CSS remain responsible only for the surrounding spell cards, menu controls, buttons, and responsive page layout. An offscreen accessible text mirror announces combat information for screen readers. The Fight Again button is outside Canvas, below the battle, to keep it keyboard- and touch-accessible.

The arena itself is one canvas with a permanent **1000×560 drawing buffer**, styled with the **1000:560 aspect ratio**. It does not have JavaScript resize observers or handlers. The page is allowed to scroll on small screens rather than clipping the cards. The disappearing/reappearing battle overlay elements and stage-specific HTML label reflows that could shift the screen have been removed.

## Spells

| Card | Element | Cost | Damage | Animation |
| --- | --- | ---: | ---: | --- |
| Poseidon's Wrath | Water | 8 mana | 1,200 | Water summon → aim → trident strike → sink |
| Stone Golem | Earth | 6 mana | 900 | Rise → clasp → overhead windup → ground slam → advancing spikes → sink |

Each projectile/stone-spike attack applies damage precisely at its impact point. The test arena replenishes mana between turns. Victory and reset are supported.

## Stone Golem frame-performance comparison

The Golem's **12 poses and 269 original traced contour paths** still come from the approved illustrated low-poly sprite sheet in `assets/stone-golem-true-trace-v1.js`.

At startup, the game:

1. Compiles the contour data into Canvas `Path2D` objects.
2. Creates **12 high-resolution cached frames at 1.7× the original 362×362 vector coordinates** (615×615 pixels per frame). These are rendered from the paths once, not taken from the small compressed sprite sheet.
3. Benchmarks painting sampled frames directly from vectors versus drawing their cached high-resolution equivalents.
4. Uses the measured faster option, with a fallback to direct `Path2D` rendering when caching fails.

During gameplay **Canvas 2D** draws either the cached frame with `drawImage`, or fills the original vector paths. **CSS does not animate or draw the characters.** The original double-rendered spike effect is absent.

The optional in-browser diagnostic `window.WIZARDRY_RENDER_DIAGNOSTICS` reports the selected mode, cached frame dimensions and measured time per sample frame.

## Files

- `index.html` — selectable spell cards, accessible status mirror, outer controls.
- `style.css` — responsive card and page layout with aspect-locked arena.
- `game.js` — all Canvas battle visuals, animations, damage, sound, performance test.
- `assets/stone-golem-true-trace-v1.js` — the approved twelve-frame vector contours.

Automated simulations at 60 Hz and 120 Hz verified both Golem rendering modes, HUD messages drawn by Canvas, spell damage, victory, reset and the canvas buffer remaining unchanged after initialization. Mobile Safari behavior still needs checking on a physical device.
