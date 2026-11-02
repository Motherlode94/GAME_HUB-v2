window.onload = function () {
    canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    canvas.width = MAP_COLS * TILE_SIZE;
    canvas.height = MAP_ROWS * TILE_SIZE;
    canvas.style.setProperty('--map-aspect', MAP_COLS / MAP_ROWS);
    ctx = canvas.getContext('2d');
    if (!ctx) return;

    initMap();
    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        gameState.placingTower = false;
        if (typeof tdArmedAbility !== 'undefined') tdArmedAbility = null;
        setSelectedTowers([]);
    });

    // Initialize the new command interface only after the canvas and map exist.
    if (typeof initTDUI === 'function') initTDUI();
    requestAnimationFrame(gameLoop);
};
