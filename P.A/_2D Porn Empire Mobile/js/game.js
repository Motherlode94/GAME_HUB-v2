(function () {
    "use strict";

    const HUB_GAME_ID = 15;
    const MAX_DAYS = 35;

    const PRICING = {
        reach: { label: "Reach massif", ticket: 190, demandMult: 1.2, brandShift: -1 },
        balanced: { label: "Equilibre", ticket: 265, demandMult: 1.0, brandShift: 0 },
        premium: { label: "Premium", ticket: 360, demandMult: 0.83, brandShift: 2 }
    };

    const STRATEGIES = {
        balanced: {
            label: "Equilibre",
            demandMult: 1,
            ticketShift: 0,
            brandShift: 0,
            complianceShift: 0,
            moraleShift: 0
        },
        brand: {
            label: "Brand First",
            demandMult: 0.84,
            ticketShift: 38,
            brandShift: 1.8,
            complianceShift: 0.9,
            moraleShift: 0.7
        },
        viral: {
            label: "Viral Push",
            demandMult: 1.28,
            ticketShift: -22,
            brandShift: -1.5,
            complianceShift: -1.4,
            moraleShift: -1.1
        }
    };

    const ACTIONS = {
        talent: {
            label: "Talent",
            cost: 470,
            apply(state) {
                state.team += 1;
                state.brand += 2;
                state.morale -= 1;
                log(state, "Nouveau talent signe pour le studio.");
            }
        },
        shoot: {
            label: "Shoot",
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
            label: "Ads",
            cost: 360,
            apply(state) {
                state.promo += 18;
                state.brand += 2;
                log(state, "Campagne marketing agressive deployee.");
            }
        },
        legal: {
            label: "Audit",
            cost: 310,
            apply(state) {
                state.compliance += 10;
                state.brand += 1;
                log(state, "Dossiers juridiques et compliance renforces.");
            }
        },
        wellness: {
            label: "Wellness",
            cost: 280,
            apply(state) {
                state.morale += 10;
                state.compliance += 2;
                log(state, "Semaine de recuperation accordee a l'equipe.");
            }
        },
        upgrade: {
            label: "Upgrade",
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
        strategyLabel: document.getElementById("strategy-label"),
        cash: document.getElementById("cash"),
        brand: document.getElementById("brand"),
        compliance: document.getElementById("compliance"),
        morale: document.getElementById("morale"),
        audience: document.getElementById("audience"),
        catalog: document.getElementById("catalog"),
        team: document.getElementById("team"),
        studio: document.getElementById("studio"),
        hudPricing: document.getElementById("hud-pricing"),
        hudStrategy: document.getElementById("hud-strategy"),
        hudIssues: document.getElementById("hud-issues"),
        riskBoard: document.getElementById("risk-board"),
        objectiveStrip: document.getElementById("objective-strip"),
        strategyButtons: Array.from(document.querySelectorAll("[data-strategy]")),
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
            strategy: "balanced",
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

    function statColor(val, danger = 22, warn = 45) {
        if (val <= danger) return "var(--bad)";
        if (val <= warn)   return "var(--warn)";
        return "var(--good)";
    }

    function colorStat(el, val) {
        el.style.color = statColor(val);
    }

    function log(s, text) {
        s.logs.unshift(text);
        s.logs = s.logs.slice(0, 24);
    }

    function getObjectives() {
        return [
            { label: "Cash", value: state.cash, target: 28000, suffix: "c", isCash: true },
            { label: "Audience", value: state.audience, target: 180000, suffix: "", isCash: true },
            { label: "Conformite", value: state.compliance, target: 74, suffix: "%", isCash: false }
        ];
    }

    function completedGoalsCount() {
        return getObjectives().filter((goal) => goal.value >= goal.target).length;
    }

    function scoreValue() {
        const objectiveBonus = completedGoalsCount() * 2200;
        return Math.max(0, Math.round(
            state.cash +
            state.audience * 0.4 +
            state.catalog * 260 +
            state.brand * 100 +
            state.compliance * 86 +
            state.morale * 72 +
            state.day * 220 -
            state.issues * 340 +
            objectiveBonus
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

        if (roll < 0.09) {
            const fine = rnd(380, 1500);
            state.cash -= fine;
            state.compliance -= rnd(3, 7);
            state.brand -= rnd(1, 3);
            state.issues += 1;
            report.event = `Signalement legal: penalite ${fmt(fine)} credits.`;
        } else if (roll < 0.18) {
            const pop = rnd(1800, 6800);
            state.audience += pop;
            state.brand += rnd(1, 3);
            report.event = `Un teaser devient viral (+${fmt(pop)} audience).`;
        } else if (roll < 0.27) {
            state.morale -= rnd(3, 6);
            state.issues += 1;
            report.event = "Fatigue de tournage: moral equipe en baisse.";
        } else if (roll < 0.35) {
            state.compliance += rnd(2, 5);
            state.brand += 1;
            report.event = "Revue juridique proactive: dossiers assainis.";
        } else if (roll < 0.42) {
            const bonus = rnd(400, 1100);
            state.cash += bonus;
            state.brand += rnd(1, 2);
            report.event = `Partenariat sponsor: +${fmt(bonus)} credits, marque en hausse.`;
        } else if (roll < 0.48) {
            const takedownCost = rnd(300, 900);
            state.cash -= takedownCost;
            state.compliance -= rnd(2, 6);
            state.audience = Math.max(0, state.audience - rnd(1500, 4000));
            state.issues += 1;
            report.event = `Takedown de contenu sur plateforme. -${fmt(takedownCost)} credits, audience perdue.`;
        } else if (roll < 0.54) {
            const pop2 = rnd(3000, 10000);
            state.audience += pop2;
            report.event = `Algorithme favorise une video: +${fmt(pop2)} audience soudaine.`;
        } else if (roll < 0.60) {
            state.morale -= rnd(5, 10);
            state.compliance -= rnd(2, 5);
            state.issues += 1;
            report.event = "Conflit interne sur le plateau: morale et conformite impactees.";
        } else if (roll < 0.66) {
            state.catalog += rnd(1, 3);
            state.audience += rnd(500, 2000);
            report.event = "Un contenu archive regagne en popularite. Catalogue booste.";
        } else if (roll < 0.71) {
            const agentBonus = rnd(200, 600);
            state.cash += agentBonus;
            state.team += 1;
            report.event = `Agent signe un nouveau talent: +${fmt(agentBonus)} credits, equipe renforcee.`;
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

    function renderObjectives() {
        if (!dom.objectiveStrip) return;
        const goals = getObjectives();
        dom.objectiveStrip.innerHTML = goals.map((goal) => {
            const progress = clamp((goal.value / goal.target) * 100, 0, 100);
            const done = goal.value >= goal.target;
            const currentRaw = goal.isCash ? fmt(goal.value) : Math.round(goal.value);
            const targetRaw = goal.isCash ? fmt(goal.target) : Math.round(goal.target);
            const current = goal.suffix ? `${currentRaw}${goal.suffix}` : `${currentRaw}`;
            const target = goal.suffix ? `${targetRaw}${goal.suffix}` : `${targetRaw}`;
            return `
                <article class="objective">
                    <div class="objective-head">
                        <strong>${goal.label}</strong>
                        <span class="objective-tag ${done ? "done" : ""}">${done ? "ok" : "en cours"}</span>
                    </div>
                    <div class="objective-track"><i style="width:${Math.round(progress)}%"></i></div>
                    <div class="objective-meta">${current} / ${target}</div>
                </article>
            `;
        }).join("");
    }

    function renderReport(report) {
        if (!report) {
            dom.report.innerHTML = "<p>Ready. Clique <strong>Publier</strong>.</p>";
            return;
        }
        const netCol = report.net >= 0 ? "var(--good)" : "var(--bad)";
        const netSign = report.net >= 0 ? "+" : "";
        dom.report.innerHTML = `
            <div class="report-grid">
                <div class="report-cell"><span class="label">DEM</span><strong>${fmt(report.demand)}</strong></div>
                <div class="report-cell"><span class="label">NET</span><strong style="color:${netCol}">${netSign}${fmt(report.net)}</strong></div>
                <div class="report-cell"><span class="label">REV</span><strong style="color:var(--good)">+${fmt(report.revenue)}</strong></div>
                <div class="report-cell"><span class="label">COST</span><strong style="color:var(--bad)">-${fmt(report.costs)}</strong></div>
            </div>
            <p class="report-event"><span class="label">EVT</span> ${report.event}</p>
        `;
    }

    function render() {
        const strategy = STRATEGIES[state.strategy] || STRATEGIES.balanced;
        dom.dayLabel.textContent = `Jour ${Math.min(state.day, MAX_DAYS)} / ${MAX_DAYS}`;
        dom.phaseLabel.textContent = phaseText();
        if (dom.strategyLabel) {
            dom.strategyLabel.textContent = `Angle: ${strategy.label}`;
        }
        dom.cash.textContent = `${fmt(state.cash)} c`;
        dom.cash.style.color = state.cash < 1500 ? "var(--bad)" : state.cash < 3500 ? "var(--warn)" : "";
        dom.brand.textContent = `${Math.round(state.brand)}%`;
        colorStat(dom.brand, state.brand);
        dom.compliance.textContent = `${Math.round(state.compliance)}%`;
        colorStat(dom.compliance, state.compliance);
        dom.morale.textContent = `${Math.round(state.morale)}%`;
        colorStat(dom.morale, state.morale);
        dom.audience.textContent = fmt(state.audience);
        dom.catalog.textContent = fmt(state.catalog);
        dom.team.textContent = fmt(state.team);
        dom.studio.textContent = fmt(state.studio);
        dom.pricingSelect.value = state.pricing;
        if (dom.hudPricing) {
            dom.hudPricing.textContent = PRICING[state.pricing].label;
        }
        if (dom.hudStrategy) {
            dom.hudStrategy.textContent = strategy.label;
        }
        if (dom.hudIssues) {
            dom.hudIssues.textContent = String(state.issues);
            dom.hudIssues.style.color = state.issues >= 4 ? "var(--bad)" : state.issues >= 2 ? "var(--warn)" : "var(--good)";
        }
        dom.logList.innerHTML = state.logs.map((entry) => {
            let cls = "";
            if (/\+\d|viral|bonus|positif|signe|validee|assainis|proactive|fortune|hausse|popularite/.test(entry)) cls = "log-good";
            else if (/penalite|signalement|fatigue|burnout|demissionn|takedown|panne|effondre|legal|shutdown/.test(entry)) cls = "log-bad";
            return `<li class="${cls}">${entry}</li>`;
        }).join("");
        dom.strategyButtons.forEach((button) => {
            button.classList.toggle("active", button.dataset.strategy === state.strategy);
        });
        renderObjectives();
        renderRisks();

        dom.actionButtons.forEach((button) => {
            button.disabled = state.gameOver;
        });
        dom.strategyButtons.forEach((button) => {
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
        const strategy = STRATEGIES[state.strategy] || STRATEGIES.balanced;

        const baseDemand =
            (state.audience * 0.08) +
            (state.catalog * 280) +
            (state.brand * 36) +
            (state.promo * 180) +
            rnd(-1500, 2100);
        const demand = Math.max(0, Math.round(baseDemand * pricing.demandMult * strategy.demandMult));

        const capacity = (state.team * 1200) + (state.studio * 2600);
        const monetized = Math.min(demand, capacity);

        const revenue =
            Math.round((monetized * ((pricing.ticket + strategy.ticketShift) / 100)) + (state.catalog * 110) + rnd(180, 640));
        const payroll = state.team * 95;
        const ops = state.studio * 130;
        const legalReserve = Math.round((100 - state.compliance) * 6.2);
        const costs = payroll + ops + legalReserve + rnd(120, 420);
        const net = revenue - costs;

        state.cash += net;
        state.audience += Math.round((monetized * 0.09) + (state.brand * 18) - (pricing.demandMult < 1 ? 120 : 0));
        state.brand += pricing.brandShift + strategy.brandShift + (net > 0 ? 1 : -2);
        state.compliance += (-1.4 - (state.team / 30)) + strategy.complianceShift;
        state.morale += (net > 0 ? 1.2 : -2.5) - (state.team > 12 ? 1 : 0) + strategy.moraleShift;
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
        const goalsDone = completedGoalsCount();
        dom.endTitle.textContent = title;
        dom.endText.textContent = `${text} Score final: ${fmt(score)}. Objectifs valides: ${goalsDone}/3.`;
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

        dom.strategyButtons.forEach((button) => {
            button.addEventListener("click", () => {
                if (state.gameOver) return;
                const nextStrategy = button.dataset.strategy;
                if (!STRATEGIES[nextStrategy] || nextStrategy === state.strategy) return;
                state.strategy = nextStrategy;
                log(state, `Angle de croissance actif: ${STRATEGIES[nextStrategy].label}.`);
                render();
            });
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
        dom.actionButtons.forEach((btn) => {
            const action = ACTIONS[btn.dataset.action];
            if (action) {
                btn.innerHTML = `${action.label}<small class="btn-cost">${fmt(action.cost)} c</small>`;
            }
        });
        bind();
        renderReport(null);
        render();
    }

    init();
})();
