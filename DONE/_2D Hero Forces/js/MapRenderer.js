var RTS = RTS || {};
RTS.Game = RTS.Game || {};
RTS.Game.Map = RTS.Game.Map || {};

/**
 * MapRenderer — Moteur de rendu multi-couches inspiré de Company of Heroes.
 *
 * Couches de rendu (ordre) :
 *  1. Terrain (image de carte)
 *  2. Overlay de secteurs (Voronoï coloré)
 *  3. Frontières de secteurs (tirets animés + lueur)
 *  4. Points de capture (icône, anneau de capture, pulsation)
 *  5. Grille de navigation (debug optionnel)
 *  6. Brouillard de guerre (inexploré/exploré/visible)
 *  7. Vignette (assombrissement des bords)
 *  8. Minimap (coin inférieur droit)
 *  9. HUD (barre supérieure, ressources, infos secteur)
 */
RTS.Game.Map.MapRenderer = function(imagePath, onLoadCallback) {

    this.image       = new Image();
    this.imageLoaded = false;
    this.time        = 0;           // secondes écoulées (pour les animations)

    // Canvas hors-écran pour l'overlay de secteur (reconstruit uniquement si sectorsDirty)
    this.sectorCanvas = null;

    // Canvas hors-écran pour le brouillard de guerre
    this.fogCanvas    = null;
    this.fogNeedsRebuild = true;

    // Options
    this.showNavGrid    = false;    // Basculer avec la touche G
    this.showSectors    = true;

    // Palette par propriétaire
    this.ownerPalette = {
        allied:  { fill: [41,  98,  255], border: '#4477ff', glow: 'rgba(41,98,255,0.55)',  text: '#7aaaff' },
        axis:    { fill: [210, 30,  30 ], border: '#ee3333', glow: 'rgba(210,30,30,0.55)',   text: '#ff7777' },
        neutral: { fill: [150, 150, 150], border: '#aaaaaa', glow: 'rgba(150,150,150,0.35)', text: '#cccccc' }
    };

    var self = this;

    this.image.onload = function() {
        self.imageLoaded = true;
        if (onLoadCallback) onLoadCallback(self.image.width, self.image.height);
    };

    this.image.onerror = function() {
        // Image absente — on utilise une taille par défaut et un terrain procédural
        console.warn('[MapRenderer] Image non trouvée, terrain procédural utilisé.');
        if (onLoadCallback) onLoadCallback(3840, 2880);
    };

    this.image.src = imagePath;
};

// ---------------------------------------------------------------------------
//  POINT D'ENTRÉE PRINCIPAL
// ---------------------------------------------------------------------------

/**
 * Rendu complet d'une frame.
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLCanvasElement}        canvas
 * @param {RTS.Engine.Camera}        camera
 * @param {RTS.Game.Map.NavGrid}     navGrid  (peut être null pendant le chargement)
 */
RTS.Game.Map.MapRenderer.prototype.render = function(ctx, canvas, camera, navGrid, dt, squads) {
    this.time += (dt !== undefined ? dt : 0.016);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // === Espace MONDE (transformé par la caméra) ===
    ctx.save();
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    this._renderTerrain(ctx, canvas);

    if (navGrid) {
        if (this.showSectors) {
            this._renderSectorOverlay(ctx, camera, navGrid);
            this._renderSectorBorders(ctx, camera, navGrid);
        }
        this._renderCapturePoints(ctx, camera, navGrid);
        if (this.showNavGrid) this._renderNavGrid(ctx, camera, navGrid);
        this._renderFog(ctx, camera, navGrid);
    }

    ctx.restore();
    // === Fin espace monde ===

    // === Espace ÉCRAN ===
    this._renderVignette(ctx, canvas);
    if (navGrid) {
        this._renderMinimap(ctx, canvas, camera, navGrid, squads || []);
        this._renderHUD(ctx, canvas, camera, navGrid);
    }
};

// ---------------------------------------------------------------------------
//  COUCHE 1 — TERRAIN
// ---------------------------------------------------------------------------

RTS.Game.Map.MapRenderer.prototype._renderTerrain = function(ctx, canvas) {
    if (this.imageLoaded) {
        // Légère désaturation militaire via globalAlpha + filtre (si supporté)
        ctx.drawImage(this.image, 0, 0);

        // Teinte verdâtre militaire subtile sur le terrain
        ctx.fillStyle = 'rgba(20, 35, 10, 0.12)';
        ctx.fillRect(0, 0, this.image.width, this.image.height);
    } else {
        // Terrain procédural si l'image est absente
        this._renderProceduralTerrain(ctx, 3840, 2880);
    }
};

