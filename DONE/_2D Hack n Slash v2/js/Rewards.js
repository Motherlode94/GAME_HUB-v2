class Rewards {
    constructor(player) {
        this.player = player;
        this.killCount = 0;
    }

    onEnemyKilled(enemy) {
        this.killCount++;

        const prog = this.player.progression;

        // ===== COMBO (AVANT SCORE) =====
        prog.addCombo();

        // ===== SCORE =====
        const baseScore =
            enemy.type === 'boss' ? 500 :
            enemy.type === 'tank' ? 50 :
            enemy.type === 'fast' ? 30 : 15;

        const comboMultiplier = 1 + (prog.combo * 0.15);
        const scoreGain = Math.floor(
            baseScore * prog.level * comboMultiplier
        );

        score += scoreGain;
        createScorePopup(enemy.pos.x, enemy.pos.y, scoreGain);

        // ===== XP =====
        const expGain =
            enemy.type === 'boss' ? 60 :
            enemy.type === 'tank' ? 15 :
            enemy.type === 'fast' ? 10 : 6;

        prog.addXP(expGain);

        // ===== SPECIAL =====
        prog.addSpecial(enemy.type === 'boss' ? 40 : 8);

        // ===== FX =====
        createExplosion(
            enemy.pos.x,
            enemy.pos.y,
            enemy.type === 'boss' ? '#ff0000' : '#ffaa00',
            enemy.type === 'boss' ? 50 : 15
        );

        // ===== PICKUPS =====
        this.spawnPickup(enemy);
    }

    spawnPickup(enemy) {
        const prog = this.player.progression;

        let chance = 0.15 + (prog.combo * 0.02);
        if (enemy.type === 'boss') chance = 1;

        if (Math.random() >= chance) return;

        let type = 'health';
        const r = Math.random();

        if (r < 0.05 && prog.level >= 3) type = 'speed';
        else if (r < 0.15) type = 'special';
        else if (r < 0.30) type = 'experience';

        pickups.push(new Pickup(enemy.pos.x, enemy.pos.y, type));
    }
}
