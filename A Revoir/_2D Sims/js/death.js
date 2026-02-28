function checkDeath(c) {
    if (c.isDead) return;
    
    if (c.needs.energy <= 0) {
        c.isDead = true;
        c.el.classList.add('dead');
        Consequences.add({
            type: 'death',
            actors: [c.id],
            deceased: c.id,
            timestamp: Time.current
        });
    }
}