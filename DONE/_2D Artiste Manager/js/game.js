// =============================================================
//  ARTVIBE MANAGER — game.js  (v3 — Label Empire Edition)
// =============================================================

// ── ARTIST TEMPLATES ─────────────────────────────────────────

const ARTIST_TEMPLATES = [
  // MUSICIENS (EXISTANTS)
  { name:'Lucas Morel',    type:'musician',     emoji:'🎸', skills:['Guitare','Rock','Composition'], desc:'Guitariste indie avec une âme de rebelle. Fort potentiel scénique.', baseFame:30, baseTalent:72, baseCharisma:65, weeklyFee:2200 },
  { name:'Sofia Ren',      type:'musician',     emoji:'🎹', skills:['Piano','Jazz','Arrangements'], desc:'Pianiste de jazz classique reconvertie au néo-soul. Doigts magiques.', baseFame:45, baseTalent:88, baseCharisma:70, weeklyFee:2800 },
  { name:'Marcus DJ',      type:'musician',     emoji:'🎧', skills:['Électro','Mix','Production'], desc:'DJ électro techno, scènes underground de Paris. Flow imparable.', baseFame:55, baseTalent:80, baseCharisma:90, weeklyFee:3200 },
  { name:'Amara Diallo',   type:'musician',     emoji:'🎤', skills:['Chant','R&B','Écriture'], desc:'Voix soul à couper le souffle. Auteure-compositrice depuis 16 ans.', baseFame:62, baseTalent:92, baseCharisma:85, weeklyFee:3600 },
  { name:'Théo Blanchard', type:'musician',     emoji:'🥁', skills:['Batterie','Jazz','Fusion'], desc:'Batteur de jazz-fusion, percussionniste hors pair.', baseFame:28, baseTalent:78, baseCharisma:55, weeklyFee:1900 },

  // MUSICIENS (NOUVEAUX - PLUS “COTÉS” + STATS + EXTRAS OPTIONNELS)
  { name:'Mila Kova',      type:'musician', emoji:'🎙️', skills:['Pop','Topline','Performance'], desc:'Pop star calibrée radio, refrains qui restent 3 jours en tête. Machine à hooks.', baseFame:82, baseTalent:84, baseCharisma:96, weeklyFee:5200, rarity:'epic', genre:'Pop', traits:['Hitmaker','Viral'], popularity:94, stamina:78, stagePower:92, fanbase:'mainstream', controversy:18 },
  { name:'Yanis Keller',   type:'musician', emoji:'🎸', skills:['Metal','Shred','Live'], desc:'Guitar hero metal moderne. Solos chirurgicaux, présence scénique brutale.', baseFame:60, baseTalent:94, baseCharisma:74, weeklyFee:4300, rarity:'rare', genre:'Metal', traits:['Virtuose','Headbanger'], popularity:68, stamina:90, stagePower:88, fanbase:'niche', controversy:25 },
  { name:'Aya N’Doye',     type:'musician', emoji:'🎤', skills:['Afrobeat','Chant','Danse'], desc:'Afrobeat solaire, chorés millimétrées. Fait lever une foule en 10 secondes.', baseFame:74, baseTalent:88, baseCharisma:93, weeklyFee:4800, rarity:'epic', genre:'Afrobeat', traits:['Showtime','Groove'], popularity:86, stamina:92, stagePower:95, fanbase:'mainstream', controversy:12 },
  { name:'Ryo Sakamoto',   type:'musician', emoji:'🎻', skills:['Violoncelle','Classique','Crossover'], desc:'Virtuose crossover. Mélange classique/électro, frissons garantis.', baseFame:58, baseTalent:96, baseCharisma:67, weeklyFee:4100, rarity:'rare', genre:'Crossover', traits:['Émotion','Technique'], popularity:62, stamina:70, stagePower:76, fanbase:'artsy', controversy:8 },
  { name:'Nina Velasquez', type:'musician', emoji:'🎺', skills:['Trompette','Latin Jazz','Impro'], desc:'Trompettiste latin-jazz, impro explosive. Groove et élégance.', baseFame:49, baseTalent:90, baseCharisma:79, weeklyFee:3300, rarity:'uncommon', genre:'Latin Jazz', traits:['Impro','Groove'], popularity:55, stamina:82, stagePower:80, fanbase:'artsy', controversy:6 },
  { name:'Khaled “K-Low”', type:'musician', emoji:'🎛️', skills:['Rap','Beatmaking','Freestyle'], desc:'Rappeur-producteur, punchlines propres, prod maison. Freestyle redoutable.', baseFame:68, baseTalent:86, baseCharisma:91, weeklyFee:4500, rarity:'rare', genre:'Rap', traits:['Wordplay','Studio Rat'], popularity:80, stamina:85, stagePower:89, fanbase:'mainstream', controversy:35 },
  { name:'Zoe Harper',     type:'musician', emoji:'🎼', skills:['Songwriting','Indie Pop','Arrangements'], desc:'Songwriter indie-pop. Mélodies sensibles, arrangements précis.', baseFame:52, baseTalent:89, baseCharisma:72, weeklyFee:3100, rarity:'uncommon', genre:'Indie Pop', traits:['Auteur','Sincère'], popularity:58, stamina:74, stagePower:70, fanbase:'niche', controversy:9 },
  { name:'Hugo Marceau',   type:'musician', emoji:'🎹', skills:['Synthwave','Sound Design','Production'], desc:'Architecte synthwave. Textures rétro-futuristes, sound design premium.', baseFame:57, baseTalent:87, baseCharisma:77, weeklyFee:3400, rarity:'uncommon', genre:'Synthwave', traits:['SoundDesign','Nocturne'], popularity:66, stamina:76, stagePower:78, fanbase:'niche', controversy:14 },
  { name:'Selma Ait-Ben',  type:'musician', emoji:'🪗', skills:['Accordéon','World','Scène'], desc:'Accordéon moderne, world-music. Charme instantané sur scène.', baseFame:46, baseTalent:85, baseCharisma:84, weeklyFee:2600, rarity:'common', genre:'World', traits:['Chaleur','Festif'], popularity:50, stamina:80, stagePower:83, fanbase:'artsy', controversy:5 },
  { name:'Noah Stein',     type:'musician', emoji:'🎸', skills:['Funk','Basse','Groove'], desc:'Bassiste funk. Groove métronomique, fait danser n’importe qui.', baseFame:44, baseTalent:83, baseCharisma:81, weeklyFee:2400, rarity:'common', genre:'Funk', traits:['Groove','Solid'], popularity:49, stamina:88, stagePower:79, fanbase:'niche', controversy:7 },
  { name:'Luna Petrova',   type:'musician', emoji:'🎧', skills:['House','DJ','Curating'], desc:'DJ house, sets ultra narratifs. Sait lire une salle comme personne.', baseFame:66, baseTalent:82, baseCharisma:92, weeklyFee:3900, rarity:'rare', genre:'House', traits:['Curator','Club'], popularity:78, stamina:84, stagePower:90, fanbase:'mainstream', controversy:22 },
  { name:'Bastien Roux',   type:'musician', emoji:'🥁', skills:['Batterie','Pop','Timing'], desc:'Batteur studio/live. Timing parfait, rend tout plus “radio friendly”.', baseFame:35, baseTalent:84, baseCharisma:58, weeklyFee:2100, rarity:'common', genre:'Pop', traits:['Pro','Reliable'], popularity:40, stamina:86, stagePower:62, fanbase:'niche', controversy:4 },
  { name:'Sana Kim',       type:'musician', emoji:'🎤', skills:['K-Pop','Chant','Chorégraphie'], desc:'Idole K-pop. Précision, énergie, fanbase ultra engagée.', baseFame:88, baseTalent:85, baseCharisma:97, weeklyFee:6500, rarity:'legendary', genre:'K-Pop', traits:['Icon','Fandom'], popularity:98, stamina:94, stagePower:97, fanbase:'mainstream', controversy:28 },
  { name:'Dimitri Volkov', type:'musician', emoji:'🎻', skills:['Violon','Techno','Live Act'], desc:'Violon + techno live act. Banger après banger, concept scénique fort.', baseFame:63, baseTalent:90, baseCharisma:86, weeklyFee:4200, rarity:'rare', genre:'Techno', traits:['Crossover','LiveAct'], popularity:73, stamina:83, stagePower:91, fanbase:'niche', controversy:20 },
  { name:'Inès Belcour',   type:'musician', emoji:'🎙️', skills:['Chant','Néo-soul','Harmonies'], desc:'Néo-soul intimiste. Harmonies velours, live très propre.', baseFame:54, baseTalent:91, baseCharisma:79, weeklyFee:3600, rarity:'rare', genre:'Néo-soul', traits:['Velours','Live'], popularity:60, stamina:72, stagePower:74, fanbase:'artsy', controversy:10 },
  { name:'Rafael Costa',   type:'musician', emoji:'🪘', skills:['Percussions','Brésil','Rythme'], desc:'Percussionniste brésilien. Rythmes organiques, énergie collective.', baseFame:41, baseTalent:82, baseCharisma:76, weeklyFee:2300, rarity:'common', genre:'World', traits:['Rythme','Collectif'], popularity:44, stamina:91, stagePower:77, fanbase:'niche', controversy:6 },

  // NOUVELLE VAGUE — artistes émergents, scènes et publics distincts.
  { name:'Sasha Nyota', type:'musician', emoji:'🎤', skills:['Amapiano','Afropop','Topline'], desc:'Chanteuse-productrice révélée par ses performances live et ses collaborations.', baseFame:22, baseTalent:82, baseCharisma:90, weeklyFee:1700, rarity:'common', genre:'Amapiano', traits:['Live','Groove'], popularity:33, stamina:88, stagePower:83, fanbase:'niche', controversy:5 },
  { name:'Eliot Sombre', type:'musician', emoji:'🎸', skills:['Rock alternatif','Composition','Scène'], desc:'Auteur rock alternatif entre riffs nerveux et ballades intimistes.', baseFame:17, baseTalent:89, baseCharisma:66, weeklyFee:1450, rarity:'common', genre:'Alternative Rock', traits:['Auteur','Live'], popularity:24, stamina:79, stagePower:88, fanbase:'niche', controversy:9 },
  { name:'Naya Flux', type:'musician', emoji:'🎛️', skills:['Hypertrap','Beatmaking','Rap'], desc:'Beatmakeuse et rappeuse capable de produire ses propres titres.', baseFame:34, baseTalent:87, baseCharisma:80, weeklyFee:2100, rarity:'uncommon', genre:'Hypertrap', traits:['Studio Rat','Viral'], popularity:42, stamina:81, stagePower:77, fanbase:'niche', controversy:12 },
  { name:'Gabriel Lune', type:'musician', emoji:'🎹', skills:['R&B','Piano','Harmonies'], desc:'Compositeur R&B indépendant, spécialiste des harmonies vocales.', baseFame:19, baseTalent:92, baseCharisma:69, weeklyFee:1650, rarity:'common', genre:'R&B', traits:['Auteur','Émotion'], popularity:28, stamina:72, stagePower:73, fanbase:'artsy', controversy:3 },
  { name:'Mina Sol', type:'musician', emoji:'🎙️', skills:['Dancehall','Chant','Performance'], desc:'Artiste dancehall au fort potentiel scénique, encore peu connue.', baseFame:26, baseTalent:78, baseCharisma:94, weeklyFee:1800, rarity:'uncommon', genre:'Dancehall', traits:['Showtime','Groove'], popularity:39, stamina:91, stagePower:96, fanbase:'niche', controversy:10 },

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

// ── LABEL TIERS ──────────────────────────────────────────────

const LABEL_TIERS = [
  { id:0, name:'Garage',               icon:'🏠', desc:'Tes débuts depuis une pièce chez toi. Tout est possible.', maxArtists:3,  maxProjects:1,  unlockCost:0,       unlockRep:0,  weeklyBonus:0,     color:'#6b7280' },
  { id:1, name:'Studio Chambre',       icon:'🛏️', desc:'Un vrai home studio avec du matériel sérieux.',          maxArtists:5,  maxProjects:2,  unlockCost:22000,   unlockRep:15, weeklyBonus:500,   color:'#4fa3e0' },
  { id:2, name:'Studio Pro',           icon:'🎛️', desc:'Un local professionnel loué en plein coeur de la ville.', maxArtists:9,  maxProjects:3,  unlockCost:80000,   unlockRep:30, weeklyBonus:1800,  color:'#22c55e' },
  { id:3, name:'Label Indépendant',    icon:'🏢', desc:'Votre propre label enregistré. Vous existez vraiment.',   maxArtists:15, maxProjects:5,  unlockCost:250000,  unlockRep:50, weeklyBonus:5000,  color:'#a855f7' },
  { id:4, name:'Major Régionale',      icon:'🏭', desc:'Un immeuble entier dédié à la culture. Impressionnant.',  maxArtists:25, maxProjects:9,  unlockCost:800000,  unlockRep:72, weeklyBonus:15000, color:'#f97316' },
  { id:5, name:'Major Internationale', icon:'👑', desc:'Un empire mondial de la culture. Vous avez tout gagné.',  maxArtists:99, maxProjects:20, unlockCost:2500000, unlockRep:90, weeklyBonus:50000, color:'#f5c842' },
];

// ── RIVAL TEMPLATES ──────────────────────────────────────────
// Rivaux actifs selon palier joueur

const RIVAL_TEMPLATES = [
  { id:'stellar',    name:'Stellar Records',    icon:'🌟', style:'aggressive',  color:'#f97316', startRepBonus:5, type:'indie',     specialty:['musician'],                     personality:'Prédateur — attaque les artistes fragiles.',  unlockAtTier:0 },
  { id:'eclipse',    name:'Eclipse Music',      icon:'🌑', style:'balanced',    color:'#a855f7', startRepBonus:3, type:'indie',     specialty:['musician','poet'],              personality:'Stratège — croissance lente et solide.',      unlockAtTier:0 },
  { id:'prestige',   name:'Prestige Arts',      icon:'💎', style:'passive',     color:'#22c55e', startRepBonus:2, type:'gallery',   specialty:['painter','photographer'],       personality:'Élitiste — vise les artistes très reconnus.', unlockAtTier:0 },
  { id:'nova',       name:'Nova Creative',      icon:'💫', style:'viral',       color:'#60a5fa', startRepBonus:4, type:'digital',   specialty:['musician','comedian'],          personality:'Viral — hype explosive mais instable.',       unlockAtTier:1 },
  { id:'titan',      name:'Titan Entertainment',icon:'🦁', style:'corporate',   color:'#ffd700', startRepBonus:8, type:'major',     specialty:['musician','comedian','painter'], personality:'Corporate — budget illimité, recrute à prix d\'or.', unlockAtTier:2 },
  { id:'underground',name:'Underground Union',  icon:'🔥', style:'guerrilla',   color:'#ef4444', startRepBonus:3, type:'collective',specialty:['musician','poet','comedian'],   personality:'Collectif — solidarité entre artistes.',      unlockAtTier:1 },
  { id:'asiawave',   name:'AsiaPop Wave',       icon:'🌊', style:'expansionist',color:'#ec4899', startRepBonus:6, type:'major',     specialty:['musician'],                     personality:'Expansionniste — marchés asiatiques.',        unlockAtTier:3 },
  { id:'artcorp',    name:'ArtCorp Global',     icon:'🏛️', style:'balanced',   color:'#14b8a6', startRepBonus:5, type:'gallery',   specialty:['painter','photographer','poet'], personality:'International — expositions mondiales.',      unlockAtTier:2 },
];

function getActiveRivalTemplates() {
  return RIVAL_TEMPLATES.filter(t => (t.unlockAtTier || 0) <= G.labelTier);
}

// ── CAREER LEVELS ────────────────────────────────────────────

const CAREER_LEVELS = [
  { min:0,  name:'Inconnu',  icon:'🔮', color:'#6b7280' },
  { min:22, name:'Émergent', icon:'🌱', color:'#22c55e' },
  { min:45, name:'Reconnu',  icon:'🎯', color:'#60a5fa' },
  { min:65, name:'Star',     icon:'⭐', color:'#f5c842' },
  { min:83, name:'Légende',  icon:'👑', color:'#ffd700' },
];

// ── FAVORS / CADEAUX ─────────────────────────────────────────

const FAVORS = [
  { id:'trip',   name:'Voyage VIP',        icon:'✈️', cost:5000,  happyGain:25, energyGain:20, moodGain:15, desc:'Un séjour all-inclusive pour recharger les batteries.' },
  { id:'party',  name:'Soirée Privée',     icon:'🎊', cost:3000,  happyGain:15, moodGain:25,   energyGain:5, desc:'Une fête exclusive pour booster le moral.' },
  { id:'gear',   name:'Équipement Premium',icon:'🎙️', cost:9000,  happyGain:20, talentGain:5,  moodGain:10, desc:'Du matériel haut de gamme pour perfectionner son art.' },
  { id:'promo',  name:'Campagne Promo',    icon:'📢', cost:7000,  happyGain:10, fameGain:15,   desc:'Une campagne ciblée pour booster la notoriété.' },
  { id:'bonus',  name:'Prime Spéciale',    icon:'💸', cost:4000,  happyGain:22, moodGain:12,   desc:'Une prime financière inattendue. L\'argent parle toujours.' },
  { id:'rest',   name:'Semaine Repos',     icon:'🌴', cost:1500,  happyGain:18, energyGain:40, blockedWeeks:1, desc:'Une semaine off complète pour récupérer physiquement.' },
  { id:'raise',  name:'Augmentation 20%',  icon:'💰', cost:0,     happyGain:20, feeRaise:0.2,  desc:'Augmenter le salaire de 20%. Investissement long terme.' },
];

// ── PROJECT TYPES ─────────────────────────────────────────────
// Réalisme : prodCost = coût production réel, baseReward = revenu potentiel
// fameMult amplifie le reward selon la notoriété de l'artiste
// repFloor/repCeiling = fourchette de réputation gagnée

const PROJECT_TYPES = [
  // ── MUSICIENS ─────────────────────────────────────────────────
  { id:'radio',      name:'Radio / Podcast',    icon:'📻', duration:1, prodCost:800,  baseReward:1800,  fameMult:0.6,  repFloor:2,  repCeiling:6,  types:['musician','comedian'],          minArtists:1, maxArtists:2, minFameRequired:0,  burnEnergy:8,  burnMood:3,  desc:"Passage sur une émission. Peu payé mais bonne visibilité.", riskLevel:'low' },
  { id:'livestream', name:'Live Stream',         icon:'🔴', duration:1, prodCost:500,  baseReward:2200,  fameMult:0.8,  repFloor:2,  repCeiling:8,  types:['musician','poet'],              minArtists:1, maxArtists:3, minFameRequired:0,  burnEnergy:10, burnMood:5,  desc:"Session live en ligne. Revenu variable selon audience.", riskLevel:'low' },
  { id:'opening',    name:'Première Partie',     icon:'🚪', duration:1, prodCost:1200, baseReward:3500,  fameMult:0.7,  repFloor:4,  repCeiling:10, types:['musician'],                     minArtists:1, maxArtists:2, minFameRequired:10, burnEnergy:15, burnMood:8,  desc:"Ouvrir pour un artiste connu. Peu de cash, bonne expérience.", riskLevel:'low' },
  { id:'single',     name:'Single + Clip',       icon:'🎵', duration:2, prodCost:3500, baseReward:7000,  fameMult:1.1,  repFloor:5,  repCeiling:14, types:['musician'],                     minArtists:1, maxArtists:2, minFameRequired:5,  burnEnergy:20, burnMood:10, desc:"Sortie d'un titre avec clip. Tremplin si le titre décolle.", riskLevel:'medium' },
  { id:'session',    name:'Session Filmée',       icon:'📺', duration:2, prodCost:2000, baseReward:5500,  fameMult:0.9,  repFloor:6,  repCeiling:14, types:['musician'],                     minArtists:1, maxArtists:4, minFameRequired:15, burnEnergy:18, burnMood:6,  desc:"Session type Tiny Desk. Ultra partageable.", riskLevel:'low' },
  { id:'featuring',  name:'Featuring',            icon:'✨', duration:2, prodCost:4000, baseReward:9000,  fameMult:1.2,  repFloor:7,  repCeiling:16, types:['musician'],                     minArtists:2, maxArtists:3, minFameRequired:20, burnEnergy:22, burnMood:12, desc:"Collaboration entre artistes. Amplifie les deux audiences.", riskLevel:'medium' },
  { id:'ep',         name:'EP (5 titres)',         icon:'📀', duration:3, prodCost:7000, baseReward:14000, fameMult:1.3,  repFloor:10, repCeiling:20, types:['musician'],                     minArtists:1, maxArtists:3, minFameRequired:15, burnEnergy:28, burnMood:14, desc:"5 titres cohérents. Solide rapport qualité/coût.", riskLevel:'medium' },
  { id:'musicvideo', name:'Clip Premium',          icon:'📽️', duration:3, prodCost:9000, baseReward:16000, fameMult:1.4,  repFloor:10, repCeiling:22, types:['musician'],                     minArtists:1, maxArtists:3, minFameRequired:25, burnEnergy:25, burnMood:15, desc:"Clip de qualité cinéma. Peut cartonner.", riskLevel:'medium' },
  { id:'album',      name:'Album Studio',          icon:'💿', duration:5, prodCost:18000,baseReward:35000, fameMult:1.6,  repFloor:15, repCeiling:35, types:['musician'],                     minArtists:1, maxArtists:3, minFameRequired:30, burnEnergy:40, burnMood:22, desc:"Un album complet. Long, coûteux — construit une légende.", riskLevel:'high' },
  { id:'residency',  name:'Résidence (Club)',       icon:'🏟️', duration:4, prodCost:12000,baseReward:22000, fameMult:1.3,  repFloor:12, repCeiling:26, types:['musician'],                     minArtists:1, maxArtists:5, minFameRequired:30, burnEnergy:35, burnMood:18, desc:"Plusieurs dates au même lieu. Fidélise la fanbase locale.", riskLevel:'medium' },
  { id:'festival',   name:'Festival',              icon:'🎪', duration:3, prodCost:20000,baseReward:42000, fameMult:1.7,  repFloor:18, repCeiling:38, types:['musician'],                     minArtists:2, maxArtists:6, minFameRequired:40, burnEnergy:38, burnMood:20, desc:"Grosse scène. Visibilité maximale, budget logistique élevé.", riskLevel:'high' },
  { id:'soundtrack', name:'B.O. de Film',           icon:'🎞️', duration:4, prodCost:11000,baseReward:28000, fameMult:1.2,  repFloor:14, repCeiling:28, types:['musician'],                     minArtists:1, maxArtists:4, minFameRequired:20, burnEnergy:30, burnMood:15, desc:"Composer pour un film. Revenu stable, crédibilité élevée.", riskLevel:'medium' },
  { id:'merch',      name:'Merch Drop',             icon:'🧢', duration:2, prodCost:6000, baseReward:11000, fameMult:1.5,  repFloor:1,  repCeiling:5,  types:['musician','comedian'],          minArtists:1, maxArtists:4, minFameRequired:35, burnEnergy:12, burnMood:5,  desc:"Cash rapide si l'artiste a une fanbase engagée.", riskLevel:'low' },
  { id:'tour',       name:'Tournée Nationale',      icon:'🚌', duration:6, prodCost:25000,baseReward:65000, fameMult:1.8,  repFloor:22, repCeiling:45, types:['musician','comedian'],          minArtists:1, maxArtists:5, minFameRequired:45, burnEnergy:50, burnMood:25, desc:"10-20 dates en France. Recettes massives si les salles se remplissent.", riskLevel:'high' },
  // ── VISUELS ─────────────────────────────────────────────────
  { id:'commission', name:'Commande Privée',        icon:'🖌️', duration:2, prodCost:1500, baseReward:6000,  fameMult:0.9,  repFloor:3,  repCeiling:8,  types:['painter','photographer'],       minArtists:1, maxArtists:1, minFameRequired:0,  burnEnergy:20, burnMood:8,  desc:"Commande directe par un client. Revenus stables, peu de risque.", riskLevel:'low' },
  { id:'exhibit',    name:'Exposition',             icon:'🖼️', duration:3, prodCost:5000, baseReward:14000, fameMult:1.2,  repFloor:10, repCeiling:24, types:['painter','photographer'],       minArtists:1, maxArtists:2, minFameRequired:15, burnEnergy:28, burnMood:12, desc:"Exposition en galerie. Prestige et réseau si le public répond.", riskLevel:'medium' },
  { id:'book',       name:'Publication / Livre',    icon:'📚', duration:4, prodCost:4000, baseReward:10000, fameMult:1.0,  repFloor:8,  repCeiling:18, types:['poet','painter'],               minArtists:1, maxArtists:2, minFameRequired:10, burnEnergy:22, burnMood:10, desc:"Un livre ou recueil. Revenus modestes, réputation durable.", riskLevel:'low' },
  { id:'collab',     name:'Collaboration Inter-Arts',icon:'🤝', duration:3, prodCost:7000, baseReward:18000, fameMult:1.3,  repFloor:14, repCeiling:28, types:['painter','photographer','poet'],minArtists:2, maxArtists:4, minFameRequired:20, burnEnergy:30, burnMood:15, desc:"Projet multi-disciplines. Les synergies peuvent tout amplifier.", riskLevel:'medium' },
  // ── COMÉDIENS ─────────────────────────────────────────────────
  { id:'show',       name:'Spectacle Live',          icon:'🎭', duration:2, prodCost:5000, baseReward:13000, fameMult:1.2,  repFloor:10, repCeiling:22, types:['comedian','musician'],          minArtists:1, maxArtists:4, minFameRequired:10, burnEnergy:30, burnMood:15, desc:"Soir(s) sur scène. Recettes billetterie, contact direct public.", riskLevel:'medium' },
  { id:'film',       name:'Court-Métrage / Film',    icon:'🎬', duration:5, prodCost:16000,baseReward:32000, fameMult:1.4,  repFloor:18, repCeiling:35, types:['comedian','photographer'],      minArtists:1, maxArtists:3, minFameRequired:25, burnEnergy:35, burnMood:20, desc:"Production cinématographique. Long, cher, potentiel énorme.", riskLevel:'high' },
];



// ── DYNAMIC PROJECT REWARD CALCULATION ───────────────────────
// Reward réaliste : dépend de la fame, talent, énergie de l'artiste, et du palier label

function calcProjectReward(pt, artists) {
  if (!pt || !artists || artists.length === 0) return pt ? pt.baseReward : 0;
  const avgFame   = artists.reduce((s,a) => s + (a.fame||20), 0) / artists.length;
  const avgTalent = artists.reduce((s,a) => s + (a.talent||50), 0) / artists.length;
  const avgEnergy = artists.reduce((s,a) => s + (a.energy||100), 0) / artists.length;
  // Fame 0→100 donne un facteur 0.4 → 0.4 + fameMult
  const fameFactor   = 0.4 + (avgFame / 100) * (pt.fameMult || 1.0);
  const talentFactor = 0.65 + (avgTalent / 100) * 0.7;
  const energyFactor = 0.70 + (avgEnergy / 100) * 0.55;
  const tierMult     = 1 + (G ? G.labelTier : 0) * 0.15;
  const contactBonus = typeof getContactPassiveBonus === 'function' ? (1 + getContactPassiveBonus('repMult')) : 1;
  const allianceBonus= typeof getAllianceBonus === 'function' ? (1 + getAllianceBonus('revenueMerge')) : 1;
  return Math.floor(pt.baseReward * fameFactor * talentFactor * energyFactor * tierMult * contactBonus * allianceBonus);
}

function calcProjectRep(pt, artists) {
  if (!pt || !artists || artists.length === 0) return pt ? pt.repFloor : 1;
  const avgFame   = artists.reduce((s,a) => s + (a.fame||20), 0) / artists.length;
  const avgTalent = artists.reduce((s,a) => s + (a.talent||50), 0) / artists.length;
  const factor    = 0.4 + (avgFame / 100) * 0.4 + (avgTalent / 100) * 0.4;
  const tierMult  = 1 + (G ? G.labelTier : 0) * 0.1;
  const contactBonus = typeof getContactPassiveBonus === 'function' ? (1 + getContactPassiveBonus('repMult')) : 1;
  const raw = (pt.repFloor || 1) + Math.round(((pt.repCeiling || 10) - (pt.repFloor || 1)) * factor * tierMult * contactBonus);
  return clamp(raw, pt.repFloor || 1, (pt.repCeiling || 10) * 2);
}

function calcProjectFailChance(pt, artists) {
  if (!pt) return 0.1;
  const baseRisk = pt.riskLevel === 'high' ? 0.28 : pt.riskLevel === 'medium' ? 0.13 : 0.05;
  const avgEnergy = artists.reduce((s,a) => s + (a.energy||100), 0) / artists.length;
  const avgMood   = artists.reduce((s,a) => s + (a.mood||100), 0) / artists.length;
  const avgHappy  = artists.reduce((s,a) => s + (a.happiness||70), 0) / artists.length;
  const condition = (avgEnergy + avgMood + avgHappy) / 300;
  let rolePenalty = 0;
  artists.forEach(a => {
    const c = typeof getRoleCompatibility === 'function' ? getRoleCompatibility(a.type, pt.id) : { level:'primary' };
    if (c.level === 'forbidden')  rolePenalty = Math.max(rolePenalty, 0.40);
    else if (c.level === 'secondary') rolePenalty = Math.max(rolePenalty, 0.10);
  });
  return clamp(baseRisk - (condition - 0.6) * 0.18 + rolePenalty, 0.02, 0.88);
}

function calcProductionCost(pt, artists, duration) {
  if (!pt) return 0;
  const base = pt.prodCost || 2000;
  // Each additional artist adds 40% of prodCost
  const artistMult = 1 + (artists.length - 1) * 0.4;
  // Reduce by label upgrades
  const reduction = typeof getUpgradeLevel === 'function' ? getUpgradeLevel('studio') * 0.05 : 0;
  const contactReduc = typeof getContactPassiveBonus === 'function' ? getContactPassiveBonus('contractCostReduce') : 0;
  return Math.max(200, Math.floor(base * artistMult * duration * (1 - reduction - contactReduc)));
}

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

  // --- AJOUTS MUSIQUE (FOCUS) ---

  { name:'Boiler Room Live Set',        icon:'🔥', desc:'Live set filmé, diffusion mondiale. La hype peut exploser (ou flop).', reward:14000, repGain:26, fameGain:28, risk:'high', types:['musician'] },
  { name:'Nuits Sonores Showcase',      icon:'🌙', desc:'Showcase électro/indé. Programmateurs et médias partout.', reward:11000, repGain:24, fameGain:18, risk:'medium', types:['musician'] },
  { name:'Olympia – Première Date',     icon:'🏛️', desc:'Première tête d’affiche à l’Olympia. Un passage de cap.', reward:22000, repGain:32, fameGain:26, risk:'high', types:['musician'] },
  { name:'Session Radio (Prime Time)',  icon:'📻', desc:'Performance live en prime time. Public large + replay.', reward:7000,  repGain:14, fameGain:16, risk:'low', types:['musician'] },
  { name:'Tiny Desk Style',             icon:'🪑', desc:'Session intimiste, ultra partageable. L’authenticité paie.', reward:9000,  repGain:18, fameGain:20, risk:'medium', types:['musician'] },
  { name:'DJ Set Rooftop Secret',       icon:'🌆', desc:'Événement secret rooftop. Influenceurs, vidéos virales possibles.', reward:8000,  repGain:15, fameGain:17, risk:'medium', types:['musician'] },
  { name:'Club Residency (3 nuits)',    icon:'🪩', desc:'Résidence en club. Construire une fanbase locale solide.', reward:12000, repGain:20, fameGain:12, risk:'low', types:['musician'] },
  { name:'Première Partie Superstar',   icon:'🌟', desc:'Opening act sur une date énorme. Exposition massive mais pression.', reward:16000, repGain:22, fameGain:24, risk:'high', types:['musician'] },
  { name:'Collab Studio Surprise',      icon:'🤫', desc:'Collaboration surprise avec un artiste connu. Peut cartonner.', reward:13000, repGain:21, fameGain:26, risk:'medium', types:['musician'] },
  { name:'Remix Contest Officiel',      icon:'🧩', desc:'Concours de remix officiel. Gagne un placement playlist si validé.', reward:6000,  repGain:12, fameGain:18, risk:'medium', types:['musician'] },
  { name:'Placement Playlist “Top FR”', icon:'📈', desc:'Grosse playlist éditoriale. Gain de fans instantané.', reward:10000, repGain:10, fameGain:30, risk:'medium', types:['musician'] },
  { name:'Award Indie (Nominé)',        icon:'🏆', desc:'Nominé à un award indie. Réputation pro en hausse.', reward:9000,  repGain:23, fameGain:14, risk:'low', types:['musician'] },
  { name:'Session Studio VIP',          icon:'🎛️', desc:'Studio premium avec ingé star. Qualité haute, coût caché possible.', reward:15000, repGain:19, fameGain:12, risk:'medium', types:['musician'] },
  { name:'Live Stream Caritatif',       icon:'🔴', desc:'Live stream pour une cause. Image positive et partage facile.', reward:5000,  repGain:16, fameGain:10, risk:'low', types:['musician','poet'] },
  { name:'Tournage Clip “One Take”',    icon:'🎥', desc:'Clip one-take ambitieux. Si ça rate, c’est la gêne…', reward:17000, repGain:20, fameGain:22, risk:'high', types:['musician'] },

  // --- CROSS-OVER MUSIQUE (si tu veux mixer des teams) ---

  { name:'Poésie x Néo-soul (Live)',    icon:'🕯️', desc:'Soirée hybride slam/chant. Public curieux, belle réputation.', reward:8000,  repGain:19, fameGain:12, risk:'low', types:['musician','poet'] },
  { name:'B.O. Court-Métrage Indie',    icon:'🎞️', desc:'Composer une B.O. pour un court-métrage. Réseau cinéma + crédibilité.', reward:14000, repGain:22, fameGain:15, risk:'medium', types:['musician','comedian'] },
  { name:'Expo Sonore Immersive',       icon:'🔊', desc:'Expo immersive avec sound design. Très tendance, exigeant.', reward:16000, repGain:24, fameGain:14, risk:'medium', types:['musician','painter','photographer'] },
];

