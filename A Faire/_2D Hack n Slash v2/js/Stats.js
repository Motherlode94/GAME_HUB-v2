class Stats {
    constructor(player) {
        this.player = player;

        // Vie
        this.health = 5;
        this.maxHealth = 5;

        // Invincibilité
        this.invincible = false;
        this.invincibleTimer = 0;
        this.invincibleDuration = 45;
    }

    takeDamage(amount) {
        if (this.invincible || amount <= 0) return false;

        this.health -= amount;

        this.setInvincible(this.invincibleDuration);

        // Reset combo (DOIT EXISTER DANS Progression)
        if (this.player.progression?.resetCombo) {
            this.player.progression.resetCombo();
        }

        // Effet visuel dégâts
        for (let i = 0; i < 8; i++) {
            particles.push(new Particle(
                this.player.pos.x,
                this.player.pos.y,
                (Math.random() - 0.5) * 6,
                (Math.random() - 0.5) * 6,
                '#ff0000',
                3,
                0.8,
                0.1
            ));
        }

        return this.health <= 0;
    }

    heal(amount) {
        if (amount <= 0) return;
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    setInvincible(duration) {
        this.invincible = true;
        this.invincibleTimer = duration;
    }

    update() {
        if (this.invincibleTimer > 0) {
            this.invincibleTimer--;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
            }
        }
    }
}
