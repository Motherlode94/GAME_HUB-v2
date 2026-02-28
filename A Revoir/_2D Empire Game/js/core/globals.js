// js/core/globals.js - VERSION COMPLÈTE AMÉLIORÉE
const gameState = {
    // ===== RESSOURCES =====
    resources: {
        gold: 100,
        food: 50,
        stone: 0,
        wood: 0,
        iron: 0,
        luxury: 0 // Pour le bonheur/élites
    },
    
    // ===== PRODUCTION =====
    production: {
        goldPerTick: 1,
        foodPerTick: 1,
        stonePerTick: 0,
        woodPerTick: 0,
        ironPerTick: 0,
        workersNeeded: 0,
        workersAssigned: 0,
        currentEfficiency: 1.0,
        consumption: {
            food: 0,
            gold: 0,
            totalUpkeep: 0
        },
        lastCalculated: Date.now()
    },
    
    // ===== POPULATION (DÉMOGRAPHIQUE) =====
    population: {
        // Totaux
        current: 10,     // Population totale actuelle
        total: 10,       // Alias synchronise pour compatibilite modules
        maxPop: 10,      // Capacité maximum de logement
        
        // Détail démographique
        breakdown: {
            peasants: 7,     // Paysans (base)
            artisans: 2,     // Artisans
            merchants: 1,    // Marchands
            nobles: 0,       // Nobles
            soldiers: 0,     // Soldats (hors population civile)
            slaves: 0,        // Esclaves (si mécanique)
                    workers: 6,      // 60% travaillent
        unemployed: 0,   // Pas de chômage initial
        happiness: 85,   // Bon départ
        growthRate: 0.01 // Croissance lente
        },
        
        // Âges
        ageGroups: {
            children: 3,     // 0-14 ans (non productifs)
            adults: 5,       // 15-59 ans (productifs)
            elders: 2        // 60+ ans (retraités)
        },
        
        // Emploi
        workers: 7,          // Ouvriers actifs (70% des adultes)
        unemployed: 0,       // Chômeurs
        
        // Bonheur et santé
        happiness: 100,      // 0-100
        health: 100,         // Santé globale
        crimeRate: 0,        // 0-100 (criminalité)
        
        // Croissance
        growthRate: 0.02,    // Taux de croissance naturel
        birthRate: 0.03,     // Naissances
        deathRate: 0.01,     // Décès
        migrationRate: 0     // Migration nette
    },
    
    // ===== BÂTIMENTS =====
    buildings: [
        { 
            id: 'castle_1',
            name: 'Château', 
            x: 7, 
            y: 5, 
            level: 1,
            workers: 2,
            efficiency: 1.0,
            assignedWorkers: 2
        }
    ],
    
    // ===== CONSTRUCTION =====
    underConstruction: [],
    constructionQueue: [],
    
    // ===== TEMPS =====
    date: { 
        year: 1, 
        month: 3,
        day: 1,
        hour: 8,
        season: 'printemps' // printemps/été/automne/hiver
    },
    
    // ===== ARMÉE & DIPLOMATIE =====
    army: {
        soldiers: 0,
        infantry: 0,
        archers: 0,
        cavalry: 0,
        siege: 0,
        total: 0,
        upkeep: 0.5, // Coût par soldat
        morale: 100,
        training: 0 // Soldats en formation
    },
    
    diplomacy: {
        relations: {}, // { empireId: { status: 'peace', score: 50 } }
        wars: [],
        alliances: [],
        tradeAgreements: []
    },
    
    // ===== ÉCONOMIE =====
    economy: {
        taxRate: 0.1, // 10%
        tradeIncome: 0,
        tribute: 0,
        expenses: {
            army: 0,
            construction: 0,
            salaries: 0
        },
        treasury: 100,
        inflation: 1.0
    },
    
    // ===== TECHNOLOGIE & RECHERCHE =====
    technology: {
        agriculture: 1,
        mining: 1,
        construction: 1,
        military: 1,
        commerce: 1,
        researchPoints: 0,
        currentResearch: null,
        researchProgress: 0
    },
    
    // ===== STATISTIQUES =====
    stats: {
        buildingsBuilt: 0,
        citizensBorn: 10,
        citizensDied: 0,
        goldEarned: 0,
        foodProduced: 0,
        battlesWon: 0,
        battlesLost: 0,
        tradeDeals: 0,
        disasters: 0,
        playTime: 0 // en secondes
    },
    
    // ===== ÉVÉNEMENTS & QUÊTES =====
    events: {
        activeEvents: [], // Événements en cours
        completedQuests: [],
        activeQuests: [
            {
                id: 'first_settlement',
                title: 'Premier établissement',
                description: 'Construisez votre premier village',
                objectives: [
                    { type: 'build', target: 'Maison', count: 1, current: 0 },
                    { type: 'build', target: 'Ferme', count: 1, current: 0 }
                ],
                reward: { gold: 100, prestige: 10 }
            }
        ]
    },
    
    // ===== ENVIRONNEMENT =====
    environment: {
        fertility: 100, // Fertilité des terres
        temperature: 20, // °C
        rainfall: 50,   // %
        disasters: {
            drought: false,
            flood: false,
            plague: false
        }
    },
    
    // ===== PRESTIGE & RENOMMÉE =====
    prestige: {
        score: 0,
        level: 1,
        titles: ['Seigneur Local'],
        achievements: []
    },
    
    // ===== MÉTA-DONNÉES DU JEU =====
    meta: {
        version: '1.0.0',
        saveDate: new Date().toISOString(),
        playerName: 'Souverain',
        empireName: 'Mon Empire',
        difficulty: 'normal',
        gameSpeed: 1,
        autoSave: true,
        lastAutoSave: Date.now(),
        sessionStart: Date.now()
    },
    
    // ===== CONFIGURATION =====
    settings: {
        soundVolume: 0.8,
        musicVolume: 0.6,
        uiScale: 1.0,
        showTutorial: true,
        language: 'fr',
        notifications: {
            constructionComplete: true,
            resourceLow: true,
            underAttack: true
        }
    }
};

