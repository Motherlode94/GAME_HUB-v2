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

    if (mapId === 1) {
        // MAP 01 — CARENTAN : zone urbaine, combat de rues
        this.capturePoints = [
            { id:0, name:'QG Allié',       shortName:'QG',   x:mw*0.10, y:mh*0.87, type:'hq',        owner:'allied', captureProgress:100, captureRate:0, resourceType:null,        resourceRate:0,  isHQ:true  },
            { id:1, name:'Munitions A',     shortName:'MUN',  x:mw*0.27, y:mh*0.74, type:'munitions',  owner:'allied', captureProgress:100, captureRate:0, resourceType:'munitions',  resourceRate:10, isHQ:false },
            { id:2, name:'Carburant A',     shortName:'FUEL', x:mw*0.20, y:mh*0.46, type:'fuel',       owner:'neutral',captureProgress:0,   captureRate:0, resourceType:'fuel',       resourceRate:5,  isHQ:false },
            { id:3, name:'Point de Victoire',shortName:'VP',  x:mw*0.50, y:mh*0.50, type:'vp',         owner:'neutral',captureProgress:0,   captureRate:0, resourceType:null,        resourceRate:0,  isHQ:false },
            { id:4, name:'Carburant B',     shortName:'FUEL', x:mw*0.80, y:mh*0.54, type:'fuel',       owner:'neutral',captureProgress:0,   captureRate:0, resourceType:'fuel',       resourceRate:5,  isHQ:false },
            { id:5, name:'Munitions B',     shortName:'MUN',  x:mw*0.73, y:mh*0.26, type:'munitions',  owner:'axis',   captureProgress:100, captureRate:0, resourceType:'munitions',  resourceRate:10, isHQ:false },
            { id:6, name:'QG Axis',         shortName:'QG',   x:mw*0.90, y:mh*0.13, type:'hq',        owner:'axis',   captureProgress:100, captureRate:0, resourceType:null,        resourceRate:0,  isHQ:true  }
        ];

    } else if (mapId === 2) {
        // MAP 02 — MARAIS DU NORD : couloirs étroits, centre contesté
        this.capturePoints = [
            { id:0, name:'QG Allié',        shortName:'QG',   x:mw*0.50, y:mh*0.92, type:'hq',        owner:'allied', captureProgress:100, captureRate:0, resourceType:null,        resourceRate:0,  isHQ:true  },
            { id:1, name:'Dépôt Sud',        shortName:'MUN',  x:mw*0.25, y:mh*0.75, type:'munitions',  owner:'allied', captureProgress:100, captureRate:0, resourceType:'munitions',  resourceRate:10, isHQ:false },
            { id:2, name:'Passage Ouest',    shortName:'FUEL', x:mw*0.18, y:mh*0.50, type:'fuel',       owner:'neutral',captureProgress:0,   captureRate:0, resourceType:'fuel',       resourceRate:5,  isHQ:false },
            { id:3, name:'Village Central',  shortName:'VP',   x:mw*0.50, y:mh*0.48, type:'vp',         owner:'neutral',captureProgress:0,   captureRate:0, resourceType:null,        resourceRate:0,  isHQ:false },
            { id:4, name:'Passage Est',      shortName:'FUEL', x:mw*0.82, y:mh*0.50, type:'fuel',       owner:'neutral',captureProgress:0,   captureRate:0, resourceType:'fuel',       resourceRate:5,  isHQ:false },
            { id:5, name:'Dépôt Nord',       shortName:'MUN',  x:mw*0.75, y:mh*0.25, type:'munitions',  owner:'axis',   captureProgress:100, captureRate:0, resourceType:'munitions',  resourceRate:10, isHQ:false },
            { id:6, name:'QG Axis',          shortName:'QG',   x:mw*0.50, y:mh*0.08, type:'hq',        owner:'axis',   captureProgress:100, captureRate:0, resourceType:null,        resourceRate:0,  isHQ:true  }
        ];

    } else {
        // MAP 03 — BOCAGE NORMAND : campagne ouverte, flancs exposés
        this.capturePoints = [
            { id:0, name:'QG Allié',        shortName:'QG',   x:mw*0.12, y:mh*0.15, type:'hq',        owner:'allied', captureProgress:100, captureRate:0, resourceType:null,        resourceRate:0,  isHQ:true  },
            { id:1, name:'Ferme Ouest',      shortName:'MUN',  x:mw*0.22, y:mh*0.40, type:'munitions',  owner:'allied', captureProgress:100, captureRate:0, resourceType:'munitions',  resourceRate:10, isHQ:false },
            { id:2, name:'Lac Nord',         shortName:'FUEL', x:mw*0.45, y:mh*0.20, type:'fuel',       owner:'neutral',captureProgress:0,   captureRate:0, resourceType:'fuel',       resourceRate:5,  isHQ:false },
            { id:3, name:'Ruines Centrales', shortName:'VP',   x:mw*0.50, y:mh*0.55, type:'vp',         owner:'neutral',captureProgress:0,   captureRate:0, resourceType:null,        resourceRate:0,  isHQ:false },
            { id:4, name:'Lac Sud',          shortName:'FUEL', x:mw*0.55, y:mh*0.75, type:'fuel',       owner:'neutral',captureProgress:0,   captureRate:0, resourceType:'fuel',       resourceRate:5,  isHQ:false },
            { id:5, name:'Ferme Est',        shortName:'MUN',  x:mw*0.78, y:mh*0.60, type:'munitions',  owner:'axis',   captureProgress:100, captureRate:0, resourceType:'munitions',  resourceRate:10, isHQ:false },
            { id:6, name:'QG Axis',          shortName:'QG',   x:mw*0.88, y:mh*0.85, type:'hq',        owner:'axis',   captureProgress:100, captureRate:0, resourceType:null,        resourceRate:0,  isHQ:true  }
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
    var hq   = this.capturePoints[0];
    var mun  = this.capturePoints[1];

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

    var open   = [];
    var closed = {};

    startTile.g = 0;
    startTile.h = this._heuristic(startG.x, startG.y, endG.x, endG.y);
    startTile.f = startTile.h;
    open.push(startTile);
    startTile.inOpen = true;

    while (open.length > 0) {
        // Extraire le nœud avec le f le plus bas
        var current = open[0];
        var ci      = 0;
        for (var i = 1; i < open.length; i++) {
            if (open[i].f < current.f) { current = open[i]; ci = i; }
        }

        if (current.x === endG.x && current.y === endG.y) {
            return this._reconstructPath(current);
        }

        open.splice(ci, 1);
        current.inOpen  = false;
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
                if (!n.inOpen) { open.push(n); n.inOpen = true; }
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