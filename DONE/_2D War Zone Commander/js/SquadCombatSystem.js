window.RTS = window.RTS || {};

/**
 * SquadCombatSystem — combat entièrement basé sur les squads.
 *
 * Règles de faction :
 *   blue / ally  → ciblent uniquement "red"
 *   red          → ciblent "blue" ET "ally"
 */
RTS.SquadCombatSystem = {

    // Retourne true si `otherTeam` est un ennemi de `squadTeam`
    _isEnemy: function(squadTeam, otherTeam) {
        if (squadTeam === "red")  return otherTeam === "blue" || otherTeam === "ally";
        return otherTeam === "red";   // blue ou ally
    },

    update: function(game, delta) {
        if (!RTS.WaveSystem._prepDone) return;

        var squads = game.squads;
        var self   = this;

        squads.forEach(function(squad) {
            if (!squad.def) return;

            // Tick burst queue
            if (squad.burstQueue && squad.burstQueue.length > 0) {
                var next = squad.burstQueue[0];
                next.delay -= delta;
                if (next.delay <= 0) {
                    squad.burstQueue.shift();
                    if (next.targetSquad && !next.targetSquad.isDead()) {
                        self._emitProjectile(game, squad, next.targetSquad, next.projType || "bullet");
                    }
                }
            }

            if (squad.attackTimer > 0) return;

            var mode = squad.def.combatMode;
            if (mode === "repair" || mode === "harvest" || mode === "none") return;

            // Trouver la cible ennemie la plus proche
            var target  = null;
            var targetD = Infinity;

            squads.forEach(function(other) {
                if (!self._isEnemy(squad.team, other.team)) return;
                if (other.isDead()) return;
                if (squad.team !== "red" && !RTS.FogOfWar.isVisible(game, other.x, other.y)) return;
                var dx = other.x - squad.x;
                var dy = other.y - squad.y;
                var d  = Math.sqrt(dx * dx + dy * dy);
                if (d < targetD) { targetD = d; target = other; }
            });

            if (!target) return;

            var range = squad.def.attackRange;
            if (mode === "artillery" && targetD < (squad.def.minRange || 0)) return;
            if (targetD > range) return;

            switch (mode) {
                case "burst":      self._burst(game, squad, target);      break;
                case "single":     self._single(game, squad, target);     break;
                case "shell":      self._shell(game, squad, target);      break;
                case "machinegun": self._machinegun(game, squad, target); break;
                case "artillery":  self._artillery(game, squad, target);  break;
                case "rocket":     self._rocket(game, squad, target);     break;
            }

            squad.attackTimer = 1 / (squad.def.attackRate || 1);
        });

        // Suppression des squads morts
        for (var i = squads.length - 1; i >= 0; i--) {
            if (squads[i].isDead()) {
                var s = squads[i];
                if (s.def && (s.def.category === "vehicle" || s.def.category === "air")) {
                    RTS.ParticleSystem.spawnExplosion(game.particles, s.x, s.y);
                    RTS.ParticleSystem.spawnShockwave(game.particles, s.x, s.y);
                }
                var si = game.selectedSquads.indexOf(s);
                if (si !== -1) game.selectedSquads.splice(si, 1);
                squads.splice(i, 1);
            }
        }
    },

    // ── BURST ────────────────────────────────────────────────────────────────
    _burst: function(game, squad, target) {
        var alive = squad.aliveMembers();
        if (alive.length === 0) return;
        alive.forEach(function(m) {
            m.muzzleFlash = 0.08;
            m.fireAngle   = Math.atan2(target.y - m.y, target.x - m.x);
        });
        this._emitProjectile(game, squad, target, "bullet");
        var count = squad.def.burstCount || 3;
        var delay = squad.def.burstDelay || 0.07;
        for (var i = 1; i < count; i++) {
            squad.burstQueue.push({ targetSquad: target, delay: delay * i, projType: "bullet" });
        }
        alive.forEach(function(m) { RTS.ParticleSystem.spawnCasing(game.particles, m.x, m.y); });
    },

    // ── SINGLE ───────────────────────────────────────────────────────────────
    _single: function(game, squad, target) {
        var m = squad.aliveMembers()[0];
        if (!m) return;
        m.muzzleFlash = 0.12;
        m.fireAngle   = Math.atan2(target.y - m.y, target.x - m.x);
        this._emitProjectile(game, squad, target, "sniper");
        RTS.ParticleSystem.spawnMuzzleFlash(game.particles, m.x, m.y, target.x, target.y, false);
    },

    // ── SHELL ────────────────────────────────────────────────────────────────
    _shell: function(game, squad, target) {
        var m = squad.aliveMembers()[0];
        if (!m) return;
        m.muzzleFlash = 0.15;
        this._emitProjectile(game, squad, target, "shell");
        RTS.ParticleSystem.spawnMuzzleFlash(game.particles, m.x, m.y, target.x, target.y, true);
        RTS.ParticleSystem.spawnRecoilSmoke(game.particles, m.x, m.y, target.x, target.y);
    },

    // ── MACHINEGUN ───────────────────────────────────────────────────────────
    _machinegun: function(game, squad, target) {
        var m = squad.aliveMembers()[0];
        if (!m) return;
        m.muzzleFlash = 0.05;
        m.fireAngle   = Math.atan2(target.y - m.y, target.x - m.x);
        var spread = (Math.random() - 0.5) * 0.15;
        this._emitProjectileWithSpread(game, squad, target, "bullet", spread);
        if (Math.random() < 0.4) RTS.ParticleSystem.spawnCasing(game.particles, m.x, m.y);
    },

    // ── ARTILLERY ────────────────────────────────────────────────────────────
    _artillery: function(game, squad, target) {
        var m = squad.aliveMembers()[0];
        if (!m) return;
        m.muzzleFlash = 0.2;
        this._emitProjectile(game, squad, target, "artillery");
        RTS.ParticleSystem.spawnMuzzleFlash(game.particles, m.x, m.y, target.x, target.y, true);
        RTS.ParticleSystem.spawnRecoilSmoke(game.particles, m.x, m.y, target.x, target.y);
    },

    // ── ROCKET ───────────────────────────────────────────────────────────────
    _rocket: function(game, squad, target) {
        var m = squad.aliveMembers()[0];
        if (!m) return;
        m.muzzleFlash = 0.1;
        this._emitProjectile(game, squad, target, "rocket");
        RTS.ParticleSystem.spawnMuzzleFlash(game.particles, m.x, m.y, target.x, target.y, false);
    },

    // ── Émission projectile ───────────────────────────────────────────────────
    _emitProjectile: function(game, squad, targetSquad, type) {
        this._emitProjectileWithSpread(game, squad, targetSquad, type, 0);
    },

    _emitProjectileWithSpread: function(game, squad, targetSquad, type, spread) {
        var shooter = squad.aliveMembers()[0];
        if (!shooter) return;

        var target = null, bestD = Infinity;
        targetSquad.members.forEach(function(m) {
            if (m.dead) return;
            var dx = m.x - shooter.x, dy = m.y - shooter.y;
            var d  = Math.sqrt(dx * dx + dy * dy);
            if (d < bestD) { bestD = d; target = m; }
        });
        if (!target) return;

        var def  = squad.def;
        var proj = {
            type:         type,
            team:         squad.team,
            originX:      shooter.x,
            originY:      shooter.y,
            x:            shooter.x,
            y:            shooter.y,
            targetMember: target,
            targetSquad:  targetSquad,
            tx:           target.x,
            ty:           target.y,
            speed:        def.projectileSpeed || 400,
            damage:       def.attackDamage,
            aoeDamage:    def.aoeDamage  || 0,
            aoeRadius:    def.aoeRadius  || 0,
            arcHeight:    def.arcHeight  || 0,
            trail:        [],
            age:          0,
            totalDist:    Math.sqrt((target.x - shooter.x) ** 2 + (target.y - shooter.y) ** 2)
        };

        var dx    = proj.tx - proj.x;
        var dy    = proj.ty - proj.y;
        var angle = Math.atan2(dy, dx) + spread;
        proj.vx   = Math.cos(angle) * proj.speed;
        proj.vy   = Math.sin(angle) * proj.speed;

        game.projectiles.push(proj);
    }
};