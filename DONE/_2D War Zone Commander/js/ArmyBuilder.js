window.RTS=window.RTS||{};
/* Unit loadouts apply real combat modifiers per squad, never mutate shared SquadDefs. */
RTS.ArmyBuilder={
 doctrines:{
  combined:{label:"Interarmes",types:["riflemen","recon_team","at_team","bradley","m1a2","supply_truck","mobile_aa","paladin","apache"]},
  infantry:{label:"Infanterie",types:["riflemen","recon_team","at_team","combat_medic","manpads","bradley","supply_truck"]},
  armored:{label:"Blindés",types:["riflemen","at_team","bradley","m1a2","mobile_aa","supply_truck","paladin"]},
  airborne:{label:"Aéromobile",types:["riflemen","recon_team","manpads","blackhawk","apache","supply_truck"]}
 },
 equipment:{
  standard:{label:"Standard",extra:0,damage:1,range:1,ammo:1,speed:1},
  precision:{label:"Optiques (+portée)",extra:25,damage:1,range:1.18,ammo:1,speed:1},
  assault:{label:"Assaut (+dégâts)",extra:35,damage:1.18,range:.91,ammo:1,speed:1.04},
  supply:{label:"Munitions supplémentaires",extra:20,damage:1,range:1,ammo:1.55,speed:.96}
 },
 init:function(game){game.army={doctrine:"combined",loadouts:{},slots:8};},
 allowed:function(game,type){
  var a=game.army;if(!a)return true;
  return (this.doctrines[a.doctrine]||this.doctrines.combined).types.indexOf(type)!==-1;
 },
 price:function(game,type){
  var entry=RTS.DeploymentSystem.units.find(function(x){return x[0]===type;});
  if(!entry)return Infinity;
  var gear=this.equipment[(game.army&&game.army.loadouts[type])||"standard"]||this.equipment.standard;
  return entry[1]+gear.extra;
 },
 apply:function(game,s,type){
  var key=(game.army&&game.army.loadouts[type])||"standard";
  var gear=this.equipment[key]||this.equipment.standard;
  s.loadout=key;
  s.def=Object.assign({},s.def);
  s.def.attackDamage=(s.def.attackDamage||0)*gear.damage;
  s.def.attackRange=(s.def.attackRange||0)*gear.range;
  s.attackRange=s.def.attackRange;
  s.speed*=gear.speed;
  s.ammoCapacity=Math.ceil(s.ammoCapacity*gear.ammo);
  s.ammo=s.ammoCapacity;
  s.label=(s.label||type)+" · "+gear.label;
 }
};