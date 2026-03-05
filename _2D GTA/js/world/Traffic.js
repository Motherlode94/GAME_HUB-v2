// Traffic.js - SystÃ¨me de trafic avancÃ© avec IA, comportements rÃ©alistes et optimisations
// Version amÃ©liorÃ©e avec respect du code de la route, dÃ©tection de dangers, et pooling d'objets

Game.Traffic = {
  vehicles: [],
  vehiclePool: [],      // Pool de vÃ©hicules rÃ©utilisables
  maxVehicles: 20,      // Nombre maximum de vÃ©hicules
  spawnTimer: 0,
  spawnInterval: 180,   // Frames entre spawns

  // Configuration des routes
  roads: [
    { 
      x: 700, y: 0, width: 200, height: 5200, 
      direction: 'vertical',
      lanes: [
        { offset: 40, direction: 90 },   // Voie vers le bas
        { offset: 110, direction: 270 }  // Voie vers le haut
      ]
    },
    { 
      x: 0, y: 900, width: 5200, height: 200, 
      direction: 'horizontal',
      lanes: [
        { offset: 40, direction: 0 },    // Voie vers la droite
        { offset: 110, direction: 180 }  // Voie vers la gauche
      ]
    }
  ],

  // Types de vÃ©hicules PNJ
  vehicleTypes: [
    { type: 'sedan', width: 50, height: 30, speedRange: [1.0, 1.8], color: null, icon: 'SD' },
    { type: 'suv', width: 55, height: 32, speedRange: [1.1, 2.0], color: null, icon: 'SV' },
    { type: 'truck', width: 65, height: 35, speedRange: [0.9, 1.7], color: null, icon: 'TR' },
    { type: 'taxi', width: 50, height: 30, speedRange: [1.3, 2.4], color: '#ffff00', icon: 'TX' },
    { type: 'bus', width: 80, height: 35, speedRange: [0.7, 1.2], color: '#4488ff', icon: 'BS' }
  ],

  // Couleurs disponibles
  colors: [
    "#ff4444", "#4444ff", "#ffff44", "#44ff44", 
    "#ff44ff", "#ffffff", "#222222", "#888888",
    "#ff8844", "#44ffff", "#8844ff", "#44ff88"
  ],

  /**
   * Initialise le systÃ¨me de trafic
   */
  init() {
    this.vehicles = [];
    this.vehiclePool = [];
    
    // Spawn initial
    const initialCount = Math.min(this.maxVehicles, 15);
    for (let i = 0; i < initialCount; i++) {
      this.spawn();
    }
    
    console.log(`Traffic system initialized with ${this.vehicles.length} vehicles`);
  },

  /**
   * Obtient un vÃ©hicule du pool ou en crÃ©e un nouveau
   */
  getFromPool() {
    if (this.vehiclePool.length > 0) {
      return this.vehiclePool.pop();
    }
    return this.createVehicle();
  },

  /**
   * Retourne un vÃ©hicule au pool
   */
  returnToPool(vehicle) {
    if (this.vehiclePool.length < 20) {
      this.resetVehicle(vehicle);
      this.vehiclePool.push(vehicle);
    }
  },

  /**
   * CrÃ©e un nouveau vÃ©hicule
   */
  createVehicle() {
    return {
      x: 0, y: 0,
      width: 50, height: 30,
      angle: 0,
      speed: 0,
      targetSpeed: 2.0,
      acceleration: 0.05,
      brakePower: 0.1,
      color: "#ffffff",
      type: 'sedan',
      icon: 'SD',
      health: 100,
      maxHealth: 100,
      onRoad: null,
      lane: null,
      changeTimer: 0,
      braking: false,
      turning: false,
      honkCooldown: 0,
      awareness: 100,        // Distance de dÃ©tection
      patience: 100,         // Patience avant klaxon
      aggressiveness: 0.5,   // 0 = prudent, 1 = agressif
      state: 'driving',      // 'driving', 'stopping', 'avoiding', 'waiting'
      stateTimer: 0,
      targetLane: null,
      lastCollisionTime: 0,
      priority: Utils.randomFloat(0.5, 1.5),
      lateralIntent: 0,
      stuckFrames: 0,
      ghostTimer: 0,
      lastX: 0,
      lastY: 0

    };
  },

  /**
   * RÃ©initialise un vÃ©hicule pour rÃ©utilisation
   */
  resetVehicle(vehicle) {
    vehicle.health = 100;
    vehicle.speed = 0;
    vehicle.braking = false;
    vehicle.turning = false;
    vehicle.state = 'driving';
    vehicle.stateTimer = 0;
    vehicle.honkCooldown = 0;
    vehicle.stuckFrames = 0;
    vehicle.ghostTimer = 0;
    vehicle.lastX = vehicle.x;
    vehicle.lastY = vehicle.y;
  },

  /**
   * Spawn un vÃ©hicule sur une route
   */
  spawn() {
    if (this.vehicles.length >= this.maxVehicles) return null;

    const vehicle = this.getFromPool();
    const vType = this.vehicleTypes[Utils.randomInt(0, this.vehicleTypes.length - 1)];
    
    // Configuration du type
    vehicle.width = vType.width;
    vehicle.height = vType.height;
    vehicle.type = vType.type;
    vehicle.icon = vType.icon;
    vehicle.targetSpeed = Utils.randomFloat(vType.speedRange[0], vType.speedRange[1]);
    vehicle.color = vType.color || this.colors[Utils.randomInt(0, this.colors.length - 1)];
    vehicle.maxHealth = vType.type === 'truck' || vType.type === 'bus' ? 150 : 100;
    vehicle.health = vehicle.maxHealth;
    
    // PersonnalitÃ© alÃ©atoire
    vehicle.aggressiveness = Utils.randomFloat(0.2, 0.8);
    vehicle.patience = Utils.randomFloat(60, 200);
    vehicle.awareness = Utils.randomFloat(80, 150);

    // Choisir une route et une voie
    const road = this.roads[Utils.randomInt(0, this.roads.length - 1)];
    const lane = road.lanes[Utils.randomInt(0, road.lanes.length - 1)];
    
    this.positionOnLane(vehicle, road, lane);
    
    vehicle.onRoad = road;
    vehicle.lane = lane;
    vehicle.changeTimer = Utils.randomInt(300, 600);
    vehicle.stuckFrames = 0;
    vehicle.ghostTimer = 0;
    vehicle.lastX = vehicle.x;
    vehicle.lastY = vehicle.y;

    this.vehicles.push(vehicle);
    return vehicle;
  },

  /**
   * Positionne un vÃ©hicule sur une voie
   */
  positionOnLane(vehicle, road, lane) {
    if (road.direction === 'vertical') {
      vehicle.x = road.x + lane.offset;
      vehicle.y = lane.direction === 90 ? -vehicle.height : Game.Map.height;
      vehicle.angle = lane.direction;
    } else {
      vehicle.x = lane.direction === 0 ? -vehicle.width : Game.Map.width;
      vehicle.y = road.y + lane.offset;
      vehicle.angle = lane.direction;
    }
  },

  /**
   * Met Ã  jour tous les vÃ©hicules
   */
  update() {
    // Spawn pÃ©riodique
    this.spawnTimer++;
    if (this.spawnTimer >= this.spawnInterval && this.vehicles.length < this.maxVehicles) {
      this.spawn();
      this.spawnTimer = 0;
    }

    // Mise Ã  jour des vÃ©hicules
    for (let i = this.vehicles.length - 1; i >= 0; i--) {
      const vehicle = this.vehicles[i];
      if (!vehicle) continue;
      
      // Mettre Ã  jour les timers
      vehicle.changeTimer--;
      if (vehicle.honkCooldown > 0) vehicle.honkCooldown--;
      if (vehicle.stateTimer > 0) vehicle.stateTimer--;
      if (vehicle.ghostTimer > 0) vehicle.ghostTimer--;

      const prevX = vehicle.x;
      const prevY = vehicle.y;
      
      // IA de conduite
      this.updateAI(vehicle);
      
      // Mise Ã  jour physique
      this.updatePhysics(vehicle);
      const movedDistance = Utils.distance(prevX, prevY, vehicle.x, vehicle.y);
      this.resolveTrafficJam(vehicle, movedDistance, i);
      vehicle.lastX = vehicle.x;
      vehicle.lastY = vehicle.y;
      
      // VÃ©rifier les limites
      if (this.isOutOfBounds(vehicle)) {
        this.respawnVehicle(vehicle, i);
        continue;
      }
      
      // Destruction si santÃ© Ã©puisÃ©e
      if (vehicle.health <= 0) {
        this.destroyVehicle(vehicle, i);
        continue;
      }
    }
  },

  /**
   * IA de conduite avancÃ©e
   */
updateAI(vehicle) {
  const obstacles = this.detectObstacles(vehicle);
  const playerThreat = this.detectPlayerThreat(vehicle);

  if (playerThreat && playerThreat.distance < 100) {
    this.handlePlayerThreat(vehicle, playerThreat);
  } else if (obstacles.length > 0) {
    this.handleObstaclesImproved(vehicle, obstacles);
  } else {
    this.normalDrivingImproved(vehicle);
  }

  // Tentative de dÃ©passement si on est lent ou bloquÃ©
  if (vehicle.speed < vehicle.targetSpeed * 0.7 || vehicle.state === 'waiting') {
    if (Math.random() < 0.15) {  // Plus souvent en cas de ralentissement
      this.tryChangeLaneSafely(vehicle);
    }
  } else if (vehicle.changeTimer <= 0) {
    if (Math.random() < 0.08) {
      this.tryChangeLaneSafely(vehicle);
    }
    vehicle.changeTimer = Utils.randomInt(500, 1000);
  }

  // ðŸ”“ DÃ©blocage forcÃ© si bloquÃ© trop longtemps
if (vehicle.state === 'waiting') {
  vehicle.stateTimer++;

  if (vehicle.stateTimer > 120) { // ~2 secondes
    this.forceLaneChange(vehicle);
    vehicle.stateTimer = 0;
  }
} else {
  vehicle.stateTimer = 0;
}

},

handleObstaclesImproved(vehicle, obstacles) {
  const nearest = obstacles[0];
  
  // Distance de sÃ©curitÃ© proportionnelle Ã  la vitesse + marge fixe
  const safeDistance = vehicle.speed * 12 + 30;  // Plus espacÃ©e que avant

  if (nearest.distance < safeDistance * 0.5) {
    // TrÃ¨s proche â†’ freinage fort
    vehicle.speed = Math.max(0, vehicle.speed - vehicle.brakePower * 2);
    vehicle.braking = true;
    vehicle.state = 'stopping';

    // Klaxon si bloquÃ© longtemps
    vehicle.patience--;
    if (vehicle.patience <= 0 && vehicle.honkCooldown <= 0) {
      this.honk(vehicle, 0.5);
      vehicle.honkCooldown = 90;
      vehicle.patience = Utils.randomFloat(150, 300);
    }

  } else if (nearest.distance < safeDistance) {
    // Ralentir pour suivre
    const followSpeed = nearest.type === 'traffic' 
      ? Math.max(nearest.object.speed, 1.0) 
      : vehicle.targetSpeed * 0.5;

    vehicle.speed = Utils.lerp(vehicle.speed, followSpeed, 0.1);
    vehicle.braking = true;
    vehicle.state = 'waiting';

  } else {
    // LÃ©gÃ¨re correction latÃ©rale si trop alignÃ©
    if (nearest.perpDist < 30 && nearest.distance < safeDistance * 1.5) {
      this.applyLateralAvoidance(vehicle, nearest);
    }
    vehicle.braking = false;
  }
},

applyLateralAvoidance(vehicle, obstacle) {
  vehicle.state = 'avoiding';

  // DÃ©calage voulu, stockÃ© comme intention
  vehicle.lateralIntent = (obstacle.perpDist > 0 ? 1 : -1) * 1;

  // Freinage modÃ©rÃ© (PAS brutal)
  vehicle.speed *= 0.85;

  // LÃ©gÃ¨re rotation visuelle
  vehicle.angle += vehicle.lateralIntent * 0.5;
},


normalDrivingImproved(vehicle) {
  vehicle.state = 'driving';
  vehicle.braking = false;

  // AccÃ©lÃ©ration plus vive quand la voie est libre
  if (vehicle.speed < vehicle.targetSpeed) {
    vehicle.speed += vehicle.acceleration;  // Plus rÃ©actif
    vehicle.speed = Math.min(vehicle.speed, vehicle.targetSpeed * 1.05); // Petit dÃ©passement temporaire
  }
},

tryChangeLaneSafely(vehicle, checkDist = 150) {
  if (!vehicle.onRoad || vehicle.onRoad.lanes.length < 2 || vehicle.turning) return;

  const road = vehicle.onRoad;
  const candidateLanes = road.lanes
    .filter((lane) => lane !== vehicle.lane && Math.abs(lane.direction - vehicle.lane.direction) < 45);

  for (const targetLane of candidateLanes) {
    if (!this.isLaneClear(vehicle, road, targetLane, checkDist)) continue;
    vehicle.targetLane = targetLane;
    vehicle.turning = true;
    vehicle.state = 'driving';
    vehicle.braking = false;
    return;
  }
},

forceLaneChange(vehicle) {
  if (!vehicle.onRoad || vehicle.turning) return;

  for (const lane of vehicle.onRoad.lanes) {
    if (lane !== vehicle.lane && Math.abs(lane.direction - vehicle.lane.direction) < 45) {
      vehicle.targetLane = lane;
      vehicle.turning = true;
      vehicle.braking = false;
      vehicle.state = 'driving';
      return;
    }
  }
},

isLaneClear(vehicle, road, targetLane, checkDist = 120) {
  const rad = Utils.degToRad(vehicle.angle);
  const cx = vehicle.x + vehicle.width / 2;
  const cy = vehicle.y + vehicle.height / 2;

  for (const other of this.vehicles) {
    if (other === vehicle || other.lane !== targetLane) continue;
    if (other.ghostTimer > 0) continue;

    const ox = other.x + other.width / 2;
    const oy = other.y + other.height / 2;
    const dx = ox - cx;
    const dy = oy - cy;

    const distAlong = dx * Math.cos(rad) + dy * Math.sin(rad);

    if (Math.abs(distAlong) < checkDist) {
      // Si quelqu'un est trop prÃ¨s dans la voie cible â†’ refus
      const lateralDist = road.direction === 'vertical' 
        ? Math.abs(ox - (road.x + targetLane.offset))
        : Math.abs(oy - (road.y + targetLane.offset));
      if (lateralDist < 50) return false;
    }
  }
  return true;
},
  /**
   * DÃ©tecte les obstacles devant le vÃ©hicule
   */
  detectObstacles(vehicle) {
    const obstacles = [];
    const road = vehicle.onRoad;
    if (!road || !vehicle.lane) return obstacles;
    
    // Centre du vÃ©hicule
    const cx = vehicle.x + vehicle.width / 2;
    const cy = vehicle.y + vehicle.height / 2;

    // VÃ©rifier les autres vÃ©hicules du trafic
    for (const other of this.vehicles) {
      if (other === vehicle) continue;
      if (vehicle.ghostTimer > 0 || other.ghostTimer > 0) continue;
      if (other.onRoad !== road) continue;
      if (!other.lane) continue;
      if (Math.abs(other.lane.direction - vehicle.lane.direction) > 20) continue;
      
      const ox = other.x + other.width / 2;
      const oy = other.y + other.height / 2;
      
      let along = 0;
      let perp = 0;

      if (road.direction === 'vertical') {
        const dirSign = vehicle.lane.direction === 90 ? 1 : -1;
        along = (oy - cy) * dirSign;
        perp = Math.abs(ox - cx);
      } else {
        const dirSign = vehicle.lane.direction === 0 ? 1 : -1;
        along = (ox - cx) * dirSign;
        perp = Math.abs(oy - cy);
      }

      if (along > -8 && along < vehicle.awareness) {
        const sameLaneThreshold = (vehicle.width + other.width) * 0.6;
        if (perp < sameLaneThreshold) {
          obstacles.push({
            type: 'traffic',
            object: other,
            distance: along,
            perpDist: perp
          });
        }
      }
    }

    // VÃ©rifier les bÃ¢timents
    if (Game.Buildings && Game.Buildings.list) {
      const rad = Utils.degToRad(vehicle.angle);
      const dirX = Math.cos(rad);
      const dirY = Math.sin(rad);
      for (const building of Game.Buildings.list) {
        const bx = building.x + building.w / 2;
        const by = building.y + building.h / 2;
        
        const dx = bx - cx;
        const dy = by - cy;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const dot = dx * dirX + dy * dirY;
        if (dot > 0 && distance < vehicle.awareness) {
          obstacles.push({
            type: 'building',
            object: building,
            distance
          });
        }
      }
    }

    return obstacles.sort((a, b) => a.distance - b.distance);
  },

  /**
   * DÃ©tecte si le joueur est une menace
   */
  detectPlayerThreat(vehicle) {
    if (!Game.VehicleManager || !Game.VehicleManager.playerVehicle) return null;
    
    const playerVehicle = Game.VehicleManager.playerVehicle;
    if (!playerVehicle.occupied) return null;

    const cx = vehicle.x + vehicle.width / 2;
    const cy = vehicle.y + vehicle.height / 2;
    const px = playerVehicle.x + playerVehicle.width / 2;
    const py = playerVehicle.y + playerVehicle.height / 2;
    
    const distance = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
    
    if (distance < vehicle.awareness * 1.5) {
      // Calculer la vitesse relative et la direction
      const relativeSpeed = Math.abs(playerVehicle.speed);
      const approach = (vehicle.x - playerVehicle.x) * Math.cos(Utils.degToRad(playerVehicle.angle)) +
                       (vehicle.y - playerVehicle.y) * Math.sin(Utils.degToRad(playerVehicle.angle));
      
      if (approach > 0 && relativeSpeed > 4) {
        return { distance, speed: relativeSpeed, approach };
      }
    }
    
    return null;
  },

  /**
   * RÃ©agit Ã  la menace du joueur
   */
  handlePlayerThreat(vehicle, threat) {
    vehicle.state = 'avoiding';
    
    // Freinage d'urgence
    if (threat.distance < 60) {
      vehicle.braking = true;
      vehicle.speed *= 0.8;
    }
    
    // Klaxonner
    if (vehicle.honkCooldown <= 0) {
      this.honk(vehicle, 0.5);
      vehicle.honkCooldown = 60;
    }
    
    // Essayer de s'Ã©carter
    const rad = Utils.degToRad(vehicle.angle + 90);
    vehicle.x += Math.cos(rad) * 0.5;
    vehicle.y += Math.sin(rad) * 0.5;
  },

  /**
   * GÃ¨re les obstacles dÃ©tectÃ©s
   */
  handleObstacles(vehicle, obstacles) {
    const nearest = obstacles[0];
    
    if (nearest.distance < 40) {
      // Freinage d'urgence
      vehicle.state = 'stopping';
      vehicle.braking = true;
      vehicle.speed = Math.max(0, vehicle.speed - vehicle.brakePower * 2);
      
      // Klaxonner si impatient
      vehicle.patience--;
      if (vehicle.patience <= 0 && vehicle.honkCooldown <= 0) {
        this.honk(vehicle, 0.3);
        vehicle.honkCooldown = 120;
        vehicle.patience = Utils.randomFloat(60, 200);
      }
    } else if (nearest.distance < 80) {
      // Ralentir
      vehicle.state = 'waiting';
      vehicle.braking = true;
      const targetSpeed = nearest.type === 'traffic' ? 
                          nearest.object.speed * 0.9 : 
                          vehicle.targetSpeed * 0.3;
      vehicle.speed = Utils.lerp(vehicle.speed, targetSpeed, 0.1);
    }
  },

  /**
   * Conduite normale
   */
  normalDriving(vehicle) {
    vehicle.state = 'driving';
    vehicle.braking = false;
    
    // AccÃ©lÃ©rer vers la vitesse cible
    if (vehicle.speed < vehicle.targetSpeed) {
      vehicle.speed += vehicle.acceleration;
    } else if (vehicle.speed > vehicle.targetSpeed) {
      vehicle.speed -= vehicle.acceleration * 0.5;
    }
    
    // LÃ©gÃ¨res variations de vitesse
    if (Math.random() < 0.01) {
      vehicle.targetSpeed += Utils.randomFloat(-0.3, 0.3);
      vehicle.targetSpeed = Utils.clamp(vehicle.targetSpeed, 1.5, 5);
    }
  },

  /**
   * Essaie de changer de voie
   */
  tryChangeLane(vehicle) {
    if (!vehicle.onRoad || vehicle.state !== 'driving') return;
    
    const road = vehicle.onRoad;
    const currentLane = vehicle.lane;
    
    // Trouver une autre voie dans la mÃªme direction
    const sameDirLanes = road.lanes.filter(l => 
      l !== currentLane && Math.abs(l.direction - currentLane.direction) < 45
    );
    
    if (sameDirLanes.length === 0) return;
    
    const newLane = sameDirLanes[0];
    
    // VÃ©rifier si la voie est libre
    const newPos = road.direction === 'vertical' ? 
                   road.x + newLane.offset : 
                   road.y + newLane.offset;
    
    // Animer le changement de voie
    vehicle.targetLane = newLane;
    vehicle.turning = true;
    
    setTimeout(() => {
      if (vehicle.targetLane) {
        vehicle.lane = vehicle.targetLane;
        vehicle.targetLane = null;
        vehicle.turning = false;
      }
    }, 500);
  },

  /**
   * Met Ã  jour la physique du vÃ©hicule
   */
  updatePhysics(vehicle) {
  const rad = Utils.degToRad(vehicle.angle);

  vehicle.x += Math.cos(rad) * vehicle.speed;
  vehicle.y += Math.sin(rad) * vehicle.speed;

  if (vehicle.turning && vehicle.targetLane && vehicle.onRoad) {
    const targetPos = vehicle.onRoad.direction === 'vertical'
      ? vehicle.onRoad.x + vehicle.targetLane.offset
      : vehicle.onRoad.y + vehicle.targetLane.offset;

    const lerpSpeed = 0.12; // Plus rapide et fluide

    if (vehicle.onRoad.direction === 'vertical') {
      vehicle.x = Utils.lerp(vehicle.x, targetPos, lerpSpeed);
      if (Math.abs(vehicle.x - targetPos) < 8) {
        vehicle.x = targetPos;
        vehicle.lane = vehicle.targetLane;
        vehicle.targetLane = null;
        vehicle.turning = false;
      }
    } else {
      vehicle.y = Utils.lerp(vehicle.y, targetPos, lerpSpeed);
      if (Math.abs(vehicle.y - targetPos) < 8) {
        vehicle.y = targetPos;
        vehicle.lane = vehicle.targetLane;
        vehicle.targetLane = null;
        vehicle.turning = false;
      }
    }
  }

  // Petit nudge pour Ã©viter les overlaps
  this.avoidOverlap(vehicle);

  this.keepOnRoad(vehicle);
},
avoidOverlap(vehicle) {
  if (vehicle.ghostTimer > 0) return;
  if (Date.now() - vehicle.lastCollisionTime < 120) return;

  const cx = vehicle.x + vehicle.width / 2;
  const cy = vehicle.y + vehicle.height / 2;

  for (const other of this.vehicles) {
    if (other === vehicle) continue;
    if (other.ghostTimer > 0) continue;

    const ox = other.x + other.width / 2;
    const oy = other.y + other.height / 2;

    const dx = cx - ox;
    const dy = cy - oy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const minDist = (vehicle.width + other.width) * 0.45;
    if (dist < minDist && dist > 0) {
      const push = (minDist - dist) / minDist * 0.8;

      vehicle.x += (dx / dist) * push;
      vehicle.y += (dy / dist) * push;
      vehicle.speed = Math.max(0.4, vehicle.speed * 0.92);
    }
  }
},
  resolveTrafficJam(vehicle, movedDistance, index) {
    const blockedState = vehicle.state === 'waiting' || vehicle.state === 'stopping' || vehicle.state === 'avoiding';
    const nearlyStopped = Math.abs(vehicle.speed) < 0.35 || movedDistance < 0.2;

    if (blockedState && nearlyStopped) {
      vehicle.stuckFrames = (vehicle.stuckFrames || 0) + 1;
    } else {
      vehicle.stuckFrames = 0;
    }

    if (vehicle.stuckFrames === 80) {
      this.tryChangeLaneSafely(vehicle, 100);
    }

    if (vehicle.stuckFrames === 150) {
      this.forceLaneChange(vehicle);
    }

    if (vehicle.stuckFrames > 250) {
      const escaped = vehicle.turning || !!vehicle.targetLane;
      if (!escaped) {
        vehicle.ghostTimer = 45;
        vehicle.braking = false;
        vehicle.state = 'driving';
        vehicle.speed = Math.max(vehicle.speed, vehicle.targetSpeed * 0.8);
      }
      vehicle.stuckFrames = 120;
    }

    if (vehicle.stuckFrames > 420) {
      this.respawnVehicle(vehicle, index);
    }
  },
  /**
   * Garde le vÃ©hicule sur la route
   */
  keepOnRoad(vehicle) {
    if (!vehicle.onRoad || !vehicle.lane) return;
    if (vehicle.state === 'waiting' || vehicle.state === 'avoiding') return;
    
    const road = vehicle.onRoad;
    const lane = vehicle.lane;
    
    if (road.direction === 'vertical') {
      const targetX = road.x + lane.offset;
      if (Math.abs(vehicle.x - targetX) > 30) {
        vehicle.x = Utils.lerp(vehicle.x, targetX, 0.1);
      }
    } else {
      const targetY = road.y + lane.offset;
      if (Math.abs(vehicle.y - targetY) > 30) {
        vehicle.y = Utils.lerp(vehicle.y, targetY, 0.1);
      }
    }
  },

  /**
   * VÃ©rifie si le vÃ©hicule est hors limites
   */
  isOutOfBounds(vehicle) {
    const margin = 100;
    return vehicle.x < -margin || 
           vehicle.x > Game.Map.width + margin ||
           vehicle.y < -margin || 
           vehicle.y > Game.Map.height + margin;
  },

  /**
   * Respawn un vÃ©hicule
   */
  respawnVehicle(vehicle, index) {
    this.returnToPool(vehicle);
    this.vehicles.splice(index, 1);
    
    // Spawn un nouveau aprÃ¨s un dÃ©lai
    setTimeout(() => this.spawn(), 1000);
  },

  /**
   * DÃ©truit un vÃ©hicule
   */
  destroyVehicle(vehicle, index) {
    // Effets
    if (Game.Camera) {
      Game.Camera.shake(8, 15);
    }
    
    // Retirer et recycler
    this.returnToPool(vehicle);
    this.vehicles.splice(index, 1);
    
    // Respawn aprÃ¨s un dÃ©lai
    setTimeout(() => this.spawn(), 3000);
  },

  /**
   * Klaxonne
   */
  honk(vehicle, volume = 0.3) {
    if (Game.Sound) {
      Game.Sound.play("horn", volume);
    }
  },

  /**
   * Ã‰vitement mutuel entre vÃ©hicules du trafic
   */
  avoidOtherTraffic(vehicle) {
    const cx = vehicle.x + vehicle.width / 2;
    const cy = vehicle.y + vehicle.height / 2;

    for (const other of this.vehicles) {
      if (other === vehicle) continue;
      
      const ox = other.x + other.width / 2;
      const oy = other.y + other.height / 2;
      
      const dx = cx - ox;
      const dy = cy - oy;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const minDistance = 40;
      
      if (distance < minDistance && distance > 0) {
        const force = (minDistance - distance) / minDistance * 0.3;
        vehicle.x += (dx / distance) * force;
        vehicle.y += (dy / distance) * force;
        vehicle.speed *= 0.95;
      }
    }
  },

  /**
   * VÃ©rifie si un vÃ©hicule est sur une route
   */
  isOnRoad(vehicle) {
    for (const road of this.roads) {
      if (Utils.rectOverlap(
        vehicle.x, vehicle.y, vehicle.width, vehicle.height,
        road.x, road.y, road.width, road.height
      )) {
        return road;
      }
    }
    return null;
  },

  /**
   * Dessine tous les vÃ©hicules
   */
  draw(ctx) {
    for (const v of this.vehicles) {
      this.drawVehicle(ctx, v);
    }
  },

  /**
   * Dessine un vÃ©hicule individuel
   */
  drawVehicle(ctx, v) {
    ctx.save();
    ctx.translate(v.x + v.width / 2, v.y + v.height / 2);
    ctx.rotate(Utils.degToRad(v.angle));
    
    // Ombre
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fillRect(-v.width / 2 + 2, -v.height / 2 + 2, v.width, v.height);
    
    // Corps
    ctx.fillStyle = v.color;
    ctx.fillRect(-v.width / 2, -v.height / 2, v.width, v.height);
    
    // Pare-brise
    ctx.fillStyle = "rgba(100, 150, 200, 0.6)";
    ctx.fillRect(-v.width / 2 + 5, -v.height / 2 + 4, v.width - 10, 10);
    
    // Feux de freinage
    if (v.braking) {
      ctx.fillStyle = "#ff0000";
      ctx.fillRect(v.width / 2 - 6, -v.height / 2 + 2, 4, 4);
      ctx.fillRect(v.width / 2 - 6, v.height / 2 - 6, 4, 4);
    }
    
    // Clignotants si changement de voie
    if (v.turning && Math.floor(Date.now() / 200) % 2 === 0) {
      ctx.fillStyle = "#ffaa00";
      ctx.fillRect(-v.width / 2, -v.height / 2, 4, 4);
      ctx.fillRect(-v.width / 2, v.height / 2 - 4, 4, 4);
    }
    
    // Contour
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-v.width / 2, -v.height / 2, v.width, v.height);
    
    ctx.restore();

    // Barre de vie si endommagÃ©
    if (v.health < v.maxHealth) {
      const barWidth = v.width;
      const barHeight = 4;
      const healthRatio = Math.max(0, v.health) / v.maxHealth;
      
      ctx.fillStyle = "#000";
      ctx.fillRect(v.x, v.y - 10, barWidth, barHeight);
      
      ctx.fillStyle = healthRatio > 0.5 ? "#00ff00" : 
                     healthRatio > 0.25 ? "#ffff00" : "#ff0000";
      ctx.fillRect(v.x, v.y - 10, barWidth * healthRatio, barHeight);
    }
    
    // IcÃ´ne
    ctx.fillStyle = "#ffffff";
    ctx.font = "11px Arial";
    ctx.textAlign = "center";
    const trafficLabel = (v.icon || (v.type || "C").slice(0, 2).toUpperCase());
    ctx.fillText(trafficLabel, v.x + v.width / 2, v.y + v.height / 2 + 4);
    
    // Debug: afficher l'Ã©tat
    if (Game.debug) {
      ctx.fillStyle = "#ffffff";
      ctx.font = "10px Arial";
      ctx.fillText(v.state, v.x + v.width / 2, v.y - 15);
      ctx.fillText(`P:${v.priority.toFixed(2)}`, v.x + v.width / 2, v.y - 5);

    }
  }
};

// Utilitaire lerp si pas dÃ©fini
Utils.lerp = Utils.lerp || function(a, b, t) {
  return a + (b - a) * t;
};

