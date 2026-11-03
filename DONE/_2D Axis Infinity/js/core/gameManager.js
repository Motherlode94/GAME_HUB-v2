/**
 * GAME MANAGER - Orchestrateur principal du jeu
 * ============================================
 * Version refactorisée : Utilise UIController pour l'affichage
 * VERSION 2.0 - AVEC SYSTÈME DE RARETÉ INTÉGRÉ
 * 
 * Séparation des responsabilités :
 * - GameManager : Logique de jeu, état, calculs
 * - UIController : Affichage, DOM, effets visuels
 * ============================================
 */
class GameManager {
    constructor() {
        this.state = {
            currentScreen: 'start',
            selectedTemplates: [],
            difficulty: localStorage.getItem('lastDifficulty') || 'normal',
            scores: this._loadScores()
        };

        // Systèmes externes
        this.levelSystem = null;
        this.evolutionSystem = null;
        this.skillSystem = null;

        // État du combat
        this.playerTeam = [];
        this.enemyTeam = [];
        this.currentRound = 1;
        this.currentTurn = 'player';
        this.comboCount = 0;
        this.lastAttackerId = null;
        this.battleEnded = false;

        // Initialiser UIController
        this.ui = new UIController();
        
        // Initialiser les systèmes externes
        this._initExternalSystems();
        
        // Setup des événements UI
        this._setupUIEvents();
        this._setupDOMEvents();
        
        // Particules de fond
        this.ui.initBackgroundParticles();
    }

    _initExternalSystems() {
        if (window.LevelSystem) {
            this.levelSystem = new LevelSystem();
            console.log('✅ LevelSystem chargé');
        }
        
        if (window.EvolutionSystem) {
            this.evolutionSystem = new EvolutionSystem();
            console.log('✅ EvolutionSystem chargé');
        }
        
        if (window.SkillSystem) {
            this.skillSystem = new SkillSystem();
            console.log('✅ SkillSystem chargé');
        }
    }

    // ────────────────────────────────────────────────
    // ÉVÉNEMENTS UI (émis par UIController)
    // ────────────────────────────────────────────────
    _setupUIEvents() {
        // Changement de difficulté
        this.ui.on('difficultyChange', (data) => {
            this.state.difficulty = data.difficulty;
            localStorage.setItem('lastDifficulty', data.difficulty);
        });

        // Sélection de créature
        this.ui.on('creatureSelect', (data) => {
            this.toggleCreature(data.template);
        });
    }

    // ────────────────────────────────────────────────
    // ÉVÉNEMENTS DOM (boutons principaux)
    // ────────────────────────────────────────────────
    _setupDOMEvents() {
        // Start screen
        this._safeAddListener('start-btn', 'click', () => this.showScreen('team-selection'));
        this._safeAddListener('tutorial-btn', 'click', () => this.ui.showTutorial());

        // Team selection
        this._safeAddListener('confirm-team-btn', 'click', () => this.startBattle());

        // Result screen
        this._safeAddListener('play-again-btn', 'click', () => this.startBattle());
        this._safeAddListener('change-team-btn', 'click', () => this.showScreen('team-selection'));

        // Modal
        this._safeAddListener('tutorial-close-btn', 'click', () => this.ui.hideTutorial());
        this._safeAddListener('modal-close', 'click', () => this.ui.hideTutorial());
    }

    _safeAddListener(id, event, handler) {
        const el = document.getElementById(id);
        if (el) el.addEventListener(event, handler);
    }

    // ────────────────────────────────────────────────
    // GESTION DES ÉCRANS
    // ────────────────────────────────────────────────
    showScreen(screenName) {
        this.state.currentScreen = screenName;
        this.ui.showScreen(screenName);

        if (screenName === 'start') {
            this._onStartScreen();
        } else if (screenName === 'team-selection') {
            this._onTeamSelectionScreen();
        }
    }

    _onStartScreen() {
        this.ui.displayBestScores(this.state.scores);
    }

    _onTeamSelectionScreen() {
        this.state.selectedTemplates = [];
        this._displayAvailableCreatures();
        this.ui.displayDifficultySelector(this.state.difficulty);
        this.ui.updateSelectedTeamSlots([]);
    }

