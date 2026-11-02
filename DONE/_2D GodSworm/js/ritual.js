// ritual.js - Système de rituels divins pour GodSworm

class Ritual {
  constructor(type, x, y, faction) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.faction = faction;
    this.duration = 10000; // 10 secondes par défaut
    this.progress = 0;
    this.active = true;
    this.completed = false;
    this.radius = 80;
    this.particles = [];
    this.comboMultiplier = 1; // NOUVEAU : pour combos rituels
    
    // Configure selon le type
    this.configure();
  }

  configure() {
    switch (this.type) {
      case RITUAL_TYPES.SUMMON_WARRIORS:
        this.duration = 8000;
        this.color = "#f44336";
        this.icon = "⚔️";
        this.description = "Summon Warriors";
        this.cost = { faith: 100 };
        break;
        
      case RITUAL_TYPES.DIVINE_BLESSING:
        this.duration = 6000;
        this.color = "#ffd700";
        this.icon = "✨";
        this.description = "Divine Blessing";
        this.cost = { faith: 80 };
        break;
        
      case RITUAL_TYPES.MASS_HEAL:
        this.duration = 5000;
        this.color = "#4caf50";
        this.icon = "💚";
        this.description = "Mass Healing";
        this.cost = { faith: 60 };
        break;
        
      case RITUAL_TYPES.SMITE_AREA:
        this.duration = 4000;
        this.color = "#ff9800";
        this.icon = "⚡";
        this.description = "Divine Smite";
        this.cost = { faith: 120 };
        break;
        
      case RITUAL_TYPES.CONVERT_TERRITORY:
        this.duration = 12000;
        this.color = "#9c27b0";
        this.icon = "🔮";
        this.description = "Convert Territory";
        this.cost = { faith: 150 };
        break;
        
      case RITUAL_TYPES.SUMMON_HERO:
        this.duration = 15000;
        this.color = "#ff6b6b";
        this.icon = "👑";
        this.description = "Summon Hero";
        this.cost = { faith: 200, gold: 150 };
        break;

      // NOUVEAU rituel
      case RITUAL_TYPES.FACTION_REBELLION:
        this.duration = 10000;
        this.color = "#00ff88";
        this.icon = "🔄";
        this.description = "Faction Rebellion";
        this.cost = { faith: 180 };
        break;
    }
  }

  update(deltaTime) {
    if (!this.active || this.completed) return;

    this.progress += deltaTime;
    
    // Animation de particules
    if (Math.random() < 0.3) {
      this.createRitualParticle();
    }
    
    // Mettre à jour les particules
    this.particles.forEach(p => p.update());
    this.particles = this.particles.filter(p => !p.isDead());

    // Vérifier si terminé
    if (this.progress >= this.duration) {
      this.complete();
    }
  }

  createRitualParticle() {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2 + 1;
    const distance = this.radius * Math.random();
    
    const px = this.x + Math.cos(angle) * distance;
    const py = this.y + Math.sin(angle) * distance;
    
    this.particles.push({
      x: px,
      y: py,
      vx: Math.cos(angle) * speed * 0.5,
      vy: -Math.random() * 2 - 1,
      life: 1.0,
      size: Math.random() * 4 + 2,
      color: this.color,
      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.02;
      },
      isDead() {
        return this.life <= 0;
      }
    });
  }

  complete() {
    this.completed = true;
    this.active = false;
    
    console.log(`Ritual ${this.type} completed!`);
    
    // Effets selon le type
    switch (this.type) {
      case RITUAL_TYPES.SUMMON_WARRIORS:
        this.summonWarriors();
        break;
      case RITUAL_TYPES.DIVINE_BLESSING:
        this.applyBlessing();
        break;
      case RITUAL_TYPES.MASS_HEAL:
        this.massHeal();
        break;
      case RITUAL_TYPES.SMITE_AREA:
        this.smiteArea();
        break;
      case RITUAL_TYPES.CONVERT_TERRITORY:
        this.convertTerritory();
        break;
      case RITUAL_TYPES.SUMMON_HERO:
        this.summonHero();
        break;
      case RITUAL_TYPES.FACTION_REBELLION:
        this.factionRebellion();
        break;
    }
    
    // Effet visuel massif
    createParticleExplosion(this.x, this.y, this.color, 50);
  }

  // Effets spécifiques
  summonWarriors() {
    const count = 5 * this.comboMultiplier;
    const angleStep = (Math.PI * 2) / count;
    
    for (let i = 0; i < count; i++) {
      const angle = i * angleStep;
      const spawnX = this.x + Math.cos(angle) * 50;
      const spawnY = this.y + Math.sin(angle) * 50;
      
      addUnit(spawnX, spawnY, this.faction, UNIT_TYPES.WARRIOR);
      createParticleExplosion(spawnX, spawnY, this.color, 15);
    }
  }

  applyBlessing() {
    units.forEach(unit => {
      if (unit.faction !== this.faction || unit.state === "dead") return;
      
      const dist = Math.hypot(unit.x - this.x, unit.y - this.y);
      if (dist <= this.radius * 2) {
        unit.attackPower *= 1.5 * this.comboMultiplier;
        unit.speed *= 1.3 * this.comboMultiplier;
        
        createParticleExplosion(unit.x, unit.y, "#ffd700", 10);
        
        setTimeout(() => {
          unit.attackPower /= 1.5 * this.comboMultiplier;
          unit.speed /= 1.3 * this.comboMultiplier;
        }, 20000);
      }
    });
  }

  massHeal() {
    units.forEach(unit => {
      if (unit.faction !== this.faction || unit.state === "dead") return;
      
      const dist = Math.hypot(unit.x - this.x, unit.y - this.y);
      if (dist <= this.radius * 2) {
        unit.heal(unit.maxHealth * this.comboMultiplier);
        createParticleExplosion(unit.x, unit.y, "#4caf50", 12);
      }
    });
    
    buildings.forEach(building => {
      if (building.faction !== this.faction || building.state === "destroyed") return;
      
      const dist = Math.hypot(
        building.x + building.size / 2 - this.x,
        building.y + building.size / 2 - this.y
      );
      if (dist <= this.radius * 2) {
        building.repair(building.maxHealth * this.comboMultiplier);
        createParticleExplosion(building.x + building.size / 2, building.y + building.size / 2, "#4caf50", 15);
      }
    });
  }

  smiteArea() {
    const damage = 100 * this.comboMultiplier;
    
    units.forEach(unit => {
      if (unit.faction === this.faction || unit.state === "dead") return;
      
      const dist = Math.hypot(unit.x - this.x, unit.y - this.y);
      if (dist <= this.radius) {
        unit.takeDamage(damage);
        createParticleExplosion(unit.x, unit.y, "#ff9800", 20);
      }
    });
    
    buildings.forEach(building => {
      if (building.faction === this.faction || building.state === "destroyed") return;
      
      const dist = Math.hypot(
        building.x + building.size / 2 - this.x,
        building.y + building.size / 2 - this.y
      );
      if (dist <= this.radius) {
        building.takeDamage(damage);
        createParticleExplosion(building.x + building.size / 2, building.y + building.size / 2, "#ff9800", 25);
      }
    });
  }

  convertTerritory() {
    territories.forEach(territory => {
      if (territory.contains(this.x, this.y)) {
        territory.setFaction(this.faction);
        createParticleExplosion(
          territory.x + territory.width / 2,
          territory.y + territory.height / 2,
          getFactionColor(this.faction),
          40
        );
      }
    });
  }

  summonHero() {
    const heroClasses = [
      HERO_CLASSES.PALADIN,
      HERO_CLASSES.RANGER,
      HERO_CLASSES.MAGE,
      HERO_CLASSES.BERSERKER,
      HERO_CLASSES.PRIEST
    ];
    
    const randomClass = heroClasses[Math.floor(Math.random() * heroClasses.length)];
    const hero = addHero(this.x, this.y, this.faction, randomClass);
    
    createParticleExplosion(this.x, this.y, "#ff6b6b", 60);
    console.log(`Hero summoned: ${randomClass}`);
  }

  // NOUVEAU : Rituel rébellion
  factionRebellion() {
    territories.forEach(territory => {
      if (territory.contains(this.x, this.y) && territory.faction === FACTIONS.CRUSADER) {
        territory.setFaction(FACTIONS.PAGAN);
        currentGod.territoriesConverted++;
        giveHeroesExperience(this.faction, 80);
        createParticleExplosion(
          territory.x + territory.width / 2,
          territory.y + territory.height / 2,
          "#00ff88",
          60
        );
      }
    });
  }

  // NOUVEAU : Vérifier combos avec autres rituels
  checkCombo() {
    if (!(Array.isArray(window.researchedTechs) && window.researchedTechs.includes("DIVINE_FAVOR"))) return;

    activeRituals.forEach(other => {
      if (other !== this && other.active && !other.completed) {
        const dist = Math.hypot(this.x - other.x, this.y - other.y);
        if (dist < 140) {
          this.comboMultiplier = 2;
          // Glow visuel plus fort
          this.color = "#ffffff"; // Temporairement blanc intense
          setTimeout(() => { this.color = this.originalColor || this.color; }, 1000);
        }
      }
    });
  }

  draw(ctx) {
    if (!this.active && !this.completed) return;

    this.checkCombo(); // Vérification combo chaque frame

    ctx.save();
    
    // Lueur pulsante + combo boost
    const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
    ctx.globalAlpha = pulse * 0.4 * this.comboMultiplier;
    
    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(1, "transparent");
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.globalAlpha = 1.0;
    
    // Cercles concentriques animés
    const rotationSpeed = Date.now() / 1000;
    for (let i = 0; i < 3; i++) {
      const radius = this.radius * (0.3 + i * 0.25);
      const rotation = rotationSpeed + i * Math.PI / 3;
      
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = (0.6 - i * 0.15) * this.comboMultiplier;
      
      ctx.beginPath();
      for (let j = 0; j < 6; j++) {
        const angle = (j * Math.PI / 3) + rotation;
        const x = this.x + Math.cos(angle) * radius;
        const y = this.y + Math.sin(angle) * radius;
        
        if (j === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.stroke();
    }
    
    ctx.globalAlpha = 1.0;
    
    // Icône du rituel
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff";
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 15 * this.comboMultiplier;
    ctx.fillText(this.icon, this.x, this.y);
    ctx.shadowBlur = 0;
    
    // Barre de progression
    const barWidth = 100;
    const barHeight = 8;
    const barX = this.x - barWidth / 2;
    const barY = this.y - this.radius - 20;
    
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    const progressPercent = this.progress / this.duration;
    ctx.fillStyle = this.color;
    ctx.fillRect(barX, barY, barWidth * progressPercent, barHeight);
    
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
    
    // Texte de description + combo info
    ctx.fillStyle = "#fff";
    ctx.font = "12px Arial";
    ctx.fillText(this.description, this.x, barY - 10);
    if (this.comboMultiplier > 1) {
      ctx.fillStyle = "#ffff00";
      ctx.fillText("COMBO x2 !", this.x, barY - 25);
    }
    
    // Dessiner les particules
    this.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    
    ctx.restore();
  }

  cancel() {
    this.active = false;
    this.completed = false;
  }
}

// Types de rituels
const RITUAL_TYPES = {
  SUMMON_WARRIORS: "summon_warriors",
  DIVINE_BLESSING: "divine_blessing",
  MASS_HEAL: "mass_heal",
  SMITE_AREA: "smite_area",
  CONVERT_TERRITORY: "convert_territory",
  SUMMON_HERO: "summon_hero",
  FACTION_REBELLION: "faction_rebellion"
};

// Gestionnaire de rituels
const activeRituals = [];

function startRitual(type, x, y, faction) {
  // Vérification tech pour certains rituels
  if (type === RITUAL_TYPES.FACTION_REBELLION && !(Array.isArray(window.researchedTechs) && window.researchedTechs.includes("CRUSADER_PURGE"))) {
    console.log("Rituel Faction Rebellion verrouillé - Recherche Crusader Purge");
    return null;
  }

  const ritual = new Ritual(type, x, y, faction);
  
  // Vérifier et consommer les ressources
  if (ritual.cost) {
    const resourceCost = {};
    if (ritual.cost.faith) resourceCost[RESOURCES.FAITH] = ritual.cost.faith;
    if (ritual.cost.gold) resourceCost[RESOURCES.GOLD] = ritual.cost.gold;
    
    if (!hasResources(resourceCost)) {
      console.log("Not enough resources for ritual!");
      return null;
    }
    
    if (!consumeResources(resourceCost)) {
      return null;
    }
  }
  
  activeRituals.push(ritual);
  console.log(`Ritual started: ${type} at (${x}, ${y})`);
  return ritual;
}

function updateAllRituals(deltaTime) {
  activeRituals.forEach(ritual => ritual.update(deltaTime));
  
  // Retirer les rituels terminés après 2 secondes
  for (let i = activeRituals.length - 1; i >= 0; i--) {
    if (activeRituals[i].completed) {
      setTimeout(() => {
        const index = activeRituals.indexOf(activeRituals[i]);
        if (index > -1) activeRituals.splice(index, 1);
      }, 2000);
    }
  }
}

function drawAllRituals(ctx) {
  activeRituals.forEach(ritual => ritual.draw(ctx));
}

function cancelAllRituals() {
  activeRituals.forEach(ritual => ritual.cancel());
  activeRituals.length = 0;
}
