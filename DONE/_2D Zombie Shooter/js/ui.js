// ui.js — contrôle les overlays et le HUD
const UI = (() => {

  const hpEl      = document.getElementById("hp");
  const scoreEl   = document.getElementById("score");
  const waveEl    = document.getElementById("wave");

  const menuEl    = document.getElementById("menu");
  const gameOverEl= document.getElementById("gameOver");
  const finalScoreEl = document.getElementById("finalScore");

  const startBtn   = document.getElementById("startBtn");
  const restartBtn = document.getElementById("restartBtn");

  function updateHUD(data) {
    hpEl.textContent    = Math.max(0, Math.floor(data.hp));
    scoreEl.textContent = data.score;
    waveEl.textContent  = data.wave;
  }

  function showMenu()    { menuEl.classList.add("active"); }
  function hideMenu()    { menuEl.classList.remove("active"); }

  function showGameOver(score) {
    finalScoreEl.textContent = score;
    gameOverEl.classList.add("active");
  }
  function hideGameOver() { gameOverEl.classList.remove("active"); }

  return {
    updateHUD,
    showMenu, hideMenu,
    showGameOver, hideGameOver,
    startBtn, restartBtn
  };

})();