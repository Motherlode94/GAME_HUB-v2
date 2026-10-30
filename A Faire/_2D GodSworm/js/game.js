const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// === CONFIGURATION ===
window.CONFIG = window.CONFIG || {
  MAX_FAITH: 300,
  SMITE_COST: 30,
  CONVERT_BASE_COST: 20,
  BLESSING_COST: 50,
  MIRACLE_COST: 100,
  FAITH_CAPTURE_COST: 75
};

// === TEMPS ===
let lastTime = performance.now();
let gameTime = 0;

// === DIEU ===
const currentGod = createGod("WYRD");
let faith = currentGod.faith;

const GAME_MODE = {
  FFA: "ffa",
  TEAM: "team",
  SANDBOX: "sandbox"
};

let currentMode = GAME_MODE.FFA;
let aiControllerStates = {};
let aiGods = {};

// === CURSEUR DIVIN ===
const godCursor = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 8,
  pulseTime: 0
};

// === SÉLECTION ===
let selectedTerritory = null;
let hoveredTerritory = null;
let selectedUnit = null;
let selectedBuilding = null;
let selectedEntities = [];

// === MODE DE CONSTRUCTION ===
let buildMode = null;
let buildPreviewX = 0;
let buildPreviewY = 0;

// === SYSTÈME DE SPAWN ===
const SPAWN_CONFIG = {
  ENEMY_SPAWN_INTERVAL: 15000, // Spawn toutes les 15 secondes (réduit)
  ENEMY_SPAWN_COUNT: 2,
  MAX_ENEMIES: 15
};

let enemySpawnTimer = 0;
let waveNumber = 1;
let bestCatalogScore = 0;
let scoreSyncTimer = 0;
let gameSpeed = 1;
let isPaused = false;
let gameEnded = false;
let autosaveTimer = 0;

const SAVE_KEY = "godsworm_save_v2";
const LOG_LIMIT = 24;

if (!Array.isArray(window.researchedTechs)) {
  window.researchedTechs = [];
}

const GAME_RUNTIME = {
  isPaused: false,
  gameSpeed: 1,
  waveNumber: 1,
  statusLine: "Commandez vos troupes pour convertir les territoires.",
  eventLog: []
};

window.GodSwormRuntime = GAME_RUNTIME;

const INITIAL_RESOURCE_STATE = {
  [RESOURCES.FAITH]: Number(resources[RESOURCES.FAITH]) || 100,
  [RESOURCES.GOLD]: Number(resources[RESOURCES.GOLD]) || 200,
  [RESOURCES.FOOD]: Number(resources[RESOURCES.FOOD]) || 150,
  [RESOURCES.WOOD]: Number(resources[RESOURCES.WOOD]) || 100
};

let INITIAL_TERRITORY_STATE = [];

const MAIN_MENU = {
  root: document.getElementById("mainMenu"),
  mode: document.getElementById("menu-mode"),
  newGame: document.getElementById("menu-new-game"),
  continueGame: document.getElementById("menu-continue"),
  loadGame: document.getElementById("menu-load"),
  resetSave: document.getElementById("menu-reset-save")
};

let hasActiveRun = false;
let isInMainMenu = false;

function hasSavedProgress() {
  return !!localStorage.getItem(SAVE_KEY);
}

function captureInitialTerritoryState() {
  INITIAL_TERRITORY_STATE = territories.map((territory) => ({
    faction: territory.faction,
    population: territory.population,
    resistance: territory.resistance
  }));
}

function getFactionTeam(faction) {
  if (currentMode === GAME_MODE.TEAM) {
    if (faction === FACTIONS.PAGAN || faction === FACTIONS.NORTHMEN) return "alliance";
    if (faction === FACTIONS.CRUSADER || faction === FACTIONS.NOMAD) return "empire";
  }
  if (faction === FACTIONS.NEUTRAL) return "neutral";
  return faction;
}

function areHostileFactions(sourceFaction, targetFaction) {
  if (!sourceFaction || !targetFaction) return false;
  if (sourceFaction === targetFaction) return false;
  if (sourceFaction === FACTIONS.NEUTRAL || targetFaction === FACTIONS.NEUTRAL) return false;
  return getFactionTeam(sourceFaction) !== getFactionTeam(targetFaction);
}

window.areHostileFactions = areHostileFactions;

function areAlliedFactions(sourceFaction, targetFaction) {
  if (!sourceFaction || !targetFaction) return false;
  if (sourceFaction === targetFaction) return true;
  if (sourceFaction === FACTIONS.NEUTRAL || targetFaction === FACTIONS.NEUTRAL) return false;
  if (currentMode === GAME_MODE.TEAM) {
    return getFactionTeam(sourceFaction) === getFactionTeam(targetFaction);
  }
  return false;
}

function getFactionTerritories(faction) {
  return territories.filter((territory) => territory.faction === faction);
}

function getFactionUnits(faction) {
  return units.filter((unit) => unit.faction === faction && unit.state !== "dead");
}

function getFactionBuildings(faction) {
  return buildings.filter((building) => building.faction === faction && building.state === "active");
}

function initializeAiControllers() {
  aiControllerStates = {};
  aiGods = {};

  BOT_FACTIONS.forEach((faction, index) => {
    aiControllerStates[faction] = {
      faith: 120 + index * 15,
      decisionTimer: 0,
      patrolTimer: 0,
      pressureTimer: 0
    };

    const preset = index === 0 ? "THOR" : index === 1 ? "ODIN" : "FREYA";
    aiGods[faction] = createGod(preset);
    aiGods[faction].faith = aiControllerStates[faction].faith;
  });
}

function getFactionFaith(faction) {
  if (faction === PLAYER_FACTION) {
    return Number(resources[RESOURCES.FAITH]) || 0;
  }
  return Number(aiControllerStates[faction] && aiControllerStates[faction].faith) || 0;
}

function setFactionFaith(faction, value) {
  const safeValue = Math.max(0, value);
  if (faction === PLAYER_FACTION) {
    resources[RESOURCES.FAITH] = Math.min(MAX_RESOURCES[RESOURCES.FAITH], safeValue);
    currentGod.faith = resources[RESOURCES.FAITH];
    return;
  }
  if (!aiControllerStates[faction]) return;
  aiControllerStates[faction].faith = Math.min(MAX_RESOURCES[RESOURCES.FAITH], safeValue);
  if (aiGods[faction]) {
    aiGods[faction].faith = aiControllerStates[faction].faith;
  }
}

function spendFactionFaith(faction, amount) {
  const cost = Math.max(0, Number(amount) || 0);
  if (getFactionFaith(faction) < cost) return false;
  setFactionFaith(faction, getFactionFaith(faction) - cost);
  return true;
}

function gainFactionFaith(faction, amount) {
  const gain = Math.max(0, Number(amount) || 0);
  setFactionFaith(faction, getFactionFaith(faction) + gain);
}

function getFaithCaptureCost(territory, attackerFaction) {
  if (!territory) return Number(CONFIG.FAITH_CAPTURE_COST) || 75;
  const base = Number(CONFIG.FAITH_CAPTURE_COST) || 75;
  const resistance = Math.max(0, Number(territory.resistance) || 0);
  const pop = Math.max(0, Number(territory.population) || 0);
  const sameTeam = getFactionTeam(territory.faction) === getFactionTeam(attackerFaction);
  const hostileFactor = sameTeam ? 0.2 : 1;
  const ownerFactor = territory.faction === FACTIONS.NEUTRAL ? 0.8 : 1.15;
  return Math.max(15, Math.floor((base + resistance * 3.2 + pop * 0.35) * hostileFactor * ownerFactor));
}

function getFaithCapturePower(territory, attackerFaction) {
  const basePower = attackerFaction === PLAYER_FACTION ? 18 : 14;
  const ownedTerritories = getFactionTerritories(attackerFaction).length;
  const scaled = basePower + Math.min(16, ownedTerritories * 2);
  return scaled;
}

function attemptFaithCapture(attackerFaction, territory, silent = false) {
  if (!territory) return false;
  if (territory.faction === attackerFaction) return false;
  if (!areHostileFactions(attackerFaction, territory.faction) && territory.faction !== FACTIONS.NEUTRAL) {
    return false;
  }

  const faithCost = getFaithCaptureCost(territory, attackerFaction);
  if (!spendFactionFaith(attackerFaction, faithCost)) {
    if (!silent && attackerFaction === PLAYER_FACTION) {
      pushGameLog(`Foi insuffisante (${faithCost}) pour capturer cette zone.`, "warn");
    }
    return false;
  }

  const pressure = getFaithCapturePower(territory, attackerFaction);
  territory.decreaseResistance(pressure);
  createParticleExplosion(
    territory.x + territory.width / 2,
    territory.y + territory.height / 2,
    getFactionColor(attackerFaction),
    20
  );

  if (territory.resistance <= 0) {
    territory.setFaction(attackerFaction);
    territory.resistance = getFactionProperties(attackerFaction).baseResistance || 0;
    if (attackerFaction === PLAYER_FACTION) {
      currentGod.territoriesConverted += 1;
    }
    if (!silent) {
      pushGameLog(`${getFactionName(attackerFaction)} a capture une zone par la foi.`, "ok");
    }
    return true;
  }

  if (!silent && attackerFaction === PLAYER_FACTION) {
    pushGameLog(`Pression divine appliquee: resistance restante ${Math.ceil(territory.resistance)}.`, "ok");
  }
  return true;
}

