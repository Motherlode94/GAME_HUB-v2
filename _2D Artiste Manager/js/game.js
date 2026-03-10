// =============================================================
//  ARTVIBE MANAGER — manager.js
// =============================================================

// ── DATA ─────────────────────────────────────────────────────

const ARTIST_TEMPLATES = [
  // MUSICIENS
  { name:'Lucas Morel',    type:'musician',     emoji:'🎸', skills:['Guitare','Rock','Composition'], desc:'Guitariste indie avec une âme de rebelle. Fort potentiel scénique.', baseFame:30, baseTalent:72, baseCharisma:65, weeklyFee:2200 },
  { name:'Sofia Ren',      type:'musician',     emoji:'🎹', skills:['Piano','Jazz','Arrangements'], desc:'Pianiste de jazz classique reconvertie au néo-soul. Doigts magiques.', baseFame:45, baseTalent:88, baseCharisma:70, weeklyFee:2800 },
  { name:'Marcus DJ',      type:'musician',     emoji:'🎧', skills:['Électro','Mix','Production'], desc:'DJ électro techno, scènes underground de Paris. Flow imparable.', baseFame:55, baseTalent:80, baseCharisma:90, weeklyFee:3200 },
  { name:'Amara Diallo',   type:'musician',     emoji:'🎤', skills:['Chant','R&B','Écriture'], desc:'Voix soul à couper le souffle. Auteure-compositrice depuis 16 ans.', baseFame:62, baseTalent:92, baseCharisma:85, weeklyFee:3600 },
  { name:'Théo Blanchard', type:'musician',     emoji:'🥁', skills:['Batterie','Jazz','Fusion'], desc:'Batteur de jazz-fusion, percussionniste hors pair.', baseFame:28, baseTalent:78, baseCharisma:55, weeklyFee:1900 },
  // PEINTRES
  { name:'Iris Fontaine',  type:'painter',      emoji:'🎨', skills:['Abstrait','Huile','Galeries'], desc:'Peintre abstraite, expositions dans 12 pays. Style reconnaissable entre mille.', baseFame:50, baseTalent:85, baseCharisma:60, weeklyFee:2400 },
  { name:'Kenzo Takagi',   type:'painter',      emoji:'🖌️', skills:['Manga','Numérique','Illustration'], desc:'Illustrateur manga-pop, millions de followers sur Instagram.', baseFame:75, baseTalent:82, baseCharisma:88, weeklyFee:3000 },
  { name:'Elena Voss',     type:'painter',      emoji:'🖼️', skills:['Réalisme','Portrait','Commandes'], desc:'Portraitiste réaliste de renom. Sa liste d\'attente dépasse 2 ans.', baseFame:68, baseTalent:95, baseCharisma:55, weeklyFee:4000 },
  { name:'Omar Benali',    type:'painter',      emoji:'✏️', skills:['Street Art','Fresque','Urbain'], desc:'Street artist engagé, fresques monumentales dans 8 villes.', baseFame:58, baseTalent:83, baseCharisma:78, weeklyFee:2700 },
  // COMÉDIENS
  { name:'Clara Dupont',   type:'comedian',     emoji:'🎭', skills:['Théâtre','Impro','Comédie'], desc:'Comédienne de théâtre avec deux Molières. Impro légendaire.', baseFame:70, baseTalent:88, baseCharisma:95, weeklyFee:3800 },
  { name:'Antoine Lebrun', type:'comedian',     emoji:'🎬', skills:['Cinéma','Drame','Doublage'], desc:'Acteur de cinéma indépendant, César du meilleur second rôle.', baseFame:65, baseTalent:90, baseCharisma:82, weeklyFee:4200 },
  { name:'Naomi Séga',     type:'comedian',     emoji:'🎪', skills:['Stand-up','Humour','Écriture'], desc:'Humoriste stand-up, sa tournée affiche complet en 48h.', baseFame:80, baseTalent:86, baseCharisma:98, weeklyFee:4500 },
  { name:'Paul Micha',     type:'comedian',     emoji:'🎥', skills:['Réalisation','Scénario','Court-métrage'], desc:'Réalisateur-acteur polyvalent, Palme d\'Or Cannes jeunes talents.', baseFame:42, baseTalent:91, baseCharisma:72, weeklyFee:3000 },
  // PHOTOGRAPHES
  { name:'Jade Li',        type:'photographer', emoji:'📷', skills:['Mode','Studio','Édito'], desc:'Photographe mode-édito, travaille pour Vogue et L\'Officiel.', baseFame:72, baseTalent:87, baseCharisma:80, weeklyFee:3400 },
  { name:'Mateo Cruz',     type:'photographer', emoji:'📸', skills:['Reportage','Guerre','Prix'], desc:'Photoreporter primé World Press Photo. Visions qui changent le monde.', baseFame:55, baseTalent:93, baseCharisma:68, weeklyFee:2900 },
  { name:'Léa Martin',     type:'photographer', emoji:'🌿', skills:['Nature','Voyage','Livre'], desc:'Photographe naturaliste, auteure de 6 livres à succès international.', baseFame:48, baseTalent:84, baseCharisma:65, weeklyFee:2500 },
  // POÈTES
  { name:'Ibrahim Sow',    type:'poet',         emoji:'✍️', skills:['Slam','Scène','Spoken Word'], desc:'Slameur engagé, champion de France de slam 3 fois consécutif.', baseFame:40, baseTalent:89, baseCharisma:92, weeklyFee:1800 },
  { name:'Lucie Arnaud',   type:'poet',         emoji:'📖', skills:['Poésie','Édition','Prix'], desc:'Poétesse éditée chez Gallimard. Prix Renaudot poésie.', baseFame:38, baseTalent:94, baseCharisma:62, weeklyFee:1600 },
  { name:'Alex Noir',      type:'poet',         emoji:'🌑', skills:['Dark Poetry','Musique','Performance'], desc:'Poète de l\'ombre, fusions poésie-musique électronique.', baseFame:32, baseTalent:81, baseCharisma:75, weeklyFee:1400 },
];

