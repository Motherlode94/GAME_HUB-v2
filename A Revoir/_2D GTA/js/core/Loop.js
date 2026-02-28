Game.Loop = {
  running: false,
  paused: false,
  lastTime: 0,
  deltaTime: 0,
  fps: 0,
  frameCount: 0,

  start() {
    this.running = true;
    this.paused = false;
    this.lastTime = performance.now();
    this.tick();
  },

  stop() {
    this.running = false;
  },

  pause() {
    this.paused = !this.paused;
  },

  tick(currentTime = performance.now()) {
    if (!this.running) return;

    // Calculer deltaTime (temps écoulé depuis la dernière frame)
    this.deltaTime = (currentTime - this.lastTime) / 1000; // en secondes
    this.lastTime = currentTime;

    // Calculer FPS
    this.frameCount++;
    this.fps = Math.round(1 / this.deltaTime);

    // Ne pas update si en pause, mais continuer à draw
    if (!this.paused) {
      if (Game.update) {
        Game.update();
      }
    }

    if (Game.draw) {
      Game.draw();
    }

    requestAnimationFrame((time) => this.tick(time));
  },

  // Afficher les stats de debug
  drawDebug(ctx, canvas) {
    if (!this.running) return;
    
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(canvas.width - 120, 0, 120, 80);
    
    ctx.fillStyle = "#00ff00";
    ctx.font = "14px monospace";
    ctx.textAlign = "right";
    ctx.fillText(`FPS: ${this.fps}`, canvas.width - 10, 20);
    ctx.fillText(`ΔT: ${(this.deltaTime * 1000).toFixed(1)}ms`, canvas.width - 10, 40);
    
    if (this.paused) {
      ctx.fillStyle = "#ffff00";
      ctx.fillText("PAUSED", canvas.width - 10, 60);
    }
    
    ctx.textAlign = "left";
  }
};