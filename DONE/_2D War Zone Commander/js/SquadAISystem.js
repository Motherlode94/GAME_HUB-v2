window.RTS = window.RTS || {};
/* Enemy squad tactical movement: staggered decisions, target weighting, flanks, retreat. */
RTS.SquadAISystem = {
    update: function(game, delta) {
        if (game.setupPhase || (game.mode !== "conquest" && !RTS.WaveSystem._prepDone)) return;
        var enemies = game.squads.filter(function(s) { return (s.team === "blue" || s.team === "ally") && !s.isDead(); });
        if (!enemies.length && !game.conquest) return;
        game.squads.forEach(function(red) {
            if (red.team !== "red" || red.isDead() || !red.def) return;
            red._decisionTimer = (red._decisionTimer || 0) - delta;
            if (red._decisionTimer > 0) return;
            red._decisionTimer = 0.65 + (red.id % 5) * 0.13;
            var reconOnly = red.def.combatMode === "none";
            var range = reconOnly ? 260 : (red.def.attackRange || 80), min = red.def.minRange || 0;
            var best = null, score = Infinity, distance = 0;
            enemies.forEach(function(t) {
                if (red.def.antiAirOnly && (!t.def || t.def.category !== "air")) return;
                var d = Math.hypot(t.x - red.x, t.y - red.y);
                var threat = t.def && t.def.category === "vehicle" ? 0.95 : 1;
                var hp = t.getTotalHp && t.getMaxHp ? t.getTotalHp() / Math.max(1, t.getMaxHp()) : 1;
                var value = d * threat * (0.85 + hp * 0.15);
                if (value < score) { score = value; best = t; distance = d; }
            });
            if (game.mode === "conquest" && game.conquest) {
                var zones=game.conquest.zones.filter(function(z){return z.owner!=="red";});
                var support=/supply_truck|ammo_carrier/.test(red.typeName);
                if (support) {
                    var needy=game.squads.filter(function(t){return t.team==="red" && t!==red && !t.isDead() && t.ammoCapacity && t.ammo<t.ammoCapacity*.5;})[0];
                    if(needy){red.target={x:needy.x+45,y:needy.y+35};return;}
                }
                if ((!best || distance>(red.def.attackRange||200)*1.5) && zones.length && red.def.category!=="air") {
                    zones.sort(function(a,b){return Math.hypot(a.x-red.x,a.y-red.y)-Math.hypot(b.x-red.x,b.y-red.y);});
                    var z=zones[red.id%Math.min(2,zones.length)];
                    red.target={x:z.x+(red.id%3-1)*28,y:z.y+(red.id%5-2)*25};
                    return;
                }
            }
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
            } else if (reconOnly && distance < 230) {
                tx = red.x + nx * 220; ty = red.y + ny * 220;
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