RTS.Game.Map.MapRenderer.prototype._renderProceduralTerrain = function(ctx, w, h) {
    // Fond herbe
    var grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0,    '#2d3a10');
    grad.addColorStop(0.4,  '#3a4e15');
    grad.addColorStop(0.7,  '#344812');
    grad.addColorStop(1,    '#29380e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Variation de texture (patches de couleurs)
    for (var i = 0; i < 120; i++) {
        var px = ((i * 317 + 53) % w);
        var py = ((i * 211 + 77) % h);
        var pr = 30 + (i % 5) * 18;
        var n  = (i % 7) / 7;

        if (n < 0.2) {
            ctx.fillStyle = 'rgba(60,40,20,0.35)';          // boue
        } else if (n < 0.4) {
            ctx.fillStyle = 'rgba(28,50,10,0.4)';           // forêt dense
        } else if (n < 0.55) {
            ctx.fillStyle = 'rgba(80,65,40,0.25)';          // chemin
        } else {
            ctx.fillStyle = 'rgba(45,60,20,0.2)';           // herbe variée
        }

        ctx.beginPath();
        ctx.ellipse(px, py, pr, pr * 0.6, n * Math.PI, 0, Math.PI * 2);
        ctx.fill();
    }

    // Routes principales
    ctx.strokeStyle = 'rgba(100,80,50,0.5)';
    ctx.lineWidth   = 18;
    ctx.lineCap     = 'round';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.88);
    ctx.bezierCurveTo(w * 0.25, h * 0.75, w * 0.5, h * 0.52, w, h * 0.15);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(w * 0.2, h);
    ctx.bezierCurveTo(w * 0.35, h * 0.65, w * 0.65, h * 0.45, w * 0.8, 0);
    ctx.stroke();

    // Reflet route (bande centrale)
    ctx.strokeStyle = 'rgba(130,105,70,0.3)';
    ctx.lineWidth   = 6;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.88);
    ctx.bezierCurveTo(w * 0.25, h * 0.75, w * 0.5, h * 0.52, w, h * 0.15);
    ctx.stroke();

    // Ruines / décombres
    for (var j = 0; j < 8; j++) {
        var rx = (j * 283 + 100) % w;
        var ry = (j * 197 + 80) % h;
        ctx.fillStyle = 'rgba(70,60,50,0.45)';
        ctx.fillRect(rx, ry, 40 + j * 10, 28 + j * 5);
        ctx.strokeStyle = 'rgba(50,40,30,0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(rx, ry, 40 + j * 10, 28 + j * 5);
    }
};

// ---------------------------------------------------------------------------
//  COUCHE 2 — OVERLAY SECTEURS (canvas hors-écran lissé)
// ---------------------------------------------------------------------------

RTS.Game.Map.MapRenderer.prototype._renderSectorOverlay = function(ctx, camera, navGrid) {
    if (navGrid.sectorsDirty || !this.sectorCanvas) {
        this._buildSectorCanvas(navGrid);
        navGrid.sectorsDirty = false;
    }

    ctx.save();
    ctx.globalAlpha = 0.30;
    // Upscale avec lissage pour des frontières douces et non pixélisées
    ctx.imageSmoothingEnabled  = true;
    ctx.imageSmoothingQuality  = 'high';
    ctx.drawImage(this.sectorCanvas, 0, 0, navGrid.mapWidth, navGrid.mapHeight);
    ctx.restore();
};

/**
 * Construit un canvas (1px par tuile) avec la couleur de chaque secteur.
 * Sera upscalé avec lissage → frontières douces sans artefacts de grille.
 */
