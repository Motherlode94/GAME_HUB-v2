(function () {
    "use strict";

    const HUB_GAME_ID = 14;
    const MAX_DAYS = 30;

    const PRICING = {
        low: { label: "Populaire", ticket: 170, demandShift: 0.22, repShift: -1 },
        standard: { label: "Standard", ticket: 245, demandShift: 0, repShift: 0 },
        premium: { label: "Premium", ticket: 340, demandShift: -0.16, repShift: 1 }
    };

    const ACTIONS = {
        recruit: {
            label: "Recrutement",
            cost: 430,
            apply(state) {
                state.staff += 1;
                state.morale -= 1;
                state.compliance -= 1;
                state.logs.unshift("Nouveau recrutement confirme.");
            }
        },
        renovate: {
            label: "Renovation",
            cost: 980,
            apply(state) {
                state.rooms += 1;
                state.reputation += 2;
                state.logs.unshift("Une chambre supplementaire est operationnelle.");
            }
        },
        marketing: {
            label: "Marketing",
            cost: 360,
            apply(state) {
                state.marketing += 14;
                state.reputation += 1;
                state.logs.unshift("Campagne marketing activee.");
            }
        },
        wellness: {
            label: "Bien-etre equipe",
            cost: 290,
            apply(state) {
                state.morale += 9;
                state.compliance += 3;
                state.logs.unshift("Programme bien-etre lance pour le personnel.");
            }
        },
        compliance: {
            label: "Conformite",
            cost: 260,
            apply(state) {
                state.compliance += 11;
                state.reputation += 1;
                state.logs.unshift("Audit interne valide, dossiers conformes.");
            }
        },
        securityHire: {
            label: "Securite",
            cost: 340,
            apply(state) {
                state.securityAgents += 1;
                state.security += 9;
                state.logs.unshift("Agent de securite additionnel engage.");
            }
        }
    };

    const dom = {
        dayLabel: document.getElementById("day-label"),
        statusLabel: document.getElementById("status-label"),
        cash: document.getElementById("cash"),
        reputation: document.getElementById("reputation"),
        compliance: document.getElementById("compliance"),
        morale: document.getElementById("morale"),
        security: document.getElementById("security"),
        served: document.getElementById("served"),
        rooms: document.getElementById("rooms"),
        staff: document.getElementById("staff"),
        riskBoard: document.getElementById("risk-board"),
        actionButtons: Array.from(document.querySelectorAll("[data-action]")),
        priceTier: document.getElementById("price-tier"),
        nextDay: document.getElementById("next-day"),
        report: document.getElementById("night-report"),
        logList: document.getElementById("log-list"),
        endModal: document.getElementById("end-modal"),
        endTitle: document.getElementById("end-title"),
        endText: document.getElementById("end-text"),
        restartBtn: document.getElementById("restart-btn")
    };

    let state = makeInitialState();

    function makeInitialState() {
        return {
            day: 1,
            cash: 8200,
            reputation: 52,
            compliance: 63,
            morale: 66,
            security: 54,
            rooms: 4,
            staff: 6,
            securityAgents: 1,
            marketing: 0,
            priceTier: "standard",
            servedClients: 0,
            totalClients: 0,
            incidents: 0,
            gameOver: false,
            logs: ["Ouverture de l'etablissement. Objectif: tenir 30 nuits sans effondrement."]
        };
    }

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function rnd(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function fmt(value) {
        return Math.round(value).toLocaleString("fr-FR");
    }

    function scoreValue() {
        const quality = (state.reputation * 95) + (state.compliance * 88) + (state.morale * 72) + (state.security * 80);
        const assets = (state.rooms * 230) + (state.staff * 130) + (state.day * 250);
        const penalties = (state.incidents * 320);
        return Math.max(0, Math.round(state.cash + quality + assets - penalties));
    }

    function postScore(score) {
        const payload = { type: "gameScore", gameId: HUB_GAME_ID, score };

        try {
            if (window.parent && window.parent !== window) {
                window.parent.postMessage(payload, window.location.origin);
            }
        } catch (_) {}

        try {
            if (window.opener && window.opener !== window) {
                window.opener.postMessage(payload, window.location.origin);
            }
        } catch (_) {}
    }

    function setStatusText() {
        if (state.gameOver) {
            dom.statusLabel.textContent = "Ferme";
            return;
        }
        if (state.compliance < 34) {
            dom.statusLabel.textContent = "Sous risque";
            return;
        }
        if (state.cash < 1200) {
            dom.statusLabel.textContent = "Tension caisse";
            return;
        }
        dom.statusLabel.textContent = "Ouvert";
    }

    function renderRisks() {
        const economic = clamp(58 - (state.cash / 280) + (state.day * 0.5), 0, 100);
        const social = clamp(100 - ((state.morale * 0.55) + (state.reputation * 0.45)), 0, 100);
        const legal = clamp(98 - (state.compliance * 0.95), 0, 100);
        const security = clamp(92 - ((state.security * 0.78) + state.securityAgents * 4), 0, 100);

        const rows = [
            { label: "Eco", value: economic },
            { label: "Social", value: social },
            { label: "Legal", value: legal },
            { label: "Secu", value: security }
        ];

        dom.riskBoard.innerHTML = rows.map((row) => `
            <div class="risk-row">
                <span>${row.label}</span>
                <div class="risk-track"><i style="width:${Math.round(row.value)}%"></i></div>
                <span>${Math.round(row.value)}</span>
            </div>
        `).join("");
    }

    function renderReport(data) {
        if (!data) {
            dom.report.innerHTML = "<p>Prepare ton etablissement puis clique sur <strong>Lancer la nuit</strong>.</p>";
            return;
        }

        dom.report.innerHTML = `
            <p><span class="k">Demande:</span> ${fmt(data.demand)} clients</p>
            <p><span class="k">Servis:</span> ${fmt(data.served)} | Refuses: ${fmt(data.refused)}</p>
            <p><span class="k">Recettes:</span> +${fmt(data.revenue)} | Depenses: -${fmt(data.costs)}</p>
            <p><span class="k">Resultat net:</span> ${data.net >= 0 ? "+" : ""}${fmt(data.net)}</p>
            <p><span class="k">Evenement:</span> ${data.eventText}</p>
        `;
    }

    function render() {
        dom.dayLabel.textContent = `Jour ${Math.min(state.day, MAX_DAYS)} / ${MAX_DAYS}`;
        setStatusText();
        dom.cash.textContent = `${fmt(state.cash)} c`;
        dom.reputation.textContent = `${Math.round(state.reputation)}%`;
        dom.compliance.textContent = `${Math.round(state.compliance)}%`;
        dom.morale.textContent = `${Math.round(state.morale)}%`;
        dom.security.textContent = `${Math.round(state.security)}%`;
        dom.served.textContent = fmt(state.totalClients);
        dom.rooms.textContent = fmt(state.rooms);
        dom.staff.textContent = fmt(state.staff);
        dom.priceTier.value = state.priceTier;

        dom.logList.innerHTML = state.logs.slice(0, 20).map((line) => `<li>${line}</li>`).join("");
        renderRisks();

        const disabled = state.gameOver;
        dom.actionButtons.forEach((button) => {
            button.disabled = disabled;
        });
        dom.nextDay.disabled = disabled;
        dom.priceTier.disabled = disabled;
    }

    function processEvent(baseData) {
        const roll = Math.random();
        let eventText = "Nuit stable sans incident majeur.";

        if (roll < 0.14) {
            const fine = rnd(450, 1600);
            state.cash -= fine;
            state.compliance -= rnd(3, 8);
            state.reputation -= rnd(1, 4);
            state.incidents += 1;
            eventText = `Controle municipal surprise: amende de ${fmt(fine)} credits.`;
        } else if (roll < 0.26) {
            const bonus = rnd(220, 820);
            state.cash += bonus;
            state.reputation += rnd(1, 4);
            eventText = `Avis positif viral sur reseaux: +${fmt(bonus)} credits.`;
        } else if (roll < 0.35) {
            state.security -= rnd(3, 7);
            state.morale -= rnd(2, 6);
            state.incidents += 1;
            eventText = "Incident de quartier: tension a la sortie, equipe secouee.";
        } else if (roll < 0.43) {
            state.morale += rnd(2, 6);
            state.compliance += rnd(1, 5);
            eventText = "Inspection interne bien geree, procedure staff validee.";
        }

        baseData.eventText = eventText;
    }

    function simulateNight() {
        const pricing = PRICING[state.priceTier];
        const demandBase = 17 + (state.day * 0.9) + (state.reputation * 0.28) + (state.marketing * 0.55) + rnd(-6, 8);
        const demand = Math.max(0, Math.round(demandBase * (1 + pricing.demandShift)));

        const roomCapacity = state.rooms * 3;
        const staffCapacity = Math.floor(state.staff * (1.1 + state.morale / 150));
        const served = clamp(Math.min(demand, roomCapacity, staffCapacity), 0, 400);
        const refused = Math.max(0, demand - served);

        const priceMultiplier = 0.82 + (state.reputation / 250);
        const revenue = Math.round((served * pricing.ticket * priceMultiplier) + (served * rnd(10, 35)));

        const wages = state.staff * 72;
        const fixed = (state.rooms * 30) + (state.securityAgents * 96);
        const maintenance = Math.round(Math.max(0, (100 - state.compliance)) * 3.4);
        const costs = wages + fixed + maintenance + rnd(60, 200);
        const net = revenue - costs;

        state.cash += net;
        state.totalClients += served;
        state.servedClients = served;

        state.reputation += ((served > refused ? 1.2 : -1.6) + pricing.repShift) - (state.incidents > 0 ? 0.3 : 0);
        state.morale += (served / Math.max(1, state.staff) < 2.6 ? 1.8 : -2.4) - (state.security < 40 ? 1.2 : 0);
        state.compliance += -1.3 + (state.securityAgents * 0.5);
        state.security += -0.9 + (state.securityAgents * 0.6);

        const reportData = { demand, served, refused, revenue, costs, net, eventText: "" };
        processEvent(reportData);

        state.marketing = Math.max(0, state.marketing - 5);

        state.reputation = clamp(state.reputation, 0, 100);
        state.compliance = clamp(state.compliance, 0, 100);
        state.morale = clamp(state.morale, 0, 100);
        state.security = clamp(state.security, 0, 100);

        if (state.cash <= -3200) {
            finishGame("Faillite", "La caisse est en negatif critique. L'etablissement ferme par insolvabilite.");
        } else if (state.compliance <= 8) {
            finishGame("Fermeture administrative", "La conformite est trop basse. Licence suspendue.");
        } else if (state.morale <= 6) {
            finishGame("Greve generale", "Le moral equipe s'effondre. Activite stoppee.");
        } else if (state.day >= MAX_DAYS) {
            finishGame("Mandat termine", "Tu as tenu 30 nuits d'exploitation.");
        } else {
            state.day += 1;
        }

        state.logs.unshift(`Nuit ${Math.min(state.day, MAX_DAYS)}: net ${net >= 0 ? "+" : ""}${fmt(net)} credits.`);
        renderReport(reportData);
    }

    function triggerAction(actionId) {
        if (state.gameOver) return;
        const action = ACTIONS[actionId];
        if (!action) return;

        if (state.cash < action.cost) {
            state.logs.unshift(`Action impossible (${action.label}): caisse insuffisante.`);
            render();
            return;
        }

        state.cash -= action.cost;
        action.apply(state);

        state.reputation = clamp(state.reputation, 0, 100);
        state.compliance = clamp(state.compliance, 0, 100);
        state.morale = clamp(state.morale, 0, 100);
        state.security = clamp(state.security, 0, 100);
        render();
    }

    function finishGame(title, text) {
        if (state.gameOver) return;
        state.gameOver = true;
        const score = scoreValue();

        dom.endTitle.textContent = title;
        dom.endText.textContent = `${text} Score final: ${fmt(score)}.`;
        dom.endModal.classList.remove("hidden");
        dom.endModal.setAttribute("aria-hidden", "false");

        postScore(score);
    }

    function restartGame() {
        state = makeInitialState();
        dom.endModal.classList.add("hidden");
        dom.endModal.setAttribute("aria-hidden", "true");
        renderReport(null);
        render();
    }

    function bind() {
        dom.actionButtons.forEach((button) => {
            button.addEventListener("click", () => triggerAction(button.dataset.action));
        });

        dom.priceTier.addEventListener("change", () => {
            if (state.gameOver) return;
            state.priceTier = dom.priceTier.value;
            const pricing = PRICING[state.priceTier];
            state.logs.unshift(`Tarification active: ${pricing.label}.`);
            render();
        });

        dom.nextDay.addEventListener("click", () => {
            if (state.gameOver) return;
            simulateNight();
            render();
        });

        dom.restartBtn.addEventListener("click", restartGame);
    }

    function init() {
        bind();
        renderReport(null);
        render();
    }

    init();
})();
