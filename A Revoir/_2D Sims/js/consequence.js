const Consequences = {
    events: [],
    history: [],
    
    add(e) {
        e.id = 'ev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        this.events.push(e);
    },
    
    process(chars) {
        this.events.forEach(ev => {
            // Propage l'événement à tous les personnages
            chars.forEach(c => c.react(ev));
            
            // Archive l'événement
            this.history.push({
                ...ev,
                processedAt: Time.current,
                affectedCharacters: chars.map(c => ({
                    id: c.id,
                    emotionAfter: c.emotions.state,
                    intensityAfter: c.emotions.intensity
                }))
            });
        });
        
        this.events = [];
    },
    
    getHistory(type, limit = 10) {
        return this.history
            .filter(ev => !type || ev.type === type)
            .slice(-limit);
    },
    
    clear() {
        this.events = [];
        this.history = [];
    }
};