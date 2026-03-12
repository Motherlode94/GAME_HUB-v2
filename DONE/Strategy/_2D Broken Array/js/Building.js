window.RTS = window.RTS || {};

RTS.Building = function(x, y, team, type) {
    this.x    = x; this.y = y;
    this.team = team; this.type = type;
    this.size = 52;

    // HP selon type — bâtiments défensifs plus résistants
    var hpTable = {
        hq: 1200, barracks: 600, workshop: 700, hangar: 650,
        mine: 400, refinery: 400, arsenal: 400,
        tower: 350, hospital: 500, wall: 1800
    };
    this.hp    = hpTable[type] || 500;
    this.maxHp = this.hp;

    this.selected   = false;
    this.flashTimer = 0;

    // File de production — capacité 8 pour soutenir un rythme tactique rapide
    this.queue       = [];
    this.maxQueue    = 8;
    this.progress    = 0;
    this.productionTime = 0;

    // Minuterie interne pour les effets passifs (heal, revenus)
    this.passiveTimer = 0;
};

// ── Coûts de construction ─────────────────────────────────────────────────────
// Logique : bâtiments de production coûtent plus cher mais sont rentabilisés
// rapidement via leurs revenus / unités. Les bâtiments défensifs (tower, wall)
// sont accessibles dès le début pour permettre une défense immédiate.
RTS.Building.COSTS = {
    hq:        { gold: 0,   fuel: 0,   ammo: 0   },   // donné en début de partie
    barracks:  { gold: 120, fuel: 0,   ammo: 0   },   // infanterie — core économique
    workshop:  { gold: 180, fuel: 60,  ammo: 0   },   // blindés — investissement lourd
    hangar:    { gold: 250, fuel: 100, ammo: 0   },   // aviation — tier 3
    mine:      { gold: 100, fuel: 0,   ammo: 0   },   // générateur or — priorité haute
    refinery:  { gold: 140, fuel: 0,   ammo: 0   },   // générateur fuel
    arsenal:   { gold: 120, fuel: 0,   ammo: 0   },   // générateur ammo + accélère production
    tower:     { gold: 80,  fuel: 0,   ammo: 40  },   // défense fixe — cheap, consomme ammo
    hospital:  { gold: 140, fuel: 20,  ammo: 0   },   // régénération HP des squads proches
    wall:      { gold: 40,  fuel: 0,   ammo: 0   }    // obstacle physique — très résistant
};

// ── Unités produites par bâtiment ─────────────────────────────────────────────
// Règle stricte : chaque type de bâtiment a un rôle unique et exclusif.
//   HQ        → support logistique (workers, engineers)
//   Barracks  → infanterie & spécialistes à pied
//   Workshop  → véhicules blindés & artillerie
//   Hangar    → aviation
// Les bâtiments économiques (mine, refinery, arsenal), défensifs (tower, wall)
// et médicaux (hospital) NE produisent PAS d'unités — leur rôle est passif/actif.
RTS.Building.ALLOWED = {
    hq:       ["worker", "engineer"],
    barracks: ["riflemen", "at_team", "sniper_team", "manpads"],
    workshop: ["matv", "bradley", "m1a2", "paladin", "mlrs"],
    hangar:   ["apache", "blackhawk"]
    // mine, refinery, arsenal, tower, hospital, wall : pas de production d'unités
};

// ── Revenus passifs par bâtiment (ressources/seconde) ─────────────────────────
// Calibrés pour que 2-3 mines couvrent les coûts d'infanterie continue,
// et qu'une refinery + arsenal suffisent à maintenir blindés et tours actifs.
RTS.Building.PASSIVE = {
    mine:     { gold: 18 },   // +18 or/s  — rentabilisé en ~6s de combat
    refinery: { fuel: 12 },   // +12 fuel/s — critique pour blindés et hélicos
    arsenal:  { ammo: 10 }    // +10 ammo/s — alimente tours et artillerie
};

// ── Rayon d'effet passif du bâtiment hospital ─────────────────────────────────
// Tout squad allié dans ce rayon regagne des HP chaque seconde.
RTS.Building.HOSPITAL_RADIUS    = 180;   // pixels monde
RTS.Building.HOSPITAL_HEAL_RATE = 8;     // HP/s par squad dans le rayon
RTS.Building.HOSPITAL_TICK      = 1.0;   // tick toutes les 1s

// ── Bonus de production de l'arsenal ─────────────────────────────────────────
// Un arsenal sur la map réduit le productionTime de tous les bâtiments de 20 %.
RTS.Building.ARSENAL_SPEED_BONUS = 0.80; // multiplicateur (0.8 = 20% plus rapide)