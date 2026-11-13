## NEW — 2.5D level arena and automatic spell accuracy test (v0.26)

**[Play the updated 2.5D Wizardry test](https://wafflinyo.github.io/Wizardry/arena.html?v=0.26.0)**

The battlefield remains a three-quarter **side view** but the circular fighting surface is now **level instead of diagonally slanted**. Allies stand on the left arc and enemies on the right.

No finger tracing is required. Every caster automatically draws their element's rune with their wand or staff, then a **fresh independent random accuracy roll** decides success:

- **Poseidon's Wrath — 70% accuracy, 1,200 damage.**
- **Stone Golem — 85% accuracy, 900 damage.**

A successful cast summons the approved creature, hits its selected enemy and disappears. A miss fizzles without damage; the caster lowers their arm and the next turn begins. **Only these two spell cards** are selectable. The approved 16-frame sprites and original 1v1 duel were not changed.

The local CPU and hot-seat PvP test supports 1v1–4v4, plus wizard hats, robe styles and color choices. It is not yet real online multiplayer. See [ARENA_TEST.md](ARENA_TEST.md) for gameplay and test notes.

---

# Wizardry — Spellcasting Prototype v0.23.0

**Play:** https://wafflinyo.github.io/Wizardry/?v=0.23.0

A mobile-friendly elemental spell-card game, featuring Poseidon's Wrath (Water) and Stone Golem (Earth), each animated using exactly **16 original approved frames**.

## Stone Golem — approved 16-frame artwork (v0.23)

The Golem's artwork is **the exact user-approved 4×4 sprite sheet, without any image edits**. It is split into four losslessly compressed WebP rows, each validated pixel-for-pixel against the supplied source image. No vector rebuilding, generative in-betweens, retouching, recoloring, crossfades or duplicate seismic spike effects are involved.

The four sprite resources are:

- `assets/stone-golem-approved-v23-row0.js` — rise (frames 0–3)
- `assets/stone-golem-approved-v23-row1.js` — clasp and overhead windup (frames 4–7)
- `assets/stone-golem-approved-v23-row2.js` — ground slam and fissure propagation (frames 8–11)
- `assets/stone-golem-approved-v23-row3.js` — final fissure, idle, rubble collapse (frames 12–15)

The fissure reaches its last frame immediately before the registered **900 Earth damage** at game-time 2.87s. The spikes then clear, Golem returns to idle, and the last two original frames show him breaking back into rubble underground. No extra geometric spike system plays on top of the sprite.

At displayed Speed 1×, Golem's **5.01 game-seconds** run at a 2.125× effective animation rate, completing in about **2.36 real seconds**—slightly slower than Poseidon's approximately **2.10 seconds**. All 16 cells render in order. The Earth card portrait uses the same approved standing frame #3.

## Poseidon's Wrath

Poseidon's existing **16 approved low-poly frames** and release-to-projectile handoff remain unchanged. The trident flies to the Stone Sentinel and deals **1,200 Water damage** at impact.

The game uses Canvas 2D for the entire battle and maintains a fixed 1000×560 internal resolution. CSS handles only the surrounding card/control layout.

## Verification

Automated Canvas tests at 60 Hz and 120 Hz verified all 16 Stone Golem frame indices, the 900 damage on fissure impact, a subsequent 1,200-damage Poseidon spell, round completion, reset, frame loading and only one Canvas size initialization. These simulations do not substitute for testing the appearance on a physical iPhone.
