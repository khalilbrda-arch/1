/**
 * Infinity Depths
 * Phase 4 — Architecture Foundation Tests
 *
 * لا يعتمد هذا الملف على framework خارجي.
 *
 * التشغيل:
 *   node --test tests/phase4-foundation.test.js
 *
 * الهدف:
 * - اختبار EventBus
 * - اختبار DataContracts
 * - اختبار Economy Boundary
 * - اختبار Combat Boundary
 * - اختبار GameState interaction ownership
 *
 * ملاحظة:
 * هذه الاختبارات لا تشغل Three.js أو DOM.
 * تختبر الطبقات المنطقية التي يمكن اختبارها بشكل مستقل.
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

  /*
   * ملفات اللعبة تستخدم const لتعريف الأنظمة.
   *
   * داخل vm:
   *   const EventBus = ...
   *
   * لا تصبح تلقائيًا:
   *   context.EventBus
   *
   * لذلك نعيد الكائن صراحة من داخل نفس النطاق
   * ثم نضعه في context حتى تستطيع الاختبارات الوصول إليه.
   */
  const exportedNames = {
    "src/core/EventBus.js": "EventBus",
    "src/core/DataContracts.js": "DataContracts",
    "src/core/GameState.js": "GameState",
    "src/economy/EconomySystem.js": "EconomySystem",
    "src/combat/CombatSystem.js": "CombatSystem",
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
  const context = vm.createContext({
    console,
    Math,
    Number,
    String,
    Boolean,
    Object,
    Array,
    JSON,
    ...overrides,
  });

  return context;
}

// ============================================================
// EVENT BUS
// ============================================================

test(
  "EventBus: registers and emits listeners",
  () => {
    const context =
      createContext();

    loadScript(
      "src/core/EventBus.js",
      context
    );

    let received = null;

    context.EventBus.on(
      "TestEvent",
      (payload) => {
        received = payload;
      }
    );

    context.EventBus.emit(
      "TestEvent",
      {
        value: 42,
      }
    );

    assert.deepEqual(
      received,
      {
        value: 42,
      }
    );
  }
);

test(
  "EventBus: off removes a listener",
  () => {
    const context =
      createContext();

    loadScript(
      "src/core/EventBus.js",
      context
    );

    let calls = 0;

    const listener = () => {
      calls += 1;
    };

    context.EventBus.on(
      "TestEvent",
      listener
    );

    context.EventBus.emit(
      "TestEvent"
    );

    context.EventBus.off(
      "TestEvent",
      listener
    );

    context.EventBus.emit(
      "TestEvent"
    );

    assert.equal(
      calls,
      1
    );
  }
);

test(
  "EventBus: isolated events do not cross-trigger",
  () => {
    const context =
      createContext();

    loadScript(
      "src/core/EventBus.js",
      context
    );

    let callsA = 0;
    let callsB = 0;

    context.EventBus.on(
      "EventA",
      () => {
        callsA += 1;
      }
    );

    context.EventBus.on(
      "EventB",
      () => {
        callsB += 1;
      }
    );

    context.EventBus.emit(
      "EventA"
    );

    assert.equal(
      callsA,
      1
    );

    assert.equal(
      callsB,
      0
    );
  }
);

// ============================================================
// DATA CONTRACTS
// ============================================================

test(
  "DataContracts: accepts valid enemy definition",
  () => {
    const context =
      createContext();

    loadScript(
      "src/core/DataContracts.js",
      context
    );

    const validEnemy = {
      maxHp: 100,
      speed: 1,
      armor: 0,
      resistance: 0,
      damage: 10,
      reward: 5,
    };

    assert.equal(
      context.DataContracts.validateEnemyDefinition(
        validEnemy
      ),
      true
    );
  }
);

