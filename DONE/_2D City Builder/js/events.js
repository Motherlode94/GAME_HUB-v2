// ═══════════════════════════════════════════════════════
//  CITY BUILDER — Events, Weather & New Buildings Module
//  À inclure APRÈS script.js dans index.html
// ═══════════════════════════════════════════════════════

// Note: les nouveaux bâtiments (hospital, stadium, etc.) sont désormais
// définis directement dans script.js — plus besoin de les fusionner ici.

// ── WEATHER SYSTEM ──
const WEATHERS = {
  clear:    { label: 'Ensoleillé',  icon: '☀️',  incomeBonus: 1.1,  happyBonus: 5,  solarBonus: 2.0, windBonus: 0.5, buildBlock: false },
  cloudy:   { label: 'Nuageux',     icon: '☁️',  incomeBonus: 1.0,  happyBonus: 0,  solarBonus: 0.5, windBonus: 1.2, buildBlock: false },
  rain:     { label: 'Pluie',       icon: '🌧️',  incomeBonus: 0.85, happyBonus: -5, solarBonus: 0.1, windBonus: 1.5, buildBlock: false },
  storm:    { label: 'Tempête',     icon: '⛈️',  incomeBonus: 0.7,  happyBonus: -12, solarBonus: 0.0, windBonus: 0.5, buildBlock: true  },
  snow:     { label: 'Neige',       icon: '❄️',  incomeBonus: 0.75, happyBonus: -3, solarBonus: 0.3, windBonus: 0.8, buildBlock: true  },
  heatwave: { label: 'Canicule',    icon: '🔥',  incomeBonus: 0.9,  happyBonus: -8, solarBonus: 2.5, windBonus: 0.2, buildBlock: false },
  fog:      { label: 'Brouillard',  icon: '🌫️',  incomeBonus: 0.95, happyBonus: -2, solarBonus: 0.2, windBonus: 0.3, buildBlock: false },
  windy:    { label: 'Venteux',     icon: '🌬️',  incomeBonus: 1.0,  happyBonus: 0,  solarBonus: 0.7, windBonus: 2.5, buildBlock: false },
};

// SEASONS
const SEASONS = {
  spring: { label: 'Printemps', icon: '🌸', weatherWeights: { clear:30, cloudy:25, rain:30, storm:10, fog:5 } },
  summer: { label: 'Été',       icon: '🌻', weatherWeights: { clear:40, cloudy:20, rain:10, storm:10, heatwave:15, windy:5 } },
  autumn: { label: 'Automne',   icon: '🍂', weatherWeights: { clear:20, cloudy:30, rain:30, storm:10, fog:10 } },
  winter: { label: 'Hiver',     icon: '❄️', weatherWeights: { cloudy:30, snow:35, rain:15, fog:10, storm:10 } },
};

