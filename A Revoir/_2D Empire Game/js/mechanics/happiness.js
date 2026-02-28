// js/mechanics/happiness.js
const Happiness = {
    // Coefficients (facilement modifiables / équilibrables)
    CONFIG: {
        FAMINE_PENALTY_PER_TICK:      -1.8,    // -2 était très violent
        STARVATION_PENALTY_PER_TICK:  -3.5,    // quand ça fait plusieurs tours à 0
        ABUNDANCE_BONUS_PER_TICK:      +0.4,   // plus doux et progressif
        FOOD_SATISFACTION_THRESHOLD:   1.15,   // 115% → petit bonus
        FOOD_DEFICIT_THRESHOLD:        0.85,   // < 85% → malus léger
        
        NATURAL_DECAY_SPEED:           0.15,   // lente dérive vers 50
        NATURAL_MIDPOINT:              50,
        
        MAX_CHANGE_PER_TICK:           2.5     // limite la volatilité
    },

    update() {
        let happiness = gameState.population.happiness;
        const pop = gameState.population.total;
        const food = gameState.resources.food;
        
        if (pop <= 0) return; // sécurité

        const foodPerPerson = food / pop;
        let delta = 0;

        // 1. Effet nourriture (zone principale d'influence)
        if (food <= 0) {
            delta += this.CONFIG.STARVATION_PENALTY_PER_TICK;
        } else if (foodPerPerson <= this.CONFIG.FOOD_DEFICIT_THRESHOLD) {
            // Malus progressif quand on descend sous ~85%
            const deficitRatio = (this.CONFIG.FOOD_DEFICIT_THRESHOLD - foodPerPerson) 
                               / this.CONFIG.FOOD_DEFICIT_THRESHOLD;
            delta += -1.6 * deficitRatio;
        } else if (foodPerPerson >= this.CONFIG.FOOD_SATISFACTION_THRESHOLD) {
            // Bonus décroissant (diminishing returns)
            const surplusRatio = (foodPerPerson - 1) / (foodPerPerson);
            delta += this.CONFIG.ABUNDANCE_BONUS_PER_TICK * Math.min(1.8, surplusRatio * 3);
        }

        // 2. Légère dérive naturelle vers le point d'équilibre (50)
        const distanceToMid = happiness - this.CONFIG.NATURAL_MIDPOINT;
        delta -= distanceToMid * this.CONFIG.NATURAL_DECAY_SPEED;

        // 3. Limitation de la variation par tick (évite les montagnes russes)
        delta = Math.max(-this.CONFIG.MAX_CHANGE_PER_TICK, 
                        Math.min(this.CONFIG.MAX_CHANGE_PER_TICK, delta));

        // 4. Application + bornes finales
        happiness += delta;
        happiness = Math.max(0, Math.min(100, happiness));

        gameState.population.happiness = Math.round(happiness * 10) / 10; // 1 décimale
    },

    // Optionnel : debug helper
    getFoodStatusText() {
        const ratio = gameState.resources.food / gameState.population.total;
        if (ratio <= 0) return "Famine critique !";
        if (ratio < 0.85) return "Pénurie alimentaire";
        if (ratio < 1) return "Rations réduites";
        if (ratio < 1.15) return "Nourris correctement";
        if (ratio < 2) return "Repus";
        return "Abondance exceptionnelle";
    }
};