/* ═══════════════════════════════════════════════════════════
   BE THE KING — Moteur de Jeu Principal
   Simulation de Nation de l'Antiquité à l'Ère Moderne
   ═══════════════════════════════════════════════════════════ */

// ══════════════════════════════════════════════
//  DONNÉES DU JEU — Ères, Bâtiments, Techs...
// ══════════════════════════════════════════════

var ERAS = [
    { id: 'antiquite',     name: 'Antiquité',      yearStart: -4000, yearPerTurn: 50,  cssClass: '' },
    { id: 'medieval',      name: 'Moyen-Âge',      yearStart: 500,   yearPerTurn: 25,  cssClass: 'era-medieval' },
    { id: 'renaissance',   name: 'Renaissance',     yearStart: 1400,  yearPerTurn: 10,  cssClass: 'era-renaissance' },
    { id: 'industrielle',  name: 'Ère Industrielle',yearStart: 1750,  yearPerTurn: 5,   cssClass: 'era-industrielle' },
    { id: 'moderne',       name: 'Ère Moderne',     yearStart: 1900,  yearPerTurn: 2,   cssClass: 'era-moderne' },
    { id: 'contemporaine', name: 'Ère Contemporaine',yearStart: 1990, yearPerTurn: 1,   cssClass: 'era-contemporaine' }
];

var GOVERNMENTS = {
    monarchie:   { name: 'Monarchie',       icon: '👑', bonuses: { goldRate: 0.10, stability: 5 } },
    republique:  { name: 'République',       icon: '⚖️', bonuses: { scienceRate: 0.10, cultureRate: 0.05 } },
    theocratie:  { name: 'Théocratie',       icon: '🏛️', bonuses: { cultureRate: 0.15, stability: 10 } },
    militaire:   { name: 'État Militaire',   icon: '⚔️', bonuses: { militaryPower: 0.15, prodRate: 0.05 } },
    democratie:  { name: 'Démocratie',       icon: '🗳️', bonuses: { happiness: 10, scienceRate: 0.10, cultureRate: 0.05 } },
    communisme:  { name: 'Communisme',       icon: '☭',  bonuses: { prodRate: 0.20, foodRate: 0.10, happiness: -10 } },
    fascisme:    { name: 'Fascisme',         icon: '🦅', bonuses: { militaryPower: 0.25, prodRate: 0.15, happiness: -15 } },
    oligarchie:  { name: 'Oligarchie',       icon: '💎', bonuses: { goldRate: 0.20, happiness: -5 } }
};

var BUILDINGS = [
    // Antiquité
    { id: 'ferme',        name: 'Ferme',            icon: '🌾', cat: 'nourriture', era: 'antiquite', cost: { gold: 30, prod: 20 }, effect: { foodRate: 3 }, desc: 'Produit de la nourriture' },
    { id: 'mine',         name: 'Mine',             icon: '⛏️', cat: 'economie',   era: 'antiquite', cost: { gold: 40, prod: 30 }, effect: { prodRate: 3 }, desc: 'Augmente la production' },
    { id: 'marche',       name: 'Marché',           icon: '🏪', cat: 'economie',   era: 'antiquite', cost: { gold: 50, prod: 20 }, effect: { goldRate: 5 }, desc: 'Génère de l\'or' },
    { id: 'temple',       name: 'Temple',           icon: '🏛️', cat: 'culture',    era: 'antiquite', cost: { gold: 60, prod: 30 }, effect: { cultureRate: 3, stability: 2 }, desc: 'Augmente la culture et la stabilité' },
    { id: 'bibliotheque', name: 'Bibliothèque',     icon: '📚', cat: 'science',    era: 'antiquite', cost: { gold: 70, prod: 40 }, effect: { scienceRate: 4 }, desc: 'Produit de la science' },
    { id: 'caserne',      name: 'Caserne',          icon: '🏕️', cat: 'militaire',  era: 'antiquite', cost: { gold: 50, prod: 40 }, effect: { militaryPower: 5 }, desc: 'Renforce l\'armée' },
    { id: 'murailles',    name: 'Murailles',        icon: '🧱', cat: 'militaire',  era: 'antiquite', cost: { gold: 80, prod: 60 }, effect: { defense: 10, stability: 3 }, desc: 'Défense de la cité' },
    { id: 'grenier',      name: 'Grenier',          icon: '🏠', cat: 'nourriture', era: 'antiquite', cost: { gold: 35, prod: 25 }, effect: { foodRate: 2, foodStorage: 50 }, desc: 'Stocke et produit de la nourriture' },

    // Moyen-Âge
    { id: 'cathedrale',   name: 'Cathédrale',       icon: '⛪', cat: 'culture',    era: 'medieval', cost: { gold: 150, prod: 100 }, effect: { cultureRate: 8, stability: 5, happiness: 3 }, desc: 'Grande merveille religieuse' },
    { id: 'forge',        name: 'Forge',            icon: '🔨', cat: 'economie',   era: 'medieval', cost: { gold: 80, prod: 50 }, effect: { prodRate: 5, militaryPower: 3 }, desc: 'Améliore production et armement' },
    { id: 'universite',   name: 'Université',       icon: '🎓', cat: 'science',    era: 'medieval', cost: { gold: 120, prod: 70 }, effect: { scienceRate: 8 }, desc: 'Centre de savoir avancé' },
    { id: 'chateau_fort', name: 'Château Fort',     icon: '🏰', cat: 'militaire',  era: 'medieval', cost: { gold: 200, prod: 120 }, effect: { defense: 25, stability: 5, militaryPower: 8 }, desc: 'Forteresse imposante' },
    { id: 'port',         name: 'Port Commercial',  icon: '⚓', cat: 'economie',   era: 'medieval', cost: { gold: 130, prod: 80 }, effect: { goldRate: 10, foodRate: 3 }, desc: 'Commerce maritime' },
    { id: 'moulin',       name: 'Moulin',           icon: '🌀', cat: 'nourriture', era: 'medieval', cost: { gold: 60, prod: 40 }, effect: { foodRate: 5, prodRate: 2 }, desc: 'Transforme les céréales' },

    // Renaissance
    { id: 'banque',       name: 'Banque',           icon: '🏦', cat: 'economie',   era: 'renaissance', cost: { gold: 200, prod: 100 }, effect: { goldRate: 15 }, desc: 'Institution financière' },
    { id: 'observatoire', name: 'Observatoire',     icon: '🔭', cat: 'science',    era: 'renaissance', cost: { gold: 180, prod: 90 }, effect: { scienceRate: 12 }, desc: 'Scrute les cieux' },
    { id: 'theatre',      name: 'Théâtre',          icon: '🎭', cat: 'culture',    era: 'renaissance', cost: { gold: 120, prod: 70 }, effect: { cultureRate: 10, happiness: 5 }, desc: 'Art et spectacles' },
    { id: 'arsenal',      name: 'Arsenal',          icon: '🏭', cat: 'militaire',  era: 'renaissance', cost: { gold: 180, prod: 110 }, effect: { militaryPower: 15, prodRate: 5 }, desc: 'Fabrique d\'armes' },
    { id: 'imprimerie',   name: 'Imprimerie',       icon: '📰', cat: 'science',    era: 'renaissance', cost: { gold: 140, prod: 60 }, effect: { scienceRate: 6, cultureRate: 6 }, desc: 'Diffusion du savoir' },

    // Ère Industrielle
    { id: 'usine',        name: 'Usine',            icon: '🏭', cat: 'economie',   era: 'industrielle', cost: { gold: 300, prod: 200 }, effect: { prodRate: 15, goldRate: 8, happiness: -3 }, desc: 'Production de masse' },
    { id: 'gare',         name: 'Gare Ferroviaire', icon: '🚂', cat: 'economie',   era: 'industrielle', cost: { gold: 250, prod: 150 }, effect: { goldRate: 12, prodRate: 5 }, desc: 'Réseau de transport' },
    { id: 'hopital',      name: 'Hôpital',          icon: '🏥', cat: 'culture',    era: 'industrielle', cost: { gold: 200, prod: 120 }, effect: { happiness: 8, popGrowth: 0.02 }, desc: 'Soins pour la population' },
    { id: 'fort_moderne', name: 'Fort Moderne',     icon: '🏰', cat: 'militaire',  era: 'industrielle', cost: { gold: 350, prod: 200 }, effect: { defense: 40, militaryPower: 15 }, desc: 'Fortification avancée' },
    { id: 'labo',         name: 'Laboratoire',      icon: '🔬', cat: 'science',    era: 'industrielle', cost: { gold: 280, prod: 150 }, effect: { scienceRate: 18 }, desc: 'Recherche avancée' },

    // Ère Moderne
    { id: 'bourse',       name: 'Bourse',           icon: '📈', cat: 'economie',   era: 'moderne', cost: { gold: 500, prod: 250 }, effect: { goldRate: 25 }, desc: 'Marché financier mondial' },
    { id: 'media',        name: 'Centre Médias',    icon: '📺', cat: 'culture',    era: 'moderne', cost: { gold: 350, prod: 180 }, effect: { cultureRate: 15, happiness: 5, stability: 3 }, desc: 'Contrôle de l\'information' },
    { id: 'base_militaire',name:'Base Militaire',   icon: '🎖️', cat: 'militaire',  era: 'moderne', cost: { gold: 600, prod: 350 }, effect: { militaryPower: 30, defense: 20 }, desc: 'Complexe militaire' },
    { id: 'centre_spatial',name:'Centre Spatial',   icon: '🚀', cat: 'science',    era: 'moderne', cost: { gold: 800, prod: 500 }, effect: { scienceRate: 30, prestige: 10 }, desc: 'Conquête de l\'espace' },
    { id: 'aeroport',     name: 'Aéroport Int.',    icon: '✈️', cat: 'economie',   era: 'moderne', cost: { gold: 450, prod: 250 }, effect: { goldRate: 15, cultureRate: 5 }, desc: 'Hub international' },

    // Contemporaine
    { id: 'ia_center',    name: 'Centre IA',        icon: '🤖', cat: 'science',    era: 'contemporaine', cost: { gold: 1000, prod: 600 }, effect: { scienceRate: 40, prodRate: 10 }, desc: 'Intelligence artificielle' },
    { id: 'smart_city',   name: 'Ville Connectée',  icon: '🌐', cat: 'culture',    era: 'contemporaine', cost: { gold: 800, prod: 400 }, effect: { happiness: 10, goldRate: 15, cultureRate: 10 }, desc: 'Ville du futur' },
    { id: 'cyber_defense', name:'Cyberdéfense',     icon: '🛡️', cat: 'militaire',  era: 'contemporaine', cost: { gold: 700, prod: 400 }, effect: { defense: 50, militaryPower: 20 }, desc: 'Guerre numérique' },
    { id: 'fusion',       name: 'Réacteur à Fusion',icon: '⚛️', cat: 'science',    era: 'contemporaine', cost: { gold: 1500, prod: 800 }, effect: { prodRate: 30, scienceRate: 20, happiness: 5 }, desc: 'Énergie illimitée' }
];

