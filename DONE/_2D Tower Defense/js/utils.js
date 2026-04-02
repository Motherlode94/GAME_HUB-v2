// -----------------------------
// MATHS
// -----------------------------

function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

// -----------------------------
// GRILLE / COORDONNÉES
// -----------------------------

function worldToGrid(value) {
    return Math.floor(value / TILE_SIZE);
}

function gridToWorld(value) {
    return value * TILE_SIZE;
}

// -----------------------------
// COLLISION SIMPLE
// -----------------------------

function rectsOverlap(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

// -----------------------------
// ANGLES & VECTEURS
// -----------------------------

function angleToTarget(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
}

function vectorFromAngle(angle, speed) {
    return {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed
    };
}

// -----------------------------
// DEBUG
// -----------------------------

function drawCircle(ctx, x, y, radius, color = "rgba(255,255,255,0.2)") {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.stroke();
}