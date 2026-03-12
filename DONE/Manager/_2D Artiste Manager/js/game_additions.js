// =============================================================
//  ARTVIBE MANAGER — ADDITIONS v4
//  Nouveaux systèmes : Carte du monde, Rivaux avancés, Alliances,
//  Rôles stricts, Contacts VIP, Nouveaux Rivaux, Événements riches
// =============================================================

// ── WORLD MAP DATA ────────────────────────────────────────────
// Carte fictive inspirée du monde réel avec pays, villes, venues

const WORLD_MAP = {
  regions: [
    {
      id: 'europe_west',
      name: 'Europe de l\'Ouest',
      emoji: '🇪🇺',
      color: '#4fa3e0',
      countries: [
        {
          id: 'france', name: 'France', emoji: '🇫🇷', color: '#003189',
          musicScene: 'pop_electronic', artScene: 'gallery', hype: 90,
          cities: [
            { id:'paris',     name:'Paris',      emoji:'🗼', capacity:80000, venueCost:50000, prestige:95, types:['concert','festival','gallery','theater'], genre:['all'] },
            { id:'lyon',      name:'Lyon',        emoji:'🦁', capacity:20000, venueCost:15000, prestige:65, types:['concert','festival','gallery'], genre:['rock','electronic','jazz'] },
            { id:'marseille', name:'Marseille',   emoji:'⚓', capacity:25000, venueCost:16000, prestige:60, types:['concert','festival'], genre:['rap','world','reggae'] },
            { id:'bordeaux',  name:'Bordeaux',    emoji:'🍷', capacity:15000, venueCost:12000, prestige:55, types:['concert','theater'], genre:['pop','indie','classical'] },
            { id:'lille',     name:'Lille',       emoji:'🌷', capacity:18000, venueCost:13000, prestige:58, types:['concert','festival'], genre:['electronic','indie'] },
            { id:'toulouse',  name:'Toulouse',    emoji:'🌸', capacity:12000, venueCost:10000, prestige:50, types:['concert','gallery'], genre:['folk','pop','rap'] },
          ]
        },
        {
          id: 'uk', name: 'Royaume-Uni', emoji: '🇬🇧', color: '#C8102E',
          musicScene: 'rock_indie', artScene: 'contemporary', hype: 88,
          cities: [
            { id:'london',     name:'Londres',    emoji:'🎡', capacity:90000, venueCost:65000, prestige:98, types:['concert','festival','gallery','theater'], genre:['all'] },
            { id:'manchester', name:'Manchester', emoji:'🐝', capacity:25000, venueCost:20000, prestige:72, types:['concert','festival'], genre:['indie','rock','electronic'] },
            { id:'glasgow',    name:'Glasgow',    emoji:'🏴󠁧󠁢󠁳󠁣󠁴󠁿', capacity:14000, venueCost:12000, prestige:60, types:['concert','festival'], genre:['rock','folk'] },
          ]
        },
        {
          id: 'germany', name: 'Allemagne', emoji: '🇩🇪', color: '#000000',
          musicScene: 'electronic_techno', artScene: 'modern', hype: 82,
          cities: [
            { id:'berlin',   name:'Berlin',   emoji:'🐻', capacity:70000, venueCost:45000, prestige:90, types:['concert','festival','gallery'], genre:['techno','electronic','pop'] },
            { id:'munich',   name:'Munich',   emoji:'🍺', capacity:40000, venueCost:30000, prestige:75, types:['concert','festival'], genre:['pop','classical','rock'] },
            { id:'hamburg',  name:'Hambourg', emoji:'⚓', capacity:30000, venueCost:22000, prestige:70, types:['concert','festival'], genre:['electronic','indie'] },
          ]
        },
        {
          id: 'spain', name: 'Espagne', emoji: '🇪🇸', color: '#c60b1e',
          musicScene: 'latin_pop', artScene: 'contemporary', hype: 75,
          cities: [
            { id:'madrid',    name:'Madrid',    emoji:'👑', capacity:55000, venueCost:35000, prestige:82, types:['concert','festival','gallery'], genre:['latin','pop','flamenco'] },
            { id:'barcelona', name:'Barcelone', emoji:'🌹', capacity:45000, venueCost:32000, prestige:80, types:['concert','festival','gallery'], genre:['electronic','indie','latin'] },
            { id:'ibiza',     name:'Ibiza',     emoji:'🏝️', capacity:8000,  venueCost:40000, prestige:88, types:['concert'], genre:['electronic','house','techno'] },
          ]
        },
        {
          id: 'netherlands', name: 'Pays-Bas', emoji: '🇳🇱', color: '#ff6600',
          musicScene: 'electronic_dance', artScene: 'gallery', hype: 78,
          cities: [
            { id:'amsterdam', name:'Amsterdam', emoji:'🌷', capacity:35000, venueCost:28000, prestige:78, types:['concert','festival','gallery'], genre:['electronic','trance','drum_bass'] },
          ]
        },
      ]
    },
    {
      id: 'europe_south',
      name: 'Europe du Sud',
      emoji: '☀️',
      color: '#f97316',
      countries: [
        {
          id: 'italy', name: 'Italie', emoji: '🇮🇹', color: '#008C45',
          musicScene: 'pop_classical', artScene: 'renaissance', hype: 72,
          cities: [
            { id:'rome',  name:'Rome',  emoji:'🏛️', capacity:50000, venueCost:38000, prestige:85, types:['concert','festival','gallery','theater'], genre:['classical','pop','opera'] },
            { id:'milan', name:'Milan', emoji:'💎', capacity:35000, venueCost:35000, prestige:82, types:['concert','gallery','theater'], genre:['pop','electronic','fashion'] },
          ]
        },
        {
          id: 'portugal', name: 'Portugal', emoji: '🇵🇹', color: '#006600',
          musicScene: 'fado_world', artScene: 'contemporary', hype: 65,
          cities: [
            { id:'lisbon', name:'Lisbonne', emoji:'🐓', capacity:20000, venueCost:14000, prestige:65, types:['concert','festival','gallery'], genre:['fado','electronic','world'] },
          ]
        },
      ]
    },
    {
      id: 'north_america',
      name: 'Amérique du Nord',
      emoji: '🌎',
      color: '#22c55e',
      countries: [
        {
          id: 'usa', name: 'États-Unis', emoji: '🇺🇸', color: '#B22234',
          musicScene: 'pop_hip_hop', artScene: 'contemporary', hype: 100,
          cities: [
            { id:'new_york',   name:'New York',   emoji:'🗽', capacity:100000, venueCost:90000, prestige:100, types:['concert','festival','gallery','theater'], genre:['all'] },
            { id:'los_angeles',name:'Los Angeles', emoji:'🌴', capacity:80000,  venueCost:75000, prestige:97,  types:['concert','festival','gallery'], genre:['pop','hip_hop','electronic'] },
            { id:'chicago',    name:'Chicago',    emoji:'🌬️', capacity:35000,  venueCost:30000, prestige:78,  types:['concert','festival'], genre:['jazz','blues','house','rock'] },
            { id:'miami',      name:'Miami',      emoji:'🌊', capacity:30000,  venueCost:28000, prestige:75,  types:['concert','festival'], genre:['latin','electronic','hip_hop'] },
            { id:'nashville',  name:'Nashville',  emoji:'🤠', capacity:20000,  venueCost:15000, prestige:70,  types:['concert','theater'], genre:['country','rock','pop'] },
          ]
        },
        {
          id: 'canada', name: 'Canada', emoji: '🇨🇦', color: '#FF0000',
          musicScene: 'indie_pop', artScene: 'contemporary', hype: 78,
          cities: [
            { id:'toronto',  name:'Toronto',   emoji:'🍁', capacity:45000, venueCost:35000, prestige:80, types:['concert','festival','gallery'], genre:['pop','indie','r&b'] },
            { id:'montreal', name:'Montréal',  emoji:'🎡', capacity:30000, venueCost:22000, prestige:72, types:['concert','festival'], genre:['electronic','indie','francophone'] },
          ]
        },
      ]
    },
    {
      id: 'latin_america',
      name: 'Amérique Latine',
      emoji: '🌺',
      color: '#a855f7',
      countries: [
        {
          id: 'brazil', name: 'Brésil', emoji: '🇧🇷', color: '#009C3B',
          musicScene: 'samba_funk_electronic', artScene: 'street', hype: 85,
          cities: [
            { id:'sao_paulo',      name:'São Paulo',     emoji:'🌆', capacity:70000, venueCost:30000, prestige:85, types:['concert','festival','gallery'], genre:['funk','electronic','axe','pop'] },
            { id:'rio_de_janeiro', name:'Rio de Janeiro', emoji:'🎭', capacity:80000, venueCost:35000, prestige:90, types:['concert','festival'], genre:['samba','funk','pop','rock'] },
          ]
        },
        {
          id: 'mexico', name: 'Mexique', emoji: '🇲🇽', color: '#006847',
          musicScene: 'latin_urban', artScene: 'muralism', hype: 78,
          cities: [
            { id:'mexico_city', name:'Mexico',    emoji:'🌮', capacity:55000, venueCost:25000, prestige:80, types:['concert','festival','gallery'], genre:['latin','urban','pop','mariachi'] },
            { id:'guadalajara', name:'Guadalajara',emoji:'🌻', capacity:20000, venueCost:12000, prestige:62, types:['concert','festival'], genre:['mariachi','pop','regional'] },
          ]
        },
      ]
    },
    {
      id: 'asia',
      name: 'Asie',
      emoji: '🌏',
      color: '#f5c842',
      countries: [
        {
          id: 'japan', name: 'Japon', emoji: '🇯🇵', color: '#BC002D',
          musicScene: 'j_pop_electronic', artScene: 'anime_manga', hype: 88,
          cities: [
            { id:'tokyo',    name:'Tokyo',  emoji:'🗾', capacity:80000, venueCost:70000, prestige:95, types:['concert','festival','gallery','theater'], genre:['j-pop','electronic','rock','classical'] },
            { id:'osaka',    name:'Osaka',  emoji:'🏯', capacity:40000, venueCost:35000, prestige:80, types:['concert','festival'], genre:['j-pop','hip_hop','electronic'] },
          ]
        },
        {
          id: 'south_korea', name: 'Corée du Sud', emoji: '🇰🇷', color: '#003478',
          musicScene: 'k_pop', artScene: 'contemporary', hype: 92,
          cities: [
            { id:'seoul', name:'Séoul', emoji:'🎎', capacity:70000, venueCost:55000, prestige:90, types:['concert','festival','gallery'], genre:['k-pop','hip_hop','indie'] },
          ]
        },
        {
          id: 'china', name: 'Chine', emoji: '🇨🇳', color: '#DE2910',
          musicScene: 'c_pop_electronic', artScene: 'contemporary', hype: 80,
          cities: [
            { id:'shanghai', name:'Shanghai', emoji:'🌃', capacity:80000, venueCost:60000, prestige:88, types:['concert','festival','gallery'], genre:['c-pop','electronic','pop'] },
            { id:'beijing',  name:'Pékin',    emoji:'🏯', capacity:60000, venueCost:50000, prestige:85, types:['concert','gallery','theater'], genre:['pop','classical','folk'] },
          ]
        },
        {
          id: 'uae', name: 'Émirats Arabes', emoji: '🇦🇪', color: '#00732f',
          musicScene: 'luxury_events', artScene: 'contemporary', hype: 82,
          cities: [
            { id:'dubai',     name:'Dubaï',    emoji:'🌴', capacity:45000, venueCost:80000, prestige:92, types:['concert','festival','gallery'], genre:['pop','electronic','world'] },
            { id:'abu_dhabi', name:'Abu Dhabi', emoji:'🕌', capacity:30000, venueCost:55000, prestige:85, types:['concert','gallery'], genre:['classical','pop','world'] },
          ]
        },
      ]
    },
    {
      id: 'africa',
      name: 'Afrique',
      emoji: '🌍',
      color: '#f97316',
      countries: [
        {
          id: 'nigeria', name: 'Nigeria', emoji: '🇳🇬', color: '#008751',
          musicScene: 'afrobeats', artScene: 'contemporary', hype: 88,
          cities: [
            { id:'lagos',  name:'Lagos',  emoji:'🌊', capacity:50000, venueCost:20000, prestige:82, types:['concert','festival'], genre:['afrobeats','afropop','hip_hop','highlife'] },
            { id:'abuja',  name:'Abuja',  emoji:'🏛️', capacity:30000, venueCost:15000, prestige:70, types:['concert','gallery'], genre:['afrobeats','pop'] },
          ]
        },
        {
          id: 'south_africa', name: 'Afrique du Sud', emoji: '🇿🇦', color: '#007A4D',
          musicScene: 'amapiano_house', artScene: 'contemporary', hype: 75,
          cities: [
            { id:'johannesburg', name:'Johannesburg', emoji:'💎', capacity:40000, venueCost:18000, prestige:75, types:['concert','festival','gallery'], genre:['amapiano','house','kwaito','pop'] },
            { id:'cape_town',    name:'Le Cap',       emoji:'🏔️', capacity:25000, venueCost:14000, prestige:68, types:['concert','festival','gallery'], genre:['jazz','house','folk'] },
          ]
        },
      ]
    },
    {
      id: 'oceania',
      name: 'Océanie',
      emoji: '🌊',
      color: '#22c55e',
      countries: [
        {
          id: 'australia', name: 'Australie', emoji: '🇦🇺', color: '#00008B',
          musicScene: 'rock_indie_electronic', artScene: 'aboriginal_contemporary', hype: 72,
          cities: [
            { id:'sydney',    name:'Sydney',    emoji:'🦘', capacity:50000, venueCost:40000, prestige:80, types:['concert','festival','gallery'], genre:['rock','indie','pop','electronic'] },
            { id:'melbourne', name:'Melbourne', emoji:'🎨', capacity:40000, venueCost:32000, prestige:76, types:['concert','festival','gallery'], genre:['indie','electronic','jazz'] },
          ]
        },
      ]
    },
  ]
};

