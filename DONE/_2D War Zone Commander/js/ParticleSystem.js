window.RTS = window.RTS || {};

RTS.ParticleSystem = {

    update: function(particles, delta) {
        for (var i = particles.length - 1; i >= 0; i--) {
            var p = particles[i];
            p.x    += p.vx * delta;
            p.y    += p.vy * delta;
            p.vy   += (p.gravity || 0) * delta;
            p.life -= delta;
            if (p.life <= 0) particles.splice(i, 1);
        }
    },

    render: function(particles, ctx) {
        particles.forEach(function(p) {
            var t = Math.max(0, p.life / p.maxLife);

            if (p.type === "shockwave") {
                // Anneau expansif
                var r = p.maxRadius * (1 - t);
                ctx.beginPath();
                ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
                ctx.strokeStyle = "rgba(255,180,50," + (t * 0.6) + ")";
                ctx.lineWidth   = 3 * t;
                ctx.stroke();
                return;
            }

            if (p.type === "crater") {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(0,0,0," + (t * 0.45) + ")";
                ctx.fill();
                return;
            }

            ctx.globalAlpha = Math.min(1, t * 1.5);
            ctx.fillStyle   = p.color;

            if (p.type === "casing") {
                // Douille : petit rectangle jaune avec rotation
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.angle || 0);
                ctx.fillRect(-4, -1.5, 8, 3);
                ctx.restore();
            } else if (p.type === "smoke") {
                ctx.beginPath();
                var radius = p.size * (2 - t);
                ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * t, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.globalAlpha = 1;
        });
    },

    // ── Effets spécifiques ───────────────────────────────────────────────────

    // Flash de canon
    spawnMuzzleFlash: function(particles, x, y, tx, ty, big) {
        var angle = Math.atan2(ty - y, tx - x);
        var count = big ? 8 : 4;
        for (var i = 0; i < count; i++) {
            var spread = (Math.random() - 0.5) * (big ? 0.6 : 0.4);
            var speed  = 80 + Math.random() * (big ? 180 : 100);
            particles.push({
                type: "spark", x: x, y: y,
                vx: Math.cos(angle + spread) * speed,
                vy: Math.sin(angle + spread) * speed,
                life: 0.08 + Math.random() * 0.06,
                maxLife: 0.14,
                size: big ? 4 : 2,
                color: big ? "#ffcc44" : "#fff7aa",
                gravity: 0
            });
        }
    },

    // Impact balle sur cible
    spawnBulletImpact: function(particles, x, y, team) {
        var color = team === "blue" ? "#aaddff" : "#ffaaaa";
        for (var i = 0; i < 5; i++) {
            var angle = Math.random() * Math.PI * 2;
            particles.push({
                type: "spark", x: x, y: y,
                vx: Math.cos(angle) * (40 + Math.random() * 80),
                vy: Math.sin(angle) * (40 + Math.random() * 80),
                life: 0.12, maxLife: 0.12,
                size: 1.5, color: color, gravity: 60
            });
        }
    },

    // Douille éjectée (infanterie)
    spawnCasing: function(particles, x, y) {
        particles.push({
            type: "casing", x: x, y: y,
            vx: (Math.random() - 0.3) * 60,
            vy: -(30 + Math.random() * 50),
            life: 0.6, maxLife: 0.6,
            size: 3, color: "#c8a020",
            gravity: 150,
            angle: Math.random() * Math.PI * 2
        });
    },

    // Fumée de recul canon (tank)
    spawnRecoilSmoke: function(particles, x, y, tx, ty) {
        var angle = Math.atan2(ty - y, tx - x) + Math.PI; // direction inverse
        for (var i = 0; i < 5; i++) {
            var spread = (Math.random() - 0.5) * 0.8;
            particles.push({
                type: "smoke", x: x, y: y,
                vx: Math.cos(angle + spread) * (20 + Math.random() * 40),
                vy: Math.sin(angle + spread) * (20 + Math.random() * 40) - 20,
                life: 0.5 + Math.random() * 0.4,
                maxLife: 0.9,
                size: 6 + Math.random() * 6,
                color: "rgba(180,180,180,0.5)",
                gravity: -15
            });
        }
    },

    // Explosion obus tank
    spawnExplosion: function(particles, x, y) {
        // Boule de feu
        for (var i = 0; i < 20; i++) {
            var angle = Math.random() * Math.PI * 2;
            var speed = 60 + Math.random() * 180;
            var colors = ["#ff6600", "#ff9900", "#ffcc00", "#ff3300"];
            particles.push({
                type: "spark", x: x, y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.3 + Math.random() * 0.4,
                maxLife: 0.7,
                size: 4 + Math.random() * 6,
                color: colors[Math.floor(Math.random() * colors.length)],
                gravity: 40
            });
        }
        // Fumée noire
        for (var j = 0; j < 8; j++) {
            var a2 = Math.random() * Math.PI * 2;
            particles.push({
                type: "smoke", x: x, y: y,
                vx: Math.cos(a2) * (20 + Math.random() * 50),
                vy: Math.sin(a2) * (20 + Math.random() * 50) - 30,
                life: 0.8 + Math.random() * 0.6,
                maxLife: 1.4,
                size: 10 + Math.random() * 10,
                color: "rgba(30,30,30,0.7)",
                gravity: -20
            });
        }
    },

    // Shockwave (anneau)
    spawnShockwave: function(particles, x, y) {
        particles.push({
            type: "shockwave", x: x, y: y,
            vx: 0, vy: 0, gravity: 0,
            life: 0.4, maxLife: 0.4,
            maxRadius: 70,
            size: 0, color: "transparent"
        });
    },

    // Mort d'unité
    spawnDeath: function(particles, x, y, team) {
        var color = team === "blue" ? "#3d8ef5" : "#e74c3c";
        for (var i = 0; i < 12; i++) {
            var angle = Math.random() * Math.PI * 2;
            var speed = 50 + Math.random() * 100;
            particles.push({
                type: "spark", x: x, y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.4 + Math.random() * 0.4,
                maxLife: 0.8,
                size: 3 + Math.random() * 4,
                color: color, gravity: 60
            });
        }
    },

    // Récolte worker
    spawnHarvest: function(particles, x, y, resourceType) {
        var colors = { gold: "#f5a623", fuel: "#27ae60", ammo: "#e74c3c" };
        var color  = colors[resourceType] || "#fff";
        if (Math.random() > 0.3) return; // throttle
        particles.push({
            type: "spark", x: x, y: y,
            vx: (Math.random() - 0.5) * 30,
            vy: -(20 + Math.random() * 30),
            life: 0.5, maxLife: 0.5,
            size: 2, color: color, gravity: 40
        });
    }
};