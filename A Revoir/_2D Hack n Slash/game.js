let hitStopFrames = 0;

function triggerHitStop(frames = 4) {
    hitStopFrames = Math.max(hitStopFrames, frames);
}


class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    add(v) {
        return new Vector(this.x + v.x, this.y + v.y);
    }
    sub(v) {
        return new Vector(this.x - v.x, this.y - v.y);
    }
    mul(s) {
        return new Vector(this.x * s, this.y * s);
    }
    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    normalize() {
        const len = this.length();
        return len > 0 ? this.mul(1 / len) : new Vector(0, 0);
    }
    distance(v) {
        return this.sub(v).length();
    }
    dot(v) {
        return this.x * v.x + this.y * v.y;
    }
}

class Player {
    constructor(x, y) {
        this.pos = new Vector(x, y);
        this.size = 32;
        this.speed = 4.5;
        this.radius = this.size / 2;
        this.health = 5;
        this.maxHealth = 5;
        this.facing = new Vector(1, 0);
        this.lastDir = new Vector(1, 0);
        this.attacking = false;
        this.attackTimer = 0;
        this.attackDuration = 8;
        this.attackCenterOffset = 38;
        this.attackRadius = 48;
        
        // Progression
        this.experience = 0;
        this.level = 1;
        this.experienceToNextLevel = 100;
        this.combo = 0;
        this.comboTimer = 0;
        this.comboMaxTime = 90;
        this.specialCharge = 0;
        this.specialMax = 100;
        this.invincible = false;
        this.invincibleTimer = 0;
        this.dashCooldown = 0;
        this.dashMaxCooldown = 60;
        this.dashing = false;
        this.dashTimer = 0;
        this.dashDuration = 10;
        this.dashSpeed = 12;
        this.killCount = 0;
		
		// === WEAPON SYSTEM ===
        this.currentWeapon = 'sword';
        this.weapons = {
            sword: {
                name: 'Épée',
                offset: 38,
                radius: 48,
                duration: 8,
                color: '#ffffff',
                trailColor: '#aaaaff',
                special: 'slash'  // Large circular AoE
            },
            axe: {
                name: 'Hache',
                offset: 35,
                radius: 40,
                duration: 12,
                color: '#ff8800',
                trailColor: '#ffaa66',
                special: 'cleave' // Smaller radius, higher damage
            },
            lance: {
                name: 'Lance',
                offset: 50,
                radius: 75,
                duration: 6,
                color: '#00ff88',
                trailColor: '#88ffcc',
                special: 'thrust' // Long piercing line
            },
            staff: {
                name: 'Bâton',
                offset: 40,
                radius: 30, // Small melee (for visuals)
                duration: 10,
                color: '#ff00ff',
                trailColor: '#ff88ff',
                special: 'star'   // 360° projectile burst
            }
        };
    }

    update(keys) {
        let dir = new Vector(0, 0);
        if (keys['ArrowLeft'] || keys['KeyA']) dir.x -= 1;
        if (keys['ArrowRight'] || keys['KeyD']) dir.x += 1;
        if (keys['ArrowUp'] || keys['KeyW']) dir.y -= 1;
        if (keys['ArrowDown'] || keys['KeyS']) dir.y += 1;

        // Dash
        if ((keys['ShiftLeft'] || keys['KeyL']) && this.dashCooldown <= 0 && dir.length() > 0) {
            this.dashing = true;
            this.dashTimer = this.dashDuration;
            this.dashCooldown = this.dashMaxCooldown;
            this.invincible = true;
            this.invincibleTimer = this.dashDuration;
        }

        if (this.dashing && this.dashTimer > 0) {
            // Pendant le dash
            dir = this.lastDir;
            this.speed = this.dashSpeed;
            this.dashTimer--;
            
            // Effet visuel de dash
            for (let i = 0; i < 2; i++) {
                particles.push(new Particle(
                    this.pos.x - this.lastDir.x * 20,
                    this.pos.y - this.lastDir.y * 20,
                    -this.lastDir.x * 3 + (Math.random() - 0.5) * 2,
                    -this.lastDir.y * 3 + (Math.random() - 0.5) * 2,
                    '#00ffff',
                    4,
                    0.8,
                    0.1
                ));
            }
            
            if (this.dashTimer <= 0) {
                this.dashing = false;
                this.speed = 4.5;
            }
        } else {
            this.speed = 4.5;
        }

        if (dir.length() > 0) {
            this.lastDir = dir.normalize();
            if (!this.dashing) {
                this.facing = this.lastDir;
            }
        }

        this.pos = this.pos.add(dir.normalize().mul(this.speed));

        // Bordures avec rebond pendant le dash
        if (this.dashing) {
            if (this.pos.x < this.radius) {
                this.pos.x = this.radius;
                this.lastDir.x = Math.abs(this.lastDir.x);
            }
            if (this.pos.x > canvas.width - this.radius) {
                this.pos.x = canvas.width - this.radius;
                this.lastDir.x = -Math.abs(this.lastDir.x);
            }
            if (this.pos.y < this.radius) {
                this.pos.y = this.radius;
                this.lastDir.y = Math.abs(this.lastDir.y);
            }
            if (this.pos.y > canvas.height - this.radius) {
                this.pos.y = canvas.height - this.radius;
                this.lastDir.y = -Math.abs(this.lastDir.y);
            }
        } else {
            this.pos.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.pos.x));
            this.pos.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.pos.y));
        }
		
		// === WEAPON SWITCHING ===
        if (keys['Digit1']) this.currentWeapon = 'sword';
        if (keys['Digit2']) this.currentWeapon = 'axe';
        if (keys['Digit3']) this.currentWeapon = 'lance';
        if (keys['Digit4']) this.currentWeapon = 'staff';

        const weapon = this.weapons[this.currentWeapon];
        this.attackCenterOffset = weapon.offset;
        this.attackRadius = weapon.radius;
        this.attackDuration = weapon.duration;

        // === ATTACK ===
        if (keys['Space'] || keys['KeyJ']) {
            if (!this.attacking && this.attackTimer <= 0) {
                this.attacking = true;
                this.attackTimer = this.attackDuration;

                // Staff shoots projectile instead of melee
                if (this.currentWeapon === 'staff') {
                    projectiles.push(new Projectile(
                        this.pos.x + this.facing.x * 30,
                        this.pos.y + this.facing.y * 30,
                        this.facing.x * 10,
                        this.facing.y * 10,
                        weapon.color,
                        8
                    ));
                }
            }
        }
        
        // Attaque spéciale
        if ((keys['KeyK'] || keys['KeyE']) && this.specialCharge >= this.specialMax) {
            this.useSpecial();
        }

        // Timers
        if (this.attackTimer > 0) {
            this.attackTimer--;
            if (this.attackTimer <= 0) this.attacking = false;
        }
        
        if (this.invincibleTimer > 0) {
            this.invincibleTimer--;
            this.invincible = this.invincibleTimer > 0;
        }
        
        if (this.dashCooldown > 0) {
            this.dashCooldown--;
        }
        
        // Combo timer
        if (this.combo > 0) {
            this.comboTimer--;
            if (this.comboTimer <= 0) {
                this.combo = 0;
            }
        }
        
        // Recharge spéciale passive
        if (this.specialCharge < this.specialMax) {
            this.specialCharge += 0.15 + (this.combo * 0.02);
        }
    }

    getAttackCenter() {
        return this.pos.add(this.facing.mul(this.attackCenterOffset));
    }

