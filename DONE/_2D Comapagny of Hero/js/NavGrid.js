var RTS = RTS || {};
RTS.Game = RTS.Game || {};
RTS.Game.Map = RTS.Game.Map || {};

/**
 * NavGrid — Grille de navigation complète.
 *
 * Fonctionnalités :
 *  - Génération de tuiles avec types de terrain
 *  - Système de secteurs (régions Voronoï basées sur les points de contrôle)
 *  - Points de capture (HQ, Carburant, Munitions, Point de Victoire)
 *  - Brouillard de guerre (révélation progressive)
 *  - Pathfinding A* (chemin entre deux points du monde)
 */
RTS.Game.Map.NavGrid = function(mapWidth, mapHeight, cellSize, mapId) {

    this.cellSize  = cellSize;
    this.cols      = Math.floor(mapWidth  / cellSize);
    this.rows      = Math.floor(mapHeight / cellSize);
    this.mapWidth  = mapWidth;
    this.mapHeight = mapHeight;
    this.mapId     = mapId || 1;

    this.grid          = [];
    this.sectors       = [];
    this.capturePoints = [];

    this.sectorsDirty = true;   // flag de rebuild de l'overlay secteur

    this._defineSectors();
    this._generate();
    this._assignSectors();
    this._applyTerrainNoise();
    this._revealStartingArea();
};

// ---------------------------------------------------------------------------
//  INITIALISATION
// ---------------------------------------------------------------------------

/**
 * Définit les points de capture qui serviront d'ancres Voronoï pour les secteurs.
 * Positions en pourcentage de la carte pour s'adapter à toute taille.
 */
