// building.js - Systeme de batiments pour GodSworm

class Building {
  constructor(x, y, faction, type = BUILDING_TYPES.SHRINE) {
    this.x = x;
    this.y = y;
    this.faction = faction;
    this.type = type;
    this.health = 200;
    this.maxHealth = 200;
    this.selected = false;
    this.state = "active"; // active, damaged, destroyed
    this.productionQueue = [];
    this.productionTimer = 0;
    this.resourceTickTimer = 0;

    this.canProduce = false;
    this.produceTypes = [];
    this.productionTime = 3000;

    this.faithGeneration = 0;
    this.goldGeneration = 0;
    this.woodGeneration = 0;
    this.foodGeneration = 0;

    this.icon = "BLD";
    this.size = 42;
    this.description = "Building";

    this.applyBuildingType(type);
  }

  applyBuildingType(type) {
    switch (type) {
      case BUILDING_TYPES.TOWN_HALL:
        this.maxHealth = 500;
        this.health = 500;
        this.icon = "TH";
        this.size = 80;
        this.description = "Town center - Recruit peasants";
        this.canProduce = true;
        this.produceTypes = [UNIT_TYPES.PEASANT];
        this.productionTime = 2000;
        break;

      case BUILDING_TYPES.SHRINE:
        this.maxHealth = 150;
        this.health = 150;
        this.icon = "SH";
        this.size = 40;
        this.faithGeneration = 5;
        this.description = "Generates faith";
        break;

      case BUILDING_TYPES.TEMPLE:
        this.maxHealth = 300;
        this.health = 300;
        this.icon = "TP";
        this.size = 60;
        this.faithGeneration = 15;
        this.description = "Major faith generator";
        break;

      case BUILDING_TYPES.BARRACKS:
        this.maxHealth = 250;
        this.health = 250;
        this.icon = "BK";
        this.size = 50;
        this.description = "Trains warriors";
        this.canProduce = true;
        this.produceTypes = [UNIT_TYPES.WARRIOR, UNIT_TYPES.CRUSADER];
        this.productionTime = 3000;
        break;

      case BUILDING_TYPES.ARCHERY_RANGE:
        this.maxHealth = 200;
        this.health = 200;
        this.icon = "AR";
        this.size = 45;
        this.description = "Trains archers";
        this.canProduce = true;
        this.produceTypes = [UNIT_TYPES.ARCHER];
        this.productionTime = 2500;
        break;

      case BUILDING_TYPES.MONASTERY:
        this.maxHealth = 180;
        this.health = 180;
        this.icon = "MO";
        this.size = 45;
        this.faithGeneration = 8;
        this.description = "Trains priests";
        this.canProduce = true;
        this.produceTypes = [UNIT_TYPES.PRIEST];
        this.productionTime = 4000;
        break;

      case BUILDING_TYPES.ALTAR:
        this.maxHealth = 100;
        this.health = 100;
        this.icon = "AL";
        this.size = 30;
        this.faithGeneration = 3;
        this.description = "Small faith generator";
        break;

      case BUILDING_TYPES.FORTRESS:
        this.maxHealth = 500;
        this.health = 500;
        this.icon = "FT";
        this.size = 70;
        this.description = "Defensive structure";
        this.defenseBonus = 50;
        break;

      case BUILDING_TYPES.FARM:
        this.maxHealth = 160;
        this.health = 160;
        this.icon = "FM";
        this.size = 42;
        this.foodGeneration = 4;
        this.description = "Produces food over time";
        break;

      case BUILDING_TYPES.LUMBER_MILL:
        this.maxHealth = 170;
        this.health = 170;
        this.icon = "LM";
        this.size = 44;
        this.woodGeneration = 3;
        this.description = "Produces wood over time";
        break;

      case BUILDING_TYPES.MINE:
        this.maxHealth = 190;
        this.health = 190;
        this.icon = "MN";
        this.size = 46;
        this.goldGeneration = 2;
        this.description = "Produces gold over time";
        break;

      default:
        break;
    }
  }

  update(deltaTime) {
    if (this.state === "destroyed") return;

    if (this.health <= 0) {
      this.health = 0;
      this.state = "destroyed";
      return;
    }

    this.state = this.health < this.maxHealth * 0.3 ? "damaged" : "active";

    if (this.canProduce && this.productionQueue.length > 0) {
      this.productionTimer += deltaTime;
      if (this.productionTimer >= this.productionTime) {
        this.completeProduction();
        this.productionTimer = 0;
      }
    }

    this.resourceTickTimer += deltaTime;
    if (this.resourceTickTimer >= 1000 && this.faction === PLAYER_FACTION && this.state === "active") {
      this.resourceTickTimer = 0;
      if (this.foodGeneration > 0) addResource(RESOURCES.FOOD, this.foodGeneration);
      if (this.woodGeneration > 0) addResource(RESOURCES.WOOD, this.woodGeneration);
      if (this.goldGeneration > 0) addResource(RESOURCES.GOLD, this.goldGeneration);
    }
  }

  produceUnit(unitType) {
    if (!this.canProduce) return false;
    if (!this.produceTypes.includes(unitType)) return false;
    if (this.productionQueue.length >= 5) return false;

    this.productionQueue.push(unitType);
    return true;
  }

  completeProduction() {
    if (this.productionQueue.length === 0) return null;

    const unitType = this.productionQueue.shift();
    const spawnX = this.x + this.size / 2 + 20;
    const spawnY = this.y + this.size / 2;

    const unit = addUnit(spawnX, spawnY, this.faction, unitType);
    createParticleExplosion(spawnX, spawnY, getFactionColor(this.faction), 10);
    return unit;
  }

