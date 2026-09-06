Infinity Depths — AI DEVELOPMENT PROTOCOL

1. Purpose

هذا الملف يحدد الطريقة الإلزامية التي يجب أن يعمل بها أي AI على مشروع Infinity Depths.

الهدف هو:

- منع التخمين.
- منع كسر الأنظمة الموجودة.
- منع إعادة كتابة المشروع بلا داعٍ.
- منع تضخم المعمارية.
- منع إضافة Features خارج المطلوب.
- الحفاظ على استقرار المشروع.
- جعل التطوير قابلًا للتتبع والاختبار.

---

2. Golden Development Cycle

كل مهمة تطوير يجب أن تمر بهذا التسلسل:

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
INSPECT CHANGES
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

لا يجوز تخطي المراحل المهمة.

---

3. READ

قبل تعديل أي شيء يجب قراءة الوثائق المرتبطة بالمهمة.

الأولوية:

PROJECT_STATE.md
AI_DEVELOPMENT_PROTOCOL.md
GAME_SPEC.md
ARCHITECTURE.md
DECISIONS.md

ثم:

TECHNICAL_RULES.md
TESTING.md

ثم الوثائق الخاصة بالنظام المطلوب.

---

4. INSPECT

يجب فحص الكود الفعلي قبل اتخاذ قرار.

لا يجوز افتراض أن النظام:

- موجود.
- غير موجود.
- يعمل.
- مكسور.
- يحتاج إعادة كتابة.

يجب التحقق من repository الفعلي.

---

5. UNDERSTAND

قبل التنفيذ يجب فهم:

- System ownership
- Dependencies
- Data flow
- APIs
- Runtime lifecycle
- Inputs
- Outputs
- Error paths
- Save implications
- Performance implications

---

6. PLAN

قبل كتابة الكود يجب تحديد:

Files To Create

الملفات الجديدة المطلوبة.

Files To Modify

الملفات التي ستتغير.

Files To Leave Untouched

الملفات التي لا تحتاج تعديلًا.

Dependencies

ما الذي يعتمد عليه التغيير؟

Acceptance Criteria

متى نعتبر المهمة ناجحة؟

Tests

كيف سيتم اختبارها؟

Risks

ما الذي قد ينكسر؟

---

7. Scope

كل مهمة لها Scope محدد.

لا يتم تنفيذ:

- Features غير مطلوبة.
- Refactors تجميلية.
- تغييرات architecture غير ضرورية.
- تحسينات عشوائية.
- أنظمة مستقبلية خارج الحاجة الحالية.

---

8. No Guessing

إذا كانت معلومة مهمة غير معروفة:

لا يتم اختراعها.

يجب:

1. فحص repository.
2. فحص الوثائق.
3. فحص references.
4. تحديد الحقيقة.
5. اتخاذ القرار بناءً على evidence.

---

9. No Fake Completion

لا يجوز القول:

Done

إلا إذا:

- تم تنفيذ التغيير.
- تم فحصه.
- تم اختباره بالقدر المناسب.
- تم إجراء Regression مناسب.

إذا لم يتم اختبار شيء:

NOT TESTED

---

10. No Silent Refactoring

لا يتم إعادة هيكلة ملفات غير مرتبطة بالمهمة بصمت.

إذا كان Refactor ضروريًا:

يجب توضيح:

- السبب.
- الملفات المتأثرة.
- المخاطر.
- الاختبارات المطلوبة.

---

11. No Duplicate Systems

قبل إنشاء System جديد:

يجب البحث عن النظام الحالي.

مثال:

لا تنشئ:

EnemySpawner2

إذا كان:

EnemyManager

يمكنه تنفيذ المطلوب.

---

12. Existing Working Systems

إذا كان النظام يعمل:

الأولوية:

Preserve
↓
Integrate
↓
Extend

وليس:

Delete
↓
Rewrite

---

13. Architecture First

عندما تكون المشكلة Architecture:

لا يتم حلها بإضافة hacks متكررة.

يجب معالجة السبب الأساسي إذا كان ذلك ضمن Scope.

---

14. God Object Prevention

لا تضف كل الوظائف إلى:

- GameState
- Game.js
- Manager واحد

فقط لأنه أسهل.

كل System يجب أن يمتلك مسؤولية واضحة.

---

15. Ownership

قبل تنفيذ أي Feature يجب تحديد:

Who owns this data?
Who changes it?
Who reads it?
Who displays it?
Who persists it?

---

16. UI Rule

UI لا يملك gameplay state.

UI:

- يعرض.
- يرسل Intent/Command.
- يستمع للحالة.

Gameplay systems تنفذ التغيير.

---

17. Event Rule

استخدم Events عندما تقلل coupling.

لا تستخدم Events لكل شيء.

قبل إنشاء Event اسأل:

«هل هذا التواصل يحتاج فعلًا إلى decoupling؟»

---

18. Dependency Rule

الاتجاه العام:

Presentation
↓
Application / Commands
↓
Gameplay
↓
Infrastructure

ولا يجب إنشاء dependency عشوائية بين الأنظمة.

---

19. Circular Dependency

إذا أدى التغيير إلى:

A → B
B → A

يجب التوقف وإعادة تصميم العلاقة.

---

20. Data-Driven Rule

المحتوى المتكرر يجب أن يكون Data.

مثال:

DefenseDefinition
EnemyDefinition
QuestDefinition
BossDefinition

بدل:

One Class Per Content Item

---

21. Stable IDs

أي Content ID مستخدم في:

- Save
- References
- Events

يجب ألا يتغير دون Migration.

---

22. Runtime State

لا يتم وضع Runtime state داخل Definition.

Definition:

Static Data

Runtime Instance:

Current State

---

23. Save Awareness

أي Feature تغير Persistent State يجب أن تحدد:

- ماذا يتم حفظه؟
- أين؟
- كيف يعاد تحميله؟
- هل يحتاج Schema change؟
- هل يحتاج Migration؟

---

24. Error Handling

لا يتم تجاهل الأخطاء المهمة.

يجب أن تكون الأخطاء:

- قابلة للاكتشاف.
- قابلة للتتبع.
- واضحة أثناء التطوير.

---

25. Logging

استخدم logging عند الحاجة للتشخيص.

لكن لا تترك:

- Spam logs
- Debug output دائم
- معلومات غير ضرورية في production

---

26. Performance Awareness

قبل إضافة نظام عالي التكرار يجب التفكير في:

- Allocation
- Loops
- Entity count
- DOM operations
- Rendering
- Memory
- Garbage Collection

لكن لا يتم Optimization بلا دليل.

---

27. Mobile Awareness

كل Feature يجب تقييمها من ناحية الهاتف.

خصوصًا:

- Touch
- UI
- Memory
- Rendering
- Performance
- Input latency

---

28. Cache Busting

عند تعديل JavaScript في البنية الحالية:

يجب تحديث query version في "index.html" عند الحاجة.

مثال:

<script src="./src/core/Game.js?v=13"></script>

---

29. Testing

بعد التنفيذ:

Level 1

Static inspection.

Level 2

Unit test إن كان مناسبًا.

Level 3

Integration.

Level 4

Gameplay.

Level 5

Regression.

Level 6

Mobile.

Level 7

Performance.

---

30. Regression

يجب اختبار الأنظمة المتأثرة.

ولا يكفي التأكد من أن Feature الجديدة تعمل.

---

31. Change Inspection

بعد تعديل الملفات يجب فحص:

- Broken references
- Duplicate logic
- Dead code
- Accidental changes
- Circular dependencies
- Wrong imports
- Incorrect paths
- Unexpected behavior

---

32. Documentation

بعد Feature مهمة:

يتم تحديث الوثائق المناسبة.

على الأقل عند الحاجة:

PROJECT_STATE.md
CHANGELOG.md
TESTING.md

ويمكن تحديث:

- ARCHITECTURE.md
- DECISIONS.md
- SAVE_SCHEMA.md
- CONTENT_PIPELINE.md
- ARCHITECTURE_DEBT.md

حسب التغيير.

---

33. Reporting

بعد انتهاء المهمة يجب تقديم تقرير واضح يحتوي على:

IMPLEMENTED
TESTED
NOT TESTED
FILES CHANGED
FILES CREATED
ISSUES
ARCHITECTURE CHANGES
DOCUMENTATION UPDATED
NEXT APPROVED STEP

---

34. No Automatic Advancement

AI لا ينتقل تلقائيًا إلى المرحلة التالية لمجرد أن المهمة الحالية انتهت.

يجب احترام Gate.

---

35. Gate Rule

عند الوصول إلى Gate:

STOP

ثم يتم:

- عرض النتيجة.
- عرض الاختبارات.
- عرض المشاكل.
- انتظار التحقق المطلوب.

---

36. User Verification

عندما تكون هناك حاجة لاختبار على جهاز حقيقي:

AI لا يفترض نجاح الاختبار.

يجب أن تكون النتيجة:

WAITING FOR DEVICE VERIFICATION

حتى يتم الاختبار فعليًا.

---

37. Emergency Fixes

إذا ظهر Bug خطير أثناء Feature:

الأولوية:

STOP FEATURE
↓
ASSESS BUG
↓
FIX IF WITHIN CRITICAL SCOPE
↓
TEST
↓
REGRESSION
↓
RESUME

---

38. Large Changes

أي تغيير كبير يجب تقسيمه إلى خطوات صغيرة.

