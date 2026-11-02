const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const assets = new AssetLoader();
let assetsLoaded = false;

function drawLoading() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "24px Arial";
    ctx.fillText("Chargement...", 120, 260);

    ctx.strokeRect(50, 300, 300, 20);
    ctx.fillRect(50, 300, 3 * assets.getProgress(), 20);

    ctx.fillText(
        assets.getProgress() + "%",
        180,
        350
    );
}

drawLoading();

// BUG FIX: assets.loadAll() était appelé sans argument → TypeError dans assetLoader
// On passe maintenant explicitement la liste ASSETS (définie dans assets.js)
assets.loadAll(ASSETS).then(() => {
    assetsLoaded = true;
    initRoad();
    gameLoop();
});


// Voiture du joueur
const player = {
    x: 180,
    y: 480,
    width: 40,
    height: 80,
    speed: 5
};

let obstacles = [];
let obstacleTimer = 0;
let obstacleInterval = 90; // plus petit = plus difficile
let gameOver = false;

let score = 0;
let difficultyTimer = 0;

let showRestart = false;
let roadLines = [];
const roadLineWidth = 10;
const roadLineHeight = 40;
const roadSpeed = 5;

let highScore = localStorage.getItem("highScore") || 0;

// BUG FIX: les clés 'car_lime' et 'car_purple' n'ont pas d'image dans ASSETS
// On les remplace par des fallback couleur (pas d'image chargée = fallback dans drawPlayer)
const carSkins = [
    { image: 'car_red',    color: '#e74c3c' },
    { image: 'car_blue',   color: '#3498db' },
    { image: 'car_yellow', color: '#f1c40f' },
    { image: null,         color: '#2ecc71' }, // lime  — pas d'image, couleur seule
    { image: null,         color: '#9b59b6' }  // purple — pas d'image, couleur seule
];

let currentSkin = 0;

let level = 1;
let levelScore = 1000;


// Touches
const keys = {
    left: false,
    right: false
};

function initRoad() {
    roadLines = [];
    for (let i = 0; i < 10; i++) {
        roadLines.push({
            x: canvas.width / 2 - roadLineWidth / 2,
            y: i * 70
        });
    }
}

function updateRoad() {
    roadLines.forEach(line => {
        line.y += roadSpeed;

        if (line.y > canvas.height) {
            line.y = -roadLineHeight;
        }
    });
}

function drawRoad() {
    ctx.fillStyle = "white";
    roadLines.forEach(line => {
        ctx.fillRect(line.x, line.y, roadLineWidth, roadLineHeight);
    });
}

// Écoute clavier
document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft")          keys.left = true;
    if (e.key === "ArrowRight")         keys.right = true;
    if (e.key === "s" || e.key === "S") {
        currentSkin = (currentSkin + 1) % carSkins.length;
    }
});

document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft")  keys.left = false;
    if (e.key === "ArrowRight") keys.right = false;
});

// Dessin voiture
function drawPlayer() {
    const skin = carSkins[currentSkin];

    // BUG FIX: skin.image peut être null (lime/purple) → on dessine un rectangle coloré
    const img = skin.image ? assets.get(skin.image) : null;

    if (img) {
        ctx.drawImage(img, player.x, player.y, player.width, player.height);
    } else {
        ctx.fillStyle = skin.color || "red";
        ctx.fillRect(player.x, player.y, player.width, player.height);
        // Pare-brise
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.fillRect(player.x + 6, player.y + 10, player.width - 12, 18);
    }
}

function drawBackground() {
    // BUG FIX: la clé 'bg1' est maintenant correctement définie dans assets.js
    const bg = assets.get('bg1');
    if (!bg) {
        // Fallback : route grise si l'image n'est pas chargée
        ctx.fillStyle = "#555";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#444";
        ctx.fillRect(60, 0, canvas.width - 120, canvas.height);
        return;
    }

    for (let x = 0; x < canvas.width; x += bg.width) {
        for (let y = 0; y < canvas.height; y += bg.height) {
            ctx.drawImage(bg, x, y);
        }
    }
}


