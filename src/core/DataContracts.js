/**
 * DataContracts.js
 * ----------------
 * عقود بيانات المحتوى الثابت وبيانات الإنشاء.
 *
 * هذا الملف لا يملك حالة تشغيلية ولا يغيّر سلوك أنظمة اللعبة.
 * وظيفته التحقق من شكل البيانات قبل أن تستخدمها الأنظمة.
 *
 * Phase 4 — Architecture Foundation / AD-003
 *
 * ملاحظة معمارية:
 * - Enemy Definition = بيانات ثابتة قادمة من CONFIG.
 * - Enemy Spawn Data = البيانات النهائية التي تُمرر إلى Enemy عند إنشائه.
 * - لا نفرض id على Enemy Definition لأن EnemyManager ينشئ هوية
 *   instance مستقلة لكل عدو عند التشغيل.
 */

const DataContracts = {
  // =========================================================
  // HELPERS
  // =========================================================

  _isFiniteNonNegativeNumber(value) {
    return (
      typeof value === "number" &&
      Number.isFinite(value) &&
      value >= 0
    );
  },

  _isNonEmptyString(value) {
    return (
      typeof value === "string" &&
      value.trim().length > 0
    );
  },

  // =========================================================
  // ENEMY DEFINITION
  // =========================================================

  /**
   * التحقق من تعريف عدو ثابت.
   *
   * هذا التعريف يمثل بيانات المحتوى فقط.
   * لا يحتوي:
   * - hp الحالي
   * - target
   * - model
   * - pathDistance
   * - alive
   * - reachedBase
   * - instance id
   */
  validateEnemyDefinition(definition) {
    if (
      !definition ||
      typeof definition !== "object"
    ) {
      return false;
    }

    const requiredNumbers = [
      "maxHp",
      "speed",
      "armor",
      "resistance",
      "damage",
      "reward",
    ];

    for (const key of requiredNumbers) {
      if (
        !this._isFiniteNonNegativeNumber(
          definition[key]
        )
      ) {
        return false;
      }
    }

    return true;
  },

  // =========================================================
  // ENEMY SPAWN DATA
  // =========================================================

  /**
   * التحقق من البيانات النهائية التي ستُستخدم لإنشاء Enemy instance.
   *
   * هنا يصبح id مطلوبًا لأن هذه لم تعد Definition ثابتة،
   * بل بيانات إنشاء instance محدد.
   */
  validateEnemySpawnData(data) {
    if (
      !data ||
      typeof data !== "object"
    ) {
      return false;
    }

    if (
      !this._isNonEmptyString(
        data.id
      )
    ) {
      return false;
    }

    if (
      !this._isNonEmptyString(
        data.type
      )
    ) {
      return false;
    }

    const requiredNumbers = [
      "maxHp",
      "speed",
      "armor",
      "resistance",
      "damage",
      "reward",
    ];

    for (const key of requiredNumbers) {
      if (
        !this._isFiniteNonNegativeNumber(
          data[key]
        )
      ) {
        return false;
      }
    }

    return true;
  },

  // =========================================================
  // DEFENSE DEFINITION
  // =========================================================

  /**
   * التحقق من تعريف دفاع ثابت.
   *
   * لا يحتوي instance state مثل:
   * - cooldown
   * - target
   * - model
   * - position
   */
  validateDefenseDefinition(definition) {
    if (
      !definition ||
      typeof definition !== "object"
    ) {
      return false;
    }

    if (
      !this._isNonEmptyString(
        definition.id
      )
    ) {
      return false;
    }

    const requiredNumbers = [
      "cost",
      "damage",
      "critChance",
      "critMultiplier",
      "range",
      "fireRate",
      "projectileSpeed",
    ];

    for (const key of requiredNumbers) {
      if (
        !this._isFiniteNonNegativeNumber(
          definition[key]
        )
      ) {
        return false;
      }
    }

    if (
      !this._isNonEmptyString(
        definition.targeting
      )
    ) {
      return false;
    }

    return true;
  },

  // =========================================================
  // MERGE DEFINITION
  // =========================================================

  validateMergeDefinition(definition) {
    if (!definition || typeof definition !== "object") {
      return false;
    }

    if (!this._isNonEmptyString(definition.id) ||
        !this._isNonEmptyString(definition.name)) {
      return false;
    }

    if (!definition.inputs || typeof definition.inputs !== "object" || Array.isArray(definition.inputs)) {
      return false;
    }

    const inputIds = Object.keys(definition.inputs);
    if (inputIds.length === 0) {
      return false;
    }

    for (const itemId of inputIds) {
      if (!this._isNonEmptyString(itemId) ||
          !Number.isInteger(definition.inputs[itemId]) ||
          definition.inputs[itemId] <= 0) {
        return false;
      }
    }

    const result = definition.result;
    if (!result ||
        !this._isNonEmptyString(result.itemId) ||
        !Number.isInteger(result.amount) ||
        result.amount <= 0) {
      return false;
    }

    if (!this._isFiniteNonNegativeNumber(definition.cost) ||
        !Number.isInteger(definition.requiredLevel) ||
        definition.requiredLevel < 1 ||
        !this._isFiniteNonNegativeNumber(definition.xpReward)) {
      return false;
    }

    return true;
  },


  // =========================================================
  // COLLECTION DEFINITION — PHASE 9
  // =========================================================

  validateCollectionDefinition(definition) {
    if (!definition || typeof definition !== "object") return false;
    if (!this._isNonEmptyString(definition.id) || !this._isNonEmptyString(definition.name)) return false;
    if (!this._isNonEmptyString(definition.category) || !this._isNonEmptyString(definition.rarity)) return false;
    if (typeof definition.stackable !== "boolean" || typeof definition.mergeEligible !== "boolean") return false;
    if (!Number.isInteger(definition.requiredLevel) || definition.requiredLevel < 1) return false;
    if (!Number.isInteger(definition.maxUpgradeLevel) || definition.maxUpgradeLevel < 1) return false;
    if (definition.unlockedByDefault !== undefined && typeof definition.unlockedByDefault !== "boolean") return false;
    if (typeof CONFIG !== "undefined" && CONFIG.COLLECTION && Array.isArray(CONFIG.COLLECTION.RARITIES) && !CONFIG.COLLECTION.RARITIES.includes(definition.rarity)) return false;
    return true;
  },


  validateQuestDefinition(definition) {
    if (!definition || typeof definition !== "object") return false;
    if (!this._isNonEmptyString(definition.id) || !this._isNonEmptyString(definition.name)) return false;
    if (!this._isNonEmptyString(definition.type)) return false;
    if (!Number.isSafeInteger(definition.target) || definition.target <= 0) return false;
    if (!definition.rewards || typeof definition.rewards !== "object" || Array.isArray(definition.rewards)) return false;
    const rewards = definition.rewards;
    if (rewards.currency !== undefined && !this._isFiniteNonNegativeNumber(rewards.currency)) return false;
    if (rewards.xp !== undefined && !this._isFiniteNonNegativeNumber(rewards.xp)) return false;
    if (rewards.item !== undefined) {
      if (!rewards.item || !this._isNonEmptyString(rewards.item.itemId) || !Number.isSafeInteger(rewards.item.amount) || rewards.item.amount <= 0) return false;
    }
    if (definition.match !== undefined && (!definition.match || typeof definition.match !== "object" || Array.isArray(definition.match))) return false;
    return true;
  },

  validateBossDefinition(definition) {
    if (!definition || typeof definition !== "object") return false;
    if (!this._isNonEmptyString(definition.id) || !this._isNonEmptyString(definition.name) || !this._isNonEmptyString(definition.type)) return false;
    if (!this.validateEnemyDefinition(definition)) return false;
    if (!Array.isArray(definition.phases) || definition.phases.length < 1) return false;
    for (const phase of definition.phases) {
      if (!phase || !this._isFiniteNonNegativeNumber(phase.threshold) || phase.threshold > 1) return false;
      if (!this._isFiniteNonNegativeNumber(phase.damageMultiplier) || !this._isFiniteNonNegativeNumber(phase.speedMultiplier) || phase.damageMultiplier <= 0 || phase.speedMultiplier <= 0) return false;
    }
    if (!definition.enrage || !this._isFiniteNonNegativeNumber(definition.enrage.threshold) || definition.enrage.threshold < 0 || definition.enrage.threshold > 1 || !this._isFiniteNonNegativeNumber(definition.enrage.damageMultiplier) || !this._isFiniteNonNegativeNumber(definition.enrage.speedMultiplier) || definition.enrage.damageMultiplier <= 0 || definition.enrage.speedMultiplier <= 0) return false;
    if (!definition.ability || !this._isNonEmptyString(definition.ability.id) || !this._isFiniteNonNegativeNumber(definition.ability.cooldown) || definition.ability.cooldown <= 0 || !this._isFiniteNonNegativeNumber(definition.ability.baseDamage) || !this._isFiniteNonNegativeNumber(definition.ability.baseDamageToBase) || (definition.ability.enrageDamageMultiplier !== undefined && (!this._isFiniteNonNegativeNumber(definition.ability.enrageDamageMultiplier) || definition.ability.enrageDamageMultiplier <= 0))) return false;
    if (!this._isFiniteNonNegativeNumber(definition.xpReward)) return false;
    if (!definition.rewardItem || !this._isNonEmptyString(definition.rewardItem.itemId) || !Number.isSafeInteger(definition.rewardItem.amount) || definition.rewardItem.amount <= 0) return false;
    return true;
  },

  // =========================================================
  // STARTUP VALIDATION
  // =========================================================

  /**
   * تحقق مبكر من المحتوى الثابت الموجود حاليًا.
   *
   * إذا كان هناك تعريف غير صالح، نبلغ بوضوح في Console
   * بدل تجاهل نتيجة validator.
   *
   * لا يتم إنشاء أي حالة تشغيلية هنا.
   */
  validateConfig() {
    let valid = true;

    if (
      typeof CONFIG === "undefined"
    ) {
      console.error(
        "DataContracts: CONFIG is not available."
      );

      return false;
    }

    if (
      !CONFIG.WAVES ||
      !CONFIG.WAVES.BASE_ENEMY
    ) {
      console.error(
        "DataContracts: CONFIG.WAVES.BASE_ENEMY is missing."
      );

      valid = false;
    } else if (
      !this.validateEnemyDefinition(
        CONFIG.WAVES.BASE_ENEMY
      )
    ) {
      console.error(
        "DataContracts: invalid CONFIG.WAVES.BASE_ENEMY.",
        CONFIG.WAVES.BASE_ENEMY
      );

      valid = false;
    }

    if (
      !CONFIG.DEFENSES ||
      !CONFIG.DEFENSES.TYPES
    ) {
      console.error(
        "DataContracts: CONFIG.DEFENSES.TYPES is missing."
      );

      valid = false;
    } else {
      for (
        const defenseId in CONFIG.DEFENSES.TYPES
      ) {
        const definition =
          CONFIG.DEFENSES.TYPES[
            defenseId
          ];

        if (
          !this.validateDefenseDefinition(
            definition
          )
        ) {
          console.error(
            `DataContracts: invalid defense definition "${defenseId}".`,
            definition
          );

          valid = false;
        }
      }
    }

    if (!CONFIG.QUESTS || !CONFIG.QUESTS.TYPES) {
      console.error("DataContracts: CONFIG.QUESTS.TYPES is missing.");
      valid = false;
    } else {
      for (const questId in CONFIG.QUESTS.TYPES) {
        if (!this.validateQuestDefinition(CONFIG.QUESTS.TYPES[questId])) {
          console.error(`DataContracts: invalid quest definition "${questId}".`, CONFIG.QUESTS.TYPES[questId]);
          valid = false;
        }
      }
    }

    if (!CONFIG.ADVANCED_WORLD || !Array.isArray(CONFIG.ADVANCED_WORLD.NPCS) || !Array.isArray(CONFIG.ADVANCED_WORLD.STORY_CHAPTERS) || !CONFIG.ADVANCED_WORLD.MAP_RULES || !Array.isArray(CONFIG.ADVANCED_WORLD.DYNAMIC_EVENTS)) {
      console.error("DataContracts: CONFIG.ADVANCED_WORLD is missing or malformed.");
      valid = false;
    } else {
      const npcIds = new Set();
      for (const npc of CONFIG.ADVANCED_WORLD.NPCS) {
        if (!npc || typeof npc.id !== "string" || !npc.id || npcIds.has(npc.id) || !Number.isFinite(npc.x) || !Number.isFinite(npc.z)) { valid = false; continue; }
        npcIds.add(npc.id);
      }
      const chapterIds = new Set();
      for (const chapter of CONFIG.ADVANCED_WORLD.STORY_CHAPTERS) {
        if (!chapter || typeof chapter.id !== "string" || !chapter.id || chapterIds.has(chapter.id) || typeof chapter.trigger !== "string") { valid = false; continue; }
        chapterIds.add(chapter.id);
      }
      for (const [ruleId, rule] of Object.entries(CONFIG.ADVANCED_WORLD.MAP_RULES)) {
        if (!rule || rule.id !== ruleId || typeof rule.type !== "string") valid = false;
        if (rule && rule.type === "build_restriction" && (!Number.isFinite(rule.radius) || rule.radius <= 0 || !rule.center || !Number.isFinite(rule.center.x) || !Number.isFinite(rule.center.z))) valid = false;
      }
      for (const event of CONFIG.ADVANCED_WORLD.DYNAMIC_EVENTS) {
        if (!event || typeof event.id !== "string" || !event.id || typeof event.triggerWorldEventId !== "string" || (event.mapRuleId !== undefined && typeof event.mapRuleId !== "string")) valid = false;
      }
    }

    if (!CONFIG.BOSSES || !CONFIG.BOSSES.TYPES || !CONFIG.BOSSES.TYPES[CONFIG.BOSSES.DEFAULT_ID]) {
      console.error("DataContracts: CONFIG.BOSSES is missing.");
      valid = false;
    } else {
      for (const bossId in CONFIG.BOSSES.TYPES) {
        const definition = CONFIG.BOSSES.TYPES[bossId];
        if (!this.validateBossDefinition(definition) || definition.id !== bossId) {
          console.error(`DataContracts: invalid boss definition "${bossId}".`, definition);
          valid = false;
        }
      }
    }

    if (!CONFIG.MERGE || !CONFIG.MERGE.RECIPES) {
      console.error("DataContracts: CONFIG.MERGE.RECIPES is missing.");
      valid = false;
    } else {
      for (const recipeId in CONFIG.MERGE.RECIPES) {
        const recipe = CONFIG.MERGE.RECIPES[recipeId];
        if (!this.validateMergeDefinition(recipe) || recipe.id !== recipeId) {
          console.error(`DataContracts: invalid merge definition "${recipeId}".`, recipe);
          valid = false;
        }
      }
    }

    return valid;
  },
};

DataContracts.validateConfig();
