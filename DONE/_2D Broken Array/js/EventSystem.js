window.RTS = window.RTS || {};

/**
 * EventSystem — Événements aléatoires pendant la partie.
 *
 * Un événement se déclenche toutes les 45–90 secondes (aléatoire).
 * Chaque événement a des effets immédiats ET/OU une fenêtre d'action pour le joueur.
 *
 * Types d'événements :
 *  ─ Positifs ─────────────────────────────────────────────────────────────────
 *  "supply_drop"      — Ravitaillement aérien : +or / +carb / +mun aléatoires
 *  "intel"            — Rapport de renseignement : ralentit la prochaine vague (+15s)
 *  "node_refill"      — Un nœud de ressources épuisé est réapprovisionné
 *  "medic_convoy"     — Convoi médical : soigne tous les squads bleus de 50 HP
 *  "reinforcements"   — Renforts alliés : 2 riflemen supplémentaires spawned
 *
 *  ─ Négatifs ─────────────────────────────────────────────────────────────────
 *  "ambush"           — Embuscade : 2 squads rouges apparaissent près de la base
 *  "resource_fire"    — Incendie sur une mine : perd 30s de production
 *  "jamming"          — Brouillage : les tours ne tirent pas pendant 10s
 *
 * Usage :
 *   RTS.EventSystem.init(game)
 *   RTS.EventSystem.update(game, delta)   — appelé chaque frame dans la boucle
 */
