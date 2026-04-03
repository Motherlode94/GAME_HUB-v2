var RTS = RTS || {};
RTS.Game = RTS.Game || {};

RTS.Game.Squad = function(x, y, team, type) {
    this.x    = x;
    this.y    = y;
    this.team = team;
    this.type = type || 'rifle';

    var s = RTS.Game.Squad.STATS[this.type] || RTS.Game.Squad.STATS.rifle;
    this.maxSoldiers  = s.count;
    this.speed        = s.speed;
    this.radius       = s.radius;
    this.visionRadius = s.vision;
    this.captureSpeed = s.captureSpeed;
    this.attackRange  = s.attackRange;
    this.damage       = s.damage;
    this.fireRate     = s.fireRate;
    this.isAerial     = !!s.aerial;
    this.isVehicle    = !!s.vehicle;
    this.altitude     = s.altitude || 0;
    this.armorType    = s.armorType || 'none';   // 'none'|'light'|'heavy'
    this.role         = s.role || 'infantry';

    this.soldiers = [];
    this._initSoldiers();

    this.selected   = false;
    this.path       = [];
    this.pathIndex  = 0;
    this._angle     = 0;
    this._time      = Math.random() * Math.PI * 2;
    this._rotorAnim = 0;

    // Combat
    this.target          = null;
    this.inCombat        = false;
    this._fireTimer      = Math.random() * (1 / (this.fireRate || 1));
    this._fireInterval   = 1 / Math.max(0.01, this.fireRate);
    this._savedPath      = [];
    this._savedPathIdx   = 0;

    // FX
    this._muzzleFlashes = [];
    this._tracers       = [];
    this._hitSparks     = [];
    this._smokeParticles= [];
    this._explosions    = [];

    this.dead = false;
    this.suppressed = false;

    // Épave véhicule — visible quelques secondes après destruction
    this._wreckActive = false;
    this._wreckTimer  = 0;

    if (this.type === 'airstrike') this._lifeTimer = 10;
    if (this.type === 'artillery_truck') this._lifeTimer = 0;

    // â”€â”€ ABILITIES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Chaque ability : { cooldown, timer, active, duration, durationLeft }
    this.abilities = this._buildAbilities(s.abilities || []);

    // Ã‰tats spÃ©ciaux
    this._smokeActive   = false;
    this._smokeTimer    = 0;
    this._setupTimer    = 0;     // mortier : délai avant tir
    this._isSetup       = false;
    this._healTimer     = 0;
    this._artilleryTimer= 0;
    this._inspireActive = false;

    // CoH-like states
    this.retreating = false;
    this.coverLevel = 0; // 0:none, 1:light, 2:heavy
};

// ---------------------------------------------------------------------------
//  STATS â€” toutes les unitÃ©s
// ---------------------------------------------------------------------------

RTS.Game.Squad.STATS = {
    // â”€â”€ INFANTERIE DE BASE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    rifle:    { count:4, speed:55,  radius:26, vision:210, attackRange:160, damage:8,  fireRate:0.72, captureSpeed:1.0, armorType:'none', role:'infantry',
                abilities:['grenade','focus_fire'] },
    mg:       { count:3, speed:38,  radius:28, vision:250, attackRange:230, damage:14, fireRate:1.6, captureSpeed:0.5, armorType:'none', role:'support',
                abilities:['suppression_fire'] },
    sniper:   { count:2, speed:42,  radius:22, vision:360, attackRange:380, damage:40, fireRate:0.14,captureSpeed:0.3, armorType:'none', role:'sniper',
                abilities:['focus_fire'] },
    pioneer:  { count:4, speed:50,  radius:26, vision:200, attackRange:120, damage:6,  fireRate:0.62, captureSpeed:1.5, armorType:'none', role:'engineer',
                abilities:['smoke'] },

    // â”€â”€ INFANTERIE SPÃ‰CIALISÃ‰E â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    assault:  { count:4, speed:65, radius:26, vision:190, attackRange:110, damage:18, fireRate:1.3, captureSpeed:0.8, armorType:'none', role:'assault',
                abilities:['grenade','smoke','focus_fire'] },
    at_inf:   { count:3, speed:45,  radius:26, vision:200, attackRange:200, damage:90, fireRate:0.13, captureSpeed:0.5, armorType:'none', role:'anti_tank',
                abilities:['rocket_barrage'] },
    mortar:   { count:3, speed:38,  radius:28, vision:180, attackRange:320, damage:55, fireRate:0.16,captureSpeed:0.3, armorType:'none', role:'artillery',
                abilities:['barrage'] },
    medic:    { count:3, speed:52,  radius:24, vision:220, attackRange:80,  damage:2,  fireRate:0.13, captureSpeed:0.5, armorType:'none', role:'medic',
                abilities:['heal'] },

    // â”€â”€ VÃ‰HICULES LÃ‰GERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    jeep:         { count:1, speed:100, radius:18, vision:310, attackRange:170, damage:10, fireRate:0.90, captureSpeed:0.0, armorType:'light', role:'recon', vehicle:true,
                    abilities:['focus_fire'] },
    halftrack:    { count:1, speed:80, radius:24, vision:220, attackRange:200, damage:18, fireRate:1.10, captureSpeed:0.0, armorType:'light', role:'support', vehicle:true,
                    abilities:['suppression_fire'] },
    recon_car:    { count:1, speed:120, radius:16, vision:380, attackRange:120, damage:6,  fireRate:0.62, captureSpeed:0.0, armorType:'light', role:'recon', vehicle:true,
                    abilities:['smoke'] },
    anti_inf_car: { count:1, speed:85, radius:20, vision:230, attackRange:190, damage:22, fireRate:1.50, captureSpeed:0.0, armorType:'light', role:'anti_inf', vehicle:true,
                    abilities:['suppression_fire'] },

    // â”€â”€ BLINDÃ‰S â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    sherman:      { count:1, speed:58,  radius:30, vision:220, attackRange:260, damage:65, fireRate:0.18,captureSpeed:0.0, armorType:'heavy', role:'tank', vehicle:true,
                    abilities:['focus_fire'] },
    panzer:       { count:1, speed:55,  radius:32, vision:230, attackRange:280, damage:75, fireRate:0.25, captureSpeed:0.0, armorType:'heavy', role:'tank', vehicle:true,
                    abilities:['focus_fire'] },
    tank_destroyer:{ count:1,speed:48,  radius:30, vision:270, attackRange:350, damage:110,fireRate:0.14,captureSpeed:0.0, armorType:'heavy', role:'tank_destroyer', vehicle:true,
                    abilities:['focus_fire'] },
    heavy_tank:   { count:1, speed:35,  radius:36, vision:200, attackRange:240, damage:95, fireRate:0.13, captureSpeed:0.0, armorType:'heavy', role:'heavy_tank', vehicle:true,
                    abilities:['barrage'] },

    // â”€â”€ SUPPORT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    artillery_truck:{ count:1,speed:42, radius:26, vision:200, attackRange:600, damage:80, fireRate:0.07,captureSpeed:0.0, armorType:'light', role:'artillery', vehicle:true,
                    abilities:['barrage'] },

    // â”€â”€ AÃ‰RIENS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    heli_transport:{ count:1, speed:115, radius:28, vision:310, attackRange:0,   damage:0,  fireRate:0,   captureSpeed:0.0, aerial:true, altitude:55, role:'transport',
                    abilities:[] },
    heli_attack:   { count:1, speed:95, radius:28, vision:340, attackRange:290, damage:40, fireRate:0.31, captureSpeed:0.0, aerial:true, altitude:55, role:'gunship',
                    abilities:['rocket_barrage'] },
    airstrike:     { count:1, speed:420, radius:18, vision:380, attackRange:220, damage:130,fireRate:0.38, captureSpeed:0.0, aerial:true, altitude:110, role:'airstrike',
                    abilities:[] },

    // â•â• NOUVELLES UNITÃ‰S â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

    // â”€â”€ INFANTERIE ALLIÃ‰E â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Lance-flammes â€” portÃ©e courte, dÃ©gÃ¢ts massifs contre l'infanterie
    flamethrower:  { count:3, speed:42,  radius:26, vision:170, attackRange:85,  damage:32, fireRate:1.50, captureSpeed:0.5, armorType:'none', role:'assault',
                    abilities:['flamethrower_spray','smoke'] },
    // Parachutistes â€” infanterie d'Ã©lite rapide, excellente en assaut
    paratrooper:   { count:5, speed:72, radius:28, vision:230, attackRange:150, damage:13, fireRate:1.20, captureSpeed:1.0, armorType:'none', role:'assault',
                    abilities:['grenade','focus_fire','smoke'] },
    // Officier â€” commande sur le terrain, inspire les alliÃ©s proches
    officer:       { count:2, speed:58,  radius:24, vision:260, attackRange:140, damage:8,  fireRate:0.62, captureSpeed:0.5, armorType:'none', role:'infantry',
                    abilities:['inspire','focus_fire'] },

    // â”€â”€ BLINDÃ‰S ALLIÃ‰S â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // M10 Wolverine â€” chasseur de chars rapide, blindage lÃ©ger
    m10_wolverine: { count:1, speed:72, radius:28, vision:260, attackRange:310, damage:90, fireRate:0.25, captureSpeed:0.0, armorType:'light', role:'tank_destroyer', vehicle:true,
                    abilities:['focus_fire'] },
    // P-47 Thunderbolt â€” avion d'attaque au sol alliÃ©
    p47_thunderbolt:{ count:1,speed:380, radius:20, vision:420, attackRange:250, damage:110,fireRate:0.34,captureSpeed:0.0, aerial:true, altitude:90, role:'airstrike',
                    abilities:['rocket_barrage'] },

    // â”€â”€ INFANTERIE AXIS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Panzergrenadier â€” infanterie motorisÃ©e d'Ã©lite axis
    panzergrenadier:{ count:4, speed:65, radius:26, vision:210, attackRange:140, damage:16, fireRate:1.20, captureSpeed:0.8, armorType:'none', role:'assault',
                    abilities:['grenade','suppression_fire'] },
    // Sturmtruppen â€” unitÃ© de choc axis, combat rapprochÃ©
    sturmtruppen:  { count:4, speed:62,  radius:26, vision:200, attackRange:105, damage:20, fireRate:1.44, captureSpeed:0.6, armorType:'none', role:'assault',
                    abilities:['grenade','smoke'] },

    // â”€â”€ BLINDÃ‰S AXIS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Tiger I â€” char lourd redoutable, armure quasi-indestructible
    tiger:         { count:1, speed:38,  radius:36, vision:240, attackRange:310, damage:110,fireRate:0.13,captureSpeed:0.0, armorType:'heavy', role:'heavy_tank', vehicle:true,
                    abilities:['focus_fire','barrage'] },
    // StuG III â€” canon d'assaut sans tourelle, anti-char efficace
    stug:          { count:1, speed:52,  radius:30, vision:220, attackRange:270, damage:85, fireRate:0.26,captureSpeed:0.0, armorType:'heavy', role:'tank_destroyer', vehicle:true,
                    abilities:['focus_fire'] },
    // Fw 190 â€” avion d'attaque axis
    fw190:         { count:1, speed:400, radius:20, vision:400, attackRange:240, damage:95, fireRate:0.13, captureSpeed:0.0, aerial:true, altitude:90, role:'airstrike',
                    abilities:[] },

    // â•â• NOUVELLES UNITÃ‰S â€” ALLIÃ‰ES â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

    // â”€â”€ Ã‰LITE INFANTERIE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Rangers â€” infanterie d'Ã©lite polyvalente, petite escouade mais lÃ©tale
    ranger:         { count:3, speed:75, radius:24, vision:260, attackRange:170, damage:22, fireRate:1.20, captureSpeed:0.9, armorType:'none', role:'assault',
                     abilities:['grenade','focus_fire','smoke'] },
    // Combat Engineer â€” pionnier offensif, excellent pour capturer
    combat_engineer:{ count:4, speed:52,  radius:26, vision:210, attackRange:130, damage:14, fireRate:0.72, captureSpeed:1.8, armorType:'none', role:'engineer',
                     abilities:['smoke','grenade'] },
    // Commando â€” unitÃ© furtive, haute mobilitÃ©, dÃ©gÃ¢ts Ã©levÃ©s
    commando:       { count:2, speed:85, radius:20, vision:300, attackRange:145, damage:35, fireRate:0.85, captureSpeed:0.5, armorType:'none', role:'assault',
                     abilities:['focus_fire','smoke'] },

    // â”€â”€ VÃ‰HICULES AA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // M16 AA Half-Track â€” anti-aÃ©rien mobile, quad .50cal, supprime l'infanterie
    aa_halftrack:   { count:1, speed:65, radius:26, vision:280, attackRange:220, damage:28, fireRate:2.10, captureSpeed:0.0, armorType:'light', role:'anti_air', vehicle:true,
                     abilities:['suppression_fire'] },
    // Bofors 40mm â€” canon AA tractÃ©, excellent contre aÃ©riens et infanterie groupÃ©e
    bofors:         { count:1, speed:40,  radius:22, vision:320, attackRange:260, damage:45, fireRate:1.10, captureSpeed:0.0, armorType:'light', role:'anti_air', vehicle:true,
                     abilities:['focus_fire'] },

    // â”€â”€ ARTILLERIE AUTOMOTRICE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // M7 Priest â€” obusier automoteur longue portÃ©e
    m7_priest:      { count:1, speed:65,  radius:30, vision:210, attackRange:700, damage:95, fireRate:0.05, captureSpeed:0.0, armorType:'light', role:'artillery', vehicle:true,
                     abilities:['barrage'] },
    // Calliope â€” Sherman lance-roquettes, AOE dÃ©vastateur sur zone
    calliope:       { count:1, speed:75,  radius:32, vision:200, attackRange:500, damage:70, fireRate:0.05, captureSpeed:0.0, armorType:'heavy', role:'artillery', vehicle:true,
                     abilities:['rocket_barrage','barrage'] },

    // â”€â”€ CANONS ANTICHAR TRACTÃ‰S â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // 57mm AT Gun â€” canon antichar lÃ©ger, prÃ©cis, peu mobile
    at_gun:         { count:2, speed:30,  radius:24, vision:240, attackRange:320, damage:120, fireRate:0.18, captureSpeed:0.0, armorType:'light', role:'anti_tank',
                     abilities:['focus_fire'] },
    // 17-Pounder â€” canon antichar lourd, perce tous les blindages
    gun_17pdr:      { count:2, speed:20,  radius:26, vision:260, attackRange:380, damage:160, fireRate:0.13, captureSpeed:0.0, armorType:'light', role:'anti_tank',
                     abilities:['focus_fire','rocket_barrage'] },

    // â•â• NOUVELLES UNITÃ‰S â€” AXIS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

    // Flak 88 â€” le lÃ©gendaire canon AA/AT axis, dÃ©vastateur contre tout
    flak88:         { count:2, speed:15,  radius:28, vision:300, attackRange:400, damage:150, fireRate:0.14, captureSpeed:0.0, armorType:'light', role:'anti_tank',
                     abilities:['focus_fire'] },
    // Nebelwerfer â€” lance-roquettes multiple axis, barrage AOE
    nebelwerfer:    { count:2, speed:35,  radius:24, vision:190, attackRange:550, damage:75, fireRate:0.07, captureSpeed:0.0, armorType:'none', role:'artillery',
                     abilities:['barrage','rocket_barrage'] },
    // FallschirmjÃ¤ger â€” parachutistes d'Ã©lite axis
    fallschirmjager:{ count:4, speed:68, radius:26, vision:230, attackRange:150, damage:18, fireRate:1.3, captureSpeed:0.8, armorType:'none', role:'assault',
                     abilities:['grenade','focus_fire','smoke'] },
    // Jagdpanther â€” chasseur de chars axis ultra-efficace
    jagdpanther:    { count:1, speed:45,  radius:34, vision:250, attackRange:360, damage:130, fireRate:0.19, captureSpeed:0.0, armorType:'heavy', role:'tank_destroyer', vehicle:true,
                     abilities:['focus_fire'] },
    // Me 262 â€” avion Ã  rÃ©action axis, vitesse extrÃªme
    me262:          { count:1, speed:500, radius:18, vision:420, attackRange:260, damage:120, fireRate:0.31, captureSpeed:0.0, aerial:true, altitude:100, role:'airstrike',
                     abilities:[] }
};

