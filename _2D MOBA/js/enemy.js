// ─────────────────────────────────────────────
//  ENEMY DEFINITIONS
//  grunt  – basic unit
//  scout  – fast, erratic
//  tank   – slow, tanky
//  brute  – balanced but aggressive
// ─────────────────────────────────────────────
const ENEMY_DEFS = {
    grunt: { width:30, height:30, hp:50,  speed:1.0,  damage:0.15, range:45, color:"#ff6600", gold:5,  score:10 },
    scout: { width:22, height:22, hp:25,  speed:2.5,  damage:0.10, range:35, color:"#ffdd00", gold:8,  score:15 },
    tank:  { width:46, height:46, hp:160, speed:0.45, damage:0.30, range:58, color:"#993300", gold:18, score:30 },
    brute: { width:36, height:36, hp:90,  speed:1.4,  damage:0.22, range:52, color:"#cc00cc", gold:13, score:22 },
};

class Enemy {
    constructor(x, y, type) {
        this.type = type || "grunt";
        const d = ENEMY_DEFS[this.type];
        Object.assign(this, d);
        this.x = x;
        this.y = y;
        this.maxHp  = d.hp;
        this.state  = "walk";
        this.hitFlash = 0;
        this.wobble = Math.random() * Math.PI * 2;
    }

    update(player) {
        if (this.hitFlash > 0) this.hitFlash--;
        this.wobble += 0.05;

        const cx = this.x + this.width  / 2;
        const cy = this.y + this.height / 2;
        const px = player.x + player.width  / 2;
        const py = player.y + player.height / 2;

        const dx   = px - cx;
        const dy   = py - cy;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        if (dist < this.range) {
            this.state = "attack";
            player.takeDamage(this.damage);
        } else {
            this.state = "walk";
            const spd = this.type === "scout"
                ? this.speed + Math.sin(this.wobble) * 0.6
                : this.speed;
            this.x += (dx / dist) * spd;
            this.y += (dy / dist) * spd;
        }
    }

    draw(ctx) {
        const cx  = this.x + this.width  / 2;
        const cy  = this.y + this.height / 2;
        const r   = this.width / 2;
        const col = this.hitFlash > 0 ? "#ffffff" : this.color;

        ctx.save();
        ctx.shadowBlur  = this.hitFlash > 0 ? 24 : 10;
        ctx.shadowColor = col;
        ctx.fillStyle   = col;

        if (this.type === "grunt") {
            ctx.fillRect(this.x, this.y, this.width, this.height);

        } else if (this.type === "scout") {
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(this.wobble * 0.3);
            ctx.beginPath();
            ctx.moveTo(0, -r);
            ctx.lineTo(r, r);
            ctx.lineTo(-r, r);
            ctx.closePath();
            ctx.fill();
            ctx.restore();

        } else if (this.type === "tank") {
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.strokeStyle = col;
            ctx.lineWidth   = 3;
            ctx.strokeRect(this.x - 4, this.y - 4, this.width + 8, this.height + 8);

        } else if (this.type === "brute") {
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "rgba(2,6,16,0.5)";
            ctx.beginPath();
            ctx.arc(cx, cy, r * 0.45, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // HP bar
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(this.x, this.y - 9, this.width, 4);
        ctx.shadowBlur  = 4;
        ctx.shadowColor = this.color;
        ctx.fillStyle   = this.color;
        ctx.fillRect(this.x, this.y - 9, this.width * (this.hp / this.maxHp), 4);
        ctx.shadowBlur  = 0;
    }
}