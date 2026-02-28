/**
 * ============================================
 * SKILL SYSTEM
 * Gère les compétences, apprentissage et améliorations
 * Fichier: js/systems/SkillSystem.js
 * 
 * FIX: Support de skill.power ET skill.damage
 * ============================================
 */

class SkillSystem {
    constructor() {
        // Configuration
        this.config = {
            maxSkillsPerCreature: 6,
            skillPointsPerLevel: 1,
            maxSkillLevel: 5,
            upgradeBoostPerLevel: 0.15 // +15% par niveau de skill
        };

        // Base de données de toutes les compétences
        this.skillDatabase = {
            // ═══════════════════════════════════════
            // COMPÉTENCES COMMUNES (tous types)
            // ═══════════════════════════════════════
            tackle: {
                id: 'tackle',
                name: 'Charge',
                damage: 30,
                cost: 1,
                description: 'Charge basique',
                type: 'attack',
                learnLevel: 1,
                category: 'common'
            },
            rest: {
                id: 'rest',
                name: 'Repos',
                damage: 0,
                heal: 40,
                cost: 3,
                description: 'Récupère des PV en se reposant',
                type: 'heal',
                learnLevel: 5,
                category: 'common'
            },
            protect: {
                id: 'protect',
                name: 'Protection',
                damage: 0,
                shield: 30,
                cost: 2,
                description: 'Crée un bouclier protecteur',
                type: 'shield',
                learnLevel: 8,
                category: 'common'
            },
            focus: {
                id: 'focus',
                name: 'Concentration',
                damage: 0,
                cost: 2,
                description: 'Augmente le taux critique de 20% pour 3 tours',
                type: 'buff',
                learnLevel: 12,
                category: 'common',
                buffEffect: { stat: 'critRate', boost: 20, duration: 3 }
            },

            // ═══════════════════════════════════════
            // COMPÉTENCES FEU
            // ═══════════════════════════════════════
            ember: {
                id: 'ember',
                name: 'Flammèche',
                damage: 45,
                cost: 2,
                description: 'Petit jet de flamme',
                type: 'attack',
                elementType: 'fire',
                learnLevel: 1,
                category: 'fire'
            },
            fireball: {
                id: 'fireball',
                name: 'Boule de Feu',
                damage: 75,
                cost: 4,
                description: 'Boule de feu puissante',
                type: 'attack',
                elementType: 'fire',
                learnLevel: 10,
                category: 'fire',
                statusEffect: 'burn',
                statusChance: 50
            },
            flamethrower: {
                id: 'flamethrower',
                name: 'Lance-Flammes',
                damage: 90,
                cost: 5,
                description: 'Jet de flammes continu',
                type: 'attack',
                elementType: 'fire',
                learnLevel: 18,
                category: 'fire',
                statusEffect: 'burn',
                statusChance: 70
            },
            inferno: {
                id: 'inferno',
                name: 'Enfer Ardent',
                damage: 140,
                cost: 6,
                description: '⭐ ULTIME - Inferno dévastateur',
                type: 'attack',
                elementType: 'fire',
                isUltimate: true,
                learnLevel: 25,
                category: 'fire',
                statusEffect: 'burn',
                statusChance: 100
            },
            heatwave: {
                id: 'heatwave',
                name: 'Vague de Chaleur',
                damage: 60,
                cost: 4,
                description: 'Attaque tous les ennemis',
                type: 'attack',
                elementType: 'fire',
                learnLevel: 30,
                category: 'fire',
                aoe: true
            },

            // ═══════════════════════════════════════
            // COMPÉTENCES EAU
            // ═══════════════════════════════════════
            watergun: {
                id: 'watergun',
                name: 'Pistolet à Eau',
                damage: 45,
                cost: 2,
                description: 'Jet d\'eau rapide',
                type: 'attack',
                elementType: 'water',
                learnLevel: 1,
                category: 'water'
            },
            bubble: {
                id: 'bubble',
                name: 'Bulles',
                damage: 55,
                cost: 3,
                description: 'Rafale de bulles',
                type: 'attack',
                elementType: 'water',
                learnLevel: 8,
                category: 'water'
            },
            aquajet: {
                id: 'aquajet',
                name: 'Aqua-Jet',
                damage: 70,
                cost: 4,
                description: 'Attaque prioritaire rapide',
                type: 'attack',
                elementType: 'water',
                learnLevel: 15,
                category: 'water',
                priority: true
            },
            hydropump: {
                id: 'hydropump',
                name: 'Hydrocanon',
                damage: 110,
                cost: 5,
                description: 'Canon d\'eau ultra-puissant',
                type: 'attack',
                elementType: 'water',
                learnLevel: 22,
                category: 'water'
            },
            tsunami: {
                id: 'tsunami',
                name: 'Tsunami',
                damage: 130,
                cost: 6,
                description: '⭐ ULTIME - Vague gigantesque',
                type: 'attack',
                elementType: 'water',
                isUltimate: true,
                learnLevel: 28,
                category: 'water',
                aoe: true
            },
            healing_rain: {
                id: 'healing_rain',
                name: 'Pluie Guérisseuse',
                damage: 0,
                heal: 35,
                cost: 4,
                description: 'Soigne toute l\'équipe',
                type: 'heal',
                elementType: 'water',
                learnLevel: 20,
                category: 'water',
                aoe: true
            },

            // ═══════════════════════════════════════
            // COMPÉTENCES PLANTE
            // ═══════════════════════════════════════
            vinewhip: {
                id: 'vinewhip',
                name: 'Fouet Liane',
                damage: 40,
                cost: 2,
                description: 'Attaque avec des lianes',
                type: 'attack',
                elementType: 'plant',
                learnLevel: 1,
                category: 'plant'
            },
            razorleaf: {
                id: 'razorleaf',
                name: 'Tranch\'Herbe',
                damage: 60,
                cost: 3,
                description: 'Feuilles tranchantes',
                type: 'attack',
                elementType: 'plant',
                learnLevel: 10,
                category: 'plant',
                critBonus: 10
            },
            synthesis: {
                id: 'synthesis',
                name: 'Synthèse',
                damage: 0,
                heal: 50,
                cost: 3,
                description: 'Soigne grâce au soleil',
                type: 'heal',
                elementType: 'plant',
                learnLevel: 12,
                category: 'plant'
            },
            toxic_spore: {
                id: 'toxic_spore',
                name: 'Spore Toxique',
                damage: 55,
                cost: 4,
                description: 'Empoisonne la cible',
                type: 'attack',
                elementType: 'plant',
                learnLevel: 18,
                category: 'plant',
                statusEffect: 'poison',
                statusChance: 80
            },
            solar_beam: {
                id: 'solar_beam',
                name: 'Lance-Soleil',
                damage: 120,
                cost: 5,
                description: 'Rayon solaire concentré',
                type: 'attack',
                elementType: 'plant',
                learnLevel: 24,
                category: 'plant'
            },
            mega_flora: {
                id: 'mega_flora',
                name: 'Méga Flore',
                damage: 135,
                cost: 6,
                description: '⭐ ULTIME - Explosion florale dévastatrice',
                type: 'attack',
                elementType: 'plant',
                isUltimate: true,
                learnLevel: 30,
                category: 'plant',
                statusEffect: 'poison',
                statusChance: 100
            },

            // ═══════════════════════════════════════
            // COMPÉTENCES ÉLECTRIQUE
            // ═══════════════════════════════════════
            thundershock: {
                id: 'thundershock',
                name: 'Éclair',
                damage: 45,
                cost: 2,
                description: 'Éclair rapide',
                type: 'attack',
                elementType: 'electric',
                learnLevel: 1,
                category: 'electric'
            },
            spark: {
                id: 'spark',
                name: 'Étincelle',
                damage: 55,
                cost: 3,
                description: 'Étincelles électriques',
                type: 'attack',
                elementType: 'electric',
                learnLevel: 8,
                category: 'electric',
                statusEffect: 'paralyze',
                statusChance: 30
            },
            thunderbolt: {
                id: 'thunderbolt',
                name: 'Tonnerre',
                damage: 85,
                cost: 4,
                description: 'Coup de tonnerre puissant',
                type: 'attack',
                elementType: 'electric',
                learnLevel: 16,
                category: 'electric',
                statusEffect: 'paralyze',
                statusChance: 60
            },
            discharge: {
                id: 'discharge',
                name: 'Décharge',
                damage: 70,
                cost: 4,
                description: 'Décharge électrique sur tous les ennemis',
                type: 'attack',
                elementType: 'electric',
                learnLevel: 22,
                category: 'electric',
                aoe: true,
                statusEffect: 'paralyze',
                statusChance: 40
            },
            thunder_storm: {
                id: 'thunder_storm',
                name: 'Tempête Électrique',
                damage: 140,
                cost: 6,
                description: '⭐ ULTIME - Orage destructeur',
                type: 'attack',
                elementType: 'electric',
                isUltimate: true,
                learnLevel: 28,
                category: 'electric',
                statusEffect: 'paralyze',
                statusChance: 80
            },

            // ═══════════════════════════════════════
            // COMPÉTENCES TERRE
            // ═══════════════════════════════════════
            rock_throw: {
                id: 'rock_throw',
                name: 'Jet de Roche',
                damage: 40,
                cost: 2,
                description: 'Lance des rochers',
                type: 'attack',
                elementType: 'earth',
                learnLevel: 1,
                category: 'earth'
            },
            mud_shot: {
                id: 'mud_shot',
                name: 'Tir de Boue',
                damage: 50,
                cost: 3,
                description: 'Boue qui ralentit',
                type: 'attack',
                elementType: 'earth',
                learnLevel: 8,
                category: 'earth',
                speedReduction: 0.2
            },
            earthquake: {
                id: 'earthquake',
                name: 'Séisme',
                damage: 80,
                cost: 5,
                description: 'Tremblement de terre puissant',
                type: 'attack',
                elementType: 'earth',
                learnLevel: 18,
                category: 'earth',
                aoe: true
            },
            stone_wall: {
                id: 'stone_wall',
                name: 'Mur de Pierre',
                damage: 0,
                shield: 60,
                cost: 4,
                description: 'Crée un mur de pierre protecteur',
                type: 'shield',
                elementType: 'earth',
                learnLevel: 14,
                category: 'earth'
            },
            cataclysm: {
                id: 'cataclysm',
                name: 'Cataclysme',
                damage: 130,
                cost: 6,
                description: '⭐ ULTIME - Séisme dévastateur',
                type: 'attack',
                elementType: 'earth',
                isUltimate: true,
                learnLevel: 26,
                category: 'earth',
                aoe: true
            },

            // ═══════════════════════════════════════
            // COMPÉTENCES GLACE
            // ═══════════════════════════════════════
            ice_shard: {
                id: 'ice_shard',
                name: 'Éclat de Glace',
                damage: 45,
                cost: 2,
                description: 'Projectile de glace rapide',
                type: 'attack',
                elementType: 'ice',
                learnLevel: 1,
                category: 'ice',
                priority: true
            },
            frost_breath: {
                id: 'frost_breath',
                name: 'Souffle Glacé',
                damage: 60,
                cost: 3,
                description: 'Souffle de froid intense',
                type: 'attack',
                elementType: 'ice',
                learnLevel: 10,
                category: 'ice',
                statusEffect: 'freeze',
                statusChance: 30
            },
            blizzard: {
                id: 'blizzard',
                name: 'Blizzard',
                damage: 90,
                cost: 5,
                description: 'Tempête de glace',
                type: 'attack',
                elementType: 'ice',
                learnLevel: 20,
                category: 'ice',
                aoe: true,
                statusEffect: 'freeze',
                statusChance: 40
            },
            ice_age: {
                id: 'ice_age',
                name: 'Ère Glaciaire',
                damage: 135,
                cost: 6,
                description: '⭐ ULTIME - Froid absolu',
                type: 'attack',
                elementType: 'ice',
                isUltimate: true,
                learnLevel: 28,
                category: 'ice',
                statusEffect: 'freeze',
                statusChance: 70
            }
        };

        // Compétences apprises par niveau selon le type
        this.learnableSkillsByType = {
            fire: ['ember', 'fireball', 'flamethrower', 'heatwave', 'inferno'],
            water: ['watergun', 'bubble', 'aquajet', 'hydropump', 'tsunami', 'healing_rain'],
            plant: ['vinewhip', 'razorleaf', 'synthesis', 'toxic_spore', 'solar_beam', 'mega_flora'],
            electric: ['thundershock', 'spark', 'thunderbolt', 'discharge', 'thunder_storm'],
            earth: ['rock_throw', 'mud_shot', 'stone_wall', 'earthquake', 'cataclysm'],
            ice: ['ice_shard', 'frost_breath', 'blizzard', 'ice_age']
        };
    }

