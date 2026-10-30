const mapGrid = [];
let mapCache = null;

// Coins du chemin (en cases). Les ennemis suivent ces segments dans l'ordre.
const PATH_CORNERS = [
    { x: 0, y: 2 }, { x: 5, y: 2 }, { x: 5, y: 7 }, { x: 2, y: 7 },
    { x: 2, y: 12 }, { x: 10, y: 12 }, { x: 10, y: 3 }, { x: 15, y: 3 },
    { x: 15, y: 9 }, { x: 19, y: 9 }
];

// Liste de toutes les cases du chemin
const path = (() => {
    const tiles = [];
    for (let i = 0; i < PATH_CORNERS.length - 1; i++) {
        const a = PATH_CORNERS[i];
        const b = PATH_CORNERS[i + 1];
        const steps = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y));
        for (let s = 0; s < steps; s++) {
            tiles.push({
                x: a.x + Math.sign(b.x - a.x) * s,
                y: a.y + Math.sign(b.y - a.y) * s
            });
        }
    }
    tiles.push(PATH_CORNERS[PATH_CORNERS.length - 1]);
    return tiles;
})();

// Points de passage en pixels, avec entrée et sortie hors écran
const pathWaypoints = (() => {
    const pts = PATH_CORNERS.map((p) => ({
        x: gridToWorld(p.x) + TILE_SIZE / 2,
        y: gridToWorld(p.y) + TILE_SIZE / 2
    }));
    pts.unshift({ x: -TILE_SIZE / 2, y: pts[0].y });
    const last = pts[pts.length - 1];
    pts.push({ x: MAP_COLS * TILE_SIZE + TILE_SIZE / 2, y: last.y });
    return pts;
})();

function isNearPath(x, y) {
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            const nx = x + dx;
            const ny = y + dy;
            if (mapGrid[nx] && mapGrid[nx][ny] === TILE_TYPES.PATH) return true;
        }
    }
    return false;
}

function initMap() {
    for (let x = 0; x < MAP_COLS; x++) {
        mapGrid[x] = [];
        for (let y = 0; y < MAP_ROWS; y++) {
            mapGrid[x][y] = TILE_TYPES.GRASS;
        }
    }

    path.forEach((point) => {
        if (point.x >= 0 && point.x < MAP_COLS && point.y >= 0 && point.y < MAP_ROWS) {
            mapGrid[point.x][point.y] = TILE_TYPES.PATH;
        }
    });

    // Quelques rochers/arbres non constructibles, loin du chemin
    const rand = createSeededRandom(1337);
    for (let x = 0; x < MAP_COLS; x++) {
        for (let y = 0; y < MAP_ROWS; y++) {
            if (mapGrid[x][y] === TILE_TYPES.GRASS && !isNearPath(x, y) && rand() < 0.1) {
                mapGrid[x][y] = TILE_TYPES.BLOCKED;
            }
        }
    }

    buildMapCache();
}

