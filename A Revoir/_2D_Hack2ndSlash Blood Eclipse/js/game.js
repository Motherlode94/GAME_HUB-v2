// Classe principale du jeu Blood Eclipse
class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.canvas.width = CONFIG.CANVAS.WIDTH;
        this.canvas.height = CONFIG.CANVAS.HEIGHT;
        
        this.keys = {};
        this.player = null;
        this.enemies = [];
        this.boss = null;
        this.particles = new ParticleSystem();
        this.powerUpSystem = new PowerUpSystem();
        
        this.score = 0;
        this.kills = 0;
        this.gameOver = false;
        this.paused = false;
        this.bossActive = false;
        this.bossWarning = false;
        this.bossWarningTimer = 0;
        
        this.enemySpawnTimer = 0;
        
        this.setupEventListeners();
        this.init();
    }
    
    init() {
        this.player = new Player(
            this.canvas.width / 2,
            this.canvas.height / 2
        );
        this.enemies = [];
        this.boss = null;
        this.score = 0;
        this.kills = 0;
        this.gameOver = false;
        this.paused = false;
        this.bossActive = false;
        this.bossWarning = false;
        this.enemySpawnTimer = 0;
        this.powerUpSystem = new PowerUpSystem();
        this.particles.clear();
        
        this.updateUI();
    }
    
    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            
            if (e.key === ' ' || e.key === 'Spacebar') {
                e.preventDefault();
                if (!this.gameOver && !this.paused) {
                    this.handleAttack();
                }
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }
    
    handleAttack() {
        const damageMultiplier = this.powerUpSystem.getDamageMultiplier();
        const result = this.player.attack(damageMultiplier);
        
        if (result) {
            if (result.type === 'melee') {
                this.checkMeleeHits(damageMultiplier);
            }
        }
    }
    
