/**
 * sw.js — minimal offline cache for PDF Ultra Pro's own static shell.
 * Deliberately does NOT cache third-party CDN library scripts (pdf-lib,
 * pdf.js, etc.) so those always get normal browser HTTP caching/updates,
 * and never intercepts anything that isn't a same-origin GET request.
 */
"use strict";

const CACHE_NAME = "pup-shell-v1";
const CORE_ASSETS = [
  "index.html",
  "all-tools.html",
  "css/style.css",
  "js/theme.js",
  "js/partials.js",
  "js/main.js",
  "js/pdf-engine.js",
  "js/tools.js",
  "icons/favicon.svg",
  "manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // never touch third-party CDN requests

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
