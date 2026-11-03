(() => {
'use strict';
const games = (window.WGC_DATA && window.WGC_DATA.GAMES || []).filter(g => g && g.playUrl);
const folderStage = g => (g.playUrl||'').startsWith('DONE/') ? 'DONE · historique'
    : (g.playUrl||'').startsWith('A Revoir/') ? 'À revoir' : 'À faire';
const CHECKS = [
  'Démarrage sans erreur bloquante',
  'Menus, boutons et navigation utilisables',
  'Commandes essentielles opérationnelles',
  'Boucle de gameplay jouable',
  'Victoire, défaite et redémarrage vérifiés',
  'Aucune ressource essentielle manquante',
  'Absence de régression sur les anciennes fonctions',
  'Affichage et commandes sur mobile vérifiés',
  'Performance acceptable sur la machine cible',
  'Version stable et consignes de test documentées'
];
const KEY = 'warlike-qa-v1';
let records = {};
try { const stored = JSON.parse(localStorage.getItem(KEY) || '{}'); if (stored && typeof stored === 'object' && !Array.isArray(stored)) records=stored; } catch (_) {}
let selected = games[0] || null;
const $ = id => document.getElementById(id);
function entry(game) {
  const value=records[String(game.id)];
  return value && typeof value === 'object' ? value : {checks:[],notes:'',updatedAt:null};
}
function count(game) { return entry(game).checks.filter(i=>Number.isInteger(i)&&i>=0&&i<CHECKS.length).length; }
function save(game, value) {
  records[String(game.id)] = {...value,updatedAt:new Date().toISOString()};
  try {localStorage.setItem(KEY,JSON.stringify(records));} catch (_) {alert('Stockage local indisponible : exportez votre rapport.');}
  renderOverview(); renderGames();
}
function status(game) { const n=count(game);return n===10?'Validé manuellement':n?'En cours':'Non testé';}
function renderOverview() {
  const valid=games.filter(g=>count(g)===10).length;
  const progress=games.filter(g=>count(g)>0&&count(g)<10).length;
  $('overview').replaceChildren();
  const stages = [
    [games.filter(g => folderStage(g).startsWith('DONE')).length,'DONE · historique'],
    [games.filter(g => folderStage(g) === 'À faire').length,'À faire'],
    [games.filter(g => folderStage(g) === 'À revoir').length,'À revoir']
  ];
  [[games.length,'Jeux au catalogue'],[valid,'Validés manuellement'],[progress,'En cours'],
   [games.length-valid-progress,'Non testés'], ...stages].forEach(([n,l])=>{
    const el=document.createElement('div');el.className='metric';
    const strong=document.createElement('strong');strong.textContent=n;
    const span=document.createElement('span');span.textContent=l;el.append(strong,span);$('overview').append(el);
  });
}
function renderGames() {
  const query=$('search').value.trim().toLocaleLowerCase('fr');
  $('games').replaceChildren();
  games.filter(g=>g.title.toLocaleLowerCase('fr').includes(query)).forEach(g=>{
    const btn=document.createElement('button');btn.type='button';
    if (selected && selected.id===g.id) btn.className='active';
    btn.textContent=g.title;
    const info=document.createElement('small');info.textContent=folderStage(g)+' · QA '+count(g)+'/10 • '+status(g);
    btn.append(info);btn.addEventListener('click',()=>{selected=g;renderGames();renderDetail();});
    $('games').append(btn);
  });
}
function renderDetail() {
  const root=$('detail');root.replaceChildren();
  if (!selected) {root.textContent='Aucun jeu enregistré dans le catalogue.';return;}
  const g=selected,e=entry(g),header=document.createElement('h2');
  header.textContent=g.title;root.append(header);
  const progress=document.createElement('p');
  progress.textContent='Dossier : '+folderStage(g)+' · QA : '+status(g)+' — '+count(g)+'/10 contrôles cochés';root.append(progress);
  const link=document.createElement('a');link.href=g.playUrl;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Ouvrir le jeu pour le tester ↗';root.append(link);
  const list=document.createElement('div');list.className='checks';
  CHECKS.forEach((name,i)=>{
    const label=document.createElement('label');label.className='check';
    const check=document.createElement('input');check.type='checkbox';check.checked=e.checks.includes(i);
    check.addEventListener('change',()=>{
      const value=entry(g);const checked=new Set(value.checks);if(check.checked)checked.add(i);else checked.delete(i);
      save(g,{...value,checks:[...checked].sort((a,b)=>a-b)});renderDetail();
    });
    const span=document.createElement('span');span.textContent=name;label.append(check,span);list.append(label);
  });root.append(list);
  const noteLabel=document.createElement('label');noteLabel.textContent='Bugs rencontrés, configuration, étapes de reproduction';noteLabel.htmlFor='notes';root.append(noteLabel);
  const notes=document.createElement('textarea');notes.id='notes';notes.placeholder='Ex. : Android Chrome, après 3 minutes, le bouton Jouer ne répond plus…';notes.value=e.notes||'';root.append(notes);
  const actions=document.createElement('div');actions.className='actions';
  const saveButton=document.createElement('button');saveButton.textContent='Enregistrer les notes';saveButton.onclick=()=>{save(g,{...entry(g),notes:notes.value});renderDetail();};
  const reset=document.createElement('button');reset.textContent='Réinitialiser les validations';reset.onclick=()=>{
    if(!confirm('Réinitialiser les vérifications de '+g.title+' ?'))return;
    save(g,{...entry(g),checks:[]});renderDetail();
  };
  actions.append(saveButton,reset);root.append(actions);
  const date=document.createElement('p');date.textContent='Dernière modification : '+(e.updatedAt?new Date(e.updatedAt).toLocaleString('fr-FR'):'aucune');root.append(date);
}
$('search').addEventListener('input',renderGames);
$('export').addEventListener('click',()=>{
  const payload={schema:'warlike-qa-v1',generatedAt:new Date().toISOString(),verification:'manual-only',
    games:games.map(g=>({id:g.id,title:g.title,url:g.playUrl,classification:folderStage(g),status:status(g),checks:entry(g).checks.map(i=>CHECKS[i]).filter(Boolean),notes:entry(g).notes||'',updatedAt:entry(g).updatedAt||null}))};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='warlike-qa-report.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
renderOverview();renderGames();renderDetail();
})();