// ui.js — FreeForce 2D

let _dmgFlash = 0;
function triggerDmgFlash() { _dmgFlash = 12; }

// ── HUD principal ──────────────────────────────────
// signature étendue : health, maxHealth, ammo, maxAmmo, score, combo, shieldTimer, rapidTimer, emptyTimer, weapon
function drawUI(health, maxHealth, ammo, maxAmmo, score, combo, shieldTimer, rapidTimer, emptyTimer, weapon) {
    const W  = window.innerWidth;
    const H  = window.innerHeight;
    const px = 28;

    // Flash rouge sur dégâts
    if (_dmgFlash > 0) {
        ctx.save();
        ctx.globalAlpha = (_dmgFlash / 12) * 0.35;
        ctx.fillStyle   = '#ff0000';
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
        _dmgFlash--;
    }

    // ── Barre de vie ──────────────────────────────
    const barW     = Math.min(280, W * 0.28);
    const barH     = 22;
    const bx = px, by = px;
    const healthPct = Math.max(0, health / maxHealth);

    ctx.save();
    ctx.font        = '8px "Press Start 2P", monospace';
    ctx.fillStyle   = '#ffaa00';
    ctx.textAlign   = 'left';
    ctx.shadowColor = '#ff6600';
    ctx.shadowBlur  = 6;
    ctx.fillText('BRO HEALTH', bx, by - 6);
    ctx.shadowBlur  = 0;
    ctx.restore();

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(bx, by, barW, barH);

    let col1 = '#00ff88', col2 = '#00cc66';
    if (healthPct < 0.6) { col1 = '#ffcc00'; col2 = '#ff8800'; }
    if (healthPct < 0.3) { col1 = '#ff3300'; col2 = '#ff0000'; }

    if (healthPct > 0) {
        const grad = ctx.createLinearGradient(bx, by, bx + barW * healthPct, by);
        grad.addColorStop(0, col2);
        grad.addColorStop(1, col1);
        ctx.fillStyle = grad;
        ctx.fillRect(bx + 3, by + 3, (barW - 6) * healthPct, barH - 6);
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fillRect(bx + 3, by + 3, (barW - 6) * healthPct, (barH - 6) * 0.4);
    }
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth   = 2;
    ctx.strokeRect(bx, by, barW, barH);
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth   = 1;
    for (let i = 1; i < 10; i++) {
        const sx = bx + (barW / 10) * i;
        ctx.beginPath(); ctx.moveTo(sx, by + 3); ctx.lineTo(sx, by + barH - 3); ctx.stroke();
    }
    ctx.fillStyle    = 'rgba(255,255,255,0.7)';
    ctx.font         = '7px "Press Start 2P", monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(Math.ceil(health) + '/' + maxHealth, bx + barW / 2, by + barH / 2 + 1);
    ctx.restore();

    // ── Barre munitions ────────────────────────────
    const ammoBarH = 12;
    const ax = px, ay = by + barH + 16;
    const ammoPct  = maxAmmo > 0 ? ammo / maxAmmo : 0;

    ctx.save();
    ctx.font        = '7px "Press Start 2P", monospace';
    ctx.fillStyle   = (emptyTimer > 0) ? '#ff4444' : '#ffaa44';
    ctx.textAlign   = 'left';
    ctx.shadowColor = (emptyTimer > 0) ? '#ff2200' : '#ff6600';
    ctx.shadowBlur  = (emptyTimer > 0) ? 10 : 4;
    ctx.fillText('AMMO', ax, ay - 4);
    ctx.shadowBlur  = 0;
    ctx.restore();

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(ax, ay, barW, ammoBarH);
    if (ammoPct > 0) {
        const ag = ctx.createLinearGradient(ax, ay, ax + barW * ammoPct, ay);
        ag.addColorStop(0, ammoPct < 0.25 ? '#ff2200' : '#ffaa00');
        ag.addColorStop(1, ammoPct < 0.25 ? '#ff5500' : '#ffdd44');
        ctx.fillStyle = ag;
        ctx.fillRect(ax + 2, ay + 2, (barW - 4) * ammoPct, ammoBarH - 4);
    }
    if (emptyTimer > 0 && Math.floor(Date.now() / 80) % 2 === 0) {
        ctx.fillStyle = 'rgba(255,50,0,0.35)';
        ctx.fillRect(ax, ay, barW, ammoBarH);
    }
    ctx.strokeStyle  = ammo === 0 ? '#ff4444' : '#ff8800';
    ctx.lineWidth    = 1.5;
    ctx.strokeRect(ax, ay, barW, ammoBarH);
    ctx.fillStyle    = ammo === 0 ? '#ff4444' : 'rgba(255,200,100,0.8)';
    ctx.font         = '6px "Press Start 2P", monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ammo + '/' + maxAmmo, ax + barW / 2, ay + ammoBarH / 2 + 1);
    ctx.restore();

    // ── Icônes power-ups actifs ────────────────────
    let puX = px;
    const puY = ay + ammoBarH + 20;
    if (shieldTimer > 0) { _drawActivePowerUp(puX, puY, '◈', '#44aaff', shieldTimer, 300, 'SHIELD'); puX += 60; }
    if (rapidTimer  > 0) { _drawActivePowerUp(puX, puY, '⚡', '#ff8800', rapidTimer,  300, 'RAPID');  puX += 60; }

    // ── Score ──────────────────────────────────────
    ctx.save();
    ctx.textAlign   = 'right';
    ctx.font        = '18px "Press Start 2P", monospace';
    ctx.fillStyle   = '#ffdd00';
    ctx.shadowColor = '#ff6600';
    ctx.shadowBlur  = 20;
    ctx.fillText(score.toLocaleString(), W - px, px + 18);
    ctx.shadowBlur  = 0;
    ctx.font        = '7px "Press Start 2P", monospace';
    ctx.fillStyle   = '#ff8800';
    ctx.fillText('SCORE', W - px, px + 4);
    ctx.restore();

    // ── Combo ──────────────────────────────────────
    if (combo > 1) {
        ctx.save();
        const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.06;
        ctx.textAlign   = 'center';
        ctx.font        = `${Math.round(28 * pulse)}px "Press Start 2P", monospace`;
        ctx.fillStyle   = '#ff4400';
        ctx.shadowColor = '#ffaa00';
        ctx.shadowBlur  = 25;
        ctx.fillText(`x${combo} COMBO!`, W / 2, 52);
        ctx.shadowBlur  = 0;
        ctx.restore();
    }

    // ── Arme active (bas droite) ───────────────────
    if (weapon) {
        const wdata = { pistol:{label:'PISTOL',color:'#ffff88'}, shotgun:{label:'SHOTGUN',color:'#ff8800'}, rocket:{label:'ROCKET',color:'#ff4400'}, laser:{label:'LASER',color:'#44ffff'} };
        const wd = wdata[weapon] || wdata.pistol;
        ctx.save();
        ctx.textAlign = 'right';
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillStyle = wd.color;
        ctx.shadowColor = wd.color; ctx.shadowBlur = 12;
        ctx.fillText('▶ ' + wd.label, W - px, H - px - 14);
        ctx.shadowBlur = 0;
        ctx.font = '6px "Press Start 2P", monospace';
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillText('F = SHOOT', W - px, H - px);
        ctx.restore();
    }

    // ── Contrôles (bas gauche) ─────────────────────
    ctx.save();
    ctx.font      = '7px "Press Start 2P", monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.textAlign = 'left';
    ctx.fillText('A/D MOVE  |  ESPACE SAUT(x2)  |  F TIRER  |  SHIFT DASH', px, H - px);
    ctx.restore();
}

