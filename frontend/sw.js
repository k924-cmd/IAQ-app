const CACHE_NAME = 'breath-forest-ui-v2';
const CORE_ASSETS = [
  './', './index.html', './styles.css', './manifest.webmanifest', './src/main.js',
  './src/app/state.js', './src/components/icons.js',
  './src/pages/home.js', './src/pages/devices.js', './src/pages/chat.js', './src/pages/profile.js',
  './src/services/conversation-service.js', './src/services/device-service.js', './src/services/environment-service.js',
  './src/mocks/conversation.js', './src/mocks/devices.js', './src/mocks/environment.js',
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
