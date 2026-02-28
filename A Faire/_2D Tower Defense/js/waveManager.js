let waveState = {
    currentWave: 0,
    enemiesToSpawn: 0,
    spawnTimer: 0,
    spawnDelay: 1000,
    waveInProgress: false,
    timeBetweenWaves: 5000,
    waveBonus: 0
};

function startNextWave() {
    if (waveState.waveInProgress) return;

    waveState.currentWave += 1;
    waveState.enemiesToSpawn = 5 + (waveState.currentWave * 3);
    waveState.spawnTimer = 0;
    waveState.waveInProgress = true;

    waveState.waveBonus = 50 + (waveState.currentWave * 10);
    gameState.money += waveState.waveBonus;

    showWaveStartMessage();
}

function showWaveStartMessage() {
    const msg = document.createElement('div');
    msg.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        padding: 30px 60px;
        border-radius: 15px;
        font-size: 32px;
        font-weight: bold;
        z-index: 10000;
        box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        animation: wavePopIn 0.5s ease-out;
    `;

    const isBossWave = waveState.currentWave % 10 === 0;
    msg.innerHTML = isBossWave
        ? `VAGUE ${waveState.currentWave} - BOSS`
        : `VAGUE ${waveState.currentWave}<br><span style="font-size:20px">+${waveState.waveBonus}$</span>`;

    document.body.appendChild(msg);

    setTimeout(() => {
        msg.style.animation = 'wavePopOut 0.5s ease-in';
        setTimeout(() => msg.remove(), 500);
    }, 1800);
}

function updateWave(deltaTime) {
    if (!waveState.waveInProgress) return;

    if (waveState.enemiesToSpawn > 0) {
        waveState.spawnTimer += deltaTime;

        if (waveState.spawnTimer >= waveState.spawnDelay) {
            spawnEnemy(waveState.currentWave);
            waveState.enemiesToSpawn -= 1;
            waveState.spawnTimer = 0;
        }
    } else if (enemies.length === 0) {
        waveState.waveInProgress = false;
        gameState.waveComplete = true;
        gameState.score += 100 * waveState.currentWave;

        setTimeout(() => {
            gameState.waveComplete = false;
        }, waveState.timeBetweenWaves);
    }
}

function drawSpeedControl(ctx) {
    const x = 20;
    const y = canvas.height - 130;
    const width = 90;
    const height = 44;

    const isMaxSpeed = speedIndex === SPEED_OPTIONS.length - 1;

    const gradient = ctx.createLinearGradient(x, y, x, y + height);
    gradient.addColorStop(0, '#2a2a38');
    gradient.addColorStop(1, '#1a1a28');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width, height);

    ctx.strokeStyle = isMaxSpeed ? '#ffcc00' : '#4169e1';
    ctx.lineWidth = isMaxSpeed ? 3 : 2;
    ctx.strokeRect(x, y, width, height);

    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isMaxSpeed ? '#ffcc00' : '#00ffff';
    ctx.fillText(`x${GAME_SPEED}`, x + width / 2, y + height / 2);

    if (!isMaxSpeed) {
        ctx.font = '12px Arial';
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillText('clic +', x + width / 2, y + height + 12);
    }
}

function drawWaveUI(ctx) {
    const padding = 20;
    const boxWidth = 300;
    const boxHeight = 166;
    const x = canvas.width - boxWidth - padding;
    const y = padding;

    const gradient = ctx.createLinearGradient(x, y, x, y + boxHeight);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, boxWidth, boxHeight);

    ctx.strokeStyle = '#4169e1';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, boxWidth, boxHeight);

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Vague ${waveState.currentWave}`, x + 10, y + 30);

    ctx.fillStyle = '#fff';
    ctx.font = '18px Arial';
    ctx.fillText(`$ ${gameState.money}`, x + 10, y + 58);
    ctx.fillText(`Vies ${gameState.lives}`, x + 10, y + 83);
    ctx.fillText(`Score ${gameState.score}`, x + 10, y + 108);

    const aiLabel = (typeof getAiProfile === 'function') ? getAiProfile().label : 'Neutre';
    ctx.fillStyle = '#9ad1ff';
    ctx.font = '14px Arial';
    ctx.fillText(`IA: ${aiLabel} | Auto: ${gameState.aiAutoUpgrade ? 'ON' : 'OFF'}`, x + 10, y + 132);

    if (waveState.waveInProgress) {
        const totalEnemies = 5 + (waveState.currentWave * 3);
        const remaining = waveState.enemiesToSpawn + enemies.length;
        const progress = 1 - (remaining / totalEnemies);

        const barX = x + 10;
        const barY = y + 145;
        const barW = boxWidth - 20;
        const barH = 10;

        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barW, barH);

        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(barX, barY, barW * Math.max(0, Math.min(1, progress)), barH);

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barW, barH);
    } else if (gameState.waveComplete) {
        ctx.fillStyle = '#0f0';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('Vague terminee', x + 10, y + 160);
    } else {
        ctx.fillStyle = '#ff0';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('Cliquez pour demarrer', x + 10, y + 160);
    }
}

function drawGameUI(ctx) {
    drawWaveUI(ctx);
    drawSpeedControl(ctx);
    drawPlaceTowerButton(ctx);
}

function drawPlaceTowerButton(ctx) {
    const buttonX = 20;
    const buttonY = canvas.height - 80;
    const buttonWidth = 180;
    const buttonHeight = 60;

    const selectedType = TOWER_TYPES[gameState.selectedTowerType] || TOWER_TYPES.BASIC;
    const canAfford = gameState.money >= selectedType.cost;
    const isActive = gameState.placingTower;

    const gradient = ctx.createLinearGradient(buttonX, buttonY, buttonX, buttonY + buttonHeight);
    if (isActive) {
        gradient.addColorStop(0, '#4caf50');
        gradient.addColorStop(1, '#2e7d32');
    } else if (canAfford) {
        gradient.addColorStop(0, '#2196f3');
        gradient.addColorStop(1, '#1565c0');
    } else {
        gradient.addColorStop(0, '#777');
        gradient.addColorStop(1, '#555');
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);

    ctx.strokeStyle = isActive ? '#fff' : '#000';
    ctx.lineWidth = 3;
    ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(isActive ? 'Placement actif' : 'Placer tour', buttonX + 10, buttonY + 24);
    ctx.fillText(`${selectedType.name} - ${selectedType.cost}$`, buttonX + 10, buttonY + 45);

    ctx.fillStyle = '#d4eaff';
    ctx.font = '12px Arial';
    ctx.fillText('[C] changer type', buttonX + 10, buttonY - 6);

    if (isActive) {
        const instX = canvas.width / 2 - 220;
        const instY = 10;
        const instW = 440;
        const instH = 54;

        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(instX, instY, instW, instH);

        ctx.strokeStyle = '#4caf50';
        ctx.lineWidth = 2;
        ctx.strokeRect(instX, instY, instW, instH);

        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Cliquez une case verte pour placer la tour', canvas.width / 2, instY + 22);
        ctx.fillText('ESC annule | C change le type', canvas.width / 2, instY + 42);
        ctx.textAlign = 'left';
    }
}

if (!document.getElementById('waveAnimStyles')) {
    const style = document.createElement('style');
    style.id = 'waveAnimStyles';
    style.textContent = `
        @keyframes wavePopIn {
            from { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
            to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
        @keyframes wavePopOut {
            from { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            to { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

