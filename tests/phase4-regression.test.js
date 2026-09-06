/**
 * Infinity Depths
 * Phase 4 — Regression Tests
 *
 * الهدف:
 * - منع عودة WaveManager إلى الاعتماد المباشر على حالة اللعبة.
 * - التأكد من أن Game يستخدم EventBus كحد فاصل.
 * - التأكد من أن تدمير القاعدة ينتج BaseDestroyed مرة واحدة فقط.
 *
 * التشغيل:
 * node --test tests/phase4-regression.test.js
 */

const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(
  __dirname,
  ".."
);

function readSource(relativePath) {
  return fs.readFileSync(
    path.join(
      ROOT,
      relativePath
    ),
    "utf8"
  );
}

/**
 * تحميل ملف JavaScript داخل VM مع استخراج
 * الكائن المطلوب من globalThis.
 */
function loadScript(
  relativePath,
  context,
  exportedName
) {
  const source =
    readSource(relativePath);

  const wrappedSource = `
(function () {
${source}

return ${exportedName};
})()
`;

  const value =
    vm.runInContext(
      wrappedSource,
      context,
      {
        filename:
          relativePath,
      }
    );

  context[
    exportedName
  ] = value;

  return value;
}

function createContext(
  overrides = {}
) {
  return vm.createContext({
    console,
    Math,
    Number,
    String,
    Boolean,
    Object,
    Array,
    JSON,

    /*
     * Game.js يعمل في بيئة المتصفح ويستخدم window.
     * الاختبارات تعمل داخل Node.js، لذلك نوفر
     * الحد الأدنى المطلوب من واجهة window.
     */
    window: {
      addEventListener() {},
      removeEventListener() {},
    },

    ...overrides,
  });
}

function loadGameContext() {
  const context =
    createContext({
      CONFIG: {
        DEFENSE_MAP: {
          BASE: {
            hp: 100,
            maxHp: 100,
          },
        },
        ECONOMY: {
          STARTING_CURRENCY: 0,
        },
      },
    });

  loadScript(
    "src/core/EventBus.js",
    context,
    "EventBus"
  );

  loadScript(
    "src/core/GameState.js",
    context,
    "GameState"
  );

  loadScript(
    "src/core/Game.js",
    context,
    "Game"
  );

  return context;
}

/**
 * إزالة التعليقات قبل إجراء الفحص
 * المعماري حتى لا تعتبر الوثائق
 * اعتمادًا برمجيًا.
 */
function stripComments(source) {
  return source
    .replace(
      /\/\*[\s\S]*?\*\//g,
      ""
    )
    .replace(
      /(^|\s)\/\/.*$/gm,
      "$1"
    );
}

// ============================================================
// ARCHITECTURE BOUNDARY
// ============================================================

test(
  "Regression: WaveManager has no direct GameState dependency",
  () => {
    const source =
      readSource(
        "src/waves/WaveManager.js"
      );

    const executableSource =
      stripComments(source);

    assert.equal(
      /\bGameState\b/.test(
        executableSource
      ),
      false,
      "WaveManager must not reference GameState directly."
    );
  }
);

test(
  "Regression: WaveManager listens for BaseDestroyed through EventBus",
  () => {
    const source =
      readSource(
        "src/waves/WaveManager.js"
      );

    assert.equal(
      source.includes(
        '"BaseDestroyed"'
      ),
      true,
      "WaveManager must subscribe to BaseDestroyed."
    );

    assert.equal(
      source.includes(
        "EventBus.on"
      ),
      true,
      "WaveManager must use EventBus for the base-destroyed boundary."
    );
  }
);

test(
  "Regression: Game owns the EnemyReachedBase -> GameState boundary",
  () => {
    const source =
      readSource(
        "src/core/Game.js"
      );

    assert.equal(
      source.includes(
        '"EnemyReachedBase"'
      ),
      true,
      "Game must subscribe to EnemyReachedBase."
    );

    assert.equal(
      source.includes(
        "GameState.damageBase"
      ),
      true,
      "Game must apply base damage through GameState."
    );
  }
);

