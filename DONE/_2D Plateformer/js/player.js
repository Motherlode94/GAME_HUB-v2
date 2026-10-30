// ─────────────────────────────────────────────
//  player.js  –  player entity
// ─────────────────────────────────────────────
class Player {
    constructor(x, y, assets) {
        this.x = x;
        this.y = y;

        this.frameWidth  = 32;
        this.frameHeight = 32;
        this.scale       = 2;
        this.width       = this.frameWidth  * this.scale;  // 64
        this.height      = this.frameHeight * this.scale;  // 64

        this.velocityX  = 0;
        this.velocityY  = 0;
        this.speed      = 3.2;
        this.accel      = 0.7;
        this.friction   = 0.84;
        this.gravity    = 0.8;
        this.jumpForce  = -14;

        this.isGrounded = false;
        this.facing     = 1;
        this.state      = 'idle';

        // Coyote time
        this.coyoteTime    = 6;
        this.coyoteCounter = 0;

        // Jump buffer
        this.jumpBuffer    = 0;
        this.jumpBufferMax = 10;
        this.jumpHeld = false;

        // Invincibility blink after respawn
        this.invincible = 0;

        var layout = 'horizontal';
        this.animations = {
            idle: new Animation(assets.get('idle'), this.frameWidth, this.frameHeight, 11, 8,  true, layout),
            run:  new Animation(assets.get('run'),  this.frameWidth, this.frameHeight, 12, 6,  true, layout),
            jump: new Animation(assets.get('jump'), this.frameWidth, this.frameHeight,  1, 8,  true, layout),
            fall: new Animation(assets.get('fall') || assets.get('jump'), this.frameWidth, this.frameHeight, 1, 8, true, layout),
        };
        this.currentAnim = this.animations.idle;
    }

    // ── Input ─────────────────────────────────
    handleInput(keys) {
        var moving = false;

        if (keys['ArrowRight'] || keys['KeyD']) {
            this.velocityX += this.accel;
            this.facing     = 1;
            moving = true;
        }
        if (keys['ArrowLeft'] || keys['KeyA']) {
            this.velocityX -= this.accel;
            this.facing     = -1;
            moving = true;
        }

        if (this.velocityX >  this.speed) this.velocityX =  this.speed;
        if (this.velocityX < -this.speed) this.velocityX = -this.speed;

        if (!moving) {
            this.velocityX *= this.friction;
            if (Math.abs(this.velocityX) < 0.2) this.velocityX = 0;
        }

        // Only buffer the initial press, not every frame the key is held.
        // This prevents unwanted automatic jumps on each landing.
        var jumpPressed = !!(keys['Space'] || keys['ArrowUp'] || keys['KeyW']);
        if (jumpPressed && !this.jumpHeld) this.jumpBuffer = this.jumpBufferMax;
        this.jumpHeld = jumpPressed;
    }

    // ── Update ────────────────────────────────
    update(tilemap) {
        // Invincibility countdown
        if (this.invincible > 0) this.invincible--;

        // Gravity
        this.velocityY += this.gravity;
        if (this.velocityY > 20) this.velocityY = 20;

        if (tilemap) {
            resolveCollisions(this, tilemap);
        } else {
            this.x += this.velocityX;
            this.y += this.velocityY;
            var FLOOR = 576;
            if (this.y + this.height >= FLOOR) {
                this.y = FLOOR - this.height;
                this.velocityY  = 0;
                this.isGrounded = true;
            } else {
                this.isGrounded = false;
            }
        }

        // Coyote time
        if (this.isGrounded) {
            this.coyoteCounter = this.coyoteTime;
        } else {
            this.coyoteCounter = Math.max(0, this.coyoteCounter - 1);
        }

        // Jump buffer
        if (this.jumpBuffer > 0) {
            this.jumpBuffer--;
            if (this.coyoteCounter > 0) {
                this.velocityY     = this.jumpForce;
                this.isGrounded    = false;
                this.coyoteCounter = 0;
                this.jumpBuffer    = 0;
            }
        }

        // State machine
        var newState;
        if (!this.isGrounded) {
            newState = this.velocityY < 0 ? 'jump' : 'fall';
        } else if (Math.abs(this.velocityX) > 0.4) {
            newState = 'run';
        } else {
            newState = 'idle';
        }

        if (newState !== this.state) {
            this.state       = newState;
            this.currentAnim = this.animations[this.state] || this.animations.idle;
            this.currentAnim.reset();
        }

        this.currentAnim.update();
    }

    // ── Draw ──────────────────────────────────
    draw(ctx) {
        // Blink when invincible
        if (this.invincible > 0 && Math.floor(this.invincible / 4) % 2 === 0) return;

        ctx.save();
        if (this.facing === -1) {
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.scale(-1, 1);
            ctx.translate(-this.width / 2, -this.height / 2);
            this.currentAnim.draw(ctx, 0, 0, this.scale);
        } else {
            this.currentAnim.draw(ctx, this.x, this.y, this.scale);
        }
        ctx.restore();
    }

    getBounds() {
        return { x: this.x, y: this.y, width: this.width, height: this.height };
    }
}