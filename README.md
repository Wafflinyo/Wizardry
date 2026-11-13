# Wizardry — Spellcasting Battle Prototype v0.5.0

A playable mobile-friendly elemental-card battle prototype, with two selectable spells and a responsive, always-visible card hand.

## Play

**Live game:** https://wafflinyo.github.io/Wizardry/

The game runs directly in a modern browser from `index.html`. It uses Canvas, CSS and JavaScript with no dependencies or build step.

## Spell cards

| Spell | School | Mana | Damage | Attack |
| --- | --- | ---: | ---: | --- |
| Poseidon's Wrath | Water | 8 | 1,200 | Poseidon rises as part of a wave, throws a trident, and disappears into the ocean |
| Stone Golem | Earth | 6 | 900 | A granite golem interlocks its stone fists, raises both hands above its head, slams the ground, and sends a traveling line of stone spikes into the target |

Choose a card in the hand and press **Cast**. The 3,000-HP Stone Sentinel can be defeated with either spell or a combination. Mana replenishes between test rounds. Damage is applied when the corresponding spell strikes.

## Stone Golem animation — complete redesign in v0.5

1. **Summon:** A massive faceted guardian rises from under the arena, grounded on two stone legs.
2. **Clasp:** Both stone fists join into one interlocked grip.
3. **Raise:** With rigid upper arms and forearms, it lifts those joined fists high above its head.
4. **Slam:** The upper body leans forward and both hands crash into the ground.
5. **Spikes:** Eleven jagged stone spikes erupt sequentially along a fissure that travels **from the golem to the Sentinel**.
6. **Impact:** The final spike reaches the opponent; the Sentinel takes **900 Earth damage**.
7. **Unsummon:** The spikes subside and the guardian sinks back beneath the stone.

The previous boulder-lift-and-throw attack and boulder card artwork have been retired.

### Graphics redesign

- A visually heavier 3/4-view granite creature: chiseled chest slabs, thick faceted joints, glowing emerald mineral faults, stone brow and a more imposing head.
- A single set of clasped fists replaces the distant/stretched hands and boulder.
- New angular stone spikes and a travelling green fissure distinguish Earth from Poseidon's water magic.
- The Earth card now illustrates the clasped overhead hands and the spikes.
- The arena now has layered basalt cliffs, runed obelisks and glowing crystals; the selected Earth card gives the Cast button an Earth palette.

### Performance and visual stability

- Static stars, mountains, stone floor, pillars and foreground scenery are rendered once into cached Canvas layers instead of being regenerated on every frame.
- Mobile canvas resolution is limited to a lower pixel density and high-refresh screens avoid drawing more than approximately 60 frames per second.
- Mobile blur filters are reduced, Earth uses far fewer particles, and the Earth attack does **not** shake the whole screen.
- Eased rise and sink animation starts and ends with the golem fully underground.
- The stone arm and leg segment lengths stay constant during every sampled animation frame.

Automated simulation checks passed at **60 and 120 display refreshes per second** for joint lengths, hand clasp, overhead pose, floor contact, Earth impact damage, mixing Water/Earth spells and victory. These checks do not replace visual testing on a physical phone.

## Files

- `index.html`: game interface and Earth/Water spell card artwork.
- `style.css`: responsive UI, visual theme, mobile optimization.
- `game.js`: render caching, spell animation, combat logic and particles.

This is still an early test arena, not a complete campaign, deck-builder or multiplayer game.
