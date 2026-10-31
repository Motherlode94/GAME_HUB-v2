window.RTS=window.RTS||{};
RTS.TacticalRules={
 sight:function(s){var t=s.typeName||"";return /recon_drone|ew_drone/.test(t)?680:/recon|sniper|scout/.test(t)?430:s.def&&s.def.category==="air"?450:290;},
 concealed:function(s){return /recon|sniper|special_forces/.test(s.typeName||"")?0.6:1;},
 blocked:function(game,x,y,tx,ty){
  var dx=tx-x,dy=ty-y,len=dx*dx+dy*dy;if(len<1)return false;
  return game.buildings.some(function(b){
   if(b.hp<=0||b.type==="wall"&&b.hp<=0)return false;
   var t=((b.x-x)*dx+(b.y-y)*dy)/len;
   if(t<=.08||t>=.92)return false;
   var px=x+t*dx,py=y+t*dy,rad=(b.size||50)*.48;
   return Math.abs(px-b.x)<rad&&Math.abs(py-b.y)<rad;
  });
 },
 detects:function(game,observer,target){
  if(observer.isDead()||target.isDead())return false;
  var dist=Math.hypot(observer.x-target.x,observer.y-target.y);
  if(dist>this.sight(observer)*this.concealed(target))return false;
  if(RTS.CombatTactics.obscured(game,observer.x,observer.y,target.x,target.y))return false;
  if(observer.def.category==="air"&&target.def.category==="air")return true;
  return !this.blocked(game,observer.x,observer.y,target.x,target.y);
 },
 spotted:function(game,target,team){
  return game.squads.some(function(s){return(s.team===team||(team==="blue"&&s.team==="ally"))&&RTS.TacticalRules.detects(game,s,target);});
 },
 damage:function(projectile,target){
  if(!target.def||target.def.category!=="vehicle")return projectile.damage;
  var armor=/heavy_mbt|m1a2/.test(target.typeName)?[160,105,65]:/bradley|wheeled_ifv|tank_destroyer/.test(target.typeName)?[90,65,40]:[48,35,22];
  var pen=projectile.type==="shell"?175:projectile.type==="rocket"?125:projectile.type==="artillery"?90:projectile.type==="sniper"?25:12;
  var vx=projectile.originX-target.x,vy=projectile.originY-target.y;
  var facing=Number.isFinite(target.heading)?target.heading:0;
  var dot=(vx*Math.cos(facing)+vy*Math.sin(facing))/(Math.hypot(vx,vy)||1);
  var zone=dot>.45?0:dot<-.45?2:1;
  var ratio=pen/(armor[zone]*(target.armorModifier||1));
  return projectile.damage*(ratio>=1?1:Math.max(.08,ratio*ratio*.65));
 }
};