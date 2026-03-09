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
 *  Clic molette    : pan caméra (maintenir + glisser)
 *  Molette         : zoom
 *  ZQSD            : défilement caméra
 *  G               : afficher/masquer grille nav
 *  F1              : afficher/masquer secteurs
 *  Shift+R (hors sélection) : révéler brouillard (debug)
 *  H / Espace      : centrer sur base alliée
 *  Ctrl+A          : tout sélectionner
 *  Échap           : déselect + retour QG
 *  A/W/E/R (prod)  : raccourcis production
 *  N/X/C/V/B (QG)  : raccourcis construction (si pioneers sélectionnés)
 *  1/2/3 (QG)      : upgrades de tiers
 *  Z/X/C (QG)      : choix doctrine (permanent)
 *  Y/U (QG)        : call-ins doctrine (consomment CP)
 *  Shift + prod     : ajoute 5 unités d'un coup dans la file
 *  Shift + clic droit : ajoute un waypoint (ordre en file)
 *  T               : retraite escouades sélectionnées
 *  V               : renfort au QG (Shift+V = full reinforce)
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
    var isPanning    = false;
    var panLastX     = 0, panLastY = 0;

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
    var aiDifficultyMultiplier = 1.0;

    var AI_DIFFICULTY = {
        easy:   0.85,
        normal: 1.00,
        hard:   1.20
    };
    var BASE_CAMERA_UI_OFFSET_FACTOR = 0.65;
    var POP_CAP = { allied:90, axis:100 };
    var RETREAT_SAFE_RADIUS = 170;
    var TECH_TIER_MAX = 4;
    var techTier = 1;
    var techUpgradeState = null; // { id,label,targetTier,timeLeft,totalTime }
    var doctrineState = {
        selected: null,
        commandPoints: 0,
        commandPointCap: 12,
        passiveTimer: 0
    };
    var pendingDoctrineCallins = [];

    var DOCTRINES = {
        infantry: {
            id:'infantry', label:'Doctrine Infanterie', key:'Z',
            desc:'Renforts moins chers et infanterie plus mobile.',
            passive:'-20% cout renfort, +8% vitesse infanterie.',
            callins: [
                { id:'ranger_callin', label:'Rangers', key:'Y', unitType:'ranger', cp:2, cost:{manpower:500,munitions:35}, time:34, desc:'Infanterie elite polyvalente.' },
                { id:'commando_callin', label:'Commando', key:'U', unitType:'commando', cp:5, cost:{manpower:560,munitions:55}, time:40, desc:'Escouade choc a fort burst.' }
            ]
        },
        armored: {
            id:'armored', label:'Doctrine Blindee', key:'X',
            desc:'Vise la superiorite mecanisee.',
            passive:'+12% degats vehicules, -10% degats recus vehicules.',
            callins: [
                { id:'m10_callin', label:'M10 Wolverine', key:'Y', unitType:'m10_wolverine', cp:3, cost:{manpower:620,fuel:95}, time:46, desc:'Chasseur de chars mobile.' },
                { id:'heavy_callin', label:'Heavy Tank', key:'U', unitType:'heavy_tank', cp:7, cost:{manpower:860,fuel:150}, time:75, desc:'Poussee frontale lourde.' }
            ]
        },
        air: {
            id:'air', label:'Doctrine Aerienne', key:'C',
            desc:'Appui aerien et projection rapide.',
            passive:'+25% revenu munitions, +12% vitesse unites aeriennes.',
            callins: [
                { id:'para_callin', label:'Paratroopers', key:'Y', unitType:'paratrooper', cp:2, cost:{manpower:520,munitions:40}, time:36, desc:'Infanterie elite de debarquement.' },
                { id:'heli_callin', label:'Helico Attaque', key:'U', unitType:'heli_attack', cp:6, cost:{manpower:600,fuel:125,munitions:60}, time:58, desc:'Appui anti-char aerien.' }
            ]
        }
    };

    function _clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }

    function _clampWorldPos(x, y, margin) {
        if (!navGrid) return { x:x, y:y };
        margin = (margin !== undefined) ? margin : 8;
        return {
            x: _clamp(x, margin, Math.max(margin, navGrid.mapWidth  - margin)),
            y: _clamp(y, margin, Math.max(margin, navGrid.mapHeight - margin))
        };
    }

    function _clampBuildingPos(x, y, buildingType) {
        if (!navGrid) return { x:x, y:y };
        var stats = RTS.Game.Building.STATS[buildingType] || RTS.Game.Building.STATS.hq;
        var pad   = 6;
        var halfW = stats.w / 2 + pad;
        var halfH = stats.h / 2 + pad;
        return {
            x: _clamp(x, halfW, Math.max(halfW, navGrid.mapWidth  - halfW)),
            y: _clamp(y, halfH, Math.max(halfH, navGrid.mapHeight - halfH))
        };
    }

    function _setSafeRally(building, x, y) {
        var p = _clampWorldPos(x, y, 10);
        building.rallyX = p.x;
        building.rallyY = p.y;
    }

    function _isCameraMoveKey(key) {
        key = (key || '').toLowerCase();
        return key === 'z' || key === 'q' || key === 's' || key === 'd';
    }

    function _getAIDifficultyMultiplier(id) {
        if (!id) return AI_DIFFICULTY.normal;
        id = String(id).toLowerCase();
        return AI_DIFFICULTY[id] || AI_DIFFICULTY.normal;
    }

    function _getAlliedHQBuilding() {
        for (var i = 0; i < buildings.length; i++) {
            if (buildings[i].team === 'allied' && buildings[i].type === 'hq') return buildings[i];
        }
        return null;
    }

    function _centerCameraOnAlliedBase() {
        if (!camera) return;
        var baseOffsetY = ((prodUI ? prodUI.barH : 110) * BASE_CAMERA_UI_OFFSET_FACTOR) / Math.max(0.35, camera.zoom);
        var hqB = _getAlliedHQBuilding();
        if (hqB) { camera.snapTo(hqB.x, hqB.y - baseOffsetY); return; }
        if (navGrid) {
            var cp = navGrid.capturePoints.filter(function(c){ return c.isHQ && c.owner === 'allied'; })[0];
            if (cp) camera.snapTo(cp.x, cp.y - baseOffsetY);
        }
    }

    function _alliedHQUpgrades() {
        var stats = RTS.Game.Building.STATS.hq || {};
        return stats.upgrades || [];
    }

    function _doctrineChoices() {
        return Object.keys(DOCTRINES).map(function(id) {
            var d = DOCTRINES[id];
            return { id:d.id, label:d.label, key:d.key, desc:d.desc, passive:d.passive };
        });
    }

    function _currentDoctrine() {
        return doctrineState.selected ? DOCTRINES[doctrineState.selected] : null;
    }

    function _gainCommandPoints(amount, reason) {
        amount = Math.max(0, Math.round(amount || 0));
        if (!amount) return;
        var before = doctrineState.commandPoints;
        doctrineState.commandPoints = Math.min(
            doctrineState.commandPointCap,
            doctrineState.commandPoints + amount
        );
        if (doctrineState.commandPoints > before) {
            console.info('[Game] CP +' + (doctrineState.commandPoints - before) + ' (' + reason + ')');
        }
    }

    function _spendCommandPoints(amount) {
        amount = Math.max(0, Math.round(amount || 0));
        if (doctrineState.commandPoints < amount) return false;
        doctrineState.commandPoints -= amount;
        return true;
    }

    function _getDoctrineCallinByKey(key) {
        var d = _currentDoctrine();
        if (!d) return null;
        key = String(key || '').toUpperCase();
        for (var i = 0; i < d.callins.length; i++) {
            if (String(d.callins[i].key || '').toUpperCase() === key) return d.callins[i];
        }
        return null;
    }

    function _applyDoctrineBonusesToSquad(sq) {
        if (!sq || sq.team !== 'allied') return;
        if (!doctrineState.selected) return;
        if (sq._doctrineTag === doctrineState.selected) return;

        sq._doctrineTag = doctrineState.selected;
        if (doctrineState.selected === 'infantry') {
            if (!sq.isVehicle && !sq.isAerial) sq.speed *= 1.08;
        } else if (doctrineState.selected === 'armored') {
            if (sq.isVehicle) {
                sq.damage *= 1.12;
                sq.doctrineDamageTakenMul = 0.90;
            }
        } else if (doctrineState.selected === 'air') {
            if (sq.isAerial) sq.speed *= 1.12;
        }
    }

    function _startHQUpgrade(upgrade) {
        if (!upgrade || !resources) return false;
        if (techUpgradeState) { console.warn('[Game] Upgrade deja en cours.'); return false; }
        if (techTier >= upgrade.targetTier) { console.warn('[Game] Tier deja debloque.'); return false; }
        if (techTier < (upgrade.requiresTier || 1)) { console.warn('[Game] Tier requis: ' + (upgrade.requiresTier || 1)); return false; }
        if (!resources.spend(upgrade.cost || {})) { console.warn('[Game] Ressources insuffisantes.'); return false; }

        techUpgradeState = {
            id: upgrade.id,
            label: upgrade.label,
            targetTier: upgrade.targetTier,
            timeLeft: upgrade.time,
            totalTime: upgrade.time
        };
        console.info('[Game] Recherche lancee: ' + upgrade.label);
        return true;
    }

    function _updateHQUpgrade(dt) {
        if (!techUpgradeState) return;
        techUpgradeState.timeLeft -= dt;
        if (techUpgradeState.timeLeft <= 0) {
            techTier = Math.min(TECH_TIER_MAX, Math.max(techTier, techUpgradeState.targetTier));
            console.info('[Game] Tier ' + techTier + ' debloque.');
            techUpgradeState = null;
        }
    }

    function _selectDoctrine(doctrineId) {
        if (!DOCTRINES[doctrineId]) return false;
        if (doctrineState.selected) { console.warn('[Game] Doctrine deja choisie.'); return false; }
        doctrineState.selected = doctrineId;
        _alliedSquads().forEach(_applyDoctrineBonusesToSquad);
        console.info('[Game] Doctrine active: ' + DOCTRINES[doctrineId].label);
        return true;
    }

    function _queueDoctrineCallin(callin) {
        if (!callin || !resources) return false;
        if (!_currentDoctrine()) return false;
        if (!_spendCommandPoints(callin.cp || 0)) { console.warn('[Game] CP insuffisants.'); return false; }
        if (!resources.spend(callin.cost || {})) {
            doctrineState.commandPoints += (callin.cp || 0);
            console.warn('[Game] Ressources insuffisantes.');
            return false;
        }
        pendingDoctrineCallins.push({
            unitType: callin.unitType,
            timeLeft: callin.time || 0,
            totalTime: callin.time || 0,
            label: callin.label
        });
        console.info('[Game] Call-in: ' + callin.label + ' (ETA ' + (callin.time || 0) + 's)');
        return true;
    }

    function _updateDoctrineCallins(dt) {
        for (var i = pendingDoctrineCallins.length - 1; i >= 0; i--) {
            var c = pendingDoctrineCallins[i];
            c.timeLeft -= dt;
            if (c.timeLeft > 0) continue;

            var hq = _getAlliedHQBuilding();
            if (hq) {
                var pos = _clampWorldPos(
                    hq.rallyX + (Math.random() - 0.5) * 24,
                    hq.rallyY + (Math.random() - 0.5) * 24,
                    12
                );
                var sq = new RTS.Game.Squad(pos.x, pos.y, 'allied', c.unitType);
                _applyDoctrineBonusesToSquad(sq);
                squads.push(sq);
            }
            pendingDoctrineCallins.splice(i, 1);
        }
    }

    function _tryStartHQUpgradeByKey(key) {
        var hq = _getAlliedHQBuilding();
        if (!hq || !hq.isBuilt) return false;
        key = String(key || '').toUpperCase();
        var upgrades = _alliedHQUpgrades();
        for (var i = 0; i < upgrades.length; i++) {
            if (String(upgrades[i].key || '').toUpperCase() !== key) continue;
            return _startHQUpgrade(upgrades[i]);
        }
        return false;
    }

    function _trySelectDoctrineByKey(key) {
        if (doctrineState.selected) return false;
        key = String(key || '').toUpperCase();
        var ids = Object.keys(DOCTRINES);
        for (var i = 0; i < ids.length; i++) {
            var d = DOCTRINES[ids[i]];
            if (String(d.key || '').toUpperCase() !== key) continue;
            return _selectDoctrine(d.id);
        }
        return false;
    }

    function _tryDoctrineCallinByKey(key) {
        var c = _getDoctrineCallinByKey(key);
        if (!c) return false;
        if (!resources || !resources.canAfford(c.cost || {})) return false;
        if (doctrineState.commandPoints < (c.cp || 0)) return false;
        return _queueDoctrineCallin(c);
    }

    function _getPopCost(unitType) {
        var s = RTS.Game.Squad.STATS[unitType];
        if (!s) return 6;
        if (unitType === 'airstrike' || unitType === 'p47_thunderbolt' || unitType === 'fw190' || unitType === 'me262') return 0;
        if (s.aerial) return 12;
        if (s.vehicle) {
            if (s.armorType === 'heavy') return 14;
            if (s.role === 'artillery' || s.role === 'anti_tank') return 12;
            return 10;
        }
        if (unitType === 'sniper' || unitType === 'commando' || unitType === 'officer') return 5;
        return 6;
    }

    function _teamPopulation(team, includeQueued) {
        var pop = 0;
        squads.forEach(function(sq) {
            if (sq.team !== team || sq.dead) return;
            pop += _getPopCost(sq.type);
        });
        if (includeQueued) {
            buildings.forEach(function(b) {
                if (b.team !== team || !b.queue || !b.queue.length) return;
                b.queue.forEach(function(q) { pop += _getPopCost(q.unitType); });
            });
        }
        return pop;
    }

    function _getReinforceCostForUnit(unitType) {
        var base = 35;
        if (unitType === 'ranger' || unitType === 'paratrooper' || unitType === 'commando' || unitType === 'officer' || unitType === 'sniper') base = 55;
        if (unitType === 'pioneer' || unitType === 'combat_engineer') base = 28;
        if (doctrineState.selected === 'infantry') base = Math.round(base * 0.8);
        return base;
    }

    function _updateSquadTacticalState() {
        if (!navGrid) return;
        squads.forEach(function(sq) {
            if (sq.dead) return;
            if (sq.isVehicle || sq.isAerial || sq.retreating) { sq.coverLevel = 0; return; }
            if (sq.path && sq.path.length && sq.pathIndex < sq.path.length && !sq.inCombat) { sq.coverLevel = 0; return; }

            var g = navGrid.worldToGrid(sq.x, sq.y);
            var t = navGrid.getTile(g.x, g.y);
            sq.coverLevel = t ? (t.cover || 0) : 0;
            if (sq._smokeParticles && sq._smokeParticles.length > 0) sq.coverLevel = Math.max(sq.coverLevel, 1);
        });
    }

    function _orderRetreatSelected() {
        if (!navGrid) return 0;
        var hq = _getAlliedHQBuilding();
        if (!hq) return 0;
        var selected = _selectedSquads();
        var count = 0;

        selected.forEach(function(sq) {
            if (sq.dead || sq.team !== 'allied') return;
            if (sq.isVehicle || sq.isAerial) return;
            var goal = _clampWorldPos(
                hq.x + (Math.random() - 0.5) * 40,
                hq.y + hq.h / 2 + 90 + (Math.random() - 0.5) * 30,
                12
            );
            var path = navGrid.findPath(sq.x, sq.y, goal.x, goal.y);
            if (!path.length) return;
            sq.retreating = true;
            sq.inCombat = false;
            sq.target = null;
            sq.path = path;
            sq.pathIndex = 0;
            count++;
        });
        if (count > 0) console.info('[Game] Retraite ordonnee: ' + count + ' escouade(s).');
        return count;
    }

    function _reinforceSelectedAtHQ(isBulk) {
        var hq = _getAlliedHQBuilding();
        if (!hq || !resources) return 0;
        var selected = _selectedSquads();
        var reinforced = 0;

        selected.forEach(function(sq) {
            if (!sq.canReinforce || !sq.canReinforce()) return;
            var dx = sq.x - hq.x;
            var dy = sq.y - hq.y;
            if (Math.sqrt(dx*dx + dy*dy) > RETREAT_SAFE_RADIUS) return;
            var cost = _getReinforceCostForUnit(sq.type);

            do {
                if (!resources.spend({ manpower:cost })) break;
                if (!sq.reinforceOne()) {
                    resources.manpower += cost;
                    break;
                }
                reinforced++;
            } while (isBulk && sq.canReinforce && sq.canReinforce());
        });

        if (reinforced > 0) console.info('[Game] Renforts recus: +' + reinforced + ' soldat(s).');
        return reinforced;
    }

    // -----------------------------------------------------------------------
    //  CHARGEMENT — exposé au menu via _startGame
    // -----------------------------------------------------------------------
    var mapRenderer = null;
    window._startGame = function(mapId, difficultyId) {
        mapId = mapId || 1;
        aiDifficultyMultiplier = _getAIDifficultyMultiplier(difficultyId || window._selectedDifficulty || 'normal');
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
        techTier = 1;
        techUpgradeState = null;
        doctrineState.selected = null;
        doctrineState.commandPoints = 0;
        doctrineState.commandPointCap = 12;
        doctrineState.passiveTimer = 0;
        pendingDoctrineCallins = [];

        // --- Bâtiments QG ---
        var alliedHQPos = _clampBuildingPos(alliedHQcp.x, alliedHQcp.y, 'hq');
        var alliedHQ = new RTS.Game.Building(alliedHQPos.x, alliedHQPos.y, 'allied', 'hq');
        _setSafeRally(alliedHQ, alliedHQPos.x + 80, alliedHQPos.y - 50);
        buildings.push(alliedHQ);

        var axisHQPos = _clampBuildingPos(axisHQcp.x, axisHQcp.y, 'hq');
        var axisHQ = new RTS.Game.Building(axisHQPos.x, axisHQPos.y, 'axis', 'hq');
        _setSafeRally(axisHQ, axisHQPos.x - 80, axisHQPos.y + 50);
        buildings.push(axisHQ);

        // --- Avant-postes axis (petites bases à détruire) ---
        cp.filter(function(c){ return c.isOutpost; }).forEach(function(ocp) {
            var op = _clampBuildingPos(ocp.x, ocp.y, 'support');
            var ob = new RTS.Game.Building(op.x, op.y, 'axis', 'support');
            _setSafeRally(ob, op.x, op.y + 70);
            ob.isBuilt = true; ob.buildProgress = 1.0;
            buildings.push(ob);
            // Garnison initiale allégée pour limiter l'avantage Axis en début de partie
            var opS1 = _clampWorldPos(op.x + 40, op.y + 30, 20);
            squads.push(new RTS.Game.Squad(opS1.x, opS1.y, 'axis', 'rifle'));
        });

        // --- Escouades alliées initiales ---
        var hqX = alliedHQ.x, hqY = alliedHQ.y;
        var a1 = _clampWorldPos(hqX + 100, hqY - 40, 20);
        var a2 = _clampWorldPos(hqX + 140, hqY + 20, 20);
        var a3 = _clampWorldPos(hqX + 60,  hqY + 60, 20);
        var a4 = _clampWorldPos(hqX + 80,  hqY + 100, 20);
        squads.push(new RTS.Game.Squad(a1.x, a1.y, 'allied', 'rifle'));
        squads.push(new RTS.Game.Squad(a2.x, a2.y, 'allied', 'rifle'));
        squads.push(new RTS.Game.Squad(a3.x, a3.y, 'allied', 'mg'));
        squads.push(new RTS.Game.Squad(a4.x, a4.y, 'allied', 'pioneer'));

        // --- IA Axis ---
        aiCtrl = new RTS.Game.AIController(navGrid, buildings, squads, aiRes, aiDifficultyMultiplier);
        var axX = axisHQ.x, axY = axisHQ.y;
        var x1 = _clampWorldPos(axX - 100, axY + 40, 20);
        var x2 = _clampWorldPos(axX - 60,  axY + 80, 20);
        squads.push(new RTS.Game.Squad(x1.x, x1.y, 'axis', 'rifle'));
        squads.push(new RTS.Game.Squad(x2.x, x2.y, 'axis', 'rifle'));

        // --- UI : QG par défaut, onglet construction ---
        prodUI = new RTS.Game.ProductionUI(canvas, function() {
            return resources.get();
        });
        prodUI.selectBuilding(alliedHQ);
        prodUI.activeTab = 'construct';

        _centerCameraOnAlliedBase();

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
        _updateHQUpgrade(dt);

        doctrineState.passiveTimer += dt;
        if (doctrineState.passiveTimer >= 55) {
            doctrineState.passiveTimer -= 55;
            _gainCommandPoints(1, 'temps');
        }

        // Bâtiments
        buildings.forEach(function(b) {
            var done = b.update(dt);
            if (done) {
                var team = b.team;
                if (team === 'allied') {
                    var sq = new RTS.Game.Squad(b.rallyX, b.rallyY, 'allied', done);
                    _applyDoctrineBonusesToSquad(sq);
                    squads.push(sq);
                }
                // Axis : spawn gratuit (IA gère via AIController._spawnUnit)
            }
        });

        // Tactical state (cover / movement) before combat resolution
        _updateSquadTacticalState();

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
            if (resources && doctrineState.selected === 'air') {
                resources._munRate += 0.5;
                resources.munitionsRate = Math.round(resources._munRate * 60);
            }
        }

        if (aiCtrl) aiCtrl.update(dt);
        _updateDoctrineCallins(dt);

        // Détection captures → alertes
        if (navGrid && objectivesPanel) {
            navGrid.capturePoints.forEach(function(cp) {
                var prev = _prevCPOwners[cp.id];
                if (prev !== cp.owner) {
                    var icon = cp.type==='vp'?'⭐':cp.type==='fuel'?'⛽':cp.type==='munitions'?'🔧':'🏳';
                    if      (cp.owner==='allied') { objectivesPanel.pushAlert(icon+' '+cp.shortName+' capturé !','success'); if(victorySystem)victorySystem.recordCapture('allied'); }
                    else if (cp.owner==='axis')   { objectivesPanel.pushAlert(icon+' '+cp.shortName+' perdu !',  'danger');  if(victorySystem)victorySystem.recordCapture('axis'); }
                    else                          { objectivesPanel.pushAlert(icon+' '+cp.shortName+' contesté...','warning'); }
                    if (cp.owner==='allied' && !cp.isHQ) _gainCommandPoints(1, 'capture');
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
            prodUI.setTechState({
                built: _getAlliedBuiltTechMap(),
                counts: _getAlliedBuildingCounts(),
                availablePioneers: _alliedPioneers().length,
                population: _teamPopulation('allied', true),
                popCap: POP_CAP.allied,
                techTier: techTier,
                upgradeInProgress: techUpgradeState ? {
                    label: techUpgradeState.label,
                    timeLeft: techUpgradeState.timeLeft,
                    totalTime: techUpgradeState.totalTime
                } : null,
                commandPoints: doctrineState.commandPoints,
                commandPointCap: doctrineState.commandPointCap,
                doctrineSelected: doctrineState.selected,
                doctrineChoices: _doctrineChoices(),
                doctrineCallins: (_currentDoctrine() ? _currentDoctrine().callins : [])
            });
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
    function _alliedPioneers() { return _alliedSquads().filter(function(s){return s.type==='pioneer';}); }
    function _selectedSquads() { return squads.filter(function(s){return s.selected&&s.team==='allied'&&!s.dead;}); }
    function _selectedPioneers() { return _selectedSquads().filter(function(s){return s.type==='pioneer';}); }

    function _getAlliedBuildingCounts() {
        var counts = {};
        buildings.forEach(function(b) {
            if (b.team !== 'allied') return;
            counts[b.type] = (counts[b.type] || 0) + 1;
        });
        return counts;
    }

    function _getAlliedBuiltTechMap() {
        var built = {};
        buildings.forEach(function(b) {
            if (b.team === 'allied' && b.isBuilt) built[b.type] = true;
        });
        return built;
    }

    function _findBuildPioneer() {
        var selected = _selectedPioneers();
        if (selected.length) return selected[0];

        var pioneers = _alliedPioneers();
        if (!pioneers.length) return null;

        var hq = _getAlliedHQBuilding();
        if (!hq) return pioneers[0];

        var best = pioneers[0];
        var bestD2 = Infinity;
        pioneers.forEach(function(p) {
            var dx = p.x - hq.x;
            var dy = p.y - hq.y;
            var d2 = dx*dx + dy*dy;
            if (d2 < bestD2) {
                best = p;
                bestD2 = d2;
            }
        });
        return best;
    }

    function _buildingLabel(type) {
        var st = RTS.Game.Building.STATS[type];
        return st ? st.label : String(type || '').toUpperCase();
    }

    function _getConstructionBlockReason(cons) {
        if (!cons || !cons.buildingType) return 'Construction invalide.';

        var counts = _getAlliedBuildingCounts();
        if ((counts[cons.buildingType] || 0) > 0) {
            return _buildingLabel(cons.buildingType) + ' deja present.';
        }
        if (_alliedPioneers().length === 0) return 'Aucun pioneer disponible.';

        var tierReq = cons.minTier || 1;
        if (techTier < tierReq) return 'Tier ' + tierReq + ' requis.';

        var built = _getAlliedBuiltTechMap();
        var reqs = cons.requires || [];
        for (var i = 0; i < reqs.length; i++) {
            if (!built[reqs[i]]) return 'Prerequis manquant : ' + _buildingLabel(reqs[i]);
        }
        return null;
    }

    function _deselectAll() { squads.forEach(function(s){s.selected=false;}); }

    function _squadAtScreen(sx, sy) {
        if (!camera) return null;
        var w=camera.screenToWorld(sx,sy), found=null;
        _alliedSquads().forEach(function(sq){
            var dx=w.x-sq.x, dy=w.y-sq.y;
            if (Math.sqrt(dx*dx+dy*dy)<(sq.radius+12)) found=sq;
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
    function _tryProduce(prod, amount) {
        if (!prodUI||!prodUI.selectedBuilding) return;
        var b = prodUI.selectedBuilding;
        if (!b.isBuilt) return;
        amount = Math.max(1, amount || 1);
        var queued = 0;

        for (var i = 0; i < amount; i++) {
            var tierReq = prod.minTier || 1;
            if (techTier < tierReq) {
                if (queued === 0) console.warn('[Game] Tier '+tierReq+' requis.');
                break;
            }
            var projectedPop = _teamPopulation('allied', true) + _getPopCost(prod.unitType);
            if (projectedPop > POP_CAP.allied) {
                if (queued === 0) console.warn('[Game] Population max atteinte (' + _teamPopulation('allied', true) + '/' + POP_CAP.allied + ').');
                break;
            }

            if (!resources.spend(prod.cost)) {
                if (queued === 0) console.warn('[Game] Ressources insuffisantes.');
                break;
            }

            var ok = b.enqueue(prod.unitType, prod.time);
            if (!ok) {
                // Remboursement immédiat si la file est pleine.
                resources.manpower  += prod.cost.manpower  || 0;
                resources.munitions += prod.cost.munitions || 0;
                resources.fuel      += prod.cost.fuel      || 0;
                if (queued === 0) console.warn('[Game] File pleine.');
                break;
            }
            queued++;
        }

        if (queued > 0) console.info('[Game] Production : '+prod.label+' x'+queued);
    }

    // -----------------------------------------------------------------------
    //  CONSTRUCTION DE BÂTIMENT
    // -----------------------------------------------------------------------
    function _startBuildMode(cons) {
        var blockReason = _getConstructionBlockReason(cons);
        if (blockReason) { console.warn('[Game] ' + blockReason); return; }
        if (!resources.canAfford(cons.cost)) { console.warn('[Game] Ressources insuffisantes.'); return; }
        var pioneer = _findBuildPioneer();
        if (!pioneer) { console.warn('[Game] Pioneer requis.'); return; }

        buildMode     = true;
        buildTemplate = { buildingType:cons.buildingType, cost:cons.cost, time:cons.time, pioneer:pioneer };
        canvas.style.cursor = 'cell';
        console.info('[Game] Clic droit pour placer : '+cons.label);
    }

    function _placeBuilding(worldX, worldY) {
        if (!buildTemplate) return;
        var t = buildTemplate;
        if (!resources.spend(t.cost)) { console.warn('[Game] Ressources insuffisantes.'); _cancelBuild(); return; }

        var pos = _clampBuildingPos(worldX, worldY, t.buildingType);
        var b = new RTS.Game.Building(pos.x, pos.y, 'allied', t.buildingType);
        _setSafeRally(b, pos.x + 80, pos.y + 60);
        b.buildTime       = t.time;
        b.buildProgress   = 0;
        b.isBuilt         = false;
        b._buildTimeLeft  = t.time;
        buildings.push(b);

        // Envoyer le pioneer sur le site
        var pioneer = t.pioneer;
        var path    = navGrid.findPath(pioneer.x, pioneer.y, pos.x, pos.y);
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

        if (isPanning && camera) {
            var pdx = e.clientX - panLastX;
            var pdy = e.clientY - panLastY;
            camera.panByScreenDelta(pdx, pdy);
            panLastX = e.clientX;
            panLastY = e.clientY;
        }

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
        if (!camera) return;

        if (e.button===1) {
            isPanning = true;
            panLastX = e.clientX;
            panLastY = e.clientY;
            canvas.style.cursor = 'grabbing';
            e.preventDefault();
            return;
        }

        if (e.button!==0) return;
        dragStartX=dragCurrentX=e.clientX;
        dragStartY=dragCurrentY=e.clientY;
        isDragging=false;
    });

    canvas.addEventListener('mouseup', function(e) {
        if (e.button===1) {
            isPanning = false;
            canvas.style.cursor = buildMode ? 'cell' : 'crosshair';
            return;
        }

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
                if      (btn.action==='produce'  &&btn.canAfford) _tryProduce(btn.prod, e.shiftKey ? 5 : 1);
                else if (btn.action==='construct'&&btn.canAfford&&btn.canBuild) _startBuildMode(btn.cons);
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

    canvas.addEventListener('mouseleave', function() {
        if (!isPanning) return;
        isPanning = false;
        canvas.style.cursor = buildMode ? 'cell' : 'crosshair';
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
                var destX=world.x+off.dx, destY=world.y+off.dy;
                var path=navGrid.findPath(sq.x,sq.y,destX,destY);
                if (!path.length) path=navGrid.findPath(sq.x,sq.y,world.x,world.y);

                // Shift + clic droit : ajoute un ordre à la file (waypoint chain).
                if (e.shiftKey && sq.path && sq.path.length && sq.pathIndex < sq.path.length) {
                    var tail = sq.path[sq.path.length-1];
                    var path2 = navGrid.findPath(tail.x, tail.y, destX, destY);
                    if (!path2.length) path2 = navGrid.findPath(tail.x, tail.y, world.x, world.y);
                    if (path2.length) {
                        sq.path = sq.path.concat(path2.slice(1));
                        return;
                    }
                }

                // Ordre standard : remplace l'ordre en cours.
                sq.retreating=false;
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
        keys[e.code]=true;
        var consumeForCamera = false;

        if (mapRenderer) {
            if (e.key==='g'||e.key==='G') mapRenderer.showNavGrid=!mapRenderer.showNavGrid;
            if (e.key==='F1') { mapRenderer.showSectors=!mapRenderer.showSectors; e.preventDefault(); }
        }

        // BUG 1 FIX — guard prodUI existence before .visible access
        if ((e.key==='r'||e.key==='R') && e.shiftKey && !(prodUI&&prodUI.visible)) {
            if (navGrid) for(var y=0;y<navGrid.rows;y++) for(var x=0;x<navGrid.cols;x++) navGrid.grid[y][x].fogState=2;
        }

        if (e.key==='h'||e.key==='H'||e.key==='Home') {
            _centerCameraOnAlliedBase();
        }
        if (e.code==='Space') {
            _centerCameraOnAlliedBase();
        }

        if ((e.key==='a'||e.key==='A')&&e.ctrlKey) {
            e.preventDefault();
            _alliedSquads().forEach(function(s){s.selected=true;});
        }

        if ((e.key==='t'||e.key==='T') && (!prodUI || !prodUI.selectedBuilding)) {
            if (_orderRetreatSelected() > 0) {
                consumeForCamera = true;
                e.preventDefault();
            }
        }
        if ((e.key==='v'||e.key==='V') && (!prodUI || !prodUI.selectedBuilding)) {
            if (_reinforceSelectedAtHQ(e.shiftKey) > 0) {
                consumeForCamera = true;
                e.preventDefault();
            }
        }

        if (e.key==='Escape') {
            if (buildMode) { _cancelBuild(); return; }
            _deselectAll();
            if (prodUI) {
                var hqB=null;
                buildings.forEach(function(b){if(b.team==='allied'&&b.type==='hq')hqB=b;});
                prodUI.selectBuilding(hqB);
            }
            _centerCameraOnAlliedBase();
        }

        // BUG 2 FIX — ability shortcuts for selected squads
        if (prodUI && !prodUI.selectedBuilding && prodUI.selectedSquads && prodUI.selectedSquads.length > 0) {
            var sq = prodUI.selectedSquads[0];
            if (sq && sq.abilities) {
                var defs = RTS.Game.Squad.ABILITY_DEFS;
                Object.keys(sq.abilities).forEach(function(id) {
                    var def = defs[id];
                    if (def && e.key.toUpperCase() === def.key) {
                        consumeForCamera = true;
                        sq.activateAbility(id, squads);
                    }
                });
            }
        }

        // Meta gameplay shortcuts: tiers / doctrine / call-ins (HQ selection)
        if (prodUI && prodUI.selectedBuilding && prodUI.selectedBuilding.type === 'hq') {
            var uKey = String(e.key || '').toUpperCase();
            if (uKey === '1' || uKey === '2' || uKey === '3') {
                if (_tryStartHQUpgradeByKey(uKey)) {
                    consumeForCamera = true;
                    e.preventDefault();
                }
            }
            if (uKey === 'Z' || uKey === 'X' || uKey === 'C') {
                if (_trySelectDoctrineByKey(uKey)) {
                    consumeForCamera = true;
                    e.preventDefault();
                }
            }
            if (uKey === 'Y' || uKey === 'U') {
                if (_tryDoctrineCallinByKey(uKey)) {
                    consumeForCamera = true;
                    e.preventDefault();
                }
            }
        }

        // Raccourcis production / construction
        if (prodUI&&prodUI.visible&&prodUI.selectedBuilding) {
            var btn=prodUI.handleKey(e.key);
            if (btn) {
                consumeForCamera = true;
                if      (btn.action==='produce'  &&btn.canAfford) _tryProduce(btn.prod, e.shiftKey ? 5 : 1);
                else if (btn.action==='construct'&&btn.canAfford&&btn.canBuild) _startBuildMode(btn.cons);
            }
        }

        if (consumeForCamera && _isCameraMoveKey(e.key)) {
            keys[e.key]=false;
            keys[e.code]=false;
            e.preventDefault();
        }

        if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].indexOf(e.key)!==-1) e.preventDefault();
    });

    document.addEventListener('keyup', function(e) { keys[e.key]=false; keys[e.code]=false; });

    window.addEventListener('resize', function() {
        canvas.width=window.innerWidth; canvas.height=window.innerHeight;
        if (camera){camera.viewWidth=canvas.width;camera.viewHeight=canvas.height;}
    });
};
