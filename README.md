# Wizardry

## Spell Trial 001 — Poseidon's Wrath (v0.2)

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
- He **points his free arm at the target**, winds his throwing arm back behind his head, and **launches the trident at high speed** as a separate projectile. The shoulder and elbow animate continuously through the throw.
- The trident hits the target, producing a powerful splash, camera shake, and **1,200 water damage**.
- After the strike, Poseidon **unsummons**, sinking back into the collapsing wave and fading away.
- Mana regenerates between rounds for this spell test; defeat the 3,000-HP Sentinel in three casts.
- Use the sound toggle, 1×/2× playback speed, or Reset Duel.

### Spell timeline

| Approximate time | Animation |
|---|---|
| 0–0.7s | Summoning circle and whirlpool |
| 0.7–2.4s | Towering wave rises and Poseidon emerges |
| 2.2–2.9s | Free hand points at the target |
| 2.9–3.7s | Throwing arm winds back behind his head, then snaps forward |
| 3.74–4.08s | Trident launches and streaks to the target |
| 4.08s | Impact, 1,200 damage, water shockwave |
| 4.85–6.3s | Poseidon descends and dissolves into sea spray |
| 6.5s | Return to playable battle state |

### Technical notes

The prototype uses plain HTML, CSS, and JavaScript with a procedural **low-poly-styled 2.5D Canvas renderer**. It does not yet use full 3D character models. All character and water effects are drawn at runtime; synthetic sound uses Web Audio. It works with mouse and touch controls and has no runtime game dependencies.

**The card hand and Cast button remain visible in a single-screen layout** on both phones and desktops; no scrolling down to the hand is required. This initial version focuses on a single card and a single target to test creature animation, combat feedback, targeting, and mobile performance. Full deck management and multiplayer have not been implemented.

### Files

- **index.html** — battle UI, spell card, controls
- **style.css** — responsive fantasy game styling
- **game.js** — renderer, spell state machine, thrown trident, impact and unsummoning
