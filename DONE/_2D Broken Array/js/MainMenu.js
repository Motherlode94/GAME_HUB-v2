window.RTS = window.RTS || {};

/**
 * MainMenu — écran titre avec sélection de difficulté et option allié.
 *
 * Appelle onStart(options) avec :
 *   options.difficulty  "easy" | "normal" | "hard"
 *   options.ally        true | false
 */
RTS.MainMenu = {

    _animFrame: null,
    _particles: [],
    _time:      0,

    // Options sélectionnées par le joueur
    _selectedDiff: "normal",
    _selectedAlly: false,

    show: function(canvas, onStart) {
        var ctx  = canvas.getContext("2d");
        var self = this;

        this._particles = [];
        for (var i = 0; i < 60; i++) {
            this._particles.push({
                x:     Math.random() * canvas.width,
                y:     Math.random() * canvas.height,
                vx:    (Math.random() - 0.5) * 0.4,
                vy:    0.3 + Math.random() * 0.8,
                size:  1 + Math.random() * 2,
                alpha: 0.1 + Math.random() * 0.4
            });
        }

        // Affiche l'overlay HTML
        var overlay = document.getElementById("mainMenuOverlay");
        if (overlay) {
            overlay.style.display  = "flex";
            overlay.style.opacity  = "1";
            overlay.style.transition = "opacity 0.4s";
        }

        // Injecte les options de jeu dans l'overlay
        self._injectOptions(overlay, onStart);

        // Animation fond
        var last = null;
        function animLoop(ts) {
            if (!last) last = ts;
            var dt = (ts - last) / 1000;
            last   = ts;
            self._time += dt;
            self._drawBg(ctx, canvas, dt);
            self._animFrame = requestAnimationFrame(animLoop);
        }
        self._animFrame = requestAnimationFrame(animLoop);

        // Bouton crédits
        var cred = document.getElementById("menuCreditsBtn");
        if (cred) {
            cred.onclick = function() {
                var modal = document.getElementById("creditsModal");
                if (modal) modal.style.display = modal.style.display === "flex" ? "none" : "flex";
            };
        }
    },

    hide: function() {
        cancelAnimationFrame(this._animFrame);
        var overlay = document.getElementById("mainMenuOverlay");
        if (overlay) {
            overlay.style.opacity    = "0";
            overlay.style.transition = "opacity 0.5s";
            setTimeout(function() { overlay.style.display = "none"; }, 550);
        }
    },

    // ── Injection des options dans l'overlay ─────────────────────────────────

    _injectOptions: function(overlay, onStart) {
        var self = this;

        // Supprimer l'ancien bloc options s'il existe
        var old = document.getElementById("menuOptions");
        if (old) old.remove();

        // Bloc options
        var block = document.createElement("div");
        block.id  = "menuOptions";
        block.style.cssText = [
            "margin:18px 0 0 0", "display:flex", "flex-direction:column",
            "align-items:center", "gap:14px"
        ].join(";");

        // ── Difficulté ──────────────────────────────────────────────────────
        var diffRow = document.createElement("div");
        diffRow.style.cssText = "display:flex;gap:8px;align-items:center;";

        var diffLabel = document.createElement("span");
        diffLabel.textContent = "Difficulté :";
        diffLabel.style.cssText = "color:#888;font-size:12px;font-family:'Courier New',monospace;width:90px;text-align:right;";
        diffRow.appendChild(diffLabel);

        [
            { key: "easy",   label: "FACILE",   color: "#27ae60" },
            { key: "normal", label: "NORMAL",   color: "#3d8ef5" },
            { key: "hard",   label: "DIFFICILE",color: "#e74c3c" }
        ].forEach(function(d) {
            var btn = document.createElement("button");
            btn.textContent  = d.label;
            btn.dataset.diff = d.key;
            btn.style.cssText = self._optBtnStyle(d.color, self._selectedDiff === d.key);
            btn.addEventListener("click", function() {
                self._selectedDiff = d.key;
                diffRow.querySelectorAll("button").forEach(function(b) {
                    var col = b === btn ? d.color : "#555";
                    b.style.cssText = self._optBtnStyle(col, b === btn);
                });
            });
            diffRow.appendChild(btn);
        });
        block.appendChild(diffRow);

        // ── Allié ────────────────────────────────────────────────────────────
        var allyRow = document.createElement("div");
        allyRow.style.cssText = "display:flex;gap:8px;align-items:center;";

        var allyLabel = document.createElement("span");
        allyLabel.textContent = "Allié IA :";
        allyLabel.style.cssText = "color:#888;font-size:12px;font-family:'Courier New',monospace;width:90px;text-align:right;";
        allyRow.appendChild(allyLabel);

        [
            { key: false, label: "NON", color: "#888" },
            { key: true,  label: "OUI", color: "#2ecc71" }
        ].forEach(function(a) {
            var btn = document.createElement("button");
            btn.textContent  = a.label;
            btn.dataset.ally = a.key;
            btn.style.cssText = self._optBtnStyle(
                a.color, self._selectedAlly === a.key
            );
            btn.addEventListener("click", function() {
                self._selectedAlly = a.key;
                allyRow.querySelectorAll("button").forEach(function(b) {
                    var isActive = (b === btn);
                    var col = isActive ? a.color : "#555";
                    b.style.cssText = self._optBtnStyle(col, isActive);
                });
            });
            allyRow.appendChild(btn);
        });
        block.appendChild(allyRow);

        // ── Bouton Jouer ─────────────────────────────────────────────────────
        var playBtn = document.createElement("button");
        playBtn.id  = "menuPlayBtn";
        playBtn.textContent = "▶  JOUER";
        playBtn.style.cssText = [
            "margin-top:8px", "padding:11px 44px",
            "background:rgba(61,142,245,0.18)",
            "color:#3d8ef5", "border:1.5px solid #3d8ef5",
            "border-radius:4px", "cursor:pointer",
            "font-family:'Courier New',monospace",
            "font-size:15px", "font-weight:bold",
            "letter-spacing:.14em",
            "transition:background .2s,color .2s"
        ].join(";");
        playBtn.onmouseenter = function() {
            playBtn.style.background = "rgba(61,142,245,0.38)";
            playBtn.style.color = "#fff";
        };
        playBtn.onmouseleave = function() {
            playBtn.style.background = "rgba(61,142,245,0.18)";
            playBtn.style.color = "#3d8ef5";
        };
        playBtn.addEventListener("click", function() {
            self.hide();
            onStart({ difficulty: self._selectedDiff, ally: self._selectedAlly });
        });
        block.appendChild(playBtn);

        // Injerer dans l'overlay (avant le bouton crédits si présent)
        var credBtn = document.getElementById("menuCreditsBtn");
        if (credBtn && credBtn.parentNode === overlay) {
            overlay.insertBefore(block, credBtn);
        } else if (overlay) {
            overlay.appendChild(block);
        }
    },

    _optBtnStyle: function(color, active) {
        return [
            "padding:5px 14px",
            "background:" + (active ? color + "33" : "rgba(30,30,40,0.8)"),
            "color:" + (active ? color : "#aaa"),
            "border:1.5px solid " + (active ? color : "#444"),
            "border-radius:3px", "cursor:pointer",
            "font-family:'Courier New',monospace",
            "font-size:11px", "font-weight:bold",
            "letter-spacing:.08em",
            "transition:all .15s"
        ].join(";");
    },

    // ── Animation fond ────────────────────────────────────────────────────────

    _drawBg: function(ctx, canvas, dt) {
        var w = canvas.width, h = canvas.height;

        ctx.fillStyle = "#060810";
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = "rgba(61,142,245,0.04)";
        ctx.lineWidth   = 1;
        var gs = 60;
        for (var x = 0; x < w; x += gs) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }
        for (var y = 0; y < h; y += gs) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }

        var p = this._particles;
        for (var i = 0; i < p.length; i++) {
            p[i].x += p[i].vx;
            p[i].y += p[i].vy;
            if (p[i].y > h + 4) { p[i].y = -4; p[i].x = Math.random() * w; }
            ctx.fillStyle = "rgba(255,220,100," + p[i].alpha + ")";
            ctx.fillRect(p[i].x, p[i].y, p[i].size, p[i].size * 3);
        }

        var hy   = h * 0.62 + Math.sin(this._time * 0.4) * 6;
        var grad = ctx.createLinearGradient(0, hy - 80, 0, hy + 30);
        grad.addColorStop(0, "rgba(61,142,245,0)");
        grad.addColorStop(1, "rgba(61,142,245,0.07)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, hy - 80, w, 110);

        ctx.strokeStyle = "rgba(61,142,245,0.18)";
        ctx.lineWidth   = 1.5;
        ctx.beginPath(); ctx.moveTo(0, hy); ctx.lineTo(w, hy); ctx.stroke();

        for (var sy = 0; sy < h; sy += 4) {
            ctx.fillStyle = "rgba(0,0,0,0.06)";
            ctx.fillRect(0, sy, w, 2);
        }
    }
};