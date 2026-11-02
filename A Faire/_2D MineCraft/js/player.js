class Player {
    constructor() {
        // Position & hitbox
        this.x = 0;
        this.y = 0;
        this.width = 0.6;
        this.height = 1.8;
        this.defaultHeight = 1.8;
        this.crouchHeight = 1.2;

        // Physique
        this.vx = 0;
        this.vy = 0;
        this.gravity = 0.025;
        this.jumpPower = 0.55;
        this.maxVelocityY = 0.8;
        this.moveSpeed = 0.15;          // ← ajouté ici
        this.sprintMultiplier = 1.4;
        this.maxVelocityX = 0.25;
        this.airControl = 0.04;
        this.groundFriction = 0.82;     // un peu plus fluide que 0.6
        this.onGround = false;

        // États
        this.direction = 1;
        this.sneaking = false;
        this.sprinting = false;
        this.jumping = false;

        // Gameplay
        this.selectedBlockIndex = 0;
        this.reach = 5;
        this.mode = 'mine'; // 'mine' ou 'build'

        // Inventaire (sera rempli après BLOCK_TYPES)
        this.inventory = [];

        // Ressources
        this.stamina = 100;
        this.maxStamina = 100;
        this.staminaRegenRate = 0.4;     // par frame quand pas en sprint
        this.staminaSprintCost = 0.7;    // par frame en sprint

        // Horreur / cache
        this.isHidden = false;           // ← nouveau : vrai quand bien caché
        this.hideTimer = 0;              // frames restantes de cache effective
        this.maxHideDuration = 180;      // ~3 secondes à 60 fps
    }

    initInventory() {
        // Appeler après que BLOCK_TYPES soit défini
        this.inventory = Object.keys(BLOCK_TYPES)
            .filter(type => type !== 'air' && type !== 'bedrock' && type !== 'water' && type !== 'lava')
            .sort();
    }

    update(world) {
        // -----------------------
        //  Gestion stamina
        // -----------------------
        if (this.sprinting) {
            this.stamina -= this.staminaSprintCost;
            if (this.stamina <= 0) {
                this.sprinting = false;
                this.stamina = 0;
            }
        } else {
            this.stamina = Math.min(this.maxStamina, this.stamina + this.staminaRegenRate);
        }

        // -----------------------
        //  Physique de base
        // -----------------------
        if (!this.onGround) {
            this.vy += this.gravity;
            this.vy = Math.min(this.vy, this.maxVelocityY);
        }

        this.x += this.vx;
        this.checkCollisionX(world);
        this.y += this.vy;
        this.checkCollisionY(world);

        

        if (Math.abs(this.vx) < 0.008) this.vx = 0;

        // -----------------------
        //  Cache / Horreur
        // -----------------------
        if (this.isHidden) {
            if (this.hideTimer > 0) {
                this.hideTimer--;
            } else {
                this.isHidden = false;
            }
        } else {
            // On vérifie si on est actuellement caché (feuillage dense)
            this.isHidden = this.isInGoodHidingSpot(world);
            if (this.isHidden) {
                this.hideTimer = this.maxHideDuration;
            }
        }
    }

    // These methods should be OUTSIDE the update() method
checkCollisionX(world) {
    const left = Math.floor(this.x - this.width / 2);
    const right = Math.floor(this.x + this.width / 2);
    const bottom = Math.floor(this.y + this.height - 0.1); // ← Exclu le bloc du sol
    const top = Math.floor(this.y + 0.1); // ← Petit offset pour éviter les bugs

    // Check left side
    if (this.vx < 0) {
        for (let y = top; y <= bottom; y++) {
            const block = world.getBlock(left, y);
            if (block && block.type !== 'air' && block.solid) {
                this.x = left + 1 + this.width / 2;
                this.vx = 0;
                break;
            }
        }
    }
    // Check right side
    else if (this.vx > 0) {
        for (let y = top; y <= bottom; y++) {
            const block = world.getBlock(right, y);
            if (block && block.type !== 'air' && block.solid) {
                this.x = right - this.width / 2;
                this.vx = 0;
                break;
            }
        }
    }
}

checkCollisionY(world) {
    const left = Math.floor(this.x - this.width / 2);
    const right = Math.floor(this.x + this.width / 2);
    const bottom = Math.floor(this.y + this.height);
    const top = Math.floor(this.y);

    this.onGround = false;

    // Check bottom (feet) - VÉRIFIER MÊME SI vy == 0
    if (this.vy >= 0) {  // ← Changé de > à >=
        for (let x = left; x <= right; x++) {
            const block = world.getBlock(x, bottom);
            if (block && block.type !== 'air' && block.solid) {
                this.y = bottom - this.height;
                this.vy = 0;
                this.onGround = true;
                this.jumping = false;
                break;
            }
        }
    }
    // Check top (head)
    else if (this.vy < 0) {
        for (let x = left; x <= right; x++) {
            const block = world.getBlock(x, top);
            if (block && block.type !== 'air' && block.solid) {
                this.y = top + 1;
                this.vy = 0;
                break;
            }
        }
    }
}


    // Détection d'une bonne cachette (beaucoup de feuilles autour + pas d'ennemi trop proche)
    isInGoodHidingSpot(world) {
        const px = Math.floor(this.x);
        const py = Math.floor(this.y);

        let leafCount = 0;
        for (let dx = -2; dx <= 2; dx++) {
            for (let dy = -3; dy <= 3; dy++) {
                if (dx === 0 && dy === 0) continue;
                const block = world.getBlock(px + dx, py + dy);
                if (block && block.type === 'leaves') {
                    leafCount++;
                }
            }
        }

        // Il faut au moins 8-10 feuilles autour pour être vraiment caché
        return leafCount >= 9;
    }

    moveLeft() {
        this.direction = -1;
        const targetSpeed = this.moveSpeed * (this.sprinting ? this.sprintMultiplier : 1);

        if (this.onGround) {
            this.vx = -targetSpeed;
        } else {
            this.vx = Math.max(this.vx - this.airControl, -this.maxVelocityX);
        }
    }

    moveRight() {
        this.direction = 1;
        const targetSpeed = this.moveSpeed * (this.sprinting ? this.sprintMultiplier : 1);

        if (this.onGround) {
            this.vx = targetSpeed;
        } else {
            this.vx = Math.min(this.vx + this.airControl, this.maxVelocityX);
        }
    }

    jump() {
        if (this.onGround) {
            this.vy = -this.jumpPower;
            this.onGround = false;
            this.jumping = true;
        }
    }

    toggleSneak() {
        this.sneaking = !this.sneaking;

        if (this.sneaking) {
            const previousHeight = this.height;
            this.height = this.crouchHeight;
            // On abaisse le joueur pour garder les pieds au sol
            this.y += previousHeight - this.crouchHeight;
        } else {
            const previousHeight = this.height;
            this.height = this.defaultHeight;
            this.y -= this.defaultHeight - previousHeight;
        }

        // Sécurité : remonter si collision plafond en se relevant
        if (!this.sneaking) {
            this.checkCollisionY(world); // world doit être passé ou accessible
        }
    }

    toggleSprint() {
        if (this.stamina > 25 && this.onGround) {
            this.sprinting = !this.sprinting;
        } else if (this.sprinting) {
            this.sprinting = false;
        }
    }

    // Méthodes d'inventaire (inchangées)
    selectNextBlock() {
        this.selectedBlockIndex = (this.selectedBlockIndex + 1) % this.inventory.length;
    }

    selectPrevBlock() {
        this.selectedBlockIndex = (this.selectedBlockIndex - 1 + this.inventory.length) % this.inventory.length;
    }

    getSelectedBlock() {
        return this.inventory[this.selectedBlockIndex];
    }

    toggleMiningMode()   { this.mode = 'mine';   return this.mode; }
    toggleBuildingMode() { this.mode = 'build';  return this.mode; }
    
    // Mettre à jour la méthode draw pour montrer le mode
    draw(ctx, offsetX, offsetY, blockSize) {
        const screenX = this.x * blockSize - offsetX;
        const screenY = this.y * blockSize - offsetY;
        const width = this.width * blockSize;
        const height = this.height * blockSize;
        
        // Corps
        ctx.fillStyle = '#3498db';
        ctx.fillRect(screenX - width / 2, screenY, width, height);
        
        // Tête
        ctx.fillStyle = '#f39c12';
        const headSize = width * 0.9;
        ctx.fillRect(screenX - headSize / 2, screenY - headSize, headSize, headSize);
        
        // Yeux
        ctx.fillStyle = '#000';
        const eyeSize = 3;
        const eyeY = screenY - headSize * 0.6;
        if (this.direction === 1) {
            ctx.fillRect(screenX + 3, eyeY, eyeSize, eyeSize);
            ctx.fillRect(screenX + 12, eyeY, eyeSize, eyeSize);
        } else {
            ctx.fillRect(screenX - 12, eyeY, eyeSize, eyeSize);
            ctx.fillRect(screenX - 3, eyeY, eyeSize, eyeSize);
        }
        
        // Bras
        ctx.fillStyle = '#3498db';
        ctx.fillRect(screenX - width, screenY + 5, width * 0.4, height * 0.5);
        ctx.fillRect(screenX + width * 0.6, screenY + 5, width * 0.4, height * 0.5);
        
        // Dessiner le bloc sélectionné dans la main
        const selectedBlock = this.getSelectedBlock();
        const handX = this.direction === 1 ? 
            screenX + width * 0.6 : 
            screenX - width * 0.6 - blockSize * 0.3;
        
        ctx.save();
        ctx.translate(handX, screenY + height * 0.3);
        
        // Rotation différente selon le mode
        const rotation = this.direction === 1 ? -0.3 : 0.3;
        ctx.rotate(rotation);
        
        // Dessiner le bloc dans la main
        const blockInfo = BLOCK_TYPES[selectedBlock];
        if (blockInfo && blockInfo.color) {
            ctx.fillStyle = blockInfo.color;
            ctx.fillRect(0, 0, blockSize * 0.3, blockSize * 0.3);
            
            // Bordure colorée selon le mode
            ctx.strokeStyle = this.mode === 'mine' ? '#ff5252' : '#3a8cff';
            ctx.lineWidth = 2;
            ctx.strokeRect(0, 0, blockSize * 0.3, blockSize * 0.3);
        }
        ctx.restore();
        
        // Barre de stamina (si en sprint)
        if (this.sprinting || this.stamina < this.maxStamina) {
            const barWidth = 50;
            const barHeight = 4;
            const barX = screenX - barWidth / 2;
            const barY = screenY - 30;
            
            // Fond
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            // Stamina
            const staminaWidth = (this.stamina / this.maxStamina) * barWidth;
            ctx.fillStyle = this.stamina > 20 ? '#2ecc71' : '#e74c3c';
            ctx.fillRect(barX, barY, staminaWidth, barHeight);
            
            // Bordure
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.strokeRect(barX, barY, barWidth, barHeight);
        }
        
        // Indicateur de sneak
        if (this.sneaking) {
            ctx.fillStyle = 'rgba(52, 152, 219, 0.5)';
            ctx.beginPath();
            ctx.arc(screenX, screenY - 40, 5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Indicateur de mode (au-dessus de la tête)
        if (this.mode) {
            ctx.fillStyle = this.mode === 'mine' ? '#ff5252' : '#3a8cff';
            ctx.beginPath();
            ctx.arc(screenX, screenY - 55, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Texte du mode
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillStyle = this.mode === 'mine' ? '#ff5252' : '#3a8cff';
            ctx.fillText(this.mode === 'mine' ? 'MINE' : 'BUILD', screenX, screenY - 65);
        }
    }
}