    /**
     * Obtient toutes les compétences qu'une créature peut apprendre
     * @param {Creature} creature - Créature
     * @returns {Array} Liste des compétences apprenables
     */
    getLearnableSkills(creature) {
        const creatureType = creature.type;
        const creatureLevel = creature.level || 1;
        const currentSkillIds = creature.skills.map(s => s.id || s.name);

        // Compétences communes + type de la créature
        const availableSkillIds = [
            'tackle', 'rest', 'protect', 'focus',
            ...(this.learnableSkillsByType[creatureType] || [])
        ];

        return availableSkillIds
            .map(id => this.skillDatabase[id])
            .filter(skill => {
                if (!skill) return false;
                if (currentSkillIds.includes(skill.id)) return false;
                if (skill.learnLevel > creatureLevel) return false;
                return true;
            })
            .sort((a, b) => a.learnLevel - b.learnLevel);
    }

    /**
     * Obtient les nouvelles compétences disponibles au level up
     * @param {Creature} creature - Créature
     * @param {number} newLevel - Nouveau niveau
     * @returns {Array} Nouvelles compétences disponibles
     */
    getNewSkillsAtLevel(creature, newLevel) {
        const creatureType = creature.type;
        const currentSkillIds = creature.skills.map(s => s.id || s.name);

        const availableSkillIds = [
            'tackle', 'rest', 'protect', 'focus',
            ...(this.learnableSkillsByType[creatureType] || [])
        ];

        return availableSkillIds
            .map(id => this.skillDatabase[id])
            .filter(skill => {
                if (!skill) return false;
                if (currentSkillIds.includes(skill.id)) return false;
                if (skill.learnLevel !== newLevel) return false;
                return true;
            });
    }

