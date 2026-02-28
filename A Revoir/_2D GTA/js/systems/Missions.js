// Missions.js - mission chain and objective system

Game.Missions = {
  missions: [],
  index: 0,
  active: null,
  state: {},
  lastTick: 0,
  feed: [],
  ui: null,

  initDefinitions() {
    this.missions = [
      {
        id: "drop_express",
        type: "pickup_delivery",
        title: "DROP EXPRESS",
        brief: "Recupere le sac puis livre-le au depot.",
        reward: 1200,
        timeLimit: 180
      },
      {
        id: "car_lift",
        type: "vehicle_delivery",
        title: "GRAND THEFT RIDE",
        brief: "Vole le vehicule cible et livre-le au garage.",
        reward: 1500,
        timeLimit: 220
      },
      {
        id: "gang_cleanup",
        type: "eliminate",
        title: "GANG CLEANUP",
        brief: "Nettoie le quartier de ses hostiles.",
        reward: 2100,
        timeLimit: 220,
        targetKills: 6
      },
      {
        id: "central_braquage",
        type: "robbery",
        title: "BRAQUAGE CENTRAL",
        brief: "Braque le site, tiens la position et fuis au safehouse.",
        reward: 3200,
        timeLimit: 300,
        holdDuration: 16
      },
      {
        id: "cop_hunter",
        type: "eliminate_cops",
        title: "COP HUNTER",
        brief: "Neutralise la brigade anti-crime.",
        reward: 2600,
        timeLimit: 220,
        targetCopKills: 4
      },
      {
        id: "heat_escape",
        type: "heat_escape",
        title: "HEAT ESCAPE",
        brief: "Declenche l'alerte puis disparais avec la marchandise.",
        reward: 2800,
        timeLimit: 260
      },
      {
        id: "arms_run",
        type: "arms_run",
        title: "ARMS RUN",
        brief: "Recupere des armes puis rejoins l'extraction.",
        reward: 1700,
        timeLimit: 210,
        requiredWeapons: 2
      }
    ];
  },

  bindUi() {
    this.ui = {
      panel: document.getElementById("mission-panel"),
      title: document.getElementById("mission-title"),
      objective: document.getElementById("mission-objective"),
      progress: document.getElementById("mission-progress"),
      reward: document.getElementById("mission-reward"),
      timer: document.getElementById("mission-timer"),
      feed: document.getElementById("mission-feed")
    };
  },

  reset() {
    this.initDefinitions();
    this.bindUi();

    this.index = 0;
    this.active = null;
    this.state = {};
    this.feed = [];
    this.lastTick = performance.now();

    this.startMission(0, true);
    this.pushFeed("Nouveau contrat actif.");
  },

  pushFeed(text) {
    if (!text) return;

    this.feed.unshift(String(text));
    if (this.feed.length > 4) {
      this.feed = this.feed.slice(0, 4);
    }

    if (!this.ui || !this.ui.feed) return;
    this.ui.feed.innerHTML = this.feed.map((item) => `<li>${item}</li>`).join("");
  },

  randomWorldPoint(minDistanceFromPlayer = 700) {
    const map = Game.Map || { width: 5200, height: 5200 };
    const player = Game.player || { x: map.width / 2, y: map.height / 2 };
    const pad = 260;

    for (let i = 0; i < 60; i++) {
      const x = Utils.randomInt(pad, map.width - pad);
      const y = Utils.randomInt(pad, map.height - pad);
      const dist = Utils.distance(player.x, player.y, x, y);
      if (dist >= minDistanceFromPlayer) {
        return { x, y };
      }
    }

    return {
      x: Math.floor(map.width * 0.5),
      y: Math.floor(map.height * 0.5)
    };
  },

  getPlayerVehicleType() {
    if (!Game.VehicleManager || !Game.VehicleManager.playerVehicle) return null;
    const v = Game.VehicleManager.playerVehicle;
    if (!v || !v.occupied) return null;
    return v.type || null;
  },

  ensurePolicePressure(minWanted = 3, copsToSpawn = 2) {
    if (!Game.HUD || !Game.Police || !Game.Police.spawnCop) return;

    Game.HUD.wantedLevel = Math.max(Game.HUD.wantedLevel || 0, minWanted);

    for (let i = 0; i < copsToSpawn; i++) {
      Game.Police.spawnCop();
    }
  },

  spawnCombatPack(center, count = 5) {
    if (!Game.EnemyManager || !Game.EnemyManager.spawn) return;

    for (let i = 0; i < count; i++) {
      const ex = Utils.clamp(center.x + Utils.randomInt(-280, 280), 120, Game.Map.width - 120);
      const ey = Utils.clamp(center.y + Utils.randomInt(-280, 280), 120, Game.Map.height - 120);
      const type = i === 0 ? "tank" : i % 2 === 0 ? "fast" : "normal";
      Game.EnemyManager.spawn(ex, ey, type);
    }
  },

  startMission(index, silent = false) {
    if (!this.missions.length) return;

    this.index = ((index % this.missions.length) + this.missions.length) % this.missions.length;
    this.active = this.missions[this.index];

    this.state = {
      startedAt: performance.now(),
      timeLeft: this.active.timeLimit || 0,
      stage: 0,
      completed: false,
      failed: false,
      startEnemyKills: (Game.Runtime && Game.Runtime.stats && Game.Runtime.stats.enemyKills) || 0,
      startCopKills: (Game.Runtime && Game.Runtime.stats && Game.Runtime.stats.copKills) || 0,
      requiredType: null,
      pickup: null,
      drop: null,
      extract: null,
      hotspot: null,
      bank: null,
      safehouse: null,
      targetKills: this.active.targetKills || 0,
      targetCopKills: this.active.targetCopKills || 0,
      requiredWeapons: this.active.requiredWeapons || 0,
      holdDuration: this.active.holdDuration || 0,
      holdTimer: this.active.holdDuration || 0,
      spawnClock: 0,
      warnedWanted: false
    };

    if (this.active.type === "pickup_delivery") {
      this.state.pickup = this.randomWorldPoint(450);
      this.state.drop = this.randomWorldPoint(900);
    }

    if (this.active.type === "vehicle_delivery") {
      const types = ["sedan", "sports", "suv", "bike"];
      this.state.requiredType = types[Utils.randomInt(0, types.length - 1)];
      this.state.drop = this.randomWorldPoint(800);
    }

    if (this.active.type === "eliminate") {
      this.state.hotspot = this.randomWorldPoint(600);
      this.spawnCombatPack(this.state.hotspot, this.state.targetKills || 5);
    }

    if (this.active.type === "robbery") {
      this.state.bank = this.randomWorldPoint(550);
      this.state.safehouse = this.randomWorldPoint(1000);
      this.state.holdTimer = this.state.holdDuration;
    }

    if (this.active.type === "eliminate_cops") {
      this.ensurePolicePressure(3, 3);
    }

    if (this.active.type === "heat_escape") {
      this.state.hotspot = this.randomWorldPoint(620);
      this.state.safehouse = this.randomWorldPoint(1000);
    }

    if (this.active.type === "arms_run") {
      this.state.extract = this.randomWorldPoint(850);
    }

    if (!silent) {
      this.pushFeed(`Mission: ${this.active.title}`);
      if (Game.HUD) {
        Game.HUD.showMessage(this.active.title, 120);
      }
    }

    this.renderMissionUi();
  },

  failMission(reason) {
    if (!this.active) return;

    this.state.failed = true;
    this.pushFeed(`Echec: ${reason}`);

    if (Game.HUD) {
      Game.HUD.showMessage("Mission echouee", 120);
    }

    this.startMission(this.index, true);
  },

  completeMission() {
    if (!this.active || this.state.completed) return;

    this.state.completed = true;

    if (Game.HUD) {
      Game.HUD.money += this.active.reward;
      Game.HUD.showMessage(`Mission reussie +$${this.active.reward}`, 150);
    }

    if (Game.Runtime && Game.Runtime.stats) {
      Game.Runtime.stats.missionsCompleted = (Game.Runtime.stats.missionsCompleted || 0) + 1;
    }

    this.pushFeed(`Reussite: ${this.active.title}`);

    this.startMission(this.index + 1, true);
  },

  getCurrentObjectiveText() {
    if (!this.active) return "Aucune mission";

    if (this.active.type === "pickup_delivery") {
      return this.state.stage === 0
        ? "Aller au point de pickup"
        : "Livrer le sac au depot";
    }

    if (this.active.type === "vehicle_delivery") {
      return this.state.stage === 0
        ? `Voler un vehicule type ${String(this.state.requiredType || "").toUpperCase()}`
        : "Livrer le vehicule au garage";
    }

    if (this.active.type === "eliminate") {
      return this.state.stage === 0
        ? "Rejoindre la zone de nettoyage"
        : "Eliminer les hostiles du quartier";
    }

    if (this.active.type === "robbery") {
      if (this.state.stage === 0) return "Rejoindre le site du braquage";
      if (this.state.stage === 1) return "Tenir la position pendant l'ouverture du coffre";
      return "Rejoindre le safehouse avec un niveau de recherche bas";
    }

    if (this.active.type === "eliminate_cops") {
      return "Neutraliser les unites de police";
    }

    if (this.active.type === "heat_escape") {
      if (this.state.stage === 0) return "Declencher l'alerte dans la zone chaude";
      return "Semer la police et rejoindre le point de sortie";
    }

    if (this.active.type === "arms_run") {
      return this.state.stage === 0
        ? "Recuperer des armes dans la ville"
        : "Rejoindre le point d'extraction";
    }

    return this.active.brief;
  },

  getCurrentProgressText() {
    if (!this.active) return "-";

    if (this.active.type === "pickup_delivery") {
      return this.state.stage === 0 ? "Etape 1/2" : "Etape 2/2";
    }

    if (this.active.type === "vehicle_delivery") {
      return this.state.stage === 0
        ? `Vehicule cible: ${String(this.state.requiredType || "").toUpperCase()}`
        : "Etape 2/2";
    }

    if (this.active.type === "eliminate") {
      const kills = ((Game.Runtime && Game.Runtime.stats && Game.Runtime.stats.enemyKills) || 0) - (this.state.startEnemyKills || 0);
      return this.state.stage === 0
        ? "Approche zone"
        : `Kills: ${Math.max(0, kills)}/${this.state.targetKills}`;
    }

    if (this.active.type === "robbery") {
      if (this.state.stage === 0) return "Infiltration";
      if (this.state.stage === 1) return `Hold: ${Math.ceil(this.state.holdTimer)}s`;
      const wanted = (Game.HUD && Game.HUD.wantedLevel) || 0;
      return `Wanted: ${wanted} (cible <= 1)`;
    }

    if (this.active.type === "eliminate_cops") {
      const copKills = ((Game.Runtime && Game.Runtime.stats && Game.Runtime.stats.copKills) || 0) - (this.state.startCopKills || 0);
      return `Police: ${Math.max(0, copKills)}/${this.state.targetCopKills}`;
    }

    if (this.active.type === "heat_escape") {
      const wanted = (Game.HUD && Game.HUD.wantedLevel) || 0;
      return this.state.stage === 0
        ? "Declencher l'alerte"
        : `Wanted: ${wanted} (cible <= 1)`;
    }

    if (this.active.type === "arms_run") {
      const inv = Game.WeaponManager && Game.WeaponManager.inventory ? Game.WeaponManager.inventory : ["fist"];
      const count = inv.filter((w) => w !== "fist").length;
      return this.state.stage === 0
        ? `Armes: ${count}/${this.state.requiredWeapons}`
        : "Extraction";
    }

    return "-";
  },

  getPrimaryTarget() {
    if (!this.active) return null;

    if (this.active.type === "pickup_delivery") {
      return this.state.stage === 0
        ? { ...this.state.pickup, color: "#3bff8c", label: "P" }
        : { ...this.state.drop, color: "#ffd84b", label: "D" };
    }

    if (this.active.type === "vehicle_delivery") {
      if (this.state.stage === 0) return null;
      return { ...this.state.drop, color: "#69a8ff", label: "G" };
    }

    if (this.active.type === "eliminate") {
      return { ...this.state.hotspot, color: "#ff5b5b", label: "K" };
    }

    if (this.active.type === "robbery") {
      if (this.state.stage <= 1) {
        return { ...this.state.bank, color: "#ff9f4f", label: "B" };
      }
      return { ...this.state.safehouse, color: "#6de2ff", label: "S" };
    }

    if (this.active.type === "heat_escape") {
      if (this.state.stage === 0) {
        return { ...this.state.hotspot, color: "#ff5fd3", label: "H" };
      }
      return { ...this.state.safehouse, color: "#7effb1", label: "S" };
    }

    if (this.active.type === "arms_run") {
      if (this.state.stage === 0) return null;
      return { ...this.state.extract, color: "#ff9f4f", label: "X" };
    }

    return null;
  },

  update() {
    if (!this.active) return;

    if (!this.lastTick) this.lastTick = performance.now();
    const now = performance.now();
    const dt = Math.min(0.08, Math.max(0.0, (now - this.lastTick) / 1000));
    this.lastTick = now;

    if (this.state.timeLeft > 0) {
      this.state.timeLeft -= dt;
      if (this.state.timeLeft <= 0) {
        this.state.timeLeft = 0;
        this.failMission("Temps ecoule");
        return;
      }
    }

    const player = Game.player;
    if (!player) return;

    if (this.active.type === "pickup_delivery") {
      if (this.state.stage === 0 && this.state.pickup) {
        const d = Utils.distance(player.x, player.y, this.state.pickup.x, this.state.pickup.y);
        if (d < 85) {
          this.state.stage = 1;
          this.pushFeed("Sac recupere. Direction depot.");
          if (Game.HUD) Game.HUD.showMessage("Objectif mis a jour", 90);
        }
      } else if (this.state.stage === 1 && this.state.drop) {
        const d = Utils.distance(player.x, player.y, this.state.drop.x, this.state.drop.y);
        if (d < 95) {
          this.completeMission();
          return;
        }
      }
    }

    if (this.active.type === "vehicle_delivery") {
      const currentType = this.getPlayerVehicleType();
      if (this.state.stage === 0) {
        if (currentType && currentType === this.state.requiredType) {
          this.state.stage = 1;
          this.pushFeed("Vehicule securise. Va au garage.");
          if (Game.HUD) Game.HUD.showMessage("Livraison en cours", 90);
        }
      } else {
        if (currentType !== this.state.requiredType) {
          this.failMission("Vehicule perdu");
          return;
        }

        const d = Utils.distance(player.x, player.y, this.state.drop.x, this.state.drop.y);
        if (d < 100) {
          this.completeMission();
          return;
        }
      }
    }

    if (this.active.type === "eliminate") {
      if (this.state.stage === 0 && this.state.hotspot) {
        const d = Utils.distance(player.x, player.y, this.state.hotspot.x, this.state.hotspot.y);
        if (d < 160) {
          this.state.stage = 1;
          this.pushFeed("Zone chaude. Neutralise les cibles.");
          if (Game.EnemyManager && Game.EnemyManager.enemies) {
            const until = Date.now() + 60000;
            Game.EnemyManager.enemies.forEach((e) => {
              e.provokedUntil = Math.max(e.provokedUntil || 0, until);
            });
          }
        }
      }

      if (this.state.stage === 1) {
        const kills = ((Game.Runtime && Game.Runtime.stats && Game.Runtime.stats.enemyKills) || 0) - (this.state.startEnemyKills || 0);
        if (kills >= this.state.targetKills) {
          this.completeMission();
          return;
        }
      }
    }

    if (this.active.type === "robbery") {
      if (this.state.stage === 0) {
        const d = Utils.distance(player.x, player.y, this.state.bank.x, this.state.bank.y);
        if (d < 100) {
          this.state.stage = 1;
          this.ensurePolicePressure(4, 3);
          this.pushFeed("Braquage lance. Tiens la position.");
          if (Game.HUD) Game.HUD.showMessage("Coffre en ouverture", 100);
        }
      } else if (this.state.stage === 1) {
        const d = Utils.distance(player.x, player.y, this.state.bank.x, this.state.bank.y);

        if (d < 120) {
          this.state.holdTimer = Math.max(0, this.state.holdTimer - dt);
        } else {
          this.state.holdTimer = Math.min(this.state.holdDuration, this.state.holdTimer + dt * 0.35);
        }

        if (this.state.holdTimer <= 0) {
          this.state.stage = 2;
          this.ensurePolicePressure(3, 1);
          this.pushFeed("Butin recupere. File au safehouse.");
        }
      } else {
        const d = Utils.distance(player.x, player.y, this.state.safehouse.x, this.state.safehouse.y);
        const wanted = (Game.HUD && Game.HUD.wantedLevel) || 0;

        if (d < 110) {
          if (wanted <= 1) {
            this.completeMission();
            return;
          }

          if (!this.state.warnedWanted) {
            this.state.warnedWanted = true;
            this.pushFeed("Fais retomber le wanted avant de livrer.");
          }
        }
      }
    }

    if (this.active.type === "eliminate_cops") {
      const copKills = ((Game.Runtime && Game.Runtime.stats && Game.Runtime.stats.copKills) || 0) - (this.state.startCopKills || 0);
      if (copKills >= this.state.targetCopKills) {
        this.completeMission();
        return;
      }

      this.state.spawnClock += dt;
      if (this.state.spawnClock > 3.5) {
        this.state.spawnClock = 0;
        this.ensurePolicePressure(3, 1);
      }
    }

    if (this.active.type === "heat_escape") {
      if (this.state.stage === 0) {
        const d = Utils.distance(player.x, player.y, this.state.hotspot.x, this.state.hotspot.y);
        if (d < 130) {
          this.state.stage = 1;
          this.ensurePolicePressure(5, 4);
          if (Game.EnemyManager && Game.EnemyManager.spawnWave) {
            Game.EnemyManager.spawnWave(4, this.state.hotspot.x, this.state.hotspot.y, 220);
          }
          this.pushFeed("Alerte max. Rejoins la sortie en semant la police.");
        }
      } else {
        const d = Utils.distance(player.x, player.y, this.state.safehouse.x, this.state.safehouse.y);
        const wanted = (Game.HUD && Game.HUD.wantedLevel) || 0;

        if (d < 120 && wanted <= 1) {
          this.completeMission();
          return;
        }
      }
    }

    if (this.active.type === "arms_run") {
      const inv = Game.WeaponManager && Game.WeaponManager.inventory ? Game.WeaponManager.inventory : ["fist"];
      const count = inv.filter((w) => w !== "fist").length;

      if (this.state.stage === 0 && count >= this.state.requiredWeapons) {
        this.state.stage = 1;
        this.pushFeed("Armes chargees. Direction extraction.");
        if (Game.HUD) Game.HUD.showMessage("Extraction debloquee", 90);
      }

      if (this.state.stage === 1 && this.state.extract) {
        const d = Utils.distance(player.x, player.y, this.state.extract.x, this.state.extract.y);
        if (d < 95) {
          this.completeMission();
          return;
        }
      }
    }

    this.renderMissionUi();
  },

  renderMissionUi() {
    if (!this.ui || !this.ui.panel) return;

    this.ui.panel.classList.add("is-visible");

    if (this.ui.title) this.ui.title.textContent = this.active ? this.active.title : "AUCUNE MISSION";
    if (this.ui.objective) this.ui.objective.textContent = this.getCurrentObjectiveText();
    if (this.ui.progress) this.ui.progress.textContent = this.getCurrentProgressText();
    if (this.ui.reward) this.ui.reward.textContent = this.active ? `$${this.active.reward}` : "$0";

    if (this.ui.timer) {
      if (this.state.timeLeft > 0) {
        this.ui.timer.textContent = `${Math.ceil(this.state.timeLeft)}s`;
      } else {
        this.ui.timer.textContent = "--";
      }
    }

    if (this.ui.feed) {
      this.ui.feed.innerHTML = this.feed.map((item) => `<li>${item}</li>`).join("");
    }
  },

  drawWorld(ctx) {
    const target = this.getPrimaryTarget();
    if (!target) return;

    const pulse = 10 + Math.sin(performance.now() / 220) * 2;

    ctx.save();
    ctx.strokeStyle = target.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(target.x, target.y, pulse, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(target.x - 12, target.y - 38, 24, 20);

    ctx.fillStyle = "#ffffff";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(target.label || "O", target.x, target.y - 24);
    ctx.textAlign = "left";
    ctx.restore();
  },

  drawUI(ctx, canvas) {
    const target = this.getPrimaryTarget();
    const player = Game.player;
    if (!target || !player) return;

    const dx = target.x - player.x;
    const dy = target.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const centerX = canvas.width / 2;
    const centerY = 58;
    const angle = Math.atan2(dy, dx);

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);

    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.fillRect(-14, -10, 28, 20);

    ctx.fillStyle = "#ffd84b";
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(-6, -8);
    ctx.lineTo(-6, 8);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    ctx.fillStyle = "#fefefe";
    ctx.font = "700 14px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`OBJECTIF ${Math.floor(dist)}m`, centerX, 90);
    ctx.textAlign = "left";
  }
};