const REP_TIERS = [
  { min:0,  label:'Inconnue',    color:'#6b7280' },
  { min:20, label:'Émergente',   color:'#60a5fa' },
  { min:40, label:'Reconnue',    color:'#a855f7' },
  { min:60, label:'Influente',   color:'#f97316' },
  { min:80, label:'Légendaire',  color:'#f5c842' },
  { min:95, label:'Iconique 🌟', color:'#ffd700' },
];

const TYPE_COLORS = { musician:'#4fa3e0', painter:'#a855f7', comedian:'#f97316', photographer:'#22c55e', poet:'#f5c842' };
const TYPE_LABELS = { musician:'Musicien', painter:'Peintre', comedian:'Comédien', photographer:'Photographe', poet:'Poète' };
const SAVE_KEY = 'artvibe_manager_save_v3';
const MAX_NEWS_ITEMS = 25;

// ── CONTRATS / DEALS ─────────────────────────────────────────
const CONTRACT_DEALS = [
  { id:'sync_license',  name:'Licence Synchronisation', icon:'📺', desc:'Votre musique dans une pub TV nationale.', reward:18000, repGain:8,  fameGain:15, duration:2, types:['musician'], minFame:30, minRep:20 },
  { id:'brand_deal',    name:'Partenariat de Marque',   icon:'👟', desc:'Collaboration officielle avec une grande marque.', reward:30000, repGain:10, fameGain:20, duration:3, types:['musician','comedian','photographer'], minFame:50, minRep:35 },
  { id:'streaming_exc', name:'Exclusivité Streaming',   icon:'🎧', desc:'Exclusivité temporaire sur une plateforme majeure.', reward:25000, repGain:12, fameGain:25, duration:4, types:['musician'], minFame:55, minRep:40 },
  { id:'gallery_deal',  name:'Contrat Galerie',         icon:'🖼️', desc:'Exposition permanente dans une galerie internationale.', reward:20000, repGain:15, fameGain:18, duration:3, types:['painter','photographer'], minFame:40, minRep:30 },
  { id:'film_score',    name:'B.O. de Film',            icon:'🎬', desc:'Composer la bande originale d\'un long métrage.', reward:45000, repGain:20, fameGain:22, duration:5, types:['musician','comedian'], minFame:60, minRep:45 },
  { id:'comedy_special',name:'Spécial Comedy Netflix',  icon:'😂', desc:'Un special stand-up diffusé en streaming mondial.', reward:55000, repGain:25, fameGain:35, duration:4, types:['comedian'], minFame:65, minRep:50 },
  { id:'book_deal',     name:'Contrat Éditeur',         icon:'📚', desc:'Publication d\'un recueil chez un grand éditeur.', reward:12000, repGain:18, fameGain:12, duration:3, types:['poet','painter'], minFame:35, minRep:25 },
  { id:'world_tour',    name:'Contrat Tournée Mondiale', icon:'✈️', desc:'L\'opportunité d\'une tournée internationale.', reward:120000, repGain:40, fameGain:45, duration:8, types:['musician'], minFame:75, minRep:65 },
];

// ── TOURNÉES ─────────────────────────────────────────────────
const TOUR_TYPES = [
  { id:'local',    name:'Tournée Locale',      icon:'🚌', cities:['Paris','Lyon','Bordeaux'],          weeks:3, costPerCity:3000,  revenuePerCity:8000,  repPerCity:4,  famePerCity:5,  minFame:25, minRep:15 },
  { id:'national', name:'Tournée Nationale',   icon:'🇫🇷', cities:['Paris','Lyon','Marseille','Lille','Toulouse','Nantes'], weeks:5, costPerCity:6000,  revenuePerCity:18000, repPerCity:7,  famePerCity:9,  minFame:45, minRep:30 },
  { id:'european', name:'Tournée Européenne',  icon:'🌍', cities:['Paris','Londres','Berlin','Madrid','Amsterdam','Rome'],  weeks:7, costPerCity:12000, revenuePerCity:35000, repPerCity:12, famePerCity:15, minFame:62, minRep:48 },
  { id:'world',    name:'Tournée Mondiale',    icon:'🌐', cities:['New York','Tokyo','LA','Sydney','São Paulo','Berlin','Dubaï'], weeks:10,costPerCity:25000, revenuePerCity:70000, repPerCity:18, famePerCity:25, minFame:80, minRep:65 },
];

// ── SCANDALES ────────────────────────────────────────────────
const SCANDAL_TYPES = [
  { id:'social_media',  name:'Polémique Réseaux Sociaux', icon:'📱', severity:'mild',   repLoss:5,  fameLoss:3,  happyLoss:8,  resolveCost:5000,   resolveRep:3  },
  { id:'paparazzi',     name:'Photos Compromettantes',    icon:'📸', severity:'medium', repLoss:12, fameLoss:5,  happyLoss:15, resolveCost:12000,  resolveRep:5  },
  { id:'feuding',       name:'Clash Public',              icon:'🥊', severity:'medium', repLoss:15, fameLoss:8,  happyLoss:20, resolveCost:18000,  resolveRep:7  },
  { id:'substance',     name:'Substance Illicite',        icon:'💊', severity:'severe', repLoss:25, fameLoss:15, happyLoss:35, resolveCost:35000,  resolveRep:10 },
  { id:'tax_fraud',     name:'Fraude Fiscale',            icon:'💸', severity:'severe', repLoss:30, fameLoss:10, happyLoss:25, resolveCost:50000,  resolveRep:12 },
  { id:'cancelled',     name:'Cancel Culture',            icon:'🚫', severity:'severe', repLoss:20, fameLoss:20, happyLoss:40, resolveCost:40000,  resolveRep:8  },
];

// ── COLLABORATIONS ───────────────────────────────────────────
const COLLAB_BONUSES = {
  musician_musician:    { fameBonus:1.3, repBonus:1.2, cashBonus:1.1, label:'Duo Musical' },
  musician_poet:        { fameBonus:1.2, repBonus:1.4, cashBonus:1.0, label:'Fusion Slam/Musique' },
  musician_painter:     { fameBonus:1.1, repBonus:1.3, cashBonus:1.2, label:'Univers Visuel-Sonore' },
  musician_comedian:    { fameBonus:1.2, repBonus:1.2, cashBonus:1.3, label:'Show Multi-Arts' },
  painter_photographer: { fameBonus:1.2, repBonus:1.5, cashBonus:1.1, label:'Expo Visuelle' },
  comedian_poet:        { fameBonus:1.3, repBonus:1.3, cashBonus:1.0, label:'Slam Comedy' },
};

// ── ÉVÉNEMENTS ALÉATOIRES ENRICHIS ──────────────────────────
const RANDOM_EVENTS_POOL = [
  // Positifs
  { weight:8,  fn:(a,G)=>{ const g=rand(6,14); a.fame=Math.min(100,a.fame+g); G.reputation=Math.min(100,G.reputation+3); return `⭐ ${a.name} fait la une d'un magazine ! +${g} notoriété`; } },
  { weight:6,  fn:(a,G)=>{ const g=rand(10,20); a.fame=Math.min(100,a.fame+g); G.reputation=Math.min(100,G.reputation+5); G.money+=2000; G.weekRevenue+=2000; a.happiness=clamp((a.happiness||70)+10,0,100); return `📱 Viral ! ${a.name} explose sur les réseaux. +${g} notoriété`; } },
  { weight:5,  fn:(a,G)=>{ const g=rand(3,7); G.money+=rand(3000,8000)*(G.labelTier+1); G.weekRevenue+=rand(3000,8000)*(G.labelTier+1); return `💼 Offre de sponsoring pour ${a.name} !`; } },
  { weight:4,  fn:(a,G)=>{ a.talent=Math.min(100,a.talent+rand(2,6)); a.mood=clamp((a.mood||100)+15,0,100); return `✨ ${a.name} a une révélation artistique ! +talent`; } },
  { weight:4,  fn:(a,G)=>{ const g=rand(12,22); a.fame=Math.min(100,a.fame+g); G.reputation=Math.min(100,G.reputation+8); G.money+=5000; G.weekRevenue+=5000; a.happiness=clamp((a.happiness||70)+15,0,100); return `🏆 ${a.name} remporte un prix artistique ! +${g} notoriété`; } },
  { weight:3,  fn:(a,G)=>{ a.charisma=Math.min(100,a.charisma+rand(3,8)); a.mood=clamp((a.mood||100)+10,0,100); return `🎤 Masterclass réussie pour ${a.name} ! +charisme`; } },
  { weight:3,  fn:(a,G)=>{ const bonus=rand(8000,25000)*(G.labelTier+1); G.money+=bonus; G.weekRevenue+=bonus; return `🎁 Droits d'auteur inattendus ! +${bonus.toLocaleString()}€`; } },
  // Négatifs
  { weight:5,  fn:(a,G,scandal)=>{ const s=SCANDAL_TYPES[Math.floor(Math.random()*SCANDAL_TYPES.length)]; a.scandal={...s,artistId:a.id,artistName:a.name,week:G.week}; G.scandals=G.scandals||[]; G.scandals.push(a.scandal); G.reputation=Math.max(0,G.reputation-s.repLoss/2); a.fame=Math.max(0,a.fame-s.fameLoss/2); a.happiness=clamp((a.happiness||70)-s.happyLoss/2,0,100); return `${s.icon} Scandale émergent : "${s.name}" implique ${a.name} !`; } },
  { weight:4,  fn:(a,G)=>{ a.energy=clamp((a.energy||100)-rand(20,35),0,100); a.mood=clamp((a.mood||100)-rand(10,20),0,100); a.blockedWeeks=(a.blockedWeeks||0)+rand(1,2); return `🚑 ${a.name} blessé(e) — indisponible quelques semaines.`; } },
  { weight:3,  fn:(a,G)=>{ a.mood=clamp((a.mood||100)-rand(15,25),0,100); a.happiness=clamp((a.happiness||70)-rand(10,18),0,100); return `💔 ${a.name} traverse une période difficile personnellement.`; } },
  { weight:3,  fn:(a,G)=>{ G.reputation=Math.max(0,G.reputation-rand(4,8)); a.happiness=clamp((a.happiness||70)-10,0,100); return `📰 Article négatif sur ${a.name} dans la presse spécialisée.`; } },
  // Neutres / opportunités
  { weight:5,  fn:(a,G)=>{ a.fame=Math.min(100,a.fame+rand(3,8)); a.mood=clamp((a.mood||100)+8,0,100); return `🎙️ Interview radio surprise pour ${a.name}.`; } },
  { weight:4,  fn:(a,G)=>{ const b=rand(2000,6000); G.money+=b; G.weekRevenue+=b; return `📻 Diffusion radio inattendue — +${b.toLocaleString()}€ royalties.`; } },
  { weight:3,  fn:(a,G)=>{ if(G.artists.length>1){ const other=G.artists.filter(x=>x.id!==a.id)[Math.floor(Math.random()*(G.artists.length-1))]; other.fame=Math.min(100,other.fame+rand(4,10)); other.mood=clamp((other.mood||100)+12,0,100); a.mood=clamp((a.mood||100)+8,0,100); return `🤝 ${a.name} et ${other.name} renforcent leur amitié. +moral mutuel`; } return `🤝 ${a.name} noue de nouvelles connections professionnelles.`; } },
];

const AGENCY_UPGRADES = [
  { id:'scouting',   name:'Scouting Pro',    icon:'🧭', baseCost:12000, growth:1.75, maxLevel:8,  desc:'Améliore la qualité et la taille du marché.' },
  { id:'pr',         name:'PR Digital',      icon:'📣', baseCost:9000,  growth:1.72, maxLevel:10, desc:'Augmente les gains de réputation et de notoriété.' },
  { id:'production', name:'Studio Interne',  icon:'🎛️', baseCost:15000, growth:1.8,  maxLevel:8,  desc:'Boost les récompenses projets et réduit leur durée.' },
  { id:'finance',    name:'Optimisation',    icon:'💼', baseCost:13000, growth:1.78, maxLevel:8,  desc:'Réduit les coûts de contrats et de salaires.' },
  { id:'wellbeing',  name:'Bien-être RH',    icon:'💆', baseCost:18000, growth:1.9,  maxLevel:6,  desc:'Augmente la satisfaction des artistes chaque semaine.' },
  { id:'security',   name:'Sécurité',        icon:'🛡️', baseCost:20000, growth:2.0,  maxLevel:5,  desc:'Réduit le risque de débauchage par les rivaux.' },
];

