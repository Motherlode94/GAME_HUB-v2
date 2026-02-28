// ============================================================================
// REPUTATION & SOCIAL STATUS SYSTEM
// ============================================================================

const ReputationCategories = {
    KINDNESS: 'kindness',
    INTELLIGENCE: 'intelligence',
    HUMOR: 'humor',
    RELIABILITY: 'reliability',
    LEADERSHIP: 'leadership',
    CREATIVITY: 'creativity',
    WEALTH: 'wealth',
    ROMANCE: 'romance'
};

const SocialClasses = {
    OUTCAST: { min: 0, max: 20, name: 'Outcast', perks: [] },
    NOBODY: { min: 20, max: 40, name: 'Nobody', perks: [] },
    KNOWN: { min: 40, max: 60, name: 'Known', perks: ['basic_respect'] },
    POPULAR: { min: 60, max: 75, name: 'Popular', perks: ['basic_respect', 'easier_friendships'] },
    CELEBRITY: { min: 75, max: 90, name: 'Celebrity', perks: ['basic_respect', 'easier_friendships', 'fame_bonus'] },
    LEGEND: { min: 90, max: 100, name: 'Legend', perks: ['basic_respect', 'easier_friendships', 'fame_bonus', 'influence'] }
};

function ReputationSystem() {
    this.reputations = {}; // charId -> reputation data
    this.rumors = []; // Rumeurs actives
    this.events = []; // Événements publics affectant la réputation
}

ReputationSystem.prototype.initialize = function(charId) {
    this.reputations[charId] = {
        overall: 50, // Réputation globale (0-100)
        categories: {
            [ReputationCategories.KINDNESS]: 50,
            [ReputationCategories.INTELLIGENCE]: 50,
            [ReputationCategories.HUMOR]: 50,
            [ReputationCategories.RELIABILITY]: 50,
            [ReputationCategories.LEADERSHIP]: 50,
            [ReputationCategories.CREATIVITY]: 50,
            [ReputationCategories.WEALTH]: 50,
            [ReputationCategories.ROMANCE]: 50
        },
        achievements: [],
        scandals: [],
        publicActions: [],
        famousFor: null,
        notoriousFor: null
    };
};

ReputationSystem.prototype.modify = function(charId, category, amount, reason) {
    const rep = this.reputations[charId];
    if (!rep) return;
    
    // Modifier la catégorie spécifique
    if (category && rep.categories[category] !== undefined) {
        rep.categories[category] = Math.max(0, Math.min(100, 
            rep.categories[category] + amount
        ));
    }
    
    // Recalculer la réputation globale
    this.updateOverallReputation(charId);
    
    // Enregistrer l'action publique
    rep.publicActions.push({
        category: category,
        change: amount,
        reason: reason,
        timestamp: Time.current
    });
    
    // Propager aux autres personnages
    this.spreadReputation(charId, category, amount, reason);
    
    console.log(`📊 Réputation de ${charId} en ${category}: ${amount > 0 ? '+' : ''}${amount} (${reason})`);
    
    return {
        type: 'reputation_change',
        character: charId,
        category: category,
        change: amount,
        newValue: rep.categories[category],
        reason: reason,
        timestamp: Time.current
    };
};

ReputationSystem.prototype.updateOverallReputation = function(charId) {
    const rep = this.reputations[charId];
    if (!rep) return;
    
    // Moyenne pondérée des catégories
    const weights = {
        [ReputationCategories.KINDNESS]: 1.5,
        [ReputationCategories.RELIABILITY]: 1.5,
        [ReputationCategories.INTELLIGENCE]: 1.0,
        [ReputationCategories.HUMOR]: 1.0,
        [ReputationCategories.LEADERSHIP]: 1.2,
        [ReputationCategories.CREATIVITY]: 0.8,
        [ReputationCategories.WEALTH]: 1.1,
        [ReputationCategories.ROMANCE]: 0.7
    };
    
    let totalWeight = 0;
    let weightedSum = 0;
    
    for (let cat in rep.categories) {
        const weight = weights[cat] || 1.0;
        weightedSum += rep.categories[cat] * weight;
        totalWeight += weight;
    }
    
    rep.overall = weightedSum / totalWeight;
};

ReputationSystem.prototype.getSocialClass = function(charId) {
    const rep = this.reputations[charId];
    if (!rep) return SocialClasses.NOBODY;
    
    for (let key in SocialClasses) {
        const socialClass = SocialClasses[key];
        if (rep.overall >= socialClass.min && rep.overall < socialClass.max) {
            return socialClass;
        }
    }
    
    return SocialClasses.LEGEND;
};

ReputationSystem.prototype.addAchievement = function(charId, achievement) {
    const rep = this.reputations[charId];
    if (!rep) return;
    
    rep.achievements.push({
        name: achievement.name,
        description: achievement.description,
        reputationBonus: achievement.reputationBonus || 10,
        category: achievement.category,
        timestamp: Time.current
    });
    
    // Appliquer le bonus
    this.modify(charId, achievement.category, achievement.reputationBonus, achievement.name);
    
    // Devenir célèbre pour quelque chose
    if (achievement.reputationBonus >= 20) {
        rep.famousFor = achievement.name;
    }
};

