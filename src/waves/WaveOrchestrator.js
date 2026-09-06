/**
 * WaveOrchestrator.js
 * -------------------
 * Phase 5 — Vertical Slice.
 *
 * المشكلة التي يحلّها هذا الملف:
 *
 * WaveManager يملك حالة الموجة (currentWave, active, completed...)
 * لكنه لا يُنشئ أعداء بنفسه (وهذا مقصود ومُوثَّق داخل WaveManager.js:
 * "Enemy creation belongs to the appropriate gameplay system.").
 *
 * CONFIG.WAVES يحتوي بالفعل على كل بيانات التصعيد لكل موجة
 * (BASE_ENEMY + SCALING) لكن لا شيء في المشروع كان يقرأها فعليًا —
 * WaveManager.startWave() لم يكن يُستدعى من أي مكان على الإطلاق.
 *
 * WaveOrchestrator هو النظام الذي يربط الطرفين:
 *
 * CONFIG.WAVES
 *   ↓
 * WaveOrchestrator (يحسب إحصائيات/عدد أعداء الموجة الحالية)
 *   ↓
 * WaveManager.startWave() / registerEnemySpawn() / registerEnemyDefeat()
 *   ↓
 * EnemyManager.spawnEnemy()
 *
 * لا يملك:
 * - حالة اللعبة المركزية (Central Game State).
 * - اقتصاد اللعبة (Economy).
 * - عرض (UI) — فقط يوفّر getUIData() تُستهلك من WaveUI عبر Game.js.
 *
 * لا يعتمد مباشرة على حالة اللعبة المركزية (Central Game State).
 */

