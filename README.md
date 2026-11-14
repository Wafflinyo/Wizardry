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
