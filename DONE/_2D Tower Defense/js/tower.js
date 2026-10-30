let towers = [];
let nextTowerId = 1;

// fireRate en ms entre deux tirs, projectileSpeed en pixels/seconde
const TOWER_TYPES = {
    BASIC: {
        name: 'Canon', short: 'B', key: '1',
        cost: 50, range: 130, damage: 22, fireRate: 700,
        color: '#4169e1', projectileSpeed: 420,
        desc: 'Polyvalent et bon marché.'
    },
    RAPID: {
        name: 'Mitrailleuse', short: 'R', key: '2',
        cost: 70, range: 110, damage: 9, fireRate: 220,
        color: '#27ae60', projectileSpeed: 520,
        desc: 'Tir très rapide, faible contre l\'armure.'
    },
    SNIPER: {
        name: 'Sniper', short: 'S', key: '3',
        cost: 110, range: 240, damage: 85, fireRate: 1600,
        color: '#8e44ad', hitscan: true, pierce: true,
        desc: 'Très longue portée, ignore l\'armure.'
    },
    FROST: {
        name: 'Givre', short: 'G', key: '4',
        cost: 80, range: 105, damage: 6, fireRate: 900,
        color: '#48c9f0', projectileSpeed: 360, splash: 45,
        slow: { factor: 0.5, duration: 1600 },
        desc: 'Ralentit les ennemis dans une zone.'
    },
    MORTAR: {
        name: 'Mortier', short: 'M', key: '5',
        cost: 130, range: 165, damage: 45, fireRate: 1500,
        color: '#e67e22', projectileSpeed: 260, splash: 60,
        desc: 'Dégâts de zone, idéal contre les essaims.'
    }
};

const TARGET_MODES = [
    { key: 'first', label: 'Premier' },
    { key: 'last', label: 'Dernier' },
    { key: 'strong', label: 'Plus fort' },
    { key: 'close', label: 'Plus proche' }
];

// Bonus d'amélioration selon la doctrine choisie (touche G)
const UPGRADE_DOCTRINES = {
    neutre:       { damage: 1.28, range: 1.07, rate: 0.92, costFactor: 1 },
    guerrier:     { damage: 1.36, range: 1.04, rate: 0.92, costFactor: 1 },
    scientifique: { damage: 1.22, range: 1.12, rate: 0.93, costFactor: 1 },
    magnat:       { damage: 1.24, range: 1.06, rate: 0.94, costFactor: 0.85 },
    pacifique:    { damage: 1.2,  range: 1.09, rate: 0.88, costFactor: 1 }
};

function addTower(gridX, gridY, type = 'BASIC') {
    const template = TOWER_TYPES[type] || TOWER_TYPES.BASIC;
    const tower = {
        id: nextTowerId++,
        gridX,
        gridY,
        x: gridToWorld(gridX) + TILE_SIZE / 2,
        y: gridToWorld(gridY) + TILE_SIZE / 2,
        type,
        range: template.range,
        damage: template.damage,
        fireRate: template.fireRate,
        splash: template.splash || 0,
        slow: template.slow ? { ...template.slow } : null,
        color: template.color,
        cooldown: 0,
        recoil: 0,
        angle: -Math.PI / 2,
        target: null,
        targeting: 'first',
        kills: 0,
        damageDealt: 0,
        level: 1,
        totalSpent: template.cost
    };
    towers.push(tower);
    return tower;
}

function findTarget(tower) {
    const candidates = getEnemiesInRange(tower.x, tower.y, tower.range);
    if (!candidates.length) return null;

    let best = candidates[0];
    candidates.forEach((e) => {
        switch (tower.targeting) {
            case 'last':
                if (e.traveled < best.traveled) best = e;
                break;
            case 'strong':
                if (e.life > best.life) best = e;
                break;
            case 'close':
                if (distance(tower.x, tower.y, e.x, e.y) < distance(tower.x, tower.y, best.x, best.y)) best = e;
                break;
            default:
                if (e.traveled > best.traveled) best = e;
        }
    });
    return best;
}

function updateTowers(dt) {
    towers.forEach((tower) => {
        tower.cooldown = Math.max(0, tower.cooldown - dt);
        tower.recoil = Math.max(0, tower.recoil - dt);
        tower.target = findTarget(tower);

        if (tower.target) {
            tower.angle = angleToTarget(tower.x, tower.y, tower.target.x, tower.target.y);
            if (tower.cooldown <= 0) {
                fireTower(tower, tower.target);
                tower.cooldown = tower.fireRate;
                tower.recoil = 120;
            }
        }
    });
}

function fireTower(tower, target) {
    const template = TOWER_TYPES[tower.type];
    const muzzle = TOWER_SIZE / 2 + 4;
    const mx = tower.x + Math.cos(tower.angle) * muzzle;
    const my = tower.y + Math.sin(tower.angle) * muzzle;

    if (template.hitscan) {
        damageEnemy(target, tower.damage, tower, template.pierce);
        createBeam(mx, my, target.x, target.y, tower.color);
        createImpactEffect(target.x, target.y, '#e8c4ff');
        return;
    }

    projectiles.push({
        x: mx,
        y: my,
        tx: target.x,
        ty: target.y,
        target,
        tower,
        speed: template.projectileSpeed,
        damage: tower.damage,
        splash: tower.splash,
        slow: tower.slow,
        color: tower.type === 'FROST' ? '#bff3ff' : (tower.type === 'MORTAR' ? '#333' : '#ffff66'),
        size: tower.type === 'MORTAR' ? 6 : (tower.type === 'RAPID' ? 3 : PROJECTILE_SIZE),
        arc: tower.type === 'MORTAR',
        startDist: distance(mx, my, target.x, target.y),
        trail: []
    });
}