// Icône power-up avec arc de timer
function _drawActivePowerUp(x, y, icon, color, timer, maxTimer, label) {
    const r   = 18;
    const pct = timer / maxTimer;
    ctx.save();
    // Fond
    ctx.beginPath(); ctx.arc(x + r, y + r, r + 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 2; ctx.stroke();
    // Arc timer
    ctx.beginPath();
    ctx.arc(x + r, y + r, r + 2, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2);
    ctx.strokeStyle = color; ctx.lineWidth = 3;
    ctx.shadowColor = color; ctx.shadowBlur = 8;
    ctx.stroke(); ctx.shadowBlur = 0;
    // Icône
    ctx.fillStyle    = color;
    ctx.font         = `${r}px "Press Start 2P", monospace`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, x + r, y + r + 1);
    // Label
    ctx.fillStyle    = color;
    ctx.font         = '5px "Press Start 2P", monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(label, x + r, y + r * 2 + 5);
    ctx.restore();
}

// ── Helpers menu ──────────────────────────────────
function _menuPanel(W, H, pw, ph) {
    const px2 = (W - pw) / 2;
    const py2 = (H - ph) / 2;
    ctx.save();
    // Fond global semi-transparent
    ctx.fillStyle = 'rgba(0,0,0,0.86)';
    ctx.fillRect(0, 0, W, H);
    // Panneau
    const grad = ctx.createLinearGradient(px2, py2, px2, py2 + ph);
    grad.addColorStop(0, 'rgba(22,4,0,0.98)');
    grad.addColorStop(1, 'rgba(10,2,0,0.98)');
    ctx.fillStyle = grad;
    ctx.fillRect(px2, py2, pw, ph);
    // Bordure
    ctx.strokeStyle = '#ff5500'; ctx.lineWidth = 2.5;
    ctx.strokeRect(px2, py2, pw, ph);
    // Coins
    const cs = 18;
    ctx.strokeStyle = '#ffaa00'; ctx.lineWidth = 1.5;
    [[px2,py2],[px2+pw-cs,py2],[px2,py2+ph-cs],[px2+pw-cs,py2+ph-cs]]
        .forEach(([cx,cy]) => ctx.strokeRect(cx, cy, cs, cs));
    ctx.restore();
    return { px2, py2 };
}

