import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
import {GLTFLoader} from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/loaders/GLTFLoader.js';
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
function loadCharacter(){return new Promise(resolve=>loader.load('https://threejs.org/examples/models/gltf/Soldier.glb',g=>{player=g.scene;player.scale.setScalar(1);player.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});scene.add(player);mixer=new THREE.AnimationMixer(player);for(const c of g.animations)actions[c.name]=mixer.clipAction(c);setAction(actions.Idle?'Idle':Object.keys(actions)[0]);resolve()},undefined,err=>{document.getElementById('loading').textContent='Modèle 3D indisponible — vérifier connexion / CDN';console.error(err);resolve() }))}
function setAction(name){if(active===name||!actions[name])return;const next=actions[name];next.reset().fadeIn(.18).play();if(actions[active])actions[active].fadeOut(.18);active=name}
function blocked(x,z){return colliders.some(o=>Math.abs(x-o.x)<o.w/2+.4&&Math.abs(z-o.z)<o.d/2+.4)}
function interact(){const nearest=loot.filter(o=>!o.used&&o.mesh.position.distanceTo(position)<2.6).sort((a,b)=>a.mesh.position.distanceTo(position)-b.mesh.position.distanceTo(position))[0];
if(nearest){nearest.used=true;scene.remove(nearest.mesh);supplies++;water=Math.min(100,water+(nearest.name==='Eau potable'?25:0));food=Math.min(100,food+(nearest.name==='Conserves'?25:0));message('Récupéré : '+nearest.name);return}
if(position.distanceTo(new THREE.Vector3(-15,0,-35))<13){mission=1;objective.textContent='Refuge découvert · Trouver 3 fournitures';message('Refuge repéré. Fouillez les environs.');}
else message('Aucun objet à portée')}
window.addEventListener('keydown',e=>{keys.add(e.code);if(e.code==='KeyE')interact();if(e.code==='Escape')document.exitPointerLock?.()});window.addEventListener('keyup',e=>keys.delete(e.code));
canvas.addEventListener('click',()=>canvas.requestPointerLock());window.addEventListener('mousemove',e=>{if(document.pointerLockElement!==canvas)return;yaw-=e.movementX*.0026;pitch=THREE.MathUtils.clamp(pitch-e.movementY*.002,-.25,1.0)});
window.addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()});
function frame(){requestAnimationFrame(frame);const dt=Math.min(.05,clock.getDelta());if(player){const f=Number(keys.has('KeyW')||keys.has('KeyZ')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'));const r=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('KeyQ')||keys.has('ArrowLeft'));const dir=new THREE.Vector3(r,0,-f);const moving=dir.lengthSq()>0;if(moving){dir.normalize().applyAxisAngle(new THREE.Vector3(0,1,0),yaw);const sprint=keys.has('ShiftLeft');const speed=sprint?6.3:3.3;const p=position.clone().addScaledVector(dir,speed*dt);if(!blocked(p.x,position.z))position.x=p.x;if(!blocked(position.x,p.z))position.z=p.z;player.rotation.y=Math.atan2(dir.x,dir.z);setAction(sprint&&actions.Run?'Run':actions.Walk?'Walk':'Idle');water=Math.max(0,water-dt*(sprint?.25:.08));food=Math.max(0,food-dt*.035)}else setAction('Idle');player.position.copy(position);if(mixer)mixer.update(dt);
const aim=position.clone().add(new THREE.Vector3(0,1.7,0));const offset=new THREE.Vector3(Math.sin(yaw)*6*Math.cos(pitch),2.3+Math.sin(pitch)*6,Math.cos(yaw)*6*Math.cos(pitch));camera.position.lerp(aim.clone().add(offset),Math.min(1,dt*8));camera.lookAt(aim);
if(mission===1&&supplies>=3){mission=2;objective.textContent='Mission accomplie : Le Refuge · 3 fournitures';message('Le refuge peut désormais être approvisionné.')}
document.getElementById('stats').textContent='SANTÉ '+health+'%  •  EAU '+Math.round(water)+'%  •  NOURRITURE '+Math.round(food)+'%  •  FOURNITURES '+supplies+'/3';
if(performance.now()>noticeUntil)notice.style.display='none';}
renderer.render(scene,camera)}
renderer.setSize(innerWidth,innerHeight);loadCharacter().then(()=>{if(player)document.getElementById('loading').classList.add('hidden');frame()});
