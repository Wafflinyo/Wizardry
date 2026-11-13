# Wizardry

## Spell Trial 001 — Poseidon's Wrath

A playable, mobile-friendly spellcasting battle prototype. This is a real interactive game test, **not a GIF or static illustration**.

### Play the game

Open **index.html** in a browser, or publish it through GitHub Pages:

1. In this repository open **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Select **main** and **/(root)**, then save.
4. Once GitHub finishes publishing, play at the expected URL: https://wafflinyo.github.io/Wizardry/

The URL above is the expected Pages address, not confirmation that Pages has already been enabled. The game requires no build or third-party game engine.

### Combat controls

- Tap the Stone Sentinel to target it.
- Select the **Poseidon's Wrath** card and press **Cast**.
- Poseidon rises out of a massive wave, his lower half formed entirely from the water.
- He draws his arm back and **throws his trident** as a separate flying projectile.
- The trident hits the target, producing a powerful splash, camera shake, and **1,200 water damage**.
- After the strike, Poseidon **unsummons**, sinking back into the collapsing wave and fading away.
- Mana regenerates between rounds for this spell test; defeat the 3,000-HP Sentinel in three casts.
- Use the sound toggle, 1×/2× playback speed, or Reset Duel.

### Spell timeline

| Approximate time | Animation |
|---|---|
| 0–1.1s | Summoning circle and whirlpool |
| 1.1–3.3s | Wave rises and Poseidon emerges |
| 3.3–4.2s | Windup and throw preparation |
| 4.2–4.9s | Trident is released, flying toward the target |
| 4.9s | Impact, 1,200 damage, water shockwave |
| 5.4–7.2s | Poseidon descends and dissolves into sea spray |
| 7.5s | Return to playable battle state |

### Technical notes

The prototype uses plain HTML, CSS, and JavaScript with a procedural **low-poly-styled 2.5D Canvas renderer**. It does not yet use full 3D character models. All character and water effects are drawn at runtime; synthetic sound uses Web Audio. It works with mouse and touch controls and has no runtime game dependencies.

This initial version focuses on a single card and a single target to test creature animation, combat feedback, targeting, and mobile performance. Full deck management and multiplayer have not been implemented.

### Files

- **index.html** — battle UI, spell card, controls
- **style.css** — responsive fantasy game styling
- **game.js** — renderer, spell state machine, thrown trident, impact and unsummoning