const MILESTONES = [
  { id:'first_artist',  name:'Premier talent',      check:(s)=>s.artists.length >= 1,       reward:{ money:5000,   rep:3  } },
  { id:'roster_5',      name:'Collectif établi',    check:(s)=>s.artists.length >= 5,       reward:{ money:12000,  rep:6  } },
  { id:'rep_50',        name:'Agence reconnue',     check:(s)=>s.reputation >= 50,          reward:{ money:16000,  rep:5  } },
  { id:'done_10',       name:'Production soutenue', check:(s)=>s.doneProjects.length >= 10, reward:{ money:22000,  rep:8  } },
  { id:'cash_250k',     name:'Trésorerie solide',   check:(s)=>s.money >= 250000,           reward:{ money:35000,  rep:10 } },
  { id:'tier_indie',    name:'Vrai Label Indé',     check:(s)=>s.labelTier >= 3,            reward:{ money:50000,  rep:12 } },
  { id:'tier_major',    name:'Statut Major',        check:(s)=>s.labelTier >= 4,            reward:{ money:150000, rep:20 } },
  { id:'legend_artist', name:'Une Légende dans le Roster', check:(s)=>s.artists.some(a=>a.fame>=83), reward:{ money:40000, rep:15 } },
  { id:'rivals_beaten', name:'Supériorité confirmée', check:(s)=>s.rivals && s.rivals.every(r=>r.tier <= (s.labelTier - 1)), reward:{ money:80000, rep:18 } },
];

// ── STATE ─────────────────────────────────────────────────────

let G = {};
let lastAutoSaveAt = 0;

function createDefaultRivals() {
  // Start with tier-0 rivals only
  return RIVAL_TEMPLATES.filter(t => (t.unlockAtTier || 0) === 0).map(t => ({
    id: t.id, name: t.name, icon: t.icon, style: t.style, color: t.color, type: t.type || 'indie',
    specialty: t.specialty || ['musician'], personality: t.personality || '',
    tier: 0, reputation: rand(5, 12) + t.startRepBonus,
    money: rand(35000, 65000), artistsDebauched: [], growthWeeks: 0,
    lastAction: '', spied: false, isAllied: false,
  }));
}

function checkUnlockNewRivals() {
  const existingIds = (G.rivals || []).map(r => r.id);
  RIVAL_TEMPLATES.forEach(t => {
    if ((t.unlockAtTier || 0) <= G.labelTier && !existingIds.includes(t.id)) {
      G.rivals.push({
        id: t.id, name: t.name, icon: t.icon, style: t.style, color: t.color, type: t.type || 'indie',
        specialty: t.specialty || ['musician'], personality: t.personality || '',
        tier: Math.max(0, G.labelTier - 1), reputation: rand(15, 30),
        money: rand(80000, 200000), artistsDebauched: [], growthWeeks: 0,
        lastAction: `Est entré dans la compétition au palier ${LABEL_TIERS[G.labelTier].name}`, spied: false, isAllied: false,
      });
      addNews(`⚠️ Nouveau rival détecté : ${t.icon} ${t.name} — ${t.personality}`);
    }
  });
}

function initState() {
  G = createDefaultState();
  refreshMarket();
  refreshEvents();
}

function createDefaultState() {
  return {
    week: 1,
    money: 50000,
    reputation: 10,
    artists: [],
    projects: [],
    doneProjects: [],
    royaltyCatalog: [],
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
    upgrades: { scouting:0, pr:0, production:0, finance:0, wellbeing:0, security:0 },
    milestonesClaimed: [],
    // NEW
    labelTier: 0,
    rivals: createDefaultRivals(),
    pendingOffers: [],
    labelHistory: [],
    version: 3,
    lastUpdatedAt: Date.now(),
    lastWeeklySalaries: 0,
    lastWeekNet: 0,
    // NEW v4
    activeTours: [],
    completedTours: [],
    activeContracts: [],
    completedContracts: [],
    scandals: [],
    salaryNegotiations: [],
    pendingRandomEvents: [],
    // NEW v5
    alliances: [],
    unlockedContacts: [],
    visitedCities: [],
    availableContracts: [],
  };
}

// ── HELPERS ──────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2,9); }
function rand(min, max) { return Math.floor(Math.random()*(max-min+1))+min; }
function clamp(v,a,b) { return Math.max(a,Math.min(b,v)); }
function deepClone(v) { return JSON.parse(JSON.stringify(v)); }

function getUpgradeLevel(id) { return Math.max(0, Number(G.upgrades?.[id]) || 0); }
function getUpgradeCost(id) {
  const up = AGENCY_UPGRADES.find(x=>x.id===id);
  if(!up) return Number.MAX_SAFE_INTEGER;
  return Math.floor(up.baseCost * Math.pow(up.growth, getUpgradeLevel(id)));
}
function getContractAdvanceWeeks() { return Math.max(2, 4 - Math.floor(getUpgradeLevel('finance') / 2)); }
function getSalaryMultiplier()     { return Math.max(0.75, 1 - getUpgradeLevel('finance') * 0.03); }
function getProjectRewardMultiplier() { return 1 + getUpgradeLevel('production') * 0.08; }
function getProjectDurationReduction() { return Math.floor(getUpgradeLevel('production') / 3); }
function getRepGainMultiplier()    { return 1 + getUpgradeLevel('pr') * 0.07; }
function getWellbeingBonus()       { return getUpgradeLevel('wellbeing') * 3; }
function getSecurityLevel()        { return getUpgradeLevel('security'); }

function hasActiveSave() { return !!localStorage.getItem(SAVE_KEY); }

// ── LABEL TIER SYSTEM ─────────────────────────────────────────

function getCurrentTier() { return LABEL_TIERS[G.labelTier] || LABEL_TIERS[0]; }
function getNextTier()    { return LABEL_TIERS[G.labelTier + 1] || null; }

function canUpgradeTier() {
  const next = getNextTier();
  if(!next) return false;
  return G.money >= next.unlockCost && G.reputation >= next.unlockRep;
}

function upgradeLabelTier() {
  const next = getNextTier();
  if(!next) { toast('🏆 Vous êtes déjà au sommet !', '#f5c842'); return; }
  if(G.money < next.unlockCost) { toast(`❌ Il vous faut ${next.unlockCost.toLocaleString()}€`, '#ef4444'); return; }
  if(G.reputation < next.unlockRep) { toast(`❌ Réputation insuffisante (${next.unlockRep}+ requise)`, '#ef4444'); return; }
  G.money -= next.unlockCost;
  G.weekExpenses += next.unlockCost;
  G.labelTier++;
  const tier = getCurrentTier();
  G.labelHistory.push(`Semaine ${G.week} : évolution vers ${tier.icon} ${tier.name}`);
  addNews(`🎉 Votre label a évolué : ${tier.icon} ${tier.name} !`);
  toast(`🏆 Bienvenue dans ${tier.name} !`, tier.color);
  renderAll();
  renderLabelTab();
}

// ── CAREER LEVEL SYSTEM ──────────────────────────────────────

function getCareerLevel(fame) {
  for(let i = CAREER_LEVELS.length - 1; i >= 0; i--)
    if(fame >= CAREER_LEVELS[i].min) return CAREER_LEVELS[i];
  return CAREER_LEVELS[0];
}

// ── TOUR SYSTEM ───────────────────────────────────────────────

function canStartTour(tourType, artist) {
  return artist.fame >= tourType.minFame && G.reputation >= tourType.minRep;
}

function startTour(tourTypeId, artistId) {
  const tt = TOUR_TYPES.find(t => t.id === tourTypeId);
  const a = G.artists.find(x => x.id === artistId);
  if (!tt || !a) return;
  if (!canStartTour(tt, a)) { toast(`❌ ${a.name} n'est pas encore assez connu pour cette tournée.`, '#ef4444'); return; }
  if (G.projects.some(p => p.artists.includes(a.id))) { toast('❌ Artiste déjà en projet !', '#ef4444'); return; }
  if ((a.blockedWeeks || 0) > 0) { toast('❌ Artiste indisponible !', '#ef4444'); return; }
  const totalCost = tt.costPerCity * tt.cities.length;
  if (G.money < totalCost) { toast(`❌ ${totalCost.toLocaleString()}€ requis pour cette tournée.`, '#ef4444'); return; }
  G.money -= totalCost;
  G.weekExpenses += totalCost;
  const tour = {
    id: uid(), typeId: tourTypeId, name: `${tt.icon} ${tt.name}`,
    artistId, artistName: a.name, artistEmoji: a.emoji,
    cities: [...tt.cities], currentCity: 0,
    weeksLeft: tt.weeks, totalWeeks: tt.weeks,
    revenuePerCity: tt.revenuePerCity, repPerCity: tt.repPerCity, famePerCity: tt.famePerCity,
    totalRevenue: 0, done: false
  };
  G.activeTours = G.activeTours || [];
  G.activeTours.push(tour);
  a.blockedWeeks = tt.weeks;
  a.history.push(`🚌 Départ en ${tt.name} (${tt.cities.length} villes) !`);
  addNews(`🚌 ${a.emoji} ${a.name} part en ${tt.name} !`);
  toast(`🎸 Tournée lancée !`, '#f97316');
  closeTourModal();
  renderAll();
}

function processTours() {
  if (!G.activeTours || G.activeTours.length === 0) return;
  G.activeTours.forEach(tour => {
    if (tour.done) return;
    tour.weeksLeft--;
    const cityIdx = Math.floor((tour.totalWeeks - tour.weeksLeft - 1) / (tour.totalWeeks / tour.cities.length));
    const city = tour.cities[Math.min(cityIdx, tour.cities.length - 1)];
    const a = G.artists.find(x => x.id === tour.artistId);
    const successChance = a ? 0.7 + (a.charisma / 100) * 0.25 : 0.7;
    if (Math.random() < successChance) {
      const rev = Math.round(tour.revenuePerCity * (0.8 + Math.random() * 0.4));
      G.money += rev; G.weekRevenue += rev; tour.totalRevenue += rev;
      G.reputation = Math.min(100, G.reputation + tour.repPerCity * getRepGainMultiplier());
      if (a) {
        a.fame = Math.min(100, a.fame + tour.famePerCity * getRepGainMultiplier());
        a.energy = clamp((a.energy || 100) - rand(6, 12), 0, 100);
        a.mood = clamp((a.mood || 100) - rand(3, 7), 0, 100);
      }
      addNews(`🎸 ${tour.artistEmoji} ${tour.artistName} — concert à ${city} ! +${rev.toLocaleString()}€`);
    } else {
      const penalty = Math.round(tour.revenuePerCity * 0.1);
      G.money = Math.max(0, G.money - penalty);
      addNews(`😬 ${tour.artistEmoji} ${tour.artistName} — soirée difficile à ${city}.`);
    }
    if (tour.weeksLeft <= 0) {
      tour.done = true;
      if (a) {
        a.history.push(`✅ ${tour.name} terminée ! Total: ${tour.totalRevenue.toLocaleString()}€`);
        a.happiness = clamp((a.happiness || 70) + 15, 0, 100);
        a.blockedWeeks = 0;
      }
      addNews(`🏆 ${tour.artistEmoji} ${tour.artistName} : ${tour.name} terminée ! Total: ${tour.totalRevenue.toLocaleString()}€`);
      toast(`🎉 Tournée terminée !`, '#22c55e');
    }
  });
  const done = G.activeTours.filter(t => t.done);
  G.completedTours = [...(G.completedTours || []), ...done];
  G.activeTours = G.activeTours.filter(t => !t.done);
}

let _tourArtistId = null;
function openTourModal() {
  if (G.artists.length === 0) { toast('❌ Recrutez d\'abord des artistes !', '#ef4444'); return; }
  const eligible = G.artists.filter(a => !G.projects.some(p => p.artists.includes(a.id)) && (a.blockedWeeks || 0) <= 0 && (a.type === 'musician' || a.type === 'comedian'));
  if (eligible.length === 0) { toast('❌ Aucun musicien/comédien disponible !', '#ef4444'); return; }
  _tourArtistId = null;
  renderTourModal(eligible);
  document.getElementById('tour-modal').classList.add('show');
}

function renderTourModal(eligible) {
  const sel = eligible.find(a => a.id === _tourArtistId);
  document.getElementById('tour-modal-content').innerHTML = `
    <div style="font-size:.8rem;color:var(--muted);margin-bottom:.8rem">Choisissez un artiste et le type de tournée</div>
    <div class="pm-artist-grid" style="margin-bottom:1rem">
      ${eligible.map(a => `
        <button class="pm-artist-btn ${_tourArtistId === a.id ? 'sel' : ''}" onclick="selectTourArtist('${a.id}')">
          ${a.emoji} ${a.name}<br>
          <span style="font-size:.58rem;color:var(--gold)">⭐ ${a.fame} notoriété</span>
        </button>
      `).join('')}
    </div>
    ${sel ? `
      <div style="display:flex;flex-direction:column;gap:.6rem">
        ${TOUR_TYPES.map(tt => {
          const can = canStartTour(tt, sel);
          const cost = tt.costPerCity * tt.cities.length;
          const canAfford = G.money >= cost;
          return `
            <div class="favor-card ${can && canAfford ? '' : 'disabled'}" style="padding:.8rem">
              <div style="display:flex;align-items:center;gap:.6rem;margin-bottom:.4rem">
                <span style="font-size:1.4rem">${tt.icon}</span>
                <div>
                  <div style="font-weight:800;font-size:.9rem">${tt.name}</div>
                  <div style="font-size:.65rem;color:var(--muted)">${tt.cities.join(' · ')}</div>
                </div>
              </div>
              <div style="font-size:.72rem;display:flex;gap:.8rem;flex-wrap:wrap;margin-bottom:.5rem">
                <span style="color:var(--gold)">💰 ${cost.toLocaleString()}€</span>
                <span style="color:var(--green)">📈 ~${(tt.revenuePerCity * tt.cities.length).toLocaleString()}€ revenus</span>
                <span style="color:var(--blue)">📅 ${tt.weeks} sem.</span>
              </div>
              <div style="font-size:.65rem;color:${can ? 'var(--muted)' : 'var(--red)'};margin-bottom:.5rem">
                ${can ? '✅ Conditions remplies' : `⚠️ Requis: ⭐${tt.minFame} notoriété · 🏅${tt.minRep} réputation`}
              </div>
              <button class="btn-action ${can && canAfford ? 'green' : ''}" ${can && canAfford ? '' : 'disabled'}
                onclick="startTour('${tt.id}','${sel.id}')">
                ${!can ? '🔒 Pas encore accessible' : !canAfford ? '❌ Fonds insuffisants' : `🚌 Lancer la tournée`}
              </button>
            </div>`;
        }).join('')}
      </div>
    ` : '<div style="font-size:.82rem;color:var(--muted);text-align:center;padding:1rem">👆 Sélectionnez un artiste</div>'}
  `;
}
function selectTourArtist(id) {
  _tourArtistId = id;
  const eligible = G.artists.filter(a => !G.projects.some(p => p.artists.includes(a.id)) && (a.blockedWeeks || 0) <= 0 && (a.type === 'musician' || a.type === 'comedian'));
  renderTourModal(eligible);
}
function closeTourModal() { document.getElementById('tour-modal').classList.remove('show'); }

// ── CONTRACT / DEAL SYSTEM ────────────────────────────────────

function generateContracts() {
  const eligible = CONTRACT_DEALS.filter(c => G.reputation >= c.minRep);
  const count = Math.min(eligible.length, 2 + Math.floor(G.labelTier / 2));
  const shuffled = [...eligible].sort(() => Math.random() - 0.5);
  G.availableContracts = shuffled.slice(0, count).map(c => ({ ...c, id: uid(), expires: G.week + 4 }));
}

function signContract(contractId, artistId) {
  const c = (G.availableContracts || []).find(x => x.id === contractId);
  const a = G.artists.find(x => x.id === artistId);
  if (!c || !a) return;
  if (a.fame < c.minFame) { toast(`❌ ${a.name} n'est pas assez célèbre ! (${c.minFame} notoriété requise)`, '#ef4444'); return; }
  if (G.projects.some(p => p.artists.includes(a.id))) { toast('❌ Artiste déjà en projet !', '#ef4444'); return; }
  G.availableContracts = (G.availableContracts || []).filter(x => x.id !== contractId);
  const contract = {
    ...c, id: uid(), artistId, artistName: a.name, artistEmoji: a.emoji,
    weeksLeft: c.duration, totalWeeks: c.duration, done: false, startWeek: G.week
  };
  G.activeContracts = G.activeContracts || [];
  G.activeContracts.push(contract);
  a.history.push(`✍️ Contrat signé : "${c.name}" (${c.duration} sem.)`);
  addNews(`✍️ Contrat "${c.name}" signé avec ${a.emoji} ${a.name} !`);
  toast(`📝 Contrat signé !`, '#22c55e');
  closeContractModal();
  renderAll();
}

function processContracts() {
  if (!G.activeContracts || G.activeContracts.length === 0) return;
  G.activeContracts.forEach(c => {
    if (c.done) return;
    c.weeksLeft--;
    if (c.weeksLeft <= 0) {
      c.done = true;
      const rev = Math.round(c.reward * getProjectRewardMultiplier());
      G.money += rev; G.weekRevenue += rev;
      G.reputation = Math.min(100, G.reputation + c.repGain * getRepGainMultiplier());
      const a = G.artists.find(x => x.id === c.artistId);
      if (a) { a.fame = Math.min(100, a.fame + c.fameGain * getRepGainMultiplier()); a.history.push(`✅ Contrat "${c.name}" terminé ! +${rev.toLocaleString()}€`); }
      addNews(`💼 Contrat "${c.name}" exécuté ! +${rev.toLocaleString()}€ +${c.repGain} rép.`);
    }
  });
  G.completedContracts = [...(G.completedContracts || []), ...G.activeContracts.filter(c => c.done)];
  G.activeContracts = G.activeContracts.filter(c => !c.done);
  // Remove expired
  G.availableContracts = (G.availableContracts || []).filter(c => c.expires > G.week);
}

let _contractModalData = null;
function openContractModal() {
  generateContracts();
  if (!G.availableContracts || G.availableContracts.length === 0) { toast('ℹ️ Aucun contrat disponible cette semaine.', '#60a5fa'); return; }
  _contractModalData = null;
  renderContractModal();
  document.getElementById('contract-modal').classList.add('show');
}

