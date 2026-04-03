var RTS = RTS || {};
RTS.Game = RTS.Game || {};

RTS.Game.ProductionUI = function(canvas, getResources) {
    this.canvas       = canvas;
    this.getResources = getResources;

    this.selectedBuilding = null;
    this.selectedSquads   = [];   // escouades sélectionnées (pour abilities)
    this.selectedPioneers = [];
    this.buttons          = [];
    this.visible          = false;
    this.activeTab        = 'produce';
    this.techState        = {
        built:{}, counts:{}, availablePioneers:0,
        population:0, popCap:0, techTier:1,
        upgradeInProgress:null,
        commandPoints:0, commandPointCap:12,
        doctrineSelected:null
    };

    this.barH    = 130;
    this.resBarH = 28;
    this.padding = 12;
};

// ---------------------------------------------------------------------------
//  COULEURS
// ---------------------------------------------------------------------------

var _UI_COL = {
    allied: {
        bg:'rgba(4,8,22,0.95)', resBg:'rgba(2,5,15,0.97)',
        border:'#4477ff', text:'#7aaaff', btnBg:'#0a1830',
        btnHover:'#162a5a', btnDisabled:'#0a0f1c',
        cost:'#ffdd55', costBad:'#ff4444',
        tab:'#0d1f3c', tabActive:'#1a3a6e',
        mp:'#55aaff', mun:'#ffcc44', fuel:'#44dd88',
        abilityReady:'#1a3a1a', abilityActive:'#003300', abilityCooldown:'#1a1a0a',
        abilityBorder:'#44ff88', abilityCooldownBorder:'#555'
    },
    axis: {
        bg:'rgba(18,4,4,0.95)', resBg:'rgba(10,2,2,0.97)',
        border:'#cc2222', text:'#ff7777', btnBg:'#200808',
        btnHover:'#3a1010', btnDisabled:'#150404',
        cost:'#ffdd55', costBad:'#ff4444',
        tab:'#250a0a', tabActive:'#4a1515',
        mp:'#ff7777', mun:'#ffcc44', fuel:'#44dd88',
        abilityReady:'#2a1a00', abilityActive:'#330000', abilityCooldown:'#1a1a0a',
        abilityBorder:'#ff8844', abilityCooldownBorder:'#555'
    }
};

// ---------------------------------------------------------------------------
//  API
// ---------------------------------------------------------------------------

RTS.Game.ProductionUI.prototype.selectBuilding = function(building) {
    // Réinitialiser le scroll si on change de bâtiment
    if (building && this.selectedBuilding && building.type !== this.selectedBuilding.type) {
        if (this._scrollOffset) this._scrollOffset[building.type] = 0;
    }
    this.selectedBuilding = building;
    this.visible          = !!building;
    // QG → onglet construction par défaut ; autres bâtiments → production
    if (building) {
        if (building.type === 'hq') {
            this.activeTab = 'construct';
        } else {
            this.activeTab = 'produce';
        }
    }
};

RTS.Game.ProductionUI.prototype.setSelectedPioneers = function(arr) {
    this.selectedPioneers = arr || [];
};

RTS.Game.ProductionUI.prototype.setSelectedSquads = function(arr) {
    this.selectedSquads = arr || [];
};

RTS.Game.ProductionUI.prototype.setTechState = function(state) {
    state = state || {};
    this.techState = {
        built: state.built || {},
        counts: state.counts || {},
        availablePioneers: state.availablePioneers || 0,
        population: state.population || 0,
        popCap: state.popCap || 0,
        techTier: state.techTier || 1,
        upgradeInProgress: state.upgradeInProgress || null,
        commandPoints: state.commandPoints || 0,
        commandPointCap: state.commandPointCap || 12,
        doctrineSelected: state.doctrineSelected || null
    };
};

// ---------------------------------------------------------------------------
//  RENDER
// ---------------------------------------------------------------------------

