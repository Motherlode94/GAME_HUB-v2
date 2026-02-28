var RTS = RTS || {};
RTS.Game = RTS.Game || {};

/**
 * AIController — IA stratégique Axis (3 phases de jeu).
 *
 * Phase 1 — Consolidation (0-90s) :
 *   Sécuriser les points les plus proches, pas d'attaque directe de la base.
 *   Spawn d'infanterie de base.
 *
 * Phase 2 — Pression (90-240s) :
 *   Capturer les ressources (fuel, munitions), contester les points alliés.
 *   Diversifier les unités (mg, half-track).
 *   Manœuvres en pinces : évite la frontale, cherche les flancs.
 *
 * Phase 3 — Offensive (>240s) :
 *   Attaque coordonnée multi-directions, unités lourdes.
 *   Maintient quand même une garnison défensive.
 *
 * Mécanique de flanc :
 *   Avant d'envoyer vers un point allié, l'IA cherche un waypoint latéral
 *   pour approcher par le côté plutôt que frontalement.
 */
RTS.Game.AIController = function(navGrid, buildings, squads, resources) {
    this.navGrid   = navGrid;
    this.buildings = buildings;
    this.squads    = squads;
    this.resources = resources; // RTS.Game.ResourceManager (Axis)

    this._gameTime = 0;

    this._thinkTimer    = 2.5;
    this._thinkInterval = 5.0;
    this._spawnTimer    = 0;

    // Garnison : au moins N escouades Axis près du HQ
    this._minGarrison = 1;

    // Historique des objectifs pour éviter les embouteillages
    this._assignedCPs = {};  // cpIndex -> nb d'escouades assignées
};

// ---------------------------------------------------------------------------
//  PHASE
// ---------------------------------------------------------------------------

RTS.Game.AIController.prototype._getPhase = function() {
    if (this._gameTime < 90)  return 1;
    if (this._gameTime < 240) return 2;
    return 3;
};

RTS.Game.AIController.prototype._spawnInterval = function() {
    var p = this._getPhase();
    return p === 1 ? 22 : p === 2 ? 16 : 12;
};

// ---------------------------------------------------------------------------
//  UPDATE
// ---------------------------------------------------------------------------

RTS.Game.AIController.prototype.update = function(dt) {
    this._gameTime  += dt;
    this._thinkTimer += dt;
    this._spawnTimer  += dt;

    this._cleanDeadSquads();

    if (this._spawnTimer >= this._spawnInterval()) {
        this._spawnTimer = 0;
        this._spawnUnit();
    }

    if (this._thinkTimer >= this._thinkInterval) {
        this._thinkTimer = 0;
        this._think();
    }
};

// ---------------------------------------------------------------------------
//  NETTOYAGE
// ---------------------------------------------------------------------------

RTS.Game.AIController.prototype._cleanDeadSquads = function() {
    for (var i=this.squads.length-1;i>=0;i--) {
        var sq=this.squads[i];
        if (sq.dead&&sq._aliveSoldiers().length===0&&
            !sq._muzzleFlashes.length&&!sq._tracers.length&&!sq._hitSparks.length)
            this.squads.splice(i,1);
    }
};

// ---------------------------------------------------------------------------
//  SPAWN
// ---------------------------------------------------------------------------

RTS.Game.AIController.prototype._spawnUnit = function() {
    var hq=this._getAxisHQ(); if (!hq) return;
    var phase=this._getPhase();

    // Choix de l'unité selon la phase
    var pool;
    if (phase===1)      pool=['rifle','rifle','rifle','mg'];
    else if (phase===2) pool=['rifle','rifle','mg','mg','halftrack'];
    else                pool=['rifle','mg','mg','halftrack','sherman','heli_attack'];

    var type = pool[Math.floor(Math.random()*pool.length)];

    // Limiter les véhicules lourds si pas de bâtiment
    if ((type==='sherman'||type==='halftrack')&&!this._hasBuilding('motor_pool')&&!this._hasBuilding('tank_depot')) type='mg';
    if (type==='heli_attack'&&!this._hasBuilding('airfield')) type='mg';

    var jitter=function(){return(Math.random()-.5)*70;};
    var sq=new RTS.Game.Squad(hq.x+jitter(),hq.y+60+jitter(),'axis',type);
    this.squads.push(sq);
    this._assignObjective(sq);
};

RTS.Game.AIController.prototype._getAxisHQ = function() {
    for (var i=0;i<this.buildings.length;i++)
        if (this.buildings[i].team==='axis'&&this.buildings[i].type==='hq') return this.buildings[i];
    return null;
};

RTS.Game.AIController.prototype._hasBuilding = function(type) {
    for (var i=0;i<this.buildings.length;i++)
        if (this.buildings[i].team==='axis'&&this.buildings[i].type===type&&this.buildings[i].isBuilt) return true;
    return false;
};

// ---------------------------------------------------------------------------
//  CERVEAU
// ---------------------------------------------------------------------------

