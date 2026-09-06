## Phase 12 — Quests (2026-09-06)

- Added `QuestSystem` as the sole runtime owner for quest progress, completion, and claimed state.
- Added centralized quest definitions and validation.
- Added event-driven objectives for enemy defeats, waves, defense placement, merges, bosses, and item acquisition.
- Added controlled reward-claim flow through EventBus and Game coordination.
- Added quest persistence and save validation.
- Added presentation-only `QuestUI`.
- Fixed a boss reward duplication path in the generic `EnemyDied` handler.
- Fixed world modifiers not being inherited by newly spawned/placed runtime objects.
- Added Phase 12 regression coverage.

## Phase 11 — World Systems (2026-09-06)

- Added deterministic day/night cycle.
- Added data-driven clear/rain/storm weather definitions.
- Added environmental modifiers for defense range, enemy speed, ocean motion, and fog.
- Added timed dynamic world events with EventBus lifecycle contracts.
- Added Phase 11 regression coverage.

[2026-09-06] — Phase 10: Bosses

**Phase 10 — Bosses implemented and gate passed.**

- Added centralized boss definitions and validation.
- Added periodic boss waves through WaveOrchestrator using the existing EnemyManager/Enemy path.
- Added boss phases, enrage, special ability timing, rewards, BossUI, and VFX/audio request hooks.
- Added 7 dedicated Phase 10 tests.
- Full regression: 153/153 tests passing.

[2026-09-06] — Phase 8: Merge

**Phase 8 — Merge implemented and gate passed.**

Added

- `src/merge/MergeSystem.js` — deterministic validation/execution boundary.
- `CONFIG.MERGE` — data-driven recipe definitions and wave material reward.
- Merge-owned persistent item quantities inside `GameState.collection.items`; this is intentionally only the slice required by Phase 8, not the full Phase 9 Collection System.
- `DataContracts.validateMergeDefinition()` plus startup validation of merge recipes.
- Save serialization/validation/application of merge collection ownership.
- `MergeStarted`, `MergeCompleted`, `MergeRejected`, `ItemAcquired`, `ItemConsumed`, and `CollectionChanged` events.
- Wave completion grants one `cannon_core` per completed wave, making the merge material obtainable through normal play.
- Successful `reinforced_cannon_core` merge consumes 3 `cannon_core`, costs 30 currency, creates 1 result, and grants 20 XP when the player is level 3+.
- `tests/phase8-merge.test.js` regression coverage.

Result

Phase 8 gate: PASSED. Merge operations are deterministic, validated, testable, and persistent.

---

Infinity Depths — Changelog

Purpose

This file records meaningful changes to the Infinity Depths project.

It records what changed in the project over time.

It must not be used as a future feature list.

Only implemented, verified, or explicitly documented project changes belong here.

---

[2026-09-06] — Vertical Slice Gate Closed; Phase 6: Economy

**Vertical Slice Gate (Phase 5) marked PASSED.** All 5 gate criteria
from ROADMAP.md are now met: functional (99 automated tests),
architectural (Architecture Gate already passed), on mobile
(verified by the project owner on a real phone's browser — the
current target platform; native packaging is intentionally
deferred per TECHNICAL_RULES.md), acceptable performance (no
issues reported), and through save/reload (existing tests). See
PROJECT_STATE.md §2 for the full record.

**Phase 6 — Economy implemented** (single-currency scope; GAME_SPEC.md
§24 explicitly leaves multi-resource design undecided, so this phase
does not invent new resource types).

Changed

- `src/economy/EconomySystem.js` — added a single validation gate
  (`_sanitizeAmount`) used by every method. Previously
  `Math.max(0, Number(x) || 0)` let `Infinity` through unchanged
  (`Infinity || 0` is `Infinity`, and `Math.max(0, Infinity)` is
  `Infinity`). Now NaN, Infinity, and negative values are all
  rejected and treated as 0, matching SAVE_SCHEMA.md §10 and
  GAME_SPEC.md §48 ("Validate resource transactions"). `add()` also
  re-sanitizes the resulting balance, so an externally-corrupted
  `balance` field self-heals to 0 on the next transaction instead of
  propagating `Infinity`.
