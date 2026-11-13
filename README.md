# Wizardry — Spellcasting Battle Prototype (v0.4.2)

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

### Stone Golem throw redesign — v0.4.2

**Biomechanics research:** The new motion follows the forward, two-handed overhead medicine-ball throw, **not** the backward-overhead power throw. The movement is based on a weighted rear-foot load, bent elbows, boulder carried up and **behind the head**, followed by lead-foot planting, hip/trunk extension and both arms swinging over the head toward the enemy.

Sources:
- American Council on Exercise (ACE), [Overhead Medicine Ball Throws](https://www.acefitness.org/resources/everyone/exercise-library/178/overhead-medicine-ball-throws/): ball reaches behind the head, weight shifts back, then the thrower drives forward with the legs, core, and both arms.
- [Two Handed Overhead Throw (bent arms)](https://www.snhac.org.uk/media/files/1584641284_med_ball_exercise_cards_a5.pdf) — medicine ball coaching cards: keep a bent-arm loaded position and power the release with a whole-body drive.
- [University of Victoria — Soccer Throw-in Phases](https://web.uvic.ca/~thopper/WEB/PE304%20images/Skill%20Analysis/Erin%20Phases%20throw-in%20soccer.pdf): lean back, transfer weight forward and release over the head with follow-through.

**Visual rework:** The golem has a faceted three-quarter stone silhouette with pronounced rocky brow, forward-facing nose, articulated shoulders, hard rock elbows, gemstone chest and visible rigid knee joints. Instead of stretching toward the boulder, the whole upper body arches about **19.5° backward**, the left foot lifts about **54px**, and the foot steps forward and plants as the spine and arms drive over the head. The boulder visibly moves **behind** the head during the load and releases rapidly.

**Animation stability:** All four stone limb segments use constant bone lengths through their keyframes. Emergence and retreat use smooth vertical easing and hide the entire creature underground at both ends, with deterministic impact-only camera shake and guarded canvas resizing. Tested with simulated 60 FPS and 120 FPS playback and mixed Earth/Water combat.

### Stone Golem animation (Earth)

- **0–1.1 animation seconds:** fissures spread in the arena and the golem emerges.
- **1.0–2.4:** two arms lift the boulder from waist level until it is visibly **above the head**.
- **2.2–2.7:** bring the boulder behind the head with bent elbows, lean backward, lift the left leg and load the throw; **2.69–3.09:** plant the lead foot and drive the hips, trunk and both arms forward.
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
