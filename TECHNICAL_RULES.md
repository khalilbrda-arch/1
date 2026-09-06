Infinity Depths — Technical Rules

«Purpose: Define the technical rules that all future code in Infinity Depths must follow.

These rules exist to prevent architectural decay, duplicated systems, hidden dependencies, unsafe AI-assisted changes, and untestable gameplay logic.»

Project: Infinity Depths
Version: 1.0
Date: 2026-09-02

---

1. Core Rule

Every change must follow:

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
INSPECT
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

No step may be silently skipped.

---

2. Repository Inspection

Before modifying code:

- Inspect the target file.
- Inspect its direct dependencies.
- Inspect its consumers.
- Inspect related configuration.
- Inspect relevant documentation.
- Search for references before changing APIs.
- Verify that the file actually exists.
- Never assume an implementation from its filename.

---

3. Scope Rule

Every task must have a defined scope.

A task must identify:

- What is being changed.
- Why it is being changed.
- Which files may change.
- Which files must remain untouched.
- Dependencies.
- Acceptance criteria.
- Tests required.

Changes outside the approved scope are not allowed unless a new architectural issue makes them necessary and that issue is documented.

---

4. No Silent Refactoring

Do not combine:

Feature implementation
+
Unrelated refactoring

in the same change unless the refactoring is necessary for the feature.

If refactoring is required:

1. Explain why.
2. Identify affected systems.
3. Preserve behavior.
4. Test before and after.
5. Document the architectural impact.

---

5. No Duplicate Systems

Before creating a new system:

- Search the repository.
- Identify existing related functionality.
- Determine whether the existing system can be extended.
- Reuse it when appropriate.

Never create:

EnemyManager2
DefenseManagerNew
NewCombatSystem
BetterGameState

merely because an existing system is inconvenient.

---

6. Single Responsibility

A system should have a clear primary responsibility.

Examples:

EnemyManager
    → enemy lifecycle

WaveManager
    → wave scheduling

DefenseManager
    → defense lifecycle

Combat
    → combat resolution

Economy
    → resource transactions

Avoid systems that gradually absorb unrelated responsibilities.

---

7. God Object Prevention

Do not allow:

- "Game.js"
- "GameState.js"
- or any other central class

to become a universal owner of unrelated gameplay logic.

When a class begins accumulating responsibilities:

1. Identify the new responsibility.
2. Determine its proper owner.
3. Define communication.
4. Extract only when justified.

Do not split classes mechanically.

---

8. Ownership

Every authoritative state must have one owner.

Examples:

Economy
    → resource balances

Progression
    → XP and unlocks

Collection
    → owned items

Quest
    → quest progress

Enemy
    → enemy runtime state

Other systems may read or request changes through defined interfaces.

---

9. UI Rule

UI is never authoritative gameplay state.

UI may:

- Display state.
- Request commands.
- Show feedback.

UI must not:

- Directly modify resources.
- Directly apply damage.
- Directly spawn enemies.
- Directly complete quests.
- Directly write save files.
- Bypass gameplay validation.

---

10. Input Rule

Input translates user interaction into commands.

Input must not contain gameplay rules.

Bad:

Touch
→ directly subtract money

Preferred:

Touch
→ command
→ Economy validates
→ Economy changes state

---

11. Camera Rule

Camera code may control:

- Position
- Rotation
- Zoom
- Bounds

Camera code must not contain gameplay logic.

---

12. World Rule

World systems own world behavior.

They must not directly modify unrelated systems without a defined contract.

Avoid hidden dependencies such as:

Weather
→ directly changes random defense variables
→ directly changes quest progress
→ directly modifies UI

Use controlled communication.

---

13. Event Rule

Use events for meaningful state changes when multiple systems need to react.

Example:

EnemyDied
    ↓
Reward
Economy
Quest
Statistics
VFX
Audio
UI

The Enemy system should not manually call every consumer.

---

14. Event Ownership

The system that owns the state change emits the event.

Example:

Enemy System
    → owns enemy death
    → emits EnemyDied

Not:

UI
    → emits EnemyDied

---

15. Event Payloads

Event payloads must contain the information consumers actually need.

Avoid passing large internal objects unnecessarily.

Prefer stable identifiers and relevant values where possible.

Example conceptual payload:

EnemyDied
{
    enemyId,
    enemyTypeId,
    position,
    killerId,
    rewardId
}

The exact schema must be defined when the event is implemented.

---

16. Circular Dependency Rule

