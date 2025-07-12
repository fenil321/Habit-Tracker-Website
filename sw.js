// Minimal Service Worker for Habit Tracker
self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  // Clean up old caches if needed
});

self.addEventListener('fetch', event => {
  // Default: just pass through
}); 