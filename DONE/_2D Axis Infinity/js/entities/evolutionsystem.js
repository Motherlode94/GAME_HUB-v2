/**
 * ============================================
 * EVOLUTION SYSTEM
 * ============================================
 * Gère l'évolution des créatures (Pokémon) et la digivolution (Digimon)
 */

window.EVOLUTION_SYSTEM = {
    /**
     * Chaînes d'évolution Pokémon-style
     * Format: id_creature: { level: niveau_requis, evolves_to: id_evolution }
     */
    evolutions: {
        // Ligne Pikaflame
        pikaflame: {
            level: 16,
            evolvesTo: 'raiflare',
            method: 'level',
            description: 'Évolue par niveau'
        },
        raiflare: {
            level: 36,
            evolvesTo: 'voltragon',
            method: 'level',
            description: 'Évolue par niveau'
        },

        // Ligne Aquatle
        aquatle: {
            level: 16,
            evolvesTo: 'aquashell',
            method: 'level',
            description: 'Évolue par niveau'
        },
        aquashell: {
            level: 36,
            evolvesTo: 'titanoise',
            method: 'level',
            description: 'Évolue par niveau'
        },

        // Ligne Verdantia
        verdantia: {
            level: 16,
            evolvesTo: 'floragarde',
            method: 'level',
            description: 'Évolue par niveau'
        },
        floragarde: {
            level: 36,
            evolvesTo: 'megavine',
            method: 'level',
            description: 'Évolue par niveau'
        },

        // Ligne Koromon (Digimon style - par combat)
        koromon: {
            battles: 5,
            evolvesTo: 'agumon',
            method: 'battles',
            description: 'Digivolve après 5 combats gagnés'
        },
        agumon: {
            battles: 10,
            evolvesTo: 'agudramon',
            method: 'battles',
            description: 'Digivolve après 10 combats gagnés'
        },

        // Ligne Gabumon
        tentomon: {
            battles: 8,
            evolvesTo: 'kabuterimon',
            method: 'battles',
            description: 'Digivolve après 8 combats gagnés'
        }
    },

    /**
     * Nouvelles créatures évoluées (à ajouter au CREATURE_TEMPLATES)
     */
    evolutionForms: {
        // Évolutions de Pikaflame
        raiflare: {
            id: 'raiflare',
            name: 'Raiflare',
            type: 'electric',
            icon: '⚡🔥',
            species: 'pokemon',
            baseHP: 130,
            baseAttack: 110,
            baseDefense: 85,
            baseSpeed: 130,
            critRate: 20,
            description: 'Évolution de Pikaflame, maîtrise électricité et flammes.',
            skills: [
                {
                    id: 'thunder_shock',
                    name: 'Éclair',
                    type: 'electric',
                    power: 40,
                    cost: 1,
                    effect: 'paralyze',
                    effectChance: 20
                },
                {
                    id: 'flame_burst',
                    name: 'Explosion de Flammes',
                    type: 'fire',
                    power: 65,
                    cost: 2,
                    effect: 'burn',
                    effectChance: 30
                },
                {
                    id: 'thunderbolt',
                    name: 'Tonnerre',
                    type: 'electric',
                    power: 90,
                    cost: 3,
                    effect: 'paralyze',
                    effectChance: 10
                },
                {
                    id: 'fire_blast',
                    name: 'Déflagration',
                    type: 'fire',
                    power: 110,
                    cost: 4,
                    effect: 'burn',
                    effectChance: 30
                }
            ]
        },

        voltragon: {
            id: 'voltragon',
            name: 'Voltragon',
            type: 'dragon',
            icon: '🐲⚡',
            species: 'pokemon',
            baseHP: 150,
            baseAttack: 130,
            baseDefense: 100,
            baseSpeed: 145,
            critRate: 25,
            description: 'Forme finale : dragon électrique légendaire.',
            skills: [
                {
                    id: 'dragon_pulse',
                    name: 'Dracochoc',
                    type: 'dragon',
                    power: 85,
                    cost: 3
                },
                {
                    id: 'thunderbolt',
                    name: 'Tonnerre',
                    type: 'electric',
                    power: 90,
                    cost: 3,
                    effect: 'paralyze',
                    effectChance: 10
                },
                {
                    id: 'draco_thunder',
                    name: 'Dracofoudre',
                    type: 'dragon',
                    power: 130,
                    cost: 5,
                    description: 'Attaque signature fusionnant dragon et électricité'
                },
                {
                    id: 'extreme_speed',
                    name: 'Vitesse Extrême',
                    type: 'normal',
                    power: 80,
                    cost: 2,
                    priority: true
                }
            ]
        },

        // Évolutions Aquatle
        aquashell: {
            id: 'aquashell',
            name: 'Aquashell',
            type: 'water',
            icon: '🌊🛡️',
            species: 'pokemon',
            baseHP: 145,
            baseAttack: 85,
            baseDefense: 110,
            baseSpeed: 90,
            critRate: 12,
            description: 'Tortue blindée avec carapace renforcée.',
            skills: [
                {
                    id: 'water_gun',
                    name: 'Pistolet à O',
                    type: 'water',
                    power: 40,
                    cost: 1
                },
                {
                    id: 'aqua_tail',
                    name: 'Hydroqueue',
                    type: 'water',
                    power: 90,
                    cost: 3
                },
                {
                    id: 'iron_defense',
                    name: 'Défense de Fer',
                    type: 'steel',
                    power: 0,
                    cost: 2,
                    defenseBuff: 50
                },
                {
                    id: 'surf',
                    name: 'Surf',
                    type: 'water',
                    power: 95,
                    cost: 3
                }
            ]
        },

        titanoise: {
            id: 'titanoise',
            name: 'Titanoise',
            type: 'water',
            icon: '🌊⚔️',
            species: 'pokemon',
            baseHP: 170,
            baseAttack: 100,
            baseDefense: 130,
            baseSpeed: 85,
            critRate: 15,
            description: 'Tortue titan avec canons à eau intégrés.',
            skills: [
                {
                    id: 'water_cannon',
                    name: 'Canon à Eau',
                    type: 'water',
                    power: 80,
                    cost: 2
                },
                {
                    id: 'hydro_pump',
                    name: 'Hydrocanon',
                    type: 'water',
                    power: 110,
                    cost: 4,
                    accuracy: 80
                },
                {
                    id: 'shell_smash',
                    name: 'Exuviation',
                    type: 'normal',
                    power: 0,
                    cost: 3,
                    selfBuff: { attack: 40, speed: 40 },
                    selfDebuff: { defense: -20 }
                },
                {
                    id: 'aqua_fortress',
                    name: 'Forteresse Aquatique',
                    type: 'water',
                    power: 120,
                    cost: 5,
                    shield: 50
                }
            ]
        },

        // Évolutions Verdantia
        floragarde: {
            id: 'floragarde',
            name: 'Floragarde',
            type: 'grass',
            icon: '🌺',
            species: 'pokemon',
            baseHP: 135,
            baseAttack: 95,
            baseDefense: 105,
            baseSpeed: 85,
            critRate: 15,
            description: 'Gardien des fleurs avec pouvoirs de guérison.',
            skills: [
                {
                    id: 'petal_blizzard',
                    name: 'Tempête Florale',
                    type: 'grass',
                    power: 90,
                    cost: 3
                },
                {
                    id: 'giga_drain',
                    name: 'Giga-Sangsue',
                    type: 'grass',
                    power: 75,
                    cost: 3,
                    drain: 50
                },
                {
                    id: 'synthesis',
                    name: 'Synthèse',
                    type: 'grass',
                    power: 0,
                    cost: 3,
                    heal: 50
                },
                {
                    id: 'power_whip',
                    name: 'Pouvoir Fouet',
                    type: 'grass',
                    power: 120,
                    cost: 4,
                    accuracy: 85
                }
            ]
        },

        megavine: {
            id: 'megavine',
            name: 'Megavine',
            type: 'grass',
            icon: '🌳',
            species: 'pokemon',
            baseHP: 155,
            baseAttack: 110,
            baseDefense: 120,
            baseSpeed: 80,
            critRate: 18,
            description: 'Titan végétal capable de contrôler la nature.',
            skills: [
                {
                    id: 'frenzy_plant',
                    name: 'Végé-Attak',
                    type: 'grass',
                    power: 150,
                    cost: 5,
                    recharge: true
                },
                {
                    id: 'solar_beam',
                    name: 'Lance-Soleil',
                    type: 'grass',
                    power: 120,
                    cost: 5
                },
                {
                    id: 'leech_seed',
                    name: 'Vampigraine',
                    type: 'grass',
                    power: 0,
                    cost: 2,
                    effect: 'leech',
                    effectChance: 100
                },
                {
                    id: 'nature_power',
                    name: 'Force de la Nature',
                    type: 'grass',
                    power: 90,
                    cost: 3,
                    selfBuff: { attack: 15, defense: 15 }
                }
            ]
        },

        // Digivolutions
        agumon: {
            id: 'agumon',
            name: 'Agumon',
            type: 'fire',
            icon: '🦎',
            species: 'digimon',
            baseHP: 85,
            baseAttack: 75,
            baseDefense: 60,
            baseSpeed: 70,
            critRate: 12,
            description: 'Digimon reptilien avec souffle de feu.',
            skills: [
                {
                    id: 'pepper_breath',
                    name: 'Pepper Breath',
                    type: 'fire',
                    power: 55,
                    cost: 2,
                    effect: 'burn',
                    effectChance: 25
                },
                {
                    id: 'claw_attack',
                    name: 'Attaque Griffe',
                    type: 'normal',
                    power: 45,
                    cost: 1
                },
                {
                    id: 'fire_spin',
                    name: 'Tourbillon de Feu',
                    type: 'fire',
                    power: 70,
                    cost: 3,
                    effect: 'burn',
                    effectChance: 40
                }
            ]
        },

        kabuterimon: {
            id: 'kabuterimon',
            name: 'Kabuterimon',
            type: 'electric',
            icon: '🪲',
            species: 'digimon',
            baseHP: 110,
            baseAttack: 95,
            baseDefense: 120,
            baseSpeed: 100,
            critRate: 15,
            description: 'Grand insecte électrique avec corne puissante.',
            skills: [
                {
                    id: 'mega_blaster',
                    name: 'Méga Blaster',
                    type: 'electric',
                    power: 80,
                    cost: 3,
                    effect: 'paralyze',
                    effectChance: 30
                },
                {
                    id: 'horn_buster',
                    name: 'Corne Buster',
                    type: 'electric',
                    power: 95,
                    cost: 4,
                    highCrit: true
                },
                {
                    id: 'beetle_tackle',
                    name: 'Charge Scarabée',
                    type: 'bug',
                    power: 70,
                    cost: 2
                },
                {
                    id: 'electric_armor',
                    name: 'Armure Électrique',
                    type: 'electric',
                    power: 0,
                    cost: 2,
                    shield: 40,
                    effect: 'paralyze_counter',
                    effectChance: 50
                }
            ]
        }
    },

    /**
     * Vérifie si une créature peut évoluer
     */
    canEvolve(creature, playerStats) {
        const evolutionData = this.evolutions[creature.templateId];
        if (!evolutionData) return false;

        switch (evolutionData.method) {
            case 'level':
                return playerStats.level >= evolutionData.level;
            
            case 'battles':
                return playerStats.battlesWon >= evolutionData.battles;
            
            case 'item':
                return playerStats.hasItem && playerStats.hasItem(evolutionData.item);
            
            case 'happiness':
                return playerStats.happiness >= evolutionData.happiness;
            
            default:
                return false;
        }
    },

    /**
     * Évolue une créature
     */
    evolve(creature) {
        const evolutionData = this.evolutions[creature.templateId];
        if (!evolutionData) {
            console.warn('Pas d\'évolution disponible pour', creature.name);
            return null;
        }

        const newFormId = evolutionData.evolvesTo;
        const newFormData = this.evolutionForms[newFormId];
        
        if (!newFormData) {
            console.error('Forme évoluée introuvable:', newFormId);
            return null;
        }

        // Créer la nouvelle créature évoluée
        const evolvedCreature = new Creature(newFormData, creature.isEnemy);
        
        // Conserver certaines propriétés
        evolvedCreature.currentHP = Math.min(
            evolvedCreature.maxHP,
            Math.floor((creature.currentHP / creature.maxHP) * evolvedCreature.maxHP)
        );
        evolvedCreature.currentEnergy = creature.currentEnergy;

        return {
            evolved: evolvedCreature,
            previousForm: creature.name,
            newForm: evolvedCreature.name,
            method: evolutionData.method
        };
    },

    /**
     * Obtient les informations d'évolution d'une créature
     */
    getEvolutionInfo(creatureId) {
        return this.evolutions[creatureId] || null;
    },

    /**
     * Obtient la chaîne d'évolution complète
     */
    getEvolutionChain(creatureId) {
        const chain = [creatureId];
        let current = creatureId;

        // Remonter la chaîne
        while (this.evolutions[current]) {
            const next = this.evolutions[current].evolvesTo;
            if (next && !chain.includes(next)) {
                chain.push(next);
                current = next;
            } else {
                break;
            }
        }

        return chain;
    }
};

console.log('✅ Système d\'évolution chargé');
console.log('  - Évolutions disponibles:', Object.keys(window.EVOLUTION_SYSTEM.evolutions).length);
console.log('  - Formes évoluées:', Object.keys(window.EVOLUTION_SYSTEM.evolutionForms).length);