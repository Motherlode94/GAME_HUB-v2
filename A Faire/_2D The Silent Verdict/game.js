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

const secondCase={"title":"Affaire 2 — Le testament disparu","intro":"Une succession contestée et un document dérobé après une réunion familiale.","culprit":"Adrien","clues":[[["programme","Invitation familiale"],["photo","Photographie de 19 h"]],[["contrat","Procuration falsifiée"],["badge","Clé du coffre dans le manteau d'Adrien"]],[["empreintes","Empreinte vers le garage"]],[["camera","Portail : voiture d'Adrien à 19 h 23"],["ticket","Photo du véhicule"]],[["carnet","Appel d'Adrien au notaire"]],[["alarme","Alarme désactivée avec le code d'Adrien"]]],"people":[["Adrien","Héritier","Je n’ai pas touché au coffre."],["Salomé","Sœur","J’étais au salon."],["Luc","Majordome","Une voiture est partie."],["Emma","Notaire","Cette signature est fausse."],["Hugo","Cousin","Adrien semblait pressé."],["Rose","Gardienne","Le portail a tout enregistré."]]};
const thirdCase={"title":"Affaire 3 — La dernière représentation","intro":"Une actrice disparaît au théâtre. Sa voix continue pourtant à résonner pendant l'entracte.","culprit":"Léon","required":["contrat","badge","camera","alarme"],"clues":[[["programme","Entracte à 21 h 05"],["photo","Photographie des coulisses"]],[["contrat","Contrat : Léon perd sa commission si l’actrice part"],["badge","Badge au nom de Léon"]],[["empreintes","Traces de pas près du chargement"]],[["camera","Caméra : Léon à la sortie de service à 21 h 11"],["ticket","Fourgonnette sans bordereau"]],[["carnet","Lettre de rupture de contrat de l’actrice"]],[["alarme","Journal électronique : badge de Léon à 21 h 09"]]],"people":[["Léon","Agent artistique","J’étais en régie toute la soirée."],["Eva","Metteuse en scène","J’ai entendu la voix de l’actrice."],["Idriss","Régisseur","La voix provenait d’un fichier enregistré."],["Mila","Costumière","Léon était près de la loge."],["Paul","Machiniste","La sortie était verrouillée."],["Sara","Journaliste","Elle comptait rompre son contrat."]]};
const firstRooms=rooms.map(r=>({...r,clues:r.clues.map(c=>[...c])})),firstSuspects=suspects.map(x=>({...x}));
let activeCase=0;
const SAVE_KEY='warlike_silent_verdict_progress_v2';
const solvedCases=new Set();
function saveCase(){
 try{localStorage.setItem(SAVE_KEY,JSON.stringify({version:2,activeCase,found:[...found],asked:[...asked],currentRoom,visited:[...visited],solved:[...solvedCases]}));$('caseStatus').textContent='Enquête sauvegardée.';return true}
 catch(e){$('caseStatus').textContent='Sauvegarde locale indisponible.';return false}
}
function loadCase(){
 try{
  const data=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');
  if(!data||data.version!==2||!Number.isInteger(data.activeCase)||data.activeCase<0||data.activeCase>2)throw Error('invalid');
  selectCase(data.activeCase);
  const validClues=new Set(rooms.flatMap(r=>r.clues.map(c=>c[0])));
  found=new Set((data.found||[]).filter(k=>validClues.has(k)));
  asked=new Set((data.asked||[]).filter(k=>typeof k==='string'&&k.length<160));
  currentRoom=Number.isInteger(data.currentRoom)&&data.currentRoom>=0&&data.currentRoom<rooms.length?data.currentRoom:0;
  visited.clear();(data.visited||[]).filter(v=>Number.isInteger(v)&&v>=0&&v<rooms.length).forEach(v=>visited.add(v));visited.add(0);visited.add(currentRoom);
  solvedCases.clear();(data.solved||[]).filter(v=>Number.isInteger(v)&&v>=0&&v<3).forEach(v=>solvedCases.add(v));
  render();interview();$('caseStatus').textContent='Enquête restaurée.';
 }catch(e){$('caseStatus').textContent='Aucune sauvegarde valide.'}
}

