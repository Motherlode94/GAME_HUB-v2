(function () {
  "use strict";

  if (window.__WGC_GAME_SHELL__) return;
  window.__WGC_GAME_SHELL__ = true;

  var bestScore = 0;

  function toSafeScore(value) {
    var n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return Math.floor(n);
  }

  function getResolvedGameId(rawId) {
    if (typeof window.resolveCatalogGameId === "function") {
      return window.resolveCatalogGameId(rawId);
    }
    return null;
  }

  function readLiveScore() {
    var fromState = window.gameState && window.gameState.score;
    var fromGlobal = window.gameScore;
    var fromHud = window.Game && window.Game.HUD && window.Game.HUD.score;
    return Math.max(toSafeScore(fromState), toSafeScore(fromGlobal), toSafeScore(fromHud));
  }

  function postScore(score, gameId) {
    var payload = { type: "gameScore", score: toSafeScore(score) };
    var resolvedGameId = getResolvedGameId(gameId);
    if (resolvedGameId) payload.gameId = resolvedGameId;
    if (!payload.score) return false;

    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(payload, window.location.origin);
        return true;
      }
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(payload, "*");
        return true;
      }
    } catch (_error) {
      // no-op
    }

    return false;
  }

  function capture(nextValue) {
    var nextScore = Math.max(toSafeScore(nextValue), readLiveScore());
    if (nextScore > bestScore) bestScore = nextScore;
    return bestScore;
  }

  function submit(nextValue, gameId) {
    var score = capture(nextValue);
    return postScore(score, gameId);
  }

  function flush() {
    return submit(bestScore || readLiveScore());
  }

  window.CatalogScore = window.CatalogScore || {};
  if (typeof window.CatalogScore.capture !== "function") window.CatalogScore.capture = capture;
  if (typeof window.CatalogScore.submit !== "function") window.CatalogScore.submit = submit;
  if (typeof window.CatalogScore.flush !== "function") window.CatalogScore.flush = flush;
  if (typeof window.CatalogScore.getBest !== "function") {
    window.CatalogScore.getBest = function getBest() {
      return bestScore;
    };
  }

  if (typeof window.submitGameScore !== "function") {
    window.submitGameScore = function submitGameScore(gameId, score) {
      return submit(score, gameId);
    };
  }

  function fallbackCatalogHref() {
    var path = String(window.location.pathname || "").replace(/\\/g, "/").toLowerCase();
    if (path.indexOf("/a revoir/") !== -1) {
      if (path.indexOf("/new version/") !== -1) return "../../../index.html";
      return "../../index.html";
    }
    if (path.indexOf("/a faire/") !== -1) return "../../index.html";
    return "../index.html";
  }

  function bindBackButton() {
    var button = document.getElementById("back-to-catalog");
    if (!button || button.dataset.wgcBound === "1") return;

    var hasHref = button.tagName === "A" && button.getAttribute("href");
    if (hasHref) {
      button.addEventListener("click", function () {
        flush();
      });
      button.dataset.wgcBound = "1";
      return;
    }

    button.addEventListener("click", function (event) {
      event.preventDefault();
      flush();
      window.location.href = fallbackCatalogHref();
    });
    button.dataset.wgcBound = "1";
  }

  window.addEventListener("beforeunload", flush);
  document.addEventListener("DOMContentLoaded", bindBackButton);
})();
