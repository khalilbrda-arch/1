/**
 * EnemyManager.js
 * ---------------
 * المرحلة 4 — Architecture Foundation.
 *
 * مسؤول عن:
 * - إنشاء الأعداء.
 * - الاحتفاظ بالأعداء النشطين.
 * - تحديث الأعداء.
 * - اكتشاف وصول العدو إلى القاعدة.
 * - إدارة دورة حياة العدو.
 *
 * لا يدير:
 * - GameState.
 * - Economy.
 * - Waves.
 * - UI.
 *
 * نتائج النظام المهمة تُرسل عبر EventBus.
 */

const EnemyManager = {
  group: null,

  enemies: [],

  nextId: 1,

  initialized: false,

  /**
   * تهيئة النظام.
   */
  init(scene) {
    if (!scene) {
      console.error(
        "EnemyManager: scene is required."
      );

      return null;
    }

    this.group =
      new THREE.Group();

    this.enemies = [];
    this.nextId = 1;

    EnemyPath.init();

    scene.add(
      this.group
    );

    this.initialized = true;

    return this.group;
  },

  /**
   * إنشاء عدو جديد.
   *
   * DataContracts هي نقطة التحقق
   * قبل إنشاء الحالة التشغيلية للعدو.
   */
  spawnEnemy(data = {}) {
    if (!this.initialized) {
      return null;
    }

    const enemyData = {
      id:
        data.id ||
        `enemy_${this.nextId++}`,

      name:
        data.name ||
        "Basic Enemy",

      type:
        data.type ||
        "basic",

      maxHp:
        data.maxHp ?? 20,

      speed:
        data.speed ?? 2.2,

      armor:
        data.armor ?? 0,

      resistance:
        data.resistance ?? 0,

      damage:
        data.damage ?? 10,

      reward:
        data.reward ?? 5,

      isBoss: data.isBoss === true,
      bossId: data.bossId || null,
    };

    if (
      typeof DataContracts === "undefined"
    ) {
      console.error(
        "EnemyManager: DataContracts is not available."
      );

      return null;
    }

    if (
      !DataContracts.validateEnemySpawnData(
        enemyData
      )
    ) {
      console.error(
        "EnemyManager: invalid enemy spawn data.",
        enemyData
      );

      return null;
    }

    const enemy =
      new Enemy(enemyData);

    const spawn =
      EnemyPath.getSpawnPoint();

    if (!spawn) {
      console.error(
        "EnemyManager: spawn point is not available."
      );

      enemy.destroy();

      return null;
    }

    enemy.model.position.set(
      spawn.x,
      spawn.y + 0.75,
      spawn.z
    );

    this.enemies.push(
      enemy
    );

    this.group.add(
      enemy.getObject()
    );

    this._emit(
      "EnemySpawned",
      {
        enemyId: enemy.id,
        type: enemy.type,
      }
    );

    return enemy;
  },

  /**
   * البحث عن عدو نشط بالمعرّف.
   */
  getEnemyById(enemyId) {
    return this.enemies.find((enemy) => enemy && enemy.id === enemyId) || null;
  },

  /**
   * إنشاء عدو تجريبي.
   *
   * للاختبار فقط.
   */
  spawnTestEnemy() {
    return this.spawnEnemy({
      name: "Basic Enemy",
      type: "basic",
      maxHp: 20,
      speed: 2.2,
      armor: 0,
      resistance: 0,
      damage: 10,
      reward: 5,
    });
  },

  /**
   * تحديث جميع الأعداء.
   */
  update(delta) {
    if (!this.initialized) {
      return;
    }

    for (const enemy of this.enemies) {
      if (!enemy.alive) {
        continue;
      }

      if (enemy.hasReachedBase()) {
        continue;
      }

      enemy.update(delta);

      /*
       * Enemy.update() قد يؤدي إلى موت العدو
       * بسبب Status Effect مثل Poison.
       *
       * لذلك يجب التقاط الموت هنا أيضًا،
       * وليس فقط من damageEnemy().
       */
      if (!enemy.alive) {
        if (!enemy.reachedBase) {
          this._handleEnemyDeath(
            enemy
          );
        }

        continue;
      }

      if (enemy.hasReachedBase()) {
        this._handleBaseReached(
          enemy
        );
      }
    }

    this._cleanupDeadEnemies();
  },

  /**
   * معالجة وصول العدو إلى القاعدة.
   */
  _handleBaseReached(enemy) {
    if (!enemy) {
      return;
    }

    if (!enemy.alive) {
      return;
    }

    if (!enemy.reachedBase) {
      return;
    }

    const damage =
      Math.max(
        0,
        Number(enemy.damage) || 0
      );

    /*
     * نوقف العدو قبل إرسال الحدث
     * حتى لا تتم معالجته مرة أخرى.
     */
    enemy.alive = false;

    enemy.animationState =
      "attack";

    this._emit(
      "EnemyReachedBase",
      {
        enemyId: enemy.id,
        type: enemy.type,
        damage,
      }
    );
  },

  /**
   * إلحاق الضرر بعدو.
   *
   * CombatSystem هو نقطة الدخول للضرر،
   * وليس Projectile مباشرة.
   */
  damageEnemy(enemy, amount) {
    if (
      !enemy ||
      !enemy.alive
    ) {
      return null;
    }

    if (
      typeof amount !== "number" ||
      !Number.isFinite(amount) ||
      amount < 0
    ) {
      console.error(
        "EnemyManager: invalid damage amount.",
        amount
      );

      return null;
    }

    const result =
      enemy.takeDamage(
        amount
      );

    if (!result) {
      return null;
    }

    if (result.killed) {
      this._handleEnemyDeath(
        enemy
      );

      return result;
    }

    this._emit(
      "EnemyDamaged",
      {
        enemyId: enemy.id,
        type: enemy.type,
        amount,
        result,
      }
    );

    return result;
  },

  /**
   * الحصول على جميع الأعداء
   * الذين ما زالوا صالحين للاستهداف.
   */
  getAliveEnemies() {
    return this.enemies.filter(
      (enemy) =>
        enemy.alive &&
        !enemy.reachedBase
    );
  },

  /**
   * الحصول على أقرب عدو إلى القاعدة.
   */
  getClosestEnemyToBase() {
    const alive =
      this.getAliveEnemies();

    if (
      alive.length === 0
    ) {
      return null;
    }

    let closest =
      alive[0];

    for (const enemy of alive) {
      if (
        enemy.pathDistance >
        closest.pathDistance
      ) {
        closest = enemy;
      }
    }

    return closest;
  },

  /**
   * معالجة موت العدو.
   *
   * لا يتم تعديل GameState هنا.
   * يتم إرسال النتيجة عبر EventBus.
   */
  _handleEnemyDeath(enemy) {
    if (!enemy) {
      return;
    }

    if (enemy.reachedBase) {
      return;
    }

    /*
     * منع إرسال EnemyDied أكثر من مرة
     * لنفس العدو.
     */
    if (
      enemy._enemyManagerDeathHandled
    ) {
      return;
    }

    enemy._enemyManagerDeathHandled =
      true;

    const reward =
      Math.max(
        0,
        Number(enemy.reward) || 0
      );

    enemy.die();

    this._emit(
      "EnemyDied",
      {
        enemyId: enemy.id,
        type: enemy.type,
        reward,
      }
    );
  },

  /**
   * إرسال حدث بأمان.
   */
  _emit(eventName, payload) {
    if (
      typeof EventBus === "undefined"
    ) {
      console.error(
        `EnemyManager: EventBus is not available for "${eventName}".`
      );

      return false;
    }

    EventBus.emit(
      eventName,
      payload
    );

    return true;
  },

  /**
   * إزالة الأعداء المنتهية دورة حياتهم.
   */
  _cleanupDeadEnemies() {
    const remaining = [];

    for (const enemy of this.enemies) {
      if (enemy.alive) {
        remaining.push(
          enemy
        );

        continue;
      }

      enemy.destroy();
    }

    this.enemies =
      remaining;
  },

  /**
   * تنظيف النظام بالكامل.
   */
  clear() {
    for (const enemy of this.enemies) {
      enemy.destroy();
    }

    this.enemies = [];
  },
};
