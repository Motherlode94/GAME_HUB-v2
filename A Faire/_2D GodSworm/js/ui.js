// ui.js - Mise a jour interface principale

function formatGameClock(totalSeconds) {
  const safe = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function renderEventLog() {
  const logRoot = document.getElementById("eventLog");
  if (!logRoot) return;

  const runtime = window.GodSwormRuntime || {};
  const entries = Array.isArray(runtime.eventLog) ? runtime.eventLog : [];

  if (entries.length === 0) {
    logRoot.innerHTML = '<div class="log-item">Aucun evenement recent.</div>';
    return;
  }

  logRoot.innerHTML = entries
    .map((entry) => `<div class="log-item ${entry.type || ""}">${entry.text}</div>`)
    .join("");
}

function updateRuntimePanels(gameTimeSeconds) {
  const runtime = window.GodSwormRuntime || {};

  const timer = document.getElementById("timer");
  if (timer) timer.textContent = formatGameClock(gameTimeSeconds);

  const waveValue = document.getElementById("waveValue");
  if (waveValue) waveValue.textContent = String(runtime.waveNumber || 1);

  const stateValue = document.getElementById("stateValue");
  if (stateValue) {
    stateValue.textContent = runtime.isPaused ? "Pause" : "Actif";
  }

  const statusLine = document.getElementById("status-line");
  if (statusLine && runtime.statusLine) {
    statusLine.textContent = runtime.statusLine;
  }

  const pauseButton = document.getElementById("pause-toggle");
  if (pauseButton) {
    pauseButton.textContent = runtime.isPaused ? "Reprendre" : "Pause";
  }

  const speed = Number(runtime.gameSpeed) || 1;
  document.querySelectorAll(".speed-button").forEach((button) => {
    const value = Number(button.getAttribute("data-speed"));
    button.classList.toggle("active", value === speed);
  });

  renderEventLog();
}

function updateUI(god, faith, maxFaith, gameTime, selectedTerritory) {
  // Divine Presence
  const godName = document.getElementById("godName");
  if (godName) godName.textContent = god.name;

  const faithText = document.getElementById("faith");
  if (faithText) faithText.textContent = `${Math.floor(faith)} / ${maxFaith}`;

  const faithBar = document.getElementById("faithBar");
  if (faithBar) {
    const faithPercent = (faith / maxFaith) * 100;
    faithBar.style.width = `${faithPercent}%`;
  }

  const passive = document.getElementById("passive");
  if (passive) passive.textContent = god.passiveDescription;

  const gameTimeEl = document.getElementById("gameTime");
  if (gameTimeEl) gameTimeEl.textContent = `${Math.floor(gameTime)}s`;

  // Selected Territory
  const selectedInfo = document.getElementById("selectedInfo");
  if (selectedTerritory && selectedInfo) {
    selectedInfo.style.display = "block";

    const selectedFaction = document.getElementById("selectedFaction");
    if (selectedFaction) {
      selectedFaction.textContent =
        typeof getFactionName === "function"
          ? getFactionName(selectedTerritory.faction)
          : selectedTerritory.faction.toUpperCase();
    }

    const selectedPop = document.getElementById("selectedPop");
    if (selectedPop) selectedPop.textContent = Math.floor(selectedTerritory.population);

    const selectedRes = document.getElementById("selectedRes");
    if (selectedRes) selectedRes.textContent = Math.floor(selectedTerritory.resistance);
  } else if (selectedInfo) {
    selectedInfo.style.display = "none";
  }

  // Statistics
  const powerLevel = document.getElementById("powerLevel");
  if (powerLevel) powerLevel.textContent = god.getPowerLevel();

  const totalSmites = document.getElementById("totalSmites");
  if (totalSmites) totalSmites.textContent = god.totalSmites;

  const totalBlessings = document.getElementById("totalBlessings");
  if (totalBlessings) totalBlessings.textContent = god.totalBlessings;

  const totalMiracles = document.getElementById("totalMiracles");
  if (totalMiracles) totalMiracles.textContent = god.totalMiracles;

  const totalConversions = document.getElementById("totalConversions");
  if (totalConversions) totalConversions.textContent = god.territoriesConverted;

  updateRuntimePanels(gameTime);
}

function updateResourcesUI() {
  const goldEl = document.getElementById("goldAmount");
  const foodEl = document.getElementById("foodAmount");
  const woodEl = document.getElementById("woodAmount");

  if (goldEl) goldEl.textContent = Math.floor(resources[RESOURCES.GOLD]);
  if (foodEl) foodEl.textContent = Math.floor(resources[RESOURCES.FOOD]);
  if (woodEl) woodEl.textContent = Math.floor(resources[RESOURCES.WOOD]);
}
