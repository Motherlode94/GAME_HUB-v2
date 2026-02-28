// tech_tree.js - Arbre technologique complet pour GodSworm

const TECHS = {
  IRON_WEAPONS: {
    name: "Iron Weapons",
    cost: { faith: 150, gold: 100 },
    prereq: [],
    unlocks: ["Crusader unit", "Warrior damage +10%"],
    description: "Débloque les Crusaders et améliore les dégâts des guerriers"
  },
  SHRINE_UPGRADE: {
    name: "Shrine Empowerment",
    cost: { faith: 200 },
    prereq: [],
    unlocks: ["Shrine faith gen +50%", "MASS_HEAL ritual"],
    description: "Sanctuaires plus puissants + rituel Mass Heal"
  },
  FORMATION_TACTICS: {
    name: "Formation Tactics",
    cost: { faith: 300, gold: 200 },
    prereq: ["IRON_WEAPONS"],
    unlocks: ["Formations: LINE, COLUMN", "Unit speed +15% en formation"],
    description: "Débloque les formations tactiques avec bonus"
  },
  HERO_ACADEMY: {
    name: "Hero Academy",
    cost: { faith: 400 },
    prereq: ["SHRINE_UPGRADE"],
    unlocks: ["Hero classes: Ranger, Mage", "Talent points +1 par level"],
    description: "Nouvelles classes de héros + talents avancés"
  },
  DIVINE_FAVOR: {
    name: "Divine Favor",
    cost: { faith: 500, gold: 300 },
    prereq: ["SHRINE_UPGRADE", "FORMATION_TACTICS"],
    unlocks: ["+1 miracle charge", "Ritual combos (x2 effet)"],
    description: "Pouvoirs divins renforcés + combos rituels"
  },
  CRUSADER_PURGE: {
    name: "Crusader Purge",
    cost: { faith: 600 },
    prereq: ["IRON_WEAPONS", "HERO_ACADEMY"],
    unlocks: ["FACTION_REBELLION ritual", "Crusader resistance -20%"],
    description: "Rituel de rébellion + affaiblit les Crusaders"
  }
};

let researchedTechs = [];

function canResearchTech(techKey) {
  const tech = TECHS[techKey];
  if (!tech || researchedTechs.includes(techKey)) return false;

  for (let prereq of tech.prereq) {
    if (!researchedTechs.includes(prereq)) return false;
  }

  const cost = tech.cost;
  return hasResources({ faith: cost.faith || 0, gold: cost.gold || 0 });
}

function researchTech(techKey) {
  if (!canResearchTech(techKey)) return false;

  const tech = TECHS[techKey];
  consumeResources(tech.cost);

  researchedTechs.push(techKey);

  // Appliquer les unlocks (à compléter selon tes besoins)
  tech.unlocks.forEach(unlock => {
    if (unlock.includes("unit")) {
      console.log(`Unlocked unit type: ${unlock}`);
      // ex: UNIT_TYPES[unlock.split(" ")[0].toUpperCase()] = true;
    }
    if (unlock.includes("ritual")) {
      console.log(`Unlocked ritual: ${unlock}`);
    }
    if (unlock.includes("Formation")) {
      console.log("Formations débloquées");
      // ex: FORMATIONS_UNLOCKED = true;
    }
  });

  console.log(`Technologie recherchée : ${tech.name}`);
  return true;
}

function getAvailableTechs() {
  return Object.keys(TECHS).filter(canResearchTech);
}