    // ────────────────────────────────────────────────
    // SÉLECTION D'ÉQUIPE
    // ────────────────────────────────────────────────
    toggleCreature(template) {
        const index = this.state.selectedTemplates.findIndex(t => t.id === template.id);

        if (index !== -1) {
            this.state.selectedTemplates.splice(index, 1);
        } else if (this.state.selectedTemplates.length < 3) {
            this.state.selectedTemplates.push(template);
        }

        this._displayAvailableCreatures();
        this.ui.updateSelectedTeamSlots(this.state.selectedTemplates);
    }

    _displayAvailableCreatures() {
        const templates = Object.values(window.CREATURE_TEMPLATES || {});
        const selectedIds = this.state.selectedTemplates.map(t => t.id);
        
        // Charger les niveaux sauvegardés
        const savedLevels = this._loadCreatureLevels();
        
        // Appliquer les niveaux aux templates
        templates.forEach(template => {
            if (savedLevels[template.id]) {
                template.level = savedLevels[template.id].level;
                template.xp = savedLevels[template.id].xp;
            }
        });
        
        this.ui.displayCreatureCards(templates, selectedIds);
    }

    // ────────────────────────────────────────────────
    // LANCEMENT DU COMBAT
    // ────────────────────────────────────────────────
    startBattle() {
        if (this.state.selectedTemplates.length !== 3) {
            this.ui.showWarning(`Il manque ${3 - this.state.selectedTemplates.length} créature(s) !`);
            return;
        }

        // Créer les équipes
        this.playerTeam = this.state.selectedTemplates.map(t => {
            const creature = new Creature(t, false);
            // Restaurer le niveau si la créature en avait un
            if (t.level && t.level > 1) {
                creature.level = t.level;
                creature.xp = t.xp || 0;
                // Appliquer les bonus de stats du niveau
                if (this.levelSystem) {
                    const levelDiff = t.level - 1;
                    if (levelDiff > 0) {
                        this.levelSystem._applyLevelUpStats(creature, levelDiff);
                    }
                }
            }
            return creature;
        });
        
        this.enemyTeam = this._generateEnemyTeam();

        // État du combat
        this.currentRound = 1;
        this.currentTurn = 'player';
        this.comboCount = 0;
        this.lastAttackerId = null;
        this.battleEnded = false;

        // Reset LevelSystem si disponible
        if (this.levelSystem) {
            this.levelSystem.reset();
        }

        // Afficher l'écran de combat
        this.showScreen('battle');
        
        // Initialiser l'affichage
        this.ui.displayBattleTeams(this.playerTeam, this.enemyTeam);
        this.ui.updateRoundInfo(this.currentRound, this.currentTurn, this.comboCount);
        this.ui.clearLog();
        this._addLog('⚔️ Le combat commence !', 'info');
        
        // ★ NOUVEAU : Log de la vague
        if (this.levelSystem) {
            this._addLog(`🌊 Vague ${this.levelSystem.currentWave}`, 'info');
        }
        
        // Tour du joueur
        this._setupPlayerTurn();
    }

    _generateEnemyTeam() {
        const difficultyConfig = window.DIFFICULTY_LEVELS[this.state.difficulty];
        const availableTemplates = Object.values(window.CREATURE_TEMPLATES);
        const enemies = [];
        
        // ★ NOUVEAU : Obtenir la vague actuelle
        const currentWave = this.levelSystem ? this.levelSystem.currentWave : 1;

        for (let i = 0; i < 3; i++) {
            const randomIndex = Math.floor(Math.random() * availableTemplates.length);
            const template = availableTemplates.splice(randomIndex, 1)[0];
            
            const enemy = new Creature(template, true);
            
            if (this.levelSystem && this.levelSystem.applyWaveBonus) {
                this.levelSystem.applyWaveBonus(enemy);
            } else if (difficultyConfig) {
                const boost = 1 + (difficultyConfig.levelBonus * 0.15);
                enemy.attack = Math.floor(enemy.attack * boost);
                enemy.defense = Math.floor(enemy.defense * boost);
                enemy.maxHP = Math.floor(enemy.maxHP * boost);
                enemy.currentHP = enemy.maxHP;
                enemy.critRate = Math.floor(enemy.critRate + difficultyConfig.levelBonus);
            }
            
            // ★ NOUVEAU : Appliquer la rareté selon la vague
            if (window.getRarityForWave && window.applyRarityBonus) {
                const rarity = window.getRarityForWave(currentWave);
                window.applyRarityBonus(enemy, rarity);
            }
            
            enemies.push(enemy);
        }

        return enemies;
    }

