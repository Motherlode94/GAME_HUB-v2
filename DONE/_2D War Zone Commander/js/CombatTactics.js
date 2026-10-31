window.RTS=window.RTS||{};
RTS.CombatTactics={
 update:function(game,dt){
  if(game.setupPhase||game.gameOver)return;
  game.smokeClouds=(game.smokeClouds||[]).filter(c=>(c.life-=dt)>0);
  game.squads.forEach(s=>{s.suppression=Math.max(0,(s.suppression||0)-dt*7);s.smokeCooldown=Math.max(0,(s.smokeCooldown||0)-dt);});
 },
 smoke:function(game,s){
  if(!s||s.isDead()||s.smokeCooldown>0||s.def.category==="air")return false;
  game.smokeClouds=game.smokeClouds||[];
  game.smokeClouds.push({x:s.x,y:s.y,radius:110,life:13});
  s.smokeCooldown=45;return true;
 },
 obscured:function(game,x,y,tx,ty){
  return (game.smokeClouds||[]).some(c=>{
   var dx=tx-x,dy=ty-y,l=dx*dx+dy*dy;
   var t=l?Math.max(0,Math.min(1,((c.x-x)*dx+(c.y-y)*dy)/l)):0;
   return Math.hypot(x+t*dx-c.x,y+t*dy-c.y)<c.radius;
  });
 },
 impact:function(game,p,target){
  if(!target||target.isDead())return 0;
  var suppress=p.type==="artillery"?30:p.type==="rocket"?23:p.type==="shell"?20:6;
  target.suppression=Math.min(100,(target.suppression||0)+suppress);
  if(target.def.category==="vehicle"&&(p.type==="shell"||p.type==="rocket")&&Math.random()<.12){
   target.engineDamage=Math.min(1,(target.engineDamage||0)+.24);
  }
  var range=p.totalDist||0;
  var suppressionPenalty=((p.shooterSuppression||0)/100)*.48;
  var rangePenalty=Math.max(0,(range-160)/800)*.25;
  var smokePenalty=this.obscured(game,p.originX,p.originY,p.tx,p.ty)?.42:0;
  var accuracy=Math.max(.16,Math.min(.96,.92-suppressionPenalty-rangePenalty-smokePenalty));
  return Math.random()<accuracy?1:0;
 },
 render:function(game,ctx){
  (game.smokeClouds||[]).forEach(c=>{
   ctx.save();ctx.globalAlpha=Math.min(.65,c.life/3*.4);
   ctx.fillStyle="#bfc8c0";
   for(var i=0;i<6;i++){var a=i*Math.PI/3;ctx.beginPath();ctx.arc(c.x+Math.cos(a)*c.radius*.4,c.y+Math.sin(a)*c.radius*.4,c.radius*.5,0,Math.PI*2);ctx.fill();}
   ctx.restore();
  });
 }
};