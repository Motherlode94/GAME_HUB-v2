#!/usr/bin/env node
// WarLike catalog + game entry QA. Run: node scripts/check-game-catalog.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..');
const catalog=fs.readFileSync(path.join(root,'js/wgc-data.js'),'utf8');
const games=[...catalog.matchAll(/\{\s*id:\s*(\d+),\s*title:\s*"([^"]+)"[^\n]*?playUrl:\s*"([^"]+)"/g)];
const errors=[],warnings=[],visited=new Set();
function exists(p){return fs.existsSync(path.join(root,p))}
function checkGame(id,title,url){
 if(visited.has(id))errors.push('Duplicate game ID '+id);visited.add(id);
 if(url.includes('..')||url.startsWith('/'))return errors.push('Unsafe playUrl: '+url);
 const folder=path.posix.dirname(url),page=path.join(root,url);
 if(!exists(url)){errors.push('Missing game entry: '+title+' -> '+url);return;}
 const html=fs.readFileSync(page,'utf8');
 for(const m of html.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/g)){
  const target=m[1];
  if(/^(https?:|data:|blob:|#|javascript:)/i.test(target))continue;
  const absolute=target.startsWith('/')?target.slice(1):path.posix.normalize(path.posix.join(folder,target.split(/[?#]/)[0]));
  if(!exists(absolute))errors.push(title+': missing dependency '+target);
 }
 for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
  const attr=m[1],body=m[2].trim();if(!body||/type=["']importmap["']/.test(attr))continue;
  if(!/type=["']module["']/.test(attr)){
   try{new vm.Script(body,{filename:url})}catch(e){errors.push(title+': inline script syntax '+e.message)}
  }
 }
 for(const m of html.matchAll(/<script\b[^>]*src=["']([^"']+\.js)["'][^>]*><\/script>/gi)){
  const src=m[1];if(/^https?:/.test(src))continue;
  const p=src.startsWith('/')?src.slice(1):path.posix.normalize(path.posix.join(folder,src));
  if(!exists(p))continue;
  const result=spawnSync(process.execPath,['--check',path.join(root,p)],{encoding:'utf8'});
  if(result.status!==0)errors.push(title+': script syntax '+p+' '+(result.stderr||'').slice(0,180));
 }
 if(url.startsWith('DONE/'))warnings.push(title+': DONE classification requires manual gameplay QA');
}
for(const m of games)checkGame(m[1],m[2],m[3]);
for(const section of ['DONE','A Faire']){
 const dirs=fs.readdirSync(path.join(root,section),{withFileTypes:true}).filter(d=>d.isDirectory()&&d.name!=='_shared');
 for(const dir of dirs){const url=section+'/'+dir.name+'/index.html';if(!exists(url))warnings.push('No index.html: '+section+'/'+dir.name)}
}
console.log('WarLike static QA:',games.length,'catalog entries;',errors.length,'errors;',warnings.length,'warnings');
for(const e of errors)console.error('ERROR',e);
for(const w of warnings)console.warn('WARN',w);
process.exitCode=errors.length?1:0;
