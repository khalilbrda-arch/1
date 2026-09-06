[2026-09-06] — Phase 8 Merge scope decision

Merge requires collection integration, but the full scalable Collection System is explicitly Phase 9. Therefore Phase 8 introduces only `GameState.collection.items` as a minimal persistent ownership slice consumed and produced by `MergeSystem`. Ownership APIs, rarity, upgrade state, collection UI, and large-scale catalog behavior remain Phase 9 responsibilities.

The first merge recipe is data-driven: 3 `cannon_core` + 30 currency at level 3 produce 1 `reinforced_cannon_core` and grant 20 XP. One `cannon_core` is granted per completed wave so the mechanic is reachable through normal play without introducing a separate reward system.

---

# Infinity Depths — DECISIONS

> سجل القرارات المعمارية والتصميمية المهمة للمشروع.
>
> هذا الملف يجيب عن سؤال:
> **لماذا اتخذنا هذا القرار؟**
>
> لا يتم تغيير قرار مهم بصمت.
> أي تغيير جوهري يجب أن يُسجل هنا مع السبب والتأثير.

---

## 1. Purpose

هذا الملف هو السجل الرسمي للقرارات المهمة في مشروع Infinity Depths.

يهدف إلى:

- منع إعادة مناقشة القرارات المحسومة دون سبب.
- منع تناقض الأنظمة مع بعضها.
- حفظ أسباب القرارات وليس النتائج فقط.
- مساعدة أي مطور أو نظام AI على فهم تاريخ المشروع.
- منع إعادة بناء الأنظمة العاملة بسبب سوء فهم التصميم.
- توثيق أي تغيير معماري أو تصميمي كبير.

---

# 2. Decision Format

كل قرار مهم يجب أن يحتوي على:

- ID
- Date
- Status
- Decision
- Context
- Reason
- Consequences
- Affected Systems
- Reversal Conditions

الحالات:

- `ACCEPTED`
- `PROVISIONAL`
- `SUPERSEDED`
- `REJECTED`

---

# 3. Core Design Decisions

---

## DEC-001 — Fixed-Angle Top-Down Camera

**Status:** ACCEPTED

**Decision:**

اللعبة تستخدم كاميرا ثابتة الزاوية من منظور Top-Down مائل بحوالي 58 درجة.

**Context:**

اللعبة استراتيجية / Tower Defense / Base Building.

**Reason:**

هذا المنظور:

- مناسب للهواتف.
- يسمح برؤية ساحة المعركة.
- يجعل وضع الدفاعات واضحًا.
- يناسب إدارة القاعدة.
- يتوافق مع الرؤية التصميمية الأساسية للعبة.

**Consequences:**

- لا توجد First Person.
- لا توجد Third Person.
- لا يوجد Player Body مطلوب للـ gameplay.
- لا توجد حركة شخصية داخل العالم.

**Affected Systems:**

- Camera
- Input
- World
- Interaction
- UI
- Defense Placement

**Reversal Conditions:**

لا يتم تغيير القرار إلا إذا تغيرت هوية اللعبة الأساسية.

---

# 4. No Player Character

## DEC-002 — No Controllable Player Body

**Status:** ACCEPTED

**Decision:**

اللاعب لا يمتلك شخصية قابلة للتحكم داخل ساحة المعركة في النسخة الأساسية.

**Reason:**

اللاعب يدير:

- القاعدة.
- الدفاعات.
- الموارد.
- الترقية.
- المعارك.
- الاختيارات الاستراتيجية.

ولا يحتاج إلى شخصية تتحرك في العالم.

**Consequences:**

لا يجب إنشاء:

- PlayerController
- PlayerCharacter
- WASD movement
- Virtual joystick
- Character locomotion

إلا إذا صدر قرار تصميمي جديد رسمي.

---

# 5. No Exploration / Fog of War

## DEC-003 — Full Battlefield Visibility

**Status:** ACCEPTED

**Decision:**

ساحة المعركة المرئية متاحة للاعب من بداية المستوى.

لا يوجد:

- Fog of War
- Exploration system
- Hidden battlefield discovery

**Reason:**

