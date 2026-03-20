window.RTS = window.RTS || {};

RTS.Camera = function(canvas) {
    this.x = 0;
    this.y = 0;

    this.zoom      = 1;
    this.zoomSpeed = 0.1;
    this.minZoom   = 0.35;
    this.maxZoom   = 2.5;

    this.scrollSpeed = 450;
    this.edgeSize    = 22;

    this.canvas = canvas;

    // Track held keys for WASD scroll
    this._keys = {};
    var self = this;
    window.addEventListener("keydown", function(e) { self._keys[e.key.toLowerCase()] = true;  });
    window.addEventListener("keyup",   function(e) { self._keys[e.key.toLowerCase()] = false; });
};

RTS.Camera.prototype.update = function(delta) {
    var mx = RTS.InputState.mouseX;
    var my = RTS.InputState.mouseY;
    var w  = this.canvas.width;
    var h  = this.canvas.height;
    var sp = this.scrollSpeed * delta;

    // Edge scroll
    if (mx < this.edgeSize)     this.x -= sp;
    if (mx > w - this.edgeSize) this.x += sp;
    if (my < this.edgeSize)     this.y -= sp;
    if (my > h - this.edgeSize) this.y += sp;

    // WASD
    if (this._keys["a"] || this._keys["arrowleft"])  this.x -= sp;
    if (this._keys["d"] || this._keys["arrowright"]) this.x += sp;
    if (this._keys["w"] || this._keys["arrowup"])    this.y -= sp;
    if (this._keys["s"] || this._keys["arrowdown"])  this.y += sp;

    this._clamp();
};

RTS.Camera.prototype._clamp = function() {
    var maxX = RTS.WORLD_W - this.canvas.width  / this.zoom;
    var maxY = RTS.WORLD_H - this.canvas.height / this.zoom;
    this.x = Math.max(0, Math.min(this.x, Math.max(0, maxX)));
    this.y = Math.max(0, Math.min(this.y, Math.max(0, maxY)));
};

RTS.Camera.prototype.handleZoom = function(deltaY, pivotScreenX, pivotScreenY) {
    var oldZoom = this.zoom;

    if (deltaY < 0) this.zoom += this.zoomSpeed;
    else            this.zoom -= this.zoomSpeed;

    this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom));

    // Zoom toward mouse cursor
    if (pivotScreenX !== undefined) {
        this.x += pivotScreenX / oldZoom - pivotScreenX / this.zoom;
        this.y += pivotScreenY / oldZoom - pivotScreenY / this.zoom;
    }

    this._clamp();
};

RTS.Camera.prototype.applyTransform = function(ctx) {
    ctx.setTransform(
        this.zoom, 0,
        0, this.zoom,
        -this.x * this.zoom,
        -this.y * this.zoom
    );
};

// Convert screen pixel → world coordinate
RTS.Camera.prototype.screenToWorld = function(sx, sy) {
    return {
        x: sx / this.zoom + this.x,
        y: sy / this.zoom + this.y
    };
};