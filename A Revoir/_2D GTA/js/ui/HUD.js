// HUD.js - Heads-up display + score bridge for catalogue

Game.HUD = {
  health: 100,
  maxHealth: 100,
  wantedLevel: 0,
  money: 0,
  score: 0,
  highScore: 0,

  message: "",
  messageTimer: 0,

  reset() {
    this.health = 100;
    this.maxHealth = 100;
    this.wantedLevel = 0;
    this.money = 0;
    this.score = 0;
    this.message = "";
    this.messageTimer = 0;
    this.syncScoreBridge();
  },

  showMessage(text, duration = 120) {
    this.message = String(text || "");
    this.messageTimer = duration;
  },

  computeScore() {
    if (Game.calculateScore) {
      return Math.max(0, Math.floor(Game.calculateScore()));
    }
    return Math.max(0, Math.floor(this.money || 0));
  },

  syncScoreBridge() {
    const scoreValue = Math.max(0, Math.floor(this.score || 0));
    const moneyValue = Math.max(0, Math.floor(this.money || 0));

    window.score = scoreValue;
    window.gameScore = scoreValue;
    window.currentScore = scoreValue;
    window.bestScore = Math.max(Number(window.bestScore) || 0, scoreValue);

    const stats = (Game.Runtime && Game.Runtime.stats) || {};
    window.gameState = {
      score: scoreValue,
      money: moneyValue,
      wantedLevel: this.wantedLevel || 0,
      enemyKills: stats.enemyKills || 0,
      npcKills: stats.npcKills || 0,
      copKills: stats.copKills || 0,
      runSeconds: stats.runSeconds || 0,
      missionsCompleted: stats.missionsCompleted || 0
    };
  },

  update() {
    if (this.messageTimer > 0) this.messageTimer--;

    if (Game.player && Number.isFinite(Game.player.health)) {
      this.health = Math.max(0, Math.floor(Game.player.health));
    }

    this.score = this.computeScore();
    this.highScore = Math.max(this.highScore || 0, this.score);
    this.syncScoreBridge();
  },

  draw(ctx, canvas) {
    const barWidth = 200;
    const barHeight = 20;
    const healthRatio = this.maxHealth > 0 ? this.health / this.maxHealth : 0;

    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(20, 20, barWidth + 4, barHeight + 4);

    ctx.fillStyle = "#ff0000";
    ctx.fillRect(22, 22, barWidth, barHeight);

    ctx.fillStyle = "#00ff00";
    ctx.fillRect(22, 22, barWidth * healthRatio, barHeight);

    ctx.fillStyle = "#ffffff";
    ctx.font = "16px Arial";
    ctx.fillText(`Health: ${this.health}`, 30, 38);

    ctx.font = "30px Arial";
    ctx.fillStyle = "#ffff00";
    for (let i = 0; i < this.wantedLevel; i++) {
      ctx.fillText("*", 20 + i * 20, 80);
    }

    let currentSpeed = 0;
    if (Game.VehicleManager && Game.VehicleManager.vehicles) {
      for (const v of Game.VehicleManager.vehicles) {
        if (v.occupied) {
          currentSpeed = Math.round(Math.abs(v.speed * 20));
          break;
        }
      }
    }

    if (currentSpeed > 0) {
      ctx.fillStyle = "#ffffff";
      ctx.font = "20px Arial";
      ctx.fillText(`Speed: ${currentSpeed} km/h`, canvas.width - 220, 40);
    }

    ctx.textAlign = "right";
    ctx.fillStyle = "#ffd700";
    ctx.font = "24px Arial";
    ctx.fillText(`$${Utils.formatNumber(this.money || 0)}`, canvas.width - 30, 40);

    ctx.fillStyle = "#8fd0ff";
    ctx.font = "20px Arial";
    ctx.fillText(`Score: ${Utils.formatNumber(this.score || 0)}`, canvas.width - 30, 70);

    if (Game.Runtime && Game.Runtime.stats) {
      const runSeconds = Game.Runtime.stats.runSeconds || 0;
      ctx.fillStyle = "#c0c0c0";
      ctx.font = "16px Arial";
      ctx.fillText(`Temps: ${runSeconds}s`, canvas.width - 30, 96);
      ctx.fillText(`Missions: ${Game.Runtime.stats.missionsCompleted || 0}`, canvas.width - 30, 118);
    }

    if (this.messageTimer > 0) {
      const alpha = Math.min(1, this.messageTimer / 60);
      ctx.textAlign = "center";
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.font = "30px Arial";
      ctx.fillText(this.message, canvas.width / 2, canvas.height - 50);
    }

    ctx.textAlign = "left";
  }
};
