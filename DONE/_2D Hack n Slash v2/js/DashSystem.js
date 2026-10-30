class DashSystem {
    constructor(player) {
        this.player = player;

        this.dashing = false;
        this.dashTimer = 0;

        this.dashDuration = 10;
        this.dashSpeed = 3;

        this.cooldown = 0;
        this.maxCooldown = 60;
    }

    tryDash(dir) {
        if (this.cooldown > 0) return;
        if (dir.length() === 0) return;

        this.dashing = true;
        this.dashTimer = this.dashDuration;
        this.cooldown = this.maxCooldown;

        // Direction figée
        this.player.lastDir = dir.normalize();

        // Invincibilité pendant le dash
        this.player.stats.setInvincible(this.dashDuration);
    }

    update(keys, dir) {
        // Déclenchement
        if ((keys['ShiftLeft'] || keys['KeyL']) && !this.dashing) {
            this.tryDash(dir);
        }

        // Dash en cours
        if (this.dashing) {
            this.dashTimer--;

            // Effet visuel
            for (let i = 0; i < 2; i++) {
                particles.push(new Particle(
                    this.player.pos.x - this.player.lastDir.x * 20,
                    this.player.pos.y - this.player.lastDir.y * 20,
                    -this.player.lastDir.x * 3 + (Math.random() - 0.5) * 2,
                    -this.player.lastDir.y * 3 + (Math.random() - 0.5) * 2,
                    '#00ffff',
                    4,
                    0.8,
                    0.1
                ));
            }

            if (this.dashTimer <= 0) {
                this.dashing = false;
            }
        }

        // Cooldown
        if (this.cooldown > 0) {
            this.cooldown--;
        }
    }

    getSpeedMultiplier() {
        return this.dashing ? this.dashSpeed : 1;
    }
}
