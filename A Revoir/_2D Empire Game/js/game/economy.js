// js/mechanics/economy.js - SYSTÈME ÉCONOMIQUE RÉALISTE
const Economy = {
    // Configuration économique
    CONFIG: {
        // Inflation
        BASE_INFLATION: 0.001,        // 0.1% par tick de base
        MAX_INFLATION: 0.15,          // 15% max
        MIN_INFLATION: -0.05,         // Déflation -5% max
        
        // Classes sociales (% de revenus taxables)
        CLASSES: {
            peasants:  { taxRate: 0.05, income: 0.5,  spending: 0.8 },
            artisans:  { taxRate: 0.10, income: 1.5,  spending: 1.2 },
            merchants: { taxRate: 0.15, income: 3.0,  spending: 2.0 },
            nobles:    { taxRate: 0.20, income: 8.0,  spending: 5.0 }
        },
        
        // Commerce
        TRADE_MARGIN: 0.15,           // Marge commerciale 15%
        TRADE_RISK: 0.05,             // 5% risque de perte
        
        // Seuils économiques
        RECESSION_THRESHOLD: -0.02,
        PROSPERITY_THRESHOLD: 0.03
    },
    
    // État économique
    state: {
        inflation: 0,
        gdp: 0,
        previousGdp: 0,
        growth: 0,
        treasury: 0,
        debt: 0,
        interestRate: 0.05,
        tradeBalance: 0,
        economicHealth: 'stable' // recession, stable, prosperity
    },
    
    // Initialisation
    init() {
        this.state.treasury = gameState.resources.gold || 100;
        this.state.gdp = this.calculateGDP();
        this.state.previousGdp = this.state.gdp;
        console.log("💰 Système économique initialisé");
    },
    
    // Mise à jour chaque tick
    update() {
        this.updateInflation();
        this.collectTaxesByClass();
        this.processTradeRoutes();
        this.calculateGrowth();
        this.applyEconomicEffects();
        this.updateEconomicHealth();
    },
    
    // Calcul du PIB (simplifié)
    calculateGDP() {
        const pop = gameState.population.current || 10;
        const buildings = gameState.buildings.length || 1;
        const production = (gameState.production.goldPerTick || 1) + 
                          (gameState.production.foodPerTick || 1);
        
        return Math.round(pop * 2 + buildings * 10 + production * 5);
    },
    
    // Mise à jour de l'inflation
    updateInflation() {
        let inflationChange = 0;
        
        // Trop d'or en circulation = inflation
        const goldPerCapita = gameState.resources.gold / Math.max(1, gameState.population.current);
        if (goldPerCapita > 50) {
            inflationChange += (goldPerCapita - 50) * 0.0002;
        }
        
        // Pénurie de nourriture = inflation
        const foodRatio = gameState.resources.food / Math.max(1, gameState.population.current);
        if (foodRatio < 1) {
            inflationChange += (1 - foodRatio) * 0.005;
        }
        
        // Croissance économique rapide = légère inflation
        if (this.state.growth > 0.02) {
            inflationChange += this.state.growth * 0.1;
        }
        
        // Récession = déflation
        if (this.state.growth < -0.01) {
            inflationChange += this.state.growth * 0.2;
        }
        
        // Appliquer avec limites
        this.state.inflation += inflationChange;
        this.state.inflation = Math.max(
            this.CONFIG.MIN_INFLATION,
            Math.min(this.CONFIG.MAX_INFLATION, this.state.inflation)
        );
        
        // Retour naturel vers 0
        this.state.inflation *= 0.98;
    },
    
    // Collecte des taxes par classe sociale
    collectTaxesByClass() {
        if (!gameState.population.breakdown?.byType) return;
        
        const taxMultiplier = (Taxes?.currentRate || 10) / 100;
        let totalTaxes = 0;
        let happinessImpact = 0;
        
        Object.entries(this.CONFIG.CLASSES).forEach(([className, classData]) => {
            const count = gameState.population.breakdown.byType[className] || 0;
            if (count <= 0) return;
            
            // Revenu de base ajusté par l'inflation
            const adjustedIncome = classData.income * (1 - this.state.inflation);
            
            // Taxes collectées
            const classTax = count * adjustedIncome * classData.taxRate * taxMultiplier;
            totalTaxes += classTax;
            
            // Impact sur le bonheur (les riches tolèrent mieux les taxes)
            const taxBurden = taxMultiplier / classData.taxRate;
            happinessImpact -= taxBurden * 0.5 * (count / gameState.population.current);
        });
        
        // Appliquer les taxes
        gameState.resources.gold += Math.floor(totalTaxes);
        this.state.treasury = gameState.resources.gold;
        
        // Impact bonheur (limité)
        if (typeof gameState.population.happiness !== 'undefined') {
            gameState.population.happiness = Math.max(0, Math.min(100,
                gameState.population.happiness + Math.max(-2, happinessImpact)
            ));
        }
    },
    
    // Routes commerciales
    processTradeRoutes() {
        if (!gameState.diplomacy?.tradeAgreements) return;
        
        let tradeIncome = 0;
        const markets = gameState.buildings.filter(b => b.name === 'Marché').length;
        
        // Bonus par marché
        const tradeBonus = 1 + (markets * 0.2);
        
        // Commerce avec empires alliés
        if (typeof Diplomacy !== 'undefined') {
            Object.entries(Diplomacy.relations || {}).forEach(([empireId, relation]) => {
                if (relation.tradeAgreement) {
                    // Revenu basé sur l'opinion
                    const baseIncome = 5 * tradeBonus;
                    const opinionMultiplier = (relation.opinion || 50) / 100;
                    
                    // Risque de perte (pirates, bandits)
                    if (Math.random() > this.CONFIG.TRADE_RISK) {
                        tradeIncome += baseIncome * opinionMultiplier;
                    } else {
                        UI?.notify("⚠️ Convoi commercial attaqué !", "warning");
                    }
                }
            });
        }
        
        this.state.tradeBalance = tradeIncome;
        gameState.resources.gold += Math.floor(tradeIncome);
    },
    
    // Calcul de la croissance
    calculateGrowth() {
        this.state.previousGdp = this.state.gdp;
        this.state.gdp = this.calculateGDP();
        
        if (this.state.previousGdp > 0) {
            this.state.growth = (this.state.gdp - this.state.previousGdp) / this.state.previousGdp;
        }
    },
    
    // Effets économiques sur le jeu
    applyEconomicEffects() {
        // Inflation réduit le pouvoir d'achat (coûts de construction)
        if (this.state.inflation > 0.05) {
            // Les prix augmentent
            Object.values(Buildings.types).forEach(b => {
                b.currentCost = Math.round(b.cost * (1 + this.state.inflation));
            });
        }
        
        // Dette accumule des intérêts
        if (this.state.debt > 0) {
            const interest = this.state.debt * this.state.interestRate / 12;
            this.state.debt += interest;
            
            // Payer les intérêts
            if (gameState.resources.gold >= interest) {
                gameState.resources.gold -= Math.floor(interest);
            } else {
                // Dette impayée = crise
                this.triggerDebtCrisis();
            }
        }
    },
    
    // État de santé économique
    updateEconomicHealth() {
        if (this.state.growth < this.CONFIG.RECESSION_THRESHOLD) {
            this.state.economicHealth = 'recession';
        } else if (this.state.growth > this.CONFIG.PROSPERITY_THRESHOLD) {
            this.state.economicHealth = 'prosperity';
        } else {
            this.state.economicHealth = 'stable';
        }
    },
    
    // Crise de la dette
    triggerDebtCrisis() {
        UI?.notify("💸 CRISE DE LA DETTE ! Le peuple souffre.", "error");
        gameState.population.happiness = Math.max(0, (gameState.population.happiness || 50) - 15);
        
        // Risque de révolte accru
        if (typeof Revolt !== 'undefined') {
            Revolt.chance += 0.2;
        }
    },
    
    // Emprunter de l'or
    borrow(amount) {
        if (amount <= 0 || amount > 500) return false;
        
        gameState.resources.gold += amount;
        this.state.debt += amount;
        this.state.treasury = gameState.resources.gold;
        
        UI?.notify(`💰 Emprunt de ${amount} or (dette: ${Math.floor(this.state.debt)})`, "info");
        return true;
    },
    
    // Rembourser la dette
    repayDebt(amount) {
        const toRepay = Math.min(amount, this.state.debt, gameState.resources.gold);
        if (toRepay <= 0) return false;
        
        gameState.resources.gold -= toRepay;
        this.state.debt -= toRepay;
        this.state.treasury = gameState.resources.gold;
        
        UI?.notify(`✅ Remboursement de ${toRepay} or`, "success");
        return true;
    },
    
    // Rapport économique
    getReport() {
        return {
            gdp: this.state.gdp,
            growth: (this.state.growth * 100).toFixed(2) + '%',
            inflation: (this.state.inflation * 100).toFixed(2) + '%',
            treasury: Math.floor(this.state.treasury),
            debt: Math.floor(this.state.debt),
            tradeBalance: Math.floor(this.state.tradeBalance),
            health: this.state.economicHealth,
            healthIcon: this.state.economicHealth === 'prosperity' ? '📈' :
                       this.state.economicHealth === 'recession' ? '📉' : '📊'
        };
    }
};

// Intégration au Timer
if (typeof Timer !== 'undefined') {
    const originalOnTick = Timer.onTick.bind(Timer);
    Timer.onTick = function() {
        originalOnTick();
        Economy.update();
    };
}

// Initialisation au chargement
window.addEventListener('load', () => {
    setTimeout(() => Economy.init(), 500);
});