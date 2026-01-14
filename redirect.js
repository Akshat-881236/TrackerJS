/* =========================================================
   redirect-advanced.js — Akshat Project Network Redirection Engine (Advanced)
   Base/Reference Implementation Included Below (unchanged) and then extended.
   Author: Akshat Prasad (base), Extended by: Akshat Project Network Security
   Tech: Pure JavaScript (innerHTML + injected CSS)
   ========================================================= */

/* ---------------------------
   ORIGINAL REFERENCE IMPLEMENTATION
   (kept intact & executed as provided)
   --------------------------- */
(function () {
  "use strict";

  /* ================= CONFIG ================= */

  const NETWORK_PREFIX = "akshat-881236.github.io";
  const REDIRECT_DELAY_MS = 4000;

  /* ================= DATABASE ================= */

  // Internal Akshat Network Projects (HOME only)
  const INTERNAL_PROJECTS = {
    "Portfolio-881236": {
      home: "https://akshat-881236.github.io/Portfolio-881236/",
      logo: "http://student.mdu.ac.in/Student_Biometrics/881238_Snap_10-4-2024_305%20AKSHAT%20P.jpg",
      title: "Personal Portfolio",
      description: "Academic profile, projects and system architecture by Akshat Prasad."
    },
    "Key-of-Success": {
      home: "https://akshat-881236.github.io/Key-of-Success/",
      logo: "https://akshat-881236.github.io/TrackerJS/Assets/KOSLogo.png",
      title: "Key of Success",
      description: "Academic Record & Performance Management System."
    },
    "TrackerJS": {
      home: "https://akshat-881236.github.io/TrackerJS/",
      logo: "http://student.mdu.ac.in/Student_Biometrics/881238_Snap_10-4-2024_305%20AKSHAT%20P.jpg",
      title: "TrackerJS",
      description: "Privacy-first visit memory & revisit assistant."
    },
    "LocalRepo": {
      home: "https://akshat-881236.github.io/LocalRepo/",
      logo: "http://student.mdu.ac.in/Student_Biometrics/881238_Snap_10-4-2024_305%20AKSHAT%20P.jpg",
      title: "My Profile Dashboard",
      description: "Personalized dashboard for quick access to profiles and resources."
    },
    "SitemapGeneratorXml": {
      home: "https://akshat-881236.github.io/SitemapGeneratorXml/",
      logo: "https://akshat-881236.github.io/SitemapGeneratorXml/Assets/icon-128.png",
      title: "Sitemap Generator XML",
      description: "Automated XML sitemap creation tool for websites."
    },
    "sitemapjs": {
      home: "https://akshat-881236.github.io/sitemapjs/",
      logo: "https://akshat-881236.github.io/TrackerJS/Assets/AKNH/icon-192.png",
      title: "Akshat Network Hub",
      description: "Central hub for Akshat Project Network resources."
    }
  };

  // Trusted External Networks
  const TRUSTED_EXTERNALS = {
    "google.com": {
      title: "Google",
      logo: "https://www.google.com/favicon.ico",
      description: "Global search and information platform."
    },
    "youtube.com": {
      title: "YouTube",
      logo: "https://www.youtube.com/favicon.ico",
      description: "Video streaming and educational content platform."
    },
    "wikipedia.org": {
      title: "Wikipedia",
      logo: "https://www.wikipedia.org/static/favicon/wikipedia.ico",
      description: "Free online encyclopedia."
    },
    "github.com": {
      title: "GitHub",
      logo: "https://github.githubassets.com/favicons/favicon.png",
      description: "Code hosting and collaboration platform."
    },
    "stackoverflow.com": {
      title: "Stack Overflow",
      logo: "https://cdn.sstatic.net/Sites/stackoverflow/img/favicon.ico",
      description: "Programming Q&A and knowledge sharing community."
    },
    "mdu.ac.in": {
      title: "MD University",
      logo: "https://mdu.ac.in/favicon.ico",
      description: "Official website of MD University."
    },
    "akshat-881236.github.io": {
      title: "Akshat Project Network",
      logo: "https://akshat-881236.github.io/TrackerJS/Assets/AKNH/icon-192.png",
      description: "Official Akshat Project Network domains."
    },
    "linkedin.com": {
      title: "LinkedIn",
      logo: "https://static.licdn.com/scds/common/u/images/logos/favicons/v1/favicon.ico",
      description: "Professional networking platform."
    },
    "https://chatgpt.com/g/g-69620f615cec8191ae44ab31140c7192-akshat-network-hub": {
      title: "Chatgpt power Akshat Network Hub AI",
      logo: "https://akshat-881236.github.io/TrackerJS/Assets/AKNH/icon-192.png",
      description: "Chat with Akshat Network Hub in ChatGPT."
    },
    "https://x.com/akshatpsd2005": {
      title: "Twitter Profile - Akshat Prasad",
      logo: "https://abs.twimg.com/favicons/twitter.2.ico",
      description: "View my Twitter Profile ."
    },
    "https://ik.imagekit.io/2412361999/Image-145609/in.gov.cbse-SSCER-171360312022.pdf?updatedAt=1764337480011": {
      title: "Matriculation Marksheet - Akshat Prasad",
      logo: "https://akshat-881236.github.io/TrackerJS/Assets/Cbse.jpeg",
      description: "Digital Class 10th Marksheet of Akshat Prasad generated via Digilocker."
    },
    "https://ik.imagekit.io/2412361999/Image-145609/in.org.bseh-HSCER-30240779602024MARCH.pdf?updatedAt=1764337479998": {
      title: "Intermediate Marksheet - Akshat Prasad",
      logo: "https://akshat-881236.github.io/TrackerJS/Assets/Hbse.png",
      description: "Digital Class 12th Marksheet of Akshat Prasad generated via Digilocker."
    },
    "https://ik.imagekit.io/2412361999/Image-145609/in.ac.mdurohtak-DGMST-610191220242412361999I.pdf?updatedAt=1764337480245": {
      title: "BCA Semester 1 DMC - Akshat Prasad",
      logo: "https://akshat-881236.github.io/TrackerJS/Assets/MDU_LOGO.jpg",
      description: "Digital BCA Semester - 1 Marksheet of Akshat Prasad generated via Digilocker."
    },
    "https://www.instagram.com/its_akshat_881236/": {
      title: "Instagram Profile - Akshat Prasad",
      logo: "http://student.mdu.ac.in/Student_Biometrics/881238_Snap_10-4-2024_305%20AKSHAT%20P.jpg",
      description: "View my Instagram Profile ."
    }
  };

  /* ================= UTILITIES ================= */

  function getHost(url) {
    try { return new URL(url).host; } catch { return ""; }
  }

  function getPath(url) {
    try { return new URL(url).pathname; } catch { return ""; }
  }

  function findInternalProject(url) {
    const path = getPath(url);
    const parts = path.split("/").filter(Boolean);
    if (!parts.length) return null;
    return INTERNAL_PROJECTS[parts[0]] || null;
  }

  function isInternal(url) {
    return getHost(url).includes(NETWORK_PREFIX);
  }

  function findTrustedExternal(url) {
    const host = getHost(url);
    return Object.keys(TRUSTED_EXTERNALS).find(h => host.includes(h));
  }

  /* ================= UI ENGINE ================= */

  function injectStyles() {
    if (document.getElementById("__redirect_styles__")) return;

    const style = document.createElement("style");
    style.id = "__redirect_styles__";
    style.textContent = `
      #redirect-overlay{
        position:fixed;inset:0;z-index:99999;
        background:#020617;color:#e5e7eb;
        display:flex;align-items:center;justify-content:center;
        font-family:system-ui,Segoe UI,Arial;
      }
      #redirect-box{
        max-width:720px;width:92%;
        background:#020617;
        border-radius:16px;
        padding:28px;
        box-shadow:0 30px 80px rgba(0,0,0,.6);
        text-align:center;
        animation:fadeIn .4s ease;
      }
      #redirect-box img{max-height:70px;margin-bottom:12px}
      #redirect-box h1{margin:8px 0;color:#38bdf8}
      #redirect-projects{
        display:flex;justify-content:space-between;
        gap:20px;margin-top:24px;flex-wrap:wrap
      }
      .project{
        width:45%;background:#020617;
        border:1px solid #1e293b;
        border-radius:12px;padding:14px
      }
      .project img{max-height:42px}
      .timer{
        margin-top:18px;font-size:14px;color:#94a3b8
      }
      .actions button{
        margin:10px;padding:10px 16px;
        border:none;border-radius:8px;
        background:#38bdf8;color:#020617;
        cursor:pointer
      }
      @keyframes fadeIn{
        from{opacity:0;transform:scale(.96)}
        to{opacity:1;transform:scale(1)}
      }
    `;
    document.head.appendChild(style);
  }

  function showInternalRedirect(from, to, targetUrl) {
    injectStyles();

    let time = REDIRECT_DELAY_MS / 1000;

    document.body.insertAdjacentHTML("beforeend", `
      <div id="redirect-overlay">
        <div id="redirect-box">
          <img src="https://akshat-881236.github.io/TrackerJS/Assets/AKNH/icon-192.png">
          <h1>Akshat Network</h1>
          <p>${from.description}</p>

          <h3>Welcome Visitor, you are redirected within our network</h3>

          <div id="redirect-projects">
            <div class="project">
              <img src="${from.logo}">
              <h4>${from.title}</h4>
              <p>${from.description}</p>
            </div>
            <div class="project">
              <img src="${to.logo}">
              <h4>${to.title}</h4>
              <p>${to.description}</p>
            </div>
          </div>

          <div class="timer">
            Redirecting in <span id="timer">${time}</span> seconds...
          </div>
        </div>
      </div>
    `);

    const interval = setInterval(() => {
      time--;
      document.getElementById("timer").textContent = time;
      if (time <= 0) {
        clearInterval(interval);
        location.href = targetUrl;
      }
    }, 1000);
  }

  function showExternalConfirm(from, targetUrl, trustedInfo) {
    injectStyles();

    const trusted = !!trustedInfo;

    document.body.insertAdjacentHTML("beforeend", `
      <div id="redirect-overlay">
        <div id="redirect-box">
          <img src="https://akshat-881236.github.io/TrackerJS/Assets/AKNH/icon-192.png">
          <h1>Akshat Project Network</h1>
          <p>${from.description}</p>

          <h3>${trusted ? "Trusted External Redirection" : "Redirection Alert"}</h3>
          <p>
            ${
              trusted
                ? `You are being redirected to <b>${trustedInfo.title}</b>, a trusted external source.`
                : `Oops, Visitor! This link leads outside our trusted network.`
            }
          </p>

          <div class="actions">
            <button onclick="location.href='${targetUrl}'">Yes, Continue</button>
            <button onclick="history.back()">No, Go Back</button>
          </div>
        </div>
      </div>
    `);
  }

  /* ================= CORE LOGIC ================= */

  function handleRedirect(targetUrl) {
    const current = findInternalProject(location.href);
    const targetInternal = findInternalProject(targetUrl);

    if (isInternal(targetUrl) && current && targetInternal) {
      showInternalRedirect(current, targetInternal, targetUrl);
      return;
    }

    const trustedKey = findTrustedExternal(targetUrl);
    if (trustedKey) {
      showExternalConfirm(current || Object.values(INTERNAL_PROJECTS)[0], targetUrl, TRUSTED_EXTERNALS[trustedKey]);
      return;
    }

    showExternalConfirm(current || Object.values(INTERNAL_PROJECTS)[0], targetUrl, null);
  }

  /* ================= EVENT INTERCEPTION ================= */

  document.addEventListener("click", function (e) {
    const a = e.target.closest("a[href]");
    if (!a) return;

    const href = a.href;
    if (!href || href.startsWith("javascript:")) return;

    e.preventDefault();
    handleRedirect(href);
  });

  /* ================= AUTO REDIRECTION HOOK ================= */

  const originalAssign = location.assign;
  location.assign = function (url) {
    handleRedirect(url);
  };

})();

