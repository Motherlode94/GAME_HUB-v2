function AutonomousAI(character) {
    this.character = character;
    this.currentAction = null;
    this.actionQueue = [];
    this.decisionCooldown = 0;
    this.personality = this.generatePersonality();
    this.locationStayTimer = 0;
    this.minStayTime = 300;
    this.targetObject = null;
    this.targetCharacter = null;
}

AutonomousAI.prototype.generatePersonality = function() {
    return {
        sociability: Math.random(),
        cleanliness: Math.random(),
        laziness: Math.random(),
        playfulness: Math.random()
    };
};

AutonomousAI.prototype.update = function() {
    if (this.character.isDead) return;
    
    if (this.locationStayTimer > 0) {
        this.locationStayTimer--;
    }
    
    if (this.decisionCooldown > 0) {
        this.decisionCooldown--;
        return;
    }
    
    // ⭐ CORRECTION : Décider une nouvelle action uniquement si l'ancienne est terminée
    if (!this.currentAction || this.currentAction.completed) {
        this.currentAction = this.decideNextAction();
        this.currentAction.completed = false;
        this.decisionCooldown = 60; // Cooldown avant la prochaine décision
    }
    
    // ⭐ IMPORTANT : Exécuter l'action en cours à chaque frame
    if (this.currentAction) {
        this.executeAction(this.currentAction);
    }
};

AutonomousAI.prototype.decideNextAction = function() {
    const criticalNeed = this.character.needs.getCritical();
    
    // Si besoin critique (>80), agir immédiatement
    if (criticalNeed.urgency > 80) {
        return this.findActionForNeed(criticalNeed.name);
    }
    
    // Sinon, évaluer toutes les actions possibles
    const possibleActions = this.evaluateAllActions();
    
    if (possibleActions.length === 0) {
        return { type: 'wander' };
    }
    
    // Trier par score et prendre la meilleure
    possibleActions.sort((a, b) => b.score - a.score);
    return possibleActions[0];
};

AutonomousAI.prototype.findActionForNeed = function(needName) {
    const needActions = {
        energy: [
            { type: 'find_bed', object: 'bed' },
            { type: 'find_couch', object: 'couch' }
        ],
        hunger: [
            { type: 'find_fridge', object: 'fridge' },
            { type: 'find_stove', object: 'stove' }
        ],
        thirst: [
            { type: 'find_fridge', object: 'fridge' }
        ],
        bladder: [
            { type: 'find_toilet', object: 'toilet' }
        ],
        hygiene: [
            { type: 'find_shower', object: 'shower' }
        ],
        social: [
            { type: 'socialize', target: 'nearest_character' }
        ],
        fun: [
            { type: 'find_tv', object: 'tv' },
            { type: 'find_computer', object: 'computer' }
        ]
    };
    
    const actions = needActions[needName] || [];
    if (actions.length === 0) return { type: 'wander' };
    
    return actions[Math.floor(Math.random() * actions.length)];
};

AutonomousAI.prototype.evaluateAllActions = function() {
    const actions = [];
    const needs = this.character.needs;
    
    // Énergie
    if (needs.energy < 70) {
        actions.push({
            type: 'find_bed',
            object: 'bed',
            score: (70 - needs.energy) * 2
        });
    }
    
    if (needs.energy < 50) {
        actions.push({
            type: 'find_couch',
            object: 'couch',
            score: (50 - needs.energy) * 1.5
        });
    }
    
    // Faim
    if (needs.hunger > 30) {
        actions.push({
            type: 'find_fridge',
            object: 'fridge',
            score: needs.hunger * 1.5
        });
    }
    
    // Soif
    if (needs.thirst > 30) {
        actions.push({
            type: 'find_fridge',
            object: 'fridge',
            score: needs.thirst * 1.8
        });
    }
    
    // Toilettes
    if (needs.bladder > 40) {
        actions.push({
            type: 'find_toilet',
            object: 'toilet',
            score: needs.bladder * 2
        });
    }
    
    // Hygiène
    if (needs.hygiene < 40) {
        actions.push({
            type: 'find_shower',
            object: 'shower',
            score: (100 - needs.hygiene) * this.personality.cleanliness * 1.5
        });
    }
    
    // Social
    if (needs.social < 50) {
        actions.push({
            type: 'socialize',
            target: 'nearest_character',
            score: (50 - needs.social) * this.personality.sociability * 1.3
        });
    }
    
    // Fun
    if (needs.fun < 50) {
        const funScore = (50 - needs.fun) * this.personality.playfulness;
        actions.push(
            { type: 'find_tv', object: 'tv', score: funScore },
            { type: 'find_computer', object: 'computer', score: funScore * 0.8 }
        );
    }
    
    // Confort
    if (needs.comfort < 40) {
        actions.push({
            type: 'find_couch',
            object: 'couch',
            score: (40 - needs.comfort) * 0.8
        });
    }
    
    // ⭐ Toujours avoir l'option de se balader
    actions.push({
        type: 'wander',
        score: 10 + Math.random() * 5 // Score faible mais aléatoire
    });
    
    return actions;
};

