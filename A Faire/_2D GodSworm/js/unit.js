// unit.js - Système d'unités pour GodSworm

class Unit {
  constructor(x, y, faction, type = "warrior") {
    this.x = x;
    this.y = y;
    this.faction = faction;
    this.type = type;
    this.health = 100;
    this.maxHealth = 100;
    this.speed = 2;
    this.attackPower = 10;
    this.attackRange = 50;
    this.attackCooldown = 0;
    this.maxAttackCooldown = 1000; // ms
    this.selected = false;
    this.target = null;
    this.state = "idle"; // idle, moving, attacking, harvesting, dead
    
    // Destination pour le mouvement
    this.targetX = x;
    this.targetY = y;
    
    // Propriétés selon le type
    this.applyUnitType(type);
    this.guardX = x;
    this.guardY = y;
    this.patrolX = x;
    this.patrolY = y;
    this.patrolRadius = this.canHarvest ? 0 : 180;
    this.patrolPauseTimer = 0;
    this.manualAttackOrder = false;
    this.commandStance = this.canHarvest ? "worker" : "guard";
  }

  applyUnitType(type) {
    this.canHarvest = false;
    switch(type) {
      case "peasant":
        this.maxHealth = 50;
        this.health = 50;
        this.speed = 2;
        this.attackPower = 3;
        this.attackRange = 20;
        this.icon = "👨‍🌾";
        this.canHarvest = true;
        this.harvestRate = 10; // par seconde
        this.carryCapacity = 50;
        this.carrying = 0;
        this.carryingType = null;
        this.harvestTarget = null;
        this.dropoffBuilding = null;
        break;
      case "warrior":
        this.maxHealth = 100;
        this.health = 100;
        this.speed = 2;
        this.attackPower = 15;
        this.attackRange = 30;
        this.icon = "⚔️";
        break;
      case "archer":
        this.maxHealth = 60;
        this.health = 60;
        this.speed = 2.5;
        this.attackPower = 10;
        this.attackRange = 100;
        this.icon = "🏹";
        break;
      case "priest":
        this.maxHealth = 80;
        this.health = 80;
        this.speed = 1.5;
        this.attackPower = 5;
        this.attackRange = 60;
        this.icon = "✨";
        this.healPower = 20;
        break;
      case "crusader":
        this.maxHealth = 150;
        this.health = 150;
        this.speed = 1.5;
        this.attackPower = 20;
        this.attackRange = 25;
        this.icon = "🛡️";
        break;
      default:
        this.icon = "👤";
    }
  }

  update(deltaTime, allUnits) {
    // Cooldown d'attaque
    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTime;
    }

    if (this.state === "dead") return;

    // Paysan en mode récolte
    if (this.canHarvest) {
      if (this.harvestTarget && !this.isHarvestNodeUsable(this.harvestTarget, 0.01)) {
        this.harvestTarget = null;
      }

      if (!this.harvestTarget && !this.dropoffBuilding && this.carrying <= 0) {
        this.assignNearestResourceNode();
      }

      if (this.dropoffBuilding) {
        this.dropoff(deltaTime);
        return;
      }
      if (this.harvestTarget) {
        this.harvest(deltaTime);
        return;
      }
    }

    // Combat pour unités de combat uniquement
    if (!this.canHarvest) {
      this.updateCombatBehavior(deltaTime, allUnits);
      return;
    }

