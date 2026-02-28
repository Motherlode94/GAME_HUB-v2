// Minimap.js - Mini map in bottom-left corner

Game.Minimap = {
  x: 20,
  y: null,
  size: 150,
  scale: 0.15,

  draw(ctx, canvas) {
    const mm = this;
    mm.y = canvas.height - 170;

    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(mm.x - 5, mm.y - 5, mm.size + 10, mm.size + 10);

    ctx.strokeStyle = "#00ff00";
    ctx.lineWidth = 3;
    ctx.strokeRect(mm.x - 5, mm.y - 5, mm.size + 10, mm.size + 10);

    ctx.save();
    ctx.beginPath();
    ctx.rect(mm.x, mm.y, mm.size, mm.size);
    ctx.clip();

    const cameraX = (Game.Camera && Game.Camera.x) || 0;
    const cameraY = (Game.Camera && Game.Camera.y) || 0;

    const centerX = mm.x + mm.size / 2;
    const centerY = mm.y + mm.size / 2;

    const drawBlip = (worldX, worldY, color, size = 6) => {
      const screenX = centerX + (worldX - cameraX) * mm.scale;
      const screenY = centerY + (worldY - cameraY) * mm.scale;
      ctx.fillStyle = color;
      ctx.fillRect(screenX - size / 2, screenY - size / 2, size, size);
    };

    let playerAngle = 0;
    if (Game.VehicleManager && Game.VehicleManager.vehicles) {
      for (const v of Game.VehicleManager.vehicles) {
        if (v.occupied) playerAngle = v.angle;
      }
    }

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(Utils.degToRad(playerAngle));
    ctx.fillStyle = "#00bfff";
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(-6, 4);
    ctx.lineTo(6, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    if (Game.VehicleManager && Game.VehicleManager.vehicles) {
      Game.VehicleManager.vehicles.forEach((v) => {
        drawBlip(v.x + v.width / 2, v.y + v.height / 2, "#ffff00", 8);
      });
    }

    if (Game.EnemyManager && Game.EnemyManager.enemies) {
      Game.EnemyManager.enemies.forEach((e) => {
        drawBlip(e.x + e.size / 2, e.y + e.size / 2, "#ff0000");
      });
    }

    if (Game.NPCManager && Game.NPCManager.npcs) {
      Game.NPCManager.npcs.forEach((n) => {
        drawBlip(n.x + n.size / 2, n.y + n.size / 2, "#00ff00");
      });
    }

    ctx.restore();
  }
};
