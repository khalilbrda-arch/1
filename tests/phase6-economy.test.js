/**
 * Infinity Depths
 * Phase 6 — Economy Tests
 *
 * الهدف:
 * - التأكد أن EconomySystem يرفض القيم غير الصالحة (NaN، Infinity،
 *   السالبة) بدل تمريرها إلى الرصيد (SAVE_SCHEMA.md §10،
 *   GAME_SPEC.md §48 "Validate resource transactions").
 * - التأكد أن EconomySystem يبقى المصدر الوحيد لملكية الرصيد أثناء
 *   التشغيل، وأن GameState لم يعد يحتوي دوال اقتصاد مكررة (canAfford/
 *   spendCurrency/rewardEnemyKill) — انظر DECISIONS.md.
 * - التأكد أن SaveManager.serialize() لا يمكن أن يُخرج currency غير
 *   صالح حتى لو كانت الحالة الحية فاسدة (NaN/Infinity).
 * - التأكد أن CONFIG.ECONOMY.STARTING_CURRENCY هو ما يُهيّئ به
 *   GameState.player.currency فعليًا (أساس التوازن/Balancing).
 * - التأكد أن EconomyUI (الواجهة الجديدة) تعرض الرصيد الابتدائي
 *   بشكل صحيح، وتُحدَّث عند CurrencyChanged، وتتجاهل بصمت أي رصيد
 *   غير صالح بدل الانهيار.
 *
 * التشغيل:
 *   node --test tests/phase6-economy.test.js
 *
 * ملاحظة:
 * هذه الاختبارات لا تحتاج Three.js أو DOM حقيقي — نستخدم documentStub
 * بسيط بنفس أسلوب tests/phase5-boot-order.test.js.
 */

const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");