RTS.Game.Map.MapRenderer.prototype._buildSectorCanvas = function(navGrid) {
    var cols = navGrid.cols;
    var rows = navGrid.rows;

    var offscreen = document.createElement('canvas');
    offscreen.width  = cols;
    offscreen.height = rows;
    var offCtx    = offscreen.getContext('2d');
    var imageData = offCtx.createImageData(cols, rows);
    var data      = imageData.data;

    var palette = this.ownerPalette;

    for (var y = 0; y < rows; y++) {
        for (var x = 0; x < cols; x++) {
            var tile = navGrid.getTile(x, y);
            if (!tile || tile.sectorId < 0) continue;

            var owner = navGrid.sectors[tile.sectorId].owner;
            var c     = (palette[owner] || palette.neutral).fill;
            var i     = (y * cols + x) * 4;

            data[i]     = c[0];
            data[i + 1] = c[1];
            data[i + 2] = c[2];
            data[i + 3] = 200;   // alpha ~78%
        }
    }

    offCtx.putImageData(imageData, 0, 0);
    this.sectorCanvas = offscreen;
};

// ---------------------------------------------------------------------------
//  COUCHE 3 — FRONTIÈRES DE SECTEURS (tirets animés)
// ---------------------------------------------------------------------------

RTS.Game.Map.MapRenderer.prototype._renderSectorBorders = function(ctx, camera, navGrid) {
    var cs     = navGrid.cellSize;
    var bounds = camera.getViewBounds();
    var dashOffset = (this.time * 28) % 24;

    var startX = Math.max(0, Math.floor(bounds.x / cs) - 1);
    var startY = Math.max(0, Math.floor(bounds.y / cs) - 1);
    var endX   = Math.min(navGrid.cols - 2, Math.ceil((bounds.x + bounds.width)  / cs) + 1);
    var endY   = Math.min(navGrid.rows - 2, Math.ceil((bounds.y + bounds.height) / cs) + 1);

    // Collecte des segments par propriétaire de secteur
    var segments = { allied: [], axis: [], neutral: [] };

    for (var y = startY; y <= endY; y++) {
        for (var x = startX; x <= endX; x++) {
            var tile  = navGrid.getTile(x, y);
            if (!tile || tile.fogState === 0) continue;

            var right = navGrid.getTile(x + 1, y);
            var down  = navGrid.getTile(x, y + 1);

            if (right && right.fogState > 0 && tile.sectorId !== right.sectorId) {
                var owner = navGrid.sectors[tile.sectorId] ? navGrid.sectors[tile.sectorId].owner : 'neutral';
                (segments[owner] || segments.neutral).push({
                    x1: (x + 1) * cs, y1: y * cs,
                    x2: (x + 1) * cs, y2: (y + 1) * cs
                });
            }
            if (down && down.fogState > 0 && tile.sectorId !== down.sectorId) {
                var owner2 = navGrid.sectors[tile.sectorId] ? navGrid.sectors[tile.sectorId].owner : 'neutral';
                (segments[owner2] || segments.neutral).push({
                    x1: x * cs,       y1: (y + 1) * cs,
                    x2: (x + 1) * cs, y2: (y + 1) * cs
                });
            }
        }
    }

    ctx.save();
    ctx.setLineDash([10, 7]);

    for (var owner in segments) {
        var segs    = segments[owner];
        if (segs.length === 0) continue;
        var palette = this.ownerPalette[owner] || this.ownerPalette.neutral;

        // Passe LUEUR
        ctx.lineDashOffset  = -dashOffset;
        ctx.strokeStyle     = palette.glow;
        ctx.lineWidth       = 5 / camera.zoom;
        ctx.beginPath();
        for (var i = 0; i < segs.length; i++) {
            ctx.moveTo(segs[i].x1, segs[i].y1);
            ctx.lineTo(segs[i].x2, segs[i].y2);
        }
        ctx.stroke();

        // Passe PRINCIPALE
        ctx.lineDashOffset  = -dashOffset;
        ctx.strokeStyle     = palette.border;
        ctx.lineWidth       = 2 / camera.zoom;
        ctx.beginPath();
        for (var j = 0; j < segs.length; j++) {
            ctx.moveTo(segs[j].x1, segs[j].y1);
            ctx.lineTo(segs[j].x2, segs[j].y2);
        }
        ctx.stroke();
    }

    ctx.setLineDash([]);
    ctx.restore();
};

// ---------------------------------------------------------------------------
//  COUCHE 4 — POINTS DE CAPTURE
// ---------------------------------------------------------------------------

RTS.Game.Map.MapRenderer.prototype._renderCapturePoints = function(ctx, camera, navGrid) {
    var self = this;
    navGrid.capturePoints.forEach(function(cp) {
        // Culling : hors-vue ?
        var s = camera.worldToScreen(cp.x, cp.y);
        if (s.x < -100 || s.x > camera.viewWidth + 100) return;
        if (s.y < -100 || s.y > camera.viewHeight + 100) return;
        self._drawCapturePoint(ctx, cp, camera);
    });
};

