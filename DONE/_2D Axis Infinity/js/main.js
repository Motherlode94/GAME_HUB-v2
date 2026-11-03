// main.js - Version finale
console.log('🚀 Chargement du jeu...');

// Vérification de tous les scripts
function checkScriptsLoaded() {
    console.log('📦 État du chargement :');
    console.log('1. EventEmitter:', typeof EventEmitter);
    console.log('2. Creature:', typeof Creature);
    console.log('3. BattleSystem:', typeof BattleSystem);
    console.log('4. UIController:', typeof UIController);
    console.log('5. GameManager:', typeof GameManager);
    console.log('6. CREATURE_TEMPLATES:', window.CREATURE_TEMPLATES?.length);
}

// Attendre que tout soit chargé
function initGame() {
    console.log('🔄 Initialisation en cours...');
    
    checkScriptsLoaded();
    
    // Créer l'instance de GameManager
    try {
        if (typeof GameManager === 'undefined') {
            console.warn('GameManager non chargé, réessai dans 500ms...');
            setTimeout(initGame, 500);
            return;
        }
        
        window.game = new GameManager();
        console.log('✅ Jeu prêt !');
    } catch (error) {
        console.error('❌ Erreur critique:', error);
        alert('Erreur lors du chargement du jeu. Voir console (F12)');
    }
}

// Démarrer quand tout est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initGame, 1000);
    });
} else {
    setTimeout(initGame, 1000);
}