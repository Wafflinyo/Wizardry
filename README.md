# Wizardry

## Spell Trial 001 — Poseidon's Wrath (v0.3.1)

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
- He **points his free arm at the target** while lifting his throwing arm, and the trident **stays pointed at the enemy throughout the wind-up**. A denser set of interpolated poses creates smoother movement; the separate projectile launches at high speed with no discontinuity. The shoulder and elbow animate continuously through the throw.
- The trident hits the target, producing a powerful splash, camera shake, and **1,200 water damage**.
- After the strike, Poseidon **unsummons**, sinking back into the collapsing wave and fading away.
- Mana regenerates between rounds for this spell test; defeat the 3,000-HP Sentinel in three casts.
- Use the sound toggle, 1×/2× playback speed, or Reset Duel.

### Spell timeline (v0.3.1)

The keyframe timestamps below are animation-clock times. At default 1× speed, divide the listed times by 2 to get real seconds.

The full cast is approximately **2.44 seconds at 1×**, which is the former 2× playback pace (and **1.22 seconds at 2×**). The spell's relative keyframe timings are preserved, so throw, impact, and unsummoning stay synchronized. Procedural arm poses use additional intermediate joint keys with cubic interpolation at every display refresh (typically 60 Hz, or 120 Hz on supported screens).

| Approximate time | Animation |
|---|---|
| 0–0.45 s | Whirlpool forms |
| 0.45–1.65 s | Poseidon rises as part of the wave |
| 1.13–1.60 s | His free hand points at the Sentinel; trident tips turn toward the target |
| 1.54–2.37 s | Throwing arm raises and winds backward through intermediate poses, with the trident aimed at the target |
| 2.37–2.70 s | Fluid shoulder, elbow, and wrist release and follow-through |
| 2.55–2.86 s | Fast independent flying trident (0.31 seconds), launched from the hand-held weapon tip |
| 2.86 s | Impact, 1,200 damage, water shockwave |
| 3.52–4.74 s | Poseidon sinks *with* the wave and dissolves into sea spray |
| 4.88 s | Arena returns to playable state |

### Technical notes

The prototype uses plain HTML, CSS, and JavaScript with a procedural **low-poly-styled 2.5D Canvas renderer**. It does not yet use full 3D character models. All character and water effects are drawn at runtime; synthetic sound uses Web Audio. It works with mouse and touch controls and has no runtime game dependencies.

**The card hand and Cast button remain visible in a single-screen layout** on both phones and desktops; no scrolling down to the hand is required. This initial version focuses on a single card and a single target to test creature animation, combat feedback, targeting, and mobile performance. Full deck management and multiplayer have not been implemented.

### Files

- **index.html** — battle UI, spell card, controls
- **style.css** — responsive fantasy game styling
- **game.js** — renderer, spell state machine, thrown trident, impact and unsummoning
