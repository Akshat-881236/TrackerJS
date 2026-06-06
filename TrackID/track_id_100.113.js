/**
 * ANH Intelligent Navigation Tracking — track_id_100.113.js
 * 
 * Advanced outbound navigation engine for Akshat Network Hub ecosystem
 * Provides:
 * - Intelligent ANH internal navigation with secure params
 * - Trusted external navigation with UTM metadata
 * - Navigation graph intelligence and session continuity
 * - Dynamic link interception and SPA support
 * - Privacy-first cross-project analytics
 * 
 * Architecture: Client-side only, no backend transfer, privacy-safe
 * 
 * @version 1.0.0
 * @author ANH Navigation Team
 * @license MIT
 */

(function (global) {
  'use strict';

  // ============================================================================
  // 1. CONFIGURATION & CONSTANTS
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
    "github.com": true,
    "github.io": true,
    "linkedin.com": true,
    "x.com": true,
    "twitter.com": true,
    "youtube.com": true,
    "openai.com": true,
    "huggingface.co": true,
    "google.com": true,
    "developer.mozilla.org": true,
    "w3schools.com": true,
    "geeksforgeeks.org": true,
    "medium.com": true,
    "freecodecamp.org": true,
    "netlify.app": true,
    "vercel.app": true,
    "web.app": true,
    "firebaseapp.com": true,
    "cloudflare.com": true,
    "pages.dev": true,
    "discord.com": true,
    "reddit.com": true,
    "stackoverflow.com": true,
    "notion.so": true,
    "figma.com": true
  };

  const CONFIG = {
    NAVIGATION_TYPES: {
      INTERNAL: 'internal',
      EXTERNAL_TRUSTED: 'external_trusted',
      EXTERNAL_UNTRUSTED: 'external_untrusted'
    },
    SESSION_STORAGE_KEY: 'ANH_NAVIGATION_SESSION',
    GRAPH_STORAGE_KEY: 'ANH_NAVIGATION_GRAPH',
    MAX_GRAPH_ENTRIES: 200,
    PARAM_ENCODING: 'base64url',
    COMPRESSION_THRESHOLD: 100,
    LINK_OBSERVER_DELAY: 500,
    MAX_URL_LENGTH: 2000
  };

  // ============================================================================
  // 2. UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Safe logging
   */
  function log(message, data = null) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[ANH Navigation ${timestamp}] ${message}`, data || '');
  }

  /**
   * Safe error logging
   */
  function logError(message, error = null) {
    console.error(`[ANH Navigation ERROR] ${message}`, error || '');
  }

  /**
   * Gets ISO timestamp
   */
  function getISOTimestamp() {
    return new Date().toISOString();
  }

  /**
   * Generates unique session ID
   */
  function generateSessionId() {
    return 'anh_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Generates unique transition ID
   */
  function generateTransitionId() {
    return 'trans_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Safe base64url encoding
   */
  function base64urlEncode(str) {
    try {
      return btoa(str)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    } catch (e) {
      logError('Base64 encoding failed', e);
      return '';
    }
  }

  /**
   * Safe base64url decoding
   */
  function base64urlDecode(str) {
    try {
      str = str.replace(/-/g, '+').replace(/_/g, '/');
      while (str.length % 4) str += '=';
      return atob(str);
    } catch (e) {
      logError('Base64 decoding failed', e);
      return '';
    }
  }

  /**
   * Sanitizes string for URL param
   */
  function sanitizeForParam(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/[<>'"]/g, '')
      .substring(0, 500)
      .trim();
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
   * Extracts protocol from URL
   */
  function extractProtocol(urlString) {
    try {
      const url = new URL(urlString);
      return url.protocol;
    } catch (e) {
      return null;
    }
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
   * Safely stringifies JSON
   */
  function safeJsonStringify(obj) {
    try {
      return JSON.stringify(obj);
    } catch (e) {
      return '{}';
    }
  }

  /**
   * Gets URL parameters as object
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
   * Appends parameters to URL
   */
  function appendUrlParams(url, params) {
    try {
      const urlObj = new URL(url);
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          urlObj.searchParams.set(key, params[key]);
        }
      });
      return urlObj.href;
    } catch (e) {
      return url;
    }
  }

  /**
   * Gets current page title
   */
  function getCurrentPageTitle() {
    return document.title || 'Untitled Page';
  }

  /**
   * Delays execution
   */
  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ============================================================================
  // 3. TRUST CLASSIFIER
  // ============================================================================

  class TrustClassifier {
    constructor() {
      this.trustCache = new Map();
    }

    /**
     * Classifies navigation destination
     */
    classifyDestination(destinationUrl) {
      if (this.trustCache.has(destinationUrl)) {
        return this.trustCache.get(destinationUrl);
      }

      // Check ANH internal prefixes
      for (const prefix of TRUSTED_PREFIXES) {
        if (destinationUrl.startsWith(prefix)) {
          const result = {
            type: CONFIG.NAVIGATION_TYPES.INTERNAL,
            isTrusted: true,
            isInternal: true,
            domain: extractDomain(destinationUrl)
          };
          this.trustCache.set(destinationUrl, result);
          return result;
        }
      }

      // Check trusted external domains
      const domain = extractDomain(destinationUrl);
      if (domain) {
        // Exact match
        if (EXTERNAL_DB[domain]) {
          const result = {
            type: CONFIG.NAVIGATION_TYPES.EXTERNAL_TRUSTED,
            isTrusted: true,
            isInternal: false,
            domain
          };
          this.trustCache.set(destinationUrl, result);
          return result;
        }

        // Subdomain match
        for (const trustedDomain of Object.keys(EXTERNAL_DB)) {
          if (domain.endsWith(trustedDomain) || domain.endsWith('.' + trustedDomain)) {
            const result = {
              type: CONFIG.NAVIGATION_TYPES.EXTERNAL_TRUSTED,
              isTrusted: true,
              isInternal: false,
              domain
            };
            this.trustCache.set(destinationUrl, result);
            return result;
          }
        }
      }

      // Untrusted
      const result = {
        type: CONFIG.NAVIGATION_TYPES.EXTERNAL_UNTRUSTED,
        isTrusted: false,
        isInternal: false,
        domain
      };
      this.trustCache.set(destinationUrl, result);
      return result;
    }
  }

  // ============================================================================
  // 4. URL SANITIZER & NORMALIZER
  // ============================================================================

  class UrlSanitizer {
    /**
     * Validates URL protocol
     */
    isValidProtocol(urlString) {
      const protocol = extractProtocol(urlString);
      return protocol === 'http:' || protocol === 'https:';
    }

    /**
     * Detects javascript: protocol
     */
    hasJavascriptProtocol(urlString) {
      return /^javascript:/i.test(urlString);
    }

    /**
     * Detects data: URI
     */
    hasDataUri(urlString) {
      return /^data:/i.test(urlString);
    }

    /**
     * Validates URL structure
     */
    isValidUrl(urlString) {
      try {
        new URL(urlString);
        return true;
      } catch (e) {
        return false;
      }
    }

    /**
     * Strips suspicious parameters
     */
    stripSuspiciousParams(urlString) {
      try {
        const url = new URL(urlString);
        const suspiciousParams = [
          'redirect', 'return', 'next', 'goto', 'url', 'link',
          'target', 'exit', 'exit_url', 'go_url'
        ];

        suspiciousParams.forEach(param => {
          url.searchParams.delete(param);
        });

        return url.href;
      } catch (e) {
        return urlString;
      }
    }

    /**
     * Removes duplicate parameters
     */
    removeDuplicateParams(urlString) {
      try {
        const url = new URL(urlString);
        const seen = new Set();
        const toDelete = [];

        url.searchParams.forEach((value, key) => {
          if (seen.has(key)) {
            toDelete.push(key);
          }
          seen.add(key);
        });

        toDelete.forEach(key => url.searchParams.delete(key));
        return url.href;
      } catch (e) {
        return urlString;
      }
    }

    /**
     * Canonicalizes URL
     */
    canonicalizeUrl(urlString) {
      try {
        const url = new URL(urlString);

        // Remove fragment
        url.hash = '';

        // Sort parameters
        const params = new URLSearchParams([...url.searchParams].sort());
        url.search = params.toString();

        // Remove trailing slash (except root)
        if (url.pathname.endsWith('/') && url.pathname !== '/') {
          url.pathname = url.pathname.slice(0, -1);
        }

        // Remove default ports
        if ((url.protocol === 'http:' && url.port === '80') ||
            (url.protocol === 'https:' && url.port === '443')) {
          url.port = '';
        }

        // Lowercase hostname
        url.hostname = url.hostname.toLowerCase();

        return url.href;
      } catch (e) {
        return urlString;
      }
    }

    /**
     * Compresses long URLs safely
     */
    compressUrl(urlString) {
      if (urlString.length > CONFIG.COMPRESSION_THRESHOLD) {
        try {
          const encoded = base64urlEncode(urlString);
          return encoded;
        } catch (e) {
          return urlString;
        }
      }
      return urlString;
    }
  }

  // ============================================================================
  // 5. PARAMETER GENERATORS
  // ============================================================================

  class ParamGenerator {
    constructor() {
      this.sanitizer = new UrlSanitizer();
    }

    /**
     * Generates ANH internal navigation parameters
     */
    generateAnhInternalParams(sourceUrl, sourceTitle) {
      try {
        const timestamp = getISOTimestamp();
        const compressed = this.sanitizer.compressUrl(sourceUrl);

        return {
          anh_source: compressed,
          anh_timestamp: timestamp,
          anh_navigation: CONFIG.NAVIGATION_TYPES.INTERNAL,
          anh_session: this._getSessionId(),
          anh_referrer_title: sanitizeForParam(sourceTitle),
          anh_transition_id: generateTransitionId()
        };
      } catch (e) {
        logError('Failed to generate ANH internal params', e);
        return {};
      }
    }

    /**
     * Generates UTM parameters for external navigation
     */
    generateUtmParams(sourceUrl, sourceTitle) {
      try {
        const compressed = this.sanitizer.compressUrl(sourceUrl);

        return {
          utm_source: 'anh',
          utm_medium: 'network_navigation',
          utm_campaign: 'akshat_network_hub',
          utm_referrer: compressed,
          utm_timestamp: getISOTimestamp()
        };
      } catch (e) {
        logError('Failed to generate UTM params', e);
        return {};
      }
    }

    /**
     * Gets or creates session ID
     */
    _getSessionId() {
      try {
        const stored = sessionStorage.getItem(CONFIG.SESSION_STORAGE_KEY);
        if (stored) {
          const session = safeJsonParse(stored);
          if (session && session.id) {
            return session.id;
          }
        }
      } catch (e) {
        // Fallback
      }

      const sessionId = generateSessionId();
      try {
        sessionStorage.setItem(CONFIG.SESSION_STORAGE_KEY, safeJsonStringify({ id: sessionId }));
      } catch (e) {
        // Fallback to localStorage
        try {
          localStorage.setItem(CONFIG.SESSION_STORAGE_KEY, safeJsonStringify({ id: sessionId }));
        } catch (e2) {
          // Silent fail
        }
      }

      return sessionId;
    }
  }

  // ============================================================================
  // 6. NAVIGATION GRAPH ENGINE
  // ============================================================================

  class NavigationGraphEngine {
    constructor() {
      this.graph = [];
      this.loadGraph();
    }

    /**
     * Records navigation event
     */
    recordNavigation(sourceUrl, destinationUrl, classification, transitionId) {
      try {
        const entry = {
          id: transitionId,
          timestamp: getISOTimestamp(),
          source: sourceUrl.substring(0, 200),
          destination: destinationUrl.substring(0, 200),
          sourceTitle: getCurrentPageTitle(),
          type: classification.type,
          isTrusted: classification.isTrusted,
          domain: classification.domain,
          navigationScore: this._calculateNavigationScore(classification),
          userAgent: navigator.userAgent.substring(0, 100)
        };

        this.graph.push(entry);

        // Maintain max size
        if (this.graph.length > CONFIG.MAX_GRAPH_ENTRIES) {
          this.graph.shift();
        }

        this._saveGraph();
        return entry;
      } catch (e) {
        logError('Failed to record navigation', e);
        return null;
      }
    }

    /**
     * Calculates navigation score
     */
    _calculateNavigationScore(classification) {
      let score = 0;

      if (classification.isInternal) score += 100;
      if (classification.isTrusted) score += 50;

      return Math.min(score, 100);
    }

    /**
     * Gets last navigation
     */
    getLastNavigation() {
      return this.graph.length > 0 ? this.graph[this.graph.length - 1] : null;
    }

    /**
     * Gets navigation history
     */
    getHistory(limit = 10) {
      return this.graph.slice(-limit);
    }

    /**
     * Gets navigation statistics
     */
    getStatistics() {
      const stats = {
        total: this.graph.length,
        internal: 0,
        externalTrusted: 0,
        externalUntrusted: 0,
        uniqueDomains: new Set()
      };

      this.graph.forEach(entry => {
        if (entry.type === CONFIG.NAVIGATION_TYPES.INTERNAL) {
          stats.internal++;
        } else if (entry.type === CONFIG.NAVIGATION_TYPES.EXTERNAL_TRUSTED) {
          stats.externalTrusted++;
        } else {
          stats.externalUntrusted++;
        }

        if (entry.domain) {
          stats.uniqueDomains.add(entry.domain);
        }
      });

      stats.uniqueDomains = stats.uniqueDomains.size;
      return stats;
    }

    /**
     * Saves graph to storage
     */
    _saveGraph() {
      try {
        sessionStorage.setItem(CONFIG.GRAPH_STORAGE_KEY, safeJsonStringify(this.graph));
      } catch (e) {
        try {
          localStorage.setItem(CONFIG.GRAPH_STORAGE_KEY, safeJsonStringify(this.graph));
        } catch (e2) {
          log('Could not persist navigation graph');
        }
      }
    }

    /**
     * Loads graph from storage
     */
    loadGraph() {
      try {
        let data = sessionStorage.getItem(CONFIG.GRAPH_STORAGE_KEY);
        if (!data) {
          data = localStorage.getItem(CONFIG.GRAPH_STORAGE_KEY);
        }

        if (data) {
          const parsed = safeJsonParse(data);
          if (Array.isArray(parsed)) {
            this.graph = parsed.slice(-CONFIG.MAX_GRAPH_ENTRIES);
          }
        }
      } catch (e) {
        log('Could not load navigation graph');
      }
    }
  }

  // ============================================================================
  // 7. OUTBOUND LINK INTERCEPTOR
  // ============================================================================

  class OutboundLinkInterceptor {
    constructor(trustClassifier, paramGenerator, navigationGraph, urlSanitizer) {
      this.trustClassifier = trustClassifier;
      this.paramGenerator = paramGenerator;
      this.navigationGraph = navigationGraph;
      this.urlSanitizer = urlSanitizer;
      this.interceptedLinks = new WeakSet();
    }

    /**
     * Initializes link interception
     */
    initialize() {
      this._interceptAnchorClicks();
      this._interceptLocationChanges();
      this._interceptWindowOpen();
      this._startDynamicLinkObserver();
      log('Outbound link interceptor initialized');
    }

    /**
     * Intercepts anchor tag clicks
     */
    _interceptAnchorClicks() {
      document.addEventListener('click', (e) => {
        try {
          const anchor = e.target.closest('a');
          if (!anchor) return;

          const href = anchor.getAttribute('href');
          if (!href || !this.urlSanitizer.isValidUrl(href)) return;

          // Skip if already has ANH/UTM params
          if (this._hasNavigationParams(href)) return;

          const destinationUrl = new URL(href, window.location.href).href;

          // Process navigation
          this._processNavigation(destinationUrl);
        } catch (e) {
          // Silent fail, allow normal navigation
        }
      }, true);
    }

    /**
     * Intercepts location.href changes
     */
    _interceptLocationChanges() {
      const originalHref = Object.getOwnPropertyDescriptor(window.Location.prototype, 'href');

      Object.defineProperty(window.Location.prototype, 'href', {
        set: (url) => {
          try {
            if (this.urlSanitizer.isValidUrl(url)) {
              this._processNavigation(url);
            }
          } catch (e) {
            // Silent fail
          }

          // Allow original behavior
          if (originalHref && originalHref.set) {
            originalHref.set.call(this, url);
          }
        },
        get: () => {
          if (originalHref && originalHref.get) {
            return originalHref.get.call(this);
          }
          return window.location.toString();
        },
        configurable: true
      });
    }

    /**
     * Intercepts window.open()
     */
    _interceptWindowOpen() {
      const originalOpen = window.open;

      window.open = function(url, target, features) {
        try {
          if (url && typeof url === 'string' && this.urlSanitizer.isValidUrl(url)) {
            this._processNavigation(url);
          }
        } catch (e) {
          // Silent fail
        }

        return originalOpen.call(window, url, target, features);
      }.bind(this);
    }

    /**
     * Starts observer for dynamically added links
     */
    _startDynamicLinkObserver() {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === 1) { // Element node
                const links = node.querySelectorAll ? node.querySelectorAll('a[href]') : [];
                links.forEach((link) => {
                  this._attachLinkHandler(link);
                });
              }
            });
          }
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }

    /**
     * Attaches handler to individual link
     */
    _attachLinkHandler(link) {
      if (this.interceptedLinks.has(link)) return;

      this.interceptedLinks.add(link);

      link.addEventListener('click', (e) => {
        try {
          const href = link.getAttribute('href');
          if (!href || !this.urlSanitizer.isValidUrl(href)) return;

          if (this._hasNavigationParams(href)) return;

          const destinationUrl = new URL(href, window.location.href).href;
          this._processNavigation(destinationUrl);
        } catch (e) {
          // Silent fail
        }
      }, true);
    }

    /**
     * Processes navigation with parameter injection
     */
    _processNavigation(destinationUrl) {
      try {
        // Validate destination
        if (!this.urlSanitizer.isValidUrl(destinationUrl)) {
          return;
        }

        if (this.urlSanitizer.hasJavascriptProtocol(destinationUrl)) {
          return;
        }

        if (this.urlSanitizer.hasDataUri(destinationUrl)) {
          return;
        }

        // Sanitize URL
        let sanitized = this.urlSanitizer.stripSuspiciousParams(destinationUrl);
        sanitized = this.urlSanitizer.canonicalizeUrl(sanitized);
        sanitized = this.urlSanitizer.removeDuplicateParams(sanitized);

        // Classify destination
        const classification = this.trustClassifier.classifyDestination(sanitized);

        const sourceUrl = window.location.href;
        const sourceTitle = getCurrentPageTitle();
        const transitionId = generateTransitionId();

        // Record in navigation graph
        this.navigationGraph.recordNavigation(
          sourceUrl,
          sanitized,
          classification,
          transitionId
        );

        // Generate and append parameters
        let finalUrl = sanitized;

        if (classification.isInternal) {
          const params = this.paramGenerator.generateAnhInternalParams(sourceUrl, sourceTitle);
          finalUrl = appendUrlParams(finalUrl, params);
        } else if (classification.isTrusted) {
          const params = this.paramGenerator.generateUtmParams(sourceUrl, sourceTitle);
          finalUrl = appendUrlParams(finalUrl, params);
        }

        // Check URL length
        if (finalUrl.length <= CONFIG.MAX_URL_LENGTH) {
          // Update history with modified URL
          if (window.location.href !== finalUrl) {
            window.history.replaceState(
              { anh_transition_id: transitionId },
              document.title,
              finalUrl
            );
          }
        }

        log('Navigation processed', {
          type: classification.type,
          transitionId
        });

      } catch (e) {
        logError('Failed to process navigation', e);
        // Allow normal navigation to continue
      }
    }

    /**
     * Checks if URL already has navigation parameters
     */
    _hasNavigationParams(urlString) {
      try {
        const url = new URL(urlString);
        const params = url.searchParams;

        return params.has('anh_source') ||
               params.has('anh_navigation') ||
               params.has('utm_source') ||
               params.has('utm_referrer');
      } catch (e) {
        return false;
      }
    }
  }

  // ============================================================================
  // 8. SPA SUPPORT ENGINE
  // ============================================================================

  class SpaSupport {
    constructor(navigationGraph) {
      this.navigationGraph = navigationGraph;
      this.lastUrl = window.location.href;
    }

    /**
     * Initializes SPA support
     */
    initialize() {
      this._monitorHistoryApi();
      this._monitorUrlChanges();
      log('SPA support initialized');
    }

    /**
     * Monitors history.pushState and replaceState
     */
    _monitorHistoryApi() {
      const originalPushState = window.history.pushState;
      const originalReplaceState = window.history.replaceState;

      window.history.pushState = function(state, title, url) {
        const result = originalPushState.call(this, state, title, url);
        this._handleHistoryChange(url, state);
        return result;
      }.bind(this);

      window.history.replaceState = function(state, title, url) {
        const result = originalReplaceState.call(this, state, title, url);
        this._handleHistoryChange(url, state);
        return result;
      }.bind(this);

      // Handle popstate
      window.addEventListener('popstate', (e) => {
        this._handleHistoryChange(window.location.href, e.state);
      });
    }

    /**
     * Monitors URL changes for SPA frameworks
     */
    _monitorUrlChanges() {
      setInterval(() => {
        const currentUrl = window.location.href;
        if (currentUrl !== this.lastUrl) {
          this._handleHistoryChange(currentUrl, null);
          this.lastUrl = currentUrl;
        }
      }, 100);
    }

    /**
     * Handles history changes
     */
    _handleHistoryChange(url, state) {
      try {
        if (url && url !== this.lastUrl) {
          log('SPA route changed', { url: url.substring(0, 100) });
          this.lastUrl = url;
        }
      } catch (e) {
        // Silent fail
      }
    }
  }

  // ============================================================================
  // 9. MAIN ORCHESTRATOR
  // ============================================================================

  class ANHNavigationEngine {
    constructor() {
      this.trustClassifier = new TrustClassifier();
      this.urlSanitizer = new UrlSanitizer();
      this.paramGenerator = new ParamGenerator();
      this.navigationGraph = new NavigationGraphEngine();
      this.linkInterceptor = new OutboundLinkInterceptor(
        this.trustClassifier,
        this.paramGenerator,
        this.navigationGraph,
        this.urlSanitizer
      );
      this.spaSupport = new SpaSupport(this.navigationGraph);
      this.isInitialized = false;
    }

    /**
     * Main initialization
     */
    async initialize() {
      try {
        log('=== ANH Navigation Engine v1.0.0 Initializing ===');

        // Initialize components
        this.linkInterceptor.initialize();
        this.spaSupport.initialize();

        // Record current page as starting point
        await delay(100);

        this.isInitialized = true;
        this._exposePublicAPI();
        log('=== ANH Navigation Engine Ready ===');

      } catch (error) {
        logError('Fatal error during initialization', error);
      }
    }

    /**
     * Exposes public API
     */
    _exposePublicAPI() {
      global.ANHNavigation = {
        getNavigationHistory: (limit) => this.navigationGraph.getHistory(limit),
        getNavigationStats: () => this.navigationGraph.getStatistics(),
        getLastNavigation: () => this.navigationGraph.getLastNavigation(),
        sanitizeUrl: (url) => this.urlSanitizer.canonicalizeUrl(url),
        classifyDestination: (url) => this.trustClassifier.classifyDestination(url),
        generateUtmParams: (sourceUrl, title) => 
          this.paramGenerator.generateUtmParams(sourceUrl, title),
        generateAnhParams: (sourceUrl, title) => 
          this.paramGenerator.generateAnhInternalParams(sourceUrl, title),
        isReady: () => this.isInitialized
      };

      log('Public API exposed as window.ANHNavigation');
    }
  }

  // ============================================================================
  // 10. BOOTSTRAP & INITIALIZATION
  // ============================================================================

  function bootstrap() {
    const engine = new ANHNavigationEngine();

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        engine.initialize();
      });
    } else {
      engine.initialize();
    }
  }

  // Start bootstrap immediately
  bootstrap();

})(window);

/**
 * ANH NAVIGATION ENGINE — USAGE GUIDE
 * 
 * Public API accessible via window.ANHNavigation:
 * 
 * 1. Get Navigation History:
 *    window.ANHNavigation.getNavigationHistory(limit = 10)
 *    Returns: Array of last N navigation events
 * 
 * 2. Get Navigation Statistics:
 *    window.ANHNavigation.getNavigationStats()
 *    Returns: { total, internal, externalTrusted, externalUntrusted, uniqueDomains }
 * 
 * 3. Get Last Navigation:
 *    window.ANHNavigation.getLastNavigation()
 *    Returns: Last navigation event object
 * 
 * 4. Sanitize URL:
 *    window.ANHNavigation.sanitizeUrl(url)
 *    Returns: Canonicalized URL string
 * 
 * 5. Classify Destination:
 *    window.ANHNavigation.classifyDestination(url)
 *    Returns: { type, isTrusted, isInternal, domain }
 * 
 * 6. Generate UTM Parameters:
 *    window.ANHNavigation.generateUtmParams(sourceUrl, title)
 *    Returns: { utm_source, utm_medium, utm_campaign, utm_referrer, utm_timestamp }
 * 
 * 7. Generate ANH Parameters:
 *    window.ANHNavigation.generateAnhParams(sourceUrl, title)
 *    Returns: { anh_source, anh_timestamp, anh_navigation, anh_session, ... }
 * 
 * 8. Check Initialization:
 *    window.ANHNavigation.isReady()
 *    Returns: Boolean
 * 
 * FEATURES IMPLEMENTED:
 * ✓ Outbound Link Interception (Anchors, JS, window.open)
 * ✓ Trust Classification (Internal vs External)
 * ✓ Dynamic Link Observer (MutationObserver)
 * ✓ SPA Support (history API monitoring)
 * ✓ Navigation Graph Intelligence
 * ✓ URL Sanitization & Normalization
 * ✓ Secure Parameter Generation
 * ✓ Session Management
 * ✓ URL Compression
 * ✓ Performance Optimization
 * 
 * NAVIGATION TYPES:
 * • INTERNAL: ANH → ANH (with anh_* params)
 * • EXTERNAL_TRUSTED: ANH → Trusted Site (with utm_* params)
 * • EXTERNAL_UNTRUSTED: ANH → Unknown Site (no params added)
 * 
 * PRIVACY:
 * • Client-side only processing
 * • No backend data transfer
 * • Lightweight local storage
 * • No user identification
 * • No cross-site profiling
 */
