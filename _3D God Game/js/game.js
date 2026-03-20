// ============================================================
//  DIEU OBSERVATEUR — Évolution & Survie
//  Vanilla JS + Three.js r128
// ============================================================

// ── CONSTANTES ───────────────────────────────────────────────
var TERRAIN_SIZE = 320;
var TERRAIN_SEG  = 80;
var WATER_LEVEL  = -1.5;
var MAX_HUMANS   = 42;
var MAX_DEER     = 32;
var MAX_WOLVES   = 12;
var MAX_BIRDS    = 18;
var ERA_DURATION = 300;     // 5 minutes par ère (au lieu de 75s)
var HUNGER_RATE  = 0.0025;  // Créatures vivent ~6 min sans manger
var THIRST_RATE  = 0.0032;
var ENERGY_RATE  = 0.003;
var ENERGY_REGEN = 0.022;
var ADAPT_SPEED  = 0.00012;  // vitesse de mutation par génération
var HUMAN_ALERT_BONUS            = 10;
var HUMAN_FLEE_SPEED_BONUS       = 0.55;
var HUMAN_WOLF_DETECT_RANGE      = 34;
var WOLF_DEFAULT_DETECT_RANGE    = 55;
var WOLF_HUMAN_TARGET_PENALTY    = 18;
var HUMAN_GROUP_DEFENSE_RADIUS   = 14;
var HUMAN_GROUP_DEFENSE_PER_ALLY = 0.06;
var MINIMAP_REFRESH_RATE         = 0.16;
var DISEASE_SPREAD_RADIUS        = 9;
var TERRITORY_REFRESH_RATE       = 8;
var TERRITORY_CONFLICT_RATE      = 5.5;
var SEASON_DURATION              = 70;

// ── ÉTAT ─────────────────────────────────────────────────────
var scene, camera, renderer, clock;
var terrainMesh, waterMesh, skyMesh, sunMesh, moonMesh, starPoints;
var ambientLight, sunLight, moonLight;

var humans  = [];
var deerPop = [];
var wolves  = [];
var birds   = [];
var campfires  = [];
var buildings  = [];
var rainSystem = null;

var worldTime  = 0.28;
var worldYear  = 0;
var eraIndex   = 0;
var eraTimer   = 0;
var evolutionSpeed   = 1;
var randomEventTimer = 18;
var godCooldowns     = {};
var adaptationLogCooldown = 0;
var isBlizzard = false;

// ── RELIGION ─────────────────────────────────────────────────
var angels     = [];
var prophets   = [];
var rebels     = [];
var demons     = [];
var rebelCount = 0;
var MAX_ANGELS = 3;
var MAX_DEMONS = 8;
var MAX_REBELS = 5;

var selectionRing = null;
var isPaused      = false;
var activeMeteors = [];
var craterLights  = [];
var popHistory    = { humans:[], deer:[], wolves:[] };
var popTimer      = 0;
var minimapTimer  = 0;
var seasonTimer   = 0;
var seasonIndex   = 0;
var diseaseTimer  = 12;
var territoryTimer = 0;
var territoryConflictTimer = 4;
var creatureIdCounter = 0;
var creatureRegistry = {};
var worldStats = { births:0, deaths:0, wars:0, conversions:0, diseaseCases:0, eras:[] };
var territories = { human:[], wolf:[] };

// Caméra
var camTheta    = -0.4;
var camPhi      = 1.05;
var camRadius   = 200;
var camRadiusTgt= 200;   // cible pour zoom fluide
var camVelTheta = 0;     // inertie rotation horizontale
var camVelPhi   = 0;     // inertie rotation verticale
var camTarget;
var isDragging  = false;
var rightDrag   = false;
var prevMouse   = { x:0, y:0 };
// Touch
var lastTouches    = [];
var lastPinchDist  = 0;

// Raycasting / sélection
var raycaster;
var mouseNDC = new THREE.Vector2();
var selectedCreature = null;
var allSelectableMeshes = [];

// ── ÈRES ─────────────────────────────────────────────────────
var ERAS = [
  { name:"Ère Primitive",   icon:"🌋", clothColor:0x7B4A2E, buildStyle:"none"    },
  { name:"Âge Ancien",      icon:"🔥", clothColor:0xCC8820, buildStyle:"camp"    },
  { name:"Ère Médiévale",   icon:"⚔️", clothColor:0x446688, buildStyle:"stone"   },
  { name:"Révolution",      icon:"⚙️", clothColor:0x333333, buildStyle:"factory" },
  { name:"Ère Moderne",     icon:"🏙️", clothColor:0x2277CC, buildStyle:"city"    },
  { name:"Ère Futuriste",   icon:"🚀", clothColor:0x8833CC, buildStyle:"future"  },
];

var SEASONS = [
  { name:'Printemps', icon:'🌱', food:1.15, sickness:0.95, moveBias:'forest', tint:0x9EDB7A },
  { name:'Été', icon:'☀️', food:1.0, sickness:0.9, moveBias:'shore', tint:0xF0C55A },
  { name:'Automne', icon:'🍂', food:0.9, sickness:1.0, moveBias:'plains', tint:0xD88A4D },
  { name:'Hiver', icon:'❄️', food:0.68, sickness:1.18, moveBias:'plains', tint:0xB8D8F2 }
];

// ── ÉTATS DES CRÉATURES ───────────────────────────────────────
var STATE = {
  WANDER:    'wander',
  SEEK_FOOD: 'seek_food',
  SEEK_WATER:'seek_water',
  FLEE:      'flee',
  HUNT:      'hunt',
  EAT:       'eat',
  DRINK:     'drink',
  REST:      'rest',
  REPRODUCE: 'reproduce',
  DEAD:      'dead',
};

// ── TERRAIN ──────────────────────────────────────────────────
function getHeight(x, z) {
  var nx = x / TERRAIN_SIZE;
  var nz = z / TERRAIN_SIZE;
  var h  = 0;
  h += Math.sin(nx * Math.PI * 2.8) * 16;
  h += Math.cos(nz * Math.PI * 3.5) * 13;
  h += Math.sin(nx * Math.PI * 6.5 + nz * Math.PI * 4.8) * 7;
  h += Math.cos(nx * Math.PI * 11  - nz * Math.PI * 9  ) * 3.5;
  h += Math.sin(nx * Math.PI * 18  + nz * Math.PI * 14 ) * 1.5;
  h += Math.cos(nx * Math.PI * 25  - nz * Math.PI * 22 ) * 0.8;
  var d  = Math.sqrt(x*x + z*z);
  if (d < 35) h -= (35 - d) * 0.55;
  var edge = Math.max(Math.abs(nx), Math.abs(nz));
  if (edge > 0.42) h += (edge - 0.42) * 80;
  return h;
}

function getBiome(x, z) {
  var h = getHeight(x, z);
  if (h > 22) return 'alpine';
  if (h > 12) return 'highland';
  if (h > 4)  return 'forest';
  if (h > 0.5)return 'plains';
  return 'shore';
}

function biomeLabel(b) {
  var map = { alpine:'❄️ Alpin', highland:'⛰️ Hauteurs', forest:'🌿 Forêt', plains:'🌾 Plaines', shore:'💧 Rive' };
  return map[b] || '🌍';
}

function createTerrain() {
  var geo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, TERRAIN_SEG, TERRAIN_SEG);
  geo.rotateX(-Math.PI / 2);
  var pos = geo.attributes.position;
  var colors = [];
  for (var i = 0; i < pos.count; i++) {
    var x = pos.getX(i), z = pos.getZ(i);
    var h = getHeight(x, z);
    pos.setY(i, h);
    var c = new THREE.Color();
    if      (h < -0.8) c.setHex(0xAA9B7A);
    else if (h <  4  ) c.setHex(0x4E7A38);
    else if (h < 10  ) c.setHex(0x3D6630);
    else if (h < 17  ) c.setHex(0x5A7050);
    else if (h < 23  ) c.setHex(0x807870);
    else               c.setHex(0xE8E8F2);
    colors.push(c.r, c.g, c.b);
  }
  pos.needsUpdate = true;
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  terrainMesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors:true }));
  terrainMesh.receiveShadow = true;
  scene.add(terrainMesh);
}

function createWater() {
  var geo = new THREE.PlaneGeometry(TERRAIN_SIZE * 1.8, TERRAIN_SIZE * 1.8, 22, 22);
  geo.rotateX(-Math.PI / 2);
  waterMesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color:0x1565A8, transparent:true, opacity:0.72 }));
  waterMesh.position.y = WATER_LEVEL;
  scene.add(waterMesh);
}

function createSky() {
  skyMesh = new THREE.Mesh(
    new THREE.SphereGeometry(950, 28, 14),
    new THREE.MeshBasicMaterial({ color:0x87CEEB, side:THREE.BackSide })
  );
  scene.add(skyMesh);

  sunMesh = new THREE.Mesh(new THREE.SphereGeometry(9,14,9), new THREE.MeshBasicMaterial({ color:0xFFDD55 }));
  sunMesh.add(new THREE.Mesh(new THREE.SphereGeometry(14,14,9), new THREE.MeshBasicMaterial({ color:0xFFEE88, transparent:true, opacity:0.15, side:THREE.BackSide })));
  scene.add(sunMesh);

  moonMesh = new THREE.Mesh(new THREE.SphereGeometry(6,14,9), new THREE.MeshBasicMaterial({ color:0xDDDDCC }));
  scene.add(moonMesh);

  var starPos = [];
  for (var s = 0; s < 2800; s++) {
    var th = Math.random()*Math.PI*2, ph = Math.random()*Math.PI, r=850;
    starPos.push(r*Math.sin(ph)*Math.cos(th), Math.abs(r*Math.cos(ph))+30, r*Math.sin(ph)*Math.sin(th));
  }
  var starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos,3));
  starPoints = new THREE.Points(starGeo, new THREE.PointsMaterial({ color:0xFFFFFF, size:1.7 }));
  starPoints.visible = false;
  scene.add(starPoints);

  for (var ci = 0; ci < 16; ci++) {
    var cloud = makeCloud();
    cloud.position.set((Math.random()-0.5)*500, 52+Math.random()*55, (Math.random()-0.5)*500);
    cloud.userData.cloudSpeed = 0.7 + Math.random() * 1.1;
    cloud.userData.cloudDir   = Math.random() > 0.5 ? 1 : -1;
    cloud.userData.isCloud    = true;
    scene.add(cloud);
  }
}

function makeCloud() {
  var g = new THREE.Group();
  var m = new THREE.MeshLambertMaterial({ color:0xFFFFFF, transparent:true, opacity:0.88 });
  for (var i = 0; i < 5+Math.floor(Math.random()*4); i++) {
    var r = 5+Math.random()*8;
    var p = new THREE.Mesh(new THREE.SphereGeometry(r,7,5), m);
    p.position.set((Math.random()-0.5)*18, (Math.random()-0.5)*4, (Math.random()-0.5)*9);
    g.add(p);
  }
  return g;
}

function createLights() {
  ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  sunLight = new THREE.DirectionalLight(0xFFF4DC, 1.4);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width  = 1024;
  sunLight.shadow.mapSize.height = 1024;
  sunLight.shadow.camera.left = sunLight.shadow.camera.bottom = -160;
  sunLight.shadow.camera.right = sunLight.shadow.camera.top = 160;
  sunLight.shadow.camera.far = 600;
  scene.add(sunLight);
  moonLight = new THREE.DirectionalLight(0x304080, 0.35);
  moonLight.visible = false;
  scene.add(moonLight);
}

// ── ANNEAU DE SÉLECTION ───────────────────────────────────────
function createSelectionRing() {
  var geo = new THREE.TorusGeometry(2.2, 0.15, 8, 28);
  selectionRing = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color:0xFFDD55 }));
  selectionRing.rotation.x = Math.PI / 2;
  selectionRing.visible = false;
  scene.add(selectionRing);
}

// ── ARBRES ───────────────────────────────────────────────────
function makeTrees(n) {
  for (var i = 0; i < n; i++) {
    var x = (Math.random()-0.5)*TERRAIN_SIZE*0.88;
    var z = (Math.random()-0.5)*TERRAIN_SIZE*0.88;
    var h = getHeight(x,z);
    if (h < 0.6 || h > 18) continue;
    var t = makeTree();
    t.position.set(x, h, z);
    t.rotation.y = Math.random()*Math.PI*2;
    t.scale.setScalar(0.65 + Math.random()*0.9);
    scene.add(t);
  }
}

function makeTree() {
  var g = new THREE.Group();
  var trH = 2.5+Math.random()*1.5;
  var trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28,0.44,trH,6), new THREE.MeshLambertMaterial({color:0x5C3A1E}));
  trunk.position.y = trH/2;
  trunk.castShadow = true;
  g.add(trunk);
  var leafCols = [0x2D6A27,0x3A7D30,0x4A8D3A,0x23592A,0x518A3E];
  var layers = 2+Math.floor(Math.random()*2);
  for (var l=0; l<layers; l++) {
    var r = (3.2-l*0.55)*(0.85+Math.random()*0.3);
    var cone = new THREE.Mesh(new THREE.ConeGeometry(r,3.2,7), new THREE.MeshLambertMaterial({color:leafCols[Math.floor(Math.random()*leafCols.length)]}));
    cone.position.y = trH + l*2.4;
    cone.castShadow = true;
    g.add(cone);
  }
  return g;
}

// ── ADN ──────────────────────────────────────────────────────
function randomDNA() {
  return {
    cold:     Math.random() * 0.35,
    heat:     Math.random() * 0.35,
    speed:    0.2 + Math.random() * 0.4,
    strength: 0.2 + Math.random() * 0.4,
    camo:     Math.random() * 0.3,
    stamina:  0.2 + Math.random() * 0.4,
    immunity: 0.15 + Math.random() * 0.35,
  };
}

function inheritDNA(dna1, dna2) {
  var child = {};
  var keys = Object.keys(dna1);
  for (var i = 0; i < keys.length; i++) {
    var k   = keys[i];
    var avg = (dna1[k] + dna2[k]) / 2;
    var mut = (Math.random() - 0.5) * 0.14;  // mutation ±7%
    child[k] = Math.max(0, Math.min(1, avg + mut));
  }
  return child;
}

function dominantTrait(dna) {
  var max = -1, name = '';
  if (dna.cold     > max) { max = dna.cold;     name = '❄️ Résistance au froid'; }
  if (dna.heat     > max) { max = dna.heat;     name = '🔥 Tolérance à la chaleur'; }
  if (dna.speed    > max) { max = dna.speed;    name = '💨 Agilité extrême'; }
  if (dna.strength > max) { max = dna.strength; name = '💪 Force brute'; }
  if (dna.camo     > max) { max = dna.camo;     name = '🌿 Camouflage naturel'; }
  if (dna.stamina  > max) { max = dna.stamina;  name = '🏃 Endurance surhumaine'; }
  if (dna.immunity > max) { max = dna.immunity; name = '🧬 Résistance immunitaire'; }
  return name;
}

function dominantGeneKey(dna) {
  var bestKey = 'stamina';
  var bestVal = -1;
  var keys = ['cold', 'heat', 'speed', 'strength', 'camo', 'stamina', 'immunity'];
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if ((dna[key] || 0) > bestVal) {
      bestVal = dna[key] || 0;
      bestKey = key;
    }
  }
  return bestKey;
}

function dominantGeneColor(key) {
  var map = {
    cold: 0x9AD8FF,
    heat: 0xD36A33,
    speed: 0xF2D54B,
    strength: 0xC86B38,
    camo: 0x58A055,
    stamina: 0x9C74CC,
    immunity: 0x57C7B6
  };
  return map[key] || 0xDDBB66;
}

