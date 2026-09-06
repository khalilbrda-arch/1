/**
 * GameState.js
 * ------------
 * المصدر المركزي للحالة القابلة للحفظ (persisted state):
 *  - Player (level/xp/currency snapshot/rank)
 *  - Base HP
 *  - Interactions المفتوحة
 *  - Advanced world persistence state
 *
 * هذا الكائن هو أساس Save System (راجع src/save/SaveManager.js).
 * الحالة اللحظية أثناء اللعب (runtime authority) لأنظمة كاملة مثل
 * العملة مملوكة لأنظمتها المتخصصة (EconomySystem...)، وتُزامَن هنا
 * فقط لأغراض الحفظ.
 */

const GameState = {
  version: 1,

  player: {
    level: 1,
    xp: 0,
    currency: CONFIG.ECONOMY.STARTING_CURRENCY,
    rank: "Novice",
  },

  unlocked: {
    areas: ["bay_start"],
    defenses: ["cannon"],
    systems: [],
  },

  progression: {
    completedMilestones: [],
  },

  // Phase 9 — authoritative collection state.
  collection: {
    items: {},
    unlocked: [],
    upgrades: {},
  },

  interactions: {
    openedIds: [],
  },
  // Phase 12 — authoritative quest state.
  quests: {
    active: {},
    completed: [],
    claimed: [],
  },

  // Phase 13 — authoritative advanced-world state.
  advancedWorld: {
    npcVisits: {},
    completedChapters: [],
    activeMapRuleId: null,
    dynamicEventCount: 0,
  },


  base: {
    hp: CONFIG.DEFENSE_MAP.BASE.hp,
    maxHp: CONFIG.DEFENSE_MAP.BASE.maxHp,
  },

  hasInteracted(id) {
    return this.interactions.openedIds.includes(id);
  },

  /**
   * تسجيل أن اللاعب تفاعل مع عنصر قابل للتفاعل.
   *
   * ملكية المكافآت المالية لدى EconomySystem وحده (المرحلة 6).
   * هذا المسار مسؤول فقط عن حالة التفاعل القابلة للحفظ.
   */
  registerInteraction(id) {
    if (this.hasInteracted(id)) {
      return false;
    }

    this.interactions.openedIds.push(id);

    return true;
  },

  /**
   * إلحاق الضرر بالقاعدة.
   */
  damageBase(amount) {
    const damage =
      Math.max(
        0,
        Number(amount) || 0
      );

    this.base.hp =
      Math.max(
        0,
        this.base.hp - damage
      );

    return {
      damage,
      hp: this.base.hp,
      maxHp: this.base.maxHp,
      destroyed:
        this.base.hp <= 0,
    };
  },

  /**
   * استعادة صحة القاعدة.
   * ستفيدنا لاحقًا في أنظمة العلاج/الإصلاح.
   */
  healBase(amount) {
    const value =
      Math.max(
        0,
        Number(amount) || 0
      );

    this.base.hp =
      Math.min(
        this.base.maxHp,
        this.base.hp + value
      );

    return this.base.hp;
  },

  /**
   * ملاحظة معمارية (المرحلة 6):
   *
   * لا توجد هنا أي دوال canAfford/spend/reward على العملة عمدًا.
   * "player.currency" في هذا الملف هو مجرد صورة قابلة للحفظ
   * (persisted snapshot) يُحدَّثها Game.js عند كل حدث
   * "CurrencyChanged" الصادر من EconomySystem — وهو المصدر
   * الوحيد المخوَّل لقراءة/تعديل الرصيد أثناء التشغيل
   * (راجع src/economy/EconomySystem.js وDECISIONS.md).
   *
   * أي كود يحتاج التحقق من الرصيد أو إنفاقه أو إضافته يجب أن
   * يستدعي EconomySystem مباشرة، وليس GameState.
   */

  /**
   * هل القاعدة مدمرة؟
   */
  isBaseDestroyed() {
    return this.base.hp <= 0;
  },

  summary() {
    return (
      `Lvl ${this.player.level}` +
      ` | XP ${this.player.xp}` +
      ` | Gold ${this.player.currency}` +
      ` | Base ${Math.ceil(this.base.hp)}/${this.base.maxHp}`
    );
  },
};

