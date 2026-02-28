const TYCOON_STORAGE_KEY = "tycoon2d_v3";
const TYCOON_GOVERNOR_STORAGE_KEY = "tycoon2d_governor_v1";
const MAX_OFFLINE_SECONDS = 10 * 60 * 60;
const BOOST_COOLDOWN_SECONDS = 25;
const MAX_NOTIFICATIONS = 40;

const TYCOON_GOVERNOR_PROFILES = {
    magnat: {
        label: "Magnat",
        reserve: 650,
        cadenceSec: 1.8,
        maxBurst: 8,
        weights: { banque: 3.4, hotel: 2.8, ferme: 1.2, mine: 1.1, usine: 0.8 }
    },
    guerrier: {
        label: "Guerrier",
        reserve: 120,
        cadenceSec: 1.2,
        maxBurst: 12,
        weights: { mine: 1.8, ferme: 1.7, hotel: 1.6, banque: 1.5, usine: 1.4 }
    },
    scientifique: {
        label: "Scientifique",
        reserve: 260,
        cadenceSec: 1.4,
        maxBurst: 7,
        weights: { mine: 1.3, ferme: 1.4, hotel: 1.7, banque: 2.2, usine: 1.2 }
    },
    pacifique: {
        label: "Pacifique",
        reserve: 520,
        cadenceSec: 2,
        maxBurst: 6,
        weights: { ferme: 2.2, usine: 1.9, mine: 1.4, hotel: 1.3, banque: 1.2 }
    },
    neutre: {
        label: "Neutre",
        reserve: 300,
        cadenceSec: 1.6,
        maxBurst: 7,
        weights: { usine: 1.2, mine: 1.4, ferme: 1.5, hotel: 1.6, banque: 1.8 }
    }
};

const MILESTONES = [
    {
        id: "starter",
        name: "Premier investissement",
        description: "Atteins 1 niveau total.",
        type: "totalLevel",
        target: 1,
        reward: { cash: 120, multiplier: 0.02 }
    },
    {
        id: "cash_1k",
        name: "Tresorerie stable",
        description: "Atteins 1 000 EUR en caisse.",
        type: "money",
        target: 1000,
        reward: { cash: 500, multiplier: 0.03 }
    },
    {
        id: "income_100",
        name: "Production serieuse",
        description: "Atteins 100 EUR / sec.",
        type: "income",
        target: 100,
        reward: { cash: 3000, multiplier: 0.04 }
    },
    {
        id: "levels_25",
        name: "Parc industriel",
        description: "Atteins 25 niveaux cumules.",
        type: "totalLevel",
        target: 25,
        reward: { cash: 12000, multiplier: 0.06 }
    },
    {
        id: "cash_100k",
        name: "Capital majeur",
        description: "Atteins 100 000 EUR en caisse.",
        type: "money",
        target: 100000,
        reward: { cash: 45000, multiplier: 0.08 }
    },
    {
        id: "income_5k",
        name: "Machine a profits",
        description: "Atteins 5 000 EUR / sec.",
        type: "income",
        target: 5000,
        reward: { cash: 200000, multiplier: 0.1 }
    }
];

let lastFrameTime = performance.now();
let uiTimer = 0;
let scoreTimer = 0;
let autosaveTimer = 0;
let bestCatalogScore = 0;
let readyMilestonesSnapshot = "";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas ? canvas.getContext("2d") : null;

