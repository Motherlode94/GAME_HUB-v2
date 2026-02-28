/**
 * ============================================
 * LEVEL SYSTEM
 * Gère les niveaux et la progression des ennemis
 * Les ennemis deviennent plus forts à chaque vague
 * Fichier: js/systems/LevelSystem.js
 * ============================================
 */

class LevelSystem {
    constructor() {
        // Configuration des niveaux
        this.config = {
            maxLevel: 100,
            baseXPRequired: 100,
            xpMultiplierPerLevel: 1.2,
            statGrowthPerLevel: 0.05,  // +5% stats par niveau
            
            // Bonus ennemis par vague
            waveScaling: {
                hpMultiplier: 0.12,      // +12% HP par vague
                attackMultiplier: 0.10,  // +10% ATK par vague
                defenseMultiplier: 0.08, // +8% DEF par vague
                levelPerWave: 2          // +2 niveaux par vague
            }
        };

        // État actuel
        this.currentWave = 1;
        this.enemiesDefeated = 0;
        this.totalXPEarned = 0;
    }

    /**
     * Calcule l'XP nécessaire pour atteindre un niveau
     * @param {number} level - Niveau cible
     * @returns {number} XP requise
     */
    getXPForLevel(level) {
        if (level <= 1) return 0;
        return Math.floor(
            this.config.baseXPRequired * 
            Math.pow(this.config.xpMultiplierPerLevel, level - 1)
        );
    }

    /**
     * Calcule le niveau basé sur l'XP totale
     * @param {number} totalXP - XP totale accumulée
     * @returns {number} Niveau actuel
     */
    getLevelFromXP(totalXP) {
        let level = 1;
        let xpNeeded = 0;
        
        while (level < this.config.maxLevel) {
            xpNeeded = this.getXPForLevel(level + 1);
            if (totalXP < xpNeeded) break;
            level++;
        }
        
        return level;
    }

    /**
     * Donne de l'XP à une créature et gère le level up
     * @param {Creature} creature - Créature recevant l'XP
     * @param {number} amount - Montant d'XP
     * @returns {Object} Résultat avec level ups éventuels
     */
    giveXP(creature, amount) {
        if (!creature.xp) creature.xp = 0;
        if (!creature.level) creature.level = 1;

        const previousLevel = creature.level;
        creature.xp += amount;
        
        const newLevel = this.getLevelFromXP(creature.xp);
        const levelUps = newLevel - previousLevel;

        if (levelUps > 0) {
            creature.level = newLevel;
            this._applyLevelUpStats(creature, levelUps);
        }

        this.totalXPEarned += amount;

        return {
            xpGained: amount,
            totalXP: creature.xp,
            previousLevel,
            newLevel: creature.level,
            levelUps,
            nextLevelXP: this.getXPForLevel(creature.level + 1),
            xpProgress: creature.xp - this.getXPForLevel(creature.level)
        };
    }

    /**
     * Applique les bonus de stats lors d'un level up
     * @param {Creature} creature - Créature
     * @param {number} levels - Nombre de niveaux gagnés
     */
    _applyLevelUpStats(creature, levels) {
        const growth = 1 + (this.config.statGrowthPerLevel * levels);
        
        creature.maxHP = Math.floor(creature.maxHP * growth);
        creature.currentHP = Math.min(creature.currentHP + Math.floor(creature.maxHP * 0.3), creature.maxHP);
        creature.attack = Math.floor(creature.attack * growth);
        creature.defense = Math.floor(creature.defense * growth);
        creature.speed = Math.floor(creature.speed * growth);
        
        // Bonus critique tous les 5 niveaux
        if (creature.level % 5 === 0) {
            creature.critRate = Math.min(creature.critRate + 2, 50);
        }

        // Émettre événement
        if (window.GlobalEvents) {
            window.GlobalEvents.emit('levelUp', {
                creature,
                newLevel: creature.level,
                levelsGained: levels
            });
        }
    }

    /**
     * Passe à la vague suivante
     * @returns {Object} Infos sur la nouvelle vague
     */
    nextWave() {
        this.currentWave++;
        
        const waveInfo = {
            wave: this.currentWave,
            enemyLevel: this._getEnemyLevelForWave(),
            statMultipliers: this._getWaveMultipliers()
        };

        if (window.GlobalEvents) {
            window.GlobalEvents.emit('waveStart', waveInfo);
        }

        return waveInfo;
    }

    /**
     * Calcule le niveau des ennemis pour la vague actuelle
     * @returns {number} Niveau ennemi
     */
    _getEnemyLevelForWave() {
        return 1 + (this.currentWave - 1) * this.config.waveScaling.levelPerWave;
    }

    /**
     * Calcule les multiplicateurs de stats pour la vague
     * @returns {Object} Multiplicateurs
     */
    _getWaveMultipliers() {
        const wave = this.currentWave - 1;
        return {
            hp: 1 + (wave * this.config.waveScaling.hpMultiplier),
            attack: 1 + (wave * this.config.waveScaling.attackMultiplier),
            defense: 1 + (wave * this.config.waveScaling.defenseMultiplier)
        };
    }

    /**
     * Applique les bonus de vague à un ennemi
     * @param {Creature} enemy - Créature ennemie
     * @returns {Creature} Ennemi boosté
     */
    applyWaveBonus(enemy) {
        const multipliers = this._getWaveMultipliers();
        const enemyLevel = this._getEnemyLevelForWave();

        enemy.level = enemyLevel;
        enemy.maxHP = Math.floor(enemy.maxHP * multipliers.hp);
        enemy.currentHP = enemy.maxHP;
        enemy.attack = Math.floor(enemy.attack * multipliers.attack);
        enemy.defense = Math.floor(enemy.defense * multipliers.defense);
        
        // Bonus énergie à partir de la vague 5
        if (this.currentWave >= 5) {
            enemy.currentEnergy = Math.min(enemy.maxEnergy, enemy.currentEnergy + Math.floor(this.currentWave / 5));
        }

        return enemy;
    }

    /**
     * Calcule l'XP donnée par un ennemi vaincu
     * @param {Creature} enemy - Ennemi vaincu
     * @returns {number} XP gagnée
     */
    getXPReward(enemy) {
        const baseXP = 20;
        const levelBonus = (enemy.level || 1) * 5;
        const waveBonus = this.currentWave * 3;
        
        return baseXP + levelBonus + waveBonus;
    }

    /**
     * Réinitialise le système (nouvelle partie)
     */
    reset() {
        this.currentWave = 1;
        this.enemiesDefeated = 0;
        this.totalXPEarned = 0;
    }

    /**
     * Obtient les stats actuelles du système
     * @returns {Object} Stats
     */
    getStats() {
        return {
            currentWave: this.currentWave,
            enemiesDefeated: this.enemiesDefeated,
            totalXPEarned: this.totalXPEarned,
            enemyLevel: this._getEnemyLevelForWave(),
            multipliers: this._getWaveMultipliers()
        };
    }
}

// Exposition globale
window.LevelSystem = LevelSystem;
console.log('✅ LevelSystem chargé');