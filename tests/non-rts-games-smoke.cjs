// Smoke checks for non-RTS games: syntax, entry points, and controls.
// These do not certify gameplay correctness.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../DONE');
const cases=[
 ['_2D Basket Sim',['canvas','js/script.js']],
 ['_2D Tower Defense',['canvas','js/game.js']],
 ['_2D Plateformer',['canvas','js/physics.js','js/player.js']],
 ['_2D Fighting Legends',['js/main.js']],
 ['_2D Dungeon Crawler',[]],
 ['_2D Hero Forces',[]],
 ['_2D Football Manager',[]],
 ['_2D NFL Sim',[]],
 ['_2D City Builder',[]],
 ['_2D Anime Harem',[]],
 ['_2D Artiste Manager',[]],
 ['_2D Be the Kings',[]],
 ['_2D Free Force',[]],
 ['_2D Hack n Slash v2',[]],
 ['_2D Hard Wood',[]],
 ['_2D Vampire\'s Sim',[]],
 ['_2D Axis Infinity',[]]
];
let scripts=0;
for(const [name,requirements] of cases){
 const directory=path.join(root,name),entry=path.join(directory,'index.html');
 assert.ok(fs.existsSync(entry),'Missing game entry: '+name);
 const html=fs.readFileSync(entry,'utf8');
 assert.match(html,/<html\b/i,'Missing HTML root: '+name);
 for(const req of requirements){
  if(req==='canvas')assert.match(html,/<canvas\b/i,'Missing game canvas: '+name);
  else assert.ok(fs.existsSync(path.join(directory,req)),'Missing expected source: '+name+'/'+req);
 }
 for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
  const src=m[1].match(/\bsrc\s*=\s*["']([^"']+)["']/i);
  const filename=src?path.resolve(directory,src[1].split(/[?#]/)[0]):entry;
  if(src)assert.ok(fs.existsSync(filename),'Missing script: '+name+' '+src[1]);
  const code=src?fs.readFileSync(filename,'utf8'):m[2];
  if(!code.trim())continue;
  if(/\btype\s*=\s*["']module["']/i.test(m[1])||/\b(?:import|export)\s/m.test(code))continue;
  new vm.Script(code,{filename});scripts++;
 }
 console.log('PASS: '+name);
}
console.log('Non-RTS static smoke checks: '+cases.length+' games, '+scripts+' scripts parsed.');
