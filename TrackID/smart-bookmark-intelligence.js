/**
 * FILE: smart-bookmark-intelligence.js
 * ARCHITECT: Senior Browser Intelligence Architect
 * ECOSYSTEM: Akshat Network Hub (ANH) / Static / PWAs
 * DESCRIPTION: Advanced client-side intelligent bookmarking, crawling, and metadata extraction system.
 */

(function () {
    'use strict';

    // ==================================================================
    // CONFIGURATION & STATE
    // ==================================================================
    const CONFIG = {
        DB_NAME: 'BookmarkIntelligenceDB',
        DB_VERSION: 1,
        STORES: {
            bookmarks: 'Bookmarks',
            metadata: 'Metadata',
            seo: 'SEOScores',
            schemas: 'GeneratedSchemas',
            prefs: 'UserPreferences',
            search: 'SearchHistory'
        },
        PANEL_ID: 'anh-bookmark-dashboard-root',
        UI_Z_INDEX: 2147483647
    };

    const State = {
        db: null,
        pressedKeys: new Set(),
        dashboardElement: null,
        isDark: true,
        bookmarksCache: [],
        searchQuery: '',
        activeFilter: 'ALL',
        activeSort: 'DATE_DESC',
        crawlerAbortController: null
    };

    // ==================================================================
    // UTILITIES & SANITIZATION
    // ==================================================================
    const Utils = {
        escapeHTML(str) {
            if (!str) return '';
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        },
        normalizeUrl(url) {
            try {
                const u = new URL(url, window.location.href);
                return u.origin + u.pathname.replace(/\/$/, "");
            } catch {
                return url;
            }
        },
        debounce(func, wait) {
            let timeout;
            return function (...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), wait);
            };
        },
        generateId() {
            return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
        }
    };

    // ==================================================================
    // DATABASE LAYER (IndexedDB)
    // ==================================================================
    const DB = {
        init() {
            return new Promise((resolve, reject) => {
                const req = indexedDB.open(CONFIG.DB_NAME, CONFIG.DB_VERSION);
                req.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains(CONFIG.STORES.bookmarks)) {
                        const store = db.createObjectStore(CONFIG.STORES.bookmarks, { keyPath: 'url' });
                        store.createIndex('tier', 'tier', { unique: false });
                        store.createIndex('seoScore', 'seoScore', { unique: false });
                        store.createIndex('dateAdded', 'dateAdded', { unique: false });
                    }
                    Object.values(CONFIG.STORES).forEach(storeName => {
                        if (storeName !== CONFIG.STORES.bookmarks && !db.objectStoreNames.contains(storeName)) {
                            db.createObjectStore(storeName, { keyPath: 'id' });
                        }
                    });
                };
                req.onsuccess = (e) => {
                    State.db = e.target.result;
                    resolve(State.db);
                };
                req.onerror = () => reject(req.error);
            });
        },
        async transaction(storeName, mode, callback) {
            if (!State.db) await this.init();
            return new Promise((resolve, reject) => {
                const tx = State.db.transaction([storeName], mode);
                const store = tx.objectStore(storeName);
                let result;
                try {
                    result = callback(store);
                } catch (err) {
                    tx.abort();
                    return reject(err);
                }
                tx.oncomplete = () => resolve(result && result.result !== undefined ? result.result : result);
                tx.onerror = () => reject(tx.error);
            });
        },
        async getAllBookmarks() {
            return this.transaction(CONFIG.STORES.bookmarks, 'readonly', store => store.getAll());
        },
        async saveBookmark(data) {
            return this.transaction(CONFIG.STORES.bookmarks, 'readwrite', store => store.put(data));
        },
        async deleteBookmark(url) {
            return this.transaction(CONFIG.STORES.bookmarks, 'readwrite', store => store.delete(url));
        },
        async clearAll() {
            return this.transaction(CONFIG.STORES.bookmarks, 'readwrite', store => store.clear());
        }
    };

    // ==================================================================
    // METADATA EXTRACTION & SMART TAGGING
    // ==================================================================
    const IntelligenceEngine = {
        extractFromDOM(doc = document, sourceUrl = window.location.href, depth = 0) {
            const getMeta = (sel, attr = 'content') => {
                const el = doc.querySelector(sel);
                return el ? el.getAttribute(attr)?.trim() || '' : '';
            };

            const title = doc.title || getMeta('meta[property="og:title"]') || getMeta('meta[name="twitter:title"]') || 'Untitled';
            const description = getMeta('meta[name="description"]') || getMeta('meta[property="og:description"]') || '';
            const keywords = getMeta('meta[name="keywords"]');
            
            // Icon Strategy
            let icon = getMeta('link[rel="apple-touch-icon"]', 'href') || 
                       getMeta('link[rel="icon"]', 'href') || 
                       getMeta('link[rel="shortcut icon"]', 'href') || 
                       getMeta('meta[property="og:image"]');
            
            try { icon = icon ? new URL(icon, sourceUrl).href : new URL('/favicon.ico', sourceUrl).href; } 
            catch { icon = ''; }

            // ANH Integration
            let seoScore = null, trustScore = null, tier = 'UNVERIFIED', validationStatus = 'PENDING';
            if (sourceUrl === window.location.href) {
                if (window.ANH_SEO) {
                    seoScore = window.ANH_SEO.score || 0;
                    trustScore = window.ANH_SEO.trust || 0;
                }
                if (window.ANH_ID) {
                    tier = window.ANH_META?.tier || 'TIER-1';
                    validationStatus = 'VALIDATED';
                    trustScore = 100;
                }
            }

            return {
                url: Utils.normalizeUrl(sourceUrl),
                title,
                description,
                keywords,
                icon,
                favicon: icon,
                ogImage: getMeta('meta[property="og:image"]'),
                ogTitle: getMeta('meta[property="og:title"]'),
                ogDescription: getMeta('meta[property="og:description"]'),
                dateAdded: Date.now(),
                lastVisited: Date.now(),
                seoScore,
                trustScore,
                tier,
                validationStatus,
                tags: this.generateTags(title, description, keywords, doc, sourceUrl),
                sourcePage: window.location.href,
                crawlDepth: depth
            };
        },
        generateTags(title, desc, kw, doc, url) {
            const tags = new Set();
            const text = `${title} ${desc} ${kw} ${url}`.toLowerCase();
            const dictionary = ['seo', 'javascript', 'portfolio', 'quizzone', 'trackerjs', 'akshat network hub', 'validationsystem', 'react', 'pwa'];
            
            dictionary.forEach(term => { if (text.includes(term)) tags.add(term.toUpperCase()); });
            
            Array.from(doc.querySelectorAll('h1, h2')).slice(0, 3).forEach(h => {
                h.textContent.trim().split(/\s+/).forEach(w => {
                    if (w.length > 4 && /^[a-zA-Z]+$/.test(w)) tags.add(w.toUpperCase());
                });
            });
            return Array.from(tags).slice(0, 6);
        },
        generateJSONLD(bookmark) {
            return {
                "@context": "https://schema.org",
                "@type": "WebPage",
                "name": bookmark.title,
                "description": bookmark.description,
                "url": bookmark.url,
                "image": bookmark.icon,
                "dateCreated": new Date(bookmark.dateAdded).toISOString(),
                "keywords": bookmark.tags.join(', ')
            };
        }
    };

    // ==================================================================
    // SMART CRAWLER (DEPTH PIPELINE)
    // ==================================================================
    const CrawlerEngine = {
        async crawlTarget(url, depth, signal) {
            if (signal?.aborted) return null;
            try {
                const res = await fetch(url, { signal, headers: { 'Accept': 'text/html' } });
                if (!res.ok) return null;
                const html = await res.text();
                const doc = new DOMParser().parseFromString(html, 'text/html');
                return IntelligenceEngine.extractFromDOM(doc, url, depth);
            } catch {
                return null;
            }
        },
        async extractLinks(url, signal, doc = null) {
            try {
                if (!doc) {
                    const res = await fetch(url, { signal });
                    const text = await res.text();
                    doc = new DOMParser().parseFromString(text, 'text/html');
                }
                const base = new URL(url);
                return Array.from(doc.querySelectorAll('a[href]'))
                    .map(a => {
                        try { return new URL(a.getAttribute('href'), url); } catch { return null; }
                    })
                    .filter(u => u && u.hostname === base.hostname && !u.hash)
                    .map(u => Utils.normalizeUrl(u.href));
            } catch { return []; }
        },
        async runAdvancedCrawl(startUrl) {
            if (State.crawlerAbortController) State.crawlerAbortController.abort();
            State.crawlerAbortController = new AbortController();
            const signal = State.crawlerAbortController.signal;
            
            const queue = [{ url: startUrl, depth: 0 }];
            const visited = new Set([startUrl]);
            let count = 0;

            // Optional: Visual Notification Trigger
            UIEngine.showToast("Starting Advanced Deep Crawl (Depth: 2)...");

            while (queue.length > 0 && count < 50) { // Safety limit
                if (signal.aborted) break;
                const { url, depth } = queue.shift();
                if (depth > 2) continue;

                let record = depth === 0 
                    ? IntelligenceEngine.extractFromDOM(document, url, depth)
                    : await this.crawlTarget(url, depth, signal);

                if (record) {
                    await DB.saveBookmark(record);
                    count++;
                    
                    if (depth < 2) {
                        const links = await this.extractLinks(url, signal, depth === 0 ? document : null);
                        for (const link of links) {
                            if (!visited.has(link)) {
                                visited.add(link);
                                queue.push({ url: link, depth: depth + 1 });
                            }
                        }
                    }
                }
            }
            State.crawlerAbortController = null;
            UIEngine.showToast(`Crawl Complete. Indexed ${count} pages.`);
            if (State.dashboardElement) UIEngine.refreshData();
        }
    };

    // ==================================================================
    // USER INTERFACE & DASHBOARD ENGINE
    // ==================================================================
    const UIEngine = {
        injectCSS() {
            if (document.getElementById('anh-bm-styles')) return;
            const style = document.createElement('style');
            style.id = 'anh-bm-styles';
            style.textContent = `
                :root {
                    --anh-bg: #0f172a; --anh-panel: #1e293b; --anh-border: #334155;
                    --anh-text: #f8fafc; --anh-text-muted: #94a3b8; --anh-primary: #3b82f6;
                    --anh-danger: #ef4444; --anh-success: #10b981; --anh-tier: #06b6d4;
                }
                [data-anh-theme="light"] {
                    --anh-bg: #f8fafc; --anh-panel: #ffffff; --anh-border: #e2e8f0;
                    --anh-text: #0f172a; --anh-text-muted: #64748b;
                }
                #${CONFIG.PANEL_ID} {
                    position: fixed; top: 10vh; left: 15vw; width: 70vw; height: 80vh;
                    background: var(--anh-bg); color: var(--anh-text); border: 1px solid var(--anh-border);
                    border-radius: 12px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
                    z-index: ${CONFIG.UI_Z_INDEX}; display: flex; flex-direction: column;
                    font-family: system-ui, -apple-system, sans-serif; overflow: hidden;
                    transition: width 0.3s, height 0.3s, top 0.3s, left 0.3s;
                }
                .anh-bm-header {
                    padding: 16px; background: var(--anh-panel); border-bottom: 1px solid var(--anh-border);
                    display: flex; justify-content: space-between; align-items: center; cursor: move; user-select: none;
                }
                .anh-bm-body { display: flex; flex: 1; overflow: hidden; }
                .anh-bm-sidebar {
                    width: 240px; background: var(--anh-panel); border-right: 1px solid var(--anh-border);
                    padding: 16px; display: flex; flex-direction: column; gap: 12px; overflow-y: auto;
                }
                .anh-bm-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
                .anh-bm-toolbar { padding: 12px 20px; border-bottom: 1px solid var(--anh-border); display: flex; gap: 12px; }
                .anh-bm-grid {
                    flex: 1; padding: 20px; overflow-y: auto; display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; align-content: start;
                }
                .anh-bm-card {
                    background: var(--anh-panel); border: 1px solid var(--anh-border); border-radius: 8px;
                    padding: 16px; display: flex; flex-direction: column; gap: 8px; transition: transform 0.2s;
                }
                .anh-bm-card:hover { transform: translateY(-2px); border-color: var(--anh-primary); }
                .anh-bm-input, .anh-bm-select {
                    background: var(--anh-bg); color: var(--anh-text); border: 1px solid var(--anh-border);
                    padding: 8px 12px; border-radius: 6px; font-size: 13px; width: 100%; box-sizing: border-box;
                }
                .anh-bm-btn {
                    background: var(--anh-border); color: var(--anh-text); border: none;
                    padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 12px; transition: filter 0.2s;
                }
                .anh-bm-btn:hover { filter: brightness(1.2); }
                .anh-bm-btn.primary { background: var(--anh-primary); color: white; }
                .anh-bm-btn.danger { background: var(--anh-danger); color: white; }
                .anh-bm-badge { padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; }
                .anh-bm-tags { display: flex; flex-wrap: wrap; gap: 4px; }
                .anh-bm-tag { background: var(--anh-bg); padding: 2px 8px; border-radius: 12px; font-size: 10px; border: 1px solid var(--anh-border); }
                .anh-bm-filter-btn { text-align: left; background: transparent; border: none; color: var(--anh-text-muted); padding: 8px; cursor: pointer; border-radius: 4px; }
                .anh-bm-filter-btn:hover, .anh-bm-filter-btn.active { background: var(--anh-bg); color: var(--anh-primary); }
                #anh-bm-toast {
                    position: fixed; bottom: 20px; right: 20px; background: var(--anh-primary); color: white;
                    padding: 12px 24px; border-radius: 8px; z-index: ${CONFIG.UI_Z_INDEX + 1}; font-size: 14px;
                    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3); opacity: 0; transition: opacity 0.3s; pointer-events: none;
                }
            `;
            document.head.appendChild(style);
        },
        async open() {
            if (State.dashboardElement) return;
            
            // Auto Panel Coordination
            const seoPanel = document.getElementById('anh-seo-auditor-panel') || document.querySelector('[id*="seo-panel"]');
            if (seoPanel) seoPanel.remove();

            this.injectCSS();
            await DB.init();

            State.dashboardElement = document.createElement('div');
            State.dashboardElement.id = CONFIG.PANEL_ID;
            State.dashboardElement.setAttribute('data-anh-theme', State.isDark ? 'dark' : 'light');
            
            this.renderSkeleton();
            document.body.appendChild(State.dashboardElement);
            
            this.bindEvents();
            await this.refreshData();
        },
        close() {
            if (State.dashboardElement) {
                State.dashboardElement.remove();
                State.dashboardElement = null;
            }
        },
        renderSkeleton() {
            State.dashboardElement.innerHTML = `
                <div class="anh-bm-header" id="anh-bm-drag-handle">
                    <div style="font-weight: bold; display: flex; align-items: center; gap: 8px;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                        ANH Bookmark Intelligence
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="anh-bm-btn" id="anh-bm-theme-toggle">🌗</button>
                        <button class="anh-bm-btn" id="anh-bm-fullscreen">⛶</button>
                        <button class="anh-bm-btn danger" id="anh-bm-close">✕</button>
                    </div>
                </div>
                <div class="anh-bm-body">
                    <div class="anh-bm-sidebar">
                        <div style="font-size: 11px; text-transform: uppercase; color: var(--anh-text-muted); font-weight: bold;">Filters</div>
                        <button class="anh-bm-filter-btn active" data-filter="ALL">All Bookmarks</button>
                        <button class="anh-bm-filter-btn" data-filter="TIER_1">Tier-1 Validated</button>
                        <button class="anh-bm-filter-btn" data-filter="EXCELLENT_SEO">Excellent SEO (80+)</button>
                        <button class="anh-bm-filter-btn" data-filter="RECENT">Recently Added</button>
                        <hr style="border:0; border-top: 1px solid var(--anh-border); width: 100%;">
                        <div style="font-size: 11px; text-transform: uppercase; color: var(--anh-text-muted); font-weight: bold;">Export</div>
                        <button class="anh-bm-btn" id="anh-bm-exp-json">Export JSON-LD</button>
                        <button class="anh-bm-btn" id="anh-bm-exp-csv">Export CSV</button>
                        <button class="anh-bm-btn danger" id="anh-bm-clear-all" style="margin-top: auto;">Wipe Database</button>
                    </div>
                    <div class="anh-bm-main">
                        <div class="anh-bm-toolbar">
                            <input type="text" class="anh-bm-input" id="anh-bm-search" placeholder="Search by title, url, tags..." style="flex:1;">
                            <select class="anh-bm-select" id="anh-bm-sort" style="width: 150px;">
                                <option value="DATE_DESC">Newest First</option>
                                <option value="DATE_ASC">Oldest First</option>
                                <option value="SEO_DESC">Highest SEO</option>
                                <option value="TITLE_ASC">A-Z</option>
                            </select>
                        </div>
                        <div class="anh-bm-grid" id="anh-bm-grid"></div>
                    </div>
                </div>
            `;
        },
        async refreshData() {
            State.bookmarksCache = await DB.getAllBookmarks();
            this.renderGrid();
        },
        renderGrid() {
            const grid = document.getElementById('anh-bm-grid');
            if (!grid) return;

            let data = [...State.bookmarksCache];

            // Apply Search
            if (State.searchQuery) {
                const q = State.searchQuery.toLowerCase();
                data = data.filter(item => 
                    item.title.toLowerCase().includes(q) || 
                    item.url.toLowerCase().includes(q) || 
                    item.tags.some(t => t.toLowerCase().includes(q))
                );
            }

            // Apply Filters
            if (State.activeFilter === 'TIER_1') data = data.filter(i => i.tier === 'TIER-1');
            if (State.activeFilter === 'EXCELLENT_SEO') data = data.filter(i => i.seoScore >= 80);
            if (State.activeFilter === 'RECENT') data = data.filter(i => (Date.now() - i.dateAdded) < 86400000);

            // Apply Sort
            data.sort((a, b) => {
                if (State.activeSort === 'DATE_DESC') return b.dateAdded - a.dateAdded;
                if (State.activeSort === 'DATE_ASC') return a.dateAdded - b.dateAdded;
                if (State.activeSort === 'SEO_DESC') return (b.seoScore || 0) - (a.seoScore || 0);
                if (State.activeSort === 'TITLE_ASC') return a.title.localeCompare(b.title);
                return 0;
            });

            // Virtualization Strategy: Chunked rendering via DocumentFragment to prevent main thread lock
            grid.innerHTML = '';
            if (data.length === 0) {
                grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--anh-text-muted); padding: 40px;">No bookmarks found.</div>`;
                return;
            }

            const fragment = document.createDocumentFragment();
            // Implement a safe limit for initial render to ensure performance (Virtualization subset)
            const renderLimit = Math.min(data.length, 100); 

            for (let i = 0; i < renderLimit; i++) {
                const item = data[i];
                const card = document.createElement('div');
                card.className = 'anh-bm-card';
                
                const seoColor = item.seoScore >= 80 ? 'var(--anh-success)' : (item.seoScore >= 50 ? '#f59e0b' : 'var(--anh-danger)');
                const desc = item.description ? (item.description.length > 80 ? item.description.substring(0, 80) + '...' : item.description) : 'No description.';

                card.innerHTML = `
                    <div style="display: flex; gap: 12px; align-items: flex-start;">
                        <img src="${Utils.escapeHTML(item.icon)}" style="width: 32px; height: 32px; border-radius: 6px; background: var(--anh-bg); object-fit: cover;" onerror="this.style.display='none'">
                        <div style="flex: 1; min-width: 0;">
                            <div style="font-weight: 600; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${Utils.escapeHTML(item.title)}">${Utils.escapeHTML(item.title)}</div>
                            <a href="${Utils.escapeHTML(item.url)}" target="_blank" style="font-size: 11px; color: var(--anh-primary); text-decoration: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block;">${Utils.escapeHTML(item.url)}</a>
                        </div>
                    </div>
                    <div style="font-size: 12px; color: var(--anh-text-muted); flex: 1;">${Utils.escapeHTML(desc)}</div>
                    <div class="anh-bm-tags">
                        ${item.tags.slice(0,4).map(t => `<span class="anh-bm-tag">${Utils.escapeHTML(t)}</span>`).join('')}
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--anh-border); padding-top: 8px; margin-top: 4px;">
                        <div style="display: flex; gap: 6px;">
                            <span class="anh-bm-badge" style="background: var(--anh-tier); color: white;">${Utils.escapeHTML(item.tier)}</span>
                            <span class="anh-bm-badge" style="background: ${seoColor}; color: white;">SEO: ${item.seoScore ?? 'N/A'}</span>
                        </div>
                        <div style="display: flex; gap: 4px;">
                            <button class="anh-bm-btn" onclick="window.ANH_BOOKMARK.delete('${Utils.escapeHTML(item.url)}')" style="padding: 4px 8px; font-size: 10px; background: var(--anh-danger); color: white;">Wipe</button>
                        </div>
                    </div>
                `;
                fragment.appendChild(card);
            }
            grid.appendChild(fragment);
        },
        bindEvents() {
            // Drag Logic
            const header = document.getElementById('anh-bm-drag-handle');
            let isDragging = false, startX, startY, startLeft, startTop;
            
            header.addEventListener('mousedown', (e) => {
                if(e.target.tagName === 'BUTTON') return;
                isDragging = true;
                startX = e.clientX; startY = e.clientY;
                startLeft = State.dashboardElement.offsetLeft;
                startTop = State.dashboardElement.offsetTop;
                State.dashboardElement.style.transition = 'none';
            });
            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                State.dashboardElement.style.left = `${startLeft + (e.clientX - startX)}px`;
                State.dashboardElement.style.top = `${startTop + (e.clientY - startY)}px`;
            });
            document.addEventListener('mouseup', () => { 
                isDragging = false; 
                if(State.dashboardElement) State.dashboardElement.style.transition = 'width 0.3s, height 0.3s, top 0.3s, left 0.3s';
            });

            // Window Controls
            document.getElementById('anh-bm-close').addEventListener('click', () => this.close());
            document.getElementById('anh-bm-theme-toggle').addEventListener('click', () => {
                State.isDark = !State.isDark;
                State.dashboardElement.setAttribute('data-anh-theme', State.isDark ? 'dark' : 'light');
            });
            document.getElementById('anh-bm-fullscreen').addEventListener('click', () => {
                const el = State.dashboardElement;
                if (el.style.width === '100vw') {
                    el.style.width = '70vw'; el.style.height = '80vh';
                    el.style.top = '10vh'; el.style.left = '15vw';
                } else {
                    el.style.width = '100vw'; el.style.height = '100vh';
                    el.style.top = '0'; el.style.left = '0';
                }
            });

            // Search & Sort
            document.getElementById('anh-bm-search').addEventListener('input', Utils.debounce((e) => {
                State.searchQuery = e.target.value;
                this.renderGrid();
            }, 300));
            document.getElementById('anh-bm-sort').addEventListener('change', (e) => {
                State.activeSort = e.target.value;
                this.renderGrid();
            });

            // Sidebar Filters
            document.querySelectorAll('.anh-bm-filter-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    document.querySelectorAll('.anh-bm-filter-btn').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                    State.activeFilter = e.target.getAttribute('data-filter');
                    this.renderGrid();
                });
            });

            // Export & Wipe
            document.getElementById('anh-bm-clear-all').addEventListener('click', async () => {
                if(confirm("Wipe all intelligence data?")) {
                    await DB.clearAll();
                    await this.refreshData();
                }
            });
            document.getElementById('anh-bm-exp-json').addEventListener('click', () => this.exportData('json'));
            document.getElementById('anh-bm-exp-csv').addEventListener('click', () => this.exportData('csv'));
        },
        exportData(format) {
            let content, type, filename;
            if (format === 'json') {
                const schemas = State.bookmarksCache.map(b => IntelligenceEngine.generateJSONLD(b));
                content = JSON.stringify({ "@context": "https://schema.org", "@type": "BookmarkCollection", "itemListElement": schemas }, null, 2);
                type = 'application/ld+json';
                filename = 'anh_intelligence_export.jsonld';
            } else if (format === 'csv') {
                content = "Title,URL,SEO_Score,Tier,Date_Added\n" + State.bookmarksCache.map(b => 
                    `"${(b.title||'').replace(/"/g, '""')}","${b.url}",${b.seoScore||0},${b.tier},${new Date(b.dateAdded).toISOString()}`
                ).join('\n');
                type = 'text/csv';
                filename = 'anh_intelligence_export.csv';
            }
            const blob = new Blob([content], { type });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = filename;
            a.click();
            URL.revokeObjectURL(a.href);
        },
        showToast(msg) {
            let toast = document.getElementById('anh-bm-toast');
            if (!toast) {
                toast = document.createElement('div');
                toast.id = 'anh-bm-toast';
                document.body.appendChild(toast);
            }
            toast.textContent = msg;
            toast.style.opacity = '1';
            setTimeout(() => { toast.style.opacity = '0'; }, 3000);
        }
    };

    // ==================================================================
    // SHORTCUT COORDINATOR
    // ==================================================================
    const ShortcutEngine = {
        init() {
            window.addEventListener('keydown', (e) => {
                State.pressedKeys.add(e.key.toUpperCase());
                
                // ESC: Close Dashboard
                if (e.key === 'Escape') UIEngine.close();

                // CTRL + S + B: Open Dashboard
                if (e.ctrlKey && State.pressedKeys.has('S') && State.pressedKeys.has('B')) {
                    e.preventDefault();
                    UIEngine.open();
                }

                // SHIFT + B + A: Advanced Depth 2 Crawl
                if (e.shiftKey && State.pressedKeys.has('B') && State.pressedKeys.has('A')) {
                    e.preventDefault();
                    CrawlerEngine.runAdvancedCrawl(window.location.href);
                    State.pressedKeys.clear(); // Flush
                    return;
                }

                // SHIFT + B: Basic Bookmark Current Page
                if (e.shiftKey && e.key.toUpperCase() === 'B' && !State.pressedKeys.has('A')) {
                    e.preventDefault();
                    const record = IntelligenceEngine.extractFromDOM(document, window.location.href, 0);
                    DB.saveBookmark(record).then(() => {
                        UIEngine.showToast("Page Indexed in Intelligence DB.");
                        if (State.dashboardElement) UIEngine.refreshData();
                    });
                }
            });

            window.addEventListener('keyup', (e) => State.pressedKeys.delete(e.key.toUpperCase()));
            window.addEventListener('blur', () => State.pressedKeys.clear());
        }
    };

    // ==================================================================
    // PUBLIC API & INITIALIZATION
    // ==================================================================
    window.ANH_BOOKMARK = {
        async add(url) {
            const record = await CrawlerEngine.crawlTarget(Utils.normalizeUrl(url), 0, null);
            if (record) {
                await DB.saveBookmark(record);
                if (State.dashboardElement) UIEngine.refreshData();
                return true;
            }
            return false;
        },
        async addCurrent() {
            const record = IntelligenceEngine.extractFromDOM(document, window.location.href, 0);
            await DB.saveBookmark(record);
            if (State.dashboardElement) UIEngine.refreshData();
        },
        addDepth2() {
            CrawlerEngine.runAdvancedCrawl(window.location.href);
        },
        open() { UIEngine.open(); },
        close() { UIEngine.close(); },
        export() { UIEngine.exportData('json'); },
        async search(query) {
            const data = await DB.getAllBookmarks();
            const q = query.toLowerCase();
            return data.filter(i => i.title.toLowerCase().includes(q) || i.url.toLowerCase().includes(q));
        },
        async delete(url) {
            await DB.deleteBookmark(url);
            UIEngine.showToast("Record wiped.");
            if (State.dashboardElement) UIEngine.refreshData();
        },
        async clear() {
            await DB.clearAll();
            if (State.dashboardElement) UIEngine.refreshData();
        }
    };

    // Bootstrap
    document.addEventListener('DOMContentLoaded', () => {
        DB.init().then(() => ShortcutEngine.init()).catch(console.error);
    });

})();
