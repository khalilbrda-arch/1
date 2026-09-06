/**
 * GameOverUI.js
 * -------------
 * شاشة "نهاية اللعبة" تظهر عندما يصل HP القاعدة إلى صفر.
 *
 * لا يوجد Save System بعد، لذلك "إعادة المحاولة" الحالية هي
 * ببساطة إعادة تحميل الصفحة (كل التقدّم يُفقد أصلًا عند أي
 * تحديث صفحة بهذه المرحلة من المشروع).
 */

const GameOverUI = {
  _container: null,

  show(waveReached) {
    if (this._container) return;

    // إيقاف وضع بناء الدفاعات (المرحلة 8) — لا معنى لوضع دفاعات
    // جديدة بعد تدمير القاعدة.
    if (typeof DefenseManager !== "undefined") {
      DefenseManager.cancelPlacement();
    }

    if (typeof DefenseUI !== "undefined") {
      DefenseUI.disable();
    }

    const container = document.createElement("div");

    container.id = "game-over-screen";

    container.style.cssText = `
      position: fixed;

      inset: 0;

      display: flex;

      flex-direction: column;

      align-items: center;
      justify-content: center;

      background: rgba(6, 10, 16, 0.88);

      z-index: 90;

      font-family:
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        system-ui,
        sans-serif;

      text-align: center;

      padding: 24px;

      box-sizing: border-box;
    `;

    const title = document.createElement("div");

    title.textContent = "💀 دُمِّرت القاعدة";

    title.style.cssText = `
      color: #ff6b6b;
      font-size: 24px;
      font-weight: 800;
      margin-bottom: 10px;
    `;

    const subtitle = document.createElement("div");

    subtitle.textContent = `صمدتَ حتى الموجة ${Math.max(
      1,
      waveReached || 1
    )}`;

    subtitle.style.cssText = `
      color: #dcefff;
      font-size: 14px;
      margin-bottom: 24px;
      opacity: 0.85;
    `;

    const retryButton = document.createElement("button");

    retryButton.textContent = "إعادة المحاولة";

    retryButton.style.cssText = `
      padding: 12px 28px;

      font-size: 14px;
      font-weight: 700;

      color: #06121e;
      background: #ffb347;

      border: none;
      border-radius: 10px;

      cursor: pointer;
    `;

    retryButton.addEventListener("click", () => {
      window.location.reload();
    });

    container.appendChild(title);
    container.appendChild(subtitle);
    container.appendChild(retryButton);

    document.body.appendChild(container);

    this._container = container;
  },
};