function clearEntitySelections() {
  selectedTerritory = null;
  hoveredTerritory = null;
  selectedUnit = null;
  selectedBuilding = null;
  selectedEntities = [];

  territories.forEach((territory) => {
    territory.selected = false;
    territory.hovered = false;
  });

  units.forEach((unit) => {
    unit.selected = false;
  });

  buildings.forEach((building) => {
    building.selected = false;
  });
}

function getSelectedPlayerUnits() {
  const fromEntities = selectedEntities.filter(
    (entity) =>
      entity &&
      entity.faction === PLAYER_FACTION &&
      entity.state !== "dead" &&
      typeof entity.moveTo === "function"
  );

  if (fromEntities.length > 0) return fromEntities;
  if (
    selectedUnit &&
    selectedUnit.faction === PLAYER_FACTION &&
    selectedUnit.state !== "dead"
  ) {
    return [selectedUnit];
  }
  return [];
}

function syncSelectedEntitiesFromUnits(unitsToSync) {
  selectedEntities = Array.isArray(unitsToSync) ? unitsToSync.slice() : [];
  selectedUnit = selectedEntities.length > 0 ? selectedEntities[0] : null;
}

function setSelectedUnits(unitsToSelect) {
  const unique = [];
  const seen = new Set();

  (unitsToSelect || []).forEach((unit) => {
    if (!unit || unit.faction !== PLAYER_FACTION || unit.state === "dead") return;
    if (seen.has(unit)) return;
    seen.add(unit);
    unique.push(unit);
  });

  buildings.forEach((building) => (building.selected = false));
  territories.forEach((territory) => (territory.selected = false));

  units.forEach((unit) => {
    unit.selected = unique.includes(unit);
  });

  selectedBuilding = null;
  selectedTerritory = null;
  syncSelectedEntitiesFromUnits(unique);
}

function toggleUnitInSelection(unit) {
  if (!unit || unit.faction !== PLAYER_FACTION || unit.state === "dead") return;
  const current = getSelectedPlayerUnits();
  const exists = current.includes(unit);
  const next = exists ? current.filter((u) => u !== unit) : current.concat(unit);
  setSelectedUnits(next);
}

function selectUnitsByType(type, sourceUnit = null) {
  if (!type) return;
  const typed = units.filter(
    (unit) =>
      unit.faction === PLAYER_FACTION &&
      unit.state !== "dead" &&
      unit.type === type
  );
  if (typed.length <= 0) return;
  setSelectedUnits(typed);
  const name = sourceUnit ? sourceUnit.type : type;
  pushGameLog(`Selection groupe: ${typed.length} unite(s) type ${name}.`, "ok");
}

function resetTerritoriesToInitialState() {
  if (INITIAL_TERRITORY_STATE.length !== territories.length) {
    captureInitialTerritoryState();
  }

  territories.forEach((territory, index) => {
    const snapshot = INITIAL_TERRITORY_STATE[index];
    if (!snapshot) return;

    territory.faction = snapshot.faction;
    territory.population = snapshot.population;
    territory.resistance = snapshot.resistance;
    territory.selected = false;
    territory.hovered = false;
    territory.updateFaithGeneration();
  });
}

function resetResourceState() {
  resources[RESOURCES.FAITH] = INITIAL_RESOURCE_STATE[RESOURCES.FAITH];
  resources[RESOURCES.GOLD] = INITIAL_RESOURCE_STATE[RESOURCES.GOLD];
  resources[RESOURCES.FOOD] = INITIAL_RESOURCE_STATE[RESOURCES.FOOD];
  resources[RESOURCES.WOOD] = INITIAL_RESOURCE_STATE[RESOURCES.WOOD];
}

function resetGodState() {
  const freshGod = createGod("WYRD");
  Object.assign(currentGod, freshGod);
  faith = currentGod.faith;
}

function refreshMainMenuButtons() {
  const hasSave = hasSavedProgress();

  if (MAIN_MENU.loadGame) MAIN_MENU.loadGame.disabled = !hasSave;
  if (MAIN_MENU.resetSave) MAIN_MENU.resetSave.disabled = !hasSave;
  if (MAIN_MENU.continueGame) {
    MAIN_MENU.continueGame.disabled = !hasActiveRun && !hasSave;
  }
}

function setMainMenuVisible(visible, message = "") {
  isInMainMenu = !!visible;
  isPaused = isInMainMenu ? true : isPaused;
  syncRuntimeState();

  if (MAIN_MENU.root) {
    MAIN_MENU.root.classList.toggle("hidden", !isInMainMenu);
    MAIN_MENU.root.setAttribute("aria-hidden", isInMainMenu ? "false" : "true");
  }

  if (isInMainMenu) {
    buildMode = null;
    clearDivineCastMode();
    closeBuildMenu();
    clearEntitySelections();
    if (MAIN_MENU.mode) {
      MAIN_MENU.mode.value = currentMode;
    }
    refreshMainMenuButtons();
  }

  if (message) {
    pushGameLog(message);
  }
}

function resetWorldState(clearSavedProgress = false, modeOverride = null) {
  if (clearSavedProgress) {
    localStorage.removeItem(SAVE_KEY);
  }

  if (modeOverride && Object.values(GAME_MODE).includes(modeOverride)) {
    currentMode = modeOverride;
  }

  if (typeof initializeMap === "function") {
    initializeMap(currentMode);
  }
  captureInitialTerritoryState();
  initializeAiControllers();

  clearDivineCastMode();
  closeBuildMenu();
  clearEntitySelections();
  cancelAllRituals();

  units.length = 0;
  buildings.length = 0;
  resourceNodes.length = 0;
  particles.length = 0;

  resetTerritoriesToInitialState();
  resetResourceState();
  resetGodState();

  spawnResourceNodes();
  spawnInitialUnits();

  enemySpawnTimer = 0;
  waveNumber = 1;
  bestCatalogScore = 0;
  scoreSyncTimer = 0;
  autosaveTimer = 0;
  aiTimer = 0;
  gameSpeed = 1;
  isPaused = true;
  gameEnded = false;
  hasActiveRun = true;
  gameTime = 0;
  lastTime = performance.now();

  GAME_RUNTIME.eventLog.length = 0;
  GAME_RUNTIME.statusLine = "Commandez vos troupes pour convertir les territoires.";

  window.gameState = window.gameState || {};
  window.gameState.score = 0;

  const scoreElement = document.getElementById("scoreValue");
  if (scoreElement) scoreElement.textContent = "0";

  syncRuntimeState();
  updateResourcesUI();
  updateUI(currentGod, resources[RESOURCES.FAITH], MAX_RESOURCES[RESOURCES.FAITH], gameTime, selectedTerritory);
  refreshMainMenuButtons();
}

function bindMainMenuControls() {
  if (MAIN_MENU.mode) {
    MAIN_MENU.mode.value = currentMode;
    MAIN_MENU.mode.addEventListener("change", () => {
      const next = MAIN_MENU.mode.value;
      if (Object.values(GAME_MODE).includes(next)) {
        currentMode = next;
      }
    });
  }

  if (MAIN_MENU.newGame) {
    MAIN_MENU.newGame.addEventListener("click", () => {
      if (!window.confirm("Demarrer une nouvelle partie ?")) return;
      const selectedMode = MAIN_MENU.mode ? MAIN_MENU.mode.value : GAME_MODE.FFA;
      resetWorldState(false, selectedMode);
      isPaused = false;
      setMainMenuVisible(false, `Nouvelle partie lancee (${selectedMode}).`);
    });
  }

  if (MAIN_MENU.continueGame) {
    MAIN_MENU.continueGame.addEventListener("click", () => {
      if (!hasActiveRun && hasSavedProgress()) {
        if (!loadProgress(true)) return;
      }
      if (!hasActiveRun) return;
      isPaused = false;
      setMainMenuVisible(false, "Partie reprise.");
    });
  }

  if (MAIN_MENU.loadGame) {
    MAIN_MENU.loadGame.addEventListener("click", () => {
      const loaded = loadProgress(true);
      if (!loaded) {
        pushGameLog("Aucune sauvegarde detectee.", "warn");
        return;
      }
      isPaused = false;
      setMainMenuVisible(false, "Sauvegarde chargee.");
    });
  }

  if (MAIN_MENU.resetSave) {
    MAIN_MENU.resetSave.addEventListener("click", () => {
      if (!window.confirm("Supprimer uniquement la sauvegarde locale ?")) return;
      localStorage.removeItem(SAVE_KEY);
      refreshMainMenuButtons();
      pushGameLog("Sauvegarde supprimee.");
    });
  }
}

