window.RTS = window.RTS || {};

/**
 * SquadAISystem
 *
 * Règles de faction :
 *   blue / ally  → n'attaquent que "red"   (géré par SquadCombatSystem)
 *   red          → attaquent "blue" et "ally"
 *
 * Ce système gère uniquement le déplacement IA des squads rouges.
 * Le combat est géré par SquadCombatSystem.
 */
RTS.SquadAISystem = {

    update: function(game, delta) {
        // Les ennemis restent immobiles pendant le compte à rebours initial
        if (!RTS.WaveSystem._prepDone) return;

        var squads = game.squads;

        // Cibles potentielles des rouges = bleus + alliés vivants
        var targets = squads.filter(function(s) {
            return (s.team === "blue" || s.team === "ally") && !s.isDead();
        });

        squads.forEach(function(red) {
            if (red.team !== "red") return;
            if (red.isDead()) return;
            if (!red.def) return;

            if (targets.length === 0) return;

            var closest  = null;
            var closestD = Infinity;

            targets.forEach(function(t) {
                var dx = t.x - red.x;
                var dy = t.y - red.y;
                var d  = Math.sqrt(dx * dx + dy * dy);
                if (d < closestD) { closestD = d; closest = t; }
            });

            if (!closest) return;

            var range = red.def.attackRange || 80;
            var stop  = red.def.minRange    || 0;

            if (stop > 0 && closestD < stop) {
                red.target = null;
                return;
            }

            if (closestD > range * 0.88) {
                red.target = { x: closest.x, y: closest.y };
            } else {
                red.target = null;
            }
        });
    }
};