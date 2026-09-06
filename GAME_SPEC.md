Infinity Depths — Game Specification

«Design Truth: This document defines what Infinity Depths is supposed to be.
It describes intended game design, not necessarily what is currently implemented.»

Project: Infinity Depths
Version: 1.0 Design Specification
Date: 2026-09-02
Primary Mode: Offline PvE
Future Modes: Online PvP / Co-op

---

1. Vision

Infinity Depths is a long-term 3D mobile-first strategy game combining:

- Tower Defense
- Base Building
- Real-Time Combat
- Defense Collection
- Defense Upgrades
- Merge Systems
- Progression
- Boss Encounters
- World Systems
- Quests
- Long-term Content Expansion

The game must be designed so that new content can be added without repeatedly rewriting the underlying gameplay architecture.

The project is intended to scale from a prototype into a commercially viable large game.

---

2. Core Player Experience

The primary gameplay loop is:

Enter Level
    ↓
Observe Battlefield
    ↓
Place Defenses
    ↓
Enemies Spawn
    ↓
Combat Begins
    ↓
Defenses Attack
    ↓
Player Manages Battlefield
    ↓
Enemies Are Defeated
    ↓
Rewards Are Earned
    ↓
Economy / Progression Changes
    ↓
Next Wave
    ↓
Boss / Completion
    ↓
Save Progress

The player experience should feel:

- Strategic
- Responsive
- Clear
- Satisfying
- Progression-driven
- Mobile-friendly
- Easy to understand
- Deep enough for long-term mastery

---

3. Platform Philosophy

Infinity Depths is Mobile-First.

All core interactions must work naturally with touch.

Desktop/browser support may exist, but desktop controls must not dictate the fundamental game design.

Primary interaction:

Tap

Secondary interactions:

- Drag for camera pan
- Pinch or equivalent gesture for zoom
- UI touch interactions

---

4. Camera

The game uses a fixed-angle top-down perspective.

Target angle:

Approximately 58°

The camera is not a player character camera.

The player sees the battlefield from above and interacts directly with it.

---

5. Camera Controls

Supported:

- Pan
- Zoom

Not supported as core controls:

- WASD movement
- Character movement
- First-person movement
- Third-person character control
- Joystick-controlled character

Camera boundaries must prevent the player from leaving the playable battlefield.

Zoom must have reasonable minimum and maximum limits.

---

6. Player Character

There is no traditional player avatar required for the core gameplay.

The player exists as the strategic controller of the battlefield.

Therefore:

- No player body
- No character movement
- No character collision as a gameplay requirement
- No character combat controller
- No first-person gameplay

Future narrative systems may represent the player through UI, NPCs, commanders, or other abstract systems without changing the core camera philosophy.

---

7. World Visibility

Infinity Depths does not use exploration as a core mechanic.

The player should be able to see the relevant playable map.

There is no mandatory:

- Fog of War
- Hidden battlefield exploration
- Player-controlled exploration character

Progression may unlock:

- New maps
- New levels
- New regions
- New environments

But the current playable battlefield itself is not hidden behind exploration.

---

8. Battlefield

Each level contains a battlefield with:

- Base
- Enemy paths
- Placement area
- Environmental elements
- Resources/interactables where appropriate
- Spawn points
- Enemy routes
- Strategic positions

The battlefield must remain readable on mobile screens.

---

9. Base

The player's base is a central gameplay objective.

The base has:

- Health
- Maximum health
- Damage state
- Defeat condition

Enemies can damage the base when they successfully reach the appropriate destination.

If base health reaches zero:

The level is lost.

---

10. Enemies

Enemies are independent gameplay entities.

Enemy definitions should eventually be data-driven.

An enemy may contain:

- Health
- Maximum health
- Movement speed
- Damage
- Defense/resistance
- Targeting behavior
- Status effects
- Rewards
- Rarity/type
- Special abilities
- Visual identity

Future enemy types must be addable without rewriting EnemyManager.

---

11. Enemy Paths

Enemies generally follow defined routes toward the player's objective.

Pathing must support:

- Spawn
- Route following
- Progress toward base
- Arrival
- Base damage
- Death
- Future special movement behaviors

Future advanced path types may include:

- Multiple routes
- Branching routes
- Flying enemies
- Burrowing enemies
- Teleporting enemies
- Boss-specific movement

These must be added through controlled architecture.

---

12. Waves

Levels are divided into enemy waves.

A wave may define:

- Enemy composition
- Enemy quantity
- Spawn timing
- Spawn positions
- Difficulty
- Special modifiers
- Rewards

Wave progression should be deterministic when the level requires deterministic behavior.

Future content may support procedural or event-driven waves.

---

13. Defense System

Defenses are the primary strategic tools of the player.