// Helper to get all cities flat
function getAllCities() {
  const cities = [];
  WORLD_MAP.regions.forEach(r => r.countries.forEach(c => c.cities.forEach(city => {
    cities.push({ ...city, countryId: c.id, countryName: c.name, countryEmoji: c.emoji, regionId: r.id, regionName: r.name });
  })));
  return cities;
}

function getCityById(id) { return getAllCities().find(c => c.id === id); }
function getCountryById(id) {
  for (const r of WORLD_MAP.regions) {
    const c = r.countries.find(x => x.id === id);
    if (c) return c;
  }
  return null;
}

// ── ROLE ENFORCEMENT (artistes ne peuvent faire que leur métier) ─

// Types de projets STRICTS par rôle
const ROLE_PROJECT_MATRIX = {
  musician:     { primary: ['album','ep','single','featuring','session','residency','festival','opening','musicvideo','radio','soundtrack','livestream','merch'], secondary: ['show','collab'], forbidden: ['exhibit','film','book'] },
  painter:      { primary: ['exhibit','book','collab'], secondary: ['film'], forbidden: ['album','ep','single','featuring','session','residency','festival','opening','musicvideo','radio','soundtrack','livestream','merch','show'] },
  comedian:     { primary: ['show','film','radio','tour'], secondary: ['collab','soundtrack','merch','livestream'], forbidden: ['album','ep','single','featuring','session','residency','festival','opening','musicvideo','exhibit','book'] },
  photographer: { primary: ['exhibit','film','collab','book'], secondary: [], forbidden: ['album','ep','single','featuring','session','residency','festival','opening','musicvideo','radio','soundtrack','livestream','merch','show'] },
  poet:         { primary: ['book','livestream','collab'], secondary: ['show','radio'], forbidden: ['album','ep','single','featuring','session','residency','festival','opening','musicvideo','exhibit','film','merch','tour'] },
};

