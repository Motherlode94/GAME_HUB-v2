// js/core/state.js - VERSION COMPLÈTE
const State = {
    // Initialiser l'état
    init() {
        console.log("Initialisation de l'état du jeu...");
        this.calculateMaxPopulation();
        this.updateWorkers();
        this.calculateProduction();
    },
    
calculateProduction() {
        let potentialGold = 0;
        let potentialFood = 0;
        let potentialStone = 0;
        let totalWorkersNeeded = 0;

        // ÉTAPE 1 : Calculer les besoins totaux en ouvriers
        gameState.buildings.forEach(b => {
            const data = Buildings.types[b.name];
            if (data) {
                totalWorkersNeeded += data.workers || 0;
            }
        });

        // ÉTAPE 2 : Calculer le ratio d'efficacité
        let efficiency = 1;
        if (totalWorkersNeeded > 0) {
            efficiency = Math.min(1, gameState.population.workers / totalWorkersNeeded);
        }

        // ÉTAPE 3 : Calculer la production avec efficacité et niveau
        gameState.buildings.forEach(b => {
            const data = Buildings.types[b.name];
            const lvl = b.level || 1;
            
            if (data) {
                // Production principale
                const prodReelle = (data.prod || 0) * lvl * efficiency;
                
                if (data.type === 'gold') potentialGold += prodReelle;
                if (data.type === 'food') potentialFood += prodReelle;
                if (data.type === 'stone') potentialStone += prodReelle;
                
                // Production secondaire (ex: château produit aussi de la nourriture)
                if (data.prodFood) {
                    potentialFood += data.prodFood * lvl * efficiency;
                }
                if (data.prodGold) {
                    potentialGold += data.prodGold * lvl * efficiency;
                }
            }
        });

        // ÉTAPE 4 : Enregistrer les résultats
        gameState.production = {
            goldPerTick: potentialGold,
            foodPerTick: potentialFood,
            stonePerTick: potentialStone,
            workersNeeded: totalWorkersNeeded,
            currentEfficiency: efficiency
        };
    },
    
    // Calculer la population maximum
    calculateMaxPopulation() {
        let maxPop = 10; // Base du Château
        
        gameState.buildings.forEach(b => {
            if (b.name === 'Maison') {
                const level = b.level || 1;
                maxPop += 5 + (level - 1); // 5 par maison + 1 par niveau supplémentaire
            }
        });
        
        gameState.population.maxPop = maxPop;
        return maxPop;
    },
    
    // Mettre à jour le nombre d'ouvriers
    updateWorkers() {
        // 70% de la population peut travailler
        gameState.population.workers = Math.floor(gameState.population.current * 0.7);
        return gameState.population.workers;
    },
    
    // Vérifier si on peut ajouter de la population
    canAddPopulation() {
        return gameState.population.current < gameState.population.maxPop;
    },
    
    // Ajouter de la population (naissance/immigration)
    addPopulation(count = 1) {
        const availableSpace = gameState.population.maxPop - gameState.population.current;
        const toAdd = Math.min(count, availableSpace);
        
        if (toAdd > 0) {
            gameState.population.current += toAdd;
            gameState.population.total = gameState.population.current;
            this.updateWorkers();
            
            // Mettre à jour les citoyens visuels
            if (typeof Citizens !== 'undefined') {
                for (let i = 0; i < toAdd; i++) {
                    Citizens.createCitizen();
                }
            }
            
            return toAdd;
        }
        return 0;
    },
    
    // Réduire la population (mortalité/émigration)
    removePopulation(count = 1) {
        const toRemove = Math.min(count, gameState.population.current - 1); // Toujours garder au moins 1
        
        if (toRemove > 0) {
            gameState.population.current -= toRemove;
            gameState.population.total = gameState.population.current;
            this.updateWorkers();
            
            // Retirer des citoyens visuels
            if (typeof Citizens !== 'undefined' && Citizens.list.length > 0) {
                for (let i = 0; i < toRemove && Citizens.list.length > 0; i++) {
                    Citizens.list.pop();
                }
            }
            
            return toRemove;
        }
        return 0;
    },
    
    // Obtenir des statistiques
    getStats() {
        return {
            population: gameState.population.current,
            maxPopulation: gameState.population.maxPop,
            workers: gameState.population.workers,
            efficiency: gameState.production.currentEfficiency * 100,
            buildings: gameState.buildings.length,
            underConstruction: gameState.underConstruction.length
        };
    },
    
    // Sauvegarder l'état
    save() {
        return JSON.parse(JSON.stringify(gameState));
    },
    
    // Charger un état
    load(savedState) {
        Object.keys(savedState).forEach(key => {
            gameState[key] = savedState[key];
        });
        this.calculateProduction();
        this.calculateMaxPopulation();
        this.updateWorkers();
    }
};