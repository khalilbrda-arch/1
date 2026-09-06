/**
 * EconomySystem.js
 * ----------------
 * المرحلة 4 (Foundation) → المرحلة 6 (Economy، اكتمال الملكية والتحقق).
 *
 * مسؤول عن:
 * - امتلاك الرصيد أثناء تشغيل اللعبة (المصدر الوحيد المخوَّل).
 * - التحقق من القدرة على الدفع.
 * - تنفيذ معاملات العملة (خصم/إضافة) بشكل موثوق.
 * - إضافة مكافآت العملة.
 * - رفض أي قيمة غير صالحة (NaN، Infinity، قيم سالبة) قبل أن تصل
 *   إلى الرصيد — راجع SAVE_SCHEMA.md §10 وGAME_SPEC.md §48.
 *
 * لا يعتمد مباشرة على حالة اللعبة المركزية (Central Game State).
 * صورة الحفظ المركزية (persisted player snapshot) تُزامَن عبر الحدث
 * أدناه فقط لأغراض الحفظ، وليست مصدر حقيقة أثناء التشغيل.
 *
 * الحدود:
 *
 * Game
 *   ↓
 * EconomySystem.init(initialBalance)
 *
 * EconomySystem
 *   ↓
 * EventBus
 *   ↓
 * Game
 *
 * عند تغير الرصيد يتم إصدار:
 * CurrencyChanged
 */

const EconomySystem = {
  initialized: false,

  balance: 0,

  /**
   * يحوّل أي قيمة مُدخلة إلى رقم صحيح غير سالب وصالح (finite).
   *
   * يرفض بصمت (يُرجع 0) أي: NaN، Infinity، -Infinity، نصوص غير
   * رقمية، undefined/null، أو قيم سالبة — بدلًا من تمريرها للرصيد.
   * هذا هو حارس التحقق (validation) الوحيد لكل معاملات العملة.
   */
  _sanitizeAmount(value) {
    const n = Number(value);

    if (!Number.isFinite(n) || n < 0) {
      return 0;
    }

    return n;
  },

  init(initialBalance = 0) {
    this.balance = this._sanitizeAmount(initialBalance);

    this.initialized = true;

    this._emitCurrencyChanged();

    return this.balance;
  },

  canAfford(amount) {
    const cost = this._sanitizeAmount(amount);

    return this.balance >= cost;
  },

  spend(amount) {
    const cost = this._sanitizeAmount(amount);

    if (!this.canAfford(cost)) {
      return false;
    }

    this.balance -= cost;

    this._emitCurrencyChanged();

    return true;
  },

  add(amount) {
    const value = this._sanitizeAmount(amount);

    this.balance = this._sanitizeAmount(
      this.balance + value
    );

    this._emitCurrencyChanged();

    return {
      amount: value,
      total: this.balance,
    };
  },

  rewardEnemyKill(reward) {
    const value = this._sanitizeAmount(reward);

    return this.add(value);
  },

  getBalance() {
    const safe = this._sanitizeAmount(this.balance);
    if (safe !== this.balance) {
      this.balance = safe;
      this._emitCurrencyChanged();
    }
    return safe;
  },

  _emitCurrencyChanged() {
    if (
      typeof EventBus === "undefined"
    ) {
      return;
    }

    EventBus.emit(
      "CurrencyChanged",
      {
        balance: this.balance,
      }
    );
  },
};
