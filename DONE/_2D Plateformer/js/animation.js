// ─────────────────────────────────────────────
//  animation.js  –  sprite-sheet animation
// ─────────────────────────────────────────────
class Animation {
    constructor(image, frameWidth, frameHeight, frameCount, frameSpeed, loop, layout) {
        if (frameSpeed === undefined) frameSpeed = 6;
        if (loop === undefined) loop = true;
        if (layout === undefined) layout = 'horizontal';

        this.image       = image;
        this.frameWidth  = frameWidth;
        this.frameHeight = frameHeight;
        this.frameCount  = frameCount;
        this.frameSpeed  = frameSpeed;
        this.loop        = loop;
        this.layout      = layout;

        this.currentFrame = 0;
        this.frameTimer   = 0;
        this.finished     = false;
        this.onComplete   = null;
    }

    reset() {
        this.currentFrame = 0;
        this.frameTimer   = 0;
        this.finished     = false;
    }

    update() {
        if (this.finished) return;
        this.frameTimer++;
        if (this.frameTimer >= this.frameSpeed) {
            this.frameTimer = 0;
            this.currentFrame++;
            if (this.currentFrame >= this.frameCount) {
                if (this.loop) {
                    this.currentFrame = 0;
                } else {
                    this.currentFrame = this.frameCount - 1;
                    this.finished = true;
                    if (this.onComplete) this.onComplete();
                }
            }
        }
    }

    draw(ctx, x, y, scale) {
        if (!this.image) return;
        if (scale === undefined) scale = 1;
        var sx = this.layout === 'horizontal' ? this.currentFrame * this.frameWidth  : 0;
        var sy = this.layout === 'vertical'   ? this.currentFrame * this.frameHeight : 0;
        ctx.drawImage(
            this.image,
            sx, sy,
            this.frameWidth, this.frameHeight,
            x, y,
            this.frameWidth * scale, this.frameHeight * scale
        );
    }
}