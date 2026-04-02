/**
 * ============================================
 * BATTLE SYSTEM
 * ============================================
 */

class BattleSystem extends EventEmitter {
    constructor() {
        super();
        
        // Accéder aux objets globaux
        this.CREATURE_TEMPLATES = window.CREATURE_TEMPLATES;
        this.DIFFICULTY_LEVELS = window.DIFFICULTY_LEVELS;
        this.GAME_CONSTANTS = window.GAME_CONSTANTS;
        this.TYPE_EFFECTIVENESS = window.TYPE_EFFECTIVENESS;
        
        this.playerTeam = [];
        this.enemyTeam = [];
        this.currentRound = 0;
        this.currentTurn = 'player';
        this.difficulty = 'normal';
        this.battleLog = [];
        this.comboCount = 0;
        this.lastAttackerId = null;
        this.isProcessing = false;
        this.battleEnded = false;
    }

    // ==========================================
    // BATTLE SETUP
    // ==========================================

    startBattle(playerTemplates, difficulty = 'normal') {
        this.difficulty = difficulty;
        this.currentRound = 1;
        this.currentTurn = 'player';
        this.battleLog = [];
        this.comboCount = 0;
        this.lastAttackerId = null;
        this.isProcessing = false;
        this.battleEnded = false;
        
        // Create player team
        this.playerTeam = playerTemplates.map(template => {
            const creature = new Creature(template, false);
            this._setupCreatureListeners(creature);
            return creature;
        });
        
        // Generate random enemy team
        this.enemyTeam = this._generateEnemyTeam(difficulty);
        
        this._addLog('⚔️ Le combat commence !', 'info');
        
        this.emit('battleStart', {
            playerTeam: this.playerTeam,
            enemyTeam: this.enemyTeam,
            difficulty: this.difficulty
        });
    }

    _generateEnemyTeam(difficulty) {
        const difficultyConfig = this.DIFFICULTY_LEVELS[difficulty];
        const availableTemplates = [...this.CREATURE_TEMPLATES];
        const enemies = [];
        
        for (let i = 0; i < this.GAME_CONSTANTS.TEAM_SIZE; i++) {
            const randomIndex = Math.floor(Math.random() * availableTemplates.length);
            const template = availableTemplates.splice(randomIndex, 1)[0];
            
            const enemy = new Creature(template, true);
            enemy.applyDifficultyBonus(difficultyConfig.levelBonus);
            this._setupCreatureListeners(enemy);
            enemies.push(enemy);
        }
        
        return enemies;
    }

    _setupCreatureListeners(creature) {
        creature.on('death', (data) => {
            this._addLog(`💀 ${data.creature.name} est K.O. !`, 'info');
            this.emit('creatureDeath', data);
        });
    }

    // ==========================================
    // TURN MANAGEMENT
    // ==========================================

    getCurrentCreature() {
        const team = this.currentTurn === 'player' ? this.playerTeam : this.enemyTeam;
        return team.find(c => c.isAlive) || null;
    }

    getAliveCreatures(side) {
        const team = side === 'player' ? this.playerTeam : this.enemyTeam;
        return team.filter(c => c.isAlive);
    }