The game should eventually support a large number of defense types.

Target scale:

Hundreds of distinct defense/content definitions over the lifetime of the project.

The architecture must therefore be data-driven.

---

14. Defense Placement

Current intended interaction:

Tap-to-Place

The player:

1. Selects a defense.
2. Enters placement mode.
3. Taps a valid location.
4. Defense is placed.
5. Cost is paid.

Placement is:

Free placement

It is not based on fixed defense slots.

---

15. Defense Movement

Moving already-placed defenses is intentionally deferred from the current foundation.

Future implementation may support:

- Tap to select
- Drag to move
- Valid-position preview
- Collision/placement validation
- Cost-free repositioning or cost-based repositioning depending on final balance

This must not be implemented prematurely.

---

16. Defense Properties

A defense may eventually define:

- Damage
- Attack speed
- Range
- Targeting mode
- Projectile type
- Projectile speed
- Critical chance
- Critical multiplier
- Element
- Traits
- Status effects
- Splash radius
- Piercing
- Chain behavior
- Upgrade level
- Rarity
- Merge eligibility
- Visual ID
- Audio ID
- VFX ID

Not every defense must use every property.

---

17. Targeting

Defenses may support different targeting rules, such as:

- Nearest enemy
- First enemy
- Last enemy
- Strongest enemy
- Weakest enemy
- Lowest-health enemy
- Highest-health enemy
- Flying-only
- Ground-only
- Special target conditions

Targeting must be configurable rather than hard-coded individually into every defense.

---

18. Combat

Combat is real-time.

Typical flow:

Defense
    ↓
Target Selection
    ↓
Attack Decision
    ↓
Projectile / Attack
    ↓
Hit Detection
    ↓
Damage
    ↓
Status Effects
    ↓
Enemy Death
    ↓
Reward/Event

The combat system must remain independent from UI.

---

19. Projectiles

Projectile-based attacks may define:

- Speed
- Damage
- Target
- Lifetime
- Hit behavior
- Area damage
- Piercing
- Chain effects
- Visual ID
- VFX ID

Future projectile types must be extensible.

---

20. Damage

The final damage architecture should support:

- Base damage
- Defense modifiers
- Enemy resistances
- Critical damage
- Elemental interactions
- Status interactions
- Special abilities
- Boss modifiers

Damage calculations must eventually be deterministic and testable.

---

21. Elements

The game may support an elemental system.

Possible elements include, but are not limited to:

- Fire
- Water
- Earth
- Air
- Lightning
- Ice
- Shadow
- Light
- Void

The final element list is a design decision and must be recorded before implementation.

Element interactions must be data-driven.

---

22. Status Effects

The combat architecture must eventually support status effects.

Examples:

- Burn
- Freeze
- Slow
- Poison
- Shock
- Bleed
- Stun
- Armor reduction
- Damage amplification
- Healing reduction

Status effects must have:

- Duration
- Stacking behavior
- Source
- Strength
- Expiration
- Optional refresh behavior

---

23. Rarity

Content may use rarity tiers.

Initial conceptual hierarchy:

Common
Uncommon
Rare
Epic
Legendary
Mythic
Secret

Rarity can influence:

- Availability
- Power
- Visual presentation
- Upgrade potential
- Merge outcomes
- Collection value

Rarity must not automatically become a pay-to-win mechanism.

---

24. Economy

The economy is a core progression system.

Potential economy resources include:

- Level resources
- Permanent resources
- Upgrade materials
- Merge materials
- Special currencies

Exact resource names and values must be defined before the final Economy implementation.

Economy principles:

- Clear
- Understandable
- Balanced
- Expandable
- Saveable
- Resistant to exploits
- Not pay-to-win by design

---

25. Progression

Progression should reward continued play.

Potential progression layers:

Level Progression
    ↓
Defense Unlocks
    ↓
Upgrades
    ↓
New Maps
    ↓
New Content
    ↓
Advanced Systems

Progression must be separated from temporary in-level state.

---

26. Inventory / Collection

The game is intended to contain a collection system for defenses and other content.

The collection system should support:

- Ownership
- Quantity
- Rarity
- Unlock status
- Upgrade level
- Merge eligibility
- Metadata
- Visual identity

The collection architecture must support large content counts.

---

27. Merge System

Merge is a future major progression mechanic.

A merge operation may consume multiple compatible items and produce a new result.

Conceptually:

Input Items
    ↓
Validation
    ↓
Merge Definition
    ↓
Cost / Requirements
    ↓
Result
    ↓
Collection Update
    ↓
Progression / Reward Event

Merge results must be data-driven.

No merge-specific hard-coded chain should be required for every new defense.

---

28. Bosses

