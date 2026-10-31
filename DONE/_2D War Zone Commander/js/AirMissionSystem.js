window.RTS = window.RTS || {};
/* Air command: P patrol between present point and cursor; V recon pass; O return to home.
   All commands operate on selected friendly aircraft. Direct player orders cancel missions. */
RTS.AirMissionSystem = {
    issue: function(game, mode, point) {
        var aircraft = game.selectedSquads.filter(function(s) {
            return s.team === "blue" && !s.isDead() && s.def && s.def.category === "air";
        });
        aircraft.forEach(function(s) {
            if (!s.airHome) s.airHome = {x:s.x,y:s.y};
            s.attackMove = false;
            s._nav = null;
            if (mode === "return") {
                s.airMission = {mode:"return",destination:{x:s.airHome.x,y:s.airHome.y}};
            } else {
                var aim = {x:Math.max(25,Math.min(RTS.WORLD_W-25,point.x)),
                           y:Math.max(25,Math.min(RTS.WORLD_H-25,point.y))};
                s.airMission = mode === "patrol" ?
                    {mode:"patrol",points:[{x:s.x,y:s.y},aim],next:1} :
                    {mode:"recon",destination:aim};
            }
            s.target = null;
        });
        return aircraft.length;
    },
    cancel: function(squad) {
        if (squad) squad.airMission = null;
    },
    update: function(game) {
        game.squads.forEach(function(s) {
            if (s.isDead() || !s.airMission || !s.def || s.def.category !== "air") return;
            var m=s.airMission;
            if (m.mode === "patrol") {
                var waypoint=m.points[m.next];
                if (!waypoint) {s.airMission=null;return;}
                if (Math.hypot(s.x-waypoint.x,s.y-waypoint.y) < 12 && !s.target) {
                    m.next = (m.next+1)%m.points.length;
                    waypoint=m.points[m.next];
                }
                s.target={x:waypoint.x,y:waypoint.y};
            } else {
                var dest=m.destination;
                if (Math.hypot(s.x-dest.x,s.y-dest.y) < 12) {
                    s.airMission=null;
                    s.target=null;
                    return;
                }
                s.target={x:dest.x,y:dest.y};
            }
        });
    }
};
