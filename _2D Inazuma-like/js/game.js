// /js/game.js
(() => {
  "use strict";

  /**
   * Inazuma Mini Soccer - Vanilla JS (v2)
   * Améliorations: GK équipe joueur, terrain, son Web Audio,
   * ballon football rotatif, numéros de maillot, IA améliorée,
   * flash de but, confettis, indicateur spécial.
   */

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  const hudScore   = document.getElementById("hudScore");
  const hudTime    = document.getElementById("hudTime");
  const hudStamina = document.getElementById("hudStamina");
  const hudPower   = document.getElementById("hudPower");
  const btnPlay    = document.getElementById("btnPlay");
  const btnPause   = document.getElementById("btnPause");
  const btnReset   = document.getElementById("btnReset");
  const overlay    = document.getElementById("overlay");
  const btnOverlayPlay = document.getElementById("btnOverlayPlay");
  const btnOverlayHelp = document.getElementById("btnOverlayHelp");
  const help  = document.getElementById("help");
  const toast = document.getElementById("toast");

  const TAU   = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp  = (a, b, t) => a + (b - a) * t;
  const rand  = (a, b) => a + Math.random() * (b - a);

  function vecLen(x, y) { return Math.hypot(x, y); }
  function vecNorm(x, y) {
    const l = Math.hypot(x, y) || 1;
    return { x: x / l, y: y / l };
  }
  function formatTime(sec) {
    const s = Math.max(0, Math.floor(sec));
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  }
  function showToast(text, ms = 1300) {
    toast.textContent = text;
    toast.classList.remove("hidden");
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => toast.classList.add("hidden"), ms);
  }

  // ─── Audio (Web Audio API) ─────────────────────────────────────────────────
  let _ac = null;
  function getAC() {
    if (!_ac) _ac = new (window.AudioContext || window.webkitAudioContext)();
    return _ac;
  }

  function sndKick(power = 0.7) {
    try {
      const ac = getAC();
      if (ac.state === "suspended") ac.resume();
      const dur = 0.10 + 0.06 * power;
      const buf = ac.createBuffer(1, Math.ceil(ac.sampleRate * dur), ac.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) {
        const t = i / ac.sampleRate;
        d[i] = (Math.random() * 2 - 1) * Math.exp(-t * (28 - 10 * power)) * power;
      }
      const src = ac.createBufferSource();
      src.buffer = buf;
      const g = ac.createGain();
      g.gain.value = 0.55;
      src.connect(g);
      g.connect(ac.destination);
      src.start();
    } catch (e) { /* silence */ }
  }

  function sndGoal() {
    try {
      const ac = getAC();
      if (ac.state === "suspended") ac.resume();
      [0, 0.12, 0.24, 0.38].forEach((delay, i) => {
        const osc = ac.createOscillator();
        const g   = ac.createGain();
        osc.type = "sine";
        osc.frequency.value = [330, 440, 550, 660][i];
        g.gain.setValueAtTime(0.28, ac.currentTime + delay);
        g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + delay + 0.45);
        osc.connect(g);
        g.connect(ac.destination);
        osc.start(ac.currentTime + delay);
        osc.stop(ac.currentTime + delay + 0.45);
      });
    } catch (e) { /* silence */ }
  }

  function sndSpecial() {
    try {
      const ac = getAC();
      if (ac.state === "suspended") ac.resume();
      const osc = ac.createOscillator();
      const g   = ac.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(200, ac.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ac.currentTime + 0.15);
      g.gain.setValueAtTime(0.35, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.28);
      osc.connect(g);
      g.connect(ac.destination);
      osc.start();
      osc.stop(ac.currentTime + 0.28);
    } catch (e) { /* silence */ }
  }

  function sndWhistle() {
    try {
      const ac = getAC();
      if (ac.state === "suspended") ac.resume();
      const osc = ac.createOscillator();
      const g   = ac.createGain();
      osc.type = "sine";
      osc.frequency.value = 1800;
      g.gain.setValueAtTime(0.28, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.32);
      osc.connect(g);
      g.connect(ac.destination);
      osc.start();
      osc.stop(ac.currentTime + 0.32);
    } catch (e) { /* silence */ }
  }

  // ─── CameraShake ───────────────────────────────────────────────────────────
  class CameraShake {
    constructor() { this.t = 0; this.strength = 0; this.x = 0; this.y = 0; }
    kick(s, t) { this.strength = Math.max(this.strength, s); this.t = Math.max(this.t, t); }
    update(dt) {
      if (this.t <= 0) { this.x = 0; this.y = 0; this.strength = 0; return; }
      this.t -= dt;
      const s = this.strength * (this.t / Math.max(0.0001, this.t + dt));
      this.x = rand(-s, s);
      this.y = rand(-s, s);
      this.strength *= 0.92;
    }
  }

  // ─── Particle ──────────────────────────────────────────────────────────────
  class Particle {
    constructor(x, y, vx, vy, life, size, kind, color) {
      this.x = x; this.y = y;
      this.vx = vx; this.vy = vy;
      this.life = life; this.maxLife = life;
      this.size = size; this.kind = kind;
      this.color = color || null;
    }
    update(dt) {
      this.life -= dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.vx *= 0.97;
      this.vy *= 0.97;
    }
    draw(ctx) {
      const t = clamp(this.life / this.maxLife, 0, 1);
      ctx.save();
      ctx.globalAlpha = t * 0.88;
      if (this.color) {
        ctx.fillStyle = this.color;
      } else if (this.kind === "spark") {
        ctx.fillStyle = "rgba(255,255,200,0.95)";
      } else if (this.kind === "aura") {
        ctx.fillStyle = "rgba(124,92,255,0.72)";
      } else if (this.kind === "goal") {
        ctx.fillStyle = `hsl(${(this.life * 500) % 360},100%,62%)`;
      } else {
        ctx.fillStyle = "rgba(34,211,238,0.72)";
      }
      ctx.beginPath();
      ctx.arc(this.x, this.y, Math.max(0.5, this.size * (0.5 + 0.8 * (1 - t))), 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  // ─── Ball ──────────────────────────────────────────────────────────────────
  class Ball {
    constructor(x, y) {
      this.x = x; this.y = y;
      this.vx = 0; this.vy = 0;
      this.r = 8.5;
      this.spin = 0;
      this.angle = 0;       // visual rotation of football panels
      this.lastTouch = null;
      this.trail = [];
      this.trailColor = "rgba(124,92,255,1)";
    }
    reset(x, y) {
      this.x = x; this.y = y;
      this.vx = 0; this.vy = 0;
      this.spin = 0; this.angle = 0;
      this.lastTouch = null;
      this.trail.length = 0;
      this.trailColor = "rgba(124,92,255,1)";
    }
    update(dt, field) {
      this.vx *= 0.992;
      this.vy *= 0.992;

      if (Math.abs(this.spin) > 0.001) {
        const sx = -this.vy * this.spin;
        const sy =  this.vx * this.spin;
        this.vx += sx * dt;
        this.vy += sy * dt;
        this.spin *= 0.985;
      }

      const speed = vecLen(this.vx, this.vy);
      this.angle += speed * dt * 0.06;

      this.x += this.vx * dt;
      this.y += this.vy * dt;

      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > 18) this.trail.shift();

      const { left, right, top, bottom } = field.bounds;
      if (this.x - this.r < left)   { this.x = left  + this.r; this.vx *= -0.75; }
      if (this.x + this.r > right)  { this.x = right - this.r; this.vx *= -0.75; }
      if (this.y - this.r < top)    { this.y = top   + this.r; this.vy *= -0.75; }
      if (this.y + this.r > bottom) { this.y = bottom - this.r; this.vy *= -0.75; }
    }
    draw(ctx) {
      const speed = vecLen(this.vx, this.vy);
      const trailStrength = clamp(speed / 700, 0, 1);

      // Trail
      for (let i = 0; i < this.trail.length; i++) {
        const t = i / this.trail.length;
        ctx.save();
        ctx.globalAlpha = 0.18 * t * trailStrength;
        ctx.fillStyle = this.trailColor;
        ctx.beginPath();
        ctx.arc(this.trail[i].x, this.trail[i].y, 7 * t, 0, TAU);
        ctx.fill();
        ctx.restore();
      }

      // Drop shadow
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.beginPath();
      ctx.ellipse(this.x + 2, this.y + 3, this.r * 0.85, this.r * 0.50, 0, 0, TAU);
      ctx.fill();
      ctx.restore();

      // Ball body with radial gradient (shiny)
      const grad = ctx.createRadialGradient(
        this.x - this.r * 0.32, this.y - this.r * 0.32, 0.5,
        this.x, this.y, this.r
      );
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.55, "#e8e8e8");
      grad.addColorStop(1, "#cccccc");

      ctx.save();
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, TAU);
      ctx.fill();

      // Football panels (1 center + 5 surrounding black spots)
      ctx.fillStyle = "rgba(22,22,22,0.88)";
      const pDist = this.r * 0.52;
      const pR    = this.r * 0.28;

      // Center pentagon spot
      ctx.beginPath();
      ctx.arc(this.x, this.y, pR, 0, TAU);
      ctx.fill();

      // 5 outer spots rotating with the ball
      for (let i = 0; i < 5; i++) {
        const a = this.angle + i * (TAU / 5);
        const px = this.x + Math.cos(a) * pDist;
        const py = this.y + Math.sin(a) * pDist;
        ctx.beginPath();
        ctx.arc(px, py, pR * 0.72, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // ─── Player ────────────────────────────────────────────────────────────────
  class Player {
    constructor(opts) {
      this.team = opts.team;       // 0: joueur, 1: ennemi
      this.role = opts.role;       // "field" | "gk"
      this.num  = opts.num  ?? 1;
      this.x    = opts.x;
      this.y    = opts.y;
      this.vx   = 0;
      this.vy   = 0;
      this.r    = opts.r ?? 16;

      this.maxSpeed = opts.maxSpeed ?? 240;
      this.accel    = opts.accel    ?? 1500;

      this.stamina          = 1;
      this.staminaRegen     = opts.staminaRegen      ?? 0.16;
      this.staminaDrainSprint = opts.staminaDrainSprint ?? 0.35;

      this.hasBall      = false;
      this.facingX      = this.team === 0 ? 1 : -1;
      this.facingY      = 0;
      this.kickCooldown = 0;
      this.specialCooldown = 0;
      this.charge    = 0;
      this.charging  = false;
      this.specialActive = 0;
    }

    update(dt, game) {
      this.kickCooldown    = Math.max(0, this.kickCooldown    - dt);
      this.specialCooldown = Math.max(0, this.specialCooldown - dt);
      this.specialActive   = Math.max(0, this.specialActive   - dt);
      this.stamina = clamp(this.stamina + this.staminaRegen * dt, 0, 1);

      this.vx *= 0.90;
      this.vy *= 0.90;
      this.x  += this.vx * dt;
      this.y  += this.vy * dt;

      const b = game.field.bounds;
      this.x = clamp(this.x, b.left + this.r, b.right  - this.r);
      this.y = clamp(this.y, b.top  + this.r, b.bottom - this.r);

      const speed = vecLen(this.vx, this.vy);
      if (speed > 10) {
        const n = vecNorm(this.vx, this.vy);
        this.facingX = n.x;
        this.facingY = n.y;
      }
    }

    applyInput(dt, game, input) {
      const moveX = (input.right ? 1 : 0) - (input.left  ? 1 : 0);
      const moveY = (input.down  ? 1 : 0) - (input.up    ? 1 : 0);

      let targetSpeed = this.maxSpeed;
      const sprinting = input.sprint && this.stamina > 0.05;

      if (sprinting) {
        targetSpeed *= 1.38;
        this.stamina = clamp(this.stamina - this.staminaDrainSprint * dt, 0, 1);
        this.spawnAura(game, 2);
      }

      if (moveX !== 0 || moveY !== 0) {
        const n = vecNorm(moveX, moveY);
        this.vx += n.x * this.accel * dt;
        this.vy += n.y * this.accel * dt;
        const s = vecLen(this.vx, this.vy);
        if (s > targetSpeed) {
          const v = vecNorm(this.vx, this.vy);
          this.vx = v.x * targetSpeed;
          this.vy = v.y * targetSpeed;
        }
      }

      // ── Contrôle de balle (dribble) ─────────────────────────────────
      // Quand proche du ballon sans tirer, le ballon reste collé devant le joueur.
      if (!input.kick && !this.charging) {
        const ball = game.ball;
        const bDx  = ball.x - this.x;
        const bDy  = ball.y - this.y;
        const bDist = vecLen(bDx, bDy);
        const pSpeed = vecLen(this.vx, this.vy);

        if (bDist < this.r + ball.r + 18 && pSpeed > 25) {
          const dir     = vecNorm(this.vx, this.vy);
          const targetX = this.x + dir.x * (this.r + ball.r + 2);
          const targetY = this.y + dir.y * (this.r + ball.r + 2);
          ball.vx += (targetX - ball.x) * 10;
          ball.vy += (targetY - ball.y) * 10;
          ball.vx *= 0.76;
          ball.vy *= 0.76;
          ball.lastTouch = this.team;
        }
      }

      if (input.special && this.specialCooldown <= 0 && this.stamina >= 0.45) {
        this.doSpecial(game);
      }

      if (input.kick) {
        this.charging   = true;
        this.chargeTime = (this.chargeTime || 0) + dt;
        this.charge     = clamp(this.charge + dt * 0.9, 0, 1);
        this.spawnChargeSparks(game);
      } else {
        if (this.charging) {
          this.charging   = false;
          this.chargeTime = 0;
          this.releaseKick(game);
        }
        this.chargeTime = 0;
        this.charge = Math.max(0, this.charge - dt * 0.8);
      }
    }

    doSpecial(game) {
      this.specialCooldown = 2.2;
      this.specialActive   = 0.60;
      this.stamina = clamp(this.stamina - 0.45, 0, 1);

      this.vx += this.facingX * 720;
      this.vy += this.facingY * 720;

      game.camera.kick(10, 0.20);
      sndSpecial();
      showToast("⚡ SPECIAL MOVE!");

      const col = this.team === 0 ? "rgba(34,211,238,0.85)" : "rgba(255,59,107,0.85)";
      for (let i = 0; i < 26; i++) {
        const a = rand(0, TAU), sp = rand(120, 640);
        game.particles.push(new Particle(
          this.x, this.y,
          Math.cos(a) * sp, Math.sin(a) * sp,
          rand(0.25, 0.65), rand(2, 5.5), "aura", col
        ));
      }

      if (this.isCloseToBall(game.ball)) {
        const dir = this.aimToEnemyGoal(game);
        this.kickBall(game, 1.0, dir.x, dir.y, true);
      }
    }

    releaseKick(game) {
      if (this.kickCooldown > 0) return;
      const ball = game.ball;
      if (!this.isCloseToBall(ball)) return;

      const power = clamp(this.charge, 0.08, 1);

      // L'aim vise TOUJOURS le but ennemi (+ léger écart selon puissance)
      // Plus la charge est élevée, plus le tir est précis
      const goalAim = this.aimToEnemyGoal(game);
      const wobble  = (1 - power) * 0.30;
      const finalDir = vecNorm(
        goalAim.x + rand(-wobble, wobble),
        goalAim.y + rand(-wobble, wobble)
      );

      if (power < 0.45) {
        // Tap rapide → passe vers le coéquipier le plus avancé
        const passDir = this.aimToTeammate(game);
        if (passDir) {
          this.kickBall(game, 0.38 + 0.20 * power, passDir.x, passDir.y, false);
          showToast("Passe !");
        } else {
          this.kickBall(game, 0.45, finalDir.x, finalDir.y, false);
          showToast("Tir !");
        }
      } else {
        this.kickBall(game, power, finalDir.x, finalDir.y, false);
        showToast(power > 0.85 ? "🔥 Tir chargé !" : "Tir !");
      }

      this.kickCooldown = 0.18;
      this.charge = 0;
    }

    kickBall(game, power01, dx, dy, isSpecial) {
      const ball = game.ball;
      const base = isSpecial ? 980 : 760;
      const p    = base * (0.35 + 0.65 * power01);

      ball.vx = dx * p + this.vx * 0.20;
      ball.vy = dy * p + this.vy * 0.20;
      ball.spin += isSpecial ? rand(-3.2, 3.2) : rand(-1.2, 1.2);
      ball.lastTouch  = this.team;
      ball.trailColor = this.team === 0 ? "rgba(34,211,238,1)" : "rgba(255,59,107,1)";

      sndKick(isSpecial ? 1.0 : 0.30 + 0.70 * power01);
      game.camera.kick(isSpecial ? 12 : 6, isSpecial ? 0.18 : 0.11);

      const col = this.team === 0 ? "rgba(34,211,238,0.75)" : "rgba(255,59,107,0.75)";
      const cnt = isSpecial ? 28 : 12;
      for (let i = 0; i < cnt; i++) {
        const a  = rand(0, TAU);
        const sp = rand(isSpecial ? 160 : 80, isSpecial ? 720 : 280);
        game.particles.push(new Particle(
          ball.x, ball.y,
          Math.cos(a) * sp, Math.sin(a) * sp,
          rand(0.15, isSpecial ? 0.58 : 0.38),
          rand(1.5, isSpecial ? 5.5 : 3.5),
          isSpecial ? "aura" : "spark", col
        ));
      }
    }

    isCloseToBall(ball) {
      return vecLen(this.x - ball.x, this.y - ball.y) < this.r + ball.r + 7;
    }

    aimToEnemyGoal(game) {
      const goal = this.team === 0 ? game.field.goalRight : game.field.goalLeft;
      // Vise à l'intérieur du cadre, légèrement biaisé vers les coins
      const margin  = 18;
      const targetY = rand(goal.y1 + margin, goal.y2 - margin);
      return vecNorm(goal.x - this.x, targetY - this.y);
    }

    aimToTeammate(game) {
      // Cherche le coéquipier de terrain le plus avancé
      const mates = game.players.filter(
        p => p.team === this.team && p !== this && p.role === "field"
      );
      if (!mates.length) return null;
      mates.sort((a, b) => this.team === 0 ? b.x - a.x : a.x - b.x);
      return vecNorm(mates[0].x - this.x, mates[0].y - this.y);
    }

    spawnAura(game, count) {
      const col = this.team === 0 ? "rgba(34,211,238,0.50)" : "rgba(255,59,107,0.50)";
      for (let i = 0; i < count; i++) {
        const a = rand(0, TAU), sp = rand(20, 120);
        game.particles.push(new Particle(
          this.x + rand(-4, 4), this.y + rand(-4, 4),
          Math.cos(a) * sp, Math.sin(a) * sp,
          rand(0.12, 0.28), rand(2, 4), "aura", col
        ));
      }
    }

    spawnChargeSparks(game) {
      if (Math.random() > 0.35) return;
      const a  = rand(0, TAU);
      const sp = rand(40, 220) * (0.2 + 0.8 * this.charge);
      game.particles.push(new Particle(
        this.x + this.facingX * 10, this.y + this.facingY * 10,
        Math.cos(a) * sp, Math.sin(a) * sp,
        rand(0.10, 0.20), rand(1.5, 3), "spark"
      ));
    }

    draw(ctx) {
      ctx.save();

      // Drop shadow
      ctx.globalAlpha = 0.22;
      ctx.fillStyle   = "rgba(0,0,0,0.65)";
      ctx.beginPath();
      ctx.ellipse(this.x + 3, this.y + 5, this.r * 0.78, this.r * 0.38, 0, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Special aura ring
      if (this.specialActive > 0) {
        ctx.save();
        ctx.globalAlpha = 0.65 * this.specialActive;
        ctx.strokeStyle = this.team === 0 ? "rgba(34,211,238,1)" : "rgba(255,100,100,1)";
        ctx.lineWidth   = 4.5;
        ctx.shadowColor = this.team === 0 ? "#22d3ee" : "#ff6464";
        ctx.shadowBlur  = 18;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r * 2.0, 0, TAU);
        ctx.stroke();
        ctx.restore();
      }

      // Special cooldown arc (shows recharge progress)
      const SPECIAL_MAX = 2.2;
      if (this.specialCooldown > 0) {
        const progress = 1 - this.specialCooldown / SPECIAL_MAX;
        ctx.save();
        ctx.globalAlpha = 0.38;
        ctx.strokeStyle = this.team === 0 ? "rgba(34,211,238,0.7)" : "rgba(255,100,100,0.7)";
        ctx.lineWidth   = 2.5;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r + 5, -Math.PI / 2, -Math.PI / 2 + progress * TAU);
        ctx.stroke();
        ctx.restore();
      }

      // Body gradient
      const isGK = this.role === "gk";
      let c1, c2;
      if (this.team === 0) {
        c1 = isGK ? "rgba(255,210,50,0.96)"  : "rgba(34,211,238,0.96)";
        c2 = isGK ? "rgba(200,130,0,0.92)"   : "rgba(10,150,195,0.92)";
      } else {
        c1 = isGK ? "rgba(255,185,60,0.96)"  : "rgba(255,59,107,0.96)";
        c2 = isGK ? "rgba(195,100,0,0.92)"   : "rgba(175,15,55,0.92)";
      }
      const grd = ctx.createRadialGradient(
        this.x - this.r * 0.32, this.y - this.r * 0.32, 0.8,
        this.x, this.y, this.r
      );
      grd.addColorStop(0, c1);
      grd.addColorStop(1, c2);

      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, TAU);
      ctx.fill();

      // White outline
      ctx.strokeStyle = "rgba(255,255,255,0.38)";
      ctx.lineWidth   = 1.8;
      ctx.stroke();

      // Jersey number
      ctx.fillStyle   = "rgba(255,255,255,0.92)";
      ctx.font        = `bold ${Math.round(this.r * 0.72)}px ui-sans-serif,system-ui`;
      ctx.textAlign   = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(this.num, this.x, this.y + 0.5);

      ctx.restore();
    }
  }

  // ─── EnemyAI ───────────────────────────────────────────────────────────────
  class EnemyAI {
    constructor(player) {
      this.p        = player;
      this.retargetT = 0;
      this.targetX  = player.x;
      this.targetY  = player.y;
      // Légèrement réduit pour le GK équipe joueur (moins agressif)
      this.accelMul = player.team === 1 ? 0.92 : 0.68;
    }

    update(dt, game) {
      const p    = this.p;
      const ball = game.ball;

      this.retargetT -= dt;
      if (this.retargetT <= 0) {
        this.retargetT = rand(0.10, 0.24);
        const d = this.computeDesire(game);
        this.targetX = d.x;
        this.targetY = d.y;
      }

      const to   = vecNorm(this.targetX - p.x, this.targetY - p.y);
      const dist = vecLen(this.targetX - p.x, this.targetY - p.y);

      // Slow down when close to target
      const slowFactor = clamp(dist / 60, 0.25, 1);
      p.vx += to.x * p.accel * dt * this.accelMul * slowFactor;
      p.vy += to.y * p.accel * dt * this.accelMul * slowFactor;

      const maxS = p.maxSpeed * 0.93;
      const s    = vecLen(p.vx, p.vy);
      if (s > maxS) {
        const v = vecNorm(p.vx, p.vy);
        p.vx = v.x * maxS;
        p.vy = v.y * maxS;
      }

      if (p.role === "gk") {
        this.goalkeeperLogic(dt, game);
      } else if (p.team === 1) {
        this.fieldLogicEnemy(dt, game);
      }
      // team 0 mate gets automatic positional support only (no shooting AI)
    }

    fieldLogicEnemy(dt, game) {
      const p    = this.p;
      const ball = game.ball;
      const close = p.isCloseToBall(ball);

      // Occasional special move
      if (close && p.specialCooldown <= 0 && p.stamina >= 0.55 && Math.random() < 0.022) {
        p.doSpecial(game);
      }

      if (close && p.kickCooldown <= 0) {
        if (this.isInGoodAngleToShoot(game)) {
          const aim   = p.aimToEnemyGoal(game);
          const power = rand(0.58, 0.96);
          p.kickBall(game, power, aim.x, aim.y, false);
          p.kickCooldown = 0.22;
        } else if (Math.random() < 0.03) {
          // Tentative de dégagement
          const aim = p.aimToEnemyGoal(game);
          p.kickBall(game, 0.45, aim.x, aim.y, false);
          p.kickCooldown = 0.22;
        }
      }
    }

    computeDesire(game) {
      const p     = this.p;
      const ball  = game.ball;
      const field = game.field;
      const b     = field.bounds;

      // ── Gardien ──────────────────────────────────────────────────────────
      if (p.role === "gk") {
        const goal = p.team === 0 ? field.goalLeft : field.goalRight;
        const gx   = goal.x + (p.team === 0 ? 26 : -26);
        const gy   = clamp(ball.y, goal.y1 + 28, goal.y2 - 28);
        const threat = vecLen(ball.x - gx, ball.y - gy);
        const pull   = clamp(1 - threat / 420, 0, 1);
        return {
          x: lerp(gx, ball.x, 0.26 * pull),
          y: lerp(gy, ball.y, 0.24 * pull),
        };
      }

      // ── Équipe joueur : coéquipier de terrain ────────────────────────────
      if (p.team === 0) {
        const ownGoal = field.goalLeft;
        const baseX   = lerp(ownGoal.x, field.centerX, 0.55);
        return {
          x: lerp(ball.x, baseX, 0.32),
          y: lerp(ball.y, field.centerY, 0.35),
        };
      }

      // ── Ennemis : rôles attaquant / milieu ───────────────────────────────
      const teammates = game.players.filter(q => q.team === 1 && q.role === "field");
      const isFirst   = teammates[0] === p;   // true = attaquant, false = milieu

      // Anticipation trajectoire
      const predT  = 0.42;
      const predX  = clamp(ball.x + ball.vx * predT, b.left, b.right);
      const predY  = clamp(ball.y + ball.vy * predT, b.top,  b.bottom);

      let desX, desY;
      if (isFirst) {
        // Attaquant : colle au ballon, pousse vers but adverse
        desX = lerp(predX, lerp(b.left, b.right, 0.30), 0.20);
        desY = predY;
      } else {
        // Milieu : reste plus en retrait, couvre le centre
        desX = lerp(predX, lerp(b.left, b.right, 0.46), 0.45);
        desY = lerp(predY, field.centerY, 0.35);
      }

      // ── Répulsion par distance entre coéquipiers ─────────────────────────
      // Pousse chaque joueur loin des autres pour éviter le stacking
      for (const q of game.players) {
        if (q === p || q.team !== p.team) continue;
        const sepDx = p.x - q.x;
        const sepDy = p.y - q.y;
        const sepD  = vecLen(sepDx, sepDy) || 0.1;
        const minSep = 90;
        if (sepD < minSep) {
          const force = (minSep - sepD) / minSep * 70;
          desX += (sepDx / sepD) * force;
          desY += (sepDy / sepD) * force;
        }
      }

      return { x: desX, y: desY };
    }

    isInGoodAngleToShoot(game) {
      const p    = this.p;
      const goal = p.team === 0 ? game.field.goalRight : game.field.goalLeft;
      const dir  = vecNorm(goal.x - p.x, ((goal.y1 + goal.y2) / 2) - p.y);
      return (dir.x * p.facingX + dir.y * p.facingY) > 0.28;
    }

    goalkeeperLogic(dt, game) {
      const p   = this.p;
      const ball = game.ball;
      if (!p.isCloseToBall(ball)) return;
      const clearDir = p.team === 0
        ? vecNorm(1,  rand(-0.4, 0.4))
        : vecNorm(-1, rand(-0.4, 0.4));
      if (p.kickCooldown <= 0) {
        p.kickBall(game, 0.72, clearDir.x, clearDir.y, false);
        p.kickCooldown = 0.32;
      }
    }
  }

  // ─── Game ──────────────────────────────────────────────────────────────────
  class Game {
    constructor() {
      this.running = false;
      this.paused  = false;

      this.camera    = new CameraShake();
      this.particles = [];
      this.goalFlash = 0;  // éclair blanc au moment d'un but

      this.field   = this.createField();
      this.ball    = new Ball(this.field.centerX, this.field.centerY);
      this.players = this.createPlayers();

      // IA pour : tous les ennemis + GK team0 + coéquipier terrain team0
      this.ai = this.players
        .filter(p => p.team === 1 || p.role === "gk" || (p.team === 0 && p.role === "field" && p !== this.players[0]))
        .map(p => new EnemyAI(p));

      this.input = this.createInput();
      this.score = [0, 0];

      this.matchSeconds = 120;
      this.timeLeft     = this.matchSeconds;
      this.goalFreeze   = 0;
      this.lastTs       = performance.now();

      this.attachUI();
      this.syncHUD();
    }

    createField() {
      const pad    = 52;
      const left   = pad;
      const right  = canvas.width  - pad;
      const top    = pad;
      const bottom = canvas.height - pad;

      const goalH     = 152;
      const goalY1    = (canvas.height - goalH) / 2;
      const goalY2    = goalY1 + goalH;
      const goalDepth = 18;

      return {
        bounds: { left, right, top, bottom },
        centerX: canvas.width  / 2,
        centerY: canvas.height / 2,
        goalLeft:  { x: left  - goalDepth, y1: goalY1, y2: goalY2, depth: goalDepth },
        goalRight: { x: right + goalDepth, y1: goalY1, y2: goalY2, depth: goalDepth },
      };
    }

    createPlayers() {
      const f = this.field;
      const L = f.bounds.left, R = f.bounds.right, T = f.bounds.top, B = f.bounds.bottom;

      // Équipe joueur (cyan)
      const you = new Player({
        team: 0, role: "field", num: 10,
        x: lerp(L, R, 0.34), y: f.centerY,
        r: 16, maxSpeed: 255, accel: 1600,
        staminaRegen: 0.20, staminaDrainSprint: 0.40,
      });
      const mate = new Player({
        team: 0, role: "field", num: 7,
        x: lerp(L, R, 0.42), y: lerp(T, B, 0.38),
        r: 15, maxSpeed: 240, accel: 1500, staminaRegen: 0.18,
      });
      const gkYou = new Player({
        team: 0, role: "gk", num: 1,
        x: f.goalLeft.x + 32, y: f.centerY,
        r: 17, maxSpeed: 212, accel: 1700, staminaRegen: 0.25,
      });

      // Équipe ennemie (rouge)
      const enemy1 = new Player({
        team: 1, role: "field", num: 9,
        x: lerp(L, R, 0.66), y: lerp(T, B, 0.46),
        r: 16, maxSpeed: 242, accel: 1550, staminaRegen: 0.18,
      });
      const enemy2 = new Player({
        team: 1, role: "field", num: 11,
        x: lerp(L, R, 0.62), y: lerp(T, B, 0.62),
        r: 15, maxSpeed: 235, accel: 1480, staminaRegen: 0.18,
      });
      const gkEnemy = new Player({
        team: 1, role: "gk", num: 1,
        x: f.goalRight.x - 32, y: f.centerY,
        r: 17, maxSpeed: 215, accel: 1650, staminaRegen: 0.22,
      });

      return [you, mate, gkYou, enemy1, enemy2, gkEnemy];
    }

    createInput() {
      const input = {
        up: false, down: false, left: false, right: false,
        sprint: false, kick: false, special: false,
      };
      const mk = k => k.toLowerCase();
      window.addEventListener("keydown", (e) => {
        const k = mk(e.key);
        if (["arrowup","arrowdown","arrowleft","arrowright"," "].includes(e.key)) e.preventDefault();
        if (k === "z" || e.key === "ArrowUp"    || k === "w") input.up    = true;
        if (k === "s" || e.key === "ArrowDown")               input.down  = true;
        if (k === "q" || e.key === "ArrowLeft"  || k === "a") input.left  = true;
        if (k === "d" || e.key === "ArrowRight")               input.right = true;
        if (e.key === "Shift") input.sprint  = true;
        if (k === "e")         input.kick    = true;
        if (e.key === " ")     input.special = true;
      }, { passive: false });
      window.addEventListener("keyup", (e) => {
        const k = mk(e.key);
        if (k === "z" || e.key === "ArrowUp"    || k === "w") input.up    = false;
        if (k === "s" || e.key === "ArrowDown")               input.down  = false;
        if (k === "q" || e.key === "ArrowLeft"  || k === "a") input.left  = false;
        if (k === "d" || e.key === "ArrowRight")               input.right = false;
        if (e.key === "Shift") input.sprint  = false;
        if (k === "e")         input.kick    = false;
        if (e.key === " ")     input.special = false;
      });
      return input;
    }

    attachUI() {
      btnPlay.addEventListener("click",        () => this.start());
      btnOverlayPlay.addEventListener("click", () => this.start());
      btnPause.addEventListener("click",       () => this.togglePause());
      btnReset.addEventListener("click",       () => this.reset());
      btnOverlayHelp.addEventListener("click", () => help.classList.toggle("hidden"));
      window.addEventListener("blur", () => {
        if (this.running) { this.paused = true; this.syncOverlay(); }
      });
    }

    start() {
      this.running = true;
      this.paused  = false;
      overlay.style.display = "none";
      sndWhistle();
      showToast("⚽ Coup d'envoi!");
    }

    togglePause() {
      if (!this.running) return;
      this.paused = !this.paused;
      this.syncOverlay();
    }

    reset() {
      this.score      = [0, 0];
      this.timeLeft   = this.matchSeconds;
      this.goalFreeze = 0;
      this.goalFlash  = 0;
      this.particles.length = 0;
      this.ball.reset(this.field.centerX, this.field.centerY);

      const f = this.field;
      const L = f.bounds.left, R = f.bounds.right, T = f.bounds.top, B = f.bounds.bottom;

      this.players[0].x = lerp(L, R, 0.34); this.players[0].y = f.centerY;
      this.players[0].vx = this.players[0].vy = 0;
      this.players[0].stamina = 1; this.players[0].charge = 0; this.players[0].charging = false;

      this.players[1].x = lerp(L, R, 0.42); this.players[1].y = lerp(T, B, 0.38);
      this.players[1].vx = this.players[1].vy = 0;

      this.players[2].x = f.goalLeft.x + 32; this.players[2].y = f.centerY;
      this.players[2].vx = this.players[2].vy = 0;

      this.players.filter(p => p.team === 1).forEach((e, i) => {
        e.vx = e.vy = 0; e.stamina = 1;
        if (e.role === "gk") { e.x = f.goalRight.x - 32; e.y = f.centerY; }
        else { e.x = lerp(L, R, 0.62 + 0.04 * i); e.y = lerp(T, B, 0.46 + 0.08 * i); }
      });

      this.running = false;
      this.paused  = false;
      overlay.style.display = "";
      help.classList.add("hidden");
      this.syncHUD();
      showToast("Match réinitialisé");
    }

    syncOverlay() {
      if (!this.running) { overlay.style.display = ""; return; }
      overlay.style.display = this.paused ? "" : "none";
    }

    syncHUD() {
      hudScore.textContent = `${this.score[0]} - ${this.score[1]}`;
      hudTime.textContent  = formatTime(this.timeLeft);
      const you = this.players[0];
      hudStamina.style.width = `${Math.round(you.stamina * 100)}%`;
      hudPower.style.width   = `${Math.round(you.charge  * 100)}%`;
    }

    update(dt) {
      if (!this.running || this.paused) return;

      // Fade goal flash
      this.goalFlash = Math.max(0, this.goalFlash - dt * 3.8);

      if (this.goalFreeze > 0) {
        this.goalFreeze -= dt;
        this.camera.update(dt);
        this.updateParticles(dt);
        this.syncHUD();
        if (this.goalFreeze <= 0) this.kickoff();
        return;
      }

      this.timeLeft -= dt;
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.running  = false;
        overlay.style.display = "";
        sndWhistle();
        const winner =
          this.score[0] > this.score[1] ? "🏆 Victoire !" :
          this.score[0] < this.score[1] ? "😓 Défaite..."  : "🤝 Match nul !";
        showToast(`Fin du match ! ${winner}`, 3000);
        this.syncHUD();
        return;
      }

      this.players[0].applyInput(dt, this, this.input);

      for (const ai of this.ai) ai.update(dt, this);
      for (const p  of this.players) p.update(dt, this);

      this.resolveBallPlayerInteractions(dt);
      this.resolvePlayerPlayerCollisions();
      this.ball.update(dt, this.field);

      this.checkGoal();

      this.camera.update(dt);
      this.updateParticles(dt);
      this.syncHUD();
    }

    updateParticles(dt) {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        this.particles[i].update(dt);
        if (this.particles[i].life <= 0) this.particles.splice(i, 1);
      }
    }

    resolveBallPlayerInteractions(dt) {
      const b = this.ball;
      for (const p of this.players) {
        const dx   = b.x - p.x;
        const dy   = b.y - p.y;
        const dist = vecLen(dx, dy);
        const minD = b.r + p.r;
        if (dist < minD) {
          const n    = vecNorm(dx, dy);
          const push = (minD - dist) + 0.01;
          b.x += n.x * push;
          b.y += n.y * push;
          const relVx = b.vx - p.vx;
          const relVy = b.vy - p.vy;
          const along = relVx * n.x + relVy * n.y;
          if (along < 0) {
            b.vx -= along * n.x * 1.18;
            b.vy -= along * n.y * 1.18;
          }
          if (p.specialActive > 0.05) {
            b.vx += n.x * 130 * dt;
            b.vy += n.y * 130 * dt;
          }
          b.lastTouch = p.team;
        }
      }
    }

    resolvePlayerPlayerCollisions() {
      const ps = this.players;
      for (let i = 0; i < ps.length; i++) {
        for (let j = i + 1; j < ps.length; j++) {
          const a = ps[i], b = ps[j];
          const dx   = b.x - a.x;
          const dy   = b.y - a.y;
          const dist = vecLen(dx, dy) || 0.01;
          const minD = a.r + b.r + 2;
          if (dist < minD) {
            const n      = vecNorm(dx, dy);
            const overlap = (minD - dist) * 0.52;
            // Push both apart equally
            a.x -= n.x * overlap;
            a.y -= n.y * overlap;
            b.x += n.x * overlap;
            b.y += n.y * overlap;
            // Dampen velocity component along collision axis
            const relVx = b.vx - a.vx;
            const relVy = b.vy - a.vy;
            const along = relVx * n.x + relVy * n.y;
            if (along < 0) {
              const impulse = along * 0.55;
              a.vx += impulse * n.x;
              a.vy += impulse * n.y;
              b.vx -= impulse * n.x;
              b.vy -= impulse * n.y;
            }
          }
        }
      }
    }

    checkGoal() {
      const b  = this.ball;
      const gl = this.field.goalLeft;
      const gr = this.field.goalRight;
      const inY = (y, g) => y > g.y1 && y < g.y2;
      if (b.x - b.r <= gl.x && inY(b.y, gl)) this.onGoal(1);
      if (b.x + b.r >= gr.x && inY(b.y, gr)) this.onGoal(0);
    }

    onGoal(scoringTeam) {
      this.score[scoringTeam] += 1;
      this.goalFreeze = 2.0;
      this.goalFlash  = 1.0;
      this.camera.kick(18, 0.38);
      sndGoal();

      // Grande explosion de particules
      const col = scoringTeam === 0 ? "rgba(34,211,238,0.9)" : "rgba(255,59,107,0.9)";
      for (let i = 0; i < 65; i++) {
        const a  = rand(0, TAU);
        const sp = rand(80, 1050);
        this.particles.push(new Particle(
          this.ball.x, this.ball.y,
          Math.cos(a) * sp, Math.sin(a) * sp,
          rand(0.3, 1.1), rand(2, 9), "goal", col
        ));
      }
      // Confettis arc-en-ciel (volent vers le haut)
      for (let i = 0; i < 35; i++) {
        const a  = rand(-Math.PI * 0.9, -Math.PI * 0.1);
        const sp = rand(80, 500);
        this.particles.push(new Particle(
          this.ball.x + rand(-30, 30), this.ball.y,
          Math.cos(a) * sp, Math.sin(a) * sp,
          rand(0.6, 1.5), rand(3.5, 8), "goal", null
        ));
      }

      const msg = scoringTeam === 0 ? "⚽ BUT ! (Toi) 🎉" : "⚽ BUT ! (Adversaire)";
      showToast(msg, 1800);
      this.ball.vx = this.ball.vy = 0;
    }

    kickoff() {
      const f = this.field;
      const L = f.bounds.left, R = f.bounds.right, T = f.bounds.top, B = f.bounds.bottom;

      this.ball.reset(f.centerX, f.centerY);

      this.players[0].x = lerp(L, R, 0.34); this.players[0].y = f.centerY;
      this.players[0].vx = this.players[0].vy = 0;

      this.players[1].x = lerp(L, R, 0.42); this.players[1].y = lerp(T, B, 0.38);
      this.players[1].vx = this.players[1].vy = 0;

      this.players[2].x = f.goalLeft.x + 32; this.players[2].y = f.centerY;
      this.players[2].vx = this.players[2].vy = 0;

      this.players.filter(p => p.team === 1).forEach((e, i) => {
        e.vx = e.vy = 0;
        if (e.role === "gk") { e.x = f.goalRight.x - 32; e.y = f.centerY; }
        else { e.x = lerp(L, R, 0.66 - 0.03 * i); e.y = lerp(T, B, 0.50 + 0.10 * i); }
      });

      showToast("Reprise !", 950);
    }

    // ── Dessin du terrain ──────────────────────────────────────────────────
    drawField(ctx) {
      const f = this.field;
      const b = f.bounds;
      const W = b.right - b.left;
      const H = b.bottom - b.top;

      // Fond sombre hors terrain
      ctx.fillStyle = "rgba(0,0,0,0.22)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Pelouse dégradée
      const pitchGrd = ctx.createLinearGradient(b.left, b.top, b.left, b.bottom);
      pitchGrd.addColorStop(0,   "rgba(20,115,55,0.96)");
      pitchGrd.addColorStop(0.5, "rgba(28,145,68,0.92)");
      pitchGrd.addColorStop(1,   "rgba(20,115,55,0.96)");
      ctx.fillStyle = pitchGrd;
      ctx.fillRect(b.left, b.top, W, H);

      // Bandes alternées (effet gazon)
      const stripes = 10;
      const sw = W / stripes;
      for (let i = 0; i < stripes; i++) {
        ctx.fillStyle = i % 2 ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.04)";
        ctx.fillRect(b.left + i * sw, b.top, sw, H);
      }

      // ── Lignes blanches ────────────────────────────────────────────────
      ctx.strokeStyle = "rgba(255,255,255,0.58)";
      ctx.lineWidth   = 2;

      // Bordure
      ctx.strokeRect(b.left, b.top, W, H);

      // Ligne médiane
      ctx.beginPath(); ctx.moveTo(f.centerX, b.top); ctx.lineTo(f.centerX, b.bottom); ctx.stroke();

      // Cercle central
      ctx.beginPath(); ctx.arc(f.centerX, f.centerY, 70, 0, TAU); ctx.stroke();

      // Point central
      ctx.fillStyle = "rgba(255,255,255,0.65)";
      ctx.beginPath(); ctx.arc(f.centerX, f.centerY, 4, 0, TAU); ctx.fill();

      // Arcs de coin
      const cr = 22;
      ctx.beginPath(); ctx.arc(b.left,  b.top,    cr, 0,             Math.PI / 2);         ctx.stroke();
      ctx.beginPath(); ctx.arc(b.right, b.top,    cr, Math.PI / 2,   Math.PI);              ctx.stroke();
      ctx.beginPath(); ctx.arc(b.left,  b.bottom, cr, -Math.PI / 2,  0);                   ctx.stroke();
      ctx.beginPath(); ctx.arc(b.right, b.bottom, cr, Math.PI,       Math.PI * 3 / 2);     ctx.stroke();

      // Surfaces de réparation
      const boxW = 132, boxH = 222;
      const bx0 = b.top + (H - boxH) / 2;
      ctx.strokeRect(b.left,         bx0, boxW,  boxH);
      ctx.strokeRect(b.right - boxW, bx0, boxW,  boxH);

      // Petite surface
      const smallW = 52, smallH = 96;
      const sx0 = b.top + (H - smallH) / 2;
      ctx.strokeRect(b.left,          sx0, smallW, smallH);
      ctx.strokeRect(b.right - smallW, sx0, smallW, smallH);

      // Arcs de réparation (pointillés)
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.arc(b.left  + boxW, f.centerY, 52, -Math.PI * 0.35, Math.PI * 0.35); ctx.stroke();
      ctx.beginPath(); ctx.arc(b.right - boxW, f.centerY, 52, Math.PI * 0.65, Math.PI * 1.35);  ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Points de pénalty
      ctx.fillStyle = "rgba(255,255,255,0.65)";
      ctx.beginPath(); ctx.arc(b.left  + 82, f.centerY, 3.5, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(b.right - 82, f.centerY, 3.5, 0, TAU); ctx.fill();

      // Buts avec filets
      this.drawGoal(ctx, f.goalLeft,  true);
      this.drawGoal(ctx, f.goalRight, false);
    }

    drawGoal(ctx, goal, leftSide) {
      const gx    = goal.x;
      const y1    = goal.y1, y2 = goal.y2;
      const depth = goal.depth;
      const netX  = leftSide ? gx + depth : gx - depth;

      ctx.save();

      // Fond filet
      ctx.globalAlpha = 0.16;
      ctx.fillStyle   = "rgba(255,255,255,0.9)";
      ctx.fillRect(Math.min(gx, netX), y1, depth, y2 - y1);

      // Grille du filet
      ctx.globalAlpha = 0.32;
      ctx.strokeStyle = "rgba(255,255,255,0.65)";
      ctx.lineWidth   = 0.8;
      const netH = y2 - y1;
      const cols = 5, rows = 8;
      for (let i = 0; i <= cols; i++) {
        const x = Math.min(gx, netX) + (i / cols) * depth;
        ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2); ctx.stroke();
      }
      for (let j = 0; j <= rows; j++) {
        const y = y1 + (j / rows) * netH;
        ctx.beginPath(); ctx.moveTo(Math.min(gx, netX), y); ctx.lineTo(Math.max(gx, netX), y); ctx.stroke();
      }

      // Montants (poteaux latéraux + barre)
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.lineWidth   = 3.5;
      ctx.beginPath();
      ctx.moveTo(gx, y1); ctx.lineTo(netX, y1);
      ctx.lineTo(netX, y2); ctx.lineTo(gx, y2);
      ctx.stroke();

      // Poteau frontal (plus épais / lumineux)
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth   = 4.5;
      ctx.shadowColor = "rgba(255,255,255,0.6)";
      ctx.shadowBlur  = 6;
      ctx.beginPath(); ctx.moveTo(gx, y1); ctx.lineTo(gx, y2); ctx.stroke();
      ctx.shadowBlur  = 0;

      ctx.restore();
    }

    // ── Rendu principal ────────────────────────────────────────────────────
    draw() {
      ctx.save();
      ctx.translate(this.camera.x, this.camera.y);

      this.drawField(ctx);

      for (const pt of this.particles) pt.draw(ctx);
      this.ball.draw(ctx);
      for (const p of this.players) p.draw(ctx);
      this.drawAimCone(ctx, this.players[0]);

      ctx.restore();

      // Flash blanc au but (hors camera shake)
      if (this.goalFlash > 0) {
        ctx.save();
        ctx.globalAlpha = this.goalFlash * 0.38;
        ctx.fillStyle   = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }

      // Indicateur spécial "PRÊT" pulsant
      if (this.running && !this.paused) {
        this.drawSpecialIndicator(ctx);
      }
    }

    drawAimCone(ctx, you) {
      const alpha = 0.07 + 0.20 * you.charge;
      if (alpha <= 0.08) return;
      const dir    = vecNorm(you.facingX, you.facingY);
      const len    = 100 + 190 * you.charge;
      const spread = 0.34 - 0.20 * you.charge;
      const a0     = Math.atan2(dir.y, dir.x);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle   = "rgba(34,211,238,1)";
      ctx.beginPath();
      ctx.moveTo(you.x, you.y);
      ctx.lineTo(you.x + Math.cos(a0 - spread) * len, you.y + Math.sin(a0 - spread) * len);
      ctx.lineTo(you.x + Math.cos(a0 + spread) * len, you.y + Math.sin(a0 + spread) * len);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    drawSpecialIndicator(ctx) {
      const you = this.players[0];
      if (you.specialCooldown > 0) return;
      // Pulsation douce
      const pulse = 0.55 + 0.45 * Math.sin(performance.now() * 0.006);
      ctx.save();
      ctx.globalAlpha   = pulse * 0.75;
      ctx.fillStyle     = "#a78bfa";
      ctx.font          = `bold 11px ui-sans-serif,system-ui`;
      ctx.textAlign     = "center";
      ctx.textBaseline  = "middle";
      ctx.fillText("⚡ PRÊT", you.x, you.y - you.r - 10);
      ctx.restore();
    }

    frame(ts) {
      const dt = clamp((ts - this.lastTs) / 1000, 0, 0.033);
      this.lastTs = ts;
      this.update(dt);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      this.draw();
      requestAnimationFrame(t => this.frame(t));
    }
  }

  const game = new Game();
  requestAnimationFrame(t => game.frame(t));

})();