- `src/core/GameState.js` — removed `canAfford()`, `spendCurrency()`,
  and `rewardEnemyKill()`. These were dead code: nothing in the
  codebase called them anymore (verified by a full-repository
  search), and their comments described a currency-ownership
  migration to `EconomySystem` that had, in fact, already completed
  in a previous phase — the comments were simply stale.
  `player.currency` is now documented as a persisted snapshot only.
  Also: `player.currency` now initializes from
  `CONFIG.ECONOMY.STARTING_CURRENCY` instead of a bare `0`.
- `src/core/Config.js` — added an `ECONOMY` section
  (`STARTING_CURRENCY`) as the balancing foundation the Phase 6 gate
  requires, following the project's existing "important numbers are
  centralized" convention (GAME_SPEC.md §78).
- `src/save/SaveManager.js` — `serialize()`'s currency field had the
  same `Infinity`-passthrough gap as EconomySystem (fixed above) and
  now uses an explicit `Number.isFinite` guard. `validate()` (the
  load-side check) already guarded against this correctly — the gap
  was write-side only.
- `src/core/Game.js` — wires the new `EconomyUI` alongside
  `BaseHUD`/`WaveUI`.

Added

- `src/ui/EconomyUI.js` — the game previously had no currency display
  anywhere. New display-only HUD (top-left, matching `BaseHUD`'s
  style) that shows the live balance via the `CurrencyChanged` event
  and never calls `canAfford`/`spend`/`add` itself (GAME_SPEC.md §48:
  "Avoid trusting UI state as authoritative gameplay state").
- `tests/phase6-economy.test.js` — validation (NaN/Infinity/negative
  rejection), single-ownership (GameState no longer exposes currency
  methods), save-guard (SaveManager currency serialization), and
  EconomyUI display/boundary tests.
- `index.html` — added the `EconomyUI.js` script tag; bumped all
  script cache-busting query strings from `?v=14` to `?v=15`
  (existing convention — see the `?v=13`→`?v=14` entry below).

Regression fixes required by the above

- `tests/phase4-foundation.test.js`, `tests/phase4-integration.test.js`,
  `tests/phase4-regression.test.js` — their `CONFIG` stubs used to
  load `GameState.js` were missing `ECONOMY.STARTING_CURRENCY`,
  which the GameState change above now requires. Added.
- `tests/phase5-boot-order.test.js` — added `EconomyUI.js` to
  `SCRIPT_ORDER` (matching its new position in index.html) and to
  `EXPECTED_SINGLETONS`.

Result: 112/112 automated tests passing (99 pre-existing + 13 new
Phase 6 tests). Real-device/browser verification of Phase 6 by the
project owner is still pending — see PROJECT_STATE.md §2.

---

[2026-09-05] — Phase 5: Two Real Bugs Found by Manual Verification, Fixed + Regression-Tested

Manual browser testing of the vertical slice (the objective from the
previous CHANGELOG entry) surfaced two real gameplay-breaking bugs.
Both are fixed below; a third symptom reported alongside them turned
out not to be a bug (see "Investigated, not a bug").

Fixed

- **Wave never advances if any enemy reaches the base.**
  `WaveOrchestrator` only counted enemies toward wave completion via
  `handleEnemyDied()`, called solely from Game.js's `EnemyDied`
  handler. An enemy that reached the base instead of dying was never
  counted, so `defeatedEnemies` could never reach `enemyCount` for
  that wave, and the wave (and the whole game) hung forever — no
  Game Over, no next wave. Added
  `WaveOrchestrator.handleEnemyReachedBase()` (reuses
  `WaveManager.registerEnemyDefeat()`, grants no currency reward —
  reward stays exclusive to `EnemyDied`), wired to Game.js's
  `EnemyReachedBase` handler. Covered by two new tests in
  `tests/phase5-vertical-slice.test.js`: an all-reached-base wave
  completes, and a mixed dead/reached-base wave completes exactly
  once without double-counting.

