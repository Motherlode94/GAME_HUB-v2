/* Example assets in the actual repository, not the generated comic sprite sheet. */
(()=>{'use strict';
const examples=[
 {name:'Volt Sentinel · héros',path:'./assets/heroes/volt_sentinel.svg'},
 {name:'Void Reaver · ennemi',path:'./assets/enemies/void_reaver.svg'},
 {name:'Energy Blast · pouvoir',path:'./assets/vfx/energy_blast.svg'}
];
function init(){
 const dest=document.querySelector('main>aside:last-child');if(!dest)return;
 const pane=document.createElement('div');pane.id='assetLibrary';
 const title=document.createElement('h3');title.textContent='Assets fournis';pane.append(title);
 const info=document.createElement('p');info.textContent='3 fichiers SVG de démonstration. Importe ta planche PNG pour découper les vrais personnages de Super Hero.';pane.append(info);
 for(const item of examples){
  const btn=document.createElement('button');btn.type='button';
  const im=document.createElement('img');im.src=item.path;im.width=36;im.height=36;im.alt='';
  const label=document.createElement('span');label.textContent=item.name;
  btn.append(im,label);
  btn.onclick=async()=>{try{
    const response=await fetch(item.path,{cache:'no-store'});
    if(!response.ok)throw Error('HTTP '+response.status);
    const file=new File([await response.blob()],item.path.split('/').pop(),{type:'image/svg+xml'});
    const input=document.getElementById('file');const transfer=new DataTransfer();
    transfer.items.add(file);input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));
   }catch(error){alert('Impossible de charger : '+error.message)}
  };
  pane.append(btn);
 }
 dest.append(pane);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();