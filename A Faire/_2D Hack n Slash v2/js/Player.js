class Player {
    constructor(x, y) {
        this.pos = new Vector(x, y);
        this.radius = 16;

        this.facing = new Vector(1, 0);
        this.lastDir = new Vector(1, 0);

        // === MODULES (NOMS EXACTS) ===
        this.stats = new Stats(this);
        this.progression = new Progression(this);
        this.movement = new Movement(this);
        this.weaponSystem = new WeaponSystem(this);
        this.rewards = new Rewards(this);
        this.dash = new DashSystem(this); // ✅ NOM CORRECT
    }

    update(keys) {
        this.stats.update();
        this.progression.update();

        this.movement.update(keys);
        this.weaponSystem.update(keys);
    }

    draw(ctx) {
        Renderer.draw(this, ctx);
    }

    takeDamage(amount) {
        return this.stats.takeDamage(amount);
    }

    onEnemyKilled(enemy) {
        this.rewards.onEnemyKilled(enemy);
    }

    getAttackCenter() {
        return this.weaponSystem.getAttackCenter();
    }

    get attackRadius() {
        return this.weaponSystem.attackRadius;
    }

    get attacking() {
        return this.weaponSystem.attacking;
    }

    get combo() {
        return this.progression.combo;
    }

    get level() {
        return this.progression.level;
    }

    get health() {
        return this.stats.health;
    }

    get maxHealth() {
        return this.stats.maxHealth;
    }

    get specialCharge() {
        return this.progression.specialCharge;
    }

    get specialMax() {
        return this.progression.specialMax;
    }
}
