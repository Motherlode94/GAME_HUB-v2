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

    if (this.type === 'airstrike') this._lifeTimer = 10;
    if (this.type === 'artillery_truck') this._lifeTimer = 0;

    // ── ABILITIES ──────────────────────────────────────────────────────────
    // Chaque ability : { cooldown, timer, active, duration, durationLeft }
    this.abilities = this._buildAbilities(s.abilities || []);

    // États spéciaux
    this._smokeActive   = false;
    this._smokeTimer    = 0;
    this._setupTimer    = 0;     // mortier : délai avant tir
    this._isSetup       = false;
    this._healTimer     = 0;
    this._artilleryTimer= 0;
};

// ---------------------------------------------------------------------------
//  STATS — toutes les unités
// ---------------------------------------------------------------------------

RTS.Game.Squad.STATS = {
    // ── INFANTERIE DE BASE ─────────────────────────────────────────────────
    rifle:    { count:4, speed:85,  radius:26, vision:210, attackRange:160, damage:8,  fireRate:1.2, captureSpeed:1.0, armorType:'none', role:'infantry',
                abilities:['grenade','focus_fire'] },
    mg:       { count:3, speed:55,  radius:28, vision:250, attackRange:230, damage:14, fireRate:2.8, captureSpeed:0.5, armorType:'none', role:'support',
                abilities:['suppression_fire'] },
    sniper:   { count:2, speed:65,  radius:22, vision:360, attackRange:380, damage:40, fireRate:0.35,captureSpeed:0.3, armorType:'none', role:'sniper',
                abilities:['focus_fire'] },
    pioneer:  { count:4, speed:75,  radius:26, vision:200, attackRange:120, damage:6,  fireRate:1.0, captureSpeed:1.5, armorType:'none', role:'engineer',
                abilities:['smoke'] },

    // ── INFANTERIE SPÉCIALISÉE ─────────────────────────────────────────────
    assault:  { count:4, speed:100, radius:26, vision:190, attackRange:110, damage:18, fireRate:2.2, captureSpeed:0.8, armorType:'none', role:'assault',
                abilities:['grenade','smoke','focus_fire'] },
    at_inf:   { count:3, speed:70,  radius:26, vision:200, attackRange:200, damage:90, fireRate:0.3, captureSpeed:0.5, armorType:'none', role:'anti_tank',
                abilities:['rocket_barrage'] },
    mortar:   { count:3, speed:60,  radius:28, vision:180, attackRange:320, damage:55, fireRate:0.25,captureSpeed:0.3, armorType:'none', role:'artillery',
                abilities:['barrage'] },
    medic:    { count:3, speed:80,  radius:24, vision:220, attackRange:80,  damage:2,  fireRate:0.5, captureSpeed:0.5, armorType:'none', role:'medic',
                abilities:['heal'] },

    // ── VÉHICULES LÉGERS ───────────────────────────────────────────────────
    jeep:         { count:1, speed:160, radius:18, vision:310, attackRange:170, damage:10, fireRate:1.5, captureSpeed:0.0, armorType:'light', role:'recon', vehicle:true,
                    abilities:['focus_fire'] },
    halftrack:    { count:1, speed:120, radius:24, vision:220, attackRange:200, damage:18, fireRate:1.8, captureSpeed:0.0, armorType:'light', role:'support', vehicle:true,
                    abilities:['suppression_fire'] },
    recon_car:    { count:1, speed:190, radius:16, vision:380, attackRange:120, damage:6,  fireRate:1.0, captureSpeed:0.0, armorType:'light', role:'recon', vehicle:true,
                    abilities:['smoke'] },
    anti_inf_car: { count:1, speed:130, radius:20, vision:230, attackRange:190, damage:22, fireRate:2.5, captureSpeed:0.0, armorType:'light', role:'anti_inf', vehicle:true,
                    abilities:['suppression_fire'] },

    // ── BLINDÉS ───────────────────────────────────────────────────────────
    sherman:      { count:1, speed:90,  radius:30, vision:220, attackRange:260, damage:65, fireRate:0.45,captureSpeed:0.0, armorType:'heavy', role:'tank', vehicle:true,
                    abilities:['focus_fire'] },
    panzer:       { count:1, speed:85,  radius:32, vision:230, attackRange:280, damage:75, fireRate:0.4, captureSpeed:0.0, armorType:'heavy', role:'tank', vehicle:true,
                    abilities:['focus_fire'] },
    tank_destroyer:{ count:1,speed:75,  radius:30, vision:270, attackRange:350, damage:110,fireRate:0.35,captureSpeed:0.0, armorType:'heavy', role:'tank_destroyer', vehicle:true,
                    abilities:['focus_fire'] },
    heavy_tank:   { count:1, speed:55,  radius:36, vision:200, attackRange:240, damage:95, fireRate:0.3, captureSpeed:0.0, armorType:'heavy', role:'heavy_tank', vehicle:true,
                    abilities:['barrage'] },

    // ── SUPPORT ───────────────────────────────────────────────────────────
    artillery_truck:{ count:1,speed:70, radius:26, vision:200, attackRange:600, damage:80, fireRate:0.15,captureSpeed:0.0, armorType:'light', role:'artillery', vehicle:true,
                    abilities:['barrage'] },

    // ── AÉRIENS ───────────────────────────────────────────────────────────
    heli_transport:{ count:1, speed:180, radius:28, vision:310, attackRange:0,   damage:0,  fireRate:0,   captureSpeed:0.0, aerial:true, altitude:55, role:'transport',
                    abilities:[] },
    heli_attack:   { count:1, speed:150, radius:28, vision:340, attackRange:290, damage:40, fireRate:0.8, captureSpeed:0.0, aerial:true, altitude:55, role:'gunship',
                    abilities:['rocket_barrage'] },
    airstrike:     { count:1, speed:420, radius:18, vision:380, attackRange:220, damage:130,fireRate:0.6, captureSpeed:0.0, aerial:true, altitude:110, role:'airstrike',
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
    airstrike:9999
};

// Bonus dégâts selon rôle vs type de cible
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
    grenade:          { label:'Grenade',      key:'G', icon:'💥', cooldown:15, duration:0,   description:'Explosion AOE courte portée' },
    smoke:            { label:'Fumigène',     key:'S', icon:'🌫', cooldown:20, duration:8,   description:'Écran de fumée, bloque la vision' },
    focus_fire:       { label:'Tir concentré',key:'F', icon:'🎯', cooldown:12, duration:5,   description:'+40% précision, suppression bonus' },
    suppression_fire: { label:'Suppression',  key:'U', icon:'🔥', cooldown:18, duration:6,   description:'Supprime les unités ennemies' },
    rocket_barrage:   { label:'Roquettes',    key:'R', icon:'🚀', cooldown:30, duration:3,   description:'Barrage de roquettes AOE' },
    barrage:          { label:'Barrage',      key:'B', icon:'💣', cooldown:45, duration:4,   description:'Tir indirect longue portée' },
    heal:             { label:'Soins',        key:'H', icon:'➕', cooldown:25, duration:8,   description:'Régénère les soldats alliés proches' }
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
//  ACTIVATE ABILITY (appelé depuis UI ou IA)
// ---------------------------------------------------------------------------

RTS.Game.Squad.prototype.activateAbility = function(id, allSquads, targetX, targetY) {
    var ab = this.abilities[id];
    if (!ab || ab.timer > 0) return false;
    var def = RTS.Game.Squad.ABILITY_DEFS[id];
    ab.timer = def.cooldown;
    ab.active = true;
    ab.durationLeft = def.duration;

    if (id === 'grenade')         this._doGrenade(targetX || this.x + 60, targetY || this.y);
    if (id === 'smoke')           this._smokeActive = true;
    if (id === 'rocket_barrage')  this._doRocketBarrage(allSquads);
    if (id === 'barrage')         this._doBarrage(allSquads);
    if (id === 'heal')            this._healActive = true;
    return true;
};

RTS.Game.Squad.prototype._doGrenade = function(tx, ty) {
    var self = this;
    // Explosion AOE après 1.2s
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
                // Dégâts
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

// ---------------------------------------------------------------------------
//  UPDATE
// ---------------------------------------------------------------------------

RTS.Game.Squad.prototype.update = function(dt, allSquads) {
    if (this.dead) return;
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
                if (id === 'smoke')  self._smokeActive = false;
                if (id === 'heal')   self._healActive  = false;
            }
        }
    });

    if (this.type === 'airstrike') {
        this._lifeTimer -= dt;
        if (this._lifeTimer <= 0) { this.dead = true; return; }
    }

    // Fumigènes : particules
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

    // Fumée : particules decay
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

    if (this._aliveSoldiers().length === 0) { this.dead=true; this.inCombat=false; this.target=null; return; }

    // IA auto-abilities
    this._autoAbilities(dt, allSquads);

    if (allSquads) this._updateCombat(dt, allSquads);
    if (!this.inCombat) this._move(dt);
};

