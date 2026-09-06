Infinity Depths — Architecture Debt

Purpose

This document records known architectural weaknesses, risks, and deferred technical decisions in Infinity Depths.

Architecture debt must be visible and tracked.

It must not silently become implementation.

No debt item should be resolved by introducing unrelated systems or unnecessary refactoring.

---

1. Current Architecture Debt

AD-001 — GameState Responsibility Growth

Status: OPEN
Severity: MEDIUM

Problem

"src/core/GameState.js" currently contains several types of runtime state, including:

- Base state
- Economy state
- Progression-related state
- Interaction state
- Unlock state

As the project grows, this can turn into a God Object.

Risk

Future systems may begin placing unrelated state into "GameState", making dependencies difficult to understand and maintain.

Required Resolution

During the Architecture Foundation phase, determine clear boundaries between:

- Session state
- Level state
- Economy state
- Progression state
- Collection state
- World state
- Save state
- UI state

Constraint

Do not rewrite "GameState" blindly.

Existing working systems must be preserved and migrated only when justified.

---

2. Missing Event Architecture

ID: AD-002
Status: OPEN
Severity: MEDIUM

Problem

Current systems communicate partly through direct calls.

There is no centralized, formally defined gameplay event architecture.

Risk

As more systems are introduced, direct dependencies may increase.

Example:

Enemy Death
    ↓
Reward
Economy
Quest
Statistics
UI
VFX
Audio

Required Resolution

During Architecture Foundation, identify where events genuinely reduce coupling.

Events must have:

- Stable names
- Explicit payloads
- Clear ownership
- Defined producers
- Defined consumers

Constraint

Do not create an event for every interaction.

---

3. Missing Data Contracts

ID: AD-003
Status: OPEN
Severity: HIGH

Problem

The project does not yet have a complete formal data-contract layer.

Required Contracts

At minimum:

- EnemyDefinition
- DefenseDefinition
- BossDefinition
- RewardDefinition
- UpgradeDefinition
- QuestDefinition
- MapDefinition
- MergeDefinition

Risk

Without stable contracts, content systems may become tightly coupled to individual implementations.

Required Resolution

Define the contracts during Architecture Foundation.

Content should become primarily data-driven.

---

4. Missing Asset Contract

ID: AD-004
Status: OPEN
Severity: MEDIUM

Problem

Gameplay does not yet use a complete production asset registry architecture.

Intended Architecture

Gameplay
    ↓
Visual ID
    ↓
Asset Registry
    ↓
Model / Texture / Animation / VFX

Risk

Gameplay code could become directly dependent on individual asset implementations.

Required Resolution

Establish an asset contract before large-scale visual production.

---

5. Missing Save Architecture

ID: AD-005
Status: OPEN
Severity: HIGH

Problem

Runtime progress is currently lost when the page is reloaded.

There is no implemented:

- Versioned save
- Validation
- Migration
- Backup
- Recovery
- Corruption handling

Risk

Adding persistent systems without a stable save contract can create incompatible player data.

Required Resolution

Define the save contract before persistent progression systems expand.

---

6. Missing Automated Testing Infrastructure

ID: AD-006
Status: OPEN
Severity: HIGH

Problem

No formal automated testing infrastructure has been identified.

Missing Levels

- Static validation
- Unit tests
- Integration tests
- Gameplay tests
- Regression tests

Risk

As the codebase grows, regressions may become difficult to detect.

Required Resolution

Establish the minimum testing foundation during Architecture Foundation.

---

7. Missing Performance Baseline

ID: AD-007
Status: OPEN
Severity: HIGH

Problem

There is currently no measured performance baseline.

Missing Measurements

- FPS
- Frame time
- CPU usage
- GPU usage
- Memory
- Entity count
- Draw calls
- Loading time
- Long-session behavior

Risk

Optimization decisions may be based on assumptions rather than measurements.

Required Resolution

Create a measurable baseline before large-scale optimization.

---

8. Manual Script Loading / Build Infrastructure

ID: AD-008
Status: OPEN
Severity: MEDIUM

Problem

The current application manually loads JavaScript files through "index.html".

No formal:

- "package.json"
- npm pipeline
- Vite/Webpack pipeline
- TypeScript pipeline

has been confirmed.

Risk

The current approach may become difficult to maintain as the number of systems increases.

Required Resolution

Evaluate the architecture during Phase 4.

Do not migrate build tooling merely for appearance.

Migration must only occur if justified by project requirements.

---

9. Prototype-Level Visual Architecture

ID: AD-009
Status: OPEN
Severity: LOW / MEDIUM

Problem

