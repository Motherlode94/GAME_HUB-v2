window.RTS=window.RTS||{};
RTS.DeploymentSystem={
 units:[["riflemen",90],["recon_team",85],["at_team",130],["bradley",220],["m1a2",370],["supply_truck",115],["mobile_aa",255],["paladin",300],["apache",350]],
 init:function(game){game.requisition={points:900,income:240,queue:[],timer:0};},
 call:function(game,type){
  var u=this.units.find(function(x){return x[0]===type;});
  if(!u||!game.requisition||game.requisition.points<u[1])return false;
  game.requisition.points-=u[1];game.requisition.queue.push(type);return true;
 },
 update:function(game,dt){
  var d=game.requisition;if(!d||game.setupPhase||game.gameOver)return;
  d.points=Math.min(1500,d.points+d.income*dt/60);d.timer+=dt;
  if(d.timer>=2.3&&d.queue.length){
   d.timer=0;var type=d.queue.shift();var i=game.squads.length;
   var s=new RTS.Squad(130+(i%4)*40,RTS.WORLD_H/2+(i%7-3)*36,"blue",type);
   if(s.members.length)game.squads.push(s);
  }
 }
};