/**
 * DefenseMap.js
 * -------------
 * المرحلة 5 بالمواصفات (قسم 135) — DEFENSE MAP.
 * هذه المرحلة بصرية/تركيبية بالكامل: مسار الأعداء المستقبلي + نقطة ظهورهم +
 * قاعدة اللاعب + مناطق بناء مستقبلية.
 *
 * قرار مسجَّل (طلب صريح من المستخدم): لا يوجد "خانات دفاع" (Slots) بمواقع ثابتة.
 * الدفاعات (مرحلة 8) تُوضع بحرية بأي مكان على الجزيرة، بشرط عدم وضعها فوق مسار
 * الأعداء أو ضمن هامش أمان قريب منه. لذلك DefenseMap لا يبني أي أجسام "خانة"،
 * بل يوفّر isPositionBuildable(x, z) — دالة تحقّق تُستخدم لاحقًا من نظام وضع
 * الدفاعات (مرحلة 8) للتأكد أن المكان المختار بعيد كفاية عن المسار/القاعدة/الظهور.
 *
 * لا يوجد هنا أي منطق أعداء/موجات/قتال/دفاعات فعلية — تلك أنظمة مستقلة قادمة
 * بمراحل لاحقة (6: ENEMIES، 7: WAVES، 8: DEFENSES، 9: COMBAT) ستُبنى فوق هذا الهيكل.
 *
 * مناطق البناء قابلة للنقر (Tap) مثل Interactables، لكنها لا تُجمع ولا تعطي
 * مكافأة — فقط تعرض رسالة توضيحية عبر Toast (قسم 39/158: لا تسرع بميزة غير
 * جاهزة، فقط أظهر أنها موجودة ومكانها).
 */

