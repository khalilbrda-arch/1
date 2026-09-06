Infinity Depths — CONTENT PIPELINE

1. Purpose

هذا الملف يحدد الطريقة التي سيتم بها إضافة محتوى جديد إلى Infinity Depths دون إعادة كتابة الأنظمة الأساسية.

الهدف:

- إضافة محتوى بسرعة.
- منع تكرار الكود.
- الحفاظ على Architecture.
- فصل البيانات عن المنطق.
- دعم عدد كبير من المحتوى مستقبلًا.

---

2. Core Principle

المحتوى الجديد يجب أن يستخدم الأنظمة الموجودة بدل إنشاء نظام جديد لكل عنصر.

مثال:

إضافة Defense جديد لا تعني إنشاء:

NewDefenseManager
NewDefenseCombat
NewDefenseUI

بل:

Defense Definition
↓
Existing Defense System

---

3. Content Categories

المحتوى المستقبلي يشمل:

- Enemies
- Defenses
- Bosses
- Rewards
- Upgrades
- Items
- Merge Recipes
- Quests
- Maps
- Waves
- Weather
- Events
- Visual Assets
- Audio
- VFX

---

4. Definition-Based Content

المحتوى المتكرر يجب أن يعتمد على Definitions.

مثال:

DefenseDefinition
EnemyDefinition
BossDefinition
RewardDefinition
UpgradeDefinition
QuestDefinition
MapDefinition
MergeDefinition

---

5. Content IDs

كل عنصر محتوى يمتلك ID ثابتًا.

مثال:

enemy_basic
enemy_fast
defense_arrow
defense_cannon
boss_guardian
quest_first_blood
map_island_01

القواعد:

- ID فريد.
- ID واضح.
- لا يتم تغييره بعد استخدامه في Save.
- لا تعتمد الأنظمة على اسم العرض بدل ID.

---

6. Enemy Pipeline

إضافة Enemy جديد:

Enemy Definition
↓
Stats
↓
Traits
↓
Abilities
↓
Rewards
↓
Visual ID
↓
Asset Registry
↓
Existing Enemy System
↓
Tests

لا يتم إنشاء EnemyManager جديد.

---

7. Defense Pipeline

إضافة Defense جديد:

Defense Definition
↓
Cost
↓
Stats
↓
Range
↓
Attack Speed
↓
Targeting
↓
Damage
↓
Effects
↓
Visual ID
↓
Existing Defense System
↓
Tests

---

8. Boss Pipeline

Boss جديد يجب أن يستخدم أنظمة Enemy وCombat الموجودة.

Boss Definition
↓
Base Stats
↓
Phases
↓
Abilities
↓
Rewards
↓
Visual ID
↓
Boss System
↓
Tests

لا يتم إنشاء Combat System جديد للـ Boss.

---

9. Reward Pipeline

Reward Definition تحدد نوع المكافأة وقيمتها.

أمثلة:

- Currency
- Item
- XP
- Unlock
- Collection entry

المكافآت تمر عبر Economy/Progression APIs المناسبة.

---

10. Upgrade Pipeline

Upgrade جديد:

Upgrade Definition
↓
Requirements
↓
Cost
↓
Effect
↓
Validation
↓
Progression System

لا يتم وضع upgrade logic داخل UI.

---

11. Merge Pipeline

Merge Recipe:

Input Definitions
↓
Requirements
↓
Validation
↓
Cost
↓
Result Definition

Merge Engine ينفذ القاعدة.

لا يتم إنشاء merge logic منفصل لكل recipe.

---

12. Quest Pipeline

Quest Definition تحتوي على:

- ID
- Objective
- Requirement
- Target
- Amount
- Reward
- Conditions

مثال:

quest_first_blood
    ↓
Kill Enemy
    ↓
Amount: 1
    ↓
Reward

Quest System يتعامل مع الـ definition.

---

13. Map Pipeline

الخريطة الجديدة يجب أن تعرف:

- Map ID
- Dimensions
- Terrain definition
- Base position
- Enemy paths
- Allowed placement areas
- Environment settings
- Available waves

ولا يجب أن تنسخ gameplay systems.

---

14. Wave Pipeline

الموجات تعتمد على بيانات:

Wave Definition
↓
Enemy IDs
↓
Counts
↓
Spawn Timing
↓
Modifiers

WaveManager ينفذ البيانات.

---

15. Asset Pipeline

الـ gameplay يستخدم:

visualId

بدل معرفة المسار الحقيقي للملف.

التدفق:

Gameplay Definition
↓
visualId
↓
Asset Registry
↓
Asset

---

16. Asset Replacement

يمكن استبدال:

- Model
- Texture
- Animation
- VFX

دون تعديل gameplay إذا بقي الـ visual ID متوافقًا.

---

17. Audio Pipeline

Gameplay يطلق Audio Events/Commands.

مثال:

DefenseFired
EnemyHit
EnemyDeath
WaveStart
WaveComplete
BossSpawn

Audio System يقرر الصوت الفعلي.

