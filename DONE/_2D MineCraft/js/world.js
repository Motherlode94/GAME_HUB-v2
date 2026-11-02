class World {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.blocks = new Map();
        this.blockSize = 32;
    }
    
    getBlock(x, y) {
        const key = `${x},${y}`;
        return this.blocks.get(key) || null;
    }
    
    setBlock(x, y, type) {
        const key = `${x},${y}`;
        if (type === 'air') {
            this.blocks.delete(key);
        } else {
            this.blocks.set(key, new Block(type, x, y));
        }
    }
    
    removeBlock(x, y) {
        const key = `${x},${y}`;
        const block = this.blocks.get(key);
        if (block && !block.unbreakable) {
            this.blocks.delete(key);
            return true;
        }
        return false;
    }
    
    generate() {
        this.blocks.clear();
        
        const seaLevel = Math.floor(this.height * 0.6);
        
        // Génération du terrain avec Perlin noise simplifié
        for (let x = 0; x < this.width; x++) {
            // Hauteur du terrain
            const amplitude = 15;
            const frequency = 0.03;
            const height = Math.floor(
                Math.sin(x * frequency) * amplitude +
                Math.sin(x * frequency * 2) * (amplitude / 2) +
                Math.cos(x * frequency * 0.5) * (amplitude / 3)
            ) + seaLevel;
            
            // Surface
            this.setBlock(x, height, 'grass');
            
            // Sous-sol
            for (let y = height + 1; y < height + 4; y++) {
                this.setBlock(x, y, 'dirt');
            }
            
            // Roche
            for (let y = height + 4; y < this.height - 1; y++) {
                this.setBlock(x, y, 'stone');
                
                // Minerais
                const r = Math.random();
                if (y > height + 10 && r < 0.005) {
                    this.setBlock(x, y, 'diamond_ore');
                } else if (y > height + 8 && r < 0.01) {
                    this.setBlock(x, y, 'gold_ore');
                } else if (y > height + 6 && r < 0.02) {
                    this.setBlock(x, y, 'iron_ore');
                } else if (y > height + 4 && r < 0.03) {
                    this.setBlock(x, y, 'coal_ore');
                }
            }
            
            // Bedrock
            this.setBlock(x, this.height - 1, 'bedrock');
            
            // Eau
            if (height < seaLevel) {
                for (let y = height + 1; y < seaLevel; y++) {
                    this.setBlock(x, y, 'water');
                }
            }
        }
        
        // Arbres
        this.generateTrees(seaLevel);
        
        // Grottes
        this.generateCaves();
    }
    
    generateTrees(seaLevel) {
        for (let i = 0; i < 30; i++) {
            const x = Math.floor(Math.random() * this.width);
            
            // Trouver la surface
            let y = 0;
            for (y = 0; y < this.height; y++) {
                const block = this.getBlock(x, y);
                if (block && block.type === 'grass') {
                    break;
                }
            }
            
            if (y >= seaLevel - 5 && y < this.height - 10) {
                // Tronc
                const treeHeight = 4 + Math.floor(Math.random() * 3);
                for (let h = 0; h < treeHeight; h++) {
                    this.setBlock(x, y - h, 'wood');
                }
                
                // Feuilles
                const leafY = y - treeHeight;
                for (let dx = -2; dx <= 2; dx++) {
                    for (let dy = -2; dy <= 1; dy++) {
                        if (Math.abs(dx) + Math.abs(dy) < 4 && Math.random() > 0.2) {
                            const lx = x + dx;
                            const ly = leafY + dy;
                            if (lx >= 0 && lx < this.width) {
                                const existing = this.getBlock(lx, ly);
                                if (!existing || existing.type === 'air') {
                                    this.setBlock(lx, ly, 'leaves');
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    generateCaves() {
        const numCaves = 15;
        
        for (let i = 0; i < numCaves; i++) {
            let x = Math.floor(Math.random() * this.width);
            let y = Math.floor(this.height * 0.4 + Math.random() * this.height * 0.4);
            
            const length = 20 + Math.floor(Math.random() * 30);
            let dir = Math.random() * Math.PI * 2;
            
            for (let j = 0; j < length; j++) {
                const radius = 2 + Math.random() * 2;
                
                for (let dx = -radius; dx <= radius; dx++) {
                    for (let dy = -radius; dy <= radius; dy++) {
                        if (dx * dx + dy * dy <= radius * radius) {
                            const cx = Math.floor(x + dx);
                            const cy = Math.floor(y + dy);
                            
                            if (cx >= 0 && cx < this.width && cy >= 0 && cy < this.height - 1) {
                                const block = this.getBlock(cx, cy);
                                if (block && !block.unbreakable && block.type !== 'water') {
                                    this.removeBlock(cx, cy);
                                }
                            }
                        }
                    }
                }
                
                x += Math.cos(dir) * 0.5;
                y += Math.sin(dir) * 0.5;
                dir += (Math.random() - 0.5) * 0.5;
                
                if (y >= this.height - 2) break;
            }
        }
    }
    
    draw(ctx, camera) {
        const startX = Math.floor(camera.x / this.blockSize);
        const endX = Math.ceil((camera.x + camera.width) / this.blockSize);
        const startY = Math.floor(camera.y / this.blockSize);
        const endY = Math.ceil((camera.y + camera.height) / this.blockSize);
        
        // Dessiner seulement les blocs visibles
        for (let x = Math.max(0, startX); x < Math.min(this.width, endX); x++) {
            for (let y = Math.max(0, startY); y < Math.min(this.height, endY); y++) {
                const block = this.getBlock(x, y);
                if (block) {
                    block.draw(ctx, camera.x, camera.y, this.blockSize);
                }
            }
        }
    }
}