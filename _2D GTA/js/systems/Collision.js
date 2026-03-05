// Collision.js - Système de collision avancé avec AABB, SAT, et résolution optimisée
// Version améliorée avec système de couches, callbacks, et optimisations spatiales

Game.Collision = {
  // Configuration
  config: {
    pushoutStrength: 1.0,    // Force de séparation
    maxIterations: 5,         // Itérations max pour résolution
    skinWidth: 0.5,           // Marge de collision
    enableDebugDraw: false    // Afficher les hitboxes
  },

  // Système de couches de collision
  layers: {
    PLAYER: 1,
    VEHICLE: 2,
    TRAFFIC: 4,
    BUILDING: 8,
    ENEMY: 16,
    PROJECTILE: 32,
    PICKUP: 64,
    ALL: 0xFFFFFFFF
  },

  // Matrice de collision (quelles couches collisionnent entre elles)
  collisionMatrix: {},

  /**
   * Initialise la matrice de collision par défaut
   */
  init() {
    this.setLayerCollision(this.layers.PLAYER, this.layers.BUILDING | this.layers.PICKUP);
    this.setLayerCollision(this.layers.VEHICLE, this.layers.BUILDING | this.layers.VEHICLE | this.layers.TRAFFIC);
    this.setLayerCollision(this.layers.TRAFFIC, this.layers.BUILDING | this.layers.VEHICLE);
    this.setLayerCollision(this.layers.ENEMY, this.layers.BUILDING | this.layers.PROJECTILE);
    this.setLayerCollision(this.layers.PROJECTILE, this.layers.ENEMY | this.layers.BUILDING);
  },

  /**
   * Configure quelles couches peuvent collisionner
   */
  setLayerCollision(layer1, layer2) {
    this.collisionMatrix[layer1] = layer2;
    this.collisionMatrix[layer2] |= layer1;
  },

  /**
   * Vérifie si deux couches peuvent collisionner
   */
  canLayersCollide(layer1, layer2) {
    return (this.collisionMatrix[layer1] & layer2) !== 0;
  },

  // ==================== TESTS DE COLLISION ====================

  /**
   * Test AABB (Axis-Aligned Bounding Box) - Le plus rapide
   * @param {Object} r1 - Rectangle {x, y, w, h}
   * @param {Object} r2 - Rectangle {x, y, w, h}
   * @returns {boolean}
   */
  rectRect(r1, r2) {
    return r1.x < r2.x + r2.w &&
           r1.x + r1.w > r2.x &&
           r1.y < r2.y + r2.h &&
           r1.y + r1.h > r2.y;
  },

  /**
   * Test cercle-cercle
   * @param {Object} c1 - Cercle {x, y, radius}
   * @param {Object} c2 - Cercle {x, y, radius}
   * @returns {boolean}
   */
  circleCircle(c1, c2) {
    const dx = c2.x - c1.x;
    const dy = c2.y - c1.y;
    const distSq = dx * dx + dy * dy;
    const radiusSum = c1.radius + c2.radius;
    return distSq < radiusSum * radiusSum;
  },

  /**
   * Test cercle-rectangle
   * @param {Object} circle - Cercle {x, y, radius}
   * @param {Object} rect - Rectangle {x, y, w, h}
   * @returns {boolean}
   */
  circleRect(circle, rect) {
    // Trouve le point le plus proche sur le rectangle
    const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
    const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));
    
    const dx = circle.x - closestX;
    const dy = circle.y - closestY;
    
    return (dx * dx + dy * dy) < (circle.radius * circle.radius);
  },

  /**
   * Test point dans rectangle
   */
  pointRect(px, py, rect) {
    return px >= rect.x && px <= rect.x + rect.w &&
           py >= rect.y && py <= rect.y + rect.h;
  },

  /**
   * Test point dans cercle
   */
  pointCircle(px, py, circle) {
    const dx = px - circle.x;
    const dy = py - circle.y;
    return (dx * dx + dy * dy) < (circle.radius * circle.radius);
  },

  /**
   * Test ligne-rectangle
   * @param {number} x1, y1 - Point de départ
   * @param {number} x2, y2 - Point d'arrivée
   * @param {Object} rect - Rectangle
   * @returns {Object|null} - Point d'intersection ou null
   */
  lineRect(x1, y1, x2, y2, rect) {
    // Teste les 4 côtés
    const left = this.lineLine(x1, y1, x2, y2, rect.x, rect.y, rect.x, rect.y + rect.h);
    const right = this.lineLine(x1, y1, x2, y2, rect.x + rect.w, rect.y, rect.x + rect.w, rect.y + rect.h);
    const top = this.lineLine(x1, y1, x2, y2, rect.x, rect.y, rect.x + rect.w, rect.y);
    const bottom = this.lineLine(x1, y1, x2, y2, rect.x, rect.y + rect.h, rect.x + rect.w, rect.y + rect.h);
    
    // Retourne l'intersection la plus proche
    let closest = null;
    let minDist = Infinity;
    
    [left, right, top, bottom].forEach(point => {
      if (point) {
        const dist = (point.x - x1) ** 2 + (point.y - y1) ** 2;
        if (dist < minDist) {
          minDist = dist;
          closest = point;
        }
      }
    });
    
    return closest;
  },

  /**
   * Test ligne-ligne
   * @returns {Object|null} - Point d'intersection {x, y} ou null
   */
  lineLine(x1, y1, x2, y2, x3, y3, x4, y4) {
    const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    if (Math.abs(denom) < 0.0001) return null; // Parallèles
    
    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;
    
    if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
      return {
        x: x1 + ua * (x2 - x1),
        y: y1 + ua * (y2 - y1)
      };
    }
    
    return null;
  },

  /**
   * Raycast - Lance un rayon et retourne la première collision
   * @param {number} startX, startY - Point de départ
   * @param {number} angle - Direction en degrés
   * @param {number} maxDist - Distance maximale
   * @param {Array} obstacles - Liste d'obstacles à tester
   * @returns {Object|null} - {point, obstacle, distance} ou null
   */
  raycast(startX, startY, angle, maxDist, obstacles) {
    const rad = Utils.degToRad(angle);
    const endX = startX + Math.cos(rad) * maxDist;
    const endY = startY + Math.sin(rad) * maxDist;
    
    let closest = null;
    let minDist = Infinity;
    
    obstacles.forEach(obs => {
      const rect = {
        x: obs.x,
        y: obs.y,
        w: obs.w || obs.width,
        h: obs.h || obs.height
      };
      
      const hit = this.lineRect(startX, startY, endX, endY, rect);
      
      if (hit) {
        const dist = Math.sqrt((hit.x - startX) ** 2 + (hit.y - startY) ** 2);
        if (dist < minDist) {
          minDist = dist;
          closest = { point: hit, obstacle: obs, distance: dist };
        }
      }
    });
    
    return closest;
  },

  // ==================== RÉSOLUTION DE COLLISION ====================

  /**
   * Calcule le vecteur de séparation minimale (MTV - Minimum Translation Vector)
   * @param {Object} r1 - Rectangle mobile {x, y, w, h}
   * @param {Object} r2 - Rectangle statique {x, y, w, h}
   * @returns {Object|null} - {x, y} vecteur de correction ou null si pas de collision
   */
  getMTV(r1, r2) {
    // Centre des rectangles
    const c1x = r1.x + r1.w / 2;
    const c1y = r1.y + r1.h / 2;
    const c2x = r2.x + r2.w / 2;
    const c2y = r2.y + r2.h / 2;
    
    // Distance entre centres
    const dx = c1x - c2x;
    const dy = c1y - c2y;
    
    // Chevauchement sur chaque axe
    const overlapX = (r1.w + r2.w) / 2 - Math.abs(dx);
    const overlapY = (r1.h + r2.h) / 2 - Math.abs(dy);
    
    // Pas de collision
    if (overlapX <= 0 || overlapY <= 0) return null;
    
    // Retourne le plus petit chevauchement
    if (overlapX < overlapY) {
      return { x: dx > 0 ? overlapX : -overlapX, y: 0 };
    } else {
      return { x: 0, y: dy > 0 ? overlapY : -overlapY };
    }
  },

  /**
   * Résout une collision AABB avec push-out
   * @param {Object} r1 - Rectangle mobile (sera modifié)
   * @param {Object} r2 - Rectangle statique
   * @returns {Object|null} - Vecteur de correction appliqué
   */
  resolveRectRect(r1, r2) {
    const mtv = this.getMTV(r1, r2);
    if (!mtv) return null;
    
    r1.x += mtv.x * this.config.pushoutStrength;
    r1.y += mtv.y * this.config.pushoutStrength;
    
    return mtv;
  },

  /**
   * Résolution avec répartition de masse
   * @param {Object} r1 - Premier rectangle avec masse optionnelle
   * @param {Object} r2 - Deuxième rectangle avec masse optionnelle
   */
  resolveRectRectWeighted(r1, r2) {
    const mtv = this.getMTV(r1, r2);
    if (!mtv) return null;
    
    const m1 = r1.mass || 1;
    const m2 = r2.mass || 1;
    const totalMass = m1 + m2;
    
    // Plus la masse est grande, moins on bouge
    const ratio1 = m2 / totalMass;
    const ratio2 = m1 / totalMass;
    
    r1.x += mtv.x * ratio1 * this.config.pushoutStrength;
    r1.y += mtv.y * ratio1 * this.config.pushoutStrength;
    r2.x -= mtv.x * ratio2 * this.config.pushoutStrength;
    r2.y -= mtv.y * ratio2 * this.config.pushoutStrength;
    
    return mtv;
  },

  /**
   * Résout collision cercle-cercle
   */
  resolveCircleCircle(c1, c2) {
    const dx = c2.x - c1.x;
    const dy = c2.y - c1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const overlap = c1.radius + c2.radius - dist;
    
    if (overlap <= 0 || dist === 0) return null;
    
    const nx = dx / dist;
    const ny = dy / dist;
    
    const m1 = c1.mass || 1;
    const m2 = c2.mass || 1;
    const totalMass = m1 + m2;
    
    c1.x -= nx * overlap * (m2 / totalMass);
    c1.y -= ny * overlap * (m2 / totalMass);
    c2.x += nx * overlap * (m1 / totalMass);
    c2.y += ny * overlap * (m1 / totalMass);
    
    return { x: nx * overlap, y: ny * overlap };
  },

  // ==================== FONCTIONS UTILITAIRES ====================

  /**
   * Vérifie et résout les collisions joueur vs obstacles
   */
  checkPlayerVsObstacles(obstacles) {
    const player = Game.player || Game.Player;
    if (!player) return;
    
    const p = { 
      x: player.x, 
      y: player.y, 
      w: player.size || player.width, 
      h: player.size || player.height 
    };

    let hasCollision = false;
    
    for (let i = 0; i < this.config.maxIterations; i++) {
      let collisionThisFrame = false;
      
      for (const obs of obstacles) {
        const o = { 
          x: obs.x, 
          y: obs.y, 
          w: obs.w || obs.width, 
          h: obs.h || obs.height 
        };
        
        if (this.rectRect(p, o)) {
          this.resolveRectRect(p, o);
          collisionThisFrame = true;
          hasCollision = true;
        }
      }
      
      if (!collisionThisFrame) break;
    }

    player.x = p.x;
    player.y = p.y;
    
    return hasCollision;
  },

  /**
   * Vérifie collision véhicule vs obstacles avec rebond
   */
  checkVehicleVsObstacles(vehicle, obstacles) {
    const v = {
      x: vehicle.x,
      y: vehicle.y,
      w: vehicle.width,
      h: vehicle.height
    };

    let hasCollision = false;
    let totalMtv = { x: 0, y: 0 };

    for (const obs of obstacles) {
      const o = {
        x: obs.x,
        y: obs.y,
        w: obs.w || obs.width,
        h: obs.h || obs.height
      };
      
      const mtv = this.getMTV(v, o);
      if (mtv) {
        v.x += mtv.x;
        v.y += mtv.y;
        totalMtv.x += mtv.x;
        totalMtv.y += mtv.y;
        hasCollision = true;
      }
    }

    if (hasCollision) {
      vehicle.x = v.x;
      vehicle.y = v.y;
      
      // Rebond proportionnel à la direction de collision
      const reboundFactor = -0.3;
      if (Math.abs(totalMtv.x) > Math.abs(totalMtv.y)) {
        vehicle.speed *= reboundFactor;
      } else {
        vehicle.speed *= reboundFactor * 0.5;
      }
    }

    return hasCollision;
  },

  /**
   * Obtient tous les objets en collision avec un rectangle
   * @param {Object} rect - Rectangle de test
   * @param {Array} objects - Liste d'objets à tester
   * @returns {Array} - Objets en collision
   */
  getCollisions(rect, objects) {
    const collisions = [];
    
    for (const obj of objects) {
      const o = {
        x: obj.x,
        y: obj.y,
        w: obj.w || obj.width || obj.size,
        h: obj.h || obj.height || obj.size
      };
      
      if (this.rectRect(rect, o)) {
        collisions.push(obj);
      }
    }
    
    return collisions;
  },

  /**
   * Teste si un chemin est libre
   * @param {number} x1, y1 - Point de départ
   * @param {number} x2, y2 - Point d'arrivée
   * @param {Array} obstacles - Obstacles à éviter
   * @returns {boolean}
   */
  isPathClear(x1, y1, x2, y2, obstacles) {
    for (const obs of obstacles) {
      const rect = {
        x: obs.x,
        y: obs.y,
        w: obs.w || obs.width,
        h: obs.h || obs.height
      };
      
      if (this.lineRect(x1, y1, x2, y2, rect)) {
        return false;
      }
    }
    return true;
  },

  // ==================== DEBUG ====================

  /**
   * Dessine les hitboxes pour le debug
   */
  debugDraw(ctx, objects) {
    if (!this.config.enableDebugDraw) return;
    
    ctx.save();
    ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
    ctx.lineWidth = 2;
    
    for (const obj of objects) {
      const w = obj.w || obj.width || obj.size || 10;
      const h = obj.h || obj.height || obj.size || 10;
      
      ctx.strokeRect(obj.x, obj.y, w, h);
    }
    
    ctx.restore();
  },

  /**
   * Active/désactive le debug
   */
  toggleDebug() {
    this.config.enableDebugDraw = !this.config.enableDebugDraw;
    console.log(`Collision debug: ${this.config.enableDebugDraw ? 'ON' : 'OFF'}`);
  }
};

// Auto-initialisation
if (typeof Game !== 'undefined') {
  Game.Collision.init();
}