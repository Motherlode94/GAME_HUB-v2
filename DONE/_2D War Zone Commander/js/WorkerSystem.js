window.RTS = window.RTS || {};

RTS.WorkerSystem = {
    update: function(game, delta) {
        game.squads.forEach(function(squad) {
            if (squad.team !== "blue") return;
            var mode = squad.def && squad.def.combatMode;
            if (mode === "harvest")  RTS.WorkerSystem._tickHarvest(game, squad, delta);
            if (mode === "repair")   RTS.WorkerSystem._tickRepair(game, squad, delta);
        });
    },

    _tickHarvest: function(game, squad, delta) {
        if (squad.returning) {
            var depot = RTS.WorkerSystem._nearestBuilding(game, squad);
            if (!depot) { squad.returning = false; return; }
            var dx = depot.x - squad.x, dy = depot.y - squad.y;
            if (Math.sqrt(dx*dx+dy*dy) > depot.size/2 + 5) {
                squad.target = { x: depot.x, y: depot.y };
            } else {
                squad.target = null;
                if (squad.carrying.amount > 0) {
                    game.resources[squad.carrying.type] = (game.resources[squad.carrying.type]||0) + squad.carrying.amount;
                }
                squad.carrying = { type: null, amount: 0 };
                squad.returning = false;
            }
            return;
        }

        if (!squad.harvestTarget || squad.harvestTarget.depleted) {
            squad.harvestTarget = RTS.WorkerSystem._nearestNode(game, squad);
        }
        var node = squad.harvestTarget;
        if (!node) return;

        var ndx = node.x - squad.x, ndy = node.y - squad.y;
        var nd  = Math.sqrt(ndx*ndx + ndy*ndy);
        var def = squad.def;

        if (nd > (def.harvestRange||22) + node.size) {
            squad.target = { x: node.x, y: node.y };
        } else {
            squad.target = null;
            var h = Math.min((def.harvestRate||10)*delta, node.amount, (def.carryMax||50) - squad.carrying.amount);
            if (h > 0) {
                squad.carrying.type    = node.type;
                squad.carrying.amount += h;
                node.amount           -= h;
                if (node.amount <= 0) { node.amount = 0; node.depleted = true; }
                RTS.ParticleSystem.spawnHarvest(game.particles, squad.x, squad.y, node.type);
            }
            if (squad.carrying.amount >= (def.carryMax||50)) squad.returning = true;
        }
    },

    _tickRepair: function(game, squad, delta) {
        var best = null, bestD = Infinity;
        game.buildings.forEach(function(b) {
            if (b.team !== "blue" || b.hp >= b.maxHp) return;
            var dx = b.x - squad.x, dy = b.y - squad.y;
            var d  = Math.sqrt(dx*dx + dy*dy);
            if (d < bestD) { bestD = d; best = b; }
        });
        if (!best) return;
        var rr = squad.def.repairRange || 30;
        if (bestD > rr) {
            squad.target = { x: best.x, y: best.y };
        } else {
            squad.target = null;
            best.hp = Math.min(best.maxHp, best.hp + (squad.def.repairRate||20)*delta);
            RTS.ParticleSystem.spawnHarvest(game.particles, squad.x, squad.y, "gold");
        }
    },

    _nearestNode: function(game, squad) {
        var best = null, bestD = Infinity;
        game.resourceNodes.forEach(function(n) {
            if (n.depleted) return;
            var dx = n.x-squad.x, dy = n.y-squad.y;
            var d  = Math.sqrt(dx*dx+dy*dy);
            if (d < bestD) { bestD = d; best = n; }
        });
        return best;
    },

    _nearestBuilding: function(game, squad) {
        var best = null, bestD = Infinity;
        game.buildings.forEach(function(b) {
            if (b.team !== "blue") return;
            var dx = b.x-squad.x, dy = b.y-squad.y;
            var d  = Math.sqrt(dx*dx+dy*dy);
            if (d < bestD) { bestD = d; best = b; }
        });
        return best;
    }
};