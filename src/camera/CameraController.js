/**
 * CameraController.js
 * --------------------
 * يحل محل Player.js بالكامل.
 * يتحكم بكاميرا ثابتة الزاوية تنظر للعالم من فوق بميلان محدد (CONFIG.CAMERA.TILT_ANGLE_DEG)،
 * بدون أي شخصية لاعب ظاهرة أو متحركة.
 *
 * التحكم الوحيد:
 *  - سحب إصبع واحد  = تحريك نقطة النظر فوق الأرض (Pan).
 *  - سحب إصبعين     = تكبير/تصغير (تغيير المسافة عن نقطة النظر) (Zoom).
 *
 * مستقل تمامًا عن TouchControls من ناحية المنطق — يقرأ منه فقط
 * قيمًا جاهزة عبر consumePan() و consumeZoom().
 */

const CameraController = {
  camera: null,
  target: { x: 0, y: 0, z: 0 },
  distance: 0,

  init(camera) {
    const c = CONFIG.CAMERA_CONTROL;
    this.camera = camera;

    this.target.x = c.START_TARGET.x;
    this.target.y = c.START_TARGET.y;
    this.target.z = c.START_TARGET.z;
    this.distance = c.DISTANCE_START;

    this._applyToCamera();
  },

  update() {
    const c = CONFIG.CAMERA_CONTROL;

    // ---------- Pan (سحب إصبع واحد) ----------
    const pan = TouchControls.consumePan();
    this.target.x -= pan.x * c.PAN_SPEED;
    this.target.z -= pan.y * c.PAN_SPEED;

    this.target.x = Math.max(c.PAN_BOUNDS.MIN_X, Math.min(c.PAN_BOUNDS.MAX_X, this.target.x));
    this.target.z = Math.max(c.PAN_BOUNDS.MIN_Z, Math.min(c.PAN_BOUNDS.MAX_Z, this.target.z));

    // ---------- Zoom (إصبعين) ----------
    const zoom = TouchControls.consumeZoom();
    this.distance += zoom * c.ZOOM_SPEED;
    this.distance = Math.max(c.DISTANCE_MIN, Math.min(c.DISTANCE_MAX, this.distance));

    this._applyToCamera();
  },

  _applyToCamera() {
    const tiltRad = (CONFIG.CAMERA.TILT_ANGLE_DEG * Math.PI) / 180;

    // موقع الكاميرا: فوق وخلف نقطة النظر، حسب زاوية الميلان والمسافة الحالية
    const height = Math.sin(tiltRad) * this.distance;
    const back = Math.cos(tiltRad) * this.distance;

    this.camera.position.set(
      this.target.x,
      this.target.y + height,
      this.target.z + back
    );
    this.camera.lookAt(this.target.x, this.target.y, this.target.z);
  },
};
