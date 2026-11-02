window.RTS = window.RTS || {};

RTS.GameLoop = function(update, render) {
    this.update   = update;
    this.render   = render;
    this.lastTime = null;
    this._rafId   = null;
    this._running = false;
};

RTS.GameLoop.prototype.start = function() {
    this._running = true;
    requestAnimationFrame(this.loop.bind(this));
};

RTS.GameLoop.prototype.stop = function() {
    this._running = false;
    if (this._rafId) {
        cancelAnimationFrame(this._rafId);
        this._rafId = null;
    }
    this.lastTime = null;
};

RTS.GameLoop.prototype.loop = function(time) {
    if (!this._running) return;

    if (this.lastTime === null) {
        this.lastTime = time;
        this._rafId   = requestAnimationFrame(this.loop.bind(this));
        return;
    }

    var delta = (time - this.lastTime) / 1000;
    this.lastTime = time;
    if (delta > 0.1) delta = 0.1;

    this.update(delta);
    this.render();

    this._rafId = requestAnimationFrame(this.loop.bind(this));
};