window.RTS = window.RTS || {};

RTS.WorkerSystem = {
    update: function(game, delta) {
        game.squads.forEach(function(squad) {
            if (squad.team !== "blue") return;
            var mode = squad.def && squad.def.combatMode;
            if (squad.typeName === "supply_truck" || squad.typeName === "ammo_carrier") RTS.WorkerSystem._tickSupply(game, squad, delta);
            if (mode === "harvest")  RTS.WorkerSystem._tickHarvest(game, squad, delta);
            if (mode === "repair") {
                if (squad.typeName === "combat_medic") RTS.WorkerSystem._tickMedic(game, squad, delta);
                else RTS.WorkerSystem._tickRepair(game, squad, delta);
            }
        });
    },

    _tickSupply: function(game, truck, delta) {
        // Automatic field replenishment for friendly combat units near supply trucks.
        truck._supplyClock = (truck._supplyClock || 0) + delta;
        if (truck._supplyClock < 1) return;
        truck._supplyClock -= 1;
        game.squads.forEach(function(s) {
            if (s === truck || s.team !== truck.team || s.isDead() ||
                !s.ammoCapacity || s.ammo >= s.ammoCapacity) return;
            if (Math.hypot(s.x - truck.x, s.y - truck.y) > 115) return;
            var available = Math.floor((game.resources && game.resources.ammo) || 0);
            var transfer = Math.min(12, s.ammoCapacity - s.ammo, available);
            if (transfer <= 0) return;
            s.ammo += transfer;
            game.resources.ammo -= transfer;
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

    // Medical teams heal existing infantry members without resurrecting casualties.
    _tickMedic: function(game, medic, delta) {
        var target = null, bestDist = Infinity;
        game.squads.forEach(function(squad) {
            if (squad === medic || squad.team !== medic.team || !squad.def ||
                squad.def.category !== "infantry" || squad.isDead()) return;
            var injured = squad.aliveMembers().some(function(m) { return m.hp < m.maxHp; });
            if (!injured) return;
            var d = Math.hypot(squad.x - medic.x, squad.y - medic.y);
            if (d < bestDist) { bestDist = d; target = squad; }
        });
        if (!target) return;
        var radius = medic.def.repairRange || 65;
        if (bestDist > radius) {
            // Do not override a move order issued by the player.
            if (!medic.target) medic.target = {x:target.x,y:target.y};
            return;
        }
        var healing = (medic.def.repairRate || 16) * delta;
        var wounded = target.aliveMembers().filter(function(m) { return m.hp < m.maxHp; });
        if (!wounded.length) return;
        var perMember = healing / wounded.length;
        wounded.forEach(function(m) { m.hp = Math.min(m.maxHp, m.hp + perMember); });
    },

    _tickRepair: function(game, squad, delta) {
        // Engineers maintain both structures and damaged land/air vehicles.
        // Explicit move orders take precedence over automatic servicing.
        if (squad.target && !squad._autoRepairTarget) return;
        var best = null, bestD = Infinity, kind = null;
        game.buildings.forEach(function(b) {
            if (b.team !== squad.team || b.hp <= 0 || b.hp >= b.maxHp) return;
            var d = Math.hypot(b.x - squad.x, b.y - squad.y);
            if (d < bestD) { best = b; bestD = d; kind = "building"; }
        });
        game.squads.forEach(function(other) {
            if (other === squad || other.team !== squad.team || other.isDead() || !other.def) return;
            if (other.def.category !== "vehicle" && other.def.category !== "air") return;
            var damaged = other.aliveMembers().some(function(m) { return m.hp < m.maxHp; }) ||
                (other.engineDamage || 0) > 0 || (other.rotorDamage || 0) > 0;
            if (!damaged) return;
            var d = Math.hypot(other.x - squad.x, other.y - squad.y);
            if (d < bestD) { best = other; bestD = d; kind = "unit"; }
        });
        if (!best) {
            if (squad._autoRepairTarget) squad.target = null;
            squad._autoRepairTarget = null;
            return;
        }
        var rr = squad.def.repairRange || 30;
        if (bestD > rr) {
            squad.target = {x:best.x,y:best.y};
            squad._autoRepairTarget = best;
            return;
        }
        if (squad._autoRepairTarget) squad.target = null;
        squad._autoRepairTarget = null;
        var amount = (squad.def.repairRate || 20) * delta;
        if (kind === "building") {
            best.hp = Math.min(best.maxHp, best.hp + amount);
        } else {
            var wounded = best.aliveMembers().filter(function(m) { return m.hp < m.maxHp; });
            if (wounded.length) {
                var each = amount / wounded.length;
                wounded.forEach(function(m) { m.hp = Math.min(m.maxHp, m.hp + each); });
            }
            // Field service gradually restores engine/rotor mobility.
            best.engineDamage = Math.max(0, (best.engineDamage || 0) - delta * 0.07);
            best.rotorDamage = Math.max(0, (best.rotorDamage || 0) - delta * 0.07);
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