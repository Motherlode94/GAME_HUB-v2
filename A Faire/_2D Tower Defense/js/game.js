let canvas, ctx;
let lastTime = 0;
let scoreSyncTimer = 0;

const TD_AI_PROFILES = {
    magnat: { label: 'Magnat', upgradeCadenceSec: 2.4, maxPerTick: 1 },
    guerrier: { label: 'Guerrier', upgradeCadenceSec: 1.4, maxPerTick: 2 },
    scientifique: { label: 'Scientifique', upgradeCadenceSec: 1.8, maxPerTick: 1 },
    pacifique: { label: 'Pacifique', upgradeCadenceSec: 2.2, maxPerTick: 1 },
    neutre: { label: 'Neutre', upgradeCadenceSec: 1.9, maxPerTick: 1 }
};

let gameState = {
    money: STARTING_MONEY,
    lives: STARTING_LIVES,
    placingTower: false,
    selectedTower: null,
    selectedTowers: [],
    selectedTowerType: 'BASIC',
    gameOver: false,
    waveComplete: false,
    paused: false,
    hoveredTile: { x: -1, y: -1 },
    score: 0,
    killCount: 0,
    highScore: parseInt(localStorage.getItem('tdHighScore') || '0'),
    aiProfile: 'neutre',
    aiAutoUpgrade: true,
    aiUpgradeTimer: 0
};

function getAiProfile() {
    return TD_AI_PROFILES[gameState.aiProfile] || TD_AI_PROFILES.neutre;
}

function cycleAiProfile() {
    const keys = Object.keys(TD_AI_PROFILES);
    const index = keys.indexOf(gameState.aiProfile);
    gameState.aiProfile = keys[(index + 1) % keys.length];
    gameState.aiUpgradeTimer = 0;
}

function toggleAutoUpgrade() {
    gameState.aiAutoUpgrade = !gameState.aiAutoUpgrade;
}

function setSelectedTowers(nextSelection) {
    gameState.selectedTowers = Array.isArray(nextSelection) ? nextSelection.filter(Boolean) : [];
    gameState.selectedTower = gameState.selectedTowers.length ? gameState.selectedTowers[0] : null;
}

function toggleTowerInSelection(tower) {
    if (!tower) return;
    const list = gameState.selectedTowers.slice();
    const index = list.indexOf(tower);
    if (index >= 0) {
        list.splice(index, 1);
    } else {
        list.push(tower);
    }
    setSelectedTowers(list);
}

function selectTowersByType(type) {
    setSelectedTowers(towers.filter((tower) => tower.type === type));
}

function cycleTowerType() {
    const keys = Object.keys(TOWER_TYPES);
    const index = keys.indexOf(gameState.selectedTowerType);
    gameState.selectedTowerType = keys[(index + 1) % keys.length];
}

function runAutoTowerManager(deltaTime) {
    if (!gameState.aiAutoUpgrade || gameState.paused || gameState.gameOver) return;
    if (!Array.isArray(towers) || towers.length === 0) return;

    gameState.aiUpgradeTimer += deltaTime;
    const profile = getAiProfile();
    const cadenceMs = profile.upgradeCadenceSec * 1000;
    if (gameState.aiUpgradeTimer < cadenceMs) return;
    gameState.aiUpgradeTimer = 0;

    const candidatePool = towers
        .slice()
        .sort((a, b) => (a.level || 1) - (b.level || 1));

    let remaining = Math.max(1, Number(profile.maxPerTick) || 1);
    for (let i = 0; i < candidatePool.length && remaining > 0; i += 1) {
        const candidate = candidatePool[i];
        if (upgradeTower(candidate, gameState.aiProfile)) {
            remaining -= 1;
        }
    }
}

function gameLoop(time) {
    if (!lastTime) lastTime = time;
    const deltaTime = (time - lastTime) * GAME_SPEED;
    lastTime = time;

    if (!gameState.gameOver && !gameState.paused) {
        update(deltaTime);
    }

    draw();
    requestAnimationFrame(gameLoop);
}

function update(deltaTime) {
    updateWave(deltaTime);
    updateEnemies(deltaTime);
    updateTowers(deltaTime);
    updateProjectiles(deltaTime);
    updateParticles(deltaTime);
    runAutoTowerManager(deltaTime);

    scoreSyncTimer += deltaTime;
    if (scoreSyncTimer >= 900) {
        scoreSyncTimer = 0;
        syncCatalogScore();
    }

    if (gameState.lives <= 0) {
        gameState.gameOver = true;
        if (gameState.score > gameState.highScore) {
            gameState.highScore = gameState.score;
            localStorage.setItem('tdHighScore', gameState.score);
        }
    }
}

