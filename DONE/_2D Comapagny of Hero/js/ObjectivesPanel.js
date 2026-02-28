var RTS = RTS || {};
RTS.Game = RTS.Game || {};

/**
 * ObjectivesPanel — Panneau HUD temps réel (coin supérieur droit).
 *
 * Affiche :
 *  - Chronomètre de partie
 *  - Score VP (barres duelles Allied vs Axis)
 *  - Points de contrôle (compteur + icônes)
 *  - Jauge de domination
 *  - Alertes ponctuelles (capture, événements)
 *
 * API :
 *   panel.update(dt)
 *   panel.render(ctx, canvas)
 *   panel.pushAlert(msg, type)   → 'info'|'warning'|'danger'|'success'
 *   panel.setObjectives(arr)     → depuis VictorySystem
 *   panel.setScore(score)        → depuis VictorySystem
 */

RTS.Game.ObjectivesPanel = function(canvas) {
    this.canvas = canvas;

    this._objectives = [];
    this._score      = null;
    this._gameTime   = 0;

    // Alertes flottantes
    this._alerts     = [];
    this._alertQueue = [];

    // Animation
    this._tick       = 0;
    this._expanded   = true;
    this._hovered    = false;

    // Layout (recalculé au render)
    this._panelX = 0;
    this._panelY = 8;
    this._panelW = 240;

    // Couleurs
    this._col = {
        bg:          'rgba(4,8,22,0.92)',
        bgHover:     'rgba(6,12,30,0.97)',
        border:      'rgba(61,111,255,0.4)',
        borderBright:'rgba(61,111,255,0.85)',
        alliedBlue:  '#4488ff',
        alliedGlow:  'rgba(68,136,255,0.5)',
        axisRed:     '#cc2222',
        axisGlow:    'rgba(204,34,34,0.5)',
        text:        '#c8dcff',
        textDim:     'rgba(120,170,255,0.5)',
        textGold:    '#ffd066',
        vpGreen:     '#44dd88',
        warning:     '#ffaa22',
        danger:      '#ff3333',
        success:     '#44ee88'
    };
};

// ---------------------------------------------------------------------------
//  API
// ---------------------------------------------------------------------------

RTS.Game.ObjectivesPanel.prototype.setObjectives = function(objectives) {
    this._objectives = objectives || [];
};

RTS.Game.ObjectivesPanel.prototype.setScore = function(score) {
    this._score = score;
    if (score) this._gameTime = score.gameTime;
};

/**
 * Pousse une alerte flottante.
 * @param {string} msg   Texte
 * @param {string} type  'info' | 'warning' | 'danger' | 'success'
 */
RTS.Game.ObjectivesPanel.prototype.pushAlert = function(msg, type) {
    this._alertQueue.push({
        msg:   msg,
        type:  type || 'info',
        life:  1.0,
        decay: 0.008
    });
};

// ---------------------------------------------------------------------------
//  UPDATE
// ---------------------------------------------------------------------------

RTS.Game.ObjectivesPanel.prototype.update = function(dt) {
    this._tick += dt;

    // Dépiler alertes (max 3 simultanées)
    while (this._alertQueue.length > 0 && this._alerts.length < 3) {
        this._alerts.push(this._alertQueue.shift());
    }

    // Vieillir alertes
    for (var i = this._alerts.length - 1; i >= 0; i--) {
        this._alerts[i].life -= this._alerts[i].decay;
        if (this._alerts[i].life <= 0) this._alerts.splice(i, 1);
    }
};

// ---------------------------------------------------------------------------
//  RENDER PRINCIPAL
// ---------------------------------------------------------------------------

