// ═══════════════════════════════════════════════════════
// CANVAS SETUP
// ═══════════════════════════════════════════════════════
const canvas      = document.getElementById('gameCanvas');
const ctx         = canvas.getContext('2d');
const minimapCvs  = document.getElementById('minimap');
const mctx        = minimapCvs.getContext('2d');

// ═══════════════════════════════════════════════════════
// TRACK
// ═══════════════════════════════════════════════════════
const TRACK_POINTS = [
  {x:400,y:520},{x:600,y:520},{x:700,y:480},{x:740,y:400},
  {x:740,y:300},{x:700,y:200},{x:620,y:140},{x:500,y:110},
  {x:380,y:110},{x:280,y:140},{x:200,y:200},{x:160,y:300},
  {x:160,y:400},{x:200,y:470},{x:280,y:510},{x:400,y:520}
];
const TRACK_WIDTH    = 82;
const TRACK_RES      = 500;
const WALL_BOUNCE    = 0.35;  // restitution des murs

// ═══════════════════════════════════════════════════════
// CHALLENGE SYSTEMS
// ═══════════════════════════════════════════════════════

// ── BOOST PADS & SLOW ZONES ─────────────────────────────
// Placed at fixed offsets along the track
const BOOST_OFFSETS = [0.15, 0.45, 0.78];   // green speed pads
const SLOW_OFFSETS  = [0.30, 0.62];          // mud/oil patches
let boostPads = [], slowZones = [];
function buildZones(){
  boostPads = BOOST_OFFSETS.map(t=>{ const p=spline(TRACK_POINTS,t); return {x:p.x,y:p.y,r:18}; });
  slowZones  = SLOW_OFFSETS.map(t=>{ const p=spline(TRACK_POINTS,t); return {x:p.x,y:p.y,r:22}; });
}

// ── WEATHER ─────────────────────────────────────────────
// Cycles: clear → rain (slippery) → clear
let weather      = 'clear';  // 'clear' | 'rain'
let weatherTimer = 0;
const WEATHER_CYCLE = 900;   // frames before potential change
let rainDrops = [];
function updateWeather(){
  weatherTimer++;
  if(weatherTimer >= WEATHER_CYCLE){
    weatherTimer = 0;
    weather = weather === 'clear' ? 'rain' : 'clear';
    if(weather === 'rain') buildRaindrops();
  }
  if(weather === 'rain'){
    rainDrops.forEach(d=>{ d.y += d.vy; d.x += d.vx; if(d.y>600) d.y=-10; if(d.x>800) d.x=0; });
  }
}
function buildRaindrops(){
  rainDrops = Array.from({length:120},()=>({
    x:Math.random()*800, y:Math.random()*600,
    vx:1.5, vy:6+Math.random()*4,
    len:8+Math.random()*10, a:0.3+Math.random()*0.4
  }));
}
// Rain makes the track slippery — applied in physicsStep
function rainGripMult(){ return weather==='rain' ? 0.55 : 1.0; }
function rainFricMult(){ return weather==='rain' ? 0.96 : 1.0; }  // less braking

// ── RUBBER-BANDING ───────────────────────────────────────
// CPUs that are far behind get a gentle speed boost.
// CPUs that are far ahead slow down slightly. Never cheats, just rebalances.
function rubberBandBoost(cpu){
  if(!player || !cpu) return 1.0;
  const gap = player.progress - cpu.progress;  // positive = player ahead
  if(gap > 0.3)  return 1.12;   // CPU is well behind → small boost
  if(gap > 0.15) return 1.06;
  if(gap < -0.3) return 0.92;   // CPU is well ahead → slight slow
  return 1.0;
}

// ── CLEAN-LAP COMBO ─────────────────────────────────────
// Player gets a speed bonus for laps without hitting walls hard
let cleanLapStreak = 0;
let wallHitThisLap = false;
function onWallHit(){ wallHitThisLap = true; }
function onLapComplete(){
  if(!wallHitThisLap){ cleanLapStreak++; } else { cleanLapStreak = 0; }
  wallHitThisLap = false;
}
function cleanBonus(){ return 1 + Math.min(cleanLapStreak, 3) * 0.04; } // max +12%

let trackPath = [];
for(let i=0;i<=TRACK_RES;i++) trackPath.push(spline(TRACK_POINTS, i/TRACK_RES));

// Real tangent angle at start — used to orient karts on the grid
const _sp0 = trackPath[2], _sp1 = trackPath[8];
const START_ANGLE = Math.atan2(_sp1.y - _sp0.y, _sp1.x - _sp0.x);
const START_NX = -Math.sin(START_ANGLE);  // perpendicular (sideways)
const START_NY =  Math.cos(START_ANGLE);

function spline(pts, t){
  const n=pts.length-1;
  const s=Math.min(Math.floor(t*n),n-1), lt=(t*n)-s;
  const p0=pts[Math.max(0,s-1)], p1=pts[s], p2=pts[Math.min(n,s+1)], p3=pts[Math.min(n,s+2)];
  const cm=(a,b,c,d,u)=>0.5*((2*b)+(-a+c)*u+(2*a-5*b+4*c-d)*u*u+(-a+3*b-3*c+d)*u*u*u);
  return {x:cm(p0.x,p1.x,p2.x,p3.x,lt), y:cm(p0.y,p1.y,p2.y,p3.y,lt)};
}

