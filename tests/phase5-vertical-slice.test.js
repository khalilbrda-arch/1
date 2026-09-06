/**
 * Infinity Depths
 * Phase 5 — Vertical Slice Tests
 *
 * الهدف:
 * - التأكد أن "WaveManager" يُصدَّر كـ singleton instance فعليًا
 *   (وليس كـ class binding يطغى عليه — انظر تعليقات WaveManager.js).
 * - التأكد أن WaveOrchestrator يقرأ CONFIG.WAVES بشكل صحيح ويحسب
 *   تصعيد الموجات (HP/Speed/Armor/Damage/Reward/Quantity).
 * - التأكد أن دورة حياة الموجة الكاملة تعمل فعليًا من البداية:
 *   Countdown -> WaveManager.startWave() -> Spawning -> WaveCompleted
 *   -> Countdown للموجة التالية.
 * - التأكد أن BaseDestroyed يوقف الـ Orchestrator (game-over)
 *   بدون انهيار.
 *
 * التشغيل:
 *   node --test tests/phase5-vertical-slice.test.js
 *
 * ملاحظة:
 * هذه الاختبارات لا تحتاج Three.js أو DOM حقيقي — EnemyManager
 * (الذي يعتمد على THREE) يُستبدل بـ stub بسيط يكتفي بإرجاع كائن
 * عدو صالح للتحقق من تدفق الأحداث، دون رسم فعلي.
 */

const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");

function readSource(relativePath) {
  return fs.readFileSync(
    path.join(ROOT, relativePath),
    "utf8"
  );
}

function loadScript(relativePath, context) {
  const source = readSource(relativePath);

  return vm.runInContext(
    source,
    context,
    { filename: relativePath }
  );
}

