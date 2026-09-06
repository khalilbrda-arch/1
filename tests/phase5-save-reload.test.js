/**
 * Infinity Depths
 * Phase 5 — Save / Reload Tests
 *
 * الهدف:
 * - التأكد أن SaveManager يبني بيانات حفظ صحيحة من GameState/
 *   WaveManager/DefenseManager (Runtime objects فقط، لا Three.js —
 *   SAVE_SCHEMA.md §5).
 * - التأكد أن validate() يرفض بيانات تالفة/غير صالحة دون رمي
 *   استثناء (SAVE_SCHEMA.md §20-22).
 * - التأكد أن save()/load() تعمل عبر Storage backend مُحقَن
 *   (لا تعتمد على localStorage حقيقي أثناء الاختبار).
 * - التأكد أن حفظًا تالفًا (JSON غير صالح، أو بيانات فشلت
 *   validate) لا يُطبَّق أبدًا ولا يُسقِط load().
 * - التأكد أن DefenseManager.restoreDefense() يعيد بناء دفاع
 *   محفوظ دون المرور بوضع البناء/الاقتصاد، ويحافظ على nextId
 *   متقدمًا لتفادي تصادم المعرّفات.
 *
 * التشغيل:
 *   node --test tests/phase5-save-reload.test.js
 *
 * ملاحظة:
 * SaveManager نفسه لا يحتاج THREE/DOM — فقط كائنات بيانات بسيطة.
 * DefenseManager يحتاج THREE لبناء النموذج البصري للدفاع، لذلك يتم
 * تزويده بـ stub بسيط مطابق للاستخدام الفعلي فقط (Group/Mesh/...),
 * بنفس روح الـ EnemyManager stub في phase5-vertical-slice.test.js.
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

function createContext(extra = {}) {
  const context = vm.createContext({
    console,
    Math,
    Number,
    String,
    Boolean,
    Object,
    Array,
    JSON,
    Date,
    window: { addEventListener() {} },
    ...extra,
  });

  return context;
}

/**
 * Storage backend وهمي بذاكرة فقط — بديل عن localStorage للاختبار.
 * نفس الواجهة: getItem/setItem/removeItem.
 */
function createFakeStorage(initial = {}) {
  const map = new Map(Object.entries(initial));

  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(key, String(value));
    },
    removeItem(key) {
      map.delete(key);
    },
    _dump() {
      return Object.fromEntries(map);
    },
  };
}

function loadSaveManagerContext() {
  const context = createContext();

  loadScript("src/save/SaveManager.js", context);

  return context;
}

// ============================================================
// SERIALIZE
// ============================================================

test("SaveManager.serialize() builds plain data from live sources", () => {
  const context = loadSaveManagerContext();

  context.gameState = {
    player: { level: 3, xp: 40, currency: 250, rank: "Veteran" },
    base: { hp: 60, maxHp: 100 },
    interactions: { openedIds: ["chest_01"] },
  };

  context.waveManager = { currentWave: 4 };

  context.defenseManager = {
    defenses: [
      { id: "defense_1", typeId: "cannon", x: 3, z: -2 },
    ],
  };

  const data = vm.runInContext(
    `SaveManager.serialize({ gameState, waveManager, defenseManager })`,
    context
  );

  assert.equal(data.schemaVersion, 1);
  assert.equal(data.wave, 4);
  assert.deepEqual(JSON.parse(JSON.stringify(data.player)), {
    level: 3,
    xp: 40,
    currency: 250,
    rank: "Veteran",
  });
  assert.deepEqual(JSON.parse(JSON.stringify(data.base)), {
    hp: 60,
    maxHp: 100,
  });
  assert.deepEqual(JSON.parse(JSON.stringify(data.interactions)), {
    openedIds: ["chest_01"],
  });
  assert.deepEqual(JSON.parse(JSON.stringify(data.defenses)), [
    { id: "defense_1", typeId: "cannon", x: 3, z: -2 },
  ]);
  assert.equal(typeof data.updatedAt, "number");
});

test("SaveManager.serialize() never includes runtime/Three.js-shaped fields", () => {
  const context = loadSaveManagerContext();

  context.gameState = {
    player: { level: 1, xp: 0, currency: 0, rank: "Novice" },
    base: { hp: 100, maxHp: 100 },
    interactions: { openedIds: [] },
  };

  context.waveManager = { currentWave: 0 };

  // دفاع يحمل حقول Three.js حية عمدًا — يجب أن تُستبعد بالكامل.
  context.defenseManager = {
    defenses: [
      {
        id: "defense_1",
        typeId: "cannon",
        x: 1,
        z: 1,
        model: { isObject3D: true },
        _turret: { rotation: { y: 1 } },
      },
    ],
  };

  const data = vm.runInContext(
    `SaveManager.serialize({ gameState, waveManager, defenseManager })`,
    context
  );

  assert.deepEqual(Object.keys(data.defenses[0]).sort(), [
    "id",
    "typeId",
    "x",
    "z",
  ]);
});