RTS.Game.ObjectivesPanel.prototype.render = function(ctx, canvas, mouseX, mouseY) {
    var cv = canvas || this.canvas;
    if (!cv) return;
    mouseX = mouseX || 0;
    mouseY = mouseY || 0;

    this._panelW = 236;
    this._panelX = cv.width - this._panelW - 10;

    // Calculer hauteur dynamique
    var lineH  = 18;
    var padV   = 10;
    var secGap = 8;
    var nObj   = this._objectives.length;
    var panelH = 38 + padV + nObj * (lineH * 2.8 + secGap) + padV;

    // Détection hover pour toggle expand
    this._hovered = mouseX >= this._panelX && mouseX <= this._panelX + this._panelW &&
                    mouseY >= this._panelY  && mouseY <= this._panelY  + panelH;

    ctx.save();

    // Ombre portée
    ctx.shadowColor = 'rgba(61,111,255,0.2)';
    ctx.shadowBlur  = 20;

    // Fond
    ctx.fillStyle   = this._hovered ? this._col.bgHover : this._col.bg;
    this._roundRect(ctx, this._panelX, this._panelY, this._panelW, panelH, 5);
    ctx.fill();
    ctx.shadowBlur  = 0;

    // Bordure
    var borderPulse = 0.4 + 0.2 * Math.sin(this._tick * 1.5);
    ctx.strokeStyle = 'rgba(61,111,255,' + borderPulse + ')';
    ctx.lineWidth   = 1.5;
    this._roundRect(ctx, this._panelX, this._panelY, this._panelW, panelH, 5);
    ctx.stroke();

    // Trait supérieur coloré (allié bleu si en avance, rouge sinon)
    var topCol = this._score && this._score.alliedVP >= this._score.axisVP
        ? this._col.alliedBlue : this._col.axisRed;
    ctx.strokeStyle = topCol;
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.moveTo(this._panelX + 5,                  this._panelY + 1);
    ctx.lineTo(this._panelX + this._panelW - 5,   this._panelY + 1);
    ctx.stroke();

    var x = this._panelX + 10;
    var y = this._panelY + padV;

    // Chrono + titre
    y = this._renderHeader(ctx, x, y);

    // Séparateur
    y = this._renderSeparator(ctx, y + 4);

    // Objectifs
    for (var i = 0; i < this._objectives.length; i++) {
        y = this._renderObjective(ctx, x, y + secGap, this._objectives[i]);
    }

    ctx.restore();

    // Alertes flottantes (au-dessus du panneau)
    this._renderAlerts(ctx, cv);
};

// ---------------------------------------------------------------------------
//  HEADER (chrono + titre)
// ---------------------------------------------------------------------------

RTS.Game.ObjectivesPanel.prototype._renderHeader = function(ctx, x, y) {
    var W = this._panelW - 20;

    // Titre
    ctx.fillStyle   = this._col.textDim;
    ctx.font        = '700 9px "Share Tech Mono", monospace';
    ctx.textAlign   = 'left';
    ctx.textBaseline= 'top';
    ctx.fillText('// OBJECTIFS', x, y);

    // Chrono (côté droit)
    if (this._score) {
        var t  = this._score.gameTime || 0;
        var m  = Math.floor(t / 60);
        var s  = Math.floor(t % 60);
        var ts = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;

        ctx.fillStyle = this._col.textGold;
        ctx.font      = '700 11px "Share Tech Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText('⏱ ' + ts, x + W, y + 1);
    }

    return y + 16;
};

// ---------------------------------------------------------------------------
//  SÉPARATEUR
// ---------------------------------------------------------------------------

RTS.Game.ObjectivesPanel.prototype._renderSeparator = function(ctx, y) {
    ctx.strokeStyle = 'rgba(61,111,255,0.2)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(this._panelX + 6,                  y);
    ctx.lineTo(this._panelX + this._panelW - 6,   y);
    ctx.stroke();
    return y + 1;
};

// ---------------------------------------------------------------------------
//  OBJECTIF INDIVIDUEL
// ---------------------------------------------------------------------------

RTS.Game.ObjectivesPanel.prototype._renderObjective = function(ctx, x, y, obj) {
    var W = this._panelW - 20;

    // Label
    ctx.font        = '600 9px "Share Tech Mono", monospace';
    ctx.textAlign   = 'left';
    ctx.textBaseline= 'top';
    ctx.fillStyle   = this._col.textDim;
    ctx.fillText(obj.label.toUpperCase(), x, y);
    y += 13;

    if (obj.type === 'dual_bar') {
        y = this._renderDualBar(ctx, x, y, W, obj);
    } else if (obj.type === 'cp_score') {
        y = this._renderCPScore(ctx, x, y, W, obj);
    } else if (obj.type === 'progress_bar') {
        y = this._renderDominationBar(ctx, x, y, W, obj);
    }

    // Détail
    ctx.font        = '9px "Share Tech Mono", monospace';
    ctx.fillStyle   = this._col.textDim;
    ctx.textAlign   = 'left';
    ctx.fillText(obj.detail, x, y + 2);
    y += 14;

    return y;
};

