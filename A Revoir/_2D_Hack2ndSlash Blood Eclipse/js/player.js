// Classe du joueur - Blood Eclipse
class Player extends Entity {
    constructor(x, y) {
        super(x, y, CONFIG.PLAYER.SIZE, CONFIG.COLORS.PLAYER);
        this.maxHp = CONFIG.PLAYER.BASE_HP;
        this.hp = this.maxHp;
        this.damage = CONFIG.PLAYER.BASE_DAMAGE;
        this.speed = CONFIG.PLAYER.SPEED;
        this.baseSpeed = CONFIG.PLAYER.SPEED;
        this.isAttacking = false;
        this.attackCooldown = false;
        this.level = 1;
        this.xp = 0;
        this.xpToNextLevel = Utils.getXPForLevel(this.level);
        
        // Système d'armes
        this.weaponSystem = new WeaponSystem(this);
        
        // Direction du joueur (pour les attaques)
        this.facingAngle = 0;
        this.lastMoveX = 1;
        this.lastMoveY = 0;
    }
    
    update(keys, canvasWidth, canvasHeight, deltaTime, speedMultiplier = 1) {
        // Déplacement
        let dx = 0;
        let dy = 0;
        
        if (keys['arrowup'] || keys['z']) dy -= 1;
        if (keys['arrowdown'] || keys['s']) dy += 1;
        if (keys['arrowleft'] || keys['q']) dx -= 1;
        if (keys['arrowright'] || keys['d']) dx += 1;
        
        // Normaliser le vecteur de déplacement
        if (dx !== 0 || dy !== 0) {
            const magnitude = Math.sqrt(dx * dx + dy * dy);
            dx = (dx / magnitude) * this.speed * speedMultiplier;
            dy = (dy / magnitude) * this.speed * speedMultiplier;
            
            // Mettre à jour la direction
            this.lastMoveX = dx;
            this.lastMoveY = dy;
            this.facingAngle = Math.atan2(dy, dx);
        }
        
        // Appliquer le déplacement avec limites
        this.x = Math.max(this.size, Math.min(canvasWidth - this.size, this.x + dx));
        this.y = Math.max(this.size, Math.min(canvasHeight - this.size, this.y + dy));
    }
    
attack(damageMultiplier = 1) {
    // On passe la position et l'angle au système d'arme
    return this.weaponSystem.attack(
        this.x, 
        this.y, 
        this.facingAngle, 
        damageMultiplier
    );
}
    
    changeWeapon(weaponKey) {
        return this.weaponSystem.changeWeapon(weaponKey);
    }
    
    takeDamage(damage, hasShield = false) {
        if (hasShield) {
            damage = Math.floor(damage * 0.3); // 70% de réduction
        }
        
        this.hp -= damage;
        this.flash('#ff0000');
        return this.hp <= 0;
    }
    
    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
    }
    
    gainXP(amount) {
        this.xp += amount;
        
        if (this.xp >= this.xpToNextLevel) {
            this.levelUp();
            return true;
        }
        return false;
    }
    
    levelUp() {
        this.level++;
        this.xp = 0;
        this.xpToNextLevel = Utils.getXPForLevel(this.level);
        
        // Amélioration des stats
        this.maxHp += CONFIG.PLAYER.HP_PER_LEVEL;
        this.hp = this.maxHp; // Guérison complète
        this.damage += CONFIG.PLAYER.DAMAGE_PER_LEVEL;
    }
    
    draw(ctx) {
        // Corps du joueur
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Bordure
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Indicateur de direction
        const indicatorLength = this.size * 0.8;
        ctx.strokeStyle = this.weaponSystem.currentWeapon.color || '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(
            this.x + Math.cos(this.facingAngle) * indicatorLength,
            this.y + Math.sin(this.facingAngle) * indicatorLength
        );
        ctx.stroke();
        
        // Effet d'attaque (cercle de portée)
if (this.weaponSystem.attackTimer > 0) {
    const weapon = this.weaponSystem.currentWeapon;
    // Calcul d'un ratio de progression de l'attaque (0 à 1)
    const attackProgress = 1 - (this.weaponSystem.attackTimer / weapon.combo[this.weaponSystem.comboIndex === 0 ? weapon.combo.length - 1 : this.weaponSystem.comboIndex - 1].cooldown);

    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = weapon.color;
    ctx.globalAlpha = 1 - attackProgress; // L'effet s'estompe
    ctx.lineWidth = 2;
    // On dessine un arc de cercle dans la direction du regard
    ctx.arc(this.x, this.y, weapon.range, this.facingAngle - 0.5, this.facingAngle + 0.5);
    ctx.stroke();
    ctx.restore();
}
    }
}