لا يتم تعديل عشرات الأنظمة دفعة واحدة إلا إذا كانت هناك ضرورة واضحة وخطة اختبار مناسبة.

---

39. File Delivery Rule

عند العمل اليدوي:

كل ملف يقدم بهذا الشكل:

PATH
+
FULL CONTENT

ملف واحد في كل مرة.

لا يتم دمج عدة ملفات في ملف واحد.

---

40. File Creation Rule

لا تنشئ ملفًا جديدًا إلا إذا:

- له مسؤولية واضحة.
- هناك حاجة فعلية له.
- لا يوجد ملف حالي مناسب.

---

41. File Deletion Rule

قبل حذف ملف:

- Search references.
- Check imports.
- Check runtime usage.
- Check save usage.
- Check future dependencies.

ثم احذف فقط إذا ثبت أنه غير مطلوب.

---

42. Migration Rule

عند تغيير architecture أو data contract:

يجب التفكير في:

- Existing data.
- Existing references.
- Save compatibility.
- Migration.
- Regression.

---

43. Security

لا تضف طرقًا تجعل الاقتصاد أو التقدم أو inventory قابلًا للتلاعب بسهولة.

خصوصًا عند التحضير للـ Online.

---

44. Determinism

عند استخدام Randomness في نظام مهم:

يجب التفكير في إمكانية التحكم بها أثناء الاختبارات.

---

45. Content Generation

عند إنتاج محتوى بكميات كبيرة:

Generate
↓
Validate
↓
Review
↓
Test
↓
Integrate

لا يتم إدخال محتوى ضخم غير متحقق منه.

---

46. Documentation Truth

لا يتم تحديث الوثائق لتبدو أفضل من الواقع.

يجب أن تعكس الوثائق الحالة الحقيقية.

مثال خاطئ:

Save System: Complete

إذا لم يتم تنفيذه.

الصحيح:

Save System: Not Implemented

---

47. Status Accuracy

استخدم الحالات:

WORKING
PARTIAL
BROKEN
UNUSED
PLACEHOLDER
UNKNOWN
NOT IMPLEMENTED

ولا تستخدم:

DONE

بلا دليل مناسب.

---

48. Architecture Gate

قبل الانتقال من Architecture Foundation:

يجب التأكد من:

- Ownership
- Dependencies
- Events
- Data Contracts
- Save Boundary
- Error Handling
- Testing Foundation
- Performance Baseline

---

49. Vertical Slice Gate

قبل التوسع:

يجب أن يعمل Gameplay Loop الكامل.

---

50. Content Gate

قبل إنتاج المحتوى بكميات كبيرة:

يجب أن يكون Content Pipeline مستقرًا.

---

51. Release Gate

قبل Release Candidate:

- Gameplay
- Save
- Performance
- Mobile
- QA
- Regression
- Recovery

يجب أن تكون ضمن المستوى المطلوب.

---

52. Forbidden Behaviors

يمنع على AI:

- اختراع ملفات دون حاجة.
- اختراع APIs غير موجودة.
- افتراض أن الكود يعمل.
- حذف أنظمة دون فحص.
- إعادة كتابة النظام بالكامل بلا سبب.
- إنشاء Duplicate Systems.
- إضافة Features خارج Scope.
- تغيير Design Decisions بصمت.
- تغيير Save Schema بصمت.
- ادعاء نجاح اختبار لم يتم إجراؤه.
- الانتقال تلقائيًا عبر Gates.

---

53. Priority Order

عند وجود عدة مشاكل:

1. Data Loss
2. Critical Bugs
3. Broken Core Gameplay
4. Architecture Blocking Issues
5. Regression
6. Performance Blocking Issues
7. Required Feature
8. Polish
9. Optional Improvements

---

54. Definition of Done

المهمة تعتبر Done فقط عندما:

Scope Met
+
Implementation Complete
+
Change Inspection
+
Required Tests Passed
+
Regression Passed
+
Documentation Updated
+
Gate Satisfied

---

55. Current Development Position

المشروع حاليًا:

Phase 0 — Audit
COMPLETE

Phase 1 — Project Memory
IN PROGRESS

والملفات المكتملة حاليًا:

PROJECT_STATE.md
GAME_SPEC.md
ARCHITECTURE.md
ROADMAP.md
TECHNICAL_RULES.md
DECISIONS.md
TESTING.md
SAVE_SCHEMA.md
CONTENT_PIPELINE.md
AI_DEVELOPMENT_PROTOCOL.md

المتبقي من Phase 1:

ARCHITECTURE_DEBT.md

---

56. Final Rule

«AI لا يكتب ما يعتقد أنه يجب أن يكون موجودًا؛ AI يفحص ما هو موجود، يفهمه، ثم يغيّره فقط عندما يكون التغيير مبررًا ومختبرًا.»

---

END OF AI_DEVELOPMENT_PROTOCOL
