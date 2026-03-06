var RTS = RTS || {};
RTS.Game = RTS.Game || {};

RTS.Game.Building = function(x, y, team, type) {
    this.x    = x;
    this.y    = y;
    this.team = team;
    this.type = type;

    var stats     = RTS.Game.Building.STATS[type] || RTS.Game.Building.STATS.hq;
    this.w        = stats.w;
    this.h        = stats.h;
    this.maxQueue = stats.maxQueue;
    this.produces = stats.produces;
    this.label    = stats.label;

    this.queue  = [];
    this.rallyX = x;
    this.rallyY = y + this.h / 2 + 60;

    this.isBuilt         = true;
    this.buildProgress   = 1.0;
    this.buildTime       = stats.buildTime || 0;
    this._buildTimeLeft  = 0;

    this._time      = 0;
    this._buildAnim = 0;
};

// ---------------------------------------------------------------------------
//  STATS
// ---------------------------------------------------------------------------

RTS.Game.Building.STATS = {
    hq: {
        w:80, h:60, maxQueue:4, buildTime:0, label:'QG',
        produces: [
            { unitType:'rifle',   cost:{manpower:280},              time:15, label:'Fusiliers',   key:'Q' },
            { unitType:'mg',      cost:{manpower:360},              time:22, label:'Mitrailleur', key:'W' },
            { unitType:'pioneer', cost:{manpower:200},              time:12, label:'Pionniers',   key:'E' }
        ],
        constructs: [
            { buildingType:'barracks',    cost:{manpower:200},           time:45, label:'Caserne',         key:'Z' },
            { buildingType:'support',     cost:{manpower:180},           time:40, label:'Soutien',          key:'X' },
            { buildingType:'motor_pool',  cost:{manpower:260,fuel:25},   time:55, label:'Parc Motorisé',    key:'C' },
            { buildingType:'tank_depot',  cost:{manpower:400,fuel:60},   time:80, label:'Dépôt Blindés',    key:'V' },
            { buildingType:'airfield',    cost:{manpower:350,fuel:80},   time:90, label:'Terrain Aviation', key:'B' }
        ]
    },
    barracks: {
        w:70, h:50, maxQueue:5, buildTime:45, label:'CASERNE',
        produces: [
            { unitType:'rifle',       cost:{manpower:240},                   time:12, label:'Fusiliers',      key:'Q' },
            { unitType:'assault',     cost:{manpower:340,munitions:20},      time:18, label:'Assault',        key:'W' },
            { unitType:'mg',          cost:{manpower:320},                   time:20, label:'Mitrailleur',    key:'E' },
            { unitType:'sniper',      cost:{manpower:340,munitions:25},      time:20, label:'Sniper',         key:'R' },
            { unitType:'mortar',      cost:{manpower:300,munitions:15},      time:22, label:'Mortier',        key:'T' },
            { unitType:'flamethrower',cost:{manpower:380,munitions:30},      time:24, label:'Lance-Flammes',  key:'Y' },
            { unitType:'paratrooper', cost:{manpower:460,munitions:35},      time:28, label:'Parachutistes',  key:'U' },
            { unitType:'officer',     cost:{manpower:420},                   time:26, label:'Officier',       key:'I' },
            { unitType:'ranger',      cost:{manpower:500,munitions:40},      time:30, label:'Rangers',        key:'O' },
            { unitType:'commando',    cost:{manpower:520,munitions:50},      time:32, label:'Commando',       key:'P' }
        ]
    },
    support: {
        w:65, h:48, maxQueue:4, buildTime:40, label:'SOUTIEN',
        produces: [
            { unitType:'pioneer',        cost:{manpower:180},                   time:12, label:'Pionniers',       key:'Q' },
            { unitType:'at_inf',         cost:{manpower:380,munitions:30},      time:25, label:'Anti-Tank',       key:'W' },
            { unitType:'medic',          cost:{manpower:260},                   time:18, label:'Médecin',         key:'E' },
            { unitType:'sniper',         cost:{manpower:340,munitions:20},      time:22, label:'Sniper',          key:'R' },
            { unitType:'combat_engineer',cost:{manpower:320,munitions:20},      time:20, label:'Eng. Combat',     key:'T' },
            { unitType:'at_gun',         cost:{manpower:400,munitions:40},      time:30, label:'Canon AT 57mm',   key:'Y' },
            { unitType:'gun_17pdr',      cost:{manpower:520,munitions:60},      time:38, label:'Canon 17-Pdr',    key:'U' }
        ]
    },
    motor_pool: {
        w:85, h:60, maxQueue:3, buildTime:55, label:'PARC MOT.',
        produces: [
            { unitType:'jeep',           cost:{manpower:200,fuel:15},              time:18, label:'Jeep',            key:'Q' },
            { unitType:'recon_car',      cost:{manpower:220,fuel:20},              time:20, label:'Recon',           key:'W' },
            { unitType:'halftrack',      cost:{manpower:340,fuel:30},              time:28, label:'Half-Track',      key:'E' },
            { unitType:'anti_inf_car',   cost:{manpower:380,fuel:35},              time:30, label:'Anti-Inf Car',    key:'R' },
            { unitType:'artillery_truck',cost:{manpower:420,fuel:50,munitions:30}, time:38, label:'Artillerie',      key:'T' },
            { unitType:'aa_halftrack',   cost:{manpower:360,fuel:30,munitions:20}, time:28, label:'AA Half-Track',   key:'Y' },
            { unitType:'bofors',         cost:{manpower:380,munitions:35},         time:32, label:'Bofors 40mm',     key:'U' },
            { unitType:'m7_priest',      cost:{manpower:500,fuel:65,munitions:40}, time:42, label:'M7 Priest',       key:'I' }
        ]
    },
    tank_depot: {
        w:95, h:70, maxQueue:2, buildTime:80, label:'DÉPÔT BLINDÉS',
        produces: [
            { unitType:'sherman',        cost:{manpower:540,fuel:75},      time:40, label:'Sherman M4',     key:'Q' },
            { unitType:'tank_destroyer', cost:{manpower:600,fuel:90},      time:45, label:'Tank Destroyer', key:'W' },
            { unitType:'m10_wolverine',  cost:{manpower:560,fuel:80},      time:38, label:'M10 Wolverine',  key:'E' },
            { unitType:'heavy_tank',     cost:{manpower:720,fuel:120},     time:55, label:'Heavy Tank',     key:'R' },
            { unitType:'calliope',       cost:{manpower:650,fuel:100,munitions:50}, time:50, label:'Calliope',      key:'T' }
        ]
    },
    airfield: {
        w:110, h:75, maxQueue:2, buildTime:90, label:'AVIATION',
        produces: [
            { unitType:'heli_transport', cost:{manpower:380,fuel:60},              time:35, label:'Hélico Transport',  key:'Q' },
            { unitType:'heli_attack',    cost:{manpower:480,fuel:90},              time:45, label:'Hélico Attaque',    key:'W' },
            { unitType:'airstrike',      cost:{manpower:0,munitions:120,fuel:0},   time:20, label:'Frappe Aérienne',   key:'E' },
            { unitType:'p47_thunderbolt',cost:{manpower:0,munitions:150,fuel:30},  time:25, label:'P-47 Thunderbolt',  key:'R' }
        ]
    }
};

