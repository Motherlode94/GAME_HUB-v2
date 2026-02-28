// js/mechanics/demography.js - DÉMOGRAPHIE RÉALISTE
const Demography = {
    CONFIG: {
        // Taux de base (par an, divisé par 12 pour mensuel)
        BIRTH_RATE: 0.035,
        DEATH_RATE: 0.020,
        
        // Mortalité par âge (multiplicateur)
        AGE_MORTALITY: {
            infant: 2.5,    // 0-4 ans
            child: 0.8,     // 5-14 ans
            adult: 0.5,     // 15-49 ans
            mature: 1.2,    // 50-64 ans
            elder: 3.0      // 65+ ans
        },
        
        // Fertilité par âge (femmes 15-49)
        FERTILITY_PEAK: 25,
        FERTILITY_RANGE: { min: 15, max: 45 },
        
        // Migration
        MIGRATION_BASE: 0.005,
        ATTRACTION_FACTORS: {
            happiness: 0.02,
            food: 0.015,
            housing: 0.01
        }
    },
    
    // Pyramide des âges (simplifiée en 5 groupes)
    pyramid: {
        infant: 0,    // 0-4
        child: 0,     // 5-14
        adult: 0,     // 15-49
        mature: 0,    // 50-64
        elder: 0      // 65+
    },
    
    // Initialisation
    init() {
        const pop = gameState.population.current || 10;
        this.distributePyramid(pop);
        console.log("👨‍👩‍👧‍👦 Démographie initialisée");
    },
    
    // Distribution initiale réaliste
distributePyramid(total) {
        this.pyramid = {
            infant: Math.round(total * 0.10),
            child: Math.round(total * 0.18),
            adult: Math.round(total * 0.45),
            mature: Math.round(total * 0.17),
            elder: Math.round(total * 0.10)
        };
        // NE PAS appeler syncTotal() ici pour éviter l'écrasement au démarrage
        gameState.population.pyramid = { ...this.pyramid };
    },
    
    // Synchroniser avec gameState
syncTotal() {
        // NE PAS modifier gameState.population.current
        // Population.js est le maître
        
        const total = Object.values(this.pyramid).reduce((a, b) => a + b, 0);
        
        // Stocker seulement la pyramide et les stats dérivées
        gameState.population.pyramid = { ...this.pyramid };
        gameState.population.pyramidTotal = total;
        
        // Calculer les travailleurs basés sur la pyramide (info seulement)
        gameState.population.workersFromPyramid = Math.floor(
            this.pyramid.adult * 0.85 + this.pyramid.mature * 0.60
        );
    },
    
    // Mise à jour mensuelle
    update() {
        const season = typeof Climate !== 'undefined' ? Climate.state.current : 'spring';
        
        this.processBirths(season);
        this.processDeaths(season);
        this.processAging();
        this.processMigration();
        this.syncTotal();
    },
    
    // Naissances
    processBirths(season) {
        // Femmes en âge de procréer (~50% des adultes)
        const fertileFemales = Math.floor(this.pyramid.adult * 0.5);
        if (fertileFemales <= 0) return;
        
        let birthRate = this.CONFIG.BIRTH_RATE / 12;
        
        // Modificateurs
        const happiness = gameState.population.happiness || 50;
        birthRate *= 0.5 + (happiness / 100);
        
        const foodRatio = (gameState.resources.food || 0) / Math.max(1, gameState.population.current);
        if (foodRatio > 1.5) birthRate *= 1.3;
        else if (foodRatio < 0.8) birthRate *= 0.5;
        
        // Saison (moins de naissances en hiver)
        if (season === 'winter') birthRate *= 0.7;
        
        // Logement disponible
        const housingRatio = gameState.population.current / Math.max(1, gameState.population.maxPop);
        if (housingRatio > 0.9) birthRate *= 0.3;
        
        const births = Math.floor(fertileFemales * birthRate * (0.8 + Math.random() * 0.4));
        
        if (births > 0) {
            this.pyramid.infant += births;
            if (births >= 2) {
                UI?.notify(`👶 ${births} naissances ce mois !`, "success");
            }
        }
    },
    
    // Décès
    processDeaths(season) {
        let totalDeaths = 0;
        const baseRate = this.CONFIG.DEATH_RATE / 12;
        
        // Facteurs environnementaux
        let envMultiplier = 1;
        
        const foodRatio = (gameState.resources.food || 0) / Math.max(1, gameState.population.current);
        if (foodRatio < 0.5) envMultiplier *= 2.5; // Famine
        else if (foodRatio < 0.8) envMultiplier *= 1.5;
        
        if (season === 'winter') envMultiplier *= 1.4;
        
        const happiness = gameState.population.happiness || 50;
        if (happiness < 30) envMultiplier *= 1.3;
        
        // Décès par groupe d'âge
        Object.entries(this.CONFIG.AGE_MORTALITY).forEach(([group, multiplier]) => {
            const pop = this.pyramid[group] || 0;
            if (pop <= 0) return;
            
            const groupRate = baseRate * multiplier * envMultiplier;
            const deaths = Math.floor(pop * groupRate * (0.7 + Math.random() * 0.6));
            
            if (deaths > 0) {
                this.pyramid[group] = Math.max(0, this.pyramid[group] - deaths);
                totalDeaths += deaths;
            }
        });
        
        if (totalDeaths >= 3) {
            UI?.notify(`💀 ${totalDeaths} décès ce mois`, "warning");
        }
    },
    
    // Vieillissement (annuel simulé mensuellement)
    processAging() {
        // 1/12 chance par mois de vieillir un groupe
        if (Math.random() > 0.083) return;
        
        // Transitions
        const infantToChild = Math.floor(this.pyramid.infant * 0.2);
        const childToAdult = Math.floor(this.pyramid.child * 0.1);
        const adultToMature = Math.floor(this.pyramid.adult * 0.03);
        const matureToElder = Math.floor(this.pyramid.mature * 0.06);
        
        this.pyramid.infant -= infantToChild;
        this.pyramid.child += infantToChild - childToAdult;
        this.pyramid.adult += childToAdult - adultToMature;
        this.pyramid.mature += adultToMature - matureToElder;
        this.pyramid.elder += matureToElder;
        
        // Sécurité
        Object.keys(this.pyramid).forEach(k => {
            this.pyramid[k] = Math.max(0, this.pyramid[k]);
        });
    },
    
    // Migration
    processMigration() {
        let migrationRate = this.CONFIG.MIGRATION_BASE;
        
        // Attractivité
        const happiness = gameState.population.happiness || 50;
        if (happiness > 60) {
            migrationRate += (happiness - 60) * this.CONFIG.ATTRACTION_FACTORS.happiness / 100;
        } else if (happiness < 40) {
            migrationRate -= (40 - happiness) * 0.01; // Émigration
        }
        
        // Logement
        const housingSpace = gameState.population.maxPop - gameState.population.current;
        if (housingSpace > 5) {
            migrationRate += housingSpace * this.CONFIG.ATTRACTION_FACTORS.housing / 100;
        }
        
        const migrants = Math.floor(migrationRate * (Math.random() * 2 - 0.5) * 10);
        
        if (migrants > 0 && housingSpace > 0) {
            // Immigrants (surtout adultes)
            const actualMigrants = Math.min(migrants, housingSpace);
            this.pyramid.adult += Math.floor(actualMigrants * 0.7);
            this.pyramid.child += Math.floor(actualMigrants * 0.3);
            
            if (actualMigrants >= 2) {
                UI?.notify(`🚶 ${actualMigrants} immigrants arrivent`, "info");
            }
        } else if (migrants < -2) {
            // Émigration
            const emigrants = Math.min(Math.abs(migrants), this.pyramid.adult);
            this.pyramid.adult -= emigrants;
            UI?.notify(`🚶 ${emigrants} citoyens émigrent`, "warning");
        }
    },
    
    // Ajouter population (construction maison, événement)
    addPopulation(count, group = 'adult') {
        this.pyramid[group] = (this.pyramid[group] || 0) + count;
        this.syncTotal();
    },
    
    // Retirer population (recrutement armée, catastrophe)
    removePopulation(count, group = 'adult') {
        const removed = Math.min(count, this.pyramid[group] || 0);
        this.pyramid[group] -= removed;
        this.syncTotal();
        return removed;
    },
    
    // Statistiques
    getStats() {
        const total = Object.values(this.pyramid).reduce((a, b) => a + b, 0);
        return {
            total,
            pyramid: { ...this.pyramid },
            percentages: {
                infant: ((this.pyramid.infant / total) * 100).toFixed(1) + '%',
                child: ((this.pyramid.child / total) * 100).toFixed(1) + '%',
                adult: ((this.pyramid.adult / total) * 100).toFixed(1) + '%',
                mature: ((this.pyramid.mature / total) * 100).toFixed(1) + '%',
                elder: ((this.pyramid.elder / total) * 100).toFixed(1) + '%'
            },
            dependencyRatio: (
                (this.pyramid.infant + this.pyramid.child + this.pyramid.elder) /
                Math.max(1, this.pyramid.adult + this.pyramid.mature) * 100
            ).toFixed(1) + '%',
            workers: gameState.population.workers
        };
    }
};

// Intégration Timer
if (typeof Timer !== 'undefined') {
    const originalOnTick = Timer.onTick.bind(Timer);
    Timer.onTick = function() {
        originalOnTick();
        Demography.update();
    };
}

// Initialisation
window.addEventListener('load', () => {
    setTimeout(() => Demography.init(), 400);
});