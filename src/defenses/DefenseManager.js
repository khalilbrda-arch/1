/**
 * DefenseManager.js
 * -----------------
 * المرحلة 8 — Defense Manager + Placement (قسم 138 بالمواصفات).
 *
 * مسؤول عن:
 *  - وضع الدفاعات (Tap-to-Place).
 *  - التحقق من صلاحية المكان.
 *  - طلب المعاملة الاقتصادية عبر EconomySystem.
 *  - الاحتفاظ بالدفاعات الموضوعة وتحديثها كل إطار.
 *
 * Phase 4:
 *  - DataContracts تتحقق من تعريف الدفاع قبل استخدامه.
 *  - DefenseManager هو حدود دخول تعريف الدفاع إلى نظام التشغيل.
 *  - EconomySystem هو حدود التعامل مع العملة.
 *  - لا يملك تعريفات المحتوى الثابتة.
 *
 * ملاحظة:
 * EconomySystem يملك الرصيد أثناء التشغيل، وDefenseManager لا يتعامل
 * مع GameState أو التخزين مباشرة.
 */

const DefenseManager = {
  scene: null,
  group: null,

  defenses: [],
  nextId: 1,

  initialized: false,

  // وضع البناء الحالي.
  isPlacing: false,
  _placingTypeId: null,

  _groundPlane: null,

  init(scene) {
    this.scene = scene;

    this.group =
      new THREE.Group();

    this.defenses = [];
    this.nextId = 1;

    this.isPlacing = false;
    this._placingTypeId = null;

    this._groundPlane =
      new THREE.Plane(
        new THREE.Vector3(0, 1, 0),
        -CONFIG.DEFENSES.GROUND_Y
      );

    scene.add(this.group);

    this.initialized = true;

    DefenseUI.init();

    return this.group;
  },

  // =========================================================
  // PLACEMENT MODE
  // =========================================================

  startPlacement(typeId) {
    if (
      typeof DataContracts === "undefined"
    ) {
      console.error(
        "DefenseManager: DataContracts is not available."
      );

      return;
    }

    const definition =
      CONFIG.DEFENSES.TYPES[typeId];

    if (
      !definition
    ) {
      return;
    }

    if (
      !DataContracts.validateDefenseDefinition(
        definition
      )
    ) {
      console.error(
        "DefenseManager: invalid defense definition.",
        definition
      );

      return;
    }

    if (
      typeof ProgressionSystem !== "undefined" &&
      typeof ProgressionSystem.isUnlocked === "function" &&
      !ProgressionSystem.isUnlocked("defenses", typeId)
    ) {
      if (typeof Toast !== "undefined" && typeof Toast.showMessage === "function") {
        Toast.showMessage("هذا الدفاع غير مفتوح بعد.");
      }
      return;
    }

    this.isPlacing = true;
    this._placingTypeId = typeId;

    DefenseUI.setPlacingState(
      true,
      definition
    );
  },

  cancelPlacement() {
    this.isPlacing = false;
    this._placingTypeId = null;

    DefenseUI.setPlacingState(
      false,
      null
    );
  },

  /**
   * يحوّل نقرة الشاشة إلى نقطة أرضية (x, z).
   */
  getGroundIntersection(raycaster) {
    const point =
      new THREE.Vector3();

    const hit =
      raycaster.ray.intersectPlane(
        this._groundPlane,
        point
      );

    if (!hit) {
      return null;
    }

    return {
      x: point.x,
      z: point.z,
    };
  },

  /**
   * محاولة وضع الدفاع الحالي عند (x, z).
   */
  attemptPlace(x, z) {
    if (
      !this.isPlacing ||
      !this._placingTypeId
    ) {
      return;
    }

    const T =
      CONFIG.DEFENSES.TYPES[
        this._placingTypeId
      ];

    if (!T) {
      console.error(
        "DefenseManager: selected defense type does not exist.",
        this._placingTypeId
      );

      this.cancelPlacement();

      return;
    }

    if (
      typeof DataContracts === "undefined"
    ) {
      console.error(
        "DefenseManager: DataContracts is not available."
      );

      this.cancelPlacement();

      return;
    }

    if (
      !DataContracts.validateDefenseDefinition(
        T
      )
    ) {
      console.error(
        "DefenseManager: invalid defense definition.",
        T
      );

      this.cancelPlacement();

      return;
    }

    if (
      !DefenseMap.isPositionBuildable(
        x,
        z
      )
    ) {
      Toast.showMessage(
        "لا يمكن البناء هنا — قريب جدًا من مسار الأعداء ⛔"
      );

      return;
    }

    if (
      this._isOverlapping(
        x,
        z
      )
    ) {
      Toast.showMessage(
        "يوجد دفاع آخر بهذا المكان بالفعل ⛔"
      );

      return;
    }

    if (
      typeof EconomySystem === "undefined"
    ) {
      console.error(
        "DefenseManager: EconomySystem is not available."
      );

      return;
    }

    if (
      !EconomySystem.canAfford(
        T.cost
      )
    ) {
      Toast.showMessage(
        "الذهب غير كافٍ 🪙"
      );

      return;
    }

    if (
      !EconomySystem.spend(
        T.cost
      )
    ) {
      Toast.showMessage(
        "تعذر إتمام عملية الدفع ⛔"
      );

      return;
    }

    const defense =
      new Defense({
        id:
          `defense_${this.nextId++}`,

        typeId:
          this._placingTypeId,

        x,
        z,
      });

    this.defenses.push(
      defense
    );

    this.group.add(
      defense.getObject()
    );

    if (typeof EventBus !== "undefined" && EventBus && typeof EventBus.emit === "function") {
      EventBus.emit("DefensePlaced", {
        defenseId: defense.id,
        typeId: defense.typeId,
        x: defense.x,
        z: defense.z,
      });
    }

    Toast.showMessage(
      `${T.name} تم وضعه ✅`
    );

    this.cancelPlacement();
  },

  /**
   * إعادة بناء دفاع محفوظ مسبقًا (Phase 5 — Save/Reload).
   *
   * لا يمر عبر placement mode ولا عبر EconomySystem (التكلفة
   * دُفعت مسبقًا قبل الحفظ) ولا عبر فحوصات isPositionBuildable/
   * overlap (الموقع كان صالحًا وقت الوضع الأصلي). هذا مسار استعادة
   * فقط، منفصل تمامًا عن confirmPlacement أعلاه.
   *
   * يُستدعى من SaveManager.applyToDefenseManager() بعد init().
   */
  restoreDefense(data) {
    if (!this.initialized) {
      console.error(
        "DefenseManager: restoreDefense() called before init()."
      );

      return null;
    }

    const typeId = data && data.typeId;

    const T =
      typeId && CONFIG.DEFENSES.TYPES[typeId];

    if (!T) {
      console.error(
        "DefenseManager: restoreDefense() — unknown defense type, skipping.",
        typeId
      );

      return null;
    }

    const id =
      (data && String(data.id)) ||
      `defense_${this.nextId++}`;

    // يحافظ على nextId متقدمًا كي لا تتصادم الدفاعات الجديدة مع
    // معرّفات مستعادة من نمط "defense_<n>".
    const match = /^defense_(\d+)$/.exec(id);

    if (match) {
      const numericId = Number(match[1]) + 1;

      if (numericId > this.nextId) {
        this.nextId = numericId;
      }
    }

    const defense = new Defense({
      id,
      typeId,
      x: Number(data.x) || 0,
      z: Number(data.z) || 0,
    });

    this.defenses.push(defense);

    this.group.add(defense.getObject());

    return defense;
  },

  _isOverlapping(x, z) {
    const minDistance =
      CONFIG.DEFENSES.MIN_DISTANCE_BETWEEN;

    return this.defenses.some(
      (defense) =>
        Math.hypot(
          defense.x - x,
          defense.z - z
        ) < minDistance
    );
  },

  // =========================================================
  // UPDATE
  // =========================================================

  update(delta) {
    if (!this.initialized) {
      return;
    }

    for (const defense of this.defenses) {
      defense.update(delta);
    }
  },

  getDefenses() {
    return this.defenses;
  },

  // =========================================================
  // CLEANUP
  // =========================================================

  clear() {
    for (const defense of this.defenses) {
      defense.destroy();
    }

    this.defenses = [];
  },
};
