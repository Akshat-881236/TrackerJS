/**
 * FILE: anh-lite-inspector.js
 * Trigger: CTRL + C (When no text is selected)
 * Features: Prism.js Highlighting, Source Fetching, Live Editing, Iframe Preview
 */

(function () {
    'use strict';

    // State management
    let isInspectorOpen = false;
    let sourceFiles = [];
    let activeFileIndex = 0;

    // 1. Listen for CTRL + C
    window.addEventListener('keydown', (e) => {
        // Trigger on CTRL+C, but ONLY if the user isn't trying to copy text
        if (e.ctrlKey && e.key.toLowerCase() === 'c') {
            const selectedText = window.getSelection().toString();
            if (!selectedText && !isInspectorOpen) {
                e.preventDefault();
                launchInspector();
            }
        }
    });

    // 2. Main Bootstrapper
    async function launchInspector() {
        isInspectorOpen = true;
        await injectPrismJS();
        await gatherSources();
        renderUI();
    }

    // 3. Inject Prism.js dynamically
    function injectPrismJS() {
        return new Promise((resolve) => {
            if (window.Prism) return resolve();
            
            const css = document.createElement('link');
            css.rel = 'stylesheet';
            css.href = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css';
            document.head.appendChild(css);

            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js';
            script.onload = resolve;
            document.head.appendChild(script);
        });
    }

    // 4. Algorithm to fetch styles and scripts
    async function gatherSources() {
        sourceFiles = [];

        // Add Main HTML
        sourceFiles.push({
            name: 'index.html',
            type: 'html',
            content: document.documentElement.outerHTML
        });

        const getAbsoluteUrl = (url) => new URL(url, window.location.origin).href;

        // Fetch External Scripts
        const scripts = document.querySelectorAll('script[src]');
        for (let i = 0; i < scripts.length; i++) {
            try {
                const src = getAbsoluteUrl(scripts[i].getAttribute('src'));
                const res = await fetch(src);
                const content = await res.text();
                sourceFiles.push({ name: `script_${i + 1}.js`, type: 'javascript', content });
            } catch (e) { console.warn('Could not fetch script:', e); }
        }

        // Fetch External Styles
        const styles = document.querySelectorAll('link[rel="stylesheet"]');
        for (let i = 0; i < styles.length; i++) {
            try {
                const href = getAbsoluteUrl(styles[i].getAttribute('href'));
                const res = await fetch(href);
                const content = await res.text();
                sourceFiles.push({ name: `style_${i + 1}.css`, type: 'css', content });
            } catch (e) { console.warn('Could not fetch style:', e); }
        }
    }

    // 5. Build and Render the UI
    function renderUI() {
        // Inject Custom Editor CSS
        const style = document.createElement('style');
        style.textContent = `
            #anh-lite-modal {
                position: fixed; top: 5%; left: 5%; width: 90%; height: 90%;
                background: #1e1e1e; color: #fff; z-index: 2147483647;
                border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.8);
                display: flex; flex-direction: column; font-family: sans-serif;
            }
            .anh-header {
                display: flex; justify-content: space-between; padding: 10px 15px;
                background: #2d2d2d; border-radius: 8px 8px 0 0; border-bottom: 1px solid #444;
            }
            .anh-tabs { display: flex; gap: 5px; overflow-x: auto; }
            .anh-tab {
                padding: 6px 12px; background: #3c3c3c; cursor: pointer;
                border-radius: 4px; font-size: 13px; border: none; color: #ccc;
            }
            .anh-tab.active { background: #007acc; color: #fff; }
            .anh-actions button {
                padding: 6px 12px; margin-left: 8px; border: none; border-radius: 4px;
                cursor: pointer; font-weight: bold; color: white;
            }
            .anh-btn-run { background: #28a745; }
            .anh-btn-close { background: #dc3545; }
            .anh-editor-container {
                position: relative; flex: 1; overflow: hidden; background: #1e1e1e;
            }
            /* Magic overlapping textarea for live editing over Prism */
            .anh-code-input, .anh-code-output {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                padding: 15px; margin: 0; border: none; box-sizing: border-box;
                font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
                font-size: 14px; line-height: 1.5; white-space: pre; overflow: auto;
                tab-size: 4;
            }
            .anh-code-input {
                color: transparent; background: transparent; caret-color: #fff;
                z-index: 2; resize: none; outline: none;
            }
            .anh-code-output { z-index: 1; pointer-events: none; }
            
            /* Iframe Preview Card */
            #anh-preview-card {
                position: fixed; top: 10%; left: 10%; width: 80%; height: 80%;
                background: #fff; z-index: 2147483648; border-radius: 8px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.9); display: none; flex-direction: column;
            }
            .anh-preview-header {
                background: #f1f1f1; padding: 10px; display: flex; justify-content: space-between;
                color: #333; font-weight: bold; border-radius: 8px 8px 0 0;
            }
            #anh-preview-iframe { flex: 1; border: none; width: 100%; border-radius: 0 0 8px 8px; }
        `;
        document.head.appendChild(style);

        // Build Modal HTML
        const modal = document.createElement('div');
        modal.id = 'anh-lite-modal';
        modal.innerHTML = `
            <div class="anh-header">
                <div class="anh-tabs" id="anh-tabs-container"></div>
                <div class="anh-actions">
                    <button class="anh-btn-run" id="anh-run-btn">▶ Run Output</button>
                    <button class="anh-btn-close" id="anh-close-btn">✖ Close</button>
                </div>
            </div>
            <div class="anh-editor-container">
                <textarea spellcheck="false" class="anh-code-input" id="anh-textarea"></textarea>
                <pre class="anh-code-output"><code id="anh-prism-code"></code></pre>
            </div>
        `;
        document.body.appendChild(modal);

        // Build Iframe Card HTML
        const previewCard = document.createElement('div');
        previewCard.id = 'anh-preview-card';
        previewCard.innerHTML = `
            <div class="anh-preview-header">
                <span>Live Preview</span>
                <button class="anh-btn-close" id="anh-preview-close" style="border:none; background:#dc3545; color:#fff; border-radius:4px; cursor:pointer;">✖ Close</button>
            </div>
            <iframe id="anh-preview-iframe"></iframe>
        `;
        document.body.appendChild(previewCard);

        setupInteractions();
        switchFile(0);
    }

    // 6. Handle UI Interactions
    function setupInteractions() {
        const tabsContainer = document.getElementById('anh-tabs-container');
        const textarea = document.getElementById('anh-textarea');
        const prismCode = document.getElementById('anh-prism-code');

        // Render Tabs
        sourceFiles.forEach((file, index) => {
            const btn = document.createElement('button');
            btn.className = `anh-tab ${index === 0 ? 'active' : ''}`;
            btn.textContent = file.name;
            btn.onclick = () => switchFile(index);
            tabsContainer.appendChild(btn);
        });

        // Live Syntax Highlighting Sync
        textarea.addEventListener('input', () => {
            sourceFiles[activeFileIndex].content = textarea.value;
            syncHighlighting();
        });

        // Sync Scrolling between textarea and Prism
        textarea.addEventListener('scroll', () => {
            prismCode.parentElement.scrollTop = textarea.scrollTop;
            prismCode.parentElement.scrollLeft = textarea.scrollLeft;
        });

        // Close App
        document.getElementById('anh-close-btn').onclick = () => {
            document.getElementById('anh-lite-modal').remove();
            document.getElementById('anh-preview-card').remove();
            isInspectorOpen = false;
        };

        // Close Preview
        document.getElementById('anh-preview-close').onclick = () => {
            document.getElementById('anh-preview-card').style.display = 'none';
        };

        // Run / Compile Code
        document.getElementById('anh-run-btn').onclick = executeCode;
    }

    // 7. Switch Tabs
    function switchFile(index) {
        activeFileIndex = index;
        const file = sourceFiles[index];
        
        // Update Tabs UI
        document.querySelectorAll('.anh-tab').forEach((tab, i) => {
            tab.classList.toggle('active', i === index);
        });

        // Update Editor
        const textarea = document.getElementById('anh-textarea');
        textarea.value = file.content;
        syncHighlighting();
    }

    // 8. Prism Highlighting logic
    function syncHighlighting() {
        const file = sourceFiles[activeFileIndex];
        const prismCode = document.getElementById('anh-prism-code');
        const textarea = document.getElementById('anh-textarea');
        
        // Match Prism language class
        prismCode.className = `language-${file.type}`;
        
        // Escape HTML to prevent rendering as actual DOM elements
        let escapedContent = textarea.value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        
        // Handle trailing newline issue in pre/code blocks
        if (escapedContent[escapedContent.length - 1] === "\n") {
            escapedContent += " ";
        }

        prismCode.innerHTML = escapedContent;
        if (window.Prism) Prism.highlightElement(prismCode);
    }

    // 9. Compile and Run in Iframe
    function executeCode() {
        let finalHTML = sourceFiles[0].content; // Assuming index.html is always first

        let injectedCSS = '';
        let injectedJS = '';

        // Aggregate edits
        for (let i = 1; i < sourceFiles.length; i++) {
            if (sourceFiles[i].type === 'css') {
                injectedCSS += `\n${sourceFiles[i].content}`;
            } else if (sourceFiles[i].type === 'javascript') {
                injectedJS += `\n${sourceFiles[i].content}`;
            }
        }

        // Inject compiled CSS and JS into the HTML before the closing tags
        if (injectedCSS) {
            finalHTML = finalHTML.replace('</head>', `<style>${injectedCSS}</style></head>`);
        }
        if (injectedJS) {
            finalHTML = finalHTML.replace('</body>', `<script>${injectedJS}</script></body>`);
        }

        // Create Blob URI and launch Iframe
        const blob = new Blob([finalHTML], { type: 'text/html' });
        const previewUrl = URL.createObjectURL(blob);
        
        const previewCard = document.getElementById('anh-preview-card');
        const iframe = document.getElementById('anh-preview-iframe');
        
        iframe.src = previewUrl;
        previewCard.style.display = 'flex';
    }

})();
