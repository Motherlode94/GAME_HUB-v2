// Utils.js - Utilitaires optimisés pour jeu 2D top-down (style GTA 2)

const Utils = {
    // Distance entre deux points (plus rapide sans sqrt quand possible)
    distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    },

    distanceSq(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return dx * dx + dy * dy; // Plus rapide pour comparaisons
    },

    // Collision point / rectangle
    isPointInRect(px, py, rx, ry, rw, rh) {
        return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
    },

    // Collision entre deux rectangles (AABB)
    rectOverlap(r1x, r1y, r1w, r1h, r2x, r2y, r2w, r2h) {
        return r1x < r2x + r2w && r1x + r1w > r2x &&
               r1y < r2y + r2h && r1y + r1h > r2y;
    },

    // Collision cercle / rectangle
    circleRectOverlap(cx, cy, radius, rx, ry, rw, rh) {
        const closestX = this.clamp(cx, rx, rx + rw);
        const closestY = this.clamp(cy, ry, ry + rh);
        const distSq = this.distanceSq(cx, cy, closestX, closestY);
        return distSq < radius * radius;
    },

    // Collision cercle / cercle
    circleOverlap(x1, y1, r1, x2, y2, r2) {
        const distSq = this.distanceSq(x1, y1, x2, y2);
        const radiusSum = r1 + r2;
        return distSq < radiusSum * radiusSum;
    },

    // Clamp valeur
    clamp(value, min, max) {
        return value < min ? min : value > max ? max : value;
    },

    // Angles en degrés
    normalizeAngle(angle) {
        return ((angle % 360) + 360) % 360;
    },

    // Conversion degrés ↔ radians
    degToRad(deg) {
        return deg * Math.PI / 180;
    },

    radToDeg(rad) {
        return rad * 180 / Math.PI;
    },

    // Random
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    },

    randomChoice(array) {
        return array[this.randomInt(0, array.length - 1)];
    },

    // Interpolation
    lerp(a, b, t) {
        return a + (b - a) * t;
    },

    // Smooth lerp (easing)
    smoothLerp(a, b, t) {
        const smoothT = t * t * (3 - 2 * t); // Smoothstep
        return a + (b - a) * smoothT;
    },

    // Direction vector from angle (degrés)
    angleToVector(angleDeg) {
        const rad = this.degToRad(angleDeg);
        return { x: Math.cos(rad), y: Math.sin(rad) };
    },

    // Angle entre deux points (degrés)
    angleBetween(x1, y1, x2, y2) {
        return this.radToDeg(Math.atan2(y2 - y1, x2 - x1));
    },

    // Différence d'angle la plus courte (pour rotation fluide)
    angleDifference(a1, a2) {
        let diff = a2 - a1;
        while (diff > 180) diff -= 360;
        while (diff < -180) diff += 360;
        return diff;
    },

    // Arrondir aux multiples les plus proches (utile pour grille/snapping)
    roundToNearest(value, step) {
        return Math.round(value / step) * step;
    },

    // Vérifier si un point est dans un cercle
    isPointInCircle(px, py, cx, cy, radius) {
        return this.distanceSq(px, py, cx, cy) < radius * radius;
    },

    // Trouver l'entité la plus proche
    findClosest(x, y, entities) {
        let closest = null;
        let minDist = Infinity;
        
        for (const entity of entities) {
            const dist = this.distanceSq(x, y, entity.x, entity.y);
            if (dist < minDist) {
                minDist = dist;
                closest = entity;
            }
        }
        
        return { entity: closest, distance: Math.sqrt(minDist) };
    },

    // Formater un nombre avec séparateurs (ex: 1000 -> 1,000)
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },

    // Timer simple (retourne true tous les X frames)
    every(frameCount, interval) {
        return frameCount % interval === 0;
    },

    // Chance (retourne true X% du temps)
    chance(percentage) {
        return Math.random() * 100 < percentage;
    }
};

// Export pour modules si besoin (compatible navigateur + Node/ESM)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}