function drawTowerRange(ctx, tower, color = 'rgba(255, 255, 255, 0.12)') {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
}

function drawTowerBody(ctx, x, y, type, angle, level, recoil) {
    const template = TOWER_TYPES[type] || TOWER_TYPES.BASIC;
    const half = TOWER_SIZE / 2;

    // Socle
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(x, y + half - 1, half, half / 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#3b3f4a';
    ctx.fillRect(x - half, y - half, TOWER_SIZE, TOWER_SIZE);
    ctx.fillStyle = template.color;
    ctx.fillRect(x - half + 3, y - half + 3, TOWER_SIZE - 6, TOWER_SIZE - 6);

    // Tourelle orientée
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    const back = recoil > 0 ? -3 * (recoil / 120) : 0;
    ctx.fillStyle = '#1d2433';
    if (type === 'RAPID') {
        ctx.fillRect(back, -5, half + 6, 3);
        ctx.fillRect(back, 2, half + 6, 3);
    } else if (type === 'SNIPER') {
        ctx.fillRect(back, -2, half + 12, 4);
    } else if (type === 'MORTAR') {
        ctx.fillRect(back, -6, half, 12);
    } else if (type === 'FROST') {
        ctx.fillStyle = '#e8fbff';
        ctx.beginPath();
        ctx.moveTo(half + 4 + back, 0);
        ctx.lineTo(back, -6);
        ctx.lineTo(back, 6);
        ctx.closePath();
        ctx.fill();
    } else {
        ctx.fillRect(back, -3.5, half + 6, 7);
    }
    ctx.fillStyle = template.color;
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1d2433';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Niveau (pastilles)
    for (let i = 0; i < level; i++) {
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(x - half + 5 + i * 5, y + half - 4, 1.8, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawTowers(ctx) {
    towers.forEach((tower) => {
        const selected = gameState.selectedTowers.includes(tower);
        if (selected) {
            drawTowerRange(ctx, tower, 'rgba(255, 215, 0, 0.12)');
        } else if (gameState.hoveredTower === tower) {
            drawTowerRange(ctx, tower);
        }
    });

    towers.forEach((tower) => {
        drawTowerBody(ctx, tower.x, tower.y, tower.type, tower.angle, tower.level, tower.recoil);
        if (gameState.selectedTowers.includes(tower)) {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            ctx.strokeRect(tower.x - TOWER_SIZE / 2 - 2, tower.y - TOWER_SIZE / 2 - 2, TOWER_SIZE + 4, TOWER_SIZE + 4);
        }
    });
}

function getTowerAt(x, y) {
    return towers.find((tower) =>
        Math.abs(tower.x - x) <= TILE_SIZE / 2 &&
        Math.abs(tower.y - y) <= TILE_SIZE / 2
    );
}

function getDoctrine(strategy) {
    return UPGRADE_DOCTRINES[String(strategy || 'neutre').toLowerCase()] || UPGRADE_DOCTRINES.neutre;
}

function canUpgrade(tower) {
    return !!tower && tower.level < MAX_TOWER_LEVEL;
}

function getUpgradeCost(tower, strategy = gameState.aiProfile) {
    const template = TOWER_TYPES[tower.type] || TOWER_TYPES.BASIC;
    return Math.round(template.cost * (0.6 + 0.35 * tower.level) * getDoctrine(strategy).costFactor);
}

function getSellValue(tower) {
    return Math.floor(tower.totalSpent * SELL_REFUND);
}

function upgradeTower(tower, strategy = 'neutre') {
    if (!canUpgrade(tower) || !gameState) return false;

    const cost = getUpgradeCost(tower, strategy);
    if (gameState.money < cost) return false;
    gameState.money -= cost;

    const d = getDoctrine(strategy);
    tower.level += 1;
    tower.totalSpent += cost;
    tower.damage = Math.round(tower.damage * d.damage * 10) / 10;
    tower.range = Math.round(tower.range * d.range);
    tower.fireRate = Math.max(120, Math.round(tower.fireRate * d.rate));
    if (tower.splash) tower.splash += 5;
    if (tower.slow) {
        tower.slow.factor = Math.max(0.3, tower.slow.factor - 0.05);
        tower.slow.duration += 200;
    }
    addFloatingText(tower.x, tower.y - 20, `Niv. ${tower.level}`, '#9ad1ff');
    return true;
}

function upgradeTowerGroup(group, strategy = 'neutre', maxOperations = 999) {
    if (!Array.isArray(group) || group.length === 0) return 0;

    const sorted = group.slice().sort((a, b) => a.level - b.level);
    const cap = Math.max(1, Math.floor(Number(maxOperations) || 1));
    let upgraded = 0;

    sorted.forEach((tower) => {
        if (upgraded >= cap) return;
        if (upgradeTower(tower, strategy)) upgraded += 1;
    });

    return upgraded;
}

function sellTower(tower) {
    const index = towers.indexOf(tower);
    if (index < 0) return 0;
    const value = getSellValue(tower);
    towers.splice(index, 1);
    gameState.money += value;
    addFloatingText(tower.x, tower.y - 10, `+${value}$`, '#7CFC00');
    return value;
}
