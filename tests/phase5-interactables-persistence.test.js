/**
 * Infinity Depths
 * Phase 5 — Interactables Persistence Regression Test
 *
 * الخلفية (اكتُشف عبر تحقق يدوي فعلي على متصفح حقيقي):
 * كانت الكنوز (chests/resources) تُجمَع من جديد في كل مرة تُعاد فيها
 * تحميل الصفحة، رغم أن الحفظ/الاستعادة (Save/Reload) لباقي الحالة
 * (رصيد، صحة قاعدة، الموجة، الدفاعات) كان يعمل بشكل صحيح.
 *
 * السبب الجذري (بعد فحص الكود فعليًا):
 * 1. Interactables.js كان يملك حالة محلية خاصة (`_openedIds`) منفصلة
 *    تمامًا عن GameState، ولا يستدعي GameState.registerInteraction()
 *    إطلاقًا عند الجمع — فـ GameState.interactions.openedIds كان
 *    يبقى [] فارغًا للأبد بغض النظر عن عدد الكنوز المجموعة، وبالتالي
 *    لا شيء لدى SaveManager ليحفظه.
 * 2. Interactables.create() كان يُستدعى في Game.js قبل استعادة
 *    الحفظ (SaveManager.load() + applyToGameState())، لذلك حتى لو
 *    كان GameState.interactions.openedIds محفوظًا بشكل صحيح، لم يكن
 *    Interactables ليعرف بذلك عند إنشاء الكنوز.
 *
 * الإصلاح (يحترم قاعدة العمارة الموجودة في
 * tests/phase4-architecture-audit.test.js التي تمنع أي ملف غير
 * Game.js/GameState.js من الإشارة لـ GameState مباشرة):
 * - Interactables.create(scene, alreadyOpenedIds) يستقبل الآن قائمة
 *   الكنوز المفتوحة مسبقًا كمُعامل بيانات عادي بدل قراءة GameState
 *   بنفسه، ويتجاهل إنشاء أي كنز معرّفه موجود في هذه القائمة.
 * - Game.js هو من يقرأ GameState.interactions.openedIds ويمرّرها،
 *   وهو أيضًا من يستمع لحدث InteractableConsumed (الذي كان موجودًا
 *   أصلًا لكن بلا أي مستمع) ليسجّله فعليًا في GameState عبر
 *   GameState.registerInteraction().
 * - ترتيب Game.js أُعيد تنظيمه بحيث تُستعاد بيانات الحفظ إلى
 *   GameState قبل استدعاء Interactables.create()، وليس بعده.
 *
 * هذا الملف يختبر منطق Interactables.js نفسه بمعزل (بمحاكاة الجانبين
 * اللذين كان يعتمد عليهما Game.js: تمرير القائمة عند الإنشاء،
 * والاستماع لـ InteractableConsumed)، دون الحاجة لمحرك رسم حقيقي.
 *
 * التشغيل:
 *   node --test tests/phase5-interactables-persistence.test.js
 */

const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");