function _menuTitle(title, sub, cx, y) {
    ctx.save();
    ctx.textAlign   = 'center';
    ctx.font        = '20px "Press Start 2P", monospace';
    ctx.fillStyle   = '#ff6600';
    ctx.shadowColor = '#ff2200'; ctx.shadowBlur = 30;
    ctx.fillText(title, cx, y);
    ctx.shadowBlur  = 0;
    if (sub) {
        ctx.font      = '7px "Press Start 2P", monospace';
        ctx.fillStyle = '#ff8800';
        ctx.fillText(sub, cx, y + 22);
    }
    ctx.restore();
}

function _backBtn(W, H, rects) {
    ctx.save();
    const bw = 140, bh = 28;
    const bx = W / 2 - bw / 2, by = H * 0.88;
    ctx.fillStyle   = 'rgba(255,80,0,0.15)';
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = '#ff5500'; ctx.lineWidth = 1.5;
    ctx.strokeRect(bx, by, bw, bh);
    ctx.textAlign   = 'center';
    ctx.font        = '7px "Press Start 2P", monospace';
    ctx.fillStyle   = '#ff8800';
    ctx.fillText('◄ RETOUR  (ÉCHAP)', W / 2, by + 18);
    ctx.restore();
    rects.push({ x: bx, y: by, w: bw, h: bh, action: 'back' });
}

