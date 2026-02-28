function Emotions() {
    this.state = 'neutral';
    this.intensity = 0;
    this.history = [];
}

Emotions.prototype.react = function(ev, character) {
    if (ev.type === 'death') {
        if (ev.deceased === character.id) {
            // Le personnage lui-même est mort
            this.setState('void', 10);
        } else {
            // Réaction basée sur la relation avec le défunt
            const relation = character.relations[ev.deceased];
            if (relation) {
                const affection = relation.affection;
                
                if (affection > 70) {
                    this.setState('devastated', 8);
                } else if (affection > 40) {
                    this.setState('sad', 5);
                } else if (affection < -40) {
                    this.setState('relieved', 3);
                } else {
                    this.setState('shocked', 2);
                }
            } else {
                // Pas de relation particulière
                this.setState('neutral_sad', 1);
            }
        }
    }
};

Emotions.prototype.setState = function(state, intensity) {
    this.history.push({
        previous: this.state,
        new: state,
        timestamp: Time.current
    });
    this.state = state;
    this.intensity = intensity || 0;
};

Emotions.prototype.decay = function() {
    if (this.intensity > 0) {
        this.intensity -= 0.01;
        if (this.intensity <= 0) {
            this.state = 'neutral';
            this.intensity = 0;
        }
    }
};