RTS.Game.ProductionUI.prototype.render = function(ctx, mouseX, mouseY) {
    this.buttons = [];
    var cv  = this.canvas;
    var res = this.getResources();
    var col = this.selectedBuilding
        ? (_UI_COL[this.selectedBuilding.team] || _UI_COL.allied)
        : _UI_COL.allied;

    this._renderResourceBar(ctx, res, col, cv);

    // Panel abilities uniquement si l'unité a des abilities ET qu'aucun bâtiment n'est sélectionné
    if (!this.selectedBuilding && this.selectedSquads.length > 0) {
        var sq0 = this.selectedSquads[0];
        if (sq0 && sq0.abilities && Object.keys(sq0.abilities).length > 0) {
            this._renderAbilityPanel(ctx, col, cv, mouseX, mouseY);
            return;
        }
        // Pas d'abilities : ne pas bloquer l'affichage du panel
    }

    if (!this.visible || !this.selectedBuilding) {
        // Afficher un bandeau d'aide si aucun bâtiment sélectionné (et pas d'abilities à afficher)
        var barY0 = cv.height - 42;
        ctx.save();
        ctx.fillStyle = 'rgba(4,8,22,0.82)';
        ctx.fillRect(0, barY0, cv.width, 42);
        ctx.strokeStyle = col.border + '44'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, barY0); ctx.lineTo(cv.width, barY0); ctx.stroke();
        ctx.fillStyle = col.text + '88';
        ctx.font = '10px "Courier New"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('Cliquez sur votre QG ou un bâtiment allié pour produire des unités ou construire', cv.width / 2, barY0 + 14);
        ctx.fillStyle = col.text + '55';
        ctx.font = '9px "Courier New"';
        ctx.fillText('Echap = sélectionner QG  |  H / Espace = centrer sur la base  |  Ctrl+A = tout sélectionner', cv.width / 2, barY0 + 30);
        ctx.restore();
        return;
    }

    var b    = this.selectedBuilding;
    var barY = cv.height - this.barH;
    var barW = cv.width;
    var p    = this.padding;

    ctx.save();
    ctx.fillStyle = col.bg;
    ctx.fillRect(0, barY, barW, this.barH);
    ctx.strokeStyle = col.border; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0,barY); ctx.lineTo(barW,barY); ctx.stroke();

    ctx.fillStyle=col.text; ctx.font='bold 11px "Courier New"';
    ctx.textAlign='left'; ctx.textBaseline='top';
    var unitCount = b.produces ? b.produces.length : 0;
    ctx.fillText('▶ '+b.label + (unitCount > 0 ? '  ['+unitCount+' UNITÉS]' : ''), p, barY+p);

    if (!b.isBuilt) {
        ctx.fillStyle=col.text+'aa'; ctx.font='9px "Courier New"';
        ctx.fillText('EN CONSTRUCTION... '+Math.round(b.buildProgress*100)+'%',p,barY+p+16);
        ctx.restore(); return;
    }

    if (b.queue.length>0) {
        var item=b.queue[0];
        var prog=Math.round((1-item.timeLeft/item.totalTime)*100);
        ctx.fillStyle=col.text+'aa'; ctx.font='9px "Courier New"';
        ctx.fillText('⚙ '+item.unitType.toUpperCase()+' — '+prog+'%',p,barY+p+16);
    }

    var showTabs   = b.type === 'hq' && (b.constructs && b.constructs.length > 0);
    var contentX   = 175;

    if (showTabs) {
        this._renderTabs(ctx, col, barY, p, true);
    }

    if (this.activeTab === 'construct' && showTabs) {
        this._renderConstructButtons(ctx, col, b, res, barY, contentX, mouseX, mouseY);
    } else if (b.produces && b.produces.length > 0) {
        this._renderProduceButtons(ctx, col, b, res, barY, contentX, mouseX, mouseY);
    } else {
        // Bâtiment sans production (ex: QG sur onglet produce sans unités) — message informatif
        ctx.fillStyle = col.text + '55';
        ctx.font = '9px "Courier New"';
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText('Aucune unité disponible. Passez sur CONSTRUCTION ou sélectionnez un autre bâtiment.', contentX, barY + this.padding + 22);
    }

    if (b.type === 'hq') {
        ctx.fillStyle = col.text+'77';
        ctx.font = '8px "Courier New"';
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText('Tech: [1]/[2]/[3]  Doctrine: [Z]/[X]/[C]  Call-ins: [Y]/[U]', p, barY + this.barH - 12);
    }

    ctx.restore();
};

