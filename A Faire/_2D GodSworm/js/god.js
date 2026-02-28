class God {
  constructor(name, passiveDescription, startingFaith, faithBonus, element, color) {
    this.name = name;
    this.passiveDescription = passiveDescription;
    this.faith = startingFaith;
    this.faithBonus = faithBonus;
    this.element = element || "divine"; // Type de dieu (divine, nature, war, etc.)
    this.color = color || "#8b2be2"; // Couleur thématique

    // Cooldowns des pouvoirs
    this.smiteCooldown = 0;
    this.smiteMaxCooldown = 5000;
    
    this.blessingCooldown = 0;
    this.blessingMaxCooldown = 8000;
    
    this.miracleCooldown = 0;
    this.miracleMaxCooldown = 15000;

    // Stats
    this.totalSmites = 0;
    this.totalBlessings = 0;
    this.totalMiracles = 0;
    this.territoriesConverted = 0;
  }

  // === SMITE ===
  canSmite() {
    return this.smiteCooldown <= 0;
  }

  useSmite() {
    if (this.canSmite()) {
      this.smiteCooldown = this.smiteMaxCooldown;
      this.totalSmites++;
      return true;
    }
    return false;
  }

  getSmiteCooldownPercent() {
    return Math.max(0, 1 - (this.smiteCooldown / this.smiteMaxCooldown));
  }

  // === BLESSING (Nouveau pouvoir) ===
  canBless() {
    return this.blessingCooldown <= 0;
  }

  useBless() {
    if (this.canBless()) {
      this.blessingCooldown = this.blessingMaxCooldown;
      this.totalBlessings++;
      return true;
    }
    return false;
  }

  getBlessCooldownPercent() {
    return Math.max(0, 1 - (this.blessingCooldown / this.blessingMaxCooldown));
  }

  // === MIRACLE (Pouvoir ultime) ===
  canMiracle() {
    return this.miracleCooldown <= 0;
  }

  useMiracle() {
    if (this.canMiracle()) {
      this.miracleCooldown = this.miracleMaxCooldown;
      this.totalMiracles++;
      return true;
    }
    return false;
  }

  getMiracleCooldownPercent() {
    return Math.max(0, 1 - (this.miracleCooldown / this.miracleMaxCooldown));
  }

  // === UPDATE ===
  update(deltaTime) {
    if (this.smiteCooldown > 0) {
      this.smiteCooldown -= deltaTime;
    }
    if (this.blessingCooldown > 0) {
      this.blessingCooldown -= deltaTime;
    }
    if (this.miracleCooldown > 0) {
      this.miracleCooldown -= deltaTime;
    }
  }

  // === HELPER METHODS ===
  getSmiteCooldownSeconds() {
    return Math.max(0, Math.ceil(this.smiteCooldown / 1000));
  }

  getBlessCooldownSeconds() {
    return Math.max(0, Math.ceil(this.blessingCooldown / 1000));
  }

  getMiracleCooldownSeconds() {
    return Math.max(0, Math.ceil(this.miracleCooldown / 1000));
  }

  // Niveau de puissance basé sur les stats
  getPowerLevel() {
    return this.totalSmites + this.totalBlessings * 2 + this.totalMiracles * 5;
  }

  // Info complète du dieu
  getInfo() {
    return {
      name: this.name,
      element: this.element,
      faith: Math.floor(this.faith),
      powerLevel: this.getPowerLevel(),
      stats: {
        smites: this.totalSmites,
        blessings: this.totalBlessings,
        miracles: this.totalMiracles,
        conversions: this.territoriesConverted
      }
    };
  }
}

// === PRESETS DE DIEUX ===
const GOD_PRESETS = {
  WYRD: {
    name: "Wyrd",
    passive: "Faith generation increased in pagan lands",
    faith: 100,
    bonus: 1.5,
    element: "fate",
    color: "#9370db"
  },
  THOR: {
    name: "Thor",
    passive: "Smite cooldown reduced by 30%",
    faith: 80,
    bonus: 1.2,
    element: "thunder",
    color: "#4169e1"
  },
  FREYA: {
    name: "Freya",
    passive: "Blessing costs reduced by 50%",
    faith: 120,
    bonus: 1.8,
    element: "love",
    color: "#ff69b4"
  },
  ODIN: {
    name: "Odin",
    passive: "All powers 20% more effective",
    faith: 150,
    bonus: 2.0,
    element: "wisdom",
    color: "#daa520"
  }
};

// Factory pour créer des dieux
function createGod(preset) {
  const p = GOD_PRESETS[preset] || GOD_PRESETS.WYRD;
  return new God(p.name, p.passive, p.faith, p.bonus, p.element, p.color);
}