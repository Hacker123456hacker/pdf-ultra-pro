/**
 * sw.js — lightweight offline cache for PDF Ultra Pro.
 * HTML navigations prefer the network so updated pages and navigation links
 * are not trapped in a stale/broken cache entry.
 */
"use strict";

const CACHE_NAME = "pup-shell-v2";
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
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Navigation requests must use the live site first. This prevents a stale
  // cached all-tools.html (or another HTML page) from causing broken links.
  if (req.mode === "navigate" || req.destination === "document") {
    event.respondWith(
      fetch(req).then((response) => {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return response;
      }).catch(() => caches.match(req).then((cached) => cached || caches.match("index.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req).then((response) => {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return response;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
