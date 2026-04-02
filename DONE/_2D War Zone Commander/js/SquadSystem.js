window.RTS = window.RTS || {};

/**
 * SquadSystem — gère le déplacement et la formation des squads.
 *
 * Formation "grid"  : membres en grille (infanterie)
 * Formation "solo"  : 1 seul membre au centre du pivot
 * Formation "wedge" : triangle offensif (futur)
 */
RTS.SquadSystem = {

    update: function(squads, delta) {
        squads.forEach(function(squad) {
            RTS.SquadSystem._move(squad, delta);
            RTS.SquadSystem._updateFormation(squad);
            RTS.SquadSystem._tickTimers(squad, delta);
        });
    },

    // ── Déplacement du pivot ──────────────────────────────────────────────────
    _move: function(squad, delta) {
        if (!squad.target) return;

        var dx   = squad.target.x - squad.x;
        var dy   = squad.target.y - squad.y;
        var dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 3) {
            var spd = squad.speed * delta;
            squad.x += (dx / dist) * spd;
            squad.y += (dy / dist) * spd;
        } else {
            squad.x      = squad.target.x;
            squad.y      = squad.target.y;
            squad.target = null;
        }
    },

    // ── Mise à jour des positions membres selon formation ─────────────────────
    _updateFormation: function(squad) {
        var alive   = squad.aliveMembers();
        var count   = alive.length;
        var spread  = squad.def.formationSpread || 0;
        var ftype   = squad.def.formationType;

        if (ftype === "solo" || count <= 1) {
            alive.forEach(function(m) {
                m.offsetX = 0;
                m.offsetY = 0;
                m.x = squad.x;
                m.y = squad.y;
            });
            return;
        }

        // Grille : disposition rectangulaire serrée
        if (ftype === "grid") {
            var cols = Math.ceil(Math.sqrt(count));
            var rows = Math.ceil(count / cols);
            var ox   = -(cols - 1) * spread / 2;
            var oy   = -(rows - 1) * spread / 2;

            alive.forEach(function(m, i) {
                var col = i % cols;
                var row = Math.floor(i / cols);
                m.offsetX = ox + col * spread;
                m.offsetY = oy + row * spread;
                m.x = squad.x + m.offsetX;
                m.y = squad.y + m.offsetY;
            });
        }
    },

    // ── Timers individuels ────────────────────────────────────────────────────
    _tickTimers: function(squad, delta) {
        if (squad.attackTimer  > 0) squad.attackTimer  -= delta;
        if (squad.flashTimer   > 0) squad.flashTimer   -= delta;

        squad.members.forEach(function(m) {
            if (m.flashTimer  > 0) m.flashTimer  -= delta;
            if (m.muzzleFlash > 0) m.muzzleFlash -= delta;
            if (m.fireTimer   > 0) m.fireTimer   -= delta;
        });
    },

    // ── Ordonne un déplacement en formation (RMB) ─────────────────────────────
    // squads = tableau des squads sélectionnés, worldX/Y = point cliqué
    orderMove: function(squads, worldX, worldY) {
        var cols   = Math.ceil(Math.sqrt(squads.length));
        var spread = 60;

        squads.forEach(function(squad, i) {
            var col = i % cols;
            var row = Math.floor(i / cols);
            squad.target = {
                x: worldX + (col - (cols - 1) / 2) * spread,
                y: worldY + row * spread
            };
        });
    }
};