const tycoonGovernor = {
    currentProfile: "neutre",
    enabled: true,
    investmentTimer: 0,
    notifyTimer: 0,

    init() {
        try {
            const raw = localStorage.getItem(TYCOON_GOVERNOR_STORAGE_KEY);
            if (!raw) return;
            const saved = JSON.parse(raw);
            if (saved && TYCOON_GOVERNOR_PROFILES[saved.profile]) {
                this.currentProfile = saved.profile;
            }
            if (saved && typeof saved.enabled === "boolean") {
                this.enabled = saved.enabled;
            }
        } catch (_error) {
            // Keep defaults if parsing fails.
        }
    },

    save() {
        try {
            localStorage.setItem(TYCOON_GOVERNOR_STORAGE_KEY, JSON.stringify({
                profile: this.currentProfile,
                enabled: this.enabled
            }));
        } catch (_error) {
            // no-op
        }
    },

    getProfile() {
        return TYCOON_GOVERNOR_PROFILES[this.currentProfile] || TYCOON_GOVERNOR_PROFILES.neutre;
    },

    getState() {
        const profile = this.getProfile();
        return {
            id: this.currentProfile,
            label: profile.label,
            enabled: this.enabled
        };
    },

    cycleProfile() {
        const keys = Object.keys(TYCOON_GOVERNOR_PROFILES);
        const index = keys.indexOf(this.currentProfile);
        this.currentProfile = keys[(index + 1) % keys.length];
        this.investmentTimer = 0;
        this.save();
        pushNotification(`Gouverneur: profil ${this.getProfile().label}.`, "ok");
        updateUI();
    },

    toggle() {
        this.enabled = !this.enabled;
        this.save();
        pushNotification(
            this.enabled
                ? "Gouverneur automatique active."
                : "Gouverneur automatique desactive.",
            this.enabled ? "ok" : "warn"
        );
        updateUI();
    },

    chooseInvestment() {
        const profile = this.getProfile();
        const reserve = Math.max(0, Number(profile.reserve) || 0);
        const multiplier = getIncomeMultiplier();
        const candidates = [];

        for (const building of gameData.buildings) {
            const cost = getBuildingCost(building);
            if (gameData.money - cost < reserve) continue;

            const currentIncome = getBuildingIncomePerSecond(building);
            const nextIncome = building.baseIncome * (building.level + 1) * multiplier;
            const deltaIncome = Math.max(0.01, nextIncome - currentIncome);
            const roi = cost / deltaIncome;
            const weight = Number(profile.weights[building.id]) || 1;
            const levelPenalty = 1 + (building.level * 0.08);

            // Higher score wins: cheap and efficient buildings are favored.
            let score = (weight * 1200) / (roi + 6);
            score /= levelPenalty;

            if (this.currentProfile === "scientifique") {
                // Scientific profile values steady compounding.
                const levelGapBonus = Math.max(0, 10 - building.level) * 5;
                score += levelGapBonus;
            } else if (this.currentProfile === "guerrier") {
                // Aggressive profile chases immediate income spikes.
                score += deltaIncome * 0.8;
            } else if (this.currentProfile === "pacifique") {
                // Pacifist profile avoids extreme specialization.
                const avgLevel = getTotalLevel() / Math.max(1, gameData.buildings.length);
                score -= Math.max(0, building.level - avgLevel) * 4;
            }

            candidates.push({ building, score });
        }

        if (candidates.length === 0) return null;
        candidates.sort((a, b) => b.score - a.score);
        return candidates[0].building;
    },

    update(deltaSeconds) {
        if (!this.enabled || gameData.isPaused) return;

        const profile = this.getProfile();
        this.investmentTimer += deltaSeconds;
        this.notifyTimer += deltaSeconds;

        if (this.investmentTimer < profile.cadenceSec) return;
        this.investmentTimer = 0;

        const target = this.chooseInvestment();
        if (!target) return;

        const steps = upgradeBuildingBulk(
            target,
            profile.maxBurst,
            profile.reserve,
            true
        );

        if (steps > 0 && this.notifyTimer >= 8) {
            this.notifyTimer = 0;
            pushNotification(`Gouverneur investit sur ${target.name} (+${steps} niv).`, "");
        }
    }
};

function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
}

function createFreshData() {
    if (typeof window.createTycoonDefaultData === "function") {
        return window.createTycoonDefaultData();
    }

    return {
        version: 3,
        money: 30,
        lastSave: Date.now(),
        gameSpeed: 1,
        isPaused: false,
        boostCooldown: 0,
        buildings: [],
        milestonesClaimed: [],
        notifications: [],
        particles: [],
        stats: {
            totalEarned: 30,
            totalSpent: 0,
            totalClicks: 0,
            playSeconds: 0,
            bestMoney: 30,
            bestIncome: 0,
            multiplierBonus: 0
        }
    };
}

