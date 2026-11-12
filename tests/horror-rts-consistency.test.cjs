const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('Chambre 07 interaction uses visible objects in front, and Lia requires the memories',()=>{
 const source=read('A Faire/_3D Chambre 07/index.html'),code=source.match(/<script>([\s\S]*?)<\/script>/)[1];new vm.Script(code);
 const functions=['isWall','clearSight','interactionTarget','speak'].map(name=>{const a=code.indexOf('function '+name+'('),b=code.indexOf('\nfunction ',a+1);return code.slice(a,b);}).join('\n');
 const context={map:Array.from({length:5},()=>Array(5).fill(0)),p:{x:1.5,y:1.5,a:0},objects:[{x:2.5,y:1.5,type:'voice'}],found:[],phase:0,notes:[],note:t=>context.notes.push(t),panelDialog:()=>{throw Error('Story bypass');}};
 vm.createContext(context);vm.runInContext(functions,context);assert.equal(context.interactionTarget().type,'voice');
 context.map[1][2]=1;assert.equal(context.interactionTarget(),null);context.map[1][2]=0;context.p.a=Math.PI;assert.equal(context.interactionTarget(),null);
 context.speak('voice');assert.match(context.notes[0],/trois souvenirs/);assert.equal(context.phase,0);
});
test('RTS attack-move advances toward hidden targets and holds for visible targets',()=>{
 const context={window:{},RTS:{TacticalRules:{detects:()=>false}}};context.window.RTS=context.RTS;vm.createContext(context);vm.runInContext(read('DONE/_2D War Zone Commander/js/SquadSystem.js'),context);
 const sys=context.RTS.SquadSystem;let moved=[];sys._move=s=>moved.push(s.id);sys._updateFormation=()=>{};sys._tickTimers=()=>{};
 const blue={id:1,team:'blue',x:0,y:0,target:{x:200,y:0},attackMove:true,ammo:10,def:{category:'vehicle',attackRange:100,combatMode:'normal'},isDead:()=>false};
 const red={id:2,team:'red',x:50,y:0,def:{category:'vehicle'},isDead:()=>false};
 sys.update([blue,red],.016,[]);assert.ok(moved.includes(1));moved=[];context.RTS.TacticalRules.detects=()=>true;sys.update([blue,red],.016,[]);assert.ok(!moved.includes(1));
 red.abandoned=true;moved=[];sys.update([blue,red],.016,[]);assert.ok(moved.includes(1));
});
test('RTS escorts respect hold-position and garrison orders',()=>{
 const context={window:{},RTS:{WORLD_W:1000,WORLD_H:1000}};context.window.RTS=context.RTS;vm.createContext(context);vm.runInContext(read('DONE/_2D War Zone Commander/js/SquadSystem.js'),context);
 const sys=context.RTS.SquadSystem;sys._move=()=>{};sys._updateFormation=()=>{};sys._tickTimers=()=>{};
 const squad={id:1,team:'blue',x:100,y:100,target:null,holdingPosition:true,def:{category:'infantry'},isDead:()=>false,aliveMembers:()=>[],members:[]};
 const vehicle={id:2,team:'blue',x:140,y:100,def:{category:'vehicle'},isDead:()=>false,members:[]};
 sys.update([squad,vehicle],.016,[]);assert.equal(squad.target,null);squad.holdingPosition=false;squad.garrisonedIn={};sys.update([squad,vehicle],.016,[]);assert.equal(squad.target,null);
 squad.garrisonedIn=null;sys.update([squad,vehicle],.016,[]);assert.ok(squad.target);
});

test('Chambre 07 shadow cannot raise fear through a separating wall',()=>{
 const code=read('A Faire/_3D Chambre 07/index.html').match(/<script>([\s\S]*?)<\/script>/)[1];
 const functions=['isWall','clearSight','tick'].map(name=>{const a=code.indexOf('function '+name+'('),b=code.indexOf('\nfunction ',a+1);return code.slice(a,b);}).join('\n');
 const c={map:Array.from({length:5},()=>Array(5).fill(0)),p:{x:1.95,y:1.5,a:0},enemy:{x:3.05,y:1.5,active:true},keys:new Set(),running:true,paused:false,panic:30,updateObjective:()=>{}};c.map[1][2]=1;vm.createContext(c);vm.runInContext(functions,c);
 c.tick(.016);assert.ok(c.panic<30);c.map[1][2]=0;c.panic=30;c.tick(.016);assert.ok(c.panic>30);
});
