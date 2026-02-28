// Point d'entrée principal - Blood Eclipse

let game = null;
let lastTime = 0;

function init() {
    const canvas = document.getElementById('gameCanvas');
    
    if (!canvas) {
        console.error('Canvas non trouvé !');
        return;
    }
    
    game = new Game(canvas);
    
    // Event listeners pour les boutons
    document.getElementById('restart-btn').addEventListener('click', () => {
        game.restart();
    });
    
    document.getElementById('continue-btn').addEventListener('click', () => {
        game.hideLevelUp();
    });
    
    // Démarrer la boucle de jeu
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
    
    console.log('Blood Eclipse - Awakened Hunter initialisé !');
}

function gameLoop(currentTime) {
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    
    // Limiter le deltaTime pour éviter les bugs lors des lags
    const clampedDelta = Math.min(deltaTime, 100);
    
    game.update(clampedDelta);
    game.draw();
    
    requestAnimationFrame(gameLoop);
}

// Attendre que le DOM soit chargé
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}