RTS.Game.Map.MapRenderer.prototype._drawCapturePoint = function(ctx, cp, camera) {
    var x       = cp.x;
    var y       = cp.y;
    var t       = this.time;
    var pulse   = 0.85 + Math.sin(t * 2.8) * 0.15;
    var palette = this.ownerPalette[cp.owner] || this.ownerPalette.neutral;
    var r       = cp.isHQ ? 30 : 22;
    var iconR   = r * 0.62;

    ctx.save();

    // --- Halo extérieur pulsant ---
    var glowGrad = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * 3.0 * pulse);
    var gRGB     = (this.ownerPalette[cp.owner] || this.ownerPalette.neutral).fill;
    glowGrad.addColorStop(0, 'rgba(' + gRGB[0] + ',' + gRGB[1] + ',' + gRGB[2] + ',0.45)');
    glowGrad.addColorStop(1, 'rgba(' + gRGB[0] + ',' + gRGB[1] + ',' + gRGB[2] + ',0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(x, y, r * 3.0 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // --- Cercle de fond ---
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle   = 'rgba(8, 8, 12, 0.80)';
    ctx.fill();
    ctx.strokeStyle = palette.border;
    ctx.lineWidth   = cp.isHQ ? 4 : 3;
    ctx.stroke();

    // --- Arc de progression de capture ---
    var progress = cp.captureProgress / 100;
    if (progress > 0) {
        ctx.beginPath();
        ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
        ctx.strokeStyle = palette.border;
        ctx.lineWidth   = 5;
        ctx.stroke();
    }

    // --- Disque intérieur ---
    ctx.beginPath();
    ctx.arc(x, y, iconR, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(5, 5, 10, 0.85)';
    ctx.fill();

    // --- Icône du type ---
    ctx.fillStyle   = palette.text;
    ctx.textAlign   = 'center';
    ctx.textBaseline = 'middle';

    if (cp.isHQ) {
        // Drapeau stylisé (mât + drapeau)
        var flagX  = x - 5;
        var flagY1 = y - iconR * 0.6;
        var flagY2 = y + iconR * 0.6;
        ctx.strokeStyle = palette.text;
        ctx.lineWidth   = 2;
        ctx.beginPath();
        ctx.moveTo(flagX, flagY1);
        ctx.lineTo(flagX, flagY2);
        ctx.stroke();
        ctx.fillStyle = palette.border;
        ctx.beginPath();
        ctx.moveTo(flagX,      flagY1);
        ctx.lineTo(flagX + 12, flagY1 + 5);
        ctx.lineTo(flagX,      flagY1 + 10);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle  = palette.text;
        ctx.font       = 'bold 8px "Courier New"';
        ctx.fillText('QG', x + 3, y + iconR * 0.3);

    } else if (cp.type === 'fuel') {
        // Goutte de carburant
        ctx.font      = 'bold 14px Arial';
        ctx.fillStyle = palette.text;
        ctx.fillText('⛽', x, y);

    } else if (cp.type === 'munitions') {
        // Obus
        ctx.font      = 'bold 13px Arial';
        ctx.fillStyle = palette.text;
        ctx.fillText('💣', x, y);

    } else if (cp.type === 'vp') {
        // Étoile de victoire
        this._drawStar(ctx, x, y, 5, iconR * 0.85, iconR * 0.38, palette.border);

    } else if (cp.type === 'outpost') {
        // Avant-poste ennemi — croix de visée rouge
        ctx.strokeStyle = palette.border;
        ctx.lineWidth   = 2.5;
        ctx.beginPath(); ctx.moveTo(x - iconR*0.7, y); ctx.lineTo(x + iconR*0.7, y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x, y - iconR*0.7); ctx.lineTo(x, y + iconR*0.7); ctx.stroke();
        ctx.beginPath(); ctx.arc(x, y, iconR*0.4, 0, Math.PI*2);
        ctx.strokeStyle = palette.border; ctx.lineWidth = 1.5; ctx.stroke();
        // Texte d'alerte
        ctx.fillStyle = palette.text; ctx.font = 'bold 7px "Courier New"';
        ctx.fillText('⚠', x, y + iconR * 0.72);
    }

    // --- Barre de progression de capture ---
    if (!cp.isHQ) {
        var barW = r * 2.8;
        var barH2 = 5;
        var barX = x - barW / 2;
        var barY2 = y + r + 6;
        var progress2 = cp.captureProgress / 100;

        // Fond
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(barX, barY2, barW, barH2);

        // Remplissage selon propriétaire
        ctx.fillStyle = palette.border;
        ctx.fillRect(barX, barY2, barW * progress2, barH2);

        // Bordure
        ctx.strokeStyle = palette.border;
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY2, barW, barH2);
    }

    // --- Ligne de poteau ---
    var poleH = r + 18;
    ctx.strokeStyle = 'rgba(200,200,200,0.5)';
    ctx.lineWidth   = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(x, y + r);
    ctx.lineTo(x, y + poleH);
    ctx.stroke();
    ctx.setLineDash([]);

    // --- Étiquette ---
    var labelY = y + poleH + 12;
    ctx.font    = 'bold 10px "Courier New"';
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(x - 38, labelY - 9, 76, 14);
    ctx.fillStyle   = palette.text;
    ctx.textAlign   = 'center';
    ctx.fillText(cp.name.toUpperCase(), x, labelY);

    ctx.restore();
};