RTS.Game.Building.COLORS = {
    allied: { fill:'#1a2e5a', border:'#4477ff', roof:'#0d1f3c', accent:'#7aaaff', text:'#7aaaff', ghost:'rgba(70,130,255,0.25)' },
    axis:   { fill:'#3a1010', border:'#cc2222', roof:'#250a0a', accent:'#ff7777', text:'#ff7777', ghost:'rgba(220,50,50,0.25)' }
};

// ---------------------------------------------------------------------------
//  CONSTRUCTION
// ---------------------------------------------------------------------------

RTS.Game.Building.prototype.startBuilding = function() {
    this.isBuilt        = false;
    this.buildProgress  = 0;
    this._buildTimeLeft = this.buildTime;
};

// ---------------------------------------------------------------------------
//  UPDATE
// ---------------------------------------------------------------------------

RTS.Game.Building.prototype.update = function(dt) {
    this._time      += dt;
    this._buildAnim += dt;

    if (!this.isBuilt) {
        this._buildTimeLeft -= dt;
        this.buildProgress   = Math.max(0, 1 - this._buildTimeLeft / this.buildTime);
        if (this._buildTimeLeft <= 0) { this.isBuilt=true; this.buildProgress=1; }
        return null;
    }

    if (this.queue.length === 0) return null;
    this.queue[0].timeLeft -= dt;
    if (this.queue[0].timeLeft <= 0) {
        var done = this.queue.shift();
        return done.unitType;
    }
    return null;
};

// ---------------------------------------------------------------------------
//  PRODUCTION
// ---------------------------------------------------------------------------

RTS.Game.Building.prototype.enqueue = function(unitType, buildTime) {
    if (!this.isBuilt) return false;
    if (this.queue.length >= this.maxQueue) return false;
    this.queue.push({ unitType:unitType, timeLeft:buildTime, totalTime:buildTime });
    return true;
};

// ---------------------------------------------------------------------------
//  RENDER
// ---------------------------------------------------------------------------

