/**
 * ProgressionSystem.js — Phase 7
 * Classic-script singleton. Owns long-term progression rules and
 * synchronizes them into the serializable GameState boundary.
 */
const ProgressionSystem = {
  initialized: false,
  state: null,

  init(gameState) {
    this.state = gameState || null;
    this.initialized = Boolean(this.state);
    this._normalize();
    this.refreshUnlocks();
    return this;
  },

  _config() {
    const fallback = {
      STARTING_LEVEL: 1,
      STARTING_XP: 0,
      XP_PER_LEVEL_BASE: 100,
      WAVE_XP_BASE: 25,
      WAVE_XP_PER_WAVE: 10,
      UNLOCKS: [],
    };
    if (typeof CONFIG === 'undefined' || !CONFIG || !CONFIG.PROGRESSION) {
      return fallback;
    }
    return { ...fallback, ...CONFIG.PROGRESSION };
  },

  _safeNonNegative(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(0, n) : fallback;
  },

  _normalize() {
    if (!this.state) return;

    const config = this._config();
    const p = this.state.player || (this.state.player = {});
    p.level = Math.max(1, Math.floor(this._safeNonNegative(p.level, config.STARTING_LEVEL) || config.STARTING_LEVEL));
    p.xp = this._safeNonNegative(p.xp, config.STARTING_XP);

    this.state.unlocked ||= {};
    this.state.unlocked.areas = this._normalizeIds(this.state.unlocked.areas);
    this.state.unlocked.defenses = this._normalizeIds(this.state.unlocked.defenses);
    this.state.unlocked.systems = this._normalizeIds(this.state.unlocked.systems);

    this.state.progression ||= {};
    this.state.progression.completedMilestones = this._normalizeIds(
      this.state.progression.completedMilestones
    );

    // Existing saves may contain a large XP remainder. Resolve it using the
    // same deterministic level curve rather than leaving an impossible state.
    this._normalizeLevelProgress();
  },

  _normalizeIds(value) {
    return Array.isArray(value)
      ? [...new Set(value.filter((id) => typeof id === 'string' && id.length > 0))]
      : [];
  },

  _normalizeLevelProgress() {
    if (!this.state) return;

    let guard = 0;
    while (this.state.player.xp >= this.xpToNextLevel() && guard < 10000) {
      const required = this.xpToNextLevel();
      this.state.player.xp -= required;
      this.state.player.level += 1;
      guard += 1;
    }
  },

  xpToNextLevel(level = null) {
    const config = this._config();
    const current = level == null
      ? (this.state?.player?.level ?? config.STARTING_LEVEL)
      : level;
    const normalizedLevel = Math.max(1, Math.floor(this._safeNonNegative(current, config.STARTING_LEVEL)));
    return Math.max(1, normalizedLevel * this._safeNonNegative(config.XP_PER_LEVEL_BASE, 100));
  },

  addXP(amount = 0, reason = 'unknown') {
    if (!this.state) {
      return { level: 1, xp: 0, levelsGained: 0, unlocked: [] };
    }

    this._normalize();
    const value = this._safeNonNegative(amount);
    const before = this.state.player.level;
    this.state.player.xp += value;
    this._normalizeLevelProgress();

    const unlocked = this.refreshUnlocks();

    if (typeof EventBus !== 'undefined' && EventBus) {
      EventBus.emit('ProgressionChanged', {
        level: this.state.player.level,
        xp: this.state.player.xp,
        xpRequired: this.xpToNextLevel(),
        levelsGained: this.state.player.level - before,
        amount: value,
        reason: typeof reason === 'string' ? reason : 'unknown',
        unlocked,
      });
    }

    return {
      level: this.state.player.level,
      xp: this.state.player.xp,
      levelsGained: this.state.player.level - before,
      unlocked,
    };
  },

  awardWaveCompletion(wave) {
    const config = this._config();
    const n = Math.max(1, Math.floor(this._safeNonNegative(wave, 1) || 1));
    const base = this._safeNonNegative(config.WAVE_XP_BASE, 25);
    const perWave = this._safeNonNegative(config.WAVE_XP_PER_WAVE, 10);
    return this.addXP(base + (n - 1) * perWave, 'wave-complete');
  },

  refreshUnlocks() {
    if (!this.state) return [];
    this._normalizeArraysOnly();

    const level = this.state.player.level;
    const newlyUnlocked = [];
    const unlocks = Array.isArray(this._config().UNLOCKS) ? this._config().UNLOCKS : [];

    for (const entry of unlocks) {
      if (!entry || typeof entry.id !== 'string' || !entry.id) continue;
      const requiredLevel = Math.max(1, Math.floor(this._safeNonNegative(entry.level, 1) || 1));
      if (level < requiredLevel) continue;

      let bucket;
      if (entry.type === 'areas') bucket = this.state.unlocked.areas;
      else if (entry.type === 'defenses') bucket = this.state.unlocked.defenses;
      else if (entry.type === 'systems') bucket = this.state.unlocked.systems;
      else if (entry.type === 'milestones') bucket = this.state.progression.completedMilestones;
      else continue;

      if (!bucket.includes(entry.id)) {
        bucket.push(entry.id);
        newlyUnlocked.push(entry.id);
      }
    }

    return newlyUnlocked;
  },

  _normalizeArraysOnly() {
    this.state.unlocked ||= {};
    this.state.unlocked.areas = this._normalizeIds(this.state.unlocked.areas);
    this.state.unlocked.defenses = this._normalizeIds(this.state.unlocked.defenses);
    this.state.unlocked.systems = this._normalizeIds(this.state.unlocked.systems);
    this.state.progression ||= {};
    this.state.progression.completedMilestones = this._normalizeIds(
      this.state.progression.completedMilestones
    );
  },

  isUnlocked(type, id) {
    if (!this.state || !id) return false;
    this._normalizeArraysOnly();
    const bucket = {
      areas: this.state.unlocked.areas,
      defenses: this.state.unlocked.defenses,
      systems: this.state.unlocked.systems,
      milestones: this.state.progression.completedMilestones,
    }[type];
    return Array.isArray(bucket) && bucket.includes(id);
  },

  serialize() {
    if (!this.state) return null;
    this._normalize();
    return {
      level: this.state.player.level,
      experience: this.state.player.xp,
      unlockedMaps: [...this.state.unlocked.areas],
      unlockedSystems: [...this.state.unlocked.systems],
      unlockedDefenses: [...this.state.unlocked.defenses],
      completedMilestones: [...this.state.progression.completedMilestones],
    };
  },

  load(data = {}) {
    if (!this.state) return false;

    this._normalizeArraysOnly();
    const config = this._config();
    this.state.player.level = Math.max(1, Math.floor(this._safeNonNegative(data.level, config.STARTING_LEVEL) || config.STARTING_LEVEL));
    this.state.player.xp = this._safeNonNegative(data.experience, config.STARTING_XP);
    this.state.unlocked.areas = this._normalizeIds(data.unlockedMaps);
    this.state.unlocked.defenses = this._normalizeIds(data.unlockedDefenses);
    this.state.unlocked.systems = this._normalizeIds(data.unlockedSystems);
    this.state.progression.completedMilestones = this._normalizeIds(data.completedMilestones);

    this._normalize();
    this.refreshUnlocks();
    return true;
  },
};

if (typeof globalThis !== 'undefined') globalThis.ProgressionSystem = ProgressionSystem;