// ============================================================
// VALIDATE
// ============================================================

function validSave(overrides = {}) {
  return Object.assign(
    {
      schemaVersion: 1,
      updatedAt: Date.now(),
      wave: 2,
      player: { level: 1, xp: 0, currency: 100, rank: "Novice" },
      base: { hp: 80, maxHp: 100 },
      interactions: { openedIds: [] },
      defenses: [{ id: "defense_1", typeId: "cannon", x: 0, z: 0 }],
    },
    overrides
  );
}

test("SaveManager.validate() accepts a well-formed save", () => {
  const context = loadSaveManagerContext();
  context.data = validSave();

  assert.equal(
    vm.runInContext("SaveManager.validate(data)", context),
    true
  );
});

const invalidCases = [
  ["null", null],
  ["not an object", "corrupt"],
  ["wrong schemaVersion", validSave({ schemaVersion: 99 })],
  ["negative wave", validSave({ wave: -1 })],
  [
    "negative currency",
    validSave({ player: { level: 1, xp: 0, currency: -5, rank: "Novice" } }),
  ],
  [
    "NaN currency",
    validSave({
      player: { level: 1, xp: 0, currency: NaN, rank: "Novice" },
    }),
  ],
  ["base hp greater than maxHp", validSave({ base: { hp: 150, maxHp: 100 } })],
  ["interactions not an array", validSave({ interactions: {} })],
  [
    "defenses missing typeId",
    validSave({ defenses: [{ id: "d1", x: 0, z: 0 }] }),
  ],
  ["defenses not an array", validSave({ defenses: "nope" })],
];

for (const [label, data] of invalidCases) {
  test(`SaveManager.validate() rejects: ${label}`, () => {
    const context = loadSaveManagerContext();
    context.data = data;

    assert.equal(
      vm.runInContext("SaveManager.validate(data)", context),
      false
    );
  });
}

// ============================================================
// SAVE / LOAD ROUND TRIP
// ============================================================

test("save() then load() round-trips through an injected storage backend", () => {
  const context = loadSaveManagerContext();

  context.fakeStorage = createFakeStorage();

  context.gameState = {
    player: { level: 2, xp: 10, currency: 300, rank: "Sailor" },
    base: { hp: 90, maxHp: 100 },
    interactions: { openedIds: [] },
  };
  context.waveManager = { currentWave: 5 };
  context.defenseManager = {
    defenses: [{ id: "defense_1", typeId: "cannon", x: 2, z: 4 }],
  };

  vm.runInContext("SaveManager.init(fakeStorage);", context);

  const saved = vm.runInContext(
    "SaveManager.save({ gameState, waveManager, defenseManager })",
    context
  );

  assert.equal(saved, true);
  assert.equal(
    vm.runInContext("SaveManager.hasSave()", context),
    true
  );

  const loaded = vm.runInContext("SaveManager.load()", context);

  assert.equal(loaded.wave, 5);
  assert.equal(loaded.player.currency, 300);
  assert.equal(loaded.defenses.length, 1);
});

test("load() returns null and does not throw when no save exists", () => {
  const context = loadSaveManagerContext();
  context.fakeStorage = createFakeStorage();

  vm.runInContext("SaveManager.init(fakeStorage);", context);

  assert.equal(vm.runInContext("SaveManager.load()", context), null);
  assert.equal(vm.runInContext("SaveManager.hasSave()", context), false);
});

test("load() returns null (not a throw) for corrupted JSON", () => {
  const context = loadSaveManagerContext();

  context.fakeStorage = createFakeStorage({
    infinity_depths_save: "{ this is not json",
  });

  vm.runInContext("SaveManager.init(fakeStorage);", context);

  assert.equal(vm.runInContext("SaveManager.load()", context), null);
});

test("load() returns null for structurally invalid (but parseable) saved data", () => {
  const context = loadSaveManagerContext();

  context.fakeStorage = createFakeStorage({
    infinity_depths_save: JSON.stringify(
      validSave({ base: { hp: 999, maxHp: 100 } })
    ),
  });

  vm.runInContext("SaveManager.init(fakeStorage);", context);

  assert.equal(vm.runInContext("SaveManager.load()", context), null);
});

