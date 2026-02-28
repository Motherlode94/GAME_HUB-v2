// Map.js - SystÃ¨me de carte avancÃ© avec zones, grille de navigation, et Ã©vÃ©nements
// Version amÃ©liorÃ©e avec support du pathfinding, minimap, et limites dynamiques

Game.Map = {
  // Dimensions du monde
  width: 5200,
  height: 5200,
  
  // Configuration
  config: {
    tileSize: 64,              // Taille des tuiles pour la grille
    boundaryPadding: 50,       // Marge avant limite dure
    softBoundary: true,        // Ralentissement progressif aux bords
    wrapAround: false          // TÃ©lÃ©portation aux bords (style Pac-Man)
  },

  // Grille de navigation pour le pathfinding
  navGrid: null,
  
  // Zones dÃ©finies
  zones: {
    downtown: { 
      x: 800, y: 800, w: 1400, h: 1400,
      name: "Centre-ville",
      color: "#4a90d9",
      spawnRate: 1.5,
      policePresence: 0.8
    },
    suburbs: { 
      x: 100, y: 100, w: 600, h: 600,
      name: "Banlieue",
      color: "#6dd94a",
      spawnRate: 0.5,
      policePresence: 0.3
    },
    industrial: { 
      x: 2200, y: 200, w: 700, h: 800,
      name: "Zone Industrielle",
      color: "#d9994a",
      spawnRate: 0.8,
      policePresence: 0.4
    },
    docks: {
      x: 2200, y: 2000, w: 700, h: 900,
      name: "Quais",
      color: "#4ad9d9",
      spawnRate: 0.6,
      policePresence: 0.5
    },
    residential: {
      x: 100, y: 1500, w: 600, h: 1400,
      name: "RÃ©sidentiel",
      color: "#d94a90",
      spawnRate: 0.4,
      policePresence: 0.6
    }
  },

  // Points d'intÃ©rÃªt
  pointsOfInterest: [],

  /**
   * Initialise la carte
   */
  init() {
    this.generateNavGrid();
    this.setupDefaultPOIs();
    console.log(`Map initialized: ${this.width}x${this.height}`);
  },

  /**
   * GÃ©nÃ¨re la grille de navigation
   */
  generateNavGrid() {
    const cols = Math.ceil(this.width / this.config.tileSize);
    const rows = Math.ceil(this.height / this.config.tileSize);
    
    this.navGrid = {
      cols,
      rows,
      tileSize: this.config.tileSize,
      tiles: []
    };

    // Initialise toutes les tuiles comme navigables
    for (let y = 0; y < rows; y++) {
      this.navGrid.tiles[y] = [];
      for (let x = 0; x < cols; x++) {
        this.navGrid.tiles[y][x] = {
          walkable: true,
          drivable: true,
          cost: 1,
          zone: this.getZoneAt(x * this.config.tileSize, y * this.config.tileSize)
        };
      }
    }
  },

  /**
   * Marque une zone comme non-navigable (pour les bÃ¢timents)
   */
  blockArea(x, y, w, h, options = {}) {
    const { walkable = false, drivable = false, cost = Infinity } = options;
    
    const startCol = Math.floor(x / this.config.tileSize);
    const startRow = Math.floor(y / this.config.tileSize);
    const endCol = Math.ceil((x + w) / this.config.tileSize);
    const endRow = Math.ceil((y + h) / this.config.tileSize);

    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        if (this.navGrid.tiles[row] && this.navGrid.tiles[row][col]) {
          this.navGrid.tiles[row][col].walkable = walkable;
          this.navGrid.tiles[row][col].drivable = drivable;
          this.navGrid.tiles[row][col].cost = cost;
        }
      }
    }
  },

  /**
   * DÃ©finit les routes comme navigables avec coÃ»t rÃ©duit
   */
  markRoad(x, y, w, h) {
    this.markArea(x, y, w, h, { walkable: true, drivable: true, cost: 0.5 });
  },

  /**
   * Marque une zone avec des propriÃ©tÃ©s spÃ©cifiques
   */
  markArea(x, y, w, h, properties) {
    const startCol = Math.floor(x / this.config.tileSize);
    const startRow = Math.floor(y / this.config.tileSize);
    const endCol = Math.ceil((x + w) / this.config.tileSize);
    const endRow = Math.ceil((y + h) / this.config.tileSize);

    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        if (this.navGrid.tiles[row] && this.navGrid.tiles[row][col]) {
          Object.assign(this.navGrid.tiles[row][col], properties);
        }
      }
    }
  },

  /**
   * Configure les points d'intÃ©rÃªt par dÃ©faut
   */
  setupDefaultPOIs() {
    const w = this.width;
    const h = this.height;
    this.pointsOfInterest = [
      { x: Math.floor(w * 0.5), y: Math.floor(h * 0.5), type: 'center', name: 'Centre', icon: 'C' },
      { x: 350, y: 350, type: 'hospital', name: 'Hopital', icon: 'H' },
      { x: Math.floor(w * 0.82), y: 700, type: 'garage', name: 'Garage', icon: 'G' },
      { x: Math.floor(w * 0.86), y: Math.floor(h * 0.84), type: 'port', name: 'Port', icon: 'P' },
      { x: 450, y: Math.floor(h * 0.78), type: 'police', name: 'Commissariat', icon: 'L' }
    ];
  },

  /**
   * Ajoute un point d'intÃ©rÃªt
   */
  addPOI(x, y, type, name, icon = 'ðŸ“') {
    this.pointsOfInterest.push({ x, y, type, name, icon });
  },

  /**
   * Limite la camÃ©ra aux bords de la carte
   */
  clampCamera(canvas) {
    if (!Game.camera) return;
    
    Game.camera.x = Utils.clamp(
      Game.camera.x,
      0,
      Math.max(0, this.width - canvas.width)
    );
    Game.camera.y = Utils.clamp(
      Game.camera.y,
      0,
      Math.max(0, this.height - canvas.height)
    );
  },

  /**
   * VÃ©rifie si une position est dans les limites
   */
  isInBounds(x, y, size = 0) {
    return x >= 0 && 
           x + size <= this.width &&
           y >= 0 && 
           y + size <= this.height;
  },

  /**
   * Contraint une position aux limites de la carte
   */
  clampPosition(x, y, width = 0, height = 0) {
    return {
      x: Utils.clamp(x, 0, this.width - width),
      y: Utils.clamp(y, 0, this.height - height)
    };
  },

  /**
   * Applique les limites de la carte Ã  une entitÃ©
   * @param {Object} entity - EntitÃ© avec x, y, width/size, height/size, vx, vy
   * @param {Object} options - Options de comportement aux bords
   */
  constrainEntity(entity, options = {}) {
    const { 
      bounce = false, 
      bounceElasticity = 0.5,
      slowdown = this.config.softBoundary,
      slowdownFactor = 0.9
    } = options;

    const width = entity.width || entity.size || 0;
    const height = entity.height || entity.size || 0;
    const padding = this.config.boundaryPadding;

    // Wrap around (tÃ©lÃ©portation)
    if (this.config.wrapAround) {
      if (entity.x < -width) entity.x = this.width;
      if (entity.x > this.width) entity.x = -width;
      if (entity.y < -height) entity.y = this.height;
      if (entity.y > this.height) entity.y = -height;
      return;
    }

    // Zone de ralentissement (soft boundary)
    if (slowdown) {
      if (entity.x < padding || entity.x > this.width - width - padding ||
          entity.y < padding || entity.y > this.height - height - padding) {
        if (entity.speed !== undefined) {
          entity.speed *= slowdownFactor;
        }
        if (entity.vx !== undefined) {
          entity.vx *= slowdownFactor;
          entity.vy *= slowdownFactor;
        }
      }
    }

    // Limites dures
    if (entity.x < 0) {
      entity.x = 0;
      if (bounce && entity.vx !== undefined) {
        entity.vx = Math.abs(entity.vx) * bounceElasticity;
      }
    }
    if (entity.x + width > this.width) {
      entity.x = this.width - width;
      if (bounce && entity.vx !== undefined) {
        entity.vx = -Math.abs(entity.vx) * bounceElasticity;
      }
    }
    if (entity.y < 0) {
      entity.y = 0;
      if (bounce && entity.vy !== undefined) {
        entity.vy = Math.abs(entity.vy) * bounceElasticity;
      }
    }
    if (entity.y + height > this.height) {
      entity.y = this.height - height;
      if (bounce && entity.vy !== undefined) {
        entity.vy = -Math.abs(entity.vy) * bounceElasticity;
      }
    }
  },

  /**
   * Obtient la zone Ã  une position donnÃ©e
   */
  getZoneAt(x, y) {
    for (const [name, zone] of Object.entries(this.zones)) {
      if (x >= zone.x && x < zone.x + zone.w &&
          y >= zone.y && y < zone.y + zone.h) {
        return { name, ...zone };
      }
    }
    return null;
  },

  /**
   * Obtient le nom de la zone (pour affichage)
   */
  getZoneName(x, y) {
    const zone = this.getZoneAt(x, y);
    return zone ? zone.name : "Wilderness";
  },

  /**
   * VÃ©rifie si une tuile est navigable
   */
  isTileWalkable(x, y) {
    const col = Math.floor(x / this.config.tileSize);
    const row = Math.floor(y / this.config.tileSize);
    
    if (!this.navGrid.tiles[row] || !this.navGrid.tiles[row][col]) {
      return false;
    }
    
    return this.navGrid.tiles[row][col].walkable;
  },

  /**
   * VÃ©rifie si une tuile est accessible en vÃ©hicule
   */
  isTileDrivable(x, y) {
    const col = Math.floor(x / this.config.tileSize);
    const row = Math.floor(y / this.config.tileSize);
    
    if (!this.navGrid.tiles[row] || !this.navGrid.tiles[row][col]) {
      return false;
    }
    
    return this.navGrid.tiles[row][col].drivable;
  },

  /**
   * Obtient le coÃ»t de dÃ©placement d'une tuile
   */
  getTileCost(x, y) {
    const col = Math.floor(x / this.config.tileSize);
    const row = Math.floor(y / this.config.tileSize);
    
    if (!this.navGrid.tiles[row] || !this.navGrid.tiles[row][col]) {
      return Infinity;
    }
    
    return this.navGrid.tiles[row][col].cost;
  },

  /**
   * Trouve le point d'intÃ©rÃªt le plus proche
   */
  getNearestPOI(x, y, type = null) {
    let nearest = null;
    let minDist = Infinity;

    for (const poi of this.pointsOfInterest) {
      if (type && poi.type !== type) continue;
      
      const dist = Math.sqrt((poi.x - x) ** 2 + (poi.y - y) ** 2);
      if (dist < minDist) {
        minDist = dist;
        nearest = poi;
      }
    }

    return nearest ? { ...nearest, distance: minDist } : null;
  },

  /**
   * Obtient une position alÃ©atoire valide sur la carte
   */
  getRandomPosition(options = {}) {
    const { 
      padding = 100, 
      zone = null,
      avoidBuildings = true,
      maxAttempts = 50 
    } = options;

    for (let i = 0; i < maxAttempts; i++) {
      let x, y;

      if (zone && this.zones[zone]) {
        const z = this.zones[zone];
        x = z.x + Math.random() * z.w;
        y = z.y + Math.random() * z.h;
      } else {
        x = padding + Math.random() * (this.width - padding * 2);
        y = padding + Math.random() * (this.height - padding * 2);
      }

      // VÃ©rifier si la position est valide
      if (avoidBuildings && !this.isTileWalkable(x, y)) {
        continue;
      }

      return { x, y };
    }

    // Fallback si aucune position trouvÃ©e
    return { x: this.width / 2, y: this.height / 2 };
  },

  /**
   * Obtient une position alÃ©atoire sur une route
   */
  getRandomRoadPosition(roads) {
    if (!roads || roads.length === 0) {
      return this.getRandomPosition();
    }

    const road = roads[Math.floor(Math.random() * roads.length)];
    
    return {
      x: road.x + Math.random() * road.width,
      y: road.y + Math.random() * road.height,
      direction: road.direction
    };
  },

  /**
   * Calcule la distance entre deux points
   */
  distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  },

  /**
   * Calcule l'angle entre deux points (en degrÃ©s)
   */
  angleBetween(x1, y1, x2, y2) {
    return Utils.radToDeg(Math.atan2(y2 - y1, x2 - x1));
  },

  /**
   * Conversion coordonnÃ©es monde -> Ã©cran
   */
  worldToScreen(worldX, worldY) {
    if (!Game.camera) return { x: worldX, y: worldY };
    return {
      x: worldX - Game.camera.x,
      y: worldY - Game.camera.y
    };
  },

  /**
   * Conversion coordonnÃ©es Ã©cran -> monde
   */
  screenToWorld(screenX, screenY) {
    if (!Game.camera) return { x: screenX, y: screenY };
    return {
      x: screenX + Game.camera.x,
      y: screenY + Game.camera.y
    };
  },

  /**
   * Dessine la minimap
   */
  drawMinimap(ctx, x, y, width, height) {
    const scaleX = width / this.width;
    const scaleY = height / this.height;

    ctx.save();
    
    // Fond
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(x, y, width, height);
    
    // Bordure
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    // Zones
    for (const zone of Object.values(this.zones)) {
      ctx.fillStyle = zone.color + "40"; // Semi-transparent
      ctx.fillRect(
        x + zone.x * scaleX,
        y + zone.y * scaleY,
        zone.w * scaleX,
        zone.h * scaleY
      );
    }

    // Points d'intÃ©rÃªt
    ctx.font = "8px Arial";
    for (const poi of this.pointsOfInterest) {
      ctx.fillStyle = "#ffffff";
      ctx.fillText(poi.icon, x + poi.x * scaleX - 4, y + poi.y * scaleY + 3);
    }

    // Joueur
    const player = Game.player || Game.Player;
    if (player) {
      ctx.fillStyle = "#00ff00";
      ctx.beginPath();
      ctx.arc(
        x + player.x * scaleX,
        y + player.y * scaleY,
        3, 0, Math.PI * 2
      );
      ctx.fill();
    }

    // Viewport actuel
    if (Game.camera && Game.canvas) {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.strokeRect(
        x + Game.camera.x * scaleX,
        y + Game.camera.y * scaleY,
        Game.canvas.width * scaleX,
        Game.canvas.height * scaleY
      );
    }

    ctx.restore();
  },

  /**
   * Debug: dessine la grille de navigation
   */
  debugDrawNavGrid(ctx) {
    if (!this.navGrid) return;

    ctx.save();
    ctx.globalAlpha = 0.3;
    
    const camera = Game.camera || { x: 0, y: 0 };
    const canvas = Game.canvas || { width: 800, height: 600 };

    // Ne dessiner que les tuiles visibles
    const startCol = Math.floor(camera.x / this.config.tileSize);
    const startRow = Math.floor(camera.y / this.config.tileSize);
    const endCol = Math.ceil((camera.x + canvas.width) / this.config.tileSize);
    const endRow = Math.ceil((camera.y + canvas.height) / this.config.tileSize);

    for (let row = startRow; row <= endRow && row < this.navGrid.rows; row++) {
      for (let col = startCol; col <= endCol && col < this.navGrid.cols; col++) {
        if (row < 0 || col < 0) continue;
        
        const tile = this.navGrid.tiles[row]?.[col];
        if (!tile) continue;

        const x = col * this.config.tileSize - camera.x;
        const y = row * this.config.tileSize - camera.y;

        if (!tile.walkable) {
          ctx.fillStyle = "#ff0000";
          ctx.fillRect(x, y, this.config.tileSize, this.config.tileSize);
        } else if (tile.cost < 1) {
          ctx.fillStyle = "#00ff00";
          ctx.fillRect(x, y, this.config.tileSize, this.config.tileSize);
        }
      }
    }

    ctx.restore();
  }
};
