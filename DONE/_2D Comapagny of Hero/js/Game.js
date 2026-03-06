/**
 * Game.js — Point d'entrée principal (version complète).
 *
 * Systèmes intégrés :
 *  - ResourceManager (Manpower / Munitions / Carburant)
 *  - 10 types d'unités (infanterie, véhicules, blindés, hélicos, aviation)
 *  - Construction de bâtiments par pioneers
 *  - IA stratégique en 3 phases avec manœuvres de flanc
 *  - Production avec coûts réels bloquants
 *  - HUD ressources permanent + bar de production
 *
 * Contrôles :
 *  Clic gauche     : sélection / bâtiment
 *  Clic droit      : déplacer sélection (formation) / rally point
 *  Molette         : zoom
 *  WASD/Flèches    : défilement caméra
 *  G               : afficher/masquer grille nav
 *  F1              : afficher/masquer secteurs
 *  R (hors sélection) : révéler brouillard (debug)
 *  H               : centrer sur base alliée
 *  Ctrl+A          : tout sélectionner
 *  Échap           : déselect + retour QG
 *  Q/W/E (prod)    : raccourcis production
 *  Z/X/C/V/B (QG)  : raccourcis construction (si pioneers sélectionnés)
 */
window.onload = function() {

    // -----------------------------------------------------------------------
    //  CANVAS
    // -----------------------------------------------------------------------
    var canvas = document.getElementById('gameCanvas');
    var ctx    = canvas.getContext('2d');
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.background = '#0a0a0a';
    canvas.style.cursor     = 'crosshair';

    // -----------------------------------------------------------------------
    //  INPUTS
    // -----------------------------------------------------------------------
    var mouseX = canvas.width  / 2;
    var mouseY = canvas.height / 2;
    var keys   = {};

    var isDragging   = false;
    var dragStartX   = 0, dragStartY = 0;
    var dragCurrentX = 0, dragCurrentY = 0;
    var DRAG_THRESH  = 6;

    // -----------------------------------------------------------------------
    //  SYSTÈMES
    // -----------------------------------------------------------------------
    var camera, navGrid;
    var squads    = [];
    var buildings = [];
    var aiCtrl    = null;
    var prodUI    = null;
    var resources = null;   // ResourceManager allied
    var aiRes     = null;   // ResourceManager axis (non affiché)
    var lastTime  = performance.now();

    // Systèmes victoire & objectifs
    var victorySystem   = null;
    var objectivesPanel = null;
    var gameOver        = false;
    var _prevCPOwners   = {};   // pour détecter les captures

    // Mode de placement de bâtiment
    var buildMode     = false;
    var buildTemplate = null;   // { buildingType, cost, pioneer }
    var buildGhostX   = 0, buildGhostY = 0;

    // -----------------------------------------------------------------------
    //  CHARGEMENT — exposé au menu via _startGame
    // -----------------------------------------------------------------------
    var mapRenderer = null;
    window._startGame = function(mapId) {
        mapId = mapId || 1;
        squads    = [];
        buildings = [];
        mapRenderer = new RTS.Game.Map.MapRenderer(
            'assets/map0' + mapId + '.png',
            function(mapWidth, mapHeight) { start(mapWidth, mapHeight, mapId); }
        );
    };

    // -----------------------------------------------------------------------
    //  INIT
    // -----------------------------------------------------------------------
    function start(mapWidth, mapHeight, mapId) {
        camera  = new RTS.Engine.Camera(canvas.width, canvas.height, mapWidth, mapHeight);
        navGrid = new RTS.Game.Map.NavGrid(mapWidth, mapHeight, 48, mapId || 1);

        var cp = navGrid.capturePoints;

        // Trouver les QG par owner (robuste quelque soit l'ordre des CPs)
        var alliedHQcp = cp.filter(function(c){ return c.isHQ && c.owner==='allied'; })[0];
        var axisHQcp   = cp.filter(function(c){ return c.isHQ && c.owner==='axis';   })[0];

        // --- Ressources ---
        resources = new RTS.Game.ResourceManager('allied');
        aiRes     = new RTS.Game.ResourceManager('axis');
        resources.syncWithNavGrid(navGrid);
        aiRes.syncWithNavGrid(navGrid);

        // --- Bâtiments QG ---
        var alliedHQ = new RTS.Game.Building(alliedHQcp.x, alliedHQcp.y, 'allied', 'hq');
        alliedHQ.rallyX = alliedHQcp.x + 80; alliedHQ.rallyY = alliedHQcp.y - 50;
        buildings.push(alliedHQ);

        var axisHQ = new RTS.Game.Building(axisHQcp.x, axisHQcp.y, 'axis', 'hq');
        axisHQ.rallyX = axisHQcp.x - 80; axisHQ.rallyY = axisHQcp.y + 50;
        buildings.push(axisHQ);

        // --- Avant-postes axis (petites bases à détruire) ---
        cp.filter(function(c){ return c.isOutpost; }).forEach(function(ocp) {
            var ob = new RTS.Game.Building(ocp.x, ocp.y, 'axis', 'support');
            ob.rallyX = ocp.x; ob.rallyY = ocp.y + 70;
            ob.isBuilt = true; ob.buildProgress = 1.0;
            buildings.push(ob);
            // Garnison initiale autour de l'avant-poste
            squads.push(new RTS.Game.Squad(ocp.x + 40,  ocp.y + 30,  'axis', 'mg'));
            squads.push(new RTS.Game.Squad(ocp.x - 40,  ocp.y - 20,  'axis', 'panzergrenadier'));
        });

        // --- Escouades alliées initiales ---
        var hqX = alliedHQcp.x, hqY = alliedHQcp.y;
        squads.push(new RTS.Game.Squad(hqX+100, hqY-40,  'allied', 'rifle'));
        squads.push(new RTS.Game.Squad(hqX+140, hqY+20,  'allied', 'rifle'));
        squads.push(new RTS.Game.Squad(hqX+60,  hqY+60,  'allied', 'mg'));
        squads.push(new RTS.Game.Squad(hqX+80,  hqY+100, 'allied', 'pioneer'));

        // --- Bâtiments alliés pré-construits (accès immédiat aux nouvelles unités) ---
        var barracks = new RTS.Game.Building(hqX + 180, hqY - 80, 'allied', 'barracks');
        barracks.rallyX = hqX + 250; barracks.rallyY = hqY - 20;
        barracks.isBuilt = true; barracks.buildProgress = 1.0;
        buildings.push(barracks);

        var support = new RTS.Game.Building(hqX + 180, hqY + 60, 'allied', 'support');
        support.rallyX = hqX + 250; support.rallyY = hqY + 120;
        support.isBuilt = true; support.buildProgress = 1.0;
        buildings.push(support);

        var motorPool = new RTS.Game.Building(hqX - 120, hqY + 80, 'allied', 'motor_pool');
        motorPool.rallyX = hqX - 60; motorPool.rallyY = hqY + 150;
        motorPool.isBuilt = true; motorPool.buildProgress = 1.0;
        buildings.push(motorPool);

        // --- IA Axis ---
        aiCtrl = new RTS.Game.AIController(navGrid, buildings, squads, aiRes);
        var axX = axisHQcp.x, axY = axisHQcp.y;
        squads.push(new RTS.Game.Squad(axX-100, axY+40, 'axis', 'rifle'));
        squads.push(new RTS.Game.Squad(axX-60,  axY+80, 'axis', 'rifle'));

        // --- UI : sélectionner la caserne par défaut ---
        prodUI = new RTS.Game.ProductionUI(canvas, function() {
            return resources.get();
        });
        prodUI.selectBuilding(barracks); // caserne visible immédiatement

        camera.snapTo(hqX, hqY);

        // --- Systèmes victoire & objectifs ---
        objectivesPanel = new RTS.Game.ObjectivesPanel(canvas);
        // BUG 8 FIX — pass live references (squads/buildings arrays),
        // not snapshots, so VictorySystem always evaluates current state
        victorySystem = new RTS.Game.VictorySystem(
            navGrid, squads, buildings,
            function(winner, condition, finalStats) { gameOver = true; },
            function(objectives) { if (objectivesPanel) objectivesPanel.setObjectives(objectives); }
        );
        gameOver = false;
        objectivesPanel.setObjectives(victorySystem.getObjectives());
        navGrid.capturePoints.forEach(function(cp) { _prevCPOwners[cp.id] = cp.owner; });

        if (window._onMapLoaded) window._onMapLoaded();
        requestAnimationFrame(gameLoop);
    }

    // -----------------------------------------------------------------------
    //  BOUCLE
    // -----------------------------------------------------------------------
    function gameLoop(now) {
        var dt = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;

        camera.update(mouseX, mouseY, keys);

        // Ressources
        if (resources) resources.update(dt);
        if (aiRes)     aiRes.update(dt);

        // Bâtiments
        buildings.forEach(function(b) {
            var done = b.update(dt);
            if (done) {
                var team = b.team;
                if (team === 'allied') {
                    var sq = new RTS.Game.Squad(b.rallyX, b.rallyY, 'allied', done);
                    squads.push(sq);
                }
                // Axis : spawn gratuit (IA gère via AIController._spawnUnit)
            }
        });

        // Unités
        squads.forEach(function(sq) { sq.update(dt, squads); });

        // Nettoyage morts
        for (var i = squads.length-1; i >= 0; i--) {
            var sq = squads[i];
            if (sq.dead && sq._aliveSoldiers().length===0 &&
                !sq._muzzleFlashes.length && !sq._tracers.length && !sq._hitSparks.length)
                squads.splice(i, 1);
        }

        if (navGrid) {
            // Vision
            navGrid.ageFog();
            squads.forEach(function(sq) { navGrid.revealFog(sq.x, sq.y, sq.visionRadius); });
            buildings.forEach(function(b) {
                if (b.team==='allied'&&b.isBuilt) navGrid.revealFog(b.x, b.y, navGrid.cellSize*8);
            });
            // Capture
            navGrid.updateCapture(dt, squads);
            // Sync ressources avec captures
            if (resources) resources.syncWithNavGrid(navGrid);
            if (aiRes)     aiRes.syncWithNavGrid(navGrid);
        }

        if (aiCtrl) aiCtrl.update(dt);

        // Détection captures → alertes
        if (navGrid && objectivesPanel) {
            navGrid.capturePoints.forEach(function(cp) {
                var prev = _prevCPOwners[cp.id];
                if (prev !== cp.owner) {
                    var icon = cp.type==='vp'?'⭐':cp.type==='fuel'?'⛽':cp.type==='munitions'?'🔧':'🏳';
                    if      (cp.owner==='allied') { objectivesPanel.pushAlert(icon+' '+cp.shortName+' capturé !','success'); if(victorySystem)victorySystem.recordCapture('allied'); }
                    else if (cp.owner==='axis')   { objectivesPanel.pushAlert(icon+' '+cp.shortName+' perdu !',  'danger');  if(victorySystem)victorySystem.recordCapture('axis'); }
                    else                          { objectivesPanel.pushAlert(icon+' '+cp.shortName+' contesté...','warning'); }
                    _prevCPOwners[cp.id] = cp.owner;
                }
            });
        }

        // Victory system update
        if (victorySystem && !gameOver) { victorySystem.update(dt); }
        if (objectivesPanel) { objectivesPanel.update(dt); if(victorySystem) objectivesPanel.setScore(victorySystem.getScore()); }

        // ---- RENDER ----
        mapRenderer.render(ctx, canvas, camera, navGrid, dt);

        ctx.save();
        ctx.scale(camera.zoom, camera.zoom);
        ctx.translate(-camera.x, -camera.y);
        buildings.forEach(function(b) { b.render(ctx); });

        // Trier unités : sol avant aériens
        var sorted = squads.slice().sort(function(a,b){ return (a.altitude||0)-(b.altitude||0); });
        sorted.forEach(function(sq) { sq.render(ctx); });

        // Ghost de placement de bâtiment
        if (buildMode && buildTemplate && camera) {
            _renderBuildGhost(ctx);
        }

        ctx.restore();

        if (isDragging) _renderRubberBand();
        if (prodUI) {
            prodUI.setSelectedPioneers(_selectedPioneers());
            prodUI.setSelectedSquads(_selectedSquads());
            prodUI.render(ctx, mouseX, mouseY);
        }

        // Panneau objectifs (toujours visible)
        if (objectivesPanel) {
            objectivesPanel.render(ctx, canvas, mouseX, mouseY);
        }

        // Écran de fin de partie
        if (gameOver && victorySystem && objectivesPanel) {
            objectivesPanel.renderEndScreen(ctx, canvas, victorySystem.winner, victorySystem.condition, victorySystem._buildFinalStats());
        }

        requestAnimationFrame(gameLoop);
    }

    // -----------------------------------------------------------------------
    //  BUILD GHOST
    // -----------------------------------------------------------------------
    function _renderBuildGhost(ctx) {
        if (!buildTemplate) return;
        var stats = RTS.Game.Building.STATS[buildTemplate.buildingType];
        if (!stats) return;
        var w=stats.w, h=stats.h;
        var x=buildGhostX, y=buildGhostY;
        ctx.save();
        ctx.fillStyle='rgba(80,160,255,0.2)';
        ctx.fillRect(x-w/2, y-h/2, w, h);
        ctx.strokeStyle='rgba(100,200,255,0.8)'; ctx.lineWidth=1.5; ctx.setLineDash([4,4]);
        ctx.strokeRect(x-w/2, y-h/2, w, h); ctx.setLineDash([]);
        ctx.fillStyle='rgba(150,220,255,0.8)'; ctx.font='bold 9px "Courier New"';
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(stats.label, x, y);
        ctx.restore();
    }

    // -----------------------------------------------------------------------
    //  RUBBER BAND
    // -----------------------------------------------------------------------
    function _renderRubberBand() {
        var rx=Math.min(dragStartX,dragCurrentX), ry=Math.min(dragStartY,dragCurrentY);
        var rw=Math.abs(dragCurrentX-dragStartX), rh=Math.abs(dragCurrentY-dragStartY);
        ctx.save();
        ctx.fillStyle='rgba(45,120,255,0.08)'; ctx.fillRect(rx,ry,rw,rh);
        ctx.strokeStyle='rgba(100,180,255,0.85)'; ctx.lineWidth=1.5;
        ctx.setLineDash([5,3]); ctx.strokeRect(rx,ry,rw,rh); ctx.setLineDash([]);
        ctx.restore();
    }

    // -----------------------------------------------------------------------
    //  HELPERS SÉLECTION
    // -----------------------------------------------------------------------
    function _alliedSquads() { return squads.filter(function(s){return s.team==='allied'&&!s.dead;}); }
    function _selectedSquads() { return squads.filter(function(s){return s.selected&&s.team==='allied'&&!s.dead;}); }
    function _selectedPioneers() { return _selectedSquads().filter(function(s){return s.type==='pioneer';}); }

    function _deselectAll() { squads.forEach(function(s){s.selected=false;}); }

    function _squadAtScreen(sx, sy) {
        if (!camera) return null;
        var w=camera.screenToWorld(sx,sy), found=null;
        _alliedSquads().forEach(function(sq){
            var dx=w.x-sq.x, dy=w.y-sq.y;
            if (Math.sqrt(dx*dx+dy*dy)<sq.radius) found=sq;
        });
        return found;
    }

    function _squadsInRect(x1, y1, x2, y2) {
        var minX=Math.min(x1,x2),maxX=Math.max(x1,x2),minY=Math.min(y1,y2),maxY=Math.max(y1,y2);
        return _alliedSquads().filter(function(sq){
            var s=camera.worldToScreen(sq.x,sq.y);
            return s.x>=minX&&s.x<=maxX&&s.y>=minY&&s.y<=maxY;
        });
    }

    function _buildingAtScreen(sx, sy) {
        if (!camera) return null;
        var w=camera.screenToWorld(sx,sy), found=null;
        buildings.forEach(function(b){
            if (b.team!=='allied') return;
            if (w.x>=b.x-b.w/2&&w.x<=b.x+b.w/2&&w.y>=b.y-b.h/2&&w.y<=b.y+b.h/2) found=b;
        });
        return found;
    }

    function _formationOffset(idx, total) {
        if (total===1) return {dx:0,dy:0};
        var cols=Math.ceil(Math.sqrt(total));
        return { dx:(idx%cols-(cols-1)/2)*45, dy:(Math.floor(idx/cols)-(Math.ceil(total/cols)-1)/2)*45 };
    }

    // -----------------------------------------------------------------------
    //  PRODUCTION
    // -----------------------------------------------------------------------
    function _tryProduce(prod) {
        if (!prodUI||!prodUI.selectedBuilding) return;
        var b = prodUI.selectedBuilding;
        if (!b.isBuilt) return;
        if (!resources.spend(prod.cost)) { console.warn('[Game] Ressources insuffisantes.'); return; }
        var ok = b.enqueue(prod.unitType, prod.time);
        if (ok)  console.info('[Game] Production : '+prod.label);
        else { resources.manpower+=prod.cost.manpower||0; resources.munitions+=prod.cost.munitions||0; resources.fuel+=prod.cost.fuel||0;
               console.warn('[Game] File pleine.'); }
    }

    // -----------------------------------------------------------------------
    //  CONSTRUCTION DE BÂTIMENT
    // -----------------------------------------------------------------------
    function _startBuildMode(cons) {
        var pioneers = _selectedPioneers();
        if (!pioneers.length) { console.warn('[Game] Pioneer requis.'); return; }
        if (!resources.canAfford(cons.cost)) { console.warn('[Game] Ressources insuffisantes.'); return; }
        buildMode     = true;
        buildTemplate = { buildingType:cons.buildingType, cost:cons.cost, time:cons.time, pioneer:pioneers[0] };
        canvas.style.cursor = 'cell';
        console.info('[Game] Clic droit pour placer : '+cons.label);
    }

    function _placeBuilding(worldX, worldY) {
        if (!buildTemplate) return;
        var t = buildTemplate;
        if (!resources.spend(t.cost)) { console.warn('[Game] Ressources insuffisantes.'); _cancelBuild(); return; }

        var b = new RTS.Game.Building(worldX, worldY, 'allied', t.buildingType);
        b.rallyX = worldX + 80; b.rallyY = worldY + 60;
        b.buildTime       = t.time;
        b.buildProgress   = 0;
        b.isBuilt         = false;
        b._buildTimeLeft  = t.time;
        buildings.push(b);

        // Envoyer le pioneer sur le site
        var pioneer = t.pioneer;
        var path    = navGrid.findPath(pioneer.x, pioneer.y, worldX, worldY);
        if (path.length) { pioneer.path=path; pioneer.pathIndex=0; }

        // Le pioneer commence la construction en arrivant (simulé par timer)
        // Pour simplifier, on démarre immédiatement (le pioneer "construit")
        // Un système plus élaboré vérifierait l'arrivée du pioneer
        console.info('[Game] Construction de '+t.buildingType+' lancée.');
        _cancelBuild();
    }

    function _cancelBuild() {
        buildMode     = false;
        buildTemplate = null;
        canvas.style.cursor = 'crosshair';
    }

    // -----------------------------------------------------------------------
    //  SOURIS
    // -----------------------------------------------------------------------
    document.addEventListener('mousemove', function(e) {
        mouseX=e.clientX; mouseY=e.clientY;
        dragCurrentX=e.clientX; dragCurrentY=e.clientY;

        if (buildMode && camera) {
            var w=camera.screenToWorld(e.clientX,e.clientY);
            buildGhostX=w.x; buildGhostY=w.y;
        }

        if (!isDragging&&e.buttons===1) {
            var dx=e.clientX-dragStartX,dy=e.clientY-dragStartY;
            if (Math.sqrt(dx*dx+dy*dy)>DRAG_THRESH) isDragging=true;
        }
    });

    canvas.addEventListener('mousedown', function(e) {
        if (e.button!==0||!camera) return;
        dragStartX=dragCurrentX=e.clientX;
        dragStartY=dragCurrentY=e.clientY;
        isDragging=false;
    });

    canvas.addEventListener('mouseup', function(e) {
        if (e.button!==0||!camera) return;

        // Mode placement bâtiment
        if (buildMode) {
            var w=camera.screenToWorld(e.clientX,e.clientY);
            _placeBuilding(w.x,w.y);
            isDragging=false; return;
        }

        // Bouton "Retour au menu" en fin de partie
        if (gameOver && objectivesPanel && objectivesPanel.isEndButtonClick(e.clientX, e.clientY)) {
            gameOver=false; victorySystem=null; squads=[]; buildings=[];
            if (typeof showScreen==='function') showScreen('mainMenu');
            return;
        }

        if (isDragging) {
            var inRect=_squadsInRect(dragStartX,dragStartY,dragCurrentX,dragCurrentY);
            if (!e.shiftKey) _deselectAll();
            inRect.forEach(function(s){s.selected=true;});
            if (inRect.length>0&&prodUI) prodUI.selectBuilding(null);
        } else {
            // Clic sur bouton ProductionUI ou Ability Panel
            var btn=prodUI ? prodUI.handleClick(e.clientX,e.clientY) : null;
            if (btn) {
                if      (btn.action==='produce'  &&btn.canAfford) _tryProduce(btn.prod);
                else if (btn.action==='construct'&&btn.canAfford) _startBuildMode(btn.cons);
                else if (btn.action==='ability'  &&btn.canUse)    btn.squad.activateAbility(btn.abilityId, squads);
                isDragging=false; return;
            }

            var bldg=_buildingAtScreen(e.clientX,e.clientY);
            if (bldg) {
                _deselectAll();
                if (prodUI) prodUI.selectBuilding(bldg);
                isDragging=false; return;
            }
            var clicked=_squadAtScreen(e.clientX,e.clientY);
            if (e.shiftKey) { if (clicked) clicked.selected=!clicked.selected; }
            else {
                _deselectAll();
                if (clicked) { clicked.selected=true; if(prodUI)prodUI.selectBuilding(null); }
            }
        }
        isDragging=false;
    });

    canvas.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        if (!navGrid||!camera) return;

        // Annuler le mode de placement
        if (buildMode) { _cancelBuild(); return; }

        var world    = camera.screenToWorld(e.clientX,e.clientY);
        var selected = _selectedSquads();

        if (selected.length>0) {
            selected.forEach(function(sq,i){
                var off=_formationOffset(i,selected.length);
                var path=navGrid.findPath(sq.x,sq.y,world.x+off.dx,world.y+off.dy);
                if (!path.length) path=navGrid.findPath(sq.x,sq.y,world.x,world.y);
                // Sortir du combat pour suivre un ordre de mouvement
                sq.inCombat=false; sq.target=null;
                sq.path=path; sq.pathIndex=0;
            });
        } else if (prodUI&&prodUI.selectedBuilding) {
            // Rally point
            prodUI.selectedBuilding.rallyX=world.x;
            prodUI.selectedBuilding.rallyY=world.y;
        }
    });

    canvas.addEventListener('wheel', function(e) {
        e.preventDefault();
        if (!camera) return;
        camera.applyZoom(e.deltaY,e.clientX,e.clientY);
    },{passive:false});

    // -----------------------------------------------------------------------
    //  CLAVIER
    // -----------------------------------------------------------------------
    document.addEventListener('keydown', function(e) {
        keys[e.key]=true;

        if (mapRenderer) {
            if (e.key==='g'||e.key==='G') mapRenderer.showNavGrid=!mapRenderer.showNavGrid;
            if (e.key==='F1') { mapRenderer.showSectors=!mapRenderer.showSectors; e.preventDefault(); }
        }

        // BUG 1 FIX — guard prodUI existence before .visible access
        if ((e.key==='r'||e.key==='R') && !(prodUI&&prodUI.visible)) {
            if (navGrid) for(var y=0;y<navGrid.rows;y++) for(var x=0;x<navGrid.cols;x++) navGrid.grid[y][x].fogState=2;
        }

        if (e.key==='h'||e.key==='H') {
            if (camera&&navGrid) camera.snapTo(navGrid.capturePoints[0].x,navGrid.capturePoints[0].y);
        }

        if ((e.key==='a'||e.key==='A')&&e.ctrlKey) {
            e.preventDefault();
            _alliedSquads().forEach(function(s){s.selected=true;});
        }

        if (e.key==='Escape') {
            if (buildMode) { _cancelBuild(); return; }
            _deselectAll();
            if (prodUI) {
                var hqB=null;
                buildings.forEach(function(b){if(b.team==='allied'&&b.type==='hq')hqB=b;});
                prodUI.selectBuilding(hqB);
            }
        }

        // BUG 2 FIX — ability shortcuts for selected squads
        if (prodUI && !prodUI.selectedBuilding && prodUI.selectedSquads && prodUI.selectedSquads.length > 0) {
            var sq = prodUI.selectedSquads[0];
            if (sq && sq.abilities) {
                var defs = RTS.Game.Squad.ABILITY_DEFS;
                Object.keys(sq.abilities).forEach(function(id) {
                    var def = defs[id];
                    if (def && e.key.toUpperCase() === def.key) {
                        sq.activateAbility(id, squads);
                    }
                });
            }
        }

        // Raccourcis production / construction
        if (prodUI&&prodUI.visible&&prodUI.selectedBuilding) {
            var btn=prodUI.handleKey(e.key);
            if (btn) {
                if      (btn.action==='produce'  &&btn.canAfford) _tryProduce(btn.prod);
                else if (btn.action==='construct'&&btn.canAfford) _startBuildMode(btn.cons);
            }
        }

        if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].indexOf(e.key)!==-1) e.preventDefault();
    });

    document.addEventListener('keyup', function(e) { keys[e.key]=false; });

    window.addEventListener('resize', function() {
        canvas.width=window.innerWidth; canvas.height=window.innerHeight;
        if (camera){camera.viewWidth=canvas.width;camera.viewHeight=canvas.height;}
    });
};