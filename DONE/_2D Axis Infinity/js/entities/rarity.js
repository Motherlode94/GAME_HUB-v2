/**
 * ============================================
 * RARITY SYSTEM - Système de Rareté (5 niveaux)
 * ============================================
 * AMÉLIORATION : Passage de 3 à 5 niveaux de rareté
 * BASIC → COMMON → RARE → EPIC → LEGENDARY
 * ============================================
 */

const RARITY = Object.freeze({
    BASIC: {
        id: 'basic',
        label: 'Basique',
        order: 1,
        statMultiplier: 1.0,
        critBonus: 0,
        color: '#95a5a6',
        icon: '⚪'
    },
    COMMON: {
        id: 'common',
        label: 'Commun',
        order: 2,
        statMultiplier: 1.1,
        critBonus: 2,
        color: '#bdc3c7',
        icon: '🔵'
    },
    RARE: {
        id: 'rare',
        label: 'Rare',
        order: 3,
        statMultiplier: 1.2,
        critBonus: 5,
        color: '#3498db',
        icon: '🟦'
    },
    EPIC: {
        id: 'epic',
        label: 'Épique',
        order: 4,
        statMultiplier: 1.35,
        critBonus: 8,
        color: '#9b59b6',
        icon: '🟪'
    },
    LEGENDARY: {
        id: 'legendary',
        label: 'Légendaire',
        order: 5,
        statMultiplier: 1.5,
        critBonus: 12,
        color: '#f39c12',
        icon: '🌟'
    }
});

/**
 * Fonction pour obtenir une rareté selon la vague
 * @param {number} waveNumber - Numéro de la vague
 * @returns {Object} Rareté
 */
function getRarityForWave(waveNumber) {
    // Vague 1-3 : BASIC + COMMON
    if (waveNumber <= 3) {
        return Math.random() < 0.6 ? RARITY.BASIC : RARITY.COMMON;
    }
    // Vague 4-7 : COMMON + RARE
    else if (waveNumber <= 7) {
        return Math.random() < 0.6 ? RARITY.COMMON : RARITY.RARE;
    }
    // Vague 8-12 : RARE + EPIC
    else if (waveNumber <= 12) {
        return Math.random() < 0.6 ? RARITY.RARE : RARITY.EPIC;
    }
    // Vague 13+ : EPIC + LEGENDARY
    else {
        return Math.random() < 0.6 ? RARITY.EPIC : RARITY.LEGENDARY;
    }
}

/**
 * Applique les bonus de rareté à une créature
 * @param {Creature} creature - Créature
 * @param {Object} rarity - Rareté
 */
function applyRarityBonus(creature, rarity) {
    creature.rarity = rarity;
    
    const mult = rarity.statMultiplier;
    creature.maxHP = Math.floor(creature.maxHP * mult);
    creature.currentHP = creature.maxHP;
    creature.attack = Math.floor(creature.attack * mult);
    creature.defense = Math.floor(creature.defense * mult);
    creature.critRate = Math.min(50, creature.critRate + rarity.critBonus);
    
    console.log(`✨ ${creature.name} [${rarity.icon} ${rarity.label}] - Stats ×${mult}`);
}

// Exposition globale
window.RARITY = RARITY;
window.getRarityForWave = getRarityForWave;
window.applyRarityBonus = applyRarityBonus;

console.log('✅ Système de Rareté chargé (5 niveaux)');