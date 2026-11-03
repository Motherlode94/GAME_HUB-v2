window.onload = function () {
    canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    canvas.width = MAP_COLS * TILE_SIZE;
    canvas.height = MAP_ROWS * TILE_SIZE;
    canvas.style.setProperty('--map-aspect', MAP_COLS / MAP_ROWS);
    ctx = canvas.getContext('2d');
    if (!ctx) return;

    initMap();
    if (typeof tdLoadEnemySprites === 'function') tdLoadEnemySprites();
    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('mousemove', handleMouseMove);
    // On touch devices, update the aiming tile on the actual press, not
    // at the last desktop-style mousemove (which may never be dispatched).
    canvas.addEventListener('pointerdown', handleMouseMove);
    canvas.addEventListener('pointermove', (event) => {
        if (event.pointerType !== 'mouse') handleMouseMove(event);
    });
    canvas.addEventListener('pointerleave', () => {
        gameState.hoveredTile = { x: -1, y: -1 };
        gameState.hoveredTower = null;
    });
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
