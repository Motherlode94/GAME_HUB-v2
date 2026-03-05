// Buildings.js - BÃ¢timents dÃ©coratifs + obstacles

Game.Buildings = {
  list: [],
  
  // DÃ©finir les routes (mÃªme que Traffic.js) AVEC MARGE DE SÃ‰CURITÃ‰
  roads: [
    { x: 700, y: 0, width: 200, height: 5200 },   // Route verticale
    { x: 0, y: 900, width: 5200, height: 200 }    // Route horizontale
  ],

init() {
  // BÃ¢timents placÃ©s manuellement LOIN DES ROUTES
  this.add(200, 200, 400, 300, "#555555");    // âœ… Loin de la route verticale (700)
  this.add(1200, 200, 300, 400, "#444444");   // âœ… Loin des deux routes
  this.add(1800, 500, 250, 250, "#777777");   // âœ… Loin des routes
  this.add(100, 1300, 400, 200, "#aa6666");   // âœ… Sous la route horizontale (900+200=1100)
  this.add(2200, 300, 400, 600, "#555577");   // âœ… Loin de la route verticale
  this.add(400, 1600, 300, 400, "#666666");   // âœ… Loin des routes
  this.add(1600, 1800, 600, 300, "#774444");  // âœ… Loin des routes
  this.add(2000, 1400, 300, 500, "#6666aa");  // âœ… Loin des routes

  // Petits bÃ¢timents alÃ©atoires (mais pas sur les routes)
  let attempts = 0;
  let spawned = 0;
  const maxAttempts = 500; // âœ… Plus d'essais
  const targetBuildings = 30;
  
  while (spawned < targetBuildings && attempts < maxAttempts) {
    attempts++;
    
    const w = Utils.randomInt(100, 250);
    const h = Utils.randomInt(100, 250);
    const x = Utils.randomInt(100, Game.Map.width - w - 100);
    const y = Utils.randomInt(100, Game.Map.height - h - 100);
    
    // VÃ©rifier si le bÃ¢timent est sur une route (avec marge)
    if (!this.isOnRoad(x, y, w, h)) {
      // VÃ©rifier si trop proche d'un autre bÃ¢timent
      if (!this.isTooClose(x, y, w, h)) {
        this.add(x, y, w, h, this.getRandomBuildingColor());
        spawned++;
      }
    }
  }
  
  console.log(`BÃ¢timents gÃ©nÃ©rÃ©s: ${spawned}/${targetBuildings} aprÃ¨s ${attempts} essais`);
},
  
isOnRoad(x, y, w, h) {
  // Marge de sÃ©curitÃ© TRÃˆS LARGE autour des routes (100px de chaque cÃ´tÃ©)
  const margin = 100; // âœ… AugmentÃ© de 50 Ã  100
  
  // VÃ©rifier si le bÃ¢timent chevauche une route + marge
  for (const road of this.roads) {
    // Ã‰largir la zone interdite avec la marge
    const expandedRoad = {
      x: road.x - margin,
      y: road.y - margin,
      width: road.width + margin * 2,
      height: road.height + margin * 2
    };
    
    if (Utils.rectOverlap(
      x, y, w, h, 
      expandedRoad.x, expandedRoad.y, expandedRoad.width, expandedRoad.height
    )) {
      return true;
    }
  }
  return false;
},
  
  isTooClose(x, y, w, h) {
    // VÃ©rifier si trop proche d'un autre bÃ¢timent (marge de 50px)
    const margin = 50;
    for (const building of this.list) {
      if (Utils.rectOverlap(
        x - margin, y - margin, w + margin * 2, h + margin * 2,
        building.x, building.y, building.w, building.h
      )) {
        return true;
      }
    }
    return false;
  },
  
  getRandomBuildingColor() {
    const colors = [
      "#555555", // Gris foncÃ©
      "#666666", // Gris moyen
      "#777777", // Gris clair
      "#888888", // Gris trÃ¨s clair
      "#6666aa", // Bleu gris
      "#aa6666", // Rouge gris
      "#555577", // Bleu foncÃ©
      "#774444"  // Rouge foncÃ©
    ];
    return colors[Utils.randomInt(0, colors.length - 1)];
  },

  add(x, y, w, h, color = "#666666") {
    this.list.push({ x, y, w, h, color });
  },

  update() {
    // RÃ©solution collision joueur/bÃ¢timents
    const p = Game.player;
    this.list.forEach(building => {
      if (Utils.rectOverlap(p.x, p.y, p.size, p.size, building.x, building.y, building.w, building.h)) {
        // Push-out simple
        const dx = (p.x + p.size / 2) - (building.x + building.w / 2);
        const dy = (p.y + p.size / 2) - (building.y + building.h / 2);

        const overlapX = (p.size + building.w) / 2 - Math.abs(dx);
        const overlapY = (p.size + building.h) / 2 - Math.abs(dy);

        if (overlapX < overlapY) {
          p.x += dx > 0 ? overlapX : -overlapX;
        } else {
          p.y += dy > 0 ? overlapY : -overlapY;
        }
      }
    });

    // Collision vÃ©hicules/bÃ¢timents (si VehicleManager existe)
    if (Game.VehicleManager && Game.VehicleManager.vehicles) {
      Game.VehicleManager.vehicles.forEach(v => {
        if (!v.occupied) return;
        this.list.forEach(building => {
          if (Utils.rectOverlap(v.x, v.y, v.width, v.height, building.x, building.y, building.w, building.h)) {
            v.speed *= -0.5;
            if (Game.Camera && Game.Camera.shake) {
              Game.Camera.shake(8, 10);
            }
          }
        });
      });
    }
  },

  draw(ctx) {
    this.list.forEach(b => {
      // Ombre simple
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fillRect(b.x + 10, b.y + 10, b.w, b.h);

      // BÃ¢timent
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.w, b.h);

      // Bordures
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 3;
      ctx.strokeRect(b.x, b.y, b.w, b.h);
      
      // FenÃªtres pour plus de dÃ©tail
      ctx.fillStyle = "rgba(255, 255, 200, 0.3)";
      const windowSize = 8;
      const windowSpacing = 25;
      
      for (let wx = b.x + 15; wx < b.x + b.w - 15; wx += windowSpacing) {
        for (let wy = b.y + 15; wy < b.y + b.h - 15; wy += windowSpacing) {
          ctx.fillRect(wx, wy, windowSize, windowSize);
        }
      }
    });
  }
};
