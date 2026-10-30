window.RTS = window.RTS || {};

RTS.MinimapRenderer = {
    render: function(game) {
        var canvas = document.getElementById("minimap");
        var ctx    = canvas.getContext("2d");
        var mw = canvas.width, mh = canvas.height;
        var sx = mw / RTS.WORLD_W, sy = mh / RTS.WORLD_H;

        ctx.clearRect(0, 0, mw, mh);
        ctx.fillStyle = "#0d1117";
        ctx.fillRect(0, 0, mw, mh);

        // Nœuds
        if (game.resourceNodes) {
            game.resourceNodes.forEach(function(n) {
                if (n.depleted) return;
                var style = RTS.ResourceNode.STYLE[n.type];
                ctx.fillStyle = style.color;
                ctx.fillRect(n.x * sx - 1.5, n.y * sy - 1.5, 3, 3);
            });
        }

        // Squads (bleu, allié vert, ennemi rouge)
        if (game.squads) {
            game.squads.forEach(function(s) {
                if (s.isDead && s.isDead()) return;
                if (s.team === 'red' && !RTS.FogOfWar.isVisible(game, s.x, s.y)) return;
                ctx.fillStyle = s.team === "blue"  ? "#3d8ef5"
                              : s.team === "ally"  ? "#2ecc71"
                              : "#e74c3c";
                var dot = (s.def && s.def.category === "vehicle") ? 3 : 2;
                ctx.fillRect(s.x * sx - dot/2, s.y * sy - dot/2, dot, dot);
            });
        }

        // Bâtiments
        if (game.buildings) {
            game.buildings.forEach(function(b) {
                ctx.fillStyle = b.team === "blue" ? "#3d8ef5" : b.team === "ally" ? "#2ecc71" : "#e74c3c";
                ctx.fillRect(b.x * sx - 3, b.y * sy - 3, 6, 6);
            });
        }

        // Viewport
        var cam = game.camera;
        if (cam) {
            ctx.strokeStyle = "rgba(255,255,255,0.3)";
            ctx.lineWidth   = 1;
            ctx.strokeRect(
                cam.x * sx, cam.y * sy,
                (game.canvas.width  / cam.zoom) * sx,
                (game.canvas.height / cam.zoom) * sy
            );
        }
    }
};