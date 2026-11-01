/* GodSworm — supplied building sprite sheets, preserving gameplay. */
(()=>{'use strict';
if(typeof Building==='undefined')return;
const names=['crusader','northmen','pagan','nomad','neutral'];
const atlas=new Image();atlas.src='assets/buildings/houses-atlas.png';
const prior=Building.prototype.draw;
Building.prototype.draw=function(ctx){
 if(this.state==='destroyed'||this.constructionProgress<1)return prior.call(this,ctx);
 const im=atlas;
 if(!im.complete||!im.naturalWidth)return prior.call(this,ctx);
 let idx=0;
 if(typeof BUILDING_TYPES!=='undefined'){
  if(this.type===BUILDING_TYPES.TOWN_HALL)idx=2;
  else if(this.type===BUILDING_TYPES.BARRACKS)idx=1;
 }
 const size=Math.max(56,this.size*1.10),tile=im.naturalWidth/3;
 ctx.save();ctx.drawImage(im,idx*tile,Math.max(0,names.indexOf(this.faction))*32,tile,32,this.x+(this.size-size)/2,this.y+(this.size-size)/2,size,size);ctx.restore();
 if(this.selected){ctx.save();ctx.strokeStyle='#ffdf77';ctx.lineWidth=3;ctx.strokeRect(this.x-2,this.y-2,this.size+4,this.size+4);ctx.restore()}
 if(this.health<this.maxHealth){ctx.fillStyle='#141920';ctx.fillRect(this.x,this.y-9,this.size,5);ctx.fillStyle='#81cc77';ctx.fillRect(this.x,this.y-9,this.size*Math.max(0,this.health/this.maxHealth),5)}
};
})();