// ── Menu Principal ─────────────────────────────────
function drawMainMenu(t, selected, items, rects, best) {
    const W = window.innerWidth;
    const H = window.innerHeight;
    rects.length = 0;

    // ── Fond animé : soldats qui courent ──
    ctx.save();
    ctx.globalAlpha = 0.09;
    ctx.fillStyle = '#ff6600';
    for (let i = 0; i < 7; i++) {
        const sx = ((i * 180 + t * 1.2) % (W + 100)) - 50;
        const sy = H * 0.78;
        // silhouette soldier courant
        const leg = Math.sin(t * 0.18 + i * 1.2) * 12;
        ctx.fillRect(sx - 4, sy - 50, 8, 28);        // corps
        ctx.fillRect(sx - 6, sy - 22, 6, 22 + leg);  // jambe G
        ctx.fillRect(sx,     sy - 22, 6, 22 - leg);  // jambe D
        ctx.fillRect(sx - 3, sy - 60, 6, 12);        // tête
        ctx.fillRect(sx + 5, sy - 48, 14, 4);        // arme
    }
    ctx.restore();

    const pw = Math.min(580, W * 0.88);
    const ph = 460;
    const { px2, py2 } = _menuPanel(W, H, pw, ph);
    const cx = W / 2;

    // ── TITRE ──
    ctx.save();
    const titlePulse = 1 + 0.035 * Math.sin(t * 0.06);
    ctx.translate(cx, py2 + 72);
    ctx.scale(titlePulse, titlePulse);
    ctx.textAlign   = 'center';
    ctx.font        = '30px "Press Start 2P", monospace';
    ctx.fillStyle   = '#ff6600';
    ctx.shadowColor = '#ff1100'; ctx.shadowBlur = 45;
    ctx.fillText('FREEFORCE', 0, 0);
    ctx.shadowBlur  = 0;
    ctx.font        = '14px "Press Start 2P", monospace';
    ctx.fillStyle   = '#ffdd00';
    ctx.shadowColor = '#ff8800'; ctx.shadowBlur = 18;
    ctx.fillText('2D', 0, 30);
    ctx.shadowBlur  = 0;
    ctx.restore();

    // ── ITEMS ──
    const itemH   = 44;
    const itemW   = pw - 80;
    const startY  = py2 + 148;

    items.forEach((label, i) => {
        const iy     = startY + i * (itemH + 8);
        const ix     = px2 + 40;
        const isSelected = i === selected;

        // Fond item
        ctx.save();
        if (isSelected) {
            const selGrad = ctx.createLinearGradient(ix, iy, ix + itemW, iy);
            selGrad.addColorStop(0, 'rgba(255,80,0,0.35)');
            selGrad.addColorStop(0.5, 'rgba(255,140,0,0.22)');
            selGrad.addColorStop(1, 'rgba(255,80,0,0.35)');
            ctx.fillStyle = selGrad;
            ctx.fillRect(ix, iy, itemW, itemH);
            ctx.strokeStyle = '#ff6600';
            ctx.lineWidth   = 2;
            ctx.strokeRect(ix, iy, itemW, itemH);
            // Pulse glow
            ctx.shadowColor = '#ff4400';
            ctx.shadowBlur  = 18 + 8 * Math.sin(t * 0.12);
        } else {
            ctx.fillStyle = 'rgba(255,255,255,0.04)';
            ctx.fillRect(ix, iy, itemW, itemH);
            ctx.strokeStyle = 'rgba(255,100,0,0.25)'; ctx.lineWidth = 1;
            ctx.strokeRect(ix, iy, itemW, itemH);
        }

        // Curseur animé
        if (isSelected) {
            ctx.font      = '12px "Press Start 2P", monospace';
            ctx.fillStyle = '#ffdd00';
            const arrowX  = ix + 14 + Math.abs(Math.sin(t * 0.15)) * 5;
            ctx.fillText('►', arrowX, iy + itemH / 2 + 5);
        }

        // Texte
        ctx.textAlign   = 'left';
        ctx.font        = `${isSelected ? 11 : 9}px "Press Start 2P", monospace`;
        ctx.fillStyle   = isSelected ? '#ffffff' : '#cc8855';
        ctx.fillText(label, ix + 42, iy + itemH / 2 + 4);
        ctx.restore();

        rects.push({ x: ix, y: iy, w: itemW, h: itemH, index: i });
    });

    // ── BEST SCORE ──
    if (best > 0) {
        ctx.save();
        ctx.textAlign   = 'center';
        ctx.font        = '7px "Press Start 2P", monospace';
        ctx.fillStyle   = '#ffdd00';
        ctx.shadowColor = '#ff8800'; ctx.shadowBlur = 8;
        ctx.fillText('MEILLEUR : ' + best.toLocaleString(), cx, py2 + ph - 44);
        ctx.shadowBlur  = 0;
        ctx.restore();
    }

    // ── HINT bas ──
    ctx.save();
    ctx.textAlign   = 'center';
    ctx.font        = '6px "Press Start 2P", monospace';
    ctx.fillStyle   = 'rgba(255,180,100,0.45)';
    ctx.fillText('↑ ↓  NAVIGUER    ENTRÉE / CLIC  CONFIRMER', cx, py2 + ph - 18);
    ctx.restore();
}

