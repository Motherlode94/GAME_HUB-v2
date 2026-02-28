// ============================================================================
// MEMORY SYSTEM
// ============================================================================

const MemoryTypes = {
    INTERACTION: 'interaction',
    EVENT: 'event',
    EMOTION: 'emotion',
    CONVERSATION: 'conversation',
    CONFLICT: 'conflict',
    POSITIVE: 'positive',
    NEGATIVE: 'negative'
};

const MemoryImportance = {
    TRIVIAL: 1,
    MINOR: 2,
    MODERATE: 3,
    IMPORTANT: 4,
    MAJOR: 5,
    LIFE_CHANGING: 6
};

function MemorySystem() {
    this.memories = {}; // charId -> [memories]
    this.maxMemories = 100; // Maximum de souvenirs par personnage
    this.decayRate = 0.01; // Taux d'oubli
}

MemorySystem.prototype.addMemory = function(charId, memory) {
    if (!this.memories[charId]) {
        this.memories[charId] = [];
    }
    
    const newMemory = {
        id: 'mem_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        type: memory.type || MemoryTypes.INTERACTION,
        importance: memory.importance || MemoryImportance.MODERATE,
        content: memory.content,
        participants: memory.participants || [],
        location: memory.location || null,
        emotion: memory.emotion || 'neutral',
        timestamp: Time.current,
        day: Time.day,
        strength: 100, // Force du souvenir (0-100)
        recalled: 0, // Nombre de fois rappelé
        associations: [] // Autres souvenirs liés
    };
    
    this.memories[charId].push(newMemory);
    
    // Limiter le nombre de souvenirs
    if (this.memories[charId].length > this.maxMemories) {
        this.forgetLeastImportant(charId);
    }
    
    return newMemory;
};

MemorySystem.prototype.recall = function(charId, query) {
    if (!this.memories[charId]) return [];
    
    let results = this.memories[charId];
    
    // Filtrer par type si spécifié
    if (query.type) {
        results = results.filter(m => m.type === query.type);
    }
    
    // Filtrer par participant
    if (query.participant) {
        results = results.filter(m => 
            m.participants.includes(query.participant)
        );
    }
    
    // Filtrer par émotion
    if (query.emotion) {
        results = results.filter(m => m.emotion === query.emotion);
    }
    
    // Filtrer par période
    if (query.recentDays) {
        const cutoff = Time.day - query.recentDays;
        results = results.filter(m => m.day >= cutoff);
    }
    
    // Trier par force et importance
    results.sort((a, b) => {
        const scoreA = a.strength * a.importance;
        const scoreB = b.strength * b.importance;
        return scoreB - scoreA;
    });
    
    // Marquer comme rappelé
    results.forEach(memory => {
        memory.recalled++;
        memory.strength = Math.min(100, memory.strength + 5); // Se rappeler renforce
    });
    
    return results.slice(0, query.limit || 10);
};

MemorySystem.prototype.getMemoriesAbout = function(charId, targetId) {
    return this.recall(charId, {
        participant: targetId,
        limit: 20
    });
};

MemorySystem.prototype.getRecentMemories = function(charId, days = 7) {
    return this.recall(charId, {
        recentDays: days,
        limit: 15
    });
};

MemorySystem.prototype.getEmotionalMemories = function(charId, emotion) {
    return this.recall(charId, {
        emotion: emotion,
        limit: 10
    });
};

MemorySystem.prototype.decay = function(charId) {
    if (!this.memories[charId]) return;
    
    this.memories[charId].forEach(memory => {
        // Les souvenirs importants se dégradent moins vite
        const decayAmount = this.decayRate * (7 - memory.importance);
        memory.strength = Math.max(0, memory.strength - decayAmount);
        
        // Les souvenirs rappelés récemment résistent mieux
        if (memory.recalled > 0) {
            memory.strength = Math.min(100, memory.strength + 0.5);
        }
    });
    
    // Oublier les souvenirs trop faibles
    this.memories[charId] = this.memories[charId].filter(m => 
        m.strength > 10 || m.importance >= MemoryImportance.IMPORTANT
    );
};