RTS.Game.Map.NavGrid.prototype._defineSectors = function() {
    var mw = this.mapWidth;
    var mh = this.mapHeight;
    var mapId = this.mapId || 1;

    // Helper pour créer un CP standard
    function cp(id, name, sName, px, py, type, owner, prog, rType, rRate, hq, outpost) {
        return { id:id, name:name, shortName:sName,
                 x:mw*px, y:mh*py, type:type, owner:owner,
                 captureProgress:prog, captureRate:0,
                 resourceType:rType, resourceRate:rRate,
                 isHQ:!!hq, isOutpost:!!outpost };
    }

    if (mapId === 1) {
        // MAP 01 — CARENTAN : diagonale bas-gauche → haut-droite
        // Espacement minimum ~0.18 entre chaque point
        this.capturePoints = [
            cp( 0,'QG Allié',         'QG',   0.04,0.94,'hq',        'allied', 100,null,        0, true,  false),
            cp( 1,'QG Axis',          'QG',   0.96,0.06,'hq',        'axis',   100,null,        0, true,  false),
            // Zone alliée
            cp( 2,'Dépôt Munitions',  'MUN',  0.12,0.76,'munitions', 'allied', 100,'munitions', 10, false, false),
            cp( 3,'Carburant Ouest',  'FUEL', 0.05,0.52,'fuel',      'neutral',  0,'fuel',       8, false, false),
            // Quart allié
            cp( 4,'Église',           'EGL',  0.24,0.34,'munitions', 'neutral',  0,'munitions',  7, false, false),
            cp( 7,'Marché',           'MRC',  0.18,0.60,'munitions', 'neutral',  0,'munitions',  6, false, false),
            // Centre
            cp( 5,'Carrefour VP',     'VP',   0.50,0.50,'vp',        'neutral',  0, null,        0, false, false),
            // Quart axis
            cp( 8,'Usine Nord',       'USN',  0.76,0.28,'fuel',      'neutral',  0,'fuel',       6, false, false),
            cp( 6,'Gare Est',         'GAR',  0.82,0.65,'fuel',      'neutral',  0,'fuel',       7, false, false),
            // Zone axis
            cp( 9,'Carburant Est',    'FUEL', 0.95,0.46,'fuel',      'neutral',  0,'fuel',       8, false, false),
            cp(10,'Arsenal Axis',     'MUN',  0.88,0.22,'munitions', 'axis',    100,'munitions', 10, false, false),
            // Avant-postes axis (zones avancées bien distinctes)
            cp(11,'Avant-Poste Sud',  'APO',  0.62,0.78,'outpost',   'axis',      0, null,       0, false, true),
            cp(12,'Avant-Poste Nord', 'APO',  0.68,0.16,'outpost',   'axis',      0, null,       0, false, true)
        ];

    } else if (mapId === 2) {
        // MAP 02 — MARAIS DU NORD : QG haut et bas, flancs larges
        this.capturePoints = [
            cp( 0,'QG Allié',         'QG',   0.50,0.96,'hq',        'allied', 100,null,        0, true,  false),
            cp( 1,'QG Axis',          'QG',   0.50,0.04,'hq',        'axis',   100,null,        0, true,  false),
            // Flanc gauche allié
            cp( 2,'Dépôt Sud-Ouest',  'MUN',  0.12,0.82,'munitions', 'allied', 100,'munitions', 10, false, false),
            cp( 3,'Passage Ouest',    'FUEL', 0.05,0.58,'fuel',      'neutral',  0,'fuel',       8, false, false),
            // Centre-bas
            cp( 7,'Croisée Sud',      'CRS',  0.30,0.70,'munitions', 'neutral',  0,'munitions',  6, false, false),
            cp( 6,'Marécage',         'MRC',  0.14,0.36,'fuel',      'neutral',  0,'fuel',       7, false, false),
            // Centre exact
            cp( 5,'Village VP',       'VP',   0.50,0.50,'vp',        'neutral',  0, null,        0, false, false),
            // Centre-haut
            cp( 4,'Pont Nord',        'PNT',  0.50,0.26,'munitions', 'neutral',  0,'munitions',  7, false, false),
            cp( 8,'Verger Est',       'VRG',  0.86,0.36,'fuel',      'neutral',  0,'fuel',       6, false, false),
            // Flanc droit axis
            cp( 9,'Passage Est',      'FUEL', 0.95,0.58,'fuel',      'neutral',  0,'fuel',       8, false, false),
            cp(10,'Dépôt Nord-Est',   'MUN',  0.88,0.18,'munitions', 'axis',    100,'munitions', 10, false, false),
            // Avant-postes (coins opposés)
            cp(11,'Bunker Ouest',     'BNK',  0.18,0.18,'outpost',   'axis',      0, null,       0, false, true),
            cp(12,'Bunker Est',       'BNK',  0.82,0.78,'outpost',   'axis',      0, null,       0, false, true)
        ];

    } else {
        // MAP 03 — BOCAGE NORMAND : diagonale haut-gauche → bas-droite
        this.capturePoints = [
            cp( 0,'QG Allié',         'QG',   0.04,0.06,'hq',        'allied', 100,null,        0, true,  false),
            cp( 1,'QG Axis',          'QG',   0.96,0.94,'hq',        'axis',   100,null,        0, true,  false),
            // Zone alliée
            cp( 2,'Ferme Alliée',     'MUN',  0.14,0.22,'munitions', 'allied', 100,'munitions', 10, false, false),
            cp( 3,'Lac Nord-Ouest',   'FUEL', 0.06,0.46,'fuel',      'neutral',  0,'fuel',       8, false, false),
            // Quart allié
            cp( 4,'Moulin Ouest',     'MLN',  0.26,0.36,'munitions', 'neutral',  0,'munitions',  7, false, false),
            cp( 7,'Hameau Centre',    'HMS',  0.28,0.65,'munitions', 'neutral',  0,'munitions',  6, false, false),
            // Centre
            cp( 5,'Ruines VP',        'VP',   0.50,0.50,'vp',        'neutral',  0, null,        0, false, false),
            // Quart axis
            cp( 6,'Colline 112',      'H112', 0.72,0.36,'fuel',      'neutral',  0,'fuel',       7, false, false),
            cp( 8,'Route Nationale',  'RN',   0.74,0.64,'fuel',      'neutral',  0,'fuel',       6, false, false),
            // Zone axis
            cp( 9,'Lac Sud-Est',      'FUEL', 0.94,0.52,'fuel',      'neutral',  0,'fuel',       8, false, false),
            cp(10,'Dépôt Axis',       'MUN',  0.86,0.78,'munitions', 'axis',    100,'munitions', 10, false, false),
            // Avant-postes axis
            cp(11,'Poste Avancé Est', 'PAN',  0.76,0.18,'outpost',   'axis',      0, null,       0, false, true),
            cp(12,'Poste Avancé Sud', 'PAS',  0.60,0.84,'outpost',   'axis',      0, null,       0, false, true)
        ];
    }

    this.sectors = this.capturePoints.map(function(cp) {
        return { id:cp.id, name:cp.name, owner:cp.owner, capturePointId:cp.id, tileCount:0 };
    });
};

