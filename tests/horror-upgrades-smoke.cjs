// Regression coverage for the enhanced horror games. No claim of full gameplay QA.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const zombie='A Faire/_2D Zombie Shooter',veil='A Faire/_2D Black Veil';
const sources=[
 [zombie+'/js/game.js', ['TOTAL_WAVES = 5','function createEnemy','function reload','function finish','function draw']],
 [zombie+'/js/ui.js',['function updateHUD','objective','reserve']],
 [veil+'/index.html',['function lineClear','function distract','function step','stones:3']],
 ['A Faire/_2D_3D Etage Zero/core.js',['function routeGhost','function ghost','ghostPathClock']],
 ['A Faire/_3D Nereide Le Chant du Fond/game.js',['function hunterLineClear','function hunter','lastHunterX']]
];
for(const [filename,markers] of sources){
 const source=read(filename);
 const code=filename.endsWith('.html')?source.match(/<script[^>]*>([\s\S]*?)<\/script>/i)?.[1]:source;
 assert.ok(code&&code.length>100,'Horror script missing: '+filename);
 if(!/^\s*import\s/m.test(code))new vm.Script(code,{filename});
 for(const marker of markers)assert.ok(source.includes(marker),'Missing '+marker+' in '+filename);
 console.log('PASS',filename);
}
const html=read(zombie+'/index.html');
for(const id of ['hp','score','wave','weapon','ammo','stamina','objective','startBtn','restartBtn'])assert.ok(html.includes('id="'+id+'"'),id);
assert.match(read(zombie+'/css/styles.css'),/aspect-ratio:9\/5/);
console.log('Horror campaign static regression: all upgraded games parse correctly.');
