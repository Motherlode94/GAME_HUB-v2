import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

const $ = id => document.getElementById(id);
const canvas = $('game'), area = $('scene');
const STORE = 'warlike.nereide.h09.v2';
const CODE = '417';
const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
const renderer = new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.6));
renderer.setSize(area.clientWidth,area.clientHeight,false);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.45;
const scene=new THREE.Scene();scene.background=new THREE.Color('#041722');scene.fog=new THREE.FogExp2(0x0a2830,.032);
const camera=new THREE.PerspectiveCamera(72,area.clientWidth/Math.max(1,area.clientHeight),.08,100);
const player=new THREE.Group();scene.add(player);player.add(camera);camera.position.y=1.6;
scene.add(new THREE.HemisphereLight(0x9dd2d8,0x06131b,.55));
const lamp=new THREE.SpotLight(0xdaf3ff,0,22,.47,.7,1.1);camera.add(lamp);lamp.position.set(0,0,0);
lamp.target.position.set(0,-.1,-6);camera.add(lamp.target);
const clock=new THREE.Clock();
const colliders=[],interactions=[],electricLights=[];
const keys=new Set(),touch=new Set();
let playing=false,won=false,threatTime=0,lastSave=0,lastUI=0,lastRadar=0,lookTouch=null;
let audioCtx=null,hum=null,gain=null;
let hatch,creature,creatureEye,waterPlane;
const noteText={
 four:['REGISTRE DU TECHNICIEN','Premier chiffre : 4. « Quatre impulsions avant le silence. »'],
 one:['MANUEL DU BALLAST','Deuxième chiffre : 1. « Une seule vanne à condamner. »'],
 seven:['JOURNAL DU VEILLEUR','Troisième chiffre : 7. « À la septième répétition, le chant répondit. »']
};
const init=()=>({x:0,z:18,yaw:0,pitch:0,oxygen:100,health:100,battery:100,nerve:100,flood:42,
 fuse:false,power:false,valve:false,radio:false,light:false,notes:[],tanks:[],time:0,deaths:0,
 hunterX:0,hunterZ:-14});