RTS.EventSystem = {

    _timer:     0,
    _interval:  60,   // secondes avant le prochain événement
    _jamTimer:  0,    // durée restante du brouillage des tours
    _active:    false,
    _history:   [],   // log des événements passés

    // ── Événements disponibles ────────────────────────────────────────────────

    POOL: [
        // ── Positifs ─────────────────────────────────────────────────────────
        {
            id:       "supply_drop",
            label:    "Ravitaillement Aérien",
            icon:     "📦",
            type:     "positive",
            minWave:  1,
            weight:   30,
            apply: function(game) {
                var amounts = [
                    { gold: 150 + Math.floor(Math.random()*100) },
                    { fuel: 100 + Math.floor(Math.random()*80)  },
                    { ammo: 120 + Math.floor(Math.random()*80)  },
                    { gold: 80, fuel: 60, ammo: 60              }
                ];
                var pick = amounts[Math.floor(Math.random() * amounts.length)];
                var parts = [];
                if (pick.gold) { game.resources.gold += pick.gold; parts.push("+" + pick.gold + " Or"); }
                if (pick.fuel) { game.resources.fuel += pick.fuel; parts.push("+" + pick.fuel + " Carb."); }
                if (pick.ammo) { game.resources.ammo += pick.ammo; parts.push("+" + pick.ammo + " Mun."); }
                return parts.join("  ·  ");
            }
        },
        {
            id:       "intel",
            label:    "Rapport de Renseignement",
            icon:     "📡",
            type:     "positive",
            minWave:  2,
            weight:   20,
            apply: function(game) {
                // Repousse la prochaine vague de 20 secondes
                RTS.WaveSystem._timer = Math.max(0, RTS.WaveSystem._timer - 20);
                return "Prochaine attaque repoussée de 20 secondes";
            }
        },
        {
            id:       "node_refill",
            label:    "Nouveau Gisement Découvert",
            icon:     "⛽",
            type:     "positive",
            minWave:  2,
            weight:   15,
            apply: function(game) {
                var depleted = game.resourceNodes.filter(function(n) { return n.depleted; });
                if (depleted.length === 0) {
                    // Renforcement d'un nœud existant
                    var alive = game.resourceNodes.filter(function(n) { return !n.depleted; });
                    if (alive.length > 0) {
                        var pick = alive[Math.floor(Math.random() * alive.length)];
                        pick.amount = Math.min(pick.maxAmount, pick.amount + 320);
                        return "Nœud " + pick.type + " renforcé de 320 unités";
                    }
                    return "Aucun nœud à réapprovisionner";
                }
                var node = depleted[Math.floor(Math.random() * depleted.length)];
                node.depleted = false;
                node.amount   = Math.max(350, Math.floor(node.maxAmount * 0.6));
                return "Gisement de " + node.type + " réapprovisionné !";
            }
        },
        {
            id:       "medic_convoy",
            label:    "Convoi Médical",
            icon:     "🏥",
            type:     "positive",
            minWave:  2,
            weight:   20,
            apply: function(game) {
                var healed = 0;
                game.squads.forEach(function(s) {
                    if (s.team !== "blue" && s.team !== "ally") return;
                    if (s.isDead()) return;
                    s.members.forEach(function(m) {
                        if (!m.dead) {
                            var before = m.hp;
                            m.hp = Math.min(m.maxHp, m.hp + 50);
                            healed += m.hp - before;
                        }
                    });
                });
                return "Soins prodigués : " + Math.round(healed) + " HP restaurés";
            }
        },
        {
            id:       "reinforcements",
            label:    "Renforts Disponibles",
            icon:     "🪖",
            type:     "positive",
            minWave:  3,
            weight:   18,
            apply: function(game) {
                var blues = game.buildings.filter(function(b) {
                    return b.team === "blue" && b.type === "barracks";
                });
                var spawnX = blues.length > 0 ? blues[0].x + 80 : 300;
                var spawnY = blues.length > 0 ? blues[0].y       : 300;

                for (var i = 0; i < 2; i++) {
                    var sq = new RTS.Squad(
                        spawnX + (Math.random() - 0.5) * 60,
                        spawnY + (Math.random() - 0.5) * 60,
                        "blue", "riflemen"
                    );
                    if (sq.members && sq.members.length > 0) game.squads.push(sq);
                }
                return "2 escouades de Riflemen déployées";
            }
        },

        // ── Négatifs ──────────────────────────────────────────────────────────
        {
            id:       "ambush",
            label:    "EMBUSCADE !",
            icon:     "⚠",
            type:     "negative",
            minWave:  3,
            weight:   14,
            apply: function(game) {
                var blues = game.buildings.filter(function(b) { return b.team === "blue"; });
                var baseX = blues.length > 0 ? blues[0].x : 200;
                var baseY = blues.length > 0 ? blues[0].y : 200;

                for (var i = 0; i < 2; i++) {
                    var angle = Math.random() * Math.PI * 2;
                    var dist  = 180 + Math.random() * 120;
                    var sq = new RTS.Squad(
                        baseX + Math.cos(angle) * dist,
                        baseY + Math.sin(angle) * dist,
                        "red", "riflemen"
                    );
                    if (sq.members && sq.members.length > 0) game.squads.push(sq);
                }
                return "2 escouades ennemies ont percé le périmètre !";
            }
        },
        {
            id:       "resource_fire",
            label:    "Incendie sur une Mine",
            icon:     "🔥",
            type:     "negative",
            minWave:  2,
            weight:   10,
            apply: function(game) {
                var mines = game.buildings.filter(function(b) {
                    return b.team === "blue" && b.type === "mine" && b.hp > 0;
                });
                if (mines.length === 0) return "Aucune mine touchée";
                var mine = mines[Math.floor(Math.random() * mines.length)];
                mine.hp = Math.max(1, mine.hp - 80);
                mine.flashTimer = 0.5;
                game.resources.gold = Math.max(0, game.resources.gold - 150);
                return "Une mine a brûlé ! -150 Or, mine endommagée";
            }
        },
        {
            id:       "jamming",
            label:    "Brouillage Électronique",
            icon:     "📵",
            type:     "negative",
            minWave:  4,
            weight:   8,
            apply: function(game) {
                RTS.EventSystem._jamTimer = 12;
                return "Tours désactivées pendant 12 secondes !";
            }
        }
    ],

    // ── Initialisation ────────────────────────────────────────────────────────

    init: function(game) {
        this._timer    = this._nextInterval();
        this._jamTimer = 0;
        this._active   = true;
        this._history  = [];
        this._buildUI();
    },

    // ── Mise à jour principale ────────────────────────────────────────────────

    update: function(game, delta) {
        if (!this._active || game.gameOver) return;
        if (!RTS.WaveSystem._prepDone)     return;   // pas d'événement en prépaf

        // Brouillage des tours
        if (this._jamTimer > 0) {
            this._jamTimer -= delta;
            // Le flag est vérifié par DefenseTower.update
        }

        this._timer -= delta;
        if (this._timer <= 0) {
            this._timer = this._nextInterval();
            this._triggerEvent(game);
        }
    },

    // Retourne true si les tours sont actuellement brouillées
    isTowerJammed: function() {
        return this._jamTimer > 0;
    },

    // ── Déclenchement d'un événement ─────────────────────────────────────────

    _triggerEvent: function(game) {
        var wave = game.wave || 1;

        // Filtrer les événements disponibles pour cette vague
        var available = this.POOL.filter(function(e) {
            return e.minWave <= wave;
        });

        if (available.length === 0) return;

        // Sélection pondérée
        var totalWeight = available.reduce(function(s, e) { return s + e.weight; }, 0);
        var rnd = Math.random() * totalWeight;
        var chosen = null;
        for (var i = 0; i < available.length; i++) {
            rnd -= available[i].weight;
            if (rnd <= 0) { chosen = available[i]; break; }
        }
        if (!chosen) chosen = available[available.length - 1];

        // Appliquer l'effet
        var result = chosen.apply(game);

        // Enregistrer dans l'historique
        this._history.unshift({
            icon:  chosen.icon,
            label: chosen.label,
            desc:  result,
            time:  game.wave
        });
        if (this._history.length > 5) this._history.pop();

        // Notification
        this._showNotif(chosen, result);
        this._updateLog();

        console.info("[Event]", chosen.label, "→", result);
    },

    // ── UI ────────────────────────────────────────────────────────────────────

    _buildUI: function() {
        // Panneau log des événements (côté droit, sous les ressources)
        var old = document.getElementById("eventLog");
        if (old) old.remove();

        var log = document.createElement("div");
        log.id  = "eventLog";
        log.style.cssText = [
            "position:fixed", "top:52px", "right:14px",
            "width:200px",
            "font-family:'Courier New',monospace",
            "font-size:9px", "color:rgba(255,255,255,.4)",
            "z-index:15", "pointer-events:none"
        ].join(";");
        document.body.appendChild(log);

        // Notification d'événement (centre-haut)
        var old2 = document.getElementById("eventNotif");
        if (old2) old2.remove();

        var notif = document.createElement("div");
        notif.id  = "eventNotif";
        notif.style.cssText = [
            "position:fixed", "top:54px", "left:50%",
            "transform:translateX(-50%)",
            "background:rgba(6,8,16,.96)",
            "border-radius:4px", "padding:12px 28px",
            "text-align:center", "z-index:100",
            "font-family:'Courier New',monospace",
            "opacity:0", "transition:opacity .35s",
            "pointer-events:none", "max-width:420px"
        ].join(";");
        document.body.appendChild(notif);
    },

    _showNotif: function(event, result) {
        var el = document.getElementById("eventNotif");
        if (!el) return;

        var borderColor = event.type === "positive"
            ? "rgba(46,204,113,.5)"
            : "rgba(231,76,60,.5)";
        var iconColor   = event.type === "positive" ? "#2ecc71" : "#e74c3c";

        el.style.border = "1px solid " + borderColor;
        el.innerHTML = [
            "<div style='font-size:11px;letter-spacing:.18em;text-transform:uppercase;",
            "color:" + iconColor + ";margin-bottom:4px'>",
            event.icon + "  " + event.label, "</div>",
            "<div style='font-size:10px;color:rgba(255,255,255,.6);letter-spacing:.05em'>",
            result, "</div>"
        ].join("");

        el.style.opacity = "1";

        clearTimeout(this._notifTimer);
        this._notifTimer = setTimeout(function() {
            el.style.opacity = "0";
        }, 4000);
    },

    _updateLog: function() {
        var log = document.getElementById("eventLog");
        if (!log) return;

        var html = this._history.map(function(h, i) {
            var alpha = 0.6 - i * 0.12;
            return [
                "<div style='margin-bottom:3px;opacity:" + Math.max(0.1, alpha) + "'>",
                "<span>" + h.icon + " </span>",
                "<span style='color:rgba(255,255,255,.65)'>" + h.label + "</span>",
                "</div>"
            ].join("");
        }).join("");

        log.innerHTML = html;
    },

    // ── Utilitaires ───────────────────────────────────────────────────────────

    _nextInterval: function() {
        // Entre 45 et 90 secondes
        return 45 + Math.random() * 45;
    }
};
