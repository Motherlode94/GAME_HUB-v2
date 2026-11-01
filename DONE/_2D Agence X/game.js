(()=>{
'use strict';
const $=id=>document.getElementById(id),KEY='warlike_agence_x_v1';
const names=['Spectre','Vega','Orion','Nyx','Cobalt','Echo','Raven','Nova'];
const missions=[
{id:'signal',name:'Signal fantôme',description:'Une transmission anonyme menace de révéler des dossiers confidentiels.',difficulty:25,reward:65,intel:2,threat:3,skill:'tech'},
{id:'embassy',name:'Réception diplomatique',description:'Identifier un informateur sans éveiller les soupçons lors d’une réception.',difficulty:42,reward:110,intel:3,threat:5,skill:'social'},
{id:'archive',name:'Archives perdues',description:'Retrouver un dossier ancien dans une installation abandonnée.',difficulty:55,reward:145,intel:4,threat:7,skill:'field'},
{id:'shadow',name:'Réseau Ombre',description:'Démanteler un réseau clandestin en recoupant les preuves recueillies.',difficulty:73,reward:240,intel:6,threat:12,skill:'tech',requiredIntel:7}
];
const fresh=()=>({day:1,credits:200,intel:0,heat:12,reputation:40,completed:[],agents:[{id:0,name:'Spectre',tech:63,social:38,field:53,fatigue:0},{id:1,name:'Vega',tech:35,social:66,field:51,fatigue:0}],log:['Direction opérationnelle ouverte.']});
let state=fresh(),selected=0;
function note(t){state.log.unshift('J'+state.day+' — '+t);state.log=state.log.slice(0,45);$('notice').textContent=t}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));$('notice').textContent='Progression sauvegardée.'}catch{$('notice').textContent='Stockage indisponible.'}}
function render(){
 $('day').textContent='JOUR '+state.day;
 $('stats').replaceChildren();
 for(const [label,value] of [['CRÉDITS',state.credits],['RENSEIGNEMENTS',state.intel],['ALERTE',state.heat+'/100'],['RÉPUTATION',state.reputation+'/100']]){const el=document.createElement('div');el.className='stat';const s=document.createElement('small');s.textContent=label;const b=document.createElement('strong');b.textContent=value;el.append(s,b);$('stats').append(el)}
 $('brief').innerHTML='<h2>ORDRE DE MISSION // DOSSIER CLASSIFIÉ</h2><p>Choisis une opération et affecte ton meilleur agent. Plus l’alerte est élevée, plus le risque de compromission augmente. Les missions terminées restent débloquées pour de nouvelles tentatives.</p>';
 $('missions').replaceChildren();
 for(const m of missions){const card=document.createElement('article');card.className='mission';const h=document.createElement('h3');h.textContent=m.name;const d=document.createElement('p');d.textContent=m.description;const v=document.createElement('p');v.className='risk';v.textContent='Difficulté '+m.difficulty+' · Prime '+m.reward+' · Spécialité '+m.skill;const b=document.createElement('button');const blocked=(m.requiredIntel||0)>state.intel;b.textContent=blocked?'Dossier verrouillé : '+m.requiredIntel+' renseignements':'Déployer '+state.agents[selected].name;b.disabled=blocked||state.heat>=95;b.onclick=()=>deploy(m);card.append(h,d,v,b);$('missions').append(card)}
 $('agents').replaceChildren();state.agents.forEach((a,i)=>{const el=document.createElement('div');el.className='agent';const title=document.createElement('b');title.textContent=a.name+(selected===i?' · ACTIF':'');const p=document.createElement('p');p.textContent='Tech '+a.tech+' · Diplomatie '+a.social+' · Terrain '+a.field+' · Fatigue '+a.fatigue;const b=document.createElement('button');b.textContent=selected===i?'Sélectionné':'Affecter';b.disabled=selected===i;b.onclick=()=>{selected=i;render()};el.append(title,p,b);$('agents').append(el)});
 $('log').replaceChildren();state.log.slice(0,9).forEach(x=>{const p=document.createElement('p');p.textContent=x;$('log').append(p)});
 $('recruit').disabled=state.credits<90||state.agents.length>=8;$('train').disabled=state.credits<55;
}
function deploy(m){const a=state.agents[selected];if(!a||state.heat>=95||(m.requiredIntel||0)>state.intel)return;const roll=Math.random()*35;const power=a[m.skill]-(a.fatigue*.45)+state.intel*.7-state.heat*.16+roll;const win=power>=m.difficulty;state.day++;a.fatigue=Math.min(100,a.fatigue+23);state.heat=Math.min(100,state.heat+(win?m.threat:m.threat+11));if(win){state.credits+=m.reward;state.intel+=m.intel;state.reputation=Math.min(100,state.reputation+5);if(!state.completed.includes(m.id))state.completed.push(m.id);note(a.name+' a réussi « '+m.name+' ». Récompense : '+m.reward+' crédits.')}else{state.credits=Math.max(0,state.credits-20);state.reputation=Math.max(0,state.reputation-5);note('Échec de « '+m.name+' ». L’agence perd 20 crédits et 5 de réputation.')}if(state.completed.length===missions.length)note('TOUS LES DOSSIERS TRAITÉS — Agence X a sécurisé la région.');save();render()}
$('recruit').onclick=()=>{if(state.credits<90||state.agents.length>=8)return;state.credits-=90;const id=state.agents.length;state.agents.push({id,name:names[id],tech:28+Math.floor(Math.random()*44),social:28+Math.floor(Math.random()*44),field:28+Math.floor(Math.random()*44),fatigue:0});note(names[id]+' rejoint l’agence.');save();render()};
$('train').onclick=()=>{if(state.credits<55)return;const a=state.agents[selected];state.credits-=55;a.tech=Math.min(100,a.tech+8);a.social=Math.min(100,a.social+8);a.field=Math.min(100,a.field+8);note(a.name+' termine sa formation.');save();render()};
$('rest').onclick=()=>{state.day++;state.heat=Math.max(0,state.heat-15);state.agents.forEach(a=>a.fatigue=Math.max(0,a.fatigue-28));note('Repos stratégique : fatigue et alerte diminuées.');save();render()};
$('save').onclick=save;$('load').onclick=()=>{try{const s=JSON.parse(localStorage.getItem(KEY));if(!s||!Array.isArray(s.agents)||!Array.isArray(s.log)||!Number.isFinite(s.day))throw Error('invalid');state=s;selected=0;note('Sauvegarde restaurée.');render()}catch{$('notice').textContent='Aucune sauvegarde valide.'}};$('reset').onclick=()=>{if(!confirm('Recommencer une nouvelle partie ?'))return;state=fresh();selected=0;save();render()};render();
})();