// ---------------------------------------------------------------------------
//  BARRE DUELLE (VP Allied vs Axis)
// ---------------------------------------------------------------------------

RTS.Game.ObjectivesPanel.prototype._renderDualBar = function(ctx, x, y, W, obj) {
    var barH   = 12;
    var total  = obj.alliedVal + obj.axisVal;
    var aFrac  = total > 0 ? obj.alliedVal / obj.max : 0.5;
    var xFrac  = total > 0 ? obj.axisVal   / obj.max : 0.5;

    // Fond barre
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    this._roundRect(ctx, x, y, W, barH, 2); ctx.fill();

    // Portion alliée (gauche)
    var aW = Math.floor(W * aFrac);
    if (aW > 0) {
        var gA = ctx.createLinearGradient(x, y, x + aW, y);
        gA.addColorStop(0, 'rgba(68,136,255,0.9)');
        gA.addColorStop(1, 'rgba(68,136,255,0.5)');
        ctx.fillStyle = gA;
        this._roundRect(ctx, x, y, aW, barH, 2); ctx.fill();
    }

    // Portion axis (droite)
    var xW = Math.floor(W * xFrac);
    if (xW > 0) {
        var gX = ctx.createLinearGradient(x + W - xW, y, x + W, y);
        gX.addColorStop(0, 'rgba(204,34,34,0.5)');
        gX.addColorStop(1, 'rgba(204,34,34,0.9)');
        ctx.fillStyle = gX;
        this._roundRect(ctx, x + W - xW, y, xW, barH, 2); ctx.fill();
    }

    // Bordure barre
    ctx.strokeStyle = 'rgba(61,111,255,0.3)';
    ctx.lineWidth   = 1;
    this._roundRect(ctx, x, y, W, barH, 2); ctx.stroke();

    // Valeurs
    ctx.font        = '700 9px "Share Tech Mono", monospace';
    ctx.textBaseline= 'middle';
    var midY = y + barH / 2;

    ctx.fillStyle   = '#aaccff';
    ctx.textAlign   = 'left';
    ctx.fillText(obj.alliedVal, x + 4, midY);

    ctx.fillStyle   = '#ff8888';
    ctx.textAlign   = 'right';
    ctx.fillText(obj.axisVal, x + W - 4, midY);

    // Indicateur danger (clignotant si < 20%)
    var pct = aFrac;
    if (pct < 0.2) {
        var blink = Math.sin(this._tick * 6) > 0;
        if (blink) {
            ctx.fillStyle = 'rgba(255,50,50,0.2)';
            this._roundRect(ctx, x, y, W, barH, 2); ctx.fill();
        }
    }

    return y + barH + 4;
};

// ---------------------------------------------------------------------------
//  CP SCORE (icônes points de contrôle)
// ---------------------------------------------------------------------------