// ---------------------------------------------------------------------------
//  ABILITY PANEL — affiché quand une escouade est sélectionnée
// ---------------------------------------------------------------------------

RTS.Game.ProductionUI.prototype._renderAbilityPanel = function(ctx, col, cv, mx, my) {
    var sq = this.selectedSquads[0];
    if (!sq || !sq.abilities) return;

    var abilityIds = Object.keys(sq.abilities);
    if (!abilityIds.length) return;

    var panelH = 80;
    var panelY = cv.height - panelH;
    var p      = this.padding;
    var defs   = RTS.Game.Squad.ABILITY_DEFS;

    ctx.save();
    ctx.fillStyle = 'rgba(4,8,22,0.92)';
    ctx.fillRect(0, panelY, cv.width, panelH);
    ctx.strokeStyle = col.border; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(0,panelY); ctx.lineTo(cv.width,panelY); ctx.stroke();

    // Nom + rôle de l'unité
    var roleLabel = {
        infantry:'INFANTERIE', assault:'ASSAUT', anti_tank:'ANTI-TANK',
        artillery:'ARTILLERIE', medic:'MÉDECIN', recon:'RECONNAISSANCE',
        support:'SOUTIEN', tank:'BLINDÉ', heavy_tank:'BLINDÉ LOURD',
        tank_destroyer:'CHASSEUR DE CHARS', engineer:'GÉNIE', sniper:'SNIPER',
        gunship:'HÉLICO ATTAQUE', transport:'TRANSPORT', airstrike:'FRAPPE',
        anti_inf:'ANTI-INFANTERIE'
    };
    ctx.fillStyle = col.text; ctx.font='bold 11px "Courier New"';
    ctx.textAlign='left'; ctx.textBaseline='top';
    var unitLabel = sq.type.toUpperCase().replace('_',' ');
    var roleStr   = roleLabel[sq.role] || sq.role.toUpperCase();
    ctx.fillText('▶ ' + unitLabel + '  —  ' + roleStr, p, panelY + p);

    // Abilities
    var btnW=90, btnH=52, btnY=panelY+24, startX=p;

    abilityIds.forEach(function(id, idx) {
        var ab  = sq.abilities[id];
        var def = defs[id];
        if (!def) return;

        var bx      = startX + idx*(btnW+6);
        var onCD    = ab.timer > 0;
        var isActive= ab.active;
        var hover   = mx>=bx&&mx<=bx+btnW&&my>=btnY&&my<=btnY+btnH;

        // Fond
        if (isActive)      ctx.fillStyle = col.abilityActive;
        else if (onCD)     ctx.fillStyle = col.abilityCooldown;
        else if (hover)    ctx.fillStyle = col.btnHover;
        else               ctx.fillStyle = col.abilityReady;
        ctx.fillRect(bx, btnY, btnW, btnH);

        // Bordure
        ctx.strokeStyle = onCD ? col.abilityCooldownBorder : isActive ? col.abilityBorder : hover ? col.text : col.abilityBorder;
        ctx.lineWidth = isActive ? 2 : 1;
        ctx.strokeRect(bx, btnY, btnW, btnH);

        // Icône
        ctx.font='18px Arial'; ctx.textAlign='center'; ctx.textBaseline='top';
        ctx.globalAlpha = onCD ? 0.4 : 1.0;
        ctx.fillStyle='#fff';
        ctx.fillText(def.icon, bx+btnW/2, btnY+4);
        ctx.globalAlpha = 1.0;

        // Label
        ctx.font='bold 8px "Courier New"'; ctx.textAlign='center'; ctx.textBaseline='top';
        ctx.fillStyle = onCD ? col.text+'55' : col.text;
        ctx.fillText(def.label.toUpperCase(), bx+btnW/2, btnY+26);

        // Cooldown overlay
        if (onCD) {
            var cdPct = ab.timer / def.cooldown;
            ctx.fillStyle='rgba(0,0,0,0.5)';
            ctx.fillRect(bx, btnY, btnW, btnH * cdPct);
            ctx.fillStyle='#ffdd44'; ctx.font='bold 10px "Courier New"';
            ctx.textAlign='center'; ctx.textBaseline='middle';
            ctx.fillText(Math.ceil(ab.timer)+'s', bx+btnW/2, btnY+btnH/2+4);
        } else if (isActive) {
            ctx.fillStyle='#44ff88'; ctx.font='bold 8px "Courier New"';
            ctx.textAlign='center'; ctx.textBaseline='bottom';
            ctx.fillText('ACTIF', bx+btnW/2, btnY+btnH-3);
        } else {
            // Touche raccourci
            ctx.fillStyle=col.text+'77'; ctx.font='8px "Courier New"';
            ctx.textAlign='center'; ctx.textBaseline='bottom';
            ctx.fillText('['+def.key+']', bx+btnW/2, btnY+btnH-3);
        }

        this.buttons.push({x:bx,y:btnY,w:btnW,h:btnH,action:'ability',abilityId:id,squad:sq,canUse:!onCD&&!isActive});
    }, this);

    ctx.restore();
};

