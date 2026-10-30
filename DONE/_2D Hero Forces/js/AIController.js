var RTS = RTS || {};
RTS.Game = RTS.Game || {};

/**
 * AIController - Strategic Axis AI (3 gameplay phases).
 */
RTS.Game.AIController = function(navGrid, buildings, squads, resources, difficultyMultiplier) {
    this.navGrid   = navGrid;
    this.buildings = buildings;
    this.squads    = squads;
    this.resources = resources;
    this.difficultyMultiplier = Math.max(0.6, Math.min(1.5, difficultyMultiplier || 1.0));

    this._gameTime = 0;

    this._thinkTimer    = 8.0;
    this._thinkInterval = 12.0;
    this._spawnTimer    = 0;

    // Cooldown global entre deux tentatives de spawn (évite le spam si _canSpawnReinforcement
    // retourne false puis true dans la même fenêtre d'intervalle).
    this._globalSpawnCooldown     = 0;
    this._globalSpawnCooldownMax  = 12.0; // secondes minimales entre deux spawns effectifs

    this._minGarrison  = 1;
    this._assignedCPs  = {};
};

RTS.Game.AIController.UNIT_COSTS = {
    rifle:           { manpower:240 },
    mg:              { manpower:320 },
    sturmtruppen:    { manpower:360, munitions:20 },
    panzergrenadier: { manpower:420, munitions:25 },
    fallschirmjager: { manpower:520, munitions:40 },
    halftrack:       { manpower:340, fuel:30 },
    stug:            { manpower:620, fuel:85 },
    tiger:           { manpower:900, fuel:150 },
    jagdpanther:     { manpower:950, fuel:140 },
    flak88:          { manpower:620, munitions:70, fuel:45 },
    nebelwerfer:     { manpower:540, munitions:75, fuel:20 },
    fw190:           { munitions:180, fuel:50 },
    me262:           { munitions:240, fuel:70 }
};

// ---------------------------------------------------------------------------
//  PHASE
// ---------------------------------------------------------------------------

RTS.Game.AIController.prototype._getPhase = function() {
    if (this._gameTime < 240) return 1;
    if (this._gameTime < 480) return 2;
    return 3;
};

RTS.Game.AIController.prototype._spawnInterval = function() {
    var p = this._getPhase();
    var base = p === 1 ? 55 : p === 2 ? 38 : 26;
    return Math.max(7, base / this.difficultyMultiplier);
};

// Minimum HQ garrison by phase.
RTS.Game.AIController.prototype._garrisonMin = function() {
    var p = this._getPhase();
    return p === 1 ? 2 : 1;
};

// ---------------------------------------------------------------------------
//  UPDATE
// ---------------------------------------------------------------------------

RTS.Game.AIController.prototype.update = function(dt) {
    this._gameTime   += dt;
    this._thinkTimer += dt;
    this._spawnTimer += dt;
    if (this._globalSpawnCooldown > 0) this._globalSpawnCooldown -= dt;

    this._cleanDeadSquads();

    if (this._spawnTimer >= this._spawnInterval()) {
        this._spawnTimer = 0;
        if (this._globalSpawnCooldown <= 0 && this._canSpawnReinforcement()) {
            this._spawnUnit();
            this._globalSpawnCooldown = this._globalSpawnCooldownMax / this.difficultyMultiplier;
        }
    }

    if (this._thinkTimer >= this._thinkInterval) {
        this._thinkTimer = 0;
        this._think();
    }
};

RTS.Game.AIController.prototype._canSpawnReinforcement = function() {
    var phase      = this._getPhase();
    var axisAlive  = this._countAliveSquads('axis');
    var alliedAlive= this._countAliveSquads('allied');
    var mul        = this.difficultyMultiplier;

    // Anti-snowball: prevent the AI from extending a large lead forever.
    var hardCapBase       = phase === 1 ? 5 : phase === 2 ? 7 : 9;
    var leadAllowanceBase = phase === 1 ? 0 : phase === 2 ? 1 : 2;
    var hardCap           = Math.max(4, Math.round(hardCapBase * mul));
    var leadAllowance     = Math.max(0, Math.round(leadAllowanceBase * mul));

    if (axisAlive >= hardCap) return false;
    if (axisAlive > alliedAlive + leadAllowance) return false;
    return true;
};

RTS.Game.AIController.prototype._countAliveSquads = function(team, type) {
    var n = 0;
    for (var i = 0; i < this.squads.length; i++) {
        var sq = this.squads[i];
        if (sq.dead) continue;
        if (team && sq.team !== team) continue;
        if (type && sq.type !== type) continue;
        n++;
    }
    return n;
};

// ---------------------------------------------------------------------------
//  CLEANUP
// ---------------------------------------------------------------------------