// Nearest track point + normal cache for wall collisions
function nearestTrackPoint(x, y){
  let minD=Infinity, best=0;
  for(let i=0;i<trackPath.length;i++){
    const dx=trackPath[i].x-x, dy=trackPath[i].y-y, d=dx*dx+dy*dy;
    if(d<minD){minD=d;best=i;}
  }
  return {idx:best, dist:Math.sqrt(minD), pt:trackPath[best]};
}

function isOnTrack(x,y){ return nearestTrackPoint(x,y).dist < TRACK_WIDTH*0.52; }

function getProgress(x,y){ return nearestTrackPoint(x,y).idx / TRACK_RES; }

// ── WALL COLLISION ──────────────────────────────────────
// Pushes kart back inside track and reflects velocity
function resolveWall(k){
  const {idx, dist, pt} = nearestTrackPoint(k.x, k.y);
  if(dist < TRACK_WIDTH*0.52) return; // inside — ok

  // Normal from track centre toward kart
  const nx = (k.x - pt.x)/dist;
  const ny = (k.y - pt.y)/dist;

  // Push back inside
  const penetration = dist - TRACK_WIDTH*0.50;
  k.x -= nx * (penetration + 1);
  k.y -= ny * (penetration + 1);

  // Reflect velocity along normal (bounce)
  const dot = k.vx*nx + k.vy*ny;
  if(dot > 0){
    k.vx -= (1+WALL_BOUNCE)*dot*nx;
    k.vy -= (1+WALL_BOUNCE)*dot*ny;
  }

  // Kill most of the speed on impact
  k.vx *= 0.55;
  k.vy *= 0.55;
}

// ═══════════════════════════════════════════════════════
// ITEM BOXES
// ═══════════════════════════════════════════════════════
const ITEM_OFFSETS = [0.08,0.22,0.37,0.52,0.67,0.82];
let itemBoxes = [];
function resetItemBoxes(){
  itemBoxes = ITEM_OFFSETS.map(t=>{
    const p=spline(TRACK_POINTS,t);
    return {x:p.x,y:p.y,active:true,respawn:0};
  });
}
const ITEMS_POOL = ['ETOILE','CARAPACE','CHAMPIGNON','CARAPACE','CHAMPIGNON','CHAMPIGNON'];

// ═══════════════════════════════════════════════════════
// GAME CONFIG (selected before start)
// ═══════════════════════════════════════════════════════
let selectedMode = 'race'; // 'race' | 'time' | 'elim'
let totalLaps    = 3;
let difficulty   = 'normal';

function selectMode(m){
  selectedMode = m;
  document.querySelectorAll('.mode-card').forEach(c=>c.classList.remove('selected'));
  document.getElementById('card-'+m).classList.add('selected');
}
function setLaps(n){
  totalLaps = n;
  [3,5,7].forEach(v=>{
    const el=document.getElementById('lap-'+v);
    if(el) el.classList.toggle('selected',v===n);
  });
}
function setDiff(d){
  difficulty = d;
  ['normal','hard'].forEach(v=>{
    const el=document.getElementById('diff-'+v);
    if(el) el.classList.toggle('selected',v===d);
  });
}

// ═══════════════════════════════════════════════════════
// KART FACTORY
// ═══════════════════════════════════════════════════════
function makeKart(x,y,angle,color,name,extra){
  return Object.assign({
    x,y,angle,
    vx:0,vy:0,speed:0,
    onTrack:true,
    lap:0,progress:0,lastProgress:0,
    item:null,itemTimer:0,
    starTimer:0,invincible:false,
    eliminated:false,
    trail:[],
    color,name,
    accel:0.26, maxFwd:5.8, maxRev:1.6,
    friction:0.87, grip:0.83, turnRate:0.068,
  }, extra||{});
}

let player={}, cpus=[], allKarts=[];

function resetEntities(){
  // Grid: place karts BEHIND the start line, aligned with track direction
  // Row offset goes backward along the track (opposite to START_ANGLE)
  const bx = -Math.cos(START_ANGLE); // backward direction X
  const by = -Math.sin(START_ANGLE); // backward direction Y
  const sp = trackPath[0];
  const hard = difficulty === 'hard';

  // Helper: grid slot. col = -1(left) / 0(centre) / 1(right), row = 0..3 (row 0 = front)
  const gridPos = (col, row) => ({
    x: sp.x + START_NX * col * 22 + bx * row * 26,
    y: sp.y + START_NY * col * 22 + by * row * 26,
  });

  const g0 = gridPos(-1, 0); // Mario: front-left
  const g1 = gridPos( 1, 0); // Luigi: front-right
  const g2 = gridPos(-1, 1); // Waluigi: back-left
  const g3 = gridPos( 1, 1); // Peach: back-right

  player = makeKart(g0.x, g0.y, START_ANGLE, '#E52222', 'MARIO');

  cpus = selectedMode === 'time' ? [] : [
    makeKart(g1.x, g1.y, START_ANGLE, '#22AA22', 'LUIGI',
      {accel:hard?.24:.20, maxFwd:hard?5.8:5.1, targetIdx:6, skill:hard?.93:.82}),
    makeKart(g2.x, g2.y, START_ANGLE, '#FFD700', 'WALUIGI',
      {accel:hard?.21:.17, maxFwd:hard?5.4:4.7, targetIdx:6, skill:hard?.85:.74}),
    makeKart(g3.x, g3.y, START_ANGLE, '#FF69B4', 'PEACH',
      {accel:hard?.19:.15, maxFwd:hard?5.1:4.4, targetIdx:6, skill:hard?.80:.69}),
  ];

  allKarts = [player, ...cpus];
}

