// Camera.js - Caméra 2D avec suivi doux

Game.Camera = {
  x: 0,
  y: 0,
  targetX: 0,
  targetY: 0,
  shakeTimer: 0,
  shakeIntensity: 0,
  smoothness: 0.1, // 0 = instantané, 1 = très lent

  // Définit la cible (joueur ou centre véhicule)
  follow(targetX, targetY, canvas) {
    this.targetX = targetX;
    this.targetY = targetY;
    
    // Centrer la caméra sur la cible
    this.targetX -= canvas.width / 2;
    this.targetY -= canvas.height / 2;
    
    // Limites de la map
    this.targetX = Utils.clamp(this.targetX, 0, Game.Map.width - canvas.width);
    this.targetY = Utils.clamp(this.targetY, 0, Game.Map.height - canvas.height);
  },

  update(canvas) {
    // Suivre le joueur (ou véhicule occupé)
    let targetX = Game.player.x + Game.player.size / 2;
    let targetY = Game.player.y + Game.player.size / 2;
    
    // Si dans un véhicule, suivre le véhicule
    if (Game.VehicleManager) {
      for (const v of Game.VehicleManager.vehicles) {
        if (v.occupied) {
          targetX = v.x + v.width / 2;
          targetY = v.y + v.height / 2;
          break;
        }
      }
    }
    
    this.follow(targetX, targetY, canvas);

    // Suivi doux (lerp)
    this.x = Utils.lerp(this.x, this.targetX, this.smoothness);
    this.y = Utils.lerp(this.y, this.targetY, this.smoothness);

    // Camera shake
    if (this.shakeTimer > 0) {
      this.shakeTimer--;
      this.x += Utils.randomInt(-this.shakeIntensity, this.shakeIntensity);
      this.y += Utils.randomInt(-this.shakeIntensity, this.shakeIntensity);
    }
  },

  apply(ctx) {
    ctx.save();
    ctx.translate(-Math.round(this.x), -Math.round(this.y));
  },

  restore(ctx) {
    ctx.restore();
  },

  shake(intensity = 10, duration = 15) {
    this.shakeIntensity = intensity;
    this.shakeTimer = duration;
  },
  
  // Convertir coordonnées écran en coordonnées monde
  screenToWorld(screenX, screenY) {
    return {
      x: screenX + this.x,
      y: screenY + this.y
    };
  },
  
  // Convertir coordonnées monde en coordonnées écran
  worldToScreen(worldX, worldY) {
    return {
      x: worldX - this.x,
      y: worldY - this.y
    };
  }
};