function clampNumber(value, min, max, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, n));
}

function normalizeBuilding(template, rawBuilding) {
    const level = rawBuilding ? Math.max(0, Math.floor(Number(rawBuilding.level) || 0)) : 0;
    return {
        id: template.id,
        name: template.name,
        baseIncome: template.baseIncome,
        baseCost: template.baseCost,
        costGrowth: template.costGrowth || 1.15,
        x: template.x,
        y: template.y,
        color: template.color,
        icon: template.icon,
        level
    };
}

function normalizeGameData(rawData) {
    const fallback = createFreshData();
    const raw = rawData && typeof rawData === "object" ? rawData : {};

    const result = deepClone(fallback);

    result.version = 3;
    result.money = Math.max(0, Number(raw.money) || fallback.money);
    result.lastSave = Number(raw.lastSave) || fallback.lastSave;
    result.gameSpeed = clampNumber(raw.gameSpeed, 1, 4, 1);
    result.isPaused = false;
    result.boostCooldown = Math.max(0, Number(raw.boostCooldown) || 0);

    const rawBuildingsById = {};
    if (Array.isArray(raw.buildings)) {
        raw.buildings.forEach((building) => {
            if (building && typeof building.id === "string") {
                rawBuildingsById[building.id] = building;
            }
        });
    }

    const templates = Array.isArray(window.TYCOON_BUILDING_TEMPLATES)
        ? window.TYCOON_BUILDING_TEMPLATES
        : fallback.buildings;

    result.buildings = templates.map((template) => normalizeBuilding(template, rawBuildingsById[template.id]));

    const claimed = Array.isArray(raw.milestonesClaimed)
        ? raw.milestonesClaimed.filter((id) => MILESTONES.some((m) => m.id === id))
        : [];
    result.milestonesClaimed = Array.from(new Set(claimed));

    result.notifications = Array.isArray(raw.notifications)
        ? raw.notifications
            .filter((entry) => entry && entry.text)
            .slice(0, MAX_NOTIFICATIONS)
            .map((entry) => ({
                text: String(entry.text),
                type: entry.type || ""
            }))
        : [];

    const rawStats = raw.stats && typeof raw.stats === "object" ? raw.stats : {};
    result.stats = {
        totalEarned: Math.max(result.money, Number(rawStats.totalEarned) || result.money),
        totalSpent: Math.max(0, Number(rawStats.totalSpent) || 0),
        totalClicks: Math.max(0, Math.floor(Number(rawStats.totalClicks) || 0)),
        playSeconds: Math.max(0, Number(rawStats.playSeconds) || 0),
        bestMoney: Math.max(result.money, Number(rawStats.bestMoney) || result.money),
        bestIncome: Math.max(0, Number(rawStats.bestIncome) || 0),
        multiplierBonus: Math.max(0, Number(rawStats.multiplierBonus) || 0)
    };

    result.particles = [];
    result.currentStatus = "";

    return result;
}

function pushNotification(text, type = "") {
    const message = String(text || "").trim();
    if (!message) return;

    gameData.notifications.unshift({ text: message, type });
    if (gameData.notifications.length > MAX_NOTIFICATIONS) {
        gameData.notifications.length = MAX_NOTIFICATIONS;
    }

    gameData.currentStatus = message;
}

function getTotalLevel() {
    return gameData.buildings.reduce((sum, b) => sum + b.level, 0);
}

function getIncomeMultiplier() {
    const levelBonus = Math.floor(getTotalLevel() / 20) * 0.03;
    return 1 + (gameData.stats.multiplierBonus || 0) + Math.min(1.2, levelBonus);
}

function getBuildingIncomePerSecond(building) {
    if (!building || building.level <= 0) return 0;
    return building.baseIncome * building.level * getIncomeMultiplier();
}