// ---------------------------------------------------------------------------
//  BARRE RESSOURCES
// ---------------------------------------------------------------------------

RTS.Game.ProductionUI.prototype._renderResourceBar = function(ctx, res, col, cv) {
    var rh=this.resBarH, y=0;
    ctx.save();
    ctx.fillStyle=col.resBg; ctx.fillRect(0,y,cv.width,rh);
    ctx.strokeStyle=col.border+'55'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(0,rh); ctx.lineTo(cv.width,rh); ctx.stroke();

    var items=[
        {label:'⚔ MANPOWER',  val:res.manpower,  rate:res.manpowerRate,  color:col.mp},
        {label:'💥 MUNITIONS', val:res.munitions, rate:res.munitionsRate, color:col.mun},
        {label:'⛽ CARBURANT', val:res.fuel,       rate:res.fuelRate,      color:col.fuel}
    ];

    var itemW=200, startX=20;
    items.forEach(function(item,i){
        var x=startX+i*itemW;
        ctx.fillStyle=item.color; ctx.font='bold 10px "Courier New"';
        ctx.textAlign='left'; ctx.textBaseline='middle';
        ctx.fillText(item.label,x,rh/2-4);
        ctx.fillStyle='#ffffff'; ctx.font='bold 12px "Courier New"';
        ctx.fillText(String(item.val),x+90,rh/2-4);
        ctx.fillStyle=item.color+'99'; ctx.font='8px "Courier New"';
        ctx.fillText('+'+item.rate+'/min',x+130,rh/2-4);
    });

    if (this.techState && this.techState.popCap > 0) {
        var pop = this.techState.population || 0;
        var cap = this.techState.popCap || 0;
        var tier = this.techState.techTier || 1;
        var cp = this.techState.commandPoints || 0;
        var cpCap = this.techState.commandPointCap || 12;
        var doc = this.techState.doctrineSelected ? this.techState.doctrineSelected.toUpperCase() : 'NONE';

        ctx.fillStyle = pop >= cap ? '#ff5555' : 'rgba(255,255,255,0.85)';
        ctx.font='bold 10px "Courier New"'; ctx.textAlign='left'; ctx.textBaseline='middle';
        ctx.fillText('POP '+pop+'/'+cap, 620, rh/2-4);

        ctx.fillStyle = 'rgba(170,220,255,0.9)';
        ctx.fillText('TIER '+tier, 710, rh/2-4);

        ctx.fillStyle = 'rgba(255,170,120,0.95)';
        ctx.fillText('CP '+cp+'/'+cpCap, 800, rh/2-4);

        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font='8px "Courier New"';
        ctx.fillText('DOC '+doc, 890, rh/2-4);
    }

    ctx.fillStyle='rgba(255,255,255,0.25)'; ctx.font='8px "Courier New"';
    ctx.textAlign='right'; ctx.textBaseline='middle';
    ctx.fillText('H=base  T=retraite  V=renfort  1/2/3=tech  Z/X/C=doctrine  Y/U=call-in',cv.width-10,rh/2);

    ctx.restore();
};

// ---------------------------------------------------------------------------
//  ONGLETS
// ---------------------------------------------------------------------------