    async executeSkill(attacker, target, skill) {
        if (this.isProcessing || this.battleEnded) return null;
        this.isProcessing = true;

        // Use energy
        if (!attacker.useSkill(skill)) {
            this.isProcessing = false;
            return null;
        }

        const result = {
            attacker,
            target,
            skill,
            damage: 0,
            heal: 0,
            shield: 0,
            effectiveness: 1,
            isCritical: false,
            statusApplied: null,
            comboBonus: 0
        };

        // Handle damage skills
        if (skill.damage > 0) {
            const isCritical = Math.random() * 100 < attacker.critRate;
            const baseDamage = skill.damage * (attacker.attack / 50);
            
            const damageResult = target.takeDamage(baseDamage, attacker.type, isCritical);
            result.damage = damageResult.damage;
            result.effectiveness = damageResult.effectiveness;
            result.isCritical = isCritical;

            // Combo system
            if (this.lastAttackerId === attacker.id && result.damage > 0) {
                this.comboCount++;
                result.comboBonus = Math.floor(result.damage * this.GAME_CONSTANTS.COMBO_BONUS_MULTIPLIER * this.comboCount);
                if (result.comboBonus > 0) {
                    target.takeDamage(result.comboBonus, attacker.type, false);
                }
            } else {
                this.comboCount = 0;
            }
            this.lastAttackerId = attacker.id;

            // Build log message
            let logMsg = `${attacker.name} utilise ${skill.name} sur ${target.name} : ${result.damage} dégâts`;
            if (result.isCritical) logMsg += ' 💥 CRITIQUE!';
            if (result.effectiveness > 1) logMsg += ' (Super efficace! ⚡)';
            else if (result.effectiveness < 1) logMsg += ' (Peu efficace... 💨)';
            if (result.comboBonus > 0) logMsg += ` 🔥 COMBO x${this.comboCount} (+${result.comboBonus})!`;
            
            this._addLog(logMsg, 'damage');

            // Status effect
            if (skill.statusEffect && skill.statusChance) {
                if (Math.random() * 100 < skill.statusChance) {
                    if (target.addStatusEffect(skill.statusEffect)) {
                        const effectData = target.statusEffects.find(e => e.type === skill.statusEffect);
                        result.statusApplied = skill.statusEffect;
                        this._addLog(`${target.name} est maintenant ${effectData.name}! ${effectData.icon}`, 'status');
                    }
                }
            }
        }

        // Handle healing
        if (skill.heal > 0) {
            result.heal = target.heal(skill.heal);
            this._addLog(`${attacker.name} utilise ${skill.name} : ${target.name} récupère ${result.heal} PV 💚`, 'heal');
        }

        // Handle shield
        if (skill.shield > 0) {
            result.shield = target.addShield(skill.shield);
            this._addLog(`${attacker.name} utilise ${skill.name} : ${target.name} gagne ${result.shield} points de bouclier 🛡️`, 'info');
        }

        // Ultimate announcement
        if (skill.isUltimate) {
            this._addLog(`⭐⭐⭐ ${attacker.name} déclenche son ULTIME! ⭐⭐⭐`, 'ultimate');
        }

        this.emit('skillExecuted', result);

        // Check battle end
        if (this._checkBattleEnd()) {
            this.isProcessing = false;
            return result;
        }

        this.isProcessing = false;
        return result;
    }

async nextTurn() {
    if (this.battleEnded) return;

    if (this.currentTurn === 'player') {
        // ===== MODIFIE ÇA =====
        // Ne passe PAS automatiquement au tour ennemi
        // Juste émet l'événement pour que le GameManager sache
        this.emit('turnChange', { 
            turn: 'player', 
            round: this.currentRound,
            action: 'playerShouldAct' // Nouveau paramètre
        });
        // =====================
        
        // ATTENTION : NE PAS appeler executeEnemyTurn() ici !
        // Le GameManager décidera quand passer au tour ennemi
        
    } else {
        this.currentTurn = 'player';
        this.currentRound++;
        
        // Process status effects for all creatures
        this._processAllStatusEffects();
        
        // Recharge energy
        [...this.playerTeam, ...this.enemyTeam].forEach(c => {
            if (c.isAlive) c.rechargeEnergy();
        });
        
        this.emit('turnChange', { 
            turn: 'player', 
            round: this.currentRound,
            action: 'playerShouldAct' 
        });
    }
}

// AJOUTE cette méthode pour que le GameManager puisse déclencher le tour ennemi
async playerFinishedTurn() {
    if (this.currentTurn !== 'player') return;
    
    this.currentTurn = 'enemy';
    this.emit('turnChange', { 
        turn: 'enemy', 
        round: this.currentRound,
        action: 'enemyWillAct' 
    });
    
    // Maintenant, exécute le tour ennemi
    await this._delay(this.GAME_CONSTANTS.ANIMATION_DURATION.SLOW);
    await this.executeEnemyTurn();
}

    // ==========================================
    // ENEMY AI
    // ==========================================

    async executeEnemyTurn() {
        if (this.battleEnded) return;

        const enemy = this.getCurrentCreature();
        if (!enemy) {
            this._endBattle(true);
            return;
        }

        this.emit('creatureActive', { creature: enemy });

        // Check if enemy can act
        const canActResult = enemy.canAct();
        if (!canActResult.canAct) {
            if (canActResult.effect) {
                this._addLog(`${enemy.name} est ${canActResult.effect.name} et ne peut pas agir! ${canActResult.effect.icon}`, 'info');
            }
            await this._delay(this.GAME_CONSTANTS.ANIMATION_DURATION.SLOW);
            await this.nextTurn();
            return;
        }

        // AI decision making
        const decision = this._makeAIDecision(enemy);
        
        if (!decision) {
            await this.nextTurn();
            return;
        }

        await this._delay(this.GAME_CONSTANTS.ANIMATION_DURATION.NORMAL);
        await this.executeSkill(enemy, decision.target, decision.skill);
        
        await this._delay(this.GAME_CONSTANTS.ANIMATION_DURATION.TURN_DELAY);
        await this.nextTurn();
    }

