window.onload = function () {
    canvas = document.getElementById("gameCanvas");

    if (!canvas) {
        console.error("Canvas introuvable");
        return;
    }

    canvas.width = MAP_COLS * TILE_SIZE;
    canvas.height = MAP_ROWS * TILE_SIZE;
    ctx = canvas.getContext("2d");

    if (!ctx) {
        console.error("Contexte 2D indisponible");
        return;
    }

    initMap();
    canvas.addEventListener("click", handleCanvasClick);
    canvas.addEventListener("mousemove", handleMouseMove);

    console.log("Tower Defense initialise");
    console.log(`Canvas: ${canvas.width}x${canvas.height}`);
    console.log(`Grille: ${MAP_COLS}x${MAP_ROWS}`);
    console.log(`Argent: ${STARTING_MONEY}$`);
    console.log(`Vies: ${STARTING_LIVES}`);
    console.log("Commandes:");
    console.log("  C = changer type de tour");
    console.log("  Shift+clic = multi-selection");
    console.log("  Ctrl+clic = selection meme type");
    console.log("  U = ameliorer la selection");
    console.log("  T = reprendre meme type");
    console.log("  G = changer profil IA");
    console.log("  A = auto-upgrade IA on/off");
    console.log("  P = pause, ESC = annuler");

    requestAnimationFrame(gameLoop);
};

