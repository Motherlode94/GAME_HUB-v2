/**
 * ════════════════════════════════════════════════════════════════════
 * GUIDE D'INTÉGRATION - SYSTÈME DE CRÉATURES POKÉMON/DIGIMON
 * ════════════════════════════════════════════════════════════════════
 */

/**
 * ÉTAPE 1: Charger les fichiers dans l'ordre
 * ═══════════════════════════════════════════
 * Dans votre index.html, ajoutez les scripts dans cet ordre :
 */

/*
<!-- Système de base -->
<script src="EventEmitter.js"></script>
<script src="creature.js"></script>

<!-- Nouveaux systèmes -->
<script src="typeSystem.js"></script>
<script src="creatureDatabase.js"></script>
<script src="evolutionSystem.js"></script>

<!-- Votre jeu -->
<script src="game.js"></script>
*/

/**
 * ÉTAPE 2: Initialiser le système
 * ════════════════════════════════
 */

class Game {
    init() {
        // Vérifier que tout est chargé
        if (!window.CREATURE_TEMPLATES) {
            console.error('⚠️ Base de données de créatures non chargée');
            return;
        }
        
        if (!window.TYPE_EFFECTIVENESS) {
            console.error('⚠️ Système de types non chargé');
            return;
        }

        console.log('✅ Système de créatures initialisé');
        console.log(`   - ${Object.keys(window.CREATURE_TEMPLATES).length} créatures disponibles`);
        console.log(`   - ${Object.keys(window.TYPE_EFFECTIVENESS).length} types`);
        
        // Créer votre équipe de départ
        this.playerTeam = this.createStarterTeam();
    }

    /**
     * Créer une équipe de départ
     */
    createStarterTeam() {
        const starters = ['pikaflame', 'aquatle', 'verdantia'];
        const team = [];

        // Le joueur choisit un starter
        const chosenStarter = starters[0]; // Ou via UI
        const starterTemplate = window.CREATURE_TEMPLATES[chosenStarter];
        const starterCreature = new Creature(starterTemplate, false);
        
        team.push(starterCreature);
        
        return team;
    }
}

/**
 * ÉTAPE 3: Créer et utiliser des créatures
 * ═════════════════════════════════════════
 */

// Exemple 1: Créer une créature depuis un template
function createCreature(templateId, isEnemy = false) {
    const template = window.CREATURE_TEMPLATES[templateId];
    
    if (!template) {
        console.error(`❌ Créature introuvable: ${templateId}`);
        return null;
    }
    
    const creature = new Creature(template, isEnemy);
    console.log(`✅ Créature créée: ${creature.name} (${creature.type})`);
    
    return creature;
}

// Exemple 2: Créer une équipe ennemie aléatoire
function createRandomEnemyTeam(count = 3, difficultyLevel = 1) {
    const allCreatures = Object.keys(window.CREATURE_TEMPLATES);
    const team = [];
    
    for (let i = 0; i < count; i++) {
        const randomId = allCreatures[Math.floor(Math.random() * allCreatures.length)];
        const creature = createCreature(randomId, true);
        
        // Appliquer bonus de difficulté
        if (creature) {
            creature.applyDifficultyBonus(difficultyLevel);
            team.push(creature);
        }
    }
    
    return team;
}

// Exemple 3: Créer un boss légendaire
function createBossEncounter() {
    const legendaries = ['omegamon', 'mewtwo_x', 'imperialdramon'];
    const bossId = legendaries[Math.floor(Math.random() * legendaries.length)];
    
    const boss = createCreature(bossId, true);
    boss.applyDifficultyBonus(5); // Boss très puissant
    
    return boss;
}

/**
 * ÉTAPE 4: Système de combat
 * ═══════════════════════════
 */

class BattleSystem {
    constructor(playerCreature, enemyCreature) {
        this.player = playerCreature;
        this.enemy = enemyCreature;
        this.turn = 0;
        this.battleLog = [];
    }