function getRoleCompatibility(artistType, projectTypeId) {
  const matrix = ROLE_PROJECT_MATRIX[artistType];
  if (!matrix) return { level: 'secondary', penalty: 0.8 };
  if (matrix.primary.includes(projectTypeId)) return { level: 'primary', penalty: 1.0, label: '✅ Spécialité' };
  if (matrix.secondary.includes(projectTypeId)) return { level: 'secondary', penalty: 0.75, label: '⚠️ Hors spécialité (-25%)' };
  if (matrix.forbidden.includes(projectTypeId)) return { level: 'forbidden', penalty: 0.3, label: '❌ Incompatible (-70%)' };
  return { level: 'secondary', penalty: 0.8, label: '⚠️ Hors domaine' };
}

function getArtistRoleWarning(artistType, projectTypeId) {
  const c = getRoleCompatibility(artistType, projectTypeId);
  if (c.level === 'forbidden') return `<span style="color:var(--red);font-size:.65rem">❌ Un ${TYPE_LABELS[artistType]} ne fait pas ça !</span>`;
  if (c.level === 'secondary') return `<span style="color:var(--orange);font-size:.65rem">⚠️ Hors spécialité — résultat réduit</span>`;
  return `<span style="color:var(--green);font-size:.65rem">✅ Dans sa spécialité</span>`;
}

// ── VIP CONTACTS ──────────────────────────────────────────────

const VIP_CONTACTS_POOL = [
  // Music Industry
  { id:'record_exec_1', name:'Maxime Laurent', role:'Directeur A&R', emoji:'👔', type:'industry', specialty:['musician'], benefit:'Accès à des contrats majors (+30% reward album/EP)', passive: { contractBonus: 0.3 }, cost:0, unlockRep:35, rarity:'rare', desc:'Ex-Sony Music, repère les talents pour les grandes maisons.' },
  { id:'producer_1',    name:'DJ Pharoah',     role:'Producteur Star', emoji:'🎛️', type:'production', specialty:['musician'], benefit:'+25% qualité projets musicaux, -1 semaine durée', passive: { musicBonus: 0.25, durationReduce: 1 }, cost:0, unlockRep:25, rarity:'uncommon', desc:'Producteur multi-platine, travaille avec les meilleurs.' },
  { id:'radio_dj',      name:'Sofiane K.',     role:'Programmateur Radio', emoji:'📻', type:'media', specialty:['musician'], benefit:'+20 notoriété sur chaque sortie musicale', passive: { fameBoostOnRelease: 20 }, cost:0, unlockRep:20, rarity:'common', desc:'Responsable playlist NRJ/Skyrock, peut lancer une carrière.' },
  { id:'booking_agent', name:'Clara Steinberg',role:'Agent Booking',  emoji:'📋', type:'booking', specialty:['musician','comedian'], benefit:'+40% revenus concerts et tournées', passive: { tourBonus: 0.4 }, cost:0, unlockRep:30, rarity:'uncommon', desc:'Booking agent international, accès aux meilleures scènes.' },
  // Visual Arts
  { id:'gallery_owner', name:'Isabelle Moreau',role:'Galeriste',       emoji:'🖼️', type:'gallery', specialty:['painter','photographer'], benefit:'+35% revenus expositions', passive: { exhibitBonus: 0.35 }, cost:0, unlockRep:22, rarity:'common', desc:'Propriétaire d\'une galerie réputée dans le Marais, Paris.' },
  { id:'art_critic',    name:'Pierre Dubas',   role:'Critique d\'Art', emoji:'✍️', type:'media', specialty:['painter','photographer','poet'], benefit:'+15 réputation sur chaque exposition', passive: { exhibitRepBonus: 15 }, cost:0, unlockRep:28, rarity:'uncommon', desc:'Critique pour Le Monde des Arts, sa plume fait ou défait les carrières.' },
  { id:'museum_curator',name:'Dr. Eva Schmidt',role:'Conservatrice',   emoji:'🏛️', type:'museum', specialty:['painter','photographer'], benefit:'Accès aux expositions muséales mondiales (+50% prestige)', passive: { museumAccess: true }, cost:0, unlockRep:50, rarity:'rare', desc:'Conservatrice au Centre Pompidou. Le Graal pour les arts visuels.' },
  // Entertainment
  { id:'film_director', name:'Jean-Marc Russo',role:'Réalisateur',     emoji:'🎬', type:'film', specialty:['comedian','photographer'], benefit:'+50% revenus courts-métrages et films', passive: { filmBonus: 0.5 }, cost:0, unlockRep:38, rarity:'rare', desc:'Réalisateur césarisé, ses collaborations boostent toujours les carrières.' },
  { id:'tv_producer',   name:'Sandra Vidal',   role:'Productrice TV',  emoji:'📺', type:'tv', specialty:['comedian','musician'], benefit:'Accès émissions prime time (+30 notoriété sur TV)', passive: { tvBonus: 30 }, cost:0, unlockRep:42, rarity:'rare', desc:'Productrice chez TF1. Un passage dans son émission, c\'est la consécration.' },
  { id:'comedy_club',   name:'Rachid Ben Ali', role:'Patron Comedy Club',emoji:'😂', type:'venue', specialty:['comedian','poet'], benefit:'+30% revenus shows, accès salles premium', passive: { showBonus: 0.3 }, cost:0, unlockRep:18, rarity:'common', desc:'Patron du Comedy Store Paris. Référence du stand-up francophone.' },
  // Literature / Poetry
  { id:'publisher',     name:'Hélène Cartier', role:'Éditrice',        emoji:'📚', type:'publishing', specialty:['poet','painter'], benefit:'+40% revenus publications, accès Gallimard/Flammarion', passive: { bookBonus: 0.4 }, cost:0, unlockRep:20, rarity:'common', desc:'Directrice littéraire chez Actes Sud. Passion pour les artistes singuliers.' },
  // General
  { id:'music_lawyer',  name:'Maître Alain Voss',role:'Avocat Musique',emoji:'⚖️', type:'legal', specialty:['all'], benefit:'-20% frais contrats, protection contre débauchage rival', passive: { contractCostReduce: 0.2, rivalProtection: 0.15 }, cost:0, unlockRep:25, rarity:'uncommon', desc:'Spécialiste droit de la musique et propriété intellectuelle.' },
  { id:'pr_manager',    name:'Nadia El-Khoury',role:'Attachée Presse', emoji:'📣', type:'pr', specialty:['all'], benefit:'+15% gains réputation sur tous projets', passive: { repMult: 0.15 }, cost:0, unlockRep:15, rarity:'common', desc:'PR digitale, gère l\'image de plusieurs stars. Réseau immense.' },
  { id:'luxury_sponsor',name:'Victor Beaumont', role:'Mécène Luxe',    emoji:'💎', type:'sponsor', specialty:['all'], benefit:'+25% bonus cash sur tous contrats', passive: { cashMult: 0.25 }, cost:0, unlockRep:55, rarity:'epic', desc:'PDG d\'un conglomérat luxe. Investit massivement dans la culture.' },
  { id:'social_media_guru',name:'Kim Tran',     role:'Guru Réseaux',   emoji:'📱', type:'social', specialty:['all'], benefit:'+20 notoriété sur chaque événement/sortie', passive: { viralBoost: 20 }, cost:0, unlockRep:18, rarity:'common', desc:'Stratège viral, ses campagnes font exploser les compteurs.' },
  { id:'festival_org',  name:'Omar Faye',       role:'Organisateur Festivals',emoji:'🎪', type:'booking', specialty:['musician','comedian'], benefit:'Accès aux plus grands festivals mondiaux', passive: { festivalAccess: true }, cost:0, unlockRep:45, rarity:'rare', desc:'Organise les festivals les plus importants d\'Europe et d\'Afrique.' },
  { id:'international_agent',name:'Sophie Chen', role:'Agent International', emoji:'🌐', type:'booking', specialty:['all'], benefit:'+20% revenus en tournée internationale, -15% frais de venue', passive: { intlBonus: 0.2 }, cost:0, unlockRep:48, rarity:'rare', desc:'Réseau mondial, elle ouvre les portes des marchés asiatiques et américains.' },
  { id:'label_partner', name:'Marcus Webb',     role:'Directeur Major',emoji:'🏢', type:'major_label', specialty:['musician'], benefit:'Accès deals majors (×2 revenus album)', passive: { majorDeal: true }, cost:0, unlockRep:70, rarity:'legendary', desc:'VP d\'Universal Music. Un accord avec lui, c\'est la consécration mondiale.' },
];

