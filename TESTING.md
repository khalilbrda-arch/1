## Phase 11 Verification

- Dedicated Phase 11 suite: 6 tests.
- Full regression target after Phase 11: 160 tests.
- Static checks include index script presence/order and source syntax.
- Browser navigation remains environment-blocked for local URLs; no visual-play claim is made.

Infinity Depths — TESTING

1. Purpose

هذا الملف يحدد طريقة اختبار مشروع Infinity Depths.

الهدف هو عدم اعتبار أي ميزة مكتملة لمجرد أن الكود لا يحتوي على خطأ واضح.

الميزة تعتبر مكتملة فقط بعد اختبارها بالقدر المناسب والتأكد من عدم كسر الأنظمة الموجودة.

---

2. Testing Principle

قاعدة المشروع:

CODE
↓
STATIC CHECK
↓
UNIT TEST
↓
INTEGRATION TEST
↓
GAMEPLAY TEST
↓
REGRESSION TEST
↓
MOBILE TEST
↓
PERFORMANCE TEST
↓
DOCUMENT

ليس كل نظام يحتاج كل مستوى بنفس العمق، لكن لا يجوز تجاهل الاختبارات المناسبة لطبيعة التغيير.

---

3. Testing Levels

3.1 Static Testing

فحص الكود دون تشغيل اللعبة.

يشمل:

- Syntax errors
- Missing imports
- Broken references
- Duplicate functions
- Duplicate systems
- Wrong paths
- Undefined variables
- Invalid dependencies
- Circular dependencies
- Dead code introduced by the change

---

3.2 Unit Testing

اختبار أصغر وحدة منطقية بشكل مستقل.

أمثلة مستقبلية:

- Damage calculation
- Cost calculation
- Affordability
- Upgrade calculation
- Reward calculation
- Merge validation
- Save validation
- Save migration

---

3.3 Integration Testing

اختبار تفاعل أكثر من نظام.

أمثلة:

Enemy Death
↓
Reward
↓
Economy

أو:

Defense
↓
Target
↓
Projectile
↓
Enemy Damage

أو:

Wave
↓
Enemy Spawn
↓
Enemy Path
↓
Base Damage

---

3.4 Gameplay Testing

اختبار اللعبة كما يستخدمها اللاعب.

مثال:

Start Game
↓
Place Defense
↓
Start Wave
↓
Enemy Attacks
↓
Defense Attacks
↓
Enemy Dies
↓
Reward
↓
Wave Ends

يجب التأكد من أن التجربة كاملة وليست مجرد أن كل نظام يعمل منفردًا.

---

4. Regression Testing

بعد كل تغيير يجب التأكد من أن الأنظمة التي كانت تعمل قبل التغيير ما زالت تعمل.

خصوصًا:

- Camera
- Touch Controls
- World Interaction
- Defense Placement
- Enemies
- Waves
- Combat
- UI

لا يكفي اختبار الميزة الجديدة فقط.

---

5. Mobile Testing

Infinity Depths لعبة Mobile-First.

لذلك يجب اختبار الميزات المهمة على جهاز حقيقي.

يتم التحقق من:

- Touch input
- Camera gestures
- UI scale
- Button interaction
- Placement
- Combat
- Performance
- Memory
- Orientation
- Browser behavior
- Loading
- Reload

---

6. Performance Testing

يجب قياس الأداء بدل التخمين.

المؤشرات الأساسية:

- FPS
- Frame Time
- CPU usage
- GPU usage
- Memory usage
- Draw Calls
- Active Entities
- Active Projectiles
- Loading Time

عند ظهور مشكلة أداء:

Measure
↓
Find Bottleneck
↓
Change
↓
Measure Again
↓
Regression

لا يتم إجراء Optimization عشوائي.

---

7. Test Categories

كل اختبار يجب أن ينتمي إلى فئة واضحة:

CORE

الحالة الأساسية للعبة.

INPUT

Touch وGesture.

CAMERA

Pan وZoom وBounds.

WORLD

الخريطة والتفاعل.

ENEMY

إنشاء الأعداء وحركتهم وحالتهم.

WAVES

الموجات والتوقيت والإنهاء.

DEFENSE

البناء والوضع والخصائص.

COMBAT

Targeting وDamage وProjectiles.

ECONOMY

Resources وTransactions.

PROGRESSION

Unlocks وLevels.

MERGE

الدمج والتحقق والنتائج.

COLLECTION

Inventory وCollection.

BOSS

Boss behavior والـ mechanics.

WORLD SYSTEMS

Weather وDay/Night وغيرها.

QUEST

Objectives وProgress.

SAVE

Save / Load / Validation / Migration.

UI

العرض والتفاعل.

AUDIO

Audio triggering وstates.

VFX

Visual effects.

PERFORMANCE

FPS / Memory / Entity limits.

---

8. Test Naming

