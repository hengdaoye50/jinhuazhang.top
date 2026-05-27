/**
 * jinhuazhang.top — Page View Counter (frontend)
 * Fetches view counts from Cloudflare Worker and renders them on cards.
 */
(function () {
  "use strict";

  var API = "https://jinhuazhang-pageviews.zjh2225491299.workers.dev/";

  // Whether we're on a single article page (increment count)
  var isArticle = !!document.querySelector("article");
  var slug = window.location.pathname;

  /** Fetch view count for a slug */
  function getViews(slug, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", API + "?slug=" + encodeURIComponent(slug));
    xhr.timeout = 3000;
    xhr.onload = function () {
      if (xhr.status === 200) callback(parseInt(xhr.responseText) || 0);
    };
    xhr.onerror = xhr.ontimeout = function () {};
    xhr.send();
  }

  /** Increment view count (article pages only) */
  function postViews(slug) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", API + "?slug=" + encodeURIComponent(slug));
    xhr.timeout = 3000;
    xhr.send();
  }

  /** Create view count element */
  function createViewsEl(count) {
    var el = document.createElement("span");
    el.className = "pv-count";
    el.innerHTML =
      '<svg class="pv-icon" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
      '<circle cx="8" cy="8" r="2"/><path d="M1 8s2.5-6 7-6 7 6 7 6-2.5 6-7 6-7-6-7-6z"/></svg>' +
      '<span class="pv-num">' +
      (count || 0) +
      "</span>";
    return el;
  }

  // ── Article page: increment view ──
  if (isArticle && slug) {
    postViews(slug);
  }

  // ── List pages: fetch & render view counts ──
  var cards = document.querySelectorAll(".blog-card, .portfolio-card");
  if (cards.length) {
    cards.forEach(function (card) {
      var link = card.querySelector("h2 a, .blog-card-overlay, .portfolio-card-overlay");
      if (!link) return;
      var href = link.getAttribute("href");
      if (!href) return;

      // Create placeholder
      var placeholder = document.createElement("span");
      placeholder.className = "pv-count pv-loading";
      placeholder.textContent = "…";

      // Insert into card meta area
      var meta;
      if (card.classList.contains("blog-card")) {
        meta = card.querySelector(".blog-card-meta");
      } else {
        meta = card.querySelector(".portfolio-card-header");
      }
      if (meta) {
        meta.appendChild(placeholder);
      }

      // Fetch real count
      getViews(href, function (count) {
        var parent = placeholder.parentNode;
        if (parent) {
          var el = createViewsEl(count);
          parent.replaceChild(el, placeholder);
        }
      });
    });
  }
})();
