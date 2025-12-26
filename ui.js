/* =========================================================
   TrackerJS — ui.js
   Reminder & Revisit UI Layer
   Author: Akshat Prasad
   ========================================================= */

(function (window, document) {
  "use strict";

  /* ---------------- CONFIG ---------------- */

  const CONTAINER_ID = "trackerjs-ui";
  const AUTO_HIDE_MS = 12000; // auto hide after 12 sec

  /* ---------------- UTIL ---------------- */

  function createContainer() {
    if (document.getElementById(CONTAINER_ID)) return;

    const div = document.createElement("div");
    div.id = CONTAINER_ID;
    div.style.cssText = `
      position:fixed;
      bottom:16px;
      left:50%;
      transform:translateX(-50%);
      max-width:90%;
      width:420px;
      background:#020617;
      color:#e5e7eb;
      padding:14px 16px;
      border-radius:12px;
      box-shadow:0 10px 30px rgba(0,0,0,.35);
      font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;
      z-index:9999;
      display:none;
    `;
    document.body.appendChild(div);
  }

  function show(html) {
    createContainer();
    const box = document.getElementById(CONTAINER_ID);
    box.innerHTML = html;
    box.style.display = "block";

    setTimeout(hide, AUTO_HIDE_MS);
  }

  function hide() {
    const box = document.getElementById(CONTAINER_ID);
    if (box) box.style.display = "none";
  }

  function escapeHTML(str) {
    return String(str).replace(/[&<>"']/g, s =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[s])
    );
  }

  /* ---------------- UI TEMPLATES ---------------- */

  function resumeTemplate({ project, days, url }) {
    return `
      <strong>Welcome back 👋</strong>
      <p style="margin:6px 0 10px">
        You revisited <b>${escapeHTML(project)}</b>
        after ${days} day${days > 1 ? "s" : ""}.
      </p>
      <a href="${url}" style="color:#60a5fa">Resume where you left off →</a>
      <span style="float:right;cursor:pointer" onclick="TrackerUI.hide()">✕</span>
    `;
  }

  function continueTemplate({ project, days, url }) {
    return `
      <strong>Continue your journey</strong>
      <p style="margin:6px 0 10px">
        You explored <b>${escapeHTML(project)}</b>
        ${days} day${days > 1 ? "s" : ""} ago.
      </p>
      <a href="${url}" style="color:#60a5fa">Continue →</a>
      <span style="float:right;cursor:pointer" onclick="TrackerUI.hide()">✕</span>
    `;
  }

  function revisitTemplate({ project, days, url }) {
    return `
      <strong>Revisit suggestion</strong>
      <p style="margin:6px 0 10px">
        It’s been ${days} days since you last visited
        <b>${escapeHTML(project)}</b>.
      </p>
      <a href="${url}" style="color:#60a5fa">Revisit project →</a>
      <span style="float:right;cursor:pointer" onclick="TrackerUI.hide()">✕</span>
    `;
  }

  /* ---------------- PUBLIC API ---------------- */

  window.TrackerUI = {
    showResume(data) {
      show(resumeTemplate(data));
    },

    showContinue(data) {
      show(continueTemplate(data));
    },

    showRevisit(data) {
      show(revisitTemplate(data));
    },

    hide
  };

})(window, document);

/* ================= OPT-OUT & CLEAR HISTORY ================= */

function optOutTemplate() {
  return `
    <strong>TrackerJS Control</strong>
    <p style="margin:6px 0 10px">
      TrackerJS stores visit history only on your device.
    </p>
    <button onclick="TrackerUI.clearHistory()" style="margin-right:8px">
      Clear History
    </button>
    <button onclick="TrackerUI.disable()">Disable Tracker
    </button>
  `;
}

TrackerUI.clearHistory = function () {
  if (window.TrackerJS) TrackerJS.clearHistory();
  alert("Visit history cleared on this device.");
  TrackerUI.hide();
};

TrackerUI.disable = function () {
  localStorage.setItem("__akshat_tracker_disabled__", "1");
  alert("TrackerJS disabled on this device.");
  TrackerUI.hide();
};

/* ================= RECENTLY VISITED PANEL ================= */

TrackerUI.showRecent = function () {
  if (!window.TrackerJS) return;

  const history = TrackerJS.getHistory().slice(0, 5);
  if (!history.length) return;

  const items = history.map(h => `
    <li>
      <a href="${h.url}" style="color:#60a5fa">
        ${h.project}
      </a>
    </li>
  `).join("");

  show(`
    <strong>Recently Visited</strong>
    <ul style="margin:8px 0">${items}</ul>
    <span style="float:right;cursor:pointer" onclick="TrackerUI.hide()">✕</span>
  `);
};