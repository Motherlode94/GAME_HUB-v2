class Player {
    constructor() {
        this.x = 200;
        this.y = 300;
        this.width  = 36;
        this.height = 36;

        this.speed    = 4;
        this.hp       = 100;
        this.maxHp    = 100;
        this.mana     = 100;
        this.maxMana  = 100;
        this.manaRegen = 0.15;

        this.color = "#00ffff";

        // Upgrade levels (starts at 1, incremented by shop)
        this.spellLevels = { a:1, z:1, e:1, r:1 };

        this.cooldowns = { a:0, z:0, e:0, r:0 };

        this.hitFlash = 0;
        this.trail    = [];
        this.angle    = 0;   // faces mouse
    }

    // Mana cost per spell
    static get MANA_COSTS() {
        return { a:10, z:25, e:8, r:50 };
    }

    // Base damage + per-level bonus
    spellDamage(key) {
        const base  = { a:10, z:25, e:7,  r:40 };
        const bonus = { a:5,  z:12, e:3,  r:18 };
        return base[key] + bonus[key] * (this.spellLevels[key] - 1);
    }

    takeDamage(amount) {
        this.hp -= amount;
        this.hitFlash = 8;
    }

    move(keys) {
        let moved = false;
        if (keys["arrowup"])    { this.y -= this.speed; moved = true; }
        if (keys["arrowdown"])  { this.y += this.speed; moved = true; }
        if (keys["arrowleft"])  { this.x -= this.speed; moved = true; }
        if (keys["arrowright"]) { this.x += this.speed; moved = true; }

        const canvas = document.getElementById("gameCanvas");
        this.x = Math.max(0, Math.min(canvas.width  - this.width,  this.x));
        this.y = Math.max(50, Math.min(canvas.height - this.height - 65, this.y));

        if (moved) {
            this.trail.push({ x: this.x + 18, y: this.y + 18 });
            if (this.trail.length > 12) this.trail.shift();
        } else if (this.trail.length) {
            this.trail.shift();
        }
    }

    updateCooldowns(mouseX, mouseY) {
        for (let key in this.cooldowns) {
            if (this.cooldowns[key] > 0) this.cooldowns[key]--;
        }
        if (this.mana < this.maxMana) {
            this.mana = Math.min(this.maxMana, this.mana + this.manaRegen);
        }
        if (this.hitFlash > 0) this.hitFlash--;

        // Track mouse angle for visual orientation
        this.angle = Math.atan2(mouseY - (this.y + 18), mouseX - (this.x + 18));
    }

    castSpell(key, mouseX, mouseY, projectiles, aoes) {
        if (this.cooldowns[key] > 0) return;

        const cost = Player.MANA_COSTS[key];
        if (this.mana < cost) return;
        this.mana -= cost;

        const cx = this.x + this.width  / 2;
        const cy = this.y + this.height / 2;

        // ── A : Fast skillshot ──────────────────────
        if (key === "a") {
            projectiles.push(new Projectile(cx, cy, mouseX, mouseY, 9, this.spellDamage("a"), "#ffdd00", 5));
            this.cooldowns.a = 30;
            burst(cx, cy, "#ffdd00", 6, 2.5, 2);
        }

        // ── Z : Heavy projectile ────────────────────
        if (key === "z") {
            projectiles.push(new Projectile(cx, cy, mouseX, mouseY, 5, this.spellDamage("z"), "#4488ff", 9));
            this.cooldowns.z = 90;
            burst(cx, cy, "#4488ff", 10, 3.5, 4);
        }

        // ── E : Triple fast burst ───────────────────
        if (key === "e") {
            const angle = Math.atan2(mouseY - cy, mouseX - cx);
            for (let i = -1; i <= 1; i++) {
                const a  = angle + i * 0.16;
                const ox = Math.cos(a + Math.PI / 2) * 12 * i;
                const oy = Math.sin(a + Math.PI / 2) * 12 * i;
                projectiles.push(new Projectile(
                    cx + ox, cy + oy,
                    cx + ox + Math.cos(a) * 200,
                    cy + oy + Math.sin(a) * 200,
                    13, this.spellDamage("e"), "#00ff88", 4
                ));
            }
            this.cooldowns.e = 15;
            burst(cx, cy, "#00ff88", 5, 3, 2);
        }

        // ── R : AOE ultimate ────────────────────────
        if (key === "r") {
            aoes.push(new AoE(mouseX, mouseY, 85, this.spellDamage("r"), 32, "#ff4400"));
            this.cooldowns.r = 180;
            burst(mouseX, mouseY, "#ff4400", 28, 6, 6);
        }
    }

    draw(ctx) {
        // Movement trail
        for (let i = 0; i < this.trail.length; i++) {
            const alpha = (i / this.trail.length) * 0.22;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(this.trail[i].x, this.trail[i].y, 7, 0, Math.PI * 2);
            ctx.fillStyle = "#00ffff";
            ctx.fill();
            ctx.restore();
        }

        const cx  = this.x + 18;
        const cy  = this.y + 18;
        const col = this.hitFlash > 0 ? "#ff3355" : "#00ffff";

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(this.angle + Math.PI / 4);

        ctx.shadowBlur  = this.hitFlash > 0 ? 30 : 22;
        ctx.shadowColor = col;
        ctx.fillStyle   = col;

        // Outer diamond
        ctx.beginPath();
        ctx.moveTo(0, -18); ctx.lineTo(18, 0);
        ctx.lineTo(0, 18);  ctx.lineTo(-18, 0);
        ctx.closePath();
        ctx.fill();

        // Inner cutout
        ctx.fillStyle = "rgba(2,6,16,0.55)";
        ctx.beginPath();
        ctx.moveTo(0, -9); ctx.lineTo(9, 0);
        ctx.lineTo(0, 9);  ctx.lineTo(-9, 0);
        ctx.closePath();
        ctx.fill();

        ctx.restore();

        // ── HP bar ──
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(this.x - 4, this.y - 14, 44, 5);
        ctx.shadowBlur  = 5;
        ctx.shadowColor = "#ff3355";
        ctx.fillStyle   = "#ff3355";
        ctx.fillRect(this.x - 4, this.y - 14, 44 * Math.max(0, this.hp / this.maxHp), 5);

        // ── Mana bar ──
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(this.x - 4, this.y - 8, 44, 4);
        ctx.shadowBlur  = 4;
        ctx.shadowColor = "#4466ff";
        ctx.fillStyle   = "#4466ff";
        ctx.fillRect(this.x - 4, this.y - 8, 44 * (this.mana / this.maxMana), 4);
        ctx.shadowBlur  = 0;
    }
}