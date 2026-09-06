/**
 * Game.js
 * ---
 * نقطة الدخول الرئيسية للمحرك.
 * 
 * المرحلة الحالية:
 * v0.14 — Integrated gameplay + visual overhaul
 * 
 * المسؤول عن:
 * - Scene
 * - Camera
 * - Renderer
 * - Lighting
 * - Sky
 * - World
 * - Input
 * - Interaction
 * - Base HUD
 * - Wave HUD
 * - Game Over UI
 * - QuestSystem + QuestUI
 * - Economy initialization + Economy UI
 * - Enemy Manager
 * - Wave Manager
 * - Wave Orchestrator (يربط CONFIG.WAVES بالتوليد الفعلي للأعداء)
 * - Projectile Manager
 * - Defense Manager
 * - Event subscriptions بين الأنظمة
 * - Game Loop
 * 
 * لا يوجد Player.
 * الكاميرا ثابتة الزاوية وتُدار عبر CameraController.
 */
const Game = {
scene: null,
camera: null,
renderer: null,
container: null,
_ordinaryKills: 0,

init() {
this.container =
document.getElementById("game-container");

if (!this.container) {
  console.error(
    "Game: #game-container غير موجود."
  );
  return;
}

this._setupScene();
this._setupCamera();
this._setupRenderer();
this._setupLighting();
this._setupSky();
this._setupResize();

// Phase 5 — Save/Reload boundary (PROJECT_STATE.md §44/54).
// يجب تطبيق جزء GameState (currency/base/interactions) هنا، قبل
// Interactables.create() أدناه، وإلا فإن الكنوز المفتوحة مسبقًا
// (GameState.interactions.openedIds) لن تكون معروفة بعد عند إنشاء
// الجزيرة، فتظهر كل الكنوز من جديد كقابلة للجمع رغم أنها جُمعت
// فعليًا في جلسة سابقة (راجع Interactables.js).
let _pendingSave = null;

if (typeof SaveManager !== "undefined") {
  SaveManager.init();

  _pendingSave = SaveManager.load();

  if (_pendingSave) {
    SaveManager.applyToGameState(
      _pendingSave,
      GameState
    );
  }
} else {
  console.error(
    "Game: SaveManager is not available."
  );
}

if (typeof ProgressionSystem !== "undefined") {
  ProgressionSystem.init(GameState);
}

if (typeof CollectionSystem !== "undefined") {
  CollectionSystem.init(GameState);
}

if (typeof QuestSystem !== "undefined") {
  QuestSystem.init(GameState);
}

if (typeof AdvancedWorldSystem !== "undefined") {
  AdvancedWorldSystem.init(GameState);
}

if (typeof MergeSystem !== "undefined") {
  MergeSystem.init(GameState);
}

if (typeof WorldSystem !== "undefined") {
  WorldSystem.init({});
}

Ocean.create(this.scene);
Island.create(this.scene);
Interactables.create(
  this.scene,
  GameState.interactions.openedIds
);
DefenseMap.create(this.scene);
if (typeof AdvancedWorldSystem !== "undefined") AdvancedWorldSystem.create(this.scene);

TouchControls.init();

CameraController.init(
  this.camera
);

InteractionController.init(
  this.camera
);

BaseHUD.init();

WaveUI.init();

if (
typeof EconomySystem !== "undefined"
) {
  EconomySystem.init(
    GameState.player.currency
  );
}

if (
typeof EconomyUI !== "undefined"
) {
  EconomyUI.init(
    typeof EconomySystem !== "undefined"
      ? EconomySystem.getBalance()
      : GameState.player.currency
  );
}

if (typeof ProgressionUI !== "undefined") {
  ProgressionUI.init();
}

if (typeof BossUI !== "undefined") { BossUI.init(); }
if (typeof QuestUI !== "undefined") { QuestUI.init(); }
if (typeof ProUI !== "undefined") { ProUI.init(); }
if (typeof WorldFX !== "undefined") { WorldFX.init(this.scene); }

this._setupEventSubscriptions();

EnemyManager.init(
  this.scene
);

WaveManager.init();

if (_pendingSave && typeof SaveManager !== "undefined") {
  SaveManager.applyToWaveManager(
    _pendingSave,
    WaveManager
  );
}

WaveOrchestrator.init();

if (typeof BossSystem !== "undefined") {
  BossSystem.init();
}

ProjectileManager.init(
  this.scene
);

DefenseManager.init(
  this.scene
);

if (_pendingSave && typeof SaveManager !== "undefined") {
  SaveManager.applyToDefenseManager(
    _pendingSave,
    DefenseManager
  );
}

if (typeof WorldSystem !== "undefined" && WorldSystem.getSnapshot) {
  const world = WorldSystem.getSnapshot();
  if (world && world.weather) {
    const enemyMultiplier = Number(world.weather.enemySpeedMultiplier);
    const defenseMultiplier = Number(world.weather.defenseRangeMultiplier);
    for (const defense of DefenseManager.defenses) defense.worldRangeMultiplier = Number.isFinite(defenseMultiplier) && defenseMultiplier > 0 ? defenseMultiplier : 1;
  }
}

GameTime.init();

this._hideBootScreen();

this._loop();

},

_setupEventSubscriptions() {
if (
typeof EventBus === "undefined"
) {
console.error(
"Game: EventBus is not available."
);

  return;
}

  const applyCurrentWorldModifiers = () => {
    if (typeof WorldSystem === "undefined" || typeof WorldSystem.getSnapshot !== "function") return;
    const world = WorldSystem.getSnapshot();
    if (!world || !world.weather) return;
    const enemyMultiplier = Number(world.weather.enemySpeedMultiplier);
    const defenseMultiplier = Number(world.weather.defenseRangeMultiplier);
    if (typeof EnemyManager !== "undefined" && Array.isArray(EnemyManager.enemies)) {
      for (const enemy of EnemyManager.enemies) {
        if (enemy) enemy.worldSpeedMultiplier = Number.isFinite(enemyMultiplier) && enemyMultiplier > 0 ? enemyMultiplier : 1;
      }
    }
    if (typeof DefenseManager !== "undefined" && Array.isArray(DefenseManager.defenses)) {
      for (const defense of DefenseManager.defenses) {
        if (defense) defense.worldRangeMultiplier = Number.isFinite(defenseMultiplier) && defenseMultiplier > 0 ? defenseMultiplier : 1;
      }
    }
  };

/*
 * Game هو الحد الفاصل بين:
 *
 * GameState
 *     ↓
 * Game
 *     ↓
 * EventBus
 *     ↓
 * الأنظمة
 *
 * الأنظمة المنخفضة لا تعتمد مباشرة على GameState.
 */

EventBus.on(
  "CurrencyChanged",
  (payload) => {
    if (!payload) {
      return;
    }

    const balance = Math.max(
      0,
      Number(payload.balance) || 0
    );

    GameState.player.currency =
      balance;
  }
);

// Phase 5 — Save/Reload boundary (PROJECT_STATE.md §44/54).
// بدون هذا، GameState.interactions.openedIds يبقى فارغًا للأبد مهما
// جُمعت كنوز فعليًا، فلا يُحفظ شيء يمنع إعادة جمعها بعد إعادة
// تحميل الصفحة (Interactables.js نفسه لا يلمس GameState مباشرة).
EventBus.on("EnemySpawned", () => applyCurrentWorldModifiers());
EventBus.on("DefensePlaced", () => applyCurrentWorldModifiers());
EventBus.on("AdvancedWorldStateChanged", () => {
  if (typeof SaveManager !== "undefined") SaveManager.save({ gameState: GameState, waveManager: WaveManager, defenseManager: DefenseManager });
});

EventBus.on(
  "InteractableConsumed",
  (payload) => {
    if (!payload || !payload.id) {
      return;
    }

    GameState.registerInteraction(
      payload.id
    );
  }
);

EventBus.on(
  "EnemyReachedBase",
  (payload) => {
    if (!payload) {
      return;
    }

    const wasDestroyed =
      GameState.isBaseDestroyed();

    const result =
      GameState.damageBase(
        payload.damage
      );

    // عدو وصل للقاعدة يجب أن يُحتسب ضمن اكتمال الموجة أيضًا،
    // وإلا تعلَّق الموجة للأبد إن نجا أي عدو من الدفاعات
    // (راجع تعليق handleEnemyReachedBase في WaveOrchestrator.js).
    if (
      typeof WaveOrchestrator !== "undefined"
    ) {
      WaveOrchestrator.handleEnemyReachedBase();
    }

    if (
      !wasDestroyed &&
      result.destroyed
    ) {
      EventBus.emit(
        "BaseDestroyed",
        {
          hp:
            result.hp,

          maxHp:
            result.maxHp,

          damage:
            result.damage,
        }
      );
    }
  }
);

EventBus.on(
  "BaseDestroyed",
  () => {
    if (
      typeof GameOverUI === "undefined"
    ) {
      console.error(
        "Game: GameOverUI is not available."
      );

      return;
    }

    GameOverUI.show(
      WaveManager.currentWave
    );

    // Phase 5 — Save/Reload boundary.
    // لا يتم حفظ حالة "خسارة" — عمدًا نمسح الحفظ كي تعمل "إعادة
    // المحاولة" (والتي تعتمد على window.location.reload()) كبداية
    // جديدة فعلية. انظر SaveManager.js وDECISIONS.md.
    if (typeof SaveManager !== "undefined") {
      SaveManager.clear();
    }
  }
);

EventBus.on(
  "EnemyDied",
  (payload) => {
    if (!payload) {
      return;
    }

    if (
      typeof EconomySystem === "undefined"
    ) {
      console.error(
        "Game: EconomySystem is not available."
      );

      return;
    }

    if (payload.type !== "boss") {
      EconomySystem.rewardEnemyKill(payload.reward);
      if (typeof ProgressionSystem !== "undefined") ProgressionSystem.addXP(5, "enemy-kill");
      if (typeof CollectionSystem !== "undefined" && CONFIG.MERGE?.WAVE_MATERIAL_REWARD) {
        // Every fifth ordinary kill awards a crafting core.
        const kills = Number(Game._ordinaryKills || 0) + 1;
        Game._ordinaryKills = kills;
        if (kills % 5 === 0) CollectionSystem.addQuantity(CONFIG.MERGE.WAVE_MATERIAL_REWARD.itemId, 1, "enemy-kill");
      }
    }

    if (
      typeof WaveOrchestrator !== "undefined"
    ) {
      WaveOrchestrator.handleEnemyDied();
    }
  }
);

// Phase 5 — Save/Reload boundary.
// نهاية الموجة هي نقطة الحفظ الطبيعية (SAVE_SCHEMA.md §19: "عند
// نهاية المستوى"). لا حفظ أثناء المعركة نفسها (لا Enemy/Projectile
// runtime state — SAVE_SCHEMA.md §18).
EventBus.on("QuestRewardClaimed", () => {
  if (typeof SaveManager !== "undefined") SaveManager.save({ gameState: GameState, waveManager: WaveManager, defenseManager: DefenseManager });
});

EventBus.on("QuestRewardClaimRequested", (payload) => {
  if (!payload || typeof QuestSystem === "undefined") return;
  let ok = true;
  const rewards = payload.rewards || {};

  // Apply the potentially-failing reward first. Currency/XP additions are
  // non-failing after their own input sanitization, so this ordering prevents
  // a failed item grant from leaving a partially paid quest claim.
  if (rewards.item) {
    if (typeof CollectionSystem !== "undefined") {
      ok = CollectionSystem.addQuantity(
        rewards.item.itemId,
        rewards.item.amount,
        "quest-reward"
      );
    } else {
      ok = false;
    }
  }
  if (ok && rewards.currency) {
    if (typeof EconomySystem !== "undefined") EconomySystem.add(rewards.currency);
    else ok = false;
  }
  if (ok && rewards.xp) {
    if (typeof ProgressionSystem !== "undefined") ProgressionSystem.addXP(rewards.xp, "quest-reward");
    else ok = false;
  }
  if (ok) QuestSystem.confirmRewardClaim(payload.questId);
});

EventBus.on(
  "BossDefeated",
  (payload) => {
    if (!payload) return;
    if (typeof EconomySystem !== "undefined") {
      EconomySystem.rewardEnemyKill(payload.reward);
    }
    const boss = CONFIG.BOSSES.TYPES[payload.bossId];
    if (boss && boss.rewardItem && typeof CollectionSystem !== "undefined") {
      CollectionSystem.addQuantity(boss.rewardItem.itemId, boss.rewardItem.amount, "boss_defeated");
    }
    if (typeof ProgressionSystem !== "undefined") {
      ProgressionSystem.addXP(boss && Number.isFinite(boss.xpReward) ? boss.xpReward : 0, "boss_defeated");
    }
  }
);

EventBus.on(
  "BossAbilityTriggered",
  (payload) => {
    if (!payload) return;
    const abilityDamage = Math.max(0, Number(payload.damageToBase) || 0);
    if (abilityDamage > 0 && !GameState.isBaseDestroyed()) {
      const result = GameState.damageBase(abilityDamage);
      EventBus.emit("BossAbilityApplied", {
        bossId: payload.bossId,
        enemyId: payload.enemyId,
        abilityId: payload.abilityId,
        damage: result.damage,
        hp: result.hp,
        maxHp: result.maxHp,
      });
      if (result.destroyed) EventBus.emit("BaseDestroyed", result);
    } else {
      EventBus.emit("BossAbilityFeedback", {
        bossId: payload.bossId,
        enemyId: payload.enemyId,
        abilityId: payload.abilityId,
        phase: payload.phase,
        damage: abilityDamage,
      });
    }
  }
);

EventBus.on("WorldStateChanged", () => { if (typeof ProUI !== "undefined") ProUI.updateWorld(); });
EventBus.on("AdvancedWorldStateChanged", () => { if (typeof ProUI !== "undefined") ProUI.updateWorld(); });
EventBus.on("BossSpawned", () => { if (typeof ProUI !== "undefined") ProUI.update(); });
EventBus.on("BossDefeated", () => { if (typeof ProUI !== "undefined") ProUI.update(); });

EventBus.on("MergeCompleted", (payload) => {
  if (typeof ProUI !== "undefined") ProUI.toast(`تم الدمج: ${payload?.result?.itemId || "عنصر"}`);
  if (typeof SaveManager !== "undefined") SaveManager.save({ gameState: GameState, waveManager: WaveManager, defenseManager: DefenseManager });
});

EventBus.on("ProgressionChanged", (payload) => {
  if (typeof ProUI !== "undefined" && payload?.levelsGained > 0) ProUI.toast(`ارتقيت إلى المستوى ${payload.level}`);
});

EventBus.on("WorldModifiersChanged", (payload) => {
  if (!payload) return;
  const enemyMultiplier = Number(payload.enemySpeedMultiplier);
  const defenseMultiplier = Number(payload.defenseRangeMultiplier);
  if (typeof EnemyManager !== "undefined" && Array.isArray(EnemyManager.enemies)) {
    for (const enemy of EnemyManager.enemies) {
      if (enemy) enemy.worldSpeedMultiplier = Number.isFinite(enemyMultiplier) && enemyMultiplier > 0 ? enemyMultiplier : 1;
    }
  }
  if (typeof DefenseManager !== "undefined" && Array.isArray(DefenseManager.defenses)) {
    for (const defense of DefenseManager.defenses) {
      if (defense) defense.worldRangeMultiplier = Number.isFinite(defenseMultiplier) && defenseMultiplier > 0 ? defenseMultiplier : 1;
    }
  }
});

EventBus.on(
  "WaveCompleted",
  (payload) => {
    if (typeof ProgressionSystem !== "undefined") {
      ProgressionSystem.awardWaveCompletion(payload && payload.wave);
    }

    if (typeof CollectionSystem !== "undefined" &&
        CONFIG.MERGE && CONFIG.MERGE.WAVE_MATERIAL_REWARD) {
      const material = CONFIG.MERGE.WAVE_MATERIAL_REWARD;
      CollectionSystem.addQuantity(material.itemId, material.amount, "wave_completed");
    }

    if (typeof SaveManager === "undefined") {
      return;
    }

    SaveManager.save({
      gameState: GameState,
      waveManager: WaveManager,
      defenseManager: DefenseManager,
    });
  }
);

},

_setupScene() {
this.scene =
new THREE.Scene();

this.scene.fog =
  new THREE.FogExp2(
    0x9fd7e8,
    0.015
  );

},

_setupCamera() {
const c =
CONFIG.CAMERA;

this.camera =
  new THREE.PerspectiveCamera(
    c.FOV,
    window.innerWidth /
      window.innerHeight,
    c.NEAR,
    c.FAR
  );

},

_setupRenderer() {
this.renderer =
new THREE.WebGLRenderer({
antialias: true,
});

this.renderer.setSize(
  window.innerWidth,
  window.innerHeight
);

this.renderer.setPixelRatio(
  Math.min(
    window.devicePixelRatio,
    CONFIG.PERFORMANCE.MAX_PIXEL_RATIO
  )
);

this.renderer.shadowMap.enabled =
  true;

this.renderer.shadowMap.type =
  THREE.PCFSoftShadowMap;

this.container.appendChild(
  this.renderer.domElement
);

},

_setupLighting() {
const L =
CONFIG.LIGHTING;

const hemi =
  new THREE.HemisphereLight(
    L.HEMISPHERE_SKY_COLOR,
    L.HEMISPHERE_GROUND_COLOR,
    L.HEMISPHERE_INTENSITY
  );

this.scene.add(
  hemi
);

const sun =
  new THREE.DirectionalLight(
    L.SUN_COLOR,
    L.SUN_INTENSITY
  );

sun.position.set(
  40,
  60,
  20
);

sun.castShadow =
  true;

sun.shadow.mapSize.set(
  1024,
  1024
);

this.scene.add(
  sun
);

this._sunLight = sun;
this._hemiLight = hemi;

},

_setupSky() {
const S =
CONFIG.SKY;

const skyGeo =
  new THREE.SphereGeometry(
    400,
    32,
    32
  );

const skyMat =
  new THREE.ShaderMaterial({
    side: THREE.BackSide,

    uniforms: {
      topColor: {
        value:
          new THREE.Color(
            S.TOP_COLOR
          ),
      },

      bottomColor: {
        value:
          new THREE.Color(
            S.BOTTOM_COLOR
          ),
      },
    },

    vertexShader: `
      varying vec3 vWorldPosition;

      void main() {
        vec4 worldPosition =
          modelMatrix *
          vec4(position, 1.0);

        vWorldPosition =
          worldPosition.xyz;

        gl_Position =
          projectionMatrix *
          modelViewMatrix *
          vec4(position, 1.0);
      }
    `,

    fragmentShader: `
      varying vec3 vWorldPosition;

      uniform vec3 topColor;
      uniform vec3 bottomColor;

      void main() {
        float h =
          normalize(
            vWorldPosition
          ).y;

        float factor =
          max(
            pow(
              max(h, 0.0),
              0.5
            ),
            0.0
          );

        gl_FragColor =
          vec4(
            mix(
              bottomColor,
              topColor,
              factor
            ),
            1.0
          );
      }
    `,
  });

this.scene.add(
  new THREE.Mesh(
    skyGeo,
    skyMat
  )
);

},

_setupResize() {
window.addEventListener(
"resize",
() => {
if (
!this.camera ||
!this.renderer
) {
return;
}

    this.camera.aspect =
      window.innerWidth /
      window.innerHeight;

    this.camera.updateProjectionMatrix();

    this.renderer.setSize(
      window.innerWidth,
      window.innerHeight
    );
  }
);

},

_hideBootScreen() {
const boot =
document.getElementById(
"boot-screen"
);

if (boot) {
  boot.style.display =
    "none";
}

},

_updateDebugHud() {
const hud =
document.getElementById(
"debug-hud"
);

if (!hud) {
  return;
}

const fps =
  GameTime.delta > 0
    ? Math.round(
        1 / GameTime.delta
      )
    : 0;

const enemyCount =
  EnemyManager.initialized
    ? EnemyManager.getAliveEnemies().length
    : 0;

const defenseCount =
  DefenseManager.initialized
    ? DefenseManager.getDefenses().length
    : 0;

hud.textContent =
  `FPS: ${fps}` +
  ` | ${GameState.summary()}` +
  ` | Wave: ${WaveManager.currentWave}` +
  ` | Enemies: ${enemyCount}` +
  ` | Defenses: ${defenseCount}`;

},

_loop() {
requestAnimationFrame(
() => this._loop()
);

GameTime.tick();

const delta =
  GameTime.delta;

const elapsed =
  GameTime.elapsed;

CameraController.update();

InteractionController.update();

if (typeof WorldSystem !== "undefined") {
  WorldSystem.update(delta);
  if (typeof WorldFX !== "undefined") WorldFX.update(delta, WorldSystem.getSnapshot());

  const world = WorldSystem.getSnapshot();
  if (world && this._sunLight && this._hemiLight) {
    const light = world.daylightFactor;
    this._sunLight.intensity = CONFIG.LIGHTING.SUN_INTENSITY * (0.35 + light * 0.65);
    this._hemiLight.intensity = CONFIG.LIGHTING.HEMISPHERE_INTENSITY * (0.6 + light * 0.4);
    if (this.scene.fog) this.scene.fog.density = 0.015 * world.weather.fogDensityMultiplier;
  }
}

Ocean.update(
  elapsed
);

Interactables.update(
  elapsed
);

DefenseMap.update(
  elapsed
);
if (typeof AdvancedWorldSystem !== "undefined") AdvancedWorldSystem.update(delta);

if (!WaveManager.isGameOver()) {
  EnemyManager.update(
    delta
  );

  DefenseManager.update(
    delta
  );

  ProjectileManager.update(
    delta
  );

  WaveOrchestrator.update(
    delta
  );

  if (typeof BossSystem !== "undefined") {
    BossSystem.update(delta);
  }
  if (typeof ProUI !== "undefined") ProUI.update();
}

WaveManager.update(
  delta
);


BaseHUD.update();

WaveUI.update(
  WaveOrchestrator.getUIData()
);

this._updateDebugHud();

this.renderer.render(
  this.scene,
  this.camera
);

},
};

window.addEventListener(
"load",
() => {
Game.init();
}
);
