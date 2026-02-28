// Player.js

Game.Player = {
  x: 1500,
  y: 1500,
  size: 30,
  speed: 5,
  color: "#00bfff",
  damagedColor: "#ff4444",
  angle: 0,
  health: 100,
  maxHealth: 100,
  inVehicle: false,
  currentVehicle: null,

  update() {
    if (this.inVehicle && this.currentVehicle) return;

    let dx = 0;
    let dy = 0;

    if (Input.isPressed("z") || Input.isPressed("w") || Input.isPressed("arrowup")) dy -= 1;
    if (Input.isPressed("s") || Input.isPressed("arrowdown")) dy += 1;
    if (Input.isPressed("q") || Input.isPressed("a") || Input.isPressed("arrowleft")) dx -= 1;
    if (Input.isPressed("d") || Input.isPressed("arrowright")) dx += 1;

    if (dx !== 0 || dy !== 0) {
      const length = Math.hypot(dx, dy);
      dx /= length;
      dy /= length;

      this.x += dx * this.speed;
      this.y += dy * this.speed;
      this.angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    }

    this.x = Utils.clamp(this.x, 0, Game.Map.width - this.size);
    this.y = Utils.clamp(this.y, 0, Game.Map.height - this.size);
  },

  enterVehicle(vehicle) {
    if (this.inVehicle) return;

    this.inVehicle = true;
    this.currentVehicle = vehicle;
    vehicle.occupied = true;
    vehicle.driver = this;

    if (Game.HUD) Game.HUD.showMessage("Vehicule entre", 120);
    if (Game.Camera) Game.Camera.shake(3, 5);
  },

  exitVehicle() {
    if (!this.inVehicle || !this.currentVehicle) return;

    this.inVehicle = false;

    const rad = Utils.degToRad(this.currentVehicle.angle);
    this.x = this.currentVehicle.x + Math.cos(rad + Math.PI / 2) * (this.currentVehicle.width / 2 + this.size);
    this.y = this.currentVehicle.y + Math.sin(rad + Math.PI / 2) * (this.currentVehicle.height / 2 + this.size);

    this.currentVehicle.occupied = false;
    this.currentVehicle.driver = null;
    this.currentVehicle = null;

    if (Game.HUD) Game.HUD.showMessage("Sorti du vehicule", 90);
  },

  takeDamage(amount) {
    if (this.health <= 0) return;

    this.health = Math.max(0, this.health - amount);

    if (Game.Camera) Game.Camera.shake(8 + amount / 2, 12);
    if (Game.HUD) Game.HUD.health = this.health;

    if (this.health <= 0) {
      this.die();
    } else if (this.health < 30 && Game.HUD) {
      Game.HUD.showMessage("Sante critique", 90);
    }
  },

  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
    if (Game.HUD) {
      Game.HUD.health = this.health;
      Game.HUD.showMessage(`+${amount} PV`, 60);
    }
  },

  die() {
    if (Game.registerDeath) {
      Game.registerDeath();
    }

    if (Game.HUD) {
      Game.HUD.showMessage("WASTED", 180);
    }

    if (Game.Camera) Game.Camera.shake(15, 30);

    if (this.inVehicle) {
      this.exitVehicle();
    }

    if (Game.submitRunScore) {
      Game.submitRunScore(true);
    }

    setTimeout(() => this.respawn(), 2500);
  },

  respawn() {
    this.health = this.maxHealth;
    this.x = Game.Map.width / 2;
    this.y = Game.Map.height / 2;
    this.angle = 0;

    if (Game.HUD) {
      Game.HUD.health = this.health;
      Game.HUD.wantedLevel = 0;
      Game.HUD.showMessage("Respawn", 120);
    }

    if (Game.Police && Game.Police.clear) {
      Game.Police.clear();
    }
  },

  draw(ctx) {
    if (this.inVehicle) return;

    const cx = this.x + this.size / 2;
    const cy = this.y + this.size / 2;

    ctx.save();
    ctx.translate(cx, cy);

    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(-this.size / 2 + 4, -this.size / 2 + 4, this.size, this.size);

    ctx.rotate(Utils.degToRad(this.angle));

    const bodyColor = this.health < 30 ? this.damagedColor : this.color;
    ctx.fillStyle = bodyColor;

    ctx.beginPath();
    ctx.moveTo(this.size / 2, 0);
    ctx.lineTo(-this.size / 2, -this.size / 2);
    ctx.lineTo(-this.size / 3, 0);
    ctx.lineTo(-this.size / 2, this.size / 2);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    if (this.health < 50) {
      ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 100) * 0.1;
      ctx.fillStyle = "#ff0000";
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.restore();

    if (this.health < this.maxHealth) {
      const barW = this.size + 10;
      const ratio = this.health / this.maxHealth;

      ctx.fillStyle = "#000000";
      ctx.fillRect(cx - barW / 2, cy - this.size / 2 - 12, barW, 6);

      ctx.fillStyle = ratio > 0.5 ? "#00ff00" : ratio > 0.25 ? "#ffff00" : "#ff0000";
      ctx.fillRect(cx - barW / 2, cy - this.size / 2 - 12, barW * ratio, 6);

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - barW / 2, cy - this.size / 2 - 12, barW, 6);
    }
  }
};