RTS.Game.Squad.COLORS = {
    allied: { base:'#2d62ff', glow:'rgba(45,98,255,0.28)',  accent:'#7aaaff', dark:'#1a3a99', tracer:'rgba(180,220,255,0.9)' },
    axis:   { base:'#cc2222', glow:'rgba(204,34,34,0.28)',  accent:'#ff7777', dark:'#881111', tracer:'rgba(255,185,70,0.9)'  }
};

RTS.Game.Squad.SOLDIER_HP = {
    rifle:55, mg:80, sniper:45, pioneer:65,
    assault:70, at_inf:60, mortar:50, medic:45,
    jeep:130, halftrack:240, recon_car:100, anti_inf_car:180,
    sherman:620, panzer:700, tank_destroyer:550, heavy_tank:900,
    artillery_truck:320,
    heli_transport:260, heli_attack:360,
    airstrike:9999,
    // Nouvelles unitÃ©s
    flamethrower:60, paratrooper:65, officer:75,
    m10_wolverine:420,
    p47_thunderbolt:9999,
    panzergrenadier:70, sturmtruppen:65,
    tiger:1100, stug:680,
    fw190:9999,
    // AlliÃ©es â€” Ã©lite infanterie
    ranger:80, combat_engineer:60, commando:70,
    // AlliÃ©es â€” AA
    aa_halftrack:200, bofors:180,
    // AlliÃ©es â€” artillerie automotrice
    m7_priest:380, calliope:650,
    // AlliÃ©es â€” canons AT tractÃ©s
    at_gun:140, gun_17pdr:160,
    // Axis â€” nouvelles
    flak88:170, nebelwerfer:120, fallschirmjager:75, jagdpanther:850, me262:9999
};

// Bonus dÃ©gÃ¢ts selon rÃ´le vs type de cible
RTS.Game.Squad.DAMAGE_MODIFIER = function(attackerRole, targetArmor) {
    var table = {
        anti_tank:     { none:0.4, light:1.2, heavy:2.2 },
        tank_destroyer:{ none:0.3, light:1.0, heavy:2.5 },
        assault:       { none:1.4, light:0.7, heavy:0.3 },
        anti_inf:      { none:1.6, light:0.8, heavy:0.2 },
        artillery:     { none:1.2, light:1.0, heavy:0.8 },
        heavy_tank:    { none:1.0, light:1.3, heavy:1.8 }
    };
    var row = table[attackerRole];
    if (!row) return 1.0;
    return row[targetArmor] || 1.0;
};

// ---------------------------------------------------------------------------
//  ABILITIES DEFINITIONS
// ---------------------------------------------------------------------------

RTS.Game.Squad.ABILITY_DEFS = {
    grenade:          { label:'Grenade',        key:'G', icon:'💥', cooldown:15, duration:0,   description:'Explosion AOE courte portée' },
    smoke:            { label:'Fumigène',       key:'M', icon:'🌫', cooldown:20, duration:8,   description:'Écran de fumée, bloque la ligne de vue' },
    focus_fire:       { label:'Tir concentré',  key:'F', icon:'🎯', cooldown:12, duration:5,   description:'+40% précision, suppression bonus' },
    suppression_fire: { label:'Suppression',    key:'U', icon:'🔥', cooldown:18, duration:6,   description:'Supprime les unités ennemies' },
    rocket_barrage:   { label:'Roquettes',      key:'R', icon:'🚀', cooldown:30, duration:3,   description:'Barrage de roquettes AOE' },
    barrage:          { label:'Barrage',        key:'B', icon:'💣', cooldown:45, duration:4,   description:'Tir indirect longue portée' },
    heal:             { label:'Soins',          key:'H', icon:'➕', cooldown:25, duration:8,   description:'Régénère les soldats alliés proches' },
    // Nouvelles abilities
    flamethrower_spray:{ label:'Gerbe de feu',  key:'F', icon:'🔥', cooldown:20, duration:3,   description:'Cône de flammes AOE dévastateur' },
    inspire:          { label:'Inspiration',    key:'I', icon:'⭐', cooldown:35, duration:10,  description:'+30% cadence de tir alliés proches' }
};

