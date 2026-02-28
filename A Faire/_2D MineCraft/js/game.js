class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.enemies = [];
        this.spawnTimer = 0;
        this.spawnInterval = 600; // ~10s à 60fps

            // ===== NOUVEAU : SYSTÈME JOUR/NUIT =====
    this.dayNightCycle = {
        time: 0,              // 0 à 24000 (comme Minecraft)
        maxTime: 24000,       // Durée totale d'un cycle
        dayStart: 0,          // Jour commence à 0
        nightStart: 12000,    // Nuit commence à 12000
        isDaytime: true,
        dayNumber: 1,
        cycleSpeed: 4         // Vitesse du cycle (plus = plus rapide)
    };
    
    this.waveSystem = {
        currentWave: 1,
        enemiesPerWave: 3,
        enemiesSpawned: 0,
        waveActive: false,
        waveTimer: 0,
        waveDelay: 300        // Délai entre les vagues (5 secondes)
    };
        
        // Dimensions
        this.width = 1280;
        this.height = 720;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        // Monde
        this.worldWidth = 200;
        this.worldHeight = 100;
        this.world = new World(this.worldWidth, this.worldHeight);
        
        // Joueur
        this.player = new Player();
        
        // Caméra
        this.camera = {
            x: 0,
            y: 0,
            width: this.width,
            height: this.height
        };
        
        // Input
        this.keys = {};
        this.mouse = {
            x: 0,
            y: 0,
            worldX: 0,
            worldY: 0,
            blockX: 0,
            blockY: 0,
            leftDown: false,
            rightDown: false
        };
        
        // État
        this.running = false;
        this.paused = false;
        this.debug = false;
        
        this.setupControls();
    }
    
    setupControls() {
        // Clavier
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            this.keys[key] = true;
            
            // Actions spéciales
            if (key === 'escape') {
                this.paused = !this.paused;
                e.preventDefault();
            }
            if (key === 'r') {
                this.restart();
            }
            if (key === 'f3') {
                this.debug = !this.debug;
                e.preventDefault();
            }
            if (key === 'e') {
                this.player.selectNextBlock();
                e.preventDefault();
            }
            if (key === 'shift') {
                this.player.toggleSprint();
                e.preventDefault();
            }
            if (key === 'control') {
                this.player.toggleSneak();
                e.preventDefault();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            this.keys[key] = false;
        });
        
        // Souris
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
            
            // Position dans le monde
            this.mouse.worldX = this.mouse.x + this.camera.x;
            this.mouse.worldY = this.mouse.y + this.camera.y;
            
            // Bloc visé
            this.mouse.blockX = Math.floor(this.mouse.worldX / this.world.blockSize);
            this.mouse.blockY = Math.floor(this.mouse.worldY / this.world.blockSize);
        });
        
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                this.mouse.leftDown = true;
                this.handleLeftClick();
            } else if (e.button === 2) {
                this.mouse.rightDown = true;
                this.handleRightClick();
            }
        });
        
        this.canvas.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.mouse.leftDown = false;
            } else if (e.button === 2) {
                this.mouse.rightDown = false;
            }
        });
        
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Molette
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (e.deltaY > 0) {
                this.player.selectNextBlock();
            } else {
                this.player.selectPrevBlock();
            }
        });
        
        // Empêcher le scroll avec les touches
        window.addEventListener('keydown', (e) => {
            if ([32, 37, 38, 39, 40].includes(e.keyCode)) {
                e.preventDefault();
            }
        }, false);
    }
    
    handleLeftClick() {
        // Détruire un bloc seulement si en mode minage
        if (this.player.mode === 'mine') {
            const dx = this.mouse.blockX - Math.floor(this.player.x);
            const dy = this.mouse.blockY - Math.floor(this.player.y);
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist <= this.player.reach) {
                const block = this.world.removeBlock(this.mouse.blockX, this.mouse.blockY);
                if (block) {
                    // Effet visuel de destruction
                    this.showBlockBreakEffect(this.mouse.blockX, this.mouse.blockY);
                }
            }
        }
    }
    
    handleRightClick() {
        // Placer un bloc seulement si en mode construction
        if (this.player.mode === 'build') {
            const dx = this.mouse.blockX - Math.floor(this.player.x);
            const dy = this.mouse.blockY - Math.floor(this.player.y);
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist <= this.player.reach) {
                // Vérifier qu'on ne place pas sur le joueur
                const px = Math.floor(this.player.x);
                const py = Math.floor(this.player.y);
                const py2 = Math.floor(this.player.y + this.player.height);
                
                if ((this.mouse.blockX !== px || (this.mouse.blockY !== py && this.mouse.blockY !== py2))) {
                    const placed = this.world.setBlock(this.mouse.blockX, this.mouse.blockY, this.player.getSelectedBlock());
                    if (placed) {
                        // Effet visuel de placement
                        this.showBlockPlaceEffect(this.mouse.blockX, this.mouse.blockY);
                    }
                }
            }
        }
    }
        showBlockBreakEffect(x, y) {
        // Ajouter des particules de destruction
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                // Effet visuel temporaire
                const screenX = x * this.world.blockSize - this.camera.x;
                const screenY = y * this.world.blockSize - this.camera.y;
                
                this.ctx.save();
                this.ctx.globalAlpha = 0.5;
                this.ctx.fillStyle = '#fff';
                this.ctx.fillRect(screenX, screenY, this.world.blockSize, this.world.blockSize);
                this.ctx.restore();
            }, i * 50);
        }
    }
    
    showBlockPlaceEffect(x, y) {
        // Flash blanc lors du placement
        const screenX = x * this.world.blockSize - this.camera.x;
        const screenY = y * this.world.blockSize - this.camera.y;
        
        this.ctx.save();
        this.ctx.globalAlpha = 0.3;
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(screenX, screenY, this.world.blockSize, this.world.blockSize);
        this.ctx.restore();
    }
    
