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
    RTS.MainMenu.show(canvas, startGame);

    // ════════════════════════════════════════════════════════════════════════
    //  DÉMARRAGE / RÉINITIALISATION
    // ════════════════════════════════════════════════════════════════════════
    function startGame(options) {
        options    = options || {};
        var difficulty = options.difficulty || "normal";
        var withAlly   = !!options.ally;
        var mode = options.mode === "survival" ? "survival" : "conquest";

        if (loop) loop.stop();
        _removeSetupOverlay();

        // ── Initialisation du jeu ─────────────────────────────────────────
        game = new RTS.Game(canvas);
        game.level     = 1;
        game.mode = mode;
        if (mode === "conquest" && RTS.ConquestSystem) RTS.ConquestSystem.init(game);
        if (mode === "conquest" && RTS.DeploymentSystem) RTS.DeploymentSystem.init(game);
        if (mode === "conquest" && RTS.ArmyBuilder) RTS.ArmyBuilder.init(game);
        game.setupPhase = true;   // ← bloque les vagues

        // Ressources généreuses : le joueur construit tout from scratch
        game.resources = { gold: 1400, fuel: 400, ammo: 300 };
        game.resourceNodes = RTS.ResourceNode.generateMap();

        // Pas de bâtiments de départ — le joueur choisit tout
        // Pas de squads non plus — ils apparaîtront près du QG posé

        // Ennemis : placés côté droit, en attente (ils n'attaquent pas tant
        // que setupPhase = true, car WaveSystem est bloqué)
        for (var i = 0; i < 3; i++) {
            game.squads.push(new RTS.Squad(
                RTS.WORLD_W - 200 - Math.random() * 200,
                200 + Math.random() * (RTS.WORLD_H - 400),
                "red", "riflemen"
            ));
        }
        game.squads.push(new RTS.Squad(
            RTS.WORLD_W - 180, RTS.WORLD_H / 2, "red", "m1a2"
        ));

        // ── Difficulté & allié ────────────────────────────────────────────
        RTS.WaveSystem.difficulty = difficulty;
        RTS.WaveSystem.reset();

        if (RTS.AllySystem) {
            if (withAlly) RTS.AllySystem.init(game);
            else          RTS.AllySystem.disable();
        }

        // ── Inputs ───────────────────────────────────────────────────────
        new RTS.InputManager(game);

        // ── Boutons construction ─────────────────────────────────────────
        ["hq","barracks","workshop","hangar","mine","refinery","arsenal","tower","hospital","wall"]
        .forEach(function(type) {
            var btn = document.getElementById("btn_build_" + type);
            if (!btn) return;
            var clone = btn.cloneNode(true);
            btn.parentNode.replaceChild(clone, btn);
            clone.addEventListener("click", function() {
                RTS.BuildingSystem.startPlacing(type);
                _updateSetupHint(type);
            });
        });

        // ── Boutons production ────────────────────────────────────────────
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
            if (RTS.MissionSystem) RTS.MissionSystem.onProduce(game, btn.dataset.unit);
        });

        // ── Cheat menu ────────────────────────────────────────────────────
        if (RTS.CheatMenu) RTS.CheatMenu.init(game);

        // ── Missions & Events ─────────────────────────────────────────────
        if (RTS.MissionSystem) RTS.MissionSystem.init(game);
        if (RTS.EventSystem)   RTS.EventSystem.init(game);

        // Hooks installed once: restart must not wrap the same functions again.
        // Each callback uses the game passed to the system, never a stale closure.
        game._onFirstBuilding = _onFirstBuilding;
        if (!RTS._missionHooksInstalled) {
            RTS._missionHooksInstalled = true;
            var basePlace = RTS.BuildingSystem.place;
            RTS.BuildingSystem.place = function(g, x, y) {
                var type = this._placingType;
                var ok = basePlace.call(this, g, x, y);
                if (ok) {
                    if (RTS.MissionSystem) RTS.MissionSystem.onBuild(g, type);
                    if (g.setupPhase && typeof g._onFirstBuilding === "function")
                        g._onFirstBuilding(x, y, type);
                }
                return ok;
            };

            if (RTS.WorkerSystem && RTS.WorkerSystem._tickHarvest) {
                var baseHarvest = RTS.WorkerSystem._tickHarvest;
                RTS.WorkerSystem._tickHarvest = function(g, sq, node, delta) {
                    var before = g.resources.gold + g.resources.fuel + g.resources.ammo;
                    var result = baseHarvest.call(this, g, sq, node, delta);
                    var gained = g.resources.gold + g.resources.fuel + g.resources.ammo - before;
                    if (gained > 0 && RTS.MissionSystem) RTS.MissionSystem.onHarvest(g, gained);
                    return result;
                };
            }

            if (RTS.SquadCombatSystem) {
                var baseCombat = RTS.SquadCombatSystem.update;
                RTS.SquadCombatSystem.update = function(g, delta) {
                    var before = g.squads.filter(function(s) {
                        return s.team === "red" && s.isDead && s.isDead();
                    }).length;
                    var result = baseCombat.call(this, g, delta);
                    var after = g.squads.filter(function(s) {
                        return s.team === "red" && s.isDead && s.isDead();
                    }).length;
                    for (var k = 0; k < Math.max(0, after - before); k++)
                        if (RTS.MissionSystem) RTS.MissionSystem.onKill(g);
                    return result;
                };
            }
        }

                // ── Caméra : commence au centre-gauche du monde ───────────────────
        if (game.camera) {
            game.camera.zoom = Math.max(game.camera.minZoom, Math.min(0.85, canvas.width / 1500, canvas.height / 1150));
            game.camera.x = RTS.WORLD_W / 2 - canvas.width / (2 * game.camera.zoom);
            game.camera.y = RTS.WORLD_H / 2 - canvas.height / (2 * game.camera.zoom);
            game.camera._clamp();
        }

        // ── Overlay de déploiement ────────────────────────────────────────
        if (game.mode === "conquest") _showRequisitionPanel(); else _showSetupOverlay();

        // ── Démarrer automatiquement la pose du QG ────────────────────────
        if (game.mode === "survival") setTimeout(function() {
            RTS.BuildingSystem.startPlacing("hq");
        }, 400);

        // ── Boucle principale ─────────────────────────────────────────────
        loop = new RTS.GameLoop(
            function update(delta) {
                if (game.gameOver) return;
                try {
                    game.camera.update(delta);
                    if (game.mode === "conquest" && RTS.DeploymentSystem) {
                        RTS.DeploymentSystem.update(game, delta);
                        if (game.requisitionPanelRefresh) game.requisitionPanelRefresh();
                    } else RTS.ResourceSystem.update(game, delta);
                    RTS.WorkerSystem.update(game, delta);
                    if (RTS.TransportSystem) RTS.TransportSystem.update(game);
                    if (RTS.AllySystem) RTS.AllySystem.update(game, delta);
                    RTS.SquadAISystem.update(game, delta);
                    RTS.FogOfWar.update(game);
                    if (RTS.AirMissionSystem) RTS.AirMissionSystem.update(game);
                    RTS.SquadSystem.update(game.squads, delta, game.buildings);
                    RTS.LogisticsSystem.update(game, delta);
                    RTS.SquadCombatSystem.update(game, delta);
                    RTS.ProjectileSystem.update(game, delta);
                    RTS.ParticleSystem.update(game.particles, delta);
                    RTS.ProductionSystem.update(game, delta);

                    // Vagues seulement hors phase de déploiement
                    if (!game.setupPhase) {
                        if (game.mode === "conquest" && RTS.ConquestSystem) RTS.ConquestSystem.update(game, delta);
                        else RTS.WaveSystem.update(game, delta);
                        if (RTS.DefenseTower && !RTS.EventSystem.isTowerJammed())
                            RTS.DefenseTower.update(game, delta);
                        if (RTS.EventSystem)   RTS.EventSystem.update(game, delta);
                        if (RTS.MissionSystem) RTS.MissionSystem.update(game);
                    }

                    if (RTS.CheatMenu) RTS.CheatMenu.tickGodMode(game);
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

    // ════════════════════════════════════════════════════════════════════════
    //  PHASE DE DÉPLOIEMENT — helpers
    // ════════════════════════════════════════════════════════════════════════

    // Appelé après le premier bâtiment posé
    function _onFirstBuilding(hqX, hqY, type) {
        // Marquer la fin de la phase seulement si c'est le QG
        // (ou laisser le bouton "Commencer" décider — voir overlay)
        _updateSetupOverlayAfterPlace(type, hqX, hqY);
    }

    // Lance réellement les vagues (appelé par le bouton "Commencer l'assaut")
    function _startAssault() {
        if (game.setupPhase === false) return;

        // Vérifier qu'il y a au moins un QG
        var hasHQ = game.buildings.some(function(b) {
            return b.team === "blue" && b.type === "hq";
        });
        if (!hasHQ) {
            _shakeOverlay();
            return;
        }

        game.setupPhase = false;
        _removeSetupOverlay();

        // Spawner squads près du premier QG bleu
        var hq = game.buildings.find(function(b) { return b.team === "blue" && b.type === "hq"; });
        if (!hq) hq = game.buildings.find(function(b) { return b.team === "blue"; });
        var sx = hq ? hq.x : 400;
        var sy = hq ? hq.y : 600;

        [
            ["riflemen", sx + 80,  sy - 60],
            ["riflemen", sx + 160, sy - 60],
            ["riflemen", sx + 80,  sy + 60],
            ["worker",   sx + 40,  sy + 20],
            ["engineer", sx + 120, sy + 20]
        ].forEach(function(s) {
            var sq = new RTS.Squad(s[1], s[2], "blue", s[0]);
            if (sq && sq.members && sq.members.length > 0) game.squads.push(sq);
        });

        // Missions signal mines existantes
        if (RTS.MissionSystem) {
            game.buildings.forEach(function(b) {
                if (b.team === "blue") RTS.MissionSystem.onBuild(game, b.type);
            });
        }

        // Notif démarrage
        var waveEl = document.getElementById("waveNotif");
        if (waveEl) {
            waveEl.textContent = "L'ENNEMI ARRIVE !";
            waveEl.style.opacity = "1";
            setTimeout(function() { waveEl.style.opacity = "0"; }, 3000);
        }

        // Réinitialiser WaveSystem pour repartir proprement
        RTS.WaveSystem.reset();
    }

    // ── Overlay de déploiement ────────────────────────────────────────────────
    function _showRequisitionPanel() {
        var previous=document.getElementById("requisitionPanel");if(previous)previous.remove();
        var panel=document.createElement("div");panel.id="requisitionPanel";
        panel.style.cssText="position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:100;width:min(460px,92vw);max-height:75vh;overflow:auto;padding:14px;border-radius:8px;border:1px solid #5797ba;background:rgba(7,18,28,.97);color:#eef6ff;font:12px Arial";
        var heading=document.createElement("strong");heading.textContent="GROUPE DE COMBAT · RENFORTS";panel.append(heading);
        var summary=document.createElement("p");summary.style.color="#9eddf4";panel.append(summary);
        var doctrine=document.createElement("select");doctrine.title="Spécialisation du groupe de combat";
        doctrine.style.cssText="display:block;width:100%;padding:8px;margin:8px 0;color:white;background:#203349;border:1px solid #567d9c";
        Object.keys(RTS.ArmyBuilder.doctrines).forEach(function(k){
            var option=document.createElement("option");option.value=k;option.textContent=RTS.ArmyBuilder.doctrines[k].label;doctrine.append(option);
        });
        doctrine.value=game.army.doctrine;
        doctrine.onchange=function(){RTS.ArmyBuilder.setDoctrine(game,doctrine.value);refresh();};panel.append(doctrine);
        var gear=document.createElement("select");gear.title="Équipement de l'unité sélectionnée";
        gear.style.cssText=doctrine.style.cssText;
        function showGear(type){
            focused=type;gear.replaceChildren();
            var options=RTS.ArmyBuilder.options(type);
            Object.keys(options).forEach(function(k){
                var e=options[k],o=document.createElement("option");
                o.value=k;o.textContent=e.label+" (+"+e.extra+" pts)";gear.append(o);
            });
            gear.value=game.army.loadouts[type]||"standard";
        }
        var focused="riflemen";
        gear.onchange=function(){game.army.loadouts[focused]=gear.value;RTS.ArmyBuilder.save(game);refresh();};
        var explain=document.createElement("div");explain.style.cssText="font-size:11px;color:#c2d5e2;margin:4px 0 8px";panel.append(explain);panel.append(gear);
        var grid=document.createElement("div");grid.style.cssText="display:grid;grid-template-columns:1fr 1fr;gap:6px";panel.append(grid);
        RTS.DeploymentSystem.units.forEach(function(item) {
            var def=RTS.SquadDefs[item[0]];if(!def)return;
            var btn=document.createElement("button");btn.type="button";btn.dataset.cost=item[1];btn.dataset.type=item[0];
            btn.textContent=(def.label||item[0])+" · "+item[1]+" pts";
            btn.style.cssText="padding:9px 6px;background:#25394c;color:#fff;border:1px solid #446c89;border-radius:5px;text-align:left;cursor:pointer";
            btn.onclick=function(){
                if(game.setupPhase){
                    if(focused!==item[0]){focused=item[0];showGear(focused);}
                    else RTS.ArmyBuilder.toggle(game,focused);
                    RTS.ArmyBuilder.save(game);refresh();
                }else{RTS.DeploymentSystem.call(game,item[0]);refresh();}
            };grid.append(btn);
        });
        var start=document.createElement("button");start.type="button";start.textContent="▶ LANCER L'OPÉRATION";
        start.style.cssText="width:100%;padding:12px;margin-top:10px;background:#287456;border:1px solid #58b892;color:white;font-weight:bold;cursor:pointer";
        start.onclick=function(){
            if(!game.army.deck.length)return;
            RTS.ArmyBuilder.save(game);
            doctrine.disabled=true;gear.disabled=true;
            if(!game.requisition.queue.length) RTS.DeploymentSystem.call(game,RTS.ArmyBuilder.doctrines[game.army.doctrine].types[0]);
            game.setupPhase=false;panel.style.left="12px";panel.style.top="auto";panel.style.bottom="12px";panel.style.transform="none";panel.style.width="min(340px,90vw)";panel.style.maxHeight="42vh";start.remove();refresh();
        };panel.append(start);
        document.body.append(panel);
        function refresh(){
            if(!panel.isConnected || !game.requisition)return;
            var d=game.requisition;
            summary.textContent="Réserve "+Math.floor(d.points)+"/1500 pts · Revenu +"+d.income+"/min · File "+d.queue.length+" · Deck "+game.army.deck.length+"/"+game.army.slots;
            explain.textContent="Personnalisation : "+(RTS.SquadDefs[focused].label||focused)+". Avant le départ, cliquez une unité puis choisissez son équipement. Après le départ, cliquez pour appeler un renfort.";
            grid.querySelectorAll("button").forEach(function(b){
                var type=b.dataset.type;
                var allowed=RTS.ArmyBuilder.allowed(game,type);
                var cost=RTS.ArmyBuilder.price(game,type);
                b.textContent=(RTS.SquadDefs[type].label||type)+" · "+cost+" pts";
                b.disabled=game.setupPhase?(!RTS.ArmyBuilder.doctrines[game.army.doctrine].types.includes(type)||(!allowed&&game.army.deck.length>=game.army.slots)):(!allowed||d.points<cost);
                b.style.opacity=b.disabled?".3":"1";
                b.style.borderColor=allowed?"#71c99c":focused===type?"#e6c273":"#446c89";
            });
        }
        var save=document.createElement("button");save.textContent="ENREGISTRER LE DECK";
        save.style.cssText="margin:9px 0;padding:9px;background:#264d60;color:#fff;border:1px solid #5c91a9;cursor:pointer;width:100%";
        save.onclick=function(){RTS.ArmyBuilder.save(game);save.textContent="DECK ENREGISTRÉ ✓";};
        panel.insertBefore(save,start);
        var deckName=document.createElement("input");deckName.placeholder="Nom du deck";deckName.value=game.army.name;
        deckName.style.cssText="width:95%;padding:8px;color:white;background:#1b3041;border:1px solid #52738a";
        panel.insertBefore(deckName,save);
        var presets=document.createElement("select");presets.style.cssText=doctrine.style.cssText;
        function populatePresets(){
            presets.replaceChildren();var empty=document.createElement("option");empty.value="";empty.textContent="Charger un deck enregistré…";presets.append(empty);
            RTS.ArmyBuilder.listDecks().forEach(function(n){var option=document.createElement("option");option.value=n;option.textContent=n;presets.append(option);});
        }
        populatePresets();panel.insertBefore(presets,save);
        presets.onchange=function(){
            if(presets.value && RTS.ArmyBuilder.loadNamed(game,presets.value)){
                doctrine.value=game.army.doctrine;deckName.value=game.army.name;showGear(focused);refresh();
            }
        };
        save.onclick=function(){
            if(RTS.ArmyBuilder.saveNamed(game,deckName.value)){
                save.textContent="DECK ENREGISTRÉ ✓";populatePresets();
            }else save.textContent="SAUVEGARDE IMPOSSIBLE";
        };
        showGear(focused);
        game.requisitionPanelRefresh=refresh;refresh();
    }

    var _setupEl = null;
    var _hqPlaced = false;

    function _showSetupOverlay() {
        _hqPlaced = false;
        _removeSetupOverlay();

        var el = document.createElement("div");
        el.id = "setupOverlay";
        el.style.cssText = [
            "position:fixed",
            "top:50%", "left:50%",
            "transform:translate(-50%,-50%)",
            "z-index:90",
            "background:rgba(6,8,16,.96)",
            "border:1px solid rgba(61,142,245,.22)",
            "border-radius:4px",
            "padding:28px 40px",
            "text-align:center",
            "font-family:'Courier New',monospace",
            "min-width:360px",
            "pointer-events:all",
            "backdrop-filter:blur(10px)",
            "box-shadow:0 0 60px rgba(61,142,245,.08)"
        ].join(";");

        el.innerHTML = [
            "<div style='font-size:9px;letter-spacing:.28em;text-transform:uppercase;",
                "color:rgba(61,142,245,.5);margin-bottom:8px'>Phase de déploiement</div>",

            "<div style='font-size:17px;letter-spacing:.14em;text-transform:uppercase;",
                "color:#fff;font-weight:bold;margin-bottom:6px'>Construisez votre base</div>",

            "<div style='font-size:10px;color:rgba(255,255,255,.3);letter-spacing:.06em;",
                "margin-bottom:20px;line-height:1.7'>",
                "Placez votre <span style='color:#ffd232'>QG</span> en premier.<br>",
                "Construisez ensuite librement — les vagues<br>",
                "n'arriveront qu'au signal.<br>",
                "<span id='setupHint' style='color:rgba(255,100,100,.7);font-size:9px'></span>",
            "</div>",

            "<div style='display:flex;gap:10px;justify-content:center;margin-bottom:14px'>",
                "<div style='font-size:9px;color:rgba(255,210,50,.6);letter-spacing:.1em'>",
                    "OR&nbsp;<span style='color:#fff;font-weight:bold' id='setupGold'>1400</span>",
                "</div>",
                "<div style='width:1px;background:rgba(255,255,255,.07)'></div>",
                "<div style='font-size:9px;color:rgba(39,174,96,.6);letter-spacing:.1em'>",
                    "CARB&nbsp;<span style='color:#fff;font-weight:bold' id='setupFuel'>400</span>",
                "</div>",
                "<div style='width:1px;background:rgba(255,255,255,.07)'></div>",
                "<div style='font-size:9px;color:rgba(231,76,60,.6);letter-spacing:.1em'>",
                    "MUN&nbsp;<span style='color:#fff;font-weight:bold' id='setupAmmo'>300</span>",
                "</div>",
            "</div>",

            "<button id='setupStartBtn' style='",
                "background:rgba(61,142,245,.08);",
                "border:1px solid rgba(61,142,245,.25);",
                "color:rgba(255,255,255,.3);",
                "font-family:Courier New,monospace;",
                "font-size:11px;letter-spacing:.18em;text-transform:uppercase;",
                "padding:11px 28px;cursor:pointer;border-radius:2px;",
                "width:100%;transition:all .2s;",
                "'>▶&nbsp; Commencer l'assaut</button>",

            "<div style='font-size:8px;color:rgba(255,255,255,.12);margin-top:10px;",
                "letter-spacing:.1em'>QG requis avant de commencer</div>"
        ].join("");

        document.body.appendChild(el);
        _setupEl = el;

        // Bouton démarrage
        el.querySelector("#setupStartBtn").addEventListener("click", function() {
            _startAssault();
        });

        // Rafraîchir les ressources affichées toutes les secondes
        var _resInterval = setInterval(function() {
            if (!game || !_setupEl) { clearInterval(_resInterval); return; }
            var g = el.querySelector("#setupGold");
            var f = el.querySelector("#setupFuel");
            var a = el.querySelector("#setupAmmo");
            if (g) g.textContent = Math.floor(game.resources.gold);
            if (f) f.textContent = Math.floor(game.resources.fuel);
            if (a) a.textContent = Math.floor(game.resources.ammo);
        }, 500);
    }

    function _updateSetupHint(type) {
        if (!_setupEl) return;
        var hint = _setupEl.querySelector("#setupHint");
        if (hint) hint.textContent = "";
    }

    function _updateSetupOverlayAfterPlace(type, x, y) {
        if (!_setupEl) return;
        if (type === "hq" && !_hqPlaced) {
            _hqPlaced = true;
            // Mettre à jour le bouton
            var btn = _setupEl.querySelector("#setupStartBtn");
            if (btn) {
                btn.style.background = "rgba(61,142,245,.18)";
                btn.style.borderColor = "rgba(61,142,245,.55)";
                btn.style.color = "#6db4ff";
                btn.style.boxShadow = "0 0 20px rgba(61,142,245,.15)";
            }
            var note = _setupEl.querySelector("div:last-child");
            if (note) note.textContent = "QG placé ✓ — Continuez à construire ou lancez l'assaut";

            // Titre
            var title = _setupEl.querySelectorAll("div")[1];
            if (title) title.style.color = "#2ecc71";
        }
    }

    function _removeSetupOverlay() {
        var old = document.getElementById("setupOverlay");
        if (old) old.remove();
        _setupEl = null;
    }

    function _shakeOverlay() {
        if (!_setupEl) return;
        var hint = _setupEl.querySelector("#setupHint");
        if (hint) {
            hint.textContent = "⚠ Placez d'abord votre QG !";
            hint.style.color = "rgba(255,80,80,.9)";
        }
        var origTransform = _setupEl.style.transform;
        var shakes = ["-4px,0", "4px,0", "-3px,0", "3px,0", "0,0"];
        var i = 0;
        var iv = setInterval(function() {
            if (!_setupEl) { clearInterval(iv); return; }
            _setupEl.style.transform = "translate(calc(-50% + " + shakes[i] + "),calc(-50%))";
            i++;
            if (i >= shakes.length) { clearInterval(iv); _setupEl.style.transform = origTransform; }
        }, 60);
    }

};