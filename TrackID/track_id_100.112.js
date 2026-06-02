/**
 * ANH Security Governance Module — track_id_100.112.js
 * 
 * Enterprise-grade client-side security middleware for Akshat Network Hub
 * Provides:
 * - Referrer validation and trust analysis
 * - Phishing protection and threat detection
 * - URL parameter sanitization and normalization
 * - Secure runtime quarantine environment
 * - Safety diagnosis and reporting
 * - Non-intrusive security UI
 * 
 * Architecture: Privacy-first, client-side only, zero backend collection
 * 
 * @version 1.0.0
 * @author ANH Security Team
 * @license MIT
 */

(function (global) {
  'use strict';

  // ============================================================================
  // 1. CONFIGURATION & TRUSTED DATABASES
  // ============================================================================

  const TRUSTED_PREFIXES = [
    "https://akshat-881236.github.io/",
    "https://akshat-145609.github.io/",
    "https://itsakshatnetworkhub-881238.github.io/",
    "https://dpgnotes.web.app/",
    "https://anh-dashboard-881238.web.app/",
    "https://anh-dashboard-881238.web.app/admin.html"
  ];

  const EXTERNAL_DB = {
    // Source Control / Dev
    "github.com": true,
    "github.io": true,
    "githubusercontent.com": true,
    "gitlab.com": true,
    "bitbucket.org": true,

    // Social / Community
    "linkedin.com": true,
    "x.com": true,
    "twitter.com": true,
    "instagram.com": true,
    "facebook.com": true,
    "threads.net": true,
    "reddit.com": true,
    "discord.com": true,
    "discord.gg": true,
    "telegram.org": true,
    "whatsapp.com": true,
    "snapchat.com": true,
    "tiktok.com": true,
    "pinterest.com": true,
    "quora.com": true,
    "email.com": true,
    "mail.com": true,

    // Video / Media
    "youtube.com": true,
    "youtu.be": true,
    "dailymotion.com": true,
    "spotify.com": true,
    "soundcloud.com": true,

    // Blogging / Learning
    "medium.com": true,
    "dev.to": true,
    "hashnode.com": true,
    "freecodecamp.org": true,
    "geeksforgeeks.org": true,
    "w3schools.com": true,
    "developer.mozilla.org": true,
    "wikipedia.org": true,

    // Code / Playground
    "codepen.io": true,
    "codesandbox.io": true,
    "stackblitz.com": true,
    "replit.com": true,
    "glitch.com": true,

    // Hosting / Cloud
    "netlify.app": true,
    "netlify.com": true,
    "vercel.app": true,
    "vercel.com": true,
    "web.app": true,
    "firebaseapp.com": true,
    "pages.dev": true,
    "workers.dev": true,
    "cloudflare.com": true,
    "render.com": true,
    "railway.app": true,
    "surge.sh": true,
    "herokuapp.com": true,
    "heroku.com": true,
    "aws.amazon.com": true,
    "azure.microsoft.com": true,
    "cloud.google.com": true,
    "digitalocean.com": true,

    // Package / CDN
    "npmjs.com": true,
    "yarnpkg.com": true,
    "jsdelivr.net": true,
    "unpkg.com": true,

    // AI / ML
    "openai.com": true,
    "huggingface.co": true,

    // Design / Productivity
    "figma.com": true,
    "canva.com": true,
    "notion.so": true,
    "slack.com": true,

    // Image / CDN
    "imagekit.io": true,
    "cloudinary.com": true,
    "unsplash.com": true,
    "imgbb.com": true,
    "postimg.cc": true,

    // Search / General
    "google.com": true
  };

  const CONFIG = {
    SECURITY_LEVELS: {
      SAFE: 'SAFE',
      TRUSTED_EXTERNAL: 'TRUSTED_EXTERNAL',
      WARNING: 'WARNING',
      SUSPICIOUS: 'SUSPICIOUS',
      DANGEROUS: 'DANGEROUS'
    },
    SUSPICIOUS_PARAMS: [
      'redirect', 'return', 'next', 'continue', 'external_url', 'target', 'url',
      'goto', 'go', 'link', 'redir', 'exit', 'exit_url', 'go_url', 'landing'
    ],
    QUARANTINE_TIMEOUT: 5000,
    DIAGNOSIS_CARD_DISPLAY_TIME: 8000,
    SECURE_TEMP_PAGE: 'track_id_100.112.temp.html'
  };

  // ============================================================================
  // 2. UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Safe logging with ANH prefix
   */
  function log(message, data = null) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[ANH Security ${timestamp}] ${message}`, data || '');
  }

  /**
   * Safe error logging
   */
  function logError(message, error = null) {
    console.error(`[ANH Security ERROR] ${message}`, error || '');
  }

  /**
   * Gets ISO timestamp
   */
  function getISOTimestamp() {
    return new Date().toISOString();
  }

  /**
   * Sanitizes string values
   */
  function sanitizeString(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[<>'"]/g, '').substring(0, 1000).trim();
  }

  /**
   * Safely parses JSON
   */
  function safeJsonParse(str) {
    try {
      return JSON.parse(str);
    } catch (e) {
      return null;
    }
  }

  /**
   * Safely converts value to JSON string
   */
  function safeJsonStringify(obj) {
    try {
      return JSON.stringify(obj);
    } catch (e) {
      return '{}';
    }
  }

  /**
   * Extracts domain from URL
   */
  function extractDomain(urlString) {
    try {
      const url = new URL(urlString);
      return url.hostname;
    } catch (e) {
      return null;
    }
  }

  /**
   * Checks if string matches pattern (case-insensitive)
   */
  function matchesDomainPattern(domain, pattern) {
    if (!domain || !pattern) return false;
    return domain.toLowerCase().includes(pattern.toLowerCase());
  }

  /**
   * Performs regex test safely
   */
  function safeRegexTest(pattern, str) {
    try {
      const regex = new RegExp(pattern, 'i');
      return regex.test(str);
    } catch (e) {
      return false;
    }
  }

  /**
   * Delays execution
   */
  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Gets URL query parameters
   */
  function getUrlParams(url) {
    try {
      const urlObj = new URL(url);
      const params = {};
      urlObj.searchParams.forEach((value, key) => {
        params[key] = value;
      });
      return params;
    } catch (e) {
      return {};
    }
  }

  /**
   * Decodes potential base64/encoded strings
   */
  function attemptDecode(str) {
    try {
      // Try base64 decode
      const decoded = atob(str);
      return decoded.length > 0 ? decoded : str;
    } catch (e) {
      try {
        // Try URI decode
        return decodeURIComponent(str);
      } catch (e2) {
        return str;
      }
    }
  }

  /**
   * Escapes HTML entities
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ============================================================================
  // 3. TRUST ENGINE
  // ============================================================================

  class TrustEngine {
    constructor() {
      this.trustedCache = new Map();
    }

    /**
     * Evaluates trust level of a referrer URL
     */
    evaluateTrust(referrerUrl) {
      if (!referrerUrl) {
        return {
          trustLevel: CONFIG.SECURITY_LEVELS.WARNING,
          reason: 'No referrer detected',
          isTrusted: false
        };
      }

      // Check cache
      if (this.trustedCache.has(referrerUrl)) {
        return this.trustedCache.get(referrerUrl);
      }

      // Check ANH trusted prefixes
      for (const prefix of TRUSTED_PREFIXES) {
        if (referrerUrl.startsWith(prefix)) {
          const result = {
            trustLevel: CONFIG.SECURITY_LEVELS.SAFE,
            reason: 'ANH trusted prefix',
            isTrusted: true
          };
          this.trustedCache.set(referrerUrl, result);
          return result;
        }
      }

      // Extract domain and check external database
      const domain = extractDomain(referrerUrl);
      if (domain) {
        // Check exact domain match
        if (EXTERNAL_DB[domain]) {
          const result = {
            trustLevel: CONFIG.SECURITY_LEVELS.TRUSTED_EXTERNAL,
            reason: 'Trusted external domain',
            isTrusted: true,
            domain
          };
          this.trustedCache.set(referrerUrl, result);
          return result;
        }

        // Check subdomain match
        for (const trustedDomain of Object.keys(EXTERNAL_DB)) {
          if (domain.endsWith(trustedDomain) || domain.endsWith('.' + trustedDomain)) {
            const result = {
              trustLevel: CONFIG.SECURITY_LEVELS.TRUSTED_EXTERNAL,
              reason: 'Trusted external domain (subdomain)',
              isTrusted: true,
              domain
            };
            this.trustedCache.set(referrerUrl, result);
            return result;
          }
        }
      }

      // Untrusted
      const result = {
        trustLevel: CONFIG.SECURITY_LEVELS.SUSPICIOUS,
        reason: 'Unknown or untrusted source',
        isTrusted: false,
        domain
      };
      this.trustedCache.set(referrerUrl, result);
      return result;
    }

    /**
     * Determines threat level based on trust
     */
    getThreatLevel(trustResult) {
      switch (trustResult.trustLevel) {
        case CONFIG.SECURITY_LEVELS.SAFE:
          return 0; // No threat
        case CONFIG.SECURITY_LEVELS.TRUSTED_EXTERNAL:
          return 1; // Low threat
        case CONFIG.SECURITY_LEVELS.WARNING:
          return 2; // Medium threat
        case CONFIG.SECURITY_LEVELS.SUSPICIOUS:
          return 3; // High threat
        case CONFIG.SECURITY_LEVELS.DANGEROUS:
          return 4; // Critical threat
        default:
          return 2;
      }
    }
  }

  // ============================================================================
  // 4. THREAT ANALYZER
  // ============================================================================

  class ThreatAnalyzer {
    constructor() {
      this.suspiciousPatterns = [
        /onclick/i,
        /onerror/i,
        /onload/i,
        /javascript:/i,
        /data:text\/html/i,
        /<script/i,
        /alert\(/i,
        /eval\(/i
      ];
    }

    /**
     * Analyzes URL for phishing and threat indicators
     */
    analyzeUrl(urlString) {
      const suspiciousIndicators = [];
      const params = getUrlParams(urlString);

      // Check for suspicious parameter names
      for (const paramName of Object.keys(params)) {
        if (CONFIG.SUSPICIOUS_PARAMS.includes(paramName.toLowerCase())) {
          suspiciousIndicators.push({
            type: 'suspicious_param',
            param: paramName,
            value: params[paramName].substring(0, 50)
          });
        }
      }

      // Check parameter values for malicious patterns
      for (const [paramName, paramValue] of Object.entries(params)) {
        // Check for suspicious content
        for (const pattern of this.suspiciousPatterns) {
          if (pattern.test(paramValue)) {
            suspiciousIndicators.push({
              type: 'malicious_pattern',
              param: paramName,
              pattern: pattern.toString()
            });
          }
        }

        // Check for excessive encoding/nesting
        let decodedValue = paramValue;
        let decodeDepth = 0;
        let previousValue = paramValue;

        while (decodeDepth < 5) {
          const decoded = attemptDecode(decodedValue);
          if (decoded === previousValue) break;
          decodedValue = decoded;
          previousValue = decodedValue;
          decodeDepth++;
        }

        if (decodeDepth > 2) {
          suspiciousIndicators.push({
            type: 'excessive_encoding',
            param: paramName,
            depth: decodeDepth
          });
        }
      }

      // Check for redirect chain depth
      let redirectChainDepth = 0;
      for (const paramName of Object.keys(params)) {
        if (CONFIG.SUSPICIOUS_PARAMS.includes(paramName.toLowerCase())) {
          redirectChainDepth++;
        }
      }

      // Calculate risk score (0-100)
      const riskScore = Math.min(
        100,
        suspiciousIndicators.length * 15 + redirectChainDepth * 10
      );

      return {
        riskScore,
        suspiciousIndicators,
        redirectChainDepth,
        hasThreats: suspiciousIndicators.length > 0,
        threatLevel: this._getThreatLevel(riskScore)
      };
    }

    /**
     * Detects phishing patterns in referrer
     */
    detectPhishingPatterns(referrerUrl) {
      const phishingIndicators = [];

      if (!referrerUrl) {
        return { hasPhishingPatterns: false, indicators: [] };
      }

      try {
        const url = new URL(referrerUrl);
        const domain = url.hostname;

        // Check for homograph attacks (lookalike domains)
        const homoglyphPatterns = [
          /rn/g, // rn -> m
          /0/g,  // 0 -> O
          /1/g   // 1 -> l
        ];

        // Check for suspicious subdomains
        const subdomainParts = domain.split('.');
        if (subdomainParts.length > 3) {
          phishingIndicators.push('Unusual subdomain depth');
        }

        // Check for IP-based domains (common in phishing)
        if (/^\d+\.\d+\.\d+\.\d+$/.test(domain)) {
          phishingIndicators.push('IP-based domain detected');
        }

        // Check for recently registered domain patterns
        if (safeRegexTest(/^new|^temp|^test|^temp|^sandbox/, domain)) {
          phishingIndicators.push('Temporary domain pattern');
        }

        // Check path length (unusually long paths can indicate phishing)
        if (url.pathname.length > 500) {
          phishingIndicators.push('Suspiciously long URL path');
        }

      } catch (e) {
        phishingIndicators.push('Malformed URL');
      }

      return {
        hasPhishingPatterns: phishingIndicators.length > 0,
        indicators: phishingIndicators
      };
    }

    /**
     * Maps risk score to threat level
     */
    _getThreatLevel(score) {
      if (score < 15) return CONFIG.SECURITY_LEVELS.SAFE;
      if (score < 30) return CONFIG.SECURITY_LEVELS.WARNING;
      if (score < 60) return CONFIG.SECURITY_LEVELS.SUSPICIOUS;
      return CONFIG.SECURITY_LEVELS.DANGEROUS;
    }
  }

  // ============================================================================
  // 5. PARAMETER SANITIZER
  // ============================================================================

  class ParamSanitizer {
    /**
     * Sanitizes URL parameters
     */
    sanitizeUrl(urlString) {
      try {
        const url = new URL(urlString);
        const cleanParams = new URLSearchParams();

        // Process parameters
        url.searchParams.forEach((value, key) => {
          // Skip suspicious parameter names
          if (CONFIG.SUSPICIOUS_PARAMS.includes(key.toLowerCase())) {
            return;
          }

          // Skip empty parameters
          if (!value || value.trim().length === 0) {
            return;
          }

          // Sanitize the value
          const sanitized = this._sanitizeValue(value);
          cleanParams.append(key, sanitized);
        });

        // Reconstruct URL
        url.search = cleanParams.toString();
        return url.href;
      } catch (e) {
        logError('Failed to sanitize URL', e);
        return urlString;
      }
    }

    /**
     * Sanitizes individual parameter values
     */
    _sanitizeValue(value) {
      // Remove potentially dangerous characters
      let sanitized = value
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/javascript:/i, '') // Remove javascript: protocol
        .replace(/data:text\/html/i, '') // Remove data: URLs
        .replace(/onclick|onerror|onload/gi, ''); // Remove event handlers

      // Decode and re-encode to normalize
      try {
        const decoded = decodeURIComponent(sanitized);
        sanitized = encodeURIComponent(decoded);
      } catch (e) {
        // Keep original if decoding fails
      }

      return sanitized;
    }

    /**
     * Normalizes URL structure
     */
    normalizeUrl(urlString) {
      try {
        const url = new URL(urlString);

        // Remove fragment
        url.hash = '';

        // Sort parameters alphabetically for consistency
        const params = new URLSearchParams(url.search);
        const sorted = new URLSearchParams([...params].sort());
        url.search = sorted.toString();

        // Remove trailing slash for consistency
        if (url.pathname.endsWith('/') && url.pathname !== '/') {
          url.pathname = url.pathname.slice(0, -1);
        }

        // Remove default ports
        if ((url.protocol === 'http:' && url.port === '80') ||
            (url.protocol === 'https:' && url.port === '443')) {
          url.port = '';
        }

        return url.href;
      } catch (e) {
        logError('Failed to normalize URL', e);
        return urlString;
      }
    }

    /**
     * Removes suspicious parameters from URL
     */
    stripSuspiciousParams(urlString) {
      try {
        const url = new URL(urlString);
        const cleanParams = new URLSearchParams();

        url.searchParams.forEach((value, key) => {
          if (!CONFIG.SUSPICIOUS_PARAMS.includes(key.toLowerCase())) {
            cleanParams.append(key, value);
          }
        });

        url.search = cleanParams.toString();
        return url.href;
      } catch (e) {
        return urlString;
      }
    }
  }

  // ============================================================================
  // 6. SECURITY DIAGNOSIS LOGGER
  // ============================================================================

  class DiagnosisLogger {
    constructor() {
      this.diagnosisReports = [];
      this.maxReports = 100; // Keep last 100 reports in memory
    }

    /**
     * Creates comprehensive security diagnosis report
     */
    createReport(referrerUrl, trustResult, threatAnalysis, urlString) {
      const report = {
        timestamp: getISOTimestamp(),
        referrer: sanitizeString(referrerUrl),
        url: sanitizeString(urlString),
        trustLevel: trustResult.trustLevel,
        threatLevel: threatAnalysis.threatLevel,
        riskScore: threatAnalysis.riskScore,
        suspiciousParams: threatAnalysis.suspiciousIndicators,
        phishingPatterns: threatAnalysis.phishingPatterns,
        redirectChainDepth: threatAnalysis.redirectChainDepth,
        actionTaken: 'analysis_complete',
        diagnosedAt: new Date().toLocaleString()
      };

      this._storeReport(report);
      return report;
    }

    /**
     * Stores report locally
     */
    _storeReport(report) {
      this.diagnosisReports.push(report);
      if (this.diagnosisReports.length > this.maxReports) {
        this.diagnosisReports.shift();
      }

      // Also store in localStorage
      try {
        const stored = JSON.parse(localStorage.getItem('ANH_SECURITY_REPORTS') || '[]');
        stored.push(report);
        if (stored.length > this.maxReports) {
          stored.shift();
        }
        localStorage.setItem('ANH_SECURITY_REPORTS', safeJsonStringify(stored));
      } catch (e) {
        log('Could not store report in localStorage');
      }
    }

    /**
     * Gets all stored reports
     */
    getReports() {
      return [...this.diagnosisReports];
    }

    /**
     * Gets last N reports
     */
    getLastReports(count = 10) {
      return this.diagnosisReports.slice(-count);
    }

    /**
     * Clears reports
     */
    clearReports() {
      this.diagnosisReports = [];
      try {
        localStorage.removeItem('ANH_SECURITY_REPORTS');
      } catch (e) {
        // Silent fail
      }
    }
  }

  // ============================================================================
  // 7. SECURITY DIAGNOSIS CARD UI
  // ============================================================================

  class SecurityDiagnosisCard {
    constructor() {
      this.cardElement = null;
      this.isVisible = false;
      this.currentStep = 0;
      this.steps = [
        'Getting Referrer Link',
        'Analysing Referrer Link Format',
        'Looking For Param Transfer',
        'Detecting Unsafe Redirect Parameters',
        'Breaking Params to Avoid Param Phishing',
        'Normalizing URL Structure',
        'Preparing Secure Runtime Environment',
        'Creating Safe Redirect Layer',
        'Initializing Secure Continuation'
      ];
    }

    /**
     * Shows security diagnosis card with animated progress
     */
    async showDiagnosisCard() {
      this._createCardElement();
      this._attachStyles();
      document.body.appendChild(this.cardElement);
      this.isVisible = true;

      // Animate through steps
      for (let i = 0; i < this.steps.length; i++) {
        this.currentStep = i;
        this._updateCardStep(i);
        await delay(600);
      }

      // Complete state
      this._showCompleteState();
      await delay(1000);
    }

    /**
     * Creates card DOM element
     */
    _createCardElement() {
      this.cardElement = document.createElement('div');
      this.cardElement.id = 'anh-security-diagnosis-card';
      this.cardElement.className = 'anh-security-card';
      this.cardElement.innerHTML = `
        <div class="anh-security-card-content">
          <div class="anh-security-card-header">
            <div class="anh-security-logo">🛡️</div>
            <h2 class="anh-security-title">ANH Security Check</h2>
          </div>

          <div class="anh-security-progress">
            <div class="anh-security-progress-bar">
              <div class="anh-security-progress-fill" id="anh-progress-fill"></div>
            </div>
          </div>

          <div class="anh-security-steps">
            <div id="anh-security-steps-container"></div>
          </div>

          <div class="anh-security-status">
            <p id="anh-security-status-text">Initializing security analysis...</p>
          </div>

          <div class="anh-security-footer">
            <p class="anh-security-footer-text">Privacy first • Client-side only • No data collection</p>
          </div>
        </div>
      `;
    }

    /**
     * Updates card with current step
     */
    _updateCardStep(stepIndex) {
      const container = document.getElementById('anh-security-steps-container');
      const statusText = document.getElementById('anh-security-status-text');
      const progressFill = document.getElementById('anh-progress-fill');

      // Clear previous steps
      container.innerHTML = '';

      // Render all steps with current state
      this.steps.forEach((step, index) => {
        const stepEl = document.createElement('div');
        stepEl.className = 'anh-security-step';

        if (index < stepIndex) {
          stepEl.classList.add('completed');
          stepEl.innerHTML = `<span class="anh-step-check">✓</span> <span class="anh-step-text">${step}</span>`;
        } else if (index === stepIndex) {
          stepEl.classList.add('active');
          stepEl.innerHTML = `<span class="anh-step-loader"></span> <span class="anh-step-text">${step}</span>`;
        } else {
          stepEl.classList.add('pending');
          stepEl.innerHTML = `<span class="anh-step-number">${index + 1}</span> <span class="anh-step-text">${step}</span>`;
        }

        container.appendChild(stepEl);
      });

      statusText.textContent = this.steps[stepIndex];
      progressFill.style.width = ((stepIndex + 1) / this.steps.length * 100) + '%';
    }

    /**
     * Shows completion state
     */
    _showCompleteState() {
      const container = document.getElementById('anh-security-steps-container');
      const statusText = document.getElementById('anh-security-status-text');
      const progressFill = document.getElementById('anh-progress-fill');

      container.innerHTML = '';
      this.steps.forEach((step) => {
        const stepEl = document.createElement('div');
        stepEl.className = 'anh-security-step completed';
        stepEl.innerHTML = `<span class="anh-step-check">✓</span> <span class="anh-step-text">${step}</span>`;
        container.appendChild(stepEl);
      });

      statusText.innerHTML = '<span class="anh-complete-text">✓ Security check complete • Safe to continue</span>';
      progressFill.style.width = '100%';
    }

    /**
     * Hides and removes card
     */
    hideCard() {
      if (this.cardElement) {
        this.cardElement.classList.add('fade-out');
        setTimeout(() => {
          if (this.cardElement && this.cardElement.parentNode) {
            this.cardElement.parentNode.removeChild(this.cardElement);
          }
          this.cardElement = null;
          this.isVisible = false;
        }, 300);
      }
    }

    /**
     * Attaches styles to page
     */
    _attachStyles() {
      if (document.getElementById('anh-security-card-styles')) return;

      const style = document.createElement('style');
      style.id = 'anh-security-card-styles';
      style.textContent = `
        .anh-security-card {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 90%;
          max-width: 450px;
          background: linear-gradient(135deg, rgba(20, 20, 40, 0.95) 0%, rgba(40, 20, 60, 0.95) 100%);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(102, 126, 234, 0.3);
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4), inset 0 0 60px rgba(102, 126, 234, 0.1);
          z-index: 999999;
          animation: slideIn 0.4s ease-out;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #e0e0e0;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translate(-50%, -40%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }

        .fade-out {
          animation: slideOut 0.3s ease-in forwards;
        }

        @keyframes slideOut {
          to {
            opacity: 0;
            transform: translate(-50%, -60%);
          }
        }

        .anh-security-card-content {
          padding: 30px;
        }

        .anh-security-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }

        .anh-security-logo {
          font-size: 28px;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .anh-security-title {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .anh-security-progress {
          margin-bottom: 20px;
        }

        .anh-security-progress-bar {
          height: 3px;
          background: rgba(102, 126, 234, 0.2);
          border-radius: 2px;
          overflow: hidden;
        }

        .anh-security-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          transition: width 0.6s ease-out;
          border-radius: 2px;
        }

        .anh-security-steps {
          margin-bottom: 24px;
          max-height: 280px;
          overflow-y: auto;
        }

        .anh-security-step {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 0;
          font-size: 13px;
          transition: all 0.3s ease;
          opacity: 0.7;
        }

        .anh-security-step.completed {
          opacity: 0.6;
          color: #4ade80;
        }

        .anh-security-step.active {
          opacity: 1;
          color: #667eea;
        }

        .anh-security-step.pending {
          opacity: 0.4;
          color: #888;
        }

        .anh-step-check {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          color: #4ade80;
          font-weight: bold;
          flex-shrink: 0;
        }

        .anh-step-loader {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(102, 126, 234, 0.3);
          border-top-color: #667eea;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          flex-shrink: 0;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .anh-step-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          background: rgba(102, 126, 234, 0.2);
          border-radius: 50%;
          font-size: 11px;
          font-weight: 600;
          flex-shrink: 0;
        }

        .anh-step-text {
          flex: 1;
        }

        .anh-security-status {
          text-align: center;
          margin-bottom: 20px;
          padding: 12px;
          background: rgba(102, 126, 234, 0.1);
          border-radius: 8px;
          font-size: 13px;
          color: #667eea;
        }

        .anh-complete-text {
          color: #4ade80;
        }

        .anh-security-footer {
          text-align: center;
          padding-top: 12px;
          border-top: 1px solid rgba(102, 126, 234, 0.2);
        }

        .anh-security-footer-text {
          margin: 0;
          font-size: 11px;
          color: #888;
          letter-spacing: 0.5px;
        }

        @media (max-width: 480px) {
          .anh-security-card {
            max-width: calc(100% - 20px);
          }

          .anh-security-card-content {
            padding: 20px;
          }

          .anh-security-title {
            font-size: 16px;
          }

          .anh-security-step {
            font-size: 12px;
          }
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .anh-security-card {
            background: linear-gradient(135deg, rgba(15, 15, 25, 0.95) 0%, rgba(30, 15, 45, 0.95) 100%);
          }
        }
      `;

      document.head.appendChild(style);
    }
  }

  // ============================================================================
  // 8. SECURE QUARANTINE RUNTIME
  // ============================================================================

  class SecureQuarantineRuntime {
    constructor(paramSanitizer) {
      this.paramSanitizer = paramSanitizer;
    }

    /**
     * Generates secure temporary redirect page
     */
    generateQuarantinePage(unsafeUrl, safeUrl) {
      const tempPageHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ANH Secure Runtime Environment</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }
        .container {
            max-width: 400px;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            text-align: center;
            animation: slideUp 0.4s ease-out;
        }
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .icon {
            font-size: 48px;
            margin-bottom: 16px;
        }
        h1 {
            color: #333;
            margin-bottom: 12px;
            font-size: 20px;
        }
        p {
            color: #666;
            font-size: 14px;
            margin-bottom: 20px;
            line-height: 1.5;
        }
        .loader {
            display: inline-block;
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 20px 0;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .countdown {
            font-size: 24px;
            font-weight: 600;
            color: #667eea;
            margin-top: 20px;
        }
        .security-info {
            background: #f0f4ff;
            border-left: 4px solid #667eea;
            padding: 12px;
            margin-top: 20px;
            text-align: left;
            border-radius: 4px;
            font-size: 12px;
            color: #555;
        }
        .security-info strong {
            color: #667eea;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">🛡️</div>
        <h1>Secure Runtime Environment</h1>
        <p>Your connection has been secured and normalized. Redirecting to safe environment...</p>
        <div class="loader"></div>
        <div class="countdown">
            <span id="countdown">5</span>s
        </div>
        <div class="security-info">
            <strong>Security Actions Taken:</strong><br>
            ✓ Analyzed referrer source<br>
            ✓ Sanitized URL parameters<br>
            ✓ Removed suspicious payloads<br>
            ✓ Normalized URL structure
        </div>
    </div>

    <script>
        let countdown = 5;
        const countdownEl = document.getElementById('countdown');
        
        const timer = setInterval(() => {
            countdown--;
            countdownEl.textContent = countdown;
            if (countdown <= 0) {
                clearInterval(timer);
                // Redirect to safe URL
                window.location.href = '${sanitizeString(safeUrl)}';
            }
        }, 1000);

        // Fallback redirect after 6 seconds
        setTimeout(() => {
            window.location.href = '${sanitizeString(safeUrl)}';
        }, 6000);
    </script>
</body>
</html>
      `;

      return tempPageHtml;
    }

    /**
     * Initiates quarantine redirect flow
     */
    async initiateQuarantineRedirect(unsafeUrl, safeUrl) {
      log('Initiating secure quarantine redirect', {
        from: unsafeUrl.substring(0, 50),
        to: safeUrl.substring(0, 50)
      });

      // Show diagnosis card first
      const card = new SecurityDiagnosisCard();
      await card.showDiagnosisCard();

      // Wait before redirecting
      await delay(CONFIG.QUARANTINE_TIMEOUT);

      // Redirect to safe URL
      card.hideCard();
      window.location.href = safeUrl;
    }
  }

  // ============================================================================
  // 9. SAFE REDIRECT MANAGER
  // ============================================================================

  class SafeRedirectManager {
    constructor(trustEngine, threatAnalyzer, paramSanitizer, diagnosisLogger) {
      this.trustEngine = trustEngine;
      this.threatAnalyzer = threatAnalyzer;
      this.paramSanitizer = paramSanitizer;
      this.diagnosisLogger = diagnosisLogger;
    }

    /**
     * Determines redirect action based on security analysis
     */
    async determineRedirectAction() {
      const referrer = document.referrer;
      const currentUrl = window.location.href;

      // Evaluate trust
      const trustResult = this.trustEngine.evaluateTrust(referrer);

      // Analyze threats
      const urlAnalysis = this.threatAnalyzer.analyzeUrl(currentUrl);
      const phishingAnalysis = this.threatAnalyzer.detectPhishingPatterns(referrer);

      const threatAnalysis = {
        ...urlAnalysis,
        phishingPatterns: phishingAnalysis.indicators
      };

      // Create diagnosis report
      const report = this.diagnosisLogger.createReport(
        referrer,
        trustResult,
        threatAnalysis,
        currentUrl
      );

      log('Security analysis complete', {
        trustLevel: trustResult.trustLevel,
        threatLevel: threatAnalysis.threatLevel,
        riskScore: threatAnalysis.riskScore
      });

      // Determine action
      if (trustResult.isTrusted && threatAnalysis.riskScore < 30) {
        return {
          action: 'SILENT_CONTINUE',
          reason: 'Trusted source with low risk',
          sanitized: false
        };
      }

      if (threatAnalysis.riskScore > 60 || threatAnalysis.hasThreats) {
        return {
          action: 'QUARANTINE_REDIRECT',
          reason: 'High threat detected',
          sanitized: true,
          safeUrl: this.paramSanitizer.normalizeUrl(
            this.paramSanitizer.stripSuspiciousParams(currentUrl)
          )
        };
      }

      if (!trustResult.isTrusted || threatAnalysis.riskScore > 30) {
        return {
          action: 'SHOW_DIAGNOSIS',
          reason: 'Unknown source or medium threat',
          sanitized: false
        };
      }

      return {
        action: 'SILENT_CONTINUE',
        reason: 'Passed all security checks',
        sanitized: false
      };
    }
  }

  // ============================================================================
  // 10. MAIN ORCHESTRATOR
  // ============================================================================

  class ANHSecurityGovernance {
    constructor() {
      this.trustEngine = new TrustEngine();
      this.threatAnalyzer = new ThreatAnalyzer();
      this.paramSanitizer = new ParamSanitizer();
      this.diagnosisLogger = new DiagnosisLogger();
      this.diagnosisCard = new SecurityDiagnosisCard();
      this.quarantineRuntime = new SecureQuarantineRuntime(this.paramSanitizer);
      this.redirectManager = new SafeRedirectManager(
        this.trustEngine,
        this.threatAnalyzer,
        this.paramSanitizer,
        this.diagnosisLogger
      );
      this.isInitialized = false;
    }

    /**
     * Main initialization and security analysis
     */
    async initialize() {
      try {
        log('=== ANH Security Governance v1.0.0 Initializing ===');

        // Perform security analysis
        const action = await this.redirectManager.determineRedirectAction();

        log(`Security action: ${action.action}`, action);

        // Execute appropriate action
        switch (action.action) {
          case 'SILENT_CONTINUE':
            log('Silently continuing from trusted source');
            this._sanitizeAndContinue();
            break;

          case 'SHOW_DIAGNOSIS':
            log('Showing security diagnosis to user');
            await this.diagnosisCard.showDiagnosisCard();
            await delay(CONFIG.DIAGNOSIS_CARD_DISPLAY_TIME);
            this.diagnosisCard.hideCard();
            this._sanitizeAndContinue();
            break;

          case 'QUARANTINE_REDIRECT':
            log('Initiating quarantine redirect');
            await this.quarantineRuntime.initiateQuarantineRedirect(
              window.location.href,
              action.safeUrl
            );
            return; // Don't continue, we're redirecting

          default:
            log('Unknown action, continuing safely');
            this._sanitizeAndContinue();
        }

        this.isInitialized = true;
        this._exposePublicAPI();
        log('=== ANH Security Governance Ready ===');

      } catch (error) {
        logError('Fatal error during initialization', error);
        // Continue anyway to not break the site
        this._sanitizeAndContinue();
      }
    }

    /**
     * Silently sanitizes current page
     */
    _sanitizeAndContinue() {
      // Strip suspicious query parameters from window history
      const sanitized = this.paramSanitizer.stripSuspiciousParams(window.location.href);
      if (sanitized !== window.location.href) {
        window.history.replaceState({}, document.title, sanitized);
      }
    }

    /**
     * Exposes public API
     */
    _exposePublicAPI() {
      global.ANHSecurity = {
        getDiagnosisReports: () => this.diagnosisLogger.getReports(),
        getLastReports: (count) => this.diagnosisLogger.getLastReports(count),
        sanitizeUrl: (url) => this.paramSanitizer.sanitizeUrl(url),
        normalizeUrl: (url) => this.paramSanitizer.normalizeUrl(url),
        analyzeThreat: (url) => this.threatAnalyzer.analyzeUrl(url),
        evaluateTrust: (url) => this.trustEngine.evaluateTrust(url),
        showDiagnosisCard: () => this.diagnosisCard.showDiagnosisCard(),
        clearReports: () => this.diagnosisLogger.clearReports(),
        isReady: () => this.isInitialized
      };

      log('Public API exposed as window.ANHSecurity');
    }
  }

  // ============================================================================
  // 11. BOOTSTRAP & INITIALIZATION
  // ============================================================================

  function bootstrap() {
    // Initialize security governance
    const governance = new ANHSecurityGovernance();

    // Start initialization
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        governance.initialize();
      });
    } else {
      governance.initialize();
    }
  }

  // Start bootstrap immediately
  bootstrap();

})(window);

