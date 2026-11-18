# Wizardry

Play the current 2.5D game at https://wafflinyo.github.io/Wizardry/arena.html?v=0.135.0.

The original duel has been retired. `index.html` opens the current game.

## Wizard setup

Create a wizard or load a locally saved wizard. Choose a name, robe/hat/skin colors, exactly **two elemental masteries**, and allocate **20 skill points**. All test wizards start at level 20 with **2,000 HP and 16 mana** before skill allocations. Each HP point adds 100 HP, each mana point adds 1 capacity, and each point in a chosen mastery adds 2% damage to that element. For example, 20 Fire points give +40% Fire damage with 2,000 HP and 16 mana.

Grimoires contain **exactly 24 cards**, with **up to 3 copies of each spell**, drawn only from the wizard's two masteries. CPU wizards follow the same rules and receive randomized builds, grimoires and colors. Wizard saves stay in this browser on this device; this test does not provide accounts or global name reservation.

Each damaging spell rolls one of three equally likely variants: 90%, 100%, or 110% of base damage, then applies elemental mastery and existing combat modifiers. One variant is shared across every hit/target of the cast. Cards display their damage ranges including mastery. Healing is unchanged. Damage-over-time effects capture the cast's multiplier when applied.

## Battles

Practice supports 1v1, 2v2, 3v3 and 4v4. A five-card hand draws one card per round when there is room; discarded cards reshuffle when the draw pile is empty. New spells appear in a human player's starting hand if included in that player's grimoire. Passing gains 2 mana next turn, subject to that wizard's capacity.

The newest spell, **Creeping Croc**, creeps toward its target mostly submerged, lunges and snaps for **800 base Water damage**. On a successful unblocked hit, a **10%** Fear roll skips the target's pending action only if it has not acted this round. There is no carryover. Water now has 6 spells; every other element has 5 (41 total).

The full-viewport HUD supports desktop, phone portrait and landscape, keeps the hand and casting controls visible, and offers full screen where supported. Combat messages avoid overlapping. A final knockout waits for the active spell's entire animation/exit and the defeat animation, followed by the half-second result pause.

## Online test lobbies

Create a lobby and share its link. Up to eight total wizards occupy four seats per side. Players choose vacant seats and ready up. The host can add/remove randomized CPUs in open seats, allowing friends to team up against CPUs. Empty seats remain empty. Both teams need a wizard before starting.

The host simulates combat and validates every submitted action; guests receive snapshots through the isolated lobby endpoint. The host must keep the page open. This is a host-authoritative prototype, not a competitive anti-cheat server. Saved wizard data is local. There is no matchmaking or account authentication. Lobby membership uses random 256-bit capability secrets, stored hashed by the service; the invite link contains only the room ID. The database table and RPC are inaccessible directly to anonymous/authenticated clients. Only the edge endpoint accesses them using server-held credentials. Rooms expire after 24 hours.

`backend/wizardry-lobbies.sql` defines the isolated test-room table and transactional RPC. `backend/lobby-edge.ts`, the shared build rules, and `backend/cards.json` form the deployed lobby function. No service secret is included in this repository or browser assets.

## Development and validation

- `npm run dev` serves the static game; supports `--port` through the dev script.
- `npm test` checks builds, deck legality, damage variants/ranges, individual mana caps, Croc Fear, full spell completion, cumulative damage, message spacing and host plan validation.
- `node tests/hand-swipe.cjs` checks card browsing.
- `node backend/test-lobby.cjs` runs a manual live lobby integration check, creates an ephemeral test room, and closes it afterward.

Browser QA covers wizard creation/save/load, practice, responsive portrait/landscape layout, two-player lobby joining/readiness/teams and shared combat. Live transport tests cover unauthorized actions, CPU seats, session-secret isolation, locking and stale-action rejection.