useSpecial() {
    this.specialCharge = 0;
    const weapon = this.weapons[this.currentWeapon];
    const baseRadius = 150 + (this.level * 10);

    switch (weapon.special) {
        case 'slash': // Épée – grand cercle
            enemies.forEach(enemy => {
                if (enemy.pos.distance(this.pos) < baseRadius) {
                    const damage = 3 + Math.floor(this.level / 2);
                    if (enemy.takeDamage(damage)) {
                        this.onEnemyKilled(enemy);
                    } else {
                        createDamageNumber(enemy.pos.x, enemy.pos.y, damage, weapon.color);
                    }
                }
            });
            createShockwave(this.pos.x, this.pos.y, baseRadius, weapon.color);
            break;

        case 'cleave': // Hache – cercle plus petit, dégâts élevés
            const cleaveRadius = baseRadius * 0.7;
            enemies.forEach(enemy => {
                if (enemy.pos.distance(this.pos) < cleaveRadius) {
                    const damage = 6 + Math.floor(this.level / 2);
                    if (enemy.takeDamage(damage)) {
                        this.onEnemyKilled(enemy);
                    } else {
                        createDamageNumber(enemy.pos.x, enemy.pos.y, damage, weapon.color);
                    }
                }
            });
            createShockwave(this.pos.x, this.pos.y, cleaveRadius, weapon.color);
            break;

        case 'thrust': // Lance – ligne longue
            const thrustLength = 350;
            const thrustWidth = 30;
            enemies.forEach(enemy => {
                const toEnemy = enemy.pos.sub(this.pos);
                const proj = toEnemy.dot(this.facing);
                if (proj > 0 && proj < thrustLength) {
                    const perp = toEnemy.sub(this.facing.mul(proj)).length();
                    if (perp < thrustWidth) {
                        const damage = 4 + Math.floor(this.level / 2);
                        if (enemy.takeDamage(damage)) {
                            this.onEnemyKilled(enemy);
                        } else {
                            createDamageNumber(enemy.pos.x, enemy.pos.y, damage, weapon.color);
                        }
                    }
                }
            });
            // Effet visuel de la lance
            for (let i = 0; i < 20; i++) {
                const t = i / 19;
                particles.push(new Particle(
                    this.pos.x + this.facing.x * (30 + t * thrustLength),
                    this.pos.y + this.facing.y * (30 + t * thrustLength),
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2,
                    weapon.color,
                    4,
                    0.6,
                    0.05
                ));
            }
            createShockwave(this.pos.x, this.pos.y, 30, weapon.color);
            break;

        case 'star': // Bâton – rafale de projectiles
            for (let i = 0; i < 24; i++) {
                const angle = (i / 24) * Math.PI * 2;
                const vx = Math.cos(angle) * 7;
                const vy = Math.sin(angle) * 7;
                projectiles.push(new Projectile(
                    this.pos.x,
                    this.pos.y,
                    vx,
                    vy,
                    weapon.color,
                    6
                ));
            }
            break;
    }

    // Particules d’effet commun
    for (let i = 0; i < 36; i++) {
        const angle = (i * Math.PI * 2) / 36;
        particles.push(new Particle(
            this.pos.x,
            this.pos.y,
            Math.cos(angle) * 8,
            Math.sin(angle) * 8,
            i % 2 === 0 ? weapon.color : '#ffffff',
            6,
            1.2,
            0.03
        ));
    }
}

    takeDamage(amount) {
        if (this.invincible) return false;
        
        this.health -= amount;
        this.invincible = true;
        this.invincibleTimer = 45;
        this.combo = 0; // Reset combo
        
        // Effet visuel de dégâts
        for (let i = 0; i < 8; i++) {
            particles.push(new Particle(
                this.pos.x,
                this.pos.y,
                (Math.random() - 0.5) * 6,
                (Math.random() - 0.5) * 6,
                '#ff0000',
                3,
                0.8,
                0.1
            ));
        }
        
        if (this.health <= 0) {
            return true;
        }
        return false;
    }

    onEnemyKilled(enemy) {
        this.killCount++;
        
        // Score et combo
        const baseScore = enemy.type === 'boss' ? 500 : enemy.type === 'tank' ? 50 : enemy.type === 'fast' ? 30 : 15;
        const comboMultiplier = 1 + (this.combo * 0.15);
        const scoreGain = Math.floor(baseScore * level * comboMultiplier);
        score += scoreGain;
        
        this.combo++;
        this.comboTimer = this.comboMaxTime;
        
        // Expérience
        const expGain = enemy.type === 'boss' ? 60 : enemy.type === 'tank' ? 15 : enemy.type === 'fast' ? 10 : 6;
        this.addExperience(expGain);
        
        // Recharge spéciale
        this.specialCharge += enemy.type === 'boss' ? 40 : 8;
        
        // Effets visuels
        createExplosion(enemy.pos.x, enemy.pos.y, enemy.type === 'boss' ? '#ff0000' : '#ffaa00', 
                       enemy.type === 'boss' ? 50 : 15);
        createScorePopup(enemy.pos.x, enemy.pos.y, scoreGain);
        
        // Chances de pickup augmentent avec le combo
        let pickupChance = 0.15 + (this.combo * 0.02);
        if (enemy.type === 'boss') pickupChance = 1;
        
        if (Math.random() < pickupChance) {
            let pickupType = 'health';
            const rand = Math.random();
            
            if (rand < 0.3) {
                pickupType = 'experience';
            } else if (rand < 0.15) {
                pickupType = 'special';
            } else if (rand < 0.05 && this.level >= 3) {
                pickupType = 'speed';
            }
            
            pickups.push(new Pickup(enemy.pos.x, enemy.pos.y, pickupType));
        }
    }

    addExperience(amount) {
        const oldLevel = this.level;
        this.experience += amount;
        
        while (this.experience >= this.experienceToNextLevel) {
            this.levelUp();
        }
        
        // Afficher le gain d'expérience
        if (amount > 0) {
            createExperiencePopup(this.pos.x, this.pos.y - 30, `+${amount} XP`);
        }
    }

    levelUp() {
        this.level++;
        this.experience -= this.experienceToNextLevel;
        this.experienceToNextLevel = Math.floor(this.experienceToNextLevel * 1.4);
        
        // Améliorations aléatoires
        const upgrades = ['health', 'damage', 'speed', 'attackSpeed'];
        const chosenUpgrade = upgrades[Math.floor(Math.random() * upgrades.length)];
        
        switch(chosenUpgrade) {
            case 'health':
                this.maxHealth += 1;
                this.health = this.maxHealth;
                break;
            case 'damage':
                // Géré dans les dégâts d'attaque
                break;
            case 'speed':
                this.speed += 0.4;
                break;
            case 'attackSpeed':
                this.attackDuration = Math.max(5, this.attackDuration - 1);
                break;
        }
        
        createLevelUpEffect(this.pos.x, this.pos.y, chosenUpgrade);
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);
        const angle = Math.atan2(this.facing.y, this.facing.x);
        ctx.rotate(angle);

        // Invincibilité clignotante
        if (this.invincible && Math.floor(this.invincibleTimer / 3) % 2 === 0) {
            ctx.globalAlpha = 0.4;
        }

        // Effet de dash
        if (this.dashing) {
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 30;
            ctx.globalAlpha = 0.7;
        }

        // Dessin du sprite (crop une frame simple du sheet, assumant taille 200x200 pour exemple)
        if (playerImg.complete) {
            // Crop : position (0,0) du sheet, taille 200x200, scale à 32x32
            ctx.drawImage(playerImg, 0, 0, 200, 200, -16, -16, 32, 32);
        } else {
            // Fallback procédural si image pas chargée
            ctx.fillStyle = '#4488ff';
            ctx.fillRect(-14, -14, 28, 28);
        }
		
		const weapon = this.weapons[this.currentWeapon];

        // Épée (gardée procédurale pour l'attaque)
        if (this.attacking) {
            const swordColor = this.combo > 15 ? '#ff5500' : this.combo > 8 ? '#ffff00' : '#ffffff';
            const swordWidth = this.combo > 15 ? 10 : this.combo > 8 ? 8 : 6;
            const swordLength = 52 + (this.combo * 0.5);
            
            ctx.shadowColor = swordColor;
            ctx.shadowBlur = 25;
            ctx.strokeStyle = swordColor;
            ctx.lineWidth = swordWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(16, -swordWidth/2);
            ctx.lineTo(swordLength, -swordWidth/2);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // Aura pour haut combo
        if (this.combo > 10) {
            const auraSize = 25 + (this.combo * 0.5);
            ctx.shadowColor = '#4488ff'; // Adapté au sprite
            ctx.shadowBlur = 30;
            ctx.strokeStyle = `rgba(255, 200, 50, ${0.2 + (this.combo * 0.02)})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, auraSize, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        ctx.restore();
		
		// Weapon name
        ctx.save();
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = weapon.color;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.textAlign = 'center';
        ctx.strokeText(weapon.name, this.pos.x, this.pos.y - 70);
        ctx.fillText(weapon.name, this.pos.x, this.pos.y - 70);
        ctx.restore();
        
        // Barre de spéciale
        if (this.specialCharge > 0) {
            drawSpecialBar(this.pos.x, this.pos.y - 40, this.specialCharge, this.specialMax);
        }
        
        // Indicateur de dash
        if (this.dashCooldown > 0) {
            drawDashIndicator(this.pos.x, this.pos.y - 55, this.dashCooldown, this.dashMaxCooldown);
        }
    }
}

// Projectile class
class Projectile {
    constructor(x, y, vx, vy, color, radius = 8) {
        this.pos = new Vector(x, y);
        this.vel = new Vector(vx, vy);
        this.color = color;
        this.radius = radius;
        this.life = 90;
    }
    update() {
        this.pos = this.pos.add(this.vel);
        this.life--;
        return this.life > 0 && this.pos.x > -50 && this.pos.x < canvas.width + 50 && this.pos.y > -50 && this.pos.y < canvas.height + 50;
    }
    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

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

        if (this.deathTimer > 0) {
            ctx.globalAlpha = this.deathTimer / 30;
            ctx.rotate(this.deathTimer * 0.1); // Rotation pendant la mort
        } else {
            // Pulse basé sur la santé
            const pulse = 0.8 + 0.2 * Math.sin(Date.now() * 0.005);
            ctx.globalAlpha = 0.7 + 0.3 * (this.health / this.maxHealth) * pulse;
        }

        // Dessin du sprite (adapté au type)
        let img = null;
        let frameWidth = 200; // Exemple de taille de frame pour sheets
        let frameHeight = 200;
        switch(this.type) {
            case 'boss':
                img = enemyBossImg;
                frameWidth = 700; // Image complète car pas sheet
                frameHeight = 400;
                break;
            case 'tank':
                img = enemyTankImg;
                frameWidth = 720;
                frameHeight = 480;
                break;
            case 'fast':
                img = enemyFastImg;
                frameWidth = 1800;
                frameHeight = 1200;
                break;
            default:
                img = enemyNormalImg;
                frameWidth = 1800;
                frameHeight = 1200;
                break;
        }

        if (img && img.complete) {
            // Dessiner l'image scalée à la taille de l'ennemi (crop si sheet, ici image complète scalée)
            ctx.drawImage(img, 0, 0, frameWidth, frameHeight, -this.radius, -this.radius, this.size, this.size);
        } else {
            // Fallback procédural
            ctx.fillStyle = this.color;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = this.type === 'boss' ? 25 : 15;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Barre de vie
        if (this.type === 'boss' || (this.type === 'tank' && this.maxHealth > 3)) {
            const barWidth = 50;
            const barHeight = 6;
            const healthPercent = this.health / this.maxHealth;
            
            ctx.globalAlpha = 1;
            ctx.fillStyle = '#333333';
            ctx.fillRect(-barWidth/2, -this.radius - 20, barWidth, barHeight);
            ctx.fillStyle = healthPercent > 0.6 ? '#00ff00' : healthPercent > 0.3 ? '#ffff00' : '#ff0000';
            ctx.fillRect(-barWidth/2, -this.radius - 20, barWidth * healthPercent, barHeight);
            
            // Bordure
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.strokeRect(-barWidth/2, -this.radius - 20, barWidth, barHeight);
        }

        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        ctx.restore();
    }
}

class Particle {
    constructor(x, y, vx, vy, color, size, life = 1, decay = 0.04) {
        this.pos = new Vector(x, y);
        this.vel = new Vector(vx, vy);
        this.life = life;
        this.decay = decay;
        this.color = color;
        this.size = size;
        this.initialSize = size;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
    }

    update() {
        this.pos = this.pos.add(this.vel);
        this.vel = this.vel.mul(0.96);
        this.life -= this.decay;
        this.size = this.initialSize * this.life;
        this.rotation += this.rotationSpeed;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.translate(this.pos.x, this.pos.y);
        ctx.rotate(this.rotation);
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        
        if (this.size > 3) {
            // Forme plus intéressante pour les grosses particules
            ctx.beginPath();
            ctx.moveTo(this.size/2, 0);
            for (let i = 1; i < 5; i++) {
                const angle = (i * Math.PI * 2) / 5;
                const radius = this.size/2 * (i % 2 === 0 ? 0.7 : 1);
                ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
            }
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
        }
        
        ctx.shadowBlur = 0;
        ctx.restore();
    }
}

class Pickup {
    constructor(x, y, type = 'health') {
        this.pos = new Vector(x, y);
        this.size = 20;
        this.radius = 10;
        this.type = type;
        this.floatOffset = Math.random() * Math.PI * 2;
        this.rotation = 0;
        this.collected = false;
        this.collectTimer = 0;
    }

    update() {
        this.floatOffset += 0.05;
        this.rotation += 0.03;
        
        if (this.collected) {
            this.collectTimer++;
            this.pos.y -= 2;
            if (this.collectTimer > 30) {
                return false;
            }
        }
        return true;
    }

    draw(ctx) {
        ctx.save();
        const floatY = Math.sin(this.floatOffset) * 5;
        ctx.translate(this.pos.x, this.pos.y + floatY);
        ctx.rotate(this.rotation);
        
        let color, symbol, glowColor;
        switch(this.type) {
            case 'health':
                color = '#ff4444';
                glowColor = '#ff0000';
                symbol = '❤️';
                break;
            case 'experience':
                color = '#ffdd00';
                glowColor = '#ffaa00';
                symbol = '⭐';
                break;
            case 'special':
                color = '#aa00ff';
                glowColor = '#ff00ff';
                symbol = '⚡';
                break;
            case 'speed':
                color = '#00aaff';
                glowColor = '#00ffff';
                symbol = '⚡';
                break;
        }
        
        if (this.collected) {
            ctx.globalAlpha = 1 - (this.collectTimer / 30);
        }
        
        // Glow
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 20;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Symbole
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(symbol, 0, 0);
        
        // Bordure
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.restore();
    }
}

// Fonctions d'effets visuels
function createExplosion(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8 + 2;
        const size = Math.random() * 6 + 2;
        particles.push(new Particle(
            x, y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            color,
            size,
            Math.random() * 0.5 + 0.5,
            0.03
        ));
    }
}

function createShockwave(x, y, radius, color = '#ff00ff') {
    shockwaves.push({
        x, y,
        radius: 0,
        maxRadius: radius,
        life: 1,
        color: color
    });
}

function createLevelUpEffect(x, y, upgradeType) {
    let color;
    switch(upgradeType) {
        case 'health': color = '#ff4444'; break;
        case 'damage': color = '#ffff00'; break;
        case 'speed': color = '#00ffff'; break;
        case 'attackSpeed': color = '#ff8800'; break;
        default: color = '#ffffff';
    }
    
    for (let i = 0; i < 24; i++) {
        const angle = (i * Math.PI * 2) / 24;
        const speed = 4;
        particles.push(new Particle(
            x, y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            color,
            6,
            1.5,
            0.02
        ));
    }
    
    // Message de niveau
    levelUpMessages.push({
        x: x,
        y: y,
        text: `LEVEL UP!`,
        subtext: `${upgradeType.toUpperCase()}`,
        timer: 120,
        color: color
    });
}

function createDamageNumber(x, y, damage, color) {
    damageNumbers.push({
        x: x,
        y: y,
        value: damage,
        timer: 60,
        color: color,
        velocity: new Vector(0, -2)
    });
}

function createScorePopup(x, y, score) {
    scorePopups.push({
        x: x,
        y: y,
        value: `+${score}`,
        timer: 90,
        color: '#ffff00'
    });
}

function createExperiencePopup(x, y, text) {
    experiencePopups.push({
        x: x,
        y: y,
        text: text,
        timer: 90,
        color: '#00ffff'
    });
}

function drawSpecialBar(x, y, current, max) {
    ctx.save();
    const width = 40;
    const height = 8;
    const percent = current / max;
    
    ctx.fillStyle = '#333333';
    ctx.fillRect(x - width/2, y - height/2, width, height);
    
    // Dégradé pour la barre
    const gradient = ctx.createLinearGradient(x - width/2, y, x - width/2 + width * percent, y);
    gradient.addColorStop(0, '#ff00ff');
    gradient.addColorStop(1, '#00ffff');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - width/2, y - height/2, width * percent, height);
    
    if (percent >= 1) {
        ctx.shadowColor = '#ff00ff';
        ctx.shadowBlur = 15;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - width/2, y - height/2, width, height);
        ctx.shadowBlur = 0;
    }
    
    // Texte "SPECIAL"
    if (percent >= 1) {
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('SPECIAL', x, y);
    }
    
    ctx.restore();
}

function drawDashIndicator(x, y, current, max) {
    ctx.save();
    const size = 20;
    const percent = 1 - (current / max);
    
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, size/2, 0, Math.PI * 2 * percent);
    ctx.stroke();
    
    // Icône de dash
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = '#00ffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚡', x, y);
    
    ctx.restore();
}

function drawComboCounter() {
    if (player.combo > 0) {
        ctx.save();
        
        // Fond
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(canvas.width/2 - 150, 20, 300, 60);
        
        // Texte combo
        const comboSize = 40 + player.combo;
        ctx.font = `bold ${comboSize}px Arial`;
        
        // Dégradé de couleur
        const gradient = ctx.createLinearGradient(canvas.width/2 - 100, 40, canvas.width/2 + 100, 40);
        if (player.combo > 20) {
            gradient.addColorStop(0, '#ff0000');
            gradient.addColorStop(0.5, '#ffff00');
            gradient.addColorStop(1, '#ff0000');
        } else if (player.combo > 10) {
            gradient.addColorStop(0, '#ffff00');
            gradient.addColorStop(1, '#ff8800');
        } else {
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(1, '#ffff00');
        }
        
        ctx.fillStyle = gradient;
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 10;
        ctx.fillText(`COMBO x${player.combo}`, canvas.width / 2, 60);
        
        // Multiplicateur
        const multiplier = 1 + (player.combo * 0.15);
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#00ffff';
        ctx.fillText(`${multiplier.toFixed(1)}x MULTIPLIER`, canvas.width / 2, 85);
        
        // Barre de temps combo
        const barWidth = 250;
        const barHeight = 6;
        const percent = player.comboTimer / player.comboMaxTime;
        
        ctx.fillStyle = '#333333';
        ctx.fillRect(canvas.width/2 - barWidth/2, 95, barWidth, barHeight);
        
        const barGradient = ctx.createLinearGradient(canvas.width/2 - barWidth/2, 95, canvas.width/2 - barWidth/2 + barWidth * percent, 95);
        barGradient.addColorStop(0, percent > 0.6 ? '#00ff00' : percent > 0.3 ? '#ffff00' : '#ff0000');
        barGradient.addColorStop(1, percent > 0.6 ? '#00aa00' : percent > 0.3 ? '#aaaa00' : '#aa0000');
        
        ctx.fillStyle = barGradient;
        ctx.fillRect(canvas.width/2 - barWidth/2, 95, barWidth * percent, barHeight);
        
        ctx.shadowBlur = 0;
        ctx.restore();
    }
}

// Initialisation
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const gameContainer = document.getElementById('gameContainer');

// Chargement des sprites
const playerImg = new Image();
playerImg.src = 'https://s3.amazonaws.com/gameartpartnersimagehost/wp-content/uploads/2018/11/White-Knight-Sprite.jpg';

const enemyNormalImg = new Image();
enemyNormalImg.src = 'https://img.craftpix.net/2025/01/Beholder-Monsters-Top-Down-Pixel-Art-Sprites.webp';

const enemyFastImg = new Image();
enemyFastImg.src = 'https://img.craftpix.net/2025/09/Free-Top-Down-Goblin-Character-Sprite4.png';

const enemyTankImg = new Image();
enemyTankImg.src = 'https://img.craftpix.net/2024/11/Golem-Pixel-Art-Top-Down-Sprite-Pack2-720x480.webp';

const enemyBossImg = new Image();
enemyBossImg.src = 'https://cdn.gamedevmarket.net/cover-images/eHuDlcTzrSco9kv931q09eHhsb0hAPbzj9a28Uef.png';

// Attendre le chargement des images (simple, sans Promise.all pour simplicité)
let imagesLoaded = 0;
const totalImages = 5;
[playerImg, enemyNormalImg, enemyFastImg, enemyTankImg, enemyBossImg].forEach(img => {
    img.onload = () => {
        imagesLoaded++;
        if (imagesLoaded === totalImages) {
            // Jeu prêt
            console.log('Sprites chargés !');
        }
    };
});

let player;
let enemies = [];
let particles = [];
let pickups = [];
let shockwaves = [];
let damageNumbers = [];
let scorePopups = [];
let experiencePopups = [];
let levelUpMessages = [];
let keys = {};
let score = 0;
let level = 1;
let gameState = 'playing';
let enemiesToSpawn = 0;
let spawnTimer = 0;
let levelComplete = false;
let levelCompleteTimer = 0;
let gameTime = 0;

function initLevel() {
    enemiesToSpawn = calculateEnemiesForLevel();
    spawnTimer = 0;
    enemies = [];
    levelComplete = false;
    levelCompleteTimer = 0;
    updateUI();
}

function calculateEnemiesForLevel() {
    let base = 8 + level * 2;
    if (level % 5 === 0) return 1; // Un boss
    if (level % 3 === 0) base = Math.floor(base * 0.8); // Moins d'ennemis pour niveaux spéciaux
    return base;
}

function spawnEnemy() {
    let type = 'normal';
    
    if (level % 5 === 0 && enemiesToSpawn === 1) {
        type = 'boss';
    } else {
        const rand = Math.random();
        if (level > 3 && rand < 0.2) {
            type = 'fast';
        } else if (level > 6 && rand < 0.15) {
            type = 'tank';
        } else if (level > 9 && rand < 0.1) {
            type = Math.random() < 0.5 ? 'fast' : 'tank';
        }
    }
    
    enemies.push(new Enemy(level, type));
}

function updateUI() {
    document.getElementById('score').textContent = `Score: ${score}`;
    document.getElementById('level').textContent = `Niveau: ${level}`;
    
    let hearts = '';
    for (let i = 0; i < player.maxHealth; i++) {
        hearts += player.health > i ? '❤️' : '💔';
    }
    
    const expPercent = Math.min(100, (player.experience / player.experienceToNextLevel) * 100);
    document.getElementById('health').innerHTML = 
        `${hearts} <span style=\"color:#0088ff;margin-left:10px;\">Lvl ${player.level}</span>` +
        `<div style=\"width:100px;height:6px;background:#333;margin-top:5px;border-radius:3px;\">` +
        `<div style=\"width:${expPercent}%;height:100%;background:linear-gradient(90deg,#0088ff,#00ffff);border-radius:3px;\"></div></div>`;
}

function showGameOver() {
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOver').style.display = 'block';
    gameState = 'gameover';
    
    // Effets de game over
    for (let i = 0; i < 50; i++) {
        particles.push(new Particle(
            player.pos.x,
            player.pos.y,
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10,
            '#ff0000',
            Math.random() * 8 + 4,
            1.5,
            0.02
        ));
    }
}

function showWin() {
    document.getElementById('finalLevel').textContent = level;
    document.getElementById('win').style.display = 'block';
    gameState = 'won';
}

function update() {

        if (hitStopFrames > 0) {
        hitStopFrames--;
        return;
    }
    if (gameState !== 'playing') return;

    gameTime++;
    player.update(keys);
    
    // Update projectiles ennemis
    enemies.forEach(enemy => {
        enemy.projectiles = enemy.projectiles.filter(proj => {
            proj.pos = proj.pos.add(proj.vel);
            
            // Homing pour certains projectiles
            if (proj.homing) {
                const dir = player.pos.sub(proj.pos).normalize();
                proj.vel = proj.vel.add(dir.mul(0.1)).normalize().mul(4);
            }
            
            // Collision avec joueur
            if (proj.pos.distance(player.pos) < player.radius + proj.radius) {
                if (player.takeDamage(1)) {
                    showGameOver();
                }
                createExplosion(proj.pos.x, proj.pos.y, '#ff5555', 10);
                return false;
            }
            
            // Vérifier si en dehors de l'écran
            return proj.pos.x > -50 && proj.pos.x < canvas.width + 50 &&
                   proj.pos.y > -50 && proj.pos.y < canvas.height + 50;
        });
    });

    // Spawn ennemis
    if (!levelComplete) {
        spawnTimer++;
        const spawnDelay = Math.max(20, 60 - level * 6);
        if (spawnTimer > spawnDelay && enemiesToSpawn > 0) {
            spawnEnemy();
            enemiesToSpawn--;
            spawnTimer = 0;
        }
    }

    // Update ennemis et collisions
    const attackCenter = player.getAttackCenter();
    
    enemies = enemies.filter(enemy => {
        enemy.update(player);
        
        // Attaque du joueur
        if (player.attacking) {
            const dx = enemy.pos.x - attackCenter.x;
            const dy = enemy.pos.y - attackCenter.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const attackRadius = player.attackRadius + (player.combo * 0.5);
            
            if (dist < attackRadius) {
                const damage = 1 + Math.floor(player.combo / 8) + Math.floor(player.level / 5);
                if (enemy.takeDamage(damage)) {
                    player.onEnemyKilled(enemy);
                    enemy.deathTimer = 30;
                    return false;
                }
            }
        }

        // Collision joueur-ennemi
        const dx = player.pos.x - enemy.pos.x;
        const dy = player.pos.y - enemy.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < player.radius + enemy.radius) {
            if (player.takeDamage(enemy.damage)) {
                showGameOver();
                return true;
            }
            
            // Knockback
            if (!player.dashing) {
                const knockbackDir = player.pos.sub(enemy.pos).normalize();
                player.pos = player.pos.add(knockbackDir.mul(15));
            }
            
            updateUI();
        }

        return enemy.deathTimer === 0;
    });

    // Update pickups
    pickups = pickups.filter(pickup => {
        if (!pickup.update()) return false;
        
        const dist = player.pos.distance(pickup.pos);
        if (dist < player.radius + pickup.radius && !pickup.collected) {
            pickup.collected = true;
            
            switch(pickup.type) {
                case 'health':
                    player.health = Math.min(player.maxHealth, player.health + 2);
                    createExperiencePopup(pickup.pos.x, pickup.pos.y, '+2 HP');
                    break;
                case 'experience':
                    player.addExperience(50);
                    break;
                case 'special':
                    player.specialCharge = Math.min(player.specialMax, player.specialCharge + 40);
                    createExperiencePopup(pickup.pos.x, pickup.pos.y, '+40 SPECIAL');
                    break;
                case 'speed':
                    player.speed += 0.5;
                    createExperiencePopup(pickup.pos.x, pickup.pos.y, '+SPEED');
                    break;
            }
            
            createExplosion(pickup.pos.x, pickup.pos.y, '#ffffff', 12);
            updateUI();
            return false;
        }
        return true;
    });

    // Update particules
    particles = particles.filter(p => {
        p.update();
        return p.life > 0;
    });

    // Update shockwaves
    shockwaves = shockwaves.filter(sw => {
        sw.radius += 10;
        sw.life -= 0.015;
        return sw.radius < sw.maxRadius && sw.life > 0;
    });

    // Update popups
    damageNumbers = damageNumbers.filter(d => {
        d.timer--;
        d.y += d.velocity.y;
        d.velocity.y += 0.05;
        return d.timer > 0;
    });
    
    scorePopups = scorePopups.filter(s => {
        s.timer--;
        s.y -= 1;
        return s.timer > 0;
    });
    
    experiencePopups = experiencePopups.filter(e => {
        e.timer--;
        e.y -= 1;
        return e.timer > 0;
    });
    
    levelUpMessages = levelUpMessages.filter(l => {
        l.timer--;
        l.y -= 0.5;
        return l.timer > 0;
    });

    // Vérifier fin de niveau
    if (enemies.length === 0 && enemiesToSpawn === 0 && !levelComplete) {
        levelComplete = true;
        levelCompleteTimer = 180;
        
        // Récompense de fin de niveau
        score += level * 100;
        player.addExperience(level * 20);
    }
    
    if (levelComplete) {
        levelCompleteTimer--;
        if (levelCompleteTimer <= 0) {
            level++;
            if (level > 15) {
                showWin();
            } else {
                initLevel();
            }
        }
    }
}