    // Mouvement simple
    if (!this.target && !this.harvestTarget && !this.dropoffBuilding) {
      this.moveToTarget(deltaTime);
    }
  }

  isTargetAlive(target) {
    if (!target) return false;
    if (target.state === "dead" || target.state === "destroyed") return false;
    if (typeof target.health === "number" && target.health <= 0) return false;
    return true;
  }

  isFactionHostile(otherFaction) {
    if (!otherFaction || otherFaction === this.faction) return false;
    if (typeof areHostileFactions === "function") {
      return areHostileFactions(this.faction, otherFaction);
    }
    if (typeof areHostileByDefault === "function") {
      return areHostileByDefault(this.faction, otherFaction);
    }
    return otherFaction !== this.faction;
  }

  getGuardRadius() {
    if (this.type === UNIT_TYPES.ARCHER) return 320;
    if (this.type === UNIT_TYPES.CRUSADER) return 230;
    return 260;
  }

  pickPatrolPoint() {
    const radius = this.getGuardRadius() * 0.75;
    const angle = Math.random() * Math.PI * 2;
    const distance = radius * (0.35 + Math.random() * 0.65);

    let px = this.guardX + Math.cos(angle) * distance;
    let py = this.guardY + Math.sin(angle) * distance;

    if (typeof canvas !== "undefined") {
      px = Math.max(10, Math.min(canvas.width - 10, px));
      py = Math.max(10, Math.min(canvas.height - 10, py));
    }

    this.patrolX = px;
    this.patrolY = py;
  }

  hasReachedPatrolPoint() {
    return Math.hypot(this.x - this.patrolX, this.y - this.patrolY) <= 10;
  }

  setManualAttackTarget(target) {
    this.target = target;
    this.manualAttackOrder = true;
    this.commandStance = "assault";
  }

  clearCombatTarget() {
    this.target = null;
    this.manualAttackOrder = false;
    this.commandStance = "guard";
  }

  updateCombatBehavior(deltaTime, allUnits) {
    if (this.manualAttackOrder) {
      if (this.isTargetAlive(this.target)) {
        this.attackTarget(deltaTime);
        return;
      }
      this.clearCombatTarget();
    }

    const guardRadius = this.getGuardRadius();
    const threat =
      this.findNearestEnemy(allUnits, guardRadius, this.guardX, this.guardY) ||
      this.findNearestEnemyBuilding(guardRadius, this.guardX, this.guardY);

    if (this.isTargetAlive(threat)) {
      this.target = threat;
      this.attackTarget(deltaTime);
      return;
    }

    this.target = null;
    this.commandStance = "guard";

    if (this.patrolPauseTimer > 0) {
      this.patrolPauseTimer -= deltaTime;
      this.state = "idle";
      return;
    }

    if (!this.patrolX && !this.patrolY) {
      this.pickPatrolPoint();
    }

    if (this.hasReachedPatrolPoint()) {
      this.patrolPauseTimer = 400 + Math.random() * 1000;
      this.pickPatrolPoint();
      this.state = "idle";
      return;
    }

    this.targetX = this.patrolX;
    this.targetY = this.patrolY;
    this.moveToTarget(deltaTime);
  }

  isHarvestNodeUsable(node, minAmount = 1) {
    return !!node && typeof node.amount === "number" && node.amount > minAmount;
  }

  getFactionActiveBuildings() {
    if (typeof buildings === "undefined") return [];
    return buildings.filter(
      (building) =>
        building &&
        building.faction === this.faction &&
        building.state === "active"
    );
  }

  getFactionResourceNeeds() {
    const needs = {
      [RESOURCES.GOLD]: 1,
      [RESOURCES.FOOD]: 1,
      [RESOURCES.WOOD]: 1
    };

    const factionUnits =
      typeof units === "undefined"
        ? []
        : units.filter((unit) => unit.faction === this.faction && unit.state !== "dead");
    const factionBuildings = this.getFactionActiveBuildings();

    const townHallCount = factionBuildings.filter(
      (building) =>
        typeof BUILDING_TYPES !== "undefined" &&
        building.type === BUILDING_TYPES.TOWN_HALL
    ).length;

    const targetStock = {
      [RESOURCES.GOLD]: 220 + factionBuildings.length * 20 + townHallCount * 80,
      [RESOURCES.FOOD]: 160 + factionUnits.length * 8,
      [RESOURCES.WOOD]: 140 + factionBuildings.length * 18 + townHallCount * 45
    };

    [RESOURCES.GOLD, RESOURCES.FOOD, RESOURCES.WOOD].forEach((type) => {
      const current = Number(resources[type]) || 0;
      const target = targetStock[type];
      const missing = Math.max(0, target - current);
      needs[type] += (missing / Math.max(1, target)) * 5;
    });

    if (typeof BUILDING_TYPES !== "undefined" && typeof BUILDING_COSTS !== "undefined") {
      const keyBuildings = [
        BUILDING_TYPES.TOWN_HALL,
        BUILDING_TYPES.BARRACKS,
        BUILDING_TYPES.FARM,
        BUILDING_TYPES.LUMBER_MILL,
        BUILDING_TYPES.MINE
      ];

      keyBuildings.forEach((buildingType) => {
        const cost = BUILDING_COSTS[buildingType];
        if (!cost) return;

        [RESOURCES.GOLD, RESOURCES.FOOD, RESOURCES.WOOD].forEach((type) => {
          const required = Number(cost[type]) || 0;
          if (required <= 0) return;
          const current = Number(resources[type]) || 0;
          const missing = Math.max(0, required - current);
          const multiplier =
            buildingType === BUILDING_TYPES.TOWN_HALL ? 0.08 : 0.05;
          needs[type] += missing * multiplier;
        });
      });
    }

    factionBuildings.forEach((building) => {
      if (!building.canProduce || !Array.isArray(building.produceTypes)) return;
      const unitType =
        (Array.isArray(building.productionQueue) && building.productionQueue[0]) ||
        building.produceTypes[0];
      if (!unitType || typeof UNIT_COSTS === "undefined") return;

      const baseCost = UNIT_COSTS[unitType];
      if (!baseCost) return;

      const queueDepth = Array.isArray(building.productionQueue)
        ? building.productionQueue.length
        : 0;
      const queueMultiplier = 1 + Math.min(queueDepth, 4) * 0.45;

      [RESOURCES.GOLD, RESOURCES.FOOD, RESOURCES.WOOD].forEach((type) => {
        const required = Number(baseCost[type]) || 0;
        if (required <= 0) return;
        needs[type] += required * 0.035 * queueMultiplier;
      });
    });

    if (townHallCount <= 1) {
      needs[RESOURCES.WOOD] += 1.2;
      needs[RESOURCES.GOLD] += 0.9;
    }

    return needs;
  }

  getBestResourceNode() {
    if (typeof resourceNodes === "undefined" || resourceNodes.length === 0) return null;

    const needs = this.getFactionResourceNeeds();
    const primaryNodes = resourceNodes.filter((node) =>
      this.isHarvestNodeUsable(node, 1)
    );
    const candidates =
      primaryNodes.length > 0
        ? primaryNodes
        : resourceNodes.filter((node) => this.isHarvestNodeUsable(node, 0.01));

    if (candidates.length === 0) return null;

    let bestNode = null;
    let bestScore = -Infinity;

    candidates.forEach((node) => {
      const distance = Math.hypot(node.x - this.x, node.y - this.y);
      const needScore = (needs[node.type] || 1) * 3;
      const fullness =
        typeof node.maxAmount === "number" && node.maxAmount > 0
          ? node.amount / node.maxAmount
          : 1;
      const richnessScore = Math.max(0.2, fullness) * 1.8;
      const distancePenalty = distance / 240;
      const score = needScore + richnessScore - distancePenalty;

      if (score > bestScore) {
        bestScore = score;
        bestNode = node;
      }
    });

    return bestNode;
  }

  assignNearestResourceNode() {
    if (!this.canHarvest) return;

    const targetNode = this.getBestResourceNode();
    if (targetNode) {
      this.harvestTarget = targetNode;
      this.targetX = targetNode.x;
      this.targetY = targetNode.y;
      this.state = "moving";
      return;
    }

    this.harvestTarget = null;
    this.state = "idle";
  }

  harvest(deltaTime) {
    if (!this.canHarvest || !this.harvestTarget) return;

    if (!this.isHarvestNodeUsable(this.harvestTarget, 0.01)) {
      this.harvestTarget = null;
      if (this.carrying > 0) {
        this.findDropoffBuilding();
      } else {
        this.assignNearestResourceNode();
      }
      return;
    }

    const dist = Math.hypot(this.x - this.harvestTarget.x, this.y - this.harvestTarget.y);
    
    if (dist <= 30) {
      // À portée, récolter
      this.state = "harvesting";
      
      if (this.carrying < this.carryCapacity && this.isHarvestNodeUsable(this.harvestTarget, 0.01)) {
        const harvestAmount = this.harvestRate * (deltaTime / 1000);
        const harvested = this.harvestTarget.harvest(harvestAmount);
        this.carrying += harvested;
        this.carryingType = this.harvestTarget.type;

        // Animation de récolte
        if (Math.random() < 0.05) {
          createParticleExplosion(this.x, this.y, "#8bc34a", 3);
        }
      }

      // Si plein ou ressource épuisée, retourner déposer
      if (this.carrying >= this.carryCapacity) {
        this.findDropoffBuilding();
      } else if (!this.isHarvestNodeUsable(this.harvestTarget, 0.01)) {
        if (this.carrying > 0) {
          this.findDropoffBuilding();
        } else {
          this.harvestTarget = null;
          this.assignNearestResourceNode();
        }
      }
    } else {
      // Se déplacer vers la ressource
      this.state = "moving";
      this.targetX = this.harvestTarget.x;
      this.targetY = this.harvestTarget.y;
      this.moveToTarget(deltaTime);
    }
  }

  findDropoffBuilding() {
    // Trouver le bâtiment le plus proche pour déposer
    let closest = null;
    let bestScore = Infinity;

    buildings.forEach(b => {
      if (b.faction === this.faction && b.state === "active") {
        const dist = Math.hypot(b.x + b.size / 2 - this.x, b.y + b.size / 2 - this.y);
        const isTownHall =
          typeof BUILDING_TYPES !== "undefined" &&
          b.type === BUILDING_TYPES.TOWN_HALL;
        const score = dist - (isTownHall ? 120 : 0);

        if (score < bestScore) {
          bestScore = score;
          closest = b;
        }
      }
    });

    if (closest) {
      this.dropoffBuilding = closest;
      this.targetX = closest.x + closest.size / 2;
      this.targetY = closest.y + closest.size / 2;
      this.state = "moving";
    }
  }

  dropoff(deltaTime) {
    if (!this.dropoffBuilding || this.carrying <= 0) {
      this.dropoffBuilding = null;
      this.state = "idle";
      if (!this.harvestTarget) {
        this.assignNearestResourceNode();
      }
      return;
    }

    const dist = Math.hypot(
      this.x - (this.dropoffBuilding.x + this.dropoffBuilding.size / 2),
      this.y - (this.dropoffBuilding.y + this.dropoffBuilding.size / 2)
    );

    if (dist <= 40) {
      // Déposer les ressources
      addResource(this.carryingType, this.carrying);
      createParticleExplosion(this.x, this.y, "#ffd700", 8);
      
      console.log(`Deposited ${Math.floor(this.carrying)} ${this.carryingType}`);
      
      this.carrying = 0;
      this.carryingType = null;
      this.dropoffBuilding = null;
      this.state = "idle";

      // Retourner récolter si la ressource existe encore
      this.harvestTarget = null;
      this.assignNearestResourceNode();
    } else {
      // Se déplacer vers le bâtiment
      this.state = "moving";
      this.targetX = this.dropoffBuilding.x + this.dropoffBuilding.size / 2;
      this.targetY = this.dropoffBuilding.y + this.dropoffBuilding.size / 2;
      this.moveToTarget(deltaTime);
    }
  }

  moveToTarget(deltaTime) {
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 5) {
      const moveSpeed = this.speed * (deltaTime / 16);
      this.x += (dx / distance) * moveSpeed;
      this.y += (dy / distance) * moveSpeed;
      this.state = "moving";
    } else {
      this.state = "idle";
    }
  }

  attackTarget(deltaTime) {
    const targetX = this.target && typeof this.target.size === "number"
      ? this.target.x + this.target.size / 2
      : this.target.x;
    const targetY = this.target && typeof this.target.size === "number"
      ? this.target.y + this.target.size / 2
      : this.target.y;

    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= this.attackRange) {
      // À portée, attaquer
      this.state = "attacking";
      
      if (this.attackCooldown <= 0) {
        this.target.takeDamage(this.attackPower);
        this.attackCooldown = this.maxAttackCooldown;
        
        // Effet visuel d'attaque
        createParticleExplosion(
          this.target.x, 
          this.target.y, 
          "#ff4444", 
          5
        );
      }
    } else {
      // Trop loin, se rapprocher
      this.targetX = targetX;
      this.targetY = targetY;
      this.moveToTarget(deltaTime);
    }
  }

  findNearestEnemy(allUnits, maxDistance = Infinity, anchorX = this.x, anchorY = this.y) {
    if (!Array.isArray(allUnits)) return null;

    let nearest = null;
    let minDistance = Infinity;

    allUnits.forEach(unit => {
      if (!unit || unit.state === "dead") return;
      if (!this.isFactionHostile(unit.faction)) return;

      if (unit === this) return;
      if (typeof unit.x !== "number" || typeof unit.y !== "number") return;

      const guardDistance = Math.hypot(unit.x - anchorX, unit.y - anchorY);
      if (guardDistance > maxDistance) return;

        const dx = unit.x - this.x;
        const dy = unit.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < minDistance) {
          minDistance = distance;
          nearest = unit;
        }
    });

    return nearest;
  }

  findNearestEnemyBuilding(maxDistance = Infinity, anchorX = this.x, anchorY = this.y) {
    if (typeof buildings === "undefined") return null;

    let nearest = null;
    let minDistance = Infinity;

    buildings.forEach((building) => {
      if (!building || building.state === "destroyed") return;
      if (!this.isFactionHostile(building.faction)) return;

      const cx = building.x + building.size / 2;
      const cy = building.y + building.size / 2;
      if (Math.hypot(cx - anchorX, cy - anchorY) > maxDistance) return;

      const distance = Math.hypot(cx - this.x, cy - this.y);

      if (distance < minDistance) {
        minDistance = distance;
        nearest = building;
      }
    });

    return nearest;
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.state = "dead";
    }
  }

  heal(amount) {
    this.health += amount;
    if (this.health > this.maxHealth) {
      this.health = this.maxHealth;
    }
  }

  moveTo(x, y) {
    this.targetX = x;
    this.targetY = y;
    if (!this.canHarvest) {
      this.clearCombatTarget();
      this.guardX = x;
      this.guardY = y;
      this.pickPatrolPoint();
    } else {
      this.target = null;
    }
    this.state = "moving";
  }

  contains(x, y) {
    const size = 20;
    return (
      x >= this.x - size / 2 &&
      x <= this.x + size / 2 &&
      y >= this.y - size / 2 &&
      y <= this.y + size / 2
    );
  }

  draw(ctx) {
    if (this.state === "dead") return;

    const size = 20;
    
    // Cercle de sélection
    if (this.selected) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, size + 2, 0, Math.PI * 2);
      ctx.strokeStyle = "#ffcc00";
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Cercle de faction
    ctx.beginPath();
    ctx.arc(this.x, this.y, size - 4, 0, Math.PI * 2);
    ctx.fillStyle = getFactionColor(this.faction);
    ctx.fill();
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Icône du type d'unité
    ctx.save();
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff";
    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur = 3;
    ctx.fillText(this.icon, this.x, this.y);
    ctx.restore();

    // Indicateur de transport de ressources
    if (this.canHarvest && this.carrying > 0) {
      ctx.fillStyle = "#ffd700";
      ctx.font = "8px Arial";
      ctx.textAlign = "center";
      ctx.fillText(Math.floor(this.carrying), this.x, this.y + size + 8);
    }

    // Barre de vie
    if (this.health < this.maxHealth) {
      const barWidth = 30;
      const barHeight = 4;
      const barX = this.x - barWidth / 2;
      const barY = this.y - size - 5;

      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(barX, barY, barWidth, barHeight);

      const healthPercent = this.health / this.maxHealth;
      ctx.fillStyle = healthPercent > 0.5 ? "#4caf50" : healthPercent > 0.25 ? "#ff9800" : "#f44336";
      ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

      ctx.strokeStyle = "#000";
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barWidth, barHeight);
    }

    // Ligne d'attaque vers la cible
    if (this.target && this.state === "attacking") {
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.target.x, this.target.y);
      ctx.strokeStyle = "rgba(255, 0, 0, 0.3)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Ligne vers la cible de récolte
    if (this.harvestTarget && this.state === "harvesting") {
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.harvestTarget.x, this.harvestTarget.y);
      ctx.strokeStyle = "rgba(139, 195, 74, 0.3)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}