// ── COULEUR D'ADAPTATION ──────────────────────────────────────
function adaptedColor(basehex, dna) {
  var base  = new THREE.Color(basehex);
  var cold  = new THREE.Color(0xD8EEFF);
  var heat  = new THREE.Color(0xAA4420);
  var fast  = new THREE.Color(0xDDB840);
  var camo  = new THREE.Color(0x3A7A28);
  var stamina = new THREE.Color(0x9C74CC);
  var immunity = new THREE.Color(0x57C7B6);

  // Blend
  base.lerp(cold, dna.cold   * 0.65);
  base.lerp(heat, dna.heat   * 0.5);
  base.lerp(fast, dna.speed  * 0.3);
  base.lerp(camo, dna.camo   * 0.55);
  base.lerp(stamina, (dna.stamina || 0) * 0.22);
  base.lerp(immunity, (dna.immunity || 0) * 0.18);
  base.lerp(new THREE.Color(dominantGeneColor(dominantGeneKey(dna))), 0.18);
  return base;
}

function ensureEraStats(index) {
  if (!worldStats.eras[index]) {
    worldStats.eras[index] = { name: ERAS[index].name, births:0, deaths:0, wars:0, conversions:0, diseaseCases:0 };
  }
  return worldStats.eras[index];
}

function recordStat(kind, amount, era) {
  amount = amount || 1;
  era = typeof era === 'number' ? era : eraIndex;
  if (typeof worldStats[kind] === 'number') worldStats[kind] += amount;
  var stats = ensureEraStats(era);
  if (typeof stats[kind] === 'number') stats[kind] += amount;
}

function registerCreatureMetadata(creature) {
  var ud = creature.userData;
  creatureIdCounter++;
  ud.id = creatureIdCounter;
  ud.familyName = ud.familyName || (ud.type === 'human' ? 'Maison ' + creatureIdCounter : ud.type === 'wolf' ? 'Meute ' + creatureIdCounter : 'Lignée ' + creatureIdCounter);
  ud.parents = ud.parents || [];
  ud.children = ud.children || [];
  ud.birthEra = eraIndex;
  ud.birthYear = worldYear;
  ud.deathCause = null;
  ud.deathYear = null;
  ud.disease = null;
  ud.faith = ud.faith || 0;
  creatureRegistry[ud.id] = creature;
}

function recordBirth(creature, source) {
  creature.userData.birthSource = source || 'natural';
  recordStat('births', 1, creature.userData.birthEra);
}

function markCreatureDead(creature, cause, source) {
  if (!creature || !creature.userData || !creature.userData.alive) return false;
  creature.userData.alive = false;
  creature.userData.deathCause = cause || 'unknown';
  creature.userData.deathYear = worldYear;
  if (source && source.userData) creature.userData.killedBy = source.userData.type;
  recordStat('deaths', 1, eraIndex);
  if (cause === 'war') recordStat('wars', 1, eraIndex);
  return true;
}

function getAllGroundCreatures() {
  return humans.concat(deerPop).concat(wolves).concat(prophets).concat(rebels).concat(demons);
}

function getSeasonInfo() {
  return SEASONS[seasonIndex] || SEASONS[0];
}

function updateCreatureAppearance(creature) {
  if (!creature || !creature.userData || !creature.userData.dna) return;
  var ud = creature.userData;
  var dna = ud.dna;
  if (ud.bodyMat) {
    var baseColor = ud.type === 'human' ? ERAS[eraIndex].clothColor : ud.type === 'wolf' ? 0x444440 : 0xA85C2A;
    if (ud.isProphet) baseColor = 0xE0C674;
    if (ud.isRebel) baseColor = 0x5B1426;
    ud.bodyMat.color.copy(adaptedColor(baseColor, dna));
    if ((ud.faith || 0) > 0.5) ud.bodyMat.color.lerp(new THREE.Color(0xEEDD88), Math.min(0.28, (ud.faith - 0.5) * 0.4));
    if (ud.disease) ud.bodyMat.color.lerp(new THREE.Color(0x5CCF6E), 0.22 + ud.disease.severity * 0.18);
  }
  if (ud.skinMat) {
    ud.skinMat.color.copy(adaptedColor(0xD4A37D, dna));
    if (ud.disease) ud.skinMat.color.lerp(new THREE.Color(0x74D990), 0.08 + ud.disease.severity * 0.08);
  }
}

// ── SURVIE : adaptation au biome ─────────────────────────────
function adaptCreatureToBiome(ud, dt) {
  var biome   = ud.biome || 'plains';
  var rate    = ADAPT_SPEED * dt * evolutionSpeed * 60;

  if (biome === 'alpine') {
    ud.dna.cold    = Math.min(1, ud.dna.cold    + rate);
    ud.dna.heat    = Math.max(0, ud.dna.heat    - rate * 0.5);
  } else if (biome === 'plains') {
    ud.dna.heat    = Math.min(1, ud.dna.heat    + rate * 0.6);
  } else if (biome === 'forest') {
    ud.dna.camo    = Math.min(1, ud.dna.camo    + rate);
    ud.dna.stamina = Math.min(1, ud.dna.stamina + rate * 0.4);
  } else if (biome === 'highland') {
    ud.dna.cold    = Math.min(1, ud.dna.cold    + rate * 0.5);
    ud.dna.stamina = Math.min(1, ud.dna.stamina + rate * 0.5);
  }

  // Pression prédatrice → vitesse & endurance croissent
  if (ud.state === STATE.FLEE) {
    ud.dna.speed   = Math.min(1, ud.dna.speed   + rate * 1.5);
    ud.dna.stamina = Math.min(1, ud.dna.stamina + rate);
  }
  if (ud.state === STATE.HUNT) {
    ud.dna.strength= Math.min(1, ud.dna.strength+ rate * 1.2);
    ud.dna.speed   = Math.min(1, ud.dna.speed   + rate * 0.8);
  }
}

// ── CORPS HUMAIN ──────────────────────────────────────────────
function makeHuman(dna, gen) {
  dna = dna || randomDNA();
  gen = gen || 1;
  var g       = new THREE.Group();
  var bodyCol = adaptedColor(ERAS[eraIndex].clothColor, dna);
  var skinCols= [0xF0C8A0, 0xDBA880, 0xC89060, 0x7A5030];
  var skinHex = skinCols[Math.floor(Math.random()*skinCols.length)];
  var skinCol = adaptedColor(skinHex, dna);

  var bodyMat = new THREE.MeshLambertMaterial({ color: bodyCol });
  var skinMat = new THREE.MeshLambertMaterial({ color: skinCol });
  var darkMat = new THREE.MeshLambertMaterial({ color: 0x1A1008 });

  var body = new THREE.Mesh(new THREE.CylinderGeometry(0.36,0.41,1.45,7), bodyMat);
  body.position.y = 1.0; body.castShadow = true; g.add(body);

  var head = new THREE.Mesh(new THREE.SphereGeometry(0.35,9,7), skinMat);
  head.position.y = 2.0; head.castShadow = true; g.add(head);

  var legs = [];
  for (var li=-1; li<=1; li+=2) {
    var leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.11,0.88,5), darkMat);
    leg.position.set(li*0.19, 0.13, 0);
    g.add(leg); legs.push(leg);
  }

  var arms = [];
  for (var ai=-1; ai<=1; ai+=2) {
    var arm = new THREE.Mesh(new THREE.CylinderGeometry(0.095,0.085,0.72,5), bodyMat);
    arm.position.set(ai*0.53, 1.05, 0);
    arm.rotation.z = ai*0.28;
    g.add(arm); arms.push(arm);
  }

  // Fourrure si résistance au froid élevée
  if (dna.cold > 0.5) {
    var furMat = new THREE.MeshLambertMaterial({ color:0xDDEEFF, transparent:true, opacity:0.4 });
    var fur = new THREE.Mesh(new THREE.SphereGeometry(0.52,8,6), furMat);
    fur.position.y = 1.05;
    g.add(fur);
  }

  // Échelle selon taille (force = plus grand)
  var sc = 0.8 + dna.strength * 0.38;
  g.scale.setScalar(sc);

  var ud = {
    type:'human', gen:gen, dna:dna,
    bodyMat:bodyMat, skinMat:skinMat,
    legs:legs, arms:arms,
    hunger:0.9, thirst:0.9, energy:1.0,
    state:STATE.WANDER,
    biome:'plains',
    dir:new THREE.Vector2(Math.random()-0.5, Math.random()-0.5).normalize(),
    dirTimer:Math.random()*5,
    animOff:Math.random()*Math.PI*2,
    stateTimer:0,
    target:null,
    reproTimer:Math.random()*30+20,
    age:0,
    alive:true,
  };
  g.userData = ud;
  registerCreatureMetadata(g);
  recordBirth(g, gen > 1 ? 'lineage' : 'spawn');
  updateCreatureAppearance(g);

  // Enregistrer pour raycasting
  g.traverse(function(child) {
    if (child.isMesh) {
      child.userData.creatureRef = g;
      allSelectableMeshes.push(child);
    }
  });
  return g;
}

// ── CORPS CERF ────────────────────────────────────────────────
function makeDeer(dna, gen) {
  dna = dna || randomDNA();
  gen = gen || 1;
  var g       = new THREE.Group();
  var baseCol = 0xA85C2A;
  var bodyCol = adaptedColor(baseCol, dna);
  var colMat  = new THREE.MeshLambertMaterial({ color:bodyCol });
  var darkMat = new THREE.MeshLambertMaterial({ color:0x5A2810 });

  var body = new THREE.Mesh(new THREE.BoxGeometry(1.75,0.95,0.72), colMat);
  body.position.y = 1.22; body.castShadow = true; g.add(body);

  var neck = new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.25,0.82,6), colMat);
  neck.position.set(0.8,1.65,0); neck.rotation.z=-0.75; g.add(neck);

  var head = new THREE.Mesh(new THREE.BoxGeometry(0.62,0.5,0.5), colMat);
  head.position.set(1.18,2.05,0); g.add(head);

  // Bois
  if (Math.random() > 0.4) {
    var antMat = new THREE.MeshLambertMaterial({color:0x7B5010});
    for (var ai=-1; ai<=1; ai+=2) {
      var ant = new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,0.62,4), antMat);
      ant.position.set(1.18+ai*0.17,2.48,0); ant.rotation.z=ai*0.28; g.add(ant);
      var br  = new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,0.32,4), antMat);
      br.position.set(1.18+ai*0.24,2.68,0); br.rotation.z=ai*0.88; g.add(br);
    }
  }

  var legs=[], lPos=[[-0.58,0,0.21],[0.58,0,0.21],[-0.58,0,-0.21],[0.58,0,-0.21]];
  for (var li=0; li<4; li++) {
    var leg=new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.09,1.08,5),darkMat);
    leg.position.set(lPos[li][0],0.53,lPos[li][2]);
    g.add(leg); legs.push(leg);
  }

  var sc = 0.75 + dna.strength * 0.35;
  g.scale.setScalar(sc);

  var ud={
    type:'deer', gen:gen, dna:dna,
    bodyMat:colMat, legs:legs,
    hunger:0.9, thirst:0.9, energy:1.0,
    state:STATE.WANDER,
    biome:'plains',
    dir:new THREE.Vector2(Math.random()-0.5,Math.random()-0.5).normalize(),
    dirTimer:Math.random()*5,
    animOff:Math.random()*Math.PI*2,
    stateTimer:0, target:null,
    reproTimer:Math.random()*25+15,
    age:0, faceX:true,  // tête orientée en +X, formule rotation corrigée
    alive:true,
  };
  g.userData = ud;
  registerCreatureMetadata(g);
  recordBirth(g, gen > 1 ? 'lineage' : 'spawn');
  updateCreatureAppearance(g);
  g.traverse(function(c){ if(c.isMesh){ c.userData.creatureRef=g; allSelectableMeshes.push(c); }});
  return g;
}

// ── CORPS LOUP ────────────────────────────────────────────────
function makeWolf(dna, gen) {
  dna = dna || randomDNA();
  dna.strength = Math.max(0.5, dna.strength);
  dna.speed    = Math.max(0.45, dna.speed);
  gen = gen || 1;
  var g       = new THREE.Group();
  var bodyCol = adaptedColor(0x444440, dna);
  var colMat  = new THREE.MeshLambertMaterial({color:bodyCol});
  var darkMat = new THREE.MeshLambertMaterial({color:0x1A1A18});
  var eyeMat  = new THREE.MeshLambertMaterial({color:0xFF8800});

  var body = new THREE.Mesh(new THREE.BoxGeometry(1.65,0.82,0.65), colMat);
  body.position.y=1.0; body.castShadow=true; g.add(body);

  var neck = new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.27,0.62,6), colMat);
  neck.position.set(0.75,1.48,0); neck.rotation.z=-0.62; g.add(neck);

  var head = new THREE.Mesh(new THREE.BoxGeometry(0.72,0.58,0.55), colMat);
  head.position.set(1.1,1.82,0); g.add(head);

  // Museau
  var snout = new THREE.Mesh(new THREE.BoxGeometry(0.3,0.25,0.38), colMat);
  snout.position.set(1.48,1.72,0); g.add(snout);

  // Yeux
  for (var ei=-1; ei<=1; ei+=2) {
    var eye=new THREE.Mesh(new THREE.SphereGeometry(0.07,6,6), eyeMat);
    eye.position.set(1.36,1.9,ei*0.2); g.add(eye);
  }

  // Queue
  var tail=new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.04,0.75,5), colMat);
  tail.position.set(-0.9,1.45,0); tail.rotation.z=0.65; g.add(tail);

  var legs=[],lPos=[[-0.5,0,0.2],[0.5,0,0.2],[-0.5,0,-0.2],[0.5,0,-0.2]];
  for (var li=0; li<4; li++) {
    var leg=new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.09,0.95,5),darkMat);
    leg.position.set(lPos[li][0],0.45,lPos[li][2]);
    g.add(leg); legs.push(leg);
  }

  var sc=0.85+dna.strength*0.3;
  g.scale.setScalar(sc);

  var ud={
    type:'wolf', gen:gen, dna:dna,
    bodyMat:colMat, legs:legs,
    hunger:0.75, thirst:0.85, energy:1.0,
    state:STATE.WANDER,
    biome:'forest',
    dir:new THREE.Vector2(Math.random()-0.5,Math.random()-0.5).normalize(),
    dirTimer:Math.random()*4,
    animOff:Math.random()*Math.PI*2,
    stateTimer:0, target:null,
    reproTimer:Math.random()*40+30,
    age:0, faceX:true,  // tête orientée en +X
    alive:true,
  };
  g.userData=ud;
  registerCreatureMetadata(g);
  recordBirth(g, gen > 1 ? 'lineage' : 'spawn');
  updateCreatureAppearance(g);
  g.traverse(function(c){ if(c.isMesh){ c.userData.creatureRef=g; allSelectableMeshes.push(c); }});
  return g;
}

// ── OISEAUX ──────────────────────────────────────────────────
function makeBird(dna, gen) {
  dna = dna || randomDNA();
  gen = gen || 1;
  var g  = new THREE.Group();
  var pals=[0x1A1A1A,0xAA3322,0x224488,0x446622,0x884422];
  var col= pals[Math.floor(Math.random()*pals.length)];
  var mat= new THREE.MeshLambertMaterial({color:adaptedColor(col,dna)});

  var body=new THREE.Mesh(new THREE.ConeGeometry(0.2,0.65,5),mat);
  body.rotation.z=Math.PI/2; g.add(body);

  var wings=[];
  for (var wi=-1; wi<=1; wi+=2) {
    var w=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.6,0.28),mat);
    w.position.set(0,0,wi*0.38); g.add(w); wings.push(w);
  }

  var ud={
    type:'bird', gen:gen, dna:dna,
    wings:wings,
    hunger:0.9, thirst:0.9, energy:1.0,
    state:STATE.WANDER,
    biome:'highland',
    dir:new THREE.Vector3(Math.random()-0.5,0,Math.random()-0.5).normalize(),
    altitude:20+Math.random()*32,
    animOff:Math.random()*Math.PI*2,
    age:0,
    alive:true,
  };
  g.userData=ud;
  return g;
}

