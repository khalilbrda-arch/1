const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

function context(extra = {}) {
  const c = vm.createContext({ console, Date, Number, Math, Set, ...extra });
  vm.runInContext(read('src/core/EventBus.js'), c);
  vm.runInContext(read('src/core/Config.js'), c);
  vm.runInContext(read('src/core/DataContracts.js'), c);
  vm.runInContext(read('src/core/GameState.js'), c);
  vm.runInContext(read('src/progression/ProgressionSystem.js'), c);
  vm.runInContext(read('src/economy/EconomySystem.js'), c);
  vm.runInContext(read('src/merge/MergeSystem.js'), c);
  return c;
}

function prepare(c, { level = 3, currency = 100, items = { cannon_core: 3 } } = {}) {
  vm.runInContext(`GameState.player.level=${level}; GameState.collection.items=${JSON.stringify(items)}; ProgressionSystem.init(GameState); EconomySystem.init(${currency}); MergeSystem.init(GameState);`, c);
}

test('Phase 8: merge definitions are centralized and valid', () => {
  const c = context();
  assert.equal(vm.runInContext('DataContracts.validateConfig()', c), true);
  assert.equal(vm.runInContext('DataContracts.validateMergeDefinition(CONFIG.MERGE.RECIPES.reinforced_cannon_core)', c), true);
});

test('Phase 8: merge rejects unknown and invalid recipes deterministically', () => {
  const c = context();
  prepare(c);
  assert.equal(vm.runInContext("MergeSystem.merge('missing_recipe').reason", c), 'unknown_recipe');
  vm.runInContext("CONFIG.MERGE.RECIPES.bad={id:'bad'};", c);
  assert.equal(vm.runInContext("MergeSystem.merge('bad').reason", c), 'invalid_definition');
});

test('Phase 8: merge requires progression level', () => {
  const c = context();
  prepare(c, { level: 2 });
  assert.equal(vm.runInContext("MergeSystem.merge('reinforced_cannon_core').reason", c), 'insufficient_level');
});

test('Phase 8: merge requires all inputs and cost', () => {
  const c = context();
  prepare(c, { items: { cannon_core: 2 } });
  assert.equal(vm.runInContext("MergeSystem.merge('reinforced_cannon_core').reason", c), 'insufficient_items');
  prepare(c, { currency: 20 });
  assert.equal(vm.runInContext("MergeSystem.merge('reinforced_cannon_core').reason", c), 'insufficient_currency');
});

test('Phase 8: canMerge is a pure preflight and does not emit rejection side effects', () => {
  const c = context();
  prepare(c, { currency: 20 });
  vm.runInContext(`let rejected=0; EventBus.on('MergeRejected',()=>rejected++);`, c);
  assert.equal(vm.runInContext("MergeSystem.canMerge('reinforced_cannon_core').reason", c), 'insufficient_currency');
  assert.equal(vm.runInContext('rejected', c), 0);
});

test('Phase 8: successful merge consumes inputs, cost, creates result, and awards XP', () => {
  const c = context();
  prepare(c);
  const result = vm.runInContext("MergeSystem.merge('reinforced_cannon_core')", c);
  assert.equal(result.ok, true);
  assert.equal(vm.runInContext('MergeSystem.getQuantity("cannon_core")', c), 0);
  assert.equal(vm.runInContext('MergeSystem.getQuantity("reinforced_cannon_core")', c), 1);
  assert.equal(vm.runInContext('EconomySystem.getBalance()', c), 70);
  assert.equal(vm.runInContext('GameState.player.xp', c), 20);
});

test('Phase 8: merge is deterministic and events expose stable payloads', () => {
  const c = context();
  prepare(c);
  vm.runInContext(`let events=[]; EventBus.on('MergeStarted',p=>events.push(['start',p])); EventBus.on('MergeCompleted',p=>events.push(['done',p])); EventBus.on('MergeRejected',p=>events.push(['reject',p]));`, c);
  vm.runInContext("MergeSystem.merge('reinforced_cannon_core')", c);
  const events = vm.runInContext('events', c);
  assert.equal(events.length, 2);
  assert.equal(events[0][0], 'start');
  assert.equal(events[1][0], 'done');
  assert.equal(events[1][1].result.itemId, 'reinforced_cannon_core');
});

