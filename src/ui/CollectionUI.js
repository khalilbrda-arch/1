/** CollectionUI.js — Phase 9: presentation only. */
const CollectionUI = {
  initialized: false, container: null, panel: null, list: null,
  init() {
    if (this.initialized) return this;
    const button = document.createElement('button');
    button.type='button'; button.textContent='المجموعة'; button.id='collection-button';
    button.style.cssText='position:fixed;right:10px;top:62px;z-index:70;padding:8px 11px;border:1px solid rgba(255,255,255,.16);border-radius:10px;background:rgba(8,18,30,.88);color:#fff;font:700 12px -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;touch-action:manipulation;';
    button.addEventListener('click',()=>this.toggle());
    document.body.appendChild(button);
    const panel=document.createElement('div'); panel.id='collection-panel';
    panel.style.cssText='position:fixed;right:10px;top:106px;width:280px;max-width:calc(100vw - 20px);max-height:62vh;overflow:auto;display:none;z-index:69;padding:12px;background:rgba(5,15,26,.95);border:1px solid rgba(255,255,255,.14);border-radius:14px;box-sizing:border-box;color:#fff;font:12px -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;';
    const title=document.createElement('div'); title.textContent='مجموعة العناصر'; title.style.cssText='font-weight:800;font-size:14px;margin-bottom:8px;';
    const list=document.createElement('div'); panel.append(title,list); document.body.appendChild(panel);
    this.container=button; this.panel=panel; this.list=list; this.initialized=true;
    if(typeof EventBus!=='undefined') { EventBus.on('CollectionChanged',()=>this.update()); EventBus.on('CollectionUnlocksChanged',()=>this.update()); EventBus.on('CollectionUpgradeChanged',()=>this.update()); }
    this.update(); return this;
  },
  toggle(){ if(!this.panel)return; this.panel.style.display=this.panel.style.display==='none'?'block':'none'; this.update(); },
  _rarityLabel(r){ return ({Common:'عادي',Uncommon:'غير شائع',Rare:'نادر',Epic:'ملحمي',Legendary:'أسطوري',Mythic:'خرافي',Secret:'سري'})[r]||r||'-'; },
  update(){
    if(!this.list || typeof CollectionSystem==='undefined') return;
    this.list.replaceChildren();
    const defs=CollectionSystem.getDefinitions();
    for(const [id,def] of Object.entries(defs)){
      const owned=CollectionSystem.getQuantity(id), unlocked=CollectionSystem.isUnlocked(id), level=CollectionSystem.getUpgradeLevel(id);
      const row=document.createElement('div'); row.style.cssText='padding:8px 0;border-top:1px solid rgba(255,255,255,.08);';
      const head=document.createElement('div'); head.style.cssText='display:flex;justify-content:space-between;gap:8px;font-weight:700;';
      const name=document.createElement('span'); name.textContent=def.name;
      const qty=document.createElement('span'); qty.textContent=unlocked?`x${owned}`:'مقفل'; qty.style.opacity=unlocked?'1':'.55'; head.append(name,qty);
      const meta=document.createElement('div'); meta.textContent=`${this._rarityLabel(def.rarity)} · ${def.category} · ترقية ${level}/${def.maxUpgradeLevel}`; meta.style.cssText='margin-top:3px;opacity:.7;font-size:10px;';
      row.append(head,meta); this.list.appendChild(row);
    }
  }
};