اللعبة تركز على الاستراتيجية وإدارة الدفاعات وليس الاستكشاف.

**Consequences:**

أنظمة World Visibility يجب ألا تضيف ضباب حرب تلقائيًا.

---

# 6. Camera Controls

## DEC-004 — Pan and Zoom Only

**Status:** ACCEPTED

**Decision:**

تحكم الكاميرا الأساسي:

- Pan
- Zoom

ولا توجد حاجة إلى:

- Rotation
- Character movement
- Joystick movement

**Reason:**

تقليل التعقيد وتحسين تجربة الهاتف.

---

# 7. Defense Placement

## DEC-005 — Tap-to-Place Defense

**Status:** ACCEPTED

**Decision:**

وضع الدفاعات يتم بواسطة:

1. اختيار الدفاع.
2. دخول وضع Placement.
3. الضغط على موقع صالح.
4. إنشاء الدفاع.

**Reason:**

هذا أكثر وضوحًا على الهاتف من نظام Drag & Drop.

**Consequences:**

لا يجب تحويل النظام إلى Drag & Drop دون قرار جديد.

---

# 8. Free Defense Placement

## DEC-006 — Free Placement

**Status:** ACCEPTED

**Decision:**

الدفاعات توضع بحرية في المناطق المسموح بها.

لا يعتمد النظام الأساسي على Slots ثابتة.

**Reason:**

يسمح ذلك بعمق استراتيجي أكبر.

**Consequences:**

نظام Placement مسؤول عن:

- Validation
- Bounds
- Valid Area
- Occupancy
- Position

---

# 9. Defense Movement

## DEC-007 — Defense Drag/Move Deferred

**Status:** PROVISIONAL

**Decision:**

تحريك الدفاعات الموضوعة بعد بنائها ليس جزءًا إلزاميًا من النسخة الحالية.

**Reason:**

الأولوية هي تثبيت:

- Placement
- Combat
- Economy
- Progression
- Merge
- Save

قبل إضافة الحركة.

**Future:**

يمكن إضافة Move Mode لاحقًا.

**Constraint:**

لا يتم تصميم المعمارية بطريقة تمنع إضافة نقل الدفاعات مستقبلًا.

---

# 10. Defense System

## DEC-008 — Defense System Is Core Gameplay

**Status:** ACCEPTED

**Decision:**

الدفاعات أحد الأنظمة المركزية في اللعبة.

الدفاع يمتلك بيانات وسلوكًا منفصلًا عن UI.

**Reason:**

المشروع يستهدف عددًا كبيرًا من أنواع الدفاعات.

**Consequences:**

يجب أن يكون النظام:

- Data-driven
- قابلًا للتوسع
- قابلًا للاختبار
- مستقلًا عن UI

---

# 11. Combat

## DEC-009 — Combat Is Separate From Defense UI

**Status:** ACCEPTED

**Decision:**

نظام Combat لا يعتمد على UI لتنفيذ منطق الضرر.

UI يعرض الحالة فقط.

**Reason:**

الفصل بين Presentation وGameplay.

**Consequences:**

الضرر يجب أن يحدث داخل أنظمة gameplay وليس داخل DOM/UI.

---

# 12. Projectile System

## DEC-010 — Projectiles Have Their Own System

**Status:** ACCEPTED

**Decision:**

المقذوفات تدار بواسطة:

- Projectile
- ProjectileManager

بدل إنشاء منطق projectile منفصل داخل كل Defense.

**Reason:**

يسمح ذلك بـ:

- Pooling لاحقًا.
- تحسين الأداء.
- توحيد collision/hit behavior.
- التحكم في عدد المقذوفات.

---

# 13. Enemy System

## DEC-011 — Enemy Runtime Instances

**Status:** ACCEPTED

**Decision:**

Enemy Definition منفصل عن Enemy Runtime Instance.

**Definition:**

يحتوي على بيانات النوع.

**Instance:**

يمثل عدوًا موجودًا فعليًا أثناء اللعب.

**Reason:**

للسماح بوجود مئات وآلاف الأعداء دون تكرار بيانات ثابتة لكل instance.