function syncCatalogScore() {
    window.gameState = window.gameState || {};
    const currentScore = Math.max(0, Math.floor(gameState.score || 0));
    window.gameState.score = Math.max(Math.floor(window.gameState.score || 0), currentScore);
    if (window.CatalogScore && typeof window.CatalogScore.capture === 'function') {
        window.CatalogScore.capture();
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawMap(ctx);
    drawParticles(ctx);
    drawEnemies(ctx);
    drawTowers(ctx);
    drawProjectiles(ctx);

    if (gameState.placingTower) {
        drawTowerPlacementPreview(ctx);
    }

    drawGameUI(ctx);
    drawSelectionOverlay(ctx);
    updateHTMLStats();

    if (gameState.paused && !gameState.gameOver) {
        drawPauseScreen();
    }

    if (gameState.gameOver) {
        drawGameOver(ctx);
    }
}

function drawSelectionOverlay(ctx) {
    if (!gameState.selectedTowers.length) return;

    const x = 20;
    const y = 20;
    const w = 300;
    const h = 110;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    const grouped = {};
    gameState.selectedTowers.forEach((tower) => {
        grouped[tower.type] = (grouped[tower.type] || 0) + 1;
    });

    const compact = Object.keys(grouped)
        .map((key) => `${key}:${grouped[key]}`)
        .join(' | ');

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(`Selection: ${gameState.selectedTowers.length}`, x + 10, y + 24);

    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.fillText(compact, x + 10, y + 46);

    ctx.fillStyle = '#9ad1ff';
    ctx.font = '13px Arial';
    ctx.fillText('[U] upgrade groupe | [T] meme type', x + 10, y + 70);
    ctx.fillText(`[G] profil IA: ${getAiProfile().label} | [A] auto: ${gameState.aiAutoUpgrade ? 'ON' : 'OFF'}`, x + 10, y + 92);
}

function drawPauseScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSE', canvas.width / 2, canvas.height / 2 - 40);

    ctx.fillStyle = '#FFF';
    ctx.font = '24px Arial';
    ctx.fillText('Appuyez sur P pour reprendre', canvas.width / 2, canvas.height / 2 + 20);

    ctx.font = '20px Arial';
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`Score: ${gameState.score}`, canvas.width / 2, canvas.height / 2 + 60);
    ctx.fillText(`Ennemis elimines: ${gameState.killCount}`, canvas.width / 2, canvas.height / 2 + 90);

    ctx.textAlign = 'left';
}

function updateHTMLStats() {
    const moneyEl = document.getElementById('moneyDisplay');
    const livesEl = document.getElementById('livesDisplay');
    const waveEl = document.getElementById('waveDisplay');
    const enemiesEl = document.getElementById('enemiesDisplay');

    if (moneyEl) moneyEl.textContent = gameState.money;
    if (livesEl) livesEl.textContent = gameState.lives;
    if (waveEl) waveEl.textContent = waveState.currentWave;
    if (enemiesEl) enemiesEl.textContent = waveState.enemiesToSpawn + enemies.length;
}