    /**
     * Apprend une compétence à une créature
     * @param {Creature} creature - Créature
     * @param {string} skillId - ID de la compétence
     * @param {number} [replaceIndex] - Index de la compétence à remplacer (optionnel)
     * @returns {Object} Résultat
     */
    learnSkill(creature, skillId, replaceIndex = null) {
        const skill = this.skillDatabase[skillId];
        
        if (!skill) {
            return { success: false, reason: 'skill_not_found' };
        }

        const creatureLevel = creature.level || 1;
        if (skill.learnLevel > creatureLevel) {
            return { 
                success: false, 
                reason: 'level_too_low',
                requiredLevel: skill.learnLevel 
            };
        }

        // Vérifier si déjà apprise
        if (creature.skills.find(s => (s.id || s.name) === skillId)) {
            return { success: false, reason: 'already_learned' };
        }

        // Créer une copie de la compétence
        const newSkill = { ...skill, level: 1 };

        // Si nombre max de skills atteint
        if (creature.skills.length >= this.config.maxSkillsPerCreature) {
            if (replaceIndex !== null && replaceIndex < creature.skills.length) {
                const replaced = creature.skills[replaceIndex];
                creature.skills[replaceIndex] = newSkill;
                
                if (window.GlobalEvents) {
                    window.GlobalEvents.emit('skillLearned', {
                        creature,
                        newSkill,
                        replacedSkill: replaced
                    });
                }
                
                return { success: true, skill: newSkill, replaced };
            } else {
                return { 
                    success: false, 
                    reason: 'max_skills_reached',
                    currentSkills: creature.skills 
                };
            }
        }

        // Ajouter la compétence
        creature.skills.push(newSkill);

        if (window.GlobalEvents) {
            window.GlobalEvents.emit('skillLearned', {
                creature,
                newSkill
            });
        }

        return { success: true, skill: newSkill };
    }

