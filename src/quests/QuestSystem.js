/**
 * QuestSystem.js — Phase 12: Quests.
 * Owns quest state, progress, completion, and claimed-reward state.
 * Quest content is data-driven in CONFIG.QUESTS.
 */
const QuestSystem = {
  initialized: false,
  state: null,
  _boundEvents: [],
  _pendingClaims: new Set(),

  init(gameState) {
    this.detach();
    this.state = gameState || null;
    this.initialized = Boolean(this.state);
    this._normalize();
    this._attach();
    return this;
  },

  detach() {
    if (typeof EventBus !== "undefined" && EventBus && typeof EventBus.off === "function") {
      for (const [name, listener] of this._boundEvents) EventBus.off(name, listener);
    }
    this._boundEvents = [];
    this._pendingClaims = new Set();
  },

  _definitions() {
    return typeof CONFIG !== "undefined" && CONFIG.QUESTS && CONFIG.QUESTS.TYPES ? CONFIG.QUESTS.TYPES : {};
  },

  _normalizeIds(value) {
    return Array.isArray(value) ? [...new Set(value.filter(id => typeof id === "string" && id.length > 0))] : [];
  },

  _normalize() {
    if (!this.state) return;
    this.state.quests ||= {};
    this.state.quests.active = this.state.quests.active && typeof this.state.quests.active === "object" && !Array.isArray(this.state.quests.active) ? this.state.quests.active : {};
    this.state.quests.completed = this._normalizeIds(this.state.quests.completed);
    this.state.quests.claimed = this._normalizeIds(this.state.quests.claimed);
    const defs = this._definitions();
    for (const id of Object.keys(this.state.quests.active)) {
      const def = defs[id];
      const entry = this.state.quests.active[id];
      if (!def || !entry || !Number.isSafeInteger(entry.progress) || entry.progress < 0) delete this.state.quests.active[id];
      else entry.progress = Math.min(def.target, entry.progress);
    }
    const starting = CONFIG.QUESTS && Array.isArray(CONFIG.QUESTS.STARTING_QUEST_IDS) ? CONFIG.QUESTS.STARTING_QUEST_IDS : [];
    for (const id of starting) this._ensureActive(id);
    for (const id of this.state.quests.completed) {
      if (this.state.quests.claimed.includes(id)) continue;
      const def = defs[id];
      if (def && !this.state.quests.active[id]) this.state.quests.active[id] = { progress: def.target, completed: true };
    }
  },

  _ensureActive(id) {
    if (!this.state || !id) return false;
    const def = this._definitions()[id];
    if (!def) return false;
    if (this.state.quests.completed.includes(id) || this.state.quests.claimed.includes(id)) return false;
    if (!this.state.quests.active[id]) {
      this.state.quests.active[id] = { progress: 0, completed: false };
      this._emit("QuestStateChanged", { questId: id, progress: 0, target: def.target, completed: false, claimed: false });
    }
    return true;
  },

  _attach() {
    if (!this.initialized || typeof EventBus === "undefined" || !EventBus || typeof EventBus.on !== "function") return;
    const types = [...new Set(Object.values(this._definitions()).map(d => d.type).filter(Boolean))];
    for (const eventName of types) {
      const listener = payload => this._onEvent(eventName, payload || {});
      EventBus.on(eventName, listener);
      this._boundEvents.push([eventName, listener]);
    }
  },

  _matches(def, payload) {
    if (!def.match) return true;
    for (const [key, expected] of Object.entries(def.match)) {
      if (payload[key] !== expected) return false;
    }
    return true;
  },

  _eventAmount(def, payload) {
    if (def.type === "ItemAcquired") return Math.max(0, Number(payload.amount) || 0);
    return 1;
  },

  _onEvent(eventName, payload) {
    if (!this.initialized) return;
    for (const [id, def] of Object.entries(this._definitions())) {
      if (def.type !== eventName || !this._matches(def, payload)) continue;
      if (!this.state.quests.active[id]) this._ensureActive(id);
      const entry = this.state.quests.active[id];
      if (!entry || entry.completed || this.state.quests.claimed.includes(id)) continue;
      const amount = this._eventAmount(def, payload);
      if (amount <= 0) continue;
      const previous = entry.progress;
      entry.progress = Math.min(def.target, previous + amount);
      if (entry.progress !== previous) {
        this._emit("QuestProgressChanged", { questId: id, progress: entry.progress, target: def.target, eventType: eventName, amount });
      }
      if (!entry.completed && entry.progress >= def.target) this._complete(id);
    }
  },

  _complete(id) {
    const def = this._definitions()[id];
    const entry = this.state && this.state.quests && this.state.quests.active[id];
    if (!def || !entry || entry.completed) return false;
    entry.completed = true;
    if (!this.state.quests.completed.includes(id)) this.state.quests.completed.push(id);
    this._emit("QuestCompleted", { questId: id, name: def.name, target: def.target, rewards: this.getReward(id) });
    this._emit("QuestStateChanged", this.getState(id));
    return true;
  },

  getReward(id) {
    const def = this._definitions()[id];
    if (!def) return { currency: 0, xp: 0 };
    const reward = {};
    if (Number.isFinite(def.rewards.currency) && def.rewards.currency > 0) reward.currency = Math.floor(def.rewards.currency);
    if (Number.isFinite(def.rewards.xp) && def.rewards.xp > 0) reward.xp = Math.floor(def.rewards.xp);
    if (def.rewards.item) reward.item = { itemId: def.rewards.item.itemId, amount: def.rewards.item.amount };
    return reward;
  },

  getState(id) {
    const def = this._definitions()[id];
    const entry = this.state && this.state.quests && this.state.quests.active[id];
    if (!def || !entry) return null;
    return { questId: id, name: def.name, description: def.description || "", type: def.type, progress: entry.progress, target: def.target, completed: Boolean(entry.completed), claimed: this.state.quests.claimed.includes(id), rewards: this.getReward(id) };
  },

  getQuests() {
    if (!this.initialized) return [];
    return Object.keys(this.state.quests.active).map(id => this.getState(id)).filter(Boolean);
  },

  claimQuestReward(id) {
    if (!this.initialized || typeof id !== "string") return false;
    const state = this.getState(id);
    if (!state || !state.completed || state.claimed || this._pendingClaims.has(id)) return false;
    this._pendingClaims.add(id);
    this._emit("QuestRewardClaimRequested", { questId: id, rewards: state.rewards });
    return true;
  },

  confirmRewardClaim(id) {
    if (!this.initialized || typeof id !== "string") return false;
    const state = this.getState(id);
    if (!state || !state.completed || state.claimed || !this._pendingClaims.has(id)) return false;
    this._pendingClaims.delete(id);
    this.state.quests.claimed.push(id);
    delete this.state.quests.active[id];
    this._emit("QuestRewardClaimed", { questId: id, rewards: state.rewards });
    this._emit("QuestStateChanged", { questId: id, claimed: true, completed: true });
    return true;
  },

  serialize() {
    if (!this.initialized) return { active: {}, completed: [], claimed: [] };
    this._normalize();
    const active = {};
    for (const [id, entry] of Object.entries(this.state.quests.active)) {
      active[id] = { progress: entry.progress, completed: Boolean(entry.completed) };
    }
    return { active, completed: [...this.state.quests.completed], claimed: [...this.state.quests.claimed] };
  },

  load(data) {
    if (!this.state) return false;
    this.state.quests = { active: {}, completed: [], claimed: [] };
    if (!data || typeof data !== "object") { this._normalize(); return false; }
    this.state.quests.completed = this._normalizeIds(data.completed);
    this.state.quests.claimed = this._normalizeIds(data.claimed);
    const defs = this._definitions();
    if (data.active && typeof data.active === "object" && !Array.isArray(data.active)) {
      for (const [id, entry] of Object.entries(data.active)) {
        const def = defs[id];
        if (!def || !entry || !Number.isSafeInteger(entry.progress) || entry.progress < 0) continue;
        if (this.state.quests.claimed.includes(id)) continue;
        this.state.quests.active[id] = { progress: Math.min(def.target, entry.progress), completed: Boolean(entry.completed) || entry.progress >= def.target };
      }
    }
    this._normalize();
    return true;
  },

  _emit(name, payload) {
    if (typeof EventBus !== "undefined" && EventBus && typeof EventBus.emit === "function") EventBus.emit(name, payload);
  },
};

if (typeof globalThis !== "undefined") globalThis.QuestSystem = QuestSystem;
