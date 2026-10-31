import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const canvas=document.getElementById('game'),notice=document.getElementById('notice'),objective=document.getElementById('objective');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));renderer.shadowMap.enabled=true;
renderer.outputColorSpace=THREE.SRGBColorSpace;
const scene=new THREE.Scene();scene.background=new THREE.Color('#758d89');scene.fog=new THREE.FogExp2('#758d89',0.012);
const camera=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,.1,600);
scene.add(new THREE.HemisphereLight(0xd3e8ed,0x444a35,2.1));const sun=new THREE.DirectionalLight(0xffedcb,2.8);sun.position.set(-45,80,30);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-90;sun.shadow.camera.right=90;sun.shadow.camera.top=90;sun.shadow.camera.bottom=-90;scene.add(sun);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(300,300,70,70),new THREE.MeshStandardMaterial({color:0x465c3b,roughness:1}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
const path=new THREE.Mesh(new THREE.PlaneGeometry(6,190),new THREE.MeshStandardMaterial({color:0x6f6555,roughness:1}));path.rotation.x=-Math.PI/2;path.position.set(0,.024,-12);scene.add(path);
const loader=new GLTFLoader(),clock=new THREE.Clock(),keys=new Set(),colliders=[],loot=[];
let player=null,mixer=null,actions={},active='',yaw=0,pitch=.20,position=new THREE.Vector3(0,0,33),water=100,food=100,health=100,supplies=0,mission=0,noticeUntil=0;
function message(t){notice.textContent=t;notice.style.display='block';noticeUntil=performance.now()+3200}
function addGeometry(x,z,w,d,h,color,roof=false){const g=new THREE.Group(),mat=new THREE.MeshStandardMaterial({color,roughness:.88});const walls=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);walls.position.y=h/2;walls.castShadow=true;walls.receiveShadow=true;g.add(walls);
if(roof){const r=new THREE.Mesh(new THREE.ConeGeometry(Math.max(w,d)*.79,2,4),new THREE.MeshStandardMaterial({color:0x4d4037,roughness:1}));r.position.y=h+1;r.rotation.y=Math.PI/4;g.add(r)}
g.position.set(x,0,z);scene.add(g);colliders.push({x,z,w,d});return g}
addGeometry(-15,-35,13,11,5,0x777468,true);addGeometry(15,-30,11,8,5,0x65594c,true);addGeometry(-28,-55,8,12,4,0x797063,true);
function tree(x,z,s){const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.25*s,.4*s,3*s,7),new THREE.MeshStandardMaterial({color:0x594537}));trunk.position.set(x,1.5*s,z);trunk.castShadow=true;scene.add(trunk);const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(2.2*s,1),new THREE.MeshStandardMaterial({color:0x29432e,roughness:1}));crown.position.set(x,4.1*s,z);crown.castShadow=true;scene.add(crown)}
for(let i=0;i<110;i++){let x=Math.sin(i*51.37)*72,z=Math.cos(i*28.77)*78;if(Math.abs(x)<8||Math.abs(x+15)<12&&Math.abs(z+35)<14||Math.abs(x-15)<11&&Math.abs(z+30)<11)continue;tree(x,z,.7+(i%5)*.12)}
function item(x,z,name){let m=new THREE.Mesh(new THREE.DodecahedronGeometry(.55),new THREE.MeshStandardMaterial({color:0xc3a765,roughness:.7}));m.position.set(x,.6,z);m.castShadow=true;scene.add(m);loot.push({mesh:m,name,used:false})}
item(6,18,'Eau potable');item(-7,2,'Conserves');item(-9,-27,'Trousse de secours');item(17,-22,'Batterie du pick-up');
// Prototype systems: actionable refuge, survivor NPC, hostile patrol and salvageable pickup.
// Vehicle meshes below remain temporary until a licensed GLB asset is added.
const worldActors=[],playerInventory=new Set(),refuge={secured:false,doorOpen:false},pickup={repaired:false,fuel:0,battery:false,driving:false};
const refugePoint=new THREE.Vector3(-15,0,-35);
function createVehicle(){
 const g=new THREE.Group(); const body=new THREE.Mesh(new THREE.BoxGeometry(2.5,.95,4.7),new THREE.MeshStandardMaterial({color:0x536456,metalness:.4,roughness:.7}));
 body.position.y=1.15;g.add(body);
 const cab=new THREE.Mesh(new THREE.BoxGeometry(2.25,1.1,2),new THREE.MeshStandardMaterial({color:0x424c47,roughness:.52}));cab.position.set(0,1.95,-.7);g.add(cab);
 for(const x of [-1.4,1.4])for(const z of [-1.45,1.55]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.52,.52,.3,14),new THREE.MeshStandardMaterial({color:0x202021}));wheel.rotation.z=Math.PI/2;wheel.position.set(x,.66,z);g.add(wheel)}
 g.position.set(21,0,-13);scene.add(g);pickup.mesh=g;return g;
}
createVehicle();
function addActor(name,x,z,hostile=false){
 const actor={name,position:new THREE.Vector3(x,0,z),hostile,trust:hostile?0:30,state:hostile?'patrol':'idle',health:100,mesh:null,mixer:null,phase:Math.random()*6.28};
 worldActors.push(actor);
 // Load a real rigged human model independently rather than representing people by cubes.
 loader.load('https://threejs.org/examples/models/gltf/Soldier.glb',g=>{
  actor.mesh=g.scene;actor.mesh.position.copy(actor.position);scene.add(actor.mesh);
  actor.mesh.traverse(o=>{if(o.isMesh)o.castShadow=true});
  if(g.animations.length){actor.mixer=new THREE.AnimationMixer(actor.mesh);const clip=g.animations.find(a=>a.name==='Idle')||g.animations[0];actor.mixer.clipAction(clip).play()}
 },undefined,e=>console.warn('PNJ 3D non chargé',name,e));
 return actor;
}
addActor('Mara — survivante',-19,-22);
addActor('Pillard',30,-27,true);
item(24,-7,'Bidon de carburant');
item(5,-28,'Outils');
function updateObjective(){
 if(!refuge.secured) objective.textContent='Le Refuge : sécuriser la ferme [E]';
 else if(!pickup.repaired) objective.textContent='Réparer le pick-up : batterie, outils et carburant';
 else objective.textContent='Refuge sécurisé · Pick-up réparé · Explorer et survivre';
}
function saveProgress(){
 const data={position:position.toArray(),water,food,health,supplies,mission,inventory:[...playerInventory],refuge,pickup:{repaired:pickup.repaired,fuel:pickup.fuel,battery:pickup.battery},loot:loot.map(o=>o.used)};
 try{localStorage.setItem('warlike_no_mans_dawn_v01',JSON.stringify(data));message('Progression sauvegardée')}catch(e){message('Sauvegarde indisponible')}
}
function loadProgress(){
 try{
  const v=JSON.parse(localStorage.getItem('warlike_no_mans_dawn_v01')||'null');if(!v)return;
  if(Array.isArray(v.position)&&v.position.length===3)position.fromArray(v.position);pickup.driving=false;water=v.water;food=v.food;health=v.health;supplies=v.supplies;mission=v.mission;
  for(const k of v.inventory||[])playerInventory.add(k);
  Object.assign(refuge,v.refuge||{});Object.assign(pickup,v.pickup||{});pickup.driving=false;
  (v.loot||[]).forEach((used,i)=>{if(used&&loot[i]){loot[i].used=true;scene.remove(loot[i].mesh)}});
  updateObjective();
 }catch(e){console.warn('Sauvegarde ignorée',e)}
}
function updateActors(dt){
 for(const actor of worldActors){
  if(actor.health<=0)continue;
  const distance=actor.position.distanceTo(position);
  if(actor.hostile){
   // Patrol and pursuit only; combat is deliberately not simulated as finished.
   if(distance<14)actor.state='alert';
   else if(distance>24)actor.state='patrol';
   const target=actor.state==='alert'?position:new THREE.Vector3(30+Math.sin(performance.now()*.00025+actor.phase)*8,0,-27+Math.cos(performance.now()*.00025+actor.phase)*8);
   const diff=target.clone().sub(actor.position);diff.y=0;
   if(diff.length()>2){diff.normalize();const next=actor.position.clone().addScaledVector(diff,dt*(actor.state==='alert'?2:1));if(!blocked(next.x,next.z))actor.position.copy(next)}
  }else if(actor.state==='follow'&&distance>3){
   const dir=position.clone().sub(actor.position).setY(0).normalize(),next=actor.position.clone().addScaledVector(dir,dt*2.2);
   if(!blocked(next.x,next.z))actor.position.copy(next);
  }
  if(actor.mesh){actor.mesh.position.copy(actor.position);if(actor.mixer)actor.mixer.update(dt)}
 }
}
function loadCharacter(){return new Promise(resolve=>loader.load('https://threejs.org/examples/models/gltf/Soldier.glb',g=>{player=g.scene;player.scale.setScalar(1);player.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});scene.add(player);mixer=new THREE.AnimationMixer(player);for(const c of g.animations)actions[c.name]=mixer.clipAction(c);setAction(actions.Idle?'Idle':Object.keys(actions)[0]);resolve()},undefined,err=>{document.getElementById('loading').textContent='Modèle 3D indisponible — vérifier connexion / CDN';console.error(err);resolve() }))}
function setAction(name){if(active===name||!actions[name])return;const next=actions[name];next.reset().fadeIn(.18).play();if(actions[active])actions[active].fadeOut(.18);active=name}
function blocked(x,z){return colliders.some(o=>Math.abs(x-o.x)<o.w/2+.4&&Math.abs(z-o.z)<o.d/2+.4)}
function interact(){const nearest=loot.filter(o=>!o.used&&o.mesh.position.distanceTo(position)<2.6).sort((a,b)=>a.mesh.position.distanceTo(position)-b.mesh.position.distanceTo(position))[0];
if(nearest){nearest.used=true;scene.remove(nearest.mesh);playerInventory.add(nearest.name);supplies++;water=Math.min(100,water+(nearest.name==='Eau potable'?25:0));food=Math.min(100,food+(nearest.name==='Conserves'?25:0));message('Récupéré : '+nearest.name);return}
const nearbyActor=worldActors.find(a=>!a.hostile&&a.position.distanceTo(position)<3.3);
if(nearbyActor){nearbyActor.trust=Math.min(100,nearbyActor.trust+10);nearbyActor.state=nearbyActor.state==='follow'?'idle':'follow';message(nearbyActor.name+' : '+(nearbyActor.state==='follow'?'vous accompagne':'reste ici')+' · confiance '+nearbyActor.trust);return}
if(pickup.mesh.position.distanceTo(position)<5){
 if(!pickup.repaired){
   const parts=['Batterie du pick-up','Bidon de carburant','Outils'];
   if(parts.every(k=>playerInventory.has(k))){pickup.repaired=true;pickup.fuel=70;pickup.battery=true;for(const k of parts)playerInventory.delete(k);message('Pick-up réparé. Appuyez sur E pour conduire.');updateObjective()}
   else message('Pick-up : pièces manquantes — '+parts.filter(k=>!playerInventory.has(k)).join(', '));
 }else{pickup.driving=!pickup.driving;if(!pickup.driving)position.copy(pickup.mesh.position).add(new THREE.Vector3(3,0,0));else position.copy(pickup.mesh.position);message(pickup.driving?'Au volant : ZQSD pour conduire, E pour descendre':'Véhicule stationné')}
 return;
}
if(position.distanceTo(refugePoint)<13){
 if(!refuge.secured){if(supplies>=2){refuge.secured=true;supplies-=2;mission=Math.max(mission,1);message('Refuge sécurisé : entrée barricadée.');updateObjective()}else message('Il faut 2 fournitures pour sécuriser le refuge')}
 else{refuge.doorOpen=!refuge.doorOpen;message(refuge.doorOpen?'Entrée du refuge ouverte':'Entrée du refuge refermée')}
 return;
}
message('Aucun objet à portée')}
window.addEventListener('keydown',e=>{keys.add(e.code);if(e.code==='KeyE')interact();if(e.code==='KeyP')saveProgress();if(e.code==='Escape')document.exitPointerLock?.()});window.addEventListener('keyup',e=>keys.delete(e.code));
canvas.addEventListener('click',()=>canvas.requestPointerLock());window.addEventListener('mousemove',e=>{if(document.pointerLockElement!==canvas)return;yaw-=e.movementX*.0026;pitch=THREE.MathUtils.clamp(pitch-e.movementY*.002,-.25,1.0)});
window.addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()});
function frame(){requestAnimationFrame(frame);const dt=Math.min(.05,clock.getDelta());if(player){const f=Number(keys.has('KeyW')||keys.has('KeyZ')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'));const r=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('KeyQ')||keys.has('ArrowLeft'));const dir=new THREE.Vector3(r,0,-f);const moving=dir.lengthSq()>0;if(moving){dir.normalize().applyAxisAngle(new THREE.Vector3(0,1,0),yaw);const sprint=keys.has('ShiftLeft');const speed=pickup.driving?12:sprint?6.3:3.3;const p=position.clone().addScaledVector(dir,speed*dt);if((pickup.driving||!blocked(p.x,position.z)))position.x=p.x;if((pickup.driving||!blocked(position.x,p.z)))position.z=p.z;player.rotation.y=Math.atan2(dir.x,dir.z);setAction(sprint&&actions.Run?'Run':actions.Walk?'Walk':'Idle');water=Math.max(0,water-dt*(sprint?.25:.08));food=Math.max(0,food-dt*.035)}else setAction('Idle');player.visible=!pickup.driving;player.position.copy(position);if(pickup.driving){pickup.mesh.position.copy(position);pickup.mesh.rotation.y=player.rotation.y;}else if(pickup.repaired&&pickup.mesh.position.distanceTo(position)<2.8){/* park vehicle on exit */}if(mixer)mixer.update(dt);updateActors(dt);
const aim=position.clone().add(new THREE.Vector3(0,1.7,0));const offset=new THREE.Vector3(Math.sin(yaw)*6*Math.cos(pitch),2.3+Math.sin(pitch)*6,Math.cos(yaw)*6*Math.cos(pitch));camera.position.lerp(aim.clone().add(offset),Math.min(1,dt*8));camera.lookAt(aim);
if(mission===1&&supplies>=3&&!pickup.repaired){message('Récolte suffisante. Réparez le pick-up.');mission=2}
document.getElementById('stats').textContent='SANTÉ '+health+'%  •  EAU '+Math.round(water)+'%  •  NOURRITURE '+Math.round(food)+'%  •  FOURNITURES '+supplies+'  •  [E] interaction  [P] sauvegarder';
if(performance.now()>noticeUntil)notice.style.display='none';}
renderer.render(scene,camera)}
renderer.setSize(innerWidth,innerHeight);loadProgress();updateObjective();loadCharacter().then(()=>{if(player)document.getElementById('loading').classList.add('hidden');frame()});
