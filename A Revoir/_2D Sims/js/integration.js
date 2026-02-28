// ============================================================================
// INTEGRATION GUIDE
// ============================================================================
// Ce fichier explique comment intégrer tous les nouveaux systèmes ensemble

/*
ORDRE DE CHARGEMENT DES FICHIERS:
---------------------------------
1. time.js (déjà existant)
2. relationship.js (déjà existant)
3. death.js (déjà existant)
4. family.js (nouveau)
5. aging.js (nouveau)
6. seasons.js (nouveau)
7. memory.js (nouveau)
8. jealousy.js (nouveau)
9. routines.js (nouveau)
10. socialNeeds.js (nouveau)
11. reputation.js (nouveau)
12. integration.js (ce fichier)
*/

// ============================================================================
// INITIALISATION D'UN NOUVEAU PERSONNAGE
// ============================================================================

function initializeCharacter(charId, options = {}) {
    // Vieillissement
    Aging.register(charId, options.age || 20);
    
    // Routine
    const stage = Aging.getStage(charId);
    const routineType = stage === 'Child' || stage === 'Teen' ? 'student' : 'default';
    Routines.createRoutine(charId, routineType);
    
    // Besoins sociaux
    SocialNeeds.initialize(charId);
    
    // Réputation
    Reputation.initialize(charId);
    
    // Mémoire
    // Pas d'initialisation nécessaire, se crée automatiquement
    
    console.log(`✨ Personnage ${charId} initialisé avec tous les systèmes`);
}

// ============================================================================
// BOUCLE DE MISE À JOUR PRINCIPALE (à appeler chaque tick)
// ============================================================================

function updateAllSystems() {
    // 1. Mettre à jour le temps
    Time.tick();
    
    // 2. Mettre à jour la saison
    Season.update();
    
    // 3. Pour chaque personnage
    // Support both chars array (game.js) and characters object
    const characterList = typeof chars !== 'undefined' ? chars : 
                         typeof characters !== 'undefined' ? Object.values(characters) : [];
    
    characterList.forEach(char => {
        if (char.isDead) return; // Ignorer les morts
        
        const charId = char.id;
        
        // Vieillissement
        Aging.update(charId);
        
        // Vérifier mort naturelle
        const naturalDeath = Aging.checkNaturalDeath(charId);
        if (naturalDeath) {
            handleDeath(char, 'old_age');
            return;
        }
        
        // Besoins sociaux
        SocialNeeds.update(charId, char);
        
        // Déclin de la mémoire
        Memory.decay(charId);
        
        // Adapter la routine à la saison
        if (Time.day % 30 === 0) { // Tous les 30 jours
            Routines.adaptRoutineToSeason(charId);
        }
        
        // Mettre à jour les triangles amoureux
        Jealousy.updateTriangles();
    });
}

// ============================================================================
// GESTION DES INTERACTIONS
// ============================================================================

function handleInteraction(char1, char2, interactionType) {
    const quality = determineInteractionQuality(char1, char2, interactionType);
    
    // 1. Besoins sociaux
    SocialNeeds.onInteraction(char1.id, char2.id, quality);
    SocialNeeds.onInteraction(char2.id, char1.id, quality);
    
    // 2. Créer un souvenir pour les deux
    const emotion = quality === 'positive' ? 'happy' : quality === 'negative' ? 'sad' : 'neutral';
    Memory.recordInteraction(char1.id, char2.id, interactionType, quality, emotion);
    
    // 3. Modifier les relations (support both 'relationships' and 'relations')
    const affectionChange = quality === 'positive' ? 5 : quality === 'negative' ? -5 : 0;
    const char1Relations = char1.relationships || char1.relations;
    const char2Relations = char2.relationships || char2.relations;
    
    if (char1Relations && char1Relations[char2.id]) {
        char1Relations[char2.id].modify(affectionChange, 0);
    }
    if (char2Relations && char2Relations[char1.id]) {
        char2Relations[char1.id].modify(affectionChange, 0);
    }
    
    // 4. Vérifier jalousie (si un tiers est concerné)
    checkForJealousy(char1, char2);
    
    // 5. Impact sur la réputation (si interaction publique)
    if (interactionType === 'help') {
        Reputation.modify(char1.id, ReputationCategories.KINDNESS, 2, 'helped someone');
    } else if (interactionType === 'argument') {
        Reputation.modify(char1.id, ReputationCategories.KINDNESS, -3, 'had an argument');
    }
    
    return {
        type: 'interaction',
        participants: [char1.id, char2.id],
        interactionType: interactionType,
        quality: quality,
        timestamp: Time.current
    };
}