// ── SPAWN ────────────────────────────────────────────────────
function findGround(minH,maxH) {
  for (var i=0;i<28;i++) {
    var x=(Math.random()-0.5)*TERRAIN_SIZE*0.86;
    var z=(Math.random()-0.5)*TERRAIN_SIZE*0.86;
    var h=getHeight(x,z);
    if (h>=minH && h<=maxH) return new THREE.Vector3(x,h,z);
  }
  return null;
}

function spawnHuman() {
  if (humans.length >= MAX_HUMANS) return;
  var pos = findGround(0.5,13);
  if (!pos) return;
  var h = makeHuman();
  h.position.copy(pos);
  h.rotation.y = Math.random()*Math.PI*2;
  scene.add(h); humans.push(h);
}

function spawnDeer() {
  if (deerPop.length >= MAX_DEER) return;
  var pos = findGround(0.6,14);
  if (!pos) return;
  var d = makeDeer();
  d.position.copy(pos);
  d.rotation.y = Math.random()*Math.PI*2;
  scene.add(d); deerPop.push(d);
}

function spawnWolf() {
  if (wolves.length >= MAX_WOLVES) return;
  var pos = findGround(1,15);
  if (!pos) return;
  var w = makeWolf();
  w.position.copy(pos);
  w.rotation.y = Math.random()*Math.PI*2;
  scene.add(w); wolves.push(w);
}

function spawnBird() {
  if (birds.length >= MAX_BIRDS) return;
  var b = makeBird();
  b.position.set((Math.random()-0.5)*TERRAIN_SIZE*0.85, b.userData.altitude, (Math.random()-0.5)*TERRAIN_SIZE*0.85);
  scene.add(b); birds.push(b);
}

// ── REPRODUCTION ─────────────────────────────────────────────
function tryReproduce(creature, population, spawnFn, maxPop) {
  var ud = creature.userData;
  if (ud.hunger < 0.55 || ud.thirst < 0.55 || ud.energy < 0.5) return;
  if (population.length >= maxPop) return;

  // Chercher partenaire proche
  var best = null, bestDist = 16;
  for (var i=0; i<population.length; i++) {
    var other = population[i];
    if (other === creature || !other.userData.alive) continue;
    var d = creature.position.distanceTo(other.position);
    if (d < bestDist) { best=other; bestDist=d; }
  }
  if (!best) return;

  var childDNA = inheritDNA(ud.dna, best.userData.dna);
  var childGen = Math.max(ud.gen, best.userData.dna ? best.userData.gen : 1) + 1;

  var pos = findGround(0.5, 14);
  if (!pos) return;

  var child = spawnFn(childDNA, childGen);
  child.userData.parents = [ud.id, best.userData.id];
  child.userData.familyName = ud.familyName || best.userData.familyName || (ud.type === 'human' ? 'Maison ' + ud.id : ud.type === 'wolf' ? 'Meute ' + ud.id : 'Lignée ' + ud.id);
  ud.children.push(child.userData.id);
  best.userData.children.push(child.userData.id);
  child.position.copy(pos);
  child.rotation.y = Math.random()*Math.PI*2;
  scene.add(child);
  population.push(child);

  // Dépenser énergie
  ud.hunger  -= 0.22;
  ud.energy  -= 0.3;
  ud.reproTimer = 25 + Math.random() * 30;

  if (childGen >= 3 && Math.random() < 0.3) {
    addEvent("🧬 Gén." + childGen + " " + ud.type + " porteur de '" + dominantTrait(childDNA) + "' !");
    adaptationLogCooldown = 30;
  }
}

function countNearbyLiving(population, position, radius, exclude) {
  var count = 0;
  for (var i=0; i<population.length; i++) {
    var creature = population[i];
    if (creature === exclude || !creature.userData.alive) continue;
    if (position.distanceTo(creature.position) <= radius) count++;
  }
  return count;
}

// ── DOMMAGES ENVIRONNEMENTAUX ─────────────────────────────────
function applyEnvDamage(ud, biome, dt) {
  var dmg = dt * evolutionSpeed;
  if (biome === 'alpine') {
    var coldRes = ud.dna.cold;
    var cold_dmg = Math.max(0, 0.018 - coldRes * 0.018);
    ud.energy -= cold_dmg * dmg * 8;
    ud.hunger -= cold_dmg * dmg * 4;
    if (isBlizzard) { ud.energy -= 0.04 * dmg; ud.hunger -= 0.02 * dmg; }
  }
  if (biome === 'plains' && worldTime > 0.3 && worldTime < 0.7) {
    var heatRes  = ud.dna.heat;
    var heat_dmg = Math.max(0, 0.012 - heatRes * 0.012);
    ud.thirst -= heat_dmg * dmg * 10;
  }
}

// ── MACHINE À ÉTATS ──────────────────────────────────────────
function updateCreatureAI(creature, dt, predators, prey, population, maxPop, spawnFn) {
  var ud   = creature.userData;
  var pos  = creature.position;
  ud.biome = getBiome(pos.x, pos.z);

  // Âge et besoins
  ud.age = (ud.age || 0) + dt;
  var spd = evolutionSpeed;
  ud.hunger -= HUNGER_RATE * dt * spd * (seasonIndex === 3 ? 1.22 : seasonIndex === 0 ? 0.92 : 1);
  ud.thirst -= THIRST_RATE * dt * spd * (seasonIndex === 1 ? 1.16 : 1);

  // Effets biome
  applyEnvDamage(ud, ud.biome, dt);
  applySeasonalPressure(ud, ud.biome, dt);

  // Clamp
  ud.hunger  = Math.max(0, Math.min(1, ud.hunger));
  ud.thirst  = Math.max(0, Math.min(1, ud.thirst));
  ud.energy  = Math.max(0, Math.min(1, ud.energy));

  // Mort
  if (ud.hunger <= 0 || ud.thirst <= 0 || ud.energy <= 0) { markCreatureDead(creature, 'survival'); return; }

  // Adaptation génétique progressive
  adaptCreatureToBiome(ud, dt);

  // Regen énergie au repos
  if (ud.state === STATE.REST) {
    ud.energy = Math.min(1, ud.energy + ENERGY_REGEN * dt * spd);
    if (ud.energy > 0.65) ud.state = STATE.WANDER;
    return;
  }

  // Priorité: fuir si prédateur proche
  if (predators && predators.length > 0) {
    var nearest = null, nearDist = 30 + ud.dna.camo * 18; // camo = détection plus tardive
    if (ud.type === 'human') nearDist += HUMAN_ALERT_BONUS + ud.dna.stamina * 8;
    for (var pi=0; pi<predators.length; pi++) {
      var pred = predators[pi];
      if (!pred.userData.alive) continue;
      var d = pos.distanceTo(pred.position);
      if (d < nearDist) { nearest=pred; nearDist=d; }
    }
    if (nearest) {
      ud.state  = STATE.FLEE;
      ud.target = nearest;
    }
  }

  // Priorité: faim/soif
  if (ud.state !== STATE.FLEE) {
    if (ud.energy < 0.2) { ud.state = STATE.REST; return; }
    if (ud.thirst < 0.28) { ud.state = STATE.SEEK_WATER; }
    else if (ud.hunger < 0.25) { ud.state = STATE.SEEK_FOOD; }
    else if (ud.hunger > 0.8 && ud.thirst > 0.8) {
      ud.reproTimer -= dt * spd;
      if (ud.reproTimer <= 0) {
        tryReproduce(creature, population, spawnFn, maxPop);
      }
    }
  }

  // Exécution état
  ud.stateTimer += dt;
  maybeSeasonalMigration(creature, dt);

  if (ud.state === STATE.FLEE) {
    var fleeSpeed = 2.8 + ud.dna.speed * 2.2;
    var fleeCost  = 0.018;
    if (ud.type === 'human') {
      fleeSpeed += HUMAN_FLEE_SPEED_BONUS + ud.dna.stamina * 0.45;
      fleeCost   = 0.014;
    }
    fleeFrom(creature, ud.target, dt, fleeSpeed);
    ud.energy -= fleeCost * dt * spd;
    if (!ud.target || !ud.target.userData.alive ||
        pos.distanceTo(ud.target.position) > 55) {
      ud.state = STATE.WANDER;
      ud.target= null;
    }
  }
  else if (ud.state === STATE.SEEK_WATER) {
    var waterPos = new THREE.Vector3(0, 0, 0); // lac central
    moveTo(creature, waterPos, dt, (1.2 + ud.dna.speed) * spd);
    var distW = Math.sqrt(pos.x*pos.x + pos.z*pos.z);
    if (distW < 42) { ud.state = STATE.DRINK; ud.stateTimer = 0; }
  }
  else if (ud.state === STATE.DRINK) {
    ud.thirst = Math.min(1, ud.thirst + 0.12 * dt * spd);
    if (ud.thirst > 0.85) ud.state = STATE.WANDER;
    if (ud.stateTimer > 8) ud.state = STATE.WANDER;
  }
  else if (ud.state === STATE.SEEK_FOOD) {
    // Herbivores: chercher zone herbeuse
    if (!ud.target || !ud.target.alive) {
      var fx=(Math.random()-0.5)*TERRAIN_SIZE*0.7;
      var fz=(Math.random()-0.5)*TERRAIN_SIZE*0.7;
      ud.target = new THREE.Vector3(fx, getHeight(fx,fz), fz);
    }
    moveTo(creature, ud.target, dt, (1.1 + ud.dna.speed * 0.8) * spd);
    var bm = getBiome(pos.x, pos.z);
    if (bm === 'forest' || bm === 'plains') {
      ud.state = STATE.EAT; ud.stateTimer = 0; ud.target=null;
    }
    if (ud.stateTimer > 12) { ud.state = STATE.WANDER; ud.target=null; }
  }
  else if (ud.state === STATE.EAT) {
    ud.hunger = Math.min(1, ud.hunger + 0.09 * dt * spd * getSeasonFoodGain(ud));
    if (ud.hunger > 0.85) ud.state = STATE.WANDER;
    if (ud.stateTimer > 10) ud.state = STATE.WANDER;
  }
  else if (ud.state === STATE.WANDER) {
    wander(creature, dt, (1.0 + ud.dna.speed * 0.7) * spd);
  }

  // Bobbing marche
  var t = Date.now() * 0.003 + ud.animOff;
  var groundH = getHeight(pos.x, pos.z);
  creature.position.y = groundH + Math.abs(Math.sin(t * 3.8)) * 0.12;
  if (ud.legs) {
    for (var li=0; li<ud.legs.length; li++) {
      ud.legs[li].rotation.x = Math.sin(t*4 + li*Math.PI) * 0.42;
    }
  }
  updateCreatureAppearance(creature);
}

// ── IA LOUP ───────────────────────────────────────────────────
function updateWolfAI(wolf, dt) {
  var ud  = wolf.userData;
  var pos = wolf.position;
  ud.biome = getBiome(pos.x, pos.z);

  ud.age = (ud.age || 0) + dt;
  ud.hunger -= HUNGER_RATE * 1.15 * dt * evolutionSpeed * (seasonIndex === 3 ? 1.28 : 1);
  ud.thirst -= THIRST_RATE * dt * evolutionSpeed * (seasonIndex === 1 ? 1.12 : 1);
  applyEnvDamage(ud, ud.biome, dt);
  applySeasonalPressure(ud, ud.biome, dt);
  ud.hunger = Math.max(0, Math.min(1, ud.hunger));
  ud.thirst = Math.max(0, Math.min(1, ud.thirst));
  ud.energy = Math.max(0, Math.min(1, ud.energy));

  if (ud.hunger <= 0 || ud.thirst <= 0 || ud.energy <= 0) { markCreatureDead(wolf, 'survival'); return; }

  adaptCreatureToBiome(ud, dt);

  if (ud.state === STATE.REST) {
    ud.energy = Math.min(1, ud.energy + ENERGY_REGEN * dt * evolutionSpeed);
    if (ud.energy > 0.6) ud.state = STATE.WANDER;
    return;
  }

  if (ud.energy < 0.18) { ud.state = STATE.REST; return; }

  if (ud.thirst < 0.28) {
    ud.state = STATE.SEEK_WATER;
  } else if (ud.hunger < 0.45) {
    // Chercher proie
    var allPrey = deerPop.concat(humans);
    var closest = null, closestD = 9999;
    for (var pi=0; pi<allPrey.length; pi++) {
      var p = allPrey[pi];
      if (!p.userData.alive) continue;
      var d = pos.distanceTo(p.position);
      var isHuman = p.userData.type === 'human';
      // Le camouflage de la proie augmente la distance de détection
      var detectRange = (isHuman ? HUMAN_WOLF_DETECT_RANGE : WOLF_DEFAULT_DETECT_RANGE) - (p.userData.dna.camo || 0) * (isHuman ? 14 : 22);
      if (d < detectRange) {
        var targetScore = d;
        if (isHuman) {
          targetScore += WOLF_HUMAN_TARGET_PENALTY + eraIndex * 2;
          if (deerPop.length > 0) targetScore += 8;
        }
        if (targetScore < closestD) { closestD = targetScore; closest = p; }
      }
    }
    if (closest) { ud.state=STATE.HUNT; ud.target=closest; }
    else { ud.state=STATE.SEEK_FOOD; }
  } else if (ud.state !== STATE.HUNT) {
    ud.state = STATE.WANDER;
  }

  ud.stateTimer += dt;

  if (ud.state === STATE.HUNT && ud.target) {
    if (!ud.target.userData.alive) { ud.state=STATE.WANDER; ud.target=null; return; }
    moveTo(wolf, ud.target.position, dt, (2.0 + ud.dna.speed * 1.8) * evolutionSpeed);
    ud.energy -= 0.014 * dt * evolutionSpeed;
    var isHumanTarget = ud.target.userData.type === 'human';
    var catchDist = isHumanTarget ? 2.6 : 3.5;
    if (pos.distanceTo(ud.target.position) < catchDist) {
      // Chance de tuer basée sur force du loup vs endurance proie
      var killChance;
      if (isHumanTarget) {
        var humanDNA = ud.target.userData.dna || {};
        var nearbyHumans = countNearbyLiving(humans, ud.target.position, HUMAN_GROUP_DEFENSE_RADIUS, ud.target);
        var groupDefense = Math.min(0.18, nearbyHumans * HUMAN_GROUP_DEFENSE_PER_ALLY);
        var humanDefense = (humanDNA.stamina || 0) * 0.28 + (humanDNA.speed || 0) * 0.16 + (humanDNA.strength || 0) * 0.14 + groupDefense + eraIndex * 0.015;
        killChance = 0.18 + ud.dna.strength * 0.22 - humanDefense;
        killChance = Math.max(0.08, Math.min(0.32, killChance));
      } else {
        killChance = 0.4 + ud.dna.strength * 0.4 - (ud.target.userData.dna.stamina || 0) * 0.3;
        killChance = Math.max(0.2, Math.min(0.85, killChance));
      }
      if (Math.random() < killChance) {
        markCreatureDead(ud.target, isHumanTarget ? 'predation' : 'predation', wolf);
        ud.hunger = Math.min(1, ud.hunger + 0.55);
        addEvent("🐺 Un loup capture sa proie (Force " + Math.round(ud.dna.strength*100) + "%)");
        adaptationLogCooldown = 10;
      } else if (isHumanTarget) {
        ud.target.userData.state = STATE.FLEE;
        ud.target.userData.target = wolf;
        ud.target.userData.energy = Math.max(ud.target.userData.energy, 0.32);
        ud.energy = Math.max(0, ud.energy - 0.05);
      }
      ud.state = STATE.WANDER; ud.target=null;
    }
    // Proie qui fuit trop loin
    if (ud.target && pos.distanceTo(ud.target.position) > 90) { ud.state=STATE.WANDER; ud.target=null; }
  }
  else if (ud.state === STATE.SEEK_WATER) {
    moveTo(wolf, new THREE.Vector3(0,0,0), dt, (1.3+ud.dna.speed)*evolutionSpeed);
    if (Math.sqrt(pos.x*pos.x+pos.z*pos.z) < 45) { ud.state=STATE.DRINK; ud.stateTimer=0; }
  }
  else if (ud.state === STATE.DRINK) {
    ud.thirst = Math.min(1, ud.thirst + 0.1 * dt * evolutionSpeed);
    if (ud.thirst > 0.85) ud.state=STATE.WANDER;
  }
  else if (ud.state === STATE.SEEK_FOOD) {
    wander(wolf, dt, (1.2+ud.dna.speed)*evolutionSpeed);
  }
  else {
    wander(wolf, dt, (1.0+ud.dna.speed*0.5)*evolutionSpeed);
  }

  // Reproduction loups
  ud.stateTimer += dt;
  if (ud.hunger > 0.7 && ud.thirst > 0.7 && wolves.length < MAX_WOLVES) {
    ud.reproTimer -= dt * evolutionSpeed;
    if (ud.reproTimer <= 0) {
      tryReproduce(wolf, wolves, makeWolf, MAX_WOLVES);
    }
  }

  // Animation
  var t2 = Date.now()*0.003+ud.animOff;
  wolf.position.y = getHeight(pos.x,pos.z) + Math.abs(Math.sin(t2*4))*0.1;
  if (ud.legs) for (var li=0;li<ud.legs.length;li++) ud.legs[li].rotation.x=Math.sin(t2*5+li*Math.PI)*0.45;
  updateCreatureAppearance(wolf);
}