let s=init();
const metal=(c,m=.55,r=.62)=>new THREE.MeshStandardMaterial({color:c,metalness:m,roughness:r});
const M={wall:metal(0x344952),floor:metal(0x3b4c51),dark:metal(0x1c303b),copper:metal(0x947658),steel:metal(0x85969b),glass:new THREE.MeshStandardMaterial({color:0x3f9eb3,transparent:true,opacity:.32,side:THREE.DoubleSide,depthWrite:false}),red:metal(0xa64c4d),green:metal(0x409d81)};
function cube(w,h,d,x,y,z,mat,solid=false){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);o.position.set(x,y,z);scene.add(o);if(solid)colliders.push({x,z,w,d});return o}
function cyl(radius,height,x,y,z,mat,segments=16){const o=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,height,segments),mat);o.position.set(x,y,z);scene.add(o);return o}
function tube(points,color=0x7d8684,rad=.075){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const obj=new THREE.Mesh(new THREE.TubeGeometry(curve,24,rad,8),metal(color));scene.add(obj)}
function marker(x,z,color=0x8ae0d2){const o=new THREE.Mesh(new THREE.SphereGeometry(.13,10,8),new THREE.MeshBasicMaterial({color}));o.position.set(x,2,z);scene.add(o);return o}
function registerInteraction(id,x,z,label,fn){const m=marker(x,z);interactions.push({id,x,z,label,fn,m})}
function build(){
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(28,48),M.floor);floor.rotation.x=-Math.PI/2;floor.position.y=-.02;scene.add(floor);
 cube(28,.26,48,0,4.02,0,M.dark);
 for(const [x,z,w,d] of [[0,24,28,.5],[0,-24,28,.5]])cube(w,4,d,x,2,z,M.wall,true);
 // The observation ports are genuinely transparent openings, not glass stuck
 // over opaque walls: construct side panels around two pressure windows.
 for(const x of [-14,14]){
  for(const [z,len] of [[-17.925,12.15],[3.5,23.3],[21.425,5.15]])cube(.5,4,len,x,2,z,M.wall,true);
  for(const z of [-10,17]){
   cube(.14,2.35,3.7,x,1.93,z,M.glass);
   colliders.push({x,z,w:.5,d:3.7});
   cube(.55,.88,3.8,x,.44,z,M.wall);
   cube(.55,.85,3.8,x,3.54,z,M.wall);
  }
 }
 // Partitioned machine bays, keeping a continuous 7-metre central corridor.
 for(const x of [-4.3,4.3])for(const [z,len] of [[15,13],[-1,11],[-18,10]])cube(.36,3.65,len,x,1.85,z,M.wall,true);
 for(let z=-21;z<23;z+=4){
  for(const x of [-3.7,3.7])cube(.12,3.85,.18,x,1.93,z,M.copper);
  cube(7,.015,.08,0,.02,z,M.copper);
  const l=new THREE.PointLight(0x80d9d2,1.7,12,2);l.position.set(0,3.45,z);scene.add(l);electricLights.push(l);
  cyl(.33,.08,0,3.73,z,M.steel);
 }
 for(const x of [-13.2,13.2]){
  for(const z of [17,-10]){
   const glass=cube(.15,2.15,3.2,x,2,z,M.glass);
   const ring=new THREE.Mesh(new THREE.TorusGeometry(1.05,.12,9,32),M.copper);
   ring.rotation.y=Math.PI/2;ring.position.set(x+(x>0?-.11:.11),2,z);scene.add(ring);
   for(let a=0;a<8;a++){const angle=a*Math.PI/4;marker(x, z+Math.sin(angle)*1.08,0x9db4b1).position.y=2+Math.cos(angle)*1.08}
  }
  tube([[x,3.3,-23],[x,3.3,-8],[x,3.3,10],[x,3.3,23]],0x745f50,.1);
 }
 // Durable, readable set dressing: industrial tanks, control desks, light beacons, grates.
 for(const [x,z] of [[-10,18],[-11,15],[10,18],[11,15],[-11,-19],[11,-19]]){
  cyl(.65,2.1,x,1.08,z,M.dark);cyl(.72,.13,x,2.16,z,M.copper);
  const band=cyl(.69,.14,x,1.5,z,M.steel);
 }
 for(let z=-20;z<21;z+=4){
  const grate=cube(2.8,.018,1.3,0,.02,z,M.dark);
  for(let xx=-1.2;xx<1.3;xx+=.23)cube(.06,.025,1.3,xx,.035,z,M.steel);
 }
 const terminals=[[-10,10],[10,10],[-10,-10],[10,-10]];
 for(const [x,z] of terminals){
  cube(1.35,1.52,.75,x,.76,z,M.steel);
  const screen=cube(1.0,.52,.05,x,1.14,z+.41,new THREE.MeshBasicMaterial({color:0x2f7480}));
  for(let i=-1;i<=1;i++){marker(x+i*.25,z+.44,0x61dcc9).position.y=.67}
 }
 // Objects & distinct puzzle stations.
 const fuse=cyl(.17,.72,-10,.91,10,M.copper);fuse.rotation.z=Math.PI/2;
 registerInteraction('fuse',-10,10,'PRENDRE LE FUSIBLE',()=>{
  if(s.fuse)return say('Tu possèdes déjà le fusible.');
  s.fuse=true;fuse.visible=false;note('four');say('Fusible récupéré. Les archives révèlent le chiffre 4.',4100);beep(470);save();
 });
 registerInteraction('generator',10,10,'RÉTABLIR L’ÉLECTRICITÉ',()=>{
  if(s.power)return say('Le générateur est opérationnel.');
  if(!s.fuse)return say('Le générateur exige un fusible : fouille la réserve à l’ouest.');
  s.power=true;beep(710);say('Réseau électrique actif. La station a répondu au signal.',3600);save();updateWorld();
 });
 const valve=new THREE.Mesh(new THREE.TorusGeometry(.55,.11,9,25),M.copper);valve.position.set(-10,1.5,-10);scene.add(valve);
 for(let i=0;i<4;i++){const a=i*Math.PI/2;const arm=cube(.07,.07,.8,-10+Math.sin(a)*.22,1.5+Math.cos(a)*.22,-10,M.steel);arm.rotation.z=a}
 registerInteraction('valve',-10,-10,'FERMER LA VANNE DE BALLAST',()=>{
  if(s.valve)return say('La vanne tient. Le niveau baisse lentement.');
  if(!s.power)return say('Le ballast reste verrouillé tant que le générateur est éteint.');
  s.valve=true;valve.rotation.z=.65;note('one');beep(660);say('La fuite ralentit. Deuxième chiffre : 1.',3600);save();
 });
 registerInteraction('memo',10,-16,'LIRE LE JOURNAL DU VEILLEUR',()=>{
  note('seven');say('Journal collecté : sept répétitions. Dernier chiffre : 7.',4000);beep(370);save();
 });
 registerInteraction('radio',10,-10,'OUVRIR LA TRANSMISSION RADIO',()=>{
  if(!s.power)return say('Aucune alimentation électrique.');
  if(!s.valve)return say('La console refuse de répondre pendant la fuite.');
  if(s.radio)return say('Transmission acceptée. Capsule de secours déverrouillée.');
  codeModal();
 });
 for(const [id,x,z] of [['tankA',-11,5],['tankB',-10,-18]]){
  cyl(.23,1.1,x,.58,z,metal(0x86afba));
  registerInteraction(id,x,z,'RÉCUPÉRER UNE BONBONNE',()=>{
   if(s.tanks.includes(id))return say('La bonbonne est vide.');
   s.tanks.push(id);s.oxygen=clamp(s.oxygen+47,0,100);say('Réserve d’oxygène restaurée.',2800);beep(510);save();
  });
 }
 registerInteraction('charger',2,17,'RECHARGER AU SAS',()=>{
  if(!s.power)return say('Chargeur hors tension. Répare le générateur.');
  s.oxygen=clamp(s.oxygen+40,0,100);s.battery=100;s.nerve=clamp(s.nerve+20,0,100);
  say('Réserve vitale et batterie rechargées.',3000);beep(780);save();
 });
 hatch=cube(3,3.25,.58,0,1.67,-21.5,M.red,true);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(1.4,.19,12,32),M.copper);ring.position.set(0,1.65,-21.12);scene.add(ring);
 registerInteraction('hatch',0,-20.1,'ACTIVER LA CAPSULE DE SECOURS',()=>{
  if(!s.radio)return say('La capsule attend l’autorisation de la station radio.');
  complete();
 });
 // Volumetric-like underwater drifting particles.
 const geo=new THREE.BufferGeometry(),data=new Float32Array(600);
 for(let i=0;i<200;i++){data[i*3]=(Math.random()-.5)*42;data[i*3+1]=.3+Math.random()*9;data[i*3+2]=(Math.random()-.5)*65}
 geo.setAttribute('position',new THREE.BufferAttribute(data,3));
 const points=new THREE.Points(geo,new THREE.PointsMaterial({color:0x7fc0cb,size:.052,transparent:true,opacity:.55}));
 scene.add(points);
 // Exterior deep-ocean particulate field gives portholes visible depth.
 const ext=new Float32Array(1600*3);
 for(let i=0;i<1600;i++){
  const side=i%2===0?-1:1;
  ext[i*3]=side*(15+Math.random()*36);
  ext[i*3+1]=Math.random()*26-7;
  ext[i*3+2]=(Math.random()-.5)*90;
 }
 const extGeo=new THREE.BufferGeometry();extGeo.setAttribute('position',new THREE.BufferAttribute(ext,3));
 const seaDust=new THREE.Points(extGeo,new THREE.PointsMaterial({color:0x5babbf,size:.085,transparent:true,opacity:.34,depthWrite:false}));
 scene.add(seaDust);
 // Distant bioluminescent silhouettes outside the hull.
 for(const side of [-1,1])for(const [z,y] of [[17,2.4],[-10,1.8]]){
  const fish=new THREE.Group(),body=new THREE.Mesh(new THREE.SphereGeometry(.42,12,9),metal(0x2d707f,.1,.8));
  body.scale.set(1.8,.45,.38);fish.add(body);
  const tail=new THREE.Mesh(new THREE.ConeGeometry(.4,.8,3),metal(0x2d707f,.1,.8));
  tail.rotation.z=Math.PI/2;tail.position.x=-.8;fish.add(tail);
  const eye=new THREE.Mesh(new THREE.SphereGeometry(.04,8,6),new THREE.MeshBasicMaterial({color:0x8de8d5}));
  eye.position.set(.34,.12,-.1);fish.add(eye);
  fish.position.set(side*20,y,z);fish.rotation.y=side*Math.PI/3;
  scene.add(fish);
 }
 waterPlane=new THREE.Mesh(new THREE.PlaneGeometry(27.6,47.6),new THREE.MeshBasicMaterial({color:0x178a9c,transparent:true,opacity:.10,depthWrite:false,side:THREE.DoubleSide}));
 waterPlane.rotation.x=-Math.PI/2;waterPlane.position.y=.04;scene.add(waterPlane);
 createCreature();
}
function createCreature(){
 creature=new THREE.Group();const flesh=metal(0x214c53,.08,.86),bone=metal(0x73858b,.15,.42);
 const body=new THREE.Mesh(new THREE.CapsuleGeometry(.47,1.45,5,11),flesh);body.position.y=1.25;creature.add(body);
 const skull=new THREE.Mesh(new THREE.SphereGeometry(.47,16,12),bone);skull.scale.set(.75,1.15,.9);skull.position.y=2.42;creature.add(skull);
 for(const side of [-1,1]){
  const eye=new THREE.Mesh(new THREE.SphereGeometry(.09,10,8),new THREE.MeshBasicMaterial({color:0xfd626c}));eye.position.set(side*.24,2.5,-.38);creature.add(eye);
  const limb=new THREE.Mesh(new THREE.CylinderGeometry(.075,.15,2.5,8),flesh);
  limb.position.set(side*.7,.95,0);limb.rotation.z=side*.46;creature.add(limb);
  const leg=new THREE.Mesh(new THREE.CylinderGeometry(.1,.15,1.5,8),flesh);
  leg.position.set(side*.22,.1,0);leg.rotation.z=side*.14;creature.add(leg);
 }
 const glow=new THREE.PointLight(0xeb4c5c,1.1,5,2);glow.position.set(0,2.4,0);creature.add(glow);
 scene.add(creature);
}
function updateWorld(){
 hatch.visible=!s.radio;hatch.material=s.radio?M.green:M.red;
 for(const l of electricLights){l.intensity=s.power?2.5:.32;l.color.setHex(s.power?0x8fe4d6:0xb47768)}
 for(const i of interactions)i.m.visible=(i.id!=='fuse'||!s.fuse)&&!s.tanks.includes(i.id);
 lamp.intensity=s.light&&s.battery>0?4.4:0;
}
function soundStart(){
 if(!audioCtx||audioCtx.state==='suspended'){try{
  if(!audioCtx){audioCtx=new (window.AudioContext||window.webkitAudioContext)();gain=audioCtx.createGain();gain.gain.value=.015;gain.connect(audioCtx.destination);hum=audioCtx.createOscillator();hum.type='sine';hum.frequency.value=47;hum.connect(gain);hum.start()}
  else audioCtx.resume().catch(()=>{});
 }catch(e){console.warn('Audio désactivé',e)}}
}
function beep(freq=480){
 if(!audioCtx||!soundEnabled)return;
 try{const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='triangle';o.frequency.setValueAtTime(freq,audioCtx.currentTime);g.gain.setValueAtTime(.044,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+.33);o.connect(g).connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+.35)}catch(e){}
}
let soundEnabled=true;
function say(text,duration=3200){$('subtitle').textContent=text;$('subtitle').dataset.until=String(performance.now()+duration)}
function note(id){if(!s.notes.includes(id))s.notes.push(id)}
function savePayload(){return {version:2,...s,notes:[...s.notes],tanks:[...s.tanks]}}
function save(){
 if(won||s.health<=0||s.oxygen<=0)return false;
 try{localStorage.setItem(STORE,JSON.stringify(savePayload()));$('continueBtn').disabled=false;return true}
 catch(e){say('La sauvegarde locale est inaccessible.');return false}
}
function load(){
 try{
  const o=JSON.parse(localStorage.getItem(STORE)||'null');
  if(!o||o.version!==2||!Number.isFinite(o.x)||!Number.isFinite(o.z)||!Number.isFinite(o.oxygen)||o.health<=0||o.oxygen<=0)return false;
  Object.assign(s,init());
  for(const key of ['x','z','yaw','pitch','oxygen','health','battery','nerve','flood','time','deaths','hunterX','hunterZ'])
   if(Number.isFinite(o[key]))s[key]=o[key];
  if(Math.abs(s.x)>13||Math.abs(s.z)>23)return false;
  for(const k of ['fuse','power','valve','radio','light'])s[k]=o[k]===true;
  s.notes=Array.isArray(o.notes)?[...new Set(o.notes.filter(n=>Object.hasOwn(noteText,n)))]:[];
  s.tanks=Array.isArray(o.tanks)?[...new Set(o.tanks.filter(n=>['tankA','tankB'].includes(n)))]:[];
  for(const k of ['oxygen','health','battery','nerve','flood'])s[k]=clamp(s[k],0,100);
  s.pitch=clamp(s.pitch,-1.17,1.17);
  return true;
 }catch(e){return false}
}
function modal(kicker,title,body,actions,extra){
 playing=false;keys.clear();touch.clear();if(document.pointerLockElement)document.exitPointerLock?.();
 $('modalKicker').textContent=kicker;$('modalTitle').textContent=title;$('modalText').textContent=body;
 $('modalActions').replaceChildren();$('modalExtra').replaceChildren();
 if(extra)extra($('modalExtra'));
 for(const a of actions){const b=document.createElement('button');b.textContent=a.label;if(a.primary)b.className='primary';b.onclick=a.fn;$('modalActions').append(b)}
 $('overlay').classList.add('open');$('overlay').setAttribute('aria-hidden','false');
}
function resume(){
 playing=true;keys.clear();touch.clear();$('overlay').classList.remove('open');$('overlay').setAttribute('aria-hidden','true');
 area.focus({preventScroll:true});clock.getDelta();soundStart();updateWorld();
}
function start(fresh){
 if(fresh){Object.assign(s,init());won=false;try{localStorage.removeItem(STORE)}catch(e){}}
 else if(!load()){say('Sauvegarde inexistante. Nouvelle expédition.');Object.assign(s,init())}
 updateWorld();resume();say('Mission active. Explore la réserve ouest pour retrouver le fusible.',4200);hud();
}
function codeModal(){
 const extra=container=>{
  const label=document.createElement('label');label.textContent='CODE RADIO / 3 CHIFFRES';label.htmlFor='radio-code';
  const input=document.createElement('input');input.id='radio-code';input.type='text';input.inputMode='numeric';input.maxLength=3;input.placeholder='_ _ _';input.setAttribute('aria-label','Code à trois chiffres');
  const clue=document.createElement('p');clue.className='hintline';clue.textContent='Trouve les trois notes du personnel : réserve, ballast et journal du veilleur.';
  container.append(label,input,clue);
  input.addEventListener('keydown',e=>{if(e.key==='Enter')validate()});
  function validate(){
   const entered=input.value.trim();
   if(entered===CODE){
    s.radio=true;save();updateWorld();beep(850);resume();say('Transmission établie. Rejoins le sas nord et utilise la capsule.',5000);
   }else{clue.textContent='Code refusé. Les notes indiquent l’ordre exact des trois chiffres.';s.nerve=clamp(s.nerve-7,0,100);beep(170)}
  }
  container._submit=validate;
 };
 modal('PROTOCOLE H-09','LA FRÉQUENCE MORTE','La radio demande trois chiffres. Le personnel a laissé des traces.',[
  {label:'TRANSMETTRE',primary:true,fn:()=> $('modalExtra')._submit()},
  {label:'FERMER',fn:resume}],extra);
}
function showNotes(){
 modal('ARCHIVES RÉCUPÉRÉES','JOURNAL DES ABYSSES','Éléments recueillis dans l’installation :',[
  {label:'RETOUR À LA STATION',primary:true,fn:resume}],box=>{
   for(const id of s.notes){const p=document.createElement('p');p.className='note';p.textContent=noteText[id][0]+' — '+noteText[id][1];box.append(p)}
   if(!s.notes.length){const p=document.createElement('p');p.textContent='Aucune archive retrouvée.';box.append(p)}
  });
}
function pause(){
 if(!playing)return;
 save();
 modal('SYSTÈME / PAUSE','EXPÉDITION SUSPENDUE','L’océan ne s’arrête pas. Reprends l’exploration ou sauvegarde ton état.',[
  {label:'REPRENDRE',primary:true,fn:resume},{label:'SAUVEGARDER',fn:()=>{save();resume();say('Expédition sauvegardée.')}},{label:'QUITTER VERS LE HUB',fn:()=>{location.href='../../index.html'}}]);
}
function complete(){
 won=true;playing=false;try{localStorage.removeItem(STORE)}catch(e){}
 modal('TRANSMISSION RETROUVÉE','ÉVACUATION CONFIRMÉE',
  'La capsule remonte. Le Veilleur reste au fond. Tu as récupéré '+s.notes.length+'/3 archives en '+Math.ceil(s.time)+' secondes et subi '+s.deaths+' incidents.',
  [{label:'RECOMMENCER',primary:true,fn:()=>start(true)},{label:'RETOUR HUB',fn:()=>{location.href='../../index.html'}}]);
}
function failure(reason){
 const incidents=s.deaths+1;
 if(load()){s.deaths=incidents;s.health=75;s.oxygen=Math.max(60,s.oxygen);s.nerve=Math.max(45,s.nerve);s.hunterZ=-16;s.hunterX=0;
  modal('INCIDENT DE PLONGÉE','RETOUR AU DERNIER SAS',reason+' Le dernier point de contrôle a été restauré.',[{label:'REPRENDRE',primary:true,fn:()=>{updateWorld();resume();save()}}]);
 }else{modal('MISSION PERDUE','LE CHANT DU FOND',reason+' Aucun point de contrôle valide.',[{label:'NOUVELLE EXPÉDITION',primary:true,fn:()=>start(true)}])}
}
function toggleLight(){
 if(!playing)return;
 if(s.battery<=0){say('La batterie est vide.');return}
 s.light=!s.light;lamp.intensity=s.light?4.4:0;hud();
}
function nearby(){
 let best=null,dist=3.25;
 for(const item of interactions){const d=Math.hypot(s.x-item.x,s.z-item.z);if(d<dist){best=item;dist=d}}
 return best;
}
function interact(){
 if(!playing)return;
 const item=nearby();if(item)item.fn();else say('Rien à examiner à portée. Repère une lumière turquoise.');
 hud();
}
function blocked(x,z,margin=.32){
 if(Math.abs(x)>13.45||Math.abs(z)>23.45)return true;
 return colliders.some(c=>Math.abs(x-c.x)<c.w/2+margin&&Math.abs(z-c.z)<c.d/2+margin);
}
function motion(dt){
 const f=keys.has('KeyW')||keys.has('KeyZ')||keys.has('ArrowUp')||touch.has('forward');
 const b=keys.has('KeyS')||keys.has('ArrowDown')||touch.has('back');
 const l=keys.has('KeyA')||keys.has('KeyQ')||keys.has('ArrowLeft')||touch.has('left');
 const r=keys.has('KeyD')||keys.has('ArrowRight')||touch.has('right');
 let sx=Number(r)-Number(l),sz=Number(b)-Number(f),length=Math.hypot(sx,sz);
 const moving=length>0,running=moving&&(keys.has('ShiftLeft')||keys.has('ShiftRight')||touch.has('run'));
 if(moving){sx/=length;sz/=length}
 const speed=running?5.4:3.15;
 const vx=(sx*Math.cos(s.yaw)+sz*Math.sin(s.yaw))*speed*dt;
 const vz=(-sx*Math.sin(s.yaw)+sz*Math.cos(s.yaw))*speed*dt;
 if(!blocked(s.x+vx,s.z))s.x+=vx;
 if(!blocked(s.x,s.z+vz))s.z+=vz;
 player.position.set(s.x,0,s.z);player.rotation.y=s.yaw;camera.rotation.x=s.pitch;
 s.time+=dt;
 s.oxygen=clamp(s.oxygen-dt*(running?.52:.25)*(s.flood>70?1.3:1),0,100);
 s.flood=clamp(s.flood+(s.valve?-1.3:.12)*dt,8,95);
 if(s.light){s.battery=clamp(s.battery-.65*dt,0,100);if(s.battery<=0){s.light=false;lamp.intensity=0;say('L’éclairage s’est éteint.')}}
 const fearDist=Math.hypot(s.x-s.hunterX,s.z-s.hunterZ);
 s.nerve=clamp(s.nerve+(fearDist<8?-.95:.29)*dt,0,100);
 if(s.flood>75)s.health=clamp(s.health-.65*dt,0,100);
 if(s.nerve<=5)s.health=clamp(s.health-.3*dt,0,100);
 if(s.oxygen<=0||s.health<=0)failure(s.oxygen<=0?'La réserve d’oxygène est épuisée.':'La combinaison n’a pas tenu la pression.');
 hunter(dt,running,moving);
}
// Walls block direct sight; sound and light still attract the creature over shorter distances.
let lastHunterX=0,lastHunterZ=-14,hadHunterContact=false;
function hunterLineClear(x1,z1,x2,z2){
 const distance=Math.hypot(x2-x1,z2-z1),steps=Math.ceil(distance/.5);
 for(let i=1;i<steps;i++){const t=i/steps;if(blocked(x1+(x2-x1)*t,z1+(z2-z1)*t,.25))return false}
 return true;
}
function hunter(dt,running,moving){
 const dx=s.x-s.hunterX,dz=s.z-s.hunterZ,d=Math.hypot(dx,dz);
 const visible=d<11&&hunterLineClear(s.hunterX,s.hunterZ,s.x,s.z)&&(s.light||d<5.5);
 const audible=(running&&d<13)||(moving&&d<5.6);
 const hunting=visible||audible||(d<1.8);
 let targetX=0,targetZ=-15;
 if(hunting){targetX=s.x;targetZ=s.z;lastHunterX=s.x;lastHunterZ=s.z;threatTime=4}
 else if(threatTime>0){targetX=lastHunterX;targetZ=lastHunterZ;threatTime=Math.max(0,threatTime-dt)}
 else{targetX=Math.sin(s.time*.16)*2;targetZ=-14+Math.cos(s.time*.12)*4}
 if(hunting&&!hadHunterContact)beep(76,.26);
 hadHunterContact=hunting;
 const dirX=targetX-s.hunterX,dirZ=targetZ-s.hunterZ,len=Math.hypot(dirX,dirZ)||1;
 const speed=hunting?2.05:threatTime>0?1.38:.68;
 const nx=s.hunterX+dirX/len*speed*dt,nz=s.hunterZ+dirZ/len*speed*dt;
 // The central passage is its habitat; it cannot clip into storage walls.
 if(!blocked(nx,s.hunterZ,.7))s.hunterX=nx;
 if(!blocked(s.hunterX,nz,.7))s.hunterZ=nz;
 creature.position.set(s.hunterX,.08*Math.sin(s.time*2.2),s.hunterZ);
 creature.rotation.y=Math.atan2(dx,dz)+Math.PI;
 $('danger').hidden=!(d<10&&(hunting||threatTime>0));
 if(d<1.55){s.health=clamp(s.health-24*dt,0,100);s.nerve=clamp(s.nerve-14*dt,0,100)}
}
function updateObjective(){
 const n=Number(s.fuse)+Number(s.power)+Number(s.valve)+Number(s.radio);
 const values=[
 ['Trouver le fusible','Récupère un fusible dans la réserve ouest (x : −10, z : +10).'],
 ['Rétablir le courant','Active le générateur situé à l’est (x : +10, z : +10).'],
 ['Stabiliser le ballast','Ferme la vanne ouest (x : −10, z : −10).'],
 ['Décoder la transmission','Collecte les trois notes puis entre leur code à la radio est (x : +10, z : −10).'],
 ['Rejoindre la capsule','Suis le couloir central jusqu’au sas nord et évacue.']];
 const goal=values[Math.min(n,4)];
 $('objective').textContent=goal[0];$('objectiveDetail').textContent=goal[1];
 $('steps').textContent=Math.min(n,4)+' / 4 ÉTAPES';
 $('objectiveBar').style.width=(Math.min(n,4)*25)+'%';
}
function hud(){
 updateObjective();
 for(const [n,value] of [['oxygen',s.oxygen],['health',s.health],['battery',s.battery],['flood',s.flood],['nerve',s.nerve]]){
  const p=Math.round(value);$(n+'Txt').textContent=p+' %';$(n+'Bar').style.width=p+'%';
 }
 $('inventoryFuse').lastElementChild.textContent=s.fuse?'OBTENU':'ABSENT';
 $('inventoryNotes').lastElementChild.textContent=s.notes.length+' / 3';
 $('journalList').replaceChildren();
 if(!s.notes.length){const p=document.createElement('p');p.textContent='Aucune note récupérée.';$('journalList').append(p)}
 for(const n of s.notes){const p=document.createElement('p');p.textContent=noteText[n][0];$('journalList').append(p)}
 $('lampBtn').innerHTML='◉ LAMPE : '+(s.light?'ALLUMÉE':'ÉTEINTE')+' <kbd>F</kbd>';
 $('area').textContent=s.z>5?'SAS / SECTEUR DE SURVIE':s.z>-5?'LABORATOIRES / TRANSIT':'CONTRÔLE / TRANSMISSION';
 $('coordinate').textContent='X '+s.x.toFixed(1)+' · Z '+s.z.toFixed(1)+' · −2 800 M';
 $('worldStatus').textContent='PRESSION : '+(280+s.flood*.7).toFixed(0)+' BAR · '+(s.flood>70?'INONDATION CRITIQUE':s.power?'SYSTÈMES ALIMENTÉS':'SECOURS INSTABLE');
 $('lampBtn').disabled=s.battery<=0;
 $('signalStatus').textContent=s.nerve<40?'Écho biologique proche — évite la lumière et le sprint.':'Échos intermittents — une signature approche.';
 const object=nearby();$('interactPrompt').hidden=!object;$('interactLabel').textContent=object?.label||'EXAMINER';
}
function radar(){
 const c=$('radar'),p=c.getContext('2d');if(!p)return;const w=c.width,h=c.height;
 p.fillStyle='#051b24';p.fillRect(0,0,w,h);p.save();p.translate(w/2,h/2);
 p.strokeStyle='#2c6263';p.lineWidth=1;
 for(let r=23;r<=106;r+=28){p.beginPath();p.arc(0,0,r,0,Math.PI*2);p.stroke()}
 p.beginPath();p.moveTo(-110,0);p.lineTo(110,0);p.moveTo(0,-110);p.lineTo(0,110);p.stroke();
 p.fillStyle='#254a55';p.fillRect(-30,-102,60,205);
 p.strokeStyle='#689a9a';p.strokeRect(-30,-102,60,205);
 const project=(x,z)=>[x/14*85,z/24*100];
 for(const i of interactions){if(i.id==='fuse'&&s.fuse||i.id==='generator'&&s.power||i.id==='valve'&&s.valve||i.id==='radio'&&s.radio)continue;
  const [x,y]=project(i.x,i.z);p.fillStyle='#d4ad74';p.fillRect(x-2,y-2,4,4)}
 const [px,py]=project(s.x,s.z),[hx,hy]=project(s.hunterX,s.hunterZ);
 p.fillStyle='#ed626e';p.beginPath();p.arc(hx,hy,4,0,Math.PI*2);p.fill();
 p.save();p.translate(px,py);p.rotate(-s.yaw);p.fillStyle='#92f1e1';p.beginPath();p.moveTo(0,-8);p.lineTo(-5,6);p.lineTo(5,6);p.closePath();p.fill();p.restore();p.restore();
}
function frame(){
 requestAnimationFrame(frame);
 const dt=Math.min(.042,clock.getDelta());
 const rect=area.getBoundingClientRect();
 if(rect.width>0&&rect.height>0){const w=Math.max(320,Math.floor(rect.width)),h=Math.max(200,Math.floor(rect.height));
  if(renderer.domElement.width!==Math.floor(w*renderer.getPixelRatio())||renderer.domElement.height!==Math.floor(h*renderer.getPixelRatio())){
   renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
  }}
 if(playing){motion(dt);if(s.time-lastSave>25){lastSave=s.time;save()}
  if(performance.now()-lastUI>180){lastUI=performance.now();hud()}
  if(performance.now()-lastRadar>400){lastRadar=performance.now();radar()}}
 renderer.render(scene,camera);
}
function rotate(dx,dy){
 if(!playing)return;
 s.yaw-=dx*.0026;s.pitch=clamp(s.pitch-dy*.0023,-1.17,1.17);
}
area.addEventListener('click',e=>{if(playing&&!e.target.closest('button')&&e.pointerType!=='touch')canvas.requestPointerLock?.().catch(()=>{})});
document.addEventListener('mousemove',e=>{if(document.pointerLockElement===canvas)rotate(e.movementX,e.movementY)});
area.addEventListener('touchstart',e=>{if(e.target.closest('button'))return;const t=e.changedTouches[0];lookTouch={id:t.identifier,x:t.clientX,y:t.clientY}},{passive:true});
area.addEventListener('touchmove',e=>{if(!lookTouch)return;const t=[...e.changedTouches].find(v=>v.identifier===lookTouch.id);if(!t)return;rotate(t.clientX-lookTouch.x,t.clientY-lookTouch.y);lookTouch.x=t.clientX;lookTouch.y=t.clientY},{passive:true});
area.addEventListener('touchend',e=>{if([...e.changedTouches].some(v=>v.identifier===lookTouch?.id))lookTouch=null});
document.addEventListener('keydown',e=>{
 if(e.target.matches('input,textarea,select'))return;
 if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
 if(e.code==='Escape'){if(playing)pause();else if($('overlay').classList.contains('open')){}return}
 if(!playing)return;
 keys.add(e.code);
 if(e.repeat)return;
 if(e.code==='KeyE')interact();
 if(e.code==='KeyF')toggleLight();
 if(e.code==='KeyJ')showNotes();
 if(e.code==='KeyK'){if(save())say('Expédition sauvegardée sur cet appareil.')}
});
document.addEventListener('keyup',e=>keys.delete(e.code));
window.addEventListener('blur',()=>{keys.clear();touch.clear()});
for(const b of document.querySelectorAll('[data-move]')){
 const value=b.dataset.move;
 b.addEventListener('pointerdown',e=>{e.preventDefault();touch.add(value);b.setPointerCapture?.(e.pointerId)});
 for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,()=>touch.delete(value));
}
$('touchRun').addEventListener('pointerdown',e=>{touch.add('run');$('touchRun').setPointerCapture?.(e.pointerId)});
for(const ev of ['pointerup','pointercancel','lostpointercapture'])$('touchRun').addEventListener(ev,()=>touch.delete('run'));
$('touchInteract').onclick=interact;$('touchLamp').onclick=toggleLight;
$('startBtn').onclick=()=>start(true);$('continueBtn').onclick=()=>start(false);
$('pauseBtn').onclick=()=>playing?pause():resume();
$('lampBtn').onclick=toggleLight;$('saveBtn').onclick=()=>{if(save())say('Sauvegarde créée.')};
$('restartBtn').onclick=()=>modal('RÉINITIALISATION','RECOMMENCER LA MISSION','Cette action remplace ta sauvegarde actuelle.',[
 {label:'ANNULER',fn:resume},{label:'RECOMMENCER',primary:true,fn:()=>start(true)}]);
$('journalBtn').onclick=showNotes;
$('audioBtn').onclick=()=>{soundEnabled=!soundEnabled;$('audioBtn').textContent='♫ AUDIO '+(soundEnabled?'ON':'OFF');$('audioBtn').setAttribute('aria-pressed',String(soundEnabled));if(gain)gain.gain.value=soundEnabled?.015:0};
function boot(){build();updateWorld();hud();radar();$('continueBtn').disabled=!(()=>{try{return !!JSON.parse(localStorage.getItem(STORE)||'null')?.version}catch(e){return false}})();frame()}
boot();