RTS.Game.ObjectivesPanel.prototype._renderCPScore = function(ctx, x, y, W, obj) {
    var dotR   = 5;
    var dotGap = (dotR * 2) + 4;
    var total  = obj.total;
    var startX = x + (W - total * dotGap) / 2;

    // Compter les CPs depuis les objectifs
    for (var i = 0; i < total; i++) {
        var cx = startX + i * dotGap + dotR;
        var cy = y + dotR;

        var isAllied = i < obj.alliedVal;
        var isAxis   = i >= total - obj.axisVal;
        var col, glow;

        if (isAllied) {
            col  = this._col.alliedBlue;
            glow = this._col.alliedGlow;
        } else if (isAxis) {
            col  = this._col.axisRed;
            glow = this._col.axisGlow;
        } else {
            col  = 'rgba(120,150,180,0.4)';
            glow = null;
        }

        // Lueur
        if (glow) {
            ctx.shadowColor = glow;
            ctx.shadowBlur  = 6;
        }

        ctx.beginPath();
        ctx.arc(cx, cy, dotR, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Contour
        ctx.strokeStyle = isAllied ? '#7aaaff' : isAxis ? '#ff7777' : 'rgba(120,150,180,0.5)';
        ctx.lineWidth   = 1;
        ctx.stroke();
    }

    // Scores texte
    ctx.font        = '700 10px "Share Tech Mono", monospace';
    ctx.textBaseline= 'top';

    ctx.fillStyle   = this._col.alliedBlue;
    ctx.textAlign   = 'left';
    ctx.fillText(obj.alliedVal + ' / ' + obj.total, x, y + dotR * 2 + 3);

    ctx.fillStyle   = this._col.axisRed;
    ctx.textAlign   = 'right';
    ctx.fillText(obj.axisVal + ' / ' + obj.total, x + W, y + dotR * 2 + 3);

    // Seuil de domination
    var threshX = startX + (obj.threshold - 0.5) * dotGap;
    ctx.strokeStyle = 'rgba(255,210,50,0.7)';
    ctx.lineWidth   = 1.5;
    ctx.setLineDash([3, 2]);
    ctx.beginPath();
    ctx.moveTo(threshX, y - 2);
    ctx.lineTo(threshX, y + dotR * 2 + 2);
    ctx.stroke();
    ctx.setLineDash([]);

    return y + dotR * 2 + 18;
};

// ---------------------------------------------------------------------------
//  BARRE DOMINATION
// ---------------------------------------------------------------------------

RTS.Game.ObjectivesPanel.prototype._renderDominationBar = function(ctx, x, y, W, obj) {
    var barH  = 8;
    var halfW = Math.floor((W - 6) / 2);

    // Barre alliée (gauche → droite)
    var aFrac = Math.min(1, obj.alliedVal / obj.max);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    this._roundRect(ctx, x, y, halfW, barH, 2); ctx.fill();
    if (aFrac > 0) {
        var gA2 = ctx.createLinearGradient(x, y, x + halfW * aFrac, y);
        gA2.addColorStop(0, 'rgba(68,136,255,0.4)');
        gA2.addColorStop(1, 'rgba(68,136,255,0.95)');
        ctx.fillStyle = gA2;
        this._roundRect(ctx, x, y, halfW * aFrac, barH, 2); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(61,111,255,0.3)'; ctx.lineWidth = 1;
    this._roundRect(ctx, x, y, halfW, barH, 2); ctx.stroke();

    // VS central
    ctx.fillStyle   = this._col.textDim;
    ctx.font        = '8px "Share Tech Mono", monospace';
    ctx.textAlign   = 'center';
    ctx.textBaseline= 'middle';
    ctx.fillText('VS', x + halfW + 3, y + barH / 2);

    // Barre axis (gauche → droite, décalée)
    var xOff  = x + halfW + 6;
    var xFrac = Math.min(1, obj.axisVal / obj.max);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    this._roundRect(ctx, xOff, y, halfW, barH, 2); ctx.fill();
    if (xFrac > 0) {
        var gX2 = ctx.createLinearGradient(xOff, y, xOff + halfW * xFrac, y);
        gX2.addColorStop(0, 'rgba(204,34,34,0.4)');
        gX2.addColorStop(1, 'rgba(204,34,34,0.95)');
        ctx.fillStyle = gX2;
        this._roundRect(ctx, xOff, y, halfW * xFrac, barH, 2); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(204,34,34,0.3)'; ctx.lineWidth = 1;
    this._roundRect(ctx, xOff, y, halfW, barH, 2); ctx.stroke();

    // Valeurs en secondes
    ctx.font        = '8px "Share Tech Mono", monospace';
    ctx.textBaseline= 'top';

    ctx.fillStyle   = this._col.alliedBlue;
    ctx.textAlign   = 'left';
    ctx.fillText(Math.floor(obj.alliedVal) + 's', x, y + barH + 2);

    ctx.fillStyle   = this._col.axisRed;
    ctx.textAlign   = 'right';
    ctx.fillText(Math.floor(obj.axisVal)   + 's', x + W, y + barH + 2);

    return y + barH + 14;
};

// ---------------------------------------------------------------------------
//  ALERTES FLOTTANTES
// ---------------------------------------------------------------------------

RTS.Game.ObjectivesPanel.prototype._renderAlerts = function(ctx, cv) {
    var baseY = this._panelY - 8;
    var W     = this._panelW;
    var x     = this._panelX;

    for (var i = this._alerts.length - 1; i >= 0; i--) {
        var a     = this._alerts[i];
        var alpha = Math.min(1, a.life * 3);
        var slideY= (1 - Math.min(1, (1 - a.life) * 4)) * 10;

        var bgCol, textCol, borderCol;
        if      (a.type === 'success') { bgCol='rgba(20,60,30,0.95)';  textCol='#44ee88'; borderCol='rgba(68,220,120,0.7)'; }
        else if (a.type === 'warning') { bgCol='rgba(50,35,0,0.95)';   textCol='#ffcc44'; borderCol='rgba(255,180,40,0.7)'; }
        else if (a.type === 'danger')  { bgCol='rgba(50,8,8,0.95)';    textCol='#ff5555'; borderCol='rgba(220,50,50,0.7)'; }
        else                           { bgCol='rgba(6,14,35,0.95)';   textCol='#88bbff'; borderCol='rgba(80,140,255,0.6)'; }

        var ay = baseY - (this._alerts.length - 1 - i) * 30 - slideY;
        var aH = 22;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle   = bgCol;
        this._roundRect(ctx, x, ay - aH, W, aH, 3); ctx.fill();
        ctx.strokeStyle = borderCol; ctx.lineWidth = 1;
        this._roundRect(ctx, x, ay - aH, W, aH, 3); ctx.stroke();

        ctx.fillStyle   = textCol;
        ctx.font        = '700 10px "Share Tech Mono", monospace';
        ctx.textAlign   = 'center';
        ctx.textBaseline= 'middle';
        ctx.fillText(a.msg, x + W / 2, ay - aH / 2);
        ctx.restore();
    }
};

// ---------------------------------------------------------------------------
//  ÉCRAN DE FIN DE PARTIE
// ---------------------------------------------------------------------------

RTS.Game.ObjectivesPanel.prototype.renderEndScreen = function(ctx, cv, winner, condition, finalStats) {
    var W = cv.width, H = cv.height;

    // Overlay sombre
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.82)';
    ctx.fillRect(0, 0, W, H);

    var panW = 480, panH = 340;
    var px = (W - panW) / 2, py = (H - panH) / 2;

    var isVictory = winner === 'allied';
    var titleCol  = isVictory ? '#4488ff' : '#cc2222';
    var glowCol   = isVictory ? 'rgba(68,136,255,0.3)' : 'rgba(204,34,34,0.3)';

    // Fond panneau
    ctx.shadowColor = glowCol; ctx.shadowBlur = 60;
    ctx.fillStyle   = 'rgba(4,8,22,0.98)';
    this._roundRect(ctx, px, py, panW, panH, 8); ctx.fill();
    ctx.shadowBlur  = 0;

    ctx.strokeStyle = titleCol; ctx.lineWidth = 2;
    this._roundRect(ctx, px, py, panW, panH, 8); ctx.stroke();

    // Trait supérieur
    ctx.strokeStyle = titleCol; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(px + 10, py + 2); ctx.lineTo(px + panW - 10, py + 2);
    ctx.stroke();

    // Titre VICTOIRE / DÉFAITE
    var titleText = isVictory ? '✦ VICTOIRE ✦' : '✕ DÉFAITE ✕';
    var pulse = 0.85 + 0.15 * Math.sin(this._tick * 2);
    ctx.fillStyle   = titleCol;
    ctx.font        = '900 32px "Orbitron", monospace';
    ctx.textAlign   = 'center';
    ctx.textBaseline= 'top';
    ctx.shadowColor = titleCol; ctx.shadowBlur = 20 * pulse;
    ctx.fillText(titleText, px + panW / 2, py + 24);
    ctx.shadowBlur  = 0;

    // Condition de victoire
    var condLabels = {
        vp_bleed:     'Domination des points de victoire',
        domination:   'Contrôle territorial absolu',
        annihilation: 'Annihilation ennemie'
    };
    ctx.fillStyle   = 'rgba(120,170,255,0.7)';
    ctx.font        = '400 11px "Share Tech Mono", monospace';
    ctx.fillText(condLabels[condition] || condition, px + panW / 2, py + 68);

    // Durée
    ctx.fillStyle   = '#ffd066';
    ctx.font        = '700 13px "Share Tech Mono", monospace';
    ctx.fillText('Durée  ' + (finalStats.duration || '—'), px + panW / 2, py + 90);

    // Séparateur
    ctx.strokeStyle = 'rgba(61,111,255,0.25)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(px + 20, py + 114); ctx.lineTo(px + panW - 20, py + 114); ctx.stroke();

    // Stats tableau (Alliés vs Axe)
    var cols  = ['', 'ALLIÉS', 'AXE'];
    var rows  = [
        ['VP restants',   finalStats.alliedVP,                    finalStats.axisVP],
        ['Éliminations',  finalStats.stats.allied.kills,          finalStats.stats.axis.kills],
        ['CPs capturés',  finalStats.stats.allied.cpsCaptured,    finalStats.stats.axis.cpsCaptured],
        ['CPs max',       finalStats.stats.allied.peakCPs,        finalStats.stats.axis.peakCPs]
    ];

    var tX = px + 20, tY = py + 124, rowH = 30, colW = (panW - 40) / 3;

    // En-têtes
    ctx.font      = '700 9px "Share Tech Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#4488ff'; ctx.fillText('ALLIÉS', tX + colW * 1.5, tY);
    ctx.fillStyle = '#cc2222'; ctx.fillText('AXE',    tX + colW * 2.5, tY);
    tY += 18;

    rows.forEach(function(row) {
        // Label
        ctx.fillStyle = 'rgba(120,170,255,0.6)';
        ctx.font      = '400 9px "Share Tech Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(row[0], tX + 4, tY + rowH / 2);

        // Allied val
        ctx.fillStyle = '#aaccff';
        ctx.font      = '700 11px "Share Tech Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(row[1], tX + colW * 1.5, tY + rowH / 2);

        // Axis val
        ctx.fillStyle = '#ff8888';
        ctx.fillText(row[2], tX + colW * 2.5, tY + rowH / 2);

        // Ligne de séparation
        ctx.strokeStyle = 'rgba(40,60,100,0.5)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(tX, tY + rowH); ctx.lineTo(tX + panW - 40, tY + rowH); ctx.stroke();

        tY += rowH;
    });

    // Bouton rejouer
    var btnW = 180, btnH = 38, btnX = px + panW / 2 - btnW / 2, btnY = py + panH - 56;
    var btnHover = false; // simplifié (pas de vrai hover ici)

    ctx.fillStyle = 'rgba(20,40,100,0.9)';
    this._roundRect(ctx, btnX, btnY, btnW, btnH, 4); ctx.fill();
    ctx.strokeStyle = '#4488ff'; ctx.lineWidth = 1.5;
    this._roundRect(ctx, btnX, btnY, btnW, btnH, 4); ctx.stroke();

    ctx.fillStyle   = '#7aaaff';
    ctx.font        = '700 11px "Share Tech Mono", monospace';
    ctx.textAlign   = 'center';
    ctx.textBaseline= 'middle';
    ctx.fillText('▶  RETOUR AU MENU', px + panW / 2, btnY + btnH / 2);

    // Stocker coords du bouton pour détection clic dans Game.js
    this._endBtnBounds = { x:btnX, y:btnY, w:btnW, h:btnH };

    ctx.restore();
};

/**
 * Retourne true si le point (mx,my) est dans le bouton de fin.
 */
RTS.Game.ObjectivesPanel.prototype.isEndButtonClick = function(mx, my) {
    if (!this._endBtnBounds) return false;
    var b = this._endBtnBounds;
    return mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h;
};

// ---------------------------------------------------------------------------
//  UTILITAIRE roundRect
// ---------------------------------------------------------------------------

RTS.Game.ObjectivesPanel.prototype._roundRect = function(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
};