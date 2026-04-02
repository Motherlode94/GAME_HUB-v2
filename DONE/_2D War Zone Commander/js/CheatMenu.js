window.RTS = window.RTS || {};

/**
 * CheatMenu — panneau de triche pour tests.
 *
 * Raccourci : F10 pour ouvrir / fermer.
 *
 * Fonctions disponibles :
 *   +Or / +Fuel / +Ammo     — ajoute des ressources
 *   Vague suivante           — force le passage à la vague suivante
 *   Tuer tous les rouges     — élimine tous les squads ennemis
 *   Spawner unité (blue)     — fait apparaître un squad allié au centre
 *   God mode (allié)         — HP infinis pour les squads bleus
 *   Révéler vague courante   — affiche la composition de la vague
 */
RTS.CheatMenu = {

    _open:     false,
    _game:     null,
    _godMode:  false,
    _panel:    null,

    // ── Initialisation ────────────────────────────────────────────────────────

    init: function(game) {
        this._game    = game;
        this._godMode = false;
        this._buildUI();
        this._bindKey();
        console.info("[CheatMenu] F10 pour ouvrir/fermer le menu de triche.");
    },

    // ── Raccourci clavier ────────────────────────────────────────────────────

    _bindKey: function() {
        document.addEventListener("keydown", function(e) {
            if (e.key === "F10") { e.preventDefault(); RTS.CheatMenu.toggle(); }
        });
    },

    toggle: function() {
        this._open = !this._open;
        if (this._panel) {
            this._panel.style.display = this._open ? "block" : "none";
        }
    },

    // ── Construction du panneau HTML ─────────────────────────────────────────

    _buildUI: function() {
        var panel = document.createElement("div");
        panel.id  = "cheatPanel";
        panel.style.cssText = [
            "position:fixed", "top:80px", "right:18px",
            "width:220px", "background:rgba(10,10,20,0.96)",
            "border:1.5px solid #ffd232", "border-radius:6px",
            "padding:14px 16px", "z-index:9999",
            "font-family:'Courier New',monospace",
            "font-size:11px", "color:#e0e0e0",
            "display:none", "box-shadow:0 0 24px rgba(255,210,50,0.18)"
        ].join(";");

        panel.innerHTML = [
            "<div style='color:#ffd232;font-size:13px;font-weight:bold;letter-spacing:.12em;",
                "margin-bottom:10px;border-bottom:1px solid #333;padding-bottom:6px'>",
                "⚙ CHEAT MENU <span style='font-size:9px;color:#888'>[F10]</span></div>",

            "<div style='margin-bottom:6px;color:#888;font-size:10px'>RESSOURCES</div>",
            RTS.CheatMenu._btn("+ 2000 Or",    "cheat_gold"),
            RTS.CheatMenu._btn("+ 1000 Fuel",  "cheat_fuel"),
            RTS.CheatMenu._btn("+ 1000 Ammo",  "cheat_ammo"),
            RTS.CheatMenu._btn("Tout maxer",   "cheat_maxres"),

            "<div style='margin:10px 0 6px;color:#888;font-size:10px'>VAGUES</div>",
            RTS.CheatMenu._btn("Vague suivante",       "cheat_nextwv"),
            RTS.CheatMenu._btn("Tuer tous les rouges", "cheat_killred"),

            "<div style='margin:10px 0 6px;color:#888;font-size:10px'>UNITÉS</div>",
            RTS.CheatMenu._btn("Spawn Riflemen",  "cheat_sp_rf"),
            RTS.CheatMenu._btn("Spawn M1A2",      "cheat_sp_tank"),
            RTS.CheatMenu._btn("Spawn Apache",    "cheat_sp_heli"),

            "<div style='margin:10px 0 6px;color:#888;font-size:10px'>MODES</div>",
            "<button id='cheat_godmode' style='" + RTS.CheatMenu._btnStyle("#8e44ad") + "'>",
                "☐ God Mode (Bleu)</button>",
            "<button id='cheat_godally' style='" + RTS.CheatMenu._btnStyle("#27ae60") + "'>",
                "☐ God Mode (Allié)</button>"
        ].join("");

        document.body.appendChild(panel);
        this._panel = panel;

        this._bindButtons();
    },

    _btn: function(label, id) {
        return "<button id='" + id + "' style='" + RTS.CheatMenu._btnStyle() + "'>" + label + "</button>";
    },

    _btnStyle: function(color) {
        return [
            "display:block", "width:100%", "margin:3px 0",
            "padding:5px 8px",
            "background:" + (color || "rgba(40,40,60,0.9)"),
            "color:#e0e0e0", "border:1px solid #444",
            "border-radius:3px", "cursor:pointer",
            "font-family:'Courier New',monospace",
            "font-size:10px", "text-align:left",
            "transition:background .15s"
        ].join(";");
    },

    // ── Liaison des boutons ───────────────────────────────────────────────────

    _bindButtons: function() {
        var self = this;
        var bind = function(id, fn) {
            var el = document.getElementById(id);
            if (el) el.addEventListener("click", fn);
        };

        bind("cheat_gold",    function() { self._game.resources.gold  += 2000; self._flash("+ 2000 Or"); });
        bind("cheat_fuel",    function() { self._game.resources.fuel  += 1000; self._flash("+ 1000 Fuel"); });
        bind("cheat_ammo",    function() { self._game.resources.ammo  += 1000; self._flash("+ 1000 Ammo"); });
        bind("cheat_maxres",  function() {
            self._game.resources.gold = self._game.resources.fuel = self._game.resources.ammo = 9999;
            self._flash("Ressources maxées");
        });

        bind("cheat_nextwv",  function() {
            RTS.WaveSystem.forceNextWave(self._game);
            self._flash("Vague suivante forcée");
        });
        bind("cheat_killred", function() {
            var n = 0;
            self._game.squads.forEach(function(s) {
                if (s.team !== "red") return;
                s.members.forEach(function(m) { m.dead = true; m.hp = 0; });
                n++;
            });
            self._flash("Éliminés : " + n + " squads rouges");
        });

        bind("cheat_sp_rf",   function() { self._spawnUnit("riflemen");  });
        bind("cheat_sp_tank", function() { self._spawnUnit("m1a2");      });
        bind("cheat_sp_heli", function() { self._spawnUnit("apache");    });

        bind("cheat_godmode", function() {
            self._godMode = !self._godMode;
            document.getElementById("cheat_godmode").textContent =
                (self._godMode ? "☑" : "☐") + " God Mode (Bleu)";
            self._flash("God Mode Bleu : " + (self._godMode ? "ON" : "OFF"));
        });

        bind("cheat_godally", function() {
            self._godAlly = !self._godAlly;
            document.getElementById("cheat_godally").textContent =
                (self._godAlly ? "☑" : "☐") + " God Mode (Allié)";
            self._flash("God Mode Allié : " + (self._godAlly ? "ON" : "OFF"));
        });
    },

    // ── Spawn d'unité au centre de la vue ────────────────────────────────────

    _spawnUnit: function(typeName) {
        var cam = this._game.camera;
        var cx  = cam.x + cam.viewWidth  / cam.zoom / 2;
        var cy  = cam.y + cam.viewHeight / cam.zoom / 2;
        var sq  = new RTS.Squad(cx + (Math.random()-0.5)*80, cy + (Math.random()-0.5)*80, "blue", typeName);
        if (sq.members && sq.members.length > 0) {
            this._game.squads.push(sq);
            this._flash("Spawn : " + sq.def.label);
        }
    },

    // ── Tick god mode (appelé depuis main update) ─────────────────────────────

    tickGodMode: function(game) {
        if (!this._godMode && !this._godAlly) return;
        game.squads.forEach(function(s) {
            var god = (s.team === "blue"  && RTS.CheatMenu._godMode) ||
                      (s.team === "ally"  && RTS.CheatMenu._godAlly);
            if (!god) return;
            s.members.forEach(function(m) {
                if (!m.dead) { m.hp = m.maxHp; }
            });
        });
    },

    // ── Message flash ─────────────────────────────────────────────────────────

    _flash: function(msg) {
        var el = document.getElementById("cheatFlash");
        if (!el) {
            el    = document.createElement("div");
            el.id = "cheatFlash";
            el.style.cssText = [
                "position:fixed", "bottom:80px", "right:18px",
                "background:rgba(255,210,50,0.92)", "color:#000",
                "font-family:'Courier New',monospace", "font-size:11px",
                "padding:5px 12px", "border-radius:4px",
                "opacity:0", "transition:opacity .2s", "pointer-events:none",
                "z-index:10000"
            ].join(";");
            document.body.appendChild(el);
        }
        el.textContent   = "⚙ " + msg;
        el.style.opacity = "1";
        clearTimeout(this._flashTimer);
        this._flashTimer = setTimeout(function() { el.style.opacity = "0"; }, 2000);
    }
};