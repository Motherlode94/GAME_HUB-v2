// ─────────────────────────────────────────────
//  movingPlatform.js  –  oscillating platform
// ─────────────────────────────────────────────
class MovingPlatform {
    constructor(x, y, w, h, minX, maxX, speed) {
        this.x         = x;
        this.y         = y;
        this.width     = w;
        this.height    = h;
        this.minX      = minX;
        this.maxX      = maxX;
        this.speed     = speed;
        this.velocityX = speed;
        this.velocityY = 0;
        this._timer    = 0;
    }

    update() {
        this._timer++;
        this.x += this.velocityX;
        if (this.x <= this.minX) {
            this.x         = this.minX;
            this.velocityX = Math.abs(this.speed);
        }
        if (this.x + this.width >= this.maxX) {
            this.x         = this.maxX - this.width;
            this.velocityX = -Math.abs(this.speed);
        }
    }

    // Returns true if an entity is riding on top of this platform
    isEntityOn(entity) {
        return (
            entity.x + entity.width  > this.x + 4 &&
            entity.x                 < this.x + this.width - 4 &&
            entity.y + entity.height >= this.y - 4 &&
            entity.y + entity.height <= this.y + 8
        );
    }

    getBounds() {
        return { x: this.x, y: this.y, width: this.width, height: this.height };
    }

    draw(ctx) {
        var x = this.x, y = this.y, w = this.width, h = this.height;

        ctx.save();

        // Drop shadow
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(x + 4, y + h + 2, w, 5);

        // Plank body
        ctx.fillStyle = '#7B4A1E';
        _rrect(ctx, x, y, w, h, 5);
        ctx.fill();

        // Top highlight (grass strip)
        ctx.fillStyle = '#4A7A3A';
        _rrect(ctx, x + 3, y + 1, w - 6, 5, 2);
        ctx.fill();

        // Wood grain lines
        ctx.strokeStyle = 'rgba(0,0,0,0.18)';
        ctx.lineWidth = 1;
        for (var i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(x + 6,     y + 7 + i * 3);
            ctx.lineTo(x + w - 6, y + 7 + i * 3);
            ctx.stroke();
        }

        // Outline
        ctx.strokeStyle = '#4A2800';
        ctx.lineWidth = 2;
        _rrect(ctx, x, y, w, h, 5);
        ctx.stroke();

        // Direction arrow
        ctx.fillStyle   = 'rgba(255,255,255,0.45)';
        ctx.font        = 'bold 11px sans-serif';
        ctx.textAlign   = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.velocityX > 0 ? '▶' : '◀', x + w / 2, y + h / 2 + 1);

        ctx.restore();
    }
}

// Helper: rounded rect path (no fill/stroke)
function _rrect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y,     x + w, y + r,     r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x,     y + h, x,     y + h - r, r);
    ctx.lineTo(x,     y + r);
    ctx.arcTo(x,     y,     x + r, y,         r);
    ctx.closePath();
}