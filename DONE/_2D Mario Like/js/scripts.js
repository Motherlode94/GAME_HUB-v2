// ========================================
// SUPER MARIO CLONE - SCRIPT COMPLET
// ========================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

// ========================================
// CONFIGURATION GLOBALE
// ========================================
const GRAVITY = 0.6;
const FRICTION = 0.8;
const MAX_SPEED = 8;
const JUMP_POWER = 15;
const TILE_SIZE = 40;

// ========================================
// ÉTAT DU JEU
// ========================================
const gameState = {
    score: 0,
    coins: 0,
    lives: 3,
    level: 1,
    time: 300,
    paused: false,
    gameOver: false,
    victory: false,
    powerUp: 'small' // small, big, fire
};

// ========================================
// CLASSE JOUEUR (MARIO)
// ========================================
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 32;
        this.dx = 0;
        this.dy = 0;
        this.speed = 5;
        this.jumpPower = -15;
        this.grounded = false;
        this.jumping = false;
        this.direction = 1; // 1 = droite, -1 = gauche
        this.invincible = false;
        this.invincibleTime = 0;
        this.canShoot = false;
        this.shootCooldown = 0;
        this.size = 'small';
        this.animFrame = 0;
        this.animTimer = 0;
    }

    update(keys, platforms, enemies, items, blocks) {
        // Mouvement horizontal
        if (keys['ArrowRight'] || keys['KeyD']) {
            this.dx = this.speed;
            this.direction = 1;
        } else if (keys['ArrowLeft'] || keys['KeyA']) {
            this.dx = -this.speed;
            this.direction = -1;
        } else {
            this.dx *= FRICTION;
        }

        // Limiter la vitesse
        if (Math.abs(this.dx) > MAX_SPEED) {
            this.dx = MAX_SPEED * Math.sign(this.dx);
        }

        // Saut
        if ((keys['Space'] || keys['ArrowUp'] || keys['KeyW']) && this.grounded && !this.jumping) {
            this.dy = this.jumpPower;
            this.jumping = true;
            this.grounded = false;
        }

        // Relâcher le saut
        if (!(keys['Space'] || keys['ArrowUp'] || keys['KeyW'])) {
            this.jumping = false;
        }

        // Tir (si Mario Fire)
        if (keys['KeyX'] && this.canShoot && this.shootCooldown <= 0) {
            this.shoot();
            this.shootCooldown = 20;
        }

        // Gravité
        this.dy += GRAVITY;
        if (this.dy > 20) this.dy = 20;

        // Appliquer le mouvement
        this.x += this.dx;
        this.y += this.dy;

        // Collisions avec les plateformes
        this.handlePlatformCollisions(platforms);
        
        // Collisions avec les blocs
        this.handleBlockCollisions(blocks);

        // Collisions avec les ennemis
        this.handleEnemyCollisions(enemies);

        // Collisions avec les items
        this.handleItemCollisions(items);

        // Limites de l'écran
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;

        // Tomber dans le vide
        if (this.y > canvas.height) {
            this.die();
        }

        // Invincibilité
        if (this.invincible) {
            this.invincibleTime--;
            if (this.invincibleTime <= 0) {
                this.invincible = false;
            }
        }

        // Cooldown tir
        if (this.shootCooldown > 0) {
            this.shootCooldown--;
        }

        // Animation
        this.animTimer++;
        if (this.animTimer > 8) {
            this.animFrame = (this.animFrame + 1) % 3;
            this.animTimer = 0;
        }
    }

    handlePlatformCollisions(platforms) {
        this.grounded = false;

        for (let plat of platforms) {
            if (this.x < plat.x + plat.width &&
                this.x + this.width > plat.x &&
                this.y < plat.y + plat.height &&
                this.y + this.height > plat.y) {

                // Collision du dessus
                if (this.dy > 0 && this.y + this.height - this.dy <= plat.y) {
                    this.y = plat.y - this.height;
                    this.dy = 0;
                    this.grounded = true;
                }
                // Collision du dessous
                else if (this.dy < 0 && this.y - this.dy >= plat.y + plat.height) {
                    this.y = plat.y + plat.height;
                    this.dy = 0;
                }
                // Collision latérale
                else {
                    if (this.dx > 0) {
                        this.x = plat.x - this.width;
                    } else {
                        this.x = plat.x + plat.width;
                    }
                    this.dx = 0;
                }
            }
        }
    }

    handleBlockCollisions(blocks) {
        for (let i = blocks.length - 1; i >= 0; i--) {
            const block = blocks[i];
            if (!block.active) continue;

            if (this.x < block.x + block.width &&
                this.x + this.width > block.x &&
                this.y < block.y + block.height &&
                this.y + this.height > block.y) {

                // Frapper le bloc par en dessous
                if (this.dy < 0 && this.y - this.dy >= block.y + block.height) {
                    this.y = block.y + block.height;
                    this.dy = 0;
                    block.hit();
                }
            }
        }
    }

    handleEnemyCollisions(enemies) {
        if (this.invincible) return;

        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            if (!enemy.alive) continue;

            if (this.x < enemy.x + enemy.width &&
                this.x + this.width > enemy.x &&
                this.y < enemy.y + enemy.height &&
                this.y + this.height > enemy.y) {

                // Sauter sur l'ennemi
                if (this.dy > 0 && this.y + this.height - this.dy <= enemy.y + 10) {
                    enemy.die();
                    this.dy = -10;
                    gameState.score += 100;
                } else {
                    // Touché par l'ennemi
                    this.takeDamage();
                }
            }
        }
    }

    handleItemCollisions(items) {
        for (let i = items.length - 1; i >= 0; i--) {
            const item = items[i];
            if (!item.active) continue;

            if (this.x < item.x + item.width &&
                this.x + this.width > item.x &&
                this.y < item.y + item.height &&
                this.y + this.height > item.y) {

                item.collect();
                items.splice(i, 1);
            }
        }
    }

    shoot() {
        const fireball = new Fireball(
            this.x + (this.direction > 0 ? this.width : 0),
            this.y + this.height / 2,
            this.direction
        );
        fireballs.push(fireball);
    }

    powerUp(type) {
        if (type === 'mushroom') {
            if (this.size === 'small') {
                this.size = 'big';
                this.height = 48;
                this.y -= 16;
                gameState.powerUp = 'big';
            }
            gameState.score += 1000;
        } else if (type === 'fireflower') {
            this.size = 'fire';
            this.height = 48;
            this.canShoot = true;
            gameState.powerUp = 'fire';
            gameState.score += 1000;
        } else if (type === 'star') {
            this.invincible = true;
            this.invincibleTime = 300;
            gameState.score += 1000;
        }
    }

    takeDamage() {
        if (this.invincible) return;

        if (this.size === 'fire' || this.size === 'big') {
            this.size = 'small';
            this.height = 32;
            this.canShoot = false;
            gameState.powerUp = 'small';
            this.invincible = true;
            this.invincibleTime = 60;
        } else {
            this.die();
        }
    }

    die() {
        gameState.lives--;
        if (gameState.lives <= 0) {
            gameState.gameOver = true;
        } else {
            this.reset();
        }
    }

    reset() {
        this.x = 50;
        this.y = 300;
        this.dx = 0;
        this.dy = 0;
        this.size = 'small';
        this.height = 32;
        this.canShoot = false;
        this.invincible = true;
        this.invincibleTime = 90;
    }

    draw() {
        ctx.save();

        // Clignotement si invincible
        if (this.invincible && Math.floor(this.invincibleTime / 5) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        // Couleur selon le power-up
        let color = 'red';
        if (this.size === 'fire') {
            color = 'orange';
        } else if (this.size === 'big') {
            color = 'red';
        }

        ctx.fillStyle = color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Casquette
        ctx.fillStyle = '#8B0000';
        ctx.fillRect(this.x + 5, this.y, this.width - 10, 8);

        // Moustache
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x + 8, this.y + this.height / 2, 16, 4);

        // Yeux
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x + 8, this.y + 12, 6, 6);
        ctx.fillRect(this.x + 18, this.y + 12, 6, 6);

        ctx.restore();
    }
}

