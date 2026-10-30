window.RTS = window.RTS || {};

/**
 * WaveSystem — Vagues progressives avec flanc multiple, vagues rush et boss.
 *
 * Niveau : toutes les 8 vagues → écran "Niveau terminé"
 * Vague  3   : vague rush (+60% unités)
 * Vague  5   : boss wave (véhicules lourds garantis, spawn multi-flancs)
 * Vague  8   : boss final niveau (+ apache/MLRS garantis)
 *
 * difficulty : "easy" | "normal" | "hard"
 */
RTS.WaveSystem = {

    _timer:       0,
    _prepDone:    false,
    _waveInLevel: 0,
    _levelDone:   false,

    // ── Config par difficulté ─────────────────────────────────────────────────
    DIFF: {
        easy:   { prepTime: 90,  cooldown: 30, squadCount: 4,  hpScale: 0.70, label: "FACILE"    },
        normal: { prepTime: 55,  cooldown: 14, squadCount: 8,  hpScale: 1.10, label: "NORMAL"    },
        hard:   { prepTime: 30,  cooldown: 7,  squadCount: 14, hpScale: 1.80, label: "DIFFICILE" }
    },

    difficulty: "normal",

    // Catalogue : minWave abaissé pour accélérer l'escalade
    CATALOG: [
        { type: "riflemen",    cost: 1, minWave: 1 },
        { type: "at_team",     cost: 2, minWave: 2 },
        { type: "sniper_team", cost: 2, minWave: 2 },
        { type: "manpads",     cost: 2, minWave: 3 },
        { type: "matv",        cost: 2, minWave: 3 },
        { type: "bradley",     cost: 3, minWave: 4 },
        { type: "m1a2",        cost: 5, minWave: 5 },
        { type: "paladin",     cost: 4, minWave: 5 },
        { type: "mlrs",        cost: 5, minWave: 7 },
        { type: "apache",      cost: 4, minWave: 7 },
        { type: "blackhawk",   cost: 3, minWave: 6 },
        { type: "assault_team", cost: 2, minWave: 2 },
        { type: "recon_team", cost: 2, minWave: 2 },
        { type: "heavy_mg", cost: 2, minWave: 3 },
        { type: "mechanized_scout", cost: 3, minWave: 3 },
        { type: "wheeled_ifv", cost: 3, minWave: 4 },
        { type: "combat_medic", cost: 2, minWave: 4 },
        { type: "mobile_aa", cost: 4, minWave: 5 },
        { type: "attack_drone", cost: 3, minWave: 5 },
        { type: "rocket_artillery", cost: 4, minWave: 6 },
        { type: "interceptor_drone", cost: 3, minWave: 7 },
        { type: "grenadier_team", cost: 2, minWave: 2 },
        { type: "combat_engineers", cost: 2, minWave: 3 },
        { type: "armored_car", cost: 2, minWave: 3 },
        { type: "tank_destroyer", cost: 5, minWave: 5 },
        { type: "heavy_aa", cost: 4, minWave: 6 },
        { type: "ew_drone", cost: 2, minWave: 5 },
        { type: "light_attack_heli", cost: 3, minWave: 5 },
        { type: "gunship", cost: 5, minWave: 7 }
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

        // ── Défaite : plus de squads ET plus de bâtiments bleus ──────────────
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

        // ── Phase de préparation ──────────────────────────────────────────────
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

        // ── Entre vagues ──────────────────────────────────────────────────────
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

        // Niveau terminé après 8 vagues
        if (this._waveInLevel > 8) {
            this._levelDone = true;
            RTS.WaveSystem._showLevelComplete(game);
            return;
        }

        game.wave++;

        var isRush = (this._waveInLevel % 3 === 0);  // vague 3, 6 → rush
        var isBoss = (this._waveInLevel === 5 || this._waveInLevel === 8); // boss

        this._spawnWave(game, isRush, isBoss);

        var cfg = this._cfg();
        var tag = isBoss ? "⚠ VAGUE BOSS" : (isRush ? "⚡ VAGUE RUSH" : "— VAGUE");
        RTS.WaveSystem._notif(
            tag + " " + this._waveInLevel + "/8  (Niv. " + (game.level || 1) +
            " · " + cfg.label + ") —", "1"
        );
        setTimeout(function() { RTS.WaveSystem._notif("", "0"); }, 3500);

        var el = document.getElementById("waveNum");
        if (el) el.textContent = "N" + (game.level || 1) + " · " + this._waveInLevel + "/8";
    },

    _spawnWave: function(game, isRush, isBoss) {
        var w    = game.wave;
        var lvl  = game.level || 1;
        var cfg  = this._cfg();

        // Nombre d'unités : rush +60%, boss +80%, normal +0%
        var baseCount = cfg.squadCount + Math.floor((w - 1) * 0.6) + (lvl - 1) * 2;
        var count = isRush ? Math.round(baseCount * 1.6)
                  : isBoss ? Math.round(baseCount * 1.8)
                  : baseCount;

        // Alternate infantry assaults, mechanized pushes, air raids and artillery.
        // Support medics participate only when damage dealers are already present.
        var doctrine = ["infantry", "mechanized", "air", "artillery"][(this._waveInLevel - 1) % 4];
        var doctrineTypes = {
            infantry: ["riflemen","assault_team","recon_team","heavy_mg","grenadier_team","combat_engineers","at_team","sniper_team"],
            mechanized: ["matv","mechanized_scout","bradley","wheeled_ifv","armored_car","tank_destroyer","m1a2","riflemen"],
            air: ["apache","blackhawk","attack_drone","interceptor_drone","light_attack_heli","gunship","manpads","mobile_aa","riflemen"],
            artillery: ["paladin","rocket_artillery","tank_destroyer","mlrs","at_team","heavy_mg","riflemen"]
        };
        var avail = this.CATALOG.filter(function(e) {
            return e.minWave <= w && e.type !== "combat_medic";
        });
        var themed = avail.filter(function(e) { return doctrineTypes[doctrine].indexOf(e.type) !== -1; });
        // Keep an accessible fallback in early waves.
        if (!themed.length) themed = avail;

        // HP multiplicateur — escalade plus agressive
        var hpMult = Math.min(
            cfg.hpScale * (1 + (w - 1) * 0.13 + (lvl - 1) * 0.22),
            cfg.hpScale * 5.5
        );

        // ── Points de spawn ──
        // Flancs possibles : droite (toujours), puis gauche/haut/bas selon vague
        var flanks = [ { side: "right" } ];
        if (w >= 4)  flanks.push({ side: "bottom" });
        if (w >= 6)  flanks.push({ side: "top" });
        if (isBoss)  flanks.push({ side: "left" });   // boss attaque de partout

        for (var i = 0; i < count; i++) {
            // Choix du pool selon vague
            var pool;
            if (isBoss) {
                // Boss wave : au moins la moitié en unités lourdes
                var heavy = avail.filter(function(e) { return e.cost >= 3; });
                pool = (i < Math.ceil(count / 2) && heavy.length > 0) ? heavy : avail;
            } else if (w <= 2) {
                pool = avail.filter(function(e) { return e.cost <= 1; });
            } else if (w <= 4) {
                pool = (i >= Math.floor(count * 0.6))
                    ? avail
                    : avail.filter(function(e) { return e.cost <= 2; });
            } else {
                var heavyPool = avail.filter(function(e) { return e.cost >= 3; });
                pool = (i < Math.ceil(count * 0.4) && heavyPool.length > 0) ? heavyPool : avail;
            }

            if (!pool || pool.length === 0) pool = avail;

            // Most attackers follow the wave doctrine, with mixed threats remaining.
            if (!isBoss && i % 4 !== 0) {
                var thematicPool = pool.filter(function(e) {
                    return themed.some(function(t) { return t.type === e.type; });
                });
                if (thematicPool.length) pool = thematicPool;
            }
            var entry = pool[Math.floor(Math.random() * pool.length)];

            // Flanc aléatoire parmi les flancs disponibles
            var flank = flanks[Math.floor(Math.random() * flanks.length)];
            var x, y;
            var margin = 120;

            switch (flank.side) {
                case "right":
                    x = RTS.WORLD_W - margin - Math.random() * 200;
                    y = 80 + Math.random() * (RTS.WORLD_H - 160);
                    break;
                case "left":
                    x = margin + Math.random() * 200;
                    y = 80 + Math.random() * (RTS.WORLD_H - 160);
                    break;
                case "top":
                    x = 200 + Math.random() * (RTS.WORLD_W - 400);
                    y = margin + Math.random() * 100;
                    break;
                case "bottom":
                    x = 200 + Math.random() * (RTS.WORLD_W - 400);
                    y = RTS.WORLD_H - margin - Math.random() * 100;
                    break;
                default:
                    x = RTS.WORLD_W - margin - Math.random() * 200;
                    y = 80 + Math.random() * (RTS.WORLD_H - 160);
            }

            var sq = new RTS.Squad(x, y, "red", entry.type);
            if (!sq.members || sq.members.length === 0) continue;

            sq.members.forEach(function(m) {
                m.maxHp = m.hp = Math.round(m.maxHp * hpMult);
            });

            game.squads.push(sq);
        }
    },

    // ── Forcer la prochaine vague (cheat) ────────────────────────────────────
    forceNextWave: function(game) {
        if (!this._prepDone) {
            this._prepDone = true;
            this._timer    = 0;
        }
        game.squads.forEach(function(s) {
            if (s.team === "red") s.members.forEach(function(m) { m.dead = true; m.hp = 0; });
        });
        this._timer = this._cfg().cooldown + 1;
    },

    // ── UI helpers ────────────────────────────────────────────────────────────

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
        document.getElementById("bannerSub").textContent =
            "8 vagues repoussées · Niveau " + (lvl + 1) + " disponible";

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
        // Bonus de ressources à chaque niveau
        game.resources.gold += 400 + (game.level - 1) * 100;
        game.resources.fuel += 200 + (game.level - 1) * 50;
        game.resources.ammo += 150 + (game.level - 1) * 50;
        RTS.WaveSystem.reset();
        RTS.WaveSystem._notif("NIVEAU " + game.level + " — PRÉPAREZ-VOUS !", "1");
        setTimeout(function() { RTS.WaveSystem._notif("", "0"); }, 4000);
    }
};