/**
 * EnemyPath.js
 * ------------
 * المرحلة 6 — Enemy Path System.
 *
 * مسؤول فقط عن:
 *  - تعريف مسار الأعداء.
 *  - حساب موقع العدو على المسار.
 *  - معرفة النقطة التالية.
 *
 * لا يحتوي على AI أو HP أو Damage.
 * هذا الفصل مقصود حسب GAME_SPEC.md.
 */

const EnemyPath = {
  points: [],
  segments: [],
  totalLength: 0,

  init() {
    const D = CONFIG.DEFENSE_MAP;

    this.points = [
      { x: D.SPAWN.x, z: D.SPAWN.z },
      ...D.PATH_POINTS.map((p) => ({
        x: p.x,
        z: p.z,
      })),
      { x: D.BASE.x, z: D.BASE.z },
    ];

    this._buildSegments();
  },

  _buildSegments() {
    this.segments = [];
    this.totalLength = 0;

    for (let i = 0; i < this.points.length - 1; i++) {
      const a = this.points[i];
      const b = this.points[i + 1];

      const dx = b.x - a.x;
      const dz = b.z - a.z;

      const length = Math.hypot(dx, dz);

      this.segments.push({
        index: i,
        ax: a.x,
        az: a.z,
        bx: b.x,
        bz: b.z,
        length,
        startDistance: this.totalLength,
        endDistance: this.totalLength + length,
      });

      this.totalLength += length;
    }
  },

  getSpawnPoint() {
    const p = this.points[0];

    return {
      x: p.x,
      y: CONFIG.DEFENSE_MAP.GROUND_Y,
      z: p.z,
    };
  },

  getBasePoint() {
    const p = this.points[this.points.length - 1];

    return {
      x: p.x,
      y: CONFIG.DEFENSE_MAP.GROUND_Y,
      z: p.z,
    };
  },

  /**
   * الحصول على موضع على المسار بناءً على المسافة المقطوعة.
   */
  getPositionAtDistance(distance) {
    if (this.points.length < 2) {
      return {
        x: 0,
        y: CONFIG.DEFENSE_MAP.GROUND_Y,
        z: 0,
      };
    }

    const d = Math.max(
      0,
      Math.min(distance, this.totalLength)
    );

    for (const segment of this.segments) {
      if (d <= segment.endDistance) {
        const localDistance =
          d - segment.startDistance;

        const t =
          segment.length > 0
            ? localDistance / segment.length
            : 0;

        return {
          x:
            segment.ax +
            (segment.bx - segment.ax) * t,

          y: CONFIG.DEFENSE_MAP.GROUND_Y,

          z:
            segment.az +
            (segment.bz - segment.az) * t,
        };
      }
    }

    const last =
      this.points[this.points.length - 1];

    return {
      x: last.x,
      y: CONFIG.DEFENSE_MAP.GROUND_Y,
      z: last.z,
    };
  },

  /**
   * اتجاه الحركة عند مسافة معينة.
   */
  getDirectionAtDistance(distance) {
    const epsilon = 0.01;

    const a = this.getPositionAtDistance(
      Math.max(0, distance - epsilon)
    );

    const b = this.getPositionAtDistance(
      Math.min(
        this.totalLength,
        distance + epsilon
      )
    );

    const dx = b.x - a.x;
    const dz = b.z - a.z;

    const length = Math.hypot(dx, dz);

    if (length === 0) {
      return { x: 0, z: 1 };
    }

    return {
      x: dx / length,
      z: dz / length,
    };
  },

  getTotalLength() {
    return this.totalLength;
  },

  isAtBase(distance) {
    return distance >= this.totalLength;
  },
};