/**
 * ANH SECURITY GOVERNANCE — USAGE GUIDE
 * 
 * Public API accessible via window.ANHSecurity:
 * 
 * 1. Get Security Reports:
 *    window.ANHSecurity.getDiagnosisReports()
 *    Returns: Array of all security diagnosis reports
 * 
 * 2. Get Last N Reports:
 *    window.ANHSecurity.getLastReports(count = 10)
 *    Returns: Array of last N reports
 * 
 * 3. Sanitize URL:
 *    window.ANHSecurity.sanitizeUrl(url)
 *    Returns: Sanitized URL string
 * 
 * 4. Normalize URL:
 *    window.ANHSecurity.normalizeUrl(url)
 *    Returns: Normalized URL string
 * 
 * 5. Analyze Threat Level:
 *    window.ANHSecurity.analyzeThreat(url)
 *    Returns: { riskScore, suspiciousIndicators, threatLevel, hasThreats }
 * 
 * 6. Evaluate Trust:
 *    window.ANHSecurity.evaluateTrust(referrerUrl)
 *    Returns: { trustLevel, reason, isTrusted }
 * 
 * 7. Show Diagnosis Card:
 *    window.ANHSecurity.showDiagnosisCard()
 *    Returns: Promise that resolves when card animation completes
 * 
 * 8. Clear Reports:
 *    window.ANHSecurity.clearReports()
 * 
 * 9. Check Initialization:
 *    window.ANHSecurity.isReady()
 *    Returns: Boolean
 * 
 * FEATURES IMPLEMENTED:
 * ✓ Trust Engine (ANH + External Database)
 * ✓ Threat Analysis (Phishing, Malicious Patterns)
 * ✓ Parameter Sanitization (URL Cleaning)
 * ✓ Diagnosis Logging (Local Storage)
 * ✓ Security UI Card (Glassmorphism, Animated)
 * ✓ Secure Quarantine Runtime
 * ✓ Safe Redirect Management
 * 
 * SECURITY LEVELS:
 * • SAFE (0-15 risk): Trusted ANH sources
 * • TRUSTED_EXTERNAL (1-30 risk): Known external domains
 * • WARNING (2-60 risk): Unknown but not malicious
 * • SUSPICIOUS (3-75 risk): Potential threats detected
 * • DANGEROUS (4-100 risk): High threat, quarantine recommended
 * 
 * PRIVACY:
 * • All analysis performed client-side only
 * • No data sent to backend
 * • Reports stored locally only
 * • No tracking/profiling
 * • User control over security features
 */
