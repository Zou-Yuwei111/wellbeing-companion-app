const CACHE = 'wellbeing-v2';
const APP_FILES = [
  './', './index.html', './styles.css?v=28', './app.js?v=24', './manifest.webmanifest',
  './assets/ragdoll-cat.png', './assets/shiba-dog.png', './assets/grey-rabbit.png',
  './assets/app-icon-192.png', './assets/app-icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request).then(response => response || caches.match('./index.html'))));
});
