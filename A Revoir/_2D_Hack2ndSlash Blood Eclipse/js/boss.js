// Système de Boss pour Blood Eclipse

// Configuration des boss (à ajouter dans config.js si pas présent)
if (!CONFIG.BOSS) {
    CONFIG.BOSS = {
        SPAWN_EVERY_KILLS: 20, // Un boss tous les 20 kills
        WARNING_DURATION: 3000, // 3 secondes d'avertissement
        
        TYPES: {
            DEMON_LORD: {
                name: 'Seigneur Démon',
                size: 60,
                hp: 500,
                damage: 25,
                speed: 1.5,
                color: '#8b0000',
                scoreReward: 2000,
                xpReward: 150,
                abilities: ['charge', 'summon']
            },
            SHADOW_BEAST: {
                name: 'Bête des Ombres',
                size: 50,
                hp: 350,
                damage: 20,
                speed: 2.5,
                color: '#2f0033',
                scoreReward: 1500,
                xpReward: 120,
                abilities: ['dash', 'clone']
            },
            BLOOD_TITAN: {
                name: 'Titan de Sang',
                size: 80,
                hp: 800,
                damage: 35,
                speed: 1,
                color: '#660000',
                scoreReward: 3000,
                xpReward: 200,
                abilities: ['stomp', 'rage']
            },
            NIGHTMARE: {
                name: 'Cauchemar',
                size: 55,
                hp: 400,
                damage: 15,
                speed: 2,
                color: '#4b0082',
                scoreReward: 1800,
                xpReward: 130,
                abilities: ['teleport', 'fear']
            }
        }
    };
}

// Classe Boss
class Boss extends Entity {
    constructor(x, y, type) {
        const config = CONFIG.BOSS.TYPES[type];
        super(x, y, config.size, config.color);
        
        this.type = type;
        this.name = config.name;
        this.maxHp = config.hp;
        this.hp = this.maxHp;
        this.damage = config.damage;
        this.speed = config.speed;
        this.scoreReward = config.scoreReward;
        this.xpReward = config.xpReward;
        this.abilities = config.abilities;
        
        // États
        this.state = 'chase'; // chase, ability, stunned
        this.stateTimer = 0;
        this.abilityTimer = 0;
        this.abilityCooldown = 5000; // 5 secondes entre les attaques spéciales
        this.currentAbility = null;
        
        // Pour les clones (Shadow Beast)
        this.isClone = false;
        this.clones = [];
        
        // Animation
        this.pulsePhase = 0;
        this.hitFlash = 0;
        
        // Rage mode (Blood Titan)
        this.enraged = false;
    }
    
    update(playerX, playerY, deltaTime, game) {
        this.pulsePhase += deltaTime * 0.003;
        
        if (this.hitFlash > 0) {
            this.hitFlash -= deltaTime;
        }
        
        // Vérifier le mode rage (Blood Titan à 30% HP)
        if (this.type === 'BLOOD_TITAN' && !this.enraged && this.hp < this.maxHp * 0.3) {
            this.enraged = true;
            this.speed *= 1.5;
            this.damage *= 1.3;
        }
        
        // Mise à jour du cooldown d'abilité
        this.abilityTimer += deltaTime;
        
        switch(this.state) {
            case 'chase':
                this.chase(playerX, playerY, deltaTime);
                
                // Déclencher une abilité
                if (this.abilityTimer >= this.abilityCooldown) {
                    this.triggerAbility(playerX, playerY, game);
                }
                break;
                
            case 'ability':
                this.executeAbility(playerX, playerY, deltaTime, game);
                break;
                
            case 'stunned':
                this.stateTimer -= deltaTime;
                if (this.stateTimer <= 0) {
                    this.state = 'chase';
                }
                break;
        }
        
        // Mise à jour des clones
        this.clones = this.clones.filter(clone => clone.hp > 0);
        this.clones.forEach(clone => clone.update(playerX, playerY, deltaTime, game));
    }
    
