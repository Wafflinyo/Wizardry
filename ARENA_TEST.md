# Wizardry — 2.5D Battle Test v0.26.0

**Play:** https://wafflinyo.github.io/Wizardry/arena.html?v=0.26.0

The original 1v1 duel and both existing approved 16-frame summon sprite assets are preserved.

## Camera

The arena remains a shallow, elevated **three-quarter side view** with allies on the left and opponents on the right. The entire oval **has no diagonal rotation**: its front and rear rims run level across the screen, instead of rising from left to right as they did in v0.25.

Standing fighters do not swivel to face enemies. Wizards and CPU monsters raise a wand/staff toward the arena center while a spell is prepared, then lower it when the spell finishes or fails. Only the temporary summon art turns toward its selected target using Canvas transformations, with the original sprite content preserved.

## Current two spells

| Card | Mana | Accuracy per cast | Damage on hit |
| --- | ---: | ---: | ---: |
| Poseidon's Wrath | 8 | **70%** | 1,200 |
| Stone Golem | 6 | **85%** | 900 |

Those are the **only two selectable spell cards** in this test; no extra cards have been added.

### Automatic elemental rune casting

1. Player queues one of the two spells and chooses an enemy.
2. During speed-based action resolution, the wizard or monster **raises a staff**.
3. The game **automatically traces** the Water or Earth symbol as an animated glowing rune in the arena. **No touch-input tracing prompt** is shown, regardless of whether the caster is controlled by a player, an auto-filled teammate or a CPU opponent.
4. At rune completion, one independent uniform random roll determines success using that card's accuracy value: Poseidon succeeds when the roll is below 0.70; Stone Golem when it is below 0.85. These are *probabilities*, not fixed hit/miss patterns.
5. **Hit:** approved 16-frame summon appears, turns toward the target, deals listed damage at impact, and leaves the arena. **Miss:** the rune fizzles with no damage and no summon.
6. After either result, the caster's staff arm lowers fully and the next action begins. Mana is spent even when a spell misses.

A real CPU Story encounter and a local (hot-seat) PvP test support 1v1 through 4v4. Both sides use exactly the same hit-chance rules. The prototype is not networked online multiplayer.

## Wizard appearance

Customize the selected wizard with four hat styles (Pointed, Wide brim, Hood, Scholar), three robe shapes (Classic, Split-tail, Armored) and six robe colors. These options are purely cosmetic.

## QA

Automated tests checked the two cards' probability thresholds, deterministic forced hit/miss outcomes for each spell, one-time damage only on hits, automatic tracer for both teams, unchanged logical Canvas dimensions, and 1v1/2v2/3v3/4v4 round resolution. All passed. Review on the intended phone is still necessary to confirm real-world visual layout.
