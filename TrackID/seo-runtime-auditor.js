/**
 * © Akshat Network Hub
 * FILE: seo-runtime-auditor.js
 * RESPONSIBILITY: Production-Ready Runtime SEO Auditing Engine with Alpha Vault Integration
 * ECOSYSTEM: Akshat Network Hub (ANH) / GitHub Pages Static Deployment
 * NETWORKING: Read-Only Vault Sync (No Third-Party Analytics / Exclusively Client-Side)
 * TRIGGER: Automatic (Once Daily via LocalStorage Tracking) or Manual (Shift + R Shortcut)
 */

(function () {
    'use strict';

    // Global Architectural Configurations
    const CONFIG = {
        vaultUrl: "https://akshat-145609.github.io/ValidationSystem/vault/alpha-vault.json",
        storageKey: "anh_seo_audit_cache",
        maxScore: 100,
        factorCount: 25,
        maxPerFactor: 4
    };

    // --- INTERNAL COOKIE AND HELPER UTILITIES ---
    const Helper = {
        normalizeUrl(url) {
            try {
                let u = new URL(url);
                return u.origin + u.pathname.replace(/\/$/, "");
            } catch {
                return url;
            }
        },
        getMetaContent(selector, attribute = "content") {
            const element = document.querySelector(selector);
            return element ? element.getAttribute(attribute) || "" : "";
        }
    };

    // ==================================================================
    // ENGINE STATE MANAGEMENT & STORAGE CORE
    // ==================================================================
    const AuditStorage = {
        getCache() {
            try {
                const data = localStorage.getItem(CONFIG.storageKey);
                return data ? JSON.parse(data) : null;
            } catch (e) {
                console.error("[SEO Auditor Cache Read Error]", e);
                return null;
            }
        },
        setCache(score, report, negativeLogs) {
            try {
                const cacheData = {
                    timestamp: Date.now(),
                    dateString: new Date().toDateString(),
                    score: score,
                    report: report,
                    negativeLogs: negativeLogs
                };
                localStorage.setItem(CONFIG.storageKey, JSON.stringify(cacheData));
            } catch (e) {
                console.error("[SEO Auditor Cache Write Error]", e);
            }
        },
        shouldRunAutoAudit() {
            const cache = this.getCache();
            if (!cache) return true;
            const today = new Date().toDateString();
            return cache.dateString !== today;
        }
    };

    // ==================================================================
    // CORE CORE AUDITOR MATRIX ENGINE
    // ==================================================================
    const SeoAuditorEngine = {
        report: [],
        negativeLogs: [],
        score: 0,

        resetMetrics() {
            this.report = [];
            this.negativeLogs = [];
            this.score = 0;
        },

        evaluateFactor(category, name, value, criteriaText, scoreValue) {
            this.score += scoreValue;
            this.report.push({
                category: category,
                name: name,
                value: value,
                criteria: criteriaText,
                score: scoreValue
            });
        },

        logNegativeImpact(name, penalty, message) {
            this.score += penalty; // Penalty is passed as negative number
            this.negativeLogs.push({
                name: name,
                penalty: penalty,
                message: message
            });
        },

        async executePipeline() {
            this.resetMetrics();

            // -----------------------------------------------------------
            // CATEGORY A: Metadata Factors
            // -----------------------------------------------------------
            // 1. Title Tag
            const titleTag = document.title;
            let titleScore = 0;
            if (titleTag) {
                titleScore = titleTag.length >= 30 && titleTag.length <= 60 ? 4 : 2;
            }
            this.evaluateFactor("Metadata", "Title Tag", titleTag || "Missing", "Length checks (30-60 characters)", titleScore);

            // 2. Meta Description
            const metaDesc = Helper.getMetaContent("meta[name='description']");
            let descScore = 0;
            if (metaDesc) {
                descScore = metaDesc.length >= 120 && metaDesc.length <= 160 ? 4 : 2;
            } else {
                this.logNegativeImpact("Missing Meta Description", -4, "Meta description missing entirely inside head document scope.");
            }
            this.evaluateFactor("Metadata", "Meta Description", metaDesc || "Missing", "Length checks (120-160 characters)", descScore);

            // 3. Canonical Target Link
            const canonicalEl = document.querySelector("link[rel='canonical']");
            const canonicalHref = canonicalEl ? canonicalEl.getAttribute("href") || "" : "";
            if (!canonicalHref) {
                this.logNegativeImpact("Missing Canonical", -3, "No link element with rel='canonical' present on current page template.");
            }
            this.evaluateFactor("Metadata", "Canonical", canonicalHref || "Missing", "Canonical link element structural verification", canonicalHref ? 4 : 0);

            // 4. Robots Directives
            const robots = Helper.getMetaContent("meta[name='robots']");
            this.evaluateFactor("Metadata", "Robots", robots || "Missing", "Presence of meta robots search optimization instructions", robots ? 4 : 1);

            // 5. Viewport Strategy Configuration
            const viewport = Helper.getMetaContent("meta[name='viewport']");
            this.evaluateFactor("Metadata", "Viewport", viewport || "Missing", "Responsive baseline scale accessibility declaration checks", viewport ? 4 : 0);

            // 6. Theme Color Attribute Mapping
            const themeColor = Helper.getMetaContent("meta[name='theme-color']");
            this.evaluateFactor("Metadata", "Theme Color", themeColor || "Missing", "Mobile viewport browser context layout styling declaration", themeColor ? 4 : 0);

            // 7. Author Metadata Profile
            const author = Helper.getMetaContent("meta[name='author']");
            this.evaluateFactor("Metadata", "Author", author || "Missing", "Content ownership signature declaration string", author ? 4 : 0);

            // 8. Keywords Optimization Mapping
            const keywords = Helper.getMetaContent("meta[name='keywords']");
            this.evaluateFactor("Metadata", "Keywords", keywords || "Missing", "Legacy crawl token optimization matrix values mapping", keywords ? 4 : 0);

            // -----------------------------------------------------------
            // CATEGORY B: Open Graph Data Integrity Matrix
            // -----------------------------------------------------------
            const ogTitle = Helper.getMetaContent("meta[property='og:title']");
            this.evaluateFactor("Open Graph", "og:title", ogTitle || "Missing", "Social graph card mapping verification parameters", ogTitle ? 4 : 0);

            const ogDesc = Helper.getMetaContent("meta[property='og:description']");
            this.evaluateFactor("Open Graph", "og:description", ogDesc || "Missing", "Social snippet abstract optimization parameters tracking", ogDesc ? 4 : 0);

            const ogImg = Helper.getMetaContent("meta[property='og:image']");
            this.evaluateFactor("Open Graph", "og:image", ogImg || "Missing", "Visual assets asset payload reference string", ogImg ? 4 : 0);

            const ogUrl = Helper.getMetaContent("meta[property='og:url']");
            this.evaluateFactor("Open Graph", "og:url", ogUrl || "Missing", "Canonical context mapping within shared target nodes", ogUrl ? 4 : 0);

            const ogType = Helper.getMetaContent("meta[property='og:type']");
            this.evaluateFactor("Open Graph", "og:type", ogType || "Missing", "Semantic entity description wrapper values data mapping", ogType ? 4 : 0);

            // Meta Mismatch Logic verification criteria verification logic checks
            if (ogTitle && titleTag && ogTitle !== titleTag) {
                this.logNegativeImpact("Meta Mismatch", -5, "The document title and Open Graph title tag do not match.");
            }

            // -----------------------------------------------------------
            // CATEGORY C: Structured Data Analysis Pipeline
            // -----------------------------------------------------------
            const jsonLdScripts = Array.from(document.querySelectorAll("script[type='application/ld+json']"));
            let hasJsonLd = jsonLdScripts.length > 0;
            let validSchemaType = false;
            let hasOrgSchema = false;
            let hasBreadcrumb = false;

            jsonLdScripts.forEach(script => {
                try {
                    const parsed = JSON.parse(script.textContent);
                    if (parsed && parsed["@type"]) {
                        validSchemaType = true;
                    }
                    const stringified = JSON.stringify(parsed);
                    if (stringified.toLowerCase().includes("organization")) hasOrgSchema = true;
                    if (stringified.toLowerCase().includes("breadcrumb")) hasBreadcrumb = true;
                } catch {
                    // Fail gracefully on broken syntax mappings inside local blocks
                }
            });

            this.evaluateFactor("Structured Data", "JSON-LD Presence", hasJsonLd ? "Present" : "Missing", "Scans page environment for application/ld+json configuration", hasJsonLd ? 4 : 0);
            this.evaluateFactor("Structured Data", "Valid Schema Type", validSchemaType ? "Validated" : "Missing Context", "Verifies object entities structure validation mappings", validSchemaType ? 4 : 0);
            this.evaluateFactor("Structured Data", "Organization Schema", hasOrgSchema ? "Found" : "Missing", "Brand identification semantic context check blocks", hasOrgSchema ? 4 : 0);
            this.evaluateFactor("Structured Data", "Breadcrumb Schema", hasBreadcrumb ? "Found" : "Missing", "Structural schema directory link tree layout mappings tracking", hasBreadcrumb ? 4 : 0);

            // -----------------------------------------------------------
            // CATEGORY D: Technical SEO Environment
            // -----------------------------------------------------------
            const isHttps = window.location.protocol === "https:";
            this.evaluateFactor("Technical SEO", "HTTPS", window.location.protocol, "Ensures asset transport layers run under active encrypted connections", isHttps ? 4 : 0);

            const canonicalMatchesCurrent = canonicalHref && Helper.normalizeUrl(canonicalHref) === Helper.normalizeUrl(window.location.href);
            this.evaluateFactor("Technical SEO", "Canonical Match", canonicalMatchesCurrent ? "Matched" : "Mismatch/Missing", "Validates canonical string directly routes onto matching execution files", canonicalMatchesCurrent ? 4 : 1);

            const hasMobileViewport = viewport.includes("width=device-width");
            this.evaluateFactor("Technical SEO", "Mobile Friendly", hasMobileViewport ? "Optimized" : "Unoptimized", "Verifies structure rendering instructions scale on client viewport width parameters", hasMobileViewport ? 4 : 0);

            const htmlLang = document.documentElement.getAttribute("lang");
            this.evaluateFactor("Technical SEO", "HTML lang Attribute", htmlLang || "Missing", "Ensures crawler parsers identify site default semantic linguistic values", htmlLang ? 4 : 0);

            // -----------------------------------------------------------
            // CATEGORY E: Content SEO Factors
            // -----------------------------------------------------------
            const h1Elements = Array.from(document.querySelectorAll("h1"));
            let h1Score = 0;
            if (h1Elements.length === 1) h1Score = 4;
            else if (h1Elements.length > 1) {
                h1Score = 1;
                this.logNegativeImpact("Duplicate H1", -3, `Multiple H1 nodes verified inside DOM structure tree (${h1Elements.length} instances counted).`);
            }
            this.evaluateFactor("Content SEO", "Single H1", `Count: ${h1Elements.length}`, "Validates execution metrics restrict page architecture onto one baseline theme topic container node", h1Score);

            // Heading Hierarchy Check Logic
            const headerTags = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6")).map(el => parseInt(el.tagName.substring(1)));
            let brokenHierarchy = false;
            for (let i = 0; i < headerTags.length - 1; i++) {
                if (headerTags[i + 1] - headerTags[i] > 1) {
                    brokenHierarchy = true;
                    break;
                }
            }
            this.evaluateFactor("Content SEO", "Heading Hierarchy", brokenHierarchy ? "Broken Structure Found" : "Sequential Order Confirmed", "Validates nesting steps skip logic layers gracefully", brokenHierarchy ? 1 : 4);

            // -----------------------------------------------------------
            // CATEGORY F: ANH Trust & Verification Pipeline Execution
            // -----------------------------------------------------------
            // 23. Scripto Validation
            const scriptoScript = document.querySelector("script.Scripto");
            let isScriptoValid = !!(scriptoScript && window.ANH_ID && window.ANH_META);
            if (!isScriptoValid) {
                this.logNegativeImpact("Missing Scripto", -10, "Script element with token class 'Scripto' missing inside page template architecture context.");
            }
            this.evaluateFactor("ANH Validation", "Scripto Validation", isScriptoValid ? "Active" : "Signature Error", "Verifies client identity authorization tracking scripts pass profile bounds checks", isScriptoValid ? 4 : 0);

            // 24 & 25. Alpha Vault Validation Interface Integration Tracking Block Strategy
            let isVaultMatched = false;
            if (isScriptoValid) {
                try {
                    let response = await fetch(CONFIG.vaultUrl);
                    if (response.ok) {
                        let vault = await response.json();
                        let entry = vault.entries ? vault.entries.find(e => e.urlId === window.ANH_ID) : null;
                        if (entry) {
                            isVaultMatched = (
                                Helper.normalizeUrl(window.ANH_META.url) === Helper.normalizeUrl(entry.url) &&
                                window.ANH_META.title === entry.title &&
                                window.ANH_META.description === entry.description &&
                                window.ANH_META.icon === entry.icon
                            );
                            if (!isVaultMatched) {
                                this.logNegativeImpact("Vault Validation Failure", -5, "Asset definition tracking data does not match registry fields stored inside the Alpha Vault.");
                            }
                        } else {
                            this.logNegativeImpact("Vault Validation Failure", -5, "Target matching urlId missing inside validation tracking entries registry storage blocks.");
                        }
                    } else {
                        this.logNegativeImpact("Server Error (500 equivalent)", -3, "The requested online Alpha Vault asset storage path returned an inaccessible transport response.");
                    }
                } catch {
                    this.logNegativeImpact("Broken Resource (404 equivalent)", -2, "Unable to reference or download active tracking files via standard fetch pipelines.");
                }
            }
            this.evaluateFactor("ANH Validation", "Alpha Vault Validation", isVaultMatched ? "Verified Sync" : "Validation Failed", "Verifies local signatures accurately match master registry storage payloads on runtime", isVaultMatched ? 4 : 0);

            // Local Document Asset Completeness Audits Tracking Context Bounds Rules
            const links = Array.from(document.querySelectorAll("link[rel*='icon']"));
            if (links.length === 0) {
                this.logNegativeImpact("Missing Favicon", -2, "No icon assets definitions found inside local DOM setup structure definitions.");
            }
            const manifest = document.querySelector("link[rel='manifest']");
            if (!manifest) {
                this.logNegativeImpact("Missing Manifest", -2, "No deployment manifest data sheet configured inside template head container parameters.");
            }

            // Normalization calculations bounds checks execution tracking sequence loops
            if (this.score > CONFIG.maxScore) this.score = CONFIG.maxScore;
            if (this.score < 0) this.score = 0;

            // Commit final records to localized browser structures safely
            AuditStorage.setCache(this.score, this.report, this.negativeLogs);
            return { score: this.score, report: this.report, negativeLogs: this.negativeLogs };
        }
    };

    // ==================================================================
    // INTERACTIVE PANEL PRESENTATION INTERFACE ENGINE
    // ==================================================================
    const AuditUserInterface = {
        panelElement: null,

        renderPanel(data) {
            if (this.panelElement) this.panelElement.remove();

            this.panelElement = document.createElement('div');
            this.panelElement.id = "anh-seo-auditor-panel";
            this.panelElement.style = `
                position: fixed; top: 20px; right: 20px; width: 420px; max-height: calc(100vh - 40px);
                background: #0f172a; color: #f8fafc; border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                z-index: 100000; display: flex; flex-direction: column; border: 1px solid #334155;
                animation: anhPanelSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); box-sizing: border-box;
            `;

            // Score Color Coding Scheme
            let scoreColor = "#ef4444";
            if (data.score >= 80) scoreColor = "#10b981";
            else if (data.score >= 50) scoreColor = "#f59e0b";

            // Render Report Factor Lists
            let factorRows = data.report.map(item => `
                <div style="padding: 10px 0; border-bottom: 1px solid #1e293b; display: flex; justify-content: space-between; align-items: flex-start; font-size: 13px;">
                    <div>
                        <div style="font-weight: 600; color: #e2e8f0;">${item.name} <span style="font-size:11px; color:#64748b; font-weight:normal;">(${item.category})</span></div>
                        <div style="font-size: 12px; color: #94a3b8; margin-top: 2px; word-break: break-all;">Value: ${item.value}</div>
                    </div>
                    <div style="font-weight: 700; color: ${item.score === 4 ? '#10b981' : '#94a3b8'}; padding-left: 10px;">${item.score}/4</div>
                </div>
            `).join('');

            // Render Negative Impact Penalty List Content
            let negativeSection = "";
            if (data.negativeLogs && data.negativeLogs.length > 0) {
                let penaltyRows = data.negativeLogs.map(item => `
                    <div style="padding: 8px; background: rgba(239, 68, 68, 0.1); border-left: 3px solid #ef4444; border-radius: 4px; margin-bottom: 8px; font-size: 12px;">
                        <div style="font-weight: 700; color: #fca5a5; display: flex; justify-content: space-between;">
                            <span>${item.name}</span> <span style="color:#f87171;">${item.penalty} Marks</span>
                        </div>
                        <div style="color: #cbd5e1; margin-top: 2px;">${item.message}</div>
                    </div>
                `).join('');

                negativeSection = `
                    <div style="margin-top: 16px; padding-top: 16px; border-top: 2px dashed #334155;">
                        <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #fca5a5; font-weight: 700;">Critical Penalties Incurred</h4>
                        ${penaltyRows}
                    </div>
                `;
            }

            this.panelElement.innerHTML = `
                <div style="padding: 16px; background: #1e293b; border-top-left-radius: 16px; border-top-right-radius: 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div style="width: 12px; height: 12px; border-radius: 50%; background: ${scoreColor};"></div>
                        <h3 style="margin: 0; font-size: 15px; font-weight: 700; color: #f1f5f9; letter-spacing: 0.5px;">ANH SEO Runtime Auditor</h3>
                    </div>
                    <button id="anh-seo-panel-close" style="background: none; border: none; color: #94a3b8; font-size: 20px; cursor: pointer; line-height: 1; padding: 0 4px;">&times;</button>
                </div>
                
                <div style="padding: 20px; overflow-y: auto; flex: 1; box-sizing: border-box;">
                    <div style="background: #1e293b; padding: 16px; border-radius: 12px; text-align: center; border: 1px solid #334155;">
                        <div style="font-size: 42px; font-weight: 800; color: ${scoreColor}; line-height: 1;">${data.score}</div>
                        <div style="font-size: 12px; font-weight: 600; color: #94a3b8; text-transform: uppercase; tracking-spacing: 1px; margin-top: 6px;">Global Quality Optimization Score</div>
                    </div>

                    ${negativeSection}

                    <div style="margin-top: 20px;">
                        <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #38bdf8; font-weight: 700;">Optimisation Factors Analysis Matrix</h4>
                        <div style="max-height: 300px; overflow-y: auto; padding-right: 4px;">
                            ${factorRows}
                        </div>
                    </div>
                </div>

                <div style="padding: 12px 16px; background: #1e293b; border-bottom-left-radius: 16px; border-bottom-right-radius: 16px; border-top: 1px solid #334155; font-size: 11px; color: #64748b; text-align: center;">
                    Akshat Network Hub • Alpha Validation Protocol Framework v1.4
                </div>

                <style>
                    @keyframes anhPanelSlideIn {
                        from { opacity: 0; transform: translateY(20px) scale(0.95); }
                        to { opacity: 1; transform: translateY(0) scale(1); }
                    }
                    #anh-seo-auditor-panel div::-webkit-scrollbar { width: 6px; }
                    #anh-seo-auditor-panel div::-webkit-scrollbar-track { background: #0f172a; }
                    #anh-seo-auditor-panel div::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
                </style>
            `;

            document.body.appendChild(this.panelElement);

            // Bind Event Listeners
            document.getElementById('anh-seo-panel-close').onclick = () => {
                this.panelElement.remove();
            };
        }
    };

    // ==================================================================
    // GLOBAL INSTRUMENTATION COORDINATOR & INITIALIZATION ENTRY
    // ==================================================================
    const InitializationCoordinator = {
        init() {
            // Setup Global Event Bindings (Manual Keyboard Trigger Logic Context: Shift + R)
            window.addEventListener('keydown', (e) => {
                if (e.shiftKey && (e.key === 'R' || e.key === 'r')) {
                    e.preventDefault();
                    SeoAuditorEngine.executePipeline().then(data => {
                        AuditUserInterface.renderPanel(data);
                    }).catch(err => {
                        console.error("[SEO Engine Critical Failure Event Exception Boundary]", err);
                    });
                }
            });

            // Evaluation Loop Engine Context Controls
            if (AuditStorage.shouldRunAutoAudit()) {
                window.addEventListener('load', () => {
                    // Inject soft buffer interval gap execution loop prior execution boundaries parameters allocation checks
                    setTimeout(() => {
                        SeoAuditorEngine.executePipeline().catch(err => {
                            console.error("[SEO Engine Automated Pipeline Crash Exception]", err);
                        });
                    }, 2000);
                });
            }
        }
    };

    // Instantiate Operational Framework Interface Logic Blocks
    InitializationCoordinator.init();
})();
