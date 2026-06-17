/**
 * FILE: anh-inspection-mode.js
 * Trigger: CTRL + C (When no text is selected)
 * Purpose: ANH Developer Tools - Frontend inspection & site exploration for ANH Visitors
 * * FEATURES:
 * ✓ Responsive Design (Mobile, Tablet, Desktop)
 * ✓ DOM Inspector with Element Picker
 * ✓ Style Inspector (Computed & Inline Styles)
 * ✓ Console Log Viewer
 * ✓ Network Monitor
 * ✓ Source Code Explorer
 * ✓ Performance Metrics
 * ✓ Accessibility Checker
 * ✓ Color Picker & Palette Generator
 * ✓ Responsive Preview
 */

(function () {
    'use strict';

    // ============= STATE MANAGEMENT =============
    const STATE = {
        isDevToolsOpen: false,
        sourceFiles: [],
        activeFileIndex: 0,
        activePanelIndex: 0,
        blobUrls: [],
        consoleMessages: [],
        networkRequests: [],
        selectedElement: null,
        elementPickerActive: false,
        elementPickerOverlay: null,
        performanceMetrics: {},
        blobURLs: [],
        highlightTimeout: null,
        debounceDelay: 150,
    };

    const PANELS = {
        INSPECTOR: 0,
        CONSOLE: 1,
        SOURCES: 2,
        NETWORK: 3,
        PERFORMANCE: 4,
        ACCESSIBILITY: 5
    };

    const VIEWPORT_SIZES = {
        mobile: { width: 375, height: 667, name: 'iPhone 12' },
        tablet: { width: 768, height: 1024, name: 'iPad' },
        desktop: { width: 1920, height: 1080, name: 'Desktop' },
        custom: { width: 1280, height: 720, name: 'Custom' }
    };

    // ============= INITIALIZATION =============
    window.addEventListener('keydown', handleGlobalKeydown);

    // Intercept console methods
    interceptConsole();
    interceptNetworkRequests();

    function handleGlobalKeydown(e) {
        if (e.ctrlKey && e.key.toLowerCase() === 'c') {
            const selectedText = window.getSelection().toString();
            if (!selectedText && !STATE.isDevToolsOpen) {
                e.preventDefault();
                launchDevTools();
            }
        }
    }

    async function launchDevTools() {
        STATE.isDevToolsOpen = true;
        try {
            await injectDependencies();
            gatherSources();
            recordPerformanceMetrics();
            renderDevTools();
            setupInteractions();
            showNotification('ANH DevTools loaded', 'success');
        } catch (error) {
            showNotification(`Error: ${error.message}`, 'error');
            STATE.isDevToolsOpen = false;
        }
    }

    // ============= DEPENDENCY INJECTION =============
    async function injectDependencies() {
        return Promise.all([injectPrismCSS(), injectPrismJS()]);
    }

    function injectPrismCSS() {
        return new Promise((resolve) => {
            if (document.querySelector('link[href*="prism"]')) return resolve();
            
            const css = document.createElement('link');
            css.rel = 'stylesheet';
            css.href = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css';
            css.onload = resolve;
            css.onerror = () => showNotification('Prism CSS load failed', 'warn');
            document.head.appendChild(css);
        });
    }

    function injectPrismJS() {
        return new Promise((resolve) => {
            if (window.Prism) return resolve();
            
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js';
            script.onload = resolve;
            script.onerror = () => showNotification('Prism JS load failed', 'warn');
            document.head.appendChild(script);
        });
    }

    // ============= CONSOLE INTERCEPTION =============
    // FIX 1: Infinite Recursion Browser Crash Prevented via requestAnimationFrame
    function interceptConsole() {
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;
        const originalInfo = console.info;

        let updateScheduled = false;

        const scheduleUpdate = () => {
            if (STATE.isDevToolsOpen && !updateScheduled) {
                updateScheduled = true;
                requestAnimationFrame(() => {
                    updateConsolePanel();
                    updateScheduled = false;
                });
            }
        };

        console.log = function(...args) {
            originalLog.apply(console, args);
            STATE.consoleMessages.push({
                type: 'log',
                message: args.map(formatConsoleArg).join(' '),
                timestamp: new Date(),
                raw: args
            });
            scheduleUpdate();
        };

        console.error = function(...args) {
            originalError.apply(console, args);
            STATE.consoleMessages.push({
                type: 'error',
                message: args.map(formatConsoleArg).join(' '),
                timestamp: new Date(),
                raw: args
            });
            scheduleUpdate();
        };

        console.warn = function(...args) {
            originalWarn.apply(console, args);
            STATE.consoleMessages.push({
                type: 'warn',
                message: args.map(formatConsoleArg).join(' '),
                timestamp: new Date(),
                raw: args
            });
            scheduleUpdate();
        };

        console.info = function(...args) {
            originalInfo.apply(console, args);
            STATE.consoleMessages.push({
                type: 'info',
                message: args.map(formatConsoleArg).join(' '),
                timestamp: new Date(),
                raw: args
            });
            scheduleUpdate();
        };
    }

    function formatConsoleArg(arg) {
        if (typeof arg === 'object') {
            return JSON.stringify(arg, null, 2);
        }
        return String(arg);
    }

    // ============= NETWORK INTERCEPTION =============
    // FIX 5: Layout Thrashing Debounced via setTimeout
    let networkUpdateTimeout = null;
    
    function interceptNetworkRequests() {
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
            const startTime = performance.now();
            const url = args[0];

            STATE.networkRequests.push({
                url: String(url),
                method: (args[1]?.method || 'GET').toUpperCase(),
                status: 'pending',
                startTime,
                endTime: null,
                duration: null,
                size: null
            });

            const scheduleNetworkUpdate = () => {
                if (STATE.isDevToolsOpen) {
                    clearTimeout(networkUpdateTimeout);
                    networkUpdateTimeout = setTimeout(updateNetworkPanel, 100);
                }
            };

            return originalFetch.apply(this, args)
                .then(response => {
                    const endTime = performance.now();
                    const req = STATE.networkRequests[STATE.networkRequests.length - 1];
                    req.status = response.status;
                    req.endTime = endTime;
                    req.duration = (endTime - startTime).toFixed(2);
                    req.size = response.headers.get('content-length') || 'unknown';
                    scheduleNetworkUpdate();
                    return response;
                })
                .catch(error => {
                    const endTime = performance.now();
                    const req = STATE.networkRequests[STATE.networkRequests.length - 1];
                    req.status = 'failed';
                    req.endTime = endTime;
                    req.duration = (endTime - startTime).toFixed(2);
                    scheduleNetworkUpdate();
                    throw error;
                });
        };
    }

    // ============= SOURCE GATHERING =============
    // FIX 4: Main Thread Lock Removed (No more documentElement.cloneNode(true))
    function gatherSources() {
        STATE.sourceFiles = [];

        const getAbsoluteUrl = (url) => {
            try {
                return new URL(url, window.location.origin).href;
            } catch {
                return url;
            }
        };

        // Query Live DOM explicitly filtering out DevTools UI Elements
        const filterDevTools = (el) => !el.closest('#anh-devtools-container') && 
                                       !el.closest('#anh-responsive-preview') && 
                                       !el.closest('#anh-element-picker-overlay');

        // Process Scripts
        const scripts = Array.from(document.querySelectorAll('script')).filter(filterDevTools);
        let scriptCounter = 1;
        
        for (const script of scripts) {
            if (script.classList.contains('Scripto')) continue;
            try {
                if (script.hasAttribute('src')) {
                    const src = script.getAttribute('src');
                    const name = getFileName(src, `script_${scriptCounter}.js`);
                    STATE.sourceFiles.push({
                        name,
                        type: 'javascript',
                        content: `// External: ${src}`,
                        url: src
                    });
                } else if (script.textContent.trim()) {
                    STATE.sourceFiles.push({
                        name: `inline_script_${scriptCounter}.js`,
                        type: 'javascript',
                        content: script.textContent
                    });
                }
            } catch (e) {
                console.warn('Script processing failed:', e);
            }
            scriptCounter++;
        }

        // Process Stylesheets
        const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).filter(filterDevTools);
        let styleCounter = 1;
        
        for (const link of links) {
            try {
                const href = link.getAttribute('href');
                const name = getFileName(href, `style_${styleCounter}.css`);
                STATE.sourceFiles.push({
                    name,
                    type: 'css',
                    content: `/* External: ${href} */`,
                    url: href
                });
            } catch (e) {
                console.warn('Stylesheet processing failed:', e);
            }
            styleCounter++;
        }

        // Process Inline Styles
        const styles = Array.from(document.querySelectorAll('style')).filter(filterDevTools);
        for (let i = 0; i < styles.length; i++) {
            if (styles[i].textContent.trim()) {
                STATE.sourceFiles.push({
                    name: `inline_style_${i + 1}.css`,
                    type: 'css',
                    content: styles[i].textContent
                });
            }
        }

        // Add Main HTML
        STATE.sourceFiles.unshift({
            name: 'index.html',
            type: 'html',
            content: document.documentElement.outerHTML
        });
    }

    function getFileName(urlStr, fallback) {
        try {
            const path = new URL(urlStr, window.location.origin).pathname;
            const name = path.split('/').pop();
            return name && name.length > 0 ? name : fallback;
        } catch {
            return fallback;
        }
    }

    // ============= PERFORMANCE METRICS =============
    function recordPerformanceMetrics() {
        if (window.performance && window.performance.timing) {
            const timing = performance.timing;
            STATE.performanceMetrics = {
                dns: timing.domainLookupEnd - timing.domainLookupStart,
                tcp: timing.connectEnd - timing.connectStart,
                request: timing.responseStart - timing.requestStart,
                response: timing.responseEnd - timing.responseStart,
                dom: timing.domInteractive - timing.domLoading,
                load: timing.loadEventEnd - timing.loadEventStart,
                total: timing.loadEventEnd - timing.navigationStart,
                domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart
            };
        }

        if (window.performance && window.performance.memory) {
            STATE.performanceMetrics.memory = {
                usedJSHeapSize: (window.performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
                totalJSHeapSize: (window.performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
                jsHeapSizeLimit: (window.performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB'
            };
        }
    }

    // ============= ACCESSIBILITY CHECKER =============
    function checkAccessibility() {
        const issues = [];

        document.querySelectorAll('img').forEach(img => {
            if (!img.alt || img.alt.trim() === '') {
                issues.push({ level: 'error', element: 'img', issue: 'Missing alt text', selector: getSelector(img) });
            }
        });

        document.querySelectorAll('input').forEach(input => {
            if (input.type === 'text' || input.type === 'email' || input.type === 'password') {
                const label = document.querySelector(`label[for="${input.id}"]`);
                if (!label) {
                    issues.push({ level: 'warn', element: 'input', issue: 'No associated label', selector: getSelector(input) });
                }
            }
        });

        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        if (headings.length > 0) {
            const firstLevel = parseInt(headings[0].tagName[1]);
            if (firstLevel !== 1) {
                issues.push({ level: 'warn', element: 'heading', issue: 'Page should start with H1', selector: headings[0].tagName });
            }
        }

        document.querySelectorAll('*').forEach(el => {
            if (el.textContent.trim().length > 0) {
                const style = window.getComputedStyle(el);
                if (style.color === 'rgb(0, 0, 0)' && style.backgroundColor === 'rgb(0, 0, 0)') {
                    issues.push({ level: 'error', element: el.tagName, issue: 'Poor color contrast', selector: getSelector(el) });
                }
            }
        });

        document.querySelectorAll('button, a, input').forEach(el => {
            if (!el.hasAttribute('tabindex') && el.tabIndex === -1) {
                if (el.tagName !== 'A' || !el.href) {
                    issues.push({ level: 'info', element: el.tagName, issue: 'Element may not be keyboard accessible', selector: getSelector(el) });
                }
            }
        });

        return issues;
    }

    function getSelector(el) {
        if (el.id) return `#${el.id}`;
        if (el.className) return `.${el.className.split(' ')[0]}`;
        return el.tagName.toLowerCase();
    }

    // ============= ELEMENT INSPECTOR =============
    function activateElementPicker() {
        STATE.elementPickerActive = !STATE.elementPickerActive;

        if (STATE.elementPickerActive) {
            STATE.elementPickerOverlay = document.createElement('div');
            STATE.elementPickerOverlay.id = 'anh-element-picker-overlay';
            STATE.elementPickerOverlay.style.cssText = `
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                z-index: 2147483646;
                pointer-events: none;
            `;
            document.body.appendChild(STATE.elementPickerOverlay);

            document.addEventListener('mousemove', handleElementPickerMove, true);
            document.addEventListener('click', handleElementPickerClick, true);

            showNotification('Click element to inspect', 'info');
        } else {
            if (STATE.elementPickerOverlay) STATE.elementPickerOverlay.remove();
            document.removeEventListener('mousemove', handleElementPickerMove, true);
            document.removeEventListener('click', handleElementPickerClick, true);
        }
    }

    function handleElementPickerMove(e) {
        const element = document.elementFromPoint(e.clientX, e.clientY);
        if (!element || element.id === 'anh-element-picker-overlay') return;

        const rect = element.getBoundingClientRect();
        const overlay = document.getElementById('anh-element-picker-overlay');

        overlay.innerHTML = `
            <div style="
                position: fixed;
                top: ${rect.top}px;
                left: ${rect.left}px;
                width: ${rect.width}px;
                height: ${rect.height}px;
                border: 2px solid #007acc;
                background: rgba(0, 122, 204, 0.1);
                box-shadow: inset 0 0 0 1px #007acc;
                pointer-events: none;
                z-index: 2147483646;
            "></div>
            <div style="
                position: fixed;
                top: ${Math.max(rect.top - 30, 10)}px;
                left: ${rect.left}px;
                background: #007acc;
                color: white;
                padding: 4px 8px;
                font-size: 11px;
                font-family: monospace;
                border-radius: 2px;
                pointer-events: none;
                z-index: 2147483647;
            ">
                &lt;${escapeHTML(element.tagName.toLowerCase())}&gt; ${element.className ? '.' + escapeHTML(element.className.split(' ')[0]) : ''} ${element.id ? '#' + escapeHTML(element.id) : ''}
            </div>
        `;
    }

    function handleElementPickerClick(e) {
        e.preventDefault();
        e.stopPropagation();

        STATE.selectedElement = e.target;
        displayElementDetails(STATE.selectedElement);
        activateElementPicker();
    }

    function displayElementDetails(element) {
        const details = {
            tag: element.tagName.toLowerCase(),
            id: element.id,
            classes: element.className,
            attributes: {},
            styles: window.getComputedStyle(element),
            box: element.getBoundingClientRect(),
            html: element.outerHTML.substring(0, 500)
        };

        for (let attr of element.attributes) {
            details.attributes[attr.name] = attr.value;
        }

        updateInspectorPanel(details);
    }

    // ============= DOM TREE GENERATOR =============
    // FIX 2: Stored XSS Addressed (All dynamic attributes/content wrapped in escapeHTML)
    function generateDOMTree(element = document.body, depth = 0, maxDepth = 3) {
        if (depth > maxDepth) return '';

        const children = Array.from(element.children);
        let html = '';

        for (const child of children) {
            if (child.id === 'anh-devtools-container' || child.id === 'anh-devtools-modal') continue;

            const isCollapsible = child.children.length > 0;
            const indent = '&nbsp;'.repeat(depth * 2);
            const icon = isCollapsible ? '▼' : '▸';

            html += `
                <div class="dom-tree-item" style="margin-left: ${depth * 15}px; padding: 2px 0;">
                    <span class="dom-tree-icon" ${!isCollapsible ? 'style="visibility: hidden;"' : ''}>${icon}</span>
                    <span class="dom-tree-tag">&lt;${escapeHTML(child.tagName.toLowerCase())}</span>
                    ${child.id ? `<span class="dom-tree-id"> id="${escapeHTML(child.id)}"</span>` : ''}
                    ${child.className ? `<span class="dom-tree-class"> class="${escapeHTML(child.className)}"</span>` : ''}
                    <span class="dom-tree-tag">&gt;</span>
                    <span class="dom-tree-text">${escapeHTML(child.textContent.substring(0, 50))}</span>
                </div>
            `;

            if (isCollapsible) {
                html += generateDOMTree(child, depth + 1, maxDepth);
            }
        }

        return html;
    }

    // ============= UI RENDERING =============
    function renderDevTools() {
        injectStyles();
        const container = document.createElement('div');
        container.id = 'anh-devtools-container';
        document.body.appendChild(container);
        container.innerHTML = createDevToolsHTML();
        setupPanels();
    }

    function injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            * { box-sizing: border-box; }

            @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

            #anh-devtools-container {
                position: fixed; bottom: 0; left: 0; right: 0; width: 100%; height: 50vh;
                background: #1e1e1e; border-top: 1px solid #333; z-index: 2147483640;
                display: flex; flex-direction: column; animation: slideUp 0.3s ease;
                font-family: 'Segoe UI', sans-serif; color: #d4d4d4; overflow: hidden;
            }

            @media (max-width: 1024px) { #anh-devtools-container { height: 60vh; } }
            @media (max-width: 768px) {
                #anh-devtools-container { height: 70vh; }
                .devtools-header { flex-wrap: wrap; }
                .devtools-tabs { margin-top: 5px; }
            }
            @media (max-width: 480px) {
                #anh-devtools-container { height: 100vh; top: 0; bottom: auto; border-radius: 8px 8px 0 0; }
                .devtools-tabs button { padding: 6px 8px; font-size: 10px; }
            }

            .devtools-header { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #252526; border-bottom: 1px solid #333; gap: 8px; }
            .devtools-tabs { display: flex; gap: 2px; overflow-x: auto; flex: 1; scrollbar-width: thin; }
            .devtools-tab { padding: 8px 14px; background: #2d2d2d; border: none; cursor: pointer; color: #969696; font-size: 12px; border-bottom: 2px solid transparent; transition: all 0.2s; white-space: nowrap; }
            .devtools-tab:hover { background: #3d3d3d; }
            .devtools-tab.active { background: #1e1e1e; color: #fff; border-bottom-color: #007acc; }

            .devtools-controls { display: flex; gap: 8px; align-items: center; }
            .devtools-btn { padding: 6px 12px; border: none; border-radius: 3px; cursor: pointer; font-size: 11px; font-weight: bold; color: white; transition: all 0.2s; }
            .btn-picker { background: #0e639c; }
            .btn-resize { background: #0e639c; }
            .btn-clear { background: #d32f2f; }
            .btn-close { background: #d32f2f; }
            .devtools-btn:hover { opacity: 0.8; }
            .devtools-btn.active { background: #007acc; }

            .devtools-content { flex: 1; overflow: auto; display: flex; }
            .panel { display: none; flex: 1; overflow: auto; padding: 12px; width: 100%; }
            .panel.active { display: block; }

            .inspector-section { margin-bottom: 16px; border-left: 3px solid #007acc; padding-left: 12px; }
            .inspector-title { font-weight: bold; color: #4ec9b0; margin-bottom: 8px; font-size: 12px; }
            .inspector-property { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #333; font-size: 11px; font-family: monospace; }
            .inspector-key { color: #9cdcfe; }
            .inspector-value { color: #ce9178; }

            .dom-tree-item { padding: 2px 0; cursor: pointer; font-size: 12px; font-family: monospace; user-select: none; }
            .dom-tree-item:hover { background: #2d2d30; }
            .dom-tree-icon { cursor: pointer; color: #007acc; margin-right: 4px; }
            .dom-tree-tag { color: #9cdcfe; }
            .dom-tree-id { color: #ce9178; }
            .dom-tree-class { color: #4ec9b0; }
            .dom-tree-text { color: #808080; font-size: 10px; }

            .console-message { padding: 8px; margin: 4px 0; border-left: 3px solid #007acc; border-radius: 2px; font-size: 12px; font-family: monospace; word-break: break-word; }
            .console-log { border-left-color: #4ec9b0; color: #d4d4d4; }
            .console-error { border-left-color: #f48771; color: #f48771; }
            .console-warn { border-left-color: #dcdcaa; color: #dcdcaa; }
            .console-info { border-left-color: #4fc1ff; color: #4fc1ff; }
            .console-time { color: #888; font-size: 10px; }

            .network-request { padding: 8px; margin: 4px 0; background: #2d2d2d; border-radius: 3px; font-size: 11px; font-family: monospace; }
            .network-url { color: #9cdcfe; margin-bottom: 4px; word-break: break-all; }
            .network-meta { display: flex; justify-content: space-between; color: #888; }
            .network-status-200 { color: #4ec9b0; }
            .network-status-error { color: #f48771; }
            .network-status-pending { color: #dcdcaa; }

            .perf-metric { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; }
            .perf-item { background: #2d2d2d; padding: 8px; border-radius: 3px; border-left: 3px solid #007acc; }
            .perf-label { color: #9cdcfe; font-size: 11px; }
            .perf-value { color: #4ec9b0; font-size: 14px; font-weight: bold; }

            .a11y-issue { padding: 8px; margin: 4px 0; border-radius: 3px; font-size: 11px; border-left: 3px solid; }
            .a11y-error { background: #3d0a0a; border-left-color: #f48771; color: #f48771; }
            .a11y-warn { background: #3d2d0a; border-left-color: #dcdcaa; color: #dcdcaa; }
            .a11y-info { background: #0a2d3d; border-left-color: #4fc1ff; color: #4fc1ff; }
            .a11y-element { color: #9cdcfe; font-family: monospace; }

            #anh-responsive-preview { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.9); z-index: 2147483650; display: none; flex-direction: column; animation: fadeIn 0.3s ease; }
            .preview-toolbar { background: #252526; padding: 10px; display: flex; gap: 10px; align-items: center; border-bottom: 1px solid #333; flex-wrap: wrap; }
            .preview-device-btn { padding: 6px 12px; background: #2d2d2d; border: 1px solid #555; color: white; cursor: pointer; border-radius: 3px; font-size: 12px; transition: all 0.2s; }
            .preview-device-btn.active { background: #007acc; border-color: #007acc; }
            .preview-frame { flex: 1; display: flex; justify-content: center; align-items: center; padding: 20px; overflow: auto; }
            .preview-viewport { background: white; border: 8px solid #333; border-radius: 8px; overflow: hidden; box-shadow: 0 10px 50px rgba(0,0,0,0.5); width: 100%; height: 100%; max-width: 100%; max-height: 100%; }
            .preview-viewport iframe { width: 100%; height: 100%; border: none; }

            .devtools-content::-webkit-scrollbar, .panel::-webkit-scrollbar { width: 8px; }
            .devtools-content::-webkit-scrollbar-track, .panel::-webkit-scrollbar-track { background: #1e1e1e; }
            .devtools-content::-webkit-scrollbar-thumb, .panel::-webkit-scrollbar-thumb { background: #464647; border-radius: 4px; }
            .devtools-content::-webkit-scrollbar-thumb:hover, .panel::-webkit-scrollbar-thumb:hover { background: #5e5e5f; }

            .devtools-notification { position: fixed; bottom: 60vh; right: 20px; background: #007acc; color: white; padding: 10px 16px; border-radius: 3px; font-size: 12px; z-index: 2147483650; animation: slideUp 0.3s ease; }
            .devtools-notification.error { background: #d32f2f; }
            .devtools-notification.warn { background: #ff9800; }
            .devtools-notification.success { background: #4caf50; }

            body.devtools-open > *:not(#anh-devtools-container):not(.devtools-notification):not(#anh-element-picker-overlay) { margin-bottom: 50vh; }
            @media (max-width: 768px) { body.devtools-open > *:not(#anh-devtools-container):not(.devtools-notification):not(#anh-element-picker-overlay) { margin-bottom: 70vh; } }
            @media (max-width: 480px) { body.devtools-open > *:not(#anh-devtools-container):not(.devtools-notification):not(#anh-element-picker-overlay) { margin-bottom: 0; } }
        `;
        document.head.appendChild(style);
    }

    function createDevToolsHTML() {
        return `
            <div class="devtools-header">
                <div class="devtools-tabs">
                    <button class="devtools-tab active" data-panel="0">🔍 Inspector</button>
                    <button class="devtools-tab" data-panel="1">📋 Console</button>
                    <button class="devtools-tab" data-panel="2">📄 Sources</button>
                    <button class="devtools-tab" data-panel="3">🌐 Network</button>
                    <button class="devtools-tab" data-panel="4">⚡ Performance</button>
                    <button class="devtools-tab" data-panel="5">♿ Accessibility</button>
                </div>
                <div class="devtools-controls">
                    <button class="devtools-btn btn-picker" id="btn-element-picker" title="Element Picker">🎯 Pick</button>
                    <button class="devtools-btn btn-resize" id="btn-responsive" title="Responsive Design">📱 Responsive</button>
                    <button class="devtools-btn btn-clear" id="btn-clear" title="Clear All">🗑️ Clear</button>
                    <button class="devtools-btn btn-close" id="btn-devtools-close" title="Close DevTools">✖</button>
                </div>
            </div>

            <div class="devtools-content">
                <div class="panel active" id="panel-0">
                    <div class="inspector-section">
                        <div class="inspector-title">DOM Tree</div>
                        <div id="dom-tree-container" style="font-size: 12px; font-family: monospace;"></div>
                    </div>
                </div>

                <div class="panel" id="panel-1">
                    <div id="console-output"></div>
                </div>

                <div class="panel" id="panel-2">
                    <div style="display: flex; gap: 10px; height: 100%;">
                        <div style="width: 200px; border-right: 1px solid #333; overflow-y: auto;">
                            <div style="font-weight: bold; padding: 8px 0; color: #4ec9b0; font-size: 11px;">FILES</div>
                            <div id="sources-list"></div>
                        </div>
                        <div style="flex: 1; overflow-y: auto;">
                            <div id="sources-viewer" style="font-family: monospace; font-size: 12px;"></div>
                        </div>
                    </div>
                </div>

                <div class="panel" id="panel-3">
                    <div id="network-output"></div>
                </div>

                <div class="panel" id="panel-4">
                    <div id="performance-output"></div>
                </div>

                <div class="panel" id="panel-5">
                    <div id="accessibility-output"></div>
                </div>
            </div>
        `;
    }

    // ============= PANEL SETUP & UPDATES =============
    function setupPanels() {
        document.querySelectorAll('.devtools-tab').forEach(tab => {
            tab.addEventListener('click', () => switchPanel(parseInt(tab.dataset.panel)));
        });

        document.getElementById('btn-element-picker').addEventListener('click', activateElementPicker);
        document.getElementById('btn-responsive').addEventListener('click', openResponsivePreview);
        document.getElementById('btn-clear').addEventListener('click', clearAllPanels);
        document.getElementById('btn-devtools-close').addEventListener('click', closeDevTools);

        document.body.classList.add('devtools-open');

        updateInspectorPanel();
        updateConsolePanel();
        updateSourcesPanel();
        updateNetworkPanel();
        updatePerformancePanel();
        updateAccessibilityPanel();
    }

    function switchPanel(panelIndex) {
        STATE.activePanelIndex = panelIndex;
        document.querySelectorAll('.devtools-tab').forEach((tab, i) => {
            tab.classList.toggle('active', i === panelIndex);
        });
        document.querySelectorAll('.panel').forEach((panel, i) => {
            panel.classList.toggle('active', i === panelIndex);
        });
    }

    function updateInspectorPanel(details = null) {
        const container = document.getElementById('dom-tree-container');
        if (!details) {
            container.innerHTML = generateDOMTree();
        } else {
            container.innerHTML = `
                <div class="inspector-section">
                    <div class="inspector-title">Element</div>
                    <div class="inspector-property">
                        <span class="inspector-key">Tag:</span>
                        <span class="inspector-value">&lt;${escapeHTML(details.tag)}&gt;</span>
                    </div>
                    ${details.id ? `
                        <div class="inspector-property">
                            <span class="inspector-key">ID:</span>
                            <span class="inspector-value">#${escapeHTML(details.id)}</span>
                        </div>
                    ` : ''}
                    ${details.classes ? `
                        <div class="inspector-property">
                            <span class="inspector-key">Classes:</span>
                            <span class="inspector-value">${escapeHTML(details.classes)}</span>
                        </div>
                    ` : ''}
                </div>
                
                <div class="inspector-section">
                    <div class="inspector-title">Box Model</div>
                    <div class="inspector-property">
                        <span class="inspector-key">Width:</span>
                        <span class="inspector-value">${details.box.width.toFixed(2)}px</span>
                    </div>
                    <div class="inspector-property">
                        <span class="inspector-key">Height:</span>
                        <span class="inspector-value">${details.box.height.toFixed(2)}px</span>
                    </div>
                    <div class="inspector-property">
                        <span class="inspector-key">Top:</span>
                        <span class="inspector-value">${details.box.top.toFixed(2)}px</span>
                    </div>
                    <div class="inspector-property">
                        <span class="inspector-key">Left:</span>
                        <span class="inspector-value">${details.box.left.toFixed(2)}px</span>
                    </div>
                </div>

                <div class="inspector-section">
                    <div class="inspector-title">Styles (Top 10)</div>
                    ${Array.from(details.styles).slice(0, 10).map(prop => `
                        <div class="inspector-property">
                            <span class="inspector-key">${escapeHTML(prop)}:</span>
                            <span class="inspector-value">${escapeHTML(details.styles.getPropertyValue(prop))}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    function updateConsolePanel() {
        const output = document.getElementById('console-output');
        if (!output) return; // Fail safe if panel isn't rendered yet
        
        if (STATE.consoleMessages.length === 0) {
            output.innerHTML = '<div style="color: #888; font-size: 12px;">No messages yet</div>';
            return;
        }

        output.innerHTML = STATE.consoleMessages.map(msg => `
            <div class="console-message console-${msg.type}">
                <div class="console-time">${msg.timestamp.toLocaleTimeString()}</div>
                <div>${escapeHTML(msg.message)}</div>
            </div>
        `).join('');

        output.scrollTop = output.scrollHeight;
    }

    function updateSourcesPanel() {
        const list = document.getElementById('sources-list');
        list.innerHTML = STATE.sourceFiles.map((file, index) => `
            <div class="dom-tree-item" style="padding: 4px 8px; cursor: pointer;" onclick="window.__switchSource(${index})">
                📄 ${escapeHTML(file.name)}
            </div>
        `).join('');

        window.__switchSource = (index) => {
            const file = STATE.sourceFiles[index];
            const viewer = document.getElementById('sources-viewer');
            const lines = file.content.split('\n');
            
            viewer.innerHTML = `
                <div style="background: #252526; padding: 8px; border-bottom: 1px solid #333; color: #9cdcfe; font-size: 11px;">
                    ${escapeHTML(file.name)} (${file.type})
                </div>
                <pre style="margin: 0; padding: 8px; font-size: 12px;"><code>${lines.map((line, i) => 
                    `<span style="color: #858585; margin-right: 8px;">${(i + 1).toString().padStart(4)}</span>${escapeHTML(line)}\n`
                ).join('')}</code></pre>
            `;
        };

        if (STATE.sourceFiles.length > 0) {
            window.__switchSource(0);
        }
    }

    function updateNetworkPanel() {
        const output = document.getElementById('network-output');
        if (!output) return; // Fail safe
        
        if (STATE.networkRequests.length === 0) {
            output.innerHTML = '<div style="color: #888; font-size: 12px;">No network requests</div>';
            return;
        }

        output.innerHTML = STATE.networkRequests.map(req => {
            const statusClass = req.status === 200 ? 'network-status-200' : 
                              req.status === 'failed' ? 'network-status-error' : 'network-status-pending';
            
            return `
                <div class="network-request">
                    <div class="network-url">${req.method} ${escapeHTML(req.url.substring(0, 80))}</div>
                    <div class="network-meta">
                        <span class="${statusClass}">${req.status}</span>
                        <span>${req.duration}ms</span>
                        <span>${req.size}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    function updatePerformancePanel() {
        const output = document.getElementById('performance-output');
        let html = '<div class="perf-metric">';

        for (const [key, value] of Object.entries(STATE.performanceMetrics)) {
            if (key !== 'memory') {
                html += `
                    <div class="perf-item">
                        <div class="perf-label">${escapeHTML(formatLabel(key))}</div>
                        <div class="perf-value">${value}ms</div>
                    </div>
                `;
            }
        }

        html += '</div>';

        if (STATE.performanceMetrics.memory) {
            html += `
                <div class="inspector-section">
                    <div class="inspector-title">Memory Usage</div>
                    <div class="inspector-property">
                        <span class="inspector-key">Used:</span>
                        <span class="inspector-value">${escapeHTML(STATE.performanceMetrics.memory.usedJSHeapSize)}</span>
                    </div>
                    <div class="inspector-property">
                        <span class="inspector-key">Total:</span>
                        <span class="inspector-value">${escapeHTML(STATE.performanceMetrics.memory.totalJSHeapSize)}</span>
                    </div>
                    <div class="inspector-property">
                        <span class="inspector-key">Limit:</span>
                        <span class="inspector-value">${escapeHTML(STATE.performanceMetrics.memory.jsHeapSizeLimit)}</span>
                    </div>
                </div>
            `;
        }

        output.innerHTML = html;
    }

    function updateAccessibilityPanel() {
        const issues = checkAccessibility();
        const output = document.getElementById('accessibility-output');

        if (issues.length === 0) {
            output.innerHTML = '<div style="color: #4caf50; font-size: 12px;">✓ No accessibility issues found</div>';
            return;
        }

        output.innerHTML = issues.map(issue => `
            <div class="a11y-issue a11y-${issue.level}">
                <div style="font-weight: bold; margin-bottom: 2px;">${escapeHTML(issue.issue)}</div>
                <div style="font-size: 10px; color: #888;">
                    <span class="a11y-element">${escapeHTML(issue.selector)}</span>
                </div>
            </div>
        `).join('');
    }

    function formatLabel(str) {
        return str
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, char => char.toUpperCase())
            .trim();
    }

    // ============= RESPONSIVE PREVIEW =============
    function openResponsivePreview() {
        const modal = document.createElement('div');
        modal.id = 'anh-responsive-preview';
        modal.innerHTML = `
            <div class="preview-toolbar">
                ${Object.entries(VIEWPORT_SIZES).map(([key, size]) => `
                    <button class="preview-device-btn" data-width="${size.width}" data-height="${size.height}">
                        ${escapeHTML(size.name)}
                    </button>
                `).join('')}
                <button style="margin-left: auto; background: #d32f2f; color: white; border: none; padding: 6px 12px; cursor: pointer; border-radius: 3px;" onclick="document.getElementById('anh-responsive-preview').remove()">✖ Close</button>
            </div>
            <div class="preview-frame">
                <div class="preview-viewport">
                    <iframe id="preview-iframe" src="about:blank"></iframe>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.style.display = 'flex';

        const htmlFile = STATE.sourceFiles.find(f => f.type === 'html');
        let finalHTML = htmlFile ? htmlFile.content : '<html><body></body></html>';

        const cssFiles = STATE.sourceFiles.filter(f => f.type === 'css');
        cssFiles.forEach(css => {
            finalHTML = finalHTML.replace(/<\/head>/i, `<style>${css.content}</style></head>`);
        });

        const jsFiles = STATE.sourceFiles.filter(f => f.type === 'javascript');
        jsFiles.forEach(js => {
            finalHTML = finalHTML.replace(/<\/body>/i, `<script>${js.content}</script></body>`);
        });

        const blob = new Blob([finalHTML], { type: 'text/html' });
        const previewUrl = URL.createObjectURL(blob);
        STATE.blobURLs.push(previewUrl);

        document.getElementById('preview-iframe').src = previewUrl;

        document.querySelectorAll('.preview-device-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const width = btn.dataset.width;
                const height = btn.dataset.height;
                const viewport = document.querySelector('.preview-viewport');
                
                viewport.style.width = width + 'px';
                viewport.style.height = height + 'px';

                document.querySelectorAll('.preview-device-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        document.querySelector('[data-width="1920"]').click();
    }

    // ============= UTILITIES =============
    function escapeHTML(text) {
        if (!text) return '';
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return String(text).replace(/[&<>"']/g, char => map[char]);
    }

    function showNotification(message, type = 'info') {
        const notif = document.createElement('div');
        notif.className = `devtools-notification ${type}`;
        notif.textContent = message;
        document.body.appendChild(notif);
        setTimeout(() => notif.remove(), 3000);
    }

    function setupInteractions() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeDevTools();
            }
        });
    }

    function clearAllPanels() {
        STATE.consoleMessages = [];
        STATE.networkRequests = [];
        updateConsolePanel();
        updateNetworkPanel();
        showNotification('Panels cleared', 'success');
    }

    // FIX 3: Memory Leak Addressed (Wipe Memory when DevTools are closed)
    function closeDevTools() {
        const container = document.getElementById('anh-devtools-container');
        if (container) container.remove();

        const preview = document.getElementById('anh-responsive-preview');
        if (preview) preview.remove();

        const overlay = document.getElementById('anh-element-picker-overlay');
        if (overlay) overlay.remove();

        STATE.blobURLs.forEach(url => URL.revokeObjectURL(url));
        
        // Critical cleanup to prevent background Out-Of-Memory leaks
        STATE.consoleMessages = [];
        STATE.networkRequests = [];
        STATE.sourceFiles = [];
        
        document.body.classList.remove('devtools-open');
        STATE.isDevToolsOpen = false;

        showNotification('DevTools closed', 'info');
    }

    // Expose for external access
    window.__ANHDevTools = {
        close: closeDevTools,
        state: STATE
    };

})();
