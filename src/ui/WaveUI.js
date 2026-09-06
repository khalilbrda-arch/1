/**
 * WaveUI.js
 * ---------
 * واجهة عرض رقم الموجة الحالية.
 *
 * تعرض بأعلى مركز الشاشة (بين debug-hud يسارًا وBaseHUD يمينًا):
 *  - "🌊 الموجة N"
 *  - إمّا عدّاد "القادمة خلال Xث" (أثناء الاستراحة بين الموجات)
 *    أو "أعداء متبقون: N" (أثناء الموجة نفسها)
 *
 * لا تحتوي على منطق موجات — تقرأ فقط البيانات التي يمررها WaveManager.
 */

const WaveUI = {
  _container: null,
  _waveText: null,
  _statusText: null,

  init() {
    if (this._container) return;

    const container = document.createElement("div");

    container.id = "wave-hud";

    container.style.cssText = `
      position: fixed;

      top: 10px;
      left: 50%;

      transform: translateX(-50%);

      padding: 6px 16px;

      background: rgba(8, 18, 30, 0.82);

      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 10px;

      box-sizing: border-box;

      z-index: 55;

      pointer-events: none;

      text-align: center;

      font-family:
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        system-ui,
        sans-serif;
    `;

    const waveText = document.createElement("div");

    waveText.style.cssText = `
      color: #ffffff;
      font-size: 13px;
      font-weight: 700;
    `;

    const statusText = document.createElement("div");

    statusText.style.cssText = `
      margin-top: 2px;
      color: #bfe4ff;
      font-size: 10.5px;
      font-weight: 600;
    `;

    container.appendChild(waveText);
    container.appendChild(statusText);

    document.body.appendChild(container);

    this._container = container;
    this._waveText = waveText;
    this._statusText = statusText;
  },

  /**
   * data = { wave, state, countdown, remaining }
   */
  update(data) {
    if (!this._container) return;

    const waveLabel =
      data.wave > 0
        ? `🌊 الموجة ${data.wave}`
        : "🌊 استعد...";

    this._waveText.textContent = waveLabel;

    if (data.state === "countdown") {
      this._statusText.textContent =
        data.wave === 0
          ? `تبدأ خلال ${data.countdown}ث`
          : `الموجة التالية خلال ${data.countdown}ث`;
    } else if (
      data.state === "spawning" ||
      data.state === "waiting-clear"
    ) {
      this._statusText.textContent = `أعداء متبقون: ${data.remaining}`;
    } else {
      this._statusText.textContent = "";
    }
  },
};
