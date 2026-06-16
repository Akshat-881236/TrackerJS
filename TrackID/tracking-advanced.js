// tracking-advanced.js
(function () {
    const DB_NAME = 'VisitorTrackingDB';
    const DB_VERSION = 1;
    const STORE_NAME = 'visit_logs';

    // Inject Modern, Stylish UI Theme safely into document head
    const style = document.createElement('style');
    style.textContent = `
        .track-ui-card {
            position: fixed; bottom: 24px; right: 24px; width: 350px;
            background: #ffffff; color: #1e293b; border-radius: 12px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            z-index: 10000; padding: 20px; box-sizing: border-box;
            border: 1px solid #e2e8f0; animation: trackSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .track-ui-overlay {
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(15, 23, 42, 0.3); backdrop-filter: blur(4px);
            z-index: 9999; display: flex; align-items: center; justify-content: center;
        }
        .track-ui-modal {
            background: #ffffff; padding: 24px; border-radius: 16px; max-width: 400px; width: 90%;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15); border: 1px solid #e2e8f0;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        }
        .track-close-btn {
            position: absolute; top: 12px; right: 16px; background: none; border: none;
            font-size: 20px; cursor: pointer; color: #94a3b8; transition: color 0.2s;
        }
        .track-close-btn:hover { color: #64748b; }
        .track-title { font-size: 16px; font-weight: 600; margin: 0 0 8px 0; color: #0f172a; padding-right: 15px;}
        .track-desc { font-size: 14px; color: #64748b; margin: 0 0 16px 0; line-height: 1.5; }
        .track-btn-group { display: flex; gap: 8px; justify-content: flex-end; }
        .track-btn {
            padding: 8px 14px; border-radius: 6px; font-size: 13px; font-weight: 500;
            cursor: pointer; transition: all 0.2s; border: none;
        }
        .track-btn-primary { background: #2563eb; color: white; }
        .track-btn-primary:hover { background: #1d4ed8; }
        .track-btn-secondary { background: #f1f5f9; color: #475569; }
        .track-btn-secondary:hover { background: #e2e8f0; }
        .track-history-list { 
            max-height: 150px; overflow-y: auto; margin-bottom: 16px; 
            padding: 0; list-style: none; border-top: 1px solid #f1f5f9;
        }
        .track-history-item {
            padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 12px;
            display: flex; justify-content: space-between; align-items: center;
        }
        .track-link { color: #2563eb; text-decoration: none; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;}
        .track-link:hover { text-decoration: underline; }
        @keyframes trackSlideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    `;
    document.head.appendChild(style);

    // Database core configuration management
    function initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'timestamp' });
                }
            };
            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => reject(e.target.error);
        });
    }

    function logAndFetchHistory(db) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const getAllReq = store.getAll();

            getAllReq.onsuccess = () => {
                const history = getAllReq.result;
                const now = new Date();
                
                store.add({
                    timestamp: now.getTime(),
                    dateString: now.toDateString(),
                    pageUrl: window.location.href,
                    referrer: document.referrer || 'Direct'
                });
                resolve(history);
            };
            transaction.onerror = (e) => reject(e.target.error);
        });
    }

    // --- UI Render Components ---

    function showResumeCard(lastVisit, fullHistory) {
        const card = document.createElement('div');
        card.className = 'track-ui-card';
        card.innerHTML = `
            <button class="track-close-btn" id="track-close-resume">&times;</button>
            <h3 class="track-title">Resume Your Journey?</h3>
            <p class="track-desc">Welcome back! You were last here on ${new Date(lastVisit.timestamp).toLocaleDateString()}. Would you like to jump back in?</p>
            <div class="track-btn-group">
                <button class="track-btn track-btn-secondary" id="track-learn-more">Learn More</button>
                <button class="track-btn track-btn-primary" id="track-resume-yes">Resume</button>
            </div>
        `;
        document.body.appendChild(card);

        document.getElementById('track-close-resume').onclick = () => card.remove();
        
        document.getElementById('track-resume-yes').onclick = () => {
            card.remove();
            showConfirmationDialog(() => {
                window.location.href = lastVisit.pageUrl;
            });
        };

        document.getElementById('track-learn-more').onclick = () => {
            card.remove();
            showHistoryCard(fullHistory);
        };
    }

    function showHistoryCard(history) {
        const uniqueHistory = history.reverse().slice(0, 5); // Fetch last 5 updates
        const card = document.createElement('div');
        card.className = 'track-ui-card';
        
        let listItems = uniqueHistory.map(item => `
            <li class="track-history-item">
                <a href="${item.pageUrl}" class="track-link" title="${item.pageUrl}">${item.pageUrl}</a>
                <span style="color: #94a3b8;">${new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </li>
        `).join('');

        card.innerHTML = `
            <button class="track-close-btn" id="track-close-history">&times;</button>
            <h3 class="track-title">Your Recent Activity</h3>
            <p class="track-desc" style="margin-bottom: 8px;">Select a deep link below to pick up where you left off:</p>
            <ul class="track-history-list">${listItems}</ul>
            <div class="track-btn-group">
                <button class="track-btn track-btn-secondary" id="track-history-close">Close</button>
            </div>
        `;
        document.body.appendChild(card);

        const closeAll = () => card.remove();
        document.getElementById('track-close-history').onclick = closeAll;
        document.getElementById('track-history-close').onclick = closeAll;
    }

    function showConfirmationDialog(onConfirm) {
        const overlay = document.createElement('div');
        overlay.className = 'track-ui-overlay';
        overlay.innerHTML = `
            <div class="track-ui-modal" style="position: relative;">
                <button class="track-close-btn" id="track-close-confirm">&times;</button>
                <h3 class="track-title">Confirm Navigation</h3>
                <p class="track-desc">Are you sure you want to redirect to your last tracked page context?</p>
                <div class="track-btn-group">
                    <button class="track-btn track-btn-secondary" id="track-confirm-no">Cancel</button>
                    <button class="track-btn track-btn-primary" id="track-confirm-yes">Yes, Redirect</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        const closeDialog = () => overlay.remove();
        document.getElementById('track-close-confirm').onclick = closeDialog;
        document.getElementById('track-confirm-no').onclick = closeDialog;
        
        document.getElementById('track-yes-confirm' || 'track-confirm-yes').onclick = () => {
            closeDialog();
            onConfirm();
        };
    }

    function showCustomAlert(message) {
        const overlay = document.createElement('div');
        overlay.className = 'track-ui-overlay';
        overlay.innerHTML = `
            <div class="track-ui-modal" style="position: relative; max-width: 350px;">
                <button class="track-close-btn" id="track-close-alert">&times;</button>
                <h3 class="track-title">System Alert</h3>
                <p class="track-desc">${message}</p>
                <div class="track-btn-group">
                    <button class="track-btn track-btn-primary" id="track-alert-ok">Dismiss</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        const closeAlert = () => overlay.remove();
        document.getElementById('track-close-alert').onclick = closeAlert;
        document.getElementById('track-alert-ok').onclick = closeAlert;
    }

    // --- Core Evaluator ---
    document.addEventListener('DOMContentLoaded', async () => {
        try {
            const db = await initDB();
            const history = await logAndFetchHistory(db);

            if (history && history.length > 0) {
                const lastVisit = history[history.length - 1];
                const now = new Date();

                // Evaluate cross-day rule constraint
                if (now.toDateString() !== new Date(lastVisit.timestamp).toDateString()) {
                    showResumeCard(lastVisit, history);
                }
            }
        } catch (error) {
            // Strict Error Capturing Framework Boundary
            console.error("Critical System Exception encountered during site telemetry operation:", error);
            showCustomAlert("We experienced an error restoring your journey profile settings.");
        }
    });
})();