// ═══════════════════════════════════════════════════════
// PHYSICS
// ═══════════════════════════════════════════════════════
function physicsStep(k){
  k.onTrack = isOnTrack(k.x, k.y);
  const fwdX=Math.cos(k.angle), fwdY=Math.sin(k.angle);
  k.speed = k.vx*fwdX + k.vy*fwdY;

  // ── Zone effects ──
  let onBoost = false, onSlow = false;
  boostPads.forEach(p=>{ const d=Math.hypot(k.x-p.x,k.y-p.y); if(d<p.r) onBoost=true; });
  slowZones.forEach(p=>{ const d=Math.hypot(k.x-p.x,k.y-p.y); if(d<p.r) onSlow=true; });

  if(onBoost && k.starTimer===0){
    // Boost pad: push forward
    k.vx += fwdX * 0.35;
    k.vy += fwdY * 0.35;
    if(Math.random()<0.3) spawnFx(k.x,k.y,'#00FF88',2,2);
  }
  if(onSlow){
    k.vx *= 0.93;
    k.vy *= 0.93;
    if(Math.random()<0.2) spawnFx(k.x,k.y,'#884400',2,1.5);
  }
  k.onBoost = onBoost;
  k.onSlow  = onSlow;

  // ── Friction & grip (modulated by rain + clean bonus for player) ──
  const rainG = rainGripMult();
  const rainF = rainFricMult();
  const cb    = (k === player) ? cleanBonus() : 1.0;
  const fric  = (k.onTrack ? k.friction * rainF * cb : 0.80);
  k.vx *= fric; k.vy *= fric;

  // Lateral grip (rain = much slippier)
  const latX=-fwdY, latY=fwdX;
  const lat = k.vx*latX + k.vy*latY;
  const grip = k.grip * rainG;
  k.vx -= latX*lat*grip;
  k.vy -= latY*lat*grip;

  k.x += k.vx; k.y += k.vy;

  // ──  INVISIBLE WALLS  ──
  const prevX=k.x, prevY=k.y;
  resolveWall(k);
  if((k===player) && (k.x!==prevX||k.y!==prevY)) onWallHit(); // track wall hit

  // Trail
  k.trail.push({x:k.x,y:k.y});
  if(k.trail.length>20) k.trail.shift();

  // Timers
  if(k.itemTimer>0) k.itemTimer--;
  if(k.starTimer>0){ k.starTimer--; if(k.starTimer===0) k.invincible=false; }
}

// ═══════════════════════════════════════════════════════
// SHELLS
// ═══════════════════════════════════════════════════════
let shells=[];
function fireShell(k){
  shells.push({x:k.x+Math.cos(k.angle)*22,y:k.y+Math.sin(k.angle)*22,
    vx:Math.cos(k.angle)*9,vy:Math.sin(k.angle)*9,owner:k,life:130});
}

// ═══════════════════════════════════════════════════════
// PARTICLES
// ═══════════════════════════════════════════════════════
let particles=[];
function spawnFx(x,y,color,n=8,speed=3){
  for(let i=0;i<n;i++){
    const a=Math.random()*Math.PI*2, s=speed*(.5+Math.random());
    particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,
      life:25+Math.random()*35,color,size:2+Math.random()*5});
  }
}

// ═══════════════════════════════════════════════════════
// INPUT
// ═══════════════════════════════════════════════════════
const keys={};
document.addEventListener('keydown',e=>{ keys[e.code]=true; if(e.code==='Space') e.preventDefault(); });
document.addEventListener('keyup',  e=>{ keys[e.code]=false; });

// ═══════════════════════════════════════════════════════
// GAME STATE
// ═══════════════════════════════════════════════════════
let gameState='menu';
let startTime=0, raceTime=0;
let countdown=3, cdTimer=0;
let raceFinished=false, finishTime=0;

// Time-trial
let bestLap=Infinity, lapStartTime=0;

// Elimination
let elimTimer=30, lastElimTime=0, elimActive=false;
let eliminatedKarts=[];

function startGame(){
  document.getElementById('screenOverlay').style.display='none';
  resetEntities();
  resetItemBoxes();
  shells=[]; particles=[];
  raceFinished=false; finishTime=0;
  bestLap=Infinity; lapStartTime=0;
  elimTimer=30; elimActive=false; eliminatedKarts=[];
  countdown=3; cdTimer=0;
  buildZones();
  weather='clear'; weatherTimer=0; rainDrops=[];
  cleanLapStreak=0; wallHitThisLap=false;
  gameState='countdown';
  startTime=performance.now();

  // Mode UI
  const modeNames={race:'🏆 GRAND PRIX',time:'⏱️ CONTRE-LA-MONTRE',elim:'💀 ÉLIMINATION'};
  const modeTag=document.getElementById('modeTag');
  if(modeTag) modeTag.textContent=modeNames[selectedMode]||'';

  const posRow=document.getElementById('posRow');
  const bestLapRow=document.getElementById('bestLapRow');
  const elimBar=document.getElementById('elimBar');
  if(posRow) posRow.style.display   = selectedMode==='time'?'none':'flex';
  if(bestLapRow) bestLapRow.style.display = selectedMode==='time'?'flex':'none';
  if(elimBar) elimBar.style.display  = selectedMode==='elim'?'block':'none';

  if(!loopRunning){ loopRunning=true; requestAnimationFrame(loop); }
}

let loopRunning=false;

