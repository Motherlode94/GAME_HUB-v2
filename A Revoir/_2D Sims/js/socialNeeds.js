// ============================================================================
// SOCIAL EFFECTS & NEEDS SYSTEM
// ============================================================================

function SocialNeedsSystem() {
    this.socialNeeds = {}; // charId -> social needs state
    this.lonelinessThreshold = 30; // En dessous = lonely
    this.overwhelmedThreshold = 90; // Au dessus = overwhelmed
}

SocialNeedsSystem.prototype.initialize = function(charId) {
    this.socialNeeds[charId] = {
        social: 50, // 0-100
        loneliness: 0, // 0-100
        lastInteraction: Time.current,
        recentInteractions: [],
        supportNetwork: 0, // Nombre de relations proches
        emotionalSupport: 0 // Support émotionnel reçu
    };
};

SocialNeedsSystem.prototype.update = function(charId, character) {
    const needs = this.socialNeeds[charId];
    if (!needs) return;
    
    // Calculer le temps depuis la dernière interaction
    const timeSinceInteraction = Time.current - needs.lastInteraction;
    
    // La solitude augmente avec le temps sans interaction
    if (timeSinceInteraction > 100) { // ~1 heure de jeu
        needs.loneliness = Math.min(100, needs.loneliness + 0.1);
        needs.social = Math.max(0, needs.social - 0.05);
    }
    
    // Nettoyer les anciennes interactions
    needs.recentInteractions = needs.recentInteractions.filter(i => 
        Time.current - i.timestamp < 500 // Garder 5 heures
    );
    
    // Trop d'interactions = surcharge sociale
    if (needs.recentInteractions.length > 20) {
        needs.social = Math.min(100, needs.social + 2);
    }
    
    // Calculer le réseau de support
    needs.supportNetwork = this.calculateSupportNetwork(charId);
    
    // Appliquer les effets de solitude/surcharge
    this.applyEffects(charId, character);
};

SocialNeedsSystem.prototype.onInteraction = function(charId, targetId, quality) {
    const needs = this.socialNeeds[charId];
    if (!needs) return;
    
    needs.lastInteraction = Time.current;
    needs.recentInteractions.push({
        target: targetId,
        quality: quality, // 'positive', 'neutral', 'negative'
        timestamp: Time.current
    });
    
    // Impact sur le besoin social
    if (quality === 'positive') {
        needs.social = Math.min(100, needs.social + 15);
        needs.loneliness = Math.max(0, needs.loneliness - 20);
    } else if (quality === 'negative') {
        needs.social = Math.max(0, needs.social - 10);
        needs.loneliness = Math.min(100, needs.loneliness + 10);
    } else {
        needs.social = Math.min(100, needs.social + 5);
        needs.loneliness = Math.max(0, needs.loneliness - 5);
    }
};

SocialNeedsSystem.prototype.calculateSupportNetwork = function(charId) {
    // Compter les relations avec affection > 70
    let supportCount = 0;
    
    // À adapter selon votre système de relations
    // Exemple: parcourir toutes les relations du personnage
    // if (character.relationships) {
    //     for (let rel of character.relationships) {
    //         if (rel.affection > 70) supportCount++;
    //     }
    // }
    
    return supportCount;
};

SocialNeedsSystem.prototype.applyEffects = function(charId, character) {
    const needs = this.socialNeeds[charId];
    if (!needs || !character) return;
    
    const effects = {
        mood: 0,
        energy: 0,
        productivity: 0
    };
    
    // Effets de la solitude
    if (needs.loneliness > this.lonelinessThreshold) {
        const severity = (needs.loneliness - this.lonelinessThreshold) / 70;
        
        effects.mood -= severity * 20;
        effects.energy -= severity * 10;
        
        // Solitude sévère
        if (needs.loneliness > 70) {
            effects.mood -= 30;
            console.log(`😔 ${charId} se sent très seul(e)`);
        }
    }
    
    // Effets de la surcharge sociale
    if (needs.social > this.overwhelmedThreshold) {
        const severity = (needs.social - this.overwhelmedThreshold) / 10;
        
        effects.mood -= severity * 10;
        effects.energy -= severity * 15;
        
        console.log(`😰 ${charId} est submergé(e) socialement`);
    }
    
    // Bonus du réseau de support
    if (needs.supportNetwork > 0) {
        effects.mood += needs.supportNetwork * 2;
        effects.energy += needs.supportNetwork * 1;
    }
    
    return effects;
};

