// Système de gestion des lieux
const WorldManager = {
    currentLocation: 'neighborhood',
    locations: {},
    
    init() {
        this.setupLocations();
    },
    
    setupLocations() {
        // Quartier (extérieur) - BEAUCOUP PLUS GRAND
        this.locations.neighborhood = {
            type: 'outdoor',
            name: 'Quartier résidentiel',
            width: 2400,  // 3x plus large
            height: 1800, // 3x plus haut
            background: 'linear-gradient(to bottom, #87CEEB 0%, #98D8C8 100%)',
            objects: [],
            buildings: []
        };
        
        // Maison du joueur
        this.locations.player_house = {
            type: 'indoor',
            name: 'Maison d\'Alex',
            width: 800,
            height: 600,
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            owner: 'P',
            objects: [],
            exitPoint: { x: 400, y: 550 }
        };
        
        // Maison de Sophie
        this.locations.sophie_house = {
            type: 'indoor',
            name: 'Maison de Sophie',
            width: 800,
            height: 600,
            background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
            owner: 'N1',
            objects: [],
            exitPoint: { x: 400, y: 550 },
            locked: true // Le joueur ne peut pas y entrer
        };
        
        // Maison de Marc
        this.locations.marc_house = {
            type: 'indoor',
            name: 'Maison de Marc',
            width: 800,
            height: 600,
            background: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
            owner: 'N2',
            objects: [],
            exitPoint: { x: 400, y: 550 },
            locked: true
        };
    },
    
    changeLocation(newLocation, character) {
        const oldLoc = this.locations[this.currentLocation];
        const newLoc = this.locations[newLocation];
        
        if (!newLoc) {
            console.error('Location inconnue:', newLocation);
            return false;
        }
        
        // Vérifie si la location est verrouillée
        if (newLoc.locked && character.id === 'P') {
            console.log('Cette maison est verrouillée');
            this.showMessage('🔒 Cette maison est privée');
            return false;
        }
        
        // IMPORTANT: Si c'est un NPC qui change de location, 
        // ne change la location globale QUE si le joueur n'est pas présent
        if (character.id !== 'P') {
            // NPC change de location silencieusement (pour lui seul)
            character.currentLocation = newLocation;
            
            // Cache le NPC s'il n'est pas dans la même location que le joueur
            if (newLocation !== this.currentLocation) {
                character.el.style.display = 'none';
            } else {
                character.el.style.display = 'block';
            }
            
            console.log(character.name, 'est maintenant dans:', newLocation);
            return true;
        }
        
        // C'est le JOUEUR qui change - on change la location globale
        // Sauvegarde la position actuelle
        character.lastLocation = this.currentLocation;
        
        // Change le monde
        this.currentLocation = newLocation;
        
        // Update le background
        const world = document.getElementById('world');
        if (world) {
            world.style.background = newLoc.background;
            world.style.width = newLoc.width + 'px';
            world.style.height = newLoc.height + 'px';
        }
        
        // Repositionne le personnage
        if (newLoc.type === 'indoor') {
            // Entre dans la maison
            character.x = newLoc.exitPoint.x;
            character.y = newLoc.exitPoint.y - 50;
        } else {
            // Sort de la maison
            const building = oldLoc.building;
            if (building) {
                character.x = building.doorX;
                character.y = building.doorY + 60;
            }
        }
        
        // Cache/Montre les objets selon la location
        this.updateVisibleObjects();
        
        // Montre uniquement les personnages dans cette location
        this.updateVisibleCharacters();
        
        // Update l'UI
        this.updateLocationUI();
        
        console.log('Location changée:', this.currentLocation);
        return true;
    },
    
    updateVisibleCharacters() {
        // Montre/cache les personnages selon leur location
        if (typeof chars !== 'undefined') {
            chars.forEach(char => {
                const charLoc = char.currentLocation || this.currentLocation;
                if (charLoc === this.currentLocation) {
                    char.el.style.display = 'block';
                } else {
                    char.el.style.display = 'none';
                }
            });
        }
    },
    
    updateVisibleObjects() {
        const currentLoc = this.locations[this.currentLocation];
        
        // Cache tous les objets
        WorldObjects.objects.forEach(obj => {
            obj.el.style.display = 'none';
        });
        
        // Montre uniquement les objets de la location actuelle
        WorldObjects.objects.forEach(obj => {
            if (obj.location === this.currentLocation) {
                obj.el.style.display = 'flex';
            }
        });
        
        // Gère les buildings/portes
        if (currentLoc.type === 'outdoor') {
            // Affiche les buildings
            currentLoc.buildings.forEach(b => {
                if (b.el) b.el.style.display = 'block';
            });
        } else {
            // Cache tous les buildings
            Object.values(this.locations).forEach(loc => {
                if (loc.buildings) {
                    loc.buildings.forEach(b => {
                        if (b.el) b.el.style.display = 'none';
                    });
                }
            });
        }
    },
    
    updateLocationUI() {
        const loc = this.locations[this.currentLocation];
        const display = document.getElementById('location-display');
        if (display) {
            display.textContent = `📍 ${loc.name}`;
        }
    },
    
    showMessage(text) {
        const msg = document.createElement('div');
        msg.className = 'location-message';
        msg.textContent = text;
        document.body.appendChild(msg);
        setTimeout(() => msg.remove(), 2000);
    },
    
    getCurrentLocation() {
        return this.locations[this.currentLocation];
    },
    
    isOutdoor() {
        return this.locations[this.currentLocation].type === 'outdoor';
    },
    
    isInPlayerHouse() {
        return this.currentLocation === 'player_house';
    }
};

