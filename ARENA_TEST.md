# Wizardry — 2.5D Battle Test v0.25.0

**Play:** https://wafflinyo.github.io/Wizardry/arena.html?v=0.25.0

The original, unchanged 1v1 approved sprite demo remains at https://wafflinyo.github.io/Wizardry/.

## Camera and combatants

The arena is a **three-quarter SIDE view**, not an overhead or over-the-shoulder view. Allied fighters occupy the **left arc** and opponents occupy the **right arc**. They are staggered by depth in 1v1, 2v2, 3v3 and 4v4. The drawn arena is a shallow, angled oval with visible stone thickness and layered perspective geometry.

**Standing characters do not rotate when targeting.** All wizards retain fixed three-quarter facing, and Story CPU monster enemies remain similarly planted. The active caster raises a single staff arm and points its rigid wand toward the arena's center. The arm returns to the character's side before the next actor begins.

Only the **temporary summon creature** can turn toward the chosen target using Canvas mirroring with a slight 2.5D perspective adjustment. It plays the originally approved 16-frame Poseidon/Stone Golem animation unchanged, hits one selected target, then disappears; the creatures do not become permanent units.

## Exactly two spell cards in the current test

| Card | Element | Mana | Damage |
| --- | --- | ---: | ---: |
| Poseidon's Wrath | Water | 8 | 1,200 |
| Stone Golem | Earth | 6 | 900 |

There are **no additional playable spells** in this test. Older status-effect experiments are not available through the current two-card hand.

## Trace-to-cast minigame

1. Select a friendly wizard, choose one of the two approved cards, target an opponent and queue the spell.
2. Once both teams' actions are chosen, resolution proceeds in **descending speed order**.
3. The active wizard/monster **raises their arm and points a staff toward the arena center**.
4. For a human-controlled action, a stable fullscreen overlay shows the Water wave rune or angular Earth rune. Use one continuous finger or mouse gesture from its **green starting point** to its **gold ending point**. Accuracy, starting/ending positions and trace length determine success.
5. **Successful rune:** the approved summon animation plays toward the chosen target; damage is applied once at its impact moment; the creature disappears.
6. **Failed rune or Skip cast:** the spell fizzles, with **no damage**, and the wizard's arm lowers.
7. The arm lowers fully, then the game advances to the next combatant.

Failure still consumes the card's mana. **Story CPU opponents and auto-filled friendly slots** automatically attempt the rune with a deterministic simulated 88% success rate. In local hot-seat PvP, manually queued actions from both teams require actual tracing. The original arena drawing buffer stays fixed at **1000×620**, and the trace overlay is fixed-position, so it cannot push the battlefield up or down.

## Low-poly wizard appearance options

Each wizard is assembled in Canvas from faceted robe, hat, face, arm and staff polygons; it is **not** a generic still sprite that tilts to face its target. The selected wizard can choose:

- Hats: Pointed, Wide brim, Hood, Scholar.
- Robe silhouettes: Classic, Split-tail, Armored.
- Robe colors: Ocean blue, Amethyst, Ember red, Emerald, Steel grey, Royal gold.

Options affect only visual appearance, not stats or combat balance. In **PvP local test** both opposing teams use customizable wizard models; in **Story · CPU** the opponents remain distinct fantasy monster/stone models with the same simple point-and-cast arm motion.

## Modes and scope

**Story · CPU**: a local party of up to four allied wizards against CPU opponents, with auto-fill for allies. This is an encounter test, not a full quest or save system.

**PvP · local test**: Team A selects actions, passes the device to Team B, then actions resolve by speed. It is not networked.

Online friends, persistent characters, co-op campaign quests, lobbies, reconnect handling, servers, public matchmaking, ranked 4v4 and progression remain future work.

### QA

Simulated tests verified two-card restriction, side-facing positions, character customization, arm raise/hold/lower, real pointer rune gestures, accurate vs inaccurate traces, successful spell damage, failed attacks consuming a turn without damage, automatic CPU actions, local PvP planning from 1v1 through 4v4, and a fixed Canvas drawing buffer. Physical iPhone visual review is still needed.
