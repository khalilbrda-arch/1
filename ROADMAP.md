Infinity Depths — Development Roadmap

«Purpose: This document defines the controlled development sequence for Infinity Depths.

The roadmap is sequential. Completing a phase does not automatically authorize the next phase; each phase has a gate.»

Project: Infinity Depths
Roadmap Version: 1.0
Date: 2026-09-02

---

1. Development Philosophy

Infinity Depths is developed as a long-term production project rather than a collection of isolated features.

The development loop is:

READ
↓
INSPECT
↓
UNDERSTAND
↓
PLAN
↓
IMPLEMENT
↓
TEST
↓
REGRESSION
↓
DOCUMENT
↓
REPORT
↓
STOP

No phase may be skipped because it appears unnecessary.

No phase may be expanded simply because additional ideas are available.

---

2. Phase Status Legend

⚪ NOT STARTED
🟡 IN PROGRESS
🔵 WAITING FOR VERIFICATION
🟢 COMPLETE
🔴 BLOCKED

A phase marked complete must have passed its gate.

---

3. Phase 0 — Full Repository Audit

Status: 🟢 Complete

Objective

Understand the actual project before changing it.

Tasks

Inspect:

- Entire repository
- Directory structure
- Source files
- Scenes/resources
- Configuration
- Dependencies
- Input
- Camera
- World
- Enemies
- Waves
- Defenses
- Combat
- UI
- VFX
- Audio
- Save systems
- Tests
- Build process
- Mobile configuration
- Unused files
- Duplicate systems
- Dead code
- Errors
- Warnings

Output

A verified map of:

- What exists
- What works
- What is partial
- What is broken
- What is unused
- What is missing
- What is risky

Gate

PASSED

The repository is sufficiently understood to begin project-memory documentation.

---

4. Phase 1 — Project Memory

Status: 🟢 Complete

Objective

Create a stable documentation memory for the project.

Files

PROJECT_STATE.md
GAME_SPEC.md
ARCHITECTURE.md
ROADMAP.md
TECHNICAL_RULES.md
DECISIONS.md
CHANGELOG.md
TESTING.md
SAVE_SCHEMA.md
CONTENT_PIPELINE.md
AI_DEVELOPMENT_PROTOCOL.md
ARCHITECTURE_DEBT.md

Required Outcome

Every important project decision must have an appropriate place.

Documentation must distinguish:

- Design
- Current implementation
- Architecture
- Decisions
- Future plans
- Testing evidence
- Known debt

Gate

All Phase 1 documents exist, are internally consistent, and contain no intentional contradictions.

---

5. Phase 2 — Source of Truth

Status: 🟢 Complete

Objective

Establish the hierarchy used to resolve contradictions.

Hierarchy

GAME_SPEC
    ↓
Design Truth

PROJECT_STATE
    ↓
Current Reality

ARCHITECTURE
    ↓
Technical Structure

DECISIONS
    ↓
Why Decisions Exist

ROADMAP
    ↓
Future Work

CODE
    ↓
Actual Implementation

TESTING
    ↓
Proof

Rules

When two sources disagree:

1. Inspect actual implementation.
2. Determine intended behavior.
3. Decide which source is authoritative.
4. Record the decision.
5. Update the affected documentation.
6. Continue only after the contradiction is understood.

Gate

No unresolved critical contradiction exists between design, architecture, project state, and implementation.

---

6. Phase 3 — System Ownership

Status: 🟢 Complete

Objective

Define authoritative ownership for every major gameplay system.

Systems

At minimum:

Core
Camera
Input
World
Enemies
Waves
Defenses
Combat
Economy
Progression
Collection
Merge
Bosses
Quests
Save
UI
Audio
VFX

Each System Must Define

- Owner
- State owned
- Data read
- Data modified
- Commands accepted
- Events emitted
- Events consumed
- Forbidden dependencies

Gate

No critical gameplay state has ambiguous ownership.

---

7. Phase 4 — Architecture Foundation

Status: 🟢 Complete

Objective

Stabilize the technical foundation before large feature expansion.

4.1 State Boundaries

Determine the correct boundaries between:

- Session state
- Level state
- Player state
- Economy
- Progression
- Collection
- World
- Save state

Avoid a God Object.

---

4.2 Event Architecture

Introduce controlled gameplay events where direct coupling is unnecessary.

Examples:

EnemyDied
↓
Reward
Economy
Quest
Statistics
UI
VFX
Audio

Events must have explicit payloads and ownership.

---

4.3 Data Contracts

Define and validate:

EnemyDefinition
DefenseDefinition
BossDefinition
RewardDefinition
UpgradeDefinition
QuestDefinition
MapDefinition
MergeDefinition

