// NPC.js
Game.NPCManager = {
  npcs: [],

  npcTypes: {
    civilian: {
      color: "#44ff44",
      speed: 0.8,
      size: 22,
      icon: "C",
      fearRadius: 150,
      runSpeed: 2,
      health: 50,
      reward: 50
    },
    businessman: {
      color: "#4444ff",
      speed: 1.2,
      size: 24,
      icon: "B",
      fearRadius: 120,
      runSpeed: 2.5,
      health: 60,
      reward: 100
    },
    tourist: {
      color: "#ff44ff",
      speed: 0.6,
      size: 23,
      icon: "T",
      fearRadius: 100,
      runSpeed: 1.5,
      health: 40,
      reward: 75
    },
    jogger: {
      color: "#ffaa44",
      speed: 1.5,
      size: 21,
      icon: "J",
      fearRadius: 80,
      runSpeed: 3,
      health: 70,
      reward: 30
    }
  },

  spawn(x, y, type = null) {
    if (!type) {
      const types = Object.keys(this.npcTypes);
      type = types[Utils.randomInt(0, types.length - 1)];
    }

    const npcType = this.npcTypes[type];

    this.npcs.push({
      x,
      y,
      size: npcType.size,
      speed: npcType.speed,
      baseSpeed: npcType.speed,
      runSpeed: npcType.runSpeed,
      color: npcType.color,
      type,
      icon: npcType.icon,
      angle: Utils.randomInt(0, 359),
      changeTimer: Utils.randomInt(60, 200),
      state: "wander",
      fearRadius: npcType.fearRadius,
      panicTimer: 0,
      health: npcType.health,
      maxHealth: npcType.health,
      reward: npcType.reward
    });
  },

  init() {
    for (let i = 0; i < 15; i++) {
      this.spawn(
        Utils.randomInt(100, Game.Map.width - 100),
        Utils.randomInt(100, Game.Map.height - 100)
      );
    }
  },

  update() {
    const player = Game.player || Game.Player;
    if (!player) return;

    for (let index = this.npcs.length - 1; index >= 0; index--) {
      const npc = this.npcs[index];
      if (!npc) continue;

      npc.changeTimer -= 1;
      if (npc.panicTimer > 0) npc.panicTimer -= 1;

      const distToPlayer = Utils.distance(
        npc.x + npc.size / 2,
        npc.y + npc.size / 2,
        player.x + player.size / 2,
        player.y + player.size / 2
      );

      let nearDanger = distToPlayer < npc.fearRadius;

      if (Game.EnemyManager) {
        for (const enemy of Game.EnemyManager.enemies) {
          const distToEnemy = Utils.distance(
            npc.x + npc.size / 2,
            npc.y + npc.size / 2,
            enemy.x + enemy.size / 2,
            enemy.y + enemy.size / 2
          );

          if (distToEnemy < 100) {
            nearDanger = true;
            break;
          }
        }
      }

      if (Game.WeaponManager) {
        for (let i = Game.WeaponManager.bullets.length - 1; i >= 0; i--) {
          const bullet = Game.WeaponManager.bullets[i];
          const distToBullet = Utils.distance(
            npc.x + npc.size / 2,
            npc.y + npc.size / 2,
            bullet.x,
            bullet.y
          );

          if (distToBullet < npc.size / 2 + 5) {
            npc.health -= bullet.damage;
            Game.WeaponManager.bullets.splice(i, 1);

            if (Game.WeaponManager.createBloodSplatter) {
              Game.WeaponManager.createBloodSplatter(npc.x + npc.size / 2, npc.y + npc.size / 2);
            }

            if (npc.health <= 0) {
              this.onNPCKilled(npc);
              this.npcs.splice(index, 1);
              nearDanger = false;
              break;
            }

            npc.panicTimer = 180;
          }

          if (distToBullet < 150) {
            nearDanger = true;
            npc.panicTimer = 120;
          }
        }
      }

      if (!this.npcs[index]) {
        continue;
      }

      if (Game.VehicleManager) {
        for (const vehicle of Game.VehicleManager.vehicles) {
          if (Math.abs(vehicle.speed) < 2) continue;

          const distToVehicle = Utils.distance(
            npc.x + npc.size / 2,
            npc.y + npc.size / 2,
            vehicle.x + vehicle.width / 2,
            vehicle.y + vehicle.height / 2
          );

          if (distToVehicle < (vehicle.width + npc.size) / 2) {
            this.onNPCKilled(npc, true);
            this.npcs.splice(index, 1);
            nearDanger = false;
            break;
          }
        }
      }

      if (!this.npcs[index]) {
        continue;
      }

      if (nearDanger || npc.panicTimer > 0) {
        npc.state = "flee";
        npc.speed = npc.runSpeed;

        const dx = npc.x - player.x;
        const dy = npc.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        npc.x += (dx / dist) * npc.speed;
        npc.y += (dy / dist) * npc.speed;
        npc.angle = Utils.angleBetween(player.x, player.y, npc.x, npc.y);
      } else {
        npc.state = "wander";
        npc.speed = npc.baseSpeed;

        if (npc.changeTimer <= 0) {
          npc.angle = Utils.randomInt(0, 359);
          npc.changeTimer = Utils.randomInt(60, 200);
        }

        const vec = Utils.angleToVector(npc.angle);
        npc.x += vec.x * npc.speed;
        npc.y += vec.y * npc.speed;
      }

      if (npc.x < 0 || npc.x > Game.Map.width - npc.size) {
        npc.angle = 180 - npc.angle;
      }
      if (npc.y < 0 || npc.y > Game.Map.height - npc.size) {
        npc.angle = -npc.angle;
      }

      npc.x = Utils.clamp(npc.x, 0, Game.Map.width - npc.size);
      npc.y = Utils.clamp(npc.y, 0, Game.Map.height - npc.size);

      if (Game.Buildings && Game.Buildings.list) {
        for (const building of Game.Buildings.list) {
          if (Utils.rectOverlap(npc.x, npc.y, npc.size, npc.size, building.x, building.y, building.w, building.h)) {
            const dx = npc.x + npc.size / 2 - (building.x + building.w / 2);
            const dy = npc.y + npc.size / 2 - (building.y + building.h / 2);
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;

            npc.x += (dx / dist) * 3;
            npc.y += (dy / dist) * 3;
            npc.angle += Utils.randomInt(90, 180);
            break;
          }
        }
      }
    }
  },

  onNPCKilled(npc, crushed = false) {
    if (Game.HUD) {
      Game.HUD.money += npc.reward;
      Game.HUD.showMessage(crushed ? `Ecrase +$${npc.reward}` : `+$${npc.reward}`, 60);

      Game.HUD.wantedLevel = Math.min((Game.HUD.wantedLevel || 0) + 1, 5);
      if (Game.HUD.wantedLevel >= 3) {
        Game.HUD.showMessage("Wanted level augmente", 90);
      }
    }

    if (Game.registerKill) {
      Game.registerKill("npc");
    }

    if (Game.Camera) {
      Game.Camera.shake(3, 5);
    }

    if (Game.HUD && Game.HUD.wantedLevel >= 2 && Game.EnemyManager && Utils.chance(30)) {
      const player = Game.player || Game.Player;
      Game.EnemyManager.spawn(
        player.x + Utils.randomInt(-400, 400),
        player.y + Utils.randomInt(-400, 400),
        "normal"
      );
    }
  },

  draw(ctx) {
    this.npcs.forEach((npc) => {
      ctx.save();
      ctx.translate(npc.x + npc.size / 2, npc.y + npc.size / 2);

      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fillRect(-npc.size / 2 + 3, -npc.size / 2 + 3, npc.size, npc.size);

      ctx.rotate((npc.angle * Math.PI) / 180);
      ctx.fillStyle = npc.color;

      if (npc.state === "flee") {
        ctx.beginPath();
        ctx.moveTo(npc.size / 2, 0);
        ctx.lineTo(-npc.size / 2, -npc.size / 2);
        ctx.lineTo(-npc.size / 2, npc.size / 2);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillRect(-npc.size / 2, -npc.size / 2, npc.size, npc.size);
      }

      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      ctx.fillText(npc.icon, 0, 4);

      ctx.restore();

      if (npc.health < npc.maxHealth) {
        const barWidth = npc.size;
        const healthRatio = npc.health / npc.maxHealth;

        ctx.fillStyle = "#000";
        ctx.fillRect(npc.x, npc.y - 10, barWidth, 3);

        ctx.fillStyle = healthRatio > 0.5 ? "#00ff00" : "#ff0000";
        ctx.fillRect(npc.x, npc.y - 10, barWidth * healthRatio, 3);
      }
    });
  },

  clear() {
    this.npcs = [];
  }
};