function drawBackground() {
    // Fond dégradé animé avec parallaxe
    const time = Date.now() * 0.0005;
    
    // Couche 1: Fond profond
    const gradient1 = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient1.addColorStop(0, `hsl(${240 + Math.sin(time) * 5}, 80%, 5%)`);
    gradient1.addColorStop(1, `hsl(${240 + Math.cos(time * 0.8) * 5}, 80%, 8%)`);
    ctx.fillStyle = gradient1;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Étoiles lointaines
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    for (let i = 0; i < 100; i++) {
        const x = (i * 311) % canvas.width;
        const y = (i * 257 + time * 20) % canvas.height;
        const size = 1;
        ctx.fillRect(x, y, size, size);
    }
    
    // Étoiles proches
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let i = 0; i < 200; i++) {
        const x = (i * 137 + time * 40) % canvas.width;
        const y = (i * 113) % canvas.height;
        const size = (i % 3) + 1;
        const twinkle = Math.sin(time * 3 + i) * 0.5 + 0.5;
        ctx.globalAlpha = 0.3 + twinkle * 0.7;
        ctx.fillRect(x, y, size, size);
    }
    
    // Nébuleuse
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = `hsl(${280 + Math.sin(time * 0.3) * 30}, 70%, 50%)`;
    ctx.beginPath();
    ctx.arc(
        canvas.width * (0.3 + Math.sin(time * 0.2) * 0.1),
        canvas.height * (0.4 + Math.cos(time * 0.15) * 0.1),
        canvas.width * 0.4,
        0,
        Math.PI * 2
    );
    ctx.fill();
    
    ctx.globalAlpha = 1;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    
    // Shockwaves
    shockwaves.forEach(sw => {
        ctx.save();
        ctx.globalAlpha = sw.life * 0.7;
        ctx.strokeStyle = sw.color;
        ctx.lineWidth = 5;
        ctx.shadowColor = sw.color;
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    });

    // Pickups
    pickups.forEach(pickup => pickup.draw(ctx));

    // Ennemis
    enemies.forEach(enemy => {
        enemy.draw(ctx);
        
        // Projectiles
        enemy.projectiles.forEach(proj => {
            ctx.save();
            ctx.fillStyle = proj.color || '#ff5555';
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(proj.pos.x, proj.pos.y, proj.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Traînée
            ctx.strokeStyle = '#ff8888';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(proj.pos.x, proj.pos.y);
            ctx.lineTo(proj.pos.x - proj.vel.x * 3, proj.pos.y - proj.vel.y * 3);
            ctx.stroke();
            
            ctx.restore();
        });
    });

    // Joueur
    player.draw(ctx);

    // Zone d'attaque visuelle
    if (player.attacking) {
        const angle = Math.atan2(player.facing.y, player.facing.x);
        ctx.save();
        ctx.translate(player.pos.x, player.pos.y);
        ctx.rotate(angle);
        
        const attackLength = 55 + (player.combo * 0.8);
        const attackColor = player.combo > 15 ? '#ff5500' : player.combo > 8 ? '#ffff00' : '#ffffff';
        
        ctx.shadowColor = attackColor;
        ctx.shadowBlur = 30;
        ctx.strokeStyle = `rgba(255, 255, 200, 0.8)`;
        ctx.lineWidth = player.combo > 15 ? 12 : player.combo > 8 ? 10 : 8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(18, 0);
        ctx.lineTo(attackLength, 0);
        ctx.stroke();
        
        // Effet de vague
        ctx.lineWidth = 4;
        ctx.strokeStyle = `rgba(255, 200, 100, 0.4)`;
        ctx.beginPath();
        ctx.moveTo(15, -3);
        ctx.quadraticCurveTo(attackLength/2, -8, attackLength, -3);
        ctx.moveTo(15, 3);
        ctx.quadraticCurveTo(attackLength/2, 8, attackLength, 3);
        ctx.stroke();
        
        ctx.shadowBlur = 0;
        ctx.restore();
    }

    // Particules
    particles.forEach(particle => particle.draw(ctx));
    
    // Popups
    damageNumbers.forEach(d => {
        ctx.save();
        ctx.globalAlpha = d.timer / 60;
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = d.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 5;
        ctx.fillText(d.value.toString(), d.x, d.y);
        ctx.restore();
    });
    
    scorePopups.forEach(s => {
        ctx.save();
        ctx.globalAlpha = s.timer / 90;
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = s.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 8;
        ctx.fillText(s.value, s.x, s.y);
        ctx.restore();
    });
    
    experiencePopups.forEach(e => {
        ctx.save();
        ctx.globalAlpha = e.timer / 90;
        ctx.font = 'bold 18px Arial';
        ctx.fillStyle = e.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(e.text, e.x, e.y);
        ctx.restore();
    });
    
    levelUpMessages.forEach(l => {
        ctx.save();
        ctx.globalAlpha = l.timer / 120;
        ctx.font = 'bold 32px Arial';
        ctx.fillStyle = l.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 10;
        ctx.fillText(l.text, l.x, l.y);
        
        ctx.font = 'bold 20px Arial';
        ctx.fillText(l.subtext, l.x, l.y + 35);
        ctx.restore();
    });
    
    // Combo counter
    drawComboCounter();
    
    // Message fin de niveau
    if (levelComplete) {
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = '#000000';
        ctx.fillRect(canvas.width/2 - 200, canvas.height/2 - 60, 400, 120);
        
        ctx.globalAlpha = 1;
        ctx.font = 'bold 48px Arial';
        ctx.fillStyle = '#00ff00';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#00ff00';
        ctx.shadowBlur = 15;
        ctx.fillText('NIVEAU TERMINÉ !', canvas.width / 2, canvas.height / 2 - 20);
        
        ctx.font = '24px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 5;
        ctx.fillText(`Préparez-vous pour le niveau ${level + 1}`, canvas.width / 2, canvas.height / 2 + 30);
        
        if (levelCompleteTimer < 60) {
            ctx.fillText(`Début dans ${Math.ceil(levelCompleteTimer/60)}`, canvas.width / 2, canvas.height / 2 + 60);
        }
        
        ctx.shadowBlur = 0;
        ctx.restore();
    }
    
    // Stats en bas
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(10, canvas.height - 90, 250, 80);
    
    ctx.font = '14px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(`Ennemis tués: ${player.killCount}`, 20, canvas.height - 70);
    ctx.fillText(`Combo max: ${player.combo}`, 20, canvas.height - 50);
    ctx.fillText(`Temps: ${Math.floor(gameTime/60)}s`, 20, canvas.height - 30);
    
    ctx.fillText(`Vitesse: ${player.speed.toFixed(1)}`, 150, canvas.height - 70);
    ctx.fillText(`Niveau: ${player.level}`, 150, canvas.height - 50);
    ctx.fillText(`Spécial: ${Math.floor(player.specialCharge)}%`, 150, canvas.height - 30);
    ctx.restore();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Contrôles
document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    const preventKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 
                        'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 
                        'KeyJ', 'KeyK', 'KeyE', 'ShiftLeft', 'KeyL'];
    if (preventKeys.includes(e.code)) {
        e.preventDefault();
    }
});
document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// Contrôles tactiles pour mobile
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    touchStartX = touch.clientX - rect.left;
    touchStartY = touch.clientY - rect.top;
    
    // Zone gauche = déplacement, droite = attaque
    if (touchStartX < canvas.width / 2) {
        // Déplacement
        const dir = new Vector(touchStartX - player.pos.x, touchStartY - player.pos.y).normalize();
        keys['ArrowRight'] = dir.x > 0.3;
        keys['ArrowLeft'] = dir.x < -0.3;
        keys['ArrowDown'] = dir.y > 0.3;
        keys['ArrowUp'] = dir.y < -0.3;
    } else {
        // Attaque ou dash
        if (touchStartY < canvas.height / 2) {
            keys['Space'] = true; // Attaque
        } else {
            keys['ShiftLeft'] = true; // Dash
        }
    }
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (e.touches[0]) {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        // Mettre à jour le déplacement si on touche la zone gauche
        if (x < canvas.width / 2) {
            const dir = new Vector(x - player.pos.x, y - player.pos.y).normalize();
            keys['ArrowRight'] = dir.x > 0.3;
            keys['ArrowLeft'] = dir.x < -0.3;
            keys['ArrowDown'] = dir.y > 0.3;
            keys['ArrowUp'] = dir.y < -0.3;
        }
    }
});