function calculateIncome() {
    return gameData.buildings.reduce((sum, building) => sum + getBuildingIncomePerSecond(building), 0);
}

function getBuildingCost(building) {
    const growth = Number(building.costGrowth) || 1.15;
    return Math.floor(building.baseCost * Math.pow(growth, building.level));
}

function resolveBuilding(buildingOrId) {
    if (!buildingOrId) return null;

    if (typeof buildingOrId === "string") {
        return gameData.buildings.find((b) => b.id === buildingOrId) || null;
    }

    if (typeof buildingOrId === "object" && typeof buildingOrId.id === "string") {
        return gameData.buildings.find((b) => b.id === buildingOrId.id) || null;
    }

    return null;
}

function addMoney(amount, reasonType = "ok", reasonText = "") {
    const safeAmount = Number(amount) || 0;
    if (safeAmount <= 0) return;

    gameData.money += safeAmount;
    gameData.stats.totalEarned += safeAmount;

    if (reasonText) {
        pushNotification(reasonText, reasonType);
    }
}

function spendMoney(amount) {
    const safeAmount = Number(amount) || 0;
    if (safeAmount <= 0 || gameData.money < safeAmount) {
        return false;
    }

    gameData.money -= safeAmount;
    gameData.stats.totalSpent += safeAmount;
    return true;
}

function createMoneyParticles(amount, x, y) {
    const count = Math.min(14, 4 + Math.floor(amount / 80));
    for (let i = 0; i < count; i += 1) {
        gameData.particles.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 5,
            vy: -(Math.random() * 4 + 4),
            life: 0.8 + Math.random() * 0.7,
            value: Math.max(1, Math.floor(amount / count))
        });
    }
}

function upgradeBuildingBulk(buildingOrId, maxSteps = 1, reserve = 0, silent = false) {
    const building = resolveBuilding(buildingOrId);
    if (!building) return 0;

    const stepsCap = Math.max(1, Math.floor(Number(maxSteps) || 1));
    const reserveFloor = Math.max(0, Number(reserve) || 0);
    let steps = 0;
    let totalCost = 0;

    while (steps < stepsCap) {
        const cost = getBuildingCost(building);
        if ((gameData.money - cost) < reserveFloor) break;
        if (!spendMoney(cost)) break;

        building.level += 1;
        totalCost += cost;
        steps += 1;
    }

    if (steps <= 0) {
        if (!silent) {
            pushNotification("Fonds insuffisants pour cet investissement.", "warn");
        }
        return 0;
    }

    createMoneyParticles(totalCost * 0.15, building.x + 42, building.y + 18);
    const income = getBuildingIncomePerSecond(building);

    if (!silent) {
        if (steps > 1) {
            pushNotification(
                `${building.name} gagne ${steps} niveaux (Niv. ${building.level}, ${Math.floor(income)} EUR/s).`,
                "ok"
            );
        } else {
            pushNotification(`${building.name} passe niveau ${building.level} (+${Math.floor(income)} EUR/s).`, "ok");
        }
    }

    checkMilestoneAvailability();
    syncCatalogScore();
    updateUI();
    return steps;
}

function upgradeBuildingObject(buildingOrId, options = {}) {
    const maxSteps = Math.max(1, Math.floor(Number(options.maxSteps) || 1));
    const useReserve = !!options.useReserve;
    const reserve = useReserve ? (Number(tycoonGovernor.getProfile().reserve) || 0) : (Number(options.reserve) || 0);
    const silent = !!options.silent;
    return upgradeBuildingBulk(buildingOrId, maxSteps, reserve, silent) > 0;
}

function upgradeBuildingById(buildingId, options = {}) {
    return upgradeBuildingObject(buildingId, options);
}

function getMilestoneMetricValue(type) {
    switch (type) {
        case "money":
            return gameData.money;
        case "income":
            return calculateIncome();
        case "totalLevel":
            return getTotalLevel();
        default:
            return 0;
    }
}

function isMilestoneReady(milestone) {
    return getMilestoneMetricValue(milestone.type) >= milestone.target;
}

