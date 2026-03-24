const canvas = document.getElementById('gameMap');
const ctx = canvas.getContext('2d');
const tileSize = 40;
const mapSize = { rows: 10, cols: 15 };

// Types de terrains : Nom, Couleur, Or, Science
const terrains = {
    0: { name: "Plaine", color: "#78B159", gold: 2, sci: 0 },
    1: { name: "Forêt",  color: "#38761D", gold: 1, sci: 1 },
    2: { name: "Eau",    color: "#3D85C6", gold: 1, sci: 0 },
    3: { name: "Montagne", color: "#666666", gold: 0, sci: 3 }
};

let gameData = {
    gold: 10,
    science: 0,
    turn: 1,
    map: []
};

let hoveredTile = null;

// Initialisation de la carte
function initMap() {
    for (let r = 0; r < mapSize.rows; r++) {
        gameData.map[r] = [];
        for (let c = 0; c < mapSize.cols; c++) {
            gameData.map[r][c] = Math.floor(Math.random() * 4);
        }
    }
    draw();
}

// Liste pour stocker les coordonnées des villes
let cities = []; 

// Détecter le clic sur le canvas
canvas.addEventListener('click', function(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Convertir les pixels en coordonnées de grille (colonne / ligne)
    const col = Math.floor(x / tileSize);
    const row = Math.floor(y / tileSize);

    foundCity(row, col);
});

canvas.addEventListener('mousemove', function(event) {
    const rect = canvas.getBoundingClientRect();
    const col = Math.floor((event.clientX - rect.left) / tileSize);
    const row = Math.floor((event.clientY - rect.top) / tileSize);
    
    // Valider les coordonnées
    if (row >= 0 && row < mapSize.rows && col >= 0 && col < mapSize.cols) {
        hoveredTile = { row, col };
    }
});

canvas.addEventListener('mouseleave', function() {
    hoveredTile = null; // ← Effacer le survol quand la souris sort
});

function foundCity(row, col) {
        const tileType = gameData.map[row][col];
    if (tileType === 2 || tileType === 3) { // Eau ou Montagne
        alert("Impossible de construire ici !");
        return;
    }
    // Vérifier si on a assez d'or (Coût d'une ville = 10 Or)
    if (gameData.gold >= 10) {
        // Vérifier si une ville existe déjà à cet endroit
        const exists = cities.some(c => c.r === row && c.c === col);
        
        if (!exists) {
            gameData.gold -= 10; // On paie la ville
            cities.push({ r: row, c: col, name: "Ville " + (cities.length + 1) });
            
            updateUI();
            draw(); // On redessine pour voir la ville
        } else {
            alert("Il y a déjà une ville ici !");
        }
    } else {
        alert("Pas assez d'or pour fonder une ville (Coût: 10) !");
    }
}

function collectResources() {
    let collectedGold = 0, collectedSci = 0;
    
    cities.forEach(city => {
        // Parcourir les 8 cases autour de la ville
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const r = city.r + dr, c = city.c + dc;
                if (r >= 0 && r < mapSize.rows && c >= 0 && c < mapSize.cols) {
                    const tile = terrains[gameData.map[r][c]];
                    collectedGold += tile.gold;
                    collectedSci += tile.sci;
                }
            }
        }
    });
    
    gameData.gold += collectedGold;
    gameData.science += collectedSci;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 1. Dessiner le terrain
    for (let r = 0; r < mapSize.rows; r++) {
        for (let c = 0; c < mapSize.cols; c++) {
            let type = terrains[gameData.map[r][c]];
            ctx.fillStyle = type.color;
            ctx.fillRect(c * tileSize, r * tileSize, tileSize, tileSize);
            ctx.strokeStyle = "rgba(0,0,0,0.1)";
            ctx.strokeRect(c * tileSize, r * tileSize, tileSize, tileSize);
        }
    }

    // 2. Dessiner les villes par-dessus
    cities.forEach(city => {
        ctx.fillStyle = "white";
        // On dessine un petit château simplifié (un carré blanc avec un toit)
        ctx.fillRect(city.c * tileSize + 10, city.r * tileSize + 10, 20, 20);
        ctx.fillStyle = "#333";
        ctx.fillText("Cité", city.c * tileSize + 8, city.r * tileSize + 38);
    });

    if (hoveredTile) {
    ctx.strokeStyle = "#FFFF00";
    ctx.lineWidth = 2;
    ctx.strokeRect(
        hoveredTile.col * tileSize, 
        hoveredTile.row * tileSize, 
        tileSize, 
        tileSize
    );
    ctx.lineWidth = 1; // reset
}
}

function nextTurn() {
    collectResources(); // ← Collecte uniquement autour des villes
    gameData.turn++;
    updateUI();
    draw(); // ← Important : redessiner après le tour
}

function updateUI() {
    document.getElementById('gold').innerText = gameData.gold;
    document.getElementById('science').innerText = gameData.science;
    document.getElementById('turn').innerText = gameData.turn;
}
function saveGame() {
    const saveState = {
        gameData: gameData,
        cities: cities // ← Sauvegarder les villes aussi !
    };
    localStorage.setItem('strategySave', JSON.stringify(saveState));
}

function loadGame() {
    const saved = JSON.parse(localStorage.getItem('strategySave'));
    if (saved) {
        gameData = saved.gameData;
        cities = saved.cities; // ← Restaurer les villes
        updateUI();
        draw(); // ← Redessiner la carte avec les villes
    }
}

// Lancement
initMap();
updateUI();