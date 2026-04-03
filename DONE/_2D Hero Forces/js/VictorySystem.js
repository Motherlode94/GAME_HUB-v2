var RTS = RTS || {};
RTS.Game = RTS.Game || {};

/**
 * VictorySystem — Conditions de fin de partie (inspiré CoH).
 *
 * TROIS CONDITIONS DE VICTOIRE (première atteinte gagne) :
 *
 *  1. ANNIHILATION — Détruire le QG ennemi
 *     Le QG n'est pas destructible par défaut, mais si toutes les unités
 *     adverses sont éliminées ET le QG est sous contrôle, victoire immédiate.
 *
 *  2. VICTOIRE PAR POINTS (VP Bleed) — Tenir le Point de Victoire central
 *     Tenir le VP fait saigner les points adverses.
 *     Chaque équipe commence à 500 points. Quand l'adversaire atteint 0 → victoire.
 *     Taux : -1pt/s par point de ressource capturé, -3pt/s pour le VP.
 *
 *  3. DOMINATION — Contrôler 5+ points de capture pendant 60s d'affilée
 *     (difficile à maintenir, mais victoire décisive).
 *
 * Événements émis (callbacks) :
 *   onVictory(winner, condition, stats)
 *   onObjectiveChange(objectives)   → déclenché à chaque changement
 */

RTS.Game.VictorySystem = function(navGrid, squads, buildings, onVictory, onObjectiveChange) {
    this.navGrid    = navGrid;
    this.squads     = squads;
    this.buildings  = buildings;
    this.onVictory          = onVictory          || function(){};
    this.onObjectiveChange  = onObjectiveChange  || function(){};

    // Points de victoire (VP Bleed)
    this.alliedVP = 500;
    this.axisVP   = 500;
    this.maxVP    = 500;

    // Domination : temps de contrôle total des 5+ points
    this._dominationTimer  = { allied: 0, axis: 0 };
    this.dominationRequired = 120;   // secondes

    // Temps de jeu total
    this.gameTime   = 0;

    // Résultat final
    this.over       = false;
    this.winner     = null;
    this.condition  = null;

    // Stats accumulées
    this.stats = {
        allied: { kills:0, cpsCaptured:0, unitsLost:0, peakCPs:0 },
        axis:   { kills:0, cpsCaptured:0, unitsLost:0, peakCPs:0 }
    };

    // Cache état précédent pour détecter les changements
    this._prevCP   = {};
    this._prevAVP  = 500;
    this._prevXVP  = 500;
    this._prevDom  = { allied: 0, axis: 0 };

    // Objectifs mis en cache pour le panneau
    this._objectives = [];
    this._rebuildObjectives();
};

// ---------------------------------------------------------------------------
//  UPDATE — appelé chaque frame
// ---------------------------------------------------------------------------

RTS.Game.VictorySystem.prototype.update = function(dt) {
    if (this.over) return;

    this.gameTime += dt;

    this._updateVPBleed(dt);
    this._updateDomination(dt);
    this._trackStats();
    this._checkVictory();

    // Notifier le panneau si quelque chose a changé
    var changed =
        Math.floor(this.alliedVP) !== Math.floor(this._prevAVP) ||
        Math.floor(this.axisVP)   !== Math.floor(this._prevXVP) ||
        Math.floor(this._dominationTimer.allied) !== Math.floor(this._prevDom.allied) ||
        Math.floor(this._dominationTimer.axis)   !== Math.floor(this._prevDom.axis);

    if (changed) {
        this._prevAVP = this.alliedVP;
        this._prevXVP = this.axisVP;
        this._prevDom.allied = this._dominationTimer.allied;
        this._prevDom.axis   = this._dominationTimer.axis;
        this._rebuildObjectives();
        this.onObjectiveChange(this._objectives);
    }
};

// ---------------------------------------------------------------------------
//  VP BLEED
// ---------------------------------------------------------------------------