/** Dessine une étoile à N branches. */
RTS.Game.Map.MapRenderer.prototype._drawStar = function(ctx, cx, cy, branches, outerR, innerR, color) {
    ctx.beginPath();
    for (var i = 0; i < branches * 2; i++) {
        var angle = (i * Math.PI / branches) - Math.PI / 2;
        var r     = (i % 2 === 0) ? outerR : innerR;
        ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
};

// ---------------------------------------------------------------------------
//  COUCHE 5 — GRILLE DE NAVIGATION (debug)
// ---------------------------------------------------------------------------

RTS.Game.Map.MapRenderer.prototype._renderNavGrid = function(ctx, camera, navGrid) {
    var cs     = navGrid.cellSize;
    var bounds = camera.getViewBounds();

    var startX = Math.max(0, Math.floor(bounds.x / cs));
    var startY = Math.max(0, Math.floor(bounds.y / cs));
    var endX   = Math.min(navGrid.cols - 1, Math.ceil((bounds.x + bounds.width)  / cs));
    var endY   = Math.min(navGrid.rows - 1, Math.ceil((bounds.y + bounds.height) / cs));

    ctx.save();
    ctx.lineWidth = 0.5 / camera.zoom;

    for (var y = startY; y <= endY; y++) {
        for (var x = startX; x <= endX; x++) {
            var tile = navGrid.getTile(x, y);
            if (!tile || tile.fogState === 0) continue;

            var tx = x * cs, ty = y * cs;

            if (!tile.walkable) {
                ctx.fillStyle = 'rgba(255,0,0,0.18)';
                ctx.fillRect(tx, ty, cs, cs);
            } else if (tile.terrainType === 'forest') {
                ctx.fillStyle = 'rgba(0,180,0,0.10)';
                ctx.fillRect(tx, ty, cs, cs);
            } else if (tile.terrainType === 'road') {
                ctx.fillStyle = 'rgba(200,150,80,0.12)';
                ctx.fillRect(tx, ty, cs, cs);
            }

            ctx.strokeStyle = 'rgba(255,255,255,0.07)';
            ctx.strokeRect(tx, ty, cs, cs);

            // Icônes couverture
            if (tile.cover === 1) {
                ctx.fillStyle = 'rgba(255,255,0,0.5)';
                ctx.font = Math.max(6, cs * 0.25) + 'px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('◐', tx + cs / 2, ty + cs / 2);
            } else if (tile.cover === 2) {
                ctx.fillStyle = 'rgba(0,255,0,0.5)';
                ctx.font = Math.max(6, cs * 0.25) + 'px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('●', tx + cs / 2, ty + cs / 2);
            }
        }
    }

    ctx.restore();
};

// ---------------------------------------------------------------------------
//  COUCHE 6 — BROUILLARD DE GUERRE
// ---------------------------------------------------------------------------

RTS.Game.Map.MapRenderer.prototype._renderFog = function(ctx, camera, navGrid) {
    var cs     = navGrid.cellSize;
    var bounds = camera.getViewBounds();

    var startX = Math.max(0, Math.floor(bounds.x / cs) - 1);
    var startY = Math.max(0, Math.floor(bounds.y / cs) - 1);
    var endX   = Math.min(navGrid.cols - 1, Math.ceil((bounds.x + bounds.width)  / cs) + 1);
    var endY   = Math.min(navGrid.rows - 1, Math.ceil((bounds.y + bounds.height) / cs) + 1);

    // Regrouper les tuiles par état pour batcher les fillRect
    var unexplored = [];
    var explored   = [];

    for (var y = startY; y <= endY; y++) {
        for (var x = startX; x <= endX; x++) {
            var tile = navGrid.getTile(x, y);
            if (!tile) continue;
            if (tile.fogState === 0) {
                unexplored.push({ x: x * cs, y: y * cs });
            } else if (tile.fogState === 1) {
                explored.push({ x: x * cs, y: y * cs });
            }
            // fogState === 2 : visible, rien à dessiner
        }
    }

    var tileSize = cs + 1; // +1 pour éviter les artefacts de jointure

    // Tuiles inexplorées — noir quasi-opaque
    ctx.fillStyle = 'rgba(0, 0, 0, 0.96)';
    for (var i = 0; i < unexplored.length; i++) {
        ctx.fillRect(unexplored[i].x, unexplored[i].y, tileSize, tileSize);
    }

    // Tuiles explorées — voile sombre semi-transparent
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    for (var j = 0; j < explored.length; j++) {
        ctx.fillRect(explored[j].x, explored[j].y, tileSize, tileSize);
    }

    // Bordure douce entre zones (gradient par-dessus les transitions)
    this._renderFogEdges(ctx, navGrid, startX, startY, endX, endY, cs);
};

RTS.Game.Map.MapRenderer.prototype._renderFogEdges = function(ctx, navGrid, sx, sy, ex, ey, cs) {
    // Adoucit la frontière inexploré→exploré avec un gradient radial par tuile-frontière
    for (var y = sy; y <= ey; y++) {
        for (var x = sx; x <= ex; x++) {
            var tile = navGrid.getTile(x, y);
            if (!tile || tile.fogState !== 1) continue;

            // Si une tuile voisine est visible, on ajoute un gradient d'atténuation
            var hasVisibleNeighbor = false;
            var dirs = [[-1,0],[1,0],[0,-1],[0,1]];
            for (var d = 0; d < dirs.length; d++) {
                var n = navGrid.getTile(x + dirs[d][0], y + dirs[d][1]);
                if (n && n.fogState === 2) { hasVisibleNeighbor = true; break; }
            }

            if (hasVisibleNeighbor) {
                var cx2 = (x + 0.5) * cs;
                var cy2 = (y + 0.5) * cs;
                var grad = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, cs * 1.2);
                grad.addColorStop(0, 'rgba(0,0,0,0)');
                grad.addColorStop(1, 'rgba(0,0,0,0.50)');
                ctx.fillStyle = grad;
                ctx.fillRect(x * cs - cs, y * cs - cs, cs * 3, cs * 3);
            }
        }
    }
};

