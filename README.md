# Wizardry — Elemental Battle Prototype v0.19.0

Play: https://wafflinyo.github.io/Wizardry/?v=0.19.0

## v0.19 — use the exact approved Poseidon artwork

The earlier Poseidon vector traces were rejected because they introduced broken body transparency, a duplicated/switching trident, and a weak windup. Version 0.19 **replaces them with the actual five low-poly bottom-row poses approved by the user**. No character geometry is regenerated for the five primary poses.

The approved transparent sheet contains five 360×330 cells in this exact order:

1. **Idle:** full Poseidon emerging from the water, holding a single trident.
2. **Windup A:** right-hand trident begins drawing back.
3. **Windup B:** trident drawn overhead, held for the final charging beat.
4. **Throw:** empty-handed forward extension after release.
5. **Hold:** empty-handed recovery after the hit.

These are stored at `assets/poseidon-approved-five-v19.js` as a WebP sprite atlas created from the approved isolated PNG frames. The original individual transparent PNG frames were preserved separately for comparison. This corrects the illustrated body's transparent cutouts without painting artificial replacement skin/water over it.

### Complete Poseidon attack

- **Rise:** the approved idle artwork emerges from below the constant arena waterline.
- **Idle → Windup A → Windup B:** two distinct held-trident poses; no duplicate projectile.
- **Release:** the held-trident illustration disappears at the same instant the separate moving trident begins.
- **Trident travel:** a Canvas 2D golden trident moves with cyan trail toward the Stone Sentinel, with its tip aligned to the trajectory.
- **Impact:** hit particles and water splash appear when the Sentinel loses **1,200 HP**, not before.
- **Hold:** the empty-handed approved pose remains visible for approximately **0.61 seconds** after impact.
- **Unsummon:** the approved hold pose slides below the arena waterline, with a subtle ring of surf at the surface.

At the displayed 1× speed, Poseidon takes approximately **2.63 seconds** from summon through disappearance. The battle HUD remains Canvas-only; there is no unwanted on-screen animation narration.

**Stone Golem was deliberately left unchanged.** It still deals 900 Earth damage with its ground-slam and traveling-spike effect.

## Technical details

- **`game.js`:** fixed 1000×560 Canvas 2D battle coordinates, combat timing, Poseidon's approved five-pose playback, projectile and impact, Stone Golem, UI and sounds.
- **`assets/poseidon-approved-five-v19.js`:** exactly the five approved image poses in one transparent atlas, used in battle and on Poseidon's spell card.
- **`assets/stone-golem-true-trace-v1.js`:** Stone Golem's twelve traced poses, unaffected in this release.
- **`index.html`:** card selection and external controls, versioned scripts.
- **`style.css`:** responsive card layout, permanent arena aspect ratio, portrait artwork.

In simulated 60 Hz and 120 Hz battle runs, all five approved Poseidon sprite indices displayed, impact deducted exactly 1,200 HP, Stone Golem still deducted 900 HP, and the canvas drawing buffer was initialized only once. Physical-phone smoothness and visual alignment should still be checked on an iPhone.
