(function () {
    "use strict";

    const HUB_GAME_ID = 15;
    const MAX_DAYS = 35;

    const PRICING = {
        reach: { label: "Reach massif", ticket: 190, demandMult: 1.2, brandShift: -1 },
        balanced: { label: "Equilibre", ticket: 265, demandMult: 1.0, brandShift: 0 },
        premium: { label: "Premium", ticket: 360, demandMult: 0.83, brandShift: 2 }
    };

    const ACTIONS = {
        talent: {
            label: "Scout talent",
            cost: 470,
            apply(state) {
                state.team += 1;
                state.brand += 2;
                state.morale -= 1;
                log(state, "Nouveau talent signe pour le studio.");
            }
        },
        shoot: {
            label: "Tourner production",
            cost: 520,
            apply(state) {
                const qualityGain = 1 + Math.round(state.studio * 0.4) + Math.round(state.team / 4);
                state.catalog += qualityGain;
                state.audience += 1200 + Math.round(qualityGain * 260);
                state.morale -= 2;
                log(state, `Production finalisee (+${qualityGain} catalogue).`);
            }
        },
        marketing: {
            label: "Push marketing",
            cost: 360,
            apply(state) {
                state.promo += 18;
                state.brand += 2;
                log(state, "Campagne marketing agressive deployee.");
            }
        },
        legal: {
            label: "Audit legal",
            cost: 310,
            apply(state) {
                state.compliance += 10;
                state.brand += 1;
                log(state, "Dossiers juridiques et compliance renforces.");
            }
        },
        wellness: {
            label: "Recuperation equipe",
            cost: 280,
            apply(state) {
                state.morale += 10;
                state.compliance += 2;
                log(state, "Semaine de recuperation accordee a l'equipe.");
            }
        },
        upgrade: {
            label: "Upgrade studio",
            cost: 980,
            apply(state) {
                state.studio += 1;
                state.brand += 2;
                state.compliance += 1;
                log(state, "Plateau modernise, capacite de prod en hausse.");
            }
        }
    };

    const dom = {
        dayLabel: document.getElementById("day-label"),
        phaseLabel: document.getElementById("phase-label"),
        cash: document.getElementById("cash"),
        brand: document.getElementById("brand"),
        compliance: document.getElementById("compliance"),
        morale: document.getElementById("morale"),
        audience: document.getElementById("audience"),
        catalog: document.getElementById("catalog"),
        team: document.getElementById("team"),
        studio: document.getElementById("studio"),
        riskBoard: document.getElementById("risk-board"),
        pricingSelect: document.getElementById("pricing-select"),
        actionButtons: Array.from(document.querySelectorAll("[data-action]")),
        nextDayBtn: document.getElementById("next-day-btn"),
        report: document.getElementById("day-report"),
        logList: document.getElementById("log-list"),
        endModal: document.getElementById("end-modal"),
        endTitle: document.getElementById("end-title"),
        endText: document.getElementById("end-text"),
        restartBtn: document.getElementById("restart-btn")
    };

    let state = createInitialState();

    function createInitialState() {
        return {
            day: 1,
            cash: 9000,
            brand: 54,
            compliance: 62,
            morale: 64,
            audience: 12000,
            catalog: 8,
            team: 7,
            studio: 2,
            promo: 0,
            issues: 0,
            pricing: "balanced",
            gameOver: false,
            logs: ["Le label adulte ouvre son premier cycle de production."]
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

    function log(s, text) {
        s.logs.unshift(text);
        s.logs = s.logs.slice(0, 24);
    }

    function scoreValue() {
        return Math.max(0, Math.round(
            state.cash +
            state.audience * 0.4 +
            state.catalog * 260 +
            state.brand * 100 +
            state.compliance * 86 +
            state.morale * 72 +
            state.day * 220 -
            state.issues * 340
        ));
    }

    function sendScore(score) {
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

    function runEvent(report) {
        const roll = Math.random();
        report.event = "Journee stable.";

        if (roll < 0.12) {
            const fine = rnd(380, 1500);
            state.cash -= fine;
            state.compliance -= rnd(3, 7);
            state.brand -= rnd(1, 3);
            state.issues += 1;
            report.event = `Signalement legal: penalite ${fmt(fine)} credits.`;
        } else if (roll < 0.23) {
            const pop = rnd(1800, 6800);
            state.audience += pop;
            state.brand += rnd(1, 3);
            report.event = `Un teaser devient viral (+${fmt(pop)} audience).`;
        } else if (roll < 0.33) {
            state.morale -= rnd(3, 6);
            state.issues += 1;
            report.event = "Fatigue de tournage: moral equipe en baisse.";
        } else if (roll < 0.42) {
            state.compliance += rnd(2, 5);
            state.brand += 1;
            report.event = "Revue juridique proactive: dossiers assainis.";
        }
    }

    function phaseText() {
        if (state.gameOver) return "Termine";
        if (state.day <= 10) return "Lancement";
        if (state.day <= 22) return "Croissance";
        return "Scale";
    }

    function renderRisks() {
        const cashRisk = clamp(60 - (state.cash / 350), 0, 100);
        const legalRisk = clamp(95 - state.compliance * 0.95, 0, 100);
        const burnoutRisk = clamp(100 - state.morale, 0, 100);
        const imageRisk = clamp(92 - ((state.brand * 0.75) + (Math.min(state.audience, 200000) / 5200)), 0, 100);

        const rows = [
            { label: "Cashflow", value: cashRisk },
            { label: "Legal", value: legalRisk },
            { label: "Burnout", value: burnoutRisk },
            { label: "Image", value: imageRisk }
        ];

        dom.riskBoard.innerHTML = rows.map((row) => `
            <div class="risk-row">
                <span>${row.label}</span>
                <div class="risk-track"><i style="width:${Math.round(row.value)}%"></i></div>
                <span>${Math.round(row.value)}</span>
            </div>
        `).join("");
    }

    function renderReport(report) {
        if (!report) {
            dom.report.innerHTML = "<p>Configure ton empire puis lance un cycle.</p>";
            return;
        }
        dom.report.innerHTML = `
            <p><span class="label">Demande:</span> ${fmt(report.demand)} vues payantes</p>
            <p><span class="label">Recettes:</span> +${fmt(report.revenue)} | Couts: -${fmt(report.costs)}</p>
            <p><span class="label">Resultat:</span> ${report.net >= 0 ? "+" : ""}${fmt(report.net)}</p>
            <p><span class="label">Evenement:</span> ${report.event}</p>
        `;
    }

    function render() {
        dom.dayLabel.textContent = `Jour ${Math.min(state.day, MAX_DAYS)} / ${MAX_DAYS}`;
        dom.phaseLabel.textContent = phaseText();
        dom.cash.textContent = `${fmt(state.cash)} c`;
        dom.brand.textContent = `${Math.round(state.brand)}%`;
        dom.compliance.textContent = `${Math.round(state.compliance)}%`;
        dom.morale.textContent = `${Math.round(state.morale)}%`;
        dom.audience.textContent = fmt(state.audience);
        dom.catalog.textContent = fmt(state.catalog);
        dom.team.textContent = fmt(state.team);
        dom.studio.textContent = fmt(state.studio);
        dom.pricingSelect.value = state.pricing;
        dom.logList.innerHTML = state.logs.map((entry) => `<li>${entry}</li>`).join("");
        renderRisks();

        dom.actionButtons.forEach((button) => {
            button.disabled = state.gameOver;
        });
        dom.nextDayBtn.disabled = state.gameOver;
        dom.pricingSelect.disabled = state.gameOver;
    }

    function applyAction(actionId) {
        if (state.gameOver) return;
        const action = ACTIONS[actionId];
        if (!action) return;

        if (state.cash < action.cost) {
            log(state, `Action refusee (${action.label}): cash insuffisant.`);
            render();
            return;
        }

        state.cash -= action.cost;
        action.apply(state);
        normalizeState();
        render();
    }

    function normalizeState() {
        state.brand = clamp(state.brand, 0, 100);
        state.compliance = clamp(state.compliance, 0, 100);
        state.morale = clamp(state.morale, 0, 100);
        state.audience = Math.max(0, Math.round(state.audience));
        state.catalog = Math.max(0, Math.round(state.catalog));
        state.team = Math.max(1, Math.round(state.team));
        state.studio = Math.max(1, Math.round(state.studio));
    }

    function closeCycle() {
        if (state.gameOver) return;
        const pricing = PRICING[state.pricing];

        const baseDemand =
            (state.audience * 0.08) +
            (state.catalog * 280) +
            (state.brand * 36) +
            (state.promo * 180) +
            rnd(-1500, 2100);
        const demand = Math.max(0, Math.round(baseDemand * pricing.demandMult));

        const capacity = (state.team * 1200) + (state.studio * 2600);
        const monetized = Math.min(demand, capacity);

        const revenue =
            Math.round((monetized * (pricing.ticket / 100)) + (state.catalog * 110) + rnd(180, 640));
        const payroll = state.team * 95;
        const ops = state.studio * 130;
        const legalReserve = Math.round((100 - state.compliance) * 6.2);
        const costs = payroll + ops + legalReserve + rnd(120, 420);
        const net = revenue - costs;

        state.cash += net;
        state.audience += Math.round((monetized * 0.09) + (state.brand * 18) - (pricing.demandMult < 1 ? 120 : 0));
        state.brand += pricing.brandShift + (net > 0 ? 1 : -2);
        state.compliance -= 1.4 + (state.team / 30);
        state.morale += (net > 0 ? 1.2 : -2.5) - (state.team > 12 ? 1 : 0);
        state.promo = Math.max(0, state.promo - 6);

        const report = { demand, revenue, costs, net, event: "Journee stable." };
        runEvent(report);
        normalizeState();

        if (state.cash <= -4200) {
            finish("Banqueroute", "La tresorerie s'effondre, l'empire ne tient plus.");
        } else if (state.compliance <= 10) {
            finish("Shutdown legal", "Conformite trop faible, fermeture administrative.");
        } else if (state.morale <= 8) {
            finish("Equipe en rupture", "Le moral equipe est trop bas pour continuer.");
        } else if (state.day >= MAX_DAYS) {
            finish("Saison complete", "Tu as tenu 35 jours de production.");
        } else {
            state.day += 1;
        }

        log(state, `Jour ${Math.min(state.day, MAX_DAYS)}: net ${net >= 0 ? "+" : ""}${fmt(net)} credits.`);
        renderReport(report);
        render();
    }

    function finish(title, text) {
        if (state.gameOver) return;
        state.gameOver = true;
        const score = scoreValue();
        dom.endTitle.textContent = title;
        dom.endText.textContent = `${text} Score final: ${fmt(score)}.`;
        dom.endModal.classList.remove("hidden");
        dom.endModal.setAttribute("aria-hidden", "false");
        sendScore(score);
    }

    function restart() {
        state = createInitialState();
        dom.endModal.classList.add("hidden");
        dom.endModal.setAttribute("aria-hidden", "true");
        renderReport(null);
        render();
    }

    function bind() {
        dom.actionButtons.forEach((button) => {
            button.addEventListener("click", () => applyAction(button.dataset.action));
        });

        dom.pricingSelect.addEventListener("change", () => {
            if (state.gameOver) return;
            state.pricing = dom.pricingSelect.value;
            log(state, `Mode actif: ${PRICING[state.pricing].label}.`);
            render();
        });

        dom.nextDayBtn.addEventListener("click", closeCycle);
        dom.restartBtn.addEventListener("click", restart);
    }

    function init() {
        bind();
        renderReport(null);
        render();
    }

    init();
})();
