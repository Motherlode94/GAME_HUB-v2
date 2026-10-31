window.RTS = window.RTS || {};
/* Transport orders: B to board nearby infantry, D to disembark selected carriers.
 * Embarked squads are removed from the active simulation until disembark.
 * APC carries 2 squads; heavy helicopter 3; Blackhawk 2.
 */
RTS.TransportSystem = {
    capacity: function(carrier) {
        if (!carrier || !carrier.def) return 0;
        if (carrier.typeName === "apc") return 2;
        if (carrier.typeName === "heavy_transport_heli") return 3;
        if (carrier.typeName === "blackhawk") return 2;
        return 0;
    },
    board: function(game) {
        var selected = game.selectedSquads.filter(function(s) { return s.team === "blue" && !s.isDead(); });
        var carriers = selected.filter(function(s) { return RTS.TransportSystem.capacity(s) > 0; });
        var infantry = selected.filter(function(s) { return s.def && s.def.category === "infantry"; });
        var count = 0;
        carriers.forEach(function(carrier) {
            carrier.passengers = carrier.passengers || [];
            infantry.slice().forEach(function(s) {
                if (carrier.passengers.length >= RTS.TransportSystem.capacity(carrier)) return;
                if (Math.hypot(s.x - carrier.x, s.y - carrier.y) > 110) return;
                carrier.passengers.push(s);
                game.squads = game.squads.filter(function(unit) { return unit !== s; });
                game.selectedSquads = game.selectedSquads.filter(function(unit) { return unit !== s; });
                s.selected = false;
                s.target = null;
                s._nav = null;
                infantry.splice(infantry.indexOf(s), 1);
                count++;
            });
        });
        return count;
    },
    disembark: function(game) {
        var count = 0;
        game.selectedSquads.forEach(function(carrier) {
            if (carrier.team !== "blue" || !RTS.TransportSystem.capacity(carrier) || !carrier.passengers) return;
            var occupants = carrier.passengers.splice(0);
            occupants.forEach(function(s,i) {
                var angle = i * Math.PI * 2 / Math.max(1,occupants.length);
                s.x = Math.max(24,Math.min(RTS.WORLD_W-24,carrier.x+Math.cos(angle)*65));
                s.y = Math.max(24,Math.min(RTS.WORLD_H-24,carrier.y+Math.sin(angle)*65));
                s.target = null;
                s._nav = null;
                s.selected = false;
                RTS.SquadSystem._updateFormation(s);
                game.squads.push(s);
                count++;
            });
        });
        return count;
    },
    update: function(game) {
        game.squads.forEach(function(carrier) {
            if (carrier.passengers && carrier.passengers.length && carrier.isDead()) {
                carrier.passengers.length = 0; // passengers lost with destroyed carrier
            }
        });
    }
};
