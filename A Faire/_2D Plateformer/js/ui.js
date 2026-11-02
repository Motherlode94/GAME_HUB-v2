// ─────────────────────────────────────────────
//  ui.js  –  menu / overlay screens
// ─────────────────────────────────────────────
var UI = (function () {

    // Pre-generate stars for all screens
    var _stars = [];
    for (var i = 0; i < 90; i++) {
        _stars.push({
            x: Math.random(),
            y: Math.random(),
            r: 0.4 + Math.random() * 1.4,
            phase: Math.random() * Math.PI * 2
        });
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    function _drawStars(ctx, w, h) {
        var t = Date.now() * 0.001;
        _stars.forEach(function (s) {
            var a = 0.35 + Math.sin(t * 1.1 + s.phase) * 0.25;
            ctx.fillStyle = 'rgba(255,255,255,' + a.toFixed(2) + ')';
            ctx.beginPath();
            ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    function _roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.arcTo(x + w, y,     x + w, y + r,     r);
        ctx.lineTo(x + w, y + h - r);
        ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        ctx.lineTo(x + r, y + h);
        ctx.arcTo(x,     y + h, x,     y + h - r, r);
        ctx.lineTo(x,     y + r);
        ctx.arcTo(x,     y,     x + r, y,         r);
        ctx.closePath();
    }

    function _blink() {
        return Math.floor(Date.now() / 520) % 2 === 0;
    }

    // ── Screens ──────────────────────────────────────────────────────────────

    function drawMenu(ctx, w, h) {
        ctx.save();

        // Background
        var g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#07071a');
        g.addColorStop(1, '#150720');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);

        _drawStars(ctx, w, h);

        ctx.textAlign   = 'center';
        ctx.textBaseline = 'middle';

        // Red glow title
        ctx.shadowColor  = '#e94560';
        ctx.shadowBlur   = 28;
        ctx.fillStyle    = '#e94560';
        ctx.font         = 'bold 58px "Courier New"';
        ctx.fillText('WARLIKE', w / 2, h / 2 - 72);

        ctx.shadowBlur   = 0;
        ctx.fillStyle    = '#ffffff';
        ctx.font         = 'bold 24px "Courier New"';
        ctx.fillText('P  L  A  T  F  O  R  M  E  R', w / 2, h / 2 - 26);

        // Divider
        ctx.fillStyle    = 'rgba(233,69,96,0.45)';
        ctx.fillRect(w / 2 - 110, h / 2 - 6, 220, 2);

        // Blink prompt
        if (_blink()) {
            ctx.fillStyle = '#ffd700';
            ctx.font      = '14px "Courier New"';
            ctx.fillText('PRESS SPACE OR CLICK TO START', w / 2, h / 2 + 26);
        }

        // Controls
        ctx.fillStyle = '#555577';
        ctx.font      = '12px "Courier New"';
        ctx.fillText('\u2190 \u2192 / A D : Move          SPACE / W / \u2191 : Jump', w / 2, h / 2 + 64);
        ctx.fillText('Stomp enemies from above!  Collect all coins!', w / 2, h / 2 + 86);

        // World count
        ctx.fillStyle = '#33334a';
        ctx.font      = '11px "Courier New"';
        ctx.fillText('3 WORLDS  \u00B7  WARLIKE GAMING CORPS', w / 2, h - 18);

        ctx.restore();
    }

    function drawLevelComplete(ctx, w, h, nextLvlIdx, score) {
        ctx.save();

        ctx.fillStyle = 'rgba(0,0,0,0.62)';
        ctx.fillRect(0, 0, w, h);

        // Panel
        var pw = 340, ph = 155;
        var px = w / 2 - pw / 2, py = h / 2 - ph / 2;
        ctx.fillStyle   = 'rgba(8, 24, 60, 0.97)';
        ctx.strokeStyle = '#e94560';
        ctx.lineWidth   = 3;
        _roundRect(ctx, px, py, pw, ph, 14);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign   = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillStyle = '#ffd700';
        ctx.font      = 'bold 30px "Courier New"';
        ctx.fillText('STAGE CLEAR!', w / 2, h / 2 - 38);

        ctx.fillStyle = '#88ffaa';
        ctx.font      = '14px "Courier New"';
        var msg = nextLvlIdx < 2 ? 'Entering World ' + (nextLvlIdx + 2) + '...' : 'All worlds conquered!';
        ctx.fillText(msg, w / 2, h / 2 + 5);

        ctx.fillStyle = '#ffd700';
        ctx.font      = '13px "Courier New"';
        ctx.fillText('SCORE: ' + String(score).padStart(7, '0'), w / 2, h / 2 + 35);

        ctx.fillStyle = '#444466';
        ctx.font      = '11px "Courier New"';
        ctx.fillText('Continuing in a moment...', w / 2, h / 2 + 60);

        ctx.restore();
    }

    function drawGameOver(ctx, w, h, score) {
        ctx.save();

        ctx.fillStyle = 'rgba(4, 0, 12, 0.94)';
        ctx.fillRect(0, 0, w, h);
        _drawStars(ctx, w, h);

        ctx.textAlign   = 'center';
        ctx.textBaseline = 'middle';

        ctx.shadowColor = '#e94560';
        ctx.shadowBlur  = 22;
        ctx.fillStyle   = '#e94560';
        ctx.font        = 'bold 50px "Courier New"';
        ctx.fillText('GAME OVER', w / 2, h / 2 - 50);

        ctx.shadowBlur  = 0;
        ctx.fillStyle   = '#aaaacc';
        ctx.font        = '15px "Courier New"';
        ctx.fillText('FINAL SCORE: ' + String(score).padStart(7, '0'), w / 2, h / 2 + 12);

        if (_blink()) {
            ctx.fillStyle = '#ffd700';
            ctx.font      = '13px "Courier New"';
            ctx.fillText('PRESS SPACE OR CLICK TO RETRY', w / 2, h / 2 + 56);
        }

        ctx.restore();
    }

    function drawWin(ctx, w, h, score, coins) {
        ctx.save();

        var g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#060f06');
        g.addColorStop(1, '#0c1e0c');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        _drawStars(ctx, w, h);

        ctx.textAlign   = 'center';
        ctx.textBaseline = 'middle';

        ctx.shadowColor  = '#00ff88';
        ctx.shadowBlur   = 26;
        ctx.fillStyle    = '#00ff88';
        ctx.font         = 'bold 46px "Courier New"';
        ctx.fillText('YOU WIN!', w / 2, h / 2 - 72);

        ctx.shadowBlur   = 0;
        ctx.fillStyle    = '#ffffff';
        ctx.font         = '19px "Courier New"';
        ctx.fillText('WARLIKE CONQUERED!', w / 2, h / 2 - 26);

        ctx.fillStyle    = '#ffd700';
        ctx.font         = '14px "Courier New"';
        ctx.fillText('FINAL SCORE : ' + String(score).padStart(7, '0'), w / 2, h / 2 + 18);
        ctx.fillText('COINS COLLECTED : ' + coins, w / 2, h / 2 + 42);

        if (_blink()) {
            ctx.fillStyle = '#aaffaa';
            ctx.font      = '12px "Courier New"';
            ctx.fillText('PRESS SPACE OR CLICK TO PLAY AGAIN', w / 2, h / 2 + 84);
        }

        ctx.restore();
    }

    return { drawMenu, drawLevelComplete, drawGameOver, drawWin };
})();