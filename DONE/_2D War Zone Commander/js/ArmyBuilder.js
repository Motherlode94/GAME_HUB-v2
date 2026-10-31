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
 vehicleEquipment:{
  bradley:{standard:{label:"M242 standard",extra:0,damage:1,range:1,ammo:1,speed:1},tow:{label:"TOW antichar",extra:60,damage:1.35,range:1.20,ammo:.70,speed:.95},recon:{label:"Capteurs avancés",extra:45,damage:.9,range:1.25,ammo:1,speed:1.05}},
  m1a2:{standard:{label:"M256 standard",extra:0,damage:1,range:1,ammo:1,speed:1},sabot:{label:"Obus APFSDS",extra:75,damage:1.45,range:1.04,ammo:.72,speed:1},urban:{label:"Kit blindage urbain",extra:65,damage:1,range:.95,ammo:1,speed:.86,armor:1.18}},
  paladin:{standard:{label:"Obus HE",extra:0,damage:1,range:1,ammo:1,speed:1},longrange:{label:"Munition guidée",extra:85,damage:1.20,range:1.33,ammo:.60,speed:.94},saturation:{label:"Salves renforcées",extra:55,damage:1.15,range:.94,ammo:1.25,speed:.92}},
  mobile_aa:{standard:{label:"Radar standard",extra:0,damage:1,range:1,ammo:1,speed:1},extended:{label:"Missiles longue portée",extra:75,damage:1.12,range:1.30,ammo:.74,speed:.93},rapid:{label:"Interception rapide",extra:50,damage:.90,range:.92,ammo:1.40,speed:1.05}},
  apache:{standard:{label:"Roquettes standard",extra:0,damage:1,range:1,ammo:1,speed:1},hellfire:{label:"Missiles Hellfire",extra:90,damage:1.4,range:1.17,ammo:.65,speed:.94},escort:{label:"Configuration escorte",extra:45,damage:.92,range:1.09,ammo:1.30,speed:1.08}}
 },
 storageKey:"warlike.armybuilder.v2",
 libraryKey:"warlike.armybuilder.decks.v1",
 listDecks:function(){
  try{var decks=JSON.parse(localStorage.getItem(this.libraryKey)||"{}");return decks&&typeof decks==="object"&&!Array.isArray(decks)?Object.keys(decks):[];}catch(e){return [];}
 },
 saveNamed:function(game,name){
  name=String(name||game.army.name||"Groupe Alpha").trim().slice(0,40);
  if(!name||!game.army.deck.length)return false;
  try{
   var all=JSON.parse(localStorage.getItem(this.libraryKey)||"{}");
   if(!all||typeof all!=="object"||Array.isArray(all))all={};
   game.army.name=name;
   all[name]={version:2,name:name,doctrine:game.army.doctrine,deck:game.army.deck.slice(),loadouts:Object.assign({},game.army.loadouts)};
   localStorage.setItem(this.libraryKey,JSON.stringify(all));this.save(game);return true;
  }catch(e){return false;}
 },
 loadNamed:function(game,name){
  if(!game.setupPhase)return false;
  try{
   var all=JSON.parse(localStorage.getItem(this.libraryKey)||"{}");
   return this.load(game,all[name])&&this.save(game);
  }catch(e){return false;}
 },
 init:function(game){
  var saved=null;
  try{saved=JSON.parse(localStorage.getItem(this.storageKey)||"null");}catch(e){}
  game.army={doctrine:"combined",loadouts:{},slots:8,deck:[],name:"Groupe Alpha"};
  if(saved&&saved.version===2)this.load(game,saved);
  if(!game.army.deck.length)game.army.deck=this.doctrines[game.army.doctrine].types.slice(0,game.army.slots);
 },
 options:function(type){return this.vehicleEquipment[type]||this.equipment;},
 save:function(game){
  if(!game.army)return false;
  try{localStorage.setItem(this.storageKey,JSON.stringify({version:2,name:game.army.name,doctrine:game.army.doctrine,deck:game.army.deck.slice(),loadouts:game.army.loadouts}));return true;}catch(e){return false;}
 },
 load:function(game,data){
  if(!data||!this.doctrines[data.doctrine])return false;
  var army=game.army;army.doctrine=data.doctrine;army.name=String(data.name||"Groupe Alpha").slice(0,40);
  var available=this.doctrines[army.doctrine].types;
  army.deck=Array.isArray(data.deck)?[...new Set(data.deck)].filter(t=>available.includes(t)&&this.options(t)).slice(0,army.slots):[];
  army.loadouts={};
  if(data.loadouts&&typeof data.loadouts==="object")Object.keys(data.loadouts).forEach(t=>{
   if(this.options(t)[data.loadouts[t]])army.loadouts[t]=data.loadouts[t];
  });
  return true;
 },
 setDoctrine:function(game,key){
  if(!this.doctrines[key]||!game.setupPhase)return false;
  game.army.doctrine=key;game.army.deck=game.army.deck.filter(t=>this.doctrines[key].types.includes(t));
  return true;
 },
 toggle:function(game,type){
  if(!game.setupPhase||!this.doctrines[game.army.doctrine].types.includes(type))return false;
  var a=game.army,i=a.deck.indexOf(type);
  if(i>=0){a.deck.splice(i,1);return true;}
  if(a.deck.length>=a.slots)return false;
  a.deck.push(type);return true;
 },
 allowed:function(game,type){
  var a=game.army;if(!a)return true;
  return a.deck.indexOf(type)!==-1;
 },
 price:function(game,type){
  var entry=RTS.DeploymentSystem.units.find(function(x){return x[0]===type;});
  if(!entry)return Infinity;
  var gear=this.options(type)[(game.army&&game.army.loadouts[type])||"standard"]||this.options(type).standard;
  return entry[1]+gear.extra;
 },
 apply:function(game,s,type){
  var key=(game.army&&game.army.loadouts[type])||"standard";
  var gear=this.options(type)[key]||this.options(type).standard;
  s.loadout=key;
  s.def=Object.assign({},s.def);
  s.def.attackDamage=(s.def.attackDamage||0)*gear.damage;
  s.def.attackRange=(s.def.attackRange||0)*gear.range;
  s.attackRange=s.def.attackRange;
  s.speed*=gear.speed;
  if(gear.armor)s.armorModifier=gear.armor;
  s.ammoCapacity=Math.ceil(s.ammoCapacity*gear.ammo);
  s.ammo=s.ammoCapacity;
  s.label=(s.label||type)+" · "+gear.label;
 }
};