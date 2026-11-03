// QA statique des jeux DONE : node scripts/qa-done.cjs
// Contrôle structurel uniquement ; ne remplace pas des tests navigateur.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../DONE'),catalog=path.resolve(__dirname,'../js/wgc-data.js');
const dirs=fs.readdirSync(root,{withFileTypes:true}).filter(d=>d.isDirectory()&&d.name!=='_shared'&&d.name!=='_SharedAssets'&&fs.existsSync(path.join(root,d.name,'index.html'))).map(d=>d.name);
const source=fs.readFileSync(catalog,'utf8');
const window={};const storage={getItem:()=>null,setItem:()=>{}};
vm.runInNewContext(source,{window,localStorage:storage,Date,Math,Number,String,JSON}, {filename:'wgc-data.js',timeout:2000});
const games=window.WGC_DATA.GAMES.filter(g=>g.playUrl.startsWith('DONE/')),failures=[];
const paths=new Set();
const warnings=[];let checkedScripts=0,checkedAssets=0;
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
 const base=path.join(root,dir);
 for(const match of html.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/gi)){
   const ref=match[1].trim();
   if(!ref||/^(https?:|data:|blob:|#|mailto:|javascript:|\/\/)/i.test(ref))continue;
   const clean=decodeURIComponent(ref.split(/[?#]/)[0]);
   const asset=clean.startsWith('/')?path.resolve(root,'..',clean.slice(1)):path.resolve(base,clean);
   if(!fs.existsSync(asset))failures.push('Ressource introuvable: '+dir+' -> '+ref);
   checkedAssets++;
 }
 function walk(folder,depth=0){
   if(depth>5)return;
   for(const file of fs.readdirSync(folder,{withFileTypes:true})){
     if(file.isDirectory()&&!['node_modules','.git','dist','vendor'].includes(file.name))walk(path.join(folder,file.name),depth+1);
     else if(file.isFile()&&/\.(?:js|mjs|cjs)$/.test(file.name)){
       const full=path.join(folder,file.name),content=fs.readFileSync(full,'utf8');
       try{
         const isModule=/^\s*(?:import|export)\s/m.test(content)||file.name.endsWith('.mjs');
         if(isModule&&typeof vm.SourceTextModule==='function')new vm.SourceTextModule(content,{identifier:full});
         else if(isModule)warnings.push('Module ESM non analysé: '+path.relative(root,full));
         else new vm.Script(content,{filename:full});
         checkedScripts++;
       }catch(err){failures.push('Syntaxe JS: '+path.relative(root,full)+' — '+err.message)}
     }
   }
 }
 walk(base);

}
if(games.length!==dirs.length)failures.push('Catalogue '+games.length+' / dossiers '+dirs.length);
console.log('QA DONE: '+dirs.length+' dossiers, '+games.length+' jeux, '+checkedScripts+' scripts, '+checkedAssets+' références HTML, '+failures.length+' erreurs, '+warnings.length+' avertissements');
for(const issue of warnings)console.warn(' ! '+issue);
for(const issue of failures)console.error(' - '+issue);
process.exitCode=failures.length?1:0;
