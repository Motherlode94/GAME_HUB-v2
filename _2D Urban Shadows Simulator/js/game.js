(function(){
"use strict";
/* ═══════════════════════════════════════════════════
   URBAN SHADOWS v4 — Rebel Cops Style
   Clic sur la carte → menu radial → action visuelle
═══════════════════════════════════════════════════ */

const SAVE_KEY = "usv4";
const MAX_AP   = 2;

const PHASES = [
  {id:"police",tag:"POLICE",num:"01",acc:"#3da5ff",glow:"rgba(61,165,255,.25)",
   label:"Police Simulator",sub:"Maintenir l'ordre"},
  {id:"prison",tag:"PRISON",num:"02",acc:"#8fa0b0",glow:"rgba(143,160,176,.2)",
   label:"Prison Simulator",sub:"Contrôle ou chaos"},
  {id:"gang",  tag:"GANG",  num:"03",acc:"#f87171",glow:"rgba(248,113,113,.25)",
   label:"Gang Simulator",sub:"Territoire ou mort"},
  {id:"ninja", tag:"NINJA", num:"04",acc:"#a78bfa",glow:"rgba(167,139,250,.25)",
   label:"Ninja Assassin",sub:"L'ombre protège"},
];

/* ── DOM ── */
const G   = id => document.getElementById(id);
const cvs = G("map");
const ctx = cvs.getContext("2d");
const bgC = G("bg-canvas");
const bgX = bgC.getContext("2d");

let W = 0, H = 0;
let state = null, pulse = 0, titlePulse = 0;
let radial = null;   // menu radial ouvert
let pendingEv = null;
const VFX = [];      // effets visuels temporaires
const FLOATS = [];   // chiffres flottants

/* ═══════════════════════════════════════
   ÉTAT
═══════════════════════════════════════ */
function mkState(){
  return {
    started:false, name:"Shadow", day:1, pi:0, ap:MAX_AP, over:false,
    s:{cash:1400,hp:84,heat:22,inf:34,stealth:28},
    ps:{
      police:{rank:1,cases:0,trust:46,ops:0},
      prison:{order:48,fac:42,inmates:320,contra:58},
      gang:  {turf:26,crew:18,fear:20,rackets:0},
      ninja: {contracts:0,focus:40,rep:24,marks:0},
    },
    done:[], score:0, log:[],
    units:[],           // unités animées sur la carte
    zoneFx:[],          // flash de zone
    // ── NOUVELLES FEATURES ──
    streak:0,           // succès consécutifs sans "bad"
    streakMult:1,       // multiplicateur actuel (1x, 1.5x, 2x, 3x)
    weather:null,       // météo du jour
    mapEvents:[],       // événements éphémères sur la carte
    dayScoreStart:0,    // score au début du jour pour AP bonus
    bonusApUsed:false,  // AP bonus déjà accordé ce jour
  };
}
const ph  = () => PHASES[state.pi];
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const ri  =(a,b)=>Math.floor(Math.random()*(b-a+1))+a;

function apS(d){ Object.keys(d).forEach(k=>{ if(k in state.s) state.s[k]+=d[k]; }); norm(); }
function apP(pid,d){ const t=state.ps[pid]; Object.keys(d).forEach(k=>{ if(k in t) t[k]+=d[k]; }); norm(); }

function norm(){
  const s=state.s;
  s.cash=clamp(s.cash,-9999,200000); s.hp=clamp(s.hp,0,100);
  s.heat=clamp(s.heat,0,100); s.inf=clamp(s.inf,0,100); s.stealth=clamp(s.stealth,0,100);
  const p=state.ps;
  p.police.rank=clamp(p.police.rank,1,12); p.police.cases=clamp(p.police.cases,0,80);
  p.police.trust=clamp(p.police.trust,0,100);
  p.prison.order=clamp(p.prison.order,0,100); p.prison.fac=clamp(p.prison.fac,0,100);
  p.prison.contra=clamp(p.prison.contra,0,100);
  p.gang.turf=clamp(p.gang.turf,0,100); p.gang.crew=clamp(p.gang.crew,0,120);
  p.gang.fear=clamp(p.gang.fear,0,100);
  p.ninja.contracts=clamp(p.ninja.contracts,0,80); p.ninja.focus=clamp(p.ninja.focus,0,100);
  p.ninja.rep=clamp(p.ninja.rep,0,100);
}

/* ═══════════════════════════════════════
   MÉTÉO DYNAMIQUE
═══════════════════════════════════════ */
const WEATHERS = [
  {id:"sunny",  icon:"☀️", label:"BEAU TEMPS",  desc:"Visibilité maximale.",       color:"#f0b429", fx:{stealth:-2,heat:1,cash:30}},
  {id:"rain",   icon:"🌧️", label:"PLUIE",       desc:"Couverture naturelle.",      color:"#3da5ff", fx:{stealth:3,heat:-2,cash:-20,hp:-1}},
  {id:"fog",    icon:"🌫️", label:"BROUILLARD",  desc:"Parfait pour disparaître.", color:"#8fa0b0", fx:{stealth:5,heat:-3,inf:-1}},
  {id:"storm",  icon:"⛈️", label:"TEMPÊTE",     desc:"Opérations risquées.",      color:"#a78bfa", fx:{stealth:2,heat:-1,hp:-3,cash:-50}},
  {id:"hot",    icon:"🔆", label:"CANICULE",    desc:"Tension maximale.",          color:"#f87171", fx:{heat:4,hp:-2,cash:20}},
  {id:"night",  icon:"🌙", label:"NUIT NOIRE",  desc:"L'ombre protège.",           color:"#6d7caf", fx:{stealth:6,inf:2,heat:-1,cash:-30}},
];

function rollWeather(){
  const w = WEATHERS[ri(0,WEATHERS.length-1)];
  state.weather = {...w, pulse:0};
  apS(w.fx);
  addLog(`Météo : ${w.label} — ${w.desc}`, "ev");
  toast(`${w.icon} ${w.label} — ${w.desc}`, w.color);
}

/* ═══════════════════════════════════════
   ÉVÉNEMENTS CARTE (ÉPHÉMÈRES)
═══════════════════════════════════════ */
const MAP_EVENT_POOL = [
  {id:"loot",    icon:"💼", label:"VALISE",      color:"#f0b429", ttl:180, run(){apS({cash:240,heat:3}); addLog("Valise récupérée — cash rapide.","ok"); return "+240¥"}},
  {id:"intel",   icon:"📁", label:"DOSSIER",     color:"#3da5ff", ttl:160, run(){apS({inf:8,stealth:2}); addLog("Dossier compromettant récupéré.","ok"); return "+Influence"}},
  {id:"ambush",  icon:"⚠️", label:"EMBUSCADE",   color:"#f87171", ttl:140, run(){apS({hp:-10,heat:8,cash:160}); addLog("Embuscade — blessé mais survécu.","bad"); return "-HP +Cash"}},
  {id:"contact", icon:"🎭", label:"CONTACT",     color:"#a78bfa", ttl:170, run(){apS({inf:5,cash:120,stealth:3}); addLog("Contact mystérieux — bonne affaire.","ok"); return "+Influence +Cash"}},
  {id:"cache",   icon:"🔫", label:"PLANQUE",     color:"#8fa0b0", ttl:150, run(){apS({stealth:4,hp:6,cash:80}); addLog("Planque découverte — ressources récupérées.","ok"); return "+HP +Furtivité"}},
  {id:"trap",    icon:"🪤", label:"PIÈGE",       color:"#f87171", ttl:130, run(){apS({heat:10,hp:-7,stealth:-4}); addLog("Piège — situation critique.","bad"); return "-HP -Furtivité"}},
  {id:"bonus",   icon:"⭐", label:"OPPORTUNITÉ", color:"#4ade80", ttl:200, run(){apS({cash:180,inf:4,hp:4}); addLog("Opportunité saisie — bonus général.","ok"); return "+Cash +Santé"}},
];

function spawnMapEvent(){
  if(state.mapEvents.length>=3) return;
  const zones=makeZones(ph().id);
  const zone=zones[ri(0,zones.length-1)];
  // éviter doublon sur même zone
  if(state.mapEvents.find(e=>e.zoneId===zone.id)) return;
  const tpl=MAP_EVENT_POOL[ri(0,MAP_EVENT_POOL.length-1)];
  state.mapEvents.push({
    ...tpl,
    zoneId:zone.id,
    zone,
    life:tpl.ttl,
    maxLife:tpl.ttl,
    spawnPulse:pulse,
  });
}

function tickMapEvents(){
  state.mapEvents.forEach(e=>e.life--);
  const expired=state.mapEvents.filter(e=>e.life<=0);
  expired.forEach(e=>{ if(Math.random()<.4) addLog(`${e.icon} ${e.label} expiré.`,""); });
  state.mapEvents=state.mapEvents.filter(e=>e.life>0);
}

function clickMapEvent(mx, my){
  for(let i=0;i<state.mapEvents.length;i++){
    const e=state.mapEvents[i];
    const c=zoneCenter(e.zone);
    const dx=mx-c.x, dy=my-c.y;
    if(dx*dx+dy*dy<28*28){
      const result=e.run();
      spawnVfx(e.id==="ambush"||e.id==="trap"?"boom":"cash", e.zone);
      float(e.zone, result, e.color);
      toast(`${e.icon} ${e.label}: ${result}`, e.color);
      calcScore();
      state.mapEvents.splice(i,1);
      renderHUD();
      return true;
    }
  }
  return false;
}

/* ═══════════════════════════════════════
   STREAK
═══════════════════════════════════════ */
function registerStreak(success){
  if(success){
    state.streak++;
    if(state.streak===3){state.streakMult=1.5; toast("🔥 STREAK x1.5 !","#f0b429");}
    else if(state.streak===5){state.streakMult=2; toast("🔥🔥 STREAK x2 !","#f87171");}
    else if(state.streak>=8){state.streakMult=3; toast("🔥🔥🔥 STREAK x3 !","#a78bfa");}
  } else {
    if(state.streak>=3) toast(`Streak brisée (${state.streak} actions).`,"#8fa0b0");
    state.streak=0; state.streakMult=1;
  }
}

function applyStreakBonus(){
  if(state.streakMult<=1) return;
  const bonus=Math.round((state.streakMult-1)*60);
  apS({cash:bonus, inf:1});
}

/* ═══════════════════════════════════════
   AP BONUS
═══════════════════════════════════════ */
function checkApBonus(){
  if(state.bonusApUsed) return;
  const gained=state.score - state.dayScoreStart;
  if(gained>=1800){
    state.ap=Math.min(state.ap+1, MAX_AP+1);
    state.bonusApUsed=true;
    toast("⚡ AP BONUS — Score du jour élevé !","#4ade80");
    addLog("AP bonus accordé — performance exceptionnelle.","ok");
    renderHUD();
  }
}

function addLog(txt, cls=""){
  state.log.unshift({txt:`[J${state.day}] ${txt}`, cls});
  state.log=state.log.slice(0,40);
}

function calcScore(){
  const s=state.s, p=state.ps;
  state.score=Math.max(0,Math.round(
    state.day*28+s.cash/7+s.hp*15+(100-s.heat)*12+s.inf*9+s.stealth*10+
    p.police.rank*130+p.police.cases*48+p.police.trust*9+
    p.prison.order*9+p.prison.fac*8+(100-p.prison.contra)*7+
    p.gang.turf*10+p.gang.crew*6+p.gang.fear*7+
    p.ninja.contracts*140+p.ninja.focus*7+p.ninja.rep*9+
    state.done.length*1200));
}

/* ═══════════════════════════════════════
   CARTE — ZONES CLIQUABLES
   Chaque zone est un rectangle sur la carte.
   On définit les zones en proportion (0..1)
   et on les adapte à la taille du canvas.
═══════════════════════════════════════ */
function makeZones(pid){
  /* Zones communes + zones spécifiques à la phase */
  const base = [
    /* Quartiers résidentiels */
    {id:"resi1",  x:.05, y:.1,  w:.12, h:.28, label:"NORD EST",   type:"residential"},
    {id:"resi2",  x:.05, y:.44, w:.12, h:.28, label:"SUD EST",    type:"residential"},
    {id:"resi3",  x:.83, y:.1,  w:.12, h:.28, label:"NORD WEST",  type:"residential"},
    {id:"resi4",  x:.83, y:.44, w:.12, h:.28, label:"SUD WEST",   type:"residential"},
    /* Zones centrales (actions phase) */
    {id:"z1",     x:.22, y:.08, w:.16, h:.24, label:"DISTRICT A", type:"main"},
    {id:"z2",     x:.42, y:.08, w:.16, h:.24, label:"DISTRICT B", type:"main"},
    {id:"z3",     x:.62, y:.08, w:.16, h:.24, label:"DISTRICT C", type:"main"},
    {id:"z4",     x:.22, y:.38, w:.16, h:.24, label:"DISTRICT D", type:"main"},
    {id:"z5",     x:.42, y:.38, w:.16, h:.24, label:"DISTRICT E", type:"main"},
    {id:"z6",     x:.62, y:.38, w:.16, h:.24, label:"DISTRICT F", type:"main"},
    /* Zone spéciale centrale */
    {id:"hq",     x:.38, y:.7,  w:.24, h:.2,  label:"QUARTIER GÉNÉRAL", type:"hq"},
  ];

  /* Labels et couleurs par phase */
  const phaseConfig = {
    police:{
      z1:{label:"COMMISSARIAT",icon:"🚔"},z2:{label:"ZONE CHAUDE",icon:"🔥"},z3:{label:"PATROUILLE",icon:"🚨"},
      z4:{label:"COMMUNAUTÉ",icon:"🏫"},z5:{label:"TRIBUNAL",icon:"⚖️"},z6:{label:"INDICS",icon:"📡"},
      hq:{label:"POSTE CENTRAL",icon:"🏛️"},
      resi1:{label:"BLOC A",icon:"🏢"},resi2:{label:"BLOC B",icon:"🏢"},
      resi3:{label:"BLOC C",icon:"🏢"},resi4:{label:"BLOC D",icon:"🏢"},
    },
    prison:{
      z1:{label:"BLOC A",icon:"🔒"},z2:{label:"BLOC B",icon:"🔒"},z3:{label:"COUR",icon:"⛓️"},
      z4:{label:"REHAB",icon:"📚"},z5:{label:"CUISINE",icon:"🍽️"},z6:{label:"GARAGE",icon:"🔧"},
      hq:{label:"DIRECTION",icon:"🏛️"},
      resi1:{label:"CELLULE",icon:"🔐"},resi2:{label:"INFIRMERIE",icon:"🏥"},
      resi3:{label:"WATCHTOWER",icon:"🗼"},resi4:{label:"SALLE GARDE",icon:"🛡️"},
    },
    gang:{
      z1:{label:"TURF NORD",icon:"🔴"},z2:{label:"PLANQUE",icon:"🏚️"},z3:{label:"DEAL POINT",icon:"💊"},
      z4:{label:"RACKET",icon:"💰"},z5:{label:"GARAGE",icon:"🚗"},z6:{label:"TURF SUD",icon:"🔴"},
      hq:{label:"SIÈGE",icon:"☠️"},
      resi1:{label:"SENTINELLE",icon:"👁️"},resi2:{label:"RECRUE",icon:"👥"},
      resi3:{label:"SENTINELLE",icon:"👁️"},resi4:{label:"RECRUE",icon:"👥"},
    },
    ninja:{
      z1:{label:"CIBLE A",icon:"🎯"},z2:{label:"CIBLE B",icon:"🎯"},z3:{label:"ROUTE FUITE",icon:"🌫️"},
      z4:{label:"ENTRAÎNEM.",icon:"🥋"},z5:{label:"CONTACT",icon:"🎭"},z6:{label:"CIBLE C",icon:"🎯"},
      hq:{label:"SANCTUAIRE",icon:"⛩️"},
      resi1:{label:"TOITS",icon:"🏙️"},resi2:{label:"ÉGOUTS",icon:"🔦"},
      resi3:{label:"TOITS",icon:"🏙️"},resi4:{label:"ÉGOUTS",icon:"🔦"},
    },
  };
  const cfg=phaseConfig[pid]||{};
  return base.map(z=>({
    ...z,
    ...(cfg[z.id]||{}),
  }));
}

/* Actions disponibles par zone et phase */
function zoneActions(zoneId, pid){
  const ALL = getActions(pid);
  /* Map zone → indices d'actions */
  const map = {
    police:{
      z1:["patrol","informant"],  z2:["raid","undercover"],  z3:["patrol","undercover"],
      z4:["community","audit"],   z5:["audit","informant"],  z6:["undercover","informant"],
      hq:["patrol","audit"],      resi1:["patrol"],          resi2:["patrol"],
      resi3:["community"],        resi4:["community"],
    },
    prison:{
      z1:["inspect","lockdown"],  z2:["inspect","lockdown"],  z3:["rehab","mediate"],
      z4:["rehab","training"],    z5:["sting","mediate"],      z6:["training","sting"],
      hq:["inspect","training"],  resi1:["lockdown"],          resi2:["rehab"],
      resi3:["inspect"],          resi4:["mediate"],
    },
    gang:{
      z1:["recruit","turfwar"],   z2:["extort","laundry"],    z3:["extort","smuggle"],
      z4:["bribe","laundry"],     z5:["smuggle","recruit"],   z6:["turfwar","recruit"],
      hq:["bribe","laundry"],     resi1:["recruit"],          resi2:["extort"],
      resi3:["turfwar"],          resi4:["bribe"],
    },
    ninja:{
      z1:["takedown","contract"], z2:["takedown","contract"], z3:["vanish","recon"],
      z4:["training","recon"],    z5:["forge","vanish"],      z6:["contract","takedown"],
      hq:["training","forge"],    resi1:["recon"],            resi2:["vanish"],
      resi3:["recon"],            resi4:["forge"],
    },
  };
  const ids = (map[pid]||{})[zoneId] || [];
  return ids.map(id=>ALL.find(a=>a.id===id)).filter(Boolean);
}

/* ═══════════════════════════════════════
   ACTIONS
═══════════════════════════════════════ */
function getActions(pid){
  if(pid==="police") return [
    {id:"patrol",     icon:"🚔",name:"Patrouille",   risk:"low",    desc:"Présence visible dans les rues.",       impact:"+Confiance +Influence",
     run(z){apP("police",{trust:5+ri(0,3),ops:1});apS({inf:2,stealth:-1,heat:-2,hp:-1,cash:20});spawnUnit("police_car",z);float(z,"+Trust","#4ade80");addLog("Patrouille stabilise le secteur.","ok")}},
    {id:"undercover", icon:"🕵️",name:"Infiltration", risk:"high",   desc:"Opération secrète — risque élevé.",     impact:"+Affaires +Rang",
     run(z){const f=Math.random()<.28;apP("police",{cases:2+ri(1,f?3:1),rank:1,ops:2});apS({cash:120+ri(0,80),heat:7,hp:-6,inf:1,stealth:2});spawnVfx("boom",z);float(z,f?"COUP DUR!":"+Affaires","#3da5ff");addLog(f?"Infiltration exceptionnelle!":"Opération undercover exécutée.","ok")}},
    {id:"community",  icon:"🏫",name:"Communauté",   risk:"low",    desc:"Programmes de proximité.",              impact:"+Confiance +Santé",
     run(z){apP("police",{trust:9,ops:1});apS({cash:-120,hp:5,inf:3,heat:-1});spawnUnit("citizen",z);float(z,"+Confiance","#4ade80");addLog("Programmes communautaires lancés.","ok")}},
    {id:"audit",      icon:"🔍",name:"Audit",         risk:"low",    desc:"Purger la corruption interne.",         impact:"+Rang +Confiance",
     run(z){apP("police",{trust:5,rank:1});apS({inf:-2,heat:-4,cash:40,stealth:1});float(z,"+Rang","#3da5ff");addLog("Audit interne — chaîne assainie.","ok")}},
    {id:"raid",       icon:"🚁",name:"Raid",           risk:"high",   desc:"Frappe tactique sur les hotspots.",     impact:"+Cash +Affaires",
     run(z){const f=Math.random()<.2;if(f){apS({hp:-10,heat:14});spawnVfx("boom",z);float(z,"PIÈGE!","#f87171");addLog("Raid tourne mal — embuscade.","bad")}else{apP("police",{cases:3,ops:2,trust:2});apS({cash:190,heat:9,hp:-7,inf:1});spawnVfx("explosion",z);float(z,"+190¥","#f0b429");addLog("Raid — arsenal illégal saisi.","ok")}}},
    {id:"informant",  icon:"📡",name:"Indics",         risk:"medium", desc:"Recruter un réseau d'informateurs.",    impact:"+Affaires +Furtivité",
     run(z){apP("police",{cases:1+ri(1,2)});apS({cash:-90,stealth:3,inf:2,heat:-1});spawnUnit("informant",z);float(z,"+Affaires","#3da5ff");addLog("Réseau d'informateurs activé.","ok")}},
  ];
  if(pid==="prison") return [
    {id:"inspect",  icon:"🔦",name:"Fouille",         risk:"low",   desc:"Inspection cellules à risque.",        impact:"+Ordre −Contrebande",
     run(z){apP("prison",{order:7,contra:-8});apS({heat:4,hp:-2,inf:1,cash:35});spawnUnit("guard",z);float(z,"+Ordre","#4ade80");addLog("Fouille — objets confisqués.","ok")}},
    {id:"rehab",    icon:"📚",name:"Réhabilitation",  risk:"low",   desc:"Éducation et réintégration.",          impact:"+Facilité +Ordre",
     run(z){apP("prison",{fac:9,order:5,contra:-3});apS({cash:-160,inf:4,hp:2,heat:-2});float(z,"+Facilité","#4ade80");addLog("Programme de réhabilitation activé.","ok")}},
    {id:"lockdown", icon:"🔒",name:"Confinement",     risk:"medium",desc:"Contrôle strict d'urgence.",           impact:"+Ordre −Santé",
     run(z){apP("prison",{order:12,contra:-6,fac:-2});apS({heat:7,hp:-6,inf:-1,cash:-50});spawnVfx("lock",z);float(z,"LOCKDOWN","#f87171");addLog("Confinement 24h imposé.","ok")}},
    {id:"training", icon:"🎯",name:"Formation",       risk:"low",   desc:"Améliorer les procédures du personnel.","impact":"+Facilité +Ordre",
     run(z){apP("prison",{fac:8,order:4,contra:-2});apS({cash:-130,inf:2,hp:-1});float(z,"+Facilité","#4ade80");addLog("Formation — niveau tactique amélioré.","ok")}},
    {id:"sting",    icon:"🕸️",name:"Infiltration",   risk:"high",  desc:"Pénétrer le marché noir carcéral.",    impact:"+Cash −Contrebande",
     run(z){const f=Math.random()<.2;if(f){apP("prison",{order:-5,contra:5});apS({hp:-8,heat:8});float(z,"GRILLÉ!","#f87171");addLog("Couverture grillée.","bad")}else{apP("prison",{contra:-12,order:3});apS({cash:170,inf:3,heat:3,hp:-2});spawnVfx("bust",z);float(z,"+170¥","#f0b429");addLog("Réseau de contrebande démantelé.","ok")}}},
    {id:"mediate",  icon:"🤝",name:"Médiation",       risk:"medium",desc:"Négocier une trêve entre factions.",   impact:"+Ordre +Facilité",
     run(z){apP("prison",{order:6,fac:6,contra:-4});apS({inf:-3,heat:-3,cash:60});spawnUnit("mediator",z);float(z,"TRÊVE","#a78bfa");addLog("Trêve entre factions négociée.","ok")}},
  ];
  if(pid==="gang") return [
    {id:"recruit",  icon:"👥",name:"Recruter",       risk:"medium",desc:"Élargir le crew.",                     impact:"+Crew +Territoire",
     run(z){apP("gang",{crew:7,turf:5,fear:3});apS({cash:-130,heat:7,inf:1,hp:-2});spawnUnit("gang_member",z);float(z,"+Crew","#f87171");addLog("Nouveaux soldats recrutés.","ok")}},
    {id:"extort",   icon:"💰",name:"Extorsion",      risk:"medium",desc:"Taxes de protection.",                 impact:"+Cash +Peur",
     run(z){apP("gang",{fear:7,rackets:1,turf:2});apS({cash:270,heat:9,inf:1,stealth:-2});spawnVfx("cash",z);float(z,"+270¥","#f0b429");addLog("Racket actif sur 4 intersections.","ok")}},
    {id:"turfwar",  icon:"⚔️",name:"Guerre",          risk:"high",  desc:"Frappe pour un nouveau district.",     impact:"+Territoire +Peur",
     run(z){const f=Math.random()<.22;if(f){apP("gang",{crew:-8,turf:-4,fear:3});apS({hp:-14,heat:15,cash:-200});spawnVfx("boom",z);float(z,"DÉFAITE","#f87171");addLog("Guerre perdue — retraite forcée.","bad")}else{apP("gang",{turf:11,fear:9,crew:-2,rackets:1});apS({hp:-8,heat:12,cash:130,stealth:-3});spawnVfx("explosion",z);float(z,"+Territoire!","#f87171");addLog("Deux zones conquises.","ok")}}},
    {id:"laundry",  icon:"🏦",name:"Blanchiment",    risk:"medium",desc:"Nettoyer l'argent.",                   impact:"+Cash −Pression",
     run(z){apP("gang",{rackets:1,fear:2});apS({cash:220,heat:-5,inf:5,stealth:2});float(z,"+220¥","#f0b429");addLog("Blanchiment via réseau commercial.","ok")}},
    {id:"bribe",    icon:"🎭",name:"Corruption",     risk:"medium",desc:"Acheter une protection politique.",    impact:"+Influence −Pression",
     run(z){apP("gang",{turf:3,crew:2});apS({cash:-200,heat:-9,inf:9,stealth:1});float(z,"+Influence","#a78bfa");addLog("Officiels achetés — surveillance ralentie.","ok")}},
    {id:"smuggle",  icon:"📦",name:"Trafic",          risk:"high",  desc:"Livraison à haut risque.",             impact:"+Cash +Rackets",
     run(z){const f=Math.random()<.25;if(f){apS({hp:-10,heat:14,cash:-100});float(z,"INTERCEPTÉ","#f87171");addLog("Livraison interceptée.","bad")}else{apP("gang",{rackets:2,fear:4,turf:2});apS({cash:350,heat:8,hp:-4,stealth:-2});spawnVfx("cash",z);float(z,"+350¥","#f0b429");addLog("Livraison réussie.","ok")}}},
  ];
  return [
    {id:"recon",    icon:"🔭",name:"Recon",           risk:"low",   desc:"Observer les routes et cibles.",       impact:"+Furtivité +Focus",
     run(z){apP("ninja",{focus:7,marks:1});apS({stealth:6,hp:-1,heat:-3,cash:50});spawnUnit("ninja_agent",z);float(z,"+Focus","#a78bfa");addLog("Recon silencieuse — itinéraire validé.","ok")}},
    {id:"takedown", icon:"🗡️",name:"Élimination",    risk:"medium",desc:"Neutralisation directe.",              impact:"+Contrats +Réputation",
     run(z){apP("ninja",{contracts:2,rep:7,marks:2,focus:-2});apS({cash:340,hp:-5,stealth:2,heat:-1});spawnVfx("slash",z);float(z,"+Contrat","#a78bfa");addLog("Exécution silencieuse confirmée.","ok")}},
    {id:"training", icon:"🥋",name:"Entraînement",   risk:"low",   desc:"Endurance, précision, réflexes.",     impact:"+Focus +Furtivité +Santé",
     run(z){apP("ninja",{focus:10,rep:1});apS({hp:7,stealth:5,cash:-100,heat:-2});float(z,"+Focus","#a78bfa");addLog("Entraînement nocturne — discipline max.","ok")}},
    {id:"contract", icon:"💎",name:"Gros Contrat",   risk:"high",  desc:"Cible difficile, prime exceptionnelle.",impact:"+Cash +Contrats",
     run(z){const f=Math.random()<.2;if(f){apP("ninja",{focus:-8,rep:-4});apS({hp:-14,heat:12,stealth:-5});float(z,"RATÉ!","#f87171");addLog("Contrat raté — extraction critique.","bad")}else{apP("ninja",{contracts:3,rep:8,marks:3,focus:-4});apS({cash:560,hp:-7,stealth:-1,heat:4});spawnVfx("slash",z);float(z,"+560¥","#f0b429");addLog("Contrat premium exécuté.","ok")}}},
    {id:"vanish",   icon:"🌫️",name:"Disparaître",   risk:"low",   desc:"Effacer les traces.",                 impact:"−Pression +Furtivité",
     run(z){apP("ninja",{focus:6,rep:2});apS({heat:-12,stealth:8,hp:3,cash:-80});spawnVfx("smoke",z);float(z,"−Pression","#4ade80");addLog("Disparition tactique — aucune trace.","ok")}},
    {id:"forge",    icon:"🎭",name:"Identité",        risk:"medium",desc:"Créer une couverture.",               impact:"+Furtivité +Influence",
     run(z){apP("ninja",{rep:4,marks:1});apS({stealth:6,inf:3,cash:-140,heat:-4});float(z,"+Furtivité","#a78bfa");addLog("Nouvelle identité forgée.","ok")}},
  ];
}

/* Objectifs */
function objectives(pid){
  const s=state.s,p=state.ps;
  if(pid==="police") return [
    {l:"Rang",    cur:p.police.rank,  max:5,  ok:p.police.rank>=5},
    {l:"Affaires",cur:p.police.cases, max:8,  ok:p.police.cases>=8},
    {l:"Confiance",cur:p.police.trust,max:72, ok:p.police.trust>=72},
  ];
  if(pid==="prison") return [
    {l:"Ordre",      cur:p.prison.order,            max:78, ok:p.prison.order>=78},
    {l:"Facilité",   cur:p.prison.fac,              max:68, ok:p.prison.fac>=68},
    {l:"Contrebande",cur:100-p.prison.contra,        max:70, ok:p.prison.contra<=30},
  ];
  if(pid==="gang") return [
    {l:"Territoire",cur:p.gang.turf,  max:68, ok:p.gang.turf>=68},
    {l:"Crew",       cur:p.gang.crew, max:52, ok:p.gang.crew>=52},
    {l:"Peur",       cur:p.gang.fear, max:58, ok:p.gang.fear>=58},
  ];
  return [
    {l:"Contrats",  cur:p.ninja.contracts, max:10, ok:p.ninja.contracts>=10},
    {l:"Focus",     cur:p.ninja.focus,     max:76, ok:p.ninja.focus>=76},
    {l:"Réputation",cur:p.ninja.rep,       max:74, ok:p.ninja.rep>=74},
    {l:"Furtivité", cur:s.stealth,         max:78, ok:s.stealth>=78},
  ];
}
const phDone = pid => objectives(pid).every(o=>o.ok);

/* Événements */
const EVENTS = {
  police:[
    {tag:"MÉDIAS",   title:"La Presse Te Surveille", chance:.22, body:"Un journaliste te suit depuis une semaine. Comment tu gères ?",
     choices:[{lab:"Interview exclusive",eff(){apP("police",{trust:12,rank:1});apS({inf:4,cash:60});return"+Trust +Rang"}},{lab:"Refuser — couper contact",eff(){apS({stealth:3,heat:-2});return"+Furtivité"}}]},
    {tag:"CRISE",    title:"Émeute Zone Est",         chance:.18, body:"La situation dégénère. Ta réponse ?",
     choices:[{lab:"Force maximale",eff(){apS({heat:10,hp:-6,cash:100});apP("police",{ops:1,trust:-8});return"+Ops −Trust"}},{lab:"Médiateurs",eff(){apS({heat:-4,inf:3,cash:-80});apP("police",{trust:8});return"+Trust −Pression"}}]},
    {tag:"OPPORT.",  title:"Informateur Surprise",    chance:.15, body:"Un criminel de haut rang veut coopérer.",
     choices:[{lab:"Accepter la coopération",eff(){apP("police",{cases:3,rank:1});apS({cash:200,heat:4});return"+Affaires +Rang"}},{lab:"Refuser — trop risqué",eff(){apS({inf:2,heat:-2});return"+Influence"}}]},
  ],
  prison:[
    {tag:"INSPECT.", title:"Contrôle Ministériel",    chance:.22, body:"Des inspecteurs débarquent à l'improviste.",
     choices:[{lab:"Coopérer pleinement",eff(){apP("prison",{order:8,fac:6,contra:-5});apS({inf:5});return"+Ordre +Facilité"}},{lab:"Dissimuler",eff(){apS({stealth:4,heat:-2,cash:100});return"+Furtivité +Cash"}}]},
    {tag:"RÉVOLTE",  title:"Tentative d'Évasion",     chance:.18, body:"Bloc nord hors de contrôle.",
     choices:[{lab:"Intervention tactique",eff(){apP("prison",{order:6,contra:-8});apS({hp:-8,heat:9});return"+Ordre −Santé"}},{lab:"Négocier la reddition",eff(){apP("prison",{order:-4,fac:4});apS({hp:-2,inf:3});return"+Facilité"}}]},
    {tag:"TRAFIC",   title:"Gardien Corrompu",        chance:.15, body:"Un gardien alimente le marché noir depuis 8 mois.",
     choices:[{lab:"Arrêter et inculper",eff(){apP("prison",{contra:-10,order:4});apS({inf:4,heat:2});return"−Contrebande +Influence"}},{lab:"Double agent",eff(){apP("prison",{contra:-6});apS({cash:150,stealth:3});return"−Contrebande +Cash"}}]},
  ],
  gang:[
    {tag:"ALLIANCE", title:"Proposition de Fusion",   chance:.22, body:"Un gang rival veut unir les opérations.",
     choices:[{lab:"Accepter",eff(){apP("gang",{turf:8,crew:12,fear:5});apS({cash:300,heat:6});return"+Territoire +Crew"}},{lab:"Refuser — montrer les dents",eff(){apP("gang",{fear:8,turf:4});apS({heat:8,hp:-4,cash:80});return"+Peur"}}]},
    {tag:"TRAHISON", title:"Mouchard dans le Crew",   chance:.18, body:"Un soldat balance à la police.",
     choices:[{lab:"Élimination immédiate",eff(){apP("gang",{crew:-3,fear:8,turf:3});apS({heat:10,stealth:2});return"+Peur −Crew"}},{lab:"Enquête discrète",eff(){apS({stealth:5,heat:-4,cash:-80});return"+Furtivité"}}]},
    {tag:"POLICE",   title:"Descente Imminente",       chance:.15, body:"Tes contacts : raid dans 24h.",
     choices:[{lab:"Évacuer et planquer",eff(){apS({stealth:8,heat:-8,cash:-150});return"+Furtivité −Pression"}},{lab:"Tendre une embuscade",eff(){const f=Math.random()<.4;if(f){apS({hp:-12,heat:15,cash:-200});return"Embuscade ratée"}else{apP("gang",{fear:12,turf:6});apS({cash:250,heat:6});return"+Peur +Territoire"}}}]},
  ],
  ninja:[
    {tag:"CONTRAT",  title:"Mission Anonyme",          chance:.22, body:"Prime triple — cible inconnue. Aucune info.",
     choices:[{lab:"Accepter l'inconnu",eff(){const f=Math.random()<.3;if(f){apS({hp:-12,heat:12,stealth:-6});return"Mission impossible"}else{apP("ninja",{contracts:4,rep:10,marks:4});apS({cash:700,heat:5});return"+Contrats +Cash max"}}},{lab:"Refuser",eff(){apP("ninja",{focus:5});apS({stealth:3,heat:-3});return"+Focus +Furtivité"}}]},
    {tag:"TRAQUE",   title:"Chasseur de Primes",        chance:.18, body:"Un chasseur pro a retrouvé ta piste.",
     choices:[{lab:"Fuir — changer d'identité",eff(){apS({stealth:8,heat:-8,cash:-180});return"+Furtivité"}},{lab:"Piéger le chasseur",eff(){const f=Math.random()<.35;if(f){apS({hp:-14,heat:8,stealth:-4});return"Piège raté"}else{apP("ninja",{rep:8,contracts:1});apS({cash:280,heat:-4,hp:-4});return"+Réputation +Cash"}}}]},
    {tag:"TRAHISON", title:"Broker Arrêté",              chance:.15, body:"Ton intermédiaire est en garde à vue.",
     choices:[{lab:"L'éliminer avant qu'il parle",eff(){apP("ninja",{contracts:1,rep:4});apS({heat:4,hp:-3,stealth:2});return"+Réputation"}},{lab:"Le racheter — contact corrompu",eff(){apS({cash:-250,heat:-6,stealth:4});return"−Cash −Pression"}}]},
  ],
};
function rollEv(pid){ const pool=EVENTS[pid]||[]; for(const e of pool) if(Math.random()<e.chance) return e; return null; }

/* ═══════════════════════════════════════
   EFFETS VISUELS
═══════════════════════════════════════ */
function zoneCenter(z){
  return {x:(z.x+z.w/2)*W, y:(z.y+z.h/2)*H};
}

function spawnVfx(type, zone){
  const c=zoneCenter(zone);
  VFX.push({type, x:c.x, y:c.y, life:70, maxLife:70});
}

function spawnUnit(type, zone){
  const c=zoneCenter(zone);
  /* choisir une destination aléatoire (autre zone) */
  const zones=makeZones(ph().id);
  const dest=zones[Math.floor(Math.random()*zones.length)];
  const d=zoneCenter(dest);
  state.units.push({type, x:c.x, y:c.y, tx:d.x, ty:d.y, p:0, speed:0.007+Math.random()*.006, life:180+ri(0,80)});
  if(state.units.length>20) state.units.shift();
}

function float(zone, msg, color="#fff"){
  const c=zoneCenter(zone);
  FLOATS.push({x:c.x+ri(-20,20), y:c.y, msg, color, life:80, maxLife:80});
}

/* Flash de zone */
function flashZone(zone){
  state.zoneFx=state.zoneFx||[];
  state.zoneFx.push({id:zone.id, life:30});
}

/* ═══════════════════════════════════════
   MENU RADIAL
═══════════════════════════════════════ */
function openRadial(zone, mx, my){
  const actions=zoneActions(zone.id, ph().id);
  if(!actions.length) return;
  radial={ zone, cx:mx, cy:my, actions, hovered:-1 };
}
function closeRadial(){ radial=null; }

function radialItemRect(i, total){
  /* Disposer les items en demi-cercle vers le haut */
  const R = 70;
  const startAngle = Math.PI * 1.1;
  const endAngle   = Math.PI * 1.9;
  const angle = total===1 ? Math.PI*1.5 : startAngle + (endAngle-startAngle)/(total-1)*i;
  const bw=70, bh=36;
  return {
    x: radial.cx + Math.cos(angle)*R - bw/2,
    y: radial.cy + Math.sin(angle)*R - bh/2,
    w: bw, h: bh, angle
  };
}

/* ═══════════════════════════════════════
   DRAW — CANVAS PRINCIPAL
═══════════════════════════════════════ */
function drawGame(){
  if(!state?.started) return;
  const pid=ph().id;
  const acc=ph().acc;

  ctx.clearRect(0,0,W,H);

  /* Fond */
  const bgGrads={
    police:["#050e1e","#07152a"],prison:["#0d1318","#141c22"],
    gang:  ["#150507","#210a0a"],ninja: ["#070415","#0d091e"],
  };
  const [c1,c2]=bgGrads[pid];
  const bg=ctx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,c1);bg.addColorStop(1,c2);
  ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);

  /* Grille subtile */
  ctx.strokeStyle="rgba(255,255,255,.025)"; ctx.lineWidth=1;
  for(let x=0;x<W;x+=60){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  for(let y=0;y<H;y+=60){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}

  /* Routes entre zones */
  drawRoads(pid,acc);

  /* Zones */
  const zones=makeZones(pid);
  zones.forEach(z=>drawZone(z,pid,acc));

  /* Unités */
  drawUnits(acc);

  /* VFX */
  drawVFX();

  /* Chiffres flottants */
  drawFloats();

  /* Météo overlay */
  drawWeather();

  /* Événements carte éphémères */
  drawMapEvents();

  /* Streak indicator */
  drawStreakIndicator();

  /* Menu radial */
  if(radial) drawRadial(acc);
}

function drawRoads(pid, acc){
  /* Lignes qui relient les districts */
  const conns=[[".22+.08",".42+.08"],[".42+.08",".62+.08"],[".22+.38",".42+.38"],[".42+.38",".62+.38"],
    [".22+.08",".22+.38"],[".42+.08",".42+.38"],[".62+.08",".62+.38"]];
  const zones=makeZones(pid);
  const pairs=[
    [zones[4],zones[5]],[zones[5],zones[6]],[zones[7],zones[8]],[zones[8],zones[9]],
    [zones[4],zones[7]],[zones[5],zones[8]],[zones[6],zones[9]],
    [zones[7],zones[10]],[zones[8],zones[10]],[zones[9],zones[10]],
  ];
  pairs.forEach(([a,b])=>{
    if(!a||!b) return;
    const ax=(a.x+a.w/2)*W, ay=(a.y+a.h/2)*H;
    const bx=(b.x+b.w/2)*W, by=(b.y+b.h/2)*H;
    ctx.strokeStyle="rgba(255,255,255,.07)"; ctx.lineWidth=Math.max(4,W*.008);
    ctx.beginPath(); ctx.moveTo(ax,ay); ctx.lineTo(bx,by); ctx.stroke();
    ctx.strokeStyle=hexA(acc,.12); ctx.lineWidth=1; ctx.setLineDash([10,12]);
    ctx.beginPath(); ctx.moveTo(ax,ay); ctx.lineTo(bx,by); ctx.stroke();
    ctx.setLineDash([]);
  });
}

function drawZone(z, pid, acc){
  const x=z.x*W, y=z.y*H, w=z.w*W, h=z.h*H;
  const isHQ = z.type==="hq";
  const isHovered = radial?.zone?.id===z.id;

  /* Flash zone si récemment activée */
  const fx=(state.zoneFx||[]).find(f=>f.id===z.id);
  const flashAlpha=fx ? fx.life/30*0.35 : 0;

  /* Corps zone */
  ctx.fillStyle = isHQ
    ? `rgba(255,255,255,${.08+flashAlpha})`
    : `rgba(255,255,255,${.04+flashAlpha})`;
  ctx.fillRect(x,y,w,h);

  /* Fond coloré selon phase pour zones main */
  if(z.type==="main"||isHQ){
    ctx.fillStyle=hexA(acc, isHovered ? .18 : .06);
    ctx.fillRect(x,y,w,h);
  }

  /* Contour */
  ctx.strokeStyle = isHovered
    ? acc
    : hexA(acc, isHQ ? .5 : .2);
  ctx.lineWidth = isHovered ? 2 : 1;
  if(isHQ) ctx.lineWidth=1.5;
  ctx.strokeRect(x,y,w,h);

  /* Glow si survolé */
  if(isHovered){
    ctx.strokeStyle=hexA(acc,.15);
    ctx.lineWidth=8;
    ctx.strokeRect(x+1,y+1,w-2,h-2);
    ctx.lineWidth=1;
  }

  /* Icône + Label */
  const cx=x+w/2, cy=y+h/2;
  if(z.icon){
    ctx.font=`${Math.max(16,w*.18)}px serif`;
    ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.globalAlpha=isHovered?.9:.6;
    ctx.fillText(z.icon,cx,cy-(h*.1));
    ctx.globalAlpha=1;
  }
  ctx.fillStyle=isHovered?"#fff":hexA(acc,.8);
  ctx.font=`600 ${Math.max(9,w*.09)}px 'Share Tech Mono',monospace`;
  ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillText(z.label||"",cx,cy+(h*.2));

  /* Stats de zone (mini barres pour zones main) */
  if(z.type==="main" && !isHovered){
    const heatPct=state.s.heat/100;
    ctx.fillStyle=hexA("#f87171",.4);
    ctx.fillRect(x+3, y+h-5, (w-6)*heatPct, 3);
    ctx.fillStyle=hexA(acc,.4);
    ctx.fillRect(x+3, y+h-5, 0, 3);
  }

  /* Cursor invite: petit "clic" indicator */
  if(isHovered && state.ap>0 && !state.over){
    ctx.strokeStyle=hexA(acc,.6); ctx.lineWidth=1;
    ctx.setLineDash([3,3]);
    ctx.strokeRect(x+3,y+3,w-6,h-6);
    ctx.setLineDash([]);
  }

  /* Indicateur d'actions disponibles */
  const acts=zoneActions(z.id,ph().id);
  if(acts.length>0 && state.ap>0 && !state.over){
    ctx.fillStyle=hexA(acc,.8);
    ctx.beginPath();
    ctx.arc(x+w-9, y+9, 4, 0, Math.PI*2);
    ctx.fill();
  }
}

function drawUnits(acc){
  state.units.forEach(u=>{
    u.p+=u.speed; u.life--;
    if(u.p>1) u.p=1;
    const ux=u.x+(u.tx-u.x)*u.p;
    const uy=u.y+(u.ty-u.y)*u.p;
    const alpha=Math.min(1,u.life/40)*(.7+Math.sin(pulse+u.p*10)*.15);
    ctx.globalAlpha=alpha;
    const r = u.type==="police_car"?6:4;
    const col = u.type==="police_car"?"#3da5ff"
               :u.type==="gang_member"?"#f87171"
               :u.type==="ninja_agent"?"#a78bfa"
               :u.type==="guard"?"#8fa0b0"
               :"#4ade80";
    ctx.fillStyle=col;
    ctx.shadowColor=col; ctx.shadowBlur=10;
    ctx.beginPath(); ctx.arc(ux,uy,r,0,Math.PI*2); ctx.fill();
    /* Sillage */
    const tail=6;
    ctx.strokeStyle=col; ctx.lineWidth=1.5;
    ctx.beginPath();
    ctx.moveTo(ux,uy);
    ctx.lineTo(ux-(u.tx-u.x)*tail*u.speed, uy-(u.ty-u.y)*tail*u.speed);
    ctx.stroke();
    ctx.shadowBlur=0; ctx.globalAlpha=1;
  });
  state.units=state.units.filter(u=>u.life>0&&u.p<1);
}

function drawVFX(){
  VFX.forEach(v=>{
    const t=1-v.life/v.maxLife;
    v.life--;
    const alpha=Math.max(0,1-t*1.4);
    ctx.globalAlpha=alpha;
    if(v.type==="boom"||v.type==="explosion"){
      const r=(v.type==="explosion"?80:50)*t;
      const g=ctx.createRadialGradient(v.x,v.y,0,v.x,v.y,r);
      g.addColorStop(0,"rgba(255,200,50,.95)");g.addColorStop(.4,"rgba(228,85,85,.7)");g.addColorStop(1,"transparent");
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(v.x,v.y,r,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle=`rgba(255,150,0,${alpha*.5})`; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(v.x,v.y,r*1.5,0,Math.PI*2); ctx.stroke();
    }else if(v.type==="slash"){
      ctx.strokeStyle=`rgba(167,139,250,${alpha})`;ctx.lineWidth=3.5-t*2;
      ctx.beginPath();
      ctx.moveTo(v.x-35*(1-t*.5),v.y-25*(1-t*.5));
      ctx.lineTo(v.x+35*t,v.y+25*t);
      ctx.stroke();
    }else if(v.type==="cash"){
      ctx.fillStyle=`rgba(240,180,40,${alpha})`;
      ctx.font=`700 ${14+t*10}px serif`; ctx.textAlign="center"; ctx.textBaseline="middle";
      ctx.fillText("💰",v.x,v.y-t*20);
    }else if(v.type==="lock"){
      ctx.strokeStyle=`rgba(143,160,176,${alpha})`;ctx.lineWidth=2;
      const r=20+t*20;
      ctx.strokeRect(v.x-r/2,v.y-r/2,r,r);
    }else if(v.type==="bust"){
      ctx.fillStyle=`rgba(61,165,255,${alpha})`;
      ctx.beginPath();ctx.arc(v.x,v.y,30*t,0,Math.PI*2);ctx.fill();
    }else if(v.type==="smoke"){
      for(let i=0;i<4;i++){
        const r=10+t*25+i*8;
        ctx.fillStyle=`rgba(167,139,250,${alpha*.15})`;
        ctx.beginPath();ctx.arc(v.x+i*6,v.y-t*20-i*4,r,0,Math.PI*2);ctx.fill();
      }
    }
    ctx.globalAlpha=1;
  });
  for(let i=VFX.length-1;i>=0;i--){ if(VFX[i].life<=0) VFX.splice(i,1); }
}

function drawFloats(){
  FLOATS.forEach(f=>{
    const t=1-f.life/f.maxLife;
    f.y-=.7; f.life--;
    const alpha=f.life<20?f.life/20:1;
    ctx.globalAlpha=alpha;
    ctx.fillStyle=f.color;
    ctx.font=`700 14px 'Share Tech Mono',monospace`;
    ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText(f.msg, f.x, f.y);
    ctx.globalAlpha=1;
  });
  for(let i=FLOATS.length-1;i>=0;i--){ if(FLOATS[i].life<=0) FLOATS.splice(i,1); }
}

function drawWeather(){
  if(!state?.weather) return;
  const w=state.weather;
  w.pulse=(w.pulse||0)+0.015;
  const alpha=0.04+Math.sin(w.pulse)*.015;
  // Teinte globale subtile selon météo
  const weatherTint={sunny:"rgba(240,180,40,",rain:"rgba(61,165,255,",fog:"rgba(143,160,176,",storm:"rgba(100,80,180,",hot:"rgba(248,113,113,",night:"rgba(30,20,80,"};
  const col=(weatherTint[w.id]||"rgba(255,255,255,")+alpha+")";
  ctx.fillStyle=col;
  ctx.fillRect(0,0,W,H);

  // Particules météo
  if(w.id==="rain"){
    ctx.strokeStyle="rgba(100,180,255,.18)"; ctx.lineWidth=1;
    for(let i=0;i<60;i++){
      const rx=((i*137+pulse*120)%W);
      const ry=((i*83+pulse*200)%H);
      ctx.beginPath(); ctx.moveTo(rx,ry); ctx.lineTo(rx-2,ry+12); ctx.stroke();
    }
  } else if(w.id==="fog"||w.id==="storm"){
    for(let i=0;i<5;i++){
      const rx=((i*211+pulse*18)%W);
      const ry=H*(.2+i*.15+Math.sin(pulse+i)*.04);
      const r=W*.18+i*20;
      const fg=ctx.createRadialGradient(rx,ry,0,rx,ry,r);
      fg.addColorStop(0,`rgba(180,190,210,${w.id==="storm"?0.04:0.06})`);
      fg.addColorStop(1,"transparent");
      ctx.fillStyle=fg; ctx.beginPath(); ctx.arc(rx,ry,r,0,Math.PI*2); ctx.fill();
    }
  } else if(w.id==="night"){
    // Quelques étoiles
    ctx.fillStyle="rgba(255,255,255,.4)";
    for(let i=0;i<30;i++){
      const sx=((i*173)%W), sy=((i*97)%( H*.45));
      const br=.3+Math.sin(pulse*2+i)*.2;
      ctx.globalAlpha=br;
      ctx.beginPath(); ctx.arc(sx,sy,1,0,Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha=1;
  }

  // Badge météo en haut à gauche (sous le HUD)
  const bx=14, by=58;
  ctx.fillStyle="rgba(3,9,20,.82)";
  ctx.strokeStyle="rgba(255,255,255,.12)"; ctx.lineWidth=1;
  roundRect(bx,by,132,26,3);
  ctx.font="13px serif"; ctx.textAlign="left"; ctx.textBaseline="middle";
  ctx.fillStyle="#fff"; ctx.globalAlpha=.85;
  ctx.fillText(w.icon, bx+7, by+13);
  ctx.globalAlpha=1;
  ctx.fillStyle=w.color||"#fff";
  ctx.font=`600 9px 'Share Tech Mono',monospace`;
  ctx.fillText(w.label, bx+28, by+9);
  ctx.fillStyle="rgba(255,255,255,.35)";
  ctx.font=`9px 'Share Tech Mono',monospace`;
  ctx.fillText(w.desc.slice(0,20), bx+28, by+20);
}

function drawMapEvents(){
  if(!state?.mapEvents) return;
  state.mapEvents.forEach(e=>{
    const c=zoneCenter(e.zone);
    const t=1-(e.life/e.maxLife);
    const blink=.6+Math.sin(pulse*4+t*10)*.4;
    const timeLeft=e.life/e.maxLife;
    // Glow ring
    ctx.strokeStyle=e.color||"#fff"; ctx.lineWidth=2;
    ctx.globalAlpha=blink*.7*timeLeft;
    ctx.beginPath(); ctx.arc(c.x,c.y,22,0,Math.PI*2); ctx.stroke();
    ctx.globalAlpha=blink*.3*timeLeft;
    ctx.beginPath(); ctx.arc(c.x,c.y,28,0,Math.PI*2); ctx.stroke();
    ctx.globalAlpha=1;
    // Fond
    ctx.fillStyle="rgba(3,9,20,.88)"; ctx.strokeStyle=e.color;
    ctx.lineWidth=1.5; ctx.globalAlpha=timeLeft*.9+.1;
    roundRect(c.x-18,c.y-18,36,36,4);
    // Icône
    ctx.font="16px serif"; ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillStyle="#fff";
    ctx.fillText(e.icon, c.x, c.y-2);
    // Label
    ctx.fillStyle=e.color;
    ctx.font=`700 7px 'Share Tech Mono',monospace`;
    ctx.fillText(e.label, c.x, c.y+13);
    // Barre de vie
    ctx.fillStyle="rgba(255,255,255,.12)";
    ctx.fillRect(c.x-16,c.y+18,32,2);
    ctx.fillStyle=e.color;
    ctx.fillRect(c.x-16,c.y+18,32*timeLeft,2);
    ctx.globalAlpha=1;
  });
}

function drawStreakIndicator(){
  if(!state||state.streak<2) return;
  const s=state.streak, m=state.streakMult;
  const colors=["","","#f0b429","#f87171","#f87171","#a78bfa","#a78bfa","#a78bfa","#a78bfa"];
  const col=colors[Math.min(s,colors.length-1)]||"#a78bfa";
  const bx=W-160, by=58;
  ctx.fillStyle="rgba(3,9,20,.88)";
  ctx.strokeStyle=col; ctx.lineWidth=1.2;
  ctx.globalAlpha=.9+Math.sin(pulse*3)*.08;
  roundRect(bx,by,146,26,3);
  ctx.globalAlpha=1;
  // Flamme
  ctx.font="13px serif"; ctx.textAlign="left"; ctx.textBaseline="middle";
  ctx.fillStyle="#fff";
  ctx.fillText("🔥", bx+6, by+13);
  // Streak count
  ctx.fillStyle=col;
  ctx.font=`700 11px 'Share Tech Mono',monospace`;
  ctx.textAlign="left";
  ctx.fillText(`STREAK ${s}`, bx+26, by+9);
  // Mult
  ctx.fillStyle="rgba(255,255,255,.6)";
  ctx.font=`9px 'Share Tech Mono',monospace`;
  ctx.fillText(`×${m} BONUS ACTIF`, bx+26, by+20);
}

function drawRadial(acc){
  const {cx,cy,actions,hovered}=radial;
  const total=actions.length;

  /* Fond semi-transparent sous le menu */
  ctx.fillStyle="rgba(3,9,20,.7)";
  ctx.beginPath(); ctx.arc(cx,cy,90,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle=hexA(acc,.3); ctx.lineWidth=1;
  ctx.beginPath(); ctx.arc(cx,cy,90,0,Math.PI*2); ctx.stroke();

  /* Point central (zone) */
  ctx.fillStyle=acc; ctx.shadowColor=acc; ctx.shadowBlur=12;
  ctx.beginPath(); ctx.arc(cx,cy,8,0,Math.PI*2); ctx.fill();
  ctx.shadowBlur=0;

  /* Lignes vers items */
  actions.forEach((_,i)=>{
    const r=radialItemRect(i,total);
    const ix=r.x+r.w/2, iy=r.y+r.h/2;
    ctx.strokeStyle=hexA(acc, i===hovered?.5:.2);
    ctx.lineWidth=1; ctx.setLineDash([4,5]);
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(ix,iy); ctx.stroke();
    ctx.setLineDash([]);
  });

  /* Items */
  actions.forEach((a,i)=>{
    const r=radialItemRect(i,total);
    const isHov=i===hovered;
    const riskCol=a.risk==="low"?"#4ade80":a.risk==="medium"?"#f0b429":"#f87171";

    /* Fond item */
    ctx.fillStyle=isHov?hexA(acc,.3):"rgba(3,9,20,.92)";
    ctx.strokeStyle=isHov?acc:hexA(acc,.35);
    ctx.lineWidth=isHov?1.5:1;
    roundRect(r.x,r.y,r.w,r.h,5);

    /* Icône */
    ctx.font="14px serif"; ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.globalAlpha=isHov?1:.8;
    ctx.fillStyle="#fff";
    ctx.fillText(a.icon, r.x+16, r.y+r.h/2);

    /* Nom */
    ctx.fillStyle=isHov?"#fff":hexA(acc,.85);
    ctx.font=`${isHov?"700":"600"} 9px 'Share Tech Mono',monospace`;
    ctx.textAlign="left";
    ctx.fillText(a.name.slice(0,9).toUpperCase(), r.x+28, r.y+r.h/2);

    /* Dot risque */
    ctx.fillStyle=riskCol; ctx.globalAlpha=.9;
    ctx.beginPath(); ctx.arc(r.x+r.w-6, r.y+6, 3, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha=1;
  });

  /* Instruction */
  ctx.fillStyle="rgba(255,255,255,.3)";
  ctx.font="10px 'Share Tech Mono',monospace"; ctx.textAlign="center";
  ctx.fillText("ESC — annuler", cx, cy+105);
}

function roundRect(x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath(); ctx.fill(); ctx.stroke();
}

/* ── TITLE BG ── */
function drawTitleBg(){
  const cw=bgC.width, ch=bgC.height;
  bgX.clearRect(0,0,cw,ch);
  const bg=bgX.createLinearGradient(0,0,0,ch);
  bg.addColorStop(0,"#02040c"); bg.addColorStop(1,"#040810");
  bgX.fillStyle=bg; bgX.fillRect(0,0,cw,ch);
  bgX.strokeStyle="rgba(61,165,255,.05)"; bgX.lineWidth=1;
  for(let x=0;x<cw;x+=56){bgX.beginPath();bgX.moveTo(x,0);bgX.lineTo(x,ch);bgX.stroke();}
  for(let y=0;y<ch;y+=56){bgX.beginPath();bgX.moveTo(0,y);bgX.lineTo(cw,y);bgX.stroke();}
  [[.2,.4],[.5,.5],[.8,.4]].forEach(([fx,fy],i)=>{
    const r=60+Math.sin(titlePulse+i*2)*30;
    const g=bgX.createRadialGradient(fx*cw,fy*ch,0,fx*cw,fy*ch,r*3);
    g.addColorStop(0,`rgba(61,165,255,${.06+Math.sin(titlePulse+i)*.03})`);
    g.addColorStop(1,"transparent");
    bgX.fillStyle=g; bgX.beginPath(); bgX.arc(fx*cw,fy*ch,r*3,0,Math.PI*2); bgX.fill();
  });
  titlePulse+=.01;
}

/* ═══════════════════════════════════════
   HUD
═══════════════════════════════════════ */
function renderHUD(){
  if(!state?.started) return;
  const s=state.s, p=ph();

  G("h-phase").textContent=p.tag;
  G("h-phase").style.cssText=`color:${p.acc};border-color:${p.acc};background:${hexA(p.acc,.12)}`;
  G("h-day").textContent=`J ${String(state.day).padStart(2,"0")}`;

  const hcol=s.hp>60?"#4ade80":s.hp>30?"#f0b429":"#f87171";
  const htcol=s.heat<40?"#4ade80":s.heat<70?"#f0b429":"#f87171";
  G("bar-hp").style.cssText=`width:${s.hp}%;background:${hcol}`;
  G("bar-heat").style.cssText=`width:${s.heat}%;background:${htcol}`;
  G("bar-stealth").style.cssText=`width:${s.stealth}%;background:${p.acc}`;
  G("bar-inf").style.cssText=`width:${s.inf}%;background:#a78bfa`;
  G("val-hp").textContent=Math.round(s.hp);
  G("val-heat").textContent=Math.round(s.heat);
  G("val-stealth").textContent=Math.round(s.stealth);
  G("val-inf").textContent=Math.round(s.inf);
  G("val-cash").textContent=Math.round(s.cash).toLocaleString("fr-FR");
  G("val-score").textContent=Math.round(state.score).toLocaleString("fr-FR");

  /* AP */
  const maxApDisplay=Math.max(MAX_AP, state.ap);
  G("ap-dots").innerHTML=Array.from({length:maxApDisplay},(_,i)=>
    `<div class="apdot${i>=state.ap?" used":""}"></div>`).join("");

  /* Phase track */
  G("phase-track").innerHTML=PHASES.map((ph,i)=>{
    const done=state.done.includes(ph.id), act=i===state.pi;
    return `<div class="pt-step${done?" done":act?" active":""}" style="${act?`border-color:${ph.acc};color:${ph.acc}`:done?"":""}">
      <div class="pt-dot"></div>${ph.tag}
    </div>`;
  }).join("");

  /* Objectifs */
  const objs=objectives(ph().id);
  G("obj-list").innerHTML=objs.map(o=>{
    const pct=Math.min(100,Math.round((o.cur/o.max)*100));
    return `<div class="ob-item">
      <div class="ob-lbl${o.ok?" ok":""}">${o.l}<span>${o.ok?"✓":Math.round(o.cur)+"/"+o.max}</span></div>
      <div class="ob-bar"><div class="ob-fill" style="width:${pct}%;background:${o.ok?"#4ade80":ph().acc}"></div></div>
    </div>`;
  }).join("");

  /* Next phase btn */
  G("btn-next").classList.toggle("hidden",!(phDone(ph().id)&&state.pi<3&&!state.over));

  /* Zone flash tick */
  if(state.zoneFx) state.zoneFx.forEach(f=>f.life--);
  if(state.zoneFx) state.zoneFx=state.zoneFx.filter(f=>f.life>0);
}

function renderLogPanel(){
  G("log-list").innerHTML=state.log.map(e=>`<li class="${e.cls}">${e.txt}</li>`).join("");
}

/* ═══════════════════════════════════════
   GAMEPLAY
═══════════════════════════════════════ */
function doAction(action, zone){
  if(state.ap<=0||state.over||!action) return;
  closeRadial();
  flashZone(zone);
  action.run(zone);
  const newEntry=state.log[0];
  const isBad = newEntry && newEntry.cls==="bad";
  registerStreak(!isBad);
  if(!isBad) applyStreakBonus();
  state.ap--;
  calcScore();
  checkApBonus();
  evalFail();
  renderHUD();
  const multLabel=state.streakMult>1?` 🔥x${state.streakMult}`:"";
  toast(`${action.icon} ${action.name}${multLabel}`);
}

function endDay(){
  if(state.over||pendingEv) return;
  if(state.ap===MAX_AP){ apS({hp:-2,inf:-2,heat:2,cash:-90}); addLog("Jour inactif — pénalités.","bad"); }
  passTick();
  const ev=rollEv(ph().id);
  state.day++; state.ap=MAX_AP;
  // Reset AP bonus & score de référence
  state.bonusApUsed=false;
  state.dayScoreStart=state.score;
  // Nouvelle météo
  rollWeather();
  // Spawn 1-2 événements carte
  const nbEv=ri(1,2);
  for(let i=0;i<nbEv;i++) spawnMapEvent();
  // Tick événements carte
  tickMapEvents();
  norm(); checkComplete(); evalFail(); calcScore(); renderHUD();
  if(ev){ pendingEv=ev; showEvent(ev); }
  else toast(`Jour ${state.day-1} terminé → Jour ${state.day}`);
}

function passTick(){
  const pid=ph().id;
  if(pid==="police"){apP("police",{trust:-1+ri(-2,2),cases:ri(0,1)});apS({heat:1+ri(-1,2),cash:75,hp:-1});}
  else if(pid==="prison"){apP("prison",{contra:2+ri(-1,3),order:-2+ri(-2,2)});apS({cash:95,heat:2,hp:-1,inf:1});}
  else if(pid==="gang"){const tb=Math.round(state.ps.gang.turf/16);apP("gang",{rackets:1,fear:-1+ri(-1,2),crew:ri(-2,3)});apS({cash:115+tb*14,heat:3+ri(0,3),stealth:-1,hp:-2});}
  else{apP("ninja",{focus:-2+ri(-2,2),rep:1+ri(-1,2),marks:ri(0,1)});apS({stealth:-1+ri(-1,2),heat:-2+ri(-2,2),hp:-1,cash:70});}
  calcScore();
}

function checkComplete(){
  const p=ph();
  if(!phDone(p.id)) return;
  if(!state.done.includes(p.id)){
    state.done.push(p.id);
    addLog(`${p.label} — objectifs atteints!`,"ok");
    toast(`✅ Phase ${p.tag} complète !`,"#4ade80");
  }
  if(p.id==="ninja") showEnd(true);
}

function nextPhase(){
  if(state.pi>=3||!phDone(ph().id)) return;
  state.pi++; state.ap=MAX_AP;
  const np=ph();
  addLog(`→ ${np.label}`,"ev");
  if(np.id==="prison"){apS({inf:5,stealth:3,cash:400});apP("prison",{order:6,fac:6,contra:-4});}
  else if(np.id==="gang"){apS({inf:6,heat:6,cash:800,stealth:5});apP("gang",{crew:14,turf:12,fear:8});}
  else if(np.id==="ninja"){apS({stealth:14,heat:-7,hp:9,cash:1000});apP("ninja",{focus:12,rep:10,contracts:1});}
  norm(); calcScore();
  /* Mise à jour CSS accent */
  document.documentElement.style.setProperty("--acc",np.acc);
  document.documentElement.style.setProperty("--acc2",np.glow);
  /* Overlay transition */
  G("pt-sub").textContent=`PHASE ${state.pi+1} / 4`;
  G("pt-name").textContent=np.tag;
  G("pt-name").style.textShadow=`0 0 100px ${np.acc}`;
  G("pt-fill").style.background=np.acc;
  G("pt").classList.remove("hidden");
  G("pt-fill").style.width="0";
  requestAnimationFrame(()=>requestAnimationFrame(()=>{G("pt-fill").style.width="100%"}));
  setTimeout(()=>{G("pt").classList.add("hidden");G("pt-fill").style.width="0";renderHUD();},2100);
}

function evalFail(){
  if(state.over) return;
  const s=state.s;
  if(s.hp<=0)   return showEnd(false,"Hors Service","Tu es hors service. L'opération s'arrête ici.");
  if(s.heat>=100) return showEnd(false,"État de Siège","La pression est maximale. Toutes les cellules tombent.");
  if(s.cash<=-5000) return showEnd(false,"Faillite Totale","Aucun réseau ne peut opérer en déficit absolu.");
}

function showEvent(ev){
  G("ev-kicker").textContent=ev.tag;
  G("ev-title").textContent=ev.title;
  G("ev-body").textContent=ev.body;
  G("ev-btns").innerHTML="";
  ev.choices.forEach(ch=>{
    const btn=document.createElement("button"); btn.className="ov-btn";
    btn.innerHTML=`${ch.lab}<span class="ov-btn-eff">— Résultat inconnu</span>`;
    btn.addEventListener("click",()=>{
      const r=ch.eff(); addLog(`[${ev.tag}] ${r}`,"ev");
      toast(`${ev.tag}: ${r}`,ph().acc);
      calcScore(); pendingEv=null;
      G("ov-event").classList.add("hidden");
      renderHUD();
    });
    G("ev-btns").appendChild(btn);
  });
  G("ov-event").classList.remove("hidden");
}

function showEnd(win, title="", text=""){
  state.over=true; calcScore();
  if(win){title="Urban Shadows Complété";text="4 phases maîtrisées. Police → Fantôme.";}
  G("end-kicker").textContent=win?"VICTOIRE":"GAME OVER";
  G("end-kicker").style.color=win?"#4ade80":"#f87171";
  G("end-title").textContent=title;
  G("end-body").textContent=text;
  G("end-score").textContent=Math.round(state.score).toLocaleString("fr-FR");
  G("ov-end").classList.remove("hidden");
  renderHUD();
}

/* Save/load */
function save(){ if(!state?.started) return; localStorage.setItem(SAVE_KEY,JSON.stringify({v:4,state})); toast("💾 Sauvegarde OK"); }
function load(){
  const raw=localStorage.getItem(SAVE_KEY);
  if(!raw){toast("Aucune sauvegarde.","#f87171");return;}
  try{
    const d=JSON.parse(raw); if(!d?.state) throw 0;
    state=JSON.parse(JSON.stringify(d.state)); state.started=true; state.over=false;
    norm(); calcScore();
    document.documentElement.style.setProperty("--acc",ph().acc);
    G("screen-title").classList.add("hidden"); G("screen-game").classList.remove("hidden");
    G("ov-end").classList.add("hidden");
    renderHUD(); toast("📂 Partie chargée!");
  }catch{toast("Sauvegarde invalide.","#f87171");}
}

/* Toast */
function toast(msg,col){
  const el=document.createElement("div"); el.className="toast";
  if(col) el.style.borderColor=col;
  el.textContent=msg; G("toasts").appendChild(el);
  setTimeout(()=>el.remove(),2500);
}

/* Helpers */
function hexA(hex,a){
  const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}

/* ═══════════════════════════════════════
   INPUT
═══════════════════════════════════════ */
function getZoneAt(mx, my){
  const zones=makeZones(ph().id);
  return zones.find(z=> mx>=z.x*W && mx<=(z.x+z.w)*W && my>=z.y*H && my<=(z.y+z.h)*H) || null;
}

function getRadialItemAt(mx, my){
  if(!radial) return -1;
  const {actions}=radial;
  for(let i=0;i<actions.length;i++){
    const r=radialItemRect(i,actions.length);
    if(mx>=r.x&&mx<=r.x+r.w&&my>=r.y&&my<=r.y+r.h) return i;
  }
  return -1;
}

function onCanvasClick(e){
  if(!state?.started||state.over||pendingEv) return;
  const rect=cvs.getBoundingClientRect();
  const mx=(e.clientX-rect.left)*(W/rect.width);
  const my=(e.clientY-rect.top)*(H/rect.height);

  /* Clic sur item du menu radial */
  if(radial){
    const idx=getRadialItemAt(mx,my);
    if(idx>=0){
      doAction(radial.actions[idx], radial.zone);
    } else {
      closeRadial();
    }
    return;
  }

  /* Clic sur événement carte éphémère */
  if(clickMapEvent(mx,my)) return;

  /* Clic sur une zone */
  const zone=getZoneAt(mx,my);
  if(zone){
    const acts=zoneActions(zone.id,ph().id);
    if(acts.length>0 && state.ap>0){
      openRadial(zone, mx, my);
    } else if(acts.length===0){
      toast("Aucune action disponible ici.");
    } else {
      toast("Plus d'AP — Valide le jour d'abord !");
    }
  }
}

function onCanvasMove(e){
  if(!state?.started||state.over) return;
  const rect=cvs.getBoundingClientRect();
  const mx=(e.clientX-rect.left)*(W/rect.width);
  const my=(e.clientY-rect.top)*(H/rect.height);

  if(radial){
    radial.hovered=getRadialItemAt(mx,my);
    /* Tooltip de l'item survolé */
    const i=radial.hovered;
    if(i>=0){
      const a=radial.actions[i];
      const tip=G("zone-tip");
      tip.innerHTML=`<b>${a.icon} ${a.name}</b><br><span style="color:#4d6b82">${a.desc}</span><br><span style="color:#7ab8d8">${a.impact}</span>`;
      tip.style.left=(e.clientX+12)+"px"; tip.style.top=(e.clientY-60)+"px";
      tip.classList.remove("hidden");
    } else { G("zone-tip").classList.add("hidden"); }
    return;
  }

  const zone=getZoneAt(mx,my);
  const tip=G("zone-tip");
  if(zone){
    const acts=zoneActions(zone.id,ph().id);
    tip.innerHTML=`<b>${zone.icon||""} ${zone.label}</b>${acts.length?`<br><span style="color:#4d6b82">${acts.map(a=>a.icon+" "+a.name).join(" · ")}</span>`:"<br><i style='color:#4d6b82'>—</i>"}`;
    tip.style.left=(e.clientX+12)+"px"; tip.style.top=(e.clientY-40)+"px";
    tip.classList.remove("hidden");
    /* Hover visuel sur la zone pour le menu radial */
    if(radial?.zone?.id!==zone.id) radial=null; // reset si on bouge
  } else {
    tip.classList.add("hidden");
  }
}

/* ═══════════════════════════════════════
   INIT
═══════════════════════════════════════ */
function resize(){
  W=cvs.width=bgC.width=window.innerWidth;
  H=cvs.height=bgC.height=window.innerHeight;
}

function startGame(){
  const name=String(G("name-input").value||"").trim();
  state=mkState(); state.started=true; state.name=name||"Shadow";
  addLog(`Opération initialisée pour ${state.name}.`);
  addLog(`Phase active : ${ph().label}.`);
  calcScore();
  state.dayScoreStart=state.score;
  rollWeather();
  document.documentElement.style.setProperty("--acc",ph().acc);
  document.documentElement.style.setProperty("--acc2",ph().glow);
  G("screen-title").classList.add("hidden");
  G("screen-game").classList.remove("hidden");
  renderHUD();
  toast("🗺 Clique sur un district pour agir !");
}

function restart(){
  state=mkState();
  G("ov-end").classList.add("hidden");
  G("screen-game").classList.add("hidden");
  G("screen-title").classList.remove("hidden");
  G("name-input").value="";
}

function bindEvents(){
  G("btn-start").addEventListener("click", startGame);
  G("name-input").addEventListener("keydown",e=>{if(e.key==="Enter")startGame();});
  G("btn-endday").addEventListener("click",endDay);
  G("btn-save").addEventListener("click",save);
  G("btn-load").addEventListener("click",load);
  G("btn-next").addEventListener("click",nextPhase);
  G("btn-restart").addEventListener("click",restart);
  G("btn-log").addEventListener("click",()=>{
    G("log-panel").classList.toggle("hidden");
    if(!G("log-panel").classList.contains("hidden")) renderLogPanel();
  });
  G("btn-log-close").addEventListener("click",()=>G("log-panel").classList.add("hidden"));
  cvs.addEventListener("click",onCanvasClick);
  cvs.addEventListener("mousemove",onCanvasMove);
  cvs.addEventListener("mouseleave",()=>{ G("zone-tip").classList.add("hidden"); });
  document.addEventListener("keydown",e=>{
    if(e.key==="Escape"){ closeRadial(); G("zone-tip").classList.add("hidden"); }
    if(!state?.started||state.over) return;
    if(e.key===" "){e.preventDefault();endDay();}
  });
  window.addEventListener("resize",resize);
}

function loop(){
  pulse+=0.018;
  if(state?.started&&!state.over) drawGame();
  else drawTitleBg();
  renderHUD();
  requestAnimationFrame(loop);
}

resize();
bindEvents();
loop();

})();