function pushGameLog(text, type = "") {
  const message = String(text || "").trim();
  if (!message) return;

  GAME_RUNTIME.statusLine = message;
  GAME_RUNTIME.eventLog.unshift({ text: message, type: type });
  if (GAME_RUNTIME.eventLog.length > LOG_LIMIT) {
    GAME_RUNTIME.eventLog.length = LOG_LIMIT;
  }
}

function syncRuntimeState() {
  GAME_RUNTIME.isPaused = isPaused;
  GAME_RUNTIME.gameSpeed = gameSpeed;
  GAME_RUNTIME.waveNumber = waveNumber;
  GAME_RUNTIME.mode = currentMode;
}

const DIVINE_POWER = {
  SMITE: "smite",
  BLESS: "bless",
  MIRACLE: "miracle"
};

let divineCastMode = null;

function refreshDivineButtons() {
  const mapping = [
    { id: "power-smite", mode: DIVINE_POWER.SMITE },
    { id: "power-bless", mode: DIVINE_POWER.BLESS },
    { id: "power-miracle", mode: DIVINE_POWER.MIRACLE }
  ];

  mapping.forEach((item) => {
    const button = document.getElementById(item.id);
    if (!button) return;
    if (divineCastMode === item.mode) {
      button.classList.add("active");
    } else {
      button.classList.remove("active");
    }
  });
}

function clearDivineCastMode() {
  divineCastMode = null;
  refreshDivineButtons();
}

function setDivineCastMode(mode) {
  if (divineCastMode === mode) {
    clearDivineCastMode();
    pushGameLog("Pouvoir divin annule.");
    return;
  }

  divineCastMode = mode;
  refreshDivineButtons();
  if (mode === DIVINE_POWER.SMITE) {
    pushGameLog("Mode Smite actif: clique la zone cible.");
  } else if (mode === DIVINE_POWER.BLESS) {
    pushGameLog("Mode Bless actif: clique les allies.");
  } else if (mode === DIVINE_POWER.MIRACLE) {
    pushGameLog("Mode Miracle actif: clique un territoire.");
  }
}

function distanceToPoint(entity, x, y) {
  if (!entity) return Number.POSITIVE_INFINITY;
  const ex = typeof entity.size === "number" ? entity.x + entity.size / 2 : entity.x;
  const ey = typeof entity.size === "number" ? entity.y + entity.size / 2 : entity.y;
  return Math.hypot(ex - x, ey - y);
}

function applyTimedBuff(unit, attackBonus, speedBonus, durationMs) {
  if (!unit || unit.state === "dead") return;
  unit.attackPower += attackBonus;
  unit.speed += speedBonus;
  window.setTimeout(() => {
    if (!unit || unit.state === "dead") return;
    unit.attackPower = Math.max(1, unit.attackPower - attackBonus);
    unit.speed = Math.max(0.5, unit.speed - speedBonus);
  }, durationMs);
}

function castSmiteForFaction(casterFaction, god, x, y, silent = false) {
  const cost = Number(CONFIG.SMITE_COST) || 30;
  if (!god || !god.canSmite()) {
    if (!silent && casterFaction === PLAYER_FACTION) {
      pushGameLog(`Smite en recharge (${god ? god.getSmiteCooldownSeconds() : 0}s).`, "warn");
    }
    return false;
  }
  if (!spendFactionFaith(casterFaction, cost)) {
    if (!silent && casterFaction === PLAYER_FACTION) pushGameLog("Foi insuffisante pour Smite.", "warn");
    return false;
  }

  god.useSmite();
  const radius = 105;
  let hits = 0;

  units.forEach((unit) => {
    if (!unit || unit.state === "dead") return;
    if (!areHostileFactions(casterFaction, unit.faction)) return;
    if (distanceToPoint(unit, x, y) <= radius) {
      unit.takeDamage(85);
      hits += 1;
      createParticleExplosion(unit.x, unit.y, "#ff8a00", 12);
    }
  });

  buildings.forEach((building) => {
    if (!building || building.state === "destroyed") return;
    if (!areHostileFactions(casterFaction, building.faction)) return;
    if (distanceToPoint(building, x, y) <= radius) {
      building.takeDamage(120);
      hits += 1;
      createParticleExplosion(building.x + building.size / 2, building.y + building.size / 2, "#ff8a00", 16);
    }
  });

  createParticleExplosion(x, y, "#ffae42", 30);
  if (!silent && casterFaction === PLAYER_FACTION) {
    pushGameLog(`Smite lance: ${hits} cibles touchees.`, hits > 0 ? "ok" : "");
  }
  return true;
}

function castBlessForFaction(casterFaction, god, x, y, silent = false) {
  const cost = Number(CONFIG.BLESSING_COST) || 50;
  if (!god || !god.canBless()) {
    if (!silent && casterFaction === PLAYER_FACTION) {
      pushGameLog(`Bless en recharge (${god ? god.getBlessCooldownSeconds() : 0}s).`, "warn");
    }
    return false;
  }
  if (!spendFactionFaith(casterFaction, cost)) {
    if (!silent && casterFaction === PLAYER_FACTION) pushGameLog("Foi insuffisante pour Bless.", "warn");
    return false;
  }

  god.useBless();
  const radius = 130;
  let buffed = 0;

  units.forEach((unit) => {
    if (!unit || unit.state === "dead") return;
    if (!areAlliedFactions(casterFaction, unit.faction)) return;
    if (distanceToPoint(unit, x, y) <= radius) {
      unit.heal(unit.maxHealth * 0.45);
      applyTimedBuff(unit, 4, 0.25, 9000);
      buffed += 1;
      createParticleExplosion(unit.x, unit.y, "#64ff9a", 8);
    }
  });

  createParticleExplosion(x, y, "#7dffbf", 22);
  if (!silent && casterFaction === PLAYER_FACTION) {
    pushGameLog(`Bless lance: ${buffed} allies renforces.`, buffed > 0 ? "ok" : "");
  }
  return true;
}

function castMiracleForFaction(casterFaction, god, x, y, silent = false) {
  const cost = Number(CONFIG.MIRACLE_COST) || 100;
  if (!god || !god.canMiracle()) {
    if (!silent && casterFaction === PLAYER_FACTION) {
      pushGameLog(`Miracle en recharge (${god ? god.getMiracleCooldownSeconds() : 0}s).`, "warn");
    }
    return false;
  }
  if (!spendFactionFaith(casterFaction, cost)) {
    if (!silent && casterFaction === PLAYER_FACTION) pushGameLog("Foi insuffisante pour Miracle.", "warn");
    return false;
  }

  god.useMiracle();

  const territory = getTerritoryAt(x, y);
  if (territory) {
    attemptFaithCapture(casterFaction, territory, true);
  }

  units.forEach((unit) => {
    if (!unit || unit.state === "dead") return;
    if (areAlliedFactions(casterFaction, unit.faction)) {
      if (distanceToPoint(unit, x, y) <= 140) unit.heal(unit.maxHealth);
      return;
    }
    if (areHostileFactions(casterFaction, unit.faction) && distanceToPoint(unit, x, y) <= 140) {
      unit.takeDamage(130);
    }
  });

  addUnit(x - 18, y + 14, casterFaction, UNIT_TYPES.WARRIOR);
  addUnit(x + 18, y - 14, casterFaction, UNIT_TYPES.WARRIOR);
  createParticleExplosion(x, y, "#c68cff", 36);

  if (!silent && casterFaction === PLAYER_FACTION) {
    pushGameLog("Miracle actif: impulsion divine et renforts.", "ok");
  }
  return true;
}

function castSmiteAt(x, y) {
  return castSmiteForFaction(PLAYER_FACTION, currentGod, x, y, false);
}

function castBlessAt(x, y) {
  return castBlessForFaction(PLAYER_FACTION, currentGod, x, y, false);
}

function castMiracleAt(x, y) {
  return castMiracleForFaction(PLAYER_FACTION, currentGod, x, y, false);
}

