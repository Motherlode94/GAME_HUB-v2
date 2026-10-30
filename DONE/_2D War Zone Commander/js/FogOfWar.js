window.RTS = window.RTS || {};
/* Player-centered exploration with persistent discoveries and current vision.
   Rendering-only: targeting is intentionally unchanged until LOS rules are integrated. */
RTS.FogOfWar = {
    cell: 40,
    update: function(game) {
        var cols = Math.ceil(RTS.WORLD_W / this.cell);
        var rows = Math.ceil(RTS.WORLD_H / this.cell);
        if (!game.fog || game.fog.cols !== cols || game.fog.rows !== rows) {
            game.fog = { cols: cols, rows: rows, seen: new Uint8Array(cols * rows), visible: new Uint8Array(cols * rows) };
        }
        var fog = game.fog, cell = this.cell;
        fog.visible.fill(0);
        game.squads.forEach(function(s) {
            if ((s.team !== "blue" && s.team !== "ally") || s.isDead()) return;
            var radius = s.def && s.def.category === "air" ? 400 : 250;
            reveal(s.x, s.y, radius);
        });
        game.buildings.forEach(function(b) {
            if (b.team === "blue" && b.hp > 0) reveal(b.x, b.y, b.type === "tower" ? 340 : 185);
        });
        function reveal(x, y, radius) {
            var left = Math.max(0, Math.floor((x - radius) / cell));
            var right = Math.min(cols - 1, Math.floor((x + radius) / cell));
            var top = Math.max(0, Math.floor((y - radius) / cell));
            var bottom = Math.min(rows - 1, Math.floor((y + radius) / cell));
            for (var cy = top; cy <= bottom; cy++) for (var cx = left; cx <= right; cx++) {
                var px = (cx + .5) * cell - x, py = (cy + .5) * cell - y;
                if (px * px + py * py > radius * radius) continue;
                var i = cy * cols + cx; fog.visible[i] = 1; fog.seen[i] = 1;
            }
        }
    },
    render: function(game, ctx) {
        if (!game.fog || game.setupPhase) return;
        var f = game.fog, cell = this.cell;
        for (var y = 0; y < f.rows; y++) for (var x = 0; x < f.cols; x++) {
            var i = y * f.cols + x;
            if (f.visible[i]) continue;
            ctx.fillStyle = f.seen[i] ? "rgba(3,9,15,.68)" : "rgba(1,5,10,.96)";
            ctx.fillRect(x * cell, y * cell, cell + .5, cell + .5);
        }
    }
};