RTS.Game.AIController.prototype._cleanDeadSquads = function() {
    for (var i = this.squads.length - 1; i >= 0; i--) {
        var sq = this.squads[i];
        if (sq.dead && sq._aliveSoldiers().length === 0 &&
            !sq._wreckActive &&
            !sq._muzzleFlashes.length && !sq._tracers.length && !sq._hitSparks.length && !sq._explosions.length)
            this.squads.splice(i, 1);
    }
};

// ---------------------------------------------------------------------------
//  SPAWN
// ---------------------------------------------------------------------------

RTS.Game.AIController.prototype._spawnUnit = function() {
    var hq = this._getAxisHQ();
    if (!hq) return;

    var phase = this._getPhase();
    var pool;

    if (phase === 1) {
        pool = ['rifle', 'rifle', 'rifle', 'rifle', 'mg', 'mg', 'sturmtruppen'];
    } else if (phase === 2) {
        pool = ['panzergrenadier', 'panzergrenadier', 'mg', 'mg', 'halftrack', 'sturmtruppen', 'fallschirmjager'];
    } else {
        pool = ['panzergrenadier', 'mg', 'halftrack', 'stug', 'tiger', 'jagdpanther', 'fallschirmjager', 'flak88', 'nebelwerfer', 'fw190', 'me262'];
    }

    var candidates = [];
    for (var i = 0; i < pool.length; i++) {
        var t = this._resolveSpawnType(pool[i], phase);
        if (!t) continue;
        if (this._isSoftCapped(t)) continue;
        if (this.resources && !this.resources.canAfford(this._getUnitCost(t))) continue;
        candidates.push(t);
    }

    if (!candidates.length) return;

    var type = candidates[Math.floor(Math.random() * candidates.length)];
    if (this.resources && !this.resources.spend(this._getUnitCost(type))) return;

    var jitter = function() { return (Math.random() - 0.5) * 70; };
    var sq = new RTS.Game.Squad(hq.x + jitter(), hq.y + 60 + jitter(), 'axis', type);
    this.squads.push(sq);
    this._assignObjective(sq);
};

RTS.Game.AIController.prototype._resolveSpawnType = function(type, phase) {
    if ((type === 'stug' || type === 'halftrack' || type === 'jagdpanther') &&
        !this._hasBuilding('motor_pool') && !this._hasBuilding('tank_depot')) type = 'mg';

    if (type === 'tiger' && !this._hasBuilding('tank_depot')) type = 'panzergrenadier';

    if ((type === 'heli_attack' || type === 'fw190' || type === 'me262') &&
        !this._hasBuilding('airfield')) type = 'mg';

    if ((type === 'flak88' || type === 'nebelwerfer') && !this._hasBuilding('support')) type = 'panzergrenadier';

    if (type === 'fallschirmjager' && phase < 2) type = 'sturmtruppen';

    return type;
};

RTS.Game.AIController.prototype._isSoftCapped = function(type) {
    var count = this._countAliveSquads('axis', type);

    if (type === 'mg' && count >= 3) return true;
    if (type === 'panzergrenadier' && count >= 3) return true;
    if (type === 'sturmtruppen' && count >= 2) return true;

    if ((type === 'halftrack' || type === 'stug' || type === 'tiger' || type === 'jagdpanther' ||
         type === 'fallschirmjager' || type === 'flak88' || type === 'nebelwerfer' ||
         type === 'fw190' || type === 'me262') && count >= 1) return true;

    return false;
};

RTS.Game.AIController.prototype._getUnitCost = function(type) {
    var base = RTS.Game.AIController.UNIT_COSTS[type] || { manpower:280 };
    var scale = 1 / this.difficultyMultiplier;
    return {
        manpower:  Math.max(0, Math.round((base.manpower  || 0) * scale)),
        munitions: Math.max(0, Math.round((base.munitions || 0) * scale)),
        fuel:      Math.max(0, Math.round((base.fuel      || 0) * scale))
    };
};

RTS.Game.AIController.prototype._getAxisHQ = function() {
    for (var i = 0; i < this.buildings.length; i++)
        if (this.buildings[i].team === 'axis' && this.buildings[i].type === 'hq') return this.buildings[i];
    return null;
};

RTS.Game.AIController.prototype._hasBuilding = function(type) {
    for (var i = 0; i < this.buildings.length; i++)
        if (this.buildings[i].team === 'axis' && this.buildings[i].type === type && this.buildings[i].isBuilt) return true;
    return false;
};

// ---------------------------------------------------------------------------
//  BRAIN
// ---------------------------------------------------------------------------

