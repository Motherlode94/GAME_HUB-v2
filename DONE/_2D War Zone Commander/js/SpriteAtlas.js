window.RTS=window.RTS||{};
RTS.SpriteAtlas={
  cache:{},
  map:{
    riflemen:"rifleman",assault_team:"rifleman",special_forces:"scout",paratroopers:"rifleman",
    at_team:"antiarmor",manpads:"antiarmor",grenadier_team:"antiarmor",mortar_team:"machinegunner",
    sniper_team:"scout",recon_team:"scout",heavy_mg:"machinegunner",engineer:"engineer",worker:"engineer",combat_medic:"medic",combat_engineers:"engineer",
    matv:"buggy",mechanized_scout:"buggy",armored_car:"buggy",bradley:"ifv",wheeled_ifv:"ifv",
    apc:"apc",m1a2:"tank",heavy_mbt:"tank",tank_destroyer:"tank",paladin:"artillery",
    mlrs:"artillery",rocket_artillery:"artillery",selfpropelled_mortar:"artillery",
    mobile_aa:"anti_air",heavy_aa:"anti_air",long_range_aa:"anti_air",air_defense_radar:"radar",
    supply_truck:"supply_truck",ammo_carrier:"supply_truck",armored_engineer:"command_truck",
    apache:"helicopter",light_attack_heli:"helicopter",gunship:"helicopter",blackhawk:"transport_helicopter",heavy_transport_heli:"transport_helicopter",
    recon_drone:"drone",attack_drone:"drone",interceptor_drone:"drone",ew_drone:"drone",loitering_drone:"drone",
    fighter_aircraft:"fighter",strike_aircraft:"fighter"
  },
  draw:function(ctx,type,x,y,width,height,angle){
    var key=this.map[type]||type, image=this.cache[key];
    if(image===null)return false;
    if(!image){
      image=new Image();
      this.cache[key]=image;
      image.onload=function(){};
      image.onerror=()=>{this.cache[key]=null;};
      image.src="assets/rts/"+key+".png";
      return false;
    }
    if(!image.complete||!image.naturalWidth)return false;
    ctx.save();ctx.translate(x,y);ctx.rotate(angle||0);
    ctx.drawImage(image,-width/2,-height/2,width,height);
    ctx.restore();return true;
  }
};