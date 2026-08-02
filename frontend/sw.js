const CACHE_NAME = 'breath-forest-ui-v4';
const CORE_ASSETS = [
  './', './index.html', './styles.css?v=20260803-4', './manifest.webmanifest', './src/main.js?v=20260803-4',
  './src/app/state.js?v=20260803-4', './src/components/icons.js?v=20260803-4', './src/presentation.js?v=20260803-4', './src/utils/html.js?v=20260803-4',
  './src/pages/home.js?v=20260803-4', './src/pages/devices.js?v=20260803-4', './src/pages/chat.js?v=20260803-4', './src/pages/profile.js?v=20260803-4',
  './src/services/conversation-service.js?v=20260803-4', './src/services/device-service.js?v=20260803-4', './src/services/environment-service.js?v=20260803-4',
  './src/mocks/conversation.js?v=20260803-4', './src/mocks/devices.js?v=20260803-4', './src/mocks/environment.js?v=20260803-4',
  './icons/luna-192.png', './icons/luna-512.png', './icons/luna-apple.png',
  './assets/breath-forest-living-room.webp', './assets/luna-home-scene.webp', './assets/luna-hero.webp', './assets/luna-overlay-tight.webp',
  './assets/device-fan.webp', './assets/device-fresh.webp', './assets/device-hood.webp',
  './assets/device-humidifier.webp', './assets/device-purifier.webp', './assets/device-window.webp'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(fetch(event.request).then(response => {
    const copy = response.clone();
    caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html'))));
});
