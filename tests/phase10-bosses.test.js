const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
function context() {
  const c = vm.createContext({ console, Date, Number, Math, Set, Object, JSON });
  for (const file of ['src/core/EventBus.js','src/core/Config.js','src/core/DataContracts.js','src/bosses/BossSystem.js']) vm.runInContext(read(file), c);
  return c;
}
function installFakeBoss(c) {
  vm.runInContext('globalThis.EnemyManager={getEnemyById:()=>boss}; globalThis.WaveManager={currentWave:5}; globalThis.boss={id:"b1",name:"حارس الأعماق",isBoss:true,bossId:"depth_guardian",maxHp:220,hp:220,alive:true,reward:100,getHpRatio(){return this.hp/this.maxHp;},hasReachedBase(){return false;}};', c);
}
test('Phase 10: boss definitions are centralized and validated', () => {
  const c = context();
  assert.equal(vm.runInContext('DataContracts.validateBossDefinition(CONFIG.BOSSES.TYPES.depth_guardian)', c), true);
  assert.equal(vm.runInContext('DataContracts.validateConfig()', c), true);
});
test('Phase 10: boss waves and spawn data are deterministic', () => {
  const c = context();
  assert.equal(vm.runInContext('BossSystem.isBossWave(5)', c), true);
  assert.equal(vm.runInContext('BossSystem.isBossWave(4)', c), false);
  const d = vm.runInContext('BossSystem.createSpawnData(5)', c);
  assert.equal(d.isBoss, true); assert.equal(d.bossId, 'depth_guardian'); assert.equal('id' in d, false);
  assert.ok(d.maxHp > 0 && d.damage > 0);
});
test('Phase 10: boss phases and enrage are deterministic', () => {
  const c = context();
  vm.runInContext('const events=[]; EventBus.on("BossPhaseChanged", p=>events.push(["phase",p.phase])); EventBus.on("BossEnraged", p=>events.push(["enrage",p.phase]));', c);
  installFakeBoss(c);
  vm.runInContext('BossSystem.init(); BossSystem.configureEnemy(boss); boss.hp=120; BossSystem._updatePhase(boss); boss.hp=60; BossSystem._updatePhase(boss); boss.hp=40; BossSystem._updatePhase(boss);', c);
  assert.deepEqual(JSON.parse(JSON.stringify(vm.runInContext('events', c))), [['phase',2],['phase',3],['enrage',3]]);
});
test('Phase 10: boss ability is emitted with an actual gameplay effect payload', () => {
  const c = context();
  vm.runInContext('globalThis.events=[]; EventBus.on("BossAbilityTriggered", p=>events.push(p));', c);
  installFakeBoss(c);
  vm.runInContext('BossSystem.init(); BossSystem.configureEnemy(boss); BossSystem._abilityTimer=0; BossSystem.update(0.1);', c);
  assert.equal(vm.runInContext('events[0].abilityId', c), 'depth_pulse');
  assert.equal(vm.runInContext('events[0].damageToBase', c), 8);
});
test('Phase 10: boss death emits a single reward boundary', () => {
  const c = context();
  vm.runInContext('globalThis.count=0; globalThis.reward=0; EventBus.on("BossDefeated", p=>{count++; reward=p.reward;});', c);
  installFakeBoss(c);
  vm.runInContext('BossSystem.init(); BossSystem.configureEnemy(boss); BossSystem._onEnemyDied({enemyId:"b1"});', c);
  assert.equal(vm.runInContext('count', c), 1); assert.equal(vm.runInContext('reward', c), 100); assert.equal(vm.runInContext('BossSystem.activeBossId', c), null);
});

test('Phase 10: boss state clears when the boss reaches the base or the base is destroyed', () => {
  const c = context();
  installFakeBoss(c);
  vm.runInContext('BossSystem.init(); BossSystem.configureEnemy(boss); BossSystem._onEnemyDied({enemyId:"other"});', c);
  assert.equal(vm.runInContext('BossSystem.activeBossId', c), 'b1');
  vm.runInContext('EventBus.emit("EnemyReachedBase", {enemyId:"b1"});', c);
  assert.equal(vm.runInContext('BossSystem.activeBossId', c), null);
  installFakeBoss(c);
  vm.runInContext('BossSystem.configureEnemy(boss); EventBus.emit("BaseDestroyed", {});', c);
  assert.equal(vm.runInContext('BossSystem.activeBossId', c), null);
});
test('Phase 10: source architecture keeps boss UI presentation-only and integrates boss hooks', () => {
  const game = read('src/core/Game.js'); const bossUI = read('src/ui/BossUI.js'); const wave = read('src/waves/WaveOrchestrator.js');
  assert.ok(game.includes('BossSystem.init()') && game.includes('BossSystem.update(delta)') && game.includes('BossAbilityTriggered'));
  assert.ok(wave.includes('BossSystem.isBossWave') && wave.includes('BossSystem.createSpawnData'));
  assert.equal(bossUI.includes('EventBus.emit'), false); assert.equal(bossUI.includes('GameState'), false);
});


test('Phase 10 regression: Game does not award a boss reward through the generic EnemyDied boundary', () => {
  const game = read('src/core/Game.js');
  const start = game.indexOf('EventBus.on(\n  "EnemyDied"');
  const end = game.indexOf('EventBus.on("QuestRewardClaimed"', start);
  const block = game.slice(start, end);
  assert.ok(block.includes('if (payload.type !== "boss")'));
});

test('Phase 10 regression: boss enrage ability multiplier is data-driven', () => {
  const config = read('src/core/Config.js'); const boss = read('src/bosses/BossSystem.js'); const contracts = read('src/core/DataContracts.js');
  assert.ok(config.includes('enrageDamageMultiplier: 1.25'));
  assert.ok(boss.includes('def.ability.enrageDamageMultiplier'));
  assert.ok(contracts.includes('definition.ability.enrageDamageMultiplier'));
});
