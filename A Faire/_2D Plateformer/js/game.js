// ─────────────────────────────────────────────
//  game.js  –  master game controller
//  States: MENU | PLAYING | LEVEL_COMPLETE | GAME_OVER | WIN
// ─────────────────────────────────────────────

var Game = (function () {

    // ── Canvas / ctx ──────────────────────────
    var canvas, ctx;
    var W = 800, H = 400;

    // ── State machine ─────────────────────────
    var STATE       = { MENU: 0, PLAYING: 1, LEVEL_COMPLETE: 2, GAME_OVER: 3, WIN: 4 };
    var state       = STATE.MENU;
    var stateTimer  = 0;

    // ── Game data ─────────────────────────────
    var assets, camera;
    var player, tilemap;
    var coins, enemies, movingPlatforms, particles;

    var score       = 0;
    var lives       = 3;
    var totalCoins  = 0;
    var levelIndex  = 0;

    var SCORE_COIN  = 100;
    var SCORE_STOMP = 200;
    var SCORE_LEVEL = 1000;

    // ── Background renderers ──────────────────
    var _bgCanvas = null;
    var _bgCtx    = null;

    function _buildBg(type, worldW, worldH) {
        _bgCanvas        = document.createElement('canvas');
        _bgCanvas.width  = worldW;
        _bgCanvas.height = worldH;
        _bgCtx           = _bgCanvas.getContext('2d');

        if (type === 'sky') {
            var g = _bgCtx.createLinearGradient(0, 0, 0, worldH);
            g.addColorStop(0,   '#4ec0ff');
            g.addColorStop(0.6, '#abe4ff');
            g.addColorStop(1,   '#c8f5c8');
            _bgCtx.fillStyle = g;
            _bgCtx.fillRect(0, 0, worldW, worldH);

            // Clouds
            var cloudDefs = [];
            for (var c = 0; c < 22; c++) {
                cloudDefs.push({
                    x: Math.random() * worldW,
                    y: 30 + Math.random() * 160,
                    r: 28 + Math.random() * 55,
                });
            }
            cloudDefs.forEach(function (cd) {
                _bgCtx.save();
                _bgCtx.fillStyle = 'rgba(255,255,255,0.82)';
                _bgCtx.beginPath();
                _bgCtx.arc(cd.x,         cd.y,         cd.r,         0, Math.PI * 2);
                _bgCtx.arc(cd.x + cd.r * 0.6, cd.y - cd.r * 0.3, cd.r * 0.65, 0, Math.PI * 2);
                _bgCtx.arc(cd.x - cd.r * 0.6, cd.y - cd.r * 0.2, cd.r * 0.5,  0, Math.PI * 2);
                _bgCtx.fill();
                _bgCtx.restore();
            });

            // Hills
            _bgCtx.fillStyle = '#5cb85c';
            for (var h = 0; h < 12; h++) {
                var hx = h * (worldW / 10) + Math.random() * (worldW / 14);
                var hy = worldH - 80 - Math.random() * 80;
                var hr = 80 + Math.random() * 100;
                _bgCtx.beginPath();
                _bgCtx.arc(hx, hy, hr, 0, Math.PI * 2);
                _bgCtx.fill();
            }

        } else { // cave / night
            var gC = _bgCtx.createLinearGradient(0, 0, 0, worldH);
            gC.addColorStop(0, '#0d0e2a');
            gC.addColorStop(1, '#1a1040');
            _bgCtx.fillStyle = gC;
            _bgCtx.fillRect(0, 0, worldW, worldH);

            // Stars
            _bgCtx.fillStyle = '#ffffff';
            for (var s = 0; s < 180; s++) {
                var sx = Math.random() * worldW;
                var sy = Math.random() * worldH * 0.7;
                var sr = 0.5 + Math.random() * 1.5;
                _bgCtx.globalAlpha = 0.4 + Math.random() * 0.6;
                _bgCtx.beginPath();
                _bgCtx.arc(sx, sy, sr, 0, Math.PI * 2);
                _bgCtx.fill();
            }
            _bgCtx.globalAlpha = 1;

            // Distant mountains
            _bgCtx.fillStyle = 'rgba(50,40,90,0.7)';
            for (var m = 0; m < 10; m++) {
                var mx = m * (worldW / 8) + Math.random() * (worldW / 10);
                var mh = 120 + Math.random() * 180;
                _bgCtx.beginPath();
                _bgCtx.moveTo(mx - 90, worldH);
                _bgCtx.lineTo(mx, worldH - mh);
                _bgCtx.lineTo(mx + 90, worldH);
                _bgCtx.closePath();
                _bgCtx.fill();
            }
        }
    }

    // ── Load level ────────────────────────────
    function _loadLevel(idx) {
        var data = LEVELS[idx];
        tilemap  = new TileMap(TILE_SIZE, data.map, assets.get('tile01'));
        camera   = new Camera(W, H);

        // Build background
        _buildBg(data.bg, tilemap.worldWidth, tilemap.worldHeight);

        // Player
        player = new Player(data.playerStart.x, data.playerStart.y, assets);

        // Coins
        coins = data.coins.map(function (c) { return new Coin(c.x, c.y); });

        // Enemies
        enemies = data.enemies.map(function (e) {
            return new Enemy(e.x, e.y, e.minX, e.maxX, e.speed);
        });

        // Moving platforms
        movingPlatforms = data.movingPlatforms.map(function (p) {
            return new MovingPlatform(p.x, p.y, p.w, p.h, p.minX, p.maxX, p.speed);
        });

        particles = [];
    }

    // ── Respawn / death ───────────────────────
    function _killPlayer() {
        lives--;
        spawnDeathParticles(particles, player.x + player.width / 2, player.y + player.height / 2);
        camera.shake(8, 22);
        if (lives <= 0) {
            state = STATE.GAME_OVER;
        } else {
            var data = LEVELS[levelIndex];
            player.x         = data.playerStart.x;
            player.y         = data.playerStart.y;
            player.velocityX = 0;
            player.velocityY = 0;
            player.invincible = 100;
        }
    }

    // ── Collision helpers ─────────────────────
    function _rectOverlap(a, b) {
        return (
            a.x < b.x + b.width  && a.x + a.width  > b.x &&
            a.y < b.y + b.height && a.y + a.height > b.y
        );
    }

    // ── Update PLAYING ────────────────────────
    function _updatePlaying() {
        player.handleInput(Input.keys);

        // Moving platforms — move first, carry player
        movingPlatforms.forEach(function (mp) {
            var prevX = mp.x;
            mp.update();
            if (mp.isEntityOn(player)) {
                player.x += mp.x - prevX;
                player.isGrounded = true;
            }
        });

        player.update(tilemap);
        camera.follow(player, tilemap.worldWidth, tilemap.worldHeight);

        // Enemies
        enemies.forEach(function (e) { e.update(tilemap); });

        // Particles
        particles.forEach(function (p) { p.update(); });
        particles = particles.filter(function (p) { return !p.dead; });

        var pb = player.getBounds();

        // ── Coin collection ────────────────────
        coins.forEach(function (c) {
            if (c.collected) { c.update(); return; }
            c.update();
            if (_rectOverlap(pb, c.getBounds())) {
                c.collected = true;
                score      += SCORE_COIN;
                totalCoins++;
                spawnCoinParticles(particles, c.x + 9, c.y + 9);
            }
        });

        // ── Enemy interactions ─────────────────
        enemies.forEach(function (e) {
            if (e.isExpired() || e.dead) return;
            var eb = e.getBounds();
            if (!_rectOverlap(pb, eb)) return;

            // Player feet above enemy center → stomp
            var playerBottom = pb.y + pb.height;
            var enemyMid     = eb.y + eb.height / 2;
            if (playerBottom < enemyMid + 10 && player.velocityY > 0) {
                e.stomp();
                player.velocityY = -9;
                score += SCORE_STOMP;
                spawnStompParticles(particles, eb.x + eb.width / 2, eb.y + eb.height / 2);
                camera.shake(5, 12);
            } else if (player.invincible <= 0) {
                _killPlayer();
            }
        });

        // ── Fall out of world ──────────────────
        if (player.y > tilemap.worldHeight + 64) {
            _killPlayer();
        }

        // ── Goal flag ─────────────────────────
        var lvl     = LEVELS[levelIndex];
        var goalBnd = { x: lvl.goalX, y: 0, width: 32, height: tilemap.worldHeight };
        if (_rectOverlap(pb, goalBnd)) {
            score += SCORE_LEVEL;
            state      = STATE.LEVEL_COMPLETE;
            stateTimer = 0;
        }
    }

    // ── Draw ──────────────────────────────────
    function _draw() {
        ctx.clearRect(0, 0, W, H);

        if (state === STATE.MENU)       { UI.drawMenu(ctx, W, H); return; }
        if (state === STATE.GAME_OVER)  { UI.drawGameOver(ctx, W, H, score); return; }
        if (state === STATE.WIN)        { UI.drawWin(ctx, W, H, score, totalCoins); return; }

        // ── World draw ──────────────────────────
        ctx.save();
        camera.apply(ctx);

        // Background
        if (_bgCanvas) {
            ctx.drawImage(_bgCanvas, 0, 0);
        } else {
            ctx.fillStyle = '#5c94fc';
            ctx.fillRect(0, 0, tilemap.worldWidth, tilemap.worldHeight);
        }

        // Goal flag
        var lvl = LEVELS[levelIndex];
        _drawGoal(ctx, lvl.goalX, tilemap.worldHeight);

        // Moving platforms (below tiles & entities)
        movingPlatforms.forEach(function (mp) { mp.draw(ctx); });

        // Tiles
        tilemap.draw(ctx, camera);

        // Coins
        coins.forEach(function (c) { c.draw(ctx); });

        // Enemies
        enemies.forEach(function (e) { e.draw(ctx); });

        // Particles
        particles.forEach(function (p) { p.draw(ctx); });

        // Player
        player.draw(ctx);

        ctx.restore();

        // ── HUD (always screen-space) ───────────
        HUD.draw(ctx, score, lives, totalCoins, lvl.name, W);

        // ── Level complete overlay ───────────────
        if (state === STATE.LEVEL_COMPLETE) {
            UI.drawLevelComplete(ctx, W, H, levelIndex, score);
        }
    }

    // ── Goal flag visual ──────────────────────
    function _drawGoal(ctx, gx, worldH) {
        // Pole
        ctx.fillStyle = '#888';
        ctx.fillRect(gx + 10, worldH - 6 * TILE_SIZE, 6, 6 * TILE_SIZE);

        // Waving flag (sinusoidal)
        var t = Date.now() * 0.003;
        ctx.save();
        ctx.translate(gx + 16, worldH - 6 * TILE_SIZE + 4);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        for (var i = 0; i <= 30; i++) {
            var px2 = i;
            var py2 = Math.sin(t + i * 0.3) * 6 + i * 0.6;
            ctx.lineTo(px2, py2);
        }
        for (var j = 30; j >= 0; j--) {
            ctx.lineTo(j, Math.sin(t + j * 0.3) * 6 + j * 0.6 + 14);
        }
        ctx.closePath();
        ctx.fillStyle = '#e94560';
        ctx.fill();
        ctx.restore();

        // Star on top
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('★', gx + 13, worldH - 6 * TILE_SIZE - 4);
    }

    // ── Main loop ─────────────────────────────
    function _loop() {
        stateTimer++;

        switch (state) {
            case STATE.MENU:
                if (Input.isAnyAction()) {
                    score      = 0;
                    lives      = 3;
                    totalCoins = 0;
                    levelIndex = 0;
                    _loadLevel(0);
                    state = STATE.PLAYING;
                }
                break;

            case STATE.PLAYING:
                _updatePlaying();
                break;

            case STATE.LEVEL_COMPLETE:
                if (stateTimer > 160) {
                    levelIndex++;
                    if (levelIndex >= LEVELS.length) {
                        state = STATE.WIN;
                    } else {
                        _loadLevel(levelIndex);
                        state = STATE.PLAYING;
                    }
                    stateTimer = 0;
                }
                break;

            case STATE.GAME_OVER:
                if (stateTimer > 90 && Input.isAnyAction()) {
                    score      = 0;
                    lives      = 3;
                    totalCoins = 0;
                    levelIndex = 0;
                    _loadLevel(0);
                    state      = STATE.PLAYING;
                    stateTimer = 0;
                }
                break;

            case STATE.WIN:
                if (stateTimer > 90 && Input.isAnyAction()) {
                    score      = 0;
                    lives      = 3;
                    totalCoins = 0;
                    levelIndex = 0;
                    state      = STATE.MENU;
                    stateTimer = 0;
                }
                break;
        }

        _draw();
        Input.clearFrame();
        requestAnimationFrame(_loop);
    }

    // ── Init ─────────────────────────────────
    function init() {
        canvas        = document.getElementById('gameCanvas');
        ctx           = canvas.getContext('2d');
        canvas.width  = W;
        canvas.height = H;

        ctx.imageSmoothingEnabled = false;

        assets = new AssetLoader();
        assets.loadAll().then(function () {
            requestAnimationFrame(_loop);
        }).catch(function (err) {
            console.error('Asset load error:', err);
            // Start anyway (will use fallback drawing)
            requestAnimationFrame(_loop);
        });
    }

    return { init: init };

})();

// ── Boot ──────────────────────────────────────
window.addEventListener('DOMContentLoaded', function () {
    Game.init();
});