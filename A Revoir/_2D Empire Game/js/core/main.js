// js/core/main.js
const Game = {
    isRunning: false,
    lastFrameTime: 0,
    fps: 0,
    
    init() {
        console.log("🎮 Empire Game démarré...");
        
        try {
            // 1. Initialiser les systèmes de base
            this.initCoreSystems();
            
            // 2. Lancer la boucle de GESTION (Ticks de 1 seconde)
            requestAnimationFrame((time) => Timer.update(time));
            
            // 3. Lancer la boucle VISUELLE (Animation fluide)
            this.startGameLoop();
            
            this.isRunning = true;
            console.log("✅ Jeu initialisé avec succès");
            
        } catch (error) {
            console.error("❌ Erreur d'initialisation:", error);
            this.showError(error);
        }
    },
    
    initCoreSystems() {
        if (typeof GameUtils !== "undefined" && typeof GameUtils.ensureStateIntegrity === "function") {
            GameUtils.ensureStateIntegrity();
        }

        // Initialisation dans l'ordre de dépendance
        Map.init();
        
        // Initialiser State si disponible
        if (typeof State !== 'undefined' && State.init) {
            State.init();
        }
        
        // Initialiser Citizens si disponible
        if (typeof Citizens !== 'undefined' && Citizens.init) {
            Citizens.init();
        }
        
        // Mettre à jour l'UI
        UI.refresh();
        
        // Afficher un message de bienvenue
        UI.notify("Bienvenue dans Empire Manager 2D !", "success");
    },
    
    startGameLoop() {
        this.lastFrameTime = performance.now();
        requestAnimationFrame((time) => this.gameLoop(time));
    },
    
    gameLoop(currentTime) {
        // Calculer le deltaTime pour une animation fluide
        const deltaTime = Math.min((currentTime - this.lastFrameTime) / 16.67, 2.5); // ~60 FPS
        this.lastFrameTime = currentTime;
        
        // Calculer FPS (pour debug)
        this.calculateFPS(currentTime);
        
        try {
            // 1. Mettre à jour les citoyens avec deltaTime
            if (typeof Citizens !== 'undefined' && Citizens.update) {
                Citizens.update(deltaTime);
            }
            
            // 2. Redessiner la carte
            Map.draw();
            
            // 3. Afficher FPS en debug (optionnel)
            this.displayFPS();
            
        } catch (error) {
            console.error("❌ Erreur dans la gameLoop:", error);
        }
        
        // Continuer la boucle
        if (this.isRunning) {
            requestAnimationFrame((time) => this.gameLoop(time));
        }
    },


    calculateFPS(currentTime) {
        if (!this.frameTimes) {
            this.frameTimes = [];
            this.lastFpsUpdate = currentTime;
        }
        
        this.frameTimes.push(currentTime);
        
        // Garder seulement les 60 dernières frames
        while (this.frameTimes.length > 60) {
            this.frameTimes.shift();
        }
        
        // Mettre à jour le FPS toutes les secondes
        if (currentTime - this.lastFpsUpdate >= 1000) {
            if (this.frameTimes.length > 1) {
                this.fps = Math.round((this.frameTimes.length * 1000) / 
                                     (currentTime - this.frameTimes[0]));
            }
            this.lastFpsUpdate = currentTime;
            this.frameTimes = [currentTime];
        }
    },
    
    displayFPS() {
        // Optionnel: Afficher le FPS sur le canvas pour debug
        if (Game.debugMode && Map.ctx) {
            Map.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
            Map.ctx.fillRect(5, Map.canvas.height - 25, 80, 20);
            Map.ctx.fillStyle = "#2ecc71";
            Map.ctx.font = "12px Arial";
            Map.ctx.fillText(`FPS: ${this.fps}`, 10, Map.canvas.height - 10);
        }
    },
    
    showError(error) {
        // Afficher une erreur à l'utilisateur
        const errorHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #e74c3c;
                color: white;
                padding: 20px;
                border-radius: 8px;
                z-index: 10000;
                text-align: center;
                max-width: 500px;
            ">
                <h3>Erreur d'initialisation</h3>
                <p>${error.message || "Erreur inconnue"}</p>
                <button onclick="location.reload()" style="
                    background: white;
                    color: #e74c3c;
                    border: none;
                    padding: 10px 20px;
                    margin-top: 10px;
                    border-radius: 4px;
                    cursor: pointer;
                ">
                    Recharger la page
                </button>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', errorHTML);
    },
    
    // Fonctions de contrôle
    pause() {
        this.isRunning = false;
        if (typeof Timer !== 'undefined' && Timer.pause) {
            Timer.pause();
        }
        UI.notify("Jeu en pause", "info");
    },
    
    resume() {
        this.isRunning = true;
        this.lastFrameTime = performance.now();
        this.startGameLoop();
        
        if (typeof Timer !== 'undefined' && Timer.resume) {
            Timer.resume();
        }
        UI.notify("Jeu repris", "success");
    },
    
    togglePause() {
        if (this.isRunning) {
            this.pause();
        } else {
            this.resume();
        }
    },
    
    // Mode debug
    toggleDebug() {
        this.debugMode = !this.debugMode;
        console.log(`Mode debug: ${this.debugMode ? 'ON' : 'OFF'}`);
        UI.notify(`Debug ${this.debugMode ? 'activé' : 'désactivé'}`, "info");
        
        if (this.debugMode) {
            this.showDebugInfo();
        }
    },
    
    showDebugInfo() {
        console.log("=== DEBUG INFO ===");
        console.log("Game running:", this.isRunning);
        console.log("FPS:", this.fps);
        console.log("GameState:", gameState);
        console.log("Citizens:", Citizens ? Citizens.list.length : "N/A");
        console.log("Buildings:", gameState.buildings.length);
    }
};

// Ajouter des contrôles clavier
window.addEventListener('keydown', (e) => {
    switch(e.key) {
        case ' ':
        case 'p':
            // Espace ou P pour pause
            Game.togglePause();
            break;
        case 'd':
            // D pour debug
            if (e.ctrlKey) Game.toggleDebug();
            break;
        case 'g':
            // G pour changer le profil du gouverneur IA
            if (typeof EmpireGovernor !== 'undefined' && EmpireGovernor.cycleProfile) {
                EmpireGovernor.cycleProfile();
            }
            break;
        case '1':
            // 1-4 pour vitesse
            if (typeof Timer !== 'undefined') Timer.setSpeed(1);
            break;
        case '2':
            if (typeof Timer !== 'undefined') Timer.setSpeed(2);
            break;
        case '3':
            if (typeof Timer !== 'undefined') Timer.setSpeed(3);
            break;
        case '4':
            if (typeof Timer !== 'undefined') Timer.setSpeed(4);
            break;
    }
});

window.onload = () => Game.init();

// Exporter pour la console de debug
window.Game = Game;
