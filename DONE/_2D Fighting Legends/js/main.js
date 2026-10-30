// main.js

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

// GAME_WIDTH, GAME_HEIGHT sont definis dans ui.js (charge avant)
const FLOOR_Y        = GAME_HEIGHT - 50;
const TIMER_DURATION = 60 * 60; // 60 secondes a 60fps

let DPR        = 1;
let gameState  = 'start'; // 'start' | 'playing' | 'gameover'
let winner     = null;
let matchTimer = TIMER_DURATION;

const p1NameInput       = document.getElementById('p1-name');
const p2NameInput       = document.getElementById('p2-name');
const p1CharacterSelect = document.getElementById('p1-character');
const p2CharacterSelect = document.getElementById('p2-character');
const startMatchBtn     = document.getElementById('start-match-btn');
const setupErrorEl      = document.getElementById('setup-error');
const p1PreviewEl       = document.getElementById('p1-preview');
const p2PreviewEl       = document.getElementById('p2-preview');

const CHARACTER_PRESETS = [
    { id: 'bruiser',  name: 'Titan (Marteau)',    color: '#ff5555', glowColor: '#ff2200', speed: 4.6, jumpForce: -14.2, attackReach: 68, attackDamage: 14, chargedDamage: 33, dashPower: 16, weaponLength: 42, weapon: 'Marteau graviton',   skill: 'Coup lourds très puissants' },
    { id: 'assassin', name: 'Shade (Lames)',       color: '#7dffb3', glowColor: '#00e38f', speed: 6.4, jumpForce: -16.2, attackReach: 54, attackDamage:  9, chargedDamage: 23, dashPower: 22, weaponLength: 28, weapon: 'Lames éther',          skill: 'Dash ultra rapide'          },
    { id: 'sniper',   name: 'Astra (Lance)',        color: '#7ab6ff', glowColor: '#2277ff', speed: 5.2, jumpForce: -15.3, attackReach: 82, attackDamage: 11, chargedDamage: 26, dashPower: 17, weaponLength: 48, weapon: 'Lance photonique',      skill: 'Grande portée'              },
    { id: 'pyro',     name: 'Pyra (Fouet feu)',     color: '#ff9a3d', glowColor: '#ff5d1f', speed: 5.5, jumpForce: -15.1, attackReach: 74, attackDamage: 10, chargedDamage: 29, dashPower: 18, weaponLength: 44, weapon: 'Fouet incendiaire',    skill: 'Charge explosive'           },
    { id: 'monk',     name: 'Zenko (Bâton)',        color: '#c98bff', glowColor: '#9d3dff', speed: 5.8, jumpForce: -16.8, attackReach: 60, attackDamage: 11, chargedDamage: 25, dashPower: 19, weaponLength: 38, weapon: 'Bâton mystique',       skill: 'Double saut plus agile'     }
];

function presetById(id) {
    return CHARACTER_PRESETS.find(c => c.id === id) || CHARACTER_PRESETS[0];
}

function populateCharacterSelects() {
    const options = CHARACTER_PRESETS
        .map(c => `<option value="${c.id}">${c.name} — ${c.weapon}</option>`)
        .join('');
    p1CharacterSelect.innerHTML = options;
    p2CharacterSelect.innerHTML = options;
    p1CharacterSelect.value = 'bruiser';
    p2CharacterSelect.value = 'sniper';
    updateCharacterPreview('P1');
    updateCharacterPreview('P2');
}

function previewText(preset) {
    return `<b>${preset.name}</b><br>${preset.weapon} • ${preset.skill}<br>Portée ${preset.attackReach} • Dégâts ${preset.attackDamage}/${preset.chargedDamage}`;
}

function updateCharacterPreview(playerTag) {
    if (playerTag === 'P1') p1PreviewEl.innerHTML = previewText(presetById(p1CharacterSelect.value));
    if (playerTag === 'P2') p2PreviewEl.innerHTML = previewText(presetById(p2CharacterSelect.value));
}

p1CharacterSelect.addEventListener('change', () => updateCharacterPreview('P1'));
p2CharacterSelect.addEventListener('change', () => updateCharacterPreview('P2'));

populateCharacterSelects();

function resolveGlobalFn(name) {
    const fn = globalThis[name];
    return typeof fn === 'function' ? fn : () => {};
}

const safeInitAudio      = resolveGlobalFn('initAudio');
const safeSoundHit        = resolveGlobalFn('soundHit');
const safeSoundHitCharged = resolveGlobalFn('soundHitCharged');
const safeSoundJump       = resolveGlobalFn('soundJump');
const safeSoundDoubleJump = resolveGlobalFn('soundDoubleJump');
const safeSoundDash       = resolveGlobalFn('soundDash');
const safeSoundLand       = resolveGlobalFn('soundLand');
const safeSoundChargeTick = resolveGlobalFn('soundChargeTick');
const safeSoundChargeReady= resolveGlobalFn('soundChargeReady');
const safeSoundVictory    = resolveGlobalFn('soundVictory');
const safeSoundDraw       = resolveGlobalFn('soundDraw');
const safeSoundTimerBeep  = resolveGlobalFn('soundTimerBeep');


