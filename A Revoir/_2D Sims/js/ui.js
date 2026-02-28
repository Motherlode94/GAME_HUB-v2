(function () {
    "use strict";

    var uiState = {
        cached: false,
        nodes: {},
        last: {
            charName: "",
            money: "",
            moodText: "",
            moodWidth: "",
            moodColor: "",
            traitsHash: "",
            aspirationHash: "",
            needsHash: "",
            skillsHash: "",
            relationsHash: "",
            timeText: "",
            ageText: "",
            seasonText: "",
            reputationText: "",
            socialText: "",
            activityText: "",
            debugVisible: false,
            debugKeys: "",
            debugPos: ""
        }
    };

    function cacheDom() {
        if (uiState.cached) return;

        var ids = [
            "time-display",
            "char-name",
            "char-money",
            "mood-text",
            "mood-fill",
            "traits-list",
            "aspiration-progress",
            "needs-bars",
            "skills-list",
            "relations-list",
            "debug-panel",
            "debug-keys",
            "debug-position",
            "char-age",
            "season-info",
            "reputation-info",
            "social-status",
            "next-activity"
        ];

        ids.forEach(function (id) {
            uiState.nodes[id] = document.getElementById(id);
        });

        uiState.cached = true;
    }

    function setText(node, value, key) {
        if (!node) return;
        var next = String(value || "");
        if (uiState.last[key] === next) return;
        node.textContent = next;
        uiState.last[key] = next;
    }

    function setStyle(node, prop, value, key) {
        if (!node) return;
        var next = String(value || "");
        if (uiState.last[key] === next) return;
        node.style[prop] = next;
        uiState.last[key] = next;
    }

    function buildTraits(char) {
        if (!char || !Array.isArray(char.traits) || char.traits.length === 0) {
            return "<p class='empty'>Aucun trait</p>";
        }

        return char.traits.map(function (trait) {
            var name = (typeof Traits !== "undefined" && Traits[trait]) ? Traits[trait].name : trait;
            return "<span class='trait'>" + name + "</span>";
        }).join("");
    }

    function updateTraits(char) {
        var node = uiState.nodes["traits-list"];
        if (!node) return;

        var html = buildTraits(char);
        if (uiState.last.traitsHash === html) return;

        node.innerHTML = html;
        uiState.last.traitsHash = html;
    }

    function updateAspiration(char) {
        var node = uiState.nodes["aspiration-progress"];
        if (!node) return;

        var html = "<p class='empty'>Aucune aspiration</p>";

        if (char && char.aspiration && Array.isArray(char.aspiration.milestones)) {
            var current = Number(char.aspiration.currentMilestone) || 0;
            var total = Math.max(1, Number(char.aspiration.milestones.length) || 1);
            var progress = Math.max(0, Math.min(100, Math.round((current / total) * 100)));

            html =
                "<div class='aspiration-bar'><div class='aspiration-fill' style='width:" + progress + "%'></div></div>" +
                "<div class='aspiration-text'>" + current + "/" + total + " - " + char.aspiration.type + "</div>";
        }

        if (uiState.last.aspirationHash === html) return;

        node.innerHTML = html;
        uiState.last.aspirationHash = html;
    }

    function buildNeeds(char) {
        if (!char || !char.needs || typeof char.needs.getAllNeeds !== "function") {
            return "<p class='empty'>Aucun besoin disponible</p>";
        }

        var allNeeds = char.needs.getAllNeeds();

        return Object.keys(allNeeds).map(function (key) {
            var need = allNeeds[key];
            var value = Math.max(0, Math.min(100, Number(need.value) || 0));
            var color = value < 30 ? "#ff4444" : value < 60 ? "#ffbb44" : "#44dd88";

            return (
                "<div class='need-item'>" +
                    "<label>" + need.label + "</label>" +
                    "<div class='need-bar'><div class='need-fill' style='width:" + value + "%; background:" + color + "'></div></div>" +
                    "<span>" + Math.floor(value) + "</span>" +
                "</div>"
            );
        }).join("");
    }

    function updateNeeds(char) {
        var node = uiState.nodes["needs-bars"];
        if (!node) return;

        var html = buildNeeds(char);
        if (uiState.last.needsHash === html) return;

        node.innerHTML = html;
        uiState.last.needsHash = html;
    }

    function buildSkills(char) {
        if (!char || !char.skills || typeof char.skills.getLevel !== "function") {
            return "<p class='empty'>Aucune competence</p>";
        }

        var skills = ["cooking", "charisma", "logic", "creativity", "fitness", "mechanical"];

        var rows = skills.map(function (skill) {
            var level = Number(char.skills.getLevel(skill)) || 0;
            if (level <= 0) return "";

            var dots = Array(10).fill(0).map(function (_, i) {
                return "<span class='dot" + (i < level ? " filled" : "") + "'></span>";
            }).join("");

            return (
                "<div class='skill-item'>" +
                    "<label>" + skill + "</label>" +
                    "<div class='skill-dots'>" + dots + "</div>" +
                    "<span>" + level + "/10</span>" +
                "</div>"
            );
        }).filter(Boolean).join("");

        return rows || "<p class='empty'>Aucune competence developpee</p>";
    }

    function updateSkills(char) {
        var node = uiState.nodes["skills-list"];
        if (!node) return;

        var html = buildSkills(char);
        if (uiState.last.skillsHash === html) return;

        node.innerHTML = html;
        uiState.last.skillsHash = html;
    }

    function buildRelations(char) {
        if (!char || !char.relations) {
            return "<p class='empty'>Aucune relation</p>";
        }

        var relations = Object.values(char.relations);
        if (relations.length === 0) {
            return "<p class='empty'>Aucune relation</p>";
        }

        return relations.map(function (rel) {
            if (!Array.isArray(window.chars)) return "";

            var other = window.chars.find(function (candidate) {
                return candidate.id === rel.targetId;
            });

            if (!other || other.isDead) return "";

            var affection = Math.max(0, Math.min(100, Number(rel.affection) || 0));
            var color = affection > 70 ? "#44dd88" : affection > 40 ? "#ffbb44" : "#ff4444";
            var status = affection > 70 ? "Ami" : affection > 40 ? "Connaissance" : "Ennemi";

            return (
                "<div class='relation-item'>" +
                    "<div class='relation-header'><strong>" + other.name + "</strong><span>" + status + "</span></div>" +
                    "<div class='relation-bar'><div class='relation-fill' style='width:" + affection + "%; background:" + color + "'></div></div>" +
                    "<span class='relation-value'>" + Math.floor(affection) + "/100</span>" +
                "</div>"
            );
        }).join("") || "<p class='empty'>Aucune relation</p>";
    }

    function updateRelations(char) {
        var node = uiState.nodes["relations-list"];
        if (!node) return;

        var html = buildRelations(char);
        if (uiState.last.relationsHash === html) return;

        node.innerHTML = html;
        uiState.last.relationsHash = html;
    }

    function formatMainTime() {
        var timePart = "";
        if (typeof Time !== "undefined" && typeof Time.getFormatted === "function") {
            timePart = Time.getFormatted();
            if (typeof Time.getPhase === "function") {
                timePart += " - " + Time.getPhase();
            }
        }

        if (typeof Season !== "undefined" && typeof Season.getInfo === "function") {
            var season = Season.getInfo();
            if (season) {
                timePart += " | " + season.season + " J" + season.day;
            }
        }

        return timePart || "--:--";
    }

    function updateAdvancedInfo(char) {
        var ageText = "Age inconnu";
        if (char && typeof Aging !== "undefined" && typeof Aging.getAge === "function" && typeof Aging.getStage === "function") {
            ageText = Aging.getAge(char.id) + " ans (" + Aging.getStage(char.id) + ")";
        }
        setText(uiState.nodes["char-age"], ageText, "ageText");

        var seasonText = "Saison inconnue";
        if (typeof Season !== "undefined" && typeof Season.getInfo === "function") {
            var season = Season.getInfo();
            if (season) {
                seasonText = season.season + ", Jour " + season.day;
                if (season.weather) {
                    seasonText += " - " + season.weather;
                }
            }
        }
        setText(uiState.nodes["season-info"], seasonText, "seasonText");

        var reputationText = "Reputation indisponible";
        if (char && typeof Reputation !== "undefined" && typeof Reputation.getSocialClass === "function") {
            var socialClass = Reputation.getSocialClass(char.id);
            var repObj = Reputation.reputations && Reputation.reputations[char.id];
            var score = repObj ? Math.round(repObj.overall) : 0;
            reputationText = socialClass.name + " (" + score + "/100)";
        }
        setText(uiState.nodes["reputation-info"], reputationText, "reputationText");

        var socialText = "Etat social indisponible";
        if (char && typeof SocialNeeds !== "undefined" && typeof SocialNeeds.getSocialStatus === "function") {
            socialText = SocialNeeds.getSocialStatus(char.id);
        }
        setText(uiState.nodes["social-status"], socialText, "socialText");

        var activityText = "Aucune activite";
        if (char && typeof Routines !== "undefined" && typeof Routines.getNextActivity === "function") {
            var next = Routines.getNextActivity(char.id);
            if (next && next.activity) {
                activityText = next.activity + " (" + next.hour + "h)";
            }
        }
        setText(uiState.nodes["next-activity"], activityText, "activityText");
    }

    function updateDebug(char) {
        var panel = uiState.nodes["debug-panel"];
        if (!panel) return;

        var isDebug = !!(typeof Input !== "undefined" && Input.debug);

        if (uiState.last.debugVisible !== isDebug) {
            panel.style.display = isDebug ? "block" : "none";
            uiState.last.debugVisible = isDebug;
        }

        if (!isDebug) return;

        var keysText = "Aucune touche";
        if (typeof Input !== "undefined" && Input.keys) {
            var keys = Object.keys(Input.keys).filter(function (key) {
                return Input.keys[key];
            });
            keysText = keys.length > 0 ? ("Touches: " + keys.join(", ")) : "Aucune touche";
        }

        setText(uiState.nodes["debug-keys"], keysText, "debugKeys");

        var posText = "Position: (0, 0)";
        if (char) {
            posText = "Position: (" + Math.floor(char.x) + ", " + Math.floor(char.y) + ")";
        }
        setText(uiState.nodes["debug-position"], posText, "debugPos");
    }

    function updateCharacterPanel(char) {
        if (!char) return;

        setText(uiState.nodes["char-name"], char.name || "-", "charName");
        setText(uiState.nodes["char-money"], (Math.round(Number(char.money) || 0) + "$"), "money");

        var moodText = (char.needs && typeof char.needs.getStatus === "function") ? char.needs.getStatus() : "-";
        setText(uiState.nodes["mood-text"], moodText, "moodText");

        var moodValue = char.needs ? Math.max(0, Math.min(100, Number(char.needs.mood) || 0)) : 0;
        setStyle(uiState.nodes["mood-fill"], "width", moodValue + "%", "moodWidth");

        var moodColor = (char.needs && typeof char.needs.getMoodColor === "function") ? char.needs.getMoodColor() : "#44dd88";
        setStyle(uiState.nodes["mood-fill"], "background", moodColor, "moodColor");

        updateTraits(char);
        updateAspiration(char);
    }

    function updateUI() {
        cacheDom();

        if (typeof window.player === "undefined" || !window.player) {
            return;
        }

        var char = window.player;

        setText(uiState.nodes["time-display"], formatMainTime(), "timeText");
        updateCharacterPanel(char);
        updateNeeds(char);
        updateSkills(char);
        updateRelations(char);
        updateAdvancedInfo(char);
        updateDebug(char);
    }

    window.updateUI = updateUI;
})();
