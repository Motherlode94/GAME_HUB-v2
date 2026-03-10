(function () {
  "use strict";

  if (typeof window.submitGameScore === "function") return;

  function normalizeScore(score) {
    var n = Number(score);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return Math.floor(n);
  }

  window.submitGameScore = function submitGameScore(gameId, score) {
    var normalized = normalizeScore(score);
    if (!normalized) return false;

    var resolvedGameId = typeof window.resolveCatalogGameId === "function"
      ? window.resolveCatalogGameId(gameId)
      : null;

    var payload = { type: "gameScore", score: normalized };
    if (resolvedGameId) payload.gameId = resolvedGameId;

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
  };
})();