function loadWavesConfig() {
  // نفس القيم الموجودة فعليًا في src/core/Config.js (قسم WAVES)
  // بحيث يبقى الاختبار متزامنًا مع أي تعديل مستقبلي في الإحصائيات
  // الأساسية طالما لم يُغيَّر شكل الكائن.
  const source = readSource("src/core/Config.js");

  const context = vm.createContext({
    console,
    Math,
    Number,
    window: { addEventListener() {} },
  });

  return vm.runInContext(
    `(function () {
      ${source}
      return CONFIG.WAVES;
    })()`,
    context,
    { filename: "src/core/Config.js" }
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
 * يحمّل EventBus + Config + WaveManager + WaveOrchestrator +
 * EnemyManager stub داخل سياق واحد مشترك (نفس الطريقة التي
 * تُحمَّل بها ملفات <script> الحقيقية على صفحة واحدة).
 */
function loadVerticalSliceContext() {
  const context = createContext();

  loadScript("src/core/Config.js", context);
  loadScript("src/core/EventBus.js", context);
  loadScript("src/waves/WaveManager.js", context);
  loadScript("src/waves/WaveOrchestrator.js", context);

  // EnemyManager stub — يكفي لإثبات أن Orchestrator يستدعيه
  // بشكل صحيح، دون الحاجة لـ THREE/DOM حقيقيين.
  vm.runInContext(
    `
    var EnemyManager = {
      spawned: [],
      nextId: 1,
      spawnEnemy(data) {
        const enemy = Object.assign(
          { id: "test_enemy_" + this.nextId++ },
          data
        );
        this.spawned.push(enemy);
        return enemy;
      },
    };
    globalThis.EnemyManager = EnemyManager;
    `,
    context,
    { filename: "stub/EnemyManager.js" }
  );

  return context;
}

// ============================================================
// EXPORT IDENTITY
// ============================================================

test(
  "WaveManager resolves to the singleton instance, not the class",
  () => {
    const context = createContext();

    loadScript("src/core/EventBus.js", context);
    loadScript("src/waves/WaveManager.js", context);

    const type = vm.runInContext(
      "typeof WaveManager",
      context
    );

    assert.equal(
      type,
      "object",
      "WaveManager must be the singleton instance (object), not the class constructor (function)."
    );

    const hasInit = vm.runInContext(
      "typeof WaveManager.init",
      context
    );

    const hasIsGameOver = vm.runInContext(
      "typeof WaveManager.isGameOver",
      context
    );

    assert.equal(hasInit, "function");
    assert.equal(hasIsGameOver, "function");
  }
);

test(
  "WaveManager.isGameOver() reflects base-destroyed state",
  () => {
    const context = createContext();

    loadScript("src/core/EventBus.js", context);
    loadScript("src/waves/WaveManager.js", context);

    vm.runInContext("WaveManager.init();", context);

    assert.equal(
      vm.runInContext("WaveManager.isGameOver()", context),
      false
    );

    vm.runInContext(
      'EventBus.emit("BaseDestroyed", {});',
      context
    );

    assert.equal(
      vm.runInContext("WaveManager.isGameOver()", context),
      true
    );
  }
);

// ============================================================
// WAVE SCALING MATH
// ============================================================

test(
  "WaveOrchestrator wave 1 matches CONFIG.WAVES.BASE_ENEMY exactly",
  () => {
    const W = loadWavesConfig();
    const context = loadVerticalSliceContext();

    const wave1 = vm.runInContext(
      "WaveOrchestrator._buildWaveConfig(1)",
      context
    );

    assert.equal(
      wave1.enemyTemplate.maxHp,
      W.BASE_ENEMY.maxHp
    );

    assert.equal(
      wave1.enemyTemplate.damage,
      W.BASE_ENEMY.damage
    );

    assert.equal(
      wave1.enemyCount,
      W.SCALING.QUANTITY_BASE
    );

    assert.equal(
      wave1.spawnInterval,
      W.SPAWN_INTERVAL
    );
  }
);

test(
  "WaveOrchestrator later waves scale up HP, damage, reward and quantity",
  () => {
    const context = loadVerticalSliceContext();

    const wave1 = vm.runInContext(
      "WaveOrchestrator._buildWaveConfig(1)",
      context
    );

    const wave5 = vm.runInContext(
      "WaveOrchestrator._buildWaveConfig(5)",
      context
    );

    assert.ok(
      wave5.enemyTemplate.maxHp > wave1.enemyTemplate.maxHp,
      "HP must scale up with wave number."
    );

    assert.ok(
      wave5.enemyTemplate.damage > wave1.enemyTemplate.damage,
      "Damage must scale up with wave number."
    );

    assert.ok(
      wave5.enemyTemplate.reward > wave1.enemyTemplate.reward,
      "Reward must scale up with wave number."
    );

    assert.ok(
      wave5.enemyCount >= wave1.enemyCount,
      "Enemy quantity must not decrease with wave number."
    );
  }
);

test(
  "WaveOrchestrator quantity never exceeds QUANTITY_MAX",
  () => {
    const W = loadWavesConfig();
    const context = loadVerticalSliceContext();

    const farWave = vm.runInContext(
      "WaveOrchestrator._buildWaveConfig(200)",
      context
    );

    assert.equal(
      farWave.enemyCount,
      W.SCALING.QUANTITY_MAX
    );
  }
);

// ============================================================
// FULL VERTICAL SLICE LIFECYCLE
// ============================================================

test(
  "Vertical slice: countdown -> wave 1 starts with the configured enemy count",
  () => {
    const W = loadWavesConfig();
    const context = loadVerticalSliceContext();

    vm.runInContext(
      `
      WaveManager.init();
      WaveOrchestrator.init();
      `,
      context
    );

    assert.equal(
      vm.runInContext("WaveManager.currentWave", context),
      0,
      "No wave should have started before the countdown elapses."
    );

    // تقدّم الوقت أكثر من TIME_BEFORE_FIRST_WAVE.
    vm.runInContext(
      `
      for (let i = 0; i < 40; i++) {
        WaveOrchestrator.update(0.5);
        WaveManager.update(0.5);
      }
      `,
      context
    );

    assert.equal(
      vm.runInContext("WaveManager.currentWave", context),
      1,
      "Wave 1 must start automatically once the pre-wave countdown elapses."
    );

    assert.equal(
      vm.runInContext(
        "WaveManager.summary().waveConfig.enemyCount",
        context
      ),
      W.SCALING.QUANTITY_BASE
    );
  }
);

test(
  "Vertical slice: enemies actually get spawned through EnemyManager",
  () => {
    const context = loadVerticalSliceContext();

    vm.runInContext(
      `
      WaveManager.init();
      WaveOrchestrator.init();

      for (let i = 0; i < 40; i++) {
        WaveOrchestrator.update(0.5);
        WaveManager.update(0.5);
      }
      `,
      context
    );

    const spawnedCount = vm.runInContext(
      "EnemyManager.spawned.length",
      context
    );

    assert.ok(
      spawnedCount > 0,
      "WaveOrchestrator must call EnemyManager.spawnEnemy() to actually create enemies."
    );

    assert.equal(
      vm.runInContext(
        "WaveManager.summary().spawnedEnemies",
        context
      ),
      spawnedCount,
      "Every EnemyManager spawn must be registered with WaveManager."
    );
  }
);

test(
  "Vertical slice: defeating every enemy completes the wave and starts a countdown to the next one",
  () => {
    const context = loadVerticalSliceContext();

    vm.runInContext(
      `
      WaveManager.init();
      WaveOrchestrator.init();

      // اجعل الفرز فوريًا لتبسيط الاختبار.
      for (let i = 0; i < 60; i++) {
        WaveOrchestrator.update(1);
        WaveManager.update(1);
      }

      const enemyCount = WaveManager.summary().waveConfig.enemyCount;

      for (let i = 0; i < enemyCount; i++) {
        WaveOrchestrator.handleEnemyDied();
      }

      WaveOrchestrator.update(0.016);
      WaveManager.update(0.016);
      `,
      context
    );

    assert.equal(
      vm.runInContext(
        "WaveManager.summary().completed",
        context
      ),
      true,
      "Wave must be marked completed once every spawned enemy is defeated."
    );

    const uiData = vm.runInContext(
      "WaveOrchestrator.getUIData()",
      context
    );

    assert.equal(
      uiData.state,
      "countdown",
      "Orchestrator must move into a countdown toward the next wave."
    );
  }
);

test(
  "Vertical slice: BaseDestroyed stops the orchestrator without throwing",
  () => {
    const context = loadVerticalSliceContext();

    vm.runInContext(
      `
      WaveManager.init();
      WaveOrchestrator.init();

      EventBus.emit("BaseDestroyed", { hp: 0, maxHp: 100, damage: 100 });
      `,
      context
    );

    assert.doesNotThrow(() => {
      vm.runInContext(
        `
        for (let i = 0; i < 10; i++) {
          WaveOrchestrator.update(1);
          WaveManager.update(1);
        }
        `,
        context
      );
    });

    assert.equal(
      vm.runInContext("WaveManager.currentWave", context),
      0,
      "No further wave should start after the base is destroyed."
    );
  }
);

// ============================================================
// ENEMIES THAT REACH THE BASE MUST STILL COMPLETE THE WAVE
// (regression: an enemy reaching the base used to never be
// counted, so any wave with a single survivor hung forever and
// wave N+1 never started — see PROJECT_STATE.md / CHANGELOG.md,
// bug reported by manual testing of the live vertical slice).
// ============================================================

test(
  "Vertical slice: an enemy that reaches the base (not just one that dies) still completes the wave",
  () => {
    const context = loadVerticalSliceContext();

    vm.runInContext(
      `
      WaveManager.init();
      WaveOrchestrator.init();

      for (let i = 0; i < 60; i++) {
        WaveOrchestrator.update(1);
        WaveManager.update(1);
      }

      const enemyCount = WaveManager.summary().waveConfig.enemyCount;

      // لا عدو واحد يموت هنا — كلهم "يصلون للقاعدة" بدل ذلك،
      // بالضبط كما يحدث فعليًا حين تفشل الدفاعات في قتلهم جميعًا.
      for (let i = 0; i < enemyCount; i++) {
        WaveOrchestrator.handleEnemyReachedBase();
      }

      WaveOrchestrator.update(0.016);
      WaveManager.update(0.016);
      `,
      context
    );

    assert.equal(
      vm.runInContext(
        "WaveManager.summary().completed",
        context
      ),
      true,
      "A wave must complete even if every enemy reached the base instead of dying — reaching the base still removes the enemy from play."
    );

    const uiData = vm.runInContext(
      "WaveOrchestrator.getUIData()",
      context
    );

    assert.equal(
      uiData.state,
      "countdown",
      "The orchestrator must move into a countdown toward the next wave, not hang forever, once every enemy has been accounted for (dead or reached-base)."
    );
  }
);

test(
  "Vertical slice: a mix of dead and reached-base enemies still completes the wave exactly once (no double counting)",
  () => {
    const context = loadVerticalSliceContext();

    vm.runInContext(
      `
      WaveManager.init();
      WaveOrchestrator.init();

      for (let i = 0; i < 60; i++) {
        WaveOrchestrator.update(1);
        WaveManager.update(1);
      }
      `,
      context
    );

    const enemyCount = vm.runInContext(
      "WaveManager.summary().waveConfig.enemyCount",
      context
    );

    const half = Math.floor(enemyCount / 2);

    vm.runInContext(
      `
      for (let i = 0; i < ${half}; i++) {
        WaveOrchestrator.handleEnemyDied();
      }
      for (let i = 0; i < ${enemyCount - half}; i++) {
        WaveOrchestrator.handleEnemyReachedBase();
      }

      WaveOrchestrator.update(0.016);
      WaveManager.update(0.016);
      `,
      context
    );

    assert.equal(
      vm.runInContext(
        "WaveManager.summary().defeatedEnemies",
        context
      ),
      enemyCount,
      "Died + reached-base together must equal exactly enemyCount, not overshoot it."
    );

    assert.equal(
      vm.runInContext(
        "WaveManager.summary().completed",
        context
      ),
      true
    );
  }
);

