/**
 * EconomyUI.js
 * ------------
 * المرحلة 6 — Economy.
 *
 * عرض رصيد العملة الحالي للاعب.
 *
 * هذه الواجهة لا تملك الرصيد ولا تحسبه، ولا تتخذ أي قرار اقتصادي
 * (canAfford/spend/add كلها مسؤولية EconomySystem وحده — راجع
 * GAME_SPEC.md §48 "Avoid trusting UI state as authoritative
 * gameplay state"). دور EconomyUI هو العرض فقط.
 *
 * الحالة تصل إليها عبر:
 *
 * EconomySystem
 *   ↓
 * EventBus
 *   ↓
 * EconomyUI
 *
 * الحدث المستخدم:
 * CurrencyChanged { balance }
 */

const EconomyUI = {
  _container: null,
  _text: null,

  _balance: 0,

  _initialized: false,

  init(initialBalance = null) {
    if (this._initialized) {
      return;
    }

    if (initialBalance !== null) {
      this._balance = Math.max(
        0,
        Number(initialBalance) || 0
      );
    } else if (
      typeof EconomySystem !== "undefined" &&
      typeof EconomySystem.getBalance === "function"
    ) {
      this._balance = EconomySystem.getBalance();
    }

    this._create();

    this._subscribe();

    this._initialized = true;

    this.update();
  },

  _create() {
    const container =
      document.createElement("div");

    container.id = "economy-hud";

    container.style.cssText = `
      position: fixed;

      top: 10px;
      left: 10px;

      padding: 8px 12px;

      background: rgba(8, 18, 30, 0.82);

      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 10px;

      box-sizing: border-box;

      z-index: 55;

      pointer-events: none;

      display: flex;
      align-items: center;
      gap: 6px;

      font-family:
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        system-ui,
        sans-serif;
    `;

    const icon =
      document.createElement("div");

    icon.textContent = "🪙";

    icon.style.cssText = `
      font-size: 14px;
      line-height: 1;
    `;

    const text =
      document.createElement("div");

    text.style.cssText = `
      color: #ffe9a8;

      font-size: 13px;
      font-weight: 700;

      line-height: 1;
    `;

    container.appendChild(icon);
    container.appendChild(text);

    document.body.appendChild(container);

    this._container = container;
    this._text = text;
  },

  _subscribe() {
    if (
      typeof EventBus === "undefined"
    ) {
      return;
    }

    EventBus.on(
      "CurrencyChanged",
      (payload) => {
        if (!payload) {
          return;
        }

        const balance = Number(payload.balance);

        if (!Number.isFinite(balance)) {
          return;
        }

        this._balance = Math.max(0, balance);

        this.update();
      }
    );
  },

  update() {
    if (!this._text) {
      return;
    }

    this._text.textContent =
      String(Math.floor(this._balance));
  },
};
