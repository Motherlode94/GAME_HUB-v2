var RTS = RTS || {};
RTS.Game = RTS.Game || {};

/**
 * ResourceManager — Économie de guerre (CoH1).
 *
 * - Manpower  : accumulé passivement, sert à toutes les unités
 * - Munitions : générées par les points munitions capturés
 * - Carburant  : généré par les points fuel capturés, requis pour véhicules/aviation
 *
 * Usage dans Game.js :
 *   var res = new RTS.Game.ResourceManager('allied');
 *   res.syncWithNavGrid(navGrid);   // après chaque capture
 *   res.update(deltaTime);           // chaque frame
 *   res.spend({ manpower:280, fuel:25 }); // retourne bool
 */
RTS.Game.ResourceManager = function(team) {
    this.team = team;

    // Le joueur (allied) démarre avec moins de ressources.
    if (team === 'allied') {
        this.manpower  = 320;
        this.munitions = 40;
        this.fuel      = 20;
    } else {
        this.manpower  = 520;
        this.munitions = 90;
        this.fuel      = 60;
    }

    this.maxManpower  = 9999;
    this.maxMunitions = 999;
    this.maxFuel      = 999;

    // Taux / seconde (plus strict pour un pacing proche CoH).
    this._mpRate  = 10;
    this._munRate = 0.8;
    this._fuRate  = 0.45;

    // Pour affichage HUD (+X/min)
    this.manpowerRate  = Math.round(this._mpRate * 60);
    this.munitionsRate = Math.round(this._munRate * 60);
    this.fuelRate      = Math.round(this._fuRate  * 60);
};

RTS.Game.ResourceManager.prototype.syncWithNavGrid = function(navGrid) {
    var self = this;
    var bonusMun = 0, bonusFu = 0;
    navGrid.capturePoints.forEach(function(cp) {
        if (cp.owner !== self.team) return;
        var rate = (cp.resourceRate || 0) / 60; // /min → /sec
        if (cp.type === 'munitions') bonusMun += rate;
        if (cp.type === 'fuel')      bonusFu  += rate;
    });
    // Conserver le taux de base strict + bonus des points capturés.
    this._munRate = 0.8 + bonusMun;
    this._fuRate  = 0.45 + bonusFu;
    this.manpowerRate  = Math.round(this._mpRate  * 60);
    this.munitionsRate = Math.round(this._munRate * 60);
    this.fuelRate      = Math.round(this._fuRate  * 60);
};

RTS.Game.ResourceManager.prototype.update = function(dt) {
    this.manpower  = Math.min(this.maxManpower,  this.manpower  + this._mpRate  * dt);
    this.munitions = Math.min(this.maxMunitions, this.munitions + this._munRate * dt);
    this.fuel      = Math.min(this.maxFuel,      this.fuel      + this._fuRate  * dt);
};

RTS.Game.ResourceManager.prototype.canAfford = function(cost) {
    return this.manpower  >= (cost.manpower  || 0) &&
           this.munitions >= (cost.munitions || 0) &&
           this.fuel      >= (cost.fuel      || 0);
};

RTS.Game.ResourceManager.prototype.spend = function(cost) {
    if (!this.canAfford(cost)) return false;
    this.manpower  -= (cost.manpower  || 0);
    this.munitions -= (cost.munitions || 0);
    this.fuel      -= (cost.fuel      || 0);
    return true;
};

RTS.Game.ResourceManager.prototype.get = function() {
    return {
        manpower:  Math.floor(this.manpower),
        munitions: Math.floor(this.munitions),
        fuel:      Math.floor(this.fuel),
        manpowerRate:  this.manpowerRate,
        munitionsRate: this.munitionsRate,
        fuelRate:      this.fuelRate
    };
};
