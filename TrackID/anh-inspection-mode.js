/**
 * FILE: anh-inspection-mode.js
 * ARCHITECT: Senior Browser Runtime Engineer & DevTools UI Systems Designer
 * VERSION: ANH Inspector Alpha (v2.0.0 - Production Safe)
 * ECOSYSTEM: Akshat Network Hub (ANH) Runtime Sandbox Integration Layer
 * NETWORKING: Strict Client-Side Sandbox (No Backend Dependencies, No Callbacks)
 */

(function () {
    'use strict';

    // ==================================================================
    // GLOBAL MANAGEMENT LAYER & TOKENS
    // ==================================================================
    const CONFIG = {
        panelId: 'anh-inspector-root-panel',
        stylesId: 'anh-inspector-embedded-styles',
        maxHighlightLength: 250000 // Prevents main-thread locks on massive DOMs
    };

    let activePanelInstance = null;
    let longPressTimer = null;
    let isSidebarDragging = false;
    let sidebarWidth = 260;

    // ==================================================================
    // INLINE SVG ICON LIBRARY (Removes CDN Dependency / Offline Safe)
    // ==================================================================
    const Icons = {
        terminal: `<svg width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path d="M6 9a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3A.5.5 0 0 1 6 9zM3.854 4.146a.5.5 0 1 0-.708.708L4.793 6.5 3.146 8.146a.5.5 0 1 0 .708.708l2-2a.5.5 0 0 0 0-.708l-2-2z"/><path d="M2 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2H2zm0 1h12a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z"/></svg>`,
        close: `<svg width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z"/></svg>`,
        html: `<svg width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"/><path fill-rule="evenodd" d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.207V5a.5.5 0 0 0 1 0v-4.5z"/></svg>`,
        js: `<svg width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path d="M3.1 4H2.2v5.1c0 1 .6 1.5 1.7 1.5h.3v-.8h-.2c-.5 0-.8-.2-.8-.7V4zm4.4 3.7c-.2-.1-.5-.2-.8-.2-.6 0-1 .3-1 .8 0 .5.3.7.8.9l.6.2c.4.1.6.3.6.6 0 .4-.3.7-.9.7-.5 0-.9-.2-1.1-.4v.9c.2.2.6.4 1.1.4.7 0 1.2-.3 1.2-.9 0-.6-.3-.8-.8-1l-.5-.2c-.3-.1-.5-.3-.5-.5 0-.3.2-.5.7-.5.4 0 .7.1.9.3v-.8z"/></svg>`,
        css: `<svg width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path d="M1 2.828c.885-.37 2.154-.769 3.388-.893 1.33-.134 2.458.063 3.112.752v9.746c-.935-.53-2.12-.603-3.213-.493-1.18.12-2.312.556-3.287 1.054V2.828zm13.5 10.206c-1.01-.518-2.22-.954-3.486-1.082-1.09-.11-2.278.026-3.213.562V2.687c.654-.689 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v10.206z"/></svg>`,
        json: `<svg width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path d="M4 0h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2zm0 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H4z"/></svg>`,
        shield: `<svg width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path d="M5.338 1.59a61.44 61.44 0 0 0-2.837.856.481.481 0 0 0-.328.39c-.554 4.157.726 7.19 2.253 9.188a10.725 10.725 0 0 0 2.287 2.233c.346.244.652.42.893.533.12.057.218.095.293.118a.55.55 0 0 0 .101.025.615.615 0 0 0 .1-.025c.076-.023.174-.061.294-.118.24-.113.547-.29.893-.533a10.726 10.726 0 0 0 2.287-2.233c1.527-1.997 2.807-5.031 2.253-9.188a.48.48 0 0 0-.328-.39c-.651-.213-1.75-.56-2.837-.855C9.552 1.29 8.531 1.067 8 1.067c-.53 0-1.552.223-2.662.524zM5.072.56C6.157.265 7.31 0 8 0s1.843.265 2.928.56c1.11.3 2.229.655 2.887.87a1.54 1.54 0 0 1 1.044 1.262c.596 4.477-.787 7.795-2.465 9.99a11.775 11.775 0 0 1-2.517 2.453 7.159 7.159 0 0 1-1.048.625c-.28.132-.581.24-.829.24s-.548-.108-.829-.24a7.158 7.158 0 0 1-1.048-.625 11.777 11.777 0 0 1-2.517-2.453C1.928 10.487.545 7.169 1.141 2.692A1.54 1.54 0 0 1 2.185 1.43 62.456 62.456 0 0 1 5.072.56z"/></svg>`,
        link: `<svg width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path d="M4.715 6.542 3.343 7.914a3 3 0 1 0 4.243 4.243l1.828-1.829A3 3 0 0 0 8.586 5.5L8 6.086a1.002 1.002 0 0 0-.154.199 2 2 0 0 1 .861 3.337L6.88 11.45a2 2 0 1 1-2.83-2.83l.793-.792a4.018 4.018 0 0 1-.128-1.287z"/><path d="M6.586 4.672A3 3 0 0 0 7.414 9.5l.775-.776a2 2 0 0 1-.896-3.346L9.12 3.55a2 2 0 1 1 2.83 2.83l-.793.792c.112.42.155.855.128 1.287l1.372-1.372a3 3 0 1 0-4.243-4.243L6.586 4.672z"/></svg>`,
        copy: `<svg width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H6zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1H2z"/></svg>`,
        download: `<svg width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/><path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/></svg>`,
        search: `<svg width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/></svg>`,
        seo: `<svg width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path d="M8 4a.5.5 0 0 1 .5.5V6a.5.5 0 0 1-1 0V4.5A.5.5 0 0 1 8 4zM3.732 5.732a.5.5 0 0 1 .707 0l.915.914a.5.5 0 1 1-.708.708l-.914-.915a.5.5 0 0 1 0-.707zM2 10a.5.5 0 0 1 .5-.5h1.586a.5.5 0 0 1 0 1H2.5A.5.5 0 0 1 2 10zm9.5 0a.5.5 0 0 1 .5-.5h1.5a.5.5 0 0 1 0 1H12a.5.5 0 0 1-.5-.5zm.754-4.246a.389.389 0 0 0-.527-.02L7.547 9.31a.91.91 0 1 0 1.302 1.258l3.434-4.297a.389.389 0 0 0-.029-.518z"/></svg>`,
        addBookmark: `<svg width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.74.439L8 13.069l-5.26 2.87A.5.5 0 0 1 2 15.5V2zm6.5 3a.5.5 0 0 0-1 0v2H5.5a.5.5 0 0 0 0 1H7v2a.5.5 0 0 0 1 0V8h1.5a.5.5 0 0 0 0-1H8V5z"/></svg>`,
        bookmarks: `<svg width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path d="M2 4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v11.5a.5.5 0 0 1-.777.416L7 13.101l-4.223 2.815A.5.5 0 0 1 2 15.5V4zm2-1a1 1 0 0 0-1 1v10.566l3.723-2.482a.5.5 0 0 1 .554 0L11 14.566V4a1 1 0 0 0-1-1H4z"/></svg>`
    };

    // ==================================================================
    // CROSS-PANEL ORCHESTRATION INTERFACE
    // ==================================================================
    const PanelOrchestrator = {
        dismissCompetitors() {
            // Unmount sibling framework panels safely
            const seoPanel = document.getElementById('anh-seo-auditor-panel');
            if (seoPanel) seoPanel.remove();

            const bookmarkDashboard = document.getElementById('anh-bookmark-dashboard');
            if (bookmarkDashboard) bookmarkDashboard.remove();

            const existingInspector = document.getElementById(CONFIG.panelId);
            if (existingInspector) {
                existingInspector.remove();
                activePanelInstance = null;
                return true; 
            }
            return false;
        }
    };

    // ==================================================================
    // SYNTAX HIGHLIGHTING ENGINE (PERFORMANCE OPTIMIZED)
    // ==================================================================
    const SyntaxEngine = {
        escape(str) {
            return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        },
        highlightHTML(rawCode) {
            if (rawCode.length > CONFIG.maxHighlightLength) return this.escape(rawCode); // Prevent Main Thread Lock
            let code = this.escape(rawCode);
            code = code.replace(/(&lt;\/?[a-zA-Z1-6]+.*?(?:&gt;|\b))/g, '<span style="color:#f43f5e;">$1</span>');
            code = code.replace(/(\s[a-zA-Z-]+)=&quot;/g, ' <span style="color:#fb923c;">$1</span>=&quot;');
            code = code.replace(/(&quot;.*?&quot;)/g, '<span style="color:#10b981;">$1</span>');
            code = code.replace(/(&lt;!--.*?--&gt;)/g, '<span style="color:#4b5563; font-style:italic;">$1</span>');
            return code;
        },
        highlightJS(rawCode) {
            if (rawCode.length > CONFIG.maxHighlightLength) return this.escape(rawCode);
            let code = this.escape(rawCode);
            const keywords = /\b(const|let|var|function|return|if|else|for|while|switch|case|break|class|export|import|async|await|try|catch|new|window|document)\b/g;
            code = code.replace(keywords, '<span style="color:#38bdf8; font-weight:bold;">$1</span>');
            code = code.replace(/(\/\/.*)/g, '<span style="color:#4b5563; font-style:italic;">$1</span>');
            code = code.replace(/(&quot;.*?&quot;|'.*?'|`.*?`)/g, '<span style="color:#10b981;">$1</span>');
            return code;
        },
        highlightCSS(rawCode) {
            if (rawCode.length > CONFIG.maxHighlightLength) return this.escape(rawCode);
            let code = this.escape(rawCode);
            code = code.replace(/([a-zA-Z0-9_-]+)\s*\{/g, '<span style="color:#f43f5e;">$1</span> {');
            code = code.replace(/([a-zA-Z-]+)\s*:/g, '<span style="color:#38bdf8;">$1</span>:');
            code = code.replace(/:\s*([^;]+);/g, ': <span style="color:#10b981;">$1</span>;');
            return code;
        },
        highlightJSON(rawCode) {
            if (rawCode.length > CONFIG.maxHighlightLength) return this.escape(rawCode);
            let code = this.escape(rawCode);
            code = code.replace(/(&quot;[^&]+&quot;)(?=\s*:)/g, '<span style="color:#a855f7; font-weight:600;">$1</span>');
            code = code.replace(/(:\s*)(&quot;.*?&quot;|true|false|null|\d+)/g, '$1<span style="color:#10b981;">$2</span>');
            return code;
        }
    };

    // ==================================================================
    // CACHED ASSET EXTRACTOR 
    // ==================================================================
    const AssetExtractor = {
        cache: null,
        buildCache() {
            this.cache = {
                inlineScripts: Array.from(document.querySelectorAll('script:not([src])')).map((s, idx) => ({
                    name: `Inline Script [${idx + 1}]`, type: 'js', content: s.textContent
                })),
                externalScripts: Array.from(document.querySelectorAll('script[src]')).map(s => ({
                    name: s.getAttribute('src'), type: 'html', content: `\n<script src="${s.getAttribute('src')}"></script>`
                })),
                stylesheets: Array.from(document.querySelectorAll('style, link[rel="stylesheet"]')).map((s, idx) => ({
                    name: s.tagName === 'STYLE' ? `Inline Style Block [${idx + 1}]` : (s.getAttribute('href') || 'External Style'),
                    type: 'css', content: s.textContent || `/* External Link: ${s.getAttribute('href')} */`
                })),
                jsonLd: Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map((s, idx) => ({
                    name: `JSON-LD Structured Object [${idx + 1}]`, type: 'json', content: s.textContent
                }))
            };
            
            const scripto = document.querySelector('script.Scripto');
            this.cache.scripto = scripto ? [{
                name: 'Scripto Security Identity Context Block', type: 'js', content: `// Active Authorized Access Token Meta Frame Data\n${scripto.textContent}`
            }] : [];
        },
        get(key) {
            if (!this.cache) this.buildCache();
            return this.cache[key] || [];
        }
    };

    // ==================================================================
    // RUNTIME PRESENTATION STYLES ARCHITECTURE
    // ==================================================================
    const StylePipeline = {
        inject() {
            if (document.getElementById(CONFIG.stylesId)) return;
            const style = document.createElement('style');
            style.id = CONFIG.stylesId;
            style.textContent = `
                .anh-i-frame {
                    position: fixed; bottom: 0; left: 0; width: 100vw; height: 50vh;
                    background: #090d16; color: #e2e8f0; z-index: 100000;
                    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                    display: flex; flex-direction: column; border-top: 2px solid #1e293b;
                    box-shadow: 0 -10px 25px -5px rgba(0, 0, 0, 0.4); box-sizing: border-box;
                    animation: anhInspectorSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .anh-i-topbar {
                    background: #111729; border-bottom: 1px solid #1e293b; padding: 8px 16px;
                    display: flex; justify-content: space-between; align-items: center; user-select: none;
                }
                .anh-i-core { display: flex; flex: 1; overflow: hidden; position: relative; }
                .anh-i-sidebar {
                    background: #0d1324; border-right: 1px solid #1e293b; display: flex;
                    flex-direction: column; overflow-y: auto; overflow-x: hidden; user-select: none;
                }
                .anh-i-sidebar-header {
                    padding: 10px 14px; font-size: 11px; font-weight: bold; color: #475569;
                    text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #1e293b;
                }
                .anh-i-nav-node {
                    padding: 8px 14px; font-size: 12px; cursor: pointer; display: flex;
                    align-items: center; gap: 10px; color: #94a3b8; transition: all 0.15s;
                    text-overflow: ellipsis; white-space: nowrap; overflow: hidden;
                }
                .anh-i-nav-node:hover, .anh-i-nav-node.active { background: #172033; color: #38bdf8; }
                .anh-i-workspace { flex: 1; display: flex; flex-direction: column; background: #090d16; overflow: hidden; }
                .anh-i-viewer-header {
                    padding: 6px 16px; background: #111729; border-bottom: 1px solid #1e293b;
                    display: flex; justify-content: space-between; align-items: center;
                }
                .anh-i-viewer-actions { display: flex; gap: 8px; align-items: center; }
                .anh-i-btn {
                    background: #1e293b; border: none; color: #cbd5e1; padding: 4px 10px;
                    border-radius: 4px; font-size: 11px; cursor: pointer; display: flex; align-items: center; gap: 6px;
                }
                .anh-i-btn:hover { background: #334155; color: #ffffff; }
                .anh-i-code-container { flex: 1; display: flex; overflow: hidden; position: relative; }
                .anh-i-linenos {
                    padding: 12px 8px; background: #0d1324; text-align: right; color: #475569;
                    font-size: 12px; border-right: 1px solid #1e293b; min-width: 30px; user-select: none;
                    overflow: hidden; line-height: 1.5;
                }
                .anh-i-code-scroller { flex: 1; overflow: auto; padding: 12px; margin: 0; line-height: 1.5; font-size: 12px; white-space: pre; }
                .anh-i-statusbar {
                    padding: 4px 16px; background: #111729; border-top: 1px solid #1e293b;
                    display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #64748b;
                }
                .anh-i-splitter { width: 4px; cursor: col-resize; background: transparent; transition: background 0.2s; }
                .anh-i-splitter:hover { background: #38bdf8; }
                .anh-i-cmenu {
                    position: fixed; background: #111729; border: 1px solid #1e293b; border-radius: 8px;
                    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); width: 220px; z-index: 110000;
                    padding: 4px 0; font-family: system-ui, sans-serif; box-sizing: border-box;
                }
                .anh-i-cmenu-item {
                    padding: 8px 14px; font-size: 12.5px; color: #94a3b8; cursor: pointer;
                    display: flex; align-items: center; gap: 10px; transition: background 0.15s;
                }
                .anh-i-cmenu-item:hover { background: #172033; color: #38bdf8; }
                @keyframes anhInspectorSlideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
            `;
            document.head.appendChild(style);
        }
    };

    // ==================================================================
    // INSPECTION WORKSPACE RENDER VISUAL ARCHITECTURE INTERFACE
    // ==================================================================
    const InspectorDashboardUI = {
        activeNode: null,
        activeFileRecord: { name: 'Live DOM Source', type: 'html', content: '' },
        dragState: { onMouseMove: null, onMouseUp: null },

        open() {
            if (PanelOrchestrator.dismissCompetitors()) return;
            StylePipeline.inject();
            AssetExtractor.buildCache();

            this.activeNode = document.createElement('div');
            this.activeNode.id = CONFIG.panelId;
            this.activeNode.className = 'anh-i-frame';

            document.body.appendChild(this.activeNode);
            activePanelInstance = this.activeNode;

            this.activeFileRecord.content = document.documentElement.outerHTML;
            this.renderLayoutStructure();
            this.bindStaticEvents(); 
            this.bindWorkspaceSpecificLoops();
        },

        close() {
            if (this.activeNode) {
                this.activeNode.remove();
                this.activeNode = null;
                activePanelInstance = null;
            }
        },

        renderLayoutStructure() {
            if (!this.activeNode) return;

            this.activeNode.innerHTML = `
                <div class="anh-i-topbar">
                    <div style="display:flex; align-items:center; gap:10px; font-size:13px; font-weight:bold; letter-spacing:0.5px;">
                        ${Icons.terminal}
                        <span>ANH Inspector Alpha</span>
                        <span style="font-size:10px; background:#1e293b; padding:1px 6px; border-radius:4px; color:#64748b; font-weight:normal;">v2.0.0</span>
                    </div>
                    <div style="display:flex; gap:12px; align-items:center;">
                        <span id="anh-i-master-close" style="cursor:pointer; color:#475569;">${Icons.close}</span>
                    </div>
                </div>

                <div class="anh-i-core">
                    <div class="anh-i-sidebar" style="width: ${sidebarWidth}px;" id="anh-i-panel-sidebar">
                        <div class="anh-i-sidebar-header">Core Inspector Document Map</div>
                        <div class="anh-i-nav-node active" data-source-type="dom">
                            <span style="color:#f43f5e;">${Icons.html}</span> Live DOM Source
                        </div>
                        
                        <div class="anh-i-sidebar-header">Inline Document Blocks</div>
                        ${this.generateNavItemsMarkup(AssetExtractor.get('inlineScripts'), 'inline-js', Icons.js, '#38bdf8')}
                        ${this.generateNavItemsMarkup(AssetExtractor.get('stylesheets'), 'css', Icons.css, '#fb923c')}
                        
                        <div class="anh-i-sidebar-header">Ecosystem Security & Schemas</div>
                        ${this.generateNavItemsMarkup(AssetExtractor.get('scripto'), 'scripto', Icons.shield, '#10b981')}
                        ${this.generateNavItemsMarkup(AssetExtractor.get('jsonLd'), 'jsonld', Icons.json, '#a855f7')}
                        
                        <div class="anh-i-sidebar-header">External Linked Scripts</div>
                        ${this.generateNavItemsMarkup(AssetExtractor.get('externalScripts'), 'ext-js', Icons.link, '#64748b')}
                    </div>

                    <div class="anh-i-splitter" id="anh-i-panel-splitter"></div>

                    <div class="anh-i-workspace" id="anh-i-workspace-area">
                        ${this.generateWorkspaceTemplateRows()}
                    </div>
                </div>

                <div class="anh-i-statusbar">
                    <div id="anh-i-status-file">File: ${this.activeFileRecord.name}</div>
                    <div style="display:flex; gap:16px;" id="anh-i-status-metrics"></div>
                </div>
            `;
            this.recalculateStatusBarMetrics();
        },

        generateNavItemsMarkup(recordList, groupKey, iconSvg, color) {
            return recordList.map((item, index) => `
                <div class="anh-i-nav-node" data-group="${groupKey}" data-index="${index}" title="${item.name}">
                    <span style="color:${color}; display:flex;">${iconSvg}</span> ${item.name}
                </div>
            `).join('');
        },

        generateWorkspaceTemplateRows() {
            let highlightedCode = '';
            const raw = this.activeFileRecord.content;

            if (this.activeFileRecord.type === 'html') highlightedCode = SyntaxEngine.highlightHTML(raw);
            else if (this.activeFileRecord.type === 'css') highlightedCode = SyntaxEngine.highlightCSS(raw);
            else if (this.activeFileRecord.type === 'js') highlightedCode = SyntaxEngine.highlightJS(raw);
            else if (this.activeFileRecord.type === 'json') highlightedCode = SyntaxEngine.highlightJSON(raw);

            const linesCount = raw.split('\n').length;
            let lineNumbersMarkup = '';
            for (let i = 1; i <= linesCount; i++) {
                lineNumbersMarkup += `${i}<br>`;
            }

            return `
                <div class="anh-i-viewer-header">
                    <div style="font-size:12px; color:#38bdf8; font-weight:bold;">Source View Layer</div>
                    <div class="anh-i-viewer-actions">
                        <div style="position:relative; display:flex; align-items:center;">
                            <input type="text" id="anh-i-search-code" placeholder="Find sequence..." style="background:#1e293b; border:1px solid #334155; padding:3px 8px; border-radius:4px; font-size:11px; color:white; width:140px;">
                        </div>
                        <button class="anh-i-btn" id="anh-i-action-copy">${Icons.copy} Copy</button>
                        <button class="anh-i-btn" id="anh-i-action-dl">${Icons.download} Export</button>
                    </div>
                </div>
                <div class="anh-i-code-container">
                    <div class="anh-i-linenos">${lineNumbersMarkup}</div>
                    <pre class="anh-i-code-scroller" id="anh-i-code-render-block"><code>${highlightedCode}</code></pre>
                </div>
            `;
        },

        recalculateStatusBarMetrics() {
            const raw = this.activeFileRecord.content;
            const lines = raw.split('\n').length;
            const words = raw.trim().split(/\s+/).filter(Boolean).length;
            const chars = raw.length;

            document.getElementById('anh-i-status-metrics').innerHTML = `
                <span>Lines: ${lines}</span>
                <span>Words: ${words}</span>
                <span>Chars: ${chars}</span>
            `;
        },

        bindStaticEvents() {
            document.getElementById('anh-i-master-close').addEventListener('click', () => this.close());

            const splitter = document.getElementById('anh-i-panel-splitter');
            const sidebar = document.getElementById('anh-i-panel-sidebar');
            
            this.dragState.onMouseMove = (moveEvent) => {
                if (!isSidebarDragging) return;
                let targetWidth = moveEvent.clientX;
                if (targetWidth > 120 && targetWidth < 500) {
                    sidebarWidth = targetWidth;
                    sidebar.style.width = `${sidebarWidth}px`;
                }
            };

            this.dragState.onMouseUp = () => {
                isSidebarDragging = false;
                document.removeEventListener('mousemove', this.dragState.onMouseMove);
                document.removeEventListener('mouseup', this.dragState.onMouseUp);
            };

            splitter.addEventListener('mousedown', () => {
                isSidebarDragging = true;
                document.addEventListener('mousemove', this.dragState.onMouseMove);
                document.addEventListener('mouseup', this.dragState.onMouseUp);
            });

            this.activeNode.addEventListener('click', (e) => {
                const node = e.target.closest('.anh-i-nav-node');
                if (!node) return;

                this.activeNode.querySelectorAll('.anh-i-nav-node').forEach(n => n.classList.remove('active'));
                node.classList.add('active');

                const group = node.getAttribute('data-group');
                const index = parseInt(node.getAttribute('data-index'));

                if (node.getAttribute('data-source-type') === 'dom') {
                    this.activeFileRecord = { name: 'Live DOM Source', type: 'html', content: document.documentElement.outerHTML };
                } else if (group === 'inline-js') {
                    const target = AssetExtractor.get('inlineScripts')[index];
                    this.activeFileRecord = { name: target.name, type: 'js', content: target.content };
                } else if (group === 'css') {
                    const target = AssetExtractor.get('stylesheets')[index];
                    this.activeFileRecord = { name: target.name, type: 'css', content: target.content };
                } else if (group === 'scripto') {
                    const target = AssetExtractor.get('scripto')[index];
                    this.activeFileRecord = { name: target.name, type: 'js', content: target.content };
                } else if (group === 'jsonld') {
                    const target = AssetExtractor.get('jsonLd')[index];
                    this.activeFileRecord = { name: target.name, type: 'json', content: target.content };
                } else if (group === 'ext-js') {
                    const target = AssetExtractor.get('externalScripts')[index];
                    this.activeFileRecord = { name: target.name, type: 'html', content: target.content };
                }

                this.refreshWorkspaceView();
            });
        },

        bindWorkspaceSpecificLoops() {
            const searchInput = document.getElementById('anh-i-search-code');
            const renderBlock = document.getElementById('anh-i-code-render-block');
            const originalHTML = renderBlock.innerHTML; 
            let debounceTimer;

            searchInput.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    const query = e.target.value.trim().toLowerCase();
                    if (!query) {
                        renderBlock.innerHTML = originalHTML;
                        return;
                    }
                    const escapedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                    const regex = new RegExp(`(?![^<]*>)(>?[^<]+)?(${escapedQuery})`, 'gi');
                    renderBlock.innerHTML = originalHTML.replace(regex, (match, p1, p2) => {
                         if (!p2) return match;
                         return match.replace(new RegExp(`(${escapedQuery})`, 'i'), '<mark style="background:#f59e0b; color:#000000; border-radius:2px;">$1</mark>');
                    });
                }, 300);
            });

            document.getElementById('anh-i-action-copy').addEventListener('click', async (e) => {
                const btn = e.currentTarget;
                try {
                    await navigator.clipboard.writeText(this.activeFileRecord.content);
                    btn.innerHTML = `${Icons.shield} Copied!`;
                } catch (err) {
                    btn.innerHTML = `Failed`;
                }
                setTimeout(() => btn.innerHTML = `${Icons.copy} Copy`, 1500);
            });

            document.getElementById('anh-i-action-dl').addEventListener('click', () => {
                const blob = new Blob([this.activeFileRecord.content], { type: 'text/plain' });
                const dUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = dUrl;
                a.download = this.activeFileRecord.name.toLowerCase().replace(/\s+/g, '-') + `.${this.activeFileRecord.type}`;
                a.click();
                URL.revokeObjectURL(dUrl);
            });
        },

        refreshWorkspaceView() {
            const workspace = document.getElementById('anh-i-workspace-area');
            workspace.innerHTML = this.generateWorkspaceTemplateRows();
            document.getElementById('anh-i-status-file').textContent = `File: ${this.activeFileRecord.name}`;
            this.recalculateStatusBarMetrics();
            this.bindWorkspaceSpecificLoops(); 
        }
    };

    // ==================================================================
    // CUSTOM CONTROLLER CONTEXT MENU PLATFORM ENGINE
    // ==================================================================
    const CustomContextMenuEngine = {
        menuElement: null,

        renderMenu(x, y) {
            this.dismiss();

            this.menuElement = document.createElement('div');
            this.menuElement.className = 'anh-i-cmenu';
            
            // Boundary Clamping to prevent overflow
            const safeX = Math.min(x, window.innerWidth - 230);
            const safeY = Math.min(y, window.innerHeight - 180);
            
            this.menuElement.style.left = `${safeX}px`;
            this.menuElement.style.top = `${safeY}px`;

            this.menuElement.innerHTML = `
                <div class="anh-i-cmenu-item" id="anh-cm-inspect">${Icons.search} Inspect Source Element</div>
                <div class="anh-i-cmenu-item" id="anh-cm-seo">${Icons.seo} View Runtime SEO Score</div>
                <div class="anh-i-cmenu-item" id="anh-cm-add-b">${Icons.addBookmark} Add Link to Index Bookmark</div>
                <div class="anh-i-cmenu-item" id="anh-cm-open-b">${Icons.bookmarks} View Bookmark Pages</div>
            `;

            document.body.appendChild(this.menuElement);
            this.bindMenuActions();
        },

        dismiss() {
            if (this.menuElement) {
                this.menuElement.remove();
                this.menuElement = null;
            }
        },

        bindMenuActions() {
            document.getElementById('anh-cm-inspect').addEventListener('click', () => {
                this.dismiss();
                InspectorDashboardUI.open();
            });
            document.getElementById('anh-cm-seo').addEventListener('click', () => {
                this.dismiss();
                if (window.ANH_SEO && typeof window.ANH_SEO.openPanel === 'function') {
                    window.ANH_SEO.openPanel();
                } else {
                    console.warn("ANH_SEO API unavailable. Ensure seo-runtime-auditor is loaded.");
                }
            });
            document.getElementById('anh-cm-add-b').addEventListener('click', () => {
                this.dismiss();
                if (window.ANH_BOOKMARK && typeof window.ANH_BOOKMARK.addCurrent === 'function') {
                    window.ANH_BOOKMARK.addCurrent();
                } else {
                    console.warn("ANH_BOOKMARK API unavailable. Ensure smart-bookmark-intelligence is loaded.");
                }
            });
            document.getElementById('anh-cm-open-b').addEventListener('click', () => {
                this.dismiss();
                if (window.ANH_BOOKMARK && typeof window.ANH_BOOKMARK.open === 'function') {
                    window.ANH_BOOKMARK.open();
                } else {
                    console.warn("ANH_BOOKMARK API unavailable.");
                }
            });
        }
    };

    // ==================================================================
    // CAPTURE ENGINES TIMING DECOUPLING MULTI GESTURES SHORTCUTS
    // ==================================================================
    const InstrumentationCoordinator = {
        init() {
            window.addEventListener('keydown', (e) => {
                if (e.ctrlKey && (e.key === 'I' || e.key === 'i')) {
                    e.preventDefault();
                    InspectorDashboardUI.open();
                }
            });

            window.addEventListener('contextmenu', (e) => {
                if (activePanelInstance && activePanelInstance.contains(e.target)) return;
                e.preventDefault();
                CustomContextMenuEngine.renderMenu(e.clientX, e.clientY);
            });

            window.addEventListener('click', (e) => {
                if (CustomContextMenuEngine.menuElement && !CustomContextMenuEngine.menuElement.contains(e.target)) {
                    CustomContextMenuEngine.dismiss();
                }
            });

            window.addEventListener('touchstart', (e) => {
                if (e.touches.length === 2) {
                    e.preventDefault();
                    InspectorDashboardUI.open();
                }

                if (e.touches.length === 1) {
                    const touch = e.touches[0];
                    longPressTimer = setTimeout(() => {
                        CustomContextMenuEngine.renderMenu(touch.clientX, touch.clientY);
                    }, 800); 
                }
            }, { passive: false });

            window.addEventListener('touchend', () => {
                if (longPressTimer) clearTimeout(longPressTimer);
            });
            window.addEventListener('touchmove', () => {
                if (longPressTimer) clearTimeout(longPressTimer);
            });
            window.addEventListener('touchcancel', () => {
                if (longPressTimer) clearTimeout(longPressTimer);
            });
        }
    };

    document.addEventListener('DOMContentLoaded', () => {
        InstrumentationCoordinator.init();
    });

})();
