// formation.js – NOUVEAU SYSTÈME COMPLET
const FORMATIONS = {
  LINE: "line",     // Dégâts +20%, vulnérable flancs
  COLUMN: "column", // Défense +30%, vitesse -10%
  CIRCLE: "circle", // Tout bonus équilibré, anti-cavalry
  NONE: "none"
};

const FORMATION_BONUSES = {
  [FORMATIONS.LINE]: { damage: 1.2, defense: 0.8, speed: 1.0 },
  [FORMATIONS.COLUMN]: { damage: 1.0, defense: 1.3, speed: 0.9 },
  [FORMATIONS.CIRCLE]: { damage: 1.1, defense: 1.1, speed: 0.95 }
};

// NOUVEAU : Manager formations
const unitFormations = new Map(); // groupId -> {type, units: []}

function assignFormation(groupId, formationType, units) {
  unitFormations.set(groupId, { type: formationType, units });
  applyFormationBonuses(groupId);
}

function applyFormationBonuses(groupId) {
  const formation = unitFormations.get(groupId);
  if (!formation) return;
  const bonuses = FORMATION_BONUSES[formation.type] || { damage: 1, defense: 1, speed: 1 };
  formation.units.forEach(unit => {
    unit.formationBonus = bonuses;
    unit.speed *= bonuses.speed;
    unit.attackPower *= bonuses.damage;
    unit.maxHealth *= bonuses.defense;
  });
}

// À appeler dans unit.update() pour maintenir formation
function updateFormationPositions(groupId, targetX, targetY) {
  const formation = unitFormations.get(groupId);
  if (!formation) return;
  const unitCount = formation.units.length;
  const spacing = 40;
  formation.units.forEach((unit, i) => {
    let offsetX = 0, offsetY = 0;
    switch (formation.type) {
      case FORMATIONS.LINE:
        offsetX = (i - unitCount / 2) * spacing;
        break;
      case FORMATIONS.COLUMN:
        offsetY = (i - unitCount / 2) * spacing;
        break;
      case FORMATIONS.CIRCLE:
        const angle = (i / unitCount) * Math.PI * 2;
        offsetX = Math.cos(angle) * spacing;
        offsetY = Math.sin(angle) * spacing;
        break;
    }
    unit.targetX = targetX + offsetX;
    unit.targetY = targetY + offsetY;
  });
}

// UI : Clic droit sur sélection → menu formations
function onFormationCommand(formationType) {
  if (selectedEntities.length < 3) return; // Min 3 unités
  const groupId = Math.random().toString(36).substr(2, 9);
  assignFormation(groupId, formationType, selectedEntities);
}