// ========================================
// CLASSE ENNEMI (GOOMBA)
// ========================================
class Enemy {
    constructor(x, y, type = 'goomba') {
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 32;
        this.type = type;
        this.dx = -1;
        this.dy = 0;
        this.alive = true;
        this.deathTimer = 0;
    }

    update(platforms) {
        if (!this.alive) {
            this.deathTimer++;
            if (this.deathTimer > 30) {
                return false;
            }
            return true;
        }

        this.dy += GRAVITY;
        this.x += this.dx;
        this.y += this.dy;

        // Collisions avec plateformes
        for (let plat of platforms) {
            if (this.x < plat.x + plat.width &&
                this.x + this.width > plat.x &&
                this.y < plat.y + plat.height &&
                this.y + this.height > plat.y) {

                if (this.dy > 0) {
                    this.y = plat.y - this.height;
                    this.dy = 0;
                }

                // Inverser direction aux bords
                if (this.dx > 0 && this.x + this.width >= plat.x + plat.width) {
                    this.dx = -1;
                } else if (this.dx < 0 && this.x <= plat.x) {
                    this.dx = 1;
                }
            }
        }

        // Tomber dans le vide
        if (this.y > canvas.height) {
            return false;
        }

        return true;
    }

    die() {
        this.alive = false;
        this.height = 10;
    }

