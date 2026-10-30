// City Builder — municipal security forces. Troops are actual roster entries,
// not battlefield characters; recruitment requires a barracks and budget.
const TroopSystem = (() => {
  const TYPES = {
    guard: {name:'Garde territoriale',cost:150,upkeep:4,security:3,emoji:'🪖'},
    patrol: {name:'Patrouille motorisée',cost:320,upkeep:8,security:6,emoji:'🚓'},
    response: {name:'Unité d’intervention',cost:550,upkeep:13,security:10,emoji:'🛡️'},
    engineer: {name:'Génie militaire',cost:450,upkeep:10,security:4,emoji:'🔧'}
  };
  const roster={guard:0,patrol:0,response:0,engineer:0};
  let panel,lastCycle=-1;
  function total(){return Object.values(roster).reduce((a,b)=>a+b,0);}
  function capacity(){return typeof countBuildingType==='function'?countBuildingType('barracks')*12:0;}
  function security(){return Math.min(40,Object.keys(TYPES).reduce((n,id)=>n+roster[id]*TYPES[id].security,0));}
  function upkeep(){return Object.keys(TYPES).reduce((n,id)=>n+roster[id]*TYPES[id].upkeep,0);}
  function ensureCapacity(){
    let overflow=total()-capacity();
    for(const id of ['engineer','response','patrol','guard']) {
      if(overflow<=0)break;
      const n=Math.min(overflow,roster[id]);
      roster[id]-=n;overflow-=n;
    }
  }
  function render(){
    if(!panel)return;
    const cap=capacity(),current=total();
    const status=panel.querySelector('.troop-status');
    status.textContent='Effectifs : '+current+'/'+cap+' · Sécurité : −'+security()+' points de criminalité · Solde : −'+upkeep()+' $ / cycle';
    for(const id of Object.keys(TYPES)){
      panel.querySelector('[data-count="'+id+'"]').textContent='×'+roster[id];
      panel.querySelector('[data-recruit="'+id+'"]').disabled=!gameStarted||current>=cap||budget<TYPES[id].cost;
      panel.querySelector('[data-dismiss="'+id+'"]').disabled=roster[id]===0;
    }
  }
  function createPanel(){
    const parent=document.getElementById('side-panel');
    if(!parent)return;
    panel=document.createElement('section');
    panel.className='panel-section';
    panel.id='troop-management';
    panel.innerHTML='<div class="panel-header">🎖️ Troupes de sécurité</div><div class="troop-status" style="padding:8px;font-size:12px"></div><div class="troop-rows" style="display:grid;gap:7px;padding:8px"></div>';
    const rows=panel.querySelector('.troop-rows');
    Object.entries(TYPES).forEach(([id,t])=>{
      const row=document.createElement('div');
      row.style.cssText='display:flex;gap:6px;align-items:center;flex-wrap:wrap;font-size:12px';
      row.innerHTML='<span style="flex:1;min-width:110px">'+t.emoji+' '+t.name+' <b data-count="'+id+'">×0</b></span><button type="button" data-recruit="'+id+'">+'+t.cost+' $</button><button type="button" data-dismiss="'+id+'">−</button>';
      rows.appendChild(row);
    });
    panel.addEventListener('click',e=>{
      const id=e.target?.dataset?.recruit;
      const remove=e.target?.dataset?.dismiss;
      if(id && TYPES[id] && gameStarted && total()<capacity() && budget>=TYPES[id].cost){
        budget-=TYPES[id].cost;roster[id]++;
      }
      if(remove && TYPES[remove] && roster[remove]>0)roster[remove]--;
      sync();render();if(typeof updateUI==='function')updateUI();
    });
    parent.appendChild(panel);
  }
  function sync(){ensureCapacity();window._cityTroopCrimeReduction=security();}
  function update(){
    if(typeof tick==='undefined'||tick===lastCycle)return;
    lastCycle=tick;
    if(tick%60===0 && gameStarted && speed!==0){
      sync();
      budget=Math.max(0,budget-upkeep());
    } else if(tick%10===0)sync();
    if(tick%10===0)render();
  }
  function init(){
    createPanel();sync();render();
    window._gameTickExtensions=window._gameTickExtensions||[];
    window._gameTickExtensions.push(update);
  }
  return {init,getRoster:()=>({...roster}),getSecurity:security,getUpkeep:upkeep};
})();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',TroopSystem.init);
else TroopSystem.init();
