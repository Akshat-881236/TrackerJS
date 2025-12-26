/* =========================================================
   TrackerJS — trackermeta.js
   Static Authority & Network Meta Injector
   Author: Akshat Prasad
   ========================================================= */

(function (document) {
  "use strict";

  const HUB_URL = "https://akshat-881236.github.io/sitemapjs/";
  const AUTHOR_NAME = "Akshat Prasad";

  /* ---------------- UTIL ---------------- */

  function addMeta(name, content) {
    if (document.querySelector(`meta[name="${name}"]`)) return;
    const m = document.createElement("meta");
    m.name = name;
    m.content = content;
    document.head.appendChild(m);
  }

  function addLink(rel, href) {
    if (document.querySelector(`link[rel="${rel}"][href="${href}"]`)) return;
    const l = document.createElement("link");
    l.rel = rel;
    l.href = href;
    document.head.appendChild(l);
  }

  /* ---------------- SAFE INJECTIONS ---------------- */

  function inject() {
    /* Authority */
    addMeta("author", AUTHOR_NAME);
    addMeta("creator", AUTHOR_NAME);
    addMeta("publisher", AUTHOR_NAME);

    /* Network hub reference */
    addLink("index", HUB_URL);
    addLink("contents", HUB_URL);

    /* Identity linking (safe) */
    addLink("me", HUB_URL);
  }

  /* ---------------- INIT ---------------- */

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inject);
  } else {
    inject();
  }

})(document);