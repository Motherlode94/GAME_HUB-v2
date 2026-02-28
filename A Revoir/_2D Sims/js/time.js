const Time = {
    day: 1,
    hour: 8,
    current: 0, // Ticks totaux
    
    tick() {
        this.current++;
        this.hour += 0.01;
        
        if (this.hour >= 24) {
            this.hour = 0;
            this.day++;
            this.onNewDay();
        }
    },
    
    onNewDay() {
        console.log(`Nouveau jour : Jour ${this.day}`);
        // Événement de nouveau jour peut être traité ici
    },
    
    getPhase() {
        if (this.hour >= 6 && this.hour < 12) return 'morning';
        if (this.hour >= 12 && this.hour < 18) return 'afternoon';
        if (this.hour >= 18 && this.hour < 22) return 'evening';
        return 'night';
    },
    
    isNight() {
        return this.hour < 6 || this.hour >= 22;
    },
    
    getFormatted() {
        const h = Math.floor(this.hour);
        const m = Math.floor((this.hour % 1) * 60);
        return `Jour ${this.day}, ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }
};