// ── Sous-écran : Meilleurs Scores ──────────────────
function drawMenuScores(history, rects) {
    rects.length = 0;
    const W = window.innerWidth, H = window.innerHeight;
    const pw = Math.min(540, W * 0.88), ph = 460;
    const { px2, py2 } = _menuPanel(W, H, pw, ph);
    const cx = W / 2;

    _menuTitle('MEILLEURS SCORES', null, cx, py2 + 58);

    // Séparateur
    ctx.save();
    ctx.strokeStyle = '#ff4400'; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.5;
    ctx.beginPath(); ctx.moveTo(px2 + 30, py2 + 78); ctx.lineTo(px2 + pw - 30, py2 + 78); ctx.stroke();
    ctx.restore();

    if (history.length === 0) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillStyle = '#664422';
        ctx.fillText('— AUCUN SCORE —', cx, py2 + 200);
        ctx.fillText('JOUE D\'ABORD !', cx, py2 + 225);
        ctx.restore();
    } else {
        const DIFF_COLORS = { FACILE:'#44ff88', NORMAL:'#ffdd00', DIFFICILE:'#ff8800', BRUTAL:'#ff2200' };
        history.forEach((entry, i) => {
            const rowY = py2 + 102 + i * 38;
            const isTop = i === 0;
            ctx.save();
            // Fond rangée
            ctx.fillStyle = isTop ? 'rgba(255,180,0,0.12)' : (i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.0)');
            ctx.fillRect(px2 + 20, rowY - 6, pw - 40, 32);
            if (isTop) {
                ctx.strokeStyle = '#ffaa00'; ctx.lineWidth = 1; ctx.globalAlpha = 0.4;
                ctx.strokeRect(px2 + 20, rowY - 6, pw - 40, 32);
                ctx.globalAlpha = 1;
            }
            // Rang
            ctx.textAlign   = 'left';
            ctx.font        = `${isTop ? 10 : 8}px "Press Start 2P", monospace`;
            ctx.fillStyle   = isTop ? '#ffdd00' : '#885533';
            ctx.shadowColor = isTop ? '#ff8800' : 'transparent'; ctx.shadowBlur = isTop ? 8 : 0;
            ctx.fillText(i === 0 ? '★' : `${i + 1}.`, px2 + 32, rowY + 16);
            // Score
            ctx.textAlign   = 'center';
            ctx.fillStyle   = isTop ? '#ffffff' : '#cc9966';
            ctx.font        = `${isTop ? 11 : 9}px "Press Start 2P", monospace`;
            ctx.fillText(entry.score.toLocaleString(), cx, rowY + 16);
            // Difficulté
            ctx.textAlign   = 'right';
            ctx.font        = '6px "Press Start 2P", monospace';
            ctx.fillStyle   = DIFF_COLORS[entry.difficulty] || '#aaa';
            ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 6;
            ctx.fillText(entry.difficulty || 'NORMAL', px2 + pw - 60, rowY + 14);
            // Date
            ctx.shadowBlur = 0;
            ctx.fillStyle  = '#664433';
            ctx.font       = '5px "Press Start 2P", monospace';
            ctx.fillText(entry.date || '', px2 + pw - 32, rowY + 24);
            ctx.restore();
        });
    }

    _backBtn(W, H, rects);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font      = '5px "Press Start 2P", monospace';
    ctx.fillStyle = 'rgba(255,150,80,0.3)';
    ctx.fillText('CLIC N\'IMPORTE OÙ POUR RETOURNER', cx, H * 0.93);
    ctx.restore();
}

