window.RTS = window.RTS || {};

RTS.InputManager = function(game) {
    this.game       = game;
    this._dragging  = false;   // LMB drag (sélection)
    this._dragStart = { x: 0, y: 0 };

    // MMB drag (déplacement caméra)
    this._camDragging  = false;
    this._camDragStart = { x: 0, y: 0 };
    this._camOrigin    = { x: 0, y: 0 };

    var self = this;

    game.canvas.addEventListener("mousemove", function(e) {
        var rect = game.canvas.getBoundingClientRect();
        RTS.InputState.mouseX = e.clientX - rect.left;
        RTS.InputState.mouseY = e.clientY - rect.top;

        // Drag sélection LMB
        if (self._dragging) self._updateDragBox(e);

        // Drag caméra MMB
        if (self._camDragging) {
            var dx = (e.clientX - self._camDragStart.x) / game.camera.zoom;
            var dy = (e.clientY - self._camDragStart.y) / game.camera.zoom;
            game.camera.x = self._camOrigin.x - dx;
            game.camera.y = self._camOrigin.y - dy;
            game.camera._clamp();
            // Curseur grab
            game.canvas.style.cursor = "grabbing";
        }
    });

    game.canvas.addEventListener("mousedown", function(e) {
        if (e.button === 0) self._onLMBDown(e);
        if (e.button === 1) self._onMMBDown(e);
        if (e.button === 2) self._onRMB(e);
    });

    game.canvas.addEventListener("mouseup", function(e) {
        if (e.button === 0) self._onLMBUp(e);
        if (e.button === 1) self._onMMBUp(e);
    });

    // Sécurité : relâcher MMB même si souris quitte le canvas
    window.addEventListener("mouseup", function(e) {
        if (e.button === 1) self._onMMBUp(e);
    });

    game.canvas.addEventListener("contextmenu", function(e) { e.preventDefault(); });

    game.canvas.addEventListener("wheel", function(e) {
        e.preventDefault();
        var rect = game.canvas.getBoundingClientRect();
        game.camera.handleZoom(e.deltaY, e.clientX - rect.left, e.clientY - rect.top);
    }, { passive: false });

    window.addEventListener("keydown", function(e) {
        var k = e.key.toLowerCase();
        if (e.key === "Escape") {
            if (RTS.BuildingSystem.isPlacing()) { RTS.BuildingSystem.cancelPlacing(); return; }
            game.squads.forEach(function(s)   { s.selected = false; });
            game.buildings.forEach(function(b) { b.selected = false; });
            game.selectedSquads    = [];
            game.selectedBuildings = [];
        }
        if (k === "a" && !e.ctrlKey) {
            game.squads.forEach(function(s) { s.selected = s.team === "blue"; });
            game.selectedSquads = game.squads.filter(function(s) { return s.team === "blue"; });
        }
    });
};

// ── MMB : déplacement caméra ─────────────────────────────────────────────────

RTS.InputManager.prototype._onMMBDown = function(e) {
    e.preventDefault();
    this._camDragging  = true;
    this._camDragStart = { x: e.clientX, y: e.clientY };
    this._camOrigin    = { x: this.game.camera.x, y: this.game.camera.y };
    this.game.canvas.style.cursor = "grabbing";
};

RTS.InputManager.prototype._onMMBUp = function(e) {
    this._camDragging = false;
    // Restaure le curseur selon le contexte
    this.game.canvas.style.cursor = RTS.BuildingSystem.isPlacing() ? "copy" : "crosshair";
};

// ── LMB : sélection / drag box ────────────────────────────────────────────────

