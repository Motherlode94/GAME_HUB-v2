// ─────────────────────────────────────────────
//  camera.js  –  smooth follow + screen shake
// ─────────────────────────────────────────────
class Camera {
    constructor(canvasWidth, canvasHeight) {
        this.x = 0;
        this.y = 0;
        this.width  = canvasWidth;
        this.height = canvasHeight;

        this.lerpFactor       = 0.10;
        this.verticalOffset   = -40;
        this.verticalDeadzone = 60;

        // Shake state
        this._shakeX   = 0;
        this._shakeY   = 0;
        this._shakeDur = 0;
        this._shakeInt = 0;
    }

    follow(target, worldWidth, worldHeight) {
        worldHeight = worldHeight || Infinity;

        var desiredX = target.x + target.width  / 2 - this.width  / 2;
        var maxX     = Math.max(0, worldWidth  - this.width);
        var targetX  = Math.max(0, Math.min(desiredX, maxX));

        var desiredY  = target.y + target.height / 2 - this.height / 2 + this.verticalOffset;
        var maxY      = Math.max(0, worldHeight - this.height);
        var clampedY  = Math.max(0, Math.min(desiredY, maxY));
        var playerScreenY = (target.y + target.height / 2) - this.y;
        var delta     = playerScreenY - this.height / 2;
        var targetY   = Math.abs(delta) > this.verticalDeadzone ? clampedY : this.y;

        this.x += (targetX - this.x) * this.lerpFactor;
        this.y += (targetY - this.y) * this.lerpFactor;

        // Update shake
        if (this._shakeDur > 0) {
            this._shakeDur--;
            this._shakeX = (Math.random() - 0.5) * this._shakeInt * 2;
            this._shakeY = (Math.random() - 0.5) * this._shakeInt * 2;
            this._shakeInt *= 0.82;
        } else {
            this._shakeX = 0;
            this._shakeY = 0;
        }
    }

    shake(intensity, duration) {
        this._shakeInt = intensity;
        this._shakeDur = duration;
    }

    apply(ctx) {
        ctx.translate(
            -Math.round(this.x) + Math.round(this._shakeX),
            -Math.round(this.y) + Math.round(this._shakeY)
        );
    }

    screenToWorld(sx, sy) {
        return { x: sx + this.x, y: sy + this.y };
    }

    isVisible(x, y, w, h) {
        w = w || 0; h = h || 0;
        return (
            x + w >= this.x && x <= this.x + this.width &&
            y + h >= this.y && y <= this.y + this.height
        );
    }
}