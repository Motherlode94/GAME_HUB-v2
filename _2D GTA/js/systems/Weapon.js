// Weapon.js - Weapons, ammo, pickups and shooting system

Game.WeaponManager = {
  bullets: [],
  pickups: [],
  muzzleFlashes: [],
  bloodSplatters: [],
  impacts: [],

  weapons: {
    fist: { name: "Poing", damage: 5, fireRate: 20, range: 40, price: 0, color: "#ffffff", icon: "[F]" },
    pistol: { name: "Pistolet", damage: 20, fireRate: 15, range: 400, price: 500, color: "#ffff00", icon: "[P]" },
    uzi: { name: "Uzi", damage: 10, fireRate: 5, range: 320, price: 1500, color: "#ff8800", icon: "[U]" },
    shotgun: { name: "Shotgun", damage: 50, fireRate: 30, range: 220, price: 2000, color: "#ff0000", icon: "[S]" }
  },

  inventory: ["fist"],
  currentWeaponIndex: 0,
  fireTimer: 0,
  ammo: { pistol: 0, uzi: 0, shotgun: 0 },

  init() {
    this.pickups = [];

    this.spawnPickup("pistol", 800, 500);
    this.spawnPickup("uzi", 1500, 1500);
    this.spawnPickup("shotgun", 2200, 800);

    this.spawnAmmoPickup(1000, 1000, 30);
    this.spawnAmmoPickup(1800, 600, 50);
    this.spawnAmmoPickup(500, 1800, 40);
  },

  reset() {
    this.bullets = [];
    this.pickups = [];
    this.muzzleFlashes = [];
    this.bloodSplatters = [];
    this.impacts = [];
    this.inventory = ["fist"];
    this.currentWeaponIndex = 0;
    this.fireTimer = 0;
    this.ammo = { pistol: 0, uzi: 0, shotgun: 0 };
    this.init();
  },

  spawnPickup(weaponType, x, y) {
    this.pickups.push({
      type: "weapon",
      weaponType,
      x,
      y,
      size: 30,
      collected: false
    });
  },

  spawnAmmoPickup(x, y, amount) {
    this.pickups.push({
      type: "ammo",
      amount,
      x,
      y,
      size: 25,
      collected: false
    });
  },

  getCurrentWeapon() {
    return this.inventory[this.currentWeaponIndex] || "fist";
  },

  selectWeapon(weaponType) {
    const index = this.inventory.indexOf(weaponType);
    if (index === -1) return;

    this.currentWeaponIndex = index;
    const weapon = this.weapons[this.getCurrentWeapon()];
    if (Game.HUD) {
      Game.HUD.showMessage(`${weapon.icon} ${weapon.name}`, 30);
    }
  },

  nextWeapon() {
    this.currentWeaponIndex = (this.currentWeaponIndex + 1) % this.inventory.length;
    const weapon = this.weapons[this.getCurrentWeapon()];
    if (Game.HUD) {
      Game.HUD.showMessage(`${weapon.icon} ${weapon.name}`, 30);
    }
  },

  previousWeapon() {
    this.currentWeaponIndex = (this.currentWeaponIndex - 1 + this.inventory.length) % this.inventory.length;
    const weapon = this.weapons[this.getCurrentWeapon()];
    if (Game.HUD) {
      Game.HUD.showMessage(`${weapon.icon} ${weapon.name}`, 30);
    }
  },

  collectWeapon(weaponType) {
    if (!this.inventory.includes(weaponType)) {
      this.inventory.push(weaponType);
      this.ammo[weaponType] = 30;

      if (Game.HUD) {
        const weapon = this.weapons[weaponType];
        Game.HUD.showMessage(`${weapon.icon} ${weapon.name} ramasse`, 60);
      }
      return;
    }

    this.ammo[weaponType] = (this.ammo[weaponType] || 0) + 30;
    if (Game.HUD) {
      Game.HUD.showMessage("+30 munitions", 60);
    }
  },

  collectAmmo(amount) {
    const current = this.getCurrentWeapon();
    if (current === "fist") return;

    this.ammo[current] = (this.ammo[current] || 0) + amount;
    if (Game.HUD) {
      Game.HUD.showMessage(`+${amount} munitions`, 60);
    }
  },

  buyWeapon(weaponType) {
    const weapon = this.weapons[weaponType];
    if (!weapon) return { success: false, message: "Arme inconnue" };

    if (this.inventory.includes(weaponType)) {
      return { success: false, message: "Arme deja possedee" };
    }

    if (!Game.HUD || Game.HUD.money < weapon.price) {
      return { success: false, message: "Argent insuffisant" };
    }

    Game.HUD.money -= weapon.price;
    this.inventory.push(weaponType);
    this.ammo[weaponType] = 50;
    return { success: true, message: `${weapon.name} achete` };
  },

  buyAmmo(amount, cost) {
    const current = this.getCurrentWeapon();
    if (current === "fist") {
      return { success: false, message: "Selectionnez une arme" };
    }

    if (!Game.HUD || Game.HUD.money < cost) {
      return { success: false, message: "Argent insuffisant" };
    }

    Game.HUD.money -= cost;
    this.ammo[current] = (this.ammo[current] || 0) + amount;
    return { success: true, message: `+${amount} munitions` };
  },

  meleeAttack(player) {
    this.fireTimer = 20;

    if (!Game.EnemyManager) return;

    for (const enemy of Game.EnemyManager.enemies) {
      const dist = Utils.distance(
        player.x + player.size / 2,
        player.y + player.size / 2,
        enemy.x + enemy.size / 2,
        enemy.y + enemy.size / 2
      );

      if (dist < 50) {
        enemy.health -= 5;
        enemy.provokedUntil = Date.now() + 15000;
        this.createBloodSplatter(enemy.x + enemy.size / 2, enemy.y + enemy.size / 2);
        if (Game.HUD) Game.HUD.showMessage("POW", 20);
      }
    }
  },

  fire(player) {
    const weaponType = this.getCurrentWeapon();
    const weapon = this.weapons[weaponType];

    this.fireTimer = weapon.fireRate;
    this.ammo[weaponType] -= 1;

    let angle = player.angle;

    if (player.inVehicle && Game.VehicleManager) {
      for (const v of Game.VehicleManager.vehicles) {
        if (v.occupied) {
          angle = v.angle;
          break;
        }
      }
    }

    const rad = Utils.degToRad(angle);
    const speed = 15;
    const spawnDist = player.size;

    const bulletX = player.x + player.size / 2 + Math.cos(rad) * spawnDist;
    const bulletY = player.y + player.size / 2 + Math.sin(rad) * spawnDist;

    this.bullets.push({
      x: bulletX,
      y: bulletY,
      vx: Math.cos(rad) * speed,
      vy: Math.sin(rad) * speed,
      damage: weapon.damage,
      range: weapon.range,
      distance: 0,
      color: weapon.color,
      angle
    });

    if (Game.Camera) Game.Camera.shake(2, 3);

    this.muzzleFlashes.push({ x: bulletX, y: bulletY, life: 3, angle });

    if (Game.HUD) {
      Game.HUD.showMessage(`${weapon.icon}`, 10);
    }
  },

  update() {
    if (this.fireTimer > 0) this.fireTimer -= 1;

    const player = Game.player;
    if (!player) return;
    const blockedByUi = (Game.Menu && Game.Menu.active) || (Game.Shop && Game.Shop.menuOpen);

    const currentWeapon = this.getCurrentWeapon();

    if (!blockedByUi && Input.isPressed(" ") && this.fireTimer === 0) {
      if (currentWeapon === "fist") {
        this.meleeAttack(player);
      } else if ((this.ammo[currentWeapon] || 0) > 0) {
        this.fire(player);
      } else if (Game.HUD) {
        Game.HUD.showMessage("Plus de munitions", 45);
      }
    }

    if (!blockedByUi && !player.inVehicle) {
      if (Input.wasJustPressed("a")) this.previousWeapon();
      if (Input.wasJustPressed("tab")) this.nextWeapon();
      if (Input.wasJustPressed("1")) this.selectWeapon("fist");
      if (Input.wasJustPressed("2")) this.selectWeapon("pistol");
      if (Input.wasJustPressed("3")) this.selectWeapon("uzi");
      if (Input.wasJustPressed("4")) this.selectWeapon("shotgun");
    }

    for (let i = 0; i < this.pickups.length; i++) {
      const pickup = this.pickups[i];
      if (pickup.collected) continue;

      const dist = Utils.distance(
        player.x + player.size / 2,
        player.y + player.size / 2,
        pickup.x + pickup.size / 2,
        pickup.y + pickup.size / 2
      );

      if (dist < 40) {
        if (pickup.type === "weapon") {
          this.collectWeapon(pickup.weaponType);
        } else if (pickup.type === "ammo") {
          this.collectAmmo(pickup.amount);
        }
        pickup.collected = true;
      }
    }

    this.pickups = this.pickups.filter((p) => !p.collected);

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];

      bullet.x += bullet.vx;
      bullet.y += bullet.vy;
      bullet.distance += Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy);

      if (bullet.distance > bullet.range) {
        this.bullets.splice(i, 1);
        continue;
      }

      let bulletHit = false;

      if (Game.EnemyManager) {
        for (let j = Game.EnemyManager.enemies.length - 1; j >= 0; j--) {
          const enemy = Game.EnemyManager.enemies[j];
          const distToEnemy = Utils.distance(
            bullet.x,
            bullet.y,
            enemy.x + enemy.size / 2,
            enemy.y + enemy.size / 2
          );

          if (distToEnemy < enemy.size / 2 + 5) {
            enemy.health -= bullet.damage;
            enemy.provokedUntil = Date.now() + 15000;
            bulletHit = true;
            this.createBloodSplatter(enemy.x + enemy.size / 2, enemy.y + enemy.size / 2);
            if (Game.HUD) Game.HUD.showMessage("HIT", 15);
            break;
          }
        }
      }

      if (!bulletHit && Game.Buildings) {
        for (const building of Game.Buildings.list) {
          if (Utils.isPointInRect(bullet.x, bullet.y, building.x, building.y, building.w, building.h)) {
            bulletHit = true;
            this.createImpactEffect(bullet.x, bullet.y);
            break;
          }
        }
      }

      if (bulletHit) {
        this.bullets.splice(i, 1);
      }
    }
  },

  createBloodSplatter(x, y) {
    for (let i = 0; i < 5; i++) {
      this.bloodSplatters.push({
        x: x + Utils.randomInt(-10, 10),
        y: y + Utils.randomInt(-10, 10),
        size: Utils.randomInt(3, 8),
        life: 30
      });
    }
  },

  createImpactEffect(x, y) {
    this.impacts.push({ x, y, size: 5, life: 20 });
  },

  draw(ctx) {
    for (const pickup of this.pickups) {
      if (pickup.collected) continue;

      const pulse = Math.sin(Date.now() / 200) * 3;

      if (pickup.type === "weapon") {
        const weapon = this.weapons[pickup.weaponType];
        ctx.fillStyle = weapon.color;
        ctx.fillRect(pickup.x, pickup.y, pickup.size, pickup.size);

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.strokeRect(pickup.x - pulse, pickup.y - pulse, pickup.size + pulse * 2, pickup.size + pulse * 2);

        ctx.fillStyle = "#000";
        ctx.font = "13px Arial";
        ctx.textAlign = "center";
        ctx.fillText(weapon.icon, pickup.x + pickup.size / 2, pickup.y + pickup.size / 2 + 5);
      } else {
        ctx.fillStyle = "#44ff44";
        ctx.fillRect(pickup.x, pickup.y, pickup.size, pickup.size);

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.strokeRect(pickup.x - pulse, pickup.y - pulse, pickup.size + pulse * 2, pickup.size + pulse * 2);

        ctx.fillStyle = "#000";
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.fillText("AMMO", pickup.x + pickup.size / 2, pickup.y + pickup.size / 2 + 5);
      }
    }

    for (const bullet of this.bullets) {
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
    }

    for (let i = this.muzzleFlashes.length - 1; i >= 0; i--) {
      const flash = this.muzzleFlashes[i];
      ctx.save();
      ctx.translate(flash.x, flash.y);
      ctx.rotate(Utils.degToRad(flash.angle));

      ctx.fillStyle = "#ffff00";
      ctx.globalAlpha = flash.life / 3;
      ctx.beginPath();
      ctx.moveTo(15, 0);
      ctx.lineTo(-5, -8);
      ctx.lineTo(-5, 8);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.restore();

      flash.life -= 1;
      if (flash.life <= 0) {
        this.muzzleFlashes.splice(i, 1);
      }
    }

    for (let i = this.bloodSplatters.length - 1; i >= 0; i--) {
      const splat = this.bloodSplatters[i];
      ctx.fillStyle = `rgba(139, 0, 0, ${splat.life / 30})`;
      ctx.beginPath();
      ctx.arc(splat.x, splat.y, splat.size, 0, Math.PI * 2);
      ctx.fill();

      splat.life -= 1;
      if (splat.life <= 0) {
        this.bloodSplatters.splice(i, 1);
      }
    }

    for (let i = this.impacts.length - 1; i >= 0; i--) {
      const impact = this.impacts[i];
      ctx.fillStyle = `rgba(255, 255, 255, ${impact.life / 20})`;
      ctx.fillRect(impact.x - 2, impact.y - 2, 4, 4);

      impact.life -= 1;
      if (impact.life <= 0) {
        this.impacts.splice(i, 1);
      }
    }
  },

  drawUI(ctx, canvas) {
    const weaponType = this.getCurrentWeapon();
    const weapon = this.weapons[weaponType];

    ctx.fillStyle = "#ffffff";
    ctx.font = "20px Arial";
    ctx.textAlign = "right";

    ctx.fillText(`${weapon.icon} ${weapon.name}`, canvas.width - 30, canvas.height - 80);

    if (weaponType !== "fist") {
      ctx.fillText(`Ammo: ${this.ammo[weaponType] || 0}`, canvas.width - 30, canvas.height - 50);
    }

    ctx.textAlign = "left";
  }
};
