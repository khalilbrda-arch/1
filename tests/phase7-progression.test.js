const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

function context() {
  const c = vm.createContext({ console, setTimeout, clearTimeout });
  vm.runInContext(read('src/core/EventBus.js'), c);
  vm.runInContext(read('src/core/Config.js'), c);
  vm.runInContext(read('src/core/GameState.js'), c);
  vm.runInContext(read('src/progression/ProgressionSystem.js'), c);
  return c;
}

test('Phase 7: progression initializes with safe defaults and base unlocks', () => {
  const c = context();
  assert.equal(vm.runInContext('ProgressionSystem.init(GameState).state.player.level', c), 1);
  assert.deepEqual(JSON.parse(JSON.stringify(vm.runInContext('GameState.unlocked.areas.slice()', c))), ['bay_start']);
  assert.deepEqual(JSON.parse(JSON.stringify(vm.runInContext('GameState.unlocked.defenses.slice()', c))), ['cannon']);
  assert.deepEqual(JSON.parse(JSON.stringify(vm.runInContext('GameState.progression.completedMilestones.slice()', c))), ['wave_1_ready']);
});

test('Phase 7: XP levels up without invalid states and emits ProgressionChanged', () => {
  const c = context();
  vm.runInContext(`ProgressionSystem.init(GameState); let evt=null; EventBus.on('ProgressionChanged', p=>evt=p); ProgressionSystem.addXP(350,'test');`, c);
  assert.equal(vm.runInContext('GameState.player.level', c), 3);
  assert.equal(vm.runInContext('GameState.player.xp', c), 50);
  assert.equal(vm.runInContext('evt.reason', c), 'test');
  assert.equal(vm.runInContext('evt.levelsGained', c), 2);
});

test('Phase 7: level unlocks maps and systems deterministically', () => {
  const c = context();
  vm.runInContext('ProgressionSystem.init(GameState); ProgressionSystem.addXP(300);', c);
  assert.equal(vm.runInContext("ProgressionSystem.isUnlocked('areas','bay_2')", c), true);
  assert.equal(vm.runInContext("ProgressionSystem.isUnlocked('systems','advanced_defenses')", c), true);
  assert.equal(vm.runInContext("ProgressionSystem.isUnlocked('areas','bay_3')", c), false);
});

test('Phase 7: wave XP follows centralized configuration', () => {
  const c = context();
  vm.runInContext('ProgressionSystem.init(GameState); ProgressionSystem.awardWaveCompletion(3);', c);
  assert.equal(vm.runInContext('GameState.player.xp', c), 45);
});

test('Phase 7: progression serializes and reloads persisted fields including defense unlocks', () => {
  const c = context();
  vm.runInContext(`ProgressionSystem.init(GameState); ProgressionSystem.addXP(550); const saved=ProgressionSystem.serialize(); ProgressionSystem.load({level:4,experience:12,unlockedMaps:['bay_start','bay_2'],unlockedDefenses:['cannon','sniper'],unlockedSystems:['advanced_defenses'],completedMilestones:['x']});`, c);
  assert.deepEqual(JSON.parse(JSON.stringify(vm.runInContext('saved', c))), {
    level: 3,
    experience: 250,
    unlockedMaps: ['bay_start', 'bay_2'],
    unlockedSystems: ['advanced_defenses'],
    unlockedDefenses: ['cannon'],
    completedMilestones: ['wave_1_ready', 'advanced_defenses_unlocked'],
  });
  assert.equal(vm.runInContext('GameState.player.level', c), 4);
  assert.equal(vm.runInContext('GameState.player.xp', c), 12);
  assert.equal(vm.runInContext("GameState.unlocked.areas.includes('bay_2')", c), true);
  assert.equal(vm.runInContext("GameState.unlocked.defenses.includes('sniper')", c), true);
});

test('Phase 7: malformed progression values are sanitized and cannot create invalid level state', () => {
  const c = context();
  vm.runInContext(`ProgressionSystem.init(GameState); ProgressionSystem.load({level:Infinity,experience:NaN,unlockedMaps:[1,'bay_2','bay_2'],unlockedDefenses:[null,'cannon'],unlockedSystems:['advanced_defenses'],completedMilestones:[{},'x','x']});`, c);
  assert.equal(vm.runInContext('Number.isFinite(GameState.player.level)', c), true);
  assert.equal(vm.runInContext('Number.isFinite(GameState.player.xp)', c), true);
  assert.ok(vm.runInContext('GameState.player.level >= 1', c));
  assert.ok(vm.runInContext('GameState.player.xp >= 0', c));
  assert.deepEqual(JSON.parse(JSON.stringify(vm.runInContext('GameState.unlocked.areas', c))), ['bay_2', 'bay_start']);
});

test('Phase 7: GameState is not a second progression authority', () => {
  const c = context();
  assert.equal(vm.runInContext("typeof GameState.addXP", c), 'undefined');
  assert.equal(vm.runInContext("typeof GameState.unlockArea", c), 'undefined');
  assert.equal(vm.runInContext("typeof GameState.unlockSystem", c), 'undefined');
  assert.equal(vm.runInContext("typeof GameState.completeMilestone", c), 'undefined');
});


test('Phase 7: full save payload retains progression after serialization validation', () => {
  const c = vm.createContext({ console, Date, Number, Math, Set });
  vm.runInContext(read('src/save/SaveManager.js'), c);
  const payload = {
    schemaVersion: 1, wave: 3,
    player: { level: 3, xp: 40, currency: 100, rank: 'Novice' },
    base: { hp: 80, maxHp: 100 },
    interactions: { openedIds: [] },
    progression: {
      unlockedMaps: ['bay_start', 'bay_2'],
      unlockedSystems: ['advanced_defenses'],
      unlockedDefenses: ['cannon'],
      completedMilestones: ['wave_1_ready', 'advanced_defenses_unlocked'],
    },
    defenses: [],
  };
  c.payload = payload;
  assert.equal(vm.runInContext('SaveManager.validate(payload)', c), true);
});


test('Phase 7: DefenseManager consults ProgressionSystem before entering placement mode', () => {
  const source = read('src/defenses/DefenseManager.js');
  assert.match(source, /ProgressionSystem\.isUnlocked\(\s*["']defenses["']/);
  assert.match(source, /هذا الدفاع غير مفتوح بعد/);
});


test('Phase 7: SaveManager apply plus ProgressionSystem init restores the same unlock state after reload', () => {
  const c = context();
  vm.runInContext(read('src/save/SaveManager.js'), c);
  vm.runInContext(`
    const restored = {
      schemaVersion: 1, wave: 4,
      player: { level: 5, xp: 20, currency: 0, rank: 'Novice' },
      base: { hp: 100, maxHp: 100 },
      interactions: { openedIds: [] },
      progression: {
        unlockedMaps: ['bay_start', 'bay_2', 'bay_3'],
        unlockedSystems: ['advanced_defenses', 'advanced_systems'],
        unlockedDefenses: ['cannon'],
        completedMilestones: ['wave_1_ready', 'advanced_defenses_unlocked', 'advanced_systems_unlocked'],
      },
      defenses: [],
    };
    SaveManager.applyToGameState(restored, GameState);
    ProgressionSystem.init(GameState);
  `, c);
  assert.equal(vm.runInContext("GameState.player.level", c), 5);
  assert.equal(vm.runInContext("ProgressionSystem.isUnlocked('areas','bay_3')", c), true);
  assert.equal(vm.runInContext("ProgressionSystem.isUnlocked('systems','advanced_systems')", c), true);
});
