class Particle {
    constructor(x, y, vx, vy, color, size, life = 1, decay = 0.04) {
        this.pos = new Vector(x, y);
        this.vel = new Vector(vx, vy);
        this.life = life;
        this.decay = decay;
        this.color = color;
        this.size = size;
        this.initialSize = size;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
    }

    update() {
        this.pos = this.pos.add(this.vel);
        this.vel = this.vel.mul(0.96);
        this.life -= this.decay;
        this.size = this.initialSize * this.life;
        this.rotation += this.rotationSpeed;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.translate(this.pos.x, this.pos.y);
        ctx.rotate(this.rotation);
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        
        if (this.size > 3) {
            // Forme plus intéressante pour les grosses particules
            ctx.beginPath();
            ctx.moveTo(this.size/2, 0);
            for (let i = 1; i < 5; i++) {
                const angle = (i * Math.PI * 2) / 5;
                const radius = this.size/2 * (i % 2 === 0 ? 0.7 : 1);
                ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
            }
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
        }
        
        ctx.shadowBlur = 0;
        ctx.restore();
    }
}