test('Phase 8: failed merge does not mutate collection or currency', () => {
  const c = context();
  prepare(c, { items: { cannon_core: 3 }, currency: 20 });
  vm.runInContext("let before=JSON.stringify(MergeSystem.getSnapshot());", c);
  vm.runInContext("MergeSystem.merge('reinforced_cannon_core')", c);
  assert.equal(vm.runInContext('JSON.stringify(MergeSystem.getSnapshot())', c), vm.runInContext('before', c));
  assert.equal(vm.runInContext('EconomySystem.getBalance()', c), 20);
});

test('Phase 8: malformed collection state is sanitized', () => {
  const c = context();
  vm.runInContext(`GameState.collection.items={ok:2,bad:NaN,inf:Infinity,neg:-1,float:1.5,zero:0}; MergeSystem.init(GameState);`, c);
  assert.deepEqual(JSON.parse(JSON.stringify(vm.runInContext('MergeSystem.getSnapshot()', c))), { ok: 2 });
});

test('Phase 8: grant rejects invalid quantities and emits acquisition events', () => {
  const c = context();
  prepare(c, { items: {} });
  vm.runInContext(`let acquired=null; EventBus.on('ItemAcquired',p=>acquired=p);`, c);
  assert.equal(vm.runInContext("MergeSystem.grant('cannon_core', 2, 'test')", c), true);
  assert.equal(vm.runInContext('MergeSystem.getQuantity("cannon_core")', c), 2);
  assert.equal(vm.runInContext('acquired.amount', c), 2);
  assert.equal(vm.runInContext("MergeSystem.grant('cannon_core', -1)", c), false);
});

test('Phase 8: save validation accepts the merge collection slice and rejects malformed quantities', () => {
  const c = context();
  vm.runInContext(read('src/save/SaveManager.js'), c);
  const payload = {
    schemaVersion: 1, wave: 1,
    player: { level: 3, xp: 20, currency: 70, rank: 'Novice' },
    base: { hp: 100, maxHp: 100 },
    interactions: { openedIds: [] },
    progression: { unlockedMaps: ['bay_start'], unlockedSystems: [], unlockedDefenses: ['cannon'], completedMilestones: [] },
    collection: { items: { reinforced_cannon_core: 1 } },
    defenses: [],
  };
  c.payload = payload;
  assert.equal(vm.runInContext('SaveManager.validate(payload)', c), true);
  vm.runInContext('payload.collection.items.reinforced_cannon_core=1.5;', c);
  assert.equal(vm.runInContext('SaveManager.validate(payload)', c), false);
});

test('Phase 8: save/apply round-trip restores collection ownership', () => {
  const c = context();
  vm.runInContext(read('src/save/SaveManager.js'), c);
  vm.runInContext(`GameState.collection.items={cannon_core:4,reinforced_cannon_core:2}; const saved=SaveManager.serialize({gameState:GameState,waveManager:{currentWave:2},defenseManager:{defenses:[]}});`, c);
  assert.deepEqual(JSON.parse(JSON.stringify(vm.runInContext('saved.collection', c))), { items: { cannon_core: 4, reinforced_cannon_core: 2 } });
  vm.runInContext('GameState.collection.items={}; SaveManager.applyToGameState(saved, GameState);', c);
  assert.deepEqual(JSON.parse(JSON.stringify(vm.runInContext('GameState.collection.items', c))), { cannon_core: 4, reinforced_cannon_core: 2 });
});


test('Phase 8: Game loads MergeSystem after save/progression and rewards merge material at wave completion', () => {
  const game = read('src/core/Game.js');
  assert.match(game, /ProgressionSystem\.init\(GameState\)[\s\S]*MergeSystem\.init\(GameState\)/);
  assert.match(game, /CollectionSystem\.addQuantity\(material\.itemId, material\.amount, "wave_completed"\)/);
});


test('Phase 8: index loads MergeSystem after EconomySystem', () => {
  const html = read('index.html');
  assert.match(html, /src\/economy\/EconomySystem\.js\?v=18[\s\S]*src\/merge\/MergeSystem\.js\?v=19/);
});