- **Collected treasures reappear as collectible after every page
  reload**, even though currency/base HP/wave/defenses correctly
  persisted. Root cause was two-fold: (1) `Interactables.js` kept its
  own local `_openedIds` state and never called
  `GameState.registerInteraction()` on collection, so
  `GameState.interactions.openedIds` — the only thing `SaveManager`
  actually persists — stayed empty forever regardless of how many
  treasures were collected; (2) `Interactables.create()` ran in
  Game.js *before* the save was loaded and applied to `GameState`,
  so even fixing (1) alone would not have been visible at creation
  time. Fixed by: reordering Game.js so `SaveManager.load()` +
  `applyToGameState()` run before `Interactables.create()`;
  `Interactables.create(scene, alreadyOpenedIds)` now accepts the
  already-opened id list as a plain parameter (Game.js reads it from
  `GameState.interactions.openedIds` and passes it in — Interactables
  itself still does not reference `GameState` directly, preserving
  the boundary enforced by
  `tests/phase4-architecture-audit.test.js`); Game.js now has an
  `InteractableConsumed` listener (the event already existed but had
  no listener) that calls `GameState.registerInteraction(id)`. New
  file `tests/phase5-interactables-persistence.test.js` (4 tests)
  covers: create() skips already-opened ids, create() with no list
  spawns everything (fresh game), interact() can't double-collect
  and emits the event with the right id, and an already-opened id is
  never spawned at all so it can't be interacted with again. Verified
  each new test actually fails against the pre-fix code before
  confirming it passes against the fix (same discipline as the
  boot-order test entry above).

Investigated, not a bug

- Base HP reaching a very low number (e.g. "1") after several waves
  is expected behavior of the current design, not a defect:
  `healBase()` exists on `GameState` but is never called anywhere —
  the base has one persistent HP pool for the entire run with no
  regeneration between waves, by design (see DECISIONS.md §"خسارة").
  Left unchanged; no test added since there is no incorrect behavior
  to guard against here.

Also (incidental, required by the fixes above)

- `tests/phase5-vertical-slice.test.js` grew from 9 to 11 tests;
  full suite is now 99/99 (was 93/93 after the boot-order entry).

---

[2026-09-05] — Phase 5: Boot-Order Regression Test (no gameplay changes)

Added

- `tests/phase5-boot-order.test.js` (4 new tests, 93/93 total now
  passing). Loads every `src/` file in the exact literal order
  declared in `index.html`, inside one shared `vm` context — the
  same way classic `<script>` tags share one global lexical scope in
  a real browser — without calling `Game.init()` (which needs real
  WebGL/DOM and is out of scope for this environment).
- This specifically targets the class of bug described in
  PROJECT_STATE.md §45 Risk 7 (a top-level `class` identifier
  silently shadowing a same-named singleton export), which no prior
  test caught because prior tests either load files into isolated
  per-system contexts or check file contents rather than the actual
  shared-scope runtime resolution order.
- Verified the new test actually catches this bug class: temporarily
  reintroduced the exact Risk 7 pattern into `WaveManager.js`
  (renaming `WaveManagerClass` back to `WaveManager`) — the new test
  failed with `WaveManagerClass is not defined` as expected, then the
  change was reverted and the suite is green again (93/93).
- No source file under `src/` was modified by this entry. This is a
  test-only addition; it does not change or claim to change gameplay
  behavior.

Not done by this entry (still open, see PROJECT_STATE.md §54)

- Real browser/mobile verification of the Vertical Slice. This
  sandboxed environment has no network access to download a
  Chromium/Playwright browser binary and no display, so `Game.init()`
  (which needs real WebGL) still cannot be executed end-to-end here.
  This boot-order test only proves script *load* order is safe; it
  does not replace real-device verification.

---

[2026-09-05] — Phase 5 Vertical Slice: Boot-Crash Fixes + Wave Orchestration

Fixed (critical — the game did not run before this entry)

