/**
 * EventBus.js
 * -----------
 * المرحلة 4 — Architecture Foundation / Event Boundary.
 *
 * مسؤول عن:
 * - تسجيل مستمعين للأحداث.
 * - إطلاق الأحداث مع بياناتها.
 * - إزالة مستمع واحد.
 * - إزالة جميع مستمعي حدث محدد.
 * - إزالة جميع المستمعين.
 *
 * لا يملك:
 * - حالة اللعبة المركزية (Central Game State).
 * - Scene.
 * - UI.
 * - Enemy / Defense / Wave state.
 * - منطق Gameplay.
 *
 * الهدف:
 * إنشاء قناة اتصال منخفضة الاقتران بين الأنظمة دون أن يعرف
 * النظام المرسل تفاصيل النظام المستقبل.
 *
 * هذه نسخة تأسيسية صغيرة:
 * - لا يوجد Event Queue.
 * - لا يوجد Async dispatch.
 * - لا يوجد Singleton class.
 * - لا يوجد تحويل للأنظمة الحالية إلى Events دفعة واحدة.
 *
 * سيتم إدخال الأحداث تدريجيًا بعد تثبيت هذا الحد.
 */

const EventBus = {
  _listeners: {},

  /**
   * تسجيل مستمع لحدث.
   *
   * @param {string} eventName
   * @param {Function} listener
   * @returns {Function|null}
   */
  on(eventName, listener) {
    if (
      typeof eventName !== "string" ||
      eventName.trim() === ""
    ) {
      console.error(
        "EventBus: invalid event name.",
        eventName
      );

      return null;
    }

    if (
      typeof listener !== "function"
    ) {
      console.error(
        "EventBus: listener must be a function.",
        eventName
      );

      return null;
    }

    if (
      !this._listeners[eventName]
    ) {
      this._listeners[eventName] = [];
    }

    this._listeners[eventName].push(
      listener
    );

    return listener;
  },

  /**
   * إزالة مستمع محدد من حدث.
   *
   * @param {string} eventName
   * @param {Function} listener
   * @returns {boolean}
   */
  off(eventName, listener) {
    if (
      typeof eventName !== "string" ||
      eventName.trim() === ""
    ) {
      return false;
    }

    if (
      typeof listener !== "function"
    ) {
      return false;
    }

    const listeners =
      this._listeners[eventName];

    if (
      !listeners ||
      listeners.length === 0
    ) {
      return false;
    }

    const index =
      listeners.indexOf(listener);

    if (index === -1) {
      return false;
    }

    listeners.splice(
      index,
      1
    );

    if (
      listeners.length === 0
    ) {
      delete this._listeners[
        eventName
      ];
    }

    return true;
  },

  /**
   * إزالة جميع مستمعي حدث محدد.
   *
   * @param {string} eventName
   * @returns {boolean}
   */
  offAll(eventName) {
    if (
      typeof eventName !== "string" ||
      eventName.trim() === ""
    ) {
      return false;
    }

    if (
      !this._listeners[eventName]
    ) {
      return false;
    }

    delete this._listeners[
      eventName
    ];

    return true;
  },

  /**
   * إطلاق حدث.
   *
   * يتم أخذ نسخة من قائمة المستمعين قبل التنفيذ
   * حتى لا يؤدي إضافة/إزالة مستمع أثناء dispatch
   * إلى كسر دورة التنفيذ الحالية.
   *
   * @param {string} eventName
   * @param {*} payload
   * @returns {boolean}
   */
  emit(eventName, payload = null) {
    if (
      typeof eventName !== "string" ||
      eventName.trim() === ""
    ) {
      console.error(
        "EventBus: invalid event name.",
        eventName
      );

      return false;
    }

    const listeners =
      this._listeners[eventName];

    if (
      !listeners ||
      listeners.length === 0
    ) {
      return false;
    }

    const snapshot =
      listeners.slice();

    for (
      const listener of snapshot
    ) {
      try {
        listener(payload);
      } catch (error) {
        console.error(
          `EventBus: listener error for "${eventName}".`,
          error
        );
      }
    }

    return true;
  },

  /**
   * التحقق من وجود مستمعين لحدث.
   *
   * @param {string} eventName
   * @returns {boolean}
   */
  hasListeners(eventName) {
    if (
      typeof eventName !== "string" ||
      eventName.trim() === ""
    ) {
      return false;
    }

    const listeners =
      this._listeners[eventName];

    return !!(
      listeners &&
      listeners.length > 0
    );
  },

  /**
   * إزالة جميع الأحداث والمستمعين.
   *
   * يستخدم عند إعادة تهيئة جلسة اللعبة أو الاختبارات.
   */
  clear() {
    this._listeners = {};
  },
};