function renderContractModal() {
  const contracts = G.availableContracts || [];
  const sel = _contractModalData;
  document.getElementById('contract-modal-content').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:.8rem;margin-bottom:1rem">
      ${contracts.map(c => `
        <div class="favor-card ${sel && sel.contractId === c.id ? '' : ''}" style="padding:.8rem;cursor:pointer;${sel && sel.contractId === c.id ? 'border-color:var(--green)' : ''}" onclick="selectContract('${c.id}')">
          <div style="display:flex;align-items:center;gap:.6rem">
            <span style="font-size:1.6rem">${c.icon}</span>
            <div style="flex:1">
              <div style="font-weight:800;font-size:.9rem">${c.name}</div>
              <div style="font-size:.68rem;color:var(--muted);margin:.2rem 0">${c.desc}</div>
              <div style="font-size:.7rem;display:flex;gap:.6rem;flex-wrap:wrap">
                <span style="color:var(--gold)">💰 +${c.reward.toLocaleString()}€</span>
                <span style="color:var(--purple)">⭐ +${c.repGain} rép.</span>
                <span style="color:var(--blue)">🌟 +${c.fameGain} notoriété</span>
                <span style="color:var(--muted)">📅 ${c.duration} sem.</span>
              </div>
              <div style="font-size:.65rem;color:var(--orange);margin-top:.3rem">
                Types: ${c.types.map(t => TYPE_LABELS[t]).join(', ')} · Min. ⭐${c.minFame} notoriété
              </div>
            </div>
          </div>
          ${sel && sel.contractId === c.id ? `
            <div style="margin-top:.7rem;border-top:1px solid var(--border);padding-top:.7rem">
              <div style="font-size:.72rem;margin-bottom:.5rem;opacity:.7">Choisir l'artiste pour ce contrat :</div>
              <div class="pm-artist-grid">
                ${G.artists.filter(a => c.types.includes(a.type) && a.fame >= c.minFame && !G.projects.some(p => p.artists.includes(a.id)) && (a.blockedWeeks || 0) <= 0).map(a => `
                  <button class="pm-artist-btn" onclick="signContract('${c.id}','${a.id}')">
                    ${a.emoji} ${a.name}<br>
                    <span style="font-size:.56rem;color:var(--gold)">⭐ ${a.fame}</span>
                  </button>
                `).join('') || '<div style="font-size:.75rem;color:var(--red)">Aucun artiste éligible disponible.</div>'}
              </div>
            </div>` : ''}
        </div>`).join('')}
    </div>
  `;
}
function selectContract(id) {
  _contractModalData = _contractModalData && _contractModalData.contractId === id ? null : { contractId: id };
  renderContractModal();
}
function closeContractModal() { document.getElementById('contract-modal').classList.remove('show'); }

// ── SCANDAL SYSTEM ────────────────────────────────────────────

function triggerScandal(artist) {
  const s = SCANDAL_TYPES[Math.floor(Math.random() * SCANDAL_TYPES.length)];
  const scandal = { ...s, id: uid(), artistId: artist.id, artistName: artist.name, artistEmoji: artist.emoji, week: G.week, resolved: false };
  G.scandals = G.scandals || [];
  G.scandals.push(scandal);
  G.reputation = Math.max(0, G.reputation - s.repLoss);
  artist.fame = Math.max(0, artist.fame - s.fameLoss);
  artist.happiness = clamp((artist.happiness || 70) - s.happyLoss, 0, 100);
  artist.history.push(`${s.icon} Scandale : ${s.name} ! -${s.repLoss} rép. agence`);
  addNews(`${s.icon} SCANDALE : "${s.name}" implique ${artist.emoji} ${artist.name} ! -${s.repLoss} rép.`);
  toast(`🚨 Scandale : ${s.name} !`, '#ef4444');
}

function resolveScandal(scandalId) {
  const s = (G.scandals || []).find(x => x.id === scandalId);
  if (!s || s.resolved) return;
  if (G.money < s.resolveCost) { toast(`❌ ${s.resolveCost.toLocaleString()}€ requis pour gérer ce scandale.`, '#ef4444'); return; }
  G.money -= s.resolveCost; G.weekExpenses += s.resolveCost;
  s.resolved = true;
  G.reputation = Math.min(100, G.reputation + s.resolveRep);
  const a = G.artists.find(x => x.id === s.artistId);
  if (a) { a.happiness = clamp((a.happiness || 70) + 15, 0, 100); a.history.push(`✅ Scandale "${s.name}" géré. -${s.resolveCost.toLocaleString()}€`); }
  addNews(`✅ Scandale "${s.name}" géré. +${s.resolveRep} réputation.`);
  toast(`👌 Scandale résolu !`, '#22c55e');
  renderAll();
}

// ── COLLABORATION SYSTEM ──────────────────────────────────────

function getCollabBonus(typeA, typeB) {
  const key1 = `${typeA}_${typeB}`;
  const key2 = `${typeB}_${typeA}`;
  return COLLAB_BONUSES[key1] || COLLAB_BONUSES[key2] || null;
}

function launchCollabProject(artistIds) {
  if (artistIds.length < 2) { toast('❌ Sélectionnez au moins 2 artistes.', '#ef4444'); return; }
  const artists = artistIds.map(id => G.artists.find(x => x.id === id)).filter(Boolean);
  const types = [...new Set(artists.map(a => a.type))];
  let bestBonus = null;
  for (let i = 0; i < types.length; i++) {
    for (let j = i + 1; j < types.length; j++) {
      const b = getCollabBonus(types[i], types[j]);
      if (b && (!bestBonus || b.fameBonus > bestBonus.fameBonus)) bestBonus = b;
    }
  }
  if (!bestBonus && types.length === 1) bestBonus = { fameBonus: 1.1, repBonus: 1.1, cashBonus: 1.0, label: 'Duo' };
  const basePt = PROJECT_TYPES.find(p => p.id === 'collab') || PROJECT_TYPES[0];
  const duration = Math.max(1, basePt.duration - getProjectDurationReduction());
  const reward = Math.floor(basePt.reward * getProjectRewardMultiplier() * (bestBonus ? bestBonus.cashBonus : 1));
  const repGain = Math.max(1, Math.round(basePt.repGain * getRepGainMultiplier() * (bestBonus ? bestBonus.repBonus : 1)));
  const totalFees = artistIds.reduce((acc, id) => { const a = G.artists.find(x => x.id === id); return acc + (a ? Math.round(a.fee * duration * 0.4) : 0); }, 0);
  if (G.money < totalFees) { toast('❌ Fonds insuffisants !', '#ef4444'); return; }
  const tier = getCurrentTier();
  if (G.projects.length >= tier.maxProjects) { toast(`❌ Max ${tier.maxProjects} projets actifs !`, '#ef4444'); return; }
  G.money -= totalFees; G.weekExpenses += totalFees;
  const label = bestBonus ? bestBonus.label : 'Collaboration';
  G.projects.push({ id: uid(), typeId: 'collab', name: `🤝 ${label}`, artists: [...artistIds], weeksLeft: duration, totalWeeks: duration, reward, repGain, done: false, isCollab: true, collabBonus: bestBonus });
  artists.forEach(a => { a.history.push(`🤝 Collaboration "${label}" lancée !`); });
  addNews(`🤝 Collaboration "${label}" lancée avec ${artists.map(a => a.emoji + a.name).join(' & ')} !`);
  toast(`🎨 Collaboration lancée !`, '#a855f7');
  closeCollabModal();
  renderAll();
}

let _collabSelectedArtists = [];
function openCollabModal() {
  if (G.artists.length < 2) { toast('❌ Il faut au moins 2 artistes !', '#ef4444'); return; }
  _collabSelectedArtists = [];
  renderCollabModal();
  document.getElementById('collab-modal').classList.add('show');
}

function renderCollabModal() {
  const eligible = G.artists.filter(a => !G.projects.some(p => p.artists.includes(a.id)) && (a.blockedWeeks || 0) <= 0);
  const selArtists = _collabSelectedArtists.map(id => G.artists.find(x => x.id === id)).filter(Boolean);
  const types = [...new Set(selArtists.map(a => a.type))];
  let bonusInfo = '';
  if (selArtists.length >= 2) {
    for (let i = 0; i < types.length; i++) {
      for (let j = i + 1; j < types.length; j++) {
        const b = getCollabBonus(types[i], types[j]);
        if (b) bonusInfo += `<div style="font-size:.72rem;color:var(--green);padding:.4rem .6rem;background:rgba(34,197,94,.1);border-radius:6px;margin-bottom:.4rem">✨ ${b.label} — ×${b.fameBonus} fame · ×${b.repBonus} rép. · ×${b.cashBonus} cash</div>`;
      }
    }
    if (!bonusInfo) bonusInfo = `<div style="font-size:.72rem;color:var(--muted);padding:.4rem .6rem">Collaboration standard — pas de bonus spécial</div>`;
  }
  document.getElementById('collab-modal-content').innerHTML = `
    <div style="font-size:.8rem;color:var(--muted);margin-bottom:.7rem">Sélectionnez 2 à 4 artistes pour une collaboration inter-disciplines</div>
    <div class="pm-artist-grid" style="margin-bottom:.8rem">
      ${eligible.map(a => `
        <button class="pm-artist-btn ${_collabSelectedArtists.includes(a.id) ? 'sel' : ''}" onclick="toggleCollabArtist('${a.id}')">
          ${a.emoji} ${a.name}<br>
          <span style="font-size:.56rem;color:${TYPE_COLORS[a.type]}">${TYPE_LABELS[a.type]}</span>
        </button>`).join('') || '<div style="color:var(--muted);font-size:.8rem">Aucun artiste disponible.</div>'}
    </div>
    ${bonusInfo}
    ${_collabSelectedArtists.length >= 2 ? `
      <button class="btn-cta" style="width:100%;margin-top:.8rem" onclick="launchCollabProject([${_collabSelectedArtists.map(id=>`'${id}'`).join(',')}])">
        🤝 Lancer la collaboration (${_collabSelectedArtists.length} artistes)
      </button>` : `<div style="font-size:.75rem;color:var(--muted);text-align:center">Sélectionnez au moins 2 artistes</div>`}
  `;
}

function toggleCollabArtist(id) {
  if (_collabSelectedArtists.includes(id)) _collabSelectedArtists = _collabSelectedArtists.filter(x => x !== id);
  else if (_collabSelectedArtists.length < 4) _collabSelectedArtists.push(id);
  else toast('Max 4 artistes.', '#f97316');
  renderCollabModal();
}
function closeCollabModal() { document.getElementById('collab-modal').classList.remove('show'); }

// ── SALARY NEGOTIATION ────────────────────────────────────────

function openSalaryNegotiation(artistId) {
  const a = G.artists.find(x => x.id === artistId);
  if (!a) return;
  const modal = document.getElementById('salary-modal');
  const content = document.getElementById('salary-modal-content');
  const currentFee = a.fee;
  const minOffer = Math.round(currentFee * 0.85);
  const fairOffer = currentFee;
  const maxOffer = Math.round(currentFee * 1.4);
  content.innerHTML = `
    <div style="text-align:center;margin-bottom:1rem">
      <div style="font-size:2.5rem">${a.emoji}</div>
      <div style="font-weight:800;font-size:1rem;margin-top:.4rem">${a.name}</div>
      <div style="font-size:.78rem;color:var(--muted);margin-top:.2rem">Salaire actuel : <strong style="color:var(--gold)">${currentFee.toLocaleString()}€/sem.</strong></div>
      <div style="font-size:.72rem;color:${getHappinessColor(a.happiness||70)};margin-top:.2rem">${getHappinessLabel(a.happiness||70)}</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:.6rem">
      <div style="font-size:.75rem;opacity:.6;text-align:center;margin-bottom:.2rem">Proposer un nouveau salaire :</div>
      ${[
        { label: '📉 Réduire (-15%)', val: minOffer, color: 'var(--red)', risk: 'Risqué — peut partir !' },
        { label: '🤝 Maintenir', val: fairOffer, color: 'var(--muted)', risk: 'Neutre' },
        { label: '📈 Augmenter (+20%)', val: Math.round(currentFee * 1.2), color: 'var(--green)', risk: 'Satisfaction +15' },
        { label: '💸 Augmenter (+40%)', val: maxOffer, color: 'var(--gold)', risk: 'Satisfaction +30, fidélité maximale' },
      ].map(o => {
        const canAfford = G.money >= o.val * 4;
        return `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:.6rem .8rem;border:1px solid var(--border);border-radius:8px;${canAfford ? '' : 'opacity:.5'}">
            <div>
              <div style="font-weight:700;font-size:.85rem">${o.label}</div>
              <div style="font-size:.65rem;color:${o.color}">${o.risk}</div>
            </div>
            <div style="text-align:right">
              <div style="font-weight:800;color:${o.color}">${o.val.toLocaleString()}€/sem.</div>
              <button class="btn-action ${canAfford ? 'blue' : ''}" style="font-size:.7rem;padding:.3rem .6rem;margin-top:.3rem" ${canAfford ? '' : 'disabled'}
                onclick="confirmSalary('${a.id}', ${o.val})">Proposer</button>
            </div>
          </div>`;
      }).join('')}
    </div>
  `;
  modal.classList.add('show');
}

function confirmSalary(artistId, newFee) {
  const a = G.artists.find(x => x.id === artistId);
  if (!a) return;
  const oldFee = a.fee;
  const pct = newFee / oldFee;
  let happyDelta = 0, accepted = true;
  if (pct < 0.9) {
    const rejectChance = 0.4 + (1 - (a.happiness || 70) / 100) * 0.4;
    if (Math.random() < rejectChance) {
      addNews(`😡 ${a.emoji} ${a.name} a refusé la baisse de salaire et quitte l'agence !`);
      toast(`💔 ${a.name} est parti(e) !`, '#ef4444');
      G.artists = G.artists.filter(x => x.id !== artistId);
      closeSalaryModal();
      renderAll();
      return;
    }
    happyDelta = -20;
  } else if (pct >= 1.35) happyDelta = 30;
  else if (pct >= 1.15) happyDelta = 15;
  else if (pct > 1) happyDelta = 8;
  a.fee = newFee;
  a.happiness = clamp((a.happiness || 70) + happyDelta, 0, 100);
  a.history.push(`💰 Salaire renégocié : ${oldFee.toLocaleString()}€ → ${newFee.toLocaleString()}€`);
  addNews(`💰 ${a.emoji} ${a.name} : salaire renégocié à ${newFee.toLocaleString()}€/sem.`);
  toast(`✅ Salaire mis à jour !`, '#22c55e');
  closeSalaryModal();
  closeArtistModal();
  renderAll();
}

function closeSalaryModal() { document.getElementById('salary-modal').classList.remove('show'); }

// ── PROCESSRANDOM EVENTS (ENRICHI) ───────────────────────────

function randomWeeklyEventV2() {
  if (G.artists.length === 0) return;

  // ── Scandales actifs continuent de faire des dégâts ──────────
  const activeScandals = (G.scandals || []).filter(s => !s.resolved);
  activeScandals.forEach(s => {
    if (Math.random() < 0.45) {
      const repLoss = rand(1, 3);
      G.reputation = Math.max(0, G.reputation - repLoss);
      addNews(`📰 Le scandale "${s.name}" continue de circuler… (-${repLoss} rép.)`);
    }
  });

  // ── Risque de nouveau scandale (artistes malheureux) ─────────
  const veryUnhappy = G.artists.filter(a => (a.happiness||70) < 28);
  const scandalChance = 0.03 + veryUnhappy.length * 0.04;
  if (Math.random() < scandalChance) {
    const target = G.artists[Math.floor(Math.random() * G.artists.length)];
    triggerScandal(target);
    return;
  }

  // ── Événements contextuels ────────────────────────────────────
  // Probabilité d'événement plus haute si des projets sont actifs
  const baseChance = G.projects.length > 0 ? 0.65 : 0.35;
  if (Math.random() > baseChance) return;

  const a = G.artists[Math.floor(Math.random() * G.artists.length)];
  a.history = a.history || [];
  const fame = a.fame || 20;
  const energy = a.energy || 100;
  const happiness = a.happiness || 70;
  const repMult = 1 + G.labelTier * 0.1;

  // Événements négatifs plus probables si l'artiste est épuisé/malheureux
  const negativeWeight = Math.max(0, (100 - happiness) / 100 * 0.5 + (100 - energy) / 100 * 0.3);

  // Sélection d'un pool d'événements selon le type d'artiste et sa fame
  const positiveEvents = [
    // Basse fame → événements discrets
    fame < 30 && { chance: 0.3, fn: () => {
      const gain = rand(2,5);
      a.fame = Math.min(100, a.fame + gain);
      a.happiness = clamp(a.happiness + 4, 0, 100);
      return `📱 ${a.emoji} ${a.name} gagne des abonnés sur les réseaux (+${gain} notoriété)`;
    }},
    fame < 50 && { chance: 0.25, fn: () => {
      const rep = Math.round(2 * repMult);
      G.reputation = Math.min(100, G.reputation + rep);
      a.history.push('🎙️ Interview locale remarquée.');
      return `🎙️ ${a.emoji} ${a.name} : interview locale — label remarqué ! (+${rep} rép.)`;
    }},
    // Fame moyenne → opportunités sérieuses
    fame >= 30 && fame < 65 && { chance: 0.28, fn: () => {
      const bonus = rand(800, 2500) * (1 + G.labelTier * 0.3);
      G.money += bonus; G.weekRevenue += bonus;
      a.fame = Math.min(100, a.fame + rand(2,5));
      return `📺 ${a.emoji} ${a.name} : passage en émission régionale +${bonus.toLocaleString()}€`;
    }},
    fame >= 30 && fame < 65 && { chance: 0.2, fn: () => {
      const rep = Math.round(rand(3,7) * repMult);
      G.reputation = Math.min(100, G.reputation + rep);
      a.happiness = clamp(a.happiness + 8, 0, 100);
      a.history.push(`🏅 Nomination à un prix local.`);
      return `🏅 ${a.emoji} ${a.name} nominé(e) à un prix régional ! (+${rep} rép.)`;
    }},
    // Haute fame → événements majeurs
    fame >= 65 && { chance: 0.3, fn: () => {
      const bonus = rand(3000, 8000) * (1 + G.labelTier * 0.4);
      const rep = Math.round(rand(4,9) * repMult);
      G.money += bonus; G.weekRevenue += bonus;
      G.reputation = Math.min(100, G.reputation + rep);
      a.fame = Math.min(100, a.fame + rand(3,7));
      return `🌟 ${a.emoji} ${a.name} : buzz médiatique ! +${bonus.toLocaleString()}€, +${rep} rép.`;
    }},
    fame >= 65 && { chance: 0.2, fn: () => {
      const bonus = rand(5000, 15000);
      G.money += bonus; G.weekRevenue += bonus;
      a.history.push(`💎 Contrat publicitaire signé.`);
      return `💎 ${a.emoji} ${a.name} signe un contrat pub (+${bonus.toLocaleString()}€)`;
    }},
    // Événements liés au type d'artiste
    a.type === 'musician' && { chance: 0.25, fn: () => {
      const fameGain = rand(3, 8);
      a.fame = Math.min(100, a.fame + fameGain);
      return `🎵 ${a.emoji} ${a.name} : une de ses chansons repasse en rotation radio (+${fameGain} notoriété)`;
    }},
    a.type === 'painter' && { chance: 0.25, fn: () => {
      const bonus = rand(500, 3000);
      G.money += bonus; G.weekRevenue += bonus;
      return `🎨 ${a.emoji} ${a.name} : vente d'une œuvre en galerie (+${bonus.toLocaleString()}€)`;
    }},
    a.type === 'comedian' && { chance: 0.25, fn: () => {
      const rep = Math.round(rand(2, 6) * repMult);
      G.reputation = Math.min(100, G.reputation + rep);
      a.happiness = clamp(a.happiness + 10, 0, 100);
      return `😂 ${a.emoji} ${a.name} : clip humoristique viral (+${rep} rép.)`;
    }},
    a.type === 'photographer' && { chance: 0.25, fn: () => {
      const rep = Math.round(rand(3, 7) * repMult);
      G.reputation = Math.min(100, G.reputation + rep);
      return `📸 ${a.emoji} ${a.name} : photo primée dans un concours professionnel (+${rep} rép.)`;
    }},
    a.type === 'poet' && { chance: 0.25, fn: () => {
      const rep = Math.round(rand(4, 8) * repMult);
      G.reputation = Math.min(100, G.reputation + rep);
      a.happiness = clamp(a.happiness + 6, 0, 100);
      return `✍️ ${a.emoji} ${a.name} : texte partagé massivement en ligne (+${rep} rép.)`;
    }},
    // Événements artistiques généraux
    { chance: 0.15, fn: () => {
      const talGain = rand(1, 3);
      a.talent = Math.min(100, a.talent + talGain);
      a.energy = clamp(a.energy + rand(5,12), 0, 100);
      a.history.push(`📚 Session d'auto-formation.`);
      return `📚 ${a.emoji} ${a.name} a travaillé seul(e) sur son art (+${talGain} talent)`;
    }},
  ].filter(Boolean);

  const negativeEvents = [
    { chance: 0.4, fn: () => {
      const loss = rand(3, 12);
      a.energy = clamp(a.energy - loss, 0, 100);
      a.mood = clamp(a.mood - rand(5, 12), 0, 100);
      a.history.push('😴 Période de fatigue intense.');
      return `😴 ${a.emoji} ${a.name} traverse une période de fatigue (-${loss} énergie)`;
    }},
    { chance: 0.3, fn: () => {
      a.happiness = clamp(a.happiness - rand(8, 18), 0, 100);
      a.mood = clamp(a.mood - rand(8, 14), 0, 100);
      a.history.push('💔 Problème personnel.');
      return `💔 ${a.emoji} ${a.name} traverse des difficultés personnelles (moral en baisse)`;
    }},
    energy < 40 && { chance: 0.5, fn: () => {
      a.blockedWeeks = (a.blockedWeeks || 0) + rand(1, 2);
      a.happiness = clamp(a.happiness - 12, 0, 100);
      a.history.push('🤒 Épuisement — arrêt forcé.');
      return `🤒 ${a.emoji} ${a.name} : surmenage — arrêt ${a.blockedWeeks} sem. !`;
    }},
    fame >= 40 && { chance: 0.25, fn: () => {
      const repLoss = rand(3, 8);
      G.reputation = Math.max(0, G.reputation - repLoss);
      a.happiness = clamp(a.happiness - 10, 0, 100);
      a.history.push('📰 Bad buzz sur les réseaux.');
      return `📰 ${a.emoji} ${a.name} : bad buzz sur les réseaux (-${repLoss} rép.)`;
    }},
    { chance: 0.2, fn: () => {
      const fine = rand(500, 2500) * Math.max(1, G.labelTier);
      G.money = Math.max(0, G.money - fine);
      G.weekExpenses += fine;
      a.history.push(`💸 Amende / litige : -${fine.toLocaleString()}€`);
      return `⚖️ Litige contractuel autour de ${a.emoji} ${a.name} — -${fine.toLocaleString()}€`;
    }},
  ].filter(Boolean);

  // Tirage pondéré
  const useNegative = Math.random() < negativeWeight;
  const pool = useNegative ? negativeEvents : positiveEvents;
  const totalChance = pool.reduce((s,e) => s + (e.chance || 0), 0);
  if (totalChance === 0) return;
  let roll = Math.random() * totalChance;
  for (const ev of pool) {
    roll -= ev.chance || 0;
    if (roll <= 0) {
      try { const msg = ev.fn(); if (msg) addNews(msg); } catch(e) {}
      return;
    }
  }
}

// ── DYNAMIC PROGRESSION ───────────────────────────────────────

function applyDynamicProgression() {
  // Artists naturally grow in fame if they've done projects
  G.artists.forEach(a => {
    const doneCount = G.doneProjects.filter(p => p.artists && p.artists.includes(a.id)).length;
    if (doneCount > 0 && Math.random() < 0.15) {
      const gain = rand(1, 3);
      a.fame = Math.min(100, a.fame + gain);
    }
    // Energy natural recovery
    if ((a.energy || 100) < 60 && (a.blockedWeeks || 0) === 0 && !G.projects.some(p => p.artists.includes(a.id))) {
      a.energy = clamp((a.energy || 100) + rand(5, 10), 0, 100);
    }
  });
  // Reputation slow passive decay if no active roster
  if (G.artists.length === 0 && G.week > 5) {
    G.reputation = Math.max(0, G.reputation - 0.5);
  }
}



function processRivals() {
  if(!G.rivals) return;

  // Check for new rival unlocks
  checkUnlockNewRivals();

  G.rivals.forEach(rival => {
    rival.growthWeeks = (rival.growthWeeks || 0) + 1;

    // Allied rivals don't attack
    if (rival.isAllied || (G.alliances || []).some(a => a.rivalId === rival.id && a.active !== false)) {
      rival.isAllied = true;
      // Allied rival grows slower (cooperative)
      if (rival.growthWeeks % 6 === 0) {
        rival.money += rand(2000, 6000) * (rival.tier + 1);
        rival.reputation = Math.min(100, rival.reputation + rand(1, 2));
      }
      return;
    }

    // Passive money & rep growth
    const growInterval = Math.max(2, 8 - rival.tier * 1.5);
    if(rival.growthWeeks % Math.round(growInterval) === 0) {
      const growthMult = rival.style === 'corporate' ? 2.5 : rival.style === 'viral' ? 1.8 : rival.style === 'guerrilla' ? 0.8 : 1;
      rival.money += rand(3000, 10000) * (rival.tier + 1) * growthMult;
      rival.reputation = Math.min(100, rival.reputation + rand(1, 3));
    }

    // Rival tier leveling
    if(rival.tier < 5) {
      const nextTier = LABEL_TIERS[rival.tier + 1];
      if(nextTier && rival.money >= nextTier.unlockCost && rival.reputation >= nextTier.unlockRep) {
        rival.tier++;
        addNews(`⚠️ ${rival.icon} ${rival.name} a évolué : ${LABEL_TIERS[rival.tier].name} !`);
      }
    }

    // Active debauching
    const baseChance = rival.style === 'aggressive' ? 0.5 : rival.style === 'corporate' ? 0.45 : rival.style === 'balanced' ? 0.35 : rival.style === 'viral' ? 0.3 : 0.2;
    const debouchChance = baseChance + rival.tier * 0.08;
    const securityReduction = getSecurityLevel() * 0.08;
    const allianceProtection = getContactPassiveBonus('rivalProtection');
    const finalChance = Math.max(0.04, debouchChance - securityReduction - allianceProtection);

    if(Math.random() < finalChance) {
      // Specialists only target matching artist types
      const rivalSpecialty = rival.specialty || ['musician'];
      const unhappy = G.artists.filter(a =>
        (a.happiness || 70) < 40 &&
        (rivalSpecialty.includes('all') || rivalSpecialty.includes(a.type)) &&
        !G.projects.some(p => p.artists.includes(a.id)) &&
        !G.pendingOffers.some(o => o.artistId === a.id)
      );
      if(unhappy.length > 0) {
        const target = unhappy[Math.floor(Math.random() * unhappy.length)];
        const offerSalary = Math.floor(target.fee * (1.2 + rival.tier * 0.12));
        G.pendingOffers.push({
          id: uid(), rivalId: rival.id, artistId: target.id, offerSalary,
          rivalName: rival.name, rivalIcon: rival.icon, rivalColor: rival.color,
          artistName: target.name, artistEmoji: target.emoji,
        });
        rival.lastAction = `A approché ${target.emoji} ${target.name}`;
        addNews(`🎯 ${rival.icon} ${rival.name} approche ${target.emoji} ${target.name} avec une offre de ${offerSalary.toLocaleString()}€/sem !`);
      }
    }
  });
}

function acceptCounterOffer(offerId) {
  const offer = G.pendingOffers.find(o => o.id === offerId);
  if(!offer) return;
  const a = G.artists.find(x => x.id === offer.artistId);
  if(!a) { G.pendingOffers = G.pendingOffers.filter(o => o.id !== offerId); renderAll(); return; }

  const raise = Math.ceil((offer.offerSalary - a.fee) / 100) * 100;
  const totalCost = raise * 4; // 4 weeks advance
  if(G.money < totalCost) {
    toast(`❌ ${totalCost.toLocaleString()}€ requis pour contre-offrir !`, '#ef4444');
    return;
  }
  G.money -= totalCost;
  G.weekExpenses += totalCost;
  a.fee = offer.offerSalary;
  a.happiness = clamp((a.happiness || 70) + 25, 0, 100);
  a.mood = clamp((a.mood || 100) + 15, 0, 100);
  a.history.push(`💰 Contre-offre de l'agence acceptée. Nouveau salaire : ${a.fee.toLocaleString()}€/sem.`);
  G.pendingOffers = G.pendingOffers.filter(o => o.id !== offerId);
  addNews(`✅ Contre-offre acceptée ! ${a.emoji} ${a.name} reste — ${a.fee.toLocaleString()}€/sem.`);
  toast(`🤝 ${a.name} reste dans l'agence !`, '#22c55e');
  closeRivalOfferModal();
  renderAll();
}