- WaveManager.js declared `class WaveManager` at the top level of a
  classic `<script>`, which creates a global *lexical* binding that
  shadows any same-named `globalThis`/`window` property for every
  later `<script>` on the page. Every call site in the project
  (Game.js, debug HUD) used `WaveManager` as the singleton instance
  (`WaveManager.init()`, `WaveManager.isGameOver()`), so every such
  call threw `TypeError` immediately on page load. The class was
  renamed to `WaveManagerClass`; only the singleton instance is now
  exported as `WaveManager`, matching the plain-singleton-object
  convention already used by every other manager (EnemyManager,
  DefenseManager, EconomySystem, ...).
- `WaveManager.isGameOver()` was called every frame from Game.js's
  main loop but did not exist anywhere in the codebase. Added it
  (`return this.baseDestroyed`).
- Three Phase 4 Architecture Gate tests were failing (Economy,
  EventBus, BaseHUD) because their static "no GameState dependency"
  text check matched the literal word "GameState" inside Arabic
  documentation comments, not an actual code dependency. Reworded
  the three comments so they describe the boundary without the
  literal identifier. All 56 previously-existing tests now pass
  (were 53/56 in the uploaded snapshot).

Added

- `src/waves/WaveOrchestrator.js` — the missing link between
  `CONFIG.WAVES` (already fully data-driven: base enemy stats +
  per-wave scaling for HP/Speed/Armor/Damage/Reward/Quantity) and
  actual gameplay. Before this, `WaveManager.startWave()` was never
  called by anything in the entire project, so no wave — and no
  enemy — ever spawned. WaveOrchestrator now:
  - Runs the pre-first-wave and between-wave countdowns
    (`TIME_BEFORE_FIRST_WAVE`, `TIME_BETWEEN_WAVES`).
  - Computes each wave's enemy template and quantity from
    `CONFIG.WAVES.SCALING`.
  - Spawns enemies over time through `EnemyManager.spawnEnemy()` at
    `SPAWN_INTERVAL`, registering each spawn with
    `WaveManager.registerEnemySpawn()`.
  - Forwards `EnemyDied` into `WaveManager.registerEnemyDefeat()`
    (this connection did not exist before either).
  - Stops cleanly on `BaseDestroyed` (game-over state).
  - Exposes `getUIData()` consumed by `WaveUI`.
- Game.js now wires `WaveUI.init()` / `WaveUI.update()` (was created
  in an earlier phase but never initialized or fed data — the wave
  HUD never appeared) and subscribes to `BaseDestroyed` to call
  `GameOverUI.show(WaveManager.currentWave)` (also existed but was
  never triggered by anything — reaching 0 base HP silently froze
  gameplay systems with no screen shown).
- `tests/phase5-vertical-slice.test.js` — 9 new automated tests
  covering: WaveManager export identity, wave-scaling math against
  `CONFIG.WAVES`, and the full countdown → spawn → defeat →
  WaveCompleted → next-countdown loop, plus the BaseDestroyed
  shutdown path. 65/65 total tests pass.

Changed

- All `<script src="...?v=12">` cache-busting versions in
  index.html bumped to `?v=13` (files changed: EventBus.js,
  EconomySystem.js, BaseHUD.js, WaveManager.js, Game.js; new file:
  WaveOrchestrator.js).

Current Status

- The representative gameplay loop (Start → Defense → Wave → Enemy
  → Combat → Death → Reward → Wave Completion → Next Wave → Base
  Damage → Base Destruction → Game Over) now runs end-to-end for
  the first time. The Vertical Slice Gate itself (real-device/
  browser verification, persistence/reload behavior) has NOT been
  evaluated yet — see PROJECT_STATE.md.

---



Added

- Established the project documentation memory structure.
- Added/standardized documentation covering:
  - Project state
  - Game specification
  - Architecture
  - Roadmap
  - Technical rules
  - Development decisions
  - Testing
  - Save schema
  - Content pipeline
  - AI development protocol
  - Architecture debt

Documentation Rule

Project documentation must distinguish between:

- Current implementation
- Intended design
- Architecture
- Future work
- Decisions
- Testing evidence
- Known technical debt

No future feature may be recorded as implemented.

---

[2026-09-02] — Phase 0 Audit

Verified Existing Systems

The repository audit established that the project currently contains:

- Three.js-based 3D rendering
- Fixed-angle top-down camera
- Mobile touch input
- World/island environment
- Enemy system
- Enemy path following
- Wave system
- Defense system
- Projectile/combat system
- Basic interaction system
- Functional prototype UI
- Central game clock

Identified Missing Systems

The audit also confirmed that the following production systems are not yet implemented:

- Save system
- Complete economy system
- Complete progression system
- Merge system
- Collection/inventory system
- Boss system
- Quest system
- Weather system
- Day/night system
- Production audio system
- Production VFX system
- Production asset pipeline
- Automated testing infrastructure
- Formal performance baseline
- Native Android project
- Complete event architecture
- Complete data-contract architecture

Architectural Risks Identified

- "GameState" may grow into a God Object.
- Current manually loaded JavaScript architecture may become difficult to scale.
- Formal automated testing infrastructure is absent.
- Performance has not yet been measured systematically.
- Production asset contracts are not yet implemented.
- Save architecture is planned but not implemented.

---

---

[2026-09-05] — Phase 5: Save / Reload Boundary

Added

- src/save/SaveManager.js — serializes/validates/persists/restores the
  Vertical-Slice-relevant subset of game state (currency, level/xp/rank,
  base HP, current wave, placed defenses, opened-interaction ids). No
  Three.js/DOM/runtime object is ever serialized (SAVE_SCHEMA.md §5).
- DefenseManager.restoreDefense() — rebuilds a saved defense directly
  (no placement mode, no economy transaction, no overlap/build-zone
  checks — those only apply to newly-placed defenses). Existing
  placement logic (confirmPlacement) was not modified.
- tests/phase5-save-reload.test.js — 24 new automated tests covering
  serialize/validate/save/load, corrupted/invalid-save handling,
  applyTo* restoration, restoreDefense(), and a full save-then-reboot
  simulation.

Changed

- src/core/Game.js — on boot, loads and validates any existing save
  before EconomySystem.init() (GameState portion) and after
  WaveManager.init()/DefenseManager.init() (wave/defenses portion).
  Saves a checkpoint on WaveCompleted. Clears the save on
  BaseDestroyed so the existing "Retry" button (page reload) starts a
  genuinely new game — see DECISIONS.md DEC-019.
- index.html — added src/save/SaveManager.js (loaded before Game.js);
  bumped cache-busting query string to ?v=14 on all script tags.

Verified

- All 89 automated tests pass (65 pre-existing + 24 new), run via
  `node --test tests/*.test.js`.
- Static syntax validation of all touched/added files.

Not yet done

- Real browser/mobile manual verification of save/reload (requires an
  actual device — see PROJECT_STATE.md §54).
- Schema migration, backup save slot, and persistence for systems that
  do not exist yet (Progression/Collection/Quests) — out of scope for
  this pass, see PROJECT_STATE.md §27.

---

Current Status

The project is a functional prototype foundation with a working,
automated-tested Vertical Slice loop and a minimum-viable save/reload
boundary. Real browser/mobile manual verification is still outstanding.

It is not yet production-ready.

Current phase:

PHASE 5 — VERTICAL SLICE (not yet gated — see PROJECT_STATE.md §54)


## 2026-09-06 — Phase 9 Collection

- Added `CollectionSystem` as the sole runtime owner of collection state.
- Added data-driven collection definitions with rarity, category, unlock, stackability, merge eligibility, and upgrade limits.
- Added bounded ownership quantities and atomic item removal.
- Added deterministic level-based collection unlocks.
- Added per-item upgrade state and persistence.
- Reworked `MergeSystem` to consume/create through `CollectionSystem` in the runtime.
- Extended `SaveManager` collection persistence and validation.
- Added `CollectionUI` for collection visibility.
- Added 11 Phase 9 regression tests.
- Full suite: 147/147 passing.


## 0.13.0 — Phase 13 Advanced World

- Added data-driven NPC interactions.
- Added event-driven story chapters.
- Added special map-rule enforcement during tidal surge.
- Added advanced-world persistence and validation.
- Added 10 dedicated Phase 13 regression tests.
