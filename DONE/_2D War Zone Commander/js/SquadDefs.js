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
    }
};