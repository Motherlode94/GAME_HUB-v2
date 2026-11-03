const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const base='A Faire/';
function load(path,context){vm.runInNewContext(fs.readFileSync(base+path,'utf8'),context,{filename:path});}
const art={getEnemyFaction:()=> 'axis'};
const hero={window:{WarLikeArt:art},RTS:{Game:{}}};load('_2D Hero Forces/js/Squad.js',hero);
const heroEnemy=new hero.RTS.Game.Squad(0,0,'axis','rifle');
const heroAlly=new hero.RTS.Game.Squad(0,0,'allied','rifle');
assert.ok(heroEnemy.soldiers[0].maxHP>heroAlly.soldiers[0].maxHP,'Hero Forces enemy HP bonus');
const war={window:{WarLikeArt:art},RTS:{SquadDefs:{rifle:{label:'rifle',defaultCount:1,memberHp:100,speed:3}}}};load('_2D War Zone Commander/js/Squad.js',war);
const warEnemy=new war.RTS.Squad(0,0,'red','rifle');
const warAlly=new war.RTS.Squad(0,0,'blue','rifle');
assert.equal(warEnemy.members[0].maxHp,230);
assert.equal(warAlly.members[0].maxHp,100);
const iron=fs.readFileSync(base+'_2D Iron Meridian/index.html','utf8');
assert.match(iron,/team==='red'&&window\.WarLikeArt/);
assert.match(iron,/Math\.round\(d\.hp\*multiplier\)/);
console.log('PASS: three RTS enemy durability multiplier wiring');
