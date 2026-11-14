## FIX — Tornado spins from the instant it is summoned (v0.56.0)

**[Play Tornado Barrage with continuous spinning](https://wafflinyo.github.io/Wizardry/arena.html?v=0.56.0)**

The previously approved twelve-frame full teal tornado had a summon-stage freeze: frame 0 was held for 22% of the 960ms summon, frame 1 until 52%, and frame 2 for the remainder. It visibly stalled before launching rocks. The summon now cycles the SAME fast rotating frames (2–11) every 55 milliseconds immediately from the start, sharing the attack animation's continuous real-time frame clock. The funnel still fades in and grows to full size, but it **never pauses its rotation** during summoning, rock volley, impact, or disappearance. The approved original model/texture, direct 152ms rock shots, staggered 200-damage impacts, 6-mana cost, 80% accuracy, and successful-cast +10-point Tailwind effect are unchanged.

---

## UPDATED — Faster spinning tornado and straight-line rock shots (v0.55.0)

**[Play Tornado Barrage with fast rocks](https://wafflinyo.github.io/Wizardry/arena.html?v=0.55.0)**

The tornado still uses the previously **approved transparent 12-frame fuller teal wind artwork**, unmodified in shape, proportions and palette. During the rock volley its original wind frames now cycle every **55 ms (~18 fps)** instead of playing just 10 frames across the former 2-second attack. This creates more rapid apparent spin without replacing the approved model.

**Rocks no longer hop or arc.** Each rock starts INSIDE the funnel, then shoots out rapidly in a **direct straight line** toward its enemy. A short cyan-white wind streak appears behind the fast rock. Every targeted enemy receives a tight burst of four stones with the primary rock arriving in **152 ms**, instead of the former ~620 ms arcing trip. Enemy volleys remain **staggered** rather than simultaneous.

**Gameplay remains intact:** Wind still uses its existing one-roll accuracy. The first rock's hitAt timing deals **200 base damage to that living enemy once**, with no friendly fire. Damage is applied precisely when the stone visually arrives; impact effects remain individual. A successful tornado still gives the caster **+10 accuracy percentage points on their next cast of any element**, consumed on the next attempt. Other spells and mobile card layout are untouched.

---

## UPDATED — Approved full-wind tornado with staggered rock impacts (v0.54.0)

**[Play Wizardry with the new tornado](https://wafflinyo.github.io/Wizardry/arena.html?v=0.54.0)**

The live Tornado Barrage now uses the **user-approved original twelve-frame animated tornado** rather than the previous thin, code-drawn funnel. Its animation was converted from the approved GIF into a **transparent 4×3 atlas of 12 frames** (`assets/tornado-approved-v54.webp`) so the original picture's sky, masonry and floor do NOT cover the Wizardry battlefield. The original faceted, richly filled teal wind ribbons, churning base debris, and bulky swirling body are preserved. The exact same source frames appear in the spell card art.

Instead of an instantaneous synchronized hit on everyone, the new tornado **fires distinct groups of stone projectiles** sequentially from the rotating funnel toward each currently living enemy. Every target has a separate launch and arrival time (roughly 34%, 50%, 66%, and 82% into the volley for 4v4). **Each enemy takes its 200 base damage at their own stone impact**, with brief individual rock-burst particles behind and in front of their wizard. The weathered tornado then fades out. No changes were made to the existing arena backdrop or wizard sprites.

All previous Wind gameplay rules are preserved: **80% base card accuracy, 6 mana, 200 damage per living enemy (no friendly fire), +10 percentage points to the caster's next spell's accuracy on successful cast**, any element, one-use and nonstacking. Only a successful Wind accuracy roll launches the tornado; missed runes still crumble without effects. Other cards, AI choices, turn confirmation and team sizes are unchanged.

---

## NEW — Tornado Barrage, Wind area attack (v0.53.0)

**[Play Wizardry with Tornado Barrage](https://wafflinyo.github.io/Wizardry/arena.html?v=0.53.0)**

A fifth card, **Tornado Barrage (Epic · Wind)**, summons a visibly rotating **low-poly, faceted tornado** from the center of the arena. Spiraling pebbles and broken stone are launched in independent rock volleys aimed at **every living opposing wizard** (1v1–4v4), each receiving **200 damage exactly once** when the rocks land. Rock impacts are small enough to leave animated wizard sprites and health plates visible. The tornado fades back into the arena floor after its attack. The card illustration is drawn using the **exact same tornado renderer**.

**Wind rune:** Automatically traces the wind swirl icon used on the card, with the existing gold sparks, success glow, or failed crumble. One card accuracy roll decides the entire area-wide attack; no manual tracing or selecting opponents.

**Tailwind buff:** On successful Wind impact the caster gains **≋ Tailwind**, a tappable, nonstacking one-use status granting **+10 percentage points to the accuracy of the next spell of ANY element** (70% → 80%; capped at 100%). Consumed by the next cast attempt even if it misses; it does not change damage and is earned only after successful Tornado Barrage. Tidal Echo is separate and unchanged.

**Casting UI:** Select Tornado Barrage and tap **Cast on All Enemies**, with no individual target. All other spells retain their existing one-person confirmation flow. Five slim collectible cards remain visible without sideways scrolling in phone portrait and compact landscape. CPU fighters may select Wind and hit all of their opponents too.

**Provisional balance:** Base 80% accuracy, 6 mana, 200 damage per opposing fighter. Existing spells and mechanics unchanged.

---

## UPDATED — Lady Estel floating healing orb and impact (v0.52.0)

**[Play the new Lady Estel healing animation](https://wafflinyo.github.io/Wizardry/arena.html?v=0.52.0)**

Lady Estel no longer shoots a continuous green beam. She **rises and creates a luminous green-gold orb**, which **detaches and floats along a curved path** with a short trail of separated light motes and Nature leaves toward the chosen allied wizard. The target receives a **large restorative green/gold bloom, expanding impact circle and drifting healing leaves**, with some small glints crossing over the wizard's torso; the entire blast does not conceal the HP bar. Lady Estel then **ascends and flies away**. The original approved white-robed winged goddess is unchanged; her atlas's beam-bearing frames are deliberately skipped so no beam appears.

**Gameplay synchronized to animation:** The spell uses explicit sequential states `estel-summon` (1,050ms), `estel-travel` (540–1,100ms based on actual target distance), `estel-impact` (720ms), and `estel-exit` (840ms). On successful 90% Nature rune, **750 HP is applied exactly once when the orb arrives** and not when Lady Estel begins the summon; a missed rune crumbles without an orb or heal. The healing amount remains capped by missing HP, does not revive defeated fighters, and targets allies only. The existing 5-mana cost and CPU healer choices remain unchanged. The independent sprite idle/recovery and every other spell are preserved.

---

## FIX — Lady Estel selectable ally targets (v0.51.1)

**[Test Lady Estel on the battlefield](https://wafflinyo.github.io/Wizardry/arena.html?v=0.51.1)**

The battle canvas previously **hard-coded enemy-only tap candidates** even when Lady Estel was selected. It now uses the card's own ally/enemy target rules, allowing the player to tap a living friendly wizard, including their own caster, in any battle size. The existing nameplates remain tappable, and valid healing recipients receive **green floor rings** instead of the offensive gold enemy selection rings. The **Choose target** dropdown now also selects the chosen ally and provides an alternative when units overlap on a phone screen. Players still must tap **Confirm Target** before the spell fires.

The heal remains 750 HP with the existing 90% accuracy and 5 mana. Healing respects friendly team, living status and HP maximum; a full-health ally may be selected but receives 0 HP. CPU healing choices and all other spells are unchanged.

---

## NEW — Lady Estel, Nature angel healing spell (v0.51.0)

**[Play Wizardry with Lady Estel](https://wafflinyo.github.io/Wizardry/arena.html?v=0.51.0)**

New fourth spell card **Lady Estel** summons an original angel-winged goddess in flowing white robes with a gold-and-emerald crown. In the eight-frame transparent animation she **rises from a green Nature sigil, spreads her feathered wings, sends green-gold light and leaves toward an allied wizard, then flies away**. The card uses her real animation artwork, rather than placeholder art.

**Healing:** A successful automatic **Nature leaf rune** restores **up to 750 HP** to one selected living ally, including the caster. It never exceeds maximum HP and cannot revive a defeated wizard. The user did not prescribe the card's cost or accuracy, so these are initial balance defaults: **5 mana and 90% accuracy**. Failed accuracy rolls heal nothing and display the usual rune crumble. The healing applies once at the blessing's impact beat.

**Ally targeting:** After choosing Lady Estel, players can tap a living teammate on the battlefield and must confirm the selection. Enemy spells still target opposing wizards. CPU wizards can choose the new heal card, target their most-injured living ally, and avoid using it on fully healthy teammates. If a target is defeated before a heal resolves, the action retargets to another living ally.

**Mobile:** The four spell cards now fit in one compact visible row without horizontal scrolling; names, icons, mana, damage/healing, accuracy and effects remain. Lady Estel has a matching green-and-gold Nature frame and leaf crest.

All other spell balance, Poseidon's success-only Tidal Echo/recharge, Volt's stun, colosseum art and wizard sprites are preserved.

---

## New — Smaller raccoon Professor Volt (v0.50.0)

**[Play Wizardry with the new small professor](https://wafflinyo.github.io/Wizardry/arena.html?v=0.50.0)**

The Lightning summon now uses the newly approved **little raccoon professor** artwork in a fresh **1024×512, eight-frame transparent WebP atlas**. His wild white hair, goggles, striped raccoon tail and both electro antennas are preserved, but the actual character has been **shrunk to approximately half a normal wizard's height**. On-canvas drawing dimensions were reduced from 326×293 to 220×196, with the visible little raccoon occupying only part of that transparent rectangle. Every pose uses the same 236-pixel boot/portal baseline to stop floating between frames. The circular floor shadow and magic rings are smaller, and the electrical beam now originates at the smaller professor's antenna tips, with reduced beam thickness. The card uses a frame from the same new eight-pose artwork.

**No gameplay balance changes:** 450 Lightning damage, 80% spell accuracy, 20% stun chance on a successful hit, one skipped enemy action, and 5 mana. The existing summoning stages, element rune, Poseidon's Wrath and Stone Golem are unchanged.

---

## POLISH — Professor Volt keeps his feet on the arena floor (v0.49.1)

**[Play Wizardry with Professor Volt](https://wafflinyo.github.io/Wizardry/arena.html?v=0.49.1)**

Professor Volt's eight transparent animation frames are now aligned using **frame-specific visible-boot / magic-portal baselines** so he stays grounded while bringing the two antennas together and firing his electric beam. The previously published v0.49.0 card and combat implementation remain: 450 damage, 80% accuracy by default, 20% stun chance on a successful hit, 5 mana, and exactly one skipped target action. The two existing spells, current battle colosseum, and Tidal Echo mechanics remain untouched.

---

## NEW — Professor Volt, Lightning summon (v0.49.0)

**[Play Wizardry with Professor Volt](https://wafflinyo.github.io/Wizardry/arena.html?v=0.49.0)**

New third spell card **Professor Volt** summons an original wild-haired animal inventor with an oversized white shock of hair, blue goggles, gold-trimmed purple lab coat, striped tail and **two handheld electric antennas**. The spell uses an authentic **eight-frame 4×2 transparent low-poly sprite sheet**; the professor materializes in electric energy, raises and brings his two rods together toward the chosen enemy, fires a branching cyan-white electric beam at the enemy's actual battlefield position, recoils, and magically vanishes. The card illustration is a genuine frame from that same animation, not placeholder artwork. The battlefield angle, current low-poly arena background and existing wizard sprites are unchanged.

**Card stats:** 450 base Lightning damage, **80% accuracy**, **20% stun chance on a successful hit**, **5 mana**. The accuracy/cost are provisional defaults since only damage and stun chance were specified. Accuracy is determined by the existing automatic rune roll; no manual tracing. Lightning uses the already-established bolt symbol, automatic sparkling trace, successful glow and failed crumble.

**Stun is functional:** An enemy hit by a successful beam has a separate one-in-five chance to become **STUNNED**. If its turn hasn't happened yet in the current resolution, that action gets cancelled; otherwise the stun blocks its next round's action. Each proc skips at most one action and displays a tappable ⚡ stun-status icon and an event message. A miss, a dead target, or an ordinary hit without the stun proc causes no stun. The stun wears off after the skipped action, including if the victim cannot queue in the affected round.

**Three cards on mobile:** The playing-card hand is reflowed into three narrow portrait cards visible simultaneously, with element crests inside their top borders, upper-right mana badges, full spell-art panels and stat/effect rows.

Existing Poseidon and Golem stats, art, elemental runes, Tidal Echo/recharge logic, AI choices and targeting rules are preserved.

---

## NEW — Approved visual colosseum artwork in the live arena (v0.48.0)

**[Play Wizardry with the actual reference-inspired arena](https://wafflinyo.github.io/Wizardry/arena.html?v=0.48.0)**

The previous v0.47.0 procedural polygon approximation did not match the approved colosseum concept. This version uses a **1000×620 game-ready WebP constructed directly from the approved concept artwork**, preserving its real background: blue-gray arches and columns, draped purple-gold banners, glowing cyan crystals, flaming braziers, central glowing crystal statue, carved turquoise compass, raised stone ring and golden front lip. The pictured placeholder fighters have been cleared and the floor reconstructed with faceted tile textures from the source artwork; **only the game's live animated wizard sprites are shown**. The source canvas, camera, team positions, HP bars, targeting and physics remain unchanged.

The background loads asynchronously **over a safe initial rendered frame**, and stays as a static pre-rendered canvas asset, so a failed/delayed art download cannot crash the battle or create a permanently empty screen. The live characters continue to be drawn separately, with their original idle/defeat/casting sprites, foot alignment and brighter gold contact-floor rings.

No changes to gameplay, 70%/85% accuracy, spell damage, Tidal Echo, rune timing, or summon/fissure effects.

---

## NEW — Low-poly crystal colosseum and grounded wizard feet (v0.47.0)

**[Play Wizardry with the low-poly arena](https://wafflinyo.github.io/Wizardry/arena.html?v=0.47.0)**

The **battle scene itself** now matches the approved low-poly colosseum direction, while retaining the **original shallow three-quarter side view**, exact 1000×620 canvas, left allies and right enemies, all 1v1–4v4 seat positions, and screen target hit boxes. The new offscreen-rendered arena background has faceted polygon paving, raised stone platform thickness with a gold near rim, angular masonry and archways, gold-trimmed banners, tall crystal clusters, burning braziers, and a low-poly cyan/gold magic compass in the middle. It is **not** the concept art image pasted over the game or an illustration with noninteractive fake fighters: the real approved sprites remain independently animated and fully interactive.

**No more floating:** Each wizard's animation-frame alpha is inspected **once per atlas** to find the bottom of its visible feet. Transparent image padding beneath the shoes is compensated when drawing the approved idle, casting, and kneeling/defeated poses, preserving the actual world-space ground position for each of 8 units. Under each set of feet is a low stone floor inlay with a concentrated boot-contact shadow and subtle gold/cyan faceted segments; the markers are engraved into the floor, not raised pedestals. The 3/4 visual depth scaling and combatant draw-order are preserved.

All spell and rune animations, card art, statuses, damage, targeting, 1.6-second trace and glow/crumble outcomes, and Poseidon's **success-only** recharge/Tidal Echo are unchanged.

---

## NEW — Slower rune tracing, successful glow, failed crumble (v0.46.0)

**[Play the updated arena](https://wafflinyo.github.io/Wizardry/arena.html?v=0.46.0)** · **[Preview successful and failed runes](https://wafflinyo.github.io/Wizardry/rune-preview.html?v=0.46.0)**

The actual card-element glyph traces **in 1,600 ms** instead of 850 ms, giving the golden swirling portal sparks and drawing tip more time to be seen. Both the player and CPU wizards use the same animation. When the rune's accuracy check succeeds, the entire completed symbol **holds and intensifies into a luminous 620 ms glow**, including rotating amber arcs and sparks; **only after the glow finishes** does the original approved Poseidon or Golem summon begin. When the rune fails, it **goes dark, splits into falling glyph-shaped fragments and crumbles for 700 ms**, then clears without displaying the old generic red X or summoning anything. The casting wizard stops waving immediately when the result is determined and lowers the staff during the glow/crumble.

The standalone rune preview includes **Successful glow** and **Failed crumble** toggles and the new timing. The rune shapes still match the water-drop/mountain icons on the actual cards.

**Spell mechanics unchanged:** Poseidon 70% accuracy, Stone Golem 85%, original damage/summon durations, fixed canvas dimensions and costume animations. Tidal Echo and recharge are still gained **only on a successful Poseidon cast**, never a failed cast.

---

## NEW — Element-symbol tracing with swirling magical sparks (v0.45.0)

**[Play the updated Wizardry arena](https://wafflinyo.github.io/Wizardry/arena.html?v=0.45.0)** · **[Preview the elemental runes](https://wafflinyo.github.io/Wizardry/rune-preview.html?v=0.45.0)**

The old random wavy Poseidon rune and generic jagged Stone Golem rune have been removed. Each cast now **traces the actual element emblem found at the top of its spell card**: the faceted **water droplet** or the distinctive **two-peak mountain silhouette**. The same 24×24 vector shapes are used so the tracing unmistakably matches the card.

The drawing tip moves along each symbol, leaving a glowing elemental core surrounded by a golden molten rim and **animated sparks streaming off the drawing tip and completed lines**, while short arcs of an amber magical ring swirl around the symbol. The effect resembles a bright rotating portal of magical sparks, but the rune itself remains clearly the chosen element. The renderer supports fire, air, light, shadow, nature, arcane, ice, and lightning symbols as well, ready for future spells.

**Combat and timing unchanged:** The original 850ms auto-tracing sequence still uses each card's independent accuracy roll. The spark effect is visual only and immediately ends at rune success/failure; the caster then lowers their staff. The approved idle/defeat character sprites, Poseidon trident and Golem fissure animations, card art, and conditional Tidal Echo/recharge rules are unchanged.

---

## NEW — Element icons on spell cards (v0.44.1)

**[Play with element-specific card crests](https://wafflinyo.github.io/Wizardry/arena.html?v=0.44.1)**

Card crests now display **meaningful low-poly element emblems** rather than a decorative trident or diamond. Water shows a **faceted water droplet**, Earth a **double mountain**, and future spell schools automatically have distinct icons for **fire (flame), air (wind), light (sun/star), shadow (crescent), nature (leaf), arcane (crystal), ice (snowflake), and lightning/storm (bolt)**. These are separate local vector assets, not font glyphs, so they display consistently on iPhone and desktop. The crest sits inside the same gold-bordered top cap, above the rarity labels, and is sized down for landscape.

The slimmer, taller card frames, top-right mana counter, spell frame artwork, and all combat mechanics remain intact. Poseidon's Wrath still grants both recharge and Tidal Echo only on a successful cast.

---

## NEW — Proper slim playing-card layout (v0.44.0)

**[Play the latest Wizardry arena](https://wafflinyo.github.io/Wizardry/arena.html?v=0.44.0)**

Both approved spell cards have been rebuilt as distinctly narrower, taller portrait playing cards. The blue trident and earth diamond crests are **integrated inside the upper border**, with the rarity label in a separate row below so neither overlaps. Mana costs are **small badges in the top-right corner of each card**, rather than large hexagons overlapping the summon illustration. The spell-art panels preserve their original in-game animation frames: Poseidon is gripping his raised trident and Stone Golem is the approved low-poly sprite.

The damage row is simplified to damage and hit accuracy (the spell element is already visible in the rarity header) so labels fit on narrow phones. Portrait and compact landscape sizes are explicitly adjusted; both cards remain fully visible without scrolling sideways. The styles use a **new stylesheet filename** to invalidate the previous mobile CSS and remove its floating-symbol rules.

**Spell mechanics unchanged:** Poseidon's Wrath still grants **Tidal Echo +30% and one-round recharge only on successful casts**; misses grant neither. Damage, accuracy, targeting, and animation timing unchanged.

---

## FIX — Element crest icons raised above card rarity text (v0.43.3)

**[Play with raised card symbols](https://wafflinyo.github.io/Wizardry/arena.html?v=0.43.3)**

The decorative blue trident and gold earth-diamond crests have been moved **further up relative to each card** (13 additional CSS pixels, with 12 pixels on compact landscape), and the card row now has extra reserved space above the borders. Neither crest should cover **LEGENDARY · WATER** or **EPIC · EARTH**. The card portrait proportions, existing summon artwork, mana shields, spell names, damage/accuracy and Tidal Echo rules remain unchanged.

The stylesheet now has a **new filename**, `assets/spell-cards-v44.css`, to ensure browsers do not keep loading an older cached card layout.

---

## FIX — Card crest symbols no longer cover rarity labels (v0.43.2)

**[Play Wizardry with corrected spell cards](https://wafflinyo.github.io/Wizardry/arena.html?v=0.43.2)**

The water trident and earth diamond badges now sit completely **above the top gold borders** of the two low-poly playing cards, instead of overlapping the **LEGENDARY · WATER** and **EPIC · EARTH** labels. Reserved padding keeps both crests within the card row without making the hand taller. In compact landscape mode the crests scale down slightly to preserve text space. Mana cost badges, card illustration frames, card names, selected-state highlights, damage, accuracy, and successful-cast-only Poseidon's Tidal Echo and recharge rules remain unchanged.

---

## RULE UPDATE — Poseidon's Wrath has no penalties or rewards on miss (v0.43.1)

**[Play Wizardry with portrait spell cards](https://wafflinyo.github.io/Wizardry/arena.html?v=0.43.1)**

After a **successful** Poseidon's Wrath cast, the caster must **recharge one round** and gains **Tidal Echo** (+30% damage on the next successful Water hit). If the rune **fails/misses**, **neither recharge nor Tidal Echo is granted**, and the caster can attempt another spell next round as normal. Existing previously earned Tidal Echo remains if it was not consumed. The updated Poseidon card explicitly labels both effects as on-hit.

The v0.43.0 slimmer portrait low-poly spell cards remain, with real in-game animation artwork. Poseidon uses the authentic raised-trident frame 7 and Stone Golem its approved animation frame 10. No other spell mechanics or card sizing changed.

---

## NEW — Portrait spell cards and corrected Tidal Echo (v0.43.0)

**[Play updated Wizardry](https://wafflinyo.github.io/Wizardry/arena.html?v=0.43.0)**

The two cards use narrow portrait proportions, independent low-poly element framing, gold-trimmed rarity labels, hexagonal mana badges, original summon-animation artwork, spell nameplates and separate damage/accuracy information. Both cards remain visible in portrait and landscape without horizontal scrolling. Poseidon's Wrath displays the real **frame 7** in which Poseidon is physically **holding his raised trident**; Stone Golem uses its approved original summon animation artwork.

**Tidal Echo correction:** Poseidon's Wrath only grants/refreshes Tidal Echo (+30% on next successful Water hit) if its rune successfully completes. A miss grants no new bonus. The usual one-round recharge still applies whether the spell hits or misses. An earlier existing Echo is not consumed by a failed Water spell.

No combat damage, accuracy, canvas dimensions, or summon/defeat animations were changed.

---

## RESTORED — Approved Stone Golem slam + independent fissure (v0.42.0)

**[Battle](https://wafflinyo.github.io/Wizardry/arena.html?v=0.42.0)** · **[Animation preview](https://wafflinyo.github.io/Wizardry/golem-preview.html?v=0.42.0)**

The Stone Golem is back to the **exact original 16-frame approved sprites**, in their real sequence: rises from the ground (frames 0–3), **clasps both fists** (4–5), **winds up overhead** (6–7), **smashes the ground** (8–11), stands back up (12–13), briefly idles, then sinks into the earth (14–15). The golem is never used as a moving projectile.

Two new **separate, transparent animations** replace all v0.40 synthetic rock overlays: an eight-frame repeating lime-green, faceted stone fissure that moves on the ground from the slam to the selected enemy at a distance-aware speed; and an eight-frame growing/dissolving impact burst at the target's feet. The golem's idle/unsummon timeline runs **independently while the fissure travels**. Damage is still applied only when the travel animation arrives. Only a thin section of the actual impact sprite is rendered over the target's boots; HP/status plates stay unobscured.

Unchanged: Golem 85% accuracy and 900 base damage; Poseidon's Wrath; wizard outfits, spell tracing, defeated kneeling pose, and fixed arena dimensions. The separate golem animation now takes its own stage timings so rock travel can reach targets naturally in every lane.

---

## REBUILT — Stone Golem's three-part spell animation (v0.41.0)

**[Play battle](https://wafflinyo.github.io/Wizardry/arena.html?v=0.41.0)** · **[Test animation alone](https://wafflinyo.github.io/Wizardry/golem-preview.html?v=0.41.0)**

Stone Golem is now a three-stage, sprite-based animation with independent clocks. The golem appears and **slams** (950 ms), then an **eight-frame looping rocky fissure** moves toward the selected enemy at a consistent speed (~0.34 arena pixels/ms, clamped to 700–1280 ms depending on distance). Its moving position is calculated in world coordinates from arena center to the target's actual ground anchor. The fissure is a separate textured sprite animation, baked from approved Golem fissure art, **not** the previous procedural crack/ridge code. On contact, damage is applied exactly once, and a separate **eight-frame impact burst** plays for 520 ms. The golem remains present during travel/impact. Everything is drawn in proper arena layers, with the impact visible over boots and below HP labels.

The previous hand-drawn fissure, rock-front, and extra foreground-overlay functions are removed entirely. Stone Golem still has 85% accuracy and 900 base damage; failed runes still fizzle without creating a golem or hitting anyone. Poseidon's Wrath, the wizard's animations and customization, and the fixed battle frame are unchanged. The Stone Golem's total animation time now scales slightly with target distance so the travel never stops early. A separate interactive preview includes near, far, and opposite-side targets.

---

## FIX — Stone Golem traveling rock-front reaches target (v0.40.0)

**[Play Wizardry v0.40.0](https://wafflinyo.github.io/Wizardry/arena.html?v=0.40.0)**

Stone Golem now sends a clearly visible **three-stone advancing head** along the full fissure rather than showing only stationary spikes that stop short. The tip follows the same continuous world-space path all the way to the chosen wizard's **foot anchor** at the 62% damage moment, comparable to Poseidon's moving trident. A 22-segment rocky trail grows behind it. At contact, tall rock shards, debris and an earth shock ring burst out around the target. A small foreground layer puts rocks above the **boots**, while preserving fighter body/face readability and keeping health/status plates in front. Stone fragments persist briefly after contact, making the hit readable on mobile.

No changes to card hit chance (85%), base damage (900), total Golem spell duration (2850 ms), rune tracing (850 ms), character costumes, knockout logic or battlefield size.

---

## FIX — Stone Golem fissure visibly reaches the enemy (v0.39.0)

**[Play updated battle](https://wafflinyo.github.io/Wizardry/arena.html?v=0.39.0)**

The Stone Golem's old thin green crack ended before the selected target and disappeared at the damage moment. It has been replaced by a deterministic, low-poly **traveling ridge of jagged earth and rock spikes** extending from the summoned golem's location all the way to **the target's feet** in world coordinates (including enemies in every lane and either PvP side). A crater, rising stones and flying stone chips appear at the exact 62%-through-spell damage timing. A subtle momentary target flinch makes contact clear. The effects stay behind the characters so they don't obscure the wizard models or HP plates. The old approved golem sprite artwork remains intact.

Unchanged: 85% hit chance, 900 base damage, 2850ms summon, 850ms tracing, wizard animation timings, kneeling defeat animation, and arena dimensions.

---

## NEW — Wizard appearance palettes (v0.38.0)

**[Customize the wizard in-game](https://wafflinyo.github.io/Wizardry/arena.html?v=0.38.0)**

Choose from 10 separate **robe colors**, 10 **hat colors**, and nine **skin tones**. Customizing only colors does not replace the low-poly art with the old procedural model: it recolors the approved animated 12-frame idle, 16-frame casting, and eight-frame defeat atlases, preserving depth shading, gold trim, staff and beard. Each of the eight combatant slots starts in a different coordinated look, but all still use the same character and casting/death sequences. The controllable wizard's look updates immediately and is saved locally across battles and reloads. Older alternate hat shapes and robe cuts remain selectable, using the prior geometry model when chosen.

Stats, HP, CPU control, rune success odds, damage, spell animation timing, and stable canvas dimensions are unchanged.

---

## NEW — One-shot kneeling defeat animation (v0.37.0)

**[Play battle with defeat animation](https://wafflinyo.github.io/Wizardry/arena.html?v=0.37.0)**

All 1v1–4v4 wizard slots now use the approved eight-frame transparent defeat sequence at a lethal hit (HP falls to zero). The single-staff wizard raises his hands/staff, lowers them, drops to his knees, folds forward with head down, and **holds the final kneeling-ball pose until the battle resets**. The 745ms sequence plays once per character, not on every render. Idle breathing and casting are suspended for defeated units. The enemy side is automatically mirrored to face inward, and the original position/depth order remains unchanged. Defeated wizards stay visible even beneath the victory announcement. All player/CPU action rules, damage, accuracy, rune timing, summoned spell art, and fixed canvas dimensions stay unchanged.

---

## NEW — Approved wizard in every battle slot (v0.36.0)

**[Open Wizardry 1v1–4v4 battle](https://wafflinyo.github.io/Wizardry/arena.html?v=0.36.0)**

Every ally and opponent in **Story / CPU** and **PvP local test** now starts with the same approved purple-and-gold low-poly wizard from the existing 12-frame idle and 16-frame casting atlas. All four positions on both sides render the exact same character art with the enemy team mirrored to face inward; depth scaling, target arrows, HP/status plates and painter's order remain unchanged. Idle breathing is slightly desynchronized between characters so the eight wizards don't bob together. Each individual caster runs the same raise → trace → immediate recovery/idle on rune success or failure, with its own action timing. Spell summons and failure effects play independently behind all models.

The wizard appearance is intentionally the same in every slot for this design test; team identity, stats, AI decisions, targeting and cards are unchanged. Existing Customize controls still let a human choose a different costume (falling back to the prior procedural model). The 850 ms trace, Poseidon 2550 ms and Golem 2850 ms timings and the fixed battle-canvas sizing remain intact.

---

## UPDATE — Staff waving stops at rune outcome (v0.35.0)

**[Play Wizardry battle v0.35.0](https://wafflinyo.github.io/Wizardry/arena.html?v=0.35.0)**

The top allied wizard waves the staff **only during the 850 ms rune tracing phase**. When the rune accuracy check succeeds or fails, the staff immediately begins a 520 ms lowering/recovery animation, concurrent with the summon or fizzle. Once lowered, the wizard stays in the 12-frame breathing idle even if the spell's full 2550/2850 ms summon animation is still playing. The combat stage machine, damage, accuracy, recharge, spell effects, HUD and fixed arena dimensions remain unchanged. Failed casts finish their lowering across the short 360 ms fizzle and early post-fizzle stage so the arm does not snap back.

---

## NEW — Stable battlefield layout + slower spell effects (v0.34.0)

**[Play updated Wizardry battle](https://wafflinyo.github.io/Wizardry/arena.html?v=0.34.0)**

- The **battle canvas stays at a 1000×620 drawing buffer with a stable 1000:620 displayed frame** while spell phases and HUD hints change. The arena no longer flex-shrinks when the turn hint wraps or the Confirm Target button disappears. Mobile browser address-bar changes use stable `svh` dimensions for arena sizing, retaining portrait/landscape layouts.
- All combatants now trace runes for **850ms** (previously 570ms); the top wizard's trace-wave frame tempo is also slightly slower (130ms per frame, previously 110ms).
- Poseidon's Wrath now runs **2550ms** (was 2100ms); Stone Golem **2850ms** (was 2360ms). The same approved summon art, impact timing proportions, damage, accuracy, recharge, and targeting behavior are preserved.
- No change to the 12-frame idle, 16-frame cast atlas, or sprites' depth order.

---

## NEW — Smoother approved wizard animations in battle (v0.33.0)

**[Battle test with approved animations](https://wafflinyo.github.io/Wizardry/arena.html?v=0.33.0)**

The first allied wizard now uses the approved 12-frame idle and 16-frame casting sequence from the last visual previews, packaged into a single transparent 128px-cell sprite atlas. His complete body and sole staff are rendered together, replacing the old rig's additional staff. Casting progresses through extend → repeatedly wave staff during rune tracing and summon/failure → lower/recover → idle. The same animation is used in the top slot, with the existing arena position, depth ordering, spell effects, cards, and target selection unchanged. Changes to customization switch to the previous customizable procedural model.

---

## FIXED — One staff, two skeletal rig animations (v0.32.0)

**[Test the rigged idle and casting motions](https://wafflinyo.github.io/Wizardry/rig-preview.html?v=0.32.0)** · **[Open updated battle](https://wafflinyo.github.io/Wizardry/arena.html?v=0.32.0)**

Previously, the artist's original staff remained baked into the body image while another was attached by code, producing two. The old staff and forearm are now removed from the original image layer and the hidden robe panels are reconstructed. A single staff prop, at one mathematically fixed length, is attached to the animated hand. An articulated shoulder, elbow and wrist are used for the entire clip. **Idle** gently bobs while facing down-right; **casting** extends the arm, continuously waves the rigid staff while the magic rune traces and the spell resolves, then lowers naturally on either success or failure. Feet remain planted. No effect particles are added to the character rig.

The new demo has independent Idle, Casting and Cycle buttons. Only the top ally's default amethyst, classic robe, pointed-hat appearance uses this rig; other outfits and units retain their previous customization/fallback. Existing spell damage, accuracy, cards and rendering order are unchanged.

---

## NEW — Rigged top-slot wizard casting (v0.31.0)

**[Play 2.5D battle](https://wafflinyo.github.io/Wizardry/arena.html?v=0.31.0)** · **[Open standalone rig test](https://wafflinyo.github.io/Wizardry/rig-preview.html?v=0.31.0)**

The top allied wizard now has a code-driven **2D skeletal rig** using the same low-poly body art, an articulated shoulder/elbow/hand, and ONE rigid staff graphic. The staff cannot change physical length. Casting uses the existing raise, rune trace, summon/fizzle, and lower stage machine; during rune tracing, the staff actively waves in a looping figure-eight. The wizard's foot placement and angle do not change. The main Canvas still renders spell visuals behind fighters. Appearance customization and non-rigged characters retain the original geometry fallback.

This is **not** a rigged 3D mesh: the source image is a flat render. The separate rig test allows repeat/replay without changing battle rules. No spell damages, accuracy, or effects were modified.

---

## NEW — Approved top-slot wizard idle in the arena (v0.30.0)

**[Play the battle scene with the new wizard](https://wafflinyo.github.io/Wizardry/arena.html?v=0.30.0)**

- The first allied wizard (top slot / Tidecaller) now uses the approved purple-and-gold low-poly wizard art from the idle-design preview, with a transparent background and a subtle smooth upward-and-downward breathing loop.
- Its feet remain anchored to the correct arena lane, the image renders in the main Canvas with proper depth ordering, and spell summons remain behind fighters. The other wizards and enemy models are unchanged.
- The default pointed-hat/classic-robe/Amethyst appearance uses the sprite. Changing hat, robe, or color in Customize switches back to the procedural model so those customizations still work. A missing image also falls back safely.
- This update changes the **idle battle appearance only**, not combat calculations or casting-frame artwork. The attached eight-frame GIF has been converted into an optimized static model frame, with breathing driven by game time for stable looping on mobile.

---

## NEW — Exact approved splash-art cards + Poseidon recharge & Tidal Echo (v0.29)

**[Play the updated Wizardry 2.5D Battle Test](https://wafflinyo.github.io/Wizardry/arena.html?v=0.29.0)**

The two ornate, non-scrolling cards now show actual **approved game animation frames** instead of unrelated concept art: Poseidon's trident-raised frame and Stone Golem's seismic fissure frame. Each card displays its mana cost, spell name, damage, accuracy, and the currently implemented effect. **The live 16-frame summon sprites have not been edited.**

- **Poseidon's Wrath:** 8 mana, **1,200 Water damage**, **70% accuracy**. After casting (hit or miss), the wizard **must skip the next round to recharge** and gains **Tidal Echo**: **+30% to their next successful damaging Water spell**. The buff persists through Earth spells and missed Water spells, and does not stack.
- **Stone Golem:** 6 mana, **900 Earth damage**, **85% accuracy**, original seismic fissure. No new ability.

The status effects appear as small, tappable magical runes **beneath the affected fighter's HP bar**: amber ⧖ for Recharge and cyan ≈ for Tidal Echo. Tapping an icon opens its detailed description. Both player and CPU casters use the same mechanics.

Story mode still lets you control one wizard, with CPU teammates; choose a card, tap an enemy and **Confirm Target**. Spell art still renders behind the standing fighters. No online accounts, friend lobbies or ranked matching are enabled yet. See [ARENA_TEST.md](ARENA_TEST.md) for rules and test instructions.

---

# Wizardry — Spellcasting Prototype v0.23.0

**Play:** https://wafflinyo.github.io/Wizardry/?v=0.23.0

A mobile-friendly elemental spell-card game, featuring Poseidon's Wrath (Water) and Stone Golem (Earth), each animated using exactly **16 original approved frames**.

## Stone Golem — approved 16-frame artwork (v0.23)

The Golem's artwork is **the exact user-approved 4×4 sprite sheet, without any image edits**. It is split into four losslessly compressed WebP rows, each validated pixel-for-pixel against the supplied source image. No vector rebuilding, generative in-betweens, retouching, recoloring, crossfades or duplicate seismic spike effects are involved.

The four sprite resources are:

- `assets/stone-golem-approved-v23-row0.js` — rise (frames 0–3)
- `assets/stone-golem-approved-v23-row1.js` — clasp and overhead windup (frames 4–7)
- `assets/stone-golem-approved-v23-row2.js` — ground slam and fissure propagation (frames 8–11)
- `assets/stone-golem-approved-v23-row3.js` — final fissure, idle, rubble collapse (frames 12–15)

The fissure reaches its last frame immediately before the registered **900 Earth damage** at game-time 2.87s. The spikes then clear, Golem returns to idle, and the last two original frames show him breaking back into rubble underground. No extra geometric spike system plays on top of the sprite.

At displayed Speed 1×, Golem's **5.01 game-seconds** run at a 2.125× effective animation rate, completing in about **2.36 real seconds**—slightly slower than Poseidon's approximately **2.10 seconds**. All 16 cells render in order. The Earth card portrait uses the same approved standing frame #3.

## Poseidon's Wrath

Poseidon's existing **16 approved low-poly frames** and release-to-projectile handoff remain unchanged. The trident flies to the Stone Sentinel and deals **1,200 Water damage** at impact.

The game uses Canvas 2D for the entire battle and maintains a fixed 1000×560 internal resolution. CSS handles only the surrounding card/control layout.

## Verification

Automated Canvas tests at 60 Hz and 120 Hz verified all 16 Stone Golem frame indices, the 900 damage on fissure impact, a subsequent 1,200-damage Poseidon spell, round completion, reset, frame loading and only one Canvas size initialization. These simulations do not substitute for testing the appearance on a physical iPhone.
