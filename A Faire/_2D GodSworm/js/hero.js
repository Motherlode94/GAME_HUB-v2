// hero.js - Hero system for GodSworm (stable version)

function hasResearchedTech(techId) {
  return Array.isArray(window.researchedTechs) && window.researchedTechs.includes(techId);
}

class Hero extends Unit {
  constructor(x, y, faction, heroClass = "paladin") {
    super(x, y, faction, UNIT_TYPES.WARRIOR);

    this.isHero = true;
    this.heroClass = heroClass;
    this.level = 1;
    this.experience = 0;
    this.experienceToNextLevel = 100;

    this.statPoints = 0;
    this.abilityPoints = hasResearchedTech("HERO_ACADEMY") ? 2 : 0;

    this.auraRadius = 110;
    this.auraEffect = "defense";

    this._baseStats = {
      maxHealth: this.maxHealth,
      speed: this.speed,
      attackPower: this.attackPower
    };

    this.applyHeroClass(heroClass);
    this.captureBaseStats();
  }

  captureBaseStats() {
    this._baseStats.maxHealth = this.maxHealth;
    this._baseStats.speed = this.speed;
    this._baseStats.attackPower = this.attackPower;
  }

  applyHeroClass(heroClass) {
    switch (heroClass) {
      case HERO_CLASSES.PALADIN:
        this.icon = "HP";
        this.maxHealth = 220;
        this.health = 220;
        this.speed = 1.8;
        this.attackPower = 25;
        this.attackRange = 35;
        this.auraEffect = "defense";
        break;
      case HERO_CLASSES.RANGER:
        this.icon = "HR";
        this.maxHealth = 150;
        this.health = 150;
        this.speed = 2.5;
        this.attackPower = 18;
        this.attackRange = 90;
        this.auraEffect = "speed";
        break;
      case HERO_CLASSES.MAGE:
        this.icon = "HM";
        this.maxHealth = 130;
        this.health = 130;
        this.speed = 1.7;
        this.attackPower = 35;
        this.attackRange = 100;
        this.auraEffect = "magic";
        break;
      case HERO_CLASSES.BERSERKER:
        this.icon = "HB";
        this.maxHealth = 190;
        this.health = 190;
        this.speed = 2.1;
        this.attackPower = 40;
        this.attackRange = 32;
        this.auraEffect = "rage";
        break;
      case HERO_CLASSES.PRIEST:
        this.icon = "HC";
        this.maxHealth = 170;
        this.health = 170;
        this.speed = 1.9;
        this.attackPower = 14;
        this.attackRange = 70;
        this.auraEffect = "heal";
        break;
      default:
        break;
    }
  }

  gainExperience(amount) {
    this.experience += Math.max(0, Number(amount) || 0);
    while (this.experience >= this.experienceToNextLevel) {
      this.levelUp();
    }
  }

  levelUp() {
    this.level += 1;
    this.statPoints += 3;
    this.abilityPoints += 1;

    this.experience -= this.experienceToNextLevel;
    this.experienceToNextLevel = Math.floor(this.experienceToNextLevel * 1.45);

    this.maxHealth += 22;
    this.attackPower += 5;
    this.speed += 0.08;
    this.health = this.maxHealth;

    this.captureBaseStats();
  }

  useAbility(_abilityIndex, _target) {
    // Placeholder: keep API compatibility with game hotkeys
    return false;
  }

  applyAuraToUnit(unit) {
    if (!unit || unit === this || unit.faction !== this.faction || unit.state === "dead") return;

    if (!unit._heroAuraBaseStats) {
      unit._heroAuraBaseStats = {
        attackPower: unit.attackPower,
        speed: unit.speed,
        maxHealth: unit.maxHealth
      };
    }

    const base = unit._heroAuraBaseStats;
    const distance = Math.hypot(this.x - unit.x, this.y - unit.y);

    if (distance > this.auraRadius) {
      if (unit._heroAuraApplied) {
        unit.attackPower = base.attackPower;
        unit.speed = base.speed;
        unit.maxHealth = base.maxHealth;
        if (unit.health > unit.maxHealth) unit.health = unit.maxHealth;
        unit._heroAuraApplied = false;
      }
      return;
    }

    let attackMultiplier = 1.1;
    let speedMultiplier = 1;
    let healthMultiplier = 1;

    if (this.auraEffect === "defense") healthMultiplier = 1.12;
    if (this.auraEffect === "speed") speedMultiplier = 1.18;
    if (this.auraEffect === "magic") attackMultiplier = 1.18;
    if (this.auraEffect === "rage" && (unit.health / Math.max(1, unit.maxHealth)) < 0.45) {
      attackMultiplier = 1.28;
    }
    if (this.auraEffect === "heal") {
      unit.health = Math.min(unit.maxHealth, unit.health + 0.25);
    }

    unit.attackPower = base.attackPower * attackMultiplier;
    unit.speed = base.speed * speedMultiplier;
    unit.maxHealth = base.maxHealth * healthMultiplier;
    if (unit.health > unit.maxHealth) unit.health = unit.maxHealth;
    unit._heroAuraApplied = true;
  }

  update(deltaTime, allUnits) {
    super.update(deltaTime, allUnits);
    allUnits.forEach((unit) => this.applyAuraToUnit(unit));
  }
}

const HERO_CLASSES = {
  PALADIN: "paladin",
  RANGER: "ranger",
  MAGE: "mage",
  BERSERKER: "berserker",
  PRIEST: "priest"
};

const HERO_COSTS = {
  [HERO_CLASSES.PALADIN]: 150,
  [HERO_CLASSES.RANGER]: 120,
  [HERO_CLASSES.MAGE]: 140,
  [HERO_CLASSES.BERSERKER]: 130,
  [HERO_CLASSES.PRIEST]: 160
};

function createHero(x, y, faction, heroClass = HERO_CLASSES.PALADIN) {
  return new Hero(x, y, faction, heroClass);
}

function addHero(x, y, faction, heroClass) {
  const hero = createHero(x, y, faction, heroClass);
  units.push(hero);
  return hero;
}

const XP_REWARDS = {
  KILL_UNIT: 20,
  KILL_HERO: 100,
  DESTROY_BUILDING: 50,
  CONVERT_TERRITORY: 30,
  COMPLETE_QUEST: 200
};

function giveHeroesExperience(faction, amount) {
  units.forEach((unit) => {
    if (unit.isHero && unit.faction === faction && unit.state !== "dead") {
      unit.gainExperience(amount);
    }
  });
}
