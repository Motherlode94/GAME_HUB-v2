// Système de caméra pour suivre le joueur
const Camera = {
    x: 0,
    y: 0,
    width: 800,
    height: 600,
    worldWidth: 2400,  // Monde 3x plus large
    worldHeight: 1800, // Monde 3x plus haut
    smoothing: 0.15,   // Lissage du mouvement
    
    init() {
        const world = document.getElementById('world');
        if (world) {
            this.width = world.offsetWidth;
            this.height = world.offsetHeight;
            
            // Crée un container pour tous les éléments du monde
            const worldContainer = document.createElement('div');
            worldContainer.id = 'world-container';
            worldContainer.style.position = 'absolute';
            worldContainer.style.width = this.worldWidth + 'px';
            worldContainer.style.height = this.worldHeight + 'px';
            worldContainer.style.transition = 'transform 0.1s ease-out';
            
            // Déplace tous les enfants existants dans le container
            while (world.firstChild) {
                worldContainer.appendChild(world.firstChild);
            }
            
            world.appendChild(worldContainer);
        }
    },
    
    follow(target) {
        if (!target) return;
        
        // Position idéale (centrer sur le joueur)
        const targetX = target.x - this.width / 2;
        const targetY = target.y - this.height / 2;
        
        // Smooth suivie
        this.x += (targetX - this.x) * this.smoothing;
        this.y += (targetY - this.y) * this.smoothing;
        
        // Limites du monde
        this.x = Math.max(0, Math.min(this.worldWidth - this.width, this.x));
        this.y = Math.max(0, Math.min(this.worldHeight - this.height, this.y));
        
        this.applyTransform();
    },
    
    applyTransform() {
        const container = document.getElementById('world-container');
        if (!container) return;
        
        // Applique la transformation UNIQUEMENT au container
        container.style.transform = `translate(${-this.x}px, ${-this.y}px)`;
    },
    
    worldToScreen(worldX, worldY) {
        return {
            x: worldX - this.x,
            y: worldY - this.y
        };
    },
    
    screenToWorld(screenX, screenY) {
        return {
            x: screenX + this.x,
            y: screenY + this.y
        };
    },
    
    isVisible(x, y, margin = 100) {
        return x > this.x - margin &&
               x < this.x + this.width + margin &&
               y > this.y - margin &&
               y < this.y + this.height + margin;
    }
};

// Mini-map
const MiniMap = {
    scale: 0.1, // 10% de la taille réelle
    width: 200,
    height: 150,
    canvas: null,
    ctx: null,
    
    init() {
        // Crée le canvas de la mini-map
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'minimap';
        this.canvas.className = 'minimap';
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        // Ajoute DIRECTEMENT au body (pas dans world)
        document.body.appendChild(this.canvas);
        
        this.ctx = this.canvas.getContext('2d');
        console.log('🗺️ Mini-map initialized');
    },
    
    update() {
        if (!this.ctx) return;
        
        // Clear
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Border
        this.ctx.strokeStyle = '#4fd1c5';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(0, 0, this.width, this.height);
        
        // Dessine le monde (limites)
        const worldW = Camera.worldWidth * this.scale;
        const worldH = Camera.worldHeight * this.scale;
        this.ctx.strokeStyle = '#666';
        this.ctx.strokeRect(0, 0, worldW, worldH);
        
        // Dessine les buildings
        if (WorldManager.locations.neighborhood.buildings) {
            WorldManager.locations.neighborhood.buildings.forEach(building => {
                const x = building.x * this.scale;
                const y = building.y * this.scale;
                const w = building.width * this.scale;
                const h = building.height * this.scale;
                
                this.ctx.fillStyle = building.locked ? '#ff6b6b' : '#4a9eff';
                this.ctx.fillRect(x, y, w, h);
            });
        }
        
        // Dessine les personnages
        if (typeof chars !== 'undefined') {
            chars.forEach(char => {
                if (char.isDead || char.currentLocation !== 'neighborhood') return;
                
                const x = char.x * this.scale;
                const y = char.y * this.scale;
                const size = 4;
                
                this.ctx.fillStyle = char.id === 'P' ? '#4fd1c5' : '#ff6b6b';
                this.ctx.beginPath();
                this.ctx.arc(x, y, size, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Indicateur de direction
                if (char.id === 'P') {
                    this.ctx.strokeStyle = '#4fd1c5';
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.arc(x, y, size + 2, 0, Math.PI * 2);
                    this.ctx.stroke();
                }
            });
        }
        
        // Dessine la zone visible (viewport)
        const viewX = Camera.x * this.scale;
        const viewY = Camera.y * this.scale;
        const viewW = Camera.width * this.scale;
        const viewH = Camera.height * this.scale;
        
        this.ctx.strokeStyle = '#4fd1c5';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(viewX, viewY, viewW, viewH);
        
        // Label
        this.ctx.fillStyle = '#4fd1c5';
        this.ctx.font = '10px monospace';
        this.ctx.fillText('CARTE', 5, 12);
    },
    
    // Clic sur la mini-map pour téléporter (optionnel)
    handleClick(mouseX, mouseY) {
        const rect = this.canvas.getBoundingClientRect();
        const x = mouseX - rect.left;
        const y = mouseY - rect.top;
        
        // Convertit en coordonnées monde
        const worldX = x / this.scale;
        const worldY = y / this.scale;
        
        return { x: worldX, y: worldY };
    }
};