(function () {
  "use strict";

  if (typeof window.resolveCatalogGameId === "function") return;

  function safeInt(value) {
    var n = Number(value);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
  }

  window.resolveCatalogGameId = function resolveCatalogGameId(rawId) {
    var direct = safeInt(rawId);
    if (direct) return direct;

    try {
      var fromSession = safeInt(sessionStorage.getItem("wgc_activeGameId"));
      if (fromSession) return fromSession;
    } catch (_error) {
      // no-op
    }

    return null;
  };
})();
