/**
 * BossSystem.js — Phase 10: Bosses.
 * Bosses remain ordinary Enemy instances; this system owns only boss mechanics.
 */
const BossSystem = {
  initialized: false,
  activeBossId: null,
  phase: 0,
  enraged: false,
  _abilityTimer: 0,
  _boundOnSpawn: null,
  _boundOnDamaged: null,
  _boundOnDeath: null,
  _boundOnReachedBase: null,
  _boundOnBaseDestroyed: null,

  init() {
    this.reset();
    if (typeof EventBus === "undefined" || !EventBus || typeof EventBus.on !== "function") {
      this.initialized = true;
      return this;
    }
    this._boundOnSpawn = (payload) => this._onEnemySpawned(payload);
    this._boundOnDamaged = (payload) => this._onEnemyDamaged(payload);
    this._boundOnDeath = (payload) => this._onEnemyDied(payload);
    this._boundOnReachedBase = (payload) => {
      if (payload && payload.enemyId === this.activeBossId) this.reset();
    };
    this._boundOnBaseDestroyed = () => this.reset();
    EventBus.on("EnemySpawned", this._boundOnSpawn);
    EventBus.on("EnemyDamaged", this._boundOnDamaged);
    EventBus.on("EnemyDied", this._boundOnDeath);
    EventBus.on("EnemyReachedBase", this._boundOnReachedBase);
    EventBus.on("BaseDestroyed", this._boundOnBaseDestroyed);
    this.initialized = true;
    return this;
  },

  reset() {
    this.activeBossId = null;
    this.phase = 0;
    this.enraged = false;
    this._abilityTimer = 0;
  },

  isBossWave(wave) {
    const interval = Number(CONFIG && CONFIG.BOSSES ? CONFIG.BOSSES.WAVE_INTERVAL : 0);
    return Number.isInteger(wave) && wave > 0 && interval > 0 && wave % interval === 0;
  },

  isActive() {
    return this._getActiveBoss() !== null;
  },

  _getDefinition(id) {
    return CONFIG && CONFIG.BOSSES && CONFIG.BOSSES.TYPES ? CONFIG.BOSSES.TYPES[id] || null : null;
  },

  _getActiveBoss() {
    if (!this.activeBossId || typeof EnemyManager === "undefined" || !EnemyManager || typeof EnemyManager.getEnemyById !== "function") return null;
    return EnemyManager.getEnemyById(this.activeBossId) || null;
  },

  createSpawnData(waveNumber) {
    const B = CONFIG.BOSSES;
    const base = B.TYPES[B.DEFAULT_ID];
    const S = B.SCALING;
    const index = Math.max(0, Number(waveNumber) - 1);
    return {
      name: base.name,
      type: base.type,
      isBoss: true,
      bossId: base.id,
      maxHp: Math.round(base.maxHp * Math.pow(1 + S.HP_PER_BOSS_WAVE, index)),
      speed: Number((base.speed * (1 + S.SPEED_PER_BOSS_WAVE * index)).toFixed(2)),
      armor: Number((base.armor + Math.floor(index / 2) * S.ARMOR_PER_BOSS_WAVE).toFixed(2)),
      resistance: base.resistance,
      damage: Math.round(base.damage * (1 + S.DAMAGE_PER_BOSS_WAVE * index)),
      reward: Math.round(base.reward * (1 + S.REWARD_PER_BOSS_WAVE * index)),
    };
  },

  configureEnemy(enemy) {
    if (!enemy || !enemy.isBoss) return false;
    const def = this._getDefinition(enemy.bossId);
    if (!def) return false;
    enemy.bossPhase = 1;
    enemy.bossMaxPhases = def.phases.length;
    enemy.bossPhaseThresholds = def.phases.map((p) => p.threshold);
    enemy.bossAbilityCooldown = def.ability.cooldown;
    enemy.bossAbilityDamage = def.ability.baseDamage;
    enemy.damageMultiplier = def.phases[0].damageMultiplier;
    enemy.speedMultiplier = def.phases[0].speedMultiplier;
    this.activeBossId = enemy.id;
    this.phase = 1;
    this.enraged = false;
    this._abilityTimer = enemy.bossAbilityCooldown;
    const uiData = this.getUIData();
    this._emit("BossSpawned", uiData);
    this._emit("BossVFXRequested", { bossId: enemy.bossId, enemyId: enemy.id, effect: "boss_spawn" });
    this._emit("BossAudioRequested", { bossId: enemy.bossId, enemyId: enemy.id, cue: "boss_spawn" });
    return true;
  },

  _onEnemySpawned(payload) {
    if (!payload || !payload.enemyId || typeof EnemyManager === "undefined") return;
    const enemy = EnemyManager.getEnemyById(payload.enemyId);
    if (enemy && enemy.isBoss) this.configureEnemy(enemy);
  },

  _onEnemyDamaged(payload) {
    if (!payload || payload.enemyId !== this.activeBossId) return;
    const boss = this._getActiveBoss();
    if (!boss || !boss.alive) return;
    this._updatePhase(boss);
  },

  _onEnemyDied(payload) {
    if (!payload || payload.enemyId !== this.activeBossId) return;
    const boss = this._getActiveBoss();
    const defeatPayload = {
      bossId: boss ? boss.bossId : CONFIG.BOSSES.DEFAULT_ID,
      enemyId: payload.enemyId,
      reward: boss ? boss.reward : 0,
      wave: typeof WaveManager !== "undefined" ? WaveManager.currentWave : 0,
      phase: this.phase,
      enraged: this.enraged,
    };
    this._emit("BossDefeated", defeatPayload);
    this._emit("BossVFXRequested", { bossId: defeatPayload.bossId, enemyId: defeatPayload.enemyId, effect: "boss_defeat" });
    this._emit("BossAudioRequested", { bossId: defeatPayload.bossId, enemyId: defeatPayload.enemyId, cue: "boss_defeat" });
    this.reset();
  },

  _updatePhase(boss) {
    const def = this._getDefinition(boss.bossId);
    if (!def) return;
    const ratio = boss.getHpRatio();
    let nextPhase = 1;
    for (let i = 0; i < def.phases.length; i += 1) {
      if (ratio <= def.phases[i].threshold) nextPhase = i + 1;
    }
    if (nextPhase > this.phase) {
      this.phase = nextPhase;
      const phaseDef = def.phases[nextPhase - 1];
      boss.damageMultiplier = phaseDef.damageMultiplier;
      boss.speedMultiplier = phaseDef.speedMultiplier;
      const phasePayload = {
        bossId: boss.bossId,
        enemyId: boss.id,
        phase: this.phase,
        threshold: phaseDef.threshold,
      };
      this._emit("BossPhaseChanged", phasePayload);
      this._emit("BossVFXRequested", { bossId: boss.bossId, enemyId: boss.id, effect: "boss_phase_change", phase: this.phase });
      this._emit("BossAudioRequested", { bossId: boss.bossId, enemyId: boss.id, cue: "boss_phase_change", phase: this.phase });
    }
    if (!this.enraged && ratio <= def.enrage.threshold) {
      this.enraged = true;
      boss.damageMultiplier = (boss.damageMultiplier || 1) * def.enrage.damageMultiplier;
      boss.speedMultiplier = (boss.speedMultiplier || 1) * def.enrage.speedMultiplier;
      const enragePayload = { bossId: boss.bossId, enemyId: boss.id, phase: this.phase };
      this._emit("BossEnraged", enragePayload);
      this._emit("BossVFXRequested", { bossId: boss.bossId, enemyId: boss.id, effect: "boss_enrage", phase: this.phase });
      this._emit("BossAudioRequested", { bossId: boss.bossId, enemyId: boss.id, cue: "boss_enrage", phase: this.phase });
    }
  },

  update(delta = 0) {
    if (!this.initialized) return;
    const boss = this._getActiveBoss();
    if (!boss || !boss.alive || boss.hasReachedBase()) {
      return;
    }
    this._updatePhase(boss);
    this._abilityTimer -= Math.max(0, Number(delta) || 0);
    if (this._abilityTimer > 0) return;
    const def = this._getDefinition(boss.bossId);
    if (!def) return;
    const abilityPayload = {
      bossId: boss.bossId,
      enemyId: boss.id,
      abilityId: def.ability.id,
      damage: Math.max(0, Number(boss.bossAbilityDamage) || 0),
      damageToBase: Math.max(0, Number(def.ability.baseDamageToBase) || 0) * (this.enraged ? Math.max(0.1, Number(def.ability.enrageDamageMultiplier) || 1) : 1),
      phase: this.phase,
      enraged: this.enraged,
    };
    this._emit("BossAbilityTriggered", abilityPayload);
    this._emit("BossVFXRequested", { bossId: boss.bossId, enemyId: boss.id, effect: "boss_ability", abilityId: def.ability.id });
    this._emit("BossAudioRequested", { bossId: boss.bossId, enemyId: boss.id, cue: "boss_ability", abilityId: def.ability.id });
    this._abilityTimer = Math.max(0.1, Number(def.ability.cooldown) || 1);
  },

  getUIData() {
    const boss = this._getActiveBoss();
    if (!boss || !boss.alive || boss.hasReachedBase()) {
      return { active: false, bossId: null, name: null, hp: 0, maxHp: 0, ratio: 0, phase: 0, enraged: false, abilityReadyIn: 0 };
    }
    return {
      active: true,
      bossId: boss.bossId,
      name: boss.name,
      hp: Math.max(0, Number(boss.hp) || 0),
      maxHp: Math.max(0, Number(boss.maxHp) || 0),
      ratio: boss.getHpRatio(),
      phase: this.phase,
      enraged: this.enraged,
      abilityReadyIn: Math.max(0, this._abilityTimer),
    };
  },

  _emit(name, payload) {
    if (typeof EventBus !== "undefined" && EventBus && typeof EventBus.emit === "function") EventBus.emit(name, payload);
  },
};

if (typeof globalThis !== "undefined") globalThis.BossSystem = BossSystem;