checkMeleeHits(attack) {
    const weapon = attack.weapon;

    // ========= ENNEMIS =========
    for (let i = this.enemies.length - 1; i >= 0; i--) {
        const enemy = this.enemies[i];

        const dist = Utils.distance(
            this.player.x, this.player.y,
            enemy.x, enemy.y
        );

        if (dist < attack.range) {
            this.particles.emit(enemy.x, enemy.y, CONFIG.COLORS.PARTICLE_HIT, 5);

            let damage = Math.floor(attack.damage);

            // Coup critique
            if (weapon.critChance && Math.random() < weapon.critChance) {
                damage = Math.floor(damage * weapon.critMultiplier);
                this.particles.emit(enemy.x, enemy.y, '#ff00ff', 10);
                this.showNotification('CRITIQUE !');
            }

            // Stun (armes lourdes)
            if (weapon.stunChance && Math.random() < weapon.stunChance) {
                enemy.stunned = 500;
            }

            if (enemy.takeDamage(damage)) {
                this.killEnemy(i);
            }
        }
    }

    // ========= BOSS =========
    if (this.boss) {
        const dist = Utils.distance(
            this.player.x, this.player.y,
            this.boss.x, this.boss.y
        );

        if (dist < attack.range + this.boss.size) {
            this.particles.emit(this.boss.x, this.boss.y, CONFIG.COLORS.PARTICLE_HIT, 10);

            let damage = Math.floor(attack.damage);

            if (weapon.critChance && Math.random() < weapon.critChance) {
                damage = Math.floor(damage * weapon.critMultiplier);
            }

            if (this.boss.takeDamage(damage)) {
                this.killBoss();
            }
        }
    }

    // ========= FINISHER (optionnel mais stylé) =========
    if (attack.comboStep !== undefined && attack.comboStep === 2) {
        this.player.x += Math.cos(this.player.facingAngle) * 10;
        this.player.y += Math.sin(this.player.facingAngle) * 10;
    }
}

    
    killEnemy(index) {
        const enemy = this.enemies[index];
        this.particles.emit(enemy.x, enemy.y, CONFIG.COLORS.PARTICLE_DEATH, 20);
        
        // Drop de power-ups
        this.powerUpSystem.trySpawn(enemy.x, enemy.y);
        
        this.enemies.splice(index, 1);
        
        this.kills++;
        this.score += Math.floor(enemy.scoreReward * 
            Math.pow(CONFIG.PROGRESSION.SCORE_MULTIPLIER_PER_LEVEL, this.player.level - 1));
        
        const leveledUp = this.player.gainXP(enemy.xpReward);
        
        this.updateUI();
        
        if (leveledUp) {
            this.showLevelUp();
        }
        
        // Vérifier si un boss doit apparaître
        if (this.kills % CONFIG.BOSS.SPAWN_EVERY_KILLS === 0 && !this.bossActive) {
            this.triggerBossWarning();
        }
    }
    
    killBoss() {
        this.particles.emit(this.boss.x, this.boss.y, CONFIG.COLORS.PARTICLE_DEATH, 50);
        
        // Récompenses massives
        this.score += this.boss.scoreReward;
        const leveledUp = this.player.gainXP(this.boss.xpReward);
        
        // Drop de power-up garanti
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 / 3) * i;
            const distance = 60;
            const x = this.boss.x + Math.cos(angle) * distance;
            const y = this.boss.y + Math.sin(angle) * distance;
            this.powerUpSystem.forceSpawn(x, y, i === 0 ? 'WEAPON' : null);
        }
        
        this.boss = null;
        this.bossActive = false;
        
        this.showNotification('BOSS VAINCU !');
        this.updateUI();
        
        if (leveledUp) {
            this.showLevelUp();
        }
    }
    
    triggerBossWarning() {
        this.bossWarning = true;
        this.bossWarningTimer = 0;
        this.paused = true;
    }
    
    spawnBoss() {
        const bossType = BossSpawner.getBossForLevel(this.player.level);
        const pos = Utils.getRandomEdgePosition(this.canvas.width, this.canvas.height, 100);
        this.boss = new Boss(pos.x, pos.y, bossType);
        this.bossActive = true;
        this.bossWarning = false;
        this.paused = false;
        
        // Particules d'apparition
        this.particles.emit(pos.x, pos.y, this.boss.color, 100);
    }
    
    spawnEnemy() {
        if (this.enemies.length < CONFIG.ENEMY.MAX_ENEMIES && !this.bossActive) {
            const pos = Utils.getRandomEdgePosition(this.canvas.width, this.canvas.height);
            const enemyType = EnemySpawner.getEnemyTypeForLevel(this.player.level);
            this.enemies.push(new Enemy(pos.x, pos.y, enemyType, this.player.level));
        }
    }
    
    update(deltaTime) {
        if (this.gameOver) return;
        
        // Avertissement de boss
        if (this.bossWarning) {
            this.bossWarningTimer += deltaTime;
            if (this.bossWarningTimer >= CONFIG.BOSS.WARNING_DURATION) {
                this.spawnBoss();
            }
            return;
        }
        
        if (this.paused) return;
        
        // Multiplicateur de vitesse des power-ups
        const speedMultiplier = this.powerUpSystem.getSpeedMultiplier();
        
        // Mise à jour du joueur
        this.player.update(this.keys, this.canvas.width, this.canvas.height, deltaTime, speedMultiplier);
        
        // Mise à jour du système d'armes
        this.player.weaponSystem.update(deltaTime);
        
        // Mise à jour des ennemis
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(this.player.x, this.player.y, deltaTime);
            
            // Collision avec le joueur
            if (Utils.checkCollision(
                this.player.x, this.player.y, this.player.size,
                enemy.x, enemy.y, enemy.size
            )) {
                const hasShield = this.powerUpSystem.hasShield();
                if (this.player.takeDamage(enemy.damage, hasShield)) {
                    this.endGame();
                    return;
                } else {
                    if (hasShield) {
                        this.particles.emit(this.player.x, this.player.y, '#00bfff', 15);
                    }
                    this.updateUI();
                }
            }
        }
        
        // Mise à jour du boss
        if (this.boss) {
            this.boss.update(this.player.x, this.player.y, deltaTime, this);
            
            // Collision avec le joueur
            if (Utils.checkCollision(
                this.player.x, this.player.y, this.player.size,
                this.boss.x, this.boss.y, this.boss.size
            )) {
                const hasShield = this.powerUpSystem.hasShield();
                if (this.player.takeDamage(this.boss.damage, hasShield)) {
                    this.endGame();
                } else {
                    if (hasShield) {
                        this.particles.emit(this.player.x, this.player.y, '#00bfff', 15);
                    }
                    this.updateUI();
                }
            }
        }
        
        // Spawn d'ennemis
        if (!this.bossActive) {
            this.enemySpawnTimer += deltaTime;
            if (this.enemySpawnTimer >= CONFIG.ENEMY.SPAWN_INTERVAL) {
                this.spawnEnemy();
                this.enemySpawnTimer = 0;
            }
        }
        
        // Mise à jour des power-ups
        this.powerUpSystem.update(deltaTime);
        
        // Ramassage des power-ups
        const pickups = this.powerUpSystem.checkPickup(
            this.player.x, this.player.y, this.player.size
        );
        
        pickups.forEach(powerUp => {
            this.handlePowerUpPickup(powerUp);
        });
        
        // Mise à jour des particules
        this.particles.update();
    }
    
    handlePowerUpPickup(powerUp) {
        this.particles.emit(powerUp.x, powerUp.y, CONFIG.COLORS.PARTICLE_POWERUP, 20);
        
        switch(powerUp.type) {
            case 'WEAPON':
                const weaponName = this.player.changeWeapon(powerUp.weaponKey);
                this.showNotification(`Nouvelle arme : ${weaponName}!`);
                break;
            case 'HEALTH':
                this.player.heal(CONFIG.POWERUPS.HEALTH.healAmount);
                this.updateUI();
                this.showNotification('+30 PV');
                break;
            case 'SHIELD':
                this.powerUpSystem.activateEffect('shield', CONFIG.POWERUPS.SHIELD.duration);
                this.showNotification('Bouclier activé !');
                break;
            case 'DAMAGE_BOOST':
                this.powerUpSystem.activateEffect('damageBoost', CONFIG.POWERUPS.DAMAGE_BOOST.duration);
                this.showNotification('Dégâts x2 !');
                break;
            case 'SPEED_BOOST':
                this.powerUpSystem.activateEffect('speedBoost', CONFIG.POWERUPS.SPEED_BOOST.duration);
                this.showNotification('Vitesse augmentée !');
                break;
        }
    }
    
    showNotification(text) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = text;
        document.getElementById('game-container').appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 500);
        }, 2000);
    }
    
    draw() {
        // Effacer le canvas
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Grille de fond (optionnel)
        this.drawGrid();
        
        // Dessiner les particules (arrière-plan)
        this.particles.draw(this.ctx);
        
        // Dessiner les power-ups
        this.powerUpSystem.draw(this.ctx);
        
        // Dessiner les ennemis
        this.enemies.forEach(enemy => enemy.draw(this.ctx));
        
        // Dessiner le boss
        if (this.boss) {
            this.boss.draw(this.ctx);
        }
        
        // Dessiner les projectiles
        this.player.weaponSystem.draw(this.ctx);
        
        // Dessiner le joueur
        this.player.draw(this.ctx);
        
        // Dessiner les effets actifs
        this.drawActiveEffects();
        
        // Avertissement de boss
        if (this.bossWarning) {
            this.drawBossWarning();
        }
    }
    
    drawGrid() {
        this.ctx.strokeStyle = '#1a1a1a';
        this.ctx.lineWidth = 1;
        
        const gridSize = 50;
        
        for (let x = 0; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    drawActiveEffects() {
        const effects = [];
        const y = this.canvas.height - 30;
        
        if (this.powerUpSystem.hasShield()) {
            effects.push({ text: 'BOUCLIER', color: '#00bfff' });
        }
        
        if (this.powerUpSystem.getDamageMultiplier() > 1) {
            effects.push({ text: 'DÉGÂTS x2', color: '#ff4500' });
        }
        
        if (this.powerUpSystem.getSpeedMultiplier() > 1) {
            effects.push({ text: 'VITESSE+', color: '#ffff00' });
        }
        
        effects.forEach((effect, i) => {
            const x = 20 + i * 150;
            this.ctx.font = 'bold 16px Arial';
            this.ctx.fillStyle = effect.color;
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = effect.color;
            this.ctx.fillText(effect.text, x, y);
            this.ctx.shadowBlur = 0;
        });
    }
    
    drawBossWarning() {
        const progress = this.bossWarningTimer / CONFIG.BOSS.WARNING_DURATION;
        const alpha = Math.abs(Math.sin(this.bossWarningTimer * 0.01)) * 0.5 + 0.3;
        
        this.ctx.globalAlpha = alpha;
        this.ctx.fillStyle = '#ff0000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.globalAlpha = 1;
        this.ctx.font = 'bold 60px Arial';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 5;
        this.ctx.textAlign = 'center';
        
        const text = 'BOSS IMMINENT !';
        this.ctx.strokeText(text, this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2);
        
        // Barre de progression
        const barWidth = 400;
        const barHeight = 20;
        const barX = this.canvas.width / 2 - barWidth / 2;
        const barY = this.canvas.height / 2 + 50;
        
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);
        
        this.ctx.fillStyle = '#ff0000';
        this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);
        
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        this.ctx.textAlign = 'left';
    }
    
    updateUI() {
        // Barre de vie
        const hpPercent = (this.player.hp / this.player.maxHp) * 100;
        document.getElementById('health-bar').style.width = hpPercent + '%';
        document.getElementById('health-text').textContent = 
            `${Math.max(0, Math.ceil(this.player.hp))}/${this.player.maxHp}`;
        
        // Barre d'XP
        const xpPercent = (this.player.xp / this.player.xpToNextLevel) * 100;
        document.getElementById('exp-bar').style.width = xpPercent + '%';
        document.getElementById('level-text').textContent = `Niveau ${this.player.level}`;
        
        // Stats
        document.getElementById('score').textContent = this.score;
        document.getElementById('kills').textContent = this.kills;
        
        // Arme actuelle
        document.getElementById('current-weapon').textContent = 
            this.player.weaponSystem.currentWeapon.name;
    }
    
    showLevelUp() {
        this.paused = true;
        const modal = document.getElementById('level-up');
        document.getElementById('new-level').textContent = this.player.level;
        modal.classList.remove('hidden');
    }
    
    hideLevelUp() {
        this.paused = false;
        document.getElementById('level-up').classList.add('hidden');
    }
    
    endGame() {
        this.gameOver = true;
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('final-kills').textContent = this.kills;
        document.getElementById('final-level').textContent = this.player.level;
        document.getElementById('game-over').classList.remove('hidden');
    }
    
    restart() {
        document.getElementById('game-over').classList.add('hidden');
        this.init();
    }
}