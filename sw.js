const CACHE_NAME = 'fc-star-v172';
const ASSETS = [
  './index.html',
  './style.css',
  './css/global.css',
  './css/card.css',
  './css/pack.css',
  './css/squad.css',
  './css/quiz.css',
  './css/match.css',
  './js/state.js',
  './js/utils.js',
  './js/card.js',
  './js/pack.js',
  './js/deck.js',
  './js/squad.js',
  './js/match_algorithm.js',
  './js/league.js',
  './js/cup.js',
  './js/acl.js',
  './js/friendly.js',
  './js/update_data.js',
  './js/auth.js',
  './app.js',
  './db.js',
  './sound.js',
  './quiz.js',
  './manifest.json',
  './player_data.js',
  './quiz_data.js',
  './other_teams_data.js',
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

// Fetch intercepted requests using a Network-First strategy
self.addEventListener('fetch', (e) => {
  // Only handle GET requests and local origin assets
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  e.respondWith(
    fetch(e.request)
      .then((networkResponse) => {
        if (networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(e.request);
      })
  );
});