// ═══════════════════════════════════════════════════════
// PLAYER UPDATE
// ═══════════════════════════════════════════════════════
function updatePlayer(){
  if(player.eliminated) return;

  const boost=player.starTimer>0?1.6:1;
  const top=(player.onTrack?player.maxFwd:player.maxFwd*0.55)*boost;

  // Steering — proportional to speed, min baseline so you can steer from stop
  const spd=Math.abs(player.speed);
  const ratio=Math.min(spd/player.maxFwd,1);
  const turn=player.turnRate*(0.3+0.7*ratio);
  const dir=player.speed>=0?1:-1;

  if(keys['ArrowLeft'] ||keys['KeyA']) player.angle-=turn*dir;
  if(keys['ArrowRight']||keys['KeyD']) player.angle+=turn*dir;

  // Throttle
  if(keys['ArrowUp']||keys['KeyW']){
    player.vx+=Math.cos(player.angle)*player.accel*boost;
    player.vy+=Math.sin(player.angle)*player.accel*boost;
  }
  if(keys['ArrowDown']||keys['KeyS']){
    if(player.speed>0.4){
      player.vx-=Math.cos(player.angle)*player.accel*2.0;
      player.vy-=Math.sin(player.angle)*player.accel*2.0;
    } else {
      player.vx+=Math.cos(player.angle)*-player.accel*0.55;
      player.vy+=Math.sin(player.angle)*-player.accel*0.55;
    }
  }

  // Clamp
  const vel=Math.sqrt(player.vx*player.vx+player.vy*player.vy);
  const maxV=player.speed<0?player.maxRev:top;
  if(vel>maxV){ player.vx=player.vx/vel*maxV; player.vy=player.vy/vel*maxV; }

  // Item use
  if(keys['Space']&&player.item){
    keys['Space']=false;
    useItem(player);
  }

  physicsStep(player);
}

function useItem(k){
  const it=k.item; k.item=null;
  if(k===player) document.getElementById('itemDisplay').textContent='—';
  if(it==='CARAPACE')    fireShell(k);
  else if(it==='CHAMPIGNON'){
    k.itemTimer=90;
    k.vx+=Math.cos(k.angle)*5; k.vy+=Math.sin(k.angle)*5;
    spawnFx(k.x,k.y,'#FF8800',14);
  }
  else if(it==='ETOILE'){
    k.starTimer=300; k.invincible=true;
    spawnFx(k.x,k.y,'#FFD700',18);
  }
}

// ═══════════════════════════════════════════════════════
// CPU UPDATE
// ═══════════════════════════════════════════════════════
function updateCPU(c){
  if(c.eliminated) return;

  // Lookahead target
  let ni=c.targetIdx%TRACK_RES;
  const tp=trackPath[ni];
  const dx=tp.x-c.x, dy=tp.y-c.y;
  if(Math.sqrt(dx*dx+dy*dy)<32) c.targetIdx=(c.targetIdx+12)%TRACK_RES;

  const ta=Math.atan2(dy,dx);
  let diff=ta-c.angle;
  while(diff>Math.PI)  diff-=2*Math.PI;
  while(diff<-Math.PI) diff+=2*Math.PI;
  const noise=(Math.random()-.5)*0.09*(1-c.skill);
  c.angle+=Math.max(-c.turnRate,Math.min(c.turnRate,diff+noise));

  const rb    = rubberBandBoost(c);
  const boost = (c.starTimer>0?1.5:1) * rb;
  const top   = (c.onTrack?c.maxFwd:c.maxFwd*0.45)*boost;
  if(c.speed<top){
    c.vx+=Math.cos(c.angle)*c.accel*c.skill*rb;
    c.vy+=Math.sin(c.angle)*c.accel*c.skill*rb;
  }

  physicsStep(c);

  if(c.item&&Math.random()<0.012) useItem(c);
}

// ═══════════════════════════════════════════════════════
// LAP TRACKING
// ═══════════════════════════════════════════════════════
function checkLap(k){
  const p=getProgress(k.x,k.y);
  if(k.lastProgress>0.88&&p<0.12){
    k.lap++;
    if(k===player){
      // time trial best lap
      if(selectedMode==='time'){
        const now=performance.now();
        const lapTime=(now-lapStartTime)/1000;
        lapStartTime=now;
        if(lapTime<bestLap){ bestLap=lapTime; flashLap('MEILLEUR: '+fmtTime(lapTime)); }
        else flashLap('TOUR '+k.lap+': '+fmtTime(lapTime));
      } else {
        onLapComplete();
        const streakMsg = cleanLapStreak>1 ? ' 🔥x'+cleanLapStreak : '';
        flashLap(k.lap<totalLaps?'TOUR '+k.lap+'!'+streakMsg:'🏁 ARRIVÉE!');
      }
      if(k.lap>=totalLaps&&!raceFinished&&selectedMode!=='time'){
        raceFinished=true; finishTime=performance.now()-startTime;
        setTimeout(showEndScreen,1600);
      }
    }
  }
  k.lastProgress=p;
  k.progress=k.lap+p;
}

function fmtTime(s){
  const m=Math.floor(s/60);
  return m+':'+(s%60).toFixed(2).padStart(5,'0');
}

function flashLap(msg){
  const el=document.getElementById('lapIndicator');
  if(!el)return;
  el.textContent=msg; el.style.opacity='1';
  setTimeout(()=>el.style.opacity='0',1400);
}