// ── RIVAL TYPES ENRICHIS ──────────────────────────────────────

const RIVAL_TEMPLATES_V2 = [
  // Rivaux de base (labels indé)
  { id:'stellar',    name:'Stellar Records',   icon:'🌟', style:'aggressive',   color:'#f97316', startRepBonus:5,  tier:0, type:'indie',    specialty:['musician'],                     personality:'Prédateur — attaque les artistes fragiles et les jeunes talents.' },
  { id:'eclipse',    name:'Eclipse Music',     icon:'🌑', style:'balanced',     color:'#a855f7', startRepBonus:3,  tier:0, type:'indie',    specialty:['musician','poet'],              personality:'Stratège — croissance lente mais solide, rarely errs.' },
  { id:'prestige',   name:'Prestige Arts',     icon:'💎', style:'passive',      color:'#22c55e', startRepBonus:2,  tier:0, type:'gallery',  specialty:['painter','photographer'],       personality:'Élitiste — vise uniquement les artistes de très haute renommée.' },
  // Nouveaux rivaux (se débloquent selon le palier du joueur)
  { id:'nova',       name:'Nova Creative',     icon:'💫', style:'viral',        color:'#60a5fa', startRepBonus:4,  tier:1, type:'digital',  specialty:['musician','comedian'],          personality:'Viral — mise tout sur les réseaux, croissance explosive mais instable.', unlockAtTier:1 },
  { id:'titan',      name:'Titan Entertainment',icon:'🦁',style:'corporate',   color:'#ffd700', startRepBonus:8,  tier:2, type:'major',    specialty:['musician','comedian','painter'], personality:'Corporate — budget illimité, recrute les stars à prix d\'or.', unlockAtTier:2 },
  { id:'underground',name:'Underground Union', icon:'🔥', style:'guerrilla',   color:'#ef4444', startRepBonus:3,  tier:0, type:'collective',specialty:['musician','poet','comedian'],   personality:'Collectif — solidarité entre artistes, résiste aux grosses offres.', unlockAtTier:1 },
  { id:'asiawave',   name:'AsiaPop Wave',      icon:'🌊', style:'expansionist', color:'#ec4899', startRepBonus:6, tier:2, type:'major',    specialty:['musician'],                     personality:'Expansionniste — pousse les artistes sur les marchés asiatiques.', unlockAtTier:3 },
  { id:'artcorp',    name:'ArtCorp Global',    icon:'🏛️', style:'balanced',    color:'#14b8a6', startRepBonus:5,  tier:1, type:'gallery',  specialty:['painter','photographer','poet'], personality:'International — expose massivement à l\'étranger.', unlockAtTier:2 },
];

// ── ALLIANCE SYSTEM ───────────────────────────────────────────

const ALLIANCE_TYPES = [
  { id:'co_promotion',  name:'Co-Promotion',      icon:'📣', desc:'Partage des campagnes promo. +15% réputation sur tous les projets.', costWeekly:2000,  repReq:30, bonus:{ repMult:0.15 }, duration: null },
  { id:'talent_share',  name:'Partage de Talents', icon:'🤝', desc:'Échanges d\'artistes pour collaborations. Accès à leurs artistes pour projets.', costWeekly:3500, repReq:40, bonus:{ talentShare:true }, duration: null },
  { id:'joint_festival',name:'Festival Commun',    icon:'🎪', desc:'Organisation d\'un festival conjoint. Revenus partagés, réputation massive.', costWeekly:0, repReq:50, bonus:{ festivalJoint:true }, duration: 8 },
  { id:'venue_network', name:'Réseau de Salles',   icon:'🏟️', desc:'Accès partagé au réseau de salles. -20% frais tournées.', costWeekly:1800, repReq:35, bonus:{ venueCostReduce:0.2 }, duration: null },
  { id:'label_merger',  name:'Fusion de Labels',   icon:'🏢', desc:'Fusion partielle. Partage des artistes et revenus (+20%).', costWeekly:8000, repReq:65, bonus:{ revenueMerge:0.2 }, duration: null },
];

// ── WORLD TOUR EVENT SYSTEM ───────────────────────────────────

const WORLD_EVENTS = [
  // Festivals mondiaux (nécessitent un contact ou réputation élevée)
  { id:'coachella_style',  name:'Soleil Desert Fest',   icon:'☀️', cityId:'los_angeles', capacity:125000, reward:150000, repGain:50, fameGain:55, risk:'high', types:['musician'], minFame:75, minRep:70, desc:'Le festival culte du désert californien. L\'affiche rêvée de tout musicien.' },
  { id:'glastonbury_style',name:'Green Fields Fest',    icon:'🌿', cityId:'london',      capacity:200000, reward:180000, repGain:60, fameGain:65, risk:'high', types:['musician'], minFame:80, minRep:75, desc:'Le grand festival vert anglais. Légende vivante.' },
  { id:'tomorrowland',     name:'Demain Électronique',  icon:'🌈', cityId:'amsterdam',   capacity:90000,  reward:120000, repGain:45, fameGain:50, risk:'medium',types:['musician'], minFame:65, minRep:55, desc:'Le temple de la musique électronique mondiale.' },
  { id:'venice_biennale',  name:'Biennale des Mondes',  icon:'🎨', cityId:'rome',        capacity:0,      reward:80000,  repGain:55, fameGain:40, risk:'medium',types:['painter','photographer'], minFame:60, minRep:50, desc:'La plus grande exposition d\'art contemporain au monde.' },
  { id:'afrobeats_fest',   name:'Lagos Sound Festival', icon:'🥁', cityId:'lagos',       capacity:80000,  reward:70000,  repGain:40, fameGain:45, risk:'medium',types:['musician'], minFame:55, minRep:40, desc:'Le festival afrobeats incontournable. Rayonnement continental.' },
  { id:'sxsw_style',       name:'Austin Tech & Music',  icon:'🤖', cityId:'nashville',   capacity:50000,  reward:90000,  repGain:35, fameGain:40, risk:'medium',types:['musician','comedian'], minFame:50, minRep:45, desc:'Musique + technologie. L\'industrie entière est là.' },
  { id:'fuji_rock',        name:'Montagne Électrique',  icon:'⛰️', cityId:'tokyo',       capacity:55000,  reward:110000, repGain:42, fameGain:48, risk:'high', types:['musician'], minFame:68, minRep:60, desc:'Festival légendaire aux pieds des montagnes japonaises.' },
  { id:'carnival_rio',     name:'Carnaval Culturel Rio',icon:'🎭', cityId:'rio_de_janeiro',capacity:500000,reward:200000, repGain:65, fameGain:70, risk:'high', types:['musician','comedian'], minFame:82, minRep:72, desc:'Le plus grand rassemblement culturel du monde. Exposition absolue.' },
];

// ── SECTOR-SPECIFIC EVENTS (par spécialité) ───────────────────

