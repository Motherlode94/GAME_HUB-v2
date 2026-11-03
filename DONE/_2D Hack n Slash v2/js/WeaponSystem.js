class WeaponSystem {
    constructor(player) {
        this.player = player;

        this.currentWeapon = 'sword';
        this.attacking = false;
        this.attackTimer = 0;
        this.comboCount = 0;
        this.lastAttackTime = 0;

this.weapons = {
    sword: {
        name: 'Épée',
        offset: 38,
        radius: 48,
        duration: 8,
        color: '#ffffff',
        trailColor: '#aaaaff',
        special: 'slash',
        damage: 1,
        attackSpeed: 1.0,
        attackStyle: 'slash'
    },

    axe: {
        name: 'Hache',
        offset: 35,
        radius: 40,
        duration: 12,
        color: '#ff8800',
        trailColor: '#ffaa66',
        special: 'cleave',
        damage: 2,
        attackSpeed: 0.8,
        attackStyle: 'chop'
    },

    lance: {
        name: 'Lance',
        offset: 50,
        radius: 75,
        duration: 6,
        color: '#00ff88',
        trailColor: '#88ffcc',
        special: 'thrust',
        damage: 1.5,
        attackSpeed: 1.2,
        attackStyle: 'thrust'
    },

    dagger: {
        name: 'Dague',
        offset: 25,
        radius: 25,
        duration: 4,
        color: '#C0C0C0',
        trailColor: '#ffffff',
        special: 'backstab',
        damage: 0.7,
        attackSpeed: 2.0,
        attackStyle: 'stab'
    },

    hammer: {
        name: 'Marteau',
        offset: 30,
        radius: 60,
        duration: 15,
        color: '#aa5500',
        trailColor: '#ffaa00',
        special: 'earthquake',
        damage: 3,
        attackSpeed: 0.6,
        attackStyle: 'smash'
    },

    staff: {
        name: 'Bâton',
        offset: 40,
        radius: 30,
        duration: 10,
        color: '#ff00ff',
        trailColor: '#ff88ff',
        special: 'star',
        damage: 0.8,
        attackSpeed: 1.5,
        attackStyle: 'magic'
    },

    bow: {
        name: 'Arc',
        offset: 45,
        radius: 35,
        duration: 5,
        color: '#8B4513',
        trailColor: '#DEB887',
        special: 'multishot',
        damage: 1.2,
        attackSpeed: 1.3,
        attackStyle: 'ranged'
    },

    wand: {
        name: 'Baguette',
        offset: 40,
        radius: 28,
        duration: 8,
        color: '#9400D3',
        trailColor: '#DA70D6',
        special: 'chainLightning',
        damage: 1.1,
        attackSpeed: 1.4,
        attackStyle: 'magic'
    }
};

    }

    get weapon() {
        return this.weapons[this.currentWeapon];
    }

    update(keys) {
        // Switch weapon with number keys
        const weaponKeys = {
            'Digit1': 'sword',
            'Digit2': 'axe',
            'Digit3': 'lance',
            'Digit4': 'staff',
            'Digit5': 'hammer',
            'Digit6': 'bow',
            'Digit7': 'dagger',
            'Digit8': 'wand'
        };

        for (const [key, weapon] of Object.entries(weaponKeys)) {
            if (keys[key] && this.currentWeapon !== weapon) {
                this.currentWeapon = weapon;
                this.comboCount = 0;
            }
        }

        // Attack
        if ((keys['Space'] || keys['KeyJ']) && !this.attacking) {
            this.attack();
        }

        // Special
        if (
            (keys['KeyK'] || keys['KeyE']) &&
            this.player.progression.specialCharge >=
                this.player.progression.specialMax
        ) {
            this.useSpecial();
        }

        // Update combo counter
        if (Date.now() - this.lastAttackTime > 1000) {
            this.comboCount = 0;
        }

        // Timers
        if (this.attackTimer > 0) {
            this.attackTimer--;
            if (this.attackTimer <= 0) {
                this.attacking = false;
            }
        }
    }

    attack() {
        const w = this.weapon;
        const p = this.player;

        this.attacking = true;
        this.attackTimer = Math.floor(w.duration / w.attackSpeed);
        this.lastAttackTime = Date.now();
        this.comboCount = Math.min(this.comboCount + 1, 5);

        // Bonus de combo
        const comboDamage = w.damage * (1 + this.comboCount * 0.1);

        switch (this.currentWeapon) {
            case 'staff':
            case 'wand':
                // Projectiles magiques
                this.fireProjectile(w, comboDamage);
                break;

            case 'bow':
                // Flèche unique
                this.fireArrow(w, comboDamage);
                break;

            default:
                // Attaque de mêlée
                this.meleeAttack(w, comboDamage);
                break;
        }
    }

    fireProjectile(weapon, damage) {
        const p = this.player;
        
        if (typeof projectiles !== 'undefined') {
            projectiles.push(
                new Projectile(
                    p.pos.x + p.facing.x * 30,
                    p.pos.y + p.facing.y * 30,
                    p.facing.x * 10,
                    p.facing.y * 10,
                    weapon.color,
                    8,
                    damage
                )
            );
        }
    }

    fireArrow(weapon, damage) {
        const p = this.player;
        
        if (typeof projectiles !== 'undefined') {
            projectiles.push(
                new Projectile(
                    p.pos.x + p.facing.x * 30,
                    p.pos.y + p.facing.y * 30,
                    p.facing.x * 15,
                    p.facing.y * 15,
                    weapon.color,
                    6,
                    damage,
                    weapon.piercing
                )
            );
        }
    }

    meleeAttack(weapon, damage) {
        const attackCenter = this.getAttackCenter();

        if (typeof enemies === 'undefined') return;

        enemies.forEach(e => {
            if (e.pos.distance(attackCenter) < weapon.radius) {
                // Critique pour la dague
                let finalDamage = damage;
                let isCrit = false;
                
                if (weapon.critChance && Math.random() < weapon.critChance) {
                    finalDamage *= 2;
                    isCrit = true;
                }

                if (e.takeDamage(finalDamage)) {
                    this.player.rewards.onEnemyKilled(e);
                } else {
                    // Knockback (vérifie si la méthode existe)
                    if (weapon.knockback) {
                        const knockDir = e.pos.sub(attackCenter).normalize();
                        
                        // Méthode 1: Si applyKnockback existe
                        if (typeof e.applyKnockback === 'function') {
                            e.applyKnockback(knockDir, weapon.knockback);
                        } 
                        // Méthode 2: Appliquer directement à la vélocité
                        else if (e.vel) {
                            e.vel = e.vel.add(knockDir.mul(weapon.knockback * 0.5));
                        }
                        // Méthode 3: Déplacer directement la position
                        else {
                            e.pos = e.pos.add(knockDir.mul(weapon.knockback));
                        }
                    }
                    
                    // Stun (vérifie si la méthode existe)
                    if (weapon.stunDuration && typeof e.stun === 'function') {
                        e.stun(weapon.stunDuration);
                    }
                    
                    // Affichage critique
                    if (isCrit && typeof createCritEffect === 'function') {
                        createCritEffect(e.pos.x, e.pos.y);
                    }
                }
            }
        });
    }

    getAttackCenter() {
        return this.player.pos.add(
            this.player.facing.mul(this.weapon.offset)
        );
    }

    get attackRadius() {
        return this.weapon.radius;
    }

    reduceAttackDuration() {
        const w = this.weapon;
        w.duration = Math.max(4, w.duration - 1);
    }

    useSpecial() {
        const p = this.player;
        const prog = p.progression;
        const w = this.weapon;

        prog.consumeSpecial();

        const baseRadius = 150 + prog.level * 10;
        const baseDamage = 3 + Math.floor(prog.level / 2);

        if (typeof enemies === 'undefined') return;

        switch (w.special) {
            case 'slash': // Épée - onde de choc circulaire
                enemies.forEach(e => {
                    if (e.pos.distance(p.pos) < baseRadius) {
                        if (e.takeDamage(baseDamage)) {
                            p.rewards.onEnemyKilled(e);
                        }
                    }
                });
                if (typeof createShockwave === 'function') {
                    createShockwave(p.pos.x, p.pos.y, baseRadius, w.color);
                }
                break;

            case 'cleave': // Hache - arc devant le joueur
                const cleaveAngle = Math.PI / 3;
                const facingAngle = Math.atan2(p.facing.y, p.facing.x);
                
                enemies.forEach(e => {
                    const dir = e.pos.sub(p.pos);
                    const distance = dir.length();
                    if (distance < baseRadius * 1.2) {
                        const angle = Math.atan2(dir.y, dir.x);
                        let angleDiff = Math.abs(angle - facingAngle);
                        
                        // Normaliser l'angle
                        if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
                        
                        if (angleDiff < cleaveAngle) {
                            if (e.takeDamage(baseDamage * 1.5)) {
                                p.rewards.onEnemyKilled(e);
                            }
                        }
                    }
                });
                if (typeof createArcEffect === 'function') {
                    createArcEffect(p.pos.x, p.pos.y, baseRadius * 1.2, facingAngle, cleaveAngle, w.color);
                }
                break;

            case 'thrust': // Lance - charge en ligne
                const thrustDistance = baseRadius * 2;
                const thrustDir = p.facing.normalize();
                const hitEnemies = new Set();
                
                for (let i = 0; i < 20; i++) {
                    const checkPos = p.pos.add(thrustDir.mul(i * thrustDistance / 20));
                    enemies.forEach(e => {
                        if (!hitEnemies.has(e) && e.pos.distance(checkPos) < 40) {
                            hitEnemies.add(e);
                            if (e.takeDamage(baseDamage * 0.8)) {
                                p.rewards.onEnemyKilled(e);
                            } else {
                                // Knockback simplifié
                                if (e.vel) {
                                    e.vel = e.vel.add(thrustDir.mul(10));
                                } else {
                                    e.pos = e.pos.add(thrustDir.mul(20));
                                }
                            }
                        }
                    });
                }
                if (typeof createThrustEffect === 'function') {
                    createThrustEffect(p.pos.x, p.pos.y, thrustDir.x, thrustDir.y, thrustDistance, w.color);
                }
                break;

            case 'star': // Bâton - projectiles en étoile
                if (typeof projectiles !== 'undefined') {
                    const starCount = 8;
                    for (let i = 0; i < starCount; i++) {
                        const angle = (Math.PI * 2 * i) / starCount;
                        const vx = Math.cos(angle) * 8;
                        const vy = Math.sin(angle) * 8;
                        
                        projectiles.push(
                            new Projectile(
                                p.pos.x,
                                p.pos.y,
                                vx,
                                vy,
                                w.color,
                                10,
                                baseDamage * 0.6
                            )
                        );
                    }
                }
                break;

            case 'earthquake': // Marteau - onde de choc au sol
                enemies.forEach(e => {
                    const distance = e.pos.distance(p.pos);
                    if (distance < baseRadius * 1.5) {
                        const damageMult = 1 - (distance / (baseRadius * 1.5));
                        if (e.takeDamage(baseDamage * 2 * damageMult)) {
                            p.rewards.onEnemyKilled(e);
                        } else if (typeof e.stun === 'function') {
                            e.stun(60);
                        }
                    }
                });
                if (typeof createEarthquakeEffect === 'function') {
                    createEarthquakeEffect(p.pos.x, p.pos.y, baseRadius * 1.5, w.color);
                }
                break;

            case 'multishot': // Arc - salve de flèches
                if (typeof projectiles !== 'undefined') {
                    const arrowCount = 5;
                    const spreadAngle = Math.PI / 6;
                    const baseAngle = Math.atan2(p.facing.y, p.facing.x);
                    
                    for (let i = 0; i < arrowCount; i++) {
                        const angle = baseAngle + (i - 2) * (spreadAngle / 4);
                        const vx = Math.cos(angle) * 15;
                        const vy = Math.sin(angle) * 15;
                        
                        projectiles.push(
                            new Projectile(
                                p.pos.x + p.facing.x * 30,
                                p.pos.y + p.facing.y * 30,
                                vx,
                                vy,
                                w.color,
                                6,
                                baseDamage * 0.8,
                                true
                            )
                        );
                    }
                }
                break;

            case 'backstab': // Dague - téléportation + dégâts critiques
                const targetEnemy = this.findNearestEnemy(baseRadius);
                
                if (targetEnemy) {
                    // Téléportation derrière l'ennemi
                    const dirToPlayer = p.pos.sub(targetEnemy.pos).normalize();
                    p.pos = targetEnemy.pos.add(dirToPlayer.mul(30));
                    
                    if (targetEnemy.takeDamage(baseDamage * 3)) {
                        p.rewards.onEnemyKilled(targetEnemy);
                    }
                    
                    if (typeof createTeleportEffect === 'function') {
                        createTeleportEffect(p.pos.x, p.pos.y, w.color);
                    }
                } else {
                    // Dash rapide si pas d'ennemi
                    p.pos = p.pos.add(p.facing.mul(100));
                    if (typeof createDashEffect === 'function') {
                        createDashEffect(p.pos.x, p.pos.y, w.color);
                    }
                }
                break;

            case 'chainLightning': // Baguette - éclair en chaîne
                let currentTarget = this.findNearestEnemy(baseRadius);
                const hitTargets = new Set();
                let chainDamage = baseDamage * 1.2;
                const maxChains = w.chainCount || 3;
                
                for (let i = 0; i < maxChains && currentTarget; i++) {
                    if (!hitTargets.has(currentTarget)) {
                        hitTargets.add(currentTarget);
                        
                        const prevPos = i === 0 ? p.pos : Array.from(hitTargets)[i - 1].pos;
                        
                        if (currentTarget.takeDamage(chainDamage)) {
                            p.rewards.onEnemyKilled(currentTarget);
                        }
                        
                        if (typeof createLightningEffect === 'function') {
                            createLightningEffect(prevPos, currentTarget.pos, w.color);
                        }
                        
                        chainDamage *= 0.8;
                        currentTarget = this.findNearestEnemy(baseRadius, hitTargets);
                    } else {
                        break;
                    }
                }
                break;
        }
    }

    findNearestEnemy(maxDistance, excludeSet = new Set()) {
        if (typeof enemies === 'undefined') return null;
        
        let nearest = null;
        let minDist = maxDistance;

        enemies.forEach(e => {
            if (!excludeSet.has(e)) {
                const dist = e.pos.distance(this.player.pos);
                if (dist < minDist) {
                    minDist = dist;
                    nearest = e;
                }
            }
        });

        return nearest;
    }

    // Amélioration de l'arme
    upgradeWeapon(weaponName, stat, value) {
        if (this.weapons[weaponName] && this.weapons[weaponName][stat] !== undefined) {
            this.weapons[weaponName][stat] += value;
        }
    }
}