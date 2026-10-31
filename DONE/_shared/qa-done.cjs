// QA statique des jeux DONE : node DONE/_shared/qa-done.cjs
// Contrôle structurel uniquement ; ne remplace pas des tests navigateur.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),catalog=path.resolve(root,'../js/wgc-data.js');
const dirs=fs.readdirSync(root,{withFileTypes:true}).filter(d=>d.isDirectory()&&d.name!=='_shared'&&fs.existsSync(path.join(root,d.name,'index.html'))).map(d=>d.name);
const source=fs.readFileSync(catalog,'utf8');
const window={};const storage={getItem:()=>null,setItem:()=>{}};
vm.runInNewContext(source,{window,localStorage:storage,Date,Math,Number,String,JSON}, {filename:'wgc-data.js',timeout:2000});
const games=window.WGC_DATA.GAMES,failures=[];
const paths=new Set();
for(const game of games){
 const full=path.resolve(root,'..',game.playUrl);
 if(!full.startsWith(root+path.sep))failures.push('Chemin hors DONE: '+game.title);
 else if(!fs.existsSync(full))failures.push('Entrée manquante: '+game.title);
 if(paths.has(game.playUrl))failures.push('Doublon de chemin: '+game.playUrl);
 paths.add(game.playUrl);
}
for(const dir of dirs){
 const url='DONE/'+dir+'/index.html';
 if(!paths.has(url))failures.push('Absent du catalogue: '+dir);
 const html=fs.readFileSync(path.join(root,dir,'index.html'),'utf8');
 if(!/<html\b/i.test(html))failures.push('HTML invalide: '+dir);
}
if(games.length!==dirs.length)failures.push('Catalogue '+games.length+' / dossiers '+dirs.length);
console.log('QA DONE: '+dirs.length+' dossiers, '+games.length+' jeux enregistrés, '+failures.length+' anomalies');
for(const issue of failures)console.error(' - '+issue);
process.exitCode=failures.length?1:0;