  cancelProduction(index = 0) {
    if (index < 0 || index >= this.productionQueue.length) return false;

    this.productionQueue.splice(index, 1);
    if (index === 0) this.productionTimer = 0;
    return true;
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.state = "destroyed";
    }
  }

  repair(amount) {
    if (this.state === "destroyed") return;

    this.health += amount;
    if (this.health > this.maxHealth) {
      this.health = this.maxHealth;
    }
  }

  contains(x, y) {
    return x >= this.x && x <= this.x + this.size && y >= this.y && y <= this.y + this.size;
  }

  draw(ctx) {
    if (this.state === "destroyed") {
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = "#333";
      ctx.fillRect(this.x, this.y, this.size, this.size);
      ctx.restore();
      return;
    }

    const bgColor = this.state === "damaged" ? "rgba(100, 50, 50, 0.8)" : "rgba(50, 50, 50, 0.9)";

    ctx.fillStyle = bgColor;
    ctx.fillRect(this.x, this.y, this.size, this.size);

    ctx.strokeStyle = this.selected ? "#ffcc00" : getFactionColor(this.faction);
    ctx.lineWidth = this.selected ? 3 : 2;
    ctx.strokeRect(this.x, this.y, this.size, this.size);

    ctx.save();
    ctx.font = `${Math.max(11, this.size * 0.27)}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff";
    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur = 4;
    ctx.fillText(this.icon, this.x + this.size / 2, this.y + this.size / 2);
    ctx.restore();

    const barWidth = this.size;
    const barHeight = 5;
    const barX = this.x;
    const barY = this.y - 10;

    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(barX, barY, barWidth, barHeight);

    const healthPercent = this.health / this.maxHealth;
    ctx.fillStyle = healthPercent > 0.5 ? "#4caf50" : healthPercent > 0.25 ? "#ff9800" : "#f44336";
    ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    if (this.canProduce && this.productionQueue.length > 0) {
      const progressPercent = this.productionTimer / this.productionTime;
      const progressBarY = this.y + this.size + 5;

      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.fillRect(barX, progressBarY, barWidth, barHeight);

      ctx.fillStyle = "#64b5f6";
      ctx.fillRect(barX, progressBarY, barWidth * progressPercent, barHeight);

      ctx.strokeStyle = "#000";
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, progressBarY, barWidth, barHeight);

      ctx.fillStyle = "#fff";
      ctx.font = "10px Arial";
      ctx.fillText(`${this.productionQueue.length}`, this.x + this.size - 8, this.y + 12);
    }

    if (this.faithGeneration > 0 && this.state === "active") {
      ctx.fillStyle = "#9370db";
      ctx.font = "10px Arial";
      ctx.fillText(`+${this.faithGeneration}`, this.x + this.size / 2, this.y - 15);
    }
  }
}

const BUILDING_TYPES = {
  TOWN_HALL: "town_hall",
  SHRINE: "shrine",
  TEMPLE: "temple",
  BARRACKS: "barracks",
  ARCHERY_RANGE: "archery_range",
  MONASTERY: "monastery",
  ALTAR: "altar",
  FORTRESS: "fortress",
  FARM: "farm",
  LUMBER_MILL: "lumber_mill",
  MINE: "mine"
};

const BUILDING_COSTS = {
  [BUILDING_TYPES.TOWN_HALL]: { gold: 300, wood: 200 },
  [BUILDING_TYPES.SHRINE]: { gold: 50, wood: 30 },
  [BUILDING_TYPES.TEMPLE]: { gold: 150, wood: 100 },
  [BUILDING_TYPES.BARRACKS]: { gold: 80, wood: 60 },
  [BUILDING_TYPES.ARCHERY_RANGE]: { gold: 70, wood: 50 },
  [BUILDING_TYPES.MONASTERY]: { gold: 100, wood: 80 },
  [BUILDING_TYPES.ALTAR]: { gold: 30, wood: 20 },
  [BUILDING_TYPES.FORTRESS]: { gold: 200, wood: 150 },
  [BUILDING_TYPES.FARM]: { gold: 40, wood: 30 },
  [BUILDING_TYPES.LUMBER_MILL]: { gold: 60, wood: 40 },
  [BUILDING_TYPES.MINE]: { gold: 80, wood: 50 }
};

function createBuilding(x, y, faction, type = BUILDING_TYPES.SHRINE) {
  return new Building(x, y, faction, type);
}

const buildings = [];

function addBuilding(x, y, faction, type) {
  const building = createBuilding(x, y, faction, type);
  buildings.push(building);
  return building;
}

function removeDestroyedBuildings() {
  for (let i = buildings.length - 1; i >= 0; i -= 1) {
    if (buildings[i].state === "destroyed") {
      // Keep ruins in list for ambiance; do not remove.
    }
  }
}

function updateAllBuildings(deltaTime) {
  buildings.forEach((building) => building.update(deltaTime));
  removeDestroyedBuildings();
}

function drawAllBuildings(ctx) {
  buildings.forEach((building) => building.draw(ctx));
}

function getBuildingAt(x, y) {
  for (let i = buildings.length - 1; i >= 0; i -= 1) {
    if (buildings[i].contains(x, y)) {
      return buildings[i];
    }
  }
  return null;
}

function getTotalFaithGeneration(faction) {
  let total = 0;
  buildings.forEach((building) => {
    if (building.faction === faction && building.state === "active") {
      total += building.faithGeneration;
    }
  });
  return total;
}