function determineInteractionQuality(char1, char2, type) {
    // Facteurs influençant la qualité
    let score = 0;
    
    // 1. Relation actuelle (support both 'relationships' and 'relations')
    const char1Relations = char1.relationships || char1.relations;
    if (char1Relations && char1Relations[char2.id]) {
        score += (char1Relations[char2.id].affection - 50) / 10;
    }
    
    // 2. Souvenirs passés
    const memories = Memory.analyzeRelationshipMemories(char1.id, char2.id);
    score += memories.averageEmotion * 5;
    
    // 3. État social actuel
    if (SocialNeeds.isOverwhelmed(char1.id)) score -= 3;
    if (SocialNeeds.needsSocialInteraction(char1.id)) score += 2;
    
    // 4. Rivalité
    if (Jealousy.isRival(char1.id, char2.id)) {
        score -= 5;
    }
    
    // 5. Saison et météo
    score += Season.getMoodBonus() / 10;
    
    if (score > 3) return 'positive';
    if (score < -3) return 'negative';
    return 'neutral';
}

function checkForJealousy(char1, char2) {
    // Vérifier si d'autres personnages sont jaloux de cette interaction
    const characterList = typeof chars !== 'undefined' ? chars : 
                         typeof characters !== 'undefined' ? Object.values(characters) : [];
    
    characterList.forEach(char => {
        if (char.id === char1.id || char.id === char2.id) return;
        if (char.isDead) return;
        
        // Vérifier si ce personnage a une relation forte avec l'un des deux
        if (char.relationships || char.relations) {
            const relationships = char.relationships || char.relations;
            const rel1 = relationships[char1.id];
            const rel2 = relationships[char2.id];
            
            if (rel1 && rel1.affection > 70) {
                Jealousy.checkJealousy(char.id, char1.id, char2.id);
            }
            if (rel2 && rel2.affection > 70) {
                Jealousy.checkJealousy(char.id, char2.id, char1.id);
            }
        }
    });
}

// ============================================================================
// GESTION DES ÉVÉNEMENTS FAMILIAUX
// ============================================================================

function handleMarriage(char1, char2) {
    // 1. Enregistrer le mariage dans le système familial
    const marriageEvent = FamilySystem.marry(char1.id, char2.id);
    
    // 2. Créer des souvenirs
    Memory.addMemory(char1.id, {
        type: MemoryTypes.EVENT,
        importance: MemoryImportance.LIFE_CHANGING,
        content: `Married ${char2.id}`,
        participants: [char2.id],
        emotion: 'love'
    });
    
    Memory.addMemory(char2.id, {
        type: MemoryTypes.EVENT,
        importance: MemoryImportance.LIFE_CHANGING,
        content: `Married ${char1.id}`,
        participants: [char1.id],
        emotion: 'love'
    });
    
    // 3. Améliorer les relations (support both 'relationships' and 'relations')
    const char1Relations = char1.relationships || char1.relations;
    const char2Relations = char2.relationships || char2.relations;
    
    if (char1Relations && char1Relations[char2.id]) {
        char1Relations[char2.id].modify(30, 20);
    }
    if (char2Relations && char2Relations[char1.id]) {
        char2Relations[char1.id].modify(30, 20);
    }
    
    // 4. Réputation
    Reputation.modify(char1.id, ReputationCategories.ROMANCE, 10, 'got married');
    Reputation.modify(char2.id, ReputationCategories.ROMANCE, 10, 'got married');
    
    // 5. Résoudre d'éventuels triangles amoureux
    Jealousy.triangles.forEach(triangle => {
        if (triangle.center === char1.id || triangle.center === char2.id) {
            console.log('💔 Triangle amoureux résolu par le mariage');
        }
    });
    
    return marriageEvent;
}

function handleBirth(parent1, parent2, babyId) {
    // 1. Enregistrer la naissance
    const birthEvent = FamilySystem.haveBaby(parent1.id, parent2.id, babyId);
    
    // 2. Initialiser le bébé
    initializeCharacter(babyId, { age: 0 });
    
    // 3. Créer des souvenirs pour les parents
    Memory.addMemory(parent1.id, {
        type: MemoryTypes.EVENT,
        importance: MemoryImportance.LIFE_CHANGING,
        content: `Had a baby: ${babyId}`,
        participants: [parent2.id, babyId],
        emotion: 'love'
    });
    
    Memory.addMemory(parent2.id, {
        type: MemoryTypes.EVENT,
        importance: MemoryImportance.LIFE_CHANGING,
        content: `Had a baby: ${babyId}`,
        participants: [parent1.id, babyId],
        emotion: 'love'
    });
    
    // 4. Créer des relations familiales automatiques
    // (à implémenter selon votre système de relations)
    
    return birthEvent;
}

