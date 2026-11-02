let waveState = createWaveState();

function createWaveState() {
    return {
        currentWave: 0,
        queue: [],
        spawnTimer: 0,
        totalInWave: 0,
        pendingClears: 0,   // vagues lancées mais pas encore nettoyées
        countdown: 0,       // ms avant le lancement auto de la vague suivante
        started: false
    };
}

function isSpawning() {
    return waveState.queue.length > 0;
}

function canCallNextWave() {
    return !gameState.gameOver && !isSpawning();
}

function getEarlyCallBonus() {
    if (!waveState.started) return 0;
    if (waveState.countdown > 0) {
        return Math.floor((waveState.countdown / 1000) * EARLY_CALL_BONUS_PER_SEC);
    }
    // Vague appelée alors que des ennemis sont encore sur le terrain
    return enemies.length > 0 ? 15 + waveState.currentWave * 2 : 0;
}

function startNextWave() {
    if (!canCallNextWave()) return false;

    const earlyBonus = getEarlyCallBonus();
    if (earlyBonus > 0) {
        gameState.money += earlyBonus;
        gameState.score += earlyBonus * 2;
    }

    waveState.currentWave += 1;
    waveState.queue = buildWaveQueue(waveState.currentWave);
    waveState.totalInWave = waveState.queue.length;
    waveState.spawnTimer = 0;
    waveState.pendingClears += 1;
    waveState.countdown = 0;
    waveState.started = true;

    const wave = waveState.currentWave;
    const isBoss = wave % 10 === 0;
    showBanner(
        isBoss ? `VAGUE ${wave} — BOSS !` : `VAGUE ${wave}`,
        earlyBonus > 0 ? `Appel anticipé : +${earlyBonus}$` : (wave % 5 === 0 && !isBoss ? 'Vague renforcée' : ''),
        isBoss ? '#ff6600' : '#FFD700'
    );
    return true;
}

function updateWave(dt) {
    if (isSpawning()) {
        waveState.spawnTimer += dt;
        while (waveState.queue.length && waveState.spawnTimer >= waveState.queue[0].delay) {
            const next = waveState.queue.shift();
            waveState.spawnTimer -= next.delay;
            spawnEnemy(next.type, waveState.currentWave);
        }
        return;
    }

    if (waveState.pendingClears > 0 && enemies.length === 0) {
        // Toutes les vagues lancées sont nettoyées : prime et compte à rebours
        let bonus = 0;
        for (let i = 0; i < waveState.pendingClears; i++) {
            const w = waveState.currentWave - i;
            bonus += 20 + w * 4;
            gameState.score += 100 * w;
        }
        waveState.pendingClears = 0;
        gameState.money += bonus;
        waveState.countdown = WAVE_COUNTDOWN_MS;
        showBanner('Vague terminée', `Prime : +${bonus}$`, '#7CFC00');
        return;
    }

    if (waveState.countdown > 0 && gameState.autoWaves) {
        waveState.countdown -= dt;
        if (waveState.countdown <= 0) {
            waveState.countdown = 0;
            startNextWave();
        }
    }
}

function getWaveProgress() {
    if (!waveState.totalInWave) return 0;
    const alive = enemies.length + waveState.queue.length;
    return clamp(1 - alive / waveState.totalInWave, 0, 1);
}

// Bannière centrale animée dessinée sur le canvas
function showBanner(text, sub = '', color = '#FFD700') {
    gameState.banner = { text, sub, color, life: 2200, maxLife: 2200 };
}

function updateBanner(realDt) {
    if (!gameState.banner) return;
    gameState.banner.life -= realDt;
    if (gameState.banner.life <= 0) gameState.banner = null;
}

function drawBanner(ctx) {
    const b = gameState.banner;
    if (!b) return;
    const t = 1 - b.life / b.maxLife;
    const alpha = t < 0.15 ? t / 0.15 : (t > 0.8 ? (1 - t) / 0.2 : 1);
    const scale = t < 0.15 ? 0.8 + (t / 0.15) * 0.2 : 1;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.fillStyle = 'rgba(10, 10, 30, 0.8)';
    const w = 380;
    const h = b.sub ? 90 : 64;
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.strokeStyle = b.color;
    ctx.lineWidth = 3;
    ctx.strokeRect(-w / 2, -h / 2, w, h);
    ctx.textAlign = 'center';
    ctx.fillStyle = b.color;
    ctx.font = 'bold 32px Arial';
    ctx.fillText(b.text, 0, b.sub ? -4 : 11);
    if (b.sub) {
        ctx.fillStyle = '#fff';
        ctx.font = '17px Arial';
        ctx.fillText(b.sub, 0, 28);
    }
    ctx.restore();
}
