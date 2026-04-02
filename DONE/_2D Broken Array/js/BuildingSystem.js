window.RTS = window.RTS || {};

/**
 * BuildingSystem
 *
 * Gère :
 *  - Le mode placement (startPlacing / place / cancelPlacing)
 *  - La file de production avec bonus arsenal
 *  - Les effets passifs : revenus (mine/refinery/arsenal) et soins (hospital)
 *
 * Rôles stricts inspirés de Broken Arrow :
 *   Bâtiments économiques  → génèrent des ressources en continu
 *   Bâtiments de production → fabriquent des unités (HQ/Barracks/Workshop/Hangar)
 *   Hospital               → régénère HP des squads dans son rayon
 *   Tower                  → défense active (géré par DefenseTower.js)
 *   Wall                   → obstacle — aucun effet actif, HP élevé
 */
RTS.BuildingSystem = {

    _placingType: null,

    // ── Placement ─────────────────────────────────────────────────────────────

    startPlacing: function(type) {
        this._placingType = type;
        document.getElementById("gameCanvas").style.cursor = "copy";
        document.getElementById("placingHint").textContent =
            "Clic gauche pour poser · Échap pour annuler";
        document.getElementById("placingHint").style.opacity = "1";
    },

    cancelPlacing: function() {
        this._placingType = null;
        document.getElementById("gameCanvas").style.cursor = "crosshair";
        document.getElementById("placingHint").style.opacity = "0";
    },

    isPlacing: function() {
        return this._placingType !== null;
    },

    place: function(game, worldX, worldY) {
        var type = this._placingType;
        if (!type) return false;

        var cost = RTS.Building.COSTS[type];
        if (!RTS.ResourceSystem.canAfford(game, cost)) {
            RTS.BuildingSystem._showError("Ressources insuffisantes !");
            return false;
        }

        var size = 40;
        var tooClose = game.buildings.some(function(b) {
            return Math.abs(b.x - worldX) < size + 10 &&
                   Math.abs(b.y - worldY) < size + 10;
        });

        if (tooClose) {
            RTS.BuildingSystem._showError("Emplacement occupé !");
            return false;
        }

        RTS.ResourceSystem.spend(game, cost);
        game.buildings.push(new RTS.Building(worldX, worldY, "blue", type));
        this.cancelPlacing();
        return true;
    },

    // ── File de production ────────────────────────────────────────────────────

    enqueue: function(building, typeName, game) {
        if (building.queue.length >= building.maxQueue) {
            RTS.BuildingSystem._showError("File de production pleine !");
            return false;
        }

        var def = RTS.SquadDefs[typeName];
        if (!def) {
            console.warn("[BuildingSystem] SquadDef inconnu :", typeName);
            return false;
        }

        if (!RTS.ResourceSystem.canAfford(game, def.cost)) {
            RTS.BuildingSystem._showError("Ressources insuffisantes !");
            return false;
        }

        RTS.ResourceSystem.spend(game, def.cost);
        building.queue.push(typeName);

        if (building.queue.length === 1) {
            building.progress       = 0;
            building.productionTime = RTS.BuildingSystem._resolveProductionTime(def, game);
        }

        return true;
    },

    /**
     * Calcule le productionTime effectif en appliquant le bonus arsenal.
     * Si au moins un arsenal allié est présent sur la map, production 20% plus rapide.
     */
    _resolveProductionTime: function(def, game) {
        var base = def.productionTime;
        if (!base || base <= 0) base = 6; // fallback minimal — 6s au lieu de 8s

        var hasArsenal = game.buildings.some(function(b) {
            return b.team === "blue" && b.type === "arsenal" && b.hp > 0;
        });

        return hasArsenal ? base * RTS.Building.ARSENAL_SPEED_BONUS : base;
    },

    // ── Mise à jour principale ────────────────────────────────────────────────

    update: function(game, delta) {
        RTS.BuildingSystem._updateProduction(game, delta);
        RTS.BuildingSystem._updatePassiveIncome(game, delta);
        RTS.BuildingSystem._updateHospital(game, delta);
        RTS.BuildingSystem._updateFlash(game, delta);
    },

    // ── Production d'unités ───────────────────────────────────────────────────

    _updateProduction: function(game, delta) {
        game.buildings.forEach(function(b) {
            if (b.team !== "blue") return;
            if (!b.queue || b.queue.length === 0) return;

            b.progress += delta;

            if (b.progress >= b.productionTime) {
                var typeName = b.queue.shift();
                b.progress   = 0;

                if (b.queue.length > 0) {
                    var nextDef = RTS.SquadDefs[b.queue[0]];
                    if (nextDef) {
                        b.productionTime = RTS.BuildingSystem._resolveProductionTime(nextDef, game);
                    } else {
                        b.productionTime = 6;
                    }
                } else {
                    b.productionTime = 0;
                }

                var spawnX = b.x + 60 + Math.random() * 20;
                var spawnY = b.y + 20 + Math.random() * 20;

                var squad = new RTS.Squad(spawnX, spawnY, "blue", typeName);
                game.squads.push(squad);
            }
        });
    },

    // ── Revenus passifs : mine / refinery / arsenal ───────────────────────────
    // Tick toutes les secondes pour éviter des micro-fractions de ressources.

    _updatePassiveIncome: function(game, delta) {
        game.buildings.forEach(function(b) {
            if (b.team !== "blue" || b.hp <= 0) return;
            var passive = RTS.Building.PASSIVE[b.type];
            if (!passive) return;

            b.passiveTimer = (b.passiveTimer || 0) + delta;
            if (b.passiveTimer >= 1.0) {
                b.passiveTimer -= 1.0;
                if (passive.gold) game.resources.gold += passive.gold;
                if (passive.fuel) game.resources.fuel += passive.fuel;
                if (passive.ammo) game.resources.ammo += passive.ammo;
            }
        });
    },

    // ── Hospital : soigne les squads alliés dans le rayon ────────────────────

    _updateHospital: function(game, delta) {
        var radius   = RTS.Building.HOSPITAL_RADIUS;
        var healRate = RTS.Building.HOSPITAL_HEAL_RATE;
        var tick     = RTS.Building.HOSPITAL_TICK;

        game.buildings.forEach(function(b) {
            if (b.team !== "blue" || b.type !== "hospital" || b.hp <= 0) return;

            b.passiveTimer = (b.passiveTimer || 0) + delta;
            if (b.passiveTimer < tick) return;
            b.passiveTimer -= tick;

            game.squads.forEach(function(squad) {
                if (squad.team !== "blue") return;
                var dx = squad.x - b.x;
                var dy = squad.y - b.y;
                if (dx * dx + dy * dy > radius * radius) return;

                // Applique le soin à chaque unité du squad
                if (squad.units) {
                    squad.units.forEach(function(u) {
                        u.hp = Math.min(u.hp + healRate, u.maxHp);
                    });
                }
                // Fallback si le squad a un HP propre
                if (typeof squad.hp === "number") {
                    squad.hp = Math.min(squad.hp + healRate, squad.maxHp || squad.hp);
                }
            });
        });
    },

    // ── Flash timer des bâtiments (touche visuelle lors de dégâts) ────────────

    _updateFlash: function(game, delta) {
        game.buildings.forEach(function(b) {
            if (b.flashTimer > 0) b.flashTimer -= delta;
        });
    },

    // ── Erreurs UI ────────────────────────────────────────────────────────────

    _showError: function(msg) {
        var el = document.getElementById("buildError");
        if (!el) return;
        el.textContent   = msg;
        el.style.opacity = "1";
        clearTimeout(this._errTimer);
        this._errTimer = setTimeout(function() {
            el.style.opacity = "0";
        }, 1800);
    }
};