    draw() {
        if (!this.alive) {
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            return;
        }

        // Corps
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Yeux
        ctx.fillStyle = '#FFF';
        ctx.fillRect(this.x + 6, this.y + 8, 8, 8);
        ctx.fillRect(this.x + 18, this.y + 8, 8, 8);

        ctx.fillStyle = '#000';
        ctx.fillRect(this.x + 9, this.y + 11, 4, 4);
        ctx.fillRect(this.x + 21, this.y + 11, 4, 4);

        // Pieds
        ctx.fillStyle = '#654321';
        ctx.fillRect(this.x, this.y + this.height - 8, 12, 8);
        ctx.fillRect(this.x + 20, this.y + this.height - 8, 12, 8);
    }
}

// ========================================
// CLASSE BLOC
// ========================================
class Block {
    constructor(x, y, type = 'brick') {
        this.x = x;
        this.y = y;
        this.width = TILE_SIZE;
        this.height = TILE_SIZE;
        this.type = type; // brick, question, empty
        this.active = true;
        this.contents = null;
        this.bounceOffset = 0;
    }

    hit() {
        if (!this.active) return;

        this.bounceOffset = 10;

        if (this.type === 'question') {
            if (this.contents) {
                this.spawnItem();
            }
            this.type = 'empty';
            gameState.score += 100;
        } else if (this.type === 'brick') {
            if (gameState.powerUp !== 'small') {
                this.active = false;
                gameState.score += 50;
                particles.push(new Particle(this.x, this.y, '#8B4513'));
            }
        }
    }

    spawnItem() {
        let item;
        if (this.contents === 'coin') {
            gameState.coins++;
            gameState.score += 100;
            particles.push(new Particle(this.x, this.y - 20, '#FFD700'));
        } else if (this.contents === 'mushroom') {
            item = new Item(this.x, this.y - TILE_SIZE, 'mushroom');
            items.push(item);
        } else if (this.contents === 'fireflower') {
            item = new Item(this.x, this.y - TILE_SIZE, 'fireflower');
            items.push(item);
        } else if (this.contents === 'star') {
            item = new Item(this.x, this.y - TILE_SIZE, 'star');
            items.push(item);
        }
    }

    update() {
        if (this.bounceOffset > 0) {
            this.bounceOffset -= 2;
        }
    }

    draw() {
        if (!this.active) return;

        const y = this.y - this.bounceOffset;

        if (this.type === 'brick') {
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(this.x, y, this.width, this.height);
            ctx.strokeStyle = '#654321';
            ctx.strokeRect(this.x, y, this.width, this.height);
            
            // Motif de brique
            ctx.strokeStyle = '#A0522D';
            ctx.beginPath();
            ctx.moveTo(this.x, y + this.height / 2);
            ctx.lineTo(this.x + this.width, y + this.height / 2);
            ctx.stroke();
        } else if (this.type === 'question') {
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(this.x, y, this.width, this.height);
            ctx.strokeStyle = '#FFA500';
            ctx.strokeRect(this.x, y, this.width, this.height);
            
            // Point d'interrogation
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 28px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('?', this.x + this.width / 2, y + this.height / 2);
        } else if (this.type === 'empty') {
            ctx.fillStyle = '#8B7355';
            ctx.fillRect(this.x, y, this.width, this.height);
            ctx.strokeStyle = '#654321';
            ctx.strokeRect(this.x, y, this.width, this.height);
        }
    }
}

