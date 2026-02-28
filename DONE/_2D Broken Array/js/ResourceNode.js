window.RTS = window.RTS || {};

/**
 * ResourceNode — gisement de ressources sur la carte.
 * type   : "gold" | "fuel" | "ammo"
 * amount : stock restant
 */
RTS.ResourceNode = function(x, y, type, amount) {
    this.x      = x;
    this.y      = y;
    this.type   = type;
    this.amount = amount || 400;
    this.maxAmount = this.amount;
    this.size   = 18;
    this.depleted = false;
};

// Propriétés visuelles par type
RTS.ResourceNode.STYLE = {
    gold: { color: "#f5a623", label: "🪙", bgColor: "#2a1f00" },
    fuel: { color: "#27ae60", label: "⛽", bgColor: "#0a2010" },
    ammo: { color: "#e74c3c", label: "🔴", bgColor: "#200a0a" }
};

// Génère les nœuds de ressources sur la carte
RTS.ResourceNode.generateMap = function() {
    var nodes = [];
    var types = ["gold", "gold", "fuel", "ammo"];

    // Clusters répartis sur la carte (hors spawn bleu et rouge)
    var positions = [
        [600,  400],  [800,  200],  [1000, 600],
        [600,  800],  [1200, 400],  [400,  1200],
        [1400, 800],  [1000, 1200], [800,  1600],
        [1600, 400],  [1200, 1600], [1800, 1000]
    ];

    positions.forEach(function(pos, i) {
        var type = types[i % types.length];
        nodes.push(new RTS.ResourceNode(
            pos[0] + (Math.random() - 0.5) * 80,
            pos[1] + (Math.random() - 0.5) * 80,
            type,
            300 + Math.floor(Math.random() * 300)
        ));
    });

    return nodes;
};