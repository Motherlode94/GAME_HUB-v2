/* SILENCE 03 · WarLike Horror.
   A 2D stealth/sound game: pathfinding, hiding, sound lure, evidence and local saves. */
(()=>{'use strict';
const $=id=>document.getElementById(id),canvas=$('canvas'),g=canvas.getContext('2d');
const W=24,H=14,TILE=40,SAVE='warlike.silence03.v1',CODE='269';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const wall=Array.from({length:H},(_,y)=>Array.from({length:W},(_,x)=>x===0||y===0||x===23||y===13?1:0));
for(const x of [7,16])for(let y=1;y<13;y++)if(![3,4,7,8,11,12].includes(y))wall[y][x]=1;
for(let x=1;x<23;x++)if(![3,10,19].includes(x))wall[6][x]=1;
const glass=new Set(['5,10','10,4','18,9','13,2','3,8','20,4']);
const closets=[{x:3,y:10},{x:14,y:9},{x:20,y:5},{x:9,y:3}];
const tapes=[
 {key:'first',x:5,y:3,digit:'2',name:'BANDE / LES DEUX FRÈRES',text:'Premier extrait : « Deux frères sont entrés. Un seul est sorti. »'},
 {key:'second',x:11,y:2,digit:'6',name:'BANDE / LA SIXIÈME HEURE',text:'Deuxième extrait : « La sixième heure ne sonnait jamais. »'},
 {key:'third',x:20,y:10,digit:'9',name:'BANDE / LES NEUF VOIX',text:'Troisième extrait : « Neuf voix chantaient derrière le mur. »'}
];
const consoleObj={x:20,y:2},exit={x:1,y:1};
const imgs={};
for(const name of ['floor','wall','protagonist_idle','protagonist_walk','guardian','tape','locker','decoder','exit']){
 const img=new Image();img.src='assets/'+name+'.svg';imgs[name]=img;
}
function newState(){return{x:2.5,y:12.5,dirX:0,dirY:-1,health:100,stamina:100,rocks:3,records:[],door:false,hidden:false,
 noise:0,guardianX:12.5,guardianY:8.5,heardX:12,heardY:8,heardTimer:0,
 time:0,deaths:0,steps:0,detected:false}}
let s=newState(),playing=false,win=false,last=performance.now(),lastHUD=0,lastSave=0,entityPath=[],pathClock=0,patrolIndex=0;
const keys=new Set(),held=new Set();
let audioCtx=null,soundEnabled=true;
function initAudio(){if(!audioCtx){try{audioCtx=new (window.AudioContext||window.webkitAudioContext)()}catch(e){}}else if(audioCtx.state==='suspended')audioCtx.resume().catch(()=>{})}
function beep(f=360,d=.16){if(!audioCtx||!soundEnabled)return;try{const osc=audioCtx.createOscillator(),vol=audioCtx.createGain();osc.type='sine';osc.frequency.value=f;vol.gain.setValueAtTime(.05,audioCtx.currentTime);vol.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+d);osc.connect(vol).connect(audioCtx.destination);osc.start();osc.stop(audioCtx.currentTime+d+.01)}catch(e){}}
function say(text){$('subtitle').textContent=text;$('status').textContent=text}
function save(){
 if(win||s.health<=0)return false;
 try{localStorage.setItem(SAVE,JSON.stringify({version:1,...s,records:[...s.records]}));$('continue').disabled=false;return true}
 catch(e){say('La sauvegarde locale est indisponible.');return false}
}
function load(){
 try{const data=JSON.parse(localStorage.getItem(SAVE)||'null');
  if(data?.version!==1||!Number.isFinite(data.x)||!Number.isFinite(data.y)||!Number.isFinite(data.health))return false;
  Object.assign(s,newState());
  for(const k of ['x','y','dirX','dirY','health','stamina','rocks','noise','guardianX','guardianY','heardX','heardY','heardTimer','time','deaths','steps'])
   if(Number.isFinite(data[k]))s[k]=data[k];
  if(blocked(s.x,s.y)||s.health<=0)return false;
  s.records=Array.isArray(data.records)?[...new Set(data.records.filter(k=>tapes.some(t=>t.key===k)))]:[];
  s.door=!!data.door;s.hidden=!!data.hidden;
  for(const k of ['health','stamina','noise'])s[k]=clamp(s[k],0,100);
  s.rocks=clamp(Math.floor(s.rocks),0,6);entityPath=[];pathClock=0;
  return true
 }catch(e){return false}
}
function blocked(x,y){const X=Math.floor(x),Y=Math.floor(y);return X<0||X>=W||Y<0||Y>=H||wall[Y][X]===1}
function dist(o){return Math.hypot(s.x-(o.x+.5),s.y-(o.y+.5))}
function closetNear(){return closets.find(c=>dist(c)<1.5)}
function candidate(){
 const list=tapes.filter(t=>!s.records.includes(t.key));
 if(!s.door)list.push({...consoleObj,key:'decoder',name:'PHONOGRAPHE CODÉ'});
 if(s.door)list.push({...exit,key:'exit',name:'ISSUE PRINCIPALE'});
 return list.map(c=>({...c,d:dist(c)})).filter(c=>c.d<1.6).sort((a,b)=>a.d-b.d)[0];
}
function popup(kicker,title,body,actions,detail){
 playing=false;keys.clear();held.clear();
 $('modalKicker').textContent=kicker;$('modalTitle').textContent=title;$('modalText').textContent=body;
 $('modalActions').replaceChildren();$('modalExtra').replaceChildren();
 if(detail)detail($('modalExtra'));
 for(const action of actions){const button=document.createElement('button');button.textContent=action.label;if(action.primary)button.className='primary';button.onclick=action.action;$('modalActions').append(button)}
 $('overlay').classList.add('open');
}
function resume(){playing=true;keys.clear();held.clear();$('overlay').classList.remove('open');last=performance.now();initAudio()}
function start(fresh){
 if(fresh){Object.assign(s,newState());win=false;try{localStorage.removeItem(SAVE)}catch(e){}}else if(!load())Object.assign(s,newState());
 resume();hud();say('Avance à pas feutrés. Les sols brisés font du bruit.');
}
function pause(){if(!playing)return;save();popup('DOSSIER / PAUSE','NE FAIS PAS DE BRUIT',
 'Ta progression est conservée. Le Gardien attend le moindre son.',
 [{label:'REPRENDRE',primary:true,action:resume},{label:'RECOMMENCER',action:()=>popup('AVERTISSEMENT','EFFACER LA PARTIE ?','Ta sauvegarde sera remplacée.',[{label:'ANNULER',action:resume},{label:'CONFIRMER',primary:true,action:()=>start(true)}])}])}
function failure(){
 s.deaths++;if(load()){s.health=77;s.hidden=false;s.guardianX=12.5;s.guardianY=8.5;s.noise=0;s.heardTimer=0;
  popup('GARDIEN / CONTACT','TU AS ÉTÉ ENTENDU',
 'Tu es revenu au dernier point de contrôle. Les enregistrements déjà enregistrés sont conservés.',
 [{label:'REPRENDRE',primary:true,action:()=>{resume();save()}}]);
 }else popup('GARDIEN / CONTACT','LE SILENCE EST ROMPU','Aucun point de contrôle valide.',[{label:'NOUVELLE PARTIE',primary:true,action:()=>start(true)}]);
}
function victory(){
 win=true;playing=false;try{localStorage.removeItem(SAVE)}catch(e){}
 popup('DOSSIER 03 / COMPLET','LES VOIX SE TAISENT',
  'Le phonographe s’arrête. Le Gardien ne connaît plus ton nom. Temps : '+Math.round(s.time)+' s · intégrité restante : '+Math.ceil(s.health)+' %.',
  [{label:'RECOMMENCER',primary:true,action:()=>start(true)},{label:'GAME HUB',action:()=>{location.href='../../index.html'}}]);
}
function inspect(){
 if(!playing)return;
 if(s.hidden){s.hidden=false;s.noise=5;say('Tu quittes l’armoire.');return}
 const o=candidate();
 if(!o){say('Rien à examiner à portée. Suis les points lumineux.');return}
 if(o.key==='decoder')return decoder();
 if(o.key==='exit')return victory();
 s.records.push(o.key);say(o.name+' — '+o.text);
 beep(430);save();hud();
}
function hiding(){
 if(!playing)return;
 if(s.hidden){s.hidden=false;say('Tu sors de la cachette.');return}
 const near=closetNear();if(!near)return say('Approche-toi d’une armoire pour te cacher.');
 s.hidden=true;s.noise=0;keys.clear();held.clear();say('Tu retiens ton souffle. Le Gardien ne peut plus te voir.');beep(220);
}
function throwRock(){
 if(!playing||s.hidden)return;
 if(s.rocks<=0)return say('Plus de cailloux pour détourner le Gardien.');
 const pos={x:s.x,y:s.y};let target=null;
 for(let k=4;k>0;k--){const x=Math.floor(pos.x+s.dirX*k),y=Math.floor(pos.y+s.dirY*k);if(!blocked(x+.5,y+.5)){target={x:x+.5,y:y+.5};break}}
 if(!target)return say('Aucune trajectoire libre devant toi.');
 s.rocks--;s.heardX=target.x;s.heardY=target.y;s.heardTimer=7;s.noise=Math.max(20,s.noise);
 entityPath=[];pathClock=0;beep(170);say('Une diversion résonne dans la pièce. Déplace-toi sans courir.');
}
function decoder(){
 if(s.records.length<3)return say('Le phonographe réclame trois bandes.');
 const extra=target=>{
  const label=document.createElement('label');label.textContent='FRÉQUENCE / 3 CHIFFRES';label.htmlFor='code';
  const input=document.createElement('input');input.id='code';input.maxLength=3;input.inputMode='numeric';input.placeholder='_ _ _';
  const error=document.createElement('p');error.id='code-error';error.textContent='Lis les trois bandes dans l’ordre.';
  target.append(label,input,error);
  target.submit=()=>{
   if(input.value.trim()===CODE){s.door=true;beep(800);save();resume();say('Phonographe déverrouillé. La porte nord-ouest est ouverte.')}
   else{$('code-error').textContent='Fréquence refusée. Consulte les trois archives.';s.health=clamp(s.health-5,0,100);beep(120)}
  };
 };
 popup('PROTOCOLE ACOUSTIQUE','LA FRÉQUENCE INTERDITE',
 'Trois enregistrements constituent la clé de l’issue.',
 [{label:'DÉCODER',primary:true,action:()=>$('modalExtra').submit()},{label:'FERMER',action:resume}],extra);
}
function journal(){
 if(!playing)return;
 popup('ARCHIVES / 03','LES VOIX DU MUR','Chaque bande livre un chiffre dans l’ordre de son index.',
 [{label:'REVENIR',primary:true,action:resume}],
 wrap=>{
  for(const t of tapes){const div=document.createElement('p');div.className='entry';div.textContent=s.records.includes(t.key)?t.name+' : '+t.text:t.name+' : NON TROUVÉ';wrap.append(div)}
 });
}
function bfs(a,b,c,d){
 const sx=Math.floor(a),sy=Math.floor(b),tx=Math.floor(c),ty=Math.floor(d);
 if(blocked(tx+.5,ty+.5))return [];
 const dirs=[[0,1],[1,0],[0,-1],[-1,0]],q=[[sx,sy]],seen=new Set([sx+','+sy]),prev=new Map();
 for(let i=0;i<q.length&&i<400;i++){
  const [x,y]=q[i];if(x===tx&&y===ty)break;
  for(const [dx,dy] of dirs){const xx=x+dx,yy=y+dy,k=xx+','+yy;if(blocked(xx+.5,yy+.5)||seen.has(k))continue;seen.add(k);prev.set(k,[x,y]);q.push([xx,yy])}
 }
 const last=tx+','+ty;if(!seen.has(last))return [];
 let n=[tx,ty],out=[];while(n[0]!==sx||n[1]!==sy){out.unshift([n[0]+.5,n[1]+.5]);n=prev.get(n[0]+','+n[1]);if(!n)return []}
 return out;
}
function lineOfSight(ax,ay,bx,by){
 const distance=Math.hypot(bx-ax,by-ay),n=Math.ceil(distance*6);
 for(let i=1;i<n;i++){const t=i/n;if(blocked(ax+(bx-ax)*t,ay+(by-ay)*t))return false}
 return true;
}
function guardian(dt){
 const dist=Math.hypot(s.x-s.guardianX,s.y-s.guardianY);
 const audible=dist<2+s.noise*.093,visible=!s.hidden&&dist<4.5&&lineOfSight(s.guardianX,s.guardianY,s.x,s.y);
 const chasing=!s.hidden&&(audible||visible);
 if(chasing){s.heardX=s.x;s.heardY=s.y;s.heardTimer=3.4}
 else s.heardTimer=Math.max(0,s.heardTimer-dt);
 const patrol=[[12.5,8.5],[19.5,10.5],[20.5,3.5],[11.5,2.5],[4.5,10.5]];
 if(!s.heardTimer&&Math.hypot(s.guardianX-patrol[patrolIndex][0],s.guardianY-patrol[patrolIndex][1])<.7)patrolIndex=(patrolIndex+1)%patrol.length;
 const target=s.heardTimer?[s.heardX,s.heardY]:patrol[patrolIndex];
 pathClock-=dt;
 if(pathClock<=0){entityPath=bfs(s.guardianX,s.guardianY,...target);pathClock=.34}
 if(entityPath.length){
  const [x,y]=entityPath[0],dx=x-s.guardianX,dy=y-s.guardianY,len=Math.hypot(dx,dy);
  const speed=chasing?2.5:s.heardTimer?1.9:1.25;
  if(len<=speed*dt){s.guardianX=x;s.guardianY=y;entityPath.shift()}
  else{s.guardianX+=dx/len*speed*dt;s.guardianY+=dy/len*speed*dt}
 }
 s.detected=chasing&&dist<7;$('alert').hidden=!s.detected;
 if(!s.hidden&&Math.hypot(s.x-s.guardianX,s.y-s.guardianY)<.65)s.health=clamp(s.health-33*dt,0,100);
 if(s.health<=0)failure();
}
function moving(dt){
 if(s.hidden){s.noise=clamp(s.noise-42*dt,0,100);s.time+=dt;guardian(dt);return}
 let dx=Number(keys.has('KeyD')||keys.has('ArrowRight')||held.has('right'))-Number(keys.has('KeyA')||keys.has('KeyQ')||keys.has('ArrowLeft')||held.has('left'));
 let dy=Number(keys.has('KeyS')||keys.has('ArrowDown')||held.has('down'))-Number(keys.has('KeyZ')||keys.has('KeyW')||keys.has('ArrowUp')||held.has('up'));
 const length=Math.hypot(dx,dy),running=length>0&&(keys.has('ShiftLeft')||keys.has('ShiftRight')),sneak=keys.has('ControlLeft')||keys.has('ControlRight');
 if(length){dx/=length;dy/=length;s.dirX=dx;s.dirY=dy}
 const speed=running&&s.stamina>0?4.5:sneak?1.25:2.6;
 const vx=dx*dt*speed,vy=dy*dt*speed,r=.23;
 const okX=!blocked(s.x+vx+r,s.y+r)&&!blocked(s.x+vx-r,s.y-r)&&!blocked(s.x+vx+r,s.y-r)&&!blocked(s.x+vx-r,s.y+r);
 if(okX)s.x+=vx;
 const okY=!blocked(s.x+r,s.y+vy+r)&&!blocked(s.x-r,s.y+vy-r)&&!blocked(s.x+r,s.y+vy-r)&&!blocked(s.x-r,s.y+vy+r);
 if(okY)s.y+=vy;
 if(running&&length)s.stamina=clamp(s.stamina-29*dt,0,100);else s.stamina=clamp(s.stamina+18*dt,0,100);
 s.noise=clamp(s.noise-35*dt,0,100);
 if(length){
  const noisy=glass.has(Math.floor(s.x)+','+Math.floor(s.y));
  s.noise=Math.max(s.noise,noisy?92:running?80:sneak?7:23);
  s.steps+=dt*speed;
 }
 s.time+=dt;guardian(dt);
}
function drawImage(name,x,y,w,h,fallback){
 const im=imgs[name];if(im.complete&&im.naturalWidth)g.drawImage(im,x,y,w,h);
 else{g.fillStyle=fallback;g.fillRect(x,y,w,h)}
}
function draw(){
 g.clearRect(0,0,960,560);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const X=x*TILE,Y=y*TILE,solid=wall[y][x];
  drawImage(solid?'wall':'floor',X,Y,TILE,TILE,solid?'#4e4051':(x+y)%2?'#2c2331':'#352938');
  if(glass.has(x+','+y)){g.strokeStyle='#adbec6';g.lineWidth=1;g.beginPath();g.moveTo(X+5,Y+10);g.lineTo(X+32,Y+24);g.lineTo(X+22,Y+35);g.moveTo(X+18,Y+3);g.lineTo(X+12,Y+35);g.stroke()}
 }
 for(const c of closets)drawImage('locker',c.x*TILE+4,c.y*TILE+3,32,35,'#736373');
 for(const c of tapes){if(s.records.includes(c.key))continue;drawImage('tape',c.x*TILE+7,c.y*TILE+7,27,27,'#b7a692')}
 if(!s.door)drawImage('decoder',consoleObj.x*TILE+4,consoleObj.y*TILE+4,32,32,'#b58eac');
 else drawImage('exit',exit.x*TILE+4,exit.y*TILE+3,32,36,'#8ec6a5');
 // Reactive acoustics: expanding circles make sound-generation visible.
 if(s.noise>8&&!s.hidden){const rad=12+s.noise*.7,growth=(s.time*2)%1;
  g.strokeStyle='rgba(237,167,189,'+(0.3*(1-growth))+')';g.lineWidth=2;g.beginPath();g.arc(s.x*TILE,s.y*TILE,rad*(.35+growth),0,Math.PI*2);g.stroke()}
 drawImage('guardian',s.guardianX*TILE-23,s.guardianY*TILE-38,46,62,'#7d5766');
 if(s.hidden){g.fillStyle='#14202ba8';g.beginPath();g.arc(s.x*TILE,s.y*TILE,17,0,7);g.fill()}
 else drawImage(s.steps%2>.9?'protagonist_walk':'protagonist_idle',s.x*TILE-21,s.y*TILE-40,42,54,'#ddbbc3');
 // Indoor darkness, broken by the player's short-range vision.
 g.save();g.fillStyle='#030209b3';g.fillRect(0,0,960,560);g.globalCompositeOperation='destination-out';
 const px=s.x*TILE,py=s.y*TILE,rad=s.hidden?100:168;
 const grd=g.createRadialGradient(px,py,10,px,py,rad);
 grd.addColorStop(0,'#000');grd.addColorStop(.6,'#000b');grd.addColorStop(1,'#0000');
 g.fillStyle=grd;g.beginPath();g.arc(px,py,rad,0,Math.PI*2);g.fill();g.restore();
 const target=candidate();if(target){g.strokeStyle='#ffdaa6';g.strokeRect(target.x*TILE+3,target.y*TILE+3,34,34)}
 const nearLocker=closetNear();
 if(nearLocker){g.strokeStyle=s.hidden?'#78d6a4':'#c3b2e7';g.lineWidth=2;g.strokeRect(nearLocker.x*TILE,nearLocker.y*TILE,40,40)}
 if(s.hidden){g.font='bold 18px monospace';g.textAlign='center';g.fillStyle='#d6d1c7';g.fillText('CACHÉ · ESPACE POUR SORTIR',480,30)}
}
function hud(){
 const done=s.records.length+Number(s.door);
 $('objective').textContent=s.records.length<3?'Retrouver les trois enregistrements':!s.door?'Déverrouiller le phonographe':'Atteindre la sortie nord-ouest';
 $('objectiveHint').textContent=s.records.length<3?'Bandes dans le salon, l’atelier et le sous-sol.':!s.door?'Entre le code des trois bandes au terminal du nord-est.':'La porte principale est déverrouillée. Évite le Gardien.';
 $('missionBar').style.width=done*25+'%';$('progress').textContent=done+' / 4 ÉTAPES';
 $('healthText').textContent=Math.ceil(s.health)+'%';$('healthMeter').style.width=s.health+'%';
 $('staminaText').textContent=Math.ceil(s.stamina)+'%';$('staminaMeter').style.width=s.stamina+'%';
 $('rocksText').textContent=s.rocks;
 $('noiseValue').textContent=Math.ceil(s.noise)+' dB';
 $('detection').textContent=s.hidden?'CACHÉ':s.detected?'DÉTECTÉ':'NON LOCALISÉ';
 $('noiseHint').textContent=s.noise>70?'Le bruit est critique : arrête de courir.':s.hidden?'Tu retiens ton souffle.':'Marche doucement. Les plaques de verre augmentent le bruit.';
 const bars=[...$('soundBars').children];for(let i=0;i<bars.length;i++){
  const fraction=clamp(s.noise/100*12-i,0,1);bars[i].style.height=(15+fraction*80)+'%';bars[i].style.background=fraction>.15?(i>8?'#ef707e':'#d2a2a9'):'#493747';
 }
 $('records').replaceChildren();
 if(!s.records.length){const p=document.createElement('p');p.textContent='Le dossier est encore vide.';$('records').append(p)}
 for(const id of s.records){const tape=tapes.find(t=>t.key===id),p=document.createElement('p');p.textContent=tape.name+' / '+tape.digit;$('records').append(p)}
 $('zone').textContent=s.y<6?'AILE NORD':s.y<9?'COULOIR CENTRAL':'AILE SUD';
 const near=candidate();$('nearby').hidden=!near;$('nearbyText').textContent=near?.name||'EXAMINER';
 $('hide').textContent=s.hidden?'SORTIR DE L’ARMOIRE':'SE CACHER';
}
function loop(now){
 requestAnimationFrame(loop);const dt=clamp((now-last)/1000,0,.05);last=now;
 if(playing){moving(dt);if(now-lastSave>26000){lastSave=now;save()}
  if(now-lastHUD>140){lastHUD=now;hud()}}
 draw();
}
document.addEventListener('keydown',e=>{
 if(e.target.matches('input,textarea,select'))return;
 if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
 if(e.code==='Escape'){if(playing)pause();return}
 if(!playing)return;keys.add(e.code);if(e.repeat)return;
 if(e.code==='KeyE')inspect();if(e.code==='Space')hiding();
 if(e.code==='KeyR')throwRock();if(e.code==='KeyJ')journal();
 if(e.code==='KeyK'){if(save())say('Sauvegarde effectuée.')}
});
document.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();held.clear()});
for(const button of document.querySelectorAll('[data-move]')){
 const dir=button.dataset.move;button.addEventListener('pointerdown',e=>{held.add(dir);button.setPointerCapture?.(e.pointerId)});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>held.delete(dir));
}
for(const [id,fn] of [['touchInteract',inspect],['touchHide',hiding],['touchRock',throwRock],['interact',inspect],['hide',hiding],['throw',throwRock],['notes',journal]])$(id).onclick=fn;
$('save').onclick=()=>{if(save())say('Partie sauvegardée.')};
$('restart').onclick=()=>popup('AVERTISSEMENT','RECOMMENCER ?','La sauvegarde sera perdue.',[{label:'ANNULER',action:resume},{label:'CONFIRMER',primary:true,action:()=>start(true)}]);
$('pause').onclick=()=>playing?pause():resume();
$('new').onclick=()=>start(true);$('continue').onclick=()=>start(false);
$('sound').onclick=()=>{soundEnabled=!soundEnabled;$('sound').textContent='♫ SON '+(soundEnabled?'ON':'OFF');$('sound').setAttribute('aria-pressed',String(soundEnabled));if(soundEnabled)initAudio()};
for(let i=0;i<12;i++)$('soundBars').append(document.createElement('i'));
try{$('continue').disabled=!JSON.parse(localStorage.getItem(SAVE)||'null')?.version}catch(e){$('continue').disabled=true}
hud();requestAnimationFrame(loop);
})();