function rejectCounterOffer(offerId) {
  const offer = G.pendingOffers.find(o => o.id === offerId);
  if(!offer) return;
  const rival = G.rivals.find(r => r.id === offer.rivalId);
  const a = G.artists.find(x => x.id === offer.artistId);
  if(a) {
  if (rival) rival.artistsDebauched.push({ name: a.name, emoji: a.emoji, type: a.type });
  G.artists = G.artists.filter(x => x.id !== offer.artistId);
  G.reputation = Math.max(0, G.reputation - 4);
  addNews(`💔 ${a.emoji} ${a.name} a rejoint ${offer.rivalIcon} ${offer.rivalName}.`);
  toast(`💔 ${a.name} est parti(e) chez la concurrence.`, '#ef4444');
}
  G.pendingOffers = G.pendingOffers.filter(o => o.id !== offerId);
  closeRivalOfferModal();
  renderAll();
}

function spyOnRival(rivalId) {
  const cost = 5000 + G.labelTier * 2000;
  if(G.money < cost) { toast(`❌ Espionnage coûte ${cost.toLocaleString()}€`, '#ef4444'); return; }
  G.money -= cost;
  G.weekExpenses += cost;
  const rival = G.rivals.find(r => r.id === rivalId);
  if(!rival) return;
  rival.spied = true;
  addNews(`🕵️ Rapport d'espionnage sur ${rival.icon} ${rival.name} obtenu.`);
  toast(`🕵️ Espionnage réussi !`, '#a855f7');
  renderRivalsTab();
  renderHUD();
}

function sabotageRival(rivalId) {
  const cost = 12000 + G.labelTier * 4000;
  if(G.money < cost) { toast(`❌ Sabotage coûte ${cost.toLocaleString()}€`, '#ef4444'); return; }
  G.money -= cost;
  G.weekExpenses += cost;
  const rival = G.rivals.find(r => r.id === rivalId);
  if(!rival) return;
  const successChance = 0.4 + getUpgradeLevel('pr') * 0.06 + G.labelTier * 0.05;
  if(Math.random() < successChance) {
    const repLoss = rand(8, 20);
    const moneyLoss = rand(15000, 50000) * (rival.tier + 1);
    rival.reputation = Math.max(0, rival.reputation - repLoss);
    rival.money = Math.max(0, rival.money - moneyLoss);
    addNews(`💣 Sabotage contre ${rival.icon} ${rival.name} : succès ! -${repLoss} rép. chez eux.`);
    toast(`💣 Sabotage réussi ! ${rival.name} perd du terrain.`, '#22c55e');
  } else {
    G.reputation = Math.max(0, G.reputation - 6);
    addNews(`💥 Sabotage contre ${rival.icon} ${rival.name} découvert ! -6 réputation.`);
    toast(`💥 Sabotage raté — votre réputation en souffre.`, '#ef4444');
  }
  renderAll();
}

// ── HAPPINESS / WELLBEING SYSTEM ─────────────────────────────

function applyWeeklyHappiness() {
  const wellbonus = getWellbeingBonus();
  G.artists.forEach(a => {
    let delta = wellbonus;
    const projectCount = G.projects.filter(p => p.artists.includes(a.id)).length;
    const isResting     = (a.blockedWeeks || 0) > 0;
    const energy        = a.energy || 100;
    const mood          = a.mood || 100;
    const fame          = a.fame || 20;

    // ── Rémunération vs. notoriété (les stars veulent être bien payées) ─
    // Un artiste à fame 80 attend un salaire proportionnel
    const expectedFee = 1200 + fame * 55;  // 1200€ (inconnu) → 5700€ (star fame=80)
    const salaryRatio = a.fee / expectedFee;
    if      (salaryRatio >= 1.4)  delta += 5;   // Bien payé au-dessus des attentes
    else if (salaryRatio >= 1.0)  delta += 2;   // Correctement payé
    else if (salaryRatio >= 0.75) delta -= 3;   // Légèrement sous-payé
    else if (salaryRatio >= 0.5)  delta -= 7;   // Clairement sous-payé
    else                          delta -= 14;  // Exploité — risque de rupture

    // ── Charge de travail ───────────────────────────────────────────
    if (isResting)         delta += 6;   // Repos bien mérité
    else if (projectCount === 0) delta += 2; // Libre mais pas de projet = légère frustration au bout
    else if (projectCount === 1) delta -= 1; // Travail normal
    else if (projectCount >= 2)  delta -= 10; // Surchargé

    // ── Énergie et moral ────────────────────────────────────────────
    if (energy < 20) delta -= 10;
    else if (energy < 40) delta -= 5;
    else if (energy > 80 && !projectCount) delta += 2;

    if (mood < 25) delta -= 6;
    else if (mood < 45) delta -= 3;

    // ── Concurrence interne (même type) ────────────────────────────
    const rivals = G.artists.filter(b => b.id !== a.id && b.type === a.type);
    if (rivals.length >= 3) delta -= 5;
    else if (rivals.length >= 1) delta -= 1;

    // ── Succès récents ──────────────────────────────────────────────
    const recentSuccess = G.doneProjects.slice(-10).filter(p => p.artists && p.artists.includes(a.id) && !p.failed).length;
    if (recentSuccess >= 3) delta += 4;
    else if (recentSuccess >= 1) delta += 2;

    // ── Semaines sans projet ────────────────────────────────────────
    a._idleWeeks = (a._idleWeeks || 0);
    if (projectCount === 0 && !isResting) {
      a._idleWeeks++;
      if (a._idleWeeks > 4) delta -= 3; // Trop longtemps sans travailler
    } else {
      a._idleWeeks = 0;
    }

    a.happiness = clamp((a.happiness || 70) + clamp(delta, -20, 12), 0, 100);
  });
}

function getHappinessColor(h) {
  if(h >= 70) return 'var(--green)';
  if(h >= 45) return 'var(--gold)';
  if(h >= 25) return 'var(--orange)';
  return 'var(--red)';
}

function getHappinessLabel(h) {
  if(h >= 80) return '😄 Épanoui';
  if(h >= 60) return '🙂 Satisfait';
  if(h >= 40) return '😐 Neutre';
  if(h >= 25) return '😟 Insatisfait';
  return '😡 Furieux';
}

// ── FAVOR SYSTEM ─────────────────────────────────────────────

let _favorArtistId = null;

function openFavorModal(artistId) {
  _favorArtistId = artistId;
  const a = G.artists.find(x => x.id === artistId);
  if(!a) return;
  const content = document.getElementById('favor-modal-content');
  content.innerHTML = `
    <div style="text-align:center;margin-bottom:1.2rem">
      <div style="font-size:2.5rem">${a.emoji}</div>
      <div style="font-weight:800;font-size:1rem;margin-top:.4rem">${a.name}</div>
      <div style="font-size:.78rem;color:${getHappinessColor(a.happiness || 70)};margin-top:.3rem">
        ${getHappinessLabel(a.happiness || 70)} — ${Math.round(a.happiness || 70)}/100
      </div>
    </div>
    <div class="favors-grid">
      ${FAVORS.map(f => {
        const feeRaiseCost = f.feeRaise ? Math.floor(a.fee * f.feeRaise * 4) : 0;
        const realCost = f.feeRaise ? feeRaiseCost : f.cost;
        const canAfford = G.money >= realCost;
        const effects = [];
        if(f.happyGain) effects.push(`😊 +${f.happyGain}`);
        if(f.energyGain) effects.push(`⚡ +${f.energyGain}`);
        if(f.moodGain) effects.push(`💭 +${f.moodGain}`);
        if(f.talentGain) effects.push(`🎯 talent +${f.talentGain}`);
        if(f.fameGain) effects.push(`⭐ +${f.fameGain} notoriété`);
        if(f.feeRaise) effects.push(`💰 salaire +${Math.round(a.fee * f.feeRaise).toLocaleString()}€`);
        return `
          <div class="favor-card ${canAfford ? '' : 'disabled'}">
            <div class="favor-icon">${f.icon}</div>
            <div class="favor-name">${f.name}</div>
            <div class="favor-desc">${f.desc}</div>
            <div class="favor-effects">${effects.join(' · ')}</div>
            <div class="favor-cost">${realCost > 0 ? realCost.toLocaleString()+'€' : 'Gratuit'}</div>
            <button class="btn-action ${canAfford ? 'green' : ''}" ${canAfford ? '' : 'disabled'}
              onclick="giveFavor('${artistId}','${f.id}')">
              ${canAfford ? 'Offrir' : '❌ Fonds insuffisants'}
            </button>
          </div>
        `;
      }).join('')}
    </div>
  `;
  document.getElementById('favor-modal').classList.add('show');
}

function giveFavor(artistId, favorId) {
  const a = G.artists.find(x => x.id === artistId);
  const favor = FAVORS.find(f => f.id === favorId);
  if(!a || !favor) return;

  const feeRaiseCost = favor.feeRaise ? Math.floor(a.fee * favor.feeRaise * 4) : 0;
  const realCost = favor.feeRaise ? feeRaiseCost : favor.cost;
  if(G.money < realCost) { toast('❌ Fonds insuffisants !', '#ef4444'); return; }

  G.money -= realCost;
  G.weekExpenses += realCost;
  if(favor.happyGain)     a.happiness = clamp((a.happiness || 70) + favor.happyGain, 0, 100);
  if(favor.energyGain)    a.energy    = clamp((a.energy || 100) + favor.energyGain, 0, 100);
  if(favor.moodGain)      a.mood      = clamp((a.mood || 100) + favor.moodGain, 0, 100);
if(favor.talentGain)    a.talent    = Math.min(100, (Number(a.talent) || 0) + favor.talentGain);
if(favor.fameGain)      a.fame      = Math.min(100, (Number(a.fame) || 0) + favor.fameGain);
  if(favor.feeRaise)      a.fee       = Math.round(a.fee * (1 + favor.feeRaise));
  if(favor.blockedWeeks)  a.blockedWeeks = Math.max(a.blockedWeeks || 0, favor.blockedWeeks);

  a.history = a.history || [];
a.history.push(`🎁 ${favor.icon} ${favor.name} offert. Satisfaction +${favor.happyGain || 0}`);

  a.history.push(`🎁 ${favor.icon} ${favor.name} offert. Satisfaction +${favor.happyGain || 0}`);
  addNews(`🎁 ${favor.name} offert à ${a.emoji} ${a.name}.`);
  toast(`🎁 ${favor.name} offert à ${a.name} !`, '#22c55e');
  closeFavorModal();
  openArtistModal(artistId);
  renderHUD();
}

function closeFavorModal() { document.getElementById('favor-modal').classList.remove('show'); }

// ── RIVAL OFFER MODAL ─────────────────────────────────────────

function openRivalOfferModal(offerId) {
  const offer = G.pendingOffers.find(o => o.id === offerId);
  if(!offer) return;
  const a = G.artists.find(x => x.id === offer.artistId);
  if(!a) { G.pendingOffers = G.pendingOffers.filter(o => o.id !== offerId); return; }
  const counterCost = (offer.offerSalary > a.fee)
  ? (Math.ceil((offer.offerSalary - a.fee) / 100) * 100 * 4)
  : 0;
  document.getElementById('rival-offer-content').innerHTML = `
    <div style="text-align:center;margin-bottom:1rem">
      <div style="font-size:2.5rem">${offer.rivalIcon}</div>
      <div style="font-size:1rem;font-weight:800;color:${offer.rivalColor};margin-top:.3rem">${offer.rivalName}</div>
      <div style="font-size:.8rem;color:var(--muted);margin-top:.3rem">approche votre artiste…</div>
    </div>
    <div style="text-align:center;font-size:2rem;margin:.8rem 0">${offer.artistEmoji}</div>
    <div style="text-align:center;font-weight:800;font-size:1.1rem;margin-bottom:.3rem">${offer.artistName}</div>
    <div style="text-align:center;font-size:.85rem;color:var(--muted);margin-bottom:1.2rem">
      Offre proposée : <strong style="color:var(--gold)">${offer.offerSalary.toLocaleString()}€/sem.</strong>
      (actuel : ${a.fee.toLocaleString()}€/sem.)
    </div>
    <div style="display:flex;gap:.8rem;flex-direction:column">
      <button class="btn-action green" onclick="acceptCounterOffer('${offer.id}')">
        🤝 Contre-offrir (${Math.ceil(counterCost).toLocaleString()}€ avance) — ${offer.offerSalary.toLocaleString()}€/sem.
      </button>
      <button class="btn-action red" onclick="rejectCounterOffer('${offer.id}')">
        💔 Laisser partir ${offer.artistName}
      </button>
    </div>
  `;
  document.getElementById('rival-offer-modal').classList.add('show');
}

function closeRivalOfferModal() {
  document.getElementById('rival-offer-modal').classList.remove('show');
  // Show next pending offer if any
  setTimeout(() => {
    if(G.pendingOffers && G.pendingOffers.length > 0) {
      openRivalOfferModal(G.pendingOffers[0].id);
    }
  }, 300);
}

// ── NORMALIZE ─────────────────────────────────────────────────

function normalizeArtist(rawArtist) {
  const a = rawArtist && typeof rawArtist === 'object' ? rawArtist : {};
  return {
    ...a,
    id:           typeof a.id === 'string' ? a.id : uid(),
    name:         String(a.name || 'Artiste'),
    type: (typeof a.type === 'string' && TYPE_LABELS[a.type.trim()]) ? a.type.trim() : 'musician',
    emoji:        String(a.emoji || '🎭'),
    skills:       Array.isArray(a.skills) ? a.skills.map(s=>String(s)).slice(0,8) : [],
    desc:         String(a.desc || ''),
    talent:       clamp(Number(a.talent) || 50, 1, 100),
    fame:         clamp(Number(a.fame) || 20, 0, 100),
    charisma:     clamp(Number(a.charisma) || 50, 1, 100),
    fee:          Math.max(200, Math.floor(Number(a.fee) || 1000)),
    mood:         clamp(Number(a.mood) || 100, 0, 100),
    energy:       clamp(Number(a.energy) || 100, 0, 100),
    happiness:    clamp(Number(a.happiness) || 75, 0, 100),
    blockedWeeks: Math.max(0, Math.floor(Number(a.blockedWeeks) || 0)),
    history:      Array.isArray(a.history) ? a.history.map(h=>String(h)).slice(-50) : [],
  };
}

function normalizeState(rawState) {
  const base = createDefaultState();
  const input = rawState && typeof rawState === 'object' ? rawState : {};
  const next = deepClone(base);

  next.week         = Math.max(1, Math.floor(Number(input.week) || 1));
  next.money        = Math.max(0, Math.floor(Number(input.money) || base.money));
  next.reputation   = clamp(Number(input.reputation) || base.reputation, 0, 100);
  next.artists      = Array.isArray(input.artists) ? input.artists.map(normalizeArtist) : [];
  next.projects     = Array.isArray(input.projects)
    ? input.projects.filter(p=>p&&typeof p==='object').map(p=>({
        ...p,
        id:        typeof p.id==='string' ? p.id : uid(),
        artists:   Array.isArray(p.artists) ? p.artists.filter(id=>next.artists.some(a=>a.id===id)) : [],
        weeksLeft: Math.max(0, Math.floor(Number(p.weeksLeft)||0)),
        totalWeeks:Math.max(1, Math.floor(Number(p.totalWeeks)||1)),
        reward:    Math.max(0, Math.floor(Number(p.reward)||0)),
        repGain:   Math.max(0, Number(p.repGain)||0),
        done:      !!p.done,
      })) : [];
  next.doneProjects = Array.isArray(input.doneProjects) ? input.doneProjects.slice(-100) : [];
  next.royaltyCatalog = Array.isArray(input.royaltyCatalog) ? input.royaltyCatalog.filter(x=>x&&typeof x==='object').slice(-100).map(x=>({name:String(x.name||'Projet'), weekly:Math.max(0,Math.floor(Number(x.weekly)||0)), weeksLeft:Math.max(0,Math.floor(Number(x.weeksLeft)||0))})) : [];
  next.market       = Array.isArray(input.market) ? input.market.map(normalizeArtist) : [];
  next.events       = Array.isArray(input.events)
    ? input.events.filter(e=>e&&typeof e==='object').map(e=>({
        ...e, id:typeof e.id==='string'?e.id:uid(), used:!!e.used,
        reward:Math.max(0,Number(e.reward)||0), repGain:Math.max(0,Number(e.repGain)||0), fameGain:Math.max(0,Number(e.fameGain)||0),
      })) : [];
  next.weekRevenue  = Math.max(0, Number(input.weekRevenue) || 0);
  next.weekExpenses = Math.max(0, Number(input.weekExpenses) || 0);
  next.totalRevenue = Math.max(0, Number(input.totalRevenue) || 0);
  next.totalExpenses= Math.max(0, Number(input.totalExpenses) || 0);
  next.artFilter    = ['all','musician','painter','comedian','photographer','poet'].includes(input.artFilter) ? input.artFilter : 'all';
  next.newProject   = { type:null, artists:[] };
  next.weeklyLog    = Array.isArray(input.weeklyLog) ? input.weeklyLog.map(x=>String(x)).slice(-40) : [];
  next.agencyName   = String(input.agencyName || base.agencyName);
  next.upgrades     = { ...base.upgrades, ...(input.upgrades && typeof input.upgrades==='object' ? input.upgrades : {}) };
  AGENCY_UPGRADES.forEach(u => { next.upgrades[u.id] = clamp(Math.floor(Number(next.upgrades[u.id])||0), 0, u.maxLevel); });
  next.milestonesClaimed = Array.isArray(input.milestonesClaimed)
    ? input.milestonesClaimed.filter(id=>MILESTONES.some(m=>m.id===id)) : [];
  // NEW fields
  next.labelTier    = clamp(Math.floor(Number(input.labelTier)||0), 0, 5);
  next.rivals       = Array.isArray(input.rivals) && input.rivals.length === RIVAL_TEMPLATES.length
    ? input.rivals.map((r, i) => ({ ...RIVAL_TEMPLATES[i], ...r }))
    : createDefaultRivals();
  next.pendingOffers= Array.isArray(input.pendingOffers) ? input.pendingOffers : [];
  next.labelHistory = Array.isArray(input.labelHistory) ? input.labelHistory.slice(-20) : [];
  next.version      = 3;
  next.lastUpdatedAt    = Number(input.lastUpdatedAt) || Date.now();
  next.lastWeeklySalaries = Math.max(0, Number(input.lastWeeklySalaries)||0);
  next.lastWeekNet    = Number.isFinite(Number(input.lastWeekNet)) ? Number(input.lastWeekNet) : 0;
  // v4 fields
  next.activeTours      = Array.isArray(input.activeTours) ? input.activeTours : [];
  next.completedTours   = Array.isArray(input.completedTours) ? input.completedTours.slice(-50) : [];
  next.activeContracts  = Array.isArray(input.activeContracts) ? input.activeContracts : [];
  next.completedContracts = Array.isArray(input.completedContracts) ? input.completedContracts.slice(-50) : [];
  next.scandals         = Array.isArray(input.scandals) ? input.scandals.slice(-20) : [];
  next.availableContracts = Array.isArray(input.availableContracts) ? input.availableContracts : [];
  // v5
  next.alliances        = Array.isArray(input.alliances) ? input.alliances : [];
  next.unlockedContacts = Array.isArray(input.unlockedContacts) ? input.unlockedContacts : [];
  next.visitedCities    = Array.isArray(input.visitedCities) ? input.visitedCities : [];
  return next;
}

// ── SAVE/LOAD ─────────────────────────────────────────────────

function createSavePayload() { return normalizeState({ ...G, lastUpdatedAt: Date.now() }); }

function saveGame() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(createSavePayload()));
    updateTitleActions();
    return true;
  } catch (_err) {
    toast('❌ Sauvegarde impossible (stockage plein).', '#ef4444');
    return false;
  }
}

function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if(!raw) return false;
  try {
    G = normalizeState(JSON.parse(raw));
    return true;
  } catch (_err) {
    toast('❌ Sauvegarde corrompue, nouvelle partie.', '#ef4444');
    return false;
  }
}

function clearSave() { localStorage.removeItem(SAVE_KEY); updateTitleActions(); }

function exportSave() {
  const raw = JSON.stringify(createSavePayload());
  const encoded = btoa(String.fromCharCode(...new TextEncoder().encode(raw)));
  if(navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(encoded)
      .then(()=>toast('📋 Sauvegarde copiée.','#22c55e'))
      .catch(()=>{ window.prompt('Copiez votre sauvegarde :', encoded); });
    return;
  }
  window.prompt('Copiez votre sauvegarde :', encoded);
}

function importSave() {
  const raw = window.prompt('Collez la sauvegarde exportée :');
  if(!raw) return;
  try {
    const bytes = Uint8Array.from(atob(raw.trim()), c => c.charCodeAt(0));
const decoded = new TextDecoder().decode(bytes);
    G = normalizeState(JSON.parse(decoded));
    saveGame();
    showScreen('main-screen');
    openTab('dashboard');
    renderAll();
    toast('✅ Sauvegarde importée.', '#22c55e');
  } catch (_err) {
    toast('❌ Import invalide.', '#ef4444');
  }
}

// ── MISC HELPERS ─────────────────────────────────────────────

function getRepTier(rep) {
  for(let i=REP_TIERS.length-1;i>=0;i--)
    if(rep >= REP_TIERS[i].min) return REP_TIERS[i];
  return REP_TIERS[0];
}

function toast(msg, color='#e2e8f0') {
  const el = document.getElementById('toast');
  if(!el) return;
  el.textContent = msg;
  el.style.borderColor = color;
  el.style.color = color;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(()=>el.classList.remove('show'), 2800);
}