function isMilestoneClaimed(id) {
    return gameData.milestonesClaimed.includes(id);
}

function getMilestonesState() {
    return MILESTONES.map((milestone) => {
        const claimed = isMilestoneClaimed(milestone.id);
        const ready = !claimed && isMilestoneReady(milestone);

        const targetText = milestone.type === "money"
            ? `${Math.floor(milestone.target).toLocaleString("fr-FR")} EUR`
            : milestone.type === "income"
                ? `${Math.floor(milestone.target).toLocaleString("fr-FR")} EUR/sec`
                : `${Math.floor(milestone.target).toLocaleString("fr-FR")} niveaux`;

        const rewardParts = [];
        if (milestone.reward.cash) rewardParts.push(`+${Math.floor(milestone.reward.cash).toLocaleString("fr-FR")} EUR`);
        if (milestone.reward.multiplier) rewardParts.push(`+${(milestone.reward.multiplier * 100).toFixed(0)}% revenu`);

        return {
            id: milestone.id,
            name: milestone.name,
            description: milestone.description,
            targetText,
            rewardText: rewardParts.join(" | "),
            claimed,
            ready
        };
    });
}

function claimMilestone(id) {
    const milestone = MILESTONES.find((item) => item.id === id);
    if (!milestone || isMilestoneClaimed(id)) return false;
    if (!isMilestoneReady(milestone)) return false;

    gameData.milestonesClaimed.push(id);

    if (milestone.reward.cash) {
        addMoney(milestone.reward.cash);
    }

    if (milestone.reward.multiplier) {
        gameData.stats.multiplierBonus += milestone.reward.multiplier;
    }

    pushNotification(`Milestone valide: ${milestone.name}.`, "ok");

    syncCatalogScore();
    updateUI();
    return true;
}

function checkMilestoneAvailability() {
    const readyIds = getMilestonesState()
        .filter((item) => item.ready)
        .map((item) => item.id)
        .sort();

    const signature = readyIds.join("|");
    if (signature !== readyMilestonesSnapshot && readyIds.length > 0) {
        pushNotification("Nouveau milestone disponible.", "warn");
    }

    readyMilestonesSnapshot = signature;
}

function getBoostState() {
    return {
        cooldownRemaining: Math.max(0, Math.ceil(gameData.boostCooldown || 0))
    };
}

function activateCashBoost() {
    if (gameData.boostCooldown > 0) {
        pushNotification(`Prime indisponible (${Math.ceil(gameData.boostCooldown)}s).`, "warn");
        return false;
    }

    const reward = Math.max(50, Math.floor(calculateIncome() * 18 + getTotalLevel() * 10));
    addMoney(reward, "ok", `Prime instantanee: +${Math.floor(reward).toLocaleString("fr-FR")} EUR.`);

    if (canvas) {
        createMoneyParticles(reward, canvas.width * 0.5, 110);
    }

    gameData.boostCooldown = BOOST_COOLDOWN_SECONDS;
    syncCatalogScore();
    updateUI();
    return true;
}

function collectTapBonus(mouseX, mouseY) {
    const bonus = Math.max(5, Math.floor(calculateIncome() * 0.3));
    addMoney(bonus);
    createMoneyParticles(bonus, mouseX, mouseY);
    gameData.stats.totalClicks += 1;
    gameData.currentStatus = `Collecte active: +${Math.floor(bonus).toLocaleString("fr-FR")} EUR.`;
}

function setGameSpeed(nextSpeed) {
    gameData.gameSpeed = clampNumber(nextSpeed, 1, 4, 1);
    pushNotification(`Vitesse reglee sur x${gameData.gameSpeed}.`, "");
    updateUI();
}

function togglePause() {
    gameData.isPaused = !gameData.isPaused;
    pushNotification(gameData.isPaused ? "Simulation en pause." : "Simulation reprise.", gameData.isPaused ? "warn" : "ok");
    updateUI();
}

