import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
const $=id=>document.getElementById(id),canvas=$('game'),renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.shadowMap.enabled=true;renderer.outputColorSpace=THREE.SRGBColorSpace;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x070d10);scene.fog=new THREE.FogExp2(0x080e13,.029);
const camera=new THREE.PerspectiveCamera(72,innerWidth/innerHeight,.08,200);
scene.add(new THREE.HemisphereLight(0x677785,0x171a1a,.55));const bulb=new THREE.PointLight(0xffc18e,25,19,2);bulb.position.set(0,3.2,-9);scene.add(bulb);const exitLight=new THREE.PointLight(0x76c29f,8,11);exitLight.position.set(0,2,-27);scene.add(exitLight);
const material=(c)=>new THREE.MeshStandardMaterial({color:c,roughness:.88});
function mesh(w,h,d,x,y,z,c){let o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material(c));o.position.set(x,y,z);o.receiveShadow=true;o.castShadow=true;scene.add(o);return o}
const colliders=[];function wall(x,z,w,d,h=3.7,c=0x323c3d){mesh(w,h,d,x,h/2,z,c);colliders.push({x,z,w,d})}
mesh(36,.2,54,0,-.15,-8,0x343c3b);mesh(36,.2,54,0,3.85,-8,0x1e282c);
wall(-18,-8,.6,54);wall(18,-8,.6,54);wall(0,-35,36,.6);wall(0,19,36,.6);
wall(-8,-2,.65,28);wall(8,-16,.65,28);wall(-13,-17,10,.6);wall(13,-23,10,.6);
wall(-4,-12,8,.6);wall(4,2,8,.6);wall(-12,9,12,.6);
for(let i=0;i<15;i++){const x=(i%3-1)*4,z=12-Math.floor(i/3)*6;if(Math.abs(x)<2)continue;mesh(1.5,1.7,1.1,x,.85,z,0x4b4b44)}
const door=mesh(2.5,3,.28,4,1.5,-12,0x655947),fuseBox=mesh(.85,1,.25,-7.55,1.55,-7,0x708274),consoleBox=mesh(1.6,1.1,.6,2,1,-21,0x515b56),exit=mesh(3,3,.3,0,1.5,-34.4,0x305147);
const interactables=[{mesh:fuseBox,name:'Tableau électrique',use:()=>{if(power)return say('Le courant fonctionne déjà.');power=true;bulb.intensity=36;say('Courant rétabli. Une fréquence est inscrite derrière le tableau : 97.3 MHz.');updateObjective()}},{mesh:consoleBox,name:'Console radio',use:()=>{if(!power)return say('La console est hors tension.');toggleRadio(true)}},{mesh:door,name:'Porte verrouillée',use:()=>{if(!unlocked)return say('Porte verrouillée. Cherchez la bonne fréquence.');door.visible=false;doorBlocked=false;say('La porte s’ouvre.') }},{mesh:exit,name:'Sortie',use:()=>{if(!unlocked)return say('Vous devez d’abord décrypter la transmission.');won=true;playing=false;document.exitPointerLock?.();$('screen').hidden=false;$('screen').querySelector('h1').innerHTML='SIGNAL <em>PERDU</em>';$('screen').querySelector('p').textContent='Vous avez quitté H-17. Mais la voix connaît désormais votre nom.';$('play').textContent='RECOMMENCER';$('play').onclick=()=>location.reload()}}];
let playing=false,radioOpen=false,power=false,unlocked=false,won=false,doorBlocked=true,flashlight=true,exposure=0,messageUntil=0,yaw=0,pitch=0,px=0,pz=15,frequency=880;
const keys=new Set(),clock=new THREE.Clock(),presence=mesh(.6,2.5,.45,11,1.25,-26,0x0c1013);
presence.material.emissive=new THREE.Color(0x260b12);const lamp=new THREE.SpotLight(0xe1e6cc,45,22,Math.PI/8,.4,1);camera.add(lamp,lamp.target);lamp.position.set(0,-.15,0);lamp.target.position.set(0,0,-5);scene.add(camera);
function say(t){$('message').textContent=t;$('message').style.display='block';messageUntil=performance.now()+4300}
function updateObjective(){$('objective').textContent=!power?'OBJECTIF : rétablir l’électricité (tableau du couloir gauche)':!unlocked?'OBJECTIF : régler la radio sur la fréquence indiquée':'OBJECTIF : ouvrir la porte et rejoindre la sortie'}
function toggleRadio(force){radioOpen=typeof force==='boolean'?force:!radioOpen;$('radio').hidden=!radioOpen;if(radioOpen)document.exitPointerLock?.();else if(playing)canvas.requestPointerLock?.()}
function checkFrequency(){frequency=Number($('tuning').value);$('freq').textContent=(frequency/10).toFixed(1)+' MHz';const right=frequency===973;$('radioText').textContent=!power?'Le récepteur manque de courant.':right?'« LA PORTE EST OUVERTE. NE REGARDEZ PAS DERRIÈRE VOUS. »':'— grésillement et voix incompréhensibles —';if(right&&power&&!unlocked){unlocked=true;exposure+=22;say('Transmission interceptée. La porte du fond est déverrouillée.');updateObjective()}}
$('tuning').addEventListener('input',checkFrequency);$('closeRadio').onclick=()=>toggleRadio(false);
function blocked(x,z){if(Math.abs(x)>17.3||z>18.3||z< -34.3)return true;return colliders.some(c=>Math.abs(x-c.x)<c.w/2+.36&&Math.abs(z-c.z)<c.d/2+.36)||(doorBlocked&&Math.abs(x-4)<1.5&&Math.abs(z+12)<.65)}
function interact(){if(radioOpen)return;let nearest=interactables.filter(v=>v.mesh.visible).map(v=>({item:v,dist:camera.position.distanceTo(v.mesh.position)})).sort((a,b)=>a.dist-b.dist)[0];if(nearest&&nearest.dist<3.5)nearest.item.use();else say('Rien à portée.')}
window.addEventListener('keydown',e=>{keys.add(e.code);if(!playing)return;if(e.code==='KeyE')interact();if(e.code==='KeyF')flashlight=!flashlight;if(e.code==='KeyR')toggleRadio();if(e.code==='Escape'&&radioOpen)toggleRadio(false)});
window.addEventListener('keyup',e=>keys.delete(e.code));canvas.addEventListener('click',()=>{if(playing&&!radioOpen)canvas.requestPointerLock?.()});window.addEventListener('mousemove',e=>{if(document.pointerLockElement!==canvas||radioOpen)return;yaw-=e.movementX*.0021;pitch=THREE.MathUtils.clamp(pitch-e.movementY*.0021,-1.25,1.25)});
$('play').onclick=()=>{playing=true;$('screen').hidden=true;canvas.requestPointerLock?.();updateObjective()};
window.addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()});
function tick(dt){if(playing&&!radioOpen){let forward=Number(keys.has('KeyW')||keys.has('KeyZ'))-Number(keys.has('KeyS')),side=Number(keys.has('KeyD'))-Number(keys.has('KeyA')||keys.has('KeyQ'));const v=new THREE.Vector3(side,0,-forward);if(v.lengthSq()){v.normalize().applyAxisAngle(new THREE.Vector3(0,1,0),yaw);let speed=keys.has('ShiftLeft')?4.4:2.55;let nx=px+v.x*speed*dt,nz=pz+v.z*speed*dt;if(!blocked(nx,pz))px=nx;if(!blocked(px,nz))pz=nz}exposure=Math.max(0,exposure-dt*.7);if(unlocked)exposure=Math.min(100,exposure+dt*.8)}
camera.position.set(px,1.65,pz);camera.rotation.set(pitch,yaw,0,'YXZ');lamp.visible=flashlight;
if(unlocked&&playing){const distance=Math.hypot(px-presence.position.x,pz-presence.position.z);const v=new THREE.Vector3(px-presence.position.x,0,pz-presence.position.z);if(distance<15&&distance>1.6){presence.position.addScaledVector(v.normalize(),dt*.62)}if(distance<2.2){exposure=Math.min(100,exposure+dt*22);if(exposure>=100){say('Le signal vous a trouvé. Retour à la station.');px=0;pz=15;exposure=25;presence.position.set(11,1.25,-26)}}}presence.visible=unlocked;
bulb.intensity=power?33+Math.sin(performance.now()*.013)*2.5:0;exitLight.intensity=unlocked?14:1;
$('status').textContent='EXPOSITION '+Math.round(exposure)+'% · LAMPE '+(flashlight?'ON':'OFF')+' · RADIO '+(frequency/10).toFixed(1)+' MHz';if(performance.now()>messageUntil)$('message').style.display='none';
renderer.render(scene,camera)}
renderer.setSize(innerWidth,innerHeight);updateObjective();function loop(){requestAnimationFrame(loop);tick(Math.min(clock.getDelta(),.06))}loop();