RTS.Game.ProductionUI.prototype._renderTabs = function(ctx,col,barY,p,hasPioneer) {
    var tabs=[
        {id:'produce',  label:'PRODUCTION'},
        {id:'construct',label:'CONSTRUCTION'}
    ];
    var tabW=130, tabH=18, tabY=barY+2;
    tabs.forEach(function(tab,i){
        var tx=175+i*(tabW+4);
        var active=this.activeTab===tab.id;
        ctx.fillStyle=active?col.tabActive:col.tab;
        ctx.fillRect(tx,tabY,tabW,tabH);
        ctx.strokeStyle=active?col.border:col.border+'44'; ctx.lineWidth=1;
        ctx.strokeRect(tx,tabY,tabW,tabH);
        ctx.fillStyle=active?col.text:col.text+'77'; ctx.font='bold 8px "Courier New"';
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(tab.label,tx+tabW/2,tabY+tabH/2);
        this.buttons.push({x:tx,y:tabY,w:tabW,h:tabH,action:'tab',tabId:tab.id});
    },this);
};

// ---------------------------------------------------------------------------
//  BOUTONS PRODUCTION
// ---------------------------------------------------------------------------

RTS.Game.ProductionUI.prototype._renderProduceButtons = function(ctx,col,b,res,barY,startX,mx,my) {
    var btnW=105, btnH=78, btnY=barY+this.padding+22;
    var cv = this.canvas;

    // Scroll : stocker l'offset par type de bâtiment
    if (!this._scrollOffset) this._scrollOffset = {};
    if (this._scrollOffset[b.type] === undefined) this._scrollOffset[b.type] = 0;

    var total      = b.produces.length;
    var availW     = cv.width - startX - 100;
    var maxVisible = Math.max(1, Math.floor(availW / (btnW + 5)));
    var offset     = Math.max(0, Math.min(this._scrollOffset[b.type], total - maxVisible));
    this._scrollOffset[b.type] = offset;

    // --- Flèche gauche ---
    if (offset > 0) {
        var lx = startX - 20, ly = btnY + btnH/2 - 14;
        ctx.fillStyle = col.btnHover; ctx.fillRect(lx, ly, 16, 28);
        ctx.strokeStyle = col.border; ctx.lineWidth=1; ctx.strokeRect(lx, ly, 16, 28);
        ctx.fillStyle = col.text; ctx.font='bold 11px Arial';
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText('◀', lx+8, ly+14);
        this.buttons.push({x:lx,y:ly,w:16,h:28,action:'scroll',dir:-1,bType:b.type});
    }

    // --- Flèche droite ---
    if (offset + maxVisible < total) {
        var rx2 = startX + maxVisible*(btnW+5) + 4, ry2 = btnY + btnH/2 - 14;
        ctx.fillStyle = col.btnHover; ctx.fillRect(rx2, ry2, 16, 28);
        ctx.strokeStyle = col.border; ctx.lineWidth=1; ctx.strokeRect(rx2, ry2, 16, 28);
        ctx.fillStyle = col.text; ctx.font='bold 11px Arial';
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText('▶', rx2+8, ry2+14);
        this.buttons.push({x:rx2,y:ry2,w:16,h:28,action:'scroll',dir:1,bType:b.type});
    }

    // --- Indicateur page ---
    if (total > maxVisible) {
        ctx.fillStyle=col.text+'66'; ctx.font='8px "Courier New"';
        ctx.textAlign='center'; ctx.textBaseline='top';
        ctx.fillText((offset+1)+'-'+Math.min(offset+maxVisible,total)+'/'+total,
                     startX + maxVisible*(btnW+5)/2, barY+3);
    }

    // --- Icônes par unitType ---
    var ICONS = {
        rifle:'👊', mg:'🔥', pioneer:'🔧', assault:'💪', at_inf:'🚀',
        mortar:'💣', medic:'➕', sniper:'🎯', jeep:'🚗', halftrack:'🚛',
        recon_car:'👁', anti_inf_car:'⚡', sherman:'🛡', panzer:'🛡',
        tank_destroyer:'🎯', heavy_tank:'🔱', artillery_truck:'💥',
        heli_transport:'🚁', heli_attack:'🚁', airstrike:'✈',
        flamethrower:'🔥', paratrooper:'🪂', officer:'⭐',
        m10_wolverine:'🛡', p47_thunderbolt:'✈',
        // Nouvelles alliées
        ranger:'🗡', combat_engineer:'⚙', commando:'🕵',
        aa_halftrack:'🛡', bofors:'🎯',
        m7_priest:'💥', calliope:'🚀',
        at_gun:'🎯', gun_17pdr:'💥'
    };

    // --- Boutons visibles ---
    b.produces.slice(offset, offset + maxVisible).forEach(function(prod, idx) {
        var bx = startX + idx*(btnW+5);
        var hover     = mx>=bx && mx<=bx+btnW && my>=btnY && my<=btnY+btnH;
        var canAfford = this._canAfford(res, prod.cost);
        var tierReq   = prod.minTier || 1;
        var tierOk    = (this.techState.techTier || 1) >= tierReq;
        var enabled   = canAfford && tierOk;

        ctx.fillStyle = !enabled ? col.btnDisabled : hover ? col.btnHover : col.btnBg;
        ctx.fillRect(bx, btnY, btnW, btnH);
        ctx.strokeStyle = hover&&enabled ? col.text : enabled ? col.border+'99' : '#333333';
        ctx.lineWidth=1.5; ctx.strokeRect(bx, btnY, btnW, btnH);

        ctx.font='13px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(ICONS[prod.unitType]||'⚔', bx+14, btnY+11);

        ctx.fillStyle = enabled ? col.text : col.text+'55';
        ctx.font='bold 8px "Courier New"'; ctx.textAlign='left'; ctx.textBaseline='top';
        ctx.fillText('['+prod.key+'] '+prod.label, bx+26, btnY+5);

        var cy = btnY+20;
        this._drawCost(ctx, prod.cost, res, col, bx+4, cy, btnW-8, canAfford);

        ctx.fillStyle=col.text+'88'; ctx.font='8px "Courier New"'; ctx.textAlign='left';
        ctx.fillText('⏱ '+prod.time+'s', bx+4, cy+26);
        if (!tierOk) {
            ctx.fillStyle = col.costBad;
            ctx.fillText('Tier '+tierReq+' requis', bx+4, cy+36);
        }

        if (hover&&enabled) { ctx.fillStyle=col.text+'22'; ctx.fillRect(bx,btnY,btnW,btnH); }
        this.buttons.push({x:bx,y:btnY,w:btnW,h:btnH,action:'produce',prod:prod,canAfford:enabled});
    }, this);

    // --- Rally ---
    var rallyX = startX + maxVisible*(btnW+5) + 28;
    var hov2   = mx>=rallyX && mx<=rallyX+70 && my>=btnY && my<=btnY+btnH;
    ctx.fillStyle = hov2 ? col.btnHover : col.btnBg; ctx.fillRect(rallyX,btnY,70,btnH);
    ctx.strokeStyle=col.border+'66'; ctx.lineWidth=1; ctx.strokeRect(rallyX,btnY,70,btnH);
    ctx.fillStyle=col.text+'aa'; ctx.font='9px "Courier New"';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('[R] RALLYE', rallyX+35, btnY+btnH/2);
    this.buttons.push({x:rallyX,y:btnY,w:70,h:btnH,action:'rally'});
};

