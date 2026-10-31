const $=id=>document.getElementById(id);
const rooms=[
{name:'Salon',description:'Les invités ont quitté la réception à 22 h 10.',clues:[['verre','Un verre avec traces de somnifère'],['photo','Photographie prise à 22 h 14']]},
{name:'Bureau',description:'Un tiroir forcé, des dossiers déplacés.',clues:[['contrat','Contrat de vente falsifié'],['badge','Badge de sécurité au nom de Victor']]},
{name:'Jardin',description:'La terre humide garde des traces de pas.',clues:[['empreintes','Empreintes de chaussures pointure 43']]},
{name:'Garage',description:'Une voiture a quitté le domaine pendant la coupure.',clues:[['camera','Caméra : véhicule sorti à 22 h 19'],['ticket','Ticket de péage portant la plaque du véhicule']]},
{name:'Cuisine',description:'Des conversations ont été interrompues.',clues:[['carnet','Carnet de Camille : « Victor me menace »']]},
{name:'Galerie',description:'Le système d’alarme a été désactivé.',clues:[['alarme','Journal d’alarme : accès avec badge de Victor à 22 h 12']]}];
const suspects=[
{name:'Victor',role:'Associé financier',statement:'Je suis resté dans le salon toute la soirée.',questions:[['Vous avez utilisé votre badge ?','Je l’avais perdu. Du moins, je le croyais.'],['Pourquoi le contrat était-il falsifié ?','Camille allait me dénoncer.']]},
{name:'Élise',role:'Amie de Camille',statement:'J’ai vu Victor partir au bureau.',questions:[['À quelle heure ?','Peu après 22 h 10.'],['Connaissiez-vous le conflit ?','Oui, ils se disputaient au sujet d’un contrat.']]},
{name:'Samir',role:'Agent de sécurité',statement:'La coupure a duré exactement huit minutes.',questions:[['Qui pouvait désactiver l’alarme ?','Les détenteurs de badges autorisés.'],['Avez-vous observé le garage ?','Une voiture sombre a quitté la propriété.']]},
{name:'Juliette',role:'Cuisinière',statement:'Camille refusait de boire ce soir-là.',questions:[['Qui a servi les verres ?','Plusieurs invités se sont servis.'],['Que craignait Camille ?','Elle disait posséder des preuves.']]},
{name:'Antoine',role:'Chauffeur',statement:'Je n’ai conduit personne après 21 h.',questions:[['Qui avait les clés ?','Victor a emprunté le double.'],['Le véhicule ?','Une berline grise.']]},
{name:'Nora',role:'Photographe',statement:'Mon appareil indique 22 h 14 sur la dernière photo.',questions:[['Que montre la photo ?','Victor près du bureau.'],['Avez-vous vu Camille ?','Elle semblait désorientée.']]}];
let found=new Set(),asked=new Set(),currentRoom=0;const exits=[[1,4,5],[0,2,5],[1,3],[2,5],[0,5],[0,1,3,4]];const visited=new Set([0]);const essential=['contrat','badge','camera','alarme'];
function render(){const room=rooms[currentRoom];$('floorplan').innerHTML='';rooms.forEach((r,i)=>{const b=document.createElement('button');b.textContent=(visited.has(i)?'● ':'○ ')+r.name;b.disabled=i!==currentRoom&&!exits[currentRoom].includes(i);b.onclick=()=>travel(i);$('floorplan').append(b)});$('locationStatus').textContent='Position : '+room.name+' · Pièces explorées : '+visited.size+'/'+rooms.length;$('rooms').innerHTML='';rooms.forEach((r,i)=>{const b=document.createElement('button');b.textContent=r.name;b.onclick=()=>travel(i);$('rooms').append(b)});
$('roomTitle').textContent=room.name;$('roomDesc').textContent=room.description;$('clues').innerHTML='';
room.clues.forEach(([id,title])=>{const b=document.createElement('button');b.textContent=found.has(id)?'✓ '+title:'Examiner : '+title;b.disabled=found.has(id);b.onclick=()=>{found.add(id);render()};$('clues').append(b)});
$('journal').innerHTML='';rooms.flatMap(r=>r.clues).filter(c=>found.has(c[0])).forEach(c=>{const p=document.createElement('p');p.textContent='• '+c[1];$('journal').append(p)});
$('progress').textContent='Preuves : '+found.size+'/9 · Interrogatoires : '+asked.size;
}
$('suspect').innerHTML='';suspects.forEach((s,i)=>{const o=document.createElement('option');o.value=i;o.textContent=s.name+' — '+s.role;$('suspect').append(o)});
function interview(){const s=suspects[Number($('suspect').value)];$('testimony').textContent='Témoignage : « '+s.statement+' »';$('questions').innerHTML='';s.questions.forEach(([q,a],i)=>{const b=document.createElement('button');b.textContent=q;b.onclick=()=>{asked.add(s.name+'-'+i);$('feedback').textContent=s.name+' : « '+a+' »';render()};$('questions').append(b)})}
$('suspect').onchange=interview;$('accuse').onclick=()=>{const s=suspects[Number($('suspect').value)].name;if(essential.some(k=>!found.has(k))){$('feedback').textContent='Accusation insuffisante : il manque des éléments matériels décisifs.';return}if(s==='Victor'){$('feedback').textContent='Affaire résolue : le badge, la fraude, la voiture et la coupure relient Victor à la disparition. Camille est retrouvée grâce au trajet enregistré.';try{localStorage.setItem('warlike_silent_verdict_solved','1')}catch(e){}}else $('feedback').textContent='Votre théorie ne résiste pas aux preuves. Le véritable responsable reste libre.'};
function travel(i){if(i!==currentRoom&&!exits[currentRoom].includes(i))return;currentRoom=i;visited.add(i);render()}
$('reset').onclick=()=>{found.clear();asked.clear();currentRoom=0;visited.clear();visited.add(0);$('feedback').textContent='';render()};render();interview();