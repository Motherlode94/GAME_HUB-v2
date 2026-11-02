let game = null;

function init() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Canvas non trouvé!');
        return;
    }
    
    game = new Game(canvas);
    game.start();
    
    // Connecter les boutons HTML aux fonctions du jeu
    setupButtonListeners();
    
    // Initialiser les boutons avec l'état correct
    updateButtonStates('mine');
    
    console.log('🎮 Minecraft 2D lancé!');
    console.log('Contrôles:');
    console.log('- QZSD ou Flèches: Déplacer');
    console.log('- Espace: Sauter');
    console.log('- Clic Gauche: Détruire bloc');
    console.log('- Clic Droit: Placer bloc');
    console.log('- E ou Molette: Changer de bloc');
    console.log('- R: Régénérer le monde');
    console.log('- ESC: Pause');
    console.log('- F3: Mode debug');
}

function setupButtonListeners() {
    // Bouton "Miner"
    const mineBtn = document.getElementById('mineBtn');
    if (mineBtn) {
        mineBtn.addEventListener('click', () => {
            if (game && game.player) {
                const mode = game.player.toggleMiningMode();
                updateButtonStates('mine');
                updateGameMode(mode);
            }
        });
    }
    
    // Bouton "Construire"
    const buildBtn = document.getElementById('buildBtn');
    if (buildBtn) {
        buildBtn.addEventListener('click', () => {
            if (game && game.player) {
                const mode = game.player.toggleBuildingMode();
                updateButtonStates('build');
                updateGameMode(mode);
            }
        });
    }
    
    // Bouton "Nouveau Monde"
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (game) {
                game.restart();
                console.log('🔄 Monde régénéré !');
                
                // Afficher une notification visuelle
                showNotification('🔄 Monde régénéré !');
            }
        });
        
        // Effet visuel au clic
        resetBtn.addEventListener('mousedown', () => {
            resetBtn.style.transform = 'translateY(2px)';
            resetBtn.style.boxShadow = '0 2px 0 rgba(0, 0, 0, 0.3)';
        });
        
        resetBtn.addEventListener('mouseup', () => {
            resetBtn.style.transform = 'translateY(0)';
            resetBtn.style.boxShadow = '0 4px 0 rgba(0, 0, 0, 0.3)';
        });
    }
    
    // Raccourci clavier R pour régénérer
    document.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'r' && game) {
            game.restart();
            showNotification('🔄 Monde régénéré !');
        }
    });
}

function updateButtonStates(activeMode) {
    const mineBtn = document.getElementById('mineBtn');
    const buildBtn = document.getElementById('buildBtn');
    
    if (mineBtn && buildBtn) {
        // Retirer toutes les classes active
        mineBtn.classList.remove('active');
        buildBtn.classList.remove('active');
        
        // Ajouter la classe active au bouton sélectionné
        if (activeMode === 'mine') {
            mineBtn.classList.add('active');
            mineBtn.style.background = 'linear-gradient(135deg, #ff5252 0%, #e74c3c 100%)';
            buildBtn.style.background = 'linear-gradient(135deg, #3a8cff 0%, #4a7fd9 100%)';
        } else if (activeMode === 'build') {
            buildBtn.classList.add('active');
            buildBtn.style.background = 'linear-gradient(135deg, #3a8cff 0%, #2c3eaa 100%)';
            mineBtn.style.background = 'linear-gradient(135deg, #ff5252 0%, #c0392b 100%)';
        }
    }
}

function updateGameMode(mode) {
    showNotification(mode === 'mine' ? '⛏️ Mode minage' : '🧱 Mode construction');
    
    // Mettre à jour le titre du menu de blocs si en mode construction
    const menuTitle = document.querySelector('.menu-title');
    if (menuTitle) {
        menuTitle.textContent = mode === 'mine' ? 'DESTRUCTION' : 'CONSTRUCTION';
        menuTitle.style.color = mode === 'mine' ? '#ff5252' : '#3a8cff';
    }
}

function showNotification(message) {
    // Créer une notification temporaire
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.85);
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 1000;
        font-family: var(--font-body);
        font-size: 18px;
        animation: fadeInOut 2s ease;
        border: 2px solid var(--color-accent);
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        text-shadow: 1px 1px 0 #000;
    `;
    
    // Ajouter l'animation CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeInOut {
            0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
            15% { opacity: 1; transform: translateX(-50%) translateY(0); }
            85% { opacity: 1; transform: translateX(-50%) translateY(0); }
            100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Supprimer après 2 secondes
    setTimeout(() => {
        notification.remove();
        style.remove();
    }, 2000);
}

// Initialiser quand la page est chargée
window.addEventListener('DOMContentLoaded', init);