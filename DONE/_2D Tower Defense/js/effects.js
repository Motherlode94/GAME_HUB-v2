// effects.js — particules, explosions, rayons et textes flottants

let particles = [];
let explosions = [];
let beams = [];
let floatingTexts = [];

function resetEffects() {
    particles = [];
    explosions = [];
    beams = [];
    floatingTexts = [];
}

function createDeathParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
        const speed = 0.06 + Math.random() * 0.08;
        particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 0.05,
            color,
            life: 600,
            maxLife: 600,
            size: 3 + Math.random() * 3
        });
    }
}

function createImpactEffect(x, y, color = '#ffff66') {
    for (let i = 0; i < 4; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.03 + Math.random() * 0.05;
        particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color,
            life: 250,
            maxLife: 250,
            size: 2.5
        });
    }
}

function createExplosion(x, y, radius, color) {
    explosions.push({ x, y, radius, color, life: 350, maxLife: 350 });
}

function createBeam(x1, y1, x2, y2, color) {
    beams.push({ x1, y1, x2, y2, color, life: 140, maxLife: 140 });
}

function addFloatingText(x, y, text, color = '#FFD700') {
    floatingTexts.push({ x, y, text, color, life: 900, maxLife: 900 });
}

function updateEffects(dt) {
    particles = particles.filter((p) => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 0.0003 * dt;
        p.life -= dt;
        return p.life > 0;
    });
    explosions = explosions.filter((e) => (e.life -= dt) > 0);
    beams = beams.filter((b) => (b.life -= dt) > 0);
    floatingTexts = floatingTexts.filter((t) => {
        t.y -= 0.03 * dt;
        t.life -= dt;
        return t.life > 0;
    });
}

function drawGroundEffects(ctx) {
    explosions.forEach((e) => {
        const t = 1 - e.life / e.maxLife;
        ctx.globalAlpha = (1 - t) * 0.6;
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius * (0.4 + t * 0.6), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1 - t;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
    });
    ctx.globalAlpha = 1;
}

function drawAirEffects(ctx) {
    beams.forEach((b) => {
        const alpha = b.life / b.maxLife;
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 4 * alpha + 1;
        ctx.beginPath();
        ctx.moveTo(b.x1, b.y1);
        ctx.lineTo(b.x2, b.y2);
        ctx.stroke();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
    });

    particles.forEach((p) => {
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    });

    ctx.textAlign = 'center';
    ctx.font = 'bold 13px Arial';
    floatingTexts.forEach((t) => {
        ctx.globalAlpha = Math.min(1, (t.life / t.maxLife) * 2);
        ctx.fillStyle = '#000';
        ctx.fillText(t.text, t.x + 1, t.y + 1);
        ctx.fillStyle = t.color;
        ctx.fillText(t.text, t.x, t.y);
    });
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
}