AutonomousAI.prototype.executeAction = function(action) {
    switch (action.type) {
        case 'find_bed':
        case 'find_fridge':
        case 'find_toilet':
        case 'find_shower':
        case 'find_couch':
        case 'find_tv':
        case 'find_computer':
        case 'find_stove':
            this.moveToObject(action.object);
            break;
            
        case 'socialize':
            this.moveToCharacter();
            break;
            
        case 'wander':
            this.wander();
            break;
    }
};

AutonomousAI.prototype.moveToObject = function(objectType) {
    const currentLoc = this.character.currentLocation || WorldManager.currentLocation;
    const npcHome = this.character.id === 'N1' ? 'sophie_house' : 
                     this.character.id === 'N2' ? 'marc_house' : null;
    
    // Chercher l'objet dans la location actuelle
    const nearestObject = this.findNearestObjectInCurrentLocation(objectType);
    
    if (nearestObject) {
        const dist = getDistance(this.character, nearestObject);
        
        if (dist < 80) {
            // Assez proche pour interagir
            this.interactWithObject(nearestObject);
            this.currentAction.completed = true;
        } else {
            // Se déplacer vers l'objet
            moveTowards(this.character, nearestObject.x, nearestObject.y, 1.5);
        }
        return;
    }
    
    // Si on est dehors et qu'on n'a pas trouvé l'objet, rentrer à la maison
    if (currentLoc === 'neighborhood' && npcHome && this.locationStayTimer <= 0) {
        const homeBuilding = WorldManager.locations.neighborhood.buildings.find(
            b => b.linkedLocation === npcHome
        );
        
        if (homeBuilding) {
            const dist = getDistance(this.character, {x: homeBuilding.doorX, y: homeBuilding.doorY});
            
            if (dist < 80) {
                WorldManager.changeLocation(npcHome, this.character);
                this.locationStayTimer = this.minStayTime;
                this.currentAction.completed = false; // Continuer l'action à l'intérieur
                return;
            } else {
                moveTowards(this.character, homeBuilding.doorX, homeBuilding.doorY, 1.5);
                return;
            }
        }
    }
    
    // Si on est à la maison mais pas d'objet trouvé, se balader
    if (currentLoc === npcHome) {
        this.wander();
        this.currentAction.completed = true;
        return;
    }
    
    // Par défaut, se balader
    this.wander();
};

AutonomousAI.prototype.findNearestObject = function(type) {
    const objects = WorldObjects.findByType(type);
    if (objects.length === 0) return null;
    
    let nearest = objects[0];
    let minDist = getDistance(this.character, nearest);
    
    for (let i = 1; i < objects.length; i++) {
        const dist = getDistance(this.character, objects[i]);
        if (dist < minDist) {
            minDist = dist;
            nearest = objects[i];
        }
    }
    
    return nearest;
};