---

4.4 Asset Contract

Establish:

Gameplay
↓
Visual ID
↓
Asset Registry
↓
Asset

---

4.5 Save Contract

Define:

- Version
- Schema
- Validation
- Migration
- Backup
- Recovery

Implementation may occur later according to roadmap requirements.

---

4.6 Error Handling

Establish consistent error handling and diagnostic behavior.

---

4.7 Testing Foundation

Establish the minimum infrastructure for:

- Static validation
- Unit tests
- Integration tests
- Gameplay tests
- Regression tests

---

4.8 Performance Baseline

Measure:

- FPS
- Frame time
- Memory
- CPU
- GPU
- Entity counts
- Draw calls
- Loading

---

4.9 Build / Dependency Assessment

Evaluate whether the current manually loaded script architecture is sufficient for the next development stage.

Do not migrate build tooling merely for appearance.

If migration is necessary, define it as a controlled task.

---

8. Architecture Gate

Mandatory Stop Point

Before proceeding:

- State ownership is clear.
- Events are defined where needed.
- Data contracts are stable.
- Save contract exists.
- Testing foundation exists.
- Performance baseline exists.
- Asset contract exists.
- Major dependency risks are understood.
- Existing gameplay still works.

Gate Result

Only after verification:

Phase 5 may begin.

---

9. Phase 5 — Vertical Slice

Status: 🟢 Complete

Objective

Prove the complete gameplay loop with representative systems.

Required Flow

Start
↓
Gameplay
↓
Enemies
↓
Defenses
↓
Combat
↓
Rewards
↓
Economy
↓
Progression
↓
UI
↓
Death / Completion
↓
Save
↓
Reload

Rules

Do not rebuild working Defense or Combat systems merely for integration.

Integrate them into the stabilized architecture.

Gate

The full representative loop works:

- Functionally
- Architecturally
- On mobile
- With acceptable performance
- Through save/reload

---

10. Phase 6 — Economy

Status: 🔵 Waiting For Verification (implemented + 112/112 automated
tests passing; real-device/browser check by the project owner
still pending before this gate is marked PASSED)

Objective

Implement the complete economy architecture.

Includes:

- Resources
- Costs
- Rewards
- Transactions
- Economy state
- Economy UI
- Validation
- Persistence
- Balancing foundation

Gate

All economy transactions are authoritative, validated, testable, and persistent.

---

11. Phase 7 — Progression

Status: ✅ PASSED — 2026-09-06

Objective

Implement long-term player progression.

Includes:

- XP
- Levels
- Unlocks
- Map progression
- Content unlocks
- Progression UI
- Persistence

Gate

Progression survives reload and cannot enter invalid states.

---

12. Phase 8 — Merge

Status: 🟢 Complete

Objective

Implement scalable merge mechanics.

Includes:

- Merge definitions
- Validation
- Requirements
- Costs
- Inputs
- Results
- Collection integration
- Progression integration
- Save integration

Gate

Merge operations are deterministic, validated, testable, and persistent.

---

13. Phase 9 — Collection

Status: 🟢 Complete

Objective

Implement scalable collection/inventory.

Includes:

- Ownership
- Quantities
- Rarity
- Unlocks
- Upgrade state
- Merge eligibility
- Persistence
- Collection UI

Delivered:

- CollectionSystem is the single runtime owner for collection state.
- Definitions are data-driven under CONFIG.COLLECTION.ITEMS.
- Quantities are validated, bounded, and stackability-aware.
- Unlocks derive deterministically from collection definitions and progression level.
- Upgrade state is persisted and bounded per definition.
- MergeSystem consumes/creates items through CollectionSystem.
- SaveManager persists collection state and validates malformed payloads.
- CollectionUI provides mobile-friendly collection visibility without owning gameplay state.

Gate

PASSED — collection supports scalable content definitions without architectural duplication; 11 Phase 9 tests were part of the phase gate; the current regression suite is 175 tests.

---

14. Phase 10 — Bosses

Status: 🟢 Complete

Objective

Introduce boss encounters using the existing enemy/combat architecture.

Includes:

- Boss definitions
- Boss phases
- Special abilities
- Enrage
- Boss UI
- Boss rewards
- Boss VFX/audio hooks

Gate

PASSED — 9 dedicated Phase 10 regression tests and the current 185-test regression suite pass; boss behavior reuses EnemyManager/Enemy instead of a parallel enemy engine.

---

15. Phase 11 — World Systems

Status: 🟢 Complete

Objective

Introduce dynamic world systems.

Potential systems:

- Deterministic world clock / day-night cycle
- Data-driven weather definitions
- Environmental modifiers (defense range, enemy speed, ocean motion, fog)
- Timed dynamic world events
- EventBus contracts for world state/modifiers