    // ────────────────────────────────────────────────
    // TOUR DU JOUEUR
    // ────────────────────────────────────────────────
    _setupPlayerTurn() {
        if (this.battleEnded) return;

        this.currentTurn = 'player';
        this.ui.updateRoundInfo(this.currentRound, this.currentTurn, this.comboCount);

        const currentCreature = this.playerTeam.find(c => c.isAlive);
        
        if (!currentCreature) {
            this._endBattle(false);
            return;
        }

        this.ui.highlightActiveCreature(currentCreature);

        // Vérifier si peut agir
        const canActResult = currentCreature.canAct();
        if (!canActResult.canAct && canActResult.effect) {
            this._addLog(`${currentCreature.name} est ${canActResult.effect.name} et ne peut pas agir! ${canActResult.effect.icon}`, 'info');
            setTimeout(() => this._startEnemyTurn(), 1500);
            return;
        }

        // Afficher les compétences
        this.ui.displaySkills(currentCreature, (skill) => {
            this._onSkillSelected(currentCreature, skill);
        });
    }

    _onSkillSelected(attacker, skill) {
        if (skill.heal || skill.shield) {
            // Cible alliée
            const allies = this.playerTeam.filter(c => c.isAlive);
            if (allies.length === 1) {
                this._executePlayerAction(attacker, allies[0], skill);
            } else {
                this.ui.displayTargetPrompt();
                this.ui.enableTargetSelection(allies, (target) => {
                    this._executePlayerAction(attacker, target, skill);
                });
            }
        } else {
            // Cible ennemie
            const enemies = this.enemyTeam.filter(c => c.isAlive);
            if (enemies.length === 1) {
                this._executePlayerAction(attacker, enemies[0], skill);
            } else {
                this.ui.displayTargetPrompt();
                this.ui.enableTargetSelection(enemies, (target) => {
                    this._executePlayerAction(attacker, target, skill);
                });
            }
        }
    }

    _executePlayerAction(attacker, target, skill) {
        const result = this._executeSkill(attacker, target, skill);
        
        if (!result) return;
        if (this._checkBattleEnd()) return;

        setTimeout(() => {
            this._startEnemyTurn();
        }, 1200);
    }

    // ────────────────────────────────────────────────
    // TOUR ENNEMI
    // ────────────────────────────────────────────────
    _startEnemyTurn() {
        if (this.battleEnded) return;

        this.currentTurn = 'enemy';
        this.ui.updateRoundInfo(this.currentRound, this.currentTurn, this.comboCount);
        this.ui.displayEnemyTurnIndicator();

        const enemy = this.enemyTeam.find(c => c.isAlive);
        
        if (!enemy) {
            this._endBattle(true);
            return;
        }

        this.ui.highlightActiveCreature(enemy);

        // Vérifier si peut agir
        const canActResult = enemy.canAct();
        if (!canActResult.canAct && canActResult.effect) {
            this._addLog(`${enemy.name} est ${canActResult.effect.name} et ne peut pas agir! ${canActResult.effect.icon}`, 'info');
            setTimeout(() => this._endRound(), 1500);
            return;
        }

        setTimeout(() => {
            this._executeEnemyAI(enemy);
        }, 1000);
    }

