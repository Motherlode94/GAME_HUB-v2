/* WarLike Civilian Pack: non-destructive image integration for DONE games. */
(()=>{'use strict';const own=document.currentScript?.src;if(!own)return;const origin=new URL('./',own);
const game=decodeURIComponent(location.pathname).split('/').find(x=>x.startsWith('_2D ')||x.startsWith('_3D '))||'';
const slug=game.toLowerCase();let people=[],lookup=new Map(),scheduled=false,observer;
const imgSrc=id=>{const p=lookup.get(id.toLowerCase());return p?new URL(p.portrait,origin).href:''};
const charName=v=>v?.split(' · ')[0].split(' — ')[0].trim().toLowerCase();
function image(id,css='civilian-portrait'){const p=lookup.get((id||'').toLowerCase());if(!p)return null;const img=document.createElement('img');img.className=css;img.loading='lazy';img.decoding='async';img.alt='Portrait illustré de '+p.name;img.src=new URL(p.portrait,origin).href;return img}
function addLink(container){if(!container||container.querySelector('.civilian-pack-link'))return;const a=document.createElement('a');a.className='civilian-pack-link';a.href=new URL('index.html',origin).href;a.textContent='Voir les 60 personnages civils ↗';container.append(a)}
function render(){
 if(!lookup.size)return;
 if(slug.includes('after dark')){
  const speaker=document.getElementById('speaker')?.textContent?.trim(),portrait=document.getElementById('portrait'),data=lookup.get((speaker||'').toLowerCase());
  if(portrait&&data){let img=portrait.querySelector('img.civilian-character');if(!img){img=image(data.id,'civilian-character');portrait.append(img);portrait.classList.add('has-civilian')}const url=new URL(data.portrait,origin).href;if(img.src!==url){img.src=url;img.alt=data.name}}addLink(document.querySelector('.sidebar'));
 }
 if(slug.includes('hearts of eden')){
  document.querySelectorAll('#characters article').forEach(el=>{if(el.querySelector('.civilian-portrait'))return;const name=charName(el.querySelector('h2')?.textContent);const portrait=image(name);if(portrait){portrait.classList.add('civilian-character-card');el.insertBefore(portrait,el.firstChild)}});
  addLink(document.querySelector('main'));
 }
 if(slug.includes('agence x')){
  document.querySelectorAll('#talents .entry').forEach(el=>{if(el.querySelector('.civilian-portrait'))return;const name=charName(el.querySelector('strong')?.textContent);const portrait=image(name);if(portrait){portrait.classList.add('civilian-character-card');el.insertBefore(portrait,el.firstChild)}});
  const stage=document.querySelector('.stage'),select=document.getElementById('talent');
  if(stage&&select){const name=charName(select.options?.[select.selectedIndex]?.textContent);const src=imgSrc(name);if(src){let art=stage.querySelector('.civilian-stage-figure');if(!art){art=document.createElement('img');art.className='civilian-stage-figure';art.alt='Personnage sélectionné';stage.append(art)}if(art.src!==src)art.src=src}};
  addLink(document.querySelector('header'));
 }
 if(slug.includes('the silent verdict')){
  const select=document.getElementById('suspect'),testimony=document.getElementById('testimony');if(select&&testimony){const key=charName(select.options?.[select.selectedIndex]?.textContent);const src=imgSrc(key);let existing=document.getElementById('civilianSuspect');if(src){if(!existing){existing=document.createElement('img');existing.id='civilianSuspect';existing.className='civilian-suspect';existing.alt='Portrait illustré du suspect';testimony.parentNode.insertBefore(existing,testimony)}if(existing.src!==src){existing.src=src;existing.alt='Portrait de '+key}}else if(existing)existing.remove()};
  addLink(document.querySelector('main'));
 }
 if(slug.includes('no mans dawn')){
  const hud=document.getElementById('hud');if(hud&&!hud.querySelector('.civilian-npc-tag')){const el=document.createElement('div');el.className='civilian-npc-tag';const pic=image('mara');if(pic)el.append(pic);const span=document.createElement('span');span.textContent='Mara · Survivante du refuge';el.append(span);hud.append(el)}addLink(hud)
 }
 if(slug.includes('redline district')){
  const menu=document.getElementById('menu');if(menu&&!menu.querySelector('.civilian-npc-strip')){const el=document.createElement('div');el.className='civilian-npc-strip';const p=document.createElement('p');p.textContent='Paddock · Personnel et supporters';el.append(p);for(const id of ['c25','c29','c43','c44']){const portrait=image(id);if(portrait)el.append(portrait)}menu.append(el)}addLink(menu)
 }
 if(slug.includes('the last signal')){
  const screen=document.getElementById('screen');if(screen&&!screen.querySelector('.civilian-npc-strip')){const el=document.createElement('div');el.className='civilian-npc-strip';const p=document.createElement('p');p.textContent='Dossier H-17 · Personnel identifié';el.append(p);for(const id of ['c27','c36','c47']){const portrait=image(id);if(portrait)el.append(portrait)}screen.append(el)}addLink(screen)
 }
}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;if(observer)observer.disconnect();render();if(observer)observer.observe(document.body,{childList:true,subtree:true})})}
fetch(new URL('manifest.json',origin)).then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json()}).then(d=>{people=d.characters||[];lookup=new Map(people.map(p=>[p.id.toLowerCase(),p]));for(const p of people)lookup.set(p.name.toLowerCase(),p);const start=()=>{render();observer=new MutationObserver(schedule);observer.observe(document.body,{childList:true,subtree:true});document.addEventListener('change',e=>{if(['suspect','talent'].includes(e.target.id))schedule()})};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start()}).catch(e=>console.warn('Civilian Pack assets indisponibles :',e.message));
})();