function Character(id, x, y, type, config = {}) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.type = type;
    this.isDead = false;
    this.currentLocation = 'neighborhood'; // Par défaut
    
    // Systèmes de base
    this.needs = new Needs();
    this.emotions = new Emotions();
    this.relations = {};
    
    // Systèmes Sims
    this.skills = new Skills();
    this.traits = config.traits || [];
    this.money = config.money || 0;
    this.career = config.career || null;
    this.aspiration = config.aspiration || null;
    
    // IA autonome
    this.ai = config.autonomous ? new AutonomousAI(this) : null;
    
    // Nom
    this.name = config.name || id;
    
    // ⭐ NOUVEAUTÉ : Initialiser les nouveaux systèmes ⭐
    const age = config.age || 20;
    if (typeof initializeCharacter !== 'undefined') {
        initializeCharacter(this.id, { age: age });
    }
    
    this.el = document.createElement('div');
    this.el.className = 'character ' + type;
    this.el.setAttribute('data-id', id);
    this.el.setAttribute('data-name', this.name);
    document.getElementById('world').appendChild(this.el);
    this.draw();
}

Character.prototype.draw = function() {
    if (this.isDead) {
        this.el.style.opacity = '0.3';
        this.el.style.filter = 'grayscale(100%)';
    }
    this.el.style.left = this.x + 'px';
    this.el.style.top = this.y + 'px';
    
    // Affiche l'émotion actuelle
    this.el.setAttribute('data-emotion', this.emotions.state);
};

Character.prototype.update = function(frameCount) {
    if (this.isDead) return;

    this.needs.update(this);
    this.emotions.decay();

    // ⭐ CORRECTION : Mise à jour de l'IA plus fréquente (toutes les 10 frames au lieu de 30)
    if (frameCount && frameCount % 10 === 0) {
        if (this.aspiration) this.aspiration.checkProgress(this);
        if (this.ai) this.ai.update();
    }

    this.draw();
};

Character.prototype.react = function(ev) {
    this.emotions.react(ev, this);
    
    // Propage aux relations
    Object.values(this.relations).forEach(r => r.react(ev, this));
};