    _executeEnemyAI(enemy) {
        const usableSkills = enemy.skills.filter(s => enemy.currentEnergy >= s.cost);
        
        if (usableSkills.length === 0) {
            this._endRound();
            return;
        }

        // Tactical AI: healing when critical, finishing weak targets, otherwise efficiency.
        const allies = this.enemyTeam.filter(c => c.isAlive);
        const opponents = this.playerTeam.filter(c => c.isAlive);
        if (!opponents.length) { this._endBattle(true); return; }
        const healSkills = usableSkills.filter(s => s.heal || s.shield);
        const attackSkills = usableSkills.filter(s => !s.heal && !s.shield);
        const criticalAlly = allies.slice().sort((a,b) =>
            a.currentHP / Math.max(1,a.maxHP) - b.currentHP / Math.max(1,b.maxHP))[0];
        let skill, target;
        if (criticalAlly && criticalAlly.currentHP / Math.max(1, criticalAlly.maxHP) < 0.48 && healSkills.length) {
            skill = healSkills.find(s => s.heal) || healSkills[0];
            target = criticalAlly;
        } else if (attackSkills.length) {
            skill = attackSkills.slice().sort((a,b) =>
                (b.damage || 0) / Math.max(1,b.cost) - (a.damage || 0) / Math.max(1,a.cost))[0];
            const ultimate = attackSkills.find(s => s.isUltimate);
            if (ultimate && opponents.some(t => t.currentHP > (skill.damage || 0))) skill = ultimate;
            target = opponents.slice().sort((a,b) =>
                a.currentHP - b.currentHP || a.defense - b.defense)[0];
        } else {
            skill = healSkills[0];
            target = criticalAlly;
        }

        if (!target) {
            this._endRound();
            return;
        }

        this._executeSkill(enemy, target, skill);

        if (this._checkBattleEnd()) return;

        setTimeout(() => {
            this._endRound();
        }, 1200);
    }

    // ────────────────────────────────────────────────
    // EXÉCUTION DES COMPÉTENCES
    // ────────────────────────────────────────────────
    _executeSkill(attacker, target, skill) {
        if (attacker.currentEnergy < skill.cost) return null;
        attacker.currentEnergy -= skill.cost;

        const result = {
            attacker,
            target,
            skill,
            damage: 0,
            heal: 0,
            isCritical: false,
            effectiveness: 1
        };

        let effectiveness = 1;
        let damage = 0;
        let isCritical = false;

        // Utiliser power OU damage
        const skillPower = skill.power || skill.damage || 0;

        // Compétence d'attaque
        if (skillPower > 0) {
            if (this.skillSystem && this.skillSystem.calculateSkillDamage) {
                const skillResult = this.skillSystem.calculateSkillDamage(skill, attacker, target);
                damage = skillResult.damage;
                isCritical = skillResult.isCritical;
                effectiveness = skillResult.effectiveness || 1;
            } else {
                isCritical = Math.random() * 100 < attacker.critRate;
                const attackType = skill.type || attacker.type;
                effectiveness = window.TYPE_EFFECTIVENESS?.[attackType]?.[target.type] ?? 1;
                damage = Math.floor(skillPower * (attacker.attack / 50) * effectiveness);
                if (isCritical) damage = Math.floor(damage * 1.5);
                damage = Math.max(1, damage - Math.floor(target.defense * 0.3));
            }
            
            // Bouclier
            if (target.shield > 0) {
                const shieldDamage = Math.min(target.shield, damage);
                target.shield -= shieldDamage;
                damage -= shieldDamage;
                if (shieldDamage > 0) {
                    this._addLog(`🛡️ Le bouclier de ${target.name} absorbe ${shieldDamage} dégâts`, 'info');
                }
            }
            
            target.currentHP = Math.max(0, target.currentHP - damage);
            
            result.damage = damage;
            result.isCritical = isCritical;
            result.effectiveness = effectiveness;

            // Combo
            if (this.lastAttackerId === attacker.id && damage > 0) {
                this.comboCount++;
            } else {
                this.comboCount = 0;
            }
            this.lastAttackerId = attacker.id;

            // Log
            let logMsg = `${attacker.name} utilise ${skill.name} sur ${target.name} : ${damage} dégâts`;
            if (isCritical) logMsg += ' 💥 CRITIQUE!';
            if (effectiveness > 1) logMsg += ' (Super efficace!)';
            else if (effectiveness < 1) logMsg += ' (Peu efficace...)';
            if (this.comboCount > 0) logMsg += ` 🔥 COMBO x${this.comboCount}!`;
            
            this._addLog(logMsg, 'damage');

            // Effet de statut
            const statusEffect = skill.statusEffect || skill.effect;
            const statusChance = skill.statusChance || skill.effectChance || 0;
            
            if (statusEffect && statusChance > 0 && Math.random() * 100 < statusChance) {
                this._applyStatusEffect(target, statusEffect);
            }

            // Mort
            if (target.currentHP === 0) {
                target.isAlive = false;
                this._addLog(`💀 ${target.name} est K.O. !`, 'info');
            }

            // Effets visuels
            this.ui.playDamageEffect(target, isCritical);
            this.ui.showDamageNumber(target, damage, 'damage');
            this.ui.createParticleEffect(target, skill.type || attacker.type);
        }

        // Soin
        if (skill.heal > 0) {
            const healAmount = Math.min(skill.heal, target.maxHP - target.currentHP);
            target.currentHP += healAmount;
            result.heal = healAmount;
            
            this._addLog(`${attacker.name} utilise ${skill.name} : ${target.name} récupère ${healAmount} PV 💚`, 'heal');
            this.ui.showDamageNumber(target, healAmount, 'heal');
        }

        // Bouclier
        if (skill.shield > 0) {
            target.shield += skill.shield;
            this._addLog(`${attacker.name} utilise ${skill.name} : ${target.name} gagne ${skill.shield} points de bouclier 🛡️`, 'info');
        }

        // Ultime
        if (skill.isUltimate) {
            this._addLog(`⭐⭐⭐ ${attacker.name} déclenche son ULTIME! ⭐⭐⭐`, 'ultimate');
            this.ui.playUltimateEffect();
        }

        // MAJ affichage
        this.ui.updateCreatureCard(attacker);
        this.ui.updateCreatureCard(target);
        this.ui.updateRoundInfo(this.currentRound, this.currentTurn, this.comboCount);

        return result;
    }

