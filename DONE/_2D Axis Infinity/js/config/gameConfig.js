/**
 * ============================================
 * GAME CONFIGURATION
 * Contains game constants, type data, and difficulty settings
 * (Creatures are managed in creaturedatabase.js)
 * ============================================
 */

// ═══════════════════════════════════════
// TYPE SYSTEM
// ═══════════════════════════════════════

const TYPE_EFFECTIVENESS = {
    fire: {
        fire: 0.5, water: 0.5, grass: 2.0, electric: 1.0, ice: 2.0,
        fighting: 1.0, poison: 1.0, ground: 1.0, flying: 1.0, psychic: 1.0,
        bug: 2.0, rock: 0.5, ghost: 1.0, dragon: 0.5, dark: 1.0,
        steel: 2.0, fairy: 1.0, normal: 1.0, light: 1.0, digital: 1.0
    },
    water: {
        fire: 2.0, water: 0.5, grass: 0.5, electric: 1.0, ice: 1.0,
        fighting: 1.0, poison: 1.0, ground: 2.0, flying: 1.0, psychic: 1.0,
        bug: 1.0, rock: 2.0, ghost: 1.0, dragon: 0.5, dark: 1.0,
        steel: 1.0, fairy: 1.0, normal: 1.0, light: 1.0, digital: 1.0
    },
    grass: {
        fire: 0.5, water: 2.0, grass: 0.5, electric: 1.0, ice: 1.0,
        fighting: 1.0, poison: 0.5, ground: 2.0, flying: 0.5, psychic: 1.0,
        bug: 0.5, rock: 2.0, ghost: 1.0, dragon: 0.5, dark: 1.0,
        steel: 0.5, fairy: 1.0, normal: 1.0, light: 1.0, digital: 1.0
    },
    electric: {
        fire: 1.0, water: 2.0, grass: 0.5, electric: 0.5, ice: 1.0,
        fighting: 1.0, poison: 1.0, ground: 0.0, flying: 2.0, psychic: 1.0,
        bug: 1.0, rock: 1.0, ghost: 1.0, dragon: 0.5, dark: 1.0,
        steel: 1.0, fairy: 1.0, normal: 1.0, light: 1.0, digital: 2.0
    },
    ice: {
        fire: 0.5, water: 0.5, grass: 2.0, electric: 1.0, ice: 0.5,
        fighting: 1.0, poison: 1.0, ground: 2.0, flying: 2.0, psychic: 1.0,
        bug: 1.0, rock: 1.0, ghost: 1.0, dragon: 2.0, dark: 1.0,
        steel: 0.5, fairy: 1.0, normal: 1.0, light: 1.0, digital: 1.0
    },
    fighting: {
        fire: 1.0, water: 1.0, grass: 1.0, electric: 1.0, ice: 2.0,
        fighting: 1.0, poison: 0.5, ground: 1.0, flying: 0.5, psychic: 0.5,
        bug: 0.5, rock: 2.0, ghost: 0.0, dragon: 1.0, dark: 2.0,
        steel: 2.0, fairy: 0.5, normal: 2.0, light: 0.5, digital: 1.0
    },
    poison: {
        fire: 1.0, water: 1.0, grass: 2.0, electric: 1.0, ice: 1.0,
        fighting: 1.0, poison: 0.5, ground: 0.5, flying: 1.0, psychic: 1.0,
        bug: 1.0, rock: 0.5, ghost: 0.5, dragon: 1.0, dark: 1.0,
        steel: 0.0, fairy: 2.0, normal: 1.0, light: 1.0, digital: 0.5
    },
    ground: {
        fire: 2.0, water: 1.0, grass: 0.5, electric: 2.0, ice: 1.0,
        fighting: 1.0, poison: 2.0, ground: 1.0, flying: 0.0, psychic: 1.0,
        bug: 0.5, rock: 2.0, ghost: 1.0, dragon: 1.0, dark: 1.0,
        steel: 2.0, fairy: 1.0, normal: 1.0, light: 1.0, digital: 1.0
    },
    flying: {
        fire: 1.0, water: 1.0, grass: 2.0, electric: 0.5, ice: 1.0,
        fighting: 2.0, poison: 1.0, ground: 1.0, flying: 1.0, psychic: 1.0,
        bug: 2.0, rock: 0.5, ghost: 1.0, dragon: 1.0, dark: 1.0,
        steel: 0.5, fairy: 1.0, normal: 1.0, light: 1.0, digital: 1.0
    },
    psychic: {
        fire: 1.0, water: 1.0, grass: 1.0, electric: 1.0, ice: 1.0,
        fighting: 2.0, poison: 2.0, ground: 1.0, flying: 1.0, psychic: 0.5,
        bug: 1.0, rock: 1.0, ghost: 1.0, dragon: 1.0, dark: 0.0,
        steel: 0.5, fairy: 1.0, normal: 1.0, light: 1.0, digital: 2.0
    },
    bug: {
        fire: 0.5, water: 1.0, grass: 2.0, electric: 1.0, ice: 1.0,
        fighting: 0.5, poison: 0.5, ground: 1.0, flying: 0.5, psychic: 2.0,
        bug: 1.0, rock: 1.0, ghost: 0.5, dragon: 1.0, dark: 2.0,
        steel: 0.5, fairy: 0.5, normal: 1.0, light: 1.0, digital: 1.0
    },
    rock: {
        fire: 2.0, water: 1.0, grass: 1.0, electric: 1.0, ice: 2.0,
        fighting: 0.5, poison: 1.0, ground: 0.5, flying: 2.0, psychic: 1.0,
        bug: 2.0, rock: 1.0, ghost: 1.0, dragon: 1.0, dark: 1.0,
        steel: 0.5, fairy: 1.0, normal: 1.0, light: 1.0, digital: 0.5
    },
    ghost: {
        fire: 1.0, water: 1.0, grass: 1.0, electric: 1.0, ice: 1.0,
        fighting: 1.0, poison: 1.0, ground: 1.0, flying: 1.0, psychic: 2.0,
        bug: 1.0, rock: 1.0, ghost: 2.0, dragon: 1.0, dark: 0.5,
        steel: 1.0, fairy: 1.0, normal: 0.0, light: 0.5, digital: 1.0
    },
    dragon: {
        fire: 1.0, water: 1.0, grass: 1.0, electric: 1.0, ice: 1.0,
        fighting: 1.0, poison: 1.0, ground: 1.0, flying: 1.0, psychic: 1.0,
        bug: 1.0, rock: 1.0, ghost: 1.0, dragon: 2.0, dark: 1.0,
        steel: 0.5, fairy: 0.0, normal: 1.0, light: 0.5, digital: 1.0
    },
    dark: {
        fire: 1.0, water: 1.0, grass: 1.0, electric: 1.0, ice: 1.0,
        fighting: 0.5, poison: 1.0, ground: 1.0, flying: 1.0, psychic: 2.0,
        bug: 1.0, rock: 1.0, ghost: 2.0, dragon: 1.0, dark: 0.5,
        steel: 1.0, fairy: 0.5, normal: 1.0, light: 0.5, digital: 1.0
    },
    steel: {
        fire: 0.5, water: 0.5, grass: 1.0, electric: 0.5, ice: 2.0,
        fighting: 1.0, poison: 1.0, ground: 1.0, flying: 1.0, psychic: 1.0,
        bug: 1.0, rock: 2.0, ghost: 1.0, dragon: 1.0, dark: 1.0,
        steel: 0.5, fairy: 2.0, normal: 1.0, light: 1.0, digital: 1.5
    },
    fairy: {
        fire: 0.5, water: 1.0, grass: 1.0, electric: 1.0, ice: 1.0,
        fighting: 2.0, poison: 0.5, ground: 1.0, flying: 1.0, psychic: 1.0,
        bug: 1.0, rock: 1.0, ghost: 1.0, dragon: 2.0, dark: 2.0,
        steel: 0.5, fairy: 1.0, normal: 1.0, light: 1.5, digital: 1.0
    },
    normal: {
        fire: 1.0, water: 1.0, grass: 1.0, electric: 1.0, ice: 1.0,
        fighting: 1.0, poison: 1.0, ground: 1.0, flying: 1.0, psychic: 1.0,
        bug: 1.0, rock: 0.5, ghost: 0.0, dragon: 1.0, dark: 1.0,
        steel: 0.5, fairy: 1.0, normal: 1.0, light: 1.0, digital: 1.0
    },
    light: {
        fire: 1.0, water: 1.0, grass: 1.0, electric: 1.0, ice: 1.0,
        fighting: 1.5, poison: 1.5, ground: 1.0, flying: 1.0, psychic: 1.0,
        bug: 1.0, rock: 1.0, ghost: 2.0, dragon: 1.5, dark: 2.0,
        steel: 1.0, fairy: 1.0, normal: 1.0, light: 0.5, digital: 1.5
    },
    digital: {
        fire: 1.0, water: 1.0, grass: 1.0, electric: 0.5, ice: 1.0,
        fighting: 1.0, poison: 1.5, ground: 1.0, flying: 1.0, psychic: 0.5,
        bug: 1.5, rock: 1.5, ghost: 1.0, dragon: 1.0, dark: 1.0,
        steel: 0.5, fairy: 1.0, normal: 1.0, light: 0.5, digital: 1.0
    }
};

