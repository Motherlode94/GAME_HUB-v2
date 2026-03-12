window.RTS = window.RTS || {};

/**
 * UnitTypes — source de vérité pour chaque type d'unité.
 * Chaque type définit ses stats ET son mode de combat.
 *
 * combatMode:
 *   "melee"      — pas de projectile, dégâts directs au contact
 *   "burst"      — rafale de N balles rapides (infanterie)
 *   "shell"      — obus lent visible, AoE à l'impact (tank)
 *   "none"       — pas de combat (worker)
 */
RTS.UnitTypes = {

    // ── WORKER ─────────────────────────────────────────────────────────────────
    worker: {
        label:        "Worker",
        icon:         "W",
        hp:           60,
        speed:        70,
        size:         14,
        attackRange:  0,
        attackDamage: 0,
        attackRate:   0,
        combatMode:   "none",
        // Récolte
        harvestRange:  20,
        harvestRate:   8,       // unités/sec
        carryMax:      40,      // charge max avant retour
        color:         "#f5a623",
        cost: { gold: 30, fuel: 0, ammo: 0 }
    },

    // ── INFANTERIE ─────────────────────────────────────────────────────────────
    infantry: {
        label:        "Infanterie",
        icon:         "I",
        hp:           100,
        speed:        85,
        size:         16,
        attackRange:  90,
        attackDamage: 12,       // par balle
        attackRate:   0.6,      // salves/sec
        combatMode:   "burst",
        burstCount:   3,        // balles par salve
        burstDelay:   0.08,     // sec entre chaque balle
        projectileSpeed: 420,
        color:         "#3d8ef5",
        cost: { gold: 50, fuel: 0, ammo: 20 }
    },

    // ── TANK ───────────────────────────────────────────────────────────────────
    tank: {
        label:        "Tank",
        icon:         "T",
        hp:           280,
        speed:        42,
        size:         26,
        attackRange:  130,
        attackDamage: 65,       // dégâts directs
        attackRate:   0.35,     // obus/sec
        combatMode:   "shell",
        aoeDamage:    30,       // dégâts splash autour de l'impact
        aoeRadius:    55,
        projectileSpeed: 180,
        color:         "#2ecc71",
        cost: { gold: 120, fuel: 40, ammo: 30 }
    }
};

// Helper — crée une unité à partir d'un type
RTS.UnitTypes.create = function(x, y, team, typeName) {
    var def  = RTS.UnitTypes[typeName];
    if (!def) { console.warn("UnitType inconnu :", typeName); return null; }

    var unit = new RTS.Unit(x, y, team, {
        hp:           def.hp,
        speed:        def.speed,
        size:         def.size,
        attackRange:  def.attackRange,
        attackDamage: def.attackDamage,
        attackRate:   def.attackRate
    });

    unit.unitType    = typeName;
    unit.combatMode  = def.combatMode;
    unit.label       = def.label;

    // Burst
    if (def.burstCount)   unit.burstCount   = def.burstCount;
    if (def.burstDelay)   unit.burstDelay   = def.burstDelay;
    if (def.burstQueue)   unit.burstQueue   = [];     // file de balles à émettre
    unit.burstQueue = [];

    // Shell / AoE
    if (def.aoeDamage)    unit.aoeDamage    = def.aoeDamage;
    if (def.aoeRadius)    unit.aoeRadius    = def.aoeRadius;

    // Projectile speed
    unit.projectileSpeed = def.projectileSpeed || 0;

    // Worker
    if (typeName === "worker") {
        unit.harvestRange  = def.harvestRange;
        unit.harvestRate   = def.harvestRate;
        unit.carryMax      = def.carryMax;
        unit.carrying      = { type: null, amount: 0 };
        unit.harvestTarget = null;   // ResourceNode
        unit.returning     = false;
    }

    return unit;
};