var TECHNOLOGIES = [
    // Antiquité
    { id: 'agriculture',  name: 'Agriculture',       icon: '🌱', era: 'antiquite', cost: 20,  prereqs: [], unlocks: ['ferme', 'grenier'], desc: 'Culture des terres' },
    { id: 'poterie',      name: 'Poterie',           icon: '🏺', era: 'antiquite', cost: 25,  prereqs: [], unlocks: ['marche'], desc: 'Artisanat de base' },
    { id: 'ecriture',     name: 'Écriture',          icon: '📝', era: 'antiquite', cost: 40,  prereqs: ['poterie'], unlocks: ['bibliotheque'], desc: 'Fondement du savoir' },
    { id: 'extraction',   name: 'Extraction Minière', icon: '⛏️', era: 'antiquite', cost: 30,  prereqs: [], unlocks: ['mine'], desc: 'Exploiter les ressources' },
    { id: 'mystique',     name: 'Mysticisme',        icon: '🕯️', era: 'antiquite', cost: 30,  prereqs: [], unlocks: ['temple'], desc: 'Croyances et rituels' },
    { id: 'bronze',       name: 'Travail du Bronze',  icon: '🗡️', era: 'antiquite', cost: 35,  prereqs: ['extraction'], unlocks: ['caserne'], desc: 'Armement de bronze' },
    { id: 'maconnerie',   name: 'Maçonnerie',        icon: '🧱', era: 'antiquite', cost: 45,  prereqs: ['extraction'], unlocks: ['murailles'], desc: 'Construction en pierre' },

    // Moyen-Âge
    { id: 'feodalisme',   name: 'Féodalisme',        icon: '🏰', era: 'medieval', cost: 80,  prereqs: ['ecriture', 'bronze'], unlocks: ['chateau_fort'], desc: 'Système féodal' },
    { id: 'theologie',    name: 'Théologie',         icon: '📖', era: 'medieval', cost: 70,  prereqs: ['mystique', 'ecriture'], unlocks: ['cathedrale'], desc: 'Philosophie religieuse' },
    { id: 'metallurgie',  name: 'Métallurgie',       icon: '🔨', era: 'medieval', cost: 60,  prereqs: ['bronze'], unlocks: ['forge'], desc: 'Travail des métaux' },
    { id: 'navigation',   name: 'Navigation',        icon: '🧭', era: 'medieval', cost: 75,  prereqs: ['poterie', 'maconnerie'], unlocks: ['port'], desc: 'Voyage en mer' },
    { id: 'education',    name: 'Éducation',         icon: '🎓', era: 'medieval', cost: 90,  prereqs: ['theologie', 'ecriture'], unlocks: ['universite'], desc: 'Système éducatif' },
    { id: 'mecanique',    name: 'Mécanique',         icon: '⚙️', era: 'medieval', cost: 65,  prereqs: ['extraction', 'agriculture'], unlocks: ['moulin'], desc: 'Engrenages et moulins' },

    // Renaissance
    { id: 'imprimerie_t', name: 'Imprimerie',        icon: '📰', era: 'renaissance', cost: 130, prereqs: ['education'], unlocks: ['imprimerie'], desc: 'Révolution de l\'information' },
    { id: 'astronomie',   name: 'Astronomie',        icon: '🔭', era: 'renaissance', cost: 140, prereqs: ['education', 'navigation'], unlocks: ['observatoire'], desc: 'Étude des astres' },
    { id: 'economie_t',   name: 'Économie',          icon: '🏦', era: 'renaissance', cost: 150, prereqs: ['navigation', 'imprimerie_t'], unlocks: ['banque'], desc: 'Système bancaire' },
    { id: 'art',          name: 'Beaux-Arts',        icon: '🎨', era: 'renaissance', cost: 120, prereqs: ['theologie', 'education'], unlocks: ['theatre'], desc: 'Renaissance artistique' },
    { id: 'poudre',       name: 'Poudre à Canon',    icon: '💥', era: 'renaissance', cost: 160, prereqs: ['metallurgie', 'mecanique'], unlocks: ['arsenal'], desc: 'Révolution militaire' },

    // Industrielle
    { id: 'vapeur',       name: 'Machine à Vapeur',  icon: '🚂', era: 'industrielle', cost: 250, prereqs: ['mecanique', 'metallurgie'], unlocks: ['usine', 'gare'], desc: 'Force motrice' },
    { id: 'medecine',     name: 'Médecine',          icon: '💊', era: 'industrielle', cost: 200, prereqs: ['astronomie', 'imprimerie_t'], unlocks: ['hopital'], desc: 'Soins modernes' },
    { id: 'chimie',       name: 'Chimie',            icon: '⚗️', era: 'industrielle', cost: 230, prereqs: ['astronomie'], unlocks: ['labo'], desc: 'Science de la matière' },
    { id: 'artillerie',   name: 'Artillerie',        icon: '🎯', era: 'industrielle', cost: 280, prereqs: ['poudre', 'vapeur'], unlocks: ['fort_moderne'], desc: 'Armes lourdes' },

    // Moderne
    { id: 'electricite',  name: 'Électricité',       icon: '⚡', era: 'moderne', cost: 400, prereqs: ['chimie', 'vapeur'], unlocks: ['bourse'], desc: 'Courant électrique' },
    { id: 'telecom',      name: 'Télécommunications', icon: '📡', era: 'moderne', cost: 380, prereqs: ['electricite'], unlocks: ['media'], desc: 'Communication de masse' },
    { id: 'aviation',     name: 'Aviation',          icon: '✈️', era: 'moderne', cost: 420, prereqs: ['artillerie', 'electricite'], unlocks: ['aeroport', 'base_militaire'], desc: 'Conquête du ciel' },
    { id: 'fusee',        name: 'Fusées',            icon: '🚀', era: 'moderne', cost: 500, prereqs: ['aviation', 'chimie'], unlocks: ['centre_spatial'], desc: 'Exploration spatiale' },

    // Contemporaine
    { id: 'informatique', name: 'Informatique',      icon: '💻', era: 'contemporaine', cost: 600, prereqs: ['telecom', 'electricite'], unlocks: ['smart_city', 'cyber_defense'], desc: 'Ère numérique' },
    { id: 'ia',           name: 'Intelligence Art.',  icon: '🤖', era: 'contemporaine', cost: 800, prereqs: ['informatique'], unlocks: ['ia_center'], desc: 'Machines pensantes' },
    { id: 'fusion_t',     name: 'Fusion Nucléaire',  icon: '⚛️', era: 'contemporaine', cost: 1000, prereqs: ['fusee', 'chimie'], unlocks: ['fusion'], desc: 'Énergie ultime' }
];

var UNITS = [
    { id: 'guerrier',    name: 'Guerriers',        icon: '🗡️', era: 'antiquite',     power: 3,  cost: { gold: 20, food: 10 }, upkeep: { gold: 1, food: 2 } },
    { id: 'archer',      name: 'Archers',          icon: '🏹', era: 'antiquite',     power: 4,  cost: { gold: 25, food: 10 }, upkeep: { gold: 1, food: 2 } },
    { id: 'cavalier',    name: 'Cavalerie',        icon: '🐴', era: 'medieval',      power: 8,  cost: { gold: 50, food: 20 }, upkeep: { gold: 3, food: 4 } },
    { id: 'chevalier',   name: 'Chevaliers',       icon: '⚔️', era: 'medieval',      power: 12, cost: { gold: 80, food: 25 }, upkeep: { gold: 4, food: 5 } },
    { id: 'mousquetaire',name: 'Mousquetaires',    icon: '🔫', era: 'renaissance',   power: 15, cost: { gold: 60, food: 15 }, upkeep: { gold: 3, food: 3 } },
    { id: 'canon',       name: 'Canons',           icon: '💥', era: 'renaissance',   power: 20, cost: { gold: 120, prod: 50 }, upkeep: { gold: 5, food: 2 } },
    { id: 'infanterie',  name: 'Infanterie',       icon: '🎖️', era: 'industrielle',  power: 18, cost: { gold: 80, food: 20 }, upkeep: { gold: 4, food: 4 } },
    { id: 'artillerie_u',name: 'Artillerie',       icon: '🎯', era: 'industrielle',  power: 30, cost: { gold: 150, prod: 80 }, upkeep: { gold: 6, food: 3 } },
    { id: 'char',        name: 'Chars d\'assaut',  icon: '🛡️', era: 'moderne',       power: 50, cost: { gold: 300, prod: 150 }, upkeep: { gold: 10, food: 5 } },
    { id: 'avion',       name: 'Aviation de combat',icon: '✈️', era: 'moderne',       power: 45, cost: { gold: 350, prod: 180 }, upkeep: { gold: 12, food: 3 } },
    { id: 'missile',     name: 'Missiles',         icon: '🚀', era: 'contemporaine', power: 80, cost: { gold: 500, prod: 300 }, upkeep: { gold: 15, food: 2 } },
    { id: 'drone',       name: 'Drones de combat', icon: '🤖', era: 'contemporaine', power: 60, cost: { gold: 400, prod: 200 }, upkeep: { gold: 8, food: 0 } }
];

