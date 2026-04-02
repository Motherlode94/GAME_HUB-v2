/* ui.js — HUD DOM controller */
const UI = (() => {

  const barHunger  = document.getElementById("barHunger");
  const barHeat    = document.getElementById("barHeat");
  const barPower   = document.getElementById("barPower");
  const valHunger  = document.getElementById("valHunger");
  const valHeat    = document.getElementById("valHeat");
  const valPower   = document.getElementById("valPower");
  const valMoney   = document.getElementById("valMoney");
  const valTurn    = document.getElementById("valTurn");
  const endScreen  = document.getElementById("endScreen");
  const endTitle   = document.getElementById("endTitle");
  const endMsg     = document.getElementById("endMsg");
  const endIcon    = document.getElementById("endIcon");
  const endStats   = document.getElementById("endStats");
  const hintEl     = document.getElementById("actionHint");
  const eventBox   = document.getElementById("eventBox");

  let eventTimer;

  function updateStats(s) {
    barHunger.style.width = s.hunger + "%";
    barHeat.style.width   = s.heat   + "%";
    barPower.style.width  = Math.min(100, (s.power / 50) * 100) + "%";

    valHunger.textContent = s.hunger;
    valHeat.textContent   = s.heat;
    valPower.textContent  = s.power + "/50";
    valMoney.textContent  = "$" + s.money;
    valTurn.textContent   = s.turn;

    // Dynamic bar color
    const hPct = s.hunger;
    barHunger.style.background = hPct >= 80 ? "#c0392b"
      : hPct >= 50 ? "linear-gradient(90deg,#8e3a1a,#c0392b)"
      : "linear-gradient(90deg,#1a6e3a,#c0392b)";

    const htPct = s.heat;
    barHeat.style.background = htPct >= 80 ? "#e74c3c"
      : htPct >= 50 ? "linear-gradient(90deg,#6e3a1a,#e74c3c)"
      : "linear-gradient(90deg,#1a3a6e,#c0392b)";
  }

  function showEndScreen(won, msg, s) {
    endIcon.textContent  = won ? "🧛" : "💀";
    endTitle.textContent = won ? "VICTOIRE" : "GAME OVER";
    endMsg.textContent   = msg;
    endStats.innerHTML   =
      `Tour ${s.turn} &nbsp;·&nbsp; Pouvoir ${s.power}/50 &nbsp;·&nbsp; Argent $${s.money}`;
    endScreen.classList.add("active");
  }

  function setHint(text) {
    if (hintEl) hintEl.textContent = text;
  }

  function showEvent(msg) {
    if (!eventBox) return;
    eventBox.textContent = msg;
    eventBox.classList.add("visible");
    clearTimeout(eventTimer);
    eventTimer = setTimeout(() => eventBox.classList.remove("visible"), 3200);
  }

  return { updateStats, showEndScreen, setHint, showEvent };

})();