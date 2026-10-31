window.RTS = window.RTS || {};

/**
 * SquadRenderer — rendu visuel de toutes les unités.
 *
 * Unités supportées (alignées sur SquadDefs) :
 *  Infanterie : riflemen, at_team, sniper_team, manpads
 *  Véhicules  : matv, bradley, m1a2, paladin, mlrs
 *  Aviation   : apache, blackhawk
 *  Support    : engineer, worker
 */
RTS.SquadRenderer = {

    render: function(squads, ctx) {
        squads.forEach(function(squad) {
            if (squad.selected) {
                RTS.SquadRenderer._drawSelectionCircle(ctx, squad);
            }
            squad.members.forEach(function(m) {
                if (m.dead) return;
                RTS.SquadRenderer._drawMember(ctx, m, squad);
            });
            RTS.SquadRenderer._drawSquadHpBar(ctx, squad);
            if (squad.selected) RTS.SquadRenderer._drawBadge(ctx, squad);
            if (squad.selected) RTS.SquadRenderer._drawTacticalHud(ctx, squad);
            if (squad.passengers && squad.passengers.length) {
                ctx.save();
                ctx.font = "bold 12px sans-serif";
                ctx.textAlign = "center";
                ctx.fillStyle = "#d9f99d";
                ctx.shadowColor = "#052e16";
                ctx.shadowBlur = 4;
                ctx.fillText("▣ " + squad.passengers.length + "/" + (RTS.TransportSystem ? RTS.TransportSystem.capacity(squad) : 3), squad.x, squad.y - 34);
                ctx.restore();
            }
        });
    },

    // ── Cercle de sélection ───────────────────────────────────────────────────

    _drawSelectionCircle: function(ctx, squad) {
        var alive  = squad.aliveMembers();
        var spread = squad.def.formationSpread || 0;
        var count  = alive.length;
        var cols   = Math.max(1, Math.ceil(Math.sqrt(count)));
        var radius = Math.max(16, (cols * spread) / 2 + squad.def.memberSize + 6);

        ctx.beginPath();
        ctx.arc(squad.x, squad.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = "#ffd232";
        ctx.lineWidth   = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
    },

    // ── Dispatch principal ────────────────────────────────────────────────────

    _drawMember: function(ctx, m, squad) {
        var s    = squad.def.memberSize;
        var type = squad.typeName;
        var isBlue = squad.team === "blue" || squad.team === "ally";

        // Contact shadow anchors each unit to the terrain.
        ctx.save();
        ctx.fillStyle = 'rgba(5,10,8,0.31)';
        ctx.beginPath();
        ctx.ellipse(m.x + 2, m.y + s * .33, Math.max(4, s * .48), Math.max(2, s * .22), 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Flash de touche
        if (m.flashTimer > 0) {
            ctx.fillStyle = "rgba(255,255,255,0.9)";
            ctx.fillRect(m.x - s/2, m.y - s/2, s, s);
            return;
        }

        if (!RTS.SpriteAtlas.draw(ctx,type,m.x,m.y,Math.max(s,18)*(squad.def.category==="infantry"?1.4:2.2),Math.max(s,18)*(squad.def.category==="infantry"?1.4:2.2),squad.heading||0,squad.team) && !RTS.SquadRenderer._drawModernSilhouette(ctx, m, s, squad)) {
        switch (type) {
            // ── Infanterie ──────────────────────────────────────────────────
            case "riflemen":    RTS.SquadRenderer._drawRiflemen(ctx, m, s, isBlue);   break;
            case "assault_team": RTS.SquadRenderer._drawRiflemen(ctx, m, s, isBlue); break;
            case "heavy_mg": RTS.SquadRenderer._drawAtTeam(ctx, m, s, isBlue); break;
            case "recon_team": RTS.SquadRenderer._drawSniperTeam(ctx, m, s, isBlue); break;
            case "at_team":     RTS.SquadRenderer._drawAtTeam(ctx, m, s, isBlue);     break;
            case "sniper_team": RTS.SquadRenderer._drawSniperTeam(ctx, m, s, isBlue); break;
            case "manpads":     RTS.SquadRenderer._drawManpads(ctx, m, s, isBlue);    break;
            // ── Véhicules ──────────────────────────────────────────────────
            case "matv":        RTS.SquadRenderer._drawMatv(ctx, m, s, isBlue);       break;
            case "bradley":     RTS.SquadRenderer._drawBradley(ctx, m, s, isBlue);    break;
            case "wheeled_ifv": RTS.SquadRenderer._drawBradley(ctx, m, s, isBlue); break;
            case "mechanized_scout": RTS.SquadRenderer._drawMatv(ctx, m, s, isBlue); break;
            case "rocket_artillery": RTS.SquadRenderer._drawPaladin(ctx, m, s, isBlue); break;
            case "mobile_aa": RTS.SquadRenderer._drawMlrs(ctx, m, s, isBlue); break;
            case "m1a2":        RTS.SquadRenderer._drawM1a2(ctx, m, s, isBlue);       break;
            case "paladin":     RTS.SquadRenderer._drawPaladin(ctx, m, s, isBlue);    break;
            case "mlrs":        RTS.SquadRenderer._drawMlrs(ctx, m, s, isBlue);       break;
            // ── Aviation ───────────────────────────────────────────────────
            case "apache":      RTS.SquadRenderer._drawApache(ctx, m, s, isBlue);     break;
            case "attack_drone": RTS.SquadRenderer._drawApache(ctx, m, s, isBlue); break;
            case "recon_drone": RTS.SquadRenderer._drawBlackhawk(ctx, m, s, isBlue); break;
            case "interceptor_drone": RTS.SquadRenderer._drawApache(ctx, m, s, isBlue); break;
            case "blackhawk":   RTS.SquadRenderer._drawBlackhawk(ctx, m, s, isBlue);  break;
            // ── Support ────────────────────────────────────────────────────
            case "engineer":    RTS.SquadRenderer._drawEngineer(ctx, m, s, isBlue);   break;
            case "combat_medic": RTS.SquadRenderer._drawEngineer(ctx, m, s, isBlue); break;
            case "worker":      RTS.SquadRenderer._drawWorker(ctx, m, s, isBlue);     break;
            case "grenadier_team": RTS.SquadRenderer._drawAtTeam(ctx,m,s,isBlue); break;
            case "combat_engineers": RTS.SquadRenderer._drawEngineer(ctx,m,s,isBlue); break;
            case "tank_destroyer": RTS.SquadRenderer._drawM1a2(ctx,m,s,isBlue); break;
            case "armored_car": RTS.SquadRenderer._drawMatv(ctx,m,s,isBlue); break;
            case "heavy_aa": RTS.SquadRenderer._drawMlrs(ctx,m,s,isBlue); break;
            case "ew_drone": RTS.SquadRenderer._drawBlackhawk(ctx,m,s,isBlue); break;
            case "gunship": RTS.SquadRenderer._drawApache(ctx,m,s,isBlue); break;
            case "light_attack_heli": RTS.SquadRenderer._drawBlackhawk(ctx,m,s,isBlue); break;
            case "special_forces": RTS.SquadRenderer._drawRiflemen(ctx,m,s,isBlue); break;
            case "paratroopers": RTS.SquadRenderer._drawRiflemen(ctx,m,s,isBlue); break;
            case "mortar_team": RTS.SquadRenderer._drawAtTeam(ctx,m,s,isBlue); break;
            case "apc": RTS.SquadRenderer._drawBradley(ctx,m,s,isBlue); break;
            case "armored_engineer": RTS.SquadRenderer._drawMatv(ctx,m,s,isBlue); break;
            case "supply_truck": RTS.SquadRenderer._drawMatv(ctx,m,s,isBlue); break;
            case "selfpropelled_mortar": RTS.SquadRenderer._drawPaladin(ctx,m,s,isBlue); break;
            case "long_range_aa": RTS.SquadRenderer._drawMlrs(ctx,m,s,isBlue); break;
            case "heavy_transport_heli": RTS.SquadRenderer._drawBlackhawk(ctx,m,s,isBlue); break;
            case "fighter_aircraft": RTS.SquadRenderer._drawApache(ctx,m,s,isBlue); break;
            case "strike_aircraft": RTS.SquadRenderer._drawApache(ctx,m,s,isBlue); break;
            case "loitering_drone": RTS.SquadRenderer._drawApache(ctx,m,s,isBlue); break;
            case "heavy_mbt": RTS.SquadRenderer._drawM1a2(ctx,m,s,isBlue); break;
            case "wheeled_at": RTS.SquadRenderer._drawBradley(ctx,m,s,isBlue); break;
            case "air_defense_radar": RTS.SquadRenderer._drawMlrs(ctx,m,s,isBlue); break;
            case "ammo_carrier": RTS.SquadRenderer._drawMatv(ctx,m,s,isBlue); break;
            // Fallback (anciens noms ou inconnus)
            default:            RTS.SquadRenderer._drawRiflemen(ctx, m, s, isBlue);   break;
        }

        }

        // Flash de bouche de canon
        if (m.muzzleFlash > 0) {
            var angle = m.fireAngle || 0;
            ctx.save();
            ctx.translate(m.x, m.y);
            ctx.rotate(angle);
            ctx.fillStyle = "rgba(255,240,150,0.95)";
            ctx.beginPath();
            ctx.arc(s / 2 + 5, 0, 5, 0, Math.PI * 2);
            ctx.fill();
            // Anneau externe
            ctx.strokeStyle = "rgba(255,180,60,0.6)";
            ctx.lineWidth   = 1.5;
            ctx.beginPath();
            ctx.arc(s / 2 + 5, 0, 8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Barre HP individuelle
        var pct = m.hp / m.maxHp;
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        if (squad.selected && pct < 0.99) {
            ctx.fillRect(m.x - s/2, m.y + s/2 + 2, s, 3);
            ctx.fillStyle = pct > 0.5 ? "#2ecc71" : pct > 0.25 ? "#f39c12" : "#e74c3c";
            ctx.fillRect(m.x - s/2, m.y + s/2 + 2, s * pct, 3);
        }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    //  INFANTERIE
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Riflemen — M4A1 / AK-74M
     * Corps camouflé, casque MICH, fusil d'assaut latéral.
     */
    // Shared illustrated top-down silhouettes. Shape and equipment encode combat role,
    // rather than changing only the badge or recoloring identical rectangles.
    _drawModernSilhouette: function(ctx, m, size, squad) {
        var d=squad.def || {}, kind=d.category, type=squad.typeName || '';
        if (kind !== 'infantry' && kind !== 'vehicle' && kind !== 'air' && kind !== 'support') return false;
        var blue=squad.team !== 'red', accent=blue?'#66a9d8':'#d58a72';
        var metal=blue?'#526452':'#66604a', dark=blue?'#2d3b34':'#40372f';
        var light=blue?'#82917b':'#958a74';
        var angle=Number.isFinite(squad.heading)?squad.heading:0;
        var infantry=kind==='infantry'||(kind==='support'&&!/truck|carrier|engineer_vehicle/.test(type));
        var airborne=kind==='air';
        ctx.save();
        ctx.translate(m.x,m.y);
        if(infantry){
            var u=Math.max(13,size);
            // Person seen from above: helmet, shoulders, pack, boots and individual weapon.
            ctx.rotate(angle);
            ctx.fillStyle='rgba(0,0,0,.3)';
            ctx.beginPath();ctx.ellipse(1,3,u*.46,u*.30,0,0,Math.PI*2);ctx.fill();
            ctx.fillStyle=dark;ctx.fillRect(-u*.24,u*.12,u*.18,u*.28);ctx.fillRect(u*.06,u*.12,u*.18,u*.28);
            ctx.fillStyle=metal;ctx.beginPath();ctx.ellipse(0,0,u*.39,u*.28,0,0,Math.PI*2);ctx.fill();
            ctx.fillStyle=light;ctx.fillRect(-u*.32,-u*.12,u*.64,u*.22);
            ctx.fillStyle=dark;ctx.fillRect(-u*.24,u*.18,u*.48,u*.14);
            ctx.fillStyle='#b5a78b';ctx.beginPath();ctx.arc(0,-u*.31,u*.20,0,Math.PI*2);ctx.fill();
            ctx.fillStyle=metal;ctx.beginPath();ctx.arc(0,-u*.35,u*.22,Math.PI,0);ctx.lineTo(u*.22,-u*.31);ctx.fill();
            var heavy=/at_|manpads|mortar|heavy_mg|grenadier/.test(type);
            var scoped=/sniper|recon/.test(type);
            ctx.fillStyle=heavy?'#262f2b':'#202b28';
            ctx.fillRect(u*.16,-u*.55,heavy?u*.20:u*.12,heavy?u*.65:u*.56);
            if(scoped){ctx.fillStyle='#93adb0';ctx.fillRect(u*.20,-u*.39,u*.08,u*.14);}
            if(heavy){ctx.strokeStyle='#d5c59b';ctx.lineWidth=1.5;ctx.strokeRect(u*.12,-u*.56,u*.25,u*.40);}
            if(/medic/.test(type)){ctx.fillStyle='#e8e8dc';ctx.fillRect(-u*.18,-u*.05,u*.36,u*.21);ctx.fillStyle='#a13b38';ctx.fillRect(-u*.04,-u*.05,u*.08,u*.21);}
        }else{
            var w=Math.max(29,size*(airborne?1.8:1.25)), h=Math.max(18,size*(airborne?1.05:.82));
            if(/mbt|m1a2|tank_destroyer/.test(type)){w=Math.max(w,38);h=Math.max(h,25);}
            if(airborne){w=Math.max(w,43);h=Math.max(h,26);}
            ctx.fillStyle='rgba(2,9,11,.33)';
            ctx.beginPath();ctx.ellipse(3,airborne?12:5,w*.57,h*.47,0,0,Math.PI*2);ctx.fill();
            ctx.rotate(angle);
            if(airborne){
                var drone=/drone/.test(type), plane=/aircraft/.test(type);
                if(plane){
                    ctx.fillStyle=metal;
                    ctx.beginPath();ctx.moveTo(0,-h*.86);ctx.lineTo(w*.15,-h*.20);ctx.lineTo(w*.54,h*.10);ctx.lineTo(w*.54,h*.28);ctx.lineTo(w*.13,h*.15);ctx.lineTo(w*.16,h*.57);ctx.lineTo(0,h*.42);ctx.lineTo(-w*.16,h*.57);ctx.lineTo(-w*.13,h*.15);ctx.lineTo(-w*.54,h*.28);ctx.lineTo(-w*.54,h*.1);ctx.lineTo(-w*.15,-h*.20);ctx.closePath();ctx.fill();
                    ctx.fillStyle=dark;ctx.fillRect(-w*.08,-h*.43,w*.16,h*.40);
                }else{
                    ctx.fillStyle=dark;ctx.fillRect(-w*.06,h*.14,w*.12,h*.56);
                    ctx.fillStyle=metal;ctx.beginPath();ctx.ellipse(0,0,w*(drone?.16:.25),h*.48,0,0,Math.PI*2);ctx.fill();
                    ctx.fillStyle=light;ctx.fillRect(-w*.43,-h*.08,w*.86,h*.16);
                    ctx.strokeStyle='#8c9c92';ctx.lineWidth=1.7;
                    ctx.beginPath();ctx.moveTo(-w*.48,0);ctx.lineTo(w*.48,0);ctx.stroke();
                    ctx.strokeStyle='rgba(190,214,205,.53)';ctx.lineWidth=2;
                    ctx.beginPath();ctx.ellipse(0,0,w*.51,h*.12,0,0,Math.PI*2);ctx.stroke();
                    ctx.fillStyle=dark;ctx.fillRect(-w*.1,-h*.24,w*.2,h*.19);
                }
            }else{
                var wheels=/wheeled|matv|truck|carrier|armored_car|apc/.test(type);
                ctx.fillStyle='#191f1a';
                if(wheels){for(var i=-1;i<=1;i+=2){ctx.fillRect(i*w*.43-w*.055,-h*.46,w*.11,h*.23);ctx.fillRect(i*w*.43-w*.055,h*.24,w*.11,h*.23);}}
                else{ctx.fillRect(-w*.52,-h*.44,w*.15,h*.88);ctx.fillRect(w*.37,-h*.44,w*.15,h*.88);}
                ctx.fillStyle=metal;ctx.strokeStyle=light;ctx.lineWidth=1.4;
                ctx.beginPath();ctx.moveTo(-w*.38,-h*.36);ctx.lineTo(w*.32,-h*.36);ctx.lineTo(w*.44,-h*.20);ctx.lineTo(w*.44,h*.27);ctx.lineTo(w*.27,h*.39);ctx.lineTo(-w*.38,h*.39);ctx.closePath();ctx.fill();ctx.stroke();
                ctx.fillStyle=dark;ctx.fillRect(-w*.23,-h*.23,w*.42,h*.15);
                var aa=/aa|sam|air_defense|manpads/.test(type), artillery=/artillery|mlrs|paladin|mortar/.test(type);
                var transport=/apc|carrier|truck|transport/.test(type);
                if(transport){
                    ctx.fillStyle=light;ctx.fillRect(-w*.25,-h*.02,w*.50,h*.25);
                    ctx.strokeStyle=accent;ctx.lineWidth=2;ctx.strokeRect(-w*.24,-h*.02,w*.48,h*.23);
                }else if(aa||artillery){
                    ctx.fillStyle=dark;ctx.fillRect(-w*.2,-h*.18,w*.40,h*.37);
                    ctx.fillStyle=light;
                    if(aa){for(var t=-1;t<=1;t+=2){ctx.fillRect(t*w*.12-w*.075,-h*.48,w*.15,h*.33);}}
                    else{for(var j=-1;j<=1;j+=2){ctx.fillRect(j*w*.13-w*.05,-h*.50,w*.10,h*.44);}}
                }else{
                    ctx.fillStyle=light;ctx.beginPath();ctx.ellipse(0,-h*.02,w*.26,h*.27,0,0,Math.PI*2);ctx.fill();
                    ctx.fillStyle=dark;ctx.fillRect(-w*.065,-h*.65,w*.13,h*.52);
                    ctx.fillStyle=light;ctx.fillRect(-w*.08,-h*.67,w*.16,h*.12);
                }
                ctx.fillStyle=accent;ctx.fillRect(-w*.34,h*.29,w*.25,2.5);
                ctx.fillStyle='rgba(215,226,208,.26)';ctx.fillRect(-w*.32,-h*.31,w*.58,2);
            }
        }
        ctx.restore();
        return true;
    },

    _drawRiflemen: function(ctx, m, s, isBlue) {
        var hx = m.x - s/2, hy = m.y - s/2;

        // Corps (BDU camouflé)
        ctx.fillStyle = isBlue ? "#2c3e2d" : "#3e2c2c";
        ctx.fillRect(hx, hy + Math.round(s*0.35), s, Math.round(s*0.65));

        // Gilet pare-balles / équipement MOLLE
        ctx.fillStyle = isBlue ? "#3d5a3e" : "#5a3d3d";
        ctx.fillRect(hx + 1, hy + Math.round(s*0.38), s - 2, Math.round(s*0.40));

        // Poche frontale équipement
        ctx.fillStyle = isBlue ? "#2a4a2b" : "#4a2a2a";
        ctx.fillRect(hx + 3, hy + Math.round(s*0.50), Math.round(s*0.4), Math.round(s*0.2));

        // Tête
        ctx.fillStyle = isBlue ? "#c8a87a" : "#c8a87a";
        ctx.beginPath();
        ctx.arc(m.x, hy + Math.round(s*0.22), Math.round(s*0.22), 0, Math.PI * 2);
        ctx.fill();

        // Casque MICH
        ctx.fillStyle = isBlue ? "#3a4a2a" : "#4a3a2a";
        ctx.beginPath();
        ctx.arc(m.x, hy + Math.round(s*0.20), Math.round(s*0.21), Math.PI, 0);
        ctx.fill();
        ctx.fillRect(hx + 2, hy + Math.round(s*0.20), s - 4, 3);

        // M4A1 / AK (fusil horizontal côté droit)
        ctx.fillStyle = "#444";
        ctx.fillRect(m.x, m.y - 1, Math.round(s*0.95), 2);
        // Chargeur
        ctx.fillRect(m.x + Math.round(s*0.35), m.y + 1, 4, 4);
        // Poignée pistolet
        ctx.fillRect(m.x + Math.round(s*0.5), m.y + 1, 3, 5);
    },

    /**
     * AT Team — Javelin FGM-148 / RPG-29
     * Même silhouette que Riflemen + tube lance-missile sur l'épaule.
     */
    _drawAtTeam: function(ctx, m, s, isBlue) {
        var hx = m.x - s/2, hy = m.y - s/2;

        // Corps
        ctx.fillStyle = isBlue ? "#2c3e2d" : "#3e2c2c";
        ctx.fillRect(hx, hy + Math.round(s*0.35), s, Math.round(s*0.65));

        // Gilet lourd + pouches
        ctx.fillStyle = isBlue ? "#4a5a30" : "#5a4030";
        ctx.fillRect(hx + 1, hy + Math.round(s*0.38), s - 2, Math.round(s*0.38));
        ctx.fillStyle = isBlue ? "#3a4a22" : "#4a3a22";
        ctx.fillRect(hx + 2, hy + Math.round(s*0.55), 5, Math.round(s*0.18));

        // Tête
        ctx.fillStyle = "#c8a87a";
        ctx.beginPath();
        ctx.arc(m.x, hy + Math.round(s*0.22), Math.round(s*0.22), 0, Math.PI * 2);
        ctx.fill();

        // Casque Ops-Core
        ctx.fillStyle = isBlue ? "#2a3a1a" : "#3a2a1a";
        ctx.beginPath();
        ctx.arc(m.x, hy + Math.round(s*0.20), Math.round(s*0.22), Math.PI, 0);
        ctx.fill();
        ctx.fillRect(hx + 2, hy + Math.round(s*0.20), s - 4, 3);

        // Tube Javelin sur l'épaule — cylindre épais
        ctx.fillStyle = "#556655";
        ctx.fillRect(hx - 4, hy + Math.round(s*0.28), s + 8, 5);
        // Boîtier CLU (visée thermique)
        ctx.fillStyle = "#334433";
        ctx.fillRect(m.x - 3, hy + Math.round(s*0.24), 8, 8);
        // Embout arrière (gaz)
        ctx.fillStyle = "#222";
        ctx.fillRect(hx - 6, hy + Math.round(s*0.29), 4, 3);
        // Ogive avant
        ctx.fillStyle = "#778866";
        ctx.beginPath();
        ctx.moveTo(hx + s + 4, hy + Math.round(s*0.28));
        ctx.lineTo(hx + s + 8, hy + Math.round(s*0.305));
        ctx.lineTo(hx + s + 4, hy + Math.round(s*0.33));
        ctx.closePath();
        ctx.fill();
    },

    /**
     * Sniper Team — M24 SWS / SV-98
     * Ghillie suit sombre, long canon avec silencieux, lunette de visée.
     */
    _drawSniperTeam: function(ctx, m, s, isBlue) {
        var hx = m.x - s/2, hy = m.y - s/2;

        // Corps couché / accroupi — ghillie
        ctx.fillStyle = isBlue ? "#1e2e18" : "#2e1e28";
        ctx.fillRect(hx, hy + Math.round(s*0.30), s, Math.round(s*0.70));
        // Texture ghillie (irrégularités)
        ctx.fillStyle = isBlue ? "#2a3f20" : "#3f2a30";
        for (var i = 0; i < 4; i++) {
            ctx.fillRect(hx + i * Math.round(s*0.25), hy + Math.round(s*0.38), Math.round(s*0.18), Math.round(s*0.18));
        }

        // Tête (cagoule ghillie)
        ctx.fillStyle = isBlue ? "#263820" : "#382026";
        ctx.beginPath();
        ctx.arc(m.x, hy + Math.round(s*0.22), Math.round(s*0.22), 0, Math.PI * 2);
        ctx.fill();
        // Lunette au visage
        ctx.strokeStyle = isBlue ? "#8e44ad" : "#6c3483";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(m.x + 2, hy + Math.round(s*0.22), Math.round(s*0.10), 0, Math.PI * 2);
        ctx.stroke();

        // Long canon (M24 — 610 mm de canon)
        ctx.fillStyle = "#555";
        ctx.fillRect(hx - 5, m.y - 1, s + 14, 2);
        // Silencieux au bout
        ctx.fillStyle = "#444";
        ctx.fillRect(hx + s + 6, m.y - 2, 6, 4);
        // Bipied
        ctx.strokeStyle = "#444";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(hx + 4, m.y + 1); ctx.lineTo(hx + 2, m.y + 7);
        ctx.moveTo(hx + 8, m.y + 1); ctx.lineTo(hx + 10, m.y + 7);
        ctx.stroke();
        // Lunette Schmidt & Bender
        ctx.fillStyle = "#333";
        ctx.fillRect(m.x - 4, m.y - 4, 10, 4);
        ctx.strokeStyle = "#8e44ad";
        ctx.lineWidth = 0.5;
        ctx.strokeRect(m.x - 4, m.y - 4, 10, 4);
    },

    /**
     * MANPADS — Stinger FIM-92 / Igla-S 9K38
     * Tube sol-air sur l'épaule, pointé vers le ciel.
     */
    _drawManpads: function(ctx, m, s, isBlue) {
        var hx = m.x - s/2, hy = m.y - s/2;

        // Corps
        ctx.fillStyle = isBlue ? "#1e3428" : "#341e1e";
        ctx.fillRect(hx, hy + Math.round(s*0.35), s, Math.round(s*0.65));

        // Gilet
        ctx.fillStyle = isBlue ? "#2e4a38" : "#4a2e2e";
        ctx.fillRect(hx + 1, hy + Math.round(s*0.38), s - 2, Math.round(s*0.36));

        // Tête
        ctx.fillStyle = "#c8a87a";
        ctx.beginPath();
        ctx.arc(m.x, hy + Math.round(s*0.22), Math.round(s*0.22), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = isBlue ? "#1e3428" : "#341e1e";
        ctx.beginPath();
        ctx.arc(m.x, hy + Math.round(s*0.20), Math.round(s*0.21), Math.PI, 0);
        ctx.fill();
        ctx.fillRect(hx + 2, hy + Math.round(s*0.20), s - 4, 3);

        // Tube Stinger incliné vers le haut (~45°)
        ctx.save();
        ctx.translate(m.x - 2, m.y - Math.round(s*0.05));
        ctx.rotate(-Math.PI / 4);
        ctx.fillStyle = "#4a7a6a";
        ctx.fillRect(-3, -Math.round(s*0.95), 6, Math.round(s*0.95));
        // Ogive
        ctx.fillStyle = "#5a9a8a";
        ctx.beginPath();
        ctx.moveTo(-3, -Math.round(s*0.95));
        ctx.lineTo(0,  -Math.round(s*1.05));
        ctx.lineTo(3,  -Math.round(s*0.95));
        ctx.closePath();
        ctx.fill();
        // Poignée BCU
        ctx.fillStyle = "#333";
        ctx.fillRect(-4, -Math.round(s*0.25), 8, 6);
        ctx.restore();
    },

    // ═══════════════════════════════════════════════════════════════════════════
    //  VÉHICULES
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * M-ATV MRAP — Véhicule léger protégé
     * Profil haut, blindage en V (mine résistant), mitrailleuse en tourelle.
     */
    _drawMatv: function(ctx, m, s, isBlue) {
        var hx = m.x - s/2, hy = m.y - s/2;

        // Roues (4 roues visibles)
        ctx.fillStyle = "#1a1a1a";
        var wr = Math.round(s*0.15);
        [[hx,     hy + s - wr], [hx + s - wr*2, hy + s - wr]].forEach(function(p) {
            ctx.beginPath();
            ctx.ellipse(p[0] + wr, p[1] + wr, wr, wr * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();
        });

        // Caisse blindée (profil en V anti-mine)
        ctx.fillStyle   = isBlue ? "#2c3e28" : "#3e2c2c";
        ctx.strokeStyle = isBlue ? "#3d8ef5" : "#e74c3c";
        ctx.lineWidth   = 1.5;
        ctx.beginPath();
        ctx.moveTo(hx,         hy + Math.round(s*0.25));
        ctx.lineTo(hx + s,     hy + Math.round(s*0.25));
        ctx.lineTo(hx + s,     hy + Math.round(s*0.75));
        ctx.lineTo(hx + s*0.8, hy + s);
        ctx.lineTo(hx + s*0.2, hy + s);
        ctx.lineTo(hx,         hy + Math.round(s*0.75));
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        // Cabine blindée
        ctx.fillStyle = isBlue ? "#243820" : "#382024";
        ctx.fillRect(hx + 3, hy, s - 6, Math.round(s*0.30));
        ctx.strokeRect(hx + 3, hy, s - 6, Math.round(s*0.30));

        // Fenêtres blindées (renforcées)
        ctx.fillStyle = "rgba(100,160,180,0.4)";
        ctx.fillRect(hx + 5, hy + 2, Math.round(s*0.3), Math.round(s*0.18));
        ctx.fillRect(hx + s - Math.round(s*0.35) - 5, hy + 2, Math.round(s*0.3), Math.round(s*0.18));

        // Tourelle M2 .50 cal
        ctx.fillStyle   = isBlue ? "#1a2a16" : "#2a1a16";
        ctx.fillRect(m.x - 5, hy - 6, 10, 8);
        ctx.strokeStyle = isBlue ? "#3d8ef5" : "#e74c3c";
        ctx.lineWidth   = 1;
        ctx.strokeRect(m.x - 5, hy - 6, 10, 8);
        // Canon M2
        ctx.fillStyle = "#333";
        ctx.fillRect(m.x - 1, hy - 14, 3, 10);
    },

    /**
     * M2A3 Bradley IFV — Véhicule de combat d'infanterie
     * Canon M242 Bushmaster 25mm, missiles TOW, chenilles.
     */
    _drawBradley: function(ctx, m, s, isBlue) {
        var hx = m.x - s/2, hy = m.y - s/2;

        // Chenilles
        ctx.fillStyle = "#111";
        ctx.fillRect(hx - 5, hy + Math.round(s*0.2), 5, Math.round(s*0.65));
        ctx.fillRect(hx + s, hy + Math.round(s*0.2), 5, Math.round(s*0.65));
        // Rouleaux de chenilles
        ctx.fillStyle = "#222";
        for (var i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(hx - 2, hy + Math.round(s*(0.28 + i*0.2)), 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(hx + s + 2, hy + Math.round(s*(0.28 + i*0.2)), 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Châssis
        ctx.fillStyle   = isBlue ? "#1e3a20" : "#3a1e1e";
        ctx.strokeStyle = isBlue ? "#16a085" : "#a01616";
        ctx.lineWidth   = 1.5;
        ctx.fillRect(hx, hy + Math.round(s*0.30), s, Math.round(s*0.70));
        ctx.strokeRect(hx, hy + Math.round(s*0.30), s, Math.round(s*0.70));

        // Tourelle décalée à gauche (spécifique au Bradley)
        var tw = Math.round(s*0.6);
        ctx.fillStyle = isBlue ? "#123018" : "#301212";
        ctx.fillRect(hx + 2, hy + Math.round(s*0.06), tw, Math.round(s*0.32));
        ctx.strokeStyle = isBlue ? "#16a085" : "#a01616";
        ctx.lineWidth   = 1;
        ctx.strokeRect(hx + 2, hy + Math.round(s*0.06), tw, Math.round(s*0.32));

        // Canon M242 Bushmaster 25mm (plus long que le M1)
        ctx.fillStyle = "#333";
        ctx.fillRect(hx + Math.round(s*0.3) - 2, hy - 16, 3, 20);
        ctx.fillRect(hx + Math.round(s*0.3) - 2, hy - 16, 5, 3); // cache-flamme

        // Missiles TOW (2 tubes) sur le côté tourelle
        ctx.fillStyle = "#556655";
        ctx.fillRect(hx + tw - 2, hy + Math.round(s*0.08), 8, 4);
        ctx.fillRect(hx + tw - 2, hy + Math.round(s*0.16), 8, 4);

        // Trappe d'infanterie
        ctx.strokeStyle = "rgba(150,220,150,0.25)";
        ctx.lineWidth   = 0.5;
        ctx.strokeRect(hx + s - Math.round(s*0.4), hy + Math.round(s*0.50), Math.round(s*0.35), Math.round(s*0.28));
    },

    /**
     * M1A2 SEP Abrams — MBT
     * Blindage Chobham, tourelle imposante, canon 120mm M256.
     */
    _drawM1a2: function(ctx, m, s, isBlue) {
        var hx = m.x - s/2, hy = m.y - s/2;

        // Chenilles (larges et détaillées)
        ctx.fillStyle = "#0d0d0d";
        ctx.fillRect(hx - 6, hy + Math.round(s*0.18), 6, Math.round(s*0.70));
        ctx.fillRect(hx + s, hy + Math.round(s*0.18), 6, Math.round(s*0.70));
        // Crampons chenilles
        ctx.fillStyle = "#1a1a1a";
        ctx.strokeStyle = "#0a0a0a";
        ctx.lineWidth = 0.5;
        for (var ci = 0; ci < 5; ci++) {
            ctx.fillRect(hx - 6, hy + Math.round(s*(0.22 + ci*0.13)), 6, Math.round(s*0.10));
            ctx.fillRect(hx + s, hy + Math.round(s*(0.22 + ci*0.13)), 6, Math.round(s*0.10));
        }
        // Galets porteurs
        ctx.fillStyle = "#222";
        for (var gi = 0; gi < 4; gi++) {
            ctx.beginPath(); ctx.arc(hx - 3, hy + Math.round(s*(0.28+gi*0.16)), 4, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(hx+s+3, hy + Math.round(s*(0.28+gi*0.16)), 4, 0, Math.PI*2); ctx.fill();
        }

        // Caisse blindée (pente frontale caractéristique)
        ctx.fillStyle = isBlue ? "#162814" : "#281614";
        ctx.strokeStyle = isBlue ? "#2ecc71" : "#e74c3c";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(hx,         hy + Math.round(s*0.28));
        ctx.lineTo(hx + s,     hy + Math.round(s*0.28));
        ctx.lineTo(hx + s,     hy + s);
        ctx.lineTo(hx,         hy + s);
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        // Plaque frontale inclinée ERA (armure réactive explosive)
        ctx.fillStyle = isBlue ? "#1e3a1c" : "#3a1c1c";
        ctx.beginPath();
        ctx.moveTo(hx,     hy + Math.round(s*0.28));
        ctx.lineTo(hx + s, hy + Math.round(s*0.28));
        ctx.lineTo(hx + s - 4, hy + Math.round(s*0.42));
        ctx.lineTo(hx + 4,     hy + Math.round(s*0.42));
        ctx.closePath();
        ctx.fill();

        // Tourelle — large, basse, asymétrique (bustle à l'arrière)
        var tw = Math.round(s*0.75);
        var tx = m.x - tw/2;
        ctx.fillStyle   = isBlue ? "#102010" : "#201010";
        ctx.strokeStyle = isBlue ? "#2ecc71" : "#e74c3c";
        ctx.lineWidth   = 1.5;
        ctx.beginPath();
        // Forme polygonale de la tourelle Abrams
        ctx.moveTo(tx,       hy + Math.round(s*0.02));
        ctx.lineTo(tx + tw,  hy + Math.round(s*0.02));
        ctx.lineTo(tx + tw + 4, hy + Math.round(s*0.22));   // bustle
        ctx.lineTo(tx + tw,  hy + Math.round(s*0.30));
        ctx.lineTo(tx,       hy + Math.round(s*0.30));
        ctx.lineTo(tx - 4,   hy + Math.round(s*0.16));
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        // Canon M256 120mm — long et épais
        ctx.fillStyle = "#2a2a2a";
        ctx.fillRect(m.x - 3, hy - 22, 5, 26);
        // Cache-flamme thermal sleeve
        ctx.fillStyle = "#1a1a1a";
        ctx.fillRect(m.x - 4, hy - 22, 7, 5);
        ctx.fillRect(m.x - 2, hy - 22, 3, 2);  // forure

        // Mitrailleuse coaxiale M240
        ctx.fillStyle = "#333";
        ctx.fillRect(m.x + 4, hy - 8, 1, 12);

        // Antenne radio (arrière droit tourelle)
        ctx.strokeStyle = "rgba(100,180,100,0.5)";
        ctx.lineWidth   = 0.75;
        ctx.beginPath();
        ctx.moveTo(tx + tw - 4, hy + Math.round(s*0.04));
        ctx.lineTo(tx + tw + 2, hy - 14);
        ctx.stroke();

        // Détail thermique : bloc ERA sur les flancs
        ctx.fillStyle = isBlue ? "#0e2810" : "#280e0e";
        for (var ei = 0; ei < 3; ei++) {
            ctx.fillRect(hx + 2, hy + Math.round(s*(0.44 + ei*0.16)), 6, Math.round(s*0.12));
            ctx.fillRect(hx + s - 8, hy + Math.round(s*(0.44 + ei*0.16)), 6, Math.round(s*0.12));
        }
    },

    /**
     * M109A7 Paladin SPH — Obusier automoteur 155mm
     * Canon long incliné, châssis M113, blindage léger.
     */
    _drawPaladin: function(ctx, m, s, isBlue) {
        var hx = m.x - s/2, hy = m.y - s/2;

        // Chenilles
        ctx.fillStyle = "#111";
        ctx.fillRect(hx - 4, hy + Math.round(s*0.22), 5, Math.round(s*0.68));
        ctx.fillRect(hx + s - 1, hy + Math.round(s*0.22), 5, Math.round(s*0.68));

        // Châssis M109
        ctx.fillStyle   = isBlue ? "#2a2010" : "#2a1010";
        ctx.strokeStyle = isBlue ? "#e67e22" : "#c0392b";
        ctx.lineWidth   = 1.5;
        ctx.fillRect(hx, hy + Math.round(s*0.28), s, Math.round(s*0.72));
        ctx.strokeRect(hx, hy + Math.round(s*0.28), s, Math.round(s*0.72));

        // Tourelle panoramique large
        ctx.fillStyle = isBlue ? "#1c1608" : "#1c0808";
        var tw = Math.round(s*0.78);
        ctx.beginPath();
        ctx.arc(m.x, hy + Math.round(s*0.28), tw/2, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = isBlue ? "#e67e22" : "#c0392b";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Canon 155mm M284 — très long, incliné +30°
        ctx.save();
        ctx.translate(m.x, hy + Math.round(s*0.18));
        ctx.rotate(-Math.PI / 6);
        ctx.fillStyle = "#3a3a3a";
        ctx.fillRect(-3, -Math.round(s*0.95), 6, Math.round(s*0.95));
        // Frein de bouche (3 pales)
        ctx.fillStyle = "#555";
        ctx.fillRect(-5, -Math.round(s*0.95), 10, 6);
        ctx.fillRect(-5, -Math.round(s*0.95) - 4, 10, 3);
        ctx.restore();

        // Stabilisateurs arrière déployés
        ctx.fillStyle = "#333";
        ctx.fillRect(hx - 7, hy + Math.round(s*0.80), 6, 8);
        ctx.fillRect(hx + s + 1, hy + Math.round(s*0.80), 6, 8);
    },

    /**
     * M270 MLRS — Lance-roquettes multiple
     * Pod de 12 roquettes (2x6), châssis chenillé M993.
     */
    _drawMlrs: function(ctx, m, s, isBlue) {
        var hx = m.x - s/2, hy = m.y - s/2;

        // Chenilles
        ctx.fillStyle = "#0d0d0d";
        ctx.fillRect(hx - 5, hy + Math.round(s*0.30), 5, Math.round(s*0.70));
        ctx.fillRect(hx + s, hy + Math.round(s*0.30), 5, Math.round(s*0.70));

        // Châssis
        ctx.fillStyle   = isBlue ? "#22180a" : "#220a0a";
        ctx.strokeStyle = isBlue ? "#d35400" : "#c0392b";
        ctx.lineWidth   = 1.5;
        ctx.fillRect(hx, hy + Math.round(s*0.38), s, Math.round(s*0.62));
        ctx.strokeRect(hx, hy + Math.round(s*0.38), s, Math.round(s*0.62));

        // Cabine avant
        ctx.fillStyle = isBlue ? "#1a1006" : "#1a0606";
        ctx.fillRect(hx, hy + Math.round(s*0.25), Math.round(s*0.38), Math.round(s*0.18));

        // Pod de lancement (grande boîte sur la gauche)
        var podW = Math.round(s*0.58);
        var podH = Math.round(s*0.40);
        var podX = hx + Math.round(s*0.38);
        var podY = hy + Math.round(s*0.02);
        ctx.fillStyle   = isBlue ? "#2a1e0a" : "#2a0a0a";
        ctx.strokeStyle = isBlue ? "#d35400" : "#c0392b";
        ctx.lineWidth   = 1.5;
        ctx.fillRect(podX, podY, podW, podH);
        ctx.strokeRect(podX, podY, podW, podH);

        // Tubes roquettes M26 (grille 2x6 simplifiée en 2x3)
        ctx.fillStyle = "#111";
        var cols = 3, rows = 2;
        var tw2  = Math.round(podW / cols);
        var th   = Math.round(podH / rows);
        for (var r = 0; r < rows; r++) {
            for (var c = 0; c < cols; c++) {
                ctx.fillRect(podX + c*tw2 + 2, podY + r*th + 2, tw2 - 4, th - 4);
                ctx.strokeStyle = "rgba(180,100,30,0.4)";
                ctx.lineWidth   = 0.5;
                ctx.strokeRect(podX + c*tw2 + 2, podY + r*th + 2, tw2 - 4, th - 4);
            }
        }

        // Stabilisateurs
        ctx.fillStyle = "#2a2a2a";
        ctx.fillRect(hx - 7, hy + Math.round(s*0.80), 6, 10);
        ctx.fillRect(hx + s + 1, hy + Math.round(s*0.80), 6, 10);
    },

    // ═══════════════════════════════════════════════════════════════════════════
    //  AVIATION
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * AH-64D Apache — Hélicoptère d'attaque
     * Fuselage tandem, rotors, Hellfire x4, canon M230 30mm.
     */
    _drawApache: function(ctx, m, s, isBlue) {
        // Ombre au sol
        ctx.beginPath();
        ctx.ellipse(m.x, m.y + s * 0.85, s * 0.65, s * 0.18, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,0,0,0.22)";
        ctx.fill();

        var hx = m.x - s/2, hy = m.y - s/2;

        // Fuselage principal (forme aérodynamique allongée)
        ctx.fillStyle   = isBlue ? "#1a1414" : "#141a14";
        ctx.strokeStyle = isBlue ? "#e74c3c" : "#2ecc71";
        ctx.lineWidth   = 1.5;
        ctx.beginPath();
        ctx.ellipse(m.x, m.y, s * 0.44, s * 0.26, 0, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();

        // Cockpit tandem (2 bulles : pilote + copilote/artilleur)
        ctx.fillStyle = "rgba(100,180,220,0.45)";
        // Bulle avant (artilleur)
        ctx.beginPath(); ctx.ellipse(m.x + Math.round(s*0.22), m.y - 2, Math.round(s*0.12), Math.round(s*0.15), -0.2, 0, Math.PI*2); ctx.fill();
        // Bulle arrière (pilote, plus haute)
        ctx.beginPath(); ctx.ellipse(m.x - Math.round(s*0.06), m.y - 4, Math.round(s*0.14), Math.round(s*0.17), 0.1, 0, Math.PI*2); ctx.fill();

        // Rotor principal
        ctx.strokeStyle = isBlue ? "#c0392b" : "#27ae60";
        ctx.lineWidth   = 2.5;
        ctx.beginPath();
        ctx.moveTo(m.x - s, m.y - s*0.28); ctx.lineTo(m.x + s, m.y - s*0.28); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(m.x - s*0.5, m.y - s*0.28 - s*0.5); ctx.lineTo(m.x + s*0.5, m.y - s*0.28 + s*0.5); ctx.stroke();

        // Poutre de queue
        ctx.strokeStyle = isBlue ? "#1a1414" : "#141a14";
        ctx.fillStyle   = isBlue ? "#1a1414" : "#141a14";
        ctx.lineWidth   = 3;
        ctx.beginPath();
        ctx.moveTo(m.x - s*0.40, m.y); ctx.lineTo(m.x - s, m.y + 4); ctx.stroke();
        // Rotor de queue
        ctx.strokeStyle = isBlue ? "#c0392b" : "#27ae60";
        ctx.lineWidth   = 1.5;
        ctx.beginPath();
        ctx.moveTo(m.x - s, m.y); ctx.lineTo(m.x - s, m.y + 10); ctx.stroke();

        // Pylônes armements (4 Hellfire + pod Hydra)
        ctx.fillStyle = "#333";
        // Gauche
        ctx.fillRect(hx + 2, m.y + 2, Math.round(s*0.22), 3);
        // Droite
        ctx.fillRect(hx + s - Math.round(s*0.22) - 2, m.y + 2, Math.round(s*0.22), 3);

        // Missiles Hellfire (2 par côté)
        ctx.fillStyle = "#4a6655";
        [-8, -3].forEach(function(dy) {
            ctx.fillRect(hx, m.y + 2 + dy, Math.round(s*0.18), 2);
            ctx.fillRect(hx + s - Math.round(s*0.18), m.y + 2 + dy, Math.round(s*0.18), 2);
        });

        // Canon M230 30mm (sous le nez, à droite)
        ctx.fillStyle = "#222";
        ctx.fillRect(m.x + Math.round(s*0.28), m.y + 2, Math.round(s*0.38), 3);
        ctx.fillRect(m.x + Math.round(s*0.62), m.y + 1, 4, 5);  // dépression canon
    },

    /**
     * UH-60M Black Hawk — Hélicoptère utilitaire armé
     * Fuselage rectangulaire, 2 moteurs visibles, miniguns sur portes.
     */
    _drawBlackhawk: function(ctx, m, s, isBlue) {
        // Ombre
        ctx.beginPath();
        ctx.ellipse(m.x, m.y + s * 0.82, s * 0.72, s * 0.18, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,0,0,0.20)";
        ctx.fill();

        var hx = m.x - s/2, hy = m.y - s/2;

        // Fuselage principal (rectangulaire, trapu)
        ctx.fillStyle   = isBlue ? "#1e1e1e" : "#1a241a";
        ctx.strokeStyle = isBlue ? "#7f8c8d" : "#2ecc71";
        ctx.lineWidth   = 1.5;
        ctx.fillRect(hx, hy + Math.round(s*0.10), s, Math.round(s*0.58));
        ctx.strokeRect(hx, hy + Math.round(s*0.10), s, Math.round(s*0.58));

        // Nez arrondi
        ctx.beginPath();
        ctx.ellipse(hx + s * 0.5, hy + Math.round(s*0.38), s*0.5, Math.round(s*0.28), 0, 0, Math.PI*2);
        ctx.fillStyle = isBlue ? "#1e1e1e" : "#1a241a";
        ctx.fill();

        // 2 moteurs GE T700 (visibles sur le dessus)
        ctx.fillStyle = "#2a2a2a";
        ctx.fillRect(hx + 4, hy + Math.round(s*0.06), Math.round(s*0.38), Math.round(s*0.08));
        ctx.fillRect(hx + s - Math.round(s*0.38) - 4, hy + Math.round(s*0.06), Math.round(s*0.38), Math.round(s*0.08));
        // Entrées d'air moteurs
        ctx.fillStyle = "#1a1a1a";
        ctx.fillRect(hx + 4, hy + Math.round(s*0.04), 6, Math.round(s*0.06));
        ctx.fillRect(hx + s - 10, hy + Math.round(s*0.04), 6, Math.round(s*0.06));

        // Cockpit vitré
        ctx.fillStyle = "rgba(100,160,200,0.40)";
        ctx.fillRect(hx + s - Math.round(s*0.40), hy + Math.round(s*0.14), Math.round(s*0.38), Math.round(s*0.22));

        // Portes passagers (lignes)
        ctx.strokeStyle = "rgba(150,150,150,0.30)";
        ctx.lineWidth   = 0.75;
        ctx.strokeRect(hx + 4, hy + Math.round(s*0.22), Math.round(s*0.30), Math.round(s*0.28));

        // Miniguns M134 sur les portes
        ctx.fillStyle = "#3a3a3a";
        ctx.fillRect(hx - 3, m.y + 4, 5, 3);
        ctx.fillRect(hx + s - 2, m.y + 4, 5, 3);

        // Rotor principal (plus long que l'Apache)
        ctx.strokeStyle = isBlue ? "#666" : "#2ecc71";
        ctx.lineWidth   = 2.5;
        ctx.beginPath();
        ctx.moveTo(m.x - s*1.1, m.y - s*0.30); ctx.lineTo(m.x + s*1.1, m.y - s*0.30);
        ctx.stroke();

        // Poutre de queue
        ctx.fillStyle = isBlue ? "#1e1e1e" : "#1a241a";
        ctx.strokeStyle = isBlue ? "#7f8c8d" : "#2ecc71";
        ctx.lineWidth   = 2;
        ctx.beginPath();
        ctx.moveTo(hx + 4, m.y + Math.round(s*0.08));
        ctx.lineTo(hx - s*0.6, m.y + Math.round(s*0.18));
        ctx.stroke();
        // Rotor de queue + stabilisateur horizontal
        ctx.strokeStyle = "#666";
        ctx.lineWidth   = 1.5;
        ctx.beginPath();
        ctx.moveTo(hx - s*0.6, m.y + Math.round(s*0.10));
        ctx.lineTo(hx - s*0.6, m.y + Math.round(s*0.28));
        ctx.stroke();
        ctx.fillStyle = "#2a2a2a";
        ctx.fillRect(hx - s*0.65, m.y + Math.round(s*0.12), Math.round(s*0.20), 3);

        // Train d'atterrissage (skids)
        ctx.strokeStyle = "#444";
        ctx.lineWidth   = 2;
        ctx.beginPath();
        ctx.moveTo(hx + 4, hy + s - 4);  ctx.lineTo(hx + 4, hy + s + 6);
        ctx.moveTo(hx + s - 4, hy + s - 4); ctx.lineTo(hx + s - 4, hy + s + 6);
        ctx.moveTo(hx, hy + s + 6); ctx.lineTo(hx + s, hy + s + 6);
        ctx.stroke();
    },

    // ═══════════════════════════════════════════════════════════════════════════
    //  SUPPORT
    // ═══════════════════════════════════════════════════════════════════════════

    _drawEngineer: function(ctx, m, s, isBlue) {
        var hx = m.x - s/2, hy = m.y - s/2;
        ctx.fillStyle = isBlue ? "#4a2e00" : "#3a2a00";
        ctx.fillRect(hx, hy, s, s);
        ctx.fillStyle = "#f39c12";
        ctx.fillRect(hx + 2, hy + 3, s - 4, Math.round(s * 0.45));
        ctx.fillStyle = "#f1c40f";
        ctx.fillRect(hx + 2, hy, s - 4, 5);
        ctx.strokeStyle = "#aaa"; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(hx - 3, m.y + 2); ctx.lineTo(hx + 4, m.y - 4); ctx.stroke();
        ctx.beginPath();
        ctx.arc(hx - 3, m.y + 2, 3, 0, Math.PI * 2); ctx.stroke();
    },

    _drawWorker: function(ctx, m, s, isBlue) {
        var hx = m.x - s/2, hy = m.y - s/2;
        ctx.fillStyle = "#4a2e00";
        ctx.fillRect(hx, hy, s, s);
        ctx.fillStyle = "#f5a623";
        ctx.fillRect(hx + 2, hy + 3, s - 4, Math.round(s * 0.45));
        ctx.fillStyle = "#f5a623";
        ctx.fillRect(hx + 2, hy, s - 4, 4);
        ctx.strokeStyle = "#bbb"; ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(hx - 3, hy + s - 3); ctx.lineTo(hx + s + 2, hy + 3); ctx.stroke();
    },

    // ═══════════════════════════════════════════════════════════════════════════
    //  UI — Barres et badges
    // ═══════════════════════════════════════════════════════════════════════════

    _drawSquadHpBar: function(ctx, squad) {
        var alive  = squad.aliveMembers();
        if (alive.length === 0) return;

        var spread = squad.def.formationSpread || 0;
        var cols   = Math.max(1, Math.ceil(Math.sqrt(alive.length)));
        var barW   = Math.max(30, cols * spread + squad.def.memberSize);
        var barX   = squad.x - barW / 2;
        var barY   = squad.y - (cols * spread) / 2 - squad.def.memberSize - 14;

        var total  = squad.getTotalHp();
        var max    = squad.getMaxHp();
        var pct    = total / max;

        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(barX, barY, barW, 4);
        ctx.fillStyle = pct > 0.5 ? "#2ecc71" : pct > 0.25 ? "#f39c12" : "#e74c3c";
        ctx.fillRect(barX, barY, barW * pct, 4);

        if (squad.def.defaultCount > 1) {
            ctx.font      = "bold 9px 'Courier New'";
            ctx.fillStyle = "rgba(255,255,255,0.6)";
            ctx.textAlign = "center";
            ctx.fillText(alive.length + "/" + squad.members.length, squad.x, barY - 2);
            ctx.textAlign = "left";
        }
    },

    // Compact role-specific information card, shown only for selected squads.
    _drawTacticalHud: function(ctx, squad) {
        if (!squad.def || !squad.members || !squad.members.length) return;
        var category = squad.def.category || 'support';
        var count = squad.aliveMembers().length;
        if (!count) return;
        var total = squad.getTotalHp(), max = Math.max(1, squad.getMaxHp());
        var hp = Math.max(0, Math.min(1, total / max));
        var ammo = squad.ammoCapacity > 0 ? 'AMMO ' + Math.ceil(squad.ammo) + '/' + squad.ammoCapacity : 'SUPPORT';
        var status = 'READY';
        if (squad.airMission) status = squad.airMission.mode === 'return' ? 'RTB' : squad.airMission.mode.toUpperCase();
        else if (squad.passengers && squad.passengers.length) status = 'INF ' + squad.passengers.length + '/' + (RTS.TransportSystem ? RTS.TransportSystem.capacity(squad) : 0);
        else if (squad.repairTarget) status = 'REPAIR';
        else if (squad.holdingPosition) status = 'HOLD';
        else if (squad.target) status = squad.attackMove ? 'ATTACK MOVE' : 'MOVING';
        else if (squad.ammoCapacity > 0 && squad.ammo <= 0) status = 'NO AMMO';
        if (category === 'infantry') ammo = 'MEN ' + count + '/' + squad.members.length + (squad.ammoCapacity > 0 ? '  ·  ' + Math.ceil(squad.ammo) + ' RD' : '');
        else if (category === 'air' && squad.airMission) ammo = 'AIR  ·  ' + ammo;
        var name = (squad.label || squad.typeName || 'UNIT').toUpperCase();
        var accent = squad.team === 'red' ? '#e3756e' : squad.team === 'ally' ? '#78dcb2' : '#72b5ef';
        var spread = squad.def.formationSpread || 0;
        var cols = Math.max(1, Math.ceil(Math.sqrt(count)));
        var y = squad.y - Math.max(14, cols * spread / 2 + (squad.def.memberSize || 10)) - 49;
        var x = squad.x - 79;
        ctx.save();
        ctx.fillStyle = 'rgba(11,22,34,0.91)';
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.3;
        ctx.beginPath();ctx.roundRect(x,y,158,38,7);ctx.fill();ctx.stroke();
        ctx.textAlign = 'left';ctx.textBaseline = 'middle';
        ctx.fillStyle = '#e9f1fa';ctx.font = 'bold 10px sans-serif';
        ctx.fillText(name.length > 22 ? name.slice(0,21)+'…' : name,x+8,y+10);
        ctx.fillStyle = '#95acc0';ctx.font = '9px sans-serif';
        ctx.fillText(ammo.length > 27 ? ammo.slice(0,26) : ammo,x+8,y+29);
        ctx.textAlign = 'right';ctx.fillStyle = status === 'NO AMMO' ? '#ffab8f' : '#f2d38f';
        ctx.fillText(status.length > 11 ? status.slice(0,11) : status,x+150,y+29);
        ctx.fillStyle = '#394956';ctx.fillRect(x+8,y+18,142,4);
        ctx.fillStyle = hp > .5 ? '#68c99b' : hp > .25 ? '#f4bd68' : '#f07171';
        ctx.fillRect(x+8,y+18,142*hp,4);
        ctx.restore();
    },

    _drawBadge: function(ctx, squad) {
        var alive  = squad.aliveMembers();
        if (alive.length === 0) return;

        var spread = squad.def.formationSpread || 0;
        var cols   = Math.max(1, Math.ceil(Math.sqrt(alive.length)));
        var radius = Math.max(14, (cols * spread) / 2 + squad.def.memberSize);

        var bx = squad.x + radius;
        var by = squad.y - radius;

        ctx.fillStyle   = "rgba(0,0,0,0.78)";
        ctx.strokeStyle = squad.team === "red" ? "#e74c3c" : squad.team === "ally" ? "#2ecc71" : "#3d8ef5";
        ctx.lineWidth   = 1;
        ctx.beginPath();
        ctx.arc(bx, by, 9, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();

        ctx.font      = "bold 6.5px 'Courier New'";
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.fillText(squad.def.icon || "?", bx, by + 2.5);
        ctx.textAlign = "left";
    }
};