canvas.addEventListener('touchend', (e) => {
    keys['Space'] = false;
    keys['ShiftLeft'] = false;
    keys['ArrowRight'] = false;
    keys['ArrowLeft'] = false;
    keys['ArrowDown'] = false;
    keys['ArrowUp'] = false;
});

function resetGame() {
    player = new Player(canvas.width / 2, canvas.height / 2);
    enemies = [];
    particles = [];
    pickups = [];
    shockwaves = [];
    damageNumbers = [];
    scorePopups = [];
    experiencePopups = [];
    levelUpMessages = [];
    score = 0;
    level = 1;
    gameState = 'playing';
    gameTime = 0;
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('win').style.display = 'none';
    initLevel();
    updateUI();
}

window.resetGame = resetGame;

// Instructions au démarrage
setTimeout(() => {
    experiencePopups.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        text: 'Utilisez ZQSD/FLÈCHES pour vous déplacer',
        timer: 180,
        color: '#ffffff'
    });
    
    setTimeout(() => {
        experiencePopups.push({
            x: canvas.width / 2,
            y: canvas.height / 2 + 40,
            text: 'ESPACE/J pour attaquer • E/K pour attaque spéciale',
            timer: 180,
            color: '#ffff00'
        });
        
        setTimeout(() => {
            experiencePopups.push({
                x: canvas.width / 2,
                y: canvas.height / 2 + 80,
                text: 'MAJ/L pour dash • Enchaînez les kills pour des combos !',
                timer: 180,
                color: '#00ffff'
            });
        }, 1000);
    }, 1000);
}, 500);

// Démarrage
resetGame();
gameLoop();