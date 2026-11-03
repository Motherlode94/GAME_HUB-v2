class Movement {
    constructor(player) {
        this.player = player;
        this.baseSpeed = 4.5;
    }

    update(keys) {
        let dir = new Vector(0, 0);

        if (keys['ArrowLeft'] || keys['KeyA']) dir.x -= 1;
        if (keys['ArrowRight'] || keys['KeyD']) dir.x += 1;
        if (keys['ArrowUp'] || keys['KeyW']) dir.y -= 1;
        if (keys['ArrowDown'] || keys['KeyS']) dir.y += 1;

        // Direction / facing
        if (dir.length() > 0) {
            const normalized = dir.normalize();
            this.player.lastDir = normalized;

            if (!this.player.dash.dashing) {
                this.player.facing = normalized;
            }
        }

        // Dash (avant déplacement)
        this.player.dash.update(keys, dir);

        // During a dash, continue in the direction captured at activation.
        const movementDir = this.player.dash.dashing ? this.player.lastDir : dir;
        if (movementDir.length() > 0) {
            const speed = this.baseSpeed * this.player.dash.getSpeedMultiplier();
            this.player.pos = this.player.pos.add(movementDir.normalize().mul(speed));
        }

        this.handleBounds();
    }

    handleBounds() {
        const p = this.player;
        const r = p.radius;

        // Rebonds pendant dash
        if (p.dash.dashing) {
            if (p.pos.x < r) {
                p.pos.x = r;
                p.lastDir.x = Math.abs(p.lastDir.x);
            }
            if (p.pos.x > canvas.width - r) {
                p.pos.x = canvas.width - r;
                p.lastDir.x = -Math.abs(p.lastDir.x);
            }
            if (p.pos.y < r) {
                p.pos.y = r;
                p.lastDir.y = Math.abs(p.lastDir.y);
            }
            if (p.pos.y > canvas.height - r) {
                p.pos.y = canvas.height - r;
                p.lastDir.y = -Math.abs(p.lastDir.y);
            }
        }
        // Clamp normal
        else {
            p.pos.x = Math.max(r, Math.min(canvas.width - r, p.pos.x));
            p.pos.y = Math.max(r, Math.min(canvas.height - r, p.pos.y));
        }
    }
}