    /**
     * Exécuter un tour de combat
     */
    executeTurn(playerSkillIndex, enemySkillIndex) {
        this.turn++;
        
        // Recharger l'énergie
        this.player.rechargeEnergy();
        this.enemy.rechargeEnergy();
        
        // Vérifier qui attaque en premier (basé sur la vitesse)
        const playerFirst = this.player.speed >= this.enemy.speed;
        
        if (playerFirst) {
            this.executeAttack(this.player, this.enemy, playerSkillIndex);
            if (this.enemy.isAlive) {
                this.executeAttack(this.enemy, this.player, enemySkillIndex);
            }
        } else {
            this.executeAttack(this.enemy, this.player, enemySkillIndex);
            if (this.player.isAlive) {
                this.executeAttack(this.player, this.enemy, playerSkillIndex);
            }
        }
        
        // Traiter les effets de statut
        this.player.processStatusEffects();
        this.enemy.processStatusEffects();
        
        // Vérifier la fin du combat
        return this.checkBattleEnd();
    }

    /**
     * Exécuter une attaque
     */
    executeAttack(attacker, defender, skillIndex) {
        const skill = attacker.skills[skillIndex];
        
        if (!skill) {
            console.error('Compétence invalide');
            return;
        }
        
        // Vérifier si peut attaquer
        const canActCheck = attacker.canAct();
        if (!canActCheck.canAct) {
            this.addLog(`${attacker.name} ne peut pas agir! (${canActCheck.reason})`);
            return;
        }
        
        // Utiliser la compétence
        if (!attacker.useSkill(skill)) {
            this.addLog(`${attacker.name} n'a pas assez d'énergie!`);
            return;
        }
        
        this.addLog(`${attacker.name} utilise ${skill.name}!`);
        
        // Appliquer les effets de la compétence
        this.applySkillEffects(attacker, defender, skill);
    }

    /**
     * Appliquer les effets d'une compétence
     */
    applySkillEffects(attacker, defender, skill) {
        // Dégâts
        if (skill.power > 0) {
            const isCritical = Math.random() * 100 < attacker.critRate;
            const damage = this.calculateDamage(attacker, defender, skill, isCritical);
            
            const result = defender.takeDamage(damage, skill.type, isCritical);
            
            // Message de dégâts
            let message = `${defender.name} subit ${result.damage} dégâts`;
            
            if (result.effectiveness > 1) {
                message += ' (Super efficace!)';
            } else if (result.effectiveness < 1 && result.effectiveness > 0) {
                message += ' (Peu efficace...)';
            } else if (result.effectiveness === 0) {
                message += ' (Aucun effet!)';
            }
            
            if (isCritical) {
                message += ' CRITIQUE!';
            }
            
            this.addLog(message);
        }
        
        // Soins
        if (skill.heal) {
            const healAmount = Math.floor(attacker.maxHP * skill.heal / 100);
            attacker.heal(healAmount);
            this.addLog(`${attacker.name} récupère ${healAmount} PV!`);
        }
        
        // Bouclier
        if (skill.shield) {
            attacker.addShield(skill.shield);
            this.addLog(`${attacker.name} gagne un bouclier de ${skill.shield}!`);
        }
        
        // Effets de statut
        if (skill.effect && Math.random() * 100 < (skill.effectChance || 100)) {
            defender.addStatusEffect(skill.effect);
            this.addLog(`${defender.name} est affecté par ${skill.effect}!`);
        }
        
        // Buffs/Debuffs
        if (skill.selfBuff) {
            this.applyStatChanges(attacker, skill.selfBuff);
        }
    }

    /**
     * Calculer les dégâts
     */
    calculateDamage(attacker, defender, skill, isCritical) {
        let damage = skill.power + attacker.attack;
        
        // Modificateur de critique
        if (isCritical) {
            damage *= 1.5;
        }
        
        // Variation aléatoire (85%-100%)
        damage = Math.floor(damage * (0.85 + Math.random() * 0.15));
        
        return damage;
    }

