/** ProgressionUI.js — Phase 7 */
const ProgressionUI = {
  _container: null, _level: null, _text: null, _bar: null,
  _initialized: false,
  init() {
    if (this._initialized) return;
    const c = document.createElement('div'); c.id='progression-hud';
    c.style.cssText='position:fixed;top:58px;left:10px;width:190px;padding:7px 10px;background:rgba(8,18,30,.84);border:1px solid rgba(255,255,255,.12);border-radius:10px;z-index:55;pointer-events:none;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;box-sizing:border-box;';
    const head=document.createElement('div'); head.style.cssText='display:flex;justify-content:space-between;color:#fff;font-size:11px;font-weight:700;';
    this._level=document.createElement('span'); this._text=document.createElement('span'); head.append(this._level,this._text);
    const bg=document.createElement('div'); bg.style.cssText='height:6px;margin-top:5px;border-radius:4px;background:rgba(255,255,255,.12);overflow:hidden;';
    this._bar=document.createElement('div'); this._bar.style.cssText='height:100%;width:0%;background:#72d7ff;border-radius:4px;transition:width .25s ease;'; bg.appendChild(this._bar); c.append(head,bg); document.body.appendChild(c); this._container=c; this._initialized=true;
    if(typeof EventBus!=='undefined') EventBus.on('ProgressionChanged',()=>this.update());
    this.update(); return this;
  },
  getDisplayData(){
    const s=typeof ProgressionSystem!=='undefined'?ProgressionSystem:null;
    if(!s || !s.state) return {level:1,xp:0,xpRequired:100};
    return {level:s.state.player.level,xp:s.state.player.xp,xpRequired:s.xpToNextLevel()};
  },
  update(){
    if(!this._initialized) return; const d=this.getDisplayData();
    this._level.textContent=`المستوى ${d.level}`; this._text.textContent=`${Math.floor(d.xp)} / ${Math.floor(d.xpRequired)} XP`;
    this._bar.style.width=`${Math.max(0,Math.min(100,d.xp/d.xpRequired*100))}%`;
  }
};
