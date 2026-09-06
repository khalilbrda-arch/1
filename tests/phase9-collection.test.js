const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

function context() {
  const c = vm.createContext({ console, Date, Number, Math, Set });
  for (const file of [
    'src/core/EventBus.js', 'src/core/Config.js', 'src/core/DataContracts.js',
    'src/core/GameState.js', 'src/progression/ProgressionSystem.js',
    'src/collection/CollectionSystem.js', 'src/economy/EconomySystem.js',
    'src/merge/MergeSystem.js', 'src/save/SaveManager.js'
  ]) vm.runInContext(read(file), c);
  return c;
}

function init(c, overrides = {}) {
  vm.runInContext(`Object.assign(GameState.player, ${JSON.stringify({ level: 1, xp: 0, currency: 0 })}); GameState.collection=${JSON.stringify({items:{},unlocked:[],upgrades:{}})};`, c);
  if (overrides.level) vm.runInContext(`GameState.player.level=${overrides.level};`, c);
  vm.runInContext('ProgressionSystem.init(GameState); CollectionSystem.init(GameState); EconomySystem.init(0); MergeSystem.init(GameState);', c);
}

test('Phase 9: collection definitions are centralized, validated, and include rarity/upgrade/merge metadata', () => {
  const c = context();
  assert.equal(vm.runInContext('DataContracts.validateConfig()', c), true);
  assert.equal(vm.runInContext('DataContracts.validateCollectionDefinition(CONFIG.COLLECTION.ITEMS.cannon_core)', c), true);
  assert.equal(vm.runInContext('CollectionSystem.isKnown("reinforced_cannon_core")', c), true);
  assert.equal(vm.runInContext('CollectionSystem.getDefinition("reinforced_cannon_core").rarity', c), 'Rare');
});

test('Phase 9: ownership accepts only known, unlocked, positive safe quantities', () => {
  const c = context(); init(c);
  assert.equal(vm.runInContext('CollectionSystem.addQuantity("cannon_core", 3, "test")', c), true);
  assert.equal(vm.runInContext('CollectionSystem.getQuantity("cannon_core")', c), 3);
  assert.equal(vm.runInContext('CollectionSystem.addQuantity("missing", 1)', c), false);
  assert.equal(vm.runInContext('CollectionSystem.addQuantity("cannon_core", -1)', c), false);
  assert.equal(vm.runInContext('CollectionSystem.addQuantity("cannon_core", Infinity)', c), false);
});

test('Phase 9: non-stackable items cannot exceed one owned copy', () => {
  const c = context(); init(c);
  assert.equal(vm.runInContext('CollectionSystem.addQuantity("cannon", 2)', c), false);
  assert.equal(vm.runInContext('CollectionSystem.getQuantity("cannon")', c), 0);
});

test('Phase 9: level-driven unlocks update deterministically', () => {
  const c = context(); init(c, { level: 3 });
  assert.equal(vm.runInContext('CollectionSystem.isUnlocked("cannon_core")', c), true);
  assert.equal(vm.runInContext('CollectionSystem.isUnlocked("reinforced_cannon_core")', c), true);
  assert.equal(vm.runInContext('CollectionSystem.isUnlocked("cannon")', c), true);
  assert.ok(vm.runInContext('CollectionSystem.getSnapshot().unlocked.includes("reinforced_cannon_core")', c));
});

test('Phase 9: upgrade state is bounded and requires ownership', () => {
  const c = context(); init(c, { level: 3 });
  assert.equal(vm.runInContext('CollectionSystem.setUpgradeLevel("reinforced_cannon_core", 2)', c), false);
  vm.runInContext('CollectionSystem.addQuantity("reinforced_cannon_core", 1, "test")', c);
  assert.equal(vm.runInContext('CollectionSystem.setUpgradeLevel("reinforced_cannon_core", 2)', c), true);
  assert.equal(vm.runInContext('CollectionSystem.getUpgradeLevel("reinforced_cannon_core")', c), 2);
  assert.equal(vm.runInContext('CollectionSystem.setUpgradeLevel("reinforced_cannon_core", 99)', c), false);
});

