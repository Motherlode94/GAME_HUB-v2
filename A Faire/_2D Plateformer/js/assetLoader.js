// ─────────────────────────────────────────────
//  assetLoader.js  –  image preloading
// ─────────────────────────────────────────────
class AssetLoader {
    constructor() {
        this.images = {};
    }

    loadImage(name, path) {
        return new Promise(function (resolve) {
            var img = new Image();
            img.onload = function () {
                this.images[name] = img;
                resolve(img);
            }.bind(this);
            img.onerror = function () {
                console.warn('[AssetLoader] Cannot load "' + name + '" : ' + path);
                resolve(null);
            };
            img.src = path;
        }.bind(this));
    }

    loadAll() {
        return Promise.all([
            this.loadImage('bg1',    'assets/Platformer/2 Locations/Backgrounds/1.png'),
            this.loadImage('idle',   'assets/Platformer/1 Main Characters/1/Idle.png'),
            this.loadImage('run',    'assets/Platformer/1 Main Characters/1/Run.png'),
            this.loadImage('jump',   'assets/Platformer/1 Main Characters/1/Jump.png'),
            this.loadImage('fall',   'assets/Platformer/1 Main Characters/1/Fall.png'),
            this.loadImage('hit',    'assets/Platformer/1 Main Characters/1/Hit.png'),
            this.loadImage('tile01', 'assets/Platformer/2 Locations/Tiles/Tile_01.png'),
        ]);
    }

    get(name) {
        return this.images[name] || null;
    }
}