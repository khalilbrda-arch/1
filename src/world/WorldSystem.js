/**
 * WorldSystem.js
 * --------------
 * Phase 11 — Dynamic World Systems.
 * Owns deterministic world clock, weather, environmental modifiers,
 * and timed world events. Communicates through EventBus; gameplay systems
 * consume the published snapshot without owning world state.
 */
const WorldSystem = {
  state: null,
  initialized: false,
  _eventTimer: 0,
  _eventIndex: 0,

  init(worldState) {
    const source = worldState && typeof worldState === "object" ? worldState : {};
    this.state = {
      elapsed: 0,
      dayPhase: Number.isFinite(source.dayPhase) ? source.dayPhase : 0.25,
      weatherId: typeof source.weatherId === "string" ? source.weatherId : "clear",
      activeEventId: typeof source.activeEventId === "string" ? source.activeEventId : null,
      eventRemaining: Number.isFinite(source.eventRemaining) && source.eventRemaining > 0 ? source.eventRemaining : 0,
    };
    this._eventTimer = Math.max(0, this.state.eventRemaining);
    this._eventIndex = 0;
    this.initialized = true;
    this._emitChanged("init");
    return this.state;
  },

  _weather() {
    const list = CONFIG.WORLD_SYSTEMS.WEATHER;
    return list[this.state.weatherId] || list.clear;
  },

  getSnapshot() {
    if (!this.initialized) return null;
    const weather = this._weather();
    const sun = this.getDaylightFactor();
    return {
      elapsed: this.state.elapsed,
      dayPhase: this.state.dayPhase,
      weatherId: this.state.weatherId,
      weather: {
        id: weather.id,
        name: weather.name,
        oceanMultiplier: weather.oceanMultiplier,
        fogDensityMultiplier: weather.fogDensityMultiplier,
        defenseRangeMultiplier: weather.defenseRangeMultiplier,
        enemySpeedMultiplier: weather.enemySpeedMultiplier,
      },
      activeEventId: this.state.activeEventId,
      eventRemaining: this.state.eventRemaining,
      daylightFactor: sun,
    };
  },

  getDaylightFactor() {
    const phase = this.state ? this.state.dayPhase : 0.25;
    const angle = phase * Math.PI * 2;
    return Math.max(0.15, (Math.sin(angle - Math.PI / 2) + 1) / 2);
  },

  getModifier(name) {
    const weather = this._weather();
    if (name === "defenseRangeMultiplier") return weather.defenseRangeMultiplier;
    if (name === "enemySpeedMultiplier") return weather.enemySpeedMultiplier;
    if (name === "oceanMultiplier") return weather.oceanMultiplier;
    return 1;
  },

  setWeather(weatherId, reason = "manual") {
    if (!this.initialized) return false;
    if (!CONFIG.WORLD_SYSTEMS.WEATHER[weatherId]) return false;
    if (this.state.weatherId === weatherId) return true;
    this.state.weatherId = weatherId;
    this._emitChanged(reason);
    return true;
  },

  _startWorldEvent() {
    const events = CONFIG.WORLD_SYSTEMS.EVENTS;
    if (!events.length) return;
    const event = events[this._eventIndex % events.length];
    this._eventIndex += 1;
    this.state.activeEventId = event.id;
    this.state.eventRemaining = event.duration;
    this._eventTimer = event.duration;
    if (event.weatherId) this.state.weatherId = event.weatherId;
    EventBus.emit("WorldEventStarted", {
      eventId: event.id,
      duration: event.duration,
      weatherId: this.state.weatherId,
    });
    this._emitChanged("event_started");
  },

  _finishWorldEvent() {
    const eventId = this.state.activeEventId;
    this.state.activeEventId = null;
    this.state.eventRemaining = 0;
    this._eventTimer = 0;
    this._emitChanged("event_finished");
    EventBus.emit("WorldEventEnded", { eventId });
  },

  update(delta) {
    if (!this.initialized) return;
    const dt = Math.max(0, Number(delta) || 0);
    if (dt === 0) return;

    this.state.elapsed += dt;
    const dayLength = CONFIG.WORLD_SYSTEMS.DAY_NIGHT.CYCLE_SECONDS;
    this.state.dayPhase = (this.state.dayPhase + dt / dayLength) % 1;

    const eventInterval = CONFIG.WORLD_SYSTEMS.EVENT_INTERVAL_SECONDS;
    if (this.state.activeEventId) {
      this._eventTimer = Math.max(0, this._eventTimer - dt);
      this.state.eventRemaining = this._eventTimer;
      if (this._eventTimer <= 0) this._finishWorldEvent();
    } else if (eventInterval > 0 && this.state.elapsed >= eventInterval) {
      this.state.elapsed = this.state.elapsed % eventInterval;
      this._startWorldEvent();
    }

    EventBus.emit("WorldUpdated", this.getSnapshot());
  },

  save() {
    if (!this.initialized) return null;
    return {
      dayPhase: this.state.dayPhase,
      weatherId: this.state.weatherId,
      activeEventId: this.state.activeEventId,
      eventRemaining: this.state.eventRemaining,
    };
  },

  _emitChanged(reason) {
    const snapshot = this.getSnapshot();
    EventBus.emit("WorldStateChanged", { reason, snapshot });
    EventBus.emit("WorldModifiersChanged", {
      weatherId: snapshot.weatherId,
      defenseRangeMultiplier: snapshot.weather.defenseRangeMultiplier,
      enemySpeedMultiplier: snapshot.weather.enemySpeedMultiplier,
      oceanMultiplier: snapshot.weather.oceanMultiplier,
    });
  },
};
