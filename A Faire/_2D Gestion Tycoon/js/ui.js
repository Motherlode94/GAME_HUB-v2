const moneyEl = document.getElementById("money");
const incomeEl = document.getElementById("income");
const grossIncomeEl = document.getElementById("grossIncomeValue");
const upkeepEl = document.getElementById("upkeepValue");
const scoreEl = document.getElementById("scoreValue");
const totalLevelEl = document.getElementById("totalLevelValue");
const multiplierEl = document.getElementById("multiplierValue");
const prestigeEl = document.getElementById("prestigeValue");
const prestigeGainEl = document.getElementById("prestigeGainValue");
const playTimeEl = document.getElementById("playTimeValue");
const statusTextEl = document.getElementById("statusText");
const buildingsEl = document.getElementById("buildings");
const researchEl = document.getElementById("research");
const staffEl = document.getElementById("staff");
const milestonesEl = document.getElementById("milestones");
const activeEventsEl = document.getElementById("activeEvents");
const notificationsEl = document.getElementById("notifications");
const pauseBtn = document.getElementById("pauseBtn");
const boostBtn = document.getElementById("cashBoostBtn");
const prestigeBtn = document.getElementById("prestigeBtn");
const governorToggleBtn = document.getElementById("governorToggleBtn");
const governorProfileBtn = document.getElementById("governorProfileBtn");
const speedButtons = Array.from(document.querySelectorAll(".speed-btn"));

let buildingsSignature = "";
let researchSignature = "";
let staffSignature = "";
let milestonesSignature = "";
let activeEventsSignature = "";
let notificationsSignature = "";

function formatMoney(value) {
    const safe = Math.max(0, Math.floor(Number(value) || 0));
    return safe.toLocaleString("fr-FR");
}

