window.onload = function () {
    canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    canvas.width = MAP_COLS * TILE_SIZE;
    canvas.height = MAP_ROWS * TILE_SIZE;
    ctx = canvas.getContext('2d');
    if (!ctx) return;

    initMap();
    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        gameState.placingTower = false;
        setSelectedTowers([]);
    });

    requestAnimationFrame(gameLoop);
};
