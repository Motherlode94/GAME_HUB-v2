class Enemy {
    constructor(worldWidth, worldHeight) {
        // Spawn aléatoire sur les bords du monde
        const side = Math.random() < 0.5 ? 0 : worldWidth - 1;
        this.x = side === 0 ? 1 : worldWidth - 2;
        this.y = Math.random() * (worldHeight * 0.6); // Dans la partie supérieure
        this.width = 0.7;
        this.height = 1.6;
        
        // Physique
        this.vx = 0;
        this.vy = 0;
        this.speed = 0.12;
        this.maxVx = 0.22;
        this.gravity = 0.02;
        this.jumpPower = 0.45;
        this.onGround = false;
        
        // Vie et poursuite
        this.health = 5;
        this.maxHealth = 5;
        this.direction = 1;
        this.chaseDistNormal = 80;
        this.chaseDistSneak = 60;
        this.chaseDistHidden = 15;
    }
    
    update(player, world) {
        // Gravité
        if (!this.onGround) {
            this.vy += this.gravity;
            this.vy = Math.min(this.vy, 0.6);
        }
        
        // Friction au sol
        if (this.onGround) {
            this.vx *= 0.75;
        }
        
        // IA de poursuite
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        let chaseDist = this.chaseDistNormal;
        if (player.sneaking) {
            chaseDist = this.chaseDistSneak;
        }
        if (player.isHidden) {
    chaseDist = this.chaseDistHidden;
}
        
        if (dist < chaseDist) {
            // Accélérer vers le joueur
            const targetVx = (dx / dist) * this.speed;
            this.vx = this.vx * 0.85 + targetVx * 0.15;
            this.vx = Math.max(-this.maxVx, Math.min(this.maxVx, this.vx));
            
            // Saut si obstacle
            if (this.onGround && dy > 1.5) {
                this.vy = -this.jumpPower;
                this.onGround = false;
            }
            
            this.direction = dx > 0 ? 1 : -1;
        } else {
            this.vx *= 0.92;
        }
        
        // Déplacement horizontal
        this.x += this.vx;
        this.checkCollisionX(world);
        
        // Déplacement vertical
        this.y += this.vy;
        this.checkCollisionY(world);
        
        if (Math.abs(this.vx) < 0.01) this.vx = 0;
        
        // Dégâts des arbres
        this.checkDamage(world);
    }
    
    checkCollisionX(world) {
        const margin = 0.05;
        const left = Math.floor(this.x - this.width / 2 + margin);
        const right = Math.floor(this.x + this.width / 2 - margin);
        const top = Math.floor(this.y + margin);
        const bottom = Math.floor(this.y + this.height - margin);
        
        for (let y = top; y <= bottom; y++) {
            for (let x = left; x <= right; x++) {
                const block = world.getBlock(x, y);
                if (block && block.solid) {
                    if (this.vx > 0) {
                        this.x = x - this.width / 2 - 0.01;
                    } else if (this.vx < 0) {
                        this.x = x + 1 + this.width / 2 + 0.01;
                    }
                    this.vx = 0;
                    return;
                }
            }
        }
    }
    
    checkCollisionY(world) {
        const margin = 0.05;
        const left = Math.floor(this.x - this.width / 2 + margin);
        const right = Math.floor(this.x + this.width / 2 - margin);
        const top = Math.floor(this.y);
        const bottom = Math.floor(this.y + this.height);
        
        this.onGround = false;
        
        for (let y = top; y <= bottom; y++) {
            for (let x = left; x <= right; x++) {
                const block = world.getBlock(x, y);
                if (block && block.solid) {
                    if (this.vy > 0) {
                        this.y = y - this.height;
                        this.vy = 0;
                        this.onGround = true;
                    } else if (this.vy < 0) {
                        this.y = y + 1;
                        this.vy = 0;
                    }
                    return;
                }
            }
        }
    }
    
    checkDamage(world) {
        const left = Math.floor(this.x - this.width / 2);
        const right = Math.floor(this.x + this.width / 2);
        const top = Math.floor(this.y);
        const bottom = Math.floor(this.y + this.height);
        
        for (let y = top; y <= bottom; y++) {
            for (let x = left; x <= right; x++) {
                const block = world.getBlock(x, y);
                if (block && (block.type === 'leaves' || block.type === 'wood')) {
                    this.health--;
                    return; // Un dégât par frame
                }
            }
        }
    }
    
    isNearPlayer(player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        return Math.sqrt(dx * dx + dy * dy) < 1.8;
    }
    
    draw(ctx, offsetX, offsetY, blockSize) {
        const screenX = this.x * blockSize - offsetX;
        const screenY = this.y * blockSize - offsetY;
        const width = this.width * blockSize;
        const height = this.height * blockSize;
        
        // Corps démoniaque sombre
        ctx.fillStyle = '#330000';
        ctx.shadowColor = '#660000';
        ctx.shadowBlur = 10;
        ctx.fillRect(screenX - width / 2, screenY, width, height);
        ctx.shadowBlur = 0;
        
        // Contour rougeoyant
        ctx.strokeStyle = '#aa0000';
        ctx.lineWidth = 3;
        ctx.strokeRect(screenX - width / 2, screenY, width, height);
        
        // Yeux luisants
        ctx.fillStyle = '#ff2222';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 15;
        const eyeSize = 5;
        const eyeY = screenY + 15;
        if (this.direction > 0) {
            ctx.beginPath();
            ctx.arc(screenX + 4, eyeY, eyeSize, 0, Math.PI * 2);
            ctx.arc(screenX + 14, eyeY, eyeSize, 0, Math.PI * 2);
        } else {
            ctx.beginPath();
            ctx.arc(screenX - 14, eyeY, eyeSize, 0, Math.PI * 2);
            ctx.arc(screenX - 4, eyeY, eyeSize, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Barre de vie
        const barWidth = 40;
        const barHeight = 4;
        const barX = screenX - barWidth / 2;
        const barY = screenY - 15;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        ctx.fillStyle = this.health > 2 ? '#ffaa00' : '#ff4444';
        const healthWidth = (this.health / this.maxHealth) * barWidth;
        ctx.fillRect(barX, barY, healthWidth, barHeight);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
}