function addNews(msg) {
  (G.weeklyLog || (G.weeklyLog = [])).push(msg);
  const feed = document.getElementById('news-feed');
  if(!feed) return;
  const div = document.createElement('div');
  div.className = 'news-item';
  div.textContent = msg;
  feed.insertBefore(div, feed.firstChild);
  while(feed.children.length > MAX_NEWS_ITEMS) feed.removeChild(feed.lastChild);
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ── TABS ─────────────────────────────────────────────────────

function openTab(name) {
  document.querySelectorAll('.tab-pane').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.btn-tab').forEach(b=>b.classList.remove('active'));
  const pane = document.getElementById('pane-'+name);
  const tab  = document.getElementById('tab-'+name);
  if(pane) pane.classList.add('active');
  if(tab)  tab.classList.add('active');
  if(name==='roster')    renderRoster();
  if(name==='projects')  renderProjects();
  if(name==='market')    renderMarket();
  if(name==='events')    renderEvents();
  if(name==='dashboard') renderDashboard();
  if(name==='label')     renderLabelTab();
  if(name==='rivals')    renderRivalsTab();
  if(name==='contacts')  renderContactsTab();
  if(name==='worldmap')  renderWorldMapTab();
}

// ── MARKET ───────────────────────────────────────────────────

function refreshMarket() {
  const pool = [...ARTIST_TEMPLATES];
  const scoutingLv = getUpgradeLevel('scouting');
  const marketSize = Math.min(12, 8 + Math.floor(scoutingLv / 2));
  const statBonus = scoutingLv * 1.5;
  const feeBonus = 1 + scoutingLv * 0.02;
  for(let i=pool.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [pool[i],pool[j]]=[pool[j],pool[i]]; }
  G.market = pool.slice(0, marketSize).map(t=>({
    ...JSON.parse(JSON.stringify(t)),
    id: uid(),
    talent:   clamp(t.baseTalent   + rand(-8,8) + statBonus, 30, 100),
    fame:     clamp(t.baseFame     + rand(-10,10) + statBonus*0.8, 10, 100),
    charisma: clamp(t.baseCharisma + rand(-8,8) + statBonus*0.6, 20, 100),
    fee:      Math.round(((t.weeklyFee + rand(-400,400)) * feeBonus)/100)*100,
    mood: 100, energy: 100, happiness: 75, blockedWeeks: 0, projects:[], history:[]
  }));
}

function refreshEvents() {
  const pool = [...EVENTS_POOL];
  for(let i=pool.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [pool[i],pool[j]]=[pool[j],pool[i]]; }
  G.events = pool.slice(0, 6).map(e=>({...e, id:uid(), used:false}));
}

function recruitArtist(marketId) {
  const tier = getCurrentTier();
  if(G.artists.length >= tier.maxArtists) {
    toast(`❌ Capacité max : ${tier.maxArtists} artistes (${tier.icon} ${tier.name}). Évoluez !`, '#f97316');
    return;
  }
  const idx = G.market.findIndex(a=>a.id===marketId);
  if(idx===-1) return;
  const art = G.market[idx];
  const advanceWeeks = getContractAdvanceWeeks();
  const contractCost = Math.floor((Number(art.fee) || 0) * advanceWeeks);
  if(G.money < contractCost){ toast('❌ Fonds insuffisants !', '#ef4444'); return; }
  G.money -= contractCost;
  G.weekExpenses += contractCost;
  G.artists.push({ ...art, blockedWeeks: 0, history: [], happiness: 75 });
  G.market.splice(idx,1);
  addNews(`✅ ${art.emoji} ${art.name} (${TYPE_LABELS[art.type]}) recruté(e) ! Contrat: ${contractCost.toLocaleString()}€`);
  toast(`🎉 ${art.name} rejoint l'agence !`, TYPE_COLORS[art.type]);
  renderAll();
}

// ── EVENTS ───────────────────────────────────────────────────

function participateEvent(evId) {
  const ev = G.events.find(e=>e.id===evId);
  if(!ev || ev.used) return;
  const candidates = G.artists.filter(a=>
    ev.types.includes(a.type) &&
    !G.projects.some(p=>p.artists.includes(a.id)) &&
    (a.blockedWeeks || 0) <= 0
  );
  if(candidates.length===0){ toast('❌ Aucun artiste libre du bon type !', '#ef4444'); return; }
  openEventModal(ev, candidates);
}

function openEventModal(ev, candidates) {
  const modal = document.getElementById('event-modal');
  const content = document.getElementById('event-modal-content');
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
    <div class="pm-artist-grid">
      ${candidates.map(a=>`
        <button class="pm-artist-btn" onclick="commitEvent('${ev.id}','${a.id}')" style="border-color:${TYPE_COLORS[a.type]}">
          ${a.emoji} ${a.name}<br>
          <span style="font-size:.6rem;color:${getHappinessColor(a.happiness||70)}">${getHappinessLabel(a.happiness||70)}</span>
        </button>
      `).join('')}
    </div>
  `;
  modal.classList.add('show');
}

function commitEvent(evId, artistId) {
  const ev = G.events.find(e=>e.id===evId);
  const art = G.artists.find(a=>a.id===artistId);
  if(!ev || !art) return;
  art.history = art.history || [];
  ev.used = true;
  const baseFail = (ev.risk==='high' ? 0.3 : ev.risk==='medium' ? 0.15 : 0.05);
  const preparation = ((art.energy||100) + (art.mood||100) + art.charisma + (art.happiness||70)) / 400;
  const prBoost = getUpgradeLevel('pr') * 0.015;
  const failChance = clamp(baseFail - (preparation - 0.65)*0.18 - prBoost, 0.04, 0.55);
  const success = Math.random() > failChance;
  if(success) {
    const reward  = Math.floor(ev.reward * getProjectRewardMultiplier());
    const repGain = Math.max(1, Math.round(ev.repGain * getRepGainMultiplier()));
    const fameGain= Math.max(1, Math.round(ev.fameGain * getRepGainMultiplier()));
    G.money += reward; G.weekRevenue += reward;
    G.reputation = Math.min(100, G.reputation + repGain);
    art.fame     = Math.min(100, art.fame + fameGain);
    art.energy   = clamp((art.energy||100) - rand(10,20), 0, 100);
    art.mood     = clamp((art.mood||100) - rand(4,10), 0, 100);
    art.happiness= clamp((art.happiness||70) + 8, 0, 100);
    art.history.push(`✅ ${ev.name} — Succès ! +${reward.toLocaleString()}€`);
    addNews(`🎉 ${art.emoji} ${art.name} : succès à "${ev.name}" ! +${reward.toLocaleString()}€`);
    toast(`🎊 ${art.name} a cartonné !`, '#22c55e');
  } else {
    const penalty = Math.round(ev.reward * 0.3);
    G.money = Math.max(0, G.money - penalty);
    G.reputation = Math.max(0, G.reputation - 5);
    art.energy  = clamp((art.energy||100) - rand(14,24), 0, 100);
    art.mood    = clamp((art.mood||100) - rand(8,14), 0, 100);
    art.happiness = clamp((art.happiness||70) - 10, 0, 100);
    art.history.push(`❌ ${ev.name} — Échec. -${penalty.toLocaleString()}€`);
    addNews(`😬 ${art.emoji} ${art.name} : échec à "${ev.name}". -${penalty.toLocaleString()}€`);
    toast(`💥 Raté !`, '#ef4444');
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
  _newProjType = null; _newProjArtists = [];
  renderNewProjectModal();
  document.getElementById('project-modal').classList.add('show');
}

function renderNewProjectModal() {
  const content = document.getElementById('project-modal-content');
  const tier = getCurrentTier();

  // Show all project types, grouped, with fame requirement indicators
  const typeBtns = PROJECT_TYPES.map(pt => {
    const anyEligible = G.artists.some(a => pt.types.includes(a.type));
    const fameMet = G.artists.some(a => pt.types.includes(a.type) && (a.fame||0) >= (pt.minFameRequired||0));
    const locked = !fameMet && (pt.minFameRequired||0) > 0;
    return `
    <button class="pm-type-btn ${_newProjType===pt.id?'active':''} ${locked?'locked-proj':''}"
      onclick="selectProjType('${pt.id}')" title="${pt.desc||''}">
      ${pt.icon} ${pt.name}<br>
      <span style="font-size:.6rem;opacity:.7">${pt.duration}s · ${pt.prodCost.toLocaleString()}€</span><br>
      ${locked ? `<span style="font-size:.55rem;color:var(--orange)">⭐${pt.minFameRequired} requis</span>` :
        `<span style="font-size:.55rem;color:var(--green)">${pt.riskLevel==='high'?'⚠️':''}${pt.riskLevel==='low'?'✅':''}</span>`}
    </button>`;
  }).join('');

  let artistSection = '';
  if(_newProjType) {
    const pt = PROJECT_TYPES.find(p=>p.id===_newProjType);
    const eligible = G.artists.filter(a=>
      pt.types.includes(a.type) &&
      !G.projects.some(p=>p.artists.includes(a.id)) &&
      (a.blockedWeeks||0) <= 0
    );

    // Show project description
    const projDesc = `<div style="font-size:.75rem;color:var(--muted);padding:.5rem .7rem;background:var(--bg2);border-radius:8px;margin-bottom:.7rem;border-left:3px solid var(--border)">
      ${pt.desc || ''}
      <div style="margin-top:.3rem;font-size:.65rem;display:flex;gap:.8rem;flex-wrap:wrap">
        <span style="color:var(--orange)">💰 Prod: ${pt.prodCost.toLocaleString()}€</span>
        <span style="color:var(--green)">📈 Potentiel: ${pt.baseReward.toLocaleString()}€+</span>
        <span style="color:${pt.riskLevel==='high'?'var(--red)':pt.riskLevel==='medium'?'var(--orange)':'var(--green)'}">
          ${pt.riskLevel==='high'?'⚠️ Risqué':pt.riskLevel==='medium'?'⚡ Modéré':'✅ Sûr'}
        </span>
        ${(pt.minFameRequired||0)>0?`<span style="color:var(--blue)">⭐ Notoriété min: ${pt.minFameRequired}</span>`:''}
      </div>
    </div>`;

    artistSection = `
      ${projDesc}
      <div class="pm-artist-select">
        <div style="font-size:.72rem;text-transform:uppercase;letter-spacing:.12em;opacity:.55;margin-bottom:.5rem">
          Artistes (${pt.minArtists}–${pt.maxArtists}) — Types : ${pt.types.map(t=>TYPE_LABELS[t]).join(', ')}
        </div>
        <div class="pm-artist-grid">
          ${eligible.length > 0
            ? eligible.map(a=>{
                const compat = getRoleCompatibility(a.type, _newProjType);
                const fameOk = (a.fame||0) >= (pt.minFameRequired||0);
                const compatColor = compat.level==='primary'?'var(--green)':compat.level==='secondary'?'var(--orange)':'var(--red)';
                return `
                <button class="pm-artist-btn ${_newProjArtists.includes(a.id)?'sel':''}"
                  onclick="toggleProjArtist('${a.id}')">
                  ${a.emoji} ${a.name}<br>
                  <span style="font-size:.55rem;color:var(--gold)">⭐${Math.round(a.fame)}</span>
                  <span style="font-size:.55rem;color:var(--blue)"> 🎯${Math.round(a.talent)}</span>
                  <span style="font-size:.55rem;color:var(--blue)"> ⚡${Math.round(a.energy||100)}</span><br>
                  <span style="font-size:.55rem;color:${compatColor}">${compat.label||'✅'}</span>
                  ${!fameOk && (pt.minFameRequired||0)>0 ? `<br><span style="font-size:.5rem;color:var(--red)">⭐${pt.minFameRequired} requis</span>` : ''}
                </button>`;
              }).join('')
            : '<p style="font-size:.8rem;color:var(--muted)">Aucun artiste disponible pour ce type.</p>'}
        </div>
      </div>
    `;
  }

  let summarySection = '';
  if(_newProjType && _newProjArtists.length > 0) {
    const pt   = PROJECT_TYPES.find(p=>p.id===_newProjType);
    const arts = _newProjArtists.map(id=>G.artists.find(x=>x.id===id)).filter(Boolean);
    const duration  = Math.max(1, pt.duration - getProjectDurationReduction());
    const prodCost  = calcProductionCost(pt, arts, duration);
    const reward    = calcProjectReward(pt, arts);
    const repGain   = calcProjectRep(pt, arts);
    const failPct   = Math.round(calcProjectFailChance(pt, arts) * 100);
    const successPct= 100 - failPct;
    const canStart  = _newProjArtists.length >= pt.minArtists && _newProjArtists.length <= pt.maxArtists;
    const projFull  = G.projects.length >= tier.maxProjects;
    const canAfford = G.money >= prodCost;
    const roi       = prodCost > 0 ? ((reward - prodCost) / prodCost * 100).toFixed(0) : '∞';
    const roiColor  = Number(roi) > 50 ? 'var(--green)' : Number(roi) > 0 ? 'var(--gold)' : 'var(--red)';

    summarySection = `
      <div class="pm-summary">
        <div class="pm-row"><span>Durée</span><span>${duration} semaine${duration>1?'s':''}</span></div>
        <div class="pm-row"><span>💰 Coût production (payé maintenant)</span><span style="color:var(--red)">-${prodCost.toLocaleString()}€</span></div>
        <div class="pm-row"><span>📈 Revenus estimés (si succès)</span><span style="color:var(--green)">+${reward.toLocaleString()}€</span></div>
        <div class="pm-row"><span>⭐ Réputation estimée</span><span style="color:var(--purple)">+${repGain}</span></div>
        <div class="pm-row"><span>ROI estimé</span><span style="color:${roiColor}">${roi}%</span></div>
        <div class="pm-row" style="font-weight:700">
          <span>Taux de succès</span>
          <span style="color:${successPct>=80?'var(--green)':successPct>=55?'var(--gold)':'var(--red)'}">
            ${successPct}% ✅ / ${failPct}% ❌
          </span>
        </div>
      </div>
      ${!canAfford ? `<div style="font-size:.8rem;color:var(--red);margin-bottom:.6rem">❌ Vous n'avez pas les fonds (${prodCost.toLocaleString()}€ requis)</div>` : ''}
      ${projFull ? `<div style="font-size:.8rem;color:var(--red);margin-bottom:.6rem">⚠️ Capacité max (${tier.maxProjects} projets actifs)</div>` : ''}
      <button class="btn-cta" style="width:100%" ${canStart && !projFull && canAfford ? '' : 'disabled'}
        onclick="startProject()">
        ${projFull ? '❌ Trop de projets actifs' : !canAfford ? `❌ ${prodCost.toLocaleString()}€ requis` : canStart ? '🚀 Lancer le projet' : `Min ${pt.minArtists} artiste(s) requis`}
      </button>
    `;
  }

  content.innerHTML = `<div class="pm-types">${typeBtns}</div>${artistSection}${summarySection}`;
}

function selectProjType(id)   { _newProjType = id; _newProjArtists = []; renderNewProjectModal(); }
function toggleProjArtist(id) {
  const pt = PROJECT_TYPES.find(p=>p.id===_newProjType);
  if(_newProjArtists.includes(id)) _newProjArtists = _newProjArtists.filter(x=>x!==id);
  else if(_newProjArtists.length < pt.maxArtists) _newProjArtists.push(id);
  else toast(`Max ${pt.maxArtists} artistes.`,'#f97316');
  renderNewProjectModal();
}

function startProject() {
  const pt = PROJECT_TYPES.find(p=>p.id===_newProjType);
  if(!pt || _newProjArtists.length < pt.minArtists || _newProjArtists.length > pt.maxArtists) return;
  const tier = getCurrentTier();
  if(G.projects.length >= tier.maxProjects) { toast(`❌ Max ${tier.maxProjects} projets actifs !`, '#ef4444'); return; }

  const duration = Math.max(1, pt.duration - getProjectDurationReduction());
  const artists  = _newProjArtists.map(id => G.artists.find(x=>x.id===id)).filter(Boolean);

  // Role compatibility warnings (but don't block — just increase fail chance)
  const roleWarnings = [];
  let hasForbidden = false;
  artists.forEach(a => {
    const compat = getRoleCompatibility(a.type, pt.id);
    if (compat.level === 'forbidden') { hasForbidden = true; roleWarnings.push(`⚠️ ${a.emoji} ${a.name} (${TYPE_LABELS[a.type]}) est totalement hors de sa spécialité — risque d'échec élevé !`); }
    else if (compat.level === 'secondary') roleWarnings.push(`⚠️ ${a.emoji} ${a.name} travaille hors spécialité — qualité réduite.`);
  });

  // Fame requirement check
  const minFame = pt.minFameRequired || 0;
  const belowFame = artists.filter(a => (a.fame||0) < minFame);
  if (belowFame.length > 0 && minFame > 0) {
    toast(`❌ ${belowFame[0].name} n'a pas la notoriété requise (${minFame}+ nécessaire)`, '#ef4444');
    return;
  }

  // Production cost (paid upfront)
  const prodCost = calcProductionCost(pt, artists, duration);
  if(G.money < prodCost){ toast(`❌ Production coûte ${prodCost.toLocaleString()}€ — fonds insuffisants !`,'#ef4444'); return; }
  G.money -= prodCost; G.weekExpenses += prodCost;

  // Dynamic reward & rep (stored as potential, resolved on completion)
  const reward  = calcProjectReward(pt, artists);
  const repGain = calcProjectRep(pt, artists);
  const failChance = calcProjectFailChance(pt, artists);

  const artNames = artists.map(a => a.name);
  G.projects.push({
    id: uid(), typeId: pt.id, name: `${pt.icon} ${pt.name}`,
    artists: [..._newProjArtists], weeksLeft: duration, totalWeeks: duration,
    reward, repGain, failChance, prodCost, done: false,
    hasForbidden,
  });

  roleWarnings.forEach(w => addNews(w));
  addNews(`🚀 "${pt.name}" lancé avec ${artNames.join(', ')} ! (Prod: ${prodCost.toLocaleString()}€ · Potentiel: ${reward.toLocaleString()}€)`);
  toast(`🎬 "${pt.name}" démarré !`, '#22c55e');
  closeProjectModal();
  renderAll();
}

function closeProjectModal() { document.getElementById('project-modal').classList.remove('show'); }

// ── ARTIST MODAL ─────────────────────────────────────────────

function openArtistModal(artistId) {
  const a = G.artists.find(x=>x.id===artistId);
  if(!a) return;
  a.history = a.history || [];
  const col     = TYPE_COLORS[a.type];
  const career  = getCareerLevel(a.fame);
  const busyProj= G.projects.filter(p=>p.artists.includes(a.id));
  const happiness = a.happiness || 70;

  const histHTML = a.history.length > 0
    ? a.history.slice(-15).reverse().map(h=>`<div class="am-hist-item">${h}</div>`).join('')
    : '<div class="am-hist-item" style="opacity:.5">Aucune activité encore</div>';

  document.getElementById('artist-modal-content').innerHTML = `
    <div class="am-header">
      <div class="am-avatar">${a.emoji}</div>
      <div>
        <div class="am-name" style="color:${col}">${a.name}</div>
        <div class="am-type" style="color:${col}">${TYPE_LABELS[a.type]}</div>
        <div style="display:flex;align-items:center;gap:.5rem;margin-top:.4rem">
          <span style="font-size:.75rem;padding:.2rem .6rem;border-radius:20px;background:rgba(255,255,255,.08);color:${career.color}">
            ${career.icon} ${career.name}
          </span>
        </div>
      </div>
    </div>
    <div class="am-details">
      <div class="am-detail"><div class="am-d-label">Talent</div><div class="am-d-val" style="color:${col}">${a.talent}/100</div></div>
      <div class="am-detail"><div class="am-d-label">Notoriété</div><div class="am-d-val" style="color:var(--gold)">${a.fame}/100</div></div>
      <div class="am-detail"><div class="am-d-label">Charisme</div><div class="am-d-val" style="color:var(--purple)">${a.charisma}/100</div></div>
      <div class="am-detail"><div class="am-d-label">Salaire/sem.</div><div class="am-d-val">${a.fee.toLocaleString()}€</div></div>
      <div class="am-detail"><div class="am-d-label">Énergie</div><div class="am-d-val" style="color:var(--blue)">${Math.round(a.energy||0)}/100</div></div>
      <div class="am-detail"><div class="am-d-label">Moral</div><div class="am-d-val" style="color:var(--green)">${Math.round(a.mood||0)}/100</div></div>
    </div>
    <!-- HAPPINESS BAR -->
    <div class="am-happiness-section">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem">
        <div class="am-skills-title" style="margin:0">😊 Satisfaction dans le label</div>
        <div style="font-size:.82rem;color:${getHappinessColor(happiness)};font-weight:700">${getHappinessLabel(happiness)} — ${Math.round(happiness)}/100</div>
      </div>
      <div class="happiness-track">
        <div class="happiness-fill" style="width:${happiness}%;background:${getHappinessColor(happiness)}"></div>
      </div>
      ${happiness < 35 ? '<div style="font-size:.72rem;color:var(--red);margin-top:.4rem">⚠️ Risque de départ chez un rival !</div>' : ''}
      ${happiness >= 35 && happiness < 50 ? '<div style="font-size:.72rem;color:var(--orange);margin-top:.4rem">😟 Peu satisfait. Pensez à un cadeau.</div>' : ''}
    </div>
    <div class="am-skills-title">Compétences</div>
    <div class="am-skills">${a.skills.map(s=>`<div class="am-skill">${s}</div>`).join('')}</div>
    <div style="font-size:.82rem;margin-bottom:.8rem;">
      ${busyProj.length > 0
        ? `<span style="color:var(--orange)">🔧 En projet : ${busyProj.map(p=>p.name).join(', ')}</span>`
        : (a.blockedWeeks > 0
          ? `<span style="color:var(--red)">🚑 Indisponible ${a.blockedWeeks} sem.</span>`
          : '<span style="color:var(--green)">✅ Disponible</span>')}
    </div>
    <div class="am-skills-title">Historique</div>
    <div class="am-history">${histHTML}</div>
    <div style="display:flex;gap:.6rem;margin-top:.8rem;flex-wrap:wrap">
      <button class="btn-action blue" onclick="trainArtist('${a.id}')">📚 Former (+talent) -1000€</button>
      <button class="btn-action gold" onclick="closeThenFavor('${a.id}')">🎁 Cadeaux / Faveurs</button>
      <button class="btn-action" style="background:rgba(245,200,66,.1);border-color:var(--gold);color:var(--gold)" onclick="closeArtistModal();openSalaryNegotiation('${a.id}')">💰 Négocier salaire</button>
      <button class="btn-action red"  onclick="fireArtist('${a.id}')">🚪 Renvoyer</button>
    </div>
  `;
  document.getElementById('artist-modal').classList.add('show');
}

function closeThenFavor(artistId) {
  closeArtistModal();
  setTimeout(() => openFavorModal(artistId), 200);
}

function closeArtistModal() { document.getElementById('artist-modal').classList.remove('show'); }

function trainArtist(id) {
  if(G.money < 1000){ toast('❌ 1000€ requis','#ef4444'); return; }
  const a = G.artists.find(x=>x.id===id);
  if(!a) return;
  a.history = a.history || [];
  const gain = rand(3,8);
  G.money -= 1000; G.weekExpenses += 1000;
  a.talent = Math.min(100, a.talent + gain);
  a.energy = clamp((a.energy||100) + rand(8,14), 0, 100);
  a.mood   = clamp((a.mood||100) + rand(6,12), 0, 100);
  a.happiness = clamp((a.happiness||70) + rand(3,7), 0, 100);
  a.history.push(`📚 Formation intensive. Talent +${gain}`);
  toast(`📚 ${a.name} s'est amélioré(e) !`,'#60a5fa');
  openArtistModal(id);
  renderHUD();
}

function fireArtist(id) {
  const a = G.artists.find(x=>x.id===id);
  if(!a) return;
  if(G.projects.some(p=>p.artists.includes(id))){
    toast('❌ L\'artiste est en projet !','#ef4444'); return;
  }
  G.artists = G.artists.filter(x=>x.id!==id);
  G.reputation = Math.max(0, G.reputation - 3);
  addNews(`👋 ${a.emoji} ${a.name} a quitté l'agence.`);
  closeArtistModal();
  renderAll();
}

// ── NEXT WEEK ─────────────────────────────────────────────────

