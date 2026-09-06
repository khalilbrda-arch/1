/** QuestUI.js — Phase 12: presentation only. */
const QuestUI = {
  initialized: false, button: null, panel: null, list: null,
  init() {
    if (this.initialized) return this;
    const button = document.createElement('button');
    button.type='button'; button.textContent='المهام'; button.id='quest-button';
    button.style.cssText='position:fixed;right:10px;top:156px;z-index:70;padding:8px 11px;border:1px solid rgba(255,255,255,.16);border-radius:10px;background:rgba(8,18,30,.88);color:#fff;font:700 12px -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;touch-action:manipulation;';
    button.addEventListener('click',()=>this.toggle());
    document.body.appendChild(button);
    const panel=document.createElement('div'); panel.id='quest-panel';
    panel.style.cssText='position:fixed;right:10px;top:200px;width:300px;max-width:calc(100vw - 20px);max-height:62vh;overflow:auto;display:none;z-index:69;padding:12px;background:rgba(5,15,26,.95);border:1px solid rgba(255,255,255,.14);border-radius:14px;box-sizing:border-box;color:#fff;font:12px -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;';
    const title=document.createElement('div'); title.textContent='المهام'; title.style.cssText='font-weight:800;font-size:14px;margin-bottom:8px;';
    const list=document.createElement('div'); panel.append(title,list); document.body.appendChild(panel);
    this.button=button; this.panel=panel; this.list=list; this.initialized=true;
    if(typeof EventBus!=='undefined') { EventBus.on('QuestStateChanged',()=>this.update()); EventBus.on('QuestProgressChanged',()=>this.update()); EventBus.on('QuestCompleted',()=>this.update()); EventBus.on('QuestRewardClaimed',()=>this.update()); }
    this.update(); return this;
  },
  toggle(){ if(!this.panel)return; this.panel.style.display=this.panel.style.display==='none'?'block':'none'; this.update(); },
  update(){
    if(!this.list || typeof QuestSystem==='undefined') return;
    this.list.replaceChildren();
    const quests=QuestSystem.getQuests();
    if(!quests.length){ const e=document.createElement('div'); e.textContent='لا توجد مهام نشطة.'; this.list.appendChild(e); return; }
    for(const q of quests){
      const row=document.createElement('div'); row.style.cssText='padding:9px 0;border-top:1px solid rgba(255,255,255,.08);';
      const head=document.createElement('div'); head.style.cssText='display:flex;justify-content:space-between;gap:8px;font-weight:700;';
      const name=document.createElement('span'); name.textContent=q.name; const prog=document.createElement('span'); prog.textContent=`${q.progress}/${q.target}`; head.append(name,prog);
      const desc=document.createElement('div'); desc.textContent=q.description; desc.style.cssText='margin-top:3px;opacity:.72;font-size:10px;'; row.append(head,desc);
      if(q.completed){
        const claim=document.createElement('button'); claim.type='button'; claim.textContent='استلام المكافأة'; claim.disabled=q.claimed;
        claim.style.cssText='margin-top:7px;padding:7px 9px;border:0;border-radius:8px;background:#315f87;color:#fff;font-weight:700;touch-action:manipulation;';
        claim.addEventListener('click',()=>QuestSystem.claimQuestReward(q.questId)); row.appendChild(claim);
      }
      this.list.appendChild(row);
    }
  }
};
