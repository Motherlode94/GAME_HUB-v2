// js/mechanics/ressources.js - VERSION CORRIGÉE
const Ressources = {
    update() {
        // 1. AJOUTER LES PRODUCTIONS
        this.addProductions();
        
        // 2. CALCULER LES CONSOMMATIONS
        this.calculateConsumptions();
        
        // 3. APPLIQUER LES EFFETS
        this.applyEffects();
        
        // 4. METTRE À JOUR L'UI
        if (typeof UI !== 'undefined') {
            UI.refresh();
        }
    },
    
    addProductions() {
        let goldProd = gameState.production.goldPerTick || 0;
        let foodProd = gameState.production.foodPerTick || 0;
        let stoneProd = gameState.production.stonePerTick || 0;
        
        // Appliquer les modificateurs saisonniers si Climate existe
        if (typeof Climate !== 'undefined' && Climate.modifiers) {
            goldProd *= Climate.modifiers.gold || 1;
            foodProd *= Climate.modifiers.food || 1;
            stoneProd *= Climate.modifiers.stone || 1;
        }
        
        // Ajouter aux ressources
        gameState.resources.gold += goldProd;
        gameState.resources.food += foodProd;
        gameState.resources.stone += stoneProd;
        
        // Statistiques
        gameState.stats.goldEarned += goldProd;
        gameState.stats.foodProduced += foodProd;
    },
    
    calculateConsumptions() {
        const foodConsumption = this.calculateFoodConsumption();
        const armyUpkeep = this.calculateArmyUpkeep();
        
        gameState.consumptions = {
            food: foodConsumption,
            gold: armyUpkeep
        };
    },
    
    calculateFoodConsumption() {
        // Base: 0.15 nourriture par personne (réduit de 0.5)
        let consumption = (gameState.population.current || 0) * 0.15;
        
        // Modificateur saisonnier
        if (typeof Climate !== 'undefined' && Climate.modifiers) {
            consumption *= Climate.modifiers.consumption || 1;
        }
        
        return consumption;
    },
    
    calculateArmyUpkeep() {
        const soldiers = gameState.army?.soldiers || 0;
        if (soldiers === 0) return 0;
        
        const upkeepPerSoldier = 0.5;
        return soldiers * upkeepPerSoldier;
    },
    
    applyEffects() {
        // CONSOMMATION DE NOURRITURE
        const foodConsumption = gameState.consumptions?.food || 0;
        gameState.resources.food -= foodConsumption;
        
        if (gameState.resources.food < 0) {
            this.handleStarvation();
            gameState.resources.food = 0;
        }
        
        // CONSOMMATION D'OR (Armée)
        const goldConsumption = gameState.consumptions?.gold || 0;
        gameState.resources.gold -= goldConsumption;
        
        if (gameState.resources.gold < 0) {
            this.handleBankruptcy();
            gameState.resources.gold = 0;
        }
        
        // Sécurité : pas de valeurs négatives
        gameState.resources.food = Math.max(0, gameState.resources.food);
        gameState.resources.gold = Math.max(0, gameState.resources.gold);
        gameState.resources.stone = Math.max(0, gameState.resources.stone);
    },
    
    handleStarvation() {
        const deficit = Math.abs(gameState.resources.food);
        
        // Perte de population proportionnelle au déficit
        const populationLoss = Math.min(
            Math.ceil(deficit / 5),
            Math.max(0, gameState.population.current - 1)
        );
        
        if (populationLoss > 0) {
            gameState.population.current -= populationLoss;
            gameState.population.total = gameState.population.current;
            
            gameState.population.happiness = Math.max(0,
                (gameState.population.happiness || 50) - 15
            );
            
            if (typeof UI !== 'undefined' && UI.notify) {
                UI.notify(`💀 Famine ! ${populationLoss} mort(s)`, 'error');
            }
            
            // Retirer citoyens visuels
            if (typeof Citizens !== 'undefined' && Citizens.list) {
                for (let i = 0; i < populationLoss && Citizens.list.length > 0; i++) {
                    Citizens.list.pop();
                }
            }
        }
    },
    
    handleBankruptcy() {
        const soldiers = gameState.army?.soldiers || 0;
        if (soldiers === 0) return;
        
        const deficit = Math.abs(gameState.resources.gold);
        const upkeep = gameState.army.upkeep || 0.5;
        const soldiersToDesert = Math.min(
            Math.ceil(deficit / upkeep),
            soldiers
        );
        
        if (soldiersToDesert > 0) {
            gameState.army.soldiers -= soldiersToDesert;
            gameState.army.total = gameState.army.soldiers;
            gameState.army.upkeep = gameState.army.soldiers * 0.5;
            gameState.population.current += soldiersToDesert;
            gameState.population.total = gameState.population.current;
            
            if (typeof UI !== 'undefined' && UI.notify) {
                UI.notify(`💸 ${soldiersToDesert} soldats désertent`, 'warning');
            }
        }
    },
    
    canAfford(cost) {
        return (
            gameState.resources.gold >= (cost.gold || 0) &&
            gameState.resources.food >= (cost.food || 0) &&
            gameState.resources.stone >= (cost.stone || 0)
        );
    },
    
    spend(cost) {
        if (!this.canAfford(cost)) return false;
        
        gameState.resources.gold -= cost.gold || 0;
        gameState.resources.food -= cost.food || 0;
        gameState.resources.stone -= cost.stone || 0;
        
        return true;
    },
    
    getReport() {
        return {
            productions: {
                gold: gameState.production.goldPerTick || 0,
                food: gameState.production.foodPerTick || 0,
                stone: gameState.production.stonePerTick || 0
            },
            consumptions: gameState.consumptions || { food: 0, gold: 0 },
            balances: {
                gold: (gameState.production.goldPerTick || 0) - (gameState.consumptions?.gold || 0),
                food: (gameState.production.foodPerTick || 0) - (gameState.consumptions?.food || 0)
            },
            stocks: { ...gameState.resources }
        };
    }
};
