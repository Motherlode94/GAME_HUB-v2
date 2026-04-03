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
        // ── MAP 01 — CARENTAN ──────────────────────────────────────────────────
        // Rivière centrale N-S, ville industrielle à l'ouest, campagne à l'est.
        // Alliés : bas-gauche (zone urbaine dense). Axis : haut-droite (campagne).
        // Points calés sur les ponts, carrefours, usines et rives visibles.
        this.capturePoints = [
            cp( 0,'QG Allié',          'QG',   0.06,0.88,'hq',        'allied', 100,null,        0, true,  false),
            cp( 1,'QG Axis',           'QG',   0.88,0.08,'hq',        'axis',   100,null,        0, true,  false),
            // Zone alliée — quartier industriel ouest
            cp( 2,'Arsenal du Port',   'MUN',  0.14,0.72,'munitions', 'allied', 100,'munitions', 10, false, false),
            cp( 3,'Dépôt Carburant',   'FUEL', 0.08,0.48,'fuel',      'neutral',  0,'fuel',       8, false, false),
            // Ponts sur la rivière — axes de passage critiques
            cp( 4,'Pont Nord',         'PNT',  0.36,0.22,'munitions', 'neutral',  0,'munitions',  7, false, false),
            cp( 7,'Pont Central',      'PTC',  0.42,0.50,'munitions', 'neutral',  0,'munitions',  6, false, false),
            // VP — croisement routier au centre exact de la ville
            cp( 5,'Carrefour Central', 'VP',   0.50,0.46,'vp',        'neutral',  0, null,        0, false, false),
            // Rive est — zone industrielle et ferroviaire
            cp( 8,'Gare de Triage',    'GAR',  0.64,0.34,'fuel',      'neutral',  0,'fuel',       7, false, false),
            cp( 6,'Entrepôts Est',     'ENT',  0.68,0.60,'fuel',      'neutral',  0,'fuel',       6, false, false),
            // Zone axis — campagne nord-est
            cp( 9,'Ferme Axis',        'FRM',  0.82,0.42,'fuel',      'neutral',  0,'fuel',       8, false, false),
            cp(10,'Dépôt Munitions N', 'MUN',  0.76,0.18,'munitions', 'axis',    100,'munitions', 10, false, false),
            // Avant-postes — têtes de pont rive est
            cp(11,'Tête de Pont Sud',  'TPS',  0.54,0.74,'outpost',   'axis',      0, null,       0, false, true),
            cp(12,'Tête de Pont Nord', 'TPN',  0.58,0.18,'outpost',   'axis',      0, null,       0, false, true)
        ];

    } else if (mapId === 2) {
        // ── MAP 02 — PORT FLUVIAL ──────────────────────────────────────────────
        // Canaux multiples, chantier naval est, phare nord-est, île fortifiée sud-ouest.
        // Alliés : ouest (zone industrielle). Axis : est (port + chantier naval).
        // Ponts = goulots, île = flanc isolé, phare = point dominant.
        this.capturePoints = [
            cp( 0,'QG Allié',          'QG',   0.08,0.42,'hq',        'allied', 100,null,        0, true,  false),
            cp( 1,'QG Axis',           'QG',   0.86,0.30,'hq',        'axis',   100,null,        0, true,  false),
            // Zone alliée — complexe industriel ouest
            cp( 2,'Entrepôts Alliés',  'MUN',  0.16,0.26,'munitions', 'allied', 100,'munitions', 10, false, false),
            cp( 3,'Dépôt Fuel Ouest',  'FUEL', 0.12,0.60,'fuel',      'neutral',  0,'fuel',       8, false, false),
            // Ponts centraux — passages sur les canaux
            cp( 4,'Grand Pont',        'PNT',  0.38,0.46,'munitions', 'neutral',  0,'munitions',  7, false, false),
            cp( 7,'Pont Ferroviaire',  'PRF',  0.42,0.64,'munitions', 'neutral',  0,'munitions',  6, false, false),
            // VP — centre-ville au croisement des canaux
            cp( 5,'Écluse Centrale',   'VP',   0.50,0.50,'vp',        'neutral',  0, null,        0, false, false),
            // Phare nord-est — position dominante axis
            cp( 8,'Phare',             'PHA',  0.82,0.10,'fuel',      'neutral',  0,'fuel',       7, false, false),
            // Chantier naval est
            cp( 6,'Chantier Naval',    'CNV',  0.72,0.52,'fuel',      'neutral',  0,'fuel',       8, false, false),
            // Zone axis — port et quais
            cp( 9,'Quais du Port',     'QAI',  0.84,0.58,'fuel',      'neutral',  0,'fuel',       6, false, false),
            cp(10,'Arsenal Naval',     'MUN',  0.68,0.20,'munitions', 'axis',    100,'munitions', 10, false, false),
            // Île fortifiée sud-ouest — flanc isolé
            cp(11,'Île Fortifiée',     'ILE',  0.18,0.80,'outpost',   'axis',      0, null,       0, false, true),
            // Avant-poste nord — zone circulaire (circuits routiers)
            cp(12,'Terrain Circulaire','TRC',  0.74,0.08,'outpost',   'axis',      0, null,       0, false, true)
        ];

    } else if (mapId === 3) {
        // ── MAP 03 — BOCAGE NORMAND ────────────────────────────────────────────
        // Terrain bocager normand, lac nord-ouest, collines boisées, route nationale.
        // Alliés : haut-gauche. Axis : bas-droite.
        this.capturePoints = [
            cp( 0,'QG Allié',          'QG',   0.05,0.08,'hq',        'allied', 100,null,        0, true,  false),
            cp( 1,'QG Axis',           'QG',   0.92,0.90,'hq',        'axis',   100,null,        0, true,  false),
            // Zone alliée — fermes et hameaux
            cp( 2,'Ferme du Moulin',   'MUN',  0.16,0.24,'munitions', 'allied', 100,'munitions', 10, false, false),
            cp( 3,'Lac Nord-Ouest',    'FUEL', 0.08,0.50,'fuel',      'neutral',  0,'fuel',       8, false, false),
            // Bocage centre-ouest
            cp( 4,'Hameau des Prés',   'HMS',  0.28,0.38,'munitions', 'neutral',  0,'munitions',  7, false, false),
            cp( 7,'Carrefour Bocage',  'CBG',  0.32,0.62,'munitions', 'neutral',  0,'munitions',  6, false, false),
            // VP — croisement de la route nationale
            cp( 5,'Pont-Route VP',     'VP',   0.50,0.50,'vp',        'neutral',  0, null,        0, false, false),
            // Bocage centre-est — collines et crêtes
            cp( 6,'Colline 112',       'H112', 0.68,0.36,'fuel',      'neutral',  0,'fuel',       7, false, false),
            cp( 8,'Route Nationale',   'RN7',  0.72,0.62,'fuel',      'neutral',  0,'fuel',       6, false, false),
            // Zone axis — bocage sud-est
            cp( 9,'Verger Axis',       'VRG',  0.90,0.56,'fuel',      'neutral',  0,'fuel',       8, false, false),
            cp(10,'Dépôt Sud-Est',     'MUN',  0.82,0.76,'munitions', 'axis',    100,'munitions', 10, false, false),
            // Avant-postes
            cp(11,'Crête Est',         'CRE',  0.74,0.18,'outpost',   'axis',      0, null,       0, false, true),
            cp(12,'Bois du Sud',       'BSU',  0.58,0.82,'outpost',   'axis',      0, null,       0, false, true)
        ];

    } else if (mapId === 4) {
        // ── MAP 04 — CÔTE INDUSTRIELLE ────────────────────────────────────────
        // Grande carte : port industriel est, cratères centraux, forêts ouest.
        // Alliés : nord-ouest (ville côtière). Axis : sud-est (zone portuaire).
        this.capturePoints = [
            cp( 0,'QG Allié',          'QG',   0.10,0.12,'hq',        'allied', 100,null,        0, true,  false),
            cp( 1,'QG Axis',           'QG',   0.88,0.88,'hq',        'axis',   100,null,        0, true,  false),
            // Zone alliée — port nord
            cp( 2,'Dépôt Portuaire',   'MUN',  0.30,0.08,'munitions', 'allied', 100,'munitions', 10, false, false),
            cp( 3,'Réservoirs Nord',   'FUEL', 0.58,0.14,'fuel',      'neutral',  0,'fuel',       8, false, false),
            // Centre — cratères de bombardement (positions élevées)
            cp( 4,'Cratère Nord',      'CRN',  0.36,0.40,'munitions', 'neutral',  0,'munitions',  7, false, false),
            cp( 7,'Cratère Sud',       'CRS',  0.42,0.62,'munitions', 'neutral',  0,'munitions',  6, false, false),
            // VP — centre exact des cratères (position dominante)
            cp( 5,'Sommet des Terres', 'VP',   0.40,0.50,'vp',        'neutral',  0, null,        0, false, false),
            // Côte est — pont et zone industrielle
            cp( 8,'Pont Côtier',       'PCO',  0.72,0.44,'fuel',      'neutral',  0,'fuel',       7, false, false),
            cp( 6,'Zone Industrielle', 'IND',  0.76,0.66,'fuel',      'neutral',  0,'fuel',       6, false, false),
            // Zone axis — port sud
            cp( 9,'Quais Sud',         'QSU',  0.82,0.52,'fuel',      'neutral',  0,'fuel',       8, false, false),
            cp(10,'Arsenal Sud',       'MUN',  0.72,0.80,'munitions', 'axis',    100,'munitions', 10, false, false),
            // Avant-postes
            cp(11,'Phare Est',         'PHA',  0.62,0.08,'outpost',   'axis',      0, null,       0, false, true),
            cp(12,'Forêt Ouest',       'FOR',  0.12,0.62,'outpost',   'axis',      0, null,       0, false, true)
        ];

    } else {
        // ── MAP 05 — PLAINES DU NORD ──────────────────────────────────────────
        // Plaines ouvertes, ville côtière nord-est, cratères centraux, îles sud-ouest.
        // Alliés : nord-ouest. Axis : sud-est.
        this.capturePoints = [
            cp( 0,'QG Allié',          'QG',   0.06,0.10,'hq',        'allied', 100,null,        0, true,  false),
            cp( 1,'QG Axis',           'QG',   0.90,0.88,'hq',        'axis',   100,null,        0, true,  false),
            // Zone alliée — champs et hameaux nord-ouest
            cp( 2,'Ferme Nord',        'MUN',  0.10,0.34,'munitions', 'allied', 100,'munitions', 10, false, false),
            cp( 3,'Carburant Ouest',   'FUEL', 0.20,0.58,'fuel',      'neutral',  0,'fuel',       8, false, false),
            // Ville côtière nord-est — zone urbaine dense
            cp( 4,'Port de Ville',     'PTV',  0.68,0.12,'munitions', 'neutral',  0,'munitions',  7, false, false),
            cp( 7,'Quartier Urbain',   'URB',  0.74,0.28,'munitions', 'neutral',  0,'munitions',  6, false, false),
            // VP — cratères centraux (position dominante sur les plaines)
            cp( 5,'Cratères VP',       'VP',   0.52,0.46,'vp',        'neutral',  0, null,        0, false, false),
            // Plaines centre-est
            cp( 8,'Route des Plaines', 'RPL',  0.62,0.58,'fuel',      'neutral',  0,'fuel',       6, false, false),
            cp( 6,'Carrefour Est',     'CRE',  0.78,0.52,'fuel',      'neutral',  0,'fuel',       7, false, false),
            // Zone axis — sud-est
            cp( 9,'Collines Sud',      'CSU',  0.86,0.68,'fuel',      'neutral',  0,'fuel',       8, false, false),
            cp(10,'Base Axis',         'MUN',  0.80,0.78,'munitions', 'axis',    100,'munitions', 10, false, false),
            // Avant-postes — îles sud-ouest et côte
            cp(11,'Îles Fortifiées',   'ILE',  0.20,0.76,'outpost',   'axis',      0, null,       0, false, true),
            cp(12,'Lighthouse',        'LGT',  0.50,0.22,'outpost',   'axis',      0, null,       0, false, true)
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

/** Retourne la tuile à partir de coordonnées monde. */
RTS.Game.Map.NavGrid.prototype.getTileAtWorld = function(worldX, worldY) {
    var g = this.worldToGrid(worldX, worldY);
    return this.getTile(g.x, g.y);
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