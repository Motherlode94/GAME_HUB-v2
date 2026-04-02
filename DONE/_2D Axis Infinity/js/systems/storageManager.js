/**
 * ============================================
 * STORAGE MANAGER
 * Handles localStorage operations for scores and settings
 * ============================================
 */
// Singleton global
const storage = (function() {
    const _cache = new Map();

    // ==========================================
    // BEST SCORES
    // ==========================================

    function getBestScores() {
        if (_cache.has('bestScores')) {
            return _cache.get('bestScores');
        }

        try {
            const saved = localStorage.getItem(STORAGE_KEYS.BEST_SCORES);
            const scores = saved ? JSON.parse(saved) : _getDefaultScores();
            _cache.set('bestScores', scores);
            return scores;
        } catch (error) {
            console.error('Error loading best scores:', error);
            return _getDefaultScores();
        }
    }

    function _getDefaultScores() {
        const scores = {};
        Object.keys(DIFFICULTY_LEVELS).forEach(key => {
            scores[key] = 0;
        });
        return scores;
    }

    function saveScore(difficulty, rounds) {
        const scores = getBestScores();
        
        if (rounds > (scores[difficulty] || 0)) {
            scores[difficulty] = rounds;
            
            try {
                localStorage.setItem(STORAGE_KEYS.BEST_SCORES, JSON.stringify(scores));
                _cache.set('bestScores', scores);
                return true;
            } catch (error) {
                console.error('Error saving best score:', error);
                return false;
            }
        }
        
        return false;
    }

    function getBestScore(difficulty) {
        const scores = getBestScores();
        return scores[difficulty] || 0;
    }

    // ==========================================
    // SETTINGS
    // ==========================================

    function getSettings() {
        if (_cache.has('settings')) {
            return _cache.get('settings');
        }

        try {
            const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
            const settings = saved ? JSON.parse(saved) : _getDefaultSettings();
            _cache.set('settings', settings);
            return settings;
        } catch (error) {
            console.error('Error loading settings:', error);
            return _getDefaultSettings();
        }
    }

    function _getDefaultSettings() {
        return {
            soundEnabled: true,
            musicEnabled: true,
            animationsEnabled: true,
            lastDifficulty: 'normal'
        };
    }

    function saveSettings(settings) {
        try {
            const current = getSettings();
            const updated = { ...current, ...settings };
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
            _cache.set('settings', updated);
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    function updateSetting(key, value) {
        const settings = getSettings();
        settings[key] = value;
        saveSettings(settings);
    }

    // ==========================================
    // CACHE MANAGEMENT
    // ==========================================

    function clearCache() {
        _cache.clear();
    }

    function clearAll() {
        try {
            localStorage.removeItem(STORAGE_KEYS.BEST_SCORES);
            localStorage.removeItem(STORAGE_KEYS.SETTINGS);
            _cache.clear();
        } catch (error) {
            console.error('Error clearing storage:', error);
        }
    }

    // Exposition globale
    return {
        getBestScores,
        saveScore,
        getBestScore,
        getSettings,
        saveSettings,
        updateSetting,
        clearCache,
        clearAll
    };
})();

// Rendre accessible globalement
window.storage = storage;
console.log('✅ StorageManager chargé et prêt (window.storage)');