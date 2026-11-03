window.RTS = window.RTS || {};

RTS.Unit = function(x, y, team, opts) {
    opts = opts || {};

    this.x = x;
    this.y = y;
    this.team = team;

    this.hp    = opts.hp    || 100;
    this.maxHp = opts.hp    || 100;
    this.speed = opts.speed || 80;
    this.size  = opts.size  || 20;

    this.attackRange  = opts.attackRange  || 70;
    this.attackDamage = opts.attackDamage || 15;
    this.attackRate   = opts.attackRate   || 1.0;   // attacks/second
    this.attackTimer  = 0;

    this.target   = null;
    this.selected = false;

    // Visual
    this.flashTimer = 0;   // hit flash
};