function stepParticles(deltaSeconds) {
    const factor = Math.max(0.3, deltaSeconds * 6);
    gameData.particles = gameData.particles.filter((particle) => {
        particle.x += particle.vx * factor;
        particle.y += particle.vy * factor;
        particle.vy += 0.15 * factor;
        particle.life -= 0.02 * factor;
        return particle.life > 0;
    });
}

function updateSimulation(simulationDeltaSeconds) {
    const incomePerSecond = calculateIncome();
    const generated = incomePerSecond * simulationDeltaSeconds;
    if (generated > 0) {
        gameData.money += generated;
        gameData.stats.totalEarned += generated;
    }

    gameData.stats.playSeconds += simulationDeltaSeconds;
    gameData.boostCooldown = Math.max(0, gameData.boostCooldown - simulationDeltaSeconds);

    stepParticles(simulationDeltaSeconds);

    tycoonGovernor.update(simulationDeltaSeconds);

    gameData.stats.bestMoney = Math.max(gameData.stats.bestMoney, gameData.money);
    gameData.stats.bestIncome = Math.max(gameData.stats.bestIncome, incomePerSecond);
}

function computeCatalogScore() {
    const milestoneCount = gameData.milestonesClaimed.length;
    const totalLevelScore = getTotalLevel() * 1400;
    const bestMoneyScore = gameData.stats.bestMoney;
    const bestIncomeScore = gameData.stats.bestIncome * 420;
    const earnedScore = gameData.stats.totalEarned * 0.04;
    const milestoneScore = milestoneCount * 8500;

    return Math.max(0, Math.floor(
        bestMoneyScore + bestIncomeScore + totalLevelScore + earnedScore + milestoneScore
    ));
}

function syncCatalogScore(forceSubmit = false) {
    const score = computeCatalogScore();
    if (score > bestCatalogScore) {
        bestCatalogScore = score;
    }

    window.gameState = window.gameState || {};
    window.gameState.score = bestCatalogScore;

    if (window.CatalogScore && typeof window.CatalogScore.capture === "function") {
        window.CatalogScore.capture();
        if (forceSubmit && typeof window.CatalogScore.submit === "function") {
            window.CatalogScore.submit(bestCatalogScore);
        }
    }
}

function saveGame() {
    try {
        gameData.lastSave = Date.now();
        localStorage.setItem(TYCOON_STORAGE_KEY, JSON.stringify(gameData));
        return true;
    } catch (_error) {
        return false;
    }
}

function loadGame() {
    const payload = localStorage.getItem(TYCOON_STORAGE_KEY);
    if (!payload) {
        gameData = normalizeGameData(gameData);
        return;
    }

    try {
        const parsed = JSON.parse(payload);
        const loaded = normalizeGameData(parsed);
        const secondsOffline = Math.min(
            MAX_OFFLINE_SECONDS,
            Math.max(0, (Date.now() - loaded.lastSave) / 1000)
        );

        const previousSpeed = loaded.gameSpeed;
        gameData = loaded;
        gameData.gameSpeed = previousSpeed;

        if (secondsOffline > 5) {
            const offlineIncome = calculateIncome() * secondsOffline * 0.65;
            if (offlineIncome > 0) {
                addMoney(offlineIncome);
                pushNotification(
                    `Gain hors ligne: +${Math.floor(offlineIncome).toLocaleString("fr-FR")} EUR (${Math.floor(secondsOffline)}s).`,
                    "ok"
                );
                if (canvas) {
                    createMoneyParticles(offlineIncome, canvas.width * 0.5, 130);
                }
            }
        }
    } catch (_error) {
        gameData = normalizeGameData(gameData);
        pushNotification("Sauvegarde invalide, nouvelle partie lancee.", "bad");
    }
}

function resetGame() {
    if (!window.confirm("Confirmer la reinitialisation complete ?")) {
        return;
    }

    localStorage.removeItem(TYCOON_STORAGE_KEY);
    gameData = createFreshData();
    bestCatalogScore = 0;
    readyMilestonesSnapshot = "";
    pushNotification("Nouvelle partie initialisee.", "ok");
    syncCatalogScore();
    updateUI();
}

