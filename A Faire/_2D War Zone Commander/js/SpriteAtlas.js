window.RTS=window.RTS||{};
RTS.SpriteAtlas={
  // RTS gameplay types -> available original PNG sprites.
  map:{
    riflemen:"soldat_fusil",assault_team:"soldat_fusil",special_forces:"soldat_fusil",paratroopers:"soldat_fusil",
    at_team:"soldat_fusil",manpads:"soldat_fusil",grenadier_team:"soldat_fusil",
    mortar_team:"soldat_minigun",sniper_team:"soldat_fusil",recon_team:"soldat_radio",
    heavy_mg:"soldat_minigun",engineer:"soldat_ingenieur",worker:"soldat_ingenieur",
    combat_medic:"soldat_medic",combat_engineers:"soldat_ingenieur",
    matv:"buggy_bleu",mechanized_scout:"buggy_bleu",armored_car:"blinde_bleu",
    bradley:"blinde_bleu",wheeled_ifv:"blinde_bleu",apc:"blinde_bleu",
    m1a2:"char_lourd_vert",heavy_mbt:"char_lourd_vert",tank_destroyer:"char_lourd_vert",
    paladin:"artillerie_bleue",mlrs:"artillerie_bleue",rocket_artillery:"artillerie_bleue",
    selfpropelled_mortar:"artillerie_bleue",mobile_aa:"antiaerien_vert",heavy_aa:"antiaerien_vert",
    long_range_aa:"antiaerien_vert",air_defense_radar:"vehicule_radar_bleu",
    supply_truck:"camion_bleu",ammo_carrier:"camion_bleu",armored_engineer:"blinde_bleu",
    apache:"helico_bleu",light_attack_heli:"helico_bleu",gunship:"helico_bleu",
    blackhawk:"helico_bleu",heavy_transport_heli:"helico_bleu",
    recon_drone:"drone_bleu",attack_drone:"drone_bleu",interceptor_drone:"drone_bleu",
    ew_drone:"drone_bleu",loitering_drone:"drone_bleu",
    fighter_aircraft:"chasseur_bleu",strike_aircraft:"avion_bleu",
    rifleman:"soldat_fusil",scout:"soldat_radio",machinegunner:"soldat_minigun",
    antiarmor:"soldat_fusil",medic:"soldat_medic",buggy:"buggy_bleu",
    ifv:"blinde_bleu",tank:"char_lourd_vert",artillery:"artillerie_bleue",
    anti_air:"antiaerien_vert",radar:"vehicule_radar_bleu",apc_sprite:"blinde_bleu",
    supply_truck_sprite:"camion_bleu",helicopter:"helico_bleu",
    transport_helicopter:"helico_bleu",drone:"drone_bleu",fighter:"chasseur_bleu",
    carrier:"blinde_bleu",support:"soldat_minigun",rifle:"soldat_fusil"
  },
  red:{
    soldat_fusil:"soldat_fusil_rouge",soldat_ingenieur:"soldat_ingenieur_rouge",
    soldat_medic:"soldat_medic_rouge",soldat_minigun:"soldat_minigun_rouge",
    soldat_radio:"soldat_radio_rouge",buggy_bleu:"buggy_rouge",blinde_bleu:"blinde_rouge",
    char_lourd_vert:"char_lourd_rouge",artillerie_bleue:"artillerie_rouge",
    antiaerien_vert:"antiaerien_rouge",vehicule_radar_bleu:"vehicule_radar_rouge",
    camion_bleu:"camion_rouge",helico_bleu:"helico_rouge",
    drone_bleu:"drone_rouge",chasseur_bleu:"chasseur_rouge",avion_bleu:"avion_rouge"
  },
  resolve:function(type,team){
    var id=this.map[type]||type;
    if(team==="red"||team==="rouge"||team==="enemy") id=this.red[id]||id;
    return id;
  },
  pngNames:["soldat_fusil","soldat_ingenieur","soldat_medic","soldat_minigun","soldat_radio","buggy_bleu","blinde_bleu","char_lourd_vert","artillerie_bleue","antiaerien_vert","vehicule_radar_bleu","camion_bleu","helico_bleu","drone_bleu","chasseur_bleu","avion_bleu","arme_fusil","arme_mitrailleuse","arme_lance_roquette","arme_pistolet"],
  pngImage:(function(){var im=new Image();im.src="assets/units/war-like-units-atlas.png";return im;})(),
  drawPNG:function(ctx,id,x,y,width,height,angle,team){
    var im=this.pngImage;if(!im||!im.complete||!im.naturalWidth)return false;
    var base=id,reverse=this.red;
    Object.keys(reverse).forEach(function(k){if(reverse[k]===id)base=k;});
    var index=this.pngNames.indexOf(base);
    if(index<0)return false;
    var sx=(index%5)*64,sy=Math.floor(index/5)*64;
    ctx.save();ctx.translate(x,y);ctx.rotate(angle||0);
    ctx.drawImage(im,sx,sy,64,64,-width/2,-height/2,width,height);
    if(team==="red"||team==="rouge"||team==="enemy"){
      ctx.globalCompositeOperation="source-atop";
      ctx.globalAlpha=.30;ctx.fillStyle="#d54b48";
      ctx.fillRect(-width/2,-height/2,width,height);
    }
    ctx.restore();return true;
  },
  draw:function(ctx,type,x,y,width,height,angle,team){
    var assets=window.WarLikeRTSAssets;

    var id=this.resolve(type,team);
    if(this.drawPNG(ctx,id,x,y,width,height,angle,team))return true;
    if(!assets||!assets.get(id))return false;
    return assets.draw(ctx,id,x,y,width,height,angle||0);
  }
};