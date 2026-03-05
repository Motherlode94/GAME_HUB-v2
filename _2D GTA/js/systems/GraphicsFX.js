// GraphicsFX.js - Effets visuels simples (flash + particules)

Game.GraphicsFX = {
  particles: [],
  flash: 0,

  // ===== APPELS SIMPLES =====
  flashScreen(intensity = 0.3) {
    this.flash = Math.max(this.flash, intensity);
  },

  spawnImpact(x, y, color = "#ffffff", count = 8) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 20,
        size: 2 + Math.random() * 2,
        color
      });
    }
  },

  // ===== UPDATE =====
  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    if (this.flash > 0) {
      this.flash -= 0.05;
      if (this.flash < 0) this.flash = 0;
    }
  },

  // ===== DRAW =====
  draw(ctx, canvas) {
    // Particules
    for (const p of this.particles) {
      ctx.globalAlpha = p.life / 20;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Flash écran
    if (this.flash > 0) {
      ctx.save();
      ctx.globalAlpha = this.flash;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
  }
};
