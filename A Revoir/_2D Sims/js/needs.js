function Needs() {
    // Besoins physiques
    this.energy = 100;      // Fatigue
    this.hunger = 0;        // Faim (0 = rassasié, 100 = affamé)
    this.thirst = 0;        // Soif
    this.bladder = 0;       // Vessie (0 = vide, 100 = urgent)
    this.hygiene = 100;     // Hygiène (100 = propre, 0 = sale)
    
    // Besoins sociaux/mentaux
    this.social = 50;       // Besoin social (0 = isolé, 100 = comblé)
    this.fun = 50;          // Amusement (0 = ennuyé, 100 = amusé)
    this.comfort = 50;      // Confort physique
    this.environment = 50;  // Qualité de l'environnement
    
    // État général
    this.mood = 50;         // Humeur générale (calculée)
}

Needs.prototype.update = function(character) {
    // Décrémente l'énergie (ralenti x10)
    let energyDecay = 0.0015;
    if (character.traits && character.traits.includes('lazy')) {
        energyDecay *= 0.7;
    }
    if (character.traits && character.traits.includes('active')) {
        energyDecay *= 1.3;
    }
    this.energy = Math.max(0, this.energy - energyDecay);
    
    // Augmente la faim (ralenti x10)
    let hungerDecay = 0.002;
    if (character.traits && character.traits.includes('foodie')) {
        hungerDecay *= 1.2;
    }
    this.hunger = Math.min(100, this.hunger + hungerDecay);
    
    // Augmente la soif (ralenti x10)
    this.thirst = Math.min(100, this.thirst + 0.0025);
    
    // Augmente le besoin de toilettes (ralenti x10)
    this.bladder = Math.min(100, this.bladder + 0.003);
    
    // Diminue l'hygiène (ralenti x10)
    let hygieneDecay = 0.001;
    if (character.traits && character.traits.includes('neat')) {
        hygieneDecay *= 0.5;
    }
    this.hygiene = Math.max(0, this.hygiene - hygieneDecay);
    
    // Diminue le besoin social (ralenti x10)
    let socialDecay = 0.0015;
    if (character.traits && character.traits.includes('outgoing')) {
        socialDecay *= 1.5;
    }
    this.social = Math.max(0, this.social - socialDecay);
    
    // Diminue l'amusement (ralenti x10)
    this.fun = Math.max(0, this.fun - 0.002);
    
    // Diminue le confort si pas assis/couché (ralenti x10)
    this.comfort = Math.max(0, this.comfort - 0.001);
    
    // Effets critiques (ralentis x10)
    if (this.hunger > 90) this.energy = Math.max(0, this.energy - 0.01);
    if (this.thirst > 90) this.energy = Math.max(0, this.energy - 0.015);
    if (this.bladder > 90) this.comfort = Math.max(0, this.comfort - 0.02);
    if (this.hygiene < 20) this.social = Math.max(0, this.social - 0.01);
    
    // Calcule l'humeur
    this.updateMood(character);
    
    // Vérifie la mort par négligence
    this.checkCriticalState();
};

Needs.prototype.updateMood = function(character) {
    let moodScore = 0;
    let weights = {
        energy: 0.15,
        hunger: 0.15,
        thirst: 0.12,
        bladder: 0.1,
        hygiene: 0.1,
        social: 0.15,
        fun: 0.13,
        comfort: 0.1
    };
    
    // Convertit tous les besoins en échelle 0-100 positive
    moodScore += this.energy * weights.energy;
    moodScore += (100 - this.hunger) * weights.hunger;
    moodScore += (100 - this.thirst) * weights.thirst;
    moodScore += (100 - this.bladder) * weights.bladder;
    moodScore += this.hygiene * weights.hygiene;
    moodScore += this.social * weights.social;
    moodScore += this.fun * weights.fun;
    moodScore += this.comfort * weights.comfort;
    
    // Bonus/malus de traits
    if (character.traits) {
        if (character.traits.includes('grumpy')) moodScore *= 0.8;
        if (character.traits.includes('outgoing') && this.social > 60) moodScore *= 1.1;
    }
    
    this.mood = Math.max(0, Math.min(100, moodScore));
};

