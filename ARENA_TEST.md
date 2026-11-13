# Wizardry 2.5D Battle Test — v0.24

**Playable test:** https://wafflinyo.github.io/Wizardry/arena.html?v=0.24.0

The original 1v1 spell-animation duel is preserved at https://wafflinyo.github.io/Wizardry/.

## What is playable

- 1v1, 2v2, 3v3 and 4v4 on the same perspective-styled, depth-sorted Canvas 2D arena.
- **Story · CPU:** the local user plans actions for up to four allied wizards, and computer opponents automatically plan their responses. "Auto-fill" can queue actions for unassigned allies (simulated teammates).
- **PvP · local test:** hot-seat planning for Team A, then Team B, followed by a shared resolution. This is **NOT online multiplayer**: no friends, lobbies, matchmaking, accounts, invitations or ranked games are connected yet.
- Tap a combatant in the arena or a roster button to choose a caster/target. A target dropdown is provided for shields, heals, boosts and traps.
- One queued action per living combatant per round; **actions resolve by descending speed**, not simultaneously. A visible initiative strip previews the order and highlights the current caster. Missing friendly actions can be auto-filled; CPU actions are generated for story encounters.
- Each fighter has independent HP, mana (10 maximum), speed and up to **three personal status slots**.
- Mana is spent when the action actually begins; surviving combatants recover 4 mana at the end of each round.

## Available test spells

| Card | Mana | Type | Result |
| --- | ---: | --- | --- |
| Tidal Lance | 3 | Instant attack | 320 water damage to one selected enemy |
| Poseidon's Wrath | 8 | Temporary summon attack | Original approved 16-frame Poseidon animation, 1,200 damage, then disappears |
| Stone Golem | 6 | Temporary summon attack | Original approved 16-frame Stone Golem animation, 900 damage, then disappears |
| Mending Current | 3 | Instant heal | Restore up to 420 HP to a selected ally |
| Surge Ward | 2 | Attached shield | Reduce next incoming hit by 55%, then consume |
| Current Blade | 2 | Attached boost | +50% to next damage spell, then consume |
| Fault Trap | 2 | Attached trap | +35% damage from next hit on marked enemy, then consume |
| Aether Field | 4 | Team aura | +20% allied damage for the casting round and next round |

Damage modifiers apply before a shield's reduction. Duplicate attached status types refresh rather than stack. Personal status slots are capped at three; placing a fourth different status replaces the oldest. Team auras occupy their own field-effect slot and expire at round end.

**Temporary spell animations never become permanent field combatants.** Spells play, apply their healing/damage/effect once at the impact point, then disappear. The original approved artwork is used unmodified when the respective art assets are available. Small Canvas effects indicate the targeted projectile/impact, without an additional duplicate procedural Stone Golem.

## How to test

1. Open the dedicated test link.
2. Keep Story · CPU selected and try **4v4**.
3. Tap an allied wizard, choose a card and select a target (either by tapping enemies or with the target dropdown). Select **Queue spell**.
4. Queue spells for the other allies, or select **Auto-fill** for the remaining friendly slots.
5. Select **Resolve round** to watch the eight actions resolve in speed order, with persistent shields/traps/blades visible beside their combatants.
6. Switch to **PvP · local test** to choose the Team A spells, then **Pass to Team B** to choose opposing actions and resolve.

You can reset or change the team size at any point. The original duel remains unchanged.

## Implementation notes

- arena.html: battle test markup and accessible controls
- arena.css: responsive portrait/landscape layout
- arena.js: eight-combatant game state, simple computer decisions, target selection, status rules, turn queue, 2.5D Canvas 2D renderer, spell resolution
- Approved Poseidon and Stone Golem resources are loaded from the existing versioned sprite assets. **No artwork was edited.**
- Canvas logical resolution: **1000 × 620**. Rendering is capped near 60fps on high-refresh mobile devices.
- The battle is self-contained and deliberately does not modify the established original-duel engine.

## Next production steps (not part of this test)

Add authoritative multiplayer service, identity and friends, party invitations and reconnecting, campaign quests and progression, a persistent player deck/inventory, secure server-side combat validation, and ultimately rating-based ranked 4v4. The local PvP mode illustrates the turn flow only; do not assume it offers public matchmaking or synchronized online play.

Automated logic simulations validate four team sizes, eight cards, shield/blade/trap/aura triggers, sequential resolution and local PvP handoff. Actual mobile visual and touch testing is still recommended.