// ═══════════════════════════════════════════════════════
// COLLISIONS
// ═══════════════════════════════════════════════════════
function checkCollisions(){
  const alive=allKarts.filter(k=>!k.eliminated);

  // Kart vs kart
  for(let i=0;i<alive.length;i++)
    for(let j=i+1;j<alive.length;j++){
      const a=alive[i],b=alive[j];
      const dx=b.x-a.x,dy=b.y-a.y,d=Math.sqrt(dx*dx+dy*dy);
      if(d<22&&d>0){
        const nx=dx/d,ny=dy/d,push=2.8;
        if(!a.invincible){a.x-=nx*push;a.y-=ny*push;a.vx*=0.45;a.vy*=0.45;}
        if(!b.invincible){b.x+=nx*push;b.y+=ny*push;b.vx*=0.45;b.vy*=0.45;}
        spawnFx((a.x+b.x)/2,(a.y+b.y)/2,'#FF5500',5);
      }
    }

  // Item boxes
  itemBoxes.forEach(box=>{
    if(!box.active){box.respawn--;if(box.respawn<=0)box.active=true;return;}
    alive.forEach(k=>{
      if(k.item)return;
      const dx=k.x-box.x,dy=k.y-box.y;
      if(Math.sqrt(dx*dx+dy*dy)<24){
        k.item=ITEMS_POOL[Math.floor(Math.random()*ITEMS_POOL.length)];
        box.active=false; box.respawn=320;
        if(k===player){
          spawnFx(box.x,box.y,'#FFD700',12);
          document.getElementById('itemDisplay').textContent=itemEmoji(k.item)+' '+k.item;
        }
      }
    });
  });

  // Shells
  for(let i=shells.length-1;i>=0;i--){
    const s=shells[i];
    s.x+=s.vx; s.y+=s.vy; s.life--;
    if(!isOnTrack(s.x,s.y)||s.life<=0){shells.splice(i,1);continue;}
    for(const k of alive){
      if(k===s.owner)continue;
      const dx=k.x-s.x,dy=k.y-s.y;
      if(Math.sqrt(dx*dx+dy*dy)<18&&!k.invincible){
        k.vx*=-0.4;k.vy*=-0.4;k.hits++;
        spawnFx(k.x,k.y,'#FF2200',14);
        shells.splice(i,1);break;
      }
    }
  }
}

function itemEmoji(it){
  return {ETOILE:'⭐',CARAPACE:'🐚',CHAMPIGNON:'🍄'}[it]||'';
}

// ═══════════════════════════════════════════════════════
// ELIMINATION MODE
// ═══════════════════════════════════════════════════════
function updateElim(now){
  if(!elimActive) return;
  const elapsed=(now-lastElimTime)/1000;
  const remaining=Math.max(0,30-elapsed);

  const fill=document.getElementById('elimFill');
  const cd=document.getElementById('elimCountdown');
  if(fill) fill.style.width=(remaining/30*100)+'%';
  if(cd) cd.textContent=Math.ceil(remaining);

  if(remaining<=0){
    lastElimTime=now;
    // find last alive kart by progress
    const alive=allKarts.filter(k=>!k.eliminated);
    if(alive.length<=2){
      // race over
      raceFinished=true; finishTime=now-startTime;
      setTimeout(showEndScreen,1500);
      return;
    }
    alive.sort((a,b)=>a.progress-b.progress);
    const loser=alive[0];
    loser.eliminated=true;
    eliminatedKarts.push(loser);
    spawnFx(loser.x,loser.y,'#FF0000',20,5);
    spawnFx(loser.x,loser.y,'#FFD700',10,3);
    if(loser===player){
      raceFinished=true; finishTime=now-startTime;
      setTimeout(showEndScreen,1500);
    } else {
      flashLap('💀 '+loser.name+' ÉLIMINÉ!');
    }
  }
}

// ═══════════════════════════════════════════════════════
// RANKING
// ═══════════════════════════════════════════════════════
function getRanking(){
  return [...allKarts].sort((a,b)=>b.progress-a.progress);
}

// ═══════════════════════════════════════════════════════
// HUD UPDATE
// ═══════════════════════════════════════════════════════
function updateHUD(now){
  const elapsed=(now-startTime)/1000;
  document.getElementById('timer').textContent=fmtTime(elapsed);
  document.getElementById('lapCount').textContent=
    (Math.min(player.lap+1,totalLaps))+'/'+totalLaps;

  const rank=getRanking();
  const myRank=rank.findIndex(k=>k===player)+1;
  const sfx=['er','ème','ème','ème'];
  document.getElementById('position').textContent=myRank+(sfx[myRank-1]||'ème');
  document.getElementById('speed').textContent=Math.abs(Math.round(player.speed*20));

  if(!player.item) document.getElementById('itemDisplay').textContent='—';

  if(selectedMode==='time'&&bestLap<Infinity){
    const bl=document.getElementById('bestLap');
    if(bl) bl.textContent=fmtTime(bestLap);
  }
}