// ── OISEAUX ──────────────────────────────────────────────────
function updateBirdAI(bird, dt) {
  var ud = bird.userData;
  ud.age = (ud.age || 0) + dt;
  var t  = Date.now()*0.001+ud.animOff;
  if (ud.wings) {
    ud.wings[0].rotation.x =  Math.sin(t*6)*0.55;
    ud.wings[1].rotation.x = -Math.sin(t*6)*0.55;
  }
  bird.position.x += ud.dir.x * ud.dna.speed * 5 * dt * evolutionSpeed;
  bird.position.y  = ud.altitude + Math.sin(t*0.4)*6;
  bird.position.z += ud.dir.z * ud.dna.speed * 5 * dt * evolutionSpeed;
  bird.rotation.y  = Math.atan2(ud.dir.z, -ud.dir.x); // cône nez en -X local
  var half = TERRAIN_SIZE*0.52;
  if (Math.abs(bird.position.x)>half || Math.abs(bird.position.z)>half) {
    ud.dir.x*=-1; ud.dir.z*=-1;
  }
}

// ── NAVIGATION ───────────────────────────────────────────────
function wander(creature, dt, speed) {
  var ud = creature.userData;
  ud.dirTimer -= dt;
  if (ud.dirTimer <= 0) {
    ud.dir.set(Math.random()-0.5, Math.random()-0.5).normalize();
    ud.dirTimer = 2.5+Math.random()*5;
  }
  moveInDir(creature, ud.dir.x, ud.dir.y, dt, speed);
}

function moveTo(creature, target, dt, speed) {
  var dx  = target.x - creature.position.x;
  var dz  = target.z - creature.position.z;
  var len = Math.sqrt(dx*dx+dz*dz);
  if (len < 0.5) return;
  moveInDir(creature, dx/len, dz/len, dt, speed);
}

function fleeFrom(creature, target, dt, speed) {
  var dx = creature.position.x - target.position.x;
  var dz = creature.position.z - target.position.z;
  var len= Math.sqrt(dx*dx+dz*dz);
  if (len < 0.1) { dx=Math.random()-0.5; dz=Math.random()-0.5; len=1; }
  moveInDir(creature, dx/len, dz/len, dt, speed);
}

function moveInDir(creature, dx, dz, dt, speed) {
  var half = TERRAIN_SIZE*0.44;
  var nx   = creature.position.x + dx * speed * dt;
  var nz   = creature.position.z + dz * speed * dt;
  if (Math.abs(nx)>half || Math.abs(nz)>half) {
    if (creature.userData.dir) { creature.userData.dir.negate ? creature.userData.dir.negate() : (creature.userData.dir.x*=-1, creature.userData.dir.y*=-1); }
    return;
  }
  var nh = getHeight(nx,nz);
  if (nh < 0.3) return;
  if (Math.abs(nh - creature.position.y) > 5.5) return;
  creature.position.x = nx;
  creature.position.z = nz;
  // faceX=true : tête en local +X → formule atan2(-dz, dx)
  // faceX=false: tête en local +Z → formule atan2(dx, dz)
  creature.rotation.y = creature.userData.faceX
    ? Math.atan2(-dz, dx)
    : Math.atan2(dx, dz);
}

// ── CYCLE JOUR/NUIT ──────────────────────────────────────────
function updateDayNight(dt) {
  worldTime += dt * 0.006 * evolutionSpeed; // 1 jour ≈ 2.5 min
  if (worldTime >= 1) worldTime -= 1;
  var angle  = worldTime * Math.PI * 2;
  var ss     = Math.sin(angle);
  var sc     = Math.cos(angle);
  var sunD   = 420;
  sunMesh.position.set(sc*sunD, ss*sunD, 80);
  moonMesh.position.set(-sc*sunD, -ss*sunD, -80);
  sunLight.position.copy(sunMesh.position);
  moonLight.position.copy(moonMesh.position);

  if (ss > 0.15) {
    skyMesh.material.color.setHex(0x87CEEB);
    scene.fog.color.setHex(0x87CEEB);
    ambientLight.intensity = 0.55; sunLight.intensity = 1.4;
    sunLight.visible=true; moonLight.visible=false; starPoints.visible=false;
    waterMesh.material.color.setHex(0x1565A8);
  } else if (ss > -0.15) {
    var tt = (ss+0.15)/0.3;
    var dawnC = new THREE.Color(0xFF5020).lerp(new THREE.Color(0x87CEEB),tt);
    skyMesh.material.color.copy(dawnC); scene.fog.color.copy(dawnC);
    ambientLight.intensity = 0.18 + tt*0.37;
    sunLight.intensity     = tt*1.4; sunLight.visible=true;
    moonLight.visible = tt<0.5; starPoints.visible = tt<0.5;
  } else {
    skyMesh.material.color.setHex(0x030810); scene.fog.color.setHex(0x040A18);
    ambientLight.intensity=0.06; sunLight.visible=false;
    moonLight.visible=true; starPoints.visible=true;
    waterMesh.material.color.setHex(0x0A2040);
  }
  // Blizzard
  if (isBlizzard) skyMesh.material.color.setHex(0xCCDDEE);

  var t24   = worldTime * 24;
  var lbl   = t24<5?"Nuit":t24<7?"Aube":t24<12?"Matin":t24<14?"Midi":t24<18?"Après-midi":t24<21?"Crépuscule":"Soir";
  var elT   = document.getElementById('time-display');
  if (elT) elT.textContent = lbl;
}

function updateWater(dt) {
  var t   = Date.now()*0.0008;
  var pos = waterMesh.geometry.attributes.position;
  for (var i=0;i<pos.count;i++) {
    var x=pos.getX(i), z=pos.getZ(i);
    pos.setY(i, Math.sin(x*0.06+t)*0.32 + Math.cos(z*0.09+t*0.7)*0.22);
  }
  pos.needsUpdate=true;
}

function updateClouds(dt) {
  scene.children.forEach(function(o) {
    if (!o.userData.isCloud) return;
    o.position.x += o.userData.cloudSpeed * o.userData.cloudDir * dt * 2;
    if (Math.abs(o.position.x) > 280) o.position.x *= -1;
  });
}

// ── PLUIE / BLIZZARD ─────────────────────────────────────────
function startRain() {
  if (rainSystem) return;
  var geo = new THREE.BufferGeometry();
  var pos = [];
  for (var i=0;i<5000;i++) {
    pos.push((Math.random()-0.5)*440, Math.random()*155+10, (Math.random()-0.5)*440);
  }
  geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  rainSystem = new THREE.Points(geo, new THREE.PointsMaterial({color:0x88AADD,size:0.32,transparent:true,opacity:0.52}));
  scene.add(rainSystem);
}

function stopRain() {
  if (!rainSystem) return;
  scene.remove(rainSystem); rainSystem=null;
}

function updateRain(dt) {
  if (!rainSystem) return;
  var pos = rainSystem.geometry.attributes.position;
  for (var i=0;i<pos.count;i++) {
    var y=pos.getY(i) - 95*dt;
    if (y<-5) y+=160;
    pos.setY(i,y);
  }
  pos.needsUpdate=true;
}

// ── MÉTÉORITE ────────────────────────────────────────────────
function activateMeteor() {
  var tx = (Math.random() - 0.5) * TERRAIN_SIZE * 0.65;
  var tz = (Math.random() - 0.5) * TERRAIN_SIZE * 0.65;
  var th = getHeight(tx, tz);

  var meteorMat  = new THREE.MeshBasicMaterial({ color:0xFF6622 });
  var meteorMesh = new THREE.Mesh(new THREE.SphereGeometry(1.8, 8, 6), meteorMat);
  meteorMesh.position.set(tx + 40, 185, tz - 40);
  scene.add(meteorMesh);

  activeMeteors.push({ mesh:meteorMesh, tx:tx, th:th, tz:tz, startTime:Date.now(), hit:false });
  addEvent("☄️ Une météorite fonce vers le monde!");
}

function updateMeteors(dt) {
  for (var mi = activeMeteors.length - 1; mi >= 0; mi--) {
    var m = activeMeteors[mi];
    if (m.hit) { activeMeteors.splice(mi, 1); continue; }
    var elapsed = (Date.now() - m.startTime) / 1000;
    m.mesh.position.set(
      m.tx + 40 - elapsed * 40,
      185 - elapsed * 165,
      m.tz - 40 + elapsed * 40
    );
    if (m.mesh.position.y <= m.th + 1) {
      scene.remove(m.mesh);
      m.hit = true;
      var impact = new THREE.Vector3(m.tx, m.th, m.tz);
      var allC   = humans.concat(deerPop).concat(wolves);
      var killed = 0;
      for (var ci = 0; ci < allC.length; ci++) {
        if (allC[ci].userData.alive && allC[ci].position.distanceTo(impact) < 20) {
          if (markCreatureDead(allC[ci], 'meteor')) killed++;
        }
      }
      var cl = new THREE.PointLight(0xFF4400, 4.0, 38);
      cl.position.set(m.tx, m.th + 1, m.tz);
      scene.add(cl);
      craterLights.push({ light:cl, timer:10, maxTimer:10, maxIntensity:4.0 });
      flashScreen('rgba(255,100,0,0.55)', 0.6);
      addEvent("☄️ Impact! " + killed + " créature(s) anéantie(s).");
    }
  }
  for (var cli = craterLights.length - 1; cli >= 0; cli--) {
    var cr = craterLights[cli];
    cr.timer -= dt;
    cr.light.intensity = Math.max(0, (cr.timer / cr.maxTimer) * cr.maxIntensity);
    if (cr.timer <= 0) { scene.remove(cr.light); craterLights.splice(cli, 1); }
  }
}

// ── GRAPHE POPULATION ────────────────────────────────────────
function updatePopHistory(dt) {
  popTimer += dt;
  if (popTimer < 4) return;
  popTimer = 0;
  if (popHistory.humans.length >= 50) {
    popHistory.humans.shift(); popHistory.deer.shift(); popHistory.wolves.shift();
  }
  popHistory.humans.push(humans.length);
  popHistory.deer.push(deerPop.length);
  popHistory.wolves.push(wolves.length);
  drawPopGraph();
}

