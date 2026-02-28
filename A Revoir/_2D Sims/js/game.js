// Variables globales
let player, npc1, npc2, chars;

// Setup du quartier avec les maisons
function setupNeighborhood() {
    // Zone rÃ©sidentielle Nord-Ouest
    const playerBuilding = new Building('player_building', 300, 400, 'player_house', {
        name: 'ðŸ  Maison d\'Alex',
        color: '#4a9eff',
        roofColor: '#3a7fbf',
        locked: false
    });
    
    const sophieBuilding = new Building('sophie_building', 800, 350, 'sophie_house', {
        name: 'ðŸ  Maison de Sophie',
        color: '#ff6b9d',
        roofColor: '#cc5580',
        locked: true
    });
    
    const marcBuilding = new Building('marc_building', 1300, 450, 'marc_house', {
        name: 'ðŸ  Maison de Marc',
        color: '#ffa500',
        roofColor: '#cc8400',
        locked: true
    });
    
    // Maisons supplÃ©mentaires (NPCs invisibles)
    const house4 = new Building('house4', 600, 800, null, {
        name: 'ðŸ  Maison',
        color: '#9b59b6',
        roofColor: '#7d3c98',
        locked: true
    });
    
    const house5 = new Building('house5', 1100, 850, null, {
        name: 'ðŸ  Maison',
        color: '#e74c3c',
        roofColor: '#c0392b',
        locked: true
    });
    
    const house6 = new Building('house6', 1600, 700, null, {
        name: 'ðŸ  Maison',
        color: '#1abc9c',
        roofColor: '#16a085',
        locked: true
    });
    
    const house7 = new Building('house7', 400, 1200, null, {
        name: 'ðŸ  Maison',
        color: '#f39c12',
        roofColor: '#d68910',
        locked: true
    });
    
    const house8 = new Building('house8', 1800, 1100, null, {
        name: 'ðŸ  Maison',
        color: '#3498db',
        roofColor: '#2980b9',
        locked: true
    });
    
    WorldManager.locations.neighborhood.buildings = [
        playerBuilding,
        sophieBuilding,
        marcBuilding,
        house4,
        house5,
        house6,
        house7,
        house8
    ];
    
    // Ajoute des Ã©lÃ©ments dÃ©coratifs partout dans le monde
    createOutdoorDecoration();
}

