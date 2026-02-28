function WorldObject(id, x, y, type, config = {}) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.type = type;
    this.inUse = false;
    this.user = null;
    this.config = config;
    
    // Propriétés visuelles
    this.width = config.width || 40;
    this.height = config.height || 40;
    this.icon = config.icon || '📦';
    
    // Propriétés d'interaction
    this.interactions = config.interactions || [];
    this.capacity = config.capacity || 1; // Nombre d'utilisateurs simultanés
    this.duration = config.duration || 0; // Durée d'utilisation (0 = instantané)
    
    this.createDOM();
}

WorldObject.prototype.createDOM = function() {
    this.el = document.createElement('div');
    this.el.className = 'world-object ' + this.type;
    this.el.style.left = this.x + 'px';
    this.el.style.top = this.y + 'px';
    this.el.style.width = this.width + 'px';
    this.el.style.height = this.height + 'px';
    this.el.innerHTML = `<span class="object-icon">${this.icon}</span>`;
    
    const world = document.getElementById('world');
    if (world) {
        world.appendChild(this.el);
    } else {
        console.error('Element #world not found. Make sure DOM is ready.');
    }
};

WorldObject.prototype.canInteract = function(character) {
    if (character.isDead) return false;
    if (this.inUse && this.capacity <= 1) return false;
    
    const dist = Math.hypot(character.x - this.x, character.y - this.y);
    return dist < 150; // Distance augmentée pour interaction plus facile
};

WorldObject.prototype.use = function(character, interactionType) {
    if (!this.canInteract(character)) return false;
    
    this.inUse = true;
    this.user = character.id;
    this.el.classList.add('in-use');
    
    const interaction = this.interactions.find(i => i.type === interactionType);
    if (!interaction) return false;
    
    // Applique les effets
    if (interaction.needs) {
        Object.keys(interaction.needs).forEach(need => {
            if (character.needs[need] !== undefined) {
                character.needs[need] = Math.max(0, Math.min(100, 
                    character.needs[need] + interaction.needs[need]
                ));
            }
        });
    }
    
    // Durée d'utilisation
    if (this.duration > 0) {
        setTimeout(() => this.release(character), this.duration);
    } else {
        this.release(character);
    }
    
    // Événement
    Consequences.add({
        type: 'object_interaction',
        actor: character.id,
        object: this.id,
        interaction: interactionType
    });
    
    return true;
};

WorldObject.prototype.release = function(character) {
    this.inUse = false;
    this.user = null;
    this.el.classList.remove('in-use');
};