/** Génère la grille de tuiles. */
RTS.Game.Map.NavGrid.prototype._generate = function() {
    for (var y = 0; y < this.rows; y++) {
        this.grid[y] = [];
        for (var x = 0; x < this.cols; x++) {
            this.grid[y][x] = new RTS.Game.Map.NavTile(x, y);
        }
    }
};

/**
 * Attribue chaque tuile au secteur (point de capture) le plus proche — algorithme Voronoï.
 */
RTS.Game.Map.NavGrid.prototype._assignSectors = function() {
    var cs = this.cellSize;
    var cps = this.capturePoints;

    for (var y = 0; y < this.rows; y++) {
        for (var x = 0; x < this.cols; x++) {
            var tile = this.grid[y][x];
            var wx   = (x + 0.5) * cs;
            var wy   = (y + 0.5) * cs;

            var nearestId   = 0;
            var nearestDist = Infinity;

            for (var i = 0; i < cps.length; i++) {
                var dx   = wx - cps[i].x;
                var dy   = wy - cps[i].y;
                var dist = dx * dx + dy * dy;
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearestId   = i;
                }
            }

            tile.sectorId = nearestId;
            this.sectors[nearestId].tileCount++;
        }
    }
};

/**
 * Applique une variation de terrain pseudo-aléatoire (déterministe) pour rendre
 * certaines tuiles impraticables (eau, forêt dense) et varier les coûts.
 */
RTS.Game.Map.NavGrid.prototype._applyTerrainNoise = function() {
    var cols = this.cols;
    var rows = this.rows;

    for (var y = 0; y < rows; y++) {
        for (var x = 0; x < cols; x++) {
            var tile = this.grid[y][x];

            // Bruit pseudo-aléatoire déterministe (pas de Math.random pour reproductibilité)
            var n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
            n = n - Math.floor(n); // 0..1

            // Variation de terrain
            if (n < 0.04) {
                tile.terrainType  = 'water';
                tile.walkable     = false;
                tile.movementCost = 99;
            } else if (n < 0.15) {
                tile.terrainType  = 'forest';
                tile.cover        = 1;
                tile.movementCost = 1.8;
            } else if (n < 0.20) {
                tile.terrainType  = 'mud';
                tile.movementCost = 2.2;
            } else if (n < 0.24) {
                tile.terrainType  = 'rubble';
                tile.cover        = 2;
                tile.movementCost = 1.5;
            } else if (n < 0.30) {
                tile.terrainType  = 'road';
                tile.movementCost = 0.7;
            }
        }
    }
};

/**
 * Révèle la zone de départ du joueur Allié (QG + premier secteur).
 */
RTS.Game.Map.NavGrid.prototype._revealStartingArea = function() {
    var hq  = this.capturePoints[0]; // QG allié
    var mun = this.capturePoints[2]; // premier dépôt allié
    this.revealFog(hq.x,  hq.y,  this.cellSize * 14);
    this.revealFog(mun.x, mun.y, this.cellSize * 7);
};

