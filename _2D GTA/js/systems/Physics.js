// Physics.js - Système de physique avancé avec vélocité, accélération, friction et collisions
// Version améliorée avec masse, élasticité réaliste, et optimisations

Game.Physics = {
  // Configuration globale
  config: {
    gravity: 0,           // Gravité (0 = désactivée, utile pour top-down)
    airFriction: 0.99,    // Friction dans l'air
    groundFriction: 0.92, // Friction au sol
    maxVelocity: 50,      // Vitesse maximale globale
    minVelocity: 0.01,    // En dessous, considéré comme immobile
    substeps: 2           // Sous-étapes pour plus de précision
  },

  /**
   * Applique la physique complète à une entité
   * @param {Object} entity - Objet avec x, y, vx, vy, ax, ay, mass, friction
   * @param {number} dt - Delta time (1 = normal)
   */
  apply(entity, dt = 1) {
    this.ensurePhysicsProperties(entity);
    
    const substepDt = dt / this.config.substeps;
    
    for (let i = 0; i < this.config.substeps; i++) {
      this.applyStep(entity, substepDt);
    }
  },

  /**
   * Initialise les propriétés physiques si manquantes
   */
  ensurePhysicsProperties(entity) {
    entity.vx = entity.vx ?? 0;
    entity.vy = entity.vy ?? 0;
    entity.ax = entity.ax ?? 0;
    entity.ay = entity.ay ?? 0;
    entity.mass = entity.mass ?? 1;
    entity.friction = entity.friction ?? this.config.groundFriction;
    entity.elasticity = entity.elasticity ?? 0.5;
    entity.maxVelocity = entity.maxVelocity ?? this.config.maxVelocity;
    entity.isGrounded = entity.isGrounded ?? true;
  },

  /**
   * Une étape de simulation physique
   */
  applyStep(entity, dt) {
    // Appliquer la gravité
    entity.vy += this.config.gravity * dt;
    
    // Appliquer l'accélération
    entity.vx += entity.ax * dt;
    entity.vy += entity.ay * dt;

    // Appliquer la friction appropriée
    const friction = entity.isGrounded ? entity.friction : this.config.airFriction;
    entity.vx *= Math.pow(friction, dt);
    entity.vy *= Math.pow(friction, dt);

    // Limiter la vitesse
    this.clampVelocity(entity);

    // Arrêter les mouvements très lents
    if (Math.abs(entity.vx) < this.config.minVelocity) entity.vx = 0;
    if (Math.abs(entity.vy) < this.config.minVelocity) entity.vy = 0;

    // Mettre à jour la position
    entity.x += entity.vx * dt;
    entity.y += entity.vy * dt;

    // Réinitialiser l'accélération (forces impulsionnelles)
    entity.ax = 0;
    entity.ay = 0;
  },

  /**
   * Limite la vitesse à la vitesse maximale
   */
  clampVelocity(entity) {
    const speed = Math.sqrt(entity.vx * entity.vx + entity.vy * entity.vy);
    if (speed > entity.maxVelocity) {
      const ratio = entity.maxVelocity / speed;
      entity.vx *= ratio;
      entity.vy *= ratio;
    }
  },

  /**
   * Obtient la vitesse actuelle d'une entité
   */
  getSpeed(entity) {
    return Math.sqrt((entity.vx || 0) ** 2 + (entity.vy || 0) ** 2);
  },

  /**
   * Obtient la direction du mouvement en degrés
   */
  getDirection(entity) {
    if (!entity.vx && !entity.vy) return 0;
    return Utils.radToDeg(Math.atan2(entity.vy || 0, entity.vx || 0));
  },

  /**
   * Applique une impulsion instantanée
   * @param {Object} entity - Entité cible
   * @param {number} ix - Impulsion X
   * @param {number} iy - Impulsion Y
   */
  impulse(entity, ix, iy) {
    const massRatio = 1 / (entity.mass || 1);
    entity.vx = (entity.vx || 0) + ix * massRatio;
    entity.vy = (entity.vy || 0) + iy * massRatio;
  },
  
  /**
   * Applique une force continue dans une direction
   * @param {Object} entity - Entité cible
   * @param {number} angle - Angle en degrés
   * @param {number} force - Intensité de la force
   */
  applyForce(entity, angle, force) {
    const rad = Utils.degToRad(angle);
    const massRatio = 1 / (entity.mass || 1);
    entity.ax = (entity.ax || 0) + Math.cos(rad) * force * massRatio;
    entity.ay = (entity.ay || 0) + Math.sin(rad) * force * massRatio;
  },

  /**
   * Applique une force directionnelle (vecteur)
   * @param {Object} entity - Entité cible
   * @param {number} fx - Force X
   * @param {number} fy - Force Y
   */
  applyForceVector(entity, fx, fy) {
    const massRatio = 1 / (entity.mass || 1);
    entity.ax = (entity.ax || 0) + fx * massRatio;
    entity.ay = (entity.ay || 0) + fy * massRatio;
  },

  /**
   * Applique une force d'attraction vers un point
   * @param {Object} entity - Entité à attirer
   * @param {number} targetX - Position X cible
   * @param {number} targetY - Position Y cible
   * @param {number} strength - Force d'attraction
   * @param {number} minDist - Distance minimale (évite l'explosion à proximité)
   */
  attractTo(entity, targetX, targetY, strength, minDist = 10) {
    const dx = targetX - entity.x;
    const dy = targetY - entity.y;
    const distSq = dx * dx + dy * dy;
    const dist = Math.sqrt(distSq);
    
    if (dist < minDist) return;
    
    // Force inversement proportionnelle au carré de la distance
    const force = strength / distSq;
    const nx = dx / dist;
    const ny = dy / dist;
    
    this.applyForceVector(entity, nx * force, ny * force);
  },

  /**
   * Applique une force de répulsion depuis un point
   */
  repelFrom(entity, sourceX, sourceY, strength, maxDist = 200) {
    const dx = entity.x - sourceX;
    const dy = entity.y - sourceY;
    const distSq = dx * dx + dy * dy;
    const dist = Math.sqrt(distSq);
    
    if (dist > maxDist || dist === 0) return;
    
    const force = strength * (1 - dist / maxDist);
    const nx = dx / dist;
    const ny = dy / dist;
    
    this.applyForceVector(entity, nx * force, ny * force);
  },

  /**
   * Collision élastique réaliste entre deux entités
   * @param {Object} e1 - Première entité
   * @param {Object} e2 - Deuxième entité
   * @param {number} elasticity - Coefficient de restitution (0-1)
   * @returns {boolean} - True si collision traitée
   */
  collide(e1, e2, elasticity = null) {
    this.ensurePhysicsProperties(e1);
    this.ensurePhysicsProperties(e2);
    
    const dx = e2.x - e1.x;
    const dy = e2.y - e1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist === 0) return false;
    
    // Normale de collision
    const nx = dx / dist;
    const ny = dy / dist;
    
    // Vitesse relative
    const dvx = (e1.vx || 0) - (e2.vx || 0);
    const dvy = (e1.vy || 0) - (e2.vy || 0);
    
    // Vitesse relative dans la direction de la collision
    const dvn = dvx * nx + dvy * ny;
    
    // Ne pas résoudre si les objets s'éloignent
    if (dvn > 0) return false;
    
    // Coefficient de restitution
    const e = elasticity ?? Math.min(e1.elasticity || 0.5, e2.elasticity || 0.5);
    
    // Calcul de l'impulsion avec masses
    const m1 = e1.mass || 1;
    const m2 = e2.mass || 1;
    const impulse = -(1 + e) * dvn / (1/m1 + 1/m2);
    
    // Appliquer l'impulsion
    e1.vx += (impulse / m1) * nx;
    e1.vy += (impulse / m1) * ny;
    e2.vx -= (impulse / m2) * nx;
    e2.vy -= (impulse / m2) * ny;
    
    return true;
  },

  /**
   * Collision avec séparation des objets (évite le chevauchement)
   */
  collideAndSeparate(e1, e2, minDist, elasticity = null) {
    const dx = e2.x - e1.x;
    const dy = e2.y - e1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist >= minDist || dist === 0) return false;
    
    // Séparer les objets
    const overlap = minDist - dist;
    const nx = dx / dist;
    const ny = dy / dist;
    
    const m1 = e1.mass || 1;
    const m2 = e2.mass || 1;
    const totalMass = m1 + m2;
    
    // Séparation proportionnelle à la masse
    const sep1 = overlap * (m2 / totalMass);
    const sep2 = overlap * (m1 / totalMass);
    
    e1.x -= nx * sep1;
    e1.y -= ny * sep1;
    e2.x += nx * sep2;
    e2.y += ny * sep2;
    
    // Appliquer la collision élastique
    return this.collide(e1, e2, elasticity);
  },

  /**
   * Collision avec un mur/bord statique
   * @param {Object} entity - Entité
   * @param {string} side - 'left', 'right', 'top', 'bottom'
   * @param {number} position - Position du mur
   * @param {number} elasticity - Rebond (0-1)
   */
  bounceOffWall(entity, side, position, elasticity = 0.7) {
    switch (side) {
      case 'left':
        if (entity.x <= position) {
          entity.x = position;
          entity.vx = Math.abs(entity.vx || 0) * elasticity;
        }
        break;
      case 'right':
        if (entity.x >= position) {
          entity.x = position;
          entity.vx = -Math.abs(entity.vx || 0) * elasticity;
        }
        break;
      case 'top':
        if (entity.y <= position) {
          entity.y = position;
          entity.vy = Math.abs(entity.vy || 0) * elasticity;
        }
        break;
      case 'bottom':
        if (entity.y >= position) {
          entity.y = position;
          entity.vy = -Math.abs(entity.vy || 0) * elasticity;
        }
        break;
    }
  },

  /**
   * Garde une entité dans les limites de la carte
   * @param {Object} entity - Entité avec x, y, width/size, height/size
   * @param {number} bounceElasticity - Rebond aux bords (0 = stop, 1 = rebond parfait)
   */
  constrainToMap(entity, bounceElasticity = 0.3) {
    const width = entity.width || entity.size || 0;
    const height = entity.height || entity.size || 0;
    const mapWidth = Game.Map?.width || 3000;
    const mapHeight = Game.Map?.height || 3000;
    
    if (entity.x < 0) {
      entity.x = 0;
      entity.vx = Math.abs(entity.vx || 0) * bounceElasticity;
    }
    if (entity.x + width > mapWidth) {
      entity.x = mapWidth - width;
      entity.vx = -Math.abs(entity.vx || 0) * bounceElasticity;
    }
    if (entity.y < 0) {
      entity.y = 0;
      entity.vy = Math.abs(entity.vy || 0) * bounceElasticity;
    }
    if (entity.y + height > mapHeight) {
      entity.y = mapHeight - height;
      entity.vy = -Math.abs(entity.vy || 0) * bounceElasticity;
    }
  },

  /**
   * Calcule l'énergie cinétique d'une entité
   */
  getKineticEnergy(entity) {
    const speed = this.getSpeed(entity);
    return 0.5 * (entity.mass || 1) * speed * speed;
  },

  /**
   * Interpolation linéaire pour le mouvement fluide
   */
  lerp(current, target, factor) {
    return current + (target - current) * factor;
  },

  /**
   * Déplace une entité vers une cible avec lissage
   * @param {Object} entity - Entité à déplacer
   * @param {number} targetX - Position X cible
   * @param {number} targetY - Position Y cible
   * @param {number} speed - Vitesse de déplacement
   * @param {number} smoothing - Facteur de lissage (0-1, plus haut = plus réactif)
   */
  moveTowards(entity, targetX, targetY, speed, smoothing = 0.1) {
    const dx = targetX - entity.x;
    const dy = targetY - entity.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < 1) {
      entity.vx = 0;
      entity.vy = 0;
      return true; // Arrivé
    }
    
    const targetVx = (dx / dist) * speed;
    const targetVy = (dy / dist) * speed;
    
    entity.vx = this.lerp(entity.vx || 0, targetVx, smoothing);
    entity.vy = this.lerp(entity.vy || 0, targetVy, smoothing);
    
    return false; // Pas encore arrivé
  },

  /**
   * Système de ressorts entre deux points
   * @param {Object} e1 - Premier point
   * @param {Object} e2 - Deuxième point
   * @param {number} restLength - Longueur au repos
   * @param {number} stiffness - Rigidité du ressort
   * @param {number} damping - Amortissement
   */
  spring(e1, e2, restLength, stiffness = 0.1, damping = 0.05) {
    const dx = e2.x - e1.x;
    const dy = e2.y - e1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist === 0) return;
    
    const displacement = dist - restLength;
    const force = displacement * stiffness;
    
    const nx = dx / dist;
    const ny = dy / dist;
    
    // Force du ressort
    const fx = nx * force;
    const fy = ny * force;
    
    // Amortissement basé sur la vitesse relative
    const dvx = (e2.vx || 0) - (e1.vx || 0);
    const dvy = (e2.vy || 0) - (e1.vy || 0);
    const dampFx = dvx * damping;
    const dampFy = dvy * damping;
    
    // Appliquer aux deux entités
    this.applyForceVector(e1, fx + dampFx, fy + dampFy);
    this.applyForceVector(e2, -(fx + dampFx), -(fy + dampFy));
  }
};