    _applyStatusEffect(target, effectType) {
        const effectData = window.STATUS_EFFECTS?.[effectType];
        if (!effectData) return;

        if (!target.statusEffects) target.statusEffects = [];
        
        const existing = target.statusEffects.find(e => e.type === effectType);
        if (existing) {
            existing.duration = effectData.duration;
        } else {
            target.statusEffects.push({
                type: effectType,
                name: effectData.name,
                icon: effectData.icon,
                duration: effectData.duration,
                damagePerTurn: effectData.damagePerTurn || 0,
                skipChance: effectData.skipChance || 0,
                color: effectData.color
            });
            this._addLog(`${target.name} est maintenant ${effectData.name}! ${effectData.icon}`, 'status');
        }
    }

    // ────────────────────────────────────────────────
    // FIN DE ROUND / COMBAT
    // ────────────────────────────────────────────────
    _endRound() {
        if (this.battleEnded) return;

        this.currentRound++;

        // Traiter effets de statut et regen énergie
        [...this.playerTeam, ...this.enemyTeam].forEach(creature => {
            if (!creature.isAlive) return;

            creature.currentEnergy = Math.min(creature.maxEnergy, creature.currentEnergy + 2);

            if (creature.statusEffects) {
                creature.statusEffects = creature.statusEffects.filter(effect => {
                    effect.duration--;
                    
                    if (effect.damagePerTurn > 0) {
                        creature.currentHP = Math.max(0, creature.currentHP - effect.damagePerTurn);
                        this._addLog(`${creature.name} subit ${effect.damagePerTurn} dégâts de ${effect.name} ${effect.icon}`, 'damage');
                        
                        if (creature.currentHP === 0) {
                            creature.isAlive = false;
                            this._addLog(`💀 ${creature.name} est K.O. !`, 'info');
                        }
                    }

                    if (effect.duration <= 0) {
                        this._addLog(`${effect.name} sur ${creature.name} a expiré`, 'info');
                        return false;
                    }
                    return true;
                });
            }

            this.ui.updateCreatureCard(creature);
        });

        if (this._checkBattleEnd()) return;

        this._setupPlayerTurn();
    }

    _checkBattleEnd() {
        const playerAlive = this.playerTeam.some(c => c.isAlive);
        const enemyAlive = this.enemyTeam.some(c => c.isAlive);

        if (!playerAlive) {
            this._endBattle(false);
            return true;
        }

        if (!enemyAlive) {
            this._endBattle(true);
            return true;
        }

        return false;
    }

