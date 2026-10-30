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

let gameState = createGameState();

const TD_ABILITIES = {
    barrage: { key: 'z', name: 'Barrage', cost: 95, cooldown: 32000, radius: 115 },
    emp: { key: 'x', name: 'EMP', cost: 70, cooldown: 26000, radius: 150 },
    repair: { key: 'c', name: 'Réparation', cost: 60, cooldown: 22000, radius: 0 }
};

function activateTacticalAbility(name) {
    const def = TD_ABILITIES[name];
    if (!def || gameState.gameOver || gameState.paused || gameState.money < def.cost) return false;
    if ((gameState.abilityCooldowns[name] || 0) > 0) return false;
    const tile = gameState.hoveredTile;
    const validAim = tile && tile.x >= 0 && tile.y >= 0;
    const target = validAim ? { x: gridToWorld(tile.x), y: gridToWorld(tile.y) } : null;
    if (name !== 'repair' && !target) return false;
    if (name === 'repair') {
        const selected = gameState.selectedTowers.filter((t) => towers.includes(t));
        if (!selected.length) return false;
        let repaired = 0;
        selected.forEach((t) => {
            if (t.hp < t.maxHp) {
                t.hp = Math.min(t.maxHp, t.hp + t.maxHp * 0.45);
                repaired++;
            }
        });
        if (!repaired) return false;
    } else {
        const targets = enemies.filter((e) => e.life > 0 &&
            Math.hypot(e.x - target.x, e.y - target.y) <= def.radius);
        if (!targets.length) return false;
        targets.forEach((e) => {
            if (name === 'barrage') damageEnemy(e, 125, null, true);
            else applySlow(e, 0.35, 4200);
        });
        gameState.banner = { text: name === 'barrage' ? 'BARRAGE TACTIQUE' : 'IMPULSION EMP', timer: 1400 };
    }
    gameState.money -= def.cost;
    gameState.abilityCooldowns[name] = def.cooldown;
    return true;
}



function createGameState() {
    return {
        money: STARTING_MONEY,
        lives: STARTING_LIVES,
        placingTower: false,
        selectedTowers: [],
        selectedTowerType: 'BASIC',
        hoveredTile: { x: -1, y: -1 },
        hoveredTower: null,
        gameOver: false,
        paused: false,
        score: 0,
        killCount: 0,
        highScore: parseInt(localStorage.getItem('tdHighScore') || '0', 10),
        aiProfile: 'neutre',
        aiAutoUpgrade: false,
        aiUpgradeTimer: 0,
        autoWaves: true,
        banner: null,
        shake: 0,
        abilityCooldowns: { barrage: 0, emp: 0, repair: 0 }
    };
}

function resetGame() {
    const keepHigh = Math.max(gameState.highScore, gameState.score);
    gameState = createGameState();
    gameState.highScore = keepHigh;
    waveState = createWaveState();
    towers = [];
    enemies = [];
    projectiles = [];
    enemyProjectiles = [];
    resetEffects();
    resetGameSpeed();
}

function getAiProfile() {
    return TD_AI_PROFILES[gameState.aiProfile] || TD_AI_PROFILES.neutre;
}

function setSelectedTowers(list) {
    gameState.selectedTowers = Array.isArray(list) ? list.filter(Boolean) : [];
}

function loseLives(n) {
    gameState.lives = Math.max(0, gameState.lives - n);
    gameState.shake = 250;
    if (gameState.lives <= 0 && !gameState.gameOver) {
        gameState.gameOver = true;
        if (gameState.score > gameState.highScore) {
            localStorage.setItem('tdHighScore', gameState.score);
        }
        syncCatalogScore();
    }
}

function runAutoTowerManager(dt) {
    if (!gameState.aiAutoUpgrade || !towers.length) return;
    gameState.aiUpgradeTimer += dt;
    const profile = getAiProfile();
    if (gameState.aiUpgradeTimer < profile.upgradeCadenceSec * 1000) return;
    gameState.aiUpgradeTimer = 0;
    upgradeTowerGroup(towers, gameState.aiProfile, profile.maxPerTick);
}