const TYPE_NAMES = {
    fire: 'Feu',
    water: 'Eau',
    grass: 'Plante',
    electric: 'Électrique',
    ice: 'Glace',
    fighting: 'Combat',
    poison: 'Poison',
    ground: 'Sol',
    flying: 'Vol',
    psychic: 'Psy',
    bug: 'Insecte',
    rock: 'Roche',
    ghost: 'Spectre',
    dragon: 'Dragon',
    dark: 'Ténèbres',
    steel: 'Acier',
    fairy: 'Fée',
    normal: 'Normal',
    light: 'Lumière',
    digital: 'Digital'
};

// ═══════════════════════════════════════
// DIFFICULTY SETTINGS
// ═══════════════════════════════════════

const DIFFICULTY_LEVELS = {
    easy: { name: 'Facile', levelBonus: 0, goldMultiplier: 1, color: '#2ecc71' },
    normal: { name: 'Normal', levelBonus: 2, goldMultiplier: 1.5, color: '#3498db' },
    hard: { name: 'Difficile', levelBonus: 5, goldMultiplier: 2, color: '#e67e22' },
    expert: { name: 'Expert', levelBonus: 10, goldMultiplier: 3, color: '#e74c3c' }
};

// ═══════════════════════════════════════
// STATUS EFFECTS
// ═══════════════════════════════════════

