const TYCOON_STORAGE_KEY = "tycoon2d_v3";
const TYCOON_GOVERNOR_STORAGE_KEY = "tycoon2d_governor_v1";
const MAX_OFFLINE_SECONDS = 10 * 60 * 60;
const BOOST_COOLDOWN_SECONDS = 25;
const MAX_NOTIFICATIONS = 40;
const MAX_MONEY = 9e15;
const EVENT_MIN_SECONDS = 30;
const EVENT_MAX_SECONDS = 68;

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
        id: "team_10",
        name: "Equipe structuree",
        description: "Atteins 10 employes.",
        type: "staff",
        target: 10,
        reward: { cash: 22000, multiplier: 0.06 }
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
    },
    {
        id: "prestige_1",
        name: "Nouveau cycle",
        description: "Obtiens 1 point de prestige.",
        type: "prestige",
        target: 1,
        reward: { cash: 120000, multiplier: 0.12 }
    },
    {
        id: "income_25k",
        name: "Hyper croissance",
        description: "Atteins 25 000 EUR / sec.",
        type: "income",
        target: 25000,
        reward: { cash: 850000, multiplier: 0.18 }
    }
];

let lastFrameTime = performance.now();
let uiTimer = 0;
let scoreTimer = 0;
let autosaveTimer = 0;
let bestCatalogScore = 0;
let readyMilestonesSnapshot = "";
let randomEventTimer = EVENT_MIN_SECONDS + Math.random() * (EVENT_MAX_SECONDS - EVENT_MIN_SECONDS);
let economyAlertCooldown = 0;

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
        version: 4,
        money: 30,
        lastSave: Date.now(),
        gameSpeed: 1,
        isPaused: false,
        boostCooldown: 0,
        buildings: [],
        research: [],
        staff: [],
        activeEvents: [],
        prestige: {
            points: 0,
            runs: 0,
            lastGain: 0
        },
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
            multiplierBonus: 0,
            totalPrestigeEarned: 0
        }
    };
}

function clampNumber(value, min, max, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, n));
}

function clampMoney(value, fallback = 0) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(0, Math.min(MAX_MONEY, n));
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

function normalizeResearch(template, rawEntry) {
    const level = rawEntry ? Math.max(0, Math.floor(Number(rawEntry.level) || 0)) : 0;
    return {
        id: template.id,
        level
    };
}

function normalizeStaff(template, rawEntry) {
    const count = rawEntry ? Math.max(0, Math.floor(Number(rawEntry.count) || 0)) : 0;
    return {
        id: template.id,
        count
    };
}

function normalizeEvent(rawEvent) {
    if (!rawEvent || typeof rawEvent !== "object") return null;

    const id = String(rawEvent.id || "").trim();
    const label = String(rawEvent.label || "").trim();
    const remainingSec = Math.max(0, Number(rawEvent.remainingSec) || 0);
    if (!id || !label || remainingSec <= 0) return null;

    return {
        id,
        label,
        description: String(rawEvent.description || "").trim(),
        remainingSec: Math.min(300, remainingSec),
        incomeMult: clampNumber(rawEvent.incomeMult, 0.25, 3, 1),
        costMult: clampNumber(rawEvent.costMult, 0.25, 3, 1),
        tapMult: clampNumber(rawEvent.tapMult, 0.25, 3, 1)
    };
}