// Le décor est dessiné une seule fois dans un canvas hors écran (pas de scintillement)
function buildMapCache() {
    mapCache = document.createElement('canvas');
    mapCache.width = MAP_COLS * TILE_SIZE;
    mapCache.height = MAP_ROWS * TILE_SIZE;
    const c = mapCache.getContext('2d');
    const rand = createSeededRandom(42);

    for (let x = 0; x < MAP_COLS; x++) {
        for (let y = 0; y < MAP_ROWS; y++) {
            const px = x * TILE_SIZE;
            const py = y * TILE_SIZE;
            const tileType = mapGrid[x][y];

            // Herbe
            const v = ((x * 7 + y * 13) % 4) * 4;
            c.fillStyle = `rgb(${45 + v}, ${82 + v}, ${24 + v})`;
            c.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            c.fillStyle = 'rgba(120, 200, 80, 0.18)';
            for (let i = 0; i < 4; i++) {
                c.fillRect(px + rand() * TILE_SIZE, py + rand() * TILE_SIZE, 1, 3);
            }

            if (tileType === TILE_TYPES.PATH) {
                const g = c.createLinearGradient(px, py, px + TILE_SIZE, py + TILE_SIZE);
                g.addColorStop(0, '#9b8262');
                g.addColorStop(1, '#7a6043');
                c.fillStyle = g;
                c.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                c.fillStyle = 'rgba(70, 45, 20, 0.35)';
                for (let i = 0; i < 6; i++) {
                    c.fillRect(px + rand() * TILE_SIZE, py + rand() * TILE_SIZE, 2, 2);
                }
            } else if (tileType === TILE_TYPES.BLOCKED) {
                if (rand() < 0.5) {
                    // Arbre
                    c.fillStyle = 'rgba(0,0,0,0.3)';
                    c.beginPath();
                    c.ellipse(px + 22, py + 30, 13, 6, 0, 0, Math.PI * 2);
                    c.fill();
                    c.fillStyle = '#5b3a1e';
                    c.fillRect(px + 17, py + 22, 6, 10);
                    c.fillStyle = '#1f6b2a';
                    c.beginPath();
                    c.arc(px + 20, py + 16, 12, 0, Math.PI * 2);
                    c.fill();
                    c.fillStyle = '#2f8f3c';
                    c.beginPath();
                    c.arc(px + 16, py + 12, 6, 0, Math.PI * 2);
                    c.fill();
                } else {
                    // Rocher
                    c.fillStyle = 'rgba(0,0,0,0.3)';
                    c.beginPath();
                    c.ellipse(px + 21, py + 29, 14, 5, 0, 0, Math.PI * 2);
                    c.fill();
                    c.fillStyle = '#7d7d7d';
                    c.beginPath();
                    c.moveTo(px + 7, py + 29);
                    c.lineTo(px + 12, py + 13);
                    c.lineTo(px + 24, py + 9);
                    c.lineTo(px + 33, py + 18);
                    c.lineTo(px + 34, py + 29);
                    c.closePath();
                    c.fill();
                    c.fillStyle = '#a0a0a0';
                    c.beginPath();
                    c.moveTo(px + 12, py + 13);
                    c.lineTo(px + 24, py + 9);
                    c.lineTo(px + 20, py + 19);
                    c.closePath();
                    c.fill();
                }
            }

            c.strokeStyle = 'rgba(0, 0, 0, 0.08)';
            c.lineWidth = 1;
            c.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
        }
    }

    drawPathArrows(c);
    drawStartEndMarkers(c);
}

function drawMap(ctx) {
    if (mapCache) ctx.drawImage(mapCache, 0, 0);
}

function drawPathArrows(ctx) {
    ctx.fillStyle = 'rgba(255, 240, 210, 0.25)';
    for (let i = 2; i < path.length - 1; i += 3) {
        const current = path[i];
        const next = path[i + 1];
        const cx = gridToWorld(current.x) + TILE_SIZE / 2;
        const cy = gridToWorld(current.y) + TILE_SIZE / 2;
        const angle = Math.atan2(next.y - current.y, next.x - current.x);

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(6, 0);
        ctx.lineTo(-4, 5);
        ctx.lineTo(-4, -5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}

function drawStartEndMarkers(ctx) {
    const marker = (point, fill, stroke, symbol) => {
        const x = gridToWorld(point.x) + TILE_SIZE / 2;
        const y = gridToWorld(point.y) + TILE_SIZE / 2;
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = stroke;
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(symbol, x, y + 1);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
    };
    marker(PATH_CORNERS[0], 'rgba(0, 255, 0, 0.3)', '#00ff00', '▶');
    marker(PATH_CORNERS[PATH_CORNERS.length - 1], 'rgba(255, 0, 0, 0.3)', '#ff3030', '✕');
}

function isValidTowerPosition(gridX, gridY) {
    if (gridX < 0 || gridX >= MAP_COLS || gridY < 0 || gridY >= MAP_ROWS) {
        return false;
    }
    if (mapGrid[gridX][gridY] !== TILE_TYPES.GRASS) {
        return false;
    }
    return !towers.some((tower) => tower.gridX === gridX && tower.gridY === gridY);
}
