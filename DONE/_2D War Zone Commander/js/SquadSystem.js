window.RTS = window.RTS || {};

/**
 * SquadSystem — gère le déplacement et la formation des squads.
 *
 * Formation "grid"  : membres en grille (infanterie)
 * Formation "solo"  : 1 seul membre au centre du pivot
 * Formation "wedge" : triangle offensif (futur)
 */
RTS.SquadSystem = {

    update: function(squads, delta, buildings) {
        squads.forEach(function(squad) {
            RTS.SquadSystem._move(squad, delta, buildings || []);
            RTS.SquadSystem._updateFormation(squad);
            RTS.SquadSystem._tickTimers(squad, delta);
        });
    },

    // Navigation A* sur grille, avec obstacles bâtiments et cache de chemin.
    // Les coordonnées de cible restent celles de l'ordre original.
    _cell: 40,
    _blocked: function(x, y, buildings) {
        if (x < 12 || y < 12 || x > RTS.WORLD_W - 12 || y > RTS.WORLD_H - 12) return true;
        return buildings.some(function(b) {
            if (b.hp <= 0) return false;
            var r = (b.size || 52) / 2 + 15;
            return Math.abs(x - b.x) < r && Math.abs(y - b.y) < r;
        });
    },
    _path: function(sx, sy, tx, ty, buildings) {
        var cell = this._cell, cols = Math.ceil(RTS.WORLD_W / cell), rows = Math.ceil(RTS.WORLD_H / cell);
        var clamp = function(v, max) { return Math.max(0, Math.min(max - 1, Math.floor(v / cell))); };
        var ax = clamp(sx, cols), ay = clamp(sy, rows);
        var gx = clamp(tx, cols), gy = clamp(ty, rows);
        var key = function(x, y) { return y * cols + x; };
        var start = key(ax, ay), goal = key(gx, gy);
        var blocked = new Set();
        buildings.forEach(function(b) {
            if (b.hp <= 0) return;
            var r = (b.size || 52) / 2 + 15;
            for (var y = clamp(b.y - r, rows); y <= clamp(b.y + r, rows); y++)
                for (var x = clamp(b.x - r, cols); x <= clamp(b.x + r, cols); x++)
                    if (Math.abs((x + 0.5) * cell - b.x) < r && Math.abs((y + 0.5) * cell - b.y) < r)
                        blocked.add(key(x, y));
        });
        blocked.delete(start);
        // A destination under a building is resolved to the nearest accessible cell.
        if (blocked.has(goal)) {
            var best = -1, bd = Infinity;
            for (var i = 0; i < cols * rows; i++) {
                if (blocked.has(i)) continue;
                var xx = i % cols, yy = Math.floor(i / cols);
                var d = (xx - gx) ** 2 + (yy - gy) ** 2;
                if (d < bd) { bd = d; best = i; }
            }
            if (best < 0) return [];
            goal = best;
        }
        var open = [start], seen = new Set(), g = new Map([[start, 0]]), parent = new Map();
        var h = function(k) { return Math.abs(k % cols - goal % cols) + Math.abs(Math.floor(k / cols) - Math.floor(goal / cols)); };
        var limit = cols * rows;
        while (open.length && limit-- > 0) {
            var bi = 0;
            for (var j = 1; j < open.length; j++)
                if (g.get(open[j]) + h(open[j]) < g.get(open[bi]) + h(open[bi])) bi = j;
            var cur = open.splice(bi, 1)[0];
            if (cur === goal) {
                var path = [];
                while (cur !== start) {
                    path.unshift({ x: (cur % cols + 0.5) * cell, y: (Math.floor(cur / cols) + 0.5) * cell });
                    cur = parent.get(cur);
                }
                return path;
            }
            seen.add(cur);
            var x = cur % cols, y = Math.floor(cur / cols);
            [[1,0],[-1,0],[0,1],[0,-1]].forEach(function(step) {
                var nx = x + step[0], ny = y + step[1];
                if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) return;
                var next = key(nx, ny);
                if (blocked.has(next) || seen.has(next)) return;
                var cost = g.get(cur) + 1;
                if (!g.has(next) || cost < g.get(next)) {
                    g.set(next, cost); parent.set(next, cur);
                    if (open.indexOf(next) < 0) open.push(next);
                }
            });
        }
        return [];
    },
    _move: function(squad, delta, buildings) {
        if (!squad.target || !squad.speed) { squad._nav = null; return; }
        var dest = squad.target, nav = squad._nav;
        var stamp = buildings.filter(function(b) { return b.hp > 0; })
            .map(function(b) { return b.x + ":" + b.y + ":" + b.size; }).join("|");
        if (!nav || nav.tx !== dest.x || nav.ty !== dest.y || nav.stamp !== stamp) {
            nav = squad._nav = { tx: dest.x, ty: dest.y, stamp: stamp,
                points: this._path(squad.x, squad.y, dest.x, dest.y, buildings) };
        }
        var point = nav.points.length ? nav.points[0] : dest;
        var dx = point.x - squad.x, dy = point.y - squad.y, dist = Math.hypot(dx, dy);
        // Mobile vehicles lose speed as their engine takes damage.
        // Heading follows travel direction so directional armour is meaningful.
        var vehicle = squad.def && squad.def.category === "vehicle";
        var mobility = vehicle ? Math.max(0.35, 1 - (squad.engineDamage || 0)) : 1;
        var step = Math.max(0, squad.speed * mobility * delta);
        if (vehicle && dist > 0.001 && step > 0) {
            squad.heading = Math.atan2(dy, dx);
        }
        if (dist <= Math.max(3, step)) {
            squad.x = point.x; squad.y = point.y;
            if (nav.points.length) nav.points.shift();
            else { squad.target = null; squad._nav = null; }
        } else {
            squad.x += dx / dist * step;
            squad.y += dy / dist * step;
        }
    },

    // ── Mise à jour des positions membres selon formation ─────────────────────
    _updateFormation: function(squad) {
        var alive   = squad.aliveMembers();
        var count   = alive.length;
        var spread  = squad.def.formationSpread || 0;
        var ftype   = squad.formation || squad.def.formationType;

        if (ftype === "solo" || count <= 1) {
            alive.forEach(function(m) {
                m.offsetX = 0;
                m.offsetY = 0;
                m.x = squad.x;
                m.y = squad.y;
            });
            return;
        }

        // Formation tactique : coin pour l'assaut, ligne pour tenir un front.
        if (ftype === "wedge" || ftype === "line") {
            alive.forEach(function(m, i) {
                var ox, oy;
                if (ftype === "line") {
                    ox = (i - (count - 1) / 2) * spread;
                    oy = 0;
                } else {
                    var row = Math.floor(Math.sqrt(i));
                    var position = i - row * row;
                    ox = (position - row) * spread * .7;
                    oy = row * spread * .85;
                }
                m.offsetX = ox; m.offsetY = oy;
                m.x = squad.x + ox; m.y = squad.y + oy;
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