RTS.Game.VictorySystem.prototype._updateVPBleed = function(dt) {
    var cps = this.navGrid.capturePoints;
    var alliedBleed = 0, axisBleed = 0;

    cps.forEach(function(cp) {
        if (cp.isHQ) return;
        var rate = cp.type === 'vp' ? 1.2 : 0.35;
        if (cp.owner === 'allied') axisBleed   += rate;
        if (cp.owner === 'axis')   alliedBleed += rate;
    });

    this.alliedVP = Math.max(0, this.alliedVP - alliedBleed * dt);
    this.axisVP   = Math.max(0, this.axisVP   - axisBleed   * dt);
};

// ---------------------------------------------------------------------------
//  DOMINATION
// ---------------------------------------------------------------------------

RTS.Game.VictorySystem.prototype._updateDomination = function(dt) {
    var cps = this.navGrid.capturePoints;
    var alliedCount = 0, axisCount = 0, total = 0;

    cps.forEach(function(cp) {
        if (cp.isHQ) return;
        total++;
        if (cp.owner === 'allied') alliedCount++;
        if (cp.owner === 'axis')   axisCount++;
    });

    var threshold = Math.ceil(total * 0.7);   // 70% des points non-HQ

    if (alliedCount >= threshold) {
        this._dominationTimer.allied += dt;
        this._dominationTimer.axis    = 0;
    } else if (axisCount >= threshold) {
        this._dominationTimer.axis   += dt;
        this._dominationTimer.allied  = 0;
    } else {
        // Décroissance progressive si on perd des points
        this._dominationTimer.allied = Math.max(0, this._dominationTimer.allied - dt * 0.5);
        this._dominationTimer.axis   = Math.max(0, this._dominationTimer.axis   - dt * 0.5);
    }
};

// ---------------------------------------------------------------------------
//  STATS
// ---------------------------------------------------------------------------

RTS.Game.VictorySystem.prototype._trackStats = function() {
    var alliedCPs = 0, axisCPs = 0;
    this.navGrid.capturePoints.forEach(function(cp) {
        if (cp.owner === 'allied') alliedCPs++;
        if (cp.owner === 'axis')   axisCPs++;
    });
    this.stats.allied.peakCPs = Math.max(this.stats.allied.peakCPs, alliedCPs);
    this.stats.axis.peakCPs   = Math.max(this.stats.axis.peakCPs,   axisCPs);
};

RTS.Game.VictorySystem.prototype.recordKill = function(killerTeam) {
    if (killerTeam === 'allied') this.stats.allied.kills++;
    else                         this.stats.axis.kills++;
};

RTS.Game.VictorySystem.prototype.recordCapture = function(team) {
    if (team === 'allied') this.stats.allied.cpsCaptured++;
    else                   this.stats.axis.cpsCaptured++;
};

// ---------------------------------------------------------------------------
//  CHECK VICTORY
// ---------------------------------------------------------------------------

RTS.Game.VictorySystem.prototype._checkVictory = function() {
    // 1 — VP Bleed
    if (this.alliedVP <= 0) { this._triggerVictory('axis',   'vp_bleed'); return; }
    if (this.axisVP   <= 0) { this._triggerVictory('allied', 'vp_bleed'); return; }

    // 2 — Domination
    if (this._dominationTimer.allied >= this.dominationRequired) { this._triggerVictory('allied', 'domination'); return; }
    if (this._dominationTimer.axis   >= this.dominationRequired) { this._triggerVictory('axis',   'domination'); return; }

    // 3 — Annihilation (plus aucune unité + bâtiments ennemis)
    var alliedUnits = this.squads.filter(function(s){ return s.team==='allied'&&!s.dead; }).length;
    var axisUnits   = this.squads.filter(function(s){ return s.team==='axis'  &&!s.dead; }).length;
    var alliedBldg  = this.buildings.filter(function(b){ return b.team==='allied'&&b.isBuilt; }).length;
    var axisBldg    = this.buildings.filter(function(b){ return b.team==='axis'  &&b.isBuilt; }).length;

    if (alliedUnits === 0 && alliedBldg === 0 && this.gameTime > 120) { this._triggerVictory('axis',   'annihilation'); return; }
    if (axisUnits   === 0 && axisBldg   === 0 && this.gameTime > 120) { this._triggerVictory('allied', 'annihilation'); return; }
};