const PROJECT_TYPES = [
  { id:'album',    name:'Album Studio',       icon:'💿', duration:4, reward:18000, repGain:15, types:['musician'],  minArtists:1, maxArtists:3, costMult:1.2 },
  { id:'exhibit',  name:'Exposition',         icon:'🖼️', duration:3, reward:12000, repGain:12, types:['painter','photographer'], minArtists:1, maxArtists:2, costMult:1.0 },
  { id:'show',     name:'Spectacle Live',     icon:'🎭', duration:2, reward:14000, repGain:18, types:['comedian','musician'],    minArtists:1, maxArtists:4, costMult:1.1 },
  { id:'tour',     name:'Tournée Nationale',  icon:'🚌', duration:6, reward:35000, repGain:30, types:['musician','comedian'],    minArtists:1, maxArtists:5, costMult:1.5 },
  { id:'collab',   name:'Collaboration Art',  icon:'🤝', duration:3, reward:20000, repGain:20, types:['painter','photographer','poet'], minArtists:2, maxArtists:4, costMult:1.3 },
  { id:'film',     name:'Court-Métrage',      icon:'🎬', duration:5, reward:28000, repGain:25, types:['comedian','photographer'], minArtists:1, maxArtists:3, costMult:1.4 },
  { id:'book',     name:'Publication',        icon:'📚', duration:4, reward:10000, repGain:10, types:['poet','painter'],          minArtists:1, maxArtists:2, costMult:0.9 },
  { id:'single',   name:'Single / Clip',      icon:'🎵', duration:2, reward:8000,  repGain:8,  types:['musician'],                minArtists:1, maxArtists:2, costMult:0.8 },
];

const EVENTS_POOL = [
  { name:'Festival Musiques du Monde', icon:'🌍', desc:'Festival international accueillant 50 000 spectateurs. Exposition planétaire garantie.', reward:12000, repGain:25, fameGain:20, risk:'medium', types:['musician'] },
  { name:'Art Basel Paris',            icon:'🎨', desc:'La foire d\'art contemporain la plus influente d\'Europe.', reward:15000, repGain:30, fameGain:18, risk:'high', types:['painter','photographer'] },
  { name:'Festival Humour Montreux',   icon:'😂', desc:'Référence mondiale du stand-up et de la comédie.', reward:10000, repGain:22, fameGain:22, risk:'medium', types:['comedian'] },
  { name:'Soirée Gala Prestige',       icon:'🥂', desc:'Gala de charité avec célébrités et mécènes. Réseau en or.', reward:8000, repGain:18, fameGain:12, risk:'low', types:['musician','comedian','poet'] },
  { name:'Slam Battle Nationale',      icon:'🎤', desc:'Compétition de slam diffusée sur France Ô.', reward:5000, repGain:15, fameGain:25, risk:'low', types:['poet'] },
  { name:'Défilé Fashion Week',        icon:'👗', desc:'Paris Fashion Week — collaborations exclusives.', reward:20000, repGain:20, fameGain:15, risk:'high', types:['photographer','painter'] },
  { name:'Concert Stade de France',    icon:'🏟️', desc:'Affiche 80 000 places sold out. Prestation télévisée.', reward:40000, repGain:45, fameGain:40, risk:'high', types:['musician'] },
  { name:'Résidence Artistique NYC',   icon:'🗽', desc:'3 semaines de résidence à New York. Ouverture internationale.', reward:18000, repGain:28, fameGain:30, risk:'medium', types:['painter','photographer','poet'] },
  { name:'TEDx Talk',                  icon:'💡', desc:'Conférence inspirante diffusée en ligne. Viral potential.', reward:6000, repGain:20, fameGain:15, risk:'low', types:['comedian','poet','musician'] },
  { name:'Pub TV Nationale',           icon:'📺', desc:'Spot publicitaire pour une marque premium. Visibilité max.', reward:25000, repGain:10, fameGain:35, risk:'medium', types:['musician','comedian','painter'] },
];

const REP_TIERS = [
  { min:0,   label:'Inconnue',      color:'#6b7280' },
  { min:20,  label:'Émergente',     color:'#60a5fa' },
  { min:40,  label:'Reconnue',      color:'#a855f7' },
  { min:60,  label:'Influente',     color:'#f97316' },
  { min:80,  label:'Légendaire',    color:'#f5c842' },
  { min:95,  label:'Iconique 🌟',   color:'#ffd700' },
];

const TYPE_COLORS = { musician:'#4fa3e0', painter:'#a855f7', comedian:'#f97316', photographer:'#22c55e', poet:'#f5c842' };
const TYPE_LABELS = { musician:'Musicien', painter:'Peintre', comedian:'Comédien', photographer:'Photographe', poet:'Poète' };

// ── STATE ─────────────────────────────────────────────────────
let G = {};

function initState() {
  G = {
    week: 1,
    money: 50000,
    reputation: 10,
    artists: [],     // owned artists
    projects: [],    // { id, type, name, artists[], weeksLeft, totalWeeks, reward, repGain }
    doneProjects: [],
    market: [],
    events: [],
    weekRevenue: 0,
    weekExpenses: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    artFilter: 'all',
    newProject: { type:null, artists:[] },
    weeklyLog: [],
    agencyName: 'ArtVibe Agency',
  };
  refreshMarket();
  refreshEvents();
}

// ── HELPERS ──────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2,9); }
function rand(min, max) { return Math.floor(Math.random()*(max-min+1))+min; }
function clamp(v,a,b) { return Math.max(a,Math.min(b,v)); }

