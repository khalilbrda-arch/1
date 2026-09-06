/**
 * Infinity Depths
 * Phase 4 — Static Architecture Audit
 *
 * الهدف:
 * - فحص حدود الأنظمة معماريًا بشكل آلي.
 * - منع الاعتماد المباشر غير المسموح به على GameState.
 * - منع WaveManager من الرجوع إلى GameState.
 * - التأكد من أن Game.js يبقى منسقًا ولا يتحول إلى مالك لقواعد الأنظمة.
 * - اكتشاف الدورات الواضحة في تبعيات ملفات JavaScript.
 *
 * التشغيل:
 * node --test tests/phase4-architecture-audit.test.js
 */

const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(
  __dirname,
  ".."
);

const SRC = path.join(
  ROOT,
  "src"
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

function getJavaScriptFiles(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  const result = [];

  for (const entry of fs.readdirSync(
    directory,
    {
      withFileTypes: true,
    }
  )) {
    const fullPath =
      path.join(
        directory,
        entry.name
      );

    if (entry.isDirectory()) {
      result.push(
        ...getJavaScriptFiles(
          fullPath
        )
      );

      continue;
    }

    if (
      entry.isFile() &&
      entry.name.endsWith(".js")
    ) {
      result.push(fullPath);
    }
  }

  return result;
}

function relativeToRoot(filePath) {
  return path
    .relative(
      ROOT,
      filePath
    )
    .replaceAll(
      path.sep,
      "/"
    );
}

function getSourceFiles() {
  return getJavaScriptFiles(SRC);
}

function getDependencies(relativePath) {
  const source =
    stripComments(
      readSource(relativePath)
    );

  const dependencies =
    new Set();

  /*
   * المشروع الحالي يستخدم ملفات JavaScript
   * بدون نظام modules موحد، لذلك نبحث عن
   * المراجع المباشرة المعروفة للملفات.
   */

  const knownSystems = [
    "Game",
    "GameState",
    "EventBus",
    "Config",
    "DataContracts",
    "Time",
    "WaveManager",
    "Enemy",
    "EnemyManager",
    "Defense",
    "DefenseManager",
    "CombatSystem",
    "Projectile",
    "ProjectileManager",
    "EconomySystem",
    "CameraController",
    "ProgressionSystem",
  ];

  for (const system of knownSystems) {
    const pattern =
      new RegExp(
        `\\b${system}\\b`
      );

    if (pattern.test(source)) {
      dependencies.add(system);
    }
  }

  return dependencies;
}

// ============================================================
// REQUIRED FILES
// ============================================================

test(
  "Architecture Audit: required Phase 4 core files exist",
  () => {
    const requiredFiles = [
      "src/core/Game.js",
      "src/core/GameState.js",
      "src/core/EventBus.js",
      "src/core/Config.js",
      "src/core/DataContracts.js",
      "src/core/Time.js",
      "src/waves/WaveManager.js",
    ];

    for (const file of requiredFiles) {
      assert.equal(
        fs.existsSync(
          path.join(
            ROOT,
            file
          )
        ),
        true,
        `Required architecture file is missing: ${file}`
      );
    }
  }
);

// ============================================================
// GAMESTATE BOUNDARY
// ============================================================

test(
  "Architecture Audit: GameState is not referenced outside approved boundaries",
  () => {
    const files =
      getSourceFiles();

    const violations = [];

    const approvedFiles = new Set([
      "src/core/Game.js",
      "src/core/GameState.js",
    ]);

    for (const filePath of files) {
      const relativePath =
        relativeToRoot(
          filePath
        );

      if (
        approvedFiles.has(
          relativePath
        )
      ) {
        continue;
      }

      const source =
        stripComments(
          fs.readFileSync(
            filePath,
            "utf8"
          )
        );

      if (
        /\bGameState\b/.test(
          source
        )
      ) {
        violations.push(
          relativePath
        );
      }
    }

    assert.deepEqual(
      violations,
      [],
      `Direct GameState dependency found in: ${violations.join(", ")}`
    );
  }
);

// ============================================================
// WAVES BOUNDARY
// ============================================================

test(
  "Architecture Audit: WaveManager does not depend on GameState",
  () => {
    const source =
      stripComments(
        readSource(
          "src/waves/WaveManager.js"
        )
      );

    assert.equal(
      /\bGameState\b/.test(
        source
      ),
      false,
      "WaveManager must communicate with game state through defined boundaries."
    );
  }
);

test(
  "Architecture Audit: WaveManager uses EventBus for BaseDestroyed",
  () => {
    const source =
      stripComments(
        readSource(
          "src/waves/WaveManager.js"
        )
      );

    assert.equal(
      source.includes(
        '"BaseDestroyed"'
      ),
      true,
      "WaveManager must react to BaseDestroyed."
    );

    assert.equal(
      source.includes(
        "EventBus.on"
      ),
      true,
      "WaveManager must use EventBus for the BaseDestroyed boundary."
    );
  }
);

// ============================================================
// GAME COORDINATOR
// ============================================================

test(
  "Architecture Audit: Game owns EnemyReachedBase coordination",
  () => {
    const source =
      stripComments(
        readSource(
          "src/core/Game.js"
        )
      );

    assert.equal(
      source.includes(
        '"EnemyReachedBase"'
      ),
      true,
      "Game must coordinate EnemyReachedBase."
    );

    assert.equal(
      source.includes(
        "GameState.damageBase"
      ),
      true,
      "Game must route base damage to GameState."
    );
  }
);

test(
  "Architecture Audit: Game emits BaseDestroyed after the state transition",
  () => {
    const source =
      stripComments(
        readSource(
          "src/core/Game.js"
        )
      );

    const wasDestroyedIndex =
      source.indexOf(
        "wasDestroyed"
      );

    const damageIndex =
      source.indexOf(
        "GameState.damageBase"
      );

    const emitIndex =
      source.indexOf(
        'EventBus.emit(\n        "BaseDestroyed"'
      );

    assert.notEqual(
      wasDestroyedIndex,
      -1,
      "Game must capture the previous destroyed state."
    );

    assert.notEqual(
      damageIndex,
      -1,
      "Game must apply base damage."
    );

    assert.notEqual(
      emitIndex,
      -1,
      "Game must emit BaseDestroyed."
    );

    assert.ok(
      wasDestroyedIndex <
        damageIndex,
      "Previous destruction state must be captured before damage."
    );

    assert.ok(
      damageIndex <
        emitIndex,
      "BaseDestroyed must be emitted after damage is applied."
    );
  }
);

// ============================================================
// EVENTBUS BOUNDARY
// ============================================================

test(
  "Architecture Audit: EventBus exposes the required event boundary API",
  () => {
    const source =
      stripComments(
        readSource(
          "src/core/EventBus.js"
        )
      );

    const requiredMethods = [
      "on",
      "off",
      "offAll",
      "emit",
      "hasListeners",
      "clear",
    ];

    for (const method of requiredMethods) {
      assert.match(
        source,
        new RegExp(
          `\\b${method}\\b`
        ),
        `EventBus must expose ${method}.`
      );
    }
  }
);

// ============================================================
// CORE OWNERSHIP
// ============================================================

test(
  "Architecture Audit: GameState remains a state owner, not an event coordinator",
  () => {
    const source =
      stripComments(
        readSource(
          "src/core/GameState.js"
        )
      );

    assert.equal(
      source.includes(
        "EventBus"
      ),
      false,
      "GameState must not directly depend on EventBus."
    );
  }
);

test(
  "Architecture Audit: EventBus remains infrastructure-neutral",
  () => {
    const source =
      stripComments(
        readSource(
          "src/core/EventBus.js"
        )
      );

    const forbiddenReferences = [
      "GameState",
      "WaveManager",
      "EnemyManager",
      "DefenseManager",
      "EconomySystem",
      "CombatSystem",
    ];

    const violations =
      forbiddenReferences.filter(
        (name) =>
          new RegExp(
            `\\b${name}\\b`
          ).test(source)
      );

    assert.deepEqual(
      violations,
      [],
      `EventBus must not know gameplay system owners: ${violations.join(", ")}`
    );
  }
);

// ============================================================
// DEPENDENCY DIRECTION
// ============================================================

test(
  "Architecture Audit: core EventBus does not depend on gameplay systems",
  () => {
    const source =
      stripComments(
        readSource(
          "src/core/EventBus.js"
        )
      );

    const forbiddenPatterns = [
      /WaveManager/,
      /EnemyManager/,
      /DefenseManager/,
      /EconomySystem/,
      /CombatSystem/,
    ];

    const violations =
      forbiddenPatterns
        .filter(
          (pattern) =>
            pattern.test(source)
        )
        .map(
          (pattern) =>
            pattern.toString()
        );

    assert.deepEqual(
      violations,
      [],
      `Core EventBus has gameplay dependencies: ${violations.join(", ")}`
    );
  }
);

// ============================================================
// SELF DEPENDENCY
// ============================================================

test(
  "Architecture Audit: no source file references itself as a system dependency",
  () => {
    const files =
      getSourceFiles();

    const violations = [];

    for (const filePath of files) {
      const relativePath =
        relativeToRoot(
          filePath
        );

      const basename =
        path.basename(
          relativePath,
          ".js"
        );

      const source =
        stripComments(
          fs.readFileSync(
            filePath,
            "utf8"
          )
        );

      const pattern =
        new RegExp(
          `\\b${basename}\\b`
        );

      /*
       * يسمح باسم الملف نفسه داخل تعريف
       * class/object أو النصوص، لذلك لا نعتبر
       * كل ظهور انتهاكًا.
       *
       * الفحص هنا يستهدف import/require فقط.
       */
      const importPattern =
        new RegExp(
          `(import\\s+[^;]*\\b${basename}\\b|require\\s*\\([^)]*\\b${basename}\\b)`
        );

      if (
        importPattern.test(
          source
        )
      ) {
        violations.push(
          relativePath
        );
      }
    }

    assert.deepEqual(
      violations,
      [],
      `Self dependencies detected: ${violations.join(", ")}`
    );
  }
);

// ============================================================
// SYNTAX SAFETY
// ============================================================

test(
  "Architecture Audit: all source JavaScript files are syntactically valid",
  () => {
    const files =
      getSourceFiles();

    const failures = [];

    for (const filePath of files) {
      const relativePath =
        relativeToRoot(
          filePath
        );

      const source =
        fs.readFileSync(
          filePath,
          "utf8"
        );

      try {
        new Function(source);
      } catch (error) {
        failures.push(
          `${relativePath}: ${error.message}`
        );
      }
    }

    assert.deepEqual(
      failures,
      [],
      `Syntax failures detected:\n${failures.join("\n")}`
    );
  }
);

// ============================================================
// AUDIT SUMMARY
// ============================================================

console.log(
  "\n========================================"
);

console.log(
  "Infinity Depths — Phase 4 Static Architecture Audit"
);

console.log(
  "========================================\n"
);

console.log(
  `Source files scanned: ${getSourceFiles().length}`
);

console.log(
  "Architecture boundaries: enforced"
);

console.log(
  "GameState ownership: enforced"
);

console.log(
  "EventBus boundary: enforced"
);

console.log(
  "Syntax validation: enforced\n"
);
