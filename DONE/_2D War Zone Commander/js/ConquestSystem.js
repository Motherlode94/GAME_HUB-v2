window.RTS = window.RTS || {};
/* Tactical Conquest v1: three capturable zones, contesting, tickets and enemy objective orders.
 * Survival mode remains fully independent. All coordinates are world-space.
 */
RTS.ConquestSystem = {
    init: function(game) {
        game.conquest = {
            zones: [
                {name:"ALPHA", x:RTS.WORLD_W*.32, y:RTS.WORLD_H*.34, owner:null, progress:0},
                {name:"BRAVO", x:RTS.WORLD_W*.52, y:RTS.WORLD_H*.54, owner:null, progress:0},
                {name:"CHARLIE",x:RTS.WORLD_W*.72, y:RTS.WORLD_H*.72, owner:null, progress:0}
            ],
            tickets: {blue:300,red:300}, elapsed:0, aiClock:0, done:false, strikeTargets:null, strikeDone:false
        };
    },
    update: function(game, dt) {
        var c=game.conquest;
        if (!c || c.done || game.setupPhase || game.gameOver) return;
        c.elapsed+=dt; c.aiClock-=dt;
        // Secondary objective: eliminate the enemy armored command asset.
        // Capture remains the primary victory condition; destroying this asset awards tickets.
        if (!c.strikeTargets) {
            c.strikeTargets=game.squads.filter(function(s){
                return s.team==="red" && /m1a2|heavy_mbt|tank_destroyer/.test(s.typeName);
            }).slice(0,1);
        }
        if (!c.strikeDone && c.strikeTargets.length && c.strikeTargets.every(function(t){
            return t.isDead() || game.squads.indexOf(t)<0;
        })) {
            c.strikeDone=true;
            c.tickets.red=Math.max(0,c.tickets.red-65);
            var notice=document.getElementById("waveNotif");
            if(notice)notice.textContent="OBJECTIF SECONDAIRE : BLINDÉ DE COMMANDEMENT DÉTRUIT — -65 TICKETS";
        }

        c.zones.forEach(function(z) {
            var blue=0, red=0;
            game.squads.forEach(function(s) {
                if (s.isDead() || Math.hypot(s.x-z.x,s.y-z.y)>165) return;
                // Aircraft cannot capture; they can still protect the sector.
                if (s.def && s.def.category==="air") return;
                if (s.team==="red") red++;
                else if (s.team==="blue" || s.team==="ally") blue++;
            });
            if (blue && red) return; // contested: no capture progress
            if (!blue && !red) return;
            var side=blue?"blue":"red", change=Math.min(3,blue||red)*dt*9;
            var target=side==="blue"?100:-100;
            z.progress=Math.max(-100,Math.min(100,z.progress+(target>z.progress?change:-change)));
            z.owner=z.progress>=100?"blue":z.progress<=-100?"red":null;
        });
        var b=c.zones.filter(z=>z.owner==="blue").length;
        var r=c.zones.filter(z=>z.owner==="red").length;
        if (b>r) c.tickets.red=Math.max(0,c.tickets.red-dt*(b-r)*1.5);
        if (r>b) c.tickets.blue=Math.max(0,c.tickets.blue-dt*(r-b)*1.5);
        if (c.tickets.blue<=0 || c.tickets.red<=0) {
            c.done=true;game.gameOver=true;
            var victory=c.tickets.red<=0;
            var title=document.getElementById("bannerTitle");
            var sub=document.getElementById("bannerSub");
            if(title) title.textContent=victory?"VICTOIRE — CONQUÊTE":"DÉFAITE — CONQUÊTE";
            if(sub) sub.textContent=victory?"Les secteurs stratégiques sont sécurisés.":"L'adversaire contrôle le champ de bataille.";
            var banner=document.getElementById("banner");
            if(banner) banner.style.display="flex";
            var next=document.getElementById("nextLevelBtn");
            if(next) next.style.display="none";
        }
        // Enemy squads not currently engaging aim to capture the nearest non-red sector.
        if (c.aiClock<=0) {
            c.aiClock=5;
            game.squads.forEach(function(s) {
                if(s.team!=="red"||s.isDead()||!s.def||s.def.category==="air")return;
                var options=c.zones.filter(z=>z.owner!=="red");
                if(!options.length)return;
                options.sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y));
                var z=options[0];
                if(Math.hypot(z.x-s.x,z.y-s.y)>155) {
                    s.target={x:z.x+(s.id%3-1)*23,y:z.y+(s.id%4-1.5)*23};
                    s._nav=null;
                }
            });
        }
    },
    renderWorld: function(game,ctx) {
        var c=game.conquest;if(!c)return;
        c.zones.forEach(function(z) {
            var color=z.owner==="blue"?"#54b9ed":z.owner==="red"?"#f07572":"#f2cb73";
            ctx.save();ctx.beginPath();ctx.arc(z.x,z.y,165,0,Math.PI*2);
            ctx.fillStyle=z.owner==="blue"?"rgba(55,148,222,.11)":z.owner==="red"?"rgba(215,68,68,.1)":"rgba(245,205,95,.07)";
            ctx.fill();ctx.lineWidth=3;ctx.strokeStyle=color;ctx.setLineDash([14,8]);ctx.stroke();ctx.setLineDash([]);
            ctx.fillStyle="rgba(6,15,25,.85)";ctx.fillRect(z.x-70,z.y-24,140,42);
            ctx.fillStyle=color;ctx.font="bold 15px monospace";ctx.textAlign="center";ctx.fillText(z.name,z.x,z.y-7);
            ctx.fillStyle="#273847";ctx.fillRect(z.x-57,z.y+3,114,6);
            ctx.fillStyle=color;ctx.fillRect(z.x-57,z.y+3,114*Math.abs(z.progress)/100,6);
            ctx.restore();
        });
    },
    renderHUD: function(game) {
        var c=game.conquest;if(!c)return;
        var el=document.getElementById("waveNotif");if(!el)return;
        el.style.opacity="1";
        el.textContent="CONQUÊTE  |  ALLIÉS "+Math.ceil(c.tickets.blue)+"  —  ENNEMIS "+Math.ceil(c.tickets.red)+"  |  SECTEURS "+c.zones.filter(z=>z.owner==="blue").length+"/3" + (c.strikeDone ? "  |  CIBLE DÉTRUITE" : "  |  CIBLE : CHAR ENNEMI");
    }
};
