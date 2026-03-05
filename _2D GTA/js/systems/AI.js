// AI.js - États et comportements IA simples

Game.AI = {
  // Poursuite d'une cible
  pursue(entity, target, speed) {
    if (!target) target = Game.player || Game.Player;
    
    const dx = target.x - entity.x;
    const dy = target.y - entity.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 3) {
      entity.x += (dx / dist) * speed;
      entity.y += (dy / dist) * speed;
      
      if (entity.angle !== undefined) {
        entity.angle = Utils.angleBetween(entity.x, entity.y, target.x, target.y);
      }
    }
    
    return dist;
  },

  // Fugue d'une cible
  flee(entity, target, speed, fleeRadius = 200) {
    if (!target) target = Game.player || Game.Player;
    
    const dx = target.x - entity.x;
    const dy = target.y - entity.y;
    const dist = Math.hypot(dx, dy);

    if (dist < fleeRadius && dist > 0) {
      entity.x -= (dx / dist) * speed;
      entity.y -= (dy / dist) * speed;
      
      if (entity.angle !== undefined) {
        entity.angle = Utils.angleBetween(entity.x, entity.y, target.x, target.y) + 180;
      }
    }
    
    return dist;
  },

  // Patrouille aléatoire (wander)
  wander(entity, speed) {
    entity.wanderTimer = (entity.wanderTimer || 0) - 1;

    if (entity.wanderTimer <= 0) {
      entity.wanderAngle = Utils.randomInt(0, 359);
      entity.wanderTimer = Utils.randomInt(60, 180);
    }

    const vec = Utils.angleToVector(entity.wanderAngle || 0);
    entity.x += vec.x * speed;
    entity.y += vec.y * speed;
    
    if (entity.angle !== undefined) {
      entity.angle = entity.wanderAngle;
    }
  },
  
  // Éviter les obstacles
  avoid(entity, obstacles, avoidRadius = 100, speed) {
    let avoidX = 0;
    let avoidY = 0;
    
    for (const obs of obstacles) {
      const dx = entity.x - obs.x;
      const dy = entity.y - obs.y;
      const dist = Math.hypot(dx, dy);
      
      if (dist < avoidRadius && dist > 0) {
        const force = (avoidRadius - dist) / avoidRadius;
        avoidX += (dx / dist) * force;
        avoidY += (dy / dist) * force;
      }
    }
    
    if (avoidX !== 0 || avoidY !== 0) {
      const length = Math.hypot(avoidX, avoidY);
      entity.x += (avoidX / length) * speed;
      entity.y += (avoidY / length) * speed;
      return true;
    }
    
    return false;
  },
  
  // Suivre un chemin (waypoints)
  followPath(entity, waypoints, speed, reachDistance = 20) {
    if (!entity.currentWaypoint) entity.currentWaypoint = 0;
    
    const target = waypoints[entity.currentWaypoint];
    if (!target) return;
    
    const dx = target.x - entity.x;
    const dy = target.y - entity.y;
    const dist = Math.hypot(dx, dy);
    
    if (dist < reachDistance) {
      entity.currentWaypoint = (entity.currentWaypoint + 1) % waypoints.length;
    } else {
      entity.x += (dx / dist) * speed;
      entity.y += (dy / dist) * speed;
      
      if (entity.angle !== undefined) {
        entity.angle = Utils.angleBetween(entity.x, entity.y, target.x, target.y);
      }
    }
  }
};