MemorySystem.prototype.forgetLeastImportant = function(charId) {
    if (!this.memories[charId]) return;
    
    // Trier par score (force * importance)
    this.memories[charId].sort((a, b) => {
        const scoreA = a.strength * a.importance;
        const scoreB = b.strength * b.importance;
        return scoreA - scoreB;
    });
    
    // Supprimer le moins important
    this.memories[charId].shift();
};

MemorySystem.prototype.associate = function(charId, memory1Id, memory2Id) {
    const memories = this.memories[charId];
    if (!memories) return;
    
    const mem1 = memories.find(m => m.id === memory1Id);
    const mem2 = memories.find(m => m.id === memory2Id);
    
    if (mem1 && mem2) {
        if (!mem1.associations.includes(memory2Id)) {
            mem1.associations.push(memory2Id);
        }
        if (!mem2.associations.includes(memory1Id)) {
            mem2.associations.push(memory1Id);
        }
    }
};

MemorySystem.prototype.getAssociatedMemories = function(charId, memoryId) {
    const memories = this.memories[charId];
    if (!memories) return [];
    
    const memory = memories.find(m => m.id === memoryId);
    if (!memory) return [];
    
    return memory.associations.map(assocId => 
        memories.find(m => m.id === assocId)
    ).filter(Boolean);
};

// Analyse des souvenirs pour influencer le comportement
MemorySystem.prototype.analyzeRelationshipMemories = function(charId, targetId) {
    const memories = this.getMemoriesAbout(charId, targetId);
    
    const analysis = {
        totalMemories: memories.length,
        positiveCount: 0,
        negativeCount: 0,
        neutralCount: 0,
        strongestMemory: null,
        averageEmotion: 0,
        lastInteraction: null
    };
    
    let emotionSum = 0;
    let maxStrength = 0;
    
    memories.forEach(memory => {
        // Catégoriser par émotion
        if (['happy', 'love', 'excited', 'grateful'].includes(memory.emotion)) {
            analysis.positiveCount++;
            emotionSum += 1;
        } else if (['angry', 'sad', 'jealous', 'disgusted'].includes(memory.emotion)) {
            analysis.negativeCount++;
            emotionSum -= 1;
        } else {
            analysis.neutralCount++;
        }
        
        // Trouver le souvenir le plus fort
        if (memory.strength > maxStrength) {
            maxStrength = memory.strength;
            analysis.strongestMemory = memory;
        }
        
        // Dernière interaction
        if (!analysis.lastInteraction || memory.timestamp > analysis.lastInteraction.timestamp) {
            analysis.lastInteraction = memory;
        }
    });
    
    if (memories.length > 0) {
        analysis.averageEmotion = emotionSum / memories.length;
    }
    
    return analysis;
};

// Créer des souvenirs automatiquement lors d'interactions
MemorySystem.prototype.recordInteraction = function(char1, char2, type, outcome, emotion) {
    const importance = this.calculateImportance(type, outcome);
    
    // Souvenir pour char1
    this.addMemory(char1, {
        type: MemoryTypes.INTERACTION,
        importance: importance,
        content: `${type} with ${char2}`,
        participants: [char2],
        emotion: emotion,
        outcome: outcome
    });
    
    // Souvenir pour char2
    this.addMemory(char2, {
        type: MemoryTypes.INTERACTION,
        importance: importance,
        content: `${type} with ${char1}`,
        participants: [char1],
        emotion: emotion,
        outcome: outcome
    });
};

MemorySystem.prototype.calculateImportance = function(type, outcome) {
    const baseImportance = {
        'chat': MemoryImportance.MINOR,
        'argument': MemoryImportance.IMPORTANT,
        'kiss': MemoryImportance.MAJOR,
        'gift': MemoryImportance.MODERATE,
        'betrayal': MemoryImportance.LIFE_CHANGING,
        'help': MemoryImportance.MODERATE
    };
    
    let importance = baseImportance[type] || MemoryImportance.MINOR;
    
    // Ajuster selon le résultat
    if (outcome === 'very_positive') importance++;
    if (outcome === 'very_negative') importance++;
    
    return Math.min(MemoryImportance.LIFE_CHANGING, importance);
};

// Instance globale
const Memory = new MemorySystem();