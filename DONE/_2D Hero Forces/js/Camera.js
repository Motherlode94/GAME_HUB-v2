var RTS = RTS || {};
RTS.Engine = RTS.Engine || {};

RTS.Engine.Camera = function(viewWidth, viewHeight, mapWidth, mapHeight) {
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;

    this.zoom    = 1.0;
    this.minZoom = 0.1;
    this.maxZoom = 2.5;

    this.speed    = 14;
    this.edgeSize = 14;

    this.viewWidth  = viewWidth;
    this.viewHeight = viewHeight;
    this.mapWidth   = mapWidth;
    this.mapHeight  = mapHeight;

    this.lerpFactor = 0.24;
    this._inputLockFrames = 0;
};

RTS.Engine.Camera.prototype.update = function(mouseX, mouseY, keys) {
    keys = keys || {};
    var speed = this.speed / this.zoom;

    if (this._inputLockFrames > 0) {
        this._inputLockFrames--;
    } else {
        if (mouseX < this.edgeSize)                   this.targetX -= speed;
        if (mouseX > this.viewWidth  - this.edgeSize) this.targetX += speed;
        if (mouseY < this.edgeSize)                   this.targetY -= speed;
        if (mouseY > this.viewHeight - this.edgeSize) this.targetY += speed;

        if (keys['q'] || keys['Q']) this.targetX -= speed;
        if (keys['d'] || keys['D']) this.targetX += speed;
        if (keys['z'] || keys['Z']) this.targetY -= speed;
        if (keys['s'] || keys['S']) this.targetY += speed;
    }

    this.x += (this.targetX - this.x) * this.lerpFactor;
    this.y += (this.targetY - this.y) * this.lerpFactor;
};

RTS.Engine.Camera.prototype.applyZoom = function(deltaY, mouseX, mouseY) {
    var oldZoom = this.zoom;
    var factor  = deltaY > 0 ? 0.9 : 1.1;
    this.zoom   = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom * factor));

    var worldMouseX = this.x + mouseX / oldZoom;
    var worldMouseY = this.y + mouseY / oldZoom;
    this.x       = worldMouseX - mouseX / this.zoom;
    this.y       = worldMouseY - mouseY / this.zoom;
    this.targetX = this.x;
    this.targetY = this.y;
};

RTS.Engine.Camera.prototype.worldToScreen = function(worldX, worldY) {
    return {
        x: (worldX - this.x) * this.zoom,
        y: (worldY - this.y) * this.zoom
    };
};

RTS.Engine.Camera.prototype.screenToWorld = function(screenX, screenY) {
    return {
        x: screenX / this.zoom + this.x,
        y: screenY / this.zoom + this.y
    };
};

RTS.Engine.Camera.prototype.isInView = function(worldX, worldY, margin) {
    margin = margin || 0;
    var s = this.worldToScreen(worldX, worldY);
    return s.x > -margin && s.x < this.viewWidth  + margin &&
           s.y > -margin && s.y < this.viewHeight + margin;
};

RTS.Engine.Camera.prototype.getViewBounds = function() {
    return {
        x:      this.x,
        y:      this.y,
        width:  this.viewWidth  / this.zoom,
        height: this.viewHeight / this.zoom
    };
};

RTS.Engine.Camera.prototype.snapTo = function(worldX, worldY) {
    this.x = this.targetX = worldX - (this.viewWidth  / this.zoom) / 2;
    this.y = this.targetY = worldY - (this.viewHeight / this.zoom) / 2;
    this._inputLockFrames = 10;
};

RTS.Engine.Camera.prototype.panByScreenDelta = function(deltaX, deltaY) {
    this.targetX -= deltaX / this.zoom;
    this.targetY -= deltaY / this.zoom;
};