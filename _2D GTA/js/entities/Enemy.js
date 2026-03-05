// Enemy.js
Game.EnemyManager = {
  enemies: [],

  spawn(x, y, type = "normal") {
    const enemyTypes = {
      normal: {
        speed: 1.5,
        health: 100,
        damage: 5,
        color: "#ff4444",
        size: 25,
        reward: 100
      },
      fast: {
        speed: 2.5,
        health: 60,
        damage: 3,
        color: "#ff8844",
        size: 20,
        reward: 150
      },
      tank: {
        speed: 1,
        health: 200,
        damage: 10,
        color: "#aa0000",
        size: 35,
        reward: 200
      }
    };

    const stats = enemyTypes[type] || enemyTypes.normal;

    this.enemies.push({
      x,
      y,
      size: stats.size,
      speed: stats.speed,
      health: stats.health,
      maxHealth: stats.health,
      damage: stats.damage,
      color: stats.color,
      type,
      reward: stats.reward,
      targetX: x,
      targetY: y,
      changeTimer: 0,
      angle: 0,
      attackCooldown: 0,
      provokedUntil: 0
    });
  },

  update() {
    const playerTarget = Game.player || Game.Player;
    if (!playerTarget) return;

    for (let index = this.enemies.length - 1; index >= 0; index--) {
      const enemy = this.enemies[index];
      if (!enemy) continue;

      if (enemy.attackCooldown > 0) enemy.attackCooldown -= 1;

      const distToPlayer = Utils.distance(
        enemy.x + enemy.size / 2,
        enemy.y + enemy.size / 2,
        playerTarget.x + playerTarget.size / 2,
        playerTarget.y + playerTarget.size / 2
      );

      const wanted = Game.HUD ? Game.HUD.wantedLevel || 0 : 0;
      const isProvoked = enemy.health < enemy.maxHealth || wanted >= 2 || Date.now() < (enemy.provokedUntil || 0);

      if (isProvoked && distToPlayer < 320) {
        const dx = playerTarget.x - enemy.x;
        const dy = playerTarget.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 5) {
          enemy.x += (dx / dist) * enemy.speed;
          enemy.y += (dy / dist) * enemy.speed;
          enemy.angle = Utils.angleBetween(enemy.x, enemy.y, playerTarget.x, playerTarget.y);
        }

        if (distToPlayer < 36 && enemy.attackCooldown === 0) {
          enemy.attackCooldown = 60;
          if (Game.Player && Game.Player.takeDamage) {
            Game.Player.takeDamage(enemy.damage);
          }

          if (Game.HUD) {
            Game.HUD.showMessage("Hit", 20);
          }
        }
      } else {
        if (distToPlayer < 85 && !isProvoked) {
          const awayDx = enemy.x - playerTarget.x;
          const awayDy = enemy.y - playerTarget.y;
          const awayDist = Math.sqrt(awayDx * awayDx + awayDy * awayDy) || 1;
          enemy.x += (awayDx / awayDist) * enemy.speed * 0.6;
          enemy.y += (awayDy / awayDist) * enemy.speed * 0.6;
          enemy.angle = Utils.angleBetween(playerTarget.x, playerTarget.y, enemy.x, enemy.y);
        }

        enemy.changeTimer -= 1;
        if (enemy.changeTimer <= 0) {
          enemy.targetX = Utils.randomInt(0, Game.Map.width);
          enemy.targetY = Utils.randomInt(0, Game.Map.height);
          enemy.changeTimer = Utils.randomInt(120, 300);
        }

        const dx = enemy.targetX - enemy.x;
        const dy = enemy.targetY - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 10) {
          enemy.x += (dx / dist) * enemy.speed * 0.5;
          enemy.y += (dy / dist) * enemy.speed * 0.5;
          enemy.angle = Utils.angleBetween(enemy.x, enemy.y, enemy.targetX, enemy.targetY);
        }
      }

      if (Game.Buildings) {
        for (const building of Game.Buildings.list) {
          if (Utils.rectOverlap(enemy.x, enemy.y, enemy.size, enemy.size, building.x, building.y, building.w, building.h)) {
            const dx = enemy.x + enemy.size / 2 - (building.x + building.w / 2);
            const dy = enemy.y + enemy.size / 2 - (building.y + building.h / 2);
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            enemy.x += (dx / dist) * 2;
            enemy.y += (dy / dist) * 2;
          }
        }
      }

      enemy.x = Utils.clamp(enemy.x, 0, Game.Map.width - enemy.size);
      enemy.y = Utils.clamp(enemy.y, 0, Game.Map.height - enemy.size);

      if (enemy.health <= 0) {
        this.onEnemyKilled(enemy);
        this.enemies.splice(index, 1);
      }
    }
  },

  onEnemyKilled(enemy) {
    if (Game.HUD) {
      Game.HUD.money += enemy.reward;
      Game.HUD.showMessage(`+$${enemy.reward}`, 60);
    }

    if (Game.registerKill) {
      Game.registerKill("enemy");
    }

    if (Utils.chance(30) && Game.WeaponManager) {
      Game.WeaponManager.spawnAmmoPickup(enemy.x, enemy.y, Utils.randomInt(10, 30));
    }

    if (Game.Camera) {
      Game.Camera.shake(3, 5);
    }
  },

  draw(ctx) {
    this.enemies.forEach((enemy) => {
      ctx.save();
      ctx.translate(enemy.x + enemy.size / 2, enemy.y + enemy.size / 2);

      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fillRect(-enemy.size / 2 + 3, -enemy.size / 2 + 3, enemy.size, enemy.size);

      ctx.rotate((enemy.angle * Math.PI) / 180);
      ctx.fillStyle = enemy.color;
      ctx.beginPath();
      ctx.moveTo(enemy.size / 2, 0);
      ctx.lineTo(-enemy.size / 2, -enemy.size / 2);
      ctx.lineTo(-enemy.size / 2, enemy.size / 2);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();

      const barWidth = enemy.size;
      const healthRatio = enemy.health / enemy.maxHealth;

      ctx.fillStyle = "#000";
      ctx.fillRect(enemy.x, enemy.y - 10, barWidth, 4);

      ctx.fillStyle = healthRatio > 0.5 ? "#00ff00" : healthRatio > 0.25 ? "#ffff00" : "#ff0000";
      ctx.fillRect(enemy.x, enemy.y - 10, barWidth * healthRatio, 4);
    });
  },

  spawnWave(count, centerX, centerY, radius = 200) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      const rand = Math.random();
      let type = "normal";
      if (rand < 0.2) type = "fast";
      else if (rand < 0.35) type = "tank";

      this.spawn(x, y, type);
    }

    if (Game.HUD) {
      Game.HUD.showMessage("Vague d'ennemis", 60);
    }
  },

  clear() {
    this.enemies = [];
  }
};