start() {
    this.world.generate();
    
    // Initialize player inventory AFTER BLOCK_TYPES is defined
    this.player.initInventory();
    
    // Placer le joueur au spawn
    this.player.x = this.worldWidth / 2;
    for (let y = 0; y < this.worldHeight; y++) {
        if (this.world.getBlock(Math.floor(this.player.x), y)) {
            this.player.y = y - this.player.height - 1;
            break;
        }
    }
    
    this.running = true;
    this.loop();
}
    
    restart() {
        this.world.generate();
        this.player.x = this.worldWidth / 2;
        for (let y = 0; y < this.worldHeight; y++) {
            if (this.world.getBlock(Math.floor(this.player.x), y)) {
                this.player.y = y - this.player.height - 1;
                break;
            }
        }
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.sprinting = false;
        this.player.sneaking = false;
        this.player.stamina = 100;
    }
    
update() {
    if (this.paused) return;
    
    // ===== NOUVEAU : Cycle jour/nuit =====
    this.updateDayNightCycle();
    // ===== FIN NOUVEAU =====
    
    // AZERTY : Q pour gauche, D pour droite
    const moveLeft = this.keys['q'] || this.keys['arrowleft'];
    const moveRight = this.keys['d'] || this.keys['arrowright'];

    if (moveLeft && !moveRight) {
        this.player.moveLeft();
    } else if (moveRight && !moveLeft) {
        this.player.moveRight();
    } else {
        if (this.player.onGround) {
            this.player.vx *= 0.8; 
        }
    }

    if (this.keys[' '] || this.keys['z'] || this.keys['arrowup']) {
        this.player.jump();
    }
    
    this.player.update(this.world);
    
    // ===== MODIFIÉ : Spawn d'ennemis uniquement la nuit =====
    if (!this.dayNightCycle.isDaytime && this.waveSystem.waveActive) {
        if (this.waveSystem.enemiesSpawned < this.waveSystem.enemiesPerWave) {
            this.spawnTimer++;
            if (this.spawnTimer >= this.spawnInterval) {
                this.enemies.push(new Enemy(this.worldWidth, this.worldHeight, this.world));
                this.spawnTimer = 0;
                this.waveSystem.enemiesSpawned++;
            }
        }
    }
    // ===== FIN MODIFIÉ =====

    // Update ennemis
    this.enemies.forEach(enemy => {
        enemy.update(this.player, this.world);
    });

    // Collision joueur-ennemi
    this.enemies = this.enemies.filter(enemy => {
        const dx = enemy.x - this.player.x;
        const dy = enemy.y - this.player.y;
        if (Math.sqrt(dx*dx + dy*dy) < 1.0) {
            console.log("CAPTURÉ !");
            this.running = false;
            return false;
        }
        return true;
    });
    
    this.updateCamera();
}
    
    updateCamera() {
        const targetX = this.player.x * this.world.blockSize - this.width / 2;
        const targetY = this.player.y * this.world.blockSize - this.height / 2;
        
        // Limites
        this.camera.x = Math.max(0, Math.min(targetX, this.worldWidth * this.world.blockSize - this.width));
        this.camera.y = Math.max(0, Math.min(targetY, this.worldHeight * this.world.blockSize - this.height));
    }
    updateDayNightCycle() {
    const cycle = this.dayNightCycle;
    
    // Avancer le temps
    cycle.time += cycle.cycleSpeed;
    
    // Reset du cycle
    if (cycle.time >= cycle.maxTime) {
        cycle.time = 0;
        cycle.dayNumber++;
    }
    
    // Déterminer si c'est le jour ou la nuit
    const wasDay = cycle.isDaytime;
    cycle.isDaytime = cycle.time < cycle.nightStart;
    
    // Transition jour → nuit : déclencher une vague
    if (wasDay && !cycle.isDaytime) {
        this.startNightWave();
    }
    
    // Transition nuit → jour : arrêter le spawn
    if (!wasDay && cycle.isDaytime) {
        this.waveSystem.waveActive = false;
        console.log('🌅 Le jour se lève ! Vague terminée.');
    }
}

