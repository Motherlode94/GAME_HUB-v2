/**
 * ============================================
 * EVOLUTION SYSTEM
 * Gère l'évolution des créatures
 * Les créatures évoluent en formes plus puissantes
 * Fichier: js/systems/EvolutionSystem.js
 * ============================================
 */

class EvolutionSystem {
    constructor() {
        // Configuration
        this.config = {
            evolutionLevels: [15, 35],  // Niveaux pour évoluer (stade 2, stade 3)
            statBoostPerEvolution: 0.30, // +30% stats à chaque évolution
            newSkillOnEvolution: true,
            maxEvolutionStage: 3
        };

        // Données d'évolution des créatures
        this.evolutionData = {
            // Plantes
            1: { // Verdura
                stages: [
                    { name: 'Verdura', icon: '🌿', stage: 1 },
                    { name: 'Floravine', icon: '🌳', stage: 2, bonusSkill: 'Régénération' },
                    { name: 'Ancestra', icon: '🌲', stage: 3, bonusSkill: 'Forêt Ancestrale' }
                ]
            },
            6: { // Florax
                stages: [
                    { name: 'Florax', icon: '🌺', stage: 1 },
                    { name: 'Roselia', icon: '🌹', stage: 2, bonusSkill: 'Pollen Toxique' },
                    { name: 'Florakami', icon: '🌸', stage: 3, bonusSkill: 'Jardin Divin' }
                ]
            },
            // Feu
            2: { // Flamora
                stages: [
                    { name: 'Flamora', icon: '🔥', stage: 1 },
                    { name: 'Pyrana', icon: '🦊', stage: 2, bonusSkill: 'Mur de Flammes' },
                    { name: 'Infernia', icon: '👹', stage: 3, bonusSkill: 'Nova Solaire' }
                ]
            },
            7: { // Pyrok
                stages: [
                    { name: 'Pyrok', icon: '🌋', stage: 1 },
                    { name: 'Magmor', icon: '🗿', stage: 2, bonusSkill: 'Armure de Lave' },
                    { name: 'Volcanius', icon: '🐉', stage: 3, bonusSkill: 'Apocalypse' }
                ]
            },
            // Eau
            3: { // Aqualis
                stages: [
                    { name: 'Aqualis', icon: '💧', stage: 1 },
                    { name: 'Maréon', icon: '🌊', stage: 2, bonusSkill: 'Brume Marine' },
                    { name: 'Poseidra', icon: '🔱', stage: 3, bonusSkill: 'Colère des Mers' }
                ]
            },
            8: { // Glacior
                stages: [
                    { name: 'Glacior', icon: '❄️', stage: 1 },
                    { name: 'Frostbite', icon: '🧊', stage: 2, bonusSkill: 'Congélation' },
                    { name: 'Cryoking', icon: '👑', stage: 3, bonusSkill: 'Zéro Absolu' }
                ]
            },
            // Électrique
            4: { // Voltix
                stages: [
                    { name: 'Voltix', icon: '⚡', stage: 1 },
                    { name: 'Thundera', icon: '🌩️', stage: 2, bonusSkill: 'Champ Magnétique' },
                    { name: 'Zeusark', icon: '⚡👑', stage: 3, bonusSkill: 'Jugement Divin' }
                ]
            },
            // Terre
            5: { // Terros
                stages: [
                    { name: 'Terros', icon: '🪨', stage: 1 },
                    { name: 'Gravitor', icon: '⛰️', stage: 2, bonusSkill: 'Armure Rocheuse' },
                    { name: 'Titanor', icon: '🏔️', stage: 3, bonusSkill: 'Fracture Terrestre' }
                ]
            }
        };

        // Compétences bonus débloquées par évolution
        this.evolutionSkills = {
            'Régénération': {
                name: 'Régénération',
                damage: 0,
                heal: 25,
                cost: 2,
                description: 'Régénère des PV chaque tour pendant 3 tours',
                type: 'heal',
                healOverTime: { amount: 15, duration: 3 }
            },
            'Forêt Ancestrale': {
                name: 'Forêt Ancestrale',
                damage: 150,
                cost: 7,
                description: '⭐ ULTIME - Invoque la puissance de la forêt primordiale',
                isUltimate: true,
                type: 'attack',
                statusEffect: 'poison',
                statusChance: 100
            },
            'Pollen Toxique': {
                name: 'Pollen Toxique',
                damage: 35,
                cost: 3,
                description: 'Empoisonne tous les ennemis',
                type: 'attack',
                statusEffect: 'poison',
                statusChance: 80,
                aoe: true
            },
            'Jardin Divin': {
                name: 'Jardin Divin',
                damage: 0,
                heal: 60,
                cost: 6,
                description: '⭐ ULTIME - Soigne toute l\'équipe',
                isUltimate: true,
                type: 'heal',
                aoe: true
            },
            'Mur de Flammes': {
                name: 'Mur de Flammes',
                damage: 0,
                shield: 50,
                cost: 4,
                description: 'Crée un bouclier de feu qui brûle les attaquants',
                type: 'shield',
                reflectDamage: 20
            },
            'Nova Solaire': {
                name: 'Nova Solaire',
                damage: 180,
                cost: 8,
                description: '⭐ ULTIME - Explosion solaire dévastatrice',
                isUltimate: true,
                type: 'attack',
                statusEffect: 'burn',
                statusChance: 100
            },
            'Armure de Lave': {
                name: 'Armure de Lave',
                damage: 0,
                shield: 70,
                cost: 5,
                description: 'Armure de lave qui augmente aussi l\'attaque',
                type: 'shield',
                attackBoost: 1.2
            },
            'Apocalypse': {
                name: 'Apocalypse',
                damage: 200,
                cost: 9,
                description: '⭐ ULTIME - Déclenche l\'apocalypse volcanique',
                isUltimate: true,
                type: 'attack',
                aoe: true
            },
            'Brume Marine': {
                name: 'Brume Marine',
                damage: 0,
                cost: 3,
                description: 'Augmente l\'esquive de l\'équipe',
                type: 'buff',
                dodgeBoost: 30
            },
            'Colère des Mers': {
                name: 'Colère des Mers',
                damage: 160,
                cost: 7,
                description: '⭐ ULTIME - Déchaîne la fureur des océans',
                isUltimate: true,
                type: 'attack',
                statusEffect: 'freeze',
                statusChance: 60
            },
            'Congélation': {
                name: 'Congélation',
                damage: 50,
                cost: 4,
                description: 'Gèle la cible à coup sûr',
                type: 'attack',
                statusEffect: 'freeze',
                statusChance: 100
            },
            'Zéro Absolu': {
                name: 'Zéro Absolu',
                damage: 170,
                cost: 8,
                description: '⭐ ULTIME - Froid absolu qui gèle tout',
                isUltimate: true,
                type: 'attack',
                statusEffect: 'freeze',
                statusChance: 100,
                aoe: true
            },
            'Champ Magnétique': {
                name: 'Champ Magnétique',
                damage: 40,
                cost: 3,
                description: 'Paralyse et réduit la défense ennemie',
                type: 'attack',
                statusEffect: 'paralyze',
                statusChance: 70,
                defenseReduction: 0.2
            },
            'Jugement Divin': {
                name: 'Jugement Divin',
                damage: 190,
                cost: 8,
                description: '⭐ ULTIME - Foudre divine imparable',
                isUltimate: true,
                type: 'attack',
                ignoreDefense: true
            },
            'Armure Rocheuse': {
                name: 'Armure Rocheuse',
                damage: 0,
                shield: 80,
                cost: 4,
                description: 'Bouclier massif de roche',
                type: 'shield',
                defenseBoost: 1.3
            },
            'Fracture Terrestre': {
                name: 'Fracture Terrestre',
                damage: 155,
                cost: 7,
                description: '⭐ ULTIME - Fissure le sol sous les ennemis',
                isUltimate: true,
                type: 'attack',
                aoe: true,
                stunChance: 40
            }
        };
    }

