function move(c, dx, dy, speed = 2) {
    if (c.isDead) return;
    
    // Applique la vitesse
    c.x += dx * speed;
    c.y += dy * speed;
    
    // Limites du monde - ajustées pour le quartier extérieur
    const maxX = WorldManager.isOutdoor() ? 2400 : 800;
    const maxY = WorldManager.isOutdoor() ? 1800 : 600;
    
    c.x = Math.max(0, Math.min(maxX, c.x));
    c.y = Math.max(0, Math.min(maxY, c.y));
    
    // Coût en énergie pour bouger
    if (dx !== 0 || dy !== 0) {
        c.needs.energy = Math.max(0, c.needs.energy - 0.02);
    }
}

function moveTowards(c, targetX, targetY, speed = 2) {
    if (c.isDead) return;
    
    const dx = targetX - c.x;
    const dy = targetY - c.y;
    const dist = Math.hypot(dx, dy);
    
    if (dist > speed) { // On bouge seulement si on est plus loin que la vitesse d'un pas
        move(c, dx / dist, dy / dist, speed);
    } else {
        // On se téléporte sur la cible pour être précis et on arrête le mouvement
        c.x = targetX;
        c.y = targetY;
    }
}

function moveAway(c, targetX, targetY, speed = 2) {
    if (c.isDead) return;
    
    const dx = c.x - targetX;
    const dy = c.y - targetY;
    const dist = Math.hypot(dx, dy);
    
    if (dist > 0) {
        move(c, dx / dist, dy / dist, speed);
    }
}

function getDistance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

function getDirection(from, to) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.hypot(dx, dy);
    
    return {
        dx: dist > 0 ? dx / dist : 0,
        dy: dist > 0 ? dy / dist : 0,
        distance: dist
    };
}

function isInBounds(x, y, margin = 0) {
    const maxX = WorldManager.isOutdoor() ? 2400 : 800;
    const maxY = WorldManager.isOutdoor() ? 1800 : 600;
    
    return x >= margin && x <= maxX - margin && 
           y >= margin && y <= maxY - margin;
}