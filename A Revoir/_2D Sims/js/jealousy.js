// ============================================================================
// JEALOUSY & RIVALRY SYSTEM
// ============================================================================

function JealousySystem() {
    this.rivalries = {}; // charId -> [list of rivals]
    this.jealousyLevels = {}; // charId -> { targetId: jealousyLevel }
    this.triangles = []; // Love triangles and conflicts
}

JealousySystem.prototype.checkJealousy = function(observer, target, rival) {
    // Observer est jaloux de rival concernant target
    
    if (!this.jealousyLevels[observer]) {
        this.jealousyLevels[observer] = {};
    }
    
    const relationship = this.getRelationship(observer, target);
    const rivalRelationship = this.getRelationship(rival, target);
    
    // Facteurs de jalousie
    let jealousyScore = 0;
    
    // 1. Affection de l'observateur pour la cible
    if (relationship && relationship.affection > 70) {
        jealousyScore += 30;
    }
    
    // 2. Proximité du rival avec la cible
    if (rivalRelationship && rivalRelationship.affection > relationship.affection) {
        jealousyScore += 20;
    }
    
    // 3. Type de relation
    const relationType = FamilySystem.getRelationType(observer, target);
    if (relationType === 'spouse') {
        jealousyScore += 40; // Très jaloux si c'est le conjoint
    } else if (relationType === 'child' || relationType === 'parent') {
        jealousyScore += 25; // Jalousie familiale
    }
    
    // 4. Personnalité (à intégrer si vous avez un système de traits)
    // jealousyScore += personality.jealousy * 20;
    
    // Enregistrer le niveau de jalousie
    if (!this.jealousyLevels[observer][rival]) {
        this.jealousyLevels[observer][rival] = 0;
    }
    
    this.jealousyLevels[observer][rival] = Math.min(100, 
        this.jealousyLevels[observer][rival] + jealousyScore);
    
    // Créer une rivalité si la jalousie est élevée
    if (this.jealousyLevels[observer][rival] > 60) {
        this.createRivalry(observer, rival, target, 'jealousy');
    }
    
    return {
        type: 'jealousy',
        observer: observer,
        target: target,
        rival: rival,
        level: this.jealousyLevels[observer][rival],
        timestamp: Time.current
    };
};

JealousySystem.prototype.createRivalry = function(char1, char2, cause, type = 'general') {
    if (!this.rivalries[char1]) this.rivalries[char1] = [];
    if (!this.rivalries[char2]) this.rivalries[char2] = [];
    
    const rivalry = {
        id: 'rivalry_' + Date.now(),
        characters: [char1, char2],
        cause: cause,
        type: type, // 'jealousy', 'professional', 'personal', 'family'
        intensity: 50,
        startTime: Time.current,
        incidents: []
    };
    
    this.rivalries[char1].push(rivalry);
    this.rivalries[char2].push(rivalry);
    
    // Affecter les relations
    const rel1 = this.getRelationship(char1, char2);
    const rel2 = this.getRelationship(char2, char1);
    
    if (rel1) rel1.modify(-20, -15);
    if (rel2) rel2.modify(-20, -15);
    
    console.log(`⚡ Rivalité créée entre ${char1} et ${char2} à cause de ${cause}`);
    
    return rivalry;
};

JealousySystem.prototype.isRival = function(char1, char2) {
    if (!this.rivalries[char1]) return false;
    
    return this.rivalries[char1].some(rivalry => 
        rivalry.characters.includes(char2)
    );
};

JealousySystem.prototype.getRivalryIntensity = function(char1, char2) {
    if (!this.rivalries[char1]) return 0;
    
    const rivalry = this.rivalries[char1].find(r => 
        r.characters.includes(char2)
    );
    
    return rivalry ? rivalry.intensity : 0;
};

JealousySystem.prototype.resolveRivalry = function(char1, char2) {
    if (!this.rivalries[char1]) return;
    
    // Retirer la rivalité
    this.rivalries[char1] = this.rivalries[char1].filter(r => 
        !r.characters.includes(char2)
    );
    
    if (this.rivalries[char2]) {
        this.rivalries[char2] = this.rivalries[char2].filter(r => 
            !r.characters.includes(char1)
        );
    }
    
    // Améliorer légèrement les relations
    const rel1 = this.getRelationship(char1, char2);
    const rel2 = this.getRelationship(char2, char1);
    
    if (rel1) rel1.modify(10, 5);
    if (rel2) rel2.modify(10, 5);
    
    return {
        type: 'rivalry_resolved',
        characters: [char1, char2],
        timestamp: Time.current
    };
};

JealousySystem.prototype.addIncident = function(char1, char2, description) {
    if (!this.rivalries[char1]) return;
    
    const rivalry = this.rivalries[char1].find(r => 
        r.characters.includes(char2)
    );
    
    if (rivalry) {
        rivalry.incidents.push({
            description: description,
            timestamp: Time.current,
            instigator: char1
        });
        
        // Augmenter l'intensité
        rivalry.intensity = Math.min(100, rivalry.intensity + 10);
    }
};

// Détection des triangles amoureux
JealousySystem.prototype.detectLoveTriangle = function(char1, char2, char3) {
    // Vérifier si char1 et char3 aiment tous les deux char2
    const rel1 = this.getRelationship(char1, char2);
    const rel2 = this.getRelationship(char3, char2);
    
    if (rel1 && rel2 && rel1.affection > 70 && rel2.affection > 70) {
        const triangle = {
            id: 'triangle_' + Date.now(),
            characters: [char1, char2, char3],
            center: char2, // La personne convoitée
            suitors: [char1, char3],
            tension: 50,
            created: Time.current
        };
        
        this.triangles.push(triangle);
        
        // Créer jalousie mutuelle entre les prétendants
        this.checkJealousy(char1, char2, char3);
        this.checkJealousy(char3, char2, char1);
        
        return triangle;
    }
    
    return null;
};

JealousySystem.prototype.updateTriangles = function() {
    this.triangles = this.triangles.filter(triangle => {
        // Vérifier si le triangle est toujours valide
        const [char1, char2, char3] = triangle.characters;
        
        const rel1 = this.getRelationship(char1, char2);
        const rel2 = this.getRelationship(char3, char2);
        
        // Le triangle se résout si une des personnes n'est plus intéressée
        if (!rel1 || !rel2 || rel1.affection < 50 || rel2.affection < 50) {
            console.log(`💔 Triangle amoureux résolu: ${triangle.id}`);
            return false;
        }
        
        return true;
    });
};

// Helper pour obtenir une relation (à adapter selon votre système)
JealousySystem.prototype.getRelationship = function(char1, char2) {
    // À implémenter selon votre système de relations
    return null; // Placeholder
};

// Instance globale
const Jealousy = new JealousySystem();