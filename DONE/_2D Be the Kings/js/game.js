/* ═══════════════════════════════════════════════════════════════════
   BE THE KING — Moteur Complet v2
   60+ bâtiments, 50+ technologies, 30+ unités, carte 2D interactive
   ═══════════════════════════════════════════════════════════════════ */

// ============================
//  DONNÉES — ÈRES
// ============================
var ERAS = [
    { id:'antiquite',    name:'Antiquité',       yearStart:-4000, yearPerTurn:50,  cssClass:'' },
    { id:'medieval',     name:'Moyen-Âge',       yearStart:500,   yearPerTurn:25,  cssClass:'era-medieval' },
    { id:'renaissance',  name:'Renaissance',      yearStart:1400,  yearPerTurn:10,  cssClass:'era-renaissance' },
    { id:'industrielle', name:'Ère Industrielle', yearStart:1750,  yearPerTurn:5,   cssClass:'era-industrielle' },
    { id:'moderne',      name:'Ère Moderne',      yearStart:1900,  yearPerTurn:2,   cssClass:'era-moderne' },
    { id:'contemporaine',name:'Contemporaine',    yearStart:1990,  yearPerTurn:1,   cssClass:'era-contemporaine' }
];

var GOVERNMENTS = {
    monarchie:  { name:'Monarchie',       icon:'👑', bonuses:{ goldRate:0.10, stability:5 } },
    republique: { name:'République',      icon:'⚖️', bonuses:{ scienceRate:0.10, cultureRate:0.05 } },
    theocratie: { name:'Théocratie',      icon:'🏛️', bonuses:{ cultureRate:0.15, stability:10 } },
    militaire:  { name:'État Militaire',  icon:'⚔️', bonuses:{ militaryPower:0.15, prodRate:0.05 } },
    democratie: { name:'Démocratie',      icon:'🗳️', bonuses:{ happiness:10, scienceRate:0.10 } },
    communisme: { name:'Communisme',      icon:'☭',  bonuses:{ prodRate:0.20, foodRate:0.10, happiness:-10 } },
    fascisme:   { name:'Fascisme',        icon:'🦅', bonuses:{ militaryPower:0.25, prodRate:0.15, happiness:-15 } },
    oligarchie: { name:'Oligarchie',      icon:'💎', bonuses:{ goldRate:0.20, happiness:-5 } }
};