ReputationSystem.prototype.addScandal = function(charId, scandal) {
    const rep = this.reputations[charId];
    if (!rep) return;
    
    rep.scandals.push({
        name: scandal.name,
        description: scandal.description,
        reputationPenalty: scandal.reputationPenalty || -20,
        category: scandal.category,
        timestamp: Time.current
    });
    
    // Appliquer la pénalité
    this.modify(charId, scandal.category, scandal.reputationPenalty, scandal.name);
    
    // Devenir notoire pour quelque chose
    if (scandal.reputationPenalty <= -20) {
        rep.notoriousFor = scandal.name;
    }
    
    // Créer une rumeur
    this.startRumor(charId, scandal.name, 'negative');
};

ReputationSystem.prototype.startRumor = function(sourceId, content, sentiment) {
    const rumor = {
        id: 'rumor_' + Date.now(),
        source: sourceId,
        content: content,
        sentiment: sentiment, // 'positive', 'negative', 'neutral'
        spread: 0, // Nombre de personnes qui en ont entendu parler
        credibility: 50, // 0-100
        timestamp: Time.current,
        expiresAt: Time.current + 1000 // Les rumeurs expirent
    };
    
    this.rumors.push(rumor);
    return rumor;
};

ReputationSystem.prototype.spreadRumor = function(rumorId, newHearer) {
    const rumor = this.rumors.find(r => r.id === rumorId);
    if (!rumor) return;
    
    rumor.spread++;
    
    // La crédibilité diminue à mesure que la rumeur se propage (téléphone arabe)
    rumor.credibility = Math.max(10, rumor.credibility - 2);
    
    // Impact sur la réputation de la source si négatif
    if (rumor.sentiment === 'negative') {
        this.modify(rumor.source, ReputationCategories.RELIABILITY, -1, 'rumeur négative');
    }
};

ReputationSystem.prototype.updateRumors = function() {
    // Nettoyer les rumeurs expirées
    this.rumors = this.rumors.filter(rumor => 
        Time.current < rumor.expiresAt
    );
};

ReputationSystem.prototype.spreadReputation = function(charId, category, amount, reason) {
    // Propager la nouvelle réputation aux autres personnages
    // Implémentation simplifiée - à adapter selon votre système de personnages
    
    // Les grands changements se propagent plus vite
    if (Math.abs(amount) >= 20) {
        this.startRumor(charId, reason, amount > 0 ? 'positive' : 'negative');
    }
};

ReputationSystem.prototype.getReputationWith = function(charId, observerId) {
    // Comment observerId perçoit la réputation de charId
    const rep = this.reputations[charId];
    if (!rep) return 50;
    
    let perceived = rep.overall;
    
    // Ajuster selon la relation personnelle
    const relationship = this.getRelationship(observerId, charId);
    if (relationship) {
        // Les amis voient mieux, les ennemis voient pire
        perceived += (relationship.affection - 50) * 0.3;
    }
    
    // Vérifier les rumeurs connues
    this.rumors.forEach(rumor => {
        if (rumor.source === charId) {
            if (rumor.sentiment === 'negative') {
                perceived -= 5;
            } else if (rumor.sentiment === 'positive') {
                perceived += 5;
            }
        }
    });
    
    return Math.max(0, Math.min(100, perceived));
};

ReputationSystem.prototype.getInfluence = function(charId) {
    const rep = this.reputations[charId];
    if (!rep) return 0;
    
    const socialClass = this.getSocialClass(charId);
    
    // L'influence dépend de la classe sociale et des catégories spécifiques
    let influence = rep.overall * 0.5;
    influence += rep.categories[ReputationCategories.LEADERSHIP] * 0.3;
    influence += rep.categories[ReputationCategories.WEALTH] * 0.2;
    
    // Bonus de classe sociale
    if (socialClass === SocialClasses.CELEBRITY) influence += 20;
    if (socialClass === SocialClasses.LEGEND) influence += 40;
    
    return Math.min(100, influence);
};

ReputationSystem.prototype.canInfluence = function(charId, targetId) {
    const influence = this.getInfluence(charId);
    const targetInfluence = this.getInfluence(targetId);
    
    // Peut influencer si son influence est significativement supérieure
    return influence > targetInfluence + 20;
};

ReputationSystem.prototype.getHighestReputation = function(charId) {
    const rep = this.reputations[charId];
    if (!rep) return null;
    
    let highest = { category: null, value: 0 };
    
    for (let cat in rep.categories) {
        if (rep.categories[cat] > highest.value) {
            highest = { category: cat, value: rep.categories[cat] };
        }
    }
    
    return highest;
};

ReputationSystem.prototype.getLowestReputation = function(charId) {
    const rep = this.reputations[charId];
    if (!rep) return null;
    
    let lowest = { category: null, value: 100 };
    
    for (let cat in rep.categories) {
        if (rep.categories[cat] < lowest.value) {
            lowest = { category: cat, value: rep.categories[cat] };
        }
    }
    
    return lowest;
};

// Helper pour obtenir une relation (à adapter)
ReputationSystem.prototype.getRelationship = function(char1, char2) {
    return null; // Placeholder
};

// Instance globale
const Reputation = new ReputationSystem();