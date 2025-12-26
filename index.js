/* =========================================================
   TrackerJS — index.js
   Orchestrator & Decision Engine
   Author: Akshat Prasad
   ========================================================= */

(function (window) {
  "use strict";

  /* ---------------- CONFIG ---------------- */

  const DAY_MS = 24 * 60 * 60 * 1000;
  const REVISIT_THRESHOLD_DAYS = 1;   // show reminder after 1 day
  const LONG_GAP_DAYS = 7;             // stronger suggestion after 7 days

  /* ---------------- UTIL ---------------- */

  function daysBetween(isoTime) {
    try {
      const then = new Date(isoTime).getTime();
      const now = Date.now();
      return Math.floor((now - then) / DAY_MS);
    } catch {
      return 0;
    }
  }

  function sameProject(a, b) {
    return a && b && a.project === b.project;
  }

  /* ---------------- CORE LOGIC ---------------- */

  function pushData() {
    if (!window.TrackerJS) return;

    // Record this visit
    TrackerJS.recordVisit();

    const history = TrackerJS.getHistory();
    const last = TrackerJS.getLastVisit();

    // First visit ever → nothing to show
    if (!history || history.length < 2) return;

    const previous = history[1];
    if (!previous) return;

    const gapDays = daysBetween(previous.timestamp);

    /* ---------- DECISION TREE ---------- */

    // 1️⃣ Returned to same project after time gap
    if (sameProject(last, previous) && gapDays >= REVISIT_THRESHOLD_DAYS) {
      notify("resume", {
        project: last.project,
        days: gapDays,
        url: last.url
      });
      return;
    }

    // 2️⃣ Switched project → suggest continue previous
    if (!sameProject(last, previous) && gapDays >= REVISIT_THRESHOLD_DAYS) {
      notify("continue", {
        project: previous.project,
        days: gapDays,
        url: previous.url
      });
      return;
    }

    // 3️⃣ Long inactivity gap
    if (gapDays >= LONG_GAP_DAYS) {
      notify("revisit", {
        project: previous.project,
        days: gapDays,
        url: previous.url
      });
    }
  }

  /* ---------------- UI BRIDGE ---------------- */

  function notify(type, payload) {
    if (!window.TrackerUI) return;

    switch (type) {
      case "resume":
        TrackerUI.showResume(payload);
        break;

      case "continue":
        TrackerUI.showContinue(payload);
        break;

      case "revisit":
        TrackerUI.showRevisit(payload);
        break;

      default:
        break;
    }
  }

  /* ---------------- PUBLIC API ---------------- */

  window.pushData = pushData;

})(window);

// Show recent projects after logic
setTimeout(() => {
  if (window.TrackerUI) TrackerUI.showRecent();
}, 1500);