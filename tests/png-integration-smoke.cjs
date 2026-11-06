// Vérifie que les PNG utilisés par les jeux existent réellement dans le dépôt.
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const racing=path.join(root,'A Faire','_2D Racing');
const manifest=fs.readFileSync(path.join(racing,'js/assets.js'),'utf8');
const sandbox={};
vm.runInNewContext(manifest+';globalThis.__list=ASSETS;',sandbox);
const entries=sandbox.__list;
assert.ok(entries.length>=15,'Racing must register its PNG library');
for(const {key,path:relative} of entries){
  assert.match(relative,/\.png$/i,'Expected PNG asset for '+key);
  const filename=path.resolve(racing,'assets/Racing',relative);
  assert.ok(filename.startsWith(path.join(racing,'assets','Racing')+path.sep),'Unsafe asset path '+key);
  assert.ok(fs.existsSync(filename),'Missing PNG '+key+' -> '+relative);
  const png=fs.readFileSync(filename);
  assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a','Invalid PNG signature: '+relative);
}
const code=fs.readFileSync(path.join(racing,'js/script.js'),'utf8');
for(const key of ['car_red','car_blue','car_yellow','car_lime','car_purple','road','bg_grass','prop.barrel','prop.oil']){
  assert.ok(entries.some(entry=>entry.key===key),'Missing gameplay key '+key);
}
assert.match(code,/assets\.get\('road'\)/,'Racing road sprite not drawn in gameplay');
assert.match(code,/assets\.get\('bg_grass'\)/,'Racing grass sprite not drawn in gameplay');
assert.match(code,/obstacle\.image/,'Obstacles are not using the PNG asset mapping');
const platformer=path.join(root,'DONE','_2D Plateformer');
const loader=fs.readFileSync(path.join(platformer,'js/assetLoader.js'),'utf8');
const platformImages=[...loader.matchAll(/this\.loadImage\('[^']+',\s*'([^']+\.png)'/g)].map(match=>match[1]);
assert.ok(platformImages.length>=7,'Platformer has too few linked PNGs');
for(const relative of platformImages){
  assert.ok(fs.existsSync(path.resolve(platformer,relative)),'Missing Platformer PNG: '+relative);
}
const shared=fs.readFileSync(path.join(root,'_shared/rts/library.js'),'utf8');
const mapping=[...shared.matchAll(/src:"(\/_shared\/rts\/assets\/[^"]+\.png)"/g)].map(x=>x[1]);
assert.ok(mapping.length>=50,'RTS asset catalog unexpectedly incomplete');
for(const url of mapping)assert.ok(fs.existsSync(path.join(root,url.slice(1))),'Missing shared RTS PNG '+url);
const hero=fs.readFileSync(path.join(root,'DONE/_2D Hero Forces/index.html'),'utf8');
assert.ok(hero.includes('/_shared/rts/library.js'),'Hero Forces does not import shared PNG library');
const wz=fs.readFileSync(path.join(root,'DONE/_2D War Zone Commander/index.html'),'utf8');
assert.ok(wz.includes('/_shared/rts/library.js')&&wz.includes('js/SpriteAtlas.js'),'War Zone Commander is missing PNG sprite bootstrap');
console.log('PASS: '+entries.length+' Racing, '+platformImages.length+' Platformer, '+mapping.length+' RTS PNG paths and gameplay integration');