// ---------------------------------------------------------------------------
//  COUCHE 7 — VIGNETTE
// ---------------------------------------------------------------------------

RTS.Game.Map.MapRenderer.prototype._renderVignette = function(ctx, canvas) {
    var w    = canvas.width;
    var h    = canvas.height;
    var grad = ctx.createRadialGradient(w / 2, h / 2, h * 0.30, w / 2, h / 2, h * 0.95);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.72)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
};

// ---------------------------------------------------------------------------
//  COUCHE 8 — MINIMAP
// ---------------------------------------------------------------------------

RTS.Game.Map.MapRenderer.prototype._renderMinimap = function(ctx, canvas, camera, navGrid, squads) {
    var MM_W  = 210;
    var MM_H  = Math.round(MM_W * navGrid.mapHeight / navGrid.mapWidth);
    var PAD   = 18;
    var mmX   = canvas.width  - MM_W - PAD;
    var mmY   = canvas.height - MM_H - PAD;
    var scaleX = MM_W / navGrid.mapWidth;
    var scaleY = MM_H / navGrid.mapHeight;

    // Stocker les bounds pour le clic (utilisé par Game.js)
    this._minimapBounds = { x: mmX, y: mmY, w: MM_W, h: MM_H, scaleX: scaleX, scaleY: scaleY };

    ctx.save();

    // --- Cadre ---
    ctx.fillStyle = 'rgba(0,0,0,0.88)';
    ctx.fillRect(mmX - 3, mmY - 3, MM_W + 6, MM_H + 6);
    ctx.strokeStyle = '#555';
    ctx.lineWidth   = 1;
    ctx.strokeRect(mmX - 3, mmY - 3, MM_W + 6, MM_H + 6);

    // --- Image de fond ---
    ctx.beginPath();
    ctx.rect(mmX, mmY, MM_W, MM_H);
    ctx.clip();

    if (this.imageLoaded) {
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(this.image, mmX, mmY, MM_W, MM_H);
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(mmX, mmY, MM_W, MM_H);
    } else {
        ctx.fillStyle = '#1e2a0e';
        ctx.fillRect(mmX, mmY, MM_W, MM_H);
    }

    // --- Overlay secteurs (canvas hors-écran réutilisé) ---
    if (this.sectorCanvas) {
        ctx.globalAlpha = 0.45;
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(this.sectorCanvas, mmX, mmY, MM_W, MM_H);
        ctx.globalAlpha = 1;
    }

    // --- Brouillard de guerre sur minimap (par blocs de tuiles) ---
    var step = Math.max(1, Math.floor(navGrid.cols / MM_W * 2));
    for (var y = 0; y < navGrid.rows; y += step) {
        for (var x = 0; x < navGrid.cols; x += step) {
            var tile = navGrid.getTile(x, y);
            if (!tile) continue;
            var mx = mmX + (x * navGrid.cellSize) * scaleX;
            var my = mmY + (y * navGrid.cellSize) * scaleY;
            var mw = navGrid.cellSize * scaleX * step + 1;
            var mh = navGrid.cellSize * scaleY * step + 1;

            if (tile.fogState === 0) {
                ctx.fillStyle = 'rgba(0,0,0,0.94)';
                ctx.fillRect(mx, my, mw, mh);
            } else if (tile.fogState === 1) {
                ctx.fillStyle = 'rgba(0,0,0,0.52)';
                ctx.fillRect(mx, my, mw, mh);
            }
        }
    }

    // --- Points de capture ---
    var palette = this.ownerPalette;
    navGrid.capturePoints.forEach(function(cp) {
        var mx = mmX + cp.x * scaleX;
        var my2 = mmY + cp.y * scaleY;
        var pal = palette[cp.owner] || palette.neutral;
        var cr  = cp.isHQ ? 5 : 3.5;

        ctx.beginPath();
        ctx.arc(mx, my2, cr, 0, Math.PI * 2);
        ctx.fillStyle = pal.border;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.lineWidth   = 1;
        ctx.stroke();
    });

    // --- Bâtiments alliés et axis (carrés colorés + indicateur prod) ---
    if (squads && squads._buildings) {
        squads._buildings.forEach(function(b) {
            if (!b.isBuilt) return;
            var bx2 = mmX + b.x * scaleX;
            var by3 = mmY + b.y * scaleY;
            var bs  = b.team === 'allied' ? 4 : 3.5;
            ctx.fillStyle   = b.team === 'allied' ? '#2255cc' : '#882222';
            ctx.strokeStyle = b.team === 'allied' ? '#88bbff' : '#ff8888';
            ctx.lineWidth   = 1;
            ctx.fillRect(bx2 - bs/2, by3 - bs/2, bs, bs);
            ctx.strokeRect(bx2 - bs/2, by3 - bs/2, bs, bs);
            // Point vert si en production
            if (b.queue && b.queue.length > 0) {
                ctx.beginPath();
                ctx.arc(bx2 + bs/2 + 1, by3 - bs/2 - 1, 1.5, 0, Math.PI * 2);
                ctx.fillStyle = '#44ff88';
                ctx.fill();
            }
        });
    }

    // --- Rectangle de vue caméra ---
    var vx = mmX + camera.x * scaleX;
    var vy = mmY + camera.y * scaleY;
    var vw = (camera.viewWidth  / camera.zoom) * scaleX;
    var vh = (camera.viewHeight / camera.zoom) * scaleY;

    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth   = 1;
    ctx.setLineDash([3, 2]);
    ctx.strokeRect(vx, vy, vw, vh);
    ctx.setLineDash([]);

    // --- Unités alliées et axis (points colorés) ---
    if (squads && squads.length) {
        squads.forEach(function(sq) {
            if (sq.dead || sq.isAerial) return;
            var ux = mmX + sq.x * scaleX;
            var uy = mmY + sq.y * scaleY;
            // N'afficher que si la tuile est visible (fog)
            var tile = navGrid.getTileAtWorld(sq.x, sq.y);
            if (!tile || tile.fogState === 0) return;
            var dotR = sq.isVehicle ? 2.5 : 1.8;
            ctx.beginPath();
            ctx.arc(ux, uy, dotR, 0, Math.PI * 2);
            ctx.fillStyle  = sq.team === 'allied' ? '#4488ff' : '#dd3333';
            ctx.fill();
            ctx.strokeStyle = sq.team === 'allied' ? '#aaccff' : '#ffaaaa';
            ctx.lineWidth = 0.5;
            ctx.stroke();
        });
    }

    ctx.restore();

    // Étiquette au-dessus (cliquable visuellement)
    ctx.fillStyle = 'rgba(180,200,160,0.65)';
    ctx.font      = '9px "Courier New"';
    ctx.textAlign = 'left';
    ctx.fillText('CARTE TACTIQUE  [clic = naviguer]', mmX, mmY - 7);
};