RTS.Game.VictorySystem.prototype._triggerVictory = function(winner, condition) {
    if (this.over) return;
    this.over      = true;
    this.winner    = winner;
    this.condition = condition;
    this._rebuildObjectives();
    this.onVictory(winner, condition, this._buildFinalStats());
};

// ---------------------------------------------------------------------------
//  FINAL STATS
// ---------------------------------------------------------------------------

RTS.Game.VictorySystem.prototype._buildFinalStats = function() {
    var m = Math.floor(this.gameTime / 60);
    var s = Math.floor(this.gameTime % 60);
    return {
        duration: (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s,
        alliedVP: Math.floor(this.alliedVP),
        axisVP:   Math.floor(this.axisVP),
        stats:    this.stats
    };
};

// ---------------------------------------------------------------------------
//  OBJECTIFS — tableau mis à jour pour ObjectivesPanel
// ---------------------------------------------------------------------------

RTS.Game.VictorySystem.prototype._rebuildObjectives = function() {
    var cps = this.navGrid.capturePoints;
    var alliedCPs = 0, axisCPs = 0, total = 0;
    var vpOwner = 'neutral';

    cps.forEach(function(cp) {
        if (cp.isHQ) return;
        total++;
        if (cp.owner === 'allied') alliedCPs++;
        if (cp.owner === 'axis')   axisCPs++;
        if (cp.type === 'vp')      vpOwner = cp.owner;
    });

    var threshold = Math.ceil(total * 0.7);
    var domAllied = Math.min(this._dominationTimer.allied, this.dominationRequired);
    var domAxis   = Math.min(this._dominationTimer.axis,   this.dominationRequired);

    this._objectives = [
        {
            id:       'vp_bleed',
            label:    'Points de Victoire',
            type:     'dual_bar',
            alliedVal: Math.floor(this.alliedVP),
            axisVal:   Math.floor(this.axisVP),
            max:       this.maxVP,
            detail:   vpOwner === 'neutral'
                ? 'VP contesté — capturez le centre'
                : (vpOwner === 'allied' ? '▼ Axe perd ' : '▼ Alliés perdent ') + '3 pts/s'
        },
        {
            id:       'cp_control',
            label:    'Points de Contrôle',
            type:     'cp_score',
            alliedVal: alliedCPs,
            axisVal:   axisCPs,
            total:     total,
            threshold: threshold,
            detail:   alliedCPs + ' / ' + total + ' alliés · ' + axisCPs + ' / ' + total + ' Axe'
        },
        {
            id:       'domination',
            label:    'Domination (' + threshold + '+ CPs / 60s)',
            type:     'progress_bar',
            alliedVal: domAllied,
            axisVal:   domAxis,
            max:       this.dominationRequired,
            detail:   domAllied > domAxis
                ? '⚡ Alliés : ' + Math.floor(domAllied) + 's / 60s'
                : domAxis > 0
                    ? '⚡ Axe : ' + Math.floor(domAxis) + 's / 60s'
                    : 'Contrôlez ' + threshold + '+ points sans interruption'
        }
    ];
};

RTS.Game.VictorySystem.prototype.getObjectives = function() {
    this._rebuildObjectives();
    return this._objectives;
};

RTS.Game.VictorySystem.prototype.getScore = function() {
    return {
        alliedVP: Math.floor(this.alliedVP),
        axisVP:   Math.floor(this.axisVP),
        maxVP:    this.maxVP,
        gameTime: this.gameTime,
        domAllied: this._dominationTimer.allied,
        domAxis:   this._dominationTimer.axis,
        domRequired: this.dominationRequired
    };
};