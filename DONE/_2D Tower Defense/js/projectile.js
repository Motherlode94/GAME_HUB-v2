let projectiles = [];

function updateProjectiles(deltaTime) {
    projectiles.forEach(p => {
        // Sauvegarder la position précédente pour la traînée
        if (!p.trail) p.trail = [];
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 5) p.trail.shift();
        
        p.x += p.vx * deltaTime;
        p.y += p.vy * deltaTime;

        if (p.target && p.target.life > 0) {
            const dist = distance(p.x, p.y, p.target.x, p.target.y);
            if (dist < (p.target.size || ENEMY_SIZE) / 2) {
                const previousLife = p.target.life;
                p.target.life -= p.damage;
                
                // Si le projectile a tué l'ennemi, incrémenter le compteur de la tour
                if (previousLife > 0 && p.target.life <= 0 && p.tower) {
                    p.tower.kills++;
                }
                
                p.hit = true;
                
                // Effet d'impact
                createImpactEffect(p.x, p.y);
            }
        } else {
            p.hit = true;
        }
    });

    projectiles = projectiles.filter(p => {
        if (p.hit) return false;
        if (p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) {
            return false;
        }
        return true;
    });
}

function createImpactEffect(x, y) {
    if (!window.particles) window.particles = [];
    
    for (let i = 0; i < 4; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random();
        window.particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: '#ffff00',
            life: 15,
            maxLife: 15,
            size: 3
        });
    }
}

function drawProjectiles(ctx) {
    projectiles.forEach(p => {
        // Traînée
        if (p.trail && p.trail.length > 1) {
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(p.trail[0].x, p.trail[0].y);
            for (let i = 1; i < p.trail.length; i++) {
                ctx.lineTo(p.trail[i].x, p.trail[i].y);
            }
            ctx.stroke();
        }
        
        // Projectile principal
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(p.x, p.y, PROJECTILE_SIZE, 0, Math.PI * 2);
        ctx.fill();
        
        // Lueur
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, PROJECTILE_SIZE * 2);
        gradient.addColorStop(0, 'rgba(255, 255, 200, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 255, 200, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, PROJECTILE_SIZE * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Bordure
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, PROJECTILE_SIZE, 0, Math.PI * 2);
        ctx.stroke();
    });
}