(function () {
    "use strict";

    const GAME_ID = 12;
    const SAVE_KEY = "wgc_urban_shadows_save_v1";

    const PHASES = [
        { id: "police", label: "Police Simulator", theme: "police" },
        { id: "prison", label: "Prison Simulator", theme: "prison" },
        { id: "gang", label: "Gang Simulator", theme: "gang" },
        { id: "ninja", label: "Ninja Assassin Simulator", theme: "ninja" }
    ];

    const dom = {
        startScreen: document.getElementById("start-screen"),
        gameScreen: document.getElementById("game-screen"),
        playerName: document.getElementById("player-name"),
        startBtn: document.getElementById("start-btn"),
        phaseTitle: document.getElementById("phase-title"),
        subTitle: document.getElementById("sub-title"),
        statCash: document.getElementById("stat-cash"),
        statHealth: document.getElementById("stat-health"),
        statHeat: document.getElementById("stat-heat"),
        statInfluence: document.getElementById("stat-influence"),
        statStealth: document.getElementById("stat-stealth"),
        statScore: document.getElementById("stat-score"),
        phaseTrack: document.getElementById("phase-track"),
        actionState: document.getElementById("action-state"),
        actionsList: document.getElementById("actions-list"),
        endDayBtn: document.getElementById("end-day-btn"),
        saveBtn: document.getElementById("save-btn"),
        loadBtn: document.getElementById("load-btn"),
        nextPhaseBtn: document.getElementById("next-phase-btn"),
        cityAlert: document.getElementById("city-alert"),
        objectiveState: document.getElementById("objective-state"),
        objectiveText: document.getElementById("objective-text"),
        phaseStats: document.getElementById("phase-stats"),
        logList: document.getElementById("log-list"),
        modal: document.getElementById("modal"),
        modalTitle: document.getElementById("modal-title"),
        modalText: document.getElementById("modal-text"),
        restartBtn: document.getElementById("restart-btn"),
        canvas: document.getElementById("city-canvas")
    };

    const ctx = dom.canvas.getContext("2d");

    let state = createInitialState();
    let pulse = 0;
    let animId = null;

    function createInitialState() {
        return {
            started: false,
            playerName: "Shadow",
            day: 1,
            phaseIndex: 0,
            actedToday: false,
            gameOver: false,
            shared: {
                cash: 1400,
                health: 84,
                heat: 22,
                influence: 34,
                stealth: 28
            },
            phaseStats: {
                police: { rank: 1, caseFiles: 0, publicTrust: 46, solvedOps: 0 },
                prison: { order: 48, facility: 42, inmates: 320, contraband: 58 },
                gang: { territory: 26, crew: 18, fear: 20, rackets: 0 },
                ninja: { contracts: 0, focus: 40, reputation: 24, marks: 0 }
            },
            completedPhases: [],
            score: 0,
            log: []
        };
    }

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function randInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function formatNumber(value) {
        return Math.round(value).toLocaleString("fr-FR");
    }

    function currentPhase() {
        return PHASES[state.phaseIndex];
    }

    function deepClone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function addLog(text) {
        state.log.unshift(`[J${state.day}] ${text}`);
        state.log = state.log.slice(0, 30);
    }

    function applyShared(delta) {
        const s = state.shared;
        Object.keys(delta).forEach((key) => {
            if (Object.prototype.hasOwnProperty.call(s, key)) s[key] += delta[key];
        });
        normalizeState();
    }

    function applyPhase(phaseId, delta) {
        const target = state.phaseStats[phaseId];
        Object.keys(delta).forEach((key) => {
            if (Object.prototype.hasOwnProperty.call(target, key)) target[key] += delta[key];
        });
        normalizeState();
    }

    function normalizeState() {
        const s = state.shared;
        s.cash = clamp(s.cash, -6000, 120000);
        s.health = clamp(s.health, 0, 100);
        s.heat = clamp(s.heat, 0, 100);
        s.influence = clamp(s.influence, 0, 100);
        s.stealth = clamp(s.stealth, 0, 100);

        const p = state.phaseStats.police;
        p.rank = clamp(p.rank, 1, 12);
        p.caseFiles = clamp(p.caseFiles, 0, 80);
        p.publicTrust = clamp(p.publicTrust, 0, 100);
        p.solvedOps = clamp(p.solvedOps, 0, 200);

        const pr = state.phaseStats.prison;
        pr.order = clamp(pr.order, 0, 100);
        pr.facility = clamp(pr.facility, 0, 100);
        pr.inmates = clamp(pr.inmates, 120, 900);
        pr.contraband = clamp(pr.contraband, 0, 100);

        const g = state.phaseStats.gang;
        g.territory = clamp(g.territory, 0, 100);
        g.crew = clamp(g.crew, 0, 120);
        g.fear = clamp(g.fear, 0, 100);
        g.rackets = clamp(g.rackets, 0, 200);

        const n = state.phaseStats.ninja;
        n.contracts = clamp(n.contracts, 0, 80);
        n.focus = clamp(n.focus, 0, 100);
        n.reputation = clamp(n.reputation, 0, 100);
        n.marks = clamp(n.marks, 0, 200);
    }

    function phaseObjectivesStatus(phaseId) {
        const s = state.shared;
        const p = state.phaseStats;

        if (phaseId === "police") {
            return {
                lines: [
                    { ok: p.police.rank >= 5, text: `Rank >= 5 (actuel ${p.police.rank})` },
                    { ok: p.police.caseFiles >= 8, text: `Case files >= 8 (actuel ${p.police.caseFiles})` },
                    { ok: p.police.publicTrust >= 72, text: `Public trust >= 72 (actuel ${Math.round(p.police.publicTrust)})` }
                ]
            };
        }

        if (phaseId === "prison") {
            return {
                lines: [
                    { ok: p.prison.order >= 78, text: `Order >= 78 (actuel ${Math.round(p.prison.order)})` },
                    { ok: p.prison.facility >= 68, text: `Facility >= 68 (actuel ${Math.round(p.prison.facility)})` },
                    { ok: p.prison.contraband <= 30, text: `Contraband <= 30 (actuel ${Math.round(p.prison.contraband)})` }
                ]
            };
        }

        if (phaseId === "gang") {
            return {
                lines: [
                    { ok: p.gang.territory >= 68, text: `Territory >= 68 (actuel ${Math.round(p.gang.territory)})` },
                    { ok: p.gang.crew >= 52, text: `Crew >= 52 (actuel ${Math.round(p.gang.crew)})` },
                    { ok: p.gang.fear >= 58, text: `Fear >= 58 (actuel ${Math.round(p.gang.fear)})` }
                ]
            };
        }

        return {
            lines: [
                { ok: p.ninja.contracts >= 10, text: `Contracts >= 10 (actuel ${p.ninja.contracts})` },
                { ok: p.ninja.focus >= 76, text: `Focus >= 76 (actuel ${Math.round(p.ninja.focus)})` },
                { ok: p.ninja.reputation >= 74, text: `Reputation >= 74 (actuel ${Math.round(p.ninja.reputation)})` },
                { ok: s.stealth >= 78, text: `Stealth global >= 78 (actuel ${Math.round(s.stealth)})` }
            ]
        };
    }

    function isPhaseComplete(phaseId) {
        const lines = phaseObjectivesStatus(phaseId).lines;
        return lines.every((line) => line.ok);
    }

    function phaseActions(phaseId) {
        if (phaseId === "police") {
            return [
                {
                    id: "police_patrol",
                    title: "Patrol district",
                    desc: "Presence visible. Lower gang activity, improve trust.",
                    impact: "+trust +influence -stealth",
                    run() {
                        applyPhase("police", { publicTrust: 6 + randInt(0, 3), solvedOps: 1 });
                        applyShared({ influence: 2, stealth: -1, heat: -2, health: -1, cash: 20 });
                        addLog("Police patrol stabilise plusieurs quartiers.");
                    }
                },
                {
                    id: "police_undercover",
                    title: "Undercover bust",
                    desc: "High risk operation to capture network leaders.",
                    impact: "+case files +rank +heat -health",
                    run() {
                        applyPhase("police", { caseFiles: 2 + randInt(1, 2), rank: 1, solvedOps: 2 });
                        applyShared({ cash: 120 + randInt(0, 90), heat: 7, health: -6, influence: 1, stealth: 2 });
                        addLog("Operation undercover: reseau criminel frappe.");
                    }
                },
                {
                    id: "police_community",
                    title: "Community program",
                    desc: "Build local support and prevent radicalisation.",
                    impact: "+trust +health -cash",
                    run() {
                        applyPhase("police", { publicTrust: 8, solvedOps: 1 });
                        applyShared({ cash: -110, health: 4, influence: 3, heat: -1 });
                        addLog("Programmes de proximite lances dans 3 zones urbaines.");
                    }
                },
                {
                    id: "police_internal",
                    title: "Internal affairs audit",
                    desc: "Root out corruption inside departments.",
                    impact: "+trust +rank -influence",
                    run() {
                        applyPhase("police", { publicTrust: 5, rank: 1 });
                        applyShared({ influence: -2, heat: -3, cash: 40, stealth: 1 });
                        addLog("Audit interne: chaine de commandement assainie.");
                    }
                },
                {
                    id: "police_raid",
                    title: "Counter-gang raid",
                    desc: "Heavy tactical response on hotspots.",
                    impact: "+case files +cash +heat",
                    run() {
                        applyPhase("police", { caseFiles: 3, solvedOps: 2, publicTrust: 2 });
                        applyShared({ cash: 180, heat: 9, health: -7, influence: 1 });
                        addLog("Raid tactique: arsenal illegal saisi.");
                    }
                }
            ];
        }

        if (phaseId === "prison") {
            return [
                {
                    id: "prison_inspection",
                    title: "Cell inspection",
                    desc: "Search routine in high-risk blocks.",
                    impact: "+order -contraband +heat",
                    run() {
                        applyPhase("prison", { order: 7, contraband: -8, inmates: randInt(-4, 3) });
                        applyShared({ heat: 4, health: -2, influence: 1, cash: 35 });
                        addLog("Inspection complete: objets interdits confisques.");
                    }
                },
                {
                    id: "prison_rehab",
                    title: "Rehab wave",
                    desc: "Education and reintegration programs.",
                    impact: "+facility +order -cash",
                    run() {
                        applyPhase("prison", { facility: 8, order: 5, contraband: -3 });
                        applyShared({ cash: -150, influence: 3, health: 2, heat: -2 });
                        addLog("Rehabilitation activee dans deux ailes detentions.");
                    }
                },
                {
                    id: "prison_lockdown",
                    title: "Targeted lockdown",
                    desc: "Temporary strict control for unrest sectors.",
                    impact: "+order -health +heat",
                    run() {
                        applyPhase("prison", { order: 10, contraband: -5, facility: -2 });
                        applyShared({ heat: 6, health: -5, influence: -1, cash: -40 });
                        addLog("Lockdown de 24h impose sur le bloc C.");
                    }
                },
                {
                    id: "prison_training",
                    title: "Guard training",
                    desc: "Upgrade staff procedures and crisis response.",
                    impact: "+facility +order -cash",
                    run() {
                        applyPhase("prison", { facility: 7, order: 4, contraband: -2 });
                        applyShared({ cash: -120, influence: 2, health: -1 });
                        addLog("Formation du personnel: niveau tactique en hausse.");
                    }
                },
                {
                    id: "prison_intel",
                    title: "Smuggling sting",
                    desc: "Infiltrate internal black market channels.",
                    impact: "-contraband +cash +influence",
                    run() {
                        applyPhase("prison", { contraband: -10, order: 3 });
                        applyShared({ cash: 160, influence: 2, heat: 2, health: -2 });
                        addLog("Reseau de contrebande demantele a l'interieur.");
                    }
                }
            ];
        }

        if (phaseId === "gang") {
            return [
                {
                    id: "gang_recruit",
                    title: "Recruit street crew",
                    desc: "Expand local manpower for turf pressure.",
                    impact: "+crew +territory +heat",
                    run() {
                        applyPhase("gang", { crew: 7, territory: 5, fear: 3 });
                        applyShared({ cash: -120, heat: 7, influence: 1, health: -2 });
                        addLog("Nouveaux soldats recrutes dans les blocs sud.");
                    }
                },
                {
                    id: "gang_extort",
                    title: "Extortion network",
                    desc: "Collect protection fees from local businesses.",
                    impact: "+cash +fear +heat",
                    run() {
                        applyPhase("gang", { fear: 7, rackets: 1, territory: 2 });
                        applyShared({ cash: 260, heat: 9, influence: 1, stealth: -2 });
                        addLog("Systeme de racket actif sur 4 intersections.");
                    }
                },
                {
                    id: "gang_turfwar",
                    title: "Turf war",
                    desc: "High volatility strike for district control.",
                    impact: "+territory +fear -health +heat",
                    run() {
                        applyPhase("gang", { territory: 10, fear: 8, crew: -2, rackets: 1 });
                        applyShared({ health: -8, heat: 12, cash: 120, stealth: -3 });
                        addLog("Conflit de territoire: deux zones basculent.");
                    }
                },
                {
                    id: "gang_laundry",
                    title: "Launder operation",
                    desc: "Clean dirty money through legal fronts.",
                    impact: "+cash -heat +influence",
                    run() {
                        applyPhase("gang", { rackets: 1, fear: 2 });
                        applyShared({ cash: 210, heat: -4, influence: 4, stealth: 2 });
                        addLog("Blanchiment reussi via un reseau commercial.");
                    }
                },
                {
                    id: "gang_bribe",
                    title: "Bribe officials",
                    desc: "Temporary political shield.",
                    impact: "+influence -heat -cash",
                    run() {
                        applyPhase("gang", { territory: 3, crew: 2 });
                        applyShared({ cash: -180, heat: -8, influence: 8, stealth: 1 });
                        addLog("Fonctionnaires achetes: controle judiciaire ralenti.");
                    }
                }
            ];
        }

        return [
            {
                id: "ninja_recon",
                title: "Recon mission",
                desc: "Observe routes and predict target movement.",
                impact: "+stealth +focus",
                run() {
                    applyPhase("ninja", { focus: 7, marks: 1 });
                    applyShared({ stealth: 6, health: -1, heat: -2, cash: 50 });
                    addLog("Recon silencieuse: itineraire de cibles valide.");
                }
            },
            {
                id: "ninja_takedown",
                title: "Silent takedown",
                desc: "Direct elimination with low signature.",
                impact: "+contracts +reputation -health",
                run() {
                    applyPhase("ninja", { contracts: 2, reputation: 6, marks: 2, focus: -2 });
                    applyShared({ cash: 320, health: -5, stealth: 2, heat: -1 });
                    addLog("Execution silencieuse confirmee sans alarme.");
                }
            },
            {
                id: "ninja_training",
                title: "Shadow training",
                desc: "Improve stamina, precision, and reflexes.",
                impact: "+focus +stealth +health",
                run() {
                    applyPhase("ninja", { focus: 9, reputation: 1 });
                    applyShared({ health: 6, stealth: 4, cash: -90, heat: -2 });
                    addLog("Entrainement nocturne: discipline optimisee.");
                }
            },
            {
                id: "ninja_contract",
                title: "High value contract",
                desc: "Difficult target with heavy payout.",
                impact: "+cash +contracts +reputation +heat",
                run() {
                    applyPhase("ninja", { contracts: 3, reputation: 7, marks: 3, focus: -3 });
                    applyShared({ cash: 540, health: -7, stealth: -1, heat: 3 });
                    addLog("Contrat premium execute: prime exceptionnelle recue.");
                }
            },
            {
                id: "ninja_vanish",
                title: "Disappear route",
                desc: "Reset traces, lower pressure, recover tempo.",
                impact: "-heat +stealth +focus",
                run() {
                    applyPhase("ninja", { focus: 5, reputation: 2 });
                    applyShared({ heat: -10, stealth: 7, health: 2, cash: -70 });
                    addLog("Disparition tactique: aucune trace exploitable.");
                }
            }
        ];
    }

    function phasePassiveTick() {
        const pid = currentPhase().id;
        const s = state.shared;

        if (pid === "police") {
            applyPhase("police", { publicTrust: -1 + randInt(-2, 2), caseFiles: randInt(0, 1) });
            applyShared({ heat: 1 + randInt(-1, 2), cash: 70, health: -1 });
        } else if (pid === "prison") {
            applyPhase("prison", { contraband: 2 + randInt(-1, 3), order: -2 + randInt(-2, 2), inmates: randInt(-8, 12) });
            applyShared({ cash: 90, heat: 2, health: -1, influence: 1 });
        } else if (pid === "gang") {
            const turfBonus = Math.round(state.phaseStats.gang.territory / 16);
            applyPhase("gang", { rackets: 1, fear: -1 + randInt(-1, 2), crew: randInt(-2, 3) });
            applyShared({ cash: 110 + turfBonus * 12, heat: 3 + randInt(0, 3), stealth: -1, health: -2 });
        } else {
            applyPhase("ninja", { focus: -2 + randInt(-2, 2), reputation: 1 + randInt(-1, 2), marks: randInt(0, 1) });
            applyShared({ stealth: -1 + randInt(-1, 2), heat: -2 + randInt(-2, 2), health: -1, cash: 70 });
        }

        randomDailyEvent(pid);
        computeScore();
    }

    function randomDailyEvent(pid) {
        const roll = Math.random();

        if (pid === "police") {
            if (roll < 0.22) {
                applyPhase("police", { publicTrust: 5, solvedOps: 1 });
                applyShared({ influence: 2, cash: 60 });
                addLog("Media positive: operation de police saluee.");
            } else if (roll < 0.35) {
                applyShared({ health: -4, heat: 4 });
                addLog("Emeute locale: intervention d'urgence.");
            }
            return;
        }

        if (pid === "prison") {
            if (roll < 0.2) {
                applyPhase("prison", { order: 7, contraband: -6 });
                addLog("Inspection ministerielle: niveau de securite valide.");
            } else if (roll < 0.34) {
                applyPhase("prison", { order: -8, contraband: 8, inmates: -10 });
                applyShared({ heat: 6, health: -3 });
                addLog("Tentative d'evasion: bloc nord destabilise.");
            }
            return;
        }

        if (pid === "gang") {
            if (roll < 0.2) {
                applyPhase("gang", { territory: 6, fear: 5 });
                applyShared({ cash: 180, heat: 4 });
                addLog("Fusion de gangs: expansion rapide du territoire.");
            } else if (roll < 0.35) {
                applyPhase("gang", { crew: -4, territory: -3 });
                applyShared({ heat: 7, health: -4 });
                addLog("Descente rivale: pertes sur le front est.");
            }
            return;
        }

        if (roll < 0.22) {
            applyPhase("ninja", { contracts: 1, reputation: 4 });
            applyShared({ cash: 220, stealth: 3, heat: -2 });
            addLog("Contrat surprise: cible prioritaire eliminee.");
        } else if (roll < 0.34) {
            applyPhase("ninja", { focus: -5 });
            applyShared({ health: -5, heat: 4, stealth: -3 });
            addLog("Traque active: extraction difficile apres mission.");
        }
    }

    function computeScore() {
        const s = state.shared;
        const p = state.phaseStats;

        const score = (
            state.day * 24 +
            s.cash / 8 +
            s.health * 14 +
            (100 - s.heat) * 11 +
            s.influence * 8 +
            s.stealth * 9 +
            p.police.rank * 120 + p.police.caseFiles * 44 + p.police.publicTrust * 8 +
            p.prison.order * 8 + p.prison.facility * 7 + (100 - p.prison.contraband) * 6 +
            p.gang.territory * 9 + p.gang.crew * 5 + p.gang.fear * 6 +
            p.ninja.contracts * 130 + p.ninja.focus * 6 + p.ninja.reputation * 8 +
            state.completedPhases.length * 900
        );

        state.score = Math.max(0, Math.round(score));
    }

    function cityAlertLabel() {
        const h = state.shared.heat;
        if (h < 20) return "Alerte: Tres basse";
        if (h < 40) return "Alerte: Stable";
        if (h < 60) return "Alerte: Sous tension";
        if (h < 80) return "Alerte: Critique";
        return "Alerte: Eruption";
    }

    function renderPhaseTrack() {
        dom.phaseTrack.innerHTML = PHASES.map((phase, index) => {
            const done = state.completedPhases.includes(phase.id);
            const active = index === state.phaseIndex;
            const cls = `track-step${done ? " done" : ""}${active ? " active" : ""}`;
            return `
                <div class="${cls}">
                    <strong>${phase.label}</strong><br>
                    <small>${done ? "Complete" : active ? "Active" : "Locked"}</small>
                </div>
            `;
        }).join("");
    }

    function renderTopBar() {
        const phase = currentPhase();
        dom.phaseTitle.textContent = phase.label;
        dom.subTitle.textContent = `Jour ${state.day} - Operateur: ${state.playerName}`;

        dom.statCash.textContent = formatNumber(state.shared.cash);
        dom.statHealth.textContent = `${Math.round(state.shared.health)}%`;
        dom.statHeat.textContent = Math.round(state.shared.heat);
        dom.statInfluence.textContent = Math.round(state.shared.influence);
        dom.statStealth.textContent = `${Math.round(state.shared.stealth)}%`;
        dom.statScore.textContent = formatNumber(state.score);

        dom.cityAlert.textContent = cityAlertLabel();
    }

    function renderActionCards() {
        const actions = phaseActions(currentPhase().id);
        dom.actionsList.innerHTML = actions.map((action) => `
            <article class="action-card">
                <h4>${action.title}</h4>
                <p>${action.desc}</p>
                <div class="impact">${action.impact}</div>
                <button class="action-btn" data-action-id="${action.id}" ${state.actedToday || state.gameOver ? "disabled" : ""}>Executer</button>
            </article>
        `).join("");

        dom.actionsList.querySelectorAll("[data-action-id]").forEach((button) => {
            button.addEventListener("click", () => runAction(button.dataset.actionId));
        });

        dom.actionState.textContent = state.actedToday ? "Action utilisee" : "Action disponible";
    }

    function renderObjective() {
        const phase = currentPhase();
        const status = phaseObjectivesStatus(phase.id);
        const done = status.lines.every((line) => line.ok);

        dom.objectiveState.textContent = done ? "Objectif atteint" : "En cours";
        dom.objectiveText.innerHTML = status.lines.map((line) => `
            <div class="phase-line">
                <span>${line.ok ? "[OK]" : "[ ]"} ${line.text}</span>
            </div>
        `).join("");

        dom.nextPhaseBtn.classList.toggle("hidden", !done || state.phaseIndex >= PHASES.length - 1 || state.gameOver);
    }

    function renderPhaseStats() {
        const pid = currentPhase().id;
        const p = state.phaseStats[pid];

        if (pid === "police") {
            dom.phaseStats.innerHTML = `
                <div class="phase-line"><span>Rank</span><strong>${p.rank}</strong></div>
                <div class="phase-line"><span>Case files</span><strong>${p.caseFiles}</strong></div>
                <div class="phase-line"><span>Public trust</span><strong>${Math.round(p.publicTrust)}</strong></div>
                <div class="phase-line"><span>Solved ops</span><strong>${p.solvedOps}</strong></div>
            `;
            return;
        }

        if (pid === "prison") {
            dom.phaseStats.innerHTML = `
                <div class="phase-line"><span>Order</span><strong>${Math.round(p.order)}</strong></div>
                <div class="phase-line"><span>Facility</span><strong>${Math.round(p.facility)}</strong></div>
                <div class="phase-line"><span>Inmates</span><strong>${Math.round(p.inmates)}</strong></div>
                <div class="phase-line"><span>Contraband</span><strong>${Math.round(p.contraband)}</strong></div>
            `;
            return;
        }

        if (pid === "gang") {
            dom.phaseStats.innerHTML = `
                <div class="phase-line"><span>Territory</span><strong>${Math.round(p.territory)}</strong></div>
                <div class="phase-line"><span>Crew</span><strong>${Math.round(p.crew)}</strong></div>
                <div class="phase-line"><span>Fear</span><strong>${Math.round(p.fear)}</strong></div>
                <div class="phase-line"><span>Rackets</span><strong>${p.rackets}</strong></div>
            `;
            return;
        }

        dom.phaseStats.innerHTML = `
            <div class="phase-line"><span>Contracts</span><strong>${p.contracts}</strong></div>
            <div class="phase-line"><span>Focus</span><strong>${Math.round(p.focus)}</strong></div>
            <div class="phase-line"><span>Reputation</span><strong>${Math.round(p.reputation)}</strong></div>
            <div class="phase-line"><span>Marks</span><strong>${p.marks}</strong></div>
        `;
    }

    function renderLog() {
        if (!state.log.length) {
            dom.logList.innerHTML = "<li>Debut d'operation.</li>";
            return;
        }
        dom.logList.innerHTML = state.log.map((line) => `<li>${line}</li>`).join("");
    }

    function renderAll() {
        if (!state.started) return;
        renderTopBar();
        renderPhaseTrack();
        renderActionCards();
        renderObjective();
        renderPhaseStats();
        renderLog();
        drawCityScene();
    }

    function runAction(actionId) {
        if (state.actedToday || state.gameOver) return;
        const action = phaseActions(currentPhase().id).find((entry) => entry.id === actionId);
        if (!action) return;

        action.run();
        state.actedToday = true;
        computeScore();
        evaluateFailure();
        renderAll();
    }

    function endDay() {
        if (state.gameOver) return;

        if (!state.actedToday) {
            applyShared({ health: -2, influence: -2, heat: 2, cash: -80 });
            addLog("Jour valide sans action majeure: penalites operationnelles.");
        }

        phasePassiveTick();
        state.day += 1;
        state.actedToday = false;
        normalizeState();

        checkPhaseCompletion();
        evaluateFailure();
        renderAll();
    }

    function checkPhaseCompletion() {
        const phase = currentPhase();
        if (!isPhaseComplete(phase.id)) return;

        if (!state.completedPhases.includes(phase.id)) {
            state.completedPhases.push(phase.id);
            addLog(`${phase.label} complete.`);
        }

        if (phase.id === "ninja") {
            showFinalWin();
        }
    }

    function nextPhase() {
        if (state.phaseIndex >= PHASES.length - 1) return;

        const phase = currentPhase();
        if (!isPhaseComplete(phase.id)) return;

        state.phaseIndex += 1;
        state.actedToday = false;
        addLog(`Transition vers ${currentPhase().label}.`);

        const next = currentPhase().id;
        if (next === "prison") {
            applyShared({ influence: 4, stealth: 2, cash: 300 });
            applyPhase("prison", { order: 6, facility: 6, contraband: -4 });
        } else if (next === "gang") {
            applyShared({ influence: 5, heat: 6, cash: 700, stealth: 5 });
            applyPhase("gang", { crew: 12, territory: 10, fear: 8 });
        } else if (next === "ninja") {
            applyShared({ stealth: 12, heat: -6, health: 8, cash: 900 });
            applyPhase("ninja", { focus: 10, reputation: 8, contracts: 1 });
        }

        normalizeState();
        renderAll();
    }

    function evaluateFailure() {
        if (state.gameOver) return;

        if (state.shared.health <= 0) {
            showGameOver("Mission echouee", "Tu es hors service. Le cycle operationnel s'arrete.");
            return;
        }

        if (state.shared.heat >= 100) {
            showGameOver("Ville en etat de siege", "La pression est trop forte. Toutes les cellules tombent.");
            return;
        }

        if (state.shared.cash <= -3000) {
            showGameOver("Effondrement financier", "Aucun reseau ne peut operer en deficit extreme.");
        }
    }

    function showGameOver(title, text) {
        state.gameOver = true;
        dom.modalTitle.textContent = title;
        dom.modalText.textContent = `${text} Score final: ${formatNumber(state.score)}.`;
        dom.modal.classList.remove("hidden");
        dom.modal.setAttribute("aria-hidden", "false");
        reportScore(state.score);
        renderAll();
    }

    function showFinalWin() {
        state.gameOver = true;
        computeScore();
        dom.modalTitle.textContent = "Urban Shadows complete";
        dom.modalText.textContent = `Les 4 phases sont completees. Score final: ${formatNumber(state.score)}.`;
        dom.modal.classList.remove("hidden");
        dom.modal.setAttribute("aria-hidden", "false");
        reportScore(state.score);
        renderAll();
    }

    function closeModal() {
        dom.modal.classList.add("hidden");
        dom.modal.setAttribute("aria-hidden", "true");
    }

    function reportScore(score) {
        const payload = { type: "gameScore", gameId: GAME_ID, score };
        try {
            if (window.opener && window.opener !== window) {
                window.opener.postMessage(payload, window.location.origin);
            }
        } catch (_) {}
        try {
            if (window.parent && window.parent !== window) {
                window.parent.postMessage(payload, window.location.origin);
            }
        } catch (_) {}
    }

    function drawCityScene() {
        const w = dom.canvas.width;
        const h = dom.canvas.height;
        const pid = currentPhase().id;

        const themes = {
            police: ["#0f2f48", "#0b1a27"],
            prison: ["#39414a", "#1f252b"],
            gang: ["#4a1616", "#220c0c"],
            ninja: ["#221038", "#0b0913"]
        };

        const palette = themes[pid] || themes.police;

        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, palette[0]);
        grad.addColorStop(1, palette[1]);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        drawGrid(w, h);
        drawBuildings(w, h, pid);
        drawRoutes(w, h, pid);
        drawHotspots(w, h, pid);
        drawHeaderOverlay(pid);
    }

    function drawGrid(w, h) {
        ctx.strokeStyle = "rgba(255,255,255,0.06)";
        ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        for (let y = 0; y < h; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }
    }

    function drawBuildings(w, h, pid) {
        const count = pid === "gang" ? 22 : pid === "prison" ? 16 : 20;
        for (let i = 0; i < count; i++) {
            const x = 20 + (i * 43) % (w - 80);
            const y = 80 + ((i * 67) % (h - 160));
            const bw = 22 + (i % 3) * 8;
            const bh = 30 + (i % 4) * 9;
            ctx.fillStyle = `rgba(255,255,255,${0.06 + (i % 4) * 0.02})`;
            ctx.fillRect(x, y, bw, bh);
        }
    }

    function drawRoutes(w, h, pid) {
        const colors = {
            police: "rgba(61,165,255,0.52)",
            prison: "rgba(170,180,190,0.52)",
            gang: "rgba(228,85,85,0.52)",
            ninja: "rgba(176,77,255,0.58)"
        };

        ctx.strokeStyle = colors[pid] || colors.police;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(90, 320);
        ctx.lineTo(210, 260);
        ctx.lineTo(350, 290);
        ctx.lineTo(510, 230);
        ctx.lineTo(700, 240);
        ctx.lineTo(780, 190);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(120, 120);
        ctx.lineTo(260, 160);
        ctx.lineTo(420, 130);
        ctx.lineTo(620, 160);
        ctx.lineTo(760, 130);
        ctx.stroke();
    }

    function drawHotspots(w, h, pid) {
        pulse += 0.03;
        const base = [
            { x: 140, y: 140 },
            { x: 260, y: 280 },
            { x: 420, y: 200 },
            { x: 620, y: 260 },
            { x: 760, y: 150 }
        ];

        const color = pid === "police" ? "#3da5ff" : pid === "prison" ? "#9aa3ad" : pid === "gang" ? "#e45555" : "#b04dff";

        base.forEach((point, i) => {
            const r = 8 + Math.sin(pulse + i) * 3;
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.65;
            ctx.beginPath();
            ctx.arc(point.x, point.y, r, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = 0.22;
            ctx.beginPath();
            ctx.arc(point.x, point.y, r + 11 + Math.sin(pulse + i * 0.4) * 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        });

        const markerX = 120 + ((state.day * 11) % (w - 180));
        const markerY = 90 + ((state.day * 7) % (h - 140));
        ctx.fillStyle = "#ffd36b";
        ctx.beginPath();
        ctx.arc(markerX, markerY, 6, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawHeaderOverlay(pid) {
        const labels = {
            police: "POLICE GRID",
            prison: "PRISON CONTROL",
            gang: "GANG NETWORK",
            ninja: "NINJA SHADOW"
        };

        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(10, 10, 220, 32);
        ctx.fillStyle = "#f0f5fa";
        ctx.font = "700 16px 'Space Grotesk', sans-serif";
        ctx.fillText(labels[pid] || labels.police, 18, 31);
    }

    function saveGame() {
        if (!state.started) return;
        localStorage.setItem(SAVE_KEY, JSON.stringify({ version: 1, state }));
        addLog("Sauvegarde locale terminee.");
        renderLog();
    }

    function loadGame() {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) {
            alert("Aucune sauvegarde disponible.");
            return;
        }

        try {
            const parsed = JSON.parse(raw);
            if (!parsed || !parsed.state) throw new Error("Invalid save");
            state = deepClone(parsed.state);
            state.started = true;
            state.gameOver = false;
            closeModal();
            normalizeState();
            computeScore();

            dom.startScreen.classList.add("hidden");
            dom.gameScreen.classList.remove("hidden");
            renderAll();
        } catch (error) {
            console.error(error);
            alert("Sauvegarde invalide.");
        }
    }

    function startGame() {
        const name = String(dom.playerName.value || "").trim();
        state = createInitialState();
        state.started = true;
        state.playerName = name || "Shadow";
        addLog(`Operation initialisee pour ${state.playerName}.`);
        addLog(`Phase active: ${currentPhase().label}.`);

        computeScore();
        dom.startScreen.classList.add("hidden");
        dom.gameScreen.classList.remove("hidden");
        renderAll();
    }

    function restartToMenu() {
        closeModal();
        state = createInitialState();
        dom.playerName.value = "";
        dom.startScreen.classList.remove("hidden");
        dom.gameScreen.classList.add("hidden");
    }

    function bindEvents() {
        dom.startBtn.addEventListener("click", startGame);
        dom.endDayBtn.addEventListener("click", endDay);
        dom.saveBtn.addEventListener("click", saveGame);
        dom.loadBtn.addEventListener("click", loadGame);
        dom.nextPhaseBtn.addEventListener("click", nextPhase);
        dom.restartBtn.addEventListener("click", restartToMenu);

        dom.canvas.addEventListener("pointerdown", () => {
            if (!state.started || state.gameOver) return;
            const pid = currentPhase().id;
            if (pid === "ninja") {
                applyShared({ stealth: 1, heat: -1 });
            } else if (pid === "gang") {
                applyShared({ heat: 1, influence: 1 });
            } else if (pid === "police") {
                applyShared({ influence: 1, heat: -1 });
            } else {
                applyShared({ influence: 1 });
            }
            computeScore();
            renderAll();
        });
    }

    function loop() {
        if (state.started) drawCityScene();
        animId = requestAnimationFrame(loop);
    }

    function init() {
        bindEvents();
        loop();
    }

    init();
})();
