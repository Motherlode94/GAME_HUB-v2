// Système de particules pour Blood Eclipse

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        
        // Vélocité aléatoire
        const angle = Math.random() * Math.PI * 2;
        const speed = Utils.randomRange(2, 8);
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        // Propriétés
        this.size = Utils.randomRange(2, 6);
        this.life = 1;
        this.decay = Utils.randomRange(0.02, 0.05);
        this.gravity = Utils.randomRange(0, 0.1);
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        
        // Friction
        this.vx *= 0.98;
        this.vy *= 0.98;
        
        this.life -= this.decay;
        
        return this.life > 0;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }
    
    emit(x, y, color, count = 10) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }
    
    // Émission directionnelle
    emitDirectional(x, y, color, angle, spread, count = 10) {
        for (let i = 0; i < count; i++) {
            const particle = new Particle(x, y, color);
            const particleAngle = angle + Utils.randomRange(-spread, spread);
            const speed = Utils.randomRange(3, 10);
            particle.vx = Math.cos(particleAngle) * speed;
            particle.vy = Math.sin(particleAngle) * speed;
            this.particles.push(particle);
        }
    }
    
    // Traînée de particules
    trail(x, y, color, count = 3) {
        for (let i = 0; i < count; i++) {
            const particle = new Particle(x, y, color);
            particle.vx *= 0.3;
            particle.vy *= 0.3;
            particle.size = Utils.randomRange(1, 3);
            particle.decay = Utils.randomRange(0.05, 0.1);
            this.particles.push(particle);
        }
    }
    
    update() {
        this.particles = this.particles.filter(p => p.update());
    }
    
    draw(ctx) {
        this.particles.forEach(p => p.draw(ctx));
    }
    
    clear() {
        this.particles = [];
    }
}