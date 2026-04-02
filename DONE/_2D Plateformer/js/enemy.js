// ─────────────────────────────────────────────
//  enemy.js  –  goomba-style patrolling enemy
// ─────────────────────────────────────────────
class Enemy {
    constructor(x, y, minX, maxX, speed) {
        this.x         = x;
        this.y         = y;
        this.width     = 38;
        this.height    = 34;
        this.velocityX = speed || 1.2;
        this.velocityY = 0;
        this.minX      = minX;
        this.maxX      = maxX;
        this.isGrounded = false;

        this.dead        = false;
        this.deathTimer  = 0;
        this._timer      = 0;
    }

    update(tilemap) {
        if (this.dead) {
            this.deathTimer++;
            return;
        }

        this._timer++;

        // Gravity
        this.velocityY += 0.6;
        if (this.velocityY > 15) this.velocityY = 15;

        // Patrol bounds
        if (this.x <= this.minX) {
            this.x = this.minX;
            this.velocityX = Math.abs(this.velocityX);
        }
        if (this.x + this.width >= this.maxX) {
            this.x = this.maxX - this.width;
            this.velocityX = -Math.abs(this.velocityX);
        }

        // Edge detection — turn before walking off a platform
        if (this.isGrounded && tilemap) {
            var ts     = tilemap.tileSize;
            var front  = this.velocityX > 0 ? this.x + this.width + 2 : this.x - 2;
            var below  = this.y + this.height + 4;
            var col    = Math.floor(front / ts);
            var row    = Math.floor(below / ts);
            if (!tilemap.isSolid(col, row)) {
                this.velocityX *= -1;
            }
        }

        // Physics
        if (tilemap) {
            resolveCollisions(this, tilemap);
        } else {
            this.x += this.velocityX;
            this.y += this.velocityY;
        }
    }

    stomp() {
        this.dead       = true;
        this.deathTimer = 0;
    }

    isExpired() {
        return this.dead && this.deathTimer > 45;
    }

    getBounds() {
        return { x: this.x, y: this.y, width: this.width, height: this.height };
    }

    draw(ctx) {
        if (this.isExpired()) return;

        ctx.save();
        if (this.dead) {
            // Squish effect
            ctx.translate(this.x + this.width / 2, this.y + this.height);
            ctx.scale(1.5, 0.22);
            ctx.translate(-this.width / 2, -6);
            this._drawBody(ctx, 0, 0);
        } else {
            this._drawBody(ctx, this.x, this.y);
        }
        ctx.restore();
    }

    _drawBody(ctx, x, y) {
        var w  = this.width;
        var h  = this.height;
        var cx = x + w / 2;
        var t  = this._timer;

        // Body (lower half)
        ctx.beginPath();
        ctx.ellipse(cx, y + h * 0.72, w / 2, h * 0.33, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#c0392b';
        ctx.fill();
        ctx.strokeStyle = '#7b241c';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Head cap (upper half)
        ctx.beginPath();
        ctx.ellipse(cx, y + h * 0.38, w / 2 * 1.08, h * 0.43, 0, Math.PI, 0, true);
        ctx.fillStyle = '#e74c3c';
        ctx.fill();
        ctx.strokeStyle = '#7b241c';
        ctx.stroke();

        // Eyes (with blink)
        var blink = (Math.floor(t / 90) % 10 === 0);
        var eyeY  = y + h * 0.43;
        var self  = this;

        [-1, 1].forEach(function (side) {
            var ex = cx + side * w * 0.22;

            ctx.beginPath();
            if (blink) {
                ctx.ellipse(ex, eyeY, 4, 1.2, 0, 0, Math.PI * 2);
            } else {
                ctx.arc(ex, eyeY, 4, 0, Math.PI * 2);
            }
            ctx.fillStyle = '#fff';
            ctx.fill();

            if (!blink) {
                ctx.beginPath();
                var pupilOff = self.velocityX > 0 ? 1.5 : -1.5;
                ctx.arc(ex + pupilOff, eyeY + 1, 2, 0, Math.PI * 2);
                ctx.fillStyle = '#111';
                ctx.fill();
            }
        });

        // Angry eyebrows
        ctx.beginPath();
        ctx.moveTo(cx - w * 0.28, eyeY - 8);
        ctx.lineTo(cx - w * 0.10, eyeY - 4);
        ctx.moveTo(cx + w * 0.10, eyeY - 4);
        ctx.lineTo(cx + w * 0.28, eyeY - 8);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Walking feet
        var fa = Math.sin(t * 0.2) * 4;
        ctx.fillStyle = '#7b241c';
        ctx.beginPath();
        ctx.ellipse(cx - w * 0.25, y + h - 2 + fa, 7, 5, -0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + w * 0.25, y + h - 2 - fa, 7, 5, 0.15, 0, Math.PI * 2);
        ctx.fill();
    }
}