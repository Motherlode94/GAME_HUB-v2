window.RTS = window.RTS || {};

/**
 * ProductionSystem — système canonique de production d'unités.
 *
 * Règles métier (inspirées Broken Arrow) :
 *  - Chaque bâtiment a une liste d'unités autorisées (Building.ALLOWED).
 *  - Un arsenal allié actif réduit tous les temps de production de 20 %.
 *  - Fallback productionTime : 6 s (au lieu de 10 s — rythme tactique rapide).
 *  - La file peut contenir jusqu'à building.maxQueue entrées (défaut 8).
 *  - Le coût est débité à l'enfilement, remboursé si annulé (non implémenté ici).
 */
RTS.ProductionSystem = {

    // ── Enfilement ────────────────────────────────────────────────────────────

    enqueue: function(game, building, typeName) {
        if (building.team !== "blue") return false;
        if (building.queue.length >= building.maxQueue) return false;

        var def = RTS.SquadDefs[typeName];
        if (!def) return false;

        var allowed = RTS.Building.ALLOWED[building.type] || [];
        if (allowed.indexOf(typeName) === -1) return false;

        if (!RTS.ResourceSystem.canAfford(game, def.cost)) return false;
        RTS.ResourceSystem.spend(game, def.cost);

        building.queue.push(typeName);

        // Démarre la production si la file était vide
        if (building.queue.length === 1) {
            building.progress       = 0;
            building.productionTime = RTS.ProductionSystem._resolveTime(def, game);
        }

        return true;
    },

    // ── Mise à jour chaque frame ──────────────────────────────────────────────

    update: function(game, delta) {
        game.buildings.forEach(function(b) {
            if (b.team !== "blue" || b.queue.length === 0) return;

            b.progress += delta;

            if (b.progress >= b.productionTime) {
                b.progress   = 0;
                var typeName = b.queue.shift();

                // Spawn légèrement décalé du bâtiment
                var sx = b.x + (Math.random() - 0.5) * 70;
                var sy = b.y + (b.size || 52) / 2 + 28;
                game.squads.push(new RTS.Squad(sx, sy, "blue", typeName));

                // Lance la production suivante si file non vide
                if (b.queue.length > 0) {
                    var nextDef = RTS.SquadDefs[b.queue[0]];
                    b.productionTime = RTS.ProductionSystem._resolveTime(nextDef, game);
                } else {
                    b.productionTime = 0;
                }
            }
        });
    },

    // ── Calcul du temps de production effectif ────────────────────────────────

    /**
     * Applique le bonus arsenal (+20 % vitesse) si un arsenal allié est actif.
     * @param  {object} def   — entrée de RTS.SquadDefs
     * @param  {object} game
     * @return {number}       — secondes
     */
    _resolveTime: function(def, game) {
        var base = (def && def.productionTime > 0) ? def.productionTime : 6;

        var hasArsenal = game.buildings.some(function(b) {
            return b.team === "blue" && b.type === "arsenal" && b.hp > 0;
        });

        // Arsenal = logistique accélérée : −20 % sur tous les temps de production
        return hasArsenal ? base * 0.80 : base;
    }
};