// ---------------------------------------------------------------------------
//  BOUTONS CONSTRUCTION
// ---------------------------------------------------------------------------

RTS.Game.ProductionUI.prototype._renderConstructButtons = function(ctx,col,b,res,barY,startX,mx,my) {
    if (!b.constructs) return;
    var self = this;
    var tier = this.techState.techTier || 1;
    var upgrade = this.techState.upgradeInProgress;

    // ── Boutons upgrade de TIER ──────────────────────────────────────────────
    var upY = barY + 6, upH = 22, upX = startX;
    var tierColors = { 1:'#7aaaff', 2:'#ffdd44', 3:'#ff8844', 4:'#ff4488' };
    if (b.upgrades) {
        b.upgrades.forEach(function(upg) {
            var hover = mx >= upX && mx <= upX + 140 && my >= upY && my <= upY + upH;
            var canAff = self._canAfford(res, upg.cost || {});
            var available = tier === (upg.requiresTier || 1) && !upgrade;
            var done = tier >= (upg.targetTier || 1);
            var inProg = upgrade && upgrade.label === upg.label;
            var tc = tierColors[upg.targetTier] || '#aaa';

            ctx.fillStyle = done ? 'rgba(0,80,0,0.5)' : inProg ? 'rgba(0,50,0,0.7)' : available && canAff ? (hover ? '#1a3a6e' : '#0d1a30') : '#0a0a18';
            ctx.strokeStyle = done ? '#44ff44' : inProg ? '#44ff44' : available ? tc : '#333';
            ctx.lineWidth = 1.5;
            ctx.fillRect(upX, upY, 140, upH);
            ctx.strokeRect(upX, upY, 140, upH);

            if (inProg) {
                var prog = 1 - upgrade.timeLeft / upgrade.totalTime;
                ctx.fillStyle = '#44ff4422'; ctx.fillRect(upX, upY, 140 * prog, upH);
                ctx.fillStyle = '#44ff44'; ctx.font = 'bold 8px "Courier New"';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText('⚙ ' + upg.label + ' ' + Math.round(prog * 100) + '%', upX + 70, upY + upH / 2);
            } else if (done) {
                ctx.fillStyle = '#44ff88'; ctx.font = 'bold 8px "Courier New"';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText('✓ Tier ' + upg.targetTier + ' — ' + upg.label, upX + 70, upY + upH / 2);
            } else {
                ctx.fillStyle = available && canAff ? tc : '#555';
                ctx.font = 'bold 8px "Courier New"'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
                ctx.fillText('[' + upg.key + '] ' + upg.label, upX + 4, upY + upH / 2);
                var costStr = '⚔' + (upg.cost.manpower || 0) + (upg.cost.fuel ? ' ⛽' + upg.cost.fuel : '');
                ctx.fillStyle = canAff ? tc + 'aa' : '#ff4444';
                ctx.textAlign = 'right';
                ctx.fillText(costStr, upX + 136, upY + upH / 2);
            }
            if (available && !done && !inProg) {
                self.buttons.push({ x:upX, y:upY, w:140, h:upH, action:'upgrade', upg:upg, canAfford:canAff });
            }
            upX += 148;
        });
    }

    var btnW=115, btnH=72, btnY=barY+this.padding+32;

    b.constructs.forEach(function(cons,idx){
        var bx=startX+idx*(btnW+5);
        var hover=mx>=bx&&mx<=bx+btnW&&my>=btnY&&my<=btnY+btnH;
        var availability = self._getConstructAvailability(cons);
        var canAfford=self._canAfford(res,cons.cost);
        var enabled = canAfford && availability.canBuild;

        ctx.fillStyle=!enabled?col.btnDisabled:hover?col.btnHover:col.btnBg;
        ctx.fillRect(bx,btnY,btnW,btnH);
        ctx.strokeStyle=hover&&enabled?col.text:enabled?col.border+'99':'#333333';
        ctx.lineWidth=1.5; ctx.strokeRect(bx,btnY,btnW,btnH);

        ctx.fillStyle=col.border+'44'; ctx.fillRect(bx+4,btnY+4,18,18);
        ctx.fillStyle=col.text; ctx.font='bold 10px "Courier New"';
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText('⌂',bx+13,btnY+13);

        ctx.fillStyle=enabled?col.text:col.text+'55'; ctx.font='bold 8px "Courier New"';
        ctx.textAlign='left'; ctx.textBaseline='top';
        ctx.fillText('['+cons.key+'] '+cons.label,bx+26,btnY+5);

        self._drawCost(ctx,cons.cost,res,col,bx+4,btnY+22,btnW-8,canAfford);
        ctx.fillStyle=col.text+'88'; ctx.font='8px "Courier New"';
        ctx.textAlign='left';
        ctx.fillText('⏱ '+cons.time+'s',bx+4,btnY+48);
        if (!availability.canBuild) {
            ctx.fillStyle = col.costBad;
            ctx.fillText(availability.reason, bx+4, btnY+60);
        }

        self.buttons.push({x:bx,y:btnY,w:btnW,h:btnH,action:'construct',cons:cons,canAfford:canAfford,canBuild:availability.canBuild});
    });
};

