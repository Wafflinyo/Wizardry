# Wizardry · 2.5D Battle Test v0.28.0

**Play:** https://wafflinyo.github.io/Wizardry/arena.html?v=0.28.0

The original 1v1 duel, the approved Poseidon / Stone Golem 16-frame art assets, and their summon damage/accuracy are unchanged.

## The new one-wizard battle flow

**You control only Tidecaller** in Story mode. Up to three other allied wizards, and all enemy fighters, are independently CPU-controlled. A 4v4 scene therefore involves 1 human and 7 computer-controlled characters. The CPU teammates are placeholders for future online co-op friends; current Story mode is local only.

On your turn:

1. Both approved spell cards are always shown immediately under the battlefield; no hand scrolling is necessary.
2. **Tap Poseidon's Wrath or Stone Golem.**
3. **Tap a living enemy directly on the arena.** A gold **downward arrow appears above the selected target's head**. You may tap a different enemy to change the target before casting; their side HP plate is also tappable.
4. Press **Confirm Target** below the cards to lock in your action. No mana is spent and no spell begins before you confirm. The other fighters auto-plan and the round resolves; no extra Queue/Auto-fill/Resolve controls are required.
5. All other living wizards choose their own spells and targets using their own CPU decisions. Action resolution still uses speed order, auto-drawn element runes, probabilistic hit checks, temporary summons, and arm lowering.
6. When the round finishes, the game returns to **your** blank two-card hand awaiting a **new** card and target. Nothing from the previous round is auto-queued.
7. If your wizard has been knocked out, your surviving CPU allies keep fighting autonomously; you cannot take control of another wizard.

**Local hot-seat PvP:** Each team has one locally controlled wizard (Team A's Tidecaller, Team B's Dusk Magus); everyone else is CPU-controlled. The device passes from one player to the other after each player's card-and-target choice. This is **not yet real online multiplayer** or ranked PvP.

## Current spells

| Spell | Mana | Accuracy per cast | Damage on hit |
| --- | ---: | ---: | ---: |
| Poseidon's Wrath | 8 | 70% | 1,200 Water |
| Stone Golem | 6 | 85% | 900 Earth |

No other spell cards have been added. Each caster's rune is drawn automatically within the arena, followed by one independent hit/miss roll. A miss fizzles without damage. A hit summons the approved creature, damages the chosen target once and disappears.

## Screen layout and customization

The level 2.5D side-view arena and the two spell cards share a single mobile viewport with compact turn feedback. **Ally HP/name plates sit to the left of their character models; enemy HP/name plates sit to the right.** They no longer cover the character faces or bodies. **Summon sprites, projectiles, fissures and runes always render behind all standing fighter models**, with floating damage and the target arrow rendered after the models. The old roster and action buttons have been removed from the **visible** combat UI. Confirm Target appears inline only when a valid enemy is selected. Both cards are displayed side by side in a non-scrolling row; targets are tapped on the actual battle canvas. A collapsed **Customize your wizard** section retains all four hats, three robe silhouettes and six robe colors.

Portrait and landscape have separate responsive sizing rules; the existing 1000×620 arena drawing buffer and original summon artwork are unchanged.

## Test scope and limitations

The battle is a playable local prototype. It has no connected accounts, friend invites, co-op synchronization, authoritative online combat, matchmaking or ranked 4v4. Those need multiplayer infrastructure.

Automated simulated tests checked one-human-per-side ownership, two-card accessibility, **selecting and changing targets without casting, confirming to commit**, CPU teammate/enemy plans, hit/miss behavior, 1v1–4v4 resolution, fresh player input each round, side-bar positions, arrow rendering, **both approved summons drawn behind fighters**, and fixed Canvas dimensions. Actual iPhone browser visual review is still recommended.
