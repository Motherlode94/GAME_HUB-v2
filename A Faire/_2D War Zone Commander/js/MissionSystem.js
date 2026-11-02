window.RTS = window.RTS || {};

/**
 * MissionSystem — 25 missions réparties sur 5 tiers de difficulté.
 *
 * Tiers :
 *   ① Recrue     (vague 1)  — objectifs basiques
 *   ② Caporal    (vague 2)  — économie & construction
 *   ③ Sergent    (vague 4)  — force militaire
 *   ④ Lieutenant (vague 6)  — survie avancée
 *   ⑤ Colonel    (vague 8+) — légende
 *
 * Compteurs disponibles :
 *   kills, mines, towers, vehicles, apache, harvest,
 *   blueSquads (live), wave (live), level (live),
 *   barracks, hospitals, refineries, workers, engineers,
 *   snipers, air, allBuildings (live), kills2 (alias 2e palier kills)
 */
RTS.MissionSystem = {

    _missions: [],
    _game:     null,
    _panelEl:  null,

    // ══════════════════════════════════════════════════════
    //  DÉFINITION DES 25 MISSIONS
    // ══════════════════════════════════════════════════════
    DEFS: [

        // ── ① RECRUE ──────────────────────────────────────
        {
            id: "first_blood", tier: 1,
            title: "Premier Sang",
            desc:  "Éliminer 5 escouades ennemies",
            icon:  "🎯", track: "kills", goal: 5,
            reward: { gold: 150 }, minWave: 1
        },
        {
            id: "first_mine", tier: 1,
            title: "Ressources Primaires",
            desc:  "Construire 1 mine",
            icon:  "⛏", track: "mines", goal: 1,
            reward: { gold: 100 }, minWave: 1
        },
        {
            id: "first_tower", tier: 1,
            title: "Première Défense",
            desc:  "Ériger 1 tour de défense",
            icon:  "🗼", track: "towers", goal: 1,
            reward: { ammo: 120 }, minWave: 1
        },
        {
            id: "wave1_survive", tier: 1,
            title: "Baptême du Feu",
            desc:  "Repousser la vague 1",
            icon:  "🛡", track: "wave", goal: 1,
            reward: { gold: 120, ammo: 80 }, minWave: 1
        },
        {
            id: "harvest_basic", tier: 1,
            title: "Logistique de Base",
            desc:  "Récolter 300 ressources",
            icon:  "📦", track: "harvest", goal: 300,
            reward: { gold: 200 }, minWave: 1
        },

        // ── ② CAPORAL ─────────────────────────────────────
        {
            id: "mines2", tier: 2,
            title: "Réseau Minier",
            desc:  "Construire 3 mines",
            icon:  "⛏", track: "mines", goal: 3,
            reward: { gold: 350 }, minWave: 1
        },
        {
            id: "towers3", tier: 2,
            title: "Ligne de Défense",
            desc:  "Ériger 3 tours",
            icon:  "🗼", track: "towers", goal: 3,
            reward: { ammo: 300 }, minWave: 1
        },
        {
            id: "barracks2", tier: 2,
            title: "Casernement",
            desc:  "Construire 2 casernes",
            icon:  "⚔", track: "barracks", goal: 2,
            reward: { gold: 250 }, minWave: 1
        },
        {
            id: "workers3", tier: 2,
            title: "Main-d'Œuvre",
            desc:  "Déployer 3 logisticiens",
            icon:  "👷", track: "workers", goal: 3,
            reward: { gold: 200, fuel: 100 }, minWave: 1
        },
        {
            id: "kills15", tier: 2,
            title: "Chasseur",
            desc:  "Éliminer 15 escouades ennemies",
            icon:  "🎯", track: "kills", goal: 15,
            reward: { gold: 350 }, minWave: 2
        },

        // ── ③ SERGENT ─────────────────────────────────────
        {
            id: "vehicles3", tier: 3,
            title: "Poing Blindé",
            desc:  "Déployer 3 véhicules",
            icon:  "🚗", track: "vehicles", goal: 3,
            reward: { fuel: 250 }, minWave: 2
        },
        {
            id: "wave3_survive", tier: 3,
            title: "Défense de Base",
            desc:  "Repousser la vague 3",
            icon:  "🛡", track: "wave", goal: 3,
            reward: { gold: 450, ammo: 200 }, minWave: 1
        },
        {
            id: "hospitals2", tier: 3,
            title: "Soutien Médical",
            desc:  "Construire 2 hôpitaux",
            icon:  "➕", track: "hospitals", goal: 2,
            reward: { gold: 300, fuel: 100 }, minWave: 2
        },
        {
            id: "snipers2", tier: 3,
            title: "Yeux de Lynx",
            desc:  "Déployer 2 équipes sniper",
            icon:  "🔭", track: "snipers", goal: 2,
            reward: { gold: 300, ammo: 150 }, minWave: 2
        },
        {
            id: "harvest2000", tier: 3,
            title: "Économie de Guerre",
            desc:  "Récolter 2000 ressources",
            icon:  "💰", track: "harvest", goal: 2000,
            reward: { gold: 600 }, minWave: 1
        },

        // ── ④ LIEUTENANT ──────────────────────────────────
        {
            id: "apache1", tier: 4,
            title: "Domination Aérienne",
            desc:  "Déployer un Apache",
            icon:  "🚁", track: "apache", goal: 1,
            reward: { fuel: 300 }, minWave: 3
        },
        {
            id: "kills40", tier: 4,
            title: "Exterminateur",
            desc:  "Éliminer 40 escouades ennemies",
            icon:  "💀", track: "kills", goal: 40,
            reward: { gold: 600, ammo: 250 }, minWave: 4
        },
        {
            id: "blueSquads8", tier: 4,
            title: "Armée Complète",
            desc:  "Maintenir 8 escouades alliées",
            icon:  "⭐", track: "blueSquads", goal: 8,
            reward: { gold: 700 }, minWave: 3
        },
        {
            id: "towers6", tier: 4,
            title: "Bouclier Total",
            desc:  "Ériger 6 tours de défense",
            icon:  "🏰", track: "towers", goal: 6,
            reward: { ammo: 500 }, minWave: 3
        },
        {
            id: "wave6_survive", tier: 4,
            title: "Résistance",
            desc:  "Repousser la vague 6",
            icon:  "🔥", track: "wave", goal: 6,
            reward: { gold: 500, ammo: 500 }, minWave: 1
        },

        // ── ⑤ COLONEL ─────────────────────────────────────
        {
            id: "kills80", tier: 5,
            title: "Centurion",
            desc:  "Éliminer 80 escouades ennemies",
            icon:  "🏅", track: "kills", goal: 80,
            reward: { gold: 1000, ammo: 400 }, minWave: 6
        },
        {
            id: "air3", tier: 5,
            title: "Force Aérienne",
            desc:  "Déployer 3 unités aériennes",
            icon:  "✈", track: "air", goal: 3,
            reward: { fuel: 500 }, minWave: 5
        },
        {
            id: "blueSquads12", tier: 5,
            title: "Grande Armée",
            desc:  "Maintenir 12 escouades alliées",
            icon:  "🌟", track: "blueSquads", goal: 12,
            reward: { gold: 1000, fuel: 300 }, minWave: 6
        },
        {
            id: "wave8_survive", tier: 5,
            title: "Forteresse Imprenable",
            desc:  "Repousser la vague 8 (boss final)",
            icon:  "🏆", track: "wave", goal: 8,
            reward: { gold: 800, fuel: 400, ammo: 800 }, minWave: 1
        },
        {
            id: "victory", tier: 5,
            title: "Victoire Tactique",
            desc:  "Terminer le niveau 2",
            icon:  "🎖", track: "level", goal: 2,
            reward: { gold: 1500, fuel: 600, ammo: 600 }, minWave: 1
        }
    ],

    // ══════════════════════════════════════════════════════
    //  INITIALISATION
    // ══════════════════════════════════════════════════════
    init: function(game) {
        this._game = game;

        this._missions = this.DEFS.map(function(def) {
            return { def: def, progress: 0, completed: false };
        });

        this._counters = {
            kills:       0,
            mines:       0,
            towers:      0,
            barracks:    0,
            hospitals:   0,
            refineries:  0,
            vehicles:    0,
            apache:      0,
            air:         0,
            snipers:     0,
            workers:     0,
            engineers:   0,
            harvest:     0,
            blueSquads:  0,
            allBuildings:0,
            wave:        0,
            level:       0
        };

        this._buildUI();
    },

    // ══════════════════════════════════════════════════════
    //  UPDATE (par frame)
    // ══════════════════════════════════════════════════════
    update: function(game) {
        // Compteurs live
        this._counters.wave        = Math.max(this._counters.wave,  game.wave  || 1);
        this._counters.level       = Math.max(this._counters.level, game.level || 1);
        this._counters.blueSquads  = game.squads.filter(function(s) {
            return s.team === "blue" && !s.isDead();
        }).length;
        this._counters.allBuildings = game.buildings.filter(function(b) {
            return b.team === "blue";
        }).length;

        var self = this;
        this._missions.forEach(function(m) {
            if (m.completed) return;
            var count = self._counters[m.def.track] || 0;
            m.progress = Math.min(count, m.def.goal);
            if (m.progress >= m.def.goal) {
                m.completed = true;
                self._reward(game, m.def);
            }
        });

        this._updatePanel();
    },

    // ══════════════════════════════════════════════════════
    //  ÉVÉNEMENTS
    // ══════════════════════════════════════════════════════
    onKill: function(game) {
        this._counters.kills++;
        this.update(game);
    },

    onBuild: function(game, type) {
        if (type === "mine")     this._counters.mines++;
        if (type === "tower")    this._counters.towers++;
        if (type === "barracks") this._counters.barracks++;
        if (type === "hospital") this._counters.hospitals++;
        if (type === "refinery") this._counters.refineries++;
        this.update(game);
    },

    onProduce: function(game, typeName) {
        var def = RTS.SquadDefs ? RTS.SquadDefs[typeName] : null;
        if (!def) return;
        if (def.category === "vehicle")  this._counters.vehicles++;
        if (def.category === "air")      this._counters.air++;
        if (typeName === "apache")       this._counters.apache++;
        if (typeName === "worker")       this._counters.workers++;
        if (typeName === "engineer")     this._counters.engineers++;
        if (typeName === "sniper_team")  this._counters.snipers++;
        this.update(game);
    },

    onHarvest: function(game, amount) {
        this._counters.harvest += amount;
        this.update(game);
    },

    // ══════════════════════════════════════════════════════
    //  RÉCOMPENSE
    // ══════════════════════════════════════════════════════
    _reward: function(game, def) {
        var parts = [];
        if (def.reward.gold) { game.resources.gold += def.reward.gold; parts.push("+" + def.reward.gold + " Or"); }
        if (def.reward.fuel) { game.resources.fuel += def.reward.fuel; parts.push("+" + def.reward.fuel + " Carb."); }
        if (def.reward.ammo) { game.resources.ammo += def.reward.ammo; parts.push("+" + def.reward.ammo + " Mun."); }
        this._showNotif(
            def.icon + " " + def.title,
            parts.join("  |  "),
            def.tier >= 4 ? "#f5a623" : "#ffd232"
        );
        console.info("[Mission] ✓", def.title, "→", parts.join(", "));
    },

    // ══════════════════════════════════════════════════════
    //  UI
    // ══════════════════════════════════════════════════════

    // Couleurs par tier
    _tierColor: ["", "#7fb3ff", "#6ecf8a", "#ffd232", "#f5943a", "#e55b5b"],
    _tierLabel: ["", "①RECRUE", "②CAPORAL", "③SERGENT", "④LIEUT.", "⑤COLONEL"],

    _buildUI: function() {
        var old = document.getElementById("missionPanel");
        if (old) old.remove();

        var panel = document.createElement("div");
        panel.id = "missionPanel";
        panel.style.cssText = [
            "position:fixed", "top:84px", "left:12px",
            "width:174px",
            "background:rgba(6,8,16,.93)",
            "border:1px solid rgba(255,255,255,.07)",
            "border-radius:3px", "padding:8px 10px",
            "font-family:'Courier New',monospace",
            "font-size:9px", "color:rgba(255,255,255,.5)",
            "z-index:14", "pointer-events:none",
            "backdrop-filter:blur(6px)",
            "max-height:calc(100vh - 84px - 18px)",
            "overflow-y:auto", "overflow-x:hidden"
        ].join(";");

        panel.innerHTML =
            "<div style='font-size:8px;letter-spacing:.18em;text-transform:uppercase;" +
            "color:rgba(255,210,50,.6);margin-bottom:7px;border-bottom:1px solid rgba(255,255,255,.06);" +
            "padding-bottom:4px'>Missions</div>" +
            "<div id='missionList'></div>";

        document.body.appendChild(panel);
        this._panelEl = panel;

        // Toast notification
        var oldN = document.getElementById("missionNotif");
        if (oldN) oldN.remove();
        var notif = document.createElement("div");
        notif.id = "missionNotif";
        notif.style.cssText = [
            "position:fixed", "top:50%", "left:50%",
            "transform:translate(-50%,-50%)",
            "background:rgba(6,8,16,.97)",
            "border:1px solid rgba(255,210,50,.35)",
            "border-radius:4px", "padding:14px 32px",
            "text-align:center", "z-index:200",
            "font-family:'Courier New',monospace",
            "opacity:0", "transition:opacity .35s",
            "pointer-events:none", "max-width:440px"
        ].join(";");
        document.body.appendChild(notif);
    },

    _updatePanel: function() {
        var list = document.getElementById("missionList");
        if (!list) return;

        var self = this;
        var currentTier = 0;
        var html = "";

        // Filtre : afficher les missions non terminées dont le palier est débloqué
        var visible = this._missions.filter(function(m) {
            return !m.completed && m.def.minWave <= (self._counters.wave || 1);
        }).slice(0, 6);   // max 6 affichées à la fois

        if (visible.length === 0) {
            // Si toutes complétées ou aucune visible, afficher le score
            var done = this._missions.filter(function(m) { return m.completed; }).length;
            html = "<div style='color:rgba(46,204,113,.5);font-size:8px;text-align:center'>" +
                   "✓ " + done + "/" + this._missions.length + " missions terminées</div>";
        } else {
            visible.forEach(function(m) {
                var def = m.def;
                var pct = Math.round((m.progress / def.goal) * 100);
                var tc  = self._tierColor[def.tier] || "#ffd232";

                // Séparateur de tier
                if (def.tier !== currentTier) {
                    currentTier = def.tier;
                    html += "<div style='font-size:7px;letter-spacing:.14em;text-transform:uppercase;" +
                            "color:" + tc + ";opacity:.5;margin:" + (html ? "6px" : "0") +
                            " 0 3px'>— " + self._tierLabel[def.tier] + " —</div>";
                }

                html += "<div style='margin-bottom:7px'>" +
                    "<div style='color:rgba(255,255,255,.72);margin-bottom:1px;font-size:9px'>" +
                        def.icon + " " + def.title +
                    "</div>" +
                    "<div style='color:rgba(255,255,255,.28);font-size:7.5px;margin-bottom:3px'>" +
                        def.desc +
                    "</div>" +
                    "<div style='background:rgba(255,255,255,.06);border-radius:1px;height:3px'>" +
                        "<div style='background:" + tc + ";width:" + pct + "%;height:3px;" +
                        "border-radius:1px;transition:width .4s'></div>" +
                    "</div>" +
                    "<div style='color:" + tc + ";opacity:.55;text-align:right;font-size:7.5px;margin-top:1px'>" +
                        m.progress + " / " + def.goal +
                    "</div>" +
                "</div>";
            });

            // Compteur total en bas
            var done = this._missions.filter(function(m) { return m.completed; }).length;
            html += "<div style='color:rgba(255,255,255,.18);font-size:7.5px;text-align:right;" +
                    "border-top:1px solid rgba(255,255,255,.05);padding-top:4px;margin-top:2px'>" +
                    "✓ " + done + "/" + this._missions.length + "</div>";
        }

        list.innerHTML = html;
    },

    _showNotif: function(title, subtitle, color) {
        var el = document.getElementById("missionNotif");
        if (!el) return;
        color = color || "#ffd232";
        el.innerHTML =
            "<div style='font-size:10px;letter-spacing:.2em;text-transform:uppercase;" +
            "color:" + color + ";margin-bottom:4px'>" + title + "</div>" +
            "<div style='font-size:9px;color:rgba(255,255,255,.45);letter-spacing:.08em'>" +
            subtitle + "</div>";
        el.style.opacity = "1";
        setTimeout(function() { el.style.opacity = "0"; }, 3800);
    }
};