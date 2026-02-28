window.RTS = window.RTS || {};

/**
 * AllySystem — faction alliée contrôlée par l'IA ("green").
 *
 * L'allié est optionnel (activé via les options du menu principal).
 * Il spawn des squads périodiquement depuis le bas-droit de la carte,
 * attaque les squads rouges automatiquement et n'interfère jamais avec le joueur.
 *
 * Règles de ciblage :
 *   blue  → attaque red uniquement
 *   ally  → attaque red uniquement
 *   red   → attaque blue ET ally
 */
RTS.AllySystem = {

    _enabled:       false,
    _spawnTimer:    0,
    _spawnInterval: 28,   // secondes entre chaque renfort

    // Types disponibles pour l'allié (progression par vague)
    POOL: [
        { type: "riflemen",  minWave: 1 },
        { type: "matv",      minWave: 4 },
        { type: "sniper_team", minWave: 5 },
        { type: "bradley",   minWave: 6 },
        { type: "apache",    minWave: 8 }
    ],

    // ── Initialisation ────────────────────────────────────────────────────────

    init: function(game) {
        this._enabled     = true;
        this._spawnTimer  = 0;
        this._spawnInitial(game);
    },

    disable: function() {
        this._enabled = false;
    },

    // ── Mise à jour principale ────────────────────────────────────────────────

    update: function(game, delta) {
        if (!this._enabled) return;

        this._spawnTimer += delta;
        if (this._spawnTimer >= this._spawnInterval) {
            this._spawnTimer = 0;
            this._spawnReinforcement(game);
        }

        this._updateAI(game, delta);
    },

    // ── Spawn initial (3 riflemen) ────────────────────────────────────────────

    _spawnInitial: function(game) {
        var positions = [
            { x: RTS.WORLD_W - 320, y: RTS.WORLD_H - 180 },
            { x: RTS.WORLD_W - 420, y: RTS.WORLD_H - 240 },
            { x: RTS.WORLD_W - 280, y: RTS.WORLD_H - 300 }
        ];
        positions.forEach(function(p) {
            var sq = new RTS.Squad(p.x, p.y, "ally", "riflemen");
            if (sq.members && sq.members.length > 0) game.squads.push(sq);
        });
    },

    // ── Renfort périodique ────────────────────────────────────────────────────

    _spawnReinforcement: function(game) {
        var wave = game.wave || 1;
        var avail = this.POOL.filter(function(e) { return e.minWave <= wave; });
        var entry = avail[Math.floor(Math.random() * avail.length)];

        // 1 ou 2 squads selon la vague
        var count = wave >= 6 ? 2 : 1;
        for (var i = 0; i < count; i++) {
            var x = RTS.WORLD_W - 250 - Math.random() * 150;
            var y = RTS.WORLD_H - 100 - i * 80 - Math.random() * 60;
            var sq = new RTS.Squad(x, y, "ally", entry.type);
            if (sq.members && sq.members.length > 0) {
                game.squads.push(sq);
                // Notification discrète
                RTS.AllySystem._notif("Renfort allié : " + sq.def.label);
            }
        }
    },

    // ── IA de déplacement ────────────────────────────────────────────────────
    // L'allié avance vers le squad rouge le plus proche qui n'est pas encore
    // à portée d'attaque. Le combat est géré par SquadCombatSystem.

    _updateAI: function(game, delta) {
        var reds = game.squads.filter(function(s) {
            return s.team === "red" && !s.isDead();
        });

        game.squads.forEach(function(sq) {
            if (sq.team !== "ally") return;
            if (sq.isDead()) return;
            if (!sq.def) return;

            var range = sq.def.attackRange || 80;

            // Si l'allié a déjà une cible manuelle, ne pas l'écraser
            if (sq.target) return;

            var closest = null, closestD = Infinity;
            reds.forEach(function(r) {
                var dx = r.x - sq.x;
                var dy = r.y - sq.y;
                var d  = Math.sqrt(dx * dx + dy * dy);
                if (d < closestD) { closestD = d; closest = r; }
            });

            if (!closest) return;

            var minRange = sq.def.minRange || 0;
            if (minRange > 0 && closestD < minRange) {
                sq.target = null;
                return;
            }

            if (closestD > range * 0.85) {
                sq.target = { x: closest.x, y: closest.y };
            } else {
                sq.target = null;
            }
        });
    },

    // ── Notification UI ───────────────────────────────────────────────────────

    _notif: function(msg) {
        var el = document.getElementById("allyNotif");
        if (!el) return;
        el.textContent   = "🟢 " + msg;
        el.style.opacity = "1";
        clearTimeout(RTS.AllySystem._notifTimer);
        RTS.AllySystem._notifTimer = setTimeout(function() {
            el.style.opacity = "0";
        }, 2500);
    }
};