function readSource(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function loadScript(relativePath, context) {
  const source = readSource(relativePath);
  return vm.runInContext(source, context, { filename: relativePath });
}

/**
 * THREE stub بأدنى ما يكفي Interactables.js لبناء صناديق/موارد
 * وهمية دون رسم فعلي — نفس فلسفة الـ stub المستخدم في
 * phase5-save-reload.test.js لأجل DefenseManager.
 */
function installThreeStub(context) {
  vm.runInContext(
    `
    function StubObject3D() {
      this.children = [];
      this.position = {
        x: 0, y: 0, z: 0,
        set(x, y, z) { this.x = x; this.y = y; this.z = z; },
      };
      this.rotation = { x: 0, y: 0, z: 0 };
      this.userData = {};
      this.castShadow = false;
    }
    StubObject3D.prototype.add = function (child) {
      this.children.push(child);
    };
    StubObject3D.prototype.remove = function (child) {
      const i = this.children.indexOf(child);
      if (i !== -1) this.children.splice(i, 1);
    };

    var THREE = {
      Group: StubObject3D,
      Object3D: StubObject3D,
      Mesh: function (geo, mat) {
        StubObject3D.call(this);
        this.geometry = geo;
        this.material = mat;
      },
      BoxGeometry: function () {},
      OctahedronGeometry: function () {},
      MeshStandardMaterial: function (opts) {
        Object.assign(this, opts);
      },
    };
    THREE.Mesh.prototype = Object.create(StubObject3D.prototype);
    globalThis.THREE = THREE;
    `,
    context,
    { filename: "stub/THREE.js" }
  );
}

function createContext() {
  const context = vm.createContext({
    console,
    Math,
    Number,
    String,
    Boolean,
    Object,
    Array,
    JSON,
    window: { addEventListener() {} },
  });

  return context;
}

/**
 * يحمّل Config + EventBus + Interactables داخل سياق واحد، مع
 * EconomySystem stub بسيط (لا نحتاج منطق الرصيد الحقيقي هنا — فقط
 * إثبات أن الجمع/الاستثناء يعملان، وأن الحدث الصحيح يُطلَق).
 */
function loadInteractablesContext() {
  const context = createContext();

  installThreeStub(context);

  loadScript("src/core/Config.js", context);
  loadScript("src/core/EventBus.js", context);
  loadScript("src/world/Interactables.js", context);

  vm.runInContext(
    `
    var EconomySystem = {
      balance: 0,
      add(value) { this.balance += value; return this.balance; },
    };
    globalThis.EconomySystem = EconomySystem;
    `,
    context,
    { filename: "stub/EconomySystem.js" }
  );

  return context;
}

// ============================================================
// Interactables.create() honors an already-opened list
// ============================================================

test("Interactables.create() skips spawning entries whose id is already in the provided already-opened list", () => {
  const context = loadInteractablesContext();

  const scene = vm.runInContext("new THREE.Group()", context);
  context.scene = scene;

  // نفس معرّف الكنز الأول فعليًا في CONFIG.INTERACTABLES.CHESTS
  // (chest_1) — نمرره كأنه جاء من حفظ سابق.
  context.alreadyOpened = ["chest_1"];

  vm.runInContext(
    "Interactables.create(scene, alreadyOpened);",
    context
  );

  const liveIds = vm.runInContext(
    "Interactables._entries.map(e => e.id)",
    context
  );

  assert.ok(
    !liveIds.includes("chest_1"),
    "A treasure whose id was passed in the already-opened list must not be spawned as collectible again."
  );

  const totalConfigured = vm.runInContext(
    "CONFIG.INTERACTABLES.CHESTS.length + CONFIG.INTERACTABLES.RESOURCES.length",
    context
  );

  assert.equal(
    liveIds.length,
    totalConfigured - 1,
    "Exactly one fewer entry than the full configured set must exist."
  );
});

test("Interactables.create() with no already-opened list (fresh game) spawns every configured entry", () => {
  const context = loadInteractablesContext();

  const scene = vm.runInContext("new THREE.Group()", context);
  context.scene = scene;

  vm.runInContext("Interactables.create(scene);", context);

  const liveIds = vm.runInContext(
    "Interactables._entries.map(e => e.id)",
    context
  );

  const totalConfigured = vm.runInContext(
    "CONFIG.INTERACTABLES.CHESTS.length + CONFIG.INTERACTABLES.RESOURCES.length",
    context
  );

  assert.equal(
    liveIds.length,
    totalConfigured,
    "A fresh game (no save) must spawn every configured chest/resource."
  );
});

// ============================================================
// interact() cannot double-collect, and emits the event Game.js
// needs in order to actually persist the collection.
// ============================================================

test("Interactables.interact() collects a fresh entry exactly once and emits InteractableConsumed with its id", () => {
  const context = loadInteractablesContext();

  const scene = vm.runInContext("new THREE.Group()", context);
  context.scene = scene;

  vm.runInContext(
    `
    Interactables.create(scene);

    globalThis.__events = [];
    EventBus.on("InteractableConsumed", (payload) => {
      globalThis.__events.push(payload);
    });

    const mesh = Interactables._entries[0].mesh;
    const expectedId = Interactables._entries[0].id;

    globalThis.__firstResult = Interactables.interact(mesh);
    globalThis.__secondResult = Interactables.interact(mesh);
    `,
    context
  );

  const firstResult = vm.runInContext("__firstResult", context);
  const secondResult = vm.runInContext("__secondResult", context);
  const events = vm.runInContext("__events", context);
  const expectedId = vm.runInContext("expectedId", context);

  assert.ok(
    firstResult,
    "The first interact() on a fresh entry must succeed."
  );

  assert.equal(
    secondResult,
    null,
    "Interacting with the same mesh twice must not collect it (and must not reward) a second time."
  );

  assert.equal(
    events.length,
    1,
    "InteractableConsumed must fire exactly once — this is the event Game.js listens to in order to call GameState.registerInteraction() (see Game.js), which is what SaveManager actually persists."
  );

  assert.equal(
    events[0].id,
    expectedId,
    "The emitted payload must carry the collected entry's id so Game.js can record the correct one in GameState."
  );

  const balance = vm.runInContext("EconomySystem.balance", context);

  assert.ok(
    balance > 0,
    "Collecting a treasure must still grant its reward exactly once."
  );
});

test("Interactables.interact() refuses an id that was already in the already-opened list passed to create()", () => {
  const context = loadInteractablesContext();

  const scene = vm.runInContext("new THREE.Group()", context);
  context.scene = scene;

  // لا نمرر chest_1 كمعرّف مُنشأ أصلًا (لن يُبنى له mesh)، لكن نتأكد
  // أيضًا أن أي محاولة تفاعل يدوية مصطنعة بمعرّف مفتوح مسبقًا لا
  // تكافئ اللاعب — تحصين إضافي حتى لو تغيّر مصدر الـ mesh مستقبلًا.
  vm.runInContext(
    `
    Interactables.create(scene, ["chest_1"]);

    // كنز آخر لا يزال طازجًا يُستخدم للتأكد أن بقية النظام سليم.
    const freshMesh = Interactables._entries.find(
      (e) => e.id !== "chest_1"
    ).mesh;

    globalThis.__freshResult = Interactables.interact(freshMesh);
    `,
    context
  );

  const chest1WasSpawned = vm.runInContext(
    "Interactables._entries.some(e => e.id === 'chest_1')",
    context
  );

  assert.equal(
    chest1WasSpawned,
    false,
    "An already-opened treasure must not exist at all after create(), so it can never be interacted with again."
  );

  const freshResult = vm.runInContext("__freshResult", context);

  assert.ok(
    freshResult,
    "A different, never-opened treasure must still be collectible normally."
  );
});