function createOutdoorDecoration() {
    const world = document.getElementById('world');
    if (!world) return;
    
    // Arbres (beaucoup plus)
    const treePositions = [
        // Zone Nord
        {x: 150, y: 200}, {x: 500, y: 150}, {x: 950, y: 180}, {x: 1400, y: 220},
        {x: 1850, y: 170}, {x: 2100, y: 250},
        // Zone Centre
        {x: 250, y: 600}, {x: 700, y: 550}, {x: 1200, y: 620}, {x: 1700, y: 580},
        {x: 2000, y: 650}, {x: 450, y: 700},
        // Zone Sud
        {x: 300, y: 1400}, {x: 800, y: 1350}, {x: 1300, y: 1450}, {x: 1800, y: 1380},
        {x: 600, y: 1500}, {x: 1100, y: 1520}, {x: 1600, y: 1480},
        // Zones intermÃ©diaires
        {x: 350, y: 950}, {x: 850, y: 1000}, {x: 1350, y: 980}, {x: 1850, y: 1050}
    ];
    
    treePositions.forEach(pos => {
        const tree = document.createElement('div');
        tree.className = 'decoration tree';
        tree.textContent = 'ðŸŒ³';
        tree.style.left = pos.x + 'px';
        tree.style.top = pos.y + 'px';
        tree.style.position = 'absolute';
        tree.style.fontSize = '40px';
        tree.style.pointerEvents = 'none';
        tree.style.zIndex = '1';
        world.appendChild(tree);
    });
    
    // Bancs publics
    const benchPositions = [
        {x: 600, y: 900, label: 'ðŸª‘ Banc public'},
        {x: 1400, y: 600, label: 'ðŸª‘ Banc public'},
        {x: 900, y: 1200, label: 'ðŸª‘ Aire de repos'}
    ];
    
    benchPositions.forEach(pos => {
        const bench = document.createElement('div');
        bench.className = 'decoration bench';
        bench.textContent = pos.label;
        bench.style.left = pos.x + 'px';
        bench.style.top = pos.y + 'px';
        bench.style.position = 'absolute';
        bench.style.fontSize = '16px';
        bench.style.background = 'rgba(139, 69, 19, 0.3)';
        bench.style.padding = '10px';
        bench.style.borderRadius = '5px';
        bench.style.pointerEvents = 'none';
        bench.style.border = '2px solid rgba(139, 69, 19, 0.5)';
        world.appendChild(bench);
    });
    
    // Fontaines
    const fountains = [
        {x: 1000, y: 750, label: 'â›² Fontaine'},
        {x: 500, y: 1100, label: 'â›² Fontaine'}
    ];
    
    fountains.forEach(pos => {
        const fountain = document.createElement('div');
        fountain.className = 'decoration fountain';
        fountain.textContent = pos.label;
        fountain.style.left = pos.x + 'px';
        fountain.style.top = pos.y + 'px';
        fountain.style.position = 'absolute';
        fountain.style.fontSize = '24px';
        fountain.style.background = 'rgba(100, 149, 237, 0.3)';
        fountain.style.padding = '15px';
        fountain.style.borderRadius = '50%';
        fountain.style.pointerEvents = 'none';
        fountain.style.border = '3px solid rgba(100, 149, 237, 0.6)';
        world.appendChild(fountain);
    });
    
    // Routes/Chemins (visuels)
    const paths = [
        // Route horizontale principale
        {x: 0, y: 500, w: 2400, h: 60, color: '#7a7a7a'},
        // Route verticale
        {x: 1000, y: 0, w: 60, h: 1800, color: '#7a7a7a'}
    ];
    
    paths.forEach(path => {
        const road = document.createElement('div');
        road.className = 'decoration road';
        road.style.left = path.x + 'px';
        road.style.top = path.y + 'px';
        road.style.width = path.w + 'px';
        road.style.height = path.h + 'px';
        road.style.position = 'absolute';
        road.style.background = path.color;
        road.style.opacity = '0.3';
        road.style.pointerEvents = 'none';
        road.style.zIndex = '0';
        world.appendChild(road);
    });
    
    // Fleurs alÃ©atoires
    for (let i = 0; i < 30; i++) {
        const flower = document.createElement('div');
        flower.className = 'decoration flower';
        flower.textContent = ['ðŸŒ¸', 'ðŸŒº', 'ðŸŒ»', 'ðŸŒ·'][Math.floor(Math.random() * 4)];
        flower.style.left = (Math.random() * 2200 + 100) + 'px';
        flower.style.top = (Math.random() * 1600 + 100) + 'px';
        flower.style.position = 'absolute';
        flower.style.fontSize = '20px';
        flower.style.pointerEvents = 'none';
        flower.style.zIndex = '1';
        world.appendChild(flower);
    }
}

// Setup de la maison du joueur (intÃ©rieur)
function setupPlayerHouse() {
    const location = 'player_house';
    
    // Chambre
    WorldObjects.add(createObjectWithLocation(
        ObjectFactory.createBed(50, 50, 'player_bed1'), location
    ));
    WorldObjects.add(createObjectWithLocation(
        ObjectFactory.createBookshelf(130, 50, 'player_bookshelf1'), location
    ));
    
    // Salle de bain
    WorldObjects.add(createObjectWithLocation(
        ObjectFactory.createToilet(200, 50, 'player_toilet'), location
    ));
    WorldObjects.add(createObjectWithLocation(
        ObjectFactory.createShower(250, 50, 'player_shower'), location
    ));
    
    // Cuisine
    WorldObjects.add(createObjectWithLocation(
        ObjectFactory.createFridge(350, 100, 'player_fridge'), location
    ));
    WorldObjects.add(createObjectWithLocation(
        ObjectFactory.createStove(420, 100, 'player_stove'), location
    ));
    
    // Salon
    WorldObjects.add(createObjectWithLocation(
        ObjectFactory.createCouch(100, 350, 'player_couch'), location
    ));
    WorldObjects.add(createObjectWithLocation(
        ObjectFactory.createTV(100, 270, 'player_tv'), location
    ));
    
    // Bureau
    WorldObjects.add(createObjectWithLocation(
        ObjectFactory.createComputer(550, 250, 'player_computer'), location
    ));
    
    // Porte de sortie
    createExitDoor(location);
}