Avoid dependency cycles.

If:

A → B
B → C
C → A

appears, stop and redesign the dependency.

Possible solutions:

- Event
- Command
- Shared definition
- Higher-level coordinator
- Ownership correction

Do not solve cycles with arbitrary global variables.

---

17. Data-Driven Content

Content should use definitions wherever practical.

Preferred:

DefenseDefinition
EnemyDefinition
BossDefinition
RewardDefinition
UpgradeDefinition
QuestDefinition
MapDefinition
MergeDefinition

Generic systems should consume definitions.

---

18. Definition vs Runtime Instance

Permanent content configuration belongs in definitions.

Temporary gameplay state belongs in runtime instances.

Example:

DefenseDefinition
    damage
    range
    cost
    visualId

DefenseInstance
    position
    target
    cooldown
    runtimeModifiers

Do not mix these unnecessarily.

---

19. IDs

Important content should use stable IDs.

Examples:

defense_basic_cannon
enemy_basic
boss_depth_guardian
reward_gold_small
quest_wave_001

IDs must be:

- Unique
- Stable
- Predictable
- Not dependent on display names

Changing display text should not invalidate ownership or save data.

---

20. Configuration Rule

Configuration should be centralized and structured.

Do not scatter important gameplay constants throughout unrelated files.

Avoid hard-coded values such as:

damage = 37
cost = 125
range = 4.7

when those values are intended to be configurable content.

---

21. Magic Number Rule

Hard-coded numbers are acceptable for genuine technical constants.

Gameplay values should normally come from:

- Definitions
- Configuration
- System constants
- Balance data

---

22. Validation

Every externally supplied or cross-system value that can affect important state must be validated.

Examples:

- Resource amount
- Defense ID
- Enemy ID
- Merge inputs
- Upgrade level
- Quest reward
- Save data

Never assume UI input is valid.

---

23. Economy Transactions

Economy transactions must be atomic.

Conceptually:

Validate
↓
Commit
↓
Emit Result

Never partially spend resources and then discover the purchase is invalid.

---

24. Combat Rules

Combat calculations must be deterministic where practical.

Important calculations should eventually be isolated into testable functions.

Examples:

- Damage
- Critical damage
- Resistance
- Element interaction
- Status application

---

25. Status Effects

Status effects must not be implemented as random flags scattered through enemy code.

Each status should have a defined contract covering:

- ID
- Duration
- Strength
- Stack behavior
- Refresh behavior
- Source
- Expiration

---

26. Targeting

Targeting behavior should be configurable.

Do not create a new hard-coded targeting algorithm for every defense unless its behavior is genuinely unique.

Preferred:

TargetingStrategy
    ↓
Target Query
    ↓
Selected Enemy

---

27. Projectile Rules

Projectiles must have clear ownership and lifecycle.

Lifecycle:

Created
↓
Active
↓
Hit / Expired
↓
Removed or Pooled

Projectile cleanup must be guaranteed.

---

28. Object Pooling

Pooling should be introduced for high-frequency objects when measurement justifies it.

Possible candidates:

- Projectiles
- Damage effects
- VFX
- Temporary enemies
- Floating UI effects

Do not introduce pooling everywhere without evidence.

---

29. Memory Rules

Avoid unnecessary allocations inside high-frequency update loops.

Pay particular attention to:

- Arrays
- Objects
- Vectors
- Strings
- Closures
- Temporary geometry/materials
- DOM operations

Performance decisions must be measured.

---

30. Update Loop Rules

Avoid expensive operations every frame unless required.

Do not repeatedly:

- Search the entire scene unnecessarily.
- Create new objects unnecessarily.
- Recalculate static information.
- Query the DOM excessively.
- Allocate temporary data without need.

---

31. Time

Time-sensitive gameplay should use the central game time.

Current project source:

src/core/Time.js

Avoid creating independent clocks without a documented reason.

---

32. Rendering Rule

Rendering code should remain separate from gameplay rules.

Gameplay should describe:

what happened

Presentation should decide:

how it looks

---

33. Asset Paths

Do not scatter raw asset paths throughout gameplay code.

Prefer:

visualId
audioId
vfxId

resolved through registries or controlled asset systems.

---

34. Asset Loading

Asset loading must eventually support:

- Failure handling
- Loading state
- Missing asset detection
- Caching
- Controlled lifecycle

A missing visual must not silently break gameplay.

---

35. Save Rules

Save data must be versioned.

Every save format must have:

version
schema
validation
migration strategy