---

# 14. Wave System

## DEC-012 — Waves Are Separate System

**Status:** ACCEPTED

**Decision:**

WaveManager مسؤول عن موجات الأعداء.

EnemyManager مسؤول عن إدارة الأعداء.

**Reason:**

منع دمج Spawn Logic وEnemy Runtime Management في نظام واحد.

**Consequences:**

WaveManager لا يصبح EnemyManager.

---

# 15. Base Health

## DEC-013 — Base Is Gameplay State

**Status:** ACCEPTED

**Decision:**

صحة القاعدة جزء من حالة gameplay.

عندما يصل العدو إلى القاعدة ويهاجمها:

- يتم تقليل Base HP.
- عند الوصول إلى حالة الخسارة يتم إنهاء الجولة.

**Reason:**

هذا هو الهدف الأساسي لـ Tower Defense.

---

# 16. Game State

## DEC-014 — Avoid GameState God Object

**Status:** ACCEPTED

**Decision:**

GameState موجود لإدارة الحالة المشتركة الضرورية، لكنه لا يتحول إلى God Object.

**Reason:**

المشروع كبير وسيحتوي على أنظمة عديدة.

إضافة كل شيء إلى GameState ستؤدي إلى:

- Coupling
- صعوبة الاختبار
- Circular Dependencies
- صعوبة الصيانة

**Rule:**

إذا أصبح نظام جديد يحتاج إلى إضافة عشرات الوظائف إلى GameState، يجب إعادة تقييم التصميم.

---

# 17. Event Architecture

## DEC-015 — Event-Driven Cross-System Communication

**Status:** ACCEPTED

**Decision:**

عند استقرار Architecture Foundation سيتم استخدام Events للتواصل بين الأنظمة التي لا يجب أن تعتمد مباشرة على بعضها.

مثال:

`EnemyDeathEvent`

يمكن أن تستمع إليه:

- Economy
- Quest
- Statistics
- UI
- Progression

**Reason:**

تقليل coupling.

---

# 18. Direct Dependencies

## DEC-016 — Direct Calls Allowed Inside Clear Ownership

**Status:** ACCEPTED

**Decision:**

ليست كل الاتصالات يجب أن تصبح Events.

يمكن استخدام Direct Calls عندما تكون العلاقة واضحة ويمتلك نظام ما النظام الآخر فعليًا أو يحتاج إلى API مباشر.

**Reason:**

Event-driven architecture ليست هدفًا بحد ذاتها.

الإفراط في Events يؤدي إلى:

- صعوبة تتبع flow.
- debugging أصعب.
- implicit behavior.

---

# 19. Data-Driven Content

## DEC-017 — Content Must Be Data-Driven

**Status:** ACCEPTED

**Decision:**

المحتوى المتكرر يجب ألا يحتاج إلى كتابة gameplay logic جديد لكل عنصر.

أمثلة:

- Enemy types
- Defense types
- Boss definitions
- Rewards
- Upgrades
- Quests
- Maps
- Merge recipes

**Reason:**

المشروع يستهدف حجم محتوى كبير.

---

# 20. Definition vs Runtime Instance

## DEC-018 — Separate Definitions From Runtime State

**Status:** ACCEPTED

**Decision:**

يجب الفصل بين:

`Definition`

و

`Runtime Instance`

مثال:

```text
DefenseDefinition
        ↓
Defense Instance
```

---

# 21. Save Points and Game Over

## DEC-019 — Game Over Clears The Save Instead Of Persisting A Loss State

**Status:** ACCEPTED

**Decision:**

عند BaseDestroyed، يقوم SaveManager بمسح الحفظ الحالي بدل حفظ حالة
"خسارة" (base.hp = 0).

الأسباب:

- GameOverUI.retryButton الحالي يعتمد على `window.location.reload()`
  فقط — لا يوجد مسار "بدء لعبة جديدة" منفصل بعد.
- لو حُفِظت حالة القاعدة المدمَّرة، إعادة تحميل الصفحة (بعد الضغط على
  "إعادة المحاولة") كانت ستُطبِّق فورًا نفس حالة "خسارة" ويظهر Game
  Over من جديد دون أي لعب فعلي — وهذا يكسر الزر تمامًا.