// ── Sous-écran : Options ───────────────────────────
function drawMenuOptions(diff, diffList, rects) {
    rects.length = 0;
    const W = window.innerWidth, H = window.innerHeight;
    const pw = Math.min(520, W * 0.88), ph = 380;
    const { px2, py2 } = _menuPanel(W, H, pw, ph);
    const cx = W / 2;

    _menuTitle('OPTIONS', null, cx, py2 + 55);

    ctx.save();
    ctx.strokeStyle = '#ff4400'; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.5;
    ctx.beginPath(); ctx.moveTo(px2 + 30, py2 + 74); ctx.lineTo(px2 + pw - 30, py2 + 74); ctx.stroke();
    ctx.restore();

    // Bloc difficulté
    const blockY = py2 + 110;
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fillRect(px2 + 20, blockY, pw - 40, 90);
    ctx.strokeStyle = 'rgba(255,100,0,0.3)'; ctx.lineWidth = 1;
    ctx.strokeRect(px2 + 20, blockY, pw - 40, 90);

    ctx.textAlign = 'left';
    ctx.font      = '8px "Press Start 2P", monospace';
    ctx.fillStyle = '#ff8800';
    ctx.fillText('DIFFICULTÉ', px2 + 38, blockY + 26);

    // Description
    const diffDesc = {
        FACILE:    'Ennemis lents, dégâts réduits',
        NORMAL:    'Expérience équilibrée',
        DIFFICILE: 'Spawn rapide, tirs précis',
        BRUTAL:    'Bonne chance, bro !',
    };
    ctx.font      = '5px "Press Start 2P", monospace';
    ctx.fillStyle = '#885533';
    ctx.fillText(diffDesc[diff] || '', px2 + 38, blockY + 42);
    ctx.restore();

    // Flèche gauche
    const arrowY   = blockY + 55;
    const arrowSz  = 28;
    const diffColors = { FACILE:'#44ff88', NORMAL:'#ffdd00', DIFFICILE:'#ff8800', BRUTAL:'#ff2200' };
    const col = diffColors[diff] || '#ffdd00';

    // Btn ◄
    const lbx = cx - 120, lby = arrowY - arrowSz / 2;
    ctx.save();
    ctx.fillStyle = 'rgba(255,100,0,0.18)';
    ctx.fillRect(lbx, lby, arrowSz, arrowSz);
    ctx.strokeStyle = '#ff5500'; ctx.lineWidth = 1.5; ctx.strokeRect(lbx, lby, arrowSz, arrowSz);
    ctx.textAlign = 'center'; ctx.font = '12px "Press Start 2P", monospace';
    ctx.fillStyle = '#ff8800'; ctx.fillText('◄', lbx + arrowSz / 2, lby + arrowSz / 2 + 5);
    ctx.restore();
    rects.push({ x: lbx, y: lby, w: arrowSz, h: arrowSz, action: 'diff_left' });

    // Valeur difficulté
    ctx.save();
    ctx.textAlign   = 'center';
    ctx.font        = '12px "Press Start 2P", monospace';
    ctx.fillStyle   = col;
    ctx.shadowColor = col; ctx.shadowBlur = 18;
    ctx.fillText(diff, cx, arrowY + 8);
    ctx.shadowBlur  = 0;
    ctx.restore();

    // Btn ►
    const rbx = cx + 92, rby = arrowY - arrowSz / 2;
    ctx.save();
    ctx.fillStyle = 'rgba(255,100,0,0.18)';
    ctx.fillRect(rbx, rby, arrowSz, arrowSz);
    ctx.strokeStyle = '#ff5500'; ctx.lineWidth = 1.5; ctx.strokeRect(rbx, rby, arrowSz, arrowSz);
    ctx.textAlign = 'center'; ctx.font = '12px "Press Start 2P", monospace';
    ctx.fillStyle = '#ff8800'; ctx.fillText('►', rbx + arrowSz / 2, rby + arrowSz / 2 + 5);
    ctx.restore();
    rects.push({ x: rbx, y: rby, w: arrowSz, h: arrowSz, action: 'diff_right' });

    // Indicateurs pastilles difficulté
    diffList.forEach((d, i) => {
        const dotX = cx - (diffList.length * 18) / 2 + i * 18 + 9;
        const dotY = blockY + 85;
        ctx.save();
        ctx.beginPath(); ctx.arc(dotX, dotY, d === diff ? 5 : 3, 0, Math.PI * 2);
        ctx.fillStyle   = d === diff ? col : '#443322';
        ctx.shadowColor = d === diff ? col : 'transparent'; ctx.shadowBlur = d === diff ? 8 : 0;
        ctx.fill();
        ctx.restore();
    });

    _backBtn(W, H, rects);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.font      = '6px "Press Start 2P", monospace';
    ctx.fillStyle = 'rgba(255,150,80,0.4)';
    ctx.fillText('◄ ►  CHANGER    ENTRÉE  CONFIRMER', cx, py2 + ph - 20);
    ctx.restore();
}

