/**
 * Infinity Depths
 * Phase 5 — Boot Order Regression Test
 *
 * الهدف:
 * الاختبارات الأخرى (phase4-*, phase5-*) تحمّل كل نظام في سياق (vm context)
 * منفصل أو جزئي. هذا لا يكتشف أخطاء تنتج فقط عن التحميل التسلسلي الحقيقي
 * لكل ملفات index.html معًا في نفس النطاق العام (global scope)، وهو بالضبط
 * ما سبّب انهيار الإقلاع الموثّق في PROJECT_STATE.md §45 Risk 7:
 * `class WaveManagerClass` (سابقًا كان اسمها متطابقًا) كانت تُظلّل
 * (shadow) الكائن الـ singleton المُصدَّر بنفس الاسم بشكل صامت، ولم يكتشفه
 * أي فحص نصي/ثابت لأنه فحص محتوى الملفات وليس تحليل التحميل الفعلي.
 *
 * هذا الاختبار يحمّل *كل* ملفات src/ بنفس الترتيب الحرفي الموجود في
 * index.html، داخل سياق (vm) واحد مشترك (تمامًا كما تتشارك وسوم <script>
 * الكلاسيكية نفس النطاق المعجمي العام في المتصفح)، بدون استدعاء
 * Game.init() (الذي يحتاج WebGL/DOM حقيقيين وغير متاحين هنا) — فقط
 * للتأكد أن كل ملف يُحمَّل وينفَّذ بدون رمي أي استثناء، وأن كل الكائنات
 * الـ singleton المتوقعة تُصبح متاحة بالنوع الصحيح (object وليس function)
 * بعد اكتمال التحميل.
 *
 * أي إضافة/حذف/تغيير في ترتيب <script> داخل index.html يجب أن يُحدَّث
 * هنا أيضًا (SCRIPT_ORDER) حتى يبقى هذا الاختبار مطابقًا للواقع.
 *
 * التشغيل:
 *   node --test tests/phase5-boot-order.test.js
 */

const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");

// نفس الترتيب الحرفي لوسوم <script src="src/..."> في index.html
// (باستثناء three.js المُحمَّل من CDN، والذي يُستبدل هنا بـ stub خفيف).
const SCRIPT_ORDER = [
  "src/core/Config.js",
  "src/core/DataContracts.js",
  "src/core/EventBus.js",
  "src/core/GameState.js",
  "src/core/Time.js",
  "src/progression/ProgressionSystem.js",
  "src/ui/Toast.js",
  "src/ui/BaseHUD.js",
  "src/ui/EconomyUI.js",
  "src/ui/WaveUI.js",
  "src/ui/GameOverUI.js",
  "src/ui/DefenseUI.js",
  "src/world/Ocean.js",
  "src/world/Island.js",
  "src/world/Interactables.js",
  "src/world/DefenseMap.js",
  "src/enemies/EnemyPath.js",
  "src/enemies/Enemy.js",
  "src/enemies/EnemyManager.js",
  "src/waves/WaveManager.js",
  "src/waves/WaveOrchestrator.js",
  "src/combat/CombatSystem.js",
  "src/combat/Projectile.js",
  "src/combat/ProjectileManager.js",
  "src/economy/EconomySystem.js",
  "src/defenses/Defense.js",
  "src/defenses/DefenseManager.js",
  "src/input/TouchControls.js",
  "src/camera/CameraController.js",
  "src/interaction/InteractionController.js",
  "src/save/SaveManager.js",
  "src/core/Game.js",
];

// الكائنات الـ singleton المتوقع أن تكون "object" (وليس "function"،
// وهو ما يعني تسرّب class خام بدل الـ instance) بعد اكتمال التحميل.
const EXPECTED_SINGLETONS = [
  "EventBus",
  "GameState",
  "GameTime",
  "ProgressionSystem",
  "Toast",
  "BaseHUD",
  "EconomyUI",
  "WaveUI",
  "GameOverUI",
  "DefenseUI",
  "Ocean",
  "Island",
  "Interactables",
  "DefenseMap",
  "EnemyManager",
  "WaveManager",
  "WaveOrchestrator",
  "CombatSystem",
  "ProjectileManager",
  "EconomySystem",
  "DefenseManager",
  "TouchControls",
  "CameraController",
  "InteractionController",
  "SaveManager",
  "Game",
];

function makeThreeStub() {
  // Proxy خفيف: أي خاصية يتم الوصول إليها (THREE.Scene، THREE.Vector3...)
  // تُرجع "class" وهمية قابلة للـ instantiation، حتى لا يُرمى أي
  // ReferenceError/TypeError لو استُخدمت THREE بشكل غير متوقع أثناء
  // التحميل الفوري (parse-time) لأي ملف. لا حاجة لسلوك رسم حقيقي هنا:
  // هذا الاختبار لا يستدعي Game.init() أصلًا.
  function StubClass() {}
  StubClass.prototype.set = function () {
    return this;
  };
  StubClass.prototype.clone = function () {
    return new StubClass();
  };

  return new Proxy(
    {},
    {
      get() {
        return StubClass;
      },
    }
  );
}