var AI_NATIONS = [
    { id: 'empire_soleil',  name: 'Empire du Soleil Levant', ruler: 'Empereur Akira', personality: 'aggressive', color: '#dc2626' },
    { id: 'royaume_nord',   name: 'Royaume du Nord',         ruler: 'Roi Bjorn',       personality: 'militarist', color: '#3b82f6' },
    { id: 'federation_sud', name: 'Fédération du Sud',       ruler: 'Consul Marcus',   personality: 'diplomatic', color: '#16a34a' },
    { id: 'union_ouest',    name: 'Union de l\'Ouest',       ruler: 'Reine Isabelle',  personality: 'economic',   color: '#f59e0b' },
    { id: 'confederation',  name: 'Confédération Orientale', ruler: 'Khan Temüjin',    personality: 'expansionist', color: '#8b5cf6' }
];

var POLICIES = [
    { id: 'taxes',       name: 'Taux d\'Imposition', min: 0, max: 100, default: 30, effectDesc: 'Or ↑ / Bonheur ↓' },
    { id: 'conscription',name: 'Conscription',        min: 0, max: 100, default: 20, effectDesc: 'Armée ↑ / Production & Bonheur ↓' },
    { id: 'education_p', name: 'Budget Éducation',    min: 0, max: 100, default: 30, effectDesc: 'Science ↑ / Or ↓' },
    { id: 'liberte',     name: 'Liberté Civile',      min: 0, max: 100, default: 50, effectDesc: 'Bonheur & Culture ↑ / Stabilité ↓' },
    { id: 'religion',    name: 'Influence Religieuse', min: 0, max: 100, default: 40, effectDesc: 'Stabilité ↑ / Science ↓' }
];

var DECREES = [
    { id: 'fete_nationale',   name: 'Fête Nationale',      cost: { gold: 50 },  effect: { happiness: 10, stability: 5 }, duration: 3, desc: 'Célébration nationale' },
    { id: 'mobilisation',     name: 'Mobilisation Générale',cost: { gold: 80 },  effect: { militaryPower: 20, happiness: -10, prodRate: -5 }, duration: 5, desc: 'Appel aux armes' },
    { id: 'reforme_agraire',  name: 'Réforme Agraire',     cost: { gold: 100 }, effect: { foodRate: 8, happiness: 5 }, duration: 10, desc: 'Redistribution des terres' },
    { id: 'censure',          name: 'Censure',             cost: { gold: 40 },  effect: { stability: 10, happiness: -8, cultureRate: -5 }, duration: 5, desc: 'Contrôle de l\'information' },
    { id: 'grand_projet',     name: 'Grand Projet National',cost: { gold: 200, prod: 100 }, effect: { prestige: 15, prodRate: -8 }, duration: 8, desc: 'Projet de prestige' },
    { id: 'espionnage',       name: 'Réseau d\'Espionnage', cost: { gold: 120 }, effect: { stability: 5, scienceRate: 5 }, duration: 10, desc: 'Renseignements' },
    { id: 'libre_echange',    name: 'Libre-Échange',       cost: { gold: 60 },  effect: { goldRate: 12, prodRate: -3 }, duration: 10, desc: 'Commerce ouvert' },
    { id: 'austerite',        name: 'Plan d\'Austérité',   cost: { gold: 0 },   effect: { goldRate: 15, happiness: -12, cultureRate: -5 }, duration: 8, desc: 'Économies drastiques' }
];

var EVENTS = [
    {
        id: 'famine', title: 'Famine', icon: '🌾',
        desc: 'Une terrible famine frappe votre nation. Vos réserves de nourriture s\'épuisent dangereusement.',
        condition: function(s) { return s.resources.food < 30 && Math.random() < 0.3; },
        choices: [
            { text: 'Rationner la nourriture', effect: 'Nourriture -20, Stabilité -5', apply: function(s) { s.resources.food -= 20; s.stability -= 5; } },
            { text: 'Importer d\'urgence (coûteux)', effect: 'Or -80, maintient les stocks', apply: function(s) { s.resources.gold -= 80; s.resources.food += 30; } },
            { text: 'Ignorer le problème', effect: 'Population -5%, Bonheur -15', apply: function(s) { s.population = Math.floor(s.population * 0.95); s.happiness -= 15; } }
        ]
    },
    {
        id: 'decouverte', title: 'Découverte Scientifique', icon: '🔬',
        desc: 'Vos chercheurs ont fait une percée inattendue ! Cette avancée pourrait accélérer vos recherches.',
        condition: function(s) { return s.rates.science > 5 && Math.random() < 0.15; },
        choices: [
            { text: 'Investir dans la recherche', effect: 'Science +50, Or -40', apply: function(s) { s.resources.science += 50; s.resources.gold -= 40; } },
            { text: 'Publier les résultats', effect: 'Science +20, Prestige +5, Culture +10', apply: function(s) { s.resources.science += 20; s.prestige += 5; s.resources.culture += 10; } }
        ]
    },
    {
        id: 'rebellion', title: 'Rébellion Populaire', icon: '🔥',
        desc: 'Le peuple gronde ! Des émeutes éclatent dans les rues. Votre autorité est remise en question.',
        condition: function(s) { return s.happiness < 30 && Math.random() < 0.4; },
        choices: [
            { text: 'Réprimer la révolte', effect: 'Stabilité +10, Bonheur -10, Armée -5', apply: function(s) { s.stability += 10; s.happiness -= 10; s.militaryPower -= 5; } },
            { text: 'Négocier avec les rebelles', effect: 'Or -60, Bonheur +15, Stabilité -5', apply: function(s) { s.resources.gold -= 60; s.happiness += 15; s.stability -= 5; } },
            { text: 'Faire des concessions', effect: 'Bonheur +20, Or -100, Prestige -5', apply: function(s) { s.happiness += 20; s.resources.gold -= 100; s.prestige -= 5; } }
        ]
    },
    {
        id: 'epidemie', title: 'Épidémie', icon: '🦠',
        desc: 'Une maladie inconnue se répand rapidement. Votre population est menacée.',
        condition: function(s) { return s.population > 500 && Math.random() < 0.1; },
        choices: [
            { text: 'Quarantaine stricte', effect: 'Population -3%, Production -5, Stabilité +5', apply: function(s) { s.population = Math.floor(s.population * 0.97); s.rates.prod -= 5; s.stability += 5; } },
            { text: 'Rechercher un remède', effect: 'Or -100, Science +30', apply: function(s) { s.resources.gold -= 100; s.resources.science += 30; } },
            { text: 'Laisser faire', effect: 'Population -8%, Bonheur -10', apply: function(s) { s.population = Math.floor(s.population * 0.92); s.happiness -= 10; } }
        ]
    },
    {
        id: 'age_or', title: 'Âge d\'Or', icon: '✨',
        desc: 'Votre nation entre dans un âge d\'or ! La prospérité et la joie sont palpables partout.',
        condition: function(s) { return s.happiness > 75 && s.stability > 70 && Math.random() < 0.15; },
        choices: [
            { text: 'Investir dans la culture', effect: 'Culture +50, Prestige +10', apply: function(s) { s.resources.culture += 50; s.prestige += 10; } },
            { text: 'Expansion économique', effect: 'Or +100, Production +30', apply: function(s) { s.resources.gold += 100; s.resources.prod += 30; } }
        ]
    },
    {
        id: 'tresor', title: 'Trésor Découvert', icon: '💎',
        desc: 'Des explorateurs ont découvert un trésor enfoui sur vos terres !',
        condition: function(s) { return Math.random() < 0.08; },
        choices: [
            { text: 'Enrichir le trésor royal', effect: 'Or +150', apply: function(s) { s.resources.gold += 150; } },
            { text: 'Distribuer au peuple', effect: 'Or +50, Bonheur +15', apply: function(s) { s.resources.gold += 50; s.happiness += 15; } }
        ]
    },
    {
        id: 'commerce', title: 'Opportunité Commerciale', icon: '🤝',
        desc: 'Une caravane étrangère propose un accord commercial avantageux.',
        condition: function(s) { return s.resources.gold > 50 && Math.random() < 0.12; },
        choices: [
            { text: 'Accepter l\'accord', effect: 'Or -50, Or/tour +8 pendant 5 tours', apply: function(s) { s.resources.gold -= 50; s.tempBonuses.push({ stat: 'goldRate', value: 8, turns: 5 }); } },
            { text: 'Décliner poliment', effect: 'Aucun effet', apply: function(s) {} }
        ]
    },
    {
        id: 'catastrophe_nat', title: 'Catastrophe Naturelle', icon: '🌊',
        desc: 'Un terrible séisme/inondation a frappé une partie de votre territoire !',
        condition: function(s) { return Math.random() < 0.06; },
        choices: [
            { text: 'Reconstruire en urgence', effect: 'Or -120, Production -20, Stabilité +5', apply: function(s) { s.resources.gold -= 120; s.resources.prod -= 20; s.stability += 5; } },
            { text: 'Appeler à l\'aide internationale', effect: 'Prestige -5, Or +50', apply: function(s) { s.prestige -= 5; s.resources.gold += 50; } },
            { text: 'Laisser la nature suivre son cours', effect: 'Population -5%, Bonheur -10', apply: function(s) { s.population = Math.floor(s.population * 0.95); s.happiness -= 10; } }
        ]
    },
    {
        id: 'demande_alliance', title: 'Proposition d\'Alliance', icon: '📜',
        desc: 'Une nation voisine propose une alliance formelle. Cela renforcerait votre position diplomatique.',
        condition: function(s) { return s.turn > 5 && Math.random() < 0.1; },
        choices: [
            { text: 'Accepter l\'alliance', effect: 'Prestige +5, Diplomatie améliorée', apply: function(s) { s.prestige += 5; s.stability += 3; } },
            { text: 'Refuser', effect: 'Aucun effet', apply: function(s) {} }
        ]
    },
    {
        id: 'revolution_techno', title: 'Révolution Technologique', icon: '⚡',
        desc: 'Un inventeur génial a fait une découverte qui pourrait transformer votre nation.',
        condition: function(s) { return s.resources.science > 100 && Math.random() < 0.1; },
        choices: [
            { text: 'Financer ses travaux', effect: 'Or -80, Science +80, Prestige +5', apply: function(s) { s.resources.gold -= 80; s.resources.science += 80; s.prestige += 5; } },
            { text: 'Nationaliser l\'invention', effect: 'Production +20, Bonheur -5', apply: function(s) { s.resources.prod += 20; s.happiness -= 5; } }
        ]
    }
];