يجب أن يكون اسم الاختبار واضحًا.

مثال:

defense_can_be_placed_on_valid_position
defense_cannot_be_placed_on_invalid_position
enemy_takes_damage_from_projectile
enemy_death_grants_reward
wave_completes_after_all_enemies_die
save_load_preserves_defense_position

---

9. Acceptance Criteria

كل Feature يجب أن تمتلك Acceptance Criteria قبل اعتبارها مكتملة.

الصيغة:

FEATURE
↓
SCOPE
↓
ACCEPTANCE CRITERIA
↓
IMPLEMENTATION
↓
TESTS
↓
REGRESSION
↓
DOCUMENTATION
↓
GATE

---

10. Feature Test Example

مثال:

Feature

Defense Placement.

Acceptance Criteria

- يمكن اختيار Defense.
- يمكن الدخول إلى Placement Mode.
- يمكن وضع Defense في موقع صالح.
- لا يمكن وضعه في موقع غير صالح.
- يتم خصم التكلفة الصحيحة.
- لا يمكن البناء بدون موارد كافية.
- يظهر Defense في المكان الصحيح.
- لا يكسر Wave أو Combat.
- يعمل على الهاتف.

---

11. Regression Baseline

الأنظمة الحالية التي يجب اعتبارها Regression Baseline:

- Core Foundation
- 3D World
- Camera
- Touch Controls
- World Interaction
- Defense Map
- Enemies
- Waves
- Defenses
- Combat
- Existing UI

أي تعديل على Architecture أو Gameplay يجب أن يتحقق من الأنظمة المتأثرة مباشرة والأنظمة الموجودة في هذه القائمة.

---

12. Current Known Testing State

الحالة الحالية:

Confirmed By Phone

- Core Foundation
- 3D World
- Camera & Touch Controls
- World Interaction
- Defense Map
- Enemies
- Waves

Implemented But Awaiting Phone Confirmation

- Defenses
- Combat

Not Yet Implemented

- Economy
- Progression
- Merge
- Collection
- Bosses
- Weather
- Day/Night
- Quests
- Advanced World
- Save
- Offline Alpha
- Balance
- Multiplayer

---

13. Automated Testing

حاليًا لا يوجد Test Runner واضح داخل repository.

لذلك لا يتم اختراع Test Framework أو إضافة dependency كبيرة دون الحاجة.

سيتم إنشاء Testing Infrastructure عندما يكون ذلك مناسبًا للمعمارية.

---

14. Manual Testing

إلى أن يتم إنشاء automated testing infrastructure، الاختبارات اليدوية موثقة ومطلوبة.

عند اختبار ميزة يدويًا يجب تسجيل:

Feature:
Date:
Device:
Browser:
Result:
Steps:
Expected:
Actual:
Issues:

---

15. Bug Classification

الأخطاء تصنف إلى:

CRITICAL

تمنع تشغيل اللعبة أو تسبب فقدان البيانات أو انهيار النظام الأساسي.

HIGH

تكسر نظامًا أساسيًا أو gameplay loop.

MEDIUM

تؤثر على ميزة مهمة لكن يوجد workaround.

LOW

مشكلة محدودة أو تجميلية.

---

16. Bug Rule

لا يتم إخفاء Bug لأنه خارج Scope.

إذا تم اكتشاف Bug أثناء العمل:

- إذا كان ناتجًا مباشرة عن التغيير: يجب إصلاحه.
- إذا كان قديمًا وخارج Scope: يسجل في Architecture Debt أو Bug tracking المناسب.
- إذا كان يمنع Gate: يجب إصلاحه قبل التقدم.

---

17. Save Testing

عند إنشاء Save System يجب اختبار:

- Save creation
- Save loading
- Missing save
- Corrupted save
- Invalid data
- Old schema
- Migration
- Backup
- Recovery
- Reload persistence

ويجب التأكد من أن فشل Save لا يؤدي إلى تدمير البيانات السابقة.

---

18. Economy Testing

عند إنشاء Economy يجب اختبار:

- Starting resources
- Spending
- Rewards
- Insufficient resources
- Negative values
- Repeated transactions
- Duplicate rewards
- Upgrade costs
- Save/load consistency

---

19. Combat Testing

يجب اختبار:

- Target acquisition
- Target loss
- Range
- Attack cooldown
- Projectile creation
- Projectile movement
- Hit detection
- Damage
- Enemy death
- Status effects
- Multiple enemies
- Multiple defenses

---

20. Wave Testing

يجب اختبار:

- Wave start
- Spawn timing
- Spawn count
- Enemy types
- Wave completion
- Multiple waves
- Base damage
- Game over
- Restart
- Wave state after pause/reload عندما يصبح ذلك متاحًا.

---

21. Performance Thresholds

لا يتم تحديد أرقام نهائية قبل قياس الأجهزة المستهدفة.

