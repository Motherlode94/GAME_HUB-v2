window.RTS = window.RTS || {};

/**
 * ResourceSystem
 *
 * Responsabilités :
 *  1. Revenus passifs des bâtiments économiques (mine / refinery / arsenal).
 *  2. Soin des squads alliés par les hôpitaux.
 *  3. Mise à jour du HUD ressources.
 *
 * Revenus calibrés pour Broken Arrow — rythme tactique soutenu :
 *   mine     : +18 or/s   — 2 mines couvrent une infanterie continue
 *   refinery : +12 fuel/s — 1 raffinerie suffit pour 2-3 blindés actifs
 *   arsenal  : +10 ammo/s — alimente tours et artillerie en combat
 *
 * Plafond : 9999 par ressource (évite l'inflation infinie).
 */
RTS.ResourceSystem = {

    MAX_RESOURCE: 9999,

    update: function(game, delta) {
        RTS.ResourceSystem._applyPassiveIncome(game, delta);
        RTS.ResourceSystem._applyHospitalHeal(game, delta);
        RTS.ResourceSystem._updateHUD(game);
    },

    // ── Revenus passifs ───────────────────────────────────────────────────────

    _applyPassiveIncome: function(game, delta) {
        var max = RTS.ResourceSystem.MAX_RESOURCE;

        game.buildings.forEach(function(b) {
            if (b.team !== "blue" || b.hp <= 0) return;
            var passive = RTS.Building.PASSIVE[b.type];
            if (!passive) return;

            if (passive.gold) game.resources.gold = Math.min(max, game.resources.gold + passive.gold * delta);
            if (passive.fuel) game.resources.fuel = Math.min(max, game.resources.fuel + passive.fuel * delta);
            if (passive.ammo) game.resources.ammo = Math.min(max, game.resources.ammo + passive.ammo * delta);
        });
    },

    // ── Hôpital : régénération HP des squads alliés dans le rayon ────────────
    // Rayon 180 px, heal 8 HP/s par membre vivant.

    _applyHospitalHeal: function(game, delta) {
        var RADIUS    = 180;
        var HEAL_RATE = 8;  // HP/s par membre

        game.buildings.forEach(function(b) {
            if (b.team !== "blue" || b.type !== "hospital" || b.hp <= 0) return;

            game.squads.forEach(function(s) {
                if (s.team !== "blue" || s.isDead()) return;

                var dx = s.x - b.x;
                var dy = s.y - b.y;
                if (dx * dx + dy * dy > RADIUS * RADIUS) return;

                s.members.forEach(function(m) {
                    if (!m.dead) m.hp = Math.min(m.maxHp, m.hp + HEAL_RATE * delta);
                });
            });
        });
    },

    // ── HUD ───────────────────────────────────────────────────────────────────

    _updateHUD: function(game) {
        var el;
        el = document.getElementById("resGold"); if (el) el.textContent = Math.floor(game.resources.gold);
        el = document.getElementById("resFuel"); if (el) el.textContent = Math.floor(game.resources.fuel);
        el = document.getElementById("resAmmo"); if (el) el.textContent = Math.floor(game.resources.ammo);
    },

    // ── Utilitaires ───────────────────────────────────────────────────────────

    canAfford: function(game, cost) {
        return game.resources.gold >= (cost.gold || 0) &&
               game.resources.fuel >= (cost.fuel || 0) &&
               game.resources.ammo >= (cost.ammo || 0);
    },

    spend: function(game, cost) {
        game.resources.gold -= (cost.gold || 0);
        game.resources.fuel -= (cost.fuel || 0);
        game.resources.ammo -= (cost.ammo || 0);
    }
};