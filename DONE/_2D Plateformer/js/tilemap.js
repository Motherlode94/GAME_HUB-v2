// ─────────────────────────────────────────────
//  tilemap.js  –  tile rendering (+ fallback)
// ─────────────────────────────────────────────
class TileMap {
    constructor(tileSize, map, tileImage) {
        this.tileSize  = tileSize;
        this.map       = map;
        this.tileImage = tileImage;

        this.cols        = map[0] ? map[0].length : 0;
        this.rows        = map.length;
        this.worldWidth  = this.cols * tileSize;
        this.worldHeight = this.rows * tileSize;
    }

    draw(ctx, camera) {
        var ts       = this.tileSize;
        var startCol = Math.max(0,             Math.floor(camera.x              / ts));
        var endCol   = Math.min(this.cols - 1, Math.floor((camera.x + camera.width)  / ts));
        var startRow = Math.max(0,             Math.floor(camera.y              / ts));
        var endRow   = Math.min(this.rows - 1, Math.floor((camera.y + camera.height) / ts));

        for (var row = startRow; row <= endRow; row++) {
            for (var col = startCol; col <= endCol; col++) {
                if (this.map[row] && this.map[row][col] === 1) {
                    var dx = col * ts;
                    var dy = row * ts;

                    if (this.tileImage) {
                        ctx.drawImage(this.tileImage, dx, dy, ts, ts);
                    } else {
                        // Procedural fallback tile
                        ctx.fillStyle = '#5C3D1E';
                        ctx.fillRect(dx, dy, ts, ts);
                        ctx.fillStyle = '#7A5230';
                        ctx.fillRect(dx, dy, ts, 7);
                        ctx.fillStyle = '#4A6741';
                        ctx.fillRect(dx, dy, ts, 4);
                        ctx.strokeStyle = '#3A2510';
                        ctx.lineWidth = 1;
                        ctx.strokeRect(dx + 0.5, dy + 0.5, ts - 1, ts - 1);
                    }
                    // Tile silhouette and top-edge highlights improve readability over the background.
                    if (!this.isSolid(col, row - 1)) {
                        ctx.fillStyle = 'rgba(220,255,198,.22)';
                        ctx.fillRect(dx + 2, dy + 1, ts - 4, 2);
                        ctx.fillStyle = 'rgba(18,33,17,.21)';
                        ctx.fillRect(dx, dy + ts - 5, ts, 5);
                    }
                    if (!this.isSolid(col - 1, row)) {
                        ctx.fillStyle = 'rgba(255,255,255,.075)';
                        ctx.fillRect(dx, dy + 4, 2, ts - 6);
                    }
                    // Deterministic stone texture details; no random flicker.
                    if (((row * 17 + col * 23) % 7) === 0) {
                        ctx.fillStyle = 'rgba(25,23,17,.17)';
                        ctx.fillRect(dx + ts * .38, dy + ts * .52, ts * .22, 2);
                    }
                }
            }
        }
    }

    isSolid(col, row) {
        return !!(this.map[row] && this.map[row][col] === 1);
    }
}