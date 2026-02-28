// Police.js - Wanted system

Game.Police = {
  cops: [],
  copBullets: [],
  spawnTimer: 0,
  spawnInterval: 180,
  wantedCooldown: 0,

  update() {
    const player = Game.player || Game.Player;
    if (!player || !Game.HUD) return;

    if (Game.HUD.wantedLevel > 0) {
      this.spawnTimer += 1;
      if (this.spawnTimer >= this.spawnInterval) {
        this.spawnTimer = 0;
        this.spawnCop();
      }
    } else {
      this.spawnTimer = 0;
    }

    for (let index = this.cops.length - 1; index >= 0; index--) {
      const cop = this.cops[index];
      if (!cop) continue;

      const dx = player.x - cop.x;
      const dy = player.y - cop.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;

      if (dist > 5) {
        cop.x += (dx / dist) * cop.speed;
        cop.y += (dy / dist) * cop.speed;
        cop.angle = Utils.angleBetween(cop.x, cop.y, player.x, player.y);
      }

      cop.shootTimer -= 1;
      if (cop.shootTimer <= 0 && dist < 300) {
        this.copShoot(cop);
        cop.shootTimer = cop.fireRate;
      }

      if (Game.WeaponManager) {
        for (let i = Game.WeaponManager.bullets.length - 1; i >= 0; i--) {
          const bullet = Game.WeaponManager.bullets[i];
          const distToBullet = Utils.distance(
            cop.x + cop.size / 2,
            cop.y + cop.size / 2,
            bullet.x,
            bullet.y
          );

          if (distToBullet < cop.size / 2 + 5) {
            cop.health -= bullet.damage;
            Game.WeaponManager.bullets.splice(i, 1);

            if (Game.WeaponManager.createBloodSplatter) {
              Game.WeaponManager.createBloodSplatter(cop.x + cop.size / 2, cop.y + cop.size / 2);
            }

            if (cop.health <= 0) {
              this.onCopKilled(cop);
              this.cops.splice(index, 1);
            }
            break;
          }
        }
      }

      if (!this.cops[index]) {
        continue;
      }

      if (Game.VehicleManager) {
        for (const vehicle of Game.VehicleManager.vehicles) {
          if (!vehicle.occupied || Math.abs(vehicle.speed) < 2) continue;

          const distToVehicle = Utils.distance(
            cop.x + cop.size / 2,
            cop.y + cop.size / 2,
            vehicle.x + vehicle.width / 2,
            vehicle.y + vehicle.height / 2
          );

          if (distToVehicle < (vehicle.width + cop.size) / 2) {
            this.onCopKilled(cop);
            this.cops.splice(index, 1);
            break;
          }
        }
      }

      if (!this.cops[index]) {
        continue;
      }

      cop.x = Utils.clamp(cop.x, 0, Game.Map.width - cop.size);
      cop.y = Utils.clamp(cop.y, 0, Game.Map.height - cop.size);
    }

    for (let i = this.copBullets.length - 1; i >= 0; i--) {
      const bullet = this.copBullets[i];

      bullet.x += bullet.vx;
      bullet.y += bullet.vy;
      bullet.distance += Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy);

      if (bullet.distance > bullet.range) {
        this.copBullets.splice(i, 1);
        continue;
      }

      const distToPlayer = Utils.distance(
        bullet.x,
        bullet.y,
        player.x + player.size / 2,
        player.y + player.size / 2
      );

      if (distToPlayer < player.size / 2 + 5) {
        if (player.takeDamage) {
          player.takeDamage(bullet.damage);
        }
        this.copBullets.splice(i, 1);
        continue;
      }

      if (Game.Buildings) {
        let hitBuilding = false;
        for (const building of Game.Buildings.list) {
          if (Utils.isPointInRect(bullet.x, bullet.y, building.x, building.y, building.w, building.h)) {
            hitBuilding = true;
            break;
          }
        }

        if (hitBuilding) {
          this.copBullets.splice(i, 1);
        }
      }
    }

    if (Game.HUD.wantedLevel > 0 && this.cops.length === 0) {
      this.wantedCooldown += 1;

      if (this.wantedCooldown > 600) {
        Game.HUD.wantedLevel = Math.max(0, Game.HUD.wantedLevel - 1);
        this.wantedCooldown = 0;
        Game.HUD.showMessage("Wanted level diminue", 60);
      }
    } else {
      this.wantedCooldown = 0;
    }
  },

  spawnCop() {
    if (!Game.HUD || Game.HUD.wantedLevel === 0) return;

    const player = Game.player || Game.Player;

    const angle = Utils.randomInt(0, 359);
    const distance = 400;
    const rad = Utils.degToRad(angle);

    const x = Utils.clamp(player.x + Math.cos(rad) * distance, 0, Game.Map.width - 30);
    const y = Utils.clamp(player.y + Math.sin(rad) * distance, 0, Game.Map.height - 30);

    const level = Game.HUD.wantedLevel;
    const speed = 2 + level * 0.3;
    const health = 80 + level * 20;
    const fireRate = Math.max(30, 60 - level * 5);

    this.cops.push({
      x,
      y,
      size: 28,
      speed,
      health,
      maxHealth: health,
      angle: 0,
      color: "#4444ff",
      shootTimer: fireRate,
      fireRate,
      damage: 8 + level * 2
    });

    const maxCops = 3 + level * 2;
    if (this.cops.length > maxCops) {
      this.cops.splice(0, 1);
    }
  },

  copShoot(cop) {
    const player = Game.player || Game.Player;

    const angle = Utils.angleBetween(
      cop.x + cop.size / 2,
      cop.y + cop.size / 2,
      player.x + player.size / 2,
      player.y + player.size / 2
    );

    const rad = Utils.degToRad(angle);
    const speed = 12;

    this.copBullets.push({
      x: cop.x + cop.size / 2,
      y: cop.y + cop.size / 2,
      vx: Math.cos(rad) * speed,
      vy: Math.sin(rad) * speed,
      damage: cop.damage,
      range: 400,
      distance: 0,
      color: "#ff8800"
    });
  },

  onCopKilled() {
    if (Game.HUD) {
      Game.HUD.money += 200;
      Game.HUD.showMessage("Policier neutralise +$200", 60);

      Game.HUD.wantedLevel = Math.min((Game.HUD.wantedLevel || 0) + 1, 5);
      if (Game.HUD.wantedLevel === 5) {
        Game.HUD.showMessage("Wanted max", 120);
      }
    }

    if (Game.registerKill) {
      Game.registerKill("cop");
    }

    if (Game.Camera) {
      Game.Camera.shake(5, 8);
    }
  },

  draw(ctx) {
    this.cops.forEach((cop) => {
      ctx.save();
      ctx.translate(cop.x + cop.size / 2, cop.y + cop.size / 2);

      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fillRect(-cop.size / 2 + 3, -cop.size / 2 + 3, cop.size, cop.size);

      ctx.rotate((cop.angle * Math.PI) / 180);

      ctx.fillStyle = cop.color;
      ctx.beginPath();
      ctx.moveTo(cop.size / 2, 0);
      ctx.lineTo(-cop.size / 2, -cop.size / 2);
      ctx.lineTo(-cop.size / 2, cop.size / 2);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#ffff00";
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();

      if (cop.health < cop.maxHealth) {
        const barWidth = cop.size;
        const healthRatio = cop.health / cop.maxHealth;

        ctx.fillStyle = "#000";
        ctx.fillRect(cop.x, cop.y - 10, barWidth, 4);

        ctx.fillStyle = healthRatio > 0.5 ? "#00ff00" : "#ff0000";
        ctx.fillRect(cop.x, cop.y - 10, barWidth * healthRatio, 4);
      }
    });

    this.copBullets.forEach((bullet) => {
      ctx.save();
      ctx.strokeStyle = bullet.color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(bullet.x - bullet.vx * 2, bullet.y - bullet.vy * 2);
      ctx.lineTo(bullet.x, bullet.y);
      ctx.stroke();
      ctx.globalAlpha = 1;

      ctx.fillStyle = bullet.color;
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    });
  },

  clear() {
    this.cops = [];
    this.copBullets = [];
    this.spawnTimer = 0;
    this.wantedCooldown = 0;
  }
};
