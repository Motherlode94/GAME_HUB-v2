function checkInteraction(a, b) {
    if (a.isDead || b.isDead) return;
    
    const dist = Math.hypot(a.x - b.x, a.y - b.y);
    const interactionRange = 50;
    
    if (dist < interactionRange) {
        // Détermine le type d'interaction basé sur les relations
        const aRelation = a.relations[b.id];
        const bRelation = b.relations[a.id];
        
        if (!aRelation || !bRelation) return;
        
        // Interaction automatique si très proche
        if (dist < 30 && Math.random() < 0.02) {
            const interactionType = determineInteractionType(aRelation, bRelation);
            processInteraction(a, b, interactionType);
        }
        
        // Interaction manuelle avec Espace
        if (Input.spacePressed && a.id === 'P') {
            const interactionType = determineInteractionType(aRelation, bRelation);
            processInteraction(a, b, interactionType);
        }
    }
}

function determineInteractionType(relationA, relationB) {
    const avgAffection = (relationA.affection + relationB.affection) / 2;
    
    if (avgAffection > 80) return 'hug';
    if (avgAffection > 60) return 'friendly_talk';
    if (avgAffection > 40) return 'casual_talk';
    if (avgAffection < 20) return 'argue';
    if (avgAffection < 30) return 'cold_talk';
    
    return 'neutral_talk';
}

function processInteraction(a, b, type) {
    const interactions = {
        'hug': {
            affectionChange: 3,
            trustChange: 2,
            energyCost: 5,
            message: '💙 Câlin chaleureux'
        },
        'friendly_talk': {
            affectionChange: 2,
            trustChange: 1,
            energyCost: 2,
            message: '😊 Discussion amicale'
        },
        'casual_talk': {
            affectionChange: 1,
            trustChange: 0.5,
            energyCost: 1,
            message: '🗣️ Conversation'
        },
        'neutral_talk': {
            affectionChange: 0.5,
            trustChange: 0,
            energyCost: 1,
            message: '💬 Échange neutre'
        },
        'cold_talk': {
            affectionChange: -0.5,
            trustChange: -0.5,
            energyCost: 2,
            message: '❄️ Échange froid'
        },
        'argue': {
            affectionChange: -2,
            trustChange: -1,
            energyCost: 5,
            message: '😠 Dispute'
        }
    };
    
    const interaction = interactions[type];
    if (!interaction) return;
    
    // Applique les changements de relation
    a.relations[b.id].modify(interaction.affectionChange, interaction.trustChange);
    b.relations[a.id].modify(interaction.affectionChange, interaction.trustChange);
    
    // Coût en énergie
    a.needs.energy = Math.max(0, a.needs.energy - interaction.energyCost);
    b.needs.energy = Math.max(0, b.needs.energy - interaction.energyCost);
    
    // Événement de conséquence
    Consequences.add({
        type: 'interaction',
        subtype: type,
        actors: [a.id, b.id],
        message: interaction.message
    });
    
    // Affiche le message
    showInteractionFeedback(a, b, interaction.message);
}

function showInteractionFeedback(a, b, message) {
    const midX = (a.x + b.x) / 2;
    const midY = (a.y + b.y) / 2;
    
    const feedback = document.createElement('div');
    feedback.className = 'interaction-feedback';
    feedback.textContent = message;
    feedback.style.left = midX + 'px';
    feedback.style.top = (midY - 30) + 'px';
    
    const world = document.getElementById('world');
    if (world) {
        world.appendChild(feedback);
        setTimeout(() => feedback.remove(), 2000);
    }
}

// Check si deux personnages sont proches
function areClose(a, b, range = 50) {
    return Math.hypot(a.x - b.x, a.y - b.y) < range;
}