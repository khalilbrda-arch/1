const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

function context() {
  const c = vm.createContext({ console, Date, Number, Math, Object, JSON, Set, Array });
  for (const file of [
    'src/core/EventBus.js', 'src/core/Config.js', 'src/core/DataContracts.js',
    'src/core/GameState.js', 'src/progression/ProgressionSystem.js',
    'src/collection/CollectionSystem.js', 'src/economy/EconomySystem.js',
    'src/quests/QuestSystem.js', 'src/save/SaveManager.js'
  ]) vm.runInContext(read(file), c);
  return c;
}

function init(c, level = 3) {
  vm.runInContext(`GameState.player.level=${level}; GameState.player.xp=0; GameState.player.currency=0; GameState.quests={active:{},completed:[],claimed:[]}; GameState.collection={items:{},unlocked:[],upgrades:{}};`, c);
  vm.runInContext('ProgressionSystem.init(GameState); CollectionSystem.init(GameState); EconomySystem.init(0); QuestSystem.init(GameState);', c);
}

test('Phase 12: quest definitions are centralized and validated', () => {
  const c = context();
  assert.equal(vm.runInContext('DataContracts.validateConfig()', c), true);
  assert.equal(vm.runInContext('Object.keys(CONFIG.QUESTS.TYPES).length', c), 6);
  assert.equal(vm.runInContext('DataContracts.validateQuestDefinition(CONFIG.QUESTS.TYPES.quest_first_blood)', c), true);
});

test('Phase 12: quest system owns active progress and reacts to gameplay events', () => {
  const c = context(); init(c);
  assert.equal(vm.runInContext('QuestSystem.getState("quest_first_blood").progress', c), 0);
  vm.runInContext('EventBus.emit("EnemyDied", {enemyId:"e1", type:"basic", reward:5});', c);
  assert.equal(vm.runInContext('QuestSystem.getState("quest_first_blood").progress', c), 1);
  assert.equal(vm.runInContext('QuestSystem.getState("quest_first_blood").completed', c), true);
});

test('Phase 12: matched objectives count only matching events and item acquisition uses amounts', () => {
  const c = context(); init(c);
  vm.runInContext('EventBus.emit("DefensePlaced", {typeId:"sniper"}); EventBus.emit("DefensePlaced", {typeId:"cannon"});', c);
  assert.equal(vm.runInContext('QuestSystem.getState("quest_cannon_operator").progress', c), 1);
  vm.runInContext('EventBus.emit("ItemAcquired", {itemId:"cannon_core", amount:3});', c);
  assert.equal(vm.runInContext('QuestSystem.getState("quest_core_collector").progress', c), 3);
  vm.runInContext('EventBus.emit("ItemAcquired", {itemId:"cannon_core", amount:10});', c);
  assert.equal(vm.runInContext('QuestSystem.getState("quest_core_collector").progress', c), 5);
});

test('Phase 12: completion emits exactly once and caps progress at target', () => {
  const c = context(); init(c);
  const events = vm.runInContext('const e=[]; EventBus.on("QuestCompleted", p=>e.push(p)); EventBus.emit("WaveCompleted", {wave:1}); EventBus.emit("WaveCompleted", {wave:2}); EventBus.emit("WaveCompleted", {wave:3}); EventBus.emit("WaveCompleted", {wave:4}); e', c);
  assert.equal(events.length, 1);
  assert.equal(vm.runInContext('QuestSystem.getState("quest_wave_runner").progress', c), 3);
});

test('Phase 12: reward claiming is idempotent and emits a controlled request/claim pair', () => {
  const c = context(); init(c);
  vm.runInContext('EventBus.emit("EnemyDied", {enemyId:"e1"});', c);
  const result = vm.runInContext('const e=[]; EventBus.on("QuestRewardClaimRequested", p=>e.push(["request",p.questId])); EventBus.on("QuestRewardClaimed", p=>e.push(["claimed",p.questId])); QuestSystem.claimQuestReward("quest_first_blood"); QuestSystem.claimQuestReward("quest_first_blood"); e', c);
  assert.deepEqual(JSON.parse(JSON.stringify(result)), [['request','quest_first_blood']]);
  vm.runInContext('QuestSystem.confirmRewardClaim("quest_first_blood");', c);
  assert.equal(vm.runInContext('QuestSystem.claimQuestReward("quest_first_blood")', c), false);
  assert.equal(vm.runInContext('QuestSystem.getState("quest_first_blood")', c), null);
  assert.ok(vm.runInContext('GameState.quests.claimed.includes("quest_first_blood")', c));
});