function nextWeek() {
  // 1. Payer les salaires hebdomadaires
  let salaries = 0;
  const salaryMult = getSalaryMultiplier();
  G.artists.forEach(a => {
    const weeklySalary = Math.floor(a.fee * salaryMult);
    salaries += weeklySalary;
    // Artiste insatisfait si salaire < 80% de son baseFee (attentes croissantes)
    if (a.fee < (a.baseFee || a.fee) * 0.8) {
      a.happiness = clamp((a.happiness||70) - 3, 0, 100);
    }
  });
  // Avertissement trésorerie faible
  const weeklyBurn = salaries + (G.projects.length > 0 ? 2000 : 0);
  if (G.money < weeklyBurn * 3 && G.money > 0) {
    addNews(`⚠️ Trésorerie critique ! Moins de 3 semaines de salaires restantes.`);
  }
  if (G.money < salaries) {
    // Pas assez pour payer tout le monde — chaque artiste reçoit pro-rata et perd du bonheur
    const ratio = G.money / Math.max(1, salaries);
    G.artists.forEach(a => {
      a.happiness = clamp((a.happiness||70) - rand(8, 18), 0, 100);
      a.history.push('💸 Salaire non payé intégralement — très insatisfait.');
    });
    addNews(`💸 Fonds insuffisants — salaires partiels ! Les artistes sont furieux.`);
    salaries = G.money;
  }
  G.money = Math.max(0, G.money - salaries);
  G.weekExpenses += salaries;

  // 2. Label tier weekly bonus
  const tierBonus = getCurrentTier().weeklyBonus;
  if(tierBonus > 0) {
    G.money += tierBonus;
    G.weekRevenue += tierBonus;
  }

  // 3. Énergie / moral / indisponibilité
  G.artists.forEach(a=>{
    if((a.blockedWeeks||0) > 0) {
      a.blockedWeeks -= 1;
      a.energy   = clamp((a.energy||100) + rand(8,14), 0, 100);
      a.mood     = clamp((a.mood||100) + rand(5,10), 0, 100);
      return;
    }
    const busy = G.projects.some(p=>p.artists.includes(a.id));
    if(busy) {
      a.energy = clamp((a.energy||100) - rand(8,14), 0, 100);
      a.mood   = clamp((a.mood||100) - rand(3,8), 0, 100);
    } else {
      a.energy = clamp((a.energy||100) + rand(6,12), 0, 100);
      a.mood   = clamp((a.mood||100) + rand(4,9), 0, 100);
    }
    if(a.energy <= 15 && Math.random() < 0.22) {
      a.blockedWeeks = rand(1,2);
      a.mood = clamp((a.mood||100) - rand(8,14), 0, 100);
      a.history.push(`🚑 Surmenage: indisponible ${a.blockedWeeks} semaine(s).`);
      addNews(`🚑 ${a.emoji} ${a.name} est en surmenage (${a.blockedWeeks} sem.).`);
    }
  });

  // 4. Happiness update
  applyWeeklyHappiness();

  // 5. Avancer les projets
  G.projects.forEach(p=>{
    p.weeksLeft--;
    // Weekly energy burn on active artists
    p.artists.forEach(id=>{
      const a = G.artists.find(x=>x.id===id);
      if (!a) return;
      const pt = PROJECT_TYPES.find(x=>x.id===p.typeId);
      if (pt) {
        a.energy = clamp((a.energy||100) - (pt.burnEnergy||15) / (pt.duration||2), 0, 100);
        a.mood   = clamp((a.mood||100)   - (pt.burnMood||8)    / (pt.duration||2), 0, 100);
      }
    });

    if(p.weeksLeft <= 0){
      // Determine success/fail
      const failChance = p.failChance || 0.10;
      const failed = Math.random() < failChance;

      if (failed) {
        // Échec — perte partielle (pas de reward, légère pénalité rep)
        const repLoss = Math.round((p.repGain || 5) * 0.3);
        G.reputation = Math.max(0, G.reputation - repLoss);
        p.artists.forEach(id=>{
          const a=G.artists.find(x=>x.id===id);
          if(a){
            a.happiness = clamp((a.happiness||70) - 12, 0, 100);
            a.mood = clamp((a.mood||100) - 15, 0, 100);
            a.history.push(`❌ ${p.name} — Échec. -${repLoss} réputation.`);
          }
        });
        addNews(`❌ Projet "${p.name}" a échoué. -${repLoss} réputation.${p.hasForbidden ? ' (artiste incompatible)' : ''}`);
      } else {
        // Succès
        p.done = true;
        G.money += p.reward; G.weekRevenue += p.reward;
        // Successful music productions earn temporary streaming/catalog royalties.
        if(p.typeId !== 'collab' && p.artists.some(id=>G.artists.some(a=>a.id===id && a.type==='musician'))){
          G.royaltyCatalog = G.royaltyCatalog || [];
          G.royaltyCatalog.push({name:p.name,weekly:Math.max(25,Math.floor(p.reward * 0.035)),weeksLeft:12});
          G.royaltyCatalog = G.royaltyCatalog.slice(-100);
        }
        G.reputation = Math.min(100, G.reputation + p.repGain);
        p.artists.forEach(id=>{
          const a=G.artists.find(x=>x.id===id);
          if(a){
            const pt = PROJECT_TYPES.find(x=>x.id===p.typeId);
            // Fame gain based on project type and artist
            const baseFameGain = pt ? Math.round(rand(3,8) * (pt.fameMult||1.0) * (1 + G.labelTier * 0.05)) : rand(3,8);
            const fameGain = Math.max(1, baseFameGain);
            a.fame = Math.min(100, a.fame + fameGain);
            a.happiness = clamp((a.happiness||70) + 12, 0, 100);
            a.history.push(`✅ ${p.name} terminé ! +${fameGain} notoriété, +${p.reward.toLocaleString()}€`);
          }
        });
        addNews(`🎉 "${p.name}" terminé ! +${p.reward.toLocaleString()}€ · +${p.repGain} rép.`);
      }
      p.done = true;
    }
  });
  const newDone = G.projects.filter(p=>p.done);
  G.doneProjects.push(...newDone);
  G.projects = G.projects.filter(p=>!p.done);

  // Recurring catalog royalties decay as releases age; credited before the weekly balance.
  G.royaltyCatalog = (G.royaltyCatalog || []).filter(entry=>entry.weeksLeft>0);
  let royaltyRevenue = 0;
  G.royaltyCatalog.forEach(entry=>{
    const amount = Math.max(0,Math.floor(entry.weekly * (entry.weeksLeft / 12)));
    royaltyRevenue += amount;
    entry.weeksLeft--;
  });
  G.royaltyCatalog = G.royaltyCatalog.filter(entry=>entry.weeksLeft>0);
  if(royaltyRevenue){G.money+=royaltyRevenue;G.weekRevenue+=royaltyRevenue;addNews('🎧 Catalogue : +'+royaltyRevenue.toLocaleString()+'€ de royalties cette semaine.');}

  // 6. Rival AI
  processRivals();

  // 6b. Alliances
  processAlliances();

  // 7. Tours & Contracts
  processTours();
  processContracts();

  // 7b. Random events (enriched)
  randomWeeklyEventV2();

  // 7c. Dynamic progression
  applyDynamicProgression();

  // 8. Refresh market/events
  if(G.week % 3 === 0) refreshMarket();
  refreshEvents();

  // 9. Finances
  G.totalRevenue  += G.weekRevenue;
  G.totalExpenses += G.weekExpenses;
  G.lastWeeklySalaries = salaries;
  G.lastWeekNet = G.weekRevenue - G.weekExpenses;

  // 10. Semaine suivante
  G.week++;

  // 11. Réputation — croissance lente et conditionnelle, déclin si inactif
  {
    const activeProjCount = G.projects.length;
    const completedThisWeek = newDone.length;
    const avgArtistFame = G.artists.length > 0
      ? G.artists.reduce((s,a) => s + (a.fame||20), 0) / G.artists.length : 0;

    if (completedThisWeek > 0) {
      // Réputation gagnée via projets (déjà comptée dans la boucle projets)
    } else if (activeProjCount > 0) {
      // Actif mais pas de finition cette semaine — tiny gain
      G.reputation = Math.min(100, G.reputation + 0.1);
    } else if (G.artists.length > 0) {
      // Roster mais aucun projet actif — stagnation légère
      if (Math.random() < 0.3) G.reputation = Math.max(0, G.reputation - 0.3);
    } else {
      // Aucun artiste — déclin
      G.reputation = Math.max(0, G.reputation - 0.8);
    }
    // Palier label maintient un plancher minimal de réputation
    const repFloor = G.labelTier * 5;
    G.reputation = Math.max(repFloor, G.reputation);
  }

  // 12. Milestones auto
  const ready = getMilestonesState().filter(m=>m.ready && !m.claimed);
  if(ready.length > 0) addNews(`🏆 ${ready.length} objectif(s) disponible(s) à réclamer !`);

  // 13. Défaite
  if(G.money <= 0 && G.artists.length === 0 && G.week > 8) {
    addNews('💀 L\'agence est en faillite.');
    showEndScreen();
    return;
  }

  // 14. Victoire : atteindre Major Internationale
  if(G.labelTier === 5 && G.reputation >= 90) {
    addNews('👑 Vous avez atteint le sommet absolu !');
  }

  // 15. Modal bilan
  showWeeklyModal(salaries, tierBonus);
  G.weeklyLog = [];
  G.weekRevenue = 0;
  G.weekExpenses = 0;
}

function randomWeeklyEvent() {
  const roll = Math.random();
  if(roll < 0.15 && G.artists.length > 0) {
    const a = G.artists[Math.floor(Math.random()*G.artists.length)];
    const repMult = getRepGainMultiplier();
    const events = [
      { msg:`⭐ ${a.name} est mentionné(e) dans la presse ! +5 notoriété`,         fn:()=>{ a.fame=Math.min(100,a.fame+Math.round(5*repMult)); G.reputation=Math.min(100,G.reputation+Math.round(2*repMult)); a.happiness=clamp((a.happiness||70)+5,0,100); } },
      { msg:`🎙️ Interview radio pour ${a.name} ! +3 notoriété`,                    fn:()=>{ a.fame=Math.min(100,a.fame+Math.round(3*repMult)); } },
      { msg:`📱 Viral ! Un post de ${a.name} explose sur les réseaux. +10 notoriété`, fn:()=>{ a.fame=Math.min(100,a.fame+Math.round(10*repMult)); G.reputation=Math.min(100,G.reputation+Math.round(5*repMult)); a.happiness=clamp((a.happiness||70)+8,0,100); } },
      { msg:`😤 Scandale autour de ${a.name}… -5 réputation`,                       fn:()=>{ G.reputation=Math.max(0,G.reputation-5); a.fame=Math.max(0,a.fame-3); a.happiness=clamp((a.happiness||70)-12,0,100); } },
      { msg:`🏆 ${a.name} remporte un prix artistique ! +15 notoriété +8 rép.`,    fn:()=>{ a.fame=Math.min(100,a.fame+Math.round(15*repMult)); G.reputation=Math.min(100,G.reputation+Math.round(8*repMult)); G.money+=3000; G.weekRevenue+=3000; a.happiness=clamp((a.happiness||70)+12,0,100); } },
      { msg:`💔 ${a.name} se dispute avec un collègue. Moral en berne.`,            fn:()=>{ a.mood=Math.max(0,a.mood-15); a.happiness=clamp((a.happiness||70)-8,0,100); } },
    ];
    const ev = events[Math.floor(Math.random()*events.length)];
    ev.fn(); addNews(ev.msg);
  }
  if(roll > 0.9) {
    const bonus = rand(1000,5000) * (G.labelTier + 1);
    G.money += bonus; G.weekRevenue += bonus;
    addNews(`💼 Contrat de sponsoring inattendu ! +${bonus.toLocaleString()}€`);
  }
}

function showWeeklyModal(salaries, tierBonus) {
  document.getElementById('wm-week').textContent = G.week - 1;
  const projectCosts = Math.max(0, G.weekExpenses - salaries);
  const net = G.weekRevenue - G.weekExpenses;

  const logsHTML = G.weeklyLog.length > 0
    ? G.weeklyLog.map(l=>`<div class="wm-item"><span>${l}</span></div>`).join('')
    : '<div class="wm-item"><span style="opacity:.5">Semaine calme.</span></div>';

  const pendingHTML = G.pendingOffers.length > 0
    ? `<div class="wm-section" style="border:1px solid var(--red);border-radius:10px;padding:.8rem;background:rgba(239,68,68,.05)">
        <div class="wm-title" style="color:var(--red)">⚠️ OFFRES RIVALES EN ATTENTE</div>
        ${G.pendingOffers.map(o=>`
          <div style="font-size:.82rem;margin:.4rem 0;color:var(--orange)">${o.rivalIcon} ${o.rivalName} approche ${o.artistEmoji} ${o.artistName}…</div>
        `).join('')}
        <div style="font-size:.75rem;color:var(--muted);margin-top:.4rem">Vous devrez répondre après la fermeture de ce bilan.</div>
      </div>`
    : '';

  document.getElementById('weekly-content').innerHTML = `
    <div class="wm-section">
      <div class="wm-title">📋 Événements</div>
      ${logsHTML}
    </div>
    ${pendingHTML}
    <div class="wm-section">
      <div class="wm-title">💰 Finances</div>
      <div class="wm-item"><span>Revenus projets / events</span><span style="color:var(--green)">+${G.weekRevenue.toLocaleString()}€</span></div>
      ${tierBonus > 0 ? `<div class="wm-item"><span>Bonus label ${getCurrentTier().icon}</span><span style="color:var(--gold)">+${tierBonus.toLocaleString()}€</span></div>` : ''}
      <div class="wm-item"><span>Salaires (${G.artists.length} artistes)</span><span style="color:var(--red)">-${salaries.toLocaleString()}€</span></div>
      <div class="wm-item"><span>Frais projets / formation</span><span style="color:var(--red)">-${projectCosts.toLocaleString()}€</span></div>
      <div class="wm-total"><span>Bilan net</span><span style="color:${net>=0?'var(--green)':'var(--red)'}">${net>=0?'+':''}${net.toLocaleString()}€</span></div>
    </div>
    <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap">
      <div style="text-align:center"><div style="font-size:1.1rem;font-weight:800;color:var(--gold)">${G.money.toLocaleString()}€</div><div style="font-size:.62rem;opacity:.5">TRÉSORERIE</div></div>
      <div style="text-align:center"><div style="font-size:1.1rem;font-weight:800;color:var(--purple)">${G.reputation.toFixed(0)}</div><div style="font-size:.62rem;opacity:.5">RÉPUTATION</div></div>
      <div style="text-align:center"><div style="font-size:1.1rem;font-weight:800;color:var(--blue)">${G.artists.length}</div><div style="font-size:.62rem;opacity:.5">ARTISTES</div></div>
      <div style="text-align:center"><div style="font-size:1.1rem;font-weight:800;color:${getCurrentTier().color}">${getCurrentTier().icon}</div><div style="font-size:.62rem;opacity:.5">${getCurrentTier().name.toUpperCase()}</div></div>
    </div>
  `;
  document.getElementById('weekly-modal').classList.add('show');
}

function closeWeeklyModal() {
  document.getElementById('weekly-modal').classList.remove('show');
  renderAll();
  // Trigger rival offer modals
  if(G.pendingOffers && G.pendingOffers.length > 0) {
    setTimeout(() => openRivalOfferModal(G.pendingOffers[0].id), 400);
  }
}

// ── RENDER : LABEL TAB ────────────────────────────────────────