const WaveOrchestrator = {
  initialized: false,

  // idle | countdown | spawning | waiting-clear | game-over
  _state: "idle",

  _countdown: 0,

  _spawnTimer: 0,
  _enemiesRemainingToSpawn: 0,
  _currentEnemyTemplate: null,
  _bossPending: false,
  _bossWave: false,

  _boundOnWaveCompleted: null,
  _boundOnBaseDestroyed: null,

  /**
   * تهيئة النظام. يجب استدعاؤها بعد WaveManager.init()
   * وEnemyManager.init().
   */
  init() {
    this._state = "countdown";

    this._countdown =
      this._config().TIME_BEFORE_FIRST_WAVE;

    this._spawnTimer = 0;
    this._enemiesRemainingToSpawn = 0;
    this._currentEnemyTemplate = null;

    if (
      typeof EventBus === "undefined" ||
      !EventBus
    ) {
      console.error(
        "WaveOrchestrator: EventBus is not available."
      );

      this.initialized = true;

      return this;
    }

    this._boundOnWaveCompleted = () => {
      if (this._state === "game-over") {
        return;
      }

      this._state = "countdown";

      this._countdown =
        this._config().TIME_BETWEEN_WAVES;
    };

    this._boundOnBaseDestroyed = () => {
      this._state = "game-over";
    };

    EventBus.on(
      "WaveCompleted",
      this._boundOnWaveCompleted
    );

    EventBus.on(
      "BaseDestroyed",
      this._boundOnBaseDestroyed
    );

    this.initialized = true;

    return this;
  },

  _config() {
    return CONFIG.WAVES;
  },

  /**
   * حساب بيانات موجة معيّنة اعتمادًا على BASE_ENEMY وSCALING.
   *
   * قسم 14 بالمواصفات (Difficulty Scaling): HP وSpeed وArmor
   * وDamage وReward كلها تتصاعد، وليس فقط HP.
   */
  _buildWaveConfig(waveNumber) {
    const W = this._config();
    const S = W.SCALING;

    const waveIndex = Math.max(
      0,
      waveNumber - 1
    );

    const hpMultiplier = Math.pow(
      1 + S.HP_PER_WAVE,
      waveIndex
    );

    const speedMultiplier =
      1 + S.SPEED_PER_WAVE * waveIndex;

    const damageMultiplier =
      1 + S.DAMAGE_PER_WAVE * waveIndex;

    const rewardMultiplier =
      1 + S.REWARD_PER_WAVE * waveIndex;

    const armorBonus =
      Math.floor(waveIndex / 2) *
      S.ARMOR_PER_WAVE;

    const quantity = Math.min(
      S.QUANTITY_MAX,
      S.QUANTITY_BASE +
        S.QUANTITY_PER_WAVE * waveIndex
    );

    const enemyTemplate = {
      name: "Basic Enemy",
      type: "basic",

      maxHp: Math.round(
        W.BASE_ENEMY.maxHp * hpMultiplier
      ),

      speed: Number(
        (
          W.BASE_ENEMY.speed * speedMultiplier
        ).toFixed(2)
      ),

      armor: Number(
        (
          W.BASE_ENEMY.armor + armorBonus
        ).toFixed(2)
      ),

      resistance: W.BASE_ENEMY.resistance,

      damage: Math.round(
        W.BASE_ENEMY.damage * damageMultiplier
      ),

      reward: Math.round(
        W.BASE_ENEMY.reward * rewardMultiplier
      ),
    };

    return {
      enemyCount: quantity,
      spawnInterval: W.SPAWN_INTERVAL,
      enemyTemplate,
    };
  },

  _startNextWave() {
    const nextWaveNumber =
      WaveManager.currentWave + 1;

    const waveConfig =
      this._buildWaveConfig(nextWaveNumber);
    const bossWave =
      typeof BossSystem !== "undefined" &&
      BossSystem &&
      BossSystem.isBossWave(nextWaveNumber);

    const started = WaveManager.startWave({
      enemyCount: waveConfig.enemyCount,
      spawnInterval: waveConfig.spawnInterval,
    });

    if (!started) {
      this._state = "game-over";

      return;
    }

    this._currentEnemyTemplate =
      waveConfig.enemyTemplate;
    this._bossPending = bossWave;
    this._bossWave = bossWave;

    this._enemiesRemainingToSpawn =
      waveConfig.enemyCount;

    this._spawnTimer = 0;

    this._state = "spawning";
  },

  /**
   * يجب ربطها بحدث EnemyDied من Game.js حتى يعرف WaveManager
   * أن عدوًا قد هُزم (وليس فقط أنه وصل للقاعدة).
   */
  handleEnemyDied() {
    if (
      typeof WaveManager !== "undefined" &&
      WaveManager
    ) {
      WaveManager.registerEnemyDefeat();
    }
  },

  /**
   * يجب ربطها بحدث EnemyReachedBase من Game.js.
   *
   * عدو وصل للقاعدة "غادر الملعب" تمامًا مثل عدو مات — يجب أن
   * يُحتسب ضمن عدّاد اكتمال الموجة (WaveManager.registerEnemyDefeat)
   * وإلا فإن أي عدو ينجح في الوصول للقاعدة (بدل أن يُقتَل) يجعل
   * defeatedEnemies لا يصل أبدًا لعدد enemyCount، فتعلَّق الموجة
   * للأبد ولا تبدأ الموجة التالية (لا مكافأة عملة هنا — تلك حصرًا
   * لحدث EnemyDied في Game.js).
   */
  handleEnemyReachedBase() {
    if (
      typeof WaveManager !== "undefined" &&
      WaveManager
    ) {
      WaveManager.registerEnemyDefeat();
    }
  },

  update(delta = 0) {
    if (!this.initialized) {
      return;
    }

    if (this._state === "game-over") {
      return;
    }

    if (this._state === "countdown") {
      this._countdown -= delta;

      if (this._countdown <= 0) {
        this._startNextWave();
      }

      return;
    }

    if (this._state === "spawning") {
      if (this._enemiesRemainingToSpawn <= 0) {
        this._state = "waiting-clear";

        return;
      }

      this._spawnTimer -= delta;

      if (this._spawnTimer <= 0) {
        const spawnData =
          this._bossPending && typeof BossSystem !== "undefined" && BossSystem
            ? BossSystem.createSpawnData(WaveManager.currentWave)
            : this._currentEnemyTemplate;

        const enemy =
          typeof EnemyManager !== "undefined" &&
          EnemyManager
            ? EnemyManager.spawnEnemy(spawnData)
            : null;

        if (enemy) {
          WaveManager.registerEnemySpawn(
            enemy
          );

          this._enemiesRemainingToSpawn -= 1;
          if (this._bossPending) this._bossPending = false;

          this._spawnTimer =
            this._config().SPAWN_INTERVAL;
        } else {
          /*
           * فشل الإنشاء (مثلًا نقطة الظهور غير متاحة) —
           * إعادة المحاولة الإطار التالي بدل التعليق للأبد.
           */
          this._spawnTimer = 0.1;
        }
      }

      if (this._enemiesRemainingToSpawn <= 0) {
        this._state = "waiting-clear";
      }

      return;
    }

    /*
     * waiting-clear: لا شيء لفعله هنا — WaveManager.update()
     * (المُستدعاة من Game.js) هي من ستكتشف اكتمال الموجة
     * وتُطلق WaveCompleted تلقائيًا بمجرد أن يتساوى
     * defeatedEnemies مع enemyCount.
     */
  },

  /**
   * بيانات مبسّطة يستهلكها WaveUI فقط (لا تملك أي حالة تشغيلية).
   */
  getUIData() {
    const summary =
      typeof WaveManager !== "undefined" &&
      WaveManager
        ? WaveManager.summary()
        : null;

    let uiState = "idle";

    if (this._state === "countdown") {
      uiState = "countdown";
    } else if (this._state === "spawning") {
      uiState = "spawning";
    } else if (this._state === "waiting-clear") {
      uiState = "waiting-clear";
    }

    const enemyCount =
      summary && summary.waveConfig
        ? summary.waveConfig.enemyCount
        : 0;

    const defeated =
      summary ? summary.defeatedEnemies : 0;

    return {
      wave: summary ? summary.currentWave : 0,
      state: uiState,
      countdown: Math.max(
        0,
        Math.ceil(this._countdown)
      ),
      remaining: Math.max(
        0,
        enemyCount - defeated
      ),
    };
  },
};

if (
  typeof globalThis !== "undefined"
) {
  globalThis.WaveOrchestrator =
    WaveOrchestrator;
}