Bosses are special enemies with unique mechanics.

Bosses may have:

- Multiple phases
- Special attacks
- Summoning
- Area effects
- Resistances
- Enrage states
- Unique movement
- Special rewards
- Unique VFX/audio
- Boss health UI

Boss architecture must extend the enemy framework rather than create an unrelated enemy engine.

---

29. World Systems

Future world systems may include:

- Weather
- Day/night
- Environmental effects
- Dynamic events
- NPCs
- Story events
- World modifiers
- Map-specific rules

World systems must communicate through controlled contracts/events.

---

30. Weather

Future weather may affect:

- Visibility
- Defense effectiveness
- Enemy behavior
- Movement
- Elements
- VFX
- Audio
- Level modifiers

Weather must not directly modify unrelated systems through hidden dependencies.

---

31. Day / Night

Future day/night may affect:

- Visual lighting
- Enemy types
- Defense effectiveness
- Spawn behavior
- Special events
- Audio
- VFX

It should be implemented as a world system rather than scattered time checks throughout gameplay code.

---

32. Quests

Quests may track player actions such as:

- Defeat enemies
- Complete waves
- Use specific defenses
- Merge items
- Defeat bosses
- Collect resources
- Complete maps
- Complete special conditions

Quest progress should consume gameplay events rather than deeply coupling quests to every system.

---

33. UI / UX

The UI must be mobile-first.

Principles:

- Large touch targets
- Clear hierarchy
- Minimal clutter
- Fast feedback
- Readable typography
- Clear resource information
- Clear combat information
- Clear objective information

Gameplay logic must not be placed directly inside UI classes.

UI should read state and issue commands to gameplay systems.

---

34. Feedback

Important actions should produce appropriate feedback.

Examples:

- Defense placed
- Insufficient resources
- Enemy hit
- Enemy defeated
- Wave completed
- Boss spawned
- Boss phase changed
- Reward received
- Level completed
- Level failed

Feedback may use:

- UI
- Animation
- VFX
- Audio
- Camera effects where appropriate

---

35. Audio

Future audio architecture should separate:

- Music
- Ambient audio
- UI sounds
- Combat sounds
- Enemy sounds
- Defense sounds
- Boss sounds
- Event sounds

Audio IDs should be data-driven where appropriate.

---

36. Visual Effects

VFX must be separated from gameplay logic.

Gameplay should communicate events or effect requests.

VFX should decide how those effects are rendered.

Example:

EnemyDeathEvent
    ↓
VFX System
    ↓
Death Effect

---

37. Asset Architecture

Final architecture should use an asset contract:

Gameplay Definition
        ↓
Visual ID
        ↓
Asset Registry
        ↓
Model / Texture / Animation

Gameplay code should not contain scattered asset paths.

---

38. Save System

The initial game is offline.

Save data must eventually support:

- Version
- Schema
- Validation
- Migration
- Backup
- Recovery
- Corruption handling

Temporary battle state and permanent player progression must be clearly separated.

---

39. Offline-First

The initial release architecture is offline PvE.

The game must remain playable without network connectivity.

Online systems must not become hidden dependencies of the offline game.

---

40. Future Online Architecture

The architecture should remain compatible with future:

- PvP
- Co-op
- Online progression
- Server-authoritative systems
- Synchronization
- Matchmaking
- Anti-cheat

However:

Online networking must not be implemented during the offline foundation unless explicitly approved by the roadmap gate.

The architecture should merely avoid decisions that make future online integration unnecessarily impossible.

---

41. Multiplayer

Future multiplayer may include:

PvP

Players compete against each other through a server-authoritative architecture.

Co-op

Players cooperate against PvE content.

Multiplayer is a future phase and must not contaminate the offline gameplay implementation prematurely.

---

42. Content Scalability

The project must support adding large amounts of content without creating one-off code.

Preferred model:

Definition
    ↓
Generic System
    ↓
Content Instance

For example:

DefenseDefinition
    ↓
Defense System
    ↓
Hundreds of Defense Types

rather than:

DefenseA.js
DefenseB.js
DefenseC.js
...

when the behavior can be represented by data.

---

43. Data Contracts

Planned contracts include:

EnemyDefinition
DefenseDefinition
BossDefinition
RewardDefinition
UpgradeDefinition
QuestDefinition
MapDefinition
MergeDefinition

Every contract must have clear ownership and validation rules.

---

44. System Ownership

Each major system must explicitly define:

- What it owns
- What it reads
- What it modifies
- What it emits
- What it is allowed to call
- What it must never directly control

This prevents the project from becoming a collection of interconnected scripts with hidden dependencies.

---

45. Event-Driven Communication

Where appropriate, systems should communicate through events.

Example:

Enemy Death
    ↓