function drawPopGraph() {
  var c = document.getElementById('pop-graph');
  if (!c) return;
  var ctx = c.getContext('2d');
  var w = c.width, h = c.height;
  ctx.clearRect(0, 0, w, h);
  var maxVal = Math.max(MAX_HUMANS, MAX_DEER, 1);

  function drawLine(data, color) {
    if (data.length < 2) return;
    ctx.strokeStyle = color; ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (var i = 0; i < data.length; i++) {
      var x = (i / Math.max(data.length - 1, 1)) * w;
      var y = h - (data[i] / maxVal) * h * 0.88 - 2;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  drawLine(popHistory.deer,   '#88BB44');
  drawLine(popHistory.humans, '#DDBB66');
  drawLine(popHistory.wolves, '#DD4444');
}

function updateSeasonSystem(dt) {
  seasonTimer += dt * evolutionSpeed;
  if (seasonTimer >= SEASON_DURATION) {
    seasonTimer = 0;
    seasonIndex = (seasonIndex + 1) % SEASONS.length;
    addEvent(SEASONS[seasonIndex].icon + " " + SEASONS[seasonIndex].name + " transforme les terres.");
  }
  var seasonInfo = getSeasonInfo();
  var seasonEl = document.getElementById('season-display');
  if (seasonEl) seasonEl.textContent = seasonInfo.icon + " " + seasonInfo.name;
}

function getSeasonFoodGain(ud) {
  var seasonInfo = getSeasonInfo();
  var base = seasonInfo.food;
  if (ud.type === 'deer' && seasonIndex === 0) base += 0.08;
  if (ud.type === 'wolf' && seasonIndex === 3) base -= 0.08;
  return base;
}

function applySeasonalPressure(ud, biome, dt) {
  var seasonInfo = getSeasonInfo();
  if (seasonIndex === 3) {
    if (biome === 'alpine' || biome === 'highland') {
      ud.energy -= dt * 0.008 * (1 - (ud.dna.cold || 0) * 0.8);
      ud.hunger -= dt * 0.0045;
    }
  } else if (seasonIndex === 1) {
    if (biome === 'plains' || biome === 'shore') {
      ud.thirst -= dt * 0.003 * (1 - (ud.dna.heat || 0) * 0.7);
    }
  } else if (seasonIndex === 2) {
    ud.hunger -= dt * 0.0014 * (1 - seasonInfo.food * 0.4);
  }
}

function maybeSeasonalMigration(creature, dt) {
  var ud = creature.userData;
  if (ud.state === STATE.FLEE || ud.state === STATE.HUNT || ud.state === STATE.SEEK_WATER) return;
  if (seasonIndex === 3 && (ud.type === 'deer' || ud.type === 'human') && (ud.biome === 'alpine' || ud.biome === 'highland')) {
    moveTo(creature, new THREE.Vector3(0, 0, 0), dt, (0.65 + ud.dna.speed * 0.35) * evolutionSpeed);
  }
  if (seasonIndex === 2 && ud.type === 'deer' && Math.abs(creature.position.x) > TERRAIN_SIZE * 0.2) {
    moveTo(creature, new THREE.Vector3(0, 0, 0), dt, (0.45 + ud.dna.speed * 0.3) * evolutionSpeed);
  }
}

function infectCreature(creature, sourceCreature, sourceLabel) {
  if (!creature || !creature.userData || !creature.userData.alive || !creature.userData.dna) return false;
  var ud = creature.userData;
  if (ud.disease && ud.disease.active) return false;
  var resistance = (ud.dna.immunity || 0) + (ud.diseaseImmunity || 0);
  var infectionChance = 0.78 - resistance * 0.55;
  if (Math.random() > infectionChance) {
    ud.dna.immunity = Math.min(1, (ud.dna.immunity || 0) + 0.01);
    return false;
  }
  ud.disease = {
    active: true,
    severity: 0.22 + Math.random() * 0.22,
    progress: 0,
    source: sourceLabel || (sourceCreature && sourceCreature.userData ? sourceCreature.userData.type : 'unknown')
  };
  recordStat('diseaseCases', 1, eraIndex);
  updateCreatureAppearance(creature);
  return true;
}

function updateDiseases(dt) {
  var allCreatures = humans.concat(deerPop).concat(wolves);
  diseaseTimer -= dt * evolutionSpeed;
  if (diseaseTimer <= 0) {
    diseaseTimer = 22 + Math.random() * 30;
    if (allCreatures.length) {
      var patientZero = allCreatures[Math.floor(Math.random() * allCreatures.length)];
      if (infectCreature(patientZero, null, 'outbreak')) {
        addEvent("🦠 Une maladie contagieuse se répand depuis " + patientZero.userData.type + " #" + patientZero.userData.id + ".");
      }
    }
  }

  for (var i = 0; i < allCreatures.length; i++) {
    var creature = allCreatures[i];
    var ud = creature.userData;
    if (!ud.alive || !ud.disease || !ud.disease.active) continue;

    ud.disease.progress += dt * evolutionSpeed;
    ud.disease.severity = Math.min(1, ud.disease.severity + dt * 0.008 * getSeasonInfo().sickness - (ud.dna.immunity || 0) * dt * 0.0045);
    ud.energy -= ud.disease.severity * dt * 0.012;
    ud.hunger -= ud.disease.severity * dt * 0.0045;

    for (var j = 0; j < allCreatures.length; j++) {
      if (i === j) continue;
      var other = allCreatures[j];
      if (!other.userData.alive || other.userData.type !== ud.type) continue;
      if (creature.position.distanceTo(other.position) < DISEASE_SPREAD_RADIUS && Math.random() < dt * 0.18 * ud.disease.severity) {
        infectCreature(other, creature, ud.type);
      }
    }

    if (ud.disease.progress > 26 && Math.random() < dt * (0.008 + ud.disease.severity * 0.02)) {
      if (markCreatureDead(creature, 'disease')) {
        addEvent("☠️ " + ud.type + " #" + ud.id + " succombe à la maladie.");
      }
      continue;
    }

    if (ud.disease.progress > 32 || ud.disease.severity < 0.12) {
      ud.disease = null;
      ud.diseaseImmunity = Math.min(0.55, (ud.diseaseImmunity || 0) + 0.12);
      ud.dna.immunity = Math.min(1, (ud.dna.immunity || 0) + 0.03);
      updateCreatureAppearance(creature);
    }
  }
}

function buildTerritoryList(type, population, maxTerritories) {
  var alive = population.filter(function(c){ return c.userData.alive; });
  if (alive.length === 0) return [];
  var count = Math.min(maxTerritories, Math.max(1, Math.ceil(alive.length / 8)));
  var territoriesForType = [];
  for (var i = 0; i < count; i++) {
    var sample = alive[Math.floor((i / count) * alive.length)];
    territoriesForType.push({
      id: type + '-' + i,
      type: type,
      label: (type === 'human' ? 'Clan' : 'Meute') + ' ' + (i + 1),
      color: type === 'human' ? '#DDBB66' : '#DD6666',
      x: sample.position.x,
      z: sample.position.z,
      members: [],
      radius: 18
    });
  }
  for (var ai = 0; ai < alive.length; ai++) {
    var creature = alive[ai];
    var best = null, bestDist = 999999;
    for (var ti = 0; ti < territoriesForType.length; ti++) {
      var terr = territoriesForType[ti];
      var dx = creature.position.x - terr.x;
      var dz = creature.position.z - terr.z;
      var dist = dx*dx + dz*dz;
      if (dist < bestDist) { bestDist = dist; best = terr; }
    }
    if (best) best.members.push(creature);
  }
  for (var bi = 0; bi < territoriesForType.length; bi++) {
    var terr2 = territoriesForType[bi];
    if (!terr2.members.length) continue;
    var sx = 0, sz = 0;
    for (var mi = 0; mi < terr2.members.length; mi++) {
      sx += terr2.members[mi].position.x;
      sz += terr2.members[mi].position.z;
      terr2.members[mi].userData.territoryId = terr2.id;
      terr2.members[mi].userData.territoryLabel = terr2.label;
    }
    terr2.x = sx / terr2.members.length;
    terr2.z = sz / terr2.members.length;
    terr2.radius = 14 + terr2.members.length * 2.5;
  }
  return territoriesForType;
}

function resolveTerritoryConflicts() {
  var humanTerrs = territories.human || [];
  var wolfTerrs = territories.wolf || [];
  for (var hi = 0; hi < humanTerrs.length; hi++) {
    for (var wi = 0; wi < wolfTerrs.length; wi++) {
      var humanTerr = humanTerrs[hi];
      var wolfTerr = wolfTerrs[wi];
      var dx = humanTerr.x - wolfTerr.x;
      var dz = humanTerr.z - wolfTerr.z;
      var dist = Math.sqrt(dx*dx + dz*dz);
      if (dist > (humanTerr.radius + wolfTerr.radius) * 0.7) continue;
      if (!humanTerr.members.length || !wolfTerr.members.length) continue;
      if (Math.random() < 0.45) {
        var humanVictim = humanTerr.members[Math.floor(Math.random() * humanTerr.members.length)];
        var wolfVictim = wolfTerr.members[Math.floor(Math.random() * wolfTerr.members.length)];
        var humanPower = humanTerr.members.length + (humanVictim ? humanVictim.userData.dna.strength * 2 : 0);
        var wolfPower = wolfTerr.members.length + (wolfVictim ? wolfVictim.userData.dna.strength * 2.4 : 0);
        if (humanPower >= wolfPower && wolfVictim) {
          markCreatureDead(wolfVictim, 'war', humanVictim || null);
        } else if (humanVictim) {
          markCreatureDead(humanVictim, 'war', wolfVictim || null);
        }
        addEvent("⚔️ " + humanTerr.label + " affronte " + wolfTerr.label + " aux frontières.");
      }
    }
  }
}

function updateTerritories(dt) {
  territoryTimer += dt * evolutionSpeed;
  territoryConflictTimer -= dt * evolutionSpeed;
  if (territoryTimer >= TERRITORY_REFRESH_RATE) {
    territoryTimer = 0;
    territories.human = buildTerritoryList('human', humans, 3);
    territories.wolf = buildTerritoryList('wolf', wolves, 2);
  }
  if (territoryConflictTimer <= 0) {
    territoryConflictTimer = TERRITORY_CONFLICT_RATE;
    resolveTerritoryConflicts();
  }
}

function drawMinimap() {
  var canvas = document.getElementById('minimap');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#08101a';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(201,168,76,0.25)';
  ctx.strokeRect(2, 2, w-4, h-4);

  function project(x, z) {
    return {
      x: ((x / (TERRAIN_SIZE * 0.5)) * 0.5 + 0.5) * w,
      y: ((z / (TERRAIN_SIZE * 0.5)) * 0.5 + 0.5) * h
    };
  }

  function drawTerritory(terr, fill) {
    var p = project(terr.x, terr.z);
    ctx.beginPath();
    ctx.fillStyle = fill;
    ctx.arc(p.x, p.y, Math.max(8, terr.radius / (TERRAIN_SIZE * 0.5) * w), 0, Math.PI * 2);
    ctx.fill();
  }

  for (var i = 0; i < territories.human.length; i++) drawTerritory(territories.human[i], 'rgba(221,187,102,0.12)');
  for (var j = 0; j < territories.wolf.length; j++) drawTerritory(territories.wolf[j], 'rgba(221,90,90,0.12)');

  function drawDots(list, color, size) {
    ctx.fillStyle = color;
    for (var di = 0; di < list.length; di++) {
      if (!list[di].userData.alive) continue;
      var p = project(list[di].position.x, list[di].position.z);
      ctx.beginPath();
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawDots(deerPop, '#88BB44', 2);
  drawDots(humans, '#E5C56D', 2.4);
  drawDots(wolves, '#DD6666', 2.6);

  if (selectedCreature && selectedCreature.userData && selectedCreature.userData.alive) {
    var sp = project(selectedCreature.position.x, selectedCreature.position.z);
    ctx.strokeStyle = '#FFEE88';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, 5, 0, Math.PI * 2);
    ctx.stroke();
  }

  var cam = project(camTarget.x, camTarget.z);
  ctx.strokeStyle = '#9AD8FF';
  ctx.beginPath();
  ctx.arc(cam.x, cam.y, 6, 0, Math.PI * 2);
  ctx.stroke();
}

function updateDetailedStatsPanel() {
  var stats = ensureEraStats(eraIndex);
  var seasonInfo = getSeasonInfo();
  var values = {
    'detail-season': seasonInfo.icon + " " + seasonInfo.name,
    'detail-births': stats.births,
    'detail-deaths': stats.deaths,
    'detail-wars': stats.wars,
    'detail-conversions': stats.conversions,
    'detail-disease': stats.diseaseCases
  };
  Object.keys(values).forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.textContent = values[id];
  });
}

// ── RELIGION : ANGE ───────────────────────────────────────────
function makeAngel() {
  var g = new THREE.Group();
  var wMat = new THREE.MeshLambertMaterial({ color:0xF8F2E0, transparent:true, opacity:0.94 });
  var gMat = new THREE.MeshBasicMaterial  ({ color:0xFFEE88, transparent:true, opacity:0.72 });

  var body = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.30, 1.0, 8), wMat);
  body.position.y = 0.5; body.castShadow = true; g.add(body);

  var head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 8), wMat);
  head.position.y = 1.28; g.add(head);

  var halo = new THREE.Mesh(new THREE.TorusGeometry(0.30, 0.045, 8, 24), gMat);
  halo.position.y = 1.72; halo.userData.isHalo = true; g.add(halo);

  for (var wi = -1; wi <= 1; wi += 2) {
    var wing = new THREE.Mesh(new THREE.ConeGeometry(0.14, 1.1, 5), wMat);
    wing.position.set(wi * 0.56, 0.85, 0);
    wing.rotation.z = wi * 1.05;
    wing.userData.isWing = true; wing.userData.wingDir = wi;
    g.add(wing);
  }

  var glow = new THREE.PointLight(0xFFEE88, 1.4, 20);
  glow.position.y = 1.3; g.add(glow);
  return g;
}

function spawnAngel() {
  if (angels.length >= MAX_ANGELS) {
    addEvent("✨ Les cieux ne peuvent envoyer plus d'anges pour le moment.");
    return;
  }
  var tx = camTarget.x + (Math.random()-0.5)*15;
  var tz = camTarget.z + (Math.random()-0.5)*15;
  var angel = makeAngel();
  var baseH = Math.max(0.5, getHeight(tx, tz));
  angel.position.set(tx, baseH + 14, tz);
  angel.userData = {
    type:'angel',
    altitude: baseH + 12 + Math.random()*6,
    dir: new THREE.Vector2(Math.random()-0.5, Math.random()-0.5).normalize(),
    dirTimer: 3 + Math.random()*5,
    influenceTimer: 0,
    lifetime: 50,
    alive: true,
  };
  scene.add(angel); angels.push(angel);
  addEvent("👼 Un ange descend des cieux pour guider les âmes !");
}

// ── RELIGION : PROPHÈTE ────────────────────────────────────────
function spawnProphet() {
  // Cherche une position proche du point de vue caméra
  var tx = camTarget.x + (Math.random()-0.5)*18;
  var tz = camTarget.z + (Math.random()-0.5)*18;
  var ty = Math.max(0.5, getHeight(tx, tz));

  var dna = randomDNA();
  dna.strength = 0.65; dna.stamina = 0.8;
  var p = makeHuman(dna, 3);
  p.position.set(tx, ty, tz);
  p.rotation.y = Math.random() * Math.PI * 2;

  // Apparence divine
  p.userData.isProphet = true;
  p.userData.faith     = 1.0;
  p.userData.bodyMat.color.setHex(0xEEDD88);
  p.userData.skinMat.color.setHex(0xFFF0CC);

  // Auréole
  var haloMat = new THREE.MeshBasicMaterial({ color:0xFFEE44, transparent:true, opacity:0.75 });
  var haloMesh = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.05, 8, 24), haloMat);
  haloMesh.position.y = 2.45;
  haloMesh.userData.isHalo = true;
  p.add(haloMesh);

  var propLight = new THREE.PointLight(0xFFEE88, 1.0, 14);
  propLight.position.y = 2.2; p.add(propLight);
  p.userData.prophetLight = propLight;

  scene.add(p); humans.push(p); prophets.push(p);
  addEvent("✝️ Un prophète divin apparaît parmi les humains !");
}

// ── RELIGION : DÉMON ──────────────────────────────────────────
function makeDemon() {
  var g = new THREE.Group();
  var dMat  = new THREE.MeshLambertMaterial({ color:0x220011 });
  var eyMat = new THREE.MeshLambertMaterial({ color:0xFF1100 });

  var body = new THREE.Mesh(new THREE.SphereGeometry(0.36, 8, 7), dMat);
  body.castShadow = true; g.add(body);

  for (var hi = -1; hi <= 1; hi += 2) {
    var horn = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.36, 5), dMat);
    horn.position.set(hi * 0.22, 0.42, 0); horn.rotation.z = hi * 0.28; g.add(horn);
  }
  for (var ei = -1; ei <= 1; ei += 2) {
    var eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), eyMat);
    eye.position.set(ei * 0.14, 0.08, 0.28); g.add(eye);
  }
  for (var wi = -1; wi <= 1; wi += 2) {
    var wing = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.88, 4), dMat);
    wing.position.set(wi * 0.44, 0.05, 0); wing.rotation.z = wi * 1.0; g.add(wing);
  }

  var hellLight = new THREE.PointLight(0xFF1100, 1.1, 14);
  g.add(hellLight);

  var dna = randomDNA();
  dna.speed = 0.55 + Math.random()*0.3;
  dna.strength = 0.55 + Math.random()*0.3;
  var ud = {
    type:'demon', gen:1, dna:dna,
    hunger:0.9, thirst:0.9, energy:1.0,
    state:STATE.WANDER,
    biome:'plains',
    dir: new THREE.Vector2(Math.random()-0.5, Math.random()-0.5).normalize(),
    dirTimer: Math.random()*3,
    animOff: Math.random()*Math.PI*2,
    stateTimer:0, target:null,
    age:0, alive:true,
  };
  g.userData = ud;
  registerCreatureMetadata(g);
  g.traverse(function(c){ if(c.isMesh){ c.userData.creatureRef=g; allSelectableMeshes.push(c); }});
  return g;
}

// ── UPDATE RELIGION ────────────────────────────────────────────
function updateAngels(dt) {
  var t = Date.now() * 0.001;
  for (var ai = angels.length - 1; ai >= 0; ai--) {
    var angel = angels[ai];
    var ud = angel.userData;
    ud.lifetime -= dt;
    if (ud.lifetime <= 0) { scene.remove(angel); angels.splice(ai, 1); addEvent("✨ L'ange retourne aux cieux."); continue; }

    ud.dirTimer -= dt;
    if (ud.dirTimer <= 0) {
      ud.dir.set(Math.random()-0.5, Math.random()-0.5).normalize();
      ud.dirTimer = 3 + Math.random()*5;
    }
    angel.position.x += ud.dir.x * 7 * dt;
    angel.position.z += ud.dir.y * 7 * dt;
    angel.position.y  = ud.altitude + Math.sin(t * 0.5) * 2;
    var half = TERRAIN_SIZE * 0.42;
    if (Math.abs(angel.position.x) > half) ud.dir.x *= -1;
    if (Math.abs(angel.position.z) > half) ud.dir.y *= -1;
    angel.rotation.y += dt * 0.35;
    angel.traverse(function(c) {
      if (c.userData.isHalo) c.rotation.y += dt;
      if (c.userData.isWing) c.rotation.z = c.userData.wingDir * (1.05 + Math.sin(t*2)*0.28);
    });

    // Convertir les humains proches
    ud.influenceTimer -= dt;
    if (ud.influenceTimer <= 0) {
      ud.influenceTimer = 1.2;
      for (var hi = 0; hi < humans.length; hi++) {
        var h = humans[hi];
        if (!h.userData.alive || h.userData.isRebel) continue;
        if (angel.position.distanceTo(h.position) < 28) {
          var prevFaith = h.userData.faith || 0;
          h.userData.faith = Math.min(1, prevFaith + 0.1);
          if (prevFaith <= 0.5 && h.userData.faith > 0.5) recordStat('conversions', 1, eraIndex);
          if (h.userData.faith > 0.5) h.userData.bodyMat.color.lerp(new THREE.Color(0xEEDD88), 0.04);
        }
      }
    }
  }
}