// ═══════════════════════════════════════════════════════
// END SCREEN
// ═══════════════════════════════════════════════════════
function showEndScreen(){
  const rank=getRanking();
  const myRank=rank.findIndex(k=>k===player)+1;
  const elapsed=finishTime/1000;

  let html='';
  if(selectedMode==='time'){
    html=`
      <div class="end-title">⏱️ TEMPS FINAL</div>
      <div class="end-sub" style="margin:10px 0;font-size:12px;color:#FFD700">${fmtTime(elapsed)}</div>
      <div class="end-sub">MEILLEUR TOUR : ${bestLap<Infinity?fmtTime(bestLap):'—'}</div>
    `;
  } else {
    const won=myRank===1;
    html=`
      <div class="end-title">${won?'🏆 VICTOIRE !':'🏁 ARRIVÉE !'}</div>
      <div class="end-sub" style="margin:6px 0">TEMPS : ${fmtTime(elapsed)}</div>
      <div class="end-podium">
        ${rank.map((k,i)=>`
          <div class="podium-row${k===player?' me':''}">
            <span>${['🥇','🥈','🥉'][i]||'  '+(i+1)+'.'}</span>
            <span style="color:${k.color}">${k.name}</span>
            <span style="color:#666;font-size:6px">${k===player?'VOUS':''}</span>
          </div>`).join('')}
      </div>
    `;
  }

  const ov=document.getElementById('screenOverlay');
  ov.style.display='flex';
  ov.innerHTML=`
    <div id="menuScreen">
      ${html}
      <div style="display:flex;gap:10px;margin-top:14px">
        <button class="btn" onclick="startGame()">REJOUER</button>
        <button class="btn secondary" onclick="goMenu()">MENU</button>
      </div>
    </div>
  `;
}

function goMenu(){
  const ov=document.getElementById('screenOverlay');
  ov.style.display='flex';
  ov.innerHTML=document.getElementById('_menuTemplate')?.innerHTML||'';
  location.reload(); // simplest reset
}

// ═══════════════════════════════════════════════════════
// RENDERING
// ═══════════════════════════════════════════════════════
const bgDecos = Array.from({length:55},()=>({
  x:Math.random()*800, y:Math.random()*600,
  r:0.5+Math.random()*1.5, b:Math.random()*Math.PI*2
}));
let time=0;

