(()=>{'use strict';
const root=document.getElementById('unitIdentityContent');if(!root)return;
const names={peasant:'Paysan',warrior:'Épéiste',archer:'Archer',knight:'Chevalier',paladin:'Paladin',mage:'Mage',scout:'Éclaireur'};
const activity={idle:'Disponible',moving:'En déplacement',attacking:'En combat',harvesting:'Récolte',guarding:'En défense'};
let last='';
function refresh(){
 const selected=typeof units!=='undefined'?units.filter(u=>u.selected&&u.state!=='dead'):[];
 const signature=selected.map(u=>[u.type,u.health,u.state,u.faction].join(':')).join('|');
 if(signature===last)return;last=signature;root.replaceChildren();
 if(!selected.length){root.textContent='Cliquez sur un paysan ou un soldat pour afficher ses capacités.';return}
 const title=document.createElement('strong');title.textContent=selected.length===1?(names[selected[0].type]||selected[0].type):selected.length+' unités sélectionnées';root.append(title);
 const info=document.createElement('p');info.textContent=selected.length===1?'Activité : '+(activity[selected[0].state]||selected[0].state)+' · Vie : '+Math.ceil(selected[0].health)+' / '+Math.ceil(selected[0].maxHealth):'Ordres groupés disponibles';root.append(info);
 const commands=document.createElement('p');commands.textContent=selected.every(u=>u.canHarvest)?'Actions : clic sur le terrain pour déplacer · clic droit sur une ressource pour récolter.':'Actions : clic sur le terrain pour déplacer · clic droit sur un ennemi pour attaquer.';root.append(commands);
}
setInterval(refresh,250);refresh();
})();