function gameLoop(time) {
    if (!lastTime) lastTime = time;
    const realDt = Math.min(50, time - lastTime);
    lastTime = time;

    if (!gameState.gameOver && !gameState.paused) {
        // Sous-pas pour garder une simulation stable en vitesse x2/x3
        for (let i = 0; i < GAME_SPEED; i++) update(realDt);
    }
    updateBanner(realDt);
    if (gameState.shake > 0) gameState.shake -= realDt;

    draw();
    requestAnimationFrame(gameLoop);
}

function update(dt) {
    Object.keys(gameState.abilityCooldowns).forEach((name) => {
        gameState.abilityCooldowns[name] = Math.max(0, gameState.abilityCooldowns[name] - dt);
    });
    updateWave(dt);
    updateEnemies(dt);
    updateTowers(dt);
    updateProjectiles(dt);
    updateEnemyProjectiles(dt);
    updateEffects(dt);
    runAutoTowerManager(dt);

    scoreSyncTimer += dt;
    if (scoreSyncTimer >= 900) {
        scoreSyncTimer = 0;
        syncCatalogScore();
    }
}

function syncCatalogScore() {
    window.gameState = window.gameState || {};
    window.gameState.score = Math.max(Math.floor(window.gameState.score || 0), Math.floor(gameState.score));
    if (window.CatalogScore && typeof window.CatalogScore.capture === 'function') {
        window.CatalogScore.capture();
    }
}

// ---------- DESSIN ----------