Never change save structure without considering existing saves.

---

36. Save Safety

Saving must not:

- Partially overwrite valid data.
- Trust invalid values.
- Destroy previous valid progress unnecessarily.

Future implementation should support backup/recovery.

---

37. No Runtime Object Serialization by Default

Do not serialize entire runtime objects directly.

Save stable data such as:

IDs
Levels
Quantities
Progress
Settings
Unlocks

rather than rendering/runtime references.

---

38. Error Handling

Errors must provide enough context to diagnose the problem.

Prefer:

System
Operation
Entity
Error

over generic errors such as:

Something went wrong

---

39. Logging

Development logging should be:

- Useful
- Contextual
- Removable or controllable for production
- Not excessively noisy

Avoid logging every frame.

---

40. Naming

Names should describe purpose.

Prefer:

DefenseManager
ProjectileManager
WaveManager

Avoid vague names:

Helper
Utils2
Thing
ManagerNew
SystemFinal

---

41. File Organization

Files should be placed according to their primary responsibility.

Current source organization:

src/
├── camera/
├── combat/
├── core/
├── defenses/
├── enemies/
├── input/
├── interaction/
├── ui/
├── waves/
└── world/

Do not reorganize directories merely for aesthetics.

---

42. Import / Dependency Discipline

A file should depend only on what it needs.

Avoid unnecessary global dependencies.

If a dependency is required by many unrelated systems, reconsider whether it represents:

- Shared infrastructure
- A definition
- An event bus
- A service
- Or an architectural mistake

---

43. Global State

Global state should be minimized.

A global reference is acceptable only when:

- Ownership is clear.
- Lifetime is clear.
- Mutation is controlled.
- Tests can isolate it.

---

44. DOM Rules

DOM/UI code should remain in UI-related modules.

Gameplay systems should not manipulate arbitrary DOM elements.

---

45. Three.js Rules

Three.js objects are runtime/rendering objects.

Do not use Three.js scene objects as the authoritative database for gameplay state.

For example, do not determine ownership merely by searching meshes in the scene.

Gameplay state should exist in gameplay systems.

---

46. Scene Graph Rule

The scene graph represents presentation.

Gameplay managers represent gameplay state.

If a defense mesh is removed:

Defense System
    ↓
Defense state updated
    ↓
Rendering representation removed

not the reverse.

---

47. Mobile Touch Rules

Touch interactions must:

- Have sufficiently large targets.
- Avoid accidental triggering.
- Respect camera gestures.
- Prevent unintended UI propagation where required.
- Remain responsive.

---

48. Cache Busting

The current application uses query-based JavaScript cache busting.

Known current version:

?v=11

Whenever JavaScript is changed:

1. Verify whether the changed script is cache-busted.
2. Increment the version when required.
3. Test the deployed page with the new version.

Do not assume the browser has loaded the latest code.

---

49. Browser Compatibility

Avoid APIs that are unsupported on target mobile browsers unless there is a deliberate fallback or compatibility decision.

---

50. Testing Before Completion

A code change cannot be called complete merely because:

- It was written.
- It appears logically correct.
- It was not tested.

At minimum, perform the relevant available validation.

---

51. Testing Levels

Required testing hierarchy:

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

Not every tiny documentation-only change requires all levels.

The appropriate level depends on the change.

---

52. Regression Rule

After modifying a system, verify the systems that depend on it.

Example:

Changing:

Enemy

requires considering:

- EnemyManager
- Combat
- Projectiles
- Waves
- Rewards
- Quests
- UI
- Save

when those systems exist.

---

53. Mobile Verification

A feature affecting:

- Input
- Camera
- Rendering
- UI
- Performance
- Long sessions

must eventually be tested on a real mobile device.

Desktop success is not sufficient proof.

---

54. Performance Rule

Never claim performance is acceptable without measurement.

At minimum, eventually record:

- FPS
- Frame time
- Memory
- Entity count
- Draw calls

---

55. Documentation Rule

Every meaningful architectural or gameplay change must update the relevant documentation.

Possible files:

PROJECT_STATE.md
GAME_SPEC.md
ARCHITECTURE.md
DECISIONS.md
CHANGELOG.md
TESTING.md
ARCHITECTURE_DEBT.md

Do not update every document unnecessarily.

---

56. Git Rules

Stable branch:

main

Preferred development flow:

Feature Branch
↓
Implementation
↓
Testing
↓
Regression
↓
Review
↓
Merge

