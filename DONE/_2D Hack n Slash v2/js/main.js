// main.js

let gameMode = 'survival'; // 'survival', 'timeAttack', 'bossRush', 'endless'

// Initialisation
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const gameContainer = document.getElementById('gameContainer');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const gameOverScreen = document.getElementById('gameOver');
const winScreen = document.getElementById('win');

// Chargement des sprites
const playerImg = new Image();
playerImg.src = 'assets/sprites/player.png';

const enemyNormalImg = new Image();
enemyNormalImg.src = 'assets/sprites/enemy_normal.png';

const enemyFastImg = new Image();
enemyFastImg.src = 'assets/sprites/enemy_fast.png';

const enemyTankImg = new Image();
enemyTankImg.src = 'assets/sprites/enemy_tank.png';

const enemyBossImg = new Image();
enemyBossImg.src = 'assets/sprites/enemy_boss.png';

// Attendre le chargement des images
let imagesLoaded = 0;
const totalImages = 5;
[playerImg, enemyNormalImg, enemyFastImg, enemyTankImg, enemyBossImg].forEach(img => {
    img.onload = () => {
        imagesLoaded++;
        if (imagesLoaded === totalImages) {
            console.log('Sprites chargés !');
        }
    };
});

// Variables globales
let player;
let enemies = [];
let particles = [];
let pickups = [];
let projectiles = [];
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
let hitStopFrames = 0; // Correction: variable manquante

// Fonctions de jeu
function initLevel() {
    enemiesToSpawn = calculateEnemiesForLevel();
    spawnTimer = 0;
    enemies = [];
    levelComplete = false;
    levelCompleteTimer = 0;
    
    if (gameMode === 'timeAttack') {
        levelCompleteTimer = 180; // 3 secondes pour commencer
    }
    
    updateUI();
}

function startGame() {
    resetGame();
    gameState = 'playing';
    gameContainer.style.display = 'block';
    gameOverScreen.style.display = 'none';
    winScreen.style.display = 'none';
    startButton.style.display = 'none';
    restartButton.style.display = 'inline-flex';
}

function setGameMode(mode) {
    gameMode = mode;
    resetGame();
    
    // Messages selon le mode
    let modeText = '';
    switch(mode) {
        case 'survival':
            modeText = 'MODE SURVIE: Survivez à 15 vagues!';
            break;
        case 'timeAttack':
            modeText = 'MODE CONTRE LA MONTRE: Tuez le plus vite!';
            break;
        case 'bossRush':
            modeText = 'MODE BOSS: Affrontez des boss puissants!';
            break;
        case 'endless':
            modeText = 'MODE INFINI: Survivez le plus longtemps!';
            break;
    }
    
    experiencePopups.push({
        x: canvas.width / 2,
        y: canvas.height / 2 - 50,
        text: modeText,
        timer: 180,
        color: '#ffff00'
    });
}


function calculateEnemiesForLevel() {
    let base = 8 + level * 2;
    
    switch(gameMode) {
        case 'survival':
            if (level % 5 === 0) return 1; // Un boss
            if (level % 3 === 0) base = Math.floor(base * 0.8);
            return base;
            
        case 'timeAttack':
            // Moins d'ennemis mais plus forts
            base = 5 + level;
            if (level % 3 === 0) return 1; // Boss tous les 3 niveaux
            return base;
            
        case 'bossRush':
            // Uniquement des boss
            if (level <= 5) return 1;
            if (level <= 10) return 2;
            return 3; // 3 boss en même temps après le niveau 10
            
        case 'endless':
            // Ennemis progressivement plus nombreux
            base = 10 + Math.floor(level * 1.5);
            if (level % 10 === 0) return 1; // Boss tous les 10 niveaux
            return base;
    }
    return base;
}

function spawnEnemy() {
    let type = 'normal';
    
    if (gameMode === 'bossRush') {
        type = 'boss';
    } else if (level % 5 === 0 && enemiesToSpawn === 1) {
        type = 'boss';
    } else {
        const rand = Math.random();
        // Ajuster les probabilités selon le mode
        let fastChance = 0.2;
        let tankChance = 0.15;
        
        if (gameMode === 'timeAttack') {
            fastChance = 0.4; // Plus d'ennemis rapides
        } else if (gameMode === 'endless') {
            if (level > 20) {
                fastChance = 0.3;
                tankChance = 0.3;
            }
        }
        
        if (level > 3 && rand < fastChance) {
            type = 'fast';
        } else if (level > 6 && rand < tankChance) {
            type = 'tank';
        } else if (level > 9 && rand < 0.1) {
            type = Math.random() < 0.5 ? 'fast' : 'tank';
        }
    }
    
    enemies.push(new Enemy(level, type));
}

