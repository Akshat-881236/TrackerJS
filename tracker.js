/* =========================================================
   TrackerJS — tracker.js
   Visit Memory Engine (Client-only, Privacy-safe)
   Author: Akshat Prasad
   ========================================================= */
if (localStorage.getItem("__akshat_tracker_disabled__") === "1") {
  return;
}

(function (window) {
  "use strict";

  const STORAGE_KEY = "__akshat_tracker_history__";
  const MAX_ENTRIES = 15;

  /* ---------------- UTILITIES ---------------- */

  function nowISO() {
    return new Date().toISOString();
  }

  function getProjectName() {
    try {
      const path = location.pathname.split("/").filter(Boolean);
      return path.length ? path[0] : "root";
    } catch {
      return "unknown";
    }
  }

  function getPageType() {
    const path = location.pathname.replace(/\/$/, "");
    return path === "" || path.split("/").length === 1 ? "home" : "inner";
  }

  function loadHistory() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveHistory(history) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch {
      /* storage may be full or blocked */
    }
  }

  /* ---------------- CORE LOGIC ---------------- */

  function recordVisit() {
    const history = loadHistory();

    const entry = {
      project: getProjectName(),
      url: location.href,
      pageType: getPageType(),
      timestamp: nowISO()
    };

    // Remove duplicate URL if exists
    const filtered = history.filter(h => h.url !== entry.url);

    // Add newest at top
    filtered.unshift(entry);

    // Trim history
    const trimmed = filtered.slice(0, MAX_ENTRIES);

    saveHistory(trimmed);
  }

  function getHistory() {
    return loadHistory();
  }

  function getLastVisit() {
    const history = loadHistory();
    return history.length ? history[0] : null;
  }

  function clearHistory() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }

  /* ---------------- PUBLIC API ---------------- */

  window.TrackerJS = {
    recordVisit,
    getHistory,
    getLastVisit,
    clearHistory
  };

})(window);