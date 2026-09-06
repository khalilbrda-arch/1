/**
 * Enemy.js
 * --------
 * المرحلة 6 — Enemy Base.
 *
 * يمثل عدوًا واحدًا.
 *
 * ملاحظة:
 * المشروع يستخدم Three.js r128،
 * لذلك لا نستخدم CapsuleGeometry لأنها غير متوفرة
 * في الإصدار الموجود بالمشروع.
 *
 * النموذج الحالي Prototype فقط.
 * سيتم استبداله بالنموذج النهائي في مرحلة الـVisual Overhaul.
 */

class Enemy {
  constructor(data = {}) {
    this.id =
      data.id ||
      `enemy_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

    this.name =
      data.name || "Basic Enemy";

    this.type =
      data.type || "basic";

    this.maxHp =
      data.maxHp ?? 20;

    this.hp =
      data.hp ?? this.maxHp;

    this.speed =
      data.speed ?? 2.2;

    this.armor =
      data.armor ?? 0;

    this.resistance =
      data.resistance ?? 0;

    this.damage =
      data.damage ?? 10;

    this.isBoss = data.isBoss === true;
    this.bossId = data.bossId || null;
    this.bossPhase = data.bossPhase || 0;
    this.damageMultiplier = 1;
    this.speedMultiplier = 1;
    this.worldSpeedMultiplier = 1;

    this.reward =
      data.reward ?? 5;

    this.target =
      data.target || "base";

    this.statusEffects = [];

    this.model = null;

    this.animationState = "walk";

    // المسافة التي قطعها العدو على المسار.
    this.pathDistance = 0;

    this.alive = true;
    this.reachedBase = false;

    this._buildModel();
  }

  // =========================================================
  // PROTOTYPE MODEL
  // =========================================================

  _buildModel() {
    /*
     * لا نستخدم CapsuleGeometry لأن المشروع على Three.js r128.
     *
     * بدلًا منها نصنع جسمًا بسيطًا من:
     * Cylinder + Sphere
     *
     * وهذا مؤقت تمامًا إلى أن نصل إلى مرحلة الرسوم النهائية.
     */

    const group =
      new THREE.Group();

    // -------------------------
    // Body
    // -------------------------

    const bodyGeometry =
      new THREE.CylinderGeometry(
        0.38,
        0.48,
        0.85,
        8
      );

    const bodyMaterial =
      new THREE.MeshStandardMaterial({
        color: 0xd94a4a,
        roughness: 0.8,
        flatShading: true,
      });

    const body =
      new THREE.Mesh(
        bodyGeometry,
        bodyMaterial
      );

    body.position.y = 0.48;

    body.castShadow = true;
    body.receiveShadow = true;

    group.add(body);

    // -------------------------
    // Head
    // -------------------------

    const headGeometry =
      new THREE.SphereGeometry(
        0.42,
        12,
        8
      );

    const headMaterial =
      new THREE.MeshStandardMaterial({
        color: 0xed5a5a,
        roughness: 0.8,
        flatShading: true,
      });

    const head =
      new THREE.Mesh(
        headGeometry,
        headMaterial
      );

    head.position.y = 1.08;

    head.castShadow = true;
    head.receiveShadow = true;

    group.add(head);

    // -------------------------
    // Eyes
    // -------------------------

    const eyeGeometry =
      new THREE.SphereGeometry(
        0.07,
        8,
        6
      );

    const eyeMaterial =
      new THREE.MeshBasicMaterial({
        color: 0x111111,
      });

    const leftEye =
      new THREE.Mesh(
        eyeGeometry,
        eyeMaterial
      );

    const rightEye =
      new THREE.Mesh(
        eyeGeometry,
        eyeMaterial
      );

    leftEye.position.set(
      -0.14,
      1.13,
      0.37
    );

    rightEye.position.set(
      0.14,
      1.13,
      0.37
    );

    group.add(leftEye);
    group.add(rightEye);

    // -------------------------
    // Metadata
    // -------------------------

    group.userData.owner =
      "enemy";

    group.userData.enemyId =
      this.id;

    group.userData.enemy =
      this;

    this.model = group;
  }

  // =========================================================
  // OBJECT
  // =========================================================

  getObject() {
    return this.model;
  }

  // =========================================================
  // UPDATE
  // =========================================================

  update(delta) {
    if (
      !this.alive ||
      this.reachedBase
    ) {
      return;
    }

    const safeDelta =
      Math.max(
        0,
        Math.min(delta, 0.1)
      );

    // المرحلة 9 — Status Effects (قسم 139): يُطبَّق أي تأثير حالة نشط
    // (مثل سم يُنقص HP دوريًا) قبل الحركة. قد يقتل العدو هذا الإطار.
    this._updateStatusEffects(safeDelta);

    if (!this.alive) {
      return;
    }

    this.pathDistance +=
      this.speed *
      this.getSpeedMultiplier() *
      this.speedMultiplier *
      this.worldSpeedMultiplier *
      safeDelta;

    const totalLength =
      EnemyPath.getTotalLength();

    if (
      this.pathDistance >=
      totalLength
    ) {
      this.pathDistance =
        totalLength;

      this.reachedBase = true;

      this.animationState =
        "attack";

      this._updateTransform();

      return;
    }

    this._updateTransform();
  }

  // =========================================================
  // TRANSFORM
  // =========================================================

  _updateTransform() {
    if (!this.model) {
      return;
    }

    const position =
      EnemyPath.getPositionAtDistance(
        this.pathDistance
      );

    const direction =
      EnemyPath.getDirectionAtDistance(
        this.pathDistance
      );

    /*
     * الأرض = Y 2
     *
     * العدو يقف فوق الأرض،
     * لذلك نرفع النموذج قليلًا.
     */
    this.model.position.set(
      position.x,
      position.y,
      position.z
    );

    if (
      Math.abs(direction.x) > 0.001 ||
      Math.abs(direction.z) > 0.001
    ) {
      this.model.rotation.y =
        Math.atan2(
          direction.x,
          direction.z
        );
    }
  }

  // =========================================================
  // STATUS EFFECTS (المرحلة 9 — قسم 23/139)
  // =========================================================
  //
  // بنية عامة فقط بهذه المرحلة — لا يوجد بعد أي دفاع يستدعي applyStatus
  // ("cannon" ضرر مباشر بلا عنصر). جاهزة لأنواع دفاعات مستقبلية
  // (Freeze Tower → "slow"، Poison Tower → "poison") دون أي تعديل هنا.

  /**
   * إضافة/تجديد تأثير حالة.
   * type: "slow" (value = نسبة إبطاء 0..1) أو "poison" (value = ضرر/ثانية).
   */
  applyStatus(type, opts = {}) {
    if (!this.alive) {
      return;
    }

    const duration =
      Math.max(0, Number(opts.duration) || 0);

    const value =
      Number(opts.value) || 0;

    const existing =
      this.statusEffects.find(
        (effect) => effect.type === type
      );

    if (existing) {
      existing.duration =
        Math.max(existing.duration, duration);

      existing.value = value;
    } else {
      this.statusEffects.push({
        type,
        value,
        duration,
      });
    }
  }

  _updateStatusEffects(delta) {
    if (this.statusEffects.length === 0) {
      return;
    }

    const remaining = [];

    for (const effect of this.statusEffects) {
      effect.duration -= delta;

      if (effect.type === "poison") {
        const tick = effect.value * delta;

        this.hp =
          Math.max(0, this.hp - tick);

        if (this.hp <= 0 && this.alive) {
          this.die();
        }
      }

      if (effect.duration > 0) {
        remaining.push(effect);
      }
    }

    this.statusEffects = remaining;
  }

  /**
   * مضاعف السرعة الحالي بسبب تأثيرات الإبطاء ("slow"). 1 = بلا تأثير.
   */
  getSpeedMultiplier() {
    const slow =
      this.statusEffects.find(
        (effect) => effect.type === "slow"
      );

    if (!slow) {
      return 1;
    }

    return Math.max(0.2, 1 - slow.value);
  }

  // =========================================================
  // DAMAGE
  // =========================================================

  takeDamage(amount) {
    if (!this.alive) {
      return {
        killed: false,
        damage: 0,
        remainingHp: 0,
      };
    }

    const rawDamage =
      Math.max(
        0,
        Number(amount) || 0
      );

    /*
     * Armor يقلل الضرر.
     *
     * أقل ضرر فعلي = 1
     * حتى لا يصبح العدو غير قابل للقتل
     * بسبب Armor في الأنظمة المستقبلية.
     */
    const effectiveDamage =
      Math.max(
        1,
        rawDamage * this.damageMultiplier - this.armor
      );

    this.hp =
      Math.max(
        0,
        this.hp - effectiveDamage
      );

    if (
      this.hp <= 0
    ) {
      this.die();

      return {
        killed: true,
        damage: effectiveDamage,
        remainingHp: 0,
      };
    }

    return {
      killed: false,
      damage: effectiveDamage,
      remainingHp: this.hp,
    };
  }

  // =========================================================
  // DEATH
  // =========================================================

  die() {
    if (!this.alive) {
      return;
    }

    this.alive = false;

    this.animationState =
      "death";
  }

  // =========================================================
  // HP
  // =========================================================

  getHpRatio() {
    if (
      this.maxHp <= 0
    ) {
      return 0;
    }

    return (
      this.hp /
      this.maxHp
    );
  }

  // =========================================================
  // BASE
  // =========================================================

  hasReachedBase() {
    return this.reachedBase;
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
