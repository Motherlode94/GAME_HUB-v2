// js/game/population.js - VERSION CORRIGÉE
const Population = {
    config: {
        baseBirthRate: 0.03,
        baseDeathRate: 0.02,
        happinessBirthMultiplier: 0.005,
        foodBirthMultiplier: 0.01,
        overcrowdingPenalty: 0.015,
        baseMigrationRate: 0.01,
        
        citizenTypes: {
            peasants: { name: 'Paysans', foodConsumption: 1, goldConsumption: 0.1 },
            artisans: { name: 'Artisans', foodConsumption: 1.5, goldConsumption: 0.5 },
            merchants: { name: 'Marchands', foodConsumption: 2, goldConsumption: 1 },
            nobles: { name: 'Nobles', foodConsumption: 3, goldConsumption: 5 }
        }
    },
    
    state: {
        total: 0,
        byType: { peasants: 0, artisans: 0, merchants: 0, nobles: 0 },
        byAge: { children: 0, adults: 0, elders: 0 },
        unemployed: 0,
        employed: 0,
        growthRate: 0,
        migrationRate: 0,
        density: 0
    },
    
    // Compteurs pour éviter le spam
    tickCount: 0,
    lastAlertTick: 0,
    
    init(initialPop = 10) {
        console.log("👥 Initialisation Population...");
        
        this.state.total = initialPop;
this.state.byAge = {
    children: Math.round(initialPop * 0.25),  // 3
    adults: Math.round(initialPop * 0.60),    // 6
    elders: initialPop - Math.round(initialPop * 0.25) - Math.round(initialPop * 0.60)  // 1
};
        this.state.byType = {
            peasants: initialPop,
            artisans: 0,
            merchants: 0,
            nobles: 0
        };
        
        this.state.unemployed = 0;
        this.state.employed = Math.floor(this.state.byAge.adults * 0.6);
        this.tickCount = 0;
        this.lastAlertTick = 0;
        
        gameState.population.happiness = 75;
        
        console.log("✅ Population initialisée: " + initialPop);
    },
    
    update() {
        this.tickCount++;
        
        // Attendre 5 ticks avant toute action
        if (this.tickCount < 5) return;
        
        // 1. Vieillissement (très lent)
        if (this.tickCount % 12 === 0) {
            this.agePopulation();
        }
        
        // 2. Naissances (rare)
        const births = this.calculateBirths();
        
        // 3. Décès (rare)
        const deaths = this.calculateDeaths();
        
        // 4. Migration CONTRÔLÉE (très rare)
        const migration = this.calculateMigration();
        
        // 5. Stats
        this.updateStats(births, deaths, migration);
        
        // 6. Sync avec gameState
        this.updateGameState();
        
        // 7. Alertes (limitées)
        if (this.tickCount - this.lastAlertTick > 30) {
            this.checkEvents();
        }
    },
    
    calculateBirths() {
        // Pas de naissances dans les premiers ticks
        if (this.tickCount < 20) return 0;
        
        // Vérifier le logement
        const housingCap = this.calculateHousingCapacity();
        if (this.state.total >= housingCap) return 0;
        
        let birthRate = this.config.baseBirthRate / 12;
        
        const happiness = gameState.population.happiness || 50;
        if (happiness > 50) {
            birthRate += (happiness - 50) * 0.0001;
        }
        
        const foodRatio = (gameState.resources.food || 0) / Math.max(1, this.state.total);
        if (foodRatio < 1) {
            birthRate *= 0.3;
        }
        
        // Très rare
        if (Math.random() > birthRate * 10) return 0;
        
        const births = 1;
        this.state.byAge.children += births;
        this.state.total += births;
        
        return births;
    },
    
    calculateDeaths() {
        if (this.tickCount < 20) return 0;
        if (this.state.total <= 5) return 0;
        
        let deathRate = this.config.baseDeathRate / 12;
        
        const foodRatio = (gameState.resources.food || 0) / Math.max(1, this.state.total);
        if (foodRatio < 0.3) {
            deathRate *= 3;
        }
        
        // Très rare
        if (Math.random() > deathRate * 5) return 0;
        
        const deaths = 1;
        
        // Retirer d'un groupe d'âge aléatoire
        if (this.state.byAge.elders > 0 && Math.random() < 0.5) {
            this.state.byAge.elders--;
        } else if (this.state.byAge.adults > 0) {
            this.state.byAge.adults--;
        }
        
        this.state.total = Math.max(1, this.state.total - deaths);
        
        return deaths;
    },
    
    calculateMigration() {
        // DÉSACTIVÉ pendant les 50 premiers ticks
        if (this.tickCount < 50) return 0;
        
        const happiness = gameState.population.happiness || 50;
        const housingCap = this.calculateHousingCapacity();
        const housingFree = housingCap - this.state.total;
        
        // Pas d'immigration si pas de place ou bonheur < 70
        if (housingFree <= 0 || happiness < 70) {
            // Émigration possible si très malheureux
            if (happiness < 30 && this.state.total > 5 && Math.random() < 0.05) {
                this.state.total--;
                this.state.byAge.adults = Math.max(0, this.state.byAge.adults - 1);
                this.state.migrationRate = -1;
                return -1;
            }
            return 0;
        }
        
        // Immigration très rare (2% de chance si conditions OK)
        if (Math.random() < 0.02 && happiness > 75 && housingFree > 2) {
            this.state.total++;
            this.state.byAge.adults++;
            this.state.byType.peasants++;
            this.state.migrationRate = 1;
            
            if (UI && typeof UI.notify === 'function') {
                UI.notify("🚶 1 immigrant arrive", "success");
            }
            return 1;
        }
        
        this.state.migrationRate = 0;
        return 0;
    },
    
    agePopulation() {
        // Très lent - appelé tous les 12 ticks
        const aging = Math.floor(this.state.byAge.children * 0.05);
        if (aging > 0) {
            this.state.byAge.children -= aging;
            this.state.byAge.adults += aging;
        }
        
        const elderAging = Math.floor(this.state.byAge.adults * 0.02);
        if (elderAging > 0) {
            this.state.byAge.adults -= elderAging;
            this.state.byAge.elders += elderAging;
        }
    },
    
    calculateHousingCapacity() {
        let capacity = 0;
        
        if (!gameState.buildings) return 10;
        
        gameState.buildings.forEach(b => {
            if (b.name === 'Château') {
                capacity += 10;
            } else if (b.name === 'Maison') {
                capacity += 5 * (b.level || 1);
            }
        });
        
        return Math.max(10, capacity);
    },
    
    calculateAvailableJobs() {
        let jobs = 0;
        
        if (!gameState.buildings || !Buildings?.types) return 0;
        
        gameState.buildings.forEach(b => {
            const data = Buildings.types[b.name];
            if (data && data.workers) {
                jobs += data.workers * (b.level || 1);
            }
        });
        
        return jobs;
    },
    
    updateStats(births = 0, deaths = 0, migration = 0) {
        this.state.total = Math.max(1, 
            this.state.byAge.children + 
            this.state.byAge.adults + 
            this.state.byAge.elders
        );
        
        const totalJobs = this.calculateAvailableJobs();
        const availableWorkers = Math.floor(this.state.byAge.adults * 0.8);
        
        this.state.employed = Math.min(availableWorkers, totalJobs);
        this.state.unemployed = Math.max(0, availableWorkers - this.state.employed);
        
        const housingCap = this.calculateHousingCapacity();
        this.state.density = housingCap > 0 ? this.state.total / housingCap : 1;
        
        if (this.state.total > 0) {
            this.state.growthRate = (births - deaths + migration) / this.state.total;
        }
    },
    
    updateGameState() {
        const housingCap = this.calculateHousingCapacity();
        
        // Empêcher la surpopulation
        if (this.state.total > housingCap) {
            this.state.total = housingCap;
        }
        
        gameState.population.current = this.state.total;
        gameState.population.total = this.state.total;
        gameState.population.maxPop = housingCap;
        gameState.population.workers = this.state.employed;
        gameState.population.unemployed = this.state.unemployed;
        gameState.population.growthRate = this.state.growthRate;
        gameState.population.density = this.state.density;
    },
    
    checkEvents() {
        // Ne pas spammer les alertes
        if (this.tickCount - this.lastAlertTick < 30) return;
        
        // Surpopulation (> 110%)
        if (this.state.density > 1.1 && this.state.total > 12) {
            UI?.notify("⚠️ Surpopulation - construisez des maisons", "warning");
            this.lastAlertTick = this.tickCount;
            return;
        }
        
        // Famine critique
        const foodRatio = (gameState.resources.food || 0) / Math.max(1, this.state.total);
        if (foodRatio < 0.2 && gameState.resources.food < 5) {
            UI?.notify("💀 Famine critique !", "error");
            this.lastAlertTick = this.tickCount;
            return;
        }
        
        // Chômage massif (> 60% ET plus de 20 habitants)
        const unemploymentRate = this.state.unemployed / Math.max(1, this.state.byAge.adults * 0.8);
        if (unemploymentRate > 0.6 && this.state.total > 20) {
            UI?.notify("⚠️ Chômage élevé - créez des emplois", "warning");
            this.lastAlertTick = this.tickCount;
        }
    },
    
    getStats() {
        return {
            total: this.state.total,
            density: this.state.density,
            employed: this.state.employed,
            unemployed: this.state.unemployed,
            byAge: { ...this.state.byAge },
            byType: { ...this.state.byType }
        };
    }
};

// Initialisation au chargement (si gameState existe)
if (typeof gameState !== 'undefined') {
    setTimeout(() => {
        Population.init(gameState.population?.current || 10);
    }, 500);
}