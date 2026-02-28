// ============================================================================
// AGING SYSTEM
// ============================================================================

const AgeStages = {
    BABY: { min: 0, max: 2, name: 'Baby' },
    CHILD: { min: 2, max: 13, name: 'Child' },
    TEEN: { min: 13, max: 18, name: 'Teen' },
    YOUNG_ADULT: { min: 18, max: 30, name: 'Young Adult' },
    ADULT: { min: 30, max: 50, name: 'Adult' },
    MIDDLE_AGED: { min: 50, max: 65, name: 'Middle Aged' },
    SENIOR: { min: 65, max: 80, name: 'Senior' },
    ELDER: { min: 80, max: 120, name: 'Elder' }
};

function AgingSystem() {
    this.characters = {}; // charId -> aging data
    this.yearsPerDay = 0.1; // 1 jour de jeu = 0.1 année
}

AgingSystem.prototype.register = function(charId, initialAge = 20) {
    this.characters[charId] = {
        age: initialAge,
        birthDay: Time.day,
        birthTick: Time.current,
        lastBirthday: initialAge,
        lifeExpectancy: this.calculateLifeExpectancy(),
        aging: {
            speed: 1.0,
            modifiers: []
        }
    };
};

AgingSystem.prototype.calculateLifeExpectancy = function() {
    // Aléatoire entre 60 et 90 ans
    return 60 + Math.random() * 30;
};

AgingSystem.prototype.update = function(charId) {
    const data = this.characters[charId];
    if (!data) return;
    
    // Calculer l'âge actuel
    const daysPassed = Time.day - data.birthDay;
    const ageGained = daysPassed * this.yearsPerDay * data.aging.speed;
    data.age = data.lastBirthday + ageGained;
    
    // Vérifier si c'est un anniversaire
    if (Math.floor(data.age) > Math.floor(data.lastBirthday)) {
        this.onBirthday(charId);
    }
};

AgingSystem.prototype.onBirthday = function(charId) {
    const data = this.characters[charId];
    data.lastBirthday = Math.floor(data.age);
    
    console.log(`🎂 ${charId} a maintenant ${data.lastBirthday} ans!`);
    
    return {
        type: 'birthday',
        character: charId,
        age: data.lastBirthday,
        stage: this.getStage(charId),
        timestamp: Time.current
    };
};

AgingSystem.prototype.getAge = function(charId) {
    const data = this.characters[charId];
    return data ? Math.floor(data.age) : 0;
};

AgingSystem.prototype.getStage = function(charId) {
    const age = this.getAge(charId);
    
    for (let key in AgeStages) {
        const stage = AgeStages[key];
        if (age >= stage.min && age < stage.max) {
            return stage.name;
        }
    }
    return AgeStages.ELDER.name;
};

AgingSystem.prototype.getAgeModifiers = function(charId) {
    const stage = this.getStage(charId);
    const age = this.getAge(charId);
    const data = this.characters[charId];
    
    const modifiers = {
        energy: 1.0,
        social: 1.0,
        learning: 1.0,
        speed: 1.0,
        strength: 1.0,
        deathRisk: 0.0
    };
    
    switch(stage) {
        case 'Baby':
            modifiers.energy = 0.5;
            modifiers.social = 0.3;
            modifiers.learning = 2.0;
            modifiers.speed = 0.3;
            modifiers.strength = 0.2;
            break;
            
        case 'Child':
            modifiers.energy = 1.5;
            modifiers.social = 0.8;
            modifiers.learning = 1.5;
            modifiers.speed = 0.8;
            modifiers.strength = 0.6;
            break;
            
        case 'Teen':
            modifiers.energy = 1.3;
            modifiers.social = 1.2;
            modifiers.learning = 1.3;
            modifiers.speed = 1.0;
            modifiers.strength = 0.8;
            break;
            
        case 'Young Adult':
            modifiers.energy = 1.2;
            modifiers.social = 1.1;
            modifiers.learning = 1.0;
            modifiers.speed = 1.1;
            modifiers.strength = 1.2;
            break;
            
        case 'Adult':
            modifiers.energy = 1.0;
            modifiers.social = 1.0;
            modifiers.learning = 0.9;
            modifiers.speed = 1.0;
            modifiers.strength = 1.0;
            break;
            
        case 'Middle Aged':
            modifiers.energy = 0.9;
            modifiers.social = 1.1;
            modifiers.learning = 0.8;
            modifiers.speed = 0.9;
            modifiers.strength = 0.9;
            modifiers.deathRisk = 0.01;
            break;
            
        case 'Senior':
            modifiers.energy = 0.7;
            modifiers.social = 1.0;
            modifiers.learning = 0.6;
            modifiers.speed = 0.7;
            modifiers.strength = 0.7;
            modifiers.deathRisk = 0.05;
            break;
            
        case 'Elder':
            modifiers.energy = 0.5;
            modifiers.social = 0.8;
            modifiers.learning = 0.4;
            modifiers.speed = 0.5;
            modifiers.strength = 0.5;
            modifiers.deathRisk = 0.15;
            break;
    }
    
    // Risque de mort augmente après l'espérance de vie
    if (data && age > data.lifeExpectancy) {
        const yearsOver = age - data.lifeExpectancy;
        modifiers.deathRisk += yearsOver * 0.05;
    }
    
    return modifiers;
};

AgingSystem.prototype.checkNaturalDeath = function(charId) {
    const modifiers = this.getAgeModifiers(charId);
    
    // Chance de mort naturelle basée sur l'âge
    if (Math.random() < modifiers.deathRisk / 1000) { // Par tick
        return {
            type: 'natural_death',
            character: charId,
            age: this.getAge(charId),
            cause: 'old_age',
            timestamp: Time.current
        };
    }
    
    return null;
};

AgingSystem.prototype.canDoActivity = function(charId, activity) {
    const stage = this.getStage(charId);
    
    const restrictions = {
        'Baby': ['work', 'romance', 'complex_tasks'],
        'Child': ['work', 'romance', 'drive'],
        'Teen': ['work'],
        'Elder': ['sports', 'heavy_work']
    };
    
    if (restrictions[stage] && restrictions[stage].includes(activity)) {
        return false;
    }
    
    return true;
};

// Instance globale
const Aging = new AgingSystem();