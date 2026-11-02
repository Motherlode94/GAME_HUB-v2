class Enemy {
    constructor(lvl, type = 'normal') {
        this.size = type === 'boss' ? 70 : type === 'tank' ? 40 : type === 'fast' ? 22 : 28;
        this.radius = this.size / 2;
        this.pos = this.getSpawnPos();
        this.type = type;
        this.lvl = lvl;
        
        // Stats selon type
        switch(type) {
            case 'fast':
                this.speed = 2.8 + 0.5 * (lvl - 1);
                this.maxHealth = 1;
                this.damage = 1;
                break;
            case 'tank':
                this.speed = 0.9 + 0.25 * (lvl - 1);
                this.maxHealth = 5 + Math.floor(lvl * 1.5);
                this.damage = 2;
                break;
            case 'boss':
                this.speed = 1.3 + 0.2 * (lvl - 1);
                this.maxHealth = 15 + lvl * 5;
                this.damage = 3;
                break;
            default: // normal
                this.speed = 1.5 + 0.4 * (lvl - 1);
                this.maxHealth = 2 + Math.floor((lvl - 1) / 1.5);
                this.damage = 1;
        }
        
        this.health = this.maxHealth;
        this.deathTimer = 0;
        this.hitFlashFrames = 0;
        this.color = this.getColor();
        this.attackCooldown = 0;
        this.projectiles = [];
        this.spawnTime = Date.now();
        this.wavePattern = Math.random() * Math.PI * 2;
    }

    getColor() {
        switch(this.type) {
            case 'fast': return '#ff8800';
            case 'tank': return '#aa00aa';
            case 'boss': return '#ff0000';
            default: return this.lvl > 5 ? '#ff4444' : '#ff5555';
        }
    }

    getSpawnPos() {
        const side = Math.floor(Math.random() * 4);
        const padding = 100;
        if (side === 0) return new Vector(Math.random() * canvas.width, -this.radius - padding);
        if (side === 1) return new Vector(canvas.width + this.radius + padding, Math.random() * canvas.height);
        if (side === 2) return new Vector(Math.random() * canvas.width, canvas.height + this.radius + padding);
        return new Vector(-this.radius - padding, Math.random() * canvas.height);
    }

    update(player) {
        if (this.hitFlashFrames > 0) this.hitFlashFrames--;
        if (this.deathTimer > 0) {
            this.deathTimer--;
            this.pos.y += 2; // Tombe lors de la mort
            return;
        }

        const time = Date.now() * 0.001;
        const distanceToPlayer = this.pos.distance(player.pos);

        // Comportements différents selon type
        switch(this.type) {
            case 'boss':
                this.updateBoss(player, time, distanceToPlayer);
                break;
            case 'fast':
                this.updateFast(player, time);
                break;
            case 'tank':
                this.updateTank(player, distanceToPlayer);
                break;
            default:
                this.updateNormal(player, time);
        }

        // Garder à l'intérieur de l'écran
        this.pos.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.pos.x));
        this.pos.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.pos.y));
    }

    updateBoss(player, time, distance) {
        // Boss tire des projectiles en patterns
        if (this.attackCooldown <= 0) {
            this.shootBossProjectiles(player, time);
            this.attackCooldown = 80 - Math.min(50, this.lvl * 3);
        } else {
            this.attackCooldown--;
        }
        
        // Mouvement intelligent
        if (distance < 180) {
            // Recule si trop proche
            const dir = this.pos.sub(player.pos).normalize();
            this.pos = this.pos.add(dir.mul(this.speed * 0.7));
        } else if (distance > 300) {
            // Approche normalement
            const dir = player.pos.sub(this.pos).normalize();
            this.pos = this.pos.add(dir.mul(this.speed));
        } else {
            // Déplacement latéral
            const tangent = new Vector(-player.pos.y + this.pos.y, player.pos.x - this.pos.x).normalize();
            const wave = Math.sin(time * 2) * 0.5;
            this.pos = this.pos.add(tangent.mul(this.speed * 0.8 * (0.5 + wave)));
        }
    }

    updateFast(player, time) {
        // Zigzag rapide
        const baseDir = player.pos.sub(this.pos).normalize();
        const waveAngle = Math.sin(time * 5 + this.wavePattern) * 1.2;
        const angle = Math.atan2(baseDir.y, baseDir.x) + waveAngle;
        this.pos.x += Math.cos(angle) * this.speed;
        this.pos.y += Math.sin(angle) * this.speed;
    }

    updateTank(player, distance) {
        // Charge occasionnelle
        if (distance < 200 && Math.random() < 0.02) {
            const chargeDir = player.pos.sub(this.pos).normalize();
            this.pos = this.pos.add(chargeDir.mul(this.speed * 3));
            // Effet visuel de charge
            particles.push(new Particle(
                this.pos.x, this.pos.y,
                -chargeDir.x * 2, -chargeDir.y * 2,
                '#ff00ff',
                5,
                0.6,
                0.05
            ));
        } else {
            const dir = player.pos.sub(this.pos).normalize();
            this.pos = this.pos.add(dir.mul(this.speed));
        }
    }

    updateNormal(player, time) {
        // Mouvement avec léger pattern
        const dir = player.pos.sub(this.pos).normalize();
        const wave = Math.sin(time * 3) * 0.3;
        this.pos = this.pos.add(dir.mul(this.speed * (1 + wave)));
    }

    shootBossProjectiles(player, time) {
        const patterns = [
            { count: 8, spread: Math.PI * 2 }, // Cercle
            { count: 5, spread: Math.PI / 4 }, // Éventail
            { count: 3, spread: Math.PI / 6 }  // Tir groupé
        ];
        
        const pattern = patterns[Math.floor(time) % patterns.length];
        
        for (let i = 0; i < pattern.count; i++) {
            let angle;
            if (pattern.count === 1) {
                angle = Math.atan2(player.pos.y - this.pos.y, player.pos.x - this.pos.x);
            } else {
                const baseAngle = Math.atan2(player.pos.y - this.pos.y, player.pos.x - this.pos.x);
                angle = baseAngle + (i - (pattern.count - 1) / 2) * (pattern.spread / pattern.count);
            }
            
            const vel = new Vector(Math.cos(angle), Math.sin(angle)).mul(4);
            this.projectiles.push({
                pos: new Vector(this.pos.x, this.pos.y),
                vel: vel,
                radius: 10,
                color: '#ff5555',
                homing: pattern.count === 3 && i === 1 // Le projectile du milieu est guidé
            });
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        this.hitFlashFrames = 7;
        
        // Effet visuel de dégâts
        createDamageNumber(this.pos.x, this.pos.y - this.radius - 10, amount, '#ffffff');
        
        // Particules de dégâts
        for (let i = 0; i < 3; i++) {
            particles.push(new Particle(
                this.pos.x,
                this.pos.y,
                (Math.random() - 0.5) * 4,
                (Math.random() - 0.5) * 4,
                this.color,
                3,
                0.5,
                0.1
            ));
        }
        
        return this.health <= 0;
    }

draw(ctx) {
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);

    // Contact shadow: stays beneath the sprite even during damage flashes.
    ctx.fillStyle = 'rgba(0,0,0,.42)';
    ctx.beginPath();
    ctx.ellipse(2, 3, this.radius * 1.06, Math.max(4, this.radius * .28), 0, 0, Math.PI * 2);
    ctx.fill();

    if (this.deathTimer > 0) {
        ctx.globalAlpha = this.deathTimer / 30;
        ctx.rotate(this.deathTimer * 0.1);
    } else {
        const pulse = 0.8 + 0.2 * Math.sin(Date.now() * 0.005);
        ctx.globalAlpha = 0.7 + 0.3 * (this.health / this.maxHealth) * pulse;
    }

    let img = null;

    switch (this.type) {
        case 'boss':
            img = enemyBossImg;
            break;
        case 'tank':
            img = enemyTankImg;
            break;
        case 'fast':
            img = enemyFastImg;
            break;
        default:
            img = enemyNormalImg;
            break;
    }

    if (img && img.complete && img.naturalWidth > 0) {
        let drawWidth = 64;
        let drawHeight = 64;
        let yOffset = 50;

        switch (this.type) {
            case 'boss':
                drawWidth = 120;
                drawHeight = 120;
                yOffset = 92;
                break;
            case 'tank':
                drawWidth = 86;
                drawHeight = 86;
                yOffset = 66;
                break;
            case 'fast':
                drawWidth = 60;
                drawHeight = 60;
                yOffset = 46;
                break;
            default:
                drawWidth = 70;
                drawHeight = 70;
                yOffset = 54;
                break;
        }

        ctx.drawImage(
            img,
            -drawWidth / 2,
            -yOffset,
            drawWidth,
            drawHeight
        );
    } else {
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = this.type === 'boss' ? 25 : 15;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // Brief colored contour communicates an actual hit, not an idle pulse.
    if (this.hitFlashFrames > 0 && this.deathTimer <= 0) {
        ctx.save();
        ctx.globalAlpha = this.hitFlashFrames / 7;
        ctx.strokeStyle = '#fff0bb';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#ffd28c';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(0, -this.radius * .3, this.radius * 1.05, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    if (this.type === 'boss' || (this.type === 'tank' && this.maxHealth > 3)) {
        const barWidth = this.type === 'boss' ? 64 : 50;
        const barHeight = 6;
        const healthPercent = this.health / this.maxHealth;
        const barY = this.type === 'boss' ? -78 : -52;

        ctx.globalAlpha = 1;
        ctx.fillStyle = '#333333';
        ctx.fillRect(-barWidth / 2, barY, barWidth, barHeight);

        ctx.fillStyle =
            healthPercent > 0.6 ? '#00ff00' :
            healthPercent > 0.3 ? '#ffff00' :
            '#ff0000';
        ctx.fillRect(-barWidth / 2, barY, barWidth * healthPercent, barHeight);

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(-barWidth / 2, barY, barWidth, barHeight);
    }

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.restore();
}
}
