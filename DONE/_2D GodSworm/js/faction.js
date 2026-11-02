const FACTIONS = {
  NEUTRAL: "neutral",
  PAGAN: "pagan",
  CRUSADER: "crusader",
  NORTHMEN: "northmen",
  NOMAD: "nomad"
};

const PLAYER_FACTION = FACTIONS.PAGAN;
const BOT_FACTIONS = [FACTIONS.CRUSADER, FACTIONS.NORTHMEN, FACTIONS.NOMAD];

const FACTION_COLORS = {
  [FACTIONS.NEUTRAL]: { base: "#555", selected: "#666", border: "#333" },
  [FACTIONS.PAGAN]: { base: "#2e7d32", selected: "#3f9650", border: "#1b5e20" },
  [FACTIONS.CRUSADER]: { base: "#b71c1c", selected: "#d63939", border: "#7f0000" },
  [FACTIONS.NORTHMEN]: { base: "#1f4e8f", selected: "#2f68b8", border: "#0d2f5f" },
  [FACTIONS.NOMAD]: { base: "#8c5b1f", selected: "#b5792f", border: "#5a3b15" }
};

const FACTION_ICONS = {
  [FACTIONS.NEUTRAL]: "N",
  [FACTIONS.PAGAN]: "P",
  [FACTIONS.CRUSADER]: "C",
  [FACTIONS.NORTHMEN]: "V",
  [FACTIONS.NOMAD]: "D"
};

const FACTION_NAMES = {
  [FACTIONS.NEUTRAL]: "Neutral",
  [FACTIONS.PAGAN]: "Player Kingdom",
  [FACTIONS.CRUSADER]: "Crusader Order",
  [FACTIONS.NORTHMEN]: "Northmen Clans",
  [FACTIONS.NOMAD]: "Nomad League"
};

const FACTION_PROPERTIES = {
  [FACTIONS.NEUTRAL]: {
    faithGeneration: 0,
    baseResistance: 6,
    conversionCostMultiplier: 0.8,
    unitBonus: { speed: 1, damage: 1, health: 1 }
  },
  [FACTIONS.PAGAN]: {
    faithGeneration: 0.16,
    baseResistance: 14,
    conversionCostMultiplier: 0.9,
    unitBonus: { speed: 1.02, damage: 1.02, health: 1.03 }
  },
  [FACTIONS.CRUSADER]: {
    faithGeneration: 0.13,
    baseResistance: 17,
    conversionCostMultiplier: 1.1,
    unitBonus: { speed: 0.96, damage: 1.15, health: 1.14 }
  },
  [FACTIONS.NORTHMEN]: {
    faithGeneration: 0.12,
    baseResistance: 15,
    conversionCostMultiplier: 1.0,
    unitBonus: { speed: 1.12, damage: 1.07, health: 0.95 }
  },
  [FACTIONS.NOMAD]: {
    faithGeneration: 0.11,
    baseResistance: 13,
    conversionCostMultiplier: 1.0,
    unitBonus: { speed: 1.15, damage: 1.0, health: 0.92 }
  }
};

function applyFactionBonus(unit) {
  const props = getFactionProperties(unit.faction);
  const bonus = props.unitBonus || {};
  unit.speed *= bonus.speed || 1;
  unit.attackPower *= bonus.damage || 1;
  unit.maxHealth *= bonus.health || 1;
  unit.health = unit.maxHealth;
}

function getFactionColor(faction, selected = false) {
  const colors = FACTION_COLORS[faction] || FACTION_COLORS[FACTIONS.NEUTRAL];
  return selected ? colors.selected : colors.base;
}

function getFactionBorderColor(faction) {
  const colors = FACTION_COLORS[faction] || FACTION_COLORS[FACTIONS.NEUTRAL];
  return colors.border;
}

function getFactionIcon(faction) {
  return FACTION_ICONS[faction] || FACTION_ICONS[FACTIONS.NEUTRAL];
}

function getFactionName(faction) {
  return FACTION_NAMES[faction] || "Unknown";
}

function getFactionProperties(faction) {
  return FACTION_PROPERTIES[faction] || FACTION_PROPERTIES[FACTIONS.NEUTRAL];
}

function getConversionCost(territory, baseCost = 22) {
  const props = getFactionProperties(territory.faction);
  const resistanceCost = Math.max(0, Number(territory.resistance) || 0) * 2;
  return baseCost + resistanceCost + (baseCost * (props.conversionCostMultiplier || 1));
}

function areHostileByDefault(sourceFaction, targetFaction) {
  if (!sourceFaction || !targetFaction) return false;
  if (sourceFaction === targetFaction) return false;
  if (sourceFaction === FACTIONS.NEUTRAL || targetFaction === FACTIONS.NEUTRAL) return false;
  return true;
}
