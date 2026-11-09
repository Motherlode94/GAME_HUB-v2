/* ÉTAGE ZÉRO — WarLike Horror.
   Single 2D survival-puzzle simulation: no fake 3D mode or placeholder buttons. */
(()=>{'use strict';
const $=id=>document.getElementById(id),canvas=$('view2d'),g=canvas.getContext('2d'),TILE=48;
const W=20,H=12,SAVE='warlike.etage-zero.v2',CODE='417';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const tiles=Array.from({length:H},(_,y)=>Array.from({length:W},(_,x)=>(x===0||y===0||x===W-1||y===H-1)?1:0));
for(const y of [4,8])for(let x=1;x<W-1;x++)if(![3,9,15].includes(x))tiles[y][x]=1;
for(const x of [7,13])for(let y=1;y<H-1;y++)if(![3,7,9].includes(y))tiles[y][x]=1;
const KEY='Key';
const clues=[
 {x:3,y:3,key:'clock',name:'L’HORLOGE ARRÊTÉE',digit:'4',text:'Le mécanisme est bloqué sur 04 h 17. Quatre coups résonnent dans la cage d’escalier.'},
 {x:10,y:2,key:'photo',name:'LE PORTRAIT EFFACÉ',digit:'1',text:'Au dos d’un portrait : « Un seul témoin regardait vers la porte. »'},
 {x:16,y:9,key:'tape',name:'LA BANDE MAGNÉTIQUE',digit:'7',text:'La bande répète sept fois un même nom avant de se rompre.'}
];
const vault={x:18,y:2},exit={x:1,y:1},safe={x:2,y:10};
const sprites={};
for(const name of ['player_idle','player_walk','entity','clock','photo','tape','vault','floor','wall','exit']){
 const image=new Image();image.src='assets/'+name+'.svg';sprites[name]=image;
}
const initial=()=>({x:2.5,y:10.5,health:100,stamina:100,battery:100,spectral:false,clues:[],vault:false,time:0,ghostX:10.5,ghostY:6.5,deaths:0,light:false});
let s=initial(),playing=false,won=false,lastHUD=0,lastSave=0,noise=0,modalKind='intro';
const keys=new Set(),touch=new Set();
let last=performance.now(),tick=0,feedbackUntil=0;
function say(msg,delay=3200){$('hint').textContent=msg;feedbackUntil=performance.now()+delay;$('status').textContent=msg}
function store(){
 if(won||s.health<=0)return false;
 try{localStorage.setItem(SAVE,JSON.stringify({version:2,...s,clues:[...s.clues]}));$('continue').disabled=false;return true}
 catch(e){say('Le navigateur ne permet pas la sauvegarde.');return false}
}
function restore(){
 try{const data=JSON.parse(localStorage.getItem(SAVE)||'null');if(data?.version!==2||!Number.isFinite(data.x)||!Number.isFinite(data.y))return false;
  Object.assign(s,initial());
  for(const k of ['x','y','health','stamina','battery','time','ghostX','ghostY','deaths'])if(Number.isFinite(data[k]))s[k]=data[k];
  if(s.x<=0||s.x>=W-1||s.y<=0||s.y>=H-1||blocked(s.x,s.y))return false;
  for(const k of ['spectral','vault','light'])s[k]=data[k]===true;
  s.clues=Array.isArray(data.clues)?[...new Set(data.clues.filter(k=>clues.some(c=>c.key===k)))]:[];
  for(const k of ['health','stamina','battery'])s[k]=clamp(s[k],0,100);
  if(s.health<=0)return false;
  return true
 }catch(e){return false}
}
function blocked(x,y){const cx=Math.floor(x),cy=Math.floor(y);return cx<0||cx>=W||cy<0||cy>=H||tiles[cy][cx]===1}
function showModal(kicker,title,body,buttons,extra){
 playing=false;keys.clear();touch.clear();$('modal-kicker').textContent=kicker;
 $('modal-title').textContent=title;$('modal-text').textContent=body;
 $('modal-actions').replaceChildren();$('modal-special').replaceChildren();
 if(extra)extra($('modal-special'));
 for(const a of buttons){const b=document.createElement('button');b.textContent=a.label;if(a.primary)b.className='primary';b.onclick=a.run;$('modal-actions').append(b)}
 $('overlay').classList.add('open');
}
function resume(){playing=true;$('overlay').classList.remove('open');keys.clear();touch.clear();last=performance.now();say('Le couloir retient son souffle.',1500)}
function newGame(){Object.assign(s,initial());won=false;try{localStorage.removeItem(SAVE)}catch(e){}resume();hud()}
function start(load){if(!load||!restore())return newGame();resume();hud()}
function pause(){if(!playing)return;store();showModal('DOSSIER 09 / PAUSE','HORS DU TEMPS','Les trois témoignages restent dans le dossier. Reprends l’enquête ou restaure ta progression.',[
 {label:'REPRENDRE',primary:true,run:resume},
 {label:'RECOMMENCER',run:()=>showModal('DANGER','EFFACER LES SOUVENIRS ?','Tu perdras ta progression.',[{label:'ANNULER',run:resume},{label:'NOUVELLE PARTIE',primary:true,run:newGame}])}
 ])}
function complete(){
 won=true;playing=false;try{localStorage.removeItem(SAVE)}catch(e){}
 showModal('ARCHIVES / DOSSIER RÉSOLU','LE NEUVIÈME ÉTAGE','Le plan revient à la normale. Les trois témoins n’étaient qu’une seule personne. Tu as quitté le niveau avec '+Math.ceil(s.health)+' % de lucidité en '+Math.round(s.time)+' secondes.',
 [{label:'RECOMMENCER',primary:true,run:newGame},{label:'GAME HUB',run:()=>{location.href='../../index.html'}}])
}
function fail(){
 s.deaths++;
 if(restore()){s.health=68;s.stamina=90;s.spectral=false;s.ghostX=10.5;s.ghostY=6.5;
  showModal('SIGNAL / PERTE DE CONSCIENCE','UNE AUTRE BOUCLE',
  'Le spectre t’a rattrapé. Les archives déjà sauvegardées ont été conservées.',
  [{label:'REPRENDRE AU POINT DE CONTRÔLE',primary:true,run:()=>{resume();store()}}])
 }else showModal('SIGNAL / MORT','LE BÂTIMENT T’A RETENU','Aucune sauvegarde exploitable. Le dossier doit être recommencé.',[{label:'RECOMMENCER',primary:true,run:newGame}]);
}
function dist(o){return Math.hypot(s.x-o.x-.5,s.y-o.y-.5)}
function candidate(){
 const active=clues.filter(c=>!s.clues.includes(c.key));
 if(!s.vault)active.push({...vault,key:'vault',name:'COFFRE ARCHIVÉ'});
 if(s.vault)active.push({...exit,key:'exit',name:'ESCALIER DE SORTIE'});
 active.push({...safe,key:'safe',name:'REFUGE'});
 return active.map(c=>({...c,d:dist(c)})).filter(c=>c.d<1.75).sort((a,b)=>a.d-b.d)[0];
}
function inspect(){
 if(!playing)return;
 const c=candidate();
 if(!c){say('Aucun objet à examiner. Rapproche-toi d’un symbole éclairé.');return}
 if(c.key==='safe'){s.health=clamp(s.health+23,0,100);s.battery=clamp(s.battery+29,0,100);s.stamina=100;store();say('Refuge : +23 lucidité, +29 batterie. Progression enregistrée.');return}
 if(c.key==='exit'){complete();return}
 if(c.key==='vault'){openVault();return}
 if(!s.clues.includes(c.key)){
  s.clues.push(c.key);say(c.name+' — '+c.text,5100);store();hud();
 }
}
function openVault(){
 if(s.clues.length<3){say('Le coffre exige les trois archives des témoins.');return}
 showModal('COFFRE / ENREGISTREMENT','LE NOMBRE IMPOSSIBLE',
 'Rassemble les trois chiffres dans l’ordre : horloge, portrait, bande magnétique.',
 [{label:'VALIDER',primary:true,run:()=>{const input=$('vault-code');if(input?.value.trim()===CODE){s.vault=true;store();resume();say('Coffre ouvert. L’escalier de sortie se trouve au nord-ouest.',4900)}
 else{if($('vault-error'))$('vault-error').textContent='Accès refusé. Vérifie le journal.';s.health=clamp(s.health-6,0,100)}}},{label:'FERMER',run:resume}],
 target=>{const label=document.createElement('label');label.textContent='CODE / 3 CHIFFRES';label.htmlFor='vault-code';const field=document.createElement('input');field.id='vault-code';field.inputMode='numeric';field.maxLength=3;field.placeholder='___';const status=document.createElement('p');status.id='vault-error';status.textContent='Le journal conserve les chiffres des témoins.';target.append(label,field,status)})
}
function journal(){
 showModal('DOSSIER 09 / PREUVES','LES TROIS TÉMOINS',
 s.clues.length+' archives récupérées. Chaque archive donne un chiffre du coffre, dans l’ordre de l’enquête.',
 [{label:'REVENIR AU COULOIR',primary:true,run:resume}],
 el=>{
 for(const c of clues){const p=document.createElement('p');p.textContent=s.clues.includes(c.key)?c.name+' — '+c.text:c.name+' — NON DÉCOUVERT';el.append(p)}
 });
}
function spectral(){
 if(!playing)return;
 if(!s.spectral&&s.battery<=1){say('Plus de batterie. Retourne au refuge.');return}
 s.spectral=!s.spectral;$('mode').setAttribute('aria-pressed',String(s.spectral));
 $('mode').innerHTML=s.spectral?'VISION NORMALE <kbd>T</kbd>':'VISION SPECTRALE <kbd>T</kbd>';
 $('mode-label').textContent=s.spectral?'2D · FRÉQUENCE DE L’AU-DELÀ':'2D · ENQUÊTE PARANORMALE';
 say(s.spectral?'Les traces des témoins deviennent visibles. Le spectre te repère plus facilement.':'Retour à la vision normale.',2800)
}
function lamp(){if(!playing)return;if(!s.light&&s.battery<=1)return say('La batterie est vide.');s.light=!s.light;
 $('light').innerHTML='◉ Lampe : '+(s.light?'ALLUMÉE':'ÉTEINTE')+' <kbd>F</kbd>'}
function move(dt){
 let dx=Number(keys.has('KeyD')||keys.has('ArrowRight')||touch.has('right'))-Number(keys.has('KeyA')||keys.has('KeyQ')||keys.has('ArrowLeft')||touch.has('left'));
 let dy=Number(keys.has('KeyS')||keys.has('ArrowDown')||touch.has('down'))-Number(keys.has('KeyW')||keys.has('KeyZ')||keys.has('ArrowUp')||touch.has('up'));
 const mag=Math.hypot(dx,dy),running=mag>0&&(keys.has('ShiftLeft')||keys.has('ShiftRight'));
 if(mag){dx/=mag;dy/=mag}
 const speed=running&&s.stamina>0?4.1:2.7;
 const nx=s.x+dx*speed*dt,ny=s.y+dy*speed*dt,r=.24;
 if(!blocked(nx+r,s.y+r)&&!blocked(nx-r,s.y-r)&&!blocked(nx+r,s.y-r)&&!blocked(nx-r,s.y+r))s.x=nx;
 if(!blocked(s.x+r,ny+r)&&!blocked(s.x-r,ny-r)&&!blocked(s.x+r,ny-r)&&!blocked(s.x-r,ny+r))s.y=ny;
 if(running&&mag)s.stamina=clamp(s.stamina-27*dt,0,100);else s.stamina=clamp(s.stamina+16*dt,0,100);
 if(s.spectral||s.light)s.battery=clamp(s.battery-((s.spectral?1.7:0)+(s.light?.64:0))*dt,0,100);
 if(s.battery<=0){if(s.spectral)spectral();s.light=false}
 s.time+=dt;
 ghost(dt,running);
 if(s.health<=0)fail();
}
// The spectre uses real corridor navigation instead of walking into solid walls.
let ghostPath=[],ghostPathClock=0,ghostTargetCell='';
function routeGhost(tx,ty){
 const x0=Math.floor(s.ghostX),y0=Math.floor(s.ghostY),x1=Math.floor(tx),y1=Math.floor(ty);
 if(blocked(x0,y0)||blocked(x1,y1))return [];
 const queue=[[x0,y0]],previous=new Map(),key=(x,y)=>x+','+y;previous.set(key(x0,y0),null);
 for(let i=0;i<queue.length;i++){
  const [x,y]=queue[i];if(x===x1&&y===y1)break;
  for(const [dx,dy] of [[1,0],[0,1],[-1,0],[0,-1]]){
   const nx=x+dx,ny=y+dy,k=key(nx,ny);if(blocked(nx,ny)||previous.has(k))continue;
   previous.set(k,[x,y]);queue.push([nx,ny])
  }
 }
 if(!previous.has(key(x1,y1)))return [];
 const route=[];let current=[x1,y1];
 while(current&&(current[0]!==x0||current[1]!==y0)){route.push({x:current[0]+.5,y:current[1]+.5});current=previous.get(key(...current))}
 return route.reverse();
}
function ghost(dt,running){
 const dx=s.x-s.ghostX,dy=s.y-s.ghostY,d=Math.hypot(dx,dy);
 const alert=d<3.5||(d<6.4&&(s.spectral||s.light||running));
 const tx=alert?s.x:10+Math.sin(s.time*.48)*4,ty=alert?s.y:6+Math.cos(s.time*.29)*2;
 const targetKey=Math.floor(tx)+','+Math.floor(ty),targetClear=!blocked(tx,ty);
 ghostPathClock-=dt;
 if(targetClear&&(ghostPathClock<=0||targetKey!==ghostTargetCell||ghostPath.length===0)){
  ghostPath=routeGhost(tx,ty);ghostPathClock=alert?.35:1.3;ghostTargetCell=targetKey;
 }
 const waypoint=ghostPath[0]||{x:s.ghostX,y:s.ghostY};
 const vx=waypoint.x-s.ghostX,vy=waypoint.y-s.ghostY,m=Math.hypot(vx,vy);
 if(m<.12&&ghostPath.length)ghostPath.shift();
 else if(m>0){const speed=alert?1.85:.83,step=Math.min(m,speed*dt),nx=s.ghostX+vx/m*step,ny=s.ghostY+vy/m*step;
  if(!blocked(nx,s.ghostY))s.ghostX=nx;if(!blocked(s.ghostX,ny))s.ghostY=ny}
 const range=Math.hypot(s.x-s.ghostX,s.y-s.ghostY);$('eye').hidden=range>=4;
 if(range<.9)s.health=clamp(s.health-30*dt,0,100);
 if(range<2.4&&!s.spectral)s.health=clamp(s.health-4*dt,0,100);
}
function rect(x,y,w,h,color){g.fillStyle=color;g.fillRect(x,y,w,h)}
function draw(){
 tick+=.022;g.clearRect(0,0,canvas.width,canvas.height);
 const spectral=s.spectral;
 const back=spectral?'#14122e':'#182731';rect(0,0,960,576,back);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const X=x*TILE,Y=y*TILE,wall=tiles[y][x];
  const tile=sprites[wall?'wall':'floor'];
  if(tile.complete&&tile.naturalWidth)g.drawImage(tile,X,Y,TILE,TILE);
  else rect(X,Y,TILE,TILE,wall?'#304957':(x+y)%2?'#1c303a':'#203943');
  g.strokeStyle=spectral?'#54457420':'#95b6ba13';g.strokeRect(X,Y,TILE,TILE);
 }
 for(const c of clues){
  if(s.clues.includes(c.key))continue;
  const sprite=sprites[c.key];const X=c.x*TILE+9,Y=c.y*TILE+7;
  if(sprite.complete&&sprite.naturalWidth)g.drawImage(sprite,X,Y,30,34);
  else{g.fillStyle='#dcbd82';g.fillRect(X+7,Y+6,16,22)}
  if(spectral){g.strokeStyle='#ae8afb';g.lineWidth=2;g.strokeRect(c.x*TILE+4,c.y*TILE+4,40,40)}
 }
 for(const [x,y,key,show] of [[vault.x,vault.y,'vault',!s.vault],[exit.x,exit.y,'exit',s.vault]]){
  if(!show)continue;
  const i=sprites[key];if(i.complete&&i.naturalWidth)g.drawImage(i,x*TILE+5,y*TILE+3,38,42);
  else rect(x*TILE+8,y*TILE+8,32,32,key==='exit'?'#7fc9af':'#aa8274');
 }
 g.fillStyle='#5e8b80';g.fillRect(safe.x*TILE+10,safe.y*TILE+8,28,32);
 g.font='bold 12px sans-serif';g.textAlign='center';g.fillStyle='#dcf1e1';g.fillText('SAS',safe.x*TILE+24,safe.y*TILE+28);
 // Visual field: visibility is limited by distance; spectral mode reveals the whole floor.
 if(!spectral){
  g.save();g.fillStyle='#020810dd';g.fillRect(0,0,960,576);
  g.globalCompositeOperation='destination-out';
  const radius=s.light?250:145,px=s.x*TILE,py=s.y*TILE;
  const grad=g.createRadialGradient(px,py,8,px,py,radius);
  grad.addColorStop(0,'rgba(0,0,0,1)');grad.addColorStop(.54,'rgba(0,0,0,.9)');grad.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=grad;g.beginPath();g.arc(px,py,radius,0,Math.PI*2);g.fill();g.restore();
 }else{rect(0,0,960,576,'#45295b22')}
 const monster=sprites.entity;if(monster.complete&&monster.naturalWidth)g.drawImage(monster,s.ghostX*TILE-22,s.ghostY*TILE-34,44,60);
 else{g.fillStyle='#ce7893';g.beginPath();g.arc(s.ghostX*TILE,s.ghostY*TILE,16,0,7);g.fill()}
 const walking=keys.size>0||touch.size>0;
 const human=sprites[walking&&Math.floor(tick*6)%2?'player_walk':'player_idle'];
 if(human.complete&&human.naturalWidth)g.drawImage(human,s.x*TILE-20,s.y*TILE-34,40,52);
 else{g.fillStyle='#9bd7d5';g.beginPath();g.arc(s.x*TILE,s.y*TILE,11,0,7);g.fill()}
 const near=candidate();if(near){const X=(near.x+.5)*TILE,Y=(near.y+.5)*TILE;g.strokeStyle='#ffe5a1';g.lineWidth=2;g.strokeRect(X-19,Y-19,38,38)}
 if(spectral){g.textAlign='right';g.font='bold 15px monospace';g.fillStyle='#c9a3fa';g.fillText('FRÉQUENCE SPECTRALE / TÉMOINS',930,25)}
}
function hud(){
 $('sanity-txt').textContent=Math.ceil(s.health)+'%';$('sanity-meter').style.width=s.health+'%';
 $('stamina-txt').textContent=Math.ceil(s.stamina)+'%';$('stamina-meter').style.width=s.stamina+'%';
 $('battery-txt').textContent=Math.ceil(s.battery)+'%';$('battery-meter').style.width=s.battery+'%';
 const progress=s.clues.length+Number(s.vault);
 $('progress').style.width=progress/4*100+'%';$('steps').textContent=progress+' / 4 VERROUS';
 $('objective').textContent=s.clues.length<3?'Récupérer les 3 archives':!s.vault?'Ouvrir le coffre impossible':'Trouver l’escalier de sortie';
 $('objective-hint').textContent=s.clues.length<3?'Horloge nord-ouest, portrait nord, bande sud-est.':!s.vault?'Le code suit l’ordre des archives.':'Rejoins l’issue nord-ouest.';
 $('location').textContent='SECTEUR '+(s.y<4?'NORD':s.y<8?'CENTRAL':'SUD')+' · '+Math.floor(s.x)+':'+Math.floor(s.y);
 $('condition').textContent=s.health<35?'La lucidité décroît dangereusement.':'La vision spectrale révèle les preuves et attire le spectre.';
 $('evidence').replaceChildren();
 if(!s.clues.length){const small=document.createElement('small');small.textContent='Aucun élément archivé.';$('evidence').append(small)}
 for(const id of s.clues){const c=clues.find(x=>x.key===id),a=document.createElement('span');a.textContent=c.name+' · '+c.digit;$('evidence').append(a)}
 $('fps').textContent='DOSSIER 09 · '+Math.floor(s.time)+' s';
}
function loop(now){
 requestAnimationFrame(loop);const dt=Math.min((now-last)/1000,.05);last=now;
 if(playing){move(dt);if(now-lastSave>23000){lastSave=now;store()}if(now-lastHUD>150){lastHUD=now;hud()}}
 draw();
}
document.addEventListener('keydown',e=>{
 if(e.target.matches('input,textarea,select'))return;
 if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();
 if(e.code==='Escape'){if(playing)pause();return}
 if(!playing)return;
 keys.add(e.code);
 if(e.repeat)return;
 if(e.code==='KeyE'||e.code==='Space')inspect();
 if(e.code==='KeyF')lamp();if(e.code==='KeyT')spectral();
 if(e.code==='KeyJ')journal();if(e.code==='KeyK'){if(store())say('Progression sauvegardée.')}
});
document.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();touch.clear()});
for(const b of document.querySelectorAll('[data-hold]')){
 const id=b.dataset.hold;
 b.addEventListener('pointerdown',e=>{touch.add(id);b.setPointerCapture?.(e.pointerId)});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>touch.delete(id));
}
$('touch-action').onclick=inspect;$('touch-light').onclick=lamp;
$('light').onclick=lamp;$('mode').onclick=spectral;$('journal').onclick=()=>playing&&journal();
$('save').onclick=()=>{if(store())say('Sauvegarde locale créée.')};
$('restart').onclick=()=>showModal('AVERTISSEMENT','RECOMMENCER ?','La sauvegarde sera remplacée.',[{label:'ANNULER',run:resume},{label:'CONFIRMER',primary:true,run:newGame}]);
$('pause').onclick=()=>playing?pause():resume();
$('new').onclick=newGame;$('continue').onclick=()=>start(true);
try{$('continue').disabled=!JSON.parse(localStorage.getItem(SAVE)||'null')?.version}catch(e){$('continue').disabled=true}
hud();requestAnimationFrame(loop);
})();