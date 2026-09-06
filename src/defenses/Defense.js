/**
 * Defense.js
 * ----------
 * المرحلة 8 — Defense Base (قسم 138 بالمواصفات).
 *
 * يمثل دفاعًا واحدًا موضوعًا على الجزيرة.
 *
 * مسؤول عن:
 *  - نموذجه البصري (Prototype هندسي بسيط — سيُستبدل لاحقًا بمرحلة
 *    الرسوم النهائية، قسم 18/148).
 *  - إيجاد هدف ضمن مداه (Targeting — قسم 20).
 *  - تدوير البرج نحو الهدف.
 *  - إطلاق مقذوف عند جاهزية زمن إعادة التحميل (Fire Rate) — يُنفَّذ
 *    فعليًا عبر ProjectileManager (المرحلة 9 — Combat).
 *
 * لا يحتوي على منطق وضع/تكلفة/تحقق مكان — تلك مسؤولية DefenseManager
 * (نفس فلسفة فصل Enemy عن EnemyManager بالمرحلة 6).
 */

class Defense {
  constructor(data = {}) {
    this.id =
      data.id ||
      `defense_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

    this.typeId = data.typeId || "cannon";

    const T =
      CONFIG.DEFENSES.TYPES[this.typeId];

    this.name = T.name;

    this.damage = T.damage;
    this.critChance = T.critChance;
    this.critMultiplier = T.critMultiplier;

    this.range = T.range;
    this.worldRangeMultiplier = 1;
    this.fireRate = T.fireRate;

    this.targeting = T.targeting || "first";

    this.projectileSpeed = T.projectileSpeed;
    this.projectileColor = T.projectileColor;

    this.x = data.x;
    this.z = data.z;

    this._cooldown = 0;
    this.target = null;

    this.model = null;
    this._turret = null;
    this._muzzle = null;

    this._buildModel(T);
  }

  // =========================================================
  // PROTOTYPE MODEL
  // =========================================================

  _buildModel(T) {
    const group =
      new THREE.Group();

    // -------------------------
    // Base
    // -------------------------

    const baseGeometry =
      new THREE.CylinderGeometry(
        0.55,
        0.65,
        0.5,
        10
      );

    const baseMaterial =
      new THREE.MeshStandardMaterial({
        color: T.baseColor,
        flatShading: true,
        roughness: 0.85,
      });

    const base =
      new THREE.Mesh(
        baseGeometry,
        baseMaterial
      );

    base.position.y = 0.25;

    base.castShadow = true;
    base.receiveShadow = true;

    group.add(base);

    // -------------------------
    // Turret (يدور نحو الهدف)
    // -------------------------

    const turretGroup =
      new THREE.Group();

    turretGroup.position.y = 0.55;

    group.add(turretGroup);

    const turretGeometry =
      new THREE.SphereGeometry(
        0.32,
        10,
        8
      );

    const turretMaterial =
      new THREE.MeshStandardMaterial({
        color: T.turretColor,
        flatShading: true,
        roughness: 0.6,
      });

    const turret =
      new THREE.Mesh(
        turretGeometry,
        turretMaterial
      );

    turret.castShadow = true;

    turretGroup.add(turret);

    // -------------------------
    // Barrel
    // -------------------------

    const barrelLength =
      T.barrelLength || 0.9;

    const barrelGeometry =
      new THREE.CylinderGeometry(
        0.09,
        0.11,
        barrelLength,
        8
      );

    const barrelMaterial =
      new THREE.MeshStandardMaterial({
        color: T.barrelColor,
        flatShading: true,
        roughness: 0.5,
      });

    const barrel =
      new THREE.Mesh(
        barrelGeometry,
        barrelMaterial
      );

    barrel.rotation.x =
      Math.PI / 2;

    barrel.position.z =
      barrelLength / 2;

    barrel.castShadow = true;

    turretGroup.add(barrel);

    // نقطة إطلاق المقذوف (طرف الماسورة) — Object3D فارغ لقراءة
    // موقعه العالمي بسهولة عند كل طلقة.
    const muzzle =
      new THREE.Object3D();

    muzzle.position.z =
      barrelLength;

    turretGroup.add(muzzle);

    // -------------------------
    // Metadata
    // -------------------------

    group.userData.owner =
      "defense";

    group.userData.defenseId =
      this.id;

    group.position.set(
      this.x,
      CONFIG.DEFENSES.GROUND_Y,
      this.z
    );

    this.model = group;
    this._turret = turretGroup;
    this._muzzle = muzzle;
  }

  getObject() {
    return this.model;
  }

  // =========================================================
  // UPDATE
  // =========================================================

  update(delta) {
    this._cooldown -=
      delta;

    if (
      !this._isTargetValid(
        this.target
      )
    ) {
      this.target =
        this._acquireTarget();
    }

    if (!this.target) {
      return;
    }

    this._faceTarget(
      this.target
    );

    if (this._cooldown <= 0) {
      this._fire(
        this.target
      );

      this._cooldown =
        1 / this.fireRate;
    }
  }

  // =========================================================
  // TARGETING (قسم 20 بالمواصفات)
  // =========================================================

  _isTargetValid(enemy) {
    if (
      !enemy ||
      !enemy.alive ||
      enemy.reachedBase ||
      !enemy.model
    ) {
      return false;
    }

    return (
      this._distanceTo(
        enemy.model.position
      ) <= (this.range * this.worldRangeMultiplier)
    );
  }

  /**
   * يبحث عن هدف ضمن المدى حسب استراتيجية الاستهداف.
   * "first" (الوحيدة المُفعَّلة حاليًا): أقرب عدو لوصول القاعدة،
   * أي الأكبر بـpathDistance ضمن الأعداء الموجودين بالمدى.
   */
  _acquireTarget() {
    const candidates =
      EnemyManager.getAliveEnemies().filter(
        (enemy) =>
          enemy.model &&
          this._distanceTo(
            enemy.model.position
          ) <= (this.range * this.worldRangeMultiplier)
      );

    if (candidates.length === 0) {
      return null;
    }

    candidates.sort(
      (a, b) =>
        b.pathDistance -
        a.pathDistance
    );

    return candidates[0];
  }

  _distanceTo(position) {
    return Math.hypot(
      position.x - this.x,
      position.z - this.z
    );
  }

  _faceTarget(enemy) {
    const position =
      enemy.model.position;

    const dx =
      position.x - this.x;

    const dz =
      position.z - this.z;

    this._turret.rotation.y =
      Math.atan2(dx, dz);
  }

  // =========================================================
  // ATTACK (يُنفَّذ فعليًا بالمرحلة 9 — COMBAT)
  // =========================================================

  _fire(enemy) {
    const isCrit =
      Math.random() <
      this.critChance;

    const amount = isCrit
      ? Math.round(
          this.damage *
            this.critMultiplier
        )
      : this.damage;

    const muzzleWorldPosition =
      new THREE.Vector3();

    this._muzzle.getWorldPosition(
      muzzleWorldPosition
    );

    ProjectileManager.spawn({
      from: {
        x: muzzleWorldPosition.x,
        y: muzzleWorldPosition.y,
        z: muzzleWorldPosition.z,
      },

      targetEnemy: enemy,

      speed: this.projectileSpeed,
      damage: amount,
      isCrit,
      color: this.projectileColor,
    });
  }

  // =========================================================
  // CLEANUP
  // =========================================================

  destroy() {
    if (
      this.model &&
      this.model.parent
    ) {
      this.model.parent.remove(
        this.model
      );
    }

    this.model = null;
  }
}