Current visuals rely heavily on Three.js primitive geometry and prototype materials.

Risk

Large-scale content production could become dependent on temporary visual implementations.

Required Resolution

Introduce the production asset pipeline after the gameplay architecture is stable.

---

10. Mobile Compatibility Coverage

ID: AD-010
Status: OPEN
Severity: HIGH

Problem

The project is mobile-first, but complete device compatibility testing has not yet been performed.

Missing Verification

- Multiple screen sizes
- Aspect ratios
- Touch reliability
- Performance
- Memory
- Browser compatibility
- Orientation
- Long sessions
- Background/resume behavior

Required Resolution

Establish representative mobile testing during later device-compatibility phases.

Current Rule

Do not claim mobile compatibility is complete without real-device verification.

---

11. Production Android Architecture

ID: AD-011
Status: DEFERRED

Problem

There is currently no native Android/Gradle project.

Decision

Do not introduce native Android packaging prematurely.

The game architecture must first stabilize.

Revisit

After the web/game architecture and gameplay foundation are sufficiently mature.

---

12. Direct System Coupling

ID: AD-012
Status: OPEN
Severity: MEDIUM

Problem

The Phase 3 ownership audit confirmed several direct cross-domain dependencies in the current implementation.

Confirmed Relationships

EnemyManager → GameState

"EnemyManager" currently:

- Applies base damage through "GameState.damageBase()"
- Grants enemy rewards through "GameState.rewardEnemyKill()"

This means the Enemy System currently performs side effects belonging to World/Base and Economy responsibilities.

DefenseManager → GameState

"DefenseManager" currently:

- Checks affordability through "GameState.canAfford()"
- Spends currency through "GameState.spendCurrency()"

This means Defense System currently performs Economy operations directly.

> **RESOLVED (Phase 6, 2026-09-06):** `DefenseManager` already calls
> `EconomySystem.canAfford()`/`EconomySystem.spend()`, not
> `GameState`, as of this update — this section describes the
> Phase 3 snapshot only. `GameState.canAfford()`/`spendCurrency()`
> no longer exist at all (removed as dead code — see DECISIONS.md
> DEC-021). The "Enemy Manager → GameState.rewardEnemyKill()" line
> above is similarly historical: reward-granting now happens in
> `Game.js`'s `EnemyDied` handler via `EconomySystem.rewardEnemyKill()`,
> not inside `EnemyManager` or `GameState`.

Projectile → EnemyManager

"Projectile" currently resolves a hit by directly calling:

"EnemyManager.damageEnemy()"

This creates direct Combat → Enemy System coupling.

WaveManager → GameState

"WaveManager" currently reads base-destruction state directly through:

"GameState.isBaseDestroyed()"

This creates direct Wave System → global state coupling.

Risk

As additional systems are introduced, these direct dependencies could expand into a tightly coupled architecture.

Potential future consumers include:

- Economy
- Progression
- Quests
- Statistics
- Audio
- VFX
- UI
- Save

Required Resolution

During Architecture Foundation:

1. Define authoritative ownership for each domain.
2. Separate domain state from the current "GameState" where justified.
3. Introduce commands or events where they genuinely reduce coupling.
4. Preserve existing gameplay behavior during migration.
5. Test each migration independently.

Constraint

Do not rewrite these systems during Phase 3 merely to eliminate the coupling.

The confirmed coupling is documented here as architectural debt.

Actual remediation belongs to Phase 4 — Architecture Foundation.

---

13. Prototype UI Architecture

ID: AD-013
Status: OPEN
Severity: LOW / MEDIUM

Problem

The current UI is functional but remains prototype-level.

Constraint

UI must not own gameplay state.

UI should:

- Display state
- Send commands/intents
- React to state/events

Gameplay systems remain authoritative.

---

14. Cache-Busting Dependency

ID: AD-014
Status: OPEN
Severity: LOW

Problem

The current architecture uses query-string cache versions for JavaScript files.

Rule

When JavaScript changes require cache invalidation, the corresponding version in "index.html" must be updated.

Current Known Version

"?v=11"

This value must be verified against the actual repository before future changes.

---

15. Phase 3 Ownership Audit — Confirmed Findings

The following ownership findings were confirmed by inspecting the current implementation:

System| Owns Correctly| Confirmed Cross-Domain Responsibility
Enemy| Enemy instance state, HP, movement, status, lifecycle| None directly
EnemyManager| Enemy collection, spawning, cleanup| Base damage + enemy rewards
WaveManager| Wave state, timing, spawn scheduling| Reads global base state
Defense| Defense instance state, targeting/attack behavior| None directly
DefenseManager| Defense collection, placement, cleanup| Economy affordability/spending
Projectile| Projectile state, movement, lifetime| Direct enemy damage resolution
ProjectileManager| Projectile collection/lifecycle| None directly
BaseHUD| Base HP presentation| None
GameState| Central runtime state| Multiple domain responsibilities