    /**
     * Améliore une compétence
     * @param {Creature} creature - Créature
     * @param {number} skillIndex - Index de la compétence
     * @returns {Object} Résultat
     */
    upgradeSkill(creature, skillIndex) {
        if (skillIndex < 0 || skillIndex >= creature.skills.length) {
            return { success: false, reason: 'invalid_index' };
        }

        const skill = creature.skills[skillIndex];
        const currentLevel = skill.level || 1;

        if (currentLevel >= this.config.maxSkillLevel) {
            return { success: false, reason: 'max_level_reached' };
        }

        // Vérifier points de compétence
        const skillPoints = creature.skillPoints || 0;
        const cost = currentLevel; // Coût = niveau actuel

        if (skillPoints < cost) {
            return { 
                success: false, 
                reason: 'not_enough_points',
                required: cost,
                available: skillPoints 
            };
        }

        // Appliquer l'amélioration
        creature.skillPoints -= cost;
        skill.level = currentLevel + 1;

        const boost = this.config.upgradeBoostPerLevel;
        
        // FIX: Support power ET damage
        if (skill.damage) {
            skill.damage = Math.floor(skill.damage * (1 + boost));
        }
        if (skill.power) {
            skill.power = Math.floor(skill.power * (1 + boost));
        }
        if (skill.heal) {
            skill.heal = Math.floor(skill.heal * (1 + boost));
        }
        if (skill.shield) {
            skill.shield = Math.floor(skill.shield * (1 + boost));
        }
        if (skill.statusChance) {
            skill.statusChance = Math.min(100, skill.statusChance + 5);
        }

        if (window.GlobalEvents) {
            window.GlobalEvents.emit('skillUpgraded', {
                creature,
                skill,
                newLevel: skill.level
            });
        }

        return { 
            success: true, 
            skill, 
            newLevel: skill.level,
            remainingPoints: creature.skillPoints 
        };
    }

