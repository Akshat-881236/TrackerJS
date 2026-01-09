/**
 * identity-system-881236.js
 * Advanced Identity Management System for Akshat (ID: 881236)
 *
 * Updated: notification system now supports multiple notifications (home + subpages)
 * - notification_list: array of notification objects for project home pages and subpages
 * - scheduleNotifications: triggers notifications in sequence after a base delay (VISIT_DELAY_MS)
 *   with a configurable gap between them (NOTIFICATION_GAP_MS)
 * - Notifications reuse the same Visit Card (updated per notification). If the user closes the card
 *   (or sets 'Keep Visit Card Closed'), all scheduled future notifications are cancelled until
 *   settings expiry (3 hours).
 *
 * Usage: include this script as before. Exposed API: window.AkshatIdentity.scheduleNotifications(),
 * window.AkshatIdentity.clearScheduledNotifications(), window.AkshatIdentity.setNotificationGap(ms)
 */

(function () {
  // -------------------------
  // Data structures (REQUIREMENTS)
  // -------------------------
  const keyword_db = [
    {
      keyword: "881236",
      description: "Primary Identity for Akshat Prasad, BCA Student.",
      urls: "https://akshat-881236.github.io/Portfolio-881236/, https://akshat-881236.github.io/LocalRepo/, https://akshat-881236.github.io/AkshatNetworkHub/"
    },
    {
      keyword: "BCA_Developer",
      description: "Professional profile focusing on Web Development and SEO.",
      urls: "https://akshat-881236.github.io/Portfolio-881236/, https://akshat-881236.github.io/LocalRepo/, https://akshat-881236.github.io/AkshatNetworkHub/"
    },
    {
      keyword: "KOS",
      description: "Academic Record Management System power by Akshat Network Hub",
      urls: "https://akshat-881236.github.io/Key-of-Success/, https://akshat-881236.github.io/Key-of-Success/DMC.htm , https://akshat-881236.github.io/Key-of-Success/AttendanceMGMT.htm"
    },
    {
      keyword: "DPG Degree College BCA Student",
      description: "I , Akshat Prasad , passionate student of Bachelor of Computer Application in DPG DEGREE COLLEGE.",
      urls: "https://akshat-881236.github.io/Portfolio-881236/, https://akshat-881236.github.io/LocalRepo/, https://akshat-881236.github.io/AkshatNetworkHub/"
    },
    {
      keyword: "ANH",
      description: "ANH , Akshat Network Hub is a centralized hub of all associated Akshat Projects.",
      urls: "https://akshat-881236.github.io/Portfolio-881236/, https://akshat-881236.github.io/LocalRepo/, https://akshat-881236.github.io/AkshatNetworkHub/"
    },
    {
      keyword: "Quizzone",
      description: "Quizzone is a modern quiz platform featuring MCQ quizzes across various domains: General Knowledge, Science, Social Science, Coding, Languages, AI, Machine Learning, Programming, IT, Technology, CBT, Culture & Arts, and more. Test your knowledge, upgrade your skills, and track your progress with powerful analytics.",
      urls: "https://akshat-881236.github.io/Quizzone/ , https://akshat-881236.github.io/Quizzone/Home/QuizzoneAI.htm"
    },
    {
      keyword: "Bundle of Skills",
      description: "Bundle of skills defined by Akshat in his Journal. According to Akshat Prasad , a student must focus on interrelated skills sets wrt industry requirement or their future role requirement. Like if a student want to be a Web Designer and work as UI/UX Designer , Frontend / Backend Designer, He or She must master Html , CSS and JavaScript , MERN , etc along with GIT / GITHUB, etc. Refer to ( https://akshat-881236.github.io/sitemapjs/ ) for more information.",
      urls: "https://akshat-881236.github.io/sitemapjs/ , https://akshat-881236.github.io/AkshatNetworkHub/"
    }
    // Add more keywords here
  ];

  const breadcrumbs_db = [
    { name: "Portfolio Site", link: "https://akshat-881236.github.io/Portfolio-881236/", detail: "Portfolio of Akshat Prasad" },
    { name: "Akshat Dashboard", link: "https://akshat-881236.github.io/LocalRepo/", detail: "A personal profile dashboard of Akshat Prasad" },
    { name: "Key-of-Success", link: "https://akshat-881236.github.io/Key-of-Success/", detail: "A academic record management system built by Akshat Network." },
    { name: "Quizzone", link: "https://akshat-881236.github.io/Quizzone/", detail: "Challenge yourself with quizzes from AI, ML, Programming, GK, and 20+ subjects. Join the next-generation learning revolution."},
    { name: "Akshat Network Hub", link: "https://akshat-881236.github.io/AkshatNetworkHub/", detail: "Akshat Network Hub is a centralized hub of all associated Akshat Projects."},
    { name: "Sitemap Generator", link: "https://akshat-881236.github.io/SitemapGeneratorXml/", detail: "Frontend-only PWA for generating XML, PDF, ZIP sitemaps and robots.txt with workspace management."}
  ];

  // -------------------------
  // Multiple notifications (home + subpages)
  // -------------------------
  // Each notification will be shown sequentially after VISIT_DELAY_MS with NOTIFICATION_GAP_MS between them.
  // Add project home + important subpages here.
  const notification_list = [
    // Akshat Network Hub
    {
      title: "Akshat Network Hub",
      description: "Central hub of Akshat projects — visit to explore the ecosystem.",
      url: "https://akshat-881236.github.io/AkshatNetworkHub/"
    },
    // Portfolio
    {
      title: "Portfolio - Akshat Prasad",
      description: "Personal portfolio: projects, resume, and contact.",
      url: "https://akshat-881236.github.io/Portfolio-881236/"
    },
    // LocalRepo / Dashboard
    {
      title: "Akshat Dashboard",
      description: "Personal dashboard and quick links.",
      url: "https://akshat-881236.github.io/LocalRepo/"
    },
    // Key-of-Success home + subpages
    {
      title: "Key-of-Success (KOS)",
      description: "Academic record management system by Akshat Network Hub.",
      url: "https://akshat-881236.github.io/Key-of-Success/"
    },
    {
      title: "KOS - DMC",
      description: "Detailed Marks Certificate (DMC) viewer.",
      url: "https://akshat-881236.github.io/Key-of-Success/DMC.htm"
    },
    {
      title: "KOS - Attendance",
      description: "Attendance management interface.",
      url: "https://akshat-881236.github.io/Key-of-Success/AttendanceMGMT.htm"
    },
    // Quizzone home + AI subpage
    {
      title: "Quizzone",
      description: "Take quizzes across multiple domains to test and learn.",
      url: "https://akshat-881236.github.io/Quizzone/"
    },
    {
      title: "Quizzone AI",
      description: "AI-powered quizzes and adaptive question sets.",
      url: "https://akshat-881236.github.io/Quizzone/Home/QuizzoneAI.htm"
    },
    // Sitemap Generator
    {
      title: "Sitemap Generator",
      description: "Generate XML, PDF and ZIP sitemaps for your site (PWA).",
      url: "https://akshat-881236.github.io/SitemapGeneratorXml/"
    }
  ];

  // -------------------------
  // Settings & Persistence
  // -------------------------
  const STORAGE_KEY = "ak_identity_settings_v1";
  const DEFAULT_SETTINGS = {
    notifications: true,
    breadcrumbsVisible: true,
    seoTracking: false,
    cardClosed: false // user closed the visit card (resets on settings expiry)
  };
  const SETTINGS_TTL_MS = 3 * 60 * 60 * 1000; // 3 hours

  function readSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { settings: { ...DEFAULT_SETTINGS }, expiresAt: null };
      const parsed = JSON.parse(raw);
      if (!parsed.settings) return { settings: { ...DEFAULT_SETTINGS }, expiresAt: null };
      if (!parsed.expiresAt || Date.now() > parsed.expiresAt) {
        // expired
        localStorage.removeItem(STORAGE_KEY);
        return { settings: { ...DEFAULT_SETTINGS }, expiresAt: null };
      }
      return { settings: parsed.settings, expiresAt: parsed.expiresAt };
    } catch (e) {
      console.warn("ak_identity: failed to read settings:", e);
      return { settings: { ...DEFAULT_SETTINGS }, expiresAt: null };
    }
  }

  function saveSettings(settings) {
    try {
      const expiresAt = Date.now() + SETTINGS_TTL_MS;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ settings, expiresAt }));
      scheduleExpiry(enforceSettingsExpiry, expiresAt);
    } catch (e) {
      console.warn("ak_identity: failed to save settings:", e);
    }
  }

  function enforceSettingsExpiry() {
    // Called when settings TTL expires: reset to defaults
    localStorage.removeItem(STORAGE_KEY);
    // Re-render UI parts to reflect defaults
    const current = readSettings();
    applySettings(current.settings, /*persist=*/false);
    // If notifications are enabled and cardClosed reset, schedule notifications again
    if (current.settings.notifications && !current.settings.cardClosed) {
      scheduleNotifications();
    }
  }

  // schedule a timeout to enforce expiry exactly at expiresAt
  let expiryTimeoutId = null;
  function scheduleExpiry(callback, expiresAt) {
    if (expiryTimeoutId) {
      clearTimeout(expiryTimeoutId);
      expiryTimeoutId = null;
    }
    if (!expiresAt) return;
    const ms = expiresAt - Date.now();
    if (ms <= 0) {
      callback();
      return;
    }
    expiryTimeoutId = setTimeout(callback, ms);
  }

  // -------------------------
  // CSS injection
  // -------------------------
  const STYLE_ID = "ak-identity-styles-v1";
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .ak-visit-card {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 320px;
        max-width: calc(100% - 40px);
        background: #ffffff;
        border: 1px solid #222;
        padding: 15px;
        z-index: 999999;
        box-shadow: 5px 5px 0 rgba(0,0,0,0.9);
        font-family: "Segoe UI", Roboto, "Helvetica Neue", Arial, monospace;
        color: #111;
        border-radius: 6px;
      }
      .ak-visit-card .ak-card-top {
        display:flex;
        justify-content:space-between;
        align-items:center;
        margin-bottom:10px;
      }
      .ak-visit-card a.ak-visit-link { color: #0b66ff; font-weight:700; text-decoration: none; }
      .ak-visit-card a.ak-settings-link { color: #555; text-decoration: none; cursor: pointer; }
      .ak-visit-card .ak-close-btn { cursor:pointer; user-select:none; background:transparent; border:none; font-size:18px; }
      .ak-settings-panel label { font-size:13px; display:block; margin:6px 0; }
      .ak-settings-panel button { margin-top:10px; width:100%; cursor:pointer; padding:8px; border-radius:4px; border:1px solid #222; background:#f3f3f3; }
      .ak-brand-card {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        margin: 0 auto;
        width: 100%;
        max-width: 420px;
        text-align: center;
        padding: 8px 12px;
        z-index: 1000000;
        background: linear-gradient(90deg,#111,#222);
        color: #fff;
        font-family: "Segoe UI", Roboto, Arial, monospace;
        box-shadow: 0 -2px 8px rgba(0,0,0,0.4);
        border-radius: 4px 4px 0 0;
        left: calc(50% - 210px);
      }
      .ak-brand-card a { color: #ffeb3b; font-weight:700; text-decoration:none; margin-left:6px; }
      .ak-breadcrumbs { font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial; font-size:13px; }
      .ak-breadcrumb-item { color:#0b66ff; text-decoration:none; cursor:pointer; margin:0 6px; }
      .ak-breadcrumb-strong { font-weight:700; color:#111; }
      .ak-breadcrumb-tooltip {
        position: fixed;
        background: #111;
        color: #fff;
        padding:6px 8px;
        border-radius:4px;
        font-size:12px;
        z-index: 1000001;
        pointer-events:none;
        opacity:0;
        transition: opacity .12s ease;
        max-width: 320px;
      }
    `;
    document.head.appendChild(style);
  }

  // -------------------------
  // Breadcrumbs
  // -------------------------
  function updateBreadcrumbs() {
    const nav = document.getElementById('breadcrumb-container');
    if (!nav) return;
    // Build items
    nav.classList.add("ak-breadcrumbs");
    nav.innerHTML = ""; // will populate with nodes to enable tooltip listeners
    breadcrumbs_db.forEach((item, index) => {
      const isLast = index === breadcrumbs_db.length - 1;
      const span = document.createElement('span');
      span.className = "ak-breadcrumb-item";
      span.dataset.detail = item.detail || "";
      if (isLast) {
        const strong = document.createElement('span');
        strong.className = "ak-breadcrumb-strong";
        strong.textContent = item.name;
        span.appendChild(strong);
      } else {
        const a = document.createElement('a');
        a.href = item.link;
        a.textContent = item.name;
        a.style.textDecoration = 'none';
        a.style.color = 'inherit';
        span.appendChild(a);
        const sep = document.createElement('span');
        sep.textContent = " / ";
        span.appendChild(sep);
      }
      nav.appendChild(span);
    });

    // tooltip element
    let tooltip = document.getElementById('ak-breadcrumb-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'ak-breadcrumb-tooltip';
      tooltip.className = 'ak-breadcrumb-tooltip';
      document.body.appendChild(tooltip);
    }

    // listeners for hover tooltip
    nav.querySelectorAll('.ak-breadcrumb-item').forEach(elem => {
      elem.addEventListener('mouseenter', (ev) => {
        const detail = elem.dataset.detail || "";
        if (!detail) return;
        tooltip.textContent = detail;
        tooltip.style.opacity = '1';
        positionTooltip(ev, tooltip);
      });
      elem.addEventListener('mousemove', (ev) => {
        positionTooltip(ev, tooltip);
      });
      elem.addEventListener('mouseleave', () => {
        tooltip.style.opacity = '0';
      });
    });
  }

  function positionTooltip(ev, tooltip) {
    const padding = 12;
    const tooltipRect = tooltip.getBoundingClientRect();
    let left = ev.clientX + 12;
    let top = ev.clientY + 12;
    if (left + tooltipRect.width + padding > window.innerWidth) {
      left = window.innerWidth - tooltipRect.width - padding;
    }
    if (top + tooltipRect.height + padding > window.innerHeight) {
      top = ev.clientY - tooltipRect.height - 12;
      if (top < 0) top = 8;
    }
    tooltip.style.left = left + "px";
    tooltip.style.top = top + "px";
  }

  // -------------------------
  // Visit Card (timed sequence) + Settings injection
  // -------------------------
  const VISIT_DELAY_MS = 90000; // 1.5 minutes base delay before first notification
  let NOTIFICATION_GAP_MS = 30000; // default gap between notifications (30s) - configurable
  let scheduledNotificationIds = []; // track timeouts for multiple notifications
  let visitTimeoutId = null;

  function scheduleNotifications() {
    clearScheduledNotifications();
    const { settings } = readSettings();
    if (!settings.notifications) return;
    if (settings.cardClosed) return;

    notification_list.forEach((notif, idx) => {
      const delay = VISIT_DELAY_MS + idx * NOTIFICATION_GAP_MS;
      const id = setTimeout(() => {
        // If settings have changed (closed/disabled) stop showing further notifications
        const current = readSettings();
        if (!current.settings.notifications || current.settings.cardClosed) {
          clearScheduledNotifications();
          return;
        }
        renderVisitCard(notif);
      }, delay);
      scheduledNotificationIds.push(id);
    });
  }

  function clearScheduledNotifications() {
    if (scheduledNotificationIds && scheduledNotificationIds.length) {
      scheduledNotificationIds.forEach(id => clearTimeout(id));
      scheduledNotificationIds = [];
    }
    if (visitTimeoutId) {
      clearTimeout(visitTimeoutId);
      visitTimeoutId = null;
    }
  }

  function renderVisitCard(notification) {
    // If card already present, update content to the new notification
    const existing = document.getElementById('identity-card-881236');
    if (existing) {
      // If card was previously closed via settings, do not reopen
      const current = readSettings();
      if (current.settings.cardClosed) {
        return;
      }
      updateCardContent(existing, notification);
      return;
    }

    const card = document.createElement('div');
    card.id = "identity-card-881236";
    card.className = "ak-visit-card";
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-label", "Identity Visit Card");

    card.innerHTML = `
      <div class="ak-card-top">
        <strong>${escapeHtml(notification.title)}</strong>
        <button class="ak-close-btn" aria-label="close">❌</button>
      </div>
      <p style="font-size:12px; margin:0;">${escapeHtml(notification.description)}</p>
      <div style="margin-top:12px; display:flex; justify-content:space-between; align-items:center;">
        <a class="ak-visit-link" href="${ensureHttp(notification.url)}" target="_blank" rel="noopener noreferrer">VISIT PAGE</a>
        <a class="ak-settings-link" href="javascript:void(0)" id="ak-change-settings">Change Setting</a>
      </div>
    `;
    document.body.appendChild(card);

    // event handlers
    const closeBtn = card.querySelector('.ak-close-btn');
    closeBtn.addEventListener('click', () => {
      // Remove card and persist that user closed it until settings expiry
      card.remove();
      const current = readSettings();
      current.settings.cardClosed = true;
      saveSettings(current.settings);
      clearScheduledNotifications();
    });

    const settingsLink = card.querySelector('#ak-change-settings');
    settingsLink.addEventListener('click', () => {
      // Inject settings UI into the existing card via innerHTML
      injectSettingsPanel(card);
    });
  }

  function updateCardContent(card, notification) {
    // Update existing card's content to reflect a new notification.
    // Preserve any event bindings by re-attaching needed click handlers.
    card.innerHTML = `
      <div class="ak-card-top">
        <strong>${escapeHtml(notification.title)}</strong>
        <button class="ak-close-btn" aria-label="close">❌</button>
      </div>
      <p style="font-size:12px; margin:0;">${escapeHtml(notification.description)}</p>
      <div style="margin-top:12px; display:flex; justify-content:space-between; align-items:center;">
        <a class="ak-visit-link" href="${ensureHttp(notification.url)}" target="_blank" rel="noopener noreferrer">VISIT PAGE</a>
        <a class="ak-settings-link" href="javascript:void(0)" id="ak-change-settings">Change Setting</a>
      </div>
    `;

    const closeBtn = card.querySelector('.ak-close-btn');
    closeBtn.addEventListener('click', () => {
      card.remove();
      const current = readSettings();
      current.settings.cardClosed = true;
      saveSettings(current.settings);
      clearScheduledNotifications();
    });

    const settingsLink = card.querySelector('#ak-change-settings');
    settingsLink.addEventListener('click', () => {
      injectSettingsPanel(card);
    });
  }

  function injectSettingsPanel(card) {
    const { settings } = readSettings();
    // innerHTML injection as required
    card.innerHTML = `
      <div class="ak-card-top">
        <strong>Setting Interface</strong>
        <button class="ak-close-btn" aria-label="close">❌</button>
      </div>
      <div class="ak-settings-panel" style="font-size:13px; line-height:1.6;">
        <label><input type="checkbox" id="ak_set_notifications" ${settings.notifications ? "checked" : ""}> Notifications</label>
        <label><input type="checkbox" id="ak_set_breadcrumbs" ${settings.breadcrumbsVisible ? "checked" : ""}> Breadcrumbs Visibility</label>
        <label><input type="checkbox" id="ak_set_seotrack" ${settings.seoTracking ? "checked" : ""}> SEO Identity Tracking</label>
        <label><input type="checkbox" id="ak_set_cardclosed" ${settings.cardClosed ? "checked" : ""}> Keep Visit Card Closed</label>
        <button id="ak_settings_save">Update Identity</button>
        <button id="ak_settings_reset" style="margin-top:6px;">Reset to Defaults Now</button>
        <div style="margin-top:8px; font-size:12px;">
          <label>Notification gap (ms): <input id="ak_notification_gap" type="number" value="${NOTIFICATION_GAP_MS}" style="width:100%; box-sizing:border-box; margin-top:6px;" /></label>
        </div>
      </div>
    `;
    // attach handlers (use DOM methods, not inline JS)
    const closeBtn = card.querySelector('.ak-close-btn');
    closeBtn.addEventListener('click', () => {
      card.remove();
    });

    const btnSave = card.querySelector('#ak_settings_save');
    const btnReset = card.querySelector('#ak_settings_reset');
    btnSave.addEventListener('click', () => {
      const newSettings = {
        notifications: !!document.getElementById('ak_set_notifications').checked,
        breadcrumbsVisible: !!document.getElementById('ak_set_breadcrumbs').checked,
        seoTracking: !!document.getElementById('ak_set_seotrack').checked,
        cardClosed: !!document.getElementById('ak_set_cardclosed').checked
      };
      const gapInput = document.getElementById('ak_notification_gap');
      const parsedGap = Number(gapInput && gapInput.value) || NOTIFICATION_GAP_MS;
      // persist gap in-memory (not part of settings TTL storage) but expose via API
      NOTIFICATION_GAP_MS = Math.max(1000, Math.floor(parsedGap)); // minimum 1s gap
      saveSettings(newSettings);
      applySettings(newSettings, /*persist=*/false);
      // Re-render summary inside card
      card.innerHTML = `
        <div class="ak-card-top">
          <strong>Settings Saved</strong>
          <button class="ak-close-btn" aria-label="close">❌</button>
        </div>
        <p style="font-size:13px; margin:0 0 8px 0;">Your settings are saved and will auto-reset after 3 hours.</p>
        <div style="display:flex; gap:8px;">
          <button id="ak_settings_close" style="flex:1;">Close</button>
          <button id="ak_settings_open" style="flex:1;">Re-open Settings</button>
        </div>
      `;
      card.querySelector('#ak_settings_close').addEventListener('click', () => card.remove());
      card.querySelector('#ak_settings_open').addEventListener('click', () => injectSettingsPanel(card));
      // schedule or clear notifications based on new settings
      clearScheduledNotifications();
      if (newSettings.notifications && !newSettings.cardClosed) {
        scheduleNotifications();
      }
    });

    btnReset.addEventListener('click', () => {
      localStorage.removeItem(STORAGE_KEY);
      applySettings({ ...DEFAULT_SETTINGS }, /*persist=*/false);
      // reload UI to default
      injectSettingsPanel(card);
      // reset gap to default
      NOTIFICATION_GAP_MS = 30000;
    });
  }

  // -------------------------
  // Apply settings to page
  // -------------------------
  function applySettings(settings, persist = true) {
    // breadcrumbs
    const nav = document.getElementById('breadcrumb-container');
    if (nav) {
      nav.style.display = settings.breadcrumbsVisible ? "" : "none";
    }
    // seoTracking - for demo just set data attribute (could be expanded)
    if (settings.seoTracking) {
      document.documentElement.setAttribute('data-ak-seo', 'enabled');
    } else {
      document.documentElement.removeAttribute('data-ak-seo');
    }
    if (persist) {
      saveSettings(settings);
    }
  }

  // -------------------------
  // Brand card enforcement (unremovable if script used outside allowed URL)
  // -------------------------
  const BRAND_ID = 'akshat-brand-card';
  function shouldShowBrand() {
    try {
      const host = window.location.host; // e.g. akshat-881236.github.io
      const path = window.location.pathname || "/";
      // allowed pattern: host must be akshat-881236.github.io and path like /{repo_name}/follow.htm
      const allowedHost = "akshat-881236.github.io";
      const allowedPathRegex = /^\/[^\/]+\/follow\.htm$/; // /repoName/follow.htm
      if (host === allowedHost && allowedPathRegex.test(path)) return false;
      return true;
    } catch (e) {
      return true;
    }
  }

  function createBrandCard() {
    if (document.getElementById(BRAND_ID)) return;
    const brand = document.createElement('div');
    brand.id = BRAND_ID;
    brand.className = 'ak-brand-card';
    brand.innerHTML = `
      <span>Power by Akshat Network Hub</span>
      <a href="https://akshat-881236.github.io/AkshatNetworkHub/" target="_blank" rel="noopener noreferrer" title="Visit Akshat Network Hub">Visit Akshat Network Hub</a>
    `;
    // Make it intentionally hard to remove: no close button, high z-index. Also reattach on mutation.
    document.body.appendChild(brand);
  }

  function observeAndProtectBrand() {
    const observer = new MutationObserver((mutations) => {
      const exists = document.getElementById(BRAND_ID);
      if (!exists && shouldShowBrand()) {
        // Recreate quickly
        createBrandCard();
      }
    });
    observer.observe(document.body, { childList: true, subtree: false });
    // Also listen for removals via element removal
    window.addEventListener('DOMContentLoaded', () => {
      if (shouldShowBrand()) createBrandCard();
    });
    // Ensure immediate creation if needed
    if (shouldShowBrand()) createBrandCard();
  }

  // -------------------------
  // Utilities
  // -------------------------
  function ensureHttp(url) {
    if (!url) return "#";
    if (/^https?:\/\//i.test(url)) return url;
    return "https://" + url;
  }

  // Minimal HTML-escape for text nodes we interpolate into innerHTML for safety
  function escapeHtml(str) {
    if (typeof str !== "string") return str;
    return str.replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]);
    });
  }

  // -------------------------
  // Init flow
  // -------------------------
  function init() {
    injectStyles();

    // Apply settings (load persisted or defaults)
    const { settings, expiresAt } = readSettings();
    applySettings(settings, /*persist=*/false);
    if (expiresAt) scheduleExpiry(enforceSettingsExpiry, expiresAt);

    // Render/update breadcrumbs if visible and container exists
    if (settings.breadcrumbsVisible) {
      updateBreadcrumbs();
    }

    // Schedule notifications if enabled and not closed
    if (settings.notifications && !settings.cardClosed) {
      scheduleNotifications();
    }

    // Enforce brand card if not running from allowed path
    observeAndProtectBrand();

    // Expose a minimal API for debugging / programmatic control
    window.AkshatIdentity = {
      readSettings,
      saveSettings,
      resetToDefaults: () => {
        localStorage.removeItem(STORAGE_KEY);
        applySettings({ ...DEFAULT_SETTINGS }, /*persist=*/false);
        clearScheduledNotifications();
      },
      renderVisitCard,
      renderBrandCard: createBrandCard,
      updateBreadcrumbs,
      scheduleNotifications,
      clearScheduledNotifications,
      setNotificationGap: (ms) => { NOTIFICATION_GAP_MS = Math.max(1000, Math.floor(ms)); }
    };
  }

  // start after DOM ready (to attach to breadcrumb container reliably)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();