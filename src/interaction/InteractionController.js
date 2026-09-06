/**
 * InteractionController.js
 * -------------------------
 * يربط النقرة بعناصر العالم.
 *
 * يدعم حاليًا:
 *  - الصناديق
 *  - الموارد
 *  - مناطق البناء
 */

const InteractionController = {
  camera: null,

  _raycaster: null,
  _pointer: null,

  init(camera) {
    this.camera = camera;

    this._raycaster =
      new THREE.Raycaster();

    this._pointer =
      new THREE.Vector2();
  },

  update() {
    const tap =
      TouchControls.consumeTap();

    if (!tap) return;

    this._pointer.x =
      (tap.x / window.innerWidth) * 2 - 1;

    this._pointer.y =
      -(tap.y / window.innerHeight) * 2 + 1;

    this._raycaster.setFromCamera(
      this._pointer,
      this.camera
    );

    // -------------------------
    // وضع بناء الدفاعات (المرحلة 8)
    // -------------------------
    //
    // أثناء وضع البناء، أي نقرة تُفسَّر كمحاولة وضع الدفاع الحالي عند
    // نقطة الأرض المقابلة لموقع النقر — لا تتفاعل النقرة مع الصناديق/
    // الموارد/مناطق البناء بهذه الحالة.

    if (DefenseManager.isPlacing) {
      const ground =
        DefenseManager.getGroundIntersection(
          this._raycaster
        );

      if (ground) {
        DefenseManager.attemptPlace(
          ground.x,
          ground.z
        );
      }

      return;
    }

    const candidates = [
      ...Interactables.getLiveMeshes(),
      ...DefenseMap.getInteractableMeshes(),
      ...(typeof AdvancedWorldSystem !== "undefined" ? AdvancedWorldSystem.getInteractableMeshes() : []),
    ];

    if (candidates.length === 0) {
      return;
    }

    const hits =
      this._raycaster.intersectObjects(
        candidates,
        false
      );

    if (hits.length === 0) {
      return;
    }

    const mesh = hits[0].object;

    const owner =
      mesh.userData.owner;

    // -------------------------
    // الصناديق والموارد
    // -------------------------

    if (owner === "interactables") {
      const result =
        Interactables.interact(mesh);

      if (result) {
        Toast.show(result);
      }

      return;
    }

    // -------------------------
    // مناطق البناء
    // -------------------------

    if (owner === "defenseMap") {
      const result =
        DefenseMap.interact(mesh);

      if (result && result.message) {
        Toast.showMessage(
          result.message
        );
      }

      return;
    }

    // -------------------------
    // NPCs / Advanced World (Phase 13)
    // -------------------------
    if (owner === "advancedWorldNpc" && typeof AdvancedWorldSystem !== "undefined") {
      const result = AdvancedWorldSystem.interactNPC(mesh.userData.npcId);
      if (result && result.message) Toast.showMessage(result.message);
      return;
    }
  },
};