RTS.Game.Building.prototype.render = function(ctx) {
    ctx.save();
    var col = RTS.Game.Building.COLORS[this.team] || RTS.Game.Building.COLORS.allied;
    var bx = this.x - this.w/2, by = this.y - this.h/2;
    var w = this.w, h = this.h;

    if (!this.isBuilt) { this._renderGhost(ctx,col,bx,by,w,h); ctx.restore(); return; }

    ctx.fillStyle='rgba(0,0,0,0.4)'; ctx.fillRect(bx+5,by+5,w,h);
    ctx.fillStyle=col.fill; ctx.fillRect(bx,by,w,h);
    ctx.fillStyle=col.roof; ctx.fillRect(bx,by,w,h*0.28);
    ctx.strokeStyle=col.border; ctx.lineWidth=2; ctx.strokeRect(bx,by,w,h);

    var pulse=0.6+Math.sin(this._time*2)*0.4;
    ctx.save(); ctx.globalAlpha=0.2*pulse;
    ctx.strokeStyle=col.border; ctx.lineWidth=6; ctx.strokeRect(bx-3,by-3,w+6,h+6);
    ctx.restore();

    ctx.fillStyle=col.accent+'55';
    for (var i=0;i<3;i++) {
        var wx=bx+w*0.12+i*(w*0.28), wy=by+h*0.40;
        ctx.fillRect(wx,wy,w*0.18,h*0.22);
        ctx.strokeStyle=col.accent+'88'; ctx.lineWidth=1; ctx.strokeRect(wx,wy,w*0.18,h*0.22);
    }

    ctx.fillStyle=col.text; ctx.font='bold 9px "Courier New"';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(this.label, this.x, by+h*0.14);

    if (this.queue.length>0) {
        var item=this.queue[0], prog=1-item.timeLeft/item.totalTime;
        var barW=w-6, barH=6, barX=bx+3, barY=by+h+4;
        ctx.fillStyle='rgba(0,0,0,0.7)'; ctx.fillRect(barX,barY,barW,barH);
        ctx.fillStyle=col.accent; ctx.fillRect(barX,barY,barW*prog,barH);
        ctx.strokeStyle=col.border; ctx.lineWidth=1; ctx.strokeRect(barX,barY,barW,barH);
        var dots=Math.floor(this._buildAnim*2)%4;
        ctx.fillStyle=col.text; ctx.font='8px "Courier New"'; ctx.textAlign='center'; ctx.textBaseline='top';
        ctx.fillText(item.unitType.toUpperCase().substring(0,6)+' '+'.'.repeat(dots),this.x,barY+barH+2);
        for (var q=0;q<this.queue.length;q++) {
            ctx.fillStyle=q===0?col.accent:col.fill; ctx.fillRect(bx+3+q*14,barY+barH+14,10,10);
            ctx.strokeStyle=col.border; ctx.lineWidth=1; ctx.strokeRect(bx+3+q*14,barY+barH+14,10,10);
        }
    }

    ctx.strokeStyle=col.border+'66'; ctx.lineWidth=1; ctx.setLineDash([3,4]);
    ctx.beginPath(); ctx.moveTo(this.x,this.y+h/2); ctx.lineTo(this.rallyX,this.rallyY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.arc(this.rallyX,this.rallyY,5,0,Math.PI*2);
    ctx.fillStyle=col.accent+'88'; ctx.fill();
    ctx.strokeStyle=col.border; ctx.lineWidth=1.5; ctx.stroke();

    ctx.restore();
};

RTS.Game.Building.prototype._renderGhost = function(ctx,col,bx,by,w,h) {
    var progress = this.buildProgress;
    var drawn    = Math.floor(h * progress);
    ctx.fillStyle=col.ghost; ctx.fillRect(bx,by,w,h);
    ctx.strokeStyle=col.accent+'88'; ctx.lineWidth=1.5; ctx.setLineDash([4,4]);
    ctx.strokeRect(bx,by,w,h); ctx.setLineDash([]);
    if (drawn > 0) { ctx.fillStyle=col.fill; ctx.fillRect(bx, by+h-drawn, w, drawn); }
    var barX=bx, barY=by+h+4, barW=w, barH=5;
    ctx.fillStyle='rgba(0,0,0,0.7)'; ctx.fillRect(barX,barY,barW,barH);
    ctx.fillStyle=col.accent; ctx.fillRect(barX,barY,barW*progress,barH);
    ctx.strokeStyle=col.border; ctx.lineWidth=1; ctx.strokeRect(barX,barY,barW,barH);
    ctx.fillStyle=col.text; ctx.font='8px "Courier New"';
    ctx.textAlign='center'; ctx.textBaseline='top';
    ctx.fillText('EN CONSTRUCTION '+Math.round(progress*100)+'%',this.x,barY+barH+2);
};