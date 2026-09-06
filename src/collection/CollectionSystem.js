/** CollectionSystem.js — Phase 9: authoritative collection owner. */
const CollectionSystem = {
  initialized: false,
  state: null,
  init(gameState) {
    this.state = gameState || null;
    this.initialized = Boolean(this.state);
    if (!this.state) return this;
    this._ensureState();
    this.refreshUnlocks();
    return this;
  },
  _config() {
    const fallback = { MAX_ITEM_QUANTITY: 999999, MAX_UPGRADE_LEVEL: 50, RARITIES: [], ITEMS: {} };
    if (typeof CONFIG === 'undefined' || !CONFIG.COLLECTION) return fallback;
    return { ...fallback, ...CONFIG.COLLECTION };
  },
  _definitions() {
    const d = this._config().ITEMS;
    return d && typeof d === 'object' && !Array.isArray(d) ? d : {};
  },
  _normalizeIds(value) {
    return Array.isArray(value) ? [...new Set(value.filter(id => typeof id === 'string' && id.trim()))] : [];
  },
  getDefinition(itemId) {
    if (typeof itemId !== 'string' || !itemId.trim()) return null;
    const def = this._definitions()[itemId];
    return def && typeof def === 'object' ? def : null;
  },
  getDefinitions() { return { ...this._definitions() }; },
  isKnown(itemId) { return Boolean(this.getDefinition(itemId)); },
  _requiredLevel(def) {
    const n = Number(def?.requiredLevel);
    return Number.isInteger(n) && n > 0 ? n : 1;
  },
  _sanitizeItems(items) {
    const safe = {};
    if (!items || typeof items !== 'object' || Array.isArray(items)) return safe;
    const max = Math.max(1, Math.floor(Number(this._config().MAX_ITEM_QUANTITY) || 999999));
    for (const [id, raw] of Object.entries(items)) {
      if (!this.isKnown(id)) continue;
      const n = Number(raw);
      if (Number.isSafeInteger(n) && n > 0) safe[id] = Math.min(n, max);
    }
    return safe;
  },
  _sanitizeUpgrades(upgrades, ownedItems = this.state?.collection?.items) {
    const safe = {};
    if (!upgrades || typeof upgrades !== 'object' || Array.isArray(upgrades)) return safe;
    const globalMax = Math.max(1, Math.floor(Number(this._config().MAX_UPGRADE_LEVEL) || 50));
    for (const [id, raw] of Object.entries(upgrades)) {
      const def = this.getDefinition(id); const n = Number(raw);
      if (!def || !Number.isInteger(n) || n < 1) continue;
      const owned = ownedItems && Number(ownedItems[id]) > 0;
      if (!owned) continue;
      const max = Math.min(globalMax, Math.max(1, Number(def.maxUpgradeLevel) || 1));
      safe[id] = Math.min(n, max);
    }
    return safe;
  },
  _ensureState() {
    if (!this.state) return null;
    this.state.collection ||= {};
    this.state.collection.items = this._sanitizeItems(this.state.collection.items);
    this.state.collection.unlocked = this._normalizeIds(this.state.collection.unlocked);
    this.state.collection.upgrades = this._sanitizeUpgrades(this.state.collection.upgrades);
    return this.state.collection;
  },
  isUnlocked(itemId) {
    const def = this.getDefinition(itemId); if (!def || !this.state) return false;
    const c = this._ensureState();
    return def.unlockedByDefault === true || this._requiredLevel(def) <= Number(this.state.player?.level || 1) || c.unlocked.includes(itemId);
  },
  refreshUnlocks() {
    if (!this.state) return [];
    const c = this._ensureState(); const newly = [];
    for (const [id, def] of Object.entries(this._definitions())) {
      const should = def?.unlockedByDefault === true || this._requiredLevel(def) <= Number(this.state.player?.level || 1);
      if (should && !c.unlocked.includes(id)) { c.unlocked.push(id); newly.push(id); }
    }
    if (newly.length && typeof EventBus !== 'undefined') EventBus.emit('CollectionUnlocksChanged', { unlocked: [...newly] });
    return newly;
  },
  getQuantity(itemId) { const c=this._ensureState(); return c && this.isKnown(itemId) ? (c.items[itemId] || 0) : 0; },
  getUpgradeLevel(itemId) { const c=this._ensureState(); return c && this.isKnown(itemId) ? (c.upgrades[itemId] || 0) : 0; },
  getSnapshot() { const c=this._ensureState(); return c ? { items:{...c.items}, unlocked:[...c.unlocked], upgrades:{...c.upgrades} } : {items:{},unlocked:[],upgrades:{}}; },
  addQuantity(itemId, amount=0, reason='system') {
    const def = this.getDefinition(itemId);
    if (!this.state || !def || !this.isUnlocked(itemId)) return false;
    const n=Number(amount); if (!Number.isSafeInteger(n) || n<=0) return false;
    const c=this._ensureState(); const globalMax=Math.max(1,Math.floor(Number(this._config().MAX_ITEM_QUANTITY)||999999)); const max=def.stackable===false?1:globalMax; const next=(c.items[itemId]||0)+n;
    if (!Number.isSafeInteger(next) || next>max) return false;
    c.items[itemId]=next;
    if (typeof EventBus!=='undefined') { EventBus.emit('ItemAcquired',{itemId,amount:n,reason,quantity:next}); EventBus.emit('CollectionChanged',{itemId,amount:n,reason,quantity:next}); }
    return true;
  },
  removeQuantity(itemId, amount=0, reason='system') {
    if (!this.state || !this.isKnown(itemId)) return false;
    const n=Number(amount); if (!Number.isSafeInteger(n) || n<=0) return false;
    const c=this._ensureState(); const current=c.items[itemId]||0; if (current<n) return false;
    const next=current-n; if(next>0)c.items[itemId]=next;else delete c.items[itemId];
    if (typeof EventBus!=='undefined') { EventBus.emit('ItemConsumed',{itemId,amount:n,reason,quantity:next}); EventBus.emit('CollectionChanged',{itemId,amount:-n,reason,quantity:next}); }
    return true;
  },
  canConsume(requirements={}) {
    if (!requirements || typeof requirements!=='object' || Array.isArray(requirements)) return false;
    for(const [id,raw] of Object.entries(requirements)){const n=Number(raw); if(!this.isKnown(id)||!this.isUnlocked(id)||!Number.isSafeInteger(n)||n<=0||this.getQuantity(id)<n)return false;}
    return true;
  },
  isMergeEligible(itemId){const d=this.getDefinition(itemId);return Boolean(d&&d.mergeEligible===true&&this.isUnlocked(itemId));},
  setUpgradeLevel(itemId, level, reason='system') {
    const def=this.getDefinition(itemId); if(!def||!this.state||!this.isUnlocked(itemId)||this.getQuantity(itemId)<=0)return false; const n=Number(level); if(!Number.isInteger(n)||n<1)return false;
    const max=Math.min(Math.max(1,Math.floor(Number(this._config().MAX_UPGRADE_LEVEL)||50)),Math.max(1,Number(def.maxUpgradeLevel)||1)); if(n>max)return false;
    this._ensureState().upgrades[itemId]=n; if(typeof EventBus!=='undefined'){EventBus.emit('CollectionUpgradeChanged',{itemId,level:n,reason});EventBus.emit('CollectionChanged',{itemId,level:n,reason,upgrade:true});} return true;
  },
  serialize(){return this.getSnapshot();},
  load(data){if(!this.state)return false;if(!data||typeof data!=='object'){this.init(this.state);return false;}const items=this._sanitizeItems(data.items); this.state.collection={items,unlocked:this._normalizeIds(data.unlocked),upgrades:this._sanitizeUpgrades(data.upgrades, items)};this.refreshUnlocks();return true;},
};
if(typeof globalThis!=='undefined')globalThis.CollectionSystem=CollectionSystem;