test('Phase 12: quest persistence round-trips progress, completion, and claimed state', () => {
  const c = context(); init(c);
  vm.runInContext('EventBus.emit("WaveCompleted", {wave:1});', c);
  vm.runInContext('savedPayload=SaveManager.serialize({gameState:GameState,waveManager:{currentWave:1},defenseManager:{defenses:[]}});', c);
  assert.equal(vm.runInContext('SaveManager.validate(savedPayload)', c), true);
  vm.runInContext('GameState.quests={active:{},completed:[],claimed:[]}; QuestSystem.init(GameState); QuestSystem.load(savedPayload.quests);', c);
  assert.equal(vm.runInContext('QuestSystem.getState("quest_wave_runner").progress', c), 1);
  vm.runInContext('EventBus.emit("EnemyDied", {enemyId:"e1"}); QuestSystem.claimQuestReward("quest_first_blood"); QuestSystem.confirmRewardClaim("quest_first_blood");', c);
  assert.ok(vm.runInContext('GameState.quests.claimed.includes("quest_first_blood")', c));
});

test('Phase 12: malformed quest save data is rejected', () => {
  const c = context(); init(c);
  assert.equal(vm.runInContext('SaveManager.validate({schemaVersion:1,wave:1,player:{level:1,xp:0,currency:0,rank:"Novice"},base:{hp:100,maxHp:100},interactions:{openedIds:[]},progression:{unlockedMaps:["bay_start"],unlockedSystems:[],unlockedDefenses:["cannon"],completedMilestones:[]},collection:{items:{}},quests:{active:{quest_first_blood:{progress:-1,completed:false}},completed:[],claimed:[]},defenses:[]})', c), false);
  assert.equal(vm.runInContext('SaveManager.validate({schemaVersion:1,wave:1,player:{level:1,xp:0,currency:0,rank:"Novice"},base:{hp:100,maxHp:100},interactions:{openedIds:[]},progression:{unlockedMaps:["bay_start"],unlockedSystems:[],unlockedDefenses:["cannon"],completedMilestones:[]},collection:{items:{}},quests:{active:{quest_first_blood:{progress:1,completed:"yes"}},completed:[],claimed:[]},defenses:[]})', c), false);
});

test('Phase 12: defense placement publishes an event without coupling QuestSystem into DefenseManager', () => {
  const manager = read('src/defenses/DefenseManager.js');
  const quest = read('src/quests/QuestSystem.js');
  assert.ok(manager.includes('EventBus.emit("DefensePlaced"'));
  assert.equal(quest.includes('DefenseManager'), false);
});

test('Phase 12: Game and index keep quest ownership and presentation boundaries', () => {
  const game = read('src/core/Game.js'); const index = read('index.html'); const ui = read('src/ui/QuestUI.js');
  assert.ok(game.includes('QuestSystem.init(GameState)'));
  assert.ok(game.includes('QuestRewardClaimRequested'));
  assert.ok(index.includes('src/quests/QuestSystem.js'));
  assert.ok(index.includes('src/ui/QuestUI.js'));
  assert.equal(ui.includes('GameState'), false);
  assert.equal(ui.includes('EconomySystem.add'), false);
});




test('Phase 12 regression: quest reward failure cannot partially grant currency or XP', () => {
  const c = context(); init(c);
  vm.runInContext('CONFIG.QUESTS.TYPES.quest_first_blood.rewards = { currency: 25, xp: 10, item: { itemId: "missing_item", amount: 1 } };', c);
  vm.runInContext('EventBus.emit("EnemyDied", {enemyId:"e1"}); QuestSystem.claimQuestReward("quest_first_blood");', c);
  assert.equal(vm.runInContext('EconomySystem.getBalance()', c), 0);
  assert.equal(vm.runInContext('GameState.player.xp', c), 0);
  assert.equal(vm.runInContext('GameState.quests.claimed.includes("quest_first_blood")', c), false);
});

test('Phase 12 regression: runtime config version matches the current package version', () => {
  const c = context();
  assert.equal(vm.runInContext('CONFIG.VERSION', c), '0.13.0');
});

test('Phase 12: Game persists a successful quest claim immediately', () => {
  const game = read('src/core/Game.js');
  assert.ok(game.includes('EventBus.on("QuestRewardClaimed"'));
  assert.ok(game.includes('SaveManager.save({ gameState: GameState, waveManager: WaveManager, defenseManager: DefenseManager })'));
});
