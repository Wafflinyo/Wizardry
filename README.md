# Wizardry — Spellcasting Battle Prototype v0.9.0

**Play:** https://wafflinyo.github.io/Wizardry/

Mobile-friendly fantasy card-combat prototype with two playable spells, a 3,000-HP Stone Sentinel, and a single-screen battle interface.

## Playable spells

| Spell | School | Mana | Damage | Animation |
| --- | --- | ---: | ---: | --- |
| Poseidon's Wrath | Water | 8 | 1,200 | Poseidon rises out of the sea, aims and throws his trident, then sinks |
| Stone Golem | Earth | 6 | 900 | A massive guardian rises, clasps its fists, raises them overhead, slams the floor, sends sharp rock spikes across the arena, then disappears |

Mana replenishes between prototype rounds. Mixed Earth/Water attacks work in the same battle. Damage is applied only when the spell reaches its impact time.

## Stone Golem — engine-native low-poly animation (v0.9)

Version 0.9 replaces the 90×90 compressed sprite frames with sharp vectors drawn directly in the Canvas renderer. No bitmap is enlarged during battle.

Twelve reconstructed key poses based on the approved golem artwork drive a connected polygon rig. The eyes, face, chest, broad shoulders, stone arm segments, clasped fists, crystals and glowing rock faults use native geometry. Arm lengths stay fixed through interpolated animation frames. Joined fists slam to the ground before a **single integrated** spike wave travels toward the Sentinel. No legacy Earth spike overlay or sprite-image loader remains.

The Earth spell card uses scalable SVG portrait art that matches the geometric in-game character.

### Earth attack timing (animation-clock seconds)

| Time | Action |
| --- | --- |
| 0.10–1.06 | Golem emerges |
| 1.09–1.40 | Stone fists clasp |
| 1.40–2.33 | Fists raise overhead |
| 2.33–2.54 | Charged pause |
| 2.54–2.92 | Ground slam |
| 2.92–3.67 | Low-poly spikes propagate to the enemy |
| **3.67** | Final spike hits and deals **900 damage** |
| 4.02–4.27 | Earth effect settles |
| 4.27–5.09 | Golem sinks underground |
| 5.26 | Mana replenishes and round finishes |

Displayed Speed 1× uses the 1.5× internal spell rate: the Earth sequence lasts approximately 3.51 real seconds.

## Canvas and viewport stability

The page locks its CSS pixel height once at startup. Mobile Safari's browser bars no longer cause the app to recalculate its viewport height.

The canvas backing resolution is set **once** to **1000×560**; no window resize or ResizeObserver events reallocate its drawing buffer during or between fights. CSS scales the permanently sized game surface. A genuine orientation change requires reloading the page to acquire a new fixed layout.

Static scenery is cached and rendering work is capped at approximately 60fps. Earth magic has no camera shake. No external animation engine or asset decoder is necessary for the golem.

## Project files

- index.html — battle UI, SVG card portrait
- style.css — fixed mobile layout and fantasy styling
- game.js — Canvas character geometry, spell timelines, effects and combat

Simulated 60 Hz and 120 Hz tests passed for the twelve poses, constant arm lengths, Earth damage, Water damage, victory, reset, and single canvas size initialization. Physical-phone visual testing is still recommended.
