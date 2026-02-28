const mapGrid = [];

const path = [
    { x: 0, y: 7 }, { x: 1, y: 7 }, { x: 2, y: 7 }, { x: 3, y: 7 }, { x: 4, y: 7 }, { x: 5, y: 7 },
    { x: 5, y: 6 }, { x: 5, y: 5 }, { x: 5, y: 4 },
    { x: 6, y: 4 }, { x: 7, y: 4 }, { x: 8, y: 4 }, { x: 9, y: 4 }, { x: 10, y: 4 }, { x: 11, y: 4 },
    { x: 11, y: 5 }, { x: 11, y: 6 }, { x: 11, y: 7 }, { x: 11, y: 8 }, { x: 11, y: 9 }, { x: 11, y: 10 },
    { x: 12, y: 10 }, { x: 13, y: 10 }, { x: 14, y: 10 }, { x: 15, y: 10 }, { x: 16, y: 10 }, { x: 17, y: 10 }, { x: 18, y: 10 }, { x: 19, y: 10 }
];

function initMap() {
    for (let x = 0; x < MAP_COLS; x++) {
        mapGrid[x] = [];
        for (let y = 0; y < MAP_ROWS; y++) {
            mapGrid[x][y] = TILE_TYPES.GRASS;
        }
    }

    path.forEach(point => {
        if (point.x >= 0 && point.x < MAP_COLS && point.y >= 0 && point.y < MAP_ROWS) {
            mapGrid[point.x][point.y] = TILE_TYPES.PATH;
        }
    });
}

function drawMap(ctx) {
    // Fond dégradé
    const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGradient.addColorStop(0, '#1a3a1a');
    bgGradient.addColorStop(1, '#0d1f0d');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    for (let x = 0; x < MAP_COLS; x++) {
        for (let y = 0; y < MAP_ROWS; y++) {
            const tileType = mapGrid[x][y];
            const px = x * TILE_SIZE;
            const py = y * TILE_SIZE;
            
            if (tileType === TILE_TYPES.PATH) {
                // Chemin avec dégradé
                const pathGradient = ctx.createLinearGradient(px, py, px + TILE_SIZE, py + TILE_SIZE);
                pathGradient.addColorStop(0, '#8b7355');
                pathGradient.addColorStop(1, '#6b5335');
                ctx.fillStyle = pathGradient;
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                
                // Texture du chemin
                ctx.fillStyle = 'rgba(101, 67, 33, 0.3)';
                for (let i = 0; i < 3; i++) {
                    const rx = px + Math.random() * TILE_SIZE;
                    const ry = py + Math.random() * TILE_SIZE;
                    ctx.fillRect(rx, ry, 2, 2);
                }
            } else {
                // Herbe avec variation
                const grassVariation = ((x + y) % 3) * 5;
                const r = 45 + grassVariation;
                const g = 80 + grassVariation;
                const b = 22 + grassVariation;
                ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                
                // Détails d'herbe
                ctx.fillStyle = 'rgba(34, 139, 34, 0.2)';
                for (let i = 0; i < 2; i++) {
                    const rx = px + Math.random() * TILE_SIZE;
                    const ry = py + Math.random() * TILE_SIZE;
                    ctx.fillRect(rx, ry, 1, 3);
                }
            }

            // Grille subtile
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.lineWidth = 1;
            ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
        }
    }
    
    // Flèches de direction sur le chemin
    drawPathArrows(ctx);
    
    // Marqueurs début et fin
    drawStartEndMarkers(ctx);
}

function drawPathArrows(ctx) {
    ctx.fillStyle = 'rgba(139, 115, 85, 0.3)';
    ctx.strokeStyle = 'rgba(139, 115, 85, 0.5)';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < path.length - 1; i++) {
        if (i % 3 !== 0) continue; // Flèches tous les 3 segments
        
        const current = path[i];
        const next = path[i + 1];
        const cx = gridToWorld(current.x) + TILE_SIZE / 2;
        const cy = gridToWorld(current.y) + TILE_SIZE / 2;
        const nx = gridToWorld(next.x) + TILE_SIZE / 2;
        const ny = gridToWorld(next.y) + TILE_SIZE / 2;
        
        const angle = Math.atan2(ny - cy, nx - cx);
        const arrowSize = 8;
        
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(arrowSize, arrowSize / 2);
        ctx.lineTo(arrowSize, -arrowSize / 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
    }
}

function drawStartEndMarkers(ctx) {
    // Début (vert)
    const startX = gridToWorld(path[0].x) + TILE_SIZE / 2;
    const startY = gridToWorld(path[0].y) + TILE_SIZE / 2;
    
    ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(startX, startY, 15, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('▶', startX, startY + 7);
    
    // Fin (rouge)
    const endPoint = path[path.length - 1];
    const endX = gridToWorld(endPoint.x) + TILE_SIZE / 2;
    const endY = gridToWorld(endPoint.y) + TILE_SIZE / 2;
    
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(endX, endY, 15, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('✕', endX, endY + 8);
    
    ctx.textAlign = 'left';
}

function isValidTowerPosition(gridX, gridY) {
    if (gridX < 0 || gridX >= MAP_COLS || gridY < 0 || gridY >= MAP_ROWS) {
        return false;
    }
    
    if (mapGrid[gridX][gridY] === TILE_TYPES.PATH) {
        return false;
    }

    const worldX = gridToWorld(gridX) + TILE_SIZE / 2;
    const worldY = gridToWorld(gridY) + TILE_SIZE / 2;
    
    return !towers.some(tower => 
        Math.abs(tower.x - worldX) < TILE_SIZE && 
        Math.abs(tower.y - worldY) < TILE_SIZE
    );
}

function getSpawnPoint() {
    return {
        x: gridToWorld(path[0].x) + TILE_SIZE / 2,
        y: gridToWorld(path[0].y) + TILE_SIZE / 2
    };
}