function createBootContext() {
  const listeners = {};

  const documentStub = {
    getElementById() {
      // Game.init() ليس جزءًا من هذا الاختبار، لكن أي ملف آخر قد
      // يستدعي هذا دفاعيًا (خارج init فعلي) يحصل على null آمن بدل رمي خطأ.
      return null;
    },
    createElement() {
      return {
        style: {},
        appendChild() {},
        setAttribute() {},
      };
    },
    addEventListener() {},
    body: { appendChild() {} },
  };

  // في المتصفح الحقيقي، global object === window: أي `addEventListener`
  // مجرّدة و`window.addEventListener` هما نفس الشيء. لذلك نضع هذه
  // الخصائص مباشرة على سياق الـ vm نفسه، ثم نجعل window/globalThis
  // إشارتين ذاتيتين (self-reference) لنفس السياق — بدل كائن window
  // منفصل يفتقد لهذه الدوال عند مناداتها كمعرّف حر (bare identifier).
  const contextObject = {
    console,
    Math,
    Number,
    String,
    Boolean,
    Array,
    Object,
    JSON,
    Date,
    Proxy,
    Map,
    Set,
    THREE: makeThreeStub(),
    document: documentStub,
    innerWidth: 390,
    innerHeight: 844,
    devicePixelRatio: 2,
    location: { reload() {} },
    addEventListener(name, handler) {
      listeners[name] = listeners[name] || [];
      listeners[name].push(handler);
    },
    removeEventListener() {},
    requestAnimationFrame() {
      return 0;
    },
    cancelAnimationFrame() {},
    // لا يوجد localStorage عمدًا — يُحاكي وضع الخصوصية/incognito
    // الموصوف في SaveManager.js (يجب ألا يوقف الإقلاع، انظر §27).
  };

  const context = vm.createContext(contextObject);
  context.window = context;
  context.globalThis = context;

  return context;
}

function loadScript(relativePath, context) {
  const source = fs.readFileSync(path.join(ROOT, relativePath), "utf8");
  return vm.runInContext(source, context, { filename: relativePath });
}

test("كل ملفات src/ تُحمَّل بالترتيب الحقيقي لـ index.html في نطاق واحد مشترك بدون رمي أي استثناء", () => {
  const context = createBootContext();

  for (const relativePath of SCRIPT_ORDER) {
    assert.doesNotThrow(() => {
      loadScript(relativePath, context);
    }, `فشل تحميل ${relativePath} أثناء محاكاة تسلسل الإقلاع الحقيقي (تحقق من ترتيب <script> أو تعارض أسماء عامة).`);
  }
});

test("كل الكائنات الـ singleton المتوقعة تُصبح 'object' وليست 'function' (خطأ Risk 7 لن يتكرر)", () => {
  const context = createBootContext();

  for (const relativePath of SCRIPT_ORDER) {
    loadScript(relativePath, context);
  }

  for (const name of EXPECTED_SINGLETONS) {
    const type = vm.runInContext(`typeof ${name}`, context);

    assert.equal(
      type,
      "object",
      `${name} يجب أن يكون الـ singleton instance (object) وليس دالة/class خام (كان هذا سبب انهيار WaveManager سابقًا — راجع PROJECT_STATE.md Risk 7). النوع الفعلي: ${type}`
    );
  }
});

test("Game.init موجودة كدالة، وWaveManager/EconomySystem/DefenseManager تحمل الدوال الأساسية المتوقعة بعد التحميل الكامل", () => {
  const context = createBootContext();

  for (const relativePath of SCRIPT_ORDER) {
    loadScript(relativePath, context);
  }

  const checks = [
    ["typeof Game.init", "function"],
    ["typeof WaveManager.init", "function"],
    ["typeof WaveManager.startWave", "function"],
    ["typeof EconomySystem.init", "function"],
    ["typeof EconomySystem.spend", "function"],
    ["typeof DefenseManager.init", "function"],
    ["typeof EnemyManager.init", "function"],
    ["typeof SaveManager.save", "function"],
    ["typeof SaveManager.load", "function"],
    ["typeof WaveOrchestrator.init", "function"],
  ];

  for (const [expression, expectedType] of checks) {
    assert.equal(
      vm.runInContext(expression, context),
      expectedType,
      `${expression} يجب أن يكون "${expectedType}" بعد اكتمال تسلسل الإقلاع الكامل.`
    );
  }
});

test("DataContracts.validateConfig() يُنفَّذ فوريًا عند التحميل (سطر أعلى الملف) ولا يرمي استثناءً مقابل CONFIG الحقيقي", () => {
  const context = createBootContext();

  // Config.js ثم DataContracts.js فقط — بنفس ترتيب index.html، لإثبات أن
  // الاستدعاء الفوري (top-level) في نهاية DataContracts.js يعمل بأمان
  // مقابل قيم CONFIG الحقيقية الحالية.
  assert.doesNotThrow(() => {
    loadScript("src/core/Config.js", context);
    loadScript("src/core/DataContracts.js", context);
  });
});