    /**
     * Vérifie si une créature peut évoluer
     * @param {Creature} creature - Créature à vérifier
     * @returns {Object} { canEvolve, nextStage, requiredLevel }
     */
    canEvolve(creature) {
        const currentStage = creature.evolutionStage || 1;
        const evolutionInfo = this.evolutionData[creature.templateId];

        if (!evolutionInfo || currentStage >= this.config.maxEvolutionStage) {
            return { canEvolve: false, reason: 'max_stage_reached' };
        }

        const requiredLevel = this.config.evolutionLevels[currentStage - 1];
        const creatureLevel = creature.level || 1;

        if (creatureLevel < requiredLevel) {
            return { 
                canEvolve: false, 
                reason: 'level_too_low',
                currentLevel: creatureLevel,
                requiredLevel 
            };
        }

        const nextStageData = evolutionInfo.stages[currentStage];
        
        return {
            canEvolve: true,
            currentStage,
            nextStage: currentStage + 1,
            nextForm: nextStageData,
            requiredLevel
        };
    }

    /**
     * Fait évoluer une créature
     * @param {Creature} creature - Créature à faire évoluer
     * @returns {Object} Résultat de l'évolution
     */
    evolve(creature) {
        const check = this.canEvolve(creature);
        
        if (!check.canEvolve) {
            return { success: false, ...check };
        }

        const previousForm = {
            name: creature.name,
            icon: creature.icon,
            stage: creature.evolutionStage || 1
        };

        // Appliquer la nouvelle forme
        creature.name = check.nextForm.name;
        creature.icon = check.nextForm.icon;
        creature.evolutionStage = check.nextStage;

        // Boost des stats
        const boost = 1 + this.config.statBoostPerEvolution;
        creature.maxHP = Math.floor(creature.maxHP * boost);
        creature.currentHP = creature.maxHP; // Full heal on evolution
        creature.attack = Math.floor(creature.attack * boost);
        creature.defense = Math.floor(creature.defense * boost);
        creature.speed = Math.floor(creature.speed * boost);
        creature.critRate = Math.min(creature.critRate + 5, 50);

        // Ajouter nouvelle compétence
        let newSkill = null;
        if (this.config.newSkillOnEvolution && check.nextForm.bonusSkill) {
            newSkill = this.evolutionSkills[check.nextForm.bonusSkill];
            if (newSkill && !creature.skills.find(s => s.name === newSkill.name)) {
                creature.skills.push({ ...newSkill });
            }
        }

        // Augmenter l'énergie max
        creature.maxEnergy = Math.min(creature.maxEnergy + 1, 10);
        creature.currentEnergy = creature.maxEnergy;

        // Émettre événement
        if (window.GlobalEvents) {
            window.GlobalEvents.emit('evolution', {
                creature,
                previousForm,
                newForm: check.nextForm,
                newSkill
            });
        }

        return {
            success: true,
            creature,
            previousForm,
            newForm: check.nextForm,
            newSkill,
            statsBoost: `+${Math.floor(this.config.statBoostPerEvolution * 100)}%`
        };
    }

