// ============================================
// DONNÉES DU JEU
// ============================================

const CREATURE_TEMPLATES = [
    {
        id: 1,
        name: "Verdura",
        type: "plant",
        icon: "🌿",
        baseHP: 120,
        baseAttack: 35,
        baseDefense: 50,
        baseSpeed: 25,
        critRate: 10,
        skills: [
            { name: "Fouet Liane", damage: 40, cost: 2, description: "Attaque simple avec des lianes" },
            { name: "Synthèse", damage: 0, heal: 35, cost: 3, description: "Soigne grâce au soleil" },
            { name: "Épines Toxiques", damage: 55, cost: 4, description: "Attaque empoisonnée", statusEffect: "poison", statusChance: 70 },
            { name: "MÉGA FLORE", damage: 120, cost: 6, description: "⭐ ULTIME - Explosion florale dévastatrice", isUltimate: true }
        ]
    },
    {
        id: 2,
        name: "Flamora",
        type: "fire",
        icon: "🔥",
        baseHP: 100,
        baseAttack: 60,
        baseDefense: 30,
        baseSpeed: 35,
        critRate: 15,
        skills: [
            { name: "Flammèche", damage: 45, cost: 2, description: "Petit jet de flamme" },
            { name: "Boule de Feu", damage: 75, cost: 4, description: "Boule de feu", statusEffect: "burn", statusChance: 50 },
            { name: "Explosion", damage: 90, cost: 5, description: "Explosion massive" },
            { name: "ENFER ARDENT", damage: 140, cost: 6, description: "⭐ ULTIME - Inferno dévastateur", isUltimate: true }
        ]
    },
    {
        id: 3,
        name: "Aqualis",
        type: "water",
        icon: "💧",
        baseHP: 110,
        baseAttack: 45,
        baseDefense: 40,
        baseSpeed: 30,
        critRate: 12,
        skills: [
            { name: "Jet d'Eau", damage: 50, cost: 2, description: "Jet d'eau puissant" },
            { name: "Vague", damage: 60, cost: 3, description: "Grande vague déferlante" },
            { name: "Hydrocanon", damage: 80, cost: 5, description: "Canon d'eau ultra-puissant" },
            { name: "TSUNAMI", damage: 130, cost: 6, description: "⭐ ULTIME - Vague gigantesque", isUltimate: true }
        ]
    },
    {
        id: 4,
        name: "Voltix",
        type: "electric",
        icon: "⚡",
        baseHP: 90,
        baseAttack: 55,
        baseDefense: 25,
        baseSpeed: 45,
        critRate: 20,
        skills: [
            { name: "Éclair", damage: 45, cost: 2, description: "Éclair rapide" },
            { name: "Tonnerre", damage: 70, cost: 4, description: "Coup de tonnerre", statusEffect: "paralyze", statusChance: 60 },
            { name: "Charge Électrique", damage: 55, cost: 3, description: "Charge électrique rapide" },
            { name: "TEMPÊTE ÉLECTRIQUE", damage: 135, cost: 6, description: "⭐ ULTIME - Orage destructeur", isUltimate: true }
        ]
    },
    {
        id: 5,
        name: "Terros",
        type: "earth",
        icon: "🪨",
        baseHP: 130,
        baseAttack: 40,
        baseDefense: 60,
        baseSpeed: 20,
        critRate: 8,
        skills: [
            { name: "Jet de Roche", damage: 40, cost: 2, description: "Lance des rochers" },
            { name: "Séisme", damage: 65, cost: 4, description: "Tremblement de terre puissant" },
            { name: "Mur de Pierre", damage: 0, shield: 40, cost: 3, description: "Crée un bouclier de pierre" },
            { name: "CATACLYSME", damage: 125, cost: 6, description: "⭐ ULTIME - Séisme dévastateur", isUltimate: true }
        ]
    },
    {
        id: 6,
        name: "Florax",
        type: "plant",
        icon: "🌺",
        baseHP: 115,
        baseAttack: 38,
        baseDefense: 45,
        baseSpeed: 28,
        critRate: 10,
        skills: [
            { name: "Pétale Tranchant", damage: 42, cost: 2, description: "Pétales acérés" },
            { name: "Parfum Apaisant", damage: 0, heal: 30, cost: 3, description: "Parfum qui soigne" },
            { name: "Tempête Florale", damage: 60, cost: 4, description: "Tempête de fleurs", statusEffect: "poison", statusChance: 50 },
            { name: "JARDIN ÉTERNEL", damage: 115, cost: 6, description: "⭐ ULTIME - Explosion de vie", isUltimate: true }
        ]
    },
    {
        id: 7,
        name: "Pyrok",
        type: "fire",
        icon: "🌋",
        baseHP: 95,
        baseAttack: 65,
        baseDefense: 28,
        baseSpeed: 38,
        critRate: 18,
        skills: [
            { name: "Lance-Flammes", damage: 50, cost: 2, description: "Jet de flammes continu" },
            { name: "Météore", damage: 85, cost: 5, description: "Météore enflammé" },
            { name: "Chaleur Intense", damage: 55, cost: 3, description: "Vague de chaleur", statusEffect: "burn", statusChance: 60 },
            { name: "ÉRUPTION VOLCANIQUE", damage: 145, cost: 6, description: "⭐ ULTIME - Explosion volcanique", isUltimate: true }
        ]
    },
    {
        id: 8,
        name: "Glacior",
        type: "water",
        icon: "❄️",
        baseHP: 105,
        baseAttack: 48,
        baseDefense: 42,
        baseSpeed: 32,
        critRate: 12,
        skills: [
            { name: "Rayon de Glace", damage: 45, cost: 2, description: "Rayon glacé" },
            { name: "Blizzard", damage: 70, cost: 4, description: "Tempête de glace", statusEffect: "freeze", statusChance: 50 },
            { name: "Bouclier de Glace", damage: 0, shield: 35, cost: 3, description: "Protection glacée" },
            { name: "ÈRE GLACIAIRE", damage: 128, cost: 6, description: "⭐ ULTIME - Froid absolu", isUltimate: true }
        ]
    }
];

