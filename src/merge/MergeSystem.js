/**
 * MergeSystem.js — Phase 8/9
 * ---------------------------
 * Owns deterministic merge rules/execution.
 * CollectionSystem owns collection state; MergeSystem never becomes a
 * second inventory authority in the runtime.
 */
const MergeSystem = {
  initialized: false,
  state: null,

  init(gameState) {
    this.state = gameState || null;
    this.initialized = Boolean(this.state);
    if (typeof CollectionSystem !== 'undefined' && CollectionSystem && CollectionSystem.init) {
      CollectionSystem.init(this.state);
    }
    return this;
  },

  _config() {
    return (typeof CONFIG !== 'undefined' && CONFIG.MERGE) || { RECIPES: {} };
  },

  _items() {
    if (typeof CollectionSystem !== 'undefined' && CollectionSystem && CollectionSystem.state) {
      return CollectionSystem.state.collection.items;
    }
    this.state ||= null;
    this.state ||= { collection: { items: {} } };
    this.state.collection ||= { items: {} };
    const raw=this.state.collection.items; const safe={};
    if(raw && typeof raw==='object' && !Array.isArray(raw)) for(const [id,q] of Object.entries(raw)){const n=Number(q); if(typeof id==='string'&&id.trim()&&Number.isInteger(n)&&n>0)safe[id]=n;}
    this.state.collection.items=safe;
    return safe;
  },

  getQuantity(itemId) {
    if (typeof CollectionSystem !== 'undefined' && CollectionSystem.getQuantity) return CollectionSystem.getQuantity(itemId);
    return this._items()[itemId] || 0;
  },

  getSnapshot() {
    if (typeof CollectionSystem !== 'undefined' && CollectionSystem.getSnapshot && CollectionSystem.state) return { ...CollectionSystem.getSnapshot().items };
    return { ...this._items() };
  },

  grant(itemId, amount = 0, reason = 'system') {
    if (typeof CollectionSystem !== 'undefined' && CollectionSystem.addQuantity && CollectionSystem.state) {
      return CollectionSystem.addQuantity(itemId, amount, reason);
    }
    if (typeof itemId !== 'string' || !itemId.trim()) return false;
    const n = Number(amount);
    if (!Number.isInteger(n) || n <= 0) return false;
    const items = this._items();
    const next = (items[itemId] || 0) + n;
    if (!Number.isSafeInteger(next)) return false;
    items[itemId] = next;
    if (typeof EventBus !== 'undefined') {
      EventBus.emit('ItemAcquired', { itemId, amount: n, reason });
      EventBus.emit('CollectionChanged', { itemId, amount: n, reason, quantity: next });
    }
    return true;
  },

  getRecipe(recipeId) {
    if (typeof recipeId !== 'string' || !recipeId.trim()) return null;
    return this._config().RECIPES[recipeId] || null;
  },

  _reject(recipeId, reason, details = {}) {
    if (typeof EventBus !== 'undefined') EventBus.emit('MergeRejected', { recipeId, reason, ...details });
    return { ok: false, reason, recipeId, ...details };
  },

  canMerge(recipeId) {
    const recipe = this.getRecipe(recipeId);
    if (!recipe) return { ok: false, reason: 'unknown_recipe', recipeId };
    if (typeof DataContracts === 'undefined' || !DataContracts.validateMergeDefinition(recipe)) return { ok: false, reason: 'invalid_definition', recipeId };

    const level = this.state && this.state.player ? Number(this.state.player.level) : 0;
    if (!Number.isInteger(level) || level < recipe.requiredLevel) {
      return { ok: false, reason: 'insufficient_level', recipeId, requiredLevel: recipe.requiredLevel, level };
    }

    if (typeof CollectionSystem !== 'undefined' && CollectionSystem.state) {
      for (const [itemId, needed] of Object.entries(recipe.inputs)) {
        if (!CollectionSystem.isKnown(itemId)) return { ok: false, reason: 'unknown_input', recipeId, itemId };
        if (!CollectionSystem.isUnlocked(itemId)) return { ok: false, reason: 'input_locked', recipeId, itemId };
      }
      if (!CollectionSystem.isKnown(recipe.result.itemId)) return { ok: false, reason: 'unknown_result', recipeId, itemId: recipe.result.itemId };
      if (!CollectionSystem.isUnlocked(recipe.result.itemId)) return { ok: false, reason: 'result_locked', recipeId, itemId: recipe.result.itemId };
      if (!CollectionSystem.isMergeEligible(recipe.result.itemId)) return { ok: false, reason: 'result_not_merge_eligible', recipeId, itemId: recipe.result.itemId };
      if (!CollectionSystem.canConsume(recipe.inputs)) {
        const first = Object.entries(recipe.inputs).find(([itemId, needed]) => CollectionSystem.getQuantity(itemId) < needed);
        return { ok: false, reason: 'insufficient_items', recipeId, itemId: first?.[0], needed: first?.[1], owned: first ? CollectionSystem.getQuantity(first[0]) : 0 };
      }
    } else {
      const items = this._items();
      for (const [itemId, needed] of Object.entries(recipe.inputs)) {
        const owned = items[itemId] || 0;
        if (owned < needed) return { ok: false, reason: 'insufficient_items', recipeId, itemId, needed, owned };
      }
    }

    if (typeof EconomySystem === 'undefined') return { ok: false, reason: 'economy_unavailable', recipeId };
    if (!EconomySystem.canAfford(recipe.cost)) return { ok: false, reason: 'insufficient_currency', recipeId, cost: recipe.cost };
    return { ok: true, recipe };
  },

  merge(recipeId) {
    const check = this.canMerge(recipeId);
    if (!check.ok) return this._reject(recipeId, check.reason, Object.fromEntries(Object.entries(check).filter(([key]) => !['ok', 'reason', 'recipeId'].includes(key))));

    const recipe = check.recipe;
    if (typeof EventBus !== 'undefined') EventBus.emit('MergeStarted', { recipeId, inputs: { ...recipe.inputs }, cost: recipe.cost });

    if (!EconomySystem.spend(recipe.cost)) return this._reject(recipeId, 'currency_transaction_failed', { cost: recipe.cost });

    let consumed = false;
    if (typeof CollectionSystem !== 'undefined' && CollectionSystem.state) {
      consumed = true;
      for (const [itemId, needed] of Object.entries(recipe.inputs)) {
        if (!CollectionSystem.removeQuantity(itemId, needed, `merge:${recipeId}`)) {
          EconomySystem.add(recipe.cost);
          return this._reject(recipeId, 'collection_transaction_failed');
        }
      }
      if (!CollectionSystem.addQuantity(recipe.result.itemId, recipe.result.amount, `merge:${recipeId}`)) {
        EconomySystem.add(recipe.cost);
        for (const [itemId, needed] of Object.entries(recipe.inputs)) CollectionSystem.addQuantity(itemId, needed, `merge_rollback:${recipeId}`);
        return this._reject(recipeId, 'result_overflow');
      }
    } else {
      const items = this._items();
      for (const [itemId, needed] of Object.entries(recipe.inputs)) {
        const next = items[itemId] - needed;
        if (next > 0) items[itemId] = next; else delete items[itemId];
      }
      const resultId = recipe.result.itemId;
      const nextResult = (items[resultId] || 0) + recipe.result.amount;
      if (!Number.isSafeInteger(nextResult)) {
        EconomySystem.add(recipe.cost);
        for (const [itemId, needed] of Object.entries(recipe.inputs)) items[itemId] = (items[itemId] || 0) + needed;
        return this._reject(recipeId, 'result_overflow');
      }
      items[resultId] = nextResult;
    }

    if (typeof ProgressionSystem !== 'undefined' && typeof ProgressionSystem.addXP === 'function' && recipe.xpReward > 0) ProgressionSystem.addXP(recipe.xpReward, `merge:${recipeId}`);

    const payload = { recipeId, inputs: { ...recipe.inputs }, cost: recipe.cost, result: { ...recipe.result }, xpReward: recipe.xpReward };
    if (typeof EventBus !== 'undefined') {
      if (!consumed) EventBus.emit('ItemConsumed', { recipeId, inputs: { ...recipe.inputs } });
      EventBus.emit('CollectionChanged', { recipeId, result: { ...recipe.result } });
      EventBus.emit('MergeCompleted', payload);
    }
    return { ok: true, ...payload };
  },

  serialize() {
    return typeof CollectionSystem !== 'undefined' && CollectionSystem.state ? CollectionSystem.serialize() : { items: this.getSnapshot() };
  },

  load(data) {
    if (!this.state) return false;
    if (typeof CollectionSystem !== 'undefined' && CollectionSystem.load) return CollectionSystem.load(data);
    if (!data || typeof data !== 'object') return false;
    this.state.collection ||= { items: {} };
    this.state.collection.items = { ...data.items };
    return true;
  },
};

if (typeof globalThis !== 'undefined') globalThis.MergeSystem = MergeSystem;