// Types d'unités disponibles
const UNIT_TYPES = {
  WARRIOR: "warrior",
  ARCHER: "archer",
  PRIEST: "priest",
  CRUSADER: "crusader",
  PEASANT: "peasant"
};

// Coûts de création des unités
const UNIT_COSTS = {
  [UNIT_TYPES.WARRIOR]: { [RESOURCES.GOLD]: 50, [RESOURCES.FOOD]: 20 },
  [UNIT_TYPES.ARCHER]: { [RESOURCES.GOLD]: 40, [RESOURCES.FOOD]: 15 },
  [UNIT_TYPES.PRIEST]: { [RESOURCES.GOLD]: 60, [RESOURCES.FOOD]: 25 },
  [UNIT_TYPES.CRUSADER]: { [RESOURCES.GOLD]: 80, [RESOURCES.FOOD]: 30 },
  [UNIT_TYPES.PEASANT]: { [RESOURCES.GOLD]: 20, [RESOURCES.FOOD]: 10 }
};

// Factory pour créer des unités
function createUnit(x, y, faction, type = UNIT_TYPES.WARRIOR) {
  return new Unit(x, y, faction, type);
}

// Gestionnaire d'unités
const units = [];

function addUnit(x, y, faction, type) {
  const unit = createUnit(x, y, faction, type);
  if (typeof applyFactionBonus === "function") {
    applyFactionBonus(unit);
  }
  units.push(unit);
  return unit;
}

function removeDeadUnits() {
  for (let i = units.length - 1; i >= 0; i--) {
    if (units[i].state === "dead") {
      units.splice(i, 1);
    }
  }
}

function updateAllUnits(deltaTime) {
  units.forEach(unit => unit.update(deltaTime, units));
  removeDeadUnits();
}

function drawAllUnits(ctx) {
  units.forEach(unit => unit.draw(ctx));
}

function getUnitAt(x, y) {
  for (let i = units.length - 1; i >= 0; i--) {
    if (units[i].contains(x, y)) {
      return units[i];
    }
  }
  return null;
}
