/**
 * Interactables.js
 * ----------------
 * صناديق الكنوز وعقد الموارد الموجودة على الخريطة.
 *
 * كل العناصر ظاهرة منذ البداية.
 * لا يوجد Exploration أو Fog of War.
 *
 * لا يعتمد مباشرة على GameState (قاعدة معمارية يفرضها
 * tests/phase4-architecture-audit.test.js — GameState يُقرأ/يُكتَب
 * حصرًا من Game.js). بدل ذلك:
 * - create() يستقبل قائمة الكنوز المفتوحة مسبقًا كمُعامل بيانات
 *   عادي (Game.js هو من يقرأها من GameState.interactions.openedIds
 *   ويمررها هنا)، حتى لا تظهر كنوز جُمعت في جلسة سابقة من جديد بعد
 *   إعادة تحميل الصفحة.
 * - عند الجمع، تُطلَق InteractableConsumed عبر EventBus كما كان،
 *   وGame.js هو من يسجّلها في GameState (Phase 5 — Save/Reload).
 *
 * الحالة المحلية للتفاعل:
 * Interactables
 *   ↓
 * EventBus
 *   ↓
 * Game
 *
 * الحدث:
 * InteractableConsumed
 */

const Interactables = {
  group: null,

  _entries: [],

  _openedIds: new Set(),

  create(scene, alreadyOpenedIds = []) {
    this.group = new THREE.Group();

    this._entries = [];

    // نبدأ من الكنوز المفتوحة فعليًا سابقًا (Game.js يمرّرها هنا من
    // GameState.interactions.openedIds المُستعادة من الحفظ) بدل
    // البدء دائمًا من صفر — وإلا فإن أي كنز جُمع في جلسة سابقة يظهر
    // من جديد كقابل للجمع بعد كل إعادة تحميل.
    this._openedIds = new Set(
      Array.isArray(alreadyOpenedIds)
        ? alreadyOpenedIds
        : []
    );

    const C =
      CONFIG.INTERACTABLES;

    for (const def of C.CHESTS) {
      this._spawn(
        def,
        "chest"
      );
    }

    for (const def of C.RESOURCES) {
      this._spawn(
        def,
        "resource"
      );
    }

    scene.add(this.group);

    return this.group;
  },

  _spawn(def, type) {
    if (
      this._openedIds.has(
        def.id
      )
    ) {
      return;
    }

    const C =
      CONFIG.INTERACTABLES;

    const isChest =
      type === "chest";

    const size = isChest
      ? C.CHEST_SIZE
      : C.RESOURCE_SIZE;

    const color = isChest
      ? C.CHEST_COLOR
      : C.RESOURCE_COLOR;

    const geo = isChest
      ? new THREE.BoxGeometry(
          size,
          size * 0.8,
          size * 0.7
        )
      : new THREE.OctahedronGeometry(
          size,
          0
        );

    const mat =
      new THREE.MeshStandardMaterial({
        color,
        flatShading: true,
        roughness: 0.6,
        metalness: 0.1,
      });

    const mesh =
      new THREE.Mesh(
        geo,
        mat
      );

    mesh.position.set(
      def.x,
      C.GROUND_Y +
        size * 0.5,
      def.z
    );

    mesh.castShadow = true;

    mesh.userData.owner =
      "interactables";

    mesh.userData.interactableId =
      def.id;

    this.group.add(mesh);

    this._entries.push({
      id: def.id,

      type,

      mesh,

      reward: def.reward,

      collected: false,

      _bobOffset:
        Math.random() *
        Math.PI *
        2,

      _baseY:
        mesh.position.y,
    });
  },

  update(elapsed) {
    const C =
      CONFIG.INTERACTABLES;

    for (
      const entry of this._entries
    ) {
      if (entry.collected) {
        continue;
      }

      entry.mesh.position.y =
        entry._baseY +
        Math.sin(
          elapsed *
            C.BOB_SPEED +
            entry._bobOffset
        ) *
        C.BOB_HEIGHT;

      entry.mesh.rotation.y +=
        C.SPIN_SPEED *
        (1 / 60);
    }
  },

  getLiveMeshes() {
    return this._entries
      .filter(
        entry =>
          !entry.collected
      )
      .map(
        entry =>
          entry.mesh
      );
  },

  interact(mesh) {
    const entry =
      this._entries.find(
        entry =>
          entry.mesh === mesh
      );

    if (
      !entry ||
      entry.collected
    ) {
      return null;
    }

    if (
      this._openedIds.has(
        entry.id
      )
    ) {
      return null;
    }

    if (
      typeof EconomySystem ===
      "undefined"
    ) {
      console.error(
        "Interactables: EconomySystem is not available."
      );

      return null;
    }

    this._openedIds.add(
      entry.id
    );

    entry.collected = true;

    EconomySystem.add(
      entry.reward
    );

    if (
      typeof EventBus !==
      "undefined"
    ) {
      EventBus.emit(
        "InteractableConsumed",
        {
          id: entry.id,
          type: entry.type,
          reward: entry.reward,
        }
      );
    }

    this.group.remove(
      entry.mesh
    );

    return {
      id: entry.id,

      type: entry.type,

      reward: entry.reward,
    };
  },
};
