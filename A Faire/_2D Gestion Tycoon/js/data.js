const TYCOON_BUILDING_TEMPLATES = [
    { id: "usine", name: "Usine", baseIncome: 1, baseCost: 20, costGrowth: 1.15, x: 170, y: 300, color: "#ff6b6b", icon: "US" },
    { id: "mine", name: "Mine", baseIncome: 6, baseCost: 140, costGrowth: 1.15, x: 360, y: 260, color: "#95a5a6", icon: "MI" },
    { id: "ferme", name: "Ferme", baseIncome: 22, baseCost: 950, costGrowth: 1.16, x: 610, y: 320, color: "#a8e063", icon: "FE" },
    { id: "hotel", name: "Hotel", baseIncome: 70, baseCost: 5200, costGrowth: 1.16, x: 290, y: 420, color: "#feca57", icon: "HO" },
    { id: "banque", name: "Banque", baseIncome: 320, baseCost: 38000, costGrowth: 1.17, x: 540, y: 400, color: "#48dbfb", icon: "BA" }
];

const TYCOON_RESEARCH_TEMPLATES = [
    {
        id: "automation",
        name: "Automation",
        description: "Ameliore les chaines de production (+11% revenu global / niveau).",
        baseCost: 1200,
        costGrowth: 1.85,
        incomeBonus: 0.11
    },
    {
        id: "marketing",
        name: "Marketing",
        description: "Optimise l impact du clic et des primes (+22% bonus manuel / niveau).",
        baseCost: 900,
        costGrowth: 1.8,
        tapBonus: 0.22
    },
    {
        id: "logistics",
        name: "Logistique",
        description: "Reduit le cout des investissements (-4% cout batiments / niveau).",
        baseCost: 1800,
        costGrowth: 1.88,
        costDiscount: 0.04
    },
    {
        id: "finance",
        name: "Finance",
        description: "Renforce la prime et reduit son cooldown (+12% prime, -4% cooldown / niveau).",
        baseCost: 2600,
        costGrowth: 1.9,
        boostBonus: 0.12,
        cooldownReduction: 0.04
    }
];

const TYCOON_STAFF_TEMPLATES = [
    {
        id: "assistant",
        name: "Assistant",
        description: "Execution quotidienne et support des operations.",
        baseHireCost: 240,
        hireGrowth: 1.14,
        upkeep: 1.2,
        incomeBonus: 0.009
    },
    {
        id: "manager",
        name: "Manager",
        description: "Coordonne les equipes et accelere la rentabilite.",
        baseHireCost: 2100,
        hireGrowth: 1.16,
        upkeep: 11,
        incomeBonus: 0.038
    },
    {
        id: "expert",
        name: "Expert",
        description: "Expertise de haut niveau pour les phases de scale.",
        baseHireCost: 11800,
        hireGrowth: 1.18,
        upkeep: 58,
        incomeBonus: 0.086
    }
];

function createTycoonDefaultData() {
    return {
        version: 4,
        money: 30,
        lastSave: Date.now(),
        gameSpeed: 1,
        isPaused: false,
        boostCooldown: 0,
        buildings: TYCOON_BUILDING_TEMPLATES.map((template) => ({ ...template, level: 0 })),
        research: TYCOON_RESEARCH_TEMPLATES.map((template) => ({ id: template.id, level: 0 })),
        staff: TYCOON_STAFF_TEMPLATES.map((template) => ({ id: template.id, count: 0 })),
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

let gameData = createTycoonDefaultData();

window.createTycoonDefaultData = createTycoonDefaultData;
window.TYCOON_BUILDING_TEMPLATES = TYCOON_BUILDING_TEMPLATES;
window.TYCOON_RESEARCH_TEMPLATES = TYCOON_RESEARCH_TEMPLATES;
window.TYCOON_STAFF_TEMPLATES = TYCOON_STAFF_TEMPLATES;
