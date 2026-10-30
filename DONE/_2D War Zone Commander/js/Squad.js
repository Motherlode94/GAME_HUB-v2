window.RTS = window.RTS || {};

/**
 * RTS.Squad — entité principale sélectionnable/déplaçable.
 *
 * Un Squad contient N membres (objets légers avec position, HP).
 * Le squad a une position "pivot" (centre de formation).
 * Chaque membre est positionné relativement au pivot via une formation.
 */

let _squadId = 0;

RTS.Squad = function(x, y, team, typeName, memberCount) {
    this.id       = _squadId++;
    this.x        = x;
    this.y        = y;
    this.team     = team;
    this.typeName = typeName;

    // Toujours initialiser members en premier pour éviter tout crash
    // si le def est inconnu et que le constructeur sort tôt.
    this.members = [];

    var def = RTS.SquadDefs[typeName];
    if (!def) {
        console.error("[Squad] SquadDef inconnu :", typeName,
            "— types valides :", Object.keys(RTS.SquadDefs).join(", "));
        return;
    }

    this.def      = def;
    this.label    = def.label;
    this.selected = false;
    this.target   = null;
    this.speed    = def.speed;
    // Vehicle orientation and mobility are tracked per unit, not shared in SquadDefs.
    this.heading  = 0;
    this.engineDamage = 0;
    this.rotorDamage = 0; // Air units: propulsion degradation separate from land engines.

    // Combat
    this.attackRange = def.attackRange;
    this.attackTimer = 0;
    this.burstQueue  = [];

    // Membres
    var count = memberCount || def.defaultCount;
    for (var i = 0; i < count; i++) {
        this.members.push(RTS.Squad._createMember(def, i));
    }

    // Upgrade
    this.upgradeLevel = 1;
    this.maxMembers   = def.maxCount || count;

    // Flash hit
    this.flashTimer = 0;

    // Worker / Engineer state
    this.harvestTarget = null;
    this.carrying      = { type: null, amount: 0 };
    this.returning     = false;
    this.repairTarget  = null;
};

RTS.Squad._createMember = function(def, index) {
    return {
        offsetX: 0,
        offsetY: 0,
        x: 0,
        y: 0,

        hp:     def.memberHp,
        maxHp:  def.memberHp,
        dead:   false,
        flashTimer: 0,

        fireTimer:   0,
        fireAngle:   0,
        muzzleFlash: 0
    };
};

// Hitbox du squad
RTS.Squad.prototype.getBounds = function() {
    var s      = this.def ? this.def.memberSize  : 16;
    var spread = this.def ? (this.def.formationSpread || 20) : 20;
    var cols   = Math.ceil(Math.sqrt(this.members.length));
    var w      = cols * spread + s;
    var h      = cols * spread + s;
    return { x: this.x - w/2, y: this.y - h/2, w: w, h: h };
};

// HP total
RTS.Squad.prototype.getTotalHp = function() {
    var total = 0;
    this.members.forEach(function(m) { if (!m.dead) total += m.hp; });
    return total;
};

RTS.Squad.prototype.getMaxHp = function() {
    var memberHp = this.def ? this.def.memberHp : 1;
    return this.members.length * memberHp;
};

// Inflige des dégâts au membre le plus proche d'un point
RTS.Squad.prototype.takeDamage = function(damage, fromX, fromY, particles) {
    var best = null, bestD = Infinity;
    this.members.forEach(function(m) {
        if (m.dead) return;
        var dx = m.x - (fromX || 0);
        var dy = m.y - (fromY || 0);
        var d  = Math.sqrt(dx*dx + dy*dy);
        if (d < bestD) { bestD = d; best = m; }
    });
    if (!best) return;

    // Directional armour: front absorbs more, rear is vulnerable.
    if (this.def.category === 'vehicle') {
        var angle = Math.atan2(fromY - this.y, fromX - this.x);
        var relative = Math.atan2(Math.sin(angle - this.heading), Math.cos(angle - this.heading));
        var arc = Math.abs(relative);
        damage *= arc < Math.PI / 4 ? 0.60 : arc > 3 * Math.PI / 4 ? 1.35 : 0.88;
        // Repeated penetrating hits can damage the engine, reducing mobility.
        if (damage >= this.def.memberHp * 0.18) {
            this.engineDamage = Math.min(0.65, this.engineDamage + 0.07);
        }
    }
    if (this.def.category === "air") {
        // Aircraft are not tanks: no directional armour multiplier.
        // Significant hits may damage the rotor/drive system and restrict flight.
        if (damage >= this.def.memberHp * 0.12) {
            this.rotorDamage = Math.min(0.75, (this.rotorDamage || 0) + 0.09);
        }
    }
    best.hp -= damage;
    best.flashTimer = 0.08;

    if (best.hp <= 0) {
        best.hp   = 0;
        best.dead = true;
        if (particles) {
            RTS.ParticleSystem.spawnDeath(particles, best.x, best.y, this.team);
        }
    }
};

// AoE
RTS.Squad.prototype.takeSplashDamage = function(damage, cx, cy, radius, particles) {
    var self = this;
    this.members.forEach(function(m) {
        if (m.dead) return;
        var dx = m.x - cx;
        var dy = m.y - cy;
        var d  = Math.sqrt(dx*dx + dy*dy);
        if (d < radius) {
            var falloff = 1 - d / radius;
            m.hp -= damage * falloff;
            m.flashTimer = 0.08;
            if (m.hp <= 0) {
                m.hp   = 0;
                m.dead = true;
                if (particles) {
                    RTS.ParticleSystem.spawnDeath(particles, m.x, m.y, self.team);
                }
            }
        }
    });
};

// true si tous les membres sont morts (ou si le squad est invalide)
RTS.Squad.prototype.isDead = function() {
    if (!this.members || this.members.length === 0) return true;
    return this.members.every(function(m) { return m.dead; });
};

// Membres vivants
RTS.Squad.prototype.aliveMembers = function() {
    if (!this.members) return [];
    return this.members.filter(function(m) { return !m.dead; });
};