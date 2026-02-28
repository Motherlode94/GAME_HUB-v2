const Utils = {
    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    },

    angle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    },

    checkCollision(x1, y1, r1, x2, y2, r2) {
        return this.distance(x1, y1, x2, y2) < r1 + r2;
    },

    getRandomEdgePosition(canvasWidth, canvasHeight, margin = 50) {
        const side = Math.floor(Math.random() * 4);
        let x, y;

        switch (side) {
            case 0: x = Math.random() * canvasWidth; y = -margin; break;
            case 1: x = canvasWidth + margin; y = Math.random() * canvasHeight; break;
            case 2: x = Math.random() * canvasWidth; y = canvasHeight + margin; break;
            case 3: x = -margin; y = Math.random() * canvasHeight; break;
        }

        return { x, y };
    },

    getXPForLevel(level) {
        return Math.floor(100 * Math.pow(CONFIG.PROGRESSION.XP_MULTIPLIER_PER_LEVEL, level - 1));
    },

    // ✅ AJOUT OBLIGATOIRE
    randomRange(min, max) {
        return Math.random() * (max - min) + min;
    }
};
