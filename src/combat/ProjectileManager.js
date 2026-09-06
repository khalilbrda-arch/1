/**
 * ProjectileManager.js
 * --------------------
 * المرحلة 9 — Combat System (قسم 139 بالمواصفات).
 *
 * مسؤول عن:
 *  - إنشاء المقذوفات (الواجهة التي يستخدمها Defense._fire()).
 *  - تحديث حركتها كل إطار.
 *  - تنظيف المقذوفات التي انتهت (إصابة أو Miss).
 *
 * لا يحتوي على أي منطق دفاعات أو أعداء — فصل متعمد (نفس فلسفة فصل
 * EnemyPath عن Enemy، وDefense عن DefenseManager).
 */

const ProjectileManager = {
  group: null,

  projectiles: [],

  initialized: false,

  init(scene) {
    this.group =
      new THREE.Group();

    this.projectiles = [];

    scene.add(this.group);

    this.initialized = true;

    return this.group;
  },

  /**
   * إنشاء مقذوف جديد. الواجهة التي يستخدمها Defense._fire().
   */
  spawn(data) {
    if (!this.initialized) {
      return null;
    }

    const projectile =
      new Projectile(data);

    this.projectiles.push(
      projectile
    );

    this.group.add(
      projectile.getObject()
    );

    return projectile;
  },

  update(delta) {
    if (!this.initialized) {
      return;
    }

    for (const projectile of this.projectiles) {
      if (projectile.alive) {
        projectile.update(delta);
      }
    }

    this._cleanupFinished();
  },

  _cleanupFinished() {
    const remaining = [];

    for (const projectile of this.projectiles) {
      if (projectile.alive) {
        remaining.push(projectile);
        continue;
      }

      projectile.destroy();
    }

    this.projectiles = remaining;
  },

  clear() {
    for (const projectile of this.projectiles) {
      projectile.destroy();
    }

    this.projectiles = [];
  },
};
