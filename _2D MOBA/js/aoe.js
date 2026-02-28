class AoE {
    constructor(x, y, radius, damage, duration, color) {
        this.x        = x;
        this.y        = y;
        this.radius   = radius;
        this.damage   = damage;
        this.duration = duration;
        this.maxDur   = duration;
        this.color    = color;
        this.hasDamaged = false;
    }

    update(enemies) {
        if (!this.hasDamaged) {
            for (let enemy of enemies) {
                const dx = enemy.x + enemy.width  / 2 - this.x;
                const dy = enemy.y + enemy.height / 2 - this.y;
                if (Math.sqrt(dx * dx + dy * dy) < this.radius) {
                    enemy.hp -= this.damage;
                    enemy.hitFlash = 12;
                    burst(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, this.color, 10, 4, 4);
                }
            }
            this.hasDamaged = true;
        }
        this.duration--;
    }

    draw(ctx) {
        const t = 1 - this.duration / this.maxDur;

        ctx.save();
        ctx.shadowBlur  = 25;
        ctx.shadowColor = this.color;

        // Expanding ring
        ctx.globalAlpha = (1 - t) * 0.65;
        ctx.strokeStyle = this.color;
        ctx.lineWidth   = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * (0.3 + t * 0.7), 0, Math.PI * 2);
        ctx.stroke();

        // Transparent fill
        ctx.globalAlpha = (1 - t) * 0.22;
        ctx.fillStyle   = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}