startNightWave() {
    console.log(`🌙 La nuit ${this.dayNightCycle.dayNumber} arrive ! Vague ${this.waveSystem.currentWave}`);
    
    this.waveSystem.waveActive = true;
    this.waveSystem.enemiesSpawned = 0;
    this.waveSystem.enemiesPerWave = 3 + (this.waveSystem.currentWave * 2); // Plus dur chaque nuit
    this.spawnInterval = Math.max(180, 600 - (this.waveSystem.currentWave * 30)); // Spawn plus rapide
    
    this.waveSystem.currentWave++;
}
    
render() {
    // ===== MODIFIÉ : Ciel avec cycle jour/nuit =====
    const cycle = this.dayNightCycle;
    let skyColor1, skyColor2;
    
    if (cycle.isDaytime) {
        // Jour : bleu clair
        const dayProgress = cycle.time / cycle.nightStart;
        skyColor1 = '#87CEEB';
        skyColor2 = '#E0F6FF';
    } else {
        // Nuit : bleu sombre / violet
        skyColor1 = '#0a1128';
        skyColor2 = '#1a1f3a';
    }
    
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, skyColor1);
    gradient.addColorStop(1, skyColor2);
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Effet d'obscurité la nuit
    if (!cycle.isDaytime) {
        this.ctx.fillStyle = 'rgba(0, 0, 20, 0.4)';
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
    // ===== FIN MODIFIÉ =====
    
    // Monde
    this.world.draw(this.ctx, this.camera);
    
    // Joueur
    this.player.draw(this.ctx, this.camera.x, this.camera.y, this.world.blockSize);
    
    // Ennemis
    this.enemies.forEach(enemy => {
        enemy.draw(this.ctx, this.camera.x, this.camera.y, this.world.blockSize);
    });
    
    // Curseur de bloc
    this.drawBlockCursor();
    
    // UI
    this.drawUI();
    
    // ===== NOUVEAU : Affichage du cycle jour/nuit =====
    this.drawDayNightUI();
    // ===== FIN NOUVEAU =====
    
    // Pause
if (this.paused) {
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Panneau de pause
    const pauseWidth = 400;
    const pauseHeight = 200;
    const pauseX = (this.width - pauseWidth) / 2;
    const pauseY = (this.height - pauseHeight) / 2;
    
    this.ctx.fillStyle = 'rgba(0,0,0,0.9)';
    this.ctx.fillRect(pauseX, pauseY, pauseWidth, pauseHeight);
    
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(pauseX, pauseY, pauseWidth, pauseHeight);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('⏸ PAUSE', this.width / 2, pauseY + 80);
    
    this.ctx.font = '20px Arial';
    this.ctx.fillStyle = '#aaa';
    this.ctx.fillText('Appuyez sur ESC pour continuer', this.width / 2, pauseY + 130);
    
    this.ctx.font = '16px Arial';
    this.ctx.fillText('R - Nouveau monde', this.width / 2, pauseY + 160);
}
    
    // Debug
    if (this.debug) {
        this.drawDebug();
    }
}
drawDayNightUI() {
    const cycle = this.dayNightCycle;
    const wave = this.waveSystem;
    
    // Panneau AGRANDI en haut à droite
    const panelWidth = 220; // Réduit pour éviter débordement
    const panelHeight = 115;
    const panelX = this.width - panelWidth - 30; // Plus de marge
    const panelY = 15;
    
    // Fond avec bordure
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
    
    // Bordure colorée selon le moment
    this.ctx.strokeStyle = cycle.isDaytime ? '#FFD700' : '#8B00FF';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
    
    // Icône et titre
    const phase = cycle.isDaytime ? '☀️ JOUR' : '🌙 NUIT';
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 22px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(phase, panelX + 15, panelY + 32);
    
    // Numéro du jour
    this.ctx.font = 'bold 16px Arial';
    this.ctx.fillStyle = '#aaa';
    this.ctx.fillText(`Jour ${cycle.dayNumber}`, panelX + 15, panelY + 55);
    
    // Barre de progression PLUS GRANDE
    const barWidth = panelWidth - 30;
    const barHeight = 14; // Augmenté de 10 à 14
    const barX = panelX + 15;
    const barY = panelY + 65;
    
    // Fond de la barre
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    this.ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // Progression
    const progress = cycle.time / cycle.maxTime;
    const gradient = this.ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
    if (cycle.isDaytime) {
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(1, '#FFA500');
    } else {
        gradient.addColorStop(0, '#8B00FF');
        gradient.addColorStop(1, '#4B0082');
    }
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);
    
    // Bordure de la barre
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(barX, barY, barWidth, barHeight);
    
    // Info vague la nuit
    if (!cycle.isDaytime && wave.waveActive) {
        this.ctx.fillStyle = '#ff4444';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillText(`⚔️ Vague ${wave.currentWave - 1}`, panelX + 15, panelY + 95);
        
        this.ctx.font = '14px Arial';
        this.ctx.fillStyle = '#ffaaaa';
        this.ctx.fillText(`${wave.enemiesSpawned}/${wave.enemiesPerWave} ennemis`, panelX + 15, panelY + 112);
    } else if (cycle.isDaytime) {
        this.ctx.fillStyle = '#90EE90';
        this.ctx.font = '14px Arial';
        this.ctx.fillText('☮️ Temps calme', panelX + 15, panelY + 95);
    }
}
    drawBlockCursor() {
        const dx = this.mouse.blockX - Math.floor(this.player.x);
        const dy = this.mouse.blockY - Math.floor(this.player.y);
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist <= this.player.reach) {
            const x = this.mouse.blockX * this.world.blockSize - this.camera.x;
            const y = this.mouse.blockY * this.world.blockSize - this.camera.y;
            
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(x, y, this.world.blockSize, this.world.blockSize);
            
            // Aperçu du bloc à placer
            const block = this.world.getBlock(this.mouse.blockX, this.mouse.blockY);
            if (!block) {
                const selectedType = this.player.getSelectedBlock();
                const color = BLOCK_TYPES[selectedType].color;
                this.ctx.fillStyle = color + '80';
                this.ctx.fillRect(x, y, this.world.blockSize, this.world.blockSize);
            }
        }
    }
    
