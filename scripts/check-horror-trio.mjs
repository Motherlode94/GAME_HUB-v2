#!/usr/bin/env node
// QA statique des 3 jeux d'horreur. Exécuter : node scripts/check-horror-trio.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..');
const projects=[
  {id:49,title:'Étage Zéro',folder:'A Faire/_2D_3D Etage Zero',
   scripts:['core.js'],images:['player_idle','player_walk','entity','clock','photo','tape','vault','floor','wall','exit']},
  {id:50,title:'SILENCE 03 — Les Voix du Mur',folder:'A Faire/_2D Silence 03',
   scripts:['game.js'],images:['protagonist_idle','protagonist_walk','guardian','tape','locker','decoder','exit','floor','wall']},
  {id:51,title:'NÉRÉIDE — Le Chant du Fond',folder:'A Faire/_3D Nereide Le Chant du Fond',
   scripts:['game.js'],images:[]}
];
let errors=[],warnings=[];
const exists=rel=>fs.existsSync(path.join(root,rel));
const data=fs.readFileSync(path.join(root,'js/wgc-data.js'),'utf8');
const sandbox={window:{}};vm.runInNewContext(data,sandbox);
const games=sandbox.window.WGC_DATA.GAMES;
if(games.length!==new Set(games.map(g=>g.id)).size)errors.push('Identifiants de catalogue dupliqués');
for(const game of projects){
 const entry=games.find(g=>g.id===game.id);
 if(!entry){errors.push(game.title+' absent du catalogue');continue}
 if(entry.playUrl!==game.folder+'/index.html')errors.push('Entrée catalogue incorrecte : '+game.title);
 if(!exists(entry.playUrl))errors.push('index.html absent : '+game.title);
 if(!entry.coverImage||!exists(entry.coverImage))errors.push('Couverture absente : '+game.title);
 if(!exists(game.folder+'/style.css'))errors.push('CSS absent : '+game.title);
 if(!exists(game.folder+'/README.md'))errors.push('Documentation absente : '+game.title);
 for(const name of game.scripts){
  const source=game.folder+'/'+name;
  if(!exists(source)){errors.push('Script manquant '+source);continue}
  const check=spawnSync(process.execPath,['--check',path.join(root,source)],{encoding:'utf8'});
  if(check.status!==0)errors.push(source+' : '+(check.stderr||'').slice(0,220));
 }
 for(const name of game.images){
  const file=game.folder+'/assets/'+name+'.svg';
  if(!exists(file))errors.push('Image manquante '+file);
  else{const s=fs.readFileSync(path.join(root,file),'utf8');if(!s.includes('<svg')||!s.includes('</svg>'))errors.push('SVG illisible '+file)}
 }
 if(!exists(entry.playUrl))continue;
 const html=fs.readFileSync(path.join(root,entry.playUrl),'utf8');
 const rootUrl='https://example.invalid/'+entry.playUrl;
 for(const m of html.matchAll(/(?:href|src)\s*=\s*["']([^"']+)["']/g)){
  const u=m[1];if(/^(https?:|data:|blob:|#|javascript:)/i.test(u))continue;
  const normalized=decodeURIComponent(new URL(u,rootUrl).pathname.slice(1));
  if(!exists(normalized))errors.push(game.title+' : ressource absente '+u);
 }
}
console.log('WarLike Horror QA statique :',projects.length,'jeux;',errors.length,'erreurs;',warnings.length,'avertissements');
for(const e of errors)console.error('ERROR',e);
for(const w of warnings)console.warn('WARN',w);
if(errors.length)process.exitCode=1;