function castDivinePowerAt(x, y) {
  if (!divineCastMode) return false;

  let used = false;
  if (divineCastMode === DIVINE_POWER.SMITE) used = castSmiteAt(x, y);
  if (divineCastMode === DIVINE_POWER.BLESS) used = castBlessAt(x, y);
  if (divineCastMode === DIVINE_POWER.MIRACLE) used = castMiracleAt(x, y);

  if (used) {
    clearDivineCastMode();
  }

  return used;
}

function triggerPlayerFaithCapture() {
  if (!selectedTerritory) {
    pushGameLog("Selectionne un territoire pour lancer une capture de foi.", "warn");
    return false;
  }
  return attemptFaithCapture(PLAYER_FACTION, selectedTerritory, false);
}

function computeCatalogScore() {
  const playerTerritories = territories.filter(t => t.faction === PLAYER_FACTION).length;
  const aliveUnits = units.filter(u => u.faction === PLAYER_FACTION && u.state !== "dead").length;
  const aliveBuildings = buildings.filter(b => b.faction === PLAYER_FACTION && b.state === "active").length;

  const gold = Math.floor(resources[RESOURCES.GOLD] || 0);
  const food = Math.floor(resources[RESOURCES.FOOD] || 0);
  const wood = Math.floor(resources[RESOURCES.WOOD] || 0);
  const faith = Math.floor(resources[RESOURCES.FAITH] || 0);

  const resourceScore = gold + (food * 2) + (wood * 2) + (faith * 3);
  const controlScore = (playerTerritories * 700) + (aliveUnits * 80) + (aliveBuildings * 150);
  const waveScore = Math.max(0, waveNumber - 1) * 300;
  const timeScore = Math.floor(gameTime / 8);

  return Math.max(0, resourceScore + controlScore + waveScore + timeScore);
}

function syncCatalogScore(forceSubmit = false) {
  const computed = computeCatalogScore();
  if (computed > bestCatalogScore) {
    bestCatalogScore = computed;
  }

  const scoreElement = document.getElementById("scoreValue");
  if (scoreElement) {
    scoreElement.textContent = String(bestCatalogScore);
  }

  window.gameState = window.gameState || {};
  window.gameState.score = bestCatalogScore;

  if (window.CatalogScore && typeof window.CatalogScore.capture === "function") {
    window.CatalogScore.capture();
    if (forceSubmit && typeof window.CatalogScore.submit === "function") {
      window.CatalogScore.submit(bestCatalogScore);
    }
  }
}

let aiTimer = 0;
const AI_ACTION_INTERVAL = 4200;

function getTerritoryCenter(territory) {
  return {
    x: territory.x + territory.width / 2,
    y: territory.y + territory.height / 2
  };
}

function getFactionMapCenter(faction) {
  const owned = getFactionTerritories(faction);
  if (owned.length <= 0) return { x: canvas.width / 2, y: canvas.height / 2 };

  let sx = 0;
  let sy = 0;
  owned.forEach((territory) => {
    sx += territory.x + territory.width / 2;
    sy += territory.y + territory.height / 2;
  });

  return { x: sx / owned.length, y: sy / owned.length };
}

function pickPressureTarget(faction) {
  const center = getFactionMapCenter(faction);
  const candidates = territories.filter((territory) => {
    if (territory.faction === faction) return false;
    if (currentMode === GAME_MODE.SANDBOX) {
      return territory.faction === FACTIONS.NEUTRAL;
    }
    if (territory.faction !== FACTIONS.NEUTRAL && !areHostileFactions(faction, territory.faction)) {
      return false;
    }
    return true;
  });

  if (candidates.length === 0) return null;

  let bestTarget = candidates[0];
  let bestScore = Number.POSITIVE_INFINITY;
  candidates.forEach((territory) => {
    const dist = Math.hypot(
      center.x - (territory.x + territory.width / 2),
      center.y - (territory.y + territory.height / 2)
    );
    const score = dist + (territory.resistance || 0) * 9;
    if (score < bestScore) {
      bestScore = score;
      bestTarget = territory;
    }
  });
  return bestTarget;
}

function commandFactionPatrol(faction) {
  const owned = getFactionTerritories(faction);
  if (owned.length === 0) return;

  const soldiers = getFactionUnits(faction).filter((unit) => !unit.canHarvest);
  soldiers.forEach((unit, index) => {
    const territory = owned[index % owned.length];
    const px = territory.x + 30 + Math.random() * Math.max(20, territory.width - 60);
    const py = territory.y + 30 + Math.random() * Math.max(20, territory.height - 60);
    unit.moveTo(px, py);
  });
}

function runFactionDivineAI(faction) {
  if (currentMode === GAME_MODE.SANDBOX) return;

  const god = aiGods[faction];
  if (!god) return;

  const enemies = units.filter((unit) => unit.state !== "dead" && areHostileFactions(faction, unit.faction));
  const allies = units.filter((unit) => unit.state !== "dead" && areAlliedFactions(faction, unit.faction));
  const targetTerritory = pickPressureTarget(faction);
  const faith = getFactionFaith(faction);

  if (faith >= (Number(CONFIG.MIRACLE_COST) || 100) + 40 && targetTerritory && Math.random() < 0.18) {
    const c = getTerritoryCenter(targetTerritory);
    castMiracleForFaction(faction, god, c.x, c.y, true);
    return;
  }

  if (faith >= (Number(CONFIG.SMITE_COST) || 30) + 30 && enemies.length > 0 && Math.random() < 0.3) {
    const target = enemies[Math.floor(Math.random() * enemies.length)];
    castSmiteForFaction(faction, god, target.x, target.y, true);
    return;
  }

  if (faith >= (Number(CONFIG.BLESSING_COST) || 50) + 20 && allies.length > 0 && Math.random() < 0.25) {
    const target = allies[Math.floor(Math.random() * allies.length)];
    castBlessForFaction(faction, god, target.x, target.y, true);
  }
}

function runFactionAI(faction, deltaTime) {
  const state = aiControllerStates[faction];
  if (!state) return;

  state.decisionTimer += deltaTime;
  state.patrolTimer += deltaTime;
  state.pressureTimer += deltaTime;

  if (state.patrolTimer >= 3200) {
    state.patrolTimer = 0;
    commandFactionPatrol(faction);
  }

  if (state.decisionTimer < AI_ACTION_INTERVAL) return;
  state.decisionTimer = 0;

  const owned = getFactionTerritories(faction);
  if (owned.length <= 0) return;

  const factionBuildings = getFactionBuildings(faction);
  if (factionBuildings.length < 5) {
    const home = owned[Math.floor(Math.random() * owned.length)];
    addBuilding(
      home.x + 30 + Math.random() * Math.max(20, home.width - 90),
      home.y + 30 + Math.random() * Math.max(20, home.height - 90),
      faction,
      Math.random() < 0.55 ? BUILDING_TYPES.BARRACKS : BUILDING_TYPES.SHRINE
    );
  }

  factionBuildings.forEach((building) => {
    if (!building.canProduce) return;
    if (building.productionQueue.length >= 2) return;
    const types = building.produceTypes || [];
    if (types.length === 0) return;
    const next = types[Math.floor(Math.random() * types.length)];
    building.produceUnit(next);
  });

  const targetTerritory = pickPressureTarget(faction);
  if (targetTerritory && state.pressureTimer >= 7000) {
    state.pressureTimer = 0;
    attemptFaithCapture(faction, targetTerritory, true);

    const center = getTerritoryCenter(targetTerritory);
    const assaultGroup = getFactionUnits(faction).filter((unit) => !unit.canHarvest).slice(0, 4);
    assaultGroup.forEach((unit) => unit.moveTo(center.x + (Math.random() * 50 - 25), center.y + (Math.random() * 50 - 25)));
  }

  runFactionDivineAI(faction);
}

function updateEnemyAI(deltaTime) {
  aiTimer += deltaTime;
  BOT_FACTIONS.forEach((faction) => runFactionAI(faction, deltaTime));
}

// === SPAWN INITIAL ===
function spawnInitialUnits() {
  const startingFactions = [PLAYER_FACTION, ...BOT_FACTIONS];

  startingFactions.forEach((faction) => {
    const factionTerritories = getFactionTerritories(faction);
    if (factionTerritories.length <= 0) return;

    const startTerritory = factionTerritories[0];
    const baseX = startTerritory.x + 50;
    const baseY = startTerritory.y + 50;
    addBuilding(baseX, baseY, faction, BUILDING_TYPES.TOWN_HALL);
    addBuilding(baseX + 90, baseY + 40, faction, BUILDING_TYPES.BARRACKS);

    if (faction === PLAYER_FACTION) {
      for (let i = 0; i < 4; i++) {
        addUnit(startTerritory.x + 150 + (i * 35), startTerritory.y + 100, faction, UNIT_TYPES.PEASANT);
      }
      addUnit(startTerritory.x + 130, startTerritory.y + 170, faction, UNIT_TYPES.WARRIOR);
      addUnit(startTerritory.x + 180, startTerritory.y + 185, faction, UNIT_TYPES.ARCHER);
    } else {
      addUnit(startTerritory.x + 140, startTerritory.y + 95, faction, UNIT_TYPES.WARRIOR);
      addUnit(startTerritory.x + 175, startTerritory.y + 120, faction, UNIT_TYPES.WARRIOR);
      addUnit(startTerritory.x + 205, startTerritory.y + 150, faction, UNIT_TYPES.ARCHER);
    }
  });
}