// RESIZE
function resizeCanvas() {
    DPR           = window.devicePixelRatio || 1;
    canvas.width  = canvas.clientWidth  * DPR;
    canvas.height = canvas.clientHeight * DPR;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();


// CLASSE PLAYER
class Player {
    constructor(x, color, glowColor, keys, playerTag) {
        this.startX    = x;
        this.x         = x;
        this.y         = FLOOR_Y - 90;
        this.width     = 46;
        this.height    = 90;
        this.color     = color;
        this.glowColor = glowColor;
        this.keys      = keys;
        this.playerTag = playerTag;
        this.playerName = playerTag === 'P1' ? 'Joueur 1' : 'Joueur 2';

        this.velocityX = 0;
        this.velocityY = 0;
        this.speed     = 5;
        this.jumpForce = -15;
        this.attackReach   = 60;
        this.attackDamage  = 12;
        this.chargedDamage = 28;
        this.dashPower     = 18;
        this.gravity       = 0.78;

        this.onGround    = false;
        this.isAttacking = false;
        this.attackTimer    = 0;
        this.attackCooldown = 0;
        this.hitThisSwing   = false;
        this.guarding = false;
        this.guardMeter = 100;
        this.guardBroken = 0;
        this.guardWindow = 0;
        this.parryFlash = 0;
        this.comboHits = 0;
        this.comboWindow = 0;

        this.health    = 100;
        this.hurtFlash = 0;
        this.knockX    = 0;

        this.facing    = color === '#ff5555' ? 1 : -1;
        this.walkCycle = 0;
        this.landPoseFrames = 0;

        // Double saut
        this.jumpsLeft  = 2;
        this.airJumpsMax = 2;

        // Dash
        this.dashCooldown = 0;
        this.isDashing    = false;
        this.dashTimer    = 0;

        // Coup chargé
        this.chargeTimer = 0;
        this.isCharging  = false;

        this.weaponName   = 'Poings';
        this.skillName    = 'Équilibré';
        this.weaponLength = 34;
        this.burnTimer    = 0;
        this.burnTick     = 0;
    }

    applyCharacter(profile) {
        this.character     = profile;
        this.color         = profile.color;
        this.glowColor     = profile.glowColor;
        this.speed         = profile.speed;
        this.jumpForce     = profile.jumpForce;
        this.attackReach   = profile.attackReach;
        this.attackDamage  = profile.attackDamage;
        this.chargedDamage = profile.chargedDamage;
        this.dashPower     = profile.dashPower;
        this.weaponName    = profile.weapon;
        this.skillName     = profile.skill;
        this.airJumpsMax   = profile.id === 'monk' ? 3 : 2;
        this.weaponLength  = profile.weaponLength || 34;
        this.jumpsLeft     = Math.min(this.jumpsLeft, this.airJumpsMax);
    }

    // Hitbox d'attaque (devant le joueur)
    get attackBox() {
        const weaponBonus = Math.max(6, this.weaponLength * 0.35);
        const reach = (this.isCharging ? this.attackReach + 14 : this.attackReach) + weaponBonus;
        return {
            x: this.facing > 0 ? this.x + this.width : this.x - reach,
            y: this.y + 15,
            w: reach,
            h: 55
        };
    }

    // Lancer une attaque (normale ou chargée)
    attack(charged) {
        if (this.attackCooldown > 0 || this.isAttacking || this.guarding) return;
        this.isAttacking    = true;
        this.attackTimer    = charged ? 22 : 16;
        this.attackCooldown = charged ? 45 : 30;
        this.hitThisSwing   = false;
        this.isCharging     = charged;
        if (charged) spawnParticles(this.x + this.width / 2, this.y + 20, this.glowColor, 18);
    }

    // Dash
    dash() {
        if (this.dashCooldown > 0 || this.isDashing) return;
        this.isDashing    = true;
        this.dashTimer    = 10;
        this.dashCooldown = 55;
        this.velocityX    = this.facing * this.dashPower;
        spawnParticles(this.x + this.width / 2, this.y + this.height / 2, this.color, 8);
    }

    // Recevoir un coup
    takeDamage(dmg, attacker = null) {
        const incomingFromFront = attacker && (attacker.x - this.x) * this.facing >= -15;
        if (this.guarding && this.guardBroken <= 0 && incomingFromFront && this.guardWindow > 0) {
            this.guardWindow = 0;
            this.guardMeter = Math.min(100, this.guardMeter + 14);
            this.parryFlash = 24;
            if (attacker) { attacker.attackCooldown = Math.max(attacker.attackCooldown, 38); attacker.knockX = -this.facing * 6; }
            spawnParticles(this.x + this.width/2 + this.facing*22, this.y+30, '#e5faff', 26);
            return {parried:true, damage:0};
        }
        if (this.guarding && this.guardBroken <= 0 && incomingFromFront) {
            const cost = Math.ceil(dmg * 2.1);
            const prevented = this.guardMeter >= cost ? .80 : .35;
            this.guardMeter = Math.max(0, this.guardMeter - cost);
            dmg = Math.max(1, Math.ceil(dmg * (1 - prevented)));
            spawnParticles(this.x + this.width/2 + this.facing*22, this.y + 30, '#61dfff', 15);
            if (this.guardMeter <= 0) {
                this.guardBroken = 105;
                this.guarding = false;
                spawnParticles(this.x + this.width/2, this.y + 20, '#ffbe5e', 20);
            }
        }
        this.health    = Math.max(0, this.health - dmg);
        if (dmg > 0) { this.comboHits = 0; this.comboWindow = 0; }
        this.hurtFlash = 12;
        this.knockX    = -this.facing * 9;
        triggerHitFlash();
        triggerScreenShake(dmg >= 20 ? 8 : 4);
        return {parried:false, damage:dmg};
    }

    applyBurn(durationFrames) {
        this.burnTimer = Math.max(this.burnTimer, durationFrames);
        this.burnTick  = 15;
    }

    // Mise à jour
    update() {
        if (this.guardWindow > 0) this.guardWindow--;
        if (this.parryFlash > 0) this.parryFlash--;
        if (this.comboWindow > 0) this.comboWindow--; else this.comboHits = 0;
        if (this.guardBroken > 0) this.guardBroken--;
        if (!this.guarding && this.guardBroken === 0) this.guardMeter = Math.min(100, this.guardMeter + 0.32);
        if (this.guarding) this.velocityX *= .45;
        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.attackTimer    > 0) {
            this.attackTimer--;
            if (this.attackTimer === 0) { this.isAttacking = false; this.isCharging = false; }
        }
        if (this.hurtFlash    > 0) this.hurtFlash--;
        if (this.dashCooldown > 0) this.dashCooldown--;
        if (this.dashTimer    > 0) {
            this.dashTimer--;
            if (this.dashTimer === 0) this.isDashing = false;
        }

        if (this.burnTimer > 0) {
            this.burnTimer--;
            this.burnTick--;
            if (this.burnTick <= 0) {
                this.health   = Math.max(0, this.health - 1);
                this.burnTick = 15;
                spawnParticles(this.x + this.width / 2, this.y + 16, '#ff7a1f', 3);
            }
        }

        // Knockback
        this.velocityX += this.knockX;
        this.knockX    *= 0.65;
        if (Math.abs(this.knockX) < 0.1) this.knockX = 0;

        if (this.landPoseFrames > 0) this.landPoseFrames--;

        // Physique
        this.velocityY += this.gravity;
        this.x         += this.velocityX;
        this.y         += this.velocityY;

        // Friction
        this.velocityX *= this.isDashing ? 0.92 : 0.82;

        // Sol
        const wasOnGround = this.onGround;
        this.onGround = false;

        if (this.y + this.height >= FLOOR_Y) {
            if (!wasOnGround) {
                this.landPoseFrames = 9;
                spawnLandingDust(this.x + this.width / 2, FLOOR_Y, this.color);
                safeSoundLand();
            }
            this.y         = FLOOR_Y - this.height;
            this.velocityY = 0;
            this.onGround  = true;
            this.jumpsLeft = this.airJumpsMax;
        }

        // Plateformes
        if (this.velocityY > 0) {
            for (const p of platforms) {
                const prevBottom = this.y + this.height - this.velocityY;
                if (
                    prevBottom           <= p.y + p.h &&
                    this.y + this.height >= p.y &&
                    this.x + this.width  >  p.x &&
                    this.x               <  p.x + p.w
                ) {
                    if (!wasOnGround) { this.landPoseFrames = 9; spawnLandingDust(this.x + this.width / 2, p.y, this.color); safeSoundLand(); }
                    this.y         = p.y - this.height;
                    this.velocityY = 0;
                    this.onGround  = true;
                    this.jumpsLeft = this.airJumpsMax;
                }
            }
        }

        // Murs
        this.x = Math.max(0, Math.min(GAME_WIDTH - this.width, this.x));

        // Cycle de marche
        if (Math.abs(this.velocityX) > 0.5 && this.onGround) {
            this.walkCycle += 0.18;
        } else {
            this.walkCycle *= 0.85;
        }
    }

    // Dessin
    draw() {
        const cx = this.x + this.width / 2;

        if (this.hurtFlash > 0 && Math.floor(this.hurtFlash / 2) % 2 === 0) {
            ctx.globalAlpha = 0.45;
        }

        // Ground shadow, narrower while airborne; a gameplay-free depth cue.
        ctx.save();
        const feetY = this.y + this.height;
        const airHeight = Math.max(0, FLOOR_Y - feetY);
        const shadowScale = Math.max(.40, 1 - airHeight / 240);
        ctx.globalAlpha = Math.max(.10, .33 - airHeight / 550);
        ctx.fillStyle = '#080812';
        ctx.beginPath();
        ctx.ellipse(cx, FLOOR_Y + 3, this.width * .56 * shadowScale, 5 * shadowScale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Traînées de dash
        if (this.isDashing) {
            ctx.globalAlpha = 0.2;
            ctx.fillStyle   = this.color;
            ctx.fillRect(this.x - this.facing * 20, this.y + 10, this.width, this.height - 10);
            ctx.fillRect(this.x - this.facing * 38, this.y + 20, this.width * 0.7, this.height - 30);
            ctx.globalAlpha = this.hurtFlash > 0 && Math.floor(this.hurtFlash / 2) % 2 === 0 ? 0.45 : 1;
        }

        if (this.burnTimer > 0) {
            ctx.globalAlpha = 0.35;
            ctx.fillStyle   = '#ff7a1f';
            ctx.beginPath();
            ctx.arc(cx, this.y + this.height / 2, 32 + Math.sin(Date.now() / 90) * 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        // Lueur
        ctx.shadowColor = this.isCharging ? '#FFD700' : this.glowColor;
        ctx.shadowBlur  = this.isAttacking ? 28 : (this.isDashing ? 20 : 8);

        // Corps
        const bodyGrad = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
        bodyGrad.addColorStop(0, this.color);
        bodyGrad.addColorStop(1, shadeColor(this.color, -40));
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.roundRect(this.x + 6, this.y + 28, this.width - 12, this.height - 28, 4);
        ctx.fill();

        // Tête
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(cx, this.y + 14, 18, 0, Math.PI * 2);
        ctx.fill();

        // Character-specific costume silhouettes, drawn over the base body.
        // All decorative geometry stays within the existing fighter draw path.
        const archetype = this.character ? this.character.id : 'bruiser';
        ctx.save();
        ctx.shadowBlur = 0;
        ctx.lineWidth = 2;
        if (archetype === 'bruiser') {
            // Broad armored pauldrons and heavy chest plate.
            ctx.fillStyle = '#4e343a';
            ctx.beginPath();ctx.ellipse(this.x+5,this.y+37,12,9,-.3,0,Math.PI*2);ctx.fill();
            ctx.beginPath();ctx.ellipse(this.x+this.width-5,this.y+37,12,9,.3,0,Math.PI*2);ctx.fill();
            ctx.fillStyle='rgba(255,204,168,.36)';
            ctx.fillRect(cx-10,this.y+40,20,13);
        } else if (archetype === 'assassin') {
            // Pointed hood and trailing scarf.
            ctx.fillStyle='#173d36';
            ctx.beginPath();ctx.moveTo(cx-18,this.y+11);ctx.lineTo(cx,this.y-13);
            ctx.lineTo(cx+18,this.y+11);ctx.closePath();ctx.fill();
            ctx.strokeStyle='#7dffb3';
            ctx.beginPath();ctx.moveTo(cx-10,this.y+32);
            ctx.lineTo(cx-22-this.facing*6,this.y+51);ctx.stroke();
        } else if (archetype === 'sniper') {
            // Narrow visor and aerodynamic shoulder armor.
            ctx.fillStyle='#173656';
            ctx.fillRect(cx-16,this.y+8,32,8);
            ctx.fillStyle='#b4edff';ctx.fillRect(cx+this.facing*3-7,this.y+10,15,3);
            ctx.strokeStyle='#6cbbe9';
            ctx.beginPath();ctx.moveTo(cx-15,this.y+33);ctx.lineTo(cx,this.y+43);
            ctx.lineTo(cx+15,this.y+33);ctx.stroke();
        } else if (archetype === 'pyro') {
            // Furnace collar and blazing mantle.
            ctx.fillStyle='#682716';
            ctx.beginPath();ctx.moveTo(cx-19,this.y+29);ctx.lineTo(cx-14,this.y+18);
            ctx.lineTo(cx,this.y+27);ctx.lineTo(cx+14,this.y+18);
            ctx.lineTo(cx+19,this.y+29);ctx.closePath();ctx.fill();
            ctx.strokeStyle='#ffb256';
            ctx.beginPath();ctx.moveTo(cx-13,this.y+47);ctx.lineTo(cx+13,this.y+47);ctx.stroke();
        } else if (archetype === 'monk') {
            // Layered ceremonial collar and waist sash.
            ctx.strokeStyle='#e3b9ff';
            ctx.lineWidth=5;
            ctx.beginPath();ctx.moveTo(cx-13,this.y+34);
            ctx.lineTo(cx,this.y+46);ctx.lineTo(cx+13,this.y+34);ctx.stroke();
            ctx.fillStyle='#3e235e';ctx.fillRect(cx-13,this.y+65,26,6);
            ctx.fillStyle='#d9acff';ctx.fillRect(cx-4,this.y+65,8,6);
        }
        ctx.restore();

        // Yeux
        ctx.fillStyle  = 'white';
        ctx.shadowBlur = 0;
        const eyeOffX  = this.facing > 0 ? 5 : -5;
        ctx.beginPath();
        ctx.arc(cx + eyeOffX, this.y + 12, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(cx + eyeOffX + this.facing * 1.5, this.y + 12, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Indicateur double saut
        if (!this.onGround && this.jumpsLeft === 1) {
            ctx.globalAlpha = 0.7;
            ctx.strokeStyle = this.color;
            ctx.lineWidth   = 2;
            ctx.beginPath();
            ctx.arc(cx, this.y - 10, 6, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        // Indicateur dash
        if (this.dashCooldown === 0 && !this.isDashing) {
            ctx.globalAlpha = 0.5;
            ctx.strokeStyle = this.color;
            ctx.lineWidth   = 2;
            ctx.beginPath();
            ctx.arc(cx, this.y + this.height + 5, 10, 0, Math.PI);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        // Combat-state poses: guard silhouette and motion accents are visual only.
        // Keep hitboxes and input handling entirely independent of these strokes.
        if (this.guarding && this.guardBroken === 0) {
            ctx.save();
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'rgba(20,31,48,.65)';
            ctx.beginPath();
            ctx.ellipse(cx + this.facing * 17, this.y + 49, 9, 22, this.facing * -.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = this.glowColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(cx + this.facing * 17, this.y + 49, 9, 22, this.facing * -.2, -Math.PI * .65, Math.PI * .65);
            ctx.stroke();
            ctx.restore();
        }
        if (this.isAttacking || this.isDashing) {
            ctx.save();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = this.glowColor;
            ctx.globalAlpha = this.isDashing ? .42 : .28;
            ctx.lineWidth = this.isDashing ? 3 : 2;
            for (let streak = 0; streak < 3; streak++) {
                const y = this.y + 31 + streak * 15;
                const back = cx - this.facing * (19 + streak * 5);
                ctx.beginPath();
                ctx.moveTo(back, y);
                ctx.lineTo(back - this.facing * (this.isDashing ? 29 : 17), y + 3);
                ctx.stroke();
            }
            ctx.restore();
        }

        // Five contextual poses: walk, airborne, landing, guarding, attacking.
        // Only the rendered limb positions change; physical hitboxes stay fixed.
        const isAirborne = !this.onGround;
        const landing = this.landPoseFrames > 0 && this.onGround;
        const guarded = this.guarding && this.guardBroken === 0;
        const legSwing = isAirborne ? (this.velocityY < 0 ? 9 : -7) :
            landing ? -9 : guarded ? -5 : this.isAttacking ? 5 : Math.sin(this.walkCycle) * 10;
        const kneeLift = isAirborne ? 13 : landing ? 9 : guarded ? 5 : 0;
        ctx.strokeStyle = shadeColor(this.color, -50);
        ctx.lineWidth   = 8;
        ctx.lineCap     = 'round';
        ctx.shadowBlur  = 0;

        ctx.beginPath();
        ctx.moveTo(cx - 8, this.y + this.height - 28);
        ctx.lineTo(cx - 8 + legSwing, this.y + this.height - kneeLift);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cx + 8, this.y + this.height - 28);
        ctx.lineTo(cx + 8 - legSwing, this.y + this.height - (isAirborne ? 9 : kneeLift));
        ctx.stroke();

        // Bras + arme
        const armSwing = guarded ? this.facing * 12 :
            this.isAttacking ? -this.facing * (this.isCharging ? 15 : 12) :
            isAirborne ? this.facing * 9 : landing ? -7 : -Math.sin(this.walkCycle) * 8;
        const armRaise = guarded ? -17 : this.isAttacking ? -12 : isAirborne ? -9 : 0;
        ctx.strokeStyle = shadeColor(this.color, -30);
        ctx.lineWidth   = 7;
        ctx.lineCap     = 'round';
        ctx.shadowBlur  = 0;
        ctx.beginPath();
        ctx.moveTo(this.x + 6, this.y + 38);
        ctx.lineTo(this.x + 6 + armSwing, this.y + 62 + armRaise);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(this.x + this.width - 6, this.y + 38);
        ctx.lineTo(this.x + this.width - 6 - armSwing, this.y + 62 + armRaise);
        ctx.stroke();

        this.drawWeapon();

        // Barre de charge
        if (this.chargeTimer > 0 && !this.isAttacking) {
            const pct = Math.min(this.chargeTimer / 40, 1);
            const bw  = 46;
            const bx  = this.x;
            const by  = this.y - 18;
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(bx, by, bw, 6);
            ctx.fillStyle   = pct >= 1 ? '#FFD700' : '#ff9900';
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur  = pct >= 1 ? 10 : 0;
            ctx.fillRect(bx, by, bw * pct, 6);
            ctx.shadowBlur = 0;
        }

        ctx.shadowBlur  = 0;
        ctx.globalAlpha = 1;
    }

    drawWeapon() {
        if (!this.character) return;

        const handX = this.facing > 0 ? this.x + this.width - 2 : this.x + 2;
        const handY = this.y + 41;
        const attackProgress = this.isAttacking ? 1 - (this.attackTimer / (this.isCharging ? 22 : 16)) : 0;
        const baseAngle = this.isAttacking
            ? (-0.7 + attackProgress * 1.35) * this.facing
            : Math.sin(this.walkCycle) * 0.08;

        ctx.save();
        ctx.translate(handX, handY);
        ctx.rotate(baseAngle);
        ctx.scale(this.facing, 1);
        ctx.lineCap  = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = this.glowColor;
        ctx.shadowBlur  = this.isAttacking ? 12 : 4;

        if (this.character.id === 'bruiser') {
            ctx.fillStyle = '#8a8a99';
            ctx.fillRect(0, -4, this.weaponLength - 12, 8);
            ctx.fillStyle = '#4d4d57';
            ctx.fillRect(this.weaponLength - 16, -14, 20, 28);
        } else if (this.character.id === 'assassin') {
            ctx.strokeStyle = '#d4fff1';
            ctx.lineWidth   = 3;
            ctx.beginPath();
            ctx.moveTo(2, -11); ctx.lineTo(this.weaponLength - 8, -2);
            ctx.moveTo(2, 11);  ctx.lineTo(this.weaponLength - 8,  2);
            ctx.stroke();
        } else if (this.character.id === 'sniper') {
            ctx.strokeStyle = '#cde0ff';
            ctx.lineWidth   = 4;
            ctx.beginPath();
            ctx.moveTo(-2, 0); ctx.lineTo(this.weaponLength, 0);
            ctx.stroke();
            ctx.fillStyle = '#8bb1ff';
            ctx.beginPath();
            ctx.moveTo(this.weaponLength, 0);
            ctx.lineTo(this.weaponLength - 10, -5);
            ctx.lineTo(this.weaponLength - 10,  5);
            ctx.closePath();
            ctx.fill();
        } else if (this.character.id === 'pyro') {
            ctx.strokeStyle = '#ffb157';
            ctx.lineWidth   = 3;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(12, -15, this.weaponLength - 14, 14, this.weaponLength, -8);
            ctx.stroke();
            ctx.fillStyle = '#ff5a20';
            ctx.beginPath();
            ctx.arc(this.weaponLength + 1, -8, this.isAttacking ? 5 : 3, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.character.id === 'monk') {
            ctx.strokeStyle = '#f0d7ff';
            ctx.lineWidth   = 5;
            ctx.beginPath();
            ctx.moveTo(-2, 0); ctx.lineTo(this.weaponLength - 2, 0);
            ctx.stroke();
            ctx.fillStyle = '#c98bff';
            ctx.beginPath();
            ctx.arc(-2, 0, 4, 0, Math.PI * 2);
            ctx.arc(this.weaponLength - 2, 0, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    // Reset
    reset() {
        this.health         = 100;
        this.x              = this.startX;
        this.y              = FLOOR_Y - this.height;
        this.velocityX      = 0;
        this.velocityY      = 0;
        this.onGround       = false;
        this.isAttacking    = false;
        this.attackTimer    = 0;
        this.attackCooldown = 0;
        this.hitThisSwing   = false;
        this.guarding = false;
        this.guardMeter = 100;
        this.guardBroken = 0;
        this.guardWindow = 0;
        this.parryFlash = 0;
        this.comboHits = 0;
        this.comboWindow = 0;
        this.hurtFlash      = 0;
        this.knockX         = 0;
        this.walkCycle      = 0;
        this.dashCooldown   = 0;
        this.isDashing      = false;
        this.dashTimer      = 0;
        this.chargeTimer    = 0;
        this.isCharging     = false;
        this.burnTimer      = 0;
        this.burnTick       = 0;
        this.jumpsLeft      = this.airJumpsMax;
    }
}


// CREATION DES JOUEURS
const player1 = new Player(
    100,
    '#ff5555',
    '#ff2200',
    { left: 'q', right: 'd', jump: 'z', attack: 's', dash: 'a', guard: 'e' },
    'P1'
);

const player2 = new Player(
    GAME_WIDTH - 146,
    '#5588ff',
    '#2255ff',
    { left: 'arrowleft', right: 'arrowright', jump: 'arrowup', attack: 'arrowdown', dash: '/', guard: 'shift' },
    'P2'
);

function setupPlayersFromUI() {
    const p1Name = p1NameInput.value.trim();
    const solo = !!document.getElementById('solo-ai')?.checked;
    const p2Name = solo ? (p2NameInput.value.trim() || 'IA') : p2NameInput.value.trim();

    updateCharacterPreview('P1');
    updateCharacterPreview('P2');

    if (!p1Name || !p2Name) {
        setupErrorEl.textContent = 'Les deux joueurs doivent entrer un nom.';
        return false;
    }

    player1.playerName = p1Name;
    player2.playerName = p2Name;
    window.fightingSoloAI = solo;
    player1.applyCharacter(presetById(p1CharacterSelect.value));
    player2.applyCharacter(presetById(p2CharacterSelect.value));
    setupErrorEl.textContent = '';
    return true;
}

startMatchBtn.addEventListener('click', () => {
    if (setupPlayersFromUI()) resetGame();
});


// SAISIE CLAVIER
const keys     = {};
const keysDown = {};

window.addEventListener('keydown', e => {
    safeInitAudio();
    if (!e || typeof e.key !== 'string') return;
    const k = e.key.toLowerCase();
    if (!keys[k]) keysDown[k] = true;
    keys[k] = true;
    if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k)) e.preventDefault();
});

window.addEventListener('keyup', e => {
    if (!e || typeof e.key !== 'string') return;
    const k     = e.key.toLowerCase();
    keys[k]     = false;
    keysDown[k] = false;
});


// Keep input states consistent when focus leaves the game tab.
window.addEventListener('blur', () => {
    Object.keys(keys).forEach(key => { keys[key] = false; });
    Object.keys(keysDown).forEach(key => { keysDown[key] = false; });
    player1.guarding = false;
    player2.guarding = false;
});

// HELPERS
function boxOverlap(a, b) {
    return a.x < b.x + b.w &&
           a.x + a.w > b.x &&
           a.y < b.y + b.h &&
           a.y + a.h > b.y;
}

function shadeColor(hex, amount) {
    const num = parseInt(hex.slice(1), 16);
    const r   = Math.min(255, Math.max(0, (num >> 16)         + amount));
    const g   = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
    const b   = Math.min(255, Math.max(0, (num & 0xff)        + amount));
    return `rgb(${r},${g},${b})`;
}


// RESET COMPLET
function resetGame() {
    player1.reset();
    player2.reset();
    particles.length = 0;
    winner     = null;
    matchTimer = TIMER_DURATION;
    gameState  = 'playing';
}


// FOND ANIME
function drawBackground() {
    const sky = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    sky.addColorStop(0,   '#1a1a3e');
    sky.addColorStop(0.5, '#2d2060');
    sky.addColorStop(1,   '#3d1060');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Étoiles fixes
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (let i = 0; i < 40; i++) {
        const sx = (i * 197 + 53) % GAME_WIDTH;
        const sy = (i * 113 + 17) % (GAME_HEIGHT * 0.55);
        const sr = 0.5 + (i % 3) * 0.5;
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
    }

    updateAndDrawClouds();

    // Layered distant skyline: deterministic silhouette, no asset downloads.
    ctx.save();
    const ridge = [
        [0,.76],[.07,.69],[.14,.73],[.22,.61],[.30,.70],
        [.39,.64],[.48,.71],[.56,.59],[.65,.68],[.74,.63],
        [.83,.73],[.92,.65],[1,.71]
    ];
    ctx.fillStyle = '#211b3e';
    ctx.beginPath();ctx.moveTo(0,FLOOR_Y);
    ridge.forEach(([x,y]) => ctx.lineTo(x * GAME_WIDTH, y * FLOOR_Y));
    ctx.lineTo(GAME_WIDTH,FLOOR_Y);ctx.closePath();ctx.fill();
    ctx.fillStyle = 'rgba(15,13,34,.68)';
    for (let i=0;i<18;i++) {
        const bw=22+(i*17)%44;
        const bx=i*GAME_WIDTH/17 - 5;
        const bh=18+(i*29)%55;
        ctx.fillRect(bx,FLOOR_Y-bh,bw,bh);
        ctx.fillStyle='rgba(174,124,213,.13)';
        for(let k=0;k<3;k++) ctx.fillRect(bx+5+k*10,FLOOR_Y-bh+9,3,5);
        ctx.fillStyle='rgba(15,13,34,.68)';
    }
    ctx.restore();

    // Sol
    const groundGrad = ctx.createLinearGradient(0, FLOOR_Y, 0, GAME_HEIGHT);
    groundGrad.addColorStop(0, '#3a2a0a');
    groundGrad.addColorStop(1, '#1a1005');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, FLOOR_Y, GAME_WIDTH, GAME_HEIGHT - FLOOR_Y);

    ctx.fillStyle = '#5DBB3F';
    ctx.fillRect(0, FLOOR_Y, GAME_WIDTH, 5);
    ctx.fillStyle = '#4DA02F';
    ctx.fillRect(0, FLOOR_Y + 5, GAME_WIDTH, 3);
}


// TRAITEMENT INPUTS
function handleInputs(p) {
    if (keysDown[p.keys.guard] && p.guardBroken === 0) p.guardWindow = 9;
    keysDown[p.keys.guard] = false;
    p.guarding = !!keys[p.keys.guard] && p.guardBroken === 0 && p.guardMeter > 0 && !p.isAttacking;
    if (keys[p.keys.left])  { p.velocityX = -p.speed; p.facing = -1; }
    if (keys[p.keys.right]) { p.velocityX =  p.speed; p.facing =  1; }

    // Double saut
    if (keysDown[p.keys.jump]) {
        if (p.jumpsLeft > 0) {
            p.velocityY = p.jumpForce;
            p.jumpsLeft--;
            p.onGround  = false;
            if (p.jumpsLeft === 0) {
                spawnParticles(p.x + p.width / 2, p.y + p.height, p.color, 6);
                safeSoundDoubleJump();
            } else {
                safeSoundJump();
            }
        }
        keysDown[p.keys.jump] = false;
    }

    // Dash
    if (!p.guarding && keysDown[p.keys.dash]) {
        p.dash();
        safeSoundDash();
        keysDown[p.keys.dash] = false;
    }

    // Coup chargé
    if (!p.guarding && keys[p.keys.attack] && !p.isAttacking) {
        p.chargeTimer++;
        p.isCharging = false;
        if (p.chargeTimer % 8 === 0) safeSoundChargeTick(Math.min(p.chargeTimer / 40, 1));
        if (p.chargeTimer === 40)    safeSoundChargeReady();
    } else if (!keys[p.keys.attack] && p.chargeTimer > 0 && !p.isAttacking && !p.guarding) {
        p.attack(p.chargeTimer >= 40);
        p.chargeTimer = 0;
    } else if (p.isAttacking || p.guarding) {
        p.chargeTimer = 0;
    }
}


// Solo mode is part of the original game; no second build is required.
function handleSoloAI(bot, target) {
    const difficulty = document.getElementById('ai-difficulty')?.value || 'normal';
    const reaction = difficulty === 'hard' ? 0.88 : difficulty === 'easy' ? 0.38 : 0.65;
    const dx = target.x - bot.x;
    const distance = Math.abs(dx);
    bot.guarding = false;
    if (target.isAttacking && distance < target.attackReach + 50 && bot.guardBroken === 0 && Math.random() < reaction * .12) {
        bot.guarding = true;
        bot.guardWindow = Math.max(bot.guardWindow, 5);
    }
    // Always neutralise horizontal movement inside the preferred attack range;
    // otherwise the previous velocity makes the bot slide into its opponent.
    if (bot.guarding) bot.velocityX = 0;
    else if (distance > bot.attackReach * .68) bot.velocityX = Math.sign(dx) * bot.speed * (difficulty === 'hard' ? .92 : .68);
    else if (distance < 34) bot.velocityX = -Math.sign(dx) * bot.speed * .38;
    else bot.velocityX *= .35;
    if (distance < bot.attackReach + 18 && bot.attackCooldown <= 0 && !bot.guarding && Math.random() < reaction * .085) {
        bot.attack(difficulty === 'hard' && Math.random() < .25);
    }
    if (difficulty !== 'easy' && distance > 140 && bot.onGround && Math.random() < .006) {
        bot.velocityY = bot.jumpForce;bot.onGround = false;
    }
}

// BOUCLE DE JEU
function gameLoop() {
    ctx.resetTransform();
    ctx.scale(DPR, DPR);
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    const clientWidth  = canvas.clientWidth;
    const clientHeight = canvas.clientHeight;
    const scale   = Math.min(clientWidth / GAME_WIDTH, clientHeight / GAME_HEIGHT);
    const offsetX = (clientWidth  - GAME_WIDTH  * scale) / 2;
    const offsetY = (clientHeight - GAME_HEIGHT * scale) / 2;

    const shake = getScreenShake();
    ctx.save();
    ctx.translate(offsetX + shake.x, offsetY + shake.y);
    ctx.scale(scale, scale);

    drawBackground();
    drawPlatforms();

    // ECRAN DE DEMARRAGE
    if (gameState === 'start') {
        ctx.restore();
        drawStartScreen();
        if (keysDown[' ']) {
            keysDown[' '] = false;
            if (setupPlayersFromUI()) resetGame();
        }
        requestAnimationFrame(gameLoop);
        return;
    }

    // JEU EN COURS
    if (gameState === 'playing') {
        const prevSec = Math.ceil(matchTimer / 60);
        matchTimer--;
        const newSec = Math.ceil(matchTimer / 60);
        if (newSec !== prevSec && newSec <= 10 && newSec > 0) safeSoundTimerBeep();

        handleInputs(player1);
        if (window.fightingSoloAI) handleSoloAI(player2, player1);
        else handleInputs(player2);

        // Facing automatique
        if (player1.x < player2.x) { player1.facing =  1; player2.facing = -1; }
        else                        { player1.facing = -1; player2.facing =  1; }

        player1.update();
        player2.update();

        // Attaques
        if (player1.isAttacking && !player1.hitThisSwing) {
            const ab = player1.attackBox;
            if (boxOverlap(ab, { x: player2.x, y: player2.y, w: player2.width, h: player2.height })) {
                let dmg = player1.isCharging ? player1.chargedDamage : player1.attackDamage;
                if (player1.character?.id === 'assassin' && player1.isDashing) dmg += 6;
                const comboBonus = player1.comboWindow > 0 ? Math.min(5, player1.comboHits * 2) : 0;
                const outcome = player2.takeDamage(dmg + comboBonus, player1);
                if (!outcome.parried) { player1.comboHits = Math.min(9, player1.comboHits + 1); player1.comboWindow = 125; }
                else { player1.comboHits = 0; player1.comboWindow = 0; }
                if (!outcome.parried && player1.character?.id === 'pyro') player2.applyBurn(player1.isCharging ? 220 : 140);
                player1.hitThisSwing = true;
                if (player1.isCharging) safeSoundHitCharged(); else safeSoundHit();
                spawnParticles(player2.x + player2.width / 2, player2.y + 30, '#FFD700', player1.isCharging ? 20 : 12);
            }
        }
        if (player2.isAttacking && !player2.hitThisSwing) {
            const ab = player2.attackBox;
            if (boxOverlap(ab, { x: player1.x, y: player1.y, w: player1.width, h: player1.height })) {
                let dmg = player2.isCharging ? player2.chargedDamage : player2.attackDamage;
                if (player2.character?.id === 'assassin' && player2.isDashing) dmg += 6;
                const comboBonus = player2.comboWindow > 0 ? Math.min(5, player2.comboHits * 2) : 0;
                const outcome = player1.takeDamage(dmg + comboBonus, player2);
                if (!outcome.parried) { player2.comboHits = Math.min(9, player2.comboHits + 1); player2.comboWindow = 125; }
                else { player2.comboHits = 0; player2.comboWindow = 0; }
                if (!outcome.parried && player2.character?.id === 'pyro') player1.applyBurn(player2.isCharging ? 220 : 140);
                player2.hitThisSwing = true;
                if (player2.isCharging) safeSoundHitCharged(); else safeSoundHit();
                spawnParticles(player1.x + player1.width / 2, player1.y + 30, '#FFD700', player2.isCharging ? 20 : 12);
            }
        }

        updateParticles();
        drawParticles();

        player1.draw();
        player2.draw();
        // Directional shield and guard stamina indicators
        [player1, player2].forEach(p => {
            const barX = p.x - 2, barY = p.y - 14;
            ctx.fillStyle = '#10202c'; ctx.fillRect(barX, barY, p.width + 4, 5);
            ctx.fillStyle = p.guardBroken > 0 ? '#ff6040' : '#5bd8ff';
            ctx.fillRect(barX, barY, (p.width + 4) * p.guardMeter / 100, 5);
            if (p.comboHits >= 2 && p.comboWindow > 0) {
                ctx.fillStyle = '#ffde77';ctx.textAlign='center';ctx.font='bold 14px sans-serif';
                ctx.fillText(p.comboHits + ' COMBO',p.x+p.width/2,p.y-23);
            }
            if (p.parryFlash > 0) {
                ctx.fillStyle='#c6f7ff';ctx.textAlign='center';ctx.font='bold 15px sans-serif';
                ctx.fillText('PARRY !',p.x+p.width/2,p.y-40);
            }
            if (p.guarding) {
                ctx.save();
                ctx.strokeStyle = '#8ae9ff'; ctx.lineWidth = 4; ctx.shadowColor = '#37d6ff'; ctx.shadowBlur = 16;
                ctx.beginPath(); ctx.arc(p.x + p.width/2 + p.facing*17, p.y + 41, 29, -.9, .9);
                ctx.stroke();ctx.restore();
            }
        });


        drawHitFlash();

        if (player1.health <= 0 || player2.health <= 0) {
            winner    = player1.health > player2.health ? player1 :
                        player2.health > player1.health ? player2 : null;
            gameState = 'gameover';
            if (winner) safeSoundVictory(); else safeSoundDraw();
        }
        if (matchTimer <= 0) {
            winner    = player1.health > player2.health ? player1 :
                        player2.health > player1.health ? player2 : null;
            gameState = 'gameover';
            if (winner) safeSoundVictory(); else safeSoundDraw();
        }
    }

    ctx.restore();

    if (gameState === 'playing' || gameState === 'gameover') {
        drawHealthBars(player1, player2);
    }

    if (gameState === 'gameover') {
        drawGameOver(winner);
        if (keysDown[' ']) {
            keysDown[' '] = false;
            if (setupPlayersFromUI()) resetGame();
        }
    }

    requestAnimationFrame(gameLoop);
}

player1.applyCharacter(presetById('bruiser'));
player2.applyCharacter(presetById('sniper'));

gameLoop();