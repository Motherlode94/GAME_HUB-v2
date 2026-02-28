/**
 * ============================================
 * CREATURE CLASS
 * Handles creature stats, combat logic, and status effects
 * ============================================
 */

class Creature extends EventEmitter {
    /**
     * Create a new creature instance
     * @param {Object} template - Creature template from CREATURE_TEMPLATES
     * @param {boolean} isEnemy - Whether this is an enemy creature
     */
    constructor(template, isEnemy = false) {
        super();
        
        // Utiliser les objets globaux depuis gameConfig.js
        const TYPE_EFFECTIVENESS = window.TYPE_EFFECTIVENESS;
        const STATUS_EFFECTS = window.STATUS_EFFECTS;
        const GAME_CONSTANTS = window.GAME_CONSTANTS;
        
        // Unique identifier
        this.id = `creature_${template.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.templateId = template.id;
        
        // Basic info
        this.name = template.name;
        this.type = template.type;
        this.icon = template.icon;
        this.isEnemy = isEnemy;
        
        // Stats
        this.baseStats = {
            hp: template.baseHP,
            attack: template.baseAttack,
            defense: template.baseDefense,
            speed: template.baseSpeed,
            critRate: template.critRate || 10
        };
        
        // Current stats (can be modified by buffs/debuffs)
        this.maxHP = this.baseStats.hp;
        this.currentHP = this.baseStats.hp;
        this.attack = this.baseStats.attack;
        this.defense = this.baseStats.defense;
        this.speed = this.baseStats.speed;
        this.critRate = this.baseStats.critRate;
        
        // Skills (deep copy to avoid reference issues)
        this.skills = JSON.parse(JSON.stringify(template.skills));
        
        // Energy system
        this.maxEnergy = GAME_CONSTANTS.MAX_ENERGY;
        this.currentEnergy = isEnemy 
            ? GAME_CONSTANTS.STARTING_ENERGY_ENEMY 
            : GAME_CONSTANTS.STARTING_ENERGY_PLAYER;
        
        // Combat state
        this.isAlive = true;
        this.shield = 0;
        this.statusEffects = [];
    }

    // ==========================================
    // STAT MODIFIERS
    // ==========================================

    /**
     * Apply difficulty bonus to enemy stats
     * @param {number} levelBonus - Difficulty level bonus
     */
    applyDifficultyBonus(levelBonus) {
        const boost = 1 + (levelBonus * 0.15);
        
        this.attack = Math.floor(this.baseStats.attack * boost);
        this.defense = Math.floor(this.baseStats.defense * boost);
        this.maxHP = Math.floor(this.baseStats.hp * boost);
        this.currentHP = this.maxHP;
        this.critRate = Math.floor(this.baseStats.critRate + levelBonus);
    }

    // ==========================================
    // DAMAGE & HEALING
    // ==========================================

    /**
     * Calculate and apply damage to this creature
     * @param {number} baseDamage - Base damage before modifiers
     * @param {string} attackerType - Type of the attacker for effectiveness
     * @param {boolean} isCritical - Whether this is a critical hit
     * @returns {Object} Damage result with final damage and effectiveness
     */
    takeDamage(baseDamage, attackerType, isCritical = false) {
        const TYPE_EFFECTIVENESS = window.TYPE_EFFECTIVENESS;
        const GAME_CONSTANTS = window.GAME_CONSTANTS;
        
        // Calculate type effectiveness
        const effectiveness = TYPE_EFFECTIVENESS[attackerType]?.[this.type] ?? 1;
        
        // Calculate final damage
        let finalDamage = Math.max(
            1, 
            Math.floor(baseDamage * effectiveness - this.defense * GAME_CONSTANTS.DEFENSE_REDUCTION)
        );
        
        
        // Apply critical multiplier
        if (isCritical) {
            finalDamage = Math.floor(finalDamage * GAME_CONSTANTS.CRITICAL_MULTIPLIER);
        }
        
        // Apply shield first
        const shieldAbsorbed = Math.min(this.shield, finalDamage);
        this.shield -= shieldAbsorbed;
        finalDamage -= shieldAbsorbed;
        
        // Apply remaining damage to HP
        const previousHP = this.currentHP;
        this.currentHP = Math.max(0, this.currentHP - finalDamage);
        
        // Check for death
        if (this.currentHP === 0 && this.isAlive) {
            this.isAlive = false;
            this.emit('death', { creature: this });
        }
        
        // Emit damage event
        this.emit('damage', {
            creature: this,
            damage: finalDamage,
            shieldAbsorbed,
            effectiveness,
            isCritical,
            previousHP,
            currentHP: this.currentHP
        });
        
        return {
            damage: finalDamage,
            shieldAbsorbed,
            effectiveness,
            isCritical
        };
    }

    /**
     * Apply status effect damage (ignores defense and shield)
     * @param {number} damage - Raw damage to apply
     * @param {string} source - Source of the damage (effect name)
     * @returns {Object} Damage result
     */
    takeStatusDamage(damage, source) {
        const previousHP = this.currentHP;
        this.currentHP = Math.max(0, this.currentHP - damage);
        
        if (this.currentHP === 0 && this.isAlive) {
            this.isAlive = false;
            this.emit('death', { creature: this, source });
        }
        
        return {
            damage,
            source,
            previousHP,
            currentHP: this.currentHP
        };
    }

    /**
     * Heal this creature
     * @param {number} amount - Amount to heal
     * @returns {number} Actual amount healed
     */
    heal(amount) {
        const previousHP = this.currentHP;
        const actualHeal = Math.min(amount, this.maxHP - this.currentHP);
        this.currentHP += actualHeal;
        
        this.emit('heal', {
            creature: this,
            amount: actualHeal,
            previousHP,
            currentHP: this.currentHP
        });
        
        return actualHeal;
    }

    /**
     * Add shield points
     * @param {number} amount - Shield amount to add
     * @returns {number} Amount of shield added
     */
    addShield(amount) {
        const previousShield = this.shield;
        this.shield += amount;
        
        this.emit('shield', {
            creature: this,
            amount,
            previousShield,
            currentShield: this.shield
        });
        
        return amount;
    }

    // ==========================================
    // ENERGY SYSTEM
    // ==========================================

    /**
     * Check if creature can use a skill
     * @param {Object} skill - Skill to check
     * @returns {boolean} Whether the skill can be used
     */
    canUseSkill(skill) {
        return this.currentEnergy >= skill.cost && this.isAlive;
    }

    /**
     * Use a skill (consume energy)
     * @param {Object} skill - Skill to use
     * @returns {boolean} Whether the skill was successfully used
     */
    useSkill(skill) {
        if (!this.canUseSkill(skill)) {
            return false;
        }
        
        this.currentEnergy -= skill.cost;
        
        this.emit('skillUsed', {
            creature: this,
            skill,
            remainingEnergy: this.currentEnergy
        });
        
        return true;
    }

    /**
     * Recharge energy at start of turn
     */
    rechargeEnergy() {
        const GAME_CONSTANTS = window.GAME_CONSTANTS;
        const previousEnergy = this.currentEnergy;
        this.currentEnergy = Math.min(
            this.maxEnergy, 
            this.currentEnergy + GAME_CONSTANTS.ENERGY_REGEN_PER_TURN
        );
        
        this.emit('energyRecharged', {
            creature: this,
            previousEnergy,
            currentEnergy: this.currentEnergy,
            gained: this.currentEnergy - previousEnergy
        });
    }

    // ==========================================
    // STATUS EFFECTS
    // ==========================================

    /**
     * Add a status effect to this creature
     * @param {string} effectType - Type of effect (poison, burn, etc.)
     * @returns {boolean} Whether the effect was newly applied
     */
    addStatusEffect(effectType) {
        const STATUS_EFFECTS = window.STATUS_EFFECTS;
        const effectData = STATUS_EFFECTS[effectType];
        if (!effectData) {
            console.warn(`Unknown status effect: ${effectType}`);
            return false;
        }
        
        // Check for existing effect
        const existing = this.statusEffects.find(e => e.type === effectType);
        
        if (existing) {
            // Refresh duration
            existing.duration = effectData.duration;
            
            this.emit('statusRefreshed', {
                creature: this,
                effect: existing
            });
            
            return false;
        }
        
        // Add new effect
        const newEffect = {
            type: effectType,
            name: effectData.name,
            icon: effectData.icon,
            duration: effectData.duration,
            damagePerTurn: effectData.damagePerTurn || 0,
            skipChance: effectData.skipChance || 0,
            color: effectData.color
        };
        
        this.statusEffects.push(newEffect);
        
        this.emit('statusApplied', {
            creature: this,
            effect: newEffect
        });
        
        return true;
    }

    /**
     * Remove a status effect
     * @param {string} effectType - Type of effect to remove
     */
    removeStatusEffect(effectType) {
        const index = this.statusEffects.findIndex(e => e.type === effectType);
        
        if (index !== -1) {
            const removed = this.statusEffects.splice(index, 1)[0];
            
            this.emit('statusRemoved', {
                creature: this,
                effect: removed
            });
        }
    }

    /**
     * Process all status effects at end of turn
     * @returns {Array} Results of effect processing
     */
    processStatusEffects() {
        const results = [];
        
        this.statusEffects = this.statusEffects.filter(effect => {
            // Decrease duration
            effect.duration--;
            
            // Apply damage over time
            if (effect.damagePerTurn > 0 && this.isAlive) {
                const damageResult = this.takeStatusDamage(effect.damagePerTurn, effect.name);
                results.push({
                    type: 'damage',
                    effect: effect.name,
                    icon: effect.icon,
                    damage: damageResult.damage
                });
            }
            
            // Check if effect expired
            if (effect.duration <= 0) {
                results.push({
                    type: 'expired',
                    effect: effect.name,
                    icon: effect.icon
                });
                
                this.emit('statusExpired', {
                    creature: this,
                    effect
                });
                
                return false;
            }
            
            return true;
        });
        
        return results;
    }

    /**
     * Check if creature can act (not prevented by status)
     * @returns {Object} { canAct: boolean, reason?: string }
     */
    canAct() {
        if (!this.isAlive) {
            return { canAct: false, reason: 'dead' };
        }
        
        // Check for skip effects (freeze, paralyze)
        for (const effect of this.statusEffects) {
            if (effect.skipChance > 0) {
                const roll = Math.random() * 100;
                if (roll < effect.skipChance) {
                    return { 
                        canAct: false, 
                        reason: 'status',
                        effect
                    };
                }
            }
        }
        
        return { canAct: true };
    }

    /**
     * Check if creature has a specific status effect
     * @param {string} effectType - Effect type to check
     * @returns {boolean}
     */
    hasStatusEffect(effectType) {
        return this.statusEffects.some(e => e.type === effectType);
    }

    // ==========================================
    // UTILITY METHODS
    // ==========================================

    /**
     * Get HP percentage
     * @returns {number} HP percentage (0-100)
     */
    getHPPercent() {
        return (this.currentHP / this.maxHP) * 100;
    }

    /**
     * Get energy percentage
     * @returns {number} Energy percentage (0-100)
     */
    getEnergyPercent() {
        return (this.currentEnergy / this.maxEnergy) * 100;
    }

    /**
     * Get usable skills based on current energy
     * @returns {Array} Array of usable skills
     */
    getUsableSkills() {
        return this.skills.filter(skill => this.canUseSkill(skill));
    }

    /**
     * Reset creature to full health (for new battles)
     */
    reset() {
        this.currentHP = this.maxHP;
        this.currentEnergy = this.isEnemy 
            ? GAME_CONSTANTS.STARTING_ENERGY_ENEMY 
            : GAME_CONSTANTS.STARTING_ENERGY_PLAYER;
        this.isAlive = true;
        this.shield = 0;
        this.statusEffects = [];
    }

    /**
     * Create a serializable representation
     * @returns {Object} Serializable creature data
     */
    toJSON() {
        return {
            id: this.id,
            templateId: this.templateId,
            name: this.name,
            type: this.type,
            icon: this.icon,
            isEnemy: this.isEnemy,
            currentHP: this.currentHP,
            maxHP: this.maxHP,
            currentEnergy: this.currentEnergy,
            maxEnergy: this.maxEnergy,
            shield: this.shield,
            isAlive: this.isAlive,
            statusEffects: [...this.statusEffects]
        };
    }
}
window.Creature = Creature;
console.log('✅ Creature chargée et exposée globalement');