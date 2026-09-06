/**
 * TouchControls.js
 * ----------------
 * نظام الإدخال الموحّد (InputManager) — قسم 75 بالمواصفات.
 * يوفر بيانات خام جاهزة للأنظمة الأخرى، ولا يعرف شيئًا عنها:
 *
 *  - إصبع واحد + سحب (تجاوز حد صغير)  = Pan  → تُستهلك عبر consumePan().
 *  - إصبعين + تغيير المسافة بينهم     = Zoom → تُستهلك عبر consumeZoom().
 *  - إصبع واحد بدون سحب فعلي (لمسة سريعة وقصيرة) = Tap → تُستهلك عبر consumeTap().
 *  - على الحاسوب (للاختبار فقط، لا يظهر كخيار رسمي للاعب):
 *      سحب بالماوس = Pan، عجلة الماوس = Zoom، نقرة سريعة بالماوس = Tap.
 *
 * مستقل تمامًا عن الكاميرا ونظام التفاعل — لا يعرف عنهما شيئًا.
 */

const TouchControls = {
  _panAccum: { x: 0, y: 0 },
  _zoomAccum: 0,
  _pendingTap: null,

  _activeTouches: {}, // id -> {x, y}
  _lastPinchDist: null,
  _tapCandidate: null, // {id, x, y, time} لإصبع واحد قيد المراقبة كمرشّح لنقرة

  _mouseDown: false,
  _lastMouseX: 0,
  _lastMouseY: 0,
  _mouseTapCandidate: null, // {x, y, time}

  init() {
    window.addEventListener("touchstart", (e) => this._onTouchStart(e), { passive: false });
    window.addEventListener("touchmove", (e) => this._onTouchMove(e), { passive: false });
    window.addEventListener("touchend", (e) => this._onTouchEnd(e), { passive: false });
    window.addEventListener("touchcancel", (e) => this._onTouchCancel(e), { passive: false });

    // دعم الماوس للاختبار على الحاسوب فقط
    window.addEventListener("mousedown", (e) => this._onMouseDown(e));
    window.addEventListener("mousemove", (e) => this._onMouseMove(e));
    window.addEventListener("mouseup", (e) => this._onMouseUp(e));
    window.addEventListener("wheel", (e) => this._onWheel(e), { passive: false });
  },

  // ---------- اللمس ----------

  _onTouchStart(e) {
    for (const t of e.changedTouches) {
      this._activeTouches[t.identifier] = { x: t.clientX, y: t.clientY };
    }

    if (this._touchCount() === 1) {
      const t = e.changedTouches[0];
      this._tapCandidate = { id: t.identifier, x: t.clientX, y: t.clientY, time: performance.now() };
    } else {
      // أكثر من إصبع = هذا ليس نقرة بسيطة
      this._tapCandidate = null;
    }

    if (this._touchCount() === 2) {
      this._lastPinchDist = this._currentPinchDist();
    }
  },

  _onTouchMove(e) {
    e.preventDefault();

    if (this._touchCount() === 1) {
      const t = e.changedTouches[0];
      const prev = this._activeTouches[t.identifier];
      if (prev) {
        this._panAccum.x += t.clientX - prev.x;
        this._panAccum.y += t.clientY - prev.y;
      }

      if (this._tapCandidate && this._tapCandidate.id === t.identifier) {
        const dx = t.clientX - this._tapCandidate.x;
        const dy = t.clientY - this._tapCandidate.y;
        if (Math.sqrt(dx * dx + dy * dy) > CONFIG.TAP_INPUT.MAX_MOVE_PX) {
          this._tapCandidate = null; // تحوّلت لسحب حقيقي، لم تعد نقرة
        }
      }
    } else {
      this._tapCandidate = null;
    }

    for (const t of e.changedTouches) {
      this._activeTouches[t.identifier] = { x: t.clientX, y: t.clientY };
    }

    if (this._touchCount() === 2) {
      const dist = this._currentPinchDist();
      if (this._lastPinchDist !== null) {
        // تباعد الإصبعين (dist يكبر) = تقريب الكاميرا (Zoom In) => قيمة سالبة
        this._zoomAccum += this._lastPinchDist - dist;
      }
      this._lastPinchDist = dist;
    }
  },

  _onTouchEnd(e) {
    for (const t of e.changedTouches) {
      if (this._tapCandidate && this._tapCandidate.id === t.identifier) {
        const elapsed = performance.now() - this._tapCandidate.time;
        if (elapsed <= CONFIG.TAP_INPUT.MAX_DURATION_MS) {
          this._pendingTap = { x: this._tapCandidate.x, y: this._tapCandidate.y };
        }
        this._tapCandidate = null;
      }
      delete this._activeTouches[t.identifier];
    }
    if (this._touchCount() < 2) {
      this._lastPinchDist = null;
    }
  },

  _onTouchCancel(e) {
    this._tapCandidate = null;
    for (const t of e.changedTouches) {
      delete this._activeTouches[t.identifier];
    }
    if (this._touchCount() < 2) {
      this._lastPinchDist = null;
    }
  },

  _touchCount() {
    return Object.keys(this._activeTouches).length;
  },

  _currentPinchDist() {
    const pts = Object.values(this._activeTouches);
    if (pts.length < 2) return 0;
    const dx = pts[0].x - pts[1].x;
    const dy = pts[0].y - pts[1].y;
    return Math.sqrt(dx * dx + dy * dy);
  },

  // ---------- الماوس (اختبار على الحاسوب فقط) ----------

  _onMouseDown(e) {
    this._mouseDown = true;
    this._lastMouseX = e.clientX;
    this._lastMouseY = e.clientY;
    this._mouseTapCandidate = { x: e.clientX, y: e.clientY, time: performance.now() };
  },

  _onMouseMove(e) {
    if (!this._mouseDown) return;
    this._panAccum.x += e.clientX - this._lastMouseX;
    this._panAccum.y += e.clientY - this._lastMouseY;
    this._lastMouseX = e.clientX;
    this._lastMouseY = e.clientY;

    if (this._mouseTapCandidate) {
      const dx = e.clientX - this._mouseTapCandidate.x;
      const dy = e.clientY - this._mouseTapCandidate.y;
      if (Math.sqrt(dx * dx + dy * dy) > CONFIG.TAP_INPUT.MAX_MOVE_PX) {
        this._mouseTapCandidate = null;
      }
    }
  },

  _onMouseUp(e) {
    this._mouseDown = false;
    if (this._mouseTapCandidate) {
      const elapsed = performance.now() - this._mouseTapCandidate.time;
      if (elapsed <= CONFIG.TAP_INPUT.MAX_DURATION_MS) {
        this._pendingTap = { x: this._mouseTapCandidate.x, y: this._mouseTapCandidate.y };
      }
      this._mouseTapCandidate = null;
    }
  },

  _onWheel(e) {
    e.preventDefault();
    this._zoomAccum += e.deltaY * 0.05;
  },

  // ---------- يُستدعى من الأنظمة الأخرى كل إطار ----------

  consumePan() {
    const p = { x: this._panAccum.x, y: this._panAccum.y };
    this._panAccum.x = 0;
    this._panAccum.y = 0;
    return p;
  },

  consumeZoom() {
    const z = this._zoomAccum;
    this._zoomAccum = 0;
    return z;
  },

  // يُرجع {x, y} بإحداثيات الشاشة (CSS px) إذا حصلت نقرة هذا الإطار، وإلا null.
  consumeTap() {
    const t = this._pendingTap;
    this._pendingTap = null;
    return t;
  },
};
