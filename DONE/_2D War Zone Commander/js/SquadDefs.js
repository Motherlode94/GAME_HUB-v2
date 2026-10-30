window.RTS = window.RTS || {};

/**
 * SquadDefs — Unités militaires réelles inspirées de Broken Arrow.
 *
 * Doctrine OTAN (Bleu) vs Russie (Rouge) — les deux camps utilisent les mêmes defs,
 * la couleur de l'équipe est appliquée à l'affichage.
 *
 * combatMode:
 *   "burst"      — rafale (infanterie légère)
 *   "single"     — tir unique précis (sniper, AT guidé)
 *   "shell"      — obus AoE (MBT, SPH)
 *   "machinegun" — rafale rapide continue (IFV, HMMWV)
 *   "artillery"  — tir en arc longue portée (MLRS, BM-21)
 *   "rocket"     — roquette rapide AoE (hélicoptère)
 *   "missile"    — missile guidé lent, dégâts élevés (AT, MANPADS)
 *   "repair"     — répare bâtiments / véhicules
 *   "harvest"    — récolte ressources
 *   "none"       — pas de combat
 *
 * productionTime réduit vs version précédente (~50 %).
 */
RTS.SquadDefs = {

    // ═══════════════════════════════════════════════════════════════════════════
    //  INFANTERIE — produite dans la Caserne
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Riflemen — Escouade d'assaut standard (M4A1 / AK-74M)
     * 4 soldats, polyvalents, col vertébrale de toute force.
     */
    riflemen: {
        label:           "Groupe de combat (6 soldats)",
        category:        "infantry",
        defaultCount:    6,
        maxCount:        6,
        memberHp:        75,
        memberSize:      13,
        speed:           90,
        formationSpread: 20,
        formationType:   "wedge",

        attackRange:     220,
        attackDamage:    9,
        attackRate:      0.75,
        combatMode:      "burst",
        burstCount:      3,
        burstDelay:      0.065,
        projectileSpeed: 460,

        color:           "#3d8ef5",
        cost:            { gold: 55, fuel: 0, ammo: 20 },
        productionTime:  5,
        icon:            "RFM"
    },

    /**
     * AT Team — Équipe antichar Javelin / RPG-29 (2 hommes)
     * Missiles guidés, efficaces contre blindés et hélicooptères bas.
     */
    at_team: {
        label:           "Binôme antichar",
        category:        "infantry",
        defaultCount:    2,
        maxCount:        2,
        memberHp:        60,
        memberSize:      13,
        speed:           72,
        formationSpread: 18,
        formationType:   "grid",

        attackRange:     380,
        attackDamage:    120,
        attackRate:      0.22,
        combatMode:      "missile",
        aoeDamage:       40,
        aoeRadius:       45,
        projectileSpeed: 200,

        color:           "#e67e22",
        cost:            { gold: 75, fuel: 0, ammo: 50 },
        productionTime:  7,
        icon:            "AT"
    },

    /**
     * Sniper Team — Tireur d'élite + observateur (M24 SWS / SV-98)
     * Extrême portée, tir unique dévastateur sur infanterie.
     */
    sniper_team: {
        label:           "Binôme tireur-observateur",
        category:        "infantry",
        defaultCount:    2,
        maxCount:        2,
        memberHp:        55,
        memberSize:      12,
        speed:           68,
        formationSpread: 24,
        formationType:   "grid",

        attackRange:     600,
        attackDamage:    95,
        attackRate:      0.25,
        combatMode:      "single",
        projectileSpeed: 750,

        color:           "#8e44ad",
        cost:            { gold: 80, fuel: 0, ammo: 45 },
        productionTime:  8,
        icon:            "SNP"
    },

    /**
     * MANPADS — Équipe Stinger / Igla-S (2 hommes)
     * Sol-air guidé, contre hélicoptères et drones uniquement.
     */
    manpads: {
        label:           "Binôme défense aérienne",
        category:        "infantry",
        defaultCount:    2,
        maxCount:        2,
        memberHp:        58,
        memberSize:      13,
        speed:           70,
        formationSpread: 18,
        formationType:   "grid",

        attackRange:     450,
        attackDamage:    110,
        attackRate:      0.28,
        combatMode:      "missile",
        aoeDamage:       25,
        aoeRadius:       35,
        projectileSpeed: 320,
        antiAirOnly:     true,   // ne cible que les unités isAir

        color:           "#1abc9c",
        cost:            { gold: 70, fuel: 0, ammo: 55 },
        productionTime:  7,
        icon:            "SAM"
    },

    // ═══════════════════════════════════════════════════════════════════════════
    //  VÉHICULES — produits dans l'Atelier
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * M1A2 SEP Abrams / T-90M Proryv — Char de bataille principal
     * Blindage lourd, obus perforant, lent mais imparable.
     */
    m1a2: {
        label:           "MBT M1A2 Abrams",
        category:        "vehicle",
        defaultCount:    1,
        maxCount:        1,
        memberHp:        420,
        memberSize:      30,
        speed:           40,
        formationSpread: 0,
        formationType:   "solo",

        attackRange:     340,
        attackDamage:    95,
        attackRate:      0.30,
        combatMode:      "shell",
        aoeDamage:       40,
        aoeRadius:       55,
        projectileSpeed: 900,   // APFSDS — obus hypervéloce
        arcHeight:       0,

        color:           "#2ecc71",
        cost:            { gold: 160, fuel: 60, ammo: 40 },
        productionTime:  12,
        icon:            "MBT"
    },

    /**
     * M2A3 Bradley / BMP-3 — Véhicule de combat d'infanterie
     * Canon automatique 25 mm + missiles TOW. Mobile et polyvalent.
     */
    bradley: {
        label:           "IFV M2 Bradley",
        category:        "vehicle",
        defaultCount:    1,
        maxCount:        1,
        memberHp:        220,
        memberSize:      24,
        speed:           88,
        formationSpread: 0,
        formationType:   "solo",

        attackRange:     280,
        attackDamage:    22,
        attackRate:      2.8,
        combatMode:      "machinegun",
        projectileSpeed: 520,

        color:           "#16a085",
        cost:            { gold: 100, fuel: 40, ammo: 25 },
        productionTime:  9,
        icon:            "IFV"
    },

    /**
     * M-ATV / Tigr-M — Véhicule tactique léger armé
     * Rapide, fragile, mitrailleuse lourde M2 .50 cal.
     */
    matv: {
        label:           "M-ATV MRAP",
        category:        "vehicle",
        defaultCount:    1,
        maxCount:        1,
        memberHp:        130,
        memberSize:      20,
        speed:           115,
        formationSpread: 0,
        formationType:   "solo",

        attackRange:     200,
        attackDamage:    14,
        attackRate:      3.5,
        combatMode:      "machinegun",
        projectileSpeed: 480,

        color:           "#27ae60",
        cost:            { gold: 65, fuel: 30, ammo: 15 },
        productionTime:  6,
        icon:            "ATV"
    },

    /**
     * M109A7 Paladin / 2S19 Msta-S — Obusier automoteur 155 mm
     * Longue portée, obus AoE lourd, portée minimale obligatoire.
     */
    paladin: {
        label:           "SPH M109 Paladin",
        category:        "vehicle",
        defaultCount:    1,
        maxCount:        1,
        memberHp:        140,
        memberSize:      26,
        speed:           38,
        formationSpread: 0,
        formationType:   "solo",

        attackRange:     700,
        minRange:        200,
        attackDamage:    100,
        attackRate:      0.18,
        combatMode:      "artillery",
        aoeDamage:       60,
        aoeRadius:       90,
        projectileSpeed: 130,
        arcHeight:       130,

        color:           "#e67e22",
        cost:            { gold: 150, fuel: 55, ammo: 65 },
        productionTime:  13,
        icon:            "SPH"
    },

    /**
     * M270 MLRS / BM-21 Grad — Lance-roquettes multiple
     * Saturation de zone massive, très longue portée, rechargement lent.
     */
    mlrs: {
        label:           "MLRS M270",
        category:        "vehicle",
        defaultCount:    1,
        maxCount:        1,
        memberHp:        110,
        memberSize:      26,
        speed:           32,
        formationSpread: 0,
        formationType:   "solo",

        attackRange:     950,
        minRange:        300,
        attackDamage:    70,
        attackRate:      0.10,
        combatMode:      "artillery",
        aoeDamage:       80,
        aoeRadius:       120,
        projectileSpeed: 160,
        arcHeight:       160,
        burstCount:      6,     // salve de 6 roquettes
        burstDelay:      0.12,

        color:           "#d35400",
        cost:            { gold: 190, fuel: 65, ammo: 90 },
        productionTime:  16,
        icon:            "MLRS"
    },

    // ═══════════════════════════════════════════════════════════════════════════
    //  AVIATION — produite dans le Hangar
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * AH-64D Apache / Mi-28N Havoc — Hélicoptère d'attaque
     * Hellfire/AT-9, roquettes Hydra, canon 30 mm.
     */
    apache: {
        label:           "AH-64D Apache",
        category:        "air",
        defaultCount:    1,
        maxCount:        1,
        memberHp:        160,
        memberSize:      22,
        speed:           135,
        formationSpread: 0,
        formationType:   "solo",

        attackRange:     320,
        attackDamage:    55,
        attackRate:      0.50,
        combatMode:      "rocket",
        aoeDamage:       25,
        aoeRadius:       50,
        projectileSpeed: 290,
        isAir:           true,

        color:           "#c0392b",
        cost:            { gold: 190, fuel: 80, ammo: 60 },
        productionTime:  14,
        icon:            "APC"
    },

    /**
     * UH-60 Black Hawk / Mi-8 — Hélicoptère utilitaire armé
     * Moins offensif que l'Apache, mais rapide et résistant.
     * Miniguns latéraux, peut escorter les unités au sol.
     */
    blackhawk: {
        label:           "UH-60 Black Hawk",
        category:        "air",
        defaultCount:    1,
        maxCount:        1,
        memberHp:        130,
        memberSize:      20,
        speed:           150,
        formationSpread: 0,
        formationType:   "solo",

        attackRange:     230,
        attackDamage:    18,
        attackRate:      4.0,
        combatMode:      "machinegun",
        projectileSpeed: 500,
        isAir:           true,

        color:           "#7f8c8d",
        cost:            { gold: 140, fuel: 70, ammo: 35 },
        productionTime:  11,
        icon:            "BHK"
    },

    // ═══════════════════════════════════════════════════════════════════════════
    //  SUPPORT — produits au QG
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Ingénieur de combat — Répare véhicules et bâtiments, pose obstacles.
     */
    engineer: {
        label:           "Ingénieur Combat",
        category:        "support",
        defaultCount:    1,
        maxCount:        1,
        memberHp:        60,
        memberSize:      13,
        speed:           78,
        formationSpread: 0,
        formationType:   "solo",

        attackRange:     0,
        attackDamage:    0,
        attackRate:      0,
        combatMode:      "repair",
        repairRate:      25,
        repairRange:     35,

        color:           "#f39c12",
        cost:            { gold: 40, fuel: 0, ammo: 0 },
        productionTime:  4,
        icon:            "ENG"
    },

    /**
     * Worker — Récolte or, carburant, munitions sur les nœuds de ressources.
     */
    worker: {
        label:           "Logisticien",
        category:        "support",
        defaultCount:    1,
        maxCount:        1,
        memberHp:        50,
        memberSize:      12,
        speed:           75,
        formationSpread: 0,
        formationType:   "solo",

        attackRange:     0,
        attackDamage:    0,
        attackRate:      0,
        combatMode:      "harvest",
        harvestRange:    22,
        harvestRate:     12,
        carryMax:        50,

        color:           "#f5a623",
        cost:            { gold: 25, fuel: 0, ammo: 0 },
        productionTime:  3,
        icon:            "LOG"
    },
    // Renforts contemporains 2026 : équilibrage de jeu, non simulation matérielle.
    assault_team: {
        label:"Section d'assaut 2026", category:"infantry", defaultCount:5, maxCount:5,
        memberHp:82, memberSize:13, speed:96, formationSpread:20, formationType:"wedge",
        attackRange:195, attackDamage:11, attackRate:0.95, combatMode:"burst",
        burstCount:3, burstDelay:0.07, projectileSpeed:470,
        color:"#4d91de", cost:{gold:78,fuel:0,ammo:34}, productionTime:7, icon:"AST"
    },
    recon_team: {
        label:"Éclaireurs 2026", category:"infantry", defaultCount:3, maxCount:3,
        memberHp:58, memberSize:12, speed:115, formationSpread:23, formationType:"line",
        attackRange:255, attackDamage:12, attackRate:0.65, combatMode:"single",
        projectileSpeed:620,
        color:"#6aa98e", cost:{gold:72,fuel:0,ammo:27}, productionTime:6, icon:"REC"
    },
    wheeled_ifv: {
        label:"Blindé 8x8 moderne", category:"vehicle", defaultCount:1, maxCount:1,
        memberHp:245, memberSize:25, speed:110, formationSpread:0, formationType:"solo",
        attackRange:275, attackDamage:24, attackRate:2.2, combatMode:"machinegun",
        projectileSpeed:550,
        color:"#4e857a", cost:{gold:125,fuel:45,ammo:35}, productionTime:10, icon:"8X8"
    },
    mobile_aa: {
        label:"Défense antiaérienne mobile", category:"vehicle", defaultCount:1, maxCount:1,
        memberHp:185, memberSize:24, speed:76, formationSpread:0, formationType:"solo",
        attackRange:440, attackDamage:54, attackRate:0.65, combatMode:"rocket",
        aoeDamage:12, aoeRadius:25, projectileSpeed:450, antiAirOnly:true,
        color:"#8aa26e", cost:{gold:145,fuel:48,ammo:60}, productionTime:12, icon:"AA"
    },
    recon_drone: {
        label:"Drone de reconnaissance", category:"air", defaultCount:1, maxCount:1,
        memberHp:60, memberSize:12, speed:180, formationSpread:0, formationType:"solo",
        attackRange:0, attackDamage:0, attackRate:0, combatMode:"none",
        projectileSpeed:0, isAir:true,
        color:"#73b9cf", cost:{gold:60,fuel:18,ammo:0}, productionTime:5, icon:"UAV"
    },
    attack_drone: {
        label:"Drone d'appui", category:"air", defaultCount:1, maxCount:1,
        memberHp:85, memberSize:14, speed:145, formationSpread:0, formationType:"solo",
        attackRange:290, attackDamage:28, attackRate:0.7, combatMode:"rocket",
        aoeDamage:12, aoeRadius:26, projectileSpeed:330, isAir:true,
        color:"#c38d72", cost:{gold:100,fuel:35,ammo:38}, productionTime:9, icon:"UCV"
    },
    // Additional combined-arms roster, compatible with the existing combat modes.
    combat_medic: {
        label:"Équipe sanitaire",category:"support",defaultCount:2,maxCount:2,
        memberHp:65,memberSize:12,speed:86,formationSpread:17,formationType:"line",
        attackRange:0,attackDamage:0,attackRate:0,combatMode:"repair",
        repairRate:16,repairRange:65,
        color:"#e8ddd1",cost:{gold:48,fuel:0,ammo:0},productionTime:5,icon:"MED"
    },
    heavy_mg: {
        label:"Équipe mitrailleuse lourde",category:"infantry",defaultCount:3,maxCount:3,
        memberHp:76,memberSize:13,speed:65,formationSpread:19,formationType:"line",
        attackRange:285,attackDamage:16,attackRate:2.1,combatMode:"machinegun",
        projectileSpeed:590,color:"#69918a",cost:{gold:96,fuel:0,ammo:55},productionTime:8,icon:"HMG"
    },
    mechanized_scout: {
        label:"Éclaireur blindé",category:"vehicle",defaultCount:1,maxCount:1,
        memberHp:145,memberSize:20,speed:135,formationSpread:0,formationType:"solo",
        attackRange:230,attackDamage:15,attackRate:2.5,combatMode:"machinegun",
        projectileSpeed:520,color:"#658a6b",cost:{gold:90,fuel:35,ammo:24},productionTime:8,icon:"SCV"
    },
    rocket_artillery: {
        label:"Artillerie légère mobile",category:"vehicle",defaultCount:1,maxCount:1,
        memberHp:115,memberSize:24,speed:72,formationSpread:0,formationType:"solo",
        attackRange:570,minRange:155,attackDamage:56,attackRate:0.24,
        combatMode:"artillery",aoeDamage:40,aoeRadius:65,projectileSpeed:160,arcHeight:90,
        color:"#b7784f",cost:{gold:145,fuel:50,ammo:75},productionTime:11,icon:"ART"
    },
    interceptor_drone: {
        label:"Drone intercepteur",category:"air",defaultCount:1,maxCount:1,
        memberHp:78,memberSize:13,speed:205,formationSpread:0,formationType:"solo",
        attackRange:330,attackDamage:30,attackRate:1.1,combatMode:"rocket",
        projectileSpeed:370,antiAirOnly:true,isAir:true,
        color:"#75aabc",cost:{gold:105,fuel:30,ammo:42},productionTime:8,icon:"INT"
    },
    // Renforts 2026 : spécialités complémentaires terrestres et aériennes.
    grenadier_team: {label:"Grenadiers",category:"infantry",defaultCount:4,maxCount:4,memberHp:74,memberSize:13,speed:87,formationSpread:19,formationType:"wedge",attackRange:210,attackDamage:21,attackRate:0.65,combatMode:"rocket",aoeDamage:14,aoeRadius:34,projectileSpeed:470,color:"#6d96a0",cost:{gold:80,fuel:0,ammo:35},productionTime:7,icon:"GRN"},
    combat_engineers: {label:"Sapeurs d'assaut",category:"infantry",defaultCount:4,maxCount:4,memberHp:83,memberSize:13,speed:78,formationSpread:19,formationType:"wedge",attackRange:145,attackDamage:14,attackRate:1.15,combatMode:"burst",burstCount:2,burstDelay:0.08,projectileSpeed:420,color:"#6d96a0",cost:{gold:85,fuel:0,ammo:36},productionTime:8,icon:"SAP"},
    tank_destroyer: {label:"Chasseur de chars",category:"vehicle",defaultCount:1,maxCount:1,memberHp:280,memberSize:27,speed:62,formationSpread:0,formationType:"solo",attackRange:420,attackDamage:125,attackRate:0.19,combatMode:"shell",aoeDamage:26,aoeRadius:32,projectileSpeed:840,color:"#6d96a0",cost:{gold:185,fuel:66,ammo:65},productionTime:15,icon:"TD"},
    armored_car: {label:"Automitrailleuse",category:"vehicle",defaultCount:1,maxCount:1,memberHp:120,memberSize:19,speed:145,formationSpread:0,formationType:"solo",attackRange:230,attackDamage:16,attackRate:2.9,combatMode:"machinegun",projectileSpeed:570,color:"#6d96a0",cost:{gold:85,fuel:28,ammo:26},productionTime:7,icon:"AC"},
    heavy_aa: {label:"Canon antiaérien blindé",category:"vehicle",defaultCount:1,maxCount:1,memberHp:230,memberSize:25,speed:58,formationSpread:0,formationType:"solo",attackRange:485,attackDamage:69,attackRate:0.7,combatMode:"rocket",antiAirOnly:true,aoeDamage:12,aoeRadius:28,projectileSpeed:480,color:"#6d96a0",cost:{gold:175,fuel:65,ammo:72},productionTime:14,icon:"HAA"},
    ew_drone: {label:"Drone de surveillance électronique",category:"air",defaultCount:1,maxCount:1,memberHp:67,memberSize:13,speed:170,formationSpread:0,formationType:"solo",attackRange:0,attackDamage:0,attackRate:0,combatMode:"none",isAir:true,projectileSpeed:0,color:"#6d96a0",cost:{gold:85,fuel:25,ammo:0},productionTime:7,icon:"EW"},
    gunship: {label:"Hélicoptère d'appui lourd",category:"air",defaultCount:1,maxCount:1,memberHp:215,memberSize:24,speed:124,formationSpread:0,formationType:"solo",attackRange:345,attackDamage:72,attackRate:0.42,combatMode:"rocket",isAir:true,aoeDamage:27,aoeRadius:40,projectileSpeed:340,color:"#6d96a0",cost:{gold:215,fuel:93,ammo:74},productionTime:16,icon:"GUN"},
    light_attack_heli: {label:"Hélicoptère léger",category:"air",defaultCount:1,maxCount:1,memberHp:115,memberSize:19,speed:175,formationSpread:0,formationType:"solo",attackRange:265,attackDamage:26,attackRate:1.6,combatMode:"machinegun",isAir:true,projectileSpeed:560,color:"#6d96a0",cost:{gold:125,fuel:52,ammo:33},productionTime:10,icon:"LHX"},
    // Additional 2026 roster. Transport/logistics units are noncombat until cargo systems exist.
    special_forces: {label:"Forces spéciales",category:"infantry",defaultCount:4,maxCount:4,memberHp:90,memberSize:13,speed:112,formationSpread:18,formationType:"wedge",attackRange:275,attackDamage:19,attackRate:1.3,combatMode:"burst",burstCount:3,burstDelay:0.06,projectileSpeed:560,color:"#7797a2",cost:{gold:120,fuel:0,ammo:55},productionTime:10,icon:"SF"},
    paratroopers: {label:"Parachutistes",category:"infantry",defaultCount:5,maxCount:5,memberHp:78,memberSize:13,speed:105,formationSpread:18,formationType:"wedge",attackRange:225,attackDamage:13,attackRate:1.1,combatMode:"burst",burstCount:3,burstDelay:0.07,projectileSpeed:510,color:"#7797a2",cost:{gold:95,fuel:0,ammo:39},productionTime:9,icon:"PAR"},
    mortar_team: {label:"Section mortier",category:"infantry",defaultCount:3,maxCount:3,memberHp:63,memberSize:13,speed:65,formationSpread:18,formationType:"wedge",attackRange:440,attackDamage:49,attackRate:0.35,combatMode:"artillery",minRange:95,aoeDamage:30,aoeRadius:55,arcHeight:90,projectileSpeed:180,color:"#7797a2",cost:{gold:95,fuel:0,ammo:60},productionTime:10,icon:"MRT"},
    apc: {label:"Transport blindé",category:"vehicle",defaultCount:1,maxCount:1,memberHp:235,memberSize:24,speed:100,formationSpread:0,formationType:"solo",attackRange:180,attackDamage:13,attackRate:2,combatMode:"machinegun",projectileSpeed:520,color:"#7797a2",cost:{gold:110,fuel:38,ammo:24},productionTime:10,icon:"APC"},
    armored_engineer: {label:"Véhicule du génie",category:"vehicle",defaultCount:1,maxCount:1,memberHp:275,memberSize:25,speed:55,formationSpread:0,formationType:"solo",attackRange:165,attackDamage:14,attackRate:1.6,combatMode:"machinegun",projectileSpeed:460,color:"#7797a2",cost:{gold:125,fuel:50,ammo:24},productionTime:11,icon:"ENG"},
    supply_truck: {label:"Camion logistique",category:"support",defaultCount:1,maxCount:1,memberHp:155,memberSize:23,speed:108,formationSpread:0,formationType:"solo",attackRange:0,attackDamage:0,attackRate:0,combatMode:"none",projectileSpeed:0,color:"#7797a2",cost:{gold:80,fuel:30,ammo:0},productionTime:7,icon:"SUP"},
    selfpropelled_mortar: {label:"Mortier automoteur",category:"vehicle",defaultCount:1,maxCount:1,memberHp:170,memberSize:25,speed:73,formationSpread:0,formationType:"solo",attackRange:530,attackDamage:62,attackRate:0.28,combatMode:"artillery",minRange:120,aoeDamage:36,aoeRadius:68,arcHeight:110,projectileSpeed:170,color:"#7797a2",cost:{gold:150,fuel:55,ammo:70},productionTime:13,icon:"SPM"},
    long_range_aa: {label:"Défense aérienne longue portée",category:"vehicle",defaultCount:1,maxCount:1,memberHp:190,memberSize:26,speed:47,formationSpread:0,formationType:"solo",attackRange:680,attackDamage:95,attackRate:0.32,combatMode:"rocket",antiAirOnly:true,aoeDamage:22,aoeRadius:38,projectileSpeed:510,color:"#7797a2",cost:{gold:205,fuel:75,ammo:95},productionTime:16,icon:"SAM"},
    heavy_transport_heli: {label:"Hélicoptère de transport lourd",category:"air",defaultCount:1,maxCount:1,memberHp:270,memberSize:27,speed:115,formationSpread:0,formationType:"solo",attackRange:150,attackDamage:13,attackRate:2,combatMode:"machinegun",isAir:true,projectileSpeed:480,color:"#7797a2",cost:{gold:170,fuel:78,ammo:28},productionTime:14,icon:"HTR"},
    fighter_aircraft: {label:"Avion de chasse",category:"air",defaultCount:1,maxCount:1,memberHp:160,memberSize:22,speed:255,formationSpread:0,formationType:"solo",attackRange:390,attackDamage:65,attackRate:0.7,combatMode:"rocket",isAir:true,antiAirOnly:true,projectileSpeed:530,color:"#7797a2",cost:{gold:225,fuel:105,ammo:80},productionTime:17,icon:"FTR"},
    strike_aircraft: {label:"Avion d'attaque",category:"air",defaultCount:1,maxCount:1,memberHp:195,memberSize:24,speed:215,formationSpread:0,formationType:"solo",attackRange:390,attackDamage:83,attackRate:0.45,combatMode:"rocket",isAir:true,aoeDamage:40,aoeRadius:65,projectileSpeed:430,color:"#7797a2",cost:{gold:235,fuel:110,ammo:105},productionTime:18,icon:"CAS"},
    loitering_drone: {label:"Munition rôdeuse",category:"air",defaultCount:1,maxCount:1,memberHp:52,memberSize:12,speed:190,formationSpread:0,formationType:"solo",attackRange:240,attackDamage:54,attackRate:0.28,combatMode:"rocket",isAir:true,aoeDamage:18,aoeRadius:34,projectileSpeed:360,color:"#7797a2",cost:{gold:90,fuel:20,ammo:52},productionTime:8,icon:"LDR"},
    heavy_mbt: {label:"Char lourd modernisé",category:"vehicle",defaultCount:1,maxCount:1,memberHp:390,memberSize:30,speed:43,formationSpread:0,formationType:"solo",attackRange:355,attackDamage:118,attackRate:0.31,combatMode:"shell",projectileSpeed:850,ammoCapacity:24,color:"#79918a",cost:{gold:220,fuel:80,ammo:62},productionTime:18,icon:"HMB"},
    wheeled_at: {label:"Blindé antichar à roues",category:"vehicle",defaultCount:1,maxCount:1,memberHp:175,memberSize:23,speed:108,formationSpread:0,formationType:"solo",attackRange:410,attackDamage:104,attackRate:0.37,combatMode:"shell",projectileSpeed:780,ammoCapacity:24,color:"#79918a",cost:{gold:145,fuel:45,ammo:62},productionTime:12,icon:"WAT"},
    air_defense_radar: {label:"Véhicule antiaérien radar",category:"vehicle",defaultCount:1,maxCount:1,memberHp:220,memberSize:25,speed:60,formationSpread:0,formationType:"solo",attackRange:560,attackDamage:59,attackRate:0.78,combatMode:"rocket",antiAirOnly:true,projectileSpeed:480,ammoCapacity:36,color:"#79918a",cost:{gold:165,fuel:58,ammo:78},productionTime:13,icon:"RAD"},
    ammo_carrier: {label:"Véhicule ravitailleur blindé",category:"vehicle",defaultCount:1,maxCount:1,memberHp:165,memberSize:22,speed:96,formationSpread:0,formationType:"solo",attackRange:0,attackDamage:0,attackRate:0,combatMode:"none",projectileSpeed:0,ammoCapacity:0,color:"#79918a",cost:{gold:85,fuel:35,ammo:0},productionTime:8,icon:"AMO"}
};