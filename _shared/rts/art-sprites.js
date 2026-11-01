/* WarLike RTS: original top-down 2D sprite silhouettes inspired by the approved art direction.
   Vector sprites are game assets, not crops of the presentation board. */
(function(g){
'use strict';
const FACTIONS={
 allied:{name:'Forces alliées',uniform:'#697858',armor:'#566a56'},
 axis:{name:'Forces nazies (historique)',uniform:'#656c62',armor:'#565f55'},
 militia:{name:'Milice djihadiste fictive',uniform:'#967e56',armor:'#88745a'}
};
const enemyTeams=new Set(['axis','red','enemy']);
let enemyFaction='axis';
try{const saved=localStorage.getItem('warlike-rts-enemy-faction');if(saved==='militia'||saved==='axis')enemyFaction=saved}catch{}
// Distinctive faction silhouettes; no extremist insignia or propaganda symbols.
const svg=(vehicle,enemy,faction)=>{
 const militia=faction===FACTIONS.militia,axis=faction===FACTIONS.axis;
 if(vehicle){
   const chassis=militia?'#735d3f':axis?'#525b51':'#566a56';
   const trim=militia?'#b49a6b':axis?'#8d9689':'#a8b3a0';
   const body=militia
    ?'<rect x="23" y="30" width="50" height="43" rx="5" fill="#876e49"/><rect x="27" y="36" width="42" height="15" fill="#293332"/><path d="M31 58h34l7 14H25z" fill="#ac956d"/><path d="M42 28l-6-11h24l-3 13" fill="#3c4238"/>'
    :'<path d="M20 28h56v40H20z" fill="#7a8877"/><rect x="32" y="21" width="32" height="44" rx="8" fill="#526151"/><circle cx="48" cy="40" r="14" fill="#9aa18e" stroke="#344038" stroke-width="5"/><path d="M48 39V7" stroke="#242b28" stroke-width="8"/>';
   return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><ellipse cx="48" cy="81" rx="36" ry="11" opacity=".4" fill="#101411"/><rect x="11" y="22" width="74" height="56" rx="9" fill="${chassis}" stroke="#242927" stroke-width="4"/><rect x="8" y="29" width="11" height="42" rx="4" fill="#1b2524"/><rect x="77" y="29" width="11" height="42" rx="4" fill="#1b2524"/><path d="M13 32h7m-7 12h7m-7 12h7m56-24h7m-7 12h7m-7 12h7" stroke="${trim}" stroke-width="2"/>${body}<rect x="27" y="67" width="42" height="5" fill="${trim}" opacity=".5"/></svg>`;
 }
 const coat=militia?'#8d7752':axis?'#68726b':'#667e62';
 const helmet=militia
  ?'<path d="M19 17q13-17 27 0l-4 8H23z" fill="#b5a07e"/><path d="M17 19q15 7 30 1" stroke="#695941" stroke-width="4"/>'
  :axis
  ?'<path d="M16 23q1-23 17-23t17 23l-9 4H22z" fill="#505d59" stroke="#293733" stroke-width="3"/><path d="M18 22h29" stroke="#a6aaa0" stroke-width="3"/>'
  :'<path d="M18 22q0-18 15-18t15 18z" fill="#677e62"/>';
 const vest=militia?'<path d="M25 30l15-1 4 17H22z" fill="#b6a37d"/><path d="M23 36h21" stroke="#715e40" stroke-width="5"/>':axis?'<path d="M22 29h23l-4 21H25z" fill="#565a52"/><rect x="27" y="35" width="13" height="9" fill="#939990"/>':'<rect x="24" y="32" width="20" height="13" fill="#495948"/>';
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><ellipse cx="33" cy="55" rx="17" ry="6" fill="#101715" opacity=".35"/><path d="M24 40l-7 13 12 3 5-15m4-1 10 12-9 4-7-15" fill="#333b35" stroke="#222923" stroke-width="3"/><path d="M24 25L13 38l9 7 8-10m12-10 11 13-9 7-8-10" fill="${coat}" stroke="#26302b" stroke-width="3"/><path d="M22 27q11-7 23 0l3 20q-15 9-29 0z" fill="${coat}" stroke="#29312b" stroke-width="3"/>${vest}<circle cx="33" cy="19" r="11" fill="#b7aa8c"/>${helmet}<path d="M18 29l30 8" stroke="#202623" stroke-width="6"/><path d="M41 35l17 4" stroke="#4e514a" stroke-width="4"/></svg>`;
};
const images={};
function get(vehicle,factionId){let key=(vehicle?'vehicle':'infantry')+'-'+factionId;if(!images[key]){let img=new Image();img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg(vehicle,factionId!=='allied',FACTIONS[factionId]));images[key]=img;}return images[key];}
g.WarLikeArt={
 factions:FACTIONS,
 getEnemyFaction(){return enemyFaction},
 setEnemyFaction(value){if(value!=='axis'&&value!=='militia')return false;enemyFaction=value;try{localStorage.setItem('warlike-rts-enemy-faction',value)}catch{}return true},
 draw(ctx,kind,team,x,y,size,heading=0){
   const vehicle=kind==='vehicle'||kind==='tank'||kind==='carrier';
   const img=get(vehicle,enemyTeams.has(team)?enemyFaction:'allied');
   if(!img.complete||!img.naturalWidth)return false;
   ctx.save();ctx.translate(x,y);ctx.rotate(heading);ctx.drawImage(img,-size/2,-size/2,size,size);ctx.restore();return true;
 }
};
// Visual enemy faction selector shared by the three RTS demos.
// This changes enemy appearance only; unit behavior and missions stay unchanged.
function mountSelector(){
 if(!document.body||document.getElementById('warlike-enemy-selector'))return;
 const wrap=document.createElement('div');
 wrap.id='warlike-enemy-selector';
 wrap.style.cssText='position:fixed;right:12px;bottom:12px;z-index:9998;background:#0a1720ed;color:#f1f6ee;border:1px solid #738579;border-radius:8px;padding:9px 12px;font:12px system-ui,sans-serif;max-width:220px;box-shadow:0 4px 20px #0008';
 const label=document.createElement('label');
 label.htmlFor='warlike-enemy-select';label.textContent='Aspect de la faction adverse';
 label.style.display='block';
 const select=document.createElement('select');
 select.id='warlike-enemy-select';
 select.style.cssText='display:block;width:100%;margin-top:5px;background:#152c36;color:white;border:1px solid #70878d;border-radius:4px;padding:5px';
 for(const id of ['axis','militia']){const option=document.createElement('option');option.value=id;option.textContent=FACTIONS[id].name;select.appendChild(option)}
 select.value=enemyFaction;
 select.addEventListener('change',()=>g.WarLikeArt.setEnemyFaction(select.value));
 wrap.append(label,select);
 const note=document.createElement('small');note.textContent='Visuel uniquement · factions antagonistes';note.style.cssText='display:block;margin-top:4px;color:#bac8c3';wrap.appendChild(note);
 document.body.appendChild(wrap);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountSelector,{once:true});else mountSelector();
})(window);