// Setup des maisons des NPCs (ils y vivent mais le joueur ne peut pas entrer)
function setupNPCHouses() {
    // Maison de Sophie
    setupNPCHouse('sophie_house', 'N1');
    
    // Maison de Marc
    setupNPCHouse('marc_house', 'N2');
}

function setupNPCHouse(location, npcId) {
    // Meubles basiques pour que le NPC puisse satisfaire ses besoins
    WorldObjects.add(createObjectWithLocation(
        ObjectFactory.createBed(50, 50, location + '_bed'), location
    ));
    WorldObjects.add(createObjectWithLocation(
        ObjectFactory.createFridge(200, 100, location + '_fridge'), location
    ));
    WorldObjects.add(createObjectWithLocation(
        ObjectFactory.createToilet(350, 50, location + '_toilet'), location
    ));
    WorldObjects.add(createObjectWithLocation(
        ObjectFactory.createShower(400, 50, location + '_shower'), location
    ));
    WorldObjects.add(createObjectWithLocation(
        ObjectFactory.createCouch(100, 300, location + '_couch'), location
    ));
    WorldObjects.add(createObjectWithLocation(
        ObjectFactory.createTV(100, 220, location + '_tv'), location
    ));
    WorldObjects.add(createObjectWithLocation(
        ObjectFactory.createComputer(500, 200, location + '_computer'), location
    ));
    
    // Porte de sortie pour le NPC
    createExitDoor(location);
}

function createObjectWithLocation(obj, location) {
    obj.location = location;
    return obj;
}

// Ancienne fonction setupHouse supprimÃ©e

// Variables de contrÃ´le
let gameSpeed = 1;
let isPaused = false;
let selectedObject = null;
let showDebug = false;
let frameCount = 0;
const UI_UPDATE_INTERVAL = 5;
const MINIMAP_UPDATE_INTERVAL = 2;

function setGameSpeed(speed) {
    const normalized = Math.max(1, Math.min(3, Number(speed) || 1));
    gameSpeed = normalized;

    const speedButtons = document.querySelectorAll('.speed-btn');
    speedButtons.forEach((button) => {
        const isActive = Number(button.dataset.speed) === normalized;
        button.classList.toggle('active', isActive);
    });
}

function setPauseState(nextValue) {
    isPaused = Boolean(nextValue);

    const pauseButton = document.getElementById('pause-btn');
    if (pauseButton) {
        pauseButton.classList.toggle('active', isPaused);
        pauseButton.textContent = isPaused ? 'Reprendre' : 'Pause';
    }
}

function togglePause() {
    setPauseState(!isPaused);
}

function initGameControls() {
    const pauseButton = document.getElementById('pause-btn');
    if (pauseButton) {
        pauseButton.addEventListener('click', togglePause);
    }

    const speedButtons = document.querySelectorAll('.speed-btn');
    speedButtons.forEach((button) => {
        button.addEventListener('click', () => {
            setGameSpeed(button.dataset.speed);
        });
    });

    const quickActionButtons = document.querySelectorAll('.quick-action-btn');
    quickActionButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const action = button.dataset.action;
            if (action) {
                quickAction(action);
            }
        });
    });

    setGameSpeed(1);
    setPauseState(false);
}

window.onGameHotkey = function (key) {
    if (key === 'p' || key === 'P') {
        togglePause();
        return;
    }

    if (key === '1' || key === '2' || key === '3') {
        setGameSpeed(Number(key));
        return;
    }

    if (key === '0') {
        if (typeof Input !== 'undefined') {
            Input.debug = !Input.debug;
            showDebug = Input.debug;
        } else {
            showDebug = !showDebug;
        }
    }
};

