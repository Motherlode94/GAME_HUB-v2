window.RTS = window.RTS || {};

/**
 * DefenseTower — Système de tourelles défensives automatiques.
 *
 * Chaque bâtiment de type "tower" (team "blue" ou "ally") :
 *  - Détecte les squads rouges dans son rayon d'action
 *  - Fait pivoter son canon vers la cible (b._aimAngle)
 *  - Tire un projectile qui consomme des munitions
 *  - Cesse de tirer si ammo <= 0
 *
 * Intégration :
 *  - Appelé dans la boucle principale via RTS.DefenseTower.update(game, delta)
 *  - L'angle _aimAngle est lu par BuildingRenderer._detail_tower pour le rendu
 */
RTS.DefenseTower = {

    // ── Constantes ────────────────────────────────────────────────────────────
    RANGE:        185,  // portée de détection (px monde)
    DAMAGE:       38,   // dégâts par projectile
    RATE:         0.9,  // tirs/seconde
    AMMO_COST:    2,    // munitions consommées par tir
    PROJ_SPEED:   520,  // vitesse du projectile

    // ── Mise à jour principale ────────────────────────────────────────────────

    update: function(game, delta) {
        var self = this;

        game.buildings.forEach(function(b) {
            if (b.type !== "tower")                          return;
            if (b.team !== "blue" && b.team !== "ally")      return;
            if (b.hp <= 0)                                   return;

            // Timer de tir
            b._towerTimer = (b._towerTimer || 0) - delta;
            if (b._towerTimer > 0) return;

            // Pas de munitions → la tour se met en veille
            if (game.resources.ammo < self.AMMO_COST) return;

            // Trouver le squad ennemi le plus proche dans le rayon
            var target = null, bestD = Infinity;

            game.squads.forEach(function(s) {
                if (s.team !== "red")  return;
                if (s.isDead())        return;

                var dx = s.x - b.x;
                var dy = s.y - b.y;
                var d  = Math.sqrt(dx * dx + dy * dy);

                if (d < self.RANGE && d < bestD) {
                    bestD  = d;
                    target = s;
                }
            });

            if (!target) return;

            // ── Tir ──────────────────────────────────────────────────────────
            game.resources.ammo -= self.AMMO_COST;
            b._towerTimer = 1 / self.RATE;

            // Angle du canon (utilisé par le renderer)
            b._aimAngle = Math.atan2(target.y - b.y, target.x - b.x);

            // Membre cible le plus proche
            var member = null, bestMD = Infinity;
            target.members.forEach(function(m) {
                if (m.dead) return;
                var dx = m.x - b.x, dy = m.y - b.y;
                var d  = Math.sqrt(dx * dx + dy * dy);
                if (d < bestMD) { bestMD = d; member = m; }
            });
            if (!member) return;

            // Création du projectile
            var angle = Math.atan2(member.y - b.y, member.x - b.x);
            var proj = {
                type:         "bullet",
                team:         b.team,
                x:            b.x,
                y:            b.y,
                targetMember: member,
                targetSquad:  target,
                tx:           member.x,
                ty:           member.y,
                speed:        self.PROJ_SPEED,
                damage:       self.DAMAGE,
                aoeDamage:    0,
                aoeRadius:    0,
                arcHeight:    0,
                trail:        [],
                age:          0,
                totalDist:    Math.sqrt((member.x - b.x) ** 2 + (member.y - b.y) ** 2),
                vx:           Math.cos(angle) * self.PROJ_SPEED,
                vy:           Math.sin(angle) * self.PROJ_SPEED
            };

            game.projectiles.push(proj);

            // Effets visuels
            RTS.ParticleSystem.spawnMuzzleFlash(
                game.particles, b.x, b.y, member.x, member.y, false
            );
        });
    }
};