// Factory pour créer différents types d'objets
const ObjectFactory = {
    createBed(x, y, id) {
        return new WorldObject(id || 'bed_' + Date.now(), x, y, 'bed', {
            icon: '🛏️',
            width: 60,
            height: 40,
            interactions: [
                {
                    type: 'sleep',
                    needs: { fatigue: -80, energy: 50 },
                    duration: 3000
                },
                {
                    type: 'nap',
                    needs: { fatigue: -30, energy: 20 },
                    duration: 1500
                }
            ]
        });
    },
    
    createFridge(x, y, id) {
        return new WorldObject(id || 'fridge_' + Date.now(), x, y, 'fridge', {
            icon: '🧊',
            width: 40,
            height: 50,
            interactions: [
                {
                    type: 'eat',
                    needs: { hunger: -60, energy: 15 }
                },
                {
                    type: 'drink',
                    needs: { thirst: -70, energy: 10 }
                },
                {
                    type: 'snack',
                    needs: { hunger: -20, energy: 5 }
                }
            ]
        });
    },
    
    createCouch(x, y, id) {
        return new WorldObject(id || 'couch_' + Date.now(), x, y, 'couch', {
            icon: '🛋️',
            width: 80,
            height: 40,
            capacity: 2,
            interactions: [
                {
                    type: 'relax',
                    needs: { fatigue: -20, energy: 10, happiness: 10 }
                },
                {
                    type: 'watch_tv',
                    needs: { happiness: 20, energy: -5 },
                    duration: 2000
                }
            ]
        });
    },
    
    createToilet(x, y, id) {
        return new WorldObject(id || 'toilet_' + Date.now(), x, y, 'toilet', {
            icon: '🚽',
            width: 30,
            height: 30,
            interactions: [
                {
                    type: 'use',
                    needs: { bladder: -100 },
                    duration: 1000
                }
            ]
        });
    },
    
    createShower(x, y, id) {
        return new WorldObject(id || 'shower_' + Date.now(), x, y, 'shower', {
            icon: '🚿',
            width: 40,
            height: 40,
            interactions: [
                {
                    type: 'shower',
                    needs: { hygiene: 100, energy: -10 },
                    duration: 2500
                }
            ]
        });
    },
    
    createComputer(x, y, id) {
        return new WorldObject(id || 'computer_' + Date.now(), x, y, 'computer', {
            icon: '💻',
            width: 40,
            height: 30,
            interactions: [
                {
                    type: 'work',
                    needs: { energy: -20, happiness: -10 },
                    duration: 3000,
                    money: 50
                },
                {
                    type: 'play',
                    needs: { happiness: 30, energy: -5 },
                    duration: 2000
                },
                {
                    type: 'social',
                    needs: { social: 20, happiness: 10 },
                    duration: 1500
                }
            ]
        });
    },
    
    createTV(x, y, id) {
        return new WorldObject(id || 'tv_' + Date.now(), x, y, 'tv', {
            icon: '📺',
            width: 60,
            height: 40,
            capacity: 3,
            interactions: [
                {
                    type: 'watch',
                    needs: { happiness: 15, energy: -5 },
                    duration: 2000
                }
            ]
        });
    },
    
    createBookshelf(x, y, id) {
        return new WorldObject(id || 'bookshelf_' + Date.now(), x, y, 'bookshelf', {
            icon: '📚',
            width: 50,
            height: 60,
            interactions: [
                {
                    type: 'read',
                    needs: { happiness: 10, energy: -5 },
                    duration: 2500,
                    skill: { logic: 1 }
                }
            ]
        });
    },
    
    createPhone(x, y, id) {
        return new WorldObject(id || 'phone_' + Date.now(), x, y, 'phone', {
            icon: '📱',
            width: 20,
            height: 30,
            interactions: [
                {
                    type: 'call_friend',
                    needs: { social: 30, happiness: 15 }
                },
                {
                    type: 'browse',
                    needs: { happiness: 5, energy: -3 }
                }
            ]
        });
    },
    
    createStove(x, y, id) {
        return new WorldObject(id || 'stove_' + Date.now(), x, y, 'stove', {
            icon: '🍳',
            width: 50,
            height: 40,
            interactions: [
                {
                    type: 'cook',
                    needs: { energy: -15 },
                    duration: 3000,
                    produces: 'meal'
                }
            ]
        });
    },
    
    createTrashcan(x, y, id) {
        return new WorldObject(id || 'trash_' + Date.now(), x, y, 'trashcan', {
            icon: '🗑️',
            width: 25,
            height: 30,
            interactions: [
                {
                    type: 'empty',
                    needs: { hygiene: 10, energy: -5 }
                }
            ]
        });
    },
    
    createDoor(x, y, id, roomConnection) {
        return new WorldObject(id || 'door_' + Date.now(), x, y, 'door', {
            icon: '🚪',
            width: 30,
            height: 50,
            roomConnection: roomConnection,
            interactions: [
                {
                    type: 'enter',
                    teleport: true
                }
            ]
        });
    }
};

// Manager pour gérer tous les objets
const WorldObjects = {
    objects: [],
    
    add(obj) {
        this.objects.push(obj);
        return obj;
    },
    
    remove(id) {
        const idx = this.objects.findIndex(o => o.id === id);
        if (idx !== -1) {
            this.objects[idx].el.remove();
            this.objects.splice(idx, 1);
        }
    },
    
    getNearby(character, range = 80) {
        return this.objects.filter(obj => {
            const dist = Math.hypot(character.x - obj.x, character.y - obj.y);
            return dist < range;
        });
    },
    
    findByType(type) {
        return this.objects.filter(o => o.type === type);
    },
    
    getInteractable(character) {
        return this.objects.filter(obj => obj.canInteract(character));
    },
    
    clear() {
        this.objects.forEach(obj => obj.el.remove());
        this.objects = [];
    }
};