RTS.Game.AIController.prototype._think = function() {
    var self  = this;
    var phase = this._getPhase();
    this._assignedCPs = {};

    // Count alive Axis squads.
    var axisSquads = this.squads.filter(function(s) { return s.team === 'axis' && !s.dead; });

    // Keep a garrison around HQ.
    var hq = this._getAxisHQ();
    var garrisonCount = 0;
    if (hq) {
        axisSquads.forEach(function(sq) {
            var dx = sq.x - hq.x, dy = sq.y - hq.y;
            if (Math.sqrt(dx * dx + dy * dy) < 150) garrisonCount++;
        });
    }

    axisSquads.forEach(function(sq) {
        if (sq.inCombat) return;
        var isIdle = sq.path.length === 0 || sq.pathIndex >= sq.path.length;
        if (!isIdle) return;

        if (garrisonCount < self._garrisonMin() && hq) {
            var path = self.navGrid.findPath(sq.x, sq.y, hq.x + (Math.random() - 0.5) * 80, hq.y + (Math.random() - 0.5) * 80);
            if (path.length) { sq.path = path; sq.pathIndex = 0; garrisonCount++; return; }
        }

        self._assignObjective(sq, phase);
    });
};

// ---------------------------------------------------------------------------
//  OBJECTIVE ASSIGNMENT
// ---------------------------------------------------------------------------

RTS.Game.AIController.prototype._assignObjective = function(squad, phase) {
    phase = phase || this._getPhase();
    var cps = this.navGrid.capturePoints;
    var hq  = this._getAxisHQ();

    var best = null, bestScore = -Infinity;

    for (var i = 0; i < cps.length; i++) {
        var cp = cps[i];

        // In phase 1, do not push directly into Allied HQ.
        if (phase === 1 && cp.isHQ && cp.owner === 'allied') continue;

        // Penalize crowded objectives without making every point ineligible.
        // Otherwise surplus squads can freeze when all capture points have two assignments.
        var crowding = this._assignedCPs[i] || 0;

        var score = -crowding * 42;

        if      (cp.owner === 'allied')  score += phase === 1 ? 60 : phase === 2 ? 90 : 120;
        else if (cp.owner === 'neutral') score += phase === 1 ? 80 : 60;
        else                             score += 10;

        if (phase >= 2) {
            if (cp.type === 'fuel')      score += 30;
            if (cp.type === 'munitions') score += 25;
        }
        if (cp.type === 'vp') score += 35;

        if (phase === 3 && cp.owner === 'allied') score += 40;
        if (cp.contested) score += 30;

        var dx = squad.x - cp.x, dy = squad.y - cp.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        score -= dist * (phase === 1 ? 0.04 : 0.02);

        if (phase === 1 && hq) {
            var dhx = hq.x - cp.x, dhy = hq.y - cp.y;
            var distHQ = Math.sqrt(dhx * dhx + dhy * dhy);
            score -= distHQ * 0.015;
        }

        if (score > bestScore) { bestScore = score; best = { cp:cp, idx:i }; }
    }

    if (!best) return;
    this._assignedCPs[best.idx] = (this._assignedCPs[best.idx] || 0) + 1;

    var targetX = best.cp.x, targetY = best.cp.y;

    // Flank maneuver from phase 2 onward.
    if (phase >= 2 && best.cp.owner === 'allied' && hq) {
        var flank = this._computeFlankWaypoint(squad, best.cp, hq);
        if (flank) {
            var pathFlank = this.navGrid.findPath(squad.x, squad.y, flank.x, flank.y);
            if (pathFlank.length) {
                var pathFinal = this.navGrid.findPath(flank.x, flank.y, targetX, targetY);
                if (pathFinal.length) {
                    squad.path = pathFlank.concat(pathFinal);
                    squad.pathIndex = 0;
                    return;
                }
            }
        }
    }

    // Direct path with jitter to avoid hard stacking.
    var jx = (Math.random() - 0.5) * 45, jy = (Math.random() - 0.5) * 45;
    var path = this.navGrid.findPath(squad.x, squad.y, targetX + jx, targetY + jy);
    if (!path.length) path = this.navGrid.findPath(squad.x, squad.y, targetX, targetY);
    if (path.length) { squad.path = path; squad.pathIndex = 0; }
};

/**
 * Compute a lateral waypoint to create a flanking movement.
 */
RTS.Game.AIController.prototype._computeFlankWaypoint = function(squad, cp, hq) {
    var dx = cp.x - squad.x, dy = cp.y - squad.y;
    var len = Math.sqrt(dx * dx + dy * dy);
    if (len < 50) return null;

    var perpX = -dy / len, perpY = dx / len;
    var side = (Math.random() < 0.5) ? 1 : -1;
    var offset = 160 + Math.random() * 100;

    var midX = squad.x + dx * 0.45 + perpX * side * offset;
    var midY = squad.y + dy * 0.45 + perpY * side * offset;

    return { x:midX, y:midY };
};