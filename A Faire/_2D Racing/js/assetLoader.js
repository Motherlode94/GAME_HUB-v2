class AssetLoader {
    constructor(basePath = "assets/Racing/") {
        this.basePath = basePath;
        this.images = {};
        this.total = 0;
        this.loaded = 0;
    }

    loadImage(key, relativePath) {
        this.total++;

        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                this.images[key] = img;
                this.loaded++;
                resolve(img);
            };
            img.onerror = () => {
                console.warn(`[AssetLoader] Failed: ${key}`);
                this.loaded++;
                resolve(null);
            };
            img.src = this.basePath + relativePath;
        });
    }

    loadAll(list = ASSETS) {
        return Promise.all(
            list.map(asset =>
                this.loadImage(asset.key, asset.path)
            )
        );
    }

    get(key) {
        return this.images[key] || null;
    }

    getProgress() {
        if (this.total === 0) return 0;
        return Math.floor((this.loaded / this.total) * 100);
    }
}