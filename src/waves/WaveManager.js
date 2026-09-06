/**
 * Infinity Depths
 * WaveManager
 *
 * Responsibility:
 * - Own wave progression.
 * - Spawn enemies according to wave configuration.
 * - Track active wave state.
 * - React to BaseDestroyed through EventBus.
 *
 * Architecture:
 * GameState -> Game -> EventBus -> WaveManager
 *
 * WaveManager MUST NOT depend directly on GameState.
 */

/*
 * NOTE: the class is intentionally NOT named "WaveManager".
 *
 * A top-level `class WaveManager` in a classic <script> creates a
 * global *lexical* binding for the identifier "WaveManager" that
 * shadows any same-named property placed on globalThis/window for
 * every later <script> on the page (Game.js, debug HUD, etc.).
 * Every call site in the project treats "WaveManager" as the
 * singleton instance (WaveManager.init(), WaveManager.isGameOver()),
 * matching the plain-singleton-object convention every other manager
 * in this codebase follows (EnemyManager, DefenseManager,
 * EconomySystem, ...). So the class itself is named
 * WaveManagerClass, and only the singleton instance is exposed
 * under the identifier "WaveManager".
 */
class WaveManagerClass {
  constructor() {
    this.currentWave = 0;
    this.active = false;
    this.completed = false;

    this.spawnedEnemies = 0;
    this.defeatedEnemies = 0;

    this.waveConfig = null;

    this.baseDestroyed = false;
    this._baseDestroyedListener = null;
  }

  /**
   * Initialize the wave manager.
   *
   * EventBus is resolved at runtime so this class remains
   * compatible with the project's global architecture.
   */
  init() {
    this.currentWave = 0;
    this.active = false;
    this.completed = false;

    this.spawnedEnemies = 0;
    this.defeatedEnemies = 0;

    this.waveConfig = null;
    this.baseDestroyed = false;

    if (this._baseDestroyedListener) {
      if (
        typeof EventBus !== "undefined" &&
        EventBus &&
        typeof EventBus.off === "function"
      ) {
        EventBus.off(
          "BaseDestroyed",
          this._baseDestroyedListener
        );
      }

      this._baseDestroyedListener = null;
    }

    if (
      typeof EventBus !== "undefined" &&
      EventBus &&
      typeof EventBus.on === "function"
    ) {
      this._baseDestroyedListener = () => {
        this.baseDestroyed = true;
        this.active = false;
      };

      EventBus.on(
        "BaseDestroyed",
        this._baseDestroyedListener
      );
    }

    return this;
  }

  /**
   * Start a wave.
   */
  startWave(config = {}) {
    if (this.baseDestroyed) {
      return false;
    }

    this.currentWave += 1;

    this.active = true;
    this.completed = false;

    this.spawnedEnemies = 0;
    this.defeatedEnemies = 0;

    this.waveConfig = {
      enemyCount:
        Number.isFinite(config.enemyCount)
          ? Math.max(0, config.enemyCount)
          : 0,

      spawnInterval:
        Number.isFinite(config.spawnInterval)
          ? Math.max(0, config.spawnInterval)
          : 0,

      enemies:
        Array.isArray(config.enemies)
          ? config.enemies
          : [],
    };

    this._emit(
      "WaveStarted",
      {
        wave: this.currentWave,
        config: this.waveConfig,
      }
    );

    return true;
  }

  /**
   * Update wave state.
   */
  update(deltaTime = 0) {
    if (!this.active) {
      return;
    }

    if (this.baseDestroyed) {
      this.active = false;
      return;
    }

    if (!this.waveConfig) {
      return;
    }

    /*
     * Wave spawning is intentionally kept lightweight here.
     * Enemy creation belongs to the appropriate gameplay system.
     */
    if (
      this.spawnedEnemies >=
      this.waveConfig.enemyCount
    ) {
      if (
        this.defeatedEnemies >=
        this.waveConfig.enemyCount
      ) {
        this._completeWave();
      }
    }

    void deltaTime;
  }

  /**
   * Register an enemy spawn.
   */
  registerEnemySpawn(enemy = null) {
    if (!this.active || this.baseDestroyed) {
      return false;
    }

    this.spawnedEnemies += 1;

    this._emit(
      "EnemySpawned",
      {
        wave: this.currentWave,
        enemy,
        spawnedEnemies: this.spawnedEnemies,
      }
    );

    return true;
  }

  /**
   * Register an enemy defeat.
   */
  registerEnemyDefeat(enemy = null) {
    if (this.baseDestroyed) {
      return false;
    }

    this.defeatedEnemies += 1;

    this._emit(
      "EnemyDefeated",
      {
        wave: this.currentWave,
        enemy,
        defeatedEnemies: this.defeatedEnemies,
      }
    );

    if (
      this.active &&
      this.spawnedEnemies >=
        this.waveConfig?.enemyCount &&
      this.defeatedEnemies >=
        this.waveConfig?.enemyCount
    ) {
      this._completeWave();
    }

    return true;
  }

  /**
   * Complete the current wave.
   */
  _completeWave() {
    if (!this.active) {
      return;
    }

    this.active = false;
    this.completed = true;

    this._emit(
      "WaveCompleted",
      {
        wave: this.currentWave,
        spawnedEnemies: this.spawnedEnemies,
        defeatedEnemies: this.defeatedEnemies,
      }
    );
  }

  /**
   * Whether the game has ended (base destroyed).
   *
   * Used by Game.js to gate gameplay updates (enemies,
   * defenses, projectiles) once the base is destroyed.
   */
  isGameOver() {
    return this.baseDestroyed;
  }

  /**
   * Return a serializable summary.
   */
  summary() {
    return {
      currentWave: this.currentWave,
      active: this.active,
      completed: this.completed,

      spawnedEnemies: this.spawnedEnemies,
      defeatedEnemies: this.defeatedEnemies,

      baseDestroyed: this.baseDestroyed,

      waveConfig: this.waveConfig
        ? {
            enemyCount:
              this.waveConfig.enemyCount,

            spawnInterval:
              this.waveConfig.spawnInterval,

            enemies:
              Array.isArray(
                this.waveConfig.enemies
              )
                ? [
                    ...this.waveConfig.enemies,
                  ]
                : [],
          }
        : null,
    };
  }

  /**
   * Emit an EventBus event safely.
   */
  _emit(eventName, payload = null) {
    if (
      typeof EventBus !== "undefined" &&
      EventBus &&
      typeof EventBus.emit === "function"
    ) {
      EventBus.emit(
        eventName,
        payload
      );

      return true;
    }

    if (
      typeof console !== "undefined" &&
      typeof console.error === "function"
    ) {
      console.error(
        `WaveManager: EventBus is not available for "${eventName}".`
      );
    }

    return false;
  }
}

const waveManager =
  new WaveManagerClass();

if (
  typeof globalThis !== "undefined"
) {
  globalThis.WaveManager =
    waveManager;

  globalThis.WaveManagerClass =
    WaveManagerClass;
}
