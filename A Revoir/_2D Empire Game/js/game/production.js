// js/game/production.js - VERSION AMÉLIORÉE
const Production = {
    // Cache pour éviter les calculs répétitifs
    cache: {
        lastUpdate: 0,
        cachedValues: null,
        dirty: true // Flag pour indiquer si le cache est obsolète
    },

    // Facteurs de production modifiables
    factors: {
        baseGold: 2,
        baseFood: 1,
        happinessMultipliers: {
            critical: 0.6,    // < 30 bonheur
            low: 0.8,        // 30-60 bonheur
            normal: 1.0,     // 60-80 bonheur
            high: 1.2,       // 80-90 bonheur
            excellent: 1.5   // > 90 bonheur
        },
        seasonMultipliers: {
            spring: { food: 1.2, gold: 1.0 },
            summer: { food: 1.5, gold: 1.1 },
            autumn: { food: 1.0, gold: 1.3 },
            winter: { food: 0.6, gold: 0.9 }
        },
        efficiencyMultiplier: 0.01 // +1% par point d'efficacité au-dessus de 100%
    },

    // Calcul complet de la production
    calculate(forceRecalc = false) {
        // Utiliser le cache si disponible et pas forcé
        const now = Date.now();
        if (!forceRecalc && !this.cache.dirty && this.cache.cachedValues && 
            (now - this.cache.lastUpdate) < 5000) { // Cache valide 5 secondes
            return this.cache.cachedValues;
        }

        console.log("⚙️ Recalcul de la production...");
        
        let production = {
            gold: {
                base: this.factors.baseGold,
                fromBuildings: 0,
                bonuses: 0,
                penalties: 0,
                multipliers: 1,
                total: 0
            },
            food: {
                base: this.factors.baseFood,
                fromBuildings: 0,
                bonuses: 0,
                penalties: 0,
                multipliers: 1,
                total: 0
            },
            other: {} // Pour d'autres ressources (pierre, bois, etc.)
        };

        // === 1. PRODUCTION DE BASE ===
        production.gold.total += production.gold.base;
        production.food.total += production.food.base;

        // === 2. PRODUCTION DES BÂTIMENTS ===
        this.calculateBuildingProduction(production);

        // === 3. MODIFICATEURS DE SAISON ===
        this.applySeasonalModifiers(production);

        // === 4. MODIFICATEURS DE BONHEUR ===
        this.applyHappinessModifiers(production);

        // === 5. EFFICIENCE DES OUVRIERS ===
        this.applyEfficiencyModifiers(production);

        // === 6. ÉVÉNEMENTS SPÉCIAUX & BUFFS ===
        this.applySpecialModifiers(production);

        // === 7. CALCUL FINAL ===
        this.calculateTotals(production);

        // Mettre à jour le cache
        this.cache.cachedValues = production;
        this.cache.lastUpdate = now;
        this.cache.dirty = false;

        // Mettre à jour gameState
        this.updateGameState(production);

        return production;
    },

    // Calculer la production des bâtiments
    calculateBuildingProduction(production) {
        let goldBuildings = 0;
        let foodBuildings = 0;
        let specialBuildings = [];

        gameState.buildings.forEach(building => {
            const buildingData = Buildings.types[building.name];
            if (!buildingData || !buildingData.production) return;

            // Production selon le type de bâtiment
            switch (buildingData.type) {
                case 'gold':
                case 'income':
                    const goldProd = this.calculateBuildingOutput(building, buildingData, 'gold');
                    goldBuildings += goldProd;
                    production.gold.fromBuildings += goldProd;
                    break;

                case 'food':
                case 'farm':
                    const foodProd = this.calculateBuildingOutput(building, buildingData, 'food');
                    foodBuildings += foodProd;
                    production.food.fromBuildings += foodProd;
                    break;

                case 'hybrid':
                    // Bâtiments qui produisent plusieurs ressources
                    if (buildingData.production.gold) {
                        const goldProd = this.calculateBuildingOutput(building, buildingData, 'gold');
                        goldBuildings += goldProd;
                        production.gold.fromBuildings += goldProd;
                    }
                    if (buildingData.production.food) {
                        const foodProd = this.calculateBuildingOutput(building, buildingData, 'food');
                        foodBuildings += foodProd;
                        production.food.fromBuildings += foodProd;
                    }
                    break;

                case 'special':
                    // Bâtiments avec effets spéciaux (marchés, etc.)
                    specialBuildings.push({ building, data: buildingData });
                    break;
            }
        });

        // Traiter les bâtiments spéciaux
        this.processSpecialBuildings(specialBuildings, production);

        // Ajouter les totaux des bâtiments
        production.gold.total += goldBuildings;
        production.food.total += foodBuildings;

        console.log(`🏭 Bâtiments: ${goldBuildings.toFixed(1)} or, ${foodBuildings.toFixed(1)} nourriture`);
    },

    // Calculer la sortie d'un bâtiment (avec niveau et améliorations)
    calculateBuildingOutput(building, buildingData, resourceType) {
        let output = 0;
        const baseProduction = buildingData.production[resourceType] || buildingData.prod || 0;
        
        if (baseProduction > 0) {
            // Production de base
            output = baseProduction;
            
            // Bonus par niveau
            const level = building.level || 1;
            if (level > 1) {
                const levelBonus = buildingData.levelMultiplier || 0.2; // +20% par niveau
                output *= (1 + (level - 1) * levelBonus);
            }
            
            // Bonus d'améliorations
            if (building.upgrades) {
                building.upgrades.forEach(upgradeId => {
                    const upgrade = Upgrades.types[upgradeId];
                    if (upgrade && upgrade.productionBonus && upgrade.productionBonus[resourceType]) {
                        output *= (1 + upgrade.productionBonus[resourceType]);
                    }
                });
            }
            
            // Pénalité si le bâtiment n'a pas assez d'ouvriers
            if (buildingData.workers) {
                const assignedWorkers = building.assignedWorkers || 0;
                const workerRatio = Math.min(1, assignedWorkers / buildingData.workers);
                output *= workerRatio;
                
                if (workerRatio < 0.5) {
                    production[resourceType].penalties += output * (0.5 - workerRatio);
                }
            }
        }
        
        return output;
    },

    // Appliquer les modificateurs saisonniers
    applySeasonalModifiers(production) {
        const season = this.getCurrentSeason();
        const multipliers = this.factors.seasonMultipliers[season] || 
                          this.factors.seasonMultipliers.spring;
        
        production.food.multipliers *= multipliers.food;
        production.gold.multipliers *= multipliers.gold;
        
        console.log(`🌤️ Saison ${season}: Nourriture ×${multipliers.food}, Or ×${multipliers.gold}`);
    },

    // Obtenir la saison actuelle
    getCurrentSeason() {
        const month = gameState.date.month || 1;
        if (month >= 3 && month <= 5) return 'spring';
        if (month >= 6 && month <= 8) return 'summer';
        if (month >= 9 && month <= 11) return 'autumn';
        return 'winter';
    },

    // Appliquer les modificateurs de bonheur
    applyHappinessModifiers(production) {
        const happiness = gameState.population.happiness || 100;
        let multiplier = 1.0;
        
        if (happiness < 30) multiplier = this.factors.happinessMultipliers.critical;
        else if (happiness < 60) multiplier = this.factors.happinessMultipliers.low;
        else if (happiness < 80) multiplier = this.factors.happinessMultipliers.normal;
        else if (happiness < 90) multiplier = this.factors.happinessMultipliers.high;
        else multiplier = this.factors.happinessMultipliers.excellent;
        
        production.gold.multipliers *= multiplier;
        production.food.multipliers *= multiplier;
        
        console.log(`😊 Bonheur ${happiness}: Multiplicateur ×${multiplier}`);
    },

    // Appliquer les modificateurs d'efficience
    applyEfficiencyModifiers(production) {
        const efficiency = gameState.efficiency || 100;
        
        if (efficiency > 100) {
            const bonus = (efficiency - 100) * this.factors.efficiencyMultiplier;
            production.gold.bonuses += production.gold.total * bonus;
            production.food.bonuses += production.food.total * bonus;
            
            console.log(`⚡ Efficience ${efficiency}%: Bonus +${(bonus*100).toFixed(1)}%`);
        } else if (efficiency < 80) {
            const penalty = (80 - efficiency) * 0.01;
            production.gold.penalties += production.gold.total * penalty;
            production.food.penalties += production.food.total * penalty;
            
            console.log(`⚠️ Efficience ${efficiency}%: Pénalité -${(penalty*100).toFixed(1)}%`);
        }
    },

    // Traiter les bâtiments spéciaux
    processSpecialBuildings(specialBuildings, production) {
        specialBuildings.forEach(({ building, data }) => {
            // Marchés - boost les revenus commerciaux
            if (data.name === 'Marché' || data.type === 'market') {
                const marketBonus = 0.15; // +15% aux revenus d'or
                production.gold.bonuses += production.gold.total * marketBonus;
                console.log(`🏪 Marché: +${(marketBonus*100)}% revenus d'or`);
            }
            
            // Entrepôts - réduit les pertes
            if (data.name === 'Entrepôt' || data.type === 'storage') {
                const storageBonus = 0.1; // -10% de pertes
                production.food.penalties *= (1 - storageBonus);
                console.log(`📦 Entrepôt: -${(storageBonus*100)}% pertes`);
            }
            
            // Temples - boost le bonheur (indirectement la production)
            if (data.name === 'Temple' || data.type === 'temple') {
                const happinessBoost = 5;
                // Ce bonus sera appliqué au prochain tick via le système de bonheur
                console.log(`⛪ Temple: +${happinessBoost} bonheur`);
            }
        });
    },

    // Appliquer les modificateurs spéciaux (événements, buffs)
    applySpecialModifiers(production) {
        // Vérifier les événements actifs
        if (gameState.activeEvents) {
            gameState.activeEvents.forEach(event => {
                if (event.productionModifier) {
                    production.gold.multipliers *= event.productionModifier.gold || 1;
                    production.food.multipliers *= event.productionModifier.food || 1;
                    
                    console.log(`🎪 Événement "${event.name}": ×${event.productionModifier.gold || 1} or, ×${event.productionModifier.food || 1} nourriture`);
                }
            });
        }
        
        // Vérifier les buffs du joueur
        if (gameState.playerBuffs) {
            Object.values(gameState.playerBuffs).forEach(buff => {
                if (buff.productionBoost && buff.active) {
                    production.gold.bonuses += production.gold.total * buff.productionBoost.gold || 0;
                    production.food.bonuses += production.food.total * buff.productionBoost.food || 0;
                    
                    console.log(`✨ Buff "${buff.name}": +${(buff.productionBoost.gold*100 || 0)}% or, +${(buff.productionBoost.food*100 || 0)}% nourriture`);
                }
            });
        }
    },

    // Calculer les totaux finaux
    calculateTotals(production) {
        // Calculer les totaux avant pénalités
        production.gold.grossTotal = production.gold.total + production.gold.bonuses;
        production.food.grossTotal = production.food.total + production.food.bonuses;
        
        // Appliquer les multiplicateurs
        production.gold.grossTotal *= production.gold.multipliers;
        production.food.grossTotal *= production.food.multipliers;
        
        // Soustraire les pénalités
        production.gold.final = Math.max(0, production.gold.grossTotal - production.gold.penalties);
        production.food.final = Math.max(0, production.food.grossTotal - production.food.penalties);
        
        // Arrondir
        production.gold.final = Math.round(production.gold.final * 10) / 10;
        production.food.final = Math.round(production.food.final * 10) / 10;
    },

    // Mettre à jour gameState
    updateGameState(production) {
        gameState.production = {
            goldPerTick: production.gold.final,
            foodPerTick: production.food.final,
            breakdown: production, // Stocker le détail pour l'affichage
            lastCalculated: Date.now(),
            perHour: {
                gold: production.gold.final * 12, // Si tick = 5 minutes
                food: production.food.final * 12
            }
        };
        
        // Déclencher un événement de mise à jour
        if (typeof Events !== 'undefined') {
            Events.trigger('productionUpdated', production);
        }
    },

    // Forcer le recalcul (quand des bâtiments sont ajoutés/supprimés)
    markDirty() {
        this.cache.dirty = true;
    },

    // Obtenir un résumé textuel de la production
    getSummary() {
        const prod = this.calculate();
        
        return {
            gold: {
                perTick: prod.gold.final,
                perHour: prod.gold.final * 12,
                breakdown: `Base: ${prod.gold.base}, Bâtiments: ${prod.gold.fromBuildings.toFixed(1)}, Bonus: ${prod.gold.bonuses.toFixed(1)}, Multi: ×${prod.gold.multipliers.toFixed(2)}`
            },
            food: {
                perTick: prod.food.final,
                perHour: prod.food.final * 12,
                breakdown: `Base: ${prod.food.base}, Bâtiments: ${prod.food.fromBuildings.toFixed(1)}, Bonus: ${prod.food.bonuses.toFixed(1)}, Multi: ×${prod.food.multipliers.toFixed(2)}`
            },
            efficiency: gameState.efficiency || 100,
            happiness: gameState.population.happiness || 100,
            season: this.getCurrentSeason()
        };
    },

    // Afficher un débug détaillé dans la console
    debug() {
        const prod = this.calculate();
        console.group("🧾 DEBUG PRODUCTION");
        console.log("💰 OR:");
        console.table({
            "Base": prod.gold.base,
            "Bâtiments": prod.gold.fromBuildings.toFixed(1),
            "Bonus": prod.gold.bonuses.toFixed(1),
            "Pénalités": prod.gold.penalties.toFixed(1),
            "Multiplicateur": prod.gold.multipliers.toFixed(2),
            "Brut": prod.gold.grossTotal.toFixed(1),
            "Final": prod.gold.final.toFixed(1)
        });
        console.log("🌾 NOURRITURE:");
        console.table({
            "Base": prod.food.base,
            "Bâtiments": prod.food.fromBuildings.toFixed(1),
            "Bonus": prod.food.bonuses.toFixed(1),
            "Pénalités": prod.food.penalties.toFixed(1),
            "Multiplicateur": prod.food.multipliers.toFixed(2),
            "Brut": prod.food.grossTotal.toFixed(1),
            "Final": prod.food.final.toFixed(1)
        });
        console.log("📊 FACTEURS:");
        console.table({
            "Saison": this.getCurrentSeason(),
            "Bonheur": gameState.population.happiness,
            "Efficience": gameState.efficiency,
            "Bâtiments totaux": gameState.buildings.length
        });
        console.groupEnd();
    },

    // Simulation de production pour X ticks (pour prévisions)
    simulate(ticks = 12) { // 12 ticks = 1 heure
        const currentProd = this.calculate();
        const simulation = {
            gold: [],
            food: [],
            totalGold: 0,
            totalFood: 0
        };
        
        for (let i = 1; i <= ticks; i++) {
            // Pour l'instant simple, mais pourrait inclure des variations aléatoires
            simulation.gold.push(currentProd.gold.final);
            simulation.food.push(currentProd.food.final);
            simulation.totalGold += currentProd.gold.final;
            simulation.totalFood += currentProd.food.final;
        }
        
        return simulation;
    }
};

// Initialisation
if (typeof gameState !== 'undefined') {
    // S'assurer que production existe dans gameState
    if (!gameState.production) {
        gameState.production = {
            goldPerTick: 0,
            foodPerTick: 0,
            breakdown: null
        };
    }
    
    // Calcul initial
    Production.calculate(true);
    
    console.log("✅ Module Production chargé");
}