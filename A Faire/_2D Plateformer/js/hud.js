// ─────────────────────────────────────────────
//  hud.js  –  in-game heads-up display
// ─────────────────────────────────────────────
var HUD = (function () {

    function draw(ctx, score, lives, coins, levelName, canvasW) {
        ctx.save();

        // Dark bar
        ctx.fillStyle = 'rgba(0, 0, 0, 0.68)';
        ctx.fillRect(0, 0, canvasW, 36);

        // Accent line
        ctx.fillStyle = '#e94560';
        ctx.fillRect(0, 35, canvasW, 2);

        ctx.font        = 'bold 13px "Courier New", monospace';
        ctx.textBaseline = 'middle';

        // ── Lives ──
        ctx.fillStyle = '#ff6b6b';
        ctx.textAlign = 'left';
        ctx.fillText('\u2665 \u00D7 ' + lives, 12, 18);

        // ── Score ──
        ctx.fillStyle = '#ccccee';
        ctx.fillText('SCORE', 110, 18);
        ctx.fillStyle = '#ffd700';
        ctx.fillText(_pad(score, 7), 162, 18);

        // ── Coins ──
        _drawCoinIcon(ctx, 295, 18);
        ctx.fillStyle = '#ffd700';
        ctx.textAlign = 'left';
        ctx.fillText('\u00D7 ' + _pad(coins, 3), 310, 18);

        // ── Level name ──
        ctx.fillStyle = '#88ff88';
        ctx.textAlign = 'right';
        ctx.fillText(levelName, canvasW - 12, 18);

        ctx.restore();
    }

    // Mini coin icon
    function _drawCoinIcon(ctx, cx, cy) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#ffd700';
        ctx.fill();
        ctx.strokeStyle = '#b8860b';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
    }

    function _pad(n, digits) {
        return String(n).padStart(digits, '0');
    }

    return { draw: draw };
})();