// ── RANDOM EVENTS ──
const EVENTS = [
  // ─ INCENDIE ─ nécessite des bâtiments résidentiels/commerciaux
  {
    id: 'fire',
    title: '🔥 Incendie',
    desc: 'Un violent incendie se déclare dans le quartier résidentiel !',
    type: 'bad',
    condition: () => (countBuildingType('house') + countBuildingType('shop') + countBuildingType('office')) >= 2,
    effect: () => {
      const hasFireStation = countBuildingType('fire') > 0;
      if (hasFireStation) {
        budget = Math.max(0, budget - 200);
        notify('🚒 Pompiers sur place ! Dégâts minimisés (−200$)', 'info');
      } else {
        budget = Math.max(0, budget - 700);
        satisfaction = Math.max(0, satisfaction - 15);
        demolishRandom();
        notify('🔥 Incendie non maîtrisé ! Bâtiment détruit ! Construisez des pompiers !', 'error');
      }
    },
    choices: [
      { label: 'Appeler des renforts (−300$)', cost: 300, effect: () => { budget -= 300; satisfaction = Math.min(100, satisfaction + 5); notify('🚒 Renforts déployés, dégâts limités !', 'info'); } },
      { label: 'Évacuer les riverains', cost: 0, effect: () => {} }
    ]
  },

  // ─ ÉPIDÉMIE ─ nécessite une population
  {
    id: 'epidemic',
    title: '🦠 Épidémie',
    desc: 'Une maladie se propage parmi vos habitants. Les hôpitaux sont sous pression.',
    type: 'bad',
    condition: () => population >= 20,
    effect: () => {
      const hasHospital = countBuildingType('hospital') > 0;
      if (hasHospital) {
        satisfaction = Math.max(0, satisfaction - 5);
        notify('🦠 Épidémie contenue grâce à l'hôpital ! (−5 satisfaction)', 'info');
      } else {
        satisfaction = Math.max(0, satisfaction - 25);
        const perdu = randInt(5, Math.max(6, Math.floor(population * 0.1)));
        population = Math.max(0, population - perdu);
        notify(`🦠 Épidémie ! −${perdu} habitants · −25 satisfaction. Construisez un hôpital !`, 'error');
      }
    },
    choices: [
      { label: 'Campagne de vaccination (−400$)', cost: 400, effect: () => { budget -= 400; satisfaction = Math.min(100, satisfaction + 8); notify('💉 Vaccination réussie !', 'success'); } },
      { label: 'Quarantaine stricte', cost: 0, effect: () => { satisfaction = Math.max(0, satisfaction - 5); notify('🔒 Quarantaine en place. Économie ralentie.', 'info'); } }
    ]
  },

  // ─ TREMBLEMENT DE TERRE ─ nécessite plusieurs bâtiments
  {
    id: 'earthquake',
    title: '🌍 Tremblement de Terre',
    desc: 'Un séisme secoue la ville ! Des structures sont endommagées.',
    type: 'bad',
    condition: () => countType() >= 8,
    effect: () => {
      const dmg = Math.min(budget, 400 + res.buildings * 30);
      budget = Math.max(0, budget - dmg);
      satisfaction = Math.max(0, satisfaction - 18);
      population = Math.max(0, population - randInt(2, 10));
      notify(`🌍 Séisme ! −${dmg}$ · −18 satisfaction · habitants fuis`, 'error');
    },
    choices: [
      { label: 'Cellule de crise (−500$)', cost: 500, effect: () => { budget -= 500; satisfaction = Math.min(100, satisfaction + 12); notify('🚑 Aide d'urgence déployée !', 'info'); } },
      { label: 'Reconstruire seul', cost: 0, effect: () => {} }
    ]
  },

  // ─ FESTIVAL ─ nécessite un parc ou commerce
  {
    id: 'festival',
    title: '🎪 Festival de la Ville',
    desc: 'Les habitants organisent un grand festival ! Les commerces font le plein.',
    type: 'good',
    condition: () => (countBuildingType('park') + countBuildingType('shop') + countBuildingType('market')) >= 1,
    effect: () => {
      const bonus = 300 + countBuildingType('shop') * 80 + countBuildingType('market') * 120;
      budget += bonus;
      satisfaction = Math.min(100, satisfaction + 8);
      notify(`🎪 Festival ! +${bonus}$ · +8 satisfaction`, 'success');
    },
    choices: [
      { label: 'Financer les animations (−200$)', cost: 200, effect: () => { budget -= 200; satisfaction = Math.min(100, satisfaction + 12); notify('🎡 Super festival ! Toute la ville en fête !', 'success'); } },
      { label: 'Laisser faire', cost: 0, effect: () => {} }
    ]
  },

  // ─ BOOM ÉCONOMIQUE ─ nécessite bureaux/commerces
  {
    id: 'boom',
    title: '📈 Boom Économique',
    desc: 'La région connaît une croissance exceptionnelle ! Les investisseurs affluent.',
    type: 'good',
    condition: () => (countBuildingType('office') + countBuildingType('shop')) >= 2,
    effect: () => {
      const bonus = 800 + countBuildingType('office') * 150 + countBuildingType('shop') * 100;
      budget += bonus;
      population += randInt(5, 20);
      notify(`📈 Boom ! +${bonus}$ · afflux de nouveaux habitants !`, 'success');
    },
    choices: [
      { label: 'Investir dans l'infrastructure (−600$)', cost: 600, effect: () => { budget -= 600; satisfaction = Math.min(100, satisfaction + 12); notify('🏗️ Infrastructure renforcée ! Croissance durable.', 'success'); } },
      { label: 'Encaisser les bénéfices', cost: 0, effect: () => {} }
    ]
  },

  // ─ GRÈVE ─ nécessite usines/bureaux et population
  {
    id: 'strike',
    title: '✊ Grève Générale',
    desc: 'Les travailleurs des usines et bureaux réclament de meilleures conditions.',
    type: 'bad',
    condition: () => (countBuildingType('factory') + countBuildingType('office')) >= 1 && population >= 15,
    effect: () => {
      const pertes = (countBuildingType('factory') + countBuildingType('office')) * 120;
      budget = Math.max(0, budget - pertes);
      satisfaction = Math.max(0, satisfaction - 12);
      notify(`✊ Grève ! −${pertes}$ de pertes · −12 satisfaction`, 'error');
    },
    choices: [
      { label: 'Négocier (−600$)', cost: 600, effect: () => { budget -= 600; satisfaction = Math.min(100, satisfaction + 18); notify('🤝 Accord trouvé ! Les travailleurs reprennent.', 'success'); } },
      { label: 'Tenir ferme', cost: 0, effect: () => { satisfaction = Math.max(0, satisfaction - 5); notify('😤 Pas d'accord. La grève continue.', 'error'); } }
    ]
  },

  // ─ SUBVENTION ─ toujours disponible dès qu'il y a quelques bâtiments
  {
    id: 'subsidy',
    title: '🏛️ Subvention Gouvernementale',
    desc: 'L'État récompense le développement de votre ville !',
    type: 'good',
    condition: () => res.buildings >= 3,
    effect: () => {
      const bonus = 500 + res.buildings * 60 + population * 2;
      budget += bonus;
      notify(`🏛️ Subvention reçue ! +${bonus}$`, 'success');
    },
    choices: [
      { label: 'Accepter avec gratitude', cost: 0, effect: () => {} }
    ]
  },

  // ─ CHAMPIONNAT ─ nécessite un stade
  {
    id: 'sports',
    title: '🏆 Championnat National',
    desc: 'Votre ville est sélectionnée pour accueillir le championnat national !',
    type: 'good',
    condition: () => countBuildingType('stadium') >= 1,
    effect: () => {
      const bonus = 1500 + population * 3;
      budget += bonus;
      satisfaction = Math.min(100, satisfaction + 15);
      population += randInt(10, 30);
      notify(`🏆 Championnat ! +${bonus}$ · +15 satisfaction · nouveaux habitants !`, 'success');
    },
    choices: [
      { label: 'Organiser la fête (−300$)', cost: 300, effect: () => { budget -= 300; satisfaction = Math.min(100, satisfaction + 8); notify('🎉 Fête inoubliable ! La ville rayonne.', 'success'); } },
      { label: 'Accueil sobre', cost: 0, effect: () => {} }
    ]
  },

  // ─ POLLUTION ─ nécessite des usines
  {
    id: 'pollution',
    title: '☠️ Crise Environnementale',
    desc: 'La pollution de vos usines atteint un niveau critique. Les habitants protestent.',
    type: 'bad',
    condition: () => countBuildingType('factory') >= 1,
    effect: () => {
      const factories = countBuildingType('factory');
      const penalty = factories * 180;
      budget = Math.max(0, budget - penalty);
      satisfaction = Math.max(0, satisfaction - factories * 6);
      notify(`☠️ Pollution critique ! −${penalty}$ · −${factories * 6} satisfaction (${factories} usine${factories > 1 ? 's' : ''})`, 'error');
    },
    choices: [
      { label: 'Filtres antipollution (−500$)', cost: 500, effect: () => { budget -= 500; satisfaction = Math.min(100, satisfaction + 10); notify('🌿 Filtres installés ! Pollution réduite.', 'success'); } },
      { label: 'Ignorer les plaintes', cost: 0, effect: () => { satisfaction = Math.max(0, satisfaction - 8); notify('😤 Les habitants très mécontents !', 'error'); } }
    ]
  },

  // ─ TECH BOOM ─ nécessite école + bureau ou bibliothèque
  {
    id: 'tech_boom',
    title: '💻 Révolution Technologique',
    desc: 'Une startup issue de votre école locale révolutionne l'industrie !',
    type: 'good',
    condition: () => countBuildingType('school') >= 1 && (countBuildingType('office') + countBuildingType('library')) >= 1,
    effect: () => {
      budget += 800;
      population += randInt(15, 40);
      satisfaction = Math.min(100, satisfaction + 8);
      notify('💻 Révolution tech ! +800$ · nouveaux habitants qualifiés !', 'success');
    },
    choices: [
      { label: 'Créer un incubateur (−700$)', cost: 700, effect: () => { budget -= 700; weatherState.techBoost = (weatherState.techBoost || 0) + 8; notify('🚀 Incubateur ouvert ! +8$/cycle permanent', 'success'); } },
      { label: 'Laisser évoluer', cost: 0, effect: () => {} }
    ]
  },

  // ─ PANNE DE COURANT ─ nécessite bâtiments alimentés
  {
    id: 'blackout',
    title: '⚡ Panne de Courant',
    desc: 'Une panne électrique frappe la ville ! Les habitants sont dans le noir.',
    type: 'bad',
    condition: () => res.pG > 0 && res.pN > 0,
    effect: () => {
      satisfaction = Math.max(0, satisfaction - 20);
      budget = Math.max(0, budget - 300);
      notify('⚡ Panne générale ! −20 satisfaction · −300$ de dommages', 'error');
    },
    choices: [
      { label: 'Réparer en urgence (−400$)', cost: 400, effect: () => { budget -= 400; satisfaction = Math.min(100, satisfaction + 15); notify('🔧 Courant rétabli ! Les habitants soulagés.', 'success'); } },
      { label: 'Attendre le retour du courant', cost: 0, effect: () => { satisfaction = Math.max(0, satisfaction - 5); notify('⏳ La panne dure… l'impatience monte.', 'error'); } }
    ]
  },

  // ─ DONATION TOURISME ─ nécessite hôpital ou aéroport
  {
    id: 'tourism',
    title: '✈️ Afflux Touristique',
    desc: 'Votre ville attire des visiteurs internationaux ! L'économie locale s'envole.',
    type: 'good',
    condition: () => (countBuildingType('airport') + countBuildingType('stadium') + countBuildingType('market')) >= 1 && population >= 30,
    effect: () => {
      const bonus = 600 + countBuildingType('airport') * 500 + countBuildingType('hotel') * 200;
      budget += bonus;
      satisfaction = Math.min(100, satisfaction + 6);
      notify(`✈️ Touristes ! +${bonus}$ · +6 satisfaction`, 'success');
    },
    choices: [
      { label: 'Campagne publicitaire (−300$)', cost: 300, effect: () => { budget -= 300; population += randInt(5, 15); notify('📣 Campagne réussie ! Nouveaux résidents attirés.', 'success'); } },
      { label: 'Accueil naturel', cost: 0, effect: () => {} }
    ]
  },

  // ─ INONDATION ─ nécessite rivière (terrain eau) ou beaucoup de pluie
  {
    id: 'flood',
    title: '🌊 Inondation',
    desc: 'Les pluies torrentielles provoquent des inondations dans les quartiers bas.',
    type: 'bad',
    condition: () => typeof weatherState !== 'undefined' && ['rain','storm'].includes(weatherState.current) && countType() >= 5,
    effect: () => {
      budget = Math.max(0, budget - 500);
      satisfaction = Math.max(0, satisfaction - 10);
      population = Math.max(0, population - randInt(0, 8));
      notify('🌊 Inondation ! Quartiers touchés. −500$ · −10 satisfaction', 'error');
    },
    choices: [
      { label: 'Pompes d'urgence (−350$)', cost: 350, effect: () => { budget -= 350; satisfaction = Math.min(100, satisfaction + 8); notify('💧 Zones asséchées ! Habitants rassurés.', 'success'); } },
      { label: 'Évacuation préventive', cost: 0, effect: () => {} }
    ]
  },

  // ─ CRIME ─ nécessite population et pas assez de police
  {
    id: 'crime_wave',
    title: '🚨 Vague de Criminalité',
    desc: 'Le taux de criminalité explose dans les quartiers sans surveillance.',
    type: 'bad',
    condition: () => population >= 30 && countBuildingType('police') === 0,
    effect: () => {
      budget = Math.max(0, budget - 400);
      satisfaction = Math.max(0, satisfaction - 18);
      notify('🚨 Criminalité en hausse ! −400$ · −18 satisfaction. Construisez un commissariat !', 'error');
    },
    choices: [
      { label: 'Patrouilles renforcées (−300$)', cost: 300, effect: () => { budget -= 300; satisfaction = Math.min(100, satisfaction + 10); notify('👮 Patrouilles déployées ! Situation maîtrisée.', 'success'); } },
      { label: 'Ignorer le problème', cost: 0, effect: () => { satisfaction = Math.max(0, satisfaction - 6); notify('😰 La situation empire…', 'error'); } }
    ]
  },
];

// ── STATE ──// ── STATE ──
let weatherState = {
  current: 'clear',
  season: 'spring',
  seasonTick: 0,
  weatherTick: 0,
  weatherDuration: 0,
  eventCooldown: 0,
  techBoost: 0,
  weatherParticles: [],
};

// ── HELPERS ──

function demolishRandom() {
  const occupied = [];
  for (let y = 0; y < GRID; y++)
    for (let x = 0; x < GRID; x++)
      if (grid[y][x].type && grid[y][x].type !== 'road') occupied.push(grid[y][x]);
  if (occupied.length === 0) return;
  const cell = occupied[Math.floor(Math.random() * occupied.length)];
  if (cell.pop > 0) { population = Math.max(0, population - cell.pop); cell.pop = 0; }
  cell.type = null;
  cell.el.className = 'tile';
  cell.el.innerHTML = '';
  recalcResources();
  updateUI();
  updateMinimap();
}

function weightedRandom(weights) {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let rand = Math.random() * total;
  for (const [key, weight] of Object.entries(weights)) {
    rand -= weight;
    if (rand <= 0) return key;
  }
  return Object.keys(weights)[0];
}

// ── WEATHER ENGINE ──
function updateWeather() {
  const season = SEASONS[weatherState.season];
  weatherState.current = weightedRandom(season.weatherWeights);
  weatherState.weatherDuration = randInt(30, 90); // ticks
  weatherState.weatherTick = 0;

  updateWeatherUI();
  applyWeatherEffects();
}

function updateSeason() {
  const seasons = ['spring', 'summer', 'autumn', 'winter'];
  const idx = seasons.indexOf(weatherState.season);
  weatherState.season = seasons[(idx + 1) % 4];
  const s = SEASONS[weatherState.season];
  notify(`${s.icon} Changement de saison : ${s.label} !`, 'info');
  updateWeather();
  updateSeasonUI();
}

function applyWeatherEffects() {
  const w = WEATHERS[weatherState.current];
  // Block building during storm/snow
  // Handled in the patched buildAt
}

function updateWeatherUI() {
  const w = WEATHERS[weatherState.current];
  const el = document.getElementById('weather-display');
  if (!el) return;
  el.querySelector('.weather-icon').textContent = w.icon;
  el.querySelector('.weather-label').textContent = w.label;

  // Update canvas particles
  updateParticles();
}

function updateSeasonUI() {
  const s = SEASONS[weatherState.season];
  const el = document.getElementById('season-display');
  if (!el) return;
  el.querySelector('.season-icon').textContent = s.icon;
  el.querySelector('.season-label').textContent = s.label;
}

// ── PARTICLES (weather visual) ──
function updateParticles() {
  const canvas = document.getElementById('weather-canvas');
  if (!canvas) return;
  const w = weatherState.current;
  weatherState.particles = [];
  if (w === 'rain' || w === 'storm') {
    for (let i = 0; i < 80; i++) weatherState.particles.push({ x: Math.random(), y: Math.random(), s: Math.random() * .5 + .5, spd: Math.random() * 1.5 + 1 });
  } else if (w === 'snow') {
    for (let i = 0; i < 60; i++) weatherState.particles.push({ x: Math.random(), y: Math.random(), s: Math.random() * .8 + .3, spd: Math.random() * .3 + .1 });
  } else if (w === 'fog') {
    for (let i = 0; i < 15; i++) weatherState.particles.push({ x: Math.random(), y: Math.random(), s: Math.random() * 3 + 1, spd: 0.05 });
  }
}

function animateParticles() {
  const canvas = document.getElementById('weather-canvas');
  if (!canvas) return requestAnimationFrame(animateParticles);
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const weather = weatherState.current;

  weatherState.particles.forEach(p => {
    if (weather === 'rain' || weather === 'storm') {
      ctx.strokeStyle = weather === 'storm' ? 'rgba(180,210,255,0.5)' : 'rgba(150,200,255,0.4)';
      ctx.lineWidth = p.s;
      ctx.beginPath();
      ctx.moveTo(p.x * w, p.y * h);
      ctx.lineTo(p.x * w + 2, p.y * h + 12 * p.spd);
      ctx.stroke();
      p.y += p.spd * 0.01;
      if (p.y > 1) { p.y = -0.05; p.x = Math.random(); }
    } else if (weather === 'snow') {
      ctx.fillStyle = 'rgba(220,240,255,0.6)';
      ctx.beginPath();
      ctx.arc(p.x * w, p.y * h, p.s * 2, 0, Math.PI * 2);
      ctx.fill();
      p.y += p.spd * 0.005;
      p.x += Math.sin(p.y * 10) * 0.001;
      if (p.y > 1) { p.y = -0.02; p.x = Math.random(); }
    } else if (weather === 'fog') {
      ctx.fillStyle = `rgba(180,200,220,${0.03 + p.s * 0.01})`;
      ctx.beginPath();
      ctx.ellipse(p.x * w, p.y * h, p.s * 60, p.s * 20, 0, 0, Math.PI * 2);
      ctx.fill();
      p.x += p.spd * 0.001;
      if (p.x > 1.2) p.x = -0.2;
    }
  });

  requestAnimationFrame(animateParticles);
}

// ── EVENT MODAL ──
function showEventModal(event) {
  // Remove any existing modal
  document.getElementById('event-modal')?.remove();

  const modal = document.createElement('div');
  modal.id = 'event-modal';
  modal.className = `event-modal event-${event.type}`;

  const choicesHTML = (event.choices || []).map((c, i) => `
    <button class="event-choice" onclick="handleEventChoice(${i})" data-cost="${c.cost}">
      ${c.label}
      ${c.cost > 0 ? `<span class="choice-cost">−${c.cost}$</span>` : ''}
    </button>
  `).join('');

  modal.innerHTML = `
    <div class="event-modal-inner">
      <div class="event-type-badge">${event.type === 'good' ? '✨ OPPORTUNITÉ' : '⚠️ ALERTE'}</div>
      <h2 class="event-title">${event.title}</h2>
      <p class="event-desc">${event.desc}</p>
      <div class="event-choices">${choicesHTML}</div>
    </div>
  `;

  document.body.appendChild(modal);
  window._currentEvent = event;
  setTimeout(() => modal.classList.add('visible'), 10);
}

function handleEventChoice(idx) {
  const event = window._currentEvent;
  if (!event) return;
  const choice = event.choices[idx];
  if (choice && choice.cost > 0 && budget < choice.cost) {
    notify('💰 Budget insuffisant pour ce choix !', 'error');
    return;
  }
  if (choice) choice.effect();
  const modal = document.getElementById('event-modal');
  if (modal) { modal.classList.remove('visible'); setTimeout(() => modal.remove(), 400); }
  window._currentEvent = null;
  recalcResources();
  updateUI();
}

// ── TRIGGER RANDOM EVENT ──
function triggerRandomEvent() {
  const eligible = EVENTS.filter(e => {
    try { return e.condition ? e.condition() : true; } catch(err) { return false; }
  });
  if (eligible.length === 0) return;
  const event = eligible[Math.floor(Math.random() * eligible.length)];
  event.effect();
  if (event.choices && event.choices.length > 1) {
    showEventModal(event);
  }
}

// ── PATCH buildAt to block during storm/snow ──
(function() {
  const _origBuildAt = window.buildAt;
  window.buildAt = function(x, y) {
    const w = WEATHERS[weatherState.current];
    if (w && w.buildBlock && tool !== 'demolish') {
      notify(`${WEATHERS[weatherState.current].icon} Impossible de construire par ce temps !`, 'error');
      return;
    }
    _origBuildAt(x, y);
  };
})();

// ── WEATHER & EVENTS TICK EXTENSION ──
window._gameTickExtensions = window._gameTickExtensions || [];
window._gameTickExtensions.push(function weatherEventTick() {
  if (!gameStarted || speed === 0) return;

  // Weather tick
  weatherState.weatherTick += speed;
  weatherState.seasonTick += speed;

  if (weatherState.weatherTick >= weatherState.weatherDuration) {
    updateWeather();
  }
  if (weatherState.seasonTick >= 1200) { // ~4min per season at speed 1
    weatherState.seasonTick = 0;
    updateSeason();
  }

  // Event cooldown
  if (weatherState.eventCooldown > 0) weatherState.eventCooldown -= speed;

  // Random event trigger
  if (weatherState.eventCooldown <= 0 && Math.random() < 0.002 * speed && countType() >= 2) {
    weatherState.eventCooldown = 300 + randInt(0, 200);
    triggerRandomEvent();
  }

  // Apply weather income/happy modifier
  const w = WEATHERS[weatherState.current];
  if (tick % 60 === 0 && w) {
    if (w.happyBonus !== 0) {
      satisfaction = clamp(satisfaction + Math.round(w.happyBonus * 0.3), 0, 100);
    }
    if (weatherState.techBoost > 0) {
      budget += weatherState.techBoost;
    }
    updateWeatherOverlay();
  }
});

function updateWeatherOverlay() {
  const w = WEATHERS[weatherState.current];
  if (!w) return;
  const overlay = document.getElementById('weather-overlay');
  if (!overlay) return;
  const overlays = {
    rain: 'rgba(20,40,80,0.15)',
    storm: 'rgba(10,20,50,0.35)',
    snow: 'rgba(200,220,255,0.08)',
    fog: 'rgba(150,170,190,0.12)',
    heatwave: 'rgba(80,20,0,0.1)',
    clear: 'transparent',
    cloudy: 'rgba(30,40,60,0.06)',
    windy: 'transparent',
  };
  overlay.style.background = overlays[weatherState.current] || 'transparent';
}

// ── BUILD WEATHER UI ──
function buildWeatherUI() {
  // Weather canvas (particles)
  const weatherCanvas = document.createElement('canvas');
  weatherCanvas.id = 'weather-canvas';
  weatherCanvas.style.cssText = `
    position: fixed; inset: 0; pointer-events: none; z-index: 49;
    width: 100%; height: 100%;
  `;
  weatherCanvas.width = window.innerWidth;
  weatherCanvas.height = window.innerHeight;
  document.body.appendChild(weatherCanvas);

  // Weather overlay
  const weatherOverlay = document.createElement('div');
  weatherOverlay.id = 'weather-overlay';
  weatherOverlay.style.cssText = `
    position: fixed; inset: 0; pointer-events: none; z-index: 48;
    transition: background 2s ease;
  `;
  document.body.appendChild(weatherOverlay);

  // Weather HUD widget (in topbar or side panel)
  const weatherWidget = document.createElement('div');
  weatherWidget.id = 'weather-display';
  weatherWidget.className = 'weather-widget';
  weatherWidget.innerHTML = `
    <span class="weather-icon">☀️</span>
    <div class="weather-info">
      <span class="weather-label">Ensoleillé</span>
      <span class="weather-sub">Saison: <span id="season-display"><span class="season-icon">🌸</span><span class="season-label">Printemps</span></span></span>
    </div>
  `;

  // Inject after topbar-stats
  const topbarStats = document.getElementById('topbar-stats');
  if (topbarStats) topbarStats.after(weatherWidget);

  // New buildings toolbar buttons
  injectNewBuildingButtons();
}

function injectNewBuildingButtons() {
  // Buttons are now hardcoded in index.html - just refresh affordability
  if (typeof updateToolAffordability === 'function') updateToolAffordability();
}

// ── INIT ──
function initEvents() {
  buildWeatherUI();
  updateWeather();
  updateSeasonUI();
  animateParticles();
  injectNewBuildingButtons();

  window.addEventListener('resize', () => {
    const c = document.getElementById('weather-canvas');
    if (c) { c.width = window.innerWidth; c.height = window.innerHeight; }
  });

  // Inject CSS
  injectEventStyles();
}

function injectEventStyles() {
  const style = document.createElement('style');
  style.textContent = `
    /* Weather Widget */
    .weather-widget {
      display: flex; align-items: center; gap: 8px;
      padding: 4px 12px; border-radius: 8px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(56,92,148,0.2);
      flex-shrink: 0;
    }
    .weather-icon { font-size: 20px; line-height: 1; }
    .weather-info { display: flex; flex-direction: column; gap: 1px; }
    .weather-label {
      font-family: 'Exo 2', sans-serif;
      font-size: 12px; font-weight: 700;
      color: #d8e3f0;
    }
    .weather-sub {
      font-size: 10px; color: #6b7fa3;
      display: flex; align-items: center; gap: 4px;
    }
    #season-display { display: inline-flex; align-items: center; gap: 3px; }
    .season-icon { font-size: 11px; }
    .season-label { font-size: 10px; color: #6b7fa3; }

    /* NEW badge */
    .new-badge {
      position: absolute; top: 2px; left: 4px;
      font-size: 7px; font-weight: 800; letter-spacing: .5px;
      color: #22d67a;
      background: rgba(34,214,122,0.15);
      border: 1px solid rgba(34,214,122,0.3);
      border-radius: 3px; padding: 0 3px;
      pointer-events: none;
    }

    /* Event Modal */
    .event-modal {
      position: fixed; inset: 0; z-index: 500;
      display: flex; align-items: center; justify-content: center;
      background: rgba(8,12,20,0.7);
      backdrop-filter: blur(8px);
      opacity: 0;
      transition: opacity .3s ease;
      padding: 20px;
    }
    .event-modal.visible { opacity: 1; }

    .event-modal-inner {
      max-width: 420px; width: 100%;
      background: #0e1626;
      border-radius: 16px;
      padding: 28px 28px 24px;
      border: 1px solid rgba(80,140,220,0.3);
      box-shadow: 0 20px 60px rgba(0,0,0,0.6);
      transform: translateY(0);
      animation: modalSlideIn .35s cubic-bezier(.34,1.56,.64,1);
    }
    @keyframes modalSlideIn {
      from { transform: translateY(20px) scale(.95); }
      to { transform: translateY(0) scale(1); }
    }

    .event-type-badge {
      display: inline-block;
      font-family: 'Exo 2', sans-serif;
      font-size: 10px; font-weight: 800; letter-spacing: 3px;
      padding: 4px 12px; border-radius: 20px;
      margin-bottom: 14px;
    }
    .event-good .event-type-badge {
      color: #22d67a;
      background: rgba(34,214,122,0.1);
      border: 1px solid rgba(34,214,122,0.3);
    }
    .event-bad .event-type-badge {
      color: #ff5555;
      background: rgba(255,85,85,0.1);
      border: 1px solid rgba(255,85,85,0.3);
    }

    .event-title {
      font-family: 'Exo 2', sans-serif;
      font-size: 22px; font-weight: 800;
      color: #ffffff; margin-bottom: 10px;
      line-height: 1.2;
    }
    .event-desc {
      color: #6b7fa3; font-size: 14px;
      line-height: 1.6; margin-bottom: 22px;
    }

    .event-choices {
      display: flex; flex-direction: column; gap: 8px;
    }
    .event-choice {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 16px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(56,92,148,0.25);
      border-radius: 10px;
      color: #d8e3f0;
      font-family: 'DM Sans', sans-serif;
      font-size: 13px; font-weight: 600;
      cursor: pointer;
      transition: all .15s;
      text-align: left;
    }
    .event-choice:hover {
      background: rgba(59,158,255,0.08);
      border-color: rgba(59,158,255,0.4);
      color: #fff;
    }
    .event-choice:active { transform: scale(.97); }
    .choice-cost {
      font-family: 'Exo 2', sans-serif;
      font-size: 12px; font-weight: 700;
      color: #fbbf24;
      flex-shrink: 0; margin-left: 12px;
    }

    /* Weather canvas responsiveness */
    #weather-canvas { pointer-events: none; }

    /* Mobile: hide weather widget label on small screens */
    @media (max-width: 700px) {
      .weather-widget { padding: 3px 8px; }
      .weather-info { display: none; }
      .weather-icon { font-size: 18px; }
    }
  `;
  document.head.appendChild(style);
}

// ── START ──
// Wait for game engine + grid to be fully ready before init
const _waitInit = setInterval(() => {
  if (typeof gameStarted !== 'undefined' &&
      typeof grid !== 'undefined' &&
      Array.isArray(grid[0]) && grid[0][0] &&
      typeof selectTool === 'function' &&
      typeof notify === 'function') {
    clearInterval(_waitInit);
    initEvents();
  }
}, 50);