RTS.Game.Squad.prototype._buildAbilities = function(list) {
    var out = {};
    var defs = RTS.Game.Squad.ABILITY_DEFS;
    list.forEach(function(id) {
        if (!defs[id]) return;
        out[id] = { id:id, timer:0, active:false, durationLeft:0 };
    });
    return out;
};

// ---------------------------------------------------------------------------
//  ACTIVATE ABILITY (appelÃ© depuis UI ou IA)
// ---------------------------------------------------------------------------

RTS.Game.Squad.prototype.activateAbility = function(id, allSquads, targetX, targetY) {
    var ab = this.abilities[id];
    if (!ab || ab.timer > 0) return false;
    var def = RTS.Game.Squad.ABILITY_DEFS[id];
    ab.timer = def.cooldown;
    ab.active = true;
    ab.durationLeft = def.duration;

    if (id === 'grenade')            this._doGrenade(targetX || this.x + 60, targetY || this.y);
    if (id === 'smoke')              this._smokeActive = true;
    if (id === 'rocket_barrage')     this._doRocketBarrage(allSquads);
    if (id === 'barrage')            this._doBarrage(allSquads);
    if (id === 'heal')               this._healActive = true;
    if (id === 'flamethrower_spray') this._doFlamethrowerSpray(allSquads);
    if (id === 'inspire')            this._inspireActive = true;
    return true;
};

RTS.Game.Squad.prototype._doFlamethrowerSpray = function(allSquads) {
    if (!allSquads) return;
    var self = this;
    var enemies = allSquads.filter(function(s){ return s.team !== self.team && !s.dead; });
    // Hit all enemies in a short cone (within attackRange)
    for (var k = 0; k < 3; k++) {
        (function(delay) {
            setTimeout(function() {
                self._explosions.push({ x: self.x + (Math.random()-.5)*50, y: self.y + (Math.random()-.5)*50, r:0, maxR:45, life:0.5 });
                enemies.forEach(function(sq) {
                    if (sq.dead) return;
                    var dx = sq.x - self.x, dy = sq.y - self.y;
                    if (Math.sqrt(dx*dx+dy*dy) > self.attackRange * 1.1) return;
                    sq.soldiers.forEach(function(s) {
                        if (!s.dead) {
                            // Lance-flammes inefficace contre blindage lourd
                            var mod = sq.armorType === 'heavy' ? 0.15 : sq.armorType === 'light' ? 0.5 : 1.0;
                            s.hp -= self.damage * mod;
                            if (s.hp <= 0) { s.hp = 0; s.dead = true; }
                        }
                    });
                });
            }, delay);
        })(k * 200);
    }
};

RTS.Game.Squad.prototype._doGrenade = function(tx, ty) {
    var self = this;
    // Explosion AOE aprÃ¨s 1.2s
    setTimeout(function() {
        self._explosions.push({ x:tx, y:ty, r:0, maxR:70, life:0.6 });
    }, 1200);
    this._tracers.push({ x1:this.x, y1:this.y, x2:tx, y2:ty, life:0.5, isGrenade:true });
};

RTS.Game.Squad.prototype._doRocketBarrage = function(allSquads) {
    if (!this.target && allSquads) this.target = this._findTarget(allSquads);
    if (!this.target) return;
    var self = this, tgt = this.target;
    for (var i = 0; i < 4; i++) {
        (function(delay){
            setTimeout(function() {
                var ox = (Math.random()-.5)*50, oy = (Math.random()-.5)*50;
                self._explosions.push({ x:tgt.x+ox, y:tgt.y+oy, r:0, maxR:55, life:0.5 });
                // DÃ©gÃ¢ts
                if (!tgt.dead) {
                    tgt.soldiers.forEach(function(s){
                        if (!s.dead) { s.hp -= self.damage * 0.7; if(s.hp<=0){s.hp=0;s.dead=true;} }
                    });
                }
            }, delay);
        })(i * 350);
    }
};

RTS.Game.Squad.prototype._doBarrage = function(allSquads) {
    if (!allSquads) return;
    var self = this;
    var enemies = allSquads.filter(function(s){ return s.team !== self.team && !s.dead; });
    if (!enemies.length) return;
    var tgt = enemies.reduce(function(best, sq) {
        return self._dist(sq) < self._dist(best) ? sq : best;
    }, enemies[0]);
    for (var i = 0; i < 5; i++) {
        (function(delay){
            setTimeout(function(){
                var ox=(Math.random()-.5)*80,oy=(Math.random()-.5)*80;
                self._explosions.push({ x:tgt.x+ox, y:tgt.y+oy, r:0, maxR:65, life:0.55 });
                if (!tgt.dead) {
                    tgt.soldiers.forEach(function(s){
                        if (!s.dead){ s.hp -= self.damage * 0.6; if(s.hp<=0){s.hp=0;s.dead=true;} }
                    });
                }
            }, delay);
        })(i * 500);
    }
};

// ---------------------------------------------------------------------------
//  INIT SOLDATS
// ---------------------------------------------------------------------------

RTS.Game.Squad.prototype._initSoldiers = function() {
    this.soldiers = [];
    var offs  = this._formOffsets(this.maxSoldiers);
    var maxHP = RTS.Game.Squad.SOLDIER_HP[this.type] || 60;
    for (var i = 0; i < this.maxSoldiers; i++) {
        this.soldiers.push({
            ox:offs[i].x, oy:offs[i].y,
            wobblePhase:Math.random()*Math.PI*2,
            hp:maxHP, maxHP:maxHP,
            dead:false, suppressed:false, suppressTimer:0, deathAnim:0
        });
    }
};

RTS.Game.Squad.prototype._formOffsets = function(n) {
    var out=[], sp=15, cols=Math.ceil(Math.sqrt(n));
    for (var i=0;i<n;i++) out.push({
        x:(i%cols-(cols-1)/2)*sp,
        y:(Math.floor(i/cols)-(Math.ceil(n/cols)-1)/2)*sp
    });
    return out;
};

RTS.Game.Squad.prototype._aliveSoldiers = function() {
    return this.soldiers.filter(function(s){return !s.dead;});
};
RTS.Game.Squad.prototype._totalHP = function() {
    var hp=0; this.soldiers.forEach(function(s){if(!s.dead)hp+=s.hp;}); return hp;
};
RTS.Game.Squad.prototype._maxTotalHP = function() {
    var hp=0; this.soldiers.forEach(function(s){hp+=s.maxHP;}); return hp;
};

RTS.Game.Squad.prototype.canReinforce = function() {
    if (this.dead || this.retreating || this.isVehicle || this.isAerial) return false;
    var alive = this._aliveSoldiers().length;
    return alive < this.maxSoldiers;
};

RTS.Game.Squad.prototype.reinforceOne = function() {
    if (!this.canReinforce()) return false;
    for (var i = 0; i < this.soldiers.length; i++) {
        var s = this.soldiers[i];
        if (s.dead) {
            s.dead = false;
            s.hp = s.maxHP;
            s.suppressed = false;
            s.suppressTimer = 0;
            s.deathAnim = 0;
            return true;
        }
    }
    return false;
};

// ---------------------------------------------------------------------------
//  UPDATE
// ---------------------------------------------------------------------------

RTS.Game.Squad.prototype.update = function(dt, allSquads) {
    if (this.dead) {
        if (this._wreckActive) {
            this._time     += dt;
            this._wreckTimer -= dt;
            this._decayFX(dt);
            if (this._wreckTimer <= 0) this._wreckActive = false;
        }
        return;
    }
    this._time      += dt;
    this._rotorAnim += dt * 9;
    this._fireTimer += dt;
    this._decayFX(dt);

    // Tick cooldowns abilities
    var self = this;
    Object.keys(this.abilities).forEach(function(id) {
        var ab = self.abilities[id];
        if (ab.timer > 0) ab.timer -= dt;
        if (ab.active) {
            ab.durationLeft -= dt;
            if (ab.durationLeft <= 0) {
                ab.active = false;
                if (id === 'smoke')    self._smokeActive  = false;
                if (id === 'heal')     self._healActive   = false;
                if (id === 'inspire')  self._inspireActive = false;
            }
        }
    });

    if (this.type === 'airstrike') {
        this._lifeTimer -= dt;
        if (this._lifeTimer <= 0) { this.dead = true; return; }
    }

    // FumigÃ¨nes : particules
    if (this._smokeActive) {
        if (Math.random() < 0.4) {
            this._smokeParticles.push({ x:this.x+(Math.random()-.5)*40, y:this.y+(Math.random()-.5)*40, r:8, life:2.5, maxLife:2.5 });
        }
    }

    // Soins auto
    if (this._healActive && allSquads) {
        this._healTimer += dt;
        if (this._healTimer >= 0.5) {
            this._healTimer = 0;
            allSquads.forEach(function(sq) {
                if (sq.team !== self.team || sq.dead) return;
                var dx=sq.x-self.x,dy=sq.y-self.y;
                if (Math.sqrt(dx*dx+dy*dy) > 120) return;
                sq.soldiers.forEach(function(s){ if(!s.dead && s.hp<s.maxHP) s.hp=Math.min(s.maxHP, s.hp+4); });
            });
        }
    }

    // FumÃ©e : particules decay
    for (var i=this._smokeParticles.length-1;i>=0;i--) {
        this._smokeParticles[i].life -= dt;
        this._smokeParticles[i].r   += dt * 6;
        if (this._smokeParticles[i].life <= 0) this._smokeParticles.splice(i,1);
    }

    // Explosions decay
    for (var j=this._explosions.length-1;j>=0;j--) {
        var ex = this._explosions[j];
        ex.r    += dt * 180;
        ex.life -= dt;
        if (ex.life <= 0) this._explosions.splice(j,1);
    }

    this.soldiers.forEach(function(s) {
        if (s.dead) { s.deathAnim = Math.min(1, s.deathAnim + dt*2); return; }
        if (s.suppressed) { s.suppressTimer -= dt; if(s.suppressTimer<=0) s.suppressed=false; }
    });

    if (this._aliveSoldiers().length === 0) {
        if (this.isVehicle && !this._wreckActive) {
            this._wreckTimer  = 9.0;
            this._wreckActive = true;
            this._explosions.push({ x:this.x, y:this.y, r:0, maxR:this.radius*2.8, life:0.9, maxLife:0.9 });
        }
        this.dead=true; this.inCombat=false; this.target=null; return;
    }

    if (this.retreating) {
        this.inCombat = false;
        this.target = null;
        this._move(dt);
        if (!this.path.length || this.pathIndex >= this.path.length) this.retreating = false;
        return;
    }

    // IA auto-abilities
    this._autoAbilities(dt, allSquads);

    if (allSquads) this._updateCombat(dt, allSquads);
    if (!this.inCombat) this._move(dt);
};

