var RTS = RTS || {};
RTS.Game = RTS.Game || {};
RTS.Game.Map = RTS.Game.Map || {};

/**
 * NavTile — tuile individuelle de la grille de navigation.
 * Contient les données de terrain, secteur, brouillard de guerre et pathfinding A*.
 */
RTS.Game.Map.NavTile = function(x, y) {
    this.x = x;
    this.y = y;

    // --- Navigation ---
    this.walkable     = true;
    this.movementCost = 1.0;    // 1.0 = normal, >1 = terrain difficile

    // Couverture : 0 = aucune, 1 = légère, 2 = lourde
    this.cover = 0;

    // --- Terrain (utilisé pour les coûts de déplacement) ---
    // 'grass' | 'road' | 'forest' | 'rubble' | 'water' | 'mud'
    this.terrainType = 'grass';

    // --- Système de secteurs ---
    this.sectorId = -1;         // secteur auquel appartient cette tuile (Voronoï)

    // --- Brouillard de guerre ---
    // 0 = inexploré (noir), 1 = exploré mais hors de vue (sombre), 2 = visible
    this.fogState = 0;

    // --- A* (espace de travail, remis à zéro entre les recherches) ---
    this.g      = Infinity;     // coût depuis le départ
    this.h      = 0;            // heuristique vers l'arrivée
    this.f      = Infinity;     // g + h
    this.parent = null;
    this.inOpen = false;
    this.inClosed = false;
};

/**
 * Remet à zéro les données A* entre deux recherches de chemin.
 */
RTS.Game.Map.NavTile.prototype.resetPathfinding = function() {
    this.g      = Infinity;
    this.h      = 0;
    this.f      = Infinity;
    this.parent = null;
    this.inOpen = false;
    this.inClosed = false;
};