SocialNeedsSystem.prototype.getComfortBonus = function(charId, comforterId) {
    // Calculer le bonus de réconfort basé sur la relation
    const relationship = this.getRelationship(charId, comforterId);
    if (!relationship) return 0;
    
    let bonus = 0;
    
    // Plus la relation est forte, plus le réconfort est efficace
    if (relationship.affection > 80) {
        bonus = 30;
    } else if (relationship.affection > 60) {
        bonus = 20;
    } else if (relationship.affection > 40) {
        bonus = 10;
    }
    
    // Bonus supplémentaire pour les relations familiales
    const relationType = FamilySystem.getRelationType(charId, comforterId);
    if (['parent', 'child', 'spouse', 'sibling'].includes(relationType)) {
        bonus += 15;
    }
    
    return bonus;
};

SocialNeedsSystem.prototype.receiveComfort = function(charId, comforterId) {
    const needs = this.socialNeeds[charId];
    if (!needs) return;
    
    const bonus = this.getComfortBonus(charId, comforterId);
    
    needs.loneliness = Math.max(0, needs.loneliness - bonus);
    needs.emotionalSupport += bonus;
    
    return {
        type: 'comfort_received',
        character: charId,
        comforter: comforterId,
        effectiveness: bonus,
        timestamp: Time.current
    };
};

SocialNeedsSystem.prototype.isLonely = function(charId) {
    const needs = this.socialNeeds[charId];
    return needs && needs.loneliness > this.lonelinessThreshold;
};

SocialNeedsSystem.prototype.isOverwhelmed = function(charId) {
    const needs = this.socialNeeds[charId];
    return needs && needs.social > this.overwhelmedThreshold;
};

SocialNeedsSystem.prototype.needsSocialInteraction = function(charId) {
    const needs = this.socialNeeds[charId];
    if (!needs) return false;
    
    return needs.social < 30 || needs.loneliness > 50;
};

SocialNeedsSystem.prototype.needsAloneTime = function(charId) {
    const needs = this.socialNeeds[charId];
    if (!needs) return false;
    
    return needs.social > 70;
};

SocialNeedsSystem.prototype.getSocialStatus = function(charId) {
    const needs = this.socialNeeds[charId];
    if (!needs) return 'unknown';
    
    if (needs.loneliness > 70) return 'very_lonely';
    if (needs.loneliness > 40) return 'lonely';
    if (needs.social > this.overwhelmedThreshold) return 'overwhelmed';
    if (needs.social > 70) return 'socially_tired';
    if (needs.social < 30) return 'needs_interaction';
    
    return 'balanced';
};

// Gestion des groupes sociaux
SocialNeedsSystem.prototype.joinGroup = function(charId, groupId) {
    const needs = this.socialNeeds[charId];
    if (!needs.groups) needs.groups = [];
    
    if (!needs.groups.includes(groupId)) {
        needs.groups.push(groupId);
        needs.supportNetwork++;
    }
};

SocialNeedsSystem.prototype.leaveGroup = function(charId, groupId) {
    const needs = this.socialNeeds[charId];
    if (!needs.groups) return;
    
    needs.groups = needs.groups.filter(g => g !== groupId);
    needs.supportNetwork = Math.max(0, needs.supportNetwork - 1);
};

// Helper pour obtenir une relation (à adapter)
SocialNeedsSystem.prototype.getRelationship = function(char1, char2) {
    return null; // Placeholder
};

// Instance globale
const SocialNeeds = new SocialNeedsSystem();