function getRepTier(rep) {
  for(let i=REP_TIERS.length-1;i>=0;i--)
    if(rep >= REP_TIERS[i].min) return REP_TIERS[i];
  return REP_TIERS[0];
}

function toast(msg, color='#e2e8f0') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.style.borderColor = color;
  el.style.color = color;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(()=>el.classList.remove('show'), 2600);
}

function addNews(msg) {
  G.weeklyLog.push(msg);
  const feed = document.getElementById('news-feed');
  if(!feed) return;
  const div = document.createElement('div');
  div.className = 'news-item';
  div.textContent = msg;
  feed.insertBefore(div, feed.firstChild);
  while(feed.children.length > 20) feed.removeChild(feed.lastChild);
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ── TABS ─────────────────────────────────────────────────────
function openTab(name) {
  document.querySelectorAll('.tab-pane').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.btn-tab').forEach(b=>b.classList.remove('active'));
  document.getElementById('pane-'+name).classList.add('active');
  document.getElementById('tab-'+name).classList.add('active');
  // render correct tab
  if(name==='roster')    renderRoster();
  if(name==='projects')  renderProjects();
  if(name==='market')    renderMarket();
  if(name==='events')    renderEvents();
  if(name==='dashboard') renderDashboard();
}

// ── MARKET ───────────────────────────────────────────────────
function refreshMarket() {
  const pool = [...ARTIST_TEMPLATES];
  // shuffle
  for(let i=pool.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [pool[i],pool[j]]=[pool[j],pool[i]]; }
  G.market = pool.slice(0,8).map(t=>({
    ...JSON.parse(JSON.stringify(t)),
    id: uid(),
    talent:   clamp(t.baseTalent   + rand(-8,8), 30, 100),
    fame:     clamp(t.baseFame     + rand(-10,10), 10, 100),
    charisma: clamp(t.baseCharisma + rand(-8,8), 20, 100),
    fee:      Math.round((t.weeklyFee + rand(-400,400))/100)*100,
    mood: 100, energy:100, projects:[], history:[]
  }));
}

function refreshEvents() {
  const pool = [...EVENTS_POOL];
  for(let i=pool.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [pool[i],pool[j]]=[pool[j],pool[i]]; }
  G.events = pool.slice(0, 6).map(e=>({...e, id:uid(), used:false}));
}

function recruitArtist(marketId) {
  const idx = G.market.findIndex(a=>a.id===marketId);
  if(idx===-1) return;
  const art = G.market[idx];
  const contractCost = art.fee * 4; // 4 semaines d'avance
  if(G.money < contractCost){ toast('❌ Fonds insuffisants !', '#ef4444'); return; }
  G.money -= contractCost;
  G.weekExpenses += contractCost;
  G.artists.push({...art});
  G.market.splice(idx,1);
  addNews(`✅ ${art.emoji} ${art.name} (${TYPE_LABELS[art.type]}) recruté(e) ! Contrat: ${contractCost.toLocaleString()}€`);
  toast(`🎉 ${art.name} rejoint l'agence !`, TYPE_COLORS[art.type]);
  renderHUD();
  renderMarket();
  renderRoster();
  renderDashboard();
}

// ── EVENTS ───────────────────────────────────────────────────
function participateEvent(evId) {
  const ev = G.events.find(e=>e.id===evId);
  if(!ev || ev.used) return;

  // trouver un artiste du bon type libre
  const candidates = G.artists.filter(a=>
    ev.types.includes(a.type) &&
    !G.projects.some(p=>p.artists.includes(a.id))
  );

  if(candidates.length===0){
    toast('❌ Aucun artiste libre du bon type !', '#ef4444');
    return;
  }

  openEventModal(ev, candidates);
}

function openEventModal(ev, candidates) {
  const modal = document.getElementById('event-modal');
  const content = document.getElementById('event-modal-content');

  let candidateHTML = candidates.map(a=>`
    <button class="pm-artist-btn" onclick="commitEvent('${ev.id}','${a.id}')" style="border-color:${TYPE_COLORS[a.type]}">
      ${a.emoji} ${a.name}<br><span style="font-size:.62rem;opacity:.7">${TYPE_LABELS[a.type]}</span>
    </button>
  `).join('');

  content.innerHTML = `
    <div style="text-align:center;font-size:3rem;margin-bottom:.5rem">${ev.icon}</div>
    <div class="modal-title" style="text-align:center">${ev.name}</div>
    <p style="font-size:.85rem;color:var(--muted);text-align:center;margin-bottom:1rem">${ev.desc}</p>
    <div class="ev-rewards" style="justify-content:center;margin-bottom:1rem">
      <span class="ev-reward" style="color:var(--gold)">💰 +${ev.reward.toLocaleString()}€</span>
      <span class="ev-reward" style="color:var(--purple)">⭐ +${ev.repGain} réputation</span>
      <span class="ev-reward" style="color:var(--blue)">🌟 +${ev.fameGain} notoriété</span>
    </div>
    <div style="font-size:.78rem;margin-bottom:.6rem;opacity:.7">Choisir un artiste :</div>
    <div class="pm-artist-grid">${candidateHTML}</div>
  `;
  modal.classList.add('show');
}

function commitEvent(evId, artistId) {
  const ev = G.events.find(e=>e.id===evId);
  const art = G.artists.find(a=>a.id===artistId);
  if(!ev || !art) return;

  ev.used = true;

  // risque
  const success = Math.random() > (ev.risk==='high'?0.3 : ev.risk==='medium'?0.15 : 0.05);

  if(success) {
    G.money += ev.reward;
    G.weekRevenue += ev.reward;
    G.reputation = Math.min(100, G.reputation + ev.repGain);
    art.fame = Math.min(100, art.fame + ev.fameGain);
    art.history.push(`✅ ${ev.name} — Succès ! +${ev.reward.toLocaleString()}€`);
    addNews(`🎉 ${art.emoji} ${art.name} : succès à "${ev.name}" ! +${ev.reward.toLocaleString()}€ +${ev.repGain} rép.`);
    toast(`🎊 ${art.name} a cartonné à "${ev.name}" !`, '#22c55e');
  } else {
    const penalty = Math.round(ev.reward * 0.3);
    G.money = Math.max(0, G.money - penalty);
    G.reputation = Math.max(0, G.reputation - 5);
    art.history.push(`❌ ${ev.name} — Échec. -${penalty.toLocaleString()}€`);
    addNews(`😬 ${art.emoji} ${art.name} : échec à "${ev.name}". Incident de scène. -${penalty.toLocaleString()}€`);
    toast(`💥 Raté ! ${art.name} a eu des problèmes…`, '#ef4444');
  }

  closeEventModal();
  renderAll();
}

function closeEventModal() { document.getElementById('event-modal').classList.remove('show'); }

// ── PROJECTS ─────────────────────────────────────────────────
let _newProjType = null;
let _newProjArtists = [];

function openNewProjectModal() {
  if(G.artists.length===0){ toast('❌ Recrutez d\'abord des artistes !','#ef4444'); return; }
  _newProjType = null;
  _newProjArtists = [];
  renderNewProjectModal();
  document.getElementById('project-modal').classList.add('show');
}

function renderNewProjectModal() {
  const content = document.getElementById('project-modal-content');

  const typeBtns = PROJECT_TYPES.map(pt=>`
    <button class="pm-type-btn ${_newProjType===pt.id?'active':''}" onclick="selectProjType('${pt.id}')">
      ${pt.icon} ${pt.name}<br>
      <span style="font-size:.65rem;opacity:.7">${pt.duration}sem · +${pt.reward.toLocaleString()}€</span>
    </button>
  `).join('');

  let artistSection = '';
  if(_newProjType) {
    const pt = PROJECT_TYPES.find(p=>p.id===_newProjType);
    const eligible = G.artists.filter(a=>
      pt.types.includes(a.type) &&
      !G.projects.some(p=>p.artists.includes(a.id))
    );
    const artistBtns = eligible.length > 0
      ? eligible.map(a=>`
          <button class="pm-artist-btn ${_newProjArtists.includes(a.id)?'sel':''}"
            onclick="toggleProjArtist('${a.id}')">
            ${a.emoji} ${a.name}<br>
            <span style="font-size:.6rem;color:${TYPE_COLORS[a.type]}">${TYPE_LABELS[a.type]}</span>
          </button>
        `).join('')
      : '<p style="font-size:.8rem;color:var(--muted)">Aucun artiste disponible pour ce type de projet.</p>';

    artistSection = `
      <div class="pm-artist-select">
        <div style="font-size:.72rem;text-transform:uppercase;letter-spacing:.12em;opacity:.55;margin-bottom:.5rem">
          Artistes (${pt.minArtists}–${pt.maxArtists}) — Types: ${pt.types.map(t=>TYPE_LABELS[t]).join(', ')}
        </div>
        <div class="pm-artist-grid">${artistBtns}</div>
      </div>
    `;
  }

  let summarySection = '';
  if(_newProjType && _newProjArtists.length > 0) {
    const pt = PROJECT_TYPES.find(p=>p.id===_newProjType);
    const totalFees = _newProjArtists.reduce((acc,id)=>{
      const a = G.artists.find(x=>x.id===id);
      return acc + (a ? Math.round(a.fee * pt.duration * 0.4) : 0);
    },0);
    const canStart = _newProjArtists.length >= pt.minArtists && _newProjArtists.length <= pt.maxArtists;
    summarySection = `
      <div class="pm-summary">
        <div class="pm-row"><span>Type</span><span>${pt.icon} ${pt.name}</span></div>
        <div class="pm-row"><span>Durée</span><span>${pt.duration} semaines</span></div>
        <div class="pm-row"><span>Artistes</span><span>${_newProjArtists.length}</span></div>
        <div class="pm-row"><span>Frais artistes</span><span style="color:var(--red)">-${totalFees.toLocaleString()}€</span></div>
        <div class="pm-row"><span>Récompense</span><span style="color:var(--green)">+${pt.reward.toLocaleString()}€</span></div>
        <div class="pm-row"><span>+Réputation</span><span style="color:var(--purple)">+${pt.repGain}</span></div>
      </div>
      <button class="btn-cta" style="width:100%" ${canStart?'':'disabled'}
        onclick="startProject()">
        ${canStart?'🚀 Lancer le projet':'Sélectionnez ' + pt.minArtists + ' artiste(s) min'}
      </button>
    `;
  }

  content.innerHTML = `
    <div class="pm-types">${typeBtns}</div>
    ${artistSection}
    ${summarySection}
  `;
}

function selectProjType(id) { _newProjType = id; _newProjArtists = []; renderNewProjectModal(); }

function toggleProjArtist(id) {
  const pt = PROJECT_TYPES.find(p=>p.id===_newProjType);
  if(_newProjArtists.includes(id)){
    _newProjArtists = _newProjArtists.filter(x=>x!==id);
  } else if(_newProjArtists.length < pt.maxArtists) {
    _newProjArtists.push(id);
  } else {
    toast(`Max ${pt.maxArtists} artistes pour ce projet.`,'#f97316');
  }
  renderNewProjectModal();
}

function startProject() {
  const pt = PROJECT_TYPES.find(p=>p.id===_newProjType);
  if(!pt || _newProjArtists.length < pt.minArtists) return;

  const totalFees = _newProjArtists.reduce((acc,id)=>{
    const a = G.artists.find(x=>x.id===id);
    return acc + (a ? Math.round(a.fee * pt.duration * 0.4) : 0);
  },0);

  if(G.money < totalFees){ toast('❌ Fonds insuffisants !','#ef4444'); return; }
  G.money -= totalFees;
  G.weekExpenses += totalFees;

  const artNames = _newProjArtists.map(id=>{ const a=G.artists.find(x=>x.id===id); return a?a.name:'?'; });
  const project = {
    id: uid(),
    typeId: pt.id,
    name: `${pt.icon} ${pt.name}`,
    artists: [..._newProjArtists],
    weeksLeft: pt.duration,
    totalWeeks: pt.duration,
    reward: pt.reward,
    repGain: pt.repGain,
    done: false,
  };
  G.projects.push(project);
  addNews(`🚀 Projet "${pt.name}" lancé avec ${artNames.join(', ')} !`);
  toast(`🎬 "${pt.name}" démarré !`,'#22c55e');
  closeProjectModal();
  renderAll();
}

function closeProjectModal() { document.getElementById('project-modal').classList.remove('show'); }

// ── ARTIST MODAL ─────────────────────────────────────────────
function openArtistModal(artistId) {
  const a = G.artists.find(x=>x.id===artistId);
  if(!a) return;
  const col = TYPE_COLORS[a.type];
  const busyProj = G.projects.filter(p=>p.artists.includes(a.id));

  const histHTML = a.history.length > 0
    ? a.history.map(h=>`<div class="am-hist-item">${h}</div>`).join('')
    : '<div class="am-hist-item" style="opacity:.5">Aucune activité encore</div>';

  const skillsHTML = a.skills.map(s=>`<div class="am-skill">${s}</div>`).join('');

  document.getElementById('artist-modal-content').innerHTML = `
    <div class="am-header">
      <div class="am-avatar">${a.emoji}</div>
      <div>
        <div class="am-name" style="color:${col}">${a.name}</div>
        <div class="am-type" style="color:${col}">${TYPE_LABELS[a.type]}</div>
      </div>
    </div>
    <div class="am-details">
      <div class="am-detail"><div class="am-d-label">Talent</div><div class="am-d-val" style="color:${col}">${a.talent}/100</div></div>
      <div class="am-detail"><div class="am-d-label">Notoriété</div><div class="am-d-val" style="color:var(--gold)">${a.fame}/100</div></div>
      <div class="am-detail"><div class="am-d-label">Charisme</div><div class="am-d-val" style="color:var(--purple)">${a.charisma}/100</div></div>
      <div class="am-detail"><div class="am-d-label">Salaire/sem.</div><div class="am-d-val">${a.fee.toLocaleString()}€</div></div>
    </div>
    <div class="am-skills-title">Compétences</div>
    <div class="am-skills">${skillsHTML}</div>
    <div style="font-size:.82rem;margin-bottom:.5rem;">
      ${busyProj.length > 0
        ? `<span style="color:var(--orange)">🔧 En projet : ${busyProj.map(p=>p.name).join(', ')}</span>`
        : '<span style="color:var(--green)">✅ Disponible</span>'}
    </div>
    <div class="am-skills-title">Historique</div>
    <div class="am-history">${histHTML}</div>
    <div style="display:flex;gap:.6rem;margin-top:.5rem">
      <button class="btn-action blue" onclick="trainArtist('${a.id}')">📚 Former (+talent) -1000€</button>
      <button class="btn-action red"  onclick="fireArtist('${a.id}')">🚪 Renvoyer</button>
    </div>
  `;
  document.getElementById('artist-modal').classList.add('show');
}

function closeArtistModal() { document.getElementById('artist-modal').classList.remove('show'); }

function trainArtist(id) {
  if(G.money < 1000){ toast('❌ 1000€ requis','#ef4444'); return; }
  const a = G.artists.find(x=>x.id===id);
  G.money -= 1000;
  a.talent = Math.min(100, a.talent + rand(3,8));
  a.history.push(`📚 Formation intensive. Talent +${rand(3,8)}`);
  toast(`📚 ${a.name} s'est amélioré(e) !`,'#60a5fa');
  openArtistModal(id);
  renderHUD();
}

function fireArtist(id) {
  const a = G.artists.find(x=>x.id===id);
  if(!a) return;
  if(G.projects.some(p=>p.artists.includes(id))){
    toast('❌ L\'artiste est en projet, finissez d\'abord !','#ef4444');
    return;
  }
  G.artists = G.artists.filter(x=>x.id!==id);
  G.reputation = Math.max(0, G.reputation - 3);
  addNews(`👋 ${a.emoji} ${a.name} a quitté l'agence.`);
  closeArtistModal();
  renderAll();
}

// ── NEXT WEEK ─────────────────────────────────────────────────
function nextWeek() {
  G.weeklyLog = [];
  G.weekRevenue = 0;
  G.weekExpenses = 0;

  // 1. Payer les salaires
  let salaries = 0;
  G.artists.forEach(a=>{ salaries += a.fee; });
  G.money = Math.max(0, G.money - salaries);
  G.weekExpenses += salaries;

  // 2. Avancer les projets
  G.projects.forEach(p=>{
    p.weeksLeft--;
    if(p.weeksLeft <= 0){
      p.done = true;
      G.money += p.reward;
      G.weekRevenue += p.reward;
      G.reputation = Math.min(100, G.reputation + p.repGain);
      // boost notoriété des artistes
      p.artists.forEach(id=>{
        const a = G.artists.find(x=>x.id===id);
        if(a){
          a.fame = Math.min(100, a.fame + rand(5,15));
          a.history.push(`✅ ${p.name} terminé ! +${p.reward.toLocaleString()}€ pour l'agence`);
        }
      });
      addNews(`🎉 Projet "${p.name}" terminé ! +${p.reward.toLocaleString()}€ +${p.repGain} rép.`);
    }
  });
  // Séparer terminés
  const newDone = G.projects.filter(p=>p.done);
  G.doneProjects.push(...newDone);
  G.projects = G.projects.filter(p=>!p.done);

  // 3. Événements aléatoires
  randomWeeklyEvent();

  // 4. Refraîchir marché / events
  if(G.week % 3 === 0) refreshMarket();
  refreshEvents();

  // 5. Bilan finances
  G.totalRevenue  += G.weekRevenue;
  G.totalExpenses += G.weekExpenses + salaries;

  // 6. Semaine suivante
  G.week++;

  // 7. Croissance naturelle réputation
  if(G.artists.length > 0) G.reputation = Math.min(100, G.reputation + 0.5);

  // 8. FIN après 52 semaines (1 an)
  if(G.week > 52){ showEndScreen(); return; }

  // 9. Modal bilan
  showWeeklyModal(salaries);
}

function randomWeeklyEvent() {
  const roll = Math.random();
  if(roll < 0.15 && G.artists.length > 0) {
    const a = G.artists[Math.floor(Math.random()*G.artists.length)];
    const events = [
      { msg:`⭐ ${a.name} est mentionné(e) dans la presse ! +5 notoriété`, fn:()=>{ a.fame=Math.min(100,a.fame+5); G.reputation=Math.min(100,G.reputation+2); } },
      { msg:`🎙️ Interview radio pour ${a.name} ! +3 notoriété`, fn:()=>{ a.fame=Math.min(100,a.fame+3); } },
      { msg:`📱 Viral ! Un post de ${a.name} explose sur les réseaux. +10 notoriété !`, fn:()=>{ a.fame=Math.min(100,a.fame+10); G.reputation=Math.min(100,G.reputation+5); } },
      { msg:`😤 Scandale autour de ${a.name}… -5 réputation`, fn:()=>{ G.reputation=Math.max(0,G.reputation-5); a.fame=Math.max(0,a.fame-3); } },
      { msg:`🏆 ${a.name} remporte un prix artistique ! +15 notoriété +8 rép.`, fn:()=>{ a.fame=Math.min(100,a.fame+15); G.reputation=Math.min(100,G.reputation+8); G.money+=3000; G.weekRevenue+=3000; } },
    ];
    const ev = events[Math.floor(Math.random()*events.length)];
    ev.fn();
    addNews(ev.msg);
  }
  if(roll > 0.9) {
    const bonus = rand(1000,5000);
    G.money += bonus;
    G.weekRevenue += bonus;
    addNews(`💼 Contrat de sponsoring inattendu ! +${bonus.toLocaleString()}€`);
  }
}

function showWeeklyModal(salaries) {
  document.getElementById('wm-week').textContent = G.week - 1;
  const net = G.weekRevenue - G.weekExpenses - salaries;

  let logsHTML = G.weeklyLog.length > 0
    ? G.weeklyLog.map(l=>`<div class="wm-item"><span>${l}</span></div>`).join('')
    : '<div class="wm-item"><span style="opacity:.5">Semaine calme.</span></div>';

  document.getElementById('weekly-content').innerHTML = `
    <div class="wm-section">
      <div class="wm-title">📋 Événements</div>
      ${logsHTML}
    </div>
    <div class="wm-section">
      <div class="wm-title">💰 Finances</div>
      <div class="wm-item"><span>Revenus projets / events</span><span style="color:var(--green)">+${G.weekRevenue.toLocaleString()}€</span></div>
      <div class="wm-item"><span>Salaires (${G.artists.length} artistes)</span><span style="color:var(--red)">-${salaries.toLocaleString()}€</span></div>
      <div class="wm-item"><span>Frais projets</span><span style="color:var(--red)">-${G.weekExpenses.toLocaleString()}€</span></div>
      <div class="wm-total"><span>Bilan net</span><span style="color:${net>=0?'var(--green)':'var(--red)'}">${net>=0?'+':''}${net.toLocaleString()}€</span></div>
    </div>
    <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap">
      <div style="text-align:center">
        <div style="font-size:1.2rem;font-weight:800;color:var(--gold)">${G.money.toLocaleString()}€</div>
        <div style="font-size:.65rem;opacity:.55">TRÉSORERIE</div>
      </div>
      <div style="text-align:center">
        <div style="font-size:1.2rem;font-weight:800;color:var(--purple)">${G.reputation.toFixed(0)}</div>
        <div style="font-size:.65rem;opacity:.55">RÉPUTATION</div>
      </div>
      <div style="text-align:center">
        <div style="font-size:1.2rem;font-weight:800;color:var(--blue)">${G.artists.length}</div>
        <div style="font-size:.65rem;opacity:.55">ARTISTES</div>
      </div>
    </div>
  `;
  document.getElementById('weekly-modal').classList.add('show');
}

function closeWeeklyModal() {
  document.getElementById('weekly-modal').classList.remove('show');
  renderAll();
}

// ── RENDER ────────────────────────────────────────────────────
function renderHUD() {
  document.getElementById('stat-money').textContent   = G.money.toLocaleString();
  document.getElementById('stat-week').textContent    = G.week;
  document.getElementById('stat-rep').textContent     = G.reputation.toFixed(0);
  document.getElementById('stat-artists').textContent = G.artists.length;
}

function renderDashboard() {
  // Finances
  const fg = document.getElementById('finance-grid');
  if(!fg) return;
  const weeklyFees = G.artists.reduce((a,b)=>a+b.fee,0);
  fg.innerHTML = `
    <div class="finance-item"><div class="finance-label">Trésorerie</div><div class="finance-val" style="color:var(--gold)">${G.money.toLocaleString()}€</div></div>
    <div class="finance-item"><div class="finance-label">Charges /sem.</div><div class="finance-val" style="color:var(--red)">${weeklyFees.toLocaleString()}€</div></div>
    <div class="finance-item"><div class="finance-label">Revenus totaux</div><div class="finance-val" style="color:var(--green)">${G.totalRevenue.toLocaleString()}€</div></div>
    <div class="finance-item"><div class="finance-label">Projets actifs</div><div class="finance-val">${G.projects.length}</div></div>
  `;

  // Top artistes
  const sorted = [...G.artists].sort((a,b)=>b.fame-a.fame).slice(0,5);
  document.getElementById('top-artists-list').innerHTML = sorted.length > 0
    ? sorted.map((a,i)=>`
        <div class="top-artist-row">
          <span class="ta-rank">#${i+1}</span>
          <span>${a.emoji}</span>
          <span class="ta-name">${a.name}</span>
          <span class="ta-fame">⭐${a.fame}</span>
        </div>
      `).join('')
    : '<div style="font-size:.8rem;color:var(--muted);padding:.5rem">Aucun artiste</div>';

  // Projets actifs
  const apd = document.getElementById('active-projects-dash');
  apd.innerHTML = G.projects.length > 0
    ? G.projects.map(p=>{
        const pct = Math.round(((p.totalWeeks-p.weeksLeft)/p.totalWeeks)*100);
        return `
          <div style="margin-bottom:.6rem">
            <div style="display:flex;justify-content:space-between;font-size:.8rem;margin-bottom:.3rem">
              <span>${p.name}</span><span style="color:var(--muted)">${p.weeksLeft}sem.</span>
            </div>
            <div class="pc-bar"><div class="pc-fill" style="width:${pct}%"></div></div>
          </div>`;
      }).join('')
    : '<div style="font-size:.8rem;color:var(--muted)">Aucun projet en cours</div>';

  // Réputation
  const tier = getRepTier(G.reputation);
  const repFill = document.getElementById('rep-fill');
  if(repFill) repFill.style.width = G.reputation+'%';
  const repLabel = document.getElementById('rep-label');
  if(repLabel){ repLabel.textContent = tier.label; repLabel.style.color = tier.color; }
}

function renderRoster() {
  const grid = document.getElementById('artists-grid');
  const empty = document.getElementById('empty-roster');
  const filtered = G.artFilter==='all' ? G.artists : G.artists.filter(a=>a.type===G.artFilter);

  if(G.artists.length===0){ grid.style.display='none'; empty.style.display='block'; return; }
  grid.style.display='grid'; empty.style.display='none';

  grid.innerHTML = filtered.map(a=>{
    const col  = TYPE_COLORS[a.type];
    const busy = G.projects.some(p=>p.artists.includes(a.id));
    const bars = [
      {label:'Talent',  val:a.talent,   color:col },
      {label:'Notoriété',val:a.fame,    color:'var(--gold)'},
      {label:'Charisme', val:a.charisma,color:'var(--purple)'},
    ];
    return `
      <div class="artist-card ${a.type}" onclick="openArtistModal('${a.id}')">
        <div class="card-badge ${busy?'badge-busy':'badge-free'}">${busy?'EN PROJET':'LIBRE'}</div>
        <div class="ac-avatar">${a.emoji}</div>
        <div class="ac-name">${a.name}</div>
        <div class="ac-type" style="color:${col}">${TYPE_LABELS[a.type]}</div>
        <div class="ac-stats">
          <div class="ac-stat"><div class="ac-stat-label">Talent</div><div class="ac-stat-val" style="color:${col}">${a.talent}</div></div>
          <div class="ac-stat"><div class="ac-stat-label">Notoriété</div><div class="ac-stat-val" style="color:var(--gold)">${a.fame}</div></div>
        </div>
        <div class="ac-bars">
          ${bars.map(b=>`
            <div class="ac-bar-row">
              <span class="ac-bar-label">${b.label}</span>
              <div class="ac-bar-track"><div class="ac-bar-fill" style="width:${b.val}%;background:${b.color}"></div></div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
}

function filterArtists(type) {
  G.artFilter = type;
  document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
  event.target.classList.add('active');
  renderRoster();
}

function renderProjects() {
  const active = document.getElementById('proj-active');
  const done   = document.getElementById('proj-done');

  active.innerHTML = G.projects.length > 0
    ? G.projects.map(p=>{
        const pct = Math.round(((p.totalWeeks-p.weeksLeft)/p.totalWeeks)*100);
        const artistNames = p.artists.map(id=>{ const a=G.artists.find(x=>x.id===id); return a?`${a.emoji}${a.name}`:'?'; }).join(', ');
        return `
          <div class="project-card">
            <div class="pc-header"><span class="pc-name">${p.name}</span></div>
            <div class="pc-bar"><div class="pc-fill" style="width:${pct}%"></div></div>
            <div class="pc-meta"><span>${p.weeksLeft} sem. restantes</span><span class="pc-reward">+${p.reward.toLocaleString()}€</span></div>
            <div class="pc-artists">👥 ${artistNames}</div>
          </div>
        `;
      }).join('')
    : '<div class="empty-state">Aucun projet actif.<br>Lancez-en un !</div>';

  done.innerHTML = G.doneProjects.slice(-10).reverse().map(p=>
    `<div class="project-card"><div class="pc-header"><span class="pc-name">${p.name}</span><span class="pc-done">✅ Terminé</span></div><div style="font-size:.75rem;color:var(--muted)">+${p.reward.toLocaleString()}€ · +${p.repGain} rép.</div></div>`
  ).join('') || '<div class="empty-state">Aucun projet terminé</div>';
}

function renderMarket() {
  const grid = document.getElementById('market-grid');
  if(!grid) return;
  grid.innerHTML = G.market.map(a=>{
    const col  = TYPE_COLORS[a.type];
    const contractCost = a.fee * 4;
    const canRecruit = G.money >= contractCost;
    return `
      <div class="market-card ${a.type}">
        <div class="mc-top">
          <div class="mc-avatar">${a.emoji}</div>
          <div class="mc-info">
            <div class="mc-name">${a.name}</div>
            <div class="mc-type" style="color:${col}">${TYPE_LABELS[a.type]}</div>
            <div class="mc-fee">💰 ${a.fee.toLocaleString()}€/sem.</div>
          </div>
        </div>
        <div class="mc-skills">${a.skills.map(s=>`<span class="skill-tag">${s}</span>`).join('')}</div>
        <div class="mc-desc">${a.desc}</div>
        <div style="font-size:.75rem;color:var(--muted);margin-bottom:.4rem">
          ⭐ Talent: ${a.talent} · 🌟 Notoriété: ${a.fame} · 💫 Charisme: ${a.charisma}
        </div>
        <div style="font-size:.72rem;color:var(--muted);margin-bottom:.4rem">
          Contrat (4 sem.) : <strong style="color:${canRecruit?'var(--gold)':'var(--red)'}">${contractCost.toLocaleString()}€</strong>
        </div>
        <button class="btn-recruit" ${canRecruit?'':'disabled'} onclick="recruitArtist('${a.id}')">
          ${canRecruit?`🤝 Recruter — ${contractCost.toLocaleString()}€`:'❌ Fonds insuffisants'}
        </button>
      </div>
    `;
  }).join('') || '<div class="empty-state">Marché vide. Actualisez !</div>';
}

function renderEvents() {
  const grid = document.getElementById('events-grid');
  if(!grid) return;
  grid.innerHTML = G.events.map(ev=>{
    const eligible = G.artists.filter(a=>
      ev.types.includes(a.type) && !G.projects.some(p=>p.artists.includes(a.id))
    );
    const canParticipate = eligible.length > 0 && !ev.used;
    return `
      <div class="event-card">
        <div class="ev-header">
          <span class="ev-icon">${ev.icon}</span>
          <span class="ev-badge ${ev.risk}">${ev.risk==='high'?'Risqué':ev.risk==='medium'?'Modéré':'Sûr'}</span>
        </div>
        <div class="ev-name">${ev.name}</div>
        <div class="ev-desc">${ev.desc}</div>
        <div class="ev-rewards">
          <span class="ev-reward" style="color:var(--gold)">💰 ${ev.reward.toLocaleString()}€</span>
          <span class="ev-reward" style="color:var(--purple)">⭐ +${ev.repGain} rép.</span>
          <span class="ev-reward" style="color:var(--blue)">🌟 +${ev.fameGain} notoriété</span>
        </div>
        <div class="ev-types">Types : ${ev.types.map(t=>TYPE_LABELS[t]).join(', ')}</div>
        <button class="btn-participate" ${canParticipate?'':'disabled'} onclick="participateEvent('${ev.id}')">
          ${ev.used?'✅ Déjà participé':canParticipate?'🎤 Participer':'❌ Aucun artiste libre'}
        </button>
      </div>
    `;
  }).join('');
}

function renderAll() {
  renderHUD();
  renderDashboard();
  const activePane = document.querySelector('.tab-pane.active');
  if(activePane){
    const id = activePane.id.replace('pane-','');
    if(id==='roster')   renderRoster();
    if(id==='projects') renderProjects();
    if(id==='market')   renderMarket();
    if(id==='events')   renderEvents();
  }
}

// ── END ───────────────────────────────────────────────────────
function showEndScreen() {
  const sub = document.getElementById('end-sub');
  const rep = G.reputation;
  const tier = getRepTier(rep);
  sub.innerHTML = `Après 1 an, votre agence a atteint le statut : <strong style="color:${tier.color}">${tier.label}</strong>`;

  document.getElementById('end-stats').innerHTML = `
    <div class="end-stat"><div class="end-stat-val">${G.money.toLocaleString()}€</div><div class="end-stat-label">Trésorerie</div></div>
    <div class="end-stat"><div class="end-stat-val">${rep.toFixed(0)}</div><div class="end-stat-label">Réputation</div></div>
    <div class="end-stat"><div class="end-stat-val">${G.artists.length}</div><div class="end-stat-label">Artistes</div></div>
    <div class="end-stat"><div class="end-stat-val">${G.doneProjects.length}</div><div class="end-stat-label">Projets terminés</div></div>
    <div class="end-stat"><div class="end-stat-val">${G.totalRevenue.toLocaleString()}€</div><div class="end-stat-label">Revenus totaux</div></div>
  `;

  document.getElementById('end-artists').innerHTML = G.artists.map(a=>
    `<div class="end-artist-chip">${a.emoji} ${a.name} — ⭐${a.fame}</div>`
  ).join('');

  showScreen('end-screen');
}

// ── START / RESTART ──────────────────────────────────────────
function startGame() {
  initState();
  showScreen('main-screen');
  openTab('dashboard');
  renderAll();
}

function restartGame() {
  initState();
  showScreen('title-screen');
}

// ── TITLE CARDS ──────────────────────────────────────────────
function renderTitleCards() {
  const cont = document.getElementById('title-cards');
  const types = [
    {emoji:'🎵',label:'Musicien'},{emoji:'🎨',label:'Peintre'},
    {emoji:'🎭',label:'Comédien'},{emoji:'📷',label:'Photographe'},{emoji:'✍️',label:'Poète'}
  ];
  cont.innerHTML = types.map(t=>`
    <div class="title-card">
      <div>${t.emoji}</div>
      <div class="title-card-label">${t.label}</div>
    </div>
  `).join('');
}

// ── INIT ─────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', ()=>{
  renderTitleCards();
});