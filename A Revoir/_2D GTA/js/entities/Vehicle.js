// Vehicle.js - SystÃ¨me de vÃ©hicules avancÃ© avec physique rÃ©aliste
// Version amÃ©liorÃ©e avec meilleure gestion des collisions, drifting, et effets visuels

Game.VehicleManager = {
  vehicles: [],
  playerVehicle: null,

  // Types de vÃ©hicules
  vehicleTypes: {
    sedan: {
      width: 50, height: 30, maxSpeed: 3.6, acceleration: 0.1, brakePower: 0.4,
      rotationSpeed: 2.2, driftThreshold: 0.98, health: 100, mass: 1.0, icon: "SD"
    },
    sports: {
      width: 55, height: 28, maxSpeed: 4.4, acceleration: 0.12, brakePower: 0.45,
      rotationSpeed: 2.4, driftThreshold: 0.95, health: 80, mass: 0.8, icon: "SP"
    },
    suv: {
      width: 60, height: 35, maxSpeed: 3.3, acceleration: 0.08, brakePower: 0.35,
      rotationSpeed: 2.0, driftThreshold: 0.99, health: 150, mass: 1.5, icon: "SV"
    },
    truck: {
      width: 70, height: 40, maxSpeed: 2.8, acceleration: 0.06, brakePower: 0.3,
      rotationSpeed: 1.7, driftThreshold: 0.995, health: 200, mass: 2.0, icon: "TR"
    },
    bike: {
      width: 35, height: 20, maxSpeed: 3.9, acceleration: 0.14, brakePower: 0.42,
      rotationSpeed: 2.8, driftThreshold: 0.95, health: 50, mass: 0.4, icon: "BK"
    }
  },

  colors: ["#ffff44", "#ff4444", "#4444ff", "#44ff44", "#ff44ff", "#ffffff", "#222222"],

  spawn(x, y, type = "sedan", color = null) {
    const vType = this.vehicleTypes[type] || this.vehicleTypes.sedan;
    color = color || this.colors[Utils.randomInt(0, this.colors.length - 1)];

    const vehicle = {
      x, y,
      width: vType.width,
      height: vType.height,
      angle: Utils.randomInt(0, 359),
      speed: 0,
      maxSpeed: vType.maxSpeed,
      acceleration: vType.acceleration,
      brakePower: vType.brakePower,
      rotationSpeed: vType.rotationSpeed,
      mass: vType.mass,
      driftThreshold: vType.driftThreshold,
      driftAmount: 0,
      isDrifting: false,
      wheelAngle: 0,
      throttle: 0,
      reverseThrottle: 0,
      type, color,
      icon: vType.icon,
      occupied: false,
      health: vType.health,
      maxHealth: vType.health,
      damage: 0,
      smokeTimer: 0,
      skidMarks: [],
      lastCollisionTime: 0,
      collisionCooldown: 0,
      avoidForce: { x: 0, y: 0 },
      isColliding: false
    };
    
    this.vehicles.push(vehicle);
    return vehicle;
  },

  init() {
    this.vehicles = [];
    this.spawn(500, 500, "sedan", "#ffff44");
    this.spawn(1500, 800, "sports", "#ff4444");
    this.spawn(2000, 1500, "suv", "#4444ff");
    this.spawn(800, 1800, "truck", "#44ff44");
    this.spawn(2500, 500, "bike", "#ff44ff");
    this.spawn(1200, 1200, "sedan", "#ffffff");
    this.spawn(400, 1600, "sports", "#222222");
  },

  update() {
    const player = Game.player || Game.Player;
    if (!player) return;
    
    if (Input.wasJustPressed && Input.wasJustPressed("e")) {
      this.handleEnterExit();
    }

    for (let i = this.vehicles.length - 1; i >= 0; i--) {
      const vehicle = this.vehicles[i];
      if (!vehicle) continue;
      
      if (vehicle.smokeTimer > 0) vehicle.smokeTimer--;
      if (vehicle.collisionCooldown > 0) vehicle.collisionCooldown--;
      
      // Nettoyer les marques de dÃ©rapage
      vehicle.skidMarks = vehicle.skidMarks.filter(m => m && m.life-- > 0);

      if (vehicle.occupied) {
        this.updatePlayerVehicle(vehicle, player);
        this.playerVehicle = vehicle;
      } else {
        this.updateIdleVehicle(vehicle);
      }

      // Mouvement
      const rad = Utils.degToRad(vehicle.angle);
      vehicle.x += Math.cos(rad) * vehicle.speed;
      vehicle.y += Math.sin(rad) * vehicle.speed;

      // Limites map
      vehicle.x = Utils.clamp(vehicle.x, 0, Game.Map.width - vehicle.width);
      vehicle.y = Utils.clamp(vehicle.y, 0, Game.Map.height - vehicle.height);

      // Destruction
      if (vehicle.health <= 0) {
        const wasPlayer = (vehicle === this.playerVehicle);
        this.explodeVehicle(vehicle);
        this.vehicles.splice(i, 1);
        if (wasPlayer) {
          this.playerVehicle = null;
          player.inVehicle = false;
        }
      }
    }

    this.handleVehicleCollisions();
    this.preventCollisions();
    this.handleTrafficCollisions();
    this.handleBuildingCollisions();
    this.handleEnemyCollisions();
  },

  updatePlayerVehicle(vehicle, player) {
    const upPressed = Input.moveUp();
    const downPressed = Input.moveDown();

    // Acceleration progressive (pas de pic instantane)
    if (upPressed && !downPressed) {
      vehicle.throttle = Utils.clamp((vehicle.throttle || 0) + 0.035, 0, 1);
      vehicle.reverseThrottle = Utils.clamp((vehicle.reverseThrottle || 0) - 0.08, 0, 1);
    } else if (downPressed && !upPressed) {
      vehicle.reverseThrottle = Utils.clamp((vehicle.reverseThrottle || 0) + 0.03, 0, 1);
      vehicle.throttle = Utils.clamp((vehicle.throttle || 0) - 0.1, 0, 1);
    } else {
      vehicle.throttle = Utils.clamp((vehicle.throttle || 0) - 0.07, 0, 1);
      vehicle.reverseThrottle = Utils.clamp((vehicle.reverseThrottle || 0) - 0.05, 0, 1);
    }

    const forwardTarget = vehicle.maxSpeed * (vehicle.throttle || 0);
    const reverseTarget = -vehicle.maxSpeed * 0.28 * (vehicle.reverseThrottle || 0);
    let desiredSpeed = forwardTarget + reverseTarget;

    // Le frein freine d'abord avant d'inverser
    if (downPressed && vehicle.speed > 0.1) {
      desiredSpeed = 0;
      vehicle.speed = Math.max(0, vehicle.speed - vehicle.brakePower * 0.22);
    }

    const blend = desiredSpeed >= vehicle.speed ? 0.04 : 0.08;
    vehicle.speed = Utils.lerp(vehicle.speed, desiredSpeed, blend);

    if (!upPressed && !downPressed && Math.abs(vehicle.speed) < 0.03) {
      vehicle.speed = 0;
    }

    // Direction
    let turnInput = 0;
    if (Input.moveLeft()) turnInput -= 1;
    if (Input.moveRight()) turnInput += 1;

    // Force d'Ã©vitement
    let finalTurn = turnInput;
    if (vehicle.isColliding && Math.abs(vehicle.avoidForce.x) > 0.1) {
      finalTurn += vehicle.avoidForce.x * 0.3;
      vehicle.avoidForce.x *= 0.9;
      vehicle.avoidForce.y *= 0.9;
    }
    
    if (vehicle.isColliding && Date.now() - vehicle.lastCollisionTime > 200) {
      vehicle.isColliding = false;
      vehicle.avoidForce = { x: 0, y: 0 };
    }

    if (finalTurn !== 0) {
      const speedRatio = Math.abs(vehicle.speed) / vehicle.maxSpeed;
      const turnEfficiency = 1 - speedRatio * 0.5;
      const steeringAuthority = Utils.clamp(
        Math.abs(vehicle.speed) / (vehicle.maxSpeed * 0.75),
        0.2,
        1
      );
      
      vehicle.wheelAngle = Utils.clamp(vehicle.wheelAngle + finalTurn * 1.1, -20, 20);
      const baseTurn = vehicle.rotationSpeed * finalTurn * turnEfficiency * steeringAuthority * 0.28;
      
      // Drift
      if (speedRatio > vehicle.driftThreshold && Math.abs(finalTurn) > 0.5) {
        vehicle.driftAmount = Utils.clamp(vehicle.driftAmount + 0.1, 0, 1);
        vehicle.isDrifting = true;
        if (Math.random() < 0.3) this.addSkidMark(vehicle);
      } else {
        vehicle.driftAmount = Math.max(0, vehicle.driftAmount - 0.05);
        vehicle.isDrifting = vehicle.driftAmount > 0.1;
      }
      
      vehicle.angle += baseTurn * (1 + vehicle.driftAmount * speedRatio * 2);
    } else {
      vehicle.wheelAngle *= 0.8;
      vehicle.driftAmount = Math.max(0, vehicle.driftAmount - 0.1);
      vehicle.isDrifting = false;
    }

    // Normaliser l'angle
    vehicle.angle = ((vehicle.angle % 360) + 360) % 360;

    // Sync joueur
    player.x = vehicle.x + vehicle.width / 2 - (player.size || 20) / 2;
    player.y = vehicle.y + vehicle.height / 2 - (player.size || 20) / 2;
    player.angle = vehicle.angle;
    player.inVehicle = true;
    player.vehicleSpeed = vehicle.speed;

    if (vehicle.health < vehicle.maxHealth * 0.3) {
      vehicle.smokeTimer = 10;
    }
  },

  updateIdleVehicle(vehicle) {
    vehicle.speed *= 0.98;
    if (Math.abs(vehicle.speed) < 0.1) vehicle.speed = 0;
    vehicle.wheelAngle *= 0.9;
    vehicle.throttle = Utils.clamp((vehicle.throttle || 0) - 0.08, 0, 1);
    vehicle.reverseThrottle = Utils.clamp((vehicle.reverseThrottle || 0) - 0.08, 0, 1);
    vehicle.driftAmount = 0;
    vehicle.isDrifting = false;
  },

  handleEnterExit() {
    const player = Game.player || Game.Player;
    if (!player) return;
    
    if (player.inVehicle && this.playerVehicle) {
      // Sortir
      const v = this.playerVehicle;
      v.occupied = false;
      v.throttle = 0;
      v.reverseThrottle = 0;
      player.inVehicle = false;
      player.currentVehicle = null;
      
      const rad = Utils.degToRad(v.angle - 90);
      player.x = v.x + v.width/2 + Math.cos(rad) * 50 - (player.size || 20) / 2;
      player.y = v.y + v.height/2 + Math.sin(rad) * 50 - (player.size || 20) / 2;
      
      this.playerVehicle = null;
      if (Game.HUD) Game.HUD.showMessage("ðŸš¶ VÃ©hicule quittÃ©", 60);
    } else {
      // Entrer
      let found = null;
      let minDist = Infinity;
      
      for (const v of this.vehicles) {
        if (v.occupied) continue;
        const dist = Utils.distance(
          player.x + (player.size || 20) / 2, player.y + (player.size || 20) / 2,
          v.x + v.width / 2, v.y + v.height / 2
        );
        if (dist < 60 && dist < minDist) {
          found = v;
          minDist = dist;
        }
      }
      
      if (found) {
        found.occupied = true;
        found.speed = 0;
        found.throttle = 0;
        found.reverseThrottle = 0;
        player.inVehicle = true;
        player.currentVehicle = found;
        this.playerVehicle = found;
        player.x = found.x + found.width / 2 - (player.size || 20) / 2;
        player.y = found.y + found.height / 2 - (player.size || 20) / 2;
        player.angle = found.angle;
        if (Game.HUD) Game.HUD.showMessage(`${found.icon} ${found.type} entrÃ©`, 60);
      } else {
        if (Game.HUD) Game.HUD.showMessage("âŒ Aucun vÃ©hicule Ã  proximitÃ©", 60);
      }
    }
  },

  addSkidMark(vehicle) {
    const mark = {
      x: vehicle.x + vehicle.width / 2,
      y: vehicle.y + vehicle.height / 2,
      angle: vehicle.angle,
      life: 30,
      width: 4,
      opacity: 0.7
    };
    if (vehicle.skidMarks.length > 20) vehicle.skidMarks.shift();
    vehicle.skidMarks.push(mark);
  },

  preventCollisions() {
    const lookAhead = 100;
    
    for (let i = 0; i < this.vehicles.length; i++) {
      const v1 = this.vehicles[i];
      if (!v1.occupied || v1.speed < 2) continue;
      
      const rad = Utils.degToRad(v1.angle);
      const futureX = v1.x + Math.cos(rad) * lookAhead;
      const futureY = v1.y + Math.sin(rad) * lookAhead;
      
      for (let j = 0; j < this.vehicles.length; j++) {
        if (i === j) continue;
        const v2 = this.vehicles[j];
        
        const dx = futureX - (v2.x + v2.width/2);
        const dy = futureY - (v2.y + v2.height/2);
        const dist = Math.sqrt(dx*dx + dy*dy);
        const minDist = (v1.width + v2.width) / 2;
        
        if (dist < minDist) {
          const avoidX = -dy / dist;
          const avoidY = dx / dist;
          v1.avoidForce.x += avoidX * 0.5;
          v1.avoidForce.y += avoidY * 0.5;
          v1.speed *= 0.95;
          
          if (Math.random() < 0.1 && Game.Sound) {
            Game.Sound.play("horn", 0.3);
          }
        }
      }
    }
  },

  handleVehicleCollisions() {
    const now = Date.now();
    
    for (let i = 0; i < this.vehicles.length; i++) {
      for (let j = i + 1; j < this.vehicles.length; j++) {
        const v1 = this.vehicles[i];
        const v2 = this.vehicles[j];
        
        if (now - (v1.lastCollisionTime || 0) < 500) continue;
        if (now - (v2.lastCollisionTime || 0) < 500) continue;
        
        if (Utils.rectOverlap(v1.x, v1.y, v1.width, v1.height, v2.x, v2.y, v2.width, v2.height)) {
          this.resolveVehicleCollision(v1, v2);
          v1.lastCollisionTime = now;
          v2.lastCollisionTime = now;
        }
      }
    }
  },

  resolveVehicleCollision(v1, v2) {
    const now = Date.now();
    if (now - v1.lastCollisionTime < 100 || now - v2.lastCollisionTime < 100) return;
    
    const dx = (v1.x + v1.width/2) - (v2.x + v2.width/2);
    const dy = (v1.y + v1.height/2) - (v2.y + v2.height/2);
    const dist = Math.sqrt(dx*dx + dy*dy) || 1;
    
    const nx = dx / dist;
    const ny = dy / dist;
    
    const overlapX = (v1.width + v2.width) / 2 - Math.abs(dx);
    const overlapY = (v1.height + v2.height) / 2 - Math.abs(dy);
    
    // SÃ©paration
    if (Math.abs(overlapX - overlapY) < 5) {
      v1.x += nx * 1.5;
      v1.y += ny * 1.5;
      v2.x -= nx * 1.5;
      v2.y -= ny * 1.5;
    } else if (overlapX < overlapY) {
      v1.x += dx > 0 ? overlapX : -overlapX;
      v2.x += dx > 0 ? -overlapX : overlapX;
    } else {
      v1.y += dy > 0 ? overlapY : -overlapY;
      v2.y += dy > 0 ? -overlapY : overlapY;
    }
    
    // DÃ©gÃ¢ts
    const speedDiff = Math.abs(v1.speed - v2.speed) * Math.abs(nx + ny);
    const damage = Math.floor(speedDiff * 6);
    v1.health -= damage;
    v2.health -= damage;
    v1.damage += damage;
    v2.damage += damage;
    
    // Transfert d'Ã©lan
    if (speedDiff > 1) {
      const impulse = 0.5;
      v1.speed = (v1.speed * (1 - impulse) + v2.speed * impulse) * 0.7;
      v2.speed = (v2.speed * (1 - impulse) + v1.speed * impulse) * 0.7;
    } else {
      v1.speed *= 0.8;
      v2.speed *= 0.8;
    }
    
    v1.isColliding = v2.isColliding = true;
    v1.lastCollisionTime = v2.lastCollisionTime = now;
    
    // Effets
    if (speedDiff > 2 && Game.Camera && (v1.occupied || v2.occupied)) {
      Game.Camera.shake(Math.min(speedDiff, 20), 12);
    }
    if (speedDiff > 2 && Game.HUD) {
      Game.HUD.showMessage(speedDiff > 8 ? "ðŸ’¥ CHOC!" : "ðŸ’¥ Impact!", 30);
    }
    if (speedDiff > 5) {
      this.addSkidMark(v1);
      this.addSkidMark(v2);
    }
  },

  handleTrafficCollisions() {
    if (!Game.Traffic || !Game.Traffic.vehicles) return;
    
    for (const pv of this.vehicles) {
      if (!pv.occupied) continue;
      
      for (const tv of Game.Traffic.vehicles) {
        if (Utils.rectOverlap(pv.x, pv.y, pv.width, pv.height, tv.x, tv.y, tv.width, tv.height)) {
          this.resolveTrafficCollision(pv, tv);
        }
      }
    }
  },

  resolveTrafficCollision(pv, tv) {
    const dx = (pv.x + pv.width/2) - (tv.x + tv.width/2);
    const dy = (pv.y + pv.height/2) - (tv.y + tv.height/2);
    const dist = Math.sqrt(dx*dx + dy*dy) || 1;
    
    const overlapX = (pv.width + tv.width) / 2 - Math.abs(dx);
    const overlapY = (pv.height + tv.height) / 2 - Math.abs(dy);
    
    if (overlapX < overlapY) {
      pv.x += dx > 0 ? overlapX : -overlapX;
      tv.x += dx > 0 ? -overlapX : overlapX;
    } else {
      pv.y += dy > 0 ? overlapY : -overlapY;
      tv.y += dy > 0 ? -overlapY : overlapY;
    }
    
    const relSpeed = Math.abs(pv.speed - tv.speed);
    const damage = Math.floor(relSpeed * 6);
    
    pv.health -= damage;
    tv.health = (tv.health || 100) - damage;
    pv.damage += damage;
    
    if (relSpeed > 1) {
      const impulse = 0.6;
      pv.speed = (pv.speed * (1 - impulse) + tv.speed * impulse) * 0.7;
      tv.speed = (tv.speed * (1 - impulse) + pv.speed * impulse) * 0.7;
    } else {
      pv.speed *= 0.6;
      tv.speed *= 0.6;
    }
    
    if (relSpeed > 2) {
      if (Game.Camera) Game.Camera.shake(Math.min(relSpeed * 2, 20), 12);
      if (Game.HUD) {
        const bonus = Math.floor(relSpeed * 5);
        Game.HUD.money = (Game.HUD.money || 0) + bonus;
        Game.HUD.showMessage(`ðŸ’¥ Accident! +$${bonus}`, 60);
      }
    }
    
    if (tv.health <= 0) {
      this.destroyTrafficVehicle(tv);
    }
  },

  destroyTrafficVehicle(tv) {
    if (Game.Traffic && Game.Traffic.vehicles) {
      const idx = Game.Traffic.vehicles.indexOf(tv);
      if (idx !== -1) {
        Game.Traffic.vehicles.splice(idx, 1);
        setTimeout(() => Game.Traffic && Game.Traffic.spawn && Game.Traffic.spawn(), 3000);
      }
    }
    if (Game.Camera) Game.Camera.shake(10, 15);
    if (Game.HUD) Game.HUD.showMessage("ðŸ’¥ VÃ©hicule dÃ©truit!", 60);
  },

  handleBuildingCollisions() {
    if (!Game.Buildings || !Game.Buildings.list) return;
    
    for (const v of this.vehicles) {
      for (const b of Game.Buildings.list) {
        if (Utils.rectOverlap(v.x, v.y, v.width, v.height, b.x, b.y, b.w, b.h)) {
          const dx = (v.x + v.width/2) - (b.x + b.w/2);
          const dy = (v.y + v.height/2) - (b.y + b.h/2);
          
          const overlapX = (v.width + b.w) / 2 - Math.abs(dx);
          const overlapY = (v.height + b.h) / 2 - Math.abs(dy);
          
          if (overlapX < overlapY) {
            v.x += dx > 0 ? overlapX : -overlapX;
          } else {
            v.y += dy > 0 ? overlapY : -overlapY;
          }
          
          const damage = Math.abs(v.speed) * 8;
          v.health -= damage;
          v.damage += damage;
          v.speed *= -0.2;
          
          if (v.occupied && Game.Camera) {
            Game.Camera.shake(Math.min(damage / 2, 25), 20);
            if (Game.HUD) Game.HUD.showMessage("ðŸ’¥ Impact!", 30);
          }
        }
      }
    }
  },

  handleEnemyCollisions() {
    if (!Game.EnemyManager || !Game.EnemyManager.enemies) return;
    
    for (const v of this.vehicles) {
      if (!v.occupied || Math.abs(v.speed) < 2) continue;

      for (const enemy of Game.EnemyManager.enemies) {
        if (Utils.rectOverlap(v.x, v.y, v.width, v.height, enemy.x, enemy.y, enemy.size, enemy.size)) {
          enemy.health = 0;
          
          if (Game.HUD) {
            const bonus = 50 + Math.floor(Math.abs(v.speed) * 10);
            Game.HUD.showMessage(`ðŸ’€ Ã‰crasÃ©! +$${bonus}`, 60);
            Game.HUD.money = (Game.HUD.money || 0) + bonus;
          }
          
          if (Game.Camera) Game.Camera.shake(5, 10);
        }
      }
    }
  },

  explodeVehicle(vehicle) {
    if (!vehicle) return;
    
    if (Game.Camera) Game.Camera.shake(20, 30);
    if (Game.HUD) Game.HUD.showMessage("ðŸ’¥ VÃ‰HICULE DÃ‰TRUIT!", 90);

    if (vehicle.occupied) {
      const player = Game.player || Game.Player;
      player.inVehicle = false;
      player.currentVehicle = null;
      
      if (player.takeDamage) player.takeDamage(50);
      
      const rad = Utils.degToRad(vehicle.angle - 90);
      player.x = vehicle.x + Math.cos(rad) * 60;
      player.y = vehicle.y + Math.sin(rad) * 60;
      
      if (this.playerVehicle === vehicle) this.playerVehicle = null;
    }
  },

  draw(ctx) {
    // Marques de dÃ©rapage
    for (const v of this.vehicles) {
      for (const mark of v.skidMarks) {
        ctx.save();
        ctx.translate(mark.x, mark.y);
        ctx.rotate(Utils.degToRad(mark.angle));
        ctx.globalAlpha = mark.opacity * (mark.life / 30);
        ctx.fillStyle = "#222222";
        ctx.fillRect(-mark.width / 2, -mark.width / 2, mark.width, mark.width * 2);
        ctx.restore();
      }
    }

    // VÃ©hicules
    for (const v of this.vehicles) {
      ctx.save();
      ctx.translate(v.x + v.width / 2, v.y + v.height / 2);
      ctx.rotate(Utils.degToRad(v.angle));
      
      // Ombre
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fillRect(-v.width / 2 + 3, -v.height / 2 + 3, v.width, v.height);
      
      // Corps
      let color = v.color;
      if (v.occupied) color = "#ffaa00";
      else if (v.health < v.maxHealth * 0.5) color = this.darkenColor(v.color, 0.5);
      
      ctx.fillStyle = color;
      ctx.fillRect(-v.width / 2, -v.height / 2, v.width, v.height);
      
      // Pare-brise
      ctx.fillStyle = "rgba(100, 150, 200, 0.5)";
      ctx.fillRect(-v.width / 2 + 5, -v.height / 2 + 3, v.width - 10, v.height * 0.3);
      
      // Roues
      ctx.fillStyle = "#222";
      const wheelSize = 6;
      ctx.save();
      ctx.translate(-v.width / 2 + 8, -v.height / 2 - 3);
      ctx.rotate(Utils.degToRad(v.wheelAngle));
      ctx.fillRect(-wheelSize/2, -wheelSize/2, wheelSize, wheelSize);
      ctx.restore();
      
      ctx.save();
      ctx.translate(-v.width / 2 + 8, v.height / 2 - 3);
      ctx.rotate(Utils.degToRad(v.wheelAngle));
      ctx.fillRect(-wheelSize/2, -wheelSize/2, wheelSize, wheelSize);
      ctx.restore();
      
      ctx.fillRect(v.width / 2 - 8 - wheelSize/2, -v.height / 2 - 3 - wheelSize/2, wheelSize, wheelSize);
      ctx.fillRect(v.width / 2 - 8 - wheelSize/2, v.height / 2 - 3 - wheelSize/2, wheelSize, wheelSize);
      
      // Effet drift
      if (v.isDrifting) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.fillRect(-v.width / 2 - 5, -v.height / 2 + 5, 8, v.height - 10);
      }
      
      // DÃ©gÃ¢ts visuels
      if (v.damage > 20) {
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 1;
        for (let i = 0; i < Math.min(v.damage / 10, 5); i++) {
          ctx.beginPath();
          ctx.moveTo(Utils.randomInt(-v.width/3, v.width/3), Utils.randomInt(-v.height/3, v.height/3));
          ctx.lineTo(Utils.randomInt(-v.width/3, v.width/3) + 5, Utils.randomInt(-v.height/3, v.height/3) + 5);
          ctx.stroke();
        }
      }
      
      // Contour
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.strokeRect(-v.width / 2, -v.height / 2, v.width, v.height);
      
      ctx.restore();

      // FumÃ©e
      if (v.smokeTimer > 0 && v.health < v.maxHealth * 0.3) {
        ctx.fillStyle = "rgba(50, 50, 50, 0.4)";
        ctx.beginPath();
        ctx.arc(v.x + v.width/2 + Utils.randomInt(-5, 5), v.y + v.height/2 + Utils.randomInt(-5, 5), 
                Utils.randomInt(5, 15), 0, Math.PI * 2);
        ctx.fill();
      }

      // Barre de vie
      if (v.health < v.maxHealth) {
        const barW = v.width;
        const ratio = v.health / v.maxHealth;
        ctx.fillStyle = "#000";
        ctx.fillRect(v.x, v.y - 15, barW, 4);
        ctx.fillStyle = ratio > 0.5 ? "#00ff00" : ratio > 0.25 ? "#ffff00" : "#ff0000";
        ctx.fillRect(v.x, v.y - 15, barW * ratio, 4);
      }

      // IcÃ´ne et infos
      if (!v.occupied) {
        ctx.fillStyle = "#ffffff";
        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        ctx.fillText(v.icon, v.x + v.width / 2, v.y + v.height / 2 + 7);
      } else {
        const speedKmh = Math.abs(v.speed * 20).toFixed(0);
        ctx.fillStyle = "#ffffff";
        ctx.font = "12px Arial";
        ctx.textAlign = "left";
        ctx.fillText(`${speedKmh} km/h`, v.x + v.width + 5, v.y + v.height / 2);
        
        ctx.fillStyle = v.speed > 1 ? "#00ff00" : v.speed < -1 ? "#ff0000" : "#888888";
        ctx.fillText(v.speed > 1 ? "â–²" : v.speed < -1 ? "â–¼" : "â—", v.x + v.width + 5, v.y + v.height / 2 + 15);
      }
    }
  },

  darkenColor(color, amount) {
    const hex = color.replace('#', '');
    const r = Math.max(0, parseInt(hex.substr(0, 2), 16) * amount);
    const g = Math.max(0, parseInt(hex.substr(2, 2), 16) * amount);
    const b = Math.max(0, parseInt(hex.substr(4, 2), 16) * amount);
    return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
  }
};