- نقاط الحفظ (SAVE_SCHEMA.md §19) هي أساسًا "نهاية مستوى/موجة" — وليس
  "نهاية اللعبة بخسارة". WaveCompleted نقطة حفظ طبيعية؛ BaseDestroyed
  ليست كذلك.

**Consequence:**

بعد Game Over، إعادة تحميل الصفحة تبدأ لعبة جديدة فعليًا (لا حفظ
موجود). إذا أُضيف لاحقًا مسار "استمرار/بدء جديد" منفصل، يجب إعادة
النظر في هذا القرار (مثلًا: حفظ حالة الخسارة تحت مفتاح منفصل بدل مسح
الحفظ الأساسي).

---

## DEC-020 — "On Mobile" Vertical Slice Verification Means Real-Device Browser Testing (Not Native Packaging)

**Status:** ACCEPTED

**Decision:**

بوابة Vertical Slice Gate (ROADMAP.md Phase 5) تشترط تحققًا "on
mobile". هذا القرار يوثّق أن اختبارًا حقيقيًا على متصفح جهاز موبايل
فعلي (وليس محاكي/متصفح كمبيوتر فقط) يُعتبر كافيًا لتحقيق هذا الشرط
في هذه المرحلة من المشروع — طالما لا يوجد تطبيق أصلي (native) بعد.

**Context:**

TECHNICAL_RULES.md يمنع صراحة إنشاء مشروع Android أصلي فقط لتغليف
النموذج الحالي؛ منصة الاستهداف الحالية هي متصفح الويب على الموبايل.
بالتالي "real device" في سياق هذه المرحلة يعني الجهاز + متصفحه، وليس
تطبيقًا مُعبَّأ.

**Reason:**

- طلب اختبار على تطبيق أصلي غير موجود أصلًا يوقف التقدم بلا داعٍ.
- الاختبار الفعلي (وليس محاكي/DevTools) يكشف مشاكل اللمس والأداء
  الحقيقية التي يهتم بها Phase Gate.

**Consequence:**

Vertical Slice Gate أُغلق بتاريخ 2026-09-06 بناءً على تأكيد مالك
المشروع بأن الاختبار تم على متصفح هاتف حقيقي. عند إضافة تغليف أصلي
(Android/iOS) لاحقًا، يجب إعادة النظر في هذا القرار وإضافة اشتراط
اختبار على التطبيق المُعبَّأ أيضًا لبوابات المراحل اللاحقة.

**Affected Systems:**

Project governance / Phase Gates (ROADMAP.md, PROJECT_STATE.md).

---

## DEC-021 — EconomySystem Is the Sole Runtime Currency Authority; GameState's Duplicate Methods Removed

**Status:** ACCEPTED

**Decision:**

حُذفت `canAfford()`، `spendCurrency()`، و`rewardEnemyKill()` من
`GameState.js`. `EconomySystem` هو المصدر الوحيد الموثَّق والمخوَّل
لقراءة/تعديل رصيد العملة أثناء التشغيل. `GameState.player.currency`
هو صورة قابلة للحفظ فقط (persisted snapshot)، تُزامَن عبر حدث
`CurrencyChanged`.

**Context:**

فحص شامل لكل المستودع (grep) أثبت أن لا شيء يستدعي هذه الدوال الثلاث
بعد الآن — كل الأنظمة (`DefenseManager`, `Interactables`, `Game.js`)
تستخدم `EconomySystem` مباشرة بالفعل. تعليقات هذه الدوال في
GameState.js كانت تصف "هجرة مؤقتة قيد الحدوث" رغم أن الهجرة كانت قد
اكتملت فعليًا في مرحلة سابقة — التعليقات كانت قديمة/غير دقيقة، مما
يخلق التباسًا حول من يملك الرصيد فعلًا. بوابة Phase 6 تشترط "Economy
state" واضحة بلا ازدواجية ملكية.

**Reason:**