function selectCase(i){activeCase=i;found.clear();asked.clear();currentRoom=0;visited.clear();visited.add(0);if(i===0){rooms.splice(0,rooms.length,...firstRooms);suspects.splice(0,suspects.length,...firstSuspects)}else{rooms.splice(0,rooms.length,...firstRooms.map((r,j)=>({...r,description:(i===1?secondCase:thirdCase).intro,clues:(i===1?secondCase:thirdCase).clues[j]})));suspects.splice(0,suspects.length,...(i===1?secondCase:thirdCase).people.map(([name,role,statement])=>({name,role,statement,questions:[['Votre témoignage ?',statement]]})))}$('suspect').innerHTML='';suspects.forEach((x,j)=>{let o=document.createElement('option');o.value=j;o.textContent=x.name+' — '+x.role;$('suspect').append(o)});$('cases').innerHTML='';[['Affaire 1 — Disparition au manoir',0],[secondCase.title,1],[thirdCase.title,2]].forEach(([name,id])=>{let b=document.createElement('button');b.textContent=name;b.onclick=()=>selectCase(id);$('cases').append(b)});$('caseIntro').textContent=i===0?'Disparition de Camille après une réception.':(i===1?secondCase:thirdCase).intro;render();interview();$('caseStatus').textContent=solvedCases.has(activeCase)?'Affaire résolue':'Enquête en cours'}
function render(){const room=rooms[currentRoom];$('floorplan').innerHTML='';rooms.forEach((r,i)=>{const b=document.createElement('button');b.textContent=(visited.has(i)?'● ':'○ ')+r.name;b.disabled=i!==currentRoom&&!exits[currentRoom].includes(i);b.onclick=()=>travel(i);$('floorplan').append(b)});$('locationStatus').textContent='Position : '+room.name+' · Pièces explorées : '+visited.size+'/'+rooms.length;$('rooms').innerHTML='';rooms.forEach((r,i)=>{const b=document.createElement('button');b.textContent=r.name;b.onclick=()=>travel(i);$('rooms').append(b)});
$('roomTitle').textContent=room.name;$('roomDesc').textContent=room.description;$('clues').innerHTML='';
room.clues.forEach(([id,title])=>{const b=document.createElement('button');b.textContent=found.has(id)?'✓ '+title:'Examiner : '+title;b.disabled=found.has(id);b.onclick=()=>{found.add(id);render();saveCase()};$('clues').append(b)});
$('journal').innerHTML='';rooms.flatMap(r=>r.clues).filter(c=>found.has(c[0])).forEach(c=>{const p=document.createElement('p');p.textContent='• '+c[1];$('journal').append(p)});
$('progress').textContent='Preuves : '+found.size+'/9 · Interrogatoires : '+asked.size;
}
$('suspect').innerHTML='';suspects.forEach((s,i)=>{const o=document.createElement('option');o.value=i;o.textContent=s.name+' — '+s.role;$('suspect').append(o)});
function interview(){const s=suspects[Number($('suspect').value)];$('testimony').textContent='Témoignage : « '+s.statement+' »';$('questions').innerHTML='';s.questions.forEach(([q,a],i)=>{const b=document.createElement('button');b.textContent=q;b.onclick=()=>{asked.add(s.name+'-'+i);$('feedback').textContent=s.name+' : « '+a+' »';render();saveCase()};$('questions').append(b)})}
$('suspect').onchange=interview;$('accuse').onclick=()=>{const s=suspects[Number($('suspect').value)].name;if(essential.some(k=>!found.has(k))){$('feedback').textContent='Accusation insuffisante : il manque des éléments matériels décisifs.';return}if(s===(activeCase===0?'Victor':activeCase===1?'Adrien':'Léon')){$('feedback').textContent='Affaire résolue : les preuves concordent contre '+s+'.';solvedCases.add(activeCase);saveCase();try{localStorage.setItem('warlike_silent_verdict_case_'+activeCase,'solved')}catch(e){}}else $('feedback').textContent='Votre théorie ne résiste pas aux preuves. Le véritable responsable reste libre.'};
function travel(i){if(i!==currentRoom&&!exits[currentRoom].includes(i))return;currentRoom=i;visited.add(i);render();saveCase()}
$('reset').onclick=()=>{if(!confirm('Recommencer cette enquête ? Les indices de cette affaire seront effacés.'))return;selectCase(activeCase);saveCase()};
$('saveCase').onclick=saveCase;
$('loadCase').onclick=loadCase;
selectCase(0);
try{if(localStorage.getItem(SAVE_KEY))$('caseStatus').textContent='Une sauvegarde existe. Clique sur Reprendre l’enquête.'}catch(e){}