// ========================================
// CLASSE ITEM
// ========================================
class Item {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 32;
        this.type = type;
        this.active = true;
        this.dx = 1;
        this.dy = 0;
        this.emerging = true;
        this.emergeTimer = 0;
    }

    update(platforms) {
        if (this.emerging) {
            this.emergeTimer++;
            this.y -= 1;
            if (this.emergeTimer > 30) {
                this.emerging = false;
            }
            return;
        }

        this.dy += GRAVITY;
        this.x += this.dx;
        this.y += this.dy;

        // Collisions
        for (let plat of platforms) {
            if (this.x < plat.x + plat.width &&
                this.x + this.width > plat.x &&
                this.y < plat.y + plat.height &&
                this.y + this.height > plat.y) {

                if (this.dy > 0) {
                    this.y = plat.y - this.height;
                    this.dy = 0;
                }

                if ((this.dx > 0 && this.x + this.width >= plat.x + plat.width) ||
                    (this.dx < 0 && this.x <= plat.x)) {
                    this.dx *= -1;
                }
            }
        }

        if (this.y > canvas.height) {
            this.active = false;
        }
    }

    collect() {
        player.powerUp(this.type);
        this.active = false;
    }

    draw() {
        if (this.type === 'mushroom') {
            // Chapeau rouge avec points blancs
            ctx.fillStyle = '#FF0000';
            ctx.beginPath();
            ctx.arc(this.x + 16, this.y + 12, 14, Math.PI, 0);
            ctx.fill();
            
            ctx.fillStyle = '#FFF';
            ctx.beginPath();
            ctx.arc(this.x + 10, this.y + 10, 4, 0, Math.PI * 2);
            ctx.arc(this.x + 22, this.y + 10, 4, 0, Math.PI * 2);
            ctx.fill();

            // Pied blanc
            ctx.fillStyle = '#FFF';
            ctx.fillRect(this.x + 10, this.y + 12, 12, 16);
        } else if (this.type === 'fireflower') {
            // Tige verte
            ctx.fillStyle = '#00FF00';
            ctx.fillRect(this.x + 14, this.y + 12, 4, 16);

            // Pétales rouges
            ctx.fillStyle = '#FF0000';
            for (let i = 0; i < 4; i++) {
                const angle = (i / 4) * Math.PI * 2;
                const px = this.x + 16 + Math.cos(angle) * 8;
                const py = this.y + 8 + Math.sin(angle) * 8;
                ctx.beginPath();
                ctx.arc(px, py, 6, 0, Math.PI * 2);
                ctx.fill();
            }

            // Centre jaune
            ctx.fillStyle = '#FFFF00';
            ctx.beginPath();
            ctx.arc(this.x + 16, this.y + 8, 4, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'star') {
            ctx.fillStyle = '#FFD700';
            ctx.save();
            ctx.translate(this.x + 16, this.y + 16);
            ctx.rotate(Date.now() / 200);
            
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
                const x = Math.cos(angle) * 12;
                const y = Math.sin(angle) * 12;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);

                const innerAngle = angle + Math.PI / 5;
                const ix = Math.cos(innerAngle) * 6;
                const iy = Math.sin(innerAngle) * 6;
                ctx.lineTo(ix, iy);
            }
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }
}

// ========================================
// CLASSE FIREBALL
// ========================================
class Fireball {
    constructor(x, y, direction) {
        this.x = x;
        this.y = y;
        this.width = 16;
        this.height = 16;
        this.dx = direction * 8;
        this.dy = -3;
        this.active = true;
        this.bounces = 0;
    }

    update(platforms, enemies) {
        this.dy += GRAVITY;
        this.x += this.dx;
        this.y += this.dy;

        // Collisions avec plateformes
        for (let plat of platforms) {
            if (this.x < plat.x + plat.width &&
                this.x + this.width > plat.x &&
                this.y < plat.y + plat.height &&
                this.y + this.height > plat.y) {

                if (this.dy > 0) {
                    this.y = plat.y - this.height;
                    this.dy = -8;
                    this.bounces++;
                    if (this.bounces > 3) {
                        this.active = false;
                    }
                }
            }
        }

        // Collisions avec ennemis
        for (let enemy of enemies) {
            if (!enemy.alive) continue;

            if (this.x < enemy.x + enemy.width &&
                this.x + this.width > enemy.x &&
                this.y < enemy.y + enemy.height &&
                this.y + this.height > enemy.y) {

                enemy.die();
                this.active = false;
                gameState.score += 200;
            }
        }

        // Hors écran
        if (this.x < 0 || this.x > canvas.width || this.y > canvas.height) {
            this.active = false;
        }
    }

