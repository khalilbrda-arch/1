/**
 * Infinity Depths
 * Phase 4 — Architecture Gate
 *
 * Gate criteria:
 * - Critical circular dependencies are absent.
 * - Ownership boundaries are enforced.
 * - Gameplay authority is not placed in UI.
 * - Save boundary is explicitly documented.
 * - Data contracts exist and are validated.
 * - EventBus boundaries exist.
 * - Critical validation/error handling exists.
 * - Automated testing foundation exists.
 * - No duplicate core systems are introduced.
 * - Current systems remain regression-safe.
 */

const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(
  __dirname,
  ".."
);

function read(relativePath) {
  return fs.readFileSync(
    path.join(
      ROOT,
      relativePath
    ),
    "utf8"
  );
}

function hasFile(relativePath) {
  return fs.existsSync(
    path.join(
      ROOT,
      relativePath
    )
  );
}

test(
  "Architecture Gate: foundation contracts and boundaries exist",
  () => {
    const requiredFiles = [
      "src/core/EventBus.js",
      "src/core/DataContracts.js",
      "src/core/Game.js",
      "src/core/GameState.js",
      "src/economy/EconomySystem.js",
      "src/waves/WaveManager.js",
      "tests/phase4-foundation.test.js",
      "tests/phase4-integration.test.js",
      "tests/phase4-regression.test.js",
      "tests/phase4-architecture-audit.test.js",
    ];

    for (const file of requiredFiles) {
      assert.equal(
        hasFile(file),
        true,
        `Required Phase 4 foundation file is missing: ${file}`
      );
    }
  }
);

test(
  "Architecture Gate: Economy owns currency runtime and does not depend on GameState",
  () => {
    const economy = read(
      "src/economy/EconomySystem.js"
    );

    assert.equal(
      /\bGameState\b/.test(
        economy
      ),
      false,
      "EconomySystem must remain independent from GameState."
    );

    assert.match(
      economy,
      /\bbalance\b/,
      "EconomySystem must own its runtime balance."
    );

    assert.match(
      economy,
      /\bspend\s*\(/,
      "EconomySystem must expose spending."
    );

    assert.match(
      economy,
      /\badd\s*\(/,
      "EconomySystem must expose rewards/additions."
    );
  }
);

test(
  "Architecture Gate: Game is the integration boundary for currency synchronization",
  () => {
    const game = read(
      "src/core/Game.js"
    );

    assert.match(
      game,
      /EconomySystem\.init\s*\(/,
      "Game must initialize EconomySystem."
    );

    assert.match(
      game,
      /["']CurrencyChanged["']/,
      "Game must consume CurrencyChanged."
    );

    assert.match(
      game,
      /GameState\.player\.currency\s*=\s*balance/,
      "Game must synchronize currency into the existing state boundary."
    );
  }
);

test(
  "Architecture Gate: data-contract boundary is implemented for current core content",
  () => {
    const contracts = read(
      "src/core/DataContracts.js"
    );

    assert.match(
      contracts,
      /validateEnemyDefinition\s*\(/
    );

    assert.match(
      contracts,
      /validateEnemySpawnData\s*\(/
    );

    assert.match(
      contracts,
      /validateDefenseDefinition\s*\(/
    );

    assert.match(
      contracts,
      /validateConfig\s*\(/
    );
  }
);

test(
  "Architecture Gate: EventBus remains infrastructure-only",
  () => {
    const eventBus = read(
      "src/core/EventBus.js"
    );

    const forbidden = [
      "GameState",
      "WaveManager",
      "EnemyManager",
      "DefenseManager",
      "EconomySystem",
      "CombatSystem",
    ];

    for (const name of forbidden) {
      assert.equal(
        new RegExp(
          `\\b${name}\\b`
        ).test(eventBus),
        false,
        `EventBus must not depend on ${name}.`
      );
    }
  }
);

test(
  "Architecture Gate: save ownership is explicitly separated from gameplay state",
  () => {
    const architecture = read(
      "ARCHITECTURE.md"
    );

    const technicalRules = read(
      "TECHNICAL_RULES.md"
    );

    assert.match(
      architecture,
      /Save System owns persistence/i,
      "Architecture.md must explicitly assign persistence ownership."
    );

    assert.match(
      technicalRules,
      /Save data must be versioned/i,
      "Technical rules must define the save boundary."
    );
  }
);

test(
  "Architecture Gate: UI does not directly own authoritative gameplay state",
  () => {
    const uiFiles = [
      "src/ui/BaseHUD.js",
      "src/ui/DefenseUI.js",
      "src/ui/GameOverUI.js",
      "src/ui/Toast.js",
      "src/ui/WaveUI.js",
    ];

    for (const file of uiFiles) {
      if (!hasFile(file)) {
        continue;
      }

      const source = read(file);

      assert.equal(
        /\bGameState\b/.test(
          source
        ),
        false,
        `${file} must not directly depend on GameState.`
      );
    }
  }
);

test(
  "Architecture Gate: current architecture audit is present and regression suite remains part of the gate",
  () => {
    const audit = read(
      "tests/phase4-architecture-audit.test.js"
    );

    assert.match(
      audit,
      /GameState is not referenced outside approved boundaries/
    );

    assert.match(
      audit,
      /WaveManager does not depend on GameState/
    );

    assert.match(
      audit,
      /all source JavaScript files are syntactically valid/
    );

    assert.equal(
      hasFile(
        "tests/phase4-regression.test.js"
      ),
      true
    );
  }
);