function drawZones(){
  // Boost pads — bright green arrows
  boostPads.forEach(p=>{
    ctx.save();
    ctx.translate(p.x, p.y);
    const pulse = 0.85 + 0.15*Math.sin(time*0.12);
    ctx.globalAlpha = 0.75 * pulse;
    // Glow
    const g=ctx.createRadialGradient(0,0,2,0,0,p.r+4);
    g.addColorStop(0,'rgba(0,255,120,0.7)');
    g.addColorStop(1,'rgba(0,255,120,0)');
    ctx.fillStyle=g;
    ctx.beginPath(); ctx.arc(0,0,p.r+4,0,Math.PI*2); ctx.fill();
    // Arrow chevrons
    ctx.globalAlpha = 0.9 * pulse;
    ctx.strokeStyle='#00FF88'; ctx.lineWidth=3; ctx.lineCap='round';
    [-8,0,8].forEach(off=>{
      ctx.beginPath();
      ctx.moveTo(-7, off-6); ctx.lineTo(0, off+2); ctx.lineTo(7, off-6);
      ctx.stroke();
    });
    ctx.globalAlpha=1;
    ctx.restore();
  });

  // Slow zones — mud patches
  slowZones.forEach(p=>{
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.globalAlpha = 0.65;
    const g=ctx.createRadialGradient(0,0,4,0,0,p.r+6);
    g.addColorStop(0,'rgba(100,60,0,0.85)');
    g.addColorStop(0.7,'rgba(80,40,0,0.5)');
    g.addColorStop(1,'rgba(60,30,0,0)');
    ctx.fillStyle=g;
    ctx.beginPath(); ctx.ellipse(0,0,p.r+6,p.r+2,0,0,Math.PI*2); ctx.fill();
    // Mud splatter dots
    ctx.fillStyle='#6B3A00';
    [[0,0],[5,-4],[-6,3],[3,6],[-3,-5],[7,2]].forEach(([dx,dy])=>{
      ctx.beginPath(); ctx.arc(dx,dy,2+Math.random(),0,Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha=1;
    ctx.restore();
  });

  // Weather indicator top-centre
  if(weather==='rain'){
    ctx.save();
    ctx.fillStyle='rgba(80,140,255,0.18)';
    ctx.fillRect(0,0,800,600);
    // Rain status tag
    ctx.fillStyle='rgba(0,0,30,0.75)';
    ctx.beginPath(); ctx.roundRect(300,4,200,22,11); ctx.fill();
    ctx.fillStyle='#88BBFF'; ctx.font='7px monospace';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('🌧️  PLUIE — PISTE GLISSANTE  🌧️', 400, 15);
    ctx.restore();
  }

  // Clean-lap streak indicator (if >0)
  if(cleanLapStreak>0 && gameState==='race'){
    ctx.save();
    ctx.fillStyle='rgba(0,20,0,0.7)';
    ctx.beginPath(); ctx.roundRect(6,50,110,18,9); ctx.fill();
    ctx.fillStyle='#00FF88'; ctx.font='6px monospace';
    ctx.textAlign='left'; ctx.textBaseline='middle';
    ctx.fillText('🔥 COMBO x'+cleanLapStreak+' (+'+Math.min(cleanLapStreak*4,12)+'%)', 14, 59);
    ctx.restore();
  }
}

function drawRain(){
  if(weather!=='rain') return;
  ctx.save();
  rainDrops.forEach(d=>{
    ctx.strokeStyle=`rgba(180,210,255,${d.a})`;
    ctx.lineWidth=1;
    ctx.beginPath();
    ctx.moveTo(d.x,d.y);
    ctx.lineTo(d.x+d.vx*0.8, d.y+d.len);
    ctx.stroke();
  });
  ctx.restore();
}

function drawTrack(){
  // Grass
  ctx.fillStyle='#1b5c1b';
  ctx.fillRect(0,0,800,600);

  // Decorative grass dots
  bgDecos.forEach(d=>{
    d.b+=0.015;
    const a=0.18+0.25*Math.abs(Math.sin(d.b));
    ctx.fillStyle=`rgba(255,255,180,${a})`;
    ctx.beginPath(); ctx.arc(d.x,d.y,d.r,0,Math.PI*2); ctx.fill();
  });

  const tp=trackPath;
  const pathFn=(lw,col)=>{
    ctx.strokeStyle=col; ctx.lineWidth=lw;
    ctx.lineCap='round'; ctx.lineJoin='round';
    ctx.beginPath();
    tp.forEach((p,i)=>i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y));
    ctx.stroke();
  };

  pathFn(TRACK_WIDTH+16,'#222');        // shadow
  pathFn(TRACK_WIDTH,'#4d4d4d');        // asphalt

  // Centre dashes
  ctx.strokeStyle='rgba(255,255,255,.13)';
  ctx.lineWidth=2; ctx.setLineDash([22,16]);
  ctx.beginPath();
  tp.forEach((p,i)=>i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y));
  ctx.stroke(); ctx.setLineDash([]);

  // Kerbs (red/white dots on border)
  for(let i=0;i<tp.length-1;i++){
    const p=tp[i],nx2=tp[i+1];
    const dx=nx2.x-p.x,dy=nx2.y-p.y,len=Math.sqrt(dx*dx+dy*dy);
    if(len===0)continue;
    const nx=-dy/len,ny=dx/len,off=TRACK_WIDTH*.51+2;
    ctx.fillStyle=i%20<10?'#CC2222':'#ffffff';
    ctx.beginPath();ctx.arc(p.x+nx*off,p.y+ny*off,3,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(p.x-nx*off,p.y-ny*off,3,0,Math.PI*2);ctx.fill();
  }

  // White border
  pathFn(3,'rgba(255,255,255,.55)');

  // Start/Finish
  const s=tp[0],nx2=tp[1];
  const dx=nx2.x-s.x,dy=nx2.y-s.y,len=Math.sqrt(dx*dx+dy*dy);
  const nx=-dy/len*TRACK_WIDTH*.5,ny=dx/len*TRACK_WIDTH*.5;
  for(let i=0;i<8;i++){
    ctx.fillStyle=i%2===0?'#fff':'#000';
    ctx.fillRect(s.x+nx*(2/8*i-1)-3, s.y+ny*(2/8*i-1)-2, Math.abs(nx)*2/8+1, TRACK_WIDTH/8);
  }
  ctx.save();
  ctx.translate(s.x,s.y);
  ctx.rotate(Math.atan2(dy,dx)-Math.PI/2);
  ctx.fillStyle='#FFD700';
  ctx.font='bold 9px monospace';
  ctx.textAlign='center';
  ctx.fillText('START',0,-TRACK_WIDTH*.56-4);
  ctx.restore();
}

function drawItemBoxes(){
  itemBoxes.forEach(box=>{
    if(!box.active)return;
    ctx.save();
    ctx.translate(box.x,box.y);
    ctx.rotate(time*.025);
    const pulse=1+.1*Math.sin(time*.09);
    ctx.scale(pulse,pulse);
    const g=ctx.createRadialGradient(0,0,2,0,0,18);
    g.addColorStop(0,'rgba(255,215,0,.85)');
    g.addColorStop(1,'rgba(255,80,0,0)');
    ctx.fillStyle=g; ctx.fillRect(-18,-18,36,36);
    ctx.fillStyle='#FFD700'; ctx.strokeStyle='#fff'; ctx.lineWidth=2;
    ctx.fillRect(-11,-11,22,22); ctx.strokeRect(-11,-11,22,22);
    ctx.fillStyle='#FF3300'; ctx.font='bold 15px serif';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('?',0,1);
    ctx.restore();
  });
}

function drawShells(){
  shells.forEach(s=>{
    ctx.save(); ctx.translate(s.x,s.y);
    ctx.fillStyle='#22AAFF'; ctx.strokeStyle='#fff'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.arc(0,0,7,0,Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.restore();
  });
}

function drawParticles(){
  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i];
    p.x+=p.vx; p.y+=p.vy; p.vx*=.92; p.vy*=.92; p.life--; p.size*=.95;
    if(p.life<=0){particles.splice(i,1);continue;}
    const a=Math.max(0,p.life/60);
    ctx.fillStyle=p.color+Math.floor(a*255).toString(16).padStart(2,'0');
    ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill();
  }
}

function lighten(hex,n){
  const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  return `rgb(${Math.min(255,r+n)},${Math.min(255,g+n)},${Math.min(255,b+n)})`;
}

function drawKart(k, isPlayer){
  if(k.eliminated){ // ghost effect
    ctx.save(); ctx.globalAlpha=.25;
  } else {
    ctx.save();
  }
  ctx.translate(k.x,k.y);

  if(k.starTimer>0){
    const cols=['#FFD700','#FF6B00','#FF2200'];
    const c=cols[Math.floor(time*.3)%cols.length];
    ctx.shadowColor=c; ctx.shadowBlur=22;
    const g=ctx.createRadialGradient(0,0,5,0,0,26);
    g.addColorStop(0,c+'88'); g.addColorStop(1,'transparent');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,0,26,0,Math.PI*2); ctx.fill();
  }

  ctx.rotate(k.angle+Math.PI/2);

  // Shadow
  ctx.fillStyle='rgba(0,0,0,.3)';
  ctx.beginPath(); ctx.ellipse(3,4,13,9,0,0,Math.PI*2); ctx.fill();

  // Body
  const bodyCol=k.starTimer>0?`hsl(${time*14%360},100%,58%)`:k.color;
  ctx.fillStyle=bodyCol;
  ctx.beginPath(); ctx.roundRect(-9,-13,18,24,4); ctx.fill();
  // Shine
  ctx.fillStyle='rgba(255,255,255,.18)';
  ctx.beginPath(); ctx.ellipse(-2,-7,4,3,-.4,0,Math.PI*2); ctx.fill();

  // Cockpit
  ctx.fillStyle=k.starTimer>0?'#fff':lighten(k.color,45);
  ctx.beginPath(); ctx.ellipse(0,-3,5,5,0,0,Math.PI*2); ctx.fill();

  // Wheels
  ctx.fillStyle='#1a1a1a';
  [[-11,-9],[11,-9],[-11,8],[11,8]].forEach(([wx,wy])=>{
    ctx.save(); ctx.translate(wx,wy); ctx.rotate(time*.25);
    ctx.fillRect(-3,-4,6,8); ctx.restore();
  });

  // Exhaust smoke
  const vel=Math.sqrt(k.vx*k.vx+k.vy*k.vy);
  if(vel>1.5&&k.onTrack&&Math.random()<.4){
    spawnFx(k.x-Math.cos(k.angle)*13, k.y-Math.sin(k.angle)*13,'#888888',1,1.5);
  }

  // Name tag (CPU)
  if(!isPlayer){
    ctx.rotate(-(k.angle+Math.PI/2));
    ctx.fillStyle='rgba(0,0,0,.65)';
    ctx.fillRect(-17,-30,34,11);
    ctx.fillStyle=k.color; ctx.font='6px monospace';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(k.name,0,-24);
  }

  ctx.restore();
}

