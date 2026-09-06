Infinity Depths — Architecture

«Purpose: Define the technical architecture, system boundaries, dependencies, ownership rules, data flow, and scalability principles of Infinity Depths.

This document describes the intended technical structure. "PROJECT_STATE.md" records what currently exists.»

Project: Infinity Depths
Version: 1.0
Date: 2026-09-02
Architecture Status: Foundation Definition

---

1. Architecture Goals

The architecture must allow Infinity Depths to grow from a prototype into a large-scale game without repeatedly rebuilding its foundation.

Primary goals:

- Clear system ownership
- Low unnecessary coupling
- Data-driven content
- Testable gameplay logic
- Predictable state flow
- Mobile performance
- Safe persistence
- Expandable content
- Controlled dependencies
- Future online compatibility
- Easy debugging
- Safe AI-assisted development

---

2. Architecture Principles

2.1 Single Ownership

Every important piece of state or behavior must have one authoritative owner.

Bad:

UI → changes GameState
Enemy → changes Economy
Defense → changes Quest
Quest → changes Enemy

Preferred:

Gameplay System
      ↓
Event / Command
      ↓
Owning System
      ↓
State Change

---

3. System Layers

The project should conceptually be organized into these layers:

Presentation
    ↓
Application / Gameplay Coordination
    ↓
Domain Gameplay Systems
    ↓
State / Data
    ↓
Infrastructure

A practical interpretation:

UI
Camera
Input
VFX
Audio
        ↓
Game Coordination
        ↓
Combat
Enemies
Defenses
Waves
Economy
Progression
Quests
Collection
Merge
World
        ↓
State / Definitions
        ↓
Save / Asset / Runtime Infrastructure

---

4. Presentation Layer

Presentation contains systems responsible for displaying information or effects.

Examples:

src/ui/
src/vfx/
src/audio/

Presentation may:

- Read gameplay state
- Display values
- Display notifications
- Play effects
- Send user commands

Presentation must not own authoritative gameplay state.

---

5. Input Layer

Input translates physical device actions into game commands.

Examples:

Touch
Tap
Pan
Zoom

Input should not directly implement gameplay rules.

Preferred:

Touch
  ↓
Input System
  ↓
Gameplay Command
  ↓
Owning System

---

6. Camera Layer

The camera owns:

- Camera position
- Camera angle
- Zoom
- Camera bounds
- Camera movement

The camera does not own:

- Economy
- Combat
- Enemy state
- Defense state
- Progression

---

7. World Layer

The World system owns:

- Battlefield environment
- Map geometry
- World interactables
- World-specific state
- Environmental rules

Future world systems may include:

- Weather
- Day/night
- Dynamic events
- NPCs
- Environmental modifiers

World systems must not directly manipulate unrelated gameplay systems without a defined interface or event.

---

8. Gameplay Domain

The gameplay domain contains the authoritative game rules.

Major systems:

Enemy System
Wave System
Defense System
Combat System
Economy System
Progression System
Collection System
Merge System
Boss System
Quest System
World Gameplay System

Each system must have explicit ownership.

---

9. Enemy System

Owner

Enemy System.

Owns

- Enemy instances
- Enemy health
- Enemy movement
- Enemy status effects
- Enemy lifecycle
- Enemy death
- Enemy arrival at objective

Reads

- Enemy definitions
- Path definitions
- Relevant world information
- Combat results

Emits

Potential events:

EnemySpawned
EnemyDamaged
EnemyStatusChanged
EnemyReachedBase
EnemyDied

Must Not Own

- Player currency
- Quest progress
- UI
- Audio
- VFX
- Save files

---

10. Wave System

Owner

Wave System.

Owns

- Current wave
- Wave state
- Spawn schedule
- Wave completion state

Reads

- Wave definitions
- Enemy definitions
- Level definition

Commands

StartWave
PauseWave
ResumeWave

Emits

WaveStarted
EnemySpawnRequested
WaveCompleted