- إزالة كود ميت مؤكَّد (لا مستدعين) بدل إبقائه كمصدر التباس.
- الوضوح المعماري: ملكية واحدة فقط للرصيد أثناء التشغيل.

**Consequence:**

أي كود مستقبلي يحتاج فحص/تعديل الرصيد يجب أن يستدعي `EconomySystem`
مباشرة. اختبارات `phase4-foundation/integration/regression` التي
كانت تحمّل `GameState.js` بمحاكاة CONFIG محدودة احتاجت تحديثًا
لإضافة `CONFIG.ECONOMY.STARTING_CURRENCY` (كان هذا الحقل غير موجود
قبل هذا القرار).

**Affected Systems:**

src/core/GameState.js, src/economy/EconomySystem.js,
tests/phase4-*.test.js

---

## DEC-022 — Economy Transactions Must Reject Non-Finite Values (NaN/Infinity), Not Just Negatives

**Status:** ACCEPTED

**Decision:**

كل دوال `EconomySystem` (init/canAfford/spend/add/rewardEnemyKill/
getBalance) تستخدم الآن حارس تحقق واحد (`_sanitizeAmount`) يرفض أي
قيمة غير منتهية (NaN أو Infinity) بالإضافة إلى القيم السالبة، ويُرجع
0 بدلها. `SaveManager.serialize()` يستخدم نفس منطق `Number.isFinite`
عند تسلسل `currency`.

**Context:**

الفحص أثبت أن `Math.max(0, Number(x) || 0)` (النمط المستخدم سابقًا
في كل مكان) لا يوقف `Infinity`: `Number(Infinity) || 0` تساوي
`Infinity` (لأن Infinity قيمة truthy)، و`Math.max(0, Infinity)`
تساوي `Infinity`. هذا يخالف SAVE_SCHEMA.md §10 صراحة ("يجب منع:
Negative balances, Invalid numbers, NaN, Infinity") وGAME_SPEC.md
§48 ("Validate resource transactions").

**Reason:**

- ثغرة تحقق حقيقية موثَّقة، وليست تخمينًا — تم التحقق منها بالفعل
  عبر تتبع القيم رياضيًا وكتابة اختبار يُثبتها.
- جانب القراءة (`SaveManager.validate()`) كان يرفض `Infinity` بشكل
  صحيح أصلًا؛ الثغرة كانت في جانب الكتابة فقط، لذا الإصلاح مركّز
  وليس إعادة كتابة شاملة.

**Consequence:**

أي قيمة Infinity/NaN تصل لأي دالة اقتصادية تُعامَل كـ 0 بصمت بدل أن
تُفسد الرصيد. تمت تغطيتها بـ tests/phase6-economy.test.js.

**Affected Systems:**

src/economy/EconomySystem.js, src/save/SaveManager.js

---

## DEC-023 — Phase 6 Economy Scope Stays Single-Currency

**Status:** ACCEPTED

**Decision:**

تنفيذ Phase 6 يقتصر على تقوية وتوثيق نظام العملة الواحدة الحالي
(التحقق، الواجهة، التوازن الأساسي، الحفظ) — بدون اختراع أنواع موارد
جديدة (موارد مستوى، مواد ترقية، مواد دمج، عملات خاصة).

**Context:**

GAME_SPEC.md §24 ينص صراحة: "Exact resource names and values must
be defined before the final Economy implementation." لا يوجد قرار
مسجل بعد يحدد هذه الأسماء/القيم.

**Reason:**

- تنفيذ موارد متعددة بدون قرار تصميمي محسوم هو تخمين (Rule "No
  Guessing" في AI_DEVELOPMENT_PROTOCOL.md).
- يمنع تضخم النطاق (Scope) خارج حدود بوابة Phase 6 المطلوبة فعليًا:
  "authoritative, validated, testable, persistent" — لا تشترط عدة
  موارد.

**Consequence:**

أي عمل مستقبلي على موارد متعددة يتطلب قرارًا معماريًا جديدًا يُسجَّل
هنا أولًا، قبل التنفيذ.

**Affected Systems:**

src/economy/EconomySystem.js, src/core/Config.js, GAME_SPEC.md §24

---
