function updateNPC(npc) {
    if (npc.isDead) return;
    
    // Détermine le comportement basé sur l'état émotionnel et les besoins
    const behavior = decideBehavior(npc);
    
    switch(behavior) {
        case 'seek_player':
            seekTarget(npc, player);
            break;
        case 'flee_player':
            fleeFrom(npc, player);
            break;
        case 'wander':
            wander(npc);
            break;
        case 'rest':
            // Ne bouge pas
            break;
        case 'mourn':
            // Bouge lentement, sans but
            if (Math.random() < 0.3) wander(npc, 0.5);
            break;
    }
}

function decideBehavior(npc) {
    // Si dévasté/triste, reste immobile ou bouge peu
    if (npc.emotions.state === 'devastated') {
        return 'mourn';
    }
    
    if (npc.emotions.state === 'sad' && Math.random() < 0.7) {
        return 'mourn';
    }
    
    // Si énergie faible, reste immobile
    if (npc.needs.energy < 20) {
        return 'rest';
    }
    
    // Vérifie la relation avec le joueur
    const playerRelation = npc.relations['P'];
    if (playerRelation) {
        if (playerRelation.affection > 70 && !player.isDead) {
            return 'seek_player';
        }
        if (playerRelation.affection < 20) {
            return 'flee_player';
        }
    }
    
    return 'wander';
}

function seekTarget(npc, target) {
    const dx = target.x - npc.x;
    const dy = target.y - npc.y;
    const dist = Math.hypot(dx, dy);
    
    if (dist > 40) {
        npc.x += (dx / dist) * 1.5;
        npc.y += (dy / dist) * 1.5;
    }
}

function fleeFrom(npc, target) {
    const dx = target.x - npc.x;
    const dy = target.y - npc.y;
    const dist = Math.hypot(dx, dy);
    
    if (dist < 150) {
        npc.x -= (dx / dist) * 2;
        npc.y -= (dy / dist) * 2;
    } else {
        wander(npc);
    }
}

function wander(npc, speedMult = 1) {
    if (Math.random() < 0.02) {
        const angle = Math.random() * Math.PI * 2;
        npc.x += Math.cos(angle) * 2 * speedMult;
        npc.y += Math.sin(angle) * 2 * speedMult;
        
        // Garde dans les limites - ajusté pour le monde extérieur
        const maxX = WorldManager.isOutdoor() ? 2400 : 800;
        const maxY = WorldManager.isOutdoor() ? 1800 : 600;
        npc.x = Math.max(0, Math.min(maxX, npc.x));
        npc.y = Math.max(0, Math.min(maxY, npc.y));
    }
}