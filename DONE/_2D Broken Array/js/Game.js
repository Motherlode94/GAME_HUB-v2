window.RTS = window.RTS || {};

RTS.WORLD_W = 2400;
RTS.WORLD_H = 2400;

RTS.Game = function(canvas) {
    this.canvas = canvas;
    this.ctx    = canvas.getContext("2d");
    this.camera = new RTS.Camera(canvas);

    this.squads            = [];   // toutes les entités (remplace units)
    this.buildings         = [];
    this.projectiles       = [];
    this.particles         = [];
    this.craters           = [];
    this.resourceNodes     = [];
    this.selectedSquads    = [];
    this.selectedBuildings = [];

    this.resources = { gold: 200, fuel: 100, ammo: 80 };

    this.wave     = 1;
    this.gameOver = false;

    this.width  = canvas.width;
    this.height = canvas.height;
};