function draw() {
    ctx.save();
    if (gameState.shake > 0) {
        ctx.translate((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6);
    }
    drawMap(ctx);
    drawGroundEffects(ctx);
    drawTowers(ctx);
    drawEnemies(ctx);
    drawProjectiles(ctx);
    drawEnemyProjectiles(ctx);
    drawAirEffects(ctx);
    if (gameState.placingTower) drawTowerPlacementPreview(ctx);
    ctx.restore();

    drawHUD(ctx);
    drawSelectionPanel(ctx);
    drawBanner(ctx);
    if (gameState.paused && !gameState.gameOver) drawOverlay('PAUSE', 'Appuyez sur P pour reprendre', '#FFD700');
    if (gameState.gameOver) drawGameOver(ctx);
}

function drawTowerPlacementPreview(ctx) {
    const { x, y } = gameState.hoveredTile;
    if (x < 0 || x >= MAP_COLS || y < 0 || y >= MAP_ROWS) return;
    const type = TOWER_TYPES[gameState.selectedTowerType];
    const wx = gridToWorld(x) + TILE_SIZE / 2;
    const wy = gridToWorld(y) + TILE_SIZE / 2;
    const ok = isValidTowerPosition(x, y) && gameState.money >= type.cost;

    ctx.fillStyle = ok ? 'rgba(0,255,0,0.12)' : 'rgba(255,0,0,0.12)';
    ctx.beginPath();
    ctx.arc(wx, wy, type.range, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.7;
    drawTowerBody(ctx, wx, wy, gameState.selectedTowerType, -Math.PI / 2, 1, 0);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = ok ? '#00ff00' : '#ff0000';
    ctx.lineWidth = 2;
    ctx.strokeRect(wx - TILE_SIZE / 2, wy - TILE_SIZE / 2, TILE_SIZE, TILE_SIZE);
}

function drawHUD(ctx) {
    // Barre du haut
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, canvas.width, 30);
    ctx.font = 'bold 15px Arial';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`💰 ${gameState.money}$`, 10, 15);
    ctx.fillStyle = gameState.lives <= 5 ? '#ff5555' : '#ff9a9a';
    ctx.fillText(`❤ ${gameState.lives}`, 110, 15);
    ctx.fillStyle = '#fff';
    ctx.fillText(`Vague ${waveState.currentWave}`, 175, 15);
    ctx.fillText(`Score ${gameState.score}`, 270, 15);
    ctx.fillStyle = '#00ffff';
    ctx.fillText(`x${GAME_SPEED} [V]`, 400, 15);

    let status;
    if (isSpawning() || enemies.length) {
        status = `Ennemis: ${enemies.length + waveState.queue.length} — [Espace] vague suivante`;
        ctx.fillStyle = '#333';
        ctx.fillRect(470, 24, 320, 4);
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(470, 24, 320 * getWaveProgress(), 4);
    } else if (!waveState.started) {
        status = '[Espace] lancer la première vague';
    } else {
        status = `Vague suivante: ${Math.ceil(waveState.countdown / 1000)}s — [Espace] (+${getEarlyCallBonus()}$)`;
    }
    ctx.fillStyle = '#ffeb7a';
    ctx.font = '13px Arial';
    ctx.fillText(status, 470, 13);

    // Barre de construction en bas
    const keys = Object.keys(TOWER_TYPES);
    const bw = 120;
    const by = canvas.height - 46;
    keys.forEach((k, i) => {
        const t = TOWER_TYPES[k];
        const bx = 10 + i * (bw + 6);
        const active = gameState.placingTower && gameState.selectedTowerType === k;
        const afford = gameState.money >= t.cost;
        ctx.fillStyle = active ? 'rgba(40,120,40,0.9)' : 'rgba(0,0,0,0.7)';
        ctx.fillRect(bx, by, bw, 40);
        ctx.strokeStyle = active ? '#7CFC00' : t.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(bx, by, bw, 40);
        ctx.fillStyle = afford ? '#fff' : '#777';
        ctx.font = 'bold 13px Arial';
        ctx.fillText(`[${t.key}] ${t.name}`, bx + 6, by + 13);
        ctx.fillStyle = afford ? '#FFD700' : '#a55';
        ctx.font = '12px Arial';
        ctx.fillText(`${t.cost}$`, bx + 6, by + 30);
    });
    // Active powers share the bottom HUD but remain keyboard controlled.
    ctx.fillStyle = 'rgba(0,0,0,.78)';
    ctx.fillRect(10, by - 26, Math.min(750, canvas.width - 20), 22);
    ctx.font = '12px Arial';
    Object.entries(TD_ABILITIES).forEach(([name, ability], i) => {
        const remaining = gameState.abilityCooldowns[name] || 0;
        ctx.fillStyle = remaining > 0 ? '#a6a6a6' : gameState.money >= ability.cost ? '#8ff0cc' : '#e07e7e';
        ctx.fillText(`[${ability.key.toUpperCase()}] ${ability.name} ${remaining > 0 ? Math.ceil(remaining / 1000) + 's' : ability.cost + '

    if (gameState.placingTower) {
        const t = TOWER_TYPES[gameState.selectedTowerType];
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(10, by - 24, 400, 20);
        ctx.fillStyle = '#d4eaff';
        ctx.font = '12px Arial';
        ctx.fillText(`${t.desc}  — Clic droit / Échap pour annuler`, 16, by - 10);
    }
}

function getBuildButtonAt(mx, my) {
    const by = canvas.height - 46;
    if (my < by || my > by + 40) return null;
    const keys = Object.keys(TOWER_TYPES);
    const i = Math.floor((mx - 10) / 126);
    if (i < 0 || i >= keys.length || (mx - 10) % 126 > 120) return null;
    return keys[i];
}

function drawSelectionPanel(ctx) {
    const sel = gameState.selectedTowers;
    if (!sel.length) return;
    const x = canvas.width - 230;
    const y = 40;
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(x, y, 220, 150);
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, 220, 150);
    ctx.font = '13px Arial';
    const line = (txt, i, color = '#fff') => {
        ctx.fillStyle = color;
        ctx.fillText(txt, x + 10, y + 20 + i * 18);
    };

    if (sel.length === 1) {
        const t = sel[0];
        const mode = TARGET_MODES.find((m) => m.key === t.targeting);
        line(`${TOWER_TYPES[t.type].name} — Niv. ${t.level}/${MAX_TOWER_LEVEL}`, 0, '#FFD700');
        line(`Dégâts ${t.damage}  Portée ${t.range}`, 1);
        line(`Cadence ${(1000 / t.fireRate).toFixed(1)}/s  Éliminations ${t.kills}`, 2);
        line(`[F] Cible: ${mode.label}`, 3, '#9ad1ff');
        line(canUpgrade(t) ? `[U] Améliorer: ${getUpgradeCost(t)}$` : 'Niveau max', 4, '#7CFC00');
        line(`[S] Vendre: ${getSellValue(t)}$`, 5, '#ff9a9a');
        line(`[G] Doctrine: ${getAiProfile().label}`, 6, '#ccc');
    } else {
        line(`Sélection: ${sel.length} tours`, 0, '#FFD700');
        line('[U] améliorer le groupe', 1);
        line('[S] vendre le groupe', 2);
        line(`[G] Doctrine: ${getAiProfile().label}`, 3, '#ccc');
        line(`[A] Auto-amélioration: ${gameState.aiAutoUpgrade ? 'ON' : 'OFF'}`, 4, '#ccc');
    }
}

function drawOverlay(title, sub, color) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = color;
    ctx.font = 'bold 56px Arial';
    ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 20);
    ctx.fillStyle = '#fff';
    ctx.font = '22px Arial';
    ctx.fillText(sub, canvas.width / 2, canvas.height / 2 + 25);
    ctx.textAlign = 'left';
}

function drawGameOver(ctx) {
    drawOverlay('GAME OVER', `Score ${gameState.score} — Vague ${waveState.currentWave} — ${gameState.killCount} éliminations`, '#ff3333');
    ctx.textAlign = 'center';
    ctx.font = 'bold 22px Arial';
    const record = gameState.score > gameState.highScore;
    ctx.fillStyle = record ? '#FFD700' : '#aaa';
    ctx.fillText(record ? 'NOUVEAU RECORD !' : `Record: ${gameState.highScore}`, canvas.width / 2, canvas.height / 2 + 65);
    ctx.fillStyle = '#6fa8ff';
    ctx.fillText('Appuyez sur R pour recommencer', canvas.width / 2, canvas.height / 2 + 105);
    ctx.textAlign = 'left';
}

// ---------- ENTRÉES ----------

function getMousePos(event) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (event.clientX - rect.left) * (canvas.width / rect.width),
        y: (event.clientY - rect.top) * (canvas.height / rect.height)
    };
}

function selectBuildType(type) {
    if (gameState.placingTower && gameState.selectedTowerType === type) {
        gameState.placingTower = false;
        return;
    }
    gameState.selectedTowerType = type;
    gameState.placingTower = true;
    setSelectedTowers([]);
}

function handleCanvasClick(event) {
    if (gameState.gameOver) return;
    const { x, y } = getMousePos(event);

    if (y < 30 && x >= 400 && x < 460) {
        cycleGameSpeed();
        return;
    }
    const button = getBuildButtonAt(x, y);
    if (button) {
        selectBuildType(button);
        return;
    }

    if (gameState.placingTower) {
        const gx = worldToGrid(x);
        const gy = worldToGrid(y);
        const type = TOWER_TYPES[gameState.selectedTowerType];
        if (isValidTowerPosition(gx, gy) && gameState.money >= type.cost) {
            addTower(gx, gy, gameState.selectedTowerType);
            gameState.money -= type.cost;
            // Shift garde le mode placement actif
            if (!event.shiftKey || gameState.money < type.cost) gameState.placingTower = false;
        }
        return;
    }

    const clicked = getTowerAt(x, y);
    if (clicked) {
        if (event.ctrlKey || event.metaKey) {
            setSelectedTowers(towers.filter((t) => t.type === clicked.type));
        } else if (event.shiftKey) {
            const list = gameState.selectedTowers.slice();
            const i = list.indexOf(clicked);
            if (i >= 0) list.splice(i, 1); else list.push(clicked);
            setSelectedTowers(list);
        } else {
            setSelectedTowers([clicked]);
        }
        return;
    }
    setSelectedTowers([]);
}

function handleMouseMove(event) {
    const { x, y } = getMousePos(event);
    gameState.hoveredTile = { x: worldToGrid(x), y: worldToGrid(y) };
    gameState.hoveredTower = getTowerAt(x, y) || null;
}

function handleKey(event) {
    const key = event.key.toLowerCase();

    if (key === 'r' && gameState.gameOver) {
        resetGame();
        return;
    }
    if (gameState.gameOver) return;

    if (key === 'p') gameState.paused = !gameState.paused;
    if (gameState.paused) return;
    if (key === 'z') activateTacticalAbility('barrage');
    if (key === 'x') activateTacticalAbility('emp');
    if (key === 'c') activateTacticalAbility('repair');

    const typeByKey = Object.keys(TOWER_TYPES).find((k) => TOWER_TYPES[k].key === key);
    if (typeByKey) selectBuildType(typeByKey);

    const sel = gameState.selectedTowers;
    if (key === ' ' || key === 'n') {
        event.preventDefault();
        startNextWave();
    } else if (key === 'escape') {
        gameState.placingTower = false;
        setSelectedTowers([]);
    } else if (key === 'u' && sel.length) {
        upgradeTowerGroup(sel, gameState.aiProfile, event.shiftKey ? 999 : sel.length);
    } else if (key === 's' && sel.length) {
        sel.slice().forEach(sellTower);
        setSelectedTowers([]);
    } else if (key === 'f' && sel.length) {
        const i = TARGET_MODES.findIndex((m) => m.key === sel[0].targeting);
        const next = TARGET_MODES[(i + 1) % TARGET_MODES.length].key;
        sel.forEach((t) => { t.targeting = next; });
    } else if (key === 't' && sel.length) {
        setSelectedTowers(towers.filter((t) => t.type === sel[0].type));
    } else if (key === 'g') {
        const keys = Object.keys(TD_AI_PROFILES);
        gameState.aiProfile = keys[(keys.indexOf(gameState.aiProfile) + 1) % keys.length];
    } else if (key === 'a') {
        gameState.aiAutoUpgrade = !gameState.aiAutoUpgrade;
    } else if (key === 'v') {
        cycleGameSpeed();
    }
}

document.addEventListener('keydown', handleKey);
}`, 16 + i * 245, by - 11);
    });
    ctx.textBaseline = 'alphabetic';

    if (gameState.placingTower) {
        const t = TOWER_TYPES[gameState.selectedTowerType];
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(10, by - 24, 400, 20);
        ctx.fillStyle = '#d4eaff';
        ctx.font = '12px Arial';
        ctx.fillText(`${t.desc}  — Clic droit / Échap pour annuler`, 16, by - 10);
    }
}