// ---------------------------------------------------------------------------
//  IA AUTO-ABILITIES (dÃ©clenchement situationnel)
// ---------------------------------------------------------------------------

RTS.Game.Squad.prototype._autoAbilities = function(dt, allSquads) {
    if (!allSquads || !this.target || !this.target.dead === false) return;
    var self = this;
    var tgt  = this.target;
    if (!tgt) return;

    // Officier : inspire si alliÃ©s en combat Ã  proximitÃ©
    if (this.role === 'infantry' && this.type === 'officer' && this.abilities.inspire && this.abilities.inspire.timer <= 0) {
        var alliesInCombat = allSquads.some(function(sq) {
            if (sq.team !== self.team || sq.dead || sq === self) return false;
            var dx=sq.x-self.x,dy=sq.y-self.y;
            return Math.sqrt(dx*dx+dy*dy)<180 && sq.inCombat;
        });
        if (alliesInCombat) {
            this.activateAbility('inspire', allSquads);
            // Propager _inspireActive aux alliÃ©s proches
            allSquads.forEach(function(sq) {
                if (sq.team !== self.team || sq.dead || sq === self) return;
                var dx=sq.x-self.x, dy=sq.y-self.y;
                if (Math.sqrt(dx*dx+dy*dy) < 180) sq._inspireActive = true;
            });
        }
    }

    // Lance-flammes : spray si ennemi trÃ¨s proche
    if (this.type === 'flamethrower' && this.abilities.flamethrower_spray && this.abilities.flamethrower_spray.timer <= 0) {
        if (tgt && !tgt.dead && this._dist(tgt) < this.attackRange + 20) {
            this.activateAbility('flamethrower_spray', allSquads);
        }
    }

    // Medic : heal si alliÃ©s proches blessÃ©s
    if (this.role === 'medic' && this.abilities.heal && this.abilities.heal.timer <= 0) {
        var needsHeal = allSquads.some(function(sq){
            if (sq.team !== self.team || sq.dead) return false;
            var dx=sq.x-self.x,dy=sq.y-self.y;
            if (Math.sqrt(dx*dx+dy*dy) > 120) return false;
            return sq._totalHP() < sq._maxTotalHP() * 0.7;
        });
        if (needsHeal) this.activateAbility('heal', allSquads);
    }

    // Assault/Pioneer : smoke si sous feu heavy MG
    if ((this.role === 'assault' || this.role === 'engineer') && this.abilities.smoke && this.abilities.smoke.timer <= 0) {
        var underHeavyFire = allSquads.some(function(sq){
            if (sq.team === self.team || sq.dead) return false;
            if (sq.type !== 'mg') return false;
            var dx=sq.x-self.x,dy=sq.y-self.y;
            return Math.sqrt(dx*dx+dy*dy) < 220;
        });
        if (underHeavyFire) this.activateAbility('smoke', allSquads);
    }

    // AT Infantry : rocket barrage si cible est un vÃ©hicule
    if (this.role === 'anti_tank' && this.abilities.rocket_barrage && this.abilities.rocket_barrage.timer <= 0) {
        if (tgt && tgt.isVehicle && !tgt.dead) this.activateAbility('rocket_barrage', allSquads);
    }

    // Mortar / Artillery : barrage si plusieurs ennemis groupÃ©s
    if ((this.role === 'artillery') && this.abilities.barrage && this.abilities.barrage.timer <= 0) {
        var nearby = allSquads.filter(function(sq){
            if (sq.team===self.team||sq.dead) return false;
            var dx=sq.x-(tgt?tgt.x:self.x), dy=sq.y-(tgt?tgt.y:self.y);
            return Math.sqrt(dx*dx+dy*dy)<100;
        });
        if (nearby.length >= 2) this.activateAbility('barrage', allSquads);
    }

    // Rifle / Assault : grenade si ennemi proche
    if ((this.role === 'infantry' || this.role === 'assault') && this.abilities.grenade && this.abilities.grenade.timer <= 0) {
        if (tgt && !tgt.dead) {
            var d = this._dist(tgt);
            if (d < 130) this.activateAbility('grenade', allSquads, tgt.x, tgt.y);
        }
    }

    // Focus fire : si ennemi fort en face
    if (this.abilities.focus_fire && this.abilities.focus_fire.timer <= 0) {
        if (tgt && !tgt.dead && (tgt.isVehicle || tgt._totalHP() > tgt._maxTotalHP()*0.8)) {
            this.activateAbility('focus_fire', allSquads);
        }
    }
};

// ---------------------------------------------------------------------------
//  COMBAT
// ---------------------------------------------------------------------------

RTS.Game.Squad.prototype._updateCombat = function(dt, all) {
    if (this.type === 'heli_transport') return;
    if (this.attackRange === 0) return;
    if (this.retreating) return;

    if (this.target) {
        if (this.target.dead || this._dist(this.target) > this.attackRange * 1.35)
            this._exitCombat();
    }
    if (!this.target) {
        this.target = this._findTarget(all);
        if (this.target) this._enterCombat();
    }

    // Mortier : setup delay
    if (this.role === 'artillery' && !this._isSetup) {
        this._setupTimer += dt;
        if (this._setupTimer >= 2.5) this._isSetup = true;
        return;
    }

    var inspireBonus = this._inspireActive ? 1.3 : 1.0;

    if (this.target && this.inCombat && this._fireTimer >= this._fireInterval / inspireBonus) {
        this._fireTimer = 0;
        this._shoot(this.target);
    }
};

RTS.Game.Squad.prototype._findTarget = function(all) {
    if (this.retreating) return null;
    var self=this, best=null, bestD=Infinity;
    all.forEach(function(sq) {
        if (sq.team===self.team||sq.dead) return;
        if (sq.isAerial && self.type!=='mg' && self.type!=='sniper' && self.type!=='heli_attack') return;
        // AT infantry prioritise les vÃ©hicules
        var d=self._dist(sq);
        if (d>self.attackRange) return;
        var score = d;
        if (self.role==='anti_tank'    && sq.isVehicle)  score -= 200;
        if (self.role==='tank_destroyer'&&sq.isVehicle)  score -= 300;
        if (self.role==='anti_inf'     && !sq.isVehicle) score -= 150;
        if (score<bestD){bestD=score;best=sq;}
    });
    return best;
};

RTS.Game.Squad.prototype._enterCombat = function() {
    if (this.inCombat) return;
    this.inCombat=true; this._isSetup=false; this._setupTimer=0;
    this._savedPath=this.path.slice(); this._savedPathIdx=this.pathIndex;
};

RTS.Game.Squad.prototype._exitCombat = function() {
    this.inCombat=false; this.target=null; this._isSetup=false; this._setupTimer=0;
    if (this._savedPath && this._savedPath.length>0) {
        this.path=this._savedPath; this.pathIndex=this._savedPathIdx; this._savedPath=[];
    }
};

RTS.Game.Squad.prototype._shoot = function(tgt) {
    if (this.retreating) return;
    var self=this;
    var alive=this._aliveSoldiers(), tAlive=tgt._aliveSoldiers();
    if (!alive.length||!tAlive.length) return;

    var focusBonus  = (this.abilities.focus_fire  && this.abilities.focus_fire.active)  ? 1.4 : 1.0;
    var suppBonus   = (this.abilities.suppression_fire && this.abilities.suppression_fire.active) ? 1.6 : 1.0;
    var dmgModifier = RTS.Game.Squad.DAMAGE_MODIFIER(this.role, tgt.armorType || 'none');

    // Inspire reÃ§u d'un officier alliÃ© proche : bonus cadence de tir
    var inspireBonus = 1.0;
    if (this._inspireActive) inspireBonus = 1.3;

    alive.forEach(function(sol) {
        var ts=tAlive[Math.floor(Math.random()*tAlive.length)];
        var sx=self.x+sol.ox, sy=self.y+sol.oy-self.altitude;
        var tx=tgt.x+ts.ox,   ty=tgt.y+ts.oy-tgt.altitude;
        var baseAcc = self.type==='sniper'?0.88 : self.isVehicle?0.65 : 0.55;
        var coverAccMul = 1.0;
        var coverDmgMul = 1.0;
        if (!self.isVehicle && !tgt.isVehicle && !tgt.isAerial) {
            if (tgt.coverLevel === 1) { coverAccMul = 0.80; coverDmgMul = 0.90; }
            else if (tgt.coverLevel >= 2) { coverAccMul = 0.60; coverDmgMul = 0.75; }
        }
        var smokeAccMul = (tgt._smokeParticles && tgt._smokeParticles.length > 0) ? 0.75 : 1.0;
        var hit = Math.random() < Math.min(0.97, baseAcc * focusBonus * coverAccMul * smokeAccMul);

        self._muzzleFlashes.push({x:sx,y:sy,angle:Math.atan2(ty-sy,tx-sx),life:0.09});
        self._tracers.push({x1:sx,y1:sy,
            x2:hit?tx:tx+(Math.random()-.5)*50,
            y2:hit?ty:ty+(Math.random()-.5)*50, life:0.13});

        if (hit) {
            // --- Ricochet vs blindage ---
            // L'infanterie standard ne peut pas pénétrer les chars lourds fiablement.
            var ricochetChance = 0;
            if (tgt.armorType === 'heavy') {
                if (self.role==='infantry'||self.role==='assault'||self.role==='sniper'||self.role==='support') ricochetChance = 0.26;
                else if (self.role==='engineer'||self.role==='medic') ricochetChance = 0.20;
                // anti_tank / tank_destroyer / artillery : pas de ricochet (rôle dédié)
            } else if (tgt.armorType === 'light') {
                if (self.role==='infantry'||self.role==='assault') ricochetChance = 0.08;
            }
            if (ricochetChance > 0 && Math.random() < ricochetChance) {
                // Ricochet — étincelles visuelles, zéro dégât
                self._hitSparks.push({x:tx, y:ty, life:0.28});
                return;
            }
            var retreatDmgMul = tgt.retreating ? 0.35 : 1.0;
            var doctrineMul = tgt.doctrineDamageTakenMul || 1.0;
            var finalDmg = self.damage * dmgModifier * focusBonus * coverDmgMul * retreatDmgMul * doctrineMul;
            ts.hp -= finalDmg;
            self._hitSparks.push({x:tx,y:ty,life:0.2});

            // Suppression
            if (!self.isVehicle && !tgt.isVehicle) {
                var suppChance = self.type==='mg' ? 0.8 : suppBonus > 1 ? 0.7 : 0.35;
                if (Math.random() < suppChance) { ts.suppressed=true; ts.suppressTimer=1.5+Math.random(); }
            }
            if (ts.hp<=0){ts.hp=0;ts.dead=true;}
        }
    });
};

