class Projectile {
    constructor(x, y, targetX, targetY, speed, damage, color, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius || 5;
        this.speed  = speed;
        this.damage = damage;
        this.color  = color;

        const dx = targetX - x;
        const dy = targetY - y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        this.vx = (dx / dist) * speed;
        this.vy = (dy / dist) * speed;

        this.life  = 200;
        this.trail = [];
    }

    update(enemies) {
        // Store trail point before moving
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 7) this.trail.shift();

        this.x += this.vx;
        this.y += this.vy;
        this.life--;

        // Out of bounds
        const canvas = document.getElementById("gameCanvas");
        if (this.x < -20 || this.x > canvas.width  + 20 ||
            this.y < -20 || this.y > canvas.height + 20) {
            this.life = 0;
            return;
        }

        // Hit detection
        for (let enemy of enemies) {
            const dx = enemy.x + enemy.width  / 2 - this.x;
            const dy = enemy.y + enemy.height / 2 - this.y;
            if (Math.sqrt(dx * dx + dy * dy) < this.radius + enemy.width / 2) {
                enemy.hp -= this.damage;
                enemy.hitFlash = 7;
                burst(this.x, this.y, this.color, 8, 3, this.radius);
                this.life = 0;
                break;
            }
        }
    }

    draw(ctx) {
        // Fading trail
        for (let i = 0; i < this.trail.length; i++) {
            ctx.save();
            ctx.globalAlpha = (i / this.trail.length) * 0.35;
            ctx.beginPath();
            ctx.arc(this.trail[i].x, this.trail[i].y, this.radius * 0.55, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.restore();
        }

        // Main projectile
        ctx.save();
        ctx.shadowBlur  = 18;
        ctx.shadowColor = this.color;
        ctx.fillStyle   = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}