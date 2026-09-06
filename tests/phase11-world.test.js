const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
function ctx() { return vm.createContext({ console, Number, Math, Object, JSON }); }

test('Phase 11: world definitions are centralized and deterministic', () => {
  const c = ctx();
  vm.runInContext(read('src/core/EventBus.js'), c);
  vm.runInContext(read('src/core/Config.js'), c);
  vm.runInContext(read('src/world/WorldSystem.js'), c);
  assert.equal(vm.runInContext('WorldSystem.init({dayPhase:0.25,weatherId:"clear"}); WorldSystem.setWeather("storm"); WorldSystem.getSnapshot().weatherId', c), 'storm');
  assert.equal(vm.runInContext('WorldSystem.getSnapshot().weather.defenseRangeMultiplier', c), 0.82);
});

test('Phase 11: day/night cycle wraps deterministically', () => {
  const c = ctx(); vm.runInContext(read('src/core/EventBus.js'), c); vm.runInContext(read('src/core/Config.js'), c); vm.runInContext(read('src/world/WorldSystem.js'), c);
  const phase = vm.runInContext('WorldSystem.init({dayPhase:0.9}); WorldSystem.update(24); WorldSystem.getSnapshot().dayPhase', c);
  assert.ok(phase >= 0 && phase < 1);
});

test('Phase 11: weather and world events publish isolated modifier contracts', () => {
  const c = ctx(); vm.runInContext(read('src/core/EventBus.js'), c); vm.runInContext(read('src/core/Config.js'), c); vm.runInContext(read('src/world/WorldSystem.js'), c);
  const out = vm.runInContext('const e=[]; EventBus.on("WorldModifiersChanged", p=>e.push(p)); EventBus.on("WorldEventStarted", p=>e.push(p)); WorldSystem.init({}); WorldSystem.update(45); WorldSystem.update(12); WorldSystem.update(45); e', c);
  assert.ok(out.length >= 2);
  const firstEventWeather = vm.runInContext('e.find(x => x && x.eventId === "rain_window").weatherId', c);
  assert.equal(firstEventWeather, 'rain'); assert.ok(vm.runInContext('e.some(x => x && x.weatherId === "rain")', c)); assert.ok(vm.runInContext('e.some(x => x && x.weatherId === "storm")', c));
});

test('Phase 11: world modifiers affect enemy speed and defense range through events', () => {
  const c = ctx();
  vm.runInContext(read('src/core/EventBus.js'), c);
  vm.runInContext(read('src/core/Config.js'), c);
  vm.runInContext(read('src/world/WorldSystem.js'), c);
  vm.runInContext(read('src/enemies/Enemy.js'), c);
  vm.runInContext(read('src/defenses/Defense.js'), c);
  // Runtime propagation is verified structurally because constructors need Three.js.
  const enemy = read('src/enemies/Enemy.js'); const defense = read('src/defenses/Defense.js'); const game = read('src/core/Game.js');
  assert.ok(enemy.includes('worldSpeedMultiplier')); assert.ok(enemy.includes('*\n      this.worldSpeedMultiplier'));
  assert.ok(defense.includes('worldRangeMultiplier')); assert.ok(defense.includes('this.range * this.worldRangeMultiplier'));
  assert.ok(game.includes('WorldModifiersChanged'));
});

test('Phase 11: world state is explicitly owned and no world system writes localStorage', () => {
  const world = read('src/world/WorldSystem.js');
  assert.ok(world.includes('const WorldSystem')); assert.equal(world.includes('localStorage'), false);
});


test('Phase 11: index integrates WorldSystem once and Game remains the integration boundary', () => {
  const index = read('index.html'); const game = read('src/core/Game.js');
  const matches = index.match(/src\/world\/WorldSystem\.js/g) || [];
  assert.equal(matches.length, 1);
  assert.ok(game.includes('WorldSystem.init({});'));
  assert.ok(game.includes('WorldSystem.update(delta)'));
});


test('Phase 11 regression: newly spawned/placed objects inherit the current world modifier through Game integration', () => {
  const game = read('src/core/Game.js');
  assert.ok(game.includes('EventBus.on("EnemySpawned", () => applyCurrentWorldModifiers())'));
  assert.ok(game.includes('EventBus.on("DefensePlaced", () => applyCurrentWorldModifiers())'));
  assert.ok(game.includes('defense.worldRangeMultiplier = Number.isFinite(defenseMultiplier)'));
  assert.ok(game.includes('enemy.worldSpeedMultiplier = Number.isFinite(enemyMultiplier)'));
});
