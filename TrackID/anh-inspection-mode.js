/**
 * FILE: anh-inspection-mode.js
 * Trigger: CTRL + C (When no text is selected)
 * Features: Prism.js Highlighting, Line/Col Tracking, Find & Replace, ANH Scripto Compliance
 */

(function () {
    'use strict';

    let isInspectorOpen = false;
    let sourceFiles = [];
    let activeFileIndex = 0;

    // --- 1. Key Binding ---
    window.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key.toLowerCase() === 'c') {
            const selectedText = window.getSelection().toString();
            if (!selectedText && !isInspectorOpen) {
                e.preventDefault();
                launchInspector();
            }
        }
    });

    async function launchInspector() {
        isInspectorOpen = true;
        await injectPrismJS();
        await gatherSources();
        renderUI();
    }

    // --- 2. Dependencies ---
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

    // --- 3. Source Gathering & ANH Compliance ---
    function getFileName(urlStr, fallback) {
        try {
            const path = new URL(urlStr, window.location.origin).pathname;
            const name = path.split('/').pop();
            return name ? name : fallback;
        } catch {
            return fallback;
        }
    }

    async function gatherSources() {
        sourceFiles = [];
        const htmlClone = document.documentElement.cloneNode(true);
        const getAbsoluteUrl = (url) => new URL(url, window.location.origin).href;

        // Process Scripts
        const scripts = htmlClone.querySelectorAll('script');
        let scriptCounter = 1;
        for (const script of scripts) {
            // ANH Policy: Leave Scripto inline
            if (script.classList.contains('Scripto')) continue; 

            if (script.hasAttribute('src')) {
                const src = script.getAttribute('src');
                try {
                    const res = await fetch(getAbsoluteUrl(src));
                    const content = await res.text();
                    sourceFiles.push({ name: getFileName(src, `script_${scriptCounter}.js`), type: 'javascript', content });
                } catch (e) { console.warn('Fetch failed:', src); }
            } else {
                sourceFiles.push({ name: `inline_script_${scriptCounter}.js`, type: 'javascript', content: script.textContent });
            }
            script.remove(); // Remove from HTML tab
            scriptCounter++;
        }

        // Process Styles
        const links = htmlClone.querySelectorAll('link[rel="stylesheet"]');
        let styleCounter = 1;
        for (const link of links) {
            const href = link.getAttribute('href');
            try {
                const res = await fetch(getAbsoluteUrl(href));
                const content = await res.text();
                sourceFiles.push({ name: getFileName(href, `style_${styleCounter}.css`), type: 'css', content });
            } catch (e) { console.warn('Fetch failed:', href); }
            link.remove(); // Remove from HTML tab
            styleCounter++;
        }

        const styles = htmlClone.querySelectorAll('style');
        for (const style of styles) {
            sourceFiles.push({ name: `inline_style_${styleCounter}.css`, type: 'css', content: style.textContent });
            style.remove();
            styleCounter++;
        }

        // Add Main HTML as the first tab
        sourceFiles.unshift({
            name: 'index.html',
            type: 'html',
            content: htmlClone.outerHTML
        });
    }

    // --- 4. UI Rendering ---
    function renderUI() {
        const style = document.createElement('style');
        style.textContent = `
            #anh-lite-modal {
                position: fixed; top: 2%; left: 5%; width: 90%; height: 96%;
                background: #1e1e1e; color: #fff; z-index: 2147483647;
                border-radius: 8px; box-shadow: 0 10px 40px rgba(0,0,0,0.8);
                display: flex; flex-direction: column; font-family: sans-serif;
            }
            .anh-header {
                display: flex; justify-content: space-between; padding: 8px 12px;
                background: #252526; border-radius: 8px 8px 0 0; border-bottom: 1px solid #333;
            }
            .anh-tabs { display: flex; gap: 4px; overflow-x: auto; scrollbar-width: thin; }
            .anh-tab {
                padding: 6px 14px; background: #2d2d2d; cursor: pointer;
                border-radius: 4px 4px 0 0; font-size: 12px; border: none; color: #969696;
            }
            .anh-tab.active { background: #1e1e1e; color: #fff; border-top: 2px solid #007acc; }
            .anh-actions button {
                padding: 6px 12px; margin-left: 8px; border: none; border-radius: 4px;
                cursor: pointer; font-size: 12px; font-weight: bold; color: white;
            }
            .anh-btn-run { background: #007acc; }
            .anh-btn-close { background: #d32f2f; }
            
            /* Find & Replace Bar */
            #anh-search-bar {
                display: none; padding: 8px 12px; background: #2d2d2d; border-bottom: 1px solid #444;
                gap: 10px; align-items: center; font-size: 12px;
            }
            .anh-search-input {
                background: #3c3c3c; border: 1px solid #555; color: white; padding: 4px 8px; border-radius: 3px;
            }

            /* Editor Core Layout */
            .anh-editor-wrapper {
                display: flex; flex: 1; overflow: hidden; position: relative; background: #1e1e1e;
            }
            .anh-line-numbers {
                width: 40px; background: #1e1e1e; color: #858585; text-align: right;
                padding: 15px 10px 15px 5px; font-family: Consolas, monospace; font-size: 14px;
                line-height: 1.5; overflow: hidden; user-select: none; border-right: 1px solid #333;
            }
            .anh-editor-container {
                position: relative; flex: 1; overflow: hidden;
            }
            .anh-code-input, .anh-code-output {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                padding: 15px; margin: 0; border: none; box-sizing: border-box;
                font-family: Consolas, monospace; font-size: 14px; line-height: 1.5;
                white-space: pre; overflow: auto; tab-size: 4; word-wrap: normal;
            }
            .anh-code-input {
                color: transparent; background: transparent; caret-color: #fff;
                z-index: 2; resize: none; outline: none;
            }
            .anh-code-output { z-index: 1; pointer-events: none; }
            
            .anh-statusbar {
                background: #007acc; color: white; font-size: 11px; padding: 4px 12px;
                display: flex; justify-content: flex-end; border-radius: 0 0 8px 8px;
            }

            /* Iframe Preview Card */
            #anh-preview-card {
                position: fixed; top: 5%; left: 5%; width: 90%; height: 90%;
                background: #fff; z-index: 2147483648; border-radius: 8px;
                box-shadow: 0 10px 50px rgba(0,0,0,0.9); display: none; flex-direction: column;
            }
            .anh-preview-header {
                background: #252526; padding: 10px 15px; display: flex; justify-content: space-between;
                color: #fff; font-weight: bold; border-radius: 8px 8px 0 0;
            }
            #anh-preview-iframe { flex: 1; border: none; width: 100%; border-radius: 0 0 8px 8px; background: #fff;}
        `;
        document.head.appendChild(style);

        const modal = document.createElement('div');
        modal.id = 'anh-lite-modal';
        modal.innerHTML = `
            <div class="anh-header">
                <div class="anh-tabs" id="anh-tabs-container"></div>
                <div class="anh-actions">
                    <button class="anh-btn-run" id="anh-run-btn">▶ Run</button>
                    <button class="anh-btn-close" id="anh-close-btn">✖</button>
                </div>
            </div>
            <div id="anh-search-bar">
                <input type="text" id="anh-find-input" class="anh-search-input" placeholder="Find word...">
                <input type="text" id="anh-replace-input" class="anh-search-input" placeholder="Replace with...">
                <button class="anh-actions" id="anh-replace-all" style="background:#007acc; border:none; color:white; padding:4px 8px; border-radius:3px; cursor:pointer;">Replace All</button>
                <button class="anh-actions" id="anh-close-search" style="background:transparent; border:none; color:#ccc; cursor:pointer;">✖</button>
            </div>
            <div class="anh-editor-wrapper">
                <div class="anh-line-numbers" id="anh-line-numbers">1</div>
                <div class="anh-editor-container">
                    <textarea spellcheck="false" class="anh-code-input" id="anh-textarea" wrap="off"></textarea>
                    <pre class="anh-code-output"><code id="anh-prism-code"></code></pre>
                </div>
            </div>
            <div class="anh-statusbar" id="anh-statusbar">Ln 1, Col 1</div>
        `;
        document.body.appendChild(modal);

        const previewCard = document.createElement('div');
        previewCard.id = 'anh-preview-card';
        previewCard.innerHTML = `
            <div class="anh-preview-header">
                <span>Live Preview Output</span>
                <button class="anh-btn-close" id="anh-preview-close" style="border:none; background:#d32f2f; color:#fff; border-radius:4px; cursor:pointer; padding:4px 8px;">✖ Close</button>
            </div>
            <iframe id="anh-preview-iframe"></iframe>
        `;
        document.body.appendChild(previewCard);

        setupInteractions();
        switchFile(0);
    }

    // --- 5. Interactions & Editor Features ---
    function setupInteractions() {
        const tabsContainer = document.getElementById('anh-tabs-container');
        const textarea = document.getElementById('anh-textarea');
        const prismCode = document.getElementById('anh-prism-code');
        const lineNumbers = document.getElementById('anh-line-numbers');
        const statusbar = document.getElementById('anh-statusbar');

        sourceFiles.forEach((file, index) => {
            const btn = document.createElement('button');
            btn.className = `anh-tab ${index === 0 ? 'active' : ''}`;
            btn.textContent = file.name;
            btn.onclick = () => switchFile(index);
            tabsContainer.appendChild(btn);
        });

        // Sync Content, Highlighting, and Line Numbers
        textarea.addEventListener('input', () => {
            sourceFiles[activeFileIndex].content = textarea.value;
            syncHighlighting();
            updateLineNumbers();
            updateCursorPosition();
        });

        // Sync Scrolling accurately
        textarea.addEventListener('scroll', () => {
            prismCode.parentElement.scrollTop = textarea.scrollTop;
            prismCode.parentElement.scrollLeft = textarea.scrollLeft;
            lineNumbers.scrollTop = textarea.scrollTop;
        });

        // Track Cursor
        ['keyup', 'click', 'focus'].forEach(evt => 
            textarea.addEventListener(evt, updateCursorPosition)
        );

        // Find and Replace Multi-Edit (CTRL+F)
        textarea.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key.toLowerCase() === 'f') {
                e.preventDefault();
                document.getElementById('anh-search-bar').style.display = 'flex';
                document.getElementById('anh-find-input').focus();
            }
        });

        document.getElementById('anh-replace-all').onclick = () => {
            const findText = document.getElementById('anh-find-input').value;
            const replaceText = document.getElementById('anh-replace-input').value;
            if (!findText) return;

            const regex = new RegExp(findText.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
            textarea.value = textarea.value.replace(regex, replaceText);
            
            sourceFiles[activeFileIndex].content = textarea.value;
            syncHighlighting();
            updateLineNumbers();
        };

        document.getElementById('anh-close-search').onclick = () => {
            document.getElementById('anh-search-bar').style.display = 'none';
        };

        // UI Controls
        document.getElementById('anh-close-btn').onclick = () => {
            document.getElementById('anh-lite-modal').remove();
            document.getElementById('anh-preview-card').remove();
            isInspectorOpen = false;
        };

        document.getElementById('anh-preview-close').onclick = () => {
            document.getElementById('anh-preview-card').style.display = 'none';
        };

        document.getElementById('anh-run-btn').onclick = executeCode;
    }

    function updateLineNumbers() {
        const textarea = document.getElementById('anh-textarea');
        const lines = textarea.value.split('\n').length;
        const lineNumbers = document.getElementById('anh-line-numbers');
        
        let numbersHTML = '';
        for (let i = 1; i <= lines; i++) {
            numbersHTML += i + '<br>';
        }
        lineNumbers.innerHTML = numbersHTML;
    }

    function updateCursorPosition() {
        const textarea = document.getElementById('anh-textarea');
        const textBeforeCursor = textarea.value.substring(0, textarea.selectionStart);
        const line = textBeforeCursor.split('\n').length;
        const col = textBeforeCursor.length - textBeforeCursor.lastIndexOf('\n');
        
        document.getElementById('anh-statusbar').textContent = `Ln ${line}, Col ${col}`;
    }

    function switchFile(index) {
        activeFileIndex = index;
        const file = sourceFiles[index];
        
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
        const file = sourceFiles[activeFileIndex];
        const prismCode = document.getElementById('anh-prism-code');
        const textarea = document.getElementById('anh-textarea');
        
        const typeMap = { 'html': 'markup', 'javascript': 'javascript', 'css': 'css' };
        prismCode.className = `language-${typeMap[file.type] || 'markup'}`;
        
        let escapedContent = textarea.value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        if (escapedContent[escapedContent.length - 1] === "\n") escapedContent += " ";

        prismCode.innerHTML = escapedContent;
        if (window.Prism) Prism.highlightElement(prismCode);
    }

    // --- 6. Compilation & Execution ---
    function executeCode() {
        const htmlFile = sourceFiles.find(f => f.type === 'html');
        let finalHTML = htmlFile ? htmlFile.content : '';
        let injectedCSS = '';
        let injectedJS = '';

        sourceFiles.forEach(f => {
            if (f.type === 'css') injectedCSS += `\n${f.content}`;
            if (f.type === 'javascript') injectedJS += `\n${f.content}`;
        });

        // Safely inject before closing tags
        if (injectedCSS) {
            finalHTML = finalHTML.replace(/<\/head>/i, `<style>${injectedCSS}</style></head>`);
        }
        if (injectedJS) {
            finalHTML = finalHTML.replace(/<\/body>/i, `<script>${injectedJS}</script></body>`);
        }

        const blob = new Blob([finalHTML], { type: 'text/html' });
        const previewUrl = URL.createObjectURL(blob);
        
        const previewCard = document.getElementById('anh-preview-card');
        const iframe = document.getElementById('anh-preview-iframe');
        
        iframe.src = previewUrl;
        previewCard.style.display = 'flex';
    }

})();