const SECTOR_EVENTS = {
  musician: [
    { name:'Showcase A&R Sony',        icon:'🎤', reward:25000, repGain:20, fameGain:18, risk:'medium', desc:'Présentation aux A&Rs de Sony. Si ça clique, contrat major.' },
    { name:'NRJ Music Awards',          icon:'🏆', reward:18000, repGain:28, fameGain:32, risk:'low',    desc:'Cérémonie télévisée nationale. Visibilité grand public.' },
    { name:'Late Night Show Live',      icon:'🌙', reward:12000, repGain:22, fameGain:28, risk:'low',    desc:'Performance live en late night. Des millions de téléspectateurs.' },
    { name:'Spotify Canvas Campaign',   icon:'🎵', reward:15000, repGain:12, fameGain:35, risk:'low',    desc:'Campagne officielle Spotify. Algorithme boosté pendant 3 semaines.' },
    { name:'Collab Vidéo YouTube',      icon:'▶️', reward:10000, repGain:15, fameGain:40, risk:'medium', desc:'Collaboration avec une chaîne YouTube à 5M abonnés.' },
    { name:'Festival Secret Set',       icon:'🔕', reward:30000, repGain:30, fameGain:35, risk:'high',   desc:'Set surprise non annoncé dans un grand festival. Légende potentielle.' },
  ],
  painter: [
    { name:'Christie\'s Auction',       icon:'🔨', reward:50000, repGain:35, fameGain:25, risk:'high',   desc:'Vente aux enchères chez Christie\'s. Prix record possible.' },
    { name:'Street Art Commission',     icon:'🏙️', reward:20000, repGain:25, fameGain:20, risk:'low',    desc:'Fresque commandée par une grande ville. Impact visuel permanent.' },
    { name:'Album Cover Art',           icon:'🎨', reward:15000, repGain:18, fameGain:30, risk:'low',    desc:'Créer la pochette d\'un album d\'un artiste connu. Exposition musicale.' },
    { name:'NFT Drop Majeur',           icon:'🖥️', reward:45000, repGain:15, fameGain:40, risk:'high',   desc:'Collection NFT. Peut cartonner ou flop total selon la hype.' },
    { name:'Musée National Expo',       icon:'🏛️', reward:25000, repGain:40, fameGain:22, risk:'medium', desc:'Exposition temporaire dans un musée national. Consécration critique.' },
  ],
  comedian: [
    { name:'Netflix Special Pitching',  icon:'📺', reward:60000, repGain:40, fameGain:45, risk:'high',   desc:'Pitching à Netflix pour un spécial. Jackpot si validé.' },
    { name:'Comedy Awards Nommé',       icon:'🏅', reward:10000, repGain:35, fameGain:25, risk:'low',    desc:'Nomination aux awards comedy. Validation professionnelle majeure.' },
    { name:'Prime Time TV Guest',       icon:'🌟', reward:18000, repGain:28, fameGain:35, risk:'low',    desc:'Invité vedette dans une émission prime time. Audience nationale.' },
    { name:'Tour Annonce Médias',       icon:'🗞️', reward:5000,  repGain:15, fameGain:20, risk:'low',    desc:'Annonce officielle d\'une tournée dans les médias. Anticipation.' },
  ],
  photographer: [
    { name:'National Geographic Feature',icon:'🌍',reward:30000, repGain:38, fameGain:28, risk:'low',    desc:'Reportage dans National Geographic. Reconnaissance mondiale.' },
    { name:'Fashion Week Shoot',         icon:'👗', reward:25000, repGain:22, fameGain:35, risk:'medium', desc:'Shooting exclusif pendant la Fashion Week. Réseau mode-art.' },
    { name:'Press Award Nommé',          icon:'📸', reward:8000,  repGain:30, fameGain:18, risk:'low',    desc:'Nominé aux prix de la presse photo. Crédibilité journalistique.' },
    { name:'Celebrity Portrait Series',  icon:'⭐', reward:40000, repGain:25, fameGain:42, risk:'medium', desc:'Série de portraits de célébrités pour un grand magazine.' },
  ],
  poet: [
    { name:'Prix Goncourt Poésie',       icon:'✍️', reward:20000, repGain:45, fameGain:20, risk:'low',   desc:'La plus haute récompense littéraire française. Légende assurée.' },
    { name:'TED Talk Spoken Word',       icon:'💡', reward:12000, repGain:28, fameGain:32, risk:'low',   desc:'Performance slam/spoken word diffusée mondialement sur TED.' },
    { name:'Slam Championship Europe',   icon:'🎤', reward:8000,  repGain:22, fameGain:28, risk:'medium',desc:'Championnat européen de slam. Champion = carrière lancée.' },
    { name:'Soundtrack Poem (Film)',      icon:'🎬', reward:18000, repGain:20, fameGain:25, risk:'medium',desc:'Poème intégré dans la B.O. d\'un film. Audience cinéma massive.' },
  ],
};

// ── CONTACT MEETING SYSTEM ────────────────────────────────────

function meetContact(contactId) {
  const contact = VIP_CONTACTS_POOL.find(c => c.id === contactId);
  if (!contact) return;
  if (G.unlockedContacts.includes(contactId)) { toast('ℹ️ Contact déjà dans votre réseau.', '#60a5fa'); return; }
  if (G.reputation < contact.unlockRep) { toast(`❌ Réputation insuffisante. (${contact.unlockRep} requise)`, '#ef4444'); return; }
  const meetCost = contact.rarity === 'legendary' ? 15000 : contact.rarity === 'epic' ? 8000 : contact.rarity === 'rare' ? 4000 : contact.rarity === 'uncommon' ? 2000 : 1000;
  if (G.money < meetCost) { toast(`❌ ${meetCost.toLocaleString()}€ requis pour rencontrer ce contact.`, '#ef4444'); return; }
  G.money -= meetCost; G.weekExpenses += meetCost;
  G.unlockedContacts.push(contactId);
  addNews(`🤝 ${contact.emoji} ${contact.name} (${contact.role}) rejoint votre réseau !`);
  toast(`🤝 ${contact.name} dans votre réseau !`, '#22c55e');
  renderContactsTab();
  renderHUD();
}

function getContactPassiveBonus(bonusKey) {
  let total = 0;
  (G.unlockedContacts || []).forEach(id => {
    const c = VIP_CONTACTS_POOL.find(x => x.id === id);
    if (c && c.passive && c.passive[bonusKey]) total += c.passive[bonusKey];
  });
  return total;
}

function hasContactBonus(bonusKey) {
  return (G.unlockedContacts || []).some(id => {
    const c = VIP_CONTACTS_POOL.find(x => x.id === id);
    return c && c.passive && c.passive[bonusKey];
  });
}

function generateAvailableContacts() {
  const unlocked = G.unlockedContacts || [];
  return VIP_CONTACTS_POOL.filter(c => !unlocked.includes(c.id));
}

// ── ALLIANCE SYSTEM FUNCTIONS ─────────────────────────────────

function proposeAlliance(rivalId, allianceTypeId) {
  const rival = (G.rivals || []).find(r => r.id === rivalId);
  const at = ALLIANCE_TYPES.find(a => a.id === allianceTypeId);
  if (!rival || !at) return;
  if (G.reputation < at.repReq) { toast(`❌ ${at.repReq} réputation requise.`, '#ef4444'); return; }
  // Check if already allied
  const existing = (G.alliances || []).find(a => a.rivalId === rivalId);
  if (existing) { toast('ℹ️ Alliance déjà active avec ce rival.', '#60a5fa'); return; }
  // Acceptance chance depends on rival style and rep diff
  const repDiff = G.reputation - rival.reputation;
  let acceptChance = 0.5 + repDiff * 0.005;
  if (rival.style === 'passive') acceptChance += 0.2;
  if (rival.style === 'aggressive') acceptChance -= 0.15;
  acceptChance = Math.max(0.1, Math.min(0.9, acceptChance));
  if (Math.random() < acceptChance) {
    G.alliances = G.alliances || [];
    G.alliances.push({ id: uid(), rivalId, rivalName: rival.name, rivalIcon: rival.icon, rivalColor: rival.color, allianceTypeId, name: at.name, icon: at.icon, bonus: at.bonus, costWeekly: at.costWeekly, startWeek: G.week, endWeek: at.duration ? G.week + at.duration : null, active: true });
    rival.isAllied = true;
    addNews(`🤝 Alliance "${at.name}" signée avec ${rival.icon} ${rival.name} !`);
    toast(`🤝 Alliance signée avec ${rival.name} !`, rival.color);
  } else {
    addNews(`❌ ${rival.icon} ${rival.name} a refusé votre proposition d'alliance.`);
    toast(`😤 ${rival.name} a refusé l'alliance.`, '#ef4444');
  }
  renderRivalsTab();
}

function breakAlliance(allianceId) {
  const idx = (G.alliances || []).findIndex(a => a.id === allianceId);
  if (idx === -1) return;
  const al = G.alliances[idx];
  const rival = (G.rivals || []).find(r => r.id === al.rivalId);
  if (rival) { rival.isAllied = false; rival.reputation = Math.min(100, rival.reputation + 5); } // Rival gets slight boost from betrayal
  G.alliances.splice(idx, 1);
  G.reputation = Math.max(0, G.reputation - 5);
  addNews(`💔 Alliance brisée avec ${al.rivalIcon} ${al.rivalName}. -5 réputation.`);
  toast(`💔 Alliance rompue.`, '#ef4444');
  renderRivalsTab();
}

