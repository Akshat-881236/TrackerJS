/**
 * FILE: anh-inspection-mode.js
 * DESCRIPTION: Lightweight Inspector & Editor with Prism.js Highlighting and Live Runner.
 * TRIGGER: CTRL + C (When no text is selected)
 */

(function () {
    'use strict';

    let panelOpen = false;
    let sourceData = { html: '', css: '', js: '' };
    let currentTab = 'html';

    // ==========================================
    // 1. INJECT DEPENDENCIES (PRISM & CUSTOM CSS)
    // ==========================================
    function injectDependencies() {
        if (!document.getElementById('anh-prism-css')) {
            const prismCss = document.createElement('link');
            prismCss.id = 'anh-prism-css';
            prismCss.rel = 'stylesheet';
            prismCss.href = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css';
            document.head.appendChild(prismCss);
        }

        if (!document.getElementById('anh-prism-js')) {
            const prismJs = document.createElement('script');
            prismJs.id = 'anh-prism-js';
            prismJs.src = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js';
            document.head.appendChild(prismJs);
        }

        if (!document.getElementById('anh-inspector-css')) {
            const style = document.createElement('style');
            style.id = 'anh-inspector-css';
            style.textContent = `
                #anh-editor-modal, #anh-runner-modal {
                    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                    width: 85vw; height: 85vh; background: #1e1e1e; color: #fff;
                    border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.6);
                    z-index: 2147483647; display: flex; flex-direction: column;
                    font-family: system-ui, sans-serif; border: 1px solid #333;
                }
                .anh-header {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 12px 20px; background: #252526; border-bottom: 1px solid #333;
                    border-radius: 12px 12px 0 0;
                }
                .anh-tabs { display: flex; gap: 10px; }
                .anh-tab {
                    background: transparent; color: #888; border: none; font-size: 14px;
                    cursor: pointer; padding: 6px 12px; border-radius: 4px; transition: 0.2s;
                }
                .anh-tab.active { background: #333; color: #fff; }
                .anh-actions { display: flex; gap: 10px; }
                .anh-btn {
                    background: #007acc; color: #fff; border: none; padding: 6px 16px;
                    border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: bold;
                }
                .anh-btn-close { background: #e81123; }
                .anh-editor-wrapper {
                    position: relative; flex: 1; overflow: hidden; background: #1e1e1e;
                }
                /* Magic Editor Textarea over Prism Pre */
                #anh-textarea, #anh-highlighting {
                    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                    padding: 20px; box-sizing: border-box; margin: 0; border: none;
                    font-family: Consolas, Monaco, monospace; font-size: 14px; line-height: 1.5;
                    white-space: pre; overflow: auto;
                }
                #anh-textarea {
                    color: transparent; background: transparent; caret-color: #fff; z-index: 2;
                    resize: none; outline: none;
                }
                #anh-highlighting { z-index: 1; pointer-events: none; }
                #anh-iframe { width: 100%; height: 100%; border: none; background: #fff; border-radius: 0 0 12px 12px;}
                #anh-overlay {
                    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                    background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 2147483646;
                }
            `;
            document.head.appendChild(style);
        }
    }

    // ==========================================
    // 2. FETCH ALGORITHM (RELATIVE URL RESOLVER)
    // ==========================================
    async function fetchPageSources() {
        // 1. Get HTML
        sourceData.html = document.documentElement.outerHTML;

        // 2. Extract and resolve CSS
        let cssArr = [];
        for (let style of document.querySelectorAll('style')) {
            cssArr.push(`/* Inline Style */\n${style.innerHTML}`);
        }
        for (let link of document.querySelectorAll('link[rel="stylesheet"]')) {
            if (link.href) {
                // ALGORITHM: Resolve relative paths by adding current origin
                const absoluteUrl = new URL(link.getAttribute('href'), window.location.origin).href;
                try {
                    const res = await fetch(absoluteUrl);
                    cssArr.push(`/* Fetched from: ${absoluteUrl} */\n${await res.text()}`);
                } catch (e) {
                    cssArr.push(`/* CORS/Failed to fetch: ${absoluteUrl} */`);
                }
            }
        }
        sourceData.css = cssArr.join('\n\n');

        // 3. Extract and resolve Scripts
        let jsArr = [];
        for (let script of document.querySelectorAll('script:not([id^="anh-"])')) {
            if (script.src) {
                // ALGORITHM: Resolve relative paths by adding current origin
                const absoluteUrl = new URL(script.getAttribute('src'), window.location.origin).href;
                try {
                    const res = await fetch(absoluteUrl);
                    jsArr.push(`/* Fetched from: ${absoluteUrl} */\n${await res.text()}`);
                } catch (e) {
                    jsArr.push(`/* CORS/Failed to fetch: ${absoluteUrl} */`);
                }
            } else {
                jsArr.push(`/* Inline Script */\n${script.innerHTML}`);
            }
        }
        sourceData.js = jsArr.join('\n\n');
    }

    // ==========================================
    // 3. BUILD UI AND EDITOR
    // ==========================================
    function openEditor() {
        if (document.getElementById('anh-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'anh-overlay';
        document.body.appendChild(overlay);

        const modal = document.createElement('div');
        modal.id = 'anh-editor-modal';
        modal.innerHTML = `
            <div class="anh-header">
                <div class="anh-tabs">
                    <button class="anh-tab active" data-tab="html">index.html</button>
                    <button class="anh-tab" data-tab="css">styles.css</button>
                    <button class="anh-tab" data-tab="js">scripts.js</button>
                </div>
                <div class="anh-actions">
                    <button class="anh-btn" id="anh-btn-run">▶ Run Code</button>
                    <button class="anh-btn anh-btn-close" id="anh-btn-close">✕ Close</button>
                </div>
            </div>
            <div class="anh-editor-wrapper">
                <textarea id="anh-textarea" spellcheck="false"></textarea>
                <pre id="anh-highlighting" aria-hidden="true"><code id="anh-highlighting-content" class="language-html"></code></pre>
            </div>
        `;
        document.body.appendChild(modal);

        const textarea = document.getElementById('anh-textarea');
        const highlightingContent = document.getElementById('anh-highlighting-content');
        const highlightingPre = document.getElementById('anh-highlighting');

        // Sync Editor Text to Prism
        function updateEditor() {
            sourceData[currentTab] = textarea.value;
            let text = textarea.value;
            // Handle trailing newlines for proper scrolling
            if (text[text.length - 1] === "\n") text += " ";
            
            highlightingContent.textContent = text;
            if (window.Prism) Prism.highlightElement(highlightingContent);
        }

        // Sync Scrolling
        textarea.addEventListener('scroll', () => {
            highlightingPre.scrollTop = textarea.scrollTop;
            highlightingPre.scrollLeft = textarea.scrollLeft;
        });

        textarea.addEventListener('input', updateEditor);
        
        // Prevent tab key leaving textarea
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = textarea.selectionStart;
                textarea.value = textarea.value.substring(0, start) + "    " + textarea.value.substring(textarea.selectionEnd);
                textarea.selectionStart = textarea.selectionEnd = start + 4;
                updateEditor();
            }
        });

        // Tab Switching
        document.querySelectorAll('.anh-tab').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.anh-tab').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                currentTab = e.target.getAttribute('data-tab');
                
                textarea.value = sourceData[currentTab];
                highlightingContent.className = `language-${currentTab === 'js' ? 'javascript' : currentTab}`;
                updateEditor();
            });
        });

        // Close logic
        document.getElementById('anh-btn-close').addEventListener('click', () => {
            modal.remove();
            overlay.remove();
            panelOpen = false;
        });

        // Run Logic
        document.getElementById('anh-btn-run').addEventListener('click', launchRunner);

        // Init first tab
        textarea.value = sourceData.html;
        updateEditor();
    }

    // ==========================================
    // 4. IFRAME RUNNER CARD
    // ==========================================
    function launchRunner() {
        const existingRunner = document.getElementById('anh-runner-modal');
        if (existingRunner) existingRunner.remove();

        const runnerModal = document.createElement('div');
        runnerModal.id = 'anh-runner-modal';
        runnerModal.style.zIndex = '2147483648'; // Above editor

        // Combine HTML, edited CSS, and edited JS
        const combinedHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>${sourceData.css}</style>
            </head>
            <body>
                ${sourceData.html}
                <script>${sourceData.js}<\/script>
            </body>
            </html>
        `;

        runnerModal.innerHTML = `
            <div class="anh-header" style="background: #1e1e1e;">
                <div style="font-weight: bold; color: #007acc;">Live Output Preview</div>
                <button class="anh-btn anh-btn-close" id="anh-runner-close">✕ Close Preview</button>
            </div>
            <iframe id="anh-iframe" srcdoc="${combinedHTML.replace(/"/g, '&quot;')}"></iframe>
        `;
        document.body.appendChild(runnerModal);

        document.getElementById('anh-runner-close').addEventListener('click', () => {
            runnerModal.remove();
        });
    }

    // ==========================================
    // 5. EVENT LISTENERS (KEYBOARD SHORTCUT)
    // ==========================================
    window.addEventListener('keydown', async (e) => {
        // Trigger on CTRL + C
        if (e.ctrlKey && e.key.toLowerCase() === 'c') {
            // UX Safety Check: Only open if the user isn't trying to copy text
            if (window.getSelection().toString().length > 0) return; 

            e.preventDefault();
            
            if (!panelOpen) {
                panelOpen = true;
                injectDependencies();
                await fetchPageSources();
                // Wait briefly for Prism to load if it's the first time
                setTimeout(openEditor, window.Prism ? 0 : 500); 
            }
        }
    });

})();