test(
  "DataContracts: rejects invalid enemy definition",
  () => {
    const context =
      createContext();

    loadScript(
      "src/core/DataContracts.js",
      context
    );

    const invalidEnemy = {
      maxHp: "100",
      speed: 1,
      armor: 0,
      resistance: 0,
      damage: 10,
      reward: 5,
    };

    assert.equal(
      context.DataContracts.validateEnemyDefinition(
        invalidEnemy
      ),
      false
    );
  }
);

test(
  "DataContracts: accepts valid defense definition",
  () => {
    const context =
      createContext();

    loadScript(
      "src/core/DataContracts.js",
      context
    );

    const validDefense = {
      id: "basic_turret",
      cost: 100,
      damage: 20,
      critChance: 0.1,
      critMultiplier: 2,
      range: 10,
      fireRate: 1,
      projectileSpeed: 20,
      targeting: "nearest",
    };

    assert.equal(
      context.DataContracts.validateDefenseDefinition(
        validDefense
      ),
      true
    );
  }
);

test(
  "DataContracts: rejects defense definition without id",
  () => {
    const context =
      createContext();

    loadScript(
      "src/core/DataContracts.js",
      context
    );

    const invalidDefense = {
      cost: 100,
      damage: 20,
      critChance: 0.1,
      critMultiplier: 2,
      range: 10,
      fireRate: 1,
      projectileSpeed: 20,
      targeting: "nearest",
    };

    assert.equal(
      context.DataContracts.validateDefenseDefinition(
        invalidDefense
      ),
      false
    );
  }
);

// ============================================================
// GAME STATE
// ============================================================

test(
  "GameState: interaction registration does not mutate currency",
  () => {
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
      "src/core/GameState.js",
      context
    );

    context.GameState.player.currency =
      50;

    const result =
      context.GameState.registerInteraction(
        "chest_01"
      );

    assert.equal(
      result,
      true
    );

    assert.equal(
      context.GameState.player.currency,
      50
    );

    assert.equal(
      context.GameState.hasInteracted(
        "chest_01"
      ),
      true
    );
  }
);

test(
  "GameState: duplicate interaction is rejected",
  () => {
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
      "src/core/GameState.js",
      context
    );

    assert.equal(
      context.GameState.registerInteraction(
        "chest_01"
      ),
      true
    );

    assert.equal(
      context.GameState.registerInteraction(
        "chest_01"
      ),
      false
    );
  }
);

// ============================================================
// ECONOMY
// ============================================================

test(
  "EconomySystem: add increases balance",
  () => {
    const context =
      createContext();

    loadScript(
      "src/economy/EconomySystem.js",
      context
    );

    context.EconomySystem.init(
      10
    );

    const result =
      context.EconomySystem.add(
        25
      );

    assert.equal(
      result.amount,
      25
    );

    assert.equal(
      result.total,
      35
    );

    assert.equal(
      context.EconomySystem.getBalance(),
      35
    );
  }
);

test(
  "EconomySystem: spend rejects insufficient balance",
  () => {
    const context =
      createContext();

    loadScript(
      "src/economy/EconomySystem.js",
      context
    );

    context.EconomySystem.init(
      10
    );

    assert.equal(
      context.EconomySystem.spend(
        100
      ),
      false
    );

    assert.equal(
      context.EconomySystem.getBalance(),
      10
    );
  }
);

test(
  "EconomySystem: spend removes exactly the requested amount",
  () => {
    const context =
      createContext();

    loadScript(
      "src/economy/EconomySystem.js",
      context
    );

    context.EconomySystem.init(
      100
    );

    assert.equal(
      context.EconomySystem.spend(
        40
      ),
      true
    );

    assert.equal(
      context.EconomySystem.getBalance(),
      60
    );
  }
);

// ============================================================
// COMBAT BOUNDARY
// ============================================================

