/**
 * AdvancedWorldSystem.js — Phase 13
 * ----------------------------------
 * Owns the advanced-world slice: NPCs, lightweight story progression,
 * special map rules, and deterministic dynamic world events.
 *
 * Gameplay authority remains outside the UI. State is serializable and is
 * communicated through EventBus; no direct localStorage/DOM access here.
 */
const AdvancedWorldSystem = {
  state: null,
  initialized: false,
  group: null,
  _npcs: [],
  _ruleActive: false,
  _subscriptionsReady: false,

  init(gameState) {
    this.state = gameState || null;
    if (!this.state) return this;

    const cfg = CONFIG.ADVANCED_WORLD || {};
    const source = this.state.advancedWorld || {};
    const npcVisits = source.npcVisits && typeof source.npcVisits === "object" && !Array.isArray(source.npcVisits)
      ? source.npcVisits : {};
    const completedChapters = Array.isArray(source.completedChapters)
      ? [...new Set(source.completedChapters.filter(id => typeof id === "string" && id))] : [];

    this.state.advancedWorld = {
      npcVisits: { ...npcVisits },
      completedChapters,
      activeMapRuleId: typeof source.activeMapRuleId === "string" ? source.activeMapRuleId : null,
      dynamicEventCount: Number.isSafeInteger(source.dynamicEventCount) && source.dynamicEventCount >= 0 ? source.dynamicEventCount : 0,
    };

    this.initialized = true;
    this._ruleActive = false;
    this._subscribe();
    this._emitStateChanged("init");
    return this;
  },

  _subscribe() {
    if (this._subscriptionsReady || typeof EventBus === "undefined") return;
    this._subscriptionsReady = true;

    EventBus.on("WorldEventStarted", payload => {
      if (!payload) return;
      const eventId = payload.eventId;
      const event = (CONFIG.ADVANCED_WORLD.DYNAMIC_EVENTS || []).find(e => e.triggerWorldEventId === eventId);
      if (!event) return;
      this.state.advancedWorld.dynamicEventCount += 1;
      this.state.advancedWorld.activeMapRuleId = event.mapRuleId || null;
      this._ruleActive = Boolean(event.mapRuleId);
      EventBus.emit("AdvancedWorldEventStarted", {
        eventId: event.id,
        sourceWorldEventId: eventId,
        mapRuleId: event.mapRuleId || null,
      });
      this._emitStateChanged("dynamic_event_started");
    });

    EventBus.on("WorldEventEnded", payload => {
      const active = this.state && this.state.advancedWorld ? this.state.advancedWorld.activeMapRuleId : null;
      if (!active) return;
      this.state.advancedWorld.activeMapRuleId = null;
      this._ruleActive = false;
      EventBus.emit("AdvancedWorldEventEnded", {
        eventId: payload && payload.eventId ? payload.eventId : null,
        mapRuleId: active,
      });
      this._emitStateChanged("dynamic_event_ended");
    });

    EventBus.on("WaveCompleted", payload => this._advanceStory("wave_completed", payload));
    EventBus.on("BossDefeated", payload => this._advanceStory("boss_defeated", payload));
  },

  create(scene) {
    if (!scene || typeof THREE === "undefined") return null;
    this.group = new THREE.Group();
    this._npcs = [];
    const defs = (CONFIG.ADVANCED_WORLD && CONFIG.ADVANCED_WORLD.NPCS) || [];
    const groundY = CONFIG.DEFENSE_MAP.GROUND_Y;

    for (const def of defs) {
      if (!def || typeof def.id !== "string") continue;
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(def.radius || 0.65, (def.radius || 0.65) * 1.1, def.height || 1.6, 8),
        new THREE.MeshStandardMaterial({ color: def.color || 0xffffff, roughness: 0.8 })
      );
      body.position.set(def.x || 0, groundY + (def.height || 1.6) / 2, def.z || 0);
      body.castShadow = true;
      body.userData.owner = "advancedWorldNpc";
      body.userData.npcId = def.id;
      this.group.add(body);
      this._npcs.push({ id: def.id, mesh: body });
    }

    scene.add(this.group);
    return this.group;
  },

  getInteractableMeshes() {
    return this._npcs.map(npc => npc.mesh);
  },

  interactNPC(id) {
    if (!this.initialized || !id) return null;
    const def = (CONFIG.ADVANCED_WORLD.NPCS || []).find(npc => npc && npc.id === id);
    if (!def) return null;

    const visits = this.state.advancedWorld.npcVisits;
    visits[id] = (Number.isSafeInteger(visits[id]) && visits[id] >= 0 ? visits[id] : 0) + 1;
    const visit = visits[id];

    EventBus.emit("NPCInteracted", { npcId: id, visitCount: visit });
    this._advanceStory("npc_interacted", { npcId: id, visitCount: visit });
    this._emitStateChanged("npc_interacted");

    return {
      npcId: id,
      name: def.name,
      message: def.dialogue || "...",
      visitCount: visit,
    };
  },

  _advanceStory(trigger, payload) {
    if (!this.initialized) return;
    const chapters = CONFIG.ADVANCED_WORLD.STORY_CHAPTERS || [];
    const completed = this.state.advancedWorld.completedChapters;

    for (const chapter of chapters) {
      if (!chapter || !chapter.id || completed.includes(chapter.id)) continue;
      if (chapter.trigger !== trigger) continue;
      if (chapter.npcId && (!payload || payload.npcId !== chapter.npcId)) continue;
      if (chapter.target && Number(payload && payload.wave) < chapter.target) continue;

      completed.push(chapter.id);
      EventBus.emit("StoryChapterCompleted", {
        chapterId: chapter.id,
        title: chapter.title,
        trigger,
      });
      this._emitStateChanged("story_completed");
      break;
    }
  },

  canBuildAt(x, z) {
    if (!this.initialized) return true;
    const ruleId = this.state.advancedWorld.activeMapRuleId;
    if (!ruleId) return true;
    const rule = (CONFIG.ADVANCED_WORLD.MAP_RULES || {})[ruleId];
    if (!rule) return true;

    if (rule.type === "build_restriction" && rule.radius > 0) {
      const center = rule.center || { x: 0, z: 0 };
      return Math.hypot(x - center.x, z - center.z) >= rule.radius;
    }
    return true;
  },

  getActiveMapRule() {
    if (!this.initialized) return null;
    const id = this.state.advancedWorld.activeMapRuleId;
    return id && CONFIG.ADVANCED_WORLD.MAP_RULES ? CONFIG.ADVANCED_WORLD.MAP_RULES[id] || null : null;
  },

  serialize() {
    if (!this.initialized) return null;
    const s = this.state.advancedWorld;
    return {
      npcVisits: { ...s.npcVisits },
      completedChapters: [...s.completedChapters],
      activeMapRuleId: s.activeMapRuleId,
      dynamicEventCount: s.dynamicEventCount,
    };
  },

  load(data) {
    if (!this.initialized || !data || typeof data !== "object" || Array.isArray(data)) return false;
    const visits = data.npcVisits && typeof data.npcVisits === "object" && !Array.isArray(data.npcVisits) ? data.npcVisits : {};
    this.state.advancedWorld.npcVisits = {};
    for (const [id, count] of Object.entries(visits)) {
      if (typeof id === "string" && Number.isSafeInteger(count) && count >= 0) this.state.advancedWorld.npcVisits[id] = count;
    }
    this.state.advancedWorld.completedChapters = Array.isArray(data.completedChapters)
      ? [...new Set(data.completedChapters.filter(id => typeof id === "string" && id))] : [];
    const ruleId = typeof data.activeMapRuleId === "string" ? data.activeMapRuleId : null;
    this.state.advancedWorld.activeMapRuleId = ruleId && CONFIG.ADVANCED_WORLD.MAP_RULES[ruleId] ? ruleId : null;
    this.state.advancedWorld.dynamicEventCount = Number.isSafeInteger(data.dynamicEventCount) && data.dynamicEventCount >= 0 ? data.dynamicEventCount : 0;
    this._ruleActive = Boolean(this.state.advancedWorld.activeMapRuleId);
    this._emitStateChanged("load");
    return true;
  },

  _emitStateChanged(reason) {
    if (typeof EventBus === "undefined") return;
    EventBus.emit("AdvancedWorldStateChanged", { reason, state: this.serialize() });
  },

  update() {
    // Advanced world behavior is event-driven in Phase 13; no per-frame
    // gameplay mutation is required. NPC meshes remain static by design.
  },
};

if (typeof globalThis !== "undefined") globalThis.AdvancedWorldSystem = AdvancedWorldSystem;
