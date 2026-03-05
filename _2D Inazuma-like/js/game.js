// /game.js
(() => {
  "use strict";

  /**
   * Inazuma Mini Soccer - Vanilla JS
   * - No import/export
   * - Canvas 2D
   * - Arcade physics
   */

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  const hudScore = document.getElementById("hudScore");
  const hudTime = document.getElementById("hudTime");
  const hudStamina = document.getElementById("hudStamina");
  const hudPower = document.getElementById("hudPower");

  const btnPlay = document.getElementById("btnPlay");
  const btnPause = document.getElementById("btnPause");
  const btnReset = document.getElementById("btnReset");
  const overlay = document.getElementById("overlay");
  const btnOverlayPlay = document.getElementById("btnOverlayPlay");
  const btnOverlayHelp = document.getElementById("btnOverlayHelp");
  const help = document.getElementById("help");
  const toast = document.getElementById("toast");

  const TAU = Math.PI * 2;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a, b) => a + Math.random() * (b - a);

  function vecLen(x, y) { return Math.hypot(x, y); }
  function vecNorm(x, y) {
    const l = Math.hypot(x, y) || 1;
    return { x: x / l, y: y / l, l };
  }

  function formatTime(sec) {
    const s = Math.max(0, Math.floor(sec));
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  }

  function showToast(text, ms = 1200) {
    toast.textContent = text;
    toast.classList.remove("hidden");
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => toast.classList.add("hidden"), ms);
  }

  class CameraShake {
    constructor() {
      this.t = 0;
      this.strength = 0;
      this.x = 0;
      this.y = 0;
    }
    kick(strength, time) {
      this.strength = Math.max(this.strength, strength);
      this.t = Math.max(this.t, time);
    }
    update(dt) {
      if (this.t <= 0) {
        this.x = 0; this.y = 0; this.strength = 0;
        return;
      }
      this.t -= dt;
      const s = this.strength * (this.t / Math.max(0.0001, this.t + dt));
      this.x = rand(-s, s);
      this.y = rand(-s, s);
      this.strength *= 0.92;
    }
  }

  class Particle {
    constructor(x, y, vx, vy, life, size, kind) {
      this.x = x; this.y = y;
      this.vx = vx; this.vy = vy;
      this.life = life;
      this.maxLife = life;
      this.size = size;
      this.kind = kind;
    }
    update(dt) {
      this.life -= dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.vx *= 0.98;
      this.vy *= 0.98;
    }
    draw(ctx) {
      const t = clamp(this.life / this.maxLife, 0, 1);
      ctx.save();
      ctx.globalAlpha = t;
      if (this.kind === "spark") {
        ctx.fillStyle = "rgba(255,255,255,0.9)";
      } else if (this.kind === "aura") {
        ctx.fillStyle = "rgba(124,92,255,0.65)";
      } else {
        ctx.fillStyle = "rgba(34,211,238,0.7)";
      }
      ctx.beginPath();
      ctx.arc(this.x, this.y, Math.max(0.5, this.size * (0.6 + 0.8 * (1 - t))), 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  class Ball {
    constructor(x, y) {
      this.x = x; this.y = y;
      this.vx = 0; this.vy = 0;
      this.r = 8.5;
      this.spin = 0;
      this.lastTouch = null;
      this.trail = [];
    }
    reset(x, y) {
      this.x = x; this.y = y;
      this.vx = 0; this.vy = 0;
      this.spin = 0;
      this.lastTouch = null;
      this.trail.length = 0;
    }
    update(dt, field) {
      this.vx *= 0.992;
      this.vy *= 0.992;

      if (Math.abs(this.spin) > 0.001) {
        const sx = -this.vy * this.spin;
        const sy = this.vx * this.spin;
        this.vx += sx * dt;
        this.vy += sy * dt;
        this.spin *= 0.985;
      }

      this.x += this.vx * dt;
      this.y += this.vy * dt;

      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > 14) this.trail.shift();

      const { left, right, top, bottom } = field.bounds;
      if (this.x - this.r < left) { this.x = left + this.r; this.vx *= -0.75; }
      if (this.x + this.r > right) { this.x = right - this.r; this.vx *= -0.75; }
      if (this.y - this.r < top) { this.y = top + this.r; this.vy *= -0.75; }
      if (this.y + this.r > bottom) { this.y = bottom - this.r; this.vy *= -0.75; }
    }
    draw(ctx) {
      for (let i = 0; i < this.trail.length; i++) {
        const t = i / this.trail.length;
        ctx.save();
        ctx.globalAlpha = 0.12 * t;
        ctx.fillStyle = "rgba(124,92,255,1)";
        ctx.beginPath();
        ctx.arc(this.trail[i].x, this.trail[i].y, 6.5 * t, 0, TAU);
        ctx.fill();
        ctx.restore();
      }

      ctx.save();
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, TAU);
      ctx.fill();

      ctx.strokeStyle = "rgba(0,0,0,0.22)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r * 0.55, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }

  class Player {
    constructor(opts) {
      this.team = opts.team; // 0: you, 1: enemy
      this.role = opts.role; // "field" | "gk"
      this.x = opts.x;
      this.y = opts.y;
      this.vx = 0;
      this.vy = 0;
      this.r = opts.r ?? 16;

      this.maxSpeed = opts.maxSpeed ?? 240;
      this.accel = opts.accel ?? 1500;

      this.stamina = 1;
      this.staminaRegen = opts.staminaRegen ?? 0.16;
      this.staminaDrainSprint = opts.staminaDrainSprint ?? 0.35;

      this.hasBall = false;
      this.facingX = 1;
      this.facingY = 0;

      this.kickCooldown = 0;
      this.specialCooldown = 0;

      this.charge = 0;
      this.charging = false;

      this.specialActive = 0;
    }

    update(dt, game) {
      this.kickCooldown = Math.max(0, this.kickCooldown - dt);
      this.specialCooldown = Math.max(0, this.specialCooldown - dt);
      this.specialActive = Math.max(0, this.specialActive - dt);

      this.stamina = clamp(this.stamina + this.staminaRegen * dt, 0, 1);

      this.vx *= 0.90;
      this.vy *= 0.90;

      this.x += this.vx * dt;
      this.y += this.vy * dt;

      const b = game.field.bounds;
      this.x = clamp(this.x, b.left + this.r, b.right - this.r);
      this.y = clamp(this.y, b.top + this.r, b.bottom - this.r);

      const speed = vecLen(this.vx, this.vy);
      if (speed > 10) {
        const n = vecNorm(this.vx, this.vy);
        this.facingX = n.x;
        this.facingY = n.y;
      }
    }

    applyInput(dt, game, input) {
      const moveX = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      const moveY = (input.down ? 1 : 0) - (input.up ? 1 : 0);

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

      if (input.special && this.specialCooldown <= 0 && this.stamina >= 0.45) {
        this.doSpecial(game);
      }

      if (input.kick) {
        this.charging = true;
        this.charge = clamp(this.charge + dt * 0.9, 0, 1);
        this.spawnChargeSparks(game);
      } else {
        if (this.charging) {
          this.charging = false;
          this.releaseKick(game);
        }
        this.charge = Math.max(0, this.charge - dt * 0.8);
      }
    }

    doSpecial(game) {
      this.specialCooldown = 2.2;
      this.specialActive = 0.55;
      this.stamina = clamp(this.stamina - 0.45, 0, 1);

      const dash = 720;
      this.vx += this.facingX * dash;
      this.vy += this.facingY * dash;

      game.camera.kick(10, 0.18);
      showToast("⚡ SPECIAL MOVE!");

      for (let i = 0; i < 18; i++) {
        const a = rand(0, TAU);
        const sp = rand(120, 520);
        game.particles.push(new Particle(
          this.x, this.y,
          Math.cos(a) * sp, Math.sin(a) * sp,
          rand(0.25, 0.55),
          rand(2, 5),
          "aura"
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
      const hasContact = this.isCloseToBall(ball);
      if (!hasContact) return;

      const power = clamp(this.charge, 0.1, 1);

      const aim = this.aimToEnemyGoal(game);
      const passBias = 0.55;
      const isPass = power < passBias;

      if (isPass) {
        const dir = this.aimToTeammate(game) ?? aim;
        this.kickBall(game, 0.42 + 0.25 * power, dir.x, dir.y, false);
        showToast("Passe!");
      } else {
        const wobble = (1 - power) * 0.25;
        const dir = vecNorm(aim.x + rand(-wobble, wobble), aim.y + rand(-wobble, wobble));
        this.kickBall(game, power, dir.x, dir.y, false);
        showToast(power > 0.85 ? "Tir chargé!" : "Tir!");
      }

      this.kickCooldown = 0.18;
      this.charge = 0;
    }

    kickBall(game, power01, dx, dy, isSpecial) {
      const ball = game.ball;
      const base = isSpecial ? 980 : 760;
      const p = base * (0.35 + 0.65 * power01);

      ball.vx = dx * p + this.vx * 0.20;
      ball.vy = dy * p + this.vy * 0.20;

      ball.spin += isSpecial ? rand(-3.2, 3.2) : rand(-1.2, 1.2);
      ball.lastTouch = this.team;

      game.camera.kick(isSpecial ? 12 : 6, isSpecial ? 0.16 : 0.10);

      for (let i = 0; i < (isSpecial ? 24 : 12); i++) {
        const a = rand(0, TAU);
        const sp = rand(isSpecial ? 160 : 80, isSpecial ? 720 : 260);
        game.particles.push(new Particle(
          ball.x, ball.y,
          Math.cos(a) * sp, Math.sin(a) * sp,
          rand(0.15, isSpecial ? 0.55 : 0.35),
          rand(1.5, isSpecial ? 5.5 : 3.2),
          isSpecial ? "aura" : "spark"
        ));
      }
    }

    isCloseToBall(ball) {
      const d = vecLen(this.x - ball.x, this.y - ball.y);
      return d < this.r + ball.r + 7;
    }

    aimToEnemyGoal(game) {
      const goal = this.team === 0 ? game.field.goalRight : game.field.goalLeft;
      const targetY = lerp(goal.y1, goal.y2, 0.5) + rand(-18, 18);
      return vecNorm(goal.x - this.x, targetY - this.y);
    }

    aimToTeammate(game) {
      const mate = game.players.find(p => p.team === this.team && p !== this && p.role === "field");
      if (!mate) return null;
      return vecNorm(mate.x - this.x, mate.y - this.y);
    }

    spawnAura(game, count) {
      for (let i = 0; i < count; i++) {
        const a = rand(0, TAU);
        const sp = rand(20, 120);
        game.particles.push(new Particle(
          this.x + rand(-4, 4),
          this.y + rand(-4, 4),
          Math.cos(a) * sp, Math.sin(a) * sp,
          rand(0.18, 0.35),
          rand(2.5, 4.5),
          "aura"
        ));
      }
    }

    spawnChargeSparks(game) {
      if (Math.random() > 0.35) return;
      const a = rand(0, TAU);
      const sp = rand(40, 220) * (0.2 + 0.8 * this.charge);
      game.particles.push(new Particle(
        this.x + this.facingX * 10,
        this.y + this.facingY * 10,
        Math.cos(a) * sp, Math.sin(a) * sp,
        rand(0.12, 0.22),
        rand(1.5, 3.5),
        "spark"
      ));
    }

    draw(ctx) {
      ctx.save();

      if (this.specialActive > 0) {
        ctx.globalAlpha = 0.65;
        ctx.fillStyle = "rgba(124,92,255,1)";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r * 1.85, 0, TAU);
        ctx.fill();
      }

      const body = this.team === 0 ? "rgba(34,211,238,0.95)" : "rgba(255,59,107,0.92)";
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, TAU);
      ctx.fill();

      ctx.fillStyle = "rgba(0,0,0,0.28)";
      ctx.beginPath();
      ctx.arc(this.x + this.facingX * 6, this.y + this.facingY * 6, this.r * 0.35, 0, TAU);
      ctx.fill();

      ctx.restore();
    }
  }

  class EnemyAI {
    constructor(player) {
      this.p = player;
      this.retargetT = 0;
      this.targetX = player.x;
      this.targetY = player.y;
    }

    update(dt, game) {
      const p = this.p;
      const ball = game.ball;

      this.retargetT -= dt;
      if (this.retargetT <= 0) {
        this.retargetT = rand(0.12, 0.30);
        const desire = this.computeDesire(game);
        this.targetX = desire.x;
        this.targetY = desire.y;
      }

      const to = vecNorm(this.targetX - p.x, this.targetY - p.y);
      p.vx += to.x * p.accel * dt * 0.92;
      p.vy += to.y * p.accel * dt * 0.92;

      const maxS = p.maxSpeed * 0.93;
      const s = vecLen(p.vx, p.vy);
      if (s > maxS) {
        const v = vecNorm(p.vx, p.vy);
        p.vx = v.x * maxS;
        p.vy = v.y * maxS;
      }

      if (p.role === "field") {
        const close = p.isCloseToBall(ball);
        const shouldShoot = close && this.isInGoodAngleToShoot(game);
        const shouldSpecial = close && p.specialCooldown <= 0 && p.stamina >= 0.55 && Math.random() < 0.03;

        if (shouldSpecial) p.doSpecial(game);

        if (shouldShoot && p.kickCooldown <= 0) {
          const aim = p.aimToEnemyGoal(game);
          p.kickBall(game, rand(0.55, 0.95), aim.x, aim.y, false);
          p.kickCooldown = 0.22;
        } else if (close && p.kickCooldown <= 0 && Math.random() < 0.02) {
          const aim = p.aimToEnemyGoal(game);
          p.kickBall(game, 0.45, aim.x, aim.y, false);
          p.kickCooldown = 0.22;
        }
      } else {
        this.goalkeeperLogic(dt, game);
      }
    }

    computeDesire(game) {
      const p = this.p;
      const ball = game.ball;
      const field = game.field;

      if (p.role === "gk") {
        const goal = p.team === 0 ? field.goalLeft : field.goalRight;
        const gx = goal.x + (p.team === 0 ? 22 : -22);
        const gy = clamp(ball.y, goal.y1 + 30, goal.y2 - 30);

        const ballThreat = vecLen(ball.x - gx, ball.y - gy);
        const pull = clamp(1 - ballThreat / 500, 0, 1);

        return {
          x: lerp(gx, ball.x, 0.22 * pull),
          y: lerp(gy, ball.y, 0.20 * pull),
        };
      }

      const towardBall = { x: ball.x, y: ball.y };
      const defendBias = p.team === 1 ? 0.62 : 0.58;
      const ownGoal = p.team === 0 ? field.goalLeft : field.goalRight;
      const homeX = lerp(ownGoal.x, field.centerX, 0.62);
      const homeY = lerp(field.centerY, ball.y, 0.35);

      return {
        x: lerp(towardBall.x, homeX, defendBias),
        y: lerp(towardBall.y, homeY, defendBias),
      };
    }

    isInGoodAngleToShoot(game) {
      const p = this.p;
      const goal = p.team === 0 ? game.field.goalRight : game.field.goalLeft;
      const dir = vecNorm(goal.x - p.x, ((goal.y1 + goal.y2) / 2) - p.y);
      const facingDot = dir.x * p.facingX + dir.y * p.facingY;
      return facingDot > 0.25;
    }

    goalkeeperLogic(dt, game) {
      const p = this.p;
      const ball = game.ball;

      if (!p.isCloseToBall(ball)) return;

      const clearDir = p.team === 0 ? vecNorm(1, rand(-0.3, 0.3)) : vecNorm(-1, rand(-0.3, 0.3));
      if (p.kickCooldown <= 0) {
        p.kickBall(game, 0.65, clearDir.x, clearDir.y, false);
        p.kickCooldown = 0.35;
      }
    }
  }

  class Game {
    constructor() {
      this.running = false;
      this.paused = false;

      this.camera = new CameraShake();
      this.particles = [];

      this.field = this.createField();
      this.ball = new Ball(this.field.centerX, this.field.centerY);

      this.players = this.createPlayers();
      this.ai = this.players
        .filter(p => p.team === 1 || p.role === "gk")
        .map(p => new EnemyAI(p));

      this.input = this.createInput();
      this.score = [0, 0];

      this.matchSeconds = 120;
      this.timeLeft = this.matchSeconds;

      this.goalFreeze = 0;
      this.lastTs = performance.now();

      this.attachUI();
      this.syncHUD();
    }

    createField() {
      const pad = 52;
      const left = pad;
      const right = canvas.width - pad;
      const top = pad;
      const bottom = canvas.height - pad;

      const goalH = 150;
      const goalY1 = (canvas.height - goalH) / 2;
      const goalY2 = goalY1 + goalH;
      const goalDepth = 14;

      return {
        bounds: { left, right, top, bottom },
        centerX: canvas.width / 2,
        centerY: canvas.height / 2,

        goalLeft: { x: left - goalDepth, y1: goalY1, y2: goalY2, depth: goalDepth },
        goalRight: { x: right + goalDepth, y1: goalY1, y2: goalY2, depth: goalDepth },

        pitch: { left, right, top, bottom },
      };
    }

    createPlayers() {
      const f = this.field;
      const you = new Player({
        team: 0, role: "field",
        x: lerp(f.bounds.left, f.bounds.right, 0.34),
        y: f.centerY,
        r: 16,
        maxSpeed: 250,
        accel: 1600,
        staminaRegen: 0.20,
        staminaDrainSprint: 0.42,
      });

      const mate = new Player({
        team: 0, role: "field",
        x: lerp(f.bounds.left, f.bounds.right, 0.42),
        y: lerp(f.bounds.top, f.bounds.bottom, 0.38),
        r: 15,
        maxSpeed: 238,
        accel: 1500,
        staminaRegen: 0.17,
      });

      const enemy1 = new Player({
        team: 1, role: "field",
        x: lerp(f.bounds.left, f.bounds.right, 0.66),
        y: lerp(f.bounds.top, f.bounds.bottom, 0.46),
        r: 16,
        maxSpeed: 242,
        accel: 1550,
        staminaRegen: 0.18,
      });

      const enemy2 = new Player({
        team: 1, role: "field",
        x: lerp(f.bounds.left, f.bounds.right, 0.62),
        y: lerp(f.bounds.top, f.bounds.bottom, 0.62),
        r: 15,
        maxSpeed: 235,
        accel: 1480,
        staminaRegen: 0.18,
      });

      const gkEnemy = new Player({
        team: 1, role: "gk",
        x: f.goalRight.x - 30,
        y: f.centerY,
        r: 17,
        maxSpeed: 215,
        accel: 1650,
        staminaRegen: 0.22,
      });

      return [you, mate, enemy1, enemy2, gkEnemy];
    }

    createInput() {
      const input = {
        up: false, down: false, left: false, right: false,
        sprint: false, kick: false, special: false,
      };

      const mapKey = (k) => k.toLowerCase();
      const keydown = (e) => {
        const k = mapKey(e.key);
        if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(e.key)) e.preventDefault();

        if (k === "z" || e.key === "ArrowUp" || k === "w") input.up = true;
        if (k === "s" || e.key === "ArrowDown") input.down = true;
        if (k === "q" || e.key === "ArrowLeft" || k === "a") input.left = true;
        if (k === "d" || e.key === "ArrowRight") input.right = true;

        if (e.key === "Shift") input.sprint = true;
        if (k === "e") input.kick = true;
        if (e.key === " ") input.special = true;
      };

      const keyup = (e) => {
        const k = mapKey(e.key);
        if (k === "z" || e.key === "ArrowUp" || k === "w") input.up = false;
        if (k === "s" || e.key === "ArrowDown") input.down = false;
        if (k === "q" || e.key === "ArrowLeft" || k === "a") input.left = false;
        if (k === "d" || e.key === "ArrowRight") input.right = false;

        if (e.key === "Shift") input.sprint = false;
        if (k === "e") input.kick = false;
        if (e.key === " ") input.special = false;
      };

      window.addEventListener("keydown", keydown, { passive: false });
      window.addEventListener("keyup", keyup, { passive: false });

      return input;
    }

    attachUI() {
      btnPlay.addEventListener("click", () => this.start());
      btnOverlayPlay.addEventListener("click", () => this.start());

      btnPause.addEventListener("click", () => this.togglePause());
      btnReset.addEventListener("click", () => this.reset());

      btnOverlayHelp.addEventListener("click", () => help.classList.toggle("hidden"));

      window.addEventListener("blur", () => {
        if (this.running) this.paused = true;
        this.syncOverlay();
      });
    }

    start() {
      this.running = true;
      this.paused = false;
      overlay.style.display = "none";
      showToast("Coup d'envoi!");
    }

    togglePause() {
      if (!this.running) return;
      this.paused = !this.paused;
      this.syncOverlay();
    }

    reset() {
      this.score = [0, 0];
      this.timeLeft = this.matchSeconds;
      this.goalFreeze = 0;
      this.particles.length = 0;
      this.ball.reset(this.field.centerX, this.field.centerY);

      const p = this.players[0];
      p.x = lerp(this.field.bounds.left, this.field.bounds.right, 0.34);
      p.y = this.field.centerY;
      p.vx = p.vy = 0;
      p.stamina = 1;
      p.charge = 0;
      p.charging = false;

      const mate = this.players[1];
      mate.x = lerp(this.field.bounds.left, this.field.bounds.right, 0.42);
      mate.y = lerp(this.field.bounds.top, this.field.bounds.bottom, 0.38);
      mate.vx = mate.vy = 0;

      this.players.filter(x => x.team === 1).forEach((e, i) => {
        e.vx = e.vy = 0;
        e.stamina = 1;
        e.x = lerp(this.field.bounds.left, this.field.bounds.right, 0.62 + 0.04 * i);
        e.y = lerp(this.field.bounds.top, this.field.bounds.bottom, 0.46 + 0.08 * i);
      });

      this.running = false;
      this.paused = false;
      overlay.style.display = "";
      help.classList.add("hidden");
      this.syncHUD();
      showToast("Reset match");
    }

    syncOverlay() {
      if (!this.running) {
        overlay.style.display = "";
        return;
      }
      overlay.style.display = this.paused ? "" : "none";
    }

    syncHUD() {
      hudScore.textContent = `${this.score[0]} - ${this.score[1]}`;
      hudTime.textContent = formatTime(this.timeLeft);

      const you = this.players[0];
      hudStamina.style.width = `${Math.round(you.stamina * 100)}%`;
      hudPower.style.width = `${Math.round(you.charge * 100)}%`;
    }

    update(dt) {
      if (!this.running || this.paused) return;

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
        this.running = false;
        overlay.style.display = "";
        showToast("Fin du match!");
        this.syncHUD();
        return;
      }

      const you = this.players[0];
      you.applyInput(dt, this, this.input);

      for (const ai of this.ai) ai.update(dt, this);

      for (const p of this.players) p.update(dt, this);

      this.resolveBallPlayerInteractions(dt);
      this.ball.update(dt, this.field);

      this.checkGoal();

      this.camera.update(dt);
      this.updateParticles(dt);

      this.syncHUD();
    }

    updateParticles(dt) {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const pt = this.particles[i];
        pt.update(dt);
        if (pt.life <= 0) this.particles.splice(i, 1);
      }
    }

    resolveBallPlayerInteractions(dt) {
      const b = this.ball;

      for (const p of this.players) {
        const dx = b.x - p.x;
        const dy = b.y - p.y;
        const dist = vecLen(dx, dy);
        const minD = b.r + p.r;

        if (dist < minD) {
          const n = vecNorm(dx, dy);
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
            b.vx += n.x * 120 * dt;
            b.vy += n.y * 120 * dt;
          }

          b.lastTouch = p.team;
        }
      }
    }

    checkGoal() {
      const b = this.ball;
      const gl = this.field.goalLeft;
      const gr = this.field.goalRight;

      const inGoalY = (y, goal) => y > goal.y1 && y < goal.y2;

      if (b.x - b.r <= gl.x && inGoalY(b.y, gl)) {
        this.onGoal(1);
      }

      if (b.x + b.r >= gr.x && inGoalY(b.y, gr)) {
        this.onGoal(0);
      }
    }

    onGoal(scoringTeam) {
      this.score[scoringTeam] += 1;
      this.goalFreeze = 1.2;
      this.camera.kick(16, 0.22);

      for (let i = 0; i < 40; i++) {
        const a = rand(0, TAU);
        const sp = rand(80, 900);
        this.particles.push(new Particle(
          this.ball.x, this.ball.y,
          Math.cos(a) * sp, Math.sin(a) * sp,
          rand(0.25, 0.9),
          rand(2, 6),
          scoringTeam === 0 ? "aura" : "spark"
        ));
      }

      showToast(scoringTeam === 0 ? "⚽ BUT ! (Toi)" : "⚽ BUT ! (Adversaire)", 1400);
      this.ball.vx = this.ball.vy = 0;
    }

    kickoff() {
      this.ball.reset(this.field.centerX, this.field.centerY);

      const you = this.players[0];
      you.x = lerp(this.field.bounds.left, this.field.bounds.right, 0.34);
      you.y = this.field.centerY;
      you.vx = you.vy = 0;

      const mate = this.players[1];
      mate.x = lerp(this.field.bounds.left, this.field.bounds.right, 0.42);
      mate.y = lerp(this.field.bounds.top, this.field.bounds.bottom, 0.38);
      mate.vx = mate.vy = 0;

      this.players.filter(p => p.team === 1).forEach((e, i) => {
        e.vx = e.vy = 0;
        if (e.role === "gk") {
          e.x = this.field.goalRight.x - 30;
          e.y = this.field.centerY;
        } else {
          e.x = lerp(this.field.bounds.left, this.field.bounds.right, 0.66 - 0.03 * i);
          e.y = lerp(this.field.bounds.top, this.field.bounds.bottom, 0.50 + 0.10 * i);
        }
      });

      showToast("Reprise!", 900);
    }

    drawField(ctx) {
      const f = this.field;
      const b = f.bounds;

      ctx.save();

      // Background pitch
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "rgba(34,197,94,0.12)";
      ctx.fillRect(b.left, b.top, b.right - b.left, b.bottom - b.top);

      // Stripes
      const stripes = 10;
      const w = (b.right - b.left) / stripes;
      for (let i = 0; i < stripes; i++) {
        ctx.fillStyle = i % 2 ? "rgba(34,197,94,0.08)" : "rgba(34,197,94,0.13)";
        ctx.fillRect(b.left + i * w, b.top, w, b.bottom - b.top);
      }

      // Lines
      ctx.strokeStyle = "rgba(255,255,255,0.22)";
      ctx.lineWidth = 2;
      ctx.strokeRect(b.left, b.top, b.right - b.left, b.bottom - b.top);

      // Midline + circle
      ctx.beginPath();
      ctx.moveTo(f.centerX, b.top);
      ctx.lineTo(f.centerX, b.bottom);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(f.centerX, f.centerY, 70, 0, TAU);
      ctx.stroke();

      // Penalty boxes (stylized)
      const boxW = 130;
      const boxH = 220;
      ctx.strokeRect(b.left, f.centerY - boxH / 2, boxW, boxH);
      ctx.strokeRect(b.right - boxW, f.centerY - boxH / 2, boxW, boxH);

      // Goals (visual)
      this.drawGoal(ctx, f.goalLeft, true);
      this.drawGoal(ctx, f.goalRight, false);

      ctx.restore();
    }

    drawGoal(ctx, goal, leftSide) {
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.30)";
      ctx.lineWidth = 3;

      const gx = goal.x;
      const x = leftSide ? gx : gx;
      const y1 = goal.y1, y2 = goal.y2;

      ctx.beginPath();
      ctx.moveTo(x, y1);
      ctx.lineTo(x, y2);
      ctx.stroke();

      ctx.globalAlpha = 0.14;
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      const depth = goal.depth;
      const netX = leftSide ? x + depth : x - depth;
      ctx.fillRect(Math.min(x, netX), y1, Math.abs(netX - x), y2 - y1);

      ctx.restore();
    }

    draw(dt) {
      ctx.save();
      ctx.translate(this.camera.x, this.camera.y);

      this.drawField(ctx);

      for (const pt of this.particles) pt.draw(ctx);

      this.ball.draw(ctx);

      for (const p of this.players) p.draw(ctx);

      this.drawAimCone(ctx, this.players[0]);

      ctx.restore();

      if (this.running && !this.paused) {
        this.drawMiniTips(ctx);
      }
    }

    drawAimCone(ctx, you) {
      const alpha = 0.08 + 0.18 * you.charge;
      if (alpha <= 0.09) return;

      const dir = vecNorm(you.facingX, you.facingY);
      const len = 120 + 160 * you.charge;
      const spread = 0.32 - 0.18 * you.charge;

      const a0 = Math.atan2(dir.y, dir.x);
      const a1 = a0 - spread;
      const a2 = a0 + spread;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "rgba(124,92,255,1)";
      ctx.beginPath();
      ctx.moveTo(you.x, you.y);
      ctx.lineTo(you.x + Math.cos(a1) * len, you.y + Math.sin(a1) * len);
      ctx.lineTo(you.x + Math.cos(a2) * len, you.y + Math.sin(a2) * len);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    drawMiniTips(ctx) {
      // Intentionally minimal; the HUD already contains guidance.
    }

    frame(ts) {
      const dt = clamp((ts - this.lastTs) / 1000, 0, 0.033);
      this.lastTs = ts;

      this.update(dt);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      this.draw(dt);

      requestAnimationFrame((t) => this.frame(t));
    }
  }

  const game = new Game();
  requestAnimationFrame((t) => game.frame(t));

})();