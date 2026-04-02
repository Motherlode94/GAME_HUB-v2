// ─────────────────────────────────────────────
//  physics.js  –  AABB tile collision
// ─────────────────────────────────────────────
function resolveCollisions(entity, tilemap) {
    var tileSize = tilemap.tileSize;
    var map      = tilemap.map;

    // ── X axis ────────────────────────────────
    entity.x += entity.velocityX;

    var tilesX = getOverlappingTiles(entity, tileSize);
    for (var i = 0; i < tilesX.length; i++) {
        var tx = tilesX[i].tileX;
        var ty = tilesX[i].tileY;
        if (!map[ty] || map[ty][tx] !== 1) continue;
        var tr = { x: tx * tileSize, y: ty * tileSize, width: tileSize, height: tileSize };
        if (!overlaps(entity, tr)) continue;
        if (entity.velocityX > 0) {
            entity.x = tr.x - entity.width;
        } else if (entity.velocityX < 0) {
            entity.x = tr.x + tileSize;
        }
        entity.velocityX = 0;
    }

    // ── Y axis ────────────────────────────────
    entity.y += entity.velocityY;

    var tilesY = getOverlappingTiles(entity, tileSize);
    for (var j = 0; j < tilesY.length; j++) {
        var tx2 = tilesY[j].tileX;
        var ty2 = tilesY[j].tileY;
        if (!map[ty2] || map[ty2][tx2] !== 1) continue;
        var tr2 = { x: tx2 * tileSize, y: ty2 * tileSize, width: tileSize, height: tileSize };
        if (!overlaps(entity, tr2)) continue;
        if (entity.velocityY >= 0) {
            entity.y = tr2.y - entity.height;
        } else {
            entity.y = tr2.y + tileSize;
        }
        entity.velocityY = 0;
    }

    // ── Ground check (2px probe) ──────────────
    entity.isGrounded = false;
    var below = { x: entity.x + 2, y: entity.y + entity.height, width: entity.width - 4, height: 2 };
    var groundTiles = getOverlappingTiles(below, tileSize);
    for (var k = 0; k < groundTiles.length; k++) {
        var gx = groundTiles[k].tileX;
        var gy = groundTiles[k].tileY;
        if (!map[gy] || map[gy][gx] !== 1) continue;
        var gt = { x: gx * tileSize, y: gy * tileSize, width: tileSize, height: tileSize };
        if (overlaps(below, gt)) { entity.isGrounded = true; break; }
    }
}

function overlaps(a, b) {
    return (
        a.x            < b.x + b.width  &&
        a.x + a.width  > b.x            &&
        a.y            < b.y + b.height &&
        a.y + a.height > b.y
    );
}

function getOverlappingTiles(entity, tileSize) {
    var left   = Math.floor(entity.x                       / tileSize);
    var right  = Math.floor((entity.x + entity.width  - 1) / tileSize);
    var top    = Math.floor(entity.y                       / tileSize);
    var bottom = Math.floor((entity.y + entity.height - 1) / tileSize);
    var tiles  = [];
    for (var row = top; row <= bottom; row++) {
        for (var col = left; col <= right; col++) {
            tiles.push({ tileX: col, tileY: row });
        }
    }
    return tiles;
}