function readSource(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

// نفس آلية الاستخراج المستخدمة في phase4-foundation.test.js: ملفات
// اللعبة تُعرَّف بـ "const X = {...}"، وهذا لا يصبح تلقائيًا خاصية
// على context عند تشغيله عبر vm.runInContext لملف منفصل — لذلك نعيد
// القيمة صراحة من نفس النطاق اللغوي.
const EXPORTED_NAMES = {
  "src/core/GameState.js": "GameState",
  "src/economy/EconomySystem.js": "EconomySystem",
  "src/ui/EconomyUI.js": "EconomyUI",
};

function loadScript(relativePath, context) {
  const source = readSource(relativePath);

  const exportedName = EXPORTED_NAMES[relativePath];

  if (exportedName) {
    const value = vm.runInContext(
      `(function () {
        ${source}
        return ${exportedName};
      })()`,
      context,
      { filename: relativePath }
    );

    context[exportedName] = value;

    return value;
  }

  return vm.runInContext(source, context, { filename: relativePath });
}

function createContext(overrides = {}) {
  const context = vm.createContext({
    console,
    Math,
    Number,
    String,
    Boolean,
    Object,
    Array,
    JSON,
    ...overrides,
  });

  return context;
}

function baseConfig() {
  return {
    DEFENSE_MAP: {
      BASE: { hp: 100, maxHp: 100 },
    },
    ECONOMY: {
      STARTING_CURRENCY: 0,
    },
  };
}

// ============================================================
// ECONOMYSYSTEM — VALIDATION (No trusting invalid input)
// ============================================================

test("EconomySystem: init rejects NaN and falls back to 0", () => {
  const context = createContext();
  loadScript("src/economy/EconomySystem.js", context);

  context.EconomySystem.init(Number("not-a-number"));

  assert.equal(context.EconomySystem.getBalance(), 0);
});

test("EconomySystem: add rejects Infinity and does not corrupt the balance", () => {
  const context = createContext();
  loadScript("src/economy/EconomySystem.js", context);

  context.EconomySystem.init(50);

  const result = context.EconomySystem.add(Infinity);

  // Infinity مرفوضة بالكامل كمعاملة غير صالحة (amount = 0)،
  // والرصيد يبقى كما كان قبل المحاولة.
  assert.equal(result.amount, 0);
  assert.equal(context.EconomySystem.getBalance(), 50);
});

test("EconomySystem: spend rejects a negative amount instead of adding currency", () => {
  const context = createContext();
  loadScript("src/economy/EconomySystem.js", context);

  context.EconomySystem.init(10);

  // إنفاق قيمة سالبة يجب ألا يتحول إلى إضافة رصيد خفية.
  const spent = context.EconomySystem.spend(-999);

  assert.equal(spent, true); // canAfford(0) صحيح دائمًا
  assert.equal(context.EconomySystem.getBalance(), 10);
});

test("EconomySystem: getBalance self-heals if the balance field is externally corrupted to Infinity", () => {
  const context = createContext();
  loadScript("src/economy/EconomySystem.js", context);

  context.EconomySystem.init(10);

  // محاكاة فساد مباشر للحالة (مثلاً عبر كود خارجي خاطئ) بدل معاملة صالحة.
  context.EconomySystem.balance = Infinity;

  assert.equal(context.EconomySystem.getBalance(), 0);
});

test("EconomySystem: canAfford treats a NaN cost as free (0), not as unaffordable", () => {
  const context = createContext();
  loadScript("src/economy/EconomySystem.js", context);

  context.EconomySystem.init(0);

  assert.equal(
    context.EconomySystem.canAfford(Number("nope")),
    true
  );
});

// ============================================================
// SINGLE OWNERSHIP — GameState no longer duplicates currency logic
// ============================================================

test("GameState: no longer exposes canAfford/spendCurrency/rewardEnemyKill (EconomySystem is sole runtime authority)", () => {
  const context = createContext({ CONFIG: baseConfig() });
  loadScript("src/core/GameState.js", context);

  assert.equal(typeof context.GameState.canAfford, "undefined");
  assert.equal(typeof context.GameState.spendCurrency, "undefined");
  assert.equal(typeof context.GameState.rewardEnemyKill, "undefined");
});

test("GameState: player.currency initializes from CONFIG.ECONOMY.STARTING_CURRENCY", () => {
  const context = createContext({
    CONFIG: {
      DEFENSE_MAP: { BASE: { hp: 100, maxHp: 100 } },
      ECONOMY: { STARTING_CURRENCY: 250 },
    },
  });

  loadScript("src/core/GameState.js", context);

  assert.equal(context.GameState.player.currency, 250);
});

// ============================================================
// SAVE PERSISTENCE — Economy Data must stay valid (SAVE_SCHEMA.md §10)
// ============================================================

test("SaveManager.serialize: never writes Infinity/NaN currency even if runtime state is corrupted", () => {
  const source = readSource("src/save/SaveManager.js");

  // فحص بنيوي: التأكد أن سطر تسلسل currency يستخدم حارس
  // Number.isFinite صراحة (وليس الاعتماد فقط على `|| 0` الذي
  // يسمح بمرور Infinity، لأن Infinity قيمة صحيحة/truthy).
  assert.match(
    source,
    /currency[\s\S]{0,200}Number\.isFinite/,
    "SaveManager يجب أن يتحقق من Number.isFinite قبل حفظ currency."
  );
});

test("SaveManager.validate: rejects a save file with Infinity currency (regression safety net)", () => {
  // نفحص فقط أن دالة validate المُعلنة تستخدم Number.isFinite على
  // player.currency — وهي شبكة الأمان الموجودة أصلًا لجهة التحميل.
  const source = readSource("src/save/SaveManager.js");

  assert.match(
    source,
    /Number\.isFinite\(\s*p\.currency\s*\)/,
    "validate() يجب أن يرفض currency غير المنتهية (Infinity/NaN) عند التحميل."
  );
});

// ============================================================
// ECONOMY UI — Display only, no authority (GAME_SPEC.md §48)
// ============================================================

function createUiContext() {
  const created = [];

  const documentStub = {
    createElement() {
      const el = {
        style: {},
        children: [],
        appendChild(child) {
          this.children.push(child);
        },
        setAttribute() {},
      };

      created.push(el);

      return el;
    },
    body: {
      appendChild() {},
    },
  };

  const listeners = {};

  const eventBusStub = {
    on(name, handler) {
      listeners[name] = listeners[name] || [];
      listeners[name].push(handler);
    },
    emit(name, payload) {
      for (const handler of listeners[name] || []) {
        handler(payload);
      }
    },
  };

  const context = createContext({
    document: documentStub,
    EventBus: eventBusStub,
  });

  return { context, created };
}

test("EconomyUI: displays the initial balance passed to init()", () => {
  const { context, created } = createUiContext();

  loadScript("src/ui/EconomyUI.js", context);

  context.EconomyUI.init(120);

  // الترتيب داخل _create(): container، ثم icon، ثم text (آخر عنصر
  // يُنشأ هو نص الرصيد نفسه — راجع src/ui/EconomyUI.js).
  const textEl = created[created.length - 1];

  assert.equal(textEl.textContent, "120");
});

test("EconomyUI: updates the displayed balance on CurrencyChanged", () => {
  const { context, created } = createUiContext();

  loadScript("src/ui/EconomyUI.js", context);

  context.EconomyUI.init(0);

  context.EventBus.emit("CurrencyChanged", { balance: 77.9 });

  const textEl = created[created.length - 1];

  // العرض عدد صحيح (Math.floor) — لا كسور في عرض العملة.
  assert.equal(textEl.textContent, "77");
});

test("EconomyUI: ignores a non-finite balance from a malformed event instead of crashing or displaying it", () => {
  const { context, created } = createUiContext();

  loadScript("src/ui/EconomyUI.js", context);

  context.EconomyUI.init(15);

  assert.doesNotThrow(() => {
    context.EventBus.emit("CurrencyChanged", { balance: Infinity });
  });

  const textEl = created[created.length - 1];

  // الرصيد المعروض يبقى آخر قيمة صالحة، ولا يعرض Infinity أبدًا.
  assert.equal(textEl.textContent, "15");
});

test("EconomyUI: does not itself decide affordability (display-only boundary)", () => {
  const source = readSource("src/ui/EconomyUI.js");

  // نتحقق من عدم وجود استدعاء فعلي (وليس مجرد ذكر بالتعليقات) لأي
  // من عمليات القرار الاقتصادي — العرض فقط، القرار عند EconomySystem.
  assert.equal(/EconomySystem\.canAfford\s*\(/.test(source), false);
  assert.equal(/EconomySystem\.spend\s*\(/.test(source), false);
  assert.equal(/EconomySystem\.add\s*\(/.test(source), false);
});
