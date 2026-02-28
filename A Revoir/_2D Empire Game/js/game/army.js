// js/game/army.js - VERSION CORRIGÉE
const Army = {
    trainingCost: 20, // Coût en or par soldat
    foodPerSoldier: 0.2, // Nourriture consommée par soldat

    normalizeArmyState() {
        const soldiers = Math.max(0, Math.floor(Number(gameState.army.soldiers) || 0));
        gameState.army.soldiers = soldiers;
        gameState.army.total = soldiers;
        gameState.army.upkeep = soldiers * 0.5;
        gameState.population.current = Math.max(1, Number(gameState.population.current) || 1);
        gameState.population.total = gameState.population.current;
    },

    openMenu() {
        this.normalizeArmyState();
        // Vérifier si le joueur a une caserne
        const hasBarracks = gameState.buildings.some(b => b.name === 'Barracks');
        
        if (!hasBarracks) {
            UI.notify("Vous devez construire une Caserne d'abord !", "warning");
            return;
        }

        // Calculer le maximum recrutable
        const maxRecruitable = this.calculateMaxRecruitable();
        
        if (maxRecruitable <= 0) {
            if (gameState.population.current <= 5) {
                UI.notify("Population civile trop faible. Gardez au moins 5 civils.", "warning");
            } else {
                UI.notify(`Pas assez d'or. Nécessaire: ${this.trainingCost} Or par soldat.`, "warning");
            }
            return;
        }

        const count = prompt(
            `Recruter des soldats\n` +
            `• Coût: ${this.trainingCost} Or par soldat\n` +
            `• Maximum: ${maxRecruitable} soldats\n` +
            `• Population disponible: ${gameState.population.current - 5}\n\n` +
            `Combien voulez-vous recruter ?`,
            "1"
        );
        
        if (count !== null) {
            const num = parseInt(count);
            if (num > 0 && num <= maxRecruitable) {
                this.recruit(num);
            } else {
                UI.notify(`Nombre invalide. Maximum: ${maxRecruitable}`, "error");
            }
        }
    },

    calculateMaxRecruitable() {
        // Toujours garder au moins 5 civils pour faire fonctionner l'économie
        const availableCivilians = Math.max(0, gameState.population.current - 5);
        const affordableByGold = Math.floor(gameState.resources.gold / this.trainingCost);
        
        return Math.min(availableCivilians, affordableByGold);
    },

    recruit(amount) {
        this.normalizeArmyState();
        const totalCost = amount * this.trainingCost;

        if (gameState.resources.gold >= totalCost) {
            // Vérifier qu'on garde assez de civils
            if (amount > gameState.population.current - 5) {
                UI.notify("Impossible de recruter. Gardez au moins 5 civils.", "error");
                return;
            }

            gameState.resources.gold -= totalCost;
            
            // CORRECTION IMPORTANTE : Mettre à jour TOUTES les propriétés de population
            gameState.population.current -= amount;
            gameState.population.total = gameState.population.current; // Synchroniser
            gameState.population.workers = Math.floor(gameState.population.current * 0.7);
            
            // Ajouter aux soldats
            gameState.army.soldiers += amount;
            gameState.army.total = gameState.army.soldiers;
            
            // Calculer l'entretien
            gameState.army.upkeep = gameState.army.soldiers * 0.5;
            
            UI.notify(
                `${amount} soldats recrutés !\n` +
                `• -${totalCost} Or\n` +
                `• -${amount} citoyens\n` +
                `• Entretien: +${gameState.army.upkeep} Or/mois`,
                "success"
            );
            
            // CORRECTION : Retirer des citoyens visuels
            this.removeCitizensForArmy(amount);
            
            // Mettre à jour les calculs de production
            if (typeof State !== 'undefined' && State.calculateProduction) {
                State.calculateProduction();
            }
            
            UI.refresh();
        } else {
            UI.notify(
                `Pas assez d'or. Nécessaire: ${totalCost}, Disponible: ${gameState.resources.gold}`,
                "error"
            );
        }
    },

    // Fonction pour retirer des citoyens visuels
    removeCitizensForArmy(amount) {
        if (typeof Citizens === 'undefined') return;
        
        let removed = 0;
        
        // 1. D'abord retirer les citoyens sans travail spécifique
        const idleCitizens = Citizens.list.filter(c => !c.workplace);
        
        for (let i = 0; i < Math.min(amount, idleCitizens.length); i++) {
            const index = Citizens.list.indexOf(idleCitizens[i]);
            if (index > -1) {
                Citizens.list.splice(index, 1);
                removed++;
            }
        }
        
        // 2. Si pas assez, retirer d'autres citoyens
        const remaining = amount - removed;
        if (remaining > 0) {
            // Retirer les citoyens les plus éloignés de leur maison
            const sortedCitizens = [...Citizens.list].sort((a, b) => {
                const distA = a.home ? Math.hypot(a.gridX - a.home.x, a.gridY - a.home.y) : 0;
                const distB = b.home ? Math.hypot(b.gridX - b.home.x, b.gridY - b.home.y) : 0;
                return distB - distA; // Les plus éloignés d'abord
            });
            
            for (let i = 0; i < remaining && i < sortedCitizens.length; i++) {
                const index = Citizens.list.indexOf(sortedCitizens[i]);
                if (index > -1) {
                    Citizens.list.splice(index, 1);
                    removed++;
                }
            }
        }
        
        console.log(`${removed} citoyens visuels retirés pour l'armée`);
    },

    // Licencier des soldats (retour à la vie civile)
    disband(amount) {
        this.normalizeArmyState();
        if (amount <= 0 || gameState.army.soldiers <= 0) return;
        
        const actualAmount = Math.min(amount, gameState.army.soldiers);
        
        gameState.army.soldiers -= actualAmount;
        gameState.army.total = gameState.army.soldiers;
        gameState.population.current += actualAmount;
        gameState.population.total = gameState.population.current;
        gameState.population.workers = Math.floor(gameState.population.current * 0.7);
        gameState.army.upkeep = gameState.army.soldiers * 0.5;
        
        // Recréer des citoyens visuels
        if (typeof Citizens !== 'undefined') {
            for (let i = 0; i < actualAmount; i++) {
                Citizens.createCitizen(); // Au château
            }
        }
        
        UI.notify(
            `${actualAmount} soldats licenciés.\n` +
            `Ils retournent à la vie civile.`,
            "info"
        );
        
        if (typeof State !== 'undefined' && State.calculateProduction) {
            State.calculateProduction();
        }
        
        UI.refresh();
    },

    // Entretien de l'armée (à appeler chaque tick)
    updateUpkeep() {
        this.normalizeArmyState();
        if (gameState.army.soldiers <= 0) return true;
        
        const totalUpkeep = gameState.army.upkeep || (gameState.army.soldiers * 0.5);
        
        if (gameState.resources.gold >= totalUpkeep) {
            gameState.resources.gold -= totalUpkeep;
            return true;
        } else {
            // Pas assez d'or - certains soldats désertent
            const deficit = totalUpkeep - gameState.resources.gold;
            const soldiersToDisband = Math.min(
                Math.ceil(deficit / 0.5),
                gameState.army.soldiers
            );
            
            this.disband(soldiersToDisband);
            UI.notify(
                `Pas assez d'or pour payer l'armée !\n` +
                `${soldiersToDisband} soldats désertent.`,
                "warning"
            );
            return false;
        }
    },

    // Obtenir des statistiques
    getStats() {
        this.normalizeArmyState();
        return {
            soldiers: gameState.army.soldiers,
            upkeep: gameState.army.upkeep || 0,
            trainingCost: this.trainingCost,
            foodConsumption: gameState.army.soldiers * this.foodPerSoldier,
            effectiveness: this.calculateEffectiveness()
        };
    },

    calculateEffectiveness() {
        this.normalizeArmyState();
        if (gameState.army.soldiers <= 0) return 0;
        
        let effectiveness = 1.0;
        
        // Bonus si bonheur élevé
        if (gameState.population.happiness > 70) effectiveness *= 1.2;
        
        // Malus si nourriture faible
        if (gameState.resources.food < gameState.army.soldiers * 5) effectiveness *= 0.7;
        
        return Math.round(effectiveness * 100);
    }
};
