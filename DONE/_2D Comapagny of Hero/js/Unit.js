var RTS = RTS || {};
RTS.Game = RTS.Game || {};

RTS.Game.Unit = function(x, y, team) {

    this.x = x;
    this.y = y;

    this.team = team; // 'allied' | 'axis'

    this.speed  = 90; // pixels / seconde
    this.radius = 14;

    this.selected = false;

    this.path      = [];
    this.pathIndex = 0;

    this.visionRadius = 220;

    // Angle de rotation visuelle (suit la direction de déplacement)
    this._angle = 0;
};

// ---------------------------------------------------------------------------
//  UPDATE
// ---------------------------------------------------------------------------

RTS.Game.Unit.prototype.update = function(deltaTime) {

    if (this.path.length === 0) return;
    if (this.pathIndex >= this.path.length) return;

    var target = this.path[this.pathIndex];

    var dx   = target.x - this.x;
    var dy   = target.y - this.y;
    var dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 4) {
        this.pathIndex++;
        return;
    }

    // Mémoriser l'angle pour l'affichage
    this._angle = Math.atan2(dy, dx);

    var vx = (dx / dist) * this.speed * deltaTime;
    var vy = (dy / dist) * this.speed * deltaTime;

    this.x += vx;
    this.y += vy;
};

// ---------------------------------------------------------------------------
//  RENDER
// ---------------------------------------------------------------------------

RTS.Game.Unit.prototype.render = function(ctx) {

    ctx.save();

    var x = this.x;
    var y = this.y;
    var r = this.radius;

    var isAllied = this.team === 'allied';
    var baseColor   = isAllied ? '#2d62ff' : '#cc2222';
    var glowColor   = isAllied ? 'rgba(45,98,255,0.35)' : 'rgba(204,34,34,0.35)';
    var accentColor = isAllied ? '#7aaaff' : '#ff7777';

    // --- Preview du chemin (lignes pointillées) ---
    if (this.selected && this.path.length > 0 && this.pathIndex < this.path.length) {
        ctx.save();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = isAllied ? 'rgba(100,160,255,0.55)' : 'rgba(255,100,100,0.55)';
        ctx.lineWidth   = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, y);
        for (var i = this.pathIndex; i < this.path.length; i++) {
            ctx.lineTo(this.path[i].x, this.path[i].y);
        }
        ctx.stroke();
        // Marqueur destination
        var dest = this.path[this.path.length - 1];
        ctx.setLineDash([]);
        ctx.strokeStyle = accentColor;
        ctx.lineWidth   = 1.5;
        ctx.beginPath();
        ctx.moveTo(dest.x - 6, dest.y);
        ctx.lineTo(dest.x + 6, dest.y);
        ctx.moveTo(dest.x, dest.y - 6);
        ctx.lineTo(dest.x, dest.y + 6);
        ctx.stroke();
        ctx.restore();
    }

    // --- Halo de sélection (anneau externe animé) ---
    if (this.selected) {
        ctx.beginPath();
        ctx.arc(x, y, r + 7, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.lineWidth   = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // --- Lueur de fond ---
    var glow = ctx.createRadialGradient(x, y, r * 0.3, x, y, r * 2.2);
    glow.addColorStop(0, glowColor);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, r * 2.2, 0, Math.PI * 2);
    ctx.fill();

    // --- Corps principal ---
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = baseColor;
    ctx.fill();

    // --- Reflet interne (dégradé) ---
    var shine = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, 0, x, y, r);
    shine.addColorStop(0, 'rgba(255,255,255,0.30)');
    shine.addColorStop(1, 'rgba(0,0,0,0.25)');
    ctx.fillStyle = shine;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // --- Bordure ---
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = this.selected ? '#ffffff' : accentColor;
    ctx.lineWidth   = this.selected ? 2.5 : 1.5;
    ctx.stroke();

    // --- Indicateur directionnel (petit triangle pointant vers l'angle de déplacement) ---
    if (this.path.length > 0 && this.pathIndex < this.path.length) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(this._angle);
        ctx.beginPath();
        ctx.moveTo(r - 2, 0);
        ctx.lineTo(r - 7, -4);
        ctx.lineTo(r - 7,  4);
        ctx.closePath();
        ctx.fillStyle = accentColor;
        ctx.fill();
        ctx.restore();
    }

    ctx.restore();
};