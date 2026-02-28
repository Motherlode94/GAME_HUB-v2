// Classe de base pour toutes les entités - Blood Eclipse
class Entity {
    constructor(x, y, size, color) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = color;
        this.originalColor = color;
        this.flashTimer = 0;
    }
    
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
flash(color, duration = 100) {
        this.color = color;
        this.flashTimer = duration;
    }

    updateFlash(deltaTime) {
        if (this.flashTimer > 0) {
            this.flashTimer -= deltaTime;
            if (this.flashTimer <= 0) {
                this.color = this.originalColor;
                this.flashTimer = 0;
            }
        }
    }
    
    // Vérifier collision avec une autre entité
    collidesWith(other) {
        const dist = Utils.distance(this.x, this.y, other.x, other.y);
        return dist < this.size + other.size;
    }
}