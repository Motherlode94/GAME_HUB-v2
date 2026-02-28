window.RTS = window.RTS || {};

/**
 * CombatSystem — dispatch par combatMode.
 * Infanterie : rafale de balles (burst)
 * Tank       : obus lent AoE (shell)
 * Worker     : pas de combat (none)
 */
RTS.CombatSystem = {

    update: function(game, delta) {
        var units = game.units;

        for (var i = 0; i < units.length; i++) {
            var a = units[i];

            if (a.combatMode === "none") continue;

            if (a.attackTimer > 0) a.attackTimer -= delta;
            if (a.flashTimer  > 0) a.flashTimer  -= delta;

            // Tick burst queue (infanterie)
            if (a.burstQueue && a.burstQueue.length > 0) {
                var next = a.burstQueue[0];
                next.delay -= delta;
                if (next.delay <= 0) {
                    a.burstQueue.shift();
                    if (next.target && next.target.hp > 0) {
                        RTS.ProjectileSystem.fire(game, a, next.target, "bullet");
                    }
                }
            }

            // Cible la plus proche (équipe adverse, non-worker)
            var target  = null;
            var targetD = Infinity;
            for (var j = 0; j < units.length; j++) {
                var b = units[j];
                if (b.team === a.team)          continue;
                if (b.combatMode === "none")    continue;
                var dx = b.x - a.x;
                var dy = b.y - a.y;
                var d  = Math.sqrt(dx * dx + dy * dy);
                if (d < targetD) { targetD = d; target = b; }
            }

            if (!target || targetD > a.attackRange || a.attackTimer > 0) continue;

            if (a.combatMode === "burst") {
                RTS.CombatSystem._fireBurst(game, a, target);
            } else if (a.combatMode === "shell") {
                RTS.CombatSystem._fireShell(game, a, target);
            }

            a.attackTimer = 1 / (a.attackRate || 1);
        }

        // Nettoyage morts
        for (var k = units.length - 1; k >= 0; k--) {
            if (units[k].hp <= 0) {
                RTS.ParticleSystem.spawnDeath(game.particles, units[k].x, units[k].y, units[k].team);
                var si = game.selectedUnits.indexOf(units[k]);
                if (si !== -1) game.selectedUnits.splice(si, 1);
                units.splice(k, 1);
            }
        }
    },

    _fireBurst: function(game, unit, target) {
        var count = unit.burstCount || 3;
        var delay = unit.burstDelay || 0.08;
        RTS.ProjectileSystem.fire(game, unit, target, "bullet");
        for (var i = 1; i < count; i++) {
            unit.burstQueue.push({ target: target, delay: delay * i });
        }
        RTS.ParticleSystem.spawnMuzzleFlash(game.particles, unit.x, unit.y, target.x, target.y, false);
    },

    _fireShell: function(game, unit, target) {
        RTS.ProjectileSystem.fire(game, unit, target, "shell");
        RTS.ParticleSystem.spawnMuzzleFlash(game.particles, unit.x, unit.y, target.x, target.y, true);
        RTS.ParticleSystem.spawnRecoilSmoke(game.particles, unit.x, unit.y, target.x, target.y);
    }
};