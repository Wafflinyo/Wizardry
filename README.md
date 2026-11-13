# Wizardry — Elemental Battle Prototype v0.22.0

**Play:** https://wafflinyo.github.io/Wizardry/?v=0.22.0

A phone-friendly Canvas 2D elemental spell-card battle prototype.

## Approved Poseidon animation — exact 16-cell artwork

Version 0.22 now uses the user's **exactly approved 4×4 low-poly sprite sheet**, unchanged. The original transparent 1254×1254 PNG is split into four **lossless** WebP rows. Each row was decoded and pixel-compared against the original crop with **zero changed pixels**. No invented poses, image warps, transparency patches, redrawing, or crossfaded duplicate tridents are used in this release.

The four game assets are:

- `assets/poseidon-v22-row0.js` — rising from water (frames 0–3)
- `assets/poseidon-v22-row1.js` — idle and early windup (frames 4–7)
- `assets/poseidon-v22-row2.js` — windup, throw and follow-through (frames 8–11)
- `assets/poseidon-v22-row3.js` — recovery and sinking (frames 12–15)

The game loads all four rows before enabling the Poseidon cast. Each frame is rendered inside the same fixed-position Canvas stage. At displayed 1×, the full animation lasts approximately **2.63 seconds**.

### Exactly synchronized weapon handoff

The approved animation **still visibly holds one trident in frame 9**, the last full windup pose.

- Until game-clock **2.26s**, the held weapon is shown within the original artwork (frame 9).
- Exactly at **2.26s**, the first empty-handed throw pose (frame 10) appears and Canvas simultaneously starts the independent trident projectile at the last held tip location.
- The projectile reaches the Stone Sentinel at **2.68s** of spell clock; **1,200 Water damage** is applied at that instant.
- He holds after impact, then sinks and disappears using the original frames 14 and 15. The water and body are not modified.

This synchronizes the disappearing hand-held weapon with the separately drawn projectile instead of letting the trident vanish early between pose swaps.

## Other spell

**Stone Golem** remains unchanged: costs 6 mana, deals 900 Earth damage when its traveling stone spike attack reaches the enemy, then recovers and sinks.

## Battle engine and validation

Canvas owns all battlefield graphics, characters, health and mana indicators, effects, and impact messages. The fixed 1000×560 backing buffer maintains its aspect ratio; responsive HTML/CSS is used only for the cards and controls. There's no recurring Canvas resize observer.

Simulated 60 Hz and 120 Hz tests passed for all sixteen Poseidon sprite indices, the trident transition from frame 9 to 10, 1,200 Water damage, 900 Earth damage, turn progression, and stable Canvas size. Physical iPhone rendering still needs verification.