AutonomousAI.prototype.findNearestObjectInCurrentLocation = function(type) {
    const currentLoc = this.character.currentLocation || WorldManager.currentLocation;
    const objects = WorldObjects.objects.filter(o => 
        o.type === type && o.location === currentLoc
    );
    
    if (objects.length === 0) return null;
    
    let nearest = objects[0];
    let minDist = getDistance(this.character, nearest);
    
    for (let i = 1; i < objects.length; i++) {
        const dist = getDistance(this.character, objects[i]);
        if (dist < minDist) {
            minDist = dist;
            nearest = objects[i];
        }
    }
    
    return nearest;
};

AutonomousAI.prototype.interactWithObject = function(obj) {
    const interactionMap = {
        bed: 'sleep',
        fridge: this.character.needs.hunger > this.character.needs.thirst ? 'eat' : 'drink',
        toilet: 'use',
        shower: 'shower',
        couch: 'relax',
        tv: 'watch',
        computer: 'play',
        stove: 'cook'
    };
    
    const interaction = interactionMap[obj.type];
    if (interaction) {
        obj.use(this.character, interaction);
        console.log(`${this.character.name} utilise ${obj.type}: ${interaction}`);
    }
};

AutonomousAI.prototype.moveToCharacter = function() {
    const others = chars.filter(c => 
        c.id !== this.character.id && 
        !c.isDead &&
        c.currentLocation === this.character.currentLocation
    );
    
    if (others.length === 0) {
        this.wander();
        this.currentAction.completed = true;
        return;
    }
    
    const nearest = others.reduce((closest, c) => {
        const dist = getDistance(this.character, c);
        const closestDist = getDistance(this.character, closest);
        return dist < closestDist ? c : closest;
    });
    
    const dist = getDistance(this.character, nearest);
    
    if (dist < 50) {
        // Assez proche pour socialiser
        if (typeof checkInteraction !== 'undefined') {
            checkInteraction(this.character, nearest);
        }
        this.currentAction.completed = true;
    } else {
        moveTowards(this.character, nearest.x, nearest.y, 1.2);
    }
};

AutonomousAI.prototype.wander = function() {
    // ⭐ CORRECTION : Augmenter la fréquence du mouvement
    if (Math.random() < 0.3) { // 30% de chance de bouger (au lieu de 5%)
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.8 + Math.random() * 1.2; // Vitesse aléatoire entre 0.8 et 2
        
        const dx = Math.cos(angle);
        const dy = Math.sin(angle);
        
        // Utiliser la fonction move globale si elle existe
        if (typeof move !== 'undefined') {
            move(this.character, dx, dy, speed);
        } else {
            // Sinon, bouger manuellement
            this.character.x += dx * speed;
            this.character.y += dy * speed;
            
            // Garder dans les limites
            const maxX = WorldManager.isOutdoor() ? 2400 : 800;
            const maxY = WorldManager.isOutdoor() ? 1800 : 600;
            this.character.x = Math.max(0, Math.min(maxX, this.character.x));
            this.character.y = Math.max(0, Math.min(maxY, this.character.y));
        }
    }
};

AutonomousAI.prototype.getDebugInfo = function() {
    return {
        currentAction: this.currentAction ? this.currentAction.type : 'none',
        criticalNeed: this.character.needs.getCritical().name,
        mood: this.character.needs.mood,
        decisionCooldown: this.decisionCooldown
    };
};

// ⭐ Fonction utilitaire pour calculer la distance
function getDistance(obj1, obj2) {
    return Math.hypot(obj1.x - obj2.x, obj1.y - obj2.y);
}

// ⭐ Fonction utilitaire pour se déplacer vers une cible
function moveTowards(character, targetX, targetY, speed) {
    const dx = targetX - character.x;
    const dy = targetY - character.y;
    const dist = Math.hypot(dx, dy);
    
    if (dist > 0) {
        character.x += (dx / dist) * speed;
        character.y += (dy / dist) * speed;
        
        // Garder dans les limites
        const maxX = WorldManager.isOutdoor() ? 2400 : 800;
        const maxY = WorldManager.isOutdoor() ? 1800 : 600;
        character.x = Math.max(0, Math.min(maxX, character.x));
        character.y = Math.max(0, Math.min(maxY, character.y));
    }
}