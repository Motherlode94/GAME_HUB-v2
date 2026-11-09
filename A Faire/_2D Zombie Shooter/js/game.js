// WarLike Zombie Survival — complete five-wave extraction campaign.
(()=>{
'use strict';
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d'),W=900,H=500;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),rand=(a,b)=>a+Math.random()*(b-a);
const weapons=[
 {name:'Pistolet',rate:.29,damage:2,speed:750,pellets:1,spread:0,mag:12,reload:1.1,color:'#d5e1f5'},
 {name:'Fusil à pompe',rate:.85,damage:2,speed:580,pellets:7,spread:.3,mag:6,reload:1.8,color:'#f1b87b'},
 {name:'Automatique',rate:.11,damage:1,speed:760,pellets:1,spread:.11,mag:30,reload:2.15,color:'#86d7b4'},
 {name:'Précision',rate:1.0,damage:8,speed:1050,pellets:1,spread:0,mag:5,reload:2.4,color:'#edc17e'}
];
const cover=[{x:160,y:115,w:110,h:46},{x:595,y:315,w:128,h:48},{x:380,y:220,w:48,h:58},{x:735,y:95,w:65,h:38}];
const keys=new Set();let mouse={x:W*.65,y:H*.5},firing=false,state,previous=performance.now(),audio;
const spawn=(x,y,type)=>({x,y,type,life:24,r:12});
function message(text,seconds=2){state.notice=text;state.noticeUntil=performance.now()+1000*seconds}
function sound(freq=160,duration=.09,gain=.035){try{audio??=new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();const osc=audio.createOscillator(),amp=audio.createGain();osc.type='triangle';osc.frequency.setValueAtTime(freq,audio.currentTime);osc.frequency.exponentialRampToValueAtTime(Math.max(42,freq*.61),audio.currentTime+duration);amp.gain.setValueAtTime(gain,audio.currentTime);amp.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+duration);osc.connect(amp);amp.connect(audio.destination);osc.start();osc.stop(audio.currentTime+duration)}catch{}}
function fresh(){return {playing:true,paused:false,ended:false,won:false,player:{x:W/2,y:H/2,r:13,hp:100,invulnerable:0,stamina:100},weapon:0,ammo:weapons.map(w=>w.mag),reserve:[48,24,150,15],reload:0,shootCooldown:0,bullets:[],enemies:[],pickups:[],particles:[],score:0,wave:1,spawnRemaining:7,spawnClock:1,intermission:2,notice:'',noticeUntil:0,shake:0,kills:0,time:0}}
let initial=false;
function wall(x,y,r){return cover.some(o=>x+r>o.x&&x-r<o.x+o.w&&y+r>o.y&&y-r<o.y+o.h)}
function move(entity,dx,dy){if(!wall(entity.x+dx,entity.y,entity.r))entity.x+=dx;if(!wall(entity.x,entity.y+dy,entity.r))entity.y+=dy}
function switchWeapon(i){if(i<0||i>=weapons.length)return;state.weapon=i;state.reload=0;message(weapons[i].name,1)}
function reload(){const w=weapons[state.weapon];if(state.reload>0||state.ammo[state.weapon]>=w.mag||state.reserve[state.weapon]<=0)return;state.reload=w.reload;message('Rechargement…');sound(110,.12)}
function fire(){
 const w=weapons[state.weapon];if(state.shootCooldown>0||state.reload>0||state.intermission>0)return;
 if(state.ammo[state.weapon]===0){reload();return}
 state.ammo[state.weapon]--;state.shootCooldown=w.rate;state.shake=.4;const player=state.player,a=Math.atan2(mouse.y-player.y,mouse.x-player.x);
 for(let i=0;i<w.pellets;i++){const angle=a+rand(-w.spread,w.spread),dx=Math.cos(angle),dy=Math.sin(angle);state.bullets.push({x:player.x+dx*19,y:player.y+dy*19,vx:dx*w.speed,vy:dy*w.speed,life:.95,r:3,damage:w.damage,color:w.color})}
 sound(w.damage>2?95:w.pellets>1?125:185,.085,.045);
}
function particle(x,y,color,count=7){for(let i=0;i<count;i++){const a=rand(0,Math.PI*2),speed=rand(40,200);state.particles.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:rand(.2,.55),color})}}
function createEnemy(){
 const side=Math.floor(Math.random()*4),kind=state.wave>=4&&Math.random()<.17?'brute':state.wave>=2&&Math.random()<.37?'runner':'walker';
 const hp=(kind==='brute'?15:kind==='runner'?3:5)+Math.floor(state.wave*.6);
 const x=side===0?-35:side===1?W+35:rand(10,W-10),y=side===2?-35:side===3?H+35:rand(10,H-10);
 state.enemies.push({x,y,r:kind==='brute'?22:kind==='runner'?11:16,hp,maxHp:hp,kind,speed:(kind==='runner'?155:kind==='brute'?53:72)+state.wave*5+rand(-7,15),damage:kind==='brute'?19:11,attack:0});
}
function finish(won){state.ended=true;state.playing=false;state.won=won;firing=false;UI.showGameOver(state.score);
 const title=document.querySelector('#gameOver h2');if(title)title.textContent=won?'EXTRACTION RÉUSSIE':'VOUS AVEZ SUCCOMBÉ';
 const text=document.querySelector('#gameOver .panel p');if(text)text.textContent=(won?'Tu as survécu aux cinq vagues. ':'Le refuge est tombé. ')+'Éliminations : '+state.kills+' · Score : '+state.score;
}
function update(dt){
 if(!state.playing||state.paused||state.ended)return;state.time+=dt;const p=state.player;
 state.shootCooldown=Math.max(0,state.shootCooldown-dt);state.shake=Math.max(0,state.shake-dt*4);p.invulnerable=Math.max(0,p.invulnerable-dt);
 if(state.reload>0){state.reload-=dt;if(state.reload<=0){const w=weapons[state.weapon],amount=Math.min(w.mag-state.ammo[state.weapon],state.reserve[state.weapon]);state.ammo[state.weapon]+=amount;state.reserve[state.weapon]-=amount;state.reload=0;message('Chargeur prêt',1)}}
 let mx=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('q')||keys.has('a')||keys.has('arrowleft'));
 let my=Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('z')||keys.has('w')||keys.has('arrowup'));
 const length=Math.hypot(mx,my)||1,sprint=keys.has('shift')&&p.stamina>2&&(mx||my),speed=sprint?305:210;
 move(p,mx/length*speed*dt,my/length*speed*dt);p.x=clamp(p.x,p.r,W-p.r);p.y=clamp(p.y,p.r,H-p.r);p.stamina=clamp(p.stamina+(sprint?-42:23)*dt,0,100);
 if(firing)fire();
 if(state.intermission>0){state.intermission=Math.max(0,state.intermission-dt)}
 else{
  state.spawnClock-=dt;
  if(state.spawnRemaining>0&&state.spawnClock<=0){createEnemy();state.spawnRemaining--;state.spawnClock=rand(.3,.58)}
  if(!state.spawnRemaining&&!state.enemies.length){if(state.wave===5){finish(true);return}
   state.wave++;state.spawnRemaining=6+state.wave*3;state.intermission=3.3;state.spawnClock=.2;
   state.pickups.push(spawn(W*.24,H*.75,'ammo'));if(state.wave%2===0)state.pickups.push(spawn(W*.75,H*.25,'medkit'));
   message('VAGUE '+state.wave+' — '+(state.wave>3?'Des brutes arrivent !':'Ils reviennent…'),3);sound(75,.3,.05)}
 }
 for(const b of state.bullets){const ox=b.x,oy=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(wall(b.x,b.y,b.r)){b.life=0;particle(b.x,b.y,'#9aa3a0',3)}if(b.life<=0)continue;
  for(const e of state.enemies){if(e.hp>0&&Math.hypot(b.x-e.x,b.y-e.y)<b.r+e.r){e.hp-=b.damage;b.life=0;particle(b.x,b.y,'#8eb79c',5);
   if(e.hp<=0){state.score+=e.kind==='brute'?100:e.kind==='runner'?40:25;state.kills++;particle(e.x,e.y,'#ae595b',11);
    if(Math.random()<.17)state.pickups.push(spawn(e.x,e.y,Math.random()<.4?'medkit':'ammo'))}break}}
 }
 state.bullets=state.bullets.filter(b=>b.life>0&&b.x>-40&&b.x<W+40&&b.y>-40&&b.y<H+40);
 state.enemies=state.enemies.filter(e=>e.hp>0);
 for(const e of state.enemies){
  const dx=p.x-e.x,dy=p.y-e.y,length=Math.hypot(dx,dy)||1;move(e,dx/length*e.speed*dt,dy/length*e.speed*dt);e.attack=Math.max(0,e.attack-dt);
  if(dist(p,e)<p.r+e.r&&p.invulnerable<=0&&e.attack<=0){p.hp=Math.max(0,p.hp-e.damage);e.attack=1;p.invulnerable=.45;state.shake=1;particle(p.x,p.y,'#e39e9c',10);sound(60,.2,.06);if(p.hp<=0){finish(false);return}}
 }
 for(const item of state.pickups){item.life-=dt;if(dist(p,item)<p.r+item.r+2){if(item.type==='medkit'){p.hp=Math.min(100,p.hp+30);message('Soins +30 PV')}else{state.reserve=state.reserve.map((v,i)=>v+Math.ceil(weapons[i].mag*.8));message('Munitions récupérées')}item.life=0;sound(480,.12,.03)}}
 state.pickups=state.pickups.filter(x=>x.life>0);
 for(const fx of state.particles){fx.x+=fx.vx*dt;fx.y+=fx.vy*dt;fx.vx*=Math.max(0,1-5*dt);fx.vy*=Math.max(0,1-5*dt);fx.life-=dt}
 state.particles=state.particles.filter(x=>x.life>0);
 UI.updateHUD({hp:p.hp,score:state.score,wave:state.wave,ammo:state.ammo[state.weapon],reserve:state.reserve[state.weapon],weapon:weapons[state.weapon].name,stamina:p.stamina,objective:state.intermission?'La horde approche…':'Survivre — vague '+state.wave+'/5'});
}
function draw(){
 ctx.fillStyle='#091117';ctx.fillRect(0,0,W,H);ctx.save();
 if(state.shake>0)ctx.translate(Math.sin(performance.now()*.07)*state.shake*3,Math.cos(performance.now()*.09)*state.shake*2);
 ctx.strokeStyle='#30404844';ctx.lineWidth=1;for(let x=0;x<W;x+=45){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke()}for(let y=0;y<H;y+=45){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
 for(const o of cover){ctx.fillStyle='#343c3e';ctx.fillRect(o.x,o.y,o.w,o.h);ctx.strokeStyle='#78837a';ctx.lineWidth=3;ctx.strokeRect(o.x+2,o.y+2,o.w-4,o.h-4)}
 for(const pickup of state.pickups){ctx.fillStyle=pickup.type==='medkit'?'#d8b8b4':'#d3c08b';ctx.fillRect(pickup.x-11,pickup.y-11,22,22);ctx.fillStyle='#24313a';ctx.font='bold 17px sans-serif';ctx.textAlign='center';ctx.fillText(pickup.type==='medkit'?'+':'◆',pickup.x,pickup.y+6)}
 for(const b of state.bullets){ctx.fillStyle=b.color;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill()}
 for(const e of state.enemies){ctx.fillStyle=e.kind==='brute'?'#aa535b':e.kind==='runner'?'#b69a64':'#558c71';ctx.beginPath();ctx.arc(e.x,e.y,e.r,0,Math.PI*2);ctx.fill();ctx.fillStyle='#1b2124';ctx.fillRect(e.x-17,e.y-e.r-10,34,4);ctx.fillStyle='#cc6d6a';ctx.fillRect(e.x-17,e.y-e.r-10,34*e.hp/e.maxHp,4)}
 const p=state.player;ctx.fillStyle=p.invulnerable>0?'#a2c2de':'#8ba9ba';ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();
 const angle=Math.atan2(mouse.y-p.y,mouse.x-p.x);ctx.strokeStyle=weapons[state.weapon].color;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+Math.cos(angle)*24,p.y+Math.sin(angle)*24);ctx.stroke();
 ctx.strokeStyle='#a5c6c64d';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(mouse.x,mouse.y);ctx.stroke();
 for(const fx of state.particles){ctx.globalAlpha=clamp(fx.life*2,0,1);ctx.fillStyle=fx.color;ctx.fillRect(fx.x,fx.y,4,4)}ctx.globalAlpha=1;
 // Framed darkness retains immediate gameplay visibility and obscures distant enemies.
 const fog=ctx.createRadialGradient(p.x,p.y,45,p.x,p.y,285);fog.addColorStop(0,'#050a0f00');fog.addColorStop(.55,'#050a0f36');fog.addColorStop(1,'#050a0fdf');ctx.fillStyle=fog;ctx.fillRect(0,0,W,H);
 ctx.restore();
 ctx.fillStyle='#111b27ee';ctx.fillRect(180,H-54,540,43);
 weapons.forEach((w,i)=>{const x=188+i*131;ctx.fillStyle=state.weapon===i?'#b4d9c5':'#657882';ctx.font=(state.weapon===i?'bold ':'')+'12px system-ui';ctx.textAlign='left';ctx.fillText('['+(i+1)+'] '+w.name,x,H-28)});
 if(performance.now()<state.noticeUntil){ctx.fillStyle='#131d27ea';ctx.fillRect(W/2-230,35,460,38);ctx.fillStyle='#eee3d8';ctx.textAlign='center';ctx.font='15px system-ui';ctx.fillText(state.notice,W/2,60)}
 if(state.paused){ctx.fillStyle='#05080cde';ctx.fillRect(0,0,W,H);ctx.textAlign='center';ctx.fillStyle='white';ctx.font='bold 42px system-ui';ctx.fillText('PAUSE',W/2,H/2);ctx.font='17px system-ui';ctx.fillText('Échap pour reprendre',W/2,H/2+32)}
}
function reset(){state=fresh();initial=true;UI.updateHUD({hp:100,score:0,wave:1,ammo:12,reserve:48,weapon:'Pistolet',stamina:100,objective:'Survivre — vague 1/5'});message('Survis cinq vagues · R recharge · Shift sprint',4)}
window.addEventListener('keydown',e=>{
 const k=e.key.toLowerCase();keys.add(k);
 if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();
 if(k==='r'&&state.ended){UI.hideGameOver();reset()}
 else if(k==='r'&&state.playing)reload();
 if(k==='escape'&&state.playing){state.paused=!state.paused;firing=false}
 const i=Number(k)-1;if(i>=0&&i<4)switchWeapon(i);
});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>{keys.clear();firing=false;if(state.playing)state.paused=true});
canvas.addEventListener('pointermove',e=>{const r=canvas.getBoundingClientRect();mouse={x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height}});
canvas.addEventListener('pointerdown',e=>{if(e.button===0&&!state.paused&&!state.ended){firing=true;canvas.setPointerCapture?.(e.pointerId)}});
canvas.addEventListener('pointerup',()=>firing=false);canvas.addEventListener('pointercancel',()=>firing=false);
canvas.addEventListener('wheel',e=>{e.preventDefault();switchWeapon((state.weapon+(e.deltaY>0?1:3))%4)},{passive:false});
UI.startBtn.addEventListener('click',()=>{UI.hideMenu();reset()});
UI.restartBtn.addEventListener('click',()=>{UI.hideGameOver();reset()});
let last=performance.now();function loop(now){const dt=Math.min(.04,(now-last)/1000);last=now;if(initial){update(dt);draw()}requestAnimationFrame(loop)}
state=fresh();state.playing=false;requestAnimationFrame(loop);
})();