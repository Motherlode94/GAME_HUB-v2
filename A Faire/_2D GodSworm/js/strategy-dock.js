(()=>{'use strict';const build=document.getElementById('dockBuild'),cancel=document.getElementById('dockCancel'),production=document.getElementById('dockProduction'),feedback=document.getElementById('dockFeedback');
build.addEventListener('click',()=>{document.getElementById('buildingMenu').style.display='block';if(typeof updateBuildButtons==='function')updateBuildButtons()});
cancel.addEventListener('click',()=>{buildMode=null;closeBuildMenu();feedback.textContent='Placement annulé.'});
let previous='';
function sync(){const chosen=selectedBuilding&&selectedBuilding.selected&&selectedBuilding.faction===PLAYER_FACTION?selectedBuilding:null;const types=chosen&&chosen.canProduce?chosen.produceTypes:[];const key=types.join(',')+'|'+(chosen?chosen.type:'');if(key!==previous){previous=key;production.replaceChildren();if(types.length){const label=document.createElement('span');label.textContent='Recrutement : ';production.append(label);types.forEach(type=>{const b=document.createElement('button');b.type='button';b.textContent='➕ '+type+' ('+Object.entries(UNIT_COSTS[type]||{}).map(([k,v])=>k+': '+v).join(', ')+')';b.addEventListener('click',()=>recruitAtSelectedBuilding(type));production.append(b)})}else production.textContent='Sélectionnez un bâtiment de production pour recruter.'}
feedback.textContent=buildMode?'Placement : '+buildMode+' — cliquez sur votre territoire. Échap pour annuler.':'Sélectionnez une option de construction ou un bâtiment.';
}
setInterval(sync,350);sync();
})();