Wave System should request enemy spawning rather than becoming the owner of enemy instances.

---

11. Defense System

Owner

Defense System.

Owns

- Defense instances
- Placement
- Defense configuration
- Defense targeting state
- Defense attack timing

Reads

- Defense definitions
- Player resources
- Battlefield placement rules
- Enemy query information

Commands

SelectDefense
EnterPlacement
CancelPlacement
PlaceDefense
MoveDefense
RemoveDefense

"MoveDefense" remains a future capability.

Emits

DefensePlaced
DefenseRemoved
DefenseUpgraded
DefenseTargetChanged
DefenseAttackStarted

---

12. Combat System

Owner

Combat System.

Owns

- Damage calculation
- Projectile/attack resolution
- Combat modifiers
- Critical calculations
- Status application
- Combat outcomes

Reads

- Defense attack data
- Enemy defensive data
- Element definitions
- Status definitions
- Combat rules

Emits

AttackStarted
ProjectileSpawned
AttackHit
DamageApplied
StatusApplied
EnemyDied

Combat must not own:

- UI
- Economy
- Quest state
- Save data

Rewards should be processed by the appropriate owner after combat events.

---

13. Projectile System

Owner

Projectile System / Combat subsystem.

Owns

- Projectile instances
- Projectile movement
- Lifetime
- Collision/hit resolution
- Projectile-specific behavior

Reads

- Projectile definitions
- Target information
- Combat data

Emits

ProjectileSpawned
ProjectileHit
ProjectileExpired

Projectile rendering should remain separate from the gameplay calculation where practical.

---

14. Economy System

Owner

Economy System.

Owns

- Player resources
- Resource balances
- Transactions
- Costs
- Rewards
- Economy rules

Commands

SpendResource
GrantResource
ValidateCost

Emits

ResourceChanged
TransactionCompleted
RewardGranted
TransactionRejected

No UI component may directly modify resource balances.

---

15. Progression System

Owner

Progression System.

Owns

- Player progression
- XP
- Levels
- Unlocks
- Map unlock state
- System/content unlocks

Reads

- Rewards
- Completed levels
- Quests
- Achievement-like events

Emits

XPGranted
LevelUp
ContentUnlocked
MapUnlocked

---

16. Collection System

Owner

Collection System.

Owns

- Owned defenses/content
- Quantities
- Unlock state
- Collection metadata
- Persistent ownership

Reads

- Rewards
- Merge results
- Progression unlocks

Emits

ItemAcquired
ItemConsumed
ItemUnlocked
CollectionChanged

---

17. Merge System

Owner

Merge System.

Owns

- Merge validation
- Merge recipes
- Merge execution
- Merge result generation

Reads

- Collection
- Merge definitions
- Economy
- Progression requirements

Emits

MergeStarted
MergeCompleted
MergeRejected

Merge must never directly modify arbitrary systems.

---

18. Boss System

Owner

Boss System / Enemy domain.

Bosses should extend the existing enemy architecture rather than create a separate unrelated combat engine.

Boss-specific ownership includes:

- Boss phases
- Special abilities
- Enrage state
- Boss-specific rules

Events may include:

BossSpawned
BossPhaseChanged
BossEnraged
BossDefeated

---

19. Quest System

Owner

Quest System.

Owns

- Quest definitions
- Active quests
- Progress
- Completion
- Rewards claimed state

Quest System should primarily react to gameplay events.

Example:

EnemyDied
    ↓
Quest System
    ↓
"Defeat 100 Enemies"
    ↓
Progress +1

The Enemy System should not know that the quest exists.

---

20. World Systems

World systems may include:

Weather
DayNight
Events
NPC
Environmental Effects
Map Modifiers

They should expose controlled state to gameplay systems.

Example:

Weather
   ↓
World Modifier
   ↓
Combat / Movement / Visual systems

Avoid scattered code such as:

if (weather === ...)

throughout unrelated files.

---

21. UI Architecture

UI is a presentation layer.

UI may:

- Display state
- Request actions
- Show errors
- Show feedback

UI must not:

- Own gameplay state
- Perform authoritative economy transactions
- Calculate combat damage
- Spawn enemies directly
- Complete quests directly
- Modify save data directly

Preferred:

Button
  ↓
Command
  ↓
Gameplay System
  ↓
State Change
  ↓
Event
  ↓
UI Update

---

22. Game Coordinator

"Game.js" is an application-level coordinator.

It may:

- Initialize systems
- Connect systems
- Start the game
- Run the update loop
- Manage high-level lifecycle

It must not gradually become a God Object.

"Game.js" should not become the place where every gameplay rule is implemented.

---

23. Game State

"GameState" currently contains several runtime values.

Long-term, state should be separated conceptually into:

Session State
Player State
Economy State
Progression State
Collection State
World State
Level State
Save State

The exact implementation should be determined during Architecture Foundation after inspecting the existing code.

Do not split state mechanically just because multiple files appear cleaner.

---

24. Commands

Commands represent requested actions.

Examples:

PlaceDefense
UpgradeDefense
SpendResource
StartWave
MergeItems
ClaimQuestReward

Commands should be validated by the system that owns the action.

UI should request commands rather than bypassing validation.

---

25. Events

Events communicate completed or meaningful state changes.

Examples:

EnemyDied
WaveCompleted
DefensePlaced
ResourceChanged
LevelUp
MergeCompleted
BossDefeated
QuestCompleted

Events should contain sufficient data for consumers without exposing unnecessary internal objects.

---

26. Event Rules

Events must:

- Have clear names
- Have defined payloads
- Be emitted by the owning system
- Avoid circular dependencies
- Avoid hidden mutations
- Be testable

An event consumer should not modify the state of the system that emitted the event unless a deliberate command/contract exists.

---

27. Dependency Direction

Preferred dependency direction:

Input
  ↓
Application
  ↓
Gameplay Systems
  ↓
State / Definitions

Presentation observes gameplay rather than becoming the gameplay authority.

Infrastructure supports the systems rather than defining their rules.

---

28. Circular Dependency Rule

Avoid:

A → B
B → C
C → A

If a circular dependency appears, consider:

- Event communication
- Interface/contract
- Higher-level coordinator
- Shared data definition
- Ownership correction

Do not solve circular dependencies by adding random global references.

---

29. Data-Driven Architecture

Content should primarily be represented through definitions.

Examples:

DefenseDefinition
EnemyDefinition
BossDefinition
RewardDefinition
UpgradeDefinition
QuestDefinition
MapDefinition
MergeDefinition

A generic system should consume these definitions.

This enables large content expansion without one-off gameplay code.

---

30. Definition vs Instance

A definition describes what something is.

An instance represents a live object.

Example:

DefenseDefinition
        ↓
Defense Instance

Definition:

- Damage
- Range
- Cost
- Visual ID

Instance:

- Current position
- Current cooldown
- Current target
- Runtime modifiers
- Current health if applicable

Do not mix permanent definition data with temporary runtime state.

---

31. Asset Architecture

Gameplay should refer to assets using identifiers.

Preferred:

DefenseDefinition
    ↓
visualId = "defense_tesla_01"
    ↓
Asset Registry
    ↓
Model / Texture / Animation / VFX

Avoid scattering raw asset paths throughout gameplay code.

---

32. Save Architecture

The save system must eventually serialize clearly defined persistent state.

Conceptual structure:

SaveData
├── version
├── player
├── economy
├── progression
├── collection
├── quests
├── settings
└── metadata

Temporary runtime objects such as:

- projectile positions
- current enemy interpolation
- active rendering objects

should generally not be persisted unless explicitly required.

---

33. Save Validation

Every save load must be treated as untrusted data.

Validation should check:

- Version
- Required fields
- Data types
- Valid ranges
- Known IDs
- Duplicate/invalid entries
- Corruption

Invalid data must not silently overwrite valid progress.

---

34. Save Migration

