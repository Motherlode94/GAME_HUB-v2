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
const svg=(vehicle,enemy,faction)=>vehicle?
`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><ellipse cx="48" cy="78" rx="35" ry="12" fill="#05090a" opacity=".37"/><g transform="rotate(-4 48 48)"><rect x="11" y="20" width="74" height="56" rx="11" fill="#222a25" stroke="#0e1715" stroke-width="4"/><path d="M16 26h64v44H16z" fill="${faction.armor}"/><path d="M24 28h48v40H24z" fill="#8b947b"/><path d="M30 29l26 38M53 28L28 63" stroke="#566451" stroke-width="6"/><rect x="33" y="17" width="30" height="57" rx="13" fill="#626d58" stroke="#28342b" stroke-width="3"/><circle cx="48" cy="42" r="12" fill="#838e75" stroke="#2a362d" stroke-width="4"/><path d="M48 41V5" stroke="#26302a" stroke-width="9"/><path d="M48 41V5" stroke="#aab39b" stroke-width="3"/><rect x="15" y="30" width="7" height="30" fill="#28332e"/><rect x="74" y="30" width="7" height="30" fill="#28332e"/><rect x="36" y="52" width="24" height="7" rx="3" fill="#384b3c"/></g></svg>`:
`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><ellipse cx="33" cy="53" rx="16" ry="6" fill="#070b0c" opacity=".45"/><path d="M20 25L12 36l8 8 9-9M44 25l9 10-8 8-9-8" fill="#3c4739" stroke="#1f2c25" stroke-width="3"/><path d="M25 34l-6 17 10 3 5-15M38 35l7 16-9 3-6-15" fill="#333d36" stroke="#17211c" stroke-width="3"/><path d="M21 24q11-8 22 0l3 18q-13 11-28 0z" fill="${faction.uniform}" stroke="#1d2923" stroke-width="3"/><path d="M23 27h18M28 36h11" stroke="#a8a98b" stroke-width="3"/><circle cx="32" cy="17" r="11" fill="#5d6955" stroke="#1c2822" stroke-width="3"/><path d="M22 17q10-16 20 0z" fill="#9b9d81"/><path d="M19 29l29 8" stroke="#202824" stroke-width="6"/><path d="M41 34l17 4" stroke="#343a33" stroke-width="4"/><path d="M28 21h8" stroke="#121b1d" stroke-width="3"/></svg>`;
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