const DefenseMap = {
  group: null,
  base: null, // { group }
  _spawnRing: null,
  _zoneMeshes: [], // { mesh, kind: 'build', id, _pulseOffset }
  _pathSegments: [], // { ax, az, bx, bz } — لاستخدام isPositionBuildable لاحقًا

  create(scene) {
    this.group = new THREE.Group();

    this._buildPath();
    this._buildSpawnMarker();
    this._buildBase();
    this._buildZones(CONFIG.DEFENSE_MAP.BUILD_ZONES, "build");

    // Subtle tactical grid gives the build field a readable game-board feel.
    const grid = new THREE.GridHelper(34, 34, 0x35627b, 0x173246);
    grid.position.y = D.GROUND_Y + 0.015;
    grid.material.transparent = true; grid.material.opacity = 0.16;
    this.group.add(grid);

    scene.add(this.group);
    return this.group;
  },

  _buildPath() {
    const D = CONFIG.DEFENSE_MAP;
    const points = [D.SPAWN, ...D.PATH_POINTS, D.BASE];
    const mat = new THREE.MeshStandardMaterial({
      color: D.PATH_COLOR,
      flatShading: true,
      roughness: 1,
    });

    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const length = Math.sqrt(dx * dx + dz * dz);

      const geo = new THREE.BoxGeometry(length, D.PATH_HEIGHT, D.PATH_WIDTH);
      const seg = new THREE.Mesh(geo, mat);
      seg.position.set((a.x + b.x) / 2, D.GROUND_Y, (a.z + b.z) / 2);
      seg.rotation.y = -Math.atan2(dz, dx);
      seg.receiveShadow = true;
      this.group.add(seg);

      this._pathSegments.push({ ax: a.x, az: a.z, bx: b.x, bz: b.z });
    }
  },

  _buildSpawnMarker() {
    const D = CONFIG.DEFENSE_MAP;
    const geo = new THREE.RingGeometry(D.SPAWN_RADIUS * 0.55, D.SPAWN_RADIUS, 24);
    const mat = new THREE.MeshStandardMaterial({
      color: D.SPAWN_COLOR,
      emissive: D.SPAWN_COLOR,
      emissiveIntensity: 0.4,
      side: THREE.DoubleSide,
      flatShading: true,
    });
    const ring = new THREE.Mesh(geo, mat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(D.SPAWN.x, D.GROUND_Y + 0.05, D.SPAWN.z);
    this.group.add(ring);
    this._spawnRing = ring;
  },

  _buildBase() {
    const D = CONFIG.DEFENSE_MAP;
    const g = new THREE.Group();

    const wallGeo = new THREE.CylinderGeometry(
      D.BASE_WALL_RADIUS,
      D.BASE_WALL_RADIUS * 1.1,
      D.BASE_WALL_HEIGHT,
      8
    );
    const wallMat = new THREE.MeshStandardMaterial({
      color: D.BASE_WALL_COLOR,
      flatShading: true,
      roughness: 0.9,
    });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.y = D.BASE_WALL_HEIGHT / 2;
    wall.castShadow = true;
    wall.receiveShadow = true;
    g.add(wall);

    const roofGeo = new THREE.ConeGeometry(D.BASE_WALL_RADIUS * 1.15, D.BASE_ROOF_HEIGHT, 8);
    const roofMat = new THREE.MeshStandardMaterial({
      color: D.BASE_ROOF_COLOR,
      flatShading: true,
      roughness: 0.7,
    });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = D.BASE_WALL_HEIGHT + D.BASE_ROOF_HEIGHT / 2;
    roof.castShadow = true;
    g.add(roof);

    g.position.set(D.BASE.x, D.GROUND_Y, D.BASE.z);
    this.group.add(g);
    this.base = { group: g };
  },

  _buildZones(defs, kind) {
    const D = CONFIG.DEFENSE_MAP;
    const color = D.BUILD_ZONE_COLOR;

    for (const def of defs) {
      const geo = new THREE.CylinderGeometry(D.ZONE_RADIUS, D.ZONE_RADIUS, D.ZONE_HEIGHT, 20);
      const mat = new THREE.MeshStandardMaterial({
        color,
        transparent: true,
        opacity: 0.6,
        roughness: 0.8,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(def.x, D.GROUND_Y + D.ZONE_HEIGHT / 2, def.z);
      mesh.userData.owner = "defenseMap";
      mesh.userData.zoneKind = kind;
      mesh.userData.zoneId = def.id;
      this.group.add(mesh);

      this._zoneMeshes.push({
        mesh,
        kind,
        id: def.id,
        _pulseOffset: Math.random() * Math.PI * 2,
      });
    }
  },

  // أقصر مسافة من نقطة (px, pz) إلى قطعة مستقيمة (ax,az)-(bx,bz).
  _distanceToSegment(px, pz, ax, az, bx, bz) {
    const dx = bx - ax;
    const dz = bz - az;
    const lenSq = dx * dx + dz * dz;
    let t = lenSq === 0 ? 0 : ((px - ax) * dx + (pz - az) * dz) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const closestX = ax + t * dx;
    const closestZ = az + t * dz;
    return Math.hypot(px - closestX, pz - closestZ);
  },

  // هل يمكن وضع دفاع بهذه النقطة؟ يُستخدم من نظام وضع الدفاعات (مرحلة 8).
  // ممنوع: فوق/قرب المسار (PATH_EXCLUSION_RADIUS)، فوق نقطة الظهور، فوق القاعدة.
  isPositionBuildable(x, z) {
    const D = CONFIG.DEFENSE_MAP;

    for (const seg of this._pathSegments) {
      const dist = this._distanceToSegment(x, z, seg.ax, seg.az, seg.bx, seg.bz);
      if (dist < D.PATH_EXCLUSION_RADIUS) return false;
    }

    const distToSpawn = Math.hypot(x - D.SPAWN.x, z - D.SPAWN.z);
    if (distToSpawn < D.SPAWN_RADIUS + 1) return false;

    const distToBase = Math.hypot(x - D.BASE.x, z - D.BASE.z);
    if (distToBase < D.BASE_WALL_RADIUS + 1) return false;

    // Phase 13 — special map rules are an additional world-owned boundary.
    if (typeof AdvancedWorldSystem !== "undefined" &&
        typeof AdvancedWorldSystem.canBuildAt === "function" &&
        !AdvancedWorldSystem.canBuildAt(x, z)) return false;

    return true;
  },

  update(elapsed) {
    const D = CONFIG.DEFENSE_MAP;

    if (this._spawnRing) {
      this._spawnRing.rotation.z += D.SPAWN_SPIN_SPEED * (1 / 60);
      const s = 1 + Math.sin(elapsed * D.SPAWN_PULSE_SPEED) * 0.08;
      this._spawnRing.scale.set(s, s, 1);
    }

    for (const z of this._zoneMeshes) {
      const s = 1 + Math.sin(elapsed * D.ZONE_PULSE_SPEED + z._pulseOffset) * D.ZONE_PULSE_SCALE;
      z.mesh.scale.set(s, 1, s);
    }
  },

  // تُستخدم من InteractionController للـ Raycasting — مناطق البناء فقط.
  getInteractableMeshes() {
    return this._zoneMeshes.map((z) => z.mesh);
  },

  // يُستدعى عند نقر مؤكد على منطقة بناء. لا مكافأة، فقط رسالة توضيحية.
  interact(mesh) {
    const entry = this._zoneMeshes.find((z) => z.mesh === mesh);
    if (!entry) return null;

    return { message: "منطقة بناء — البناء قادم قريبًا 🏗️" };
  },
};
