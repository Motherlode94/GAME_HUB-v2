window.RTS = window.RTS || {};

/**
 * WaveSystem
 *
 * Vagues 1-2  : riflemen uniquement
 * Vagues 3-4  : + sniper_team, at_team, manpads
 * Vague  5    : + matv
 * Vague  6    : + bradley
 * Vagues 7+   : + m1a2, paladin
 * Vagues 9+   : + mlrs, apache
 *
 * Niveau : toutes les 5 vagues nettoyées → écran "Niveau terminé"
 * game.level  : niveau courant (initialisé à 1 dans main.js)
 * difficulty  : "easy" | "normal" | "hard" — affecte prepTime, cooldown, count, HP
 */
RTS.WaveSystem = {

    _timer:       0,
    _prepDone:    false,
    _waveInLevel: 0,
    _levelDone:   false,

    // ── Configuration par difficulté ──────────────────────────────────────────
    DIFF: {
        easy:   { prepTime: 120, cooldown: 40, squadCount: 3, hpScale: 0.60, label: "FACILE"  },
        normal: { prepTime: 60,  cooldown: 20, squadCount: 5, hpScale: 1.00, label: "NORMAL"  },
        hard:   { prepTime: 35,  cooldown: 10, squadCount: 8, hpScale: 1.55, label: "DIFFICILE"}
    },

    // Définie avant reset() via RTS.WaveSystem.difficulty = "..."
    difficulty: "normal",

    CATALOG: [
        { type: "riflemen",    cost: 1, minWave: 1 },
        { type: "sniper_team", cost: 2, minWave: 3 },
        { type: "at_team",     cost: 2, minWave: 3 },
        { type: "manpads",     cost: 2, minWave: 4 },
        { type: "matv",        cost: 2, minWave: 5 },
        { type: "bradley",     cost: 3, minWave: 6 },
        { type: "m1a2",        cost: 5, minWave: 7 },
        { type: "paladin",     cost: 4, minWave: 7 },
        { type: "mlrs",        cost: 5, minWave: 9 },
        { type: "apache",      cost: 4, minWave: 9 }
    ],

    reset: function() {
        this._timer       = 0;
        this._prepDone    = false;
        this._waveInLevel = 0;
        this._levelDone   = false;
    },

    _cfg: function() {
        return this.DIFF[this.difficulty] || this.DIFF.normal;
    },

    update: function(game, delta) {
        if (game.gameOver || this._levelDone) return;

        var cfg = this._cfg();

        // ── Défaite ──────────────────────────────────────────────────────────
        var blues = game.squads.filter(function(s) {
            return s.team === "blue" &&
                   s.def && s.def.combatMode !== "harvest" &&
                   s.def.combatMode !== "repair";
        });
        if (blues.length === 0 &&
            game.buildings.filter(function(b) { return b.team === "blue"; }).length === 0) {
            game.gameOver = true;
            RTS.WaveSystem._showDefeat();
            return;
        }

        // ── Phase de préparation ─────────────────────────────────────────────
        if (!this._prepDone) {
            this._timer += delta;
            var rem = Math.ceil(cfg.prepTime - this._timer);
            RTS.WaveSystem._notif("PREMIÈRE ATTAQUE DANS " + rem + "s", "1");
            if (this._timer >= cfg.prepTime) {
                this._prepDone = true;
                this._timer    = 0;
                this._launchWave(game);
            }
            return;
        }

        // ── Entre vagues ─────────────────────────────────────────────────────
        var reds = game.squads.filter(function(s) { return s.team === "red" && !s.isDead(); });

        if (reds.length === 0) {
            this._timer += delta;
            var wait = Math.ceil(cfg.cooldown - this._timer);
            RTS.WaveSystem._notif("PROCHAINE VAGUE DANS " + wait + "s", "0.7");
            if (this._timer >= cfg.cooldown) {
                this._timer = 0;
                this._launchWave(game);
            }
        } else {
            this._timer = 0;
            RTS.WaveSystem._notif("", "0");
        }
    },

    _launchWave: function(game) {
        this._waveInLevel++;

        if (this._waveInLevel > 5) {
            this._levelDone = true;
            RTS.WaveSystem._showLevelComplete(game);
            return;
        }

        game.wave++;
        this._spawnWave(game);

        var cfg = this._cfg();
        RTS.WaveSystem._notif(
            "— VAGUE " + this._waveInLevel + "/5  (Niv. " + (game.level || 1) +
            " · " + cfg.label + ") —", "1"
        );
        setTimeout(function() { RTS.WaveSystem._notif("", "0"); }, 3000);

        var el = document.getElementById("waveNum");
        if (el) el.textContent = "N" + (game.level || 1) + " · " + this._waveInLevel + "/5";
    },

    _spawnWave: function(game) {
        var w    = game.wave;
        var lvl  = game.level || 1;
        var cfg  = this._cfg();
        var count = cfg.squadCount;

        var avail = this.CATALOG.filter(function(e) { return e.minWave <= w; });

        for (var i = 0; i < count; i++) {
            var pool;

            if (w <= 3) {
                pool = avail.filter(function(e) { return e.cost <= 2; });
            } else if (w <= 6) {
                pool = (i >= 3) ? avail : avail.filter(function(e) { return e.cost <= 2; });
            } else {
                var heavy = avail.filter(function(e) { return e.cost >= 3; });
                pool = (i < 3 && heavy.length > 0) ? heavy : avail;
            }

            if (!pool || pool.length === 0) pool = avail;

            var entry = pool[Math.floor(Math.random() * pool.length)];
            var x = RTS.WORLD_W - 120 - Math.random() * 250;
            var y = 100 + (i / count) * (RTS.WORLD_H - 200) + (Math.random() - 0.5) * 80;

            var sq = new RTS.Squad(x, y, "red", entry.type);
            if (!sq.members || sq.members.length === 0) continue;

            // HP croissant : difficulté × vague × niveau
            var hpMult = Math.min(
                cfg.hpScale * (1 + (w - 1) * 0.08 + (lvl - 1) * 0.15),
                cfg.hpScale * 4.0
            );
            sq.members.forEach(function(m) {
                m.maxHp = m.hp = Math.round(m.maxHp * hpMult);
            });

            game.squads.push(sq);
        }
    },

    // ── Forcer la prochaine vague (cheat) ─────────────────────────────────────
    forceNextWave: function(game) {
        if (!this._prepDone) {
            this._prepDone = true;
            this._timer    = 0;
        }
        // Tuer tous les rouges restants
        game.squads.forEach(function(s) {
            if (s.team === "red") s.members.forEach(function(m) { m.dead = true; m.hp = 0; });
        });
        this._timer = this._cfg().cooldown + 1;
    },

    // ── UI helpers ───────────────────────────────────────────────────────────

    _notif: function(txt, opacity) {
        var el = document.getElementById("waveNotif");
        if (el) { el.textContent = txt; el.style.opacity = opacity; }
    },

    _showDefeat: function() {
        document.getElementById("bannerTitle").textContent = "Défaite";
        document.getElementById("bannerSub").textContent   = "Votre base a été anéantie.";
        var nxt = document.getElementById("nextLevelBtn");
        if (nxt) nxt.style.display = "none";
        var rst = document.getElementById("restartBtn");
        if (rst) { rst.textContent = "Recommencer"; rst.onclick = function() { location.reload(); }; }
        document.getElementById("banner").style.display = "block";
    },

    _showLevelComplete: function(game) {
        var lvl = game.level || 1;
        document.getElementById("bannerTitle").textContent = "NIVEAU " + lvl + " TERMINÉ";
        document.getElementById("bannerSub").textContent   =
            "5 vagues repoussées · Niveau " + (lvl + 1) + " disponible";

        var nxt = document.getElementById("nextLevelBtn");
        if (nxt) {
            nxt.style.display = "inline-block";
            nxt.onclick = function() {
                document.getElementById("banner").style.display = "none";
                RTS.WaveSystem._startNextLevel(game);
            };
        }
        var rst = document.getElementById("restartBtn");
        if (rst) { rst.textContent = "Menu principal"; rst.onclick = function() { location.reload(); }; }
        document.getElementById("banner").style.display = "block";
    },

    _startNextLevel: function(game) {
        game.level = (game.level || 1) + 1;
        game.squads      = game.squads.filter(function(s) { return s.team !== "red"; });
        game.projectiles = [];
        game.particles   = [];
        game.craters     = [];
        game.resources.gold += 300;
        game.resources.fuel += 150;
        game.resources.ammo += 100;
        RTS.WaveSystem.reset();
        RTS.WaveSystem._notif("NIVEAU " + game.level + " — PRÉPAREZ-VOUS !", "1");
        setTimeout(function() { RTS.WaveSystem._notif("", "0"); }, 4000);
    }
};