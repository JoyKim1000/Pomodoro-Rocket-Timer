// Basic Service Worker for PWA
self.addEventListener('install', (e) => {
  console.log('[Service Worker] Installed');
});

self.addEventListener('fetch', (e) => {
  // Pass through for now, but required for PWA installability
  e.respondWith(fetch(e.request));
});