const TYPE_EFFECTIVENESS = {
    fire: { plant: 1.5, water: 0.7, fire: 1, electric: 1, earth: 1 },
    water: { fire: 1.5, plant: 0.7, water: 1, electric: 0.7, earth: 1 },
    plant: { water: 1.5, fire: 0.7, plant: 1, electric: 1, earth: 1 },
    electric: { water: 1.5, earth: 0.7, electric: 1, fire: 1, plant: 1 },
    earth: { electric: 1.5, water: 1, earth: 1, fire: 1, plant: 1 }
};

// SYSTÈME DE NIVEAUX DE DIFFICULTÉ
const DIFFICULTY_LEVELS = {
    easy: { name: "Facile", enemyLevelBonus: 0, enemyGoldMultiplier: 1 },
    normal: { name: "Normal", enemyLevelBonus: 2, enemyGoldMultiplier: 1.5 },
    hard: { name: "Difficile", enemyLevelBonus: 5, enemyGoldMultiplier: 2 },
    expert: { name: "Expert", enemyLevelBonus: 10, enemyGoldMultiplier: 3 }
};

const STATUS_EFFECTS = {
    poison: { name: "Empoisonné", icon: "☠️", damagePerTurn: 10, duration: 3, color: "#9c27b0" },
    burn: { name: "Brûlé", icon: "🔥", damagePerTurn: 12, duration: 3, color: "#ff5722" },
    paralyze: { name: "Paralysé", icon: "⚡", skipChance: 50, duration: 2, color: "#ffc107" },
    freeze: { name: "Gelé", icon: "❄️", skipChance: 100, duration: 1, color: "#03a9f4" }
};

// ============================================
// ÉTAT DU JEU
// ============================================

let gameState = {
    screen: 'start',
    playerTeam: [],
    difficulty: 'normal',
    enemyTeam: [],
    currentRound: 1,
    currentTurn: 'player',
    selectedCreature: null,
    selectedSkill: null,
    battleLog: [],
    comboCount: 0,
    lastAttacker: null,
    bestScores: {
        easy: 0,
        normal: 0,
        hard: 0,
        expert: 0
    }
};

// ============================================
// CLASSE CRÉATURE
// ============================================

class Creature {
    constructor(template, isEnemy = false) {
        this.id = `${template.id}_${Date.now()}_${Math.random()}`;
        this.name = template.name;
        this.type = template.type;
        this.icon = template.icon;
        this.maxHP = template.baseHP;
        this.currentHP = template.baseHP;
        this.attack = template.baseAttack;
        this.defense = template.baseDefense;
        this.speed = template.baseSpeed;
        this.critRate = template.critRate || 10;
        this.skills = JSON.parse(JSON.stringify(template.skills));
        this.maxEnergy = 6; // Augmenté pour les ultimes
        this.currentEnergy = isEnemy ? 3 : 6;
        this.isAlive = true;
        this.isEnemy = isEnemy;
        this.shield = 0;
        this.statusEffects = [];
        this.hasUsedUltimate = false;
    }