RTS.Game.Squad.prototype._dist = function(o) {
    var dx=this.x-o.x,dy=this.y-o.y; return Math.sqrt(dx*dx+dy*dy);
};

// ---------------------------------------------------------------------------
//  MOVE
// ---------------------------------------------------------------------------

RTS.Game.Squad.prototype._move = function(dt) {
    if (!this.path.length||this.pathIndex>=this.path.length) return;
    var t=this.path[this.pathIndex];
    var dx=t.x-this.x, dy=t.y-this.y, d=Math.sqrt(dx*dx+dy*dy);
    if (d<5){this.pathIndex++;return;}
    this._angle=Math.atan2(dy,dx);
    var suppressedCount = 0;
    for (var i = 0; i < this.soldiers.length; i++) {
        if (!this.soldiers[i].dead && this.soldiers[i].suppressed) suppressedCount++;
    }
    var suppressMul = suppressedCount > 0 ? (1 - Math.min(0.5, suppressedCount * 0.12)) : 1.0;
    var retreatMul = this.retreating ? 1.55 : 1.0;
    var speedMul = suppressMul * retreatMul;
    this.x+=(dx/d)*this.speed*speedMul*dt;
    this.y+=(dy/d)*this.speed*speedMul*dt;
};

// ---------------------------------------------------------------------------
//  FX DECAY
// ---------------------------------------------------------------------------

RTS.Game.Squad.prototype._decayFX = function(dt) {
    var decay=function(a){for(var i=a.length-1;i>=0;i--){a[i].life-=dt;if(a[i].life<=0)a.splice(i,1);}};
    decay(this._muzzleFlashes); decay(this._tracers); decay(this._hitSparks);
};

// ---------------------------------------------------------------------------
//  RENDER
// ---------------------------------------------------------------------------

RTS.Game.Squad.prototype.render = function(ctx) {
    if (this.dead&&!this._wreckActive&&!this._tracers.length&&!this._muzzleFlashes.length&&!this._hitSparks.length&&!this._explosions.length) return;
    ctx.save();
    var col=RTS.Game.Squad.COLORS[this.team]||RTS.Game.Squad.COLORS.allied;

    // FumÃ©e
    this._drawSmoke(ctx);
    // Explosions
    this._drawExplosions(ctx);

    this._drawTracers(ctx,col);

    // Chemin
    if (this.selected&&!this.inCombat&&this.path.length>0&&this.pathIndex<this.path.length) {
        ctx.save(); ctx.setLineDash([5,5]);
        ctx.strokeStyle=col.accent+'88'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.moveTo(this.x,this.y);
        for (var p=this.pathIndex;p<this.path.length;p++) ctx.lineTo(this.path[p].x,this.path[p].y);
        ctx.stroke();
        var dest=this.path[this.path.length-1];
        ctx.setLineDash([]); ctx.strokeStyle=col.accent; ctx.lineWidth=1.5;
        ctx.beginPath();
        ctx.moveTo(dest.x-7,dest.y);ctx.lineTo(dest.x+7,dest.y);
        ctx.moveTo(dest.x,dest.y-7);ctx.lineTo(dest.x,dest.y+7);
        ctx.stroke(); ctx.restore();
    }

    // Anneau sÃ©lection
    if (this.selected) {
        var sy0=this.y-this.altitude;
        ctx.beginPath(); ctx.arc(this.x,sy0,this.radius+6,0,Math.PI*2);
        ctx.strokeStyle='rgba(255,255,255,0.85)'; ctx.lineWidth=1.5;
        ctx.setLineDash([6,4]); ctx.stroke(); ctx.setLineDash([]);
    }

    // Anneau combat
    if (this.inCombat) {
        var pulse=0.5+Math.abs(Math.sin(this._time*5))*0.5;
        var cy=this.y-this.altitude;
        ctx.beginPath(); ctx.arc(this.x,cy,this.radius+11,0,Math.PI*2);
        ctx.strokeStyle='rgba(255,80,0,'+(0.45*pulse)+')'; ctx.lineWidth=2; ctx.stroke();
    }

    // Indicateur setup mortier
    if (this.role==='artillery' && this.inCombat && !this._isSetup) {
        var prog = this._setupTimer / 2.5;
        ctx.beginPath(); ctx.arc(this.x, this.y-this.altitude, this.radius+8, -Math.PI/2, -Math.PI/2+Math.PI*2*prog);
        ctx.strokeStyle='#ffdd44'; ctx.lineWidth=3; ctx.stroke();
    }

    // Ombre sol aÃ©riens
    if (this.isAerial&&!this.dead) {
        ctx.save(); ctx.globalAlpha=0.22;
        ctx.fillStyle='#000';
        ctx.beginPath(); ctx.ellipse(this.x,this.y,this.radius*0.8,this.radius*0.35,0,0,Math.PI*2); ctx.fill();
        ctx.restore();
    }

    if      (this.isAerial)  this._drawAerial(ctx,col);
    else if (this.isVehicle) {
        if (this.dead && this._wreckActive) { this._drawVehicleWreck(ctx,col); }
        else { this._drawVehicle(ctx,col); this._drawVehicleDamageState(ctx); }
    }
    else                     this._drawInfantry(ctx,col);

    this._drawMuzzleFlashes(ctx,col);
    this._drawHitSparks(ctx);
    if (!this.dead&&(this.inCombat||this.selected||this.isVehicle)) this._drawHealthBar(ctx,col);

    // IcÃ´ne heal actif
    if (this._healActive) {
        ctx.fillStyle='#44ff88'; ctx.font='bold 11px Arial';
        ctx.textAlign='center'; ctx.textBaseline='bottom';
        ctx.fillText('➕', this.x, this.y-this.altitude-this.radius-16);
    }

    ctx.restore();
};

// ---------------------------------------------------------------------------
//  DRAW INFANTERIE
// ---------------------------------------------------------------------------

RTS.Game.Squad.prototype._drawInfantry = function(ctx,col) {
    // Couleur de glow selon rÃ´le
    var roleColors = {
        assault:'rgba(255,120,0,0.22)', anti_tank:'rgba(255,50,50,0.22)',
        artillery:'rgba(255,200,0,0.22)', medic:'rgba(0,255,120,0.22)',
        engineer:'rgba(200,180,100,0.22)'
    };
    // Flammes visuelles pour lance-flammes
    if (this.type === 'flamethrower' && this.inCombat) {
        var ft = this._time;
        for (var fi = 0; fi < 4; fi++) {
            var fa = Math.random() * Math.PI * 2;
            var fr = 6 + Math.sin(ft * 8 + fi) * 4;
            var fx = this.x + Math.cos(fa) * fr;
            var fy = this.y + Math.sin(fa) * fr;
            var flameGrad = ctx.createRadialGradient(fx, fy, 0, fx, fy, 12);
            flameGrad.addColorStop(0, 'rgba(255,240,80,0.9)');
            flameGrad.addColorStop(0.5,'rgba(255,100,0,0.6)');
            flameGrad.addColorStop(1, 'rgba(200,30,0,0)');
            ctx.fillStyle = flameGrad;
            ctx.beginPath(); ctx.arc(fx, fy, 12, 0, Math.PI*2); ctx.fill();
        }
    }
    var glowColor = roleColors[this.role] || col.glow;
    var glow=ctx.createRadialGradient(this.x,this.y,0,this.x,this.y,this.radius*1.5);
    glow.addColorStop(0,glowColor); glow.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=glow; ctx.beginPath(); ctx.arc(this.x,this.y,this.radius*1.5,0,Math.PI*2); ctx.fill();
    for (var i=0;i<this.soldiers.length;i++) this._drawSoldier(ctx,this.soldiers[i],col);
    this._drawLabel(ctx,col,this.x,this.y);
};