    _endBattle(playerWon) {
        this.battleEnded = true;

        const difficultyConfig = window.DIFFICULTY_LEVELS?.[this.state.difficulty];
        let isNewRecord = false;
        let levelUpInfo = [];

        // ★ NOUVEAU : Si victoire, passer à la vague suivante
        if (playerWon && this.levelSystem) {
            this.levelSystem.nextWave();
            this._addLog(`🎉 Vague ${this.levelSystem.currentWave - 1} terminée!`, 'info');
        }

        // Si victoire, donner XP aux créatures survivantes
        if (playerWon && this.levelSystem) {
            this.playerTeam.forEach(creature => {
                if (creature.isAlive) {
                    // Calculer XP basée sur la difficulté et le round
                    const baseXP = 80;
                    const roundBonus = this.currentRound * 15;
                    const difficultyBonus = difficultyConfig ? difficultyConfig.levelBonus * 10 : 0;
                    const totalXP = baseXP + roundBonus + difficultyBonus;
                    
                    // Donner XP
                    const xpResult = this.levelSystem.giveXP(creature, totalXP);
                    
                    if (xpResult.levelUps > 0) {
                        levelUpInfo.push({
                            creature: creature,
                            previousLevel: xpResult.previousLevel,
                            newLevel: xpResult.newLevel,
                            xpGained: xpResult.xpGained
                        });
                        
                        this._addLog(`⭐ ${creature.name} est passé niveau ${xpResult.newLevel}! (+${xpResult.levelUps} niveau)`, 'level-up');
                    }
                    
                    // Mettre à jour le template avec le nouveau niveau et XP
                    const template = this.state.selectedTemplates.find(t => t.id === creature.templateId);
                    if (template) {
                        template.level = creature.level;
                        template.xp = creature.xp;
                    }
                }
            });
            
            // Sauvegarder les créatures avec leurs niveaux
            this._saveCreatureLevels();
        }

        if (!playerWon) {
            isNewRecord = this._saveScore(this.state.difficulty, this.currentRound);

            if (typeof window.submitGameScore === "function") {
                window.submitGameScore("2d_axis_infinity", this.currentRound);
            }
        }

        setTimeout(() => {
            this.showScreen('result');
            this.ui.displayResult(playerWon, {
                rounds: this.currentRound,
                maxCombo: this.comboCount,
                isNewRecord,
                bestScore: this.state.scores[this.state.difficulty] || 0,
                difficultyName: difficultyConfig?.name || 'Normal',
                levelUpInfo: levelUpInfo
            });
        }, 1000);
    }

    // ────────────────────────────────────────────────
    // LOG
    // ────────────────────────────────────────────────
    _addLog(message, type = 'info') {
        this.ui.addLogEntry(message, type);
    }

    // ────────────────────────────────────────────────
    // SCORES & STORAGE
    // ────────────────────────────────────────────────
    _loadScores() {
        try {
            return JSON.parse(localStorage.getItem('creatureBattle_bestScores')) || {};
        } catch {
            return {};
        }
    }

    _saveScore(difficulty, rounds) {
        if (rounds > (this.state.scores[difficulty] || 0)) {
            this.state.scores[difficulty] = rounds;
            localStorage.setItem('creatureBattle_bestScores', JSON.stringify(this.state.scores));
            return true;
        }
        return false;
    }
    
    _saveCreatureLevels() {
        try {
            const creatureLevels = {};
            this.state.selectedTemplates.forEach(template => {
                if (template.level && template.level > 1) {
                    creatureLevels[template.id] = {
                        level: template.level,
                        xp: template.xp || 0
                    };
                }
            });
            localStorage.setItem('creatureBattle_levels', JSON.stringify(creatureLevels));
        } catch (error) {
            console.error('Erreur sauvegarde niveaux:', error);
        }
    }
    
    _loadCreatureLevels() {
        try {
            const saved = localStorage.getItem('creatureBattle_levels');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.error('Erreur chargement niveaux:', error);
            return {};
        }
    }
}

// Exposition globale
window.GameManager = GameManager;

// Initialisation automatique
document.addEventListener('DOMContentLoaded', () => {
    // Attendre que tous les scripts soient chargés
    setTimeout(() => {
        window.game = new GameManager();
        window.game.showScreen('start');
        console.log('🎮 Creature Battle Arena v2.0 - Ready');
    }, 100);
});