RTS.Game.AIController.prototype._think = function() {
    var self  = this;
    var phase = this._getPhase();
    this._assignedCPs = {};

    // Compter les escouades Axis vivantes
    var axisSquads = this.squads.filter(function(s){return s.team==='axis'&&!s.dead;});

    // Maintenir garnison près du HQ
    var hq = this._getAxisHQ();
    var garrisonCount = 0;
    if (hq) {
        axisSquads.forEach(function(sq){
            var dx=sq.x-hq.x, dy=sq.y-hq.y;
            if (Math.sqrt(dx*dx+dy*dy)<150) garrisonCount++;
        });
    }

    axisSquads.forEach(function(sq) {
        if (sq.inCombat) return;
        var isIdle=sq.path.length===0||sq.pathIndex>=sq.path.length;
        if (!isIdle) return;

        // Forcer garnison si sous le minimum
        if (garrisonCount<self._minGarrison&&hq) {
            var path=self.navGrid.findPath(sq.x,sq.y,hq.x+(Math.random()-.5)*80,hq.y+(Math.random()-.5)*80);
            if (path.length){sq.path=path;sq.pathIndex=0;garrisonCount++;return;}
        }

        self._assignObjective(sq, phase);
    });
};

// ---------------------------------------------------------------------------
//  ASSIGNATION D'OBJECTIF
// ---------------------------------------------------------------------------

RTS.Game.AIController.prototype._assignObjective = function(squad, phase) {
    phase = phase || this._getPhase();
    var cps = this.navGrid.capturePoints;
    var hq  = this._getAxisHQ();

    var best=null, bestScore=-Infinity;

    for (var i=0;i<cps.length;i++) {
        var cp=cps[i];

        // Phase 1 : ne jamais attaquer directement la base alliée
        if (phase===1&&cp.isHQ&&cp.owner==='allied') continue;

        // Éviter de concentrer trop d'escouades sur le même point
        var crowding = this._assignedCPs[i]||0;
        if (crowding>=2) continue;

        var score=0;

        // Score de base selon état du point
        if      (cp.owner==='allied')  score += phase===1?60:phase===2?90:120;
        else if (cp.owner==='neutral') score += phase===1?80:60;
        else                           score += 10; // déjà possédé

        // Bonus type de ressource selon phase
        if (phase>=2) {
            if (cp.type==='fuel')      score+=30;
            if (cp.type==='munitions') score+=25;
        }
        if (cp.type==='vp') score+=35;

        // En Phase 3, augmenter la pression sur les points alliés
        if (phase===3&&cp.owner==='allied') score+=40;

        // Contesté = urgent
        if (cp.contested) score+=30;

        // Distance
        var dx=squad.x-cp.x,dy=squad.y-cp.y;
        var dist=Math.sqrt(dx*dx+dy*dy);
        score-=dist*(phase===1?0.04:0.02);

        // Phase 1 : favoriser les points proches du HQ axis
        if (phase===1&&hq) {
            var dhx=hq.x-cp.x,dhy=hq.y-cp.y;
            var distHQ=Math.sqrt(dhx*dhx+dhy*dhy);
            score-=distHQ*0.015;
        }

        if (score>bestScore){bestScore=score;best={cp:cp,idx:i};}
    }

    if (!best) return;
    this._assignedCPs[best.idx]=(this._assignedCPs[best.idx]||0)+1;

    var targetX=best.cp.x, targetY=best.cp.y;

    // MANŒUVRE DE FLANC (phase 2+) :
    // Si le point appartient aux alliés, choisir un waypoint latéral
    if (phase>=2&&best.cp.owner==='allied'&&hq) {
        var flank=this._computeFlankWaypoint(squad, best.cp, hq);
        if (flank) {
            // Aller d'abord au waypoint de flanc, puis à l'objectif
            var pathFlank=this.navGrid.findPath(squad.x,squad.y,flank.x,flank.y);
            if (pathFlank.length) {
                var pathFinal=this.navGrid.findPath(flank.x,flank.y,targetX,targetY);
                if (pathFinal.length) {
                    squad.path=pathFlank.concat(pathFinal);
                    squad.pathIndex=0; return;
                }
            }
        }
    }

    // Chemin direct avec jitter pour éviter le stacking
    var jx=(Math.random()-.5)*45, jy=(Math.random()-.5)*45;
    var path=this.navGrid.findPath(squad.x,squad.y,targetX+jx,targetY+jy);
    if (!path.length) path=this.navGrid.findPath(squad.x,squad.y,targetX,targetY);
    if (path.length){squad.path=path;squad.pathIndex=0;}
};

/**
 * Calcule un point de passage latéral pour une manœuvre de flanc.
 * Perpendiculaire à l'axe squad→cible, décalé de 150-250px.
 */
RTS.Game.AIController.prototype._computeFlankWaypoint = function(squad, cp, hq) {
    // Vecteur squad → cible
    var dx=cp.x-squad.x, dy=cp.y-squad.y;
    var len=Math.sqrt(dx*dx+dy*dy);
    if (len<50) return null;

    // Perpendiculaire
    var perpX=-dy/len, perpY=dx/len;
    // Choisir le côté qui s'éloigne du HQ axis (flanc plus aggressif)
    var side=(Math.random()<0.5)?1:-1;
    var offset=160+Math.random()*100;

    // Point à mi-chemin + offset latéral
    var midX=squad.x+dx*0.45+perpX*side*offset;
    var midY=squad.y+dy*0.45+perpY*side*offset;

    return {x:midX,y:midY};
};