    /**
     * Obtient les infos d'évolution d'une créature
     * @param {Creature} creature - Créature
     * @returns {Object} Infos d'évolution
     */
    getEvolutionInfo(creature) {
        const evolutionInfo = this.evolutionData[creature.templateId];
        
        if (!evolutionInfo) {
            return { hasEvolution: false };
        }

        const currentStage = creature.evolutionStage || 1;
        
        return {
            hasEvolution: true,
            currentStage,
            maxStage: this.config.maxEvolutionStage,
            stages: evolutionInfo.stages,
            currentForm: evolutionInfo.stages[currentStage - 1],
            nextForm: currentStage < this.config.maxEvolutionStage 
                ? evolutionInfo.stages[currentStage] 
                : null,
            nextEvolutionLevel: currentStage < this.config.maxEvolutionStage 
                ? this.config.evolutionLevels[currentStage - 1] 
                : null
        };
    }

    /**
     * Obtient la prévisualisation de la prochaine évolution
     * @param {Creature} creature - Créature
     * @returns {Object|null} Prévisualisation ou null
     */
    getEvolutionPreview(creature) {
        const info = this.getEvolutionInfo(creature);
        
        if (!info.hasEvolution || !info.nextForm) {
            return null;
        }

        const boost = this.config.statBoostPerEvolution;
        
        return {
            nextForm: info.nextForm,
            requiredLevel: info.nextEvolutionLevel,
            currentLevel: creature.level || 1,
            preview: {
                maxHP: Math.floor(creature.maxHP * (1 + boost)),
                attack: Math.floor(creature.attack * (1 + boost)),
                defense: Math.floor(creature.defense * (1 + boost)),
                newSkill: info.nextForm.bonusSkill 
                    ? this.evolutionSkills[info.nextForm.bonusSkill] 
                    : null
            }
        };
    }
}

// Exposition globale
window.EvolutionSystem = EvolutionSystem;
console.log('✅ EvolutionSystem chargé');