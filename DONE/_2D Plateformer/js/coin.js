// ─────────────────────────────────────────────
//  coin.js  –  collectible coin
// ─────────────────────────────────────────────
class Coin {
    constructor(x, y) {
        this.x         = x;
        this.y         = y;
        this.width     = 18;
        this.height    = 18;
        this.collected = false;
        // Stagger bob so not all coins are in sync
        this._phase = Math.random() * Math.PI * 2;
        this._timer = 0;
    }

    update() {
        if (this.collected) return;
        this._timer++;
    }

    getBounds() {
        return {
            x:      this.x,
            y:      this.y + this._bobY(),
            width:  this.width,
            height: this.height
        };
    }

    _bobY() {
        return Math.sin(this._timer * 0.06 + this._phase) * 4;
    }

    draw(ctx) {
        if (this.collected) return;

        var bob = this._bobY();
        var cx  = this.x + this.width  / 2;
        var cy  = this.y + this.height / 2 + bob;
        var r   = this.width / 2;

        ctx.save();

        // Glow
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur  = 10;

        // Body gradient
        var g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.05, cx, cy, r);
        g.addColorStop(0.0, '#fffde0');
        g.addColorStop(0.5, '#ffd700');
        g.addColorStop(1.0, '#b8860b');

        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();

        // Rim
        ctx.shadowBlur  = 0;
        ctx.strokeStyle = '#8b6914';
        ctx.lineWidth   = 1.5;
        ctx.stroke();

        // Shine highlight
        ctx.beginPath();
        ctx.arc(cx - r * 0.28, cy - r * 0.28, r * 0.28, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.fill();

        // Star glint (every 60 frames)
        var glint = (this._timer % 60) / 60;
        if (glint < 0.25) {
            ctx.globalAlpha = 1 - glint / 0.25;
            ctx.fillStyle   = '#ffffff';
            ctx.beginPath();
            ctx.arc(cx + r * 0.2, cy - r * 0.2, r * 0.18, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}