const STATUS_EFFECTS = {
    poison: {
        name: 'Empoisonné',
        icon: '☠️',
        damagePerTurn: 10,
        duration: 3,
        color: '#9b59b6',
        skipChance: 0
    },
    burn: {
        name: 'Brûlé',
        icon: '🔥',
        damagePerTurn: 12,
        duration: 3,
        color: '#e74c3c',
        skipChance: 0
    },
    paralyze: {
        name: 'Paralysé',
        icon: '⚡',
        damagePerTurn: 0,
        duration: 2,
        color: '#f1c40f',
        skipChance: 50
    },
    freeze: {
        name: 'Gelé',
        icon: '❄️',
        damagePerTurn: 0,
        duration: 1,
        color: '#3498db',
        skipChance: 100
    }
};

// ═══════════════════════════════════════
// GAME CONSTANTS
// ═══════════════════════════════════════

const GAME_CONSTANTS = {
    MAX_ENERGY: 6,
    STARTING_ENERGY_PLAYER: 6,
    STARTING_ENERGY_ENEMY: 3,
    ENERGY_REGEN_PER_TURN: 2,
    TEAM_SIZE: 3,
    CRITICAL_MULTIPLIER: 1.5,
    DEFENSE_REDUCTION: 0.3,
    COMBO_BONUS_MULTIPLIER: 0.2,
    ANIMATION_DURATION: {
        FAST: 300,
        NORMAL: 500,
        SLOW: 1000,
        TURN_DELAY: 1200
    }
};

const STORAGE_KEYS = {
    BEST_SCORES: 'creatureBattle_bestScores',
    SETTINGS: 'creatureBattle_settings'
};

// ═══════════════════════════════════════
// EXPOSE TO WINDOW
// ═══════════════════════════════════════

window.TYPE_EFFECTIVENESS = TYPE_EFFECTIVENESS;
window.TYPE_NAMES = TYPE_NAMES;
window.DIFFICULTY_LEVELS = DIFFICULTY_LEVELS;
window.STATUS_EFFECTS = STATUS_EFFECTS;
window.GAME_CONSTANTS = GAME_CONSTANTS;
window.STORAGE_KEYS = STORAGE_KEYS;

console.log('✅ Game configuration chargée');