// ══════════════════════════════════════════════
//  ÉTAT DU JEU
// ══════════════════════════════════════════════

var state = null;

function createDefaultState(nationName, rulerName, govType, difficulty) {
    var diffMods = {
        facile:    { resMult: 1.3, aiMult: 0.7, eventChance: 0.7 },
        normal:    { resMult: 1.0, aiMult: 1.0, eventChance: 1.0 },
        difficile: { resMult: 0.8, aiMult: 1.3, eventChance: 1.2 },
        brutal:    { resMult: 0.6, aiMult: 1.6, eventChance: 1.4 }
    };
    var dm = diffMods[difficulty] || diffMods.normal;

    return {
        nationName: nationName || 'Votre Nation',
        rulerName: rulerName || 'Le Souverain',
        government: govType || 'monarchie',
        difficulty: difficulty || 'normal',
        diffMods: dm,
        turn: 1,
        eraIndex: 0,
        year: -4000,

        population: 100,
        popGrowthBase: 0.03,
        happiness: 60,
        stability: 70,
        prestige: 0,
        territory: 1,
        militaryPower: 10,
        defense: 5,

        resources: {
            gold: Math.floor(100 * dm.resMult),
            food: Math.floor(80 * dm.resMult),
            prod: Math.floor(50 * dm.resMult),
            science: 0,
            culture: 0
        },

        rates: {
            gold: 5,
            food: 3,
            prod: 2,
            science: 1,
            culture: 1
        },

        buildings: {},   // { buildingId: count }
        techs: [],       // [ techId, ... ]
        currentResearch: null,  // { techId, progress }
        army: {},        // { unitId: count }

        policies: {
            taxes: 30,
            conscription: 20,
            education_p: 30,
            liberte: 50,
            religion: 40
        },
        activeDecrees: [],  // [ { id, turnsLeft } ]
        tempBonuses: [],    // [ { stat, value, turns } ]

        diplomacy: {},  // { nationId: { relation: 'neutral'|'friendly'|'hostile'|'war'|'allied', opinion: 0 } }

        socialClasses: {
            paysans:    { pct: 60, happiness: 50 },
            artisans:   { pct: 20, happiness: 55 },
            marchands:  { pct: 10, happiness: 60 },
            nobles:     { pct:  8, happiness: 70 },
            clerge:     { pct:  2, happiness: 65 }
        },

        log: [],
        eventQueue: []
    };
}

// ══════════════════════════════════════════════
//  OBJET GAME — Contrôle principal
// ══════════════════════════════════════════════

