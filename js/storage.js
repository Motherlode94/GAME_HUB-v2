(function () {
  "use strict";

  if (window.CatalogStorage) return;

  function readJson(key, fallbackValue) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallbackValue;
    } catch (_error) {
      return fallbackValue;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (_error) {
      return false;
    }
  }

  window.CatalogStorage = {
    readJson: readJson,
    writeJson: writeJson,
    remove: function remove(key) {
      try {
        localStorage.removeItem(key);
      } catch (_error) {
        // no-op
      }
    }
  };
})();
