window.RTS = window.RTS || {};

RTS.ProjectileSystem = {

    // Retourne true si `targetTeam` est un ennemi du projectile lancé par `projTeam`
    _isEnemy: function(projTeam, targetTeam) {
        if (projTeam === "red")  return targetTeam === "blue" || targetTeam === "ally";
        return targetTeam === "red";   // blue / ally → only reds
    },

    update: function(game, delta) {
        var toRemove = [];
        var self     = this;

        game.projectiles.forEach(function(p, idx) {
            p.age += delta;
            p.trail.push({ x: p.x, y: p.y });
            var maxTrail = (p.type === "shell" || p.type === "artillery") ? 12 : 5;
            if (p.trail.length > maxTrail) p.trail.shift();

            if (p.type === "artillery" && p.arcHeight > 0) {
                p.x += p.vx * delta;
                p.y += p.vy * delta;
                var progress = Math.min(1, p.age * p.speed / (p.totalDist || 1));
                p.arcOffset  = -Math.sin(progress * Math.PI) * p.arcHeight;
            } else {
                p.x += p.vx * delta;
                p.y += p.vy * delta;
            }

            var tm = p.targetMember;
            var tx = (tm && !tm.dead) ? tm.x : p.tx;
            var ty = (tm && !tm.dead) ? tm.y : p.ty;

            var dx   = p.x - tx;
            var dy   = p.y - ty;
            var dist = Math.sqrt(dx * dx + dy * dy);
            var hitR = (p.type === "shell" || p.type === "artillery") ? 16 : 10;

            if (dist < hitR || p.age > 5) {
                self._onImpact(game, p, tx, ty);
                toRemove.push(idx);
            }
        });

        for (var i = toRemove.length - 1; i >= 0; i--) {
            game.projectiles.splice(toRemove[i], 1);
        }
    },

    _onImpact: function(game, proj, ix, iy) {
        var ts   = proj.targetSquad;
        var self = this;

        if (proj.type === "bullet" || proj.type === "sniper") {
            if (ts && !ts.isDead()) {
                ts.takeDamage(proj.damage * RTS.FogOfWar.coverMultiplier(game, proj.x, proj.y, ix, iy), ix, iy, game.particles);
            }
            RTS.ParticleSystem.spawnBulletImpact(game.particles, ix, iy, proj.team);
            if (proj.type === "bullet") RTS.ParticleSystem.spawnCasing(game.particles, proj.x, proj.y);

        } else if (proj.type === "shell" || proj.type === "artillery" || proj.type === "rocket") {
            if (ts && !ts.isDead()) {
                ts.takeDamage(proj.damage * RTS.FogOfWar.coverMultiplier(game, proj.x, proj.y, ix, iy), ix, iy, game.particles);
            }
            // AoE — ne touche pas les alliés du tireur
            if (proj.aoeRadius > 0) {
                game.squads.forEach(function(s) {
                    if (!self._isEnemy(proj.team, s.team)) return;  // pas d'amis feu
                    if (s === ts) return;
                    var dx = s.x - ix, dy = s.y - iy;
                    if (Math.sqrt(dx * dx + dy * dy) < proj.aoeRadius + 30) {
                        s.takeSplashDamage(proj.aoeDamage, ix, iy, proj.aoeRadius, game.particles);
                    }
                });
            }
            RTS.ParticleSystem.spawnExplosion(game.particles, ix, iy);
            RTS.ParticleSystem.spawnShockwave(game.particles, ix, iy);
            game.craters.push({ x: ix, y: iy, r: (proj.aoeRadius || 30) * 0.55, age: 0 });
        }
    },

    render: function(projectiles, ctx) {
        projectiles.forEach(function(p) {
            var drawY = p.y + (p.arcOffset || 0);

            // Trail
            if (p.trail.length > 1) {
                ctx.save();
                for (var i = 1; i < p.trail.length; i++) {
                    var alpha = (i / p.trail.length) * 0.55;
                    var ty    = p.trail[i].y + (p.arcOffset || 0) * (i / p.trail.length);
                    ctx.strokeStyle =
                        p.type === "shell"     ? "rgba(255,180,50,"  + alpha + ")" :
                        p.type === "artillery" ? "rgba(255,120,20,"  + alpha + ")" :
                        p.type === "rocket"    ? "rgba(255,80,80,"   + alpha + ")" :
                        p.type === "sniper"    ? "rgba(200,100,255," + alpha + ")" :
                                                 "rgba(255,255,200," + alpha + ")";
                    ctx.lineWidth = (p.type === "shell" || p.type === "artillery") ? 3 : 1.5;
                    ctx.beginPath();
                    ctx.moveTo(p.trail[i-1].x, p.trail[i-1].y + (p.arcOffset||0) * ((i-1)/p.trail.length));
                    ctx.lineTo(p.trail[i].x, ty);
                    ctx.stroke();
                }
                ctx.restore();
            }

            // Corps
            ctx.save();
            if (p.type === "shell" || p.type === "artillery") {
                ctx.beginPath();
                ctx.arc(p.x, drawY, p.type === "artillery" ? 6 : 7, 0, Math.PI * 2);
                ctx.fillStyle   = "#0a0800";
                ctx.fill();
                ctx.strokeStyle = p.type === "artillery" ? "#ff6010" : "#ffb832";
                ctx.lineWidth   = 2;
                ctx.stroke();
            } else if (p.type === "rocket") {
                var angle = Math.atan2(p.vy, p.vx);
                ctx.translate(p.x, drawY);
                ctx.rotate(angle);
                ctx.fillStyle = "#cc3300";
                ctx.fillRect(-7, -2.5, 14, 5);
                ctx.fillStyle = "#ff6633";
                ctx.fillRect(-10, -1.5, 5, 3);
                ctx.restore();
                return;
            } else if (p.type === "sniper") {
                var ang2 = Math.atan2(p.vy, p.vx);
                ctx.translate(p.x, drawY);
                ctx.rotate(ang2);
                ctx.fillStyle = "#cc88ff";
                ctx.fillRect(-10, -1, 20, 2);
            } else {
                var ang3 = Math.atan2(p.vy, p.vx);
                ctx.translate(p.x, drawY);
                ctx.rotate(ang3);
                ctx.fillStyle = "#fffde0";
                ctx.fillRect(-6, -1.5, 12, 3);
            }
            ctx.restore();
        });
    }
};