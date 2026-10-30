window.RTS = window.RTS || {};

// Palette industrielle par type
RTS.BuildingRenderer = {

    DEFS: {
        hq:       { fill:"#1a2a3a", stroke:"#3d8ef5", label:"QG",    w:60, h:60 },
        barracks: { fill:"#1e2a1e", stroke:"#2ecc71", label:"CSN",   w:52, h:52 },
        workshop: { fill:"#2a1e10", stroke:"#e67e22", label:"ATL",   w:52, h:52 },
        hangar:   { fill:"#10102a", stroke:"#9b59b6", label:"HGR",   w:60, h:44 },
        mine:     { fill:"#1a1408", stroke:"#f5a623", label:"MINE",  w:44, h:44 },
        refinery: { fill:"#0a1e0a", stroke:"#27ae60", label:"RAF",   w:44, h:52 },
        arsenal:  { fill:"#1e0a0a", stroke:"#e74c3c", label:"ARS",   w:44, h:44 },
        tower:    { fill:"#0a0a1e", stroke:"#8e44ad", label:"TW",    w:28, h:60 },
        hospital: { fill:"#0a1e1e", stroke:"#1abc9c", label:"+HP",   w:48, h:48 },
        wall:     { fill:"#1a1a1a", stroke:"#7f8c8d", label:"MUR",   w:52, h:20 }
    },

    render: function(game) {
        var ctx = game.ctx;

        // Craters are rendered once by RTS.Renderer beneath structures.
        game.buildings.forEach(function(b) {
            RTS.BuildingRenderer._drawBuilding(ctx, b);
        });

        if (RTS.BuildingSystem.isPlacing()) {
            RTS.BuildingRenderer._drawGhost(ctx, game);
        }

        RTS.BuildingRenderer._updateProductionPanel(game);
    },

    _drawBuilding: function(ctx, b) {
        var def = RTS.BuildingRenderer.DEFS[b.type] || { fill:"#222", stroke:"#555", label:"?", w:52, h:52 };
        var w   = def.w, h = def.h;
        var hx  = b.x - w/2, hy = b.y - h/2;
        var isBlue = b.team === "blue";
        var isAlly = b.team === "ally";

        if (b.flashTimer > 0) {
            ctx.fillStyle = "rgba(255,255,255,.85)";
            ctx.fillRect(hx, hy, w, h); return;
        }

        // Corps principal
        ctx.fillStyle   = isBlue ? def.fill : isAlly ? "#0a1e0a" : "#2a0a0a";
        ctx.strokeStyle = isBlue ? def.stroke : isAlly ? "#2ecc71" : "#e74c3c";
        ctx.lineWidth   = 2;
        ctx.fillRect(hx, hy, w, h);
        ctx.strokeRect(hx, hy, w, h);

        // Détails spécifiques
        RTS.BuildingRenderer["_detail_" + b.type]
            ? RTS.BuildingRenderer["_detail_" + b.type](ctx, b, hx, hy, w, h, isBlue, def)
            : RTS.BuildingRenderer._detailDefault(ctx, b, hx, hy, w, h, isBlue, def);

        // Sélection
        if (b.selected) {
            ctx.strokeStyle = "#ffd232"; ctx.lineWidth = 2;
            ctx.strokeRect(hx-4, hy-4, w+8, h+8);
        }

        // Barres HP + production
        RTS.BuildingRenderer._drawBars(ctx, b, hx, hy, w);
    },

    _detailDefault: function(ctx, b, hx, hy, w, h, isBlue, def) {
        ctx.font = "bold 10px 'Courier New'"; ctx.textAlign = "center";
        ctx.fillStyle = b.team === "blue" ? def.stroke : b.team === "ally" ? "#2ecc71" : "#e74c3c";
        ctx.fillText(def.label, b.x, b.y + 4);
        ctx.textAlign = "left";
    },

    _detail_hq: function(ctx, b, hx, hy, w, h, isBlue, def) {
        // Antenne centrale
        ctx.strokeStyle = def.stroke; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(b.x, hy); ctx.lineTo(b.x, hy-18); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(b.x-8, hy-12); ctx.lineTo(b.x+8, hy-12); ctx.stroke();
        // Radar dish
        ctx.beginPath(); ctx.arc(b.x, hy-18, 5, Math.PI, Math.PI*2);
        ctx.fillStyle = def.stroke; ctx.fill();
        // Label
        ctx.font = "bold 11px 'Courier New'"; ctx.textAlign = "center";
        ctx.fillStyle = def.stroke; ctx.fillText("QG", b.x, b.y+4); ctx.textAlign = "left";
        // Fenêtres
        ctx.fillStyle = "rgba(61,142,245,.3)";
        [[hx+6,hy+8],[hx+w-14,hy+8],[hx+6,hy+h-16],[hx+w-14,hy+h-16]].forEach(function(p){
            ctx.fillRect(p[0],p[1],8,6);
        });
    },

    _detail_barracks: function(ctx, b, hx, hy, w, h, isBlue, def) {
        // Tourelle
        var tw = 16;
        ctx.fillStyle = isBlue ? "#0e2010" : "#200e0e";
        ctx.strokeStyle = def.stroke; ctx.lineWidth = 1.5;
        ctx.fillRect(b.x-tw/2, hy-10, tw, 12); ctx.strokeRect(b.x-tw/2, hy-10, tw, 12);
        ctx.fillStyle = "#333"; ctx.fillRect(b.x-2, hy-20, 4, 14);
        // Meurtrières
        ctx.fillStyle = "rgba(46,204,113,.3)";
        [[hx+5,hy+8],[hx+w-13,hy+8]].forEach(function(p){ ctx.fillRect(p[0],p[1],8,5); });
        // Porte
        ctx.fillStyle = "#0a0f0a"; ctx.fillRect(b.x-5, hy+h-12, 10, 12);
        ctx.font = "bold 9px 'Courier New'"; ctx.textAlign = "center";
        ctx.fillStyle = def.stroke; ctx.fillText("CSN", b.x, b.y-2); ctx.textAlign = "left";
    },

    _detail_workshop: function(ctx, b, hx, hy, w, h, isBlue, def) {
        // Grande porte coulissante
        ctx.fillStyle = "#0a0800"; ctx.fillRect(hx+6, hy+h-20, w-12, 20);
        ctx.strokeStyle = def.stroke; ctx.lineWidth = 1;
        ctx.strokeRect(hx+6, hy+h-20, w-12, 20);
        // Conduits / tuyaux
        ctx.strokeStyle = def.stroke; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(hx+w, hy+10); ctx.lineTo(hx+w+8, hy+10); ctx.lineTo(hx+w+8, hy+25); ctx.stroke();
        ctx.font = "bold 9px 'Courier New'"; ctx.textAlign = "center";
        ctx.fillStyle = def.stroke; ctx.fillText("ATL", b.x, hy+12); ctx.textAlign = "left";
    },

    _detail_hangar: function(ctx, b, hx, hy, w, h, isBlue, def) {
        // Toit arrondi
        ctx.beginPath(); ctx.ellipse(b.x, hy, w/2, 16, 0, Math.PI, 0);
        ctx.fillStyle = isBlue ? "#0e0e20" : "#200e0e"; ctx.fill();
        ctx.strokeStyle = def.stroke; ctx.lineWidth = 1.5; ctx.stroke();
        // Grande porte
        ctx.fillStyle = "#060610"; ctx.fillRect(hx+8, hy+h-16, w-16, 16);
        ctx.strokeStyle = def.stroke; ctx.lineWidth = 1; ctx.strokeRect(hx+8, hy+h-16, w-16, 16);
        ctx.font = "bold 9px 'Courier New'"; ctx.textAlign = "center";
        ctx.fillStyle = def.stroke; ctx.fillText("HGR", b.x, hy+8); ctx.textAlign = "left";
    },

    _detail_tower: function(ctx, b, hx, hy, w, h, isBlue, def) {
    // Socle de la tourelle
    ctx.fillStyle = isBlue ? "#0a0a20" : "#200a0a";
    ctx.fillRect(hx + 4, hy + 20, w - 8, h - 20);
    ctx.strokeStyle = def.stroke; ctx.lineWidth = 1;
    ctx.strokeRect(hx + 4, hy + 20, w - 8, h - 20);

    // Tourelle haute (tête rotative)
    ctx.fillStyle = "#0a0a14"; ctx.fillRect(hx, hy, w, 22);
    ctx.strokeStyle = def.stroke; ctx.lineWidth = 1.5; ctx.strokeRect(hx, hy, w, 22);

    // Canon orienté vers la cible (b._aimAngle) — ou vers le haut par défaut
    var angle = (b._aimAngle !== undefined) ? b._aimAngle : -Math.PI / 2;
    var cannonLen = 18;
    ctx.save();
    ctx.translate(b.x, hy + 11);   // centre de la tourelle
    ctx.rotate(angle);
    ctx.fillStyle = "#888";
    ctx.fillRect(0, -2, cannonLen, 4);
    // Cache-flamme
    ctx.fillStyle = "#aaa";
    ctx.fillRect(cannonLen - 3, -3, 5, 6);
    // Tube secondaire (mitrailleuse coaxiale)
    ctx.fillStyle = "#666";
    ctx.fillRect(0, 3, cannonLen - 4, 2);
    ctx.restore();

    // Anneau de rotation
    ctx.beginPath(); ctx.arc(b.x, hy + 11, 7, 0, Math.PI * 2);
    ctx.fillStyle = "#1a1a2a"; ctx.fill();
    ctx.strokeStyle = def.stroke; ctx.lineWidth = 1; ctx.stroke();

    // Label
    ctx.font = "bold 8px 'Courier New'"; ctx.textAlign = "center";
    ctx.fillStyle = def.stroke; ctx.fillText("TW", b.x, hy + 14); ctx.textAlign = "left";

    // Indicateur brouillage (EventSystem)
    if (RTS.EventSystem && RTS.EventSystem.isTowerJammed && RTS.EventSystem.isTowerJammed()) {
        ctx.font = "9px 'Courier New'"; ctx.textAlign = "center";
        ctx.fillStyle = "#e74c3c"; ctx.fillText("📵", b.x, hy - 4); ctx.textAlign = "left";
    }
},

    _detail_mine: function(ctx, b, hx, hy, w, h, isBlue, def) {
        // Toit en pente
        ctx.beginPath(); ctx.moveTo(hx-4, hy); ctx.lineTo(b.x, hy-14); ctx.lineTo(hx+w+4, hy); ctx.closePath();
        ctx.fillStyle = isBlue ? "#140e04" : "#200a0a"; ctx.fill();
        ctx.strokeStyle = def.stroke; ctx.lineWidth = 1.5; ctx.stroke();
        // Cheminée
        ctx.fillStyle = "#0a0a0a"; ctx.fillRect(hx+w-12, hy-12, 8, 14);
        ctx.strokeStyle = def.stroke; ctx.lineWidth = 1; ctx.strokeRect(hx+w-12, hy-12, 8, 14);
        ctx.font = "bold 9px 'Courier New'"; ctx.textAlign = "center";
        ctx.fillStyle = def.stroke; ctx.fillText("MINE", b.x, b.y+4); ctx.textAlign = "left";
    },

    _detail_refinery: function(ctx, b, hx, hy, w, h, isBlue, def) {
        // Cylindres verticaux (réservoirs)
        [[hx+4,6],[hx+w-14,8]].forEach(function(c){
            ctx.fillStyle = "#0a140a"; ctx.fillRect(c[0], hy, c[1], h);
            ctx.strokeStyle = def.stroke; ctx.lineWidth = 1; ctx.strokeRect(c[0], hy, c[1], h);
        });
        ctx.font = "bold 9px 'Courier New'"; ctx.textAlign = "center";
        ctx.fillStyle = def.stroke; ctx.fillText("RAF", b.x, b.y+4); ctx.textAlign = "left";
    },

    _detail_arsenal: function(ctx, b, hx, hy, w, h, isBlue, def) {
        // Caisses de munitions dessinées
        [[hx+5,hy+5],[hx+w-17,hy+5],[hx+5,hy+h-17],[hx+w-17,hy+h-17]].forEach(function(p){
            ctx.fillStyle = "#200808"; ctx.fillRect(p[0],p[1],12,12);
            ctx.strokeStyle = def.stroke; ctx.lineWidth = 1; ctx.strokeRect(p[0],p[1],12,12);
        });
        ctx.font = "bold 9px 'Courier New'"; ctx.textAlign = "center";
        ctx.fillStyle = def.stroke; ctx.fillText("ARS", b.x, b.y+4); ctx.textAlign = "left";
    },

    _detail_hospital: function(ctx, b, hx, hy, w, h, isBlue, def) {
        // Croix rouge sur fond blanc
        ctx.fillStyle = "rgba(255,255,255,.15)";
        ctx.fillRect(b.x-4, hy+8, 8, h-16);
        ctx.fillRect(hx+8, b.y-4, w-16, 8);
        ctx.font = "bold 10px 'Courier New'"; ctx.textAlign = "center";
        ctx.fillStyle = "#1abc9c"; ctx.fillText("MED", b.x, b.y+4); ctx.textAlign = "left";
    },

    _detail_wall: function(ctx, b, hx, hy, w, h, isBlue, def) {
        // Motif de briques
        ctx.strokeStyle = "rgba(150,150,150,.2)"; ctx.lineWidth = 0.5;
        for (var i = hx; i < hx+w; i+=13){ ctx.beginPath(); ctx.moveTo(i,hy); ctx.lineTo(i,hy+h); ctx.stroke(); }
    },

    _drawBars: function(ctx, b, hx, hy, w) {
        var pct = b.hp/b.maxHp;
        ctx.fillStyle = "rgba(0,0,0,.6)"; ctx.fillRect(hx, hy-12, w, 4);
        ctx.fillStyle = pct>.5?"#2ecc71":pct>.25?"#f39c12":"#e74c3c";
        ctx.fillRect(hx, hy-12, w*pct, 4);

        if (b.queue && b.queue.length > 0) {
            var prod = b.progress/b.productionTime;
            ctx.fillStyle = "rgba(0,0,0,.6)"; ctx.fillRect(hx, hy-7, w, 3);
            ctx.fillStyle = "#3d8ef5"; ctx.fillRect(hx, hy-7, w*prod, 3);
            ctx.font = "bold 8px 'Courier New'"; ctx.textAlign = "center";
            ctx.fillStyle = "#ffd232"; ctx.fillText("["+b.queue.length+"]", b.x+w/2+6, hy+2); ctx.textAlign="left";
        }
    },

    _drawGhost: function(ctx, game) {
        var mx = RTS.InputState.mouseX, my = RTS.InputState.mouseY;
        var w  = game.camera.screenToWorld(mx, my);
        var s  = 52;
        ctx.globalAlpha = 0.38;
        ctx.fillStyle   = "#3d8ef5"; ctx.fillRect(w.x-s/2, w.y-s/2, s, s);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = "#ffd232"; ctx.lineWidth = 1.5; ctx.strokeRect(w.x-s/2, w.y-s/2, s, s);
    },

    _updateProductionPanel: function(game) {
        var sel   = game.selectedBuildings;
        var panel = document.getElementById("prodPanel");
        var btns  = document.getElementById("prodBtns");

        if (!sel || sel.length===0) { panel.classList.add("hidden"); return; }
        var b = sel[0];
        var allowed = RTS.Building.ALLOWED[b.type];
        if (!allowed || allowed.length===0 || b.team!=="blue") { panel.classList.add("hidden"); return; }

        panel.classList.remove("hidden");
        document.getElementById("prodTitle").textContent = "Production — " + b.type.toUpperCase();
        document.getElementById("prodQueue").textContent = b.queue.length>0
            ? "File : "+b.queue.join(", ")+" ("+Math.ceil(b.productionTime-b.progress)+"s)"
            : "File vide";

        // Regénérer les boutons selon le bâtiment sélectionné
        if (btns.dataset.forType !== b.type) {
            btns.dataset.forType = b.type;
            btns.innerHTML = "";
            allowed.forEach(function(typeName) {
                var def  = RTS.SquadDefs[typeName];
                if (!def) return;
                var cost = def.cost;
                var lbl  = [];
                if (cost.gold) lbl.push(cost.gold+"G");
                if (cost.fuel) lbl.push(cost.fuel+"F");
                if (cost.ammo) lbl.push(cost.ammo+"A");
                var btn  = document.createElement("button");
                btn.className       = "prod-btn";
                btn.dataset.unit    = typeName;
                btn.innerHTML       = def.icon+" "+def.label+"<small>"+lbl.join(" ")+"</small>";
                btns.appendChild(btn);
            });
        }
    }
};