function updateDemons(dt) {
  for (var di = demons.length - 1; di >= 0; di--) {
    var d = demons[di];
    var ud = d.userData;
    ud.age = (ud.age || 0) + dt;
    if (ud.age > 180) { scene.remove(d); demons.splice(di, 1); continue; }

    // IA : chasser humains fidèles et prophètes
    ud.dirTimer -= dt;
    if (ud.dirTimer <= 0) {
      ud.dirTimer = 2 + Math.random()*3;
      var nearest = null, nearDist = 65;
      for (var hi = 0; hi < humans.length; hi++) {
        var h = humans[hi];
        if (!h.userData.alive || h.userData.isRebel) continue;
        var dist = d.position.distanceTo(h.position);
        if (dist < nearDist) { nearest = h; nearDist = dist; }
      }
      ud.target = nearest;
    }

    if (ud.target && ud.target.userData.alive) {
      moveTo(d, ud.target.position, dt, (2.4 + ud.dna.speed) * evolutionSpeed);
      if (d.position.distanceTo(ud.target.position) < 3.5) {
        if (Math.random() < 0.45 + ud.dna.strength * 0.3) {
          markCreatureDead(ud.target, 'war', d);
          addEvent("👹 Un démon anéantit un fidèle !");
        }
        ud.target = null;
      }
    } else {
      wander(d, dt, (1.4 + ud.dna.speed) * evolutionSpeed);
    }

    var gh = getHeight(d.position.x, d.position.z);
    d.position.y = gh + 0.4 + Math.abs(Math.sin(Date.now()*0.003 + ud.animOff)) * 0.28;
    d.rotation.y += dt * 1.2 * ud.dna.speed;
  }
}

function updateReligion(dt) {
  // Prophètes : diffusent la foi
  var t = Date.now() * 0.001;
  for (var pi = prophets.length - 1; pi >= 0; pi--) {
    var prop = prophets[pi];
    if (!prop.userData.alive) { prophets.splice(pi, 1); continue; }
    prop.traverse(function(c) { if (c.userData.isHalo) c.rotation.y += dt * 1.0; });
    for (var hi = 0; hi < humans.length; hi++) {
      var h = humans[hi];
      if (h === prop || !h.userData.alive || h.userData.isRebel) continue;
      if (prop.position.distanceTo(h.position) < 22) {
        var prevFaith = h.userData.faith || 0;
        h.userData.faith = Math.min(1, prevFaith + 0.006 * dt);
        if (prevFaith <= 0.5 && h.userData.faith > 0.5) recordStat('conversions', 1, eraIndex);
        if (h.userData.faith > 0.5) h.userData.bodyMat.color.lerp(new THREE.Color(0xEEDD88), 0.001);
      }
    }
  }

  // Rebelles (libre arbitre, max 5)
  if (rebelCount < MAX_REBELS) {
    for (var hi = 0; hi < humans.length; hi++) {
      if (rebelCount >= MAX_REBELS) break;
      var h = humans[hi];
      if (!h.userData.alive || h.userData.isProphet || h.userData.isRebel) continue;
      var faith = h.userData.faith || 0;
      // La foi élevée augmente la pression → plus de chance de rébellion
      if (faith > 0.55 && Math.random() < 0.00008 * dt * evolutionSpeed) {
        h.userData.isRebel    = true;
        h.userData.faith      = 0;
        h.userData.rebelTimer = 28 + Math.random()*18;
        rebelCount++;
        h.userData.bodyMat.color.setHex(0x440011);
        h.userData.skinMat.color.setHex(0x662222);
        var darkLight = new THREE.PointLight(0xAA0000, 0.7, 9);
        h.add(darkLight);
        rebels.push(h);
        addEvent("😈 Libre arbitre ! Un humain se rebelle contre ta volonté !");
      }
    }
  }

  // Rebelles invoquent des démons
  for (var ri = rebels.length - 1; ri >= 0; ri--) {
    var rebel = rebels[ri];
    if (!rebel.userData.alive) {
      rebelCount = Math.max(0, rebelCount - 1);
      rebels.splice(ri, 1);
      continue;
    }
    rebel.userData.rebelTimer -= dt * evolutionSpeed;
    if (rebel.userData.rebelTimer <= 0 && demons.length < MAX_DEMONS) {
      rebel.userData.rebelTimer = 22 + Math.random()*14;
      var rx = rebel.position.x + (Math.random()-0.5)*12;
      var rz = rebel.position.z + (Math.random()-0.5)*12;
      var dem = makeDemon();
      dem.position.set(rx, Math.max(0.3, getHeight(rx, rz)) + 0.5, rz);
      scene.add(dem); demons.push(dem);
      addEvent("👹 Un rebelle invoque un démon depuis les ténèbres !");
    }
  }
}


// ── FACTIONS ──────────────────────────────────────────────
var factionWar=false,factionWarTimer=0,factionWarCooldown=60;
var TECH_BONUSES=[
  {name:'Outils primitifs',    speedMult:1.0,strBonus:0   },
  {name:'Outils taillés',      speedMult:1.1,strBonus:0.05},
  {name:'Armes médiévales',    speedMult:1.2,strBonus:0.12},
  {name:'Industrie',           speedMult:1.3,strBonus:0.18},
  {name:'Technologie moderne', speedMult:1.4,strBonus:0.22},
  {name:'Futur',               speedMult:1.6,strBonus:0.28},
];
function assignFaction(h) { h.userData.faction = h.position.x<0?'A':'B'; }
function updateFactions(dt) {
  if (humans.length<8||eraIndex<1) return;
  factionWarCooldown-=dt*evolutionSpeed; factionWarTimer-=dt*evolutionSpeed;
  if (!factionWar&&factionWarCooldown<=0) {
    var ac=0,bc=0;
    for (var fi=0;fi<humans.length;fi++) { if(!humans[fi].userData.alive)continue; humans[fi].userData.faction==='A'?ac++:bc++; }
    if (ac>=3&&bc>=3&&Math.random()<0.0010*dt*evolutionSpeed) {
      factionWar=true;factionWarTimer=40+Math.random()*20;factionWarCooldown=120;
      addEvent("⚔️ Guerre tribale ! Les deux clans s'affrontent pour le territoire !");
    }
  }
  if (factionWar&&factionWarTimer>0) {
    if (Math.random()<0.08*dt*evolutionSpeed&&humans.length>0) {
      var att=humans[Math.floor(Math.random()*humans.length)];
      if (att&&att.userData.alive) for (var fj=0;fj<humans.length;fj++) {
        var def=humans[fj];
        if (!def.userData.alive||def.userData.faction===att.userData.faction) continue;
        if (att.position.distanceTo(def.position)<10) {
          var tb=TECH_BONUSES[eraIndex]||TECH_BONUSES[0];
          ((att.userData.dna.strength||0.5)+tb.strBonus>=(def.userData.dna.strength||0.5)+tb.strBonus*0.9?def:att).userData.alive=false; break;
        }
      }
    }
  } else if (factionWar&&factionWarTimer<=0) {
    factionWar=false; addEvent("🕊️ La guerre tribale se termine. Les survivants reconstruisent.");
  }
}

// ── AUTELS RELIGIEUX ──────────────────────────────────────────────
var altars=[],MAX_ALTARS=5;
function makeAltar(x,z,h) {
  var ag=new THREE.Group(),sm=new THREE.MeshLambertMaterial({color:0x998877});
  var pl=new THREE.Mesh(new THREE.CylinderGeometry(0.55,0.70,2.8,8),sm); pl.position.y=1.4;pl.castShadow=true;ag.add(pl);
  var tp=new THREE.Mesh(new THREE.BoxGeometry(1.4,0.25,1.4),sm); tp.position.y=2.9;ag.add(tp);
  var orb=new THREE.Mesh(new THREE.SphereGeometry(0.40,10,8),new THREE.MeshBasicMaterial({color:0xFFDD44}));
  orb.position.y=3.55;orb.userData.isOrbAltar=true;ag.add(orb);
  var aL=new THREE.PointLight(0xFFBB33,1.4,22);aL.position.y=3.8;ag.add(aL);
  ag.position.set(x,h,z);ag.userData.isAltar=true;ag.userData.faithRadius=20;
  scene.add(ag);altars.push(ag);return ag;
}
function updateAltars(dt) {
  var at=Date.now()*0.001;
  for (var ai=0;ai<altars.length;ai++) {
    var altar=altars[ai],altIdx=ai;
    altar.traverse(function(c){if(c.userData.isOrbAltar)c.position.y=3.55+Math.sin(at*1.8+altIdx)*0.12;});
    for (var ahi=0;ahi<humans.length;ahi++) {
      var ahh=humans[ahi];if(!ahh.userData.alive||ahh.userData.isRebel)continue;
      if (altar.position.distanceTo(ahh.position)<altar.userData.faithRadius)
        ahh.userData.faith=Math.min(1,(ahh.userData.faith||0)+0.002*dt);
    }
  }
  if (altars.length<MAX_ALTARS&&Math.random()<0.004*dt*evolutionSpeed) {
    for (var abi=0;abi<humans.length;abi++) {
      var ahb=humans[abi];if(!ahb.userData.alive||(ahb.userData.faith||0)<0.85||ahb.userData.isRebel)continue;
      var apos=findGround(0.4,14);if(!apos)break;
      var tooClose=false;
      for (var ai2=0;ai2<altars.length;ai2++) if(altars[ai2].position.distanceTo(new THREE.Vector3(apos.x,0,apos.z))<22){tooClose=true;break;}
      if (!tooClose){makeAltar(apos.x,apos.z,apos.y);addEvent("🛕 Un croyant érige un autel à la gloire divine !");}
      break;
    }
  }
}

// ── PORTAIL DES ENFERS ──────────────────────────────────────────────
var hellPortal=null,hellPortalOpen=false,hellPortalSpawnTimer=0;
function openHellPortal() {
  if (hellPortal||hellPortalOpen) return;
  var pos=findGround(0.3,12);if(!pos)return;
  var pg=new THREE.Group();
  var outer=new THREE.Mesh(new THREE.TorusGeometry(7,0.9,16,40),new THREE.MeshBasicMaterial({color:0xFF2200}));
  outer.rotation.x=Math.PI*0.12;outer.userData.isPortalRing=true;pg.add(outer);
  var inner=new THREE.Mesh(new THREE.TorusGeometry(4.5,0.55,12,30),new THREE.MeshBasicMaterial({color:0xAA0022}));
  inner.rotation.x=Math.PI*0.12;inner.userData.isPortalInner=true;pg.add(inner);
  var disc=new THREE.Mesh(new THREE.CircleGeometry(6.5,32),new THREE.MeshBasicMaterial({color:0x110005,side:THREE.DoubleSide}));
  disc.rotation.x=Math.PI*0.5-0.12;pg.add(disc);
  var rL=new THREE.PointLight(0xFF1100,3.5,50);rL.position.y=5;pg.add(rL);
  pg.position.set(pos.x,Math.max(0.5,pos.y)+0.2,pos.z);
  scene.add(pg);hellPortal=pg;hellPortalOpen=true;hellPortalSpawnTimer=12;
  addEvent("🌑 Le portail des enfers s'ouvre ! Les ténèbres envahissent le monde !");
  flashScreen('rgba(80,0,0,0.65)',1.5);
}
function closeHellPortal() {
  if (!hellPortal) return;
  scene.remove(hellPortal);hellPortal=null;hellPortalOpen=false;
  for (var dci=demons.length-1;dci>=0;dci--) scene.remove(demons[dci]);
  demons.length=0;
  addEvent("✨ Le portail des enfers est scellé ! La lumière triomphe !");
  flashScreen('rgba(200,200,100,0.4)',1.2);
}
function updateHellPortal(dt) {
  if (!hellPortal||!hellPortalOpen) return;
  hellPortal.traverse(function(c){
    if(c.userData.isPortalRing)c.rotation.z+=dt*1.3;
    if(c.userData.isPortalInner)c.rotation.z-=dt*1.0;
  });
  hellPortalSpawnTimer-=dt*evolutionSpeed;
  if (hellPortalSpawnTimer<=0&&demons.length<MAX_DEMONS+4) {
    hellPortalSpawnTimer=12+Math.random()*8;
    var pdem=makeDemon();pdem.position.copy(hellPortal.position);
    pdem.position.x+=(Math.random()-0.5)*4;pdem.position.z+=(Math.random()-0.5)*4;
    scene.add(pdem);demons.push(pdem);addEvent("👹 Un démon surgit du portail des enfers !");
  }
  for (var phi=0;phi<humans.length;phi++) {
    var phh=humans[phi];if(!phh.userData.alive)continue;
    if(hellPortal.position.distanceTo(phh.position)<4.5&&Math.random()<0.003*dt*evolutionSpeed)phh.userData.alive=false;
  }
}
function checkHellPortalTrigger() {
  if (hellPortalOpen||hellPortal) return;
  if (rebelCount>=MAX_REBELS&&demons.length>=4&&Math.random()<0.0002) openHellPortal();
}

// ── TREMBLEMENT DE TERRE / LAVE ──────────────────────────────────────────────
var camShake=0,lavaZones=[];
function activateEarthquake() {
  camShake=1.4;flashScreen('rgba(80,55,15,0.55)',0.9);
  addEvent("🌋 La terre tremble ! Les fondations du monde vacillent !");
  var allC=humans.concat(deerPop).concat(wolves);
  for (var qi=0;qi<allC.length;qi++) if(Math.random()<0.10)allC[qi].userData.alive=false;
  var eqpos=findGround(0.3,18);if(!eqpos)return;
  var lavaR=7+Math.random()*5;
  var lava=new THREE.Mesh(new THREE.CircleGeometry(lavaR,16),new THREE.MeshBasicMaterial({color:0xFF4400,transparent:true,opacity:0.85}));
  lava.rotation.x=-Math.PI/2;lava.position.set(eqpos.x,eqpos.y+0.35,eqpos.z);
  lava.userData.isLava=true;lava.userData.life=35+Math.random()*20;lava.userData.radius=lavaR;
  scene.add(lava);lavaZones.push(lava);
  var lL=new THREE.PointLight(0xFF3300,3.5,32);lL.position.set(eqpos.x,eqpos.y+4,eqpos.z);
  lL.userData.isLavaLight=true;lL.userData.life=lava.userData.life;scene.add(lL);lavaZones.push(lL);
}
function updateLava(dt) {
  camShake*=0.91;
  for (var lvi=lavaZones.length-1;lvi>=0;lvi--) {
    var lz=lavaZones[lvi];lz.userData.life-=dt;
    if(lz.userData.life<=0){scene.remove(lz);lavaZones.splice(lvi,1);continue;}
    if (lz.userData.isLava) for (var lhi=0;lhi<humans.length;lhi++) {
      var lhh=humans[lhi];if(!lhh.userData.alive)continue;
      var ldx=lhh.position.x-lz.position.x,ldz=lhh.position.z-lz.position.z;
      if(Math.sqrt(ldx*ldx+ldz*ldz)<lz.userData.radius&&Math.random()<0.004*dt*evolutionSpeed)lhh.userData.alive=false;
    }
  }
}

