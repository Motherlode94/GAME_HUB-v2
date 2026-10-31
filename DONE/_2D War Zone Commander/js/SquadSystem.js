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
            // Leader AI: tactical command intent belongs to player; leader evaluates local exposure.
            if(squad.def && squad.def.category==="infantry" && !squad.isDead()){
                var members=squad.aliveMembers(),leader=members.find(function(m){return m.role==="leader";})||members[0];
                if(leader)leader.role="leader";
                var enemies=squads.filter(function(e){return e!==squad&&!e.isDead()&&(squad.team==="red" ? e.team!=="red" : e.team==="red");});
                var nearest=enemies.sort(function(a,b){return Math.hypot(a.x-squad.x,a.y-squad.y)-Math.hypot(b.x-squad.x,b.y-squad.y);})[0];
                var threat=nearest?Math.hypot(nearest.x-squad.x,nearest.y-squad.y):Infinity;
                var friends=squads.filter(function(v){return v!==squad&&v.team===squad.team&&v.def&&v.def.category==="vehicle"&&!v.isDead();});
                var escort=friends.sort(function(a,b){return Math.hypot(a.x-squad.x,a.y-squad.y)-Math.hypot(b.x-squad.x,b.y-squad.y);})[0];
                squad.leaderState=threat<140&&(squad.suppression||0)>55?"repli":threat<280?"couverture":escort&&Math.hypot(escort.x-squad.x,escort.y-squad.y)<240?"protection blindé":"progression";
                // Under heavy fire, a leader recalls an exposed squad to the nearest safe position.
                squad._leaderDelay=Math.max(0,(squad._leaderDelay||0)-delta);
                if(squad.leaderState==="repli" && squad._leaderDelay===0 && nearest && !squad.garrisonedIn){
                    var away=Math.atan2(squad.y-nearest.y,squad.x-nearest.x);
                    squad.target={x:Math.max(25,Math.min(RTS.WORLD_W-25,squad.x+Math.cos(away)*110)),y:Math.max(25,Math.min(RTS.WORLD_H-25,squad.y+Math.sin(away)*110))};
                    squad._nav=null;squad.holdingPosition=false;squad._leaderDelay=4;
                }
                // Infantry escorts maintain a protective screen instead of outrunning the vehicle.
                if(escort && squad.leaderState==="protection blindé" && !squad.target && threat>340){
                    var side=squad.id%2?1:-1,front=escort.heading||0;
                    squad.target={x:escort.x+Math.cos(front)*55-Math.sin(front)*side*40,y:escort.y+Math.sin(front)*55+Math.cos(front)*side*40};
                    squad._nav=null;
                }
            }
            // Attack-move: pause movement while a hostile is inside weapon range.
            // Resume toward the original destination as soon as no target is in range.
            var engaging = false;
            if (squad.attackMove && squad.target && squad.def &&
                squad.def.attackRange > 0 && squad.def.combatMode !== "none" && squad.def.combatMode !== "repair" && squad.def.combatMode !== "harvest" && squad.ammo > 0 && !squad.isDead()) {
                engaging = squads.some(function(other) {
                    if (other.isDead()) return false;
                    if (squad.team === other.team) return false;
                    if (squad.team === "red" ? other.team !== "blue" && other.team !== "ally" : other.team !== "red") return false;
                    if (squad.def.antiAirOnly && (!other.def || other.def.category !== "air")) return false;

                    var dist = Math.hypot(other.x - squad.x, other.y - squad.y);
                    return dist <= squad.def.attackRange && dist >= (squad.def.minRange || 0);
                });
            }
            if (!engaging) RTS.SquadSystem._move(squad, delta, buildings || []);
            RTS.SquadSystem._updateFormation(squad, delta);
            if(squad.def && squad.def.category==="infantry" && !squad.isDead()){
                // Members hold spacing, but choose sheltered slots on contested ground.
                var alive=squad.aliveMembers();
                alive.forEach(function(m,i){
                    if(!m._positioned)return;
                    var cx=m.x,cy=m.y;
                    var candidates=[{x:cx,y:cy},{x:cx-12,y:cy+10},{x:cx+12,y:cy-10}];
                    var best=candidates[0],bestScore=Infinity;
                    candidates.forEach(function(p){
                        var blocked=(buildings||[]).some(function(b){return b.hp>0 && Math.abs(p.x-b.x)<(b.size||52)/2+5 && Math.abs(p.y-b.y)<(b.size||52)/2+5;});
                        if(blocked)return;
                        var cover=(buildings||[]).some(function(b){return b.hp>0 && Math.hypot(p.x-b.x,p.y-b.y)<(b.size||52)/2+55;});
                        var score=Math.hypot(p.x-cx,p.y-cy)+(cover && (squad.suppression||0)>22?-22:0);
                        if(score<bestScore){bestScore=score;best=p;}
                    });
                    m.x=best.x;m.y=best.y;
                    m.tacticalState=(squad.suppression||0)>55?"à couvert":squad.leaderState==="protection blindé"?"escorte":"en formation";
                });
            }
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
        var h = function(k) { return Math.hypot(k % cols - goal % cols, Math.floor(k / cols) - Math.floor(goal / cols)); };
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
            [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]].forEach(function(step) {
                var nx = x + step[0], ny = y + step[1];
                if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) return;
                var next = key(nx, ny);
                if (blocked.has(next) || seen.has(next)) return;
                if (step[0] && step[1] && (blocked.has(key(x+step[0],y)) || blocked.has(key(x,y+step[1])))) return;
                var cost = g.get(cur) + (step[0]&&step[1]?1.41421356237:1);
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
        // Aircraft fly directly to their orders; land units still use obstacle-aware A*.
        if (squad.def && squad.def.category === "air") {
            var ax = squad.target.x - squad.x, ay = squad.target.y - squad.y;
            var airDist = Math.hypot(ax, ay);
            var rotorFactor = Math.max(0.25, 1 - (squad.rotorDamage || 0));
            var airStep = Math.max(0, squad.speed * rotorFactor * delta);
            if (airDist <= Math.max(3, airStep)) {
                squad.x = squad.target.x; squad.y = squad.target.y;
                squad.target = null; squad._nav = null;
            } else {
                squad.heading = Math.atan2(ay, ax);
                squad.x += ax / airDist * airStep;
                squad.y += ay / airDist * airStep;
            }
            return;
        }
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
        var aircraft = squad.def && squad.def.category === "air";
        var mobility = vehicle ? Math.max(0.35, 1 - (squad.engineDamage || 0)) :
            aircraft ? Math.max(0.25, 1 - (squad.rotorDamage || 0)) : 1;
        var suppressionFactor = squad.def.category === "infantry" ? Math.max(0.45, 1-(squad.suppression||0)*0.005) : 1;
        var step = Math.max(0, squad.speed * mobility * suppressionFactor * delta);
        if (dist > 0.001 && step > 0) {
            var wanted = Math.atan2(dy, dx);
            var deltaAngle = Math.atan2(Math.sin(wanted-squad.heading),Math.cos(wanted-squad.heading));
            var turnSpeed = vehicle ? 2.7 : 7.5;
            squad.heading += Math.max(-turnSpeed*delta,Math.min(turnSpeed*delta,deltaAngle));
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
    _updateFormation: function(squad, delta) {
        var follow = Math.min(1,Math.max(0,(delta==null?1:delta)*9));
        function steer(m,tx,ty){if(!m._positioned){m.x=tx;m.y=ty;m._positioned=true;}else{m.x+=(tx-m.x)*follow;m.y+=(ty-m.y)*follow;}m.facing=Math.atan2(ty-m.y,tx-m.x);}

        var alive   = squad.aliveMembers();
        var count   = alive.length;
        var spread  = squad.def.formationSpread || 0;
        var ftype   = squad.formation || squad.def.formationType;

        if (ftype === "solo" || count <= 1) {
            alive.forEach(function(m) {
                m.offsetX = 0;
                m.offsetY = 0;
                steer(m,squad.x,squad.y);
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
                var a=squad.heading-Math.PI/2;
                steer(m,squad.x + ox*Math.cos(a)-oy*Math.sin(a),squad.y + ox*Math.sin(a)+oy*Math.cos(a));
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
                var a=squad.heading-Math.PI/2;
                steer(m,squad.x + m.offsetX*Math.cos(a)-m.offsetY*Math.sin(a),squad.y + m.offsetX*Math.sin(a)+m.offsetY*Math.cos(a));
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
            squad.holdingPosition = false;
            squad.garrisonedIn = null;
            squad.attackMove = false;
            if (RTS.AirMissionSystem && squad.def && squad.def.category === 'air') RTS.AirMissionSystem.cancel(squad);
            squad._nav = null;
            var col = i % cols;
            var row = Math.floor(i / cols);
            squad.target = {
                x: worldX + (col - (cols - 1) / 2) * spread,
                y: worldY + row * spread
            };
        });
    }
};