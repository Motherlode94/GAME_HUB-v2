// Système d'ennemis pour Blood Eclipse

class Enemy extends Entity {
    constructor(x, y, type, playerLevel) {
        const config = CONFIG.ENEMY.TYPES[type] || CONFIG.ENEMY.TYPES.BASIC;
        const size = CONFIG.ENEMY.MIN_SIZE + 
            (CONFIG.ENEMY.MAX_SIZE - CONFIG.ENEMY.MIN_SIZE) * (config.sizeMultiplier - 0.7) / 0.7;
        
        super(x, y, size, config.color);
        
        this.type = type;
        this.name = config.name;
        
        // Calculer les stats en fonction du niveau du joueur
        const levelMultiplier = 1 + (playerLevel - 1) * 0.2;
        
        this.maxHp = Math.floor(CONFIG.ENEMY.BASE_HP * config.hpMultiplier * levelMultiplier);
        this.hp = this.maxHp;
        this.damage = Math.floor(CONFIG.ENEMY.BASE_DAMAGE * config.damageMultiplier * levelMultiplier);
        this.speed = CONFIG.ENEMY.BASE_SPEED * config.speedMultiplier + 
            (playerLevel - 1) * CONFIG.ENEMY.SPEED_INCREASE_PER_LEVEL * 0.5;
        
        // Récompenses
        this.scoreReward = Math.floor(CONFIG.PROGRESSION.SCORE_PER_KILL * config.scoreMultiplier);
        this.xpReward = Math.floor(CONFIG.PROGRESSION.XP_PER_KILL * config.xpMultiplier);
        
        // Propriétés spéciales
        this.phasing = config.phasing || false;
        
        // Animation
        this.hitFlash = 0;
        this.pulsePhase = Math.random() * Math.PI * 2;
    }
    
    update(playerX, playerY, deltaTime) {
        // Mise à jour animation
        this.pulsePhase += deltaTime * 0.005;
        
        if (this.hitFlash > 0) {
            this.hitFlash -= deltaTime;
        }
        
        // Mouvement vers le joueur
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
            const speedFactor = deltaTime / 16; // Normaliser pour 60 FPS
            this.x += (dx / dist) * this.speed * speedFactor;
            this.y += (dy / dist) * this.speed * speedFactor;
        }
    }
    
    takeDamage(damage) {
        this.hp -= damage;
        this.hitFlash = 100;
        this.flash(CONFIG.COLORS.ENEMY_HIT);
        return this.hp <= 0;
    }
    
    draw(ctx) {
        const pulse = 1 + Math.sin(this.pulsePhase) * 0.05;
        const currentSize = this.size * pulse;
        
        // Couleur avec flash
        const drawColor = this.hitFlash > 0 ? CONFIG.COLORS.ENEMY_HIT : this.color;
        
        // Effet de phasing pour les spectres
        if (this.phasing) {
            ctx.save();
            ctx.globalAlpha = 0.7 + Math.sin(this.pulsePhase * 2) * 0.2;
        }
        
        // Corps
        ctx.fillStyle = drawColor;
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Bordure
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Yeux (effet démoniaque)
        ctx.fillStyle = '#ffffff';
        const eyeOffset = currentSize * 0.3;
        const eyeSize = currentSize * 0.15;
        ctx.beginPath();
        ctx.arc(this.x - eyeOffset, this.y - eyeOffset * 0.5, eyeSize, 0, Math.PI * 2);
        ctx.arc(this.x + eyeOffset, this.y - eyeOffset * 0.5, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        
        if (this.phasing) {
            ctx.restore();
        }
        
        // Barre de vie (seulement si pas full HP)
        if (this.hp < this.maxHp) {
            this.drawHealthBar(ctx, currentSize);
        }
    }
    
    drawHealthBar(ctx, currentSize) {
        const barWidth = currentSize * 1.5;
        const barHeight = 4;
        const barX = this.x - barWidth / 2;
        const barY = this.y - currentSize - 10;
        
        // Fond
        ctx.fillStyle = '#333333';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Vie
        const hpPercent = this.hp / this.maxHp;
        ctx.fillStyle = hpPercent > 0.5 ? '#00ff00' : hpPercent > 0.25 ? '#ffff00' : '#ff0000';
        ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
    }
}

// Spawner d'ennemis
const EnemySpawner = {
    enemyTypes: Object.keys(CONFIG.ENEMY.TYPES),
    
    // Poids de spawn par type
    spawnWeights: {
        BASIC: 40,
        FAST: 25,
        TANK: 15,
        BERSERKER: 12,
        GHOST: 8
    },
    
    getRandomEnemyType() {
        const totalWeight = Object.values(this.spawnWeights).reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;
        
        for (const [type, weight] of Object.entries(this.spawnWeights)) {
            random -= weight;
            if (random <= 0) {
                return type;
            }
        }
        
        return 'BASIC';
    },
    
    // Types plus difficiles à haut niveau
    getEnemyTypeForLevel(level) {
        // Ajuster les poids selon le niveau
        const adjustedWeights = { ...this.spawnWeights };
        
        if (level >= 5) {
            adjustedWeights.BASIC -= 10;
            adjustedWeights.TANK += 5;
            adjustedWeights.BERSERKER += 5;
        }
        
        if (level >= 8) {
            adjustedWeights.BASIC -= 10;
            adjustedWeights.GHOST += 5;
            adjustedWeights.BERSERKER += 5;
        }
        
        const totalWeight = Object.values(adjustedWeights).reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;
        
        for (const [type, weight] of Object.entries(adjustedWeights)) {
            random -= weight;
            if (random <= 0) {
                return type;
            }
        }
        
        return 'BASIC';
    }
};