let timeAttackTimer = 0;
let timeAttackMaxTime = 1200;

function updateUI() {
    document.getElementById('score').textContent = `Score: ${score}`;
    document.getElementById('level').textContent =
        `Niveau: ${player.progression.level}`;

    let hearts = '';
    for (let i = 0; i < player.stats.maxHealth; i++) {
        hearts += player.stats.health > i ? '❤️' : '💔';
    }

    const expPercent = Math.min(
        100,
        (player.progression.experience /
            player.progression.experienceToNextLevel) * 100
    );

    document.getElementById('health').innerHTML =
        `${hearts} <span style="color:#0088ff;margin-left:10px;">
        Lvl ${player.progression.level}</span>` +
        `<div style="width:100px;height:6px;background:#333;margin-top:5px;border-radius:3px;">
            <div style="width:${expPercent}%;height:100%;
            background:linear-gradient(90deg,#0088ff,#00ffff);
            border-radius:3px;"></div>
        </div>`;
}


function showGameOver() {
    document.getElementById('finalScore').textContent = score;
    gameOverScreen.style.display = 'block';
    winScreen.style.display = 'none';
    gameState = 'gameover';

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
    winScreen.style.display = 'block';
    gameOverScreen.style.display = 'none';
    gameState = 'won';
}
function update() {
    if (hitStopFrames > 0) {
        hitStopFrames--;
        return;
    }
    
    if (gameState !== 'playing') return;

    gameTime++;
    
    // Timer pour Time Attack
    if (gameMode === 'timeAttack') {
        timeAttackTimer++;
        if (timeAttackTimer >= timeAttackMaxTime) {
            showGameOver();
            return;
        }
    }
    
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
    if (player.stats.takeDamage(1)) {
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
    
    enemies = enemies.filter(enemy => {
        enemy.update(player);
        
        // Collision joueur-ennemi
        const dx = player.pos.x - enemy.pos.x;
        const dy = player.pos.y - enemy.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < player.radius + enemy.radius) {
            if (player.stats.takeDamage(enemy.damage)) {
                showGameOver();
                return true;
            }
            
            // Knockback
            if (!player.dash.dashing) {
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
                    player.stats.heal(2);
                    createExperiencePopup(pickup.pos.x, pickup.pos.y, '+2 HP');
                    break;
                case 'experience':
                    player.progression.addXP(50);
                    break;
                case 'special':
                    player.progression.addSpecial(40);
                    createExperiencePopup(pickup.pos.x, pickup.pos.y, '+40 SPECIAL');
                    break;
                case 'speed':
                    player.movement.baseSpeed += 0.5;
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
        player.progression.addXP(level * 20);
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

    projectiles = projectiles.filter(p => p.update());
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

    pickups.forEach(pickup => pickup.draw(ctx));
    projectiles.forEach(p => p.draw(ctx));

    enemies.forEach(enemy => {
        enemy.draw(ctx);

        enemy.projectiles.forEach(proj => {
            ctx.save();
            ctx.fillStyle = proj.color || '#ff5555';
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(proj.pos.x, proj.pos.y, proj.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#ff8888';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(proj.pos.x, proj.pos.y);
            ctx.lineTo(proj.pos.x - proj.vel.x * 3, proj.pos.y - proj.vel.y * 3);
            ctx.stroke();
            ctx.restore();
        });
    });

    if (player) {
        player.draw(ctx);
    }

    if (player && gameMode === 'timeAttack') {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(canvas.width / 2 - 100, 10, 200, 40);

        const timeLeft = timeAttackMaxTime - timeAttackTimer;
        const seconds = Math.floor(timeLeft / 60);
        const percent = timeLeft / timeAttackMaxTime;

        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = percent > 0.5 ? '#00ff00' : percent > 0.2 ? '#ffff00' : '#ff0000';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 5;
        ctx.fillText(`TEMPS: ${seconds}s`, canvas.width / 2, 35);

        ctx.fillStyle = '#333333';
        ctx.fillRect(canvas.width / 2 - 90, 45, 180, 10);
        ctx.fillStyle = percent > 0.5 ? '#00ff00' : percent > 0.2 ? '#ffff00' : '#ff0000';
        ctx.fillRect(canvas.width / 2 - 90, 45, 180 * percent, 10);

        ctx.shadowBlur = 0;
        ctx.restore();
    }

    if (player && player.weaponSystem.attacking) {
        const angle = Math.atan2(player.facing.y, player.facing.x);
        ctx.save();
        ctx.translate(player.pos.x, player.pos.y);
        ctx.rotate(angle);

        const attackLength = 55 + player.combo * 0.8;
        const attackColor =
            player.combo > 15 ? '#ff5500' :
            player.combo > 8 ? '#ffff00' :
            '#ffffff';

        ctx.shadowColor = attackColor;
        ctx.shadowBlur = 30;
        ctx.strokeStyle = 'rgba(255, 255, 200, 0.8)';
        ctx.lineWidth = player.combo > 15 ? 12 : player.combo > 8 ? 10 : 8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(18, 0);
        ctx.lineTo(attackLength, 0);
        ctx.stroke();

        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(255, 200, 100, 0.4)';
        ctx.beginPath();
        ctx.moveTo(15, -3);
        ctx.quadraticCurveTo(attackLength / 2, -8, attackLength, -3);
        ctx.moveTo(15, 3);
        ctx.quadraticCurveTo(attackLength / 2, 8, attackLength, 3);
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.restore();
    }

    particles.forEach(particle => particle.draw(ctx));

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

    if (player && levelComplete) {
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = '#000000';
        ctx.fillRect(canvas.width / 2 - 200, canvas.height / 2 - 60, 400, 120);

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
            ctx.fillText(`Début dans ${Math.ceil(levelCompleteTimer / 60)}`, canvas.width / 2, canvas.height / 2 + 60);
        }

        ctx.shadowBlur = 0;
        ctx.restore();
    }
    
    // Stats en bas
    if (player) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(10, canvas.height - 90, 250, 80);

        ctx.font = '14px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText(`Ennemis tués: ${player.rewards.killCount}`, 20, canvas.height - 70);
        ctx.fillText(`Combo max: ${player.combo}`, 20, canvas.height - 50);
        ctx.fillText(`Temps: ${Math.floor(gameTime / 60)}s`, 20, canvas.height - 30);

        ctx.fillText(
            `Vitesse: ${player.movement.baseSpeed.toFixed(1)}`,
            150,
            canvas.height - 70
        );
        ctx.fillText(`Niveau: ${player.level}`, 150, canvas.height - 50);
        ctx.fillText(`Spécial: ${Math.floor(player.specialCharge)}%`, 150, canvas.height - 30);
        ctx.restore();
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Contrôles clavier
document.addEventListener('keydown', (e) => {
    keys[e.code] = true;

    const preventKeys = [
        'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
        'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD',
        'KeyJ', 'KeyK', 'KeyE', 'ShiftLeft', 'KeyL'
    ];

    if (preventKeys.includes(e.code)) {
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// Boutons UI
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

document
    .querySelectorAll('#gameOver button, #win button')
    .forEach((button) => {
        button.addEventListener('click', startGame);
    });

// Contrôles tactiles pour mobile
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();

    if (!player) return;

    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    touchStartX = touch.clientX - rect.left;
    touchStartY = touch.clientY - rect.top;

    if (touchStartX < canvas.width / 2) {
        const dir = new Vector(
            touchStartX - player.pos.x,
            touchStartY - player.pos.y
        ).normalize();

        keys['ArrowRight'] = dir.x > 0.3;
        keys['ArrowLeft'] = dir.x < -0.3;
        keys['ArrowDown'] = dir.y > 0.3;
        keys['ArrowUp'] = dir.y < -0.3;
    } else {
        if (touchStartY < canvas.height / 2) {
            keys['Space'] = true;
        } else {
            keys['ShiftLeft'] = true;
        }
    }
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();

    if (!player || !e.touches[0]) return;

    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    if (x < canvas.width / 2) {
        const dir = new Vector(x - player.pos.x, y - player.pos.y).normalize();

        keys['ArrowRight'] = dir.x > 0.3;
        keys['ArrowLeft'] = dir.x < -0.3;
        keys['ArrowDown'] = dir.y > 0.3;
        keys['ArrowUp'] = dir.y < -0.3;
    }
});

canvas.addEventListener('touchend', () => {
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
    projectiles = [];
    shockwaves = [];
    damageNumbers = [];
    scorePopups = [];
    experiencePopups = [];
    levelUpMessages = [];
    keys = {};
    score = 0;
    level = 1;
    gameState = 'playing';
    enemiesToSpawn = 0;
    spawnTimer = 0;
    levelComplete = false;
    levelCompleteTimer = 0;
    gameTime = 0;
    timeAttackTimer = 0;
    hitStopFrames = 0;

    gameOverScreen.style.display = 'none';
    winScreen.style.display = 'none';

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

gameState = 'menu';
gameLoop();