    takeDamage(damage, attackerType, isCritical = false) {
        const effectiveness = TYPE_EFFECTIVENESS[attackerType][this.type];
        let finalDamage = Math.max(1, Math.floor(damage * effectiveness - this.defense * 0.3));
        
        if (isCritical) {
            finalDamage = Math.floor(finalDamage * 1.5);
        }
        
        // Appliquer le bouclier
        if (this.shield > 0) {
            if (finalDamage <= this.shield) {
                this.shield -= finalDamage;
                finalDamage = 0;
            } else {
                finalDamage -= this.shield;
                this.shield = 0;
            }
        }
        
        this.currentHP = Math.max(0, this.currentHP - finalDamage);
        if (this.currentHP === 0) {
            this.isAlive = false;
        }
        
        return { damage: finalDamage, effectiveness: effectiveness, isCritical: isCritical };
    }

    heal(amount) {
        const actualHeal = Math.min(amount, this.maxHP - this.currentHP);
        this.currentHP += actualHeal;
        return actualHeal;
    }

    addShield(amount) {
        this.shield += amount;
        return amount;
    }

    useSkill(skill) {
        if (this.currentEnergy >= skill.cost) {
            this.currentEnergy -= skill.cost;
            return true;
        }
        return false;
    }

    rechargeEnergy() {
        this.currentEnergy = Math.min(this.maxEnergy, this.currentEnergy + 2);
    }

    addStatusEffect(effectType) {
        const effect = STATUS_EFFECTS[effectType];
        if (!effect) return false;

        // Vérifier si l'effet existe déjà
        const existing = this.statusEffects.find(e => e.type === effectType);
        if (existing) {
            existing.duration = effect.duration; // Renouveler la durée
            return false;
        }

        this.statusEffects.push({
            type: effectType,
            duration: effect.duration,
            ...effect
        });
        return true;
    }

    processStatusEffects() {
        const results = [];
        
        this.statusEffects = this.statusEffects.filter(effect => {
            effect.duration--;
            
            if (effect.duration <= 0) {
                results.push({ type: 'expired', effect: effect.name });
                return false;
            }

            // Dégâts sur la durée
            if (effect.damagePerTurn) {
                const damage = effect.damagePerTurn;
                this.currentHP = Math.max(0, this.currentHP - damage);
                results.push({ type: 'damage', effect: effect.name, damage: damage, icon: effect.icon });
                
                if (this.currentHP === 0) {
                    this.isAlive = false;
                }
            }

            // Chance de skip le tour
            if (effect.skipChance && Math.random() * 100 < effect.skipChance) {
                results.push({ type: 'skip', effect: effect.name, icon: effect.icon });
            }

            return true;
        });

        return results;
    }

    canAct() {
        // Vérifier si paralysé ou gelé
        for (const effect of this.statusEffects) {
            if (effect.skipChance && Math.random() * 100 < effect.skipChance) {
                return false;
            }
        }
        return true;
    }
}

// ============================================
// INITIALISATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initializeGame();
    setupEventListeners();
});

function initializeGame() {
    showScreen('start');
    loadBestScores(); // <-- AJOUTER ICI
}

// AJOUTER cette fonction après initializeGame
function loadBestScores() {
    const saved = localStorage.getItem('battleCreaturesBestScores');
    if (saved) {
        gameState.bestScores = JSON.parse(saved);
    }
}

function saveBestScore(difficulty, rounds) {
    if (rounds > gameState.bestScores[difficulty]) {
        gameState.bestScores[difficulty] = rounds;
        localStorage.setItem('battleCreaturesBestScores', JSON.stringify(gameState.bestScores));
        return true; // Nouveau record
    }
    return false;
}

function setupEventListeners() {
    document.getElementById('start-btn').addEventListener('click', () => {
        showScreen('team-selection');
        displayAvailableCreatures();
    });

    document.getElementById('tutorial-btn').addEventListener('click', showTutorial);
    document.getElementById('confirm-team-btn').addEventListener('click', startBattle);

    document.getElementById('play-again-btn').addEventListener('click', () => {
        startBattle();
    });

    document.getElementById('change-team-btn').addEventListener('click', () => {
        gameState.playerTeam = [];
        showScreen('team-selection');
        displayAvailableCreatures();
    });

    document.querySelector('.close').addEventListener('click', () => {
        document.getElementById('tutorial-modal').classList.remove('active');
    });

    document.querySelector('#tutorial-modal .btn').addEventListener('click', () => {
        document.getElementById('tutorial-modal').classList.remove('active');
    });
}

// ============================================
// GESTION DES ÉCRANS
// ============================================

function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(`${screenName}-screen`).classList.add('active');
    gameState.screen = screenName;
}

function showTutorial() {
    document.getElementById('tutorial-modal').classList.add('active');
}

// ============================================
// SÉLECTION D'ÉQUIPE
// ============================================

