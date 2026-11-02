class Projectile {
    constructor(x, y, vx, vy, color, radius = 8) {
        this.pos = new Vector(x, y);
        this.vel = new Vector(vx, vy);
        this.color = color;
        this.radius = radius;
        this.life = 90;
    }
    update() {
        this.pos = this.pos.add(this.vel);
        this.life--;
        return this.life > 0 && this.pos.x > -50 && this.pos.x < canvas.width + 50 && this.pos.y > -50 && this.pos.y < canvas.height + 50;
    }
    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}