// === PARTICULES ===
const particles = [];

class Particle {
  constructor(x, y, color, velocityX, velocityY) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.velocityX = velocityX;
    this.velocityY = velocityY;
    this.life = 1.0;
    this.decay = 0.02;
    this.size = Math.random() * 3 + 2;
  }

  update() {
    this.x += this.velocityX;
    this.y += this.velocityY;
    this.life -= this.decay;
    this.velocityY += 0.1;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.life;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  isDead() {
    return this.life <= 0;
  }
}

function createParticleExplosion(x, y, color, count = 15) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    const speed = Math.random() * 3 + 2;
    particles.push(
      new Particle(
        x,
        y,
        color,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed
      )
    );
  }
}

// === EVENT LISTENERS ===

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  godCursor.x = e.clientX - rect.left;
  godCursor.y = e.clientY - rect.top;

  buildPreviewX = godCursor.x;
  buildPreviewY = godCursor.y;

  hoveredTerritory = null;
  territories.forEach(t => {
    t.hovered = false;
    if (t.contains(godCursor.x, godCursor.y)) {
      t.hovered = true;
      hoveredTerritory = t;
    }
  });
});

// CLIC GAUCHE - Sélection
canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  const isShift = !!e.shiftKey;
  const isCtrlLike = !!(e.ctrlKey || e.metaKey);

  if (isInMainMenu) return;

  if (divineCastMode) {
    const casted = castDivinePowerAt(mouseX, mouseY);
    if (casted) {
      return;
    }
  }

  // Mode construction
  if (buildMode) {
    const cost = BUILDING_COSTS[buildMode];
    if (cost) {
      const resourceCost = {};
      if (cost.gold) resourceCost[RESOURCES.GOLD] = cost.gold;
      if (cost.wood) resourceCost[RESOURCES.WOOD] = cost.wood;
      if (cost.food) resourceCost[RESOURCES.FOOD] = cost.food;
      
      if (hasResources(resourceCost)) {
        if (consumeResources(resourceCost)) {
          addBuilding(mouseX - 20, mouseY - 20, PLAYER_FACTION, buildMode);
          createParticleExplosion(mouseX, mouseY, "#64b5f6", 15);
          pushGameLog(`Construction: ${buildMode}.`, "ok");
        } else {
          pushGameLog("Ressources insuffisantes.", "warn");
        }
      } else {
        pushGameLog("Construction impossible: cout trop eleve.", "warn");
      }
    }
    buildMode = null;
    return;
  }

  // Sélection de bâtiment
  const clickedBuilding = getBuildingAt(mouseX, mouseY);
  if (clickedBuilding) {
    buildings.forEach(b => b.selected = false);
    setSelectedUnits([]);
    territories.forEach(t => t.selected = false);

    clickedBuilding.selected = true;
    selectedBuilding = clickedBuilding;
    selectedUnit = null;
    selectedTerritory = null;
    pushGameLog(`Batiment selectionne: ${clickedBuilding.type}.`);
    return;
  }

  // Sélection d'unité
  const clickedUnit = getUnitAt(mouseX, mouseY);
  if (clickedUnit) {
    if (clickedUnit.faction !== PLAYER_FACTION) {
      buildings.forEach(b => b.selected = false);
      units.forEach(u => u.selected = false);
      territories.forEach(t => t.selected = false);
      selectedEntities = [];
      clickedUnit.selected = true;
      selectedUnit = clickedUnit;
      selectedBuilding = null;
      selectedTerritory = null;
      pushGameLog(`Unite observee: ${clickedUnit.type}.`);
      return;
    }

    if (isCtrlLike) {
      selectUnitsByType(clickedUnit.type, clickedUnit);
      return;
    }

    if (isShift) {
      toggleUnitInSelection(clickedUnit);
      const count = getSelectedPlayerUnits().length;
      if (count > 0) {
        pushGameLog(`Selection multiple: ${count} unite(s).`);
      } else {
        pushGameLog("Selection vide.");
      }
      return;
    }

    setSelectedUnits([clickedUnit]);
    pushGameLog(`Unite selectionnee: ${clickedUnit.type}.`);
    return;
  }

  // Sélection de territoire
  const clickedTerritory = getTerritoryAt(mouseX, mouseY);
  if (clickedTerritory) {
    buildings.forEach(b => b.selected = false);
    setSelectedUnits([]);
    territories.forEach(t => t.selected = false);

    clickedTerritory.selected = true;
    selectedTerritory = clickedTerritory;
    selectedUnit = null;
    selectedBuilding = null;
    return;
  }
});

// CLIC DROIT - Actions
canvas.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  if (isInMainMenu) return;

  const commandUnits = getSelectedPlayerUnits();
  if (commandUnits.length > 0) {
    const primaryUnit = commandUnits[0];

    // Vérifier si on clique sur une ressource
    const clickedResource = getResourceNodeAt(mouseX, mouseY);
    if (clickedResource) {
      const workers = commandUnits.filter((unit) => unit.canHarvest);
      if (workers.length <= 0) {
        pushGameLog("Aucun paysan selectionne pour recolter.", "warn");
        return;
      }

      if ((Number(clickedResource.amount) || 0) <= 0.01) {
        workers.forEach((unit) => {
          unit.harvestTarget = null;
          unit.dropoffBuilding = null;
          if (typeof unit.assignNearestResourceNode === "function") {
            unit.assignNearestResourceNode();
          }
        });
        pushGameLog("Noeud epuise, affectation automatique vers une ressource utile.");
        return;
      }

      workers.forEach((unit) => {
        unit.harvestTarget = clickedResource;
        unit.dropoffBuilding = null;
        unit.target = null;
      });
      pushGameLog(`Ordre groupe: recolte ${clickedResource.type} (${workers.length} paysan(s)).`);
      createParticleExplosion(clickedResource.x, clickedResource.y, "#8bc34a", 5);
      return;
    }

    // Vérifier si on clique sur un ennemi pour attaquer
    const clickedEnemy = getUnitAt(mouseX, mouseY);
    if (
      clickedEnemy &&
      areHostileFactions(primaryUnit.faction, clickedEnemy.faction)
    ) {
      const attackers = commandUnits.filter((unit) => !unit.canHarvest);
      attackers.forEach((unit) => {
        if (typeof unit.setManualAttackTarget === "function") {
          unit.setManualAttackTarget(clickedEnemy);
        } else {
          unit.target = clickedEnemy;
        }
        unit.harvestTarget = null;
      });
      if (attackers.length > 0) {
        pushGameLog(`Ordre groupe: attaque cible ennemie (${attackers.length} unite(s)).`);
      } else {
        pushGameLog("Aucune unite militaire selectionnee pour attaquer.", "warn");
      }
      return;
    }

    // Sinon, déplacement en formation simple
    const cols = Math.max(1, Math.ceil(Math.sqrt(commandUnits.length)));
    const spacing = 24;
    commandUnits.forEach((unit, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const ox = (col - (cols - 1) / 2) * spacing;
      const oy = (row - (cols - 1) / 2) * spacing;
      unit.moveTo(mouseX + ox, mouseY + oy);
      unit.target = null;
      unit.harvestTarget = null;
    });
    pushGameLog(`Ordre groupe: deplacement (${commandUnits.length} unite(s)).`);
    createParticleExplosion(mouseX, mouseY, "#64b5f6", 8);
  }
});