// ---------------------------------------------------------------------------
//  HELPER COÛTS
// ---------------------------------------------------------------------------

RTS.Game.ProductionUI.prototype._drawCost = function(ctx,cost,res,col,x,y,maxW,canAfford) {
    var parts=[];
    if (cost.manpower)  parts.push({v:Math.floor(res.manpower), req:cost.manpower,  label:cost.manpower+'mp',  col:col.mp});
    if (cost.munitions) parts.push({v:Math.floor(res.munitions),req:cost.munitions, label:cost.munitions+'mun',col:col.mun});
    if (cost.fuel)      parts.push({v:Math.floor(res.fuel),     req:cost.fuel,      label:cost.fuel+'carb',    col:col.fuel});
    var cx=x;
    parts.forEach(function(p){
        var ok=p.v>=p.req;
        ctx.fillStyle=ok?p.col:col.costBad; ctx.font='8px "Courier New"';
        ctx.textAlign='left'; ctx.textBaseline='top';
        ctx.fillText(p.label,cx,y); cx+=50;
    });
};

RTS.Game.ProductionUI.prototype._canAfford = function(res,cost) {
    return (res.manpower  >= (cost.manpower  ||0)) &&
           (res.munitions >= (cost.munitions ||0)) &&
           (res.fuel      >= (cost.fuel      ||0));
};

