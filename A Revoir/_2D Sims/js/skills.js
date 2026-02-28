function Skills() {
    this.cooking = 0;
    this.charisma = 0;
    this.logic = 0;
    this.creativity = 0;
    this.fitness = 0;
    this.mechanical = 0;
    this.gardening = 0;
}

Skills.prototype.increase = function(skill, amount = 1) {
    if (this[skill] !== undefined) {
        this[skill] = Math.min(10, this[skill] + amount);
        return true;
    }
    return false;
};

Skills.prototype.getLevel = function(skill) {
    return Math.floor(this[skill]);
};

Skills.prototype.canDo = function(skill, requiredLevel) {
    return this.getLevel(skill) >= requiredLevel;
};

// Système de carrière
function Career(type) {
    this.type = type;
    this.level = 1;
    this.experience = 0;
    this.salary = this.getSalaryForLevel(1);
    this.schedule = this.getScheduleForType(type);
    this.requiredSkills = this.getRequiredSkills(type);
}

Career.prototype.getSalaryForLevel = function(level) {
    const baseSalaries = {
        tech: [100, 200, 350, 500, 750, 1000, 1500, 2000, 3000, 5000],
        medical: [150, 250, 400, 600, 900, 1200, 1800, 2500, 3500, 6000],
        culinary: [80, 150, 250, 400, 600, 800, 1200, 1800, 2500, 4000],
        artist: [50, 100, 200, 350, 550, 800, 1200, 2000, 3000, 5000],
        athlete: [100, 180, 300, 500, 800, 1200, 1800, 2500, 3500, 6000]
    };
    
    return baseSalaries[this.type][level - 1] || 100;
};

Career.prototype.getScheduleForType = function(type) {
    const schedules = {
        tech: { start: 9, end: 17 },
        medical: { start: 8, end: 18 },
        culinary: { start: 11, end: 22 },
        artist: { start: 10, end: 18 },
        athlete: { start: 6, end: 14 }
    };
    return schedules[type] || { start: 9, end: 17 };
};

Career.prototype.getRequiredSkills = function(type) {
    const requirements = {
        tech: { logic: 3, mechanical: 2 },
        medical: { logic: 4, charisma: 2 },
        culinary: { cooking: 5 },
        artist: { creativity: 4 },
        athlete: { fitness: 5 }
    };
    return requirements[type] || {};
};

Career.prototype.work = function(character) {
    // Vérifie si c'est l'heure de travail
    if (Time.hour < this.schedule.start || Time.hour > this.schedule.end) {
        return { success: false, reason: 'not_work_hours' };
    }
    
    // Vérifie les besoins
    if (character.needs.energy < 20) {
        return { success: false, reason: 'too_tired' };
    }
    
    // Travaille
    character.needs.energy -= 25;
    character.needs.happiness -= 5;
    
    this.experience += 10;
    
    // Niveau up
    if (this.experience >= 100 * this.level) {
        this.levelUp(character);
    }
    
    return { 
        success: true, 
        earned: this.salary,
        experience: 10
    };
};

Career.prototype.levelUp = function(character) {
    if (this.level >= 10) return false;
    
    // Vérifie les compétences requises
    const hasSkills = Object.keys(this.requiredSkills).every(skill => {
        return character.skills.getLevel(skill) >= this.requiredSkills[skill];
    });
    
    if (hasSkills) {
        this.level++;
        this.salary = this.getSalaryForLevel(this.level);
        this.experience = 0;
        
        Consequences.add({
            type: 'career_promotion',
            actor: character.id,
            career: this.type,
            newLevel: this.level
        });
        
        return true;
    }
    
    return false;
};

// Système de traits de personnalité
const Traits = {
    neat: { 
        name: 'Soigné',
        effects: { hygiene_decay: -0.5 },
        behaviors: ['clean_more']
    },
    lazy: { 
        name: 'Paresseux',
        effects: { energy_decay: -0.3 },
        behaviors: ['rest_more']
    },
    outgoing: { 
        name: 'Sociable',
        effects: { social_gain: 1.5 },
        behaviors: ['seek_social']
    },
    active: { 
        name: 'Actif',
        effects: { fitness_gain: 1.5, energy_decay: 0.2 },
        behaviors: ['exercise_more']
    },
    genius: { 
        name: 'Génie',
        effects: { logic_gain: 1.5 },
        behaviors: ['study_more']
    },
    romantic: { 
        name: 'Romantique',
        effects: { relationship_gain: 1.3 },
        behaviors: ['seek_romance']
    },
    grumpy: { 
        name: 'Grincheux',
        effects: { happiness_decay: 0.3 },
        behaviors: ['complain_more']
    },
    creative: { 
        name: 'Créatif',
        effects: { creativity_gain: 1.5 },
        behaviors: ['create_more']
    },
    foodie: { 
        name: 'Gourmet',
        effects: { cooking_gain: 1.3, hunger_decay: 0.2 },
        behaviors: ['cook_better']
    },
    bookworm: { 
        name: 'Rat de bibliothèque',
        effects: { logic_gain: 1.2, creativity_gain: 1.2 },
        behaviors: ['read_more']
    }
};

// Système d'aspirations (objectifs à long terme)
function Aspiration(type) {
    this.type = type;
    this.milestones = this.getMilestones(type);
    this.currentMilestone = 0;
    this.completed = false;
}

Aspiration.prototype.getMilestones = function(type) {
    const aspirations = {
        fortune: [
            { desc: 'Gagner 1000§', check: (char) => char.money >= 1000 },
            { desc: 'Gagner 5000§', check: (char) => char.money >= 5000 },
            { desc: 'Gagner 10000§', check: (char) => char.money >= 10000 }
        ],
        knowledge: [
            { desc: 'Atteindre niveau 3 en Logic', check: (char) => char.skills.logic >= 3 },
            { desc: 'Atteindre niveau 5 en Logic', check: (char) => char.skills.logic >= 5 },
            { desc: 'Maîtriser 3 compétences', check: (char) => {
                return Object.values(char.skills).filter(s => s >= 10).length >= 3;
            }}
        ],
        family: [
            { desc: 'Avoir 2 amis', check: (char) => {
                return Object.values(char.relations).filter(r => r.affection >= 70).length >= 2;
            }},
            { desc: 'Avoir 5 amis', check: (char) => {
                return Object.values(char.relations).filter(r => r.affection >= 70).length >= 5;
            }}
        ],
        creativity: [
            { desc: 'Atteindre niveau 3 en Creativity', check: (char) => char.skills.creativity >= 3 },
            { desc: 'Atteindre niveau 7 en Creativity', check: (char) => char.skills.creativity >= 7 },
            { desc: 'Devenir artiste professionnel', check: (char) => {
                return char.career && char.career.type === 'artist' && char.career.level >= 5;
            }}
        ]
    };
    
    return aspirations[type] || aspirations.fortune;
};

Aspiration.prototype.checkProgress = function(character) {
    if (this.completed) return false;
    
    const milestone = this.milestones[this.currentMilestone];
    if (milestone && milestone.check(character)) {
        this.currentMilestone++;
        
        Consequences.add({
            type: 'aspiration_milestone',
            actor: character.id,
            aspiration: this.type,
            milestone: this.currentMilestone
        });
        
        if (this.currentMilestone >= this.milestones.length) {
            this.completed = true;
        }
        
        return true;
    }
    
    return false;
};