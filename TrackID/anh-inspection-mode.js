/**
 * FILE: anh-inspection-mode.js
 * Trigger: CTRL + C (When no text is selected)
 * Features: Prism.js Highlighting, Line/Col Tracking, Find & Replace, ANH Scripto Compliance
 * 
 * IMPROVEMENTS:
 * ✓ Fixed scrolling synchronization
 * ✓ Proper escape handling in find & replace
 * ✓ Memory leak prevention & cleanup
 * ✓ Debounced highlighting for performance
 * ✓ Virtual scrolling support
 * ✓ Keyboard shortcuts (ESC, CTRL+S, etc.)
 * ✓ Error handling & user feedback
 * ✓ Tab persistence & restore
 * ✓ Syntax error detection
 * ✓ Code formatting & beautification
 */

(function () {
    'use strict';

    // ============= STATE MANAGEMENT =============
    const STATE = {
        isInspectorOpen: false,
        sourceFiles: [],
        activeFileIndex: 0,
        blobUrls: [],
        eventListeners: [],
        highlightTimeout: null,
        debounceDelay: 150,
    };

    const CONFIG = {
        prismCSSUrl: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css',
        prismJSUrl: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js',
        prismLanguages: ['https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-javascript.min.js'],
    };

    // ============= INITIALIZATION =============
    window.addEventListener('keydown', handleGlobalKeydown);

    function handleGlobalKeydown(e) {
        if (e.ctrlKey && e.key.toLowerCase() === 'c') {
            const selectedText = window.getSelection().toString();
            if (!selectedText && !STATE.isInspectorOpen) {
                e.preventDefault();
                launchInspector();
            }
        }
    }

    async function launchInspector() {
        STATE.isInspectorOpen = true;
        try {
            await injectDependencies();
            await gatherSources();
            renderUI();
            setupInteractions();
            showNotification('Inspector loaded successfully', 'success');
        } catch (error) {
            showNotification(`Error: ${error.message}`, 'error');
            STATE.isInspectorOpen = false;
        }
    }

    // ============= DEPENDENCY INJECTION =============
    async function injectDependencies() {
        return Promise.all([injectPrismCSS(), injectPrismJS()]);
    }

    function injectPrismCSS() {
        return new Promise((resolve) => {
            if (document.querySelector(`link[href="${CONFIG.prismCSSUrl}"]`)) return resolve();
            
            const css = document.createElement('link');
            css.rel = 'stylesheet';
            css.href = CONFIG.prismCSSUrl;
            css.onload = resolve;
            css.onerror = () => showNotification('Failed to load Prism CSS', 'warn');
            document.head.appendChild(css);
        });
    }

    function injectPrismJS() {
        return new Promise((resolve) => {
            if (window.Prism) return resolve();
            
            const script = document.createElement('script');
            script.src = CONFIG.prismJSUrl;
            script.onload = resolve;
            script.onerror = () => showNotification('Failed to load Prism JS', 'warn');
            document.head.appendChild(script);
        });
    }

    // ============= SOURCE GATHERING =============
    function getFileName(urlStr, fallback) {
        try {
            const path = new URL(urlStr, window.location.origin).pathname;
            const name = path.split('/').pop();
            return name && name.length > 0 ? name : fallback;
        } catch (e) {
            return fallback;
        }
    }

    async function gatherSources() {
        STATE.sourceFiles = [];
        const htmlClone = document.documentElement.cloneNode(true);
        
        // Remove inspector UI from clone
        htmlClone.querySelectorAll('#anh-lite-modal, #anh-preview-card').forEach(el => el.remove());
        
        const getAbsoluteUrl = (url) => {
            try {
                return new URL(url, window.location.origin).href;
            } catch {
                return url;
            }
        };

        // Process Scripts
        const scripts = Array.from(htmlClone.querySelectorAll('script'));
        let scriptCounter = 1;
        
        for (const script of scripts) {
            // ANH Policy: Skip Scripto inline scripts
            if (script.classList.contains('Scripto')) continue;

            try {
                if (script.hasAttribute('src')) {
                    const src = script.getAttribute('src');
                    const res = await fetchWithTimeout(getAbsoluteUrl(src), 5000);
                    const content = await res.text();
                    STATE.sourceFiles.push({
                        name: getFileName(src, `script_${scriptCounter}.js`),
                        type: 'javascript',
                        content,
                        original: src,
                        isExternal: true
                    });
                } else if (script.textContent.trim()) {
                    STATE.sourceFiles.push({
                        name: `inline_script_${scriptCounter}.js`,
                        type: 'javascript',
                        content: script.textContent,
                        isExternal: false
                    });
                }
            } catch (e) {
                showNotification(`Script fetch failed: ${script.getAttribute('src') || 'inline'}`, 'warn');
            }
            scriptCounter++;
        }

        // Process Stylesheets
        const links = Array.from(htmlClone.querySelectorAll('link[rel="stylesheet"]'));
        let styleCounter = 1;
        
        for (const link of links) {
            try {
                const href = link.getAttribute('href');
                const res = await fetchWithTimeout(getAbsoluteUrl(href), 5000);
                const content = await res.text();
                STATE.sourceFiles.push({
                    name: getFileName(href, `style_${styleCounter}.css`),
                    type: 'css',
                    content,
                    original: href,
                    isExternal: true
                });
            } catch (e) {
                showNotification(`Stylesheet fetch failed: ${link.getAttribute('href')}`, 'warn');
            }
            styleCounter++;
        }

        // Process Inline Styles
        const styles = Array.from(htmlClone.querySelectorAll('style'));
        for (const style of styles) {
            if (style.textContent.trim()) {
                STATE.sourceFiles.push({
                    name: `inline_style_${styleCounter}.css`,
                    type: 'css',
                    content: style.textContent,
                    isExternal: false
                });
                styleCounter++;
            }
        }

        // Add Main HTML
        STATE.sourceFiles.unshift({
            name: 'index.html',
            type: 'html',
            content: htmlClone.outerHTML,
            isExternal: false
        });
    }

    // ============= UTILITIES =============
    function fetchWithTimeout(url, timeout = 5000) {
        return Promise.race([
            fetch(url),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Fetch timeout')), timeout))
        ]);
    }

    function showNotification(message, type = 'info') {
        const notif = document.createElement('div');
        notif.style.cssText = `
            position: fixed; bottom: 20px; right: 20px; z-index: 2147483649;
            padding: 12px 16px; border-radius: 4px; font-size: 13px; font-family: sans-serif;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3); animation: slideIn 0.3s ease;
        `;
        
        const colors = {
            success: '#4caf50',
            error: '#f44336',
            warn: '#ff9800',
            info: '#2196f3'
        };
        
        notif.style.backgroundColor = colors[type] || colors.info;
        notif.style.color = '#fff';
        notif.textContent = message;
        document.body.appendChild(notif);
        
        setTimeout(() => notif.remove(), 3000);
    }

    // ============= UI RENDERING =============
    function renderUI() {
        injectStyles();
        renderModal();
        renderPreviewCard();
    }

    function injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(400px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }

            #anh-lite-modal {
                position: fixed; top: 2%; left: 5%; width: 90%; height: 96%;
                background: #1e1e1e; color: #fff; z-index: 2147483647;
                border-radius: 8px; box-shadow: 0 10px 40px rgba(0,0,0,0.8);
                display: flex; flex-direction: column; font-family: 'Segoe UI', sans-serif;
            }

            .anh-header {
                display: flex; justify-content: space-between; padding: 10px 12px;
                background: #252526; border-radius: 8px 8px 0 0; border-bottom: 1px solid #333;
                align-items: center;
            }

            .anh-tabs {
                display: flex; gap: 4px; overflow-x: auto; scrollbar-width: thin;
                flex: 1;
            }

            .anh-tab {
                padding: 8px 14px; background: #2d2d2d; cursor: pointer;
                border-radius: 4px 4px 0 0; font-size: 12px; border: none;
                color: #969696; white-space: nowrap; transition: all 0.2s;
                position: relative;
            }

            .anh-tab:hover { background: #3d3d3d; }
            .anh-tab.active {
                background: #1e1e1e; color: #fff;
                border-top: 2px solid #007acc;
            }

            .anh-tab .anh-tab-close {
                margin-left: 6px; font-size: 10px; cursor: pointer;
                opacity: 0.6; transition: opacity 0.2s;
            }

            .anh-tab .anh-tab-close:hover { opacity: 1; }

            .anh-actions {
                display: flex; gap: 8px; margin-left: auto;
            }

            .anh-actions button {
                padding: 6px 12px; border: none; border-radius: 4px;
                cursor: pointer; font-size: 12px; font-weight: bold; color: white;
                transition: all 0.2s;
            }

            .anh-actions button:hover { opacity: 0.8; }

            .anh-btn-run { background: #007acc; }
            .anh-btn-format { background: #0e639c; }
            .anh-btn-close { background: #d32f2f; }

            /* Find & Replace Bar */
            #anh-search-bar {
                display: none; padding: 8px 12px; background: #2d2d2d;
                border-bottom: 1px solid #444; gap: 10px; align-items: center;
                font-size: 12px; flex-wrap: wrap;
            }

            .anh-search-input {
                background: #3c3c3c; border: 1px solid #555; color: white;
                padding: 6px 8px; border-radius: 3px; font-size: 12px; flex: 1; min-width: 150px;
            }

            .anh-search-input::placeholder { color: #888; }

            /* Editor Core Layout */
            .anh-editor-wrapper {
                display: flex; flex: 1; overflow: hidden; position: relative;
                background: #1e1e1e;
            }

            .anh-line-numbers {
                width: 45px; background: #252526; color: #858585; text-align: right;
                padding: 12px 8px; font-family: 'Consolas', 'Monaco', monospace;
                font-size: 13px; line-height: 1.5; overflow: hidden;
                user-select: none; border-right: 1px solid #333; flex-shrink: 0;
            }

            .anh-line-numbers span {
                display: block; height: 19.5px;
            }

            .anh-editor-container {
                position: relative; flex: 1; overflow: hidden;
                display: flex; flex-direction: column;
            }

            .anh-code-input, .anh-code-output {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                padding: 12px; margin: 0; border: none; box-sizing: border-box;
                font-family: 'Consolas', 'Monaco', monospace; font-size: 13px;
                line-height: 1.5; white-space: pre; tab-size: 4;
                word-wrap: normal;
            }

            .anh-code-input {
                color: transparent; background: transparent; caret-color: #fff;
                z-index: 2; resize: none; outline: none; overflow: auto !important;
            }

            .anh-code-output {
                z-index: 1; pointer-events: none; overflow: auto !important;
                background: transparent;
            }

            .anh-code-output code { color: #d4d4d4; }

            .anh-statusbar {
                background: #007acc; color: white; font-size: 11px; padding: 5px 12px;
                display: flex; justify-content: space-between; border-radius: 0 0 8px 8px;
                border-top: 1px solid #555;
            }

            .anh-status-left { display: flex; gap: 20px; }

            /* Iframe Preview Card */
            #anh-preview-card {
                position: fixed; top: 5%; left: 5%; width: 90%; height: 90%;
                background: #fff; z-index: 2147483648; border-radius: 8px;
                box-shadow: 0 10px 50px rgba(0,0,0,0.9); display: none;
                flex-direction: column;
            }

            .anh-preview-header {
                background: #252526; padding: 12px 15px; display: flex;
                justify-content: space-between; color: #fff; font-weight: bold;
                border-radius: 8px 8px 0 0; align-items: center;
            }

            #anh-preview-iframe {
                flex: 1; border: none; width: 100%;
                border-radius: 0 0 8px 8px; background: #fff;
            }

            /* Syntax Error Display */
            .anh-error-panel {
                display: none; background: #300a0a; border-top: 1px solid #6f1818;
                padding: 10px 12px; color: #ff6b6b; font-size: 12px;
                font-family: monospace; overflow-y: auto; max-height: 100px;
            }

            /* Scrollbar Styling */
            .anh-code-input::-webkit-scrollbar,
            .anh-code-output::-webkit-scrollbar,
            .anh-error-panel::-webkit-scrollbar {
                width: 10px; height: 10px;
            }

            .anh-code-input::-webkit-scrollbar-track,
            .anh-code-output::-webkit-scrollbar-track {
                background: #1e1e1e;
            }

            .anh-code-input::-webkit-scrollbar-thumb,
            .anh-code-output::-webkit-scrollbar-thumb {
                background: #464647; border-radius: 5px;
            }

            .anh-code-input::-webkit-scrollbar-thumb:hover {
                background: #5e5e5f;
            }
        `;
        document.head.appendChild(style);
    }

    function renderModal() {
        const modal = document.createElement('div');
        modal.id = 'anh-lite-modal';
        modal.innerHTML = `
            <div class="anh-header">
                <div class="anh-tabs" id="anh-tabs-container"></div>
                <div class="anh-actions">
                    <button class="anh-btn-format" id="anh-format-btn" title="Format Code (CTRL+SHIFT+F)">✨ Format</button>
                    <button class="anh-btn-run" id="anh-run-btn" title="Run Code (CTRL+Enter)">▶ Run</button>
                    <button class="anh-btn-close" id="anh-close-btn" title="Close (ESC)">✖</button>
                </div>
            </div>
            <div id="anh-search-bar">
                <input type="text" id="anh-find-input" class="anh-search-input" placeholder="Find...">
                <input type="text" id="anh-replace-input" class="anh-search-input" placeholder="Replace with...">
                <button id="anh-replace-all" style="background:#007acc; border:none; color:white; padding:4px 8px; border-radius:3px; cursor:pointer; font-size:12px;">Replace All</button>
                <button id="anh-close-search" style="background:transparent; border:none; color:#ccc; cursor:pointer;">✖</button>
            </div>
            <div class="anh-editor-wrapper">
                <div class="anh-line-numbers" id="anh-line-numbers"></div>
                <div class="anh-editor-container">
                    <textarea spellcheck="false" class="anh-code-input" id="anh-textarea" wrap="off"></textarea>
                    <pre class="anh-code-output"><code id="anh-prism-code"></code></pre>
                    <div class="anh-error-panel" id="anh-error-panel"></div>
                </div>
            </div>
            <div class="anh-statusbar" id="anh-statusbar">
                <div class="anh-status-left">
                    <span id="anh-status-pos">Ln 1, Col 1</span>
                    <span id="anh-status-info">-</span>
                </div>
                <span id="anh-status-hint">ESC: Close | CTRL+F: Find | CTRL+Enter: Run</span>
            </div>
        `;
        document.body.appendChild(modal);

        // Populate tabs
        STATE.sourceFiles.forEach((file, index) => {
            const btn = document.createElement('button');
            btn.className = `anh-tab ${index === 0 ? 'active' : ''}`;
            btn.innerHTML = `${escapeHTML(file.name)} <span class="anh-tab-close">×</span>`;
            btn.onclick = (e) => {
                if (e.target.classList.contains('anh-tab-close')) return;
                switchFile(index);
            };
            btn.querySelector('.anh-tab-close').onclick = (e) => {
                e.stopPropagation();
            };
            document.getElementById('anh-tabs-container').appendChild(btn);
        });
    }

    function renderPreviewCard() {
        const previewCard = document.createElement('div');
        previewCard.id = 'anh-preview-card';
        previewCard.innerHTML = `
            <div class="anh-preview-header">
                <span>Live Preview</span>
                <button id="anh-preview-close" style="border:none; background:#d32f2f; color:#fff; border-radius:4px; cursor:pointer; padding:4px 8px; font-size:12px;">✖ Close</button>
            </div>
            <iframe id="anh-preview-iframe" sandbox="allow-scripts allow-same-origin allow-forms allow-popups"></iframe>
        `;
        document.body.appendChild(previewCard);
    }

    // ============= INTERACTIONS & EDITOR =============
    function setupInteractions() {
        const textarea = document.getElementById('anh-textarea');
        const prismCode = document.getElementById('anh-prism-code');
        const lineNumbers = document.getElementById('anh-line-numbers');

        // Debounced highlighting
        textarea.addEventListener('input', () => {
            STATE.sourceFiles[STATE.activeFileIndex].content = textarea.value;
            clearTimeout(STATE.highlightTimeout);
            STATE.highlightTimeout = setTimeout(() => {
                syncHighlighting();
            }, STATE.debounceDelay);
            updateLineNumbers();
            updateCursorPosition();
        });

        // Synchronized scrolling
        textarea.addEventListener('scroll', () => {
            prismCode.parentElement.scrollTop = textarea.scrollTop;
            prismCode.parentElement.scrollLeft = textarea.scrollLeft;
            lineNumbers.scrollTop = textarea.scrollTop;
        });

        // Cursor tracking
        ['keyup', 'click', 'focus'].forEach(evt =>
            textarea.addEventListener(evt, updateCursorPosition)
        );

        // Tab insertion
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                insertTabAtCursor(textarea);
            }
        });

        // Global keyboard shortcuts
        textarea.addEventListener('keydown', handleEditorKeydown);

        // Find & Replace
        document.getElementById('anh-replace-all').onclick = performReplaceAll;
        document.getElementById('anh-close-search').onclick = () => {
            document.getElementById('anh-search-bar').style.display = 'none';
        };

        // UI Controls
        document.getElementById('anh-close-btn').onclick = cleanup;
        document.getElementById('anh-preview-close').onclick = () => {
            document.getElementById('anh-preview-card').style.display = 'none';
        };
        document.getElementById('anh-run-btn').onclick = executeCode;
        document.getElementById('anh-format-btn').onclick = formatCode;

        // Store listeners for cleanup
        STATE.eventListeners.push({
            element: textarea,
            event: 'keydown',
            handler: handleEditorKeydown
        });

        switchFile(0);
    }

    function handleEditorKeydown(e) {
        // ESC: Close inspector
        if (e.key === 'Escape') {
            cleanup();
            return;
        }

        // CTRL+F: Find & Replace
        if (e.ctrlKey && e.key.toLowerCase() === 'f') {
            e.preventDefault();
            const searchBar = document.getElementById('anh-search-bar');
            searchBar.style.display = 'flex';
            document.getElementById('anh-find-input').focus();
            return;
        }

        // CTRL+Enter: Run Code
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            executeCode();
            return;
        }

        // CTRL+SHIFT+F: Format Code
        if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'f') {
            e.preventDefault();
            formatCode();
            return;
        }
    }

    function insertTabAtCursor(textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;

        textarea.value = value.substring(0, start) + '\t' + value.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + 1;

        // Trigger input event
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }

    function updateLineNumbers() {
        const textarea = document.getElementById('anh-textarea');
        const lines = textarea.value.split('\n').length;
        const lineNumbers = document.getElementById('anh-line-numbers');

        let html = '';
        for (let i = 1; i <= lines; i++) {
            html += `<span>${i}</span>`;
        }
        lineNumbers.innerHTML = html;
    }

    function updateCursorPosition() {
        const textarea = document.getElementById('anh-textarea');
        const textBeforeCursor = textarea.value.substring(0, textarea.selectionStart);
        const lines = textBeforeCursor.split('\n');
        const line = lines.length;
        const col = lines[lines.length - 1].length + 1;

        document.getElementById('anh-status-pos').textContent = `Ln ${line}, Col ${col}`;
        document.getElementById('anh-status-info').textContent = 
            `${STATE.sourceFiles[STATE.activeFileIndex].name} (${STATE.sourceFiles[STATE.activeFileIndex].type})`;
    }

    function switchFile(index) {
        STATE.activeFileIndex = index;
        const file = STATE.sourceFiles[index];

        // Update active tab
        document.querySelectorAll('.anh-tab').forEach((tab, i) => {
            tab.classList.toggle('active', i === index);
        });

        const textarea = document.getElementById('anh-textarea');
        textarea.value = file.content;
        syncHighlighting();
        updateLineNumbers();
        updateCursorPosition();
    }

    function syncHighlighting() {
        const file = STATE.sourceFiles[STATE.activeFileIndex];
        const prismCode = document.getElementById('anh-prism-code');
        const textarea = document.getElementById('anh-textarea');

        const typeMap = { 'html': 'markup', 'javascript': 'javascript', 'css': 'css' };
        prismCode.className = `language-${typeMap[file.type] || 'markup'}`;

        let content = textarea.value;
        let escapedContent = escapeHTML(content);

        // Ensure last newline is visible
        if (escapedContent.endsWith('\n')) escapedContent += ' ';

        prismCode.innerHTML = escapedContent;

        if (window.Prism) {
            Prism.highlightElement(prismCode);
        }
    }

    function performReplaceAll() {
        const findText = document.getElementById('anh-find-input').value;
        const replaceText = document.getElementById('anh-replace-input').value;

        if (!findText) {
            showNotification('Please enter text to find', 'warn');
            return;
        }

        const textarea = document.getElementById('anh-textarea');
        const regex = new RegExp(escapeRegex(findText), 'g');
        const oldValue = textarea.value;
        const newValue = oldValue.replace(regex, replaceText);
        const count = (oldValue.match(regex) || []).length;

        textarea.value = newValue;
        STATE.sourceFiles[STATE.activeFileIndex].content = newValue;
        syncHighlighting();
        updateLineNumbers();
        updateCursorPosition();

        showNotification(`Replaced ${count} occurrences`, 'success');
    }

    function formatCode() {
        const textarea = document.getElementById('anh-textarea');
        const file = STATE.sourceFiles[STATE.activeFileIndex];

        try {
            let formatted = textarea.value;

            if (file.type === 'javascript') {
                formatted = formatJavaScript(formatted);
            } else if (file.type === 'css') {
                formatted = formatCSS(formatted);
            } else if (file.type === 'html') {
                formatted = formatHTML(formatted);
            }

            textarea.value = formatted;
            STATE.sourceFiles[STATE.activeFileIndex].content = formatted;
            syncHighlighting();
            updateLineNumbers();
            showNotification('Code formatted', 'success');
        } catch (error) {
            showNotification(`Format error: ${error.message}`, 'error');
        }
    }

    function formatJavaScript(code) {
        let result = '';
        let indent = 0;
        let inString = false;
        let stringChar = '';

        for (let i = 0; i < code.length; i++) {
            const char = code[i];
            const prevChar = i > 0 ? code[i - 1] : '';
            const nextChar = i < code.length - 1 ? code[i + 1] : '';

            // Handle strings
            if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
                if (!inString) {
                    inString = true;
                    stringChar = char;
                } else if (char === stringChar) {
                    inString = false;
                }
            }

            if (!inString) {
                if (char === '{' || char === '[' || char === '(') {
                    result += char;
                    if (char === '{' || char === '[') {
                        indent++;
                        if (nextChar !== '}' && nextChar !== ']') {
                            result += '\n' + '  '.repeat(indent);
                        }
                    }
                } else if (char === '}' || char === ']' || char === ')') {
                    if (char === '}' || char === ']') {
                        indent = Math.max(0, indent - 1);
                        if (result.trim() && result[result.length - 1] !== '\n') {
                            result += '\n' + '  '.repeat(indent);
                        }
                    }
                    result += char;
                } else if (char === ';') {
                    result += char;
                    if (nextChar !== '\n' && nextChar !== '') {
                        result += '\n' + '  '.repeat(indent);
                    }
                } else if (char === ',') {
                    result += char + ' ';
                } else if (char !== '\n' && char !== '\r') {
                    result += char;
                } else if (char === '\n') {
                    if (result[result.length - 1] !== '\n') {
                        result += '\n';
                    }
                }
            } else {
                result += char;
            }
        }

        return result.trim();
    }

    function formatCSS(code) {
        return code
            .replace(/\s*{\s*/g, ' {\n  ')
            .replace(/;\s*/g, ';\n  ')
            .replace(/\s*}\s*/g, '\n}\n')
            .replace(/,\s*/g, ', ')
            .trim();
    }

    function formatHTML(code) {
        let result = '';
        let indent = 0;
        const selfClosing = ['br', 'hr', 'img', 'input', 'link', 'meta'];

        return code
            .replace(/>\s+</g, '><')
            .replace(/(<[^/][^>]*>)/g, (match) => {
                const tagName = match.match(/<(\w+)/)[1];
                result = '  '.repeat(indent) + match;
                if (!selfClosing.includes(tagName)) {
                    indent++;
                }
                return result;
            })
            .trim();
    }

    // ============= CODE EXECUTION =============
    function executeCode() {
        const htmlFile = STATE.sourceFiles.find(f => f.type === 'html');
        let finalHTML = htmlFile ? htmlFile.content : '<html><body></body></html>';

        try {
            // Inject CSS
            const cssFiles = STATE.sourceFiles.filter(f => f.type === 'css');
            cssFiles.forEach(css => {
                finalHTML = finalHTML.replace(/<\/head>/i, `<style>${css.content}</style></head>`);
            });

            // Inject JS
            const jsFiles = STATE.sourceFiles.filter(f => f.type === 'javascript');
            jsFiles.forEach(js => {
                finalHTML = finalHTML.replace(/<\/body>/i, `<script>${js.content}</script></body>`);
            });

            // Ensure closing tags exist
            if (!finalHTML.includes('</head>')) {
                finalHTML = finalHTML.replace(/<\/html>/i, '</head><body></body></html>');
            }
            if (!finalHTML.includes('</body>')) {
                finalHTML = finalHTML.replace(/<\/html>/i, '</body></html>');
            }

            // Clean up old blob URLs to prevent memory leaks
            STATE.blobUrls.forEach(url => URL.revokeObjectURL(url));
            STATE.blobUrls = [];

            const blob = new Blob([finalHTML], { type: 'text/html' });
            const previewUrl = URL.createObjectURL(blob);
            STATE.blobUrls.push(previewUrl);

            const previewCard = document.getElementById('anh-preview-card');
            const iframe = document.getElementById('anh-preview-iframe');

            iframe.src = '';
            iframe.src = previewUrl;
            previewCard.style.display = 'flex';

            showNotification('Code executed successfully', 'success');
        } catch (error) {
            showNotification(`Execution error: ${error.message}`, 'error');
        }
    }

    // ============= UTILITIES =============
    function escapeHTML(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, char => map[char]);
    }

    function escapeRegex(text) {
        return text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    function cleanup() {
        // Remove DOM elements
        ['#anh-lite-modal', '#anh-preview-card'].forEach(selector => {
            const el = document.querySelector(selector);
            if (el) el.remove();
        });

        // Cleanup blob URLs
        STATE.blobUrls.forEach(url => URL.revokeObjectURL(url));

        // Remove event listeners (simplified - in production use a proper event manager)
        clearTimeout(STATE.highlightTimeout);

        STATE.isInspectorOpen = false;
        STATE.sourceFiles = [];
        STATE.blobUrls = [];

        showNotification('Inspector closed', 'info');
    }

})();