    /**
     * Vérifier la fin du combat
     */
    checkBattleEnd() {
        if (!this.player.isAlive) {
            return { ended: true, winner: 'enemy', message: 'Vous avez perdu...' };
        }
        
        if (!this.enemy.isAlive) {
            return { ended: true, winner: 'player', message: 'Victoire!' };
        }
        
        return { ended: false };
    }

    /**
     * Ajouter au log de combat
     */
    addLog(message) {
        this.battleLog.push(message);
        console.log(`[Combat] ${message}`);
    }
}

/**
 * ÉTAPE 5: Système d'évolution
 * ═════════════════════════════
 */

class EvolutionManager {
    constructor() {
        this.playerStats = {
            level: 1,
            battlesWon: 0,
            happiness: 50
        };
    }

    /**
     * Vérifier et déclencher l'évolution
     */
    checkEvolution(creature) {
        const canEvolve = window.EVOLUTION_SYSTEM.canEvolve(
            creature,
            this.playerStats
        );
        
        if (!canEvolve) {
            return null;
        }
        
        // Afficher dialogue d'évolution
        const evolutionData = window.EVOLUTION_SYSTEM.evolve(creature);
        
        if (evolutionData) {
            console.log(`🌟 ${evolutionData.previousForm} évolue en ${evolutionData.newForm}!`);
            this.showEvolutionAnimation(evolutionData);
            return evolutionData.evolved;
        }
        
        return null;
    }

    /**
     * Animation d'évolution
     */
    showEvolutionAnimation(evolutionData) {
        // Ici, vous pouvez ajouter votre animation
        console.log(`
            ╔════════════════════════════╗
            ║   ÉVOLUTION EN COURS...    ║
            ║                            ║
            ║  ${evolutionData.previousForm.padEnd(10)} ➜ ${evolutionData.newForm.padEnd(10)}  ║
            ║                            ║
            ╚════════════════════════════╝
        `);
    }

    /**
     * Incrémenter les stats après combat
     */
    afterBattle(won, gainedExp) {
        if (won) {
            this.playerStats.battlesWon++;
        }
        
        // Système d'expérience simple
        const expForNextLevel = this.playerStats.level * 100;
        if (gainedExp >= expForNextLevel) {
            this.playerStats.level++;
            console.log(`🎉 Niveau ${this.playerStats.level} atteint!`);
        }
    }
}

/**
 * ÉTAPE 6: Interface utilisateur (exemple)
 * ═════════════════════════════════════════
 */

class BattleUI {
    /**
     * Afficher les infos d'une créature
     */
    displayCreatureInfo(creature, x, y, ctx) {
        // Nom et type
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.fillText(creature.name, x, y);
        
        // Type avec couleur
        const typeColor = window.TYPE_COLORS[creature.type] || '#ffffff';
        ctx.fillStyle = typeColor;
        ctx.font = '18px Arial';
        ctx.fillText(`${window.TYPE_ICONS[creature.type]} ${creature.type.toUpperCase()}`, x, y + 25);
        
        // Barre de vie
        this.drawHealthBar(creature, x, y + 40, 200, 20, ctx);
        
        // Barre d'énergie
        this.drawEnergyBar(creature, x, y + 70, 200, 15, ctx);
        
        // Icône de la créature
        ctx.font = '64px Arial';
        ctx.fillText(creature.icon, x + 250, y + 40);
        
        // Effets de statut
        this.drawStatusEffects(creature, x, y + 100, ctx);
    }

    /**
     * Dessiner barre de vie
     */
    drawHealthBar(creature, x, y, width, height, ctx) {
        const hpPercent = creature.getHPPercent();
        
        // Fond
        ctx.fillStyle = '#333333';
        ctx.fillRect(x, y, width, height);
        
        // Couleur selon les PV
        let color = '#00ff00';
        if (hpPercent < 50) color = '#ffaa00';
        if (hpPercent < 25) color = '#ff0000';
        
        // Barre de vie
        ctx.fillStyle = color;
        ctx.fillRect(x, y, (width * hpPercent) / 100, height);
        
        // Bordure
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
        
        // Texte
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.fillText(`${creature.currentHP}/${creature.maxHP}`, x + 5, y + 14);
    }