Reward System
Economy
Quest System
Statistics
UI
VFX
Audio

A system should not need direct knowledge of every consumer of its event.

---

46. Performance

The game must eventually support large numbers of:

- Enemies
- Defenses
- Projectiles
- Effects
- World objects

Mobile performance is a primary constraint.

Optimization targets must eventually be measured rather than guessed.

Potential future techniques:

- Object pooling
- Instancing
- Spatial partitioning
- Culling
- Batched rendering
- Reduced allocations
- Efficient update loops
- LOD where useful

These techniques must be introduced only where measurement justifies them.

---

47. Mobile Performance

The project must prioritize:

- Stable frame rate
- Low memory usage
- Low unnecessary allocations
- Fast loading
- Touch responsiveness
- Thermal stability
- Long-session reliability

Performance testing must occur on actual mobile devices.

---

48. Security / Exploit Resistance

Even in offline mode, important game systems should be designed to minimize accidental corruption or invalid state.

Examples:

- Validate resource transactions
- Validate merge inputs
- Validate progression unlocks
- Validate save data
- Avoid trusting UI state as authoritative gameplay state

Future online systems will require significantly stronger validation.

---

49. Error Handling

Systems must fail safely.

Invalid states should:

- Be detected
- Be logged appropriately
- Avoid corrupting unrelated systems
- Provide useful diagnostic information
- Avoid silent failure

Save corruption must have recovery behavior once saving is implemented.

---

50. Development Rules

No feature is considered complete merely because code exists.

A feature is complete only when:

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
Static Check
↓
Unit Test
↓
Integration Test
↓
Gameplay Test
↓
Regression
↓
Performance
↓
Mobile Test
↓
Documentation
↓
Gate

---

51. Phase Architecture

The project follows controlled phases.

High-level order:

Phase 0 — Full Repository Audit
Phase 1 — Project Memory
Phase 2 — Source of Truth
Phase 3 — System Ownership
Phase 4 — Architecture Foundation
Architecture Gate
Phase 5 — Vertical Slice
Vertical Slice Gate
Phase 6 — Economy
Phase 7 — Progression
Phase 8 — Merge
Phase 9 — Collection
Phase 10 — Bosses
Phase 11 — World Systems
Phase 12 — Quests
Phase 13 — Advanced World
Phase 14 — Content Pipeline Gate
Phase 15 — Content Expansion
Phase 16 — Visual
Phase 17 — VFX
Phase 18 — Audio
Phase 19 — UI/UX
Phase 20 — Performance
Phase 21 — Device Compatibility
Phase 22 — Save / Offline Alpha
Phase 23 — Balance
Phase 24 — QA / Regression
Phase 25 — Release Candidate
Phase 26 — Online Architecture
Phase 27 — Multiplayer
Phase 28 — Live Content
Phase 29 — Launch

---

52. Phase Gates

A phase may not be considered complete until:

- Acceptance criteria pass
- Relevant tests pass
- Regression passes
- Performance is acceptable
- Mobile verification is performed where applicable
- Documentation is updated
- Known risks are recorded
- No unresolved blocker prevents the next phase

The next phase must not start automatically.

---

53. Current Design Priorities

The highest priorities are:

1. Architectural stability
2. Correct system ownership
3. Data-driven content
4. Reliable gameplay loop
5. Save integrity
6. Mobile performance
7. Scalable content pipeline
8. Clear UI/UX
9. Long-term extensibility
10. Future online compatibility

---

54. Design Anti-Goals

Infinity Depths must avoid becoming:

- A collection of unrelated scripts
- A God Object architecture
- UI-driven gameplay
- Hard-coded content
- Duplicate systems
- A fragile prototype that cannot scale
- A game dependent on internet connectivity
- A pay-to-win economy
- A game requiring exploration to understand the battlefield
- A character-movement game that conflicts with its strategy identity

---

55. Final Design Principle

Infinity Depths should feel simple to control but deep to master.

The player should be able to understand the battlefield quickly while discovering increasingly complex interactions between:

Defenses
    +
Enemies
    +
Elements
    +
Status Effects
    +
Economy
    +
Progression
    +
Merge
    +
Collection
    +
Bosses
    +
World Systems

Complexity should come from meaningful strategic interaction, not from confusing controls or unnecessary UI.

---

56. Source of Truth

This document is the design truth.

If implementation differs from this document:

1. Inspect the implementation.
2. Determine whether the implementation or design is intentionally correct.
3. Record the decision in "DECISIONS.md".
4. Update the appropriate document.
5. Never silently allow contradictions to accumulate.

GAME_SPEC defines what the game should be.

PROJECT_STATE defines what the game currently is.

CODE defines what actually executes.

TESTING defines what has been proven.
