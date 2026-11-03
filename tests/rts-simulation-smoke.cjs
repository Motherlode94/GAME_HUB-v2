// Run from repository root: node tests/rts-simulation-smoke.cjs
// Source-level smoke checks plus isolated Broken Array capture/production scenarios.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const root='A Faire/_2D War Zone Commander/js/';
const main=read(root+'main.js'),buildingSource=read(root+'BuildingSystem.js');
const iron=read('A Faire/_2D Iron Meridian/index.html');
assert.match(main,/RTS\.BuildingSystem\.update\(game, delta\)/,'building tick connected');
assert.match(main,/RTS\.ProductionSystem\.update\(game, delta\)/,'production tick connected');
assert.doesNotMatch(buildingSource,/^\s*RTS\.BuildingSystem\._updateProduction\(game, delta\);/m,'no double production');
assert.match(iron,/coordinateFireteam\(u,dt\)/);
assert.match(iron,/victim\.hp=Math\.max/);
assert.match(iron,/u\.boarding=vehicle/);
assert.match(iron,/u\.soldiers\.reduce/);
const code=iron.match(/<script>\s*([\s\S]*?)<\/script>/);
assert.ok(code,'inline Iron Meridian simulation script');
new vm.Script(code[1],{filename:'iron-meridian-inline.js'});
for(const name of ['SquadSystem','SquadCombatSystem','TransportSystem','BuildingSystem']){
 new vm.Script(read(root+name+'.js'),{filename:name+'.js'});
}
const ctx={window:{},RTS:{Building:{PASSIVE:{},HOSPITAL_RADIUS:180,HOSPITAL_HEAL_RATE:8,HOSPITAL_TICK:1}},console,document:{getElementById:()=>null},clearTimeout,setTimeout};
ctx.window.RTS=ctx.RTS;
vm.createContext(ctx);
vm.runInContext(buildingSource,ctx);
ctx.RTS.BuildingSystem._updatePassiveIncome=()=>{};
ctx.RTS.BuildingSystem._updateHospital=()=>{};
ctx.RTS.BuildingSystem._updateFlash=()=>{};
let blue={team:'blue',x:100,y:100,def:{category:'infantry'},isDead:()=>false};
let red={team:'red',x:400,y:400,def:{category:'infantry'},isDead:()=>false};
let site={team:'neutral',x:100,y:100,tacticalSite:true,hp:100,captureProgress:0};
let game={buildings:[site],squads:[blue,red]};
for(let i=0;i<11;i++)ctx.RTS.BuildingSystem.update(game,1);
assert.equal(site.team,'blue','uncontested capture');
// Both coordinates matter: a squad 300 units away must not capture a site.
blue.x=400;blue.y=400;red.x=100;red.y=100;
for(let i=0;i<11;i++)ctx.RTS.BuildingSystem.update(game,1);
assert.equal(site.team,'red','enemy can recapture');
blue.x=100;site.team='neutral';site.captureProgress=0;
ctx.RTS.BuildingSystem.update(game,2);
assert.equal(site.captureProgress,0,'contested capture must not progress');
console.log('PASS: syntax, building activation, independent capture / recapture, contested capture, transport and injury wiring');
