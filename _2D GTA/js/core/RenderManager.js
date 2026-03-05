// RenderManager.js - Gestionnaire de couches de rendu

Game.RenderManager = {
  // Ordre des couches (du plus bas au plus haut)
  layers: {
    GROUND: 0,           // Sol, terrain
    GROUND_DECALS: 1,    // Marques au sol, ombres
    ITEMS: 2,            // Items au sol (argent, soins)
    BUILDINGS: 3,        // Bâtiments
    VEHICLES: 4,         // Véhicules
    CHARACTERS: 5,       // Joueur et ennemis
    EFFECTS: 6,          // Effets visuels, particules
    UI_WORLD: 7,         // UI dans le monde (barres de vie)
    UI_OVERLAY: 8        // UI overlay (HUD, minimap)
  },

  // Objets à rendre par couche
  renderQueue: {},

  init() {
    this.clearQueue();
  },

  clearQueue() {
    for (const layer in this.layers) {
      this.renderQueue[this.layers[layer]] = [];
    }
  },

  /**
   * Ajoute un objet à la queue de rendu
   * @param {number} layer - Couche de rendu
   * @param {Function} drawFn - Fonction de dessin
   * @param {number} y - Position Y pour le tri (optionnel)
   */
  add(layer, drawFn, y = 0) {
    if (!this.renderQueue[layer]) {
      this.renderQueue[layer] = [];
    }
    this.renderQueue[layer].push({ drawFn, y });
  },

  /**
   * Rend tous les objets dans l'ordre des couches
   * @param {CanvasRenderingContext2D} ctx - Contexte de rendu
   */
  render(ctx) {
    // Parcourir les couches dans l'ordre
    for (let layer = 0; layer <= this.layers.UI_OVERLAY; layer++) {
      if (!this.renderQueue[layer]) continue;

      // Trier par Y pour l'effet de profondeur sur les couches appropriées
      if (layer === this.layers.CHARACTERS || layer === this.layers.VEHICLES || layer === this.layers.ITEMS) {
        this.renderQueue[layer].sort((a, b) => a.y - b.y);
      }

      // Dessiner tous les objets de cette couche
      for (const item of this.renderQueue[layer]) {
        item.drawFn(ctx);
      }
    }

    // Nettoyer pour la prochaine frame
    this.clearQueue();
  }
};