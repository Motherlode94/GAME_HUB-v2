// game.js — Top-Down Zombie Shooter
// Dépend de ui.js chargé avant
(() => {
  const canvas = document.getElementById("game");
  const ctx    = canvas.getContext("2d");

  const W = canvas.width;
  const H = canvas.height;

  // --- Utils ---
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const len   = (x, y)    => Math.hypot(x, y);
  const norm  = (x, y)    => { const l = len(x, y) || 1; return { x: x / l, y: y / l }; };

  // --- Weapons ---
  const WEAPONS = [
    {
      name: "Pistolet", icon: "🔫", key: "1",
      fireRateMs: 350, damage: 1, bulletSpeed: 640, bulletLife: 0.9,
      spread: 0, bulletsPerShot: 1, bulletR: 4,
      color: "#f2f5ff", ammoColor: "#78aaff",
    },
    {
      name: "Shotgun", icon: "💥", key: "2",
      fireRateMs: 700, damage: 1, bulletSpeed: 520, bulletLife: 0.5,
      spread: 0.28, bulletsPerShot: 7, bulletR: 3,
      color: "#ffcc55", ammoColor: "#ff8800",
    },
    {
      name: "Mitrailleuse", icon: "⚡", key: "3",
      fireRateMs: 80, damage: 1, bulletSpeed: 720, bulletLife: 0.7,
      spread: 0.08, bulletsPerShot: 1, bulletR: 3,
      color: "#5cffee", ammoColor: "#00ccaa",
    },
    {
      name: "Sniper", icon: "🎯", key: "4",
      fireRateMs: 900, damage: 5, bulletSpeed: 1200, bulletLife: 1.2,
      spread: 0, bulletsPerShot: 1, bulletR: 5,
      color: "#ff4d4d", ammoColor: "#ff0000",
    },
  ];
  let currentWeaponIdx = 0;

  // --- Input ---
  const keys = new Set();
  let mouseDown = false;
  let mouse  = { x: W / 2, y: H / 2 };

  window.addEventListener("keydown", (e) => {
    keys.add(e.key.toLowerCase());
    if (e.key.toLowerCase() === "r" && gameOver) restart();
    const wIdx = parseInt(e.key) - 1;
    if (wIdx >= 0 && wIdx < WEAPONS.length) currentWeaponIdx = wIdx;
  });
  window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));

  // mousemove sur window pour capter même hors canvas (important dans un iframe)
  window.addEventListener("mousemove", (e) => {
    const r  = canvas.getBoundingClientRect();
    mouse.x  = ((e.clientX - r.left)  / r.width)  * W;
    mouse.y  = ((e.clientY - r.top)   / r.height) * H;
  });

  // mousedown sur window, mais on ignore les clics sur boutons/liens UI
  window.addEventListener("mousedown", (e) => {
    if (e.target.tagName === "BUTTON" || e.target.tagName === "A") return;
    if (!gameOver && started) mouseDown = true;
  });
  window.addEventListener("mouseup", () => mouseDown = false);

  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    currentWeaponIdx = (currentWeaponIdx + (e.deltaY > 0 ? 1 : -1) + WEAPONS.length) % WEAPONS.length;
  }, { passive: false });

  // --- State ---
  let player, bullets, zombies, particles;
  let score, wave, spawnBudget, spawnTimer;
  let gameOver = false;
  let started  = false;
  let lastShot = 0;

  function init() {
    player = { x: W * 0.5, y: H * 0.5, r: 14, hp: 100, speed: 220, iFrames: 0 };
    bullets    = [];
    zombies    = [];
    particles  = [];
    score      = 0;
    wave       = 1;
    spawnBudget= 6;
    spawnTimer = 0;
    gameOver   = false;
    mouseDown  = false;
    lastShot   = 0;
    currentWeaponIdx = 0;
    UI.updateHUD({ hp: player.hp, score, wave });
  }

  function restart() {
    UI.hideGameOver();
    init();
  }

  // --- Spawn ---
  function spawnZombie() {
    const side = Math.floor(Math.random() * 4);
    let x, y;
    if (side === 0) { x = -20;    y = Math.random() * H; }
    if (side === 1) { x = W + 20; y = Math.random() * H; }
    if (side === 2) { x = Math.random() * W; y = -20;    }
    if (side === 3) { x = Math.random() * W; y = H + 20; }

    zombies.push({
      x, y, r: 16,
      hp:    3 + Math.floor(wave * 0.5),
      maxHp: 3 + Math.floor(wave * 0.5),
      speed: 60 + wave * 6 + Math.random() * 40,
      dmg:   10,
    });
  }

  // --- Shoot ---
  function shoot(now) {
    const weapon = WEAPONS[currentWeaponIdx];
    if (now - lastShot < weapon.fireRateMs) return;
    lastShot = now;

    const baseDx = mouse.x - player.x, baseDy = mouse.y - player.y;
    const baseAngle = Math.atan2(baseDy, baseDx);

    for (let i = 0; i < weapon.bulletsPerShot; i++) {
      const angle = baseAngle + (Math.random() - 0.5) * 2 * weapon.spread;
      const dx = Math.cos(angle), dy = Math.sin(angle);
      bullets.push({
        x: player.x + dx * (player.r + 6),
        y: player.y + dy * (player.r + 6),
        vx: dx * weapon.bulletSpeed, vy: dy * weapon.bulletSpeed,
        r: weapon.bulletR, life: weapon.bulletLife,
        damage: weapon.damage,
        color: weapon.color,
      });
    }
    hitFx(player.x, player.y, weapon.ammoColor, 3);
  }

  // --- Particles ---
  function hitFx(x, y, color = "#ffffff", count = 8) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 80 + Math.random() * 180;
      particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.35 + Math.random() * 0.25, color });
    }
  }

  // --- Update ---
  function update(dt, now) {
    if (gameOver || !started) return;

    let mx = 0, my = 0;
    if (keys.has("z") || keys.has("arrowup")    || keys.has("w")) my -= 1;
    if (keys.has("s") || keys.has("arrowdown"))                    my += 1;
    if (keys.has("q") || keys.has("arrowleft")  || keys.has("a")) mx -= 1;
    if (keys.has("d") || keys.has("arrowright"))                   mx += 1;

    const m  = norm(mx, my);
    player.x = clamp(player.x + m.x * player.speed * dt, player.r, W - player.r);
    player.y = clamp(player.y + m.y * player.speed * dt, player.r, H - player.r);
    if (player.iFrames > 0) player.iFrames -= dt;

    if (mouseDown) shoot(now);

    spawnTimer -= dt;
    if (spawnTimer <= 0 && spawnBudget > 0) {
      spawnZombie();
      spawnBudget--;
      spawnTimer = 0.35;
    }
    if (spawnBudget <= 0 && zombies.length === 0) {
      wave++;
      spawnBudget = 6 + wave * 2;
      UI.updateHUD({ hp: player.hp, score, wave });
    }

    for (const b of bullets) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
    }
    bullets = bullets.filter(b => b.life > 0 && b.x > -50 && b.x < W + 50 && b.y > -50 && b.y < H + 50);

    for (const z of zombies) {
      const dx = player.x - z.x, dy = player.y - z.y;
      const d  = norm(dx, dy);
      z.x += d.x * z.speed * dt;
      z.y += d.y * z.speed * dt;
    }

    for (const b of bullets) {
      for (const z of zombies) {
        if (z.hp <= 0) continue;
        if (len(b.x - z.x, b.y - z.y) < b.r + z.r) {
          z.hp  -= b.damage;
          b.life = 0;
          hitFx(b.x, b.y, "#5cff9a");
          if (z.hp <= 0) { score += 10 * b.damage; hitFx(z.x, z.y, "#ff4d4d"); }
        }
      }
    }
    zombies = zombies.filter(z => z.hp > 0);

    for (const z of zombies) {
      if (len(player.x - z.x, player.y - z.y) < player.r + z.r) {
        if (player.iFrames <= 0) {
          player.hp   -= z.dmg;
          player.iFrames = 0.45;
          hitFx(player.x, player.y, "#78aaff");
          if (player.hp <= 0) {
            player.hp = 0;
            gameOver  = true;
            UI.showGameOver(score);
          }
        }
      }
    }

    for (const p of particles) {
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= (1 - 6 * dt); p.vy *= (1 - 6 * dt);
      p.life -= dt;
    }
    particles = particles.filter(p => p.life > 0);

    UI.updateHUD({ hp: player.hp, score, wave });
  }

  // --- Draw ---
  function draw() {
    ctx.clearRect(0, 0, W, H);

    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = "#9fb3c8";
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.restore();

    if (!started) return;

    // Balles
    ctx.save();
    for (const b of bullets) {
      ctx.fillStyle = b.color || "#f2f5ff";
      ctx.shadowColor = b.color || "#f2f5ff";
      ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();

    // Zombies
    ctx.save();
    for (const z of zombies) {
      ctx.fillStyle = "#5cff9a";
      ctx.shadowColor = "#5cff9a";
      ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      const pct = clamp(z.hp / z.maxHp, 0, 1);
      ctx.fillStyle = "rgba(0,0,0,.5)";
      ctx.fillRect(z.x - 16, z.y - z.r - 10, 32, 5);
      ctx.fillStyle = pct > 0.5 ? "#5cff9a" : pct > 0.25 ? "#f0a500" : "#ff4d4d";
      ctx.fillRect(z.x - 16, z.y - z.r - 10, 32 * pct, 5);
    }
    ctx.restore();

    // Joueur
    ctx.save();
    const wColor = WEAPONS[currentWeaponIdx].ammoColor;
    ctx.fillStyle = player.iFrames > 0 ? "rgba(120,170,255,.65)" : "#78aaff";
    ctx.shadowColor = wColor;
    ctx.shadowBlur = 16;
    ctx.beginPath(); ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalAlpha  = 0.3;
    ctx.strokeStyle  = wColor;
    ctx.lineWidth    = 1.5;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(mouse.x, mouse.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Particules
    ctx.save();
    for (const p of particles) {
      ctx.globalAlpha = clamp(p.life / 0.6, 0, 1);
      ctx.fillStyle   = p.color || "#ffffff";
      ctx.fillRect(p.x, p.y, 3, 3);
    }
    ctx.restore();

    drawWeaponHUD();
  }

  function drawWeaponHUD() {
    const slotW = 115, gap = 8;
    const barW = WEAPONS.length * slotW + (WEAPONS.length - 1) * gap;
    const startX = (W - barW) / 2;
    const y = H - 50;

    for (let i = 0; i < WEAPONS.length; i++) {
      const w = WEAPONS[i];
      const x = startX + i * (slotW + gap);
      const active = i === currentWeaponIdx;

      ctx.save();
      ctx.globalAlpha = active ? 0.95 : 0.55;
      ctx.fillStyle = active ? "#1a2d42" : "#0d1520";
      ctx.strokeStyle = active ? w.ammoColor : "#2a3442";
      ctx.lineWidth = active ? 2 : 1;
      ctx.beginPath();
      ctx.roundRect(x, y, slotW, 38, 7);
      ctx.fill();
      if (active) {
        ctx.shadowColor = w.ammoColor;
        ctx.shadowBlur = 14;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = active ? 1 : 0.6;
      ctx.font = "15px system-ui";
      ctx.fillText(w.icon, x + 7, y + 25);
      ctx.fillStyle = active ? w.ammoColor : "#7a8fa8";
      ctx.font = `${active ? "600 " : ""}12px system-ui`;
      ctx.fillText(`[${w.key}] ${w.name}`, x + 28, y + 25);
      ctx.restore();
    }
  }

  // --- Loop ---
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    update(dt, now);
    draw();
    requestAnimationFrame(loop);
  }

  UI.startBtn.addEventListener("click", () => {
    UI.hideMenu();
    started = true;
    init();
  });

  UI.restartBtn.addEventListener("click", () => {
    restart();
    started = true;
  });

  init();
  started = false;
  requestAnimationFrame(loop);

})();