// ---------------------------------------------------------------------------
//  IA AUTO-ABILITIES (déclenchement situationnel)
// ---------------------------------------------------------------------------

RTS.Game.Squad.prototype._autoAbilities = function(dt, allSquads) {
    if (!allSquads || !this.target || !this.target.dead === false) return;
    var self = this;
    var tgt  = this.target;
    if (!tgt) return;

    // Medic : heal si alliés proches blessés
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

    // AT Infantry : rocket barrage si cible est un véhicule
    if (this.role === 'anti_tank' && this.abilities.rocket_barrage && this.abilities.rocket_barrage.timer <= 0) {
        if (tgt && tgt.isVehicle && !tgt.dead) this.activateAbility('rocket_barrage', allSquads);
    }

    // Mortar / Artillery : barrage si plusieurs ennemis groupés
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

    if (this.target && this.inCombat && this._fireTimer >= this._fireInterval) {
        this._fireTimer = 0;
        this._shoot(this.target);
    }
};

RTS.Game.Squad.prototype._findTarget = function(all) {
    var self=this, best=null, bestD=Infinity;
    all.forEach(function(sq) {
        if (sq.team===self.team||sq.dead) return;
        if (sq.isAerial && self.type!=='mg' && self.type!=='sniper' && self.type!=='heli_attack') return;
        // AT infantry prioritise les véhicules
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
    var self=this;
    var alive=this._aliveSoldiers(), tAlive=tgt._aliveSoldiers();
    if (!alive.length||!tAlive.length) return;

    var focusBonus  = (this.abilities.focus_fire  && this.abilities.focus_fire.active)  ? 1.4 : 1.0;
    var suppBonus   = (this.abilities.suppression_fire && this.abilities.suppression_fire.active) ? 1.6 : 1.0;
    var dmgModifier = RTS.Game.Squad.DAMAGE_MODIFIER(this.role, tgt.armorType || 'none');

    alive.forEach(function(sol) {
        var ts=tAlive[Math.floor(Math.random()*tAlive.length)];
        var sx=self.x+sol.ox, sy=self.y+sol.oy-self.altitude;
        var tx=tgt.x+ts.ox,   ty=tgt.y+ts.oy-tgt.altitude;
        var baseAcc = self.type==='sniper'?0.88 : self.isVehicle?0.65 : 0.55;
        var hit = Math.random() < Math.min(0.97, baseAcc * focusBonus);

        self._muzzleFlashes.push({x:sx,y:sy,angle:Math.atan2(ty-sy,tx-sx),life:0.09});
        self._tracers.push({x1:sx,y1:sy,
            x2:hit?tx:tx+(Math.random()-.5)*50,
            y2:hit?ty:ty+(Math.random()-.5)*50, life:0.13});

        if (hit) {
            var finalDmg = self.damage * dmgModifier * focusBonus;
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
    this.x+=(dx/d)*this.speed*dt;
    this.y+=(dy/d)*this.speed*dt;
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
    if (this.dead&&!this._tracers.length&&!this._muzzleFlashes.length&&!this._hitSparks.length&&!this._explosions.length) return;
    ctx.save();
    var col=RTS.Game.Squad.COLORS[this.team]||RTS.Game.Squad.COLORS.allied;

    // Fumée
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

    // Anneau sélection
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

    // Ombre sol aériens
    if (this.isAerial&&!this.dead) {
        ctx.save(); ctx.globalAlpha=0.22;
        ctx.fillStyle='#000';
        ctx.beginPath(); ctx.ellipse(this.x,this.y,this.radius*0.8,this.radius*0.35,0,0,Math.PI*2); ctx.fill();
        ctx.restore();
    }

    if      (this.isAerial)  this._drawAerial(ctx,col);
    else if (this.isVehicle) this._drawVehicle(ctx,col);
    else                     this._drawInfantry(ctx,col);

    this._drawMuzzleFlashes(ctx,col);
    this._drawHitSparks(ctx);
    if (!this.dead&&(this.inCombat||this.selected)) this._drawHealthBar(ctx,col);

    // Icône heal actif
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
    // Couleur de glow selon rôle
    var roleColors = {
        assault:'rgba(255,120,0,0.22)', anti_tank:'rgba(255,50,50,0.22)',
        artillery:'rgba(255,200,0,0.22)', medic:'rgba(0,255,120,0.22)',
        engineer:'rgba(200,180,100,0.22)'
    };
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

    // Couleur selon rôle
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
//  DRAW VÉHICULE
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

    } else if (t==='sherman'||t==='panzer'||t==='tank_destroyer'||t==='heavy_tank') {
        var configs = {
            sherman:         { w:11, h:20, bodyColor:col.dark,   trackColor:'#111', turretR:8,  barrelLen:12 },
            panzer:          { w:13, h:22, bodyColor:'#4a3a1a',   trackColor:'#111', turretR:9,  barrelLen:14 },
            tank_destroyer:  { w:11, h:20, bodyColor:'#3a2a0a',   trackColor:'#111', turretR:7,  barrelLen:20, noTurret:true },
            heavy_tank:      { w:15, h:26, bodyColor:'#1a2a4a',   trackColor:'#111', turretR:11, barrelLen:10 }
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
            ctx.fillStyle=t==='panzer'?'#3d3010':t==='heavy_tank'?'#0d1a3a':'#1a3380';
            ctx.beginPath(); ctx.arc(0,0,c.turretR,0,Math.PI*2); ctx.fill();
            ctx.strokeStyle=col.accent; ctx.lineWidth=1; ctx.stroke();
        }
        ctx.fillStyle='#111'; ctx.fillRect(-2,-c.h-c.barrelLen,4,c.h*0.5+c.barrelLen);
        ctx.strokeStyle=col.accent; ctx.lineWidth=1.5; ctx.strokeRect(-c.w,-c.h,c.w*2,c.h*2);
    }

    if (this.selected) {
        ctx.beginPath(); ctx.arc(0,0,this.radius+6,0,Math.PI*2);
        ctx.setLineDash([6,4]); ctx.strokeStyle='rgba(255,255,255,0.85)'; ctx.lineWidth=1.5; ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.restore();
    this._drawLabel(ctx,col,x,y);
};

// ---------------------------------------------------------------------------
//  DRAW AÉRIEN
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
    } else if (t==='airstrike') {
        ctx.fillStyle=col.base;
        ctx.beginPath();
        ctx.moveTo(0,-20); ctx.lineTo(4,6); ctx.lineTo(0,4); ctx.lineTo(-4,6); ctx.closePath();
        ctx.fill(); ctx.strokeStyle=col.accent; ctx.lineWidth=1; ctx.stroke();
        ctx.fillStyle=col.dark;
        ctx.beginPath(); ctx.moveTo(0,-4);ctx.lineTo(22,10);ctx.lineTo(14,10);ctx.lineTo(0,1);ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(0,-4);ctx.lineTo(-22,10);ctx.lineTo(-14,10);ctx.lineTo(0,1);ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(0,4);ctx.lineTo(6,12);ctx.lineTo(-6,12);ctx.closePath();
        ctx.fillStyle=col.dark; ctx.fill();
        ctx.save(); ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=2;
        ctx.beginPath();ctx.moveTo(-4,6);ctx.lineTo(-4,30);ctx.stroke();
        ctx.beginPath();ctx.moveTo(4,6);ctx.lineTo(4,30);ctx.stroke(); ctx.restore();
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
        heli_transport:'HT-TR', heli_attack:'HT-AT', airstrike:'AIR'
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
    var alive=this._aliveSoldiers().length, total=this.maxSoldiers;
    var r=this._totalHP()/this._maxTotalHP();
    var bw=Math.max(40,this.radius*2.2), bh=4;
    var bx=this.x-bw/2, by=this.y-this.altitude-this.radius-14;
    ctx.fillStyle='rgba(0,0,0,0.75)'; ctx.fillRect(bx-1,by-1,bw+2,bh+2);
    ctx.fillStyle=r>0.5?'#44ff44':r>0.25?'#ffaa00':'#ff2222'; ctx.fillRect(bx,by,bw*r,bh);
    ctx.strokeStyle=col.accent; ctx.lineWidth=0.5; ctx.strokeRect(bx,by,bw,bh);
    ctx.fillStyle=col.accent; ctx.font='8px "Courier New"';
    ctx.textAlign='center'; ctx.textBaseline='bottom';
    ctx.fillText(alive+'/'+total,this.x,by-1);
};