test(
  "Regression: Game emits BaseDestroyed",
  () => {
    const source =
      readSource(
        "src/core/Game.js"
      );

    assert.equal(
      source.includes(
        '"BaseDestroyed"'
      ),
      true,
      "Game must emit BaseDestroyed."
    );
  }
);

// ============================================================
// EVENT FLOW
// ============================================================

test(
  "Regression: destroying the base emits BaseDestroyed",
  () => {
    const context =
      loadGameContext();

    let destroyedEvents = 0;

    let receivedPayload =
      null;

    context.EventBus.on(
      "BaseDestroyed",
      (payload) => {
        destroyedEvents += 1;
        receivedPayload =
          payload;
      }
    );

    context.Game
      ._setupEventSubscriptions();

    context.EventBus.emit(
      "EnemyReachedBase",
      {
        enemyId:
          "enemy_regression_01",

        type:
          "basic",

        damage:
          100,
      }
    );

    assert.equal(
      context.GameState.base.hp,
      0
    );

    assert.equal(
      context.GameState
        .isBaseDestroyed(),
      true
    );

    assert.equal(
      destroyedEvents,
      1
    );

    /*
     * لا نستخدم deepStrictEqual هنا لأن payload
     * تم إنشاؤه داخل VM Realm مختلف عن Realm
     * الخاص باختبارات Node.js.
     *
     * نقارن القيم نفسها بدل هوية الـ Object.
     */
    assert.equal(
      receivedPayload.hp,
      0
    );

    assert.equal(
      receivedPayload.maxHp,
      100
    );

    assert.equal(
      receivedPayload.damage,
      100
    );
  }
);

test(
  "Regression: BaseDestroyed is emitted only on the transition to destroyed",
  () => {
    const context =
      loadGameContext();

    let destroyedEvents = 0;

    context.EventBus.on(
      "BaseDestroyed",
      () => {
        destroyedEvents += 1;
      }
    );

    context.Game
      ._setupEventSubscriptions();

    context.EventBus.emit(
      "EnemyReachedBase",
      {
        enemyId:
          "enemy_regression_02",

        type:
          "basic",

        damage:
          100,
      }
    );

    context.EventBus.emit(
      "EnemyReachedBase",
      {
        enemyId:
          "enemy_regression_03",

        type:
          "basic",

        damage:
          50,
      }
    );

    assert.equal(
      context.GameState.base.hp,
      0
    );

    assert.equal(
      destroyedEvents,
      1,
      "BaseDestroyed must not be emitted repeatedly after destruction."
    );
  }
);

test(
  "Regression: non-lethal base damage does not emit BaseDestroyed",
  () => {
    const context =
      loadGameContext();

    let destroyedEvents = 0;

    context.EventBus.on(
      "BaseDestroyed",
      () => {
        destroyedEvents += 1;
      }
    );

    context.Game
      ._setupEventSubscriptions();

    context.EventBus.emit(
      "EnemyReachedBase",
      {
        enemyId:
          "enemy_regression_04",

        type:
          "basic",

        damage:
          25,
      }
    );

    assert.equal(
      context.GameState.base.hp,
      75
    );

    assert.equal(
      destroyedEvents,
      0
    );
  }
);

// ============================================================
// ISOLATION
// ============================================================

test(
  "Regression: EnemyDied does not emit BaseDestroyed",
  () => {
    const context =
      loadGameContext();

    let destroyedEvents = 0;

    context.EventBus.on(
      "BaseDestroyed",
      () => {
        destroyedEvents += 1;
      }
    );

    context.Game
      ._setupEventSubscriptions();

    context.EventBus.emit(
      "EnemyDied",
      {
        enemyId:
          "enemy_regression_05",

        type:
          "basic",

        reward:
          10,
      }
    );

    assert.equal(
      context.GameState.base.hp,
      100
    );

    assert.equal(
      destroyedEvents,
      0
    );
  }
);

console.log(
  "\n========================================"
);

console.log(
  "Infinity Depths — Phase 4 Regression Tests"
);

console.log(
  "========================================\n"
);
