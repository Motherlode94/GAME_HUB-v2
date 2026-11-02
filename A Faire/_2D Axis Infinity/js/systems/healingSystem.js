/**
 * ============================================
 * HEALING SYSTEM
 * Gère les soins pour les créatures (joueur et ennemi)
 * ============================================
 */

class HealingSystem {
    constructor() {
        // Types de soins disponibles
        this.healTypes = {
            instant: 'instant',      // Soin immédiat
            overTime: 'overTime',    // Soin sur plusieurs tours (HoT)
            percentage: 'percentage', // Soin en % des PV max
            lifesteal: 'lifesteal'   // Vol de vie
        };
        
        // Effets de soin actifs (HoT)
        this.activeHealEffects = new Map();
    }

    // ─────────────────────────────────────────────
    // SOINS INSTANTANÉS
    // ─────────────────────────────────────────────
    
    /**
     * Soigne une créature instantanément
     * @param {Creature} target - Créature à soigner
     * @param {number} amount - Montant de soin
     * @param {Creature} [source] - Source du soin (optionnel)
     * @returns {Object} Résultat du soin
     */
    healInstant(target, amount, source = null) {
        if (!target || !target.isAlive) {
            return { success: false, reason: 'target_invalid' };
        }

        const previousHP = target.currentHP;
        const maxHeal = target.maxHP - target.currentHP;
        const actualHeal = Math.min(amount, maxHeal);
        
        target.currentHP += actualHeal;

        const result = {
            success: true,
            type: this.healTypes.instant,
            target: target,
            source: source,
            amount: actualHeal,
            overheal: amount - actualHeal,
            previousHP: previousHP,
            currentHP: target.currentHP,
            isFullHP: target.currentHP >= target.maxHP
        };

        // Émettre l'événement si la créature a un EventEmitter
        if (target.emit) {
            target.emit('healed', result);
        }
        
        // Événement global
        if (window.GlobalEvents) {
            window.GlobalEvents.emit('creatureHealed', result);
        }

        console.log(`💚 ${target.name} soigné de ${actualHeal} PV (${previousHP} → ${target.currentHP})`);
        
        return result;
    }

    /**
     * Soin en pourcentage des PV max
     * @param {Creature} target - Créature à soigner
     * @param {number} percent - Pourcentage de PV max à soigner (0-100)
     * @param {Creature} [source] - Source du soin
     * @returns {Object} Résultat du soin
     */
    healPercent(target, percent, source = null) {
        const amount = Math.floor(target.maxHP * (percent / 100));
        return this.healInstant(target, amount, source);
    }

    /**
     * Soin de groupe (toute l'équipe)
     * @param {Array<Creature>} team - Équipe à soigner
     * @param {number} amount - Montant de soin par créature
     * @param {Creature} [source] - Source du soin
     * @returns {Array<Object>} Résultats des soins
     */
    healTeam(team, amount, source = null) {
        const results = [];
        
        team.forEach(creature => {
            if (creature.isAlive) {
                results.push(this.healInstant(creature, amount, source));
            }
        });

        if (window.GlobalEvents) {
            window.GlobalEvents.emit('teamHealed', { team, results, source });
        }

        return results;
    }

    // ─────────────────────────────────────────────
    // SOINS SUR LA DURÉE (HoT)
    // ─────────────────────────────────────────────
    
