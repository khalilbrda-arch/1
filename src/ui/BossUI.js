/**
 * BossUI.js — Phase 10.
 * Presentation-only boss status; gameplay state remains in the boss gameplay system.
 */
const BossUI = {
  root: null,
  title: null,
  bar: null,
  phase: null,
  ability: null,

  init() {
    this.root = document.createElement('div');
    this.root.id = 'boss-ui';
    this.root.style.cssText = 'position:fixed;top:72px;left:50%;transform:translateX(-50%);width:min(88vw,520px);padding:8px 10px;border-radius:10px;background:rgba(10,14,22,.82);color:#fff;font:600 13px system-ui,sans-serif;display:none;z-index:20;pointer-events:none;box-sizing:border-box;text-align:center;';
    this.title = document.createElement('div');
    this.bar = document.createElement('div');
    this.bar.style.cssText = 'height:10px;margin:6px 0;border-radius:99px;background:#351a22;overflow:hidden;';
    this.phase = document.createElement('div');
    this.ability = document.createElement('div');
    this.root.append(this.title, this.bar, this.phase, this.ability);
    const fill = document.createElement('div');
    fill.id = 'boss-hp-fill';
    fill.style.cssText = 'height:100%;width:100%;background:#d64646;transition:width .12s linear;';
    this.bar.appendChild(fill);
    document.body.appendChild(this.root);
    return this;
  },

  update(data = null) {
    if (!this.root || !data || !data.active) {
      if (this.root) this.root.style.display = 'none';
      return;
    }
    this.root.style.display = 'block';
    this.title.textContent = `${data.name} — ${Math.ceil(data.hp)} / ${Math.ceil(data.maxHp)}`;
    const fill = this.bar.firstChild;
    if (fill) fill.style.width = `${Math.max(0, Math.min(1, data.ratio)) * 100}%`;
    this.phase.textContent = `Phase ${data.phase}${data.enraged ? ' — ENRAGED' : ''}`;
    this.ability.textContent = data.abilityReadyIn > 0 ? `Ability: ${data.abilityReadyIn.toFixed(1)}s` : 'Ability ready';
  },
};
if (typeof globalThis !== 'undefined') globalThis.BossUI = BossUI;
