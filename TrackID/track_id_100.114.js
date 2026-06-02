/**
 * ANH Analytics & SEO Governance Engine — track_id_100.114.js
 * 
 * Advanced client-side analytics and SEO optimization for Akshat Network Hub
 * Provides:
 * - Daily screen time tracking and analytics
 * - Base64-compressed historical reporting
 * - AI traffic detection and analysis
 * - Dynamic breadcrumb and JSON-LD injection
 * - Cross-project user interaction intelligence
 * - SEO runtime optimization
 * 
 * Architecture: Client-side only, IndexedDB-powered, privacy-first
 * 
 * @version 1.0.0
 * @author ANH Analytics Team
 * @license MIT
 */

(function (global) {
  'use strict';

  // ============================================================================
  // 1. CONFIGURATION & CONSTANTS
  // ============================================================================

  const CONFIG = {
    DB_NAME: 'ANH_INTERACTION_INTELLIGENCE',
    DB_VERSION: 1,
    OBJECT_STORES: {
      DAILY_SCREEN_LOGS: 'daily_screen_logs',
      BASE64_ARCHIVES: 'base64_archives',
      AI_TRAFFIC: 'ai_traffic',
      BREADCRUMB_CACHE: 'breadcrumb_cache',
      NAVIGATION_MEMORY: 'navigation_memory',
      SEO_RUNTIME: 'seo_runtime'
    },
    REPORT_GENERATION_INTERVAL: 86400000, // 24 hours in ms
    IDLE_TIMEOUT: 300000, // 5 minutes of inactivity
    HEARTBEAT_INTERVAL: 10000, // 10 seconds
    ANALYTICS_MERGE_WINDOW: 30, // days to consider for merge
    AI_SOURCES: {
      CHATGPT: 'chatgpt',
      GEMINI: 'gemini',
      CLAUDE: 'claude',
      PERPLEXITY: 'perplexity',
      COPILOT: 'copilot',
      GROK: 'grok',
      POE: 'poe',
      YOU_COM: 'you_com',
      PHIND: 'phind',
      META_AI: 'meta_ai',
      DEEPSEEK: 'deepseek'
    },
    AI_DETECTION_PATTERNS: {
      chatgpt: /openai|chat\.openai|gpt/i,
      gemini: /google.*ai|gemini|bard/i,
      claude: /claude|anthropic/i,
      perplexity: /perplexity/i,
      copilot: /microsoft.*copilot|copilot/i,
      grok: /grok|x\.ai/i,
      poe: /poe\.com/i,
      you_com: /you\.com/i,
      phind: /phind/i,
      meta_ai: /meta\.ai|facebook\.ai/i,
      deepseek: /deepseek/i
    }
  };

  // ============================================================================
  // 2. UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Safe logging
   */
  function log(message, data = null) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[ANH Analytics ${timestamp}] ${message}`, data || '');
  }

  /**
   * Safe error logging
   */
  function logError(message, error = null) {
    console.error(`[ANH Analytics ERROR] ${message}`, error || '');
  }

  /**
   * Gets ISO timestamp
   */
  function getISOTimestamp() {
    return new Date().toISOString();
  }

  /**
   * Gets date string (YYYY-MM-DD)
   */
  function getDateString(timestamp = new Date()) {
    return timestamp.toISOString().split('T')[0];
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
   * Encodes to Base64
   */
  function encodeToBase64(str) {
    try {
      return btoa(str);
    } catch (e) {
      logError('Base64 encoding failed', e);
      return '';
    }
  }

  /**
   * Decodes from Base64
   */
  function decodeFromBase64(str) {
    try {
      return atob(str);
    } catch (e) {
      logError('Base64 decoding failed', e);
      return '';
    }
  }

  /**
   * Compresses JSON string
   */
  function compressJson(obj) {
    const json = safeJsonStringify(obj);
    return encodeToBase64(json);
  }

  /**
   * Decompresses Base64 JSON
   */
  function decompressJson(encoded) {
    const json = decodeFromBase64(encoded);
    return safeJsonParse(json);
  }

  /**
   * Gets current page title
   */
  function getCurrentPageTitle() {
    return document.title || 'Untitled';
  }

  /**
   * Gets current page URL
   */
  function getCurrentPageUrl() {
    return window.location.href;
  }

  /**
   * Sanitizes string for HTML/JSON
   */
  function sanitizeForHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Sanitizes string for JSON-LD
   */
  function sanitizeForJsonLd(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/[<>]/g, '')
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
      return '';
    }
  }

  /**
   * Gets URL query parameter
   */
  function getUrlParam(name) {
    try {
      return new URLSearchParams(window.location.search).get(name);
    } catch (e) {
      return null;
    }
  }

  /**
   * Delays execution
   */
  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Uses requestIdleCallback with fallback
   */
  function scheduleIdleCallback(callback) {
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(callback, { timeout: 2000 });
    } else {
      setTimeout(callback, 100);
    }
  }

  // ============================================================================
  // 3. INDEXEDDB MANAGER
  // ============================================================================

  class AnalyticsDbManager {
    constructor() {
      this.db = null;
      this.isInitialized = false;
    }

    /**
     * Initializes IndexedDB
     */
    async initialize() {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(CONFIG.DB_NAME, CONFIG.DB_VERSION);

        request.onerror = () => {
          logError('IndexedDB open failed', request.error);
          reject(request.error);
        };

        request.onsuccess = () => {
          this.db = request.result;
          this.isInitialized = true;
          log('Analytics IndexedDB initialized');
          resolve(this.db);
        };

        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          this._createObjectStores(db);
        };
      });
    }

    /**
     * Creates object stores
     */
    _createObjectStores(db) {
      if (!db.objectStoreNames.contains(CONFIG.OBJECT_STORES.DAILY_SCREEN_LOGS)) {
        const store = db.createObjectStore(CONFIG.OBJECT_STORES.DAILY_SCREEN_LOGS, 
                                           { keyPath: 'id', autoIncrement: true });
        store.createIndex('date', 'date', { unique: false });
        store.createIndex('url', 'url', { unique: false });
      }

      if (!db.objectStoreNames.contains(CONFIG.OBJECT_STORES.BASE64_ARCHIVES)) {
        const store = db.createObjectStore(CONFIG.OBJECT_STORES.BASE64_ARCHIVES, 
                                           { keyPath: 'date', unique: true });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }

      if (!db.objectStoreNames.contains(CONFIG.OBJECT_STORES.AI_TRAFFIC)) {
        const store = db.createObjectStore(CONFIG.OBJECT_STORES.AI_TRAFFIC, 
                                           { keyPath: 'id', autoIncrement: true });
        store.createIndex('aiSource', 'aiSource', { unique: false });
        store.createIndex('date', 'date', { unique: false });
      }

      if (!db.objectStoreNames.contains(CONFIG.OBJECT_STORES.BREADCRUMB_CACHE)) {
        db.createObjectStore(CONFIG.OBJECT_STORES.BREADCRUMB_CACHE, 
                           { keyPath: 'id', autoIncrement: true });
      }

      if (!db.objectStoreNames.contains(CONFIG.OBJECT_STORES.NAVIGATION_MEMORY)) {
        db.createObjectStore(CONFIG.OBJECT_STORES.NAVIGATION_MEMORY, 
                           { keyPath: 'id', autoIncrement: true });
      }

      if (!db.objectStoreNames.contains(CONFIG.OBJECT_STORES.SEO_RUNTIME)) {
        db.createObjectStore(CONFIG.OBJECT_STORES.SEO_RUNTIME, 
                           { keyPath: 'id', autoIncrement: true });
      }

      log('Analytics object stores created');
    }

    /**
     * Adds or updates record
     */
    async addOrUpdate(storeName, data) {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(data);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }

    /**
     * Gets record
     */
    async get(storeName, key) {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }

    /**
     * Gets all records
     */
    async getAll(storeName) {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }

    /**
     * Gets by index
     */
    async getAllByIndex(storeName, indexName, value) {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.getAll(value);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }

    /**
     * Deletes record
     */
    async delete(storeName, key) {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }

    /**
     * Clears store
     */
    async clearStore(storeName) {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }

  // ============================================================================
  // 4. SCREEN TIME ENGINE
  // ============================================================================

  class ScreenTimeEngine {
    constructor(dbManager) {
      this.dbManager = dbManager;
      this.sessionStart = Date.now();
      this.lastHeartbeat = Date.now();
      this.isActive = true;
      this.isVisible = true;
      this.idleTimer = null;
    }

    /**
     * Initializes screen time tracking
     */
    async initialize() {
      this._attachVisibilityListener();
      this._attachFocusListener();
      this._startHeartbeat();
      log('Screen time engine initialized');
    }

    /**
     * Attaches visibility change listener
     */
    _attachVisibilityListener() {
      document.addEventListener('visibilitychange', () => {
        this.isVisible = !document.hidden;
        if (this.isVisible) {
          this.sessionStart = Date.now();
          this.lastHeartbeat = Date.now();
        }
      });
    }

    /**
     * Attaches focus/blur listeners
     */
    _attachFocusListener() {
      window.addEventListener('focus', () => {
        this.isActive = true;
        this._resetIdleTimer();
      });

      window.addEventListener('blur', () => {
        this.isActive = false;
      });

      // Detect inactivity
      document.addEventListener('mousemove', () => this._resetIdleTimer(), true);
      document.addEventListener('keydown', () => this._resetIdleTimer(), true);
      document.addEventListener('click', () => this._resetIdleTimer(), true);
    }

    /**
     * Resets idle timer
     */
    _resetIdleTimer() {
      clearTimeout(this.idleTimer);
      this.isActive = true;

      this.idleTimer = setTimeout(() => {
        this.isActive = false;
      }, CONFIG.IDLE_TIMEOUT);
    }

    /**
     * Starts heartbeat for periodic updates
     */
    _startHeartbeat() {
      setInterval(() => {
        this._recordHeartbeat();
      }, CONFIG.HEARTBEAT_INTERVAL);
    }

    /**
     * Records heartbeat
     */
    async _recordHeartbeat() {
      try {
        if (!this.isVisible || !this.isActive) return;

        const now = Date.now();
        const timeElapsed = now - this.lastHeartbeat;
        this.lastHeartbeat = now;

        const record = {
          url: getCurrentPageUrl(),
          title: getCurrentPageTitle(),
          screenTime: timeElapsed / 1000, // Convert to seconds
          timestamp: getISOTimestamp(),
          date: getDateString(),
          isActive: this.isActive,
          isVisible: this.isVisible
        };

        await this.dbManager.addOrUpdate(CONFIG.OBJECT_STORES.DAILY_SCREEN_LOGS, record);
      } catch (e) {
        logError('Failed to record heartbeat', e);
      }
    }

    /**
     * Gets total screen time for today
     */
    async getTodayScreenTime() {
      try {
        const today = getDateString();
        const records = await this.dbManager.getAllByIndex(
          CONFIG.OBJECT_STORES.DAILY_SCREEN_LOGS,
          'date',
          today
        );

        let totalTime = 0;
        const pageStats = {};

        records.forEach(record => {
          totalTime += record.screenTime || 0;
          if (!pageStats[record.url]) {
            pageStats[record.url] = {
              url: record.url,
              title: record.title,
              totalTime: 0,
              visitCount: 0
            };
          }
          pageStats[record.url].totalTime += record.screenTime || 0;
          pageStats[record.url].visitCount++;
        });

        return {
          totalTime,
          pageStats: Object.values(pageStats),
          recordCount: records.length
        };
      } catch (e) {
        logError('Failed to get today screen time', e);
        return null;
      }
    }

    /**
     * Gets screen time for specific date range
     */
    async getScreenTimeRange(startDate, endDate) {
      try {
        const allRecords = await this.dbManager.getAll(CONFIG.OBJECT_STORES.DAILY_SCREEN_LOGS);

        const filtered = allRecords.filter(r => {
          return r.date >= startDate && r.date <= endDate;
        });

        const byDate = {};
        filtered.forEach(record => {
          if (!byDate[record.date]) {
            byDate[record.date] = { totalTime: 0, pages: {} };
          }
          byDate[record.date].totalTime += record.screenTime || 0;

          if (!byDate[record.date].pages[record.url]) {
            byDate[record.date].pages[record.url] = 0;
          }
          byDate[record.date].pages[record.url] += record.screenTime || 0;
        });

        return byDate;
      } catch (e) {
        logError('Failed to get screen time range', e);
        return {};
      }
    }
  }

  // ============================================================================
  // 5. DAILY ANALYTICS GENERATOR
  // ============================================================================

  class DailyAnalyticsGenerator {
    constructor(dbManager, screenTimeEngine) {
      this.dbManager = dbManager;
      this.screenTimeEngine = screenTimeEngine;
      this.lastGenerationDate = getDateString();
    }

    /**
     * Initializes analytics generator
     */
    async initialize() {
      // Generate initial report
      await this.checkAndGenerateReport();

      // Schedule daily reports
      setInterval(() => {
        this.checkAndGenerateReport();
      }, CONFIG.REPORT_GENERATION_INTERVAL);

      log('Daily analytics generator initialized');
    }

    /**
     * Checks if new report should be generated
     */
    async checkAndGenerateReport() {
      const today = getDateString();

      if (today !== this.lastGenerationDate) {
        this.lastGenerationDate = today;
        await this.generateDailyReport();
      }
    }

    /**
     * Generates daily report and archives as Base64
     */
    async generateDailyReport() {
      try {
        const yesterday = getDateString(new Date(Date.now() - 86400000));

        // Get yesterday's screen time data
        const records = await this.dbManager.getAllByIndex(
          CONFIG.OBJECT_STORES.DAILY_SCREEN_LOGS,
          'date',
          yesterday
        );

        if (records.length === 0) {
          log(`No data to archive for ${yesterday}`);
          return;
        }

        // Aggregate data
        const aggregated = this._aggregateScreenTime(records, yesterday);

        // Create report
        const report = {
          date: yesterday,
          generatedAt: getISOTimestamp(),
          totalScreenTime: aggregated.totalScreenTime,
          visitCount: aggregated.visitCount,
          pageBreakdown: aggregated.pageBreakdown,
          aiSources: await this._getAiSourcesForDate(yesterday)
        };

        // Compress and encode
        const compressed = compressJson(report);

        // Store in archive
        const archiveEntry = {
          date: yesterday,
          timestamp: getISOTimestamp(),
          base64Data: compressed,
          originalSize: safeJsonStringify(report).length,
          compressedSize: compressed.length,
          compressionRatio: (compressed.length / safeJsonStringify(report).length * 100).toFixed(2)
        };

        await this.dbManager.addOrUpdate(CONFIG.OBJECT_STORES.BASE64_ARCHIVES, archiveEntry);

        // Delete raw data for yesterday
        const toDelete = records;
        for (const record of toDelete) {
          await this.dbManager.delete(CONFIG.OBJECT_STORES.DAILY_SCREEN_LOGS, record.id);
        }

        log(`Daily report archived for ${yesterday}`, {
          compressed: compressed.length,
          ratio: archiveEntry.compressionRatio + '%'
        });

        // Merge historical data
        await this.mergeHistoricalReports();

      } catch (e) {
        logError('Failed to generate daily report', e);
      }
    }

    /**
     * Aggregates screen time data
     */
    _aggregateScreenTime(records, date) {
      let totalScreenTime = 0;
      const pageBreakdown = {};

      records.forEach(record => {
        totalScreenTime += record.screenTime || 0;

        if (!pageBreakdown[record.url]) {
          pageBreakdown[record.url] = {
            title: record.title,
            totalTime: 0,
            visitCount: 0
          };
        }

        pageBreakdown[record.url].totalTime += record.screenTime || 0;
        pageBreakdown[record.url].visitCount++;
      });

      return {
        totalScreenTime: Math.round(totalScreenTime),
        visitCount: records.length,
        pageBreakdown
      };
    }

    /**
     * Gets AI sources for date
     */
    async _getAiSourcesForDate(date) {
      try {
        const records = await this.dbManager.getAllByIndex(
          CONFIG.OBJECT_STORES.AI_TRAFFIC,
          'date',
          date
        );

        const sources = {};
        records.forEach(record => {
          if (!sources[record.aiSource]) {
            sources[record.aiSource] = 0;
          }
          sources[record.aiSource]++;
        });

        return sources;
      } catch (e) {
        return {};
      }
    }

    /**
     * Merges historical reports
     */
    async mergeHistoricalReports() {
      try {
        const archives = await this.dbManager.getAll(CONFIG.OBJECT_STORES.BASE64_ARCHIVES);

        if (archives.length < 2) return;

        // Get recent archives
        const recentArchives = archives.slice(-CONFIG.ANALYTICS_MERGE_WINDOW);

        // Decode and merge
        const merged = {
          period: `${recentArchives[0].date} to ${recentArchives[recentArchives.length - 1].date}`,
          reports: recentArchives.length,
          mergedAt: getISOTimestamp(),
          data: {}
        };

        let totalScreenTime = 0;
        let totalVisits = 0;

        recentArchives.forEach(archive => {
          const decoded = decompressJson(archive.base64Data);
          if (decoded) {
            totalScreenTime += decoded.totalScreenTime || 0;
            totalVisits += decoded.visitCount || 0;

            // Merge page breakdowns
            if (decoded.pageBreakdown) {
              Object.keys(decoded.pageBreakdown).forEach(url => {
                if (!merged.data[url]) {
                  merged.data[url] = { totalTime: 0, visitCount: 0 };
                }
                merged.data[url].totalTime += decoded.pageBreakdown[url].totalTime || 0;
                merged.data[url].visitCount += decoded.pageBreakdown[url].visitCount || 0;
              });
            }
          }
        });

        merged.totalScreenTime = totalScreenTime;
        merged.totalVisits = totalVisits;

        log('Historical reports merged', {
          reports: merged.reports,
          screenTime: merged.totalScreenTime
        });

        return merged;
      } catch (e) {
        logError('Failed to merge historical reports', e);
        return null;
      }
    }
  }

  // ============================================================================
  // 6. AI TRAFFIC DETECTOR
  // ============================================================================

  class AiTrafficDetector {
    constructor(dbManager) {
      this.dbManager = dbManager;
      this.detectedSource = null;
    }

    /**
     * Initializes AI detection
     */
    async initialize() {
      this.detectedSource = await this.detectAiSource();
      if (this.detectedSource) {
        await this.recordAiVisit();
        log(`AI traffic detected: ${this.detectedSource}`);
      }
    }

    /**
     * Detects AI traffic source
     */
    async detectAiSource() {
      const referrer = document.referrer;
      const url = getCurrentPageUrl();
      const utmSource = getUrlParam('utm_source');
      const utmReferrer = getUrlParam('utm_referrer');

      // Check referrer patterns
      for (const [source, pattern] of Object.entries(CONFIG.AI_DETECTION_PATTERNS)) {
        if (pattern.test(referrer)) {
          return source;
        }
      }

      // Check URL patterns
      for (const [source, pattern] of Object.entries(CONFIG.AI_DETECTION_PATTERNS)) {
        if (pattern.test(url)) {
          return source;
        }
      }

      // Check UTM params
      if (utmSource) {
        for (const [source, pattern] of Object.entries(CONFIG.AI_DETECTION_PATTERNS)) {
          if (pattern.test(utmSource)) {
            return source;
          }
        }
      }

      // Check UTM referrer
      if (utmReferrer) {
        for (const [source, pattern] of Object.entries(CONFIG.AI_DETECTION_PATTERNS)) {
          if (pattern.test(utmReferrer)) {
            return source;
          }
        }
      }

      return null;
    }

    /**
     * Records AI visit
     */
    async recordAiVisit() {
      try {
        const record = {
          aiSource: this.detectedSource,
          referrer: sanitizeForJsonLd(document.referrer),
          url: getCurrentPageUrl(),
          title: getCurrentPageTitle(),
          timestamp: getISOTimestamp(),
          date: getDateString(),
          userAgent: navigator.userAgent.substring(0, 100)
        };

        await this.dbManager.addOrUpdate(CONFIG.OBJECT_STORES.AI_TRAFFIC, record);
      } catch (e) {
        logError('Failed to record AI visit', e);
      }
    }

    /**
     * Gets AI traffic analytics
     */
    async getAiAnalytics(days = 30) {
      try {
        const allRecords = await this.dbManager.getAll(CONFIG.OBJECT_STORES.AI_TRAFFIC);

        const startDate = getDateString(new Date(Date.now() - days * 86400000));
        const filtered = allRecords.filter(r => r.date >= startDate);

        const analytics = {
          totalAiVisits: filtered.length,
          bySource: {},
          topPages: {}
        };

        filtered.forEach(record => {
          // Count by source
          if (!analytics.bySource[record.aiSource]) {
            analytics.bySource[record.aiSource] = 0;
          }
          analytics.bySource[record.aiSource]++;

          // Track top pages
          if (!analytics.topPages[record.url]) {
            analytics.topPages[record.url] = {
              title: record.title,
              visits: 0
            };
          }
          analytics.topPages[record.url].visits++;
        });

        // Sort top pages
        analytics.topPages = Object.values(analytics.topPages)
          .sort((a, b) => b.visits - a.visits)
          .slice(0, 10);

        return analytics;
      } catch (e) {
        logError('Failed to get AI analytics', e);
        return null;
      }
    }
  }

  // ============================================================================
  // 7. NAVIGATION MEMORY ENGINE
  // ============================================================================

  class NavigationMemoryEngine {
    constructor(dbManager) {
      this.dbManager = dbManager;
      this.navigationChain = [];
      this.loadNavigationMemory();
    }

    /**
     * Initializes navigation memory
     */
    async initialize() {
      this.recordCurrentPage();
    }

    /**
     * Records current page in navigation memory
     */
    async recordCurrentPage() {
      try {
        const memory = {
          url: getCurrentPageUrl(),
          title: getCurrentPageTitle(),
          timestamp: getISOTimestamp(),
          referrer: document.referrer
        };

        this.navigationChain.push(memory);
        if (this.navigationChain.length > 50) {
          this.navigationChain.shift();
        }

        await this.dbManager.addOrUpdate(CONFIG.OBJECT_STORES.NAVIGATION_MEMORY, memory);
      } catch (e) {
        logError('Failed to record navigation', e);
      }
    }

    /**
     * Gets navigation history
     */
    getNavigationHistory(limit = 10) {
      return this.navigationChain.slice(-limit);
    }

    /**
     * Gets last ANH page
     */
    async getLastAnhPage() {
      try {
        const records = await this.dbManager.getAll(CONFIG.OBJECT_STORES.NAVIGATION_MEMORY);
        const anhRecords = records.filter(r => 
          r.url.includes('akshat-881236') || 
          r.url.includes('akshat-145609') ||
          r.url.includes('dpgnotes') ||
          r.url.includes('anh-dashboard')
        );

        return anhRecords.length > 0 ? anhRecords[anhRecords.length - 1] : null;
      } catch (e) {
        return null;
      }
    }

    /**
     * Gets previous page
     */
    getPreviousPage() {
      if (this.navigationChain.length >= 2) {
        return this.navigationChain[this.navigationChain.length - 2];
      }
      return null;
    }

    /**
     * Loads navigation memory from storage
     */
    async loadNavigationMemory() {
      try {
        const records = await this.dbManager.getAll(CONFIG.OBJECT_STORES.NAVIGATION_MEMORY);
        this.navigationChain = records.slice(-50);
      } catch (e) {
        log('Could not load navigation memory');
      }
    }
  }

  // ============================================================================
  // 8. BREADCRUMB GENERATOR
  // ============================================================================

  class BreadcrumbGenerator {
    constructor(navigationMemory, aiDetector) {
      this.navigationMemory = navigationMemory;
      this.aiDetector = aiDetector;
    }

    /**
     * Generates breadcrumbs
     */
    async generateBreadcrumbs() {
      try {
        const breadcrumbs = [];

        // Add home
        breadcrumbs.push({
          name: 'Home',
          url: window.location.origin,
          position: 1
        });

        // Add previous ANH page if exists
        const lastAnhPage = await this.navigationMemory.getLastAnhPage();
        if (lastAnhPage && lastAnhPage.url !== getCurrentPageUrl()) {
          breadcrumbs.push({
            name: lastAnhPage.title || 'Previous Page',
            url: lastAnhPage.url,
            position: breadcrumbs.length + 1
          });
        }

        // Add AI entry if detected
        if (this.aiDetector.detectedSource) {
          breadcrumbs.push({
            name: `From ${this.aiDetector.detectedSource}`,
            position: breadcrumbs.length + 1
          });
        }

        // Add current page
        breadcrumbs.push({
          name: getCurrentPageTitle(),
          url: getCurrentPageUrl(),
          position: breadcrumbs.length + 1,
          current: true
        });

        return breadcrumbs;
      } catch (e) {
        logError('Failed to generate breadcrumbs', e);
        return [];
      }
    }

    /**
     * Parses breadcrumbs from URL path
     */
    parseBreadcrumbsFromUrl() {
      try {
        const path = window.location.pathname;
        const segments = path.split('/').filter(s => s.length > 0);

        const breadcrumbs = [];
        let basePath = '';

        segments.forEach((segment, index) => {
          basePath += '/' + segment;
          breadcrumbs.push({
            name: decodeURIComponent(segment)
              .replace(/-/g, ' ')
              .replace(/^\w/, c => c.toUpperCase()),
            url: basePath,
            position: index + 2
          });
        });

        return breadcrumbs;
      } catch (e) {
        return [];
      }
    }
  }

  // ============================================================================
  // 9. JSON-LD INJECTOR
  // ============================================================================

  class JsonLdInjector {
    constructor(breadcrumbGenerator, navigationMemory, aiDetector) {
      this.breadcrumbGenerator = breadcrumbGenerator;
      this.navigationMemory = navigationMemory;
      this.aiDetector = aiDetector;
      this.injectedScripts = [];
    }

    /**
     * Initializes JSON-LD injection
     */
    async initialize() {
      await delay(100);
      await this.injectBreadcrumbSchema();
      await this.injectWebPageSchema();
      await this.injectOrganizationSchema();
      log('JSON-LD schemas injected');
    }

    /**
     * Injects breadcrumb schema
     */
    async injectBreadcrumbSchema() {
      try {
        const breadcrumbs = await this.breadcrumbGenerator.generateBreadcrumbs();

        const schema = {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: breadcrumbs.map((crumb, index) => ({
            '@type': 'ListItem',
            position: crumb.position,
            name: sanitizeForJsonLd(crumb.name),
            item: crumb.url || getCurrentPageUrl()
          }))
        };

        this._injectSchema(schema);
      } catch (e) {
        logError('Failed to inject breadcrumb schema', e);
      }
    }

    /**
     * Injects webpage schema
     */
    async injectWebPageSchema() {
      try {
        const lastAnhPage = await this.navigationMemory.getLastAnhPage();

        const schema = {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: sanitizeForJsonLd(getCurrentPageTitle()),
          url: getCurrentPageUrl(),
          datePublished: getISOTimestamp(),
          dateModified: getISOTimestamp()
        };

        // Add related link if AI entry
        if (this.aiDetector.detectedSource) {
          schema.mentions = {
            '@type': 'Thing',
            name: this.aiDetector.detectedSource
          };
        }

        // Add previous page reference
        if (lastAnhPage) {
          schema.isPartOf = {
            '@type': 'WebSite',
            name: sanitizeForJsonLd(lastAnhPage.title),
            url: lastAnhPage.url
          };
        }

        this._injectSchema(schema);
      } catch (e) {
        logError('Failed to inject webpage schema', e);
      }
    }

    /**
     * Injects organization schema
     */
    injectOrganizationSchema() {
      try {
        const schema = {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Akshat Network Hub',
          url: 'https://akshat-881236.github.io/AkshatNetworkHub/',
          logo: 'https://akshat-881236.github.io/TrackerJS/Assets/AKNH/icon-192.png',
          description: 'Educational tools and portfolio ecosystem',
          sameAs: [
            'https://github.com/Akshat-881236',
            'https://linkedin.com/in/akshat-network-hub',
            'https://www.linkedin.com/in/akshat-prasad-anh/'
          ]
        };

        this._injectSchema(schema);
      } catch (e) {
        logError('Failed to inject organization schema', e);
      }
    }

    /**
     * Injects JSON-LD script tag
     */
    _injectSchema(schema) {
      try {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = safeJsonStringify(schema);
        document.head.appendChild(script);
        this.injectedScripts.push(script);
      } catch (e) {
        logError('Failed to inject schema', e);
      }
    }
  }

  // ============================================================================
  // 10. SEO RUNTIME ENGINE
  // ============================================================================

  class SeoRuntimeEngine {
    constructor() {
      this.runtimeElements = [];
    }

    /**
     * Initializes SEO runtime
     */
    async initialize() {
      this.injectCanonicalTag();
      this.injectMetaTags();
    }

    /**
     * Injects canonical tag
     */
    injectCanonicalTag() {
      try {
        let canonical = document.querySelector('link[rel="canonical"]');
        if (!canonical) {
          canonical = document.createElement('link');
          canonical.rel = 'canonical';
          document.head.appendChild(canonical);
        }

        canonical.href = getCurrentPageUrl().split('?')[0].split('#')[0];
        this.runtimeElements.push(canonical);
      } catch (e) {
        logError('Failed to inject canonical tag', e);
      }
    }

    /**
     * Injects meta tags
     */
    injectMetaTags() {
      try {
        // Description
        let description = document.querySelector('meta[name="description"]');
        if (!description) {
          description = document.createElement('meta');
          description.name = 'description';
          document.head.appendChild(description);
        }
        if (!description.content) {
          description.content = sanitizeForJsonLd(getCurrentPageTitle());
        }

        // OG tags
        this._ensureMetaTag('og:title', getCurrentPageTitle());
        this._ensureMetaTag('og:url', getCurrentPageUrl());
        this._ensureMetaTag('og:type', 'website');

        this.runtimeElements.push(description);
      } catch (e) {
        logError('Failed to inject meta tags', e);
      }
    }

    /**
     * Ensures meta tag exists
     */
    _ensureMetaTag(property, content) {
      try {
        let meta = document.querySelector(`meta[property="${property}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.property = property;
          document.head.appendChild(meta);
        }
        meta.content = sanitizeForJsonLd(content);
        this.runtimeElements.push(meta);
      } catch (e) {
        // Silent fail
      }
    }
  }

  // ============================================================================
  // 11. BREADCRUMB UI INJECTOR
  // ============================================================================

  class BreadcrumbUiInjector {
    constructor(breadcrumbGenerator) {
      this.breadcrumbGenerator = breadcrumbGenerator;
      this.containerElement = null;
    }

    /**
     * Initializes breadcrumb UI
     */
    async initialize() {
      await delay(200);
      await this.injectBreadcrumbUI();
    }

    /**
     * Injects breadcrumb UI into page
     */
    async injectBreadcrumbUI() {
      try {
        // Check if breadcrumb element already exists
        if (document.querySelector('.anh-breadcrumbs-container')) {
          return;
        }

        const breadcrumbs = await this.breadcrumbGenerator.generateBreadcrumbs();

        if (breadcrumbs.length === 0) return;

        const container = document.createElement('nav');
        container.className = 'anh-breadcrumbs-container';
        container.setAttribute('aria-label', 'Breadcrumb');

        const list = document.createElement('ol');
        list.className = 'anh-breadcrumbs-list';

        breadcrumbs.forEach((crumb, index) => {
          const item = document.createElement('li');
          item.className = 'anh-breadcrumbs-item';

          if (crumb.current) {
            item.className += ' current';
            item.textContent = sanitizeForHtml(crumb.name);
          } else if (crumb.url) {
            const link = document.createElement('a');
            link.href = crumb.url;
            link.textContent = sanitizeForHtml(crumb.name);
            item.appendChild(link);
          } else {
            item.textContent = sanitizeForHtml(crumb.name);
          }

          // Add separator
          if (index < breadcrumbs.length - 1) {
            item.setAttribute('data-separator', '/');
          }

          list.appendChild(item);
        });

        container.appendChild(list);
        this._attachStyles();
        this._insertBreadcrumbs(container);

        this.containerElement = container;
      } catch (e) {
        logError('Failed to inject breadcrumb UI', e);
      }
    }

    /**
     * Inserts breadcrumbs into appropriate location
     */
    _insertBreadcrumbs(container) {
      try {
        // Try common locations
        const possible = [
          document.querySelector('main'),
          document.querySelector('article'),
          document.querySelector('body > *:first-child'),
          document.body
        ];

        for (const location of possible) {
          if (location) {
            location.insertBefore(container, location.firstChild);
            return;
          }
        }
      } catch (e) {
        logError('Failed to insert breadcrumbs', e);
      }
    }

    /**
     * Attaches breadcrumb styles
     */
    _attachStyles() {
      if (document.getElementById('anh-breadcrumbs-styles')) return;

      const style = document.createElement('style');
      style.id = 'anh-breadcrumbs-styles';
      style.textContent = `
        .anh-breadcrumbs-container {
          margin: 16px 0;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 4px;
          font-size: 14px;
        }

        .anh-breadcrumbs-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
        }

        .anh-breadcrumbs-item {
          display: inline-flex;
          align-items: center;
          margin: 4px;
        }

        .anh-breadcrumbs-item::after {
          content: attr(data-separator);
          margin: 0 8px;
          color: #999;
        }

        .anh-breadcrumbs-item:last-child::after {
          content: '';
          margin: 0;
        }

        .anh-breadcrumbs-item a {
          color: #0066cc;
          text-decoration: none;
          transition: color 0.2s;
        }

        .anh-breadcrumbs-item a:hover {
          color: #0052a3;
          text-decoration: underline;
        }

        .anh-breadcrumbs-item.current {
          color: #666;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .anh-breadcrumbs-container {
            font-size: 12px;
          }

          .anh-breadcrumbs-item {
            margin: 2px;
          }

          .anh-breadcrumbs-item::after {
            margin: 0 4px;
          }
        }
      `;

      document.head.appendChild(style);
    }
  }

  // ============================================================================
  // 12. MAIN ORCHESTRATOR
  // ============================================================================

  class ANHAnalyticsEngine {
    constructor() {
      this.dbManager = null;
      this.screenTimeEngine = null;
      this.analyticsGenerator = null;
      this.aiDetector = null;
      this.navigationMemory = null;
      this.breadcrumbGenerator = null;
      this.jsonLdInjector = null;
      this.seoRuntimeEngine = null;
      this.breadcrumbUiInjector = null;
      this.isInitialized = false;
    }

    /**
     * Main initialization
     */
    async initialize() {
      try {
        log('=== ANH Analytics & SEO Engine v1.0.0 Initializing ===');

        // Initialize database
        this.dbManager = new AnalyticsDbManager();
        await this.dbManager.initialize();

        // Initialize screen time tracking
        this.screenTimeEngine = new ScreenTimeEngine(this.dbManager);
        await this.screenTimeEngine.initialize();

        // Initialize daily analytics generator
        this.analyticsGenerator = new DailyAnalyticsGenerator(
          this.dbManager,
          this.screenTimeEngine
        );
        await this.analyticsGenerator.initialize();

        // Initialize AI traffic detection
        this.aiDetector = new AiTrafficDetector(this.dbManager);
        await this.aiDetector.initialize();

        // Initialize navigation memory
        this.navigationMemory = new NavigationMemoryEngine(this.dbManager);
        await this.navigationMemory.initialize();

        // Initialize breadcrumb generator
        this.breadcrumbGenerator = new BreadcrumbGenerator(
          this.navigationMemory,
          this.aiDetector
        );

        // Initialize JSON-LD injector
        this.jsonLdInjector = new JsonLdInjector(
          this.breadcrumbGenerator,
          this.navigationMemory,
          this.aiDetector
        );
        await this.jsonLdInjector.initialize();

        // Initialize SEO runtime
        this.seoRuntimeEngine = new SeoRuntimeEngine();
        await this.seoRuntimeEngine.initialize();

        // Initialize breadcrumb UI
        this.breadcrumbUiInjector = new BreadcrumbUiInjector(this.breadcrumbGenerator);
        await this.breadcrumbUiInjector.initialize();

        this.isInitialized = true;
        this._exposePublicAPI();
        log('=== ANH Analytics & SEO Engine Ready ===');

      } catch (error) {
        logError('Fatal error during initialization', error);
      }
    }

    /**
     * Exposes public API
     */
    _exposePublicAPI() {
      global.ANHAnalytics = {
        getScreenTime: () => this.screenTimeEngine.getTodayScreenTime(),
        getScreenTimeRange: (start, end) => this.screenTimeEngine.getScreenTimeRange(start, end),
        getAiAnalytics: (days) => this.aiDetector.getAiAnalytics(days),
        getNavigationHistory: (limit) => this.navigationMemory.getNavigationHistory(limit),
        getBreadcrumbs: () => this.breadcrumbGenerator.generateBreadcrumbs(),
        getNavigationStats: () => ({
          aiDetected: this.aiDetector.detectedSource,
          navigationChainLength: this.navigationMemory.navigationChain.length
        }),
        isReady: () => this.isInitialized
      };

      log('Public API exposed as window.ANHAnalytics');
    }
  }

  // ============================================================================
  // 13. BOOTSTRAP & INITIALIZATION
  // ============================================================================

  function bootstrap() {
    const engine = new ANHAnalyticsEngine();

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        engine.initialize();
      });
    } else {
      engine.initialize();
    }
  }

  // Start bootstrap
  bootstrap();

})(window);