RTS.Game.ProductionUI.prototype._getConstructAvailability = function(cons) {
    var state = this.techState || {};
    var counts = state.counts || {};
    var built = state.built || {};

    if ((counts[cons.buildingType] || 0) > 0) {
        return { canBuild:false, reason:'Deja present' };
    }
    if ((state.availablePioneers || 0) <= 0) {
        return { canBuild:false, reason:'Aucun pioneer' };
    }

    var tierReq = cons.minTier || 1;
    if ((state.techTier || 1) < tierReq) {
        return { canBuild:false, reason:'Tier '+tierReq+' requis' };
    }

    var reqs = cons.requires || [];
    for (var i = 0; i < reqs.length; i++) {
        if (!built[reqs[i]]) {
            var reqStats = RTS.Game.Building.STATS[reqs[i]];
            var reqLabel = reqStats ? reqStats.label : reqs[i].toUpperCase();
            return { canBuild:false, reason:'Req: ' + reqLabel };
        }
    }

    return { canBuild:true, reason:'' };
};

// ---------------------------------------------------------------------------
//  CLICK / KEY
// ---------------------------------------------------------------------------

RTS.Game.ProductionUI.prototype.handleClick = function(sx, sy) {
    for (var i=0;i<this.buttons.length;i++) {
        var b=this.buttons[i];
        if (sx>=b.x&&sx<=b.x+b.w&&sy>=b.y&&sy<=b.y+b.h) {
            if (b.action==='tab')    { this.activeTab=b.tabId; return null; }
            if (b.action==='scroll') {
                if (!this._scrollOffset) this._scrollOffset = {};
                this._scrollOffset[b.bType] = (this._scrollOffset[b.bType]||0) + b.dir;
                return null;
            }
            return b;
        }
    }
    return null;
};

RTS.Game.ProductionUI.prototype.handleKey = function(key) {
    if (!this.visible||!this.selectedBuilding) return null;
    var self = this;
    var uk=key.toUpperCase(), b=this.selectedBuilding;
    var res=this.getResources();
    if (this.activeTab==='construct' && b.constructs) {
        var found=null;
        b.constructs.forEach(function(c){
            if (c.key!==uk) return;
            var availability = self._getConstructAvailability(c);
            found={action:'construct',cons:c,canAfford:self._canAfford(res,c.cost),canBuild:availability.canBuild};
        });
        if (found) return found;
    }
    if (b.produces) {
        var found2=null;
        b.produces.forEach(function(p){
            if (p.key!==uk) return;
            var tierReq = p.minTier || 1;
            var tierOk = (self.techState.techTier || 1) >= tierReq;
            found2={action:'produce',prod:p,canAfford:self._canAfford(res,p.cost)&&tierOk};
        });
        return found2;
    }
    return null;
};