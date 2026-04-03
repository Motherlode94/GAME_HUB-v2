var RTS = RTS || {};
RTS.Game = RTS.Game || {};

RTS.Game.Building = function(x, y, team, type) {
    this.x    = x;
    this.y    = y;
    this.team = team;
    this.type = type;

    var stats      = RTS.Game.Building.STATS[type] || RTS.Game.Building.STATS.hq;
    this.w         = stats.w;
    this.h         = stats.h;
    this.maxQueue  = stats.maxQueue;
    this.produces  = stats.produces || [];
    this.constructs = stats.constructs || [];
    this.upgrades  = stats.upgrades || [];
    this.label     = stats.label;

    this.queue  = [];
    this.rallyX = x;
    this.rallyY = y + this.h / 2 + 60;

    this.isBuilt        = true;
    this.buildProgress  = 1.0;
    this.buildTime      = stats.buildTime || 0;
    this._buildTimeLeft = 0;

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
            { unitType:'pioneer', cost:{manpower:120}, time:10, label:'Pionniers', key:'A', minTier:1, desc:'Construction et reparations' }
        ],
        upgrades: [
            { id:'battle_phase_1', targetTier:2, requiresTier:1, cost:{manpower:140,fuel:15}, time:35, key:'1', label:'Phase Combat I', desc:'Debloque le Tier 2' },
            { id:'battle_phase_2', targetTier:3, requiresTier:2, cost:{manpower:200,fuel:28}, time:45, key:'2', label:'Phase Combat II', desc:'Debloque le Tier 3' },
            { id:'battle_phase_3', targetTier:4, requiresTier:3, cost:{manpower:260,fuel:42}, time:55, key:'3', label:'Phase Combat III', desc:'Debloque le Tier 4' }
        ],
        constructs: [
            { buildingType:'barracks',   cost:{manpower:120},          time:25,  label:'Caserne',          key:'N', minTier:1, requires:[], desc:'Infanterie de base' },
            { buildingType:'support',    cost:{manpower:130},          time:28,  label:'Soutien',          key:'X', minTier:2, requires:['barracks'], desc:'Armes d appui' },
            { buildingType:'motor_pool', cost:{manpower:180,fuel:18},  time:35,  label:'Parc Motorise',    key:'C', minTier:3, requires:['support'], desc:'Vehicules legers' },
            { buildingType:'tank_depot', cost:{manpower:260,fuel:40},  time:48,  label:'Depot Blindes',    key:'V', minTier:3, requires:['motor_pool'], desc:'Chars et anti-char' },
            { buildingType:'airfield',   cost:{manpower:240,fuel:55},  time:55, label:'Terrain Aviation', key:'B', minTier:4, requires:['support','motor_pool'], desc:'Support aerien' }
        ]
    },
    barracks: {
        w:70, h:50, maxQueue:4, buildTime:25, label:'CASERNE',
        produces: [
            { unitType:'rifle',        cost:{manpower:140},              time:10, label:'Fusiliers',       key:'A', minTier:1, desc:'Infanterie ligne' },
            { unitType:'assault',      cost:{manpower:200,munitions:14}, time:14, label:'Assaut',          key:'W', minTier:2, desc:'Close combat' },
            { unitType:'flamethrower', cost:{manpower:220,munitions:18}, time:16, label:'Lance-Flammes',   key:'E', minTier:2, desc:'Anti-infanterie' },
            { unitType:'officer',      cost:{manpower:240},              time:18, label:'Officier',        key:'R', minTier:2, desc:'Buff de combat' }
        ]
    },
    support: {
        w:65, h:48, maxQueue:3, buildTime:28, label:'SOUTIEN',
        produces: [
            { unitType:'mg',      cost:{manpower:180},              time:14, label:'Mitrailleur', key:'A', minTier:2, desc:'Suppression' },
            { unitType:'mortar',  cost:{manpower:170,munitions:10}, time:15, label:'Mortier',     key:'W', minTier:2, desc:'Tir indirect' },
            { unitType:'sniper',  cost:{manpower:190,munitions:12}, time:18, label:'Sniper',      key:'E', minTier:3, desc:'Longue portee' },
            { unitType:'medic',   cost:{manpower:150},              time:13, label:'Medecin',     key:'R', minTier:3, desc:'Soin de section' }
        ]
    },
    motor_pool: {
        w:85, h:60, maxQueue:3, buildTime:35, label:'PARC MOT.',
        produces: [
            { unitType:'jeep',         cost:{manpower:120,fuel:10},      time:13, label:'Jeep',               key:'A', minTier:2, desc:'Recon mobile' },
            { unitType:'halftrack',    cost:{manpower:200,fuel:20},      time:20, label:'Half-Track',         key:'W', minTier:3, desc:'Transport combat' },
            { unitType:'anti_inf_car', cost:{manpower:220,fuel:22},      time:22, label:'Auto-Mitrailleuse',  key:'E', minTier:3, desc:'Anti-infanterie' },
            { unitType:'at_gun',       cost:{manpower:220,munitions:22}, time:20, label:'Canon AT 57mm',      key:'R', minTier:3, desc:'Anti-char tracte' }
        ]
    },
    tank_depot: {
        w:95, h:70, maxQueue:2, buildTime:48, label:'DEPOT BLINDES',
        produces: [
            { unitType:'sherman',        cost:{manpower:320,fuel:45},  time:28, label:'Sherman M4',     key:'A', minTier:3, desc:'Char polyvalent' },
            { unitType:'tank_destroyer', cost:{manpower:360,fuel:52},  time:32, label:'Tank Destroyer', key:'W', minTier:3, desc:'Anti-char' },
            { unitType:'heavy_tank',     cost:{manpower:440,fuel:72},  time:38, label:'Char Lourd',     key:'E', minTier:4, desc:'Percussion frontale' }
        ]
    },
    airfield: {
        w:110, h:75, maxQueue:2, buildTime:55, label:'AVIATION',
        produces: [
            { unitType:'heli_transport', cost:{manpower:230,fuel:40},             time:25, label:'Helico Transport', key:'A', minTier:3, desc:'Projection rapide' },
            { unitType:'heli_attack',    cost:{manpower:300,fuel:60},             time:32, label:'Helico Attaque',   key:'W', minTier:4, desc:'Appui anti-char' },
            { unitType:'airstrike',      cost:{manpower:0,munitions:80,fuel:10},  time:18, label:'Frappe Aerienne',  key:'E', minTier:4, desc:'Burst ponctuel' }
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