    _makeAIDecision(enemy) {
        const usableSkills = enemy.getUsableSkills();
        if (usableSkills.length === 0) return null;

        const alivePlayerCreatures = this.getAliveCreatures('player');
        const aliveEnemyCreatures = this.getAliveCreatures('enemy');
        
        if (alivePlayerCreatures.length === 0) return null;

        // AI Priority:
        // 1. Use ultimate if available and enemy HP is high
        // 2. Heal if HP is low and heal skill available
        // 3. Use shield if available and no shield
        // 4. Target weak type opponent
        // 5. Random attack

        // Check for ultimate
        const ultimateSkill = usableSkills.find(s => s.isUltimate);
        if (ultimateSkill && enemy.getHPPercent() > 50 && Math.random() > 0.3) {
            const target = this._selectBestTarget(enemy, alivePlayerCreatures);
            return { skill: ultimateSkill, target };
        }

        // Check for heal if low HP
        const healSkill = usableSkills.find(s => s.heal > 0);
        if (healSkill && enemy.getHPPercent() < 40) {
            return { skill: healSkill, target: enemy };
        }

        // Check for shield
        const shieldSkill = usableSkills.find(s => s.shield > 0);
        if (shieldSkill && enemy.shield === 0 && Math.random() > 0.6) {
            const shieldTarget = aliveEnemyCreatures[Math.floor(Math.random() * aliveEnemyCreatures.length)];
            return { skill: shieldSkill, target: shieldTarget };
        }

        // Attack skills only
        const attackSkills = usableSkills.filter(s => s.damage > 0);
        if (attackSkills.length === 0) {
            // Fallback to any skill
            const skill = usableSkills[Math.floor(Math.random() * usableSkills.length)];
            const target = skill.heal || skill.shield 
                ? enemy 
                : alivePlayerCreatures[Math.floor(Math.random() * alivePlayerCreatures.length)];
            return { skill, target };
        }

        // Select best attack skill (prefer higher damage but with some randomness)
        const skill = Math.random() > 0.3
            ? attackSkills.reduce((best, s) => s.damage > best.damage ? s : best, attackSkills[0])
            : attackSkills[Math.floor(Math.random() * attackSkills.length)];

        const target = this._selectBestTarget(enemy, alivePlayerCreatures);
        return { skill, target };
    }

    _selectBestTarget(attacker, targets) {
        // Prefer targets weak to attacker's type
        const weakTargets = targets.filter(t => {
            const effectiveness = this.TYPE_EFFECTIVENESS[attacker.type]?.[t.type] ?? 1;
            return effectiveness > 1;
        });

        if (weakTargets.length > 0 && Math.random() > 0.3) {
            return weakTargets[Math.floor(Math.random() * weakTargets.length)];
        }

        // Prefer low HP targets
        const lowHPTargets = targets.filter(t => t.getHPPercent() < 30);
        if (lowHPTargets.length > 0 && Math.random() > 0.4) {
            return lowHPTargets[Math.floor(Math.random() * lowHPTargets.length)];
        }

        // Random target
        return targets[Math.floor(Math.random() * targets.length)];
    }

    // ==========================================
    // STATUS EFFECTS PROCESSING
    // ==========================================

    _processAllStatusEffects() {
        [...this.playerTeam, ...this.enemyTeam].forEach(creature => {
            if (!creature.isAlive) return;
            
            const results = creature.processStatusEffects();
            
            results.forEach(result => {
                if (result.type === 'damage') {
                    this._addLog(
                        `${creature.name} subit ${result.damage} dégâts de ${result.effect} ${result.icon}`,
                        'damage'
                    );
                } else if (result.type === 'expired') {
                    this._addLog(`${result.effect} sur ${creature.name} a expiré`, 'info');
                }
            });
        });

        this._checkBattleEnd();
    }

    // ==========================================
    // BATTLE END
    // ==========================================

    _checkBattleEnd() {
        if (this.battleEnded) return true;

        const playerAlive = this.getAliveCreatures('player').length;
        const enemyAlive = this.getAliveCreatures('enemy').length;

        if (playerAlive === 0) {
            this._endBattle(false);
            return true;
        }

        if (enemyAlive === 0) {
            this._endBattle(true);
            return true;
        }

        return false;
    }

    _endBattle(playerWon) {
        if (this.battleEnded) return;
        
        this.battleEnded = true;
        
        this.emit('battleEnd', {
            playerWon,
            rounds: this.currentRound,
            difficulty: this.difficulty,
            maxCombo: this.comboCount
        });
    }

    // ==========================================
    // LOGGING
    // ==========================================

    _addLog(message, type = 'info') {
        const entry = {
            message,
            type,
            timestamp: Date.now()
        };
        
        this.battleLog.push(entry);
        this.emit('logEntry', entry);
    }

    // ==========================================
    // UTILITIES
    // ==========================================

    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getBattleState() {
        return {
            playerTeam: this.playerTeam.map(c => c.toJSON()),
            enemyTeam: this.enemyTeam.map(c => c.toJSON()),
            currentRound: this.currentRound,
            currentTurn: this.currentTurn,
            difficulty: this.difficulty,
            comboCount: this.comboCount,
            battleEnded: this.battleEnded
        };
    }
}

window.BattleSystem = BattleSystem;
console.log('✅ BattleSystem chargé et prêt pour combat interactif');