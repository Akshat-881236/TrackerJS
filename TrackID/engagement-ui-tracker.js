/**
 * © Akshat Network Hub
 * FILE: engagement-ui-tracker.js
 * RESPONSIBILITY: Resume cards, Confirmation modals, Alert orchestration
 * DATABASES: ResumeCardDB, ConfirmDialogueDB, AlertCadenceDB
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

    // --- INJECT EMBEDDED CSS LAYER ---
    const style = document.createElement('style');
    style.textContent = `
        .engage-card-container {
            position: fixed; bottom: 24px; right: 24px; width: 340px;
            background: #ffffff; color: #0f172a; border-radius: 12px;
            box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            z-index: 10000; padding: 18px; box-sizing: border-box;
            border: 1px solid #e2e8f0; transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s;
        }
        .engage-card-minimized {
            transform: translateY(80px) scale(0.9); opacity: 0.5; cursor: pointer;
        }
        .engage-overlay {
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px);
            z-index: 10001; display: flex; align-items: center; justify-content: center;
        }
        .engage-modal {
            background: #ffffff; padding: 24px; border-radius: 16px; max-width: 380px; width: 90%;
            box-shadow: 0 20px 25px -5px rgba(0,0,0,0.15); border: 1px solid #e2e8f0; position: relative;
        }
        .engage-close-x {
            position: absolute; top: 12px; right: 16px; background: none; border: none;
            font-size: 20px; cursor: pointer; color: #94a3b8;
        }
        .engage-close-x:hover { color: #475569; }
        .engage-header { font-size: 16px; font-weight: 600; margin: 0 0 6px 0; color: #1e293b; }
        .engage-body { font-size: 13.5px; color: #64748b; margin: 0 0 14px 0; line-height: 1.5; }
        .engage-actions { display: flex; gap: 8px; justify-content: flex-end; }
        .engage-btn {
            padding: 8px 14px; border-radius: 6px; font-size: 12.5px; font-weight: 500;
            cursor: pointer; border: none; transition: background 0.2s;
        }
        .engage-btn-prime { background: #0284c7; color: white; }
        .engage-btn-prime:hover { background: #0369a1; }
        .engage-btn-sub { background: #f1f5f9; color: #475569; }
        .engage-btn-sub:hover { background: #e2e8f0; }
        .engage-history-list { max-height: 120px; overflow-y: auto; margin: 8px 0; padding: 0; list-style: none; }
        .engage-history-item { padding: 6px 0; font-size: 12px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; }
        .engage-history-item a { color: #0284c7; text-decoration: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px; }
    `;
    document.head.appendChild(style);

    // ==================================================================
    // MODULE 1: ResumeCardController
    // TARGET COOKIE: resume_card_interaction
    // ==================================================================
    const ResumeCardController = {
        db: null,
        dbName: 'ResumeCardDB',
        storeName: 'card_logs',
        domElement: null,

        async init() {
            try {
                this.db = await openDatabase(this.dbName, this.storeName);
                await this.resume_card_interaction_RESUME_HIDDEN();
                
                // Read from user-journey-tracker global engine snapshot to see if user is resume eligible
                if (window.JourneyTelemetryInterface) {
                    const snapshot = await window.JourneyTelemetryInterface.getSnapshotData();
                    const crossDayMap = CookieManager.get('deep_link_history_map');
                    
                    if (crossDayMap === 'LINK_RESUME_ELIGIBLE' && snapshot.resume && snapshot.resume.tree.length > 0) {
                        this.createCard(snapshot.resume);
                    }
                }
            } catch (error) {
                console.error("Resume Card Controller Crash:", error);
            }
        },

        async resume_card_interaction_RESUME_HIDDEN() {
            CookieManager.set('resume_card_interaction', 'RESUME_HIDDEN', 7);
            await writeRecord(this.db, this.storeName, { id: 'status', state: 'RESUME_HIDDEN', time: Date.now() });
        },

        createCard(resumeData) {
            this.domElement = document.createElement('div');
            this.domElement.className = 'engage-card-container';
            this.renderCard(resumeData);
            document.body.appendChild(this.domElement);
            this.resume_card_interaction_RESUME_VISIBLE().catch(e => console.error("Visibility log error:", e));
        },

        async resume_card_interaction_RESUME_VISIBLE() {
            CookieManager.set('resume_card_interaction', 'RESUME_VISIBLE', 7);
            await writeRecord(this.db, this.storeName, { id: 'status', state: 'RESUME_VISIBLE', time: Date.now() });
        },

        renderCard(resumeData) {
            this.domElement.innerHTML = `
                <button class="engage-close-x" id="engage-x-card">&times;</button>
                <h3 class="engage-header">Pick up where you left off?</h3>
                <p class="engage-body">Welcome back! Ready to dive back into your previous journey paths?</p>
                <div class="engage-actions">
                    <button class="engage-btn engage-btn-sub" id="engage-btn-minimize">Minimize</button>
                    <button class="engage-btn engage-btn-sub" id="engage-btn-more">Learn More</button>
                    <button class="engage-btn engage-btn-prime" id="engage-btn-resume">Resume</button>
                </div>
            `;

            // Bind component events
            document.getElementById('engage-x-card').onclick = () => this.dismissCard();
            document.getElementById('engage-btn-minimize').onclick = () => this.minimizeCard();
            
            document.getElementById('engage-btn-more').onclick = () => {
                this.renderHistoryView(resumeData);
            };

            document.getElementById('engage-btn-resume').onclick = () => {
                this.resume_card_interaction_RESUME_ACCEPTED().then(() => {
                    ConfirmDialogController.openDialog(() => {
                        window.location.href = resumeData.root;
                    });
                }).catch(e => console.error("Resume state swap error:", e));
            };
        },

        renderHistoryView(resumeData) {
            let listItems = resumeData.tree.slice(-4).map(url => `
                <li class="engage-history-item">
                    <a href="#" class="engage-history-link" data-url="${url}">${url}</a>
                </li>
            `).join('');

            this.domElement.innerHTML = `
                <button class="engage-close-x" id="engage-x-card">&times;</button>
                <h3 class="engage-header">Your Journey Map</h3>
                <ul class="engage-history-list">${listItems}</ul>
                <div class="engage-actions">
                    <button class="engage-btn engage-btn-sub" id="engage-btn-back">Back</button>
                </div>
            `;

            document.getElementById('engage-x-card').onclick = () => this.dismissCard();
            document.getElementById('engage-btn-back').onclick = () => this.renderCard(resumeData);

            // Bind deep link clicks through the confirmation proxy component
            const links = this.domElement.querySelectorAll('.engage-history-link');
            links.forEach(link => {
                link.onclick = (e) => {
                    e.preventDefault();
                    const targetUrl = link.getAttribute('data-url');
                    ConfirmDialogController.openDialog(() => {
                        window.location.href = targetUrl;
                    });
                };
            });
        },

        async minimizeCard() {
            this.domElement.classList.toggle('engage-card-minimized');
            const isMin = this.domElement.classList.contains('engage-card-minimized');
            
            if (isMin) {
                CookieManager.set('resume_card_interaction', 'RESUME_MINIMIZED', 7);
                await writeRecord(this.db, this.storeName, { id: 'status', state: 'RESUME_MINIMIZED', time: Date.now() });
            } else {
                await this.resume_card_interaction_RESUME_VISIBLE();
            }
        },

        async resume_card_interaction_RESUME_ACCEPTED() {
            CookieManager.set('resume_card_interaction', 'RESUME_ACCEPTED', 7);
            await writeRecord(this.db, this.storeName, { id: 'status', state: 'RESUME_ACCEPTED', time: Date.now() });
            this.domElement.remove();
        },

        async dismissCard() {
            CookieManager.set('resume_card_interaction', 'RESUME_DISMISSED', 7);
            await writeRecord(this.db, this.storeName, { id: 'status', state: 'RESUME_DISMISSED', time: Date.now() });
            this.domElement.remove();
            
            // Notify journey map file cleanly to clear old tokens
            if (window.JourneyTelemetryInterface) {
                window.JourneyTelemetryInterface.flushJourneyCheckpoint();
            }
        }
    };

    // ==================================================================
    // MODULE 2: ConfirmDialogController
    // TARGET COOKIE: confirm_dialogue_state
    // ==================================================================
    const ConfirmDialogController = {
        db: null,
        dbName: 'ConfirmDialogueDB',
        storeName: 'dialogue_status',
        overlayElement: null,

        async init() {
            try {
                this.db = await openDatabase(this.dbName, this.storeName);
                await this.confirm_dialogue_state_CONFIRM_DORMANT();
            } catch (error) {
                console.error("Confirm Dialog Initialisation Crash:", error);
            }
        },

        async confirm_dialogue_state_CONFIRM_DORMANT() {
            CookieManager.set('confirm_dialogue_state', 'CONFIRM_DORMANT', 7);
            await writeRecord(this.db, this.storeName, { id: 'current', state: 'CONFIRM_DORMANT', time: Date.now() });
        },

        openDialog(onConfirmCallback) {
            this.overlayElement = document.createElement('div');
            this.overlayElement.className = 'engage-overlay';
            this.overlayElement.innerHTML = `
                <div class="engage-modal">
                    <button class="engage-close-x" id="engage-x-modal">&times;</button>
                    <h3 class="engage-header">Confirm Redirection</h3>
                    <p class="engage-body">You are changing page environments to resume this journey trail. Continue?</p>
                    <div class="engage-actions">
                        <button class="engage-btn engage-btn-sub" id="engage-modal-no">Cancel</button>
                        <button class="engage-btn engage-btn-prime" id="engage-modal-yes">Proceed</button>
                    </div>
                </div>
            `;
            document.body.appendChild(this.overlayElement);
            
            this.confirm_dialogue_state_CONFIRM_LOCKED().catch(e => console.error("Modal lock state error:", e));

            // Set up keyboard escape capture boundaries safely
            this.escapeHandler = (e) => {
                if (e.key === 'Escape') this.forceClose();
            };
            window.addEventListener('keydown', this.escapeHandler);

            document.getElementById('engage-x-modal').onclick = () => this.forceClose();
            document.getElementById('engage-modal-no').onclick = () => this.cancelAction();
            document.getElementById('engage-modal-yes').onclick = () => this.approveAction(onConfirmCallback);
        },

        async confirm_dialogue_state_CONFIRM_LOCKED() {
            CookieManager.set('confirm_dialogue_state', 'CONFIRM_LOCKED', 7);
            await writeRecord(this.db, this.storeName, { id: 'current', state: 'CONFIRM_LOCKED', time: Date.now() });
        },

        async approveAction(callback) {
            CookieManager.set('confirm_dialogue_state', 'CONFIRM_APPROVED', 7);
            await writeRecord(this.db, this.storeName, { id: 'current', state: 'CONFIRM_APPROVED', time: Date.now() });
            this.cleanup();
            callback();
        },

        async cancelAction() {
            CookieManager.set('confirm_dialogue_state', 'CONFIRM_CANCELLED', 7);
            await writeRecord(this.db, this.storeName, { id: 'current', state: 'CONFIRM_CANCELLED', time: Date.now() });
            this.cleanup();
        },

        async forceClose() {
            CookieManager.set('confirm_dialogue_state', 'CONFIRM_ESCAPED', 7);
            await writeRecord(this.db, this.storeName, { id: 'current', state: 'CONFIRM_ESCAPED', time: Date.now() });
            this.cleanup();
        },

        cleanup() {
            window.removeEventListener('keydown', this.escapeHandler);
            if (this.overlayElement) this.overlayElement.remove();
            this.confirm_dialogue_state_CONFIRM_DORMANT().catch(e => console.error("Modal reset error:", e));
        }
    };

    // ==================================================================
    // MODULE 3: AlertCadenceController
    // TARGET COOKIE: custom_alert_cadence
    // ==================================================================
    const AlertCadenceController = {
        db: null,
        dbName: 'AlertCadenceDB',
        storeName: 'cadence_history',

        async init() {
            try {
                this.db = await openDatabase(this.dbName, this.storeName);
                await this.custom_alert_cadence_ALERT_EMPTY();
            } catch (error) {
                console.error("Alert Engine Initialization Crash:", error);
            }
        },

        async custom_alert_cadence_ALERT_EMPTY() {
            CookieManager.set('custom_alert_cadence', 'ALERT_EMPTY', 7);
            await writeRecord(this.db, this.storeName, { id: 'cadence', state: 'ALERT_EMPTY', lastAlertTime: 0 });
        },

        async enqueueAlert(message) {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            
            store.get('cadence').onsuccess = async (e) => {
                const record = e.target.result || { lastAlertTime: 0 };
                const now = Date.now();
                
                // Throttling constraint enforcement logic (Limit alerts to 1 per minute)
                if (now - record.lastAlertTime < 60000) {
                    await this.custom_alert_cadence_ALERT_THROTTLED(now);
                    return;
                }

                await this.custom_alert_cadence_ALERT_CRITICAL(message, now);
            };
        },

        async custom_alert_cadence_ALERT_CRITICAL(message, time) {
            CookieManager.set('custom_alert_cadence', 'ALERT_CRITICAL', 7);
            await writeRecord(this.db, this.storeName, { id: 'cadence', state: 'ALERT_CRITICAL', lastAlertTime: time });

            // Dynamically present standalone alert modal window
            const overlay = document.createElement('div');
            overlay.className = 'engage-overlay';
            overlay.innerHTML = `
                <div class="engage-modal" style="max-width: 330px;">
                    <h3 class="engage-header" style="color:#dc2626;">System Notification</h3>
                    <p class="engage-body">${message}</p>
                    <div class="engage-actions">
                        <button class="engage-btn engage-btn-prime" id="engage-alert-ack" style="background:#dc2626;">Acknowledge</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);

            document.getElementById('engage-alert-ack').onclick = () => {
                overlay.remove();
                this.custom_alert_cadence_ALERT_ACKNOWLEDGED(message, time).catch(e => console.error("Alert ack crash:", e));
            };
        },

        async custom_alert_cadence_ALERT_THROTTLED(time) {
            CookieManager.set('custom_alert_cadence', 'ALERT_THROTTLED', 7);
            await writeRecord(this.db, this.storeName, { id: 'cadence', state: 'ALERT_THROTTLED', lastAlertTime: time });
        },

        async custom_alert_cadence_ALERT_ACKNOWLEDGED(msg, time) {
            CookieManager.set('custom_alert_cadence', 'ALERT_ACKNOWLEDGED', 7);
            await writeRecord(this.db, this.storeName, { id: 'cadence', state: 'ALERT_ACKNOWLEDGED', lastAlertTime: time });
            await this.archiveAlerts(msg, time);
        },

        async archiveAlerts(message, time) {
            CookieManager.set('custom_alert_cadence', 'ALERT_ARCHIVED', 7);
            // Append structured items down into historical archive records bucket arrays
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            store.get('archive_list').onsuccess = (e) => {
                const archive = e.target.result || { id: 'archive_list', items: [] };
                archive.items.push({ message, time });
                store.put(archive);
            };
        }
    };

    // ==================================================================
    // GLOBAL INVOCATION COORDINATOR
    // ==================================================================
    document.addEventListener('DOMContentLoaded', async () => {
        await ResumeCardController.init();
        await ConfirmDialogController.init();
        await AlertCadenceController.init();
    });

    // Expose interface layer so alternative scripts can call notifications cleanly
    window.EngagementUIInterface = {
        triggerSystemAlert: (msg) => AlertCadenceController.enqueueAlert(msg)
    };
})();