// Mise à jour
function update() {
    if (keys.left && player.x > 0) {
        player.x -= player.speed;
    }
    if (keys.right && player.x + player.width < canvas.width) {
        player.x += player.speed;
    }
}

function updateObstacles() {
    obstacleTimer++;

    if (obstacleTimer >= obstacleInterval) {
        createObstacle();
        obstacleTimer = 0;
    }

    obstacles.forEach(obstacle => {
        obstacle.y += obstacle.speed;
    });

    // Supprimer les obstacles hors écran
    obstacles = obstacles.filter(obstacle => obstacle.y < canvas.height);

    score++;

    difficultyTimer++;

    if (difficultyTimer % 600 === 0) { // toutes les ~10 secondes
        obstacleInterval = Math.max(30, obstacleInterval - 10);

        obstacles.forEach(obstacle => {
            obstacle.speed += 0.5;
        });
    }
}

function resetGame() {
    obstacles = [];
    score = 0;
    obstacleTimer = 0;
    difficultyTimer = 0;
    obstacleInterval = 90;
    gameOver = false;
    showRestart = false;
    initRoad();
    level = 1;
    currentSkin = 0;

    player.x = 180;
}

function drawRestartButton() {
    ctx.fillStyle = "green";
    ctx.fillRect(130, 350, 140, 50);

    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText("REJOUER", 160, 382);
}


function drawScore() {
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText("Score : " + score, 10, 30);
}

function createObstacle() {
    const width = 40;
    const height = 80;
    const x = Math.random() * (canvas.width - width);

    obstacles.push({
        x: x,
        y: -height,
        width: width,
        height: height,
        speed: 4 + score * 0.001
    });
}

function drawHighScore() {
    ctx.fillStyle = "yellow";
    ctx.font = "16px Arial";
    ctx.fillText("Record : " + highScore, 10, 50);
}


function drawObstacles() {
    obstacles.forEach(obstacle => {
        // BUG FIX (bonus): on utilise la skin bleue pour l'obstacle adverse,
        // avec fallback couleur si l'image n'est pas dispo
        const img = assets.get('car_blue');
        if (img) {
            ctx.drawImage(img, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        } else {
            ctx.fillStyle = "#3498db";
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        }
    });
}

function checkCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

// BUG FIX: checkCollision() était défini mais jamais appelé → pas de game over possible
function checkCollisions() {
    for (const obstacle of obstacles) {
        if (checkCollision(player, obstacle)) {
            gameOver = true;
            if (score > highScore) {
                highScore = score;
                localStorage.setItem("highScore", highScore);
            }
            return;
        }
    }
}

function checkLevelUp() {
    if (score >= level * levelScore) {
        level++;
        obstacleInterval = Math.max(25, obstacleInterval - 10);

        currentSkin = level % carSkins.length;
    }
}


function drawGameOver() {
    ctx.fillStyle = "white";
    ctx.font = "40px Arial";
    ctx.fillText("GAME OVER", 80, 240);

    ctx.font = "20px Arial";
    ctx.fillText("Score : " + score, 140, 290);
    ctx.fillText("Record : " + highScore, 130, 320);

    showRestart = true;
}

function drawLevel() {
    ctx.fillStyle = "cyan";
    ctx.font = "16px Arial";
    ctx.fillText("Niveau : " + level, 300, 30);
}


// Boucle du jeu
function gameLoop() {
    if (!assetsLoaded) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBackground();
    updateRoad();
    drawRoad();

    if (!gameOver) {
        update();
        updateObstacles();
        checkLevelUp();
        checkCollisions(); // BUG FIX: maintenant appelé à chaque frame
        drawScore();
        drawHighScore();
        drawLevel();
        drawPlayer();
        drawObstacles();
    } else {
        drawGameOver();
        drawRestartButton();
    }

    requestAnimationFrame(gameLoop);
}

canvas.addEventListener("click", (e) => {
    if (!showRestart) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (
        mouseX >= 130 && mouseX <= 270 &&
        mouseY >= 350 && mouseY <= 400
    ) {
        resetGame();
    }
});


// Lancer le jeu
gameLoop();