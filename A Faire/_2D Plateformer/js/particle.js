// ─────────────────────────────────────────────
//  particle.js  –  visual effect particles
// ─────────────────────────────────────────────
class Particle {
    constructor(x, y, vx, vy, color, size, life) {
        this.x       = x;
        this.y       = y;
        this.vx      = vx;
        this.vy      = vy;
        this.color   = color;
        this.size    = size;
        this.life    = life;
        this.maxLife = life;
        this.dead    = false;
    }

    update() {
        this.x  += this.vx;
        this.y  += this.vy;
        this.vy += 0.28;      // gravity
        this.vx *= 0.96;      // drag
        this.life--;
        if (this.life <= 0) this.dead = true;
    }

    draw(ctx) {
        var alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle   = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.max(0.5, this.size * alpha), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// ── Spawn helpers ─────────────────────────────
function spawnStompParticles(list, x, y) {
    var colors = ['#ff4444', '#ff8800', '#ffcc00', '#ffffff'];
    for (var i = 0; i < 18; i++) {
        var angle = (Math.random() * Math.PI * 2);
        var speed = 1.5 + Math.random() * 4;
        list.push(new Particle(
            x, y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed - 2,
            colors[Math.floor(Math.random() * colors.length)],
            3 + Math.random() * 4,
            25 + Math.random() * 20
        ));
    }
}

function spawnCoinParticles(list, x, y) {
    for (var i = 0; i < 8; i++) {
        var angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
        var speed = 1 + Math.random() * 3;
        list.push(new Particle(
            x, y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            Math.random() > 0.5 ? '#ffd700' : '#fff9c0',
            2 + Math.random() * 3,
            20 + Math.random() * 15
        ));
    }
}

function spawnDeathParticles(list, x, y) {
    for (var i = 0; i < 22; i++) {
        var angle = Math.random() * Math.PI * 2;
        var speed = 1 + Math.random() * 5;
        list.push(new Particle(
            x, y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed - 3,
            Math.random() > 0.4 ? '#e94560' : '#ffffff',
            2 + Math.random() * 5,
            35 + Math.random() * 25
        ));
    }
}