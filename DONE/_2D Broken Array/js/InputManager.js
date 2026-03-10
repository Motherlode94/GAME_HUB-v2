window.RTS = window.RTS || {};

RTS.InputManager = function(game) {
    this.game = game;
    this._dragging = false;
    this._dragStart = { x: 0, y: 0 };

    // Camera pan state (mouse middle button / two-finger touch)
    this._camDragging = false;
    this._camDragStart = { x: 0, y: 0 };
    this._camOrigin = { x: 0, y: 0 };

    this._touchPinchDist = 0;
    this._ignoreMouseUntil = 0;

    var self = this;

    game.canvas.addEventListener("mousemove", function(e) {
        if (self._shouldIgnoreMouse()) return;

        var p = self._screenFromClient(e.clientX, e.clientY);
        self._updateMouseState(p.x, p.y);

        if (self._dragging) self._updateDragBoxAt(p.x, p.y);
        if (self._camDragging) self._panCameraTo(e.clientX, e.clientY);
    });

    game.canvas.addEventListener("mousedown", function(e) {
        if (self._shouldIgnoreMouse()) return;

        if (e.button === 0) self._onLMBDown(e);
        if (e.button === 1) self._onMMBDown(e);
        if (e.button === 2) self._onRMB(e);
    });

    game.canvas.addEventListener("mouseup", function(e) {
        if (self._shouldIgnoreMouse()) return;

        if (e.button === 0) self._onLMBUp(e);
        if (e.button === 1) self._onMMBUp();
    });

    // Safety: release pan even when pointer leaves canvas
    window.addEventListener("mouseup", function(e) {
        if (self._shouldIgnoreMouse()) return;
        if (e.button === 1) self._onMMBUp();
    });

    game.canvas.addEventListener("contextmenu", function(e) { e.preventDefault(); });

    game.canvas.addEventListener("wheel", function(e) {
        e.preventDefault();
        var p = self._screenFromClient(e.clientX, e.clientY);
        game.camera.handleZoom(e.deltaY, p.x, p.y);
    }, { passive: false });

    // Touch controls:
    // - 1 finger: tap select / drag-select
    // - 2 fingers: camera pan + pinch zoom
    // - tap empty terrain with selected blue squads: move order
    game.canvas.addEventListener("touchstart", function(e) {
        if (!e.touches || !e.touches.length) return;

        self._ignoreMouseUntil = Date.now() + 800;

        if (e.touches.length === 1) {
            if (self._camDragging) self._onMMBUp();
            var p1 = self._screenFromTouch(e.touches[0]);
            self._updateMouseState(p1.x, p1.y);
            self._onLMBDownAt(p1.x, p1.y);
            self._touchPinchDist = 0;
        } else {
            self._dragging = false;
            self._hideDragBox();

            var mid = self._touchMidpoint(e.touches);
            self._updateMouseState(mid.sx, mid.sy);
            self._onCamDragStart(mid.cx, mid.cy);
            self._touchPinchDist = self._touchDistance(e.touches[0], e.touches[1]);
        }

        e.preventDefault();
    }, { passive: false });

    game.canvas.addEventListener("touchmove", function(e) {
        if (!e.touches || !e.touches.length) return;

        self._ignoreMouseUntil = Date.now() + 800;

        if (e.touches.length === 1) {
            var p1 = self._screenFromTouch(e.touches[0]);
            self._updateMouseState(p1.x, p1.y);
            if (self._camDragging) self._onMMBUp();
            if (self._dragging) self._updateDragBoxAt(p1.x, p1.y);
        } else {
            self._dragging = false;
            self._hideDragBox();

            var mid = self._touchMidpoint(e.touches);
            self._updateMouseState(mid.sx, mid.sy);

            if (!self._camDragging) self._onCamDragStart(mid.cx, mid.cy);
            self._panCameraTo(mid.cx, mid.cy);

            var dist = self._touchDistance(e.touches[0], e.touches[1]);
            if (self._touchPinchDist > 0 && Math.abs(dist - self._touchPinchDist) > 2) {
                var delta = (dist > self._touchPinchDist) ? -80 : 80;
                game.camera.handleZoom(delta, mid.sx, mid.sy);
            }
            self._touchPinchDist = dist;
        }

        e.preventDefault();
    }, { passive: false });

    game.canvas.addEventListener("touchend", function(e) {
        self._ignoreMouseUntil = Date.now() + 800;

        var p = null;
        if (e.changedTouches && e.changedTouches.length) {
            p = self._screenFromTouch(e.changedTouches[0]);
        }

        if (self._dragging && p) self._onLMBUpAt(p.x, p.y, true);

        self._touchPinchDist = 0;
        if (!e.touches || e.touches.length < 2) self._onMMBUp();

        if (!e.touches || e.touches.length === 0) {
            RTS.InputState.mouseX = game.canvas.width / 2;
            RTS.InputState.mouseY = game.canvas.height / 2;
        }

        e.preventDefault();
    }, { passive: false });

    game.canvas.addEventListener("touchcancel", function() {
        self._dragging = false;
        self._hideDragBox();
        self._touchPinchDist = 0;
        self._onMMBUp();

        RTS.InputState.mouseX = game.canvas.width / 2;
        RTS.InputState.mouseY = game.canvas.height / 2;
    }, { passive: false });

    window.addEventListener("keydown", function(e) {
        var k = e.key.toLowerCase();
        if (e.key === "Escape") {
            if (RTS.BuildingSystem.isPlacing()) { RTS.BuildingSystem.cancelPlacing(); return; }
            game.squads.forEach(function(s) { s.selected = false; });
            game.buildings.forEach(function(b) { b.selected = false; });
            game.selectedSquads = [];
            game.selectedBuildings = [];
        }
        if (k === "a" && !e.ctrlKey) {
            game.squads.forEach(function(s) { s.selected = s.team === "blue"; });
            game.selectedSquads = game.squads.filter(function(s) { return s.team === "blue"; });
        }
    });
};