// ===== ÉTAT DU JEU COURANT =====
window.currentSelection = null; // Bâtiment/citoyen sélectionné
window.gameMode = 'management'; // 'construction', 'diplomacy', 'military'
window.gamePaused = false;
window.gameSpeed = 1; // 0.5x, 1x, 2x, 4x
window.notifications = []; // Notifications en attente

// ===== RÉFÉRENCES GLOBALES =====
window.map = null; // Référence à la carte
window.UI = null;  // Référence à l'interface
window.player = {
    id: 'player_1',
    name: gameState.meta.playerName,
    color: '#3498db', // Couleur du joueur
    isHuman: true
};

// ===== CONSTANTES DE JEU =====
const GAME_CONSTANTS = {
    // Temps
    TICKS_PER_SECOND: 60,
    TICKS_PER_DAY: 240, // 4 minutes par jour à 1x speed
    DAYS_PER_MONTH: 30,
    MONTHS_PER_YEAR: 12,
    
    // Ressources
    MAX_RESOURCE: 999999,
    RESOURCE_DECAY: {
        food: 0.01, // Perte de nourriture par jour
        luxury: 0
    },
    
    // Population
    BASE_BIRTH_RATE: 0.03,
    BASE_DEATH_RATE: 0.01,
    MAX_POPULATION_PER_HOUSE: 8,
    ADULT_WORK_RATIO: 0.7, // 70% des adultes travaillent
    
    // Construction
    BASE_CONSTRUCTION_TIME: 60, // secondes
    WORKERS_PER_BUILDING: {
        house: 1,
        farm: 3,
        mine: 4,
        barracks: 5,
        market: 2
    },
    
    // Armée
    SOLDIER_UPKEEP: 0.5,
    MAX_MORALE: 100,
    MIN_MORALE: 0,
    
    // Bonheur
    MAX_HAPPINESS: 100,
    MIN_HAPPINESS: 0,
    HAPPINESS_THRESHOLDS: {
        revolt: 20,
        unhappy: 40,
        neutral: 60,
        happy: 80,
        ecstatic: 90
    }
};