// ---------------------------------------------------------------------------
//  BROUILLARD DE GUERRE
// ---------------------------------------------------------------------------

/**
 * Révèle le brouillard de guerre autour d'un point du monde.
 * @param {number} worldX
 * @param {number} worldY
 * @param {number} radius  Rayon en pixels monde
 */
RTS.Game.Map.NavGrid.prototype.revealFog = function(worldX, worldY, radius) {
    var cs          = this.cellSize;
    var tileRadius  = Math.ceil(radius / cs);
    var centerX     = Math.floor(worldX / cs);
    var centerY     = Math.floor(worldY / cs);
    var r2          = tileRadius * tileRadius;
    var innerRadius = tileRadius * 0.75;
    var ir2         = innerRadius * innerRadius;

    for (var y = centerY - tileRadius - 1; y <= centerY + tileRadius + 1; y++) {
        for (var x = centerX - tileRadius - 1; x <= centerX + tileRadius + 1; x++) {
            var tile = this.getTile(x, y);
            if (!tile) continue;

            var dx   = x - centerX;
            var dy   = y - centerY;
            var dist2 = dx * dx + dy * dy;

            if (dist2 <= ir2) {
                // Zone interne : pleinement visible
                if (tile.fogState < 2) tile.fogState = 2;
            } else if (dist2 <= r2) {
                // Zone de pénombre : exploré
                if (tile.fogState < 1) tile.fogState = 1;
            }
        }
    }
};

/**
 * Fait "vieillir" la visibilité (visible → exploré) pour simuler le FdG dynamique.
 * Appelez par exemple toutes les X secondes.
 */
RTS.Game.Map.NavGrid.prototype.ageFog = function() {
    for (var y = 0; y < this.rows; y++) {
        for (var x = 0; x < this.cols; x++) {
            var tile = this.grid[y][x];
            if (tile.fogState === 2) tile.fogState = 1;
        }
    }
};

// ---------------------------------------------------------------------------
//  SYSTÈME DE CAPTURE
// ---------------------------------------------------------------------------

/**
 * Met à jour la capture progressive de tous les points de contrôle.
 * Doit être appelé chaque frame depuis Game.js avec deltaTime et la liste des squads.
 *
 * Logique CoH :
 *  - Une escouade alliée dans le rayon → progress monte vers 100
 *  - Une escouade axis dans le rayon   → contesté (progress gelée ou descend)
 *  - Les deux présentes                → contestation (gelée)
 *  - Personne                          → progress se stabilise (ne monte pas)
 *  - Progress = 100 + owner allied  |  progress = 0 + owner axis
 *
 * @param {number}   deltaTime
 * @param {Array}    squads      Tableau de RTS.Game.Squad
 */
RTS.Game.Map.NavGrid.prototype.updateCapture = function(deltaTime, squads) {
    var CAPTURE_RADIUS = 80;   // rayon de capture en pixels monde
    var CAPTURE_RATE   = 10;   // points de progression par seconde (100 = ~10s)

    var self = this;

    this.capturePoints.forEach(function(cp) {
        if (cp.isHQ) return;

        // Compter les squads par équipe dans le rayon
        var alliedCount = 0;
        var axisCount   = 0;

        squads.forEach(function(sq) {
            if (sq.retreating) return;
            var dx   = sq.x - cp.x;
            var dy   = sq.y - cp.y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= CAPTURE_RADIUS) {
                if (sq.team === 'allied') alliedCount += sq.captureSpeed;
                else                     axisCount   += sq.captureSpeed;
            }
        });

        var wasContested = cp.contested;
        cp.contested     = alliedCount > 0 && axisCount > 0;

        // --- Logique de progression ---
        if (cp.contested) {
            // Contesté : rien ne bouge
            return;
        }

        if (alliedCount > 0) {
            // Alliés présents → progression vers 100
            cp.captureProgress += CAPTURE_RATE * alliedCount * deltaTime;
            cp.captureProgress  = Math.min(cp.captureProgress, 100);

            if (cp.captureProgress >= 100 && cp.owner !== 'allied') {
                cp.owner = 'allied';
                self.sectors[cp.id].owner = 'allied';
                self.sectorsDirty = true;
                self.revealFog(cp.x, cp.y, self.cellSize * 9);
                console.info('[NavGrid] Point capturé par les Alliés :', cp.name);
            }

        } else if (axisCount > 0) {
            // Axis présents → progression vers 0
            cp.captureProgress -= CAPTURE_RATE * axisCount * deltaTime;
            cp.captureProgress  = Math.max(cp.captureProgress, 0);

            if (cp.captureProgress <= 0 && cp.owner !== 'axis') {
                cp.owner = 'axis';
                self.sectors[cp.id].owner = 'axis';
                self.sectorsDirty = true;
                console.info('[NavGrid] Point capturé par l\'Axis :', cp.name);
            }

        } else {
            // Personne : on maintient la progression (ne monte ni descend)
            // Mais si le point n'appartient à personne et est à 50%, il reste à 50%
        }
    });
};

