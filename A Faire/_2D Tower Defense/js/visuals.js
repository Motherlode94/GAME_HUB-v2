/* Tower Defense enemy sprites — SVG images with two movement frames.
   Draw-only integration; simulation stays in enemy.js. */
'use strict';
const TD_VISUAL_TYPES = Object.freeze(['basic','gunner','rocket','fast','swarm','armored',
    'tank','medic','shield','jammer','ifv','drone','helicopter','boss']);
const tdSpriteCache = new Map();
let tdUseEnemySprites = true;
let tdSpritesLoaded = 0;
function tdLoadEnemySprites() {
    if (typeof Image !== 'function') return;
    for (const type of TD_VISUAL_TYPES) for (let frame = 0; frame < 2; frame++) {
        const key = type + '_' + frame;
        if (tdSpriteCache.has(key)) continue;
        const img = new Image();
        const state = { img, ready: false, failed: false };
        tdSpriteCache.set(key, state);
        img.onload = () => {
            state.ready = img.naturalWidth > 0;
            if (state.ready) tdSpritesLoaded++;
        };
        img.onerror = () => { state.failed = true; };
        img.src = 'assets/enemies/' + key + '.svg';
    }
}
function tdDrawEnemySprite(ctx, enemy) {
    if (!tdUseEnemySprites || !enemy) return false;
    const type = String(enemy.type || '').toLowerCase();
    const frame = Math.floor((enemy.wobble || 0) * 0.6) % 2;
    const data = tdSpriteCache.get(type + '_' + frame);
    if (!data?.ready) return false;
    const air = type === 'drone' || type === 'helicopter';
    const vehicle = air || type === 'tank' || type === 'ifv' || type === 'armored';
    const size = enemy.size * (enemy.isBoss ? 1.95 : vehicle ? 1.85 : 1.9);
    ctx.save();
    ctx.rotate(enemy.facing || 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(data.img, -size / 2, -size / 2, size, size);
    ctx.restore();
    return true;
}