test("save()/load() behave safely with no storage backend available", () => {
  const context = loadSaveManagerContext();

  vm.runInContext("SaveManager.init(null);", context);

  context.gameState = {
    player: { level: 1, xp: 0, currency: 0, rank: "Novice" },
    base: { hp: 100, maxHp: 100 },
    interactions: { openedIds: [] },
  };
  context.waveManager = { currentWave: 0 };
  context.defenseManager = { defenses: [] };

  assert.equal(
    vm.runInContext(
      "SaveManager.save({ gameState, waveManager, defenseManager })",
      context
    ),
    false
  );

  assert.equal(vm.runInContext("SaveManager.load()", context), null);
});

// ============================================================
// APPLY
// ============================================================

test("applyToGameState()/applyToWaveManager() restore runtime state from a save", () => {
  const context = loadSaveManagerContext();

  const data = validSave({
    wave: 7,
    player: { level: 4, xp: 12, currency: 500, rank: "Veteran" },
    base: { hp: 40, maxHp: 100 },
    interactions: { openedIds: ["chest_a"] },
  });

  context.data = data;

  context.gameState = {
    player: { level: 1, xp: 0, currency: 0, rank: "Novice" },
    base: { hp: 100, maxHp: 100 },
    interactions: { openedIds: [] },
  };

  context.waveManager = { currentWave: 0 };

  vm.runInContext(
    "SaveManager.applyToGameState(data, gameState);",
    context
  );

  vm.runInContext(
    "SaveManager.applyToWaveManager(data, waveManager);",
    context
  );

  const gameState = vm.runInContext("gameState", context);
  const waveManager = vm.runInContext("waveManager", context);

  assert.equal(gameState.player.currency, 500);
  assert.equal(gameState.base.hp, 40);
  assert.deepEqual(gameState.interactions.openedIds, ["chest_a"]);
  assert.equal(waveManager.currentWave, 7);
});

test("applyToGameState() clamps restored base hp to the current config maxHp", () => {
  const context = loadSaveManagerContext();

  // maxHp أقل مما كان محفوظًا (تغيّر توازن اللعبة بين جلستين مثلًا) —
  // يجب ألا تتجاوز الصحة المُستعادة الحد الأقصى الحالي.
  const data = validSave({ base: { hp: 80, maxHp: 100 } });
  context.data = data;

  context.gameState = {
    player: { level: 1, xp: 0, currency: 0, rank: "Novice" },
    base: { hp: 100, maxHp: 50 },
    interactions: { openedIds: [] },
  };

  vm.runInContext(
    "SaveManager.applyToGameState(data, gameState);",
    context
  );

  assert.equal(vm.runInContext("gameState.base.hp", context), 50);
});

// ============================================================
// DefenseManager.restoreDefense() integration
// ============================================================

/**
 * THREE stub بأدنى ما يكفي Defense.js/DefenseManager.js لبناء
 * النموذج البصري دون رسم فعلي — نفس فلسفة stub الأنظمة الأخرى في
 * هذا المشروع (EnemyManager stub في phase5-vertical-slice.test.js).
 */
function installThreeStub(context) {
  vm.runInContext(
    `
    function StubObject3D() {
      this.children = [];
      this.position = { x: 0, y: 0, z: 0, set() {} };
      this.rotation = { x: 0, y: 0, z: 0 };
      this.userData = {};
    }
    StubObject3D.prototype.add = function (child) {
      this.children.push(child);
    };

    var THREE = {
      Group: StubObject3D,
      Object3D: StubObject3D,
      Mesh: function (geo, mat) {
        StubObject3D.call(this);
        this.geometry = geo;
        this.material = mat;
      },
      CylinderGeometry: function () {},
      ConeGeometry: function () {},
      BoxGeometry: function () {},
      SphereGeometry: function () {},
      RingGeometry: function () {},
      MeshStandardMaterial: function (opts) {
        Object.assign(this, opts);
      },
      DoubleSide: "DoubleSide",
      Plane: function () {},
      Vector3: function (x, y, z) {
        this.x = x; this.y = y; this.z = z;
      },
    };
    THREE.Mesh.prototype = Object.create(StubObject3D.prototype);
    globalThis.THREE = THREE;
    `,
    context,
    { filename: "stub/THREE.js" }
  );
}

function loadDefenseManagerContext() {
  const context = createContext();

  installThreeStub(context);

  loadScript("src/core/Config.js", context);
  loadScript("src/core/DataContracts.js", context);
  loadScript("src/defenses/Defense.js", context);
  loadScript("src/defenses/DefenseManager.js", context);

  // DefenseUI/Toast dependencies used by init()/confirmPlacement() —
  // stubbed out; غير مطلوبة لاختبار restoreDefense().
  vm.runInContext(
    `
    var DefenseUI = { init() {}, disable() {} };
    var Toast = { showMessage() {} };
    globalThis.DefenseUI = DefenseUI;
    globalThis.Toast = Toast;
    `,
    context,
    { filename: "stub/DefenseUI.js" }
  );

  const scene = vm.runInContext("new THREE.Group()", context);
  context.scene = scene;

  vm.runInContext("DefenseManager.init(scene);", context);

  return context;
}

