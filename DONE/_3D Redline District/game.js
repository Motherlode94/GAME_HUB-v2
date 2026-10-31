import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
const $=id=>document.getElementById(id);
const canvas=$('game'),renderer=new THREE.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.shadowMap.enabled=true;renderer.outputColorSpace=THREE.SRGBColorSpace;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x869baa);scene.fog=new THREE.Fog(0x869baa,85,275);
const camera=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,.1,550);
scene.add(new THREE.HemisphereLight(0xd9edff,0x405136,2.2));const light=new THREE.DirectionalLight(0xffe6c6,2.8);light.position.set(20,55,-25);light.castShadow=true;light.shadow.mapSize.set(2048,2048);light.shadow.camera.left=-95;light.shadow.camera.right=95;light.shadow.camera.top=95;light.shadow.camera.bottom=-95;scene.add(light);
const mat=(color,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness:.68,metalness});
const grass=new THREE.Mesh(new THREE.PlaneGeometry(350,350),mat(0x43573f));grass.rotation.x=-Math.PI/2;grass.receiveShadow=true;scene.add(grass);
const checkpoints=[];const rx=55,rz=35,N=64;
const points=Array.from({length:N},(_,i)=>{const a=2*Math.PI*i/N;return new THREE.Vector3(rx*Math.sin(a),0,rz*Math.cos(a))});
const segment=(a,b,width,color)=>{let d=b.clone().sub(a),m=new THREE.Mesh(new THREE.BoxGeometry(width,.09,d.length()),mat(color));m.position.copy(a).add(b).multiplyScalar(.5);m.position.y=.05;m.rotation.y=Math.atan2(d.x,d.z);m.receiveShadow=true;scene.add(m)};
for(let i=0;i<N;i++){const a=points[i],b=points[(i+1)%N];segment(a,b,13,0x31343b);if(i%2===0){const out=a.clone().multiplyScalar(1.125),inn=a.clone().multiplyScalar(.875);segment(a.clone().add(out).multiplyScalar(.5),b.clone().add(points[(i+1)%N].clone().multiplyScalar(1.125)).multiplyScalar(.5),.36,0xe5e2d7)}if(i%8===0)checkpoints.push(a.clone())}
for(let i=0;i<70;i++){let x=Math.sin(i*83.22)*150,z=Math.cos(i*31.5)*149;if(Math.abs(x)<75&&Math.abs(z)<54)continue;const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.25,.4,3,6),mat(0x554435));trunk.position.set(x,1.5,z);scene.add(trunk);const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(2.7,1),mat(0x2d4b35));crown.position.set(x,4,z);scene.add(crown)}
function carModel(color){const group=new THREE.Group(),body=new THREE.Mesh(new THREE.BoxGeometry(2.3,.65,4.35),mat(color,.35));body.position.y=.85;body.castShadow=true;group.add(body);const glass=new THREE.Mesh(new THREE.BoxGeometry(1.92,.67,1.95),mat(0x1e2d3b,.1));glass.position.set(0,1.49,-.25);group.add(glass);for(let x of [-1.22,1.22])for(let z of [-1.45,1.45]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.48,.48,.34,18),mat(0x16191a));wheel.rotation.z=Math.PI/2;wheel.position.set(x,.49,z);group.add(wheel)}scene.add(group);return group}
const specs=[{color:0xed5149,max:49,acc:23,grip:1.9},{color:0x3e87d0,max:59,acc:26,grip:1.65},{color:0xd0a13e,max:46,acc:24,grip:2.3}];
let car=carModel(specs[0].color),chosen=specs[0],raceOn=false,mode='race',speed=0,angle=0,elapsed=0,lap=1,nextCP=1,best=Infinity,lapStart=0,finished=false,steerAngle=0,damage=0,sideVelocity=0;
const keys=new Set(),clock=new THREE.Clock(),AI=[];
function spawnGrid(){car.position.copy(points[0]);car.position.y=0;angle=0;car.rotation.y=angle;speed=0;damage=0;sideVelocity=0;steerAngle=0;elapsed=0;lap=1;nextCP=1;lapStart=0;best=Infinity;finished=false;AI.forEach(a=>{scene.remove(a.mesh)});AI.length=0;
if(mode==='race')for(let i=0;i<5;i++){const m=carModel([0xe6dcbd,0x4fb8b8,0xe07153,0x99bd49,0xb3a3d2][i]);AI.push({mesh:m,progress:((1-i*.018)%1+1)%1,rate:.067+i*.002,damage:0,lane:(i%2===0?1:-1)*2.25})}}
function finish(){finished=true;raceOn=false;const time=elapsed.toFixed(2),bestT=Number.isFinite(best)?best.toFixed(2):time;const key='redline_first_ignition_'+mode;let record=0;try{record=Number(localStorage.getItem(key)||0);if(!record||elapsed<record){localStorage.setItem(key,String(elapsed));record=elapsed}}catch(e){record=record||elapsed}$('resultTitle').textContent='COURSE TERMINÉE';$('resultText').textContent='Temps : '+time+' s · Meilleur tour : '+bestT+' s · Record local : '+record.toFixed(2)+' s';$('result').hidden=false;$('hud').hidden=true}
function begin(){chosen=specs[Number($('car').value)];mode=$('mode').value;car.children[0].material.color.setHex(chosen.color);spawnGrid();$('menu').hidden=true;$('result').hidden=true;$('hud').hidden=false;raceOn=true}
$('start').onclick=begin;$('restart').onclick=()=>{raceOn=false;$('result').hidden=true;$('hud').hidden=true;$('menu').hidden=false};
window.addEventListener('keydown',e=>{keys.add(e.code);if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();if(e.code==='Escape'&&raceOn){raceOn=false;$('menu').hidden=false;$('hud').hidden=true}if(e.code==='KeyR'&&raceOn){const last=(nextCP-1+checkpoints.length)%checkpoints.length;car.position.copy(checkpoints[last]);const theta=last/checkpoints.length*Math.PI*2;angle=Math.atan2(rx*Math.cos(theta),-rz*Math.sin(theta));car.rotation.y=angle;speed=0;sideVelocity=0;damage=Math.min(100,damage+2)}});window.addEventListener('keyup',e=>keys.delete(e.code));
const dir=()=>Number(keys.has('KeyW')||keys.has('KeyZ')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'));
function update(dt){
 elapsed+=dt;
 const throttle=dir(),inputSteer=Number(keys.has('KeyA')||keys.has('KeyQ')||keys.has('ArrowLeft'))-Number(keys.has('KeyD')||keys.has('ArrowRight'));
 const handbrake=keys.has('Space');
 const radial=Math.hypot(car.position.x/rx,car.position.z/rz);
 const offroad=radial<.80||radial>1.22;
 // Throttle, drag, rolling resistance and component degradation.
 const engineFactor=1-damage*.006;
 const acceleration=throttle>=0?chosen.acc:chosen.acc*.72;
 speed+=throttle*acceleration*engineFactor*dt;
 speed-=speed*(offroad?.78:.13)*dt;
 if(!throttle)speed-=Math.sign(speed)*Math.min(Math.abs(speed),3.6*dt);
 const limit=chosen.max*(offroad?.52:1)*(1-damage*.0035);
 speed=THREE.MathUtils.clamp(speed,-12,Math.max(13,limit));
 const targetSteer=inputSteer*(handbrake?1.12:1);
 steerAngle=THREE.MathUtils.damp(steerAngle,targetSteer,8,dt);
 // Bicycle-like steering scaled down at speed; offroad reduces directional grip.
 const steerResponse=chosen.grip*(offroad?.68:1);
 const yawRate=steerAngle*Math.min(Math.abs(speed)/11,1)*steerResponse*(1/(1+Math.abs(speed)*.014));
 angle+=yawRate*dt*Math.sign(speed||1);
 // Lateral momentum for progressive oversteer, stronger with handbrake.
 const lateralForce=yawRate*speed*(handbrake?.22:.075);
 sideVelocity+=(lateralForce-sideVelocity*(handbrake?1.7:offroad?3:7))*dt;
 if(handbrake)speed*=Math.max(0,1-.55*dt);
 const oldPos=car.position.clone();
 car.position.x+=(Math.sin(angle)*speed+Math.cos(angle)*sideVelocity)*dt;
 car.position.z+=(Math.cos(angle)*speed-Math.sin(angle)*sideVelocity)*dt;
 car.rotation.y=angle;
 // Physical contact with the other cars: bounce, velocity loss and persistent damage.
 for(const a of AI){
  const dx=car.position.x-a.mesh.position.x,dz=car.position.z-a.mesh.position.z;
  const dist=Math.hypot(dx,dz);
  if(dist<3.2&&dist>.001){
   const overlap=3.2-dist;car.position.x+=dx/dist*overlap*.65;car.position.z+=dz/dist*overlap*.65;
   a.mesh.position.x-=dx/dist*overlap*.35;a.mesh.position.z-=dz/dist*overlap*.35;
   if(Math.abs(speed)>4){damage=Math.min(100,damage+Math.abs(speed)*.12);speed*=.55}
  }
 }
 // Track boundaries and recovery: no infinite free driving beyond the scenery.
 if(Math.abs(car.position.x)>166||Math.abs(car.position.z)>166){
  car.position.copy(oldPos);speed*=-.22;damage=Math.min(100,damage+3);
 }
 const cp=checkpoints[nextCP];
 if(car.position.distanceTo(cp)<10){
  if(nextCP===0){best=Math.min(best,elapsed-lapStart);lapStart=elapsed;lap++;nextCP=1;if(lap>3)finish()}
  else nextCP=(nextCP+1)%checkpoints.length;
 }
 for(const a of AI){
  // Each opponent has its own lane, speed variation and race progression.
  const variation=1+Math.sin(elapsed*.33+a.lane)*.055;
  a.progress=(a.progress+a.rate*variation*dt)%1;
  const theta=a.progress*Math.PI*2,nextTheta=theta+.002;
  const lane=a.lane;
  const p=new THREE.Vector3((rx+lane)*Math.sin(theta),0,(rz+lane)*Math.cos(theta));
  a.mesh.position.copy(p);
  a.mesh.rotation.y=Math.atan2((rx+lane)*(Math.sin(nextTheta)-Math.sin(theta)),(rz+lane)*(Math.cos(nextTheta)-Math.cos(theta)));
 }
 $('race').textContent='TOUR '+Math.min(lap,3)+'/3 · '+elapsed.toFixed(1)+' s · CP '+(nextCP+1)+'/'+checkpoints.length+' · DÉGÂTS '+Math.round(damage)+'%'+(offroad?' · HORS PISTE':'');
 $('speed').innerHTML=Math.round(Math.abs(speed)*3.6)+' <small>km/h</small>';
}
function frame(){requestAnimationFrame(frame);const dt=Math.min(clock.getDelta(),.05);if(raceOn)update(dt);const offset=new THREE.Vector3(-Math.sin(angle)*12,7,-Math.cos(angle)*12);camera.position.lerp(car.position.clone().add(offset),Math.min(1,dt*5));camera.lookAt(car.position.x,1,car.position.z);renderer.render(scene,camera)}
function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()}window.addEventListener('resize',resize);resize();spawnGrid();frame();