function drawMinimap(){
  mctx.fillStyle='#0c1420';
  mctx.fillRect(0,0,130,100);

  mctx.strokeStyle='#3a3a3a'; mctx.lineWidth=6;
  mctx.beginPath();
  trackPath.forEach((p,i)=>{
    const mx=p.x/800*130,my=p.y/600*100;
    i===0?mctx.moveTo(mx,my):mctx.lineTo(mx,my);
  });
  mctx.stroke();

  mctx.strokeStyle='#555'; mctx.lineWidth=4;
  mctx.beginPath();
  trackPath.forEach((p,i)=>{
    const mx=p.x/800*130,my=p.y/600*100;
    i===0?mctx.moveTo(mx,my):mctx.lineTo(mx,my);
  });
  mctx.stroke();

  allKarts.forEach(k=>{
    if(k.eliminated)return;
    const mx=k.x/800*130,my=k.y/600*100;
    mctx.fillStyle=k===player?'#FF4444':k.color;
    mctx.beginPath();
    if(k===player){ mctx.arc(mx,my,4.5,0,Math.PI*2); }
    else { mctx.arc(mx,my,3,0,Math.PI*2); }
    mctx.fill();
    if(k===player){
      mctx.strokeStyle='#fff'; mctx.lineWidth=1;
      mctx.beginPath(); mctx.arc(mx,my,4.5,0,Math.PI*2); mctx.stroke();
    }
  });
}

// ═══════════════════════════════════════════════════════
// MAIN LOOP
// ═══════════════════════════════════════════════════════
function loop(now){
  requestAnimationFrame(loop);
  if(gameState==='menu') return;
  time++;

  // Countdown
  if(gameState==='countdown'){
    cdTimer++;
    if(cdTimer>60){ countdown--; cdTimer=0; }
    if(countdown<=0){
      gameState='race';
      startTime=now;
      lapStartTime=now;
      if(selectedMode==='elim'){ elimActive=true; lastElimTime=now; }
    }
  }

  // Weather
  if(gameState==='race') updateWeather();

  // Race update
  if(gameState==='race'&&!raceFinished){
    updatePlayer();
    cpus.forEach(c=>updateCPU(c));
    checkCollisions();
    allKarts.forEach(k=>checkLap(k));
    updateHUD(now);
    if(selectedMode==='elim') updateElim(now);
  }

  // Draw
  drawTrack();
  drawZones();
  drawRain();
  drawItemBoxes();
  drawParticles();
  drawShells();
  allKarts.forEach(k=>drawKart(k,k===player));
  drawMinimap();

  // Countdown overlay
  if(gameState==='countdown'){
    ctx.fillStyle='rgba(0,0,10,.55)';
    ctx.fillRect(0,0,800,600);
    ctx.fillStyle='#FFD700';
    ctx.shadowColor='#FF6B00'; ctx.shadowBlur=50;
    ctx.font='bold 88px monospace';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(countdown>0?countdown:'GO!',400,300);
    ctx.shadowBlur=0;
  }
}

// ═══════════════════════════════════════════════════════
// POLYFILL
// ═══════════════════════════════════════════════════════
if(!CanvasRenderingContext2D.prototype.roundRect){
  CanvasRenderingContext2D.prototype.roundRect=function(x,y,w,h,r){
    this.beginPath();
    this.moveTo(x+r,y); this.lineTo(x+w-r,y);
    this.quadraticCurveTo(x+w,y,x+w,y+r);
    this.lineTo(x+w,y+h-r);
    this.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    this.lineTo(x+r,y+h);
    this.quadraticCurveTo(x,y+h,x,y+h-r);
    this.lineTo(x,y+r);
    this.quadraticCurveTo(x,y,x+r,y);
    this.closePath();
  };
}

requestAnimationFrame(loop);