// ── Sous-écran : Contrôles ─────────────────────────
function drawMenuControls(rects) {
    rects.length = 0;
    const W = window.innerWidth, H = window.innerHeight;
    const pw = Math.min(580, W * 0.9), ph = 460;
    const { px2, py2 } = _menuPanel(W, H, pw, ph);
    const cx = W / 2;

    _menuTitle('CONTRÔLES', null, cx, py2 + 55);

    ctx.save();
    ctx.strokeStyle = '#ff4400'; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.5;
    ctx.beginPath(); ctx.moveTo(px2 + 30, py2 + 74); ctx.lineTo(px2 + pw - 30, py2 + 74); ctx.stroke();
    ctx.restore();

    const bindings = [
        { key: 'A  /  D',     desc: 'Se déplacer gauche / droite',  color: '#ffdd00' },
        { key: 'ESPACE',      desc: 'Sauter  (double saut)',         color: '#ffdd00' },
        { key: 'F',           desc: 'Tirer',                         color: '#ff8800' },
        { key: 'SHIFT',       desc: 'Dash',                          color: '#ff8800' },
        { key: 'W / ↑',       desc: 'Sauter (alt.)',                 color: '#ffdd00' },
        { key: 'CTRL',        desc: 'Tirer (alt.)',                   color: '#ff8800' },
    ];

    const rowH   = 46;
    const startY = py2 + 96;
    bindings.forEach((b, i) => {
        const ry = startY + i * rowH;
        ctx.save();
        ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0)';
        ctx.fillRect(px2 + 22, ry, pw - 44, rowH - 4);

        // Touche
        const keyW = 120;
        ctx.fillStyle = 'rgba(255,100,0,0.2)';
        ctx.fillRect(px2 + 34, ry + 8, keyW, 26);
        ctx.strokeStyle = b.color + 'aa'; ctx.lineWidth = 1.5;
        ctx.strokeRect(px2 + 34, ry + 8, keyW, 26);
        ctx.textAlign   = 'center';
        ctx.font        = '8px "Press Start 2P", monospace';
        ctx.fillStyle   = b.color;
        ctx.shadowColor = b.color; ctx.shadowBlur = 8;
        ctx.fillText(b.key, px2 + 34 + keyW / 2, ry + 25);
        ctx.shadowBlur  = 0;

        // Description
        ctx.textAlign = 'left';
        ctx.font      = '7px "Press Start 2P", monospace';
        ctx.fillStyle = '#cc9966';
        ctx.fillText(b.desc, px2 + 34 + keyW + 18, ry + 25);
        ctx.restore();
    });

    // Armes section
    const wY = startY + bindings.length * rowH + 10;
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fillRect(px2 + 22, wY, pw - 44, 48);
    ctx.strokeStyle = 'rgba(255,150,0,0.25)'; ctx.lineWidth = 1;
    ctx.strokeRect(px2 + 22, wY, pw - 44, 48);
    ctx.textAlign = 'center';
    ctx.font      = '6px "Press Start 2P", monospace';
    ctx.fillStyle = '#885533';
    ctx.fillText('ARMES RAMASSABLES EN JEU  —  PISTOL  •  SHOTGUN  •  ROCKET  •  LASER', cx, wY + 20);
    ctx.fillStyle = '#664422';
    ctx.fillText('CHAQUE ARME A SON PROPRE STOCK DE MUNITIONS', cx, wY + 36);
    ctx.restore();

    _backBtn(W, H, rects);
}

