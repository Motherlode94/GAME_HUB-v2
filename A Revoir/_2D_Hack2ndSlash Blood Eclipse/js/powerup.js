// Système de Power-ups pour Blood Eclipse

// Liste des armes disponibles pour les drops
const WEAPON_DROPS = ['LANCE', 'FAUX', 'DUAL_BLADES', 'HAMMER', 'KATANA'];

// Classe PowerUp
class PowerUp {
    constructor(x, y, type = null) {
        this.x = x;
        this.y = y;
        this.type = type || this.getRandomType();
        this.size = 15;
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.lifetime = 15000; // 15 secondes avant disparition
        this.age = 0;
        this.collected = false;
        
        // Propriétés visuelles selon le type
        this.setupVisuals();
        
        // Si c'est une arme, choisir laquelle
        if (this.type === 'WEAPON') {
            this.weaponKey = WEAPON_DROPS[Math.floor(Math.random() * WEAPON_DROPS.length)];
        }
    }
    
    getRandomType() {
        const types = ['HEALTH', 'SHIELD', 'DAMAGE_BOOST', 'SPEED_BOOST'];
        const weights = [0.35, 0.25, 0.25, 0.15]; // Probabilités
        
        const random = Math.random();
        let cumulative = 0;
        
        for (let i = 0; i < types.length; i++) {
            cumulative += weights[i];
            if (random < cumulative) {
                return types[i];
            }
        }
        
        return 'HEALTH';
    }
    
    setupVisuals() {
        const config = CONFIG.POWERUPS[this.type];
        this.color = config ? config.color : '#ffffff';
        
        // Symboles selon le type
        switch(this.type) {
            case 'HEALTH':
                this.symbol = '+';
                break;
            case 'SHIELD':
                this.symbol = '🛡';
                break;
            case 'DAMAGE_BOOST':
                this.symbol = '⚔';
                break;
            case 'SPEED_BOOST':
                this.symbol = '»';
                break;
            case 'WEAPON':
                this.symbol = '★';
                break;
            default:
                this.symbol = '?';
        }
    }
    
    update(deltaTime) {
        this.age += deltaTime;
        this.pulsePhase += deltaTime * 0.005;
        
        // Vérifier si expiré
        return this.age < this.lifetime && !this.collected;
    }
    
    draw(ctx) {
        const pulse = 1 + Math.sin(this.pulsePhase) * 0.2;
        const currentSize = this.size * pulse;
        
        // Effet de clignotement quand proche de l'expiration
        if (this.age > this.lifetime * 0.7) {
            const blinkRate = Math.sin(this.age * 0.02);
            if (blinkRate < 0) return;
        }
        
        // Lueur extérieure
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentSize * 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Cercle principal
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Bordure
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Symbole
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.floor(currentSize)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.symbol, this.x, this.y);
    }
    
    isInRange(playerX, playerY, playerSize) {
        const dist = Math.sqrt(
            Math.pow(this.x - playerX, 2) + 
            Math.pow(this.y - playerY, 2)
        );
        return dist < playerSize + this.size + CONFIG.POWERUPS.MAGNET_RANGE;
    }
}

// Système de gestion des power-ups
class PowerUpSystem {
    constructor() {
        this.powerUps = [];
        this.activeEffects = {
            shield: { active: false, timer: 0 },
            damageBoost: { active: false, timer: 0, multiplier: 1 },
            speedBoost: { active: false, timer: 0, multiplier: 1 }
        };
    }
    
    // Essayer de faire apparaître un power-up à la mort d'un ennemi
    trySpawn(x, y) {
        if (Math.random() < CONFIG.POWERUPS.DROP_CHANCE) {
            this.powerUps.push(new PowerUp(x, y));
            return true;
        }
        return false;
    }
    
    // Forcer l'apparition (pour les boss)
    forceSpawn(x, y, type = null) {
        this.powerUps.push(new PowerUp(x, y, type));
    }
    
    update(deltaTime) {
        // Mise à jour des power-ups
        this.powerUps = this.powerUps.filter(p => p.update(deltaTime));
        
        // Mise à jour des effets actifs
        for (const [key, effect] of Object.entries(this.activeEffects)) {
            if (effect.active) {
                effect.timer -= deltaTime;
                if (effect.timer <= 0) {
                    effect.active = false;
                    effect.timer = 0;
                    if (effect.multiplier !== undefined) {
                        effect.multiplier = 1;
                    }
                }
            }
        }
    }
    
    // Vérifier le ramassage
    checkPickup(playerX, playerY, playerSize) {
        const collected = [];
        
        this.powerUps = this.powerUps.filter(powerUp => {
            if (powerUp.isInRange(playerX, playerY, playerSize)) {
                powerUp.collected = true;
                collected.push(powerUp);
                return false;
            }
            return true;
        });
        
        return collected;
    }
    
    // Activer un effet
    activateEffect(effectName, duration) {
        if (this.activeEffects[effectName]) {
            this.activeEffects[effectName].active = true;
            this.activeEffects[effectName].timer = duration;
            
            // Configurer le multiplicateur si applicable
            if (effectName === 'damageBoost') {
                this.activeEffects[effectName].multiplier = CONFIG.POWERUPS.DAMAGE_BOOST.multiplier;
            } else if (effectName === 'speedBoost') {
                this.activeEffects[effectName].multiplier = CONFIG.POWERUPS.SPEED_BOOST.multiplier;
            }
        }
    }
    
    // Vérifications d'état
    hasShield() {
        return this.activeEffects.shield.active;
    }
    
    getDamageMultiplier() {
        return this.activeEffects.damageBoost.active ? 
            this.activeEffects.damageBoost.multiplier : 1;
    }
    
    getSpeedMultiplier() {
        return this.activeEffects.speedBoost.active ? 
            this.activeEffects.speedBoost.multiplier : 1;
    }
    
    // Temps restant pour un effet (pour l'UI)
    getEffectTimeRemaining(effectName) {
        if (this.activeEffects[effectName] && this.activeEffects[effectName].active) {
            return this.activeEffects[effectName].timer;
        }
        return 0;
    }
    
    draw(ctx) {
        this.powerUps.forEach(powerUp => powerUp.draw(ctx));
    }
    
    // Réinitialiser le système
    reset() {
        this.powerUps = [];
        for (const effect of Object.values(this.activeEffects)) {
            effect.active = false;
            effect.timer = 0;
            if (effect.multiplier !== undefined) {
                effect.multiplier = 1;
            }
        }
    }
}