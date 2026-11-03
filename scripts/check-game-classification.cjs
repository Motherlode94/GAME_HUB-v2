// QA statique de la correspondance entre le catalogue et les dossiers.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),stages=['DONE','A Faire','A Revoir'];
const context={window:{},localStorage:{getItem(){return null},setItem(){}}};
vm.runInNewContext(fs.readFileSync(path.join(root,'js/wgc-data.js'),'utf8'),context,{timeout:2000});
const games=context.window.WGC_DATA.GAMES,errors=[],seenIds=new Set(),seenUrls=new Set();
const expected=new Map();
for(const dir of stages){
 for(const ent of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){
  if(!ent.isDirectory())continue;
  const p=dir+'/'+ent.name+'/index.html';
  if(fs.existsSync(path.join(root,p)))expected.set(p,dir);
 }
}
for(const game of games){
 if(seenIds.has(game.id))errors.push('Identifiant dupliqué : '+game.id);seenIds.add(game.id);
 if(seenUrls.has(game.playUrl))errors.push('URL dupliquée : '+game.playUrl);seenUrls.add(game.playUrl);
 if(!expected.has(game.playUrl))errors.push('Entrée sans dossier : '+game.title+' → '+game.playUrl);
 if(game.coverImage&&!fs.existsSync(path.join(root,game.coverImage)))errors.push('Couverture absente : '+game.title);
}
for(const url of expected.keys())if(!seenUrls.has(url))errors.push('Dossier absent du portail : '+url);
const counts=Object.fromEntries(stages.map(dir=>[dir,[...expected.values()].filter(x=>x===dir).length]));
console.log('Classification WarLike : '+JSON.stringify(counts)+' ; '+games.length+' jeux sur le portail ; '+errors.length+' erreur(s).');
for(const err of errors)console.error('ERREUR',err);
process.exitCode=errors.length?1:0;