// ---------------------------------------------------------------------------
//  COUCHE 9 — HUD
// ---------------------------------------------------------------------------

RTS.Game.Map.MapRenderer.prototype._renderHUD = function(ctx, canvas, camera, navGrid) {
    var resources = navGrid.getResources();
    var allied    = resources.allied;
    var axis      = resources.axis;
    var w         = canvas.width;

    // --- Barre supérieure ---
    var barH = 52;
    ctx.fillStyle = 'rgba(0,0,0,0.78)';
    ctx.fillRect(0, 0, w, barH);

    // Ligne de séparation bas
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(0, barH); ctx.lineTo(w, barH);
    ctx.stroke();

    // --- Bloc Allié (gauche) ---
    ctx.fillStyle = '#4477ff';
    ctx.font      = 'bold 13px "Courier New"';
    ctx.textAlign = 'left';
    ctx.fillText('▶ ALLIÉS', 16, 20);

    ctx.fillStyle = 'rgba(100,140,255,0.85)';
    ctx.font      = '11px "Courier New"';
    ctx.fillText(
        '⛽ Carburant: +' + allied.fuel + '/min   ' +
        '💣 Munitions: +' + allied.munitions + '/min   ' +
        '🏳 Secteurs: ' + allied.sectors,
        16, 40
    );

    // --- Bloc central (VP + timer fictif) ---
    var vpAllied = allied.vp, vpAxis = axis.vp;
    var vpColor  = vpAllied ? '#4477ff' : vpAxis ? '#ee3333' : '#aaaaaa';
    var vpLabel  = vpAllied ? 'ALLIÉS' : vpAxis ? 'AXIS' : 'NEUTRE';

    ctx.textAlign = 'center';
    ctx.fillStyle = vpColor;
    ctx.font      = 'bold 14px "Courier New"';
    ctx.fillText('★ POINT DE VICTOIRE : ' + vpLabel, w / 2, 20);

    ctx.fillStyle = 'rgba(200,200,200,0.45)';
    ctx.font      = '10px "Courier New"';
    ctx.fillText(
        'Capturez tous les secteurs pour remporter la victoire',
        w / 2, 40
    );

    // --- Bloc Axis (droite) ---
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ee3333';
    ctx.font      = 'bold 13px "Courier New"';
    ctx.fillText('AXIS ◀', w - 16, 20);

    ctx.fillStyle = 'rgba(255,120,120,0.85)';
    ctx.font      = '11px "Courier New"';
    ctx.fillText(
        '⛽ Carburant: +' + axis.fuel + '/min   ' +
        '💣 Munitions: +' + axis.munitions + '/min   ' +
        '🏳 Secteurs: ' + axis.sectors,
        w - 16, 40
    );

    // --- Légende bas-gauche ---
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.font      = '10px "Courier New"';
    ctx.fillText(
        'WASD / ↑↓←→ : Déplacer   Molette : Zoom   Clic : Révéler / Capturer   G : Grille',
        14, canvas.height - 10
    );

    // --- Indicateur de zoom ---
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillText(
        'ZOOM : ' + Math.round(camera.zoom * 100) + '%',
        canvas.width - 230, canvas.height - 10
    );
};