Gate

PASSED — world state is isolated in WorldSystem and published through WorldStateChanged/WorldModifiersChanged; dedicated Phase 11 dedicated tests pass with the current 185-test regression suite, including current-object modifier inheritance.

---

16. Phase 12 — Quests

Status: 🟢 Complete — automated gate passed; roadmap sequencing still carries an inherited Phase 6 verification debt

Objective

Implement event-driven quests.

Includes:

- Quest definitions
- Objectives
- Progress tracking
- Completion
- Rewards
- Persistence
- UI

Gate

PASSED (automated) — quests consume gameplay events without direct coupling with gameplay systems; completion/claim state is persistent and the UI remains presentation-only. Manual device verification is still outstanding in the current sandbox environment.

---

17. Phase 13 — Advanced World

Status: 🟢 Complete — automated gate passed

Implemented:

- Data-driven NPCs through the existing world interaction boundary
- Event-driven story chapter progression
- Special map rules with a deterministic tidal-surge build restriction
- Dynamic advanced-world events driven by existing WorldSystem events
- Persistence and validation for advanced-world state

Gate

PASSED (automated) — dedicated Phase 13 tests and full regression pass; advanced systems remain isolated behind AdvancedWorldSystem/EventBus and reuse existing map, interaction, and world-event boundaries. Manual device verification remains an inherited project-level requirement.

---

18. Phase 14 — Content Pipeline Gate

Status: ⚪ Not Started

Objective

Prove that content can be added without rewriting systems.

Test cases should include adding representative:

- Enemy
- Defense
- Boss
- Reward
- Quest
- Map
- Merge recipe

Gate

New content can be added primarily through:

Definitions
+
Configuration
+
Assets

rather than system rewrites.

---

19. Phase 15 — Content Expansion

Status: ⚪ Not Started

Objective

Expand the game substantially using the established content pipeline.

Potential expansion:

- Many defenses
- Many enemies
- More maps
- More waves
- More bosses
- More rewards
- More quests
- More merge recipes

No content expansion should introduce one-off architecture unless genuinely required.

---

20. Phase 16 — Visual Upgrade

Status: ⚪ Not Started

Objective

Move from prototype visuals toward production-quality visuals.

Includes:

- Final models
- Textures
- Materials
- Animations
- Environment assets
- UI visuals
- Asset optimization

Visual changes must not change gameplay behavior accidentally.

---

21. Phase 17 — VFX

Status: ⚪ Not Started

Includes:

- Combat effects
- Element effects
- Status effects
- Defense effects
- Enemy death effects
- Boss effects
- Environment effects
- UI feedback effects

Gate

VFX is performant on target mobile devices.

---

22. Phase 18 — Audio

Status: ⚪ Not Started

Includes:

- Music
- Ambient audio
- UI sounds
- Combat
- Defenses
- Enemies
- Bosses
- Events

Audio must be data-driven where appropriate.

---

23. Phase 19 — UI / UX

Status: ⚪ Not Started

Objective

Move functional UI toward polished mobile UX.

Includes:

- HUD
- Menus
- Defense selection
- Collection
- Merge
- Progression
- Quests
- Boss UI
- Settings
- Feedback
- Accessibility/readability improvements

Gate

UI remains responsive, readable, and does not own gameplay logic.

---

24. Phase 20 — Performance

Status: ⚪ Not Started

Objective

Optimize based on measurements.

Measure and optimize:

- CPU
- GPU
- Memory
- FPS
- Entity count
- Draw calls
- Loading
- Effects
- Garbage collection

Possible techniques:

- Pooling
- Instancing
- Culling
- Batching
- LOD
- Reduced allocations

Only use techniques justified by measurements.

---

25. Phase 21 — Device Compatibility

Status: ⚪ Not Started

Test across representative mobile devices.

Test:

- Touch
- Screen sizes
- Aspect ratios
- Performance
- Memory
- Browser compatibility
- Orientation
- Long sessions
- Background/resume behavior

Gate

No critical mobile blocker remains.

---

26. Phase 22 — Save / Offline Alpha

Status: ⚪ Not Started

Objective

Make the offline game robust enough for extended real-world use.

Includes:

- Versioned saves
- Migration
- Validation
- Backup
- Recovery
- Corruption handling
- Offline progression rules
- Reload testing

Gate

Player progress can survive normal failures and upgrades safely.

---

27. Phase 23 — Balance

Status: ⚪ Not Started

Balance:

- Enemy difficulty
- Defense power
- Costs
- Rewards
- Progression speed
- Merge outcomes
- Boss difficulty
- Resource economy

Balance must be data-driven wherever possible.