Future schema changes must use migrations.

Example:

Save v1
  ↓
Migration v2
  ↓
Migration v3
  ↓
Current Schema

Never assume all users have the latest save format.

---

35. Persistence Ownership

The Save System owns persistence.

Gameplay systems provide serializable state through defined contracts.

Gameplay systems should not each write their own storage mechanism.

---

36. Error Handling Architecture

Errors should be classified.

Examples:

Validation Error
Gameplay Error
Data Error
Asset Error
Save Error
Initialization Error

Errors should provide:

- Context
- System
- Operation
- Safe fallback where possible

---

37. Configuration

Configuration should be centralized and structured.

Existing "Config.js" is part of the current prototype.

Future configuration must avoid becoming an unstructured global dumping ground.

Separate configuration categories when justified.

---

38. Update Loop

The runtime loop should follow a predictable order.

Conceptually:

Input
  ↓
Commands
  ↓
World / Time
  ↓
Gameplay Systems
  ↓
Combat
  ↓
Events
  ↓
Presentation
  ↓
Render

The exact order must be verified against the actual implementation before major changes.

---

39. Time Management

All time-sensitive gameplay should use the central time source.

Avoid creating independent clocks for systems unless there is a clear reason.

Benefits:

- Deterministic behavior
- Easier testing
- Pause support
- Performance control
- Consistent timing

---

40. Object Lifetime

Every runtime entity should have a clear lifecycle:

Create
 ↓
Active
 ↓
Inactive / Dead
 ↓
Destroy or Pool

Future high-volume systems should prefer object pooling where measurements justify it.

---

41. Performance Architecture

Performance optimization must be measurement-driven.

Important metrics:

- FPS
- Frame time
- CPU time
- GPU time
- Memory
- Draw calls
- Active entities
- Projectile count
- Effect count
- Load time

Do not optimize blindly.

---

42. Mobile Architecture

Mobile constraints influence:

- Input
- Rendering
- Memory
- UI
- Loading
- Asset sizes
- Entity counts
- Effects
- Performance

Every major gameplay system should eventually be tested on real mobile hardware.

---

43. Offline Architecture

Offline PvE must not require:

- Authentication
- Server connection
- Remote configuration
- Online services

Optional future services must fail gracefully when unavailable.

---

44. Future Online Boundary

Future online systems should sit around the gameplay architecture rather than force every gameplay class to become network-aware.

Conceptually:

Client
  ↓
Game Application
  ↓
Gameplay Domain
  ↓
Online Adapter
  ↓
Server

The offline game must remain usable without the online adapter.

---

45. Multiplayer Authority

Future multiplayer should prefer server-authoritative validation for competitive actions.

Client should not be trusted for:

- Currency
- Damage results
- Inventory ownership
- Progression
- Match results

This is future architecture only and is not part of the current offline implementation.

---

46. Testing Architecture

Testing must exist at multiple levels.

Static
 ↓
Unit
 ↓
Integration
 ↓
Gameplay
 ↓
Regression
 ↓
Mobile
 ↓
Performance

Each system should expose logic that can be tested without requiring the entire game whenever practical.

---

47. Testable Boundaries

Prefer pure or isolated functions for:

- Damage calculations
- Cost validation
- Merge validation
- Reward calculation
- Progression calculations
- Target selection
- Status effect calculations

These are high-value unit-test candidates.

---

48. Content Pipeline

Adding new content should generally require:

Definition
↓
Asset Registration
↓
System Recognition
↓
Testing
↓
Content Validation

not:

Modify five unrelated systems
↓
Add hard-coded special case
↓
Patch another system

---

49. Architecture Gate

Before Economy and large content expansion begin, the following must be stable:

- Ownership
- State boundaries
- Event communication
- Data contracts
- Save contract
- Error handling
- Testing foundation
- Performance baseline
- Asset contract
- Content pipeline

If these are not stable, implementation must stop and the architecture must be corrected.

---

50. Current Known Risks

