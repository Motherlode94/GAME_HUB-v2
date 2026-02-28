var RTS = RTS || {};
RTS.Engine = RTS.Engine || {};

/**
 * Camera — Caméra RTS avec :
 *  - Défilement par les bords de l'écran (edge scrolling)
 *  - Défilement clavier (WASD / Flèches)
 *  - Zoom centré sur la souris (molette)
 *  - Interpolation douce (lerp)
 *  - Clamp aux bords de la carte
 *  - Conversions monde ↔ écran
 */

var units = [];
var lastTime = performance.now();

RTS.Engine.Camera = function(viewWidth, viewHeight, mapWidth, mapHeight) {

    // Position courante (interpolée)
    this.x = 0;
    this.y = 0;

    // Position cible (directement modifiée par les inputs)
    this.targetX = 0;
    this.targetY = 0;

    // Zoom
    this.zoom    = 1.0;
    this.minZoom = 0.35;
    this.maxZoom = 2.5;

    // Vitesse de défilement (pixels/frame en espace monde)
    this.speed    = 14;
    this.edgeSize = 22;          // zone de déclenchement en pixels depuis le bord

    // Dimensions
    this.viewWidth  = viewWidth;
    this.viewHeight = viewHeight;
    this.mapWidth   = mapWidth;
    this.mapHeight  = mapHeight;

    // Lerp — coefficient d'interpolation (0..1, plus élevé = plus réactif)
    this.lerpFactor = 0.14;
};

// ---------------------------------------------------------------------------
//  MISE À JOUR
// ---------------------------------------------------------------------------

/**
 * Met à jour la caméra chaque frame.
 * @param {number} mouseX   Position X de la souris (pixels écran)
 * @param {number} mouseY   Position Y de la souris
 * @param {Object} keys     Objet {key: boolean} des touches enfoncées
 */
RTS.Engine.Camera.prototype.update = function(mouseX, mouseY, keys) {
    keys = keys || {};

    var speed = this.speed / this.zoom;  // Vitesse adaptée au zoom

    // --- Edge scrolling ---
    if (mouseX < this.edgeSize)                    this.targetX -= speed;
    if (mouseX > this.viewWidth  - this.edgeSize)  this.targetX += speed;
    if (mouseY < this.edgeSize)                    this.targetY -= speed;
    if (mouseY > this.viewHeight - this.edgeSize)  this.targetY += speed;

    // --- Clavier ---
    if (keys['a'] || keys['ArrowLeft'])  this.targetX -= speed;
    if (keys['d'] || keys['ArrowRight']) this.targetX += speed;
    if (keys['w'] || keys['ArrowUp'])    this.targetY -= speed;
    if (keys['s'] || keys['ArrowDown'])  this.targetY += speed;

    // --- Clamp aux limites de la carte ---
    // Si la carte est plus petite que la vue, on autorise une position négative
    // pour centrer la carte (au lieu de la coller au coin haut-gauche).
    var scaledW = this.mapWidth  * this.zoom;
    var scaledH = this.mapHeight * this.zoom;

    var minX, maxX, minY, maxY;

    if (scaledW <= this.viewWidth) {
        // Carte plus étroite que l'écran → centrer horizontalement, bloquer le scroll
        minX = maxX = (this.mapWidth - this.viewWidth / this.zoom) / 2; // valeur négative
    } else {
        minX = 0;
        maxX = this.mapWidth - this.viewWidth / this.zoom;
    }

    if (scaledH <= this.viewHeight) {
        // Carte moins haute que l'écran → centrer verticalement, bloquer le scroll
        minY = maxY = (this.mapHeight - this.viewHeight / this.zoom) / 2; // valeur négative
    } else {
        minY = 0;
        maxY = this.mapHeight - this.viewHeight / this.zoom;
    }

    this.targetX = Math.max(minX, Math.min(this.targetX, maxX));
    this.targetY = Math.max(minY, Math.min(this.targetY, maxY));

    // --- Interpolation douce ---
    this.x += (this.targetX - this.x) * this.lerpFactor;
    this.y += (this.targetY - this.y) * this.lerpFactor;
};

// ---------------------------------------------------------------------------
//  ZOOM
// ---------------------------------------------------------------------------

/**
 * Applique un zoom centré sur la position de la souris.
 * @param {number} deltaY   Valeur de la molette (positif = zoom out)
 * @param {number} mouseX   Position X de la souris (pour recentrer)
 * @param {number} mouseY   Position Y de la souris
 */
RTS.Engine.Camera.prototype.applyZoom = function(deltaY, mouseX, mouseY) {
    var oldZoom = this.zoom;
    var factor  = deltaY > 0 ? 0.9 : 1.1;
    this.zoom   = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom * factor));

    // Zoom centré sur la position de la souris
    var worldMouseX = this.x + mouseX / oldZoom;
    var worldMouseY = this.y + mouseY / oldZoom;
    this.x       = worldMouseX - mouseX / this.zoom;
    this.y       = worldMouseY - mouseY / this.zoom;
    this.targetX = this.x;
    this.targetY = this.y;
};

// ---------------------------------------------------------------------------
//  CONVERSIONS
// ---------------------------------------------------------------------------

/**
 * Convertit des coordonnées monde en coordonnées écran.
 */
RTS.Engine.Camera.prototype.worldToScreen = function(worldX, worldY) {
    return {
        x: (worldX - this.x) * this.zoom,
        y: (worldY - this.y) * this.zoom
    };
};

/**
 * Convertit des coordonnées écran en coordonnées monde.
 */
RTS.Engine.Camera.prototype.screenToWorld = function(screenX, screenY) {
    return {
        x: screenX / this.zoom + this.x,
        y: screenY / this.zoom + this.y
    };
};

/**
 * Retourne true si le point monde est visible à l'écran (avec marge optionnelle).
 */
RTS.Engine.Camera.prototype.isInView = function(worldX, worldY, margin) {
    margin = margin || 0;
    var s = this.worldToScreen(worldX, worldY);
    return s.x > -margin && s.x < this.viewWidth  + margin &&
           s.y > -margin && s.y < this.viewHeight + margin;
};

/**
 * Retourne le rectangle du monde actuellement visible.
 */
RTS.Engine.Camera.prototype.getViewBounds = function() {
    return {
        x:      this.x,
        y:      this.y,
        width:  this.viewWidth  / this.zoom,
        height: this.viewHeight / this.zoom
    };
};

/**
 * Centre la caméra sur un point monde immédiatement (sans interpolation).
 * Gère le cas où la carte est plus petite que la vue.
 */
RTS.Engine.Camera.prototype.snapTo = function(worldX, worldY) {
    var scaledW = this.mapWidth  * this.zoom;
    var scaledH = this.mapHeight * this.zoom;

    var x, y;

    if (scaledW <= this.viewWidth) {
        x = (this.mapWidth - this.viewWidth / this.zoom) / 2;  // centrage forcé
    } else {
        x = Math.max(0, Math.min(
            worldX - (this.viewWidth  / this.zoom) / 2,
            this.mapWidth - this.viewWidth / this.zoom
        ));
    }

    if (scaledH <= this.viewHeight) {
        y = (this.mapHeight - this.viewHeight / this.zoom) / 2; // centrage forcé
    } else {
        y = Math.max(0, Math.min(
            worldY - (this.viewHeight / this.zoom) / 2,
            this.mapHeight - this.viewHeight / this.zoom
        ));
    }

    this.x = this.targetX = x;
    this.y = this.targetY = y;
};