function drawTowerPlacementPreview(ctx) {
    const { x, y } = gameState.hoveredTile;

    if (x >= 0 && x < MAP_COLS && y >= 0 && y < MAP_ROWS) {
        const worldX = gridToWorld(x) + TILE_SIZE / 2;
        const worldY = gridToWorld(y) + TILE_SIZE / 2;
        const isValid = isValidTowerPosition(x, y);
        const selectedType = TOWER_TYPES[gameState.selectedTowerType] || TOWER_TYPES.BASIC;

        drawCircle(ctx, worldX, worldY, selectedType.range, isValid ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 0, 0, 0.2)');

        ctx.globalAlpha = 0.7;
        ctx.fillStyle = isValid ? selectedType.color : '#ff4444';
        ctx.fillRect(worldX - TOWER_SIZE / 2, worldY - TOWER_SIZE / 2, TOWER_SIZE, TOWER_SIZE);
        ctx.globalAlpha = 1;

        ctx.strokeStyle = isValid ? '#00ff00' : '#ff0000';
        ctx.lineWidth = 3;
        ctx.strokeRect(worldX - TOWER_SIZE / 2, worldY - TOWER_SIZE / 2, TOWER_SIZE, TOWER_SIZE);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${selectedType.name} (${selectedType.cost}$)`, worldX, worldY - TOWER_SIZE);
        ctx.textAlign = 'left';
    }
}

function drawGameOver(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ff3333';
    ctx.font = 'bold 70px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 120);

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 40px Arial';
    ctx.fillText(`Score: ${gameState.score}`, canvas.width / 2, canvas.height / 2 - 40);

    ctx.fillStyle = '#fff';
    ctx.font = '30px Arial';
    ctx.fillText(`Vague atteinte: ${waveState.currentWave}`, canvas.width / 2, canvas.height / 2 + 10);
    ctx.fillText(`Ennemis elimines: ${gameState.killCount}`, canvas.width / 2, canvas.height / 2 + 50);
    ctx.fillText(`Argent gagne: ${gameState.money}$`, canvas.width / 2, canvas.height / 2 + 90);

    if (gameState.score > gameState.highScore) {
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 28px Arial';
        ctx.fillText('NOUVEAU RECORD!', canvas.width / 2, canvas.height / 2 + 140);
    } else {
        ctx.fillStyle = '#aaa';
        ctx.font = '24px Arial';
        ctx.fillText(`Record: ${gameState.highScore}`, canvas.width / 2, canvas.height / 2 + 140);
    }

    ctx.fillStyle = '#4169e1';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('Appuyez sur R pour recommencer', canvas.width / 2, canvas.height / 2 + 190);
    ctx.textAlign = 'left';
}

function handleCanvasClick(event) {
    if (gameState.gameOver) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const isShift = !!event.shiftKey;
    const isCtrlLike = !!(event.ctrlKey || event.metaKey);

    const speedX = 20;
    const speedY = canvas.height - 130;
    const speedW = 90;
    const speedH = 44;

    if (mouseX >= speedX && mouseX <= speedX + speedW &&
        mouseY >= speedY && mouseY <= speedY + speedH) {
        speedIndex = (speedIndex + 1) % SPEED_OPTIONS.length;
        GAME_SPEED = SPEED_OPTIONS[speedIndex];
        return;
    }

    const buttonX = 20;
    const buttonY = canvas.height - 80;
    const buttonWidth = 180;
    const buttonHeight = 60;

    if (mouseX >= buttonX && mouseX <= buttonX + buttonWidth &&
        mouseY >= buttonY && mouseY <= buttonY + buttonHeight) {
        const typeData = TOWER_TYPES[gameState.selectedTowerType] || TOWER_TYPES.BASIC;
        if (gameState.money >= typeData.cost) {
            gameState.placingTower = !gameState.placingTower;
        }
        return;
    }

    const clickedTower = getTowerAt(mouseX, mouseY);
    if (clickedTower && !gameState.placingTower) {
        if (isCtrlLike) {
            selectTowersByType(clickedTower.type);
        } else if (isShift) {
            toggleTowerInSelection(clickedTower);
        } else {
            setSelectedTowers([clickedTower]);
        }
        return;
    }

    if (gameState.placingTower) {
        const gridX = worldToGrid(mouseX);
        const gridY = worldToGrid(mouseY);
        const selectedType = TOWER_TYPES[gameState.selectedTowerType] || TOWER_TYPES.BASIC;

        if (isValidTowerPosition(gridX, gridY) && gameState.money >= selectedType.cost) {
            const worldX = gridToWorld(gridX) + TILE_SIZE / 2;
            const worldY = gridToWorld(gridY) + TILE_SIZE / 2;

            addTower(worldX, worldY, gameState.selectedTowerType);
            gameState.money -= selectedType.cost;
            gameState.placingTower = false;
        }
        return;
    }

    setSelectedTowers([]);

    if (!waveState.waveInProgress && !gameState.waveComplete) {
        startNextWave();
    }
}

function handleMouseMove(event) {
    if (!gameState.placingTower) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    gameState.hoveredTile = {
        x: worldToGrid(mouseX),
        y: worldToGrid(mouseY)
    };
}

document.addEventListener('keydown', (event) => {
    if (event.key === 'p' || event.key === 'P') {
        if (!gameState.gameOver) {
            gameState.paused = !gameState.paused;
        }
    }

    if ((event.key === 'r' || event.key === 'R') && gameState.gameOver) {
        location.reload();
    }

    if (event.key === 'Escape') {
        gameState.placingTower = false;
        setSelectedTowers([]);
    }

    if (event.key === 'u' || event.key === 'U') {
        const selection = gameState.selectedTowers.length
            ? gameState.selectedTowers
            : (gameState.selectedTower ? [gameState.selectedTower] : []);
        if (selection.length) {
            const maxOps = event.shiftKey ? 999 : selection.length;
            upgradeTowerGroup(selection, gameState.aiProfile, maxOps);
        }
    }

    if (event.key === 't' || event.key === 'T') {
        const ref = gameState.selectedTower || gameState.selectedTowers[0];
        if (ref) {
            selectTowersByType(ref.type);
        }
    }

    if (event.key === 'g' || event.key === 'G') {
        cycleAiProfile();
    }

    if (event.key === 'a' || event.key === 'A') {
        toggleAutoUpgrade();
    }

    if (event.key === 'c' || event.key === 'C') {
        cycleTowerType();
    }
});

