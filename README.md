## NEW — Approved top-slot wizard idle in the arena (v0.30.0)

**[Play the battle scene with the new wizard](https://wafflinyo.github.io/Wizardry/arena.html?v=0.30.0)**

- The first allied wizard (top slot / Tidecaller) now uses the approved purple-and-gold low-poly wizard art from the idle-design preview, with a transparent background and a subtle smooth upward-and-downward breathing loop.
- Its feet remain anchored to the correct arena lane, the image renders in the main Canvas with proper depth ordering, and spell summons remain behind fighters. The other wizards and enemy models are unchanged.
- The default pointed-hat/classic-robe/Amethyst appearance uses the sprite. Changing hat, robe, or color in Customize switches back to the procedural model so those customizations still work. A missing image also falls back safely.
- This update changes the **idle battle appearance only**, not combat calculations or casting-frame artwork. The attached eight-frame GIF has been converted into an optimized static model frame, with breathing driven by game time for stable looping on mobile.

---

## NEW — Exact approved splash-art cards + Poseidon recharge & Tidal Echo (v0.29)

**[Play the updated Wizardry 2.5D Battle Test](https://wafflinyo.github.io/Wizardry/arena.html?v=0.29.0)**

The two ornate, non-scrolling cards now show actual **approved game animation frames** instead of unrelated concept art: Poseidon's trident-raised frame and Stone Golem's seismic fissure frame. Each card displays its mana cost, spell name, damage, accuracy, and the currently implemented effect. **The live 16-frame summon sprites have not been edited.**

- **Poseidon's Wrath:** 8 mana, **1,200 Water damage**, **70% accuracy**. After casting (hit or miss), the wizard **must skip the next round to recharge** and gains **Tidal Echo**: **+30% to their next successful damaging Water spell**. The buff persists through Earth spells and missed Water spells, and does not stack.
- **Stone Golem:** 6 mana, **900 Earth damage**, **85% accuracy**, original seismic fissure. No new ability.

The status effects appear as small, tappable magical runes **beneath the affected fighter's HP bar**: amber ⧖ for Recharge and cyan ≈ for Tidal Echo. Tapping an icon opens its detailed description. Both player and CPU casters use the same mechanics.

Story mode still lets you control one wizard, with CPU teammates; choose a card, tap an enemy and **Confirm Target**. Spell art still renders behind the standing fighters. No online accounts, friend lobbies or ranked matching are enabled yet. See [ARENA_TEST.md](ARENA_TEST.md) for rules and test instructions.

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
