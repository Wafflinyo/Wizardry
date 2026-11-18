# Wizardry

Play the current 2.5D game at https://wafflinyo.github.io/Wizardry/arena.html?v=0.167.0.

The original duel has been retired. `index.html` opens the current game.

## Wizard setup

Create a wizard or load a locally saved wizard. Choose a name, robe/hat/skin colors, exactly **two elemental masteries**, and allocate **20 skill points**. All test wizards start at level 20 with **2,000 HP and 16 mana** before skill allocations. Each HP point adds 100 HP, each mana point adds 1 capacity, and each point in a chosen mastery adds 2% damage to that element. For example, 20 Fire points give +40% Fire damage with 2,000 HP and 16 mana.

Grimoires contain **exactly 24 cards**, with **up to 3 copies of each spell**, drawn only from the wizard's two masteries. CPU wizards follow the same rules and receive randomized builds, grimoires and colors. Wizard saves stay in this browser on this device; this test does not provide accounts or global name reservation.

Each damaging spell rolls one of three equally likely variants: 90%, 100%, or 110% of base damage, then applies elemental mastery and existing combat modifiers. One variant is shared across every hit/target of the cast. Cards display their damage ranges including mastery. Healing scales with elemental mastery and never rolls the damage variants. Damage-over-time effects capture the cast's multiplier when applied.

## Battles

Choose **New Card Tester** from the home screen to start with a random wizard and a passive training dummy. The five newest spells open in your hand and the rest draw in reverse release order, regardless of mastery. Select a card to cast it or swap it for the next one. Spell casts succeed in this mode, mana refills each round, and the dummy resets after a knockout.

Practice supports 1v1, 2v2, 3v3 and 4v4. A five-card hand draws one card per round when there is room; played cards reshuffle when the draw pile is empty. Once per planning turn, optionally discard one card to the bottom of the draw pile, then cast or pass without an immediate replacement draw. New spells appear in a human player's starting hand if included in that player's grimoire. Consecutive voluntary passes gain 2, then 3, then 4 mana and so on next turn, capped by the build’s capacity; a non-pass turn resets the streak. Failed spells cost no mana. Lightning Rod charges only from successful allied Lightning spells (excluding the rod itself).

**Electrical Charge** is a 2-mana self debuff. It grants 1 mana per Lightning spell that reaches you, once per cast and up to your mana capacity, for the rest of the cast round and the next three rounds. It occupies your debuff slot and cannot refresh or stack.

**Grill Master** is a 5-mana single-target Fire spell with 85% accuracy. Its flamethrower deals 440 base damage with a 20% chance to Burn for 50 damage per round for three rounds.

**Venus Trap** is a 4-mana single-target Nature spell with 90% accuracy. The flytrap grows, roars and engulfs one enemy for 400 base damage.

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

Only one harmful debuff can be active on a wizard. Reapplications cannot refresh or replace it; the next debuff becomes eligible after removal/expiry. Beneficial buffs are separate. Percentage effects (including Solidity, accuracy penalties and proc chances) retain their original values.