function normalizeGameData(rawData) {
    const fallback = createFreshData();
    const raw = rawData && typeof rawData === "object" ? rawData : {};

    const result = deepClone(fallback);

    result.version = 4;
    result.money = clampMoney(raw.money, fallback.money);
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

    const rawResearchById = {};
    if (Array.isArray(raw.research)) {
        raw.research.forEach((entry) => {
            if (entry && typeof entry.id === "string") {
                rawResearchById[entry.id] = entry;
            }
        });
    }

    const researchTemplates = Array.isArray(window.TYCOON_RESEARCH_TEMPLATES)
        ? window.TYCOON_RESEARCH_TEMPLATES
        : [];
    result.research = researchTemplates.map((template) => normalizeResearch(template, rawResearchById[template.id]));

    const rawStaffById = {};
    if (Array.isArray(raw.staff)) {
        raw.staff.forEach((entry) => {
            if (entry && typeof entry.id === "string") {
                rawStaffById[entry.id] = entry;
            }
        });
    }

    const staffTemplates = Array.isArray(window.TYCOON_STAFF_TEMPLATES)
        ? window.TYCOON_STAFF_TEMPLATES
        : [];
    result.staff = staffTemplates.map((template) => normalizeStaff(template, rawStaffById[template.id]));

    result.activeEvents = Array.isArray(raw.activeEvents)
        ? raw.activeEvents
            .map(normalizeEvent)
            .filter((entry) => !!entry)
            .slice(0, 6)
        : [];

    const rawPrestige = raw.prestige && typeof raw.prestige === "object" ? raw.prestige : {};
    result.prestige = {
        points: Math.max(0, Math.floor(Number(rawPrestige.points) || 0)),
        runs: Math.max(0, Math.floor(Number(rawPrestige.runs) || 0)),
        lastGain: Math.max(0, Math.floor(Number(rawPrestige.lastGain) || 0))
    };

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
        multiplierBonus: Math.max(0, Number(rawStats.multiplierBonus) || 0),
        totalPrestigeEarned: Math.max(0, Number(rawStats.totalPrestigeEarned) || 0)
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

function getTotalStaffCount() {
    return gameData.staff.reduce((sum, entry) => sum + entry.count, 0);
}

function getResearchEntry(id) {
    return gameData.research.find((entry) => entry.id === id) || null;
}

function getResearchLevel(id) {
    const entry = getResearchEntry(id);
    return entry ? entry.level : 0;
}

function getStaffEntry(id) {
    return gameData.staff.find((entry) => entry.id === id) || null;
}

function getStaffCount(id) {
    const entry = getStaffEntry(id);
    return entry ? entry.count : 0;
}

function getActiveEventsIncomeMultiplier() {
    return gameData.activeEvents.reduce((mult, event) => mult * clampNumber(event.incomeMult, 0.25, 3, 1), 1);
}

function getActiveEventsCostMultiplier() {
    return gameData.activeEvents.reduce((mult, event) => mult * clampNumber(event.costMult, 0.25, 3, 1), 1);
}

function getActiveEventsTapMultiplier() {
    return gameData.activeEvents.reduce((mult, event) => mult * clampNumber(event.tapMult, 0.25, 3, 1), 1);
}

function getIncomeMultiplier() {
    const levelBonus = Math.floor(getTotalLevel() / 20) * 0.03;
    const prestigeBonus = Math.min(5, (gameData.prestige.points || 0) * 0.05);
    const automationBonus = getResearchLevel("automation") * 0.11;

    const staffTemplates = Array.isArray(window.TYCOON_STAFF_TEMPLATES)
        ? window.TYCOON_STAFF_TEMPLATES
        : [];

    const staffBonusRaw = staffTemplates.reduce((sum, template) => {
        const count = getStaffCount(template.id);
        return sum + (template.incomeBonus || 0) * count;
    }, 0);

    const staffBonus = Math.min(3.5, staffBonusRaw);
    const additive = 1 + (gameData.stats.multiplierBonus || 0) + Math.min(1.2, levelBonus) + prestigeBonus + automationBonus + staffBonus;
    const eventsMult = clampNumber(getActiveEventsIncomeMultiplier(), 0.3, 4, 1);

    return Math.max(0.2, Math.min(20, additive * eventsMult));
}

function getCostMultiplier() {
    const logisticsDiscount = Math.min(0.45, getResearchLevel("logistics") * 0.04);
    const base = 1 - logisticsDiscount;
    const events = clampNumber(getActiveEventsCostMultiplier(), 0.3, 4, 1);
    return Math.max(0.3, Math.min(4, base * events));
}

function getTapMultiplier() {
    const marketingBonus = getResearchLevel("marketing") * 0.22;
    const prestigeBonus = Math.min(2, (gameData.prestige.points || 0) * 0.01);
    const events = clampNumber(getActiveEventsTapMultiplier(), 0.3, 4, 1);
    return Math.max(0.2, Math.min(12, (1 + marketingBonus + prestigeBonus) * events));
}

function getBoostCooldownDuration() {
    const financeReduction = Math.min(0.72, getResearchLevel("finance") * 0.04);
    const base = BOOST_COOLDOWN_SECONDS * (1 - financeReduction);
    return Math.max(8, base);
}

function getBoostRewardMultiplier() {
    const financeBonus = getResearchLevel("finance") * 0.12;
    const prestigeBonus = Math.min(3, (gameData.prestige.points || 0) * 0.03);
    return 1 + financeBonus + prestigeBonus;
}

function getBuildingIncomePerSecond(building) {
    if (!building || building.level <= 0) return 0;
    return building.baseIncome * building.level * getIncomeMultiplier();
}

function calculateGrossIncome() {
    return gameData.buildings.reduce((sum, building) => sum + getBuildingIncomePerSecond(building), 0);
}

function calculateStaffUpkeepPerSecond() {
    const staffTemplates = Array.isArray(window.TYCOON_STAFF_TEMPLATES)
        ? window.TYCOON_STAFF_TEMPLATES
        : [];

    return staffTemplates.reduce((sum, template) => {
        const count = getStaffCount(template.id);
        return sum + (Number(template.upkeep) || 0) * count;
    }, 0);
}

function calculateIncome() {
    return calculateGrossIncome() - calculateStaffUpkeepPerSecond();
}

function getBuildingCost(building) {
    const growth = Number(building.costGrowth) || 1.15;
    const rawCost = building.baseCost * Math.pow(growth, building.level) * getCostMultiplier();
    if (!Number.isFinite(rawCost) || rawCost <= 0) {
        return MAX_MONEY;
    }
    return Math.floor(Math.min(MAX_MONEY, Math.max(1, rawCost)));
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

    gameData.money = clampMoney(gameData.money + safeAmount, gameData.money);
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

function getResearchTemplate(id) {
    const templates = Array.isArray(window.TYCOON_RESEARCH_TEMPLATES)
        ? window.TYCOON_RESEARCH_TEMPLATES
        : [];
    return templates.find((item) => item.id === id) || null;
}

function getResearchCost(id) {
    const entry = getResearchEntry(id);
    const template = getResearchTemplate(id);
    if (!entry || !template) return MAX_MONEY;

    const cost = (template.baseCost || 500) * Math.pow(template.costGrowth || 1.8, entry.level);
    if (!Number.isFinite(cost) || cost <= 0) return MAX_MONEY;
    return Math.floor(Math.min(MAX_MONEY, Math.max(1, cost)));
}

function getResearchState() {
    const templates = Array.isArray(window.TYCOON_RESEARCH_TEMPLATES)
        ? window.TYCOON_RESEARCH_TEMPLATES
        : [];

    return templates.map((template) => {
        const level = getResearchLevel(template.id);
        const cost = getResearchCost(template.id);
        return {
            id: template.id,
            name: template.name,
            description: template.description,
            level,
            cost,
            affordable: gameData.money >= cost
        };
    });
}

function buyResearch(id) {
    const entry = getResearchEntry(id);
    const template = getResearchTemplate(id);
    if (!entry || !template) return false;

    const cost = getResearchCost(id);
    if (!spendMoney(cost)) {
        pushNotification("Fonds insuffisants pour la recherche.", "warn");
        return false;
    }

    entry.level += 1;
    pushNotification(`Recherche ${template.name} niveau ${entry.level}.`, "ok");
    createMoneyParticles(cost * 0.12, canvas ? canvas.width * 0.55 : 420, canvas ? 80 : 80);

    checkMilestoneAvailability();
    syncCatalogScore();
    updateUI();
    return true;
}

function getStaffTemplate(id) {
    const templates = Array.isArray(window.TYCOON_STAFF_TEMPLATES)
        ? window.TYCOON_STAFF_TEMPLATES
        : [];
    return templates.find((item) => item.id === id) || null;
}

function getStaffHireCost(id) {
    const entry = getStaffEntry(id);
    const template = getStaffTemplate(id);
    if (!entry || !template) return MAX_MONEY;

    const cost = (template.baseHireCost || 120) * Math.pow(template.hireGrowth || 1.12, entry.count);
    if (!Number.isFinite(cost) || cost <= 0) return MAX_MONEY;
    return Math.floor(Math.min(MAX_MONEY, Math.max(1, cost)));
}

function hireStaff(id, maxSteps = 1) {
    const entry = getStaffEntry(id);
    const template = getStaffTemplate(id);
    if (!entry || !template) return 0;

    const stepsCap = Math.max(1, Math.floor(Number(maxSteps) || 1));
    let hires = 0;
    let totalCost = 0;

    while (hires < stepsCap) {
        const cost = getStaffHireCost(id);
        if (!spendMoney(cost)) break;
        entry.count += 1;
        hires += 1;
        totalCost += cost;
    }

    if (hires <= 0) {
        pushNotification("Budget insuffisant pour recruter.", "warn");
        return 0;
    }

    pushNotification(`${template.name}: +${hires} recrue(s). Total ${entry.count}.`, "ok");
    createMoneyParticles(totalCost * 0.08, canvas ? canvas.width * 0.75 : 600, canvas ? 90 : 90);
    checkMilestoneAvailability();
    syncCatalogScore();
    updateUI();
    return hires;
}

function fireStaff(id, count = 1) {
    const entry = getStaffEntry(id);
    const template = getStaffTemplate(id);
    if (!entry || !template || entry.count <= 0) {
        return false;
    }

    const removeCount = Math.max(1, Math.floor(Number(count) || 1));
    const old = entry.count;
    entry.count = Math.max(0, entry.count - removeCount);

    if (entry.count === old) {
        return false;
    }

    pushNotification(`${template.name}: effectif ajuste a ${entry.count}.`, "warn");
    updateUI();
    return true;
}

function getStaffState() {
    const templates = Array.isArray(window.TYCOON_STAFF_TEMPLATES)
        ? window.TYCOON_STAFF_TEMPLATES
        : [];

    return templates.map((template) => {
        const count = getStaffCount(template.id);
        const nextCost = getStaffHireCost(template.id);
        return {
            id: template.id,
            name: template.name,
            description: template.description,
            count,
            nextCost,
            upkeep: Number(template.upkeep) || 0,
            affordable: gameData.money >= nextCost
        };
    });
}

function getMilestoneMetricValue(type) {
    switch (type) {
        case "money":
            return gameData.money;
        case "income":
            return calculateIncome();
        case "totalLevel":
            return getTotalLevel();
        case "staff":
            return getTotalStaffCount();
        case "prestige":
            return gameData.prestige.points || 0;
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
                : milestone.type === "staff"
                    ? `${Math.floor(milestone.target).toLocaleString("fr-FR")} employes`
                    : milestone.type === "prestige"
                        ? `${Math.floor(milestone.target).toLocaleString("fr-FR")} points prestige`
                        : `${Math.floor(milestone.target).toLocaleString("fr-FR")} niveaux`;

        const rewardParts = [];
        if (milestone.reward.cash) rewardParts.push(`+${Math.floor(milestone.reward.cash).toLocaleString("fr-FR")} EUR`);
        if (milestone.reward.multiplier) rewardParts.push(`+${(milestone.reward.multiplier * 100).toFixed(0)}% revenu`);
        if (milestone.reward.prestige) rewardParts.push(`+${Math.floor(milestone.reward.prestige)} prestige`);

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

    if (milestone.reward.prestige) {
        gameData.prestige.points += milestone.reward.prestige;
        gameData.stats.totalPrestigeEarned += milestone.reward.prestige;
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
        cooldownRemaining: Math.max(0, Math.ceil(gameData.boostCooldown || 0)),
        cooldownMax: Math.ceil(getBoostCooldownDuration())
    };
}

function activateCashBoost() {
    if (gameData.boostCooldown > 0) {
        pushNotification(`Prime indisponible (${Math.ceil(gameData.boostCooldown)}s).`, "warn");
        return false;
    }

    const baseReward = Math.max(50, Math.floor(calculateGrossIncome() * 18 + getTotalLevel() * 10 + getTotalStaffCount() * 9));
    const reward = Math.floor(baseReward * getBoostRewardMultiplier());
    addMoney(reward, "ok", `Prime instantanee: +${Math.floor(reward).toLocaleString("fr-FR")} EUR.`);

    if (canvas) {
        createMoneyParticles(reward, canvas.width * 0.5, 110);
    }

    gameData.boostCooldown = getBoostCooldownDuration();
    syncCatalogScore();
    updateUI();
    return true;
}

function collectTapBonus(mouseX, mouseY) {
    const baseBonus = Math.max(5, Math.floor(calculateGrossIncome() * 0.3 + 5));
    const bonus = Math.floor(baseBonus * getTapMultiplier());
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

function addTimedEvent(eventData) {
    const payload = normalizeEvent(eventData);
    if (!payload) return false;

    const existing = gameData.activeEvents.find((entry) => entry.id === payload.id);
    if (existing) {
        existing.remainingSec = Math.max(existing.remainingSec, payload.remainingSec);
        existing.incomeMult = payload.incomeMult;
        existing.costMult = payload.costMult;
        existing.tapMult = payload.tapMult;
        existing.description = payload.description;
    } else {
        gameData.activeEvents.push(payload);
        gameData.activeEvents = gameData.activeEvents.slice(0, 6);
    }

    pushNotification(`Evenement: ${payload.label}.`, payload.incomeMult >= 1 && payload.costMult <= 1 ? "ok" : "warn");
    return true;
}

function getWeightedRandomEventId() {
    const pool = [
        { id: "festival", weight: 1.2 },
        { id: "maintenance", weight: 1.05 },
        { id: "market_discount", weight: 1 },
        { id: "audit", weight: 0.85 },
        { id: "subsidy", weight: 0.75 },
        { id: "investor", weight: 0.65 }
    ];

    const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.random() * totalWeight;

    for (const item of pool) {
        roll -= item.weight;
        if (roll <= 0) return item.id;
    }

    return pool[pool.length - 1].id;
}

function triggerRandomEvent() {
    const eventId = getWeightedRandomEventId();

    if (eventId === "festival") {
        addTimedEvent({
            id: "festival",
            label: "Festival local",
            description: "+28% revenu pendant 32s.",
            remainingSec: 32,
            incomeMult: 1.28,
            costMult: 1,
            tapMult: 1
        });
        return;
    }

    if (eventId === "maintenance") {
        addTimedEvent({
            id: "maintenance",
            label: "Maintenance reseau",
            description: "-18% revenu pendant 24s.",
            remainingSec: 24,
            incomeMult: 0.82,
            costMult: 1,
            tapMult: 1
        });
        return;
    }

    if (eventId === "market_discount") {
        addTimedEvent({
            id: "market_discount",
            label: "Marche favorable",
            description: "-16% cout batiments pendant 30s.",
            remainingSec: 30,
            incomeMult: 1,
            costMult: 0.84,
            tapMult: 1
        });
        return;
    }

    if (eventId === "audit") {
        addTimedEvent({
            id: "audit",
            label: "Audit fiscal",
            description: "+20% cout batiments pendant 22s.",
            remainingSec: 22,
            incomeMult: 1,
            costMult: 1.2,
            tapMult: 1
        });
        return;
    }

    if (eventId === "subsidy") {
        const reward = Math.max(900, Math.floor(calculateGrossIncome() * 16 + getTotalLevel() * 28));
        addMoney(reward, "ok", `Subvention: +${Math.floor(reward).toLocaleString("fr-FR")} EUR.`);
        if (canvas) {
            createMoneyParticles(reward, canvas.width * 0.5, 120);
        }
        return;
    }

    if (eventId === "investor") {
        addTimedEvent({
            id: "investor",
            label: "Investisseur prive",
            description: "+50% bonus clic pendant 26s.",
            remainingSec: 26,
            incomeMult: 1,
            costMult: 1,
            tapMult: 1.5
        });
    }
}

function updateActiveEvents(deltaSeconds) {
    if (!Array.isArray(gameData.activeEvents) || gameData.activeEvents.length === 0) {
        return;
    }

    const expired = [];

    gameData.activeEvents = gameData.activeEvents.filter((event) => {
        event.remainingSec -= deltaSeconds;
        if (event.remainingSec <= 0) {
            expired.push(event);
            return false;
        }
        return true;
    });

    expired.forEach((event) => {
        pushNotification(`Fin evenement: ${event.label}.`, "");
    });
}

function getActiveEventsState() {
    return gameData.activeEvents
        .map((event) => ({
            id: event.id,
            label: event.label,
            description: event.description,
            remainingSec: Math.max(0, Math.ceil(event.remainingSec))
        }))
        .sort((a, b) => a.remainingSec - b.remainingSec);
}

function computePrestigeGain() {
    const totalLevel = getTotalLevel();
    const milestoneCount = gameData.milestonesClaimed.length;
    const grossIncome = Math.max(0, calculateGrossIncome());
    const earned = Math.max(0, gameData.stats.totalEarned - 30);

    const raw =
        (totalLevel / 24) +
        (milestoneCount * 1.2) +
        (Math.sqrt(grossIncome) / 5) +
        (Math.sqrt(earned) / 500);

    return Math.max(0, Math.floor(raw));
}

function canPrestigeNow() {
    return getTotalLevel() >= 35 && computePrestigeGain() >= 1;
}

function getPrestigeState() {
    return {
        points: Math.max(0, Math.floor(gameData.prestige.points || 0)),
        runs: Math.max(0, Math.floor(gameData.prestige.runs || 0)),
        lastGain: Math.max(0, Math.floor(gameData.prestige.lastGain || 0)),
        possibleGain: computePrestigeGain(),
        canPrestige: canPrestigeNow()
    };
}

function performPrestigeReset() {
    const possibleGain = computePrestigeGain();
    if (!canPrestigeNow()) {
        pushNotification("Prestige indisponible: vise au moins 35 niveaux.", "warn");
        return false;
    }

    const message = `Confirmer le prestige ?\nTu gagneras ${possibleGain} points.\nLa partie courante sera reinitialisee.`;
    if (!window.confirm(message)) {
        return false;
    }

    const previousPrestige = {
        points: Math.max(0, Math.floor(gameData.prestige.points || 0)),
        runs: Math.max(0, Math.floor(gameData.prestige.runs || 0))
    };

    const nextData = createFreshData();
    nextData.prestige.points = previousPrestige.points + possibleGain;
    nextData.prestige.runs = previousPrestige.runs + 1;
    nextData.prestige.lastGain = possibleGain;
    nextData.stats.totalPrestigeEarned = Math.max(0, Number(gameData.stats.totalPrestigeEarned) || 0) + possibleGain;

    gameData = normalizeGameData(nextData);
    readyMilestonesSnapshot = "";
    randomEventTimer = EVENT_MIN_SECONDS + Math.random() * (EVENT_MAX_SECONDS - EVENT_MIN_SECONDS);

    pushNotification(`Prestige valide: +${possibleGain} points.`, "ok");

    saveGame();
    syncCatalogScore(true);
    updateUI();
    return true;
}

function updateSimulation(simulationDeltaSeconds) {
    economyAlertCooldown = Math.max(0, economyAlertCooldown - simulationDeltaSeconds);

    const incomePerSecond = calculateIncome();
    const generated = incomePerSecond * simulationDeltaSeconds;
    if (generated > 0) {
        gameData.money = clampMoney(gameData.money + generated, gameData.money);
        gameData.stats.totalEarned += generated;
    } else if (generated < 0) {
        const before = gameData.money;
        gameData.money = Math.max(0, gameData.money + generated);

        if (before > 0 && gameData.money === 0 && economyAlertCooldown <= 0) {
            economyAlertCooldown = 10;
            pushNotification("Tresorerie a zero: reduis les charges ou augmente les revenus.", "bad");
        }
    }

    gameData.stats.playSeconds += simulationDeltaSeconds;
    gameData.boostCooldown = Math.max(0, gameData.boostCooldown - simulationDeltaSeconds);

    updateActiveEvents(simulationDeltaSeconds);
    randomEventTimer -= simulationDeltaSeconds;
    if (randomEventTimer <= 0) {
        triggerRandomEvent();
        randomEventTimer = EVENT_MIN_SECONDS + Math.random() * (EVENT_MAX_SECONDS - EVENT_MIN_SECONDS);
    }

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
    const prestigeScore = (gameData.prestige.points || 0) * 42000;
    const researchScore = gameData.research.reduce((sum, entry) => sum + entry.level, 0) * 5200;
    const staffScore = getTotalStaffCount() * 380;

    return Math.max(0, Math.floor(
        bestMoneyScore + bestIncomeScore + totalLevelScore + earnedScore + milestoneScore + prestigeScore + researchScore + staffScore
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

function createSavablePayload() {
    return {
        ...gameData,
        lastSave: Date.now(),
        particles: [],
        currentStatus: ""
    };
}

function saveGame() {
    try {
        const payload = createSavablePayload();
        localStorage.setItem(TYCOON_STORAGE_KEY, JSON.stringify(payload));
        gameData.lastSave = payload.lastSave;
        return true;
    } catch (_error) {
        pushNotification("Echec de sauvegarde locale.", "bad");
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
            const offlineIncome = Math.max(0, calculateIncome()) * secondsOffline * 0.65;
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
    randomEventTimer = EVENT_MIN_SECONDS + Math.random() * (EVENT_MAX_SECONDS - EVENT_MIN_SECONDS);
    pushNotification("Nouvelle partie initialisee.", "ok");
    syncCatalogScore();
    updateUI();
}

function bytesToBase64(bytes) {
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize);
        binary += String.fromCharCode(...chunk);
    }
    return btoa(binary);
}

function base64ToBytes(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

function encodeSaveString(saveObject) {
    const json = JSON.stringify(saveObject);

    if (typeof TextEncoder !== "undefined") {
        const bytes = new TextEncoder().encode(json);
        return bytesToBase64(bytes);
    }

    return btoa(unescape(encodeURIComponent(json)));
}

function decodeSaveString(serialized) {
    if (typeof TextDecoder !== "undefined") {
        const bytes = base64ToBytes(serialized);
        return new TextDecoder().decode(bytes);
    }

    return decodeURIComponent(escape(atob(serialized)));
}

function exportGameSave() {
    saveGame();

    let payload;
    try {
        payload = encodeSaveString(createSavablePayload());
    } catch (_error) {
        pushNotification("Export impossible.", "bad");
        return false;
    }

    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        navigator.clipboard.writeText(payload)
            .then(() => {
                pushNotification("Sauvegarde exportee dans le presse-papiers.", "ok");
                updateUI();
            })
            .catch(() => {
                window.prompt("Copie ta sauvegarde:", payload);
                pushNotification("Export affiche manuellement.", "warn");
                updateUI();
            });
    } else {
        window.prompt("Copie ta sauvegarde:", payload);
        pushNotification("Export affiche manuellement.", "warn");
        updateUI();
    }

    return true;
}

function importGameSave() {
    const raw = window.prompt("Colle la sauvegarde exportee:");
    if (!raw) return false;

    try {
        const json = decodeSaveString(String(raw).trim());
        const parsed = JSON.parse(json);
        gameData = normalizeGameData(parsed);

        readyMilestonesSnapshot = "";
        randomEventTimer = EVENT_MIN_SECONDS + Math.random() * (EVENT_MAX_SECONDS - EVENT_MIN_SECONDS);

        saveGame();
        pushNotification("Sauvegarde importee avec succes.", "ok");
        checkMilestoneAvailability();
        syncCatalogScore();
        updateUI();
        return true;
    } catch (_error) {
        pushNotification("Import invalide.", "bad");
        updateUI();
        return false;
    }
}

function bindUIEvents() {
    const resetBtn = document.getElementById("resetBtn");
    if (resetBtn) {
        resetBtn.addEventListener("click", resetGame);
    }

    const saveBtn = document.getElementById("saveBtn");
    if (saveBtn) {
        saveBtn.addEventListener("click", () => {
            const ok = saveGame();
            if (ok) {
                pushNotification("Sauvegarde locale effectuee.", "ok");
                updateUI();
            }
        });
    }

    const exportBtn = document.getElementById("exportBtn");
    if (exportBtn) {
        exportBtn.addEventListener("click", exportGameSave);
    }

    const importBtn = document.getElementById("importBtn");
    if (importBtn) {
        importBtn.addEventListener("click", importGameSave);
    }

    const prestigeBtn = document.getElementById("prestigeBtn");
    if (prestigeBtn) {
        prestigeBtn.addEventListener("click", performPrestigeReset);
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
        if (event.key.toLowerCase() === "p") performPrestigeReset();
        if (event.key.toLowerCase() === "k") {
            const ok = saveGame();
            if (ok) pushNotification("Sauvegarde locale effectuee.", "ok");
            updateUI();
        }
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
window.calculateGrossIncome = calculateGrossIncome;
window.getStaffUpkeepPerSecond = calculateStaffUpkeepPerSecond;
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
window.getResearchState = getResearchState;
window.buyResearch = buyResearch;
window.getStaffState = getStaffState;
window.hireStaff = hireStaff;
window.fireStaff = fireStaff;
window.getActiveEventsState = getActiveEventsState;
window.getPrestigeState = getPrestigeState;
window.performPrestigeReset = performPrestigeReset;
window.manualSaveTycoon = saveGame;
window.exportTycoonSave = exportGameSave;
window.importTycoonSave = importGameSave;
window.getTycoonGovernorState = () => tycoonGovernor.getState();
window.toggleTycoonGovernor = () => tycoonGovernor.toggle();
window.cycleTycoonGovernorProfile = () => tycoonGovernor.cycleProfile();
window.getTycoonBurstSize = () => Math.max(1, Number(tycoonGovernor.getProfile().maxBurst) || 6);

tycoonGovernor.init();
loadGame();
pushNotification("Bienvenue dans Gestion Tycoon. Developpe ta ville, ton equipe et ton prestige.", "ok");
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

window.addEventListener("beforeunload", () => {
    saveGame();
    tycoonGovernor.save();
});
