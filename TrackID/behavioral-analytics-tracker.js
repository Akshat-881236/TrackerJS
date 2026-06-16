/**
 * © Akshat Network Hub
 * FILE: behavioral-analytics-tracker.js
 * RESPONSIBILITY: Loyalty scoring, Behavioral scoring, Cross-project attribution
 * DATABASES: VisitFrequencyDB, InteractionDensityDB, AttributionMatrixDB
 * DOMAIN GUARD: Execution explicitly restricted to akshat-881236.github.io
 * NETWORKING: Strict Local Mode (No Third-Party Tracking, No Remote Overheads)
 */

(function () {
    'use strict';

    const TARGET_HOST = 'akshat-881236.github.io';

    // --- ENFORCE STRICT DOMAIN SANITIZATION GUARD ---
    if (window.location.hostname !== TARGET_HOST && window.location.hostname !== 'localhost') {
        // Soft-exit silently without polluting execution paths or third party domains
        return;
    }

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
    // MODULE 1: LoyaltyEngine
    // TARGET COOKIE: visit_frequency_tier
    // ==================================================================
    const LoyaltyEngine = {
        db: null,
        dbName: 'VisitFrequencyDB',
        storeName: 'loyalty_metrics',

        async init() {
            try {
                this.db = await openDatabase(this.dbName, this.storeName);
                await this.countVisits();
            } catch (error) {
                console.error("Loyalty Engine Initialization Failure:", error);
            }
        },

        async countVisits() {
            let record = await readRecord(this.db, this.storeName, 'profile');
            const now = Date.now();

            if (!record) {
                record = { id: 'profile', count: 1, lastSeen: now, milestones: [] };
                await this.visit_frequency_tier_NEW_VANGUARD(record);
                return;
            }

            const lastVisitDate = new Date(record.lastSeen).toDateString();
            const todayDate = new Date(now).toDateString();

            // Check for explicit cross-day tracking boundaries
            if (lastVisitDate !== todayDate) {
                record.count += 1;
                await this.detectDormancy(record, now);
            } else {
                // Same-day reload sequence: maintain current tier settings
                record.lastSeen = now;
                await writeRecord(this.db, this.storeName, record);
            }
        },

        async detectDormancy(record, now) {
            const millisecondsInDay = 24 * 60 * 60 * 1000;
            const daysAbsent = (now - record.lastSeen) / millisecondsInDay;

            record.lastSeen = now;

            if (daysAbsent >= 14) {
                await this.visit_frequency_tier_DORMANT_REACTIVATED(record);
            } else {
                await this.calculateTier(record);
            }
        },

        async calculateTier(record) {
            if (record.count >= 10 && !record.milestones.includes('M10')) {
                await this.assignMilestone(record, 'M10');
            } else if (record.count >= 5) {
                await this.visit_frequency_tier_POWER_USER(record);
            } else {
                await this.visit_frequency_tier_RETURNING_CASUAL(record);
            }
        },

        async assignMilestone(record, milestoneId) {
            record.milestones.push(milestoneId);
            await this.visit_frequency_tier_MILESTONE_REWARD(record);
        },

        async visit_frequency_tier_NEW_VANGUARD(record) {
            CookieManager.set('visit_frequency_tier', 'NEW_VANGUARD', 30);
            await writeRecord(this.db, this.storeName, record);
        },

        async visit_frequency_tier_RETURNING_CASUAL(record) {
            CookieManager.set('visit_frequency_tier', 'RETURNING_CASUAL', 30);
            await writeRecord(this.db, this.storeName, record);
        },

        async visit_frequency_tier_POWER_USER(record) {
            CookieManager.set('visit_frequency_tier', 'POWER_USER', 30);
            await writeRecord(this.db, this.storeName, record);
        },

        async visit_frequency_tier_DORMANT_REACTIVATED(record) {
            CookieManager.set('visit_frequency_tier', 'DORMANT_REACTIVATED', 30);
            await writeRecord(this.db, this.storeName, record);
        },

        async visit_frequency_tier_MILESTONE_REWARD(record) {
            CookieManager.set('visit_frequency_tier', 'MILESTONE_REWARD', 30);
            await writeRecord(this.db, this.storeName, record);
        }
    };

    // ==================================================================
    // MODULE 2: BehaviorEngine
    // TARGET COOKIE: interaction_density_score
    // ==================================================================
    const BehaviorEngine = {
        db: null,
        dbName: 'InteractionDensityDB',
        storeName: 'density_metrics',
        clicks: 0,
        scrolls: 0,
        stabilizationTimer: null,

        async init() {
            try {
                this.db = await openDatabase(this.dbName, this.storeName);
                await this.interaction_density_score_PASSIVE_SCROLLER();
                this.setupInteractionListeners();
            } catch (error) {
                console.error("Behavior Engine Initialization Failure:", error);
            }
        },

        setupInteractionListeners() {
            // Track click densities
            window.addEventListener('click', () => {
                this.clicks++;
                this.monitorClicks().catch(e => console.error("Click processing crash:", e));
            });

            // Track scroll interaction cycles
            let scrollTimeout;
            window.addEventListener('scroll', () => {
                if (!scrollTimeout) {
                    scrollTimeout = setTimeout(() => {
                        this.scrolls++;
                        this.monitorScrolls().catch(e => console.error("Scroll processing crash:", e));
                        scrollTimeout = null;
                    }, 250); // Bound rapid scroll loop fires
                }
            });

            // Detect mouse moving out of viewport (Exit intent context)
            document.addEventListener('mouseleave', (e) => {
                if (e.clientY < 20) {
                    this.detectExitIntent().catch(e => console.error("Exit intent tracking crash:", e));
                }
            });

            // Establish profile normalization cycle timer (stabilizes profile after 10s of quiet)
            this.resetStabilizationTimer();
        },

        resetStabilizationTimer() {
            clearTimeout(this.stabilizationTimer);
            this.stabilizationTimer = setTimeout(() => {
                this.stabilizeProfile().catch(e => console.error("Stabilization commit crash:", e));
            }, 10000);
        },

        async monitorClicks() {
            this.resetStabilizationTimer();
            if (this.clicks > 8) {
                await this.interaction_density_score_CLICK_FRENZY();
            } else if (this.clicks >= 2 || this.scrolls >= 3) {
                await this.interaction_density_score_ACTIVE_ENGAGER();
            }
        },

        async monitorScrolls() {
            this.resetStabilizationTimer();
            if (this.clicks < 2 && this.scrolls >= 2) {
                await this.interaction_density_score_PASSIVE_SCROLLER();
            } else if (this.clicks >= 2) {
                await this.interaction_density_score_ACTIVE_ENGAGER();
            }
        },

        async detectExitIntent() {
            const current = CookieManager.get('interaction_density_score');
            if (current !== 'PROFILE_STABILIZED') {
                await this.interaction_density_score_ABANDONMENT_RISK();
            }
        },

        async stabilizeProfile() {
            await this.interaction_density_score_PROFILE_STABILIZED();
        },

        async interaction_density_score_PASSIVE_SCROLLER() {
            CookieManager.set('interaction_density_score', 'PASSIVE_SCROLLER', 1);
            await writeRecord(this.db, this.storeName, { id: 'live_score', state: 'PASSIVE_SCROLLER', clicks: this.clicks, scrolls: this.scrolls, time: Date.now() });
        },

        async interaction_density_score_ACTIVE_ENGAGER() {
            CookieManager.set('interaction_density_score', 'ACTIVE_ENGAGER', 1);
            await writeRecord(this.db, this.storeName, { id: 'live_score', state: 'ACTIVE_ENGAGER', clicks: this.clicks, scrolls: this.scrolls, time: Date.now() });
        },

        async interaction_density_score_CLICK_FRENZY() {
            CookieManager.set('interaction_density_score', 'CLICK_FRENZY', 1);
            await writeRecord(this.db, this.storeName, { id: 'live_score', state: 'CLICK_FRENZY', clicks: this.clicks, scrolls: this.scrolls, time: Date.now() });
        },

        async interaction_density_score_ABANDONMENT_RISK() {
            CookieManager.set('interaction_density_score', 'ABANDONMENT_RISK', 1);
            await writeRecord(this.db, this.storeName, { id: 'live_score', state: 'ABANDONMENT_RISK', clicks: this.clicks, scrolls: this.scrolls, time: Date.now() });
            
            // Integrate via global UI engine boundary to proactively warn or hook user return offers
            if (window.EngagementUIInterface) {
                window.EngagementUIInterface.triggerSystemAlert("Wait! Don't lose your path progress. Bookmark or complete your action now!");
            }
        },

        async interaction_density_score_PROFILE_STABILIZED() {
            CookieManager.set('interaction_density_score', 'PROFILE_STABILIZED', 1);
            await writeRecord(this.db, this.storeName, { id: 'live_score', state: 'PROFILE_STABILIZED', clicks: this.clicks, scrolls: this.scrolls, time: Date.now() });
        }
    };

    // ==================================================================
    // MODULE 3: AttributionEngine
    // TARGET COOKIE: cross_site_attribution
    // ==================================================================
    const AttributionEngine = {
        db: null,
        dbName: 'AttributionMatrixDB',
        storeName: 'route_graph',

        async init() {
            try {
                this.db = await openDatabase(this.dbName, this.storeName);
                await this.captureReferrer();
            } catch (error) {
                console.error("Attribution Engine Initialization Failure:", error);
            }
        },

        async captureReferrer() {
            const referrer = document.referrer;
            let record = await readRecord(this.db, this.storeName, 'matrix');

            if (!record) {
                record = { id: 'matrix', pathHistory: [window.location.pathname], externalOrigin: referrer || 'Direct' };
            } else {
                record.pathHistory.push(window.location.pathname);
                if (record.pathHistory.length > 6) record.pathHistory.shift(); // Bound routing schema payload array
            }

            if (!referrer) {
                await this.cross_site_attribution_ATTRIBUTION_UNKNOWN(record);
            } else if (referrer.includes(TARGET_HOST) || referrer.includes('localhost')) {
                await this.detectInternalHop(record);
            } else {
                await this.cross_site_attribution_ATTRIBUTION_INTERNAL(record);
            }
        },

        async detectInternalHop(record) {
            const history = record.pathHistory;
            const len = history.length;

            // Cyclic verification rule detection (e.g., matching back and forth paths A -> B -> A)
            if (len >= 3 && history[len - 1] === history[len - 3]) {
                await this.cross_site_attribution_ATTRIBUTION_LOOP(record);
            } else {
                await this.updateRouteGraph(record);
            }
        },

        async updateRouteGraph(record) {
            if (record.pathHistory.length > 1) {
                await this.cross_site_attribution_ATTRIBUTION_NODE_HOP(record);
            } else {
                await this.cross_site_attribution_ATTRIBUTION_INTERNAL(record);
            }
        },

        async syncAttributionMatrix(record) {
            await this.cross_site_attribution_ATTRIBUTION_SYNCED(record);
        },

        async cross_site_attribution_ATTRIBUTION_UNKNOWN(record) {
            CookieManager.set('cross_site_attribution', 'ATTRIBUTION_UNKNOWN', 30);
            await writeRecord(this.db, this.storeName, record);
            await this.syncAttributionMatrix(record);
        },

        async cross_site_attribution_ATTRIBUTION_INTERNAL(record) {
            CookieManager.set('cross_site_attribution', 'ATTRIBUTION_INTERNAL', 30);
            await writeRecord(this.db, this.storeName, record);
            await this.syncAttributionMatrix(record);
        },

        async cross_site_attribution_ATTRIBUTION_NODE_HOP(record) {
            CookieManager.set('cross_site_attribution', 'ATTRIBUTION_NODE_HOP', 30);
            await writeRecord(this.db, this.storeName, record);
            await this.syncAttributionMatrix(record);
        },

        async cross_site_attribution_ATTRIBUTION_LOOP(record) {
            CookieManager.set('cross_site_attribution', 'ATTRIBUTION_LOOP', 30);
            await writeRecord(this.db, this.storeName, record);
            await this.syncAttributionMatrix(record);
        },

        async cross_site_attribution_ATTRIBUTION_SYNCED(record) {
            CookieManager.set('cross_site_attribution', 'ATTRIBUTION_SYNCED', 30);
            // Lock and save final tracking metadata states safely inside local index store records
            record.synchronized = true;
            await writeRecord(this.db, this.storeName, record);
        }
    };

    // ==================================================================
    // GLOBAL INVOCATION COORDINATOR
    // ==================================================================
    document.addEventListener('DOMContentLoaded', async () => {
        await LoyaltyEngine.init();
        await BehaviorEngine.init();
        await AttributionEngine.init();
    });
})();