function showObjectMenu(obj) {
    // Affiche un menu d'interactions
    const menu = document.getElementById('interaction-menu');
    if (!menu) {
        console.error('Menu interaction non trouvÃ©');
        return;
    }
    
    menu.innerHTML = `<h4>${obj.icon} ${obj.type}</h4>`;
    
    if (obj.interactions.length === 0) {
        menu.innerHTML += '<p>Aucune interaction disponible</p>';
    }
    
    obj.interactions.forEach(interaction => {
        const btn = document.createElement('button');
        btn.textContent = interaction.type;
        btn.onclick = () => {
            console.log('Interaction:', interaction.type, 'sur', obj.type);
            obj.use(player, interaction.type);
            menu.style.display = 'none';
        };
        menu.appendChild(btn);
    });
    
    // Bouton fermer
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'âœ– Fermer';
    closeBtn.style.marginTop = '5px';
    closeBtn.onclick = () => {
        menu.style.display = 'none';
    };
    menu.appendChild(closeBtn);
    
    menu.style.display = 'block';
    menu.style.left = obj.x + 'px';
    menu.style.top = (obj.y - 100) + 'px';
    
    console.log('Menu affichÃ© pour:', obj.type, 'avec', obj.interactions.length, 'interactions');
}

// Attendre que le DOM soit prÃªt avant d'initialiser
document.addEventListener('DOMContentLoaded', function() {
    initGameControls();
    console.log('ðŸŽ® Initialisation du jeu...');
    
    // CrÃ©ation des personnages avec traits et aspirations
player = new Character('P', 100, 100, 'player', {
    name: 'Alex',
    age: 25, // â­ AJOUTER
    traits: ['outgoing', 'creative'],
    money: 500,
    aspiration: new Aspiration('creativity'),
    autonomous: false
});
    player.currentLocation = 'neighborhood';

npc1 = new Character('N1', 300, 150, 'npc', {
    name: 'Sophie',
    age: 28, // â­ AJOUTER
    traits: ['neat', 'bookworm'],
    money: 300,
    aspiration: new Aspiration('knowledge'),
    autonomous: true
});
    npc1.currentLocation = 'neighborhood';

npc2 = new Character('N2', 500, 200, 'npc', {
    name: 'Marc',
    age: 22, // â­ AJOUTER
    traits: ['lazy', 'foodie'],
    money: 200,
    aspiration: new Aspiration('fortune'),
    autonomous: true
});
    npc2.currentLocation = 'neighborhood';

    // Relations initiales
    player.relations['N1'] = new Relationship('N1');
    player.relations['N1'].modify(30, 20);
    player.relations['N2'] = new Relationship('N2');
    player.relations['N2'].modify(10, 10);

    npc1.relations['P'] = new Relationship('P');
    npc1.relations['P'].modify(40, 30);
    npc1.relations['N2'] = new Relationship('N2');
    npc1.relations['N2'].modify(20, 15);

    npc2.relations['P'] = new Relationship('P');
    npc2.relations['P'].modify(15, 10);
    npc2.relations['N1'] = new Relationship('N1');
    npc2.relations['N1'].modify(25, 20);

    chars = [player, npc1, npc2];
    
    // Initialise le gestionnaire de monde
    WorldManager.init();
    
    // Initialise la camÃ©ra et la mini-map
    Camera.init();
    MiniMap.init();
    
    // Setup du quartier (extÃ©rieur)
    setupNeighborhood();
    
    // Setup de la maison du joueur
    setupPlayerHouse();
    
    // Setup des maisons des NPCs
    setupNPCHouses();
    
    // DÃ©marre dans le quartier
    WorldManager.changeLocation('neighborhood', player);
    
    // Gestion du clic sur les objets
    document.getElementById('world').addEventListener('click', (event) => {
        const targetObjectEl = event.target.classList.contains('world-object')
            ? event.target
            : event.target.closest('.world-object');
        const interactionMenu = document.getElementById('interaction-menu');

        if (!targetObjectEl) {
            if (interactionMenu) interactionMenu.style.display = 'none';
            return;
        }

        const targetObject = WorldObjects.objects.find((obj) => obj.el === targetObjectEl);
        if (!targetObject) return;

        if (targetObject.canInteract(player)) {
            showObjectMenu(targetObject);
            return;
        }

        if (interactionMenu) interactionMenu.style.display = 'none';
    });
// DÃ©marrage
    console.log('ðŸŽ® Sims 2D - Jeu dÃ©marrÃ©!');
    console.log('ContrÃ´les: FlÃ¨ches/ZQSD = Bouger, Espace = Interagir, R = Reposer, P = Pause');
    console.log('Vitesse: 1/2/3, Debug: 0');
    
    loop();
});