function displayAvailableCreatures() {
    const container = document.getElementById('available-creatures');
    container.innerHTML = '';

    CREATURE_TEMPLATES.forEach(template => {
        const card = createCreatureCard(template);
        card.addEventListener('click', () => selectCreature(template, card));
        container.appendChild(card);
    });

    // Afficher sélecteur de difficulté
const difficultySelector = document.createElement('div');
difficultySelector.className = 'difficulty-selector';
difficultySelector.innerHTML = `
    <h3>Difficulté :</h3>
    ${Object.entries(DIFFICULTY_LEVELS).map(([key, diff]) => `
        <button class="difficulty-btn ${gameState.difficulty === key ? 'active' : ''}" 
                data-difficulty="${key}">
            ${diff.name}
        </button>
    `).join('')}
`;
container.parentElement.insertBefore(difficultySelector, container);

// Event listeners
document.querySelectorAll('.difficulty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        gameState.difficulty = btn.dataset.difficulty;
        document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

    updateSelectedTeamDisplay();
}

function createCreatureCard(template) {
    const card = document.createElement('div');
    card.className = 'creature-card';
    card.dataset.id = template.id;

    card.innerHTML = `
        <div class="creature-icon">${template.icon}</div>
        <div class="creature-name">${template.name}</div>
        <div class="creature-type type-${template.type}">${getTypeName(template.type)}</div>
        <div class="creature-stats">
            <div class="stat">
                <span class="stat-label">PV</span>
                <span class="stat-value">${template.baseHP}</span>
            </div>
            <div class="stat">
                <span class="stat-label">ATK</span>
                <span class="stat-value">${template.baseAttack}</span>
            </div>
            <div class="stat">
                <span class="stat-label">DEF</span>
                <span class="stat-value">${template.baseDefense}</span>
            </div>
            <div class="stat">
                <span class="stat-label">CRIT</span>
                <span class="stat-value">${template.critRate}%</span>
            </div>
        </div>
    `;

    return card;
}

function selectCreature(template, card) {
    if (gameState.playerTeam.length >= 3 && !card.classList.contains('selected')) {
        return;
    }

    if (card.classList.contains('selected')) {
        gameState.playerTeam = gameState.playerTeam.filter(c => c.id !== template.id);
        card.classList.remove('selected');
    } else {
        gameState.playerTeam.push(template);
        card.classList.add('selected');
    }

    updateSelectedTeamDisplay();
    document.getElementById('confirm-team-btn').disabled = gameState.playerTeam.length !== 3;

    document.querySelectorAll('.creature-card').forEach(c => {
        if (gameState.playerTeam.length >= 3 && !c.classList.contains('selected')) {
            c.classList.add('disabled');
        } else {
            c.classList.remove('disabled');
        }
    });
}

function updateSelectedTeamDisplay() {
    const container = document.getElementById('selected-creatures');
    container.innerHTML = '';

    gameState.playerTeam.forEach(template => {
        const miniCard = document.createElement('div');
        miniCard.className = 'creature-card selected';
        miniCard.innerHTML = `
            <div class="creature-icon">${template.icon}</div>
            <div class="creature-name">${template.name}</div>
        `;
        container.appendChild(miniCard);
    });
}

function getTypeName(type) {
    const typeNames = {
        plant: 'Plante',
        fire: 'Feu',
        water: 'Eau',
        electric: 'Électrique',
        earth: 'Terre'
    };
    return typeNames[type];
}

// ============================================
// COMBAT
// ============================================

function startBattle() {
    gameState.playerTeam = gameState.playerTeam.map(t => new Creature(t, false));
    
    const enemyTemplates = [];
    const availableTemplates = [...CREATURE_TEMPLATES];
    for (let i = 0; i < 3; i++) {
        const randomIndex = Math.floor(Math.random() * availableTemplates.length);
        enemyTemplates.push(availableTemplates[randomIndex]);
        availableTemplates.splice(randomIndex, 1);
    }
    const difficulty = DIFFICULTY_LEVELS[gameState.difficulty];
gameState.enemyTeam = enemyTemplates.map(t => {
    const enemy = new Creature(t, true);
    // Booster directement les stats selon la difficulté
    const boost = 1 + (difficulty.enemyLevelBonus * 0.15);
    enemy.attack = Math.floor(enemy.attack * boost);
    enemy.defense = Math.floor(enemy.defense * boost);
    enemy.maxHP = Math.floor(enemy.maxHP * boost);
    enemy.currentHP = enemy.maxHP;
    enemy.critRate = Math.floor(enemy.critRate + difficulty.enemyLevelBonus);
    return enemy;
});
    gameState.currentRound = 1;
    gameState.currentTurn = 'player';
    gameState.battleLog = [];
    gameState.comboCount = 0;
    gameState.lastAttacker = null;

    showScreen('battle');
    displayBattle();
    addLogEntry('⚔️ Le combat commence !', 'info');
}

function displayBattle() {
    displayTeam(gameState.playerTeam, 'player-creatures');
    displayTeam(gameState.enemyTeam, 'enemy-creatures');
    updateRoundInfo();
    updateActionPanel();
    updateBattleLog();
}

function displayTeam(team, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    team.forEach(creature => {
        const card = createBattleCreatureCard(creature);
        container.appendChild(card);
    });
}

function createBattleCreatureCard(creature) {
    const card = document.createElement('div');
    card.className = 'battle-creature';
    card.dataset.id = creature.id;
    
    if (!creature.isAlive) {
        card.classList.add('dead');
    }

    const hpPercent = (creature.currentHP / creature.maxHP) * 100;
    const energyPercent = (creature.currentEnergy / creature.maxEnergy) * 100;

    // Afficher les effets de statut
    let statusHTML = '';
    if (creature.statusEffects.length > 0) {
        statusHTML = '<div class="status-effects">';
        creature.statusEffects.forEach(effect => {
            statusHTML += `<span class="status-icon" style="color: ${effect.color}" title="${effect.name} (${effect.duration} tours)">${effect.icon}</span>`;
        });
        statusHTML += '</div>';
    }

    card.innerHTML = `
        <div class="battle-creature-icon">${creature.icon}</div>
        <div class="battle-creature-info">
            <div class="battle-creature-name">${creature.name}</div>
            <div class="creature-type type-${creature.type}">${getTypeName(creature.type)}</div>
            ${statusHTML}
            <div class="health-bar">
                <div class="health-fill" style="width: ${hpPercent}%"></div>
                <div class="bar-text">${creature.currentHP}/${creature.maxHP}</div>
            </div>
            <div class="energy-bar">
                <div class="energy-fill" style="width: ${energyPercent}%"></div>
                <div class="bar-text">⚡ ${creature.currentEnergy}/${creature.maxEnergy}</div>
            </div>
            ${creature.shield > 0 ? `<div class="shield-indicator">🛡️ Bouclier: ${creature.shield}</div>` : ''}
        </div>
    `;

    return card;
}

function updateRoundInfo() {
    document.getElementById('round-counter').textContent = `Round ${gameState.currentRound}`;
    const indicator = document.getElementById('turn-indicator');
    
    if (gameState.comboCount > 0) {
        indicator.textContent = `${gameState.currentTurn === 'player' ? 'Votre tour' : 'Tour ennemi'} - 🔥 COMBO x${gameState.comboCount}!`;
        indicator.style.color = '#ff5722';
    } else {
        indicator.textContent = gameState.currentTurn === 'player' ? 'Votre tour' : 'Tour ennemi';
        indicator.style.color = gameState.currentTurn === 'player' ? '#4caf50' : '#f44336';
    }
}

function updateActionPanel() {
    const container = document.getElementById('skills-container');
    container.innerHTML = '';

    if (gameState.currentTurn === 'player') {
        const aliveCreatures = gameState.playerTeam.filter(c => c.isAlive);
        
        if (aliveCreatures.length === 0) {
            endBattle(false);
            return;
        }

        const currentCreature = aliveCreatures[0];
        
        // Vérifier si la créature peut agir
        if (!currentCreature.canAct()) {
            const skipEffect = currentCreature.statusEffects.find(e => e.skipChance);
            if (skipEffect) {
                addLogEntry(`${currentCreature.name} est ${skipEffect.name} et ne peut pas agir! ${skipEffect.icon}`, 'info');
                setTimeout(() => nextTurn(), 1500);
                return;
            }
        }

        currentCreature.skills.forEach(skill => {
            const button = document.createElement('button');
            button.className = 'skill-btn';
            
            if (skill.isUltimate) {
                button.classList.add('ultimate-skill');
            }
            
            button.disabled = currentCreature.currentEnergy < skill.cost;
            
            button.innerHTML = `
                <div class="skill-name ${skill.isUltimate ? 'ultimate-name' : ''}">${skill.name}</div>
                <div class="skill-cost">Coût: ${skill.cost} ⚡</div>
                <div class="skill-description">${skill.description}</div>
            `;

            button.addEventListener('click', () => {
                gameState.selectedCreature = currentCreature;
                gameState.selectedSkill = skill;
                selectTarget(skill);
            });

            container.appendChild(button);
        });

        highlightActiveCreature(currentCreature);
    }
}

function highlightActiveCreature(creature) {
    document.querySelectorAll('.battle-creature').forEach(card => {
        card.classList.remove('active');
    });

    const card = document.querySelector(`.battle-creature[data-id="${creature.id}"]`);
    if (card) {
        card.classList.add('active');
    }
}

function selectTarget(skill) {
    const targetTeam = skill.heal || skill.shield ? gameState.playerTeam : gameState.enemyTeam;
    const aliveTargets = targetTeam.filter(c => c.isAlive);

    if (aliveTargets.length === 0) {
        return;
    }

    if (skill.heal || skill.shield) {
        executeSkill(gameState.selectedCreature, aliveTargets[0], skill);
        return;
    }

    const container = document.getElementById('enemy-creatures');
    const enemyCards = container.querySelectorAll('.battle-creature');

    enemyCards.forEach(card => {
        const enemyId = card.dataset.id;
        const enemy = gameState.enemyTeam.find(c => c.id === enemyId);

        if (enemy && enemy.isAlive) {
            card.classList.add('targetable');
            
            const handler = () => {
                executeSkill(gameState.selectedCreature, enemy, skill);
                enemyCards.forEach(c => {
                    c.classList.remove('targetable');
                    c.replaceWith(c.cloneNode(true));
                });
                displayTeam(gameState.enemyTeam, 'enemy-creatures');
            };

            card.addEventListener('click', handler, { once: true });
        }
    });
}

function executeSkill(attacker, target, skill) {
    if (!attacker.useSkill(skill)) {
        return;
    }

    // Animation et effet visuel
    createParticleEffect(target, skill);

    if (skill.damage) {
        // Calculer critique
        const isCritical = Math.random() * 100 < attacker.critRate;
        
        const result = target.takeDamage(skill.damage * (attacker.attack / 50), attacker.type, isCritical);
        
        let effectText = result.effectiveness > 1 ? ' (Super efficace! ⚡)' : 
                        result.effectiveness < 1 ? ' (Peu efficace... 💨)' : '';
        
        let critText = isCritical ? ' 💥 CRITIQUE!' : '';
        let comboText = '';

        // Système de combo
        if (gameState.lastAttacker === attacker.id && result.damage > 0) {
            gameState.comboCount++;
            const comboBonus = Math.floor(result.damage * 0.2 * gameState.comboCount);
            target.takeDamage(comboBonus, attacker.type);
            comboText = ` 🔥 COMBO x${gameState.comboCount} (+${comboBonus} dégâts)!`;
        } else {
            gameState.comboCount = 0;
            gameState.lastAttacker = attacker.id;
        }

        addLogEntry(
            `${attacker.name} utilise ${skill.name} sur ${target.name} : ${result.damage} dégâts${critText}${effectText}${comboText}`,
            'damage'
        );

        // Appliquer effet de statut
        if (skill.statusEffect && skill.statusChance) {
            if (Math.random() * 100 < skill.statusChance) {
                if (target.addStatusEffect(skill.statusEffect)) {
                    const statusData = STATUS_EFFECTS[skill.statusEffect];
                    addLogEntry(
                        `${target.name} est maintenant ${statusData.name}! ${statusData.icon}`,
                        'status'
                    );
                }
            }
        }

        const targetCard = document.querySelector(`.battle-creature[data-id="${target.id}"]`);
        if (targetCard) {
            targetCard.classList.add('shake');
            if (isCritical) {
                targetCard.classList.add('critical-hit');
            }
            setTimeout(() => {
                targetCard.classList.remove('shake', 'critical-hit');
            }, 500);
        }
    }

    if (skill.heal) {
        const healAmount = target.heal(skill.heal);
        addLogEntry(
            `${attacker.name} utilise ${skill.name} : ${target.name} récupère ${healAmount} PV 💚`,
            'heal'
        );
        createHealEffect(target);
    }

    if (skill.shield) {
        const shieldAmount = target.addShield(skill.shield);
        addLogEntry(
            `${attacker.name} utilise ${skill.name} : ${target.name} gagne ${shieldAmount} points de bouclier 🛡️`,
            'info'
        );
    }

    if (skill.isUltimate) {
        addLogEntry(`⭐⭐⭐ ${attacker.name} déclenche son ULTIME! ⭐⭐⭐`, 'ultimate');
        createUltimateEffect(target);
    }

    checkBattleEnd();
    displayBattle();

    setTimeout(() => {
        nextTurn();
    }, 1200);
}

function nextTurn() {
    if (gameState.currentTurn === 'player') {
        gameState.currentTurn = 'enemy';
        updateRoundInfo();
        setTimeout(() => {
            enemyTurn();
        }, 1000);
    } else {
        gameState.currentTurn = 'player';
        gameState.currentRound++;
        
        // Traiter les effets de statut
        [...gameState.playerTeam, ...gameState.enemyTeam].forEach(c => {
            if (c.isAlive) {
                c.rechargeEnergy();
                const statusResults = c.processStatusEffects();
                
                statusResults.forEach(result => {
                    if (result.type === 'damage') {
                        addLogEntry(`${c.name} subit ${result.damage} dégâts de ${result.effect} ${result.icon}`, 'damage');
                    } else if (result.type === 'expired') {
                        addLogEntry(`${result.effect} sur ${c.name} a expiré`, 'info');
                    }
                });
            }
        });

        displayBattle();
    }
}

function enemyTurn() {
    const aliveEnemies = gameState.enemyTeam.filter(c => c.isAlive);
    
    if (aliveEnemies.length === 0) {
        endBattle(true);
        return;
    }

    const enemy = aliveEnemies[0];
    highlightActiveCreature(enemy);

    if (!enemy.canAct()) {
        const skipEffect = enemy.statusEffects.find(e => e.skipChance);
        if (skipEffect) {
            addLogEntry(`${enemy.name} est ${skipEffect.name} et ne peut pas agir! ${skipEffect.icon}`, 'info');
            setTimeout(() => nextTurn(), 1500);
            return;
        }
    }

    const usableSkills = enemy.skills.filter(s => s.cost <= enemy.currentEnergy);
    
    if (usableSkills.length === 0) {
        nextTurn();
        return;
    }

    // Tactical AI: choose actions according to survival, energy and type matchups.
    const allies = aliveEnemies;
    const opponents = gameState.playerTeam.filter(c => c.isAlive);
    if (!opponents.length) { endBattle(false); return; }

    const healSkill = usableSkills.filter(s => s.heal).sort((a,b) => b.heal-a.heal)[0];
    const injured = allies.slice().sort((a,b) => (a.currentHP/a.maxHP)-(b.currentHP/b.maxHP))[0];
    const shieldSkill = usableSkills.filter(s => s.shield).sort((a,b) => b.shield-a.shield)[0];
    const exposed = allies.slice().sort((a,b) => a.shield-b.shield)[0];

    let skill, target;
    if (healSkill && injured.currentHP/injured.maxHP < 0.45) {
        skill = healSkill;
        target = injured;
    } else if (shieldSkill && exposed.shield === 0 && exposed.currentHP/exposed.maxHP < 0.65) {
        skill = shieldSkill;
        target = exposed;
    } else {
        const attacks = usableSkills.filter(s => !s.heal && !s.shield);
        if (!attacks.length) {
            skill = usableSkills[0];
            target = skill.heal ? injured : exposed;
        } else {
            let bestScore = -Infinity;
            attacks.forEach(candidate => opponents.forEach(foe => {
                const affinity = TYPE_EFFECTIVENESS[enemy.type]?.[foe.type] || 1;
                const estimate = Math.max(1, (candidate.damage||0) * affinity - foe.defense*0.3);
                const score = estimate
                    + (estimate >= foe.currentHP ? 70 : 0)
                    + (foe.currentHP/foe.maxHP < 0.35 ? 12 : 0)
                    + (candidate.isUltimate ? 8 : 0)
                    - candidate.cost * 1.5;
                if (score > bestScore) { bestScore=score; skill=candidate; target=foe; }
            }));
        }
    }
    if (!skill || !target) { nextTurn(); return; }

    setTimeout(() => {
        executeSkill(enemy, target, skill);
    }, 500);
}

function checkBattleEnd() {
    const alivePlayer = gameState.playerTeam.filter(c => c.isAlive).length;
    const aliveEnemy = gameState.enemyTeam.filter(c => c.isAlive).length;

    if (alivePlayer === 0) {
        setTimeout(() => endBattle(false), 1000);
        return true;
    }

    if (aliveEnemy === 0) {
        setTimeout(() => endBattle(true), 1000);
        return true;
    }

    return false;
}

function endBattle(playerWon) {
    showScreen('result');
    
    const title = document.getElementById('result-title');
    const stats = document.getElementById('result-stats');

    if (playerWon) {
        title.textContent = '🎉 VICTOIRE !';
        title.style.color = '#4caf50';
        
        const maxCombo = gameState.comboCount;
        stats.innerHTML = `
            <p>Félicitations ! Vous avez vaincu l'équipe ennemie !</p>
            <p>🏆 Rounds: ${gameState.currentRound}</p>
            ${maxCombo > 0 ? `<p>🔥 Meilleur combo: x${maxCombo}</p>` : ''}
        `;
} else {
    title.textContent = '💔 DÉFAITE';
    title.style.color = '#f44336';
    
    const isNewRecord = saveBestScore(gameState.difficulty, gameState.currentRound);
    const bestScore = gameState.bestScores[gameState.difficulty];
    
    stats.innerHTML = `
        <p>Votre équipe a été vaincue...</p>
        <p>⚔️ Rounds survécus: ${gameState.currentRound}</p>
        ${isNewRecord ? '<p style="color: #ffd700;">🏆 NOUVEAU RECORD ! 🏆</p>' : ''}
        <p>📊 Meilleur score (${DIFFICULTY_LEVELS[gameState.difficulty].name}): ${bestScore} rounds</p>
        <p>Réessayez avec une meilleure stratégie !</p>
    `;
}
}

// ============================================
// EFFETS VISUELS ET PARTICULES
// ============================================

function createParticleEffect(target, skill) {
    const targetCard = document.querySelector(`.battle-creature[data-id="${target.id}"]`);
    if (!targetCard) return;

    const particle = document.createElement('div');
    particle.className = 'particle-effect';
    
    // Choisir l'effet selon le type d'attaque
    let particleType = 'default';
    if (skill.damage) {
        if (skill.name.includes('Feu') || skill.name.includes('Flamme') || skill.name.includes('Brûl')) {
            particleType = 'fire';
            particle.innerHTML = '🔥';
        } else if (skill.name.includes('Eau') || skill.name.includes('Glace') || skill.name.includes('Gel')) {
            particleType = 'water';
            particle.innerHTML = '💧';
        } else if (skill.name.includes('Éclair') || skill.name.includes('Électrique')) {
            particleType = 'electric';
            particle.innerHTML = '⚡';
        } else if (skill.name.includes('Plante') || skill.name.includes('Flore')) {
            particleType = 'plant';
            particle.innerHTML = '🌿';
        } else if (skill.name.includes('Roche') || skill.name.includes('Terre')) {
            particleType = 'earth';
            particle.innerHTML = '🪨';
        } else {
            particle.innerHTML = '💥';
        }
    }
    
    particle.style.position = 'absolute';
    particle.style.fontSize = '3em';
    particle.style.pointerEvents = 'none';
    particle.style.animation = 'particleFly 1s ease-out';
    
    targetCard.style.position = 'relative';
    targetCard.appendChild(particle);
    
    setTimeout(() => {
        particle.remove();
    }, 1000);
}

function createHealEffect(target) {
    const targetCard = document.querySelector(`.battle-creature[data-id="${target.id}"]`);
    if (!targetCard) return;

    const healParticle = document.createElement('div');
    healParticle.className = 'heal-effect';
    healParticle.innerHTML = '✨💚✨';
    healParticle.style.position = 'absolute';
    healParticle.style.fontSize = '2em';
    healParticle.style.pointerEvents = 'none';
    healParticle.style.animation = 'healFloat 1.5s ease-out';
    
    targetCard.style.position = 'relative';
    targetCard.appendChild(healParticle);
    
    setTimeout(() => {
        healParticle.remove();
    }, 1500);
}

function createUltimateEffect(target) {
    const targetCard = document.querySelector(`.battle-creature[data-id="${target.id}"]`);
    if (!targetCard) return;

    // Flash d'écran
    const flash = document.createElement('div');
    flash.className = 'screen-flash';
    flash.style.position = 'fixed';
    flash.style.top = '0';
    flash.style.left = '0';
    flash.style.width = '100vw';
    flash.style.height = '100vh';
    flash.style.background = 'rgba(255, 255, 255, 0.8)';
    flash.style.pointerEvents = 'none';
    flash.style.zIndex = '9999';
    flash.style.animation = 'flashEffect 0.5s ease-out';
    
    document.body.appendChild(flash);
    
    setTimeout(() => {
        flash.remove();
    }, 500);

    // Particules d'ultime
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            const star = document.createElement('div');
            star.innerHTML = '⭐';
            star.style.position = 'absolute';
            star.style.fontSize = '3em';
            star.style.pointerEvents = 'none';
            star.style.animation = 'starBurst 1s ease-out';
            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 100}%`;
            
            targetCard.style.position = 'relative';
            targetCard.appendChild(star);
            
            setTimeout(() => star.remove(), 1000);
        }, i * 100);
    }
}

// ============================================
// JOURNAL DE COMBAT
// ============================================

function addLogEntry(message, type = 'info') {
    gameState.battleLog.push({ message, type, timestamp: Date.now() });
    updateBattleLog();
}

function updateBattleLog() {
    const container = document.getElementById('log-content');
    container.innerHTML = '';

    gameState.battleLog.slice(-15).reverse().forEach(entry => {
        const div = document.createElement('div');
        div.className = `log-entry ${entry.type}`;
        div.textContent = entry.message;
        div.style.animation = 'fadeIn 0.3s ease-out';
        container.appendChild(div);
    });
}