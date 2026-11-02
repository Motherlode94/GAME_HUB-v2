/* SpriteForge example asset loader — separate from the game engine. */
(()=>{'use strict';
const examples=[
 {name:'Volt Sentinel — héros',path:'./assets/heroes/volt_sentinel.svg'},
 {name:'Void Reaver — ennemi',path:'./assets/enemies/void_reaver.svg'},
 {name:'Energy Blast — pouvoir',path:'./assets/vfx/energy_blast.svg'}
];
const init=()=>{
 const pane=document.createElement('div');
 pane.style.cssText='position:fixed;bottom:14px;right:14px;z-index:2000;background:#17243a;border:1px solid #54708f;border-radius:12px;padding:12px;max-width:280px;color:white;box-shadow:0 8px 30px #0009';
 const heading=document.createElement('strong');heading.textContent='Assets disponibles';pane.append(heading);
 const note=document.createElement('p');note.style.cssText='font:12px system-ui;color:#bfd0ea';note.textContent='Exemples SVG intégrés au dépôt. Les planches PNG d’origine doivent être importées séparément.';pane.append(note);
 examples.forEach(e=>{const b=document.createElement('button');b.style.cssText='display:flex;align-items:center;gap:8px;width:100%;margin-top:6px';const im=document.createElement('img');im.src=e.path;im.width=32;im.height=32;const span=document.createElement('span');span.textContent=e.name;b.append(im,span);b.onclick=async()=>{try{const response=await fetch(e.path);if(!response.ok)throw new Error('HTTP '+response.status);const blob=await response.blob();const file=new File([blob],e.path.split('/').pop(),{type:'image/svg+xml'});const input=document.querySelector('input[type=file]');if(input){const dt=new DataTransfer();dt.items.add(file);input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}))}else alert('Import manuel requis')}catch(err){alert('Chargement impossible : '+err.message)}};pane.append(b)});
 const close=document.createElement('button');close.textContent='Masquer';close.style.marginTop='8px';close.onclick=()=>pane.remove();pane.append(close);document.body.append(pane);
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();