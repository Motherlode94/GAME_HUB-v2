// ============================================================================
// SEASONS SYSTEM
// ============================================================================

const Seasons = {
    SPRING: {
        name: 'Spring',
        duration: 30, // jours
        color: '#90EE90',
        moodBonus: 5,
        effects: {
            energy: 1.1,
            social: 1.2,
            fun: 1.15,
            hygiene: 0.9
        },
        activities: ['gardening', 'picnic', 'outdoor_sports'],
        weather: ['sunny', 'rainy', 'mild']
    },
    SUMMER: {
        name: 'Summer',
        duration: 30,
        color: '#FFD700',
        moodBonus: 10,
        effects: {
            energy: 0.9,
            social: 1.3,
            fun: 1.3,
            hygiene: 0.8
        },
        activities: ['swimming', 'beach', 'barbecue', 'festivals'],
        weather: ['hot', 'sunny', 'clear']
    },
    AUTUMN: {
        name: 'Autumn',
        duration: 30,
        color: '#FF8C00',
        moodBonus: 0,
        effects: {
            energy: 1.0,
            social: 1.0,
            fun: 1.0,
            hygiene: 1.0
        },
        activities: ['hiking', 'harvest', 'reading'],
        weather: ['windy', 'rainy', 'cool']
    },
    WINTER: {
        name: 'Winter',
        duration: 30,
        color: '#87CEEB',
        moodBonus: -5,
        effects: {
            energy: 0.85,
            social: 0.9,
            fun: 0.9,
            hygiene: 1.1
        },
        activities: ['skiing', 'indoor_games', 'fireplace'],
        weather: ['cold', 'snowy', 'freezing']
    }
};

function SeasonSystem() {
    this.currentSeason = 'SPRING';
    this.dayInSeason = 1;
    this.seasonStartDay = 1;
    this.weather = 'sunny';
    this.temperature = 20; // Celsius
}

SeasonSystem.prototype.update = function() {
    const season = Seasons[this.currentSeason];
    this.dayInSeason = Time.day - this.seasonStartDay + 1;
    
    // Changer de saison si nécessaire
    if (this.dayInSeason > season.duration) {
        this.nextSeason();
    }
    
    // Mettre à jour la météo quotidiennement
    this.updateWeather();
};

SeasonSystem.prototype.nextSeason = function() {
    const order = ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'];
    const currentIndex = order.indexOf(this.currentSeason);
    const nextIndex = (currentIndex + 1) % order.length;
    
    this.currentSeason = order[nextIndex];
    this.seasonStartDay = Time.day;
    this.dayInSeason = 1;
    
    console.log(`🍂 Nouvelle saison: ${Seasons[this.currentSeason].name}`);
    
    return {
        type: 'season_change',
        season: this.currentSeason,
        timestamp: Time.current
    };
};

SeasonSystem.prototype.updateWeather = function() {
    const season = Seasons[this.currentSeason];
    const possibleWeather = season.weather;
    
    // Choisir aléatoirement parmi les météos possibles
    this.weather = possibleWeather[Math.floor(Math.random() * possibleWeather.length)];
    
    // Ajuster la température selon la saison
    const baseTemps = {
        'SPRING': 15,
        'SUMMER': 28,
        'AUTUMN': 12,
        'WINTER': 2
    };
    
    this.temperature = baseTemps[this.currentSeason] + (Math.random() * 10 - 5);
};

SeasonSystem.prototype.getEffects = function() {
    return Seasons[this.currentSeason].effects;
};

SeasonSystem.prototype.getMoodBonus = function() {
    let bonus = Seasons[this.currentSeason].moodBonus;
    
    // Ajustements selon la météo
    if (this.weather === 'sunny') bonus += 3;
    if (this.weather === 'rainy') bonus -= 2;
    if (this.weather === 'snowy') bonus += 2;
    if (this.weather === 'hot' && this.temperature > 35) bonus -= 5;
    if (this.weather === 'freezing' && this.temperature < 0) bonus -= 3;
    
    return bonus;
};

SeasonSystem.prototype.canDoActivity = function(activity) {
    const season = Seasons[this.currentSeason];
    
    // Activités extérieures difficiles en hiver
    const outdoorActivities = ['swimming', 'picnic', 'gardening', 'beach'];
    if (this.currentSeason === 'WINTER' && outdoorActivities.includes(activity)) {
        return Math.random() > 0.7; // 30% de chance en hiver
    }
    
    // Activités spécifiques à la saison
    if (season.activities.includes(activity)) {
        return true;
    }
    
    return true;
};

SeasonSystem.prototype.getSeasonalNeeds = function(needs) {
    const effects = this.getEffects();
    const modified = {};
    
    for (let need in needs) {
        modified[need] = needs[need];
        if (effects[need]) {
            modified[need] *= effects[need];
        }
    }
    
    return modified;
};

SeasonSystem.prototype.getInfo = function() {
    return {
        season: Seasons[this.currentSeason].name,
        day: this.dayInSeason,
        totalDays: Seasons[this.currentSeason].duration,
        weather: this.weather,
        temperature: Math.round(this.temperature),
        moodEffect: this.getMoodBonus()
    };
};

// Événements saisonniers spéciaux
SeasonSystem.prototype.checkSpecialEvent = function() {
    const season = this.currentSeason;
    const day = this.dayInSeason;
    
    // Événements fixes
    if (season === 'WINTER' && day === 25) {
        return { type: 'holiday', name: 'Winter Festival', moodBonus: 20 };
    }
    
    if (season === 'SPRING' && day === 1) {
        return { type: 'holiday', name: 'Spring Celebration', moodBonus: 15 };
    }
    
    if (season === 'SUMMER' && day === 15) {
        return { type: 'holiday', name: 'Summer Solstice', moodBonus: 10 };
    }
    
    if (season === 'AUTUMN' && day === 20) {
        return { type: 'holiday', name: 'Harvest Festival', moodBonus: 12 };
    }
    
    return null;
};

// Instance globale
const Season = new SeasonSystem();