function processAlliances() {
  if (!G.alliances || G.alliances.length === 0) return;
  G.alliances.forEach(al => {
    if (!al.active) return;
    // Pay weekly cost
    if (al.costWeekly > 0) {
      if (G.money < al.costWeekly) {
        al.active = false;
        addNews(`⚠️ Alliance "${al.name}" suspendue — fonds insuffisants.`);
        return;
      }
      G.money -= al.costWeekly; G.weekExpenses += al.costWeekly;
    }
    // Apply passive bonuses already applied at calculation time
    // Check expiry
    if (al.endWeek && G.week >= al.endWeek) {
      al.active = false;
      addNews(`✅ Alliance "${al.name}" avec ${al.rivalIcon} ${al.rivalName} terminée.`);
    }
  });
  G.alliances = G.alliances.filter(a => a.active !== false || !a.endWeek);
}

function getAllianceBonus(bonusKey) {
  let total = 0;
  (G.alliances || []).filter(a => a.active !== false).forEach(al => {
    if (al.bonus && al.bonus[bonusKey]) total += al.bonus[bonusKey];
  });
  return total;
}

// ── RENDER : CONTACTS TAB ─────────────────────────────────────

function renderContactsTab() {
  const pane = document.getElementById('pane-contacts');
  if (!pane) return;
  const unlocked = G.unlockedContacts || [];
  const available = generateAvailableContacts();
  const myContacts = VIP_CONTACTS_POOL.filter(c => unlocked.includes(c.id));
  const rarityColor = { common: '#6b7280', uncommon: '#22c55e', rare: '#60a5fa', epic: '#a855f7', legendary: '#f5c842' };
  const meetCostByRarity = { legendary: 15000, epic: 8000, rare: 4000, uncommon: 2000, common: 1000 };

  pane.innerHTML = `
    <div class="pane-header">
      <h2>🤝 Contacts VIP</h2>
    </div>
    <div class="market-note">Développez votre réseau pour débloquer des bonus permanents sur vos projets.</div>

    ${myContacts.length > 0 ? `
    <div style="margin-bottom:1.5rem">
      <div class="dash-card-title" style="margin-bottom:.8rem">📋 Mon Réseau (${myContacts.length})</div>
      <div class="contacts-grid">
        ${myContacts.map(c => `
          <div class="contact-card unlocked" style="border-color:${rarityColor[c.rarity]}40">
            <div style="display:flex;align-items:center;gap:.6rem;margin-bottom:.5rem">
              <span style="font-size:1.8rem">${c.emoji}</span>
              <div>
                <div style="font-weight:800;font-size:.88rem">${c.name}</div>
                <div style="font-size:.68rem;color:${rarityColor[c.rarity]}">${c.role}</div>
              </div>
              <div style="margin-left:auto;font-size:.6rem;padding:.15rem .4rem;border-radius:4px;background:${rarityColor[c.rarity]}25;color:${rarityColor[c.rarity]};text-transform:uppercase">${c.rarity}</div>
            </div>
            <div style="font-size:.72rem;color:var(--green);padding:.3rem .5rem;background:rgba(34,197,94,.08);border-radius:5px">✅ ${c.benefit}</div>
          </div>`).join('')}
      </div>
    </div>` : ''}

    <div class="dash-card-title" style="margin-bottom:.8rem">🔍 Contacts Disponibles</div>
    <div class="contacts-grid">
      ${available.sort((a,b)=>a.unlockRep - b.unlockRep).map(c => {
        const canUnlock = G.reputation >= c.unlockRep;
        const cost = meetCostByRarity[c.rarity] || 1000;
        const canAfford = G.money >= cost;
        return `
        <div class="contact-card ${canUnlock ? '' : 'locked'}" style="border-color:${rarityColor[c.rarity]}${canUnlock ? '60' : '20'}">
          <div style="display:flex;align-items:center;gap:.6rem;margin-bottom:.5rem">
            <span style="font-size:1.8rem;${canUnlock ? '' : 'filter:grayscale(1);opacity:.5'}">${c.emoji}</span>
            <div style="flex:1">
              <div style="font-weight:800;font-size:.88rem;${canUnlock ? '' : 'opacity:.5'}">${c.name}</div>
              <div style="font-size:.68rem;color:${rarityColor[c.rarity]}">${c.role}</div>
            </div>
            <div style="font-size:.6rem;padding:.15rem .4rem;border-radius:4px;background:${rarityColor[c.rarity]}25;color:${rarityColor[c.rarity]};text-transform:uppercase">${c.rarity}</div>
          </div>
          <div style="font-size:.72rem;color:var(--muted);margin-bottom:.4rem">${c.desc}</div>
          <div style="font-size:.72rem;color:var(--green);margin-bottom:.6rem">🎁 ${c.benefit}</div>
          <div style="font-size:.65rem;color:var(--muted);margin-bottom:.5rem">
            Spécialité: ${c.specialty.includes('all') ? 'Tous artistes' : c.specialty.map(t => TYPE_LABELS[t] || t).join(', ')} · 
            Réputation: ${c.unlockRep}+ · 
            Coût rencontre: ${cost.toLocaleString()}€
          </div>
          <button class="btn-action ${canUnlock && canAfford ? 'green' : ''}" ${canUnlock && canAfford ? '' : 'disabled'}
            onclick="meetContact('${c.id}')">
            ${!canUnlock ? `🔒 ${c.unlockRep} réputation requise` : !canAfford ? `❌ ${cost.toLocaleString()}€ requis` : `🤝 Rencontrer (${cost.toLocaleString()}€)`}
          </button>
        </div>`;
      }).join('')}
    </div>
  `;
}

// ── RENDER : RIVALS TAB (v2 avec alliances) ──────────────────