    /**
     * Applique un effet de soin sur la durée
     * @param {Creature} target - Créature cible
     * @param {number} healPerTurn - Soin par tour
     * @param {number} duration - Durée en tours
     * @param {string} [effectName] - Nom de l'effet
     * @returns {Object} L'effet appliqué
     */
    applyHealOverTime(target, healPerTurn, duration, effectName = 'Régénération') {
        if (!target || !target.isAlive) {
            return { success: false, reason: 'target_invalid' };
        }

        const effectId = `hot_${target.id}_${Date.now()}`;
        
        const effect = {
            id: effectId,
            name: effectName,
            icon: '💖',
            target: target,
            healPerTurn: healPerTurn,
            duration: duration,
            remainingTurns: duration,
            totalHealed: 0
        };

        // Stocker l'effet
        if (!this.activeHealEffects.has(target.id)) {
            this.activeHealEffects.set(target.id, []);
        }
        this.activeHealEffects.get(target.id).push(effect);

        // Ajouter aux statusEffects de la créature pour l'affichage
        if (target.statusEffects) {
            target.statusEffects.push({
                type: 'regeneration',
                name: effectName,
                icon: '💖',
                duration: duration,
                color: '#4CAF50',
                isHeal: true,
                healPerTurn: healPerTurn
            });
        }

        console.log(`💖 ${effectName} appliqué sur ${target.name}: +${healPerTurn} PV/tour pendant ${duration} tours`);

        return { success: true, effect };
    }

    /**
     * Traite les effets HoT d'une créature (à appeler chaque tour)
     * @param {Creature} target - Créature à traiter
     * @returns {Array<Object>} Résultats des soins
     */
    processHealOverTime(target) {
        const effects = this.activeHealEffects.get(target.id);
        if (!effects || effects.length === 0) return [];

        const results = [];

        // Filtrer les effets expirés et appliquer les soins
        this.activeHealEffects.set(
            target.id,
            effects.filter(effect => {
                if (!target.isAlive) return false;

                // Appliquer le soin
                const healResult = this.healInstant(target, effect.healPerTurn);
                effect.totalHealed += healResult.amount;
                effect.remainingTurns--;

                results.push({
                    effect: effect.name,
                    healed: healResult.amount,
                    remainingTurns: effect.remainingTurns
                });

                // Retirer l'effet s'il a expiré
                if (effect.remainingTurns <= 0) {
                    console.log(`💖 ${effect.name} sur ${target.name} a expiré (total: ${effect.totalHealed} PV)`);
                    
                    // Retirer des statusEffects
                    if (target.statusEffects) {
                        const idx = target.statusEffects.findIndex(s => s.type === 'regeneration');
                        if (idx !== -1) target.statusEffects.splice(idx, 1);
                    }
                    
                    return false;
                }

                return true;
            })
        );

        return results;
    }

    // ─────────────────────────────────────────────
    // VOL DE VIE (LIFESTEAL)
    // ─────────────────────────────────────────────
    
    /**
     * Applique un effet de vol de vie
     * @param {Creature} attacker - Créature qui attaque
     * @param {number} damageDealt - Dégâts infligés
     * @param {number} lifestealPercent - Pourcentage de vol de vie (0-100)
     * @returns {Object} Résultat du vol de vie
     */
    applyLifesteal(attacker, damageDealt, lifestealPercent) {
        if (!attacker || !attacker.isAlive || damageDealt <= 0) {
            return { success: false, healed: 0 };
        }

        const healAmount = Math.floor(damageDealt * (lifestealPercent / 100));
        const result = this.healInstant(attacker, healAmount);

        console.log(`🧛 ${attacker.name} vole ${result.amount} PV (${lifestealPercent}% de ${damageDealt})`);

        return {
            success: true,
            type: this.healTypes.lifesteal,
            healed: result.amount,
            damageDealt: damageDealt,
            lifestealPercent: lifestealPercent
        };
    }

    // ─────────────────────────────────────────────
    // RÉSURRECTION
    // ─────────────────────────────────────────────
    
    /**
     * Ressuscite une créature morte
     * @param {Creature} target - Créature à ressusciter
     * @param {number} hpPercent - Pourcentage de PV après résurrection (0-100)
     * @returns {Object} Résultat de la résurrection
     */
    resurrect(target, hpPercent = 50) {
        if (!target) {
            return { success: false, reason: 'target_invalid' };
        }

        if (target.isAlive) {
            return { success: false, reason: 'target_alive' };
        }

        const newHP = Math.floor(target.maxHP * (hpPercent / 100));
        target.currentHP = Math.max(1, newHP);
        target.isAlive = true;
        
        // Nettoyer les effets de statut négatifs
        if (target.statusEffects) {
            target.statusEffects = target.statusEffects.filter(e => e.isHeal);
        }

        const result = {
            success: true,
            target: target,
            newHP: target.currentHP,
            hpPercent: hpPercent
        };

        if (window.GlobalEvents) {
            window.GlobalEvents.emit('creatureResurrected', result);
        }

        console.log(`✨ ${target.name} ressuscité avec ${target.currentHP} PV!`);

        return result;
    }

