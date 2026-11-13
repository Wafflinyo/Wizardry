# Wizardry — Spellcasting Battle Prototype (v0.4.1)

A playable, mobile-friendly low-poly/2.5D spellcasting trial in your browser. Pick a card, target the Stone Sentinel and cast a summoning spell. Both cards and the Cast button remain visible on the same screen on phones.

## Play

**Live game:** https://wafflinyo.github.io/Wizardry/

The game is deployed from the `main` branch via GitHub Pages. To run locally, open `index.html` in a modern browser. No dependencies or build step required.

## Your hand: two playable cards

| Spell | School | Mana | Direct-hit damage | Animation |
|---|---|---:|---:|---|
| **Poseidon's Wrath** | Water | 8 | 1,200 | Poseidon rises in one connected wave, points at the target, winds up, throws his trident, and sinks into the water |
| **Stone Golem** | Earth | 6 | 900 | A moss-and-sandstone golem rises from cracked earth, **lifts a massive boulder overhead using both hands**, hurls it at the enemy, then crumbles back to the ground |

**Choose a card by tapping it**, then tap **Cast**. After each round, the mana meter replenishes to 8 so you can repeatedly test the spell animations. Spell damage is applied only when its projectile strikes.

### Stone Golem animation refinements — v0.4.1

The stone golem is now rigged with **fixed-length upper arms, forearms, thighs and calves** using two-bone inverse kinematics, so the boulder can no longer stretch its rock joints. The torso tilts backward by about **13°** while the **left leg lifts approximately 69 pixels from its usual position**, with the right foot planted. Both stone fists grip opposite sides of the boulder as it charges the throw. The whole body drives forward into a fast, constant-speed boulder flight (about **0.23 seconds** at normal speed).

The golem begins and ends **fully beneath the arena floor**, with zero-velocity easing for rising and sinking. The canvas avoids unnecessary size resets, uses a lower pixel ratio on mobile, and the impact shake is deterministic rather than random, reducing visual jitter. The rise/sink has no camera shake.

### Stone Golem animation (Earth)

- **0–1.1 animation seconds:** fissures spread in the arena and the golem emerges.
- **1.0–2.4:** two arms lift the boulder from waist level until it is visibly **above the head**.
- **2.4–3.1:** brief overhead brace followed by a forceful two-handed heave.
- **3.09–3.43:** the released boulder flies quickly as an independent rotating projectile toward the target.
- **3.43:** impact shatters stone, kicks up debris, shakes the battlefield, and deals **900 Earth damage**.
- **4.1–5.17:** golem withdraws and disintegrates, returning the arena to normal.

### Poseidon's Wrath animation (Water)

A whirlpool opens, Poseidon rises with his lower half formed from a **single smooth wave**, aims his trident while his other arm points at the target, winds up, throws the trident as a projectile, delivers 1,200 damage upon impact, and sinks back into the sea. The old centre-column outline and oversized side humps have been removed.

**Normal animation speed:** 1.5× the initial pose-timeline, approximately **3.25 seconds** for Poseidon and **3.45 seconds** for Stone Golem. The optional **Speed: 2×** button doubles the current normal speed.

## Visual and UI notes

- The rotated mana diamonds now contain **upright numerals**: 8 for Poseidon and 6 for Stone Golem.
- Both cards appear together in the hand, including in the no-scroll mobile layout.
- The selected card sets the school, description, mana cost, damage, and Cast button.
- Procedural Canvas low-poly animation interpolates joints on each browser refresh, supports touch and mouse input, and provides optional Web Audio sound effects.
- Creature appearance, spell effects and projectiles are drawn directly in Canvas/SVG with no game-engine dependencies.

## Scope

This is a **two-spell prototype**, not yet a complete campaign, deck-building system or multiplayer battle. The current target is one **3,000-HP Stone Sentinel**; you can mix Water and Earth spells within the same duel.

### Source files

- `index.html` — battle UI, two spell cards and controls
- `style.css` — responsive fantasy interface and upright mana badges
- `game.js` — combat state, golem and Poseidon animation timelines, impacts and particles
