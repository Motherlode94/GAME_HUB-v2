// js/core/timer.js
const Timer = {
    lastTick: 0,
    tickLength: 1000, // 1 tick = 1 seconde
    isPaused: false,
    speedMultiplier: 1,

    update(currentTime) {
        if (!this.lastTick) this.lastTick = currentTime;
        const delta = currentTime - this.lastTick;

        if (delta >= this.tickLength / this.speedMultiplier && !this.isPaused) {
            this.lastTick = currentTime;
            this.onTick();
        }
        
        requestAnimationFrame((time) => this.update(time));
    },

    onTick() {
        if (typeof GameUtils !== "undefined" && typeof GameUtils.ensureStateIntegrity === "function") {
            GameUtils.ensureStateIntegrity();
        }
        
        // 1. MISE À JOUR DU TEMPS
        if (!this.tickCounter) this.tickCounter = 0;
        this.tickCounter++;
        
        if (this.tickCounter >= 15) {
            this.tickCounter = 0;
            gameState.date.month++;
            if (gameState.date.month > 12) {
                gameState.date.month = 1;
                gameState.date.year++;
            }
        }
        
        // 2. LOGIQUE DE CONSTRUCTION (doit être en premier)
        Buildings.updateConstruction();
        
        // 3. MISE À JOUR DE LA POPULATION
        if (typeof Population !== 'undefined') {
            Population.update();
        } else {
            this.updatePopulationBasic();
        }
        
        // 4. CALCUL DE LA PRODUCTION (UNE SEULE FOIS !)
        // CHOISISSEZ UN SEUL SYSTÈME :
        if (typeof State !== 'undefined' && State.calculateProduction) {
            State.calculateProduction(); // Système avancé
        } else if (typeof Production !== 'undefined') {
            Production.calculate(); // Système simple
        }
        
        // 5. GESTION DES RESSOURCES (production + consommation)
        if (typeof Ressources !== 'undefined') {
            Ressources.update();
        }
        
        // 6. PRÉLÈVEMENT DES TAXES
        if (typeof Taxes !== 'undefined') {
            Taxes.collect();
        }
        
        // 7. GESTION DU BONHEUR
        if (typeof Happiness !== 'undefined') {
            Happiness.update();
        }
        
        // 8. VÉRIFICATION DES RÉVOLTES
        if (typeof Revolt !== 'undefined') {
            Revolt.check();
        }
        
        // 9. GESTION DE L'ARMÉE
        
        
        if (typeof EmpireGovernor !== 'undefined' && EmpireGovernor.update) {
            EmpireGovernor.update();
        }

        // 10. SYNCHRONISATION DES CITOYENS VISUELS
        if (typeof Citizens !== 'undefined') {
            Citizens.syncWithPopulation();
        }
        
        // 11. MISE À JOUR DE L'INTERFACE
        UI.refresh();
        if (UI.updateBuildButtons) {
            UI.updateBuildButtons();
        }
        
        // 12. MISE À JOUR DE LA CARTE
        Map.draw();
        
        // 13. MISE À JOUR DE LA DATE DANS L'UI
        UI.updateDate();
        
    },
    
    // Version basique si Population n'existe pas
    updatePopulationBasic() {
        // Calculer capacité maximale
        const houses = gameState.buildings.filter(b => b.name === 'Maison').length;
        const castle = gameState.buildings.filter(b => b.name === 'Château').length;
        let maxPop = castle * 10 + houses * 5;
        
        gameState.buildings.forEach(b => {
            if (b.name === 'Maison') {
                maxPop += (b.level || 1) - 1;
            }
        });
        
        gameState.population.maxPop = Math.max(10, maxPop);
        
        // Calculer ouvriers
        gameState.population.workers = Math.floor(gameState.population.current * 0.7);
        gameState.population.total = gameState.population.current;
    },
    
    // Contrôles de vitesse
    pause() {
        this.isPaused = true;
    },
    
    resume() {
        this.isPaused = false;
    },
    
    setSpeed(multiplier) {
        this.speedMultiplier = Math.max(0.25, Math.min(4, multiplier));
        
        // Mettre à jour l'UI si un élément existe
        const speedDisplay = document.getElementById('game-speed');
        if (speedDisplay) {
            speedDisplay.innerText = `Vitesse: ${this.speedMultiplier}x`;
        }
    },
    
    increaseSpeed() {
        this.setSpeed(this.speedMultiplier * 2);
    },
    
    decreaseSpeed() {
        this.setSpeed(this.speedMultiplier / 2);
    },
    
    // Obtenir l'état du timer
    getStatus() {
        return {
            isPaused: this.isPaused,
            speed: this.speedMultiplier,
            lastTick: this.lastTick,
            tickLength: this.tickLength
        };
    }
};
