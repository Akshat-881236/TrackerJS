/* =========================================
   ANH SIMPLE REDIRECT ENGINE (REFactored)
   Author: Akshat Network Hub
   ========================================= */

(function () {
  "use strict";

  /* ================= CONFIG ================= */

  const ANH_DOMAINS = [
    "akshat-881236.github.io",
    "akshat-145609.github.io",
    "itsakshatnetworkhub-881238.github.io"
  ];

  const REDIRECT_DELAY = 10;

  /* ================= TRUSTED EXTERNAL DB ================= */

  const EXTERNAL_DB = {
    "github.com": true,
    "linkedin.com": true,
    "x.com": true,
    "instagram.com": true,
    "google.com": true,
    "youtube.com": true
  };

  /* ================= HELPERS ================= */

  function getURL(url) {
    try { return new URL(url); } catch { return null; }
  }

  function isANH(url) {
    return ANH_DOMAINS.some(d => url.host.includes(d));
  }

  function isTrustedExternal(url) {
    return Object.keys(EXTERNAL_DB).some(d => url.host.includes(d));
  }

  /* ================= PROFESSIONAL CARD ================= */

  function showCard(targetUrl) {
    let time = REDIRECT_DELAY;

    const style = `
      position:fixed;inset:0;z-index:99999;
      background:#0b1220;color:#e5e7eb;
      display:flex;align-items:center;justify-content:center;
      font-family:system-ui;
    `;

    const box = `
      <div style="max-width:500px;width:90%;
        background:#111827;padding:24px;border-radius:14px;
        text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.5)">
        
        <h2 style="color:#38bdf8;margin-bottom:10px">
          External Navigation
        </h2>

        <p style="color:#9ca3af;font-size:14px">
          You are leaving Akshat Network Hub. Please confirm before proceeding.
        </p>

        <p style="margin:12px 0;font-size:13px;color:#cbd5f5;word-break:break-all">
          ${targetUrl}
        </p>

        <p style="margin-top:10px">
          Redirecting in <b id="t">${time}</b>s
        </p>

        <div style="margin-top:16px">
          <button id="go" style="
            padding:8px 14px;border:none;border-radius:8px;
            background:#38bdf8;color:#000;cursor:pointer">
            Continue
          </button>

          <button onclick="history.back()" style="
            padding:8px 14px;margin-left:10px;border:none;
            border-radius:8px;background:#1f2937;color:#fff;cursor:pointer">
            Cancel
          </button>
        </div>
      </div>
    `;

    const div = document.createElement("div");
    div.style = style;
    div.innerHTML = box;
    document.body.appendChild(div);

    document.getElementById("go").onclick = () => location.href = targetUrl;

    const interval = setInterval(() => {
      time--;
      document.getElementById("t").textContent = time;
      if (time <= 0) {
        clearInterval(interval);
        location.href = targetUrl;
      }
    }, 1000);
  }

  /* ================= CORE LOGIC ================= */

  function handleRedirect(href) {
    const url = getURL(href);
    if (!url) return;

    // ✅ ANH → direct
    if (isANH(url)) {
      location.href = url.href;
      return;
    }

    // ✅ Trusted External → direct
    if (isTrustedExternal(url)) {
      location.href = url.href;
      return;
    }

    // ⚠️ Others → show professional card
    showCard(url.href);
  }

  /* ================= EVENT ================= */

  document.addEventListener("click", function (e) {
    const a = e.target.closest("a[href]");
    if (!a) return;

    const href = a.href;
    if (!href || href.startsWith("javascript:")) return;

    e.preventDefault();
    handleRedirect(href);
  });

})();