Conclusion

The audit confirms that the current architecture is functional but contains known cross-domain coupling.

No emergency rewrite is justified.

The correct action is to carry these findings into Phase 4 Architecture Foundation.

---

16. Architecture Debt Rules

All architecture debt follows these rules:

1. Debt must be documented.
2. Debt must not be hidden by adding hacks.
3. Debt does not automatically justify a rewrite.
4. Existing working systems should be preserved where possible.
5. Architecture changes require evidence.
6. Large changes must be isolated and tested.
7. Save compatibility must be considered before persistent data changes.
8. Performance optimization must be measurement-driven.
9. New systems require explicit ownership.
10. Resolved debt must be documented as resolved.
11. Phase gates must not be bypassed.
12. Ownership violations discovered during audits must be documented before remediation.

---

17. Current Priority

The current priority order is:

PROJECT MEMORY
      ↓
SOURCE OF TRUTH
      ↓
SYSTEM OWNERSHIP
      ↓
ARCHITECTURE FOUNDATION
      ↓
ARCHITECTURE GATE

No feature expansion should bypass these stages.

---

18. Current Debt Summary

ID| Area| Severity| Status
AD-001| GameState boundaries| Medium| Open
AD-002| Event architecture| Medium| Open
AD-003| Data contracts| High| Open
AD-004| Asset contract| Medium| Open
AD-005| Save architecture| High| Open
AD-006| Automated testing| High| Open
AD-007| Performance baseline| High| Open
AD-008| Build infrastructure| Medium| Open
AD-009| Production visuals| Low/Medium| Open
AD-010| Mobile verification| High| Open
AD-011| Android architecture| —| Deferred
AD-012| System coupling| Medium| Open
AD-013| UI architecture| Low/Medium| Open
AD-014| Cache busting| Low| Open

---

19. Phase 3 Gate Preparation

Phase

PHASE 3 — SYSTEM OWNERSHIP

Audit Status

AUDIT COMPLETE

The current implementation has been inspected at the system-ownership level.

Confirmed:

- Enemy ownership boundaries
- Wave ownership boundaries
- Defense ownership boundaries
- Projectile ownership boundaries
- UI presentation boundaries
- GameState responsibility growth
- Direct cross-domain dependencies

Important Decision

The confirmed ownership violations are documented rather than prematurely refactored.

Actual architectural remediation is deferred to:

PHASE 4 — ARCHITECTURE FOUNDATION

This prevents Phase 3 from turning into an uncontrolled refactor.

Gate Condition

Phase 3 may be considered complete when:

- Ownership findings are documented.
- Known violations are explicitly assigned to future remediation.
- No unapproved implementation expansion is introduced.
- The project remains behaviorally unchanged by the audit/documentation step.

---

20. Current Gate

PHASE 3 — SYSTEM OWNERSHIP

STATUS: AUDIT COMPLETE — AWAITING GATE

The repository is ready for the Phase 3 ownership gate.

Do not begin Phase 4 implementation automatically.

Phase 4 requires explicit approval after the Phase 3 gate.

---

21. Golden Rule

«Infinity Depths must grow by controlled integration, not uncontrolled accumulation.»

Every new system must have:

Scope
↓
Owner
↓
Data Contract
↓
Dependencies
↓
Implementation
↓
Tests
↓
Regression
↓
Performance
↓
Mobile Verification
↓
Documentation
↓
Gate

No shortcut replaces this process.


## Phase 9 closure

Collection ownership ambiguity identified in the Phase 8 merge slice is resolved: `CollectionSystem` is now the sole runtime authority for collection state. `MergeSystem` consumes and produces through that boundary.


## Phase 12 closure

Quest ownership is now explicit: `QuestSystem` owns quest progress/completion/claim state, `CONFIG.QUESTS` owns quest definitions, `QuestUI` is presentation-only, and gameplay systems do not contain individual quest rules. Reward effects cross the boundary through controlled events.


---

## Phase 13 Closure

Advanced World was added without a parallel interaction, enemy, or world-clock engine. NPCs, story progression, special map rules, and dynamic events are isolated behind `AdvancedWorldSystem` and EventBus. The special rule is intentionally narrow (temporary build restriction during tidal surge) to avoid destabilizing combat. Manual device verification remains outstanding at the project level due to the inherited Phase 6 gate debt.
