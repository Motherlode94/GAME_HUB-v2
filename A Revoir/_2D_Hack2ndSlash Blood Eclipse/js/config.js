// Configuration globale du jeu - Blood Eclipse
const CONFIG = {
    CANVAS: {
        WIDTH: 1200,
        HEIGHT: 700
    },
    
    PLAYER: {
        SIZE: 30,
        SPEED: 5,
        BASE_HP: 100,
        BASE_DAMAGE: 15,
        ATTACK_RANGE: 80,
        ATTACK_COOLDOWN: 500,
        HP_PER_LEVEL: 15,
        DAMAGE_PER_LEVEL: 3
    },
    
    ENEMY: {
        MIN_SIZE: 25,
        MAX_SIZE: 40,
        BASE_SPEED: 2,
        BASE_HP: 30,
        BASE_DAMAGE: 5,
        SPAWN_INTERVAL: 2000,
        MAX_ENEMIES: 15,
        SPEED_INCREASE_PER_LEVEL: 0.3,
        HP_INCREASE_PER_LEVEL: 10,
        
        // Types d'ennemis
        TYPES: {
            BASIC: {
                name: 'Démon Mineur',
                sizeMultiplier: 1,
                speedMultiplier: 1,
                hpMultiplier: 1,
                damageMultiplier: 1,
                color: '#e94560',
                scoreMultiplier: 1,
                xpMultiplier: 1
            },
            FAST: {
                name: 'Ombre Rapide',
                sizeMultiplier: 0.7,
                speedMultiplier: 1.8,
                hpMultiplier: 0.6,
                damageMultiplier: 0.8,
                color: '#9932cc',
                scoreMultiplier: 1.2,
                xpMultiplier: 1.1
            },
            TANK: {
                name: 'Brute Infernale',
                sizeMultiplier: 1.4,
                speedMultiplier: 0.6,
                hpMultiplier: 2.5,
                damageMultiplier: 1.5,
                color: '#8b0000',
                scoreMultiplier: 2,
                xpMultiplier: 1.8
            },
            BERSERKER: {
                name: 'Berserker',
                sizeMultiplier: 1.1,
                speedMultiplier: 1.3,
                hpMultiplier: 1.2,
                damageMultiplier: 2,
                color: '#ff4500',
                scoreMultiplier: 1.5,
                xpMultiplier: 1.4
            },
            GHOST: {
                name: 'Spectre',
                sizeMultiplier: 0.9,
                speedMultiplier: 1.1,
                hpMultiplier: 0.8,
                damageMultiplier: 1,
                color: '#4a4a8a',
                scoreMultiplier: 1.3,
                xpMultiplier: 1.2,
                phasing: true
            }
        }
    },
    
    BOSS: {
        SIZE: 80,
        BASE_HP: 500,
        BASE_DAMAGE: 20,
        SPEED: 1.5,
        SPAWN_LEVEL: 5,
        HP_PER_LEVEL: 200,
        DAMAGE_PER_LEVEL: 5,
        
        // Types de boss
        TYPES: {
            CRIMSON_LORD: {
                name: 'Seigneur Écarlate',
                sizeMultiplier: 1,
                speedMultiplier: 1,
                hpMultiplier: 1,
                damageMultiplier: 1,
                color: '#8b0000',
                scoreMultiplier: 5,
                xpMultiplier: 3
            },
            SHADOW_DEMON: {
                name: 'Démon des Ombres',
                sizeMultiplier: 0.9,
                speedMultiplier: 1.3,
                hpMultiplier: 0.8,
                damageMultiplier: 1.2,
                color: '#4b0082',
                scoreMultiplier: 6,
                xpMultiplier: 3.5
            },
            INFERNO_TITAN: {
                name: 'Titan Infernal',
                sizeMultiplier: 1.3,
                speedMultiplier: 0.7,
                hpMultiplier: 1.5,
                damageMultiplier: 1.5,
                color: '#ff4500',
                scoreMultiplier: 7,
                xpMultiplier: 4
            },
            VOID_WARDEN: {
                name: 'Gardien du Néant',
                sizeMultiplier: 1.1,
                speedMultiplier: 1.1,
                hpMultiplier: 1.2,
                damageMultiplier: 1.3,
                color: '#1c1c3c',
                scoreMultiplier: 8,
                xpMultiplier: 4.5
            }
        }
    },
    
    PROGRESSION: {
        XP_PER_KILL: 20,
        XP_MULTIPLIER_PER_LEVEL: 1.5,
        SCORE_PER_KILL: 100,
        SCORE_MULTIPLIER_PER_LEVEL: 1.2
    },
    
    POWERUPS: {
        DROP_CHANCE: 0.25,
        MAGNET_RANGE: 80,
        
        HEALTH: {
            color: '#00ff00',
            healAmount: 30,
            duration: null
        },
        SHIELD: {
            color: '#00bfff',
            duration: 8000
        },
        DAMAGE_BOOST: {
            color: '#ff4500',
            multiplier: 2,
            duration: 10000
        },
        SPEED_BOOST: {
            color: '#ffff00',
            multiplier: 1.5,
            duration: 8000
        },
        WEAPON: {
            color: '#9400d3',
            duration: null
        }
    },
    
    COLORS: {
        PLAYER: '#4ecdc4',
        PLAYER_ATTACKING: '#ff6b6b',
        ENEMY: '#e94560',
        ENEMY_HIT: '#ff9999',
        BOSS: '#8b0000',
        BOSS_HIT: '#ff6666',
        PARTICLE_HIT: '#ffff00',
        PARTICLE_DEATH: '#ff0000',
        PARTICLE_POWERUP: '#ffff00'
    },

    VFX: {
        PARTICLE_COUNT: 8,
        PARTICLE_LIFE: 500,
        SCREEN_SHAKE_INTENSITY: 4
    }
};