// Save and Load system for Empire Manager 2D

const SaveSystem = {
    // Save key for localStorage
    SAVE_KEY: 'empire_manager_save',
    
    // Current save version
    SAVE_VERSION: '1.0',
    
    // Initialize save system
    init: function() {
        console.log("Initializing save system...");
        this.setupSaveEvents();
        this.checkForAutoSave();
    },
    
    // Setup save-related events
    setupSaveEvents: function() {
        // Auto-save every 5 minutes
        setInterval(() => {
            if (GameState.autoSaveEnabled) {
                this.autoSave();
            }
        }, 5 * 60 * 1000); // 5 minutes
        
        // Warn before leaving if unsaved changes
        window.addEventListener('beforeunload', (e) => {
            if (GameState.unsavedChanges) {
                e.preventDefault();
                e.returnValue = 'Vous avez des modifications non sauvegardées. Quitter quand même?';
            }
        });
    },
    
    // Check for auto-save on load
    checkForAutoSave: function() {
        const autoSave = localStorage.getItem('empire_manager_autosave');
        if (autoSave) {
            if (confirm("Une sauvegarde automatique a été trouvée. Voulez-vous la charger?")) {
                this.loadGame(JSON.parse(autoSave));
            }
        }
    },
    
    // Save current game state
    saveGame: function(slot = 0, name = null) {
        try {
            const saveData = this.createSaveData();
            
            // Save to specified slot
            const saveName = name || `Partie ${new Date().toLocaleDateString('fr-FR')}`;
            const slotKey = `${this.SAVE_KEY}_slot_${slot}`;
            
            localStorage.setItem(slotKey, JSON.stringify({
                data: saveData,
                metadata: {
                    name: saveName,
                    date: new Date().toISOString(),
                    version: this.SAVE_VERSION,
                    playTime: GameState.playTime || 0,
                    empireName: GameState.empireName || "Mon Empire"
                }
            }));
            
            // Update saves list
            this.updateSavesList();
            
            GameState.unsavedChanges = false;
            Notification.show(`✅ Partie sauvegardée: "${saveName}"`, 'success');
            
            return true;
        } catch (error) {
            console.error("Save error:", error);
            Notification.show("❌ Erreur lors de la sauvegarde", 'error');
            return false;
        }
    },
    
    // Create save data from current game state
    createSaveData: function() {
        return {
            // Core game state
            resources: { ...GameState.resources },
            buildings: { ...GameState.buildings },
            army: { ...GameState.army },
            population: { ...GameState.population },
            
            // Game progress
            gameDate: GameState.gameDate,
            discoveredTiles: GameState.discoveredTiles || [],
            researchedTech: GameState.researchedTech || [],
            
            // Diplomacy
            diplomacy: {
                relations: { ...Diplomacy.relations },
                empires: [...Diplomacy.empires]
            },
            
            // Settings
            settings: {
                soundVolume: GameState.soundVolume || 0.5,
                musicVolume: GameState.musicVolume || 0.5,
                autoSave: GameState.autoSaveEnabled || true
            }
        };
    },
    
    // Load game from save slot
    loadGame: function(saveData) {
        try {
            if (!saveData || !saveData.data) {
                throw new Error("Données de sauvegarde invalides");
            }
            
            const data = saveData.data;
            const metadata = saveData.metadata;
            
            // Restore game state
            GameState.resources = data.resources;
            GameState.buildings = data.buildings;
            GameState.army = data.army;
            GameState.population = data.population;
            GameState.gameDate = data.gameDate;
            GameState.discoveredTiles = data.discoveredTiles || [];
            GameState.researchedTech = data.researchedTech || [];
            
            // Restore diplomacy
            if (data.diplomacy) {
                Diplomacy.relations = data.diplomacy.relations;
                Diplomacy.empires = data.diplomacy.empires;
            }
            
            // Restore settings
            if (data.settings) {
                GameState.soundVolume = data.settings.soundVolume;
                GameState.musicVolume = data.settings.musicVolume;
                GameState.autoSaveEnabled = data.settings.autoSave;
            }
            
            // Update UI
            UI.updateResourceDisplay();
            UI.updateBuildingDisplay();
            UI.updateDateDisplay();
            
            Notification.show(`✅ Partie chargée: "${metadata.name}"`, 'success');
            console.log(`Game loaded: ${metadata.name} (${metadata.date})`);
            
            return true;
        } catch (error) {
            console.error("Load error:", error);
            Notification.show("❌ Erreur lors du chargement de la sauvegarde", 'error');
            return false;
        }
    },
    
    // Auto-save current game
    autoSave: function() {
        try {
            const saveData = this.createSaveData();
            localStorage.setItem('empire_manager_autosave', JSON.stringify({
                data: saveData,
                metadata: {
                    date: new Date().toISOString(),
                    type: 'autosave'
                }
            }));
            console.log("Game auto-saved");
        } catch (error) {
            console.error("Auto-save error:", error);
        }
    },
    
    // Delete save from slot
    deleteSave: function(slot) {
        if (confirm("Supprimer cette sauvegarde?")) {
            const slotKey = `${this.SAVE_KEY}_slot_${slot}`;
            localStorage.removeItem(slotKey);
            this.updateSavesList();
            Notification.show("🗑️ Sauvegarde supprimée", 'info');
        }
    },
    
    // Get list of all saves
    getSaveSlots: function() {
        const saves = [];
        
        for (let i = 0; i < 10; i++) {
            const slotKey = `${this.SAVE_KEY}_slot_${i}`;
            const saveJson = localStorage.getItem(slotKey);
            
            if (saveJson) {
                try {
                    const saveData = JSON.parse(saveJson);
                    saves.push({
                        slot: i,
                        data: saveData,
                        metadata: saveData.metadata
                    });
                } catch (e) {
                    console.error(`Error parsing save slot ${i}:`, e);
                }
            }
        }
        
        return saves.sort((a, b) => 
            new Date(b.metadata.date) - new Date(a.metadata.date)
        );
    },
    
    // Update saves list display
    updateSavesList: function() {
        const saves = this.getSaveSlots();
        
        // Update UI if save menu is open
        const saveListElement = document.getElementById('saves-list');
        if (saveListElement) {
            saveListElement.innerHTML = saves.map(save => `
                <div class="save-slot">
                    <div class="save-info">
                        <h4>${save.metadata.name}</h4>
                        <small>${new Date(save.metadata.date).toLocaleString('fr-FR')}</small>
                        <small>Empire: ${save.metadata.empireName || "Mon Empire"}</small>
                        <small>Temps de jeu: ${Math.floor(save.metadata.playTime / 60)}h${save.metadata.playTime % 60}m</small>
                    </div>
                    <div class="save-actions">
                        <button onclick="SaveSystem.loadGame(${save.slot})">Charger</button>
                        <button onclick="SaveSystem.deleteSave(${save.slot})">Supprimer</button>
                    </div>
                </div>
            `).join('');
        }
    },
    
    // Export save to file
    exportSave: function(slot = 0) {
        const slotKey = `${this.SAVE_KEY}_slot_${slot}`;
        const saveJson = localStorage.getItem(slotKey);
        
        if (!saveJson) {
            Notification.show("Aucune sauvegarde à exporter", 'warning');
            return;
        }
        
        try {
            const saveData = JSON.parse(saveJson);
            const blob = new Blob([JSON.stringify(saveData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `empire_save_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            Notification.show("💾 Sauvegarde exportée", 'success');
        } catch (error) {
            console.error("Export error:", error);
            Notification.show("Erreur lors de l'export", 'error');
        }
    },
    
    // Import save from file
    importSave: function(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const saveData = JSON.parse(e.target.result);
                
                // Validate save data
                if (!saveData.data || !saveData.metadata) {
                    throw new Error("Format de fichier invalide");
                }
                
                // Ask for slot
                const slot = prompt("Dans quel slot sauvegarder? (0-9)", "0");
                if (slot !== null) {
                    const slotNum = parseInt(slot);
                    if (slotNum >= 0 && slotNum <= 9) {
                        const slotKey = `${this.SAVE_KEY}_slot_${slotNum}`;
                        localStorage.setItem(slotKey, JSON.stringify(saveData));
                        this.updateSavesList();
                        Notification.show("✅ Sauvegarde importée", 'success');
                    }
                }
            } catch (error) {
                console.error("Import error:", error);
                Notification.show("❌ Format de sauvegarde invalide", 'error');
            }
        };
        
        reader.readAsText(file);
    },
    
    // Open save/load menu
    openSaveMenu: function() {
        const saveMenuHTML = `
            <div class="save-modal" id="save-modal">
                <div class="modal-header">
                    <h2>💾 Sauvegarde</h2>
                    <button class="close-modal" onclick="this.closest('.save-modal').remove()">×</button>
                </div>
                <div class="save-tabs">
                    <button class="tab-btn active" onclick="SaveSystem.showTab('save')">Sauvegarder</button>
                    <button class="tab-btn" onclick="SaveSystem.showTab('load')">Charger</button>
                    <button class="tab-btn" onclick="SaveSystem.showTab('export')">Importer/Exporter</button>
                </div>
                <div class="save-content">
                    <div id="save-tab" class="tab-content active">
                        <h3>Sauvegarder la partie</h3>
                        <div class="save-slots">
                            ${Array.from({length: 10}, (_, i) => `
                                <div class="save-slot">
                                    <label for="save-name-${i}">Slot ${i}:</label>
                                    <input type="text" id="save-name-${i}" 
                                           placeholder="Nom de la sauvegarde" 
                                           value="Partie ${new Date().toLocaleDateString('fr-FR')}">
                                    <button onclick="SaveSystem.saveGame(${i}, document.getElementById('save-name-${i}').value)">
                                        Sauvegarder
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div id="load-tab" class="tab-content">
                        <h3>Charger une partie</h3>
                        <div id="saves-list" class="saves-list">
                            <!-- Saves will be loaded here -->
                        </div>
                    </div>
                    <div id="export-tab" class="tab-content">
                        <h3>Importer / Exporter</h3>
                        <div class="export-actions">
                            <button onclick="SaveSystem.exportSave(0)" class="btn-export">
                                💾 Exporter la sauvegarde
                            </button>
                            <div class="import-section">
                                <label for="import-file">Importer une sauvegarde:</label>
                                <input type="file" id="import-file" accept=".json" 
                                       onchange="SaveSystem.handleFileImport(this.files[0])">
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <label>
                        <input type="checkbox" ${GameState.autoSaveEnabled ? 'checked' : ''} 
                               onchange="GameState.autoSaveEnabled = this.checked">
                        Sauvegarde automatique (toutes les 5 minutes)
                    </label>
                </div>
            </div>
        `;
        
        // Remove existing modal if any
        const existingModal = document.getElementById('save-modal');
        if (existingModal) existingModal.remove();
        
        // Add new modal to body
        document.body.insertAdjacentHTML('beforeend', saveMenuHTML);
        
        // Load saves list
        this.updateSavesList();
    },
    
    // Show specific tab in save menu
    showTab: function(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.textContent.includes(tabName));
        });
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });
    },
    
    // Handle file import
    handleFileImport: function(file) {
        if (file) {
            this.importSave(file);
        }
    },
    
    // Reset game to initial state
    resetGame: function() {
        if (confirm("Êtes-vous sûr de vouloir réinitialiser le jeu? Toute progression non sauvegardée sera perdue.")) {
            localStorage.removeItem('empire_manager_autosave');
            location.reload();
        }
    }
};

// Initialize save system when game loads
window.addEventListener('load', () => {
    SaveSystem.init();
});

// Global save function for HTML button
function saveGame() {
    SaveSystem.openSaveMenu();
}