// ── BÉNÉDICTION / MALÉDICTION ──────────────────────────────────────────────
function activateBlessing() {
  if (!selectedCreature||!selectedCreature.userData.alive) {
    addEvent("⚠️ Sélectionne une créature d'abord (clic gauche dessus)."); return;
  }
  var bud=selectedCreature.userData;
  if(bud.hunger!==undefined)bud.hunger=1;if(bud.thirst!==undefined)bud.thirst=1;if(bud.energy!==undefined)bud.energy=1;
  if(bud.dna)Object.keys(bud.dna).forEach(function(k){bud.dna[k]=Math.min(1,bud.dna[k]+0.08);});
  var bLight=new THREE.PointLight(0xFFDD44,2.5,18),blessed=selectedCreature;
  blessed.add(bLight);setTimeout(function(){if(blessed)blessed.remove(bLight);},9000);
  if(bud.bodyMat)bud.bodyMat.color.lerp(new THREE.Color(0xFFDD88),0.45);
  addEvent("✨ Ta bénédiction divine touche la créature — elle est purifiée !");
}
function activateCurse() {
  if (!selectedCreature||!selectedCreature.userData.alive) {
    addEvent("⚠️ Sélectionne une créature d'abord (clic gauche dessus)."); return;
  }
  var cud=selectedCreature.userData;
  cud.isCursed=true;cud.curseTimer=28+Math.random()*18;
  if(cud.bodyMat)cud.bodyMat.color.setHex(0x330044);
  var cLight=new THREE.PointLight(0x8800AA,2.2,13);
  selectedCreature.add(cLight);cud.curseLight=cLight;
  addEvent("💜 Ta malédiction transforme la créature en monstre assoiïfé de sang !");
}
function updateCursedCreatures(dt) {
  var allT=deerPop.concat(wolves).concat(humans);
  for (var cci=humans.length-1;cci>=0;cci--) {
    var ch=humans[cci];if(!ch.userData.isCursed||!ch.userData.alive)continue;
    ch.userData.curseTimer-=dt*evolutionSpeed;
    var cN=null,cND=999;
    for (var ccj=0;ccj<allT.length;ccj++) {
      if(allT[ccj]===ch||!allT[ccj].userData.alive)continue;
      var ccd=ch.position.distanceTo(allT[ccj].position);if(ccd<cND){cND=ccd;cN=allT[ccj];}
    }
    if(cN)moveTo(ch,cN.position,dt,6.5*evolutionSpeed);
    if(cN&&cND<5)cN.userData.alive=false;
    if(ch.userData.curseTimer<=0) {
      ch.userData.isCursed=false;
      if(ch.userData.curseLight){ch.remove(ch.userData.curseLight);delete ch.userData.curseLight;}
      if(ch.userData.bodyMat)ch.userData.bodyMat.color.setHex(ERAS[eraIndex].clothColor);
      addEvent("🌅 La malédiction se dissipe. La créature retrouve son calme.");
    }
  }
}
// ── ÉVOLUTION ────────────────────────────────────────────────
function updateEvolution(dt) {
  eraTimer  += dt * evolutionSpeed;
  worldYear += dt * evolutionSpeed * 4;
  ensureEraStats(eraIndex);

  // Naissances aléatoires faibles (écosystème)
  if (Math.random() < dt*evolutionSpeed*0.15) spawnDeer();
  if (wolves.length < 3 && Math.random() < dt*evolutionSpeed*0.06) spawnWolf();
  if (birds.length < MAX_BIRDS && Math.random() < dt*evolutionSpeed*0.1) spawnBird();

  if (eraTimer >= ERA_DURATION && eraIndex < ERAS.length-1) {
    eraTimer=0; eraIndex++;
    onEraChange();
  }

  var fill=document.getElementById('era-progress-fill');
  if (fill) fill.style.width=Math.min(100,(eraTimer/ERA_DURATION)*100)+'%';

  var allGen = humans.concat(deerPop).concat(wolves);
  var avgGen = allGen.length ? allGen.reduce(function(s,c){ return s+(c.userData.gen||1); },0)/allGen.length : 1;

  document.getElementById('human-count').textContent = humans.length;
  document.getElementById('deer-count').textContent  = deerPop.length;
  document.getElementById('wolf-count').textContent  = wolves.length;
  document.getElementById('era-name').textContent    = ERAS[eraIndex].name;
  document.getElementById('era-icon').textContent    = ERAS[eraIndex].icon;
  document.getElementById('era-year').textContent    = 'An ' + Math.floor(worldYear).toLocaleString();
  document.getElementById('gen-avg').textContent     = avgGen.toFixed(1);

  adaptationLogCooldown -= dt * evolutionSpeed;
  updateDetailedStatsPanel();
}

function onEraChange() {
  addEvent("✨ " + ERAS[eraIndex].name + " — nouvelle ère!");
  flashScreen('rgba(201,168,76,0.3)', 1.8);

  // Construire structures
  var style = ERAS[eraIndex].buildStyle;
  var count = style==='camp'?5 : style==='stone'?8 : style==='factory'?6 : style==='city'?12 : style==='future'?9 : 0;
  for (var i=0;i<count;i++) {
    var pos=findGround(0.2,12);
    if (pos) buildStructure(pos.x, pos.z, pos.y, style);
  }

  // Mettre à jour couleurs humains existants
  for (var hi=0;hi<humans.length;hi++) {
    updateCreatureAppearance(humans[hi]);
  }
}

// ── ÉVÉNEMENTS ALÉATOIRES ────────────────────────────────────
var RANDOM_EVENTS = [
  function(){ addEvent("🌿 La végétation s'épanouit après les pluies."); },
  function(){ addEvent("🔥 Un incendie éclate à l'est."); },
  function(){ addEvent("🌟 Une comète illumine le ciel."); },
  function(){ addEvent("🏔️ Un séisme ébranle les montagnes."); },
  function(){ addEvent("🦅 Un aigle royal plane majestueusement."); },
  function(){ addEvent("💧 Une source jaillit dans la vallée."); },
  function(){ addEvent("⚔️ Deux clans s'affrontent pour les ressources."); },
  function(){ if(adaptationLogCooldown<=0) addEvent("🧬 Les créatures des montagnes développent une fourrure."); },
  function(){ addEvent("🌙 Eclipse — l'obscurité envahit le monde."); },
  function(){ addEvent("👁️ Les créatures semblent conscientes de ta présence..."); },
  function(){ addEvent("🐺 Une meute de loups rôde dans les hauteurs."); },
  function(){ if(wolves.length>0&&deerPop.length>0) addEvent("🦌 Les cerfs fuient en troupeau devant les loups!"); },
  function(){ addEvent("🌊 Des pluies torrentielles inondent les vallées."); },
  function(){ addEvent("🍂 La saison change — le monde se recolore."); },
];

function updateRandomEvents(dt) {
  randomEventTimer -= dt * evolutionSpeed;
  if (randomEventTimer <= 0) {
    randomEventTimer = 16+Math.random()*30;
    RANDOM_EVENTS[Math.floor(Math.random()*RANDOM_EVENTS.length)]();
  }
}

// ── STRUCTURES ───────────────────────────────────────────────
function buildStructure(x,z,h,style) {
  var g = new THREE.Group();
  if (style==='camp') {
    var logMat=new THREE.MeshLambertMaterial({color:0x5C2A10});
    for (var i=0;i<5;i++) {
      var ang=(i/5)*Math.PI*2;
      var log=new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.09,0.82,5),logMat);
      log.position.set(Math.cos(ang)*0.34,0.15,Math.sin(ang)*0.34);
      log.rotation.z=Math.PI/2; log.rotation.y=ang; g.add(log);
    }
    var fl=new THREE.PointLight(0xFF6600,2.0,13);
    fl.position.y=1.6; g.add(fl);
    campfires.push({mesh:g,light:fl});
  } else if (style==='stone') {
    var w=3+Math.random()*3, bh=4+Math.random()*2.5;
    var bld=new THREE.Mesh(new THREE.BoxGeometry(w,bh,w*0.82),new THREE.MeshLambertMaterial({color:0x888880}));
    bld.position.y=bh/2; bld.castShadow=true; g.add(bld);
    var rf=new THREE.Mesh(new THREE.ConeGeometry(w*0.7,bh*0.6,4),new THREE.MeshLambertMaterial({color:0x8B1A1A}));
    rf.position.y=bh+bh*0.3; rf.rotation.y=Math.PI/4; g.add(rf);
  } else if (style==='factory') {
    var fact=new THREE.Mesh(new THREE.BoxGeometry(5.5,7,4.5),new THREE.MeshLambertMaterial({color:0x555550}));
    fact.position.y=3.5; fact.castShadow=true; g.add(fact);
    for (var ci=0;ci<2;ci++) {
      var ch=new THREE.Mesh(new THREE.CylinderGeometry(0.4,0.5,6,8),new THREE.MeshLambertMaterial({color:0x333330}));
      ch.position.set(-1.2+ci*2.4,10,0.5); g.add(ch);
    }
  } else if (style==='city') {
    var floors=7+Math.floor(Math.random()*10), bldH=floors*2.2, bldW=3.5+Math.random()*2;
    var cb=new THREE.Mesh(new THREE.BoxGeometry(bldW,bldH,bldW*0.85),new THREE.MeshLambertMaterial({color:0x3A5570,transparent:true,opacity:0.92}));
    cb.position.y=bldH/2; cb.castShadow=true; g.add(cb);
    var wl=new THREE.PointLight(0xFFEE88,0.7,20); wl.position.y=bldH*0.6; g.add(wl);
  } else if (style==='future') {
    var fH=16+Math.random()*20;
    var ft=new THREE.Mesh(new THREE.CylinderGeometry(1.7,2.4,fH,8),new THREE.MeshLambertMaterial({color:0x9933CC,transparent:true,opacity:0.88}));
    ft.position.y=fH/2; ft.castShadow=true; g.add(ft);
    var ring=new THREE.Mesh(new THREE.TorusGeometry(4,0.28,8,24),new THREE.MeshBasicMaterial({color:0xAA55FF}));
    ring.position.y=fH+2; ring.rotation.x=Math.PI/2; ring.userData.isRing=true; g.add(ring);
    var gl=new THREE.PointLight(0xAA44FF,1.8,24); gl.position.y=fH; g.add(gl);
  }
  g.position.set(x,h,z);
  scene.add(g); buildings.push(g);
}

// ── INSPECTEUR ───────────────────────────────────────────────
var stateLabels = {
  wander:'🚶 Errance', seek_food:'🍖 Cherche nourriture', seek_water:'💧 Cherche eau',
  flee:'💨 En fuite!', hunt:'🎯 Chasse', eat:'🍃 Mange', drink:'💧 Boit',
  rest:'😴 Repos', reproduce:'❤️ Reproduction', dead:'💀 Mort',
};
var typeIcons = { human:'👤', deer:'🦌', wolf:'🐺', bird:'🐦', angel:'👼', demon:'👹' };

function creatureLabelFromId(id) {
  var creature = creatureRegistry[id];
  if (!creature || !creature.userData) return 'Inconnu #' + id;
  var type = creature.userData.type || 'créature';
  return type.charAt(0).toUpperCase() + type.slice(1) + ' #' + id;
}

function formatLineage(ud) {
  var parents = (ud.parents || []).map(creatureLabelFromId);
  var children = (ud.children || []).slice(-4).map(creatureLabelFromId);
  var parentText = parents.length ? parents.join(' + ') : 'Aucun ancêtre direct enregistré';
  var childText = children.length ? children.join(', ') : 'Aucun descendant enregistré';
  return '<strong>Origines</strong><br>' + parentText + '<br><strong>Descendance</strong><br>' + childText;
}

function formatCreatureFlags(ud) {
  var flags = [];
  if (ud.familyName) flags.push('Lignée : ' + ud.familyName);
  if (ud.territoryLabel) flags.push('Territoire : ' + ud.territoryLabel);
  if (ud.disease && ud.disease.active) flags.push('Maladie : active (' + Math.round(ud.disease.severity * 100) + '%)');
  else flags.push('Maladie : aucune');
  flags.push('Saison : ' + getSeasonInfo().name);
  flags.push('Statut : ' + (ud.deathCause || 'vivant'));
  return flags.join('<br>');
}

function updateInspector() {
  var cr = selectedCreature;
  if (!cr || !cr.userData || !cr.userData.alive) {
    closeInspector(); return;
  }
  var ud   = cr.userData;
  var dna  = ud.dna;
  var panel= document.getElementById('creature-inspector');
  if (panel.classList.contains('hidden')) panel.classList.remove('hidden');

  var icon = typeIcons[ud.type] || '?';
  if (ud.isProphet) icon = '✝️';
  if (ud.isRebel)   icon = '😈';
  document.getElementById('inspector-icon').textContent = icon;
  var typeName = ud.type.charAt(0).toUpperCase()+ud.type.slice(1);
  if (ud.isProphet) typeName = 'Prophète';
  if (ud.isRebel)   typeName = 'Rebelle';
  document.getElementById('inspector-type').textContent = typeName;
  document.getElementById('inspector-gen').textContent  = 'Génération ' + (ud.gen||1);
  var ageEl = document.getElementById('inspector-age');
  if (ageEl) ageEl.textContent = 'Âge : ' + Math.floor(ud.age||0) + 's';
  document.getElementById('inspector-state').textContent= stateLabels[ud.state] || ud.state;
  document.getElementById('inspector-biome').textContent= biomeLabel(ud.biome);

  function setBar(id,val,valId) {
    var el=document.getElementById(id);
    if (el) el.style.width=Math.round(val*100)+'%';
    var velEl=document.getElementById(valId);
    if (velEl) velEl.textContent=Math.round(val*100)+'%';
  }
  setBar('bar-hunger', ud.hunger, 'val-hunger');
  setBar('bar-thirst', ud.thirst, 'val-thirst');
  setBar('bar-energy', ud.energy, 'val-energy');

  function setGene(id,val) { var el=document.getElementById(id); if(el) el.style.width=Math.round(val*100)+'%'; }
  setGene('dna-cold',     dna.cold);
  setGene('dna-heat',     dna.heat);
  setGene('dna-speed',    dna.speed);
  setGene('dna-strength', dna.strength);
  setGene('dna-camo',     dna.camo);
  setGene('dna-stamina',  dna.stamina);
  setGene('dna-immunity', dna.immunity || 0);

  var domEl=document.getElementById('dominant-trait');
  if (domEl) domEl.textContent = '✦ ' + dominantTrait(dna);
  var lineageEl=document.getElementById('lineage-tree');
  if (lineageEl) lineageEl.innerHTML = formatLineage(ud);
  var flagsEl=document.getElementById('creature-flags');
  if (flagsEl) flagsEl.innerHTML = formatCreatureFlags(ud);
}

function closeInspector() {
  document.getElementById('creature-inspector').classList.add('hidden');
  selectedCreature = null;
}

// ── RAYCASTING ───────────────────────────────────────────────
function pickCreature(event) {
  var rect = renderer.domElement.getBoundingClientRect();
  mouseNDC.x =  ((event.clientX-rect.left)/rect.width)  * 2 - 1;
  mouseNDC.y = -((event.clientY-rect.top) /rect.height) * 2 + 1;
  raycaster.setFromCamera(mouseNDC, camera);

  // Filtrer meshes vivants
  var liveMeshes = allSelectableMeshes.filter(function(m) {
    return m.userData.creatureRef && m.userData.creatureRef.userData && m.userData.creatureRef.userData.alive;
  });

  var hits = raycaster.intersectObjects(liveMeshes);
  if (hits.length > 0) {
    selectedCreature = hits[0].object.userData.creatureRef;
  } else {
    closeInspector();
  }
}