document.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();

  if (key === "m") {
    setMainMenuVisible(true, "Menu principal ouvert.");
    return;
  }

  if (isInMainMenu) {
    if (key === "enter" && hasActiveRun) {
      isPaused = false;
      setMainMenuVisible(false, "Partie reprise.");
    }
    return;
  }

  if (key === "t") {
    const reference = selectedUnit && selectedUnit.faction === PLAYER_FACTION
      ? selectedUnit
      : getSelectedPlayerUnits()[0];
    if (reference) {
      selectUnitsByType(reference.type, reference);
    } else {
      pushGameLog("Selectionne d'abord une unite de reference.", "warn");
    }
    return;
  }

  // ESC - Annuler
  if (key === "escape") {
    buildMode = null;
    clearDivineCastMode();
    selectedUnit = null;
    selectedBuilding = null;
    selectedTerritory = null;
    selectedEntities = [];
    units.forEach(u => u.selected = false);
    buildings.forEach(b => b.selected = false);
    territories.forEach(t => t.selected = false);
    document.getElementById('buildingMenu').style.display = 'none';
    cancelAllRituals();
    return;
  }

  // R - Menu des rituels
  if (key === "r") {
    pushGameLog("Menu des rituels non disponible dans cette version.", "warn");
    // TODO: Ouvrir menu des rituels
    return;
  }

  if (key === "z") {
    setDivineCastMode(DIVINE_POWER.SMITE);
    return;
  }

  if (key === "x") {
    setDivineCastMode(DIVINE_POWER.BLESS);
    return;
  }

  if (key === "c") {
    setDivineCastMode(DIVINE_POWER.MIRACLE);
    return;
  }

  if (key === "f") {
    triggerPlayerFaithCapture();
    return;
  }

  // H - Invoquer un héros
  if (key === "h") {
    const heroClass = HERO_CLASSES.PALADIN;
    const cost = HERO_COSTS[heroClass];
    
    if (resources[RESOURCES.FAITH] >= cost) {
      resources[RESOURCES.FAITH] -= cost;
      const paganTerritories = territories.filter(t => t.faction === PLAYER_FACTION);
      if (paganTerritories.length > 0) {
        const spawnTerritory = paganTerritories[0];
        const spawnX = spawnTerritory.x + spawnTerritory.width / 2;
        const spawnY = spawnTerritory.y + spawnTerritory.height / 2;
        
        addHero(spawnX, spawnY, PLAYER_FACTION, heroClass);
        createParticleExplosion(spawnX, spawnY, "#ffd700", 40);
        pushGameLog("Hero invoque.", "ok");
      }
    } else {
      pushGameLog("Foi insuffisante pour invoquer un hero.", "warn");
    }
    return;
  }

  // 1-4 - Capacités du héros sélectionné
  if (["1", "2", "3", "4"].includes(key)) {
    if (selectedUnit && selectedUnit.isHero) {
      const abilityIndex = parseInt(key) - 1;
      selectedUnit.useAbility(abilityIndex, selectedUnit.target);
    }
    return;
  }

  // B - Menu de construction
  if (key === "b") {
    const menu = document.getElementById('buildingMenu');
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    return;
  }

  if (key === " ") {
    e.preventDefault();
    togglePause();
    return;
  }

  if (key === "1" || key === "2" || key === "3") {
    setGameSpeed(key);
    return;
  }

  // V - Recruter paysan depuis Town Hall
  if (key === "v") {
    if (selectedBuilding && selectedBuilding.type === BUILDING_TYPES.TOWN_HALL) {
      const cost = UNIT_COSTS[UNIT_TYPES.PEASANT];
      const resourceCost = {};
      if (cost.gold) resourceCost[RESOURCES.GOLD] = cost.gold;
      if (cost.food) resourceCost[RESOURCES.FOOD] = cost.food;
      
      if (hasResources(resourceCost)) {
        if (consumeResources(resourceCost)) {
          selectedBuilding.produceUnit(UNIT_TYPES.PEASANT);
          pushGameLog("Recrutement paysan lance.");
        }
      } else {
        pushGameLog("Ressources insuffisantes pour paysan.", "warn");
      }
    }
    return;
  }

  // Q - Entraîner unité
  if (key === "q") {
    if (selectedBuilding && selectedBuilding.canProduce) {
      const unitType = selectedBuilding.produceTypes[0];
      const cost = UNIT_COSTS[unitType];
      
      const resourceCost = {};
      if (cost.gold) resourceCost[RESOURCES.GOLD] = cost.gold;
      if (cost.food) resourceCost[RESOURCES.FOOD] = cost.food;
      
      if (hasResources(resourceCost)) {
        if (consumeResources(resourceCost)) {
          selectedBuilding.produceUnit(unitType);
          pushGameLog(`Entrainement ${unitType} en cours.`);
        }
      } else {
        pushGameLog(`Ressources insuffisantes pour ${unitType}.`, "warn");
      }
    }
  }
});

// Gestion du menu de construction
document.querySelectorAll('.buildButton').forEach(button => {
  button.addEventListener('click', () => {
    const buildingType = button.dataset.building;
    buildMode = buildingType;
    document.getElementById('buildingMenu').style.display = 'none';
    pushGameLog(`Mode construction: ${buildingType}.`);
  });
});

function closeBuildMenu() {
  document.getElementById('buildingMenu').style.display = 'none';
  buildMode = null;
}

// Update des boutons selon les ressources
function updateBuildButtons() {
  document.querySelectorAll('.buildButton').forEach(button => {
    const buildingType = button.dataset.building;
    const cost = BUILDING_COSTS[buildingType];
    
    if (cost) {
      const resourceCost = {};
      if (cost.gold) resourceCost[RESOURCES.GOLD] = cost.gold;
      if (cost.wood) resourceCost[RESOURCES.WOOD] = cost.wood;
      if (cost.food) resourceCost[RESOURCES.FOOD] = cost.food;
      
      if (!hasResources(resourceCost)) {
        button.disabled = true;
        button.style.opacity = "0.5";
      } else {
        button.disabled = false;
        button.style.opacity = "1";
      }
    }
  });
}

// === UPDATE ===
function update(deltaTime) {
  const realDelta = Math.max(0, deltaTime);
  const effectiveDelta = (isPaused || isInMainMenu) ? 0 : realDelta * gameSpeed;

  if (isInMainMenu) {
    scoreSyncTimer = 0;
    autosaveTimer = 0;
    updateBuildButtons();
    updateResourcesUI();
    godCursor.pulseTime += realDelta / 1000;
    syncRuntimeState();
    updateUI(currentGod, resources[RESOURCES.FAITH], MAX_RESOURCES[RESOURCES.FAITH], gameTime, selectedTerritory);
    return;
  }

  gameTime += effectiveDelta / 1000;
  scoreSyncTimer += realDelta;
  autosaveTimer += realDelta;

  if (!isPaused) {
    territories.forEach((territory) => {
      territory.growPopulation(effectiveDelta);
    });

    updateAllBuildings(effectiveDelta);
    updateResourceNodes(effectiveDelta);
    updateEnemyAI(effectiveDelta);
    updateAllUnits(effectiveDelta);
    updateAllRituals(effectiveDelta);

    enemySpawnTimer += effectiveDelta;
    if (enemySpawnTimer >= SPAWN_CONFIG.ENEMY_SPAWN_INTERVAL) {
      waveNumber += 1;
      enemySpawnTimer = 0;
    }

    let playerFaithGen = 0;
    territories.forEach((territory) => {
      if (territory.faction === PLAYER_FACTION) {
        playerFaithGen += territory.faithGeneration * currentGod.faithBonus;
      } else if (BOT_FACTIONS.includes(territory.faction)) {
        gainFactionFaith(territory.faction, territory.faithGeneration * (effectiveDelta / 1000));
      }
    });

    playerFaithGen += getTotalFaithGeneration(PLAYER_FACTION);
    resources[RESOURCES.FAITH] += playerFaithGen * (effectiveDelta / 1000);
    if (resources[RESOURCES.FAITH] > MAX_RESOURCES[RESOURCES.FAITH]) {
      resources[RESOURCES.FAITH] = MAX_RESOURCES[RESOURCES.FAITH];
    }
    currentGod.faith = resources[RESOURCES.FAITH];

    currentGod.update(effectiveDelta);
    BOT_FACTIONS.forEach((faction) => {
      if (aiGods[faction]) {
        aiGods[faction].update(effectiveDelta);
      }
    });
    evaluateWinLoss();
  }

  particles.forEach((particle) => particle.update());
  for (let i = particles.length - 1; i >= 0; i -= 1) {
    if (particles[i].isDead()) {
      particles.splice(i, 1);
    }
  }

  updateBuildButtons();
  updateResourcesUI();

  godCursor.pulseTime += realDelta / 1000;
  syncRuntimeState();
  updateUI(currentGod, resources[RESOURCES.FAITH], MAX_RESOURCES[RESOURCES.FAITH], gameTime, selectedTerritory);

  if (scoreSyncTimer >= 1000) {
    scoreSyncTimer = 0;
    syncCatalogScore();
  }

  if (autosaveTimer >= 12000) {
    autosaveTimer = 0;
    saveProgress(true);
  }
}
function setGameSpeed(nextSpeed) {
  const parsed = Number(nextSpeed);
  gameSpeed = Math.max(1, Math.min(3, Number.isFinite(parsed) ? parsed : 1));
  syncRuntimeState();
  pushGameLog(`Vitesse x${gameSpeed}.`);
}