function getBuildButtonAt(mx, my) {
    const by = canvas.height - 46;
    if (my < by || my > by + 40) return null;
    const keys = Object.keys(TOWER_TYPES);
    const i = Math.floor((mx - 10) / 126);
    if (i < 0 || i >= keys.length || (mx - 10) % 126 > 120) return null;
    return keys[i];
}

function drawSelectionPanel(ctx) {
    const sel = gameState.selectedTowers;
    if (!sel.length) return;
    const x = canvas.width - 230;
    const y = 40;
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(x, y, 220, 150);
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, 220, 150);
    ctx.font = '13px Arial';
    const line = (txt, i, color = '#fff') => {
        ctx.fillStyle = color;
        ctx.fillText(txt, x + 10, y + 20 + i * 18);
    };

    if (sel.length === 1) {
        const t = sel[0];
        const mode = TARGET_MODES.find((m) => m.key === t.targeting);
        line(`${TOWER_TYPES[t.type].name} — Niv. ${t.level}/${MAX_TOWER_LEVEL}`, 0, '#FFD700');
        line(`Dégâts ${t.damage}  Portée ${t.range}`, 1);
        line(`Cadence ${(1000 / t.fireRate).toFixed(1)}/s  Éliminations ${t.kills}`, 2);
        line(`[F] Cible: ${mode.label}`, 3, '#9ad1ff');
        line(canUpgrade(t) ? `[U] Améliorer: ${getUpgradeCost(t)}$` : 'Niveau max', 4, '#7CFC00');
        line(`[S] Vendre: ${getSellValue(t)}$`, 5, '#ff9a9a');
        line(`[G] Doctrine: ${getAiProfile().label}`, 6, '#ccc');
    } else {
        line(`Sélection: ${sel.length} tours`, 0, '#FFD700');
        line('[U] améliorer le groupe', 1);
        line('[S] vendre le groupe', 2);
        line(`[G] Doctrine: ${getAiProfile().label}`, 3, '#ccc');
        line(`[A] Auto-amélioration: ${gameState.aiAutoUpgrade ? 'ON' : 'OFF'}`, 4, '#ccc');
    }
}