RTS.InputManager.prototype._shouldIgnoreMouse = function() {
    return Date.now() < this._ignoreMouseUntil;
};

RTS.InputManager.prototype._screenFromClient = function(clientX, clientY) {
    var rect = this.game.canvas.getBoundingClientRect();
    var sx = (clientX - rect.left) * (this.game.canvas.width / rect.width);
    var sy = (clientY - rect.top) * (this.game.canvas.height / rect.height);
    return { x: sx, y: sy };
};

RTS.InputManager.prototype._screenFromTouch = function(touch) {
    return this._screenFromClient(touch.clientX, touch.clientY);
};

RTS.InputManager.prototype._touchMidpoint = function(touches) {
    var cx = (touches[0].clientX + touches[1].clientX) / 2;
    var cy = (touches[0].clientY + touches[1].clientY) / 2;
    var p = this._screenFromClient(cx, cy);
    return { cx: cx, cy: cy, sx: p.x, sy: p.y };
};

RTS.InputManager.prototype._touchDistance = function(t1, t2) {
    var dx = t1.clientX - t2.clientX;
    var dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
};

RTS.InputManager.prototype._updateMouseState = function(sx, sy) {
    RTS.InputState.mouseX = sx;
    RTS.InputState.mouseY = sy;
};

RTS.InputManager.prototype._hideDragBox = function() {
    var box = document.getElementById("dragBox");
    if (box) box.style.display = "none";
};

RTS.InputManager.prototype._onCamDragStart = function(clientX, clientY) {
    this._camDragging = true;
    this._camDragStart = { x: clientX, y: clientY };
    this._camOrigin = { x: this.game.camera.x, y: this.game.camera.y };
    this.game.canvas.style.cursor = "grabbing";
};

RTS.InputManager.prototype._panCameraTo = function(clientX, clientY) {
    if (!this._camDragging) return;

    var dx = (clientX - this._camDragStart.x) / this.game.camera.zoom;
    var dy = (clientY - this._camDragStart.y) / this.game.camera.zoom;
    this.game.camera.x = this._camOrigin.x - dx;
    this.game.camera.y = this._camOrigin.y - dy;
    this.game.camera._clamp();
    this.game.canvas.style.cursor = "grabbing";
};

RTS.InputManager.prototype._onMMBDown = function(e) {
    e.preventDefault();
    this._onCamDragStart(e.clientX, e.clientY);
};

RTS.InputManager.prototype._onMMBUp = function() {
    this._camDragging = false;
    this.game.canvas.style.cursor = RTS.BuildingSystem.isPlacing() ? "copy" : "crosshair";
};

RTS.InputManager.prototype._onLMBDown = function(e) {
    var p = this._screenFromClient(e.clientX, e.clientY);
    this._onLMBDownAt(p.x, p.y);
};

