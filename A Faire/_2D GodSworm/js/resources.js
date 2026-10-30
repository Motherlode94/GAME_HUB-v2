// resources.js - Système de ressources

const RESOURCES = {
  FAITH: "faith",
  GOLD: "gold",
  FOOD: "food",
  WOOD: "wood"
};

// Stocks de ressources
let resources = {
  [RESOURCES.FAITH]: 100,
  [RESOURCES.GOLD]: 200,
  [RESOURCES.FOOD]: 150,
  [RESOURCES.WOOD]: 100
};

const MAX_RESOURCES = {
  [RESOURCES.FAITH]: 300,
  [RESOURCES.GOLD]: 1000,
  [RESOURCES.FOOD]: 500,
  [RESOURCES.WOOD]: 500
};

// Gestion des ressources
function addResource(type, amount) {
  resources[type] = Math.min(resources[type] + amount, MAX_RESOURCES[type]);
}

function removeResource(type, amount) {
  if (resources[type] >= amount) {
    resources[type] -= amount;
    return true;
  }
  return false;
}

function hasResources(costs) {
  for (let type in costs) {
    if (resources[type] < costs[type]) {
      return false;
    }
  }
  return true;
}

function consumeResources(costs) {
  if (!hasResources(costs)) return false;
  
  for (let type in costs) {
    resources[type] -= costs[type];
  }
  return true;
}

// Ressources naturelles sur la map
class ResourceNode {
  constructor(x, y, type, amount) {
    this.x = x;
    this.y = y;
    this.type = type; // GOLD, FOOD, WOOD
    this.amount = amount;
    this.maxAmount = amount;
    this.regenerationRate = type === RESOURCES.FOOD ? 0.5 : 0.1; // par seconde
  }

  harvest(amount) {
    const harvested = Math.min(amount, this.amount);
    this.amount -= harvested;
    return harvested;
  }

  regenerate(deltaTime) {
    if (this.amount < this.maxAmount) {
      this.amount = Math.min(this.maxAmount, this.amount + this.regenerationRate * (deltaTime / 1000));
    }
  }

  draw(ctx) {
    if (this.amount <= 0) return;

    const size = 25;
    let icon = "💰";
    let color = "#ffd700";

    switch(this.type) {
      case RESOURCES.GOLD:
        icon = "💰";
        color = "#ffd700";
        break;
      case RESOURCES.FOOD:
        icon = "🌾";
        color = "#8bc34a";
        break;
      case RESOURCES.WOOD:
        icon = "🌲";
        color = "#795548";
        break;
    }

    // Background
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.beginPath();
    ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
    ctx.fill();

    // Border
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Icon
    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(icon, this.x, this.y);

    // Amount bar
    const barWidth = size * 2;
    const barHeight = 4;
    const barX = this.x - barWidth / 2;
    const barY = this.y + size + 5;

    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(barX, barY, barWidth, barHeight);

    const percent = this.amount / this.maxAmount;
    ctx.fillStyle = color;
    ctx.fillRect(barX, barY, barWidth * percent, barHeight);
  }

  contains(x, y) {
    const dist = Math.hypot(x - this.x, y - this.y);
    return dist <= 25;
  }
}

const resourceNodes = [];

function spawnResourceNodes() {
  const worldWidth =
    typeof canvas !== "undefined" && canvas ? canvas.width : 960;
  const worldHeight =
    typeof canvas !== "undefined" && canvas ? canvas.height : 540;

  const worldScale = Math.max(1, (worldWidth * worldHeight) / (960 * 540));
  const goldCount = Math.max(6, Math.floor(5 * worldScale));
  const foodCount = Math.max(9, Math.floor(8 * worldScale));
  const woodCount = Math.max(7, Math.floor(6 * worldScale));

  // Spawn des noeuds de ressources aleatoires
  for (let i = 0; i < goldCount; i++) {
    resourceNodes.push(new ResourceNode(
      Math.random() * worldWidth,
      Math.random() * worldHeight,
      RESOURCES.GOLD,
      500
    ));
  }
  
  for (let i = 0; i < foodCount; i++) {
    resourceNodes.push(new ResourceNode(
      Math.random() * worldWidth,
      Math.random() * worldHeight,
      RESOURCES.FOOD,
      300
    ));
  }
  
  for (let i = 0; i < woodCount; i++) {
    resourceNodes.push(new ResourceNode(
      Math.random() * worldWidth,
      Math.random() * worldHeight,
      RESOURCES.WOOD,
      400
    ));
  }
}

function updateResourceNodes(deltaTime) {
  resourceNodes.forEach(node => node.regenerate(deltaTime));
}

function drawResourceNodes(ctx) {
  resourceNodes.forEach(node => node.draw(ctx));
}

function getResourceNodeAt(x, y) {
  for (let i = resourceNodes.length - 1; i >= 0; i--) {
    if (resourceNodes[i].amount > 0.01 && resourceNodes[i].contains(x, y)) {
      return resourceNodes[i];
    }
  }
  return null;
}

