window.RTS=window.RTS||{};
/* Mobile logistics: supply inventory, ammunition refills, field repairs and squad recovery. */
RTS.LogisticsSystem={
  isSupply:function(s){return /supply_truck|ammo_carrier|blackhawk|heavy_transport_heli/.test(s.typeName||"");},
  update:function(game,dt){
    if(game.setupPhase||game.gameOver)return;
    var allies=game.squads.filter(s=>!s.isDead());
    allies.forEach(function(truck){
      if(!RTS.LogisticsSystem.isSupply(truck))return;
      if(truck.supplyStock==null)truck.supplyStock=900;
      truck.supplyStock=Math.min(900,truck.supplyStock+dt*.65);
      allies.forEach(function(s){
        if(s===truck||s.team!==truck.team||s.isDead()||Math.hypot(s.x-truck.x,s.y-truck.y)>125)return;
        if(truck.supplyStock<1)return;
        var ammoNeed=Math.max(0,(s.ammoCapacity||0)-(s.ammo||0));
        if(ammoNeed>0){
          var supplied=Math.min(ammoNeed,truck.supplyStock,dt*9);
          s.ammo+=supplied;truck.supplyStock-=supplied;
        }
        if(truck.supplyStock<1||s.def.category==="air")return;
        var living=s.aliveMembers();
        living.forEach(function(m){
          var need=Math.max(0,m.maxHp-m.hp);
          if(need>0&&truck.supplyStock>0){
            var repaired=Math.min(need,truck.supplyStock*.4,dt*3);
            m.hp+=repaired;truck.supplyStock-=repaired*2.5;
          }
        });
        // Recover a lost infantryman only with sufficient supplies and nearby transport.
        if(s.def.category==="infantry"&&truck.supplyStock>=120){
          s._recoveryClock=(s._recoveryClock||0)+dt;
          if(s._recoveryClock>=24){
            var fallen=s.members.find(m=>m.dead);
            if(fallen){fallen.dead=false;fallen.hp=Math.max(1,fallen.maxHp*.5);fallen.x=s.x;fallen.y=s.y;truck.supplyStock-=120;}
            s._recoveryClock=0;
          }
        }
      });
    });
  }
};