/**
 * © Akshat Network Hub
 * FILE: session-core-tracker.js
 * RESPONSIBILITY: Session Lifecycle, Consent Engine, Device Fingerprint Engine
 * DATABASES: SessionLifecycleDB, ConsentStateDB, DeviceFingerprintDB
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

    // --- CORE DATABASE FACTORY (ISOLATED INSTANCES) ---
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

    function writeLocalRecord(db, storeName, record) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(record);
            request.onsuccess = () => resolve(true);
            transaction.onerror = (e) => reject(e.target.error);
        });
    }

    // ==================================================================
    // MODULE 1: SessionLifecycleEngine
    // TARGET COOKIE: session_lifecycle_id
    // ==================================================================
    const SessionLifecycleEngine = {
        db: null,
        dbName: 'SessionLifecycleDB',
        storeName: 'lifecycle_state',
        idleTimeout: 15 * 60 * 1000, // 15 mins tracking limit
        idleTimer: null,

        async init() {
            try {
                this.db = await openDatabase(this.dbName, this.storeName);
                const currentCookie = CookieManager.get('session_lifecycle_id');
                
                if (!currentCookie) {
                    await this.session_lifecycle_id_SESSION_UNINITIALIZED();
                } else {
                    await this.restoreSession(currentCookie);
                }
                this.startIdleDetector();
            } catch (error) {
                console.error("Session Engine Failure:", error);
            }
        },

        async session_lifecycle_id_SESSION_UNINITIALIZED() {
            const sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            CookieManager.set('session_lifecycle_id', `SESSION_UNINITIALIZED:${sessionId}`, 1);
            await writeLocalRecord(this.db, this.storeName, { id: 'current', state: 'SESSION_UNINITIALIZED', sessionId, updated: Date.now() });
            await this.createSession(sessionId);
        },

        async createSession(sessionId) {
            CookieManager.set('session_lifecycle_id', `SESSION_AUTHENTICATED:${sessionId}`, 1);
            await writeLocalRecord(this.db, this.storeName, { id: 'current', state: 'SESSION_AUTHENTICATED', sessionId, updated: Date.now() });
            await this.session_lifecycle_id_SESSION_HEARTBEAT_ACTIVE();
        },

        async restoreSession(cookieValue) {
            const [state, sessionId] = cookieValue.split(':');
            await writeLocalRecord(this.db, this.storeName, { id: 'current', state: 'RESTORED_' + state, sessionId, updated: Date.now() });
            await this.session_lifecycle_id_SESSION_HEARTBEAT_ACTIVE();
        },

        async session_lifecycle_id_SESSION_HEARTBEAT_ACTIVE() {
            const currentCookie = CookieManager.get('session_lifecycle_id') || '';
            const sessionId = currentCookie.split(':')[1] || 'unknown';
            CookieManager.set('session_lifecycle_id', `SESSION_HEARTBEAT_ACTIVE:${sessionId}`, 1);
            await writeLocalRecord(this.db, this.storeName, { id: 'current', state: 'SESSION_HEARTBEAT_ACTIVE', sessionId, updated: Date.now() });
        },

        startIdleDetector() {
            const resetTimer = () => {
                clearTimeout(this.idleTimer);
                this.session_lifecycle_id_SESSION_HEARTBEAT_ACTIVE().catch(e => console.error("Heartbeat error:", e));
                this.idleTimer = setTimeout(() => this.session_lifecycle_id_SESSION_IDLE_WARNING(), this.idleTimeout);
            };
            window.addEventListener('mousemove', resetTimer);
            window.addEventListener('keypress', resetTimer);
            this.idleTimer = setTimeout(() => this.session_lifecycle_id_SESSION_IDLE_WARNING(), this.idleTimeout);
        },

        async session_lifecycle_id_SESSION_IDLE_WARNING() {
            const currentCookie = CookieManager.get('session_lifecycle_id') || '';
            const sessionId = currentCookie.split(':')[1] || 'unknown';
            CookieManager.set('session_lifecycle_id', `SESSION_IDLE_WARNING:${sessionId}`, 1);
            await writeLocalRecord(this.db, this.storeName, { id: 'current', state: 'SESSION_IDLE_WARNING', sessionId, updated: Date.now() });
        },

        async session_lifecycle_id_SESSION_EXPIRED_CLOSED() {
            const currentCookie = CookieManager.get('session_lifecycle_id') || '';
            const sessionId = currentCookie.split(':')[1] || 'unknown';
            CookieManager.set('session_lifecycle_id', `SESSION_EXPIRED_CLOSED:${sessionId}`, 0);
            await writeLocalRecord(this.db, this.storeName, { id: 'current', state: 'SESSION_EXPIRED_CLOSED', sessionId, updated: Date.now() });
            clearTimeout(this.idleTimer);
        }
    };

    // ==================================================================
    // MODULE 2: ConsentEngine
    // TARGET COOKIE: compliance_consent_mask
    // ==================================================================
    const ConsentEngine = {
        db: null,
        dbName: 'ConsentStateDB',
        storeName: 'consent_history',

        async init() {
            try {
                this.db = await openDatabase(this.dbName, this.storeName);
                await this.loadConsent();
            } catch (error) {
                console.error("Consent Engine Failure:", error);
            }
        },

        async loadConsent() {
            const mask = CookieManager.get('compliance_consent_mask');
            if (!mask) {
                await this.compliance_consent_mask_CONSENT_UNKNOWN();
            }
        },

        async compliance_consent_mask_CONSENT_UNKNOWN() {
            CookieManager.set('compliance_consent_mask', 'CONSENT_UNKNOWN', 365);
            await writeLocalRecord(this.db, this.storeName, { id: 'current_mask', state: 'CONSENT_UNKNOWN', timestamp: Date.now() });
        },

        async compliance_consent_mask_CONSENT_ESSENTIAL_ONLY() {
            CookieManager.set('compliance_consent_mask', 'CONSENT_ESSENTIAL_ONLY', 365);
            await writeLocalRecord(this.db, this.storeName, { id: 'current_mask', state: 'CONSENT_ESSENTIAL_ONLY', timestamp: Date.now() });
        },

        async compliance_consent_mask_CONSENT_ANALYTICS_GRANTED() {
            CookieManager.set('compliance_consent_mask', 'CONSENT_ANALYTICS_GRANTED', 365);
            await writeLocalRecord(this.db, this.storeName, { id: 'current_mask', state: 'CONSENT_ANALYTICS_GRANTED', timestamp: Date.now() });
        },

        async compliance_consent_mask_CONSENT_MARKETING_ALLOWED() {
            CookieManager.set('compliance_consent_mask', 'CONSENT_MARKETING_ALLOWED', 365);
            await writeLocalRecord(this.db, this.storeName, { id: 'current_mask', state: 'CONSENT_MARKETING_ALLOWED', timestamp: Date.now() });
        },

        async compliance_consent_mask_CONSENT_REVOKED() {
            CookieManager.set('compliance_consent_mask', 'CONSENT_REVOKED', 365);
            await writeLocalRecord(this.db, this.storeName, { id: 'current_mask', state: 'CONSENT_REVOKED', timestamp: Date.now() });
            await this.purgeTrackingData();
        },

        async updateConsent(type) {
            if (type === 'essential') await this.compliance_consent_mask_CONSENT_ESSENTIAL_ONLY();
            if (type === 'analytics') await this.compliance_consent_mask_CONSENT_ANALYTICS_GRANTED();
            if (type === 'marketing') await this.compliance_consent_mask_CONSENT_MARKETING_ALLOWED();
        },

        async purgeTrackingData() {
            // Internal safety routine to sweep engine variables locally without external notification blocks
            CookieManager.delete('session_lifecycle_id');
            CookieManager.delete('device_environment_fingerprint');
            
            const databasesToWipe = ['SessionLifecycleDB', 'DeviceFingerprintDB'];
            databasesToWipe.forEach(name => {
                const req = indexedDB.deleteDatabase(name);
                req.onerror = (e) => console.error(`Purge error on structural instance ${name}:`, e.target.error);
            });
        }
    };

    // ==================================================================
    // MODULE 3: DeviceFingerprintEngine
    // TARGET COOKIE: device_environment_fingerprint
    // ==================================================================
    const DeviceFingerprintEngine = {
        db: null,
        dbName: 'DeviceFingerprintDB',
        storeName: 'hardware_fingerprint',

        async init() {
            try {
                this.db = await openDatabase(this.dbName, this.storeName);
                await this.device_environment_fingerprint_DEVICE_PENDING();
                await this.buildFingerprint();
            } catch (error) {
                console.error("Fingerprint Engine Failure:", error);
            }
        },

        async device_environment_fingerprint_DEVICE_PENDING() {
            CookieManager.set('device_environment_fingerprint', 'DEVICE_PENDING', 30);
            await writeLocalRecord(this.db, this.storeName, { id: 'hardware_metrics', state: 'DEVICE_PENDING', timestamp: Date.now() });
        },

        collectHardwareProfile() {
            return {
                cores: navigator.hardwareConcurrency || 0,
                memory: navigator.deviceMemory || 0
            };
        },

        collectScreenProfile() {
            return {
                w: window.screen.width,
                h: window.screen.height,
                ratio: window.devicePixelRatio || 1
            };
        },

        collectNavigatorProfile() {
            return {
                lang: navigator.language,
                platform: navigator.platform,
                vendor: navigator.vendor
            };
        },

        fingerprintHash(str) {
            // Fast, non-cryptographic secure variant algorithm local representation
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                hash = (hash << 5) - hash + str.charCodeAt(i);
                hash |= 0; // Convert to 32bit integer
            }
            return 'fp_' + Math.abs(hash).toString(16);
        },

        async buildFingerprint() {
            const hw = this.collectHardwareProfile();
            const scr = this.collectScreenProfile();
            const nav = this.collectNavigatorProfile();
            
            const rawMetricsString = JSON.stringify({ hw, scr, nav });
            const calculatedHash = this.fingerprintHash(rawMetricsString);

            // Determine State Mapping Pipeline Context
            const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);
            const isConnectionSlow = (navigator.connection && (navigator.connection.saveData || parseFloat(navigator.connection.downlink) < 1.5));

            if (isConnectionSlow) {
                await this.device_environment_fingerprint_DEVICE_LOW_BANDWIDTH(calculatedHash, rawMetricsString);
            } else if (hw.cores > 4 && !isMobile) {
                await this.device_environment_fingerprint_DEVICE_ACCELERATED(calculatedHash, rawMetricsString);
            } else if (isMobile) {
                await this.device_environment_fingerprint_DEVICE_MOBILE(calculatedHash, rawMetricsString);
            } else {
                await this.device_environment_fingerprint_DEVICE_DESKTOP(calculatedHash, rawMetricsString);
            }
        },

        async device_environment_fingerprint_DEVICE_MOBILE(hash, raw) {
            CookieManager.set('device_environment_fingerprint', `DEVICE_MOBILE:${hash}`, 30);
            await writeLocalRecord(this.db, this.storeName, { id: 'hardware_metrics', state: 'DEVICE_MOBILE', hash, raw, timestamp: Date.now() });
        },

        async device_environment_fingerprint_DEVICE_DESKTOP(hash, raw) {
            CookieManager.set('device_environment_fingerprint', `DEVICE_DESKTOP:${hash}`, 30);
            await writeLocalRecord(this.db, this.storeName, { id: 'hardware_metrics', state: 'DEVICE_DESKTOP', hash, raw, timestamp: Date.now() });
        },

        async device_environment_fingerprint_DEVICE_LOW_BANDWIDTH(hash, raw) {
            CookieManager.set('device_environment_fingerprint', `DEVICE_LOW_BANDWIDTH:${hash}`, 30);
            await writeLocalRecord(this.db, this.storeName, { id: 'hardware_metrics', state: 'DEVICE_LOW_BANDWIDTH', hash, raw, timestamp: Date.now() });
        },

        async device_environment_fingerprint_DEVICE_ACCELERATED(hash, raw) {
            CookieManager.set('device_environment_fingerprint', `DEVICE_ACCELERATED:${hash}`, 30);
            await writeLocalRecord(this.db, this.storeName, { id: 'hardware_metrics', state: 'DEVICE_ACCELERATED', hash, raw, timestamp: Date.now() });
        }
    };

    // ==================================================================
    // GLOBAL INVOCATION COORDINATOR
    // ==================================================================
    document.addEventListener('DOMContentLoaded', async () => {
        // Sequentially execute processes inside error boundaries
        await SessionLifecycleEngine.init();
        await ConsentEngine.init();
        await DeviceFingerprintEngine.init();
    });

    window.addEventListener('beforeunload', () => {
        SessionLifecycleEngine.session_lifecycle_id_SESSION_EXPIRED_CLOSED().catch(e => console.error("Unload error:", e));
    });

    // Expose limited clean explicit execution hooks global space safely
    window.LocalTelemetryInterface = {
        updateConsent: (level) => ConsentEngine.updateConsent(level),
        triggerRevocation: () => ConsentEngine.compliance_consent_mask_CONSENT_REVOKED()
    };
})();
