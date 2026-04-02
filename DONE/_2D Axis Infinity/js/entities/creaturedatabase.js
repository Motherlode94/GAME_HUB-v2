/**
 * ============================================
 * CREATURE TEMPLATES - Pokémon & Digimon Mix
 * ============================================
 * Créatures inspirées de Pokémon et Digimon avec types étendus
 */

window.CREATURE_TEMPLATES = {
    // ═══════════════════════════════════════
    // POKÉMON-STYLE CREATURES (Starters)
    // ═══════════════════════════════════════
    
    // Type Feu
    pikaflame: {
        id: 'pikaflame',
        name: 'Pikaflame',
        type: 'electric', // Type électrique avec capacités feu
        icon: '⚡',
        species: 'pokemon',
        baseHP: 100,
        baseAttack: 85,
        baseDefense: 70,
        baseSpeed: 115,
        critRate: 15,
        description: 'Un petit monstre électrique agile qui peut générer des flammes.',
        skills: [
            {
                id: 'thunder_shock',
                name: 'Éclair',
                type: 'electric',
                damage: 40,
                cost: 1,
                effect: 'paralyze',
                effectChance: 20,
                description: 'Attaque électrique rapide avec chance de paralyser'
            },
            {
                id: 'flame_burst',
                name: 'Explosion de Flammes',
                type: 'fire',
                damage: 65,
                cost: 2,
                effect: 'burn',
                effectChance: 30,
                description: 'Projette des flammes brûlantes'
            },
            {
                id: 'volt_tackle',
                name: 'Électacle',
                type: 'electric',
                damage: 100,
                cost: 4,
                recoil: 25,
                description: 'Charge électrique dévastatrice qui inflige des dégâts de recul'
            }
        ]
    },

    aquatle: {
        id: 'aquatle',
        name: 'Aquatle',
        type: 'water',
        icon: '🌊',
        species: 'pokemon',
        baseHP: 120,
        baseAttack: 70,
        baseDefense: 90,
        baseSpeed: 80,
        critRate: 10,
        description: 'Une tortue aquatique défensive avec de puissantes attaques d\'eau.',
        skills: [
            {
                id: 'water_gun',
                name: 'Pistolet à O',
                type: 'water',
                damage: 40,
                cost: 1,
                description: 'Jet d\'eau basique mais fiable'
            },
            {
                id: 'aqua_shield',
                name: 'Bouclier Aquatique',
                type: 'water',
                damage: 0,
                cost: 2,
                shield: 40,
                description: 'Crée un bouclier d\'eau protecteur'
            },
            {
                id: 'hydro_pump',
                name: 'Hydrocanon',
                type: 'water',
                damage: 110,
                cost: 4,
                accuracy: 80,
                description: 'Puissant jet d\'eau à haute pression'
            }
        ]
    },

    verdantia: {
        id: 'verdantia',
        name: 'Verdantia',
        type: 'grass',
        icon: '🌿',
        species: 'pokemon',
        baseHP: 110,
        baseAttack: 75,
        baseDefense: 85,
        baseSpeed: 70,
        critRate: 12,
        description: 'Créature végétale qui peut drainer l\'énergie vitale.',
        skills: [
            {
                id: 'vine_whip',
                name: 'Fouet Lianes',
                type: 'grass',
                damage: 45,
                cost: 1,
                description: 'Frappe avec des lianes tranchantes'
            },
            {
                id: 'mega_drain',
                name: 'Méga-Sangsue',
                type: 'grass',
                damage: 50,
                cost: 2,
                drain: 50,
                description: 'Absorbe 50% des dégâts infligés en PV'
            },
            {
                id: 'solar_beam',
                name: 'Lance-Soleil',
                type: 'grass',
                damage: 120,
                cost: 5,
                description: 'Concentre l\'énergie solaire en une attaque dévastatrice'
            }
        ]
    },

    // ═══════════════════════════════════════
    // DIGIMON-STYLE CREATURES
    // ═══════════════════════════════════════

    agudramon: {
        id: 'agudramon',
        name: 'Agudramon',
        type: 'fire',
        icon: '🔥',
        species: 'digimon',
        baseHP: 95,
        baseAttack: 105,
        baseDefense: 65,
        baseSpeed: 95,
        critRate: 20,
        description: 'Dragon numérique de feu avec des griffes enflammées.',
        skills: [
            {
                id: 'baby_flame',
                name: 'Flamme Bébé',
                type: 'fire',
                damage: 35,
                cost: 1,
                description: 'Petite boule de feu'
            },
            {
                id: 'claw_attack',
                name: 'Griffe de Feu',
                type: 'fire',
                damage: 70,
                cost: 2,
                effect: 'burn',
                effectChance: 40,
                description: 'Lacère avec des griffes enflammées'
            },
            {
                id: 'giga_flare',
                name: 'Giga Flare',
                type: 'fire',
                damage: 95,
                cost: 4,
                multiHit: true,
                description: 'Lance plusieurs boules de feu explosives'
            }
        ]
    },

    gabumon: {
        id: 'gabumon',
        name: 'Gabumon',
        type: 'ice',
        icon: '❄️',
        species: 'digimon',
        baseHP: 90,
        baseAttack: 80,
        baseDefense: 95,
        baseSpeed: 75,
        critRate: 10,
        description: 'Digimon reptilien couvert de fourrure qui maîtrise la glace.',
        skills: [
            {
                id: 'petit_fire',
                name: 'Petit Fire',
                type: 'fire',
                damage: 30,
                cost: 1,
                description: 'Flamme bleue glaciale (paradoxalement)'
            },
            {
                id: 'ice_beam',
                name: 'Rayon de Glace',
                type: 'ice',
                damage: 65,
                cost: 2,
                effect: 'freeze',
                effectChance: 25,
                description: 'Rayon gelé qui peut paralyser'
            },
            {
                id: 'horn_attack',
                name: 'Attaque Corne',
                type: 'ice',
                damage: 85,
                cost: 3,
                highCrit: true,
                description: 'Charge avec sa corne, taux de critique élevé'
            }
        ]
    },

    tentomon: {
        id: 'tentomon',
        name: 'Tentomon',
        type: 'electric',
        icon: '🐞',
        species: 'digimon',
        baseHP: 85,
        baseAttack: 75,
        baseDefense: 100,
        baseSpeed: 90,
        critRate: 12,
        description: 'Insecte numérique électrique avec une carapace résistante.',
        skills: [
            {
                id: 'super_shocker',
                name: 'Super Shocker',
                type: 'electric',
                damage: 50,
                cost: 1,
                effect: 'paralyze',
                effectChance: 30,
                description: 'Décharge électrique paralysante'
            },
            {
                id: 'defense_curl',
                name: 'Armure',
                type: 'normal',
                damage: 0,
                cost: 2,
                defenseBuff: 30,
                description: 'Augmente la défense de 30%'
            },
            {
                id: 'tail_hammer',
                name: 'Marteau de Queue',
                type: 'electric',
                damage: 80,
                cost: 3,
                description: 'Frappe puissante avec la queue électrifiée'
            }
        ]
    },

    // ═══════════════════════════════════════
    // CRÉATURES HYBRIDES (Mix Pokémon/Digimon)
    // ═══════════════════════════════════════

    dracochu: {
        id: 'dracochu',
        name: 'Dracochu',
        type: 'dragon',
        icon: '🐉',
        species: 'hybrid',
        baseHP: 105,
        baseAttack: 95,
        baseDefense: 80,
        baseSpeed: 100,
        critRate: 18,
        description: 'Fusion mythique entre un dragon et une souris électrique.',
        skills: [
            {
                id: 'dragon_breath',
                name: 'Souffle Dragon',
                type: 'dragon',
                damage: 60,
                cost: 2,
                effect: 'burn',
                effectChance: 20,
                description: 'Souffle enflammé de dragon'
            },
            {
                id: 'thunder_fang',
                name: 'Croc Éclair',
                type: 'electric',
                damage: 65,
                cost: 2,
                effect: 'paralyze',
                effectChance: 25,
                description: 'Morsure électrifiée'
            },
            {
                id: 'draco_meteor',
                name: 'Draco Météore',
                type: 'dragon',
                damage: 130,
                cost: 5,
                statDebuff: { attack: -20 },
                description: 'Invoque des météores draconiques (réduit l\'attaque après utilisation)'
            }
        ]
    },

    cybergarurumon: {
        id: 'cybergarurumon',
        name: 'CyberGarurumon',
        type: 'steel',
        icon: '🤖',
        species: 'hybrid',
        baseHP: 115,
        baseAttack: 90,
        baseDefense: 110,
        baseSpeed: 85,
        critRate: 10,
        description: 'Loup mécanique blindé avec des capacités défensives supérieures.',
        skills: [
            {
                id: 'metal_claw',
                name: 'Griffe Acier',
                type: 'steel',
                damage: 50,
                cost: 1,
                selfBuff: { attack: 10 },
                description: 'Griffe d\'acier qui augmente l\'attaque'
            },
            {
                id: 'iron_defense',
                name: 'Défense de Fer',
                type: 'steel',
                damage: 0,
                cost: 2,
                defenseBuff: 50,
                description: 'Renforce considérablement la défense'
            },
            {
                id: 'cyber_cannon',
                name: 'Canon Cyber',
                type: 'steel',
                damage: 100,
                cost: 4,
                piercing: true,
                description: 'Canon laser qui ignore une partie de la défense'
            }
        ]
    },

    psyshamon: {
        id: 'psyshamon',
        name: 'Psyshamon',
        type: 'psychic',
        icon: '🔮',
        species: 'hybrid',
        baseHP: 100,
        baseAttack: 100,
        baseDefense: 75,
        baseSpeed: 105,
        critRate: 15,
        description: 'Créature psychique qui manipule l\'esprit et la réalité.',
        skills: [
            {
                id: 'confusion',
                name: 'Choc Mental',
                type: 'psychic',
                damage: 50,
                cost: 1,
                effect: 'confusion',
                effectChance: 20,
                description: 'Onde psychique perturbante'
            },
            {
                id: 'psybeam',
                name: 'Rafale Psy',
                type: 'psychic',
                damage: 65,
                cost: 2,
                effect: 'confusion',
                effectChance: 30,
                description: 'Rayon psychique puissant'
            },
            {
                id: 'psychic',
                name: 'Psycho',
                type: 'psychic',
                damage: 90,
                cost: 4,
                specialDefDebuff: -20,
                description: 'Attaque mentale qui peut réduire la défense spéciale'
            },
            {
                id: 'calm_mind',
                name: 'Plénitude',
                type: 'psychic',
                damage: 0,
                cost: 2,
                selfBuff: { attack: 15, defense: 15 },
                description: 'Méditation qui augmente attaque et défense'
            }
        ]
    },

    // ═══════════════════════════════════════
    // LÉGENDAIRES ET BOSS
    // ═══════════════════════════════════════

    omegamon: {
        id: 'omegamon',
        name: 'Omegamon',
        type: 'light',
        icon: '✨',
        species: 'legendary',
        baseHP: 150,
        baseAttack: 120,
        baseDefense: 110,
        baseSpeed: 100,
        critRate: 25,
        description: 'Digimon légendaire né de la fusion de WarGreymon et MetalGarurumon.',
        skills: [
            {
                id: 'grey_sword',
                name: 'Épée Grey',
                type: 'fire',
                damage: 85,
                cost: 2,
                description: 'Tranche avec l\'épée enflammée de WarGreymon'
            },
            {
                id: 'garuru_cannon',
                name: 'Canon Garuru',
                type: 'ice',
                damage: 85,
                cost: 2,
                description: 'Tire avec le canon glacial de MetalGarurumon'
            },
            {
                id: 'omega_blast',
                name: 'Oméga Blast',
                type: 'light',
                damage: 120,
                cost: 5,
                multiHit: true,
                description: 'Attaque combinée dévastatrice feu et glace'
            },
            {
                id: 'transcendent_sword',
                name: 'Épée Transcendante',
                type: 'light',
                damage: 150,
                cost: 6,
                recoil: 30,
                description: 'Ultime attaque qui inflige d\'énormes dégâts mais épuise'
            }
        ]
    },

    mewtwo_x: {
        id: 'mewtwo_x',
        name: 'Mewtwo X',
        type: 'psychic',
        icon: '👁️',
        species: 'legendary',
        baseHP: 140,
        baseAttack: 130,
        baseDefense: 100,
        baseSpeed: 130,
        critRate: 20,
        description: 'Pokémon légendaire créé par manipulation génétique, forme combat.',
        skills: [
            {
                id: 'psystrike',
                name: 'Frappe Psy',
                type: 'psychic',
                damage: 100,
                cost: 3,
                piercing: true,
                description: 'Attaque psychique qui frappe physiquement'
            },
            {
                id: 'aura_sphere',
                name: 'Aurasphère',
                type: 'fighting',
                damage: 80,
                cost: 2,
                accuracy: 100,
                description: 'Sphère d\'aura qui ne rate jamais'
            },
            {
                id: 'recover',
                name: 'Soin',
                type: 'normal',
                damage: 0,
                cost: 3,
                heal: 50,
                description: 'Restaure 50% des PV max'
            },
            {
                id: 'psyshock',
                name: 'Choc Psy',
                type: 'psychic',
                damage: 140,
                cost: 5,
                description: 'Libère toute la puissance psychique'
            }
        ]
    },

    imperialdramon: {
        id: 'imperialdramon',
        name: 'Imperialdramon',
        type: 'dragon',
        icon: '🐲',
        species: 'legendary',
        baseHP: 160,
        baseAttack: 125,
        baseDefense: 105,
        baseSpeed: 90,
        critRate: 22,
        description: 'Dragon ancien empereur des Digimon, mode paladin.',
        skills: [
            {
                id: 'positron_laser',
                name: 'Laser Positron',
                type: 'electric',
                damage: 90,
                cost: 3,
                description: 'Laser à particules ultra-rapide'
            },
            {
                id: 'omega_blade',
                name: 'Lame Oméga',
                type: 'dragon',
                damage: 95,
                cost: 3,
                highCrit: true,
                description: 'Tranche avec l\'épée sacrée, critique élevé'
            },
            {
                id: 'giga_crusher',
                name: 'Giga Crusher',
                type: 'dragon',
                damage: 110,
                cost: 4,
                defensePierce: 50,
                description: 'Écrase la défense ennemie'
            },
            {
                id: 'mega_death',
                name: 'Méga Mort',
                type: 'dark',
                damage: 140,
                cost: 6,
                recoil: 25,
                description: 'Attaque ultime des ténèbres'
            }
        ]
    },
       // ═══════════════════════════════════════
    // NOUVELLES CRÉATURES NORMALES (25)
    // ═══════════════════════════════════════

    // Type Feu
    volcarak: {
        id: 'volcarak',
        name: 'Volcarak',
        type: 'fire',
        icon: '🌋',
        species: 'pokemon',
        baseHP: 95,
        baseAttack: 110,
        baseDefense: 75,
        baseSpeed: 85,
        critRate: 18,
        description: 'Créature volcanique au tempérament explosif',
        skills: [
            {
                id: 'lava_spit',
                name: 'Crachat de Lave',
                type: 'fire',
                damage: 50,
                cost: 2,
                effect: 'burn',
                effectChance: 40,
                description: 'Crache de la lave brûlante'
            },
            {
                id: 'eruption',
                name: 'Éruption',
                type: 'fire',
                damage: 120,
                cost: 5,
                recoil: 30,
                description: 'Déclenche une éruption dévastatrice'
            },
            {
                id: 'heat_wave',
                name: 'Canicule',
                type: 'fire',
                damage: 70,
                cost: 3,
                description: 'Vague de chaleur intense'
            }
        ]
    },

    emberclaw: {
        id: 'emberclaw',
        name: 'Emberclaw',
        type: 'fire',
        icon: '🦂',
        species: 'pokemon',
        baseHP: 85,
        baseAttack: 105,
        baseDefense: 80,
        baseSpeed: 95,
        critRate: 20,
        description: 'Scorpion de braise aux griffes ardentes',
        skills: [
            {
                id: 'fire_claw',
                name: 'Griffe de Feu',
                type: 'fire',
                damage: 55,
                cost: 2,
                effect: 'burn',
                effectChance: 25,
                description: 'Lacère avec des griffes enflammées'
            },
            {
                id: 'inferno_strike',
                name: 'Frappe Infernale',
                type: 'fire',
                damage: 85,
                cost: 3,
                description: 'Coup puissant enflammé'
            },
            {
                id: 'blazing_tail',
                name: 'Queue Ardente',
                type: 'fire',
                damage: 95,
                cost: 4,
                description: 'Fouette avec sa queue en feu'
            }
        ]
    },

    // Type Eau
    tidalfin: {
        id: 'tidalfin',
        name: 'Tidalfin',
        type: 'water',
        icon: '🐬',
        species: 'pokemon',
        baseHP: 105,
        baseAttack: 90,
        baseDefense: 85,
        baseSpeed: 110,
        critRate: 15,
        description: 'Dauphin des marées extrêmement rapide',
        skills: [
            {
                id: 'tidal_wave',
                name: 'Raz-de-marée',
                type: 'water',
                damage: 75,
                cost: 3,
                description: 'Invoque une vague gigantesque'
            },
            {
                id: 'aqua_jet',
                name: 'Aqua-Jet',
                type: 'water',
                damage: 45,
                cost: 1,
                description: 'Frappe rapide comme l\'éclair'
            },
            {
                id: 'whirlpool',
                name: 'Tourbillon',
                type: 'water',
                damage: 65,
                cost: 2,
                effect: 'trap',
                effectChance: 50,
                description: 'Crée un tourbillon piégeant'
            }
        ]
    },

    frostwhale: {
        id: 'frostwhale',
        name: 'Frostwhale',
        type: 'ice',
        icon: '🐋',
        species: 'pokemon',
        baseHP: 135,
        baseAttack: 95,
        baseDefense: 100,
        baseSpeed: 60,
        critRate: 12,
        description: 'Baleine des glaces imposante et résistante',
        skills: [
            {
                id: 'ice_beam',
                name: 'Laser Glace',
                type: 'ice',
                damage: 70,
                cost: 3,
                effect: 'freeze',
                effectChance: 25,
                description: 'Rayon de glace pure'
            },
            {
                id: 'blizzard',
                name: 'Blizzard',
                type: 'ice',
                damage: 110,
                cost: 5,
                accuracy: 75,
                description: 'Tempête de neige dévastatrice'
            },
            {
                id: 'avalanche',
                name: 'Avalanche',
                type: 'ice',
                damage: 85,
                cost: 3,
                description: 'Déclenche une avalanche'
            }
        ]
    },

    // Type Plante
    thornvine: {
        id: 'thornvine',
        name: 'Thornvine',
        type: 'grass',
        icon: '🌿',
        species: 'pokemon',
        baseHP: 90,
        baseAttack: 85,
        baseDefense: 95,
        baseSpeed: 70,
        critRate: 10,
        description: 'Liane épineuse défensive',
        skills: [
            {
                id: 'vine_whip',
                name: 'Fouet Lianes',
                type: 'grass',
                damage: 50,
                cost: 2,
                description: 'Frappe avec des lianes'
            },
            {
                id: 'thorn_barrage',
                name: 'Salve d\'Épines',
                type: 'grass',
                damage: 70,
                cost: 3,
                effect: 'poison',
                effectChance: 30,
                description: 'Tire une rafale d\'épines'
            },
            {
                id: 'synthesis',
                name: 'Synthèse',
                type: 'grass',
                damage: 0,
                cost: 2,
                heal: 50,
                description: 'Se soigne avec la photosynthèse'
            }
        ]
    },

    bloomspirit: {
        id: 'bloomspirit',
        name: 'Bloomspirit',
        type: 'grass',
        icon: '🌸',
        species: 'pokemon',
        baseHP: 100,
        baseAttack: 75,
        baseDefense: 85,
        baseSpeed: 80,
        critRate: 12,
        description: 'Esprit floral guérisseur',
        skills: [
            {
                id: 'petal_dance',
                name: 'Danse-Fleur',
                type: 'grass',
                damage: 80,
                cost: 4,
                description: 'Danse tourbillonnante de pétales'
            },
            {
                id: 'spore_cloud',
                name: 'Nuage de Spores',
                type: 'grass',
                damage: 40,
                cost: 2,
                effect: 'sleep',
                effectChance: 50,
                description: 'Libère des spores soporifiques'
            },
            {
                id: 'giga_drain',
                name: 'Giga-Sangsue',
                type: 'grass',
                damage: 65,
                cost: 3,
                drain: 50,
                description: 'Absorbe l\'énergie vitale'
            }
        ]
    },

    // Type Électrique
    voltiger: {
        id: 'voltiger',
        name: 'Voltiger',
        type: 'electric',
        icon: '⚡',
        species: 'pokemon',
        baseHP: 85,
        baseAttack: 100,
        baseDefense: 70,
        baseSpeed: 120,
        critRate: 22,
        description: 'Tigre électrique ultra-rapide',
        skills: [
            {
                id: 'thunderbolt',
                name: 'Tonnerre',
                type: 'electric',
                damage: 75,
                cost: 3,
                effect: 'paralyze',
                effectChance: 25,
                description: 'Décharge électrique puissante'
            },
            {
                id: 'wild_charge',
                name: 'Charge Sauvage',
                type: 'electric',
                damage: 90,
                cost: 4,
                recoil: 20,
                description: 'Charge électrisée destructrice'
            },
            {
                id: 'spark',
                name: 'Étincelle',
                type: 'electric',
                damage: 50,
                cost: 2,
                description: 'Attaque électrique rapide'
            }
        ]
    },

    stormhawk: {
        id: 'stormhawk',
        name: 'Stormhawk',
        type: 'flying',
        icon: '🦅',
        species: 'pokemon',
        baseHP: 90,
        baseAttack: 95,
        baseDefense: 75,
        baseSpeed: 115,
        critRate: 18,
        description: 'Faucon de la tempête majestueux',
        skills: [
            {
                id: 'air_slash',
                name: 'Lame d\'Air',
                type: 'flying',
                damage: 65,
                cost: 3,
                effect: 'flinch',
                effectChance: 30,
                description: 'Tranche l\'air avec ses ailes'
            },
            {
                id: 'hurricane',
                name: 'Ouragan',
                type: 'flying',
                damage: 110,
                cost: 5,
                accuracy: 70,
                description: 'Déchaîne un ouragan dévastateur'
            },
            {
                id: 'brave_bird',
                name: 'Rapace',
                type: 'flying',
                damage: 100,
                cost: 4,
                recoil: 25,
                description: 'Piqué suicidaire'
            }
        ]
    },

    // Type Combat
    ironfist: {
        id: 'ironfist',
        name: 'Ironfist',
        type: 'fighting',
        icon: '🥊',
        species: 'pokemon',
        baseHP: 110,
        baseAttack: 115,
        baseDefense: 90,
        baseSpeed: 75,
        critRate: 16,
        description: 'Combattant aux poings d\'acier',
        skills: [
            {
                id: 'mega_punch',
                name: 'Ultimapoing',
                type: 'fighting',
                damage: 80,
                cost: 3,
                description: 'Coup de poing dévastateur'
            },
            {
                id: 'close_combat',
                name: 'Close Combat',
                type: 'fighting',
                damage: 110,
                cost: 5,
                description: 'Combo rapproché dévastateur'
            },
            {
                id: 'focus_blast',
                name: 'Exploforce',
                type: 'fighting',
                damage: 100,
                cost: 4,
                accuracy: 75,
                description: 'Libère toute sa puissance'
            }
        ]
    },

    blazekick: {
        id: 'blazekick',
        name: 'Blazekick',
        type: 'fighting',
        icon: '🦵',
        species: 'pokemon',
        baseHP: 95,
        baseAttack: 105,
        baseDefense: 80,
        baseSpeed: 100,
        critRate: 20,
        description: 'Maître du kick aux pieds enflammés',
        skills: [
            {
                id: 'blaze_kick',
                name: 'Kick Flamboyant',
                type: 'fire',
                damage: 75,
                cost: 3,
                effect: 'burn',
                effectChance: 20,
                critBonus: 15,
                description: 'Coup de pied enflammé critique'
            },
            {
                id: 'high_jump_kick',
                name: 'Saut Kick',
                type: 'fighting',
                damage: 120,
                cost: 5,
                recoil: 40,
                description: 'Saut acrobatique puissant mais risqué'
            },
            {
                id: 'low_sweep',
                name: 'Balayage',
                type: 'fighting',
                damage: 60,
                cost: 2,
                effect: 'slow',
                effectChance: 100,
                description: 'Balayage qui ralentit'
            }
        ]
    },

    // Type Poison
    toxiviper: {
        id: 'toxiviper',
        name: 'Toxiviper',
        type: 'poison',
        icon: '🐍',
        species: 'pokemon',
        baseHP: 95,
        baseAttack: 90,
        baseDefense: 85,
        baseSpeed: 85,
        critRate: 14,
        description: 'Serpent venimeux mortel',
        skills: [
            {
                id: 'poison_fang',
                name: 'Crochet Venin',
                type: 'poison',
                damage: 60,
                cost: 2,
                effect: 'poison',
                effectChance: 60,
                description: 'Mord avec des crocs toxiques'
            },
            {
                id: 'sludge_bomb',
                name: 'Bomb-Beurk',
                type: 'poison',
                damage: 85,
                cost: 4,
                effect: 'poison',
                effectChance: 40,
                description: 'Lance une bombe toxique'
            },
            {
                id: 'acid_spray',
                name: 'Acide',
                type: 'poison',
                damage: 45,
                cost: 2,
                description: 'Crache de l\'acide corrosif'
            }
        ]
    },

    plaguerat: {
        id: 'plaguerat',
        name: 'Plaguerat',
        type: 'poison',
        icon: '🐀',
        species: 'pokemon',
        baseHP: 100,
        baseAttack: 85,
        baseDefense: 75,
        baseSpeed: 95,
        critRate: 16,
        description: 'Rat de peste rapide et toxique',
        skills: [
            {
                id: 'toxic_bite',
                name: 'Morsure Toxique',
                type: 'poison',
                damage: 55,
                cost: 2,
                effect: 'poison',
                effectChance: 50,
                description: 'Morsure empoisonnée'
            },
            {
                id: 'venoshock',
                name: 'Choc Venin',
                type: 'poison',
                damage: 65,
                cost: 3,
                powerBoostOnPoison: true,
                description: 'Double dégâts si cible empoisonnée'
            },
            {
                id: 'gunk_shot',
                name: 'Détricanon',
                type: 'poison',
                damage: 110,
                cost: 5,
                accuracy: 80,
                description: 'Projectile toxique puissant'
            }
        ]
    },

    // Type Sol
    sandcrusher: {
        id: 'sandcrusher',
        name: 'Sandcrusher',
        type: 'ground',
        icon: '🦏',
        species: 'pokemon',
        baseHP: 120,
        baseAttack: 110,
        baseDefense: 105,
        baseSpeed: 55,
        critRate: 10,
        description: 'Rhinocéros des sables blindé',
        skills: [
            {
                id: 'earthquake',
                name: 'Séisme',
                type: 'ground',
                damage: 95,
                cost: 4,
                description: 'Fait trembler le sol'
            },
            {
                id: 'bulldoze',
                name: 'Piétisol',
                type: 'ground',
                damage: 60,
                cost: 2,
                effect: 'slow',
                effectChance: 100,
                description: 'Piétine le sol violemment'
            },
            {
                id: 'dig',
                name: 'Tunnel',
                type: 'ground',
                damage: 80,
                cost: 3,
                description: 'Creuse puis attaque'
            }
        ]
    },

    rockgolem: {
        id: 'rockgolem',
        name: 'Rockgolem',
        type: 'rock',
        icon: '🗿',
        species: 'pokemon',
        baseHP: 125,
        baseAttack: 100,
        baseDefense: 115,
        baseSpeed: 45,
        critRate: 8,
        description: 'Golem de pierre indestructible',
        skills: [
            {
                id: 'rock_slide',
                name: 'Éboulement',
                type: 'rock',
                damage: 70,
                cost: 3,
                effect: 'flinch',
                effectChance: 30,
                description: 'Fait tomber des rochers'
            },
            {
                id: 'stone_edge',
                name: 'Lame de Roc',
                type: 'rock',
                damage: 95,
                cost: 4,
                critBonus: 20,
                description: 'Tranchant rocheux critique'
            },
            {
                id: 'rock_blast',
                name: 'Boule Roc',
                type: 'rock',
                damage: 60,
                cost: 2,
                description: 'Lance plusieurs rochers'
            }
        ]
    },

    // Type Psy
    mindflayer: {
        id: 'mindflayer',
        name: 'Mindflayer',
        type: 'psychic',
        icon: '🧠',
        species: 'pokemon',
        baseHP: 90,
        baseAttack: 105,
        baseDefense: 80,
        baseSpeed: 100,
        critRate: 15,
        description: 'Flagelleur mental terrifiant',
        skills: [
            {
                id: 'psychic',
                name: 'Psyko',
                type: 'psychic',
                damage: 85,
                cost: 4,
                description: 'Pouvoir psychique dévastateur'
            },
            {
                id: 'psybeam',
                name: 'Rafale Psy',
                type: 'psychic',
                damage: 65,
                cost: 3,
                effect: 'confuse',
                effectChance: 30,
                description: 'Rayon psychique confusant'
            },
            {
                id: 'future_sight',
                name: 'Prescience',
                type: 'psychic',
                damage: 100,
                cost: 5,
                delay: 2,
                description: 'Attaque du futur'
            }
        ]
    },

    dreamcatcher: {
        id: 'dreamcatcher',
        name: 'Dreamcatcher',
        type: 'psychic',
        icon: '💫',
        species: 'pokemon',
        baseHP: 95,
        baseAttack: 90,
        baseDefense: 85,
        baseSpeed: 90,
        critRate: 12,
        description: 'Attrapeur de rêves mystique',
        skills: [
            {
                id: 'dream_eater',
                name: 'Dévorêve',
                type: 'psychic',
                damage: 90,
                cost: 4,
                drain: 50,
                description: 'Dévore les rêves pour se soigner'
            },
            {
                id: 'hypnosis',
                name: 'Hypnose',
                type: 'psychic',
                damage: 0,
                cost: 2,
                effect: 'sleep',
                effectChance: 70,
                description: 'Endort la cible'
            },
            {
                id: 'confusion',
                name: 'Choc Mental',
                type: 'psychic',
                damage: 55,
                cost: 2,
                effect: 'confuse',
                effectChance: 30,
                description: 'Attaque psychique confusante'
            }
        ]
    },

    // Type Insecte
    beetleblade: {
        id: 'beetleblade',
        name: 'Beetleblade',
        type: 'bug',
        icon: '🪲',
        species: 'pokemon',
        baseHP: 85,
        baseAttack: 100,
        baseDefense: 90,
        baseSpeed: 95,
        critRate: 18,
        description: 'Scarabée aux mandibules tranchantes',
        skills: [
            {
                id: 'x_scissor',
                name: 'Plaie-Croix',
                type: 'bug',
                damage: 75,
                cost: 3,
                description: 'Coupe en croix avec les mandibules'
            },
            {
                id: 'megahorn',
                name: 'Mégacorne',
                type: 'bug',
                damage: 110,
                cost: 5,
                accuracy: 85,
                description: 'Charge avec une énorme corne'
            },
            {
                id: 'bug_bite',
                name: 'Piqûre',
                type: 'bug',
                damage: 60,
                cost: 2,
                description: 'Mord rapidement'
            }
        ]
    },

    mothlight: {
        id: 'mothlight',
        name: 'Mothlight',
        type: 'bug',
        icon: '🦋',
        species: 'pokemon',
        baseHP: 90,
        baseAttack: 80,
        baseDefense: 75,
        baseSpeed: 105,
        critRate: 14,
        description: 'Papillon lumineux hypnotique',
        skills: [
            {
                id: 'silver_wind',
                name: 'Vent Argenté',
                type: 'bug',
                damage: 65,
                cost: 3,
                buffChance: 20,
                description: 'Vent brillant qui peut augmenter stats'
            },
            {
                id: 'quiver_dance',
                name: 'Papillodanse',
                type: 'bug',
                damage: 0,
                cost: 3,
                buff: 'allstats',
                description: 'Danse qui améliore toutes les stats'
            },
            {
                id: 'signal_beam',
                name: 'Rayon Signal',
                type: 'bug',
                damage: 70,
                cost: 3,
                effect: 'confuse',
                effectChance: 20,
                description: 'Rayon lumineux confusant'
            }
        ]
    },

    // Type Spectre
    shadowwraith: {
        id: 'shadowwraith',
        name: 'Shadowwraith',
        type: 'ghost',
        icon: '👻',
        species: 'pokemon',
        baseHP: 85,
        baseAttack: 95,
        baseDefense: 70,
        baseSpeed: 110,
        critRate: 16,
        description: 'Spectre des ombres furtif',
        skills: [
            {
                id: 'shadow_ball',
                name: 'Ball\'Ombre',
                type: 'ghost',
                damage: 75,
                cost: 3,
                description: 'Projette une sphère d\'ombre'
            },
            {
                id: 'shadow_claw',
                name: 'Griffe Ombre',
                type: 'ghost',
                damage: 70,
                cost: 3,
                critBonus: 20,
                description: 'Griffes fantomatiques critiques'
            },
            {
                id: 'curse',
                name: 'Malédiction',
                type: 'ghost',
                damage: 0,
                cost: 2,
                effect: 'curse',
                description: 'Lance une malédiction dévastatrice'
            }
        ]
    },

    // Type Dragon
    wyrmscale: {
        id: 'wyrmscale',
        name: 'Wyrmscale',
        type: 'dragon',
        icon: '🐉',
        species: 'pokemon',
        baseHP: 110,
        baseAttack: 115,
        baseDefense: 95,
        baseSpeed: 85,
        critRate: 14,
        description: 'Dragon aux écailles impénétrables',
        skills: [
            {
                id: 'dragon_claw',
                name: 'Draco-Griffe',
                type: 'dragon',
                damage: 75,
                cost: 3,
                description: 'Lacère avec des griffes draconiques'
            },
            {
                id: 'dragon_pulse',
                name: 'Draco-Choc',
                type: 'dragon',
                damage: 85,
                cost: 4,
                description: 'Onde de choc draconique'
            },
            {
                id: 'outrage',
                name: 'Colère',
                type: 'dragon',
                damage: 110,
                cost: 5,
                confuseSelf: true,
                description: 'Rage draconique incontrôlable'
            }
        ]
    },

    // Type Ténèbres
    nightstalker: {
        id: 'nightstalker',
        name: 'Nightstalker',
        type: 'dark',
        icon: '🌑',
        species: 'pokemon',
        baseHP: 95,
        baseAttack: 105,
        baseDefense: 80,
        baseSpeed: 100,
        critRate: 20,
        description: 'Traqueur nocturne sournois',
        skills: [
            {
                id: 'dark_pulse',
                name: 'Vibrobscur',
                type: 'dark',
                damage: 75,
                cost: 3,
                effect: 'flinch',
                effectChance: 25,
                description: 'Pulsation ténébreuse'
            },
            {
                id: 'crunch',
                name: 'Mâchouille',
                type: 'dark',
                damage: 80,
                cost: 3,
                description: 'Mord avec force'
            },
            {
                id: 'sucker_punch',
                name: 'Coup Bas',
                type: 'dark',
                damage: 65,
                cost: 2,
                priority: true,
                description: 'Frappe en premier'
            }
        ]
    },

    // Type Acier
    steelguard: {
        id: 'steelguard',
        name: 'Steelguard',
        type: 'steel',
        icon: '🛡️',
        species: 'pokemon',
        baseHP: 115,
        baseAttack: 95,
        baseDefense: 120,
        baseSpeed: 60,
        critRate: 10,
        description: 'Gardien d\'acier inébranlable',
        skills: [
            {
                id: 'iron_head',
                name: 'Tête de Fer',
                type: 'steel',
                damage: 75,
                cost: 3,
                effect: 'flinch',
                effectChance: 30,
                description: 'Coup de tête métallique'
            },
            {
                id: 'steel_beam',
                name: 'Lumière Métallique',
                type: 'steel',
                damage: 130,
                cost: 6,
                recoil: 50,
                description: 'Rayon d\'acier dévastateur'
            },
            {
                id: 'iron_defense',
                name: 'Mur de Fer',
                type: 'steel',
                damage: 0,
                cost: 2,
                defBuff: 40,
                description: 'Augmente grandement la défense'
            }
        ]
    },

    // Type Fée
    pixiewing: {
        id: 'pixiewing',
        name: 'Pixiewing',
        type: 'fairy',
        icon: '🧚',
        species: 'pokemon',
        baseHP: 90,
        baseAttack: 85,
        baseDefense: 80,
        baseSpeed: 100,
        critRate: 14,
        description: 'Fée ailée espiègle et rapide',
        skills: [
            {
                id: 'moonblast',
                name: 'Pouvoir Lunaire',
                type: 'fairy',
                damage: 90,
                cost: 4,
                description: 'Puissance de la lune'
            },
            {
                id: 'dazzling_gleam',
                name: 'Éclat Magique',
                type: 'fairy',
                damage: 75,
                cost: 3,
                description: 'Lumière féérique aveuglante'
            },
            {
                id: 'fairy_wind',
                name: 'Vent Féérique',
                type: 'fairy',
                damage: 45,
                cost: 2,
                description: 'Brise magique douce'
            }
        ]
    },

    // Type Digital
    datacore: {
        id: 'datacore',
        name: 'Datacore',
        type: 'digital',
        icon: '💾',
        species: 'digimon',
        baseHP: 100,
        baseAttack: 90,
        baseDefense: 85,
        baseSpeed: 95,
        critRate: 15,
        description: 'Noyau de données pure',
        skills: [
            {
                id: 'data_stream',
                name: 'Flux de Données',
                type: 'digital',
                damage: 70,
                cost: 3,
                description: 'Torrent de données'
            },
            {
                id: 'binary_blast',
                name: 'Déflagration Binaire',
                type: 'digital',
                damage: 85,
                cost: 4,
                description: 'Explosion de code binaire'
            },
            {
                id: 'firewall',
                name: 'Pare-feu',
                type: 'digital',
                damage: 0,
                cost: 2,
                shield: 45,
                description: 'Crée un bouclier digital'
            }
        ]
    },

    // Type Lumière
    radiantbeast: {
        id: 'radiantbeast',
        name: 'Radiantbeast',
        type: 'light',
        icon: '☀️',
        species: 'pokemon',
        baseHP: 100,
        baseAttack: 95,
        baseDefense: 85,
        baseSpeed: 90,
        critRate: 16,
        description: 'Bête radieuse divine',
        skills: [
            {
                id: 'light_beam',
                name: 'Rayon Lumineux',
                type: 'light',
                damage: 80,
                cost: 3,
                description: 'Rayon de lumière pure'
            },
            {
                id: 'holy_fire',
                name: 'Flamme Sacrée',
                type: 'light',
                damage: 95,
                cost: 4,
                description: 'Feu sacré purificateur'
            },
            {
                id: 'blessing',
                name: 'Bénédiction',
                type: 'light',
                damage: 0,
                cost: 3,
                heal: 60,
                description: 'Soigne avec la lumière divine'
            }
        ]
    },

    // ═══════════════════════════════════════
    // CRÉATURES LÉGENDAIRES (5)
    // ═══════════════════════════════════════

    infernolord: {
        id: 'infernolord',
        name: 'Infernolord',
        type: 'fire',
        icon: '🔥',
        species: 'legendary',
        rarity: 'legendary',
        unlockCondition: 'win_50_battles',
        baseHP: 135,
        baseAttack: 145,
        baseDefense: 105,
        baseSpeed: 110,
        critRate: 25,
        description: 'Seigneur légendaire des enfers et du feu éternel',
        skills: [
            {
                id: 'inferno_blast',
                name: 'Déflagration Infernale',
                type: 'fire',
                damage: 130,
                cost: 6,
                effect: 'burn',
                effectChance: 50,
                description: 'Explosion infernale dévastatrice'
            },
            {
                id: 'flame_emperor',
                name: 'Empereur des Flammes',
                type: 'fire',
                damage: 100,
                cost: 4,
                effect: 'burn',
                effectChance: 40,
                description: 'Autorité suprême du feu'
            },
            {
                id: 'meteor_strike',
                name: 'Frappe Météorique',
                type: 'fire',
                damage: 150,
                cost: 7,
                recoil: 40,
                description: 'Invoque une pluie de météores'
            },
            {
                id: 'phoenix_rebirth',
                name: 'Renaissance du Phénix',
                type: 'fire',
                damage: 0,
                cost: 5,
                heal: 80,
                clearDebuffs: true,
                description: 'Renaît dans les flammes'
            }
        ]
    },

    oceantitan: {
        id: 'oceantitan',
        name: 'Oceantitan',
        type: 'water',
        icon: '🌊',
        species: 'legendary',
        rarity: 'legendary',
        unlockCondition: 'defeat_100_water_types',
        baseHP: 150,
        baseAttack: 130,
        baseDefense: 120,
        baseSpeed: 95,
        critRate: 20,
        description: 'Titan légendaire maître des océans',
        skills: [
            {
                id: 'ocean_wrath',
                name: 'Courroux Océanique',
                type: 'water',
                damage: 140,
                cost: 6,
                description: 'Déchaîne la fureur de l\'océan'
            },
            {
                id: 'tidal_force',
                name: 'Force Marémotrice',
                type: 'water',
                damage: 110,
                cost: 5,
                description: 'Puissance des marées'
            },
            {
                id: 'water_spout',
                name: 'Geyser',
                type: 'water',
                damage: 120,
                cost: 5,
                description: 'Geyser titanesque'
            },
            {
                id: 'aqua_ring',
                name: 'Anneau Hydro',
                type: 'water',
                damage: 0,
                cost: 3,
                heal: 50,
                shield: 40,
                description: 'Protection et régénération aquatique'
            }
        ]
    },

    skyrexmighty: {
        id: 'skyrexmighty',
        name: 'Skyrex Mighty',
        type: 'dragon',
        icon: '🐲',
        species: 'legendary',
        rarity: 'legendary',
        unlockCondition: 'reach_level_50',
        baseHP: 140,
        baseAttack: 155,
        baseDefense: 110,
        baseSpeed: 120,
        critRate: 30,
        description: 'Dragon céleste tout-puissant, roi des cieux',
        skills: [
            {
                id: 'sky_devastation',
                name: 'Dévastation Céleste',
                type: 'dragon',
                damage: 160,
                cost: 7,
                description: 'Attaque draconique ultime'
            },
            {
                id: 'draco_meteor',
                name: 'Draco-Météore',
                type: 'dragon',
                damage: 135,
                cost: 6,
                recoil: 30,
                description: 'Fait pleuvoir des météores'
            },
            {
                id: 'dragon_dance',
                name: 'Danse Draco',
                type: 'dragon',
                damage: 0,
                cost: 3,
                buff: 'atkspeed',
                description: 'Augmente attaque et vitesse'
            },
            {
                id: 'roar_of_time',
                name: 'Hurlement du Temps',
                type: 'dragon',
                damage: 145,
                cost: 6,
                mustRecharge: true,
                description: 'Manipulation temporelle dévastatrice'
            }
        ]
    },

    voidreaper: {
        id: 'voidreaper',
        name: 'Voidreaper',
        type: 'dark',
        icon: '💀',
        species: 'legendary',
        rarity: 'legendary',
        unlockCondition: 'complete_nightmare_mode',
        baseHP: 125,
        baseAttack: 150,
        baseDefense: 100,
        baseSpeed: 135,
        critRate: 35,
        description: 'Faucheur du vide, incarnation des ténèbres absolues',
        skills: [
            {
                id: 'void_slash',
                name: 'Entaille du Vide',
                type: 'dark',
                damage: 125,
                cost: 5,
                critBonus: 25,
                description: 'Fend le vide lui-même'
            },
            {
                id: 'dark_void',
                name: 'Trou Noir',
                type: 'dark',
                damage: 140,
                cost: 6,
                effect: 'trap',
                effectChance: 60,
                description: 'Aspire tout dans les ténèbres'
            },
            {
                id: 'nightmare',
                name: 'Cauchemar',
                type: 'dark',
                damage: 0,
                cost: 3,
                effect: 'curse',
                description: 'Inflige un cauchemar mortel'
            },
            {
                id: 'judgment',
                name: 'Jugement',
                type: 'dark',
                damage: 155,
                cost: 7,
                description: 'Jugement final des ténèbres'
            }
        ]
    },

    celestialking: {
        id: 'celestialking',
        name: 'Celestialking',
        type: 'light',
        icon: '👑',
        species: 'legendary',
        rarity: 'legendary',
        unlockCondition: 'collect_all_normal_creatures',
        baseHP: 145,
        baseAttack: 140,
        baseDefense: 125,
        baseSpeed: 105,
        critRate: 22,
        description: 'Roi céleste légendaire, incarnation de la lumière divine',
        skills: [
            {
                id: 'divine_judgment',
                name: 'Jugement Divin',
                type: 'light',
                damage: 145,
                cost: 6,
                description: 'Jugement de la lumière sacrée'
            },
            {
                id: 'holy_lance',
                name: 'Lance Sacrée',
                type: 'light',
                damage: 120,
                cost: 5,
                critBonus: 20,
                description: 'Lance de lumière perforante'
            },
            {
                id: 'celestial_blessing',
                name: 'Bénédiction Céleste',
                type: 'light',
                damage: 0,
                cost: 4,
                heal: 80,
                cleanseFull: true,
                description: 'Purification et guérison totale'
            },
            {
                id: 'light_of_ruin',
                name: 'Lumière de la Ruine',
                type: 'light',
                damage: 170,
                cost: 8,
                recoil: 50,
                description: 'Libère toute la puissance céleste'
            }
        ]
    },


    // ═══════════════════════════════════════
    // CRÉATURES COMMUNES (Ennemis de base)
    // ═══════════════════════════════════════

    koromon: {
        id: 'koromon',
        name: 'Koromon',
        type: 'normal',
        icon: '🥚',
        species: 'rookie',
        baseHP: 60,
        baseAttack: 40,
        baseDefense: 40,
        baseSpeed: 50,
        critRate: 5,
        description: 'Digimon bébé tout rond et adorable.',
        skills: [
            {
                id: 'bubble_blow',
                name: 'Bulles',
                type: 'normal',
                damage: 25,
                cost: 1,
                description: 'Souffle des bulles'
            },
            {
                id: 'body_slam',
                name: 'Charge',
                type: 'normal',
                damage: 45,
                cost: 2,
                description: 'Se jette sur l\'ennemi'
            }
        ]
    },

    rattata: {
        id: 'rattata',
        name: 'Rattata',
        type: 'normal',
        icon: '🐀',
        species: 'common',
        baseHP: 65,
        baseAttack: 50,
        baseDefense: 45,
        baseSpeed: 85,
        critRate: 8,
        description: 'Petit rongeur très rapide mais fragile.',
        skills: [
            {
                id: 'quick_attack',
                name: 'Vive-Attaque',
                type: 'normal',
                damage: 40,
                cost: 1,
                priority: true,
                description: 'Attaque rapide qui frappe en premier'
            },
            {
                id: 'bite',
                name: 'Morsure',
                type: 'dark',
                damage: 60,
                cost: 2,
                description: 'Morsure vicieuse'
            }
        ]
    },

    wormmon: {
        id: 'wormmon',
        name: 'Wormmon',
        type: 'grass',
        icon: '🐛',
        species: 'rookie',
        baseHP: 70,
        baseAttack: 45,
        baseDefense: 60,
        baseSpeed: 40,
        critRate: 5,
        description: 'Ver numérique de type insecte/plante.',
        skills: [
            {
                id: 'sticky_net',
                name: 'Toile Gluante',
                type: 'grass',
                damage: 30,
                cost: 1,
                effect: 'slow',
                effectChance: 40,
                description: 'Lance une toile qui ralentit'
            },
            {
                id: 'poison_sting',
                name: 'Dard Venin',
                type: 'poison',
                damage: 35,
                cost: 1,
                effect: 'poison',
                effectChance: 30,
                description: 'Pique avec un dard empoisonné'
            }
        ]
    }
};

console.log('✅ Base de données de créatures chargée:', Object.keys(window.CREATURE_TEMPLATES).length, 'créatures');