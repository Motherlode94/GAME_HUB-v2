// ─────────────────────────────────────────────
//  COLLISION
// ─────────────────────────────────────────────
function collisionRect(a, b) {
    return (
        a.x < b.x + b.width  &&
        a.x + a.width  > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

// ─────────────────────────────────────────────
//  PARTICLE SYSTEM
// ─────────────────────────────────────────────
const particles = [];

class Particle {
    constructor(x, y, vx, vy, radius, color, life) {
        this.x      = x;
        this.y      = y;
        this.vx     = vx;
        this.vy     = vy;
        this.radius = radius;
        this.color  = color;
        this.life   = life;
        this.maxLife = life;
    }

    update() {
        this.x  += this.vx;
        this.y  += this.vy;
        this.vx *= 0.91;
        this.vy *= 0.91;
        this.life--;
    }

    draw(ctx) {
        const alpha = Math.pow(this.life / this.maxLife, 0.7);
        ctx.save();
        ctx.globalAlpha  = alpha;
        ctx.shadowBlur   = 10;
        ctx.shadowColor  = this.color;
        ctx.fillStyle    = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

/**
 * Emit a burst of particles
 * @param {number} x
 * @param {number} y
 * @param {string} color
 * @param {number} count
 * @param {number} speed   – max speed
 * @param {number} size    – max radius
 */
function burst(x, y, color, count, speed, size) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const s     = (Math.random() * 0.6 + 0.4) * speed;
        particles.push(new Particle(
            x, y,
            Math.cos(angle) * s,
            Math.sin(angle) * s,
            Math.random() * size + 1,
            color,
            Math.floor(Math.random() * 18 + 16)
        ));
    }
}