/**
 * ANH ANALYTICS & SEO ENGINE — USAGE GUIDE
 * 
 * Public API accessible via window.ANHAnalytics:
 * 
 * 1. Get Today's Screen Time:
 *    window.ANHAnalytics.getScreenTime()
 *    Returns: { totalTime, pageStats, recordCount }
 * 
 * 2. Get Screen Time Range:
 *    window.ANHAnalytics.getScreenTimeRange(startDate, endDate)
 *    Returns: Object with date-indexed screen time data
 * 
 * 3. Get AI Traffic Analytics:
 *    window.ANHAnalytics.getAiAnalytics(days = 30)
 *    Returns: { totalAiVisits, bySource, topPages }
 * 
 * 4. Get Navigation History:
 *    window.ANHAnalytics.getNavigationHistory(limit = 10)
 *    Returns: Array of navigation events
 * 
 * 5. Get Breadcrumbs:
 *    window.ANHAnalytics.getBreadcrumbs()
 *    Returns: Array of breadcrumb objects
 * 
 * 6. Get Navigation Stats:
 *    window.ANHAnalytics.getNavigationStats()
 *    Returns: { aiDetected, navigationChainLength }
 * 
 * 7. Check Initialization:
 *    window.ANHAnalytics.isReady()
 *    Returns: Boolean
 * 
 * FEATURES IMPLEMENTED:
 * ✓ Screen Time Tracking (Active time only)
 * ✓ Daily Analytics Generation
 * ✓ Base64 Compression & Archiving
 * ✓ Historical Report Merging
 * ✓ AI Traffic Detection (11+ sources)
 * ✓ Navigation Memory System
 * ✓ Breadcrumb Generation (Visual + Schema)
 * ✓ JSON-LD Injection (Multiple schema types)
 * ✓ SEO Runtime Optimization
 * ✓ Responsive Breadcrumb UI
 * 
 * AI SOURCES DETECTED:
 * • ChatGPT/OpenAI
 * • Google Gemini
 * • Anthropic Claude
 * • Perplexity AI
 * • Microsoft Copilot
 * • Grok (X.AI)
 * • Poe
 * • You.com
 * • Phind
 * • Meta AI
 * • DeepSeek
 * 
 * PRIVACY:
 * • All processing client-side
 * • No backend data transfer
 * • No fingerprinting
 * • No user identification
 * • Local storage only
 * • Base64 compression for efficiency
 */
