function Relationship(targetId) {
    this.targetId = targetId;
    this.affection = 50; // 0-100, 50 = neutre
    this.trust = 50;
    this.history = [];
}

Relationship.prototype.modify = function(affectionDelta, trustDelta) {
    this.affection = Math.max(0, Math.min(100, this.affection + affectionDelta));
    this.trust = Math.max(0, Math.min(100, this.trust + (trustDelta || 0)));
    
    this.history.push({
        affection: this.affection,
        trust: this.trust,
        timestamp: Time.current
    });
};

Relationship.prototype.react = function(ev, character) {
    if (ev.type === 'death' && ev.deceased === this.targetId) {
        // La personne avec qui on a une relation est morte
        this.history.push({
            event: 'target_died',
            timestamp: Time.current,
            finalAffection: this.affection
        });
    }
};