// Pickup.js
class Pickup {
    constructor(x, y, type = 'health') {
        this.pos = new Vector(x, y);
        this.size = 20;
        this.radius = 10;
        this.type = type;

        this.floatOffset = Math.random() * Math.PI * 2;
        this.rotation = 0;

        this.collected = false;
        this.collectTimer = 0;
    }

    update() {
        this.floatOffset += 0.05;
        this.rotation += 0.03;

        if (this.collected) {
            this.collectTimer++;
            this.pos.y -= 2;

            if (this.collectTimer > 30) {
                return false;
            }
        }
        return true;
    }

    onCollect(player) {
        if (!player) return;

        switch (this.type) {
            case 'health':
                player.stats.heal(2);
                createExperiencePopup(
                    this.pos.x,
                    this.pos.y,
                    '+2 HP'
                );
                break;

            case 'experience':
                player.progression.addXP(50);
                break;

            case 'special':
                player.progression.addSpecial(40);
                createExperiencePopup(
                    this.pos.x,
                    this.pos.y,
                    '+40 SPECIAL'
                );
                break;

            case 'speed':
                player.movement.baseSpeed += 0.5;
                createExperiencePopup(
                    this.pos.x,
                    this.pos.y,
                    '+SPEED'
                );
                break;
        }

        createExplosion(this.pos.x, this.pos.y, '#ffffff', 12);
        this.collected = true;
    }

    draw(ctx) {
        ctx.save();

        const floatY = Math.sin(this.floatOffset) * 5;
        ctx.translate(this.pos.x, this.pos.y + floatY);
        ctx.rotate(this.rotation);

        let color, glowColor, symbol;

        switch (this.type) {
            case 'health':
                color = '#ff4444';
                glowColor = '#ff0000';
                symbol = '❤️';
                break;

            case 'experience':
                color = '#ffdd00';
                glowColor = '#ffaa00';
                symbol = '⭐';
                break;

            case 'special':
                color = '#aa00ff';
                glowColor = '#ff00ff';
                symbol = '⚡';
                break;

            case 'speed':
                color = '#00aaff';
                glowColor = '#00ffff';
                symbol = '💨';
                break;
        }

        if (this.collected) {
            ctx.globalAlpha = 1 - this.collectTimer / 30;
        }

        // Glow
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 20;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Symbole
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(symbol, 0, 0);

        // Bordure
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.restore();
    }
}