---

28. Phase 24 — QA / Regression

Status: ⚪ Not Started

Run broad testing.

Static

- Broken references
- Invalid imports
- Syntax
- Duplicate definitions

Unit

- Damage
- Costs
- Rewards
- Merge
- Progression
- Targeting

Integration

- Combat
- Economy
- Progression
- Collection
- Save
- Quests

Gameplay

- Full levels
- Waves
- Bosses
- Failure
- Completion

Regression

Verify previously working systems.

Mobile

Verify on actual devices.

---

29. Phase 25 — Release Candidate

Status: ⚪ Not Started

The release candidate must be:

- Stable
- Tested
- Performant
- Save-safe
- Mobile-compatible
- Visually coherent
- Audio-complete
- UX-complete
- Free of critical blockers

No new major systems should be introduced here.

---

30. Phase 26 — Online Architecture

Status: ⚪ Not Started

Objective

Prepare the production architecture for online services.

Potential areas:

- Authentication
- Server authority
- APIs
- Synchronization
- Cloud saves
- Matchmaking infrastructure
- Anti-cheat
- Remote configuration

This phase does not automatically mean multiplayer is active.

---

31. Phase 27 — Multiplayer

Status: ⚪ Not Started

Potential modes:

- PvP
- Co-op

Requirements:

- Server authority
- Synchronization
- Latency handling
- Disconnect handling
- Match state
- Security
- Anti-cheat

Multiplayer must not compromise the offline game.

---

32. Phase 28 — Live Content

Status: ⚪ Not Started

Potential systems:

- Seasonal content
- Events
- Limited-time challenges
- New maps
- New defenses
- New bosses
- New quests
- Balance updates

Live content must use the established content pipeline.

---

33. Phase 29 — Launch

Status: ⚪ Not Started

Launch readiness includes:

- Final QA
- Performance verification
- Device compatibility
- Save safety
- Release build
- Store preparation
- Analytics where appropriate
- Crash reporting
- Privacy/legal requirements
- Launch content
- Post-launch monitoring

---

34. Global Quality Gates

Every major feature must pass:

Scope
↓
Acceptance Criteria
↓
Dependencies
↓
Data Contract
↓
Implementation
↓
Static Validation
↓
Unit Testing
↓
Integration Testing
↓
Gameplay Testing
↓
Regression
↓
Performance
↓
Mobile
↓
Documentation
↓
Gate

---

35. No Automatic Advancement

Completion of one phase does not authorize the next phase automatically.

After every gate:

STOP
↓
REPORT
↓
WAIT FOR APPROVAL

The next phase begins only when explicitly authorized.

---

36. Emergency Rule

If a phase reveals a critical architectural problem:

STOP FEATURE WORK
↓
DOCUMENT PROBLEM
↓
ASSESS IMPACT
↓
PLAN FIX
↓
IMPLEMENT FIX
↓
TEST
↓
REGRESSION
↓
RE-EVALUATE GATE

Do not hide architectural problems under additional features.

---

37. Scope Control

Ideas discovered during development are categorized as:

Required

Must be implemented for the current phase.

Important Later

Added to the appropriate future phase.

Optional

Recorded but not allowed to interrupt current work.

Rejected

Documented when useful so the same idea is not repeatedly reconsidered.

---

38. Definition of Done

A feature is not "done" because:

- A file exists.
- Code compiles.
- It looks correct once.
- The developer assumes it works.

A feature is done only after:

- Acceptance criteria pass.
- Relevant tests pass.
- Regression passes.
- Performance is acceptable.
- Mobile verification is complete where applicable.
- Documentation is updated.
- No critical blocker remains.

---

39. Current Position

PHASE 0
████████████████████ 100%

PHASE 1
███████░░░░░░░░░░░░░  In Progress

PHASE 2+
░░░░░░░░░░░░░░░░░░░░  Not Started

Current immediate objective:

Finish Phase 1 documentation.

---

40. Immediate Execution Order

The current manual documentation sequence is:

1. PROJECT_STATE.md
2. GAME_SPEC.md
3. ARCHITECTURE.md
4. ROADMAP.md
5. TECHNICAL_RULES.md
6. DECISIONS.md
7. CHANGELOG.md
8. TESTING.md
9. SAVE_SCHEMA.md
10. CONTENT_PIPELINE.md
11. AI_DEVELOPMENT_PROTOCOL.md
12. ARCHITECTURE_DEBT.md

No implementation expansion occurs merely because these documents are being created.

---

41. Final Roadmap Principle

«The roadmap is a control system, not a wish list.»

Every phase exists to remove a specific class of risk.

The project advances only when the current risk is sufficiently controlled and the corresponding gate has been passed.