// ===== FONCTIONS UTILITAIRES GLOBALES =====
const GameUtils = {
    // Formater les nombres
    formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
        return Math.floor(num).toString();
    },
    
    // Calculer la capacité de logement
    calculateHousingCapacity() {
        let capacity = 0;
        gameState.buildings.forEach(building => {
            const data = Buildings.types[building.name];
            if (data && data.housing) {
                capacity += data.housing * (building.level || 1);
            }
        });
        return Math.max(10, capacity); // Minimum 10
    },
    
    // Calculer la consommation de nourriture
    calculateFoodConsumption() {
        return gameState.population.current * 0.1; // 0.1 nourriture par personne
    },
    
    // Vérifier si on peut se permettre un achat
    canAfford(costs) {
        for (const [resource, amount] of Object.entries(costs)) {
            if (gameState.resources[resource] < amount) {
                return false;
            }
        }
        return true;
    },
    
    // Déduire les ressources
    deductResources(costs) {
        for (const [resource, amount] of Object.entries(costs)) {
            if (gameState.resources[resource] !== undefined) {
                gameState.resources[resource] -= amount;
            }
        }
    },

    // Garantir un etat coherent entre tous les modules
    ensureStateIntegrity() {
        // Ressources
        ["gold", "food", "stone", "wood", "iron", "luxury"].forEach((key) => {
            const value = Number(gameState.resources[key]);
            gameState.resources[key] = Number.isFinite(value) ? Math.max(0, value) : 0;
        });

        // Population
        gameState.population.current = Math.max(1, Number(gameState.population.current) || 1);
        gameState.population.total = Math.max(1, Number(gameState.population.total) || gameState.population.current);
        gameState.population.current = gameState.population.total;
        gameState.population.maxPop = Math.max(gameState.population.current, Number(gameState.population.maxPop) || 10);
        gameState.population.workers = Math.max(0, Math.floor(Number(gameState.population.workers) || (gameState.population.current * 0.7)));
        gameState.population.unemployed = Math.max(0, Math.floor(Number(gameState.population.unemployed) || 0));
        gameState.population.happiness = Math.max(0, Math.min(100, Number(gameState.population.happiness) || 100));

        // Armee
        const soldiers = Math.max(0, Math.floor(Number(gameState.army.soldiers) || 0));
        gameState.army.soldiers = soldiers;
        gameState.army.total = soldiers;
        gameState.army.upkeep = Math.max(0, Number(gameState.army.upkeep) || 0.5);

        if (!Array.isArray(gameState.buildings)) gameState.buildings = [];
        if (!Array.isArray(gameState.underConstruction)) gameState.underConstruction = [];

        const maxCols = (typeof Map !== "undefined" && Number.isFinite(Map.cols)) ? Map.cols : 15;
        const maxRows = (typeof Map !== "undefined" && Number.isFinite(Map.rows)) ? Map.rows : 10;
        const isValidTile = (entry) => (
            entry &&
            Number.isFinite(Number(entry.x)) &&
            Number.isFinite(Number(entry.y)) &&
            entry.x >= 0 &&
            entry.y >= 0 &&
            entry.x < maxCols &&
            entry.y < maxRows
        );

        gameState.buildings = gameState.buildings.filter(isValidTile);
        gameState.underConstruction = gameState.underConstruction.filter(isValidTile);
    },
    
    // Obtenir la saison actuelle
    getCurrentSeason() {
        const month = gameState.date.month || 1;
        if (month >= 3 && month <= 5) return 'printemps';
        if (month >= 6 && month <= 8) return 'été';
        if (month >= 9 && month <= 11) return 'automne';
        return 'hiver';
    },
    
    // Sauvegarder l'état du jeu
    saveGame(slot = 'auto') {
        try {
            this.ensureStateIntegrity();
            const saveData = {
                gameState: JSON.parse(JSON.stringify(gameState)),
                meta: {
                    saveDate: new Date().toISOString(),
                    version: gameState.meta.version
                }
            };
            
            localStorage.setItem(`empire_save_${slot}`, JSON.stringify(saveData));
            console.log(`💾 Jeu sauvegardé dans le slot: ${slot}`);
            return true;
        } catch (error) {
            console.error('Erreur de sauvegarde:', error);
            return false;
        }
    },
    
    // Charger une sauvegarde
    loadGame(slot = 'auto') {
        try {
            const saveData = localStorage.getItem(`empire_save_${slot}`);
            if (!saveData) {
                console.warn(`Aucune sauvegarde trouvée pour le slot: ${slot}`);
                return false;
            }
            
            const parsed = JSON.parse(saveData);
            Object.assign(gameState, parsed.gameState);
            this.ensureStateIntegrity();
            console.log(`📂 Jeu chargé depuis le slot: ${slot}`);
            return true;
        } catch (error) {
            console.error('Erreur de chargement:', error);
            return false;
        }
    },
    
    // Exporter la sauvegarde
    exportSave() {
        const saveData = {
            gameState: JSON.parse(JSON.stringify(gameState)),
            meta: {
                exportDate: new Date().toISOString(),
                version: gameState.meta.version
            }
        };
        
        const dataStr = JSON.stringify(saveData);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportName = `empire_save_${gameState.meta.empireName}_${Date.now()}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportName);
        linkElement.click();
        
        return exportName;
    },
    
    // Importer une sauvegarde
    importSave(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const importedData = JSON.parse(event.target.result);
                    Object.assign(gameState, importedData.gameState);
                    this.ensureStateIntegrity();
                    console.log('📂 Sauvegarde importée avec succès');
                    resolve(true);
                } catch (error) {
                    console.error('Erreur d\'importation:', error);
                    reject(error);
                }
            };
            reader.readAsText(file);
        });
    }
};

// ===== INITIALISATION DU JEU =====
function initializeGame() {
    console.log('🎮 Initialisation du jeu...');
    
    // Mettre à jour les dérivés
    gameState.population.maxPop = GameUtils.calculateHousingCapacity();
    gameState.date.season = GameUtils.getCurrentSeason();
    
    // Charger les préférences
    const savedSettings = localStorage.getItem('empire_settings');
    if (savedSettings) {
        Object.assign(gameState.settings, JSON.parse(savedSettings));
    }
    
    // Charger la dernière sauvegarde si auto-save activé
    if (gameState.settings.autoSave) {
        GameUtils.loadGame('auto');
    }

    GameUtils.ensureStateIntegrity();
    
    console.log('✅ Jeu initialisé');
    return true;
}

// Export pour Node.js (si besoin)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        gameState, 
        GAME_CONSTANTS, 
        GameUtils,
        initializeGame 
    };
}

// Auto-initialisation au chargement
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        setTimeout(initializeGame, 100);
    });
    
    // Auto-save avant de quitter
    window.addEventListener('beforeunload', () => {
        if (gameState.settings.autoSave) {
            GameUtils.saveGame('auto');
        }
    });
}
