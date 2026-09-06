/**
 * Toast.js
 * --------
 * إشعارات صغيرة تظهر فوق اللعبة.
 */

const Toast = {
  _el: null,
  _hideTimeout: null,

  _ensureElement() {
    if (this._el) return this._el;

    const el = document.createElement("div");

    el.id = "interaction-toast";

    el.style.cssText = `
      position: fixed;
      top: 18%;
      left: 50%;
      transform: translate(-50%, 0);

      background: rgba(10, 20, 32, 0.82);
      color: #ffe9a8;

      font-family: -apple-system, system-ui, sans-serif;
      font-size: 14px;
      font-weight: 600;

      padding: 8px 16px;
      border-radius: 20px;

      z-index: 60;
      pointer-events: none;

      opacity: 0;

      transition:
        opacity 0.15s ease,
        transform 0.15s ease;
    `;

    document.body.appendChild(el);

    this._el = el;

    return el;
  },

  _display(text) {
    const el = this._ensureElement();

    el.textContent = text;

    el.style.opacity = "1";
    el.style.transform = "translate(-50%, -6px)";

    clearTimeout(this._hideTimeout);

    this._hideTimeout = setTimeout(() => {
      el.style.opacity = "0";
      el.style.transform = "translate(-50%, 0)";
    }, 1100);
  },

  show(result) {
    if (!result) return;

    const label =
      result.type === "chest"
        ? "صندوق كنز"
        : "مورد";

    this._display(
      `${label} +${result.reward} 🪙`
    );
  },

  showMessage(text) {
    this._display(text);
  },
};