    chase(playerX, playerY, deltaTime) {
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
            const speed = this.speed * (deltaTime / 16);
            this.x += (dx / dist) * speed;
            this.y += (dy / dist) * speed;
        }
    }
    
    triggerAbility(playerX, playerY, game) {
        const ability = this.abilities[Math.floor(Math.random() * this.abilities.length)];
        this.currentAbility = ability;
        this.state = 'ability';
        this.stateTimer = 0;
        this.abilityTimer = 0;
        
        switch(ability) {
            case 'charge':
                // Préparer une charge vers le joueur
                this.chargeTarget = { x: playerX, y: playerY };
                this.chargeDelay = 500; // Temps de préparation
                break;
                
            case 'summon':
                // Invoquer des ennemis
                this.summonCount = 3;
                break;
                
            case 'dash':
                // Dash rapide
                this.dashTarget = { x: playerX, y: playerY };
                this.dashSpeed = this.speed * 5;
                break;
                
            case 'clone':
                // Créer des clones
                this.createClones(2);
                this.state = 'chase';
                break;
                
            case 'stomp':
                // Frappe au sol (zone de dégâts)
                this.stompCharging = true;
                this.stompTimer = 1000;
                break;
                
            case 'rage':
                // Augmentation temporaire des stats
                this.tempSpeedBoost = this.speed;
                this.speed *= 2;
                this.stateTimer = 3000;
                break;
                
            case 'teleport':
                // Téléportation derrière le joueur
                this.teleportTo(playerX, playerY, game);
                this.state = 'chase';
                break;
                
            case 'fear':
                // Effet de peur (ralentit le joueur)
                // Géré par le système de jeu
                this.state = 'chase';
                break;
        }
    }
    
    executeAbility(playerX, playerY, deltaTime, game) {
        this.stateTimer += deltaTime;
        
        switch(this.currentAbility) {
            case 'charge':
                if (this.chargeDelay > 0) {
                    this.chargeDelay -= deltaTime;
                } else {
                    // Charger vers la cible
                    const dx = this.chargeTarget.x - this.x;
                    const dy = this.chargeTarget.y - this.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist > 10) {
                        const chargeSpeed = this.speed * 4 * (deltaTime / 16);
                        this.x += (dx / dist) * chargeSpeed;
                        this.y += (dy / dist) * chargeSpeed;
                    } else {
                        this.state = 'stunned';
                        this.stateTimer = 1000;
                    }
                }
                break;
                
            case 'summon':
                if (this.summonCount > 0 && this.stateTimer >= 500) {
                    // Invoquer un ennemi
                    const angle = Math.random() * Math.PI * 2;
                    const dist = 100;
                    const x = this.x + Math.cos(angle) * dist;
                    const y = this.y + Math.sin(angle) * dist;
                    
                    if (game && game.enemies) {
                        const enemyType = EnemySpawner ? 
                            EnemySpawner.getRandomEnemyType() : 'BASIC';
                        game.enemies.push(new Enemy(x, y, enemyType, game.player.level));
                        game.particles.emit(x, y, '#ff0000', 20);
                    }
                    
                    this.summonCount--;
                    this.stateTimer = 0;
                }
                
                if (this.summonCount <= 0) {
                    this.state = 'chase';
                }
                break;
                
            case 'dash':
                const dx = this.dashTarget.x - this.x;
                const dy = this.dashTarget.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist > 20) {
                    this.x += (dx / dist) * this.dashSpeed * (deltaTime / 16);
                    this.y += (dy / dist) * this.dashSpeed * (deltaTime / 16);
                } else {
                    this.state = 'chase';
                }
                break;
                
            case 'stomp':
                if (this.stompTimer > 0) {
                    this.stompTimer -= deltaTime;
                } else if (this.stompCharging) {
                    // Exécuter le stomp
                    this.stompCharging = false;
                    
                    if (game && game.particles) {
                        game.particles.emit(this.x, this.y, '#ffff00', 50);
                    }
                    
                    // Vérifier si le joueur est dans la zone
                    if (game && game.player) {
                        const playerDist = Math.sqrt(
                            Math.pow(game.player.x - this.x, 2) +
                            Math.pow(game.player.y - this.y, 2)
                        );
                        
                        if (playerDist < this.size * 3) {
                            const hasShield = game.powerUpSystem && game.powerUpSystem.hasShield();
                            game.player.takeDamage(this.damage * 2, hasShield);
                            game.updateUI();
                        }
                    }
                    
                    this.state = 'stunned';
                    this.stateTimer = 1500;
                }
                break;
                
            case 'rage':
                if (this.stateTimer >= 3000) {
                    this.speed = this.tempSpeedBoost;
                    this.state = 'chase';
                }
                break;
        }
    }
    
    createClones(count) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i;
            const dist = 80;
            const clone = new Boss(
                this.x + Math.cos(angle) * dist,
                this.y + Math.sin(angle) * dist,
                this.type
            );
            clone.isClone = true;
            clone.hp = this.maxHp * 0.3; // Clones plus faibles
            clone.maxHp = clone.hp;
            clone.damage = this.damage * 0.5;
            clone.abilities = []; // Pas d'abilités pour les clones
            this.clones.push(clone);
        }
    }
    
    teleportTo(playerX, playerY, game) {
        // Téléporter derrière le joueur
        const angle = Math.atan2(this.y - playerY, this.x - playerX);
        const dist = 100;
        
        this.x = playerX - Math.cos(angle) * dist;
        this.y = playerY - Math.sin(angle) * dist;
        
        // Limiter aux bords du canvas
        if (game && game.canvas) {
            this.x = Math.max(this.size, Math.min(game.canvas.width - this.size, this.x));
            this.y = Math.max(this.size, Math.min(game.canvas.height - this.size, this.y));
        }
        
        if (game && game.particles) {
            game.particles.emit(this.x, this.y, this.color, 30);
        }
    }
    
    takeDamage(damage) {
        this.hp -= damage;
        this.hitFlash = 150;
        return this.hp <= 0;
    }
    
    draw(ctx) {
        // Dessiner les clones d'abord
        this.clones.forEach(clone => clone.draw(ctx));
        
        const pulse = 1 + Math.sin(this.pulsePhase) * 0.1;
        const currentSize = this.size * pulse;
        
        // Effet de hit
        const drawColor = this.hitFlash > 0 ? '#ffffff' : this.color;
        
        // Aura si enragé
        if (this.enraged) {
            ctx.save();
            ctx.globalAlpha = 0.3 + Math.sin(this.pulsePhase * 2) * 0.2;
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(this.x, this.y, currentSize * 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        
        // Corps principal
        ctx.fillStyle = drawColor;
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Bordure
        ctx.strokeStyle = this.enraged ? '#ff0000' : '#ffffff';
        ctx.lineWidth = 4;
        ctx.stroke();
        
        // Indicateur de charge/abilité
        if (this.state === 'ability') {
            ctx.save();
            ctx.globalAlpha = 0.5;
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 3;
            ctx.setLineDash([10, 5]);
            ctx.beginPath();
            ctx.arc(this.x, this.y, currentSize + 20, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
        
        // Stomp indicator
        if (this.currentAbility === 'stomp' && this.stompCharging) {
            const progress = 1 - (this.stompTimer / 1000);
            ctx.save();
            ctx.globalAlpha = 0.3 * progress;
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 3 * progress, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        
        // Barre de vie du boss
        this.drawHealthBar(ctx, currentSize);
        
        // Nom du boss
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, this.x, this.y - currentSize - 25);
    }
    
    drawHealthBar(ctx, currentSize) {
        const barWidth = currentSize * 2;
        const barHeight = 8;
        const barX = this.x - barWidth / 2;
        const barY = this.y - currentSize - 15;
        
        // Fond
        ctx.fillStyle = '#333333';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Vie
        const hpPercent = this.hp / this.maxHp;
        const hpColor = hpPercent > 0.5 ? '#00ff00' : 
                        hpPercent > 0.25 ? '#ffff00' : '#ff0000';
        ctx.fillStyle = hpColor;
        ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
        
        // Bordure
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
}

// Spawner de boss
const BossSpawner = {
    bossTypes: Object.keys(CONFIG.BOSS.TYPES),
    
    getRandomBossType() {
        return this.bossTypes[Math.floor(Math.random() * this.bossTypes.length)];
    },
    
    getBossForLevel(level) {
        // Boss plus difficiles à haut niveau
        if (level >= 10) {
            return 'BLOOD_TITAN';
        } else if (level >= 7) {
            const hardBosses = ['BLOOD_TITAN', 'DEMON_LORD'];
            return hardBosses[Math.floor(Math.random() * hardBosses.length)];
        } else if (level >= 4) {
            const mediumBosses = ['DEMON_LORD', 'NIGHTMARE', 'SHADOW_BEAST'];
            return mediumBosses[Math.floor(Math.random() * mediumBosses.length)];
        }
        return this.getRandomBossType();
    }
};