RTS.InputManager.prototype._onLMBDownAt = function(sx, sy) {
    if (RTS.BuildingSystem.isPlacing()) {
        var w = this.game.camera.screenToWorld(sx, sy);
        RTS.BuildingSystem.place(this.game, w.x, w.y);
        return;
    }

    this._dragging = true;
    this._dragStart = { x: sx, y: sy };

    var box = document.getElementById("dragBox");
    box.style.display = "block";
    box.style.left = sx + "px";
    box.style.top = sy + "px";
    box.style.width = "0px";
    box.style.height = "0px";
};

RTS.InputManager.prototype._updateDragBox = function(e) {
    var p = this._screenFromClient(e.clientX, e.clientY);
    this._updateDragBoxAt(p.x, p.y);
};

RTS.InputManager.prototype._updateDragBoxAt = function(sx, sy) {
    var box = document.getElementById("dragBox");
    box.style.left = Math.min(sx, this._dragStart.x) + "px";
    box.style.top = Math.min(sy, this._dragStart.y) + "px";
    box.style.width = Math.abs(sx - this._dragStart.x) + "px";
    box.style.height = Math.abs(sy - this._dragStart.y) + "px";
};

RTS.InputManager.prototype._onLMBUp = function(e) {
    var p = this._screenFromClient(e.clientX, e.clientY);
    this._onLMBUpAt(p.x, p.y, false);
};

RTS.InputManager.prototype._onLMBUpAt = function(sx, sy, fromTouch) {
    this._hideDragBox();
    if (!this._dragging) return;
    this._dragging = false;

    if (Math.abs(sx - this._dragStart.x) < 5 && Math.abs(sy - this._dragStart.y) < 5) {
        this._handleClick(sx, sy, !!fromTouch);
    } else {
        this._handleDragSelect(
            Math.min(sx, this._dragStart.x),
            Math.min(sy, this._dragStart.y),
            Math.max(sx, this._dragStart.x),
            Math.max(sy, this._dragStart.y)
        );
    }
};

RTS.InputManager.prototype._handleClick = function(sx, sy, fromTouch) {
    var world = this.game.camera.screenToWorld(sx, sy);
    var game = this.game;
    var prevSelected = game.selectedSquads.slice();

    game.squads.forEach(function(s) { s.selected = false; });
    game.buildings.forEach(function(b) { b.selected = false; });
    game.selectedSquads = [];
    game.selectedBuildings = [];

    var hitB = null;
    game.buildings.forEach(function(b) {
        var hs = b.size / 2;
        if (world.x > b.x - hs && world.x < b.x + hs && world.y > b.y - hs && world.y < b.y + hs) {
            hitB = b;
        }
    });
    if (hitB) {
        hitB.selected = true;
        game.selectedBuildings = [hitB];
        return;
    }

    game.squads.forEach(function(squad) {
        var bounds = squad.getBounds();
        if (world.x > bounds.x && world.x < bounds.x + bounds.w && world.y > bounds.y && world.y < bounds.y + bounds.h) {
            squad.selected = true;
            game.selectedSquads.push(squad);
        }
    });

    // Mobile fallback for RMB: tap empty terrain to move selected units.
    if (fromTouch && game.selectedSquads.length === 0 && prevSelected.length > 0) {
        var movable = prevSelected.filter(function(s) { return s && s.team === "blue"; });
        movable.forEach(function(s) { s.selected = true; });
        game.selectedSquads = movable;
        RTS.SquadSystem.orderMove(game.selectedSquads, world.x, world.y);
    }
};

RTS.InputManager.prototype._handleDragSelect = function(sx1, sy1, sx2, sy2) {
    var cam = this.game.camera;
    var game = this.game;
    var w1 = cam.screenToWorld(sx1, sy1);
    var w2 = cam.screenToWorld(sx2, sy2);

    game.buildings.forEach(function(b) { b.selected = false; });
    game.selectedBuildings = [];
    game.selectedSquads = [];

    game.squads.forEach(function(s) {
        if (s.team !== "blue") { s.selected = false; return; }
        var inside = s.x >= w1.x && s.x <= w2.x && s.y >= w1.y && s.y <= w2.y;
        s.selected = inside;
        if (inside) game.selectedSquads.push(s);
    });
};

RTS.InputManager.prototype._onRMB = function(e) {
    var p = this._screenFromClient(e.clientX, e.clientY);
    this._onRMBAt(p.x, p.y);
};

RTS.InputManager.prototype._onRMBAt = function(sx, sy) {
    if (RTS.BuildingSystem.isPlacing()) {
        RTS.BuildingSystem.cancelPlacing();
        return;
    }
    var world = this.game.camera.screenToWorld(sx, sy);
    RTS.SquadSystem.orderMove(this.game.selectedSquads, world.x, world.y);
};