Gameplay لا يعرف ملف الصوت مباشرة.

---

18. VFX Pipeline

مثل Audio:

Gameplay Event
↓
VFX System
↓
Effect Definition
↓
Visual Effect

لا يجب وضع VFX logic المعقد داخل Combat أو Enemy.

---

19. Localization

النصوص المعروضة للمستخدم يجب ألا تعتمد مستقبلًا على strings موزعة عشوائيًا في الكود.

يفضل:

textId
↓
Localization Data
↓
Displayed Text

---

20. Content Validation

قبل إضافة المحتوى يجب التحقق من:

- ID uniqueness
- Required fields
- Valid numeric values
- Valid references
- Valid visual IDs
- Valid reward IDs
- Valid upgrade IDs
- Valid map references

---

21. Duplicate Content Prevention

لا يجوز إضافة Definition بنفس ID.

إذا وجد ID مكرر:

STOP
↓
REPORT
↓
FIX

ولا يتم اختيار أحدهما عشوائيًا.

---

22. Content Balance

القيم مثل:

- Damage
- HP
- Cost
- Reward
- Attack Speed
- Range

يجب أن تكون بيانات قابلة للتعديل.

لا يتم دفنها داخل logic إلا عند الضرورة.

---

23. Content Does Not Own Systems

Definition لا تنفذ gameplay بنفسها.

Definition:

DATA

System:

BEHAVIOR

هذا الفصل إلزامي.

---

24. Adding Content Rule

إضافة محتوى جديد يجب أن تكون:

Define
↓
Validate
↓
Register
↓
Connect
↓
Test
↓
Document

---

25. New System Rule

إذا احتاج المحتوى الجديد إلى System جديد:

يجب أولًا إثبات أن الأنظمة الموجودة لا تستطيع التعامل معه.

لا يتم إنشاء System جديد لمجرد أن ذلك أسهل.

---

26. Content Expansion Gate

قبل التوسع الكبير في المحتوى يجب التأكد من:

- Definitions مستقرة.
- IDs مستقرة.
- Registry واضح.
- Validation موجود.
- Save references واضحة.
- Existing systems قابلة لإعادة الاستخدام.
- لا يوجد duplication.

---

27. Content Production

عند الوصول إلى مرحلة Content Expansion:

يمكن إنتاج المحتوى على دفعات.

مثال:

10 Enemies
↓
Validate
↓
Test
↓
10 Defenses
↓
Validate
↓
Test

بدل إضافة مئات العناصر دفعة واحدة دون اختبار.

---

28. Content Regression

إضافة محتوى لا يجب أن تكسر المحتوى القديم.

بعد إضافة دفعة:

- Existing enemies
- Existing defenses
- Existing waves
- Combat
- Economy
- Save

تختبر حسب الأنظمة المتأثرة.

---

29. Content Versioning

إذا كان تغيير المحتوى يؤثر على Save:

يجب تقييم:

- Compatibility
- Migration
- Defaults
- Removed IDs
- Renamed IDs

---

30. Removed Content

لا يتم حذف Content ID مستخدم في Save بشكل مباشر.

بدل ذلك يمكن:

- إبقاؤه.
- Mark as retired.
- Migration.
- Replacement mapping.

حسب الحالة.

---

31. Content Tools

عند زيادة حجم المحتوى، يمكن إنشاء أدوات داخلية تساعد على:

- Validation
- ID generation
- Content inspection
- Balance inspection
- Asset validation

لكن لا يتم إنشاء أدوات ضخمة قبل الحاجة إليها.

---

32. Content Testing

كل محتوى جديد يجب اختباره على المستوى المناسب.

مثال Defense:

Definition
↓
Placement
↓
Targeting
↓
Combat
↓
Reward
↓
Save

مثال Enemy:

Spawn
↓
Path
↓
Combat
↓
Death
↓
Reward

---

33. Content Documentation

المحتوى المهم يجب أن يكون موثقًا في المصدر المناسب.

لا يتم وضع معلومات تصميمية كبيرة داخل comments فقط.

---

34. AI Content Generation

عند استخدام AI لإنتاج محتوى:

AI يجب أن يلتزم بـ:

- Existing IDs
- Existing definitions
- Existing balance rules
- Existing architecture
- Existing naming rules

ولا ينشئ architecture جديدة لكل محتوى.

---

35. Content Batch Rule

عند إنشاء دفعة كبيرة:

Generate
↓
Validate
↓
Review
↓
Test
↓
Commit

لا يتم إدخال آلاف العناصر غير المختبرة إلى المشروع دفعة واحدة.

---

36. Current Content State

المشروع حاليًا في مرحلة Prototype.

المحتوى الحالي يعتمد جزئيًا على Configuration والـ runtime systems.

سيتم توسيع Content Pipeline بعد تثبيت Architecture Foundation.

---

37. Final Principle

«المحتوى يجب أن يكبر أسرع من الكود، لا أن يجعل الكود يكبر بنفس سرعته.»

---

END OF CONTENT_PIPELINE