function togglePause(forceValue) {
  if (isInMainMenu && typeof forceValue !== "boolean") return;
  if (gameEnded && typeof forceValue !== "boolean") {
    pushGameLog("Partie terminee. Rechargez ou chargez une sauvegarde.", "warn");
    return;
  }
  if (typeof forceValue === "boolean") {
    isPaused = forceValue;
  } else {
    isPaused = !isPaused;
  }
  syncRuntimeState();
  pushGameLog(isPaused ? "Jeu en pause." : "Jeu repris.");
}

function bindTopControls() {
  const pauseBtn = document.getElementById("pause-toggle");
  const saveBtn = document.getElementById("save-progress");
  const loadBtn = document.getElementById("load-progress");
  const resetBtn = document.getElementById("reset-progress");
  const menuBtn = document.getElementById("open-main-menu");
  const smiteBtn = document.getElementById("power-smite");
  const blessBtn = document.getElementById("power-bless");
  const miracleBtn = document.getElementById("power-miracle");
  const captureBtn = document.getElementById("capture-faith");

  if (pauseBtn) {
    pauseBtn.addEventListener("click", () => togglePause());
  }
  if (saveBtn) {
    saveBtn.addEventListener("click", () => saveProgress());
  }
  if (loadBtn) {
    loadBtn.addEventListener("click", () => loadProgress());
  }
  if (resetBtn) {
    resetBtn.addEventListener("click", () => resetProgress());
  }
  if (menuBtn) {
    menuBtn.addEventListener("click", () => setMainMenuVisible(true, "Menu principal ouvert."));
  }
  if (smiteBtn) {
    smiteBtn.addEventListener("click", () => setDivineCastMode(DIVINE_POWER.SMITE));
  }
  if (blessBtn) {
    blessBtn.addEventListener("click", () => setDivineCastMode(DIVINE_POWER.BLESS));
  }
  if (miracleBtn) {
    miracleBtn.addEventListener("click", () => setDivineCastMode(DIVINE_POWER.MIRACLE));
  }
  if (captureBtn) {
    captureBtn.addEventListener("click", () => triggerPlayerFaithCapture());
  }

  document.querySelectorAll(".speed-button").forEach((button) => {
    button.addEventListener("click", () => {
      const speed = button.getAttribute("data-speed");
      setGameSpeed(speed);
    });
  });
}

function countTerritories(faction) {
  return territories.filter((territory) => territory.faction === faction).length;
}

function evaluateWinLoss() {
  if (gameEnded) return;

  const playerTerritories = countTerritories(PLAYER_FACTION);
  const hostileTerritories = territories.filter(
    (territory) => areHostileFactions(PLAYER_FACTION, territory.faction)
  ).length;

  if (currentMode !== GAME_MODE.SANDBOX && hostileTerritories === 0 && playerTerritories > 0) {
    gameEnded = true;
    togglePause(true);
    pushGameLog("Victoire: tous les adversaires sont neutralises.", "ok");
    syncCatalogScore(true);
    return;
  }

  const playerUnits = units.filter((unit) => unit.faction === PLAYER_FACTION && unit.state !== "dead").length;
  const playerBuildings = buildings.filter((building) => building.faction === PLAYER_FACTION && building.state === "active").length;
  if (playerTerritories === 0 && playerUnits === 0 && playerBuildings === 0) {
    gameEnded = true;
    togglePause(true);
    pushGameLog("Defaite: votre faction a ete aneantie.", "bad");
    syncCatalogScore(true);
  }
}

function serializeGameState() {
  return {
    version: 2,
    mode: currentMode,
    savedAt: Date.now(),
    gameTime: gameTime,
    waveNumber: waveNumber,
    enemySpawnTimer: enemySpawnTimer,
    gameSpeed: gameSpeed,
    isPaused: isPaused,
    resources: {
      faith: Number(resources[RESOURCES.FAITH]) || 0,
      gold: Number(resources[RESOURCES.GOLD]) || 0,
      food: Number(resources[RESOURCES.FOOD]) || 0,
      wood: Number(resources[RESOURCES.WOOD]) || 0
    },
    territories: territories.map((territory) => ({
      faction: territory.faction,
      population: territory.population,
      resistance: territory.resistance
    })),
    buildings: buildings
      .filter((building) => building.state !== "destroyed")
      .map((building) => ({
        x: building.x,
        y: building.y,
        faction: building.faction,
        type: building.type,
        health: building.health,
        productionQueue: Array.isArray(building.productionQueue) ? building.productionQueue.slice() : [],
        productionTimer: Number(building.productionTimer) || 0
      })),
    units: units
      .filter((unit) => unit.state !== "dead")
      .map((unit) => ({
        x: unit.x,
        y: unit.y,
        faction: unit.faction,
        type: unit.type,
        health: unit.health,
        isHero: !!unit.isHero,
        heroClass: unit.heroClass || null
      })),
    resourceNodes: resourceNodes.map((node) => ({
      x: node.x,
      y: node.y,
      type: node.type,
      amount: node.amount,
      maxAmount: node.maxAmount
    })),
    god: {
      name: currentGod.name,
      faith: currentGod.faith,
      smites: currentGod.totalSmites,
      blessings: currentGod.totalBlessings,
      miracles: currentGod.totalMiracles,
      conversions: currentGod.territoriesConverted
    },
    aiFaith: BOT_FACTIONS.reduce((acc, faction) => {
      acc[faction] = getFactionFaith(faction);
      return acc;
    }, {})
  };
}

function applySerializedState(snapshot) {
  if (!snapshot || typeof snapshot !== "object") return false;

  if (snapshot.mode && Object.values(GAME_MODE).includes(snapshot.mode)) {
    currentMode = snapshot.mode;
  }
  if (typeof initializeMap === "function") {
    initializeMap(currentMode);
  }
  captureInitialTerritoryState();
  initializeAiControllers();

  clearDivineCastMode();
  closeBuildMenu();
  cancelAllRituals();
  buildMode = null;
  clearEntitySelections();

  particles.length = 0;
  buildings.length = 0;
  units.length = 0;
  resourceNodes.length = 0;

  resetTerritoriesToInitialState();
  resetResourceState();
  resetGodState();

  aiTimer = 0;
  autosaveTimer = 0;
  scoreSyncTimer = 0;
  gameEnded = false;

  if (snapshot.resources) {
    resources[RESOURCES.FAITH] = Number(snapshot.resources.faith) || resources[RESOURCES.FAITH];
    resources[RESOURCES.GOLD] = Number(snapshot.resources.gold) || resources[RESOURCES.GOLD];
    resources[RESOURCES.FOOD] = Number(snapshot.resources.food) || resources[RESOURCES.FOOD];
    resources[RESOURCES.WOOD] = Number(snapshot.resources.wood) || resources[RESOURCES.WOOD];
  }

  if (Array.isArray(snapshot.territories)) {
    snapshot.territories.forEach((savedTerritory, index) => {
      if (!territories[index]) return;
      territories[index].faction = savedTerritory.faction || territories[index].faction;
      territories[index].population = Number(savedTerritory.population) || territories[index].population;
      territories[index].resistance = Number(savedTerritory.resistance) || territories[index].resistance;
      territories[index].updateFaithGeneration();
    });
  }

  if (Array.isArray(snapshot.buildings)) {
    snapshot.buildings.forEach((savedBuilding) => {
      const created = addBuilding(savedBuilding.x, savedBuilding.y, savedBuilding.faction, savedBuilding.type);
      created.health = Number(savedBuilding.health) || created.health;
      created.productionQueue = Array.isArray(savedBuilding.productionQueue) ? savedBuilding.productionQueue.slice() : [];
      created.productionTimer = Number(savedBuilding.productionTimer) || 0;
    });
  }

  if (Array.isArray(snapshot.units)) {
    snapshot.units.forEach((savedUnit) => {
      let created = null;
      if (savedUnit.isHero && savedUnit.heroClass) {
        created = addHero(savedUnit.x, savedUnit.y, savedUnit.faction, savedUnit.heroClass);
      } else {
        created = addUnit(savedUnit.x, savedUnit.y, savedUnit.faction, savedUnit.type);
      }
      if (created) {
        created.health = Math.min(created.maxHealth, Number(savedUnit.health) || created.health);
      }
    });
  }

  if (Array.isArray(snapshot.resourceNodes)) {
    snapshot.resourceNodes.forEach((savedNode) => {
      const node = new ResourceNode(savedNode.x, savedNode.y, savedNode.type, Number(savedNode.maxAmount) || 1);
      node.amount = Math.max(0, Number(savedNode.amount) || 0);
      node.maxAmount = Number(savedNode.maxAmount) || node.maxAmount;
      resourceNodes.push(node);
    });
  }

  if (snapshot.god) {
    currentGod.faith = Number(snapshot.god.faith) || currentGod.faith;
    currentGod.totalSmites = Number(snapshot.god.smites) || 0;
    currentGod.totalBlessings = Number(snapshot.god.blessings) || 0;
    currentGod.totalMiracles = Number(snapshot.god.miracles) || 0;
    currentGod.territoriesConverted = Number(snapshot.god.conversions) || 0;
  }
  if (snapshot.aiFaith && typeof snapshot.aiFaith === "object") {
    BOT_FACTIONS.forEach((faction) => {
      if (snapshot.aiFaith[faction] != null) {
        setFactionFaith(faction, Number(snapshot.aiFaith[faction]) || 0);
      }
    });
  }
  currentGod.smiteCooldown = 0;
  currentGod.blessingCooldown = 0;
  currentGod.miracleCooldown = 0;

  gameTime = Math.max(0, Number(snapshot.gameTime) || 0);
  waveNumber = Math.max(1, Math.floor(Number(snapshot.waveNumber) || 1));
  enemySpawnTimer = Math.max(0, Number(snapshot.enemySpawnTimer) || 0);
  gameSpeed = Math.max(1, Math.min(3, Number(snapshot.gameSpeed) || 1));
  isPaused = !!snapshot.isPaused;
  hasActiveRun = true;
  bestCatalogScore = computeCatalogScore();
  faith = resources[RESOURCES.FAITH];
  syncCatalogScore();
  updateResourcesUI();
  refreshMainMenuButtons();

  syncRuntimeState();
  return true;
}

