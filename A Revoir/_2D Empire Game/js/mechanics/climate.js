// js/mechanics/climate.js - VERSION CORRIGÉE
const Climate = {
    CONFIG: {
        SEASONS: {
            spring: { months: [3, 4, 5],   icon: '🌸', name: 'Printemps' },
            summer: { months: [6, 7, 8],   icon: '☀️', name: 'Été' },
            autumn: { months: [9, 10, 11], icon: '🍂', name: 'Automne' },
            winter: { months: [12, 1, 2],  icon: '❄️', name: 'Hiver' }
        },
        
        // Multiplicateurs de production par saison
        PRODUCTION_MOD: {
            spring: { food: 1.2, gold: 1.0, stone: 1.0 },
            summer: { food: 1.5, gold: 1.1, stone: 1.1 },
            autumn: { food: 1.3, gold: 1.2, stone: 1.0 },
            winter: { food: 0.5, gold: 0.8, stone: 0.7 }
        },
        
        // Consommation par saison
        CONSUMPTION_MOD: {
            spring: 1.0,
            summer: 0.9,
            autumn: 1.0,
            winter: 1.3
        },
        
        // Événements météo - TRÈS RARES
        WEATHER_CHANCE: 0.005  // 0.5% par tick (était 8%)
    },
    
    state: {
        current: 'spring',
        previousSeason: null,
        temperature: 15,
        weatherEvent: null
    },
    
    modifiers: {
        food: 1,
        gold: 1,
        stone: 1,
        consumption: 1
    },
    
    // Compteurs pour éviter le spam
    tickCount: 0,
    initialized: false,
    lastSeasonNotification: 0,
    
    // Initialisation SANS notification
    init() {
        const month = gameState.date?.month || 3;
        
        // Définir la saison selon le mois SANS notifier
        if (month >= 3 && month <= 5) this.state.current = 'spring';
        else if (month >= 6 && month <= 8) this.state.current = 'summer';
        else if (month >= 9 && month <= 11) this.state.current = 'autumn';
        else this.state.current = 'winter';
        
        this.state.previousSeason = this.state.current;
        this.tickCount = 0;
        this.initialized = true;
        
        // Appliquer les modificateurs initiaux
        this.applySeasonalEffects();
        
        console.log(`🌤️ Climat initialisé - ${this.getSeasonName()}`);
    },
    
    // Mise à jour chaque tick
    update() {
        if (!this.initialized) return;
        
        this.tickCount++;
        
        // Attendre 15 ticks avant toute action
        if (this.tickCount < 15) return;
        
        this.checkSeasonChange();
        this.applySeasonalEffects();
        
        // Événements météo seulement après 60 ticks et très rares
        if (this.tickCount > 60) {
            this.checkWeatherEvents();
        }
    },
    
    // Vérifier le changement de saison
    checkSeasonChange() {
        const month = gameState.date?.month || 1;
        let newSeason = this.state.current;
        
        for (const [season, data] of Object.entries(this.CONFIG.SEASONS)) {
            if (data.months.includes(month)) {
                newSeason = season;
                break;
            }
        }
        
        // Changement de saison ?
        if (newSeason !== this.state.current) {
            this.onSeasonChange(newSeason);
        }
    },
    
    // Changement de saison - UNE SEULE notification
    onSeasonChange(newSeason) {
        // Éviter les notifications en double
        if (this.tickCount - this.lastSeasonNotification < 10) return;
        
        this.state.previousSeason = this.state.current;
        this.state.current = newSeason;
        this.lastSeasonNotification = this.tickCount;
        
        const seasonData = this.CONFIG.SEASONS[newSeason];
        
        // Notification simple
        if (typeof UI !== 'undefined' && UI.notify) {
            UI.notify(`${seasonData.icon} ${seasonData.name}`, "info");
        }
        
        // Avertissement avant l'hiver
        if (newSeason === 'autumn') {
            setTimeout(() => {
                if (typeof UI !== 'undefined' && UI.notify) {
                    UI.notify("🌾 Préparez des réserves pour l'hiver", "warning");
                }
            }, 3000);
        }
        
        // Fin d'hiver
        if (newSeason === 'spring' && this.state.previousSeason === 'winter') {
            const survivors = gameState.population?.current || 0;
            if (survivors > 0 && typeof UI !== 'undefined' && UI.notify) {
                UI.notify(`🌸 ${survivors} ont survécu à l'hiver`, "success");
            }
        }
    },
    
    // Appliquer effets saisonniers sur la production
    applySeasonalEffects() {
        const mods = this.CONFIG.PRODUCTION_MOD[this.state.current];
        const consMod = this.CONFIG.CONSUMPTION_MOD[this.state.current];
        
        if (!mods) return;
        
        this.modifiers = {
            food: mods.food,
            gold: mods.gold,
            stone: mods.stone,
            consumption: consMod
        };
    },
    
    // Événements météo TRÈS RARES
    checkWeatherEvents() {
        if (this.state.weatherEvent) return;
        if (Math.random() > this.CONFIG.WEATHER_CHANCE) return;
        
        const events = {
            spring: ['flood', 'lateFrost'],
            summer: ['drought', 'heatwave'],
            autumn: ['storm', 'earlyFrost'],
            winter: ['blizzard']
        };
        
        const possibleEvents = events[this.state.current] || [];
        if (possibleEvents.length === 0) return;
        
        const event = possibleEvents[Math.floor(Math.random() * possibleEvents.length)];
        this.triggerWeatherEvent(event);
    },
    
    // Déclencher événement météo
    triggerWeatherEvent(eventType) {
        const eventData = {
            flood:      { name: '🌊 Inondations', foodMod: 0.6, duration: 2 },
            lateFrost:  { name: '🥶 Gel tardif', foodMod: 0.7, duration: 1 },
            drought:    { name: '☀️ Sécheresse', foodMod: 0.5, duration: 3 },
            heatwave:   { name: '🔥 Canicule', foodMod: 0.8, goldMod: 0.9, duration: 2 },
            storm:      { name: '⛈️ Tempête', duration: 1 },
            earlyFrost: { name: '❄️ Gel précoce', foodMod: 0.6, duration: 1 },
            blizzard:   { name: '🌨️ Blizzard', foodMod: 0.4, goldMod: 0.7, duration: 2 }
        };
        
        const evt = eventData[eventType];
        if (!evt) return;
        
        this.state.weatherEvent = eventType;
        
        if (typeof UI !== 'undefined' && UI.notify) {
            UI.notify(evt.name, "warning");
        }
        
        // Appliquer les modificateurs temporaires
        if (evt.foodMod) this.modifiers.food *= evt.foodMod;
        if (evt.goldMod) this.modifiers.gold *= evt.goldMod;
        
        // Fin de l'événement après la durée
        setTimeout(() => {
            this.state.weatherEvent = null;
            this.applySeasonalEffects(); // Réinitialiser les modificateurs
        }, evt.duration * 10000);
    },
    
    // Getters
    getSeasonName() {
        return this.CONFIG.SEASONS[this.state.current]?.name || 'Inconnu';
    },
    
    getSeasonIcon() {
        return this.CONFIG.SEASONS[this.state.current]?.icon || '🌍';
    },
    
    getModifiers() {
        return { ...this.modifiers };
    },
    
    getReport() {
        return {
            season: this.getSeasonName(),
            icon: this.getSeasonIcon(),
            modifiers: this.getModifiers(),
            weatherEvent: this.state.weatherEvent
        };
    }
};

// Intégration avec Timer - PROTÉGÉE
if (typeof Timer !== 'undefined' && Timer.onTick) {
    const originalOnTick = Timer.onTick.bind(Timer);
    Timer.onTick = function() {
        originalOnTick();
        if (Climate.initialized) {
            Climate.update();
        }
    };
}

// Initialisation différée
window.addEventListener('load', () => {
    setTimeout(() => {
        Climate.init();
    }, 1000); // Attendre 1 seconde
});