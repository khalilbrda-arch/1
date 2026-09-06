Infinity Depths — SAVE SCHEMA

1. Purpose

هذا الملف يحدد عقد نظام الحفظ في Infinity Depths.

نظام الحفظ يجب أن يكون:

- Versioned
- Validated
- Migratable
- Recoverable
- Offline-first
- مستقلًا عن كائنات Runtime

---

2. Current Status

Status: PARTIAL / IMPLEMENTED FOR CURRENT OFFLINE SLICE

SaveManager is implemented for the current offline vertical slice and now persists progression, collection, and quest state in addition to core player/base/wave/defense/interactable data. The full future contract is still not complete: migration, backup/secondary slots, and full recovery tooling remain deferred.

---

3. Save Architecture

النظام المستقبلي:

Gameplay Systems
        ↓
Persistent State
        ↓
Save Manager
        ↓
Serializer
        ↓
Validator
        ↓
Versioned Save Data
        ↓
Local Storage / Persistence

---

4. Save Ownership

"SaveManager" هو المالك الرئيسي لعملية الحفظ.

مسؤولياته:

- إنشاء Save Data.
- تحميل Save Data.
- التحقق من صحة البيانات.
- تحديد Version.
- Migration.
- Backup.
- Recovery.
- التعامل مع فشل الحفظ.

---

5. Runtime Objects Must Not Be Serialized

لا يتم حفظ:

- Three.js Object3D
- Mesh
- Material
- Geometry
- Projectile objects
- Enemy runtime objects
- DOM elements
- Timers
- Runtime references

بدل ذلك يتم حفظ البيانات اللازمة لإعادة بناء الحالة.

---

6. Save Version

كل Save يمتلك Version.

مثال:

schemaVersion: 1

عند تغيير بنية البيانات:

schemaVersion: 2

لا يتم تغيير schema بصمت.

---

7. Save Metadata

كل Save يجب أن يحتوي على Metadata أساسية.

مثال:

{
  "schemaVersion": 1,
  "gameVersion": "0.1.0",
  "createdAt": 0,
  "updatedAt": 0
}

القيم الفعلية ستحدد عند تنفيذ النظام.

---

8. Player State

الحالة المستقبلية للاعب قد تحتوي على:

player
 ├── progression
 ├── economy
 ├── collection
 ├── inventory
 ├── quests
 └── settings

لا يتم إضافة أي field دون حاجة حقيقية.

---

9. Progression Data

الحفظ الفعلي الحالي يتضمن داخل الجذر `progression`:

- unlockedMaps
- unlockedSystems
- unlockedDefenses
- completedMilestones

أما `player.level` و`player.xp` فهما محفوظان ضمن `player` لأنهما جزء من
الحالة القابلة للحفظ الحالية.

Progression لا يخزن كـ runtime objects.

---

10. Economy Data

قد تشمل:

resources
currencies
balances

القيم يجب أن تكون قابلة للتحقق.

يجب منع:

- Negative balances
- Invalid numbers
- NaN
- Infinity

---

11. Inventory Data

Inventory يحفظ IDs والكميات والبيانات الضرورية فقط.

مثال:

{
  "items": [
    {
      "itemId": "defense_basic_arrow",
      "quantity": 2
    }
  ]
}

---

12. Collection Data

Collection قد تحتوي على:

discovered items
owned definitions
unlocked entries
collection progress

لا يتم حفظ الأصول المرئية نفسها.

---

13. Defense Save Data

الدفاع الموجود في العالم يمكن أن يحفظ كبيانات:

{
  "instanceId": "def_001",
  "typeId": "defense_basic_arrow",
  "position": {
    "x": 0,
    "y": 0,
    "z": 0
  },
  "level": 1,
  "currentHp": 100
}

الـ "typeId" يشير إلى Defense Definition.

---

14. Defense Instance IDs

كل Runtime Defense قابل للحفظ يجب أن يمتلك Instance ID ثابتًا داخل Save Data.

