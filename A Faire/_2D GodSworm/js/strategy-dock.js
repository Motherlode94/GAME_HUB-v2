(()=>{'use strict';const build=document.getElementById('dockBuild'),cancel=document.getElementById('dockCancel'),production=document.getElementById('dockProduction'),feedback=document.getElementById('dockFeedback');
build.addEventListener('click',()=>{document.getElementById('buildingMenu').style.display='block';if(typeof updateBuildButtons==='function')updateBuildButtons()});
cancel.addEventListener('click',()=>{buildMode=null;closeBuildMenu();feedback.textContent='Placement annulé.'});
let previous='';let queueSignature='';
function sync(){const chosen=selectedBuilding&&selectedBuilding.selected&&selectedBuilding.faction===PLAYER_FACTION?selectedBuilding:null;const types=chosen&&chosen.canProduce?chosen.produceTypes:[];const key=types.join(',')+'|'+(chosen?chosen.type:'')+'|'+(chosen&&chosen.constructionProgress<1?'site':'ready');if(key!==previous){previous=key;production.replaceChildren();if(chosen&&chosen.constructionProgress<1){const btn=document.createElement('button');btn.textContent='🔨 Envoyer un paysan';btn.addEventListener('click',orderBuilderToSite);production.append(btn)}else if(types.length){const rally=document.createElement('button');rally.textContent='🚩 Point de ralliement';rally.addEventListener('click',setSelectedRallyPoint);production.append(rally);const label=document.createElement('span');label.textContent='Recrutement : ';production.append(label);types.forEach(type=>{const b=document.createElement('button');b.type='button';b.textContent='➕ '+type+' ('+Object.entries(UNIT_COSTS[type]||{}).map(([k,v])=>k+': '+v).join(', ')+')';b.addEventListener('click',()=>recruitAtSelectedBuilding(type));production.append(b)})}else production.textContent='Sélectionnez un bâtiment de production pour recruter.'}
if(chosen&&chosen.constructionProgress<1){feedback.textContent='Chantier : '+Math.floor(chosen.constructionProgress*100)+'%';return}
if(chosen&&chosen.canProduce){
 const pop=getPopulationUsage();
 feedback.textContent='Population : '+(pop.living+pop.queued)+' / '+pop.capacity+' · Production : '+Math.floor(Math.min(100,chosen.productionTimer/chosen.productionTime*100))+'%';
 const signature=chosen.productionQueue.join('|')+'@'+chosen.type;
 if(signature!==queueSignature){queueSignature=signature;const prior=document.getElementById('productionQueueControls');if(prior)prior.remove();
 const q=document.createElement('div');q.id='productionQueueControls';q.style.display='flex';q.style.gap='6px';q.style.flexWrap='wrap';
 chosen.productionQueue.forEach((type,index)=>{const btn=document.createElement('button');btn.type='button';btn.textContent=(index+1)+'. '+type+' ✕';btn.title='Annuler et rembourser cette unité';btn.addEventListener('click',()=>{cancelQueuedUnit(index);queueSignature='';});q.append(btn)});
 production.after(q);}
 return
 }else{const prior=document.getElementById('productionQueueControls');if(prior)prior.remove();queueSignature='';}
feedback.textContent=buildMode?'Placement : '+buildMode+' — cliquez sur votre territoire. Échap pour annuler.':'Sélectionnez une option de construction ou un bâtiment.';
}
setInterval(sync,350);sync();
})();