function bindUIEvents() {
    const resetBtn = document.getElementById("resetBtn");
    if (resetBtn) {
        resetBtn.addEventListener("click", resetGame);
    }

    if (canvas) {
        canvas.addEventListener("click", (event) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            let clickedBuilding = null;
            for (const building of gameData.buildings) {
                const dx = mouseX - (building.x + 45);
                const dy = mouseY - (building.y + 45);
                if (Math.hypot(dx, dy) <= 78) {
                    clickedBuilding = building;
                    break;
                }
            }

            if (clickedBuilding) {
                const isCtrlLike = !!(event.ctrlKey || event.metaKey);
                const isShift = !!event.shiftKey;
                if (isCtrlLike || isShift) {
                    const burst = isShift
                        ? Math.max(12, tycoonGovernor.getProfile().maxBurst || 8)
                        : (tycoonGovernor.getProfile().maxBurst || 8);
                    upgradeBuildingObject(clickedBuilding, { maxSteps: burst, useReserve: true });
                } else {
                    upgradeBuildingObject(clickedBuilding);
                }
            } else {
                collectTapBonus(mouseX, mouseY);
            }

            updateUI();
        });
    }

    window.addEventListener("keydown", (event) => {
        if (event.target && ["INPUT", "TEXTAREA"].includes(event.target.tagName)) return;

        if (event.code === "Space") {
            event.preventDefault();
            togglePause();
            return;
        }

        if (event.key === "1") setGameSpeed(1);
        if (event.key === "2") setGameSpeed(2);
        if (event.key === "4") setGameSpeed(4);
        if (event.key.toLowerCase() === "b") activateCashBoost();
        if (event.key.toLowerCase() === "g") tycoonGovernor.cycleProfile();
        if (event.key.toLowerCase() === "a") tycoonGovernor.toggle();
    });
}

function gameLoop(now) {
    const frameDelta = Math.min(0.25, (now - lastFrameTime) / 1000);
    lastFrameTime = now;

    if (!gameData.isPaused) {
        updateSimulation(frameDelta * gameData.gameSpeed);
    } else {
        stepParticles(frameDelta * 0.3);
    }

    if (typeof render === "function") {
        render();
    }

    uiTimer += frameDelta;
    scoreTimer += frameDelta;
    autosaveTimer += frameDelta;

    if (uiTimer >= 0.2) {
        uiTimer = 0;
        updateUI();
    }

    if (scoreTimer >= 1) {
        scoreTimer = 0;
        checkMilestoneAvailability();
        syncCatalogScore();
    }

    if (autosaveTimer >= 8) {
        autosaveTimer = 0;
        saveGame();
    }

    requestAnimationFrame(gameLoop);
}

window.calculateIncome = calculateIncome;
window.getBuildingCost = getBuildingCost;
window.getBuildingIncomePerSecond = getBuildingIncomePerSecond;
window.getIncomeMultiplier = getIncomeMultiplier;
window.getTotalLevel = getTotalLevel;
window.getMilestonesState = getMilestonesState;
window.claimMilestone = claimMilestone;
window.upgradeBuildingById = upgradeBuildingById;
window.togglePause = togglePause;
window.setGameSpeed = setGameSpeed;
window.activateCashBoost = activateCashBoost;
window.getBoostState = getBoostState;
window.getTycoonGovernorState = () => tycoonGovernor.getState();
window.toggleTycoonGovernor = () => tycoonGovernor.toggle();
window.cycleTycoonGovernorProfile = () => tycoonGovernor.cycleProfile();
window.getTycoonBurstSize = () => Math.max(1, Number(tycoonGovernor.getProfile().maxBurst) || 6);

tycoonGovernor.init();
loadGame();
pushNotification("Bienvenue dans Gestion Tycoon.", "ok");
checkMilestoneAvailability();
syncCatalogScore();
updateUI();
bindUIEvents();
requestAnimationFrame(gameLoop);

window.addEventListener("pagehide", () => {
    saveGame();
    tycoonGovernor.save();
    syncCatalogScore(true);
});
