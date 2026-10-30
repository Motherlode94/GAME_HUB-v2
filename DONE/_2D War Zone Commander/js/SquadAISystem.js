window.RTS = window.RTS || {};
/* Enemy squad tactical movement: staggered decisions, target weighting, flanks, retreat. */
RTS.SquadAISystem = {
    update: function(game, delta) {
        if (game.setupPhase || !RTS.WaveSystem._prepDone) return;
        var enemies = game.squads.filter(function(s) { return (s.team === "blue" || s.team === "ally") && !s.isDead(); });
        if (!enemies.length) return;
        game.squads.forEach(function(red) {
            if (red.team !== "red" || red.isDead() || !red.def) return;
            red._decisionTimer = (red._decisionTimer || 0) - delta;
            if (red._decisionTimer > 0) return;
            red._decisionTimer = 0.65 + (red.id % 5) * 0.13;
            var range = red.def.attackRange || 80, min = red.def.minRange || 0;
            var best = null, score = Infinity, distance = 0;
            enemies.forEach(function(t) {
                var d = Math.hypot(t.x - red.x, t.y - red.y);
                var threat = t.def && t.def.category === "vehicle" ? 0.95 : 1;
                var hp = t.getTotalHp && t.getMaxHp ? t.getTotalHp() / Math.max(1, t.getMaxHp()) : 1;
                var value = d * threat * (0.85 + hp * 0.15);
                if (value < score) { score = value; best = t; distance = d; }
            });
            if (!best) return;
            var hpRatio = red.getTotalHp() / Math.max(1, red.getMaxHp());
            var dx = red.x - best.x, dy = red.y - best.y;
            var len = Math.max(1, Math.hypot(dx, dy)), nx = dx / len, ny = dy / len;
            var tx, ty;
            if (hpRatio < 0.27 && distance < range * 1.5) {
                // Damaged units withdraw and preserve veterans instead of charging.
                tx = red.x + nx * 150; ty = red.y + ny * 150;
            } else if (min > 0 && distance < min * 1.15) {
                tx = red.x + nx * (min - distance + 65);
                ty = red.y + ny * (min - distance + 65);
            } else if (distance > range * 0.86) {
                // Alternating group flanks instead of piling up at the same point.
                var side = red.id % 2 ? 1 : -1;
                var offset = Math.min(125, distance * 0.28);
                tx = best.x + nx * range * 0.72 + (-ny) * side * offset;
                ty = best.y + ny * range * 0.72 + nx * side * offset;
            } else {
                red.target = null;
                return;
            }
            red.target = {
                x: Math.max(25, Math.min(RTS.WORLD_W - 25, tx)),
                y: Math.max(25, Math.min(RTS.WORLD_H - 25, ty))
            };
        });
    }
};