لا يعتمد Save على ترتيب العناصر في Array فقط.

---

15. Map State

إذا كان مستوى/خريطة معينة تحفظ حالة مستمرة، يمكن أن تحتوي على:

mapId
completed
stars
bestScore
unlocked

لا يتم حفظ العالم الرسومي كاملًا.

---

16. Quest State

الحالة الحالية يمكن أن تحتوي على active/completed/claimed quest records. الحقول الأساسية داخل كل active quest هي:



questId
status
progress
completed
claimed

مثال:

{
  "questId": "quest_first_blood",
  "status": "active",
  "progress": 3,
  "completed": false
}

---

17. Settings

الإعدادات القابلة للحفظ يمكن أن تشمل:

- Audio settings
- Graphics settings
- Control settings
- Accessibility settings

لكن يجب فصل Settings عن Gameplay State منطقيًا.

---

18. Temporary Battle State

لا يتم حفظ كل تفاصيل المعركة تلقائيًا.

مثل:

- Enemy runtime references
- Projectile positions
- Active timers
- Current target references

سيتم تحديد لاحقًا ما إذا كان Offline Save يسمح باستكمال المعركة أو أن الحفظ يتم في نقاط محددة.

هذا قرار Gameplay مستقل.

---

19. Save Points

في البداية، يمكن أن تكون نقاط الحفظ:

- عند نهاية المستوى.
- عند تغيير مهم في Persistent Progression.
- عند مغادرة gameplay بشكل آمن.
- عند أحداث مهمة يحددها النظام.

سيتم تحديد سياسة الحفظ النهائية أثناء تنفيذ Save System.

---

20. Validation

قبل قبول Save يجب التحقق من:

Structure

هل البنية صحيحة؟

Types

هل الأنواع صحيحة؟

Ranges

هل القيم ضمن الحدود؟

IDs

هل الـ IDs موجودة وصالحة؟

Version

هل schema version مدعومة؟

---

21. Invalid Save

إذا كان Save غير صالح:

لا يتم تحميله بشكل أعمى.

الخطوات:

Load
↓
Parse
↓
Validate
↓
Invalid
↓
Recovery

يجب الحفاظ على Save صالح سابقًا إن وجد.

---

22. Corrupted Save

في حالة تلف البيانات:

1. اكتشاف التلف.
2. عدم الكتابة فوق النسخة السليمة.
3. محاولة Recovery من Backup.
4. تسجيل الخطأ.
5. إظهار حالة مناسبة للمستخدم.

---

23. Backup

عند تنفيذ Save System يجب دراسة وجود Backup Save.

الفكرة:

Primary Save
Backup Save

قبل استبدال النسخة الأساسية يمكن إنشاء نسخة احتياطية عند الحاجة.

---

24. Migration

عند تغيير Schema:

Old Save
↓
Detect Version
↓
Migration
↓
Validate
↓
New Save

مثال:

v1
↓
Migration v1 → v2
↓
Validate
↓
v2

---

25. Migration Rules

Migration يجب أن تكون:

- Explicit
- Deterministic
- Tested
- Version-specific

لا يتم تعديل Save قديم بشكل عشوائي.

---

26. Unknown Fields

عند تحميل Save يحتوي على Fields غير معروفة:

يجب أن يكون behavior محددًا.

في الحالات التي لا تؤثر على سلامة البيانات، يمكن تجاهل الحقول غير المعروفة.

لكن لا يجوز تجاهل Field ضروري دون validation.

---

27. Missing Fields

Field مفقود يجب أن يكون له behavior محدد:

- Default value
- Migration
- Validation failure

حسب أهمية الحقل.

---

28. Numeric Validation

القيم الرقمية المهمة يجب التحقق من:

isFinite(value)

ويجب رفض:

NaN
Infinity
-Infinity

عند عدم السماح بها.

---

29. IDs Validation

أي ID محفوظ يجب أن يكون:

- String صالح.
- غير فارغ.
- معروفًا عند الحاجة.
- متوافقًا مع Definition Registry.

---

30. Save Atomicity

عملية الحفظ يجب ألا تترك النظام في حالة:

Half Written Save

عند الإمكان يجب استخدام استراتيجية تقلل خطر فقدان البيانات.

---

31. Save Failure

إذا فشلت عملية الحفظ:

لا يتم حذف Save السابق.

يجب:

1. تسجيل الخطأ.
2. الحفاظ على آخر Save صالح.
3. إبلاغ النظام بحالة الفشل.
4. محاولة Recovery إذا كان ذلك ممكنًا.

---

32. Local Storage

في مرحلة Offline الأولى يمكن استخدام:

Browser Local Persistence

لكن طبقة Save Architecture يجب ألا تعتمد بشكل مباشر على API واحد.

مثال:

SaveManager
    ↓
Persistence Adapter
    ↓
Local Storage

وبذلك يمكن تغيير التخزين مستقبلًا.

---

33. Future Android Storage

عند الانتقال إلى Android يمكن استبدال Persistence Adapter أو توسيعه دون إعادة بناء Save Model بالكامل.

---

34. Future Online Migration

عند الانتقال إلى Online:

Save Data المحلية ليست تلقائيًا مصدر الحقيقة للسيرفر.

ستحتاج الأنظمة إلى:

Client State
Server State
Synchronization
Conflict Resolution

وهذا خارج نطاق Offline Save الحالي.

---

35. Security

في Offline:

يجب تقليل فرص تلف البيانات.

في Online:

لا يمكن الوثوق بالـ client save كحقيقة نهائية.

---

36. Save Schema Example

الشكل التقريبي المستقبلي:

{
  "schemaVersion": 1,
  "gameVersion": "0.1.0",
  "createdAt": 0,
  "updatedAt": 0,

  "player": {
    "progression": {},
    "economy": {},
    "inventory": {},
    "collection": {},
    "quests": {}
  },

  "maps": {},

  "settings": {}
}

هذا مثال معماري وليس Schema نهائيًا.

---

37. Save Contract Rules

القواعد الأساسية:

1. Save Data لا يحتوي Runtime Objects.
2. كل Save له Version.
3. كل تغيير Schema موثق.
4. البيانات تتحقق قبل الاستخدام.
5. Save القديم لا يحذف بدون سبب.
6. Migration يجب أن تكون قابلة للاختبار.
7. IDs يجب أن تبقى مستقرة.
8. فشل الحفظ لا يجب أن يدمر Save سابقًا.
9. Save System مستقل عن UI.
10. Save System لا يملك gameplay logic.

---

38. Save Testing

قبل اعتبار Save System مكتملًا يجب اختبار:

- Create
- Save
- Load
- Reload
- Missing Save
- Corrupted Save
- Invalid Data
- Version Migration
- Backup
- Recovery
- Data Integrity
- Mobile Persistence

---

39. Current Gate

لا يوجد Save System مكتمل حاليًا.

لذلك:

SAVE_SCHEMA
        ↓
DOCUMENTED

SAVE IMPLEMENTATION
        ↓
NOT STARTED

---

40. Final Principle

«نحفظ البيانات اللازمة لإعادة بناء الحالة، وليس حالة المحرك نفسها.»

---

END OF SAVE_SCHEMA


## Phase 8 — Merge Collection Slice

`collection.items` is persisted as a map of item IDs to positive safe integer quantities. The field is optional for legacy save compatibility; the full Collection System remains Phase 9.


## Collection state — Phase 9

The persisted `collection` object may contain:

- `items`: known item IDs mapped to positive safe integer quantities.
- `unlocked`: known collection item IDs currently unlocked.
- `upgrades`: owned item IDs mapped to bounded integer upgrade levels.

Runtime objects are never serialized. `CollectionSystem` is the runtime owner and `SaveManager` remains the only storage writer.
