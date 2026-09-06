/**
 * Projectile.js
 * -------------
 * المرحلة 9 — Combat System (قسم 139 بالمواصفات): Projectiles + Damage +
 * Critical.
 *
 * مقذوف واحد يتحرك (Homing بسيط: يعيد حساب اتجاهه نحو الموضع الحالي للهدف
 * كل إطار) من نقطة الإطلاق حتى يصطدم بهدفه، ثم يمرر نتيجة الإصابة عبر
 * CombatSystem — وهو حد القتال المسؤول عن تسليم الضرر إلى نظام الأعداء.
 *
 * إذا اختفى الهدف قبل الإصابة (مات بمقذوف آخر، أو وصل القاعدة)، يختفي
 * المقذوف بصمت بلا ضرر (Miss) — سلوك مقصود، ليس خطأ.
 */

class Projectile {
  constructor(data = {}) {
    this.speed = data.speed ?? 14;
    this.damage = data.damage ?? 0;
    this.isCrit = !!data.isCrit;

    this.targetEnemy = data.targetEnemy || null;

    this.color = data.color ?? 0xffcf5c;

    this.alive = true;

    this.position =
      new THREE.Vector3(
        data.from?.x ?? 0,
        data.from?.y ?? 0,
        data.from?.z ?? 0
      );

    this.model = null;

    this._buildModel();
  }

  // =========================================================
  // PROTOTYPE MODEL
  // =========================================================

  _buildModel() {
    const geometry =
      new THREE.SphereGeometry(
        CONFIG.COMBAT.PROJECTILE_RADIUS,
        8,
        6
      );

    const material =
      new THREE.MeshStandardMaterial({
        color: this.color,
        emissive: this.color,
        emissiveIntensity: this.isCrit
          ? 0.9
          : 0.5,
      });

    const mesh =
      new THREE.Mesh(
        geometry,
        material
      );

    mesh.position.copy(
      this.position
    );

    this.model = mesh;
  }

  getObject() {
    return this.model;
  }

  // =========================================================
  // UPDATE
  // =========================================================

  update(delta) {
    if (!this.alive) {
      return;
    }

    if (!this._isTargetAlive()) {
      // الهدف اختفى قبل الإصابة — Miss صامت، بلا ضرر.
      this.alive = false;
      return;
    }

    const targetPosition =
      this.targetEnemy.model.position;

    const dx =
      targetPosition.x - this.position.x;

    const dy =
      targetPosition.y +
      0.5 -
      this.position.y;

    const dz =
      targetPosition.z - this.position.z;

    const distance =
      Math.sqrt(
        dx * dx + dy * dy + dz * dz
      );

    const safeDelta =
      Math.max(
        0,
        Math.min(delta, 0.1)
      );

    const step =
      this.speed * safeDelta;

    if (
      distance <=
      Math.max(
        step,
        CONFIG.COMBAT.HIT_DISTANCE
      )
    ) {
      this._hit();
      return;
    }

    this.position.x +=
      (dx / distance) * step;

    this.position.y +=
      (dy / distance) * step;

    this.position.z +=
      (dz / distance) * step;

    this.model.position.copy(
      this.position
    );
  }

  _isTargetAlive() {
    const enemy = this.targetEnemy;

    return !!(
      enemy &&
      enemy.alive &&
      !enemy.reachedBase &&
      enemy.model
    );
  }

  _hit() {
    this.alive = false;

    CombatSystem.resolveProjectileHit(
      this.targetEnemy,
      this.damage
    );
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