function drawOverlay(title, sub, color) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = color;
    ctx.font = 'bold 56px Arial';
    ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 20);
    ctx.fillStyle = '#fff';
    ctx.font = '22px Arial';
    ctx.fillText(sub, canvas.width / 2, canvas.height / 2 + 25);
    ctx.textAlign = 'left';
}

function drawGameOver(ctx) {
    drawOverlay('GAME OVER', `Score ${gameState.score} — Vague ${waveState.currentWave} — ${gameState.killCount} éliminations`, '#ff3333');
    ctx.textAlign = 'center';
    ctx.font = 'bold 22px Arial';
    const record = gameState.score > gameState.highScore;
    ctx.fillStyle = record ? '#FFD700' : '#aaa';
    ctx.fillText(record ? 'NOUVEAU RECORD !' : `Record: ${gameState.highScore}`, canvas.width / 2, canvas.height / 2 + 65);
    ctx.fillStyle = '#6fa8ff';
    ctx.fillText('Appuyez sur R pour recommencer', canvas.width / 2, canvas.height / 2 + 105);
    ctx.textAlign = 'left';
}

// ---------- ENTRÉES ----------

function getMousePos(event) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (event.clientX - rect.left) * (canvas.width / rect.width),
        y: (event.clientY - rect.top) * (canvas.height / rect.height)
    };
}