// ── Game Over ──────────────────────────────────────
function drawGameOver(score, best) {
    const W = window.innerWidth;
    const H = window.innerHeight;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.88)';
    ctx.fillRect(0, 0, W, H);

    const pw  = Math.min(600, W * 0.85);
    const ph  = 340;
    const px2 = (W - pw) / 2;
    const py2 = (H - ph) / 2;

    ctx.fillStyle = 'rgba(30,5,0,0.95)';
    ctx.fillRect(px2, py2, pw, ph);
    ctx.strokeStyle = '#ff3300'; ctx.lineWidth = 3;
    ctx.strokeRect(px2, py2, pw, ph);

    const cs = 18;
    ctx.strokeStyle = '#ffaa00'; ctx.lineWidth = 2;
    [[px2,py2],[px2+pw-cs,py2],[px2,py2+ph-cs],[px2+pw-cs,py2+ph-cs]]
        .forEach(([cx,cy]) => ctx.strokeRect(cx, cy, cs, cs));

    ctx.textAlign = 'center';

    ctx.font        = '24px "Press Start 2P", monospace';
    ctx.fillStyle   = '#ff1a00';
    ctx.shadowColor = '#ff4400'; ctx.shadowBlur = 30;
    ctx.fillText('BRO DOWN!', W / 2, py2 + 75);
    ctx.shadowBlur  = 0;

    ctx.font        = '12px "Press Start 2P", monospace';
    ctx.fillStyle   = '#ffdd00';
    ctx.shadowColor = '#ff8800'; ctx.shadowBlur = 12;
    ctx.fillText(`SCORE: ${score.toLocaleString()}`, W / 2, py2 + 145);

    ctx.font      = '9px "Press Start 2P", monospace';
    ctx.fillStyle = (best > 0 && score >= best) ? '#00ffaa' : '#aaaaaa';
    ctx.shadowBlur = 0;
    ctx.fillText(score >= best ? '★ NEW BEST! ★' : `BEST: ${best.toLocaleString()}`, W / 2, py2 + 185);

    const blink = Math.floor(Date.now() / 500) % 2 === 0;
    if (blink) {
        ctx.font      = '9px "Press Start 2P", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('PRESS SPACE — BRO LIVE AGAIN!', W / 2, py2 + 250);    }
    ctx.restore();
}

// ── Textes flottants ───────────────────────────────
function drawFloatingText(texts) {
    for (const t of texts) {
        ctx.save();
        ctx.globalAlpha  = t.life / t.maxLife;
        ctx.font         = `bold ${t.size}px "Press Start 2P", monospace`;
        ctx.textAlign    = 'center';
        ctx.fillStyle    = t.color;
        ctx.shadowColor  = t.color;
        ctx.shadowBlur   = 10;
        ctx.fillText(t.text, t.x, t.y);
        ctx.restore();
    }
}