function renderLabelTab() {
  const pane = document.getElementById('pane-label');
  if(!pane) return;
  const current = getCurrentTier();
  const next    = getNextTier();
  const can     = canUpgradeTier();

  const moneyPct = next ? Math.min(100, Math.round((G.money / next.unlockCost) * 100)) : 100;
  const repPct   = next ? Math.min(100, Math.round((G.reputation / next.unlockRep) * 100)) : 100;

  const hist = Array.isArray(G.labelHistory) ? G.labelHistory : [];
  const histHTML = hist.length > 0
  ? hist.map(h=>`<div class="wm-item"><span>${h}</span></div>`).join('')
  : '<div style="font-size:.8rem;color:var(--muted)">Aucune évolution encore.</div>';

  pane.innerHTML = `
    <div class="label-tab-grid">
      <!-- Current Tier -->
      <div class="label-current-card" style="border-color:${current.color}40;background:linear-gradient(135deg,${current.color}10,transparent)">
        <div class="label-tier-icon">${current.icon}</div>
        <div class="label-tier-name" style="color:${current.color}">${current.name}</div>
        <div class="label-tier-desc">${current.desc}</div>
        <div class="label-tier-stats">
          <div class="label-stat"><div class="label-stat-val">${G.artists.length}/${current.maxArtists}</div><div class="label-stat-lbl">Artistes</div></div>
          <div class="label-stat"><div class="label-stat-val">${G.projects.length}/${current.maxProjects}</div><div class="label-stat-lbl">Projets</div></div>
          <div class="label-stat"><div class="label-stat-val" style="color:var(--gold)">${current.weeklyBonus > 0 ? '+'+current.weeklyBonus.toLocaleString()+'€' : '—'}</div><div class="label-stat-lbl">Bonus/sem.</div></div>
          <div class="label-stat"><div class="label-stat-val">Palier ${current.id+1}/6</div><div class="label-stat-lbl">Progression</div></div>
        </div>
        <!-- Tier progress pills -->
        <div class="label-tiers-strip">
          ${LABEL_TIERS.map((t,i)=>`
            <div class="tier-pill ${i === G.labelTier ? 'active' : (i < G.labelTier ? 'done' : '')}" style="${i===G.labelTier?`background:${t.color}30;border-color:${t.color}`:''}">
              <span style="font-size:.9rem">${t.icon}</span>
              <span style="font-size:.58rem;margin-top:.2rem">${t.name.split(' ')[0]}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Next Tier -->
      ${next ? `
        <div class="label-next-card">
          <div style="font-size:.72rem;text-transform:uppercase;letter-spacing:.15em;color:var(--muted);margin-bottom:.8rem">Prochain palier</div>
          <div style="font-size:2rem">${next.icon}</div>
          <div style="font-weight:800;font-size:1.1rem;margin:.3rem 0;color:${next.color}">${next.name}</div>
          <div style="font-size:.8rem;color:var(--muted);margin-bottom:1rem">${next.desc}</div>
          <div style="margin-bottom:.8rem">
            <div style="display:flex;justify-content:space-between;font-size:.75rem;margin-bottom:.3rem">
              <span>💰 Argent</span>
              <span style="color:${G.money >= next.unlockCost ? 'var(--green)':'var(--muted)'}">${G.money.toLocaleString()}€ / ${next.unlockCost.toLocaleString()}€</span>
            </div>
            <div class="label-req-bar"><div style="width:${moneyPct}%;background:var(--gold);height:100%;border-radius:4px;transition:width .5s"></div></div>
          </div>
          <div style="margin-bottom:1rem">
            <div style="display:flex;justify-content:space-between;font-size:.75rem;margin-bottom:.3rem">
              <span>⭐ Réputation</span>
              <span style="color:${G.reputation >= next.unlockRep ? 'var(--green)':'var(--muted)'}">${G.reputation.toFixed(0)} / ${next.unlockRep}</span>
            </div>
            <div class="label-req-bar"><div style="width:${repPct}%;background:var(--purple);height:100%;border-radius:4px;transition:width .5s"></div></div>
          </div>
          <div style="font-size:.8rem;color:var(--muted);margin-bottom:.8rem">
            Débloque : ${next.maxArtists} artistes · ${next.maxProjects} projets · ${next.weeklyBonus > 0 ? '+'+next.weeklyBonus.toLocaleString()+'€/sem.' : 'aucun bonus/sem.'}
          </div>
          <button class="btn-cta" style="width:100%;font-size:.85rem;padding:.7rem" ${can?'':'disabled'} onclick="upgradeLabelTier()">
            ${can ? `${next.icon} Évoluer vers ${next.name} — ${next.unlockCost.toLocaleString()}€` : `🔒 Conditions non remplies`}
          </button>
        </div>
      ` : `
        <div class="label-next-card" style="text-align:center;padding:2rem">
          <div style="font-size:3rem">👑</div>
          <div style="font-size:1.2rem;font-weight:800;color:var(--gold);margin:.6rem 0">Major Internationale</div>
          <div style="color:var(--muted);font-size:.85rem">Vous avez atteint le sommet absolu de l'industrie culturelle mondiale.</div>
        </div>
      `}

      <!-- History -->
      <div class="label-history-card">
        <div class="dash-card-title">📜 Historique des évolutions</div>
        ${histHTML}
      </div>
    </div>
  `;
}

// ── RENDER : RIVALS TAB (delegates to v2) ────────────────────
function renderRivalsTab() { renderRivalsTabV2(); }

// ── RENDER : MILESTONES & UPGRADES ───────────────────────────

function getMilestonesState() {
  return MILESTONES.map(m=>{
    const claimed = Array.isArray(G.milestonesClaimed) && G.milestonesClaimed.includes(m.id);
    const ready   = !claimed && m.check(G);
    return { ...m, claimed, ready };
  });
}

function claimMilestone(id) {
  const m = MILESTONES.find(x=>x.id===id);
  if(!m || G.milestonesClaimed.includes(id) || !m.check(G)) return;
  G.milestonesClaimed.push(id);
  G.money += m.reward.money || 0; G.weekRevenue += m.reward.money || 0;
  G.reputation = clamp(G.reputation + (m.reward.rep||0), 0, 100);
  addNews(`🏆 Objectif "${m.name}" réclamé ! +${(m.reward.money||0).toLocaleString()}€`);
  renderAll();
}

function buyUpgrade(id) {
  const up = AGENCY_UPGRADES.find(x=>x.id===id);
  if(!up) return;
  const current = getUpgradeLevel(id);
  if(current >= up.maxLevel){ toast('ℹ️ Niveau max atteint.','#60a5fa'); return; }
  const cost = getUpgradeCost(id);
  if(G.money < cost){ toast('❌ Fonds insuffisants.','#ef4444'); return; }
  G.money -= cost; G.weekExpenses += cost;
  G.upgrades[id] = current + 1;
  addNews(`🧠 Upgrade "${up.name}" niveau ${G.upgrades[id]} débloqué.`);
  toast(`⬆️ ${up.name} niveau ${G.upgrades[id]}`,'#22c55e');
  if(id==='scouting') refreshMarket();
  renderAll();
}

function renderUpgradesPanel() {
  const grid = document.getElementById('upgrades-grid');
  if(!grid) return;
  grid.innerHTML = AGENCY_UPGRADES.map(up=>{
    const level  = getUpgradeLevel(up.id);
    const maxed  = level >= up.maxLevel;
    const cost   = getUpgradeCost(up.id);
    const canBuy = !maxed && G.money >= cost;
    return `
      <div class="upgrade-item">
        <div class="upgrade-top">
          <span class="upgrade-icon">${up.icon}</span>
          <div>
            <div class="upgrade-name">${up.name}</div>
            <div class="upgrade-level">Niv. ${level}/${up.maxLevel}</div>
          </div>
        </div>
        <div class="upgrade-desc">${up.desc}</div>
        <button class="btn-action ${canBuy?'green':''}" ${maxed?'disabled':''} onclick="buyUpgrade('${up.id}')">
          ${maxed ? 'Niveau max' : `Améliorer (${cost.toLocaleString()}€)`}
        </button>
      </div>
    `;
  }).join('');
}

function renderMilestonesPanel() {
  const cont = document.getElementById('milestones-dash');
  if(!cont) return;
  cont.innerHTML = getMilestonesState().map(m=>{
    const state = m.claimed ? 'done' : (m.ready ? 'ready' : '');
    const btn   = m.claimed
      ? '<button class="btn-action" disabled>Récupéré</button>'
      : `<button class="btn-action ${m.ready?'green':''}" ${m.ready?'':'disabled'} onclick="claimMilestone('${m.id}')">Récupérer</button>`;
    return `
      <div class="milestone-row ${state}">
        <div class="milestone-head">${m.name}</div>
        <div class="milestone-reward">+${(m.reward.money||0).toLocaleString()}€ / +${m.reward.rep||0} rép.</div>
        ${btn}
      </div>
    `;
  }).join('');
}

// ── RENDER : HUD ──────────────────────────────────────────────

function renderHUD() {
  const tier = getCurrentTier();
  const nameEl = document.getElementById('agency-name');
  if(nameEl) nameEl.textContent = G.agencyName;
  const tierEl = document.getElementById('stat-tier');
  if(tierEl) tierEl.textContent = `${tier.icon} ${tier.name}`;
const moneyEl = document.getElementById('stat-money');
if(moneyEl) moneyEl.textContent = G.money.toLocaleString();

const weekEl = document.getElementById('stat-week');
if(weekEl) weekEl.textContent = String(G.week);

const repEl = document.getElementById('stat-rep');
if(repEl) repEl.textContent = G.reputation.toFixed(0);

const artistsEl = document.getElementById('stat-artists');
if(artistsEl) artistsEl.textContent = `${G.artists.length}/${tier.maxArtists}`;
}

// ── RENDER : DASHBOARD ────────────────────────────────────────

function renderDashboard() {
  const fg = document.getElementById('finance-grid');
  if(!fg) return;
  const weeklyFees = G.artists.reduce((a,b)=>a + Math.floor(b.fee * getSalaryMultiplier()), 0);
  const avgMood  = G.artists.length > 0 ? Math.round(G.artists.reduce((s,a)=>s+(a.mood||0),0)/G.artists.length) : 0;
  const avgHappy = G.artists.length > 0 ? Math.round(G.artists.reduce((s,a)=>s+(a.happiness||70),0)/G.artists.length) : 0;
  const tier = getCurrentTier();
  fg.innerHTML = `
    <div class="finance-item"><div class="finance-label">Trésorerie</div><div class="finance-val" style="color:var(--gold)">${G.money.toLocaleString()}€</div></div>
    <div class="finance-item"><div class="finance-label">Charges /sem.</div><div class="finance-val" style="color:var(--red)">${weeklyFees.toLocaleString()}€</div></div>
    <div class="finance-item"><div class="finance-label">Revenus totaux</div><div class="finance-val" style="color:var(--green)">${G.totalRevenue.toLocaleString()}€</div></div>
    <div class="finance-item"><div class="finance-label">Sorties en royalties</div><div class="finance-val">${(G.royaltyCatalog||[]).length}</div></div>
    <div class="finance-item"><div class="finance-label">Projets actifs</div><div class="finance-val">${G.projects.length}/${tier.maxProjects}</div></div>
    <div class="finance-item"><div class="finance-label">Satisfaction moy.</div><div class="finance-val" style="color:${getHappinessColor(avgHappy)}">${avgHappy}/100</div></div>
    <div class="finance-item"><div class="finance-label">Moral moyen</div><div class="finance-val" style="color:var(--blue)">${avgMood}/100</div></div>
    <div class="finance-item"><div class="finance-label">Bilan préc.</div><div class="finance-val" style="color:${G.lastWeekNet>=0?'var(--green)':'var(--red)'}">${G.lastWeekNet>=0?'+':''}${Math.round(G.lastWeekNet).toLocaleString()}€</div></div>
    <div class="finance-item"><div class="finance-label">Label</div><div class="finance-val" style="color:${tier.color}">${tier.icon} ${tier.name}</div></div>
  `;

  const sorted = [...G.artists].sort((a,b) => b.fame - a.fame).slice(0, 5);
  const topList = document.getElementById('top-artists-list');
if(topList) topList.innerHTML = sorted.length > 0
  ? sorted.map((a,i)=>{
      const career = getCareerLevel(a.fame);
      return `
        <div class="top-artist-row">
          <span class="ta-rank">#${i+1}</span>
          <span>${a.emoji}</span>
          <span class="ta-name">${a.name}</span>
          <span style="font-size:.65rem;color:${career.color}">${career.icon}</span>
          <span class="ta-fame">⭐${a.fame}</span>
        </div>`;
    }).join('')
  : '<div style="font-size:.8rem;color:var(--muted);padding:.5rem">Aucun artiste</div>';

  const apd = document.getElementById('active-projects-dash');
if(apd) apd.innerHTML = G.projects.length > 0
  ? G.projects.map(p=>{
      const pct = Math.round(((p.totalWeeks-p.weeksLeft)/p.totalWeeks)*100);
      return `<div style="margin-bottom:.6rem">
        <div style="display:flex;justify-content:space-between;font-size:.8rem;margin-bottom:.3rem">
          <span>${p.name}</span><span style="color:var(--muted)">${p.weeksLeft}sem.</span>
        </div>
        <div class="pc-bar"><div class="pc-fill" style="width:${pct}%"></div></div>
      </div>`;
    }).join('')
  : '<div style="font-size:.8rem;color:var(--muted)">Aucun projet en cours</div>';

  const tierObj = getRepTier(G.reputation);
  const repFill = document.getElementById('rep-fill');
  if(repFill) repFill.style.width = G.reputation+'%';
  const repLabel = document.getElementById('rep-label');
  if(repLabel){ repLabel.textContent = tierObj.label; repLabel.style.color = tierObj.color; }

  // Rivals mini preview in dashboard
  const rivalsPreview = document.getElementById('rivals-preview-dash');
  if(rivalsPreview && G.rivals) {
    rivalsPreview.innerHTML = G.rivals.map(r=>{
      const rt = LABEL_TIERS[r.tier] || LABEL_TIERS[0];
      return `<div style="display:flex;align-items:center;gap:.6rem;padding:.4rem 0;border-bottom:1px solid var(--border);font-size:.78rem">
        <span style="font-size:1rem">${r.icon}</span>
        <span style="flex:1;font-weight:700;color:${r.color}">${r.name}</span>
        <span style="color:var(--muted)">${rt.icon} ${rt.name}</span>
        ${r.tier >= G.labelTier ? `<span style="font-size:.6rem;color:var(--red);border:1px solid var(--red);padding:1px 4px;border-radius:4px">RIVAL</span>` : ''}
      </div>`;
    }).join('');
  }

  renderUpgradesPanel();
  renderMilestonesPanel();

  // Active scandals alert
  const activeScandals = (G.scandals || []).filter(s => !s.resolved);
  const scandalAlert = document.getElementById('scandals-alert-dash');
  if (scandalAlert) {
    if (activeScandals.length > 0) {
      scandalAlert.style.display = 'block';
      scandalAlert.innerHTML = `
        <div style="font-weight:800;color:var(--red);margin-bottom:.5rem">🚨 Scandales actifs !</div>
        ${activeScandals.map(s => `
          <div style="font-size:.8rem;margin-bottom:.5rem;display:flex;align-items:center;justify-content:space-between;gap:.5rem">
            <span>${s.icon} <strong>${s.artistEmoji} ${s.artistName}</strong> — ${s.name}</span>
            <button class="btn-action red" style="font-size:.7rem;padding:.3rem .6rem;white-space:nowrap" onclick="resolveScandal('${s.id}')">
              Gérer (-${s.resolveCost.toLocaleString()}€)
            </button>
          </div>`).join('')}
      `;
    } else { scandalAlert.style.display = 'none'; }
  }

  // Active tours preview
  const toursPreview = document.getElementById('tours-preview-dash');
  if (toursPreview) {
    const tours = G.activeTours || [];
    toursPreview.innerHTML = tours.length > 0
      ? tours.map(t => { const pct = Math.round(((t.totalWeeks - t.weeksLeft) / t.totalWeeks) * 100); return `<div style="margin-bottom:.6rem"><div style="display:flex;justify-content:space-between;font-size:.78rem;margin-bottom:.3rem"><span>${t.artistEmoji} ${t.artistName} ${t.name}</span><span style="color:var(--muted)">${t.weeksLeft}sem.</span></div><div class="pc-bar"><div class="pc-fill" style="width:${pct}%;background:var(--orange)"></div></div></div>`; }).join('')
      : '<div style="font-size:.78rem;color:var(--muted)">Aucune tournée en cours</div>';
  }
}

// ── RENDER : ROSTER ───────────────────────────────────────────

function renderRoster() {
  const grid  = document.getElementById('artists-grid');
  const empty = document.getElementById('empty-roster');
  if(!grid || !empty) return;
  const filtered = G.artFilter==='all' ? G.artists : G.artists.filter(a=>a.type===G.artFilter);
  if(G.artists.length===0){ grid.style.display='none'; empty.style.display='block'; return; }
  grid.style.display='grid'; empty.style.display='none';

  grid.innerHTML = filtered.map(a=>{
    const col     = TYPE_COLORS[a.type];
    const busy    = G.projects.some(p=>p.artists.includes(a.id));
    const blocked = (a.blockedWeeks||0) > 0;
    const career  = getCareerLevel(a.fame);
    const happiness = a.happiness || 70;
    const bars = [
      {label:'Talent',   val:a.talent,           color:col },
      {label:'Notoriété',val:a.fame,              color:'var(--gold)'},
      {label:'Charisme', val:a.charisma,          color:'var(--purple)'},
      {label:'Énergie',  val:a.energy||0,         color:'var(--blue)'},
      {label:'Moral',    val:a.mood||0,           color:'var(--green)'},
      {label:'Satisf.',  val:happiness,           color:getHappinessColor(happiness)},
    ];
    return `
      <div class="artist-card ${a.type}" onclick="openArtistModal('${a.id}')">
        <div class="card-badge ${blocked?'badge-busy':(busy?'badge-busy':'badge-free')}">${blocked?`SOINS ${a.blockedWeeks}S`:(busy?'EN PROJET':'LIBRE')}</div>
        <div style="position:absolute;top:.7rem;left:.7rem;font-size:.65rem;padding:.15rem .4rem;border-radius:4px;background:rgba(0,0,0,.4);color:${career.color}">${career.icon} ${career.name}</div>
        <div class="ac-avatar">${a.emoji}</div>
        <div class="ac-name">${a.name}</div>
        <div class="ac-type" style="color:${col}">${TYPE_LABELS[a.type]}</div>
        ${happiness < 35 ? `<div style="font-size:.62rem;color:var(--red);margin-bottom:.4rem">⚠️ Risque de départ !</div>` : ''}
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

function filterArtists(type, el) {
  G.artFilter = type;
  document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
  if(el) el.classList.add('active');
  else { const fb = document.querySelector(`.filter-btn[data-filter="${type}"]`); if(fb) fb.classList.add('active'); }
  renderRoster();
}

// ── RENDER : PROJECTS ─────────────────────────────────────────

function renderProjects() {
  const active = document.getElementById('proj-active');
  const done   = document.getElementById('proj-done');
  const toursEl = document.getElementById('proj-tours');
  const contractsEl = document.getElementById('proj-contracts');
  if(!active || !done) return;
  active.innerHTML = G.projects.length > 0
    ? G.projects.map(p=>{
        const pct = Math.round(((p.totalWeeks-p.weeksLeft)/p.totalWeeks)*100);
        const artistNames = p.artists.map(id=>{ const a=G.artists.find(x=>x.id===id); return a?`${a.emoji}${a.name}`:'?'; }).join(', ');
        const collabBadge = p.isCollab ? `<span style="font-size:.6rem;padding:.15rem .4rem;background:rgba(168,85,247,.2);color:#a855f7;border-radius:4px;margin-left:.3rem">COLLAB</span>` : '';
        return `
          <div class="project-card">
            <div class="pc-header"><span class="pc-name">${p.name}${collabBadge}</span></div>
            <div class="pc-bar"><div class="pc-fill" style="width:${pct}%"></div></div>
            <div class="pc-meta"><span>${p.weeksLeft} sem. restantes</span><span class="pc-reward">+${p.reward.toLocaleString()}€</span></div>
            <div class="pc-artists">👥 ${artistNames}</div>
          </div>`;
      }).join('')
    : '<div class="empty-state">Aucun projet actif.<br>Lancez-en un !</div>';

  if (toursEl) {
    const tours = G.activeTours || [];
    toursEl.innerHTML = tours.length > 0
      ? tours.map(t => {
          const pct = Math.round(((t.totalWeeks - t.weeksLeft) / t.totalWeeks) * 100);
          const cityIdx = Math.min(Math.floor((t.totalWeeks - t.weeksLeft) / (t.totalWeeks / t.cities.length)), t.cities.length - 1);
          return `<div class="project-card">
            <div class="pc-header"><span class="pc-name">${t.name}</span></div>
            <div style="font-size:.72rem;color:var(--muted);margin-bottom:.4rem">🎤 ${t.artistEmoji} ${t.artistName} · Ville: ${t.cities[cityIdx] || '?'}</div>
            <div class="pc-bar"><div class="pc-fill" style="width:${pct}%;background:var(--orange)"></div></div>
            <div class="pc-meta"><span>${t.weeksLeft} sem.</span><span class="pc-reward">💰 ${t.totalRevenue.toLocaleString()}€ encaissés</span></div>
          </div>`;
        }).join('')
      : '<div class="empty-state">Aucune tournée.<br><button class="btn-action" style="margin-top:.5rem;font-size:.75rem" onclick="openTourModal()">🚌 Lancer une tournée</button></div>';
  }

  if (contractsEl) {
    const contracts = G.activeContracts || [];
    contractsEl.innerHTML = contracts.length > 0
      ? contracts.map(c => {
          const pct = Math.round(((c.totalWeeks - c.weeksLeft) / c.totalWeeks) * 100);
          return `<div class="project-card">
            <div class="pc-header"><span class="pc-name">${c.icon} ${c.name}</span></div>
            <div style="font-size:.72rem;color:var(--muted);margin-bottom:.4rem">${c.artistEmoji} ${c.artistName}</div>
            <div class="pc-bar"><div class="pc-fill" style="width:${pct}%;background:var(--gold)"></div></div>
            <div class="pc-meta"><span>${c.weeksLeft} sem.</span><span class="pc-reward">+${c.reward.toLocaleString()}€</span></div>
          </div>`;
        }).join('')
      : '<div class="empty-state">Aucun deal.<br><button class="btn-action" style="margin-top:.5rem;font-size:.75rem" onclick="openContractModal()">✍️ Signer un deal</button></div>';
  }

  done.innerHTML = G.doneProjects.slice(-10).reverse().map(p=>
    `<div class="project-card"><div class="pc-header"><span class="pc-name">${p.name}</span><span class="pc-done">✅</span></div><div style="font-size:.75rem;color:var(--muted)">+${p.reward.toLocaleString()}€ · +${p.repGain} rép.</div></div>`
  ).join('') || '<div class="empty-state">Aucun projet terminé</div>';
}

// ── RENDER : MARKET & EVENTS ──────────────────────────────────

function renderMarket() {
  const grid = document.getElementById('market-grid');
  if(!grid) return;
  const tier = getCurrentTier();
  grid.innerHTML = G.market.map(a=>{
    const col  = TYPE_COLORS[a.type];
    const advanceWeeks  = getContractAdvanceWeeks();
    const contractCost  = Math.floor((Number(a.fee) || 0) * advanceWeeks);
    const canRecruit    = G.money >= contractCost;
    const tierFull      = G.artists.length >= tier.maxArtists;
    const career        = getCareerLevel(a.fame);
    return `
      <div class="market-card ${a.type}">
        <div class="mc-top">
          <div class="mc-avatar">${a.emoji}</div>
          <div class="mc-info">
            <div class="mc-name">${a.name}</div>
            <div class="mc-type" style="color:${col}">${TYPE_LABELS[a.type]}</div>
            <div style="font-size:.65rem;color:${career.color}">${career.icon} ${career.name}</div>
            <div class="mc-fee">💰 ${a.fee.toLocaleString()}€/sem.</div>
          </div>
        </div>
        <div class="mc-skills">${a.skills.map(s=>`<span class="skill-tag">${s}</span>`).join('')}</div>
        <div class="mc-desc">${a.desc}</div>
        <div style="font-size:.75rem;color:var(--muted);margin-bottom:.4rem">⭐ ${a.talent} talent · 🌟 ${a.fame} notoriété · 💫 ${a.charisma} charisme</div>
        <div style="font-size:.72rem;color:var(--muted);margin-bottom:.4rem">
          Contrat (${advanceWeeks} sem.) : <strong style="color:${canRecruit&&!tierFull?'var(--gold)':'var(--red)'}">${contractCost.toLocaleString()}€</strong>
        </div>
        ${tierFull ? `<div style="font-size:.72rem;color:var(--orange);margin-bottom:.4rem">⚠️ Roster plein (${tier.maxArtists} max). Évoluez votre label !</div>` : ''}
        <button class="btn-recruit" ${canRecruit && !tierFull ? '' : 'disabled'} onclick="recruitArtist('${a.id}')">
          ${tierFull ? '🔒 Roster complet' : canRecruit ? `🤝 Recruter — ${contractCost.toLocaleString()}€` : '❌ Fonds insuffisants'}
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
      ev.types.includes(a.type) &&
      !G.projects.some(p=>p.artists.includes(a.id)) &&
      (a.blockedWeeks||0) <= 0
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

// ── RENDER ALL ────────────────────────────────────────────────

function renderAll() {
  renderHUD();
  renderDashboard();
  const activePane = document.querySelector('.tab-pane.active');
  if(activePane){
    const paneId = activePane && typeof activePane.id === 'string' ? activePane.id : '';
    const id = paneId.startsWith('pane-') ? paneId.slice(5) : paneId;
    if(id==='roster')    renderRoster();
    if(id==='projects')  renderProjects();
    if(id==='market')    renderMarket();
    if(id==='events')    renderEvents();
    if(id==='label')     renderLabelTab();
    if(id==='rivals')    renderRivalsTab();
    if(id==='contacts')  renderContactsTab();
    if(id==='worldmap')  renderWorldMapTab();
  }
  const now = Date.now();
  if(now - lastAutoSaveAt > 1500) { saveGame(); lastAutoSaveAt = now; }
}

// ── END SCREEN ────────────────────────────────────────────────

function showEndScreen() {
  const sub = document.getElementById('end-sub');
  const rep = G.reputation;
  const tier = getRepTier(rep);
  const labelTier = getCurrentTier();
  if(sub) sub.innerHTML = `Votre agence a atteint le statut : <strong style="color:${tier.color}">${tier.label}</strong> — ${labelTier.icon} <strong style="color:${labelTier.color}">${labelTier.name}</strong>`;
  document.getElementById('end-stats').innerHTML = `
    <div class="end-stat"><div class="end-stat-val">${G.money.toLocaleString()}€</div><div class="end-stat-label">Trésorerie</div></div>
    <div class="end-stat"><div class="end-stat-val">${rep.toFixed(0)}</div><div class="end-stat-label">Réputation</div></div>
    <div class="end-stat"><div class="end-stat-val">${G.artists.length}</div><div class="end-stat-label">Artistes</div></div>
    <div class="end-stat"><div class="end-stat-val">${G.doneProjects.length}</div><div class="end-stat-label">Projets terminés</div></div>
    <div class="end-stat"><div class="end-stat-val">${G.totalRevenue.toLocaleString()}€</div><div class="end-stat-label">Revenus totaux</div></div>
    <div class="end-stat"><div class="end-stat-val">${(Array.isArray(G.milestonesClaimed) ? G.milestonesClaimed.length : 0)}/${MILESTONES.length}}</div><div class="end-stat-label">Objectifs</div></div>
  `;
  document.getElementById('end-artists').innerHTML = G.artists.map(a=>{
    const career = getCareerLevel(a.fame);
    return `<div class="end-artist-chip">${a.emoji} ${a.name} ${career.icon}</div>`;
  }).join('');
  saveGame();
  showScreen('end-screen');
}

// ── START / RESTART ───────────────────────────────────────────

function startGame()    { newGame(); }
function newGame()      { initState(); clearSave(); saveGame(); showScreen('main-screen'); openTab('dashboard'); renderAll(); }
function continueGame() {
  if(!loadGame()) { toast('ℹ️ Aucune sauvegarde trouvée.', '#60a5fa'); return; }
  showScreen('main-screen'); openTab('dashboard'); renderAll();
}
function restartGame()  { initState(); clearSave(); showScreen('title-screen'); updateTitleActions(); }
function manualSave()   { if(saveGame()) toast('💾 Partie sauvegardée.', '#22c55e'); }
function deleteSave()   {
  if(!window.confirm('Supprimer la sauvegarde locale ?')) return;
  clearSave(); updateTitleActions(); toast('🗑️ Sauvegarde supprimée.', '#f97316');
}
function updateTitleActions() {
  const btn = document.getElementById('continue-btn');
  if(btn) btn.disabled = !hasActiveSave();
}

function renderTitleCards() {
  const cont = document.getElementById('title-cards');
  if(!cont) return;
  const types = [
    {emoji:'🎵',label:'Musicien'},{emoji:'🎨',label:'Peintre'},
    {emoji:'🎭',label:'Comédien'},{emoji:'📷',label:'Photographe'},{emoji:'✍️',label:'Poète'}
  ];
  cont.innerHTML = types.map(t=>`
    <div class="title-card"><div>${t.emoji}</div><div class="title-card-label">${t.label}</div></div>
  `).join('');
}

// ── INIT ─────────────────────────────────────────────────────

window.addEventListener('DOMContentLoaded', ()=>{
  renderTitleCards();
  updateTitleActions();
});

window.addEventListener('beforeunload', ()=> { saveGame(); });

// Expose globals
window.buyUpgrade         = buyUpgrade;
window.claimMilestone     = claimMilestone;
window.manualSave         = manualSave;
window.exportSave         = exportSave;
window.importSave         = importSave;
window.deleteSave         = deleteSave;
window.continueGame       = continueGame;
window.upgradeLabelTier   = upgradeLabelTier;
window.spyOnRival         = spyOnRival;
window.sabotageRival      = sabotageRival;
window.acceptCounterOffer = acceptCounterOffer;
window.rejectCounterOffer = rejectCounterOffer;
window.openRivalOfferModal= openRivalOfferModal;
window.closeFavorModal    = closeFavorModal;
window.giveFavor          = giveFavor;
window.openFavorModal     = openFavorModal;
window.closeThenFavor     = closeThenFavor;
window.closeRivalOfferModal = closeRivalOfferModal;
window.openTourModal        = openTourModal;
window.closeTourModal       = closeTourModal;
window.selectTourArtist     = selectTourArtist;
window.startTour            = startTour;
window.openContractModal    = openContractModal;
window.closeContractModal   = closeContractModal;
window.selectContract       = selectContract;
window.signContract         = signContract;
window.openCollabModal      = openCollabModal;
window.closeCollabModal     = closeCollabModal;
window.toggleCollabArtist   = toggleCollabArtist;
window.launchCollabProject  = launchCollabProject;
window.openSalaryNegotiation= openSalaryNegotiation;
window.closeSalaryModal     = closeSalaryModal;
window.confirmSalary        = confirmSalary;
window.resolveScandal       = resolveScandal;
window.meetContact          = meetContact;
window.proposeAlliance      = proposeAlliance;
window.breakAlliance        = breakAlliance;
window.openCityModal        = openCityModal;
window.closeCityModal       = closeCityModal;
window.performCityEvent     = performCityEvent;
window.participateWorldEvent= participateWorldEvent;
window.renderContactsTab    = renderContactsTab;
window.renderWorldMapTab    = renderWorldMapTab;
window.renderRivalsTabV2    = renderRivalsTabV2;
window.selectTourArtist     = selectTourArtist;
window.getAllianceBonus      = getAllianceBonus;
window.getContactPassiveBonus = getContactPassiveBonus;
window.getRoleCompatibility = getRoleCompatibility;// =============================================================
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