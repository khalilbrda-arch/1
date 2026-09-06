const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

function context() {
  const c = vm.createContext({ console, Date, Number, Math, Object, JSON, Set, Array });
  for (const file of ['src/core/EventBus.js','src/core/Config.js','src/core/DataContracts.js','src/core/GameState.js','src/world/AdvancedWorldSystem.js','src/save/SaveManager.js']) vm.runInContext(read(file), c);
  return c;
}
function init(c) { vm.runInContext('GameState.advancedWorld={npcVisits:{},completedChapters:[],activeMapRuleId:null,dynamicEventCount:0}; AdvancedWorldSystem.init(GameState);', c); }

test('Phase 13: advanced-world configuration is centralized and validated', () => {
  const c = context();
  assert.equal(vm.runInContext('DataContracts.validateConfig()', c), true);
  assert.equal(vm.runInContext('CONFIG.ADVANCED_WORLD.NPCS.length', c), 2);
  assert.equal(vm.runInContext('Object.keys(CONFIG.ADVANCED_WORLD.MAP_RULES).length', c), 1);
});

test('Phase 13: NPC interaction is owned by AdvancedWorldSystem and persists visit counts', () => {
  const c = context(); init(c);
  const result = vm.runInContext('AdvancedWorldSystem.interactNPC("npc_keeper")', c);
  assert.equal(result.visitCount, 1);
  assert.equal(vm.runInContext('GameState.advancedWorld.npcVisits.npc_keeper', c), 1);
  assert.equal(vm.runInContext('GameState.advancedWorld.completedChapters.includes("story_arrival")', c), true);
});

test('Phase 13: story chapters advance from events without UI coupling', () => {
  const c = context(); init(c);
  vm.runInContext('EventBus.emit("WaveCompleted", {wave:1}); EventBus.emit("BossDefeated", {bossId:"test"});', c);
  assert.equal(vm.runInContext('GameState.advancedWorld.completedChapters.includes("story_first_campaign")', c), true);
  assert.equal(vm.runInContext('GameState.advancedWorld.completedChapters.includes("story_boss_signal")', c), true);
});

test('Phase 13: tidal surge activates and ending it clears the special map rule', () => {
  const c = context(); init(c);
  vm.runInContext('EventBus.emit("WorldEventStarted", {eventId:"tidal_surge"});', c);
  assert.equal(vm.runInContext('GameState.advancedWorld.activeMapRuleId', c), 'storm_build_restriction');
  assert.equal(vm.runInContext('AdvancedWorldSystem.canBuildAt(0,-10)', c), false);
  assert.equal(vm.runInContext('AdvancedWorldSystem.canBuildAt(0,0)', c), true);
  vm.runInContext('EventBus.emit("WorldEventEnded", {eventId:"tidal_surge"});', c);
  assert.equal(vm.runInContext('GameState.advancedWorld.activeMapRuleId', c), null);
});

test('Phase 13: dynamic world events are deterministic and counted once per start', () => {
  const c = context(); init(c);
  vm.runInContext('EventBus.emit("WorldEventStarted", {eventId:"tidal_surge"}); EventBus.emit("WorldEventStarted", {eventId:"tidal_surge"});', c);
  assert.equal(vm.runInContext('GameState.advancedWorld.dynamicEventCount', c), 2);
});

test('Phase 13: advanced-world save data round-trips and malformed data is rejected', () => {
  const c = context(); init(c);
  vm.runInContext('AdvancedWorldSystem.interactNPC("npc_keeper"); EventBus.emit("WaveCompleted", {wave:1}); saved=SaveManager.serialize({gameState:GameState,waveManager:{currentWave:1},defenseManager:{defenses:[]}});', c);
  assert.equal(vm.runInContext('SaveManager.validate(saved)', c), true);
  assert.equal(vm.runInContext('saved.advancedWorld.npcVisits.npc_keeper', c), 1);
  vm.runInContext('EventBus.emit("WorldEventStarted", {eventId:"tidal_surge"}); savedWithRule=SaveManager.serialize({gameState:GameState,waveManager:{currentWave:1},defenseManager:{defenses:[]}});', c);
  assert.equal(vm.runInContext('savedWithRule.advancedWorld.activeMapRuleId', c), null);
  assert.equal(vm.runInContext('SaveManager.validate({...saved,advancedWorld:{...saved.advancedWorld,npcVisits:{npc_keeper:-1}}})', c), false);
});

test('Phase 13: NPC meshes are routed through the existing interaction boundary', () => {
  const controller = read('src/interaction/InteractionController.js');
  assert.ok(controller.includes('AdvancedWorldSystem.getInteractableMeshes()'));
  assert.ok(controller.includes('AdvancedWorldSystem.interactNPC'));
});

test('Phase 13: build validation includes advanced map rules', () => {
  const map = read('src/world/DefenseMap.js');
  assert.ok(map.includes('AdvancedWorldSystem.canBuildAt'));
});

test('Phase 13 regression: advanced-world state has safe defaults for old saves', () => {
  const c = context();
  vm.runInContext('delete GameState.advancedWorld; AdvancedWorldSystem.init(GameState);', c);
  assert.deepEqual(JSON.parse(JSON.stringify(vm.runInContext('AdvancedWorldSystem.serialize()', c))), {npcVisits:{},completedChapters:[],activeMapRuleId:null,dynamicEventCount:0});
});

test('Phase 13 regression: package and runtime versions match', () => {
  const c = context();
  assert.equal(vm.runInContext('CONFIG.VERSION', c), '0.13.0');
  const pkg = JSON.parse(read('package.json'));
  const lock = JSON.parse(read('package-lock.json'));
  assert.equal(pkg.version, '0.13.0');
  assert.equal(lock.version, '0.13.0');
  assert.equal(lock.packages[''].version, '0.13.0');
});