// Game Loop Principal
function loop() {
    if (!isPaused) {
        const simulationSteps = Math.max(1, Math.floor(gameSpeed));

        for (let step = 0; step < simulationSteps; step++) {
            frameCount++;
            updateAllSystems();

            if (!player.isDead && !player.ai) {
                const movement = Input.getMovementVector();
                if (movement.dx !== 0 || movement.dy !== 0) {
                    move(player, movement.dx, movement.dy, 2);
                }
            }

            chars.forEach(c => {
                c.update(frameCount);
                checkDeath(c);
            });

            for (let i = 0; i < chars.length; i++) {
                for (let j = i + 1; j < chars.length; j++) {
                    if (!chars[i].isDead && !chars[j].isDead) {
                        checkInteraction(chars[i], chars[j]);
                    }
                }
            }

            Consequences.process(chars);
        }

        if (WorldManager.isOutdoor()) {
            Camera.follow(player);
        }

        Input.clearFrame();
    }

    if (frameCount % UI_UPDATE_INTERVAL === 0 || isPaused) {
        updateUI();
    }

    if (WorldManager.isOutdoor() && frameCount % MINIMAP_UPDATE_INTERVAL === 0) {
        MiniMap.update();
    }

    requestAnimationFrame(loop);
}
function checkDeath(c) {
    if (c.isDead) return;
    
    // â­ NOUVEAU : VÃ©rifier mort naturelle d'abord
    const naturalDeath = Aging.checkNaturalDeath(c.id);
    if (naturalDeath) {
        handleDeath(c, 'old_age');
        return;
    }
    
    // VÃ©rifier mort par besoins (code existant)
    if (c.needs.energy <= 0) {
        handleDeath(c, 'starvation'); // â­ Utiliser handleDeath au lieu du code direct
    }
}

// Actions rapides
function quickAction(action) {
    if (!player || player.isDead) return;

    switch(action) {
        case 'eat':
            player.needs.eat();
            break;
        case 'drink':
            player.needs.drink();
            break;
        case 'sleep':
            player.needs.sleep(8);
            break;
        case 'toilet':
            player.needs.useToilet();
            break;
        case 'shower':
            player.needs.shower();
            break;
        case 'socialize':
            player.needs.socialize();
            break;
        case 'fun':
            player.needs.haveFun();
            break;
    }

    // Immediate UI feedback after quick action.
    updateUI();
}

// Fonctions utilitaires
function getAllCharacterInfo() {
    return chars.map(c => ({
        name: c.name,
        mood: c.needs.mood,
        money: c.money,
        action: c.ai ? c.ai.getDebugInfo().currentAction : 'manual'
    }));
}

function addMoney(characterId, amount) {
    const char = chars.find(c => c.id === characterId);
    if (char) {
        char.money += amount;
    }
}

// ========== FONCTIONS POUR TESTER LES NOUVEAUX SYSTÃˆMES ==========

// Tester le mariage entre deux personnages
window.testMarriage = function() {
    if (chars.length >= 2) {
        const char1 = chars[0];
        const char2 = chars[1];
        
        // S'assurer qu'ils ont une bonne relation
        if (!char1.relations[char2.id]) {
            char1.relations[char2.id] = new Relationship(char2.id);
            char1.relations[char2.id].modify(60, 50);
        }
        if (!char2.relations[char1.id]) {
            char2.relations[char1.id] = new Relationship(char1.id);
            char2.relations[char1.id].modify(60, 50);
        }
        
        handleMarriage(char1, char2);
        console.log(`ðŸ’’ ${char1.name} et ${char2.name} se sont mariÃ©s!`);
    }
};