test('Phase 9: merge eligibility is data-driven through CollectionSystem', () => {
  const c = context(); init(c, { level: 3 });
  assert.equal(vm.runInContext('CollectionSystem.isMergeEligible("reinforced_cannon_core")', c), true);
  assert.equal(vm.runInContext('CollectionSystem.isMergeEligible("cannon")', c), false);
});

test('Phase 9: removal is atomic on insufficient ownership', () => {
  const c = context(); init(c);
  vm.runInContext('CollectionSystem.addQuantity("cannon_core", 2, "test")', c);
  assert.equal(vm.runInContext('CollectionSystem.removeQuantity("cannon_core", 3)', c), false);
  assert.equal(vm.runInContext('CollectionSystem.getQuantity("cannon_core")', c), 2);
});

test('Phase 9: malformed collection state is sanitized without unknown content', () => {
  const c = context();
  vm.runInContext(`GameState.collection={items:{cannon_core:2,missing:100,bad:NaN,inf:Infinity,neg:-1,float:1.5},unlocked:["cannon_core",7,"cannon_core"],upgrades:{reinforced_cannon_core:99,missing:4,bad:0}}; GameState.player.level=3; CollectionSystem.init(GameState);`, c);
  assert.deepEqual(JSON.parse(JSON.stringify(vm.runInContext('CollectionSystem.getSnapshot()', c))), {
    items: { cannon_core: 2 }, unlocked: ['cannon_core','reinforced_cannon_core','cannon'], upgrades: {}
  });
});

test('Phase 9: collection persistence round-trips ownership, unlocks and upgrade state', () => {
  const c = context(); init(c, { level: 3 });
  vm.runInContext('CollectionSystem.addQuantity("reinforced_cannon_core", 1, "test"); CollectionSystem.setUpgradeLevel("reinforced_cannon_core", 2);', c);
  vm.runInContext('savedPayload=SaveManager.serialize({gameState:GameState,waveManager:{currentWave:2},defenseManager:{defenses:[]}});', c);
  assert.equal(vm.runInContext('SaveManager.validate(savedPayload)', c), true);
  vm.runInContext('GameState.collection={items:{},unlocked:[],upgrades:{}}; CollectionSystem.load(savedPayload.collection);', c);
  assert.equal(vm.runInContext('CollectionSystem.getQuantity("reinforced_cannon_core")', c), 1);
  assert.equal(vm.runInContext('CollectionSystem.getUpgradeLevel("reinforced_cannon_core")', c), 2);
});

test('Phase 9: saved malformed upgrades/ids are rejected by SaveManager validation', () => {
  const c = context(); init(c, { level: 3 });
  assert.equal(vm.runInContext('SaveManager.validate({schemaVersion:1,wave:1,player:{level:1,xp:0,currency:0,rank:"Novice"},base:{hp:100,maxHp:100},interactions:{openedIds:[]},progression:{unlockedMaps:["bay_start"],unlockedSystems:[],unlockedDefenses:["cannon"],completedMilestones:[]},collection:{items:{cannon_core:1},unlocked:["cannon_core"],upgrades:{cannon_core:1}},defenses:[]})', c), true);
  vm.runInContext('let malformed={schemaVersion:1,wave:1,player:{level:1,xp:0,currency:0,rank:"Novice"},base:{hp:100,maxHp:100},interactions:{openedIds:[]},progression:{unlockedMaps:["bay_start"],unlockedSystems:[],unlockedDefenses:["cannon"],completedMilestones:[]},collection:{items:{cannon_core:1},unlocked:["cannon_core"],upgrades:{cannon_core:0}},defenses:[]};', c);
  assert.equal(vm.runInContext('SaveManager.validate(malformed)', c), false);
});

test('Phase 9: MergeSystem consumes and creates through CollectionSystem owner', () => {
  const c = context(); init(c, { level: 3 });
  vm.runInContext('CollectionSystem.addQuantity("cannon_core",3,"test"); EconomySystem.add(100);', c);
  assert.equal(vm.runInContext('MergeSystem.merge("reinforced_cannon_core").ok', c), true);
  assert.equal(vm.runInContext('CollectionSystem.getQuantity("cannon_core")', c), 0);
  assert.equal(vm.runInContext('CollectionSystem.getQuantity("reinforced_cannon_core")', c), 1);
});