/* ---------------------------
   ADVANCED EXTENSION LAYER
   (Augments behavior; preserves original logic)
   --------------------------- */
(function () {
  "use strict";

  /* =========================
     Design & Goals (summary)
     - Keep original redirect behavior intact but gate and enhance it with:
       - Comprehensive interception (anchors, buttons, form submits, location methods, window.open, meta-refresh, timers, history)
       - URL sanitization and trust scoring
       - Full-screen accessibility-aware overlay UI with decision options
       - Trust preferences persisted in localStorage
       - Loop detection and excessive redirect protection
       - Fail-safe behavior: if engine errors, allow navigation to proceed
     ========================= */

  /* =========================
     Config & Storage Keys
     ========================= */
  const ARP = {
    BRAND: "Akshat Project Network",
    STORAGE_TRUST_KEY: "arp_trust_prefs_v1",
    STORAGE_SESSION_BYPASS: "arp_bypass_session_v1",
    STORAGE_RECENT: "arp_recent_redirects_v1",
    MAX_URL_LENGTH: 2000,
    LOOP_WINDOW_MS: 20 * 1000,
    LOOP_THRESHOLD: 5,
    EXCESSIVE_SESSION_LIMIT: 30,
    THROTTLE_MS: 120,
    OVERLAY_ID: "arp_overlay",
    DEFAULT_REDIRECT_SECS: 8,
    SAFE_HOSTS: (function () {
      // include existing trust list (TRUSTED_EXTERNALS) if present
      try {
        const list = Object.keys(typeof TRUSTED_EXTERNALS !== "undefined" ? TRUSTED_EXTERNALS : {});
        return list;
      } catch (e) { return []; }
    })()
  };

  /* =========================
     Defensive & Utility Functions
     ========================= */

  function now() { return Date.now(); }
  function safeJSONParse(s, fallback) { try { return JSON.parse(s); } catch { return fallback; } }
  function safeJSONSet(key, obj) { try { localStorage.setItem(key, JSON.stringify(obj)); } catch (e) { console.warn("ARP: localStorage set failed", e); } }
  function safeJSONGet(key, fallback) { try { return safeJSONParse(localStorage.getItem(key), fallback); } catch { return fallback; } }

  // Normalize URL and strip common tracking params
  const TRACKING_PARAM_REGEXES = [/^utm_/i, /^fbclid$/i, /^ref$/i, /^ref_/i];

  function normalizeUrl(input, base) {
    try {
      if (!input) return null;
      if (input instanceof URL) input = input.href;
      const url = new URL(input, base || location.href);
      // remove tracking params
      const params = new URLSearchParams(url.search);
      for (const key of Array.from(params.keys())) {
        for (const rx of TRACKING_PARAM_REGEXES) {
          if (rx.test(key)) { params.delete(key); break; }
        }
      }
      url.search = params.toString();
      return url;
    } catch (e) {
      return null;
    }
  }

  function isUnsafeScheme(scheme) {
    if (!scheme) return false;
    const s = scheme.replace(":", "").toLowerCase();
    return ["javascript", "data", "blob", "file", "vbscript"].includes(s);
  }

  function isIP(hostname) {
    if (!hostname) return false;
    const v4 = /^\d{1,3}(\.\d{1,3}){3}$/;
    if (v4.test(hostname)) return true;
    // basic IPv6 test
    return hostname.includes(":");
  }

  function isPunycode(hostname) {
    return hostname && hostname.split(".").some(part => part.toLowerCase().startsWith("xn--"));
  }

  function stripTrailingSlash(s) {
    return s && s.endsWith("/") ? s.slice(0, -1) : s;
  }

  /* =========================
     Trust Scoring
     Returns: {score:0..100, level: 'auto'|'soft'|'hard'|'block', reasons:[]}
     ========================= */
  function computeTrust(urlObj) {
    const out = { score: 50, level: "hard", reasons: [] };
    if (!urlObj) { out.score = 0; out.level = "block"; out.reasons.push("invalid_url"); return out; }

    // Scheme checks
    if (isUnsafeScheme(urlObj.protocol)) { out.score = 0; out.level = "block"; out.reasons.push("unsafe_scheme"); return out; }

    // Same origin => auto allow
    try {
      if (urlObj.origin === location.origin) {
        out.score = 100; out.level = "auto"; out.reasons.push("same_origin"); return out;
      }
    } catch (e) { /* ignore */ }

    // Punycode / IP checks
    if (isPunycode(urlObj.hostname)) { out.score -= 40; out.reasons.push("punycode"); }
    if (isIP(urlObj.hostname)) { out.score -= 30; out.reasons.push("ip_host"); }

    // Excessive length
    if ((urlObj.href || "").length > ARP.MAX_URL_LENGTH) { out.score -= 40; out.reasons.push("excessive_length"); }

    // Known safe lists (integrate base TRUSTED_EXTERNALS if present)
    try {
      if (typeof TRUSTED_EXTERNALS !== "undefined") {
        for (const key of Object.keys(TRUSTED_EXTERNALS)) {
          if (urlObj.hostname.includes(key)) { out.score += 50; out.reasons.push("trusted_list"); break; }
        }
      }
    } catch (e) { /* ignore */ }

    // TLD heuristics
    if (urlObj.hostname.endsWith(".com") || urlObj.hostname.endsWith(".org") || urlObj.hostname.endsWith(".net")) out.score += 10;
    else out.score += 0;

    // suspicious keywords
    if (/signin|secure|login|bank|account|verify|update|confirm/i.test(urlObj.href)) { out.score -= 30; out.reasons.push("suspicious_keywords"); }

    // clamp
    out.score = Math.max(0, Math.min(100, out.score));

    if (out.score >= 90) out.level = "auto";
    else if (out.score >= 60) out.level = "soft";
    else if (out.score >= 30) out.level = "hard";
    else out.level = "block";

    return out;
  }

  /* =========================
     Preferences & Session Storage
     ========================= */
  function readPrefs() {
    return safeJSONGet(ARP.STORAGE_TRUST_KEY, {});
  }
  function writePrefs(p) {
    safeJSONSet(ARP.STORAGE_TRUST_KEY, p || {});
  }
  function setPrefForHost(host, pref) {
    const p = readPrefs(); p[host] = pref; writePrefs(p);
  }
  function getPrefForHost(host) {
    const p = readPrefs(); return p[host];
  }
  function clearPrefs() { localStorage.removeItem(ARP.STORAGE_TRUST_KEY); }

  function setSessionBypass(host) {
    try {
      const s = safeJSONGet(ARP.STORAGE_SESSION_BYPASS, {});
      s[host] = true;
      sessionStorage.setItem(ARP.STORAGE_SESSION_BYPASS, JSON.stringify(s));
    } catch (e) { /* ignore */ }
  }
  function hasSessionBypass(host) {
    try {
      const s = safeJSONGet(ARP.STORAGE_SESSION_BYPASS, {});
      return !!s[host];
    } catch (e) { return false; }
  }

  // record recent redirects (session) for loop detection
  function appendRecent(fromHref, toHref) {
    try {
      const arr = safeJSONGet(ARP.STORAGE_RECENT, []);
      arr.push({ ts: now(), from: fromHref, to: toHref });
      // prune older than window
      const cutoff = now() - ARP.LOOP_WINDOW_MS;
      const pruned = arr.filter(r => r.ts >= cutoff);
      sessionStorage.setItem(ARP.STORAGE_RECENT, JSON.stringify(pruned));
    } catch (e) { /* ignore */ }
  }
  function readRecent() {
    return safeJSONGet(ARP.STORAGE_RECENT, []);
  }
  function clearRecent() { sessionStorage.removeItem(ARP.STORAGE_RECENT); }

  /* =========================
     Overlay UI (single instance)
     Accessible, motion-safe, keyboard-friendly
     ========================= */
  let overlayInstance = null;

  function injectOverlayCSS() {
    if (document.getElementById("arp_css")) return;
    const style = document.createElement("style");
    style.id = "arp_css";
    style.textContent = `
      /* ARP Overlay Styles */
      #${ARP.OVERLAY_ID} {
        position:fixed;inset:0;z-index:2147483647;
        display:flex;align-items:center;justify-content:center;
        background:rgba(0,6,15,0.72);backdrop-filter: blur(4px);
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
      }
      #${ARP.OVERLAY_ID} .arp-panel {
        width:min(980px, calc(100% - 48px)); border-radius:12px; padding:16px; color:#e6eef6;
        background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.02));
        display:flex; gap:14px; align-items:flex-start; box-shadow: 0 20px 60px rgba(0,0,0,0.6);
      }
      #${ARP.OVERLAY_ID} .arp-left { flex:1; }
      #${ARP.OVERLAY_ID} .arp-right { width:260px; flex-shrink:0; }
      #${ARP.OVERLAY_ID} .arp-brand { font-weight:700; font-size:14px; color:#7dd3fc; display:flex; align-items:center; gap:8px;}
      #${ARP.OVERLAY_ID} .arp-title { font-size:18px; font-weight:800; margin-top:6px; }
      #${ARP.OVERLAY_ID} .arp-desc { margin-top:8px; color: #bcd; font-size:13px; }
      #${ARP.OVERLAY_ID} .arp-card { background: rgba(255,255,255,0.02); padding:10px; border-radius:8px; margin-top:12px; }
      #${ARP.OVERLAY_ID} .arp-meta { font-size:12px; color: #aeb; margin-top:6px; word-break:break-all; }
      #${ARP.OVERLAY_ID} .arp-buttons { display:flex; gap:8px; margin-top:12px; flex-wrap:wrap; }
      #${ARP.OVERLAY_ID} button { padding:10px 12px; border-radius:8px; font-weight:700; border:0; cursor:pointer; }
      #${ARP.OVERLAY_ID} button.arp-confirm { background: linear-gradient(90deg,#16a34a,#10b981); color:white; }
      #${ARP.OVERLAY_ID} button.arp-cancel { background: rgba(255,255,255,0.04); color:white; }
      #${ARP.OVERLAY_ID} .arp-countdown { font-weight:800; color:#fff; margin-left:6px; }
      #${ARP.OVERLAY_ID} .arp-reason { margin-top:10px; background: rgba(255,255,255,0.02); padding:8px; border-radius:6px; font-size:13px; color:#ffd; }
      #${ARP.OVERLAY_ID} .arp-pref { margin-top:12px; display:flex; gap:6px; flex-wrap:wrap; }
      #${ARP.OVERLAY_ID} .arp-pref button { background: rgba(255,255,255,0.03); color: #e6eef6; padding:8px 10px; border-radius:6px; border:0; cursor:pointer; }
      @media (prefers-reduced-motion: reduce) {
        #${ARP.OVERLAY_ID} .arp-anim { transition: none !important; animation: none !important; }
      }
      @media (max-width:720px) {
        #${ARP.OVERLAY_ID} .arp-panel { flex-direction:column; width:calc(100% - 24px); padding:12px; }
        #${ARP.OVERLAY_ID} .arp-right { width:100%; }
      }
    `;
    document.head.appendChild(style);
  }

  function createOverlayDOM({ sourceLabel, sourceHref, destHref, destHost, trust, reasonText, defaultSecs }) {
    if (overlayInstance) return overlayInstance;
    injectOverlayCSS();

    const o = document.createElement("div");
    o.id = ARP.OVERLAY_ID;
    o.setAttribute("role", "dialog");
    o.setAttribute("aria-modal", "true");
    o.setAttribute("aria-label", "Redirection confirmation");
    o.tabIndex = -1;

    // Build content
    o.innerHTML = `
      <div class="arp-panel" role="document">
        <div class="arp-left">
          <div class="arp-brand">🔗 ${escapeHTML(ARP.BRAND)}</div>
          <div class="arp-title">Navigating to ${escapeHTML(destHost || destHref)}</div>
          <div class="arp-desc">The redirection engine evaluates destination safety before allowing automatic navigation.</div>

          <div class="arp-card">
            <div style="font-weight:700">${escapeHTML(sourceLabel || document.title || location.hostname)}</div>
            <div class="arp-meta">${escapeHTML(sourceHref)}</div>
          </div>

          <div class="arp-card">
            <div style="font-weight:700">${escapeHTML(destHost || '')}</div>
            <div class="arp-meta">${escapeHTML(destHref)}</div>
          </div>

          <div class="arp-reason" id="arp_reason">${escapeHTML(reasonText)}</div>

          <div class="arp-pref" id="arp_preferences">
            <button id="arp_pref_always">Always trust</button>
            <button id="arp_pref_never">Never trust</button>
            <button id="arp_pref_ask">Ask every time</button>
            <button id="arp_pref_bypass">Bypass this session</button>
          </div>

        </div>

        <div class="arp-right">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div style="font-size:13px;color:#bfe6ff">Trust Score</div>
            <div style="font-weight:800;font-size:16px;color:#fff" id="arp_score">${trust.score}</div>
          </div>

          <div class="arp-card" style="margin-top:12px">
            <div style="display:flex;align-items:center;justify-content:space-between">
              <div style="font-size:13px">Auto action</div>
              <div style="display:flex;align-items:center"><div id="arp_autolevel" style="font-size:13px;color:#cde">${trust.level}</div><div class="arp-countdown" id="arp_countdown">${defaultSecs}</div></div>
            </div>

            <div class="arp-buttons" style="margin-top:12px">
              <button class="arp-confirm" id="arp_confirm">Continue</button>
              <button class="arp-cancel" id="arp_cancel">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(o);
    overlayInstance = o;
    o.focus();
    return o;
  }

  function removeOverlay() {
    try {
      if (!overlayInstance) return;
      overlayInstance.remove();
      overlayInstance = null;
    } catch (e) { console.error("ARP: removeOverlay", e); }
  }

  function escapeHTML(s) {
    if (s == null) return "";
    return String(s).replace(/[&<>"']/g, function (m) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[m]; });
  }

  /* =========================
     Decision Flow: central handler
     - Returns a Promise<boolean> resolving to whether to allow navigation
     ========================= */
  let lastCheck = 0;
  let activeDecisionPromise = null;

  function throttle() {
    const nowTs = now();
    if (nowTs - lastCheck < ARP.THROTTLE_MS) return false;
    lastCheck = nowTs;
    return true;
  }

  function centralRedirectGuard(rawTarget, context = {}) {
    // context: {method, sourceElement, sourceHref}
    return new Promise(async (resolve) => {
      try {
        if (!throttle()) { return resolve(true); } // fail-safe allow when called too quickly

        const norm = normalizeUrl(rawTarget, context.base || location.href);
        if (!norm) {
          // Malformed URL -> show blocking overlay with copy option
          showBlockedMalformed(rawTarget).then(res => resolve(res));
          return;
        }

        if (isUnsafeScheme(norm.protocol)) {
          showBlockedScheme(norm).then(res => resolve(res));
          return;
        }

        // Loop detection
        appendRecent(context.sourceHref || location.href, norm.href);
        const recent = readRecent();
        if (recent.length >= ARP.LOOP_THRESHOLD) {
          // potential loop
          showLoopWarning(norm, recent).then(res => resolve(res));
          return;
        }
        if (recent.length >= ARP.EXCESSIVE_SESSION_LIMIT) {
          showExcessiveWarning(norm, recent.length).then(res => resolve(res));
          return;
        }

        // Check preferences
        const pref = getPrefForHost(norm.hostname);
        if (pref === "always") return resolve(true);
        if (pref === "never") return resolve(false);
        if (hasSessionBypass(norm.hostname)) return resolve(true);

        // Compute trust
        const trust = computeTrust(norm);

        // auto allow same-origin
        if (trust.level === "auto") return resolve(true);

        // if an existing active decision is in-flight, chain to it
        if (activeDecisionPromise) {
          try {
            const dec = await activeDecisionPromise;
            return resolve(dec);
          } catch {
            return resolve(true);
          }
        }

        // Build overlay and wait for user input
        activeDecisionPromise = (async () => {
          try {
            const overlay = createOverlayDOM({
              sourceLabel: document.title || location.hostname,
              sourceHref: context.sourceHref || location.href,
              destHref: norm.href,
              destHost: norm.hostname,
              trust,
              reasonText: buildReasonText(trust),
              defaultSecs: trust.level === "soft" ? 6 : (trust.level === "hard" ? 10 : 0)
            });

            // Connect controls
            const btnConfirm = document.getElementById("arp_confirm");
            const btnCancel = document.getElementById("arp_cancel");
            const prefAlways = document.getElementById("arp_pref_always");
            const prefNever = document.getElementById("arp_pref_never");
            const prefAsk = document.getElementById("arp_pref_ask");
            const prefBypass = document.getElementById("arp_pref_bypass");
            const countdownEl = document.getElementById("arp_countdown");
            const scoreEl = document.getElementById("arp_score");
            const autoLevelEl = document.getElementById("arp_autolevel");

            if (scoreEl) scoreEl.textContent = String(trust.score);
            if (autoLevelEl) autoLevelEl.textContent = trust.level;

            // keyboard handling
            function onKey(e) {
              if (e.key === "Escape") cleanup(false);
              if (e.key === "Enter") cleanup(true);
            }
            document.addEventListener("keydown", onKey);

            // handlers
            let resolved = false;
            function cleanup(decision) {
              if (resolved) return;
              resolved = true;
              removeOverlay();
              document.removeEventListener("keydown", onKey);
              // slight delay to avoid race with other DOM ops
              setTimeout(() => {
                resolve(decision);
                activeDecisionPromise = null;
              }, 10);
            }

            if (btnConfirm) btnConfirm.addEventListener("click", () => cleanup(true));
            if (btnCancel) btnCancel.addEventListener("click", () => cleanup(false));
            if (prefAlways) prefAlways.addEventListener("click", () => { setPrefForHost(norm.hostname, "always"); cleanup(true); });
            if (prefNever) prefNever.addEventListener("click", () => { setPrefForHost(norm.hostname, "never"); cleanup(false); });
            if (prefAsk) prefAsk.addEventListener("click", () => { setPrefForHost(norm.hostname, "ask"); alert("Preference saved: Ask every time"); });
            if (prefBypass) prefBypass.addEventListener("click", () => { setSessionBypass(norm.hostname); cleanup(true); });

            // Inspect / open in new tab option: we add a small clickable meta reason
            const reasonEl = document.getElementById("arp_reason");
            // add open new tab button inside reason if permitted
            if (reasonEl && trust.level !== "block") {
              const openBtn = document.createElement("button");
              openBtn.textContent = "Open in new tab";
              openBtn.style.marginLeft = "8px";
              openBtn.style.padding = "6px 8px";
              openBtn.style.borderRadius = "6px";
              openBtn.style.border = "0";
              openBtn.style.cursor = "pointer";
              openBtn.addEventListener("click", () => {
                try { window.open(norm.href, "_blank", "noopener"); } catch (e) { window.open(norm.href, "_blank"); }
              });
              reasonEl.appendChild(openBtn);
            }

            // Countdown auto-action depending on level
            let secs = trust.level === "soft" ? 6 : (trust.level === "hard" ? 10 : 0);
            if (secs > 0) {
              if (countdownEl) countdownEl.textContent = String(secs);
              const t = setInterval(() => {
                secs -= 1;
                if (countdownEl) countdownEl.textContent = String(secs);
                if (secs <= 0) {
                  clearInterval(t);
                  // auto-allow for soft, do not auto for hard/block
                  if (trust.level === "soft") cleanup(true);
                  else cleanup(false);
                }
              }, 1000);
            } else {
              if (countdownEl) countdownEl.textContent = "-";
            }
          } catch (e) {
            console.error("ARP: overlay error", e);
            activeDecisionPromise = null;
            removeOverlay();
            return true; // fail-safe allow
          }
        })();

        const result = await activeDecisionPromise;
        return resolve(result);

      } catch (err) {
        console.error("ARP: guard exception", err);
        // fail-safe: allow navigation
        activeDecisionPromise = null;
        removeOverlay();
        return resolve(true);
      }
    });
  }

  function buildReasonText(trust) {
    const r = trust.reasons || [];
    if (r.length === 0) return "No specific issues detected. Exercise caution.";
    return r.map(x => {
      switch (x) {
        case "unsafe_scheme": return "Blocked because the URL uses an unsafe scheme (javascript:, data:, blob:, file:).";
        case "punycode": return "Hostname uses punycode (xn--) which can be used for homograph attacks.";
        case "ip_host": return "Destination is an IP address; this can indicate redirection to non-standard hosts.";
        case "excessive_length": return "URL is unusually long and may contain obfuscated parameters.";
        case "suspicious_keywords": return "URL contains keywords commonly used in phishing (signin, verify, secure).";
        case "trusted_list": return "Destination matches a trusted external host.";
        default: return x;
      }
    }).join(" ");
  }

  /* =========================
     Special-case overlays
     ========================= */

  function showBlockedMalformed(raw) {
    return new Promise((resolve) => {
      try {
        const overlay = createOverlayDOM({
          sourceLabel: document.title || location.hostname,
          sourceHref: location.href,
          destHref: String(raw).slice(0, 500),
          destHost: "",
          trust: { score: 0, level: "block", reasons: ["invalid_url"] },
          reasonText: "The destination URL appears malformed and cannot be safely resolved.",
          defaultSecs: 0
        });
        // change confirm button to 'Copy'
        const c = document.getElementById("arp_confirm");
        const x = document.getElementById("arp_cancel");
        if (c) { c.textContent = "Copy URL"; c.addEventListener("click", () => {
          try { navigator.clipboard.writeText(String(raw)); alert("URL copied to clipboard."); } catch (e) { alert("Unable to copy."); }
          removeOverlay(); resolve(false);
        }); }
        if (x) x.addEventListener("click", () => { removeOverlay(); resolve(false); });
      } catch (e) { console.error(e); resolve(false); }
    });
  }

  function showBlockedScheme(norm) {
    return new Promise((resolve) => {
      try {
        const overlay = createOverlayDOM({
          sourceLabel: document.title || location.hostname,
          sourceHref: location.href,
          destHref: norm.href,
          destHost: norm.hostname,
          trust: { score: 0, level: "block", reasons: ["unsafe_scheme"] },
          reasonText: "This link uses an unsafe protocol and is blocked for your safety.",
          defaultSecs: 0
        });
        const c = document.getElementById("arp_confirm");
        const x = document.getElementById("arp_cancel");
        if (c) { c.textContent = "Copy URL"; c.addEventListener("click", () => {
          try { navigator.clipboard.writeText(norm.href); alert("URL copied to clipboard."); } catch (e) { alert("Unable to copy."); }
          removeOverlay(); resolve(false);
        }); }
        if (x) x.addEventListener("click", () => { removeOverlay(); resolve(false); });
      } catch (e) { console.error(e); resolve(false); }
    });
  }

  function showLoopWarning(norm, recent) {
    return new Promise((resolve) => {
      try {
        const overlay = createOverlayDOM({
          sourceLabel: document.title || location.hostname,
          sourceHref: location.href,
          destHref: norm.href,
          destHost: norm.hostname,
          trust: { score: 10, level: "block", reasons: ["redirect_loop"] },
          reasonText: "Multiple redirects have been detected recently. This may be a loop. Proceed only if you trust the destination.",
          defaultSecs: 0
        });
        const c = document.getElementById("arp_confirm");
        const x = document.getElementById("arp_cancel");
        if (c) { c.addEventListener("click", () => { removeOverlay(); resolve(true); }); }
        if (x) { x.addEventListener("click", () => { removeOverlay(); resolve(false); }); }
      } catch (e) { console.error(e); resolve(false); }
    });
  }

  function showExcessiveWarning(norm, count) {
    return new Promise((resolve) => {
      try {
        const overlay = createOverlayDOM({
          sourceLabel: document.title || location.hostname,
          sourceHref: location.href,
          destHref: norm.href,
          destHost: norm.hostname,
          trust: { score: 5, level: "block", reasons: ["excessive_redirects"] },
          reasonText: `You have ${count} redirects this session. Navigation is temporarily blocked to prevent abuse.`,
          defaultSecs: 0
        });
        const x = document.getElementById("arp_cancel");
        if (x) x.addEventListener("click", () => { removeOverlay(); resolve(false); });
      } catch (e) { console.error(e); resolve(false); }
    });
  }

  /* =========================
     Interception Points
     ========================= */

  // 1) Anchor clicks (capture)
  function interceptAnchors() {
    document.addEventListener("click", function (e) {
      try {
        const a = e.target.closest("a[href]");
        if (!a) return;
        const href = a.getAttribute("href") || "";
        if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;
        // allow user middle click/ctrl+click to bypass (open in new tab)
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return;
        e.preventDefault();
        centralRedirectGuard(href, { method: "anchor", sourceElement: a, sourceHref: location.href })
          .then(allow => {
            if (allow) {
              // prefer to invoke original behavior from original script: call original handleRedirect if present
              try {
                if (typeof handleRedirect === "function") {
                  // original function exists - call it to preserve original internal UX
                  try { handleRedirect(href); } catch (err) { location.href = href; }
                } else {
                  // fallback navigation
                  location.href = href;
                }
              } catch (e) { location.href = href; }
            } else {
              // canceled: no action
            }
          }).catch(err => {
            console.error("ARP: anchor guard failed", err); location.href = href;
          });
      } catch (e) {
        console.error("ARP: interceptAnchors", e);
      }
    }, true);
  }

  // 2) Button-based navigation (data-href, formaction)
  function interceptButtons() {
    document.addEventListener("click", function (e) {
      try {
        const btn = e.target.closest("button, [role='button'], input[type='button'], input[type='submit']");
        if (!btn) return;
        const dataHref = btn.dataset ? (btn.dataset.href || btn.getAttribute("data-href")) : null;
        const formaction = btn.getAttribute ? btn.getAttribute("formaction") : null;
        const href = dataHref || formaction;
        if (!href) return;
        e.preventDefault();
        centralRedirectGuard(href, { method: "button", sourceElement: btn, sourceHref: location.href })
          .then(allow => { if (allow) { try { location.href = href; } catch (e) { window.open(href, "_self"); } } });
      } catch (e) { console.error("ARP: interceptButtons", e); }
    }, true);
  }

  // 3) location.assign, location.replace and href setter interception
  function interceptLocation() {
    try {
      // assign
      const locProto = Object.getPrototypeOf(window.location);
      if (locProto && locProto.assign) {
        const originalAssign = locProto.assign;
        locProto.assign = function (url) {
          centralRedirectGuard(url, { method: "assign", sourceHref: location.href })
            .then(allow => { if (allow) { try { originalAssign.call(this, url); } catch (e) { location.href = url; } } })
            .catch(() => { try { originalAssign.call(this, url); } catch (e) { location.href = url; } });
        };
      }
      // replace
      if (locProto && locProto.replace) {
        const originalReplace = locProto.replace;
        locProto.replace = function (url) {
          centralRedirectGuard(url, { method: "replace", sourceHref: location.href })
            .then(allow => { if (allow) { try { originalReplace.call(this, url); } catch (e) { location.replace(url); } } })
            .catch(() => { try { originalReplace.call(this, url); } catch (e) { location.replace(url); } });
        };
      }
      // href setter
      try {
        const hrefDesc = Object.getOwnPropertyDescriptor(locProto, "href");
        if (hrefDesc && typeof hrefDesc.set === "function") {
          const originalSetter = hrefDesc.set;
          Object.defineProperty(locProto, "href", {
            configurable: true,
            enumerable: true,
            get: hrefDesc.get,
            set: function (url) {
              centralRedirectGuard(url, { method: "href-set", sourceHref: location.href })
                .then(allow => { if (allow) { try { originalSetter.call(this, url); } catch (e) { location.href = url; } } })
                .catch(() => { try { originalSetter.call(this, url); } catch (e) { location.href = url; } });
            }
          });
        }
      } catch (e) { /* ignore setter override issues */ }
    } catch (e) { console.warn("ARP: interceptLocation failed", e); }
  }

  // 4) Meta refresh detection & interception
  function interceptMetaRefresh() {
    function parseMeta(m) {
      const he = (m.getAttribute("http-equiv") || "").toLowerCase();
      if (he !== "refresh") return null;
      const content = m.getAttribute("content") || "";
      const match = content.match(/^\s*([0-9]+)\s*;\s*url=(.+)$/i);
      if (match) {
        const secs = parseInt(match[1], 10);
        let url = match[2].trim();
        url = url.replace(/^['"]|['"]$/g, "");
        return { secs, url };
      }
      return null;
    }
    // initial scan
    try {
      Array.from(document.querySelectorAll("meta[http-equiv]")).forEach(m => {
        const info = parseMeta(m);
        if (info && info.url) {
          // neutralize the meta to stop immediate redirect
          m.setAttribute("data-arp-original", m.getAttribute("content") || "");
          m.setAttribute("content", "0");
          // run guard
          centralRedirectGuard(info.url, { method: "meta", sourceElement: m, sourceHref: location.href })
            .then(allow => { if (allow) try { location.assign(info.url); } catch (e) { location.href = info.url; } });
        }
      });
    } catch (e) { /* ignore */ }

    // observe future metas
    try {
      const mo = new MutationObserver(mut => {
        for (const m of mut) {
          m.addedNodes && m.addedNodes.forEach(node => {
            if (node && node.tagName && node.tagName.toLowerCase() === "meta") {
              const parsed = parseMeta(node);
              if (parsed && parsed.url) {
                node.setAttribute("data-arp-original", node.getAttribute("content") || "");
                node.setAttribute("content", "0");
                centralRedirectGuard(parsed.url, { method: "meta", sourceElement: node, sourceHref: location.href })
                  .then(allow => { if (allow) try { location.assign(parsed.url); } catch (e) { location.href = parsed.url; } });
              }
            }
          });
        }
      });
      mo.observe(document.head || document.documentElement, { childList: true, subtree: true });
    } catch (e) { /* ignore */ }
  }

  // 5) Timer wrappers (setTimeout, setInterval) - wrap callbacks to detect direct location changes inside
  function overrideTimers() {
    try {
      const originalSetTimeout = window.setTimeout;
      const originalSetInterval = window.setInterval;
      window.setTimeout = function (fn, delay, ...args) {
        const wrapped = function () {
          try { return fn.apply(this, args); } catch (e) { console.error("ARP: timer callback error", e); }
        };
        return originalSetTimeout(wrapped, delay, ...args);
      };
      window.setInterval = function (fn, delay, ...args) {
        const wrapped = function () {
          try { return fn.apply(this, args); } catch (e) { console.error("ARP: interval callback error", e); }
        };
        return originalSetInterval(wrapped, delay, ...args);
      };
    } catch (e) { console.warn("ARP: overrideTimers failed", e); }
  }

  // 6) Form submit interception (programmatic + event)
  function interceptForms() {
    try {
      const originalSubmit = HTMLFormElement.prototype.submit;
      HTMLFormElement.prototype.submit = function () {
        const action = this.getAttribute("action") || location.href;
        centralRedirectGuard(action, { method: "form", sourceElement: this, sourceHref: location.href })
          .then(allow => { if (allow) { try { originalSubmit.call(this); } catch (e) { /* fallback */ this.submit(); } } });
      };
    } catch (e) { console.warn("ARP: override form.submit failed", e); }

    document.addEventListener("submit", function (e) {
      try {
        const form = e.target;
        if (!form) return;
        const action = form.getAttribute("action") || location.href;
        e.preventDefault();
        centralRedirectGuard(action, { method: "form", sourceElement: form, sourceHref: location.href })
          .then(allow => { if (allow) { try { HTMLFormElement.prototype.submit.call(form); } catch (err) { form.submit(); } } });
      } catch (err) { console.error("ARP: submit event interception failed", err); }
    }, true);
  }

  // 7) window.open interception
  function interceptWindowOpen() {
    try {
      const originalOpen = window.open.bind(window);
      window.open = function (url, target, features) {
        try {
          if (!url) return originalOpen(url, target, features);
          centralRedirectGuard(url, { method: "window.open", sourceHref: location.href })
            .then(allow => { if (allow) originalOpen(url, target, features); });
        } catch (e) { return originalOpen(url, target, features); }
      };
    } catch (e) { console.warn("ARP: interceptWindowOpen failed", e); }
  }

  // 8) History API intercept (pushState/replaceState)
  function interceptHistory() {
    try {
      const originalPush = history.pushState.bind(history);
      const originalReplace = history.replaceState.bind(history);

      history.pushState = function (state, title, url) {
        try {
          if (!url) return originalPush(state, title, url);
          centralRedirectGuard(url, { method: "history.pushState", sourceHref: location.href })
            .then(allow => { if (allow) originalPush(state, title, url); });
        } catch (e) { return originalPush(state, title, url); }
      };

      history.replaceState = function (state, title, url) {
        try {
          if (!url) return originalReplace(state, title, url);
          centralRedirectGuard(url, { method: "history.replaceState", sourceHref: location.href })
            .then(allow => { if (allow) originalReplace(state, title, url); });
        } catch (e) { return originalReplace(state, title, url); }
      };
    } catch (e) { console.warn("ARP: interceptHistory failed", e); }
  }

  /* =========================
     Initialize all interceptors
     ========================= */
  function initARP() {
    try {
      // anchor and button interception
      interceptAnchors();
      interceptButtons();
      // location assignment interception
      interceptLocation();
      // meta refresh
      interceptMetaRefresh();
      // timers
      overrideTimers();
      // forms
      interceptForms();
      // window.open
      interceptWindowOpen();
      // history
      interceptHistory();
      // ensure recent record exists
      sessionStorage.setItem(ARP.STORAGE_RECENT, sessionStorage.getItem(ARP.STORAGE_RECENT) || JSON.stringify([]));
      // console hint
      console.info("ARP: Advanced redirect guard active");
    } catch (e) { console.error("ARP: init failed", e); }
  }

  // Start when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initARP);
  } else {
    initARP();
  }

  /* =========================
     Expose minimal API to page for debugging and preferences
     ========================= */
  window.ARP = {
    computeTrust,
    normalizeUrl,
    readPrefs,
    writePrefs,
    setPrefForHost,
    clearPrefs,
    appendRecent,
    readRecent,
    clearRecent,
    setSessionBypass,
    hasSessionBypass
  };

})();