// Tester la naissance
window.testBirth = function() {
    if (chars.length >= 2) {
        const parent1 = chars[0];
        const parent2 = chars[1];
        
        const babyId = 'baby_' + Date.now();
        const baby = new Character(babyId, parent1.x + 30, parent1.y, 'npc', {
            name: 'BÃ©bÃ©',
            age: 0,
            money: 0,
            autonomous: false
        });
        baby.currentLocation = parent1.currentLocation;
        chars.push(baby);
        
        handleBirth(parent1, parent2, baby.id);
        console.log(`ðŸ‘¶ ${parent1.name} et ${parent2.name} ont eu un bÃ©bÃ©!`);
    }
};

// Voir les infos complÃ¨tes d'un personnage
window.showCharInfo = function(index = 0) {
    const char = chars[index];
    if (!char) return;
    
    const summary = getCharacterSummary(char.id);
    console.log('â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”');
    console.log(`ðŸ‘¤ ${char.name}`);
    console.log('â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”');
    console.log(`ðŸ“… Ã‚ge: ${summary.age} ans (${summary.stage})`);
    console.log(`â­ RÃ©putation: ${summary.socialClass}`);
    console.log(`ðŸ’­ Ã‰tat social: ${summary.socialStatus}`);
    console.log(`ðŸ“‹ ActivitÃ©: ${summary.currentActivity ? summary.currentActivity.activity : 'Aucune'}`);
    console.log(`ðŸ§  Souvenirs: ${summary.memoryCount}`);
    console.log(`ðŸ‘¨â€ðŸ‘©â€ðŸ‘§ Famille: ${summary.family || 'Aucune'}`);
    console.log(`âš”ï¸ Rivaux: ${summary.rivals}`);
    console.log('â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”');
    
    return summary;
};

// Vieillir un personnage rapidement
window.ageCharacter = function(index = 0, years = 5) {
    const char = chars[index];
    if (!char) return;
    
    const data = Aging.characters[char.id];
    if (data) {
        data.age += years;
        console.log(`â° ${char.name} a maintenant ${Math.floor(data.age)} ans`);
    }
};

// Voir les relations d'un personnage
window.showRelations = function(index = 0) {
    const char = chars[index];
    if (!char) return;
    
    console.log(`â”â”â” Relations de ${char.name} â”â”â”`);
    Object.values(char.relations).forEach(rel => {
        const other = chars.find(c => c.id === rel.targetId);
        if (other && !other.isDead) {
            const status = rel.affection > 70 ? 'ðŸ’š Ami' : rel.affection > 40 ? 'ðŸ’› Connaissance' : 'ðŸ’” Ennemi';
            console.log(`${other.name}: ${Math.floor(rel.affection)}/100 ${status}`);
        }
    });
};

// Info sur la saison actuelle
window.showSeason = function() {
    const info = Season.getInfo();
    console.log('â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”');
    console.log(`ðŸŒ¸ Saison: ${info.season}`);
    console.log(`ðŸ“… Jour: ${info.day}/${info.totalDays}`);
    console.log(`ðŸŒ¤ï¸ MÃ©tÃ©o: ${info.weather}`);
    console.log(`ðŸŒ¡ï¸ TempÃ©rature: ${info.temperature}Â°C`);
    console.log(`ðŸ˜Š Effet humeur: ${info.moodEffect > 0 ? '+' : ''}${info.moodEffect}`);
    console.log('â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”');
};

// CrÃ©er une rivalitÃ©
window.createRivalry = function(index1 = 0, index2 = 1) {
    const char1 = chars[index1];
    const char2 = chars[index2];
    
    if (char1 && char2) {
        Jealousy.createRivalry(char1.id, char2.id, 'test_rivalry', 'personal');
        console.log(`âš”ï¸ RivalitÃ© crÃ©Ã©e entre ${char1.name} et ${char2.name}`);
    }
};


