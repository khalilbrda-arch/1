/**
 * DefenseUI.js
 * ------------
 * واجهة وضع الدفاعات (المرحلة 8).
 *
 * زر ثابت أسفل الشاشة: "🔫 وضع مدفع (التكلفة)".
 * عند الضغط: يدخل "وضع البناء" (DefenseManager.startPlacement)، ويظهر
 * تلميح أعلى الزر يشرح للمستخدم أن ينقر على الجزيرة. ضغطة أخرى على نفس
 * الزر (الذي يتحول إلى "✖ إلغاء") تُلغي وضع البناء.
 *
 * e.stopPropagation() ضروري بكل حدث لمس/نقر على الزر نفسه، حتى لا
 * تصل نفس اللمسة إلى TouchControls (المُركَّبة على window) وتُفسَّر
 * خطأً كنقرة داخل العالم.
 */

const DefenseUI = {
  _container: null,
  _buildButton: null,
  _hint: null,

  init() {
    if (this._container) {
      return;
    }

    const container =
      document.createElement("div");

    container.id = "defense-ui";

    container.style.cssText = `
      position: fixed;

      bottom: 46px;

      left: 0;
      right: 0;

      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;

      z-index: 55;

      pointer-events: none;
    `;

    const hint =
      document.createElement("div");

    hint.id = "defense-hint";

    hint.style.cssText = `
      display: none;

      padding: 6px 14px;

      background: rgba(8, 18, 30, 0.85);

      color: #ffe9a8;

      border-radius: 16px;

      font-family:
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        system-ui,
        sans-serif;

      font-size: 12px;
      font-weight: 600;

      text-align: center;

      pointer-events: none;
    `;

    const buildButton =
      document.createElement("button");

    buildButton.id = "build-cannon-btn";

    buildButton.style.cssText = `
      pointer-events: auto;

      padding: 10px 22px;

      font-size: 14px;
      font-weight: 700;

      color: #06121e;
      background: #ffb347;

      border: none;
      border-radius: 22px;

      box-shadow: 0 3px 10px rgba(0,0,0,0.35);
    `;

    const stopPropagationOnly = (e) => {
      e.stopPropagation();
    };

    buildButton.addEventListener(
      "touchstart",
      stopPropagationOnly,
      { passive: true }
    );

    buildButton.addEventListener(
      "mousedown",
      stopPropagationOnly
    );

    buildButton.addEventListener(
      "click",
      (e) => {
        e.stopPropagation();

        if (DefenseManager.isPlacing) {
          DefenseManager.cancelPlacement();
        } else {
          DefenseManager.startPlacement(
            "cannon"
          );
        }
      }
    );

    container.appendChild(hint);
    container.appendChild(buildButton);

    document.body.appendChild(
      container
    );

    this._container = container;
    this._buildButton = buildButton;
    this._hint = hint;

    this._syncButtonLabel();
  },

  /**
   * يُستدعى من DefenseManager عند دخول/إلغاء وضع البناء.
   */
  setPlacingState(isPlacing, typeConfig) {
    if (!this._buildButton) {
      return;
    }

    if (isPlacing && typeConfig) {
      this._buildButton.textContent =
        "✖ إلغاء";

      this._buildButton.style.background =
        "#ff6b6b";

      this._hint.textContent =
        `انقر على الجزيرة لوضع ${typeConfig.name} (${typeConfig.cost} 🪙)`;

      this._hint.style.display =
        "block";
    } else {
      this._syncButtonLabel();

      this._hint.style.display =
        "none";
    }
  },

  /**
   * يُستدعى عند Game Over لتعطيل الزر — لا معنى لوضع دفاعات جديدة
   * بعد تدمير القاعدة.
   */
  disable() {
    if (this._buildButton) {
      this._buildButton.disabled = true;
      this._buildButton.style.opacity = "0.4";
      this._buildButton.style.pointerEvents = "none";
    }

    if (this._hint) {
      this._hint.style.display = "none";
    }
  },

  _syncButtonLabel() {
    if (!this._buildButton) {
      return;
    }

    const T =
      CONFIG.DEFENSES.TYPES.cannon;

    this._buildButton.textContent =
      `🔫 وضع مدفع (${T.cost})`;

    this._buildButton.style.background =
      "#ffb347";
  },
};