    draw() {
        ctx.fillStyle = '#FF4500';
        ctx.beginPath();
        ctx.arc(this.x + 8, this.y + 8, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.arc(this.x + 8, this.y + 8, 5, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ========================================
// CLASSE PARTICULE
// ========================================
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.dx = (Math.random() - 0.5) * 4;
        this.dy = -Math.random() * 8;
        this.color = color;
        this.life = 30;
        this.size = 8;
    }

    update() {
        this.dy += GRAVITY;
        this.x += this.dx;
        this.y += this.dy;
        this.life--;
        return this.life > 0;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }
}

// ========================================
// DRAPEAU DE FIN
// ========================================
class Flag {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 10;
        this.height = 200;
        this.poleHeight = 200;
        this.flagHeight = 40;
        this.flagWidth = 50;
    }

    checkCollision(player) {
        if (player.x + player.width > this.x &&
            player.x < this.x + this.width &&
            player.y < this.y + this.poleHeight) {
            gameState.victory = true;
            gameState.score += 5000;
        }
    }

    draw() {
        // Poteau
        ctx.fillStyle = '#228B22';
        ctx.fillRect(this.x, this.y, this.width, this.poleHeight);

        // Drapeau
        ctx.fillStyle = '#00FF00';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width, this.y + 10);
        ctx.lineTo(this.x + this.width + this.flagWidth, this.y + 10);
        ctx.lineTo(this.x + this.width + this.flagWidth - 10, this.y + 30);
        ctx.lineTo(this.x + this.width, this.y + 50);
        ctx.closePath();
        ctx.fill();

        // Boule en haut
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(this.x + 5, this.y, 8, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ========================================
// INITIALISATION DU NIVEAU
// ========================================
let player;
let platforms = [];
let enemies = [];
let blocks = [];
let items = [];
let fireballs = [];
let particles = [];
let flag;
let keys = {};

function initLevel() {
    player = new Player(50, 300);
    platforms = [];
    enemies = [];
    blocks = [];
    items = [];
    fireballs = [];
    particles = [];

    // Sol
    platforms.push({ x: 0, y: 560, width: 3000, height: 40 });

    // Plateformes variées
    platforms.push({ x: 200, y: 480, width: 120, height: 20 });
    platforms.push({ x: 400, y: 400, width: 120, height: 20 });
    platforms.push({ x: 600, y: 320, width: 120, height: 20 });
    platforms.push({ x: 800, y: 400, width: 120, height: 20 });
    platforms.push({ x: 1000, y: 480, width: 120, height: 20 });
    platforms.push({ x: 1200, y: 360, width: 120, height: 20 });
    platforms.push({ x: 1400, y: 440, width: 120, height: 20 });
    platforms.push({ x: 1600, y: 380, width: 120, height: 20 });

    // Blocs
    // Briques et blocs mystère
    for (let i = 0; i < 5; i++) {
        const block = new Block(300 + i * 45, 300, 'brick');
        blocks.push(block);
    }

    const questionBlock1 = new Block(345, 300, 'question');
    questionBlock1.contents = 'coin';
    blocks.push(questionBlock1);

    const questionBlock2 = new Block(525, 200, 'question');
    questionBlock2.contents = 'mushroom';
    blocks.push(questionBlock2);

    const questionBlock3 = new Block(750, 240, 'question');
    questionBlock3.contents = 'fireflower';
    blocks.push(questionBlock3);

    const questionBlock4 = new Block(1100, 200, 'question');
    questionBlock4.contents = 'star';
    blocks.push(questionBlock4);

    // Plus de blocs
    for (let i = 0; i < 3; i++) {
        blocks.push(new Block(900 + i * 45, 280, 'brick'));
    }

    // Ennemis
    enemies.push(new Enemy(350, 300, 'goomba'));
    enemies.push(new Enemy(550, 300, 'goomba'));
    enemies.push(new Enemy(850, 300, 'goomba'));
    enemies.push(new Enemy(1250, 300, 'goomba'));
    enemies.push(new Enemy(1500, 300, 'goomba'));

    // Drapeau de fin
    flag = new Flag(1750, 360);

    // Réinitialiser le temps
    gameState.time = 300;
}

// ========================================
// BOUCLE PRINCIPALE
// ========================================
function update() {
    if (gameState.paused || gameState.gameOver || gameState.victory) return;

    // Mise à jour du joueur
    player.update(keys, platforms, enemies, items, blocks);

    // Mise à jour des ennemis
    for (let i = enemies.length - 1; i >= 0; i--) {
        if (!enemies[i].update(platforms)) {
            enemies.splice(i, 1);
        }
    }

    // Mise à jour des blocs
    for (let block of blocks) {
        block.update();
    }

    // Mise à jour des items
    for (let i = items.length - 1; i >= 0; i--) {
        items[i].update(platforms);
        if (!items[i].active) {
            items.splice(i, 1);
        }
    }

    // Mise à jour des fireballs
    for (let i = fireballs.length - 1; i >= 0; i--) {
        fireballs[i].update(platforms, enemies);
        if (!fireballs[i].active) {
            fireballs.splice(i, 1);
        }
    }

    // Mise à jour des particules
    for (let i = particles.length - 1; i >= 0; i--) {
        if (!particles[i].update()) {
            particles.splice(i, 1);
        }
    }

    // Vérifier le drapeau
    flag.checkCollision(player);
}

function draw() {
    // Fond
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#5C9FD8');
    gradient.addColorStop(1, '#87CEEB');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Nuages
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let i = 0; i < 5; i++) {
        const x = (i * 200 + Date.now() / 50) % canvas.width;
        ctx.beginPath();
        ctx.arc(x, 80 + i * 30, 30, 0, Math.PI * 2);
        ctx.arc(x + 25, 80 + i * 30, 35, 0, Math.PI * 2);
        ctx.arc(x + 50, 80 + i * 30, 30, 0, Math.PI * 2);
        ctx.fill();
    }

    // Plateformes
    ctx.fillStyle = '#228B22';
    for (let plat of platforms) {
        ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
        
        // Bordure herbe
        ctx.fillStyle = '#32CD32';
        ctx.fillRect(plat.x, plat.y, plat.width, 5);
        ctx.fillStyle = '#228B22';
    }

    // Blocs
    for (let block of blocks) {
        block.draw();
    }

    // Items
    for (let item of items) {
        item.draw();
    }

    // Ennemis
    for (let enemy of enemies) {
        enemy.draw();
    }

    // Fireballs
    for (let fireball of fireballs) {
        fireball.draw();
    }

    // Particules
    for (let particle of particles) {
        particle.draw();
    }

    // Drapeau
    flag.draw();

    // Joueur
    player.draw();

    // HUD
    drawHUD();

    // Écrans de fin
    if (gameState.gameOver) {
        drawGameOver();
    } else if (gameState.victory) {
        drawVictory();
    }
}

function drawHUD() {
    ctx.fillStyle = '#000';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'left';
    
    // Score
    ctx.fillText(`SCORE: ${gameState.score}`, 10, 30);
    
    // Pièces
    ctx.fillText(`💰 × ${gameState.coins}`, 200, 30);
    
    // Vies
    ctx.fillText(`❤️ × ${gameState.lives}`, 350, 30);
    
    // Temps
    const timeColor = gameState.time < 30 ? '#FF0000' : '#000';
    ctx.fillStyle = timeColor;
    ctx.fillText(`TIME: ${Math.floor(gameState.time)}`, 500, 30);
    
    // Niveau
    ctx.fillStyle = '#000';
    ctx.fillText(`WORLD 1-${gameState.level}`, 680, 30);
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#FF0000';
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 40);
    
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 30px Arial';
    ctx.fillText(`Score Final: ${gameState.score}`, canvas.width / 2, canvas.height / 2 + 20);
    ctx.fillText('Appuyez sur R pour recommencer', canvas.width / 2, canvas.height / 2 + 70);
}

function drawVictory() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('VICTOIRE!', canvas.width / 2, canvas.height / 2 - 40);
    
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 30px Arial';
    ctx.fillText(`Score Final: ${gameState.score}`, canvas.width / 2, canvas.height / 2 + 20);
    ctx.fillText('Appuyez sur R pour recommencer', canvas.width / 2, canvas.height / 2 + 70);
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// ========================================
// GESTION DES ENTRÉES
// ========================================
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    
    if (e.code === 'KeyR' && (gameState.gameOver || gameState.victory)) {
        gameState.gameOver = false;
        gameState.victory = false;
        gameState.score = 0;
        gameState.coins = 0;
        gameState.lives = 3;
        gameState.level = 1;
        initLevel();
    }
    
    if (e.code === 'KeyP') {
        gameState.paused = !gameState.paused;
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// ========================================
// TIMER DU JEU
// ========================================
setInterval(() => {
    if (!gameState.paused && !gameState.gameOver && !gameState.victory) {
        gameState.time -= 1;
        if (gameState.time <= 0) {
            player.die();
            gameState.time = 300;
        }
    }
}, 1000);

// ========================================
// DÉMARRAGE
// ========================================
initLevel();
gameLoop();