var Game = {
    showTitle: function() {
        this._switchScreen('title-screen');
    },

    showNewGame: function() {
        this._switchScreen('new-game-screen');
    },

    showCredits: function() {
        UI.showEvent('💡', 'Crédits', 'Be the King — Un jeu de simulation de nation.\nDéveloppé par Hardi.\nInspiration : Civilization, Humankind, Geo Political Simulator.', [
            { text: 'Retour', effect: '', apply: function() {} }
        ]);
    },

    selectGov: function(el) {
        document.querySelectorAll('.gov-card').forEach(function(c) { c.classList.remove('selected'); });
        el.classList.add('selected');
    },

    selectDiff: function(el) {
        document.querySelectorAll('.btn-diff').forEach(function(c) { c.classList.remove('selected'); });
        el.classList.add('selected');
    },

    startGame: function() {
        var nationName = document.getElementById('nation-name').value.trim() || 'Empire Inconnu';
        var rulerName = document.getElementById('ruler-name').value.trim() || 'Le Souverain';
        var govEl = document.querySelector('.gov-card.selected');
        var govType = govEl ? govEl.getAttribute('data-gov') : 'monarchie';
        var diffEl = document.querySelector('.btn-diff.selected');
        var diff = diffEl ? diffEl.getAttribute('data-diff') : 'normal';

        state = createDefaultState(nationName, rulerName, govType, diff);

        // Init diplomacy
        AI_NATIONS.forEach(function(n) {
            state.diplomacy[n.id] = { relation: 'neutral', opinion: 50 + Math.floor(Math.random() * 20) - 10 };
        });

        // Apply gov bonuses
        this._applyGovBonuses();

        this._switchScreen('game-screen');
        UI.updateAll();
        UI.toast('Bienvenue, ' + rulerName + ' ! Votre nation est fondée.', 'success');
    },

    nextTurn: function() {
        if (!state) return;

        // 1) Recalculate rates
        this._recalcRates();

        // 2) Apply resources
        state.resources.gold   += state.rates.gold;
        state.resources.food   += state.rates.food;
        state.resources.prod   += state.rates.prod;
        state.resources.science += state.rates.science;
        state.resources.culture += state.rates.culture;

        // 3) Population growth
        var foodNeeded = state.population * 0.5;
        if (state.resources.food >= foodNeeded) {
            var growthRate = state.popGrowthBase + (state.happiness / 1000);
            // gov bonuses for popGrowth
            for (var bid in state.buildings) {
                var bdata = BUILDINGS.find(function(b) { return b.id === bid; });
                if (bdata && bdata.effect.popGrowth) growthRate += bdata.effect.popGrowth * state.buildings[bid];
            }
            state.population = Math.floor(state.population * (1 + growthRate));
            state.resources.food -= Math.floor(foodNeeded * 0.3);
        } else {
            state.population = Math.floor(state.population * 0.97);
            state.happiness -= 5;
            UI.toast('Pas assez de nourriture ! Population en déclin.', 'danger');
        }

        // 4) Army upkeep
        this._applyArmyUpkeep();

        // 5) Research progress
        if (state.currentResearch) {
            state.currentResearch.progress += state.rates.science;
            var techData = TECHNOLOGIES.find(function(t) { return t.id === state.currentResearch.techId; });
            if (techData && state.currentResearch.progress >= techData.cost) {
                state.techs.push(state.currentResearch.techId);
                UI.toast('Recherche terminée : ' + techData.name + ' !', 'success');
                state.currentResearch = null;
            }
        }

        // 6) Decrees countdown
        state.activeDecrees = state.activeDecrees.filter(function(d) {
            d.turnsLeft--;
            if (d.turnsLeft <= 0) {
                UI.toast('Décret expiré : ' + d.name, 'info');
                return false;
            }
            return true;
        });

        // 7) Temp bonuses
        state.tempBonuses = state.tempBonuses.filter(function(b) {
            b.turns--;
            return b.turns > 0;
        });

        // 8) Stability & happiness drift
        if (state.happiness < 30) state.stability -= 2;
        if (state.happiness > 70) state.stability += 1;
        state.stability = Math.max(0, Math.min(100, state.stability));
        state.happiness = Math.max(0, Math.min(100, state.happiness));

        // 9) Advance time
        var era = ERAS[state.eraIndex];
        state.year += era.yearPerTurn;
        state.turn++;

        // Check era advancement via culture
        if (state.eraIndex < ERAS.length - 1) {
            var nextEra = ERAS[state.eraIndex + 1];
            var cultureNeeded = (state.eraIndex + 1) * 100;
            if (state.resources.culture >= cultureNeeded && state.year >= nextEra.yearStart) {
                state.eraIndex++;
                state.resources.culture -= cultureNeeded;
                UI.toast('🎉 Nouvelle ère : ' + ERAS[state.eraIndex].name + ' !', 'success');
                this._updateEraTheme();
            }
        }

        // 10) AI nations evolve
        this._aiTurn();

        // 11) Random events
        this._checkEvents();

        // 12) Update UI
        UI.updateAll();
    },

    saveGame: function() {
        try {
            localStorage.setItem('btk_save', JSON.stringify(state));
            UI.toast('Partie sauvegardée !', 'success');
        } catch(e) {
            UI.toast('Erreur de sauvegarde.', 'danger');
        }
    },

    loadGame: function() {
        try {
            var saved = localStorage.getItem('btk_save');
            if (saved) {
                state = JSON.parse(saved);
                // Restore functions lost in JSON
                state.tempBonuses = state.tempBonuses || [];
                state.eventQueue = state.eventQueue || [];
                this._switchScreen('game-screen');
                this._updateEraTheme();
                UI.updateAll();
                UI.toast('Partie chargée !', 'success');
            } else {
                UI.toast('Aucune sauvegarde trouvée.', 'warning');
            }
        } catch(e) {
            UI.toast('Erreur de chargement.', 'danger');
        }
    },

    showSettings: function() {
        UI.showEvent('⚙️', 'Options', 'Gérez vos paramètres de jeu.', [
            { text: 'Retour au jeu', effect: '', apply: function() {} }
        ]);
    },

    confirmQuit: function() {
        UI.showEvent('🚪', 'Quitter', 'Voulez-vous vraiment quitter ? Pensez à sauvegarder !', [
            { text: 'Quitter sans sauvegarder', effect: 'Retour au menu', apply: function() { Game._switchScreen('title-screen'); state = null; } },
            { text: 'Sauvegarder et quitter', effect: 'Sauvegarde + retour menu', apply: function() { Game.saveGame(); Game._switchScreen('title-screen'); } },
            { text: 'Annuler', effect: '', apply: function() {} }
        ]);
    },

    // Build a building
    build: function(buildingId) {
        var b = BUILDINGS.find(function(x) { return x.id === buildingId; });
        if (!b) return;

        // Check tech unlock
        var unlocked = true;
        TECHNOLOGIES.forEach(function(t) {
            if (t.unlocks && t.unlocks.indexOf(buildingId) !== -1) {
                if (state.techs.indexOf(t.id) === -1) unlocked = false;
            }
        });

        // Check era
        var bEraIdx = ERAS.findIndex(function(e) { return e.id === b.era; });
        if (bEraIdx > state.eraIndex) unlocked = false;

        if (!unlocked) {
            UI.toast('Technologie requise non recherchée !', 'warning');
            return;
        }

        // Check cost
        if (b.cost.gold && state.resources.gold < b.cost.gold) { UI.toast('Pas assez d\'or !', 'warning'); return; }
        if (b.cost.prod && state.resources.prod < b.cost.prod) { UI.toast('Pas assez de production !', 'warning'); return; }

        // Pay
        if (b.cost.gold) state.resources.gold -= b.cost.gold;
        if (b.cost.prod) state.resources.prod -= b.cost.prod;

        // Add
        state.buildings[buildingId] = (state.buildings[buildingId] || 0) + 1;
        UI.toast(b.name + ' construit !', 'success');
        UI.updateAll();
    },

    // Start research
    research: function(techId) {
        var t = TECHNOLOGIES.find(function(x) { return x.id === techId; });
        if (!t) return;
        if (state.techs.indexOf(techId) !== -1) { UI.toast('Déjà recherché !', 'info'); return; }
        if (state.currentResearch) { UI.toast('Recherche déjà en cours !', 'warning'); return; }

        // Check prereqs
        var hasPrereqs = t.prereqs.every(function(p) { return state.techs.indexOf(p) !== -1; });
        if (!hasPrereqs) { UI.toast('Prérequis manquants !', 'warning'); return; }

        // Check era
        var tEraIdx = ERAS.findIndex(function(e) { return e.id === t.era; });
        if (tEraIdx > state.eraIndex) { UI.toast('Ère non atteinte !', 'warning'); return; }

        state.currentResearch = { techId: techId, progress: 0 };
        UI.toast('Recherche lancée : ' + t.name, 'info');
        UI.updateAll();
    },

    // Recruit unit
    recruit: function(unitId) {
        var u = UNITS.find(function(x) { return x.id === unitId; });
        if (!u) return;

        var uEraIdx = ERAS.findIndex(function(e) { return e.id === u.era; });
        if (uEraIdx > state.eraIndex) { UI.toast('Unité non disponible à cette ère !', 'warning'); return; }

        if (u.cost.gold && state.resources.gold < u.cost.gold) { UI.toast('Pas assez d\'or !', 'warning'); return; }
        if (u.cost.food && state.resources.food < u.cost.food) { UI.toast('Pas assez de nourriture !', 'warning'); return; }
        if (u.cost.prod && state.resources.prod < u.cost.prod) { UI.toast('Pas assez de production !', 'warning'); return; }

        if (u.cost.gold) state.resources.gold -= u.cost.gold;
        if (u.cost.food) state.resources.food -= u.cost.food;
        if (u.cost.prod) state.resources.prod -= u.cost.prod;

        state.army[unitId] = (state.army[unitId] || 0) + 1;
        UI.toast(u.name + ' recruté(s) !', 'success');
        UI.updateAll();
    },

    // Diplomacy action
    diploAction: function(nationId, action) {
        var diplo = state.diplomacy[nationId];
        if (!diplo) return;

        switch(action) {
            case 'improve':
                if (state.resources.gold < 30) { UI.toast('Pas assez d\'or !', 'warning'); return; }
                state.resources.gold -= 30;
                diplo.opinion = Math.min(100, diplo.opinion + 15);
                if (diplo.opinion > 70) diplo.relation = 'friendly';
                UI.toast('Relations améliorées.', 'success');
                break;
            case 'threaten':
                diplo.opinion = Math.max(0, diplo.opinion - 20);
                if (diplo.opinion < 30) diplo.relation = 'hostile';
                state.prestige += 2;
                UI.toast('Vous avez menacé cette nation.', 'warning');
                break;
            case 'ally':
                if (diplo.relation !== 'friendly') { UI.toast('Améliorez d\'abord les relations !', 'warning'); return; }
                diplo.relation = 'allied';
                state.prestige += 5;
                UI.toast('Alliance conclue !', 'success');
                break;
            case 'war':
                diplo.relation = 'war';
                diplo.opinion = 0;
                UI.toast('⚔️ Vous déclarez la guerre !', 'danger');
                break;
            case 'peace':
                if (diplo.relation !== 'war') return;
                diplo.relation = 'neutral';
                diplo.opinion = 30;
                state.resources.gold -= 50;
                UI.toast('Paix signée.', 'info');
                break;
            case 'trade':
                if (diplo.relation === 'war' || diplo.relation === 'hostile') { UI.toast('Relations trop mauvaises !', 'warning'); return; }
                state.resources.gold += 20;
                diplo.opinion += 5;
                UI.toast('Accord commercial : +20 Or', 'success');
                break;
        }
        UI.updateAll();
    },

    // Apply decree
    activateDecree: function(decreeId) {
        var d = DECREES.find(function(x) { return x.id === decreeId; });
        if (!d) return;

        // Check if already active
        if (state.activeDecrees.find(function(a) { return a.id === decreeId; })) {
            UI.toast('Décret déjà en vigueur !', 'info');
            return;
        }

        // Check cost
        if (d.cost.gold && state.resources.gold < d.cost.gold) { UI.toast('Pas assez d\'or !', 'warning'); return; }
        if (d.cost.prod && state.resources.prod < d.cost.prod) { UI.toast('Pas assez de production !', 'warning'); return; }

        if (d.cost.gold) state.resources.gold -= d.cost.gold;
        if (d.cost.prod) state.resources.prod -= d.cost.prod;

        state.activeDecrees.push({ id: decreeId, name: d.name, turnsLeft: d.duration });
        UI.toast('Décret activé : ' + d.name, 'success');
        UI.updateAll();
    },

    // Policy change
    setPolicy: function(policyId, value) {
        state.policies[policyId] = parseInt(value);
        this._recalcRates();
        UI.updateAll();
    },

    // ── Internal methods ──

    _switchScreen: function(id) {
        document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); });
        document.getElementById(id).classList.add('active');
    },

    _applyGovBonuses: function() {
        var gov = GOVERNMENTS[state.government];
        if (!gov || !gov.bonuses) return;
        var b = gov.bonuses;
        if (b.stability) state.stability += b.stability;
        if (b.happiness) state.happiness += b.happiness;
    },

    _updateEraTheme: function() {
        var era = ERAS[state.eraIndex];
        document.body.className = era.cssClass || '';
    },

    _recalcRates: function() {
        // Base rates
        var r = { gold: 2, food: 2, prod: 1, science: 1, culture: 1 };

        // Building effects
        for (var bid in state.buildings) {
            var bdata = BUILDINGS.find(function(b) { return b.id === bid; });
            if (!bdata) continue;
            var count = state.buildings[bid];
            if (bdata.effect.goldRate)    r.gold    += bdata.effect.goldRate * count;
            if (bdata.effect.foodRate)    r.food    += bdata.effect.foodRate * count;
            if (bdata.effect.prodRate)    r.prod    += bdata.effect.prodRate * count;
            if (bdata.effect.scienceRate) r.science += bdata.effect.scienceRate * count;
            if (bdata.effect.cultureRate) r.culture += bdata.effect.cultureRate * count;
        }

        // Government bonuses (percentage)
        var gov = GOVERNMENTS[state.government];
        if (gov && gov.bonuses) {
            if (gov.bonuses.goldRate)    r.gold    = Math.floor(r.gold * (1 + gov.bonuses.goldRate));
            if (gov.bonuses.foodRate)    r.food    = Math.floor(r.food * (1 + gov.bonuses.foodRate));
            if (gov.bonuses.prodRate)    r.prod    = Math.floor(r.prod * (1 + gov.bonuses.prodRate));
            if (gov.bonuses.scienceRate) r.science = Math.floor(r.science * (1 + gov.bonuses.scienceRate));
            if (gov.bonuses.cultureRate) r.culture = Math.floor(r.culture * (1 + gov.bonuses.cultureRate));
        }

        // Policy effects
        var taxes = state.policies.taxes;
        r.gold += Math.floor(taxes * 0.3);
        state.happiness += (30 - taxes) * 0.05; // high taxes reduce happiness over time

        var edu = state.policies.education_p;
        r.science += Math.floor(edu * 0.2);
        r.gold -= Math.floor(edu * 0.08);

        var lib = state.policies.liberte;
        r.culture += Math.floor(lib * 0.1);

        var rel = state.policies.religion;
        r.culture += Math.floor(rel * 0.05);
        r.science -= Math.floor(rel * 0.05);

        // Active decree effects
        state.activeDecrees.forEach(function(ad) {
            var d = DECREES.find(function(x) { return x.id === ad.id; });
            if (!d) return;
            if (d.effect.goldRate)    r.gold    += d.effect.goldRate;
            if (d.effect.foodRate)    r.food    += d.effect.foodRate;
            if (d.effect.prodRate)    r.prod    += d.effect.prodRate;
            if (d.effect.scienceRate) r.science += d.effect.scienceRate;
            if (d.effect.cultureRate) r.culture += d.effect.cultureRate;
        });

        // Temp bonuses
        state.tempBonuses.forEach(function(b) {
            if (r[b.stat] !== undefined) r[b.stat] += b.value;
        });

        // Population bonus
        r.gold += Math.floor(state.population / 200);
        r.food -= Math.floor(state.population / 400);

        // Difficulty modifier
        r.gold    = Math.floor(r.gold * state.diffMods.resMult);
        r.food    = Math.floor(r.food * state.diffMods.resMult);
        r.prod    = Math.floor(r.prod * state.diffMods.resMult);

        // Ensure minimums
        r.gold = Math.max(r.gold, -20);
        r.food = Math.max(r.food, -10);

        state.rates = r;

        // Recalc military power
        var mp = 0;
        for (var uid in state.army) {
            var udata = UNITS.find(function(u) { return u.id === uid; });
            if (udata) mp += udata.power * state.army[uid];
        }
        // Building bonus
        for (var bid2 in state.buildings) {
            var bdata2 = BUILDINGS.find(function(b) { return b.id === bid2; });
            if (bdata2 && bdata2.effect.militaryPower) mp += bdata2.effect.militaryPower * state.buildings[bid2];
        }
        if (gov && gov.bonuses && gov.bonuses.militaryPower) mp = Math.floor(mp * (1 + gov.bonuses.militaryPower));
        state.militaryPower = mp;

        // Defense
        var def = 5;
        for (var bid3 in state.buildings) {
            var bdata3 = BUILDINGS.find(function(b) { return b.id === bid3; });
            if (bdata3 && bdata3.effect.defense) def += bdata3.effect.defense * state.buildings[bid3];
        }
        state.defense = def;
    },

    _applyArmyUpkeep: function() {
        for (var uid in state.army) {
            var u = UNITS.find(function(x) { return x.id === uid; });
            if (!u) continue;
            var count = state.army[uid];
            if (u.upkeep.gold) state.resources.gold -= u.upkeep.gold * count;
            if (u.upkeep.food) state.resources.food -= u.upkeep.food * count;
        }
    },

    _aiTurn: function() {
        AI_NATIONS.forEach(function(nation) {
            var diplo = state.diplomacy[nation.id];
            if (!diplo) return;

            // Opinion drift based on personality
            var drift = (Math.random() - 0.5) * 6;
            if (nation.personality === 'aggressive') drift -= 2;
            if (nation.personality === 'diplomatic') drift += 2;

            // War attrition
            if (diplo.relation === 'war') {
                var enemyPower = 10 + state.turn * 3 * state.diffMods.aiMult;
                var damage = Math.max(1, Math.floor((enemyPower - state.defense) * 0.3));
                if (damage > 0) {
                    state.resources.gold -= Math.floor(damage * 2);
                    state.population -= Math.floor(damage * 5);
                    state.happiness -= 3;
                }
                // Chance of war ending
                if (Math.random() < 0.1 || state.militaryPower > enemyPower * 1.5) {
                    diplo.relation = 'neutral';
                    diplo.opinion = 35;
                    state.prestige += 10;
                    state.territory++;
                    UI.toast('Victoire contre ' + nation.name + ' ! Territoire gagné.', 'success');
                }
            }

            diplo.opinion = Math.max(0, Math.min(100, diplo.opinion + drift));
            if (diplo.relation !== 'war' && diplo.relation !== 'allied') {
                if (diplo.opinion > 70) diplo.relation = 'friendly';
                else if (diplo.opinion < 25) diplo.relation = 'hostile';
                else diplo.relation = 'neutral';
            }

            // AI declares war?
            if (diplo.relation === 'hostile' && Math.random() < 0.05 * state.diffMods.aiMult) {
                diplo.relation = 'war';
                diplo.opinion = 0;
                UI.toast('⚔️ ' + nation.name + ' vous déclare la guerre !', 'danger');
            }
        });
    },

    _checkEvents: function() {
        var eventChance = state.diffMods.eventChance;
        EVENTS.forEach(function(ev) {
            if (ev.condition(state)) {
                if (Math.random() < eventChance) {
                    UI.showEvent(ev.icon, ev.title, ev.desc, ev.choices);
                }
            }
        });
    }
};


