// js/mechanics/taxes.js
const Taxes = {
    currentRate: 10, // Pourcentage (10%)

    // Fonction appelée par le bouton dans index.html
    openMenu() {
        const newRate = prompt("Régler le taux d'imposition (0 - 100) :", this.currentRate);
        
        if (newRate !== null) {
            const val = parseInt(newRate);
            if (val >= 0 && val <= 100) {
                this.currentRate = val;
                this.applyEffect();
                UI.notify(`Taxes réglées à ${this.currentRate}%`);
            } else {
                UI.notify("Valeur invalide !");
            }
        }
    },

    applyEffect() {
        // Plus les taxes sont hautes, plus le bonheur baisse
        // Exemple : 10% taxes = 100 bonheur, 50% taxes = 60 bonheur
        gameState.population.happiness = 110 - this.currentRate;
        
        // On limite le bonheur entre 0 et 100
        if (gameState.population.happiness > 100) gameState.population.happiness = 100;
        if (gameState.population.happiness < 0) gameState.population.happiness = 0;
        
        UI.refresh();
    },

    // Cette fonction sera appelée par Ressources.update() chaque seconde
    collect() {
        // Gain = Population * Taux (ex: 10 pop * 0.10)
        const taxIncome = (gameState.population.total * (this.currentRate / 100));
        gameState.resources.gold += taxIncome;
    }
};