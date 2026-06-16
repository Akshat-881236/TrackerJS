/**
 * © Akshat Network Hub
 * FILE: user-journey-tracker.js
 * RESPONSIBILITY: Journey reconstruction, Resume card history, Funnel progression
 * DATABASES: FunnelTrackerDB, ContentAffinityDB, DeepLinkHistoryDB
 * NETWORKING: Strict Local Mode (No fetch, No Server Calls, No Cloud Sync)
 */

(function () {
    'use strict';

    // --- UTILITY COMPONENT: LOCAL COOKIE ENGINES ---
    const CookieManager = {
        set(name, value, days = 7) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            document.cookie = `${name}=${encodeURIComponent(value)}; expires=${date.toUTCString()}; path=/; SameSite=Strict`;
        },
        get(name) {
            const matches = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1')}=([^;]*)`));
            return matches ? decodeURIComponent(matches[1]) : null;
        },
        delete(name) {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict`;
        }
    };

    // --- DATABASE MANAGER ---
    function openDatabase(dbName, storeName) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(dbName, 1);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(storeName)) {
                    db.createObjectStore(storeName, { keyPath: 'id' });
                }
            };
            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => reject(e.target.error);
        });
    }

    function writeRecord(db, storeName, record) {
        return new Promise((resolve, reject) => {
            if (!db) return resolve(false);
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(record);
            request.onsuccess = () => resolve(true);
            transaction.onerror = (e) => reject(e.target.error);
        });
    }

    function readRecord(db, storeName, id) {
        return new Promise((resolve, reject) => {
            if (!db) return resolve(null);
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            transaction.onerror = (e) => reject(e.target.error);
        });
    }

    // ==================================================================
    // MODULE 1: FunnelEngine
    // TARGET COOKIE: funnel_milestone_tracker
    // ==================================================================
    const FunnelEngine = {
        db: null,
        dbName: 'FunnelTrackerDB',
        storeName: 'funnel_state',

        async init() {
            try {
                this.db = await openDatabase(this.dbName, this.storeName);
                await this.evaluateFunnelPosition();
            } catch (error) {
                console.error("Funnel Engine Initialisation Failure:", error);
            }
        },

        async evaluateFunnelPosition() {
            const currentUrl = window.location.href;
            
            // Simple string matching criteria for funnel stage detection
            if (currentUrl.includes('thank-you') || currentUrl.includes('success')) {
                await this.funnel_milestone_tracker_FUNNEL_CONVERTED();
            } else if (currentUrl.includes('checkout') || currentUrl.includes('cart') || currentUrl.includes('apply')) {
                await this.funnel_milestone_tracker_FUNNEL_HIGH_INTENT();
            } else {
                const existing = CookieManager.get('funnel_milestone_tracker');
                if (!existing) {
                    await this.funnel_milestone_tracker_FUNNEL_ENTRY();
                } else if (existing.startsWith('FUNNEL_ENTRY')) {
                    await this.funnel_milestone_tracker_FUNNEL_BROWSING();
                } else if (existing.startsWith('FUNNEL_HIGH_INTENT')) {
                    // If they were at high intent but returned to a normal page, flag as stalled
                    await this.funnel_milestone_tracker_FUNNEL_STALLED();
                }
            }
        },

        async funnel_milestone_tracker_FUNNEL_ENTRY() {
            CookieManager.set('funnel_milestone_tracker', 'FUNNEL_ENTRY', 30);
            await writeRecord(this.db, this.storeName, { id: 'current_funnel', state: 'FUNNEL_ENTRY', url: window.location.href, timestamp: Date.now() });
        },

        async funnel_milestone_tracker_FUNNEL_BROWSING() {
            CookieManager.set('funnel_milestone_tracker', 'FUNNEL_BROWSING', 30);
            await writeRecord(this.db, this.storeName, { id: 'current_funnel', state: 'FUNNEL_BROWSING', url: window.location.href, timestamp: Date.now() });
        },

        async funnel_milestone_tracker_FUNNEL_HIGH_INTENT() {
            CookieManager.set('funnel_milestone_tracker', 'FUNNEL_HIGH_INTENT', 30);
            await writeRecord(this.db, this.storeName, { id: 'current_funnel', state: 'FUNNEL_HIGH_INTENT', url: window.location.href, timestamp: Date.now() });
        },

        async funnel_milestone_tracker_FUNNEL_STALLED() {
            CookieManager.set('funnel_milestone_tracker', 'FUNNEL_STALLED', 30);
            await writeRecord(this.db, this.storeName, { id: 'current_funnel', state: 'FUNNEL_STALLED', url: window.location.href, timestamp: Date.now() });
        },

        async funnel_milestone_tracker_FUNNEL_CONVERTED() {
            CookieManager.set('funnel_milestone_tracker', 'FUNNEL_CONVERTED', 30);
            await writeRecord(this.db, this.storeName, { id: 'current_funnel', state: 'FUNNEL_CONVERTED', url: window.location.href, timestamp: Date.now() });
        }
    };

    // ==================================================================
    // MODULE 2: JourneyEngine
    // TARGET COOKIE: content_affinity_profile
    // ==================================================================
    const JourneyEngine = {
        db: null,
        dbName: 'ContentAffinityDB',
        storeName: 'affinity_metrics',

        async init() {
            try {
                this.db = await openDatabase(this.dbName, this.storeName);
                await this.buildJourneyMap();
            } catch (error) {
                console.error("Journey Engine Initialisation Failure:", error);
            }
        },

        async buildJourneyMap() {
            let record = await readRecord(this.db, this.storeName, 'affinity_profile');
            const now = Date.now();

            if (!record) {
                record = { id: 'affinity_profile', categoryCounts: {}, lastVisit: now, currentAffinity: 'AFFINITY_NEUTRAL' };
                await this.content_affinity_profile_AFFINITY_NEUTRAL(record);
                return;
            }

            // Check Cooldown (if user hasn't visited site in 7 days)
            if (now - record.lastVisit > 7 * 24 * 60 * 60 * 1000) {
                await this.content_affinity_profile_AFFINITY_COOLDOWN(record);
                return;
            }

            // Categorize page context based on meta tags or pathname
            const segments = window.location.pathname.split('/').filter(Boolean);
            const category = segments[0] || 'general';

            record.categoryCounts[category] = (record.categoryCounts[category] || 0) + 1;
            record.lastVisit = now;

            const views = record.categoryCounts[category];

            if (views >= 7) {
                await this.content_affinity_profile_AFFINITY_VALIDATED(category, record);
            } else if (views >= 4) {
                await this.content_affinity_profile_AFFINITY_SECONDARY(category, record);
            } else if (views >= 2) {
                await this.content_affinity_profile_AFFINITY_PRIMARY(category, record);
            } else {
                record.currentAffinity = 'AFFINITY_NEUTRAL';
                CookieManager.set('content_affinity_profile', 'AFFINITY_NEUTRAL:general', 14);
                await writeRecord(this.db, this.storeName, record);
            }
        },

        async content_affinity_profile_AFFINITY_NEUTRAL(record) {
            CookieManager.set('content_affinity_profile', 'AFFINITY_NEUTRAL:general', 14);
            record.currentAffinity = 'AFFINITY_NEUTRAL';
            await writeRecord(this.db, this.storeName, record);
        },

        async content_affinity_profile_AFFINITY_PRIMARY(cat, record) {
            CookieManager.set('content_affinity_profile', `AFFINITY_PRIMARY:${cat}`, 14);
            record.currentAffinity = `AFFINITY_PRIMARY:${cat}`;
            await writeRecord(this.db, this.storeName, record);
        },

        async content_affinity_profile_AFFINITY_SECONDARY(cat, record) {
            CookieManager.set('content_affinity_profile', `AFFINITY_SECONDARY:${cat}`, 14);
            record.currentAffinity = `AFFINITY_SECONDARY:${cat}`;
            await writeRecord(this.db, this.storeName, record);
        },

        async content_affinity_profile_AFFINITY_VALIDATED(cat, record) {
            CookieManager.set('content_affinity_profile', `AFFINITY_VALIDATED:${cat}`, 14);
            record.currentAffinity = `AFFINITY_VALIDATED:${cat}`;
            await writeRecord(this.db, this.storeName, record);
        },

        async content_affinity_profile_AFFINITY_COOLDOWN(record) {
            CookieManager.set('content_affinity_profile', 'AFFINITY_COOLDOWN:decay', 14);
            record.currentAffinity = 'AFFINITY_COOLDOWN';
            // Halve historical values during cooldown entry
            for (let cat in record.categoryCounts) {
                record.categoryCounts[cat] = Math.floor(record.categoryCounts[cat] / 2);
            }
            record.lastVisit = Date.now();
            await writeRecord(this.db, this.storeName, record);
        }
    };

    // ==================================================================
    // MODULE 3: ResumeEngine
    // TARGET COOKIE: deep_link_history_map
    // ==================================================================
    const ResumeEngine = {
        db: null,
        dbName: 'DeepLinkHistoryDB',
        storeName: 'history_checkpoint',

        async init() {
            try {
                this.db = await openDatabase(this.dbName, this.storeName);
                await this.processJourneyCheckpoint();
            } catch (error) {
                console.error("Resume Engine Initialisation Failure:", error);
            }
        },

        async processJourneyCheckpoint() {
            const currentUrl = window.location.href;
            let historyData = await readRecord(this.db, this.storeName, 'urls_map');

            if (!historyData) {
                historyData = { id: 'urls_map', root: currentUrl, tree: [], lastActive: Date.now() };
                await this.deep_link_history_map_LINK_ROOT_CAPTURED(historyData);
                return;
            }

            const now = new Date();
            const lastSessionTime = new Date(historyData.lastActive);

            // Cross-day verification check
            if (now.toDateString() !== lastSessionTime.toDateString()) {
                await this.deep_link_history_map_LINK_RESUME_ELIGIBLE(historyData);
                return;
            }

            // Append nested trails if unique
            if (currentUrl !== historyData.root && !historyData.tree.includes(currentUrl)) {
                historyData.tree.push(currentUrl);
                if (historyData.tree.length > 5) historyData.tree.shift(); // Bound history array size
                await this.deep_link_history_map_LINK_NESTED(historyData);
            }
        },

        async deep_link_history_map_LINK_ROOT_CAPTURED(data) {
            CookieManager.set('deep_link_history_map', 'LINK_ROOT_CAPTURED', 7);
            await writeRecord(this.db, this.storeName, data);
        },

        async deep_link_history_map_LINK_NESTED(data) {
            CookieManager.set('deep_link_history_map', 'LINK_NESTED', 7);
            data.lastActive = Date.now();
            await writeRecord(this.db, this.storeName, data);
        },

        async deep_link_history_map_LINK_RESUME_ELIGIBLE(data) {
            CookieManager.set('deep_link_history_map', 'LINK_RESUME_ELIGIBLE', 7);
            // Save current root to the history tree, update current URL as root node
            if (!data.tree.includes(data.root)) {
                data.tree.push(data.root);
            }
            data.root = window.location.href;
            data.lastActive = Date.now();
            await writeRecord(this.db, this.storeName, data);
        },

        async deep_link_history_map_LINK_EXIT(data) {
            CookieManager.set('deep_link_history_map', 'LINK_EXIT', 7);
            data.lastActive = Date.now();
            await writeRecord(this.db, this.storeName, data);
        },

        async deep_link_history_map_LINK_FLUSHED() {
            CookieManager.set('deep_link_history_map', 'LINK_FLUSHED', 7);
            const data = { id: 'urls_map', root: window.location.href, tree: [], lastActive: Date.now() };
            await writeRecord(this.db, this.storeName, data);
        }
    };

    // ==================================================================
    // GLOBAL INVOCATION COORDINATOR
    // ==================================================================
    document.addEventListener('DOMContentLoaded', async () => {
        await FunnelEngine.init();
        await JourneyEngine.init();
        await ResumeEngine.init();
    });

    window.addEventListener('beforeunload', () => {
        if (ResumeEngine.db) {
            readRecord(ResumeEngine.db, ResumeEngine.storeName, 'urls_map').then(data => {
                if (data) {
                    ResumeEngine.deep_link_history_map_LINK_EXIT(data).catch(e => console.error("Exit save crash:", e));
                }
            }).catch(e => console.error("Unload query failure:", e));
        }
    });

    // Expose control API context to other sister modules safely 
    window.JourneyTelemetryInterface = {
        flushJourneyCheckpoint: () => ResumeEngine.deep_link_history_map_LINK_FLUSHED(),
        getSnapshotData: async () => {
            const f = await readRecord(FunnelEngine.db, FunnelEngine.storeName, 'current_funnel');
            const a = await readRecord(JourneyEngine.db, JourneyEngine.storeName, 'affinity_profile');
            const r = await readRecord(ResumeEngine.db, ResumeEngine.storeName, 'urls_map');
            return { funnel: f, affinity: a, resume: r };
        }
    };
})();