function saveProgress(silent = false) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(serializeGameState()));
    refreshMainMenuButtons();
    if (!silent) pushGameLog("Partie sauvegardee.", "ok");
    return true;
  } catch (_error) {
    if (!silent) pushGameLog("Echec de sauvegarde.", "bad");
    return false;
  }
}

function loadProgress(silent = false) {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) {
    refreshMainMenuButtons();
    if (!silent) pushGameLog("Aucune sauvegarde detectee.", "warn");
    return false;
  }

  try {
    const snapshot = JSON.parse(raw);
    const ok = applySerializedState(snapshot);
    if (ok) {
      refreshMainMenuButtons();
      if (!silent) pushGameLog("Sauvegarde chargee.", "ok");
      return true;
    }
  } catch (_error) {
    // no-op
  }

  if (!silent) pushGameLog("Sauvegarde invalide.", "bad");
  refreshMainMenuButtons();
  return false;
}

function resetProgress() {
  if (!window.confirm("Supprimer la sauvegarde et recommencer une nouvelle partie ?")) return;
  resetWorldState(true);
  setMainMenuVisible(true, "Sauvegarde effacee. Nouvelle partie prete.");
}

// === DRAW ===
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  territories.forEach(t => t.draw(ctx));
  drawMapDecorations(ctx); // Décorations de la carte
  drawResourceNodes(ctx);
  drawAllBuildings(ctx);
  drawAllUnits(ctx);
  drawAllRituals(ctx); // Rituels actifs
  particles.forEach(p => p.draw(ctx));

  if (buildMode) {
    drawBuildPreview();
  }

  drawGodCursor();
  drawSelectionInfo();
}

function drawBuildPreview() {
  const building = new Building(
    buildPreviewX - 20, 
    buildPreviewY - 20, 
    PLAYER_FACTION, 
    buildMode
  );
  
  ctx.save();
  ctx.globalAlpha = 0.5;
  building.draw(ctx);
  ctx.restore();

  const cost = BUILDING_COSTS[buildMode];
  if (cost) {
    const resourceCost = {};
    if (cost.gold) resourceCost[RESOURCES.GOLD] = cost.gold;
    if (cost.wood) resourceCost[RESOURCES.WOOD] = cost.wood;
    if (cost.food) resourceCost[RESOURCES.FOOD] = cost.food;
    
    const canAfford = hasResources(resourceCost);
    
    ctx.fillStyle = canAfford ? "#4caf50" : "#f44336";
    ctx.font = "12px Arial";
    let costText = "Cost: ";
    if (cost.gold) costText += `${cost.gold}G `;
    if (cost.wood) costText += `${cost.wood}W `;
    if (cost.food) costText += `${cost.food}F`;
    ctx.fillText(costText, buildPreviewX + 30, buildPreviewY);
  }
}

function drawSelectionInfo() {
  if (selectedBuilding) {
    const x = 10;
    const y = canvas.height - 100;
    const width = 300;
    const height = 90;

    ctx.fillStyle = "rgba(15, 10, 25, 0.9)";
    ctx.fillRect(x, y, width, height);
    
    ctx.strokeStyle = "#5a3a8a";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 12px Arial";
    ctx.fillText(`${selectedBuilding.icon} ${selectedBuilding.type.toUpperCase()}`, x + 10, y + 20);
    
    ctx.font = "11px Arial";
    ctx.fillText(`Health: ${Math.floor(selectedBuilding.health)}/${selectedBuilding.maxHealth}`, x + 10, y + 40);
    ctx.fillText(`${selectedBuilding.description}`, x + 10, y + 60);
    
    if (selectedBuilding.canProduce) {
      const unitType = selectedBuilding.produceTypes[0];
      const cost = UNIT_COSTS[unitType];
      ctx.fillText(`[Q] Train ${unitType} (${cost.gold || 0}G ${cost.food || 0}F)`, x + 10, y + 80);
    }
  } else if (selectedUnit) {
    const x = 10;
    const y = canvas.height - 100;
    const width = 300;
    const height = 90;
    const group = getSelectedPlayerUnits();
    const groupCount = group.length;

    ctx.fillStyle = "rgba(15, 10, 25, 0.9)";
    ctx.fillRect(x, y, width, height);
    
    ctx.strokeStyle = "#5a3a8a";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 12px Arial";
    if (groupCount > 1) {
      const typeCounter = {};
      group.forEach((unit) => {
        typeCounter[unit.type] = (typeCounter[unit.type] || 0) + 1;
      });
      const compact = Object.entries(typeCounter)
        .slice(0, 2)
        .map(([type, count]) => `${type}:${count}`)
        .join(" ");
      ctx.fillText(`GROUPE (${groupCount}) ${compact}`, x + 10, y + 20);
    } else {
      ctx.fillText(`${selectedUnit.icon} ${selectedUnit.type.toUpperCase()}`, x + 10, y + 20);
    }
    
    ctx.font = "11px Arial";
    ctx.fillText(`Health: ${Math.floor(selectedUnit.health)}/${selectedUnit.maxHealth}`, x + 10, y + 40);
    ctx.fillText(`Attack: ${selectedUnit.attackPower} | Range: ${selectedUnit.attackRange}`, x + 10, y + 60);
    
    if (selectedUnit.canHarvest) {
      ctx.fillText(`Right-click resource to harvest`, x + 10, y + 80);
    } else {
      const stance = selectedUnit.commandStance || "guard";
      ctx.fillText(`Stance: ${stance} | Patrol/defense auto | [T]=same type`, x + 10, y + 80);
    }
  }
}

function drawGodCursor() {
  const pulse = Math.sin(godCursor.pulseTime * 3) * 2 + godCursor.radius;
  
  ctx.save();
  ctx.shadowColor = currentGod.color || "#ffcc00";
  ctx.shadowBlur = 15;
  
  ctx.beginPath();
  ctx.arc(godCursor.x, godCursor.y, pulse, 0, Math.PI * 2);
  ctx.fillStyle = currentGod.color || "#ffcc00";
  ctx.globalAlpha = 0.7;
  ctx.fill();
  
  ctx.restore();
}

// === INITIALISATION ===
bindTopControls();
bindMainMenuControls();
resetWorldState(false);
setMainMenuVisible(
  true,
  hasSavedProgress()
    ? "Sauvegarde detectee: charge une sauvegarde ou lance une nouvelle partie."
    : "Pret. Lance une nouvelle partie depuis le menu principal."
);

// === GAME LOOP ===
function gameLoop(timestamp) {
  const deltaTime = Math.min(80, Math.max(0, timestamp - lastTime));
  lastTime = timestamp;

  update(deltaTime);
  draw();

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

window.addEventListener("pagehide", () => {
  const shouldPersistRun = hasActiveRun && !(isInMainMenu && gameTime <= 0.05 && waveNumber === 1);
  if (shouldPersistRun) {
    saveProgress(true);
    syncCatalogScore(true);
  }
});