function formatDuration(seconds) {
    const total = Math.max(0, Math.floor(Number(seconds) || 0));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;

    if (h > 0) {
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function renderBuildings() {
    if (!buildingsEl) return;

    const multiplier = typeof window.getIncomeMultiplier === "function" ? window.getIncomeMultiplier() : 1;
    const entries = gameData.buildings.map((building) => {
        const cost = typeof window.getBuildingCost === "function"
            ? window.getBuildingCost(building)
            : Math.floor(building.baseCost * Math.pow(building.costGrowth || 1.15, building.level));

        const levelIncome = typeof window.getBuildingIncomePerSecond === "function"
            ? window.getBuildingIncomePerSecond(building)
            : building.baseIncome * building.level * multiplier;

        const canAfford = gameData.money >= cost;
        const roi = levelIncome > 0 ? Math.ceil(cost / levelIncome) : "-";
        const btnText = building.level === 0 ? "Acheter" : "Ameliorer";

        return {
            id: building.id,
            html: `
                <article class="building">
                    <h3>${building.name} (Niv. ${building.level})</h3>
                    <p>Revenu: ${formatMoney(levelIncome)} /sec</p>
                    <p class="meta">Base: ${formatMoney(building.baseIncome)} | ROI: ${roi === "-" ? "-" : roi + "s"}</p>
                    <button class="btn-upgrade" type="button" data-building-id="${building.id}" ${canAfford ? "" : "disabled"}>
                        ${btnText} (${formatMoney(cost)} EUR)
                    </button>
                </article>
            `
        };
    });

    const nextSignature = JSON.stringify(entries.map((entry) => entry.html));
    if (nextSignature === buildingsSignature) return;

    buildingsSignature = nextSignature;
    buildingsEl.innerHTML = entries.map((entry) => entry.html).join("");

    const buttons = buildingsEl.querySelectorAll(".btn-upgrade");
    buttons.forEach((button) => {
        button.addEventListener("click", (event) => {
            const buildingId = button.getAttribute("data-building-id");
            if (buildingId && typeof window.upgradeBuildingById === "function") {
                const isCtrlLike = !!(event.ctrlKey || event.metaKey);
                const isShift = !!event.shiftKey;
                if (isCtrlLike || isShift) {
                    const burstByGovernor = typeof window.getTycoonBurstSize === "function"
                        ? window.getTycoonBurstSize()
                        : 6;
                    const burst = isShift ? Math.max(burstByGovernor, 12) : burstByGovernor;
                    window.upgradeBuildingById(buildingId, { maxSteps: burst, useReserve: true });
                } else {
                    window.upgradeBuildingById(buildingId);
                }
            }
        });
    });
}

function renderResearch() {
    if (!researchEl || typeof window.getResearchState !== "function") return;

    const research = window.getResearchState();
    const nextSignature = JSON.stringify(
        research.map((item) => `${item.id}|${item.level}|${item.cost}|${item.affordable}`)
    );
    if (nextSignature === researchSignature) return;

    researchSignature = nextSignature;

    researchEl.innerHTML = research
        .map((item) => `
            <article class="research-card">
                <h3>${item.name} (Niv. ${item.level})</h3>
                <p>${item.description}</p>
                <button class="research-btn" type="button" data-research-id="${item.id}" ${item.affordable ? "" : "disabled"}>
                    Rechercher (${formatMoney(item.cost)} EUR)
                </button>
            </article>
        `)
        .join("");

    const buttons = researchEl.querySelectorAll(".research-btn[data-research-id]");
    buttons.forEach((button) => {
        button.addEventListener("click", () => {
            const id = button.getAttribute("data-research-id");
            if (id && typeof window.buyResearch === "function") {
                window.buyResearch(id);
            }
        });
    });
}

function renderStaff() {
    if (!staffEl || typeof window.getStaffState !== "function") return;

    const staff = window.getStaffState();
    const nextSignature = JSON.stringify(
        staff.map((item) => `${item.id}|${item.count}|${item.nextCost}|${item.upkeep}|${item.affordable}`)
    );
    if (nextSignature === staffSignature) return;

    staffSignature = nextSignature;

    staffEl.innerHTML = staff
        .map((item) => `
            <article class="staff-card">
                <h3>${item.name} (${item.count})</h3>
                <p>${item.description}</p>
                <p class="meta">Charge: ${formatMoney(item.upkeep)} /sec</p>
                <div class="staff-actions">
                    <button class="staff-btn" type="button" data-staff-hire="${item.id}" ${item.affordable ? "" : "disabled"}>
                        Recruter (${formatMoney(item.nextCost)} EUR)
                    </button>
                    <button class="staff-btn danger" type="button" data-staff-fire="${item.id}" ${item.count > 0 ? "" : "disabled"}>
                        Licencier
                    </button>
                </div>
            </article>
        `)
        .join("");

    const hireButtons = staffEl.querySelectorAll(".staff-btn[data-staff-hire]");
    hireButtons.forEach((button) => {
        button.addEventListener("click", (event) => {
            const id = button.getAttribute("data-staff-hire");
            if (!id || typeof window.hireStaff !== "function") return;
            const burst = (event.ctrlKey || event.metaKey || event.shiftKey) ? 5 : 1;
            window.hireStaff(id, burst);
        });
    });

    const fireButtons = staffEl.querySelectorAll(".staff-btn[data-staff-fire]");
    fireButtons.forEach((button) => {
        button.addEventListener("click", (event) => {
            const id = button.getAttribute("data-staff-fire");
            if (!id || typeof window.fireStaff !== "function") return;
            const burst = (event.ctrlKey || event.metaKey || event.shiftKey) ? 3 : 1;
            window.fireStaff(id, burst);
        });
    });
}

function renderActiveEvents() {
    if (!activeEventsEl || typeof window.getActiveEventsState !== "function") return;

    const events = window.getActiveEventsState();
    const nextSignature = JSON.stringify(
        events.map((item) => `${item.id}|${item.remainingSec}`)
    );
    if (nextSignature === activeEventsSignature) return;

    activeEventsSignature = nextSignature;

    if (events.length === 0) {
        activeEventsEl.innerHTML = '<div class="event-entry">Aucun evenement actif.</div>';
        return;
    }

    activeEventsEl.innerHTML = events
        .map((item) => `
            <div class="event-entry">
                <strong>${item.label}</strong>
                <p>${item.description || "Effet temporaire"}</p>
                <span>${item.remainingSec}s</span>
            </div>
        `)
        .join("");
}

function renderMilestones() {
    if (!milestonesEl || typeof window.getMilestonesState !== "function") return;

    const milestones = window.getMilestonesState();
    const nextSignature = JSON.stringify(
        milestones.map((item) => `${item.id}|${item.claimed}|${item.ready}`)
    );
    if (nextSignature === milestonesSignature) return;

    milestonesSignature = nextSignature;

    milestonesEl.innerHTML = milestones
        .map((item) => {
            const stateClass = item.claimed ? "done" : (item.ready ? "ready" : "");
            const button = item.claimed
                ? "<button class=\"milestone-btn\" type=\"button\" disabled>Recupere</button>"
                : `<button class=\"milestone-btn\" type=\"button\" data-milestone-id=\"${item.id}\" ${item.ready ? "" : "disabled"}>Recuperer</button>`;

            return `
                <article class="milestone ${stateClass}">
                    <strong>${item.name}</strong>
                    <p>${item.description}</p>
                    <p>Objectif: ${item.targetText}</p>
                    <p>Recompense: ${item.rewardText}</p>
                    ${button}
                </article>
            `;
        })
        .join("");

    const buttons = milestonesEl.querySelectorAll(".milestone-btn[data-milestone-id]");
    buttons.forEach((button) => {
        button.addEventListener("click", () => {
            const id = button.getAttribute("data-milestone-id");
            if (id && typeof window.claimMilestone === "function") {
                window.claimMilestone(id);
            }
        });
    });
}

function renderNotifications() {
    if (!notificationsEl) return;

    const logs = Array.isArray(gameData.notifications) ? gameData.notifications.slice(0, 12) : [];
    const nextSignature = JSON.stringify(logs.map((log) => `${log.type}|${log.text}`));
    if (nextSignature === notificationsSignature) return;

    notificationsSignature = nextSignature;

    if (logs.length === 0) {
        notificationsEl.innerHTML = '<div class="log-entry">Aucun evenement pour le moment.</div>';
        return;
    }

    notificationsEl.innerHTML = logs
        .map((log) => `<div class="log-entry ${log.type || ""}">${log.text}</div>`)
        .join("");
}

function syncControls() {
    if (pauseBtn) {
        pauseBtn.textContent = gameData.isPaused ? "Reprendre" : "Pause";
    }

    speedButtons.forEach((button) => {
        const speed = Number(button.getAttribute("data-speed"));
        button.classList.toggle("is-active", speed === Number(gameData.gameSpeed));
    });

    if (boostBtn && typeof window.getBoostState === "function") {
        const boostState = window.getBoostState();
        if (boostState.cooldownRemaining > 0) {
            boostBtn.textContent = `Prime (${boostState.cooldownRemaining}s)`;
            boostBtn.disabled = true;
        } else {
            boostBtn.textContent = "Prime instantanee";
            boostBtn.disabled = false;
        }
    }

    if (prestigeBtn && typeof window.getPrestigeState === "function") {
        const prestigeState = window.getPrestigeState();
        prestigeBtn.textContent = `Prestige (+${prestigeState.possibleGain})`;
        prestigeBtn.disabled = !prestigeState.canPrestige;
    }

    if (typeof window.getTycoonGovernorState === "function") {
        const state = window.getTycoonGovernorState();
        if (governorToggleBtn) {
            governorToggleBtn.textContent = `Auto: ${state.enabled ? "ON" : "OFF"}`;
            governorToggleBtn.classList.toggle("is-active", !!state.enabled);
        }
        if (governorProfileBtn) {
            governorProfileBtn.textContent = `Profil: ${state.label}`;
        }
    }
}

function updateStats() {
    if (moneyEl) moneyEl.textContent = formatMoney(gameData.money);
    if (incomeEl && typeof window.calculateIncome === "function") {
        incomeEl.textContent = formatMoney(window.calculateIncome());
    }
    if (grossIncomeEl && typeof window.calculateGrossIncome === "function") {
        grossIncomeEl.textContent = formatMoney(window.calculateGrossIncome());
    }
    if (upkeepEl && typeof window.getStaffUpkeepPerSecond === "function") {
        upkeepEl.textContent = formatMoney(window.getStaffUpkeepPerSecond());
    }

    const score = window.gameState && Number.isFinite(Number(window.gameState.score))
        ? Number(window.gameState.score)
        : 0;
    if (scoreEl) scoreEl.textContent = formatMoney(score);

    const totalLevel = typeof window.getTotalLevel === "function" ? window.getTotalLevel() : 0;
    if (totalLevelEl) totalLevelEl.textContent = formatMoney(totalLevel);

    const multiplier = typeof window.getIncomeMultiplier === "function" ? window.getIncomeMultiplier() : 1;
    if (multiplierEl) multiplierEl.textContent = `x${multiplier.toFixed(2)}`;

    if (typeof window.getPrestigeState === "function") {
        const prestigeState = window.getPrestigeState();
        if (prestigeEl) prestigeEl.textContent = formatMoney(prestigeState.points);
        if (prestigeGainEl) prestigeGainEl.textContent = formatMoney(prestigeState.possibleGain);
    }

    const playSeconds = gameData.stats && Number.isFinite(Number(gameData.stats.playSeconds))
        ? gameData.stats.playSeconds
        : 0;
    if (playTimeEl) playTimeEl.textContent = formatDuration(playSeconds);

    const baseStatus = (gameData.currentStatus && String(gameData.currentStatus).trim())
        ? gameData.currentStatus
        : "Pret. Clique sur un batiment pour l'ameliorer.";
    if (statusTextEl) {
        if (typeof window.getTycoonGovernorState === "function") {
            const governorState = window.getTycoonGovernorState();
            statusTextEl.textContent = `${baseStatus} | Gouverneur: ${governorState.label} (${governorState.enabled ? "auto" : "manuel"})`;
        } else {
            statusTextEl.textContent = baseStatus;
        }
    }
}

function updateUI() {
    updateStats();
    renderBuildings();
    renderResearch();
    renderStaff();
    renderMilestones();
    renderActiveEvents();
    renderNotifications();
    syncControls();
}

if (pauseBtn) {
    pauseBtn.addEventListener("click", () => {
        if (typeof window.togglePause === "function") {
            window.togglePause();
        }
    });
}

speedButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const speed = Number(button.getAttribute("data-speed"));
        if (speed > 0 && typeof window.setGameSpeed === "function") {
            window.setGameSpeed(speed);
        }
    });
});

if (boostBtn) {
    boostBtn.addEventListener("click", () => {
        if (typeof window.activateCashBoost === "function") {
            window.activateCashBoost();
        }
    });
}

if (governorToggleBtn) {
    governorToggleBtn.addEventListener("click", () => {
        if (typeof window.toggleTycoonGovernor === "function") {
            window.toggleTycoonGovernor();
        }
    });
}

if (governorProfileBtn) {
    governorProfileBtn.addEventListener("click", () => {
        if (typeof window.cycleTycoonGovernorProfile === "function") {
            window.cycleTycoonGovernorProfile();
        }
    });
}

window.updateUI = updateUI;
window.formatTycoonMoney = formatMoney;
