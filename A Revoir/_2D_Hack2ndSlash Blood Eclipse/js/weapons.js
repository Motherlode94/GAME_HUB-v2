// ================================
// WEAPON SYSTEM – Blood Eclipse
// Combo Melee + Types d'armes
// ================================

const WEAPON_TYPES = {
    MELEE: 'melee',
    HEAVY: 'heavy',
    RANGED: 'ranged',
    MAGIC: 'magic'
};

// Définition des combos
const COMBOS = {
    BASIC: [
        { damageMul: 1.0, rangeMul: 1.0, cooldown: 300 },
        { damageMul: 1.2, rangeMul: 1.1, cooldown: 350 },
        { damageMul: 1.5, rangeMul: 1.3, cooldown: 500 }
    ],

    HEAVY: [
        { damageMul: 1.5, rangeMul: 1.2, cooldown: 600 },
        { damageMul: 2.2, rangeMul: 1.5, cooldown: 900 }
    ]
};

class WeaponSystem {
    constructor(player) {
        this.player = player;

        // ========================
        // ARMES
        // ========================
        this.weapons = {
            SPIRIT_BLADE: {
                name: 'Lame Spirituelle',
                type: WEAPON_TYPES.MELEE,
                range: 80,
                combo: COMBOS.BASIC,
                color: '#4ecdc4'
            },

            KATANA: {
                name: 'Katana',
                type: WEAPON_TYPES.MELEE,
                range: 85,
                combo: COMBOS.HEAVY,
                critChance: 0.3,
                critMultiplier: 2.0,
                color: '#ff0000'
            },

            DAGGER: {
                name: 'Dague',
                type: WEAPON_TYPES.MELEE,
                range: 60,
                combo: COMBOS.BASIC,
                critChance: 0.4,
                critMultiplier: 1.5,
                color: '#aaaaaa'
            },

            HAMMER: {
                name: 'Marteau',
                type: WEAPON_TYPES.HEAVY,
                range: 90,
                combo: [
                    { damageMul: 2.5, rangeMul: 1.4, cooldown: 900 }
                ],
                stunChance: 0.4,
                color: '#ff8800'
            }
        };

        this.currentKey = 'SPIRIT_BLADE';
        this.currentWeapon = this.weapons[this.currentKey];

        // ========================
        // COMBO STATE
        // ========================
        this.attackTimer = 0;
        this.comboIndex = 0;
        this.comboTimer = 0;
        this.comboWindow = 500; // ms
    }


    // ========================
    // UPDATE
    // ========================
update(deltaTime) {
    // 1. Gestion du Cooldown d'attaque
    if (this.attackTimer > 0) {
        this.attackTimer -= deltaTime;
        if (this.attackTimer < 0) this.attackTimer = 0;
    }

    // 2. Gestion de la fenêtre de Combo
    // On ne réduit le timer de combo QUE si on n'est pas en train d'attaquer
    if (this.attackTimer === 0 && this.comboTimer > 0) {
        this.comboTimer -= deltaTime;
        
        if (this.comboTimer <= 0) {
            this.comboIndex = 0; // Reset au premier coup si le joueur est trop lent
            this.comboTimer = 0;
        }
    }
}

attack(damageMultiplier = 1) {
    if (this.attackTimer > 0) return null;

    const weapon = this.currentWeapon;
    const combo = weapon.combo;
    const step = combo[this.comboIndex];

    // --- Calcul des Dommages ---
    let damage = this.player.damage * step.damageMul * damageMultiplier;
    let isCrit = false;

    // Logique de Critique
    if (weapon.critChance && Math.random() < weapon.critChance) {
        damage *= (weapon.critMultiplier || 2.0);
        isCrit = true;
    }

    // --- Données d'attaque ---
    const attackData = {
        name: weapon.name,
        type: weapon.type,
        damage: damage,
        isCrit: isCrit,
        range: weapon.range * step.rangeMul,
        stun: weapon.stunChance ? (Math.random() < weapon.stunChance) : false,
        comboStep: this.comboIndex,
        color: weapon.color
    };

    // --- Mise à jour des états ---
    this.attackTimer = step.cooldown;
    
    // On réinitialise la fenêtre de combo à chaque coup
    // Elle est généralement égale au cooldown + une marge de manoeuvre (ex: 400ms)
    this.comboTimer = step.cooldown + this.comboWindow;

    this.comboIndex++;
    if (this.comboIndex >= combo.length) {
        this.comboIndex = 0;
    }

    return attackData;
}

    // ========================
    // CHANGE WEAPON
    // ========================
    changeWeapon(newKey) {
        if (this.weapons[newKey]) {
            this.currentKey = newKey;
            this.currentWeapon = this.weapons[newKey];
            this.comboIndex = 0;
            this.comboTimer = 0;
            return this.currentWeapon.name;
        }
        return null;
    }

    draw(ctx) {
        // réservé pour animations de swing
    }
}
