/**
 * Infinity Depths
 * Phase 4 — Integration Tests
 *
 * الهدف:
 * - اختبار تكامل EventBus مع Game.
 * - اختبار EnemyDied -> EconomySystem -> GameState.
 * - اختبار EnemyReachedBase -> GameState.
 * - اختبار CombatSystem -> EnemyManager.
 *
 * التشغيل:
 *   node --test tests/phase4-integration.test.js
 *
 * ملاحظة:
 * هذه الاختبارات لا تحتاج Three.js أو DOM حقيقي.
 * يتم استخدام stubs فقط للأجزاء الرسومية غير المطلوبة.
 */

const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

// ============================================================
// HELPERS
// ============================================================

const ROOT = path.resolve(__dirname, "..");

function readSource(relativePath) {
  return fs.readFileSync(
    path.join(ROOT, relativePath),
    "utf8"
  );
}

function loadScript(relativePath, context) {
  const source = readSource(relativePath);

  const exportedNames = {
    "src/core/EventBus.js": "EventBus",
    "src/core/DataContracts.js": "DataContracts",
    "src/core/GameState.js": "GameState",
    "src/economy/EconomySystem.js": "EconomySystem",
    "src/combat/CombatSystem.js": "CombatSystem",
    "src/core/Game.js": "Game",
  };

  const exportedName =
    exportedNames[relativePath];

  if (exportedName) {
    const value =
      vm.runInContext(
        `(function () {
          ${source}
          return ${exportedName};
        })()`,
        context,
        {
          filename: relativePath,
        }
      );

    context[exportedName] =
      value;

    return value;
  }

  return vm.runInContext(
    source,
    context,
    {
      filename: relativePath,
    }
  );
}

function createContext(overrides = {}) {
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
     * Game.js يسجل load listener عند تحميله.
     * لا نحتاج تشغيله فعليًا في اختبارات التكامل.
     */
    window: {
      addEventListener() {},
    },

    ...overrides,
  });
}

function loadCoreIntegrationContext() {
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
    context
  );

  loadScript(
    "src/core/GameState.js",
    context
  );

  loadScript(
    "src/economy/EconomySystem.js",
    context
  );

  loadScript(
    "src/core/Game.js",
    context
  );

  return context;
}

// ============================================================
// GAME + EVENT BUS + ECONOMY
// ============================================================

test(
  "Integration: EnemyDied event rewards currency through Game",
  () => {
    const context =
      loadCoreIntegrationContext();

    context.GameState.player.currency =
      0;

    context.EconomySystem.init(
      context.GameState.player.currency
    );

    context.Game._setupEventSubscriptions();

    context.EventBus.emit(
      "EnemyDied",
      {
        enemyId: "enemy_01",
        type: "basic",
        reward: 25,
      }
    );

    assert.equal(
      context.GameState.player.currency,
      25
    );

    assert.equal(
      context.EconomySystem.getBalance(),
      25
    );
  }
);

test(
  "Integration: EnemyDied event preserves existing currency",
  () => {
    const context =
      loadCoreIntegrationContext();

    context.GameState.player.currency =
      50;

    context.EconomySystem.init(
      context.GameState.player.currency
    );

    context.Game._setupEventSubscriptions();

    context.EventBus.emit(
      "EnemyDied",
      {
        enemyId: "enemy_02",
        type: "basic",
        reward: 15,
      }
    );

    assert.equal(
      context.GameState.player.currency,
      65
    );

    assert.equal(
      context.EconomySystem.getBalance(),
      65
    );
  }
);

// ============================================================
// GAME + EVENT BUS + GAME STATE
// ============================================================

test(
  "Integration: EnemyReachedBase event damages base through Game",
  () => {
    const context =
      loadCoreIntegrationContext();

    context.EconomySystem.init(
      context.GameState.player.currency
    );

    context.Game._setupEventSubscriptions();

    context.EventBus.emit(
      "EnemyReachedBase",
      {
        enemyId: "enemy_03",
        type: "basic",
        damage: 20,
      }
    );

    assert.equal(
      context.GameState.base.hp,
      80
    );
  }
);

test(
  "Integration: EnemyReachedBase event cannot reduce base below zero",
  () => {
    const context =
      loadCoreIntegrationContext();

    context.EconomySystem.init(
      context.GameState.player.currency
    );

    context.Game._setupEventSubscriptions();

    context.EventBus.emit(
      "EnemyReachedBase",
      {
        enemyId: "enemy_04",
        type: "basic",
        damage: 250,
      }
    );

    assert.equal(
      context.GameState.base.hp,
      0
    );

    assert.equal(
      context.GameState.isBaseDestroyed(),
      true
    );
  }
);

// ============================================================
// COMBAT + ENEMY MANAGER
// ============================================================

test(
  "Integration: CombatSystem forwards projectile damage to EnemyManager",
  () => {
    const context =
      createContext();

    const enemy = {
      alive: true,
    };

    let damageReceived = null;

    context.EnemyManager = {
      damageEnemy(
        target,
        amount
      ) {
        assert.equal(
          target,
          enemy
        );

        damageReceived =
          amount;

        return {
          killed: false,
          damage: amount,
        };
      },
    };

    loadScript(
      "src/combat/CombatSystem.js",
      context
    );

    const result =
      context.CombatSystem.resolveProjectileHit(
        enemy,
        30
      );

    assert.deepEqual(
      result,
      {
        killed: false,
        damage: 30,
      }
    );

    assert.equal(
      damageReceived,
      30
    );
  }
);

test(
  "Integration: CombatSystem does not damage dead enemies",
  () => {
    const context =
      createContext();

    let damageCalled =
      false;

    context.EnemyManager = {
      damageEnemy() {
        damageCalled = true;

        return {
          killed: true,
        };
      },
    };

    loadScript(
      "src/combat/CombatSystem.js",
      context
    );

    const deadEnemy = {
      alive: false,
    };

    const result =
      context.CombatSystem.resolveProjectileHit(
        deadEnemy,
        30
      );

    assert.equal(
      result,
      null
    );

    assert.equal(
      damageCalled,
      false
    );
  }
);

// ============================================================
// CROSS-SYSTEM EVENT ISOLATION
// ============================================================

test(
  "Integration: EnemyDied does not damage base",
  () => {
    const context =
      loadCoreIntegrationContext();

    context.GameState.player.currency =
      0;

    context.EconomySystem.init(
      context.GameState.player.currency
    );

    context.Game._setupEventSubscriptions();

    context.EventBus.emit(
      "EnemyDied",
      {
        enemyId: "enemy_05",
        type: "basic",
        reward: 10,
      }
    );

    assert.equal(
      context.GameState.player.currency,
      10
    );

    assert.equal(
      context.GameState.base.hp,
      100
    );
  }
);

test(
  "Integration: EnemyReachedBase does not reward currency",
  () => {
    const context =
      loadCoreIntegrationContext();

    context.GameState.player.currency =
      50;

    context.EconomySystem.init(
      context.GameState.player.currency
    );

    context.Game._setupEventSubscriptions();

    context.EventBus.emit(
      "EnemyReachedBase",
      {
        enemyId: "enemy_06",
        type: "basic",
        damage: 10,
      }
    );

    assert.equal(
      context.GameState.base.hp,
      90
    );

    assert.equal(
      context.GameState.player.currency,
      50
    );

    assert.equal(
      context.EconomySystem.getBalance(),
      50
    );
  }
);

// ============================================================
// RESULT
// ============================================================

console.log(
  "\n========================================"
);

console.log(
  "Infinity Depths — Phase 4 Integration Tests"
);

console.log(
  "========================================\n"
);
