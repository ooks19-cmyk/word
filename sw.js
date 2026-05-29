const CACHE_NAME = 'fc-star-v1';
const ASSETS = [
  './index.html',
  './style.css',
  './app.js',
  './db.js',
  './sound.js',
  './quiz.js',
  './manifest.json',
  './player/player_data.js',
  './player/quiz_data.js',
  './player/other_teams_data.js',
  './img/mark_jb.svg'
];

// Install Service Worker and cache essential assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching all essential game assets');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Service Worker and clean up old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch intercepted requests from cache or network
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached asset, but fetch new one in background to update cache (stale-while-revalidate)
        fetch(e.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, networkResponse);
            });
          }
        }).catch(() => { /* Offline fallback */ });
        
        return cachedResponse;
      }
      return fetch(e.request);
    })
  );
});