Do not merge untested large changes into the stable branch.

---

57. Commit Rules

Commits should describe one logical change.

Good:

Add defense placement validation

Bad:

Update everything

A commit should be understandable later.

---

58. Backward Compatibility

When changing an existing API:

1. Find all callers.
2. Update them deliberately.
3. Test all affected systems.
4. Remove obsolete behavior only after verification.

---

59. Deletion Rule

Before deleting a file/function:

- Search references.
- Verify it is unused.
- Check dynamic references.
- Check configuration references.
- Check documentation.
- Confirm no runtime dependency exists.

Deletion must be intentional.

---

60. Migration Rule

When replacing a system:

Old System
↓
New System
↓
Integration
↓
Tests
↓
Regression
↓
Remove Old System

Do not delete the old system first when it is still required for comparison or fallback.

---

61. Feature Acceptance

Every feature must have:

Feature
↓
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
Tests
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

62. AI Development Rules

AI must:

- Read project memory.
- Inspect actual code.
- Never invent files.
- Never invent APIs.
- Never claim tests were run when they were not.
- Never silently refactor.
- Never introduce duplicate systems.
- Never skip regression.
- Never advance phases automatically.

---

63. AI File Delivery Rule

When code or documentation must be manually copied:

- Provide one file at a time.
- Include the complete path.
- Include the complete file contents.
- Do not combine unrelated files.
- Wait for confirmation before continuing when the user requests sequential delivery.

---

64. Stop Rule

After completing the approved task:

IMPLEMENT
↓
TEST
↓
DOCUMENT
↓
REPORT
↓
STOP

Do not automatically start the next feature.

---

65. Emergency Architecture Rule

If implementation reveals a serious architectural problem:

STOP
↓
Document
↓
Assess
↓
Plan
↓
Fix
↓
Test
↓
Regression
↓
Resume

Never bury architectural debt beneath additional features.

---

66. Security Rule

Do not trust:

- UI values
- Save values
- Content IDs
- User-provided values
- Future network input

Important state must be validated by its authoritative owner.

---

67. Determinism

Where gameplay behavior is expected to be reproducible, use controlled inputs and deterministic calculations where practical.

This is especially important for:

- Combat
- Rewards
- Merge
- Progression
- Save/load tests

---

68. Randomness

Randomness must be controlled when it affects:

- Tests
- Replays
- Competitive gameplay
- Save consistency

Use seeded or injectable randomness where required.

---

69. Content IDs and Save Compatibility

Once a content ID is used in persistent data, treat it as stable.

If content is renamed:

Old ID
↓
Migration / Alias
↓
New Display Name

Do not casually reuse old IDs for different content.

---

70. Balance Data

Balance values should be separated from core algorithms where practical.

Changing:

Enemy HP

should not require rewriting:

EnemyManager

---

71. Feature Flags

Feature flags may be used when useful for:

- Development testing
- Experimental systems
- Gradual rollout

Do not allow abandoned flags to accumulate indefinitely.

---

72. Temporary Code

Temporary/prototype code must be identifiable.

If temporary code survives into a later phase:

- Document it.
- Assign an owner.
- Record whether it is intentional debt.

---

73. Technical Debt

Technical debt must be recorded in:

ARCHITECTURE_DEBT.md

Each significant debt item should include:

- Problem
- Impact
- Priority
- Suggested resolution
- Blocking/non-blocking status

---

74. No Premature Optimization

Do not optimize purely based on assumptions.

First:

Measure
↓
Identify bottleneck
↓
Optimize
↓
Measure again

---

75. No Premature Networking

Do not add networking code merely because multiplayer is planned.

Offline gameplay remains the current priority.

Architecture should preserve future compatibility without prematurely implementing network infrastructure.

---

76. No Premature Android Packaging

Do not create a native Android project solely to package the current prototype.

Native packaging belongs to the appropriate later stage after the web/game architecture is stable.

---

77. Production Readiness

Production readiness requires more than gameplay functionality.

It includes:

- Architecture
- Testing
- Save safety
- Performance
- Mobile compatibility
- Content pipeline
- Error handling
- Visual quality
- Audio
- UX
- Release infrastructure

---

78. Final Technical Rule

«The simplest code is not necessarily the smallest code; it is the code whose ownership, dependencies, behavior, and failure modes are understandable.»

Infinity Depths must optimize for:

Correctness
+
Maintainability
+
Testability
+
Scalability
+
Performance
+
Controlled Complexity

rather than short-term speed alone.