test(
  "CombatSystem: forwards valid projectile hit to EnemyManager",
  () => {
    const context =
      createContext();

    const targetEnemy = {
      alive: true,
    };

    let receivedEnemy = null;
    let receivedDamage = null;

    context.EnemyManager = {
      damageEnemy(
        enemy,
        amount
      ) {
        receivedEnemy =
          enemy;

        receivedDamage =
          amount;

        return {
          success: true,
        };
      },
    };

    loadScript(
      "src/combat/CombatSystem.js",
      context
    );

    const result =
      context.CombatSystem.resolveProjectileHit(
        targetEnemy,
        25
      );

    assert.deepEqual(
      result,
      {
        success: true,
      }
    );

    assert.equal(
      receivedEnemy,
      targetEnemy
    );

    assert.equal(
      receivedDamage,
      25
    );
  }
);

test(
  "CombatSystem: rejects invalid damage",
  () => {
    const context =
      createContext();

    context.EnemyManager = {
      damageEnemy() {
        throw new Error(
          "Should not be called"
        );
      },
    };

    loadScript(
      "src/combat/CombatSystem.js",
      context
    );

    const targetEnemy = {
      alive: true,
    };

    assert.equal(
      context.CombatSystem.resolveProjectileHit(
        targetEnemy,
        -10
      ),
      null
    );
  }
);

test(
  "CombatSystem: ignores dead target",
  () => {
    const context =
      createContext();

    let called =
      false;

    context.EnemyManager = {
      damageEnemy() {
        called = true;
      },
    };

    loadScript(
      "src/combat/CombatSystem.js",
      context
    );

    const deadEnemy = {
      alive: false,
    };

    assert.equal(
      context.CombatSystem.resolveProjectileHit(
        deadEnemy,
        10
      ),
      null
    );

    assert.equal(
      called,
      false
    );
  }
);

// ============================================================
// ARCHITECTURAL SOURCE CHECKS
// ============================================================

test(
  "Architecture: Projectile does not directly call EnemyManager.damageEnemy",
  () => {
    const source =
      readSource(
        "src/combat/Projectile.js"
      );

    assert.equal(
      source.includes(
        "EnemyManager.damageEnemy"
      ),
      false
    );

    assert.equal(
      source.includes(
        "CombatSystem.resolveProjectileHit"
      ),
      true
    );
  }
);

test(
  "Architecture: GameState interaction does not add currency",
  () => {
    const source =
      readSource(
        "src/core/GameState.js"
      );

    const registerStart =
      source.indexOf(
        "registerInteraction(id)"
      );

    assert.notEqual(
      registerStart,
      -1
    );

    const registerEnd =
      source.indexOf(
        "damageBase(amount)",
        registerStart
      );

    assert.notEqual(
      registerEnd,
      -1
    );

    const registerBlock =
      source.slice(
        registerStart,
        registerEnd
      );

    assert.equal(
      registerBlock.includes(
        "player.currency +="
      ),
      false
    );
  }
);

test(
  "Architecture: Game initializes EconomySystem",
  () => {
    const source =
      readSource(
        "src/core/Game.js"
      );

    assert.equal(
      /EconomySystem\.init\s*\(/.test(
        source
      ),
      true
    );

    assert.equal(
      source.includes(
        "GameState.player.currency"
      ),
      true
    );
  }
);

test(
  "Architecture: Game subscribes to EnemyDied",
  () => {
    const source =
      readSource(
        "src/core/Game.js"
      );

    assert.equal(
      source.includes(
        "\"EnemyDied\""
      ),
      true
    );

    assert.equal(
      source.includes(
        "EconomySystem.rewardEnemyKill"
      ),
      true
    );
  }
);

test(
  "Architecture: Game subscribes to EnemyReachedBase",
  () => {
    const source =
      readSource(
        "src/core/Game.js"
      );

    assert.equal(
      source.includes(
        "\"EnemyReachedBase\""
      ),
      true
    );

    assert.equal(
      source.includes(
        "GameState.damageBase"
      ),
      true
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
  "Infinity Depths — Phase 4 Foundation Tests"
);

console.log(
  "========================================\n"
);