سيتم إنشاء Baseline واقعي بعد توفر:

- Target devices
- Typical enemy count
- Typical defense count
- Projectile count
- VFX load

بعد ذلك يتم تحديد الحدود المطلوبة.

---

22. Mobile Gate

قبل اعتبار مرحلة Mobile Compatibility مكتملة:

- اللعبة تعمل على الجهاز المستهدف.
- Touch يعمل.
- Camera يعمل.
- UI قابل للاستخدام.
- Placement يعمل.
- Combat يعمل.
- لا توجد أخطاء حرجة.
- الأداء مقبول.
- لا توجد مشاكل واضحة في الذاكرة.

---

23. Architecture Gate Testing

قبل الخروج من Architecture Foundation يجب التأكد من:

- لا توجد dependencies دائرية حرجة.
- Ownership واضح.
- Gameplay ليس داخل UI.
- Save boundary واضح.
- Data contracts واضحة.
- Events الأساسية تعمل عند الحاجة.
- Error handling موجود في النقاط الحرجة.
- Testing foundation قابل للتوسع.
- لا توجد duplicate systems.
- الأنظمة الحالية لم تتكسر.

---

24. Vertical Slice Gate

قبل اعتبار Vertical Slice ناجحًا:

Start
↓
Gameplay
↓
Enemy Spawn
↓
Defense
↓
Combat
↓
Reward
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

يجب أن يعمل المسار كاملًا.

---

25. Test Evidence

لا يتم كتابة:

Tested successfully

بدون وجود اختبار فعلي.

عند الانتهاء من ميزة، التقرير يجب أن يوضح:

TESTED:
- Static: PASS
- Unit: PASS / N/A
- Integration: PASS / N/A
- Gameplay: PASS / N/A
- Regression: PASS / N/A
- Mobile: PASS / NOT TESTED
- Performance: PASS / NOT TESTED

---

26. Not Tested Rule

إذا لم يتم اختبار شيء فعليًا، يجب قول:

NOT TESTED

ولا يجوز تحويلها إلى:

PASS

بناءً على التخمين.

---

27. Test Failure Rule

إذا فشل اختبار مهم:

STOP
↓
INVESTIGATE
↓
FIX
↓
RETEST
↓
REGRESSION

لا يتم الانتقال إلى Feature جديدة إذا كان الفشل يمنع Gate.

---

28. Test Documentation

بعد اكتمال Feature مهمة، يتم تحديث:

- TESTING.md
- PROJECT_STATE.md
- CHANGELOG.md

والملف المناسب الآخر عند الحاجة.

---

29. Testing and Git

لا يتم دمج Feature Branch إلى "main" إذا كان الاختبار المطلوب للميزة لم يكتمل.

"main" يجب أن يبقى:

Stable
Tested
Recoverable

---

30. Current Testing Gate

الحالة الحالية:

Phase 0 Audit
        ↓
COMPLETE

Phase 1 Project Memory
        ↓
IN PROGRESS

Architecture Foundation
        ↓
NOT STARTED

لا يوجد حاليًا Architecture Gate مكتمل.

---

31. Final Testing Rule

القاعدة النهائية:

«الكود ليس دليلًا على النجاح. الاختبار هو الدليل.»

ولا تعتبر أي ميزة مكتملة إلا عندما يكون لدينا دليل مناسب على أنها:

- تعمل.
- لا تكسر الموجود.
- تحقق المتطلبات.
- مناسبة للمنصة المستهدفة.
- لا تسبب مشكلة أداء غير مقبولة.

---

END OF TESTING


## Phase 9 — Collection

Required checks:

- `npm run test:phase9`
- `npm test`
- `node --check` for every source JavaScript file

Coverage includes centralized definitions, ownership/quantity bounds, stackability, deterministic unlocks, upgrade state, merge eligibility, malformed-state sanitization, persistence, save validation, and MergeSystem/CollectionSystem ownership boundaries.


## Phase 10 — Bosses

Verification: 9 dedicated Phase 10 regression tests pass. The current full regression suite is 185/185. Bosses are instantiated as Enemy instances through EnemyManager; BossSystem owns only boss-specific mechanics and event hooks.


## Phase 12 — Quests

Verification: 12 dedicated Phase 12 tests pass. Full regression suite passes at 185/185 after the current Phase 12 integration and cross-phase regressions. Coverage includes centralized quest definitions, event-driven progress, match filtering, completion idempotence, reward-claim boundaries, persistence, malformed save rejection, DefensePlaced event integration, and UI/Game ownership boundaries.



## Phase 13 — Advanced World

Dedicated automated gate: **10/10** tests passed. Coverage includes configuration validation, NPC interaction, story progression, dynamic event/map-rule activation and clearing, persistence, malformed-save rejection, interaction-boundary routing, map-rule integration, old-save defaults, and version consistency.