function renderRivalsTabV2() {
  const pane = document.getElementById('pane-rivals');
  if (!pane) return;
  if (!G.rivals || G.rivals.length === 0) { pane.innerHTML = '<div class="empty-state">Aucun rival détecté.</div>'; return; }

  const pending = Array.isArray(G.pendingOffers) ? G.pendingOffers : [];
  const myAlliances = G.alliances || [];

  const pendingHTML = pending.length > 0 ? `
    <div class="rivals-alert">
      <div style="font-size:1rem;font-weight:800;color:var(--red)">⚠️ Offres rivales en attente !</div>
      ${pending.map(o => `
        <div style="font-size:.85rem;margin:.5rem 0">${o.rivalIcon} <strong>${o.rivalName}</strong> propose <strong style="color:var(--gold)">${o.offerSalary.toLocaleString()}€/sem.</strong> à ${o.artistEmoji} ${o.artistName}</div>
        <button class="btn-action red" style="font-size:.8rem;padding:.4rem .8rem" onclick="openRivalOfferModal('${o.id}')">Répondre</button>
      `).join('')}
    </div>` : '';

  const alliancesHTML = myAlliances.filter(a => a.active !== false).length > 0 ? `
    <div class="dash-card" style="margin-bottom:1rem;border-color:var(--green)40">
      <div class="dash-card-title" style="color:var(--green)">🤝 Alliances actives</div>
      ${myAlliances.filter(a => a.active !== false).map(al => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:.5rem 0;border-bottom:1px solid var(--border);font-size:.8rem">
          <span>${al.rivalIcon} <strong style="color:${al.rivalColor}">${al.rivalName}</strong> — ${al.icon} ${al.name}</span>
          ${al.costWeekly > 0 ? `<span style="color:var(--muted)">-${al.costWeekly.toLocaleString()}€/sem.</span>` : ''}
          <button class="btn-action red" style="font-size:.65rem;padding:.2rem .5rem" onclick="breakAlliance('${al.id}')">Rompre</button>
        </div>`).join('')}
    </div>` : '';

  pane.innerHTML = `
    <div class="pane-header"><h2>⚔️ Labels Rivaux</h2></div>
    <div class="market-note">Surveillez, espionnez, sabotez — ou proposez des alliances stratégiques.</div>
    ${pendingHTML}
    ${alliancesHTML}
    <div class="rivals-grid">
      ${G.rivals.map(rival => {
        const rTier = LABEL_TIERS[rival.tier] || LABEL_TIERS[0];
        const isAhead = rival.tier >= G.labelTier;
        const spyCost = 5000 + G.labelTier * 2000;
        const sabCost = 12000 + G.labelTier * 4000;
        const allied = myAlliances.find(a => a.rivalId === rival.id && a.active !== false);
        const rivalInfo = RIVAL_TEMPLATES_V2.find(t => t.id === rival.id) || {};
        return `
          <div class="rival-card" style="border-color:${allied ? 'var(--green)' : rival.color}50;${isAhead ? `background:linear-gradient(135deg,${rival.color}08,transparent)` : ''}">
            <div class="rival-header">
              <div style="font-size:2.5rem">${rival.icon}</div>
              <div>
                <div style="font-weight:800;font-size:1rem;color:${rival.color}">${rival.name}</div>
                <div style="font-size:.65rem;color:var(--muted);margin-top:.2rem">${rivalInfo.type ? rivalInfo.type.toUpperCase() : ''} · ${rival.style === 'aggressive' ? '🔥 Agressif' : rival.style === 'balanced' ? '⚖️ Équilibré' : rival.style === 'passive' ? '🛡️ Passif' : rival.style === 'viral' ? '📱 Viral' : rival.style === 'corporate' ? '💼 Corporate' : '⚡ ' + rival.style}</div>
                ${rivalInfo.personality ? `<div style="font-size:.62rem;color:var(--muted);font-style:italic;margin-top:.2rem">${rivalInfo.personality}</div>` : ''}
              </div>
              ${allied ? '<div style="font-size:.68rem;padding:.2rem .5rem;background:rgba(34,197,94,.15);color:var(--green);border:1px solid var(--green);border-radius:6px">ALLIÉ</div>' : (isAhead && rival.tier > G.labelTier ? '<div style="font-size:.68rem;padding:.2rem .5rem;background:rgba(239,68,68,.15);color:var(--red);border:1px solid var(--red);border-radius:6px">DEVANT VOUS</div>' : '')}
            </div>
            <div class="rival-stats">
              <div class="rival-stat"><div class="rival-stat-val">${rTier.icon} ${rTier.name}</div><div class="rival-stat-lbl">Palier</div></div>
              <div class="rival-stat"><div class="rival-stat-val" style="color:var(--purple)">${rival.reputation.toFixed(0)}</div><div class="rival-stat-lbl">Réputation</div></div>
              ${rival.spied ? `<div class="rival-stat"><div class="rival-stat-val" style="color:var(--gold)">${rival.money.toLocaleString()}€</div><div class="rival-stat-lbl">Tréso.</div></div>` : `<div class="rival-stat"><div class="rival-stat-val" style="color:var(--muted)">???</div><div class="rival-stat-lbl">Trésorerie</div></div>`}
              <div class="rival-stat"><div class="rival-stat-val" style="color:var(--red)">${rival.artistsDebauched.length}</div><div class="rival-stat-lbl">Débauché(e)s</div></div>
            </div>
            ${rival.artistsDebauched.length > 0 ? `<div style="font-size:.7rem;color:var(--muted);margin:.4rem 0">Leur roster: ${rival.artistsDebauched.map(a => `${a.emoji}${a.name}`).join(', ')}</div>` : ''}
            ${rival.lastAction ? `<div style="font-size:.68rem;color:var(--muted);font-style:italic;margin-bottom:.6rem">Dernière action : ${rival.lastAction}</div>` : ''}
            ${!allied ? `
            <div style="margin-bottom:.6rem">
              <div style="font-size:.72rem;color:var(--muted);margin-bottom:.4rem">⚔️ Actions hostiles</div>
              <div style="display:flex;gap:.5rem;flex-wrap:wrap">
                <button class="btn-action blue" onclick="spyOnRival('${rival.id}')" style="font-size:.72rem">🕵️ Espionner (${spyCost.toLocaleString()}€)</button>
                <button class="btn-action red"  onclick="sabotageRival('${rival.id}')" style="font-size:.72rem">💣 Saboter (${sabCost.toLocaleString()}€)</button>
              </div>
            </div>
            <div>
              <div style="font-size:.72rem;color:var(--green);margin-bottom:.4rem">🤝 Proposer Alliance</div>
              <div style="display:flex;gap:.4rem;flex-wrap:wrap">
                ${ALLIANCE_TYPES.map(at => {
                  const can = G.reputation >= at.repReq;
                  return `<button class="btn-action ${can ? '' : ''}" style="font-size:.65rem;padding:.3rem .5rem;${can ? 'border-color:var(--green);color:var(--green)' : 'opacity:.4'}" ${can ? '' : 'disabled'} onclick="proposeAlliance('${rival.id}','${at.id}')">
                    ${at.icon} ${at.name}${at.costWeekly > 0 ? ` (-${(at.costWeekly/1000).toFixed(1)}k/sem)` : ''}
                  </button>`;
                }).join('')}
              </div>
            </div>` : `
            <div style="padding:.6rem;background:rgba(34,197,94,.08);border-radius:8px;font-size:.75rem;color:var(--green)">
              ✅ Alliance active : ${ALLIANCE_TYPES.find(a => a.id === allied.allianceTypeId)?.desc || ''}
            </div>`}
          </div>`;
      }).join('')}
    </div>
  `;
}

// ── RENDER : WORLD MAP ────────────────────────────────────────

function renderWorldMapTab() {
  const pane = document.getElementById('pane-worldmap');
  if (!pane) return;
  const allCities = getAllCities();
  const visitedCities = G.visitedCities || [];

  pane.innerHTML = `
    <div class="pane-header"><h2>🌍 Carte du Monde</h2></div>
    <div class="market-note">Organisez des concerts, festivals et expositions dans le monde entier.</div>
    <div class="world-map-grid">
      ${WORLD_MAP.regions.map(region => `
        <div class="region-card">
          <div class="region-header" style="border-bottom:2px solid ${region.color}40">
            <span style="font-size:1.5rem">${region.emoji}</span>
            <span style="font-weight:800;color:${region.color}">${region.name}</span>
          </div>
          ${region.countries.map(country => `
            <div class="country-section">
              <div style="font-size:.75rem;font-weight:700;color:${country.color};margin:.5rem 0 .3rem;display:flex;align-items:center;gap:.4rem">
                <span>${country.emoji}</span> ${country.name}
                <span style="font-size:.6rem;padding:.1rem .3rem;background:rgba(255,255,255,.08);border-radius:3px;margin-left:auto">Hype: ${country.hype}%</span>
              </div>
              <div class="city-list">
                ${country.cities.map(city => {
                  const visited = visitedCities.includes(city.id);
                  return `
                  <div class="city-row ${visited ? 'visited' : ''}" onclick="openCityModal('${city.id}')">
                    <span style="font-size:1rem">${city.emoji}</span>
                    <div style="flex:1">
                      <div style="font-size:.8rem;font-weight:700">${city.name}</div>
                      <div style="font-size:.6rem;color:var(--muted)">${city.types.join(' · ')} · Cap. ${city.capacity > 0 ? (city.capacity/1000).toFixed(0)+'k' : 'illimitée'}</div>
                    </div>
                    <div style="text-align:right">
                      <div style="font-size:.65rem;color:var(--gold)">Prestige: ${city.prestige}</div>
                      ${visited ? '<div style="font-size:.55rem;color:var(--green)">✅ Visité</div>' : ''}
                    </div>
                  </div>`;
                }).join('')}
              </div>
            </div>`).join('')}
        </div>`).join('')}
    </div>
    <div style="margin-top:1.5rem">
      <div class="dash-card-title">🌟 Événements Mondiaux Exclusifs</div>
      <div class="market-note" style="margin-top:.3rem">Nécessitent réputation et notoriété élevées</div>
      <div class="events-grid" style="margin-top:.8rem">
        ${WORLD_EVENTS.map(ev => {
          const eligible = G.artists.filter(a => ev.types.includes(a.type) && a.fame >= ev.minFame && !G.projects.some(p => p.artists.includes(a.id)) && (a.blockedWeeks || 0) <= 0);
          const repOk = G.reputation >= ev.minRep;
          const canParticipate = eligible.length > 0 && repOk;
          const city = getCityById(ev.cityId);
          return `
          <div class="event-card" style="${canParticipate ? '' : 'opacity:.6'}">
            <div class="ev-header">
              <span class="ev-icon">${ev.icon}</span>
              <span class="ev-badge ${ev.risk}">${ev.risk === 'high' ? 'Risqué' : ev.risk === 'medium' ? 'Modéré' : 'Sûr'}</span>
            </div>
            <div class="ev-name">${ev.name}</div>
            ${city ? `<div style="font-size:.68rem;color:var(--muted);margin-bottom:.3rem">📍 ${city.emoji} ${city.name}, ${city.countryName}</div>` : ''}
            <div class="ev-desc">${ev.desc}</div>
            <div class="ev-rewards">
              <span class="ev-reward" style="color:var(--gold)">💰 ${ev.reward.toLocaleString()}€</span>
              <span class="ev-reward" style="color:var(--purple)">⭐ +${ev.repGain}</span>
              <span class="ev-reward" style="color:var(--blue)">🌟 +${ev.fameGain}</span>
            </div>
            <div style="font-size:.65rem;color:var(--orange);margin:.3rem 0">Min: ⭐${ev.minFame} notoriété · 🏅${ev.minRep} réputation</div>
            <button class="btn-participate" ${canParticipate ? '' : 'disabled'} onclick="participateWorldEvent('${ev.id}')">
              ${!repOk ? `🔒 ${ev.minRep} rép. requise` : eligible.length === 0 ? '❌ Artiste éligible requis' : '🌍 Participer'}
            </button>
          </div>`;
        }).join('')}
      </div>
    </div>
  `;
}

function openCityModal(cityId) {
  const city = getCityById(cityId);
  if (!city) return;
  const eligibleArtists = G.artists.filter(a => !G.projects.some(p => p.artists.includes(a.id)) && (a.blockedWeeks || 0) <= 0);
  const sectorEvs = [];
  Object.entries(SECTOR_EVENTS).forEach(([type, evs]) => {
    evs.forEach(ev => sectorEvs.push({ ...ev, artistType: type }));
  });
  document.getElementById('city-modal-content').innerHTML = `
    <div style="text-align:center;margin-bottom:1rem">
      <div style="font-size:3rem">${city.emoji}</div>
      <div style="font-weight:800;font-size:1.2rem">${city.name}</div>
      <div style="font-size:.75rem;color:var(--muted)">${city.countryEmoji} ${city.countryName} · ${city.regionName}</div>
      <div style="display:flex;justify-content:center;gap:1rem;margin-top:.6rem;flex-wrap:wrap">
        <span style="font-size:.72rem;color:var(--gold)">🏆 Prestige: ${city.prestige}</span>
        ${city.capacity > 0 ? `<span style="font-size:.72rem;color:var(--blue)">👥 Cap: ${(city.capacity/1000).toFixed(0)}k</span>` : ''}
        <span style="font-size:.72rem;color:var(--purple)">💰 Venue: ${city.venueCost.toLocaleString()}€</span>
      </div>
      <div style="font-size:.7rem;color:var(--muted);margin-top:.4rem">Types: ${city.types.join(', ')}</div>
    </div>
    <div style="font-size:.8rem;font-weight:700;margin-bottom:.6rem">🎤 Événements disponibles dans cette ville :</div>
    <div style="display:flex;flex-direction:column;gap:.6rem">
      ${sectorEvs.filter(ev => eligibleArtists.some(a => a.type === ev.artistType)).slice(0, 4).map(ev => {
        const cost = Math.round(city.venueCost * 0.3);
        const canAfford = G.money >= cost;
        return `
          <div style="padding:.7rem;border:1px solid var(--border);border-radius:8px">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.3rem">
              <span style="font-weight:700;font-size:.85rem">${ev.icon} ${ev.name}</span>
              <span class="ev-badge ${ev.risk}">${ev.risk === 'high' ? 'Risqué' : 'Modéré'}</span>
            </div>
            <div style="font-size:.7rem;color:var(--muted);margin-bottom:.4rem">${ev.desc}</div>
            <div style="font-size:.7rem;display:flex;gap:.6rem;margin-bottom:.5rem">
              <span style="color:var(--gold)">+${Math.round(ev.reward * city.prestige/100 * 1.2).toLocaleString()}€</span>
              <span style="color:var(--purple)">+${Math.round(ev.repGain * city.prestige/100 * 1.5)} rép</span>
              <span style="color:var(--muted)">Frais: ${cost.toLocaleString()}€</span>
            </div>
            <div class="pm-artist-grid" style="margin-bottom:.4rem">
              ${eligibleArtists.filter(a => a.type === ev.artistType).map(a => `
                <button class="pm-artist-btn" style="font-size:.65rem;padding:.4rem" onclick="performCityEvent('${cityId}','${a.id}','${ev.name}',${ev.reward},${ev.repGain},${ev.fameGain},'${ev.risk}')">
                  ${a.emoji} ${a.name}
                </button>`).join('')}
            </div>
          </div>`;
      }).join('') || '<div style="color:var(--muted);font-size:.8rem">Aucun artiste disponible pour cette ville.</div>'}
    </div>
  `;
  document.getElementById('city-modal').classList.add('show');
}

function performCityEvent(cityId, artistId, evName, reward, repGain, fameGain, risk) {
  const city = getCityById(cityId);
  const a = G.artists.find(x => x.id === artistId);
  if (!city || !a) return;
  const cost = Math.round(city.venueCost * 0.3);
  if (G.money < cost) { toast(`❌ ${cost.toLocaleString()}€ requis.`, '#ef4444'); return; }
  G.money -= cost; G.weekExpenses += cost;
  const failChance = risk === 'high' ? 0.28 : risk === 'medium' ? 0.14 : 0.05;
  const prep = ((a.energy || 100) + (a.mood || 100) + a.charisma) / 300;
  const finalFail = Math.max(0.03, failChance - (prep - 0.65) * 0.15);
  const success = Math.random() > finalFail;
  const prestigeMult = city.prestige / 80;
  if (success) {
    const rev = Math.round(reward * prestigeMult * getProjectRewardMultiplier() * (1 + getContactPassiveBonus('intlBonus')));
    const rep = Math.round(repGain * prestigeMult * getRepGainMultiplier());
    const fame = Math.round(fameGain * prestigeMult * getRepGainMultiplier());
    G.money += rev; G.weekRevenue += rev;
    G.reputation = Math.min(100, G.reputation + rep);
    a.fame = Math.min(100, a.fame + fame);
    a.energy = Math.max(0, (a.energy || 100) - rand(8, 15));
    a.happiness = clamp((a.happiness || 70) + 10, 0, 100);
    a.history.push(`✅ ${evName} à ${city.name} ! +${rev.toLocaleString()}€`);
    if (!G.visitedCities) G.visitedCities = [];
    if (!G.visitedCities.includes(cityId)) G.visitedCities.push(cityId);
    addNews(`🌍 ${a.emoji} ${a.name} : succès à ${city.emoji} ${city.name} "${evName}" ! +${rev.toLocaleString()}€`);
    toast(`🎊 Succès à ${city.name} !`, '#22c55e');
  } else {
    const penalty = Math.round(reward * 0.15);
    G.money = Math.max(0, G.money - penalty);
    a.energy = Math.max(0, (a.energy || 100) - rand(12, 20));
    a.happiness = clamp((a.happiness || 70) - 8, 0, 100);
    addNews(`😬 ${a.emoji} ${a.name} : prestation difficile à ${city.emoji} ${city.name}.`);
    toast(`💥 Raté à ${city.name}.`, '#ef4444');
  }
  document.getElementById('city-modal').classList.remove('show');
  renderAll();
}

function participateWorldEvent(evId) {
  const ev = WORLD_EVENTS.find(e => e.id === evId);
  if (!ev) return;
  const eligible = G.artists.filter(a => ev.types.includes(a.type) && a.fame >= ev.minFame && !G.projects.some(p => p.artists.includes(a.id)) && (a.blockedWeeks || 0) <= 0);
  if (eligible.length === 0) { toast('❌ Aucun artiste éligible.', '#ef4444'); return; }
  openEventModal(ev, eligible);
}

function closeCityModal() { document.getElementById('city-modal').classList.remove('show'); }