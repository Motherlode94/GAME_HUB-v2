// js/mechanics/revolt.js
const Revolt = {
    chance: 0,

    check() {
        // La chance de révolte augmente si le bonheur est bas (< 30%)
        if (gameState.population.happiness < 30) {
            this.chance = (30 - gameState.population.happiness) / 100;
            
            // Si on a une armée, elle réduit les chances de révolte
            const suppression = gameState.army.soldiers * 0.05;
            this.chance = Math.max(0, this.chance - suppression);

            if (Math.random() < this.chance) {
                this.trigger();
            }
        }
    },

    trigger() {
        if (gameState.buildings.length > 0) {
            // Un bâtiment aléatoire est détruit
            const index = Math.floor(Math.random() * gameState.buildings.length);
            const destroyed = gameState.buildings.splice(index, 1)[0];
            
            UI.notify(`⚠️ RÉVOLTE ! Votre ${destroyed.name} a été détruite !`);
            State.calculateProduction(); // Recalculer les pertes
        } else {
            UI.notify("⚠️ ÉMEUTE ! La population manifeste dans les rues vides.");
        }
    }
};