class Tower {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width  = 50;
        this.height = 50;

        this.range    = 220;
        this.damage   = 0.5;
        this.fireRate = 55;
        this.timer    = 0;
        this.flash    = 0;
        this.angle    = 0;   // points toward last target
    }

    update(enemies, projectiles) {
        this.timer++;
        if (this.flash > 0) this.flash--;
        if (this.timer < this.fireRate) return;

        // Find closest enemy in range
        let closest = null;
        let minDist = Infinity;
        const cx = this.x + 25, cy = this.y + 25;

        for (const enemy of enemies) {
            const dx = enemy.x + enemy.width  / 2 - cx;
            const dy = enemy.y + enemy.height / 2 - cy;
            const d  = Math.sqrt(dx * dx + dy * dy);
            if (d < this.range && d < minDist) {
                minDist = d;
                closest = enemy;
            }
        }

        if (closest) {
            const tx = closest.x + closest.width  / 2;
            const ty = closest.y + closest.height / 2;
            this.angle = Math.atan2(ty - cy, tx - cx);
            projectiles.push(new Projectile(cx, cy, tx, ty, 7, this.damage, "#cc88ff", 4));
            this.timer = 0;
            this.flash = 10;
            burst(cx, cy, "#cc88ff", 4, 2, 2);
        }
    }

    draw(ctx) {
        const cx = this.x + 25, cy = this.y + 25;

        // Range ring
        ctx.beginPath();
        ctx.arc(cx, cy, this.range, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(180,100,255,0.06)";
        ctx.lineWidth   = 1;
        ctx.stroke();

        ctx.save();
        ctx.translate(cx, cy);

        // Hexagon base
        ctx.shadowBlur  = this.flash > 0 ? 38 : 18;
        ctx.shadowColor = "#cc88ff";
        ctx.fillStyle   = "#cc88ff";
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
            i === 0
                ? ctx.moveTo(Math.cos(a) * 22, Math.sin(a) * 22)
                : ctx.lineTo(Math.cos(a) * 22, Math.sin(a) * 22);
        }
        ctx.closePath();
        ctx.fill();

        // Rotating barrel
        ctx.save();
        ctx.rotate(this.angle);
        ctx.fillStyle = "#eeccff";
        ctx.shadowBlur = 8;
        ctx.fillRect(0, -3, 20, 6);
        ctx.restore();

        // Inner core
        ctx.fillStyle   = "rgba(2,6,16,0.75)";
        ctx.shadowBlur  = 0;
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}