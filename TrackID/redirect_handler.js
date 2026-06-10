/**
 * redirect_handler.js
 * Independent URL Rewriter
 * Load AFTER all other scripts
 */

(function () {
    "use strict";

    const TARGET =
        "https://akshat-881236.github.io/AkshatNetworkHub/";

    function shouldRedirect(url) {
        try {
            const u = new URL(url, location.href);

            return (
                (u.hostname === "akshat-881236.github.io" &&
                    (u.pathname === "/" || u.pathname === "")) ||

                (u.hostname === "akshat-145609.github.io" &&
                    (u.pathname === "/" || u.pathname === ""))
            );
        } catch {
            return false;
        }
    }

    function rewriteAnchor(anchor) {
        if (!anchor || !anchor.href) return;

        if (shouldRedirect(anchor.href)) {
            anchor.href = TARGET;
            anchor.setAttribute(
                "data-anh-redirected",
                "true"
            );
        }
    }

    function scanDocument() {
        document
            .querySelectorAll('a[href]')
            .forEach(rewriteAnchor);
    }

    // Existing links
    scanDocument();

    // Future links
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {

            mutation.addedNodes.forEach(node => {

                if (node.nodeType !== 1) return;

                if (
                    node.tagName &&
                    node.tagName.toLowerCase() === "a"
                ) {
                    rewriteAnchor(node);
                }

                if (node.querySelectorAll) {
                    node
                        .querySelectorAll('a[href]')
                        .forEach(rewriteAnchor);
                }
            });
        }
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });

})();
