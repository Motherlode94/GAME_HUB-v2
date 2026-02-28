window.onload = function() {
    var canvas = document.getElementById("gameCanvas");
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    window.addEventListener("resize", function() {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
        if (game) { game.width = canvas.width; game.height = canvas.height; }
    });

    var game = null;
    var loop = null;

    // ── Menu principal ───────────────────────────────────────────────────────
    // onStart reçoit : { difficulty: "easy"|"normal"|"hard", ally: true|false }
    RTS.MainMenu.show(canvas, startGame);

    // ── Démarrage / réinitialisation ─────────────────────────────────────────
    function startGame(options) {
        options = options || {};
        var difficulty = options.difficulty || "normal";
        var withAlly   = !!options.ally;

        if (loop) loop.stop();

        game = new RTS.Game(canvas);
        game.level     = 1;
        game.resources = { gold: 500, fuel: 200, ammo: 150 };
        game.resourceNodes = RTS.ResourceNode.generateMap();

        // Bâtiments de départ
        game.buildings.push(new RTS.Building(150, 220, "blue", "hq"));
        game.buildings.push(new RTS.Building(150, 310, "blue", "barracks"));
        game.buildings.push(new RTS.Building(150, 400, "blue", "mine"));
        game.buildings.push(new RTS.Building(150, 490, "blue", "mine"));

        // Squads de départ — noms alignés sur RTS.SquadDefs
        [
            ["riflemen", 280, 260],
            ["riflemen", 360, 260],
            ["riflemen", 280, 340],
            ["worker",   240, 310],
            ["engineer", 200, 380]
        ].forEach(function(s) {
            var sq = new RTS.Squad(s[1], s[2], "blue", s[0]);
            if (sq && sq.members && sq.members.length > 0) game.squads.push(sq);
        });

        // Ennemis vague 1
        for (var i = 0; i < 3; i++) {
            game.squads.push(new RTS.Squad(
                RTS.WORLD_W - 200 - Math.random() * 200,
                200 + Math.random() * (RTS.WORLD_H - 400),
                "red", "riflemen"
            ));
        }
        game.squads.push(new RTS.Squad(RTS.WORLD_W - 180, RTS.WORLD_H / 2, "red", "m1a2"));

        // ── Difficulté ───────────────────────────────────────────────────────
        RTS.WaveSystem.difficulty = difficulty;
        RTS.WaveSystem.reset();

        // ── Allié IA ─────────────────────────────────────────────────────────
        // Guard : AllySystem.js doit être chargé dans le HTML avant main.js
        if (RTS.AllySystem) {
            if (withAlly) RTS.AllySystem.init(game);
            else          RTS.AllySystem.disable();
        } else if (withAlly) {
            console.warn("[main] AllySystem introuvable — ajoutez <script src='AllySystem.js'> dans le HTML.");
        }

        // ── Inputs ───────────────────────────────────────────────────────────
        new RTS.InputManager(game);

        // Boutons construction
        ["hq","barracks","workshop","hangar","mine","refinery","arsenal","tower","hospital","wall"]
        .forEach(function(type) {
            var btn = document.getElementById("btn_build_" + type);
            if (!btn) return;
            var clone = btn.cloneNode(true);
            btn.parentNode.replaceChild(clone, btn);
            clone.addEventListener("click", function() { RTS.BuildingSystem.startPlacing(type); });
        });

        // Boutons production
        var prodBtns  = document.getElementById("prodBtns");
        var prodClone = prodBtns.cloneNode(false);
        prodBtns.parentNode.replaceChild(prodClone, prodBtns);
        prodClone.id = "prodBtns";
        prodClone.addEventListener("click", function(e) {
            var btn = e.target.closest ? e.target.closest("[data-unit]") : e.target;
            if (!btn || !btn.dataset || !btn.dataset.unit) return;
            var b = game.selectedBuildings[0];
            if (!b) return;
            if (!RTS.ProductionSystem.enqueue(game, b, btn.dataset.unit)) {
                RTS.BuildingSystem._showError("Ressources insuffisantes ou file pleine !");
            }
        });

        // ── Cheat menu ───────────────────────────────────────────────────────
        if (RTS.CheatMenu) RTS.CheatMenu.init(game);

        // ── Boucle principale ─────────────────────────────────────────────────
        loop = new RTS.GameLoop(
            function update(delta) {
                if (game.gameOver) return;
                try {
                    game.camera.update(delta);
                    RTS.ResourceSystem.update(game, delta);
                    RTS.WorkerSystem.update(game, delta);
                    if (RTS.AllySystem)  RTS.AllySystem.update(game, delta);
                    RTS.SquadAISystem.update(game, delta);
                    RTS.SquadSystem.update(game.squads, delta);
                    RTS.SquadCombatSystem.update(game, delta);
                    RTS.ProjectileSystem.update(game, delta);
                    RTS.ParticleSystem.update(game.particles, delta);
                    RTS.ProductionSystem.update(game, delta);
                    RTS.WaveSystem.update(game, delta);
                    if (RTS.CheatMenu)  RTS.CheatMenu.tickGodMode(game);
                } catch (err) {
                    console.error("[update]", err.message, err.stack);
                }
            },
            function render() {
                try {
                    RTS.Renderer.render(game);
                    RTS.MinimapRenderer.render(game);
                } catch (err) {
                    console.error("[render]", err.message, err.stack);
                }
            }
        );

        loop.start();
    }
};