drawUI() {
    // Safety check
    if (!this.player.inventory || this.player.inventory.length === 0) {
        return;
    }
    
    // Barre d'inventaire AGRANDIE
    const barWidth = 550; // Augmenté de 450 à 550
    const barHeight = 70; // Augmenté de 60 à 70
    const barX = (this.width - barWidth) / 2;
    const barY = this.height - barHeight - 30; // Plus d'espace en bas
    
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // Bordure
    this.ctx.strokeStyle = '#555';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(barX, barY, barWidth, barHeight);
    
    // Slots
    const slots = 9;
    const slotSize = 55; // Augmenté de 50 à 55
    const spacing = (barWidth - slots * slotSize) / (slots + 1);
    
    for (let i = 0; i < slots && i < this.player.inventory.length; i++) {
        const x = barX + spacing + i * (slotSize + spacing);
        const y = barY + 7;
        
        // Slot sélectionné
        if (i === this.player.selectedBlockIndex) {
            this.ctx.fillStyle = '#fff';
            this.ctx.fillRect(x - 3, y - 3, slotSize + 6, slotSize + 6);
        }
        
        this.ctx.fillStyle = '#2a2a2a';
        this.ctx.fillRect(x, y, slotSize, slotSize);
        
        // Bordure du slot
        this.ctx.strokeStyle = '#444';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, slotSize, slotSize);
        
        // Bloc
        const blockType = this.player.inventory[i];
        const blockInfo = BLOCK_TYPES[blockType];
        
        if (blockInfo && blockInfo.color) {
            this.ctx.fillStyle = blockInfo.color;
            this.ctx.fillRect(x + 7, y + 7, slotSize - 14, slotSize - 14);
            
            // Ombre du bloc
            this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
            this.ctx.fillRect(x + 7, y + slotSize - 10, slotSize - 14, 3);
        }
        
        // Numéro plus visible
        this.ctx.fillStyle = '#000';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.fillText((i + 1).toString(), x + slotSize - 6, y + 17);
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText((i + 1).toString(), x + slotSize - 7, y + 16);
    }
    
    // Nom du bloc sélectionné - PLUS GRAND
    const selectedType = this.player.getSelectedBlock();
    const selectedBlockInfo = BLOCK_TYPES[selectedType];
    
    if (selectedBlockInfo) {
        this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
        this.ctx.fillRect(this.width/2 - 100, barY - 45, 200, 30);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(selectedBlockInfo.name || selectedType, this.width / 2, barY - 22);
    }
    
    // Panneau d'aide REPOSITIONNÉ
    const helpWidth = 300;
    const helpHeight = 140;
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(15, 15, helpWidth, helpHeight);
    
    this.ctx.strokeStyle = '#555';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(15, 15, helpWidth, helpHeight);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('🎮 CONTRÔLES', 30, 45);
    
    this.ctx.font = '14px Arial';
    let y = 70;
    this.ctx.fillText('QZSD / Flèches - Déplacer', 30, y); y += 22;
    this.ctx.fillText('Espace - Sauter', 30, y); y += 22;
    this.ctx.fillText('Clic Gauche - Détruire', 30, y); y += 22;
    this.ctx.fillText('Clic Droit - Placer', 30, y); y += 22;
    this.ctx.fillText('E / Molette - Changer bloc', 30, y); y += 22;
    this.ctx.fillText('R - Régénérer monde', 30, y);
}
    
    drawDebug() {
        this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
        this.ctx.fillRect(10, 140, 200, 120);
        this.ctx.fillStyle = '#0f0';
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'left';
        
        let y = 160;
        this.ctx.fillText(`X: ${this.player.x.toFixed(2)}`, 20, y); y += 20;
        this.ctx.fillText(`Y: ${this.player.y.toFixed(2)}`, 20, y); y += 20;
        this.ctx.fillText(`VX: ${this.player.vx.toFixed(2)}`, 20, y); y += 20;
        this.ctx.fillText(`VY: ${this.player.vy.toFixed(2)}`, 20, y); y += 20;
        this.ctx.fillText(`Ground: ${this.player.onGround}`, 20, y); y += 20;
        this.ctx.fillText(`Blocks: ${this.world.blocks.size}`, 20, y);
        
        // Nombre d'ennemis
        this.ctx.fillText(`Enemies: ${this.enemies.length}`, 20, y);
    }
    
    loop() {
        if (!this.running) return;
        
        this.update();
        this.render();
        
        requestAnimationFrame(() => this.loop());
    }
}