test("DefenseManager.restoreDefense() rebuilds a saved defense without placement/economy checks", () => {
  const context = loadDefenseManagerContext();

  const defense = vm.runInContext(
    `DefenseManager.restoreDefense({ id: "defense_3", typeId: "cannon", x: 5, z: -1 })`,
    context
  );

  assert.ok(defense, "restoreDefense() should return the created defense");
  assert.equal(defense.id, "defense_3");
  assert.equal(defense.x, 5);
  assert.equal(defense.z, -1);

  const count = vm.runInContext("DefenseManager.defenses.length", context);
  assert.equal(count, 1);
});

test("DefenseManager.restoreDefense() advances nextId past restored numeric ids", () => {
  const context = loadDefenseManagerContext();

  vm.runInContext(
    `DefenseManager.restoreDefense({ id: "defense_7", typeId: "cannon", x: 0, z: 0 })`,
    context
  );

  const nextId = vm.runInContext("DefenseManager.nextId", context);

  assert.equal(
    nextId,
    8,
    "nextId must be advanced past defense_7 to avoid future id collisions"
  );
});

test("DefenseManager.restoreDefense() rejects an unknown typeId without throwing", () => {
  const context = loadDefenseManagerContext();

  const result = vm.runInContext(
    `DefenseManager.restoreDefense({ id: "defense_1", typeId: "does_not_exist", x: 0, z: 0 })`,
    context
  );

  assert.equal(result, null);
  assert.equal(
    vm.runInContext("DefenseManager.defenses.length", context),
    0
  );
});

// ============================================================
// FULL SAVE -> RELOAD SIMULATION
// ============================================================

test("full boot simulation: save at wave completion, then a fresh boot restores it", () => {
  const saveContext = loadSaveManagerContext();
  const sharedStorage = createFakeStorage();

  saveContext.fakeStorage = sharedStorage;
  vm.runInContext("SaveManager.init(fakeStorage);", saveContext);

  saveContext.gameState = {
    player: { level: 1, xp: 0, currency: 220, rank: "Novice" },
    base: { hp: 70, maxHp: 100 },
    interactions: { openedIds: [] },
  };
  saveContext.waveManager = { currentWave: 3 };
  saveContext.defenseManager = {
    defenses: [{ id: "defense_1", typeId: "cannon", x: 4, z: 4 }],
  };

  const saved = vm.runInContext(
    "SaveManager.save({ gameState, waveManager, defenseManager })",
    saveContext
  );
  assert.equal(saved, true);

  // "إعادة تحميل الصفحة" — سياق جديد بالكامل يشارك نفس الـ storage
  // فقط (تمامًا كما يفعل localStorage الحقيقي بين تحميلين للصفحة).
  const rebootContext = loadDefenseManagerContext();
  loadScript("src/save/SaveManager.js", rebootContext);

  rebootContext.fakeStorage = sharedStorage;
  vm.runInContext("SaveManager.init(fakeStorage);", rebootContext);

  rebootContext.gameState = {
    player: { level: 1, xp: 0, currency: 0, rank: "Novice" },
    base: { hp: 100, maxHp: 100 },
    interactions: { openedIds: [] },
  };
  rebootContext.waveManager = { currentWave: 0 };

  const loaded = vm.runInContext("SaveManager.load()", rebootContext);
  assert.ok(loaded, "a valid save must be found after reboot");

  vm.runInContext(
    "SaveManager.applyToGameState(loaded, gameState);",
    Object.assign(rebootContext, { loaded })
  );
  vm.runInContext(
    "SaveManager.applyToWaveManager(loaded, waveManager);",
    rebootContext
  );
  vm.runInContext(
    "SaveManager.applyToDefenseManager(loaded, DefenseManager);",
    rebootContext
  );

  assert.equal(
    vm.runInContext("gameState.player.currency", rebootContext),
    220
  );
  assert.equal(vm.runInContext("gameState.base.hp", rebootContext), 70);
  assert.equal(
    vm.runInContext("waveManager.currentWave", rebootContext),
    3
  );
  assert.equal(
    vm.runInContext("DefenseManager.defenses.length", rebootContext),
    1
  );
  assert.equal(
    vm.runInContext("DefenseManager.defenses[0].id", rebootContext),
    "defense_1"
  );
});
