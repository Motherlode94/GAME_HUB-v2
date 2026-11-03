class Progression {
    constructor(player) {
        this.player = player;

        // Level / XP
        this.level = 1;
        this.experience = 0;
        this.experienceToNextLevel = 100;

        // Combo
        this.combo = 0;
        this.comboTimer = 0;
        this.comboMaxTime = 90;

        // Spécial
        this.specialCharge = 0;
        this.specialMax = 100;
    }

    update() {
        // Combo decay
        if (this.combo > 0) {
            this.comboTimer--;
            if (this.comboTimer <= 0) {
                this.resetCombo();
            }
        }

        // Recharge spéciale passive
        if (this.specialCharge < this.specialMax) {
            this.specialCharge += 0.15 + (this.combo * 0.02);
        }
    }

    addCombo() {
        this.combo++;
        this.comboTimer = this.comboMaxTime;
    }

    resetCombo() {
        this.combo = 0;
        this.comboTimer = 0;
    }

    addXP(amount) {
        if (amount <= 0) return;

        this.experience += amount;

        while (this.experience >= this.experienceToNextLevel) {
            this.levelUp();
        }

        createExperiencePopup(
            this.player.pos.x,
            this.player.pos.y - 30,
            `+${amount} XP`
        );
    }

    levelUp() {
        this.level++;
        this.experience -= this.experienceToNextLevel;
        this.experienceToNextLevel =
            Math.floor(this.experienceToNextLevel * 1.4);

        // Upgrade aléatoire
        const upgrades = ['health', 'speed', 'attackSpeed'];
        const chosen = upgrades[Math.floor(Math.random() * upgrades.length)];

        switch (chosen) {
            case 'health':
                this.player.stats.maxHealth += 1;
                this.player.stats.health = this.player.stats.maxHealth;
                break;

            case 'speed':
                this.player.movement.baseSpeed += 0.4;
                break;

            case 'attackSpeed':
                // Géré côté WeaponSystem (cooldown / duration)
                if (this.player.weaponSystem?.reduceAttackDuration) {
                    this.player.weaponSystem.reduceAttackDuration();
                }
                break;
        }

        createLevelUpEffect(this.player.pos.x, this.player.pos.y, chosen);
    }

    addSpecial(amount) {
        if (amount <= 0) return;
        this.specialCharge = Math.min(
            this.specialMax,
            this.specialCharge + amount
        );
    }

    consumeSpecial() {
        this.specialCharge = 0;
    }
}