RTS.Game.Squad.prototype._drawSoldier = function(ctx,sol,col) {
    var mov=!this.inCombat&&this.path.length>0&&this.pathIndex<this.path.length;
    var wb=mov?Math.sin(this._time*6+sol.wobblePhase)*1.8:0;
    var sx=this.x+sol.ox+wb*Math.cos(this._angle+Math.PI/2);
    var sy=this.y+sol.oy+wb*Math.sin(this._angle+Math.PI/2);

    if (sol.dead) {
        ctx.save(); ctx.globalAlpha=Math.max(0,0.35-sol.deathAnim*0.35);
        ctx.strokeStyle='#553333'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.moveTo(sx-4,sy-4);ctx.lineTo(sx+4,sy+4);
        ctx.moveTo(sx+4,sy-4);ctx.lineTo(sx-4,sy+4); ctx.stroke(); ctx.restore(); return;
    }

    // Couleur selon rÃ´le
    var soldierColor = col.base;
    if (this.role==='assault')    soldierColor='#ff6600';
    if (this.role==='anti_tank')  soldierColor='#cc0000';
    if (this.role==='medic')      soldierColor='#00cc66';
    if (this.role==='artillery')  soldierColor='#ccaa00';
    if (this.team==='axis') soldierColor = col.base;

    ctx.save();
    if (sol.suppressed){ctx.globalAlpha=0.7;ctx.translate(sx,sy);ctx.scale(1.3,0.5);ctx.translate(-sx,-sy);}
    ctx.beginPath(); ctx.arc(sx,sy,5,0,Math.PI*2);
    ctx.fillStyle=sol.suppressed?col.dark:soldierColor; ctx.fill();
    var sh=ctx.createRadialGradient(sx-1.5,sy-1.5,0,sx,sy,5);
    sh.addColorStop(0,'rgba(255,255,255,0.35)'); sh.addColorStop(1,'rgba(0,0,0,0.2)');
    ctx.fillStyle=sh; ctx.beginPath(); ctx.arc(sx,sy,5,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(sx,sy,5,0,Math.PI*2);
    ctx.strokeStyle=this.selected?'#fff':col.accent; ctx.lineWidth=1; ctx.stroke();
    if (this.inCombat&&sol.hp<sol.maxHP) {
        var r=sol.hp/sol.maxHP;
        ctx.fillStyle='rgba(0,0,0,0.7)'; ctx.fillRect(sx-5,sy-9,10,2);
        ctx.fillStyle=r>0.5?'#44ff44':r>0.25?'#ffaa00':'#ff2222'; ctx.fillRect(sx-5,sy-9,10*r,2);
    }
    ctx.restore();
};

// ---------------------------------------------------------------------------
//  DRAW VÃ‰HICULE
// ---------------------------------------------------------------------------

RTS.Game.Squad.prototype._drawVehicle = function(ctx,col) {
    var x=this.x, y=this.y;
    ctx.save();
    ctx.translate(x,y); ctx.rotate(this._angle+Math.PI/2);
    var t=this.type;

    if (t==='jeep' || t==='recon_car') {
        var jCol = t==='recon_car' ? '#1a5a1a' : col.base;
        ctx.fillStyle=jCol; ctx.fillRect(-8,-13,16,26);
        ctx.fillStyle='rgba(180,220,255,0.45)'; ctx.fillRect(-6,-9,12,7);
        ctx.fillStyle='#222';
        [[-10,-8],[10,-8],[-10,7],[10,7]].forEach(function(r){ctx.fillRect(r[0]-2,r[1]-3,4,6);});
        ctx.strokeStyle=t==='recon_car'?'#44ff44':col.accent; ctx.lineWidth=1.5; ctx.strokeRect(-8,-13,16,26);
        // Antenne recon
        if (t==='recon_car') {
            ctx.strokeStyle='#88ff88'; ctx.lineWidth=1;
            ctx.beginPath(); ctx.moveTo(4,-13); ctx.lineTo(8,-24); ctx.stroke();
        }

    } else if (t==='halftrack' || t==='anti_inf_car') {
        ctx.fillStyle=t==='anti_inf_car'?'#3a2a0a':col.base; ctx.fillRect(-10,-17,20,34);
        ctx.fillStyle='#222';
        ctx.fillRect(-13,-17,4,34); ctx.fillRect(9,-17,4,34);
        for (var i=0;i<4;i++){ctx.fillStyle='#555';ctx.beginPath();ctx.arc(-11,-12+i*8,3,0,Math.PI*2);ctx.fill();
            ctx.beginPath();ctx.arc(11,-12+i*8,3,0,Math.PI*2);ctx.fill();}
        if (t==='anti_inf_car') {
            // Mitrailleuse lourde sur tourelle
            ctx.fillStyle='#333'; ctx.beginPath(); ctx.arc(0,-3,6,0,Math.PI*2); ctx.fill();
            ctx.fillStyle='#111'; ctx.fillRect(-2,-18,4,16);
        }
        ctx.strokeStyle=col.accent; ctx.lineWidth=1.5; ctx.strokeRect(-10,-17,20,34);

    } else if (t==='artillery_truck') {
        ctx.fillStyle='#2a3a1a'; ctx.fillRect(-12,-22,24,44);
        ctx.fillStyle='#111'; ctx.fillRect(-14,-22,4,44); ctx.fillRect(10,-22,4,44);
        // Canon long
        ctx.fillStyle='#222'; ctx.fillRect(-3,-38,6,20);
        ctx.strokeStyle='#88aa44'; ctx.lineWidth=2; ctx.strokeRect(-12,-22,24,44);

    } else if (t==='sherman'||t==='panzer'||t==='tank_destroyer'||t==='heavy_tank'||t==='tiger'||t==='stug'||t==='m10_wolverine'||t==='calliope'||t==='jagdpanther') {
        var configs = {
            sherman:         { w:11, h:20, bodyColor:col.dark,   trackColor:'#111', turretR:8,  barrelLen:12 },
            panzer:          { w:13, h:22, bodyColor:'#4a3a1a',   trackColor:'#111', turretR:9,  barrelLen:14 },
            tank_destroyer:  { w:11, h:20, bodyColor:'#3a2a0a',   trackColor:'#111', turretR:7,  barrelLen:20, noTurret:true },
            heavy_tank:      { w:15, h:26, bodyColor:'#1a2a4a',   trackColor:'#111', turretR:11, barrelLen:10 },
            tiger:           { w:16, h:28, bodyColor:'#3a3010',   trackColor:'#111', turretR:12, barrelLen:18 },
            stug:            { w:13, h:22, bodyColor:'#2a3010',   trackColor:'#111', turretR:8,  barrelLen:22, noTurret:true },
            m10_wolverine:   { w:10, h:19, bodyColor:'#1a3a1a',   trackColor:'#111', turretR:7,  barrelLen:14, openTop:true },
            calliope:        { w:12, h:22, bodyColor:'#1a3020',   trackColor:'#111', turretR:9,  barrelLen:8,  rocketPod:true },
            jagdpanther:     { w:14, h:25, bodyColor:'#2a2808',   trackColor:'#111', turretR:9,  barrelLen:26, noTurret:true }
        };
        var c = configs[t];
        ctx.fillStyle=c.bodyColor; ctx.fillRect(-c.w,-c.h,c.w*2,c.h*2);
        ctx.fillStyle=c.trackColor;
        ctx.fillRect(-c.w-4,-c.h,5,c.h*2); ctx.fillRect(c.w-1,-c.h,5,c.h*2);
        var nWheels = t==='heavy_tank'?6:5;
        for (var j=0;j<nWheels;j++){
            ctx.fillStyle='#333';
            var wy = -c.h+4+j*(c.h*2-8)/(nWheels-1);
            ctx.beginPath();ctx.arc(-c.w-2,wy,3,0,Math.PI*2);ctx.fill();
            ctx.beginPath();ctx.arc(c.w+2,wy,3,0,Math.PI*2);ctx.fill();
        }
        if (!c.noTurret) {
            ctx.fillStyle=t==='panzer'?'#3d3010':t==='heavy_tank'?'#0d1a3a':t==='tiger'?'#2d2000':'#1a3380';
            ctx.beginPath(); ctx.arc(0,0,c.turretR,0,Math.PI*2); ctx.fill();
            ctx.strokeStyle=col.accent; ctx.lineWidth=1; ctx.stroke();
        }
        // M10 : tourelle ouverte (anneau)
        if (c.openTop) {
            ctx.strokeStyle=col.accent+'88'; ctx.lineWidth=2;
            ctx.beginPath(); ctx.arc(0,0,c.turretR,0,Math.PI*2); ctx.stroke();
        }
        // Calliope : pod de roquettes sur la tourelle
        if (c.rocketPod) {
            ctx.fillStyle='#334'; ctx.fillRect(-c.turretR,-c.turretR,c.turretR*2,c.turretR*1.5);
            for(var rr=0;rr<3;rr++){
                ctx.fillStyle='#111'; ctx.beginPath(); ctx.arc(-c.turretR*0.6+rr*c.turretR*0.6,-c.turretR*0.3,2.5,0,Math.PI*2); ctx.fill();
            }
        }
        ctx.fillStyle='#111'; ctx.fillRect(-2,-c.h-c.barrelLen,4,c.h*0.5+c.barrelLen);
        ctx.strokeStyle=col.accent; ctx.lineWidth=1.5; ctx.strokeRect(-c.w,-c.h,c.w*2,c.h*2);

    } else if (t==='aa_halftrack'||t==='bofors'||t==='m7_priest'||t==='at_gun'||t==='gun_17pdr'||t==='flak88'||t==='nebelwerfer') {
        // VÃ©hicules/canons spÃ©ciaux
        if (t==='aa_halftrack') {
            // ChÃ¢ssis half-track + tourelle quad .50
            ctx.fillStyle=col.base; ctx.fillRect(-10,-17,20,34);
            ctx.fillStyle='#222'; ctx.fillRect(-13,-17,4,34); ctx.fillRect(9,-17,4,34);
            for(var wi=0;wi<4;wi++){ctx.fillStyle='#555';ctx.beginPath();ctx.arc(-11,-12+wi*8,3,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(11,-12+wi*8,3,0,Math.PI*2);ctx.fill();}
            // Tourelle AA avec 4 canons
            ctx.fillStyle='#333'; ctx.beginPath(); ctx.arc(0,-3,7,0,Math.PI*2); ctx.fill();
            ctx.fillStyle='#111';
            ctx.fillRect(-6,-16,3,14); ctx.fillRect(3,-16,3,14);
            ctx.fillRect(-8,-13,3,10); ctx.fillRect(5,-13,3,10);
            ctx.strokeStyle='#44aaff'; ctx.lineWidth=1.5; ctx.strokeRect(-10,-17,20,34);

        } else if (t==='bofors') {
            // Affut de canon AA carrÃ©
            ctx.fillStyle='#2a3a1a'; ctx.fillRect(-9,-9,18,18);
            ctx.fillStyle='#1a1a1a'; ctx.fillRect(-10,-10,20,4); ctx.fillRect(-10,6,20,4);
            // Canon
            ctx.fillStyle='#222'; ctx.fillRect(-2,-28,4,22);
            ctx.fillRect(-4,-32,8,6);
            ctx.strokeStyle='#88ff44'; ctx.lineWidth=1.5; ctx.strokeRect(-9,-9,18,18);

        } else if (t==='m7_priest') {
            // ChÃ¢ssis Sherman + howitzer
            ctx.fillStyle='#1a3020'; ctx.fillRect(-11,-20,22,40);
            ctx.fillStyle='#111'; ctx.fillRect(-14,-20,4,40); ctx.fillRect(10,-20,4,40);
            for(var pi=0;pi<5;pi++){ctx.fillStyle='#333';ctx.beginPath();ctx.arc(-12,-14+pi*7,3,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(12,-14+pi*7,3,0,Math.PI*2);ctx.fill();}
            // Superstructure ouverte
            ctx.fillStyle='#0d2010'; ctx.fillRect(-8,-14,16,18);
            // Obusier court
            ctx.fillStyle='#111'; ctx.fillRect(-3,-28,6,16);
            ctx.strokeStyle='#44ff88'; ctx.lineWidth=1.5; ctx.strokeRect(-11,-20,22,40);

        } else if (t==='at_gun'||t==='gun_17pdr'||t==='flak88') {
            // Canons tractÃ©s â€” affut bas + long canon
            var barLen = t==='gun_17pdr'?38 : t==='flak88'?42 : 30;
            var aCol   = t==='flak88'?'#2a2808':'#2a1a1a';
            ctx.fillStyle=aCol; ctx.fillRect(-9,-8,18,16);
            // Roues
            ctx.fillStyle='#333'; ctx.beginPath(); ctx.arc(-11,6,5,0,Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(11,6,5,0,Math.PI*2); ctx.fill();
            ctx.fillStyle='#555'; ctx.beginPath(); ctx.arc(-11,6,3,0,Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(11,6,3,0,Math.PI*2); ctx.fill();
            // Bouclier
            ctx.fillStyle='#333'; ctx.fillRect(-8,-12,16,10);
            // Canon
            ctx.fillStyle='#111'; ctx.fillRect(-2,-barLen,4,barLen-8);
            ctx.strokeStyle= t==='flak88'?'#aaaa44':col.accent; ctx.lineWidth=1.5; ctx.strokeRect(-9,-8,18,16);

        } else if (t==='nebelwerfer') {
            // Lance-roquettes multiple sur affut
            ctx.fillStyle='#1a1a0a'; ctx.fillRect(-8,-6,16,12);
            ctx.fillStyle='#333'; ctx.beginPath(); ctx.arc(-9,8,4,0,Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(9,8,4,0,Math.PI*2); ctx.fill();
            // Tubes (5 roquettes)
            for(var ni=0;ni<5;ni++){
                var nx=-8+ni*4;
                ctx.fillStyle='#222'; ctx.fillRect(nx,-22,3,18);
                ctx.strokeStyle='#aa4400'; ctx.lineWidth=0.5; ctx.strokeRect(nx,-22,3,18);
            }
            ctx.strokeStyle='#aa6600'; ctx.lineWidth=1.5; ctx.strokeRect(-8,-6,16,12);
        }
    } // fin else if canons spéciaux

    if (this.selected) {
        ctx.beginPath(); ctx.arc(0,0,this.radius+6,0,Math.PI*2);
        ctx.setLineDash([6,4]); ctx.strokeStyle='rgba(255,255,255,0.85)'; ctx.lineWidth=1.5; ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.restore();
    this._drawLabel(ctx,col,x,y);
};

// ---------------------------------------------------------------------------
//  ÉPAVE VÉHICULE (wreck)
// ---------------------------------------------------------------------------

/**
 * Dessine la carcasse calcinée d'un véhicule détruit.
 * Reste visible pendant _wreckTimer secondes.
 */
RTS.Game.Squad.prototype._drawVehicleWreck = function(ctx, col) {
    var x = this.x, y = this.y, r = this.radius;
    var t = this._time;
    var life = Math.max(0, this._wreckTimer / 9.0); // 1→0 pendant la durée

    ctx.save();

    // --- Ombre au sol ---
    ctx.globalAlpha = 0.35 * life;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(x, y + r * 0.2, r * 1.1, r * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // --- Coque calcinée (version sombre de _drawVehicle) ---
    ctx.globalAlpha = Math.min(1, life * 2); // apparaît vite, disparaît lentement
    ctx.translate(x, y);
    ctx.rotate(this._angle + Math.PI / 2);

    // Contour générique de l'épave selon taille de véhicule
    var hw, hh;
    if (this.armorType === 'heavy') { hw = 16; hh = 28; }
    else if (this.armorType === 'light') { hw = 10; hh = 18; }
    else { hw = 8; hh = 14; }

    // Corps principal noirci
    ctx.fillStyle = '#1a1208';
    ctx.fillRect(-hw, -hh, hw * 2, hh * 2);

    // Chenilles / roues calcinées
    ctx.fillStyle = '#0d0d0d';
    ctx.fillRect(-hw - 4, -hh, 5, hh * 2);
    ctx.fillRect(hw - 1, -hh, 5, hh * 2);

    // Cratère de brûlure au centre
    ctx.fillStyle = '#2a1a0a';
    ctx.beginPath(); ctx.arc(0, 0, hw * 0.65, 0, Math.PI * 2); ctx.fill();

    // Éclats métalliques déterministes (pas de Math.random en render)
    ctx.strokeStyle = '#3a2a18';
    ctx.lineWidth = 1.5;
    var shardDefs = [
        [-hw * 0.8, -hh * 0.6,  5, -4],
        [ hw * 0.6, -hh * 0.3, -5,  4],
        [-hw * 0.3,  hh * 0.7,  4,  5],
        [ hw * 0.7,  hh * 0.5, -4, -5]
    ];
    shardDefs.forEach(function(s) {
        ctx.beginPath();
        ctx.moveTo(s[0], s[1]);
        ctx.lineTo(s[0] + s[2], s[1] + s[3]);
        ctx.stroke();
    });

    // Contour brisé de la carcasse
    ctx.strokeStyle = '#2a1a0a';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-hw, -hh, hw * 2, hh * 2);

    ctx.restore();

    // --- Fumée résiduelle décroissante ---
    var smokeAlpha = life * 0.7;
    if (smokeAlpha > 0.05) {
        for (var i = 0; i < 2; i++) {
            var phase = (t * 1.4 + i * 2.8) % 3.5;
            var sx = x + Math.sin(t * 0.6 + i * 1.9) * r * 0.3;
            var sy = y - r - phase * 8;
            var sr = 4 + phase * 3;
            var sa = Math.max(0, smokeAlpha * (0.7 - phase * 0.18));

            ctx.save();
            ctx.globalAlpha = sa;
            var sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
            sg.addColorStop(0,   'rgba(20,14,10,0.9)');
            sg.addColorStop(0.6, 'rgba(40,30,25,0.5)');
            sg.addColorStop(1,   'rgba(60,50,45,0)');
            ctx.fillStyle = sg;
            ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }
    }

    // --- HP bar du wreck (rouge fixe, vide) ---
    ctx.save();
    ctx.globalAlpha = life * 0.8;
    var bw = Math.max(40, r * 2.2), bh = 5;
    var bx = x - bw / 2, by = y - r - 14;
    ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
    ctx.fillStyle = '#441111'; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = '#662222'; ctx.lineWidth = 0.5; ctx.strokeRect(bx, by, bw, bh);
    ctx.fillStyle = '#884444'; ctx.font = '8px "Courier New"';
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText('DÉTRUIT', x, by - 1);
    ctx.restore();
};

// ---------------------------------------------------------------------------
//  ÉTATS D'ENDOMMAGEMENT VÉHICULE
// ---------------------------------------------------------------------------

RTS.Game.Squad.prototype._drawVehicleDamageState = function(ctx) {
    if (!this.isVehicle || this.dead) return;
    var maxHp = this._maxTotalHP();
    if (maxHp <= 0) return;
    var hpRatio = this._totalHP() / maxHp;
    if (hpRatio >= 0.5) return;

    var t = this._time, x = this.x, y = this.y, r = this.radius;

    // --- Fumée noire (<50% HP) ---
    var smokeCount = hpRatio < 0.25 ? 4 : 2;
    for (var i = 0; i < smokeCount; i++) {
        var phase = (t * 1.8 + i * 2.4) % 3.5;
        var sx    = x + Math.sin(t * 0.9 + i * 2.1) * r * 0.35;
        var sy    = y - r - 2 - phase * 9;
        var sr    = 5 + phase * 3.5;
        var alpha = Math.max(0, (0.75 - phase * 0.2) * (hpRatio < 0.25 ? 1.0 : 0.60));
        ctx.save();
        ctx.globalAlpha = alpha;
        var sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
        sg.addColorStop(0,   'rgba(25,18,18,0.95)');
        sg.addColorStop(0.5, 'rgba(50,40,35,0.70)');
        sg.addColorStop(1,   'rgba(70,60,55,0)');
        ctx.fillStyle = sg;
        ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    // --- Flammes + clignotement rouge (<25% HP) ---
    if (hpRatio < 0.25) {
        for (var fi = 0; fi < 5; fi++) {
            var fp    = t * 3.5 + fi * 1.26;
            var fDist = r * 0.45;
            var fx    = x + Math.cos(fp * 0.9 + fi * 1.4) * fDist;
            var fy    = y - 2 + Math.sin(fp * 1.2 + fi) * r * 0.3;
            var fSize = 7 + Math.abs(Math.sin(fp * 2.5 + fi)) * 5;
            var fa    = 0.55 + Math.sin(fp * 3.0) * 0.35;
            ctx.save();
            ctx.globalAlpha = Math.max(0, Math.min(1, fa));
            var fg = ctx.createRadialGradient(fx, fy, 0, fx, fy, fSize);
            fg.addColorStop(0,    'rgba(255,245,80,1.0)');
            fg.addColorStop(0.35, 'rgba(255,110,0,0.85)');
            fg.addColorStop(0.7,  'rgba(200,30,0,0.5)');
            fg.addColorStop(1,    'rgba(140,10,0,0)');
            ctx.fillStyle = fg;
            ctx.beginPath(); ctx.arc(fx, fy, fSize, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }
        // Clignotement rouge sur la coque
        var flicker = Math.max(0, 0.06 + Math.abs(Math.sin(t * 9.0)) * 0.10);
        ctx.save(); ctx.globalAlpha = flicker;
        ctx.fillStyle = '#ff1800';
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }
};

// ---------------------------------------------------------------------------
//  DRAW AÃ‰RIEN
// ---------------------------------------------------------------------------

RTS.Game.Squad.prototype._drawAerial = function(ctx,col) {
    var x=this.x, y=this.y-this.altitude, t=this.type;

    ctx.save(); ctx.strokeStyle='rgba(0,0,0,0.18)'; ctx.lineWidth=1; ctx.setLineDash([3,4]);
    ctx.beginPath(); ctx.moveTo(this.x,this.y); ctx.lineTo(x,y); ctx.stroke(); ctx.setLineDash([]); ctx.restore();

    ctx.save(); ctx.translate(x,y); ctx.rotate(this._angle+Math.PI/2);

    if (t==='heli_transport'||t==='heli_attack') {
        var aw=t==='heli_attack'?14:12, ah=t==='heli_attack'?28:24;
        ctx.fillStyle=t==='heli_attack'?col.dark:col.base;
        ctx.beginPath(); ctx.ellipse(0,0,aw/2,ah/2,0,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle=col.accent; ctx.lineWidth=1.5; ctx.stroke();
        ctx.save(); ctx.rotate(this._rotorAnim);
        var rl=t==='heli_attack'?21:18;
        ctx.strokeStyle='rgba(220,220,220,0.75)'; ctx.lineWidth=2.5;
        ctx.beginPath(); ctx.moveTo(-rl,0); ctx.lineTo(rl,0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0,-rl); ctx.lineTo(0,rl); ctx.stroke();
        ctx.restore();
        ctx.save(); ctx.translate(0,ah/2+3); ctx.rotate(this._rotorAnim*2.5);
        ctx.strokeStyle='rgba(200,200,200,0.55)'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.moveTo(-7,0); ctx.lineTo(7,0); ctx.stroke(); ctx.restore();
        if (t==='heli_attack') {
            ctx.fillStyle='#111'; ctx.fillRect(-2,-ah/2-11,4,13);
        }
    } else if (t==='airstrike'||t==='p47_thunderbolt'||t==='fw190') {
        // Corps d'avion (silhouette plus dÃ©taillÃ©e pour les nouvelles unitÃ©s)
        var planeCol = t==='fw190' ? '#553300' : col.base;
        ctx.fillStyle=planeCol;
        ctx.beginPath();
        ctx.moveTo(0,-22); ctx.lineTo(4,8); ctx.lineTo(0,6); ctx.lineTo(-4,8); ctx.closePath();
        ctx.fill(); ctx.strokeStyle=col.accent; ctx.lineWidth=1; ctx.stroke();
        // Ailes
        ctx.fillStyle=t==='fw190'?'#3a2200':col.dark;
        var ws = t==='p47_thunderbolt' ? 26 : 22;
        ctx.beginPath(); ctx.moveTo(0,-2);ctx.lineTo(ws,12);ctx.lineTo(ws-8,12);ctx.lineTo(0,3);ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(0,-2);ctx.lineTo(-ws,12);ctx.lineTo(-ws+8,12);ctx.lineTo(0,3);ctx.closePath(); ctx.fill();
        // Stabilisateurs
        ctx.beginPath(); ctx.moveTo(0,6);ctx.lineTo(7,14);ctx.lineTo(-7,14);ctx.closePath();
        ctx.fillStyle=col.dark; ctx.fill();
        // TraÃ®nÃ©e
        ctx.save(); ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.lineWidth=2;
        ctx.beginPath();ctx.moveTo(-3,8);ctx.lineTo(-3,32);ctx.stroke();
        ctx.beginPath();ctx.moveTo(3,8);ctx.lineTo(3,32);ctx.stroke(); ctx.restore();
    }

    ctx.restore();
    this._drawLabel(ctx,col,x,y);
};

// ---------------------------------------------------------------------------
//  LABEL
// ---------------------------------------------------------------------------

RTS.Game.Squad.prototype._drawLabel = function(ctx,col,x,y) {
    var L={
        rifle:'RIFLE', mg:'MG', sniper:'SNI', pioneer:'PION',
        assault:'ASLT', at_inf:'AT', mortar:'MORT', medic:'MED',
        jeep:'JEEP', halftrack:'HT', recon_car:'REC', anti_inf_car:'AIC',
        sherman:'M4', panzer:'PZ', tank_destroyer:'TD', heavy_tank:'HVY',
        artillery_truck:'ART',
        heli_transport:'HT-TR', heli_attack:'HT-AT', airstrike:'AIR',
        // Nouvelles unitÃ©s
        flamethrower:'FLAME', paratrooper:'PARA', officer:'OFF',
        m10_wolverine:'M10', p47_thunderbolt:'P-47',
        panzergrenadier:'PzGr', sturmtruppen:'STRM',
        tiger:'TIGER', stug:'STUG', fw190:'FW190',
        // Nouvelles alliÃ©es
        ranger:'RGR', combat_engineer:'ENG', commando:'CDO',
        aa_halftrack:'AA-HT', bofors:'BOFR',
        m7_priest:'M7', calliope:'CALL',
        at_gun:'57mm', gun_17pdr:'17PDR',
        // Nouvelles axis
        flak88:'FL88', nebelwerfer:'NBEL', fallschirmjager:'FJ',
        jagdpanther:'JgPz', me262:'Me262'
    };
    var lbl=L[this.type]||this.type.substring(0,4).toUpperCase();
    ctx.fillStyle='rgba(0,0,0,0.65)'; ctx.fillRect(x-13,y-7,26,13);
    ctx.fillStyle=col.accent; ctx.font='bold 8px "Courier New"';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(lbl,x,y);
};

// ---------------------------------------------------------------------------
//  FX RENDER
// ---------------------------------------------------------------------------

RTS.Game.Squad.prototype._drawSmoke = function(ctx) {
    for (var i=0;i<this._smokeParticles.length;i++) {
        var sp=this._smokeParticles[i];
        var alpha=(sp.life/sp.maxLife)*0.55;
        ctx.save();
        ctx.globalAlpha=alpha;
        ctx.fillStyle='rgba(180,180,180,0.8)';
        ctx.beginPath(); ctx.arc(sp.x,sp.y,sp.r,0,Math.PI*2); ctx.fill();
        ctx.restore();
    }
};

RTS.Game.Squad.prototype._drawExplosions = function(ctx) {
    for (var i=0;i<this._explosions.length;i++) {
        var ex=this._explosions[i];
        var alpha=Math.min(1,ex.life*3);
        ctx.save();
        // Flash blanc
        ctx.globalAlpha=alpha*0.6;
        ctx.fillStyle='#ffffff';
        ctx.beginPath(); ctx.arc(ex.x,ex.y,ex.r*0.3,0,Math.PI*2); ctx.fill();
        // Boule de feu
        ctx.globalAlpha=alpha*0.8;
        var grad=ctx.createRadialGradient(ex.x,ex.y,0,ex.x,ex.y,ex.r);
        grad.addColorStop(0,'rgba(255,240,100,0.9)');
        grad.addColorStop(0.4,'rgba(255,120,0,0.7)');
        grad.addColorStop(1,'rgba(100,50,0,0)');
        ctx.fillStyle=grad;
        ctx.beginPath(); ctx.arc(ex.x,ex.y,ex.r,0,Math.PI*2); ctx.fill();
        ctx.restore();
    }
};

RTS.Game.Squad.prototype._drawTracers = function(ctx,col) {
    for (var i=0;i<this._tracers.length;i++) {
        var t=this._tracers[i], a=Math.min(1,t.life*10);
        ctx.save(); ctx.globalAlpha=a;
        if (t.isGrenade) {
            ctx.strokeStyle='#ffaa00'; ctx.lineWidth=2.5; ctx.setLineDash([4,4]);
        } else {
            ctx.strokeStyle=col.tracer; ctx.lineWidth=1.5;
            ctx.shadowColor=col.tracer; ctx.shadowBlur=5;
        }
        ctx.beginPath(); ctx.moveTo(t.x1,t.y1); ctx.lineTo(t.x2,t.y2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
    }
};

RTS.Game.Squad.prototype._drawMuzzleFlashes = function(ctx,col) {
    for (var i=0;i<this._muzzleFlashes.length;i++) {
        var f=this._muzzleFlashes[i], a=Math.min(1,f.life*14);
        ctx.save(); ctx.globalAlpha=a;
        ctx.translate(f.x,f.y); ctx.rotate(f.angle);
        ctx.beginPath(); ctx.arc(0,0,4,0,Math.PI*2);
        ctx.fillStyle='#fff'; ctx.shadowColor='#ffdd88'; ctx.shadowBlur=10; ctx.fill();
        ctx.beginPath(); ctx.moveTo(0,0);ctx.lineTo(10,-3);ctx.lineTo(16,0);ctx.lineTo(10,3);ctx.closePath();
        ctx.fillStyle='#ffcc44'; ctx.shadowBlur=6; ctx.fill();
        ctx.restore();
    }
};

RTS.Game.Squad.prototype._drawHitSparks = function(ctx) {
    for (var i=0;i<this._hitSparks.length;i++) {
        var s=this._hitSparks[i], a=Math.min(1,s.life*7);
        ctx.save(); ctx.globalAlpha=a;
        ctx.strokeStyle='#ffaa44'; ctx.lineWidth=1.5; ctx.shadowColor='#ff6600'; ctx.shadowBlur=6;
        var seed=(s.x*.1+s.y*.07)%(Math.PI*2);
        for (var j=0;j<5;j++){
            var ang=seed+j*1.26,len=4+(j%3)*3;
            ctx.beginPath(); ctx.moveTo(s.x,s.y);
            ctx.lineTo(s.x+Math.cos(ang)*len,s.y+Math.sin(ang)*len); ctx.stroke();
        }
        ctx.restore();
    }
};

RTS.Game.Squad.prototype._drawHealthBar = function(ctx,col) {
    var r=this._totalHP()/this._maxTotalHP();
    var bw=Math.max(40,this.radius*2.2), bh=this.isVehicle?5:4;
    var bx=this.x-bw/2, by=this.y-this.altitude-this.radius-14;
    ctx.fillStyle='rgba(0,0,0,0.75)'; ctx.fillRect(bx-1,by-1,bw+2,bh+2);
    ctx.fillStyle=r>0.5?'#44ff44':r>0.25?'#ffaa00':'#ff2222'; ctx.fillRect(bx,by,bw*r,bh);
    ctx.strokeStyle=col.accent; ctx.lineWidth=0.5; ctx.strokeRect(bx,by,bw,bh);
    ctx.fillStyle=col.accent; ctx.font='8px "Courier New"';
    ctx.textAlign='center'; ctx.textBaseline='bottom';
    if (this.isVehicle) {
        // Véhicules : afficher HP numérique + indicateur armure
        var hp=Math.ceil(this._totalHP()), maxHp=this._maxTotalHP();
        var armorTag = this.armorType==='heavy' ? ' [H]' : this.armorType==='light' ? ' [L]' : '';
        ctx.fillText(hp+'/'+maxHp+armorTag, this.x, by-1);
    } else {
        var alive=this._aliveSoldiers().length;
        ctx.fillText(alive+'/'+this.maxSoldiers, this.x, by-1);
    }
};