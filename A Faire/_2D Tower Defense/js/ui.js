/* WarLike Tower Defense — DOM tactical HUD.
   Uses the original game systems; no duplicate combat logic or game state. */
'use strict';
let tdUIReady = false;
let tdUILastUpdate = -Infinity;
let tdArmedAbility = null;
let tdFeedbackMessage = '';
let tdFeedbackExpiry = 0;
let tdIntelWave = -1;
let tdShowRanges = false;
let tdShowThreats = true;
const tdDangerWaypoint = () => pathWaypoints.length - 2;
const tdById = (id) => document.getElementById(id);
const tdClamp = (v, low, high) => Math.min(high, Math.max(low, v));

function tdFeedback(text, duration = 2800) {
    tdFeedbackMessage = text;
    tdFeedbackExpiry = performance.now() + duration;
    const region = tdById('td-feedback');
    if (region) region.textContent = text;
}
function tdSetText(id, value) {
    const node = tdById(id);
    if (node) {
        const content = String(value);
        if (node.textContent !== content) node.textContent = content;
    }
}
function tdHealthTarget() {
    const pool = enemies.filter(e => e.isBoss && e.life > 0 && !e.reachedEnd);
    return pool.length ? pool.reduce((a, b) => a.life < b.life ? a : b) : null;
}
function tdIconFor(type) {
    const t = TOWER_TYPES[type];
    const preview = document.createElement('canvas');
    preview.width = 56; preview.height = 56;
    const pen = preview.getContext('2d');
    if (!pen) return null;
    pen.save();
    pen.translate(28, 28);
    pen.scale(1.15, 1.15);
    pen.translate(-28, -28);
    drawTowerBody(pen, 28, 28, type, -Math.PI / 4, 1, 0);
    pen.restore();
    try { return preview.toDataURL('image/png'); } catch { return null; }
}
function tdSelected() {
    return gameState.selectedTowers.filter(t => towers.includes(t));
}
function tdActionAllowed() {
    return !gameState.gameOver && !gameState.paused;
}
function tdClearAim() {
    tdArmedAbility = null;
}
function tdCancelModes() {
    tdClearAim();
    gameState.placingTower = false;
    tdFeedback('Mode de placement et ciblage annulés.', 1700);
    updateTDUI(true);
}
function tdCountTargetsAt(wx, wy, radius) {
    return enemies.filter(e => e.life > 0 && !e.reachedEnd && Math.hypot(e.x - wx, e.y - wy) <= radius).length;
}
function tdCursorLabel() {
    const tile = gameState.hoveredTile;
    const valid = tile && tile.x >= 0 && tile.x < MAP_COLS && tile.y >= 0 && tile.y < MAP_ROWS;
    if (gameState.paused) return 'Simulation en pause';
    if (gameState.gameOver) return 'La base est tombée';
    if (!valid) {
        if (tdArmedAbility) return 'Survole la carte pour viser ' + TD_ABILITIES[tdArmedAbility].name;
        return gameState.placingTower ? 'Déplace le pointeur sur une case pour construire' : 'Survole une défense pour examiner sa portée';
    }
    const wx = gridToWorld(tile.x) + TILE_SIZE / 2;
    const wy = gridToWorld(tile.y) + TILE_SIZE / 2;
    if (tdArmedAbility) {
        const def = TD_ABILITIES[tdArmedAbility];
        const n = tdCountTargetsAt(wx, wy, def.radius);
        return def.name + ' · ' + n + ' cible' + (n > 1 ? 's' : '') + ' dans le rayon de ' + def.radius + ' px';
    }
    if (gameState.placingTower) {
        const type = TOWER_TYPES[gameState.selectedTowerType];
        const available = isValidTowerPosition(tile.x, tile.y);
        return 'Case ' + (tile.x + 1) + ':' + (tile.y + 1) + ' · ' + (available ? gameState.money >= type.cost ? 'Libre · cliquer pour construire' : 'Crédits insuffisants' : 'Occupation ou terrain interdit');
    }
    if (gameState.hoveredTower) return TOWER_TYPES[gameState.hoveredTower.type].name + ' · ' + Math.ceil(gameState.hoveredTower.hp) + ' PV · clic pour inspecter';
    return 'Case ' + (tile.x + 1) + ':' + (tile.y + 1) + ' · clique sur une tour pour inspecter';
}
function tdUseAbility(key) {
    if (!tdActionAllowed()) return;
    if (key === 'repair') {
        if (!activateTacticalAbility('repair')) tdFeedback('Sélectionne une tour endommagée et vérifie le coût ou le rechargement.');
        else tdFeedback('Réparation effectuée.');
    } else {
        if (tdArmedAbility === key) {
            tdClearAim();
            tdFeedback('Ciblage annulé.');
        } else {
            if (gameState.money < TD_ABILITIES[key].cost || gameState.abilityCooldowns[key] > 0) return;
            tdArmedAbility = key;
            gameState.placingTower = false;
            tdFeedback('Clique sur une zone contenant des ennemis pour déclencher ' + TD_ABILITIES[key].name + '.');
        }
    }
    updateTDUI(true);
}
function tdRenderIntel() {
    const next = waveState.currentWave + 1;
    if (tdIntelWave === next) return;
    tdIntelWave = next;
    const container = tdById('td-intel-list');
    if (!container) return;
    container.replaceChildren();
    tdSetText('td-intel-title', 'Vague ' + next + (next % 10 === 0 ? ' · BOSS EN APPROCHE' : ''));
    const composition = getWavePreview(next);
    for (const [type, count] of Object.entries(composition)) {
        const enemy = ENEMY_TYPES[type];
        if (!enemy) continue;
        const line = document.createElement('div');
        line.className = 'td-intel-row';
        const dot = document.createElement('i');
        dot.className = 'td-intel-dot';
        dot.style.background = enemy.color;
        const label = document.createElement('span');
        label.textContent = enemy.name;
        const number = document.createElement('strong');
        number.textContent = '×' + count;
        line.append(dot, label, number);
        container.append(line);
    }
}
function initTDUI() {
    if (tdUIReady) return;
    const grid = tdById('td-build-grid');
    if (!grid) return;
    const types = Object.keys(TOWER_TYPES).sort((a, b) =>
        Number(TOWER_TYPES[a].key) - Number(TOWER_TYPES[b].key));
    for (const type of types) {
        const t = TOWER_TYPES[type];
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'td-build-card';
        button.dataset.type = type;
        button.title = t.desc;
        button.setAttribute('aria-label', t.name + ', ' + t.cost + ' dollars, touche ' + t.key);
        const image = document.createElement('img');
        image.className = 'td-build-icon';
        image.alt = '';
        image.setAttribute('aria-hidden', 'true');
        const icon = tdIconFor(type);
        if (icon) image.src = icon;
        const content = document.createElement('span');
        content.className = 'td-build-text';
        const title = document.createElement('span');
        title.className = 'td-build-name';
        title.textContent = t.name;
        const cost = document.createElement('span');
        cost.className = 'td-build-cost';
        cost.textContent = t.cost + ' $';
        content.append(title, cost);
        const hotkey = document.createElement('span');
        hotkey.className = 'td-build-hotkey';
        hotkey.textContent = t.key;
        button.append(image, content, hotkey);
        button.addEventListener('click', () => {
            if (!tdActionAllowed()) return;
            tdClearAim();
            selectBuildType(type);
            tdFeedback(gameState.placingTower ? t.name + ' : clique sur une case verte pour construire.' : 'Construction annulée.', 1800);
            updateTDUI(true);
        });
        grid.append(button);
    }
    tdById('td-show-ranges').addEventListener('click', () => {
        tdShowRanges = !tdShowRanges;
        updateTDUI(true);
    });
    tdById('td-show-threats').addEventListener('click', () => {
        tdShowThreats = !tdShowThreats;
        updateTDUI(true);
    });
    tdById('td-cancel').addEventListener('click', tdCancelModes);
    tdById('td-next').addEventListener('click', () => {
        if (!tdActionAllowed()) return;
        if (!startNextWave()) tdFeedback('La vague actuelle doit finir son déploiement.');
        updateTDUI(true);
    });
    tdById('td-pause').addEventListener('click', () => {
        if (gameState.gameOver) return;
        gameState.paused = !gameState.paused;
        updateTDUI(true);
    });
    tdById('td-speed').addEventListener('click', () => {
        if (!gameState.gameOver) cycleGameSpeed();
        updateTDUI(true);
    });
    tdById('td-restart').addEventListener('click', () => {
        resetGame(); tdClearAim(); tdFeedback('Nouvelle partie : construis tes défenses avant la première vague.');
        updateTDUI(true);
    });
    tdById('td-upgrade').addEventListener('click', () => {
        if (!tdActionAllowed()) return;
        const sel = tdSelected();
        const changed = upgradeTowerGroup(sel, gameState.aiProfile, sel.length);
        tdFeedback(changed ? changed + ' tour(s) améliorée(s).' : 'Pas assez de fonds ou niveau maximal.', 1800);
        updateTDUI(true);
    });
    tdById('td-sell').addEventListener('click', () => {
        if (!tdActionAllowed()) return;
        const selected = tdSelected();
        if (!selected.length) return;
        // Selling is irreversible, including with multi-selection.
        const value = selected.reduce((total, t) => total + getSellValue(t), 0);
        if (selected.length > 1 && !confirm('Vendre ' + selected.length + ' tours pour ' + value + ' $ ?')) return;
        selected.forEach(sellTower);
        setSelectedTowers([]);
        tdFeedback('Vente terminée : +' + value + ' $.', 1800);
        updateTDUI(true);
    });
    tdById('td-target').addEventListener('click', () => {
        const selected = tdSelected();
        if (!selected.length) return;
        const i = TARGET_MODES.findIndex(m => m.key === selected[0].targeting);
        const next = TARGET_MODES[(i + 1) % TARGET_MODES.length];
        selected.forEach(t => { t.targeting = next.key; });
        updateTDUI(true);
    });
    tdById('td-doctrine').addEventListener('change', e => {
        if (TD_AI_PROFILES[e.target.value]) gameState.aiProfile = e.target.value;
        updateTDUI(true);
    });
    tdById('td-auto').addEventListener('click', () => {
        gameState.aiAutoUpgrade = !gameState.aiAutoUpgrade;
        updateTDUI(true);
    });
    for (const ability of Object.keys(TD_ABILITIES)) {
        tdById('td-ability-' + ability).addEventListener('click', () => tdUseAbility(ability));
    }
    tdUIReady = true;
    tdFeedback('Sélectionne une défense ci-dessous, puis place-la sur la carte.', 7000);
    updateTDUI(true);
}
function updateTDUI(force = false) {
    if (!tdUIReady) return;
    const now = performance.now();
    if (!force && now - tdUILastUpdate < 110) return;
    tdUILastUpdate = now;
    tdRenderIntel();
    tdSetText('td-money', gameState.money + ' $');
    tdSetText('td-lives', gameState.lives);
    tdSetText('td-wave-number', waveState.currentWave || '—');
    tdSetText('td-cursor-status', tdCursorLabel());
    for (const [id, enabled] of [['td-show-ranges', tdShowRanges], ['td-show-threats', tdShowThreats]]) {
        tdById(id).classList.toggle('is-active', enabled);
        tdById(id).setAttribute('aria-pressed', String(enabled));
    }
    const needsCancel = gameState.placingTower || !!tdArmedAbility;
    tdById('td-cancel').disabled = !needsCancel || !tdActionAllowed();
    const urgent = enemies.filter(e => e.life > 0 && !e.reachedEnd && e.waypoint >= tdDangerWaypoint());
    const alert = tdById('td-danger-alert');
    alert.hidden = urgent.length === 0 || gameState.gameOver;
    if (urgent.length) tdSetText('td-danger-text', urgent.length + ' adversaire' + (urgent.length > 1 ? 's' : '') + ' proche' + (urgent.length > 1 ? 's' : '') + ' de la sortie !');
    tdSetText('td-score', Math.floor(gameState.score));
    tdSetText('td-speed', '×' + GAME_SPEED + ' Vitesse');
    tdSetText('td-pause', gameState.paused ? '▶ Reprendre' : 'Ⅱ Pause');
    tdSetText('td-game-state', gameState.gameOver ? 'Partie terminée' : gameState.paused ? 'Simulation en pause' : gameState.placingTower ? 'Mode construction' : tdArmedAbility ? 'Choisir une cible' : 'Défendre la base');
    const status = tdById('td-wave-status');
    if (status) status.textContent = gameState.gameOver ? 'Défense percée' : !waveState.started ? 'Prêt au déploiement' :
        isSpawning() || enemies.length ? 'Assaut en cours' :
        waveState.countdown > 0 ? 'Renforts dans ' + Math.ceil(waveState.countdown / 1000) + ' s' : 'Secteur sécurisé';
    const meter = tdById('td-wave-fill');
    if (meter) meter.style.width = Math.round(getWaveProgress() * 100) + '%';
    tdSetText('td-wave-meta', (enemies.length + waveState.queue.length) + ' menaces restantes · ' + towers.length + ' défenses placées');
    const next = tdById('td-next');
    const bonus = getEarlyCallBonus();
    tdSetText('td-next-label', waveState.started ? 'Vague ' + (waveState.currentWave + 1) + (bonus ? ' · +' + bonus + ' $' : '') : 'Lancer la vague 1');
    next.disabled = !tdActionAllowed() || !canCallNextWave();
    tdById('td-pause').disabled = gameState.gameOver;
    tdById('td-speed').disabled = gameState.gameOver;
    tdById('td-restart').hidden = !gameState.gameOver;

    const boss = tdHealthTarget();
    const bossEl = tdById('td-boss');
    bossEl.hidden = !boss;
    if (boss) {
        tdSetText('td-boss-hp', Math.ceil(boss.life) + ' / ' + boss.maxLife + ' PV');
        tdById('td-boss-fill').style.width = (100 * tdClamp(boss.life / boss.maxLife, 0, 1)).toFixed(1) + '%';
    }
    for (const btn of tdById('td-build-grid').children) {
        const k = btn.dataset.type;
        const t = TOWER_TYPES[k];
        const active = gameState.placingTower && gameState.selectedTowerType === k;
        btn.classList.toggle('is-active', active);
        btn.classList.toggle('is-unaffordable', gameState.money < t.cost);
        btn.disabled = !tdActionAllowed();
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    }
    const selected = tdSelected();
    if (!selected.length) {
        tdSetText('td-selected-name', 'Aucune tour sélectionnée');
        tdSetText('td-selected-sub', 'Clique sur une défense installée pour voir ses statistiques, améliorer ou revendre.');
        tdSetText('td-selected-damage', '—');
        tdSetText('td-selected-range', '—');
        tdSetText('td-selected-rate', '—');
        tdSetText('td-selected-hp', '—');
        tdSetText('td-selected-kills', '—');
        tdSetText('td-selected-level', '—');
    } else if (selected.length === 1) {
        const t = selected[0];
        tdSetText('td-selected-name', TOWER_TYPES[t.type].name);
        tdSetText('td-selected-sub', TOWER_TYPES[t.type].desc);
        tdSetText('td-selected-damage', Math.round(t.damage * 10) / 10);
        tdSetText('td-selected-range', t.range + ' px');
        tdSetText('td-selected-rate', (1000 / t.fireRate).toFixed(1) + '/s');
        tdSetText('td-selected-hp', Math.ceil(t.hp) + '/' + t.maxHp);
        tdSetText('td-selected-kills', t.kills);
        tdSetText('td-selected-level', t.level + '/' + MAX_TOWER_LEVEL);
    } else {
        tdSetText('td-selected-name', selected.length + ' tours sélectionnées');
        tdSetText('td-selected-sub', 'Actions groupées : amélioration, vente et ciblage. Shift+clic ajoute ou retire une tour.');
        tdSetText('td-selected-damage', Math.round(selected.reduce((n, t) => n + t.damage, 0)));
        tdSetText('td-selected-range', 'Mixte');
        tdSetText('td-selected-rate', 'Mixte');
        tdSetText('td-selected-hp', selected.reduce((n, t) => n + Math.ceil(t.hp), 0) + ' PV');
        tdSetText('td-selected-kills', selected.reduce((n, t) => n + t.kills, 0));
        tdSetText('td-selected-level', 'Mixte');
    }
    const healthCurrent = selected.reduce((sum, t) => sum + Math.max(0, t.hp), 0);
    const healthMaximum = selected.reduce((sum, t) => sum + t.maxHp, 0);
    const healthRatio = healthMaximum ? tdClamp(healthCurrent / healthMaximum, 0, 1) : 0;
    tdSetText('td-integrity-pct', healthMaximum ? Math.round(healthRatio * 100) + ' %' : '—');
    tdById('td-integrity-fill').style.width = Math.round(healthRatio * 100) + '%';
    tdById('td-integrity-fill').style.background = healthRatio < 0.28 ? '#ef586c' : healthRatio < 0.56 ? '#f3b95d' : '#5bdfa7';
    const upgradable = selected.filter(canUpgrade);
    const nextCost = upgradable.length ? Math.min(...upgradable.map(t => getUpgradeCost(t))) : 0;
    tdSetText('td-upgrade', upgradable.length ? '↑ Améliorer · dès ' + nextCost + ' $' : '↑ Niveau maximum');
    tdById('td-upgrade').disabled = !tdActionAllowed() || !upgradable.length || gameState.money < nextCost;
    tdSetText('td-sell', 'Vendre · ' + selected.reduce((v, t) => v + getSellValue(t), 0) + ' $');
    tdById('td-sell').disabled = !tdActionAllowed() || !selected.length;
    const targeting = selected.length && TARGET_MODES.find(m => m.key === selected[0].targeting);
    tdSetText('td-target', targeting ? 'Cible : ' + targeting.label : 'Mode de ciblage');
    tdById('td-target').disabled = !tdActionAllowed() || !selected.length;
    const doctrine = tdById('td-doctrine');
    if (doctrine.value !== gameState.aiProfile) doctrine.value = gameState.aiProfile;
    tdSetText('td-auto', 'Auto-amélioration : ' + (gameState.aiAutoUpgrade ? 'ON' : 'OFF'));
    tdById('td-auto').classList.toggle('is-active', gameState.aiAutoUpgrade);
    for (const [name, ability] of Object.entries(TD_ABILITIES)) {
        const remaining = gameState.abilityCooldowns[name] || 0;
        const button = tdById('td-ability-' + name);
        button.disabled = !tdActionAllowed() || !!remaining || gameState.money < ability.cost ||
            (name === 'repair' && !selected.some(t => t.hp < t.maxHp));
        const active = name === tdArmedAbility;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
        tdSetText('td-ability-cost-' + name, remaining > 0 ? Math.ceil(remaining / 1000) + ' s' : ability.cost + ' $');
    }
    const feedback = tdById('td-feedback');
    if (now > tdFeedbackExpiry) {
        feedback.textContent = gameState.gameOver ? 'La base est perdue. Clique sur « Recommencer » pour repartir.' :
            gameState.paused ? 'Pause active : appuie sur P ou Reprendre.' :
            tdArmedAbility ? 'Clique sur la carte pour choisir la cible du pouvoir.' :
            gameState.placingTower ? 'Clique sur une case libre pour construire (Échap pour annuler).' :
            'Sélectionne une tour, ou prépare la prochaine vague.';
    } else if (feedback.textContent !== tdFeedbackMessage) {
        feedback.textContent = tdFeedbackMessage;
    }
}