    /**
     * Donne des points de compétence à une créature
     * @param {Creature} creature - Créature
     * @param {number} points - Nombre de points
     */
    giveSkillPoints(creature, points) {
        if (!creature.skillPoints) creature.skillPoints = 0;
        creature.skillPoints += points;
        
        return creature.skillPoints;
    }

    /**
     * Obtient une compétence par son ID
     * @param {string} skillId - ID de la compétence
     * @returns {Object|null} Compétence ou null
     */
    getSkill(skillId) {
        return this.skillDatabase[skillId] || null;
    }

    /**
     * Obtient toutes les compétences d'une catégorie
     * @param {string} category - Catégorie (fire, water, etc.)
     * @returns {Array} Compétences de la catégorie
     */
    getSkillsByCategory(category) {
        return Object.values(this.skillDatabase)
            .filter(skill => skill.category === category);
    }

    /**
     * Calcule les dégâts d'une compétence avec tous les bonus
     * @param {Object} skill - Compétence
     * @param {Creature} attacker - Attaquant
     * @param {Creature} target - Cible
     * @returns {Object} Détails des dégâts
     * 
     * ═══════════════════════════════════════════════════════════════
     * FIX PRINCIPAL: Supporte skill.power ET skill.damage
     * ═══════════════════════════════════════════════════════════════
     */
    calculateSkillDamage(skill, attacker, target) {
        // FIX: Utiliser power OU damage
        const skillPower = skill.power || skill.damage || 0;
        
        if (skillPower <= 0) {
            return { damage: 0, isCritical: false, effectiveness: 1 };
        }

        const skillLevel = skill.level || 1;
        let baseDamage = skillPower;
        
        // Bonus niveau compétence
        baseDamage *= (1 + (skillLevel - 1) * this.config.upgradeBoostPerLevel);
        
        // Stat attaque
        baseDamage *= (attacker.attack / 50);

        // Critique
        let isCritical = false;
        let critBonus = skill.critBonus || 0;
        if (Math.random() * 100 < (attacker.critRate + critBonus)) {
            baseDamage *= 1.5;
            isCritical = true;
        }

        // Type effectiveness
        // FIX: Utiliser skill.type OU skill.elementType OU attacker.type
        let effectiveness = 1;
        const attackType = skill.type || skill.elementType || attacker.type;
        
        if (window.TYPE_EFFECTIVENESS && attackType) {
            effectiveness = window.TYPE_EFFECTIVENESS[attackType]?.[target.type] ?? 1;
        }
        baseDamage *= effectiveness;

        // Défense
        baseDamage = Math.max(1, baseDamage - target.defense * 0.3);

        return {
            damage: Math.floor(baseDamage),
            isCritical,
            effectiveness,
            skillLevel
        };
    }
}

// Exposition globale
window.SkillSystem = SkillSystem;
console.log('✅ SkillSystem chargé (avec support power/damage)');