// Classe Building (maison dans le quartier)
function Building(id, x, y, linkedLocation, config = {}) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.linkedLocation = linkedLocation;
    this.width = config.width || 120;
    this.height = config.height || 100;
    this.doorX = x + this.width / 2;
    this.doorY = y + this.height;
    this.color = config.color || '#8B4513';
    this.roofColor = config.roofColor || '#654321';
    this.name = config.name || 'Maison';
    this.locked = config.locked || false;
    
    this.createDOM();
}

Building.prototype.createDOM = function() {
    this.el = document.createElement('div');
    this.el.className = 'building';
    this.el.style.left = this.x + 'px';
    this.el.style.top = this.y + 'px';
    this.el.style.width = this.width + 'px';
    this.el.style.height = this.height + 'px';
    
    this.el.innerHTML = `
        <div class="building-roof" style="background: ${this.roofColor}"></div>
        <div class="building-body" style="background: ${this.color}">
            <div class="building-door">${this.locked ? '🔒' : '🚪'}</div>
            <div class="building-window">🪟</div>
            <div class="building-window">🪟</div>
        </div>
        <div class="building-name">${this.name}</div>
    `;
    
    // Ajoute au monde
    const world = document.getElementById('world');
    if (world) {
        world.appendChild(this.el);
    }
    
    // Event de clic pour entrer
    this.el.addEventListener('click', () => {
        if (this.canEnter(player)) {
            this.enter(player);
        }
    });
};

Building.prototype.canEnter = function(character) {
    if (character.isDead) return false;
    if (this.locked) return false;
    
    const dist = Math.hypot(character.x - this.doorX, character.y - this.doorY);
    return dist < 80;
};

Building.prototype.enter = function(character) {
    console.log('Entrée dans:', this.name);
    
    // Sauvegarde la référence du building dans la location
    const targetLoc = WorldManager.locations[this.linkedLocation];
    if (targetLoc) {
        targetLoc.building = this;
    }
    
    WorldManager.changeLocation(this.linkedLocation, character);
};

// Fonction pour créer une porte de sortie dans une maison
function createExitDoor(location) {
    const loc = WorldManager.locations[location];
    if (!loc || !loc.exitPoint) return;
    
    const door = new WorldObject('exit_' + location, loc.exitPoint.x - 20, loc.exitPoint.y - 50, 'door', {
        icon: '🚪',
        width: 40,
        height: 60,
        interactions: [
            {
                type: 'exit',
                label: 'Sortir'
            }
        ]
    });
    
    door.location = location;
    
    // Override la méthode use pour gérer la sortie
    const originalUse = door.use.bind(door);
    door.use = function(character, interactionType) {
        if (interactionType === 'exit') {
            WorldManager.changeLocation('neighborhood', character);
            return true;
        }
        return originalUse(character, interactionType);
    };
    
    WorldObjects.add(door);
}