// ── POUVOIRS DIVINS ──────────────────────────────────────────
function activatePower(power) {
  var now = Date.now();
  if (godCooldowns[power] && godCooldowns[power] > now) return;

  if (power === 'pause') {
    isPaused = !isPaused;
    document.getElementById('btn-pause').classList.toggle('active', isPaused);
    addEvent(isPaused ? "⏸ Le temps s'immobilise..." : "▶️ Le temps reprend son cours.");
    return;
  }

  if (power === 'meteor') {
    godCooldowns[power] = now + 20000;
    document.querySelectorAll('.power-btn').forEach(function(b) {
      if (b.dataset.power==='meteor') { b.classList.add('used'); setTimeout(function(){ b.classList.remove('used'); },20000); }
    });
    activateMeteor();
    return;
  }

  if (power === 'prophet') {
    godCooldowns[power] = now + 18000;
    document.querySelectorAll('.power-btn').forEach(function(b) {
      if (b.dataset.power==='prophet') { b.classList.add('used'); setTimeout(function(){ b.classList.remove('used'); },18000); }
    });
    spawnProphet();
    return;
  }

  if (power === 'angel') {
    godCooldowns[power] = now + 22000;
    document.querySelectorAll('.power-btn').forEach(function(b) {
      if (b.dataset.power==='angel') { b.classList.add('used'); setTimeout(function(){ b.classList.remove('used'); },22000); }
    });
    spawnAngel();
    return;
  }

  if (power === 'speed') {
    evolutionSpeed = evolutionSpeed===1 ? 6 : 1;
    document.getElementById('btn-speed').classList.toggle('active', evolutionSpeed>1);
    addEvent(evolutionSpeed>1 ? "⏩ Le temps s'accélère!" : "⏸ Le temps reprend son cours.");
    godCooldowns[power] = now+300; return;
  }

  godCooldowns[power] = now+12000;
  document.querySelectorAll('.power-btn').forEach(function(b) {
    if (b.dataset.power===power) { b.classList.add('used'); setTimeout(function(){ b.classList.remove('used'); },12000); }
  });

  if (power==='rain') {
    addEvent("🌧️ Tu fais tomber la pluie.");
    startRain(); setTimeout(stopRain, 16000);

  } else if (power==='lightning') {
    addEvent("⚡ La foudre frappe le monde!");
    flashScreen('rgba(255,255,255,0.8)',0.15);
    var allC = humans.concat(deerPop).concat(wolves);
    for (var i=0;i<5;i++) if (allC.length && Math.random()<0.6) markCreatureDead(allC[Math.floor(Math.random()*allC.length)], 'lightning');

  } else if (power==='abundance') {
    addEvent("🌱 Tu bénis le monde d'abondance!");
    for (var j=0;j<10;j++) (function(d){ setTimeout(function(){ spawnHuman(); spawnDeer(); },d*220); })(j);

  } else if (power==='plague') {
    addEvent("💀 Le fléau divin s'abat sur les créatures.");
    flashScreen('rgba(0,30,0,0.55)',0.9);
    var kill = Math.floor(humans.length*0.4);
    for (var k=0;k<kill;k++) if(humans[k]) markCreatureDead(humans[k], 'plague');
    kill = Math.floor(deerPop.length*0.35);
    for (var m=0;m<kill;m++) if(deerPop[m]) markCreatureDead(deerPop[m], 'plague');

  } else if (power==='blizzard') {
    isBlizzard = !isBlizzard;
    addEvent(isBlizzard ? "🌨️ Un blizzard glacial s'abat sur les hauteurs!" : "☀️ Le blizzard se dissipe.");
    document.querySelector('[data-power=blizzard]').classList.toggle('active', isBlizzard);
    if (isBlizzard) startRain();
    else stopRain();
  }
}


function flashScreen(color,dur) {
  var o=document.getElementById('flash-overlay');
  if (!o) return;
  o.style.background=color; o.style.transition='opacity 0s'; o.style.opacity='1';
  setTimeout(function(){
    o.style.transition='opacity '+(dur||1)+'s ease-out'; o.style.opacity='0';
  },50);
}

// ── JOURNAL ──────────────────────────────────────────────────
var eventMessages=[];
function addEvent(msg) {
  eventMessages.unshift(msg);
  if (eventMessages.length>7) eventMessages.pop();
  var el=document.getElementById('events');
  if (el) el.innerHTML=eventMessages.map(function(m,i){
    return '<div class="event-item" style="opacity:'+(1-i*0.12)+'">'+m+'</div>';
  }).join('');
  var n=document.getElementById('notification');
  if (n) {
    n.textContent=msg; n.classList.add('show');
    clearTimeout(n._t); n._t=setTimeout(function(){ n.classList.remove('show'); },3000);
  }
}

// ── CAMÉRA ───────────────────────────────────────────────────
function updateCamera() {
  var x = camTarget.x + camRadius*Math.sin(camPhi)*Math.sin(camTheta);
  var y = camTarget.y + camRadius*Math.cos(camPhi);
  var z = camTarget.z + camRadius*Math.sin(camPhi)*Math.cos(camTheta);
  camera.position.set(x,y,z);
  camera.lookAt(camTarget);
}

function initInputs() {
  var canvas = renderer.domElement;
  var mouseDownPos = { x:0, y:0 };
  var DRAG_THRESHOLD = 6; // pixels minimum avant de considérer un drag

  // ── SOURIS ────────────────────────────────────────────────
  canvas.addEventListener('mousedown', function(e) {
    if (e.button === 0 || e.button === 1 || e.button === 2) {
      isDragging    = false;
      rightDrag     = (e.button === 2 || e.button === 1);
      mouseDownPos  = { x: e.clientX, y: e.clientY };
      prevMouse     = { x: e.clientX, y: e.clientY };
      camVelTheta   = 0;  // couper l'inertie dès qu'on reclique
      camVelPhi     = 0;
    }
  });

  canvas.addEventListener('mousemove', function(e) {
    if (e.buttons === 0) return; // aucun bouton enfoncé → pas de drag
    var dx = e.clientX - mouseDownPos.x;
    var dy = e.clientY - mouseDownPos.y;
    // Seuil anti-clic accidentel : on ne drag qu'après 6 px de mouvement
    if (!isDragging && Math.sqrt(dx*dx + dy*dy) < DRAG_THRESHOLD) return;
    isDragging = true;

    var mdx = e.clientX - prevMouse.x;
    var mdy = e.clientY - prevMouse.y;

    if (rightDrag) {
      // Pan caméra-relatif : le monde suit la souris (grab-pan)
      var ps = camRadius * 0.0011;
      camTarget.x -= Math.cos(camTheta) * mdx * ps;
      camTarget.z += Math.sin(camTheta) * mdx * ps;
      camTarget.x -= Math.sin(camTheta) * mdy * ps;
      camTarget.z -= Math.cos(camTheta) * mdy * ps;
      // Bornes du terrain
      var half = TERRAIN_SIZE * 0.42;
      camTarget.x = Math.max(-half, Math.min(half, camTarget.x));
      camTarget.z = Math.max(-half, Math.min(half, camTarget.z));
      camTarget.y = Math.max(0, getHeight(camTarget.x, camTarget.z));
    } else {
      // Orbite : stocker la vélocité pour l'inertie
      var sens = 0.0035;
      camVelTheta = -mdx * sens;
      camVelPhi   =  mdy * sens;
      camTheta   += camVelTheta;
      camPhi = Math.max(0.15, Math.min(Math.PI * 0.44, camPhi + camVelPhi));
    }
    prevMouse = { x: e.clientX, y: e.clientY };
  });

  window.addEventListener('mouseup', function(e) {
    // Clic simple (pas de drag) → sélectionner une créature
    if (!isDragging) pickCreature(e);
    isDragging = false;
    rightDrag  = false;
  });

  canvas.addEventListener('contextmenu', function(e) { e.preventDefault(); });

  // Zoom : proportionnel à la distance actuelle (fluide près et loin)
  canvas.addEventListener('wheel', function(e) {
    var delta = e.deltaY * camRadiusTgt * 0.0013;
    camRadiusTgt = Math.max(30, Math.min(440, camRadiusTgt + delta));
  }, { passive: true });

  // ── TACTILE ───────────────────────────────────────────────
  canvas.addEventListener('touchstart', function(e) {
    e.preventDefault();
    lastTouches   = Array.from(e.touches);
    camVelTheta   = 0;
    camVelPhi     = 0;
    if (e.touches.length === 2) {
      var dx = e.touches[0].clientX - e.touches[1].clientX;
      var dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDist = Math.sqrt(dx*dx + dy*dy);
    }
  }, { passive: false });

  canvas.addEventListener('touchmove', function(e) {
    e.preventDefault();
    if (e.touches.length === 1 && lastTouches.length >= 1) {
      // 1 doigt → orbite avec inertie
      var mdx  = e.touches[0].clientX - lastTouches[0].clientX;
      var mdy  = e.touches[0].clientY - lastTouches[0].clientY;
      var sens = 0.0035;
      camVelTheta = -mdx * sens;
      camVelPhi   =  mdy * sens;
      camTheta   += camVelTheta;
      camPhi = Math.max(0.15, Math.min(Math.PI * 0.44, camPhi + camVelPhi));
    } else if (e.touches.length === 2 && lastTouches.length >= 2) {
      // 2 doigts → pinch zoom + pan
      var dx   = e.touches[0].clientX - e.touches[1].clientX;
      var dy   = e.touches[0].clientY - e.touches[1].clientY;
      var dist = Math.sqrt(dx*dx + dy*dy);
      camRadiusTgt = Math.max(30, Math.min(440, camRadiusTgt + (lastPinchDist - dist) * 0.55));
      lastPinchDist = dist;

      // Centre des deux doigts → pan
      var cx0 = (lastTouches[0].clientX + lastTouches[1].clientX) * 0.5;
      var cy0 = (lastTouches[0].clientY + lastTouches[1].clientY) * 0.5;
      var cx1 = (e.touches[0].clientX  + e.touches[1].clientX)  * 0.5;
      var cy1 = (e.touches[0].clientY  + e.touches[1].clientY)  * 0.5;
      var pdx = cx1 - cx0, pdy = cy1 - cy0;
      var ps  = camRadius * 0.002;
      camTarget.x -= Math.cos(camTheta) * pdx * ps;
      camTarget.z += Math.sin(camTheta) * pdx * ps;
      camTarget.x -= Math.sin(camTheta) * pdy * ps;
      camTarget.z -= Math.cos(camTheta) * pdy * ps;
      var half = TERRAIN_SIZE * 0.42;
      camTarget.x = Math.max(-half, Math.min(half, camTarget.x));
      camTarget.z = Math.max(-half, Math.min(half, camTarget.z));
    }
    lastTouches = Array.from(e.touches);
  }, { passive: false });

  canvas.addEventListener('touchend', function(e) {
    lastTouches = Array.from(e.touches);
  }, { passive: false });

  // ── UI ────────────────────────────────────────────────────
  document.getElementById('inspector-close').addEventListener('click', closeInspector);

  document.querySelectorAll('.power-btn').forEach(function(btn) {
    btn.addEventListener('click', function() { activatePower(btn.dataset.power); });
  });

  window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

// ── BOUCLE PRINCIPALE ────────────────────────────────────────
var inspectorTimer = 0;

function animate() {
  requestAnimationFrame(animate);
  var dt = Math.min(clock.getDelta(), 0.05);

  // ── CAMÉRA : inertie + zoom fluide (actif même en pause) ──
  if (!isDragging) {
    camVelTheta *= 0.88;
    camVelPhi   *= 0.88;
    if (Math.abs(camVelTheta) > 0.00008 || Math.abs(camVelPhi) > 0.00008) {
      camTheta += camVelTheta;
      camPhi = Math.max(0.15, Math.min(Math.PI * 0.44, camPhi + camVelPhi));
    }
  }
  camRadius += (camRadiusTgt - camRadius) * 0.10;
  updateCamera();

  if (isPaused) { renderer.render(scene, camera); return; }

  updateDayNight(dt);
  updateSeasonSystem(dt);
  updateWater(dt);
  updateClouds(dt);
  updateRain(dt);
  updateEvolution(dt);
  updateRandomEvents(dt);
  updateTerritories(dt);
  updateDiseases(dt);

  // Humains: fuient loups
  for (var hi=humans.length-1;hi>=0;hi--) {
    var h=humans[hi];
    if (!h.userData.alive) { scene.remove(h); humans.splice(hi,1); continue; }
    updateCreatureAI(h, dt, wolves, null, humans, MAX_HUMANS, makeHuman);
  }

  // Cerfs: fuient loups ET humains (en ères avancées)
  var deerPreds = eraIndex >= 2 ? wolves.concat(humans) : wolves;
  for (var di=deerPop.length-1;di>=0;di--) {
    var d=deerPop[di];
    if (!d.userData.alive) { scene.remove(d); deerPop.splice(di,1); continue; }
    updateCreatureAI(d, dt, deerPreds, null, deerPop, MAX_DEER, makeDeer);
  }

  // Loups
  for (var wi=wolves.length-1;wi>=0;wi--) {
    var w=wolves[wi];
    if (!w.userData.alive) { scene.remove(w); wolves.splice(wi,1); continue; }
    updateWolfAI(w, dt);
  }

  // Oiseaux
  for (var bi=0;bi<birds.length;bi++) updateBirdAI(birds[bi], dt);

  // Anneaux futuristes
  for (var bui=0;bui<buildings.length;bui++) {
    buildings[bui].traverse(function(c){ if(c.userData&&c.userData.isRing) c.rotation.z+=dt*0.7; });
  }
  // Feux de camp
  for (var fi=0;fi<campfires.length;fi++) {
    campfires[fi].light.intensity=1.8+Math.sin(Date.now()*0.009+fi)*0.65;
  }

  // Nettoyage raycasting (retirer morts)
  if (Math.random() < 0.01) {
    allSelectableMeshes = allSelectableMeshes.filter(function(m){
      return m.userData.creatureRef && m.userData.creatureRef.userData.alive;
    });
  }

  // Inspecteur
  inspectorTimer += dt;
  if (inspectorTimer > 0.18) { inspectorTimer=0; if(selectedCreature) updateInspector(); }

  // Anneau de sélection
  if (selectedCreature && selectedCreature.userData && selectedCreature.userData.alive) {
    selectionRing.visible = true;
    selectionRing.position.set(selectedCreature.position.x, selectedCreature.position.y + 0.5, selectedCreature.position.z);
    selectionRing.rotation.z += dt * 1.8;
  } else {
    selectionRing.visible = false;
  }

  updateMeteors(dt);
  updateReligion(dt);
  updateAngels(dt);
  updateDemons(dt);
  updatePopHistory(dt);
  minimapTimer += dt;
  if (minimapTimer >= MINIMAP_REFRESH_RATE) {
    minimapTimer = 0;
    drawMinimap();
  }

  renderer.render(scene, camera);
}

// ── INIT ─────────────────────────────────────────────────────
function init() {
  renderer = new THREE.WebGLRenderer({ canvas:document.getElementById('canvas'), antialias:true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87CEEB);
  scene.fog = new THREE.FogExp2(0x87CEEB, 0.0036);

  camera    = new THREE.PerspectiveCamera(58, window.innerWidth/window.innerHeight, 0.5, 2200);
  camTarget = new THREE.Vector3(0,8,0);
  updateCamera();

  clock     = new THREE.Clock();
  raycaster = new THREE.Raycaster();

  createSky();
  createLights();
  createTerrain();
  createWater();
  createSelectionRing();
  makeTrees(220);

  // Créatures initiales
  for (var i=0;i<9;i++)  spawnHuman();
  for (var j=0;j<16;j++) spawnDeer();
  for (var k=0;k<4;k++)  spawnWolf();
  for (var b=0;b<12;b++) spawnBird();

  // Feux de camp primitifs
  for (var f=0;f<3;f++) {
    var pos=findGround(0.8,10);
    if (pos) buildStructure(pos.x,pos.z,pos.y,'camp');
  }

  territories.human = buildTerritoryList('human', humans, 3);
  territories.wolf = buildTerritoryList('wolf', wolves, 2);
  ensureEraStats(eraIndex);
  updateDetailedStatsPanel();
  drawMinimap();
  initInputs();

  // Masquer loading
  setTimeout(function(){
    var ls=document.getElementById('loading-screen');
    if (ls) { ls.classList.add('fade-out'); setTimeout(function(){ ls.style.display='none'; },900); }
    addEvent("🌍 Le monde prend forme sous ton regard divin.");
    setTimeout(function(){ addEvent("🦌 Les cerfs peuplent les vallées, les loups rôdent."); },2200);
    setTimeout(function(){ addEvent("🧬 L'évolution commence — les plus forts survivront."); },5000);
    setTimeout(function(){ addEvent("💡 Clic sur une créature pour inspecter son ADN."); },8000);
  },1600);

  animate();
}

window.addEventListener('DOMContentLoaded', init);