RTS.InputManager.prototype._onLMBDown = function(e) {
    var rect = this.game.canvas.getBoundingClientRect();
    var sx   = e.clientX - rect.left, sy = e.clientY - rect.top;

    if (RTS.BuildingSystem.isPlacing()) {
        var w = this.game.camera.screenToWorld(sx, sy);
        RTS.BuildingSystem.place(this.game, w.x, w.y);
        return;
    }

    this._dragging  = true;
    this._dragStart = { x: sx, y: sy };

    var box = document.getElementById("dragBox");
    box.style.display = "block";
    box.style.left    = sx + "px";
    box.style.top     = sy + "px";
    box.style.width   = "0px";
    box.style.height  = "0px";
};

RTS.InputManager.prototype._updateDragBox = function(e) {
    var rect = this.game.canvas.getBoundingClientRect();
    var sx   = e.clientX - rect.left, sy = e.clientY - rect.top;
    var box  = document.getElementById("dragBox");
    box.style.left   = Math.min(sx, this._dragStart.x) + "px";
    box.style.top    = Math.min(sy, this._dragStart.y) + "px";
    box.style.width  = Math.abs(sx - this._dragStart.x) + "px";
    box.style.height = Math.abs(sy - this._dragStart.y) + "px";
};

RTS.InputManager.prototype._onLMBUp = function(e) {
    document.getElementById("dragBox").style.display = "none";
    if (!this._dragging) return;
    this._dragging = false;

    var rect = this.game.canvas.getBoundingClientRect();
    var sx   = e.clientX - rect.left, sy = e.clientY - rect.top;

    if (Math.abs(sx - this._dragStart.x) < 5 && Math.abs(sy - this._dragStart.y) < 5) {
        this._handleClick(sx, sy);
    } else {
        this._handleDragSelect(
            Math.min(sx, this._dragStart.x), Math.min(sy, this._dragStart.y),
            Math.max(sx, this._dragStart.x), Math.max(sy, this._dragStart.y)
        );
    }
};

RTS.InputManager.prototype._handleClick = function(sx, sy) {
    var world = this.game.camera.screenToWorld(sx, sy);
    var game  = this.game;

    game.squads.forEach(function(s)    { s.selected = false; });
    game.buildings.forEach(function(b) { b.selected = false; });
    game.selectedSquads    = [];
    game.selectedBuildings = [];

    // Bâtiments
    var hitB = null;
    game.buildings.forEach(function(b) {
        var hs = b.size / 2;
        if (world.x > b.x - hs && world.x < b.x + hs &&
            world.y > b.y - hs && world.y < b.y + hs) hitB = b;
    });
    if (hitB) { hitB.selected = true; game.selectedBuildings = [hitB]; return; }

    // Squads
    game.squads.forEach(function(squad) {
        var bounds = squad.getBounds();
        if (world.x > bounds.x && world.x < bounds.x + bounds.w &&
            world.y > bounds.y && world.y < bounds.y + bounds.h) {
            squad.selected = true;
            game.selectedSquads.push(squad);
        }
    });
};

RTS.InputManager.prototype._handleDragSelect = function(sx1, sy1, sx2, sy2) {
    var cam  = this.game.camera;
    var game = this.game;
    var w1   = cam.screenToWorld(sx1, sy1);
    var w2   = cam.screenToWorld(sx2, sy2);

    game.buildings.forEach(function(b) { b.selected = false; });
    game.selectedBuildings = [];
    game.selectedSquads    = [];

    game.squads.forEach(function(s) {
        if (s.team !== "blue") { s.selected = false; return; }
        var inside = s.x >= w1.x && s.x <= w2.x && s.y >= w1.y && s.y <= w2.y;
        s.selected = inside;
        if (inside) game.selectedSquads.push(s);
    });
};

// ── RMB : ordre de déplacement ────────────────────────────────────────────────

RTS.InputManager.prototype._onRMB = function(e) {
    if (RTS.BuildingSystem.isPlacing()) { RTS.BuildingSystem.cancelPlacing(); return; }
    var rect  = this.game.canvas.getBoundingClientRect();
    var world = this.game.camera.screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
    RTS.SquadSystem.orderMove(this.game.selectedSquads, world.x, world.y);
};