// ══════════════════════════════════════════════
//  UI — Interface Utilisateur
// ══════════════════════════════════════════════

var UI = {
    switchTab: function(tabId) {
        document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
        document.querySelectorAll('.tab-panel').forEach(function(p) { p.classList.remove('active'); });
        document.querySelector('.tab[data-tab="' + tabId + '"]').classList.add('active');
        document.getElementById('panel-' + tabId).classList.add('active');

        // Render tab content
        if (tabId === 'build') this.renderBuildings();
        if (tabId === 'research') this.renderResearch();
        if (tabId === 'military') this.renderMilitary();
        if (tabId === 'diplomacy') this.renderDiplomacy();
        if (tabId === 'politics') this.renderPolitics();
        if (tabId === 'population') this.renderPopulation();
    },

    updateAll: function() {
        if (!state) return;

        Game._recalcRates();

        // Era & Year
        var era = ERAS[state.eraIndex];
        document.getElementById('era-badge').textContent = era.name;
        var yearStr = state.year < 0 ? 'Année ' + Math.abs(state.year) + ' av. J-C' : 'Année ' + state.year;
        document.getElementById('year-display').textContent = yearStr;
        document.getElementById('turn-number').textContent = state.turn;

        // Resources
        document.getElementById('res-gold').textContent = Math.floor(state.resources.gold);
        document.getElementById('res-food').textContent = Math.floor(state.resources.food);
        document.getElementById('res-prod').textContent = Math.floor(state.resources.prod);
        document.getElementById('res-science').textContent = Math.floor(state.resources.science);
        document.getElementById('res-culture').textContent = Math.floor(state.resources.culture);
        document.getElementById('res-military').textContent = state.militaryPower;

        this._setRate('rate-gold', state.rates.gold);
        this._setRate('rate-food', state.rates.food);
        this._setRate('rate-prod', state.rates.prod);
        this._setRate('rate-science', state.rates.science);
        this._setRate('rate-culture', state.rates.culture);

        // Meters
        state.stability = Math.max(0, Math.min(100, Math.round(state.stability)));
        state.happiness = Math.max(0, Math.min(100, Math.round(state.happiness)));
        document.getElementById('stability-fill').style.width = state.stability + '%';
        document.getElementById('stability-val').textContent = state.stability + '%';
        document.getElementById('happiness-fill').style.width = state.happiness + '%';
        document.getElementById('happiness-val').textContent = state.happiness + '%';

        // Overview
        document.getElementById('ov-nation-name').textContent = state.nationName;
        document.getElementById('ov-ruler').textContent = state.rulerName;
        document.getElementById('ov-gov').textContent = GOVERNMENTS[state.government] ? GOVERNMENTS[state.government].name : state.government;
        document.getElementById('ov-pop').textContent = this._formatNum(state.population);
        document.getElementById('ov-territory').textContent = state.territory;
        document.getElementById('ov-prestige').textContent = state.prestige;

        // Overview buildings
        var bList = [];
        for (var bid in state.buildings) {
            var b = BUILDINGS.find(function(x) { return x.id === bid; });
            if (b) bList.push(b.icon + ' ' + b.name + ' x' + state.buildings[bid]);
        }
        document.getElementById('ov-buildings').innerHTML = bList.length ? bList.join('<br>') : '<em>Aucun bâtiment construit.</em>';

        // Overview research
        if (state.currentResearch) {
            var t = TECHNOLOGIES.find(function(x) { return x.id === state.currentResearch.techId; });
            if (t) {
                var pct = Math.min(100, Math.floor(state.currentResearch.progress / t.cost * 100));
                document.getElementById('ov-research').innerHTML = t.icon + ' ' + t.name + ' — ' + pct + '%';
            }
        } else {
            document.getElementById('ov-research').innerHTML = '<em>Aucune recherche en cours.</em>';
        }

        // Overview army
        var aList = [];
        for (var uid in state.army) {
            var u = UNITS.find(function(x) { return x.id === uid; });
            if (u) aList.push(u.icon + ' ' + u.name + ' x' + state.army[uid]);
        }
        document.getElementById('ov-army').innerHTML = aList.length ? aList.join('<br>') : '<em>Aucune unité.</em>';

        // Advisors
        var advices = [];
        if (state.resources.food < 30) advices.push('⚠️ <strong>Ministre de l\'Agriculture :</strong> Nos réserves de nourriture sont critiques !');
        if (state.happiness < 35) advices.push('⚠️ <strong>Ministre de l\'Intérieur :</strong> Le peuple est mécontent. Risque de rébellion !');
        if (state.stability < 30) advices.push('🔴 <strong>Conseiller :</strong> L\'instabilité menace le régime !');
        if (state.resources.gold < 20) advices.push('💸 <strong>Ministre des Finances :</strong> Le trésor est presque vide !');
        if (!state.currentResearch) advices.push('📜 <strong>Ministre de la Science :</strong> Nous devrions lancer une recherche.');
        if (Object.keys(state.army).length === 0) advices.push('⚔️ <strong>Général :</strong> Nous n\'avons aucune armée !');

        var atWar = false;
        for (var nid in state.diplomacy) {
            if (state.diplomacy[nid].relation === 'war') { atWar = true; break; }
        }
        if (atWar) advices.push('🔥 <strong>Général :</strong> Nous sommes en guerre ! Renforcez l\'armée.');

        document.getElementById('ov-advisors').innerHTML = advices.length ? advices.join('<br><br>') : '✅ Vos conseillers n\'ont rien à signaler.';

        // Overview diplomacy
        var dList = [];
        AI_NATIONS.forEach(function(n) {
            var d = state.diplomacy[n.id];
            if (d) {
                var relLabel = { neutral: 'Neutre', friendly: 'Amical', hostile: 'Hostile', war: '⚔ Guerre', allied: '🤝 Allié' };
                dList.push(n.name + ' — ' + (relLabel[d.relation] || d.relation));
            }
        });
        document.getElementById('ov-diplo').innerHTML = dList.length ? dList.join('<br>') : '<em>Aucune relation.</em>';

        // Re-render active tab
        var activeTab = document.querySelector('.tab.active');
        if (activeTab) {
            var tabId = activeTab.getAttribute('data-tab');
            if (tabId === 'build') this.renderBuildings();
            if (tabId === 'research') this.renderResearch();
            if (tabId === 'military') this.renderMilitary();
            if (tabId === 'diplomacy') this.renderDiplomacy();
            if (tabId === 'politics') this.renderPolitics();
            if (tabId === 'population') this.renderPopulation();
        }
    },

    renderBuildings: function(filter) {
        filter = filter || 'all';
        var container = document.getElementById('buildings-list');
        var html = '';

        BUILDINGS.forEach(function(b) {
            var bEraIdx = ERAS.findIndex(function(e) { return e.id === b.era; });
            if (bEraIdx > state.eraIndex) return; // Don't show future era buildings

            if (filter !== 'all' && b.cat !== filter) return;

            // Check if tech is researched
            var unlocked = true;
            TECHNOLOGIES.forEach(function(t) {
                if (t.unlocks && t.unlocks.indexOf(b.id) !== -1) {
                    if (state.techs.indexOf(t.id) === -1) unlocked = false;
                }
            });

            var count = state.buildings[b.id] || 0;
            var canAfford = (!b.cost.gold || state.resources.gold >= b.cost.gold) && (!b.cost.prod || state.resources.prod >= b.cost.prod);

            var cls = 'building-card';
            if (!unlocked) cls += ' locked';
            if (count > 0) cls += ' owned';

            var effectStr = [];
            for (var k in b.effect) {
                var labels = { goldRate: 'Or/tour', foodRate: 'Nourriture/tour', prodRate: 'Prod/tour', scienceRate: 'Science/tour', cultureRate: 'Culture/tour', militaryPower: 'Puissance Mil.', defense: 'Défense', stability: 'Stabilité', happiness: 'Bonheur', prestige: 'Prestige', popGrowth: 'Croissance Pop.' };
                effectStr.push('+' + b.effect[k] + ' ' + (labels[k] || k));
            }

            html += '<div class="' + cls + '" onclick="Game.build(\'' + b.id + '\')">';
            if (count > 0) html += '<span class="b-count">x' + count + '</span>';
            html += '<span class="b-icon">' + b.icon + '</span>';
            html += '<div class="b-name">' + b.name + '</div>';
            html += '<div class="b-desc">' + b.desc + '</div>';
            html += '<div class="b-cost">💰 ' + (b.cost.gold || 0) + '  ⚒️ ' + (b.cost.prod || 0) + '</div>';
            html += '<div class="b-effect">' + effectStr.join(', ') + '</div>';
            if (!unlocked) html += '<div style="color:var(--warning);font-size:0.75rem;margin-top:4px">🔒 Technologie requise</div>';
            else if (!canAfford) html += '<div style="color:var(--danger);font-size:0.75rem;margin-top:4px">Ressources insuffisantes</div>';
            html += '</div>';
        });

        container.innerHTML = html || '<em>Aucun bâtiment disponible.</em>';

        // Update category buttons
        document.querySelectorAll('.cat-btn').forEach(function(btn) {
            btn.classList.remove('active');
            if (btn.textContent.toLowerCase().replace('é','e') === filter || (filter === 'all' && btn.textContent === 'Tout')) {
                btn.classList.add('active');
            }
        });
    },

    filterBuildings: function(cat) {
        // Update active state on buttons
        document.querySelectorAll('.cat-btn').forEach(function(btn) { btn.classList.remove('active'); });
        event.target.classList.add('active');
        this.renderBuildings(cat);
    },

    renderResearch: function() {
        var container = document.getElementById('tech-tree');
        var navContainer = document.getElementById('research-era-nav');
        var html = '';
        var navHtml = '';

        ERAS.forEach(function(era, idx) {
            if (idx > state.eraIndex + 1) return; // Show current + next era
            navHtml += '<button class="cat-btn' + (idx <= state.eraIndex ? ' active' : '') + '" style="pointer-events:none">' + era.name + '</button>';
        });
        navContainer.innerHTML = navHtml;

        TECHNOLOGIES.forEach(function(t) {
            var tEraIdx = ERAS.findIndex(function(e) { return e.id === t.era; });
            if (tEraIdx > state.eraIndex + 1) return;

            var isResearched = state.techs.indexOf(t.id) !== -1;
            var isInProgress = state.currentResearch && state.currentResearch.techId === t.id;
            var hasPrereqs = t.prereqs.every(function(p) { return state.techs.indexOf(p) !== -1; });
            var isLocked = !hasPrereqs || tEraIdx > state.eraIndex;

            var cls = 'tech-card';
            if (isResearched) cls += ' researched';
            else if (isInProgress) cls += ' in-progress';
            else if (isLocked) cls += ' locked';

            html += '<div class="' + cls + '" onclick="Game.research(\'' + t.id + '\')">';
            html += '<span class="t-icon">' + t.icon + '</span>';
            html += '<div class="t-name">' + t.name + '</div>';
            html += '<div class="t-cost">🔬 ' + t.cost + ' science</div>';

            if (t.unlocks && t.unlocks.length > 0) {
                var unlockNames = t.unlocks.map(function(uid) {
                    var b = BUILDINGS.find(function(x) { return x.id === uid; });
                    return b ? b.icon + ' ' + b.name : uid;
                });
                html += '<div class="t-unlock">Débloque : ' + unlockNames.join(', ') + '</div>';
            }

            if (isInProgress) {
                var pct = Math.min(100, Math.floor(state.currentResearch.progress / t.cost * 100));
                html += '<div class="tech-progress"><div class="tech-progress-fill" style="width:' + pct + '%"></div></div>';
            }

            if (isResearched) html += '<div style="color:var(--success);font-size:0.75rem;margin-top:4px">✅ Recherché</div>';
            else if (isLocked && t.prereqs.length > 0) {
                var prereqNames = t.prereqs.map(function(pid) {
                    var pt = TECHNOLOGIES.find(function(x) { return x.id === pid; });
                    return pt ? pt.name : pid;
                });
                html += '<div style="color:var(--warning);font-size:0.75rem;margin-top:4px">Requiert : ' + prereqNames.join(', ') + '</div>';
            }

            html += '</div>';
        });

        container.innerHTML = html;
    },

    renderMilitary: function() {
        // Army list
        var armyHtml = '';
        var totalPower = 0;
        for (var uid in state.army) {
            var u = UNITS.find(function(x) { return x.id === uid; });
            if (!u) continue;
            var count = state.army[uid];
            totalPower += u.power * count;
            armyHtml += '<div class="unit-row">';
            armyHtml += '<span class="u-name">' + u.icon + ' ' + u.name + '</span>';
            armyHtml += '<span class="u-count">x' + count + ' (Force: ' + (u.power * count) + ')</span>';
            armyHtml += '</div>';
        }
        document.getElementById('army-list').innerHTML = armyHtml || '<em>Aucune unité recrutée.</em>';
        document.getElementById('army-power').textContent = state.militaryPower;

        // Recruit list
        var recruitHtml = '';
        UNITS.forEach(function(u) {
            var uEraIdx = ERAS.findIndex(function(e) { return e.id === u.era; });
            if (uEraIdx > state.eraIndex) return;

            var canAfford = true;
            if (u.cost.gold && state.resources.gold < u.cost.gold) canAfford = false;
            if (u.cost.food && state.resources.food < u.cost.food) canAfford = false;
            if (u.cost.prod && state.resources.prod < u.cost.prod) canAfford = false;

            recruitHtml += '<div class="recruit-card' + (!canAfford ? ' locked' : '') + '" onclick="Game.recruit(\'' + u.id + '\')">';
            recruitHtml += '<div class="r-name">' + u.icon + ' ' + u.name + '</div>';
            recruitHtml += '<div class="r-stats">Force: ' + u.power + ' | Entretien: 💰' + (u.upkeep.gold || 0) + ' 🌾' + (u.upkeep.food || 0) + '/tour</div>';
            var costParts = [];
            if (u.cost.gold) costParts.push('💰' + u.cost.gold);
            if (u.cost.food) costParts.push('🌾' + u.cost.food);
            if (u.cost.prod) costParts.push('⚒️' + u.cost.prod);
            recruitHtml += '<div class="r-cost">' + costParts.join('  ') + '</div>';
            recruitHtml += '</div>';
        });
        document.getElementById('recruit-list').innerHTML = recruitHtml;
    },

    renderDiplomacy: function() {
        var html = '';
        AI_NATIONS.forEach(function(n) {
            var d = state.diplomacy[n.id];
            if (!d) return;

            var relClass = d.relation;
            var relLabel = { neutral: 'Neutre', friendly: 'Amical', hostile: 'Hostile', war: 'En Guerre', allied: 'Allié' };

            html += '<div class="nation-diplo-card">';
            html += '<div class="nd-name" style="color:' + n.color + '">' + n.name + '</div>';
            html += '<div class="nd-relation ' + relClass + '">' + (relLabel[d.relation] || d.relation) + '</div>';
            html += '<div class="nd-stats">Dirigeant : ' + n.ruler + '<br>Opinion : ' + d.opinion + '/100</div>';
            html += '<div class="nd-actions">';

            if (d.relation !== 'war') {
                html += '<button onclick="Game.diploAction(\'' + n.id + '\', \'improve\')">🤝 Améliorer (30💰)</button>';
                html += '<button onclick="Game.diploAction(\'' + n.id + '\', \'trade\')">📦 Commerce</button>';
                html += '<button onclick="Game.diploAction(\'' + n.id + '\', \'threaten\')">😤 Menacer</button>';
                if (d.relation === 'friendly') {
                    html += '<button onclick="Game.diploAction(\'' + n.id + '\', \'ally\')">🤝 Alliance</button>';
                }
                html += '<button class="btn-war" onclick="Game.diploAction(\'' + n.id + '\', \'war\')">⚔️ Guerre</button>';
            } else {
                html += '<button onclick="Game.diploAction(\'' + n.id + '\', \'peace\')">🕊️ Proposer la paix (50💰)</button>';
            }

            html += '</div></div>';
        });
        document.getElementById('nations-list').innerHTML = html;
    },

    renderPolitics: function() {
        // Policy sliders
        var sliderHtml = '<h4 style="font-family:var(--font-display);color:var(--accent);margin-bottom:12px;">Politiques Nationales</h4>';
        POLICIES.forEach(function(p) {
            var val = state.policies[p.id];
            sliderHtml += '<div class="policy-item">';
            sliderHtml += '<label><strong>' + p.name + '</strong><span>' + val + '% — ' + p.effectDesc + '</span></label>';
            sliderHtml += '<input type="range" class="policy-slider" min="' + p.min + '" max="' + p.max + '" value="' + val + '" oninput="Game.setPolicy(\'' + p.id + '\', this.value)">';
            sliderHtml += '</div>';
        });
        document.getElementById('policy-sliders').innerHTML = sliderHtml;

        // Decrees
        var decreeHtml = '';
        DECREES.forEach(function(d) {
            var isActive = state.activeDecrees.find(function(a) { return a.id === d.id; });
            var canAfford = true;
            if (d.cost.gold && state.resources.gold < d.cost.gold) canAfford = false;
            if (d.cost.prod && state.resources.prod < d.cost.prod) canAfford = false;

            var effectStr = [];
            for (var k in d.effect) {
                var labels = { goldRate: 'Or/t', foodRate: 'Nourr./t', prodRate: 'Prod/t', scienceRate: 'Science/t', cultureRate: 'Culture/t', militaryPower: 'Force Mil.', happiness: 'Bonheur', stability: 'Stabilité', prestige: 'Prestige' };
                var v = d.effect[k];
                effectStr.push((v > 0 ? '+' : '') + v + ' ' + (labels[k] || k));
            }

            decreeHtml += '<div class="decree-card' + (isActive ? ' active-decree' : '') + '" onclick="Game.activateDecree(\'' + d.id + '\')">';
            decreeHtml += '<div class="d-name">' + d.name + (isActive ? ' ✅ (' + isActive.turnsLeft + ' tours)' : '') + '</div>';
            decreeHtml += '<div class="d-effect">' + effectStr.join(', ') + ' — Durée: ' + d.duration + ' tours</div>';
            var costParts = [];
            if (d.cost.gold) costParts.push('💰' + d.cost.gold);
            if (d.cost.prod) costParts.push('⚒️' + d.cost.prod);
            decreeHtml += '<div class="d-cost">' + (costParts.length ? costParts.join(' ') : 'Gratuit') + '</div>';
            if (!canAfford && !isActive) decreeHtml += '<div style="color:var(--danger);font-size:0.72rem">Ressources insuffisantes</div>';
            decreeHtml += '</div>';
        });
        document.getElementById('decrees-list').innerHTML = decreeHtml;
    },

    renderPopulation: function() {
        var overviewHtml = '<h4 style="font-family:var(--font-display);color:var(--accent);margin-bottom:8px">Démographie</h4>';
        overviewHtml += '<div>Population totale : <strong>' + UI._formatNum(state.population) + '</strong></div>';
        overviewHtml += '<div>Croissance : <strong>~' + Math.round(state.popGrowthBase * 100) + '% / tour</strong></div>';
        overviewHtml += '<div>Bonheur moyen : <strong>' + state.happiness + '%</strong></div>';

        // Social class bar
        overviewHtml += '<div class="pop-bar">';
        var colors = { paysans: '#16a34a', artisans: '#f59e0b', marchands: '#3b82f6', nobles: '#8b5cf6', clerge: '#ec4899' };
        for (var cls in state.socialClasses) {
            var sc = state.socialClasses[cls];
            overviewHtml += '<div class="pop-bar-segment" style="width:' + sc.pct + '%;background:' + colors[cls] + '">' + sc.pct + '%</div>';
        }
        overviewHtml += '</div>';

        document.getElementById('pop-overview').innerHTML = overviewHtml;

        // Social classes detail
        var classHtml = '<h4 style="font-family:var(--font-display);color:var(--accent);margin-bottom:8px">Classes Sociales</h4>';
        var classNames = { paysans: '🌾 Paysans', artisans: '🔨 Artisans', marchands: '💰 Marchands', nobles: '👑 Nobles', clerge: '⛪ Clergé' };
        for (var cls2 in state.socialClasses) {
            var sc2 = state.socialClasses[cls2];
            var pop = Math.floor(state.population * sc2.pct / 100);
            classHtml += '<div class="class-card">';
            classHtml += '<span>' + classNames[cls2] + ' — ' + UI._formatNum(pop) + '</span>';
            classHtml += '<span style="color:' + (sc2.happiness > 50 ? 'var(--success)' : 'var(--danger)') + '">😊 ' + sc2.happiness + '%</span>';
            classHtml += '</div>';
        }
        document.getElementById('social-classes').innerHTML = classHtml;
    },

    showEvent: function(icon, title, desc, choices) {
        document.getElementById('modal-icon').textContent = icon;
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-desc').textContent = desc;

        var choicesHtml = '';
        choices.forEach(function(c, i) {
            choicesHtml += '<button class="modal-choice-btn" onclick="UI._applyChoice(' + i + ')">';
            choicesHtml += c.text;
            if (c.effect) choicesHtml += '<span class="choice-effect">' + c.effect + '</span>';
            choicesHtml += '</button>';
        });
        document.getElementById('modal-choices').innerHTML = choicesHtml;
        document.getElementById('event-modal').classList.remove('hidden');

        // Store choices for callback
        this._currentChoices = choices;
    },

    _applyChoice: function(index) {
        if (this._currentChoices && this._currentChoices[index] && this._currentChoices[index].apply) {
            this._currentChoices[index].apply(state);
        }
        this.closeModal();
        if (state) UI.updateAll();
    },

    closeModal: function() {
        document.getElementById('event-modal').classList.add('hidden');
    },

    toast: function(msg, type) {
        type = type || '';
        var container = document.getElementById('toast-container');
        var el = document.createElement('div');
        el.className = 'toast ' + type;
        el.textContent = msg;
        container.appendChild(el);

        setTimeout(function() {
            el.classList.add('fade-out');
            setTimeout(function() { el.remove(); }, 300);
        }, 3500);
    },

    _setRate: function(elId, val) {
        var el = document.getElementById(elId);
        el.textContent = '(' + (val >= 0 ? '+' : '') + val + ')';
        el.className = 'res-rate' + (val < 0 ? ' negative' : '');
    },

    _formatNum: function(n) {
        if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
        if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
        return '' + n;
    },

    _currentChoices: null
};

// ══════════════════════════════════════════════
//  INITIALISATION
// ══════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function() {
    Game.showTitle();
});