window.RTS = window.RTS || {};
RTS.Renderer = {};

RTS.Renderer.render = function(game) {
    var ctx = game.ctx;
    ctx.clearRect(0, 0, game.canvas.width, game.canvas.height);

    ctx.save();
    game.camera.applyTransform(ctx);

    RTS.Renderer._drawGrid(ctx, game.camera);
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, RTS.WORLD_W, RTS.WORLD_H);

    // Nœuds ressources
    RTS.Renderer._drawResourceNodes(ctx, game.resourceNodes);

    // Cratères
    game.craters.forEach(function(c) {
        ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI*2);
        ctx.fillStyle = "rgba(0,0,0,0.38)"; ctx.fill();
        ctx.strokeStyle = "rgba(80,60,40,0.4)"; ctx.lineWidth = 1.5; ctx.stroke();
    });

    // Particules (derrière)
    RTS.ParticleSystem.render(game.particles, ctx);

    // Bâtiments
    RTS.BuildingRenderer.render(game);

    // Projectiles
    RTS.ProjectileSystem.render(game.projectiles, ctx);

    // Squads
    RTS.SquadRenderer.render(game.squads, ctx);

    // Fog overlays the world, but does not obscure HUD controls.
    RTS.FogOfWar.render(game, ctx);
    ctx.restore();

    // HUD
    var blues = game.squads.filter(function(s){ return s.team==="blue" && !s.isDead(); }).length;
    var reds  = game.squads.filter(function(s){ return s.team==="red"  && !s.isDead(); }).length;
    document.getElementById("blueCount").textContent = blues;
    document.getElementById("redCount").textContent  = reds;

    RTS.Renderer._updateSelPanel(game);
};

RTS.Renderer._drawGrid = function(ctx, camera) {
    var alpha = Math.min(0.05, camera.zoom * 0.035);
    if (alpha < 0.004) return;
    ctx.strokeStyle = "rgba(255,255,255,"+alpha+")";
    ctx.lineWidth = 0.5;
    for (var x=0; x<=RTS.WORLD_W; x+=100){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,RTS.WORLD_H); ctx.stroke(); }
    for (var y=0; y<=RTS.WORLD_H; y+=100){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(RTS.WORLD_W,y); ctx.stroke(); }
};

RTS.Renderer._drawResourceNodes = function(ctx, nodes) {
    if (!nodes) return;
    nodes.forEach(function(n) {
        if (n.depleted) return;
        var style = RTS.ResourceNode.STYLE[n.type];
        var pct   = n.amount / n.maxAmount;
        ctx.beginPath(); ctx.arc(n.x, n.y, n.size, 0, Math.PI*2);
        ctx.fillStyle = style.bgColor; ctx.fill();
        ctx.strokeStyle = style.color; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(n.x-n.size, n.y+n.size+3, n.size*2, 3);
        ctx.fillStyle = style.color;
        ctx.fillRect(n.x-n.size, n.y+n.size+3, n.size*2*pct, 3);
        ctx.font = "bold 10px 'Courier New'"; ctx.textAlign = "center";
        ctx.fillStyle = style.color;
        ctx.fillText(n.type[0].toUpperCase(), n.x, n.y+4);
        ctx.textAlign = "left";
    });
};

RTS.Renderer._updateSelPanel = function(game) {
    var panel     = document.getElementById("selPanel");
    var info      = document.getElementById("selInfo");
    var prodPanel = document.getElementById("prodPanel");

    if (game.selectedSquads.length > 0) {
        panel.classList.remove("hidden");
        var prodVisible    = !prodPanel.classList.contains("hidden");
        panel.style.bottom = prodVisible ? (18 + prodPanel.offsetHeight + 8)+"px" : "18px";

        if (game.selectedSquads.length === 1) {
            var sq  = game.selectedSquads[0];
            var tot = sq.getTotalHp(), max = sq.getMaxHp();
            var pct = Math.round(tot/max*100);
            var col = sq.team==="blue" ? "#3d8ef5" : "#e74c3c";
            info.innerHTML =
                "<div style='color:"+col+";margin-bottom:4px;letter-spacing:.08em'>"+sq.label+"</div>"+
                "<div style='font-size:11px;color:rgba(255,255,255,.4)'>"+
                "HP "+Math.ceil(tot)+"/"+max+" ("+pct+"%)</div>"+
                "<div style='font-size:10px;color:rgba(255,255,255,.3);margin-top:2px'>"+
                "Membres : "+sq.aliveMembers().length+"/"+sq.members.length+"</div>"+
                (sq.def.combatMode==="harvest" && sq.carrying.amount > 0
                    ? "<div style='font-size:10px;color:#f5a623;margin-top:2px'>⛏ "+Math.ceil(sq.carrying.amount)+" "+sq.carrying.type+"</div>"
                    : "");
        } else {
            info.innerHTML = "<div>"+game.selectedSquads.length+" squads sélectionnés</div>";
        }
    } else {
        panel.classList.add("hidden");
        panel.style.bottom = "18px";
    }
};