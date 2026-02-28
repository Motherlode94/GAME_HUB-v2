class Territory {
  constructor(x, y, width, height, faction) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.faction = faction;
    this.selected = false;
    this.hovered = false;
    this.population = Math.floor(Math.random() * 45) + 25;
    this.resistance = getFactionProperties(faction).baseResistance || 0;
    this.faithGeneration = 0;
    this.updateFaithGeneration();
  }

  updateFaithGeneration() {
    const props = getFactionProperties(this.faction);
    if (this.faction === FACTIONS.NEUTRAL) {
      this.faithGeneration = 0;
      return;
    }
    const base = Number(props.faithGeneration) || 0;
    this.faithGeneration = this.population * base;
  }

  setFaction(newFaction) {
    this.faction = newFaction;
    this.resistance = getFactionProperties(newFaction).baseResistance || 0;
    this.updateFaithGeneration();
  }

  contains(x, y) {
    return x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height;
  }

  decreaseResistance(amount) {
    this.resistance = Math.max(0, this.resistance - amount);
  }

  growPopulation(deltaTime) {
    if (this.faction === FACTIONS.NEUTRAL) return;
    this.population += 0.35 * (deltaTime / 1000);
    this.updateFaithGeneration();
  }

  draw(ctx) {
    ctx.fillStyle = getFactionColor(this.faction, this.selected);
    ctx.fillRect(this.x, this.y, this.width, this.height);

    if (this.hovered) {
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    ctx.strokeStyle = this.selected ? "#ffcc00" : getFactionBorderColor(this.faction);
    ctx.lineWidth = this.selected ? 3 : 1;
    ctx.strokeRect(this.x, this.y, this.width, this.height);

    if (this.width >= 220 && this.height >= 180) {
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = "#fff";
      ctx.font = "bold 48px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(getFactionIcon(this.faction), this.x + this.width / 2, this.y + this.height / 2);
      ctx.restore();
    }

    if (this.faction !== FACTIONS.NEUTRAL) {
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(this.x + 6, this.y + 6, 96, 24);
      ctx.fillStyle = "#fff";
      ctx.font = "12px Arial";
      ctx.fillText(`${Math.floor(this.population)} pop`, this.x + 10, this.y + 22);

      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(this.x + 106, this.y + 6, 90, 24);
      ctx.fillStyle = "#ffd66b";
      ctx.fillText(`res ${Math.floor(this.resistance)}`, this.x + 110, this.y + 22);
    }
  }
}

class MapDecoration {
  constructor(x, y, type, data = {}) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.data = data;
  }

  draw(ctx) {
    if (this.type === "forest") {
      ctx.fillStyle = "rgba(21, 94, 38, 0.55)";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.data.size || 26, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    if (this.type === "lake") {
      ctx.fillStyle = "rgba(28, 110, 170, 0.45)";
      ctx.beginPath();
      ctx.ellipse(this.x, this.y, this.data.w || 45, this.data.h || 26, 0, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    if (this.type === "road") {
      ctx.strokeStyle = "rgba(100, 100, 100, 0.6)";
      ctx.lineWidth = this.data.w || 18;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.data.x2 || this.x, this.data.y2 || this.y);
      ctx.stroke();
    }
  }
}

const DEFAULT_WORLD_WIDTH = 1920;
const DEFAULT_WORLD_HEIGHT = 1080;
const territories = [];
const mapDecorations = [];

function getMapDimensions() {
  const gameCanvas = document.getElementById("gameCanvas");
  const width = Number(gameCanvas && gameCanvas.width) || DEFAULT_WORLD_WIDTH;
  const height = Number(gameCanvas && gameCanvas.height) || DEFAULT_WORLD_HEIGHT;
  return { width: width, height: height };
}

function getModeTerritoryFactions(mode) {
  if (mode === "team") {
    return [
      FACTIONS.PAGAN, FACTIONS.NEUTRAL, FACTIONS.NORTHMEN, FACTIONS.CRUSADER,
      FACTIONS.PAGAN, FACTIONS.NEUTRAL, FACTIONS.CRUSADER, FACTIONS.NOMAD,
      FACTIONS.NORTHMEN, FACTIONS.NEUTRAL, FACTIONS.NOMAD, FACTIONS.CRUSADER
    ];
  }

  if (mode === "sandbox") {
    return [
      FACTIONS.PAGAN, FACTIONS.NEUTRAL, FACTIONS.NEUTRAL, FACTIONS.CRUSADER,
      FACTIONS.NEUTRAL, FACTIONS.NEUTRAL, FACTIONS.NORTHMEN, FACTIONS.NEUTRAL,
      FACTIONS.NEUTRAL, FACTIONS.NEUTRAL, FACTIONS.NOMAD, FACTIONS.NEUTRAL
    ];
  }

  return [
    FACTIONS.PAGAN, FACTIONS.NEUTRAL, FACTIONS.CRUSADER, FACTIONS.NEUTRAL,
    FACTIONS.NORTHMEN, FACTIONS.NEUTRAL, FACTIONS.NOMAD, FACTIONS.NEUTRAL,
    FACTIONS.PAGAN, FACTIONS.CRUSADER, FACTIONS.NORTHMEN, FACTIONS.NOMAD
  ];
}

function initializeMap(mode = "ffa") {
  const map = getMapDimensions();
  const cols = 4;
  const rows = 3;
  const tileW = Math.floor(map.width / cols);
  const tileH = Math.floor(map.height / rows);
  const factions = getModeTerritoryFactions(mode);

  territories.length = 0;
  mapDecorations.length = 0;

  let idx = 0;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const x = col * tileW;
      const y = row * tileH;
      const w = col === cols - 1 ? map.width - x : tileW;
      const h = row === rows - 1 ? map.height - y : tileH;
      const faction = factions[idx] || FACTIONS.NEUTRAL;
      territories.push(new Territory(x, y, w, h, faction));
      idx += 1;
    }
  }

  for (let i = 0; i < 28; i += 1) {
    mapDecorations.push(new MapDecoration(Math.random() * map.width, Math.random() * map.height, "forest", { size: 18 + Math.random() * 22 }));
  }

  for (let i = 0; i < 10; i += 1) {
    mapDecorations.push(new MapDecoration(Math.random() * map.width, Math.random() * map.height, "lake", { w: 25 + Math.random() * 45, h: 12 + Math.random() * 24 }));
  }

  mapDecorations.push(new MapDecoration(0, map.height * 0.5, "road", { x2: map.width, y2: map.height * 0.5, w: 20 }));
  mapDecorations.push(new MapDecoration(map.width * 0.5, 0, "road", { x2: map.width * 0.5, y2: map.height, w: 16 }));
}

function getTerritoryAt(x, y) {
  for (let i = territories.length - 1; i >= 0; i -= 1) {
    if (territories[i].contains(x, y)) {
      return territories[i];
    }
  }
  return null;
}

function drawMapDecorations(ctx) {
  mapDecorations.forEach((deco) => deco.draw(ctx));
}

initializeMap("ffa");