/**
 * Ancienne méthode conservée pour compatibilité (utilisée par l'IA en fallback).
 * @deprecated Utiliser updateCapture() à la place
 */
RTS.Game.Map.NavGrid.prototype.capturePoint = function(cpId, team) {
    var cp = this.capturePoints[cpId];
    if (!cp || cp.isHQ) return false;
    cp.owner = team;
    cp.captureProgress = team === 'allied' ? 100 : 0;
    this.sectors[cpId].owner = team;
    this.sectorsDirty = true;
    this.revealFog(cp.x, cp.y, this.cellSize * 9);
    return true;
};

/**
 * Retourne un résumé des ressources par équipe.
 */
RTS.Game.Map.NavGrid.prototype.getResources = function() {
    var resources = {
        allied: { fuel: 0, munitions: 0, sectors: 0, vp: false },
        axis:   { fuel: 0, munitions: 0, sectors: 0, vp: false }
    };

    this.capturePoints.forEach(function(cp) {
        if (cp.owner === 'allied' || cp.owner === 'axis') {
            resources[cp.owner].sectors++;
            if (cp.type === 'fuel')      resources[cp.owner].fuel      += cp.resourceRate;
            if (cp.type === 'munitions') resources[cp.owner].munitions += cp.resourceRate;
            if (cp.type === 'vp')        resources[cp.owner].vp = true;
        }
    });

    return resources;
};

// ---------------------------------------------------------------------------
//  MIN-HEAP pour l'open list A* (O(log n) au lieu de O(n))
// ---------------------------------------------------------------------------

RTS.Game.Map.NavGrid.prototype._heapPush = function(heap, tile) {
    heap.push(tile);
    var i = heap.length - 1;
    while (i > 0) {
        var parent = (i - 1) >> 1;
        if (heap[parent].f <= heap[i].f) break;
        var tmp = heap[parent]; heap[parent] = heap[i]; heap[i] = tmp;
        i = parent;
    }
};

RTS.Game.Map.NavGrid.prototype._heapPop = function(heap) {
    var top = heap[0];
    var last = heap.pop();
    if (heap.length > 0) {
        heap[0] = last;
        var i = 0;
        while (true) {
            var l = 2*i+1, r = 2*i+2, smallest = i;
            if (l < heap.length && heap[l].f < heap[smallest].f) smallest = l;
            if (r < heap.length && heap[r].f < heap[smallest].f) smallest = r;
            if (smallest === i) break;
            var tmp = heap[i]; heap[i] = heap[smallest]; heap[smallest] = tmp;
            i = smallest;
        }
    }
    return top;
};

// ---------------------------------------------------------------------------
//  PATHFINDING A*
// ---------------------------------------------------------------------------

/**
 * Recherche un chemin entre deux positions du monde.
 * Retourne un tableau de positions {x, y} en pixels monde, ou [] si aucun chemin.
 */