    // ─────────────────────────────────────────────
    // IA DE SOIN (pour les ennemis)
    // ─────────────────────────────────────────────
    
    /**
     * Détermine si un ennemi devrait utiliser un soin
     * @param {Creature} creature - Créature IA
     * @param {Array<Creature>} team - Équipe de la créature
     * @returns {Object|null} Décision de soin ou null
     */
    getAIHealDecision(creature, team) {
        // Vérifier si la créature a des skills de soin
        const healSkills = creature.skills?.filter(s => s.heal > 0 || s.healPercent > 0) || [];
        
        if (healSkills.length === 0) return null;

        // Trouver les alliés qui ont besoin de soin
        const aliveAllies = team.filter(c => c.isAlive);
        const woundedAllies = aliveAllies.filter(c => (c.currentHP / c.maxHP) < 0.6);
        const criticalAllies = aliveAllies.filter(c => (c.currentHP / c.maxHP) < 0.3);

        // Priorité 1: Soigner les alliés en état critique
        if (criticalAllies.length > 0) {
            const target = criticalAllies.reduce((lowest, c) => 
                (c.currentHP / c.maxHP) < (lowest.currentHP / lowest.maxHP) ? c : lowest
            );
            
            // Choisir le meilleur skill de soin disponible
            const usableHealSkill = healSkills.find(s => creature.currentEnergy >= s.cost);
            
            if (usableHealSkill) {
                return {
                    shouldHeal: true,
                    priority: 'critical',
                    target: target,
                    skill: usableHealSkill
                };
            }
        }

        // Priorité 2: Se soigner soi-même si HP < 40%
        if ((creature.currentHP / creature.maxHP) < 0.4) {
            const usableHealSkill = healSkills.find(s => creature.currentEnergy >= s.cost);
            
            if (usableHealSkill && Math.random() > 0.3) {
                return {
                    shouldHeal: true,
                    priority: 'self',
                    target: creature,
                    skill: usableHealSkill
                };
            }
        }

        // Priorité 3: Soigner les alliés blessés (probabilité réduite)
        if (woundedAllies.length > 0 && Math.random() > 0.6) {
            const target = woundedAllies[Math.floor(Math.random() * woundedAllies.length)];
            const usableHealSkill = healSkills.find(s => creature.currentEnergy >= s.cost);
            
            if (usableHealSkill) {
                return {
                    shouldHeal: true,
                    priority: 'wounded',
                    target: target,
                    skill: usableHealSkill
                };
            }
        }

        return null;
    }

    // ─────────────────────────────────────────────
    // UTILITAIRES
    // ─────────────────────────────────────────────
    
    /**
     * Nettoie tous les effets HoT d'une créature
     * @param {Creature} target - Créature cible
     */
    clearHealEffects(target) {
        this.activeHealEffects.delete(target.id);
        
        if (target.statusEffects) {
            target.statusEffects = target.statusEffects.filter(e => !e.isHeal);
        }
    }

    /**
     * Nettoie tous les effets HoT (fin de combat)
     */
    clearAllEffects() {
        this.activeHealEffects.clear();
    }

    /**
     * Obtient les effets HoT actifs d'une créature
     * @param {Creature} target - Créature cible
     * @returns {Array} Liste des effets
     */
    getActiveEffects(target) {
        return this.activeHealEffects.get(target.id) || [];
    }
}

// Exposition globale
window.HealingSystem = HealingSystem;

console.log('✅ HealingSystem chargé');