    /**
     * Dessiner barre d'énergie
     */
    drawEnergyBar(creature, x, y, width, height, ctx) {
        const energyPercent = creature.getEnergyPercent();
        
        // Fond
        ctx.fillStyle = '#222222';
        ctx.fillRect(x, y, width, height);
        
        // Barre d'énergie
        ctx.fillStyle = '#00aaff';
        ctx.fillRect(x, y, (width * energyPercent) / 100, height);
        
        // Bordure
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
        
        // Texte
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px Arial';
        ctx.fillText(`⚡${creature.currentEnergy}/${creature.maxEnergy}`, x + 5, y + 11);
    }

    /**
     * Afficher effets de statut
     */
    drawStatusEffects(creature, x, y, ctx) {
        if (creature.statusEffects.length === 0) return;
        
        ctx.font = '20px Arial';
        let offsetX = 0;
        
        for (const effect of creature.statusEffects) {
            ctx.fillStyle = effect.color || '#ffffff';
            ctx.fillText(effect.icon, x + offsetX, y);
            offsetX += 30;
        }
    }

    /**
     * Menu de sélection de compétences
     */
    displaySkillMenu(creature, x, y, ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(x, y, 400, 300);
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, 400, 300);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Arial';
        ctx.fillText('Choisissez une compétence', x + 20, y + 30);
        
        // Liste des compétences
        creature.skills.forEach((skill, index) => {
            const canUse = creature.canUseSkill(skill);
            const skillY = y + 70 + (index * 50);
            
            // Couleur selon disponibilité
            ctx.fillStyle = canUse ? '#ffffff' : '#666666';
            
            // Nom et type
            const typeIcon = window.TYPE_ICONS[skill.type] || '';
            ctx.fillText(`[${index + 1}] ${typeIcon} ${skill.name}`, x + 20, skillY);
            
            // Coût en énergie
            ctx.font = '16px Arial';
            ctx.fillText(`⚡${skill.cost} | ⚔️${skill.power}`, x + 250, skillY);
            
            ctx.font = 'bold 20px Arial';
        });
    }
}

/**
 * ÉTAPE 7: Exemple d'utilisation complète
 * ════════════════════════════════════════
 */

// Initialiser le jeu
const game = new Game();
game.init();

// Créer un combat
const playerCreature = createCreature('pikaflame', false);
const enemyCreature = createCreature('aquatle', true);

const battle = new BattleSystem(playerCreature, enemyCreature);
const battleUI = new BattleUI();

// Boucle de jeu
function gameLoop(ctx, canvas) {
    // Afficher les créatures
    battleUI.displayCreatureInfo(playerCreature, 50, 50, ctx);
    battleUI.displayCreatureInfo(enemyCreature, canvas.width - 350, 50, ctx);
    
    // Menu de compétences
    battleUI.displaySkillMenu(playerCreature, 50, 400, ctx);
}

console.log(`
╔════════════════════════════════════════════════════════════════╗
║                  SYSTÈME DE CRÉATURES CHARGÉ                   ║
║                                                                ║
║  🎮 Créatures disponibles: ${Object.keys(window.CREATURE_TEMPLATES).length.toString().padStart(2)}                                ║
║  ⚡ Types de Pokémon: 18                                       ║
║  💾 Types de Digimon: 2 (light, digital)                       ║
║  🌟 Créatures légendaires: 3                                   ║
║  📈 Système d'évolution: Actif                                 ║
║                                                                ║
║  Prêt à capturer et combattre!                                ║
╚════════════════════════════════════════════════════════════════╝
`);