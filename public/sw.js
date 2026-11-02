// Minimal Service Worker to satisfy PWA & browser PaymentHandler manifest validations
self.addEventListener('install', function() {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
});