function selectBuildType(type) {
    if (gameState.placingTower && gameState.selectedTowerType === type) {
        gameState.placingTower = false;
        return;
    }
    gameState.selectedTowerType = type;
    gameState.placingTower = true;
    setSelectedTowers([]);
}

function handleCanvasClick(event) {
    if (gameState.gameOver) return;
    const { x, y } = getMousePos(event);

    if (y < 30 && x >= 400 && x < 460) {
        cycleGameSpeed();
        return;
    }
    const button = getBuildButtonAt(x, y);
    if (button) {
        selectBuildType(button);
        return;
    }

    if (gameState.placingTower) {
        const gx = worldToGrid(x);
        const gy = worldToGrid(y);
        const type = TOWER_TYPES[gameState.selectedTowerType];
        if (isValidTowerPosition(gx, gy) && gameState.money >= type.cost) {
            addTower(gx, gy, gameState.selectedTowerType);
            gameState.money -= type.cost;
            // Shift garde le mode placement actif
            if (!event.shiftKey || gameState.money < type.cost) gameState.placingTower = false;
        }
        return;
    }

    const clicked = getTowerAt(x, y);
    if (clicked) {
        if (event.ctrlKey || event.metaKey) {
            setSelectedTowers(towers.filter((t) => t.type === clicked.type));
        } else if (event.shiftKey) {
            const list = gameState.selectedTowers.slice();
            const i = list.indexOf(clicked);
            if (i >= 0) list.splice(i, 1); else list.push(clicked);
            setSelectedTowers(list);
        } else {
            setSelectedTowers([clicked]);
        }
        return;
    }
    setSelectedTowers([]);
}

function handleMouseMove(event) {
    const { x, y } = getMousePos(event);
    gameState.hoveredTile = { x: worldToGrid(x), y: worldToGrid(y) };
    gameState.hoveredTower = getTowerAt(x, y) || null;
}

function handleKey(event) {
    const key = event.key.toLowerCase();

    if (key === 'r' && gameState.gameOver) {
        resetGame();
        return;
    }
    if (gameState.gameOver) return;

    if (key === 'p') gameState.paused = !gameState.paused;
    if (gameState.paused) return;

    const typeByKey = Object.keys(TOWER_TYPES).find((k) => TOWER_TYPES[k].key === key);
    if (typeByKey) selectBuildType(typeByKey);

    const sel = gameState.selectedTowers;
    if (key === ' ' || key === 'n') {
        event.preventDefault();
        startNextWave();
    } else if (key === 'escape') {
        gameState.placingTower = false;
        setSelectedTowers([]);
    } else if (key === 'u' && sel.length) {
        upgradeTowerGroup(sel, gameState.aiProfile, event.shiftKey ? 999 : sel.length);
    } else if (key === 's' && sel.length) {
        sel.slice().forEach(sellTower);
        setSelectedTowers([]);
    } else if (key === 'f' && sel.length) {
        const i = TARGET_MODES.findIndex((m) => m.key === sel[0].targeting);
        const next = TARGET_MODES[(i + 1) % TARGET_MODES.length].key;
        sel.forEach((t) => { t.targeting = next; });
    } else if (key === 't' && sel.length) {
        setSelectedTowers(towers.filter((t) => t.type === sel[0].type));
    } else if (key === 'g') {
        const keys = Object.keys(TD_AI_PROFILES);
        gameState.aiProfile = keys[(keys.indexOf(gameState.aiProfile) + 1) % keys.length];
    } else if (key === 'a') {
        gameState.aiAutoUpgrade = !gameState.aiAutoUpgrade;
    } else if (key === 'v') {
        cycleGameSpeed();
    }
}

document.addEventListener('keydown', handleKey);