function handleDeath(character, cause) {
    // 1. Marquer comme mort
    character.isDead = true;
    if (character.el) character.el.classList.add('dead');
    
    // 2. Créer l'événement de mort
    Consequences.add({
        type: 'death',
        actors: [character.id],
        deceased: character.id,
        cause: cause,
        timestamp: Time.current
    });
    
    // 3. Gérer l'héritage
    const inheritance = FamilySystem.handleDeath(character.id);
    if (inheritance) {
        console.log(`💰 Héritage distribué:`, inheritance);
    }
    
    // 4. Créer des souvenirs de deuil pour les proches
    const characterList = typeof chars !== 'undefined' ? chars : 
                         typeof characters !== 'undefined' ? Object.values(characters) : [];
    
    characterList.forEach(char => {
        if (char.isDead || char.id === character.id) return;
        
        const charRelations = char.relationships || char.relations;
        if (charRelations && charRelations[character.id]) {
            const rel = charRelations[character.id];
            
            // Plus la relation était forte, plus le deuil est important
            const griefLevel = Math.floor(rel.affection / 20);
            
            Memory.addMemory(char.id, {
                type: MemoryTypes.EVENT,
                importance: MemoryImportance.MAJOR,
                content: `${character.id} died`,
                participants: [character.id],
                emotion: 'sad'
            });
            
            // Impact sur les besoins sociaux
            SocialNeeds.socialNeeds[char.id].loneliness += griefLevel * 5;
            
            // Réaction de la relation
            rel.react({
                type: 'death',
                deceased: character.id
            }, char);
        }
    });
    
    // 5. Impact sur la réputation (les morts deviennent souvent des légendes)
    if (Reputation.reputations[character.id]) {
        Reputation.reputations[character.id].overall += 10;
    }
}

// ============================================================================
// ÉVÉNEMENTS SAISONNIERS
// ============================================================================

function handleSeasonChange() {
    const event = Season.nextSeason();
    
    // Adapter toutes les routines
    const characterList = typeof chars !== 'undefined' ? chars : 
                         typeof characters !== 'undefined' ? Object.values(characters) : [];
    
    characterList.forEach(char => {
        if (!char.isDead) {
            Routines.adaptRoutineToSeason(char.id);
        }
    });
    
    // Créer un souvenir collectif
    console.log(`🍂 Changement de saison: ${Seasons[event.season].name}`);
}

// ============================================================================
// EXEMPLES D'UTILISATION
// ============================================================================

/*
// Initialiser 3 personnages
initializeCharacter('alice', { age: 25 });
initializeCharacter('bob', { age: 28 });
initializeCharacter('charlie', { age: 22 });

// Alice et Bob se marient
handleMarriage(characters.alice, characters.bob);

// Ils ont un bébé
handleBirth(characters.alice, characters.bob, 'baby_david');

// Charlie est jaloux d'Alice
Jealousy.checkJealousy('charlie', 'alice', 'bob');

// Une interaction quotidienne
handleInteraction(characters.alice, characters.charlie, 'chat');

// Bob aide Charlie
handleInteraction(characters.bob, characters.charlie, 'help');

// Consulter les souvenirs d'Alice
const aliceMemories = Memory.getMemoriesAbout('alice', 'bob');
console.log('Souvenirs d\'Alice à propos de Bob:', aliceMemories);

// Vérifier la réputation de Bob
const bobRep = Reputation.getSocialClass('bob');
console.log('Classe sociale de Bob:', bobRep.name);

// Routine actuelle de Charlie
const charlieActivity = Routines.getScheduledActivity('charlie');
console.log('Charlie devrait faire:', charlieActivity);
*/

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getCharacterSummary(charId) {
    return {
        age: Aging.getAge(charId),
        stage: Aging.getStage(charId),
        socialClass: Reputation.getSocialClass(charId).name,
        socialStatus: SocialNeeds.getSocialStatus(charId),
        currentActivity: Routines.getScheduledActivity(charId),
        memoryCount: Memory.memories[charId] ? Memory.memories[charId].length : 0,
        family: FamilySystem.members[charId],
        rivals: Jealousy.rivalries[charId] ? Jealousy.rivalries[charId].length : 0
    };
}

console.log('✅ Systèmes d\'intégration chargés');