Risk| Severity| Action
GameState growth| Medium| Address during foundation
Manual script loading| Medium| Evaluate before scaling
No automated tests| High| Establish testing foundation
No save system| High| Define contract before implementation
Primitive assets| Medium| Production asset phase later
No event architecture| High| Introduce controlled events
No complete data contracts| High| Define contracts
No performance baseline| High| Measure before optimization
No formal build pipeline| Medium| Evaluate deliberately
Future online complexity| Medium| Preserve architectural boundary

---

51. Current Prototype Mapping

Existing systems map approximately as follows:

src/core/
    Application / Core

src/camera/
    Camera

src/input/
    Input

src/interaction/
    Interaction

src/enemies/
    Enemy Domain

src/waves/
    Wave Domain

src/defenses/
    Defense Domain

src/combat/
    Combat Domain

src/world/
    World

src/ui/
    Presentation

This mapping is descriptive.

It does not authorize moving files without an implementation task and inspection.

---

52. Refactoring Rule

Refactoring is allowed only when:

- The problem is understood.
- The affected dependencies are known.
- The change has a defined purpose.
- Existing behavior is protected by tests or verified manually.
- Regression testing is performed.
- Documentation is updated.

Never perform large architectural refactors simply to make the directory structure look cleaner.

---

53. AI Development Boundary

AI-assisted development must obey:

Read
↓
Inspect
↓
Understand
↓
Plan
↓
Implement
↓
Inspect
↓
Test
↓
Regression
↓
Document
↓
Report
↓
Stop

AI must not:

- Invent existing APIs
- Assume files exist
- Claim tests passed without running them
- Create duplicate systems
- Rewrite working systems without approval
- Advance phases automatically
- Hide architectural changes

---

54. Architecture Source of Truth

Architecture conflicts are resolved through:

1. Actual repository inspection
2. Tests
3. "GAME_SPEC.md"
4. "PROJECT_STATE.md"
5. "DECISIONS.md"

The implementation must never be assumed correct merely because code exists.

---

55. Definition of Architectural Success

The architecture is successful when:

- New content can be added without rewriting core systems.
- Systems have clear ownership.
- Gameplay rules are testable.
- UI does not own gameplay.
- Save data is versioned.
- Events reduce unnecessary coupling.
- Mobile performance can be measured and controlled.
- Future online systems can be added without rewriting the entire game.
- AI can safely modify isolated systems without destabilizing unrelated systems.

---

56. Final Architecture Principle

«Build systems once, define their boundaries clearly, and make content scale through data rather than duplicated code.»

Infinity Depths should become larger by adding definitions, configurations, assets, and isolated system capabilities, not by repeatedly creating parallel implementations of the same idea.


## Phase 9 — Collection boundary

`CollectionSystem` owns collection runtime state (`items`, `unlocked`, `upgrades`). `CONFIG.COLLECTION` owns static definitions. `MergeSystem` consumes the collection contract; `CollectionUI` is presentation-only; `SaveManager` is the sole persistence writer.


## Phase 12 — Quest boundary

`QuestSystem` owns quest definitions at runtime, active progress, completion, and claimed reward state. `CONFIG.QUESTS` contains content definitions only. Gameplay systems emit events such as `EnemyDied`, `WaveCompleted`, `DefensePlaced`, `MergeCompleted`, `BossDefeated`, and `ItemAcquired`; `QuestSystem` consumes those events without importing or depending on the emitting gameplay systems. `QuestUI` is presentation-only. Reward effects are executed through a controlled `QuestRewardClaimRequested` event at the Game coordination boundary, and successful claims emit `QuestRewardClaimed`.


---

## Phase 13 — Advanced World Boundary

`AdvancedWorldSystem` owns NPC interaction state, story chapter progression, special map rules, and dynamic event state. It communicates through `EventBus` and does not access DOM or localStorage. `InteractionController` routes NPC taps to it, while `DefenseMap` consults its build-rule boundary. SaveManager persists only serializable advanced-world state.
