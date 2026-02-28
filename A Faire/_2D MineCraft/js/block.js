const BLOCK_TYPES = {
    air: {
        name: 'Air',
        color: null,
        solid: false,
        transparent: true
    },
    grass: {
        name: 'Herbe',
        color: '#7cb342',
        solid: true
    },
    dirt: {
        name: 'Terre',
        color: '#8d6e63',
        solid: true
    },
    sapling: {
    name: 'Jeune arbre',
    color: '#228B22',
    solid: false
    },
    stone: {
        name: 'Pierre',
        color: '#757575',
        solid: true
    },
    wood: {
        name: 'Bois',
        color: '#8B4513',
        solid: true
    },
    planks: {
        name: 'Planches',
        color: '#CD853F',
        solid: true
    },
    sand: {
        name: 'Sable',
        color: '#ffd54f',
        solid: true
    },
    water: {
        name: 'Eau',
        color: '#2196F3',
        solid: false,
        transparent: true
    },
    glass: {
        name: 'Verre',
        color: '#b3e5fc',
        solid: true,
        transparent: true
    },
    leaves: {
        name: 'Feuilles',
        color: '#66bb6a',
        solid: true,
        transparent: true
    },
    bedrock: {
        name: 'Bedrock',
        color: '#1a1a1a',
        solid: true,
        unbreakable: true
    },
    coal_ore: {
        name: 'Minerai de charbon',
        color: '#424242',
        solid: true
    },
    iron_ore: {
        name: 'Minerai de fer',
        color: '#bcaaa4',
        solid: true
    },
    gold_ore: {
        name: 'Minerai d\'or',
        color: '#ffd54f',
        solid: true
    },
    diamond_ore: {
        name: 'Minerai de diamant',
        color: '#4fc3f7',
        solid: true
    },
    snow: {
        name: 'Neige',
        color: '#ffffff',
        solid: true
    },
    ice: {
        name: 'Glace',
        color: '#b3e5fc',
        solid: true,
        transparent: true
    },
    lava: {
        name: 'Lave',
        color: '#ff6f00',
        solid: false,
        transparent: true
    }
};

class Block {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        
        const config = BLOCK_TYPES[type];
        this.name = config.name;
        this.color = config.color;
        this.solid = config.solid;
        this.transparent = config.transparent || false;
        this.unbreakable = config.unbreakable || false;
    }
    
    draw(ctx, offsetX, offsetY, blockSize) {
        if (!this.color) return;
        
        const screenX = this.x * blockSize - offsetX;
        const screenY = this.y * blockSize - offsetY;
        
        ctx.fillStyle = this.color;
        ctx.fillRect(screenX, screenY, blockSize, blockSize);
        
        // Bordure
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(screenX, screenY, blockSize, blockSize);
    }
}