// ============================
//  DONNÉES — BÂTIMENTS (60+)
// ============================
var BUILDINGS = [
    // ── ANTIQUITÉ ──
    { id:'ferme',         name:'Ferme',              icon:'🌾', cat:'nourriture',     era:'antiquite', cost:{gold:30,prod:20},   effect:{foodRate:3}, desc:'Culture des terres', tech:null },
    { id:'grenier',       name:'Grenier',            icon:'🏠', cat:'nourriture',     era:'antiquite', cost:{gold:35,prod:25},   effect:{foodRate:2}, desc:'Stockage de nourriture', tech:'agriculture' },
    { id:'irrigation',    name:'Canal d\'Irrigation', icon:'💧', cat:'nourriture',     era:'antiquite', cost:{gold:50,prod:35},   effect:{foodRate:4}, desc:'Irrigue les champs', tech:'agriculture' },
    { id:'mine',          name:'Mine',               icon:'⛏️', cat:'economie',       era:'antiquite', cost:{gold:40,prod:30},   effect:{prodRate:3}, desc:'Extraction de minerai', tech:null },
    { id:'carriere',      name:'Carrière',           icon:'🪨', cat:'economie',       era:'antiquite', cost:{gold:45,prod:35},   effect:{prodRate:4}, desc:'Pierre de construction', tech:'extraction' },
    { id:'marche',        name:'Marché',             icon:'🏪', cat:'economie',       era:'antiquite', cost:{gold:50,prod:20},   effect:{goldRate:5}, desc:'Commerce local', tech:'poterie' },
    { id:'temple',        name:'Temple',             icon:'🏛️', cat:'religion',       era:'antiquite', cost:{gold:60,prod:30},   effect:{cultureRate:2,stability:3}, desc:'Lieu de culte', tech:'mystique' },
    { id:'autel',         name:'Autel Sacré',        icon:'🕯️', cat:'religion',       era:'antiquite', cost:{gold:40,prod:20},   effect:{stability:4}, desc:'Apaise le peuple', tech:'mystique' },
    { id:'bibliotheque',  name:'Bibliothèque',       icon:'📚', cat:'science',        era:'antiquite', cost:{gold:70,prod:40},   effect:{scienceRate:4}, desc:'Savoir ancestral', tech:'ecriture' },
    { id:'academie',      name:'Académie',           icon:'🏫', cat:'science',        era:'antiquite', cost:{gold:90,prod:50},   effect:{scienceRate:6}, desc:'Centre de pensée', tech:'philosophie' },
    { id:'caserne',       name:'Caserne',            icon:'🏕️', cat:'militaire',      era:'antiquite', cost:{gold:50,prod:40},   effect:{militaryPower:5}, desc:'Entraînement', tech:'bronze' },
    { id:'murailles',     name:'Murailles',          icon:'🧱', cat:'militaire',      era:'antiquite', cost:{gold:80,prod:60},   effect:{defense:10,stability:3}, desc:'Défense de la cité', tech:'maconnerie' },
    { id:'palissade',     name:'Palissade',          icon:'🪵', cat:'militaire',      era:'antiquite', cost:{gold:25,prod:20},   effect:{defense:5}, desc:'Protection basique', tech:null },
    { id:'agora',         name:'Agora',              icon:'🏛️', cat:'culture',        era:'antiquite', cost:{gold:55,prod:30},   effect:{cultureRate:3,happiness:2}, desc:'Place publique', tech:'ecriture' },
    { id:'atelier',       name:'Atelier d\'Artisan', icon:'🏺', cat:'economie',       era:'antiquite', cost:{gold:45,prod:30},   effect:{prodRate:2,goldRate:2}, desc:'Artisanat', tech:'poterie' },
    { id:'aqueduc',       name:'Aqueduc',            icon:'🌊', cat:'infrastructure', era:'antiquite', cost:{gold:100,prod:70},  effect:{foodRate:3,happiness:3,popGrowth:0.01}, desc:'Eau courante', tech:'maconnerie' },

    // ── MOYEN-ÂGE ──
    { id:'cathedrale',    name:'Cathédrale',         icon:'⛪', cat:'religion',       era:'medieval', cost:{gold:200,prod:120}, effect:{cultureRate:8,stability:5,happiness:3}, desc:'Merveille religieuse', tech:'theologie' },
    { id:'monastere',     name:'Monastère',          icon:'📿', cat:'religion',       era:'medieval', cost:{gold:100,prod:60},  effect:{scienceRate:3,cultureRate:3,stability:3}, desc:'Moines copistes', tech:'theologie' },
    { id:'forge',         name:'Forge',              icon:'🔨', cat:'economie',       era:'medieval', cost:{gold:80,prod:50},   effect:{prodRate:5,militaryPower:3}, desc:'Travail du fer', tech:'metallurgie' },
    { id:'universite',    name:'Université',         icon:'🎓', cat:'science',        era:'medieval', cost:{gold:120,prod:70},  effect:{scienceRate:8}, desc:'Centre de savoir', tech:'education' },
    { id:'chateau_fort',  name:'Château Fort',       icon:'🏰', cat:'militaire',      era:'medieval', cost:{gold:200,prod:120}, effect:{defense:25,stability:5,militaryPower:8}, desc:'Forteresse', tech:'feodalisme' },
    { id:'port',          name:'Port Commercial',    icon:'⚓', cat:'economie',       era:'medieval', cost:{gold:130,prod:80},  effect:{goldRate:10,foodRate:3}, desc:'Commerce maritime', tech:'navigation' },
    { id:'moulin',        name:'Moulin',             icon:'🌀', cat:'nourriture',     era:'medieval', cost:{gold:60,prod:40},   effect:{foodRate:5,prodRate:2}, desc:'Transforme céréales', tech:'mecanique' },
    { id:'guilde',        name:'Guilde des Marchands',icon:'💼', cat:'economie',      era:'medieval', cost:{gold:100,prod:50},  effect:{goldRate:8}, desc:'Organisation marchande', tech:'navigation' },
    { id:'ecurie',        name:'Écurie Royale',      icon:'🐴', cat:'militaire',      era:'medieval', cost:{gold:90,prod:60},   effect:{militaryPower:6}, desc:'Cavalerie montée', tech:'feodalisme' },
    { id:'rempart',       name:'Remparts',           icon:'🛡️', cat:'militaire',      era:'medieval', cost:{gold:150,prod:100}, effect:{defense:20}, desc:'Murs renforcés', tech:'feodalisme' },
    { id:'auberge',       name:'Auberge',            icon:'🍺', cat:'culture',        era:'medieval', cost:{gold:50,prod:30},   effect:{happiness:4,goldRate:2}, desc:'Repos du voyageur', tech:null },
    { id:'marche_couvert',name:'Marché Couvert',     icon:'🏬', cat:'economie',       era:'medieval', cost:{gold:80,prod:45},   effect:{goldRate:6,foodRate:2}, desc:'Commerce abrité', tech:'mecanique' },
    { id:'hopital_medieval',name:'Hospice',           icon:'🏥', cat:'infrastructure', era:'medieval', cost:{gold:110,prod:70},  effect:{happiness:4,popGrowth:0.01}, desc:'Soins aux malades', tech:'education' },
    { id:'scriptorium',   name:'Scriptorium',        icon:'✍️', cat:'science',        era:'medieval', cost:{gold:90,prod:50},   effect:{scienceRate:5,cultureRate:2}, desc:'Copie de manuscrits', tech:'theologie' },

    // ── RENAISSANCE ──
    { id:'banque',        name:'Banque',             icon:'🏦', cat:'economie',       era:'renaissance', cost:{gold:200,prod:100}, effect:{goldRate:15}, desc:'Institution financière', tech:'economie_t' },
    { id:'observatoire',  name:'Observatoire',       icon:'🔭', cat:'science',        era:'renaissance', cost:{gold:180,prod:90},  effect:{scienceRate:12}, desc:'Scrute les cieux', tech:'astronomie' },
    { id:'theatre',       name:'Théâtre',            icon:'🎭', cat:'culture',        era:'renaissance', cost:{gold:120,prod:70},  effect:{cultureRate:10,happiness:5}, desc:'Art dramatique', tech:'art' },
    { id:'arsenal',       name:'Arsenal',            icon:'🏭', cat:'militaire',      era:'renaissance', cost:{gold:180,prod:110}, effect:{militaryPower:15,prodRate:5}, desc:'Armes à feu', tech:'poudre' },
    { id:'imprimerie',    name:'Imprimerie',         icon:'📰', cat:'science',        era:'renaissance', cost:{gold:140,prod:60},  effect:{scienceRate:6,cultureRate:6}, desc:'Diffusion du savoir', tech:'imprimerie_t' },
    { id:'manufacture',   name:'Manufacture',        icon:'🧵', cat:'economie',       era:'renaissance', cost:{gold:160,prod:90},  effect:{prodRate:8,goldRate:6}, desc:'Proto-industrie', tech:'economie_t' },
    { id:'chantier_naval',name:'Chantier Naval',     icon:'🚢', cat:'militaire',      era:'renaissance', cost:{gold:200,prod:120}, effect:{militaryPower:10,goldRate:5}, desc:'Construction navale', tech:'navigation_avancee' },
    { id:'galerie_art',   name:'Galerie d\'Art',     icon:'🖼️', cat:'culture',        era:'renaissance', cost:{gold:150,prod:80},  effect:{cultureRate:12,prestige:3}, desc:'Collection d\'œuvres', tech:'art' },
    { id:'fortification', name:'Fortification Star', icon:'⭐', cat:'militaire',      era:'renaissance', cost:{gold:250,prod:150}, effect:{defense:35}, desc:'Fort en étoile', tech:'poudre' },
    { id:'comptoir',      name:'Comptoir Commercial',icon:'🏪', cat:'economie',       era:'renaissance', cost:{gold:120,prod:60},  effect:{goldRate:10}, desc:'Commerce lointain', tech:'navigation_avancee' },
    { id:'academie_royale',name:'Académie Royale',   icon:'🏫', cat:'science',        era:'renaissance', cost:{gold:200,prod:100}, effect:{scienceRate:10,cultureRate:4}, desc:'Élite du savoir', tech:'imprimerie_t' },
    { id:'palais',        name:'Palais',             icon:'🏰', cat:'culture',        era:'renaissance', cost:{gold:300,prod:180}, effect:{prestige:8,stability:5,happiness:3}, desc:'Siège du pouvoir', tech:'art' },

    // ── ÈRE INDUSTRIELLE ──
    { id:'usine',         name:'Usine',              icon:'🏭', cat:'economie',       era:'industrielle', cost:{gold:300,prod:200}, effect:{prodRate:15,goldRate:8,happiness:-3}, desc:'Production de masse', tech:'vapeur' },
    { id:'gare',          name:'Gare Ferroviaire',   icon:'🚂', cat:'infrastructure', era:'industrielle', cost:{gold:250,prod:150}, effect:{goldRate:12,prodRate:5}, desc:'Réseau ferré', tech:'vapeur' },
    { id:'hopital',       name:'Hôpital Moderne',    icon:'🏥', cat:'infrastructure', era:'industrielle', cost:{gold:200,prod:120}, effect:{happiness:8,popGrowth:0.02}, desc:'Soins modernes', tech:'medecine' },
    { id:'fort_moderne',  name:'Fort Moderne',       icon:'🏰', cat:'militaire',      era:'industrielle', cost:{gold:350,prod:200}, effect:{defense:40,militaryPower:15}, desc:'Fortification avancée', tech:'artillerie' },
    { id:'labo',          name:'Laboratoire',        icon:'🔬', cat:'science',        era:'industrielle', cost:{gold:280,prod:150}, effect:{scienceRate:18}, desc:'Recherche', tech:'chimie' },
    { id:'centrale',      name:'Centrale Électrique',icon:'⚡', cat:'infrastructure', era:'industrielle', cost:{gold:350,prod:200}, effect:{prodRate:10,goldRate:8}, desc:'Énergie', tech:'electricite_t' },
    { id:'depot',         name:'Dépôt Militaire',    icon:'📦', cat:'militaire',      era:'industrielle', cost:{gold:200,prod:130}, effect:{militaryPower:12}, desc:'Logistique militaire', tech:'artillerie' },
    { id:'journal',       name:'Journal',            icon:'📰', cat:'culture',        era:'industrielle', cost:{gold:150,prod:60},  effect:{cultureRate:8,happiness:3}, desc:'Presse écrite', tech:'medecine' },
    { id:'musee',         name:'Musée National',     icon:'🏛️', cat:'culture',        era:'industrielle', cost:{gold:250,prod:120}, effect:{cultureRate:12,prestige:5}, desc:'Conservation du patrimoine', tech:'chimie' },
    { id:'plantation',    name:'Plantation Industrielle',icon:'🌿', cat:'nourriture', era:'industrielle', cost:{gold:180,prod:100}, effect:{foodRate:12,goldRate:5}, desc:'Agriculture à grande échelle', tech:'vapeur' },

    // ── ÈRE MODERNE ──
    { id:'bourse',        name:'Bourse',             icon:'📈', cat:'economie',       era:'moderne', cost:{gold:500,prod:250}, effect:{goldRate:25}, desc:'Marché financier', tech:'telecom' },
    { id:'media',         name:'Centre Médias',      icon:'📺', cat:'culture',        era:'moderne', cost:{gold:350,prod:180}, effect:{cultureRate:15,happiness:5,stability:3}, desc:'Radio & TV', tech:'telecom' },
    { id:'base_militaire',name:'Base Militaire',     icon:'🎖️', cat:'militaire',      era:'moderne', cost:{gold:600,prod:350}, effect:{militaryPower:30,defense:20}, desc:'Complexe militaire', tech:'aviation' },
    { id:'centre_spatial',name:'Centre Spatial',     icon:'🚀', cat:'science',        era:'moderne', cost:{gold:800,prod:500}, effect:{scienceRate:30,prestige:10}, desc:'Exploration spatiale', tech:'fusee' },
    { id:'aeroport',      name:'Aéroport Int.',      icon:'✈️', cat:'infrastructure', era:'moderne', cost:{gold:450,prod:250}, effect:{goldRate:15,cultureRate:5}, desc:'Hub aérien', tech:'aviation' },
    { id:'stade',         name:'Grand Stade',        icon:'🏟️', cat:'culture',        era:'moderne', cost:{gold:300,prod:200}, effect:{happiness:10,prestige:5}, desc:'Événements sportifs', tech:'telecom' },
    { id:'gratte_ciel',   name:'Gratte-Ciel',        icon:'🏢', cat:'economie',       era:'moderne', cost:{gold:500,prod:300}, effect:{goldRate:18,prestige:3}, desc:'Quartier d\'affaires', tech:'electricite_t' },
    { id:'nucleaire',     name:'Centrale Nucléaire', icon:'☢️', cat:'infrastructure', era:'moderne', cost:{gold:700,prod:400}, effect:{prodRate:20,scienceRate:5,happiness:-5}, desc:'Énergie atomique', tech:'nucleaire_t' },
    { id:'universite_mod',name:'Université Moderne', icon:'🎓', cat:'science',        era:'moderne', cost:{gold:400,prod:200}, effect:{scienceRate:20}, desc:'Recherche de pointe', tech:'telecom' },
    { id:'bunker',        name:'Bunker',             icon:'🛡️', cat:'militaire',      era:'moderne', cost:{gold:400,prod:250}, effect:{defense:35}, desc:'Abri fortifié', tech:'nucleaire_t' },
    { id:'hopital_mod',   name:'Hôpital Universitaire',icon:'🏥', cat:'infrastructure', era:'moderne', cost:{gold:350,prod:200}, effect:{happiness:10,popGrowth:0.03}, desc:'Médecine avancée', tech:'nucleaire_t' },

    // ── CONTEMPORAINE ──
    { id:'ia_center',     name:'Centre IA',          icon:'🤖', cat:'science',        era:'contemporaine', cost:{gold:1000,prod:600}, effect:{scienceRate:40,prodRate:10}, desc:'Intelligence artificielle', tech:'ia' },
    { id:'smart_city',    name:'Ville Connectée',    icon:'🌐', cat:'infrastructure', era:'contemporaine', cost:{gold:800,prod:400},  effect:{happiness:10,goldRate:15,cultureRate:10}, desc:'Ville du futur', tech:'informatique' },
    { id:'cyber_defense', name:'Cyberdéfense',       icon:'🛡️', cat:'militaire',      era:'contemporaine', cost:{gold:700,prod:400},  effect:{defense:50,militaryPower:20}, desc:'Guerre numérique', tech:'informatique' },
    { id:'fusion',        name:'Réacteur à Fusion',  icon:'⚛️', cat:'science',        era:'contemporaine', cost:{gold:1500,prod:800}, effect:{prodRate:30,scienceRate:20,happiness:5}, desc:'Énergie illimitée', tech:'fusion_t' },
    { id:'ferme_vert',    name:'Ferme Verticale',    icon:'🌱', cat:'nourriture',     era:'contemporaine', cost:{gold:600,prod:300},  effect:{foodRate:25}, desc:'Agriculture high-tech', tech:'informatique' },
    { id:'datacenter',    name:'Datacenter',         icon:'💾', cat:'science',        era:'contemporaine', cost:{gold:500,prod:300},  effect:{scienceRate:15,goldRate:10}, desc:'Puissance de calcul', tech:'informatique' },
    { id:'station_orbitale',name:'Station Orbitale', icon:'🛸', cat:'science',        era:'contemporaine', cost:{gold:2000,prod:1000},effect:{scienceRate:50,prestige:20}, desc:'Avant-poste spatial', tech:'fusion_t' },
    { id:'reseau_5g',     name:'Réseau 6G',          icon:'📡', cat:'infrastructure', era:'contemporaine', cost:{gold:400,prod:200},  effect:{goldRate:12,cultureRate:8,scienceRate:5}, desc:'Connectivité totale', tech:'ia' },
    { id:'arcologie',     name:'Arcologie',          icon:'🏙️', cat:'culture',        era:'contemporaine', cost:{gold:1200,prod:700}, effect:{happiness:15,popGrowth:0.04,prestige:10}, desc:'Cité autosuffisante', tech:'fusion_t' },
    // Economic infrastructure, progressing from food security to automated industry.
    { id:'cooperative_agricole', name:'Coopérative agricole', icon:'🌽', cat:'nourriture', era:'antiquite', cost:{gold:65,prod:45}, effect:{foodRate:6,goldRate:1}, desc:'Production vivrière mutualisée', tech:'agriculture' },
    { id:'route_commerciale', name:'Relais commercial', icon:'🛤️', cat:'economie', era:'medieval', cost:{gold:115,prod:75}, effect:{goldRate:8,prodRate:2}, desc:'Échanges terrestres et marchés régionaux', tech:'navigation' },
    { id:'bourse_marchande', name:'Bourse marchande', icon:'📈', cat:'economie', era:'renaissance', cost:{gold:230,prod:140}, effect:{goldRate:18,scienceRate:2}, desc:'Financement du négoce et des manufactures', tech:'economie_t' },
    { id:'entrepot_industriel', name:'Entrepôt industriel', icon:'📦', cat:'economie', era:'industrielle', cost:{gold:270,prod:170}, effect:{prodRate:11,goldRate:4}, desc:'Distribution des biens industriels', tech:'acier' },
    { id:'centrale_logistique', name:'Plateforme logistique', icon:'🚛', cat:'economie', era:'moderne', cost:{gold:470,prod:280}, effect:{prodRate:16,goldRate:10}, desc:'Chaîne d'approvisionnement civile et militaire', tech:'blindes' },
    { id:'zone_france', name:'Zone franche', icon:'🏢', cat:'economie', era:'moderne', cost:{gold:520,prod:310}, effect:{goldRate:25,prodRate:8}, desc:'Zone de commerce et d'investissement', tech:'economie_t' },
    { id:'industrie_robotisee', name:'Usine robotisée', icon:'🦾', cat:'economie', era:'contemporaine', cost:{gold:850,prod:520}, effect:{prodRate:36,goldRate:12}, desc:'Production automatisée à haut rendement', tech:'ia' },
    { id:'fintech', name:'Centre financier numérique', icon:'💳', cat:'economie', era:'contemporaine', cost:{gold:760,prod:410}, effect:{goldRate:32,scienceRate:8}, desc:'Services financiers numériques', tech:'informatique' },
    { id:'reseau_fret', name:'Réseau de fret intelligent', icon:'🚆', cat:'economie', era:'contemporaine', cost:{gold:900,prod:570}, effect:{prodRate:25,foodRate:10,goldRate:15}, desc:'Optimisation des transports et du commerce', tech:'ia' },
    { id:'agrotechnologie', name:'Centre agrotechnologique', icon:'🌿', cat:'nourriture', era:'contemporaine', cost:{gold:710,prod:390}, effect:{foodRate:32,scienceRate:6}, desc:'Recherche et production agricole avancées', tech:'informatique' }
];

// ============================
//  DONNÉES — TECHNOLOGIES (50+)
// ============================
var TECHNOLOGIES = [
    // ── ANTIQUITÉ ──
    { id:'agriculture',  name:'Agriculture',        icon:'🌱', era:'antiquite', cost:20,  prereqs:[], unlocks:['grenier','irrigation'] },
    { id:'poterie',      name:'Poterie',            icon:'🏺', era:'antiquite', cost:25,  prereqs:[], unlocks:['marche','atelier'] },
    { id:'mystique',     name:'Mysticisme',         icon:'🕯️', era:'antiquite', cost:25,  prereqs:[], unlocks:['temple','autel'] },
    { id:'extraction',   name:'Extraction Minière', icon:'⛏️', era:'antiquite', cost:30,  prereqs:[], unlocks:['carriere'] },
    { id:'ecriture',     name:'Écriture',           icon:'📝', era:'antiquite', cost:40,  prereqs:['poterie'], unlocks:['bibliotheque','agora'] },
    { id:'bronze',       name:'Travail du Bronze',  icon:'🗡️', era:'antiquite', cost:35,  prereqs:['extraction'], unlocks:['caserne'] },
    { id:'maconnerie',   name:'Maçonnerie',         icon:'🧱', era:'antiquite', cost:45,  prereqs:['extraction'], unlocks:['murailles','aqueduc'] },
    { id:'philosophie',  name:'Philosophie',         icon:'💭', era:'antiquite', cost:50,  prereqs:['ecriture','mystique'], unlocks:['academie'] },
    { id:'mathematiques',name:'Mathématiques',       icon:'📐', era:'antiquite', cost:45,  prereqs:['ecriture'], unlocks:[] },
    { id:'roue',         name:'La Roue',            icon:'☸️', era:'antiquite', cost:30,  prereqs:['poterie'], unlocks:[] },

    // ── MOYEN-ÂGE ──
    { id:'feodalisme',   name:'Féodalisme',         icon:'🏰', era:'medieval', cost:80,  prereqs:['ecriture','bronze'], unlocks:['chateau_fort','ecurie','rempart'] },
    { id:'theologie',    name:'Théologie',          icon:'📖', era:'medieval', cost:70,  prereqs:['mystique','ecriture'], unlocks:['cathedrale','monastere','scriptorium'] },
    { id:'metallurgie',  name:'Métallurgie',        icon:'🔨', era:'medieval', cost:60,  prereqs:['bronze'], unlocks:['forge'] },
    { id:'navigation',   name:'Navigation',         icon:'🧭', era:'medieval', cost:75,  prereqs:['poterie','maconnerie'], unlocks:['port','guilde'] },
    { id:'education',    name:'Éducation',          icon:'🎓', era:'medieval', cost:90,  prereqs:['theologie','ecriture'], unlocks:['universite','hopital_medieval'] },
    { id:'mecanique',    name:'Mécanique',          icon:'⚙️', era:'medieval', cost:65,  prereqs:['extraction','roue'], unlocks:['moulin','marche_couvert'] },
    { id:'arbalete',     name:'Arbalète',           icon:'🏹', era:'medieval', cost:55,  prereqs:['metallurgie'], unlocks:[] },
    { id:'chevalerie',   name:'Chevalerie',         icon:'⚔️', era:'medieval', cost:85,  prereqs:['feodalisme','metallurgie'], unlocks:[] },
    { id:'architecture', name:'Architecture',       icon:'🏗️', era:'medieval', cost:80,  prereqs:['maconnerie','mathematiques'], unlocks:['auberge'] },
    { id:'siege_t',      name:'Engins de Siège',    icon:'🪨', era:'medieval', cost:70,  prereqs:['mecanique','metallurgie'], unlocks:[] },

    // ── RENAISSANCE ──
    { id:'imprimerie_t', name:'Imprimerie',         icon:'📰', era:'renaissance', cost:130, prereqs:['education'], unlocks:['imprimerie','academie_royale'] },
    { id:'astronomie',   name:'Astronomie',         icon:'🔭', era:'renaissance', cost:140, prereqs:['education','mathematiques'], unlocks:['observatoire'] },
    { id:'economie_t',   name:'Économie',           icon:'🏦', era:'renaissance', cost:150, prereqs:['navigation','imprimerie_t'], unlocks:['banque','manufacture'] },
    { id:'art',          name:'Beaux-Arts',         icon:'🎨', era:'renaissance', cost:120, prereqs:['theologie','education'], unlocks:['theatre','galerie_art','palais'] },
    { id:'poudre',       name:'Poudre à Canon',     icon:'💥', era:'renaissance', cost:160, prereqs:['metallurgie','chimie_base'], unlocks:['arsenal','fortification'] },
    { id:'navigation_avancee',name:'Navigation Avancée',icon:'🗺️', era:'renaissance', cost:140, prereqs:['navigation','astronomie'], unlocks:['chantier_naval','comptoir'] },
    { id:'chimie_base',  name:'Alchimie',           icon:'⚗️', era:'renaissance', cost:110, prereqs:['philosophie','metallurgie'], unlocks:[] },
    { id:'diplomatie_t', name:'Diplomatie Formelle', icon:'📜', era:'renaissance', cost:100, prereqs:['imprimerie_t'], unlocks:[] },
    { id:'tactique',     name:'Tactique Moderne',   icon:'📋', era:'renaissance', cost:130, prereqs:['poudre','chevalerie'], unlocks:[] },

    // ── INDUSTRIELLE ──
    { id:'vapeur',       name:'Machine à Vapeur',   icon:'🚂', era:'industrielle', cost:250, prereqs:['mecanique','metallurgie'], unlocks:['usine','gare','plantation'] },
    { id:'medecine',     name:'Médecine',           icon:'💊', era:'industrielle', cost:200, prereqs:['astronomie','chimie_base'], unlocks:['hopital','journal'] },
    { id:'chimie',       name:'Chimie Moderne',     icon:'⚗️', era:'industrielle', cost:230, prereqs:['chimie_base','astronomie'], unlocks:['labo','musee'] },
    { id:'artillerie',   name:'Artillerie',         icon:'🎯', era:'industrielle', cost:280, prereqs:['poudre','vapeur'], unlocks:['fort_moderne','depot'] },
    { id:'electricite_t',name:'Électricité',        icon:'⚡', era:'industrielle', cost:300, prereqs:['chimie','vapeur'], unlocks:['centrale','gratte_ciel'] },
    { id:'acier',        name:'Acier',              icon:'🔩', era:'industrielle', cost:220, prereqs:['metallurgie','vapeur'], unlocks:[] },
    { id:'chemin_fer',   name:'Chemin de Fer',      icon:'🛤️', era:'industrielle', cost:240, prereqs:['vapeur','acier'], unlocks:[] },
    { id:'explosifs',    name:'Explosifs',          icon:'💣', era:'industrielle', cost:260, prereqs:['chimie','artillerie'], unlocks:[] },

    // ── MODERNE ──
    { id:'telecom',      name:'Télécommunications', icon:'📡', era:'moderne', cost:380, prereqs:['electricite_t'], unlocks:['media','bourse','stade','universite_mod'] },
    { id:'aviation',     name:'Aviation',           icon:'✈️', era:'moderne', cost:420, prereqs:['artillerie','electricite_t'], unlocks:['aeroport','base_militaire'] },
    { id:'fusee',        name:'Fusées',             icon:'🚀', era:'moderne', cost:500, prereqs:['aviation','explosifs'], unlocks:['centre_spatial'] },
    { id:'nucleaire_t',  name:'Fission Nucléaire',  icon:'☢️', era:'moderne', cost:550, prereqs:['chimie','fusee'], unlocks:['nucleaire','bunker','hopital_mod'] },
    { id:'radar',        name:'Radar',              icon:'📡', era:'moderne', cost:350, prereqs:['telecom','aviation'], unlocks:[] },
    { id:'antibiotiques',name:'Antibiotiques',      icon:'💉', era:'moderne', cost:300, prereqs:['medecine','chimie'], unlocks:[] },
    { id:'transistor',   name:'Transistor',         icon:'🔲', era:'moderne', cost:400, prereqs:['electricite_t','telecom'], unlocks:[] },
    { id:'blindes',      name:'Blindés',            icon:'🛡️', era:'moderne', cost:450, prereqs:['acier','aviation'], unlocks:[] },

    // ── CONTEMPORAINE ──
    { id:'informatique', name:'Informatique',       icon:'💻', era:'contemporaine', cost:600, prereqs:['telecom','transistor'], unlocks:['smart_city','cyber_defense','datacenter'] },
    { id:'ia',           name:'Intelligence Art.',   icon:'🤖', era:'contemporaine', cost:800, prereqs:['informatique'], unlocks:['ia_center','reseau_5g'] },
    { id:'fusion_t',     name:'Fusion Nucléaire',   icon:'⚛️', era:'contemporaine', cost:1000, prereqs:['nucleaire_t','fusee'], unlocks:['fusion','station_orbitale','arcologie'] },
    { id:'biotech',      name:'Biotechnologie',     icon:'🧬', era:'contemporaine', cost:700, prereqs:['informatique','antibiotiques'], unlocks:['ferme_vert'] },
    { id:'quantique',    name:'Calcul Quantique',   icon:'🔮', era:'contemporaine', cost:900, prereqs:['ia'], unlocks:[] },
    { id:'nanotechnologie',name:'Nanotechnologie',  icon:'🔬', era:'contemporaine', cost:850, prereqs:['biotech','ia'], unlocks:[] }
];

// ============================
//  DONNÉES — UNITÉS (30+)
// ============================
var UNITS = [
    // ── ANTIQUITÉ ──
    { id:'milicien',     name:'Miliciens',          icon:'👤', era:'antiquite',     type:'melee',    power:2,  cost:{gold:10,food:8},   upkeep:{gold:0,food:1}, tech:null },
    { id:'guerrier',     name:'Guerriers',          icon:'🗡️', era:'antiquite',     type:'melee',    power:4,  cost:{gold:20,food:10},  upkeep:{gold:1,food:2}, tech:'bronze' },
    { id:'archer',       name:'Archers',            icon:'🏹', era:'antiquite',     type:'ranged',   power:3,  cost:{gold:25,food:10},  upkeep:{gold:1,food:2}, tech:'bronze' },
    { id:'frondeur',     name:'Frondeurs',          icon:'🪨', era:'antiquite',     type:'ranged',   power:2,  cost:{gold:15,food:8},   upkeep:{gold:0,food:1}, tech:null },
    { id:'chariot',      name:'Chars de Guerre',    icon:'☸️', era:'antiquite',     type:'cavalry',  power:6,  cost:{gold:40,food:15},  upkeep:{gold:2,food:3}, tech:'roue' },
    { id:'lancier',      name:'Lanciers',           icon:'🔱', era:'antiquite',     type:'melee',    power:5,  cost:{gold:25,food:12},  upkeep:{gold:1,food:2}, tech:'bronze' },
    { id:'galere',       name:'Galères',            icon:'⛵', era:'antiquite',     type:'naval',    power:5,  cost:{gold:50,prod:30},  upkeep:{gold:2,food:3}, tech:'maconnerie' },

    // ── MOYEN-ÂGE ──
    { id:'homme_armes',  name:'Hommes d\'Armes',    icon:'⚔️', era:'medieval',      type:'melee',    power:8,  cost:{gold:40,food:15},  upkeep:{gold:2,food:3}, tech:'metallurgie' },
    { id:'arbaletrier',  name:'Arbalétriers',       icon:'🎯', era:'medieval',      type:'ranged',   power:7,  cost:{gold:35,food:12},  upkeep:{gold:2,food:2}, tech:'arbalete' },
    { id:'cavalier',     name:'Cavalerie Légère',   icon:'🐴', era:'medieval',      type:'cavalry',  power:9,  cost:{gold:50,food:20},  upkeep:{gold:3,food:4}, tech:'feodalisme' },
    { id:'chevalier',    name:'Chevaliers',         icon:'🛡️', era:'medieval',      type:'cavalry',  power:14, cost:{gold:80,food:25},  upkeep:{gold:4,food:5}, tech:'chevalerie' },
    { id:'belier',       name:'Béliers',            icon:'🪵', era:'medieval',      type:'siege',    power:6,  cost:{gold:60,prod:40},  upkeep:{gold:2,food:2}, tech:'siege_t' },
    { id:'trebuchet',    name:'Trébuchets',         icon:'🏗️', era:'medieval',      type:'siege',    power:12, cost:{gold:100,prod:60}, upkeep:{gold:3,food:2}, tech:'siege_t' },
    { id:'cogge',        name:'Cogges',             icon:'🚢', era:'medieval',      type:'naval',    power:10, cost:{gold:80,prod:50},  upkeep:{gold:3,food:3}, tech:'navigation' },

    // ── RENAISSANCE ──
    { id:'mousquetaire', name:'Mousquetaires',      icon:'🔫', era:'renaissance',   type:'ranged',   power:14, cost:{gold:60,food:15},  upkeep:{gold:3,food:3}, tech:'poudre' },
    { id:'piquier',      name:'Piquiers',           icon:'🔱', era:'renaissance',   type:'melee',    power:10, cost:{gold:40,food:12},  upkeep:{gold:2,food:2}, tech:'tactique' },
    { id:'canon',        name:'Canons',             icon:'💥', era:'renaissance',   type:'siege',    power:20, cost:{gold:120,prod:50}, upkeep:{gold:5,food:2}, tech:'poudre' },
    { id:'corsaire',     name:'Corsaires',          icon:'🏴‍☠️', era:'renaissance',   type:'naval',    power:15, cost:{gold:100,prod:60}, upkeep:{gold:4,food:3}, tech:'navigation_avancee' },
    { id:'hussard',      name:'Hussards',           icon:'🐎', era:'renaissance',   type:'cavalry',  power:13, cost:{gold:70,food:20},  upkeep:{gold:3,food:4}, tech:'tactique' },
    { id:'grenadier',    name:'Grenadiers',         icon:'💣', era:'renaissance',   type:'melee',    power:16, cost:{gold:70,food:15},  upkeep:{gold:3,food:3}, tech:'poudre' },

    // ── INDUSTRIELLE ──
    { id:'infanterie',   name:'Infanterie de Ligne',icon:'🎖️', era:'industrielle',  type:'ranged',   power:18, cost:{gold:80,food:20},  upkeep:{gold:4,food:4}, tech:'artillerie' },
    { id:'artillerie_u', name:'Batterie d\'Artillerie',icon:'🎯',era:'industrielle', type:'siege',    power:30, cost:{gold:150,prod:80}, upkeep:{gold:6,food:3}, tech:'artillerie' },
    { id:'cavalerie_l',  name:'Dragons',            icon:'🐴', era:'industrielle',  type:'cavalry',  power:20, cost:{gold:100,food:25}, upkeep:{gold:5,food:5}, tech:'acier' },
    { id:'cuirasse',     name:'Cuirassé',           icon:'🚢', era:'industrielle',  type:'naval',    power:35, cost:{gold:250,prod:150},upkeep:{gold:8,food:4}, tech:'acier' },
    { id:'tirailleur',   name:'Tirailleurs',        icon:'🎯', era:'industrielle',  type:'ranged',   power:15, cost:{gold:60,food:15},  upkeep:{gold:3,food:3}, tech:'explosifs' },
    { id:'sapeur',       name:'Sapeurs',            icon:'💣', era:'industrielle',  type:'special',  power:12, cost:{gold:70,prod:40},  upkeep:{gold:3,food:2}, tech:'explosifs' },

    // ── MODERNE ──
    { id:'char',         name:'Chars d\'Assaut',    icon:'🛡️', era:'moderne',       type:'cavalry',  power:50, cost:{gold:300,prod:150},upkeep:{gold:10,food:5}, tech:'blindes' },
    { id:'avion_chasse', name:'Chasseurs',          icon:'✈️', era:'moderne',       type:'air',      power:45, cost:{gold:350,prod:180},upkeep:{gold:12,food:3}, tech:'aviation' },
    { id:'bombardier',   name:'Bombardiers',        icon:'💣', era:'moderne',       type:'air',      power:55, cost:{gold:400,prod:200},upkeep:{gold:14,food:3}, tech:'aviation' },
    { id:'sous_marin',   name:'Sous-Marins',        icon:'🐟', era:'moderne',       type:'naval',    power:40, cost:{gold:300,prod:200},upkeep:{gold:10,food:4}, tech:'radar' },
    { id:'parachutiste', name:'Parachutistes',      icon:'🪂', era:'moderne',       type:'special',  power:30, cost:{gold:200,food:30}, upkeep:{gold:8,food:5}, tech:'aviation' },
    { id:'marine',       name:'Marines',            icon:'⚓', era:'moderne',       type:'special',  power:35, cost:{gold:250,food:30}, upkeep:{gold:8,food:5}, tech:'radar' },
    { id:'porte_avions', name:'Porte-Avions',       icon:'🚢', era:'moderne',       type:'naval',    power:70, cost:{gold:600,prod:350},upkeep:{gold:20,food:8}, tech:'radar' },

    // ── CONTEMPORAINE ──
    { id:'drone',        name:'Drones de Combat',   icon:'🤖', era:'contemporaine', type:'air',      power:55, cost:{gold:400,prod:200},upkeep:{gold:8,food:0}, tech:'informatique' },
    { id:'missile',      name:'Missiles Balistiques',icon:'🚀',era:'contemporaine', type:'siege',    power:80, cost:{gold:500,prod:300},upkeep:{gold:15,food:0}, tech:'fusion_t' },
    { id:'forces_spec',  name:'Forces Spéciales',   icon:'🎯', era:'contemporaine', type:'special',  power:50, cost:{gold:300,food:20}, upkeep:{gold:10,food:3}, tech:'informatique' },
    { id:'cyber_unite',  name:'Unité Cyber',        icon:'💻', era:'contemporaine', type:'special',  power:40, cost:{gold:350,prod:150},upkeep:{gold:8,food:0}, tech:'ia' },
    { id:'stealth',      name:'Chasseur Furtif',    icon:'🦅', era:'contemporaine', type:'air',      power:70, cost:{gold:600,prod:300},upkeep:{gold:15,food:2}, tech:'ia' },
    { id:'railgun',      name:'Railgun Naval',      icon:'⚡', era:'contemporaine', type:'naval',    power:90, cost:{gold:800,prod:400},upkeep:{gold:20,food:3}, tech:'quantique' },
    { id:'mecha',        name:'Exosquelette',       icon:'🦾', era:'contemporaine', type:'melee',    power:65, cost:{gold:500,prod:250},upkeep:{gold:12,food:2}, tech:'nanotechnologie' },
    // Renforts militaires contemporains accessibles via les technologies existantes.
    { id:"infanterie_mecanisee", name:"Infanterie mécanisée", icon:"🚙", era:'contemporaine', type:"special", power:42, cost:{gold:270,prod:140}, upkeep:{gold:8,food:4}, tech:"blindes" },
    { id:"vci_moderne", name:"Véhicules de combat d'infanterie", icon:"🚜", era:'contemporaine', type:"cavalry", power:49, cost:{gold:330,prod:180}, upkeep:{gold:11,food:3}, tech:"blindes" },
    { id:"artillerie_mobile", name:"Artillerie automotrice", icon:"💥", era:'contemporaine', type:"siege", power:64, cost:{gold:425,prod:245}, upkeep:{gold:13,food:3}, tech:"artillerie" },
    { id:"dca_mobile", name:"Défense antiaérienne mobile", icon:"🛡️", era:'contemporaine', type:"special", power:47, cost:{gold:340,prod:190}, upkeep:{gold:10,food:3}, tech:"radar" },
    { id:"helicoptere_attaque", name:"Hélicoptères d'attaque", icon:"🚁", era:'contemporaine', type:"air", power:57, cost:{gold:410,prod:220}, upkeep:{gold:13,food:3}, tech:"aviation" },
    { id:"transport_logistique", name:"Convois logistiques", icon:"🚚", era:'contemporaine', type:"special", power:20, cost:{gold:160,prod:110}, upkeep:{gold:4,food:2}, tech:"blindes" },
    { id:"drone_recon", name:"Drones de reconnaissance", icon:"📡", era:'contemporaine', type:"air", power:26, cost:{gold:230,prod:115}, upkeep:{gold:5,food:0}, tech:"informatique" },
    { id:"lance_roquettes", name:"Lance-roquettes multiples", icon:"🚀", era:'contemporaine', type:"siege", power:72, cost:{gold:460,prod:280}, upkeep:{gold:15,food:2}, tech:"fusion_t" },
    { id:"frégate_moderne", name:"Frégates modernes", icon:"🚢", era:'contemporaine', type:"naval", power:58, cost:{gold:460,prod:270}, upkeep:{gold:13,food:4}, tech:"radar" },
    { id:"commando_moderne", name:"Commandos modernes", icon:"🎖️", era:'contemporaine', type:"special", power:52, cost:{gold:340,prod:180}, upkeep:{gold:10,food:4}, tech:"informatique" }
];

// ============================
//  DONNÉES — NATIONS IA
// ============================
var AI_NATIONS = [
    { id:'empire_soleil',  name:'Empire du Soleil Levant', ruler:'Empereur Akira',   personality:'aggressive',   polity:'empire',   dynasty:'Maison Hoshida', color:'#dc2626' },
    { id:'royaume_nord',   name:'Royaume du Nord',        ruler:'Roi Bjorn',         personality:'militarist',   polity:'royaume',  dynasty:'Clan Bjornson', color:'#3b82f6' },
    { id:'federation_sud', name:'Fédération du Sud',      ruler:'Consul Marcus',     personality:'diplomatic',   polity:'federation',dynasty:'Maison Civique', color:'#16a34a' },
    { id:'union_ouest',    name:'Union de l\'Ouest',      ruler:'Reine Isabelle',    personality:'economic',     polity:'royaume',  dynasty:'Maison Valen', color:'#f59e0b' },
    { id:'confederation',  name:'Confédération Orientale',ruler:'Khan Temüjin',      personality:'expansionist', polity:'tribu',    dynasty:'Lignee Temujin', color:'#8b5cf6' },
    { id:'republique_iles',name:'République des Îles',    ruler:'Doge Enrico',       personality:'economic',     polity:'republique',dynasty:'Maison Marchande', color:'#06b6d4' },
    { id:'empire_desert',  name:'Empire du Désert',       ruler:'Sultan Harun',      personality:'diplomatic',   polity:'sultanat', dynasty:'Maison Harun', color:'#d97706' }
];

var POLICIES = [
    { id:'taxes',       name:'Taux d\'Imposition', min:0, max:100, default:30, effectDesc:'Or ↑ / Bonheur ↓' },
    { id:'conscription',name:'Conscription',        min:0, max:100, default:20, effectDesc:'Armée ↑ / Prod & Bonheur ↓' },
    { id:'education_p', name:'Budget Éducation',    min:0, max:100, default:30, effectDesc:'Science ↑ / Or ↓' },
    { id:'liberte',     name:'Liberté Civile',      min:0, max:100, default:50, effectDesc:'Bonheur & Culture ↑ / Stabilité ↓' },
    { id:'religion',    name:'Influence Religieuse', min:0, max:100, default:40, effectDesc:'Stabilité ↑ / Science ↓' },
    { id:'sante', name:'Budget Santé', min:0, max:100, default:25, effectDesc:'Bonheur & population ↑ / Or ↓' },
    { id:'infrastructure_p', name:'Investissement Public', min:0, max:100, default:30, effectDesc:'Production ↑ / Or ↓' },
    { id:'securite_p', name:'Sécurité Intérieure', min:0, max:100, default:35, effectDesc:'Stabilité ↑ / Or & liberté ↓' }
];

var DECREES = [
    { id:'fete_nationale',  name:'Fête Nationale',       cost:{gold:50},  effect:{happiness:10,stability:5}, duration:3 },
    { id:'mobilisation',    name:'Mobilisation Générale', cost:{gold:80},  effect:{militaryPower:20,happiness:-10,prodRate:-5}, duration:5 },
    { id:'reforme_agraire', name:'Réforme Agraire',      cost:{gold:100}, effect:{foodRate:8,happiness:5}, duration:10 },
    { id:'censure',         name:'Censure',              cost:{gold:40},  effect:{stability:10,happiness:-8,cultureRate:-5}, duration:5 },
    { id:'grand_projet',    name:'Grand Projet National', cost:{gold:200,prod:100}, effect:{prestige:15,prodRate:-8}, duration:8 },
    { id:'espionnage',      name:'Réseau d\'Espionnage',  cost:{gold:120}, effect:{stability:5,scienceRate:5}, duration:10 },
    { id:'libre_echange',   name:'Libre-Échange',        cost:{gold:60},  effect:{goldRate:12,prodRate:-3}, duration:10 },
    { id:'austerite',       name:'Plan d\'Austérité',    cost:{gold:0},   effect:{goldRate:15,happiness:-12}, duration:8 }
];

var EVENTS = [
    { id:'famine', title:'Famine', icon:'🌾', desc:'Une terrible famine frappe votre nation !',
      condition:function(s){return s.resources.food<30&&Math.random()<0.3;},
      choices:[
        {text:'Rationner',effect:'Nourriture -20, Stabilité -5',apply:function(s){s.resources.food-=20;s.stability-=5;}},
        {text:'Importer (coûteux)',effect:'Or -80, +30 Nourr.',apply:function(s){s.resources.gold-=80;s.resources.food+=30;}},
        {text:'Ignorer',effect:'Pop -5%, Bonheur -15',apply:function(s){s.population=Math.floor(s.population*0.95);s.happiness-=15;}}
    ]},
    { id:'decouverte', title:'Découverte Scientifique', icon:'🔬', desc:'Vos chercheurs ont fait une percée !',
      condition:function(s){return s.rates.science>5&&Math.random()<0.15;},
      choices:[
        {text:'Investir',effect:'Science +50, Or -40',apply:function(s){s.resources.science+=50;s.resources.gold-=40;}},
        {text:'Publier',effect:'Science +20, Prestige +5',apply:function(s){s.resources.science+=20;s.prestige+=5;}}
    ]},
    { id:'rebellion', title:'Rébellion Populaire', icon:'🔥', desc:'Le peuple gronde ! Des émeutes éclatent.',
      condition:function(s){return s.happiness<30&&Math.random()<0.35;},
      choices:[
        {text:'Réprimer',effect:'Stab +10, Bonheur -10',apply:function(s){s.stability+=10;s.happiness-=10;}},
        {text:'Négocier',effect:'Or -60, Bonheur +15',apply:function(s){s.resources.gold-=60;s.happiness+=15;}},
        {text:'Concessions',effect:'Bonheur +20, Or -100',apply:function(s){s.happiness+=20;s.resources.gold-=100;}}
    ]},
    { id:'epidemie', title:'Épidémie', icon:'🦠', desc:'Une maladie se répand !',
      condition:function(s){return s.population>500&&Math.random()<0.08;},
      choices:[
        {text:'Quarantaine',effect:'Pop -3%, Stab +5',apply:function(s){s.population=Math.floor(s.population*0.97);s.stability+=5;}},
        {text:'Remède (cher)',effect:'Or -100, Science +30',apply:function(s){s.resources.gold-=100;s.resources.science+=30;}}
    ]},
    { id:'age_or', title:'Âge d\'Or', icon:'✨', desc:'Prospérité partout !',
      condition:function(s){return s.happiness>75&&s.stability>70&&Math.random()<0.12;},
      choices:[
        {text:'Culture',effect:'Culture +50, Prestige +10',apply:function(s){s.resources.culture+=50;s.prestige+=10;}},
        {text:'Économie',effect:'Or +100, Prod +30',apply:function(s){s.resources.gold+=100;s.resources.prod+=30;}}
    ]},
    { id:'tresor', title:'Trésor Découvert', icon:'💎', desc:'Un trésor enfoui trouvé !',
      condition:function(s){return Math.random()<0.07;},
      choices:[
        {text:'Enrichir le trésor',effect:'Or +150',apply:function(s){s.resources.gold+=150;}},
        {text:'Distribuer',effect:'Or +50, Bonheur +15',apply:function(s){s.resources.gold+=50;s.happiness+=15;}}
    ]},
    { id:'commerce', title:'Caravane Marchande', icon:'🐫', desc:'Des marchands proposent un accord.',
      condition:function(s){return s.resources.gold>50&&Math.random()<0.1;},
      choices:[
        {text:'Accepter',effect:'Or -50, +8 Or/tour 5 tours',apply:function(s){s.resources.gold-=50;s.tempBonuses.push({stat:'goldRate',value:8,turns:5});}},
        {text:'Décliner',effect:'Rien',apply:function(s){}}
    ]},
    { id:'catastrophe', title:'Catastrophe Naturelle', icon:'🌊', desc:'Séisme dévastateur !',
      condition:function(s){return Math.random()<0.05;},
      choices:[
        {text:'Reconstruire',effect:'Or -120, Stab +5',apply:function(s){s.resources.gold-=120;s.stability+=5;}},
        {text:'Aide internationale',effect:'Prestige -5, Or +50',apply:function(s){s.prestige-=5;s.resources.gold+=50;}}
    ]},
    { id:'immigrants', title:'Vague d\'Immigrants', icon:'👥', desc:'Des réfugiés cherchent asile.',
      condition:function(s){return s.stability>50&&Math.random()<0.08;},
      choices:[
        {text:'Accueillir',effect:'Pop +10%, Bonheur -5',apply:function(s){s.population=Math.floor(s.population*1.1);s.happiness-=5;}},
        {text:'Refuser',effect:'Prestige -3',apply:function(s){s.prestige-=3;}}
    ]},
    { id:'espion', title:'Espion Capturé', icon:'🕵️', desc:'Un espion étranger a été capturé !',
      condition:function(s){return s.turn>10&&Math.random()<0.08;},
      choices:[
        {text:'Exécuter',effect:'Stab +5, Diplo -10',apply:function(s){s.stability+=5;}},
        {text:'Échanger',effect:'Or +60, Science +20',apply:function(s){s.resources.gold+=60;s.resources.science+=20;}},
        {text:'Recruter',effect:'Science +40, Stab -5',apply:function(s){s.resources.science+=40;s.stability-=5;}}
    ]},
    { id:'merveille', title:'Merveille Découverte', icon:'🏛️', desc:'Des ruines anciennes aux portes de votre cité !',
      condition:function(s){return Math.random()<0.04;},
      choices:[
        {text:'Fouiller',effect:'Culture +80, Prestige +8',apply:function(s){s.resources.culture+=80;s.prestige+=8;}},
        {text:'Piller',effect:'Or +200',apply:function(s){s.resources.gold+=200;}}
    ]},
    { id:'heretiques', title:'Hérésie', icon:'⛪', desc:'Un mouvement religieux dissident émerge.',
      condition:function(s){return s.policies.religion>60&&Math.random()<0.1;},
      choices:[
        {text:'Tolérer',effect:'Bonheur +8, Stab -8',apply:function(s){s.happiness+=8;s.stability-=8;}},
        {text:'Persécuter',effect:'Stab +10, Bonheur -12',apply:function(s){s.stability+=10;s.happiness-=12;}}
    ]},
    { id:'genie_militaire', title:'Génie Militaire', icon:'⚔️', desc:'Un stratège brillant propose ses services.',
      condition:function(s){return s.militaryPower>20&&Math.random()<0.07;},
      choices:[
        {text:'Engager',effect:'Or -80, Force +25',apply:function(s){s.resources.gold-=80;s.militaryPower+=25;}},
        {text:'Décliner',effect:'Rien',apply:function(s){}}
    ]}
];


// ============================
//  ÉTAT DU JEU
// ============================
function _cp1252Byte(code) {
    if (code <= 0xFF) return code;
    var map = {
        0x20AC:0x80, 0x201A:0x82, 0x0192:0x83, 0x201E:0x84, 0x2026:0x85, 0x2020:0x86, 0x2021:0x87,
        0x02C6:0x88, 0x2030:0x89, 0x0160:0x8A, 0x2039:0x8B, 0x0152:0x8C, 0x017D:0x8E,
        0x2018:0x91, 0x2019:0x92, 0x201C:0x93, 0x201D:0x94, 0x2022:0x95, 0x2013:0x96, 0x2014:0x97,
        0x02DC:0x98, 0x2122:0x99, 0x0161:0x9A, 0x203A:0x9B, 0x0153:0x9C, 0x017E:0x9E, 0x0178:0x9F
    };
    return map[code] !== undefined ? map[code] : 63;
}

function _decodeLatin1Utf8(str) {
    try {
        if (typeof TextDecoder !== 'undefined') {
            var bytes = new Uint8Array(str.length);
            for (var i = 0; i < str.length; i++) bytes[i] = _cp1252Byte(str.charCodeAt(i));
            return new TextDecoder('utf-8').decode(bytes);
        }
    } catch (e) {}
    try { return decodeURIComponent(escape(str)); } catch (e2) {}
    return str;
}

function _mojibakeScore(str) {
    var m = str.match(/[ÃÂâðÅ]/g);
    var r = str.match(/\uFFFD/g);
    return (m ? m.length : 0) + (r ? r.length : 0);
}

function decodeMojibakeText(value) {
    if (typeof value !== 'string' || value.length === 0) return value;
    var current = value;
    for (var i = 0; i < 3; i++) {
        var decoded = _decodeLatin1Utf8(current);
        if (!decoded || decoded === current) break;
        if (_mojibakeScore(decoded) <= _mojibakeScore(current)) current = decoded;
        else break;
    }
    return current;
}

function decodeMojibakeDeep(node, seen) {
    if (!node || typeof node !== 'object') return;
    if (!seen) seen = [];
    if (seen.indexOf(node) !== -1) return;
    seen.push(node);

    if (Array.isArray(node)) {
        for (var i = 0; i < node.length; i++) {
            if (typeof node[i] === 'string') node[i] = decodeMojibakeText(node[i]);
            else decodeMojibakeDeep(node[i], seen);
        }
        return;
    }

    for (var k in node) {
        if (!Object.prototype.hasOwnProperty.call(node, k)) continue;
        if (typeof node[k] === 'string') node[k] = decodeMojibakeText(node[k]);
        else decodeMojibakeDeep(node[k], seen);
    }
}

function humanizeId(id) {
    if (!id) return '';
    return String(id)
        .replace(/_/g, ' ')
        .replace(/\b\w/g, function(m){ return m.toUpperCase(); });
}

function safeLabel(text, fallback) {
    var value = decodeMojibakeText((text === undefined || text === null) ? '' : String(text)).trim();
    if (!value) return fallback || '';
    if (/[\uFFFD]/.test(value)) return fallback || '';
    if (/[ÃÂâð]/.test(value) && fallback) return fallback;
    if (fallback && (/(\?\?+)/.test(value) || /[A-Za-z]\?[A-Za-z]/.test(value))) return fallback;
    return value;
}

function safeIcon(icon, fallback) {
    var value = decodeMojibakeText((icon === undefined || icon === null) ? '' : String(icon)).trim();
    if (!value) return fallback || '&#9679;';
    if (/[\uFFFD]/.test(value) || /[ÃÂâð]/.test(value) || /\?/.test(value)) return fallback || '●';
    if (/^[A-Za-z0-9 _.,:;!?()[\]{}<>\-+='"`~\\|/]+$/.test(value)) return fallback || '&#9679;';
    return value;
}

var UI_ICONS = {
    building: '&#x1F3D7;&#xFE0F;',
    science: '&#x1F52C;',
    unit: '&#x2694;&#xFE0F;',
    gold: '&#x1F4B0;',
    food: '&#x1F33E;',
    prod: '&#x2692;&#xFE0F;',
    lock: '&#x1F512;',
    arrow: '&#x2192;'
};

var MEMORIOPOLIS_LEVELS = [
    { level:0, id:'none',      name:'Frontiere',  minScore:0,  minEra:0, bonuses:{ gold:0, food:0, prod:0, science:0, culture:0, defense:0, militaryPower:0 }, color:'rgba(148,163,184,0.35)' },
    { level:1, id:'hamlet',    name:'Hameau',     minScore:2,  minEra:0, bonuses:{ gold:1, food:1, prod:1, science:0, culture:0, defense:1, militaryPower:0 }, color:'rgba(148,163,184,0.55)' },
    { level:2, id:'borough',   name:'Bourg',      minScore:5,  minEra:1, bonuses:{ gold:2, food:1, prod:2, science:1, culture:1, defense:2, militaryPower:1 }, color:'rgba(59,130,246,0.65)' },
    { level:3, id:'city',      name:'Cite',       minScore:8,  minEra:2, bonuses:{ gold:3, food:2, prod:3, science:2, culture:2, defense:3, militaryPower:2 }, color:'rgba(168,85,247,0.68)' },
    { level:4, id:'metropolis',name:'Metropole',  minScore:12, minEra:3, bonuses:{ gold:5, food:3, prod:4, science:3, culture:3, defense:5, militaryPower:4 }, color:'rgba(245,158,11,0.7)' }
];

var ART_PROJECTS = [
    { id:'fresque_epique', era:'antiquite', name:'Fresque Epique', cost:{gold:60,prod:35,culture:20}, reward:{prestige:2,happiness:2,masterpieces:1,tempCulture:1,tempTurns:8}, desc:'Scene historique dans la capitale.' },
    { id:'festival_saisonnier', era:'antiquite', name:'Festival Saisonnier', cost:{gold:45,food:30,culture:18}, reward:{prestige:1,happiness:4,festivals:1,tempCulture:1,tempTurns:6}, desc:'Fete populaire et cohesion sociale.' },
    { id:'theatre_royal', era:'medieval', name:'Theatre Royal', cost:{gold:120,prod:80,culture:40}, reward:{prestige:4,happiness:3,masterpieces:1,heritage:1,tempCulture:2,tempTurns:10}, desc:'Compagnies d arts et propagande douce.' },
    { id:'academie_des_arts', era:'renaissance', name:'Academie des Arts', cost:{gold:180,prod:120,culture:70}, reward:{prestige:6,masterpieces:2,heritage:1,tempCulture:3,tempTurns:12}, desc:'Peinture, sculpture et architecture d Etat.' },
    { id:'musee_national', era:'industrielle', name:'Musee National', cost:{gold:280,prod:170,culture:110}, reward:{prestige:8,happiness:2,masterpieces:2,heritage:2,tempCulture:4,tempTurns:14}, desc:'Patrimoine unifie et tourismes culturels.' },
    { id:'exposition_universelle', era:'moderne', name:'Exposition Universelle', cost:{gold:380,prod:220,culture:160}, reward:{prestige:10,happiness:3,festivals:2,heritage:2,tempCulture:5,tempTurns:12,tempGold:2}, desc:'Rayonnement international et innovation.' },
    { id:'biennale_numerique', era:'contemporaine', name:'Biennale Numerique', cost:{gold:520,prod:260,science:120,culture:220}, reward:{prestige:14,happiness:4,masterpieces:3,heritage:2,tempCulture:7,tempTurns:14,tempScience:2}, desc:'Art numerique, diplomatie culturelle globale.' }
];

decodeMojibakeDeep(ERAS);
decodeMojibakeDeep(GOVERNMENTS);
decodeMojibakeDeep(BUILDINGS);
decodeMojibakeDeep(TECHNOLOGIES);
decodeMojibakeDeep(UNITS);
decodeMojibakeDeep(AI_NATIONS);
decodeMojibakeDeep(POLICIES);
decodeMojibakeDeep(DECREES);
decodeMojibakeDeep(EVENTS);
decodeMojibakeDeep(ART_PROJECTS);

var state = null;

function createDefaultState(nName, rName, gov, diff) {
    var dm = {facile:{r:1.3,a:0.7,e:0.7}, normal:{r:1.0,a:1.0,e:1.0}, difficile:{r:0.8,a:1.3,e:1.2}, brutal:{r:0.6,a:1.6,e:1.4}}[diff]||{r:1,a:1,e:1};
    return {
        nationName:nName||'Empire Inconnu', rulerName:rName||'Le Souverain', government:gov||'monarchie',
        difficulty:diff||'normal', dm:dm, turn:1, eraIndex:0, year:-4000,
        population:100, popGrowthBase:0.03, happiness:60, stability:70, prestige:0, territory:1, militaryPower:10, militaryLevel:1, defense:5,
        resources:{gold:Math.floor(100*dm.r),food:Math.floor(80*dm.r),prod:Math.floor(50*dm.r),science:0,culture:0},
        rates:{gold:5,food:3,prod:2,science:1,culture:1},
        buildings:{}, techs:[], currentResearch:null, army:{},
        policies:{taxes:30,conscription:20,education_p:30,liberte:50,religion:40,sante:25,infrastructure_p:30,securite_p:35},
        activeDecrees:[], tempBonuses:[],
        eventControl:{nextAllowedTurn:1,lastEventTurn:0},
        diplomacy:{},
        cultureState:{
            masterpieces:0,
            festivals:0,
            heritage:0,
            softPower:0,
            lastFestivalTurn:0,
            projectsDone:{},
            poets:1,
            artists:1,
            artProgress:0,
            works:[]
        },
        socialClasses:{paysans:{pct:60,happiness:50},artisans:{pct:20,happiness:55},marchands:{pct:10,happiness:60},nobles:{pct:8,happiness:70},clerge:{pct:2,happiness:65}},
        mapData:null, // Will be generated
        realtime:{enabled:false,speedIndex:0,version:2},
        memoriapolis:{enabled:true,growthLast:0,lastTurn:0}
    };
}


// ============================
//  CARTE 2D — Génération et Rendu
// ============================
var WorldMap = {
    COLS: 40,
    ROWS: 30,
    TILE: 28,
    offsetX: 0,
    offsetY: 0,
    zoom: 1,
    canvas: null,
    ctx: null,
    hoveredTile: null,
    selectedTile: null,
    dragging: false,
    dragStart: {x:0,y:0},
    touchMode: 'none',
    touchMoved: false,
    touchStartPos: null,
    lastTouchPos: null,
    pinchStartDist: 0,
    pinchStartZoom: 1,
    lastTouchTapTs: 0,
    _listenersBound: false,
    _textSanitized: false,

    TERRAIN: {
        ocean:   { color:'#1a3a4a', name:'Océan',    food:0, prod:0, gold:1, movable:false },
        coast:   { color:'#5a9aad', name:'Côte',     food:2, prod:0, gold:2, movable:true },
        plain:   { color:'#4a7c59', name:'Plaine',   food:3, prod:1, gold:1, movable:true },
        forest:  { color:'#2d5a27', name:'Forêt',    food:1, prod:3, gold:1, movable:true },
        mountain:{ color:'#8a8580', name:'Montagne', food:0, prod:4, gold:2, movable:true },
        desert:  { color:'#d4a843', name:'Désert',   food:0, prod:1, gold:3, movable:true },
        tundra:  { color:'#7a6a8a', name:'Toundra',  food:1, prod:1, gold:0, movable:true },
        swamp:   { color:'#3a6a3a', name:'Marais',   food:2, prod:1, gold:0, movable:true }
    },

    RESOURCES: [
        { id:'ble',   icon:'🌾', name:'Blé',       bonus:{food:2}, terrain:['plain'] },
        { id:'fer',   icon:'⛏️', name:'Fer',       bonus:{prod:2}, terrain:['mountain','forest'] },
        { id:'or_r',  icon:'💰', name:'Or',        bonus:{gold:3}, terrain:['mountain','desert'] },
        { id:'bois',  icon:'🪵', name:'Bois',      bonus:{prod:2}, terrain:['forest'] },
        { id:'pierre',icon:'🪨', name:'Pierre',    bonus:{prod:2}, terrain:['mountain','plain'] },
        { id:'poisson',icon:'🐟',name:'Poisson',   bonus:{food:3}, terrain:['coast'] },
        { id:'chevaux',icon:'🐴',name:'Chevaux',   bonus:{militaryPower:3}, terrain:['plain'] },
        { id:'encens', icon:'🕯️', name:'Encens',    bonus:{culture:2,gold:1}, terrain:['desert'] },
        { id:'epices', icon:'🌶️', name:'Épices',    bonus:{gold:2,food:1}, terrain:['forest','swamp'] },
        { id:'marbre', icon:'🏛️', name:'Marbre',    bonus:{culture:2,prod:1}, terrain:['mountain','plain'] },
        { id:'sel',    icon:'🧂', name:'Sel',       bonus:{gold:2,food:1}, terrain:['coast','desert'] },
        { id:'petrole',icon:'🛢️', name:'Pétrole',   bonus:{prod:4,gold:3}, terrain:['desert','plain','coast'], minEra:3 }
    ],

    generate: function() {
        var map = [];
        var noise = this._generateNoise();
        for (var r = 0; r < this.ROWS; r++) {
            map[r] = [];
            for (var c = 0; c < this.COLS; c++) {
                var v = noise[r][c];
                var terrain;
                if (v < 0.25) terrain = 'ocean';
                else if (v < 0.32) terrain = 'coast';
                else if (v < 0.55) terrain = 'plain';
                else if (v < 0.7) terrain = 'forest';
                else if (v < 0.8) terrain = 'mountain';
                else if (v < 0.88) terrain = 'desert';
                else if (v < 0.94) terrain = 'tundra';
                else terrain = 'swamp';

                var resource = null;
                if (terrain !== 'ocean' && Math.random() < 0.15) {
                    var possible = this.RESOURCES.filter(function(res) {
                        if (res.minEra && state.eraIndex < res.minEra) return false;
                        return res.terrain.indexOf(terrain) !== -1;
                    });
                    if (possible.length > 0) resource = possible[Math.floor(Math.random() * possible.length)];
                }

                map[r][c] = {
                    terrain: terrain,
                    resource: resource,
                    owner: null, // null, 'player', or AI nation id
                    city: null,  // null or city name
                    building: null,
                    buildings: {},
                    districtLevel: 0
                };
            }
        }

        // Place player capital near center
        var cx = Math.floor(this.COLS / 2);
        var cy = Math.floor(this.ROWS / 2);
        // Find nearest land
        for (var dr = 0; dr < 5; dr++) {
            for (var dc = -dr; dc <= dr; dc++) {
                var tr = cy + dr; var tc = cx + dc;
                if (tr >= 0 && tr < this.ROWS && tc >= 0 && tc < this.COLS) {
                    if (map[tr][tc].terrain !== 'ocean') {
                        map[tr][tc].owner = 'player';
                        map[tr][tc].city = state.nationName;
                        map[tr][tc].terrain = 'plain';
                        map[tr][tc].districtLevel = 2;
                        // Claim surrounding
                        for (var ar = -1; ar <= 1; ar++) {
                            for (var ac = -1; ac <= 1; ac++) {
                                var nr = tr+ar; var nc = tc+ac;
                                if (nr>=0&&nr<this.ROWS&&nc>=0&&nc<this.COLS&&map[nr][nc].terrain!=='ocean') {
                                    map[nr][nc].owner = 'player';
                                    if (!map[nr][nc].districtLevel) map[nr][nc].districtLevel = 1;
                                }
                            }
                        }
                        dr = 999; break;
                    }
                }
            }
        }

        // Place AI capitals
        var positions = [
            {r:4,c:6}, {r:5,c:32}, {r:24,c:8}, {r:22,c:34}, {r:14,c:4}, {r:8,c:25}, {r:25,c:20}
        ];
        AI_NATIONS.forEach(function(n, i) {
            var pos = positions[i % positions.length];
            var pr = Math.min(WorldMap.ROWS-1, pos.r);
            var pc = Math.min(WorldMap.COLS-1, pos.c);
            if (map[pr][pc].terrain === 'ocean') map[pr][pc].terrain = 'plain';
            map[pr][pc].owner = n.id;
            map[pr][pc].city = n.name;
            map[pr][pc].districtLevel = 2;
            for (var ar=-1;ar<=1;ar++) for(var ac=-1;ac<=1;ac++) {
                var nr=pr+ar,nc=pc+ac;
                if(nr>=0&&nr<WorldMap.ROWS&&nc>=0&&nc<WorldMap.COLS&&map[nr][nc].terrain!=='ocean') {
                    map[nr][nc].owner=n.id;
                    if (!map[nr][nc].districtLevel) map[nr][nc].districtLevel = 1;
                }
            }
        });

        state.mapData = map;
    },

    _generateNoise: function() {
        var grid = [];
        // Simple diamond-square-like with smoothing
        for (var r = 0; r < this.ROWS; r++) {
            grid[r] = [];
            for (var c = 0; c < this.COLS; c++) {
                grid[r][c] = Math.random();
            }
        }
        // Smooth 3 passes
        for (var pass = 0; pass < 3; pass++) {
            var ng = [];
            for (var r2 = 0; r2 < this.ROWS; r2++) {
                ng[r2] = [];
                for (var c2 = 0; c2 < this.COLS; c2++) {
                    var sum = grid[r2][c2];
                    var count = 1;
                    for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) {
                        if (dr===0&&dc===0) continue;
                        var nr=r2+dr, nc=c2+dc;
                        if (nr>=0&&nr<this.ROWS&&nc>=0&&nc<this.COLS) { sum+=grid[nr][nc]; count++; }
                    }
                    ng[r2][c2] = sum / count;
                }
            }
            grid = ng;
        }
        return grid;
    },

    init: function() {
        this.canvas = document.getElementById('map-canvas');
        if (!this.canvas) return;
        if (!this._textSanitized) {
            decodeMojibakeDeep(this.TERRAIN);
            decodeMojibakeDeep(this.RESOURCES);
            this._textSanitized = true;
        }
        this._ensureMapBuildingData();
        this.ctx = this.canvas.getContext('2d');
        this._resize();
        if (this._listenersBound) return;

        window.addEventListener('resize', function() { WorldMap._resize(); WorldMap.render(); });

        this.canvas.addEventListener('mousedown', function(e) {
            if (e.button !== 0) return;
            WorldMap.dragging = true;
            WorldMap.dragStart = {x:e.clientX-WorldMap.offsetX,y:e.clientY-WorldMap.offsetY};
        });
        this.canvas.addEventListener('mousemove', function(e) {
            if (WorldMap.dragging) {
                WorldMap.offsetX = e.clientX - WorldMap.dragStart.x;
                WorldMap.offsetY = e.clientY - WorldMap.dragStart.y;
                WorldMap.render();
            }
            WorldMap._updateHover(e);
        });
        this.canvas.addEventListener('mouseup', function() { WorldMap.dragging = false; });
        this.canvas.addEventListener('mouseleave', function() { WorldMap.dragging = false; });
        this.canvas.addEventListener('click', function(e) {
            if (Date.now() - WorldMap.lastTouchTapTs < 350) return;
            WorldMap._onClick(e);
        });
        this.canvas.addEventListener('wheel', function(e) {
            e.preventDefault();
            if (e.deltaY < 0) WorldMap.zoomIn();
            else WorldMap.zoomOut();
        });

        this.canvas.addEventListener('touchstart', function(e) {
            if (e.touches.length === 1) {
                var t = e.touches[0];
                WorldMap.touchMode = 'drag';
                WorldMap.touchMoved = false;
                WorldMap.touchStartPos = {x:t.clientX, y:t.clientY, time:Date.now()};
                WorldMap.lastTouchPos = {x:t.clientX, y:t.clientY};
                WorldMap.dragging = true;
                WorldMap.dragStart = {x:t.clientX-WorldMap.offsetX,y:t.clientY-WorldMap.offsetY};
            } else if (e.touches.length === 2) {
                e.preventDefault();
                WorldMap.dragging = false;
                WorldMap.touchMode = 'pinch';
                WorldMap.pinchStartDist = WorldMap._touchDistance(e.touches[0], e.touches[1]);
                WorldMap.pinchStartZoom = WorldMap.zoom;
            }
        }, {passive:false});

        this.canvas.addEventListener('touchmove', function(e) {
            if (WorldMap.touchMode === 'drag' && e.touches.length === 1) {
                e.preventDefault();
                var t = e.touches[0];
                var dx = t.clientX - WorldMap.lastTouchPos.x;
                var dy = t.clientY - WorldMap.lastTouchPos.y;
                if (Math.abs(dx) > 2 || Math.abs(dy) > 2) WorldMap.touchMoved = true;
                WorldMap.offsetX += dx;
                WorldMap.offsetY += dy;
                WorldMap.lastTouchPos = {x:t.clientX, y:t.clientY};
                WorldMap.render();
            } else if (e.touches.length === 2) {
                e.preventDefault();
                if (WorldMap.touchMode !== 'pinch') {
                    WorldMap.touchMode = 'pinch';
                    WorldMap.pinchStartDist = WorldMap._touchDistance(e.touches[0], e.touches[1]);
                    WorldMap.pinchStartZoom = WorldMap.zoom;
                }
                var dist = WorldMap._touchDistance(e.touches[0], e.touches[1]);
                if (WorldMap.pinchStartDist > 0) {
                    WorldMap.zoom = Math.max(0.4, Math.min(3, WorldMap.pinchStartZoom * (dist / WorldMap.pinchStartDist)));
                    WorldMap.render();
                }
            }
        }, {passive:false});

        this.canvas.addEventListener('touchend', function(e) {
            if (WorldMap.touchMode === 'drag' && !WorldMap.touchMoved && WorldMap.touchStartPos && e.changedTouches.length > 0) {
                var changed = e.changedTouches[0];
                var tx = Math.abs(changed.clientX - WorldMap.touchStartPos.x);
                var ty = Math.abs(changed.clientY - WorldMap.touchStartPos.y);
                if (tx < 10 && ty < 10) WorldMap._onTap(changed.clientX, changed.clientY);
            }

            if (e.touches.length === 0) {
                WorldMap.dragging = false;
                WorldMap.touchMode = 'none';
                WorldMap.touchStartPos = null;
                WorldMap.lastTouchPos = null;
            } else if (e.touches.length === 1) {
                var t = e.touches[0];
                WorldMap.touchMode = 'drag';
                WorldMap.dragging = true;
                WorldMap.touchMoved = false;
                WorldMap.touchStartPos = {x:t.clientX, y:t.clientY, time:Date.now()};
                WorldMap.lastTouchPos = {x:t.clientX, y:t.clientY};
                WorldMap.dragStart = {x:t.clientX-WorldMap.offsetX,y:t.clientY-WorldMap.offsetY};
            }
        }, {passive:false});

        this._listenersBound = true;
    },

    _resize: function() {
        if (!this.canvas) return;
        var parent = this.canvas.parentElement;
        this.canvas.width = parent.clientWidth;
        this.canvas.height = parent.clientHeight;
    },

    render: function() {
        if (!this.ctx || !state || !state.mapData) return;
        var ctx = this.ctx;
        var w = this.canvas.width;
        var h = this.canvas.height;
        var T = this.TILE * this.zoom;

        ctx.fillStyle = '#060a12';
        ctx.fillRect(0, 0, w, h);

        var map = state.mapData;
        for (var r = 0; r < this.ROWS; r++) {
            for (var c = 0; c < this.COLS; c++) {
                var x = c * T + this.offsetX;
                var y = r * T + this.offsetY;
                if (x + T < 0 || x > w || y + T < 0 || y > h) continue;

                var tile = map[r][c];
                var tdata = this.TERRAIN[tile.terrain];

                // Base terrain color
                ctx.fillStyle = tdata.color;
                ctx.fillRect(x, y, T-1, T-1);

                // Owner overlay
                if (tile.owner) {
                    if (tile.owner === 'player') {
                        ctx.fillStyle = 'rgba(212,168,71,0.25)';
                    } else {
                        var aiN = AI_NATIONS.find(function(n){return n.id===tile.owner;});
                        ctx.fillStyle = aiN ? (aiN.color + '40') : 'rgba(128,128,128,0.2)';
                    }
                    ctx.fillRect(x, y, T-1, T-1);
                }

                // Border for player territory
                if (tile.owner === 'player') {
                    ctx.strokeStyle = 'rgba(212,168,71,0.5)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(x+0.5, y+0.5, T-2, T-2);
                }

                // Hovered tile
                if (this.hoveredTile && this.hoveredTile.r === r && this.hoveredTile.c === c) {
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x+1, y+1, T-3, T-3);
                }

                // Selected tile
                if (this.selectedTile && this.selectedTile.r === r && this.selectedTile.c === c) {
                    ctx.strokeStyle = '#fbbf24';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x+1, y+1, T-3, T-3);
                }

                // Memoriapolis district marker
                this._ensureTileBuildingData(tile);
                if (tile.owner === 'player' && tile.districtLevel > 0 && T > 14) {
                    var dDef = (typeof Game !== 'undefined' && Game.getMemoLevelDef) ? Game.getMemoLevelDef(tile.districtLevel) : null;
                    var dColor = dDef ? dDef.color : 'rgba(148,163,184,0.6)';
                    var dx = x + T * 0.14;
                    var dy = y + T * 0.17;
                    var drd = Math.max(4, T * 0.1);
                    ctx.fillStyle = dColor;
                    ctx.beginPath();
                    ctx.arc(dx, dy, drd, 0, Math.PI * 2);
                    ctx.fill();
                    if (T > 22) {
                        ctx.fillStyle = '#f8fafc';
                        ctx.font = Math.floor(T * 0.16) + 'px sans-serif';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(String(tile.districtLevel), dx, dy + 0.4);
                        ctx.textAlign = 'left';
                        ctx.textBaseline = 'alphabetic';
                    }
                }

                // Resource icon
                if (tile.resource && T > 16) {
                    ctx.font = Math.floor(T * 0.4) + 'px serif';
                    ctx.fillText(safeIcon(tile.resource.icon, '•'), x + 1, y + T - 3);
                }

                // City marker
                if (tile.city && T > 14) {
                    ctx.font = Math.floor(T * 0.45) + 'px serif';
                    ctx.fillText('C', x + T * 0.35, y + T * 0.6);
                }

                if (tile.building && T > 14) {
                    var bDef = BUILDINGS.find(function(b){ return b.id === tile.building; });
                    var bIcon = bDef ? safeIcon(bDef.icon, 'B') : 'B';
                    ctx.font = Math.floor(T * 0.36) + 'px serif';
                    ctx.fillText(bIcon, x + T * 0.04, y + T * 0.42);

                    var bCount = this._tileBuildingCount(tile);
                    if (bCount > 1 && T > 20) {
                        var bx = x + T - Math.max(12, T * 0.28);
                        var by = y + Math.max(10, T * 0.24);
                        var br = Math.max(6, T * 0.13);
                        ctx.fillStyle = 'rgba(0,0,0,0.75)';
                        ctx.beginPath();
                        ctx.arc(bx, by, br, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.fillStyle = '#f5d98a';
                        ctx.font = Math.floor(T * 0.2) + 'px sans-serif';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(String(bCount), bx, by + 0.5);
                        ctx.textAlign = 'left';
                        ctx.textBaseline = 'alphabetic';
                    }
                }
            }
        }

        // Grid lines
        if (T > 12) {
            ctx.strokeStyle = 'rgba(255,255,255,0.04)';
            ctx.lineWidth = 0.5;
            for (var r2 = 0; r2 <= this.ROWS; r2++) {
                var yy = r2*T+this.offsetY;
                ctx.beginPath(); ctx.moveTo(this.offsetX,yy); ctx.lineTo(this.COLS*T+this.offsetX,yy); ctx.stroke();
            }
            for (var c2 = 0; c2 <= this.COLS; c2++) {
                var xx = c2*T+this.offsetX;
                ctx.beginPath(); ctx.moveTo(xx,this.offsetY); ctx.lineTo(xx,this.ROWS*T+this.offsetY); ctx.stroke();
            }
        }
    },

    _getTileAt: function(clientX, clientY) {
        var rect = this.canvas.getBoundingClientRect();
        var mx = clientX - rect.left;
        var my = clientY - rect.top;
        var T = this.TILE * this.zoom;
        var c = Math.floor((mx - this.offsetX) / T);
        var r = Math.floor((my - this.offsetY) / T);
        if (r >= 0 && r < this.ROWS && c >= 0 && c < this.COLS) return {r:r, c:c};
        return null;
    },

    _updateHover: function(e) {
        var t = this._getTileAt(e.clientX, e.clientY);
        this.hoveredTile = t;
        if (t && state.mapData) {
            var tile = state.mapData[t.r][t.c];
            var tdata = this.TERRAIN[tile.terrain];
            var coordsEl = document.getElementById('map-coords');
            if (coordsEl) coordsEl.textContent = t.c + ', ' + t.r + ' - ' + safeLabel(tdata.name, humanizeId(tile.terrain));
        }
        if (!this.dragging) this.render();
    },


    _onTap: function(clientX, clientY) {
        this.lastTouchTapTs = Date.now();
        var t = this._getTileAt(clientX, clientY);
        if (!t) return;
        this.selectedTile = t;
        this._showTileInfo(t);
        if (UI && UI.renderMapBuildWindow) UI.renderMapBuildWindow();
        this.render();
    },

    _touchDistance: function(t1, t2) {
        var dx = t1.clientX - t2.clientX;
        var dy = t1.clientY - t2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    },

    _onClick: function(e) {
        var t = this._getTileAt(e.clientX, e.clientY);
        if (!t) return;
        this.selectedTile = t;
        this._showTileInfo(t);
        if (UI && UI.renderMapBuildWindow) UI.renderMapBuildWindow();
        this.render();
    },

    _showTileInfo: function(t) {
        var tile = state.mapData[t.r][t.c];
        var tdata = this.TERRAIN[tile.terrain];
        var terrainName = safeLabel(tdata.name, humanizeId(tile.terrain));
        var cityName = safeLabel(tile.city, '');
        var html = '<h4>' + terrainName + (cityName ? ' - ' + cityName : '') + '</h4>';
        html += '<div class="mi-row"><span>'+UI_ICONS.food+' Nourr.</span><span>+' + tdata.food + '</span></div>';
        html += '<div class="mi-row"><span>'+UI_ICONS.prod+' Prod</span><span>+' + tdata.prod + '</span></div>';
        html += '<div class="mi-row"><span>'+UI_ICONS.gold+' Or</span><span>+' + tdata.gold + '</span></div>';
        if (tile.resource) {
            var rIcon = safeIcon(tile.resource.icon, UI_ICONS.gold);
            var rName = safeLabel(tile.resource.name, humanizeId(tile.resource.id || 'resource'));
            html += '<div class="mi-row"><span>' + rIcon + ' ' + rName + '</span><span style="color:var(--success)">Bonus</span></div>';
        }
        if (state && state.memoriapolis && tile.owner === 'player') {
            var memoDef = (typeof Game !== 'undefined' && Game.getMemoLevelDef) ? Game.getMemoLevelDef(tile.districtLevel || 0) : null;
            var memoScore = (typeof Game !== 'undefined' && Game._getMemoTileScore) ? Game._getMemoTileScore(t.r, t.c) : 0;
            if (memoDef) {
                html += '<div class="mi-row"><span>Quartier</span><span style="color:var(--accent)">'+memoDef.name+' (N'+memoDef.level+')</span></div>';
                html += '<div class="mi-row"><span>Potentiel urbain</span><span>'+memoScore+'</span></div>';
            }
        }
        this._ensureTileBuildingData(tile);
        var totalBuildings = this._tileBuildingCount(tile);
        if (totalBuildings > 0) {
            html += '<div class="mi-row"><span>Batiments</span><span>' + totalBuildings + '</span></div>';
            var bDetails = [];
            for (var bId in tile.buildings) {
                if (!tile.buildings[bId]) continue;
                var bInfo = BUILDINGS.find(function(x){ return x.id === bId; });
                var bLabel = bInfo ? (safeIcon(bInfo.icon,UI_ICONS.building) + ' ' + safeLabel(bInfo.name, humanizeId(bId))) : humanizeId(bId);
                bDetails.push(bLabel + ' x' + tile.buildings[bId]);
            }
            if (bDetails.length) {
                html += '<div style="font-size:0.75rem;color:var(--text-secondary);margin-top:5px;">' + bDetails.join('<br>') + '</div>';
            }
        }
        if (tile.owner === 'player') {
            html += '<div style="color:var(--accent);margin-top:4px;font-size:0.75rem">'+UI_ICONS.building+' Votre territoire</div>';
            html += '<div class="mi-action"><button onclick="UI.openMapBuildWindow('+t.r+','+t.c+')">Construire ici</button></div>';
        } else if (tile.owner) {
            var aiN = AI_NATIONS.find(function(n){return n.id===tile.owner;});
            html += '<div style="color:' + (aiN?aiN.color:'#888') + ';margin-top:4px;font-size:0.75rem">'+UI_ICONS.unit+' ' + (aiN?safeLabel(aiN.name, humanizeId(aiN.id)):'Inconnu') + '</div>';
        } else if (tdata.movable) {
            // Check if adjacent to player territory
            var adj = false;
            for (var dr=-1;dr<=1;dr++) for(var dc=-1;dc<=1;dc++) {
                var nr=t.r+dr,nc=t.c+dc;
                if(nr>=0&&nr<this.ROWS&&nc>=0&&nc<this.COLS&&state.mapData[nr][nc].owner==='player') adj=true;
            }
            if (adj) {
                html += '<div class="mi-action"><button onclick="WorldMap.colonize('+t.r+','+t.c+')">Coloniser ('+UI_ICONS.gold+'50)</button></div>';
            }
        }
        var infoEl = document.getElementById('map-tile-info');
        if (infoEl) infoEl.innerHTML = decodeMojibakeText(html);
        if (typeof UI !== 'undefined' && UI.renderMapBuildWindow) UI.renderMapBuildWindow();
    },

    _ensureTileBuildingData: function(tile) {
        if (!tile) return;
        if (!tile.buildings || typeof tile.buildings !== 'object') tile.buildings = {};
        if (tile.building && !tile.buildings[tile.building]) tile.buildings[tile.building] = 1;
        if (!tile.building) {
            for (var bid in tile.buildings) {
                if (!Object.prototype.hasOwnProperty.call(tile.buildings, bid)) continue;
                if ((tile.buildings[bid] || 0) > 0) { tile.building = bid; break; }
            }
        }
        if (tile.building && (!tile.buildings[tile.building] || tile.buildings[tile.building] < 1)) {
            tile.buildings[tile.building] = 1;
        }
        if (typeof tile.districtLevel !== 'number' || isNaN(tile.districtLevel)) tile.districtLevel = tile.city ? 1 : 0;
        tile.districtLevel = Math.max(0, Math.min(4, Math.floor(tile.districtLevel)));
    },

    _tileBuildingCount: function(tile) {
        this._ensureTileBuildingData(tile);
        var total = 0;
        for (var bid in tile.buildings) total += tile.buildings[bid] || 0;
        return total;
    },

    _ensureMapBuildingData: function() {
        if (!state || !state.mapData) return;
        for (var r = 0; r < this.ROWS; r++) {
            for (var c = 0; c < this.COLS; c++) {
                this._ensureTileBuildingData(state.mapData[r][c]);
            }
        }
    },

    _getHomeTile: function() {
        if (!state || !state.mapData) return null;
        for (var r = 0; r < this.ROWS; r++) {
            for (var c = 0; c < this.COLS; c++) {
                if (state.mapData[r][c].city === state.nationName) return { r:r, c:c };
            }
        }
        return null;
    },

    _getAnyPlayerTile: function() {
        if (!state || !state.mapData) return null;
        for (var r = 0; r < this.ROWS; r++) {
            for (var c = 0; c < this.COLS; c++) {
                var tile = state.mapData[r][c];
                if (tile.owner === 'player' && this.TERRAIN[tile.terrain].movable) return { r:r, c:c };
            }
        }
        return null;
    },

    _getAutoBuildTile: function(buildingDef) {
        if (!state || !state.mapData) return null;
        var best = null;
        var bestScore = -99999;
        for (var r = 0; r < this.ROWS; r++) {
            for (var c = 0; c < this.COLS; c++) {
                var tile = state.mapData[r][c];
                if (!tile || tile.owner !== 'player' || !this.TERRAIN[tile.terrain].movable) continue;
                this._ensureTileBuildingData(tile);
                var tCount = this._tileBuildingCount(tile);
                var score = 50 - (tCount * 8);

                // Capital and cities can host administrative/cultural/science better
                if (tile.city) score += 4;

                // Terrain affinity by building category
                var cat = buildingDef && buildingDef.cat ? buildingDef.cat : '';
                if (cat === 'nourriture') {
                    if (tile.terrain === 'plain') score += 8;
                    else if (tile.terrain === 'coast' || tile.terrain === 'swamp') score += 6;
                    else if (tile.terrain === 'forest') score += 3;
                    if (tile.resource && tile.resource.bonus && tile.resource.bonus.food) score += 4;
                } else if (cat === 'economie') {
                    if (tile.terrain === 'mountain') score += 7;
                    else if (tile.terrain === 'desert') score += 5;
                    else if (tile.terrain === 'coast') score += 4;
                    if (tile.resource && tile.resource.bonus && (tile.resource.bonus.gold || tile.resource.bonus.prod)) score += 4;
                } else if (cat === 'militaire') {
                    if (tile.terrain === 'mountain' || tile.terrain === 'forest') score += 4;
                    // Border preference for military infrastructure
                    var border = false;
                    for (var dr = -1; dr <= 1; dr++) {
                        for (var dc = -1; dc <= 1; dc++) {
                            if (dr === 0 && dc === 0) continue;
                            var nr = r + dr;
                            var nc = c + dc;
                            if (nr < 0 || nr >= this.ROWS || nc < 0 || nc >= this.COLS) continue;
                            var nt = state.mapData[nr][nc];
                            if (nt && nt.owner !== 'player' && this.TERRAIN[nt.terrain].movable) border = true;
                        }
                    }
                    if (border) score += 6;
                } else if (cat === 'science' || cat === 'culture' || cat === 'religion') {
                    if (tile.city) score += 5;
                    if (tile.terrain === 'plain') score += 2;
                } else if (cat === 'infrastructure') {
                    if (tile.terrain === 'plain' || tile.terrain === 'coast') score += 4;
                }

                // Slight randomness to avoid rigid deterministic pattern
                score += Math.random() * 2;

                if (score > bestScore) {
                    bestScore = score;
                    best = { r:r, c:c };
                }
            }
        }
        return best;
    },

    placeBuilding: function(bid) {
        if (!state || !state.mapData) return null;
        this._ensureMapBuildingData();
        var bDef = BUILDINGS.find(function(b){ return b.id === bid; });
        var activeTab = document.querySelector('.tab.active');
        var activeTabId = activeTab ? activeTab.getAttribute('data-tab') : '';
        var mapBuildWin = document.getElementById('map-build-window');
        var fromMapFlow = (activeTabId === 'map') || (mapBuildWin && !mapBuildWin.classList.contains('hidden'));

        var target = null;
        if (fromMapFlow && this.selectedTile) {
            var sr = this.selectedTile.r;
            var sc = this.selectedTile.c;
            if (sr >= 0 && sr < this.ROWS && sc >= 0 && sc < this.COLS) {
                var selected = state.mapData[sr][sc];
                if (selected.owner === 'player' && this.TERRAIN[selected.terrain].movable) {
                    target = { r:sr, c:sc };
                }
            }
        }

        if (!target) target = this._getAutoBuildTile(bDef);
        if (!target) target = this._getHomeTile();
        if (!target) target = this._getAnyPlayerTile();
        if (!target) return null;

        var tile = state.mapData[target.r][target.c];
        this._ensureTileBuildingData(tile);
        tile.buildings[bid] = (tile.buildings[bid] || 0) + 1;
        tile.building = bid;
        if (tile.owner === 'player' && (tile.districtLevel || 0) < 1) tile.districtLevel = 1;

        this.selectedTile = { r:target.r, c:target.c };
        return { r:target.r, c:target.c, count:tile.buildings[bid], total:this._tileBuildingCount(tile) };
    },

    colonize: function(r, c) {
        if (!state || state.resources.gold < 50) { UI.toast('Pas assez d\'or !','warning'); return; }
        var tile = state.mapData[r][c];
        if (tile.owner || !this.TERRAIN[tile.terrain].movable) return;
        state.resources.gold -= 50;
        tile.owner = 'player';
        tile.districtLevel = 0;
        state.territory++;
        UI.toast('Territoire colonise !','success');
        this._showTileInfo({r:r,c:c});
        this.render();
        UI.updateAll();
    },

    zoomIn: function() { this.zoom = Math.min(3, this.zoom + 0.2); this.render(); },
    zoomOut: function() { this.zoom = Math.max(0.4, this.zoom - 0.2); this.render(); },
    centerHome: function() {
        if (!state || !state.mapData) return;
        for (var r=0;r<this.ROWS;r++) for(var c=0;c<this.COLS;c++) {
            if (state.mapData[r][c].city === state.nationName) {
                var T = this.TILE * this.zoom;
                this.offsetX = this.canvas.width/2 - c*T - T/2;
                this.offsetY = this.canvas.height/2 - r*T - T/2;
                this.render(); return;
            }
        }
    },

    countPlayerTiles: function() {
        if (!state||!state.mapData) return 0;
        var count = 0;
        for(var r=0;r<this.ROWS;r++) for(var c=0;c<this.COLS;c++) if(state.mapData[r][c].owner==='player') count++;
        return count;
    },

    getPlayerResources: function() {
        if (!state||!state.mapData) return {food:0,prod:0,gold:0};
        var res = {food:0,prod:0,gold:0};
        for(var r=0;r<this.ROWS;r++) for(var c=0;c<this.COLS;c++) {
            var tile = state.mapData[r][c];
            if (tile.owner==='player') {
                var td = this.TERRAIN[tile.terrain];
                res.food += td.food; res.prod += td.prod; res.gold += td.gold;
                if (tile.resource) {
                    for (var k in tile.resource.bonus) {
                        if (res[k]!==undefined) res[k] += tile.resource.bonus[k];
                    }
                }
            }
        }
        return res;
    }
};


// ============================
//  GAME — Contrôle Principal
// ============================
var Game = {
    _rtBaseStepMs: 1800,
    _rtSpeeds: [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 7],
    _rtTimer: null,
    _rtStepMs: 3600,
    _realtime: false,

    showTitle: function() { this._clearRealtime(); this._sw('title-screen'); },
    showNewGame: function() {
        this._resetRuntimeState();
        this._sw('new-game-screen');
        var nationInput = document.getElementById('nation-name') || document.getElementById('inp-nation');
        var rulerInput = document.getElementById('ruler-name') || document.getElementById('inp-ruler');
        if (nationInput) nationInput.value = '';
        if (rulerInput) rulerInput.value = '';
    },
    showCredits: function() {
        UI.showEvent('i','Credits','Be the King\nSimulation de Nation\nDeveloppe par Hardi',[{text:'OK',effect:'',apply:function(){}}]);
    },
    selectGov: function(el) { document.querySelectorAll('.gov-card').forEach(function(c){c.classList.remove('selected');}); el.classList.add('selected'); },
    selectDiff: function(el) { document.querySelectorAll('.btn-diff').forEach(function(c){c.classList.remove('selected');}); el.classList.add('selected'); },
    pickGov: function(el) { this.selectGov(el); },
    pickDiff: function(el) { this.selectDiff(el); },
    _resetRuntimeState: function() {
        this._clearRealtime();
        state = null;
        document.body.className = '';
        if (typeof WorldMap !== 'undefined') {
            WorldMap.selectedTile = null;
            WorldMap.hoveredTile = null;
            WorldMap.dragging = false;
            WorldMap.offsetX = 0;
            WorldMap.offsetY = 0;
            WorldMap.zoom = 1;
        }
    },
    clearSave: function() {
        try {
            localStorage.removeItem('btk_save');
            this._resetRuntimeState();
            this._sw('title-screen');
            UI.toast('Sauvegarde effacee. Nouvelle partie possible.', 'success');
        } catch (e) {
            UI.toast('Impossible d effacer la sauvegarde.', 'danger');
        }
    },
    _createDiploState: function(baseOpinion, nation) {
        var op = (typeof baseOpinion === 'number') ? baseOpinion : 50;
        var nat = nation || {};
        return {
            relation:'neutral',
            opinion:Math.max(0, Math.min(100, Math.floor(op))),
            trust:45,
            tension:35,
            grievances:0,
            embassy:false,
            culturalPressure:0,
            tradeCooldownTurn:0,
            pacts:{ tradeUntil:0, researchUntil:0, culturalUntil:0, nonAggressionUntil:0 },
            terms:{
                marriageUntil:0,
                oathUntil:0,
                giftScore:0,
                lastGiftTurn:0
            },
            vassalage:{
                status:'none', // none | your_vassal
                sinceTurn:0,
                tributeRate:0
            },
            polity:safeLabel(nat.polity, 'etat'),
            dynasty:safeLabel(nat.dynasty, '')
        };
    },
    _normalizeDiploState: function(d) {
        if (!d || typeof d !== 'object') d = {};
        if (typeof d.relation !== 'string') d.relation = 'neutral';
        if (typeof d.opinion !== 'number') d.opinion = 50;
        if (typeof d.trust !== 'number') d.trust = 45;
        if (typeof d.tension !== 'number') d.tension = 35;
        if (typeof d.grievances !== 'number') d.grievances = 0;
        if (typeof d.embassy !== 'boolean') d.embassy = false;
        if (typeof d.culturalPressure !== 'number') d.culturalPressure = 0;
        if (typeof d.tradeCooldownTurn !== 'number') d.tradeCooldownTurn = 0;
        if (!d.pacts || typeof d.pacts !== 'object') d.pacts = {};
        if (typeof d.pacts.tradeUntil !== 'number') d.pacts.tradeUntil = 0;
        if (typeof d.pacts.researchUntil !== 'number') d.pacts.researchUntil = 0;
        if (typeof d.pacts.culturalUntil !== 'number') d.pacts.culturalUntil = 0;
        if (typeof d.pacts.nonAggressionUntil !== 'number') d.pacts.nonAggressionUntil = 0;
        if (!d.terms || typeof d.terms !== 'object') d.terms = {};
        if (typeof d.terms.marriageUntil !== 'number') d.terms.marriageUntil = 0;
        if (typeof d.terms.oathUntil !== 'number') d.terms.oathUntil = 0;
        if (typeof d.terms.giftScore !== 'number') d.terms.giftScore = 0;
        if (typeof d.terms.lastGiftTurn !== 'number') d.terms.lastGiftTurn = 0;
        if (!d.vassalage || typeof d.vassalage !== 'object') d.vassalage = {};
        if (typeof d.vassalage.status !== 'string') d.vassalage.status = 'none';
        if (typeof d.vassalage.sinceTurn !== 'number') d.vassalage.sinceTurn = 0;
        if (typeof d.vassalage.tributeRate !== 'number') d.vassalage.tributeRate = 0;
        if (typeof d.polity !== 'string') d.polity = 'etat';
        if (typeof d.dynasty !== 'string') d.dynasty = '';

        d.opinion = Math.max(0, Math.min(100, Math.floor(d.opinion)));
        d.trust = Math.max(0, Math.min(100, Math.floor(d.trust)));
        d.tension = Math.max(0, Math.min(100, Math.floor(d.tension)));
        d.grievances = Math.max(0, Math.min(200, Math.floor(d.grievances)));
        d.culturalPressure = Math.max(0, Math.min(100, Math.floor(d.culturalPressure)));
        d.terms.giftScore = Math.max(0, Math.min(200, Math.floor(d.terms.giftScore)));
        d.vassalage.tributeRate = Math.max(0, Math.min(0.35, Number(d.vassalage.tributeRate) || 0));
        return d;
    },
    _isRoyalPolity: function(polity) {
        var p = String(polity || '').toLowerCase();
        return p === 'royaume' || p === 'empire' || p === 'sultanat';
    },
    _isTribalPolity: function(polity) {
        return String(polity || '').toLowerCase() === 'tribu';
    },
    _hasAllianceTerms: function(d, nation) {
        var hasGift = d.terms.giftScore >= 55;
        var hasMarriage = d.terms.marriageUntil >= state.turn;
        var hasOath = d.terms.oathUntil >= state.turn;
        var hasPact = d.pacts.nonAggressionUntil >= state.turn || d.pacts.tradeUntil >= state.turn;
        if (this._isRoyalPolity(nation.polity)) return hasMarriage || hasGift || hasPact;
        if (this._isTribalPolity(nation.polity)) return hasOath || hasGift || hasPact;
        return hasGift || hasPact;
    },
    _estimateNationPower: function(nation, d) {
        var base = 32 + state.turn * 2.2;
        var mult = 1;
        if (nation.personality === 'aggressive' || nation.personality === 'militarist') mult += 0.22;
        if (nation.personality === 'expansionist') mult += 0.16;
        if (nation.personality === 'diplomatic') mult -= 0.08;
        if (d && d.vassalage && d.vassalage.status === 'your_vassal') mult -= 0.2;
        return Math.max(20, Math.floor(base * mult));
    },
    _normalizeRtSpeedIndex: function(index) {
        var idx = Math.floor(Number(index) || 0);
        if (idx < 0) idx = 0;
        if (idx >= this._rtSpeeds.length) idx = this._rtSpeeds.length - 1;
        return idx;
    },
    _getRtSpeedByIndex: function(index) {
        return this._rtSpeeds[this._normalizeRtSpeedIndex(index)];
    },
    _stepMsFromRtSpeed: function(speed) {
        var s = Math.max(0.1, Number(speed) || 1);
        return Math.max(120, Math.round(this._rtBaseStepMs / s));
    },
    _nearestRtSpeedIndex: function(speed) {
        var s = Math.max(0.1, Number(speed) || 1);
        var bestIndex = 0;
        var bestDelta = Number.POSITIVE_INFINITY;
        for (var i = 0; i < this._rtSpeeds.length; i++) {
            var delta = Math.abs(this._rtSpeeds[i] - s);
            if (delta < bestDelta) {
                bestDelta = delta;
                bestIndex = i;
            }
        }
        return bestIndex;
    },
    _rtSpeedFromStepMs: function(stepMs) {
        var ms = Math.max(1, Number(stepMs) || this._rtBaseStepMs);
        return this._rtBaseStepMs / ms;
    },
    _applyRtSpeedByIndex: function(index) {
        var idx = this._normalizeRtSpeedIndex(index);
        this._rtStepMs = this._stepMsFromRtSpeed(this._rtSpeeds[idx]);
        if (state && state.realtime) state.realtime.speedIndex = idx;
        return idx;
    },
    _formatRtSpeed: function(speed) {
        var rounded = Math.round(speed * 100) / 100;
        if (Math.abs(rounded - Math.round(rounded)) < 0.001) return String(Math.round(rounded));
        return rounded.toString();
    },
    _clearRealtime: function() {
        if (this._rtTimer) {
            clearInterval(this._rtTimer);
            this._rtTimer = null;
        }
        this._realtime = false;
        if (state && state.realtime) state.realtime.enabled = false;
        this._updateRealtimeUI();
    },
    _startRealtime: function() {
        var self = this;
        this._clearRealtime();
        this._realtime = true;
        if (state && state.realtime) state.realtime.enabled = true;
        this._rtTimer = setInterval(function(){
            var gameScreen = document.getElementById('game-screen');
            if (!state || !gameScreen || !gameScreen.classList.contains('active')) return;
            var modal = document.getElementById('event-modal');
            if (modal && !modal.classList.contains('hidden')) return;
            self.nextTurn();
        }, this._rtStepMs);
        this._updateRealtimeUI();
    },
    _updateRealtimeUI: function() {
        var modeBtn = document.getElementById('mode-toggle');
        var speedBtn = document.getElementById('speed-toggle');
        var info = document.getElementById('turn-info');
        if (modeBtn) modeBtn.textContent = this._realtime ? 'Mode: Temps reel' : 'Mode: Tour par tour';
        if (speedBtn) {
            var speed = this._rtSpeedFromStepMs(this._rtStepMs);
            speedBtn.textContent = 'Vitesse: x' + this._formatRtSpeed(speed);
        }
        if (info) info.textContent = this._realtime
            ? 'Les tours se jouent automatiquement. Reglage vitesse: x0.5 a x7.'
            : 'Chaque tour applique ressources, IA et evenements.';
    },
    toggleRealtime: function() {
        if (!state) return;
        if (this._realtime) this._clearRealtime();
        else this._startRealtime();
    },
    cycleRealtimeSpeed: function() {
        var currentSpeed = this._rtSpeedFromStepMs(this._rtStepMs);
        var idx = this._nearestRtSpeedIndex(currentSpeed);
        idx = (idx + 1) % this._rtSpeeds.length;
        this._applyRtSpeedByIndex(idx);
        if (this._realtime) this._startRealtime();
        else this._updateRealtimeUI();
    },

    startGame: function() {
        var nationInput = document.getElementById('nation-name') || document.getElementById('inp-nation');
        var rulerInput = document.getElementById('ruler-name') || document.getElementById('inp-ruler');
        var nn = nationInput && nationInput.value ? nationInput.value.trim() : '';
        var rn = rulerInput && rulerInput.value ? rulerInput.value.trim() : '';
        nn = nn || 'Empire Inconnu';
        rn = rn || 'Le Souverain';
        var ge = document.querySelector('.gov-card.selected, .gov-tile.selected');
        var gt = ge ? ge.getAttribute('data-gov') : 'monarchie';
        var de = document.querySelector('.btn-diff.selected, .diff-btn.selected');
        var df = de ? de.getAttribute('data-diff') : 'normal';

        state = createDefaultState(nn, rn, gt, df);
        this._applyRtSpeedByIndex(state.realtime && state.realtime.speedIndex);

        AI_NATIONS.forEach(function(n) {
            state.diplomacy[n.id] = Game._createDiploState(50+Math.floor(Math.random()*20)-10, n);
        });

        var gov = GOVERNMENTS[state.government];
        if (gov && gov.bonuses) {
            if (gov.bonuses.stability) state.stability += gov.bonuses.stability;
            if (gov.bonuses.happiness) state.happiness += gov.bonuses.happiness;
        }

        WorldMap.generate();
        this._sw('game-screen');

        setTimeout(function() {
            WorldMap.init();
            WorldMap.centerHome();
            WorldMap.render();
        }, 100);

        this._clearRealtime();
        UI.updateAll();
        UI.switchTab('map');
        this._updateRealtimeUI();
        UI.toast('Bienvenue, ' + rn + ' ! Votre nation est fondee.', 'success');
    },

    nextTurn: function() {
        if (!state) return;
        this._recalc();

        // Apply resources
        state.resources.gold += state.rates.gold;
        state.resources.food += state.rates.food;
        state.resources.prod += state.rates.prod;
        state.resources.science += state.rates.science;
        state.resources.culture += state.rates.culture;

        // Population
        var foodNeeded = state.population * 0.5;
        if (state.resources.food >= foodNeeded) {
            var gr = state.popGrowthBase + (state.happiness/1000);
            for (var bid in state.buildings) {
                var bd = BUILDINGS.find(function(b){return b.id===bid;});
                if (bd && bd.effect.popGrowth) gr += bd.effect.popGrowth * state.buildings[bid];
            }
            state.population = Math.floor(state.population * (1 + gr));
            state.resources.food -= Math.floor(foodNeeded*0.3);
        } else {
            state.population = Math.floor(state.population * 0.97);
            state.happiness -= 5;
            UI.toast('Famine ! Population en declin.','danger');
        }

        // Army upkeep
        for (var uid in state.army) {
            var u = UNITS.find(function(x){return x.id===uid;});
            if (!u) continue;
            var cnt = state.army[uid];
            if (u.upkeep.gold) state.resources.gold -= u.upkeep.gold * cnt;
            if (u.upkeep.food) state.resources.food -= u.upkeep.food * cnt;
        }

        // Research
        if (state.currentResearch) {
            state.currentResearch.progress += state.rates.science;
            var td = TECHNOLOGIES.find(function(t){return t.id===state.currentResearch.techId;});
            if (td && state.currentResearch.progress >= td.cost) {
                state.techs.push(state.currentResearch.techId);
                UI.toast('Recherche terminee : '+safeLabel(td.name, humanizeId(td.id))+' !','success');
                state.currentResearch = null;
            }
        }

        // Decrees
        state.activeDecrees = state.activeDecrees.filter(function(d) {
            d.turnsLeft--;
            if (d.turnsLeft<=0) { UI.toast('Decret expire : '+safeLabel(d.name, humanizeId(d.id)),'info'); return false; }
            return true;
        });

        // Temp bonuses
        state.tempBonuses = state.tempBonuses.filter(function(b) { b.turns--; return b.turns>0; });

        // Public-policy effects are applied once per turn rather than on slider input.
        var healthBudget = state.policies.sante || 0;
        var securityBudget = state.policies.securite_p || 0;
        state.happiness += Math.round((healthBudget - 25) / 25) -
            Math.round((securityBudget - 35) / 30);
        state.stability += Math.round((securityBudget - 35) / 20);
        if (healthBudget >= 60 && state.resources.food >= state.population * 0.1)
            state.population += Math.max(1, Math.floor(state.population * 0.002));
        // Stability drift
        if (state.happiness < 30) state.stability -= 2;
        if (state.happiness > 70) state.stability += 1;
        state.stability = Math.max(0,Math.min(100,state.stability));
        state.happiness = Math.max(0,Math.min(100,state.happiness));

        // Time advance
        var era = ERAS[state.eraIndex];
        state.year += era.yearPerTurn;
        state.turn++;

        // Era check
        if (state.eraIndex < ERAS.length-1) {
            var cNeeded = (state.eraIndex+1)*100;
            var nextEra = ERAS[state.eraIndex+1];
            if (state.resources.culture >= cNeeded && state.year >= nextEra.yearStart) {
                state.eraIndex++;
                state.resources.culture -= cNeeded;
                UI.toast('Nouvelle ere : '+safeLabel(ERAS[state.eraIndex].name, ERAS[state.eraIndex].id)+' !','success');
                document.body.className = ERAS[state.eraIndex].cssClass||'';
            }
        }

        // Memoriapolis district growth
        this._memoriapolisTick();
        this._applyDiplomacyPacts();
        this._applyVassalSystem();
        this._processCreativeWorks();
        this._updateCultureState();
        this._applyCulturalInfluence();

        // AI
        this._aiTurn();

        // AI expand on map
        this._aiExpand();

        // Events
        this._maybeTriggerEvent();

        UI.updateAll();
        WorldMap.render();
    },

    build: function(bid) {
        var b = BUILDINGS.find(function(x){return x.id===bid;});
        if (!b) return;
        var bName = safeLabel(b.name, humanizeId(b.id));
        if (!this._isBuildingUnlocked(bid)) { UI.toast('Technologie requise !','warning'); return; }
        var bEra = ERAS.findIndex(function(e){return e.id===b.era;});
        if (bEra > state.eraIndex) { UI.toast('Ere non atteinte !','warning'); return; }
        if (b.cost.gold && state.resources.gold < b.cost.gold) { UI.toast('Pas assez d\'or !','warning'); return; }
        if (b.cost.prod && state.resources.prod < b.cost.prod) { UI.toast('Pas assez de production !','warning'); return; }
        if (b.cost.gold) state.resources.gold -= b.cost.gold;
        if (b.cost.prod) state.resources.prod -= b.cost.prod;
        state.buildings[bid] = (state.buildings[bid]||0) + 1;
        var placement = WorldMap.placeBuilding(bid);
        if (placement) {
            UI.toast(bName+' construit en ['+placement.c+','+placement.r+'] !','success');
            WorldMap._showTileInfo({r:placement.r, c:placement.c});
            WorldMap.render();
        } else {
            UI.toast(bName+' construit !','success');
        }
        UI.updateAll();
    },

    research: function(tid) {
        var t = TECHNOLOGIES.find(function(x){return x.id===tid;});
        if (!t) return;
        var tName = safeLabel(t.name, humanizeId(t.id));
        if (state.techs.indexOf(tid)!==-1) { UI.toast('Deja recherche !','info'); return; }
        if (state.currentResearch) { UI.toast('Recherche en cours !','warning'); return; }
        var ok = t.prereqs.every(function(p){return state.techs.indexOf(p)!==-1;});
        if (!ok) { UI.toast('Prerequis manquants !','warning'); return; }
        var tEra = ERAS.findIndex(function(e){return e.id===t.era;});
        if (tEra > state.eraIndex) { UI.toast('Ere non atteinte !','warning'); return; }
        state.currentResearch = { techId:tid, progress:0 };
        UI.toast('Recherche : '+tName,'info');
        UI.updateAll();
    },

    recruit: function(uid) {
        var u = UNITS.find(function(x){return x.id===uid;});
        if (!u) return;
        var uEra = ERAS.findIndex(function(e){return e.id===u.era;});
        if (uEra > state.eraIndex) { UI.toast('Ere non atteinte !','warning'); return; }
        if (u.tech && state.techs.indexOf(u.tech)===-1) { UI.toast('Technologie requise !','warning'); return; }
        if (u.cost.gold && state.resources.gold < u.cost.gold) { UI.toast('Pas assez d\'or !','warning'); return; }
        if (u.cost.food && state.resources.food < u.cost.food) { UI.toast('Pas assez de nourriture !','warning'); return; }
        if (u.cost.prod && state.resources.prod < u.cost.prod) { UI.toast('Pas assez de production !','warning'); return; }
        if (u.cost.gold) state.resources.gold -= u.cost.gold;
        if (u.cost.food) state.resources.food -= u.cost.food;
        if (u.cost.prod) state.resources.prod -= u.cost.prod;
        state.army[uid] = (state.army[uid]||0) + 1;
        UI.toast(safeLabel(u.name, humanizeId(u.id))+' recrute(s) !','success');
        UI.updateAll();
    },

    diploAction: function(nid, action) {
        var d = this._normalizeDiploState(state.diplomacy[nid]);
        var nation = AI_NATIONS.find(function(x){ return x.id === nid; }) || {id:nid, name:nid, polity:'etat', dynasty:''};
        if (!d) return;
        switch(action) {
            case 'improve':
                if(state.resources.gold<30){UI.toast('Pas assez d\'or !','warning');return;}
                state.resources.gold-=30;
                d.opinion=Math.min(100,d.opinion+12);
                d.trust=Math.min(100,d.trust+7);
                d.tension=Math.max(0,d.tension-5);
                if(d.opinion>70)d.relation='friendly';
                UI.toast('Relations ameliorees.','success');
                break;
            case 'gift':
                if(state.resources.gold<70){UI.toast('Pas assez d\'or pour un cadeau diplomatique.','warning');return;}
                state.resources.gold-=70;
                d.opinion=Math.min(100,d.opinion+9);
                d.trust=Math.min(100,d.trust+10);
                d.tension=Math.max(0,d.tension-3);
                d.terms.giftScore = Math.min(200, d.terms.giftScore + 20);
                d.terms.lastGiftTurn = state.turn;
                UI.toast('Cadeau diplomatique accepte.','success');
                break;
            case 'marriage':
                if (!this._isRoyalPolity(d.polity || nation.polity)) { UI.toast('Mariage dynastique reserve aux royaumes/empires/sultanats.','warning'); return; }
                if (d.terms.marriageUntil >= state.turn) { UI.toast('Un mariage dynastique est deja en vigueur.','info'); return; }
                if (state.resources.gold < 120 || state.resources.culture < 45) { UI.toast('Il faut 120 Or et 45 Culture.','warning'); return; }
                state.resources.gold -= 120;
                state.resources.culture -= 45;
                d.terms.marriageUntil = state.turn + 24;
                d.pacts.nonAggressionUntil = Math.max(d.pacts.nonAggressionUntil, state.turn + 18);
                d.opinion = Math.min(100, d.opinion + 14);
                d.trust = Math.min(100, d.trust + 16);
                d.tension = Math.max(0, d.tension - 12);
                if (d.relation !== 'war' && d.opinion >= 60) d.relation = 'friendly';
                UI.toast('Mariage dynastique conclu avec ' + safeLabel(nation.name, humanizeId(nation.id)) + '.', 'success');
                break;
            case 'oath':
                if (!this._isTribalPolity(d.polity || nation.polity)) { UI.toast('Serment reserve aux tribus/confederations.','warning'); return; }
                if (d.terms.oathUntil >= state.turn) { UI.toast('Le serment tribal est deja actif.','info'); return; }
                if (state.resources.food < 35 || state.resources.gold < 50) { UI.toast('Il faut 35 Nourr et 50 Or pour le serment.','warning'); return; }
                state.resources.food -= 35;
                state.resources.gold -= 50;
                d.terms.oathUntil = state.turn + 16;
                d.opinion = Math.min(100, d.opinion + 11);
                d.trust = Math.min(100, d.trust + 10);
                d.tension = Math.max(0, d.tension - 8);
                d.pacts.nonAggressionUntil = Math.max(d.pacts.nonAggressionUntil, state.turn + 12);
                if (d.relation !== 'war' && d.opinion >= 58) d.relation = 'friendly';
                UI.toast('Serment tribal scelle avec ' + safeLabel(nation.name, humanizeId(nation.id)) + '.', 'success');
                break;
            case 'embassy':
                if (d.embassy) { UI.toast('Ambassade deja ouverte.','info'); return; }
                if (state.resources.gold < 90 || state.resources.prod < 25) { UI.toast('Il faut 90 Or et 25 Prod.','warning'); return; }
                state.resources.gold -= 90;
                state.resources.prod -= 25;
                d.embassy = true;
                d.opinion = Math.min(100, d.opinion + 6);
                d.trust = Math.min(100, d.trust + 8);
                UI.toast('Ambassade etablie.','success');
                break;
            case 'threaten':
                d.opinion=Math.max(0,d.opinion-16);
                d.trust=Math.max(0,d.trust-10);
                d.tension=Math.min(100,d.tension+12);
                d.grievances=Math.min(200,d.grievances+10);
                if(d.opinion<30)d.relation='hostile';
                state.prestige+=1;
                UI.toast('Menace envoyee.','warning');
                break;
            case 'denounce':
                d.opinion=Math.max(0,d.opinion-22);
                d.trust=Math.max(0,d.trust-14);
                d.tension=Math.min(100,d.tension+15);
                d.grievances=Math.min(200,d.grievances+15);
                if (d.relation !== 'war') d.relation='hostile';
                UI.toast('Denonciation publique effectuee.','warning');
                break;
            case 'ally':
                if(d.relation!=='friendly' || d.trust < 65){UI.toast('Niveau de confiance insuffisant pour une alliance.','warning');return;}
                if (!this._hasAllianceTerms(d, nation)) { UI.toast('Alliance impossible: il faut un terme diplomatique (mariage, serment, dons ou pacte).','warning'); return; }
                d.relation='allied';
                d.tension=Math.max(0,d.tension-8);
                d.pacts.nonAggressionUntil = Math.max(d.pacts.nonAggressionUntil, state.turn + 12);
                state.prestige+=6;
                UI.toast('Alliance signee !','success');
                break;
            case 'vassalize':
                if (d.vassalage.status === 'your_vassal') { UI.toast('Cette nation est deja votre vassal.','info'); return; }
                if (state.resources.gold < 80 || state.resources.prod < 30) { UI.toast('Il faut 80 Or et 30 Prod pour imposer une suzerainete.','warning'); return; }
                var estPower = this._estimateNationPower(nation, d);
                var ratio = state.militaryPower / Math.max(1, estPower);
                if (ratio < 1.15) { UI.toast('Puissance militaire insuffisante pour vassaliser cette nation.','warning'); return; }
                state.resources.gold -= 80;
                state.resources.prod -= 30;
                var termBonus = this._hasAllianceTerms(d, nation) ? 0.15 : 0;
                var warBonus = d.relation === 'war' ? 0.1 : 0;
                var chance = 0.32 + (ratio - 1) * 0.35 + (d.trust - d.tension) / 220 + termBonus + warBonus;
                chance = Math.max(0.12, Math.min(0.9, chance));
                if (Math.random() < chance) {
                    d.vassalage.status = 'your_vassal';
                    d.vassalage.sinceTurn = state.turn;
                    d.vassalage.tributeRate = Math.max(0.08, Math.min(0.2, 0.09 + (ratio - 1) * 0.08));
                    d.relation = 'allied';
                    d.opinion = Math.max(45, d.opinion);
                    d.trust = Math.min(100, d.trust + 8);
                    d.tension = Math.max(0, d.tension - 15);
                    d.pacts.nonAggressionUntil = Math.max(d.pacts.nonAggressionUntil, state.turn + 25);
                    UI.toast(safeLabel(nation.name, humanizeId(nation.id)) + ' accepte la vassalite.', 'success');
                } else {
                    d.opinion = Math.max(0, d.opinion - 10);
                    d.trust = Math.max(0, d.trust - 8);
                    d.tension = Math.min(100, d.tension + 15);
                    d.grievances = Math.min(200, d.grievances + 12);
                    if (d.relation !== 'war' && d.opinion < 30) d.relation = 'hostile';
                    UI.toast('Refus de vassalite. Les relations se degradent.', 'warning');
                }
                break;
            case 'demand_tribute':
                if (d.vassalage.status !== 'your_vassal') { UI.toast('Cette nation n est pas votre vassal.','warning'); return; }
                var tribGold = 15 + Math.floor((d.vassalage.tributeRate || 0.1) * 80);
                var tribProd = 5 + Math.floor((d.vassalage.tributeRate || 0.1) * 30);
                state.resources.gold += tribGold;
                state.resources.prod += tribProd;
                d.opinion = Math.max(0, d.opinion - 3);
                d.trust = Math.max(0, d.trust - 2);
                d.tension = Math.min(100, d.tension + 3);
                UI.toast('Tribut recu: +' + tribGold + ' Or, +' + tribProd + ' Prod.', 'success');
                break;
            case 'release_vassal':
                if (d.vassalage.status !== 'your_vassal') { UI.toast('Pas de vassal a liberer.','info'); return; }
                d.vassalage.status = 'none';
                d.vassalage.sinceTurn = 0;
                d.vassalage.tributeRate = 0;
                d.relation = 'friendly';
                d.opinion = Math.min(100, d.opinion + 12);
                d.trust = Math.min(100, d.trust + 8);
                d.tension = Math.max(0, d.tension - 10);
                UI.toast('Vassal libere: prestige diplomatique renforce.', 'info');
                break;
            case 'war':
                if (d.pacts.nonAggressionUntil >= state.turn) { UI.toast('Pacte de non-agression actif. Denoncez-le d abord.','warning'); return; }
                if (d.vassalage.status === 'your_vassal') { UI.toast('Impossible: cette nation est votre vassal.','warning'); return; }
                d.relation='war';
                d.opinion=0;
                d.trust=Math.max(0,d.trust-20);
                d.tension=100;
                d.pacts.tradeUntil = 0;
                d.pacts.researchUntil = 0;
                d.pacts.culturalUntil = 0;
                UI.toast('Guerre declaree !','danger');
                break;
            case 'peace':
                if(d.relation!=='war')return;
                if (state.resources.gold < 50) { UI.toast('Pas assez d\'or pour negocier la paix.','warning'); return; }
                state.resources.gold-=50;
                d.relation='neutral';
                d.opinion=Math.max(25,d.opinion);
                d.trust=Math.max(20,d.trust-5);
                d.tension=Math.max(20,d.tension-30);
                d.pacts.nonAggressionUntil = state.turn + 6;
                UI.toast('Paix signee.','info');
                break;
            case 'pact_trade':
                if (d.relation==='war' || d.relation==='hostile') { UI.toast('Relations trop tendues pour un pacte commercial.','warning'); return; }
                if (d.pacts.tradeUntil >= state.turn) { UI.toast('Pacte commercial deja actif.','info'); return; }
                if (state.resources.gold < 45 || state.resources.prod < 20) { UI.toast('Il faut 45 Or et 20 Prod.','warning'); return; }
                state.resources.gold -= 45;
                state.resources.prod -= 20;
                d.pacts.tradeUntil = state.turn + 10;
                d.opinion = Math.min(100, d.opinion + 6);
                d.trust = Math.min(100, d.trust + 6);
                UI.toast('Pacte commercial signe (10 tours).','success');
                break;
            case 'pact_research':
                if (d.relation==='war' || d.relation==='hostile') { UI.toast('Relations trop tendues pour un pacte scientifique.','warning'); return; }
                if (d.pacts.researchUntil >= state.turn) { UI.toast('Pacte scientifique deja actif.','info'); return; }
                if (state.resources.gold < 40 || state.resources.science < 30) { UI.toast('Il faut 40 Or et 30 Science.','warning'); return; }
                state.resources.gold -= 40;
                state.resources.science -= 30;
                d.pacts.researchUntil = state.turn + 8;
                d.trust = Math.min(100, d.trust + 8);
                UI.toast('Pacte scientifique signe (8 tours).','success');
                break;
            case 'pact_culture':
                if (d.relation==='war' || d.relation==='hostile') { UI.toast('Relations trop tendues pour un pacte culturel.','warning'); return; }
                if (d.pacts.culturalUntil >= state.turn) { UI.toast('Pacte culturel deja actif.','info'); return; }
                if (state.resources.gold < 30 || state.resources.culture < 25) { UI.toast('Il faut 30 Or et 25 Culture.','warning'); return; }
                state.resources.gold -= 30;
                state.resources.culture -= 25;
                d.pacts.culturalUntil = state.turn + 8;
                d.opinion = Math.min(100, d.opinion + 8);
                d.culturalPressure = Math.min(100, d.culturalPressure + 10);
                UI.toast('Echange culturel signe (8 tours).','success');
                break;
            case 'pact_non_aggr':
                if (d.pacts.nonAggressionUntil >= state.turn) { UI.toast('Pacte de non-agression deja actif.','info'); return; }
                if (state.resources.gold < 35) { UI.toast('Il faut 35 Or.','warning'); return; }
                if (d.relation === 'war') { UI.toast('Signez d abord la paix.','warning'); return; }
                state.resources.gold -= 35;
                d.pacts.nonAggressionUntil = state.turn + 12;
                d.tension = Math.max(0, d.tension - 12);
                d.trust = Math.min(100, d.trust + 5);
                UI.toast('Pacte de non-agression signe (12 tours).','success');
                break;
            case 'trade':
                if(d.relation==='war'||d.relation==='hostile'){UI.toast('Relations trop mauvaises !','warning');return;}
                if (d.vassalage.status === 'your_vassal') { UI.toast('Utilisez le tribut vassal ou les pactes pour cette nation.','info'); return; }
                if (d.tradeCooldownTurn && state.turn < d.tradeCooldownTurn) { UI.toast('Commerce deja lance. Attendez quelques tours.','info'); return; }
                var deal = this._buildTradeDeal(d);
                if (state.resources.food < deal.costFood || state.resources.prod < deal.costProd) {
                    UI.toast('Commerce impossible: il faut '+deal.costFood+' Nourr et '+deal.costProd+' Prod.','warning');
                    return;
                }
                state.resources.food -= deal.costFood;
                state.resources.prod -= deal.costProd;
                state.resources.gold += deal.goldGain;
                d.opinion = Math.min(100, d.opinion + deal.opinionGain);
                d.tradeCooldownTurn = state.turn + deal.cooldownTurns;
                UI.toast('Commerce: -'+deal.costFood+' Nourr, -'+deal.costProd+' Prod, +'+deal.goldGain+' Or.','success');
                break;
        }
        state.diplomacy[nid] = this._normalizeDiploState(d);
        UI.updateAll();
    },

    _buildTradeDeal: function(d) {
        var era = Math.max(0, state.eraIndex || 0);
        var relationBonus = (d.relation === 'allied' ? 12 : (d.relation === 'friendly' ? 7 : 2));
        var opinionBonus = Math.max(0, Math.floor((d.opinion - 40) / 8));
        var trustBonus = Math.max(0, Math.floor((d.trust - 45) / 10));
        var pactBonus = (d.pacts && d.pacts.tradeUntil >= state.turn) ? 5 : 0;
        var embassyBonus = d.embassy ? 2 : 0;
        var goldGain = 18 + era * 6 + relationBonus + opinionBonus + trustBonus + pactBonus + embassyBonus;
        var costFood = 10 + era * 2;
        var costProd = 8 + era * 2;
        if (d.tension > 60) {
            costFood += 2;
            costProd += 2;
            goldGain -= 3;
        }
        var cooldownTurns = this._realtime ? 4 : 2;

        if (state.resources.food < 30) costFood += 3;
        if (state.resources.prod < 20) costProd += 2;
        return {
            goldGain: Math.max(12, Math.floor(goldGain)),
            costFood: Math.max(6, Math.floor(costFood)),
            costProd: Math.max(5, Math.floor(costProd)),
            opinionGain: 2,
            cooldownTurns: cooldownTurns
        };
    },

    activateDecree: function(did) {
        var d = DECREES.find(function(x){return x.id===did;});
        if (!d) return;
        if (state.activeDecrees.find(function(a){return a.id===did;})) { UI.toast('Deja actif !','info'); return; }
        if (d.cost.gold && state.resources.gold < d.cost.gold) { UI.toast('Pas assez d\'or !','warning'); return; }
        if (d.cost.prod && state.resources.prod < d.cost.prod) { UI.toast('Pas assez de prod !','warning'); return; }
        if (d.cost.gold) state.resources.gold -= d.cost.gold;
        if (d.cost.prod) state.resources.prod -= d.cost.prod;
        state.activeDecrees.push({id:did,name:d.name,turnsLeft:d.duration});
        UI.toast('Decret : '+safeLabel(d.name, humanizeId(d.id)),'success');
        UI.updateAll();
    },

    setPolicy: function(pid, val) {
        var def = POLICIES.find(function(p){return p.id===pid;});
        if (!state || !def) return;
        var parsed = Number(val);
        if (!Number.isFinite(parsed)) return;
        state.policies[pid] = Math.max(def.min, Math.min(def.max, Math.round(parsed)));
        this._recalc();
        UI.updateAll();
    },

    saveGame: function() {
        try { localStorage.setItem('btk_save',JSON.stringify(state)); UI.toast('Sauvegarde ok !','success'); }
        catch(e) { UI.toast('Erreur sauvegarde.','danger'); }
    },

    loadGame: function() {
        try {
            var s = localStorage.getItem('btk_save');
            if (s) {
                state = JSON.parse(s);
                state.tempBonuses = state.tempBonuses||[];
                state.realtime = state.realtime || {enabled:false,speedIndex:0,version:2};
                if (typeof state.realtime.version !== 'number') {
                    var legacyIdx = Math.floor(Number(state.realtime.speedIndex) || 0);
                    var legacySteps = [1800, 1200, 800, 500];
                    var legacyStep = legacySteps[Math.max(0, Math.min(legacySteps.length - 1, legacyIdx))];
                    var migratedSpeed = this._rtSpeedFromStepMs(legacyStep);
                    state.realtime.speedIndex = this._nearestRtSpeedIndex(migratedSpeed);
                    state.realtime.version = 2;
                }
                state.memoriapolis = state.memoriapolis || {enabled:true,growthLast:0,lastTurn:0};
                state.eventControl = state.eventControl || {nextAllowedTurn:1,lastEventTurn:0};
                state.cultureState = state.cultureState || {masterpieces:0,festivals:0,heritage:0,softPower:0,lastFestivalTurn:0,projectsDone:{},poets:1,artists:1,artProgress:0,works:[]};
                if (!state.cultureState.projectsDone || typeof state.cultureState.projectsDone !== 'object') state.cultureState.projectsDone = {};
                if (typeof state.cultureState.poets !== 'number') state.cultureState.poets = 1;
                if (typeof state.cultureState.artists !== 'number') state.cultureState.artists = 1;
                if (typeof state.cultureState.artProgress !== 'number') state.cultureState.artProgress = 0;
                if (!Array.isArray(state.cultureState.works)) state.cultureState.works = [];
                if (typeof state.militaryLevel !== 'number') state.militaryLevel = 1;
                state.diplomacy = state.diplomacy || {};
                AI_NATIONS.forEach(function(n){
                    var existing = state.diplomacy[n.id] || Game._createDiploState(50, n);
                    var norm = Game._normalizeDiploState(existing);
                    if (!norm.polity || norm.polity === 'etat') norm.polity = safeLabel(n.polity, 'etat');
                    if (!norm.dynasty) norm.dynasty = safeLabel(n.dynasty, '');
                    state.diplomacy[n.id] = norm;
                });
                var hasValidMapData = Array.isArray(state.mapData) &&
                    state.mapData.length === WorldMap.ROWS &&
                    state.mapData.every(function(row){ return Array.isArray(row) && row.length === WorldMap.COLS; });
                if (!hasValidMapData) {
                    WorldMap.generate();
                }
                if (state.mapData) {
                    for (var rr = 0; rr < WorldMap.ROWS; rr++) {
                        for (var cc = 0; cc < WorldMap.COLS; cc++) {
                            var t = state.mapData[rr] && state.mapData[rr][cc] ? state.mapData[rr][cc] : null;
                            if (!t) continue;
                            if (!t.buildings || typeof t.buildings !== 'object') t.buildings = {};
                            if (t.building && !t.buildings[t.building]) t.buildings[t.building] = 1;
                            if (typeof t.districtLevel !== 'number' || isNaN(t.districtLevel)) t.districtLevel = t.city ? 1 : 0;
                            t.districtLevel = Math.max(0, Math.min(4, Math.floor(t.districtLevel)));
                        }
                    }

                    var mapBuildingCounts = {};
                    for (var mr = 0; mr < WorldMap.ROWS; mr++) {
                        for (var mc = 0; mc < WorldMap.COLS; mc++) {
                            var mt = state.mapData[mr] && state.mapData[mr][mc] ? state.mapData[mr][mc] : null;
                            if (!mt || !mt.buildings || typeof mt.buildings !== 'object') continue;
                            for (var mbid in mt.buildings) {
                                if (!Object.prototype.hasOwnProperty.call(mt.buildings, mbid)) continue;
                                var mcount = Math.max(0, Math.floor(Number(mt.buildings[mbid]) || 0));
                                if (!mcount) continue;
                                mapBuildingCounts[mbid] = (mapBuildingCounts[mbid] || 0) + mcount;
                            }
                        }
                    }

                    if (state.buildings && typeof state.buildings === 'object') {
                        WorldMap.selectedTile = null;
                        for (var gbid in state.buildings) {
                            if (!Object.prototype.hasOwnProperty.call(state.buildings, gbid)) continue;
                            var expected = Math.max(0, Math.floor(Number(state.buildings[gbid]) || 0));
                            var current = Math.max(0, Math.floor(Number(mapBuildingCounts[gbid]) || 0));
                            var missing = expected - current;
                            if (missing <= 0) continue;

                            for (var add = 0; add < missing; add++) {
                                var placed = WorldMap.placeBuilding(gbid);
                                if (!placed) break;
                            }
                        }
                    }
                }
                this._applyRtSpeedByIndex(state.realtime && state.realtime.speedIndex);
                var resumeRealtime = !!state.realtime.enabled;
                this._clearRealtime();
                this._sw('game-screen');
                document.body.className = ERAS[state.eraIndex].cssClass||'';
                setTimeout(function(){ WorldMap.init(); WorldMap.centerHome(); WorldMap.render(); },100);
                UI.updateAll();
                UI.switchTab('map');
                if (resumeRealtime) this._startRealtime();
                else this._updateRealtimeUI();
                UI.toast('Partie chargee !','success');
            } else { UI.toast('Aucune sauvegarde.','warning'); }
        } catch(e) { UI.toast('Erreur chargement.','danger'); }
    },

    showSettings: function() { UI.showEvent('i','Options','Parametres du jeu.',[{text:'OK',effect:'',apply:function(){}}]); },
    confirmQuit: function() {
        this._clearRealtime();
        UI.showEvent('!','Quitter','Voulez-vous quitter ?',[
            {text:'Quitter',effect:'',apply:function(){Game._resetRuntimeState();Game._sw('title-screen');}},
            {text:'Sauver & quitter',effect:'',apply:function(){Game.saveGame();Game._resetRuntimeState();Game._sw('title-screen');}},
            {text:'Annuler',effect:'',apply:function(){}}
        ]);
    },

    _sw: function(id) { document.querySelectorAll('.screen').forEach(function(s){s.classList.remove('active');}); document.getElementById(id).classList.add('active'); },

    _isBuildingUnlocked: function(bid) {
        var b = BUILDINGS.find(function(x){return x.id===bid;});
        if (!b) return false;
        if (!b.tech) return true;
        return state.techs.indexOf(b.tech) !== -1;
    },

    getMemoLevelDef: function(level) {
        var lv = Math.max(0, Math.min(4, Math.floor(level || 0)));
        for (var i = 0; i < MEMORIOPOLIS_LEVELS.length; i++) {
            if (MEMORIOPOLIS_LEVELS[i].level === lv) return MEMORIOPOLIS_LEVELS[i];
        }
        return MEMORIOPOLIS_LEVELS[0];
    },

    _getMemoTileScore: function(r, c) {
        if (!state || !state.mapData) return 0;
        if (r < 0 || r >= WorldMap.ROWS || c < 0 || c >= WorldMap.COLS) return 0;
        var tile = state.mapData[r][c];
        if (!tile || !WorldMap.TERRAIN[tile.terrain].movable) return 0;

        WorldMap._ensureTileBuildingData(tile);
        var score = 0;
        var built = WorldMap._tileBuildingCount(tile);
        score += built * 2;
        if (tile.resource) score += 1;
        if (tile.city) score += 2;

        for (var dr = -1; dr <= 1; dr++) {
            for (var dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                var nr = r + dr;
                var nc = c + dc;
                if (nr < 0 || nr >= WorldMap.ROWS || nc < 0 || nc >= WorldMap.COLS) continue;
                var nTile = state.mapData[nr][nc];
                if (!nTile || nTile.owner !== 'player') continue;
                WorldMap._ensureTileBuildingData(nTile);
                score += 1;
                if (WorldMap._tileBuildingCount(nTile) > 0) score += 1;
                if (nTile.city) score += 2;
                if ((nTile.districtLevel || 0) >= 2) score += 1;
            }
        }

        score += Math.floor(state.eraIndex / 2);
        return Math.max(0, Math.floor(score));
    },

    _memoriapolisTick: function() {
        if (!state || !state.mapData || !state.memoriapolis || !state.memoriapolis.enabled) return;

        var grown = 0;
        for (var r = 0; r < WorldMap.ROWS; r++) {
            for (var c = 0; c < WorldMap.COLS; c++) {
                var tile = state.mapData[r][c];
                if (!tile || tile.owner !== 'player' || !WorldMap.TERRAIN[tile.terrain].movable) continue;
                WorldMap._ensureTileBuildingData(tile);

                var cur = tile.districtLevel || 0;
                var score = this._getMemoTileScore(r, c);
                var target = cur;
                for (var lv = MEMORIOPOLIS_LEVELS.length - 1; lv >= 1; lv--) {
                    var d = MEMORIOPOLIS_LEVELS[lv];
                    if (state.eraIndex >= d.minEra && score >= d.minScore) {
                        target = Math.max(target, d.level);
                        break;
                    }
                }

                if (target > cur && Math.random() < 0.62) {
                    tile.districtLevel = target;
                    grown++;
                }
            }
        }

        state.memoriapolis.growthLast = grown;
        state.memoriapolis.lastTurn = state.turn;
        if (grown > 0) {
            state.resources.culture += grown;
            state.prestige += grown;
            UI.toast('Memoriapolis: +' + grown + ' quartier(s) evolue(s).', 'success');
        }
    },

    toggleMemoriapolis: function() {
        if (!state || !state.memoriapolis) return;
        state.memoriapolis.enabled = !state.memoriapolis.enabled;
        UI.toast(state.memoriapolis.enabled ? 'Mode Memoriapolis active.' : 'Mode Memoriapolis desactive.', 'info');
        UI.updateAll();
        WorldMap.render();
    },

    _maybeTriggerEvent: function() {
        if (!state) return;
        state.eventControl = state.eventControl || {nextAllowedTurn:1,lastEventTurn:0};
        if (state.turn < state.eventControl.nextAllowedTurn) return;

        var pool = EVENTS.filter(function(ev){
            try { return !!ev.condition(state); }
            catch (e) { return false; }
        });
        if (!pool.length) return;

        var base = Math.max(0.08, Math.min(0.45, 0.11 * state.dm.e));
        var modeFactor = this._realtime ? 0.45 : 0.9;
        var sizeFactor = Math.min(1.25, 0.6 + pool.length * 0.08);
        var chance = Math.min(0.55, base * modeFactor * sizeFactor);
        if (Math.random() > chance) return;

        var pick = pool[Math.floor(Math.random() * pool.length)];
        UI.showEvent(pick.icon, pick.title, pick.desc, pick.choices);

        var cooldown = this._realtime ? 4 : 2;
        if (state.happiness < 35 || state.stability < 35) cooldown = Math.max(1, cooldown - 1);
        state.eventControl.lastEventTurn = state.turn;
        state.eventControl.nextAllowedTurn = state.turn + cooldown;
    },

    _applyDiplomacyPacts: function() {
        if (!state || !state.diplomacy) return;
        for (var nid in state.diplomacy) {
            var d = this._normalizeDiploState(state.diplomacy[nid]);
            var atWar = d.relation === 'war';
            var termBoost = 0;

            if (!atWar && d.pacts.tradeUntil >= state.turn) {
                state.resources.gold += 4;
                state.resources.food = Math.max(0, state.resources.food - 1);
                d.opinion = Math.min(100, d.opinion + 1);
                d.trust = Math.min(100, d.trust + 1);
            }
            if (!atWar && d.pacts.researchUntil >= state.turn) {
                state.resources.science += 3;
                state.resources.gold = Math.max(0, state.resources.gold - 1);
                d.trust = Math.min(100, d.trust + 1);
            }
            if (!atWar && d.pacts.culturalUntil >= state.turn) {
                state.resources.culture += 3;
                if (state.turn % 3 === 0) state.happiness = Math.min(100, state.happiness + 1);
                d.opinion = Math.min(100, d.opinion + 1);
            }
            if (d.pacts.nonAggressionUntil >= state.turn && d.tension > 0) {
                d.tension = Math.max(0, d.tension - 1);
            }

            if (d.terms.marriageUntil >= state.turn) {
                termBoost += 2;
                d.trust = Math.min(100, d.trust + 1);
                d.tension = Math.max(0, d.tension - 1);
            }
            if (d.terms.oathUntil >= state.turn) {
                termBoost += 1;
                d.trust = Math.min(100, d.trust + 1);
            }
            if (d.terms.giftScore > 0 && (state.turn - d.terms.lastGiftTurn) >= 3) {
                d.terms.giftScore = Math.max(0, d.terms.giftScore - 1);
            }
            if (!atWar && termBoost > 0) d.opinion = Math.min(100, d.opinion + termBoost);

            state.diplomacy[nid] = d;
        }
    },

    _applyVassalSystem: function() {
        if (!state || !state.diplomacy) return;
        var vassalCount = 0;
        for (var nid in state.diplomacy) {
            var d = this._normalizeDiploState(state.diplomacy[nid]);
            if (d.vassalage.status !== 'your_vassal') {
                state.diplomacy[nid] = d;
                continue;
            }
            vassalCount++;

            var tr = Math.max(0.06, Math.min(0.25, d.vassalage.tributeRate || 0.1));
            var tGold = Math.max(4, Math.floor(8 + state.eraIndex * 2 + d.trust * 0.05 + tr * 30));
            var tProd = Math.max(1, Math.floor(2 + state.eraIndex * 0.7 + tr * 10));
            state.resources.gold += tGold;
            state.resources.prod += tProd;

            d.relation = 'allied';
            d.pacts.nonAggressionUntil = Math.max(d.pacts.nonAggressionUntil, state.turn + 4);
            d.opinion = Math.max(30, d.opinion - 1);
            d.tension = Math.min(100, d.tension + (state.happiness < 40 ? 2 : 0));

            var revoltRisk = 0.01 + Math.max(0, (65 - d.trust) / 3000) + Math.max(0, (d.tension - 70) / 1200);
            if (state.stability < 35) revoltRisk += 0.02;
            if (Math.random() < revoltRisk) {
                var nDef = AI_NATIONS.find(function(nn){ return nn.id === nid; });
                var nLabel = nDef ? safeLabel(nDef.name, humanizeId(nDef.id)) : humanizeId(nid);
                d.vassalage.status = 'none';
                d.vassalage.sinceTurn = 0;
                d.vassalage.tributeRate = 0;
                d.relation = 'hostile';
                d.tension = Math.min(100, d.tension + 20);
                d.trust = Math.max(0, d.trust - 15);
                UI.toast('Revolte vassale: ' + nLabel + ' rompt la suzerainete.', 'danger');
            }
            state.diplomacy[nid] = this._normalizeDiploState(d);
        }
        if (vassalCount > 0) {
            state.prestige += Math.min(3, vassalCount);
        }
    },

    _updateCultureState: function() {
        if (!state) return;
        state.cultureState = state.cultureState || {masterpieces:0,festivals:0,heritage:0,softPower:0,lastFestivalTurn:0,projectsDone:{}};
        var cst = state.cultureState;
        cst.poets = Math.max(0, Math.floor(cst.poets || 0));
        cst.artists = Math.max(0, Math.floor(cst.artists || 0));
        cst.works = Array.isArray(cst.works) ? cst.works : [];
        var soft = 5;
        soft += cst.masterpieces * 3;
        soft += cst.heritage * 4;
        soft += cst.festivals * 2;
        soft += cst.poets;
        soft += cst.artists * 2;
        soft += Math.floor(cst.works.length / 3);
        soft += Math.floor(state.prestige / 6);
        soft += Math.floor(state.resources.culture / 45);
        soft += Math.floor((state.happiness + state.stability) / 40);
        cst.softPower = Math.max(0, Math.floor(soft));
    },

    _applyCulturalInfluence: function() {
        if (!state || !state.diplomacy || !state.cultureState) return;
        var soft = state.cultureState.softPower || 0;
        for (var nid in state.diplomacy) {
            var d = this._normalizeDiploState(state.diplomacy[nid]);
            if (d.relation === 'war') {
                d.culturalPressure = Math.max(0, d.culturalPressure - 1);
                state.diplomacy[nid] = d;
                continue;
            }

            var delta = Math.floor(soft / 18);
            if (d.embassy) delta += 1;
            if (d.pacts.culturalUntil >= state.turn) delta += 2;
            if (d.relation === 'hostile') delta -= 1;
            if (d.tension > 60) delta -= 1;
            d.culturalPressure = Math.max(0, Math.min(100, d.culturalPressure + delta));

            if (d.culturalPressure >= 55) {
                d.opinion = Math.min(100, d.opinion + 1);
                d.trust = Math.min(100, d.trust + 1);
                if (state.turn % 4 === 0) d.tension = Math.max(0, d.tension - 1);
            }
            state.diplomacy[nid] = d;
        }
    },

    _processCreativeWorks: function() {
        if (!state || !state.cultureState) return;
        var cs = state.cultureState;
        cs.artProgress = cs.artProgress || 0;
        cs.works = Array.isArray(cs.works) ? cs.works : [];

        var poets = Math.max(0, Math.floor(cs.poets || 0));
        var artists = Math.max(0, Math.floor(cs.artists || 0));
        if (poets + artists <= 0) return;

        var gain = poets * 1.3 + artists * 1.8;
        gain += Math.max(0, (state.happiness - 45) / 18);
        gain += Math.max(0, (state.stability - 45) / 28);
        gain += Math.min(4, (cs.heritage || 0) * 0.2);
        cs.artProgress += gain;

        var threshold = Math.max(9, 17 - Math.floor((cs.heritage || 0) / 2));
        var created = 0;
        while (cs.artProgress >= threshold && created < 3) {
            cs.artProgress -= threshold;
            threshold += 1.5;

            var artType = (Math.random() < (poets / Math.max(1, poets + artists))) ? 'Poeme' : 'Oeuvre';
            var quality = 3 + Math.floor(Math.random() * 4) + Math.floor(state.eraIndex / 2) + Math.floor((artists + poets) / 4);
            quality = Math.max(1, Math.min(10, quality));
            var title = this._generateArtworkTitle(artType);
            var work = {
                id: 'work_' + state.turn + '_' + Math.floor(Math.random() * 100000),
                title: title,
                type: artType,
                quality: quality,
                turn: state.turn,
                era: ERAS[state.eraIndex] ? ERAS[state.eraIndex].id : 'antiquite'
            };

            cs.works.push(work);
            if (cs.works.length > 80) cs.works.shift();
            state.resources.culture += 4 + quality;
            state.prestige += Math.max(1, Math.floor(quality / 3));
            if (quality >= 8) cs.masterpieces = (cs.masterpieces || 0) + 1;
            created++;
        }

        if (created > 0) {
            state.happiness = Math.min(100, state.happiness + Math.min(2, created));
            if (!this._realtime || Math.random() < 0.35) UI.toast('Ateliers d art: ' + created + ' oeuvre(s) creee(s).', 'success');
        }
    },

    _generateArtworkTitle: function(type) {
        var p = ['Chant', 'Echo', 'Lumiere', 'Memoire', 'Horizon', 'Serment', 'Legende', 'Symphonie'];
        var s = ['des Rois', 'de la Cite', 'du Fleuve', 'des Anciens', 'du Peuple', 'du Matin', 'des Saisons', 'du Fer'];
        var base = p[Math.floor(Math.random() * p.length)] + ' ' + s[Math.floor(Math.random() * s.length)];
        if (type === 'Poeme') return 'Poeme: ' + base;
        return 'Oeuvre: ' + base;
    },

    hirePoet: function() {
        if (!state || !state.cultureState) return;
        var costGold = 35;
        var costCulture = 15;
        if (state.resources.gold < costGold || state.resources.culture < costCulture) {
            UI.toast('Il faut ' + costGold + ' Or et ' + costCulture + ' Culture.', 'warning');
            return;
        }
        state.resources.gold -= costGold;
        state.resources.culture -= costCulture;
        state.cultureState.poets = Math.max(0, Math.floor(state.cultureState.poets || 0)) + 1;
        UI.toast('Un poete rejoint la cour.', 'success');
        UI.updateAll();
    },

    hireArtist: function() {
        if (!state || !state.cultureState) return;
        var costGold = 55;
        var costProd = 20;
        var costCulture = 20;
        if (state.resources.gold < costGold || state.resources.prod < costProd || state.resources.culture < costCulture) {
            UI.toast('Il faut ' + costGold + ' Or, ' + costProd + ' Prod et ' + costCulture + ' Culture.', 'warning');
            return;
        }
        state.resources.gold -= costGold;
        state.resources.prod -= costProd;
        state.resources.culture -= costCulture;
        state.cultureState.artists = Math.max(0, Math.floor(state.cultureState.artists || 0)) + 1;
        UI.toast('Un artiste rejoint les ateliers.', 'success');
        UI.updateAll();
    },

    _recalc: function() {
        var r = {gold:2,food:2,prod:1,science:1,culture:1};
        var memoBonus = {gold:0,food:0,prod:0,science:0,culture:0,defense:0,militaryPower:0};

        // Territory resources from map
        var mapRes = WorldMap.getPlayerResources();
        r.food += mapRes.food; r.prod += mapRes.prod; r.gold += mapRes.gold;

        // Buildings
        for (var bid in state.buildings) {
            var bd = BUILDINGS.find(function(b){return b.id===bid;});
            if (!bd) continue;
            var cnt = state.buildings[bid];
            if(bd.effect.goldRate) r.gold+=bd.effect.goldRate*cnt;
            if(bd.effect.foodRate) r.food+=bd.effect.foodRate*cnt;
            if(bd.effect.prodRate) r.prod+=bd.effect.prodRate*cnt;
            if(bd.effect.scienceRate) r.science+=bd.effect.scienceRate*cnt;
            if(bd.effect.cultureRate) r.culture+=bd.effect.cultureRate*cnt;
        }

        // Memoriapolis district bonuses
        if (state.memoriapolis && state.memoriapolis.enabled && state.mapData) {
            for (var rr = 0; rr < WorldMap.ROWS; rr++) {
                for (var cc = 0; cc < WorldMap.COLS; cc++) {
                    var t = state.mapData[rr][cc];
                    if (!t || t.owner !== 'player') continue;
                    WorldMap._ensureTileBuildingData(t);
                    var mDef = this.getMemoLevelDef(t.districtLevel || 0);
                    if (!mDef || !mDef.bonuses) continue;
                    memoBonus.gold += mDef.bonuses.gold || 0;
                    memoBonus.food += mDef.bonuses.food || 0;
                    memoBonus.prod += mDef.bonuses.prod || 0;
                    memoBonus.science += mDef.bonuses.science || 0;
                    memoBonus.culture += mDef.bonuses.culture || 0;
                    memoBonus.defense += mDef.bonuses.defense || 0;
                    memoBonus.militaryPower += mDef.bonuses.militaryPower || 0;
                }
            }
            r.gold += memoBonus.gold;
            r.food += memoBonus.food;
            r.prod += memoBonus.prod;
            r.science += memoBonus.science;
            r.culture += memoBonus.culture;
        }

        // Government
        var gov = GOVERNMENTS[state.government];
        if (gov&&gov.bonuses) {
            if(gov.bonuses.goldRate) r.gold=Math.floor(r.gold*(1+gov.bonuses.goldRate));
            if(gov.bonuses.foodRate) r.food=Math.floor(r.food*(1+gov.bonuses.foodRate));
            if(gov.bonuses.prodRate) r.prod=Math.floor(r.prod*(1+gov.bonuses.prodRate));
            if(gov.bonuses.scienceRate) r.science=Math.floor(r.science*(1+gov.bonuses.scienceRate));
            if(gov.bonuses.cultureRate) r.culture=Math.floor(r.culture*(1+gov.bonuses.cultureRate));
        }

        // Policies
        r.gold += Math.floor(state.policies.taxes * 0.3);
        r.science += Math.floor(state.policies.education_p * 0.2);
        r.gold -= Math.floor(state.policies.education_p * 0.08);
        r.culture += Math.floor(state.policies.liberte * 0.1);
        r.culture += Math.floor(state.policies.religion * 0.05);
        r.science -= Math.floor(state.policies.religion * 0.05);
        // Expanded public budget: sector benefits carry recurring treasury costs.
        var policy = state.policies;
        r.gold -= Math.floor((policy.sante || 0) * 0.12);
        r.gold -= Math.floor((policy.infrastructure_p || 0) * 0.17);
        r.gold -= Math.floor((policy.securite_p || 0) * 0.10);
        r.prod += Math.floor((policy.infrastructure_p || 0) * 0.13);

        // Decrees
        state.activeDecrees.forEach(function(ad) {
            var dd = DECREES.find(function(x){return x.id===ad.id;});
            if (!dd) return;
            if(dd.effect.goldRate) r.gold+=dd.effect.goldRate;
            if(dd.effect.foodRate) r.food+=dd.effect.foodRate;
            if(dd.effect.prodRate) r.prod+=dd.effect.prodRate;
            if(dd.effect.scienceRate) r.science+=dd.effect.scienceRate;
            if(dd.effect.cultureRate) r.culture+=dd.effect.cultureRate;
        });

        // Temp bonuses
        state.tempBonuses.forEach(function(b) { if(r[b.stat]!==undefined) r[b.stat]+=b.value; });

        // Population bonus
        r.gold += Math.floor(state.population / 200);
        r.food -= Math.floor(state.population / 400);
        if (state.cultureState) {
            r.culture += Math.floor((state.cultureState.masterpieces || 0) * 0.8);
            r.culture += Math.floor((state.cultureState.heritage || 0) * 1.2);
            r.gold += Math.floor((state.cultureState.festivals || 0) * 0.3);
            r.culture += Math.floor((state.cultureState.poets || 0) * 0.7);
            r.culture += Math.floor((state.cultureState.artists || 0) * 1.1);
            r.culture += Math.floor((state.cultureState.works ? state.cultureState.works.length : 0) * 0.2);
        }

        // Difficulty
        r.gold=Math.floor(r.gold*state.dm.r);
        r.food=Math.floor(r.food*state.dm.r);
        r.prod=Math.floor(r.prod*state.dm.r);

        r.gold=Math.max(r.gold,-20); r.food=Math.max(r.food,-10);
        state.rates = r;

        // Military power
        var mp = 0;
        var unitCount = 0;
        for (var uid in state.army) {
            var ud=UNITS.find(function(u){return u.id===uid;});
            if(ud) {
                var cnt = state.army[uid] || 0;
                unitCount += cnt;
                mp += ud.power * cnt;
            }
        }
        for (var bid2 in state.buildings) { var bd2=BUILDINGS.find(function(b){return b.id===bid2;}); if(bd2&&bd2.effect.militaryPower) mp+=bd2.effect.militaryPower*state.buildings[bid2]; }
        var milLevel = 1 + Math.floor(unitCount / 6) + Math.floor(mp / 140);
        milLevel = Math.max(1, Math.min(10, milLevel));
        state.militaryLevel = milLevel;
        mp += milLevel * 2;
        mp += memoBonus.militaryPower;
        if(gov&&gov.bonuses&&gov.bonuses.militaryPower) mp=Math.floor(mp*(1+gov.bonuses.militaryPower));
        state.militaryPower = mp;

        // Defense
        var def = 5;
        for (var bid3 in state.buildings) { var bd3=BUILDINGS.find(function(b){return b.id===bid3;}); if(bd3&&bd3.effect.defense) def+=bd3.effect.defense*state.buildings[bid3]; }
        def += Math.floor(milLevel * 1.5);
        def += memoBonus.defense;
        state.defense = def;

        // Territory from map
        state.territory = WorldMap.countPlayerTiles();
    },

    _aiTurn: function() {
        AI_NATIONS.forEach(function(n) {
            var d = Game._normalizeDiploState(state.diplomacy[n.id]); if (!d) return;
            if (d.vassalage.status === 'your_vassal') {
                d.relation = 'allied';
                d.opinion = Math.max(30, d.opinion - 1);
                d.trust = Math.max(20, d.trust - (state.turn % 4 === 0 ? 1 : 0));
                if (d.terms.marriageUntil >= state.turn || d.terms.oathUntil >= state.turn) {
                    d.trust = Math.min(100, d.trust + 1);
                    d.tension = Math.max(0, d.tension - 1);
                } else {
                    d.tension = Math.min(100, d.tension + (state.happiness < 35 ? 1 : 0));
                }
                state.diplomacy[n.id] = Game._normalizeDiploState(d);
                return;
            }
            var drift = (Math.random()-0.5)*6;
            if(n.personality==='aggressive'||n.personality==='militarist') drift-=2;
            if(n.personality==='diplomatic') drift+=2;
            if(n.personality==='expansionist') drift-=1;
            if (d.embassy) drift += 1;
            if (d.pacts.tradeUntil >= state.turn) drift += 1;
            if (d.pacts.culturalUntil >= state.turn) drift += 1;
            if (d.terms.marriageUntil >= state.turn) drift += 1;
            if (d.terms.oathUntil >= state.turn) drift += 0.8;
            if (d.grievances > 40) drift -= 1.5;
            drift += (d.trust - 50) * 0.03;
            drift -= (d.tension - 40) * 0.04;
            if (d.relation==='war') {
                var ep = 10+state.turn*3*state.dm.a;
                var dmg = Math.max(1,Math.floor((ep-state.defense)*0.3));
                if(dmg>0){state.resources.gold-=Math.floor(dmg*2);state.population-=Math.floor(dmg*5);state.happiness-=3;}
                d.tension = Math.min(100, d.tension + 2);
                if(Math.random()<0.1||state.militaryPower>ep*1.5){d.relation='neutral';d.opinion=35;d.trust=Math.max(20,d.trust-5);d.tension=50;state.prestige+=10;UI.toast('Victoire contre '+n.name+' !','success');}
            }
            d.opinion=Math.max(0,Math.min(100,d.opinion+drift));
            if(d.relation!=='war'&&d.relation!=='allied'){
                if(d.opinion>70)d.relation='friendly';else if(d.opinion<25)d.relation='hostile';else d.relation='neutral';
            }
            if (d.relation === 'hostile') d.tension = Math.min(100, d.tension + 2);
            else d.tension = Math.max(0, d.tension - 1);

            var canStartWar = d.pacts.nonAggressionUntil < state.turn && d.terms.marriageUntil < state.turn && d.terms.oathUntil < state.turn;
            if(d.relation==='hostile'&&canStartWar&&Math.random()<0.03*state.dm.a*(1+d.tension/100)){d.relation='war';d.opinion=0;d.trust=Math.max(0,d.trust-15);UI.toast(safeLabel(n.name, humanizeId(n.id))+' vous declare la guerre !','danger');}
            state.diplomacy[n.id] = Game._normalizeDiploState(d);
        });
    },

    _aiExpand: function() {
        if (!state.mapData) return;
        AI_NATIONS.forEach(function(n) {
            if (Math.random() > 0.3) return;
            // Find a border tile to expand
            for (var r=0;r<WorldMap.ROWS;r++) for(var c=0;c<WorldMap.COLS;c++) {
                if (state.mapData[r][c].owner === n.id) {
                    for(var dr=-1;dr<=1;dr++) for(var dc=-1;dc<=1;dc++) {
                        var nr=r+dr,nc=c+dc;
                        if(nr>=0&&nr<WorldMap.ROWS&&nc>=0&&nc<WorldMap.COLS) {
                            var tile = state.mapData[nr][nc];
                            if(!tile.owner && WorldMap.TERRAIN[tile.terrain].movable && Math.random()<0.08) {
                                tile.owner = n.id;
                                return;
                            }
                        }
                    }
                }
            }
        });
    }
};


// ============================
//  UI — Interface
// ============================
var UI = {
    currentFilter: 'all',
    currentUnitFilter: 'all',
    currentMapBuildFilter: 'all',

    tab: function(tabId) {
        var map = { nation:'overview', tech:'research', army:'military', diplo:'diplomacy', laws:'politics', people:'population' };
        this.switchTab(map[tabId] || tabId);
    },

    switchTab: function(tabId) {
        document.querySelectorAll('.tab').forEach(function(t){t.classList.remove('active');});
        var tabBtn = document.querySelector('.tab[data-tab="'+tabId+'"]');
        if (tabBtn) tabBtn.classList.add('active');

        var tabContent = document.getElementById('tab-content');
        var mapPanel = document.getElementById('panel-map');
        document.querySelectorAll('.tab-panel').forEach(function(p){
            if (p.id !== 'panel-map') p.classList.remove('active');
        });
        if (mapPanel) mapPanel.classList.add('active');

        if (tabId !== 'map') {
            var panel = document.getElementById('panel-'+tabId);
            if (panel) panel.classList.add('active');
            if (tabContent) tabContent.classList.add('has-window');
            this.closeMapBuildWindow();
        } else {
            if (tabContent) tabContent.classList.remove('has-window');
        }

        WorldMap._resize();
        WorldMap.render();
        var quickBuild = document.getElementById('map-build-window');
        if (quickBuild && !quickBuild.classList.contains('hidden')) this.renderMapBuildWindow();
        if (tabId==='build') this.renderBuildings();
        if (tabId==='research') this.renderResearch();
        if (tabId==='military') this.renderMilitary();
        if (tabId==='diplomacy') this.renderDiplomacy();
        if (tabId==='politics') this.renderPolitics();
        if (tabId==='population') this.renderPopulation();
    },

    openMapBuildWindow: function(r, c) {
        this.switchTab('map');
        if (typeof r === 'number' && typeof c === 'number' && state && state.mapData) {
            WorldMap.selectedTile = { r:r, c:c };
            WorldMap._showTileInfo({ r:r, c:c });
            WorldMap.render();
        }
        var win = document.getElementById('map-build-window');
        if (!win) return;
        win.classList.remove('hidden');
        this.renderMapBuildWindow();
    },

    closeMapBuildWindow: function() {
        var win = document.getElementById('map-build-window');
        if (win) win.classList.add('hidden');
    },

    filterMapBuild: function(cat, evt) {
        this.currentMapBuildFilter = cat;
        document.querySelectorAll('#map-build-window .map-window-filter .cat-btn').forEach(function(btn){btn.classList.remove('active');});
        var target = evt && evt.target ? evt.target : ((typeof event !== 'undefined' && event) ? event.target : null);
        if (target) target.classList.add('active');
        this.renderMapBuildWindow();
    },

    renderMapBuildWindow: function() {
        var targetEl = document.getElementById('map-build-target');
        var listEl = document.getElementById('map-buildings-list');
        if (!targetEl || !listEl || !state) return;

        var selectedTarget = null;
        if (WorldMap.selectedTile) {
            var sr = WorldMap.selectedTile.r;
            var sc = WorldMap.selectedTile.c;
            if (sr>=0 && sr<WorldMap.ROWS && sc>=0 && sc<WorldMap.COLS) {
                var tile = state.mapData[sr][sc];
                if (tile && tile.owner === 'player' && WorldMap.TERRAIN[tile.terrain].movable) {
                    selectedTarget = { r:sr, c:sc };
                }
            }
        }
        targetEl.textContent = selectedTarget
            ? ('Case cible: ['+selectedTarget.c+','+selectedTarget.r+']')
            : 'Case cible: capitale / territoire auto';

        var filter = this.currentMapBuildFilter;
        var html = '';
        BUILDINGS.forEach(function(b){
            var bEra = ERAS.findIndex(function(e){return e.id===b.era;});
            if (bEra > state.eraIndex) return;
            if (filter !== 'all' && b.cat !== filter) return;
            var unlocked = Game._isBuildingUnlocked(b.id);
            var canAfford = (!b.cost.gold||state.resources.gold>=b.cost.gold)&&(!b.cost.prod||state.resources.prod>=b.cost.prod);
            var disabled = !unlocked || !canAfford;
            var reason = '';
            if (!unlocked) reason = 'Requiert: ' + (b.tech || '?');
            else if (!canAfford) reason = 'Ressources insuffisantes';

            var icon = safeIcon(b.icon, UI_ICONS.building);
            var name = safeLabel(b.name, humanizeId(b.id));
            var desc = safeLabel(b.desc, '');

            html += '<div class="map-build-item">';
            html += '<div class="map-build-top"><span class="map-build-name">'+icon+' '+name+'</span><span class="map-build-cost">'+UI_ICONS.gold+(b.cost.gold||0)+' '+UI_ICONS.prod+(b.cost.prod||0)+'</span></div>';
            if (desc) html += '<div class="map-build-desc">'+desc+'</div>';
            html += '<button onclick="UI.buildFromMap(\''+b.id+'\')"'+(disabled?' disabled':'')+'>Construire</button>';
            if (reason) html += '<div class="map-build-lock">'+reason+'</div>';
            html += '</div>';
        });

        listEl.innerHTML = decodeMojibakeText(html || '<em>Aucun batiment dispo.</em>');
    },

    buildFromMap: function(bid) {
        if (!state || !state.mapData) return;
        var target = null;
        var hasManualTarget = false;
        if (WorldMap.selectedTile) {
            var sr = WorldMap.selectedTile.r;
            var sc = WorldMap.selectedTile.c;
            if (sr>=0 && sr<WorldMap.ROWS && sc>=0 && sc<WorldMap.COLS) {
                var selectedTile = state.mapData[sr][sc];
                if (selectedTile && selectedTile.owner === 'player' && WorldMap.TERRAIN[selectedTile.terrain].movable) {
                    target = { r:sr, c:sc };
                    hasManualTarget = true;
                }
            }
        }
        if (hasManualTarget && target) {
            WorldMap.selectedTile = { r:target.r, c:target.c };
        } else {
            // Let placement logic auto-distribute across territory.
            WorldMap.selectedTile = null;
        }
        Game.build(bid);
        this.renderMapBuildWindow();
    },

    updateAll: function() {
        if (!state) return;
        Game._updateCultureState();
        Game._recalc();
        Game._updateRealtimeUI();

        var era = ERAS[state.eraIndex];
        document.getElementById('era-badge').textContent = safeLabel(era.name, humanizeId(era.id));
        document.getElementById('year-display').textContent = state.year<0 ? Math.abs(state.year)+' av.JC' : state.year;
        document.getElementById('turn-number').textContent = state.turn;

        var currentRes = {
            gold: Math.floor(state.resources.gold),
            food: Math.floor(state.resources.food),
            prod: Math.floor(state.resources.prod),
            science: Math.floor(state.resources.science),
            culture: Math.floor(state.resources.culture),
            military: Math.floor(state.militaryPower)
        };
        document.getElementById('res-gold').textContent = currentRes.gold;
        document.getElementById('res-food').textContent = currentRes.food;
        document.getElementById('res-prod').textContent = currentRes.prod;
        document.getElementById('res-science').textContent = currentRes.science;
        document.getElementById('res-culture').textContent = currentRes.culture;
        document.getElementById('res-military').textContent = currentRes.military;
        this._applyResourceDeltaFx(currentRes);
        var memoBtn = document.getElementById('memo-toggle');
        if (memoBtn) {
            var memoOn = !!(state.memoriapolis && state.memoriapolis.enabled);
            memoBtn.textContent = 'Memoriapolis: ' + (memoOn ? 'ON' : 'OFF');
            memoBtn.classList.toggle('is-active', memoOn);
        }

        this._rate('rate-gold',state.rates.gold); this._rate('rate-food',state.rates.food);
        this._rate('rate-prod',state.rates.prod); this._rate('rate-science',state.rates.science);
        this._rate('rate-culture',state.rates.culture);

        state.stability=Math.max(0,Math.min(100,Math.round(state.stability)));
        state.happiness=Math.max(0,Math.min(100,Math.round(state.happiness)));
        document.getElementById('stability-fill').style.width=state.stability+'%';
        document.getElementById('stability-val').textContent=state.stability+'%';
        document.getElementById('happiness-fill').style.width=state.happiness+'%';
        document.getElementById('happiness-val').textContent=state.happiness+'%';

        // Overview
        document.getElementById('ov-nation-name').textContent=decodeMojibakeText(state.nationName);
        document.getElementById('ov-ruler').textContent=decodeMojibakeText(state.rulerName);
        var govName = GOVERNMENTS[state.government] ? GOVERNMENTS[state.government].name : state.government;
        document.getElementById('ov-gov').textContent = safeLabel(govName, humanizeId(state.government));
        document.getElementById('ov-pop').textContent=this._fmt(state.population);
        document.getElementById('ov-territory').textContent=state.territory+' cases';
        document.getElementById('ov-prestige').textContent=state.prestige;

        var bL=[];for(var bid in state.buildings){var b=BUILDINGS.find(function(x){return x.id===bid;});if(b)bL.push(safeIcon(b.icon,UI_ICONS.building)+' '+safeLabel(b.name,humanizeId(bid))+' x'+state.buildings[bid]);}
        document.getElementById('ov-buildings').innerHTML=decodeMojibakeText(bL.length?bL.join('<br>'):'<em>Aucun.</em>');

        if(state.currentResearch){var t=TECHNOLOGIES.find(function(x){return x.id===state.currentResearch.techId;});if(t){var p=Math.min(100,Math.floor(state.currentResearch.progress/t.cost*100));document.getElementById('ov-research').innerHTML=decodeMojibakeText(safeIcon(t.icon,UI_ICONS.science)+' '+safeLabel(t.name,humanizeId(t.id))+' - '+p+'%');}}
        else document.getElementById('ov-research').innerHTML=decodeMojibakeText('<em>Aucune.</em>');

        var aL=[];for(var uid in state.army){var u=UNITS.find(function(x){return x.id===uid;});if(u)aL.push(safeIcon(u.icon,UI_ICONS.unit)+' '+safeLabel(u.name,humanizeId(uid))+' x'+state.army[uid]);}
        document.getElementById('ov-army').innerHTML=decodeMojibakeText(aL.length?aL.join('<br>'):'<em>Aucune unite.</em>');

        // Advisors
        var adv=[];
        if(state.resources.food<30) adv.push('<b>Agriculture:</b> Nourriture critique.');
        if(state.happiness<35) adv.push('<b>Interieur:</b> Peuple mecontent.');
        if(state.stability<30) adv.push('<b>Conseil:</b> Stabilite faible.');
        if(state.resources.gold<20) adv.push('<b>Finances:</b> Tresor faible.');
        if(!state.currentResearch) adv.push('<b>Science:</b> Lancez une recherche.');
        if(Object.keys(state.army).length===0) adv.push('<b>General:</b> Aucune armee.');
        var atW=false;for(var nid in state.diplomacy)if(state.diplomacy[nid].relation==='war')atW=true;
        if(atW) adv.push('<b>General:</b> Nous sommes en guerre.');
        document.getElementById('ov-advisors').innerHTML=decodeMojibakeText(adv.length?adv.join('<br><br>'):'RAS.');

        var dL=[];AI_NATIONS.forEach(function(n){var d=state.diplomacy[n.id];if(d){var rl={neutral:'Neutre',friendly:'Amical',hostile:'Hostile',war:'Guerre',allied:'Allie'};dL.push(safeLabel(n.name, humanizeId(n.id))+' - '+(rl[d.relation]||d.relation));}});
        document.getElementById('ov-diplo').innerHTML=decodeMojibakeText(dL.length?dL.join('<br>'):'Aucune relation.');

        // Re-render active tab
        var at=document.querySelector('.tab.active');
        if(at){var tid=at.getAttribute('data-tab');
            if(tid==='build')this.renderBuildings();if(tid==='research')this.renderResearch();
            if(tid==='military')this.renderMilitary();if(tid==='diplomacy')this.renderDiplomacy();
            if(tid==='politics')this.renderPolitics();if(tid==='population')this.renderPopulation();
        }
        var quickBuild = document.getElementById('map-build-window');
        if (quickBuild && !quickBuild.classList.contains('hidden')) this.renderMapBuildWindow();
    },

    renderBuildings: function() {
        var filter = this.currentFilter;
        var html = '';
        BUILDINGS.forEach(function(b) {
            var bEra = ERAS.findIndex(function(e){return e.id===b.era;});
            if (bEra > state.eraIndex) return;
            if (filter!=='all'&&b.cat!==filter) return;
            var bName = safeLabel(b.name, humanizeId(b.id));
            var bDesc = safeLabel(b.desc, '');
            var bIcon = safeIcon(b.icon, UI_ICONS.building);

            var unlocked = Game._isBuildingUnlocked(b.id);
            var count = state.buildings[b.id]||0;
            var canAfford = (!b.cost.gold||state.resources.gold>=b.cost.gold)&&(!b.cost.prod||state.resources.prod>=b.cost.prod);
            var cls = 'building-card';
            if(!unlocked)cls+=' locked'; if(count>0)cls+=' owned';

            var eff=[];
            var labels={goldRate:'Or/t',foodRate:'Nourr/t',prodRate:'Prod/t',scienceRate:'Sci/t',cultureRate:'Cul/t',militaryPower:'Force',defense:'Def',stability:'Stab',happiness:'Joie',prestige:'Prestige',popGrowth:'Croiss.'};
            for(var k in b.effect) eff.push('+'+b.effect[k]+' '+(labels[k]||k));

            html+='<div class="'+cls+'" onclick="Game.build(\''+b.id+'\')">';
            html+='<span class="b-era-tag">'+safeLabel(ERAS[bEra].name, ERAS[bEra].id)+'</span>';
            if(count>0) html+='<span class="b-count">x'+count+'</span>';
            html+='<span class="b-icon">'+bIcon+'</span>';
            html+='<div class="b-name">'+bName+'</div>';
            html+='<div class="b-desc">'+bDesc+'</div>';
            html+='<div class="b-cost">'+UI_ICONS.gold+(b.cost.gold||0)+' '+UI_ICONS.prod+(b.cost.prod||0)+'</div>';
            html+='<div class="b-effect">'+eff.join(', ')+'</div>';
            if(!unlocked) html+='<div class="b-lock">'+UI_ICONS.lock+' Requiert : '+(b.tech||'?')+'</div>';
            else if(!canAfford) html+='<div class="b-noafford">Ressources insuffisantes</div>';
            html+='</div>';
        });
        document.getElementById('buildings-list').innerHTML = decodeMojibakeText(html||'<em>Aucun batiment disponible.</em>');
    },

    filterBuildings: function(cat, evt) {
        this.currentFilter = cat;
        document.querySelectorAll('#panel-build .cat-btn').forEach(function(btn){btn.classList.remove('active');});
        var target = evt && evt.target ? evt.target : ((typeof event !== 'undefined' && event) ? event.target : null);
        if(target) target.classList.add('active');
        this.renderBuildings();
    },

    renderResearch: function() {
        var html = '';
        var navHtml = '';
        ERAS.forEach(function(era, idx){
            if (idx > state.eraIndex + 1) return;
            navHtml += '<button class="cat-btn'+(idx<=state.eraIndex?' active':'')+'" style="pointer-events:none">'+safeLabel(era.name, era.id)+'</button>';
        });
        document.getElementById('research-era-nav').innerHTML = decodeMojibakeText(navHtml);
        document.getElementById('tech-count').textContent = state.techs.length;

        TECHNOLOGIES.forEach(function(t){
            var tEra = ERAS.findIndex(function(e){ return e.id===t.era; });
            if (tEra > state.eraIndex + 1) return;
            var tName = safeLabel(t.name, humanizeId(t.id));
            var tIcon = safeIcon(t.icon, UI_ICONS.science);
            var done = state.techs.indexOf(t.id)!==-1;
            var inProg = state.currentResearch && state.currentResearch.techId===t.id;
            var hasP = t.prereqs.every(function(p){ return state.techs.indexOf(p)!==-1; });
            var locked = !hasP || tEra > state.eraIndex;

            var cls = 'tech-card';
            if (done) cls += ' researched';
            else if (inProg) cls += ' in-progress';
            else if (locked) cls += ' locked';

            html += '<div class="'+cls+'" onclick="Game.research(\''+t.id+'\')">';
            html += '<span class="t-icon">'+tIcon+'</span>';
            html += '<div class="t-name">'+tName+'</div>';
            html += '<div class="t-cost">'+UI_ICONS.science+' '+t.cost+'</div>';

            if (t.unlocks && t.unlocks.length > 0) {
                var uNames = t.unlocks.map(function(uid){
                    var b = BUILDINGS.find(function(x){ return x.id===uid; });
                    return b ? (safeIcon(b.icon, UI_ICONS.building)+' '+safeLabel(b.name, humanizeId(uid))) : humanizeId(uid);
                });
                html += '<div class="t-unlock">'+UI_ICONS.arrow+' '+uNames.join(', ')+'</div>';
            }

            var unlockedUnits = UNITS.filter(function(u){ return u.tech===t.id; });
            if (unlockedUnits.length > 0) {
                html += '<div class="t-unlock">'+UI_ICONS.unit+' '+unlockedUnits.map(function(u){
                    return safeIcon(u.icon, UI_ICONS.unit)+' '+safeLabel(u.name, humanizeId(u.id));
                }).join(', ')+'</div>';
            }

            if (inProg) {
                var pct = Math.min(100, Math.floor(state.currentResearch.progress / t.cost * 100));
                html += '<div class="tech-progress"><div class="tech-progress-fill" style="width:'+pct+'%"></div></div>';
            }
            if (done) {
                html += '<div style="color:var(--success);font-size:0.72rem;margin-top:3px">Terminee</div>';
            } else if (locked && t.prereqs.length > 0) {
                var pn = t.prereqs.map(function(pid){
                    var pt = TECHNOLOGIES.find(function(x){ return x.id===pid; });
                    return pt ? safeLabel(pt.name, pid) : pid;
                });
                html += '<div class="t-prereq">'+UI_ICONS.lock+' '+pn.join(', ')+'</div>';
            }
            html += '</div>';
        });
        document.getElementById('tech-tree').innerHTML = decodeMojibakeText(html);
    },

    renderMilitary: function() {
        var armyHtml = '';
        for (var uid in state.army) {
            var u = UNITS.find(function(x){ return x.id===uid; });
            if (!u) continue;
            var c = state.army[uid];
            armyHtml += '<div class="unit-row"><span class="u-name">'+safeIcon(u.icon,UI_ICONS.unit)+' '+safeLabel(u.name,humanizeId(u.id))+'</span><span class="u-count">x'+c+' (Pwr '+(u.power*c)+')</span></div>';
        }
        document.getElementById('army-list').innerHTML = decodeMojibakeText(armyHtml || '<em>Aucune unite.</em>');
        document.getElementById('army-power').textContent = state.militaryPower;
        document.getElementById('army-defense').textContent = state.defense;
        var lvlEl = document.getElementById('army-level');
        if (lvlEl) lvlEl.textContent = state.militaryLevel || 1;

        var rHtml = '';
        var flt = this.currentUnitFilter;
        var typeLabels = { melee:'Melee', ranged:'Distance', cavalry:'Cavalerie', siege:'Siege', naval:'Naval', air:'Aerien', special:'Special' };

        UNITS.forEach(function(u){
            var uEra = ERAS.findIndex(function(e){ return e.id===u.era; });
            if (uEra > state.eraIndex) return;
            if (flt!=='all' && u.type!==flt) return;

            var techOk = !u.tech || state.techs.indexOf(u.tech)!==-1;
            var canAfford = true;
            if (u.cost.gold && state.resources.gold<u.cost.gold) canAfford=false;
            if (u.cost.food && state.resources.food<u.cost.food) canAfford=false;
            if (u.cost.prod && state.resources.prod<u.cost.prod) canAfford=false;

            var locked = !techOk || !canAfford;
            var uName = safeLabel(u.name, humanizeId(u.id));
            var uIcon = safeIcon(u.icon, UI_ICONS.unit);
            rHtml += '<div class="recruit-card'+(locked?' locked':'')+'" onclick="Game.recruit(\''+u.id+'\')">';
            rHtml += '<div class="r-type">'+(typeLabels[u.type]||u.type)+' - '+safeLabel(ERAS[uEra].name, ERAS[uEra].id)+'</div>';
            rHtml += '<div class="r-name">'+uIcon+' '+uName+'</div>';
            rHtml += '<div class="r-stats">Pwr '+u.power+' | Entretien: '+UI_ICONS.gold+(u.upkeep.gold||0)+' '+UI_ICONS.food+(u.upkeep.food||0)+'/t</div>';
            var cp=[];
            if (u.cost.gold) cp.push(UI_ICONS.gold+u.cost.gold);
            if (u.cost.food) cp.push(UI_ICONS.food+u.cost.food);
            if (u.cost.prod) cp.push(UI_ICONS.prod+u.cost.prod);
            rHtml += '<div class="r-cost">'+cp.join(' ')+'</div>';
            if (!techOk) rHtml += '<div class="r-lock">'+UI_ICONS.lock+' '+u.tech+'</div>';
            rHtml += '</div>';
        });
        document.getElementById('recruit-list').innerHTML = decodeMojibakeText(rHtml);
    },

    filterUnits: function(type, evt) {
        this.currentUnitFilter = type;
        document.querySelectorAll('.recruit-filter .cat-btn').forEach(function(b){b.classList.remove('active');});
        var target = evt && evt.target ? evt.target : ((typeof event !== 'undefined' && event) ? event.target : null);
        if(target) target.classList.add('active');
        this.renderMilitary();
    },

    renderDiplomacy: function() {
        var html='';
        AI_NATIONS.forEach(function(n){
            var d=Game._normalizeDiploState(state.diplomacy[n.id]); if(!d)return;
            var nName = safeLabel(n.name, humanizeId(n.id));
            var nRuler = safeLabel(n.ruler, 'Dirigeant');
            var nPersona = safeLabel(n.personality, '');
            var rl={neutral:'Neutre',friendly:'Amical',hostile:'Hostile',war:'En Guerre',allied:'Allie'};
            var pacts = [];
            if (d.pacts.tradeUntil >= state.turn) pacts.push('Commerce ' + (d.pacts.tradeUntil - state.turn + 1) + 't');
            if (d.pacts.researchUntil >= state.turn) pacts.push('Recherche ' + (d.pacts.researchUntil - state.turn + 1) + 't');
            if (d.pacts.culturalUntil >= state.turn) pacts.push('Culture ' + (d.pacts.culturalUntil - state.turn + 1) + 't');
            if (d.pacts.nonAggressionUntil >= state.turn) pacts.push('Non-agression ' + (d.pacts.nonAggressionUntil - state.turn + 1) + 't');

            html+='<div class="nation-diplo-card">';
            html+='<div class="nd-name" style="color:'+n.color+'">'+nName+'</div>';
            html+='<div class="nd-relation '+d.relation+'">'+(rl[d.relation]||d.relation)+'</div>';
            html+='<div class="nd-stats">'+nRuler+' | '+nPersona+'</div>';
            html+='<div class="nd-stats">Opinion '+d.opinion+'/100 | Confiance '+d.trust+'/100 | Tension '+d.tension+'/100 | Pression culturelle '+d.culturalPressure+'/100</div>';
            if (d.embassy) html+='<div class="nd-stats" style="color:var(--info)">Ambassade etablie</div>';
            if (pacts.length) html+='<div class="nd-stats" style="color:var(--success)">Pactes: '+pacts.join(', ')+'</div>';
            html+='<div class="nd-actions">';
            if(d.relation!=='war'){
                html+='<button onclick="Game.diploAction(\''+n.id+'\',\'improve\')">+Rel (30'+UI_ICONS.gold+')</button>';
                html+='<button onclick="Game.diploAction(\''+n.id+'\',\'gift\')">Cadeau (70'+UI_ICONS.gold+')</button>';
                html+='<button onclick="Game.diploAction(\''+n.id+'\',\'embassy\')">Ambassade</button>';
                html+='<button onclick="Game.diploAction(\''+n.id+'\',\'trade\')">Echange (Nourr+Prod)</button>';
                html+='<button onclick="Game.diploAction(\''+n.id+'\',\'pact_trade\')">Pacte Commerce</button>';
                html+='<button onclick="Game.diploAction(\''+n.id+'\',\'pact_research\')">Pacte Recherche</button>';
                html+='<button onclick="Game.diploAction(\''+n.id+'\',\'pact_culture\')">Pacte Culture</button>';
                html+='<button onclick="Game.diploAction(\''+n.id+'\',\'pact_non_aggr\')">Non-agression</button>';
                html+='<button onclick="Game.diploAction(\''+n.id+'\',\'threaten\')">Menacer</button>';
                html+='<button onclick="Game.diploAction(\''+n.id+'\',\'denounce\')">Denoncer</button>';
                if(d.relation==='friendly') html+='<button onclick="Game.diploAction(\''+n.id+'\',\'ally\')">Alliance</button>';
                html+='<button class="btn-war" onclick="Game.diploAction(\''+n.id+'\',\'war\')">'+UI_ICONS.unit+' Guerre</button>';
            } else {
                html+='<button onclick="Game.diploAction(\''+n.id+'\',\'peace\')">Paix (50'+UI_ICONS.gold+')</button>';
            }
            html+='</div></div>';
            state.diplomacy[n.id] = d;
        });
        document.getElementById('nations-list').innerHTML=decodeMojibakeText(html);
    },

    renderPolitics: function() {
        var policyNames = {
            taxes: "Taux d'Imposition",
            conscription: 'Conscription',
            education_p: 'Budget Education',
            liberte: 'Liberte Civile',
            religion: 'Influence Religieuse',
            sante: 'Budget Santé', infrastructure_p: 'Investissement Public', securite_p: 'Sécurité Intérieure'
        };

        var policyEffects = {
            taxes: 'Or + / Bonheur -',
            conscription: 'Armee + / Prod & Bonheur -',
            education_p: 'Science + / Or -',
            liberte: 'Bonheur & Culture + / Stabilite -',
            religion: 'Stabilite + / Science -',
            sante: 'Bonheur & population + / Or -', infrastructure_p: 'Production + / Or -', securite_p: 'Stabilite + / Or & liberte -'
        };

        var decreeNames = {
            fete_nationale: 'Fete Nationale',
            mobilisation: 'Mobilisation Generale',
            reforme_agraire: 'Reforme Agraire',
            censure: 'Censure',
            grand_projet: 'Grand Projet National',
            espionnage: "Reseau d'Espionnage",
            libre_echange: 'Libre-echange',
            austerite: "Plan d'Austerite"
        };

        var sHtml = '<h4 style="font-family:var(--font-display);color:var(--accent);margin-bottom:10px">Politiques</h4>';
        POLICIES.forEach(function(p){
            var v = state.policies[p.id];
            var pName = safeLabel(p.name, policyNames[p.id] || humanizeId(p.id));
            if (!pName || /\?/.test(pName) || /[ÃÂâð]/.test(pName)) pName = policyNames[p.id] || humanizeId(p.id);
            var pEff = safeLabel(p.effectDesc, policyEffects[p.id] || '');
            if (!pEff || /\?/.test(pEff) || /[ÃÂâð]/.test(pEff)) pEff = policyEffects[p.id] || '';
            sHtml += '<div class="policy-item"><label><strong>'+pName+'</strong><span>'+v+'% - '+pEff+'</span></label>';
            sHtml += '<input type="range" class="policy-slider" min="'+p.min+'" max="'+p.max+'" value="'+v+'" oninput="Game.setPolicy(\''+p.id+'\',this.value)"></div>';
        });
        document.getElementById('policy-sliders').innerHTML = decodeMojibakeText(sHtml);

        var dHtml = '';
        DECREES.forEach(function(d){
            var active = state.activeDecrees.find(function(a){ return a.id===d.id; });
            var canA = true;
            if (d.cost.gold && state.resources.gold<d.cost.gold) canA=false;
            if (d.cost.prod && state.resources.prod<d.cost.prod) canA=false;

            var eff = [];
            var labels = {goldRate:'Or/t',foodRate:'Nourr/t',prodRate:'Prod/t',scienceRate:'Sci/t',cultureRate:'Cul/t',militaryPower:'Force',happiness:'Joie',stability:'Stab',prestige:'Prestige'};
            for (var k in d.effect) {
                var ev = d.effect[k];
                eff.push((ev>0?'+':'')+ev+' '+(labels[k]||k));
            }

            var dName = safeLabel(d.name, decreeNames[d.id] || humanizeId(d.id));
            if (!dName || /\?/.test(dName) || /[ÃÂâð]/.test(dName)) dName = decreeNames[d.id] || humanizeId(d.id);

            dHtml += '<div class="decree-card'+(active?' active-decree':'')+'" onclick="Game.activateDecree(\''+d.id+'\')">';
            dHtml += '<div class="d-name">'+dName+(active?' ('+active.turnsLeft+'t)':'')+'</div>';
            dHtml += '<div class="d-effect">'+eff.join(', ')+' - '+d.duration+'t</div>';
            var cp = [];
            if (d.cost.gold) cp.push(UI_ICONS.gold+d.cost.gold);
            if (d.cost.prod) cp.push(UI_ICONS.prod+d.cost.prod);
            dHtml += '<div class="d-cost">'+(cp.length?cp.join(' '):'Gratuit')+'</div>';
            dHtml += '</div>';
        });
        document.getElementById('decrees-list').innerHTML = decodeMojibakeText(dHtml);
    },

    renderPopulation: function() {
        var oHtml='<h4 style="font-family:var(--font-display);color:var(--accent);margin-bottom:6px">Demographie</h4>';
        oHtml+='<div>Population: <b>'+this._fmt(state.population)+'</b></div>';
        oHtml+='<div>Croissance: <b>~'+Math.round(state.popGrowthBase*100)+'%/tour</b></div>';
        oHtml+='<div>Bonheur: <b>'+state.happiness+'%</b></div>';
        oHtml+='<div class="pop-bar">';
        var cols={paysans:'#16a34a',artisans:'#f59e0b',marchands:'#3b82f6',nobles:'#8b5cf6',clerge:'#ec4899'};
        for(var cls in state.socialClasses){var sc=state.socialClasses[cls];oHtml+='<div class="pop-bar-segment" style="width:'+sc.pct+'%;background:'+cols[cls]+'">'+sc.pct+'%</div>';}
        oHtml+='</div>';
        document.getElementById('pop-overview').innerHTML=decodeMojibakeText(oHtml);

        var cHtml='<h4 style="font-family:var(--font-display);color:var(--accent);margin-bottom:6px">Classes sociales</h4>';
        var cNames={paysans:'Paysans',artisans:'Artisans',marchands:'Marchands',nobles:'Nobles',clerge:'Clerge'};
        for(var cls2 in state.socialClasses){var sc2=state.socialClasses[cls2];var pop=Math.floor(state.population*sc2.pct/100);
            cHtml+='<div class="class-card"><span>'+cNames[cls2]+' - '+this._fmt(pop)+'</span><span style="color:'+(sc2.happiness>50?'var(--success)':'var(--danger)')+'">Bonheur '+sc2.happiness+'%</span></div>';
        }
        document.getElementById('social-classes').innerHTML=decodeMojibakeText(cHtml);

        var cs = state.cultureState || {poets:0,artists:0,masterpieces:0,heritage:0,softPower:0,works:[]};
        cs.works = Array.isArray(cs.works) ? cs.works : [];
        var works = cs.works.slice(-10).reverse();
        var aHtml = '<h4>Culture et Art</h4>';
        aHtml += '<div class="culture-metrics">';
        aHtml += '<div class="culture-metric">Poetes<strong>'+Math.floor(cs.poets||0)+'</strong></div>';
        aHtml += '<div class="culture-metric">Artistes<strong>'+Math.floor(cs.artists||0)+'</strong></div>';
        aHtml += '<div class="culture-metric">Oeuvres<strong>'+works.length+'/'+cs.works.length+'</strong></div>';
        aHtml += '<div class="culture-metric">Chef-d oeuvre<strong>'+Math.floor(cs.masterpieces||0)+'</strong></div>';
        aHtml += '<div class="culture-metric">Patrimoine<strong>'+Math.floor(cs.heritage||0)+'</strong></div>';
        aHtml += '<div class="culture-metric">Soft Power<strong>'+Math.floor(cs.softPower||0)+'</strong></div>';
        aHtml += '</div>';
        aHtml += '<div class="culture-actions">';
        aHtml += '<button class="culture-btn" onclick="Game.hirePoet()">Recruter poete (35 Or, 15 Cul)</button>';
        aHtml += '<button class="culture-btn" onclick="Game.hireArtist()">Recruter artiste (55 Or, 20 Prod, 20 Cul)</button>';
        aHtml += '</div>';
        aHtml += '<div class="artworks-list">';
        if (!works.length) {
            aHtml += '<em>Aucune oeuvre recente. Recrutez poetes et artistes.</em>';
        } else {
            works.forEach(function(w){
                aHtml += '<div class="artwork-item">';
                aHtml += '<div class="artwork-title">'+safeLabel(w.title,'Oeuvre')+'</div>';
                aHtml += '<div class="artwork-meta">'+safeLabel(w.type,'Art')+' | Qualite '+(w.quality||1)+'/10 | Tour '+(w.turn||state.turn)+'</div>';
                aHtml += '</div>';
            });
        }
        aHtml += '</div>';
        var panel = document.getElementById('culture-art-panel');
        if (panel) panel.innerHTML = decodeMojibakeText(aHtml);
    },

    showEvent: function(icon,title,desc,choices) {
        document.getElementById('modal-icon').textContent=decodeMojibakeText(icon);
        document.getElementById('modal-title').textContent=decodeMojibakeText(title);
        document.getElementById('modal-desc').textContent=decodeMojibakeText(desc);
        var html='';
        choices.forEach(function(c,i){
            html+='<button class="modal-choice-btn" onclick="UI._applyChoice('+i+')">'+c.text;
            if(c.effect)html+='<span class="choice-effect">'+c.effect+'</span>';
            html+='</button>';
        });
        document.getElementById('modal-choices').innerHTML=decodeMojibakeText(html);
        document.getElementById('event-modal').classList.remove('hidden');
        this._choices=choices;
    },

    _applyChoice: function(i) {
        if(this._choices&&this._choices[i]&&this._choices[i].apply) this._choices[i].apply(state);
        this.closeModal();
        if(state) this.updateAll();
    },

    closeModal: function() { document.getElementById('event-modal').classList.add('hidden'); },

    toast: function(msg,type) {
        var el=document.createElement('div');el.className='toast '+(type||'');el.textContent=decodeMojibakeText(msg);
        document.getElementById('toast-container').appendChild(el);
        setTimeout(function(){el.classList.add('fade-out');setTimeout(function(){el.remove();},300);},3000);
    },

    _rate: function(id,v) {
        var el=document.getElementById(id);
        el.textContent='('+(v>=0?'+':'')+v+')';
        el.className='res-rate'+(v<0?' negative':'');
    },

    _applyResourceDeltaFx: function(currentRes) {
        if (!this._prevRes) {
            this._prevRes = {
                gold: currentRes.gold,
                food: currentRes.food,
                prod: currentRes.prod,
                science: currentRes.science,
                culture: currentRes.culture,
                military: currentRes.military
            };
            return;
        }

        var kinds = ['gold','food','prod','science','culture','military'];
        for (var i = 0; i < kinds.length; i++) {
            var kind = kinds[i];
            var prev = this._prevRes[kind];
            var now = currentRes[kind];
            if (prev === undefined || now === undefined || now === prev) continue;
            this._flashResource(kind, now > prev ? 'delta-up' : 'delta-down');
        }

        this._prevRes = {
            gold: currentRes.gold,
            food: currentRes.food,
            prod: currentRes.prod,
            science: currentRes.science,
            culture: currentRes.culture,
            military: currentRes.military
        };
    },

    _flashResource: function(kind, cls) {
        var card = document.querySelector('.resource[data-kind="'+kind+'"]');
        if (!card) return;
        card.classList.remove('delta-up', 'delta-down');
        void card.offsetWidth;
        card.classList.add(cls);

        this._resFxTimers = this._resFxTimers || {};
        if (this._resFxTimers[kind]) clearTimeout(this._resFxTimers[kind]);
        this._resFxTimers[kind] = setTimeout(function() {
            card.classList.remove('delta-up', 'delta-down');
        }, 780);
    },

    _fmt: function(n) {
        if(n>=1000000)return(n/1000000).toFixed(1)+'M';
        if(n>=1000)return(n/1000).toFixed(1)+'K';
        return ''+n;
    },

    _choices: null,
    _prevRes: null,
    _resFxTimers: null
};


// ============================
//  INIT
// ============================
document.addEventListener('DOMContentLoaded', function() {
    Game.showTitle();
});
