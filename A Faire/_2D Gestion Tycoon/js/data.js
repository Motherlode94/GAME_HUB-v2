const TYCOON_BUILDING_TEMPLATES = [
    { id: "usine", name: "Usine", baseIncome: 1, baseCost: 20, costGrowth: 1.15, x: 170, y: 300, color: "#ff6b6b", icon: "US" },
    { id: "mine", name: "Mine", baseIncome: 6, baseCost: 140, costGrowth: 1.15, x: 360, y: 260, color: "#95a5a6", icon: "MI" },
    { id: "ferme", name: "Ferme", baseIncome: 22, baseCost: 950, costGrowth: 1.16, x: 610, y: 320, color: "#a8e063", icon: "FE" },
    { id: "hotel", name: "Hotel", baseIncome: 70, baseCost: 5200, costGrowth: 1.16, x: 290, y: 420, color: "#feca57", icon: "HO" },
    { id: "banque", name: "Banque", baseIncome: 320, baseCost: 38000, costGrowth: 1.17, x: 540, y: 400, color: "#48dbfb", icon: "BA" }
];

function createTycoonDefaultData() {
    return {
        version: 3,
        money: 30,
        lastSave: Date.now(),
        gameSpeed: 1,
        isPaused: false,
        boostCooldown: 0,
        buildings: TYCOON_BUILDING_TEMPLATES.map((template) => ({ ...template, level: 0 })),
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

let gameData = createTycoonDefaultData();

window.createTycoonDefaultData = createTycoonDefaultData;
window.TYCOON_BUILDING_TEMPLATES = TYCOON_BUILDING_TEMPLATES;