Needs.prototype.checkCriticalState = function() {
    const critical = [];
    
    if (this.energy < 5) critical.push('energy');
    if (this.hunger > 95) critical.push('hunger');
    if (this.thirst > 95) critical.push('thirst');
    if (this.bladder > 98) critical.push('bladder'); // Accident!
    
    return critical;
};

Needs.prototype.eat = function(amount = 30, quality = 1) {
    this.hunger = Math.max(0, this.hunger - amount * quality);
    this.energy = Math.min(100, this.energy + 5 * quality);
    this.fun = Math.min(100, this.fun + 3 * quality);
    this.bladder = Math.min(100, this.bladder + 5);
};

Needs.prototype.drink = function(amount = 40) {
    this.thirst = Math.max(0, this.thirst - amount);
    this.energy = Math.min(100, this.energy + 3);
    this.bladder = Math.min(100, this.bladder + 10);
};

Needs.prototype.useToilet = function() {
    this.bladder = 0;
    this.comfort = Math.min(100, this.comfort + 10);
};

Needs.prototype.shower = function() {
    this.hygiene = 100;
    this.energy = Math.max(0, this.energy - 10);
    this.comfort = Math.min(100, this.comfort + 5);
};

Needs.prototype.sleep = function(hours = 8) {
    const recovery = hours * 10;
    this.energy = Math.min(100, this.energy + recovery);
    this.comfort = Math.min(100, this.comfort + 20);
};

Needs.prototype.rest = function(amount = 30) {
    this.energy = Math.min(100, this.energy + amount);
    this.comfort = Math.min(100, this.comfort + amount * 0.7);
};

Needs.prototype.socialize = function(quality = 1) {
    this.social = Math.min(100, this.social + 20 * quality);
    this.fun = Math.min(100, this.fun + 10 * quality);
};

Needs.prototype.haveFun = function(amount = 20) {
    this.fun = Math.min(100, this.fun + amount);
};

Needs.prototype.getCritical = function() {
    const needs = [
        { name: 'energy', value: this.energy, inverse: true },
        { name: 'hunger', value: this.hunger, inverse: false },
        { name: 'thirst', value: this.thirst, inverse: false },
        { name: 'bladder', value: this.bladder, inverse: false },
        { name: 'hygiene', value: this.hygiene, inverse: true },
        { name: 'social', value: this.social, inverse: true },
        { name: 'fun', value: this.fun, inverse: true }
    ];
    
    // Calcule l'urgence (inverse les valeurs si nécessaire)
    needs.forEach(n => {
        n.urgency = n.inverse ? (100 - n.value) : n.value;
    });
    
    return needs.sort((a, b) => b.urgency - a.urgency)[0];
};

Needs.prototype.getStatus = function() {
    if (this.mood < 20) return '😢 Terrible';
    if (this.mood < 40) return '😟 Mauvais';
    if (this.mood < 60) return '😐 OK';
    if (this.mood < 80) return '🙂 Bien';
    return '😄 Excellent';
};

Needs.prototype.getMoodColor = function() {
    if (this.mood < 20) return '#ff4444';
    if (this.mood < 40) return '#ff8844';
    if (this.mood < 60) return '#ffbb44';
    if (this.mood < 80) return '#88dd44';
    return '#44dd88';
};

Needs.prototype.getAllNeeds = function() {
    return {
        energy: { value: this.energy, label: '⚡ Énergie', reverse: false },
        hunger: { value: 100 - this.hunger, label: '🍕 Faim', reverse: true },
        thirst: { value: 100 - this.thirst, label: '💧 Soif', reverse: true },
        bladder: { value: 100 - this.bladder, label: '🚽 Vessie', reverse: true },
        hygiene: { value: this.hygiene, label: '🚿 Hygiène', reverse: false },
        social: { value: this.social, label: '💬 Social', reverse: false },
        fun: { value: this.fun, label: '🎮 Fun', reverse: false },
        comfort: { value: this.comfort, label: '🛋️ Confort', reverse: false }
    };
};