RTS.Game.Map.NavGrid.prototype.findPath = function(fromWorldX, fromWorldY, toWorldX, toWorldY) {
    var startG = this.worldToGrid(fromWorldX, fromWorldY);
    var endG   = this.worldToGrid(toWorldX,   toWorldY);

    var startTile = this.getTile(startG.x, startG.y);
    var endTile   = this.getTile(endG.x,   endG.y);

    if (!startTile || !endTile || !endTile.walkable) return [];

    // Remise à zéro
    for (var y = 0; y < this.rows; y++)
        for (var x = 0; x < this.cols; x++)
            this.grid[y][x].resetPathfinding();

    var open   = [];   // min-heap
    var closed = {};

    startTile.g = 0;
    startTile.h = this._heuristic(startG.x, startG.y, endG.x, endG.y);
    startTile.f = startTile.h;
    this._heapPush(open, startTile);
    startTile.inOpen = true;

    while (open.length > 0) {
        var current = this._heapPop(open);
        current.inOpen = false;

        if (current.x === endG.x && current.y === endG.y) {
            return this._reconstructPath(current);
        }

        current.inClosed = true;

        var neighbors = this._getNeighbors(current.x, current.y);
        for (var j = 0; j < neighbors.length; j++) {
            var n = neighbors[j];
            if (!n.walkable || n.inClosed) continue;

            var tentativeG = current.g + n.movementCost;
            if (tentativeG < n.g) {
                n.parent = current;
                n.g      = tentativeG;
                n.h      = this._heuristic(n.x, n.y, endG.x, endG.y);
                n.f      = n.g + n.h;
                if (!n.inOpen) { this._heapPush(open, n); n.inOpen = true; }
            }
        }
    }

    return []; // Aucun chemin trouvé
};

RTS.Game.Map.NavGrid.prototype._heuristic = function(x1, y1, x2, y2) {
    // Distance Octile (mieux que Manhattan pour les diagonales)
    var dx = Math.abs(x1 - x2);
    var dy = Math.abs(y1 - y2);
    return (dx + dy) + (Math.SQRT2 - 2) * Math.min(dx, dy);
};

RTS.Game.Map.NavGrid.prototype._reconstructPath = function(tile) {
    var path = [];
    var cs   = this.cellSize;
    var current = tile;
    while (current) {
        path.unshift({
            x: (current.x + 0.5) * cs,
            y: (current.y + 0.5) * cs
        });
        current = current.parent;
    }
    return path;
};

RTS.Game.Map.NavGrid.prototype._getNeighbors = function(x, y) {
    var neighbors = [];
    var dirs = [
        [-1, 0], [1, 0], [0, -1], [0, 1],      // Cardinal
        [-1,-1], [1,-1], [-1, 1], [1,  1]       // Diagonales
    ];
    for (var i = 0; i < dirs.length; i++) {
        var t = this.getTile(x + dirs[i][0], y + dirs[i][1]);
        if (t) neighbors.push(t);
    }
    return neighbors;
};

// ---------------------------------------------------------------------------
//  UTILITAIRES
// ---------------------------------------------------------------------------

RTS.Game.Map.NavGrid.prototype.getTile = function(x, y) {
    if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return null;
    return this.grid[y][x];
};

RTS.Game.Map.NavGrid.prototype.worldToGrid = function(worldX, worldY) {
    return {
        x: Math.floor(worldX / this.cellSize),
        y: Math.floor(worldY / this.cellSize)
    };
};

/** Retourne les couleurs RGBA d'un propriétaire de secteur. */
RTS.Game.Map.NavGrid.prototype.getSectorColor = function(owner, alpha) {
    alpha = (alpha !== undefined) ? alpha : 0.22;
    if (owner === 'allied') return 'rgba(41, 98, 255, '  + alpha + ')';
    if (owner === 'axis')   return 'rgba(210, 30, 30, '  + alpha + ')';
    return                         'rgba(155, 155, 155, ' + alpha + ')';
};
